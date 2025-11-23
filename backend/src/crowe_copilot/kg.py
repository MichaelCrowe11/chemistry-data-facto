"""Knowledge graph construction and reasoning with NetworkX."""

from __future__ import annotations

from typing import Dict, Any, Literal, Tuple, List, Optional, Set
import logging

import networkx as nx

logger = logging.getLogger(__name__)

NodeType = Literal[
    "compound",
    "target",
    "extract",
    "fraction",
    "mixture",
    "assay",
    "phenotype",
    "pathway",
    "organism",
    "publication",
]

EdgeType = Literal[
    "ACTS_ON",
    "CONTAINS",
    "ASSAYED_IN",
    "DERIVED_FROM",
    "ASSOCIATED_WITH",
    "SYNERGY_WITH",
    "PUBLISHED_IN",
    "SIMILAR_TO",
    "REGULATES",
]


def new_kg() -> nx.MultiDiGraph:
    """Create new typed knowledge graph."""
    G = nx.MultiDiGraph()
    G.graph["schema_version"] = "0.2"
    G.graph["created_at"] = None
    return G


def _node(ntype: NodeType, nid: str) -> Tuple[str, str]:
    """Create typed node identifier tuple."""
    return (ntype, nid)


def add_node(G: nx.MultiDiGraph, ntype: NodeType, nid: str, **attrs) -> Tuple[str, str]:
    """
    Add typed node to knowledge graph.
    
    Args:
        G: Knowledge graph
        ntype: Node type (compound, target, etc.)
        nid: Node ID (unique within type)
        **attrs: Additional node attributes
    
    Returns:
        Node identifier tuple
    """
    node_id = _node(ntype, nid)
    G.add_node(node_id, ntype=ntype, nid=nid, **attrs)
    return node_id


def add_edge(
    G: nx.MultiDiGraph,
    src: Tuple[str, str],
    dst: Tuple[str, str],
    etype: EdgeType,
    evidence: Optional[Dict[str, Any]] = None,
    **attrs,
) -> None:
    """
    Add typed edge with evidence to knowledge graph.
    
    Args:
        G: Knowledge graph
        src: Source node tuple (type, id)
        dst: Destination node tuple (type, id)
        etype: Edge type
        evidence: Evidence dict with source, accession, confidence, etc.
        **attrs: Additional edge attributes
    """
    if evidence is None:
        evidence = {}
    
    G.add_edge(src, dst, key=etype, etype=etype, evidence=evidence, **attrs)


def neighbors_by_type(
    G: nx.MultiDiGraph, node: Tuple[str, str], ntype: NodeType, direction: str = "out"
) -> List[Tuple[str, str]]:
    """
    Get neighbors of a node filtered by type.
    
    Args:
        G: Knowledge graph
        node: Source node
        ntype: Desired neighbor type
        direction: 'out' (successors), 'in' (predecessors), or 'both'
    
    Returns:
        List of neighbor node tuples
    """
    if direction == "out":
        neighbors = G.successors(node)
    elif direction == "in":
        neighbors = G.predecessors(node)
    elif direction == "both":
        neighbors = set(G.successors(node)) | set(G.predecessors(node))
    else:
        raise ValueError(f"Invalid direction: {direction}")
    
    return [n for n in neighbors if G.nodes[n].get("ntype") == ntype]


def edges_by_type(
    G: nx.MultiDiGraph, node: Tuple[str, str], etype: EdgeType, direction: str = "out"
) -> List[Tuple[Tuple[str, str], Tuple[str, str], Dict[str, Any]]]:
    """
    Get edges from/to a node filtered by edge type.
    
    Returns:
        List of (src, dst, edge_data) tuples
    """
    results = []
    
    if direction in ("out", "both"):
        for _, dst, key, data in G.out_edges(node, keys=True, data=True):
            if data.get("etype") == etype:
                results.append((node, dst, data))
    
    if direction in ("in", "both"):
        for src, _, key, data in G.in_edges(node, keys=True, data=True):
            if data.get("etype") == etype:
                results.append((src, node, data))
    
    return results


def find_paths(
    G: nx.MultiDiGraph,
    src: Tuple[str, str],
    dst: Tuple[str, str],
    max_length: int = 4,
) -> List[List[Tuple[str, str]]]:
    """
    Find all simple paths between two nodes up to max_length.
    
    Args:
        G: Knowledge graph
        src: Source node
        dst: Destination node
        max_length: Maximum path length
    
    Returns:
        List of paths (each path is list of nodes)
    """
    try:
        paths = list(nx.all_simple_paths(G, src, dst, cutoff=max_length))
        return paths
    except nx.NetworkXNoPath:
        return []
    except Exception as e:
        logger.error(f"Error finding paths: {e}")
        return []


def subgraph_around_node(
    G: nx.MultiDiGraph, node: Tuple[str, str], radius: int = 1
) -> nx.MultiDiGraph:
    """
    Extract subgraph within radius hops of a node.
    
    Args:
        G: Full knowledge graph
        node: Center node
        radius: Number of hops to include
    
    Returns:
        Subgraph containing node and neighbors within radius
    """
    if node not in G:
        return new_kg()
    
    nodes_to_include = {node}
    current_layer = {node}
    
    for _ in range(radius):
        next_layer = set()
        for n in current_layer:
            next_layer.update(G.successors(n))
            next_layer.update(G.predecessors(n))
        nodes_to_include.update(next_layer)
        current_layer = next_layer
    
    return G.subgraph(nodes_to_include).copy()


def get_node_degree_centrality(G: nx.MultiDiGraph) -> Dict[Tuple[str, str], float]:
    """Calculate degree centrality for all nodes."""
    return nx.degree_centrality(G)


def get_betweenness_centrality(G: nx.MultiDiGraph) -> Dict[Tuple[str, str], float]:
    """Calculate betweenness centrality (importance as connector)."""
    return nx.betweenness_centrality(G)


def find_communities(G: nx.MultiDiGraph, algorithm: str = "louvain") -> List[Set[Tuple[str, str]]]:
    """
    Detect communities/clusters in the graph.
    
    Args:
        G: Knowledge graph
        algorithm: 'louvain', 'label_prop', or 'greedy'
    
    Returns:
        List of node sets (communities)
    """
    # Convert to undirected for community detection
    G_undirected = G.to_undirected()
    
    if algorithm == "louvain":
        try:
            import community as community_louvain
            partition = community_louvain.best_partition(G_undirected)
            communities = {}
            for node, comm_id in partition.items():
                communities.setdefault(comm_id, set()).add(node)
            return list(communities.values())
        except ImportError:
            logger.warning("python-louvain not installed, falling back to label propagation")
            algorithm = "label_prop"
    
    if algorithm == "label_prop":
        from networkx.algorithms import community
        return list(community.label_propagation_communities(G_undirected))
    
    if algorithm == "greedy":
        from networkx.algorithms import community
        return list(community.greedy_modularity_communities(G_undirected))
    
    raise ValueError(f"Unknown community algorithm: {algorithm}")


def export_to_dict(G: nx.MultiDiGraph) -> Dict[str, Any]:
    """Export knowledge graph to JSON-serializable dict."""
    return nx.node_link_data(G)


def import_from_dict(data: Dict[str, Any]) -> nx.MultiDiGraph:
    """Import knowledge graph from dict."""
    return nx.node_link_graph(data, multigraph=True, directed=True)
