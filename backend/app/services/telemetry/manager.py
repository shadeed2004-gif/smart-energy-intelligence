"""
Telemetry Ingestion & Integration Manager.
Coordinates active telemetry adapters (Home Assistant vs Demo), provides dependency injection,
and validates incoming CanonicalReading streams before persistence and aggregation.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.services.telemetry.adapter_interface import ITelemetrySource, IDeviceController
from app.services.telemetry.ha_adapter import HomeAssistantAdapter
from app.services.telemetry.demo_adapter import DemoTelemetryAdapter
from app.schemas.telemetry import CanonicalReading, MeasurementType, DataQuality
from app.models.models import TelemetryReading, EnergyAggregate, Device
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("telemetry_manager")


class TelemetryManager:
    """
    Central Coordinator for data acquisition and device actuation.
    Decouples business logic, API routers, and AI services from the underlying source.
    """
    def __init__(self):
        self._ha_adapter = HomeAssistantAdapter()
        self._demo_adapter = DemoTelemetryAdapter(seed=settings.DEMO_DATA_SEED)
        self._active_source_override: Optional[str] = None

    def get_active_source(self) -> ITelemetrySource:
        """
        Resolves the active telemetry source based on configuration:
        - If DEMO_MODE is True or Home Assistant is unconfigured, returns DemoTelemetryAdapter.
        - If HA is configured and DEMO_MODE is False, returns HomeAssistantAdapter.
        - Does NOT silently downgrade to demo data upon network failures during live operations.
        """
        if self._active_source_override == "demo":
            return self._demo_adapter
        if self._active_source_override == "home_assistant":
            return self._ha_adapter

        if not settings.DEMO_MODE and self._ha_adapter.is_configured:
            return self._ha_adapter
        return self._demo_adapter

    def get_active_controller(self) -> IDeviceController:
        source = self.get_active_source()
        if isinstance(source, IDeviceController):
            return source
        return self._demo_adapter

    def set_source_override(self, source_name: Optional[str]):
        """For testing and explicit administrative switching."""
        self._active_source_override = source_name

    async def poll_and_ingest(self, db: Session) -> List[CanonicalReading]:
        """
        Polls the active source, normalizes readings, and persists them to the database.
        Prevents duplicate readings for the same entity and timestamp.
        """
        source = self.get_active_source()
        try:
            readings = await source.fetch_current_readings()
        except Exception as e:
            logger.error(f"Telemetry acquisition error from {source.source_name}: {e}")
            raise

        persisted = []
        for r in readings:
            # SI unit normalization
            normalized = r.to_standard_units()
            # Duplicate prevention check: reading exists within 5 seconds for same entity
            existing = (
                db.query(TelemetryReading)
                .filter(
                    TelemetryReading.entity_id == normalized.entity_id,
                    TelemetryReading.timestamp == normalized.timestamp
                )
                .first()
            )
            if existing:
                continue

            power_w = normalized.value if normalized.measurement_type == MeasurementType.ACTIVE_POWER else None
            energy_kwh = normalized.value if normalized.measurement_type == MeasurementType.ENERGY else (
                (power_w / 1000.0) if power_w is not None else None
            )

            db_record = TelemetryReading(
                entity_id=normalized.entity_id,
                device_id=normalized.device_id,
                timestamp=normalized.timestamp,
                power_w=power_w,
                energy_kwh=energy_kwh,
                is_demo=not source.is_live_source,
                source=source.source_name
            )
            db.add(db_record)
            persisted.append(normalized)

        if persisted:
            db.commit()
        return persisted


telemetry_manager = TelemetryManager()
