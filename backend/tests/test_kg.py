"""Test suite for knowledge graph functionality."""

import pytest
from crowe_copilot.kg import (
    new_kg,
    add_node,
    add_edge,
    _node,
    neighbors_by_type,
    edges_by_type,
    find_paths,
    subgraph_around_node,
)


def test_create_kg():
    """Test knowledge graph creation."""
    G = new_kg()
    assert len(G) == 0
    assert G.graph["schema_version"] == "0.2"


def test_add_nodes_and_edges():
    """Test adding typed nodes and edges."""
    G = new_kg()
    
    compound_node = add_node(G, "compound", "CHEMBL25", name="Caffeine")
    target_node = add_node(G, "target", "CHEMBL203", name="ADORA2A")
    
    assert len(G) == 2
    assert G.nodes[compound_node]["ntype"] == "compound"
    assert G.nodes[target_node]["name"] == "ADORA2A"
    
    add_edge(
        G,
        compound_node,
        target_node,
        "ACTS_ON",
        {"source": "ChEMBL", "confidence": "medium"},
    )
    
    assert G.size() == 1
    edges = list(G.edges(data=True))
    assert edges[0][2]["etype"] == "ACTS_ON"


def test_neighbors_by_type():
    """Test filtering neighbors by type."""
    G = new_kg()
    
    c1 = add_node(G, "compound", "C1", name="CompoundA")
    c2 = add_node(G, "compound", "C2", name="CompoundB")
    t1 = add_node(G, "target", "T1", name="TargetX")
    
    add_edge(G, c1, t1, "ACTS_ON", {})
    add_edge(G, c1, c2, "SIMILAR_TO", {})
    
    # C1 → T1 (target) and C1 → C2 (compound)
    target_neighbors = neighbors_by_type(G, c1, "target", direction="out")
    assert len(target_neighbors) == 1
    assert target_neighbors[0] == t1
    
    compound_neighbors = neighbors_by_type(G, c1, "compound", direction="out")
    assert len(compound_neighbors) == 1


def test_edges_by_type():
    """Test filtering edges by type."""
    G = new_kg()
    
    c1 = add_node(G, "compound", "C1")
    t1 = add_node(G, "target", "T1")
    
    add_edge(G, c1, t1, "ACTS_ON", {"confidence": "high"})
    add_edge(G, c1, t1, "ASSOCIATED_WITH", {"confidence": "low"})
    
    acts_on_edges = edges_by_type(G, c1, "ACTS_ON", direction="out")
    assert len(acts_on_edges) == 1
    assert acts_on_edges[0][2]["etype"] == "ACTS_ON"


def test_find_paths():
    """Test path finding between nodes."""
    G = new_kg()
    
    c1 = add_node(G, "compound", "C1")
    t1 = add_node(G, "target", "T1")
    p1 = add_node(G, "pathway", "P1")
    
    add_edge(G, c1, t1, "ACTS_ON", {})
    add_edge(G, t1, p1, "REGULATES", {})
    
    paths = find_paths(G, c1, p1, max_length=3)
    assert len(paths) >= 1
    assert paths[0] == [c1, t1, p1]


def test_subgraph_around_node():
    """Test subgraph extraction."""
    G = new_kg()
    
    c1 = add_node(G, "compound", "C1")
    c2 = add_node(G, "compound", "C2")
    t1 = add_node(G, "target", "T1")
    t2 = add_node(G, "target", "T2")
    
    add_edge(G, c1, t1, "ACTS_ON", {})
    add_edge(G, t1, t2, "REGULATES", {})
    add_edge(G, c2, t2, "ACTS_ON", {})
    
    subG = subgraph_around_node(G, c1, radius=1)
    assert len(subG) == 2  # c1 and t1
    
    subG2 = subgraph_around_node(G, c1, radius=2)
    assert len(subG2) >= 3  # c1, t1, t2


def test_export_import():
    """Test graph serialization."""
    from crowe_copilot.kg import export_to_dict, import_from_dict
    
    G = new_kg()
    c1 = add_node(G, "compound", "C1", name="TestCompound")
    t1 = add_node(G, "target", "T1", name="TestTarget")
    add_edge(G, c1, t1, "ACTS_ON", {"confidence": "high"})
    
    data = export_to_dict(G)
    assert "nodes" in data
    assert "links" in data
    
    G2 = import_from_dict(data)
    assert len(G2) == len(G)
    assert G2.size() == G.size()
