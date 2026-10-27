# Smart Energy Intelligence Platform

An end-to-end residential energy intelligence and demand-side management platform designed for IoT edge deployment (Raspberry Pi 4) and Home Assistant ecosystems.

## System Architecture

```
[ ESP32 / CT Clamps / Smart Plugs ]
               │
               ▼ (REST / WebSockets)
       [ Home Assistant ]
               │
               ▼ (REST API / Telemetry Polling)
   [ FastAPI Backend Engine ] ──── SQLite / WAL (Time-Series)
               │                      │
               ▼                      ▼
    [ AI Inference Workers ]     [ Recharts Dashboard ]
    • 24h Ridge Load Forecast    • Live Power Flow
    • Isolation Forest Anomalies • Tariff Load Shifting
    • Explainable Interventions  • Submetered Breakdown
```

## Security & Authentication Model

- **JWT Authentication**: HS256 signed access tokens with UTC expiry enforcement.
- **Role-Based Access Control (RBAC)**:
  - `admin`: Full administrative access, device actuator switching, tariff editing, and automation rule management.
  - `viewer`: Read-only telemetry access, energy report viewing, and acknowledgement of alerts.
- **Safety Interlocks**: Software guardrails strictly block shutdown signals sent to vital food preservation (`kitchen_fridge`) or medical equipment.
- **Deterministic Demo Mode**: When Home Assistant credentials are not supplied, the application deterministically identifies data as synthetic (`is_demo: true`, `data_source: "demo"`).

## Running the Application

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- Default Admin Account: `admin` / `admin123`
- Default Resident Account: `demo@smartenergy.local` / `demo123`

### 2. Running Automated Tests
```bash
cd backend
python -m pytest tests/
```

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run build   # Production bundle validation
npm run dev     # Local development server
```
- Open `http://localhost:5173`

---

## Raspberry Pi 4 Deployment Checklist

To deploy this platform on a real Raspberry Pi 4 with Home Assistant:

1. **System Packages**: Install Python 3.12, Node.js 20+, and SQLite3 (`sudo apt update && sudo apt install -y python3-pip python3-venv sqlite3 nginx`).
2. **Systemd Services**: Create systemd service files for `sei-backend.service` (running uvicorn on port 8000) and an Nginx reverse proxy serving `frontend/dist`.
3. **Environment Setup**: Copy `.env.example` to `.env` on the Pi and populate:
   - `ENVIRONMENT=production`
   - `SECRET_KEY=<generate-32-char-random-string>`
   - `HA_BASE_URL=http://homeassistant.local:8123`
   - `HA_TOKEN=<Long-Lived-Access-Token-from-Home-Assistant>`
4. **Current Transformers (CT Sensors)**: Connect SCT-013 clamps to ESP32 ADC pins, stream active power to Home Assistant via ESPHome or MQTT, and map the entity ID to `sensor.mains_active_power`.
5. **Database Storage**: Configure SQLite WAL mode with a persistent location or attach an external SSD/USB3 drive to prevent SD-card wear from continuous 1-second telemetry writes.
