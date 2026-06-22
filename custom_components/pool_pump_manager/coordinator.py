"""DataUpdateCoordinator for Pool Pump Manager."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, date
from typing import Any

from homeassistant.components.persistent_notification import async_create as pn_create
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    CONF_PUMP_SWITCH,
    CONF_POWER_SENSOR,
    CONF_ENERGY_SENSOR,
    CONF_VOLTAGE_SENSOR,
    CONF_CURRENT_SENSOR,
    CONF_FREQUENCY_SENSOR,
    CONF_POOL_VOLUME,
    CONF_PUMP_FLOW_RATE,
    CONF_CIRCULATIONS_PER_DAY,
    CONF_START_TIME,
    CONF_END_TIME,
    DEFAULT_POOL_VOLUME,
    DEFAULT_PUMP_FLOW_RATE,
    DEFAULT_CIRCULATIONS,
    DEFAULT_START_TIME,
    DEFAULT_END_TIME,
    WARNING_POWER_THRESHOLD,
    WARNING_DELAY_SECONDS,
    STORAGE_VERSION,
    UPDATE_INTERVAL_SECONDS,
)

_LOGGER = logging.getLogger(__name__)


def _parse_time_str(time_str: str) -> tuple[int, int]:
    """Parse HH:MM or HH:MM:SS into (hour, minute)."""
    parts = time_str.split(":")
    return int(parts[0]), int(parts[1])


class PoolPumpCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Manages pool pump automation and state tracking."""

    def __init__(self, hass: HomeAssistant, entry: Any) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
        )
        self._entry = entry
        self._store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}")

        self._runtime_today: float = 0.0
        self._tracking_date: date | None = None
        self._pump_active_since: datetime | None = None

        self._low_power_since: datetime | None = None
        self._warning_active: bool = False

        self._automation_enabled: bool = True
        self._manual_override: bool = False

        self._schedule: list[tuple[datetime, datetime]] = []
        self._schedule_date: date | None = None

        self._manual_runtime_hours: float | None = None

    # ------------------------------------------------------------------ #
    # Config helpers                                                       #
    # ------------------------------------------------------------------ #

    def _opt(self, key: str, default: Any = None) -> Any:
        """Return value from options first, falling back to data, then default."""
        return self._entry.options.get(key, self._entry.data.get(key, default))

    def _opt_entity(self, key: str) -> str | None:
        """Return optional entity_id or None for empty / unset."""
        val = self._opt(key)
        return val if val else None

    # ------------------------------------------------------------------ #
    # Config properties                                                    #
    # ------------------------------------------------------------------ #

    @property
    def pump_switch_entity(self) -> str:
        return self._entry.data[CONF_PUMP_SWITCH]

    @property
    def power_sensor_entity(self) -> str | None:
        return self._opt_entity(CONF_POWER_SENSOR)

    @property
    def energy_sensor_entity(self) -> str | None:
        return self._opt_entity(CONF_ENERGY_SENSOR)

    @property
    def voltage_sensor_entity(self) -> str | None:
        return self._opt_entity(CONF_VOLTAGE_SENSOR)

    @property
    def current_sensor_entity(self) -> str | None:
        return self._opt_entity(CONF_CURRENT_SENSOR)

    @property
    def frequency_sensor_entity(self) -> str | None:
        return self._opt_entity(CONF_FREQUENCY_SENSOR)

    @property
    def pool_volume(self) -> float:
        return float(self._opt(CONF_POOL_VOLUME, DEFAULT_POOL_VOLUME))

    @property
    def pump_flow_rate(self) -> float:
        return float(self._opt(CONF_PUMP_FLOW_RATE, DEFAULT_PUMP_FLOW_RATE))

    @property
    def circulations_per_day(self) -> float:
        return float(self._opt(CONF_CIRCULATIONS_PER_DAY, DEFAULT_CIRCULATIONS))

    @property
    def start_time_str(self) -> str:
        return self._opt(CONF_START_TIME, DEFAULT_START_TIME)

    @property
    def end_time_str(self) -> str:
        return self._opt(CONF_END_TIME, DEFAULT_END_TIME)

    @property
    def target_runtime_hours(self) -> float:
        if self._manual_runtime_hours is not None:
            return self._manual_runtime_hours
        return round(self.pool_volume * self.circulations_per_day / self.pump_flow_rate, 2)

    @property
    def runtime_today(self) -> float:
        return round(self._runtime_today, 3)

    @property
    def remaining_runtime(self) -> float:
        return max(0.0, round(self.target_runtime_hours - self._runtime_today, 3))

    @property
    def automation_enabled(self) -> bool:
        return self._automation_enabled

    @property
    def warning_active(self) -> bool:
        return self._warning_active

    @property
    def schedule(self) -> list[tuple[datetime, datetime]]:
        return self._schedule

    # ------------------------------------------------------------------ #
    # Persistence                                                          #
    # ------------------------------------------------------------------ #

    async def async_setup(self) -> None:
        """Load persisted state on startup."""
        stored = await self._store.async_load()
        if not stored:
            return
        stored_date_str = stored.get("date")
        if stored_date_str:
            try:
                stored_date = date.fromisoformat(stored_date_str)
                if stored_date == dt_util.now().date():
                    self._runtime_today = float(stored.get("runtime_today", 0.0))
                    self._tracking_date = stored_date
            except (ValueError, TypeError):
                pass
        self._automation_enabled = bool(stored.get("automation_enabled", True))
        manual = stored.get("manual_runtime_hours")
        self._manual_runtime_hours = float(manual) if manual is not None else None

    async def _async_persist(self) -> None:
        await self._store.async_save(
            {
                "date": self._tracking_date.isoformat() if self._tracking_date else None,
                "runtime_today": self._runtime_today,
                "automation_enabled": self._automation_enabled,
                "manual_runtime_hours": self._manual_runtime_hours,
            }
        )

    # ------------------------------------------------------------------ #
    # State helpers                                                        #
    # ------------------------------------------------------------------ #

    def _is_pump_on(self) -> bool:
        state = self.hass.states.get(self.pump_switch_entity)
        return state is not None and state.state == "on"

    def _get_metering_value(self, entity_id: str | None) -> float | None:
        """Read a numeric state from an optional entity."""
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unavailable", "unknown", "None", "none"):
            return None
        try:
            return float(state.state)
        except (ValueError, TypeError):
            return None

    def _window_times(self, now: datetime) -> tuple[datetime, datetime]:
        """Return today's operating window as aware datetimes."""
        tz = now.tzinfo
        today = now.date()
        sh, sm = _parse_time_str(self.start_time_str)
        eh, em = _parse_time_str(self.end_time_str)
        start = datetime(today.year, today.month, today.day, sh, sm, tzinfo=tz)
        end = datetime(today.year, today.month, today.day, eh, em, tzinfo=tz)
        return start, end

    # ------------------------------------------------------------------ #
    # Scheduling                                                           #
    # ------------------------------------------------------------------ #

    def _calculate_schedule(self, now: datetime) -> list[tuple[datetime, datetime]]:
        window_start, window_end = self._window_times(now)
        target = self.target_runtime_hours
        if target <= 0:
            return []
        window_hours = (window_end - window_start).total_seconds() / 3600
        if window_hours <= 0:
            return []
        if target >= window_hours:
            return [(window_start, window_end)]

        n = max(1, round(window_hours / 4.0))
        hours_per_segment = target / n
        if hours_per_segment < 0.5:
            n = max(1, int(target / 0.5))
            hours_per_segment = target / n

        gap_total = window_hours - target
        gap = gap_total / (n - 1) if n > 1 else 0.0

        slots: list[tuple[datetime, datetime]] = []
        current = window_start
        for i in range(n):
            seg_end = current + timedelta(hours=hours_per_segment)
            if seg_end > window_end:
                seg_end = window_end
            slots.append((current, seg_end))
            current = seg_end + timedelta(hours=gap)

        return slots

    def _slot_active(self, now: datetime) -> bool:
        for s, e in self._schedule:
            if s <= now < e:
                return True
        return False

    def _next_start(self, now: datetime) -> datetime | None:
        for s, e in self._schedule:
            if s > now:
                return s
            if s <= now < e:
                return None
        return None

    # ------------------------------------------------------------------ #
    # Core update                                                          #
    # ------------------------------------------------------------------ #

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            return await self._update()
        except Exception as exc:  # noqa: BLE001
            raise UpdateFailed(f"Update failed: {exc}") from exc

    async def _update(self) -> dict[str, Any]:
        now = dt_util.now()
        today = now.date()

        # Day rollover
        if self._tracking_date != today:
            self._runtime_today = 0.0
            self._tracking_date = today
            self._pump_active_since = None
            self._schedule_date = None
            self._warning_active = False
            self._low_power_since = None

        if self._schedule_date != today:
            self._schedule = self._calculate_schedule(now)
            self._schedule_date = today
            _LOGGER.debug("Recalculated schedule for %s: %s", today, self._schedule)

        pump_on = self._is_pump_on()
        power = self._get_metering_value(self.power_sensor_entity)

        # Runtime tracking
        if pump_on:
            if self._pump_active_since is None:
                self._pump_active_since = now
            else:
                elapsed_h = (now - self._pump_active_since).total_seconds() / 3600
                self._runtime_today += elapsed_h
                self._pump_active_since = now
        else:
            self._pump_active_since = None

        # Warning: pump on but low power
        if pump_on and power is not None and power < WARNING_POWER_THRESHOLD:
            if self._low_power_since is None:
                self._low_power_since = now
            elif (now - self._low_power_since).total_seconds() >= WARNING_DELAY_SECONDS:
                if not self._warning_active:
                    self._warning_active = True
                    pn_create(
                        self.hass,
                        "Poolpumpe scheint nicht zu laufen, obwohl sie eingeschaltet ist.",
                        title="Pool Pump Manager Warnung",
                        notification_id=f"{DOMAIN}_pump_warning",
                    )
                    _LOGGER.warning(
                        "Pool pump warning: switch ON but power < %s W", WARNING_POWER_THRESHOLD
                    )
        else:
            self._low_power_since = None
            if not pump_on:
                self._warning_active = False

        # Automation control
        window_start, window_end = self._window_times(now)

        if self._automation_enabled:
            after_end = now >= window_end
            target_reached = self.remaining_runtime <= 0

            if after_end or target_reached:
                if pump_on and not self._manual_override:
                    await self._set_pump(False)
                    pump_on = False
            else:
                in_window = window_start <= now < window_end
                should_run = in_window and self._slot_active(now) and not target_reached

                if should_run and not pump_on:
                    await self._set_pump(True)
                    pump_on = True
                elif not should_run and pump_on and not self._manual_override:
                    await self._set_pump(False)
                    pump_on = False

        # Status
        if not self._automation_enabled:
            status = "manual"
        elif now < window_start:
            status = "waiting"
        elif now >= window_end or self.remaining_runtime <= 0:
            status = "completed"
        elif pump_on:
            status = "running"
        else:
            status = "scheduled"

        target = self.target_runtime_hours
        efficiency = round(min(100.0, (self._runtime_today / target * 100)), 1) if target > 0 else 0.0

        await self._async_persist()

        return {
            # Core
            "runtime_today": self.runtime_today,
            "target_runtime": target,
            "remaining_runtime": self.remaining_runtime,
            "pump_is_on": pump_on,
            "warning": self._warning_active,
            "automation_enabled": self._automation_enabled,
            "efficiency": efficiency,
            "next_start": self._next_start(now),
            "status": status,
            # Metering values
            "metering_power": power,
            "metering_energy": self._get_metering_value(self.energy_sensor_entity),
            "metering_voltage": self._get_metering_value(self.voltage_sensor_entity),
            "metering_current": self._get_metering_value(self.current_sensor_entity),
            "metering_frequency": self._get_metering_value(self.frequency_sensor_entity),
            # Metering source info (for diagnostics)
            "metering_sources": {
                "power": self.power_sensor_entity,
                "energy": self.energy_sensor_entity,
                "voltage": self.voltage_sensor_entity,
                "current": self.current_sensor_entity,
                "frequency": self.frequency_sensor_entity,
            },
        }

    # ------------------------------------------------------------------ #
    # Pump control                                                         #
    # ------------------------------------------------------------------ #

    async def _set_pump(self, on: bool) -> None:
        entity_id = self.pump_switch_entity
        domain = entity_id.split(".")[0]
        service = "turn_on" if on else "turn_off"
        await self.hass.services.async_call(
            domain, service, {"entity_id": entity_id}, blocking=False
        )
        _LOGGER.info("Pool pump automation: %s", "ON" if on else "OFF")

    # ------------------------------------------------------------------ #
    # Public actions                                                       #
    # ------------------------------------------------------------------ #

    async def async_set_automation(self, enabled: bool) -> None:
        self._automation_enabled = enabled
        self._manual_override = False
        if not enabled and self._is_pump_on():
            await self._set_pump(False)
        await self._async_persist()
        await self.async_refresh()

    async def async_start_now(self) -> None:
        self._manual_override = True
        await self._set_pump(True)
        await self.async_refresh()

    async def async_stop_now(self) -> None:
        self._manual_override = False
        await self._set_pump(False)
        await self.async_refresh()

    async def async_reset_runtime(self) -> None:
        self._runtime_today = 0.0
        self._pump_active_since = None
        self._tracking_date = dt_util.now().date()
        await self._async_persist()
        await self.async_refresh()

    async def async_force_recalculate(self) -> None:
        self._schedule_date = None
        await self.async_refresh()

    def set_manual_runtime(self, hours: float | None) -> None:
        self._manual_runtime_hours = hours if (hours is not None and hours > 0) else None
        self._schedule_date = None
