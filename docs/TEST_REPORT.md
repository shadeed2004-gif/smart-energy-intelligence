# Automated Test Execution Report

**Date of Execution**: 2026-10-28  
**Python Runtime**: 3.12.10 (win32)  
**Test Runner**: pytest 8.3.4 with pytest-asyncio 0.24.0  
**Build Tool**: Vite 8.3.5 / TypeScript 5.8  

---

## 1. Backend Test Execution

### Execution Command
```bash
python -m pytest tests/
```

### Actual Console Output
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-8.3.4, pluggy-1.6.0
rootdir: C:\Users\USER\Downloads\project\smart-energy-intelligence\backend
plugins: anyio-4.14.2, asyncio-0.24.0
asyncio: mode=Mode.STRICT, default_loop_scope=None
collected 12 items

tests\test_api.py ............                                           [100%]

======================= 12 passed, 6 warnings in 1.56s ========================
```

### Test Case Coverage

1. `test_unauthenticated_request_rejected`:
   - Validates that requests to `/api/v1/auth/me` without Bearer token yield `401 Unauthorized`.
2. `test_invalid_token_rejected`:
   - Validates that forged or malformed tokens yield `401 Unauthorized`.
3. `test_expired_token_rejected`:
   - Validates that tokens with expired UTC timestamps are rejected.
4. `test_authenticated_me_resolves_correct_user`:
   - Validates that the JWT subject dynamically resolves the corresponding account (`resident` vs `admin`) and never returns a fixed fallback user.
5. `test_role_authorization_viewer_cannot_actuate_device`:
   - Validates that users with the `viewer` role attempting `POST /api/v1/devices/{id}/state` are blocked with `403 Forbidden`.
6. `test_role_authorization_admin_can_actuate_device`:
   - Validates that users with the `admin` role are permitted to execute device control requests.
7. `test_safety_guardrail_prevents_fridge_turnoff`:
   - Validates that safety guardrails prevent accidental shutdown of critical food preservation appliances (`kitchen_fridge`).
8. `test_energy_recording_and_aggregation`:
   - Validates unit conversion: 1000W active load equates to 1.0 kWh interval energy equivalence.
9. `test_single_tariff_source`:
   - Asserts that all endpoints derive pricing from the single active database tariff configuration.
10. `test_forecasting_generates_24_predictions`:
    - Validates 24-hour ahead horizon prediction with mathematically consistent upper and lower uncertainty intervals.
11. `test_anomaly_detector_insufficient_samples`:
    - Asserts that the anomaly detector returns `None` rather than fabricating an anomaly when baseline samples are insufficient.
12. `test_ha_client_unconfigured_demo_mode`:
    - Validates honest demo mode labeling when Home Assistant credentials are unconfigured.

---

## 2. Frontend Production Compilation

### Execution Command
```bash
npm run build
```

### Actual Output
```text
> frontend@0.0.0 build
> tsc && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 993 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.01 kB │ gzip:   0.57 kB
dist/assets/index-nHyBjUKI.css   36.56 kB │ gzip:   6.58 kB
dist/assets/index-DXO2MGFk.js   839.39 kB │ gzip: 243.55 kB
✓ built in 2.49s
```

---

## 3. Operational Limitations & Outstanding Items

1. **Hardware Verification**: Live communication with physical Home Assistant smart plugs requires deployment on the local network (see deployment checklist).
2. **PostgreSQL / TimescaleDB Migration**: SQLite with WAL mode is used for Raspberry Pi development; high-scale multi-year historical queries should migrate to PostgreSQL.
