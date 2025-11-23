"""FastAPI application integrating NP Copilot with frontend."""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from pydantic import BaseModel

from crowe_copilot.models import (
    Compound,
    Reaction,
    ReactionResult,
    RetrosynthesisResult,
    Spectrum,
    SpectrumMatch,
    DoseResponse,
    DoseResponseResult,
    MixtureAnalysisResult,
    MixtureComponent,
)
from crowe_copilot.config import CFG
from crowe_copilot import chem_utils
from crowe_copilot.orcid_client import ORCIDClient, ORCIDProfile
from crowe_copilot.zenodo_client import ZenodoClient, ZenodoMetadata, ZenodoDeposition

logging.basicConfig(level=CFG.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Chemistry Data Platform API",
    description="Natural Products Analysis with ORCID/Zenodo Integration",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class CompoundStandardizeRequest(BaseModel):
    smiles: str


class CompoundStandardizeResponse(BaseModel):
    smiles: str
    std_smiles: Optional[str]
    inchi: Optional[str]
    inchikey: Optional[str]
    descriptors: Optional[Dict[str, float]]
    lipinski_violations: List[str]


class SimilarityRequest(BaseModel):
    smiles1: str
    smiles2: str
    radius: int = 2


class PublishToZenodoRequest(BaseModel):
    title: str
    description: str
    creators: List[Dict[str, str]]
    keywords: List[str] = []
    license: str = "cc-by-4.0"
    upload_type: str = "dataset"


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
    }


# Chemistry endpoints
@app.post("/api/v1/chemistry/standardize", response_model=CompoundStandardizeResponse)
async def standardize_compound(request: CompoundStandardizeRequest):
    """
    Standardize SMILES and compute descriptors.
    """
    std_smiles = chem_utils.standardize_smiles(request.smiles)
    inchi = chem_utils.to_inchi(request.smiles)
    inchikey = chem_utils.to_inchikey(request.smiles)
    desc = chem_utils.descriptors(request.smiles)
    
    violations = []
    if desc:
        violations = chem_utils.lipinski_violations(desc)
    
    return CompoundStandardizeResponse(
        smiles=request.smiles,
        std_smiles=std_smiles,
        inchi=inchi,
        inchikey=inchikey,
        descriptors=desc,
        lipinski_violations=violations,
    )


@app.post("/api/v1/chemistry/similarity")
async def calculate_similarity(request: SimilarityRequest):
    """Calculate Tanimoto similarity between two molecules."""
    sim = chem_utils.tanimoto_similarity(
        request.smiles1, request.smiles2, radius=request.radius
    )
    
    if sim is None:
        raise HTTPException(status_code=400, detail="Invalid SMILES or RDKit not available")
    
    return {"similarity": sim, "method": f"Morgan_r{request.radius}"}


@app.get("/api/v1/chemistry/substructure")
async def check_substructure(smiles: str = Query(...), smarts: str = Query(...)):
    """Check if molecule contains substructure."""
    result = chem_utils.has_substructure(smiles, smarts)
    
    if result is None:
        raise HTTPException(status_code=400, detail="Invalid SMILES/SMARTS")
    
    return {"has_substructure": result, "smiles": smiles, "smarts": smarts}


# ORCID endpoints
@app.get("/api/v1/orcid/auth-url")
async def get_orcid_auth_url(sandbox: bool = False):
    """Get ORCID OAuth authorization URL."""
    client = ORCIDClient(sandbox=sandbox)
    url = client.get_authorization_url(scope="/authenticate")
    return {"auth_url": url}


@app.post("/api/v1/orcid/callback")
async def orcid_callback(code: str, sandbox: bool = False):
    """Handle ORCID OAuth callback."""
    client = ORCIDClient(sandbox=sandbox)
    
    try:
        token_data = await client.exchange_code_for_token(code)
        profile = await client.get_profile(
            token_data["orcid"], token_data["access_token"]
        )
        
        return {
            "success": True,
            "profile": profile.dict(),
            "token": token_data["access_token"],
        }
    except Exception as e:
        logger.error(f"ORCID callback error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/orcid/profile/{orcid_id}")
async def get_orcid_profile(
    orcid_id: str, access_token: str = Query(...), sandbox: bool = False
):
    """Fetch ORCID profile."""
    client = ORCIDClient(sandbox=sandbox)
    
    try:
        profile = await client.get_profile(orcid_id, access_token)
        return profile.dict()
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# Zenodo endpoints
@app.post("/api/v1/zenodo/create", response_model=ZenodoDeposition)
async def create_zenodo_deposition(request: PublishToZenodoRequest):
    """Create new Zenodo deposition (draft)."""
    client = ZenodoClient(use_sandbox=CFG.zenodo_use_sandbox)
    
    if not client.access_token:
        raise HTTPException(
            status_code=401, detail="Zenodo access token not configured"
        )
    
    metadata = ZenodoMetadata(
        title=request.title,
        description=request.description,
        creators=request.creators,
        keywords=request.keywords,
        license=request.license,
        upload_type=request.upload_type,
    )
    
    try:
        deposition = await client.create_deposition(metadata)
        return deposition
    except Exception as e:
        logger.error(f"Zenodo create error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/zenodo/{deposition_id}/publish", response_model=ZenodoDeposition)
async def publish_zenodo_deposition(deposition_id: int):
    """Publish Zenodo deposition (assign DOI)."""
    client = ZenodoClient(use_sandbox=CFG.zenodo_use_sandbox)
    
    try:
        deposition = await client.publish_deposition(deposition_id)
        return deposition
    except Exception as e:
        logger.error(f"Zenodo publish error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/zenodo/depositions", response_model=List[ZenodoDeposition])
async def list_zenodo_depositions():
    """List all Zenodo depositions for authenticated user."""
    client = ZenodoClient(use_sandbox=CFG.zenodo_use_sandbox)
    
    try:
        depositions = await client.list_depositions()
        return depositions
    except Exception as e:
        logger.error(f"Zenodo list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/zenodo/{deposition_id}", response_model=ZenodoDeposition)
async def get_zenodo_deposition(deposition_id: int):
    """Get Zenodo deposition details."""
    client = ZenodoClient(use_sandbox=CFG.zenodo_use_sandbox)
    
    try:
        deposition = await client.get_deposition(deposition_id)
        return deposition
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# Statistics
@app.get("/api/v1/stats")
async def get_stats():
    """Get platform statistics."""
    return {
        "version": "0.1.0",
        "rdkit_available": chem_utils.RDKIT_AVAILABLE,
        "orcid_configured": CFG.orcid_client_id is not None,
        "zenodo_configured": CFG.zenodo_access_token is not None,
        "zenodo_mode": "sandbox" if CFG.zenodo_use_sandbox else "production",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
