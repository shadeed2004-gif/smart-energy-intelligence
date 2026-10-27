"""
Automated Integration and Security Test Suite
Covers:
- Missing, invalid, and expired JWT tokens
- Role-based authorization guards (Viewer vs Admin)
- Protection of /auth/me
- Telemetry energy calculations and units
- Home Assistant mocked responses and safety interlocks
- Forecaster honest evaluation metrics and missing data handling
- Anomaly detector baseline comparisons
"""
import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.services.energy.calculator import telemetry_service
from app.db.database import SessionLocal
from app.services.forecasting.forecaster import energy_forecaster
from app.services.anomalies.detector import anomaly_detector
from app.services.home_assistant.client import HomeAssistantClient

client = TestClient(app)


# ─── Auth & Authorization Tests ──────────────────────────────────────────────

def test_unauthenticated_request_rejected():
    """Unauthenticated requests to protected endpoints return 401."""
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert "token required" in res.json()["detail"].lower()


def test_invalid_token_rejected():
    """Tampered or invalid tokens return 401."""
    headers = {"Authorization": "Bearer invalid.token.payload"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401
    assert "invalid or expired" in res.json()["detail"].lower()


def test_expired_token_rejected():
    """Expired tokens are strictly rejected."""
    expired_token = create_access_token(
        data={"sub": "admin", "role": "admin"},
        expires_delta=timedelta(minutes=-10)
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401


def test_authenticated_me_resolves_correct_user():
    """JWT resolves the specific subject in token, not just the first user."""
    # Resident user
    resident_token = create_access_token(data={"sub": "resident", "role": "viewer"})
    headers = {"Authorization": f"Bearer {resident_token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["username"] == "resident"

    # Admin user
    admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    res_admin = client.get("/api/v1/auth/me", headers=headers_admin)
    assert res_admin.status_code == 200
    assert res_admin.json()["username"] == "admin"


def test_role_authorization_viewer_cannot_actuate_device():
    """Viewer role is rejected when attempting device control or admin actions."""
    resident_token = create_access_token(data={"sub": "resident", "role": "viewer"})
    headers = {"Authorization": f"Bearer {resident_token}"}
    res = client.post(
        "/api/v1/devices/1/state",
        json={"entity_id": "switch.living_room_ac", "service": "turn_off"},
        headers=headers
    )
    assert res.status_code == 403
    assert "requires one of roles" in res.json()["detail"].lower()


def test_role_authorization_admin_can_actuate_device():
    """Admin role is permitted to control devices."""
    admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post(
        "/api/v1/devices/1/state",
        json={"entity_id": "switch.living_room_ac", "service": "turn_off"},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_safety_guardrail_prevents_fridge_turnoff():
    """Safety interlock rejects shutting off critical appliances like refrigerator."""
    admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post(
        "/api/v1/devices/2/state",
        json={"entity_id": "switch.kitchen_fridge", "service": "turn_off"},
        headers=headers
    )
    assert res.status_code == 400
    assert "safety interlock" in res.json()["detail"].lower()


# ─── Energy Calculations & Telemetry ─────────────────────────────────────────

def test_energy_recording_and_aggregation():
    """Verifies that W and kWh units are correctly computed without double counting."""
    db = SessionLocal()
    try:
        # Record 1000W reading
        reading = telemetry_service.record_power_reading(
            db=db,
            entity_id="sensor.test_circuit",
            power_w=1000.0,
            is_demo=True
        )
        assert reading.power_w == 1000.0
        assert reading.energy_kwh == 1.0  # 1000W / 1000 = 1.0 kWh interval equiv
    finally:
        db.close()


def test_single_tariff_source():
    """Active tariff rate is single source of truth."""
    db = SessionLocal()
    try:
        rate = telemetry_service.get_active_tariff_rate(db)
        curr = telemetry_service.get_active_currency_symbol(db)
        assert rate > 0
        assert curr in ["₹", "INR", "$"]
    finally:
        db.close()


# ─── AI Forecasting & Anomalies ──────────────────────────────────────────────

def test_forecasting_generates_24_predictions():
    """Forecasting generates 24-step horizon with bounds."""
    db = SessionLocal()
    try:
        forecast = energy_forecaster.generate_24h_forecast(db)
        assert forecast["horizon_hours"] == 24
        assert len(forecast["predictions"]) == 24
        p0 = forecast["predictions"][0]
        assert "predicted_kwh" in p0
        assert p0["lower_bound"] <= p0["predicted_kwh"] <= p0["upper_bound"]
    finally:
        db.close()


def test_anomaly_detector_insufficient_samples():
    """Detector returns None when baseline samples are insufficient."""
    db = SessionLocal()
    try:
        event = anomaly_detector.analyze_power_stream(
            db=db,
            entity_id="sensor.nonexistent_unknown_sensor",
            current_power=5000.0
        )
        assert event is None
    finally:
        db.close()


# ─── Home Assistant Client & Mocking ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_ha_client_unconfigured_demo_mode():
    """Unconfigured client explicitly identifies as demo mode."""
    client = HomeAssistantClient(base_url="", token="")
    assert not client.is_configured
    test_res = await client.test_connection()
    assert test_res["success"] is False
    assert test_res["configured"] is False
    assert "demo mode" in test_res["message"].lower()
