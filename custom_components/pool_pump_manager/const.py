"""Constants for Pool Pump Manager."""
DOMAIN = "pool_pump_manager"

PLATFORMS = ["switch", "number", "sensor", "binary_sensor"]

CONF_PUMP_SWITCH = "pump_switch"
CONF_POWER_SENSOR = "power_sensor"
CONF_POOL_VOLUME = "pool_volume"
CONF_PUMP_FLOW_RATE = "pump_flow_rate"
CONF_WATER_TEMP = "water_temperature"
CONF_CIRCULATIONS_PER_DAY = "circulations_per_day"
CONF_START_TIME = "start_time"
CONF_END_TIME = "end_time"

DEFAULT_POOL_VOLUME = 64.0
DEFAULT_PUMP_FLOW_RATE = 9.5
DEFAULT_WATER_TEMP = 24.0
DEFAULT_CIRCULATIONS = 1.5
DEFAULT_START_TIME = "08:00:00"
DEFAULT_END_TIME = "20:00:00"

WARNING_POWER_THRESHOLD = 100.0
WARNING_DELAY_SECONDS = 120

STORAGE_VERSION = 1

UPDATE_INTERVAL_SECONDS = 30
