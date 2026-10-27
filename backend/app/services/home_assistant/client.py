"""
Home Assistant REST Client & Polling Ingestion Service.
Supports live state polling, capability discovery, service actuation with safe guardrails,
and deterministic demo mode indication.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from urllib.parse import urlparse
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("ha_client")


class HomeAssistantClient:
    def __init__(self, base_url: Optional[str] = None, token: Optional[str] = None):
        self._raw_base_url = (base_url or settings.HA_BASE_URL).strip()
        self.base_url = self._raw_base_url.rstrip("/")
        self.token = (token or settings.HA_TOKEN).strip()
        self.verify_ssl = settings.HA_VERIFY_SSL
        self.last_sync_time: Optional[datetime] = None
        self.last_sync_error: Optional[str] = None

    @property
    def is_configured(self) -> bool:
        if not self.base_url or not self.token:
            return False
        # Validate URL format
        parsed = urlparse(self.base_url)
        return parsed.scheme in ["http", "https"] and bool(parsed.netloc)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def test_connection(self) -> Dict[str, Any]:
        """
        Tests connectivity against Home Assistant API without leaking credentials.
        """
        if not self.is_configured:
            return {
                "success": False,
                "configured": False,
                "message": "Home Assistant URL or token not configured. Operating in deterministic Demo Mode.",
                "ha_version": "Demo Synthetic",
                "entity_count": 0
            }
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/discovery_info", headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    self.last_sync_time = datetime.now(timezone.utc)
                    self.last_sync_error = None
                    return {
                        "success": True,
                        "configured": True,
                        "message": "Connected to Home Assistant instance",
                        "ha_version": data.get("version", "unknown"),
                    }
                err_msg = f"HA API responded with HTTP status {res.status_code}"
                self.last_sync_error = err_msg
                return {
                    "success": False,
                    "configured": True,
                    "message": err_msg,
                }
        except Exception as e:
            err_msg = f"Connection timeout or network failure: {type(e).__name__}"
            self.last_sync_error = err_msg
            logger.warning(f"HA connection attempt failed: {type(e).__name__}")
            return {
                "success": False,
                "configured": True,
                "message": err_msg,
            }

    async def get_states(self) -> List[Dict[str, Any]]:
        """
        Fetches all current entity states from Home Assistant.
        """
        if not self.is_configured:
            return []
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/api/states", headers=self._headers())
                if res.status_code == 200:
                    self.last_sync_time = datetime.now(timezone.utc)
                    self.last_sync_error = None
                    return res.json()
                self.last_sync_error = f"HTTP {res.status_code} while fetching states"
        except Exception as e:
            self.last_sync_error = f"State fetch failure: {type(e).__name__}"
            logger.error(f"Failed to fetch states from Home Assistant: {type(e).__name__}")
        return []

    async def call_service(
        self,
        domain: str,
        service: str,
        entity_id: str,
        service_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a service call in Home Assistant (e.g. switch.turn_off).
        Includes protective safety guardrail for vital entities.
        Prevents demo mode from falsely asserting that a physical hardware device changed.
        """
        # Critical appliance safety guardrail
        lower_entity = entity_id.lower()
        if "fridge" in lower_entity or "refrigerator" in lower_entity or "medical" in lower_entity:
            if service in ["turn_off", "toggle"]:
                logger.warning(f"Safety guardrail prevented shutdown of protected entity: {entity_id}")
                return {
                    "success": False,
                    "reason": "Safety Interlock: Critical food preservation/medical device cannot be powered off automatically."
                }

        if not self.is_configured:
            # Deterministic demo response: explicit simulated flag
            return {
                "success": True,
                "simulated": True,
                "message": f"Demo Mode simulated {domain}.{service} on {entity_id}. No physical hardware was altered."
            }

        payload = {"entity_id": entity_id}
        if service_data:
            payload.update(service_data)

        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=8.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/services/{domain}/{service}",
                    headers=self._headers(),
                    json=payload
                )
                if res.status_code == 200:
                    return {"success": True, "simulated": False, "message": "Command executed on Home Assistant"}
                return {"success": False, "simulated": False, "reason": f"HA responded with HTTP {res.status_code}"}
        except Exception as e:
            logger.error(f"Service call {domain}.{service} on {entity_id} failed: {type(e).__name__}")
            return {"success": False, "simulated": False, "reason": f"Communication error: {type(e).__name__}"}


ha_client = HomeAssistantClient()
