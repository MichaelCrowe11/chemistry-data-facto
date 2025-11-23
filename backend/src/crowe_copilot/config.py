"""Configuration and settings for NP Copilot."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, HttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DataSources(BaseModel):
    """External chemistry data source URLs."""

    chembl_url: HttpUrl = Field(
        default="https://www.ebi.ac.uk/chembl/api/data",
        description="ChEMBL REST API base URL",
    )
    pubchem_url: HttpUrl = Field(
        default="https://pubchem.ncbi.nlm.nih.gov/rest/pug",
        description="PubChem PUG REST API",
    )
    gnps_url: HttpUrl = Field(
        default="https://gnps.ucsd.edu/ProteoSAFe",
        description="GNPS mass spectrometry knowledge base",
    )
    npass_url: HttpUrl = Field(
        default="http://bidd.group/NPASS", description="NPASS natural products database"
    )
    unpd_url: HttpUrl = Field(
        default="https://www.undp.org/", description="Universal Natural Products Database"
    )
    foodb_url: HttpUrl = Field(default="https://foodb.ca/", description="FooDB food compounds")
    timeout_s: int = Field(default=30, ge=1, le=300, description="API request timeout")


class RunConfig(BaseSettings):
    """Runtime configuration with environment variable support."""

    model_config = SettingsConfigDict(
        env_prefix="NP_", env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    seed: int = Field(default=7, description="Random seed for reproducibility")
    log_level: str = Field(default="INFO", description="Logging level")
    max_candidates: int = Field(
        default=500, ge=1, le=20000, description="Max compound candidates to process"
    )
    cache_ttl_hours: int = Field(default=24, ge=1, description="Cache TTL in hours")
    api_base_url: str = Field(default="http://localhost:8000", description="API base URL")
    database_url: Optional[str] = Field(default=None, description="Database connection string")
    redis_url: Optional[str] = Field(default=None, description="Redis cache URL")
    
    # ORCID integration
    orcid_client_id: Optional[str] = Field(default=None, description="ORCID OAuth client ID")
    orcid_client_secret: Optional[str] = Field(default=None, description="ORCID OAuth secret")
    orcid_redirect_uri: str = Field(
        default="http://localhost:3000/auth/orcid/callback", description="ORCID redirect URI"
    )
    
    # Zenodo integration
    zenodo_api_url: HttpUrl = Field(
        default="https://zenodo.org/api", description="Zenodo API base URL"
    )
    zenodo_sandbox_url: HttpUrl = Field(
        default="https://sandbox.zenodo.org/api", description="Zenodo sandbox API"
    )
    zenodo_access_token: Optional[str] = Field(default=None, description="Zenodo API token")
    zenodo_use_sandbox: bool = Field(default=True, description="Use Zenodo sandbox for testing")


# Singleton instances
DS = DataSources()
CFG = RunConfig()
