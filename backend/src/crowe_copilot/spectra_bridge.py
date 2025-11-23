import numpy as np
from typing import Tuple, Optional

def _cosine_similarity(
    mz1: np.ndarray, int1: np.ndarray,
    mz2: np.ndarray, int2: np.ndarray,
    tol: float = 0.02
) -> float:
    """
    Compute cosine similarity between two spectra with peak matching.
    
    Args:
        mz1, int1: m/z and intensity arrays for spectrum 1
        mz2, int2: m/z and intensity arrays for spectrum 2
        tol: m/z tolerance for matching peaks
        
    Returns:
        Cosine similarity score (0.0 to 1.0)
    """
    if len(mz1) == 0 or len(mz2) == 0:
        return 0.0
        
    # Normalize intensities
    int1_norm = int1 / np.linalg.norm(int1)
    int2_norm = int2 / np.linalg.norm(int2)
    
    # Match peaks
    # Simple greedy matching for now
    score = 0.0
    used2 = np.zeros(len(mz2), dtype=bool)
    
    for i, m1 in enumerate(mz1):
        # Find best match in mz2 within tolerance
        best_j = -1
        min_dist = tol
        
        for j, m2 in enumerate(mz2):
            if used2[j]:
                continue
            dist = abs(m1 - m2)
            if dist <= min_dist:
                min_dist = dist
                best_j = j
        
        if best_j != -1:
            score += int1_norm[i] * int2_norm[best_j]
            used2[best_j] = True
            
    return float(score)
