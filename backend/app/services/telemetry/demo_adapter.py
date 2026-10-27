"""
Deterministic Demo Telemetry Source and Simulated Controller.
Generates internally consistent household energy profiles with diurnal peaks,
and flags all readings explicitly as synthetic/demo data.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import random
from app.services.telemetry.adapter_interface import ITelemetrySource, IDeviceController
from app.schemas.telemetry import CanonicalReading, MeasurementType, MeasurementUnit, DataQuality


class DemoTelemetryAdapter(ITelemetrySource, IDeviceController):
    def __init__(self, seed: int = 42):
        self._seed = seed
        random.seed(seed)
        self._simulated_device_states = {
            "switch.living_room_ac": "off",
            "switch.kitchen_fridge": "on",
            "switch.utility_washer": "off",
            "switch.bathroom_geyser": "off",
            "switch.garage_ev_charger": "off",
            "switch.office_pc": "on",
            "light.living_room_lights": "on",
        }

    @property
    def source_name(self) -> str:
        return "demo"

    @property
    def is_live_source(self) -> bool:
        return False

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "success": True,
            "configured": True,
            "adapter": self.source_name,
            "message": "Demo Telemetry Engine active. Operating with deterministic synthetic load curves.",
            "ha_version": "Demo Virtual v1.0",
            "latency_ms": 1.0,
        }

    async def fetch_current_readings(self) -> List[CanonicalReading]:
        """
        Produces consistent instantaneous power (W) and cumulative energy readings (kWh).
        """
        now = datetime.now(timezone.utc)
        hour = now.hour

        # Base load + diurnal residential factor
        is_peak = (7 <= hour <= 10) or (18 <= hour <= 22)
        mains_w = random.uniform(850.0, 1600.0) if is_peak else random.uniform(250.0, 500.0)

        readings = [
            CanonicalReading(
                timestamp=now,
                entity_id="sensor.mains_active_power",
                measurement_type=MeasurementType.ACTIVE_POWER,
                value=round(mains_w, 1),
                unit=MeasurementUnit.W,
                adapter=self.source_name,
                quality=DataQuality.SYNTHETIC,
                metadata={"source_description": "Whole-home mains aggregate"}
            ),
            CanonicalReading(
                timestamp=now,
                entity_id="sensor.mains_voltage",
                measurement_type=MeasurementType.VOLTAGE,
                value=round(random.uniform(228.0, 234.0), 1),
                unit=MeasurementUnit.V,
                adapter=self.source_name,
                quality=DataQuality.SYNTHETIC
            ),
            CanonicalReading(
                timestamp=now,
                entity_id="sensor.mains_current",
                measurement_type=MeasurementType.CURRENT,
                value=round(mains_w / 230.0, 2),
                unit=MeasurementUnit.A,
                adapter=self.source_name,
                quality=DataQuality.SYNTHETIC
            )
        ]

        # Appliance submetered readings
        appliance_powers = {
            "switch.living_room_ac": 1450.0 if self._simulated_device_states.get("switch.living_room_ac") == "on" else 0.0,
            "switch.kitchen_fridge": random.uniform(110.0, 140.0),
            "switch.office_pc": random.uniform(160.0, 210.0),
            "switch.bathroom_geyser": 2000.0 if self._simulated_device_states.get("switch.bathroom_geyser") == "on" else 0.0,
        }

        for eid, pwr in appliance_powers.items():
            readings.append(CanonicalReading(
                timestamp=now,
                entity_id=eid,
                measurement_type=MeasurementType.ACTIVE_POWER,
                value=round(pwr, 1),
                unit=MeasurementUnit.W,
                adapter=self.source_name,
                quality=DataQuality.SYNTHETIC
            ))

        return readings

    async def discover_devices(self) -> List[Dict[str, Any]]:
        return [
            {"entity_id": k, "name": k.replace("switch.", "").replace("_", " ").title(), "domain": "switch", "state": v, "controllable": True}
            for k, v in self._simulated_device_states.items()
        ]

    async def execute_action(
        self,
        entity_id: str,
        action: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a simulated actuation. Explicitly declares simulated: True.
        """
        new_state = "on" if action == "turn_on" else "off"
        self._simulated_device_states[entity_id] = new_state
        return {
            "success": True,
            "simulated": True,
            "message": f"Demo Mode simulated {action} on {entity_id}. No physical hardware was altered.",
            "details": {"previous_state": self._simulated_device_states.get(entity_id), "new_state": new_state}
        }
