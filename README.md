# Pool Pump Manager

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/choell401780/homeassistant-pool-pump-manager.svg)](https://github.com/choell401780/homeassistant-pool-pump-manager/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Eine professionelle Home-Assistant-Custom-Integration zur intelligenten Steuerung einer Poolpumpe auf Basis von Poolvolumen, Pumpenleistung und gewünschter Wasserumwälzung.

Unterstützt u.a. den **Homematic HM-ES-PMSw1-Pl-DN-R1** mit automatischer Sensor-Erkennung.

---

## Features

- **Automatische Laufzeitberechnung** auf Basis von Poolvolumen, Förderleistung und Umwälzungen pro Tag
- **Gleichmäßige Zeitplanung** – die Laufzeit wird automatisch auf mehrere Blöcke im Tagesfenster verteilt
- **Persistente Laufzeitverfolgung** – überlebt Home-Assistant-Neustarts
- **Automatische Sensor-Erkennung** – Leistung, Energie, Spannung, Strom und Frequenz werden automatisch ermittelt
- **Sicherheitswarnung** – erkennt wenn die Pumpe läuft aber keine Leistung aufnimmt
- **Vollständige UI-Konfiguration** über den Config Flow (kein YAML erforderlich)
- **HACS-kompatibel**
- **Mehrsprachig** (Deutsch & Englisch)

---

## Installation

### Option 1: HACS (empfohlen)

1. Öffne HACS in Home Assistant
2. Klicke auf **Integrationen** → Menü (drei Punkte) → **Benutzerdefinierte Repositories**
3. Füge folgende URL als Kategorie **Integration** hinzu:
   ```
   https://github.com/choell401780/homeassistant-pool-pump-manager
   ```
4. Suche nach **Pool Pump Manager** und installiere die Integration
5. Starte Home Assistant neu

### Option 2: Manuell via GitHub

1. Lade die neueste Version von der [Releases-Seite](https://github.com/choell401780/homeassistant-pool-pump-manager/releases) herunter
2. Kopiere den Ordner `custom_components/pool_pump_manager/` in dein HA-Verzeichnis unter `config/custom_components/`
3. Starte Home Assistant neu

---

## Konfiguration

1. Öffne **Einstellungen → Integrationen → Integration hinzufügen**
2. Suche nach **Pool Pump Manager**
3. Folge dem dreigeteilten Einrichtungsassistenten:

### Schritt 1: Pumpenschalter

| Feld | Beschreibung |
|------|-------------|
| Pumpenschalter | Entity-ID des Pumpenschalters (z. B. `switch.poolpumpe`) |

### Schritt 2: Messsensoren (automatisch erkannt)

Die Integration sucht automatisch nach Messsensoren, die zum gleichen Gerät wie der Pumpenschalter gehören. Die Erkennung läuft über die **Device-ID** in der Entity Registry und über Schlüsselwörter.

| Feld | Einheit | Erkennungskriterien |
|------|---------|---------------------|
| Leistungssensor | W / kW | device_class: power, Begriffe: power, leistung |
| Energiezähler | Wh / kWh | device_class: energy, Begriffe: energy, energie, zähler |
| Spannungssensor | V | device_class: voltage, Begriffe: voltage, spannung |
| Stromsensor | A | device_class: current, Begriffe: current, strom |
| Frequenzsensor | Hz | device_class: frequency, Begriffe: frequency, frequenz |

Alle Felder sind optional und können manuell überschrieben oder leer gelassen werden.

### Schritt 3: Pool-Parameter

| Feld | Standard | Beschreibung |
|------|----------|-------------|
| Poolvolumen | 64 m³ | Gesamtvolumen des Pools |
| Förderleistung | 9,5 m³/h | Förderleistung der Pumpe |
| Wassertemperatur | 24 °C | Aktuelle Wassertemperatur |
| Umwälzungen/Tag | 1,5 | Gewünschte Umwälzungen pro Tag |
| Startzeit | 08:00 | Früheste Betriebszeit |
| Endzeit | 20:00 | Späteste Betriebszeit |

---

## Sensor-Zuordnung nachträglich ändern

Über **Einstellungen → Integrationen → Pool Pump Manager → Konfigurieren** können alle Parameter und Sensor-Zuordnungen jederzeit angepasst werden (Options Flow, 2 Schritte).

---

## Unterstütztes Gerät: HM-ES-PMSw1-Pl-DN-R1

Der Homematic Funk-Schalt-Mess-Aktor HM-ES-PMSw1-Pl-DN-R1 stellt folgende Entities bereit, die automatisch erkannt werden:

| Messgröße | Typische Entity | Einheit |
|-----------|----------------|---------|
| Schalter | `switch.hm_*` | – |
| Leistung | `sensor.hm_*_power` | W |
| Energiezähler | `sensor.hm_*_energy_counter` | Wh |
| Spannung | `sensor.hm_*_voltage` | V |
| Strom | `sensor.hm_*_current` | A |
| Frequenz | `sensor.hm_*_frequency` | Hz |

---

## Berechnungsbeispiel

```
Poolvolumen:      64 m³
Umwälzungen:      1,5 / Tag
Förderleistung:   9,5 m³/h

Ziel-Laufzeit = 64 × 1,5 ÷ 9,5 ≈ 10,1 Stunden
```

Die Integration verteilt diese 10,1 Stunden gleichmäßig über das Betriebsfenster (08:00–20:00):

```
08:00 – 11:22  (3,37 h)
12:19 – 15:41  (3,37 h)
16:38 – 20:00  (3,37 h)
```

---

## Entitäten

### Switch

| Entity | Beschreibung |
|--------|-------------|
| `switch.pool_pump_manager_automation_enabled` | Automatik ein/aus |

### Number

| Entity | Beschreibung |
|--------|-------------|
| `number.pool_pump_manager_daily_runtime_hours` | Ziel-Laufzeit (manuell überschreibbar) |

### Automation-Sensoren

| Entity | Beschreibung |
|--------|-------------|
| `sensor.pool_pump_manager_runtime_today` | Laufzeit heute (Stunden) |
| `sensor.pool_pump_manager_target_runtime` | Berechnete Ziel-Laufzeit (Stunden) |
| `sensor.pool_pump_manager_status` | Aktueller Status + Diagnoseinformationen |
| `sensor.pool_pump_manager_efficiency` | Tageseffizienz (%) |
| `sensor.pool_pump_manager_next_start` | Nächster geplanter Start (Zeitstempel) |
| `sensor.pool_pump_manager_remaining_runtime` | Verbleibende Laufzeit (Stunden) |

### Metering-Sensoren (neu in v0.2.0)

| Entity | Beschreibung | Einheit |
|--------|-------------|---------|
| `sensor.pool_pump_manager_power` | Leistung (gespiegelt) | W / kW |
| `sensor.pool_pump_manager_energy` | Energiezähler (gespiegelt) | kWh / Wh |
| `sensor.pool_pump_manager_voltage` | Spannung (gespiegelt) | V |
| `sensor.pool_pump_manager_current` | Strom (gespiegelt) | A |
| `sensor.pool_pump_manager_frequency` | Frequenz (gespiegelt) | Hz |

> Diese Sensoren sind nur verfügbar, wenn eine Quell-Entity zugeordnet wurde.

### Binary Sensoren

| Entity | Beschreibung |
|--------|-------------|
| `binary_sensor.pool_pump_manager_running` | Pumpe läuft gerade |
| `binary_sensor.pool_pump_manager_warning` | Warnung aktiv |

### Diagnoseinformationen

Der `sensor.pool_pump_manager_status` enthält folgende Attribute:

```yaml
metering_power_source: sensor.hm_xxxxx_power
metering_energy_source: sensor.hm_xxxxx_energy_counter
metering_voltage_source: sensor.hm_xxxxx_voltage
metering_current_source: sensor.hm_xxxxx_current
metering_frequency_source: sensor.hm_xxxxx_frequency
```

---

## Status-Werte

| Wert | Beschreibung |
|------|-------------|
| `waiting` | Vor dem Betriebsfenster |
| `running` | Pumpe läuft |
| `scheduled` | Geplant, gerade Pause |
| `completed` | Tagesziel erreicht |
| `manual` | Automatik deaktiviert |

---

## Services

| Service | Beschreibung |
|---------|-------------|
| `pool_pump_manager.start_now` | Pumpe sofort einschalten |
| `pool_pump_manager.stop_now` | Pumpe sofort ausschalten |
| `pool_pump_manager.reset_runtime_today` | Tageslaufzeit zurücksetzen |
| `pool_pump_manager.force_recalculate` | Zeitplan neu berechnen |

---

## Sicherheitsfunktion

Wenn der Pumpenschalter eingeschaltet ist, aber die Leistungsaufnahme länger als **2 Minuten** unter **100 Watt** liegt, wird:

- `binary_sensor.pool_pump_manager_warning` aktiviert
- Eine **persistente Benachrichtigung** in Home Assistant erzeugt:
  > *"Poolpumpe scheint nicht zu laufen, obwohl sie eingeschaltet ist."*

---

## Dashboard-Beispiel

Die Datei [`lovelace-example.yaml`](lovelace-example.yaml) enthält ein fertiges Dashboard mit:

- Automatik-Schalter, Pumpen-Status, Warnungsanzeige
- Live-Messwerte (Leistung, Energie, Spannung, Strom, Frequenz)
- Laufzeit-Übersicht
- Effizienz- und Leistungs-Gauge
- Verlaufsgraph Leistung (24 Stunden)
- Aktions-Buttons für alle Services

---

## Changelog

### v0.2.0

- **Automatische Sensor-Erkennung** nach Auswahl des Pumpenschalters (via Device-ID + Fallback über Entity-Namen)
- **5 neue Metering-Sensoren**: Leistung, Energie, Spannung, Strom, Frequenz
- **Options Flow erweitert**: 2-Schritt-Flow (Pool-Parameter + Sensoren)
- **Diagnoseinformationen** im Status-Sensor (Quell-Entities sichtbar)
- Volle Rückwärtskompatibilität zu v0.1.0

### v0.1.0

- Erste vollständige Version mit Config Flow, Automatik und Sicherheitswarnung

---

## Anforderungen

- Home Assistant 2024.1.0 oder neuer
- HACS (für die empfohlene Installationsmethode)

---

## Lizenz

MIT License – siehe [LICENSE](LICENSE)

---

## Beitragen

Issues und Pull Requests sind willkommen auf [GitHub](https://github.com/choell401780/homeassistant-pool-pump-manager).
