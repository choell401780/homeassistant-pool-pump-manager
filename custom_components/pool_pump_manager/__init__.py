"""Pool Pump Manager integration."""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall

from .const import DOMAIN
from .coordinator import PoolPumpCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.SWITCH,
    Platform.NUMBER,
    Platform.SENSOR,
    Platform.BINARY_SENSOR,
    Platform.SELECT,
    Platform.BUTTON,
]

_FRONTEND_REGISTERED = False


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register frontend resource once per HA start."""
    global _FRONTEND_REGISTERED
    if not _FRONTEND_REGISTERED:
        www_path = Path(__file__).parent / "www"
        if www_path.is_dir():
            try:
                from homeassistant.components.http import StaticPathConfig

                await hass.http.async_register_static_paths(
                    [StaticPathConfig("/pool_pump_manager_frontend", str(www_path), False)]
                )
                from homeassistant.components.frontend import add_extra_js_url

                add_extra_js_url(
                    hass, "/pool_pump_manager_frontend/pool-control-center.js"
                )
                _LOGGER.info("Pool Pump Manager: registered frontend card")
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Could not register Pool Control Center card: %s", err)
        _FRONTEND_REGISTERED = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Pool Pump Manager from a config entry."""
    coordinator = PoolPumpCoordinator(hass, entry)
    await coordinator.async_setup()
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    _register_services(hass)

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)

    if not hass.data.get(DOMAIN):
        for svc in ("start_now", "stop_now", "reset_runtime_today", "force_recalculate"):
            hass.services.async_remove(DOMAIN, svc)

    return unload_ok


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


def _register_services(hass: HomeAssistant) -> None:
    """Register integration services (idempotent)."""
    if hass.services.has_service(DOMAIN, "start_now"):
        return

    async def _start_now(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            await coord.async_start_now()

    async def _stop_now(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            await coord.async_stop_now()

    async def _reset_runtime(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            await coord.async_reset_runtime()

    async def _force_recalculate(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            await coord.async_force_recalculate()

    hass.services.async_register(DOMAIN, "start_now", _start_now)
    hass.services.async_register(DOMAIN, "stop_now", _stop_now)
    hass.services.async_register(DOMAIN, "reset_runtime_today", _reset_runtime)
    hass.services.async_register(DOMAIN, "force_recalculate", _force_recalculate)
