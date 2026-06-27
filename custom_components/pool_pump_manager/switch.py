"""Switch platform for Pool Pump Manager."""
from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import PoolPumpCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: PoolPumpCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([PoolPumpAutomationSwitch(coordinator, entry)])


class PoolPumpAutomationSwitch(CoordinatorEntity[PoolPumpCoordinator], SwitchEntity):
    """Switch to enable/disable pump automation."""

    _attr_has_entity_name = True
    _attr_translation_key = "automation_enabled"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_automation_enabled"
        self._attr_device_info = _device_info(entry)

    @property
    def is_on(self) -> bool:
        return self.coordinator.data.get("automation_enabled", False)

    async def async_turn_on(self, **kwargs: object) -> None:
        await self.coordinator.async_set_automation(True)

    async def async_turn_off(self, **kwargs: object) -> None:
        await self.coordinator.async_set_automation(False)

    @property
    def icon(self) -> str:
        return "mdi:robot" if self.is_on else "mdi:robot-off"


def _device_info(entry: ConfigEntry) -> dict:
    return {
        "identifiers": {(DOMAIN, entry.entry_id)},
        "name": "Pool Pump Manager",
        "manufacturer": "Pool Pump Manager",
        "model": "Virtual Device",
        "sw_version": "0.6.1",
    }
