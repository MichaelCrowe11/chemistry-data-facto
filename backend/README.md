# Natural Products Copilot Backend

Production-grade chemistry intelligence platform with RDKit, NetworkX, Polars, ORCID, and Zenodo integration.

## Features

- **Chemistry Intelligence**: RDKit-based structure standardization, descriptor calculation, fingerprints, substructure search
- **Knowledge Graphs**: NetworkX typed multigraphs for compound-target-assay relationships with evidence tracking
- **Dose-Response Analysis**: 4PL/5PL curve fitting with scipy, confidence intervals, synergy scoring (Bliss, HSA, Loewe)
- **Mixture Analysis**: Multi-component formulation tracking, mass balance validation, synergy assessment
- **Research Integration**: ORCID authentication and Zenodo data publication with DOI generation
- **Type Safety**: Pydantic models with strict validation and pint-based unit handling
- **High Performance**: Polars for dataframes, optimized for large-scale chemistry data

## Installation

```bash
cd backend
pip install -e .

# With optional dependencies
pip install -e ".[bayes,dev]"
```

## Quick Start

### Run API Server

```bash
# Set environment variables
export NP_ORCID_CLIENT_ID=your_orcid_client_id
export NP_ORCID_CLIENT_SECRET=your_orcid_secret
export NP_ZENODO_ACCESS_TOKEN=your_zenodo_token
export NP_ZENODO_USE_SANDBOX=true

# Start FastAPI server
python src/api.py
```

API will be available at `http://localhost:8000`

### Python Usage

```python
from crowe_copilot import chem_utils, models, kg

# Standardize SMILES
std_smiles = chem_utils.standardize_smiles("CCO")
descriptors = chem_utils.descriptors(std_smiles)

# Create compound model
compound = models.Compound(
    name="Ethanol",
    smiles=std_smiles,
    **descriptors,
    identifiers={"PubChem": "CID702"}
)

# Build knowledge graph
G = kg.new_kg()
c_node = kg.add_node(G, "compound", "C001", **compound.dict())
t_node = kg.add_node(G, "target", "T001", name="Example Target")
kg.add_edge(G, c_node, t_node, "ACTS_ON", {"confidence": "high"})
```

### Dose-Response Fitting

```python
from crowe_copilot.dose_response import auto_fit
import numpy as np

concentrations = np.array([0.1, 1, 10, 100, 1000])  # µM
responses = np.array([5, 25, 50, 75, 95])  # % inhibition

model, params, errors, r2 = auto_fit(concentrations, responses)
print(f"EC50: {params['ec50']:.2f} µM (R² = {r2:.3f})")
```

### ORCID Integration

```python
from crowe_copilot.orcid_client import ORCIDClient

client = ORCIDClient(sandbox=True)
auth_url = client.get_authorization_url()
# Redirect user to auth_url

# After OAuth callback with code:
token_data = await client.exchange_code_for_token(code)
profile = await client.get_profile(
    token_data["orcid"],
    token_data["access_token"]
)
```

### Zenodo Publication

```python
from crowe_copilot.zenodo_client import ZenodoClient, ZenodoMetadata

client = ZenodoClient(use_sandbox=True)

metadata = ZenodoMetadata(
    title="My Chemistry Dataset",
    description="Comprehensive assay results...",
    creators=[{
        "name": "Smith, Jane",
        "affiliation": "University",
        "orcid": "0000-0001-2345-6789"
    }],
    keywords=["natural products", "drug discovery"],
)

# Create deposition
deposition = await client.create_deposition(metadata)

# Upload file (not shown: file upload logic)

# Publish and get DOI
published = await client.publish_deposition(deposition.id)
print(f"DOI: {published.doi}")
```

## Testing

```bash
pytest
pytest --cov=src/crowe_copilot --cov-report=html
```

## API Endpoints

### Chemistry
- `POST /api/v1/chemistry/standardize` - Standardize SMILES and compute descriptors
- `POST /api/v1/chemistry/similarity` - Calculate Tanimoto similarity
- `GET /api/v1/chemistry/substructure` - Check substructure match

### ORCID
- `GET /api/v1/orcid/auth-url` - Get OAuth authorization URL
- `POST /api/v1/orcid/callback` - Handle OAuth callback
- `GET /api/v1/orcid/profile/{orcid_id}` - Fetch ORCID profile

### Zenodo
- `POST /api/v1/zenodo/create` - Create new deposition
- `POST /api/v1/zenodo/{id}/publish` - Publish deposition
- `GET /api/v1/zenodo/depositions` - List depositions
- `GET /api/v1/zenodo/{id}` - Get deposition details

### General
- `GET /health` - Health check
- `GET /api/v1/stats` - Platform statistics

## Configuration

Environment variables (prefix with `NP_`):

- `NP_ORCID_CLIENT_ID` - ORCID OAuth client ID
- `NP_ORCID_CLIENT_SECRET` - ORCID OAuth secret
- `NP_ORCID_REDIRECT_URI` - OAuth redirect URI
- `NP_ZENODO_ACCESS_TOKEN` - Zenodo API token
- `NP_ZENODO_USE_SANDBOX` - Use Zenodo sandbox (default: true)
- `NP_LOG_LEVEL` - Logging level (default: INFO)
- `NP_DATABASE_URL` - Database connection string (optional)
- `NP_REDIS_URL` - Redis cache URL (optional)

## Architecture

```
backend/
├── src/crowe_copilot/
│   ├── config.py          # Configuration with env vars
│   ├── models.py          # Pydantic domain models
│   ├── chem_utils.py      # RDKit chemistry utilities
│   ├── tabular.py         # Polars dataframe schemas
│   ├── kg.py              # NetworkX knowledge graphs
│   ├── dose_response.py   # Curve fitting (4PL/5PL)
│   ├── mixtures.py        # Synergy scoring (Bliss/HSA/Loewe)
│   ├── units.py           # Pint unit handling
│   ├── orcid_client.py    # ORCID OAuth/API
│   ├── zenodo_client.py   # Zenodo publication
│   ├── io_local.py        # File I/O utilities
│   └── io_registry.py     # Data source fetch stubs
├── tests/                 # Comprehensive test suite
└── src/api.py            # FastAPI application
```

## Dependencies

**Core**: RDKit, NetworkX, Polars, Pydantic, FastAPI, httpx, pint, scipy, scikit-learn

**Optional**: pymc (Bayesian), arviz, python-louvain (graph clustering)

**Dev**: pytest, hypothesis, black, ruff, mypy

## License

See LICENSE file in repository root.
