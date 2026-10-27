"""
Home Assistant Ingestion and Control Adapter.
Implements ITelemetrySource and IDeviceController.
Never silently falls back to demo data when configured credentials or network fail.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from urllib.parse import urlparse
from app.services.telemetry.adapter_interface import ITelemetrySource, IDeviceController
from app.schemas.telemetry import CanonicalReading, MeasurementType, MeasurementUnit, DataQuality
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("ha_adapter")


class HomeAssistantAdapter(ITelemetrySource, IDeviceController):
    def __init__(self, base_url: Optional[str] = None, token: Optional[str] = None, verify_ssl: bool = False):
        self._raw_base_url = (base_url or settings.HA_BASE_URL).strip()
        self.base_url = self._raw_base_url.rstrip("/")
        self.token = (token or settings.HA_TOKEN).strip()
        self.verify_ssl = verify_ssl or settings.HA_VERIFY_SSL
        self.last_sync_time: Optional[datetime] = None
        self.last_sync_error: Optional[str] = None

    @property
    def source_name(self) -> str:
        return "home_assistant"

    @property
    def is_live_source(self) -> bool:
        return True

    @property
    def is_configured(self) -> bool:
        if not self.base_url or not self.token:
            return False
        parsed = urlparse(self.base_url)
        return parsed.scheme in ["http", "https"] and bool(parsed.netloc)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def test_connection(self) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "success": False,
                "configured": False,
                "adapter": self.source_name,
                "message": "Home Assistant URL or token is not configured.",
                "ha_version": None,
                "latency_ms": None,
            }
        start = datetime.now()
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=6.0) as client:
                res = await client.get(f"{self.base_url}/api/discovery_info", headers=self._headers())
                latency_ms = round((datetime.now() - start).total_seconds() * 1000, 1)
                if res.status_code == 200:
                    data = res.json()
                    self.last_sync_time = datetime.now(timezone.utc)
                    self.last_sync_error = None
                    return {
                        "success": True,
                        "configured": True,
                        "adapter": self.source_name,
                        "message": "Connected to Home Assistant API",
                        "ha_version": data.get("version", "unknown"),
                        "latency_ms": latency_ms,
                    }
                err = f"Home Assistant rejected connection with HTTP {res.status_code}"
                self.last_sync_error = err
                return {"success": False, "configured": True, "adapter": self.source_name, "message": err, "latency_ms": latency_ms}
        except Exception as e:
            err = f"Home Assistant communication failure: {type(e).__name__}"
            self.last_sync_error = err
            return {"success": False, "configured": True, "adapter": self.source_name, "message": err, "latency_ms": None}

    async def fetch_current_readings(self) -> List[CanonicalReading]:
        """
        Polls Home Assistant state objects and maps energy/power/voltage sensors to CanonicalReading.
        Raises RuntimeError if network connection fails instead of silently returning demo data.
        """
        if not self.is_configured:
            return []

        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/api/states", headers=self._headers())
                if res.status_code != 200:
                    raise RuntimeError(f"Home Assistant returned status {res.status_code}")
                states = res.json()
        except Exception as e:
            self.last_sync_error = f"Poll failed: {type(e).__name__}"
            raise RuntimeError(f"Failed to fetch live readings from Home Assistant: {type(e).__name__}") from e

        now = datetime.now(timezone.utc)
        self.last_sync_time = now
        self.last_sync_error = None
        readings: List[CanonicalReading] = []

        for item in states:
            entity_id = item.get("entity_id", "")
            state_str = item.get("state", "")
            attributes = item.get("attributes", {})
            uom = attributes.get("unit_of_measurement", "").strip()

            # Filter for power/energy measurement entities
            try:
                num_val = float(state_str)
            except (ValueError, TypeError):
                continue

            if uom == "W" or "power" in entity_id:
                readings.append(CanonicalReading(
                    timestamp=now,
                    entity_id=entity_id,
                    measurement_type=MeasurementType.ACTIVE_POWER,
                    value=num_val,
                    unit=MeasurementUnit.KW if uom == "kW" else MeasurementUnit.W,
                    adapter=self.source_name,
                    quality=DataQuality.GOOD,
                    metadata={"device_class": attributes.get("device_class")}
                ).to_standard_units())
            elif uom in ["kWh", "Wh"] or "energy" in entity_id:
                readings.append(CanonicalReading(
                    timestamp=now,
                    entity_id=entity_id,
                    measurement_type=MeasurementType.ENERGY,
                    value=num_val,
                    unit=MeasurementUnit.WH if uom == "Wh" else MeasurementUnit.KWH,
                    adapter=self.source_name,
                    quality=DataQuality.GOOD,
                    metadata={"device_class": attributes.get("device_class")}
                ).to_standard_units())

        return readings

    async def discover_devices(self) -> List[Dict[str, Any]]:
        if not self.is_configured:
            return []
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/api/states", headers=self._headers())
                if res.status_code == 200:
                    devices = []
                    for item in res.json():
                        eid = item.get("entity_id", "")
                        domain = eid.split(".")[0]
                        if domain in ["switch", "light", "climate"]:
                            devices.append({
                                "entity_id": eid,
                                "name": item.get("attributes", {}).get("friendly_name", eid),
                                "domain": domain,
                                "state": item.get("state"),
                                "controllable": True,
                            })
                    return devices
        except Exception as e:
            logger.error(f"Device discovery failed on Home Assistant: {e}")
        return []

    async def execute_action(
        self,
        entity_id: str,
        action: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes physical actuation on live Home Assistant entity.
        """
        if not self.is_configured:
            raise RuntimeError("Cannot execute live actuation: Home Assistant adapter is not configured.")

        domain = entity_id.split(".")[0]
        payload = {"entity_id": entity_id}
        if params:
            payload.update(params)

        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=8.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/services/{domain}/{action}",
                    headers=self._headers(),
                    json=payload
                )
                if res.status_code == 200:
                    return {
                        "success": True,
                        "simulated": False,
                        "message": f"Successfully executed {domain}.{action} on {entity_id}",
                        "details": {"status_code": 200}
                    }
                return {
                    "success": False,
                    "simulated": False,
                    "message": f"Home Assistant service returned HTTP {res.status_code}",
                    "details": {"status_code": res.status_code}
                }
        except Exception as e:
            return {
                "success": False,
                "simulated": False,
                "message": f"Execution error: {type(e).__name__}",
                "details": {}
            }
