/**
 * Pool Control Center – Custom Lovelace Card
 * Pool Pump Manager v0.4.0
 * Professional Dark-Glass Dashboard | SVG Pool Scene | Dynamic HA Binding
 */

const CARD_VERSION = '0.4.0';

const E = {
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

const SEASON_LABEL = { auto: 'Auto', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter' };
const SEASON_ICON  = { auto: '🔄', spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_COLOR = { auto: '#94a3b8', spring: '#86efac', summer: '#fbbf24', autumn: '#fb923c', winter: '#93c5fd' };
const SEASON_MODES = ['auto', 'spring', 'summer', 'autumn', 'winter'];
const STATUS_LABEL = { running: 'Läuft', waiting: 'Wartet', scheduled: 'Geplant', completed: 'Fertig', manual: 'Manuell', unknown: '–' };
const STATUS_COLOR = { running: '#22d3ee', waiting: '#a78bfa', scheduled: '#60a5fa', completed: '#4ade80', manual: '#f59e0b', unknown: '#64748b' };

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
:host { display: block; }
* { box-sizing: border-box; margin: 0; padding: 0; }

.pcc {
  background: #080f1c;
  border-radius: 16px;
  overflow: hidden;
  font-family: var(--primary-font-family, 'Roboto', sans-serif);
  color: #e2e8f0;
  user-select: none;
}

/* ── Header ── */
.pcc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  background: rgba(255,255,255,0.025);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-wrap: wrap;
}
.pcc-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 700;
  flex: 1;
  min-width: 160px;
}
.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.badge-auto-on  { background: rgba(34,211,238,0.08); border-color: rgba(34,211,238,0.3); color: #22d3ee; }
.badge-auto-off { background: rgba(100,116,139,0.08); border-color: rgba(100,116,139,0.25); color: #64748b; }
.badge-season   { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.3); color: #fbbf24; }
.badge:hover    { filter: brightness(1.15); }
.version-label  { font-size: 0.62rem; color: #2d3f55; letter-spacing: 0.5px; margin-left: auto; }

.pulse-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
.pulse-dot.off { background: #374151; box-shadow: none; animation: none; }

/* ── Warning banner ── */
.warn {
  background: rgba(239,68,68,0.08);
  border-bottom: 1px solid rgba(239,68,68,0.25);
  padding: 6px 16px;
  font-size: 0.75rem;
  color: #fca5a5;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Main Row: Pool + Tech ── */
.main-row {
  display: grid;
  grid-template-columns: 3fr 2fr;
  min-height: 280px;
}
.pool-area {
  position: relative;
  overflow: hidden;
  background: #050d08;
  min-height: 260px;
}
.pool-area svg {
  width: 100%; height: 100%;
  display: block;
  min-height: 260px;
}
.tech-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(255,255,255,0.015);
  border-left: 1px solid rgba(255,255,255,0.06);
}
.tech-title {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #475569;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-weight: 600;
}
.tech-svg-wrap { flex: 1; }
.tech-svg-wrap svg { width: 100%; height: auto; display: block; }
.tech-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 9px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.3);
  font-size: 0.74rem;
  margin-top: 2px;
}
.ts-running { border-color: rgba(34,211,238,0.18); background: rgba(34,211,238,0.04); }
.ts-warn    { border-color: rgba(239,68,68,0.22); background: rgba(239,68,68,0.04); }
.tech-status-label { font-weight: 700; }
.tech-vals { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; color: #64748b; font-size: 0.68rem; }

/* ── Status Tiles ── */
.tiles-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.tile {
  padding: 13px 10px;
  border-right: 1px solid rgba(255,255,255,0.05);
}
.tile:last-child { border-right: none; }
.tile-header {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 5px;
}
.tile-value { font-size: 1.32rem; font-weight: 700; line-height: 1; }
.tile-unit  { font-size: 0.68rem; color: #64748b; font-weight: 400; margin-left: 1px; }
.tile-sub   { font-size: 0.6rem; color: #374151; margin-top: 2px; }

/* ── Panels Row ── */
.panels-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.panel {
  padding: 13px 11px;
  border-right: 1px solid rgba(255,255,255,0.05);
}
.panel:last-child { border-right: none; }
.panel-title {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #22d3ee;
  margin-bottom: 9px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}
.prow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 0.76rem;
}
.prow:last-of-type { border-bottom: none; }
.prow-label { color: #94a3b8; display: flex; align-items: center; gap: 4px; }
.prow-value { font-weight: 600; color: #e2e8f0; }
.not-cfg { color: #2d3f55; font-style: italic; font-size: 0.68rem; }

/* Progress bar */
.pbar-bg   { height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; margin-top: 9px; overflow: hidden; }
.pbar-fill { height: 100%; background: linear-gradient(90deg, #22d3ee, #4ade80); border-radius: 3px; transition: width 0.6s ease; }
.pbar-label { font-size: 0.63rem; color: #4ade80; text-align: right; margin-top: 2px; font-weight: 600; }

/* Season panel */
.season-display   { text-align: center; padding: 6px 0 3px; }
.season-sublabel  { font-size: 0.62rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
.season-name      { font-size: 1.75rem; font-weight: 800; line-height: 1.1; }
.season-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; padding: 7px; margin-top: 7px;
  border-radius: 8px;
  border: 1px solid rgba(34,211,238,0.2);
  background: rgba(34,211,238,0.05);
  color: #22d3ee;
  font-size: 0.7rem; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.season-btn:hover { background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.4); }

/* Water quality note */
.wq-note { font-size: 0.62rem; color: #2d3f55; text-align: center; margin-top: 7px; font-style: italic; }

/* Maintenance buttons */
.mbtn-row { display: flex; gap: 5px; margin-top: 8px; }
.mbtn {
  flex: 1; padding: 6px 3px;
  border-radius: 7px;
  border: 1px solid rgba(100,116,139,0.2);
  background: rgba(100,116,139,0.05);
  color: #94a3b8;
  cursor: pointer; font-size: 0.65rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 3px;
  transition: all 0.15s;
}
.mbtn:hover { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.35); color: #fbbf24; }

/* Control panel */
.ctrl-toggle {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 7px;
  cursor: pointer;
  transition: all 0.15s;
}
.ctrl-toggle:hover { background: rgba(255,255,255,0.07); }
.ctrl-toggle-label { font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.tog {
  width: 36px; height: 20px; border-radius: 10px;
  position: relative; transition: background 0.2s;
  flex-shrink: 0;
}
.tog.on  { background: #22d3ee; }
.tog.off { background: #1e293b; border: 1px solid #334155; }
.tog-thumb {
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff;
  position: absolute; top: 2px; left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.tog.on .tog-thumb { transform: translateX(16px); }
.cbtn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: 9px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.04);
  color: #e2e8f0;
  cursor: pointer; font-size: 0.8rem; font-weight: 600;
  margin-bottom: 5px;
  transition: all 0.15s;
}
.cbtn:last-child { margin-bottom: 0; }
.cbtn-start { border-color: rgba(74,222,128,0.28); color: #4ade80; }
.cbtn-stop  { border-color: rgba(248,113,113,0.28); color: #f87171; }
.cbtn-start:hover { background: rgba(74,222,128,0.1); border-color: #4ade80; }
.cbtn-stop:hover  { background: rgba(248,113,113,0.1); border-color: #f87171; }

/* ── Nav Footer ── */
.nav { display: flex; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.18); }
.ntab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 7px 3px;
  font-size: 0.58rem; color: #374151;
  cursor: pointer;
  border-right: 1px solid rgba(255,255,255,0.04);
  transition: color 0.15s;
  text-align: center;
}
.ntab:last-child { border-right: none; }
.ntab.active { color: #22d3ee; background: rgba(34,211,238,0.04); }
.ntab:hover:not(.active) { color: #64748b; }
.ntab-icon { font-size: 0.9rem; }

/* ── Animations ── */
@keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.72)} }
@keyframes ripple  { 0%{opacity:0.55;transform:scale(0.88)} 100%{opacity:0;transform:scale(1.45)} }
@keyframes shimmer { 0%,100%{opacity:0.22} 50%{opacity:0.52} }
@keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.pump-spin   { animation: spin 0.9s linear infinite; transform-box: fill-box; transform-origin: center; }
.water-ripple  { animation: ripple 2.5s ease-out infinite; }
.water-ripple2 { animation: ripple 2.5s ease-out infinite; animation-delay: -1.25s; }
.shimmer { animation: shimmer 3s ease-in-out infinite; }

/* ── Responsive ── */
@media(max-width:750px)  { .main-row{grid-template-columns:1fr} .tech-area{border-left:none;border-top:1px solid rgba(255,255,255,0.06)} }
@media(max-width:900px)  { .tiles-row{grid-template-columns:repeat(4,1fr)} }
@media(max-width:560px)  { .tiles-row{grid-template-columns:repeat(2,1fr)} }
@media(max-width:1000px) { .panels-row{grid-template-columns:repeat(3,1fr)} }
@media(max-width:640px)  { .panels-row{grid-template-columns:repeat(2,1fr)} }
@media(max-width:380px)  { .panels-row{grid-template-columns:1fr} }
`;

// ── Pool SVG ─────────────────────────────────────────────────────────────────
function buildPoolSvg(running) {
  const plankLines = Array.from({ length: 14 }, (_, i) => {
    const y = 118 + i * 13;
    const hw = Math.min(360, 20 + i * 25);
    return `<line x1="${415 - hw}" y1="${y}" x2="${415 + hw}" y2="${y}" stroke="#5a3413" stroke-width="1.3" opacity="0.55"/>`;
  }).join('');

  return `<svg viewBox="0 0 880 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#04080f"/>
    <stop offset="100%" stop-color="#071510"/>
  </linearGradient>
  <linearGradient id="bgGarden" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#071510"/>
    <stop offset="100%" stop-color="#030a06"/>
  </linearGradient>
  <linearGradient id="deckWood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#7c4a1c"/>
    <stop offset="55%" stop-color="#6b3f18"/>
    <stop offset="100%" stop-color="#5a3413"/>
  </linearGradient>
  <radialGradient id="poolWater" cx="45%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#1a90c8"/>
    <stop offset="45%" stop-color="#0e6ea8"/>
    <stop offset="100%" stop-color="#083c5a"/>
  </radialGradient>
  <radialGradient id="poolGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="deckLightGrad" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.65"/>
    <stop offset="55%" stop-color="#d97706" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#d97706" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="underwaterGrad" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85"/>
    <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0"/>
  </radialGradient>
  <filter id="fGlow"   x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="fGlowLg" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="fGlowSm" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="poolClip"><ellipse cx="415" cy="175" rx="235" ry="115"/></clipPath>
</defs>

<!-- Background -->
<rect width="880" height="320" fill="url(#bgGarden)"/>
<rect width="880" height="60" fill="url(#bgSky)"/>

<!-- Hedges backdrop -->
<ellipse cx="55"  cy="60" rx="110" ry="52" fill="#0d2e12"/>
<ellipse cx="175" cy="52" rx="125" ry="58" fill="#0a2510"/>
<ellipse cx="310" cy="58" rx="118" ry="54" fill="#0d2e12"/>
<ellipse cx="445" cy="50" rx="112" ry="56" fill="#0a2510"/>
<ellipse cx="578" cy="56" rx="120" ry="52" fill="#0d2e12"/>
<ellipse cx="712" cy="51" rx="128" ry="57" fill="#0a2510"/>
<ellipse cx="840" cy="58" rx="105" ry="53" fill="#0d2e12"/>
<!-- Front hedge details -->
<ellipse cx="42"  cy="76" rx="75"  ry="36" fill="#112e14"/>
<ellipse cx="800" cy="74" rx="80"  ry="38" fill="#112e14"/>

<!-- Wooden deck -->
<ellipse cx="415" cy="232" rx="372" ry="142" fill="url(#deckWood)"/>
${plankLines}
<ellipse cx="415" cy="232" rx="375" ry="145" fill="none" stroke="#3d2010" stroke-width="2" opacity="0.7"/>

<!-- Pool shadow -->
<ellipse cx="418" cy="183" rx="250" ry="124" fill="rgba(0,0,0,0.38)" filter="url(#fGlowSm)"/>

<!-- Pool water -->
<ellipse cx="415" cy="175" rx="237" ry="116" fill="url(#poolWater)"/>

<!-- Pool glow when running -->
${running ? `<ellipse cx="415" cy="175" rx="237" ry="116" fill="url(#poolGlow)" class="shimmer"/>` : ''}

<!-- Water surface highlights -->
<ellipse cx="372" cy="148" rx="145" ry="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1.5" clip-path="url(#poolClip)"/>
<ellipse cx="388" cy="164" rx="175" ry="36" fill="none" stroke="rgba(255,255,255,0.045)" stroke-width="1" clip-path="url(#poolClip)"/>
<ellipse cx="348" cy="143" rx="96"  ry="17" fill="rgba(255,255,255,0.055)" clip-path="url(#poolClip)"/>

<!-- Running ripples -->
${running ? `
<ellipse cx="415" cy="175" rx="185" ry="90" fill="none" stroke="#22d3ee" stroke-width="1.8" opacity="0.5" class="water-ripple"  clip-path="url(#poolClip)"/>
<ellipse cx="415" cy="175" rx="125" ry="62" fill="none" stroke="#22d3ee" stroke-width="1.2" opacity="0.38" class="water-ripple2" clip-path="url(#poolClip)"/>
` : ''}

<!-- Underwater lights -->
<ellipse cx="300" cy="268" rx="32" ry="13" fill="url(#underwaterGrad)" filter="url(#fGlow)" opacity="0.9"/>
<circle  cx="300" cy="268" r="5" fill="#7dd3fc" opacity="0.95"/>
<ellipse cx="415" cy="278" rx="32" ry="13" fill="url(#underwaterGrad)" filter="url(#fGlow)" opacity="0.9"/>
<circle  cx="415" cy="277" r="5" fill="#7dd3fc" opacity="0.95"/>
<ellipse cx="530" cy="268" rx="32" ry="13" fill="url(#underwaterGrad)" filter="url(#fGlow)" opacity="0.9"/>
<circle  cx="530" cy="268" r="5" fill="#7dd3fc" opacity="0.95"/>

<!-- Pool rim -->
<ellipse cx="415" cy="175" rx="237" ry="116" fill="none" stroke="#c8b99a" stroke-width="5" opacity="0.62"/>
<ellipse cx="415" cy="175" rx="237" ry="116" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>

<!-- Pool ladder (right edge) -->
<line x1="530" y1="170" x2="530" y2="208" stroke="#b0b8c8" stroke-width="2.5" stroke-linecap="round"/>
<line x1="539" y1="170" x2="539" y2="208" stroke="#b0b8c8" stroke-width="2.5" stroke-linecap="round"/>
<line x1="528" y1="178" x2="541" y2="178" stroke="#b0b8c8" stroke-width="2"/>
<line x1="528" y1="189" x2="541" y2="189" stroke="#b0b8c8" stroke-width="2"/>
<line x1="528" y1="200" x2="541" y2="200" stroke="#b0b8c8" stroke-width="2"/>

<!-- Deck lighting (glow spots) -->
<circle cx="185" cy="272" r="38" fill="url(#deckLightGrad)" filter="url(#fGlowLg)" opacity="0.75"/>
<circle cx="185" cy="272" r="5"  fill="#fbbf24" opacity="0.95"/>
<circle cx="290" cy="308" r="30" fill="url(#deckLightGrad)" filter="url(#fGlowLg)" opacity="0.65"/>
<circle cx="290" cy="308" r="4"  fill="#fbbf24" opacity="0.95"/>
<circle cx="648" cy="272" r="38" fill="url(#deckLightGrad)" filter="url(#fGlowLg)" opacity="0.75"/>
<circle cx="648" cy="272" r="5"  fill="#fbbf24" opacity="0.95"/>
<circle cx="543" cy="308" r="30" fill="url(#deckLightGrad)" filter="url(#fGlowLg)" opacity="0.65"/>
<circle cx="543" cy="308" r="4"  fill="#fbbf24" opacity="0.95"/>

<!-- Palm tree (right side) -->
<path d="M792 318 Q788 268 796 200 Q800 165 795 125" stroke="#4a2c0a" stroke-width="13" fill="none" stroke-linecap="round"/>
<path d="M795 125 Q845 92 872 72"  stroke="#1a4d20" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M795 125 Q832 108 860 104" stroke="#1d5624" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M795 125 Q748 88 720 68"  stroke="#1a4d20" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M795 125 Q762 106 740 104" stroke="#1d5624" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M795 125 Q795 84 795 60"  stroke="#1a4d20" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M795 125 Q824 124 852 130" stroke="#1d5624" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="795" cy="133" r="6"  fill="#7c4a0c"/>
<circle cx="790" cy="140" r="5"  fill="#6b3f09" opacity="0.8"/>
<circle cx="801" cy="139" r="4"  fill="#6b3f09" opacity="0.7"/>

<!-- Lounge chairs (left) -->
<g transform="translate(72,252) rotate(-12)">
  <rect x="0"  y="-18" width="58" height="13" rx="4" fill="#d4c9a8" opacity="0.65"/>
  <rect x="0"  y="-4"  width="58" height="10" rx="4" fill="#c8bc94" opacity="0.65"/>
  <rect x="5"  y="6"   width="5"  height="9"  rx="2" fill="#b8a880" opacity="0.65"/>
  <rect x="48" y="6"   width="5"  height="9"  rx="2" fill="#b8a880" opacity="0.65"/>
</g>
<g transform="translate(82,285) rotate(-12)">
  <rect x="0"  y="-18" width="58" height="13" rx="4" fill="#d4c9a8" opacity="0.6"/>
  <rect x="0"  y="-4"  width="58" height="10" rx="4" fill="#c8bc94" opacity="0.6"/>
  <rect x="5"  y="6"   width="5"  height="9"  rx="2" fill="#b8a880" opacity="0.6"/>
  <rect x="48" y="6"   width="5"  height="9"  rx="2" fill="#b8a880" opacity="0.6"/>
</g>
<!-- Umbrella -->
<line x1="128" y1="228" x2="116" y2="310" stroke="#7c7c7c" stroke-width="2.5" stroke-linecap="round"/>
<path d="M82 230 Q128 198 174 230" fill="#e8d5a0" opacity="0.55"/>
<line x1="128" y1="228" x2="128" y2="233" stroke="#7c7c7c" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

// ── Tech SVG ─────────────────────────────────────────────────────────────────
function buildTechSvg(running, warning, powerStr, freqStr) {
  const sc = warning ? '#ef4444' : running ? '#22d3ee' : '#64748b';
  const st = warning ? 'Warnung' : running ? 'Laufend' : 'Gestoppt';

  const impeller = running
    ? `<g class="pump-spin">
        <line x1="96" y1="85" x2="96" y2="101" stroke="${sc}" stroke-width="3" stroke-linecap="round"/>
        <line x1="96" y1="101" x2="96" y2="117" stroke="${sc}" stroke-width="3" stroke-linecap="round"/>
        <line x1="80" y1="101" x2="96" y2="101" stroke="${sc}" stroke-width="3" stroke-linecap="round"/>
        <line x1="96" y1="101" x2="112" y2="101" stroke="${sc}" stroke-width="3" stroke-linecap="round"/>
      </g>`
    : `<circle cx="96" cy="101" r="7" fill="#374151" stroke="#4a5568" stroke-width="1"/>`;

  const pumpGlow = running
    ? `<circle cx="96" cy="101" r="30" fill="${sc}" fill-opacity="0.12"/>`
    : '';

  return `<svg viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="tMetal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#4a5568"/>
    <stop offset="50%" stop-color="#2d3748"/>
    <stop offset="100%" stop-color="#1a202c"/>
  </linearGradient>
  <linearGradient id="tFilterBody" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#374151"/>
    <stop offset="100%" stop-color="#1f2937"/>
  </linearGradient>
</defs>

<!-- ── POOLPUMPE ── -->
<!-- Motor body -->
<rect x="15" y="80" width="65" height="42" rx="5" fill="url(#tMetal)" stroke="#4a5568" stroke-width="1"/>
<!-- Ventilation ribs -->
<rect x="23" y="83" width="4" height="36" rx="1" fill="#374151" opacity="0.7"/>
<rect x="32" y="83" width="4" height="36" rx="1" fill="#374151" opacity="0.7"/>
<rect x="41" y="83" width="4" height="36" rx="1" fill="#374151" opacity="0.7"/>
<rect x="50" y="83" width="4" height="36" rx="1" fill="#374151" opacity="0.7"/>
<rect x="59" y="83" width="4" height="36" rx="1" fill="#374151" opacity="0.7"/>
<!-- Impeller housing -->
<circle cx="96" cy="101" r="26" fill="#2a3544" stroke="#4a5568" stroke-width="1.5"/>
<circle cx="96" cy="101" r="18" fill="#1a2535"/>
${pumpGlow}
${impeller}
<!-- Status dot -->
<circle cx="22" cy="85" r="4.5" fill="${sc}" ${running ? `style="filter:drop-shadow(0 0 4px ${sc})"` : ''}/>
<!-- Outlet pipe (top) -->
<rect x="89" y="57" width="10" height="24" rx="3" fill="#374151" stroke="#4a5568" stroke-width="0.8"/>
<!-- Inlet pipe (bottom) -->
<rect x="89" y="127" width="10" height="19" rx="3" fill="#374151" stroke="#4a5568" stroke-width="0.8"/>
<!-- Label -->
<text x="58" y="163" text-anchor="middle" fill="#6b7280" font-size="10" font-weight="600" font-family="sans-serif">Poolpumpe</text>
<text x="58" y="178" text-anchor="middle" fill="${sc}" font-size="11" font-weight="700" font-family="sans-serif">${st}</text>
${powerStr ? `<text x="58" y="191" text-anchor="middle" fill="#4a5568" font-size="9" font-family="sans-serif">${powerStr}</text>` : ''}
${freqStr  ? `<text x="58" y="202" text-anchor="middle" fill="#4a5568" font-size="9" font-family="sans-serif">${freqStr}</text>`  : ''}

<!-- ── PIPES ── -->
<rect x="91" y="34" width="8"  height="24" rx="3" fill="#374151" stroke="#4a5568" stroke-width="0.8"/>
<rect x="99" y="34" width="65" height="8"  rx="3" fill="#374151" stroke="#4a5568" stroke-width="0.8"/>
<rect x="156" y="34" width="8" height="40" rx="3" fill="#374151" stroke="#4a5568" stroke-width="0.8"/>

<!-- ── SANDFILTER ── -->
<!-- Vessel body -->
<rect x="148" y="68" width="52" height="88" rx="4" fill="url(#tFilterBody)" stroke="#4a5568" stroke-width="1.5"/>
<!-- Top dome -->
<ellipse cx="174" cy="68" rx="26" ry="13" fill="#2d3748" stroke="#4a5568" stroke-width="1.5"/>
<!-- Bottom dome -->
<ellipse cx="174" cy="156" rx="26" ry="11" fill="#252f3d" stroke="#4a5568" stroke-width="1"/>
<!-- Multiport valve -->
<rect x="167" y="52" width="14" height="17" rx="3" fill="#374151" stroke="#4a5568" stroke-width="1"/>
<circle cx="174" cy="56" r="5" fill="#2a3544" stroke="#64748b" stroke-width="1"/>
<!-- Pressure gauge -->
<circle cx="197" cy="100" r="8" fill="#1a2535" stroke="#64748b" stroke-width="1.5"/>
<circle cx="197" cy="100" r="5" fill="#0f172a"/>
<line x1="197" y1="100" x2="200" y2="96" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round"/>
<!-- Base legs -->
<rect x="157" y="165" width="8" height="18" rx="2" fill="#2d3748"/>
<rect x="178" y="165" width="8" height="18" rx="2" fill="#2d3748"/>
<!-- Label -->
<text x="174" y="198" text-anchor="middle" fill="#6b7280" font-size="10" font-weight="600" font-family="sans-serif">Sandfilter</text>

<!-- ── DOSIERANLAGE ── -->
<!-- Unit 1 — pH (blue) -->
<rect x="240" y="68" width="28" height="52" rx="5" fill="#1e3a5f" stroke="#2563eb" stroke-width="1.5"/>
<rect x="245" y="56" width="18" height="14" rx="3" fill="#1d4ed8" stroke="#3b82f6" stroke-width="1"/>
<rect x="248" y="60" width="12" height="6"  rx="2" fill="#2563eb"/>
<!-- Liquid level -->
<rect x="242" y="95" width="24" height="18" rx="2" fill="#3b82f6" opacity="0.32"/>
<!-- Tube -->
<rect x="252" y="120" width="4" height="18" rx="2" fill="#374151"/>
<!-- Unit 2 — Cl (red) -->
<rect x="278" y="68" width="28" height="52" rx="5" fill="#5f1e1e" stroke="#dc2626" stroke-width="1.5"/>
<rect x="283" y="56" width="18" height="14" rx="3" fill="#b91c1c" stroke="#ef4444" stroke-width="1"/>
<rect x="286" y="60" width="12" height="6"  rx="2" fill="#dc2626"/>
<!-- Liquid level -->
<rect x="280" y="105" width="24" height="8"  rx="2" fill="#ef4444" opacity="0.28"/>
<!-- Tube -->
<rect x="290" y="120" width="4" height="18" rx="2" fill="#374151"/>
<!-- Labels -->
<text x="283" y="155" text-anchor="middle" fill="#6b7280" font-size="10" font-weight="600" font-family="sans-serif">Dosieranlage</text>
<text x="254" y="170" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="600" font-family="sans-serif">pH+</text>
<text x="292" y="170" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="600" font-family="sans-serif">Cl</text>
</svg>`;
}

// ── Card Class ────────────────────────────────────────────────────────────────
class PoolControlCenterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
  }

  static getStubConfig() { return { title: 'Pool Control Center' }; }

  setConfig(config) {
    this._config = { title: 'Pool Control Center', ...config };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _s(id)       { return this._hass?.states?.[id] ?? null; }
  _isOn(id)    { return this._s(id)?.state === 'on'; }
  _unit(id)    { return this._s(id)?.attributes?.unit_of_measurement ?? ''; }

  _val(id, fb = '–') {
    const s = this._s(id);
    if (!s || ['unavailable', 'unknown', 'none'].includes(s.state)) return fb;
    return s.state;
  }

  _num(id, dec = 1, fb = '–') {
    const v = this._val(id, null);
    if (v === null) return fb;
    const n = parseFloat(v);
    return isNaN(n) ? fb : n.toFixed(dec);
  }

  _fmtH(raw) {
    if (raw === null || raw === undefined || raw === '–') return '–';
    const h = parseFloat(raw);
    if (isNaN(h)) return '–';
    if (h < 0.1) return `${Math.round(h * 60)} min`;
    return `${h.toFixed(1)} h`;
  }

  _fmtTime(entityId) {
    const s = this._s(entityId);
    if (!s || ['unavailable', 'unknown'].includes(s.state)) return '–';
    try {
      const d   = new Date(s.state);
      const now = new Date();
      const t   = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      return d.toDateString() === now.toDateString() ? `Heute, ${t}` : t;
    } catch (_) { return s.state; }
  }

  _render() {
    if (!this._hass) return;

    const running     = this._isOn(E.running);
    const warning     = this._isOn(E.warning);
    const autoOn      = this._isOn(E.automation);
    const status      = this._val(E.status, 'unknown');
    const season      = this._val(E.seasonMode, 'auto');
    const sColor      = STATUS_COLOR[status] ?? '#64748b';
    const sLabel      = STATUS_LABEL[status] ?? status;
    const seaColor    = SEASON_COLOR[season]  ?? '#94a3b8';

    const powerStr = this._num(E.power, 0) !== '–'
      ? `${this._num(E.power, 0)} ${this._unit(E.power) || 'W'}` : null;
    const freqStr  = this._num(E.frequency, 0) !== '–'
      ? `${this._num(E.frequency, 0)} ${this._unit(E.frequency) || 'Hz'}` : null;

    const effVal = parseFloat(this._val(E.efficiency, '0'));
    const effPct = isNaN(effVal) ? 0 : Math.min(100, Math.max(0, effVal));

    // Panel row helper
    const pr = (icon, label, value, unit = '') => {
      const valHtml = (value === null || value === undefined || value === '–' || value === '')
        ? `<span class="not-cfg">Nicht konfiguriert</span>`
        : `<span class="prow-value">${value}${unit ? `<span style="font-size:.7em;color:#64748b;margin-left:2px">${unit}</span>` : ''}</span>`;
      return `<div class="prow"><span class="prow-label">${icon} ${label}</span>${valHtml}</div>`;
    };

    const phVal    = this._val(E.ph, null);
    const redoxVal = this._val(E.redox, null);
    const tempVal  = this._val(E.temperature, null);

    this.shadowRoot.innerHTML = `
<style>${CSS}</style>
<div class="pcc">

<!-- ── HEADER ── -->
<div class="pcc-header">
  <div class="pcc-title">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12c1.5-3 4-4.5 6-4.5s4.5 1.5 6 1.5 4.5-1.5 6-1.5"/>
      <path d="M2 17c1.5-3 4-4.5 6-4.5s4.5 1.5 6 1.5 4.5-1.5 6-1.5"/>
    </svg>
    ${this._config.title ?? 'Pool Control Center'}
  </div>
  <div class="badge ${autoOn ? 'badge-auto-on' : 'badge-auto-off'}" id="btn-auto-badge">
    🔄 Automatikmodus
    <div class="pulse-dot ${autoOn ? '' : 'off'}"></div>
  </div>
  <div class="badge badge-season" id="btn-season-badge">
    ${SEASON_ICON[season] ?? '🔄'} Saison: ${SEASON_LABEL[season] ?? season}
  </div>
  <div class="version-label">PPM v${CARD_VERSION}</div>
</div>

${warning ? `<div class="warn">⚠️ Pumpe eingeschaltet – Leistungsaufnahme &lt;100 W erkannt. Pumpe und Verkabelung prüfen!</div>` : ''}

<!-- ── MAIN ROW ── -->
<div class="main-row">
  <div class="pool-area">${buildPoolSvg(running)}</div>
  <div class="tech-area">
    <div class="tech-title">≡ TECHNIK</div>
    <div class="tech-svg-wrap">${buildTechSvg(running, warning, powerStr, freqStr)}</div>
    <div class="tech-status ${running ? 'ts-running' : warning ? 'ts-warn' : ''}">
      <span class="tech-status-label" style="color:${running ? '#22d3ee' : warning ? '#ef4444' : '#64748b'}">
        ${running ? '▶ Laufend' : warning ? '⚠ Warnung' : '■ Gestoppt'}
      </span>
      <span class="tech-vals">
        ${powerStr ? `<span>${powerStr}</span>` : ''}
        ${freqStr  ? `<span>${freqStr}</span>`  : ''}
      </span>
    </div>
  </div>
</div>

<!-- ── STATUS TILES ── -->
<div class="tiles-row">
  <div class="tile">
    <div class="tile-header"><span style="color:${sColor}">⏻</span> STATUS</div>
    <div class="tile-value" style="color:${sColor};font-size:1.1rem">
      ${sLabel}${running ? ` <span class="pulse-dot" style="display:inline-block;vertical-align:middle;margin-left:4px"></span>` : ''}
    </div>
  </div>
  <div class="tile">
    <div class="tile-header"><span style="color:#f59e0b">⚡</span> LEISTUNG</div>
    <div class="tile-value">${this._num(E.power, 0)}<span class="tile-unit"> ${this._unit(E.power) || 'W'}</span></div>
  </div>
  <div class="tile">
    <div class="tile-header"><span style="color:#22d3ee">〰</span> SPANNUNG</div>
    <div class="tile-value">${this._num(E.voltage, 0)}<span class="tile-unit"> ${this._unit(E.voltage) || 'V'}</span></div>
  </div>
  <div class="tile">
    <div class="tile-header"><span style="color:#a78bfa">〰</span> STROM</div>
    <div class="tile-value">${this._num(E.current, 1)}<span class="tile-unit"> ${this._unit(E.current) || 'A'}</span></div>
  </div>
  <div class="tile">
    <div class="tile-header"><span style="color:#38bdf8">〰</span> FREQUENZ</div>
    <div class="tile-value">${this._num(E.frequency, 0)}<span class="tile-unit"> ${this._unit(E.frequency) || 'Hz'}</span></div>
  </div>
  <div class="tile">
    <div class="tile-header"><span style="color:#4ade80">🌿</span> EFFIZIENZ</div>
    <div class="tile-value">${this._num(E.efficiency, 0)}<span class="tile-unit"> %</span></div>
  </div>
  <div class="tile" style="border-right:none">
    <div class="tile-header"><span style="color:#f59e0b">≡</span> ENERGIE</div>
    <div class="tile-value">${this._num(E.energy, 2)}<span class="tile-unit"> ${this._unit(E.energy) || 'kWh'}</span></div>
    <div class="tile-sub">heute</div>
  </div>
</div>

<!-- ── PANELS ROW ── -->
<div class="panels-row">

  <!-- LAUFZEITEN -->
  <div class="panel">
    <div class="panel-title">⏱ LAUFZEITEN</div>
    ${pr('▶', 'Laufzeit heute',  this._fmtH(this._val(E.runtimeToday, null)))}
    ${pr('⏳', 'Restlaufzeit',   this._fmtH(this._val(E.remaining,    null)))}
    ${pr('🕐', 'Nächster Start', this._fmtTime(E.nextStart))}
    ${pr('🎯', 'Tagesziel',      this._fmtH(this._val(E.target,       null)))}
    <div class="pbar-bg"><div class="pbar-fill" style="width:${effPct}%"></div></div>
    <div class="pbar-label">${Math.round(effPct)} %</div>
  </div>

  <!-- SAISONMODUS -->
  <div class="panel">
    <div class="panel-title">☀️ SAISONMODUS</div>
    <div class="season-display">
      <div class="season-sublabel">Aktuelle Saison</div>
      <div class="season-name" style="color:${seaColor}">${SEASON_LABEL[season] ?? season}</div>
    </div>
    ${pr('💧', 'Empf. Umwälzung',   this._val(E.target,       null) !== null ? this._num(E.target,       1) : null, 'h/Tag')}
    ${pr('⚙',  'Eingest. Ziel',     this._val(E.runtimeToday, null) !== null ? this._num(E.runtimeToday, 1) : null, 'h/Tag')}
    <button class="season-btn" id="btn-season-cycle">🔄 Saisonmodus: ${SEASON_LABEL[season] ?? season}</button>
  </div>

  <!-- WASSERQUALITÄT -->
  <div class="panel">
    <div class="panel-title">💧 WASSERQUALITÄT</div>
    ${pr('🧪', 'pH-Wert',     phVal)}
    ${pr('⚡', 'Redox',       redoxVal, redoxVal && redoxVal !== '–' ? 'mV' : '')}
    ${pr('🌡', 'Temperatur',  tempVal,  tempVal  && tempVal  !== '–' ? '°C' : '')}
    <div class="wq-note">Sensoren in zukünftiger Version</div>
  </div>

  <!-- WARTUNG -->
  <div class="panel">
    <div class="panel-title">🔧 WARTUNG &amp; BETRIEBSSTUNDEN</div>
    ${pr('♾',  'Gesamt',       this._fmtH(this._val(E.totalRuntime,  null)))}
    ${pr('🌿', 'Saison',       this._fmtH(this._val(E.seasonRuntime, null)))}
    ${pr('🔧', 'Seit Wartung', this._fmtH(this._val(E.maintenance,   null)))}
    <div class="mbtn-row">
      <button class="mbtn" id="btn-maint">🔧 Wartung Reset</button>
      <button class="mbtn" id="btn-season-reset">🔄 Saison Reset</button>
    </div>
  </div>

  <!-- STEUERUNG -->
  <div class="panel" style="border-right:none">
    <div class="panel-title">⏻ STEUERUNG</div>
    <div class="ctrl-toggle" id="btn-auto-toggle">
      <span class="ctrl-toggle-label">
        <span style="color:${autoOn ? '#4ade80' : '#64748b'}">⏻</span>
        Auto ${autoOn ? 'EIN' : 'AUS'}
      </span>
      <div class="tog ${autoOn ? 'on' : 'off'}"><div class="tog-thumb"></div></div>
    </div>
    <button class="cbtn cbtn-start" id="btn-start">▶&nbsp; Start</button>
    <button class="cbtn cbtn-stop"  id="btn-stop">■&nbsp; Stopp</button>
  </div>

</div>

<!-- ── NAV FOOTER ── -->
<div class="nav">
  <div class="ntab active"><span class="ntab-icon">🏠</span>Übersicht</div>
  <div class="ntab"><span class="ntab-icon">⏱</span>Laufzeiten</div>
  <div class="ntab"><span class="ntab-icon">⚙</span>Einstellungen</div>
  <div class="ntab"><span class="ntab-icon">🔧</span>Wartung</div>
  <div class="ntab"><span class="ntab-icon">📊</span>Historie</div>
  <div class="ntab" style="border-right:none"><span class="ntab-icon">ℹ</span>Info</div>
</div>

</div>`;

    this._attach();
  }

  _attach() {
    const root = this.shadowRoot;
    const $    = id => root.getElementById(id);
    const svc  = (domain, service, data) => this._hass.callService(domain, service, data);

    const toggleAuto = () => svc('switch', this._isOn(E.automation) ? 'turn_off' : 'turn_on', { entity_id: E.automation });

    $('btn-auto-badge')?.addEventListener('click', toggleAuto);
    $('btn-auto-toggle')?.addEventListener('click', toggleAuto);

    $('btn-start')?.addEventListener('click', () => svc('pool_pump_manager', 'start_now', {}));
    $('btn-stop')?.addEventListener('click',  () => svc('pool_pump_manager', 'stop_now',  {}));

    $('btn-maint')?.addEventListener('click',        () => svc('button', 'press', { entity_id: E.btnMaint  }));
    $('btn-season-reset')?.addEventListener('click', () => svc('button', 'press', { entity_id: E.btnSeason }));

    const cycleSeason = () => {
      const cur  = this._val(E.seasonMode, 'auto');
      const next = SEASON_MODES[(SEASON_MODES.indexOf(cur) + 1) % SEASON_MODES.length];
      this._hass.callService('select', 'select_option', { entity_id: E.seasonMode, option: next });
    };
    $('btn-season-badge')?.addEventListener('click', cycleSeason);
    $('btn-season-cycle')?.addEventListener('click', cycleSeason);
  }

  getCardSize() { return 10; }
}

// ── Registration ─────────────────────────────────────────────────────────────
if (!customElements.get('pool-control-center-card')) {
  customElements.define('pool-control-center-card', PoolControlCenterCard);
  console.info(
    '%c POOL CONTROL CENTER %c v' + CARD_VERSION + ' ',
    'color:#fff;background:#0284c7;padding:2px 4px;border-radius:3px 0 0 3px;font-weight:700',
    'color:#0284c7;background:#e2e8f0;padding:2px 4px;border-radius:0 3px 3px 0'
  );
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'pool-control-center-card')) {
  window.customCards.push({
    type: 'pool-control-center-card',
    name: 'Pool Control Center',
    description: 'Pool Pump Manager – Professional Dashboard v' + CARD_VERSION,
    preview: false,
    documentationURL: 'https://github.com/choell401780/homeassistant-pool-pump-manager',
  });
}
