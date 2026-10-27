"""
Seeds the database with initial users, sample devices, telemetry, anomalies, and recommendations.
"""
from datetime import datetime, timedelta, timezone
import random
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.models import (
    User, UserRole, HAIntegration, Room, Device, DeviceType, DeviceStatus,
    TelemetryReading, EnergyAggregate, TariffConfig, AnomalyEvent, AnomalySeverity,
    AnomalyStatus, Recommendation, RecommendationStatus, AutomationRule,
    AutomationStatus, Notification, AppSettings
)
from app.core.security import get_password_hash


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Admin & Demo Users
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@smartenergy.local",
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin_user)

        demo_user = db.query(User).filter(User.username == "resident").first()
        if not demo_user:
            demo_user = User(
                email="demo@smartenergy.local",
                username="resident",
                full_name="Arjun Mehta",
                hashed_password=get_password_hash("demo123"),
                role=UserRole.viewer,
                is_active=True,
            )
            db.add(demo_user)
        db.commit()

        # 2. Tariff Config
        tariff = db.query(TariffConfig).filter(TariffConfig.is_active == True).first()
        if not tariff:
            tariff = TariffConfig(
                name="Domestic Tier-2 ToD",
                currency="INR",
                currency_symbol="₹",
                rate_per_kwh=7.50,
                is_active=True,
            )
            db.add(tariff)
            db.commit()

        # 3. Rooms
        room_names = ["Living Room", "Master Bedroom", "Kitchen", "Home Office", "Utility Room"]
        room_map = {}
        for r_name in room_names:
            room = db.query(Room).filter(Room.name == r_name).first()
            if not room:
                room = Room(name=r_name, description=f"{r_name} circuits and smart plugs")
                db.add(room)
                db.commit()
                db.refresh(room)
            room_map[r_name] = room

        # 4. Devices
        devices_data = [
            ("Mains Inverter AC", "switch.living_room_ac", DeviceType.climate, "Living Room", 1450.0, True, True),
            ("Inverter Refrigerator", "switch.kitchen_fridge", DeviceType.switch, "Kitchen", 120.0, False, True),
            ("Washing Machine (Front Load)", "switch.utility_washer", DeviceType.switch, "Utility Room", 650.0, True, True),
            ("Water Geyser / Boiler", "switch.bathroom_geyser", DeviceType.switch, "Utility Room", 2000.0, True, True),
            ("EV Charger 3.3kW", "switch.garage_ev_charger", DeviceType.switch, "Living Room", 3300.0, True, True),
            ("Home Office Workstation", "switch.office_pc", DeviceType.switch, "Home Office", 185.0, True, True),
            ("Ceiling Fans & Ambient Lighting", "light.living_room_lights", DeviceType.light, "Living Room", 75.0, True, False),
        ]

        device_objs = []
        for name, entity_id, dtype, rname, pwr, ctrl, pwr_mon in devices_data:
            dev = db.query(Device).filter(Device.entity_id == entity_id).first()
            if not dev:
                dev = Device(
                    name=name,
                    entity_id=entity_id,
                    device_type=dtype,
                    status=DeviceStatus.online,
                    room_id=room_map[rname].id,
                    is_controllable=ctrl,
                    has_power_monitoring=pwr_mon,
                    current_power_w=pwr,
                    last_seen=datetime.now(timezone.utc),
                )
                db.add(dev)
                db.commit()
                db.refresh(dev)
            device_objs.append(dev)

        # 5. Telemetry & Aggregate History (Last 14 days)
        now = datetime.now(timezone.utc)
        reading_count = db.query(TelemetryReading).count()
        if reading_count < 200:
            for day_offset in range(14, -1, -1):
                day_date = (now - timedelta(days=day_offset)).strftime("%Y-%m-%d")
                day_total_kwh = 0.0
                day_peak_w = 0.0

                for hour in range(24):
                    ts = (now - timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
                    # Diurnal pattern: peaks morning (7-10) and evening (18-22)
                    is_peak = (7 <= hour <= 10) or (18 <= hour <= 22)
                    base_w = random.uniform(250, 450)
                    peak_add = random.uniform(800, 2200) if is_peak else random.uniform(50, 300)
                    tot_w = base_w + peak_add
                    kwh = tot_w / 1000.0
                    day_total_kwh += kwh
                    day_peak_w = max(day_peak_w, tot_w)

                    # Main whole-home reading
                    db.add(TelemetryReading(
                        entity_id="sensor.mains_active_power",
                        timestamp=ts,
                        power_w=round(tot_w, 1),
                        energy_kwh=round(kwh, 3),
                        is_demo=True,
                        source="demo"
                    ))

                # Daily aggregate
                db.add(EnergyAggregate(
                    date=day_date,
                    entity_id="sensor.mains_active_power",
                    total_energy_kwh=round(day_total_kwh, 2),
                    peak_power_w=round(day_peak_w, 1),
                    avg_power_w=round(day_total_kwh * 1000 / 24, 1),
                    reading_count=24,
                    is_demo=True
                ))
            db.commit()

        # 6. Anomalies
        if db.query(AnomalyEvent).count() == 0:
            db.add_all([
                AnomalyEvent(
                    entity_id="switch.bathroom_geyser",
                    device_id=device_objs[3].id,
                    observed_value=2100.0,
                    baseline_value=0.0,
                    deviation_pct=100.0,
                    severity=AnomalySeverity.critical,
                    status=AnomalyStatus.open,
                    detection_method="Unscheduled Off-Peak Heating Detection",
                    title="Geyser running unattended during peak hours",
                    explanation="Water heater remained energized for 145 consecutive minutes between 14:00 and 16:25 with no downstream hot water draw. Estimated waste: 4.8 kWh.",
                    detected_at=now - timedelta(hours=2),
                    is_demo=True
                ),
                AnomalyEvent(
                    entity_id="switch.kitchen_fridge",
                    device_id=device_objs[1].id,
                    observed_value=240.0,
                    baseline_value=120.0,
                    deviation_pct=100.0,
                    severity=AnomalySeverity.warning,
                    status=AnomalyStatus.open,
                    detection_method="Compressor Duty Cycle Degradation",
                    title="Refrigerator compressor continuous duty cycle",
                    explanation="Compressor duty cycle exceeded 88% over the past 6 hours. Typical baseline is 45-50%. Check door gasket seal or condenser coils.",
                    detected_at=now - timedelta(hours=8),
                    is_demo=True
                ),
                AnomalyEvent(
                    entity_id="sensor.mains_active_power",
                    observed_value=485.0,
                    baseline_value=140.0,
                    deviation_pct=246.0,
                    severity=AnomalySeverity.info,
                    status=AnomalyStatus.acknowledged,
                    detection_method="Vampire Load Signature Scan",
                    title="High overnight base-load (Vampire Draw)",
                    explanation="Baseload between 02:00 and 05:00 hovered above 480W, representing 3.4 kWh of idle draw across standby home entertainment and wall adapters.",
                    detected_at=now - timedelta(days=1, hours=4),
                    acknowledged_at=now - timedelta(hours=18),
                    is_demo=True
                )
            ])
            db.commit()

        # 7. Recommendations
        if db.query(Recommendation).count() == 0:
            db.add_all([
                Recommendation(
                    title="Shift EV Charging to Super Off-Peak Window (01:00 - 05:00)",
                    description="EV charger drew 22.4 kWh during evening peak (19:00 - 22:30). Shifting via smart schedule yields direct tariff savings.",
                    evidence="3 charging sessions recorded during 18:00-22:00 window at ₹11.50/kWh vs ₹5.00/kWh off-peak tariff.",
                    suggested_action="Configure automated timer rule to start EV charger after 01:00 AM.",
                    estimated_saving_inr_month=450.0,
                    saving_confidence="high",
                    priority="high",
                    status=RecommendationStatus.active,
                    device_id=device_objs[4].id,
                    is_demo=True
                ),
                Recommendation(
                    title="Raise Air Conditioner Setpoint by 1.5°C to 24.5°C",
                    description="AC ran at 21°C during peak outdoor humidity, consuming 38% of total daily energy budget.",
                    evidence="Each 1°C temperature increase in cooling mode reduces compressor electrical burden by ~6%.",
                    suggested_action="Set thermostat target to 24°C with ceiling fan circulation assistance.",
                    estimated_saving_inr_month=320.0,
                    saving_confidence="medium",
                    priority="medium",
                    status=RecommendationStatus.active,
                    device_id=device_objs[0].id,
                    is_demo=True
                ),
                Recommendation(
                    title="Automate Idle Geyser Shutoff after 45 Minutes",
                    description="Water geyser frequently left on for >2 hours post-morning routine.",
                    evidence="Thermostat cycling maintains tank at 65°C with 1.2 kWh standby thermal radiation losses daily.",
                    suggested_action="Enable safety countdown automation to shut switch after 45 minutes of run time.",
                    estimated_saving_inr_month=280.0,
                    saving_confidence="high",
                    priority="high",
                    status=RecommendationStatus.active,
                    device_id=device_objs[3].id,
                    is_demo=True
                )
            ])
            db.commit()

        # 8. Automation Rules
        if db.query(AutomationRule).count() == 0:
            db.add_all([
                AutomationRule(
                    name="Nightly Vampire Load Cutoff",
                    description="Turn off non-essential home office peripherals at midnight.",
                    trigger={"type": "time", "at": "00:00"},
                    conditions=[{"entity_id": "switch.office_pc", "state": "on"}],
                    actions=[{"service": "switch.turn_off", "entity_id": "switch.office_pc"}],
                    status=AutomationStatus.enabled,
                    execution_count=14,
                    last_execution_result="success",
                    last_executed_at=now - timedelta(hours=23)
                ),
                AutomationRule(
                    name="Peak Demand Shaving (AC Throttle)",
                    description="If total mains power exceeds 5000W during peak hours, cycle AC fan mode.",
                    trigger={"type": "numeric_state", "entity_id": "sensor.mains_active_power", "above": 5000},
                    actions=[{"service": "climate.set_temperature", "entity_id": "switch.living_room_ac", "data": {"temperature": 25}}],
                    status=AutomationStatus.enabled,
                    execution_count=3,
                    last_execution_result="success",
                    last_executed_at=now - timedelta(days=2)
                )
            ])
            db.commit()

        # 9. Initial Notifications
        if db.query(Notification).count() == 0:
            db.add_all([
                Notification(
                    title="Peak Tariff Window Approaching",
                    message="High-tariff rate zone begins at 18:00. Heavy appliances scheduled have been deferred.",
                    severity="info",
                    category="tariff",
                    is_read=False
                ),
                Notification(
                    title="Critical Load Alert: Geyser Overrun",
                    message="Water heater has been operating for 145 mins. Safety review advised.",
                    severity="critical",
                    category="anomaly",
                    is_read=False
                )
            ])
            db.commit()

        # 10. Default Settings
        default_settings = [
            ("carbon_factor_kg_per_kwh", "0.82", "sustainability"),
            ("data_retention_days", "90", "maintenance"),
            ("ha_bridge_polling_interval_s", "30", "integration"),
        ]
        for key, val, cat in default_settings:
            if not db.query(AppSettings).filter(AppSettings.key == key).first():
                db.add(AppSettings(key=key, value=val, category=cat))
        db.commit()

        print("Database seeded successfully with users, devices, telemetry, and AI insights!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
