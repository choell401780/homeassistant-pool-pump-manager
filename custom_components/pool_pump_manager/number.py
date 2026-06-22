"""Number platform for Pool Pump Manager."""
from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
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
    async_add_entities([PoolPumpDailyRuntimeNumber(coordinator, entry)])


class PoolPumpDailyRuntimeNumber(CoordinatorEntity[PoolPumpCoordinator], NumberEntity):
    """Number entity to override the daily target runtime."""

    _attr_has_entity_name = True
    _attr_translation_key = "daily_runtime_hours"
    _attr_native_min_value = 0.0
    _attr_native_max_value = 24.0
    _attr_native_step = 0.1
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_mode = NumberMode.BOX
    _attr_icon = "mdi:timer-cog-outline"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_daily_runtime_hours"
        self._attr_device_info = _device_info(entry)

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("target_runtime", 0.0)

    async def async_set_native_value(self, value: float) -> None:
        self.coordinator.set_manual_runtime(value if value > 0 else None)
        await self.coordinator.async_force_recalculate()
