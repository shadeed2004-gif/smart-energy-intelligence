"""
All SQLAlchemy ORM models for Smart Energy Intelligence.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    viewer = "viewer"


class DeviceType(str, enum.Enum):
    switch = "switch"
    light = "light"
    climate = "climate"
    sensor = "sensor"
    other = "other"


class DeviceStatus(str, enum.Enum):
    online = "online"
    offline = "offline"
    unavailable = "unavailable"
    unknown = "unknown"


class AnomalySeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AnomalyStatus(str, enum.Enum):
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"


class RecommendationStatus(str, enum.Enum):
    active = "active"
    applied = "applied"
    dismissed = "dismissed"


class AutomationStatus(str, enum.Enum):
    enabled = "enabled"
    disabled = "disabled"


class AuditAction(str, enum.Enum):
    login = "login"
    logout = "logout"
    login_failed = "login_failed"
    device_control = "device_control"
    automation_created = "automation_created"
    automation_modified = "automation_modified"
    automation_executed = "automation_executed"
    integration_changed = "integration_changed"
    settings_changed = "settings_changed"
    user_created = "user_created"


# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SAEnum(UserRole), default=UserRole.viewer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class HAIntegration(Base):
    """Home Assistant integration configuration - credentials never leave backend."""
    __tablename__ = "ha_integrations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Home Assistant")
    base_url = Column(String(500), nullable=False)
    # Token stored server-side only, never returned in API responses
    _token_hash = Column("token_hash", String(255))
    verify_ssl = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_connected_at = Column(DateTime(timezone=True))
    last_error = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    devices = relationship("Device", back_populates="integration")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    devices = relationship("Device", back_populates="room")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    entity_id = Column(String(200), unique=True, nullable=False, index=True)
    device_type = Column(SAEnum(DeviceType), default=DeviceType.other)
    status = Column(SAEnum(DeviceStatus), default=DeviceStatus.unknown)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    integration_id = Column(Integer, ForeignKey("ha_integrations.id"), nullable=True)
    is_controllable = Column(Boolean, default=False)
    has_power_monitoring = Column(Boolean, default=False)
    # Entity ID for power sensor, if different from device entity
    power_entity_id = Column(String(200))
    energy_entity_id = Column(String(200))
    current_power_w = Column(Float)
    last_seen = Column(DateTime(timezone=True))
    attributes = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    room = relationship("Room", back_populates="devices")
    integration = relationship("HAIntegration", back_populates="devices")
    telemetry = relationship("TelemetryReading", back_populates="device")


class TelemetryReading(Base):
    __tablename__ = "telemetry_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    # entity_id for whole-home sensors not mapped to a device
    entity_id = Column(String(200), index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    power_w = Column(Float)       # instantaneous power in Watts
    energy_kwh = Column(Float)    # cumulative or interval energy in kWh
    state_value = Column(String(100))  # raw state string
    is_demo = Column(Boolean, default=False)
    source = Column(String(50), default="ha")  # ha | demo | manual

    device = relationship("Device", back_populates="telemetry")

    __table_args__ = (
        Index("ix_telemetry_entity_ts", "entity_id", "timestamp"),
        UniqueConstraint("entity_id", "timestamp", name="uq_telemetry_entity_ts"),
    )


class EnergyAggregate(Base):
    """Pre-computed daily/hourly energy aggregates for performance."""
    __tablename__ = "energy_aggregates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), nullable=False)   # YYYY-MM-DD
    hour = Column(Integer, nullable=True)        # 0-23, NULL for daily
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    entity_id = Column(String(200))
    total_energy_kwh = Column(Float, nullable=False)
    peak_power_w = Column(Float)
    avg_power_w = Column(Float)
    reading_count = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False)
    computed_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        Index("ix_agg_date_entity", "date", "entity_id"),
    )


class TariffConfig(Base):
    __tablename__ = "tariff_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Default")
    currency = Column(String(10), default="INR")
    currency_symbol = Column(String(5), default="₹")
    rate_per_kwh = Column(Float, nullable=False, default=8.00)
    # Future: tiered rates stored as JSON
    tiers = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    generated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    horizon_hours = Column(Integer, nullable=False)
    method = Column(String(50))  # e.g., "seasonal_naive", "moving_average"
    entity_id = Column(String(200))
    # JSON array of {timestamp, predicted_kwh, lower_bound, upper_bound}
    predictions = Column(JSON, nullable=False)
    mae = Column(Float)    # Mean Absolute Error on validation set
    rmse = Column(Float)   # Root Mean Squared Error
    evaluation_period = Column(String(100))
    training_samples = Column(Integer)
    notes = Column(Text)
    is_demo = Column(Boolean, default=False)


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)
    detected_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    entity_id = Column(String(200))
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    observed_value = Column(Float)
    baseline_value = Column(Float)
    deviation_pct = Column(Float)
    severity = Column(SAEnum(AnomalySeverity), default=AnomalySeverity.warning)
    status = Column(SAEnum(AnomalyStatus), default=AnomalyStatus.open)
    detection_method = Column(String(100))
    title = Column(String(300))
    explanation = Column(Text)
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True))
    is_demo = Column(Boolean, default=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    evidence = Column(Text)
    suggested_action = Column(Text)
    estimated_saving_inr_month = Column(Float)
    saving_confidence = Column(String(50))  # low | medium | high
    priority = Column(String(20), default="medium")  # low | medium | high
    status = Column(SAEnum(RecommendationStatus), default=RecommendationStatus.active)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    is_demo = Column(Boolean, default=False)


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    trigger = Column(JSON, nullable=False)    # {type, entity_id, condition, value}
    conditions = Column(JSON)
    actions = Column(JSON, nullable=False)    # [{service, entity_id, data}]
    schedule = Column(JSON)                   # {cron, timezone}
    status = Column(SAEnum(AutomationStatus), default=AutomationStatus.disabled)
    last_executed_at = Column(DateTime(timezone=True))
    last_execution_result = Column(String(50))  # success | failed | skipped
    execution_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    message = Column(Text)
    severity = Column(String(20), default="info")  # info | warning | critical
    category = Column(String(50))  # anomaly | connection | automation | system
    is_read = Column(Boolean, default=False)
    related_id = Column(Integer)        # FK to anomaly / automation etc.
    related_type = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(100))
    action = Column(SAEnum(AuditAction), nullable=False)
    resource_type = Column(String(100))
    resource_id = Column(String(100))
    description = Column(Text)
    ip_address = Column(String(50))
    success = Column(Boolean, default=True)
    details = Column(JSON)


class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    category = Column(String(50))
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
