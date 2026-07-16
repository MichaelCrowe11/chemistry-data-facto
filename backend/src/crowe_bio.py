"""Shared bio tool pack: NVIDIA BioNeMo NIMs for a computational R&D loop.

Adapted from service/crowe_bio_reference.py for the hosted Crowe Bio SaaS API.
The public surface is unchanged and import-safe: importing this module never
calls NVIDIA and never requires a key. `bio_execute(name, args) -> dict` and the
`BIO_TOOLS` schema list are the contract the service wraps verbatim.

Only two things differ from the reference:
  - the artifact output directory is env-configurable (CROWE_BIO_STRUCTURE_DIR)
    so a container can write to a writable volume instead of ~/.crowe-workbench,
  - `BIO_TOOL_NAMES` is exported so the API layer can validate {name} cheaply.

Honesty rule (hard): every result is a computational prediction or generative
design, never wet-lab validated. Confidence is reported honestly (pLDDT above 90
very high, 70 to 90 confident, below 70 low). Do not claim experimental proof.

Registered in BOTH Crowe Science and Crowe Logic Mycology. The loop:

  read genome   dna_generate       Evo 2 (arc/evo2-40b)
  design        design_backbone    RFdiffusion (ipd/rfdiffusion)
                design_sequence    ProteinMPNN (ipd/proteinmpnn)
  fold          fold_structure     OpenFold3 (openfold/openfold3)
  bind / score  predict_binding    Boltz-2 (mit/boltz2)  -> affinity
                dock_ligand        DiffDock (mit/diffdock) -> poses
  chemistry     generate_molecules MolMIM (nvidia/molmim)

All hosted at https://health.api.nvidia.com/v1/biology/... with a Bearer nvapi-
key. The key needs the "Public API Endpoints" permission on build.nvidia.com or
calls 403. Endpoints/schemas verified against docs.nvidia.com/nim/bionemo (2026-07).

Chaining: structures (PDB/CIF) are saved to disk and referenced by a short
artifact id (e.g. "art3"), so multi-step designs never dump full structures into
the model's context. Any structure input accepts an artifact id, a file path, or
raw PDB/CIF text. Response parsing is defensive and surfaces raw keys when a field
is not found, so a live smoke test can confirm exact shapes.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx

_BASE = os.getenv("CROWE_NVIDIA_BIO_BASE", "https://health.api.nvidia.com/v1/biology")
URLS = {
    "openfold3": os.getenv("CROWE_OPENFOLD3_URL", f"{_BASE}/openfold/openfold3/predict"),
    "evo2": os.getenv("CROWE_EVO2_URL", f"{_BASE}/arc/evo2-40b/generate"),
    "boltz2": os.getenv("CROWE_BOLTZ2_URL", f"{_BASE}/mit/boltz2/predict"),
    "rfdiffusion": os.getenv("CROWE_RFDIFFUSION_URL", f"{_BASE}/ipd/rfdiffusion/generate"),
    "proteinmpnn": os.getenv("CROWE_PROTEINMPNN_URL", f"{_BASE}/ipd/proteinmpnn/predict"),
    "diffdock": os.getenv("CROWE_DIFFDOCK_URL", f"{_BASE}/mit/diffdock/generate"),
    "molmim": os.getenv("CROWE_MOLMIM_URL", f"{_BASE}/nvidia/molmim/generate"),
}
STATUS_URL = os.getenv("CROWE_NVCF_STATUS_URL", "https://health.api.nvidia.com/v1/status")

_AA = set("ACDEFGHIKLMNPQRSTVWYX")
_DNA = set("ACGTN")
_RNA = set("ACGUN")
_IDS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _out_dir() -> Path:
    """Writable directory for saved structures; env-overridable for containers."""
    override = os.getenv("CROWE_BIO_STRUCTURE_DIR")
    if override:
        return Path(override).expanduser()
    return Path.home() / ".crowe-workbench" / "structures"


_ART: dict[str, str] = {}
_ART_N = [0]


def _api_key() -> str | None:
    v = os.getenv("NVIDIA_API_KEY") or os.getenv("NGC_API_KEY")
    if v:
        return v.strip()
    for p in (Path.home() / ".config" / "crowe" / "secrets.env", Path.home() / ".env.secrets"):
        try:
            for line in p.read_text().splitlines():
                s = line.strip()
                if s.startswith("export "):
                    s = s[7:]
                for name in ("NVIDIA_API_KEY", "NGC_API_KEY"):
                    if s.startswith(name + "="):
                        return s.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception:
            pass
    return None


def _nvcf_post(url: str, body: dict, key: str, poll_s: int = 5, tries: int = 72) -> dict:
    """POST to a hosted NIM, transparently handling the NVCF 202 + poll pattern."""
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json", "Accept": "application/json"}
    with httpx.Client(timeout=300) as client:
        r = client.post(url, headers=headers, json=body)
        if r.status_code == 202:
            reqid = r.headers.get("nvcf-reqid") or r.headers.get("NVCF-REQID")
            if not reqid:
                return {"_error": "202 with no nvcf-reqid header; cannot poll"}
            for _ in range(tries):
                time.sleep(poll_s)
                s = client.get(f"{STATUS_URL}/{reqid}", headers=headers)
                if s.status_code == 200:
                    r = s
                    break
                if s.status_code != 202:
                    return {"_error": f"poll failed {s.status_code}: {s.text[:200]}", "request_id": reqid}
            else:
                return {"_pending": True, "request_id": reqid}
        if r.status_code == 403:
            return {"_error": "403: enable 'Public API Endpoints' permission on the nvapi- key."}
        if r.status_code >= 400:
            return {"_error": f"HTTP {r.status_code}: {r.text[:300]}"}
        try:
            return r.json()
        except Exception as e:
            return {"_error": f"non-JSON response: {type(e).__name__}: {e}"}


def _put_artifact(text: str, ext: str, name: str) -> tuple[str, str]:
    _ART_N[0] += 1
    aid = f"art{_ART_N[0]}"
    out_dir = _out_dir()
    out_dir.mkdir(parents=True, exist_ok=True)
    safe = "".join(c for c in (name or "artifact") if c.isalnum() or c in "-_") or "artifact"
    path = out_dir / f"{safe}_{aid}.{ext}"
    try:
        path.write_text(text)
    except Exception:
        pass
    _ART[aid] = str(path)
    return aid, str(path)


def _get_structure(ref: str | None) -> str | None:
    """Resolve a structure input: artifact id, file path, or raw PDB/CIF text."""
    if not ref or not isinstance(ref, str):
        return None
    if ref in _ART:
        try:
            return Path(_ART[ref]).read_text()
        except Exception:
            return None
    if ("/" in ref or ref.endswith((".pdb", ".cif"))) and len(ref) < 500:
        p = Path(ref).expanduser()
        if p.exists():
            try:
                return p.read_text()
            except Exception:
                return None
    if "ATOM " in ref or "HETATM" in ref or "data_" in ref or "_atom_site" in ref:
        return ref
    return None


BIO_SYSTEM_NOTE = (
    "You have a computational structural-biology and genomics toolchain backed by NVIDIA BioNeMo "
    "models: dna_generate (Evo 2 genome model), design_backbone (RFdiffusion, invents a novel "
    "protein backbone), design_sequence (ProteinMPNN, designs an amino-acid sequence for a "
    "backbone), fold_structure (OpenFold3, folds protein/DNA/RNA/ligand complexes), predict_binding "
    "(Boltz-2, predicts protein-ligand binding affinity), dock_ligand (DiffDock, predicts binding "
    "poses), and generate_molecules (MolMIM, designs novel small molecules). These chain: a "
    "structure-producing tool returns a short artifact id (e.g. 'art3') that you pass as "
    "input_structure to the next tool, so a full design-build-test run is possible. Report "
    "confidence and affinity honestly (pLDDT above 90 very high, 70 to 90 confident, below 70 low). "
    "Everything here is a computational prediction or generative design, never an experimentally "
    "validated result; say so and never claim wet-lab confirmation."
)

BIO_TOOLS = [
    {"type": "function", "function": {
        "name": "dna_generate",
        "description": "Generate or extend a DNA sequence with NVIDIA Evo 2 (40B genomic foundation model). "
        "Give a starting DNA sequence; it predicts the continuation. Optionally condition on an organism lineage.",
        "parameters": {"type": "object", "properties": {
            "sequence": {"type": "string", "description": "Starting DNA sequence (A/C/G/T), uppercase."},
            "num_tokens": {"type": "integer", "description": "Bases to generate, default 100 (cap 1000)."},
            "temperature": {"type": "number", "description": "Sampling randomness, default 0.7."},
            "top_k": {"type": "integer", "description": "Top-k sampling, default 3."},
            "taxonomy": {"type": "string", "description": "Optional lineage prompt, e.g. 'D__Eukarya;P__Basidiomycota;...;S__ostreatus'."},
        }, "required": ["sequence"]}}},
    {"type": "function", "function": {
        "name": "design_backbone",
        "description": "Invent a novel protein backbone with RFdiffusion. 'contigs' is required and specifies "
        "the design, e.g. '100-100' for a de novo 100-residue protein, or 'A10-100/0 50-150' to build a "
        "50-150 residue binder against chain A of a target structure. Returns a structure artifact id.",
        "parameters": {"type": "object", "properties": {
            "contigs": {"type": "string", "description": "RFdiffusion contig string defining what to generate."},
            "input_structure": {"type": "string", "description": "Optional target protein: an artifact id, file path, or raw PDB text."},
            "hotspot_res": {"type": "array", "items": {"type": "string"}, "description": "Optional target residues the binder must contact, e.g. ['A50','A51']."},
            "diffusion_steps": {"type": "integer", "description": "Denoising steps, default 15."},
            "name": {"type": "string", "description": "Short id for the saved backbone."},
        }, "required": ["contigs"]}}},
    {"type": "function", "function": {
        "name": "design_sequence",
        "description": "Design amino-acid sequences that fold to a given protein backbone with ProteinMPNN "
        "(inverse folding). Pass the backbone as input_structure (artifact id, path, or PDB text). Returns designed sequences.",
        "parameters": {"type": "object", "properties": {
            "input_structure": {"type": "string", "description": "Protein backbone: artifact id, file path, or raw PDB text."},
            "sampling_temp": {"type": "number", "description": "Diversity 0.1 to 0.3, default 0.1."},
            "num_sequences": {"type": "integer", "description": "How many sequences to return, default 1 (cap 8)."},
        }, "required": ["input_structure"]}}},
    {"type": "function", "function": {
        "name": "fold_structure",
        "description": "Predict the all-atom 3D structure of a biomolecular complex with OpenFold3 (AlphaFold3 parity). "
        "Give protein chains and optionally DNA, RNA, and ligand SMILES. Returns a structure artifact id and confidence.",
        "parameters": {"type": "object", "properties": {
            "protein_sequences": {"type": "array", "items": {"type": "string"}, "description": "Amino acid sequences, one per protein chain."},
            "dna_sequences": {"type": "array", "items": {"type": "string"}, "description": "Optional DNA sequences."},
            "rna_sequences": {"type": "array", "items": {"type": "string"}, "description": "Optional RNA sequences."},
            "ligand_smiles": {"type": "array", "items": {"type": "string"}, "description": "Optional ligand SMILES."},
            "name": {"type": "string", "description": "Short id for the saved structure."},
            "output_format": {"type": "string", "enum": ["cif", "pdb"], "description": "Default pdb (chainable)."},
        }, "required": ["protein_sequences"]}}},
    {"type": "function", "function": {
        "name": "predict_binding",
        "description": "Predict protein-ligand binding affinity with Boltz-2 (near free-energy-perturbation accuracy, "
        "much faster). Give the protein sequence(s) and a ligand SMILES. Returns predicted pIC50, binding probability, and a structure artifact.",
        "parameters": {"type": "object", "properties": {
            "protein_sequences": {"type": "array", "items": {"type": "string"}, "description": "Receptor amino acid sequence(s)."},
            "ligand_smiles": {"type": "string", "description": "Ligand as a SMILES string."},
            "name": {"type": "string", "description": "Short id for the saved complex."},
        }, "required": ["protein_sequences", "ligand_smiles"]}}},
    {"type": "function", "function": {
        "name": "dock_ligand",
        "description": "Predict how a small molecule docks into a protein with DiffDock. Give the protein as input_structure "
        "(artifact id, path, or PDB text) and the ligand SMILES. Returns ranked pose confidences and a saved poses file.",
        "parameters": {"type": "object", "properties": {
            "input_structure": {"type": "string", "description": "Protein receptor: artifact id, file path, or raw PDB text."},
            "ligand_smiles": {"type": "string", "description": "Ligand as a SMILES string."},
            "num_poses": {"type": "integer", "description": "Poses to generate, default 10."},
            "name": {"type": "string", "description": "Short id for the saved poses."},
        }, "required": ["input_structure", "ligand_smiles"]}}},
    {"type": "function", "function": {
        "name": "generate_molecules",
        "description": "Design novel small molecules around a seed with NVIDIA MolMIM, optimizing a property (e.g. QED, "
        "plogP) while staying similar to the seed. Returns generated SMILES.",
        "parameters": {"type": "object", "properties": {
            "seed_smiles": {"type": "string", "description": "Seed molecule as a SMILES string."},
            "num_molecules": {"type": "integer", "description": "Molecules to generate, default 10 (cap 50)."},
            "property_name": {"type": "string", "description": "Property to optimize, default 'QED'."},
            "minimize": {"type": "boolean", "description": "Minimize the property instead of maximizing, default false."},
            "min_similarity": {"type": "number", "description": "Minimum Tanimoto similarity to the seed, default 0.3."},
        }, "required": ["seed_smiles"]}}},
]


def _need_key() -> str | None:
    return None if _api_key() else "NVIDIA_API_KEY not set. Store it in ~/.config/crowe/secrets.env or ~/.env.secrets."


def _clean(seq: str) -> str:
    return "".join((seq or "").split()).upper()


# ---- Evo 2 -----------------------------------------------------------------
def _dna_generate(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    seq = _clean(args.get("sequence"))
    if not seq:
        return {"error": "no DNA sequence provided"}
    bad = sorted(set(seq) - _DNA)
    if bad:
        return {"error": f"DNA has non-nucleotide characters: {''.join(bad)}"}
    n = max(1, min(1000, int(args.get("num_tokens") or 100)))
    tax = (args.get("taxonomy") or "").strip().strip("|")
    prompt = f"|{tax}|{seq}" if tax else seq
    body = {"sequence": prompt, "num_tokens": n, "temperature": float(args.get("temperature") or 0.7),
            "top_k": int(args.get("top_k") or 3)}
    data = _nvcf_post(URLS["evo2"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"]}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    gen = data.get("sequence") or data.get("output") or data.get("generated_sequence")
    if not isinstance(gen, str):
        return {"model": "Evo 2 40B", "response_keys": sorted(data.keys())[:20]}
    new = gen[len(prompt):] if gen.startswith(prompt) else (gen[len(seq):] if gen.startswith(seq) else gen)
    return {"model": "Evo 2 40B (NVIDIA)", "generated_dna": new[:2000], "generated_len": len(new),
            "elapsed_ms": data.get("elapsed_ms"), "note": "Generative genomic design, not observed."}


# ---- RFdiffusion -----------------------------------------------------------
def _design_backbone(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    contigs = (args.get("contigs") or "").strip()
    if not contigs:
        return {"error": "contigs is required (e.g. '100-100' de novo, or 'A10-100/0 50-150' for a binder)"}
    body: dict = {"contigs": contigs, "diffusion_steps": int(args.get("diffusion_steps") or 15)}
    tgt = _get_structure(args.get("input_structure"))
    if tgt:
        body["input_pdb"] = tgt
    if args.get("hotspot_res"):
        body["hotspot_res"] = list(args["hotspot_res"])
    data = _nvcf_post(URLS["rfdiffusion"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"], **({"request_id": data["request_id"]} if data.get("request_id") else {})}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    pdb = data.get("output_pdb") or data.get("pdb") or data.get("output")
    if not isinstance(pdb, str) or "ATOM" not in pdb:
        return {"model": "RFdiffusion", "structure_not_parsed": True, "response_keys": sorted(data.keys())[:20]}
    aid, path = _put_artifact(pdb, "pdb", args.get("name") or "backbone")
    n_res = pdb.count("\nATOM") // 1 if "CA" not in pdb else pdb.count(" CA ")
    return {"model": "RFdiffusion (NVIDIA)", "artifact": aid, "saved_structure": path,
            "approx_residues": n_res or None,
            "next": "Pass this artifact to design_sequence (ProteinMPNN) to get an amino-acid sequence.",
            "note": "De novo backbone, computational design only."}


# ---- ProteinMPNN -----------------------------------------------------------
def _parse_fasta(text: str) -> list[str]:
    seqs, cur = [], []
    for line in text.splitlines():
        if line.startswith(">"):
            if cur:
                seqs.append("".join(cur))
                cur = []
        elif line.strip():
            cur.append(line.strip())
    if cur:
        seqs.append("".join(cur))
    return seqs


def _design_sequence(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    pdb = _get_structure(args.get("input_structure"))
    if not pdb:
        return {"error": "input_structure not resolved (give an artifact id, file path, or PDB text)"}
    temp = float(args.get("sampling_temp") or 0.1)
    body = {"input_pdb": pdb, "ca_only": False, "use_soluble_model": False, "sampling_temp": [temp]}
    data = _nvcf_post(URLS["proteinmpnn"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"]}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    raw = data.get("mfasta") or data.get("output") or data.get("sequences") or data.get("fasta")
    seqs = []
    if isinstance(raw, str):
        seqs = _parse_fasta(raw)
    elif isinstance(raw, list):
        seqs = [s for s in raw if isinstance(s, str)]
    if not seqs:
        return {"model": "ProteinMPNN", "response_keys": sorted(data.keys())[:20]}
    cap = max(1, min(8, int(args.get("num_sequences") or 1)))
    # First FASTA entry is usually the native/input sequence; keep the designed ones.
    designed = seqs[1:] if len(seqs) > 1 else seqs
    return {"model": "ProteinMPNN (NVIDIA)", "designed_sequences": designed[:cap],
            "count": len(designed), "note": "Designed sequences, not experimentally validated."}


# ---- OpenFold3 -------------------------------------------------------------
def _fold_structure(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    molecules, idx = [], 0
    for seqs, mtype, alpha in ((args.get("protein_sequences"), "protein", _AA),
                               (args.get("dna_sequences"), "dna", _DNA),
                               (args.get("rna_sequences"), "rna", _RNA)):
        for raw in (seqs or []):
            s = _clean(raw)
            if not s:
                continue
            bad = sorted(set(s) - alpha)
            if bad:
                return {"error": f"{mtype} sequence has invalid characters: {''.join(bad)}"}
            if len(s) > 4096:
                return {"error": f"{mtype} sequence too long ({len(s)}); max 4096"}
            molecules.append({"type": mtype, "id": _IDS[idx % len(_IDS)], "sequence": s})
            idx += 1
    for smi in (args.get("ligand_smiles") or []):
        if smi and smi.strip():
            molecules.append({"type": "ligand", "id": _IDS[idx % len(_IDS)], "smiles": smi.strip()})
            idx += 1
    if not molecules:
        return {"error": "no molecules provided"}
    fmt = (args.get("output_format") or "pdb").lower()
    body = {"inputs": [{"molecules": molecules, "diffusion_samples": 1, "output_format": fmt}]}
    data = _nvcf_post(URLS["openfold3"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"], **({"request_id": data["request_id"]} if data.get("request_id") else {})}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    struct, conf = None, None
    ranked = data.get("structures_in_ranked_order") or data.get("outputs") or data.get("structures")
    if isinstance(ranked, list) and ranked and isinstance(ranked[0], dict):
        top = ranked[0]
        struct = top.get("structure") or top.get("cif") or top.get("pdb") or top.get("mmcif")
        conf = top.get("confidence") or top.get("ranking_score") or top.get("ptm") or top.get("mean_plddt")
    if struct is None:
        for k in ("structure", "cif", "pdb", "mmcif"):
            if isinstance(data.get(k), str):
                struct = data[k]
                break
    n_res = sum(len(m.get("sequence", "")) for m in molecules)
    out = {"model": "OpenFold3 (NVIDIA)", "molecules": [f"{m['type']}:{m['id']}" for m in molecules],
           "total_residues": n_res, "confidence": conf, "note": "Predicted structure, not solved."}
    if isinstance(struct, str) and struct.strip():
        ext = "cif" if fmt == "cif" else "pdb"
        aid, path = _put_artifact(struct, ext, args.get("name") or "complex")
        out["artifact"], out["saved_structure"] = aid, path
    else:
        out["structure_not_parsed"] = True
        out["response_keys"] = sorted(data.keys())[:20]
    return out


# ---- Boltz-2 (binding affinity) --------------------------------------------
def _predict_binding(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    polymers, idx = [], 0
    for raw in (args.get("protein_sequences") or []):
        s = _clean(raw)
        if not s:
            continue
        bad = sorted(set(s) - _AA)
        if bad:
            return {"error": f"protein sequence has invalid characters: {''.join(bad)}"}
        polymers.append({"id": _IDS[idx % len(_IDS)], "molecule_type": "protein", "sequence": s})
        idx += 1
    if not polymers:
        return {"error": "no protein sequence provided"}
    smi = (args.get("ligand_smiles") or "").strip()
    if not smi:
        return {"error": "ligand_smiles is required"}
    body = {"polymers": polymers,
            "ligands": [{"id": "L1", "smiles": smi, "predict_affinity": True}],
            "recycling_steps": 3, "sampling_steps": 50, "diffusion_samples": 1}
    data = _nvcf_post(URLS["boltz2"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"], **({"request_id": data["request_id"]} if data.get("request_id") else {})}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    aff = data.get("affinities") or {}
    a = aff.get("L1") if isinstance(aff, dict) else None
    if a is None and isinstance(aff, dict) and aff:
        a = next(iter(aff.values()))
    out = {"model": "Boltz-2 (NVIDIA)", "note": "Predicted affinity, not experimentally measured."}
    if isinstance(a, dict):
        out["affinity_pIC50"] = a.get("affinity_pic50")
        out["affinity_log_ic50"] = a.get("affinity_pred_value")
        out["binding_probability"] = a.get("affinity_probability_binary")
    else:
        out["affinity_not_parsed"] = True
        out["response_keys"] = sorted(data.keys())[:20]
    struct = None
    ranked = data.get("structures") or data.get("structures_in_ranked_order")
    if isinstance(ranked, list) and ranked and isinstance(ranked[0], dict):
        struct = ranked[0].get("structure") or ranked[0].get("mmcif") or ranked[0].get("cif")
    if isinstance(struct, str) and struct.strip():
        aid, path = _put_artifact(struct, "cif", args.get("name") or "complex")
        out["artifact"], out["saved_structure"] = aid, path
    return out


# ---- DiffDock (docking) ----------------------------------------------------
def _dock_ligand(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    pdb = _get_structure(args.get("input_structure"))
    if not pdb:
        return {"error": "input_structure not resolved (artifact id, file path, or PDB text)"}
    smi = (args.get("ligand_smiles") or "").strip()
    if not smi:
        return {"error": "ligand_smiles is required"}
    n = max(1, min(40, int(args.get("num_poses") or 10)))
    body = {"protein": pdb, "ligand": smi, "ligand_file_type": "smiles",
            "num_poses": n, "time_divisions": 20, "steps": 18}
    data = _nvcf_post(URLS["diffdock"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"], **({"request_id": data["request_id"]} if data.get("request_id") else {})}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    poses = data.get("ligand_positions") or data.get("docked_ligand") or data.get("poses")
    conf = data.get("position_confidence") or data.get("pose_confidence") or data.get("confidence")
    out = {"model": "DiffDock (NVIDIA)", "note": "Predicted poses, not experimentally determined."}
    if isinstance(conf, list) and conf:
        out["top_confidences"] = [round(float(c), 3) for c in conf[:10] if isinstance(c, (int, float))]
        out["num_poses"] = len(conf)
    if isinstance(poses, list) and poses:
        aid, path = _put_artifact("\n".join(str(p) for p in poses), "sdf", args.get("name") or "poses")
        out["artifact"], out["saved_poses"] = aid, path
    if "num_poses" not in out:
        out["response_keys"] = sorted(data.keys())[:20]
    return out


# ---- MolMIM (generative chemistry) -----------------------------------------
def _extract_smiles(data: dict) -> list[str]:
    raw = data.get("molecules") or data.get("generated") or data.get("smiles") or data.get("samples")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return [raw]
    out = []
    if isinstance(raw, list):
        for m in raw:
            if isinstance(m, str):
                out.append(m)
            elif isinstance(m, dict):
                s = m.get("smiles") or m.get("sample") or m.get("smi")
                if s:
                    out.append(s)
    return out


def _generate_molecules(args: dict) -> dict:
    err = _need_key()
    if err:
        return {"error": err}
    seed = (args.get("seed_smiles") or "").strip()
    if not seed:
        return {"error": "seed_smiles is required"}
    n = max(1, min(50, int(args.get("num_molecules") or 10)))
    body = {"smi": seed, "num_molecules": n, "algorithm": "CMA-ES",
            "property_name": (args.get("property_name") or "QED"),
            "minimize": bool(args.get("minimize", False)),
            "min_similarity": float(args.get("min_similarity") or 0.3),
            "particles": 20, "iterations": 3}
    data = _nvcf_post(URLS["molmim"], body, _api_key())
    if data.get("_error"):
        return {"error": data["_error"]}
    if data.get("_pending"):
        return {"status": "still_processing", "request_id": data["request_id"]}
    smiles = _extract_smiles(data)
    if not smiles:
        return {"model": "MolMIM", "response_keys": sorted(data.keys())[:20]}
    return {"model": "MolMIM (NVIDIA)", "property": args.get("property_name") or "QED",
            "generated_molecules": smiles[:n], "count": len(smiles),
            "note": "Generated candidates, not synthesized or assayed."}


_DISPATCH = {
    "dna_generate": _dna_generate,
    "design_backbone": _design_backbone,
    "design_sequence": _design_sequence,
    "fold_structure": _fold_structure,
    "predict_binding": _predict_binding,
    "dock_ligand": _dock_ligand,
    "generate_molecules": _generate_molecules,
}


def bio_execute(name: str, args: dict) -> dict:
    fn = _DISPATCH.get(name)
    if not fn:
        return {"error": f"unknown bio tool: {name}"}
    try:
        return fn(args)
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}


_BIO_NAMES = set(_DISPATCH)

# Public, ordered tuple of the seven dispatch names, for cheap validation and
# stable OpenAPI enumeration in the service layer.
BIO_TOOL_NAMES = tuple(_DISPATCH.keys())


def with_bio(tools, execute, system):
    """Merge the bio tool pack into a domain workbench's (tools, execute, system)."""
    def combined(name: str, args: dict) -> dict:
        if name in _BIO_NAMES:
            return bio_execute(name, args)
        return execute(name, args)

    return list(tools) + BIO_TOOLS, combined, system + "\n\n" + BIO_SYSTEM_NOTE
