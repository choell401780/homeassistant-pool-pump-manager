"""Constants for Pool Pump Manager."""
DOMAIN = "pool_pump_manager"

PLATFORMS = ["switch", "number", "sensor", "binary_sensor"]

# --- Device / pump ---
CONF_PUMP_SWITCH = "pump_switch"

# --- Metering sensor entities (v0.1.0 kept for backward compat) ---
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
