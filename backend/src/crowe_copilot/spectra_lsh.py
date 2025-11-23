from __future__ import annotations
from typing import Dict, Any, Iterable, Tuple, List, DefaultDict, Optional
from collections import defaultdict
import numpy as np
import networkx as nx

def _peaks_to_shingles(mz: np.ndarray, top_k: int = 30, round_da: float = 0.1) -> List[int]:
    """Use top-K peaks by intensity; hash rounded m/z to form shingles."""
    if mz.size == 0:
        return []
    # caller must align intensities; here we assume mz already paired with intensities externally
    # use indices to determine top peaks; we’ll expect caller passes sorted by intensity if needed
    # safer: let’s require both arrays
    raise NotImplementedError  # kept for clarity; use build_signatures() below

def build_signatures(
    peaks_mz: np.ndarray,
    peaks_int: np.ndarray,
    top_k: int = 30,
    round_da: float = 0.1,
    n_perm: int = 64,
    seed: int = 7,
) -> np.ndarray:
    """
    Create a MinHash-like signature without extra deps:
    - take top-K peaks by intensity
    - round m/z to grid
    - hash each token with multiple seeded hashes; keep mins.
    Returns shape (n_perm,) uint64 signature.
    """
    rng = np.random.RandomState(seed)
    if peaks_mz.size == 0:
        return np.full(n_perm, np.uint64((1 << 63) - 1), dtype=np.uint64)

    idx = np.argsort(peaks_int)[::-1][:top_k]
    toks = np.unique(np.round(peaks_mz[idx] / round_da).astype(np.int64))
    # universal hashing parameters
    a = rng.randint(1, 2**31 - 1, size=n_perm, dtype=np.int64)
    b = rng.randint(0, 2**31 - 1, size=n_perm, dtype=np.int64)
    prime = np.int64(2_147_483_647)  # 2^31-1
    sig = np.full(n_perm, np.uint64(2**63 - 1), dtype=np.uint64)
    for t in toks:
        vals = (a * t + b) % prime
        sig = np.minimum(sig, vals.astype(np.uint64))
    return sig

def _bucket_key(precursor_mz: float, ionmode: str, width_da: float = 1.0) -> Tuple[str, int]:
    """Coarse bucket by precursor and ion mode to reduce candidate pairs."""
    b = int(np.floor(precursor_mz / width_da))
    return (ionmode or "unknown", b)

def candidate_pairs_lsh(
    G: nx.MultiDiGraph,
    n_bands: int = 16,
    band_size: int = 4,
    bucket_da: float = 1.0,
    top_k: int = 30,
    round_da: float = 0.1,
    n_perm: int = 64,
    seed: int = 7,
) -> Iterable[Tuple[str, str]]:
    """
    Generate candidate spectrum pairs using:
      (1) precursor-m/z buckets (1 Da default)
      (2) banded LSH over MinHash-like signatures of top-K peaks
    Yields (sid1, sid2) once per pair (sid1 < sid2 lexicographically).
    """
    assert n_bands * band_size == n_perm, "n_bands * band_size must equal n_perm"
    # Collect spectra by bucket
    buckets: DefaultDict[Tuple[str, int], List[Tuple[str, np.ndarray, np.ndarray, float]]] = defaultdict(list)
    for n, attrs in G.nodes(data=True):
        if not (isinstance(n, tuple) and n[0] == "spectrum"):
            continue
        sid = n[1]
        mz = attrs.get("peaks_mz"); it = attrs.get("peaks_int")
        if mz is None or it is None or len(mz) == 0:
            continue
        key = _bucket_key(float(attrs.get("precursor_mz", 0.0)), str(attrs.get("ionmode","")), bucket_da)
        buckets[key].append((sid, np.asarray(mz), np.asarray(it), float(attrs.get("precursor_mz", 0.0))))

    # Within each bucket, do LSH
    rng = np.random.RandomState(seed)
    for _, specs in buckets.items():
        if len(specs) < 2:
            continue
        # Precompute signatures
        sigs: Dict[str, np.ndarray] = {}
        for sid, mz, it, _ in specs:
            sigs[sid] = build_signatures(mz, it, top_k=top_k, round_da=round_da, n_perm=n_perm, seed=seed)

        band_maps: List[DefaultDict[Tuple[int, ...], List[str]]] = [defaultdict(list) for _ in range(n_bands)]
        for sid, sig in sigs.items():
            for b in range(n_bands):
                start = b * band_size
                band = tuple(sig[start:start+band_size].tolist())
                band_maps[b][band].append(sid)

        seen = set()
        for bm in band_maps:
            for _, members in bm.items():
                if len(members) < 2: continue
                members = sorted(set(members))
                for i in range(len(members)):
                    for j in range(i+1, len(members)):
                        pair = (members[i], members[j])
                        if pair not in seen:
                            seen.add(pair)
                            yield pair

def add_similarity_edges_lsh(
    G: nx.MultiDiGraph,
    tol_da: float = 0.02,
    threshold: float = 0.75,
    **lsh_kwargs,
) -> int:
    """
    Build candidate pairs via LSH buckets, then compute exact cosine (peak-match) and add edges.
    Returns number of edges added.
    """
    # Note: This assumes _cosine_similarity is available in spectra_bridge or similar.
    # If not, we might need to implement it or import it from where it exists.
    # The user prompt says: from .spectra_bridge import _cosine_similarity
    # I will assume spectra_bridge exists or I should create it if it doesn't.
    # Checking file list... ms_integration.py exists. Maybe it's there?
    # The user prompt implies this is drop-in code. I'll keep the import as requested.
    # However, I should check if spectra_bridge exists.
    try:
        from .spectra_bridge import _cosine_similarity
    except ImportError:
        # Fallback implementation if spectra_bridge is missing (likely, as I haven't created it)
        # But wait, ms_integration.py was created earlier. Let's check if it has cosine similarity.
        # For now, I'll include a local version to be safe if import fails, or just let it fail if the user intends to add spectra_bridge later.
        # Given "Everything below is raw, drop-in code", I should stick to the code provided.
        # But I'll add a comment or a local fallback if I can't find the file.
        pass
    
    # Re-reading the prompt: "Everything below is raw, drop-in code."
    # I will paste it exactly as is, but I need to be careful about the import.
    # The prompt has: from .spectra_bridge import _cosine_similarity
    # I will use that.
    
    from .spectra_bridge import _cosine_similarity  # reuse exact scorer

    added = 0
    for sid1, sid2 in candidate_pairs_lsh(G, **lsh_kwargs):
        a = ("spectrum", sid1); b = ("spectrum", sid2)
        attrs1 = G.nodes[a]; attrs2 = G.nodes[b]
        score = _cosine_similarity(
            np.asarray(attrs1["peaks_mz"]), np.asarray(attrs1["peaks_int"]),
            np.asarray(attrs2["peaks_mz"]), np.asarray(attrs2["peaks_int"]),
            tol=tol_da
        )
        if score >= threshold:
            G.add_edge(a, b, key="SIMILAR_LSH", etype="SIMILAR", weight=float(score),
                       evidence={"source":"local-lsh","method":"cosine","tol_da":tol_da})
            added += 1
    return added
