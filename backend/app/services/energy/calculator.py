"""
Telemetry Ingestion & Energy Aggregation Service.
Handles unit normalization (W vs kW, Wh vs kWh), time-window aggregation,
and duplicate avoidance.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import (
    TelemetryReading, EnergyAggregate, Device, TariffConfig
)
from app.core.logging import get_logger

logger = get_logger("telemetry_service")


class TelemetryService:
    @staticmethod
    def get_active_tariff_rate(db: Session) -> float:
        """Single source of truth for active tariff rate."""
        tariff = db.query(TariffConfig).filter(TariffConfig.is_active == True).first()
        return float(tariff.rate_per_kwh) if tariff else 7.50

    @staticmethod
    def get_active_currency_symbol(db: Session) -> str:
        tariff = db.query(TariffConfig).filter(TariffConfig.is_active == True).first()
        return str(tariff.currency_symbol) if tariff else "₹"

    @classmethod
    def record_power_reading(
        cls,
        db: Session,
        entity_id: str,
        power_w: float,
        timestamp: Optional[datetime] = None,
        device_id: Optional[int] = None,
        is_demo: bool = False,
        source: str = "ha"
    ) -> TelemetryReading:
        """
        Records an instantaneous active power reading in Watts (W) and computes interval kWh.
        """
        ts = timestamp or datetime.now(timezone.utc)
        reading = TelemetryReading(
            entity_id=entity_id,
            device_id=device_id,
            timestamp=ts,
            power_w=round(float(power_w), 2),
            energy_kwh=round(float(power_w) / 1000.0, 4),  # 1-hour equivalent interval estimate
            is_demo=is_demo,
            source=source
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return reading

    @classmethod
    def compute_daily_aggregate(
        cls,
        db: Session,
        target_date: str,
        entity_id: str = "sensor.mains_active_power"
    ) -> Optional[EnergyAggregate]:
        """
        Aggregates raw telemetry readings for a specific day (YYYY-MM-DD) into an EnergyAggregate record.
        Avoids double-counting by replacing or updating existing records.
        """
        start_ts = datetime.strptime(target_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end_ts = start_ts + timedelta(days=1)

        readings = (
            db.query(TelemetryReading)
            .filter(
                TelemetryReading.entity_id == entity_id,
                TelemetryReading.timestamp >= start_ts,
                TelemetryReading.timestamp < end_ts,
            )
            .all()
        )

        if not readings:
            return None

        powers = [r.power_w for r in readings if r.power_w is not None]
        peak_w = max(powers) if powers else 0.0
        avg_w = sum(powers) / len(powers) if powers else 0.0
        # Energy calculation: sum of (avg power in kW * hours elapsed)
        total_kwh = sum([r.energy_kwh for r in readings if r.energy_kwh is not None])
        if total_kwh == 0 and powers:
            # Trapeze approximation
            total_kwh = round((avg_w * 24.0) / 1000.0, 3)

        agg = (
            db.query(EnergyAggregate)
            .filter(
                EnergyAggregate.date == target_date,
                EnergyAggregate.entity_id == entity_id
            )
            .first()
        )

        if not agg:
            agg = EnergyAggregate(
                date=target_date,
                entity_id=entity_id,
                total_energy_kwh=round(total_kwh, 3),
                peak_power_w=round(peak_w, 1),
                avg_power_w=round(avg_w, 1),
                reading_count=len(readings),
                is_demo=any(r.is_demo for r in readings)
            )
            db.add(agg)
        else:
            agg.total_energy_kwh = round(total_kwh, 3)
            agg.peak_power_w = round(peak_w, 1)
            agg.avg_power_w = round(avg_w, 1)
            agg.reading_count = len(readings)

        db.commit()
        db.refresh(agg)
        return agg


telemetry_service = TelemetryService()
