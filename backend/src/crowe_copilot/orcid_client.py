"""ORCID authentication and profile integration."""

from __future__ import annotations

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

import httpx
from pydantic import BaseModel, HttpUrl, Field

from .config import CFG

logger = logging.getLogger(__name__)


class ORCIDProfile(BaseModel):
    """ORCID user profile."""

    orcid_id: str = Field(..., description="ORCID iD (0000-0000-0000-0000)")
    name: Optional[str] = None
    email: Optional[str] = None
    affiliation: Optional[str] = None
    biography: Optional[str] = None
    profile_url: HttpUrl
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None


class ORCIDClient:
    """Client for ORCID OAuth and API interactions."""

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        sandbox: bool = False,
    ):
        self.client_id = client_id or CFG.orcid_client_id
        self.client_secret = client_secret or CFG.orcid_client_secret
        self.redirect_uri = redirect_uri or CFG.orcid_redirect_uri
        
        self.base_url = (
            "https://sandbox.orcid.org" if sandbox else "https://orcid.org"
        )
        self.api_url = f"{self.base_url}/v3.0"
        
        if not self.client_id or not self.client_secret:
            logger.warning("ORCID client credentials not configured")
    
    def get_authorization_url(self, scope: str = "/authenticate") -> str:
        """
        Get ORCID OAuth authorization URL.
        
        Args:
            scope: ORCID scope (/authenticate, /read-limited, /activities/update, etc.)
        
        Returns:
            Authorization URL to redirect user to
        """
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": scope,
            "redirect_uri": self.redirect_uri,
        }
        
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.base_url}/oauth/authorize?{query}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from OAuth callback
        
        Returns:
            Dict with: access_token, token_type, refresh_token, expires_in, scope, orcid
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/oauth/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()
    
    async def get_profile(self, orcid_id: str, access_token: str) -> ORCIDProfile:
        """
        Fetch ORCID profile data.
        
        Args:
            orcid_id: ORCID iD
            access_token: OAuth access token
        
        Returns:
            Parsed ORCID profile
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/{orcid_id}/person",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
        
        # Parse ORCID response (simplified)
        name_data = data.get("name", {})
        full_name = None
        if name_data:
            given = name_data.get("given-names", {}).get("value", "")
            family = name_data.get("family-name", {}).get("value", "")
            full_name = f"{given} {family}".strip()
        
        emails = data.get("emails", {}).get("email", [])
        primary_email = next(
            (e["email"] for e in emails if e.get("primary")), None
        ) if emails else None
        
        biography = data.get("biography", {}).get("content")
        
        return ORCIDProfile(
            orcid_id=orcid_id,
            name=full_name,
            email=primary_email,
            biography=biography,
            profile_url=f"{self.base_url}/{orcid_id}",
            access_token=access_token,
        )
    
    async def add_work(
        self,
        orcid_id: str,
        access_token: str,
        title: str,
        doi: Optional[str] = None,
        year: Optional[int] = None,
        work_type: str = "data-set",
    ) -> Dict[str, Any]:
        """
        Add a work/publication to ORCID profile.
        
        Args:
            orcid_id: ORCID iD
            access_token: OAuth token with /activities/update scope
            title: Work title
            doi: DOI (e.g., Zenodo DOI)
            year: Publication year
            work_type: ORCID work type (data-set, journal-article, etc.)
        
        Returns:
            API response
        """
        work_data = {
            "title": {"title": {"value": title}},
            "type": work_type,
        }
        
        if doi:
            work_data["external-ids"] = {
                "external-id": [
                    {
                        "external-id-type": "doi",
                        "external-id-value": doi,
                        "external-id-relationship": "self",
                    }
                ]
            }
        
        if year:
            work_data["publication-date"] = {"year": {"value": str(year)}}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/{orcid_id}/work",
                json={"work": work_data},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
