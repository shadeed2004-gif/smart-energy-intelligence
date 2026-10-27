# Home Assistant Edge Setup & Hardware Integration Guide

This guide explains how to connect a live **Home Assistant** instance to the **Smart Energy Intelligence Platform** when physical hardware (Raspberry Pi, CT clamps, and smart plugs) is deployed.

---

## 1. Prerequisites

- **Home Assistant OS / Supervised**: Running on Raspberry Pi 4 or Home Assistant Green on local network (e.g., `http://192.168.1.100:8123` or `http://homeassistant.local:8123`).
- **Energy Metering Entities**:
  - Mains Sensor: CT clamp on distribution board (e.g. SCT-013 connected to ESPHome or Shelly EM) producing `sensor.mains_active_power` in $W$ or $kW$.
  - Smart Plugs: Zigbee/Wi-Fi smart plugs with power monitoring (Shelly Plus 1PM, Sonoff S31) reporting `switch.living_room_ac`, `switch.kitchen_fridge`, etc.

---

## 2. Generating Long-Lived Access Token

1. Open your Home Assistant web UI.
2. Click your **User Profile** (bottom left).
3. Scroll down to **Long-Lived Access Tokens**.
4. Click **Create Token**, label it `smart-energy-platform`, and copy the generated token string.
   > **Security Note**: Never commit this token to Git or send it to the frontend. It is read strictly by the Python backend via environment variables.

---

## 3. Configuring the Backend

In `backend/.env` (or via environment variables on the Raspberry Pi):

```env
# Disable demo mode for live operation
DEMO_MODE=false

# Home Assistant connection settings
HA_BASE_URL=http://homeassistant.local:8123
HA_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6...
HA_VERIFY_SSL=false

# Polling and retry intervals
TELEMETRY_INTERVAL_SECONDS=30
TELEMETRY_RETRY_LIMIT=3
```

Restart the backend service. The platform will automatically:
1. Call `GET /api/discovery_info` on Home Assistant to verify connectivity.
2. Discover compatible sensor and switch entities.
3. Stream telemetry into the SQLite/TimescaleDB time-series store through `HomeAssistantAdapter`.
4. Update the Top Bar connection badge to **Home Assistant • Connected**.

---

## 4. Troubleshooting Live Ingestion

- **Connection Error / Timeout**:
  - Verify that the Home Assistant host IP is reachable from the Smart Energy host (`ping 192.168.1.100`).
  - Check whether Home Assistant firewall restricts local REST API access.
- **Entities Missing**:
  - Ensure entities have `device_class: power` or `unit_of_measurement: W` or `kWh` in Home Assistant Developer Tools -> States.
