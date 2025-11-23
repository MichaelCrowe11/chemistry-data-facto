"""Dose-response curve fitting with scipy and optional Bayesian inference."""

from __future__ import annotations

from typing import Tuple, Dict, Optional, Literal
import logging

import numpy as np
from scipy.optimize import curve_fit
from scipy import stats

logger = logging.getLogger(__name__)


def four_pl(x: np.ndarray, top: float, bottom: float, ec50: float, hill: float) -> np.ndarray:
    """Four-parameter logistic function."""
    return bottom + (top - bottom) / (1.0 + (x / ec50) ** hill)


def five_pl(
    x: np.ndarray, top: float, bottom: float, ec50: float, hill: float, asym: float
) -> np.ndarray:
    """Five-parameter logistic function with asymmetry."""
    return bottom + (top - bottom) / ((1.0 + (x / ec50) ** hill) ** asym)


def fit_4pl(
    conc_uM: np.ndarray, resp: np.ndarray, bounds: bool = True
) -> Tuple[Dict[str, float], Dict[str, float], float]:
    """
    Fit 4-parameter logistic dose-response curve.
    
    Args:
        conc_uM: Concentrations in µM
        resp: Response values (e.g., % inhibition, viability)
        bounds: Whether to apply parameter bounds
    
    Returns:
        Tuple of (parameters dict, standard errors dict, R² value)
    """
    x = np.asarray(conc_uM, dtype=float)
    y = np.asarray(resp, dtype=float)
    
    # Remove NaN/inf
    mask = np.isfinite(x) & np.isfinite(y) & (x > 0)
    x = x[mask]
    y = y[mask]
    
    if len(x) < 4:
        raise ValueError(f"Need at least 4 data points, got {len(x)}")
    
    # Initial parameter estimates
    top_est = np.percentile(y, 95)
    bottom_est = np.percentile(y, 5)
    ec50_est = np.median(x[x > 0])
    hill_est = 1.0
    
    p0 = [top_est, bottom_est, ec50_est, hill_est]
    
    if bounds:
        param_bounds = (
            [y.min() - 10, -1e6, 1e-9, 0.01],  # lower bounds
            [1e6, y.max() + 10, x.max() * 100, 5.0],  # upper bounds
        )
    else:
        param_bounds = (-np.inf, np.inf)
    
    try:
        popt, pcov = curve_fit(four_pl, x, y, p0=p0, bounds=param_bounds, maxfev=20000)
        perr = np.sqrt(np.diag(pcov))
        
        # Calculate R²
        y_pred = four_pl(x, *popt)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
        
        params = dict(zip(["top", "bottom", "ec50", "hill"], popt))
        errs = dict(zip(["top", "bottom", "ec50", "hill"], perr))
        
        return params, errs, float(r2)
        
    except Exception as e:
        logger.error(f"4PL fit failed: {e}")
        raise


def fit_5pl(
    conc_uM: np.ndarray, resp: np.ndarray
) -> Tuple[Dict[str, float], Dict[str, float], float]:
    """
    Fit 5-parameter logistic dose-response curve with asymmetry.
    
    Returns:
        Tuple of (parameters dict, standard errors dict, R² value)
    """
    x = np.asarray(conc_uM, dtype=float)
    y = np.asarray(resp, dtype=float)
    
    mask = np.isfinite(x) & np.isfinite(y) & (x > 0)
    x = x[mask]
    y = y[mask]
    
    if len(x) < 5:
        raise ValueError(f"Need at least 5 data points for 5PL, got {len(x)}")
    
    # Start from 4PL fit
    p4, _, _ = fit_4pl(x, y, bounds=True)
    p0 = [p4["top"], p4["bottom"], p4["ec50"], p4["hill"], 1.0]  # asym=1 → 4PL
    
    param_bounds = (
        [y.min() - 10, -1e6, 1e-9, 0.01, 0.1],
        [1e6, y.max() + 10, x.max() * 100, 5.0, 10.0],
    )
    
    try:
        popt, pcov = curve_fit(five_pl, x, y, p0=p0, bounds=param_bounds, maxfev=30000)
        perr = np.sqrt(np.diag(pcov))
        
        y_pred = five_pl(x, *popt)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
        
        params = dict(zip(["top", "bottom", "ec50", "hill", "asymmetry"], popt))
        errs = dict(zip(["top", "bottom", "ec50", "hill", "asymmetry"], perr))
        
        return params, errs, float(r2)
        
    except Exception as e:
        logger.error(f"5PL fit failed: {e}")
        raise


def auto_fit(
    conc_uM: np.ndarray,
    resp: np.ndarray,
    prefer: Literal["4PL", "5PL", "auto"] = "auto",
) -> Tuple[str, Dict[str, float], Dict[str, float], float]:
    """
    Automatically select and fit best dose-response model.
    
    Args:
        conc_uM: Concentrations
        resp: Response values
        prefer: Model preference ('4PL', '5PL', or 'auto' for AIC comparison)
    
    Returns:
        Tuple of (model_name, parameters, std_errors, r2)
    """
    if prefer == "4PL" or len(conc_uM) < 5:
        params, errs, r2 = fit_4pl(conc_uM, resp)
        return "4PL", params, errs, r2
    
    if prefer == "5PL":
        params, errs, r2 = fit_5pl(conc_uM, resp)
        return "5PL", params, errs, r2
    
    # Auto: fit both, compare AIC
    try:
        p4, e4, r2_4 = fit_4pl(conc_uM, resp)
        p5, e5, r2_5 = fit_5pl(conc_uM, resp)
        
        # Simple AIC approximation (lower is better)
        n = len(conc_uM)
        k4, k5 = 4, 5
        aic4 = n * np.log((1 - r2_4)) + 2 * k4
        aic5 = n * np.log((1 - r2_5)) + 2 * k5
        
        if aic5 < aic4 - 2:  # 5PL significantly better
            return "5PL", p5, e5, r2_5
        else:
            return "4PL", p4, e4, r2_4
            
    except Exception as e:
        logger.warning(f"Auto-fit defaulting to 4PL due to: {e}")
        params, errs, r2 = fit_4pl(conc_uM, resp)
        return "4PL", params, errs, r2


def calculate_ci95(
    param_value: float, param_stderr: float, n: int
) -> Tuple[float, float]:
    """Calculate 95% confidence interval for a parameter."""
    t_crit = stats.t.ppf(0.975, df=n - 1)
    margin = t_crit * param_stderr
    return (param_value - margin, param_value + margin)
