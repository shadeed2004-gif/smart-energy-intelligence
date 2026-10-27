# System Architecture & Extensibility Specification

This document details the multi-tiered, decoupled architecture of the **Smart Energy Intelligence Platform**, designed for seamless transition from demonstration mode to edge IoT hardware deployment on a Raspberry Pi 4.

---

## 1. High-Level Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Data Acquisition                     │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │ Home Assistant Sensor │   │  Demo / Synthetic    │  │
│  │ Adapter (REST / WS)   │   │  Telemetry Adapter   │  │
│  └───────────┬───────────┘   └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │                          │
               ▼                          ▼
┌────────────────────────────────────────────────────────┐
│               Telemetry Manager & Ingestion            │
│  • Validation against CanonicalReading schema          │
│  • Timestamp UTC normalization                         │
│  • SI Unit Conversion (kW -> W, Wh -> kWh)             │
│  • Deduplication & Provenance Tagging                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Persistent Storage Layer               │
│  • SQLite (WAL Mode enabled for Pi edge concurrency)   │
│  • Time-Series Aggregations (Hourly & Daily kWh)       │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────────┐
│ Energy & Tariff Services │   │  Intelligence Services  │
│ • Unit Costing (₹/kWh)   │   │  • 24h Diurnal Forecast │
│ • Carbon Emission Audits │   │  • Z-Score Anomaly Scan │
│ • Submetered Breakdown   │   │  • Load Shift Advice    │
└──────────────┬───────────┘   └──────────┬──────────────┘
               │                          │
               └──────────────┬───────────┘
                              ▼
┌────────────────────────────────────────────────────────┐
│                    API Gateway Layer                   │
│  • FastAPI REST Endpoints (JWT Bearer Auth + RBAC)     │
│  • Device Control with Safety Interlocks               │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│               Frontend Presentation Layer              │
│  • React + Vite + TypeScript Single-Page Application   │
│  • Recharts Live Visualizations & Audit Exports        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Pluggable Adapter Interface (`ITelemetrySource` & `IDeviceController`)
Data acquisition is completely decoupled from business logic:
- `ITelemetrySource` mandates:
  - `source_name: str`
  - `is_live_source: bool`
  - `test_connection() -> Dict[str, Any]`
  - `fetch_current_readings() -> List[CanonicalReading]`
  - `discover_devices() -> List[Dict[str, Any]]`
- Backend services, analytics, and AI models consume normalized telemetry through `TelemetryManager` rather than communicating directly with Home Assistant or demo scripts.
- **Fail-Safe Principle**: When Home Assistant connection fails, the system logs the failure and reports connectivity degradation; it **never silently produces fake demo data**.

### 2.2 Canonical Telemetry Model
Every measurement is standardized into `CanonicalReading`:
- UTC timestamps.
- Normalized SI units ($W$, $kWh$, $V$, $A$).
- Measurement types (`active_power`, `reactive_power`, `energy`, `voltage`, `current`, `temperature`).
- Quality flags (`good`, `degraded`, `interpolated`, `synthetic`, `invalid`).

### 2.3 Independent Safety Interlocks
Hardware actuation is protected by `DeviceSafetyService`:
- Disallows powering down critical circuits (e.g. food refrigeration, medical gear) even if an automation rule or user attempts it.
- In demo mode, actuation returns `simulated: True` and explicitly confirms that no physical hardware was altered.
