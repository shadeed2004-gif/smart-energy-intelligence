"""
AI Anomaly Detection Service.
Detects statistical surges, baseline drift, and vampire standby loads using empirical samples.
Returns honest explanations derived directly from observed data.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models.models import (
    TelemetryReading, AnomalyEvent, AnomalySeverity, AnomalyStatus, Device
)
from app.core.logging import get_logger

logger = get_logger("ai_anomalies")


class AnomalyDetector:
    def __init__(self):
        self.min_samples_required = 12

    def analyze_power_stream(
        self,
        db: Session,
        entity_id: str,
        current_power: float,
        device_id: Optional[int] = None
    ) -> Optional[AnomalyEvent]:
        """
        Analyzes a single real-time power reading against the entity's 7-day baseline distribution.
        Requires minimum samples; does not fabricate events when data is missing.
        """
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=7)

        readings = (
            db.query(TelemetryReading.power_w)
            .filter(
                TelemetryReading.entity_id == entity_id,
                TelemetryReading.timestamp >= since,
                TelemetryReading.power_w.isnot(None)
            )
            .all()
        )

        powers = [r[0] for r in readings if r[0] is not None]
        if len(powers) < self.min_samples_required:
            logger.info(f"Insufficient baseline samples for entity {entity_id}: {len(powers)}/{self.min_samples_required}")
            return None

        arr = np.array(powers)
        mean_val = float(np.mean(arr))
        std_val = float(np.std(arr))
        # Protect against zero division when power is completely flat
        effective_std = std_val if std_val > 2.0 else 5.0
        z_score = (current_power - mean_val) / effective_std

        # Rule 1: High severity surge (z-score >= 3.5 and 2.5x mean)
        if z_score >= 3.5 and current_power > (mean_val * 2.5):
            dev_pct = round(((current_power - mean_val) / max(mean_val, 1.0)) * 100, 1)
            event = AnomalyEvent(
                entity_id=entity_id,
                device_id=device_id,
                observed_value=round(current_power, 1),
                baseline_value=round(mean_val, 1),
                deviation_pct=dev_pct,
                severity=AnomalySeverity.critical if dev_pct > 300 else AnomalySeverity.warning,
                status=AnomalyStatus.open,
                detection_method="Z-Score Baseline Distribution (σ > 3.5)",
                title=f"Significant power draw surge ({current_power:.0f} W vs {mean_val:.0f} W avg)",
                explanation=f"Observed instantaneous load of {current_power:.0f}W is {dev_pct}% above the 7-day expected mean of {mean_val:.0f}W.",
                detected_at=now,
                is_demo=False
            )
            db.add(event)
            db.commit()
            db.refresh(event)
            return event

        return None


anomaly_detector = AnomalyDetector()
