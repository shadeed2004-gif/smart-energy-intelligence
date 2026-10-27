"""
Telemetry Source and Device Control Adapter Interfaces.
Abstract Base Classes ensuring pluggable, replaceable data ingestion and hardware actuation.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.telemetry import CanonicalReading


class ITelemetrySource(ABC):
    """
    Interface for any telemetry ingestion provider (Demo, Home Assistant, ESP32 MQTT, Modbus).
    """
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Unique identifier of the adapter."""
        pass

    @property
    @abstractmethod
    def is_live_source(self) -> bool:
        """True if backed by live physical hardware; False if demo or synthetic."""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Validates network connectivity and credentials without leaking secrets."""
        pass

    @abstractmethod
    async def fetch_current_readings(self) -> List[CanonicalReading]:
        """Polls or extracts current readings, returning normalized CanonicalReading instances."""
        pass

    @abstractmethod
    async def discover_devices(self) -> List[Dict[str, Any]]:
        """Discovers entities, sensors, and controllable switches."""
        pass


class IDeviceController(ABC):
    """
    Interface for device actuation and control operations.
    """
    @abstractmethod
    async def execute_action(
        self,
        entity_id: str,
        action: str,  # "turn_on", "turn_off", "toggle", "set_level"
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a hardware control command.
        Returns dict with keys: { "success": bool, "simulated": bool, "message": str, "details": dict }
        """
        pass
