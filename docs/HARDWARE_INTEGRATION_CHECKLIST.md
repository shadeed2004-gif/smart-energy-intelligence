# Hardware Integration & Commissioning Checklist
**Project:** Smart Energy Intelligence Platform  
**Target:** Edge Raspberry Pi 4 / Home Assistant Supervised  
**Status:** Software Ready — Physical Commissioning Protocol

> [!IMPORTANT]
> **Pre-Hardware Notice:**  
> The Smart Energy Intelligence software is currently running in **Software Demo Mode** using normalized canonical telemetry adapters. Physical hardware integration has **not** been performed yet. Follow this checklist step-by-step when assembling physical sensors.

---

## 1. Hardware Bill of Materials (BOM)
| Component | Specification | Purpose |
| :--- | :--- | :--- |
| **Edge Compute** | Raspberry Pi 4 Model B (4GB or 8GB RAM) | Runs Home Assistant OS / Container & FastAPI platform |
| **Mains Current Sensor** | Non-invasive SCT-013-000 (100A/50mA) or SCT-013-030 (30A/1V) | Clamps onto incoming main live wire (never live + neutral together) |
| **Sub-Circuit Nodes** | ESP32-WROOM-32 microcontrollers with ADC / ADS1115 | Multi-channel high-frequency analog sampling |
| **Smart Plugs / Actuators** | Shelly Plus 1PM, Sonoff S31, or Tuya Zigbee plugs | Submetering individual appliances & executing power switching |
| **Storage Medium** | High Endurance MicroSD (32GB+) or USB 3.0 SSD | High-write durability for SQLite interval telemetry |

---

## 2. Raspberry Pi & Home Assistant Setup

1. **Install Home Assistant:**
   - Flash Home Assistant OS (HAOS) to SSD/MicroSD using Raspberry Pi Imager.
   - Complete standard initial onboarding at `http://homeassistant.local:8123`.
2. **Generate Long-Lived Access Token:**
   - Navigate to Home Assistant User Profile $\to$ **Long-Lived Access Tokens**.
   - Create a token named `smart-energy-backend`.
   - Store the token securely in `backend/.env` under `HA_TOKEN`.
3. **Verify API Endpoint Reachability:**
   ```bash
   curl -X GET http://homeassistant.local:8123/api/ \
     -H "Authorization: Bearer <YOUR_LONG_LIVED_TOKEN>" \
     -H "Content-Type: application/json"
   ```
   *(Must return `{"message": "API running."}`)*

---

## 3. Entity Mapping & SI Unit Normalization

Map physical sensor entities in Home Assistant to the platform schema:

| Household Circuit | Home Assistant Entity ID | Expected Unit | Platform Schema (`CanonicalReading`) |
| :--- | :--- | :--- | :--- |
| **Whole Home Mains** | `sensor.mains_active_power` | `W` or `kW` | Normalized to `W` (Active Power) |
| **Mains Voltage** | `sensor.grid_voltage` | `V` | Normalized to `V` ($180V - 270V$ guard) |
| **Air Conditioner** | `switch.living_room_ac` | On / Off | Controllable Appliance |
| **Water Geyser** | `switch.bathroom_geyser` | On / Off | Controllable Appliance |
| **Refrigerator** | `switch.kitchen_refrigerator` | On / Off | **Safety-Critical Appliance (`is_safety_critical=True`)** |

---

## 4. Telemetry Collection & Data-Quality Checks

1. **Physical Clamping Rule:**
   - Clamp the SCT-013 only around the **phase/live conductor**. Clamping around both live and neutral cancels the magnetic field and results in $0\text{ W}$ readings.
2. **Calibration Phase:**
   - Connect a purely resistive load of known wattage (e.g., 1000W electric kettle).
   - Adjust analog burden resistor scaling factor until reading matches reference multimeter within $\pm 2\%$.
3. **Plausibility & Deduplication Gates:**
   - Platform automatically drops readings exceeding 35,000 W or outside valid voltage ranges.
   - Identical timestamps for the same entity are filtered to protect SQLite aggregates.

---

## 5. Device-Control Safety & Interlock Verification

1. **Test Non-Critical Control:**
   - Toggle `switch.living_room_ac` via Dashboard $\to$ Confirm physical relay clicks and state updates.
2. **Test Safety Guardrail Protection:**
   - Attempt to turn off `switch.kitchen_refrigerator` via web dashboard or API.
   - **Verification:** Ensure the system displays an explicit warning and API returns `HTTP 400 Bad Request` (`detail: Safety interlock: Cannot remotely switch off safety-critical device`). The physical refrigerator must stay powered.

---

## 6. Real-Data AI Re-Evaluation Protocol

When physical sensors accumulate real-world telemetry:
1. **Accumulate at least 14 days** of continuous hourly readings before relying on AI forecasting.
2. Run `python -m pytest tests/test_ai_evaluation.py` on real SQLite snapshots.
3. Compare real MAE and RMSE against the initial synthetic benchmarks documented in `docs/AI_EVALUATION.md`.

---

## 7. Troubleshooting & Rollback Steps

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Zero power reading** | CT clamp around live + neutral bundle | Separate cable sheath and clamp around single live conductor |
| **HA connection degraded** | Invalid IP, expired token, or mDNS resolution failure | Ping `homeassistant.local`; update `HA_BASE_URL` to static IP (e.g. `http://192.168.1.150:8123`) |
| **Rollback to Demo Mode** | Hardware sensor offline during presentation | Set `DEMO_MODE=true` in `backend/.env` and restart service (`systemctl restart smart-energy-backend`) |
