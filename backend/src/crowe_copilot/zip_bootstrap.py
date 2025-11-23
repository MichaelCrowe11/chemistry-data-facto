import numpy as np
from scipy.optimize import curve_fit
from typing import Tuple, Optional, Dict

def marginal_4pl(x, min_val, max_val, ec50, hill):
    """Standard 4PL: min + (max - min) / (1 + (x/ec50)^hill)."""
    # Avoid div by zero if x=0 and hill<0, though usually x>0 for log-dose
    # We'll assume x is concentration.
    with np.errstate(divide='ignore', invalid='ignore'):
        res = min_val + (max_val - min_val) / (1.0 + (x / ec50)**hill)
    return np.nan_to_num(res, nan=min_val)

def fit_marginal(
    concs: np.ndarray,
    resps: np.ndarray,
    p0: Optional[list] = None
) -> Tuple[np.ndarray, float]:
    """Fit 4PL to single-agent data. Returns (params, r_squared)."""
    # p0 = [min, max, ec50, hill]
    if p0 is None:
        p0 = [np.min(resps), np.max(resps), np.median(concs), 1.0]
    try:
        popt, _ = curve_fit(marginal_4pl, concs, resps, p0=p0, maxfev=2000)
        preds = marginal_4pl(concs, *popt)
        ss_res = np.sum((resps - preds)**2)
        ss_tot = np.sum((resps - np.mean(resps))**2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 1e-9 else 0.0
        return popt, r2
    except Exception:
        return np.array(p0), 0.0

def zip_synergy_surface(
    conc_a: np.ndarray,
    conc_b: np.ndarray,
    effect: np.ndarray,
    params_a: np.ndarray,
    params_b: np.ndarray
) -> Tuple[float, float]:
    """
    Calculate ZIP synergy score (mean deviation from ZIP reference).
    ZIP ref = (E_a + E_b - E_a*E_b) if we assume fractional effect (0-1).
    If effect is raw response, we must normalize or use the specific ZIP formula for 4PL.
    
    Standard ZIP assumption: E is fractional inhibition (0=no effect, 1=full kill).
    Reference: Yadav et al. (2015).
    
    We'll assume 'effect' is already normalized 0-1.
    """
    # Predict marginals
    ea = marginal_4pl(conc_a, *params_a)
    eb = marginal_4pl(conc_b, *params_b)
    
    # ZIP reference (independent action)
    # E_zip = Ea + Eb - Ea*Eb
    e_zip = ea + eb - (ea * eb)
    
    delta = effect - e_zip
    synergy_score = np.mean(delta)
    return synergy_score, np.std(delta)

def bootstrap_zip(
    conc_a: np.ndarray,
    conc_b: np.ndarray,
    effect: np.ndarray,
    n_boot: int = 100,
    seed: int = 42
) -> Dict[str, float]:
    """
    Bootstrap the ZIP score to get CI.
    1. Fit marginals on full data (or bootstrap marginals too? usually fixed marginals is simpler, 
       but full bootstrap is better. We'll do fixed marginals for speed here, or resample data points.)
    
    Better: Resample (conc_a, conc_b, effect) tuples, refit marginals, recalc ZIP.
    """
    rng = np.random.RandomState(seed)
    n = len(effect)
    scores = []
    
    # Initial fit to get "observed" marginals (optional, but good for stability)
    # We need to separate single-agent data from combo data for marginal fitting
    # mask_a_only = (conc_b == 0)
    # mask_b_only = (conc_a == 0)
    # But often data is sparse. We'll just fit on whatever points have conc_b=0 for A, etc.
    
    # For robustness, let's assume we just resample the residuals or the data points.
    # Simple case: Resample data points with replacement.
    
    for _ in range(n_boot):
        idx = rng.choice(n, n, replace=True)
        c_a_b = conc_a[idx]
        c_b_b = conc_b[idx]
        eff_b = effect[idx]
        
        # Fit A (where c_b_b == 0)
        mask_a = (c_b_b == 0)
        if np.sum(mask_a) < 4: 
            scores.append(0.0) # convergence fail fallback
            continue
        p_a, _ = fit_marginal(c_a_b[mask_a], eff_b[mask_a])
        
        # Fit B (where c_a_b == 0)
        mask_b = (c_a_b == 0)
        if np.sum(mask_b) < 4:
            scores.append(0.0)
            continue
        p_b, _ = fit_marginal(c_b_b[mask_b], eff_b[mask_b])
        
        # Calc ZIP on combo points (where both > 0)
        mask_combo = (c_a_b > 0) & (c_b_b > 0)
        if np.sum(mask_combo) == 0:
            scores.append(0.0)
            continue
            
        s, _ = zip_synergy_surface(c_a_b[mask_combo], c_b_b[mask_combo], eff_b[mask_combo], p_a, p_b)
        scores.append(s)
        
    scores_arr = np.array(scores)
    return {
        "zip_mean": float(np.mean(scores_arr)),
        "zip_ci_low": float(np.percentile(scores_arr, 2.5)),
        "zip_ci_high": float(np.percentile(scores_arr, 97.5)),
        "zip_std": float(np.std(scores_arr))
    }
