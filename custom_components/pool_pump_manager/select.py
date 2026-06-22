"""Select platform for Pool Pump Manager – season mode."""
from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, SEASON_MODES
from .coordinator import PoolPumpCoordinator
from .switch import _device_info


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: PoolPumpCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([PoolPumpSeasonModeSelect(coordinator, entry)])


class PoolPumpSeasonModeSelect(CoordinatorEntity[PoolPumpCoordinator], SelectEntity):
    """Select entity for the pool pump season mode."""

    _attr_has_entity_name = True
    _attr_translation_key = "season_mode"
    _attr_options = SEASON_MODES
    _attr_icon = "mdi:weather-partly-cloudy"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_season_mode"
        self._attr_device_info = _device_info(entry)

    @property
    def current_option(self) -> str:
        return self.coordinator.data.get("season_mode", "auto")

    async def async_select_option(self, option: str) -> None:
        await self.coordinator.async_set_season_mode(option)
