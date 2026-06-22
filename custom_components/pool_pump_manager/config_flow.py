"""Config flow for Pool Pump Manager."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er, selector

from .const import (
    DOMAIN,
    CONF_PUMP_SWITCH,
    CONF_POWER_SENSOR,
    CONF_ENERGY_SENSOR,
    CONF_VOLTAGE_SENSOR,
    CONF_CURRENT_SENSOR,
    CONF_FREQUENCY_SENSOR,
    ALL_METERING_CONFS,
    METERING_CRITERIA,
    CONF_POOL_VOLUME,
    CONF_PUMP_FLOW_RATE,
    CONF_WATER_TEMP,
    CONF_CIRCULATIONS_PER_DAY,
    CONF_START_TIME,
    CONF_END_TIME,
    DEFAULT_POOL_VOLUME,
    DEFAULT_PUMP_FLOW_RATE,
    DEFAULT_WATER_TEMP,
    DEFAULT_CIRCULATIONS,
    DEFAULT_START_TIME,
    DEFAULT_END_TIME,
)

_LOGGER = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Auto-discovery
# ──────────────────────────────────────────────────────────────────────────────

async def async_discover_metering_sensors(
    hass: HomeAssistant, pump_switch_entity_id: str
) -> dict[str, str | None]:
    """Find metering sensor entities that likely belong to the same device as the pump switch."""
    entity_reg = er.async_get(hass)
    result: dict[str, str | None] = {k: None for k in ALL_METERING_CONFS}

    # 1. Try device-based discovery first
    switch_entry = entity_reg.async_get(pump_switch_entity_id)
    device_id = switch_entry.device_id if switch_entry else None

    candidates: list[er.RegistryEntry] = []
    if device_id:
        candidates = [
            e
            for e in er.async_entries_for_device(entity_reg, device_id)
            if e.domain == "sensor"
        ]
        _LOGGER.debug(
            "Device-based discovery for %s (device %s): %d sensor candidates",
            pump_switch_entity_id,
            device_id,
            len(candidates),
        )

    # 2. Fallback: name-based similarity
    if not candidates:
        base = pump_switch_entity_id.split(".")[-1]
        for suffix in ("_switch", "_schalter", "_relay", "_relais", "_channel", "_kanal"):
            if base.endswith(suffix):
                base = base[: -len(suffix)]
                break
        base_prefix = base[:8].lower()
        candidates = [
            e
            for e in entity_reg.entities.values()
            if e.domain == "sensor"
            and base_prefix in e.entity_id.lower()
        ]
        _LOGGER.debug(
            "Name-based fallback for %s (prefix '%s'): %d candidates",
            pump_switch_entity_id,
            base_prefix,
            len(candidates),
        )

    # 3. Score each candidate for each metering type
    for conf_key, criteria in METERING_CRITERIA.items():
        best_score = 0
        best_entity: str | None = None

        for entry in candidates:
            score = 0

            # device_class from registry
            entity_dc = entry.device_class or entry.original_device_class
            if entity_dc and str(entity_dc) == criteria["device_class"]:
                score += 10
            else:
                state = hass.states.get(entry.entity_id)
                if state:
                    if state.attributes.get("device_class") == criteria["device_class"]:
                        score += 10
                    if state.attributes.get("unit_of_measurement") in criteria["units"]:
                        score += 5

            # unit from registry
            uom = entry.unit_of_measurement or entry.original_unit_of_measurement
            if uom and uom in criteria["units"]:
                score += 5

            # keyword in entity_id or name
            name_lower = entry.entity_id.lower()
            orig_lower = (entry.original_name or "").lower()
            for kw in criteria["keywords"]:
                if kw in name_lower or kw in orig_lower:
                    score += 3
                    break

            if score > best_score:
                best_score = score
                best_entity = entry.entity_id

        # Only accept if at least device_class or unit matched
        if best_entity and best_score >= 5:
            result[conf_key] = best_entity
            _LOGGER.debug("Auto-discovered %s -> %s (score %d)", conf_key, best_entity, best_score)

    return result


# ──────────────────────────────────────────────────────────────────────────────
# Schema builders
# ──────────────────────────────────────────────────────────────────────────────

_SENSOR_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["sensor"])
)


def _device_schema(defaults: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(
                CONF_PUMP_SWITCH,
                default=defaults.get(CONF_PUMP_SWITCH, ""),
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["switch", "input_boolean"])
            ),
        }
    )


def _sensors_schema(defaults: dict[str, Any]) -> vol.Schema:
    """Schema for sensor assignment step, with auto-discovered defaults."""
    fields: dict[Any, Any] = {}
    for key in ALL_METERING_CONFS:
        current = defaults.get(key)
        opt = vol.Optional(key, default=current) if current else vol.Optional(key)
        fields[opt] = _SENSOR_SELECTOR
    return vol.Schema(fields)


def _pool_schema(defaults: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(
                CONF_POOL_VOLUME,
                default=defaults.get(CONF_POOL_VOLUME, DEFAULT_POOL_VOLUME),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=1, max=2000, step=0.5, unit_of_measurement="m³", mode="box"
                )
            ),
            vol.Required(
                CONF_PUMP_FLOW_RATE,
                default=defaults.get(CONF_PUMP_FLOW_RATE, DEFAULT_PUMP_FLOW_RATE),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0.1, max=200, step=0.1, unit_of_measurement="m³/h", mode="box"
                )
            ),
            vol.Required(
                CONF_WATER_TEMP,
                default=defaults.get(CONF_WATER_TEMP, DEFAULT_WATER_TEMP),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=50, step=0.5, unit_of_measurement="°C", mode="box"
                )
            ),
            vol.Required(
                CONF_CIRCULATIONS_PER_DAY,
                default=defaults.get(CONF_CIRCULATIONS_PER_DAY, DEFAULT_CIRCULATIONS),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(min=0.5, max=10, step=0.1, mode="box")
            ),
            vol.Required(
                CONF_START_TIME,
                default=defaults.get(CONF_START_TIME, DEFAULT_START_TIME),
            ): selector.TimeSelector(),
            vol.Required(
                CONF_END_TIME,
                default=defaults.get(CONF_END_TIME, DEFAULT_END_TIME),
            ): selector.TimeSelector(),
        }
    )


def _normalize_sensors(user_input: dict[str, Any]) -> dict[str, Any]:
    """Convert empty strings to None for sensor entity fields."""
    out = {}
    for key in ALL_METERING_CONFS:
        val = user_input.get(key)
        out[key] = val if val else None
    return out


# ──────────────────────────────────────────────────────────────────────────────
# Config Flow
# ──────────────────────────────────────────────────────────────────────────────

class PoolPumpManagerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Pool Pump Manager."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self._discovered: dict[str, str | None] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        errors: dict[str, str] = {}

        if user_input is not None:
            pump_switch = user_input.get(CONF_PUMP_SWITCH, "")
            if not pump_switch:
                errors[CONF_PUMP_SWITCH] = "required"
            else:
                state = self.hass.states.get(pump_switch)
                if state is None:
                    errors[CONF_PUMP_SWITCH] = "entity_not_found"
                else:
                    self._data[CONF_PUMP_SWITCH] = pump_switch
                    # Run auto-discovery before showing sensors step
                    self._discovered = await async_discover_metering_sensors(
                        self.hass, pump_switch
                    )
                    return await self.async_step_sensors()

        return self.async_show_form(
            step_id="user",
            data_schema=_device_schema(self._data),
            errors=errors,
        )

    async def async_step_sensors(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        if user_input is not None:
            self._data.update(_normalize_sensors(user_input))
            return await self.async_step_pool()

        # Merge discovered values as defaults
        defaults = {**self._discovered, **{k: v for k, v in self._data.items() if k in ALL_METERING_CONFS}}

        return self.async_show_form(
            step_id="sensors",
            data_schema=_sensors_schema(defaults),
            description_placeholders={
                "pump_switch": self._data.get(CONF_PUMP_SWITCH, ""),
            },
        )

    async def async_step_pool(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        errors: dict[str, str] = {}

        if user_input is not None:
            start = user_input.get(CONF_START_TIME, DEFAULT_START_TIME)
            end = user_input.get(CONF_END_TIME, DEFAULT_END_TIME)
            if start >= end:
                errors[CONF_END_TIME] = "end_before_start"
            else:
                self._data.update(user_input)
                pump_switch = self._data[CONF_PUMP_SWITCH]
                await self.async_set_unique_id(pump_switch)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=f"Pool Pump ({pump_switch})",
                    data=self._data,
                )

        return self.async_show_form(
            step_id="pool",
            data_schema=_pool_schema(self._data),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return PoolPumpManagerOptionsFlow(config_entry)


# ──────────────────────────────────────────────────────────────────────────────
# Options Flow
# ──────────────────────────────────────────────────────────────────────────────

class PoolPumpManagerOptionsFlow(OptionsFlow):
    """Handle options for Pool Pump Manager (pool params + sensor assignments)."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        self._entry = config_entry
        self._pool_data: dict[str, Any] = {}

    def _current(self) -> dict[str, Any]:
        """Merged current config (options override data)."""
        return {**self._entry.data, **self._entry.options}

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        errors: dict[str, str] = {}
        current = self._current()

        if user_input is not None:
            start = user_input.get(CONF_START_TIME, DEFAULT_START_TIME)
            end = user_input.get(CONF_END_TIME, DEFAULT_END_TIME)
            if start >= end:
                errors[CONF_END_TIME] = "end_before_start"
            else:
                self._pool_data = user_input
                return await self.async_step_sensors()

        return self.async_show_form(
            step_id="init",
            data_schema=_pool_schema(current),
            errors=errors,
        )

    async def async_step_sensors(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        current = self._current()

        if user_input is not None:
            combined = {**self._pool_data, **_normalize_sensors(user_input)}
            return self.async_create_entry(title="", data=combined)

        return self.async_show_form(
            step_id="sensors",
            data_schema=_sensors_schema(current),
        )
