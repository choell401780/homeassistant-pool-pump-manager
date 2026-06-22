"""Binary sensor platform for Pool Pump Manager."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity, BinarySensorDeviceClass
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
            PoolPumpRunningBinarySensor(coordinator, entry),
            PoolPumpWarningBinarySensor(coordinator, entry),
        ]
    )


class PoolPumpRunningBinarySensor(CoordinatorEntity[PoolPumpCoordinator], BinarySensorEntity):
    """Binary sensor: is the pool pump currently running."""

    _attr_has_entity_name = True
    _attr_translation_key = "running"
    _attr_device_class = BinarySensorDeviceClass.RUNNING
    _attr_icon = "mdi:pump"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_running"
        self._attr_device_info = _device_info(entry)

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.data.get("pump_is_on", False))


class PoolPumpWarningBinarySensor(CoordinatorEntity[PoolPumpCoordinator], BinarySensorEntity):
    """Binary sensor: warning — pump on but no power draw."""

    _attr_has_entity_name = True
    _attr_translation_key = "warning"
    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_icon = "mdi:alert-circle"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_warning"
        self._attr_device_info = _device_info(entry)

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.data.get("warning", False))
