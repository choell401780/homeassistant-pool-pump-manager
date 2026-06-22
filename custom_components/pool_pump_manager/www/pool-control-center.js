/**
 * Pool Control Center – Custom Lovelace Card
 * Pool Pump Manager v0.4.1
 * Dark-Glass Dashboard | SVG Pool Scene | HA Service Calls
 */
const CARD_VERSION = '0.4.1';

const LOG = {
  info:  (...a) => console.info( '%c[PCC]%c', 'color:#22d3ee;font-weight:700', '', ...a),
  debug: (...a) => console.debug('[PCC]', ...a),
  warn:  (...a) => console.warn( '[PCC]', ...a),
};

// ── Default Entity IDs ────────────────────────────────────────────────────────
const ENTITY_DEFAULTS = {
  automation:    'switch.pool_pump_manager_automation_enabled',
  running:       'binary_sensor.pool_pump_manager_running',
  warning:       'binary_sensor.pool_pump_manager_warning',
  status:        'sensor.pool_pump_manager_status',
  power:         'sensor.pool_pump_manager_power',
  energy:        'sensor.pool_pump_manager_energy',
  voltage:       'sensor.pool_pump_manager_voltage',
  current:       'sensor.pool_pump_manager_current',
  frequency:     'sensor.pool_pump_manager_frequency',
  runtimeToday:  'sensor.pool_pump_manager_runtime_today',
  remaining:     'sensor.pool_pump_manager_remaining_runtime',
  target:        'sensor.pool_pump_manager_target_runtime',
  efficiency:    'sensor.pool_pump_manager_efficiency',
  nextStart:     'sensor.pool_pump_manager_next_start',
  totalRuntime:  'sensor.pool_pump_manager_total_runtime',
  seasonRuntime: 'sensor.pool_pump_manager_season_runtime',
  maintenance:   'sensor.pool_pump_manager_runtime_since_maintenance',
  seasonMode:    'select.pool_pump_manager_season_mode',
  ph:            'sensor.pool_pump_manager_ph',
  redox:         'sensor.pool_pump_manager_redox',
  temperature:   'sensor.pool_pump_manager_pool_temperature',
  btnMaint:      'button.pool_pump_manager_reset_maintenance',
  btnSeason:     'button.pool_pump_manager_reset_season',
};

// Alternative IDs tried when primary is absent from hass.states
const ENTITY_FALLBACKS = {
  temperature: [
    'sensor.pool_pump_manager_temperature',
    'sensor.pool_pump_manager_water_temperature',
    'sensor.pool_pump_manager_pool_temp',
  ],
  power:     ['sensor.pool_pump_manager_leistung'],
  voltage:   ['sensor.pool_pump_manager_spannung'],
  current:   ['sensor.pool_pump_manager_strom'],
  frequency: ['sensor.pool_pump_manager_hz'],
  energy:    ['sensor.pool_pump_manager_verbrauch'],
};

// ── Season / Status constants ─────────────────────────────────────────────────
const SEASON_LABEL = { auto: 'Auto', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter' };
const SEASON_ICON  = { auto: '🔄', spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_COLOR = { auto: '#94a3b8', spring: '#86efac', summer: '#fbbf24', autumn: '#fb923c', winter: '#93c5fd' };
const SEASON_MODES = ['auto', 'spring', 'summer', 'autumn', 'winter'];
const STATUS_LABEL = { running: 'Läuft', waiting: 'Wartet', scheduled: 'Geplant', completed: 'Fertig', manual: 'Manuell', unknown: '–' };
const STATUS_COLOR = { running: '#22d3ee', waiting: '#a78bfa', scheduled: '#60a5fa', completed: '#4ade80', manual: '#f59e0b', unknown: '#64748b' };

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
:host { display: block; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.pcc {
  background: linear-gradient(160deg, #0b1528 0%, #07101e 55%, #050d18 100%);
  border-radius: 16px;
  overflow: hidden;
  color: #e2e8f0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  user-select: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6);
}

.pcc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px 12px;
  background: rgba(0,0,0,0.35);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-wrap: wrap;
}
.pcc-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: .06em;
  color: #e2e8f0;
  text-transform: uppercase;
}
.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter .18s, transform .15s;
  border: 1px solid transparent;
  position: relative;
  z-index: 5;
  pointer-events: all;
}
.badge:hover  { filter: brightness(1.25); }
.badge:active { transform: scale(0.95); }
.badge-auto-on  { background: rgba(34,211,238,.13); border-color: rgba(34,211,238,.35); color: #22d3ee; }
.badge-auto-off { background: rgba(100,116,139,.1);  border-color: rgba(100,116,139,.25); color: #64748b; }
.badge-season   { background: rgba(148,163,184,.09); border-color: rgba(148,163,184,.2);  color: #94a3b8; }
.pulse-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 7px #22d3ee;
  animation: pdot 2s ease-in-out infinite;
  flex-shrink: 0;
}
.pulse-dot.off { background: #475569; box-shadow: none; animation: none; }
@keyframes pdot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.82)} }
.version-label { margin-left: auto; font-size: 0.62rem; color: #2d3f55; letter-spacing: .08em; }

.warn {
  padding: 9px 18px;
  background: rgba(239,68,68,.14);
  border-left: 3px solid #ef4444;
  color: #fca5a5;
  font-size: 0.78rem;
  font-weight: 500;
}

.main-row {
  display: grid;
  grid-template-columns: 1fr 320px;
  min-height: 260px;
}
.pool-area {
  overflow: hidden;
  display: flex;
  align-items: stretch;
}
.pool-area svg {
  width: 100%; height: 100%;
  min-height: 240px;
  pointer-events: none;
  display: block;
}
.tech-area {
  background: rgba(0,0,0,.3);
  border-left: 1px solid rgba(255,255,255,.06);
  display: flex;
  flex-direction: column;
}
.tech-title {
  padding: 10px 14px 5px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: .14em;
  color: #3d5068;
  text-transform: uppercase;
}
.tech-svg-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
}
.tech-svg-wrap svg {
  width: 100%; height: auto;
  pointer-events: none;
}
.tech-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid rgba(255,255,255,.05);
  background: rgba(0,0,0,.25);
  min-height: 38px;
}
.tech-status-label { font-size: 0.8rem; font-weight: 700; }
.tech-vals { display: flex; gap: 12px; font-size: 0.7rem; color: #64748b; font-family: monospace; }

.tiles-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid rgba(255,255,255,.06);
}
.tile {
  padding: 11px 8px;
  border-right: 1px solid rgba(255,255,255,.05);
  background: rgba(255,255,255,.02);
  text-align: center;
  transition: background .2s;
}
.tile:last-child { border-right: none; }
.tile:hover { background: rgba(255,255,255,.04); }
.tile-header {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: .1em;
  color: #3d5068;
  text-transform: uppercase;
  margin-bottom: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tile-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #cbd5e1;
  line-height: 1.1;
}
.tile-unit { font-size: 0.6rem; color: #64748b; margin-left: 1px; }

.prog-wrap { height: 4px; background: rgba(255,255,255,.04); }
.prog-fill { height: 100%; background: linear-gradient(90deg,#0369a1,#22d3ee); transition: width .6s ease; }

.panels-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid rgba(255,255,255,.06);
}
.panel {
  padding: 14px 12px;
  border-right: 1px solid rgba(255,255,255,.05);
}
.panel:last-child { border-right: none; }
.panel-title {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: .12em;
  color: #3d5068;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 2px solid #0369a1;
}
.prow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 0.74rem;
  border-bottom: 1px solid rgba(255,255,255,.03);
  gap: 4px;
}
.prow:last-child { border-bottom: none; }
.prow-label { color: #64748b; flex-shrink: 0; }
.prow-value { font-weight: 600; color: #94a3b8; text-align: right; }
.not-cfg { color: #2d3f55; font-size: 0.65rem; font-style: italic; }

.ctrl-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 11px;
  border-radius: 9px;
  margin-bottom: 9px;
  cursor: pointer;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  transition: background .18s, transform .15s;
  font-size: 0.77rem;
  font-weight: 600;
  color: #94a3b8;
  position: relative;
  z-index: 10;
  pointer-events: all;
}
.ctrl-toggle:hover  { background: rgba(255,255,255,.08); }
.ctrl-toggle:active { transform: scale(0.97); }
.toggle-track {
  width: 34px; height: 18px;
  border-radius: 9px;
  background: #1a2535;
  border: 1px solid rgba(255,255,255,.1);
  position: relative;
  transition: background .3s;
  flex-shrink: 0;
}
.toggle-track.on { background: #0369a1; border-color: #22d3ee; box-shadow: 0 0 8px rgba(34,211,238,.3); }
.toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #64748b;
  transition: transform .28s, background .28s;
}
.toggle-track.on .toggle-thumb { transform: translateX(16px); background: #fff; }
.ctrl-label { flex: 1; }
.ctrl-label.on { color: #22d3ee; }
.cbtn {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter .18s, transform .12s, box-shadow .18s;
  margin-bottom: 7px;
  text-transform: uppercase;
  letter-spacing: .07em;
  position: relative;
  z-index: 10;
  pointer-events: all;
}
.cbtn:last-child { margin-bottom: 0; }
.cbtn:hover  { filter: brightness(1.15); }
.cbtn:active { transform: scale(0.95); filter: brightness(.88); }
.cbtn.fx { animation: btnfx .28s ease; }
@keyframes btnfx { 0%{transform:scale(1)} 40%{transform:scale(.93)} 100%{transform:scale(1)} }
.cbtn-start { background: linear-gradient(135deg,#047857,#10b981); color: #fff; box-shadow: 0 2px 10px rgba(5,150,105,.3); }
.cbtn-stop  { background: linear-gradient(135deg,#b91c1c,#ef4444); color: #fff; box-shadow: 0 2px 10px rgba(220,38,38,.3); }
.mbtn {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,.09);
  background: rgba(255,255,255,.04);
  color: #64748b;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .18s, color .18s, transform .12s;
  margin-bottom: 5px;
  position: relative;
  z-index: 10;
  pointer-events: all;
}
.mbtn:last-child { margin-bottom: 0; }
.mbtn:hover  { background: rgba(255,255,255,.1); color: #94a3b8; }
.mbtn:active { transform: scale(0.96); }
.mbtn.fx { animation: btnfx .28s ease; }

.season-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 4px;
  margin-bottom: 8px;
}
.sbtn {
  padding: 4px 2px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,.09);
  background: rgba(255,255,255,.03);
  color: #64748b;
  font-family: inherit;
  font-size: 0.62rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  text-align: center;
  position: relative;
  z-index: 10;
  pointer-events: all;
  line-height: 1.4;
}
.sbtn:hover  { background: rgba(255,255,255,.1); color: #94a3b8; }
.sbtn:active { transform: scale(0.93); }
.sbtn.active { border-color: rgba(34,211,238,.45); background: rgba(34,211,238,.1); color: #22d3ee; }

.nav-footer {
  display: flex;
  border-top: 1px solid rgba(255,255,255,.05);
  background: rgba(0,0,0,.2);
}
.nav-tab {
  flex: 1;
  padding: 8px 2px;
  text-align: center;
  font-size: 0.58rem;
  color: #2d3f55;
  letter-spacing: .07em;
  font-weight: 600;
  text-transform: uppercase;
  border-right: 1px solid rgba(255,255,255,.04);
}
.nav-tab:last-child { border-right: none; }
.nav-tab.active { color: #22d3ee; }

@keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes rip1  { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.7;transform:scale(1.06)} }
@keyframes rip2  { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.45;transform:scale(1.04)} }
@keyframes drift { 0%,100%{opacity:.25;transform:translateX(0)} 50%{opacity:.55;transform:translateX(9px)} }

@media(max-width:900px) {
  .main-row { grid-template-columns: 1fr 270px; }
  .tiles-row { grid-template-columns: repeat(4,1fr); }
  .tile:nth-child(n+5) { border-top: 1px solid rgba(255,255,255,.05); }
}
@media(max-width:680px) {
  .main-row { grid-template-columns: 1fr; }
  .tech-area { border-left: none; border-top: 1px solid rgba(255,255,255,.06); max-height: 200px; }
  .tiles-row { grid-template-columns: repeat(3,1fr); }
  .tile:nth-child(n+4) { border-top: 1px solid rgba(255,255,255,.05); }
  .panels-row { grid-template-columns: repeat(2,1fr); }
  .panel:nth-child(2n) { border-right: none; }
  .panel:nth-child(n+3) { border-top: 1px solid rgba(255,255,255,.05); }
  .panel:last-child { grid-column: 1/-1; }
}
@media(max-width:460px) {
  .tiles-row { grid-template-columns: repeat(2,1fr); }
  .panels-row { grid-template-columns: 1fr; }
  .panel { border-right: none !important; }
  .panel+.panel { border-top: 1px solid rgba(255,255,255,.05); }
}
`;

// ── Pool SVG ─────────────────────────────────────────────────────────────────
function buildPoolSvg(running) {
  var stars = '';
  for (var i = 0; i < 22; i++) {
    var sx = ((i * 41 + 17) % 820) + 20;
    var sy = ((i * 29 + 11) % 88) + 4;
    var sr = (i % 3 === 0) ? 1.2 : 0.65;
    var so = (0.25 + (i % 4) * 0.15).toFixed(2);
    stars += '<circle cx="' + sx + '" cy="' + sy + '" r="' + sr + '" fill="#e2e8f0" opacity="' + so + '"/>';
  }
  var planks = '';
  for (var j = 0; j < 7; j++) {
    planks += '<line x1="0" y1="' + (162 + j * 20) + '" x2="900" y2="' + (162 + j * 20) + '" stroke="#3b220c" stroke-width="1.5" opacity="0.45"/>';
  }
  var grain = '';
  for (var k = 0; k < 9; k++) {
    grain += '<line x1="' + (70 + k * 90) + '" y1="155" x2="' + (65 + k * 90) + '" y2="320" stroke="#2a1508" stroke-width="1" opacity="0.25"/>';
  }
  var ripples = running
    ? '<ellipse cx="460" cy="178" rx="65" ry="30" fill="none" stroke="rgba(180,245,255,0.45)" stroke-width="1.5" style="animation:rip1 3s ease-in-out infinite"/>'
      + '<ellipse cx="460" cy="178" rx="115" ry="48" fill="none" stroke="rgba(130,220,255,0.25)" stroke-width="1.5" style="animation:rip2 4.2s ease-in-out infinite 1.1s"/>'
      + '<line x1="408" y1="180" x2="512" y2="174" stroke="rgba(255,255,255,0.3)" stroke-width="1" style="animation:drift 5s ease-in-out infinite"/>'
      + '<line x1="390" y1="188" x2="490" y2="183" stroke="rgba(255,255,255,0.2)" stroke-width="1" style="animation:drift 6s ease-in-out infinite 2s"/>'
    : '';

  return '<svg viewBox="0 0 900 310" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">'
    + '<defs>'
    + '<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#020810"/><stop offset="100%" stop-color="#0a1828"/></linearGradient>'
    + '<linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5e3d1c"/><stop offset="100%" stop-color="#3c2510"/></linearGradient>'
    + '<radialGradient id="pw" cx="50%" cy="42%" r="68%">'
      + '<stop offset="0%" stop-color="#00eeff" stop-opacity="0.9"/>'
      + '<stop offset="30%" stop-color="#06b6d4"/>'
      + '<stop offset="65%" stop-color="#0369a1"/>'
      + '<stop offset="100%" stop-color="#01273f"/>'
    + '</radialGradient>'
    + '<radialGradient id="pg" cx="50%" cy="50%" r="55%">'
      + '<stop offset="0%" stop-color="#22d3ee" stop-opacity="0.28"/>'
      + '<stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>'
    + '</radialGradient>'
    + '<radialGradient id="uwl" cx="50%" cy="50%" r="50%">'
      + '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>'
      + '<stop offset="40%" stop-color="#7ff4ff" stop-opacity="0.4"/>'
      + '<stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>'
    + '</radialGradient>'
    + '<radialGradient id="lg" cx="50%" cy="50%" r="50%">'
      + '<stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6"/>'
      + '<stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<rect width="900" height="310" fill="url(#sg)"/>'
    + stars
    // hedge layers
    + '<path d="M0,85 Q55,55 110,78 Q165,52 220,72 Q280,46 340,68 Q400,48 455,65 Q510,44 565,62 Q625,44 680,60 Q740,46 800,62 Q845,50 900,58 L900,148 L0,148 Z" fill="#031608" opacity="0.92"/>'
    + '<path d="M0,98 Q45,70 90,92 Q140,66 195,86 Q255,62 315,80 Q375,60 435,78 Q495,58 555,76 Q615,58 675,74 Q735,58 800,74 L900,78 L900,155 L0,155 Z" fill="#052e16" opacity="0.96"/>'
    + '<path d="M0,115 Q35,90 72,110 Q112,82 160,104 Q205,78 260,100 Q315,76 375,98 Q440,74 498,96 Q560,74 620,94 Q685,74 750,92 Q810,74 870,90 L900,92 L900,162 L0,162 Z" fill="#14532d"/>'
    + '<ellipse cx="115" cy="132" rx="60" ry="28" fill="#063016" opacity="0.7"/>'
    + '<ellipse cx="330" cy="129" rx="75" ry="32" fill="#063016" opacity="0.65"/>'
    + '<ellipse cx="570" cy="127" rx="70" ry="30" fill="#063016" opacity="0.6"/>'
    + '<ellipse cx="780" cy="130" rx="65" ry="29" fill="#063016" opacity="0.65"/>'
    // deck
    + '<rect x="0" y="157" width="900" height="153" fill="url(#dg)"/>'
    + planks + grain
    // pool rim + water
    + '<ellipse cx="460" cy="180" rx="218" ry="94" fill="rgba(200,230,255,0.12)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>'
    + '<ellipse cx="460" cy="180" rx="212" ry="88" fill="url(#pw)"/>'
    // underwater lights
    + '<ellipse cx="350" cy="188" rx="50" ry="27" fill="url(#uwl)" opacity="0.6"/>'
    + '<ellipse cx="575" cy="183" rx="42" ry="24" fill="url(#uwl)" opacity="0.52"/>'
    + '<ellipse cx="460" cy="177" rx="38" ry="20" fill="url(#uwl)" opacity="0.32"/>'
    // pool glow on deck
    + '<ellipse cx="460" cy="220" rx="240" ry="52" fill="url(#pg)"/>'
    + ripples
    + '<text x="460" y="192" text-anchor="middle" fill="rgba(255,255,255,0.13)" font-family="sans-serif" font-size="11" font-weight="700" letter-spacing="4">POOL</text>'
    // deck lamp left
    + '<rect x="135" y="95" width="6" height="62" fill="#8b7050" rx="2"/>'
    + '<ellipse cx="138" cy="95" rx="11" ry="5" fill="#e5c57a"/>'
    + '<ellipse cx="138" cy="97" rx="32" ry="28" fill="url(#lg)" opacity="0.5"/>'
    + '<ellipse cx="138" cy="162" rx="38" ry="12" fill="#fbbf24" opacity="0.07"/>'
    // deck lamp right
    + '<rect x="777" y="95" width="6" height="62" fill="#8b7050" rx="2"/>'
    + '<ellipse cx="780" cy="95" rx="11" ry="5" fill="#e5c57a"/>'
    + '<ellipse cx="780" cy="97" rx="32" ry="28" fill="url(#lg)" opacity="0.5"/>'
    + '<ellipse cx="780" cy="162" rx="38" ry="12" fill="#fbbf24" opacity="0.07"/>'
    // palm tree
    + '<path d="M68,157 Q63,125 66,93 Q68,64 64,42" stroke="#4a3020" stroke-width="9" fill="none" stroke-linecap="round"/>'
    + '<path d="M64,42 Q22,28 -8,48" stroke="#166534" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    + '<path d="M64,42 Q42,22 56,-4" stroke="#166534" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    + '<path d="M64,42 Q86,22 74,-4" stroke="#166534" stroke-width="4" fill="none" stroke-linecap="round"/>'
    + '<path d="M64,42 Q106,30 132,50" stroke="#166534" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    + '<path d="M64,42 Q12,42 -16,62" stroke="#15803d" stroke-width="3" fill="none" stroke-linecap="round"/>'
    + '<path d="M64,42 Q116,44 140,66" stroke="#15803d" stroke-width="3" fill="none" stroke-linecap="round"/>'
    // deck chairs
    + '<g opacity="0.55"><rect x="238" y="212" width="48" height="19" rx="3" fill="#6b4c28"/><rect x="238" y="212" width="48" height="5" rx="2" fill="#8b6338"/><rect x="243" y="229" width="7" height="12" rx="2" fill="#4a3018"/><rect x="274" y="229" width="7" height="12" rx="2" fill="#4a3018"/></g>'
    + '<g opacity="0.48"><rect x="600" y="216" width="42" height="17" rx="3" fill="#6b4c28"/><rect x="600" y="216" width="42" height="4" rx="2" fill="#8b6338"/><rect x="604" y="231" width="6" height="10" rx="2" fill="#4a3018"/><rect x="630" y="231" width="6" height="10" rx="2" fill="#4a3018"/></g>'
    + '</svg>';
}

// ── Tech SVG ─────────────────────────────────────────────────────────────────
function buildTechSvg(running, warning, powerStr, freqStr) {
  var pc  = running ? '#22d3ee' : (warning ? '#ef4444' : '#475569');
  var pg  = running ? '0.35' : '0';
  var stx = running ? 'LÄUFT' : (warning ? 'WARNUNG' : 'STOP');
  var impStyle = running
    ? 'style="animation:spin 0.9s linear infinite;transform-origin:52px 88px;transform-box:fill-box"'
    : '';
  var flowArrows = running
    ? '<polygon points="133,117 143,121 133,125" fill="#22d3ee" opacity="0.7"/>'
      + '<polygon points="208,117 218,121 208,125" fill="#22d3ee" opacity="0.6"/>'
    : '';
  var pw_str = powerStr
    ? '<text x="20" y="184" fill="#3d5068" font-family="monospace" font-size="7.5">LEISTUNG</text>'
      + '<text x="20" y="200" fill="' + (running ? '#f59e0b' : '#475569') + '" font-family="monospace" font-size="13" font-weight="700">' + powerStr + '</text>'
    : '<text x="20" y="193" fill="#2d3f55" font-family="monospace" font-size="8">LEISTUNG  –</text>';
  var fq_str = freqStr
    ? '<text x="175" y="184" fill="#3d5068" font-family="monospace" font-size="7.5">FREQUENZ</text>'
      + '<text x="175" y="200" fill="' + (running ? '#22d3ee' : '#475569') + '" font-family="monospace" font-size="13" font-weight="700">' + freqStr + '</text>'
    : '<text x="175" y="193" fill="#2d3f55" font-family="monospace" font-size="8">FREQUENZ  –</text>';

  var dFillLvlPh  = running ? 62 : 68;
  var dFillHPh    = running ? 37 : 31;
  var dFillLvlCl  = running ? 60 : 66;
  var dFillHCl    = running ? 39 : 33;

  return '<svg viewBox="0 0 320 225" xmlns="http://www.w3.org/2000/svg">'
    + '<defs>'
    + '<radialGradient id="tpg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="' + pc + '" stop-opacity="' + pg + '"/><stop offset="100%" stop-color="' + pc + '" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="cg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1a2535"/><stop offset="50%" stop-color="#243044"/><stop offset="100%" stop-color="#1a2535"/></linearGradient>'
    + '</defs>'
    + '<rect width="320" height="225" fill="rgba(0,0,0,0.08)" rx="8"/>'
    // PUMP
    + '<ellipse cx="52" cy="88" rx="52" ry="52" fill="url(#tpg)"/>'
    + '<circle cx="52" cy="88" r="38" fill="#131f2e" stroke="' + pc + '" stroke-width="' + (running ? '1.8' : '1') + '" opacity="' + (running ? '1' : '0.65') + '"/>'
    + '<circle cx="52" cy="88" r="26" fill="#0a1422" stroke="#1e2d3d" stroke-width="1"/>'
    + '<g ' + impStyle + '>'
    + '<line x1="52" y1="64" x2="52" y2="88" stroke="' + pc + '" stroke-width="3" stroke-linecap="round" opacity="0.9"/>'
    + '<line x1="52" y1="88" x2="68" y2="99" stroke="' + pc + '" stroke-width="3" stroke-linecap="round" opacity="0.9"/>'
    + '<line x1="52" y1="88" x2="36" y2="99" stroke="' + pc + '" stroke-width="3" stroke-linecap="round" opacity="0.9"/>'
    + '<circle cx="52" cy="88" r="6" fill="' + pc + '" opacity="0.95"/>'
    + '</g>'
    + '<rect x="90" y="84" width="16" height="8" rx="2" fill="#1e2d3d" stroke="#334155" stroke-width="0.5"/>'
    + '<rect x="-2" y="84" width="16" height="8" rx="2" fill="#1e2d3d" stroke="#334155" stroke-width="0.5" transform="translate(48,0)"/>'
    + '<circle cx="52" cy="50" r="5" fill="' + pc + '" opacity="0.9"/>'
    + '<circle cx="52" cy="50" r="9" fill="' + pc + '" opacity="' + (running ? '0.28' : '0.08') + '"/>'
    + '<text x="52" y="142" text-anchor="middle" fill="#3d5068" font-family="sans-serif" font-size="8.5" font-weight="700" letter-spacing="1">POOLPUMPE</text>'
    + '<text x="52" y="153" text-anchor="middle" fill="' + pc + '" font-family="sans-serif" font-size="7.5" font-weight="700">' + stx + '</text>'
    // SAND FILTER
    + '<rect x="128" y="28" width="48" height="98" rx="8" fill="url(#cg)" stroke="#2d3d50" stroke-width="1"/>'
    + '<ellipse cx="152" cy="28" rx="24" ry="11" fill="#1e2d3d" stroke="#2d3d50" stroke-width="1"/>'
    + '<ellipse cx="152" cy="126" rx="24" ry="9" fill="#14202e" stroke="#2d3d50" stroke-width="1"/>'
    + '<circle cx="152" cy="50" r="13" fill="#0a1422" stroke="#3d5068" stroke-width="1"/>'
    + '<circle cx="152" cy="50" r="10" fill="#070e18"/>'
    + '<line x1="152" y1="50" x2="' + (running ? '158' : '155') + '" y2="' + (running ? '43' : '45') + '" stroke="' + (running ? '#22d3ee' : '#3d5068') + '" stroke-width="2" stroke-linecap="round"/>'
    + '<rect x="133" y="72" width="38" height="42" rx="3" fill="#162415" opacity="0.9"/>'
    + '<rect x="134" y="73" width="36" height="12" rx="2" fill="#1f3b18" opacity="0.8"/>'
    + '<rect x="138" y="17" width="8" height="14" rx="2" fill="#1e2d3d"/>'
    + '<rect x="158" y="17" width="8" height="14" rx="2" fill="#1e2d3d"/>'
    + '<rect x="131" y="124" width="8" height="10" rx="2" fill="#1e2d3d"/>'
    + '<rect x="165" y="124" width="8" height="10" rx="2" fill="#1e2d3d"/>'
    + '<circle cx="166" cy="32" r="4" fill="' + (running ? '#22d3ee' : '#1e2d3d') + '" opacity="0.9"/>'
    + '<text x="152" y="150" text-anchor="middle" fill="#3d5068" font-family="sans-serif" font-size="8.5" font-weight="700" letter-spacing="1">SANDFILTER</text>'
    // DOSING
    + '<rect x="224" y="28" width="26" height="74" rx="5" fill="#162238" stroke="#1d4ed8" stroke-width="1"/>'
    + '<rect x="228" y="18" width="18" height="14" rx="3" fill="#162238" stroke="#1d4ed8" stroke-width="1"/>'
    + '<rect x="232" y="10" width="10" height="11" rx="2" fill="#2563eb"/>'
    + '<rect x="226" y="' + dFillLvlPh + '" width="20" height="' + dFillHPh + '" rx="3" fill="#1d4ed8" opacity="0.45"/>'
    + '<text x="237" y="75" text-anchor="middle" fill="#93c5fd" font-family="sans-serif" font-size="8.5" font-weight="700">pH</text>'
    + '<text x="237" y="86" text-anchor="middle" fill="#60a5fa" font-family="sans-serif" font-size="6.5">Minus</text>'
    + '<rect x="258" y="28" width="26" height="74" rx="5" fill="#2a1010" stroke="#dc2626" stroke-width="1"/>'
    + '<rect x="262" y="18" width="18" height="14" rx="3" fill="#2a1010" stroke="#dc2626" stroke-width="1"/>'
    + '<rect x="266" y="10" width="10" height="11" rx="2" fill="#ef4444"/>'
    + '<rect x="260" y="' + dFillLvlCl + '" width="20" height="' + dFillHCl + '" rx="3" fill="#ef4444" opacity="0.38"/>'
    + '<text x="271" y="75" text-anchor="middle" fill="#fca5a5" font-family="sans-serif" font-size="8.5" font-weight="700">Cl</text>'
    + '<text x="271" y="86" text-anchor="middle" fill="#f87171" font-family="sans-serif" font-size="6.5">Redox</text>'
    + '<rect x="222" y="108" width="64" height="20" rx="4" fill="#0f1c2e" stroke="#1e2d3d" stroke-width="1"/>'
    + '<circle cx="236" cy="118" r="6" fill="#0a1422" stroke="#334155" stroke-width="1"/>'
    + '<circle cx="260" cy="118" r="6" fill="#0a1422" stroke="#334155" stroke-width="1"/>'
    + '<circle cx="248" cy="118" r="5" fill="' + (running ? '#22d3ee' : '#1e2d3d') + '" opacity="0.85"/>'
    + '<text x="254" y="150" text-anchor="middle" fill="#3d5068" font-family="sans-serif" font-size="8.5" font-weight="700" letter-spacing="1">DOSIERUNG</text>'
    // Pipes
    + '<path d="M106,121 L130,121" stroke="#1e2d3d" stroke-width="5" stroke-linecap="round"/>'
    + '<path d="M106,118 L130,118" stroke="#334155" stroke-width="1.5"/>'
    + '<path d="M176,121 L220,121" stroke="#1e2d3d" stroke-width="5" stroke-linecap="round"/>'
    + '<path d="M176,118 L220,118" stroke="#334155" stroke-width="1.5"/>'
    + flowArrows
    // Bottom bar
    + '<rect x="8" y="170" width="304" height="45" rx="6" fill="rgba(0,0,0,.3)" stroke="rgba(255,255,255,.04)" stroke-width="1"/>'
    + pw_str + fq_str
    + '</svg>';
}

// ── Card class ────────────────────────────────────────────────────────────────
class PoolControlCenterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass   = null;
    this._config = { title: 'Pool Control Center' };
    this._E      = null;
    LOG.info('Card created', 'v' + CARD_VERSION);
  }

  static getStubConfig() { return { title: 'Pool Control Center' }; }

  setConfig(config) {
    this._config = Object.assign({ title: 'Pool Control Center' }, config);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._E) this._resolveEntities();
    this._render();
  }

  _resolveEntities() {
    var st = this._hass && this._hass.states;
    if (!st) return;

    var resolved = Object.assign({}, ENTITY_DEFAULTS);

    var keys = Object.keys(ENTITY_FALLBACKS);
    for (var ki = 0; ki < keys.length; ki++) {
      var key = keys[ki];
      if (!st[resolved[key]]) {
        var alts = ENTITY_FALLBACKS[key];
        for (var ai = 0; ai < alts.length; ai++) {
          if (st[alts[ai]]) {
            LOG.debug('Entity remapped:', key, '->', alts[ai]);
            resolved[key] = alts[ai];
            break;
          }
        }
      }
    }

    this._E = resolved;

    var entryKeys = Object.keys(resolved);
    var found   = entryKeys.filter(function(k) { return !!st[resolved[k]]; }).map(function(k) { return resolved[k]; });
    var missing  = entryKeys.filter(function(k) { return !st[resolved[k]]; }).map(function(k) { return resolved[k]; });
    LOG.debug('Entities found (' + found.length + '):', found);
    if (missing.length) LOG.debug('Entities not yet in HA states (' + missing.length + '):', missing);
  }

  _s(id)     { return (this._hass && this._hass.states && this._hass.states[id]) || null; }
  _isOn(id)  { var s = this._s(id); return s ? s.state === 'on' : false; }
  _unit(id)  { var s = this._s(id); return (s && s.attributes && s.attributes.unit_of_measurement) || ''; }

  _val(id, fb) {
    if (fb === undefined) fb = '–';
    var s = this._s(id);
    if (!s || s.state === 'unavailable' || s.state === 'unknown' || s.state === 'none') return fb;
    return s.state;
  }

  _num(id, dec, fb) {
    if (dec === undefined) dec = 1;
    if (fb  === undefined) fb  = '–';
    var v = this._val(id, null);
    if (v === null) return fb;
    var n = parseFloat(v);
    return isNaN(n) ? fb : n.toFixed(dec);
  }

  _fmtH(raw) {
    if (raw === null || raw === undefined || raw === '–') return '–';
    var h = parseFloat(raw);
    if (isNaN(h)) return '–';
    if (h < 0.1)  return Math.round(h * 60) + ' min';
    return h.toFixed(1) + ' h';
  }

  _fmtTime(entityId) {
    var s = this._s(entityId);
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return '–';
    try {
      var d   = new Date(s.state);
      var now = new Date();
      var t   = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      return d.toDateString() === now.toDateString() ? 'Heute, ' + t : t;
    } catch (_) { return s.state; }
  }

  _svc(domain, service, data) {
    if (!this._hass) { LOG.warn('callService skipped – hass not ready'); return; }
    LOG.debug('callService:', domain + '.' + service, data);
    var p = this._hass.callService(domain, service, data);
    if (p && typeof p.then === 'function') {
      p.then(null, function(err) { LOG.warn('Service call FAILED:', domain + '.' + service, err); });
    }
  }

  _render() {
    if (!this._hass || !this._E) return;

    var E = this._E;

    var running  = this._isOn(E.running);
    var warning  = this._isOn(E.warning);
    var autoOn   = this._isOn(E.automation);
    var status   = this._val(E.status, 'unknown');
    var season   = this._val(E.seasonMode, 'auto');
    var sColor   = STATUS_COLOR[status]  || '#64748b';
    var sLabel   = STATUS_LABEL[status]  || status;
    var seaColor = SEASON_COLOR[season]  || '#94a3b8';
    var seaIcon  = SEASON_ICON[season]   || '🔄';
    var seaLabel = SEASON_LABEL[season]  || season;

    var powerStr = this._num(E.power, 0) !== '–'
      ? this._num(E.power, 0) + ' ' + (this._unit(E.power) || 'W') : null;
    var freqStr  = this._num(E.frequency, 0) !== '–'
      ? this._num(E.frequency, 0) + ' ' + (this._unit(E.frequency) || 'Hz') : null;

    var effRaw = parseFloat(this._val(E.efficiency, '0'));
    var effPct = isNaN(effRaw) ? 0 : Math.min(100, Math.max(0, effRaw));

    var todayRaw  = this._val(E.runtimeToday, null);
    var targetRaw = this._val(E.target, null);
    var progPct   = 0;
    if (todayRaw && targetRaw) {
      var t = parseFloat(todayRaw), r = parseFloat(targetRaw);
      if (!isNaN(t) && !isNaN(r) && r > 0) progPct = Math.min(100, (t / r) * 100);
    }

    var phVal    = this._val(E.ph, null);
    var redoxVal = this._val(E.redox, null);
    var tempVal  = this._val(E.temperature, null);

    var pv = function(icon, label, value, unit) {
      var u = unit || '';
      var valHtml = (value === null || value === undefined || value === '–' || value === '')
        ? '<span class="not-cfg">Nicht konfiguriert</span>'
        : '<span class="prow-value">' + value + (u ? '<span style="font-size:.68em;color:#475569;margin-left:2px">' + u + '</span>' : '') + '</span>';
      return '<div class="prow"><span class="prow-label">' + icon + ' ' + label + '</span>' + valHtml + '</div>';
    };

    var seasonBtns = SEASON_MODES.map(function(m) {
      var active = (season === m) ? ' active' : '';
      return '<button class="sbtn' + active + '" data-season="' + m + '">' + SEASON_ICON[m] + '<br>' + SEASON_LABEL[m] + '</button>';
    }).join('');

    var pulseDotSpan = running
      ? ' <span class="pulse-dot" style="display:inline-block;vertical-align:middle;margin-left:3px;width:7px;height:7px"></span>'
      : '';

    this.shadowRoot.innerHTML = '<style>' + CSS + '</style>'
      + '<div class="pcc">'

      // HEADER
      + '<div class="pcc-header">'
      + '<div class="pcc-title">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M2 12c1.5-3 4-4.5 6-4.5s4.5 1.5 6 1.5 4.5-1.5 6-1.5"/>'
      + '<path d="M2 17c1.5-3 4-4.5 6-4.5s4.5 1.5 6 1.5 4.5-1.5 6-1.5"/>'
      + '</svg>'
      + (this._config.title || 'Pool Control Center')
      + '</div>'
      + '<div class="badge ' + (autoOn ? 'badge-auto-on' : 'badge-auto-off') + '" id="btn-auto-badge" title="Automatikmodus umschalten">'
      + '<div class="pulse-dot' + (autoOn ? '' : ' off') + '"></div>'
      + 'Automatik ' + (autoOn ? 'EIN' : 'AUS')
      + '</div>'
      + '<div class="badge badge-season" id="btn-season-badge" title="Saison wechseln" style="border-color:' + seaColor + '44;color:' + seaColor + '">'
      + seaIcon + ' ' + seaLabel
      + '</div>'
      + '<div class="version-label">v' + CARD_VERSION + '</div>'
      + '</div>'

      // WARNING
      + (warning ? '<div class="warn">⚠️ Pumpe aktiv – Leistungsaufnahme unter 100 W. Pumpe und Verkabelung prüfen!</div>' : '')

      // MAIN ROW
      + '<div class="main-row">'
      + '<div class="pool-area">' + buildPoolSvg(running) + '</div>'
      + '<div class="tech-area">'
      + '<div class="tech-title">≡ Technik</div>'
      + '<div class="tech-svg-wrap">' + buildTechSvg(running, warning, powerStr, freqStr) + '</div>'
      + '<div class="tech-status">'
      + '<span class="tech-status-label" style="color:' + (running ? '#22d3ee' : (warning ? '#ef4444' : '#475569')) + '">'
      + (running ? '▶ Laufend' : (warning ? '⚠ Warnung' : '■ Gestoppt'))
      + '</span>'
      + '<span class="tech-vals">'
      + (powerStr ? '<span>' + powerStr + '</span>' : '')
      + (freqStr  ? '<span>' + freqStr  + '</span>' : '')
      + '</span>'
      + '</div></div></div>'

      // STATUS TILES
      + '<div class="tiles-row">'
      + '<div class="tile"><div class="tile-header">⏻ Status</div>'
      + '<div class="tile-value" style="color:' + sColor + ';font-size:1rem">' + sLabel + pulseDotSpan + '</div></div>'

      + '<div class="tile"><div class="tile-header">⚡ Leistung</div>'
      + '<div class="tile-value">' + this._num(E.power, 0) + '<span class="tile-unit"> ' + (this._unit(E.power) || 'W') + '</span></div></div>'

      + '<div class="tile"><div class="tile-header">〜 Spannung</div>'
      + '<div class="tile-value">' + this._num(E.voltage, 0) + '<span class="tile-unit"> ' + (this._unit(E.voltage) || 'V') + '</span></div></div>'

      + '<div class="tile"><div class="tile-header">〜 Strom</div>'
      + '<div class="tile-value">' + this._num(E.current, 1) + '<span class="tile-unit"> ' + (this._unit(E.current) || 'A') + '</span></div></div>'

      + '<div class="tile"><div class="tile-header">〜 Frequenz</div>'
      + '<div class="tile-value">' + this._num(E.frequency, 0) + '<span class="tile-unit"> ' + (this._unit(E.frequency) || 'Hz') + '</span></div></div>'

      + '<div class="tile"><div class="tile-header">🌿 Effizienz</div>'
      + '<div class="tile-value" style="color:#4ade80">' + this._num(E.efficiency, 0) + '<span class="tile-unit"> %</span></div></div>'

      + '<div class="tile"><div class="tile-header">≡ Energie</div>'
      + '<div class="tile-value">' + this._num(E.energy, 2) + '<span class="tile-unit"> ' + (this._unit(E.energy) || 'kWh') + '</span></div></div>'
      + '</div>'

      // PROGRESS BAR
      + '<div class="prog-wrap"><div class="prog-fill" style="width:' + progPct.toFixed(1) + '%"></div></div>'

      // PANELS
      + '<div class="panels-row">'

      // 1: Laufzeiten
      + '<div class="panel"><div class="panel-title">Laufzeiten</div>'
      + pv('🕐', 'Heute', this._fmtH(todayRaw))
      + pv('🎯', 'Tagesziel', this._fmtH(targetRaw))
      + pv('⏳', 'Verbleibend', this._fmtH(this._val(E.remaining, null)))
      + pv('📅', 'Nächster Start', this._fmtTime(E.nextStart))
      + pv('📊', 'Gesamt', this._fmtH(this._val(E.totalRuntime, null)))
      + '</div>'

      // 2: Saison
      + '<div class="panel"><div class="panel-title">Saisonmodus</div>'
      + '<div class="season-grid">' + seasonBtns + '</div>'
      + pv('📅', 'Saison LZ', this._fmtH(this._val(E.seasonRuntime, null)))
      + '</div>'

      // 3: Wasserqualität
      + '<div class="panel"><div class="panel-title">Wasserqualität</div>'
      + pv('🌡', 'Temperatur', tempVal !== null ? this._num(E.temperature, 1) : null, this._unit(E.temperature) || '°C')
      + pv('🧪', 'pH-Wert', phVal)
      + pv('⚡', 'Redox', redoxVal !== null ? this._num(E.redox, 0) : null, this._unit(E.redox) || 'mV')
      + '</div>'

      // 4: Wartung
      + '<div class="panel"><div class="panel-title">Wartung</div>'
      + pv('🔧', 'Seit Wartung', this._fmtH(this._val(E.maintenance, null)))
      + '<div style="margin-top:10px;display:flex;flex-direction:column;gap:5px">'
      + '<button class="mbtn" id="btn-maint">🔧 Wartung Reset</button>'
      + '<button class="mbtn" id="btn-season-reset">📅 Saison Reset</button>'
      + '</div></div>'

      // 5: Steuerung
      + '<div class="panel"><div class="panel-title">Steuerung</div>'
      + '<div class="ctrl-toggle" id="btn-auto-toggle">'
      + '<span class="ctrl-label' + (autoOn ? ' on' : '') + '">Automatik</span>'
      + '<div class="toggle-track' + (autoOn ? ' on' : '') + '"><div class="toggle-thumb"></div></div>'
      + '</div>'
      + '<button class="cbtn cbtn-start" id="btn-start">▶ Start</button>'
      + '<button class="cbtn cbtn-stop"  id="btn-stop">■ Stop</button>'
      + '</div>'

      + '</div>' // panels-row

      // NAV FOOTER
      + '<div class="nav-footer">'
      + '<div class="nav-tab active">Dashboard</div>'
      + '<div class="nav-tab">Verlauf</div>'
      + '<div class="nav-tab">Saison</div>'
      + '<div class="nav-tab">Wartung</div>'
      + '<div class="nav-tab">Qualität</div>'
      + '<div class="nav-tab">Einst.</div>'
      + '</div>'

      + '</div>'; // pcc

    this._attach();
  }

  _attach() {
    var root = this.shadowRoot;
    var self = this;
    var E    = this._E;

    var $ = function(id) { return root.getElementById(id); };

    var fx = function(el) {
      if (!el) return;
      el.classList.remove('fx');
      void el.offsetWidth;
      el.classList.add('fx');
    };

    var toggleAuto = function() {
      var isOn = self._isOn(E.automation);
      LOG.debug('Automatik toggle – aktuell:', isOn ? 'EIN' : 'AUS');
      self._svc('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: E.automation });
    };

    var badge = $('btn-auto-badge');
    var tog   = $('btn-auto-toggle');
    if (badge) badge.addEventListener('click', toggleAuto);
    if (tog)   tog.addEventListener('click', function() { fx(tog); toggleAuto(); });

    var bStart = $('btn-start');
    var bStop  = $('btn-stop');
    if (bStart) bStart.addEventListener('click', function() {
      fx(bStart);
      LOG.debug('Start geklickt');
      self._svc('pool_pump_manager', 'start_now', {});
    });
    if (bStop) bStop.addEventListener('click', function() {
      fx(bStop);
      LOG.debug('Stop geklickt');
      self._svc('pool_pump_manager', 'stop_now', {});
    });

    var bMaint = $('btn-maint');
    var bSeaR  = $('btn-season-reset');
    if (bMaint) bMaint.addEventListener('click', function() {
      fx(bMaint);
      LOG.debug('Wartung Reset geklickt');
      self._svc('button', 'press', { entity_id: E.btnMaint });
    });
    if (bSeaR) bSeaR.addEventListener('click', function() {
      fx(bSeaR);
      LOG.debug('Saison Reset geklickt');
      self._svc('button', 'press', { entity_id: E.btnSeason });
    });

    var cycleSeason = function() {
      var cur  = self._val(E.seasonMode, 'auto');
      var next = SEASON_MODES[(SEASON_MODES.indexOf(cur) + 1) % SEASON_MODES.length];
      LOG.debug('Saison cycle:', cur, '->', next);
      self._svc('select', 'select_option', { entity_id: E.seasonMode, option: next });
    };

    var seaBadge = $('btn-season-badge');
    if (seaBadge) seaBadge.addEventListener('click', cycleSeason);

    root.querySelectorAll('.sbtn[data-season]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var opt = this.getAttribute('data-season');
        LOG.debug('Saison direkt gewählt:', opt);
        self._svc('select', 'select_option', { entity_id: E.seasonMode, option: opt });
      });
    });
  }

  getCardSize() { return 10; }
}

// ── Registration ─────────────────────────────────────────────────────────────
if (!customElements.get('pool-control-center-card')) {
  customElements.define('pool-control-center-card', PoolControlCenterCard);
  console.info(
    '%c POOL CONTROL CENTER %c v' + CARD_VERSION + ' ',
    'color:#fff;background:#0369a1;padding:2px 5px;border-radius:3px 0 0 3px;font-weight:700',
    'color:#0369a1;background:#e0f2fe;padding:2px 5px;border-radius:0 3px 3px 0'
  );
}

window.customCards = window.customCards || [];
if (!window.customCards.find(function(c) { return c.type === 'pool-control-center-card'; })) {
  window.customCards.push({
    type: 'pool-control-center-card',
    name: 'Pool Control Center',
    description: 'Pool Pump Manager – Professional Dark-Glass Dashboard v' + CARD_VERSION,
    preview: false,
    documentationURL: 'https://github.com/choell401780/homeassistant-pool-pump-manager',
  });
}
