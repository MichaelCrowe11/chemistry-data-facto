"""Mass spectrometry integration with matchms and knowledge graph bridges."""

from __future__ import annotations

from typing import List, Dict, Any, Optional, Tuple
import logging
from pathlib import Path

import numpy as np
import networkx as nx

logger = logging.getLogger(__name__)

try:
    from matchms import Spectrum
    from matchms.importing import load_from_mgf, load_from_msp, load_from_json
    from matchms.filtering import (
        default_filters,
        normalize_intensities,
        select_by_mz,
        require_minimum_number_of_peaks,
    )
    from matchms.similarity import CosineGreedy, ModifiedCosine
    from matchms.networking import SimilarityNetwork
    MATCHMS_AVAILABLE = True
except ImportError:
    MATCHMS_AVAILABLE = False
    Spectrum = None

from .kg import new_kg, add_node, add_edge, _node, NodeType, EdgeType


class MSKnowledgeGraphBuilder:
    """Build knowledge graphs from MS/MS spectral data."""
    
    def __init__(self, similarity_threshold: float = 0.7):
        """
        Initialize MS->KG builder.
        
        Args:
            similarity_threshold: Min cosine similarity to create edge
        """
        if not MATCHMS_AVAILABLE:
            raise ImportError("matchms not available. Install with: pip install matchms")
        
        self.similarity_threshold = similarity_threshold
        self.spectra: List[Spectrum] = []
        self.similarity_scorer = CosineGreedy(tolerance=0.02)
    
    def load_spectra(self, file_path: Path, file_format: str = "mgf") -> int:
        """
        Load MS/MS spectra from file.
        
        Args:
            file_path: Path to spectrum file
            file_format: "mgf", "msp", or "json"
        
        Returns:
            Number of spectra loaded
        """
        if file_format == "mgf":
            spectra = list(load_from_mgf(str(file_path)))
        elif file_format == "msp":
            spectra = list(load_from_msp(str(file_path)))
        elif file_format == "json":
            spectra = list(load_from_json(str(file_path)))
        else:
            raise ValueError(f"Unsupported format: {file_format}")
        
        # Apply default filters
        spectra = [default_filters(s) for s in spectra]
        spectra = [normalize_intensities(s) for s in spectra]
        spectra = [
            require_minimum_number_of_peaks(s, n_required=5)
            for s in spectra
            if s is not None
        ]
        
        self.spectra.extend([s for s in spectra if s is not None])
        logger.info(f"Loaded {len(spectra)} spectra from {file_path}")
        return len(spectra)
    
    def build_spectral_network(self) -> nx.MultiDiGraph:
        """
        Build spectral similarity network as knowledge graph.
        
        Returns:
            Knowledge graph with spectrum nodes and similarity edges
        """
        G = new_kg()
        
        # Add spectrum nodes
        spectrum_nodes = {}
        for i, spectrum in enumerate(self.spectra):
            spectrum_id = spectrum.get("spectrum_id", f"SPEC_{i:06d}")
            compound_name = spectrum.get("compound_name", "Unknown")
            precursor_mz = spectrum.get("precursor_mz", 0)
            
            node = add_node(
                G,
                "compound",  # Using compound node type
                spectrum_id,
                name=compound_name,
                spectrum_id=spectrum_id,
                precursor_mz=float(precursor_mz) if precursor_mz else None,
                num_peaks=len(spectrum.peaks.mz) if spectrum.peaks else 0,
                source="MS/MS",
            )
            spectrum_nodes[i] = (node, spectrum)
        
        # Calculate pairwise similarities and add edges
        n_spectra = len(self.spectra)
        for i in range(n_spectra):
            for j in range(i + 1, n_spectra):
                spec1 = self.spectra[i]
                spec2 = self.spectra[j]
                
                try:
                    score = self.similarity_scorer.pair(spec1, spec2)
                    similarity = score.get("score", 0.0)
                    
                    if similarity >= self.similarity_threshold:
                        node1, _ = spectrum_nodes[i]
                        node2, _ = spectrum_nodes[j]
                        
                        add_edge(
                            G,
                            node1,
                            node2,
                            "SIMILAR_TO",
                            evidence={
                                "source": "matchms",
                                "method": "CosineGreedy",
                                "similarity": float(similarity),
                                "confidence": "high" if similarity > 0.9 else "medium",
                            },
                            weight=float(similarity),
                        )
                except Exception as e:
                    logger.debug(f"Error calculating similarity {i}-{j}: {e}")
                    continue
        
        logger.info(
            f"Built spectral network: {G.number_of_nodes()} nodes, "
            f"{G.number_of_edges()} edges"
        )
        return G
    
    def annotate_with_structures(
        self, G: nx.MultiDiGraph, compound_mapping: Dict[str, str]
    ) -> nx.MultiDiGraph:
        """
        Annotate spectral network with chemical structures.
        
        Args:
            G: Spectral network graph
            compound_mapping: {spectrum_id: smiles} mapping
        
        Returns:
            Updated graph with structure annotations
        """
        for node in G.nodes():
            node_type, node_id = node
            if node_type != "compound":
                continue
            
            spectrum_id = G.nodes[node].get("spectrum_id")
            if spectrum_id and spectrum_id in compound_mapping:
                smiles = compound_mapping[spectrum_id]
                G.nodes[node]["smiles"] = smiles
                
                # Add structure-based descriptors
                from .chem_utils import descriptors, to_inchikey
                desc = descriptors(smiles)
                if desc:
                    G.nodes[node].update(desc)
                
                inchikey = to_inchikey(smiles)
                if inchikey:
                    G.nodes[node]["inchikey"] = inchikey
        
        return G
    
    def find_molecular_families(
        self, G: nx.MultiDiGraph, min_family_size: int = 3
    ) -> List[List[Tuple[str, str]]]:
        """
        Identify molecular families (clusters) in spectral network.
        
        Args:
            G: Spectral network
            min_family_size: Minimum cluster size
        
        Returns:
            List of families (each family is list of node tuples)
        """
        # Convert to undirected for clustering
        G_undirected = G.to_undirected()
        
        # Find connected components
        families = []
        for component in nx.connected_components(G_undirected):
            if len(component) >= min_family_size:
                families.append(list(component))
        
        logger.info(f"Found {len(families)} molecular families")
        return families
    
    def export_for_gnps(self, output_path: Path) -> None:
        """
        Export spectral network in GNPS-compatible format.
        
        Args:
            output_path: Output .graphml or .cyjs file
        """
        if not self.spectra:
            raise ValueError("No spectra loaded")
        
        # Build network
        G = self.build_spectral_network()
        
        # Export
        if output_path.suffix == ".graphml":
            nx.write_graphml(G, str(output_path))
        elif output_path.suffix == ".cyjs":
            from networkx.readwrite import cytoscape_data
            cyto_data = cytoscape_data(G)
            import json
            with output_path.open("w") as f:
                json.dump(cyto_data, f, indent=2)
        else:
            raise ValueError(f"Unsupported format: {output_path.suffix}")
        
        logger.info(f"Exported spectral network to {output_path}")


def calculate_spectral_entropy(spectrum: Any) -> float:
    """
    Calculate spectral entropy (measure of complexity).
    
    Args:
        spectrum: matchms Spectrum object
    
    Returns:
        Entropy value (higher = more complex)
    """
    if not hasattr(spectrum, "peaks") or spectrum.peaks is None:
        return 0.0
    
    intensities = spectrum.peaks.intensities
    if len(intensities) == 0:
        return 0.0
    
    # Normalize to probabilities
    probs = intensities / np.sum(intensities)
    
    # Calculate Shannon entropy
    entropy = -np.sum(probs * np.log2(probs + 1e-10))
    return float(entropy)


def filter_by_precursor_mass(
    spectra: List[Any], min_mz: float, max_mz: float
) -> List[Any]:
    """Filter spectra by precursor m/z range."""
    filtered = []
    for spec in spectra:
        precursor_mz = spec.get("precursor_mz")
        if precursor_mz and min_mz <= precursor_mz <= max_mz:
            filtered.append(spec)
    return filtered


def merge_consensus_spectrum(
    spectra: List[Any], tolerance: float = 0.02
) -> Optional[Any]:
    """
    Merge multiple spectra into consensus spectrum.
    
    Args:
        spectra: List of matchms Spectrum objects
        tolerance: m/z tolerance for peak matching
    
    Returns:
        Consensus spectrum
    """
    if not spectra:
        return None
    
    # Simple implementation: average intensities of matched peaks
    # Production would use more sophisticated algorithms
    
    all_mz = []
    all_int = []
    
    for spec in spectra:
        if hasattr(spec, "peaks") and spec.peaks is not None:
            all_mz.extend(spec.peaks.mz)
            all_int.extend(spec.peaks.intensities)
    
    if not all_mz:
        return None
    
    # Bin peaks by m/z
    from collections import defaultdict
    binned = defaultdict(list)
    
    for mz, intensity in zip(all_mz, all_int):
        bin_key = round(mz / tolerance) * tolerance
        binned[bin_key].append(intensity)
    
    # Average intensities per bin
    consensus_mz = []
    consensus_int = []
    
    for bin_mz, intensities in sorted(binned.items()):
        consensus_mz.append(bin_mz)
        consensus_int.append(np.mean(intensities))
    
    # Create consensus spectrum (simplified)
    if MATCHMS_AVAILABLE:
        from matchms import Spectrum
        consensus = Spectrum(
            mz=np.array(consensus_mz),
            intensities=np.array(consensus_int),
            metadata={
                "compound_name": "Consensus",
                "num_merged": len(spectra),
            },
        )
        return normalize_intensities(consensus)
    
    return None
