import networkx as nx
from pathlib import Path
import json
from typing import Any

def save_kg_json(G: nx.MultiDiGraph, path: Path):
    """Save Knowledge Graph to JSON node-link data."""
    data = nx.node_link_data(G)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def load_kg_json(path: Path) -> nx.MultiDiGraph:
    """Load Knowledge Graph from JSON node-link data."""
    with open(path, "r") as f:
        data = json.load(f)
    return nx.node_link_graph(data)

def save_kg_graphml(G: nx.MultiDiGraph, path: Path):
    """Save Knowledge Graph to GraphML."""
    nx.write_graphml(G, str(path))
