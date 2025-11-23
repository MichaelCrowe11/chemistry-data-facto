import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from crowe_copilot import spectra_lsh
    print("Successfully imported spectra_lsh")
except ImportError as e:
    print(f"Failed to import spectra_lsh: {e}")

try:
    from crowe_copilot import spectra_bridge
    print("Successfully imported spectra_bridge")
except ImportError as e:
    print(f"Failed to import spectra_bridge: {e}")

try:
    import networkx
    print(f"NetworkX version: {networkx.__version__}")
except ImportError:
    print("NetworkX not installed")
