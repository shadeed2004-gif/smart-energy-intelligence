# Canonical Telemetry Data Model

This specification defines the normalized data contract used across all ingestion adapters, persistence stores, analytics engines, and AI algorithms.

---

## 1. Schema Definition (`CanonicalReading`)

```python
class CanonicalReading(BaseModel):
    reading_id: Optional[str] = None
    timestamp: datetime                    # Always normalized to UTC
    household_id: str = "default_site"     # Extensible for multi-tenant / multi-site
    device_id: Optional[int] = None
    entity_id: str                         # Standard entity identifier (e.g. sensor.mains_active_power)
    measurement_type: MeasurementType      # active_power, energy, voltage, current, etc.
    value: float                           # Normalized numeric magnitude
    unit: MeasurementUnit                  # SI Standard: W, kWh, V, A, °C, ratio
    adapter: str                           # "home_assistant", "demo", "mqtt", "modbus"
    quality: DataQuality                   # good, degraded, interpolated, synthetic, invalid
    metadata: Dict[str, Any]               # Sensor metadata, vendor attributes
```

---

## 2. Measurement Types & Unit Conversion Rules

| Measurement Type | Raw Input Units Accepted | Normalized Canonical Unit | Conversion Logic |
| :--- | :--- | :--- | :--- |
| `active_power` | $W$, $kW$ | **$W$ (Watts)** | If $kW$, multiply by $1000.0$ |
| `energy` | $Wh$, $kWh$ | **$kWh$ (Kilowatt-hours)** | If $Wh$, divide by $1000.0$ |
| `voltage` | $V$ | **$V$ (Volts)** | Range guard: $0.0 \le V \le 600.0$ |
| `current` | $A$, $mA$ | **$A$ (Amperes)** | If $mA$, divide by $1000.0$ |
| `temperature` | $°C$ | **$°C$ (Celsius)** | Normalized floating point |

---

## 3. Data Quality & Provenance Flags

- **`good`**: Fresh, verified measurement polled from an authenticated live adapter.
- **`degraded`**: Received reading is valid but exceeds typical operating variance or arrived after expected sampling period.
- **`synthetic`**: Explicitly marked demonstration or test fixture dataset.
- **`interpolated`**: Calculated during brief communication dropouts (e.g., linear fill between two readings).
- **`invalid`**: Failed plausibility ranges (e.g. negative household voltage); discarded or flagged for anomaly inspection.
