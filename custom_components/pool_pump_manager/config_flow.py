"""Config flow for Pool Pump Manager."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    DOMAIN,
    CONF_PUMP_SWITCH,
    CONF_POWER_SENSOR,
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


def _device_schema(defaults: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(
                CONF_PUMP_SWITCH,
                default=defaults.get(CONF_PUMP_SWITCH, ""),
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["switch", "input_boolean"])
            ),
            vol.Optional(
                CONF_POWER_SENSOR,
                default=defaults.get(CONF_POWER_SENSOR, ""),
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["sensor"])
            ),
        }
    )


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
                selector.NumberSelectorConfig(
                    min=0.5, max=10, step=0.1, mode="box"
                )
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


class PoolPumpManagerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Pool Pump Manager."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

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
                    self._data.update(user_input)
                    return await self.async_step_pool()

        return self.async_show_form(
            step_id="user",
            data_schema=_device_schema(self._data),
            errors=errors,
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


class PoolPumpManagerOptionsFlow(OptionsFlow):
    """Handle options for Pool Pump Manager."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        self._entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        errors: dict[str, str] = {}
        current = {**self._entry.data, **self._entry.options}

        if user_input is not None:
            start = user_input.get(CONF_START_TIME, DEFAULT_START_TIME)
            end = user_input.get(CONF_END_TIME, DEFAULT_END_TIME)
            if start >= end:
                errors[CONF_END_TIME] = "end_before_start"
            else:
                return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=_pool_schema(current),
            errors=errors,
        )
