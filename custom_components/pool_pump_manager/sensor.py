"""Sensor platform for Pool Pump Manager."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import PoolPumpCoordinator
from .switch import _device_info


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: PoolPumpCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            PoolPumpRuntimeTodaySensor(coordinator, entry),
            PoolPumpTargetRuntimeSensor(coordinator, entry),
            PoolPumpStatusSensor(coordinator, entry),
            PoolPumpEfficiencySensor(coordinator, entry),
            PoolPumpNextStartSensor(coordinator, entry),
            PoolPumpRemainingRuntimeSensor(coordinator, entry),
        ]
    )


class _PoolPumpBaseSensor(CoordinatorEntity[PoolPumpCoordinator], SensorEntity):
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: PoolPumpCoordinator,
        entry: ConfigEntry,
        unique_suffix: str,
    ) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_{unique_suffix}"
        self._attr_device_info = _device_info(entry)


class PoolPumpRuntimeTodaySensor(_PoolPumpBaseSensor):
    _attr_translation_key = "runtime_today"
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_icon = "mdi:timer-outline"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "runtime_today")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("runtime_today", 0.0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"target_runtime": self.coordinator.data.get("target_runtime", 0.0)}


class PoolPumpTargetRuntimeSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "target_runtime"
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_icon = "mdi:target"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "target_runtime")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("target_runtime", 0.0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "pool_volume_m3": coordinator_val(self.coordinator, "pool_volume"),
            "pump_flow_rate_m3h": coordinator_val(self.coordinator, "pump_flow_rate"),
            "circulations_per_day": coordinator_val(self.coordinator, "circulations"),
        }


class PoolPumpStatusSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "status"
    _attr_icon = "mdi:pool"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "status")

    @property
    def native_value(self) -> str:
        return self.coordinator.data.get("status", "unknown")


class PoolPumpEfficiencySensor(_PoolPumpBaseSensor):
    _attr_translation_key = "efficiency"
    _attr_native_unit_of_measurement = "%"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:chart-line"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "efficiency")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("efficiency", 0.0)


class PoolPumpNextStartSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "next_start"
    _attr_device_class = "timestamp"
    _attr_icon = "mdi:clock-start"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "next_start")

    @property
    def native_value(self) -> datetime | None:
        return self.coordinator.data.get("next_start")


class PoolPumpRemainingRuntimeSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "remaining_runtime"
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_icon = "mdi:timer-sand"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "remaining_runtime")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("remaining_runtime", 0.0)


def coordinator_val(coordinator: PoolPumpCoordinator, key: str) -> Any:
    """Safe attribute access."""
    return getattr(coordinator, key, None)
