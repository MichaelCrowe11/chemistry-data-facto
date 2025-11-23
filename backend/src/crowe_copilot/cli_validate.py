import typer
from pathlib import Path
import sys
from .settings import settings
# from .pq_registry import ParquetRegistry
from .zip_bootstrap import bootstrap_zip
from .spectra_lsh import build_signatures
import numpy as np

app = typer.Typer()

@app.command()
def validate_env():
    """Check if all scientific deps are importable and working."""
    print("Checking dependencies...")
    try:
        import rdkit
        print(f"RDKit: {rdkit.__version__}")
    except ImportError:
        print("RDKit missing!")
        sys.exit(1)
        
    try:
        import numba
        print(f"Numba: {numba.__version__}")
    except ImportError:
        print("Numba missing!")
        sys.exit(1)
        
    try:
        import matchms
        print(f"Matchms: {matchms.__version__}")
    except ImportError:
        print("Matchms missing!")
        sys.exit(1)
        
    print("Environment OK.")

@app.command()
def run_zip_test():
    """Run a quick ZIP bootstrap test on dummy data."""
    print("Running ZIP bootstrap test...")
    # Dummy data: A and B are synergistic
    # A alone: 0->0, 10->0.5
    # B alone: 0->0, 10->0.5
    # Combo: 10+10 -> 0.9 (expected indep: 0.5+0.5 - 0.25 = 0.75). 0.9 > 0.75 -> synergy.
    
    conc_a = np.array([0, 10, 0, 10]*5)
    conc_b = np.array([0, 0, 10, 10]*5)
    # effects
    eff = []
    for a, b in zip(conc_a, conc_b):
        if a==0 and b==0: eff.append(0.0)
        elif a>0 and b==0: eff.append(0.5)
        elif a==0 and b>0: eff.append(0.5)
        else: eff.append(0.9) # synergy
    eff = np.array(eff) + np.random.normal(0, 0.01, len(eff))
    
    res = bootstrap_zip(conc_a, conc_b, eff, n_boot=50)
    print("ZIP Results:", res)
    if res['zip_mean'] > 0.05:
        print("SUCCESS: Synergy detected.")
    else:
        print("WARNING: Synergy not detected (might be noise).")

@app.command()
def test_lsh():
    """Test LSH signature generation."""
    print("Testing LSH...")
    mz = np.array([100.1, 200.2, 300.3])
    inten = np.array([1000.0, 500.0, 100.0])
    sig = build_signatures(mz, inten, top_k=3, n_perm=16)
    print(f"Signature: {sig}")
    assert len(sig) == 16
    print("SUCCESS: LSH signature generated.")

if __name__ == "__main__":
    app()
