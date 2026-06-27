# Pool Pump Manager

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/choell401780/homeassistant-pool-pump-manager.svg)](https://github.com/choell401780/homeassistant-pool-pump-manager/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Eine professionelle Home-Assistant-Custom-Integration zur intelligenten Steuerung einer Poolpumpe auf Basis von Poolvolumen, Pumpenleistung und gewünschter Wasserumwälzung.

Unterstützt u.a. den **Homematic HM-ES-PMSw1-Pl-DN-R1** mit automatischer Sensor-Erkennung.

---

## Features

- **Automatische Laufzeitberechnung** auf Basis von Poolvolumen, Förderleistung und Umwälzungen pro Tag
- **Gleichmäßige Zeitplanung** – Laufzeit wird automatisch auf mehrere Blöcke im Tagesfenster verteilt
- **Persistente Laufzeitverfolgung** – überlebt Home-Assistant-Neustarts
- **Automatische Sensor-Erkennung** – Leistung, Energie, Spannung, Strom und Frequenz werden automatisch ermittelt
- **Saisonmodus** – automatische oder manuelle saisonale Anpassung der Umwälzfrequenz
- **Wartungs- & Lebenszeitzähler** – Gesamtlaufzeit, Saisonlaufzeit, Laufzeit seit Wartung
- **Pool Control Center** – professionelles Custom-Lovelace-Dashboard im Dark-Glass-Design mit Pool-Visualisierung
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
| Umwälzungen/Tag | 1,5 | Gewünschte Umwälzungen pro Tag (Basis) |
| Startzeit | 08:00 | Früheste Betriebszeit |
| Endzeit | 20:00 | Späteste Betriebszeit |

---

## Saisonmodus (neu in v0.3.0)

Der Saisonmodus passt die Umwälzfrequenz automatisch an die Jahreszeit an. Über `select.pool_pump_manager_season_mode` können folgende Modi gewählt werden:

| Modus | Umwälzungen/Tag | Monate (Auto) |
|-------|----------------|---------------|
| Automatisch | je nach Jahreszeit | – |
| Frühling | 1,0 | März – April |
| Sommer | 1,5 | Mai – August |
| Herbst | 1,0 | September – Oktober |
| Winter | 0,5 | November – Februar |

Im Modus **Automatisch** wird die Jahreszeit anhand des aktuellen Monats ermittelt. Die manuelle Überschreibung über `number.pool_pump_manager_daily_runtime_hours` hat weiterhin Vorrang.

---

## Wartungs- & Lebenszeitzähler (neu in v0.3.0)

Drei persistente Zähler verfolgen die Pumpen-Laufzeit über die gesamte Lebensdauer:

| Entity | Beschreibung |
|--------|-------------|
| `sensor.pool_pump_manager_total_runtime` | Gesamtlaufzeit seit Erstinstallation (Stunden) |
| `sensor.pool_pump_manager_season_runtime` | Laufzeit der aktuellen Saison (Stunden) |
| `sensor.pool_pump_manager_runtime_since_maintenance` | Laufzeit seit letzter Wartung (Stunden) |

Die Zähler können über zwei Buttons zurückgesetzt werden:

| Entity | Beschreibung |
|--------|-------------|
| `button.pool_pump_manager_reset_maintenance` | Wartungszähler zurücksetzen |
| `button.pool_pump_manager_reset_season` | Saisonzähler zurücksetzen |

---

## Pool Control Center (neu in v0.3.0)

Die Integration registriert automatisch eine **Custom Lovelace Card** (`pool-control-center-card`) beim HA-Frontend. Die Karte zeigt:

- **Pool-Visualisierung**: SVG-Vogelperspektive mit Pool (oval), Holzdeck, Hecken, Palme
- **Live-Daten**: alle Messwerte, Laufzeiten, Status in Echtzeit
- **Steuerung**: Automatik, Start/Stop, Saisonmodus (zyklisch per Klick), Wartungs-Reset
- **Wasserqualität-Sektion**: Platzhalter für pH, Redox, Temperatur (kommt in zukünftiger Version)
- **Dark-Glass-Design**: Glassmorphismus, responsiv für Tablet & Mobil

### Einbindung in Lovelace

Nach der Installation und einem **Neustart von Home Assistant**:

1. Dashboard öffnen → **Bearbeiten** → **Karte hinzufügen**
2. Unten auf **Manuelle Karte** klicken und folgendes eingeben:

```yaml
type: custom:pool-control-center-card
title: Pool Control Center
```

**Keine manuelle Ressourcen-Registrierung erforderlich.** Die Card wird beim Start automatisch unter `Einstellungen → Dashboards → Ressourcen` sichtbar sein.

> **Technischer Hinweis:** Die Integration kopiert `pool-control-center.js` beim Start automatisch nach
> `/config/www/community/pool_pump_manager/` und registriert sie als ES-Modul im HA-Frontend.
> Die Datei wird dabei immer mit der aktuellen Version überschrieben, sodass HACS-Updates direkt wirksam sind.

### Fallback (manuell)

Falls die automatische Registrierung nicht funktioniert (z. B. bei Schreibschutz auf `/config/www/`):

1. **Einstellungen → Dashboards → Ressourcen** öffnen
2. **Ressource hinzufügen** klicken
3. URL: `/local/community/pool_pump_manager/pool-control-center.js`
4. Typ: **JavaScript-Modul**
5. Home Assistant neu starten

---

## Berechnungsbeispiel

```
Poolvolumen:      64 m³
Umwälzungen:      1,5 / Tag  (Sommer-Modus)
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

### Select (neu in v0.3.0)

| Entity | Beschreibung |
|--------|-------------|
| `select.pool_pump_manager_season_mode` | Saisonmodus (auto/spring/summer/autumn/winter) |

### Number

| Entity | Beschreibung |
|--------|-------------|
| `number.pool_pump_manager_daily_runtime_hours` | Ziel-Laufzeit (manuell überschreibbar) |

### Button (neu in v0.3.0)

| Entity | Beschreibung |
|--------|-------------|
| `button.pool_pump_manager_reset_maintenance` | Wartungszähler zurücksetzen |
| `button.pool_pump_manager_reset_season` | Saisonzähler zurücksetzen |

### Automation-Sensoren

| Entity | Beschreibung |
|--------|-------------|
| `sensor.pool_pump_manager_runtime_today` | Laufzeit heute (Stunden) |
| `sensor.pool_pump_manager_target_runtime` | Berechnete Ziel-Laufzeit (Stunden) |
| `sensor.pool_pump_manager_status` | Aktueller Status + Diagnoseinformationen |
| `sensor.pool_pump_manager_efficiency` | Tageseffizienz (%) |
| `sensor.pool_pump_manager_next_start` | Nächster geplanter Start (Zeitstempel) |
| `sensor.pool_pump_manager_remaining_runtime` | Verbleibende Laufzeit (Stunden) |

### Laufzeitzähler (neu in v0.3.0)

| Entity | Beschreibung |
|--------|-------------|
| `sensor.pool_pump_manager_total_runtime` | Gesamtlaufzeit (Stunden) |
| `sensor.pool_pump_manager_season_runtime` | Saisonlaufzeit (Stunden) |
| `sensor.pool_pump_manager_runtime_since_maintenance` | Laufzeit seit Wartung (Stunden) |

### Metering-Sensoren (neu in v0.2.0)

| Entity | Beschreibung | Einheit |
|--------|-------------|---------|
| `sensor.pool_pump_manager_power` | Leistung (gespiegelt) | W / kW |
| `sensor.pool_pump_manager_energy` | Energiezähler (gespiegelt) | kWh / Wh |
| `sensor.pool_pump_manager_voltage` | Spannung (gespiegelt) | V |
| `sensor.pool_pump_manager_current` | Strom (gespiegelt) | A |
| `sensor.pool_pump_manager_frequency` | Frequenz (gespiegelt) | Hz |

### Wasserqualität (Platzhalter – neu in v0.3.0)

| Entity | Beschreibung | Status |
|--------|-------------|--------|
| `sensor.pool_pump_manager_ph` | pH-Wert | Nicht konfiguriert |
| `sensor.pool_pump_manager_redox` | Redox-Potential | Nicht konfiguriert |
| `sensor.pool_pump_manager_pool_temperature` | Wassertemperatur | Nicht konfiguriert |

> Diese Sensoren zeigen im Zustand "Nicht konfiguriert" – die Konfigurationsmöglichkeit kommt in einer zukünftigen Version.

### Binary Sensoren

| Entity | Beschreibung |
|--------|-------------|
| `binary_sensor.pool_pump_manager_running` | Pumpe läuft gerade |
| `binary_sensor.pool_pump_manager_warning` | Warnung aktiv |

---

## Diagnoseinformationen

Der `sensor.pool_pump_manager_status` enthält folgende Attribute:

```yaml
effective_season: summer
season_mode: auto
seasonal_circulations: 1.5
metering_power_source: sensor.hm_xxxxx_power
metering_energy_source: sensor.hm_xxxxx_energy_counter
metering_voltage_source: sensor.hm_xxxxx_voltage
metering_current_source: sensor.hm_xxxxx_current
metering_frequency_source: sensor.hm_xxxxx_frequency
```

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
- Eine **persistente Benachrichtigung** in Home Assistant erzeugt

---

## Dashboard

Die Datei [`lovelace-example.yaml`](lovelace-example.yaml) enthält ein fertiges Dashboard mit:

- **Pool Control Center Custom Card** (Dark-Glass-Design, Pool-SVG)
- Saisonmodus-Auswahl und Betriebsparameter
- Status-Übersicht und Laufzeiten
- Wartungs- & Lebenszeitzähler mit Reset-Buttons
- Live-Messwerte und Verlaufsgraph
- Wasserqualität-Platzhalter
- Aktions-Buttons für alle Services

---

## Troubleshooting

### Werte zeigen „–" oder sind leer

**Ursache 1: Metering-Sensoren nicht konfiguriert**
Leistung, Spannung, Strom, Frequenz und Energie werden von der Integration nur angezeigt, wenn ein physischer Sensor im Config Flow konfiguriert wurde.
Lösung: Einstellungen → Integrationen → Pool Pump Manager → Konfigurieren → Metering-Sensoren zuweisen.

**Ursache 2: Entity-ID unterscheidet sich vom Default**
Die Card sucht automatisch nach `sensor.pool_pump_manager_metering_power` etc. Falls die Entities anders heißen, nutzt die Card den Auto-Discovery-Mechanismus (Suffix-Map + Friendly-Name-Fallback).
Diagnose: Info-Tab öffnen — dort jede Entity mit Status ✓/?/✗ und aktuellem Wert.

**Ursache 3: Wasserqualitäts-Sensoren**
pH, Redox und Temperatur sind Platzhalter und zeigen immer `unavailable`. Dies ist by design und wird in einer zukünftigen Version konfigurierbar.

### Entity-IDs der Integration (v0.6.0)

| Funktion | Entity-ID |
|---|---|
| Automatik | `switch.pool_pump_manager_automation_enabled` |
| Pumpe läuft | `binary_sensor.pool_pump_manager_running` |
| Warnung | `binary_sensor.pool_pump_manager_warning` |
| Status | `sensor.pool_pump_manager_status` |
| Laufzeit heute | `sensor.pool_pump_manager_runtime_today` |
| Restlaufzeit | `sensor.pool_pump_manager_remaining_runtime` |
| Tagesziel | `sensor.pool_pump_manager_target_runtime` |
| Nächster Start | `sensor.pool_pump_manager_next_start` |
| Gesamtlaufzeit | `sensor.pool_pump_manager_total_runtime` |
| Saisonlaufzeit | `sensor.pool_pump_manager_season_runtime` |
| Seit Wartung | `sensor.pool_pump_manager_runtime_since_maintenance` |
| Effizienz | `sensor.pool_pump_manager_efficiency` |
| Leistung* | `sensor.pool_pump_manager_metering_power` |
| Energie* | `sensor.pool_pump_manager_metering_energy` |
| Spannung* | `sensor.pool_pump_manager_metering_voltage` |
| Strom* | `sensor.pool_pump_manager_metering_current` |
| Frequenz* | `sensor.pool_pump_manager_metering_frequency` |
| Saisonmodus | `select.pool_pump_manager_season_mode` |
| Reset Wartung | `button.pool_pump_manager_reset_maintenance` |
| Reset Saison | `button.pool_pump_manager_reset_season` |

*Erfordert Konfiguration eines externen Metering-Sensors.

### Debug-Modus aktivieren

Zahnrad ⚙ oben rechts → Debug-Modus EIN → Info-Tab öffnen.
Zeigt für jede Entity: Name · Entity-ID · aktueller Wert + Einheit · letzter Update-Zeitstempel · Fehlerursache.

### Poolbild konfigurieren

Zahnrad ⚙ oben rechts → URL eingeben → Übernehmen.
Beispiel: `/local/pool.jpg` (Datei unter `/config/www/pool.jpg`)
Einstellung wird im Browser-`localStorage` gespeichert.

---

## Changelog

### v0.6.0

- **Root-Cause-Fix: Metering-Sensoren leer** — Entity-IDs korrigiert: Card suchte `sensor.pool_pump_manager_power`, Integration erstellt aber `sensor.pool_pump_manager_metering_power` — behebt leere Werte für Leistung, Energie, Spannung, Strom, Frequenz
- **Toast-Benachrichtigungen** — nach jedem Service Call kurze Rückmeldung (✓ Pumpe gestartet / ✗ Fehler)
- **Warning-Badge** im Header — zeigt Anzahl fehlender kritischer Entities; Klick öffnet Info/Diagnose
- **Nächster Start lesbar** — TIMESTAMP-Sensor wird als „Heute 08:00 Uhr" formatiert statt ISO-String
- **Performance** — Re-Render nur wenn sich ein Entity-State tatsächlich geändert hat (`_hasRelevantChange`)
- **Info-Seite: Fehlerursache** — zeigt konkrete Erklärung: „Entity nicht in HA registriert", „Metering-Sensor: externer Sensor nicht konfiguriert", „Platzhalter", „unavailable", „unknown"
- **README: Troubleshooting + Entity-ID-Tabelle**

### v0.5.3

- **Einstellungen-Zahnrad (⚙)** oben rechts im Header — öffnet modales Panel mit Animation
- **Poolbild per UI konfigurieren** — keine Dateien mehr kopieren nötig: Zahnrad → URL eingeben → Übernehmen; Wert wird in `localStorage` gespeichert und überlebt Page-Reloads; leer lassen = CSS-Fallback
- **Debug-Modus** — Toggle im Einstellungs-Panel; aktiviert `last_changed`-Zeitstempel je Entity auf der Info-Seite
- **Architektur-Slots** vorbereitet: Theme, Animationen, Akzentfarbe (grau = demnächst)
- **Page-in-Animation** — sanfte Einblendung beim Tab-Wechsel (`0.18s ease`)
- **Nav-Aktivindikator** — 2 px Linie unter aktivem Tab
- **Settings re-render blockiert** — während das Settings-Modal offen ist, werden keine HA-State-Updates neu gerendert (verhindert Reset des URL-Inputs)
- **Pool-Image-Priorität**: `localStorage` (User) → `pool_image` (HA Config) → CSS-Fallback

### v0.5.2

- **Fix: Laufzeitwerte leer** — `_resolveEntities()` läuft jetzt nach jeder HA-Aktualisierung erneut, solange kritische Entities fehlen oder `unavailable` sind (statt nur einmal beim Start)
- **Fix: Entity-Mapping robuster** — SUFFIX_MAP enthält jetzt deutsche Alternativ-Suffixe (`laufzeit_heute`, `restlaufzeit`, `tagesziel`, `gesamtlaufzeit`, `saisonlaufzeit`, `seit_wartung`, etc.)
- **Fix: Friendly-Name-Fallback** — wenn Suffix-Mapping scheitert, wird `attributes.friendly_name` aller `pool_pump_manager`-Entities durchsucht
- **Fix: Info-Seite zeigt echte Diagnose** — für jede Entity: Anzeigename · tatsächliche Entity-ID · aktueller State + Einheit · ✓/?/✗ Status; remappte IDs orange hervorgehoben
- **Fix: unavailable ≠ gefunden** — Entity mit State `unavailable`/`unknown` zeigt `?` statt `✓`

### v0.5.1

- **Eigenes Poolbild**: Automatische Erkennung von `/config/www/pool-pump-manager/pool-background.jpg` — falls vorhanden, wird es über die CSS-Schichten gelegt. Alternativ `pool_image: /local/...` in der Card-Konfiguration
- **Funktionale Navigation**: Alle 6 Tabs sind jetzt klickbar (Übersicht, Laufzeiten, Einstellungen, Wartung, Historie, Info)
- **Laufzeiten-Seite**: Laufzeit heute, Restlaufzeit, Nächster Start, Tagesziel, Saisonlaufzeit, Gesamtlaufzeit mit Fortschrittsbalken
- **Einstellungen-Seite**: Automatik-Toggle, 5 Saisonmodus-Buttons (Auto/Frühling/Sommer/Herbst/Winter mit aktiver Markierung), Anleitung für eigenes Poolbild
- **Wartungs-Seite**: Gesamtstunden, Saisonstunden, seit Wartung, Nächste Wartung + funktionale Reset-Buttons
- **Info-Seite**: Version, GitHub-Link, alle Entities mit ✓/✗ Status und aktuellem Wert
- **Verbesserte Entity-Erkennung**: Auto-Scan aller `pool_pump_manager`-Entities aus `hass.states`, dann Suffix-Mapping für fehlende Werte
- **console.debug-Logging**: Entity-Discovery-Zusammenfassung (gefunden/nicht gefunden), Navigation-Klicks, Service-Calls

### v0.5.0

- **Pool-Hero komplett überarbeitet**: SVG-Landschaft (Cartoon-Palme, gezeichnete Hecken) durch atmosphärisches CSS-Layer-System ersetzt
- **CSS-Schichten (10 Ebenen)**: Himmelsgradient, unscharfe Foliagen-Blobs (kein Cartoon), Holzdeck via `repeating-linear-gradient`, 9 Amber-Boden-Uplights, Pool-Glow-Halo, Pool-Rim, Pool-Wasser mit Unterwasser-Lichtspots, Palmen-Silhouette als data-URI (nur filled shapes, kein stroke), Möbel-Silhouetten, Tiefenvignette
- **Ripple-Animation**: CSS `@keyframes pool-ripple` wenn Pumpe läuft — kein SVG `<animate>`
- **Technik-SVGs verbessert**: Pumpe mit `radialGradient`/`linearGradient` Volumenkörper (kein sichtbarer Stroke), größerer LED-Ring mit Outer-Glow-Halo, Sandfilter mit Manometer-Skalenstrichen, Dosieranlage mit Reflexions-Highlights
- **Keine SVG-Landschaft mehr** — Pool-Bereich ist reines HTML/CSS

### v0.4.2

- **Pool Control Center Mockup-Redesign**: `pool-control-center.js` komplett neu geschrieben, pixelgenau am Dashboard-Mockup ausgerichtet
- **Neuer Pool-Hero-Bereich**: Atmosphärische Nacht-Szene mit SVG-Schichten (Sternenhimmel, Hecken-Silhouetten, Palme mit Wedeln, Holzdeck-Planken, 8 Amber-Boden-Uplights, brillantes Teal-Poolwasser mit 3 Unterwasser-Lichtspots, Kaustikhighlights, Liegestühle, Sonnenschirm, Poolleiter) — Ripple-Animation wenn Pumpe läuft
- **Technik-Panel überarbeitet**: Drei separate SVG-Builder (Pump, Filter, Doser) — Pumpe mit blauem LED-Ring-Spinner, Sandfilter mit Manometer-Nadel, Dosieranlage mit pH-blau/Redox-rot Flaschen
- **Status-Bar**: 7 Metriken in einheitlichem Grid (Status, Leistung, Spannung, Strom, Frequenz, Effizienz, Energie) mit farbigen Icons und Einheitenformatierung
- **Header**: 3 Badges (Automatik-Dot pulsierend, Saison-Icon, Version) — Klick auf Automatik-Badge und Saison-Badge direkt funktional
- **Bottom-Panels**: LAUFZEITEN (Fortschrittsbalken), SAISON (Saisonname groß, Saisonmodus-Link), WASSERQUALITÄT, WARTUNG & BETRIEBSSTUNDEN, STEUERUNG (Automatikmodus-Toggle, Start/Stop, Reset-Buttons, Saisonmodus-Dropdown)
- **Navigationsleiste**: 6 Buttons (Übersicht aktiv, Laufzeiten, Einstellungen, Wartung, Historie, Info)
- **Version**: Alle Tags (`manifest.json`, `switch.py`, Card-Banner) auf 0.4.2

### v0.4.1

- **Bugfix**: Alle Service-Calls (Start, Stop, Automatik, Reset, Saison) mit Fehlerbehandlung und console.warn bei Fehlschlag
- **Entity-Auto-Discovery**: Fallback-Auflösung für alternative Entity-IDs (z. B. `pool_temperature` / `temperature`)
- **Verbesserte Pool-SVG**: Atmosphärische Nacht-Szene, helleres Poolwasser mit Unterwasserbeleuchtung, Deck-Lampen, Palme, Liegestühle
- **Verbesserter Technikbereich**: Poolpumpe mit Rotationsanimation, Sandfilter mit Manometer, Dosieranlage mit Füllstand-Anzeige, Rohr-Verbindungen mit Richtungspfeilen
- **Saisonmodus**: Direktwahl per 5 Buttons (Auto, Frühling, Sommer, Herbst, Winter) – kein Zyklusklick mehr nötig
- **Click-Feedback**: Buttons animieren beim Klick visuell
- **console.debug-Logging**: Card-Load, Entity-Discovery, Button-Klicks, Service-Calls
- **Robuste Darstellung**: Card zeigt `–` für nicht konfigurierte Werte, nie leere Felder oder JS-Fehler
- **Verbessertes CSS**: Mehr Tiefe, bessere Abstände, Hover-Effekte, Fortschrittsbalken-Transition

### v0.4.0

- **Komplett überarbeitetes Pool Control Center Dashboard** (Redesign)
- Neues Dark-Glass-Design mit professioneller Optik (Desktop, Tablet, Mobil)
- SVG-Poolvisualisierung: Nacht-Szene mit ovalem Pool, Holzdeck, Hecken, Beleuchtung, Palme
- SVG-Technikbereich: Poolpumpe (mit Animation), Sandfilter, Dosieranlage mit Echtzeit-Status
- Pulsierender Statuspunkt für Automatikmodus (grün = aktiv, grau = deaktiviert)
- 7 Live-Statuskacheln: Status, Leistung, Spannung, Strom, Frequenz, Effizienz, Energie
- Fortschrittsbalken für Tagesziel-Erreichung in Laufzeiten-Panel
- Saisonmodus-Panel mit großer Anzeige der aktuellen Saison
- Verbesserte Steuerpanel-Optik (Auto-Toggle + Start/Stop-Buttons)
- Responsive für alle Bildschirmgrößen
- Wasserbewegungsanimation wenn Pumpe läuft (Ripple-Effekt im Pool)
- Impeller-Rotationsanimation an der Pumpe

### v0.3.1

- **Hotfix**: Automatische Lovelace-Ressourcen-Registrierung repariert
- Die Integration kopiert `pool-control-center.js` jetzt beim Start nach `/config/www/community/pool_pump_manager/` (Standard-HACS-Pfad, serviert über `/local/`)
- Registrierung erfolgt nun in `async_setup_entry` (zuverlässigerer Zeitpunkt als `async_setup`)
- Fallback auf benutzerdefinierten statischen Pfad wenn `/config/www/` nicht beschreibbar
- Verbesserte Fehlerprotokollierung für Frontend-Registrierung
- Kein manuelles Hinzufügen von Lovelace-Ressourcen mehr erforderlich

### v0.3.0

- **Saisonmodus**: `select.pool_pump_manager_season_mode` mit automatischer Jahreszeiterkennung
- **Saisonale Umwälzfrequenz**: Frühling/Herbst 1,0×, Sommer 1,5×, Winter 0,5× pro Tag
- **Wartungszähler**: Gesamtlaufzeit, Saisonlaufzeit, Laufzeit seit Wartung (persistent)
- **Reset-Buttons**: `button.pool_pump_manager_reset_maintenance` und `button.pool_pump_manager_reset_season`
- **Pool Control Center**: Custom Lovelace Card mit SVG-Pool-Visualisierung und Dark-Glass-Design
- **Wasserqualität-Platzhalter**: pH, Redox, Wassertemperatur (Vorbereitung für zukünftige Version)
- Diagnoseinformationen im Status-Sensor erweitert (Season-Daten)

### v0.2.0

- **Automatische Sensor-Erkennung** nach Auswahl des Pumpenschalters
- **5 neue Metering-Sensoren**: Leistung, Energie, Spannung, Strom, Frequenz
- **Options Flow erweitert**: 2-Schritt-Flow (Pool-Parameter + Sensoren)
- **Diagnoseinformationen** im Status-Sensor

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
