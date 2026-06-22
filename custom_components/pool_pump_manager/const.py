"""Constants for Pool Pump Manager."""
DOMAIN = "pool_pump_manager"

PLATFORMS = ["switch", "number", "sensor", "binary_sensor", "select", "button"]

# --- Device / pump ---
CONF_PUMP_SWITCH = "pump_switch"

# --- Metering sensor entities ---
CONF_POWER_SENSOR = "power_sensor"
CONF_ENERGY_SENSOR = "energy_sensor_entity"
CONF_VOLTAGE_SENSOR = "voltage_sensor_entity"
CONF_CURRENT_SENSOR = "current_sensor_entity"
CONF_FREQUENCY_SENSOR = "frequency_sensor_entity"

ALL_METERING_CONFS = [
    CONF_POWER_SENSOR,
    CONF_ENERGY_SENSOR,
    CONF_VOLTAGE_SENSOR,
    CONF_CURRENT_SENSOR,
    CONF_FREQUENCY_SENSOR,
]

# --- Water quality placeholder (v0.3.0 prepared, not yet configurable) ---
CONF_PH_SENSOR = "ph_sensor_entity"
CONF_REDOX_SENSOR = "redox_sensor_entity"
CONF_TEMP_SENSOR = "temperature_sensor_entity"

# --- Pool parameters ---
CONF_POOL_VOLUME = "pool_volume"
CONF_PUMP_FLOW_RATE = "pump_flow_rate"
CONF_WATER_TEMP = "water_temperature"
CONF_CIRCULATIONS_PER_DAY = "circulations_per_day"
CONF_START_TIME = "start_time"
CONF_END_TIME = "end_time"

# --- Defaults ---
DEFAULT_POOL_VOLUME = 64.0
DEFAULT_PUMP_FLOW_RATE = 9.5
DEFAULT_WATER_TEMP = 24.0
DEFAULT_CIRCULATIONS = 1.5
DEFAULT_START_TIME = "08:00:00"
DEFAULT_END_TIME = "20:00:00"

# --- Safety ---
WARNING_POWER_THRESHOLD = 100.0
WARNING_DELAY_SECONDS = 120

# --- Storage ---
STORAGE_VERSION = 1

UPDATE_INTERVAL_SECONDS = 30

# --- Season mode ---
SEASON_MODE_AUTO = "auto"
SEASON_MODE_SPRING = "spring"
SEASON_MODE_SUMMER = "summer"
SEASON_MODE_AUTUMN = "autumn"
SEASON_MODE_WINTER = "winter"

SEASON_MODES = [
    SEASON_MODE_AUTO,
    SEASON_MODE_SPRING,
    SEASON_MODE_SUMMER,
    SEASON_MODE_AUTUMN,
    SEASON_MODE_WINTER,
]

# Recommended circulations per day per season
SEASON_CIRCULATIONS: dict[str, float] = {
    SEASON_MODE_SPRING: 1.0,
    SEASON_MODE_SUMMER: 1.5,
    SEASON_MODE_AUTUMN: 1.0,
    SEASON_MODE_WINTER: 0.5,
}

# Month → season mapping
MONTH_TO_SEASON: dict[int, str] = {
    1: SEASON_MODE_WINTER,
    2: SEASON_MODE_WINTER,
    3: SEASON_MODE_SPRING,
    4: SEASON_MODE_SPRING,
    5: SEASON_MODE_SUMMER,
    6: SEASON_MODE_SUMMER,
    7: SEASON_MODE_SUMMER,
    8: SEASON_MODE_SUMMER,
    9: SEASON_MODE_AUTUMN,
    10: SEASON_MODE_AUTUMN,
    11: SEASON_MODE_WINTER,
    12: SEASON_MODE_WINTER,
}

# --- Auto-discovery criteria for metering sensors ---
METERING_CRITERIA: dict[str, dict] = {
    CONF_POWER_SENSOR: {
        "device_class": "power",
        "units": {"W", "kW"},
        "keywords": {"power", "leistung"},
    },
    CONF_ENERGY_SENSOR: {
        "device_class": "energy",
        "units": {"kWh", "Wh"},
        "keywords": {"energy", "energie", "zähler", "counter"},
    },
    CONF_VOLTAGE_SENSOR: {
        "device_class": "voltage",
        "units": {"V"},
        "keywords": {"voltage", "spannung"},
    },
    CONF_CURRENT_SENSOR: {
        "device_class": "current",
        "units": {"A"},
        "keywords": {"current", "strom"},
    },
    CONF_FREQUENCY_SENSOR: {
        "device_class": "frequency",
        "units": {"Hz"},
        "keywords": {"frequency", "frequenz"},
    },
}
