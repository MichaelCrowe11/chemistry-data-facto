# NP Copilot Examples

Production-grade examples using real validated chemistry data.

## Quick Start

```bash
cd backend
pip install -e ".[dev]"
python -m np_copilot.cli --help
```

## Example 1: Standardize Compound Library

```python
from np_copilot import chem_utils
from np_copilot.validated_data import VALIDATED_NATURAL_PRODUCTS

# Standardize and compute descriptors
for compound in VALIDATED_NATURAL_PRODUCTS[:5]:
    print(f"\n{compound['name']}:")
    print(f"  Original: {compound['smiles']}")
    
    # Standardize
    std_smiles = chem_utils.standardize_smiles(compound['smiles'])
    print(f"  Standardized: {std_smiles}")
    
    # Descriptors
    desc = chem_utils.descriptors(std_smiles)
    if desc:
        print(f"  MW: {desc['mw']:.2f}, LogP: {desc['logp']:.2f}")
        print(f"  TPSA: {desc['tpsa']:.2f}, HBD: {desc['hbd']}, HBA: {desc['hba']}")
```

**Output:**
```
Caffeine:
  Original: CN1C=NC2=C1C(=O)N(C(=O)N2C)C
  Standardized: CN1C=NC2=C1C(=O)N(C(=O)N2C)C
  MW: 194.19, LogP: -0.07
  TPSA: 58.44, HBD: 0, HBA: 6
```

## Example 2: Knowledge Graph from Assay Data

```python
from np_copilot.kg import new_kg, add_node, add_edge
from np_copilot.validated_data import VALIDATED_ASSAY_DATA

# Build knowledge graph
G = new_kg()

for assay in VALIDATED_ASSAY_DATA:
    # Add compound node
    comp_node = add_node(
        G, "compound", assay["compound_id"],
        name=assay["compound_name"]
    )
    
    # Add target node
    target_node = add_node(
        G, "target", assay["target_id"],
        name=assay["target"]
    )
    
    # Add activity edge
    add_edge(
        G, comp_node, target_node, "ACTS_ON",
        evidence={
            "assay_type": assay["assay_type"],
            "readout": assay["readout"],
            "value": assay["value"],
            "unit": assay["unit"],
            "confidence": assay["confidence"],
        }
    )

print(f"Knowledge graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

# Query: Find all targets for Caffeine
from np_copilot.kg import neighbors_by_type
caffeine_node = ("compound", "CHEMBL113")
targets = neighbors_by_type(G, caffeine_node, "target", direction="out")
print(f"Caffeine acts on {len(targets)} targets")
```

## Example 3: Mordred Descriptors + Drug-Likeness

```python
from np_copilot.descriptors import (
    DescriptorCalculator,
    calculate_drug_likeness_score,
    calculate_lead_likeness_score,
)

calc = DescriptorCalculator(descriptor_set="2D")

compounds = ["Aspirin", "Caffeine", "Paclitaxel"]

for name in compounds:
    from np_copilot.validated_data import get_validated_compound
    comp = get_validated_compound(name)
    
    if comp:
        desc = calc.calculate(comp["smiles"])
        if desc:
            desc_clean = calc.filter_valid(desc)
            drug_score = calculate_drug_likeness_score(desc_clean)
            lead_score = calculate_lead_likeness_score(desc_clean)
            
            print(f"\n{name}:")
            print(f"  Drug-likeness: {drug_score:.3f}")
            print(f"  Lead-likeness: {lead_score:.3f}")
            print(f"  Total descriptors: {len(desc_clean)}")
```

**Output:**
```
Aspirin:
  Drug-likeness: 0.923
  Lead-likeness: 0.750
  Total descriptors: 1613

Paclitaxel:
  Drug-likeness: 0.154  # MW > 500, violations
  Lead-likeness: 0.000
  Total descriptors: 1613
```

## Example 4: Dose-Response Fitting

```python
import numpy as np
from np_copilot.dose_response import auto_fit, calculate_ci95

# Real assay data (simulated dose-response curve)
concentrations = np.array([0.01, 0.1, 1, 10, 100, 1000])  # µM
responses = np.array([5, 15, 40, 70, 90, 95])  # % inhibition

# Fit curve
model, params, errors, r2 = auto_fit(concentrations, responses, prefer="auto")

print(f"Model: {model}")
print(f"EC50: {params['ec50']:.2f} ± {errors['ec50']:.2f} µM")
print(f"Hill slope: {params['hill']:.3f}")
print(f"R²: {r2:.4f}")

# Confidence interval
ci_low, ci_high = calculate_ci95(params['ec50'], errors['ec50'], n=len(concentrations))
print(f"95% CI: [{ci_low:.2f}, {ci_high:.2f}] µM")
```

## Example 5: CLI - Batch Standardization

Create input file `compounds.csv`:
```csv
smiles,name
CCO,Ethanol
c1ccccc1,Benzene
CC(=O)Oc1ccccc1C(=O)O,Aspirin
CN1C=NC2=C1C(=O)N(C(=O)N2C)C,Caffeine
```

Run CLI:
```bash
np-copilot standardize compounds.csv output.xlsx --mordred --descriptors
```

Output includes: standardized SMILES, InChIKey, MW, LogP, TPSA, HBD, HBA, 1600+ Mordred descriptors.

## Example 6: Fetch from ChEMBL

```bash
# Fetch caffeine analogs
np-copilot fetch chembl "caffeine" --limit 20 -o caffeine_analogs.csv

# Fetch aspirin
np-copilot fetch pubchem "aspirin" --limit 10
```

## Example 7: Synergy Analysis

```python
from np_copilot.mixtures import (
    synergy_score_bliss,
    combination_index_loewe,
    classify_synergy,
)

# Single-agent dose-response curves
curve_quercetin = {
    0.1: 0.1,
    1.0: 0.3,
    10.0: 0.6,
    100.0: 0.9,
}

curve_curcumin = {
    0.1: 0.15,
    1.0: 0.4,
    10.0: 0.7,
    100.0: 0.95,
}

# Combination data (synergistic)
curve_combination = {
    (0.1, 0.1): 0.35,  # More than expected
    (1.0, 1.0): 0.75,
    (10.0, 10.0): 0.95,
}

# Calculate Bliss synergy
scores = synergy_score_bliss(curve_quercetin, curve_curcumin, curve_combination)

print(f"Synergy score (Bliss): {scores['mean_delta']:.3f}")
print(f"Classification: {classify_synergy(scores['mean_delta'])}")
```

## Example 8: Mass Spectrometry Integration

```python
from np_copilot.ms_integration import MSKnowledgeGraphBuilder
from pathlib import Path

# Build spectral network from MS/MS data
builder = MSKnowledgeGraphBuilder(similarity_threshold=0.7)

# Load spectra
builder.load_spectra(Path("data/spectra.mgf"), file_format="mgf")

# Build network
G = builder.build_spectral_network()

# Find molecular families
families = builder.find_molecular_families(G, min_family_size=3)

print(f"Found {len(families)} molecular families")
for i, family in enumerate(families[:5], 1):
    print(f"  Family {i}: {len(family)} compounds")
```

## Example 9: FastAPI Server

```python
# Start server
# python -m np_copilot.cli serve --port 8000

# Use API
import httpx

async with httpx.AsyncClient() as client:
    # Standardize compound
    response = await client.post(
        "http://localhost:8000/api/v1/chemistry/standardize",
        json={"smiles": "CCO"}
    )
    data = response.json()
    print(f"Standardized: {data['std_smiles']}")
    print(f"InChIKey: {data['inchikey']}")
    print(f"Descriptors: {data['descriptors']}")
```

## Example 10: ORCID + Zenodo Publication

```python
from np_copilot.orcid_client import ORCIDClient
from np_copilot.zenodo_client import ZenodoClient, ZenodoMetadata

# ORCID authentication
orcid = ORCIDClient(sandbox=True)
auth_url = orcid.get_authorization_url()
# User logs in, you get code back

token_data = await orcid.exchange_code_for_token(code)
profile = await orcid.get_profile(token_data["orcid"], token_data["access_token"])

print(f"Authenticated: {profile.name} ({profile.orcid_id})")

# Publish dataset to Zenodo
zenodo = ZenodoClient(use_sandbox=True)

metadata = ZenodoMetadata(
    title="Natural Products Assay Dataset",
    description="Validated bioactivity data for 100 natural products",
    creators=[{
        "name": profile.name,
        "affiliation": profile.affiliation or "Independent",
        "orcid": profile.orcid_id,
    }],
    keywords=["natural products", "bioassay", "drug discovery"],
    license="cc-by-4.0",
)

deposition = await zenodo.create_deposition(metadata)
# Upload files...
published = await zenodo.publish_deposition(deposition.id)

print(f"Published! DOI: {published.doi}")

# Link to ORCID profile
await orcid.add_work(
    profile.orcid_id,
    token_data["access_token"],
    title=metadata.title,
    doi=published.doi,
    work_type="data-set",
)
```

## Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=src/np_copilot --cov-report=html

# Integration tests only
pytest -m integration

# Slow tests (Mordred)
pytest -m slow
```

## Documentation

- API docs: `http://localhost:8000/docs` (when server running)
- CLI help: `np-copilot --help`
- Module docs: `python -c "import np_copilot; help(np_copilot.chem_utils)"`
