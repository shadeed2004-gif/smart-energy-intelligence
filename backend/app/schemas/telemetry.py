"""
Canonical Telemetry and Sensor Measurement Schema.
Extensible, normalized representation of all electrical, environmental, and state readings.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class MeasurementType(str, Enum):
    ACTIVE_POWER = "active_power"        # Instantaneous real power in Watts (W)
    REACTIVE_POWER = "reactive_power"    # Reactive power in volt-amperes reactive (VAR)
    APPARENT_POWER = "apparent_power"    # Apparent power in volt-amperes (VA)
    ENERGY = "energy"                    # Cumulative or interval electrical energy (kWh)
    VOLTAGE = "voltage"                  # Electrical potential in Volts (V)
    CURRENT = "current"                  # Electrical current in Amperes (A)
    FREQUENCY = "frequency"              # Grid frequency in Hertz (Hz)
    POWER_FACTOR = "power_factor"        # Dimensionless ratio (-1.0 to 1.0)
    TEMPERATURE = "temperature"          # Ambient or heatsink temperature in Celsius (°C)
    STATE = "state"                      # Discrete binary or enumerated state ("on", "off", etc.)


class MeasurementUnit(str, Enum):
    W = "W"
    KW = "kW"
    WH = "Wh"
    KWH = "kWh"
    V = "V"
    A = "A"
    HZ = "Hz"
    CELSIUS = "°C"
    UNITLESS = "ratio"
    BINARY = "binary"


class DataQuality(str, Enum):
    GOOD = "good"                    # Validated, authentic reading
    DEGRADED = "degraded"            # Valid but out of nominal tolerances
    INTERPOLATED = "interpolated"    # Mathematically estimated during minor dropout
    SYNTHETIC = "synthetic"          # Explicit demo or test fixture data
    INVALID = "invalid"              # Fails range or schema validation


class CanonicalReading(BaseModel):
    """
    Canonical Telemetry Model.
    All data sources (Demo, Home Assistant, MQTT, Modbus) must normalize into this model.
    """
    reading_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    household_id: str = "default_site"
    device_id: Optional[int] = None
    entity_id: str = Field(..., min_length=1, max_length=200)
    measurement_type: MeasurementType
    value: float
    unit: MeasurementUnit
    adapter: str = "unknown"         # "demo", "home_assistant", "mqtt", "modbus"
    quality: DataQuality = DataQuality.GOOD
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("timestamp")
    @classmethod
    def ensure_utc(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)

    @field_validator("value")
    @classmethod
    def validate_measurement_ranges(cls, v: float, info) -> float:
        # Physical plausibility guards
        mtype = info.data.get("measurement_type")
        if mtype == MeasurementType.ACTIVE_POWER and v < -50000.0:
            raise ValueError(f"Extreme active power reading ({v} W) exceeds plausible solar export.")
        if mtype == MeasurementType.VOLTAGE and (v < 0.0 or v > 600.0):
            raise ValueError(f"Voltage reading ({v} V) outside plausible domestic range (0-600V).")
        return round(float(v), 4)

    def to_standard_units(self) -> "CanonicalReading":
        """
        Normalizes reading into SI base/standard domestic units (W, kWh, V, A).
        """
        val = self.value
        unit = self.unit
        if self.measurement_type == MeasurementType.ACTIVE_POWER:
            if unit == MeasurementUnit.KW:
                val = val * 1000.0
                unit = MeasurementUnit.W
        elif self.measurement_type == MeasurementType.ENERGY:
            if unit == MeasurementUnit.WH:
                val = val / 1000.0
                unit = MeasurementUnit.KWH
        return self.model_copy(update={"value": round(val, 4), "unit": unit})
