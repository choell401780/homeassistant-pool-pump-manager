"""Pool Pump Manager integration."""
from __future__ import annotations

import logging
import shutil
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

# URL served by HA's built-in /local/ handler (maps to /config/www/)
_COMMUNITY_CARD_URL = "/local/community/pool_pump_manager/pool-control-center.js"
# Fallback: custom static path registered by this integration
_STATIC_CARD_URL = "/pool_pump_manager_static/pool-control-center.js"

# Module-level flag so we only register static path once per process lifetime
_STATIC_PATH_REGISTERED = False


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Integration-level setup (called before config entries)."""
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

    # Deploy and register the Lovelace card once per HA session.
    # Uses hass.data so the flag survives integration reloads but resets on HA restart,
    # ensuring the latest JS is always deployed after a HACS update + restart.
    if not hass.data[DOMAIN].get("_frontend_registered"):
        await _async_register_frontend(hass)
        hass.data[DOMAIN]["_frontend_registered"] = True

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


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Deploy Pool Control Center card and register it as an auto-loaded module.

    Strategy 1 (primary): copy JS to /config/www/community/pool_pump_manager/
    so it is served at /local/community/pool_pump_manager/pool-control-center.js
    — the standard HACS community path that HA's built-in handler always serves.

    Strategy 2 (fallback): register a custom static path and serve from there.
    """
    global _STATIC_PATH_REGISTERED  # noqa: PLW0603

    js_src = Path(__file__).parent / "www" / "pool-control-center.js"
    if not js_src.is_file():
        _LOGGER.error(
            "Pool Control Center JS not found at %s — card will not auto-load", js_src
        )
        return

    card_url: str | None = None

    # ── Strategy 1: copy to /config/www/community/ ───────────────────────────
    dst_dir = Path(hass.config.config_dir) / "www" / "community" / "pool_pump_manager"
    dst_file = dst_dir / "pool-control-center.js"

    def _copy_sync() -> None:
        dst_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(js_src), str(dst_file))

    try:
        await hass.async_add_executor_job(_copy_sync)
        _LOGGER.debug("Pool Control Center: deployed to %s", dst_file)
        card_url = _COMMUNITY_CARD_URL
    except OSError as err:
        _LOGGER.warning(
            "Pool Control Center: cannot copy JS to %s (%s) — using static path fallback",
            dst_file,
            err,
        )

    # ── Strategy 2: custom static path (fallback) ────────────────────────────
    if card_url is None:
        if not _STATIC_PATH_REGISTERED:
            try:
                from homeassistant.components.http import StaticPathConfig

                await hass.http.async_register_static_paths(
                    [
                        StaticPathConfig(
                            "/pool_pump_manager_static",
                            str(js_src.parent),
                            False,  # cache_headers=False
                        )
                    ]
                )
                _STATIC_PATH_REGISTERED = True
                _LOGGER.debug("Pool Control Center: static path registered")
            except Exception as err:  # noqa: BLE001
                _LOGGER.error(
                    "Pool Control Center: static path registration failed: %s — "
                    "add the card manually as a Lovelace resource",
                    err,
                )
                return
        card_url = _STATIC_CARD_URL

    # ── Register as auto-loaded ES module ────────────────────────────────────
    try:
        from homeassistant.components.frontend import add_extra_js_url

        add_extra_js_url(hass, card_url)
        _LOGGER.info(
            "Pool Control Center card registered at %s — "
            "add 'type: custom:pool-control-center-card' to your dashboard",
            card_url,
        )
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Pool Control Center: add_extra_js_url failed: %s", err)


def _register_services(hass: HomeAssistant) -> None:
    """Register integration services (idempotent)."""
    if hass.services.has_service(DOMAIN, "start_now"):
        return

    async def _start_now(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            if isinstance(coord, PoolPumpCoordinator):
                await coord.async_start_now()

    async def _stop_now(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            if isinstance(coord, PoolPumpCoordinator):
                await coord.async_stop_now()

    async def _reset_runtime(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            if isinstance(coord, PoolPumpCoordinator):
                await coord.async_reset_runtime()

    async def _force_recalculate(call: ServiceCall) -> None:
        for coord in hass.data.get(DOMAIN, {}).values():
            if isinstance(coord, PoolPumpCoordinator):
                await coord.async_force_recalculate()

    hass.services.async_register(DOMAIN, "start_now", _start_now)
    hass.services.async_register(DOMAIN, "stop_now", _stop_now)
    hass.services.async_register(DOMAIN, "reset_runtime_today", _reset_runtime)
    hass.services.async_register(DOMAIN, "force_recalculate", _force_recalculate)
