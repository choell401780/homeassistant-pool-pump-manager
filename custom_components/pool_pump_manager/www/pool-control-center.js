/**
 * Pool Control Center – Custom Lovelace Card
 * Pool Pump Manager v0.3.1
 * Glassmorphism Dark Design | Dynamic HA Entity Binding
 */

const CARD_VERSION = '0.3.1';

// ── Entity ID definitions ────────────────────────────────────────────────────
const E = {
  automation:      'switch.pool_pump_manager_automation_enabled',
  running:         'binary_sensor.pool_pump_manager_running',
  warning:         'binary_sensor.pool_pump_manager_warning',
  status:          'sensor.pool_pump_manager_status',
  power:           'sensor.pool_pump_manager_power',
  energy:          'sensor.pool_pump_manager_energy',
  voltage:         'sensor.pool_pump_manager_voltage',
  current:         'sensor.pool_pump_manager_current',
  frequency:       'sensor.pool_pump_manager_frequency',
  runtimeToday:    'sensor.pool_pump_manager_runtime_today',
  remaining:       'sensor.pool_pump_manager_remaining_runtime',
  target:          'sensor.pool_pump_manager_target_runtime',
  efficiency:      'sensor.pool_pump_manager_efficiency',
  nextStart:       'sensor.pool_pump_manager_next_start',
  totalRuntime:    'sensor.pool_pump_manager_total_runtime',
  seasonRuntime:   'sensor.pool_pump_manager_season_runtime',
  maintenance:     'sensor.pool_pump_manager_runtime_since_maintenance',
  seasonMode:      'select.pool_pump_manager_season_mode',
  ph:              'sensor.pool_pump_manager_ph',
  redox:           'sensor.pool_pump_manager_redox',
  temperature:     'sensor.pool_pump_manager_pool_temperature',
  btnMaintenance:  'button.pool_pump_manager_reset_maintenance',
  btnSeason:       'button.pool_pump_manager_reset_season',
};

const SEASON_ICONS = { auto: '🔄', spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_LABELS_DE = { auto: 'Automatisch', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter' };
const STATUS_COLORS = { running: '#22d3ee', waiting: '#a78bfa', scheduled: '#60a5fa', completed: '#4ade80', manual: '#f59e0b', unknown: '#94a3b8' };

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  :host { display: block; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pcc {
    background: linear-gradient(135deg, #0d1b2a 0%, #1a2744 50%, #0d1b2a 100%);
    border-radius: 16px;
    padding: 16px;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    color: #e2e8f0;
    overflow: hidden;
    position: relative;
  }

  /* Glass card base */
  .glass {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .header-title {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .header-title svg { width: 22px; height: 22px; }
  .season-badge {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(34,211,238,0.15);
    border: 1px solid rgba(34,211,238,0.3);
    color: #67e8f9;
    cursor: pointer;
  }

  /* ── Pool SVG area ── */
  .pool-area {
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
    position: relative;
    height: 200px;
  }
  .pool-area svg {
    width: 100%; height: 100%;
    display: block;
  }
  .pool-overlay {
    position: absolute; top: 8px; left: 8px;
    display: flex; gap: 6px;
  }
  .pool-status-badge {
    padding: 3px 9px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(0,0,0,0.5);
  }
  .pool-overlay-right {
    position: absolute; top: 8px; right: 8px;
  }

  /* ── Status tiles ── */
  .tiles-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 10px;
  }
  @media (max-width: 480px) {
    .tiles-row { grid-template-columns: repeat(2, 1fr); }
  }
  .tile {
    padding: 10px 8px;
    text-align: center;
    border-radius: 10px;
  }
  .tile-icon { font-size: 1.3rem; line-height: 1; margin-bottom: 3px; }
  .tile-value { font-size: 1.0rem; font-weight: 700; line-height: 1.1; }
  .tile-label { font-size: 0.62rem; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }

  /* ── Two column section ── */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  @media (max-width: 420px) { .two-col { grid-template-columns: 1fr; } }

  .data-card { padding: 10px 12px; border-radius: 10px; }
  .data-card-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #67e8f9;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .data-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.8rem;
  }
  .data-row:last-child { border-bottom: none; }
  .data-row-label { color: #94a3b8; display: flex; align-items: center; gap: 5px; }
  .data-row-value { font-weight: 600; color: #e2e8f0; }
  .not-cfg { color: #475569; font-style: italic; font-size: 0.72rem; }

  /* ── Runtime / maintenance ── */
  .maintenance-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .maint-tile { padding: 8px 6px; text-align: center; border-radius: 10px; }
  .maint-value { font-size: 0.9rem; font-weight: 700; }
  .maint-label { font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }

  /* ── Controls ── */
  .controls { display: flex; gap: 8px; flex-wrap: wrap; }
  .ctrl-btn {
    flex: 1; min-width: 80px;
    padding: 8px 6px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #e2e8f0;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 600;
    text-align: center;
    transition: all 0.15s ease;
    display: flex; align-items: center; justify-content: center; gap: 4px;
  }
  .ctrl-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(34,211,238,0.4); }
  .ctrl-btn.active { background: rgba(34,211,238,0.15); border-color: #22d3ee; color: #67e8f9; }
  .ctrl-btn.danger { border-color: rgba(248,113,113,0.3); }
  .ctrl-btn.danger:hover { background: rgba(248,113,113,0.15); border-color: #f87171; color: #fca5a5; }

  /* ── Warning banner ── */
  .warning-banner {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.4);
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 10px;
    font-size: 0.78rem;
    color: #fca5a5;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Pool ripple animation ── */
  @keyframes ripple {
    0%, 100% { opacity: 0.4; r: 50; }
    50% { opacity: 0.7; r: 56; }
  }
  .pool-ripple { animation: ripple 2s ease-in-out infinite; }

  /* ── Section divider ── */
  .section-title {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #475569;
    margin: 8px 0 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }
`;

// ── SVG Pool Scene ───────────────────────────────────────────────────────────
function buildPoolSvg(pumpRunning, hasWarning) {
  const waterColor = pumpRunning ? '#0ea5e9' : '#1e40af';
  const rippleClass = pumpRunning ? 'pool-ripple' : '';
  const pumpColor = pumpRunning ? '#22d3ee' : '#64748b';
  const warningGlow = hasWarning ? 'drop-shadow(0 0 6px #ef4444)' : '';

  return `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="garden" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#166534"/>
    </linearGradient>
    <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#92400e"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <radialGradient id="pool-water" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${pumpRunning ? '#38bdf8' : '#3b82f6'}"/>
      <stop offset="100%" stop-color="${waterColor}"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="pool-clip">
      <ellipse cx="300" cy="105" rx="165" ry="80"/>
    </clipPath>
  </defs>

  <!-- Garden background -->
  <rect width="600" height="200" fill="url(#garden)"/>

  <!-- Sky strip -->
  <rect width="600" height="40" fill="url(#sky)"/>

  <!-- Hedge top -->
  <ellipse cx="40" cy="45" rx="45" ry="28" fill="#15803d" opacity="0.9"/>
  <ellipse cx="100" cy="38" rx="50" ry="30" fill="#166534" opacity="0.95"/>
  <ellipse cx="165" cy="42" rx="40" ry="26" fill="#15803d"/>
  <ellipse cx="440" cy="40" rx="44" ry="27" fill="#15803d" opacity="0.9"/>
  <ellipse cx="505" cy="36" rx="52" ry="32" fill="#166534"/>
  <ellipse cx="568" cy="43" rx="40" ry="27" fill="#15803d"/>

  <!-- Wooden deck -->
  <rect x="90" y="70" width="420" height="110" rx="4" fill="url(#deck)" opacity="0.85"/>
  <!-- Deck planks -->
  ${Array.from({length: 7}, (_, i) =>
    `<line x1="90" y1="${82 + i * 15}" x2="510" y2="${82 + i * 15}" stroke="#6b3a0f" stroke-width="0.8" opacity="0.5"/>`
  ).join('')}

  <!-- Pool shadow -->
  <ellipse cx="303" cy="115" rx="168" ry="83" fill="rgba(0,0,0,0.25)"/>

  <!-- Pool water -->
  <ellipse cx="300" cy="105" rx="165" ry="80" fill="url(#pool-water)"/>

  <!-- Pool water surface lines (wave simulation) -->
  <g clip-path="url(#pool-clip)" opacity="${pumpRunning ? 0.35 : 0.15}">
    <ellipse cx="300" cy="90" rx="100" ry="12" fill="none" stroke="white" stroke-width="1"/>
    <ellipse cx="300" cy="108" rx="130" ry="15" fill="none" stroke="white" stroke-width="1"/>
    <ellipse cx="300" cy="126" rx="110" ry="10" fill="none" stroke="white" stroke-width="0.8"/>
  </g>

  <!-- Pool rim -->
  <ellipse cx="300" cy="105" rx="165" ry="80" fill="none" stroke="#e2e8f0" stroke-width="3" opacity="0.4"/>
  <ellipse cx="300" cy="105" rx="165" ry="80" fill="none" stroke="#67e8f9" stroke-width="1" opacity="${pumpRunning ? 0.7 : 0.2}"/>

  <!-- Pump ripple (when running) -->
  ${pumpRunning ? `<circle class="${rippleClass}" cx="300" cy="105" r="50" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.5"/>` : ''}
  ${pumpRunning ? `<circle cx="300" cy="105" r="30" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>` : ''}

  <!-- Palm tree (right) -->
  <rect x="510" y="60" width="8" height="80" rx="3" fill="#92400e"/>
  <!-- Fronds -->
  <path d="M514,65 Q540,50 555,35" stroke="#15803d" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M514,65 Q490,45 475,30" stroke="#16a34a" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M514,65 Q540,60 558,55" stroke="#15803d" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M514,65 Q488,62 470,58" stroke="#16a34a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M514,65 Q514,38 514,22" stroke="#166534" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Coconuts -->
  <circle cx="514" cy="67" r="5" fill="#92400e"/>
  <circle cx="510" cy="72" r="4" fill="#92400e" opacity="0.8"/>

  <!-- Equipment area (bottom left) -->
  <rect x="100" y="155" width="130" height="38" rx="6" fill="rgba(0,0,0,0.5)" stroke="rgba(100,116,139,0.4)" stroke-width="1"/>

  <!-- Pump icon -->
  <g transform="translate(118,165)" filter="${warningGlow}">
    <circle cx="0" cy="0" r="10" fill="${pumpColor}" opacity="0.9"/>
    <circle cx="0" cy="0" r="6" fill="rgba(0,0,0,0.3)"/>
    <line x1="-5" y1="0" x2="5" y2="0" stroke="white" stroke-width="1.5"/>
    <line x1="0" y1="-5" x2="0" y2="5" stroke="white" stroke-width="1.5"/>
    <text x="0" y="20" text-anchor="middle" fill="${pumpColor}" font-size="7" font-weight="600">PUMPE</text>
    ${pumpRunning ? `<circle cx="0" cy="0" r="13" fill="none" stroke="${pumpColor}" stroke-width="1.5" opacity="0.5" class="${rippleClass}"/>` : ''}
  </g>

  <!-- Sand filter icon -->
  <g transform="translate(163,162)">
    <ellipse cx="0" cy="-6" rx="9" ry="5" fill="#78716c" opacity="0.8"/>
    <rect x="-9" y="-6" width="18" height="18" rx="2" fill="#57534e" opacity="0.8"/>
    <ellipse cx="0" cy="12" rx="9" ry="5" fill="#78716c" opacity="0.8"/>
    <rect x="-3" y="12" width="6" height="6" rx="1" fill="#44403c" opacity="0.9"/>
    <text x="0" y="28" text-anchor="middle" fill="#a8a29e" font-size="7" font-weight="600">FILTER</text>
  </g>

  <!-- Dosing system icon -->
  <g transform="translate(205,163)">
    <rect x="-7" y="-8" width="14" height="20" rx="4" fill="#1d4ed8" opacity="0.8"/>
    <rect x="-4" y="-12" width="8" height="6" rx="2" fill="#2563eb" opacity="0.8"/>
    <circle cx="0" cy="5" r="3" fill="rgba(255,255,255,0.2)"/>
    <text x="0" y="22" text-anchor="middle" fill="#93c5fd" font-size="7" font-weight="600">DOSIER</text>
  </g>

  <!-- Version watermark -->
  <text x="590" y="196" text-anchor="end" fill="rgba(255,255,255,0.1)" font-size="8">PPM v${CARD_VERSION}</text>
</svg>`;
}

// ── Helper functions ─────────────────────────────────────────────────────────
function fmt(value, decimals = 1, fallback = '–') {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return fallback;
  return Number(value).toFixed(decimals);
}

function fmtH(hours) {
  if (hours === null || hours === undefined || hours === '') return '–';
  const h = parseFloat(hours);
  if (isNaN(h)) return '–';
  if (h < 0.1) return `${Math.round(h * 60)} min`;
  return `${h.toFixed(1)} h`;
}

// ── Card class ───────────────────────────────────────────────────────────────
class PoolControlCenterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._initialized = false;
  }

  static getStubConfig() {
    return { title: 'Pool Control Center' };
  }

  setConfig(config) {
    this._config = { title: 'Pool Control Center', ...config };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  // ── Entity accessors ──────────────────────────────────────────────────────

  _s(entityId) {
    return this._hass?.states?.[entityId] ?? null;
  }

  _val(entityId, fallback = '–') {
    const s = this._s(entityId);
    if (!s || ['unavailable', 'unknown', 'none'].includes(s.state)) return fallback;
    return s.state;
  }

  _isOn(entityId) {
    return this._s(entityId)?.state === 'on';
  }

  _numVal(entityId, decimals = 1, fallback = '–') {
    const v = this._val(entityId, null);
    if (v === null) return fallback;
    return fmt(v, decimals, fallback);
  }

  _unit(entityId) {
    return this._s(entityId)?.attributes?.unit_of_measurement ?? '';
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _render() {
    if (!this._hass) return;

    const pumpRunning = this._isOn(E.running);
    const hasWarning  = this._isOn(E.warning);
    const autoEnabled = this._isOn(E.automation);
    const status      = this._val(E.status, 'unknown');
    const season      = this._val(E.seasonMode, 'auto');
    const statusColor = STATUS_COLORS[status] ?? '#94a3b8';

    // Locale for next start
    let nextStartStr = '–';
    const ns = this._s(E.nextStart);
    if (ns && !['unavailable', 'unknown'].includes(ns.state)) {
      try {
        const d = new Date(ns.state);
        nextStartStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      } catch (_) { nextStartStr = ns.state; }
    }

    // Status label DE
    const statusLabels = { running: 'Läuft', waiting: 'Wartet', scheduled: 'Geplant', completed: 'Fertig', manual: 'Manuell', unknown: '–' };
    const statusLabel = statusLabels[status] ?? status;

    // Water quality
    const phVal   = this._val(E.ph, null);
    const redoxVal = this._val(E.redox, null);
    const tempVal  = this._val(E.temperature, null);

    const html = `
      <style>${CSS}</style>
      <div class="pcc">

        <!-- Header -->
        <div class="header">
          <div class="header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2">
              <path d="M2 12 C2 6.5 6.5 2 12 2 S22 6.5 22 12 17.5 22 12 22 2 17.5 2 12Z"/>
              <path d="M12 8 v8 M8 12 h8" stroke-width="1.5"/>
            </svg>
            ${this._config.title ?? 'Pool Control Center'}
          </div>
          <div class="season-badge" id="season-btn">
            ${SEASON_ICONS[season] ?? '🔄'}
            ${SEASON_LABELS_DE[season] ?? season}
          </div>
        </div>

        <!-- Warning banner -->
        ${hasWarning ? `
          <div class="warning-banner">
            ⚠️ Pumpe eingeschaltet, aber keine Leistungsaufnahme erkannt.
          </div>` : ''}

        <!-- Pool visualization -->
        <div class="pool-area glass">
          ${buildPoolSvg(pumpRunning, hasWarning)}
          <div class="pool-overlay">
            <div class="pool-status-badge" style="color:${statusColor}; border-color:${statusColor}40;">
              ${pumpRunning ? '▶' : '■'} ${statusLabel}
            </div>
            ${autoEnabled ? '<div class="pool-status-badge" style="color:#4ade80; border-color:#4ade8040;">🤖 AUTO</div>' : ''}
          </div>
          <div class="pool-overlay-right">
            <div class="pool-status-badge" style="color:#f59e0b; border-color:#f59e0b40;">
              ⚡ ${this._numVal(E.power, 0)} ${this._unit(E.power) || 'W'}
            </div>
          </div>
        </div>

        <!-- Status tiles -->
        <div class="tiles-row">
          <div class="tile glass">
            <div class="tile-icon">${pumpRunning ? '💧' : '⏸'}</div>
            <div class="tile-value" style="color:${statusColor}">${statusLabel}</div>
            <div class="tile-label">Status</div>
          </div>
          <div class="tile glass">
            <div class="tile-icon">⚡</div>
            <div class="tile-value">${this._numVal(E.power, 0)} <span style="font-size:0.65rem;color:#94a3b8">${this._unit(E.power) || 'W'}</span></div>
            <div class="tile-label">Leistung</div>
          </div>
          <div class="tile glass">
            <div class="tile-icon">⏱</div>
            <div class="tile-value">${fmtH(this._val(E.runtimeToday, null))}</div>
            <div class="tile-label">Laufzeit heute</div>
          </div>
          <div class="tile glass">
            <div class="tile-icon">📊</div>
            <div class="tile-value">${this._numVal(E.efficiency, 0)} <span style="font-size:0.65rem;color:#94a3b8">%</span></div>
            <div class="tile-label">Effizienz</div>
          </div>
        </div>

        <!-- Two columns: Metering + Water quality -->
        <div class="two-col">
          <!-- Metering -->
          <div class="data-card glass">
            <div class="data-card-title">⚡ Messwerte</div>
            ${this._dataRow('⚡', 'Leistung',   this._numVal(E.power,     0),  this._unit(E.power)     || 'W')}
            ${this._dataRow('🔌', 'Spannung',   this._numVal(E.voltage,   0),  this._unit(E.voltage)   || 'V')}
            ${this._dataRow('〰', 'Strom',      this._numVal(E.current,   2),  this._unit(E.current)   || 'A')}
            ${this._dataRow('📡', 'Frequenz',   this._numVal(E.frequency, 1),  this._unit(E.frequency) || 'Hz')}
            ${this._dataRow('🔋', 'Energie',    this._numVal(E.energy,    2),  this._unit(E.energy)    || 'kWh')}
          </div>

          <!-- Water quality -->
          <div class="data-card glass">
            <div class="data-card-title">💧 Wasserqualität</div>
            ${this._dataRow('🧪', 'pH-Wert',   phVal   ? fmt(phVal, 2) : null, 'pH')}
            ${this._dataRow('⚡', 'Redox',     redoxVal ? fmt(redoxVal, 0) : null, 'mV')}
            ${this._dataRow('🌡', 'Temperatur', tempVal  ? fmt(tempVal, 1) : null, '°C')}
            <div class="data-row" style="margin-top:6px">
              <span class="data-row-label" style="font-size:0.65rem; color:#334155">
                pH/Redox/Temp: Kommt in zukünftiger Version
              </span>
            </div>
          </div>
        </div>

        <!-- Runtime section -->
        <div class="section-title">⏱ Laufzeiten</div>
        <div class="two-col" style="margin-bottom:10px">
          <div class="data-card glass">
            <div class="data-card-title">📅 Heute</div>
            ${this._dataRow('▶', 'Laufzeit',   fmtH(this._val(E.runtimeToday, null)), '')}
            ${this._dataRow('🎯', 'Ziel',      fmtH(this._val(E.target, null)),        '')}
            ${this._dataRow('⏳', 'Restlaufzeit', fmtH(this._val(E.remaining, null)),  '')}
            ${this._dataRow('🕐', 'Nächster Start', nextStartStr, '')}
          </div>
          <div class="data-card glass">
            <div class="data-card-title">📈 Wartung</div>
            ${this._dataRow('♾', 'Gesamt',       fmtH(this._val(E.totalRuntime, null)), '')}
            ${this._dataRow('🍂', 'Saison',       fmtH(this._val(E.seasonRuntime, null)), '')}
            ${this._dataRow('🔧', 'Seit Wartung', fmtH(this._val(E.maintenance, null)),  '')}
          </div>
        </div>

        <!-- Controls -->
        <div class="section-title">🎛 Steuerung</div>
        <div class="controls">
          <button class="ctrl-btn ${autoEnabled ? 'active' : ''}" id="btn-auto">
            🤖 ${autoEnabled ? 'Auto EIN' : 'Auto AUS'}
          </button>
          <button class="ctrl-btn" id="btn-start">▶ Start</button>
          <button class="ctrl-btn" id="btn-stop">■ Stop</button>
          <button class="ctrl-btn danger" id="btn-maint">🔧 Wartung Reset</button>
          <button class="ctrl-btn danger" id="btn-season">🍂 Saison Reset</button>
        </div>

      </div>`;

    this.shadowRoot.innerHTML = html;
    this._attachListeners();
  }

  _dataRow(icon, label, value, unit) {
    const display = (value === null || value === undefined || value === '–' || value === '')
      ? `<span class="not-cfg">Nicht konfiguriert</span>`
      : `<span class="data-row-value">${value}${unit ? `<span style="font-size:0.7em;color:#94a3b8;margin-left:2px">${unit}</span>` : ''}</span>`;
    return `<div class="data-row">
      <span class="data-row-label">${icon} ${label}</span>
      ${display}
    </div>`;
  }

  _attachListeners() {
    const callService = (domain, service, entityId) => {
      this._hass.callService(domain, service, { entity_id: entityId });
    };

    const $ = (id) => this.shadowRoot.getElementById(id);

    $('btn-auto')?.addEventListener('click', () => {
      const isOn = this._isOn(E.automation);
      callService('switch', isOn ? 'turn_off' : 'turn_on', E.automation);
    });

    $('btn-start')?.addEventListener('click', () => {
      this._hass.callService('pool_pump_manager', 'start_now', {});
    });

    $('btn-stop')?.addEventListener('click', () => {
      this._hass.callService('pool_pump_manager', 'stop_now', {});
    });

    $('btn-maint')?.addEventListener('click', () => {
      this._hass.callService('button', 'press', { entity_id: E.btnMaintenance });
    });

    $('btn-season')?.addEventListener('click', () => {
      this._hass.callService('button', 'press', { entity_id: E.btnSeason });
    });

    $('season-btn')?.addEventListener('click', () => {
      // Cycle through season modes
      const modes = ['auto', 'spring', 'summer', 'autumn', 'winter'];
      const current = this._val(E.seasonMode, 'auto');
      const nextIdx = (modes.indexOf(current) + 1) % modes.length;
      this._hass.callService('select', 'select_option', {
        entity_id: E.seasonMode,
        option: modes[nextIdx],
      });
    });
  }

  getCardSize() { return 8; }
}

// ── Register ─────────────────────────────────────────────────────────────────
if (!customElements.get('pool-control-center-card')) {
  customElements.define('pool-control-center-card', PoolControlCenterCard);
  console.info(
    `%c POOL CONTROL CENTER %c v${CARD_VERSION} `,
    'color:#fff;background:#0284c7;padding:2px 4px;border-radius:3px 0 0 3px;font-weight:700',
    'color:#0284c7;background:#e2e8f0;padding:2px 4px;border-radius:0 3px 3px 0'
  );
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'pool-control-center-card',
  name: 'Pool Control Center',
  description: 'Intelligentes Pool-Management-Dashboard mit Glasdesign',
  preview: false,
  documentationURL: 'https://github.com/choell401780/homeassistant-pool-pump-manager',
});
