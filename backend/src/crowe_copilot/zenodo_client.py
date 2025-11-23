"""Zenodo repository integration for data publication and DOI generation."""

from __future__ import annotations

from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path
import logging

import httpx
from pydantic import BaseModel, HttpUrl, Field

from .config import CFG

logger = logging.getLogger(__name__)


class ZenodoDeposition(BaseModel):
    """Zenodo deposition (draft or published)."""

    id: int
    doi: Optional[str] = None
    doi_url: Optional[HttpUrl] = None
    title: str
    state: str = Field(..., description="draft, published, etc.")
    created: datetime
    modified: datetime
    owner: Optional[int] = None
    links: Dict[str, str] = Field(default_factory=dict)


class ZenodoMetadata(BaseModel):
    """Metadata for Zenodo upload."""

    title: str
    upload_type: str = "dataset"  # publication, poster, presentation, dataset, etc.
    description: str
    creators: List[Dict[str, str]] = Field(
        default_factory=list, description='[{"name": "...", "affiliation": "...", "orcid": "..."}]'
    )
    keywords: List[str] = Field(default_factory=list)
    access_right: str = "open"  # open, embargoed, restricted, closed
    license: str = "cc-by-4.0"
    publication_date: Optional[str] = None  # YYYY-MM-DD
    version: str = "1.0.0"
    related_identifiers: List[Dict[str, str]] = Field(default_factory=list)


class ZenodoClient:
    """Client for Zenodo REST API."""

    def __init__(
        self,
        access_token: Optional[str] = None,
        use_sandbox: bool = True,
    ):
        self.access_token = access_token or CFG.zenodo_access_token
        self.use_sandbox = use_sandbox
        
        if use_sandbox:
            self.base_url = str(CFG.zenodo_sandbox_url)
        else:
            self.base_url = str(CFG.zenodo_api_url)
        
        if not self.access_token:
            logger.warning("Zenodo access token not configured")
    
    @property
    def headers(self) -> Dict[str, str]:
        """Request headers with authentication."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
    
    async def create_deposition(self, metadata: ZenodoMetadata) -> ZenodoDeposition:
        """
        Create new Zenodo deposition (draft).
        
        Args:
            metadata: Publication metadata
        
        Returns:
            Created deposition object
        """
        payload = {
            "metadata": {
                "title": metadata.title,
                "upload_type": metadata.upload_type,
                "description": metadata.description,
                "creators": metadata.creators,
                "keywords": metadata.keywords,
                "access_right": metadata.access_right,
                "license": metadata.license,
                "version": metadata.version,
            }
        }
        
        if metadata.publication_date:
            payload["metadata"]["publication_date"] = metadata.publication_date
        
        if metadata.related_identifiers:
            payload["metadata"]["related_identifiers"] = metadata.related_identifiers
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/deposit/depositions",
                json=payload,
                headers=self.headers,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
        
        return ZenodoDeposition(
            id=data["id"],
            doi=data.get("doi"),
            doi_url=data.get("doi_url"),
            title=data["metadata"]["title"],
            state=data["state"],
            created=datetime.fromisoformat(data["created"].replace("Z", "+00:00")),
            modified=datetime.fromisoformat(data["modified"].replace("Z", "+00:00")),
            owner=data.get("owner"),
            links=data.get("links", {}),
        )
    
    async def upload_file(
        self, deposition_id: int, file_path: Path, filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload file to deposition.
        
        Args:
            deposition_id: Deposition ID
            file_path: Path to file to upload
            filename: Optional override filename
        
        Returns:
            File upload response
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        upload_filename = filename or file_path.name
        
        async with httpx.AsyncClient() as client:
            # Get bucket URL
            depo_response = await client.get(
                f"{self.base_url}/deposit/depositions/{deposition_id}",
                headers=self.headers,
            )
            depo_response.raise_for_status()
            bucket_url = depo_response.json()["links"]["bucket"]
            
            # Upload file
            with file_path.open("rb") as f:
                response = await client.put(
                    f"{bucket_url}/{upload_filename}",
                    content=f.read(),
                    headers={"Authorization": f"Bearer {self.access_token}"},
                    timeout=300.0,  # 5 min for large files
                )
            response.raise_for_status()
            return response.json()
    
    async def publish_deposition(self, deposition_id: int) -> ZenodoDeposition:
        """
        Publish deposition (assign DOI, make public).
        
        Args:
            deposition_id: Deposition ID
        
        Returns:
            Published deposition with DOI
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/deposit/depositions/{deposition_id}/actions/publish",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
        
        return ZenodoDeposition(
            id=data["id"],
            doi=data.get("doi"),
            doi_url=data.get("doi_url"),
            title=data["metadata"]["title"],
            state=data["state"],
            created=datetime.fromisoformat(data["created"].replace("Z", "+00:00")),
            modified=datetime.fromisoformat(data["modified"].replace("Z", "+00:00")),
            owner=data.get("owner"),
            links=data.get("links", {}),
        )
    
    async def get_deposition(self, deposition_id: int) -> ZenodoDeposition:
        """Get deposition details."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/deposit/depositions/{deposition_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
        
        return ZenodoDeposition(
            id=data["id"],
            doi=data.get("doi"),
            doi_url=data.get("doi_url"),
            title=data["metadata"]["title"],
            state=data["state"],
            created=datetime.fromisoformat(data["created"].replace("Z", "+00:00")),
            modified=datetime.fromisoformat(data["modified"].replace("Z", "+00:00")),
            owner=data.get("owner"),
            links=data.get("links", {}),
        )
    
    async def list_depositions(self) -> List[ZenodoDeposition]:
        """List all depositions for authenticated user."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/deposit/depositions",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
        
        return [
            ZenodoDeposition(
                id=d["id"],
                doi=d.get("doi"),
                doi_url=d.get("doi_url"),
                title=d["metadata"]["title"],
                state=d["state"],
                created=datetime.fromisoformat(d["created"].replace("Z", "+00:00")),
                modified=datetime.fromisoformat(d["modified"].replace("Z", "+00:00")),
                owner=d.get("owner"),
                links=d.get("links", {}),
            )
            for d in data
        ]
