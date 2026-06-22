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
            # ── Automation sensors ──────────────────────────────────────
            PoolPumpRuntimeTodaySensor(coordinator, entry),
            PoolPumpTargetRuntimeSensor(coordinator, entry),
            PoolPumpStatusSensor(coordinator, entry),
            PoolPumpEfficiencySensor(coordinator, entry),
            PoolPumpNextStartSensor(coordinator, entry),
            PoolPumpRemainingRuntimeSensor(coordinator, entry),
            # ── Maintenance / lifetime counters (new v0.3.0) ────────────
            PoolPumpTotalRuntimeSensor(coordinator, entry),
            PoolPumpSeasonRuntimeSensor(coordinator, entry),
            PoolPumpRuntimeSinceMaintenanceSensor(coordinator, entry),
            # ── Metering mirror sensors (v0.2.0) ────────────────────────
            PoolPumpPowerSensor(coordinator, entry),
            PoolPumpEnergySensor(coordinator, entry),
            PoolPumpVoltageSensor(coordinator, entry),
            PoolPumpCurrentSensor(coordinator, entry),
            PoolPumpFrequencySensor(coordinator, entry),
            # ── Water quality placeholders (v0.3.0 prepared) ────────────
            PoolPumpPhSensor(coordinator, entry),
            PoolPumpRedoxSensor(coordinator, entry),
            PoolPumpPoolTemperatureSensor(coordinator, entry),
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
# Automation sensors (unchanged from v0.1.0 / v0.2.0)
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
            "circulations_per_day": self.coordinator.effective_circulations,
            "effective_season": self.coordinator.data.get("effective_season"),
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
        sources = self.coordinator.data.get("metering_sources", {})
        return {
            "effective_season": self.coordinator.data.get("effective_season"),
            "season_mode": self.coordinator.data.get("season_mode"),
            "seasonal_circulations": self.coordinator.data.get("seasonal_circulations"),
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
# Maintenance / lifetime counters (new v0.3.0)
# ──────────────────────────────────────────────────────────────────────────────

class PoolPumpTotalRuntimeSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "total_runtime"
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_icon = "mdi:timer-play-outline"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "total_runtime")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("total_runtime", 0.0)


class PoolPumpSeasonRuntimeSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "season_runtime"
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_icon = "mdi:weather-partly-cloudy"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "season_runtime")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("season_runtime", 0.0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"effective_season": self.coordinator.data.get("effective_season")}


class PoolPumpRuntimeSinceMaintenanceSensor(_PoolPumpBaseSensor):
    _attr_translation_key = "runtime_since_maintenance"
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_icon = "mdi:wrench-clock"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "runtime_since_maintenance")

    @property
    def native_value(self) -> float:
        return self.coordinator.data.get("runtime_since_maintenance", 0.0)


# ──────────────────────────────────────────────────────────────────────────────
# Metering mirror sensors (v0.2.0, unchanged)
# ──────────────────────────────────────────────────────────────────────────────

class _MeteringSensor(_PoolPumpBaseSensor):
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
        return {"source_entity": getattr(self.coordinator, self._source_entity_prop)}


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


# ──────────────────────────────────────────────────────────────────────────────
# Water quality placeholders (new v0.3.0 – unavailable until source configured)
# ──────────────────────────────────────────────────────────────────────────────

class _WaterQualityPlaceholder(_PoolPumpBaseSensor):
    """Sensor that is unavailable until a source entity is configured in a future version."""

    @property
    def available(self) -> bool:
        return False  # placeholder — always unavailable in v0.3.0

    @property
    def native_value(self) -> None:
        return None


class PoolPumpPhSensor(_WaterQualityPlaceholder):
    _attr_translation_key = "ph"
    _attr_icon = "mdi:ph"
    _attr_native_unit_of_measurement = "pH"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "ph")


class PoolPumpRedoxSensor(_WaterQualityPlaceholder):
    _attr_translation_key = "redox"
    _attr_icon = "mdi:lightning-bolt-circle"
    _attr_native_unit_of_measurement = "mV"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "redox")


class PoolPumpPoolTemperatureSensor(_WaterQualityPlaceholder):
    _attr_translation_key = "pool_temperature"
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = "°C"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:thermometer-water"

    def __init__(self, coordinator: PoolPumpCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator, entry, "pool_temperature")
