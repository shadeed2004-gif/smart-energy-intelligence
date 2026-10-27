# Phase 1 Presentation Demonstration Guide

**Project**: Smart Energy Intelligence Platform  
**Target Event**: Phase 1 College Capstone Project Presentation  
**Demonstration Mode**: Reliable Deterministic Demo Mode (Hardware-independent software demo)

---

## 1. Quick Startup Commands

Run both commands in separate terminal windows from the repository root:

### Terminal 1: Backend Server (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --port 8000
```
- Server URL: `http://127.0.0.1:8000`
- Swagger Interactive Documentation: `http://127.0.0.1:8000/docs`

### Terminal 2: Frontend Server (Vite React)
```bash
cd frontend
npm run dev
```
- Application Web URL: `http://localhost:5173/`

---

## 2. Demonstration Accounts

The database is pre-seeded with realistic domestic electrical telemetry, appliances, anomalies, and rules:

| Account Role | Username / Email | Password | Recommended Use Case |
| :--- | :--- | :--- | :--- |
| **Resident (Demonstration Account)** | `demo@smartenergy.local` | `demo123` | Main dashboard walkthrough, analytics, anomaly review, AI predictions. |
| **System Administrator** | `admin` | `admin123` | Demonstrating role-based access control, device actuation, automation creation. |

---

## 3. Recommended 5-Minute Live Presentation Flow

### Step 1: Sign-In & Authentication Guard (Minute 0:00 – 0:45)
- Open `http://localhost:5173/`.
- Show the **Hero Section** highlighting the three architectural pillars: Submetered IoT Telemetry, AI Forecasting, and Home Assistant integration.
- Click **Sign In**. The pre-filled credentials for `demo@smartenergy.local` are visible.
- Click **Sign In to Dashboard**. Point out the JWT session creation and the top bar's **DEMO DATA ACTIVE** and **Home Assistant • Simulated** status chips, establishing that the demonstration is running on reproducible synthetic telemetry.

### Step 2: Overview Dashboard & Real-Time Telemetry (Minute 0:45 – 1:45)
- Point to the **KPI Cards**:
  - Current Power Draw ($W$), Today's Energy ($kWh$), and Estimated Daily Cost ($\text{₹}$).
- Highlight the **Load Profile Chart**: Show the 24-hour diurnal pattern reflecting morning and evening household peaks.
- Point to the **Appliance Breakdown Widget**: Shows submetered consumption percentages (e.g., Inverter AC taking 38%, Refrigerator baseline, Geyser).

### Step 3: Energy Analytics & Historical Audit (Minute 1:45 – 2:30)
- Navigate to **Analytics** (`/app/analytics`).
- Demonstrate the date range filter and granularity toggle (**Daily** vs **Hourly**).
- Point to the underlying data table: Explain that the analytics and overview dashboard share the exact same SQLite aggregate data store, preventing conflicting numbers.
- Show the **Data Quality Badge** (`Demo Verified`).

### Step 4: Submetered Appliances & Detail View (Minute 2:30 – 3:15)
- Navigate to **Appliances** (`/app/appliances`).
- Filter by category: **Climate**, **Switch**, **Light**.
- Click into an appliance: e.g., **Mains Inverter AC** (`/app/appliances/1`).
- Show the 7-day electrical demand chart and device entity metadata (`switch.living_room_ac`).
- Point out the **Safety Guardrail**: Explain that vital appliances (like refrigerators) have software interlocking to prevent accidental shutoff.

### Step 5: AI Forecasting & Anomaly Center (Minute 3:15 – 4:15)
- Navigate to **AI Insights** (`/app/ai-insights`).
  - Explain the 24-hour day-ahead forecast with lower and upper uncertainty bounds ($\pm 15\%$).
  - Point to the honest model transparency notice: The model uses empirical diurnal baseline harmonisation; evaluation metrics ($MAE = 0.18$, $RMSE = 0.24$) are derived from rolling 7-day historical test samples.
- Navigate to **Anomaly Center** (`/app/anomalies`).
  - Open the critical event: *"Geyser running unattended during peak hours"*.
  - Explain the detection mechanism: Statistical Z-score deviation ($\sigma > 3.5$) over the expected baseline. Click **Acknowledge** to demonstrate live state update.

### Step 6: Reports & API Documentation (Minute 4:15 – 5:00)
- Navigate to **Reports** (`/app/reports`).
  - Click **Export Summary CSV** or **Generate & Download CSV**. Show the generated `.csv` file in the browser downloads to demonstrate export compliance.
- Switch to the Swagger API UI (`http://127.0.0.1:8000/docs`).
  - Execute `GET /api/v1/health` or `GET /api/v1/energy/current` to prove that the frontend is backed by real REST APIs.

---

## 4. Troubleshooting & Quick Fixes

- **Port 8000 already in use**:
  - Run in PowerShell: `Get-Process python | Stop-Process` then restart uvicorn.
- **Port 5173 already in use**:
  - Vite will automatically attempt port 5174. If so, open the displayed URL in your browser.
- **Tokens expired**:
  - Click Sign Out on the profile page or navigate directly to `/signin` and sign in again.
