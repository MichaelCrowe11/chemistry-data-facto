"""Integration tests using validated real-world chemistry data."""

import pytest
from crowe_copilot.validated_data import (
    VALIDATED_NATURAL_PRODUCTS,
    VALIDATED_ASSAY_DATA,
    get_validated_compound,
    get_test_smiles,
)
from crowe_copilot import chem_utils
from crowe_copilot.models import Compound, AssayResult, Evidence
from crowe_copilot.kg import new_kg, add_node, add_edge


class TestValidatedData:
    """Tests with real validated chemistry data."""
    
    def test_validated_compounds_standardize(self):
        """Test that validated SMILES standardize correctly."""
        for comp_data in VALIDATED_NATURAL_PRODUCTS:
            smiles = comp_data["smiles"]
            std_smiles = chem_utils.standardize_smiles(smiles)
            
            assert std_smiles is not None, f"Failed to standardize {comp_data['name']}"
            
            # Check InChIKey matches
            inchikey = chem_utils.to_inchikey(std_smiles)
            assert inchikey == comp_data["inchikey"], \
                f"InChIKey mismatch for {comp_data['name']}"
    
    def test_validated_descriptors(self):
        """Test descriptor calculation on validated compounds."""
        for comp_data in VALIDATED_NATURAL_PRODUCTS:
            smiles = comp_data["smiles"]
            desc = chem_utils.descriptors(smiles)
            
            if desc is None:
                continue
            
            # Check MW is close to known value (tolerance for rounding)
            calc_mw = desc.get("mw")
            known_mw = comp_data["mw"]
            assert abs(calc_mw - known_mw) < 1.0, \
                f"MW mismatch for {comp_data['name']}: {calc_mw} vs {known_mw}"
    
    def test_create_validated_compound_models(self):
        """Test creating Pydantic models from validated data."""
        for comp_data in VALIDATED_NATURAL_PRODUCTS:
            compound = Compound(
                name=comp_data["name"],
                smiles=comp_data["smiles"],
                std_smiles=chem_utils.standardize_smiles(comp_data["smiles"]),
                inchikey=comp_data["inchikey"],
                formula=comp_data["formula"],
                mw=comp_data["mw"],
                identifiers={
                    k: v for k, v in {
                        "ChEMBL": comp_data.get("chembl_id"),
                        "PubChem": comp_data.get("pubchem_cid"),
                    }.items() if v
                },
                evidence=[
                    Evidence(
                        source="Literature",
                        accession=comp_data.get("chembl_id", "manual"),
                        confidence="high",
                        note=f"Natural source: {comp_data['source']}",
                    )
                ],
            )
            
            assert compound.name == comp_data["name"]
            assert compound.lipinski_ro5_pass() is not None
    
    def test_build_kg_from_validated_assays(self):
        """Test building knowledge graph from validated assay data."""
        G = new_kg()
        
        # Add compounds
        compound_nodes = {}
        for comp_data in VALIDATED_NATURAL_PRODUCTS:
            node = add_node(
                G, "compound", comp_data.get("chembl_id", comp_data["name"]),
                name=comp_data["name"],
                smiles=comp_data["smiles"],
                inchikey=comp_data["inchikey"],
            )
            compound_nodes[comp_data["name"]] = node
        
        # Add targets and assay edges
        target_nodes = {}
        for assay in VALIDATED_ASSAY_DATA:
            target_name = assay["target"]
            
            if target_name not in target_nodes:
                target_node = add_node(
                    G, "target", assay["target_id"],
                    name=target_name,
                )
                target_nodes[target_name] = target_node
            
            # Add compound-target edge
            comp_node = compound_nodes.get(assay["compound_name"])
            if comp_node:
                add_edge(
                    G, comp_node, target_nodes[target_name], "ACTS_ON",
                    evidence={
                        "source": assay["source"],
                        "assay_type": assay["assay_type"],
                        "readout": assay["readout"],
                        "value": assay["value"],
                        "unit": assay["unit"],
                        "confidence": assay["confidence"],
                    },
                )
        
        # Validate graph structure
        assert G.number_of_nodes() >= len(VALIDATED_ASSAY_DATA)
        assert G.number_of_edges() >= len(VALIDATED_ASSAY_DATA)
        
        # Check specific known relationship
        caffeine_node = compound_nodes.get("Caffeine")
        if caffeine_node:
            neighbors = list(G.successors(caffeine_node))
            assert len(neighbors) > 0, "Caffeine should have target connections"
    
    def test_fingerprint_similarity_on_validated(self):
        """Test fingerprint similarity on known similar compounds."""
        # Quercetin and Resveratrol are both polyphenols
        quercetin = get_validated_compound("Quercetin")
        resveratrol = get_validated_compound("Resveratrol")
        
        if quercetin and resveratrol:
            sim = chem_utils.tanimoto_similarity(
                quercetin["smiles"], resveratrol["smiles"]
            )
            
            # Should have some similarity (both polyphenols)
            assert sim is not None
            assert sim > 0.2, "Polyphenols should have some structural similarity"
        
        # Caffeine and Morphine should be dissimilar
        caffeine = get_validated_compound("Caffeine")
        morphine = get_validated_compound("Morphine")
        
        if caffeine and morphine:
            sim = chem_utils.tanimoto_similarity(
                caffeine["smiles"], morphine["smiles"]
            )
            
            assert sim is not None
            assert sim < 0.5, "Caffeine and Morphine should be structurally different"
    
    def test_substructure_search_on_validated(self):
        """Test substructure matching with known patterns."""
        # Phenol pattern (benzene with OH)
        phenol_smarts = "c1ccccc1O"
        
        # Quercetin has multiple phenol groups
        quercetin = get_validated_compound("Quercetin")
        if quercetin:
            has_phenol = chem_utils.has_substructure(
                quercetin["smiles"], phenol_smarts
            )
            assert has_phenol is True, "Quercetin should contain phenol groups"
        
        # Caffeine does not have phenol
        caffeine = get_validated_compound("Caffeine")
        if caffeine:
            has_phenol = chem_utils.has_substructure(
                caffeine["smiles"], phenol_smarts
            )
            assert has_phenol is False, "Caffeine should not contain phenol"


class TestMordredOnValidated:
    """Test Mordred descriptors on validated compounds."""
    
    @pytest.mark.slow
    def test_mordred_descriptors(self):
        """Test Mordred descriptor calculation."""
        try:
            from crowe_copilot.descriptors import DescriptorCalculator
        except ImportError:
            pytest.skip("Mordred not installed")
        
        calc = DescriptorCalculator(descriptor_set="2D")
        
        for comp_data in VALIDATED_NATURAL_PRODUCTS[:3]:  # Test first 3
            desc = calc.calculate(comp_data["smiles"])
            
            assert desc is not None
            assert len(desc) > 100, "Should calculate many descriptors"
            
            # Filter valid
            valid_desc = calc.filter_valid(desc)
            assert len(valid_desc) > 50, "Should have many valid descriptors"
    
    @pytest.mark.slow
    def test_drug_likeness_on_validated(self):
        """Test drug-likeness scoring."""
        try:
            from crowe_copilot.descriptors import (
                DescriptorCalculator,
                calculate_drug_likeness_score,
                calculate_lead_likeness_score,
            )
        except ImportError:
            pytest.skip("Mordred not installed")
        
        calc = DescriptorCalculator(descriptor_set="2D")
        
        # Aspirin should be very drug-like
        aspirin = get_validated_compound("Aspirin")
        if aspirin:
            desc = calc.calculate(aspirin["smiles"])
            if desc:
                drug_score = calculate_drug_likeness_score(desc)
                assert drug_score > 0.8, "Aspirin is a known drug"
        
        # Paclitaxel violates many rules (large MW)
        paclitaxel = get_validated_compound("Paclitaxel")
        if paclitaxel:
            desc = calc.calculate(paclitaxel["smiles"])
            if desc:
                drug_score = calculate_drug_likeness_score(desc)
                # Still a drug but poor Lipinski score
                assert drug_score < 0.6, "Paclitaxel has poor drug-likeness score"


@pytest.mark.integration
class TestFullPipeline:
    """End-to-end integration tests."""
    
    def test_full_standardization_pipeline(self):
        """Test complete standardization workflow."""
        results = []
        
        for comp_data in VALIDATED_NATURAL_PRODUCTS:
            # Standardize
            std_smiles = chem_utils.standardize_smiles(comp_data["smiles"])
            
            if not std_smiles:
                continue
            
            # Calculate descriptors
            desc = chem_utils.descriptors(std_smiles)
            
            # Create model
            compound = Compound(
                name=comp_data["name"],
                smiles=comp_data["smiles"],
                std_smiles=std_smiles,
                inchikey=chem_utils.to_inchikey(std_smiles),
                **desc if desc else {},
            )
            
            results.append(compound)
        
        assert len(results) >= 8, "Should process most validated compounds"
        
        # Check all have required fields
        for comp in results:
            assert comp.std_smiles is not None
            assert comp.inchikey is not None
