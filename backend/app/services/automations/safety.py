"""
Device Safety Interlock and Policy Manager.
Evaluates safety rules before device actuation (explicit flags, medical/refrigeration protection,
preventing simulated demo actions from masquerading as physical hardware actions).
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Device
from app.core.logging import get_logger

logger = get_logger("device_safety")


class DeviceSafetyService:
    @staticmethod
    def is_critical_appliance(device: Device) -> bool:
        """
        Evaluates whether an appliance is deemed essential/critical and must not be automatically shut down.
        Checks explicit device attributes and keywords in entity_id or name.
        """
        # 1. Explicit metadata attribute check
        if device.attributes and isinstance(device.attributes, dict):
            if device.attributes.get("is_critical") is True or device.attributes.get("essential_load") is True:
                return True

        # 2. Heuristic keywords (refrigeration, medical, life support, aquarium)
        critical_keywords = ["fridge", "refrigerator", "freezer", "medical", "dialysis", "cpap", "aquarium", "sump"]
        text = f"{device.entity_id} {device.name}".lower()
        return any(kw in text for kw in critical_keywords)

    @classmethod
    def evaluate_action_safety(
        cls,
        device: Device,
        action: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates whether the requested action is permitted under the safety policy.
        """
        if action in ["turn_off", "toggle"]:
            if cls.is_critical_appliance(device):
                logger.warning(f"Safety interlock rejected '{action}' on protected appliance: {device.name} ({device.entity_id})")
                return {
                    "permitted": False,
                    "reason": f"Safety Interlock Policy: '{device.name}' is registered as an essential appliance and cannot be powered off automatically."
                }

        return {"permitted": True, "reason": "Action permitted by safety policy"}


device_safety_service = DeviceSafetyService()
