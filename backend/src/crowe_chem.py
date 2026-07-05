"""Crowe Science chemistry tool pack (RDKit + scipy) for the Crowe workbench core.

Pure tool pack: system prompt, tool schemas, and an executor. The agent loop,
gateway, server, and console all live in crowe_workbench.
"""
from __future__ import annotations

import os

import numpy as np

from crowe_copilot import chem_utils, dose_response, mixtures

CHEM_MODELS = {"deepseek-v4-pro", "crowenimbus", "teeai"}
CHEM_DEFAULT_MODEL = os.getenv("CROWE_SCIENCE_MODEL", "deepseek-v4-pro")

CHEM_SYSTEM = (
    "You are Crowe Science, a chemistry research assistant focused on natural products "
    "and medicinal fungi. You are backed by real tools (RDKit cheminformatics and scipy "
    "pharmacology). For any structural, physicochemical, similarity, or dose-response "
    "question, call the appropriate tool rather than estimating from memory, then report "
    "exactly what the tool returned with honest caveats. Keep compound claims non-clinical: "
    "describe bioactivity of research interest, never therapeutic effect. "
    "Write in plain editorial prose: no emojis, no em dashes, no marketing language. Use short "
    "paragraphs and compact tables, and report numbers with their units."
)

CHEM_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "analyze_compound",
            "description": "Standardize a SMILES and compute RDKit descriptors (MW, logP, TPSA, "
            "H-bond donors/acceptors, rotatable bonds), Lipinski violations, InChIKey, and the "
            "Bemis-Murcko scaffold.",
            "parameters": {
                "type": "object",
                "properties": {"smiles": {"type": "string", "description": "SMILES string"}},
                "required": ["smiles"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_compounds",
            "description": "Tanimoto similarity between two molecules using Morgan fingerprints.",
            "parameters": {
                "type": "object",
                "properties": {
                    "smiles1": {"type": "string"},
                    "smiles2": {"type": "string"},
                    "radius": {"type": "integer", "description": "Morgan radius, default 2"},
                },
                "required": ["smiles1", "smiles2"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "substructure_match",
            "description": "Check whether a molecule (SMILES) contains a SMARTS substructure pattern.",
            "parameters": {
                "type": "object",
                "properties": {"smiles": {"type": "string"}, "smarts": {"type": "string"}},
                "required": ["smiles", "smarts"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fit_dose_response",
            "description": "Fit a 4-parameter logistic (4PL) dose-response curve. Returns EC50/IC50 "
            "(potency, in the concentration units provided), Hill slope, top and bottom plateaus, "
            "and R-squared.",
            "parameters": {
                "type": "object",
                "properties": {
                    "concentrations_uM": {"type": "array", "items": {"type": "number"}},
                    "responses": {"type": "array", "items": {"type": "number"}},
                },
                "required": ["concentrations_uM", "responses"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_pubchem",
            "description": "Look up a compound by name in PubChem. Returns CID, IUPAC name, SMILES, "
            "molecular weight, and formula for the top matches. Use this to resolve a named compound "
            "to a structure you can then analyze.",
            "parameters": {
                "type": "object",
                "properties": {"name": {"type": "string", "description": "compound name, e.g. psilocybin"}},
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_chembl",
            "description": "Search ChEMBL for molecules whose preferred name matches the query. Returns "
            "ChEMBL ID, preferred name, max clinical phase, and SMILES for the top matches.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string", "description": "compound or drug name"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "combination_index",
            "description": "Loewe combination index (CI) for a two-drug mixture at given "
            "concentrations and their single-agent EC50s. CI below 1 indicates synergy, near 1 "
            "additivity, above 1 antagonism.",
            "parameters": {
                "type": "object",
                "properties": {
                    "conc_a": {"type": "number"},
                    "conc_b": {"type": "number"},
                    "ec50_a": {"type": "number"},
                    "ec50_b": {"type": "number"},
                    "fa": {"type": "number", "description": "fraction affected (0-1) by the combination"},
                },
                "required": ["conc_a", "conc_b", "ec50_a", "ec50_b", "fa"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "bliss_synergy",
            "description": "Bliss independence synergy from single-agent and combination effect "
            "fractions (0-1). Returns the Bliss-expected effect, the observed-minus-expected delta, "
            "and a synergy classification.",
            "parameters": {
                "type": "object",
                "properties": {
                    "effect_a": {"type": "number"},
                    "effect_b": {"type": "number"},
                    "effect_combo": {"type": "number"},
                },
                "required": ["effect_a", "effect_b", "effect_combo"],
            },
        },
    },
]


def chem_execute(name: str, args: dict) -> dict:
    try:
        if name == "analyze_compound":
            s = args["smiles"]
            desc = chem_utils.descriptors(s)
            return {
                "input_smiles": s,
                "standardized_smiles": chem_utils.standardize_smiles(s),
                "inchikey": chem_utils.to_inchikey(s),
                "descriptors": desc,
                "lipinski_violations": chem_utils.lipinski_violations(desc) if desc else [],
                "murcko_scaffold": chem_utils.murcko_scaffold(s),
            }
        if name == "compare_compounds":
            r = int(args.get("radius", 2))
            return {
                "tanimoto": chem_utils.tanimoto_similarity(args["smiles1"], args["smiles2"], radius=r),
                "method": f"Morgan_r{r}",
            }
        if name == "substructure_match":
            return {"has_substructure": chem_utils.has_substructure(args["smiles"], args["smarts"])}
        if name == "fit_dose_response":
            x = np.asarray(args["concentrations_uM"], dtype=float)
            y = np.asarray(args["responses"], dtype=float)
            params, errs, r2 = dose_response.fit_4pl(x, y)
            return {"fit": "4PL", "parameters": params, "std_errors": errs, "r_squared": r2}
        if name == "search_pubchem":
            return {"source": "PubChem", "query": args["name"], "results": _pubchem_search(args["name"])}
        if name == "search_chembl":
            return {"source": "ChEMBL", "query": args["query"], "results": _chembl_search(args["query"])}
        if name == "combination_index":
            ci = mixtures.combination_index_loewe(
                float(args["conc_a"]), float(args["conc_b"]),
                float(args["ec50_a"]), float(args["ec50_b"]), float(args["fa"]),
            )
            interp = "synergy" if ci < 0.9 else ("antagonism" if ci > 1.1 else "near-additive")
            return {"combination_index": ci, "interpretation": interp}
        if name == "bliss_synergy":
            ea, eb, eab = float(args["effect_a"]), float(args["effect_b"]), float(args["effect_combo"])
            expected = mixtures.bliss_independence(ea, eb)
            delta = eab - expected
            return {"expected_bliss": expected, "observed": eab, "delta": delta,
                    "classification": mixtures.classify_synergy(delta)}
        return {"error": f"unknown tool: {name}"}
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}


def _pubchem_search(query: str) -> list:
    import pubchempy as pcp

    out = []
    for c in pcp.get_compounds(query, "name")[:3]:
        smiles = getattr(c, "connectivity_smiles", None) or getattr(c, "canonical_smiles", None)
        out.append(
            {
                "cid": c.cid,
                "iupac_name": c.iupac_name,
                "smiles": smiles,
                "mw": c.molecular_weight,
                "formula": c.molecular_formula,
            }
        )
    return out


def _chembl_search(query: str) -> list:
    import socket

    old = socket.getdefaulttimeout()
    socket.setdefaulttimeout(25)
    try:
        from chembl_webresource_client.new_client import new_client

        res = (
            new_client.molecule.filter(pref_name__icontains=query)
            .only(["molecule_chembl_id", "pref_name", "max_phase", "molecule_structures"])[:5]
        )
        out = []
        for m in res:
            st = m.get("molecule_structures") or {}
            out.append(
                {
                    "chembl_id": m.get("molecule_chembl_id"),
                    "pref_name": m.get("pref_name"),
                    "max_phase": m.get("max_phase"),
                    "smiles": st.get("canonical_smiles"),
                }
            )
        return out
    finally:
        socket.setdefaulttimeout(old)
