# Raspberry Pi & Edge Deployment Readiness Guide
**Project:** Smart Energy Intelligence Platform  
**Target Hardware:** Raspberry Pi 4 Model B (4GB / 8GB RAM) running Raspberry Pi OS (Debian 12 Bookworm 64-bit)  
**Edge Environment:** Local Home Network with Home Assistant Supervised or Container

---

## 1. System Requirements & Hardware Architecture
- **Hardware:** Raspberry Pi 4 (Quad-core Cortex-A72 @ 1.8GHz, 4GB+ RAM recommended).
- **Storage:** Class 10 High Endurance MicroSD card (32GB+) or USB 3.0 SSD (strongly recommended for SQLite write durability).
- **Network:** Static local IP assignment (e.g., `192.168.1.150`) or mDNS hostname (`smartenergy.local`).
- **Dependencies:** Python 3.11+, Node.js 20+, systemd, and SQLite3.

---

## 2. Directory Structure & Environment Isolation
Ensure sensitive secrets and virtual environments are excluded from git tracking:
```bash
smart-energy-intelligence/
├── backend/
│   ├── .env                 # Local secrets (JWT_SECRET, HA_TOKEN) - EXCLUDED FROM GIT
│   ├── app/                 # FastAPI application
│   ├── smart_energy.db      # Persistent SQLite store - EXCLUDED FROM GIT
│   └── venv/                # Edge virtual environment - EXCLUDED FROM GIT
├── frontend/
│   ├── dist/                # Production build artifacts
│   └── node_modules/        # EXCLUDED FROM GIT
└── docs/                    # Architectural and deployment specifications
```

---

## 3. Production Deployment with Systemd

### 3.1 Backend Service (`/etc/systemd/system/smart-energy-backend.service`)
```ini
[Unit]
Description=Smart Energy Intelligence FastAPI Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smart-energy-intelligence/backend
ExecStart=/home/pi/smart-energy-intelligence/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5
Environment="PATH=/home/pi/smart-energy-intelligence/backend/venv/bin:/usr/bin"

[Install]
WantedBy=multi-user.target
```

### 3.2 Frontend Nginx Serving Configuration
```nginx
server {
    listen 80;
    server_name smartenergy.local;

    # Serve built React frontend
    location / {
        root /home/pi/smart-energy-intelligence/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to local FastAPI daemon
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Hardware Integration Readiness Checklist
- [x] Canonical telemetry normalization layer accepting W, kW, V, and A.
- [x] Pluggable `HomeAssistantAdapter` ready for entity state ingestion.
- [x] Rejection of simulated operations as confirmed physical switch actuation.
- [x] Critical load safety interlocks preventing unintended compressor shutdown.
- [ ] Physical installation of non-invasive SCT-013 CT clamps on main breaker.
- [ ] Pairing of Home Assistant Long-Lived Access Token in `backend/.env`.
