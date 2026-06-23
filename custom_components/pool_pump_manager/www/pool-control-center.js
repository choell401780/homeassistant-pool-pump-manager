'use strict';

/**
 * Pool Control Center – Custom Lovelace Card v0.4.2
 * Pixel-faithful reproduction of the Pool Pump Manager dashboard mockup.
 */

const CARD_VERSION = '0.4.2';

const LOG = {
  info:  function() { var a = ['%c[PCC]%c', 'color:#22d3ee;font-weight:700', '']; for (var i=0;i<arguments.length;i++) a.push(arguments[i]); console.info.apply(console, a); },
  debug: function() { var a = ['[PCC]']; for (var i=0;i<arguments.length;i++) a.push(arguments[i]); console.debug.apply(console, a); },
  warn:  function() { var a = ['[PCC]']; for (var i=0;i<arguments.length;i++) a.push(arguments[i]); console.warn.apply(console, a); },
};

const SEASON_MODES = ['auto', 'spring', 'summer', 'autumn', 'winter'];
const SEASON_LABEL = { auto: 'Auto', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter' };
const SEASON_ICON  = { auto: '⚙️', spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };

const STATUS_LABEL = {
  running: 'Läuft', waiting: 'Warten', scheduled: 'Geplant',
  completed: 'Fertig', manual: 'Manuell', unknown: 'Unbekannt',
};

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

const ENTITY_FALLBACKS = {
  temperature: ['sensor.pool_pump_manager_temperature','sensor.pool_pump_manager_water_temperature','sensor.pool_pump_manager_pool_temp'],
  power:       ['sensor.pool_pump_manager_leistung'],
  voltage:     ['sensor.pool_pump_manager_spannung'],
  current:     ['sensor.pool_pump_manager_strom'],
  frequency:   ['sensor.pool_pump_manager_hz'],
  energy:      ['sensor.pool_pump_manager_verbrauch'],
};

// ── CSS ──────────────────────────────────────────────────────────────────────

const CARD_CSS = '' +
':host{display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e6edf3;background:#0d1117;}' +
'*{box-sizing:border-box;margin:0;padding:0;}' +
'.pcc{background:#0d1117;border-radius:12px;overflow:hidden;}' +

/* HEADER */
'.hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#0d1117;border-bottom:1px solid #21262d;gap:12px;flex-wrap:wrap;}' +
'.hdr-brand{display:flex;align-items:center;gap:10px;flex-shrink:0;}' +
'.hdr-wave{font-size:30px;color:#22d3ee;line-height:1;}' +
'.hdr-title{font-size:26px;font-weight:700;color:#e6edf3;white-space:nowrap;}' +
'.hdr-badges{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;}' +
'.hbadge{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#161b22;border:1px solid #21262d;border-radius:8px;cursor:pointer;white-space:nowrap;}' +
'.hbadge.no-click{cursor:default;}' +
'.hbadge:hover:not(.no-click){border-color:#373e47;background:#1c2128;}' +
'.hb-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}' +
'.hb-dot.on{background:#22c55e;animation:pulse-green 2s infinite;}' +
'.hb-dot.off{background:#6b7280;}' +
'@keyframes pulse-green{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5);}50%{box-shadow:0 0 0 5px rgba(34,197,94,0);}}' +
'.hb-icon{font-size:20px;line-height:1;}' +
'.hb-text{}' +
'.hb-title{font-size:13px;font-weight:600;color:#e6edf3;line-height:1.3;}' +
'.hb-sub{font-size:11px;color:#7d8590;line-height:1.3;}' +
'.hb-muted .hb-title{color:#7d8590;}' +

/* MAIN AREA */
'.main-area{display:flex;height:340px;border-bottom:1px solid #21262d;overflow:hidden;}' +
'.pool-area{flex:0 0 60%;overflow:hidden;position:relative;background:#060c14;}' +
'.pool-area svg{width:100%;height:100%;display:block;pointer-events:none;}' +
'.tech-panel{flex:0 0 40%;background:#0f1419;border-left:1px solid #21262d;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0;}' +
'.tech-hdr{font-size:11px;font-weight:700;letter-spacing:0.15em;color:#7d8590;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #21262d;flex-shrink:0;}' +
'.tech-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;flex:1;min-height:0;}' +
'.tech-col{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:8px 6px;display:flex;flex-direction:column;gap:6px;min-width:0;overflow:hidden;}' +
'.tech-col-hdr{display:flex;align-items:center;gap:4px;width:100%;}' +
'.tech-col-icon{font-size:14px;flex-shrink:0;}' +
'.tech-col-name{font-size:11px;font-weight:600;color:#e6edf3;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
'.tech-col-status{font-size:10px;font-weight:700;color:#22c55e;flex-shrink:0;}' +
'.tech-col-status.warn{color:#f59e0b;}' +
'.tech-col-status.off{color:#6b7280;}' +
'.tech-visual{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;overflow:hidden;}' +
'.tech-visual svg{max-width:100%;max-height:100%;display:block;pointer-events:none;}' +
'.tech-col-metrics{font-size:10px;color:#7d8590;text-align:center;line-height:1.5;}' +
'.tech-col-metrics b{color:#e6edf3;font-weight:600;}' +
'.tech-sysstat{display:flex;align-items:center;gap:6px;font-size:12px;color:#22c55e;padding-top:6px;border-top:1px solid #21262d;flex-shrink:0;}' +

/* PUMP SVG ANIMATION */
'@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg)}}' +
'.pump-ring-run{transform-origin:52px 50px;transform-box:fill-box;animation:spin 2s linear infinite;}' +

/* STATUS BAR */
'.stat-bar{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #21262d;}' +
'.stat-cell{padding:12px 14px;border-right:1px solid #21262d;display:flex;flex-direction:column;gap:2px;}' +
'.stat-cell:last-child{border-right:none;}' +
'.stat-label{font-size:10px;font-weight:700;letter-spacing:0.08em;color:#7d8590;text-transform:uppercase;}' +
'.stat-main{display:flex;align-items:baseline;gap:5px;margin:2px 0;}' +
'.stat-ico{font-size:18px;line-height:1;}' +
'.stat-val{font-size:22px;font-weight:700;color:#e6edf3;line-height:1;}' +
'.stat-unit{font-size:14px;font-weight:600;color:#7d8590;}' +
'.stat-val.green{color:#22c55e;}' +
'.stat-val.blue{color:#22d3ee;}' +
'.stat-val.yellow{color:#eab308;}' +
'.stat-val.orange{color:#f59e0b;}' +
'.stat-sub{font-size:10px;color:#7d8590;}' +

/* BOTTOM SECTION */
'.bottom{display:grid;grid-template-columns:repeat(4,1fr) 1.3fr;border-bottom:1px solid #21262d;}' +
'.bpanel{padding:14px 16px;border-right:1px solid #21262d;display:flex;flex-direction:column;gap:7px;}' +
'.bpanel:last-child{border-right:none;}' +
'.bpanel-title{font-size:10px;font-weight:700;letter-spacing:0.12em;color:#22d3ee;text-transform:uppercase;padding-bottom:4px;border-bottom:1px solid #21262d;}' +
'.brow{display:flex;align-items:center;gap:7px;padding:1px 0;}' +
'.brow-ico{font-size:13px;width:16px;text-align:center;flex-shrink:0;}' +
'.brow-lbl{font-size:12px;color:#7d8590;flex:1;}' +
'.brow-val{font-size:12px;font-weight:600;color:#e6edf3;}' +
'.prog-wrap{background:#21262d;border-radius:3px;height:6px;width:100%;overflow:hidden;margin-top:3px;}' +
'.prog-fill{background:linear-gradient(90deg,#22c55e,#16a34a);height:100%;border-radius:3px;transition:width .5s;}' +
'.prog-pct{font-size:10px;color:#7d8590;text-align:right;margin-top:2px;}' +
'.season-name-row{display:flex;align-items:center;gap:8px;margin:2px 0;}' +
'.season-name-icon{font-size:20px;}' +
'.season-name-text{font-size:20px;font-weight:700;color:#f59e0b;}' +
'.season-link{font-size:11px;color:#22d3ee;cursor:pointer;display:flex;align-items:center;gap:4px;margin-top:auto;padding-top:4px;}' +
'.season-link:hover{color:#67e8f9;}' +
'.wq-ok{font-size:11px;color:#22c55e;display:flex;align-items:center;gap:4px;margin-top:auto;padding-top:4px;}' +
'.maint-ok{font-size:11px;color:#22c55e;display:flex;align-items:center;gap:4px;margin-top:auto;padding-top:4px;}' +

/* STEUERUNG */
'.ctrl-panel{background:#0f1419;padding:14px 16px;display:flex;flex-direction:column;gap:8px;}' +
'.ctrl-title{font-size:10px;font-weight:700;letter-spacing:0.12em;color:#7d8590;text-transform:uppercase;padding-bottom:6px;border-bottom:1px solid #21262d;}' +
'.ctrl-auto-row{display:flex;align-items:center;justify-content:space-between;background:#161b22;border:1px solid #21262d;border-radius:8px;padding:9px 12px;cursor:pointer;position:relative;z-index:10;pointer-events:all;}' +
'.ctrl-auto-row:hover{border-color:#373e47;}' +
'.ctrl-auto-lbl{font-size:13px;font-weight:500;color:#e6edf3;}' +
'.ctrl-toggle-wrap{display:flex;align-items:center;gap:7px;}' +
'.ctrl-toggle-lbl{font-size:12px;font-weight:700;}' +
'.ctrl-toggle-lbl.on{color:#22c55e;}' +
'.ctrl-toggle-lbl.off{color:#6b7280;}' +
'.toggle-pill{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .3s;flex-shrink:0;pointer-events:all;}' +
'.toggle-pill.on{background:#22c55e;}' +
'.toggle-pill.off{background:#374151;}' +
'.toggle-pill::after{content:"";position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;transition:left .3s;}' +
'.toggle-pill.on::after{left:23px;}' +
'.toggle-pill.off::after{left:3px;}' +
'.ctrl-main-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;}' +
'.btn-start{background:#16a34a;color:white;border:none;border-radius:8px;padding:11px 8px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background .2s;position:relative;z-index:10;pointer-events:all;}' +
'.btn-start:hover{background:#15803d;}' +
'.btn-stop{background:#dc2626;color:white;border:none;border-radius:8px;padding:11px 8px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background .2s;position:relative;z-index:10;pointer-events:all;}' +
'.btn-stop:hover{background:#b91c1c;}' +
'.ctrl-reset-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;}' +
'.btn-reset{background:transparent;color:#e6edf3;border:1px solid #21262d;border-radius:7px;padding:7px 4px;font-size:11px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:3px;transition:background .2s,border-color .2s;position:relative;z-index:10;pointer-events:all;}' +
'.btn-reset:hover{background:#21262d;border-color:#373e47;}' +
'.ctrl-season-lbl{font-size:10px;color:#7d8590;margin-bottom:-2px;}' +
'.ctrl-season-sel{display:flex;align-items:center;justify-content:space-between;background:#161b22;border:1px solid #21262d;border-radius:8px;padding:8px 12px;cursor:pointer;position:relative;z-index:10;pointer-events:all;}' +
'.ctrl-season-sel:hover{border-color:#373e47;}' +
'.ctrl-season-val{font-size:13px;font-weight:500;color:#e6edf3;display:flex;align-items:center;gap:6px;}' +
'.ctrl-season-arrow{color:#7d8590;font-size:12px;}' +

/* CLICK FX */
'.fx{animation:btn-click .2s;}' +
'@keyframes btn-click{0%,100%{transform:scale(1);}50%{transform:scale(0.95);}}' +

/* NAV BAR */
'.nav{display:flex;background:#0d1117;border-top:1px solid #21262d;}' +
'.nav-btn{flex:1;padding:12px 6px;background:transparent;border:none;border-right:1px solid #21262d;color:#7d8590;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:color .2s,background .2s;position:relative;z-index:10;pointer-events:all;}' +
'.nav-btn:last-child{border-right:none;}' +
'.nav-btn.active{background:#161b22;color:#22d3ee;}' +
'.nav-btn:hover:not(.active){color:#e6edf3;background:#0f1419;}' +
'.nav-ico{font-size:17px;}' +
'.nav-lbl{font-size:10px;font-weight:500;}';

// ── Pool SVG ─────────────────────────────────────────────────────────────────

function buildPoolSvg(running) {
  var plankLines = '';
  for (var py = 180; py <= 340; py += 12) {
    plankLines += '<line x1="0" y1="' + py + '" x2="800" y2="' + py + '" stroke="#2c1a0a" stroke-width="1" opacity="0.45"/>';
  }

  var fronds = [
    'M90,115 Q60,145 30,168',
    'M90,115 Q55,125 25,128',
    'M90,115 Q62,108 40,90',
    'M90,115 Q70,95 65,68',
    'M90,115 Q88,88 95,62',
    'M90,115 Q108,92 125,72',
    'M90,115 Q118,108 148,105',
    'M90,115 Q120,125 152,138',
  ];
  var frondPaths = '';
  for (var fi = 0; fi < fronds.length; fi++) {
    frondPaths += '<path d="' + fronds[fi] + '" stroke="#143d14" stroke-width="6" fill="none" stroke-linecap="round" opacity="' + (0.7 + fi * 0.03) + '"/>';
    frondPaths += '<path d="' + fronds[fi] + '" stroke="#1e5c1e" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>';
  }

  var lamps = [
    [165,310],[270,325],[380,332],[490,325],[600,310],[690,305],[155,245],[680,248]
  ];
  var lampEls = '';
  for (var li = 0; li < lamps.length; li++) {
    var lx = lamps[li][0], ly = lamps[li][1];
    lampEls += '<ellipse cx="' + lx + '" cy="' + ly + '" rx="38" ry="16" fill="url(#lamp-glow)"/>';
    lampEls += '<circle cx="' + lx + '" cy="' + ly + '" r="4" fill="#ffb347" opacity="0.9"/>';
  }

  var caustics = [
    [310,252,18,7],[350,242,14,5],[410,236,20,7],[460,244,12,5],[500,252,16,6],[540,245,14,5],[480,260,10,4]
  ];
  var causticEls = '';
  for (var ci = 0; ci < caustics.length; ci++) {
    var c = caustics[ci];
    causticEls += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="' + c[3] + '" fill="white" opacity="0.1"/>';
  }

  var rippleEls = '';
  if (running) {
    rippleEls =
      '<ellipse cx="430" cy="255" rx="60" ry="22" fill="none" stroke="#00e5ff" stroke-width="1.5" opacity="0">' +
        '<animate attributeName="rx" values="60;145;60" dur="3s" repeatCount="indefinite"/>' +
        '<animate attributeName="ry" values="22;52;22" dur="3s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0;0.4;0" dur="3s" repeatCount="indefinite"/>' +
      '</ellipse>' +
      '<ellipse cx="430" cy="255" rx="60" ry="22" fill="none" stroke="#00e5ff" stroke-width="1" opacity="0">' +
        '<animate attributeName="rx" values="60;145;60" dur="3s" begin="1.5s" repeatCount="indefinite"/>' +
        '<animate attributeName="ry" values="22;52;22" dur="3s" begin="1.5s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0;0.25;0" dur="3s" begin="1.5s" repeatCount="indefinite"/>' +
      '</ellipse>';
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 340" preserveAspectRatio="xMidYMid slice">' +
    '<defs>' +
      '<linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#060c14"/>' +
        '<stop offset="100%" stop-color="#0d1a28"/>' +
      '</linearGradient>' +
      '<radialGradient id="lamp-glow" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#ff8000" stop-opacity="0.7"/>' +
        '<stop offset="60%" stop-color="#ff5500" stop-opacity="0.25"/>' +
        '<stop offset="100%" stop-color="#ff2200" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="pool-water" cx="40%" cy="35%" r="60%">' +
        '<stop offset="0%" stop-color="#00e5ff" stop-opacity="0.95"/>' +
        '<stop offset="25%" stop-color="#00b4d8" stop-opacity="0.9"/>' +
        '<stop offset="60%" stop-color="#0077b6" stop-opacity="0.85"/>' +
        '<stop offset="100%" stop-color="#023e8a" stop-opacity="0.95"/>' +
      '</radialGradient>' +
      '<radialGradient id="uwl" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>' +
        '<stop offset="35%" stop-color="#7df9ff" stop-opacity="0.5"/>' +
        '<stop offset="100%" stop-color="#00bcd4" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="pool-rim" cx="50%" cy="30%" r="70%">' +
        '<stop offset="0%" stop-color="#d0d7e0"/>' +
        '<stop offset="100%" stop-color="#7a8694"/>' +
      '</radialGradient>' +
      '<filter id="glow-f">' +
        '<feGaussianBlur stdDeviation="3" result="blur"/>' +
        '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
    '</defs>' +

    /* Sky */
    '<rect width="800" height="340" fill="url(#sky-grad)"/>' +

    /* Stars */
    '<g fill="white" opacity="0.5">' +
      '<circle cx="45" cy="18" r="0.8"/><circle cx="95" cy="8" r="1.0"/><circle cx="170" cy="25" r="0.7"/>' +
      '<circle cx="240" cy="12" r="0.9"/><circle cx="320" cy="30" r="0.7"/><circle cx="395" cy="8" r="1.1"/>' +
      '<circle cx="450" cy="22" r="0.8"/><circle cx="510" cy="15" r="0.9"/><circle cx="590" cy="28" r="0.7"/>' +
      '<circle cx="650" cy="10" r="1.0"/><circle cx="710" cy="20" r="0.8"/><circle cx="760" cy="35" r="0.7"/>' +
      '<circle cx="800" cy="12" r="0.9"/><circle cx="80" cy="45" r="0.7"/><circle cx="200" cy="40" r="0.8"/>' +
      '<circle cx="350" cy="50" r="0.7"/><circle cx="500" cy="38" r="0.9"/><circle cx="620" cy="42" r="0.7"/>' +
      '<circle cx="700" cy="30" r="1.0"/><circle cx="750" cy="48" r="0.8"/>' +
    '</g>' +

    /* Rear hedge layer 1 */
    '<path d="M0,200 C50,140 100,110 150,130 C200,100 250,90 300,120 C350,85 400,80 450,105 C500,88 550,95 600,115 C650,90 700,100 750,120 C775,130 790,150 800,160 L800,0 L0,0 Z" fill="#0a2009"/>' +
    /* Hedge layer 2 (lighter, offset) */
    '<path d="M0,190 C40,155 90,120 140,140 C190,110 240,95 290,115 C340,90 395,88 440,108 C490,92 545,98 600,118 C645,98 695,108 740,125 C765,135 785,155 800,165 L800,0 L0,0 Z" fill="#0d2e0a" opacity="0.7"/>' +
    /* Mid-ground dark green mass */
    '<path d="M0,215 C80,185 160,175 200,185 C250,170 300,168 320,185 L320,215 Z" fill="#061806" opacity="0.8"/>' +
    '<path d="M680,215 C720,185 760,178 800,185 L800,215 Z" fill="#061806" opacity="0.8"/>' +

    /* Palm trunk */
    '<path d="M85,340 C83,280 78,220 82,170 C84,150 88,130 90,115" stroke="#2d1a08" stroke-width="14" fill="none" stroke-linecap="round"/>' +
    '<path d="M85,340 C83,280 78,220 82,170 C84,150 88,130 90,115" stroke="#3d2510" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.6"/>' +
    /* Palm fronds */
    frondPaths +

    /* Wooden deck base */
    '<rect x="0" y="175" width="800" height="165" fill="#3a2410"/>' +
    /* Deck color variation strips */
    '<rect x="0" y="175" width="800" height="40" fill="#422a14" opacity="0.5"/>' +
    '<rect x="0" y="280" width="800" height="60" fill="#2e1c0c" opacity="0.4"/>' +
    /* Plank lines */
    plankLines +

    /* Ground uplights */
    lampEls +

    /* Pool coping (light rim surrounding pool) */
    '<ellipse cx="430" cy="260" rx="286" ry="83" fill="url(#pool-rim)" opacity="0.25"/>' +
    '<ellipse cx="430" cy="260" rx="286" ry="83" fill="none" stroke="#9ca3af" stroke-width="3"/>' +

    /* Pool water */
    '<ellipse cx="430" cy="260" rx="282" ry="79" fill="url(#pool-water)"/>' +

    /* Underwater lights */
    '<ellipse cx="320" cy="248" rx="70" ry="28" fill="url(#uwl)"/>' +
    '<ellipse cx="445" cy="238" rx="55" ry="22" fill="url(#uwl)"/>' +
    '<ellipse cx="555" cy="252" rx="60" ry="24" fill="url(#uwl)"/>' +

    /* Caustic highlights */
    causticEls +

    /* Pool rim inner highlight */
    '<ellipse cx="430" cy="185" rx="270" ry="40" fill="none" stroke="white" stroke-width="1.5" opacity="0.2"/>' +

    /* Ripple animations */
    rippleEls +

    /* Pool ladder (right side) */
    '<rect x="665" y="230" width="3" height="55" fill="#c8cdd4" rx="1.5"/>' +
    '<rect x="675" y="230" width="3" height="55" fill="#c8cdd4" rx="1.5"/>' +
    '<rect x="662" y="240" width="19" height="2" fill="#c8cdd4" rx="1"/>' +
    '<rect x="662" y="253" width="19" height="2" fill="#c8cdd4" rx="1"/>' +
    '<rect x="662" y="266" width="19" height="2" fill="#c8cdd4" rx="1"/>' +
    '<rect x="662" y="279" width="19" height="2" fill="#c8cdd4" rx="1"/>' +

    /* Deck furniture: umbrella */
    '<ellipse cx="510" cy="192" rx="48" ry="18" fill="#1a1a2e" opacity="0.85"/>' +
    '<path d="M510,192 C500,182 488,176 474,175" stroke="#252540" stroke-width="2" fill="none"/>' +
    '<path d="M510,192 C510,182 510,176 510,174" stroke="#252540" stroke-width="2" fill="none"/>' +
    '<path d="M510,192 C520,182 532,176 546,175" stroke="#252540" stroke-width="2" fill="none"/>' +
    '<line x1="510" y1="192" x2="510" y2="228" stroke="#1a1a2e" stroke-width="3"/>' +

    /* Deck chairs */
    '<rect x="472" y="218" width="46" height="18" rx="4" fill="#141422" opacity="0.85"/>' +
    '<rect x="476" y="210" width="12" height="12" rx="2" fill="#141422" opacity="0.8"/>' +
    '<rect x="536" y="218" width="46" height="18" rx="4" fill="#141422" opacity="0.85"/>' +
    '<rect x="540" y="210" width="12" height="12" rx="2" fill="#141422" opacity="0.8"/>' +

    /* Subtle cyan glow below pool onto deck */
    '<ellipse cx="430" cy="342" rx="200" ry="18" fill="#00d4ff" opacity="0.07"/>' +

  '</svg>';
}

// ── Pump SVG ─────────────────────────────────────────────────────────────────

function buildPumpSvg(running) {
  var ringColor = running ? '#22d3ee' : '#374151';
  var ringGlow  = running ? 'filter:drop-shadow(0 0 5px #22d3ee);' : '';
  var ringClass = running ? ' class="pump-ring-run"' : '';
  var statusDot = running ? '#22c55e' : '#374151';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 80" width="104" height="80">' +
    /* Base plate */
    '<rect x="8" y="66" width="88" height="8" rx="2" fill="#1a2030"/>' +
    /* Main pump body (volute) */
    '<ellipse cx="42" cy="48" rx="28" ry="18" fill="#1e2a3a"/>' +
    '<ellipse cx="42" cy="48" rx="28" ry="18" fill="none" stroke="#2d3e52" stroke-width="1.5"/>' +
    /* Inlet pipe */
    '<rect x="6" y="42" width="16" height="12" rx="3" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1.2"/>' +
    '<rect x="2" y="44" width="7" height="8" rx="2" fill="#162030"/>' +
    /* Outlet pipe (top) */
    '<rect x="34" y="26" width="10" height="14" rx="2" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1.2"/>' +
    /* Motor housing */
    '<rect x="64" y="34" width="28" height="28" rx="6" fill="#161e2c"/>' +
    '<rect x="64" y="34" width="28" height="28" rx="6" fill="none" stroke="#2d3e52" stroke-width="1.5"/>' +
    /* Motor connection */
    '<rect x="68" y="44" width="4" height="8" rx="1" fill="#2a3a50"/>' +
    /* Blue LED ring on motor */
    '<g' + ringClass + ' style="transform-origin:78px 48px;' + ringGlow + '">' +
      '<circle cx="78" cy="48" r="11" fill="none" stroke="' + ringColor + '" stroke-width="3" opacity="0.9"/>' +
      '<circle cx="78" cy="48" r="7" fill="none" stroke="' + ringColor + '" stroke-width="1.5" opacity="0.5"/>' +
    '</g>' +
    /* Center impeller dot */
    '<circle cx="42" cy="48" r="5" fill="#253040"/>' +
    '<circle cx="42" cy="48" r="3" fill="' + (running ? '#22d3ee' : '#374151') + '" opacity="0.6"/>' +
    /* Status indicator */
    '<circle cx="94" cy="34" r="4" fill="' + statusDot + '" opacity="0.9"/>' +
  '</svg>';
}

// ── Filter SVG ───────────────────────────────────────────────────────────────

function buildFilterSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100" width="70" height="100">' +
    /* Pipe top */
    '<rect x="29" y="2" width="12" height="14" rx="3" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1"/>' +
    /* Dome cap */
    '<ellipse cx="35" cy="20" rx="20" ry="7" fill="#1a2030"/>' +
    '<path d="M15,20 Q15,12 35,12 Q55,12 55,20" fill="#1a2030"/>' +
    /* Main cylinder body */
    '<rect x="15" y="18" width="40" height="55" rx="4" fill="#1e2a3a"/>' +
    '<rect x="15" y="18" width="40" height="55" rx="4" fill="none" stroke="#2d3e52" stroke-width="1.5"/>' +
    /* 3D highlight on cylinder */
    '<rect x="17" y="20" width="6" height="51" rx="3" fill="white" opacity="0.04"/>' +
    /* Band lines on tank */
    '<rect x="15" y="34" width="40" height="2" rx="1" fill="#253040"/>' +
    '<rect x="15" y="55" width="40" height="2" rx="1" fill="#253040"/>' +
    /* Pressure gauge (white circle with needle) */
    '<circle cx="49" cy="38" r="10" fill="#e8e8e8"/>' +
    '<circle cx="49" cy="38" r="10" fill="none" stroke="#9ca3af" stroke-width="1"/>' +
    '<circle cx="49" cy="38" r="7" fill="none" stroke="#d1d5db" stroke-width="0.8"/>' +
    /* Gauge needle */
    '<line x1="49" y1="38" x2="53" y2="32" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="49" cy="38" r="1.5" fill="#374151"/>' +
    /* Gauge label */
    '<text x="49" y="51" text-anchor="middle" font-size="5" fill="#9ca3af">bar</text>' +
    /* Bottom pipe */
    '<rect x="26" y="73" width="18" height="10" rx="2" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1"/>' +
    '<rect x="29" y="83" width="12" height="12" rx="3" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1"/>' +
    /* Bottom ellipse (3D) */
    '<ellipse cx="35" cy="73" rx="20" ry="5" fill="#162030" opacity="0.7"/>' +
  '</svg>';
}

// ── Doser SVG ────────────────────────────────────────────────────────────────

function buildDoserSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 95" width="90" height="95">' +
    /* Mounting rack */
    '<rect x="5" y="15" width="80" height="68" rx="4" fill="#12192a" stroke="#21262d" stroke-width="1"/>' +

    /* ── LEFT BOTTLE (pH – blue) ── */
    /* Neck */
    '<rect x="16" y="18" width="18" height="10" rx="2" fill="#1e3a5f"/>' +
    '<rect x="19" y="14" width="12" height="8" rx="2" fill="#1a3050"/>' +
    /* Body */
    '<rect x="13" y="27" width="24" height="46" rx="3" fill="#1a4a7a" opacity="0.9"/>' +
    /* Fill level (65%) */
    '<rect x="14" y="44" width="22" height="28" rx="2" fill="#2176ae" opacity="0.85"/>' +
    /* Liquid shine */
    '<rect x="15" y="45" width="4" height="26" rx="2" fill="white" opacity="0.08"/>' +
    /* Label */
    '<rect x="15" y="50" width="20" height="12" rx="1" fill="#0d2a4a" opacity="0.7"/>' +
    '<text x="25" y="59" text-anchor="middle" font-size="7" font-weight="700" fill="#7dd3fc">pH</text>' +
    /* Bottle outline */
    '<rect x="13" y="27" width="24" height="46" rx="3" fill="none" stroke="#3b82f6" stroke-width="1.2"/>' +
    /* Cap */
    '<rect x="17" y="11" width="14" height="5" rx="2" fill="#93c5fd"/>' +

    /* Peristaltic pump (left) */
    '<circle cx="25" cy="82" r="6" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1"/>' +
    '<circle cx="25" cy="82" r="3" fill="#374151"/>' +
    '<line x1="13" y1="73" x2="19" y2="79" stroke="#1e3a5f" stroke-width="2" stroke-linecap="round"/>' +

    /* ── RIGHT BOTTLE (Cl – red) ── */
    /* Neck */
    '<rect x="52" y="18" width="18" height="10" rx="2" fill="#5f1e1e"/>' +
    '<rect x="55" y="14" width="12" height="8" rx="2" fill="#501a1a"/>' +
    /* Body */
    '<rect x="49" y="27" width="24" height="46" rx="3" fill="#7a1a1a" opacity="0.9"/>' +
    /* Fill level (65%) */
    '<rect x="50" y="44" width="22" height="28" rx="2" fill="#ae2121" opacity="0.85"/>' +
    /* Liquid shine */
    '<rect x="51" y="45" width="4" height="26" rx="2" fill="white" opacity="0.08"/>' +
    /* Label */
    '<rect x="51" y="50" width="20" height="12" rx="1" fill="#4a0d0d" opacity="0.7"/>' +
    '<text x="61" y="59" text-anchor="middle" font-size="7" font-weight="700" fill="#fca5a5">Cl</text>' +
    /* Bottle outline */
    '<rect x="49" y="27" width="24" height="46" rx="3" fill="none" stroke="#ef4444" stroke-width="1.2"/>' +
    /* Cap */
    '<rect x="53" y="11" width="14" height="5" rx="2" fill="#fca5a5"/>' +

    /* Peristaltic pump (right) */
    '<circle cx="61" cy="82" r="6" fill="#1e2a3a" stroke="#2d3e52" stroke-width="1"/>' +
    '<circle cx="61" cy="82" r="3" fill="#374151"/>' +
    '<line x1="73" y1="73" x2="67" y2="79" stroke="#5f1e1e" stroke-width="2" stroke-linecap="round"/>' +

  '</svg>';
}

// ── Card Class ───────────────────────────────────────────────────────────────

class PoolControlCenterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._E    = null;
    this._cfg  = {};
    LOG.debug('Card constructed, version:', CARD_VERSION);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._E) this._resolveEntities();
    this._render();
  }

  setConfig(config) {
    this._cfg = config || {};
  }

  getCardSize() { return 15; }

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
      if (st[resolved[key]]) {
        LOG.debug('Entity found:', key, '=', resolved[key]);
      } else {
        LOG.debug('Entity NOT found:', key, '(', resolved[key], ')');
      }
    }
    this._E = resolved;
    LOG.info('Entities resolved. v' + CARD_VERSION);
  }

  _val(id, def) {
    if (!this._hass || !id) return (def !== undefined) ? def : '–';
    var s = this._hass.states[id];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return (def !== undefined) ? def : '–';
    return s.state;
  }

  _isOn(id) {
    if (!this._hass || !id) return false;
    var s = this._hass.states[id];
    return !!(s && (s.state === 'on' || s.state === 'true'));
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
    var autoOn   = this._isOn(E.automation);
    var warning  = this._isOn(E.warning);
    var status   = this._val(E.status, 'unknown');
    var power    = this._val(E.power, '–');
    var voltage  = this._val(E.voltage, '–');
    var current  = this._val(E.current, '–');
    var freq     = this._val(E.frequency, '–');
    var energy   = this._val(E.energy, '–');
    var eff      = this._val(E.efficiency, '–');
    var runtime  = this._val(E.runtimeToday, '–');
    var remaining = this._val(E.remaining, '–');
    var nextStart = this._val(E.nextStart, '–');
    var target   = this._val(E.target, '–');
    var ph       = this._val(E.ph, '–');
    var redox    = this._val(E.redox, '–');
    var temp     = this._val(E.temperature, '–');
    var totalRT  = this._val(E.totalRuntime, '–');
    var seasRT   = this._val(E.seasonRuntime, '–');
    var maint    = this._val(E.maintenance, '–');
    var season   = this._val(E.seasonMode, 'auto');

    var statusLabel = STATUS_LABEL[status] || status;
    var seasonLabel = SEASON_LABEL[season]  || season;
    var seasonIcon  = SEASON_ICON[season]   || '⚙️';

    /* Progress */
    var progPct = 0;
    var rtNum = parseFloat(runtime);
    var tgNum = parseFloat(target);
    if (!isNaN(rtNum) && !isNaN(tgNum) && tgNum > 0) {
      progPct = Math.min(100, Math.round((rtNum / tgNum) * 100));
    }

    /* Maintenance countdown */
    var maintNum = parseFloat(maint);
    var maintCountdown = '–';
    if (!isNaN(maintNum)) {
      var remaining500 = Math.max(0, 500 - maintNum);
      maintCountdown = remaining500.toFixed(0);
    }

    /* SVGs */
    var poolSvg  = buildPoolSvg(running);
    var pumpSvg  = buildPumpSvg(running);
    var filtSvg  = buildFilterSvg();
    var doserSvg = buildDoserSvg();

    /* ── Header ── */
    var autoBadgeTitle = autoOn ? 'Automatik aktiv'       : 'Automatik aus';
    var autoBadgeSub   = autoOn ? 'System läuft automatisch' : 'Manueller Betrieb';
    var dotClass       = autoOn ? 'on' : 'off';

    var hdr = '<div class="hdr">' +
      '<div class="hdr-brand">' +
        '<span class="hdr-wave">≋</span>' +
        '<span class="hdr-title">Pool Control Center</span>' +
      '</div>' +
      '<div class="hdr-badges">' +
        '<div class="hbadge" id="hdr-auto-badge">' +
          '<span class="hb-dot ' + dotClass + '"></span>' +
          '<div class="hb-text"><div class="hb-title">' + autoBadgeTitle + '</div><div class="hb-sub">' + autoBadgeSub + '</div></div>' +
        '</div>' +
        '<div class="hbadge" id="hdr-season-badge">' +
          '<span class="hb-icon">' + seasonIcon + '</span>' +
          '<div class="hb-text"><div class="hb-title">Saison: ' + seasonLabel + '</div><div class="hb-sub">Betriebsmodus</div></div>' +
        '</div>' +
        '<div class="hbadge no-click hb-muted">' +
          '<div class="hb-text"><div class="hb-title">PPM v' + CARD_VERSION + '</div><div class="hb-sub">Pool Pump Manager</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Tech panel ── */
    var pumpStatus  = running ? '<span class="tech-col-status">Läuft</span>'    : '<span class="tech-col-status off">Aus</span>';
    var filtStatus  = warning ? '<span class="tech-col-status warn">Achtung</span>' : '<span class="tech-col-status">OK</span>';
    var doserStatus = '<span class="tech-col-status">OK</span>';

    var tech = '<div class="tech-panel">' +
      '<div class="tech-hdr">Technik</div>' +
      '<div class="tech-grid">' +
        /* Pump */
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">🔧</span><span class="tech-col-name">Poolpumpe</span>' + pumpStatus + '</div>' +
          '<div class="tech-visual">' + pumpSvg + '</div>' +
          '<div class="tech-col-metrics"><b>⚡ ' + power + '</b> W &nbsp; <b>⌇ ' + current + '</b> A</div>' +
        '</div>' +
        /* Filter */
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">🏺</span><span class="tech-col-name">Sandfilter</span>' + filtStatus + '</div>' +
          '<div class="tech-visual">' + filtSvg + '</div>' +
          '<div class="tech-col-metrics"><b>⊙ –</b> bar</div>' +
        '</div>' +
        /* Doser */
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">🧪</span><span class="tech-col-name">Dosieranlage</span>' + doserStatus + '</div>' +
          '<div class="tech-visual">' + doserSvg + '</div>' +
          '<div class="tech-col-metrics"><b>pH</b> ' + ph + ' &nbsp; <b>Redox</b> ' + redox + ' mV</div>' +
        '</div>' +
      '</div>' +
      '<div class="tech-sysstat">● Systemstatus: Alle Komponenten in Ordnung</div>' +
    '</div>';

    /* ── Main area ── */
    var mainArea = '<div class="main-area">' +
      '<div class="pool-area">' + poolSvg + '</div>' +
      tech +
    '</div>';

    /* ── Status bar ── */
    var statClass = running ? ' green' : '';
    var statSub   = running ? 'Pumpe aktiv' : 'Pumpe inaktiv';

    var statBar = '<div class="stat-bar">' +
      /* Status */
      '<div class="stat-cell">' +
        '<div class="stat-label">Status</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22c55e;">▶</span><span class="stat-val' + statClass + '">' + statusLabel + '</span></div>' +
        '<div class="stat-sub">' + statSub + '</div>' +
      '</div>' +
      /* Leistung */
      '<div class="stat-cell">' +
        '<div class="stat-label">Leistung</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#eab308;">⚡</span><span class="stat-val yellow">' + power + '</span><span class="stat-unit">W</span></div>' +
        '<div class="stat-sub">Aktuelle Leistung</div>' +
      '</div>' +
      /* Spannung */
      '<div class="stat-cell">' +
        '<div class="stat-label">Spannung</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">〜</span><span class="stat-val blue">' + voltage + '</span><span class="stat-unit">V</span></div>' +
        '<div class="stat-sub">Netzspannung</div>' +
      '</div>' +
      /* Strom */
      '<div class="stat-cell">' +
        '<div class="stat-label">Strom</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">⏦</span><span class="stat-val blue">' + current + '</span><span class="stat-unit">A</span></div>' +
        '<div class="stat-sub">Aktueller Strom</div>' +
      '</div>' +
      /* Frequenz */
      '<div class="stat-cell">' +
        '<div class="stat-label">Frequenz</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">⊟</span><span class="stat-val blue">' + freq + '</span><span class="stat-unit">Hz</span></div>' +
        '<div class="stat-sub">Netzfrequenz</div>' +
      '</div>' +
      /* Effizienz */
      '<div class="stat-cell">' +
        '<div class="stat-label">Effizienz</div>' +
        '<div class="stat-main"><span class="stat-ico">🌿</span><span class="stat-val green">' + eff + '</span><span class="stat-unit">%</span></div>' +
        '<div class="stat-sub">Aktuelle Effizienz</div>' +
      '</div>' +
      /* Energie */
      '<div class="stat-cell">' +
        '<div class="stat-label">Energie</div>' +
        '<div class="stat-main"><span class="stat-ico">🔋</span><span class="stat-val orange">' + energy + '</span><span class="stat-unit">Wh</span></div>' +
        '<div class="stat-sub">Heute verbraucht</div>' +
      '</div>' +
    '</div>';

    /* ── Bottom section ── */
    var toggleClass = autoOn ? 'on' : 'off';
    var toggleLbl   = autoOn ? 'EIN' : 'AUS';

    var bottom = '<div class="bottom">' +

      /* LAUFZEITEN */
      '<div class="bpanel">' +
        '<div class="bpanel-title">Laufzeiten</div>' +
        '<div class="brow"><span class="brow-ico">▷</span><span class="brow-lbl">Laufzeit heute</span><span class="brow-val">' + runtime + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">⏱</span><span class="brow-lbl">Restlaufzeit</span><span class="brow-val">' + remaining + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">⏰</span><span class="brow-lbl">Nächster Start</span><span class="brow-val">' + nextStart + '</span></div>' +
        '<div class="brow"><span class="brow-ico">🎯</span><span class="brow-lbl">Tagesziel</span><span class="brow-val">' + target + ' h</span></div>' +
        '<div class="prog-wrap"><div class="prog-fill" style="width:' + progPct + '%"></div></div>' +
        '<div class="prog-pct">' + progPct + '%</div>' +
      '</div>' +

      /* SAISON */
      '<div class="bpanel">' +
        '<div class="bpanel-title">Saison</div>' +
        '<div class="hb-sub" style="font-size:11px;">Aktuelle Saison</div>' +
        '<div class="season-name-row"><span class="season-name-icon">' + seasonIcon + '</span><span class="season-name-text">' + seasonLabel + '</span></div>' +
        '<div class="brow"><span class="brow-ico">🕐</span><span class="brow-lbl">Saisonlaufzeit</span><span class="brow-val">' + seasRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">🎯</span><span class="brow-lbl">Ziel-Laufzeit</span><span class="brow-val">' + target + ' h</span></div>' +
        '<div class="season-link" id="btn-season-cycle">' + seasonIcon + ' Saisonmodus: ' + seasonLabel + '</div>' +
      '</div>' +

      /* WASSERQUALITÄT */
      '<div class="bpanel">' +
        '<div class="bpanel-title">Wasserqualität</div>' +
        '<div class="brow"><span class="brow-ico">💧</span><span class="brow-lbl">pH-Wert</span><span class="brow-val">' + ph + '</span></div>' +
        '<div class="brow"><span class="brow-ico">⚡</span><span class="brow-lbl">Redox</span><span class="brow-val">' + redox + ' mV</span></div>' +
        '<div class="brow"><span class="brow-ico">🌡️</span><span class="brow-lbl">Temperatur</span><span class="brow-val">' + temp + ' °C</span></div>' +
        '<div class="wq-ok">✓ Alle Werte im optimalen Bereich</div>' +
      '</div>' +

      /* WARTUNG */
      '<div class="bpanel">' +
        '<div class="bpanel-title">Wartung &amp; Betriebsstunden</div>' +
        '<div class="brow"><span class="brow-ico">⚙️</span><span class="brow-lbl">Gesamt</span><span class="brow-val">' + totalRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">🌿</span><span class="brow-lbl">Saison</span><span class="brow-val">' + seasRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">🔧</span><span class="brow-lbl">Seit Wartung</span><span class="brow-val">' + maint + ' h</span></div>' +
        '<div class="maint-ok">✓ Nächste Wartung in ' + maintCountdown + ' h</div>' +
      '</div>' +

      /* STEUERUNG */
      '<div class="bpanel ctrl-panel">' +
        '<div class="ctrl-title">Steuerung</div>' +
        '<div class="ctrl-auto-row" id="btn-toggle-auto">' +
          '<span class="ctrl-auto-lbl">Automatikmodus</span>' +
          '<div class="ctrl-toggle-wrap">' +
            '<span class="ctrl-toggle-lbl ' + toggleClass + '">' + toggleLbl + '</span>' +
            '<button class="toggle-pill ' + toggleClass + '" aria-label="Automatik umschalten"></button>' +
          '</div>' +
        '</div>' +
        '<div class="ctrl-main-btns">' +
          '<button class="btn-start" id="btn-start">▶ Start</button>' +
          '<button class="btn-stop"  id="btn-stop">■ Stop</button>' +
        '</div>' +
        '<div class="ctrl-reset-btns">' +
          '<button class="btn-reset" id="btn-maint">🔧 Wartung Reset</button>' +
          '<button class="btn-reset" id="btn-season-reset">📅 Saison Reset</button>' +
        '</div>' +
        '<div>' +
          '<div class="ctrl-season-lbl">Saisonmodus</div>' +
          '<div class="ctrl-season-sel" id="btn-season-dd">' +
            '<span class="ctrl-season-val">' + seasonIcon + ' ' + seasonLabel + '</span>' +
            '<span class="ctrl-season-arrow">▾</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>';

    /* ── Nav bar ── */
    var nav = '<div class="nav">' +
      '<button class="nav-btn active" id="nav-overview"><span class="nav-ico">🏠</span><span class="nav-lbl">Übersicht</span></button>' +
      '<button class="nav-btn" id="nav-runtimes"><span class="nav-ico">🕐</span><span class="nav-lbl">Laufzeiten</span></button>' +
      '<button class="nav-btn" id="nav-settings"><span class="nav-ico">⚙️</span><span class="nav-lbl">Einstellungen</span></button>' +
      '<button class="nav-btn" id="nav-maintenance"><span class="nav-ico">🔧</span><span class="nav-lbl">Wartung</span></button>' +
      '<button class="nav-btn" id="nav-history"><span class="nav-ico">📊</span><span class="nav-lbl">Historie</span></button>' +
      '<button class="nav-btn" id="nav-info"><span class="nav-ico">ℹ</span><span class="nav-lbl">Info</span></button>' +
    '</div>';

    /* ── Assemble ── */
    var html = '<div class="pcc">' + hdr + mainArea + statBar + bottom + nav + '</div>';
    this.shadowRoot.innerHTML = '<style>' + CARD_CSS + '</style>' + html;
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

    var cycleSeason = function() {
      var cur  = self._val(E.seasonMode, 'auto');
      var idx  = SEASON_MODES.indexOf(cur);
      var next = SEASON_MODES[(idx < 0 ? 0 : idx + 1) % SEASON_MODES.length];
      LOG.debug('Saison cycle:', cur, '->', next);
      self._svc('select', 'select_option', { entity_id: E.seasonMode, option: next });
    };

    var elHdrAuto = $('hdr-auto-badge');
    if (elHdrAuto) elHdrAuto.addEventListener('click', toggleAuto);

    var elHdrSeason = $('hdr-season-badge');
    if (elHdrSeason) elHdrSeason.addEventListener('click', cycleSeason);

    var elToggle = $('btn-toggle-auto');
    if (elToggle) elToggle.addEventListener('click', function() { fx(elToggle); toggleAuto(); });

    var elStart = $('btn-start');
    if (elStart) elStart.addEventListener('click', function() {
      fx(elStart);
      LOG.debug('Start geklickt');
      self._svc('pool_pump_manager', 'start_now', {});
    });

    var elStop = $('btn-stop');
    if (elStop) elStop.addEventListener('click', function() {
      fx(elStop);
      LOG.debug('Stop geklickt');
      self._svc('pool_pump_manager', 'stop_now', {});
    });

    var elMaint = $('btn-maint');
    if (elMaint) elMaint.addEventListener('click', function() {
      fx(elMaint);
      LOG.debug('Wartung Reset geklickt');
      self._svc('button', 'press', { entity_id: E.btnMaint });
    });

    var elSeaReset = $('btn-season-reset');
    if (elSeaReset) elSeaReset.addEventListener('click', function() {
      fx(elSeaReset);
      LOG.debug('Saison Reset geklickt');
      self._svc('button', 'press', { entity_id: E.btnSeason });
    });

    var elSeaCycle = $('btn-season-cycle');
    if (elSeaCycle) elSeaCycle.addEventListener('click', cycleSeason);

    var elSeaDd = $('btn-season-dd');
    if (elSeaDd) elSeaDd.addEventListener('click', cycleSeason);
  }
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
    description: 'Pool Pump Manager – Professional Dashboard v' + CARD_VERSION,
  });
}
