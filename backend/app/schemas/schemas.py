"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.models import (
    UserRole, DeviceType, DeviceStatus, AnomalySeverity, AnomalyStatus,
    RecommendationStatus, AutomationStatus, AuditAction
)


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: UserRole = UserRole.viewer


class UserOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    username: str
    password: str


# ─── HA Integration ───────────────────────────────────────────────────────────

class HAIntegrationCreate(BaseModel):
    name: str = "Home Assistant"
    base_url: str = Field(..., description="http://homeassistant.local:8123")
    token: str = Field(..., description="Long-lived access token — stored server-side only")
    verify_ssl: bool = False


class HAIntegrationOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    base_url: str
    verify_ssl: bool
    is_active: bool
    last_connected_at: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime
    # NOTE: token deliberately excluded


class HAConnectionTestResult(BaseModel):
    success: bool
    message: str
    ha_version: Optional[str] = None
    entity_count: Optional[int] = None
    latency_ms: Optional[float] = None


# ─── Device / Room ────────────────────────────────────────────────────────────

class RoomOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    description: Optional[str]


class DeviceOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    entity_id: str
    device_type: DeviceType
    status: DeviceStatus
    room_id: Optional[int]
    room: Optional[RoomOut]
    is_controllable: bool
    has_power_monitoring: bool
    current_power_w: Optional[float]
    last_seen: Optional[datetime]


class DeviceControlRequest(BaseModel):
    entity_id: str
    service: str = Field(..., description="e.g. turn_on, turn_off, toggle")
    service_data: Optional[Dict[str, Any]] = None


# ─── Telemetry ────────────────────────────────────────────────────────────────

class CurrentPowerOut(BaseModel):
    timestamp: datetime
    total_power_w: float
    total_energy_today_kwh: float
    estimated_cost_today: float
    currency_symbol: str
    data_source: str  # live | demo | stale
    is_demo: bool
    last_sync: Optional[datetime]


class EnergyDataPoint(BaseModel):
    timestamp: datetime
    energy_kwh: float
    power_w: Optional[float] = None
    cost: Optional[float] = None
    is_forecast: bool = False


class EnergyHistoryOut(BaseModel):
    data: List[EnergyDataPoint]
    total_kwh: float
    total_cost: float
    currency_symbol: str
    period_start: datetime
    period_end: datetime
    is_demo: bool


class ApplianceConsumption(BaseModel):
    device_id: int
    device_name: str
    entity_id: str
    room_name: Optional[str]
    energy_kwh: float
    peak_power_w: Optional[float]
    percentage_of_total: float
    estimated_cost: float
    status: DeviceStatus


# ─── Forecast ─────────────────────────────────────────────────────────────────

class ForecastPoint(BaseModel):
    timestamp: datetime
    predicted_kwh: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class ForecastOut(BaseModel):
    generated_at: datetime
    horizon_hours: int
    method: str
    predictions: List[ForecastPoint]
    mae: Optional[float] = None
    rmse: Optional[float] = None
    evaluation_period: Optional[str] = None
    training_samples: Optional[int] = None
    notes: Optional[str] = None
    is_demo: bool
    insufficient_data: bool = False


# ─── Anomaly ──────────────────────────────────────────────────────────────────

class AnomalyOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    detected_at: datetime
    entity_id: Optional[str]
    device_id: Optional[int]
    observed_value: Optional[float]
    baseline_value: Optional[float]
    deviation_pct: Optional[float]
    severity: AnomalySeverity
    status: AnomalyStatus
    detection_method: Optional[str]
    title: str
    explanation: Optional[str]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    is_demo: bool


class AnomalyAcknowledge(BaseModel):
    notes: Optional[str] = None


# ─── Recommendation ───────────────────────────────────────────────────────────

class RecommendationOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    description: Optional[str]
    evidence: Optional[str]
    suggested_action: Optional[str]
    estimated_saving_inr_month: Optional[float]
    saving_confidence: Optional[str]
    priority: str
    status: RecommendationStatus
    device_id: Optional[int]
    created_at: datetime
    is_demo: bool


# ─── Automation ───────────────────────────────────────────────────────────────

class AutomationRuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    trigger: Dict[str, Any]
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: List[Dict[str, Any]]
    schedule: Optional[Dict[str, Any]] = None


class AutomationRuleOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    description: Optional[str]
    trigger: Dict[str, Any]
    conditions: Optional[List[Dict[str, Any]]]
    actions: List[Dict[str, Any]]
    schedule: Optional[Dict[str, Any]]
    status: AutomationStatus
    last_executed_at: Optional[datetime]
    last_execution_result: Optional[str]
    execution_count: int
    created_at: datetime


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    message: Optional[str]
    severity: str
    category: Optional[str]
    is_read: bool
    related_id: Optional[int]
    related_type: Optional[str]
    created_at: datetime


# ─── Audit ────────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    timestamp: datetime
    username: Optional[str]
    action: AuditAction
    resource_type: Optional[str]
    resource_id: Optional[str]
    description: Optional[str]
    ip_address: Optional[str]
    success: bool


# ─── System Health ────────────────────────────────────────────────────────────

class ServiceHealth(BaseModel):
    name: str
    status: str  # ok | degraded | down
    message: Optional[str] = None
    latency_ms: Optional[float] = None
    last_checked: datetime


class SystemHealthOut(BaseModel):
    overall: str
    services: List[ServiceHealth]
    demo_mode: bool
    app_version: str


# ─── Tariff ───────────────────────────────────────────────────────────────────

class TariffConfigOut(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    currency: str
    currency_symbol: str
    rate_per_kwh: float
    is_active: bool


class TariffConfigUpdate(BaseModel):
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    rate_per_kwh: Optional[float] = Field(None, gt=0)


# ─── Energy Analytics ─────────────────────────────────────────────────────────

class DailyConsumptionRecord(BaseModel):
    date: str
    total_energy_kwh: float
    peak_power_w: Optional[float]
    avg_power_w: Optional[float]
    estimated_cost: float
    active_device_count: Optional[int]
    data_quality: str  # good | partial | interpolated | demo


class EnergyAnalyticsSummary(BaseModel):
    total_energy_kwh: float
    daily_avg_kwh: float
    peak_power_w: Optional[float]
    estimated_cost: float
    currency_symbol: str
    period_days: int
    is_demo: bool
    records: List[DailyConsumptionRecord]


# ─── Reports ──────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str
    format: str = "json"  # json | csv
    include_appliances: bool = True
