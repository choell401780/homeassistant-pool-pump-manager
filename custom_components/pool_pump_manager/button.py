"""Button platform for Pool Pump Manager – maintenance and season reset."""
from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
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
            PoolPumpResetMaintenanceButton(coordinator, entry),
            PoolPumpResetSeasonButton(coordinator, entry),
        ]
    )


class PoolPumpResetMaintenanceButton(CoordinatorEntity[PoolPumpCoordinator], ButtonEntity):
    """Button to reset the maintenance runtime counter."""

    _attr_has_entity_name = True
    _attr_translation_key = "reset_maintenance"
    _attr_icon = "mdi:wrench-clock"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_reset_maintenance"
        self._attr_device_info = _device_info(entry)

    async def async_press(self) -> None:
        await self.coordinator.async_reset_maintenance()


class PoolPumpResetSeasonButton(CoordinatorEntity[PoolPumpCoordinator], ButtonEntity):
    """Button to reset the season runtime counter."""

    _attr_has_entity_name = True
    _attr_translation_key = "reset_season"
    _attr_icon = "mdi:calendar-refresh"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_reset_season"
        self._attr_device_info = _device_info(entry)

    async def async_press(self) -> None:
        await self.coordinator.async_reset_season()
