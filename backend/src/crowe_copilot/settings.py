from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Core paths
    DATA_DIR: str = "./data"
    REGISTRY_PATH: str = "./data/registry"
    
    # Validation thresholds
    MIN_SPECTRA_PEAKS: int = 5
    MAX_PRECURSOR_DIFF: float = 0.5
    
    # External APIs
    ZENODO_TOKEN: Optional[str] = None
    ORCID_CLIENT_ID: Optional[str] = None
    ORCID_CLIENT_SECRET: Optional[str] = None
    
    # Feature flags
    ENABLE_LSH: bool = True
    ENABLE_ZIP_BOOTSTRAP: bool = True
    
    class Config:
        env_file = ".env"
        env_prefix = "NP_"

settings = Settings()
