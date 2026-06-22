"""Sensor platform for Pool Pump Manager."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    UnitOfElectricCurrent,
    UnitOfElectricPotential,
    UnitOfEnergy,
    UnitOfFrequency,
    UnitOfPower,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    DOMAIN,
    CONF_POWER_SENSOR,
    CONF_ENERGY_SENSOR,
    CONF_VOLTAGE_SENSOR,
    CONF_CURRENT_SENSOR,
    CONF_FREQUENCY_SENSOR,
)
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
            # Runtime / automation sensors
            PoolPumpRuntimeTodaySensor(coordinator, entry),
            PoolPumpTargetRuntimeSensor(coordinator, entry),
            PoolPumpStatusSensor(coordinator, entry),
            PoolPumpEfficiencySensor(coordinator, entry),
            PoolPumpNextStartSensor(coordinator, entry),
            PoolPumpRemainingRuntimeSensor(coordinator, entry),
            # Metering mirror sensors
            PoolPumpPowerSensor(coordinator, entry),
            PoolPumpEnergySensor(coordinator, entry),
            PoolPumpVoltageSensor(coordinator, entry),
            PoolPumpCurrentSensor(coordinator, entry),
            PoolPumpFrequencySensor(coordinator, entry),
        ]
    )


# ──────────────────────────────────────────────────────────────────────────────
# Base class
# ──────────────────────────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────────────────────────
# Runtime / automation sensors (unchanged from v0.1.0)
# ──────────────────────────────────────────────────────────────────────────────

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
            "pool_volume_m3": self.coordinator.pool_volume,
            "pump_flow_rate_m3h": self.coordinator.pump_flow_rate,
            "circulations_per_day": self.coordinator.circulations_per_day,
        }


class PoolPumpStatusSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "status"
    _attr_icon = "mdi:pool"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "status")

    @property
    def native_value(self) -> str:
        return self.coordinator.data.get("status", "unknown")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Diagnostic: which source entities supply each metering value."""
        sources = self.coordinator.data.get("metering_sources", {})
        return {
            "metering_power_source": sources.get("power"),
            "metering_energy_source": sources.get("energy"),
            "metering_voltage_source": sources.get("voltage"),
            "metering_current_source": sources.get("current"),
            "metering_frequency_source": sources.get("frequency"),
        }


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
    _attr_device_class = SensorDeviceClass.TIMESTAMP
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


# ──────────────────────────────────────────────────────────────────────────────
# Metering mirror sensors (new in v0.2.0)
# ──────────────────────────────────────────────────────────────────────────────

class _MeteringSensor(_PoolPumpBaseSensor):
    """Base for sensors that mirror an external metering entity."""

    _metering_key: str
    _source_entity_prop: str
    _fallback_unit: str

    @property
    def available(self) -> bool:
        return (
            self.coordinator.last_update_success
            and bool(getattr(self.coordinator, self._source_entity_prop))
        )

    @property
    def native_value(self) -> float | None:
        return self.coordinator.data.get(self._metering_key)

    @property
    def native_unit_of_measurement(self) -> str:
        """Mirror the unit of the source entity so HA handles conversion correctly."""
        entity_id = getattr(self.coordinator, self._source_entity_prop)
        if entity_id:
            state = self.hass.states.get(entity_id)
            if state:
                uom = state.attributes.get("unit_of_measurement")
                if uom:
                    return uom
        return self._fallback_unit

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        entity_id = getattr(self.coordinator, self._source_entity_prop)
        return {"source_entity": entity_id}


class PoolPumpPowerSensor(_MeteringSensor):
    _attr_translation_key = "metering_power"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:lightning-bolt"
    _metering_key = "metering_power"
    _source_entity_prop = "power_sensor_entity"
    _fallback_unit = UnitOfPower.WATT

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "metering_power")


class PoolPumpEnergySensor(_MeteringSensor):
    _attr_translation_key = "metering_energy"
    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_icon = "mdi:counter"
    _metering_key = "metering_energy"
    _source_entity_prop = "energy_sensor_entity"
    _fallback_unit = UnitOfEnergy.KILO_WATT_HOUR

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "metering_energy")


class PoolPumpVoltageSensor(_MeteringSensor):
    _attr_translation_key = "metering_voltage"
    _attr_device_class = SensorDeviceClass.VOLTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:sine-wave"
    _metering_key = "metering_voltage"
    _source_entity_prop = "voltage_sensor_entity"
    _fallback_unit = UnitOfElectricPotential.VOLT

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "metering_voltage")


class PoolPumpCurrentSensor(_MeteringSensor):
    _attr_translation_key = "metering_current"
    _attr_device_class = SensorDeviceClass.CURRENT
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:current-ac"
    _metering_key = "metering_current"
    _source_entity_prop = "current_sensor_entity"
    _fallback_unit = UnitOfElectricCurrent.AMPERE

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "metering_current")


class PoolPumpFrequencySensor(_MeteringSensor):
    _attr_translation_key = "metering_frequency"
    _attr_device_class = SensorDeviceClass.FREQUENCY
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:waveform"
    _metering_key = "metering_frequency"
    _source_entity_prop = "frequency_sensor_entity"
    _fallback_unit = UnitOfFrequency.HERTZ

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "metering_frequency")
