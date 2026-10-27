# Integration Status & Hardware Gateway Status
**Project:** Smart Energy Intelligence Platform  
**Target:** Edge Sensor Integration & Home Assistant Bridge  
**Current Operating Profile:** Hybrid Mode (Functional Demo Data + Live Ready Gateway)

---

## 1. Subsystem Integration Status

| Component | Architecture Role | Readiness | Verification Method |
| :--- | :--- | :--- | :--- |
| **Telemetry Manager** | Normalizes readings, enforces deduplication | **Production Ready** | Unit tested (`test_architecture.py`) |
| **Home Assistant Adapter** | Bidirectional REST & WebSocket integration | **Live Ready (Unpaired)** | Schema tested (`test_architecture.py`) |
| **Demo Telemetry Adapter** | Generates synthetic residential diurnal load | **Production Ready** | Verified across all dashboard routes |
| **Safety Interlock Service** | Protects essential appliances from remote cutoff | **Production Ready** | Security tests pass (`test_api.py`) |
| **Forecasting Engine** | 24-step Ridge baseline with confidence band | **Production Ready** | Benchmark evaluated (`test_ai_evaluation.py`) |
| **Anomaly Detector** | 7-day Z-score analysis with explainable alerts | **Production Ready** | Synthetic stress tested (`test_ai_evaluation.py`) |
| **Physical IoT Nodes** | ESP32 + SCT-013 CT current sensors | **Awaiting Hardware** | Plug-and-play canonical ingestion ready |

---

## 2. Hardware Gate Status & Transition Roadmap
When physical sensors or Home Assistant hardware are attached:

1. **Step 1 - Hardware Credentials:** Populate `HOME_ASSISTANT_URL` and `HOME_ASSISTANT_TOKEN` in `backend/.env`.
2. **Step 2 - Entity Mapping:** Navigate to `/app/devices` and assign discovered HA entity IDs (e.g. `sensor.mains_power`) to rooms.
3. **Step 3 - Switch Source:** Set `TELEMETRY_SOURCE=home_assistant` in configuration.
4. **Step 4 - Live Calibration:** Calibrate SCT-013 analog burden resistor factors against reference multimeter readings.
