'use strict';

/**
 * Pool Control Center – Custom Lovelace Card v0.6.2
 * Optimistic UI, improved pump animation, runtime charts, 4-button nav,
 * diagnostics in gear modal, pool image file picker.
 */

const CARD_VERSION = '0.6.2';

const LOG = {
  info:  function() { var a = ['%c[PCC]%c', 'color:#22d3ee;font-weight:700', '']; for (var i=0;i<arguments.length;i++) a.push(arguments[i]); console.info.apply(console, a); },
  debug: function() { var a = ['[PCC]']; for (var i=0;i<arguments.length;i++) a.push(arguments[i]); console.debug.apply(console, a); },
  warn:  function() { var a = ['[PCC]']; for (var i=0;i<arguments.length;i++) a.push(arguments[i]); console.warn.apply(console, a); },
};

const SEASON_MODES = ['auto', 'spring', 'summer', 'autumn', 'winter'];
const SEASON_LABEL = { auto: 'Auto', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter' };
const SEASON_ICON  = { auto: '⚙️', spring: '\U0001f338', summer: '☀️', autumn: '\U0001f342', winter: '❄️' };

const STATUS_LABEL = {
  running: 'Läuft', waiting: 'Warten', scheduled: 'Geplant',
  completed: 'Fertig', manual: 'Manuell', unknown: 'Unbekannt',
};

const ENTITY_DEFAULTS = {
  automation:    'switch.pool_pump_manager_automation_enabled',
  running:       'binary_sensor.pool_pump_manager_running',
  warning:       'binary_sensor.pool_pump_manager_warning',
  status:        'sensor.pool_pump_manager_status',
  power:         'sensor.pool_pump_manager_metering_power',
  energy:        'sensor.pool_pump_manager_metering_energy',
  voltage:       'sensor.pool_pump_manager_metering_voltage',
  current:       'sensor.pool_pump_manager_metering_current',
  frequency:     'sensor.pool_pump_manager_metering_frequency',
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
  power:       ['sensor.pool_pump_manager_power','sensor.pool_pump_manager_leistung'],
  voltage:     ['sensor.pool_pump_manager_voltage','sensor.pool_pump_manager_spannung'],
  current:     ['sensor.pool_pump_manager_current','sensor.pool_pump_manager_strom'],
  frequency:   ['sensor.pool_pump_manager_frequency','sensor.pool_pump_manager_hz'],
  energy:      ['sensor.pool_pump_manager_energy','sensor.pool_pump_manager_verbrauch'],
};

// ── CSS ──────────────────────────────────────────────────────────────────────

const CARD_CSS = '' +
':host{display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e6edf3;background:#0d1117;}' +
'*{box-sizing:border-box;margin:0;padding:0;}' +
'.pcc{background:#0d1117;border-radius:12px;overflow:hidden;position:relative;}' +

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

/* STATUS RUN BADGE */
'.srb{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#161b22;border:1px solid #21262d;border-radius:8px;cursor:pointer;white-space:nowrap;}' +
'.srb:hover{border-color:#373e47;background:#1c2128;}' +
'.srb-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}' +
'.srb-dot.run{background:#22c55e;animation:pulse-green 2s infinite;}' +
'.srb-dot.stop{background:#6b7280;}' +
'.srb-text{font-size:13px;font-weight:600;line-height:1.3;}' +
'.srb-text.run{color:#22c55e;}' +
'.srb-text.stop{color:#6b7280;}' +
'.srb-sub{font-size:11px;color:#7d8590;line-height:1.3;}' +

/* MAIN AREA */
'.main-area{display:flex;height:340px;border-bottom:1px solid #21262d;overflow:hidden;}' +
'.pool-area{flex:0 0 60%;overflow:hidden;position:relative;background:#040810;}' +
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

/* PUMP ANIMATION */
'@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg)}}' +
'.pump-ring-run{transform-origin:88px 50px;transform-box:fill-box;animation:spin 2s linear infinite;}' +
'.pump-rotor-run{transform-origin:44px 50px;transform-box:fill-box;animation:spin 1.2s linear infinite;}' +
'@keyframes pulse-ring{0%,100%{opacity:0.25;}50%{opacity:0.6;}}' +
'.pump-status-ring-run{animation:pulse-ring 2s ease-in-out infinite;}' +

/* POOL HERO */
'.pool-hero{position:relative;width:100%;height:100%;overflow:hidden;background:#040810;}' +
'.pool-hero>*{position:absolute;}' +
'.ph-sky{inset:0;}' +
'.ph-foliage{top:0;left:0;right:0;height:62%;}' +
'.ph-deck{left:0;right:0;bottom:0;height:58%;}' +
'.ph-lamps{inset:0;pointer-events:none;}' +
'.ph-pool-glow{border-radius:50%;pointer-events:none;}' +
'.ph-pool-rim{border-radius:50%;pointer-events:none;}' +
'.ph-pool-water{border-radius:50%;overflow:hidden;}' +
'.ph-uwl{position:absolute;border-radius:50%;pointer-events:none;}' +
'.ph-palm{pointer-events:none;}' +
'.ph-furniture{pointer-events:none;}' +
'.ph-vignette{pointer-events:none;}' +
'@keyframes pool-ripple{0%{transform:translate(-50%,-50%) scale(0.3);opacity:0.7;}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0;}}' +
'.ph-ripple{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40%;height:55%;border-radius:50%;border:1.5px solid rgba(0,229,255,0.45);animation:pool-ripple 3s ease-out infinite;pointer-events:none;}' +
'.ph-ripple-2{animation-delay:1.5s;}' +
'.ph-user-img{z-index:20;background-size:cover;background-position:center;pointer-events:none;}' +

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
'.btn-start{background:#16a34a;color:white;border:none;border-radius:8px;padding:11px 8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background .2s;position:relative;z-index:10;pointer-events:all;}' +
'.btn-start:hover{background:#15803d;}' +
'.btn-stop{background:#dc2626;color:white;border:none;border-radius:8px;padding:11px 8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background .2s;position:relative;z-index:10;pointer-events:all;}' +
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
'.nav-lbl{font-size:10px;font-weight:500;}' +
'.nav-btn{position:relative;}' +
'.nav-btn.active::after{content:"";position:absolute;bottom:0;left:22%;right:22%;height:2px;background:#22d3ee;border-radius:2px 2px 0 0;}' +

/* PAGE CONTENT */
'@keyframes page-in{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}' +
'.page-body{padding:20px;display:flex;flex-direction:column;gap:14px;animation:page-in .18s ease;}' +
'.page-hdr{font-size:11px;font-weight:700;letter-spacing:0.15em;color:#7d8590;text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid #21262d;}' +
'.page-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}' +
'.page-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;}' +
'.pc-lbl{font-size:10px;color:#7d8590;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;}' +
'.pc-val{font-size:22px;font-weight:700;color:#e6edf3;line-height:1.2;}' +
'.pc-sub{font-size:11px;color:#7d8590;word-break:break-all;font-family:monospace;}' +
'.page-note{font-size:12px;color:#7d8590;background:#161b22;border:1px solid #21262d;border-radius:8px;padding:12px 14px;line-height:1.6;}' +
'.page-note code{background:#21262d;padding:1px 5px;border-radius:3px;font-size:11px;color:#22d3ee;font-family:monospace;}' +
'.page-sub-hdr{font-size:10px;font-weight:700;letter-spacing:0.1em;color:#7d8590;text-transform:uppercase;margin-top:4px;}' +

/* RUNTIMES PAGE */
'.rt-section{display:flex;flex-direction:column;gap:8px;}' +
'.rt-sec-title{font-size:10px;font-weight:700;letter-spacing:0.1em;color:#22d3ee;text-transform:uppercase;}' +
'.rt-today-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}' +
'.rt-today-stat{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:10px 12px;}' +
'.rt-today-lbl{font-size:10px;color:#7d8590;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;}' +
'.rt-today-val{font-size:18px;font-weight:700;color:#e6edf3;line-height:1.2;}' +
'.rt-today-bar-wrap{background:#21262d;border-radius:8px;height:24px;width:100%;overflow:hidden;}' +
'.rt-today-bar-fill{height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:8px;transition:width .5s;display:flex;align-items:center;padding-left:10px;min-width:32px;}' +
'.rt-today-bar-pct{font-size:11px;font-weight:700;color:white;white-space:nowrap;}' +
'.rt-today-bar-labels{display:flex;justify-content:space-between;font-size:10px;color:#7d8590;margin-top:3px;}' +

'.rt-week-grid{display:flex;gap:6px;align-items:stretch;height:100px;}' +
'.rt-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;}' +
'.rt-bar-val{font-size:9px;color:#7d8590;height:16px;display:flex;align-items:center;}' +
'.rt-bar-outer{flex:1;width:100%;background:#21262d;border-radius:4px 4px 0 0;position:relative;min-height:4px;}' +
'.rt-bar-inner{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:4px 4px 0 0;transition:height .5s;}' +
'.rt-bar-inner.today{background:linear-gradient(180deg,#22d3ee,#0891b2);}' +
'.rt-bar-day{font-size:10px;font-weight:600;color:#7d8590;height:16px;display:flex;align-items:center;}' +
'.rt-bar-day.today{color:#22d3ee;font-weight:700;}' +

'.rt-month-grid{display:flex;gap:2px;align-items:flex-end;height:40px;margin-top:4px;}' +
'.rt-month-bar{flex:1;border-radius:2px 2px 0 0;background:#21262d;min-height:2px;}' +
'.rt-month-bar.filled{background:#22c55e;}' +
'.rt-month-bar.today{background:#22d3ee;}' +

/* SETTINGS PAGE */
'.set-section{display:flex;flex-direction:column;gap:8px;}' +
'.set-lbl{font-size:11px;font-weight:700;color:#7d8590;text-transform:uppercase;letter-spacing:0.08em;}' +
'.set-note{font-size:12px;color:#7d8590;line-height:1.6;}' +
'.season-btns{display:flex;gap:8px;flex-wrap:wrap;}' +
'.sbtn{padding:8px 14px;border:1px solid #21262d;border-radius:8px;background:#161b22;color:#7d8590;font-size:13px;cursor:pointer;transition:all .2s;position:relative;z-index:10;pointer-events:all;}' +
'.sbtn:hover{border-color:#373e47;color:#e6edf3;}' +
'.sbtn.active{background:rgba(34,211,238,0.1);border-color:#22d3ee;color:#22d3ee;font-weight:600;}' +

/* MAINTENANCE PAGE */
'.maint-row{display:flex;gap:12px;margin-top:4px;}' +
'.btn-maint-lg{flex:1;padding:14px;background:transparent;border:1px solid #21262d;border-radius:8px;color:#e6edf3;font-size:13px;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s;display:flex;align-items:center;justify-content:center;gap:6px;position:relative;z-index:10;pointer-events:all;}' +
'.btn-maint-lg:hover{background:#21262d;border-color:#373e47;}' +

/* TOAST NOTIFICATIONS */
'.toast-wrap{position:absolute;top:60px;left:50%;transform:translateX(-50%);z-index:400;pointer-events:none;white-space:nowrap;}' +
'.toast{display:inline-block;background:#161b22;border:1px solid #373e47;border-radius:8px;padding:8px 16px;font-size:13px;color:#e6edf3;animation:toast-in .15s ease;box-shadow:0 6px 20px rgba(0,0,0,0.6);}' +
'@keyframes toast-in{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}' +
'.toast.ok{border-color:#22c55e;color:#22c55e;}' +
'.toast.err{border-color:#ef4444;color:#ef4444;}' +

/* WARNING BADGE */
'.warn-badge{display:flex;align-items:center;gap:5px;padding:7px 10px;background:rgba(234,179,8,0.12);border:1px solid #eab308;border-radius:8px;color:#eab308;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;transition:background .2s;position:relative;z-index:10;pointer-events:all;}' +
'.warn-badge:hover{background:rgba(234,179,8,0.22);}' +

/* GEAR BUTTON */
'.gear-btn{background:transparent;border:1px solid #21262d;color:#7d8590;font-size:18px;cursor:pointer;padding:7px 10px;border-radius:8px;line-height:1;transition:color .2s,background .2s,border-color .2s;position:relative;z-index:10;pointer-events:all;flex-shrink:0;}' +
'.gear-btn:hover{color:#e6edf3;background:#21262d;border-color:#373e47;}' +
'.gear-btn.open{color:#22d3ee;border-color:#22d3ee;background:rgba(34,211,238,0.08);}' +

/* SETTINGS MODAL */
'.settings-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.78);z-index:200;display:flex;align-items:flex-start;justify-content:flex-end;padding:64px 14px 14px;backdrop-filter:blur(3px);}' +
'.settings-panel{background:#161b22;border:1px solid #373e47;border-radius:12px;width:320px;max-height:calc(100% - 20px);overflow-y:auto;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.7);animation:modal-in .15s ease;}' +
'@keyframes modal-in{from{opacity:0;transform:translateY(-8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}' +
'.settings-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #21262d;flex-shrink:0;}' +
'.settings-hdr-title{font-size:14px;font-weight:700;color:#e6edf3;}' +
'.settings-close{background:transparent;border:1px solid transparent;color:#7d8590;font-size:16px;cursor:pointer;padding:4px 7px;line-height:1;border-radius:5px;pointer-events:all;}' +
'.settings-close:hover{color:#e6edf3;background:#21262d;border-color:#373e47;}' +
'.settings-section{padding:14px 18px;border-bottom:1px solid #21262d;}' +
'.settings-section:last-child{border-bottom:none;}' +
'.settings-stitle{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7d8590;margin-bottom:10px;display:flex;align-items:center;gap:8px;}' +
'.settings-note{font-size:11px;color:#7d8590;margin-bottom:10px;line-height:1.55;}' +
'.settings-note code{background:#0d1117;padding:1px 5px;border-radius:3px;font-size:10px;color:#22d3ee;font-family:monospace;}' +
'.settings-img-preview{width:100%;height:56px;border-radius:6px;background:#0d1117;border:1px solid #21262d;background-size:cover;background-position:center;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#7d8590;}' +
'.file-pick-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px 12px;background:#21262d;border:1px solid #373e47;border-radius:6px;color:#e6edf3;font-size:12px;font-weight:500;cursor:pointer;margin-bottom:8px;pointer-events:all;}' +
'.file-pick-btn:hover{background:#373e47;}' +
'.settings-input{width:100%;background:#0d1117;border:1px solid #21262d;border-radius:6px;color:#e6edf3;font-size:12px;padding:7px 10px;font-family:monospace;box-sizing:border-box;margin-bottom:8px;}' +
'.settings-input:focus{outline:none;border-color:#22d3ee;}' +
'.settings-btns{display:flex;gap:8px;}' +
'.settings-btn{padding:7px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:none;background:#22d3ee;color:#0d1117;transition:background .2s;pointer-events:all;}' +
'.settings-btn:hover{background:#67e8f9;}' +
'.settings-btn.sec{background:#21262d;color:#e6edf3;border:1px solid #373e47;}' +
'.settings-btn.sec:hover{background:#373e47;}' +
'.settings-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
'.settings-row-lbl{font-size:12px;color:#e6edf3;font-weight:500;}' +
'.settings-row-sub{font-size:10px;color:#7d8590;margin-top:2px;}' +

/* DIAGNOSTICS IN MODAL */
'.diag-entities{display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto;margin-top:8px;}' +
'.diag-row{display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:4px;background:#0d1117;font-size:10px;}' +
'.diag-sym{width:12px;text-align:center;flex-shrink:0;font-size:11px;}' +
'.diag-sym.ok{color:#22c55e;}' +
'.diag-sym.warn{color:#f59e0b;}' +
'.diag-sym.miss{color:#ef4444;}' +
'.diag-key{color:#7d8590;min-width:80px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
'.diag-val{color:#e6edf3;font-weight:500;margin-left:auto;white-space:nowrap;}' +
'.diag-val.unavail{color:#6b7280;}' +
'.diag-summary{font-size:11px;color:#7d8590;margin-bottom:6px;}' +
'.diag-summary span.ok{color:#22c55e;}' +
'.diag-summary span.warn{color:#f59e0b;}' +
'.diag-summary span.miss{color:#ef4444;}';

// ── Pool Hero ─────────────────────────────────────────────────────────────────

function buildPoolHero(running, imgUrl) {
  var ripples = running ?
    '<div class="ph-ripple"></div><div class="ph-ripple ph-ripple-2"></div>' : '';
  var userImgLayer = imgUrl ?
    '<div class="ph-user-img" style="inset:0;background-image:url(\'' + imgUrl + '\');"></div>' : '';

  return '<div class="pool-hero">' +
    '<div class="ph-sky" style="background:radial-gradient(ellipse 130% 55% at 50% -5%,#0b230a 0%,transparent 55%),radial-gradient(ellipse 55% 60% at 3% 25%,#061406 0%,transparent 45%),radial-gradient(ellipse 45% 50% at 97% 25%,#061406 0%,transparent 45%),linear-gradient(to bottom,#040810 0%,#0a1520 100%);filter:blur(3px);"></div>' +
    '<div class="ph-foliage" style="background:radial-gradient(ellipse 40% 80% at 8% 85%,rgba(4,16,4,0.95) 0%,transparent 100%),radial-gradient(ellipse 30% 70% at 22% 90%,rgba(7,22,7,0.9) 0%,transparent 100%),radial-gradient(ellipse 35% 75% at 38% 88%,rgba(5,18,5,0.92) 0%,transparent 100%),radial-gradient(ellipse 40% 80% at 55% 90%,rgba(6,20,6,0.9) 0%,transparent 100%),radial-gradient(ellipse 30% 70% at 72% 85%,rgba(7,22,7,0.88) 0%,transparent 100%),radial-gradient(ellipse 35% 75% at 88% 88%,rgba(5,18,5,0.9) 0%,transparent 100%),radial-gradient(ellipse 25% 60% at 95% 80%,rgba(4,14,4,0.92) 0%,transparent 100%);filter:blur(5px);"></div>' +
    '<div class="ph-deck" style="background:repeating-linear-gradient(0deg,transparent 0px,transparent 11px,rgba(0,0,0,0.28) 11px,rgba(0,0,0,0.28) 12px),repeating-linear-gradient(90deg,transparent 0px,transparent 120px,rgba(0,0,0,0.05) 120px,rgba(0,0,0,0.05) 121px),linear-gradient(to bottom,#4e3014 0%,#3d2510 35%,#2e1b0a 75%,#201208 100%);"></div>' +
    '<div class="ph-lamps" style="background:radial-gradient(ellipse 7% 5% at 13% 82%,rgba(255,140,30,0.55) 0%,transparent 100%),radial-gradient(ellipse 7% 5% at 25% 90%,rgba(255,130,20,0.5) 0%,transparent 100%),radial-gradient(ellipse 8% 5% at 38% 94%,rgba(255,135,25,0.45) 0%,transparent 100%),radial-gradient(ellipse 7% 5% at 51% 93%,rgba(255,130,20,0.45) 0%,transparent 100%),radial-gradient(ellipse 7% 5% at 64% 90%,rgba(255,140,30,0.5) 0%,transparent 100%),radial-gradient(ellipse 7% 5% at 77% 83%,rgba(255,135,25,0.5) 0%,transparent 100%),radial-gradient(ellipse 6% 4% at 88% 78%,rgba(255,140,30,0.45) 0%,transparent 100%);"></div>' +
    '<div class="ph-pool-glow" style="left:14%;right:11%;top:38%;bottom:10%;box-shadow:0 0 60px 30px rgba(0,200,255,0.15),0 0 120px 60px rgba(0,150,200,0.08);"></div>' +
    '<div class="ph-pool-rim" style="left:14%;right:11%;top:38%;bottom:10%;border:3px solid rgba(160,185,210,0.45);box-shadow:inset 0 0 20px rgba(0,50,100,0.5);"></div>' +
    '<div class="ph-pool-water" style="left:14.5%;right:11.5%;top:38.5%;bottom:10.5%;background:radial-gradient(ellipse at 42% 32%,#00e8ff 0%,#00c8e8 12%,#00a0c8 30%,#0077b6 58%,#024e9a 80%,#02307a 100%);">' +
      '<div class="ph-uwl" style="left:18%;top:25%;width:32%;height:50%;background:radial-gradient(ellipse at center,rgba(255,255,255,0.75) 0%,rgba(100,250,255,0.35) 35%,transparent 70%);"></div>' +
      '<div class="ph-uwl" style="left:40%;top:18%;width:28%;height:45%;background:radial-gradient(ellipse at center,rgba(255,255,255,0.65) 0%,rgba(80,240,255,0.3) 30%,transparent 65%);"></div>' +
      '<div class="ph-uwl" style="left:62%;top:28%;width:30%;height:48%;background:radial-gradient(ellipse at center,rgba(255,255,255,0.7) 0%,rgba(90,245,255,0.32) 32%,transparent 68%);"></div>' +
      ripples +
    '</div>' +
    '<div class="ph-palm" style="left:0;top:0;width:16%;height:68%;background-image:url(\'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 80 200%22%3E%3Cpath d%3D%22M40 200 C39 170 37 140 38 110 C39 80 41 60 42 45 C43 60 44 80 45 110 C46 140 43 170 42 200Z%22 fill%3D%22%23100804%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2222%22 ry%3D%228%22 fill%3D%22%23071207%22 opacity%3D%220.9%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2228%22 ry%3D%225%22 fill%3D%22%23091509%22 opacity%3D%220.8%22 transform%3D%22rotate(-20 42 45)%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2225%22 ry%3D%225%22 fill%3D%22%23091509%22 opacity%3D%220.8%22 transform%3D%22rotate(25 42 45)%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2220%22 ry%3D%224%22 fill%3D%22%23071207%22 opacity%3D%220.7%22 transform%3D%22rotate(-45 42 45)%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2220%22 ry%3D%224%22 fill%3D%22%23071207%22 opacity%3D%220.7%22 transform%3D%22rotate(50 42 45)%22%2F%3E%3C%2Fsvg%3E\');background-repeat:no-repeat;background-position:center bottom;background-size:contain;opacity:0.85;filter:blur(1px);"></div>' +
    '<div class="ph-furniture" style="right:22%;top:38%;width:20%;height:28%;background:radial-gradient(ellipse 55% 25% at 50% 15%,rgba(15,15,30,0.88) 0%,transparent 100%),linear-gradient(to bottom,transparent 20%,rgba(15,15,30,0.72) 20%,rgba(15,15,30,0.72) 75%,transparent 75%);background-size:70% 100%,3px 55%;background-position:center top,center 20%;background-repeat:no-repeat;"></div>' +
    '<div class="ph-vignette" style="inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 40%,rgba(0,0,0,0.4) 100%);"></div>' +
    userImgLayer +
  '</div>';
}

// ── Pump SVG (spinning rotor + pulsing status ring) ───────────────────────────

function buildPumpSvg(running) {
  var ringGlow    = running ? 'filter:drop-shadow(0 0 6px #22d3ee) drop-shadow(0 0 12px #0099cc);' : '';
  var ringClass   = running ? ' class="pump-ring-run"' : '';
  var statusDot   = running ? '#22c55e' : '#374151';
  var rotorClass  = running ? 'class="pump-rotor-run"' : '';
  var rotorColor  = running ? '#22d3ee' : '#374151';
  var rotorOpacity = running ? '0.85' : '0.45';
  var statusRingClass = running ? 'class="pump-status-ring-run"' : '';
  var statusRingColor = running ? '#22c55e' : '#2a3a50';

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90">' +
    '<defs>' +
      '<radialGradient id="pg-vol" cx="38%" cy="35%" r="65%">' +
        '<stop offset="0%" stop-color="#2d3c50"/>' +
        '<stop offset="100%" stop-color="#0e1620"/>' +
      '</radialGradient>' +
      '<linearGradient id="pg-mot" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#1a2535"/>' +
        '<stop offset="100%" stop-color="#0e1620"/>' +
      '</linearGradient>' +
      '<linearGradient id="pg-pip" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#1e2d3e"/>' +
        '<stop offset="100%" stop-color="#0e1820"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<rect x="8" y="74" width="104" height="10" rx="3" fill="#0f1822"/>' +
    '<rect x="8" y="74" width="104" height="3" rx="3" fill="rgba(255,255,255,0.05)"/>' +
    '<circle cx="44" cy="50" r="28" fill="none" stroke="' + statusRingColor + '" stroke-width="2" opacity="0.3" ' + statusRingClass + '/>' +
    '<ellipse cx="44" cy="50" rx="30" ry="22" fill="url(#pg-vol)"/>' +
    '<ellipse cx="36" cy="41" rx="11" ry="6" fill="rgba(255,255,255,0.05)"/>' +
    '<rect x="6" y="43" width="16" height="14" rx="4" fill="url(#pg-pip)"/>' +
    '<rect x="2" y="45" width="6" height="10" rx="2" fill="#0b1520"/>' +
    '<rect x="36" y="28" width="12" height="14" rx="3" fill="url(#pg-pip)"/>' +
    '<rect x="68" y="32" width="40" height="36" rx="8" fill="url(#pg-mot)"/>' +
    '<rect x="69" y="33" width="4" height="34" rx="2" fill="rgba(255,255,255,0.06)"/>' +
    '<rect x="64" y="44" width="6" height="10" rx="1" fill="#1a2a3a"/>' +
    '<g' + ringClass + ' style="transform-origin:88px 50px;' + ringGlow + '">' +
      (running ?
        '<circle cx="88" cy="50" r="17" fill="none" stroke="#22d3ee" stroke-width="4" opacity="0.12"/>' +
        '<circle cx="88" cy="50" r="13" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.9"/>' +
        '<circle cx="88" cy="50" r="9" fill="none" stroke="#00e5ff" stroke-width="1.5" opacity="0.55"/>' :
        '<circle cx="88" cy="50" r="13" fill="none" stroke="#2a3a50" stroke-width="3" opacity="0.8"/>'
      ) +
    '</g>' +
    '<g ' + rotorClass + ' style="transform-origin:44px 50px;">' +
      '<line x1="44" y1="50" x2="44" y2="36" stroke="' + rotorColor + '" stroke-width="2.5" stroke-linecap="round" opacity="' + rotorOpacity + '"/>' +
      '<line x1="44" y1="50" x2="57" y2="58" stroke="' + rotorColor + '" stroke-width="2.5" stroke-linecap="round" opacity="' + rotorOpacity + '"/>' +
      '<line x1="44" y1="50" x2="31" y2="58" stroke="' + rotorColor + '" stroke-width="2.5" stroke-linecap="round" opacity="' + rotorOpacity + '"/>' +
    '</g>' +
    '<circle cx="44" cy="50" r="4" fill="' + (running ? '#22d3ee' : '#1a2535') + '" opacity="0.9"/>' +
    '<circle cx="110" cy="32" r="4" fill="' + statusDot + '" opacity="0.9"/>' +
  '</svg>';
}

// ── Filter SVG ────────────────────────────────────────────────────────────────

function buildFilterSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120" width="80" height="120">' +
    '<defs><linearGradient id="fg-cyl" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#1a2530"/><stop offset="30%" stop-color="#243344"/><stop offset="70%" stop-color="#1e2c3c"/><stop offset="100%" stop-color="#0e1520"/></linearGradient></defs>' +
    '<rect x="0" y="28" width="14" height="8" rx="3" fill="#131b26"/>' +
    '<rect x="66" y="74" width="14" height="8" rx="3" fill="#131b26"/>' +
    '<rect x="12" y="18" width="56" height="80" rx="2" fill="url(#fg-cyl)"/>' +
    '<rect x="14" y="20" width="5" height="76" rx="2" fill="rgba(255,255,255,0.04)"/>' +
    '<ellipse cx="40" cy="18" rx="28" ry="10" fill="#1e2c3c"/>' +
    '<ellipse cx="40" cy="8" rx="18" ry="7" fill="#141e2c"/>' +
    '<ellipse cx="40" cy="98" rx="28" ry="10" fill="#141e2c"/>' +
    '<rect x="12" y="33" width="56" height="3" rx="1" fill="rgba(0,0,0,0.4)"/>' +
    '<rect x="12" y="76" width="56" height="3" rx="1" fill="rgba(0,0,0,0.4)"/>' +
    '<circle cx="40" cy="55" r="16" fill="#e8eaed"/>' +
    '<circle cx="40" cy="55" r="14" fill="#f4f5f6"/>' +
    '<line x1="40" y1="42" x2="40" y2="45" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="51" y1="45" x2="49" y2="47" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="54" y1="55" x2="51" y2="55" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="29" y1="45" x2="31" y2="47" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="26" y1="55" x2="29" y2="55" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="40" y1="55" x2="48" y2="46" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="40" cy="55" r="2.5" fill="#6b7280"/>' +
    '<circle cx="40" cy="55" r="16" fill="none" stroke="#9ca3af" stroke-width="1"/>' +
    '<text x="40" y="67" text-anchor="middle" font-size="5" fill="#6b7280">bar</text>' +
    '<rect x="26" y="98" width="28" height="14" rx="3" fill="#131b26"/>' +
  '</svg>';
}

// ── Doser SVG ─────────────────────────────────────────────────────────────────

function buildDoserSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100" width="110" height="100">' +
    '<rect x="17" y="6" width="20" height="8" rx="3" fill="#2040a0"/>' +
    '<rect x="19" y="13" width="16" height="9" rx="3" fill="rgba(15,30,70,0.85)"/>' +
    '<rect x="9" y="21" width="36" height="64" rx="6" fill="rgba(10,22,55,0.75)" stroke="rgba(100,150,220,0.35)" stroke-width="1"/>' +
    '<rect x="10" y="42" width="34" height="42" rx="0" fill="rgba(30,80,190,0.65)"/>' +
    '<rect x="12" y="23" width="5" height="58" rx="2" fill="rgba(255,255,255,0.1)"/>' +
    '<rect x="13" y="49" width="28" height="20" rx="3" fill="rgba(240,245,255,0.88)"/>' +
    '<text x="27" y="63" text-anchor="middle" font-size="9" font-weight="700" fill="#1a3060">pH</text>' +
    '<rect x="73" y="6" width="20" height="8" rx="3" fill="#b01010"/>' +
    '<rect x="75" y="13" width="16" height="9" rx="3" fill="rgba(70,15,15,0.85)"/>' +
    '<rect x="65" y="21" width="36" height="64" rx="6" fill="rgba(55,10,10,0.75)" stroke="rgba(220,80,80,0.35)" stroke-width="1"/>' +
    '<rect x="66" y="42" width="34" height="42" rx="0" fill="rgba(165,20,20,0.65)"/>' +
    '<rect x="68" y="23" width="5" height="58" rx="2" fill="rgba(255,255,255,0.1)"/>' +
    '<rect x="69" y="49" width="28" height="20" rx="3" fill="rgba(255,240,240,0.88)"/>' +
    '<text x="83" y="63" text-anchor="middle" font-size="9" font-weight="700" fill="#600d0d">Cl</text>' +
  '</svg>';
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function fmtTimestamp(iso) {
  if (!iso || iso === 'unknown' || iso === 'unavailable' || iso === '–') return '–';
  try {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    var now = new Date();
    var h = d.getHours().toString();
    var m = d.getMinutes();
    m = m < 10 ? '0' + m : '' + m;
    var isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    var isTomorrow = (d - now) < 86400000 && !isToday && d > now;
    var prefix = isToday ? 'Heute ' : (isTomorrow ? 'Morgen ' : '');
    return prefix + h + ':' + m + ' Uhr';
  } catch (e) { return iso; }
}

// ── Diagnostics rows builder (used in gear modal) ─────────────────────────────

function buildDiagRows(E, hass) {
  if (!E || !hass || !hass.states) return '<div class="diag-summary">Keine Daten.</div>';

  var DISPLAY_NAMES = {
    automation:'Automatik', running:'Pumpe läuft', warning:'Warnung', status:'Status',
    power:'Leistung', energy:'Energie', voltage:'Spannung', current:'Strom', frequency:'Frequenz',
    runtimeToday:'Laufzeit heute', remaining:'Restlaufzeit', target:'Tagesziel',
    efficiency:'Effizienz', nextStart:'Nächster Start', totalRuntime:'Gesamtlaufzeit',
    seasonRuntime:'Saisonlaufzeit', maintenance:'Seit Wartung', seasonMode:'Saisonmodus',
    ph:'pH', redox:'Redox', temperature:'Temperatur', btnMaint:'Reset Wartung', btnSeason:'Reset Saison',
  };
  var PLACEHOLDER = { ph: true, redox: true, temperature: true };
  var METERING    = { power: true, energy: true, voltage: true, current: true, frequency: true };

  var cntOk = 0, cntWarn = 0, cntMiss = 0;
  var rows = '';
  var keys = Object.keys(E);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actId = E[key];
    var stateObj = hass.states[actId];
    var rawState = stateObj ? stateObj.state : null;
    var isUnavail = rawState === 'unavailable' || rawState === 'unknown';
    var sym, symCls, valCls, displayVal;

    if (!stateObj) {
      sym = '✗'; symCls = 'miss'; cntMiss++;
      displayVal = 'fehlt';
    } else if (isUnavail && (PLACEHOLDER[key] || METERING[key])) {
      sym = '?'; symCls = 'warn'; cntWarn++;
      displayVal = 'n/a';
    } else if (isUnavail) {
      sym = '?'; symCls = 'warn'; cntWarn++;
      displayVal = 'unavail';
    } else {
      sym = '✓'; symCls = 'ok'; cntOk++;
      var unit = stateObj.attributes && stateObj.attributes.unit_of_measurement ? stateObj.attributes.unit_of_measurement : '';
      displayVal = rawState + (unit ? ' ' + unit : '');
    }
    valCls = (isUnavail || !stateObj) ? 'diag-val unavail' : 'diag-val';

    rows += '<div class="diag-row">' +
      '<span class="diag-sym ' + symCls + '">' + sym + '</span>' +
      '<span class="diag-key" title="' + actId + '">' + (DISPLAY_NAMES[key] || key) + '</span>' +
      '<span class="' + valCls + '">' + displayVal + '</span>' +
    '</div>';
  }

  var summary = '<div class="diag-summary">' +
    '<span class="ok">✓ ' + cntOk + '</span> ok' +
    (cntWarn ? ' &nbsp;<span class="warn">? ' + cntWarn + '</span> n/a' : '') +
    (cntMiss ? ' &nbsp;<span class="miss">✗ ' + cntMiss + '</span> fehlt' : '') +
    ' &nbsp;&middot; PPM v' + CARD_VERSION +
  '</div>';

  return summary + '<div class="diag-entities">' + rows + '</div>';
}

// ── Page Builders ─────────────────────────────────────────────────────────────

function buildPageRuntimes(runtime, remaining, nextStart, target, progPct, seasRT, totalRT, weekData, monthData) {
  var todayBarStyle = 'width:' + progPct + '%';

  var weekBars = '';
  for (var wi = 0; wi < weekData.length; wi++) {
    var wd = weekData[wi];
    var valTxt = wd.val > 0 ? (Math.round(wd.val * 10) / 10) + 'h' : '-';
    weekBars +=
      '<div class="rt-bar-wrap">' +
        '<div class="rt-bar-val">' + valTxt + '</div>' +
        '<div class="rt-bar-outer"><div class="rt-bar-inner' + (wd.today ? ' today' : '') + '" style="height:' + wd.pct + '%"></div></div>' +
        '<div class="rt-bar-day' + (wd.today ? ' today' : '') + '">' + wd.day + '</div>' +
      '</div>';
  }

  var monthBars = '';
  for (var mi = 0; mi < monthData.length; mi++) {
    var md = monthData[mi];
    var barCls = 'rt-month-bar';
    if (md.today) { barCls += ' today'; }
    else if (md.pct > 0) { barCls += ' filled'; }
    monthBars += '<div class="' + barCls + '" style="height:' + Math.max(4, md.pct * 0.4) + 'px" title="' + (md.val > 0 ? (Math.round(md.val*10)/10) + 'h' : '-') + '"></div>';
  }

  return '<div class="page-body">' +
    '<div class="page-hdr">Laufzeiten</div>' +

    '<div class="rt-section">' +
      '<div class="rt-sec-title">Heute</div>' +
      '<div class="rt-today-nums">' +
        '<div class="rt-today-stat"><div class="rt-today-lbl">Laufzeit</div><div class="rt-today-val">' + runtime + ' h</div></div>' +
        '<div class="rt-today-stat"><div class="rt-today-lbl">Restlaufzeit</div><div class="rt-today-val">' + remaining + ' h</div></div>' +
        '<div class="rt-today-stat"><div class="rt-today-lbl">Tagesziel</div><div class="rt-today-val">' + target + ' h</div></div>' +
        '<div class="rt-today-stat"><div class="rt-today-lbl">Nächster Start</div><div class="rt-today-val" style="font-size:14px;">' + nextStart + '</div></div>' +
      '</div>' +
      '<div class="rt-today-bar-wrap"><div class="rt-today-bar-fill" style="' + todayBarStyle + '"><span class="rt-today-bar-pct">' + progPct + '%</span></div></div>' +
      '<div class="rt-today-bar-labels"><span>0 h</span><span>Ziel: ' + target + ' h</span></div>' +
    '</div>' +

    '<div class="rt-section">' +
      '<div class="rt-sec-title">Letzte 7 Tage</div>' +
      '<div class="rt-week-grid">' + weekBars + '</div>' +
    '</div>' +

    '<div class="rt-section">' +
      '<div class="rt-sec-title">Letzte 30 Tage</div>' +
      '<div class="rt-month-grid">' + monthBars + '</div>' +
    '</div>' +

    '<div class="page-note">Gesamtlaufzeit: <b>' + totalRT + ' h</b> &nbsp;&middot;&nbsp; Saisonlaufzeit: <b>' + seasRT + ' h</b></div>' +
  '</div>';
}

function buildPageSettings(autoOn, season) {
  var toggleClass = autoOn ? 'on' : 'off';
  var toggleLbl   = autoOn ? 'EIN' : 'AUS';
  var seasons = [
    { k:'auto',   i:'⚙️',   l:'Auto' },
    { k:'spring', i:'\U0001f338', l:'Frühling' },
    { k:'summer', i:'☀️',   l:'Sommer' },
    { k:'autumn', i:'\U0001f342', l:'Herbst' },
    { k:'winter', i:'❄️',   l:'Winter' },
  ];
  var sBtns = '';
  for (var si = 0; si < seasons.length; si++) {
    var s = seasons[si];
    sBtns += '<button class="sbtn' + (season === s.k ? ' active' : '') + '" data-season="' + s.k + '">' + s.i + ' ' + s.l + '</button>';
  }
  return '<div class="page-body">' +
    '<div class="page-hdr">Einstellungen</div>' +
    '<div class="set-section">' +
      '<div class="set-lbl">Automatikbetrieb</div>' +
      '<div class="ctrl-auto-row" id="btn-toggle-auto-s">' +
        '<span class="ctrl-auto-lbl">Automatikmodus</span>' +
        '<div class="ctrl-toggle-wrap">' +
          '<span class="ctrl-toggle-lbl ' + toggleClass + '">' + toggleLbl + '</span>' +
          '<button class="toggle-pill ' + toggleClass + '" aria-label="Automatik"></button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="set-section">' +
      '<div class="set-lbl">Saisonmodus</div>' +
      '<div class="season-btns">' + sBtns + '</div>' +
    '</div>' +
    '<div class="set-section">' +
      '<div class="set-lbl">Tagesziel</div>' +
      '<div class="set-note">Wird automatisch berechnet (Poolvolumen × Umwälzungen ÷ Förderleistung). Ändern via Integrationen → Pool Pump Manager → Konfigurieren.</div>' +
    '</div>' +
  '</div>';
}

function buildPageMaintenance(maint, totalRT, seasRT, maintCountdown) {
  return '<div class="page-body">' +
    '<div class="page-hdr">Wartung</div>' +
    '<div class="page-grid">' +
      '<div class="page-card"><div class="pc-lbl">Gesamtlaufzeit</div><div class="pc-val">' + totalRT + ' h</div></div>' +
      '<div class="page-card"><div class="pc-lbl">Saisonlaufzeit</div><div class="pc-val">' + seasRT + ' h</div></div>' +
      '<div class="page-card"><div class="pc-lbl">Seit letzter Wartung</div><div class="pc-val">' + maint + ' h</div></div>' +
      '<div class="page-card"><div class="pc-lbl">Nächste Wartung in</div><div class="pc-val" style="color:#22c55e;">' + maintCountdown + ' h</div></div>' +
    '</div>' +
    '<div class="maint-row">' +
      '<button class="btn-maint-lg" id="btn-maint">\U0001f527 Wartung Reset</button>' +
      '<button class="btn-maint-lg" id="btn-season-reset">\U0001f4c5 Saison Reset</button>' +
    '</div>' +
    '<div class="page-note">Reset setzt den jeweiligen Stundenzähler auf 0 zurück.</div>' +
  '</div>';
}

// ── Card Class ────────────────────────────────────────────────────────────────

class PoolControlCenterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass           = null;
    this._E              = null;
    this._cfg            = {};
    this._page           = 'overview';
    this._settingsOpen   = false;
    this._settings       = { poolImage: '', debugMode: false };
    this._poolImageData  = '';
    this._toast          = null;
    this._optimisticAuto   = undefined;
    this._optimisticSeason = null;
    this._loadSettings();
    LOG.debug('Card constructed, version:', CARD_VERSION);
  }

  // ── hass setter ─────────────────────────────────────────────────────────────

  set hass(hass) {
    var oldHass = this._hass;
    this._hass = hass;
    if (!this._E || this._needsResolve()) this._resolveEntities();

    if (this._E) {
      // Save today's runtime to localStorage for history charts
      var rtRaw = this._val(this._E.runtimeToday, null);
      if (rtRaw !== null) this._saveDailyRuntime(rtRaw);

      // Clear optimistic states once HA confirms
      if (this._optimisticAuto !== undefined && this._isOn(this._E.automation) === this._optimisticAuto) {
        this._optimisticAuto = undefined;
      }
      if (this._optimisticSeason !== null && this._val(this._E.seasonMode, 'auto') === this._optimisticSeason) {
        this._optimisticSeason = null;
      }
    }

    if (!this._settingsOpen && this._hasRelevantChange(oldHass, hass)) {
      this._render();
    }
  }

  _hasRelevantChange(oldHass, newHass) {
    if (!oldHass || !this._E) return true;
    var E = this._E;
    var keys = Object.keys(E);
    for (var i = 0; i < keys.length; i++) {
      var id = E[keys[i]];
      var os = oldHass.states[id];
      var ns = newHass.states[id];
      if ((!os) !== (!ns)) return true;
      if (os && ns && os.state !== ns.state) return true;
    }
    return false;
  }

  // ── Toast ───────────────────────────────────────────────────────────────────

  _showToast(msg, type) {
    var self = this;
    this._toast = { msg: msg, type: type };
    this._render();
    setTimeout(function() {
      self._toast = null;
      if (!self._settingsOpen) self._render();
    }, 2800);
  }

  // ── Settings persistence ─────────────────────────────────────────────────────

  _loadSettings() {
    try {
      var raw = window.localStorage.getItem('pcc-v1-settings');
      if (raw) {
        var p = JSON.parse(raw);
        this._settings.poolImage = p.poolImage || '';
        this._settings.debugMode = !!p.debugMode;
      }
    } catch (e) { LOG.debug('Settings load failed:', e); }
    try {
      this._poolImageData = window.localStorage.getItem('pcc-v1-imgdata') || '';
    } catch (e) { this._poolImageData = ''; }
  }

  _saveSettings() {
    try {
      window.localStorage.setItem('pcc-v1-settings', JSON.stringify(this._settings));
    } catch (e) { LOG.debug('Settings save failed:', e); }
  }

  _savePoolImageData() {
    try {
      if (this._poolImageData) {
        window.localStorage.setItem('pcc-v1-imgdata', this._poolImageData);
      } else {
        window.localStorage.removeItem('pcc-v1-imgdata');
      }
    } catch (e) { LOG.debug('Pool image data save failed:', e); }
  }

  // ── Runtime history ──────────────────────────────────────────────────────────

  _saveDailyRuntime(val) {
    try {
      var n = parseFloat(val);
      if (isNaN(n) || n < 0) return;
      var d = new Date();
      var key = 'pcc-v1-rt-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      window.localStorage.setItem(key, String(n));
    } catch (e) {}
  }

  _loadWeekData(targetH) {
    var dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    var result = [];
    var now = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var key = 'pcc-v1-rt-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      var raw = null;
      try { raw = window.localStorage.getItem(key); } catch (e) {}
      var val = raw !== null ? parseFloat(raw) : 0;
      if (isNaN(val)) val = 0;
      var pct = (targetH > 0) ? Math.min(100, Math.round((val / targetH) * 100)) : 0;
      result.push({ day: dayNames[d.getDay()], val: val, pct: pct, today: i === 0 });
    }
    return result;
  }

  _loadMonthData(targetH, todayVal) {
    var result = [];
    var now = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var key = 'pcc-v1-rt-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      var val = 0;
      if (i === 0) {
        val = parseFloat(todayVal) || 0;
      } else {
        var raw = null;
        try { raw = window.localStorage.getItem(key); } catch (e) {}
        val = raw !== null ? parseFloat(raw) : 0;
        if (isNaN(val)) val = 0;
      }
      var pct = (targetH > 0) ? Math.min(100, Math.round((val / targetH) * 100)) : 0;
      result.push({ val: val, pct: pct, today: i === 0 });
    }
    return result;
  }

  // ── Resolve ──────────────────────────────────────────────────────────────────

  _needsResolve() {
    if (!this._E || !this._hass || !this._hass.states) return true;
    var st = this._hass.states;
    var critical = ['runtimeToday', 'remaining', 'target', 'totalRuntime', 'seasonRuntime', 'maintenance'];
    for (var i = 0; i < critical.length; i++) {
      var id = this._E[critical[i]];
      if (!id) return true;
      var s = st[id];
      if (!s || s.state === 'unavailable' || s.state === 'unknown') return true;
    }
    return false;
  }

  setConfig(config) {
    this._cfg = config || {};
    if (this._hass) this._render();
  }

  getCardSize() { return 15; }

  _resolveEntities() {
    var st = this._hass && this._hass.states;
    if (!st) return;

    var resolved = Object.assign({}, ENTITY_DEFAULTS);

    var fbKeys = Object.keys(ENTITY_FALLBACKS);
    for (var ki = 0; ki < fbKeys.length; ki++) {
      var key = fbKeys[ki];
      if (!st[resolved[key]]) {
        var alts = ENTITY_FALLBACKS[key];
        for (var ai = 0; ai < alts.length; ai++) {
          if (st[alts[ai]]) { resolved[key] = alts[ai]; break; }
        }
      }
    }

    var autoMap = {};
    var allIds = Object.keys(st);
    for (var si = 0; si < allIds.length; si++) {
      var id = allIds[si];
      if (id.indexOf('pool_pump_manager_') !== -1) {
        var parts = id.split('pool_pump_manager_');
        if (parts.length > 1) { autoMap[parts[1]] = id; }
      }
    }

    var SUFFIX_MAP = {
      runtimeToday:  ['runtime_today','laufzeit_heute','tageslaufzeit','laufzeit','runtime'],
      remaining:     ['remaining_runtime','remaining','restlaufzeit','verbleibende_laufzeit','verbleibend'],
      target:        ['target_runtime','target','tagesziel','ziel_laufzeit','ziel','sollwert'],
      totalRuntime:  ['total_runtime','gesamtlaufzeit','betriebsstunden','gesamt','total'],
      seasonRuntime: ['season_runtime','saisonlaufzeit','season'],
      maintenance:   ['runtime_since_maintenance','since_maintenance','seit_wartung','wartungslaufzeit','maintenance'],
      efficiency:    ['efficiency','effizienz','wirkungsgrad'],
      nextStart:     ['next_start','naechster_start','next'],
      power:         ['metering_power','power','leistung','watt'],
      voltage:       ['metering_voltage','voltage','spannung'],
      current:       ['metering_current','current','strom','ampere'],
      frequency:     ['metering_frequency','frequency','frequenz','hz'],
      energy:        ['metering_energy','energy','energie','verbrauch','kwh'],
      ph:            ['ph','ph_value','ph_wert'],
      redox:         ['redox','orp'],
      temperature:   ['pool_temperature','temperature','water_temperature','temperatur','wassertemperatur','pool_temp'],
    };
    var smKeys = Object.keys(SUFFIX_MAP);
    for (var mi = 0; mi < smKeys.length; mi++) {
      var mkey = smKeys[mi];
      if (!st[resolved[mkey]]) {
        var suffixes = SUFFIX_MAP[mkey];
        for (var sfi = 0; sfi < suffixes.length; sfi++) {
          if (autoMap[suffixes[sfi]]) { resolved[mkey] = autoMap[suffixes[sfi]]; break; }
        }
      }
    }

    var FNAME_MAP = {
      runtimeToday:  ['laufzeit heute','runtime today','tageslaufzeit'],
      remaining:     ['restlaufzeit','remaining runtime'],
      target:        ['tagesziel','target runtime','ziel-laufzeit'],
      totalRuntime:  ['gesamtlaufzeit','total runtime','betriebsstunden'],
      seasonRuntime: ['saisonlaufzeit','season runtime'],
      maintenance:   ['seit wartung','runtime since maintenance','since maintenance'],
      nextStart:     ['nächster start','next start','naechster start'],
    };
    var allStateIds = Object.keys(st);
    var fnKeys = Object.keys(FNAME_MAP);
    for (var fni = 0; fni < fnKeys.length; fni++) {
      var fnkey = fnKeys[fni];
      if (st[resolved[fnkey]]) continue;
      var nameList = FNAME_MAP[fnkey];
      for (var idi = 0; idi < allStateIds.length; idi++) {
        var cid = allStateIds[idi];
        if (cid.indexOf('pool_pump_manager') === -1) continue;
        var attrs = st[cid].attributes;
        var fn = attrs && (attrs.friendly_name || '');
        if (!fn) continue;
        var fnl = fn.toLowerCase();
        var matched = false;
        for (var nmi = 0; nmi < nameList.length; nmi++) {
          if (fnl.indexOf(nameList[nmi].toLowerCase()) !== -1) {
            resolved[fnkey] = cid; matched = true; break;
          }
        }
        if (matched) break;
      }
    }

    var found = [], unavail = [], missing = [];
    var rKeys = Object.keys(resolved);
    for (var li = 0; li < rKeys.length; li++) {
      var lkey = rKeys[li];
      var ls = st[resolved[lkey]];
      if (!ls) { missing.push(lkey); }
      else if (ls.state === 'unavailable' || ls.state === 'unknown') { unavail.push(lkey); }
      else { found.push(lkey); }
    }
    LOG.info('Entities resolved. v' + CARD_VERSION + ' — ' + found.length + ' ok, ' + unavail.length + ' unavail, ' + missing.length + ' missing');

    this._E = resolved;
  }

  // ── State helpers ─────────────────────────────────────────────────────────────

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

  _svc(domain, service, data, toastLabel, onError) {
    if (!this._hass) { LOG.warn('callService skipped – hass not ready'); return; }
    var self  = this;
    var label = toastLabel || (domain + '.' + service);
    LOG.debug('callService:', domain + '.' + service, data);
    var p = this._hass.callService(domain, service, data);
    if (p && typeof p.then === 'function') {
      p.then(
        function() { self._showToast('✓ ' + label, 'ok'); },
        function(err) {
          LOG.warn('Service call FAILED:', domain + '.' + service, err);
          self._showToast('✗ ' + label + ' (Fehler)', 'err');
          if (onError) onError();
        }
      );
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  _render() {
    if (!this._hass || !this._E) return;
    var E = this._E;

    // Use optimistic state when set, otherwise use HA state
    var autoOn  = (this._optimisticAuto !== undefined) ? this._optimisticAuto : this._isOn(E.automation);
    var season  = (this._optimisticSeason !== null)    ? this._optimisticSeason : this._val(E.seasonMode, 'auto');

    var running   = this._isOn(E.running);
    var warning   = this._isOn(E.warning);
    var status    = this._val(E.status, 'unknown');
    var power     = this._val(E.power, '–');
    var voltage   = this._val(E.voltage, '–');
    var current   = this._val(E.current, '–');
    var freq      = this._val(E.frequency, '–');
    var energy    = this._val(E.energy, '–');
    var eff       = this._val(E.efficiency, '–');
    var runtime   = this._val(E.runtimeToday, '–');
    var remaining = this._val(E.remaining, '–');
    var nextStart = fmtTimestamp(this._val(E.nextStart, '–'));
    var target    = this._val(E.target, '–');
    var ph        = this._val(E.ph, '–');
    var redox     = this._val(E.redox, '–');
    var temp      = this._val(E.temperature, '–');
    var totalRT   = this._val(E.totalRuntime, '–');
    var seasRT    = this._val(E.seasonRuntime, '–');
    var maint     = this._val(E.maintenance, '–');

    var statusLabel = STATUS_LABEL[status] || status;
    var seasonLabel = SEASON_LABEL[season]  || season;
    var seasonIcon  = SEASON_ICON[season]   || '⚙️';

    var progPct = 0;
    var rtNum = parseFloat(runtime);
    var tgNum = parseFloat(target);
    if (!isNaN(rtNum) && !isNaN(tgNum) && tgNum > 0) {
      progPct = Math.min(100, Math.round((rtNum / tgNum) * 100));
    }

    var maintNum = parseFloat(maint);
    var maintCountdown = '–';
    if (!isNaN(maintNum)) maintCountdown = Math.max(0, 500 - maintNum).toFixed(0);

    var weekData  = this._loadWeekData(tgNum || 4);
    var monthData = this._loadMonthData(tgNum || 4, runtime);

    var imgUrl = this._poolImageData ||
                 this._settings.poolImage ||
                 (this._cfg && this._cfg.pool_image) || '';

    var poolHero = buildPoolHero(running, imgUrl);
    var pumpSvg  = buildPumpSvg(running);
    var filtSvg  = buildFilterSvg();
    var doserSvg = buildDoserSvg();

    // Warning badge — count missing critical entities
    var CRITICAL_KEYS = ['running','status','runtimeToday','remaining','target','totalRuntime','seasonRuntime','maintenance','automation'];
    var missingCnt = 0;
    for (var ci = 0; ci < CRITICAL_KEYS.length; ci++) {
      var cid = E[CRITICAL_KEYS[ci]];
      if (!cid || !this._hass.states[cid]) missingCnt++;
    }
    var warnBadge = missingCnt > 0 ?
      '<div class="warn-badge" id="btn-warn">⚠ ' + missingCnt + ' fehlt</div>' : '';

    // Header status badge
    var srbDotCls  = running ? 'run' : 'stop';
    var srbTextCls = running ? 'run' : 'stop';
    var srbTitle   = running ? 'Läuft' : 'Gestoppt';
    var srbSub     = autoOn  ? 'Automatik aktiv' : 'Manuell';
    var statusBadge = '<div class="srb" id="hdr-status-badge">' +
      '<span class="srb-dot ' + srbDotCls + '"></span>' +
      '<div><div class="srb-text ' + srbTextCls + '">' + srbTitle + '</div><div class="srb-sub">' + srbSub + '</div></div>' +
    '</div>';

    var seasonBadge = '<div class="hbadge" id="hdr-season-badge">' +
      '<span class="hb-icon">' + seasonIcon + '</span>' +
      '<div class="hb-text"><div class="hb-title">Saison: ' + seasonLabel + '</div><div class="hb-sub">Betriebsmodus</div></div>' +
    '</div>';

    var hdr = '<div class="hdr">' +
      '<div class="hdr-brand"><span class="hdr-wave">≡</span><span class="hdr-title">Pool Control Center</span></div>' +
      '<div class="hdr-badges">' +
        statusBadge +
        seasonBadge +
        warnBadge +
        '<button class="gear-btn' + (this._settingsOpen ? ' open' : '') + '" id="btn-gear" title="Einstellungen">⚙</button>' +
      '</div>' +
    '</div>';

    // Tech panel
    var pumpStatus  = running ? '<span class="tech-col-status">Läuft</span>' : '<span class="tech-col-status off">Aus</span>';
    var filtStatus  = warning ? '<span class="tech-col-status warn">Achtung</span>' : '<span class="tech-col-status">OK</span>';

    var tech = '<div class="tech-panel">' +
      '<div class="tech-hdr">Technik</div>' +
      '<div class="tech-grid">' +
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">\U0001f527</span><span class="tech-col-name">Poolpumpe</span>' + pumpStatus + '</div>' +
          '<div class="tech-visual">' + pumpSvg + '</div>' +
          '<div class="tech-col-metrics"><b>⚡ ' + power + '</b> W &nbsp; <b>⌇ ' + current + '</b> A</div>' +
        '</div>' +
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">\U0001f3fa</span><span class="tech-col-name">Sandfilter</span>' + filtStatus + '</div>' +
          '<div class="tech-visual">' + filtSvg + '</div>' +
          '<div class="tech-col-metrics"><b>⊙ –</b> bar</div>' +
        '</div>' +
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">\U0001f9ea</span><span class="tech-col-name">Dosieranlage</span><span class="tech-col-status">OK</span></div>' +
          '<div class="tech-visual">' + doserSvg + '</div>' +
          '<div class="tech-col-metrics"><b>pH</b> ' + ph + ' &nbsp; <b>Redox</b> ' + redox + ' mV</div>' +
        '</div>' +
      '</div>' +
      '<div class="tech-sysstat">● Systemstatus: Alle Komponenten in Ordnung</div>' +
    '</div>';

    var mainArea = '<div class="main-area"><div class="pool-area">' + poolHero + '</div>' + tech + '</div>';

    // Status bar
    var statClass = running ? ' green' : '';
    var statBar = '<div class="stat-bar">' +
      '<div class="stat-cell"><div class="stat-label">Status</div><div class="stat-main"><span class="stat-ico" style="color:#22c55e;">▶</span><span class="stat-val' + statClass + '">' + statusLabel + '</span></div><div class="stat-sub">' + (running ? 'Pumpe aktiv' : 'Pumpe inaktiv') + '</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Leistung</div><div class="stat-main"><span class="stat-ico" style="color:#eab308;">⚡</span><span class="stat-val yellow">' + power + '</span><span class="stat-unit">W</span></div><div class="stat-sub">Aktuelle Leistung</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Spannung</div><div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">∼</span><span class="stat-val blue">' + voltage + '</span><span class="stat-unit">V</span></div><div class="stat-sub">Netzspannung</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Strom</div><div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">⌆</span><span class="stat-val blue">' + current + '</span><span class="stat-unit">A</span></div><div class="stat-sub">Aktueller Strom</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Frequenz</div><div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">⊟</span><span class="stat-val blue">' + freq + '</span><span class="stat-unit">Hz</span></div><div class="stat-sub">Netzfrequenz</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Effizienz</div><div class="stat-main"><span class="stat-ico">\U0001f33f</span><span class="stat-val green">' + eff + '</span><span class="stat-unit">%</span></div><div class="stat-sub">Aktuelle Effizienz</div></div>' +
      '<div class="stat-cell"><div class="stat-label">Energie</div><div class="stat-main"><span class="stat-ico">\U0001f50b</span><span class="stat-val orange">' + energy + '</span><span class="stat-unit">Wh</span></div><div class="stat-sub">Heute verbraucht</div></div>' +
    '</div>';

    // Bottom section
    var toggleClass = autoOn ? 'on' : 'off';
    var toggleLbl   = autoOn ? 'EIN' : 'AUS';

    var bottom = '<div class="bottom">' +
      '<div class="bpanel">' +
        '<div class="bpanel-title">Laufzeiten</div>' +
        '<div class="brow"><span class="brow-ico">▷</span><span class="brow-lbl">Laufzeit heute</span><span class="brow-val">' + runtime + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">⏱</span><span class="brow-lbl">Restlaufzeit</span><span class="brow-val">' + remaining + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">⏰</span><span class="brow-lbl">Nächster Start</span><span class="brow-val">' + nextStart + '</span></div>' +
        '<div class="brow"><span class="brow-ico">\U0001f3af</span><span class="brow-lbl">Tagesziel</span><span class="brow-val">' + target + ' h</span></div>' +
        '<div class="prog-wrap"><div class="prog-fill" style="width:' + progPct + '%"></div></div>' +
        '<div class="prog-pct">' + progPct + '%</div>' +
      '</div>' +
      '<div class="bpanel">' +
        '<div class="bpanel-title">Saison</div>' +
        '<div class="hb-sub" style="font-size:11px;">Aktuelle Saison</div>' +
        '<div class="season-name-row"><span class="season-name-icon">' + seasonIcon + '</span><span class="season-name-text">' + seasonLabel + '</span></div>' +
        '<div class="brow"><span class="brow-ico">\U0001f550</span><span class="brow-lbl">Saisonlaufzeit</span><span class="brow-val">' + seasRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">\U0001f3af</span><span class="brow-lbl">Ziel-Laufzeit</span><span class="brow-val">' + target + ' h</span></div>' +
        '<div class="season-link" id="btn-season-cycle">' + seasonIcon + ' Saisonmodus: ' + seasonLabel + '</div>' +
      '</div>' +
      '<div class="bpanel">' +
        '<div class="bpanel-title">Wasserqualität</div>' +
        '<div class="brow"><span class="brow-ico">\U0001f4a7</span><span class="brow-lbl">pH-Wert</span><span class="brow-val">' + ph + '</span></div>' +
        '<div class="brow"><span class="brow-ico">⚡</span><span class="brow-lbl">Redox</span><span class="brow-val">' + redox + ' mV</span></div>' +
        '<div class="brow"><span class="brow-ico">\U0001f321️</span><span class="brow-lbl">Temperatur</span><span class="brow-val">' + temp + ' °C</span></div>' +
        '<div class="wq-ok">✓ Alle Werte im optimalen Bereich</div>' +
      '</div>' +
      '<div class="bpanel">' +
        '<div class="bpanel-title">Wartung &amp; Betriebsstunden</div>' +
        '<div class="brow"><span class="brow-ico">⚙️</span><span class="brow-lbl">Gesamt</span><span class="brow-val">' + totalRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">\U0001f33f</span><span class="brow-lbl">Saison</span><span class="brow-val">' + seasRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">\U0001f527</span><span class="brow-lbl">Seit Wartung</span><span class="brow-val">' + maint + ' h</span></div>' +
        '<div class="maint-ok">✓ Nächste Wartung in ' + maintCountdown + ' h</div>' +
      '</div>' +
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
          '<button class="btn-start" id="btn-start">▶ Jetzt starten</button>' +
          '<button class="btn-stop"  id="btn-stop">■ Jetzt stoppen</button>' +
        '</div>' +
        '<div class="ctrl-reset-btns">' +
          '<button class="btn-reset" id="btn-maint">\U0001f527 Wartung Reset</button>' +
          '<button class="btn-reset" id="btn-season-reset">\U0001f4c5 Saison Reset</button>' +
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

    // Nav bar — 4 buttons only
    var page = this._page || 'overview';
    var nc = function(p) { return 'nav-btn' + (page === p ? ' active' : ''); };
    var nav = '<div class="nav">' +
      '<button class="' + nc('overview')    + '" data-page="overview"><span class="nav-ico">\U0001f3e0</span><span class="nav-lbl">Übersicht</span></button>' +
      '<button class="' + nc('runtimes')    + '" data-page="runtimes"><span class="nav-ico">\U0001f550</span><span class="nav-lbl">Laufzeiten</span></button>' +
      '<button class="' + nc('settings')    + '" data-page="settings"><span class="nav-ico">⚙️</span><span class="nav-lbl">Einstellungen</span></button>' +
      '<button class="' + nc('maintenance') + '" data-page="maintenance"><span class="nav-ico">\U0001f527</span><span class="nav-lbl">Wartung</span></button>' +
    '</div>';

    // Page body
    var body;
    if (page === 'runtimes') {
      body = buildPageRuntimes(runtime, remaining, nextStart, target, progPct, seasRT, totalRT, weekData, monthData);
    } else if (page === 'settings') {
      body = buildPageSettings(autoOn, season);
    } else if (page === 'maintenance') {
      body = buildPageMaintenance(maint, totalRT, seasRT, maintCountdown);
    } else {
      body = mainArea + statBar + bottom;
    }

    // Settings modal
    var settingsModal = '';
    if (this._settingsOpen) {
      var curImg    = this._poolImageData || this._settings.poolImage || (this._cfg && this._cfg.pool_image) || '';
      var debugOn   = this._settings.debugMode;
      var dTogCls   = debugOn ? 'on' : 'off';
      var dTogLbl   = debugOn ? 'EIN' : 'AUS';
      var prevStyle = curImg ? 'background-image:url(\'' + curImg.replace(/'/g, '%27') + '\')' : '';
      var prevTxt   = curImg ? '' : 'Kein Bild gewählt';
      var urlVal    = (this._settings.poolImage || (this._cfg && this._cfg.pool_image) || '').replace(/"/g, '&#34;');

      settingsModal =
        '<div class="settings-overlay" id="settings-overlay">' +
          '<div class="settings-panel" id="settings-panel">' +
            '<div class="settings-hdr">' +
              '<span class="settings-hdr-title">⚙ Einstellungen</span>' +
              '<button class="settings-close" id="settings-close">✕</button>' +
            '</div>' +
            '<div class="settings-section">' +
              '<div class="settings-stitle">Pool-Hintergrundbild</div>' +
              '<div class="settings-img-preview" style="' + prevStyle + '">' + prevTxt + '</div>' +
              '<input type="file" id="settings-img-file" accept="image/*" style="display:none">' +
              '<button class="file-pick-btn" id="settings-img-pick">\U0001f4f7 Bild von Gerät wählen</button>' +
              '<div class="settings-note">Oder URL eingeben (z. B. <code>/local/pool.jpg</code>):</div>' +
              '<input class="settings-input" id="settings-img-input" type="text" placeholder="/local/pool-pump-manager/pool-background.jpg" value="' + urlVal + '">' +
              '<div class="settings-btns">' +
                '<button class="settings-btn" id="settings-img-apply">Übernehmen</button>' +
                '<button class="settings-btn sec" id="settings-img-clear">Zurücksetzen</button>' +
              '</div>' +
            '</div>' +
            '<div class="settings-section">' +
              '<div class="settings-stitle">Diagnose</div>' +
              buildDiagRows(this._E, this._hass) +
            '</div>' +
            '<div class="settings-section">' +
              '<div class="settings-stitle">Debug-Modus</div>' +
              '<div class="settings-row">' +
                '<div><div class="settings-row-lbl">Erweiterte Diagnose</div><div class="settings-row-sub">Entity-Timestamps in Diagnose sichtbar</div></div>' +
                '<div class="ctrl-toggle-wrap">' +
                  '<span class="ctrl-toggle-lbl ' + dTogCls + '">' + dTogLbl + '</span>' +
                  '<button class="toggle-pill ' + dTogCls + '" id="settings-debug-toggle"></button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    // Toast
    var toastHtml = '';
    if (this._toast) {
      toastHtml = '<div class="toast-wrap"><div class="toast ' + this._toast.type + '">' + this._toast.msg + '</div></div>';
    }

    var html = '<div class="pcc">' + hdr + body + nav + settingsModal + toastHtml + '</div>';
    this.shadowRoot.innerHTML = '<style>' + CARD_CSS + '</style>' + html;
    this._attach();
  }

  // ── Event listeners ───────────────────────────────────────────────────────────

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

    // Automation toggle with optimistic update
    var toggleAuto = function() {
      var curOn = (self._optimisticAuto !== undefined) ? self._optimisticAuto : self._isOn(E.automation);
      var newVal = !curOn;
      LOG.debug('Automatik toggle – wird:', newVal ? 'EIN' : 'AUS');
      self._optimisticAuto = newVal;
      self._render();
      self._svc('switch', newVal ? 'turn_on' : 'turn_off', { entity_id: E.automation },
        newVal ? 'Automatik EIN' : 'Automatik AUS',
        function() { self._optimisticAuto = undefined; self._render(); }
      );
    };

    // Season cycle (from overview badges / dropdowns)
    var cycleSeason = function() {
      var cur  = (self._optimisticSeason !== null) ? self._optimisticSeason : self._val(E.seasonMode, 'auto');
      var idx  = SEASON_MODES.indexOf(cur);
      var next = SEASON_MODES[(idx < 0 ? 0 : idx + 1) % SEASON_MODES.length];
      LOG.debug('Saison cycle:', cur, '->', next);
      self._optimisticSeason = next;
      self._render();
      self._svc('select', 'select_option', { entity_id: E.seasonMode, option: next },
        'Saison: ' + (SEASON_LABEL[next] || next),
        function() { self._optimisticSeason = null; self._render(); }
      );
    };

    // Header status badge → toggle auto
    var elStatusBadge = $('hdr-status-badge');
    if (elStatusBadge) elStatusBadge.addEventListener('click', toggleAuto);

    var elHdrSeason = $('hdr-season-badge');
    if (elHdrSeason) elHdrSeason.addEventListener('click', cycleSeason);

    // Warning badge → open settings modal (diagnostics)
    var elWarn = $('btn-warn');
    if (elWarn) elWarn.addEventListener('click', function() {
      self._settingsOpen = true;
      self._render();
    });

    // Overview controls
    var elToggle = $('btn-toggle-auto');
    if (elToggle) elToggle.addEventListener('click', function() { fx(elToggle); toggleAuto(); });

    var elStart = $('btn-start');
    if (elStart) elStart.addEventListener('click', function() {
      fx(elStart);
      self._svc('pool_pump_manager', 'start_now', {}, 'Pumpe gestartet');
    });

    var elStop = $('btn-stop');
    if (elStop) elStop.addEventListener('click', function() {
      fx(elStop);
      self._svc('pool_pump_manager', 'stop_now', {}, 'Pumpe gestoppt');
    });

    var elMaint = $('btn-maint');
    if (elMaint) elMaint.addEventListener('click', function() {
      fx(elMaint);
      self._svc('button', 'press', { entity_id: E.btnMaint }, 'Wartung zurückgesetzt');
    });

    var elSeaReset = $('btn-season-reset');
    if (elSeaReset) elSeaReset.addEventListener('click', function() {
      fx(elSeaReset);
      self._svc('button', 'press', { entity_id: E.btnSeason }, 'Saison zurückgesetzt');
    });

    var elSeaCycle = $('btn-season-cycle');
    if (elSeaCycle) elSeaCycle.addEventListener('click', cycleSeason);

    var elSeaDd = $('btn-season-dd');
    if (elSeaDd) elSeaDd.addEventListener('click', cycleSeason);

    // Settings page: auto toggle
    var elToggleS = $('btn-toggle-auto-s');
    if (elToggleS) elToggleS.addEventListener('click', function() { toggleAuto(); });

    // Settings page: season buttons with optimistic update
    root.querySelectorAll('.sbtn[data-season]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var opt = this.getAttribute('data-season');
        fx(this);
        LOG.debug('Season direct select:', opt);
        self._optimisticSeason = opt;
        self._render();
        self._svc('select', 'select_option', { entity_id: E.seasonMode, option: opt },
          'Saison: ' + (SEASON_LABEL[opt] || opt),
          function() { self._optimisticSeason = null; self._render(); }
        );
      });
    });

    // Nav buttons
    root.querySelectorAll('.nav-btn[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pg = this.getAttribute('data-page');
        LOG.debug('Nav:', pg);
        self._page = pg;
        self._render();
      });
    });

    // Gear button
    var elGear = $('btn-gear');
    if (elGear) elGear.addEventListener('click', function() {
      self._settingsOpen = !self._settingsOpen;
      self._render();
    });

    // Settings modal: close
    var elSettingsClose = $('settings-close');
    if (elSettingsClose) elSettingsClose.addEventListener('click', function() {
      self._settingsOpen = false;
      self._render();
    });

    // Settings modal: click outside panel
    var elOverlay = $('settings-overlay');
    if (elOverlay) elOverlay.addEventListener('click', function(e) {
      var panel = $('settings-panel');
      if (panel && !panel.contains(e.target)) {
        self._settingsOpen = false;
        self._render();
      }
    });

    // Settings modal: file picker
    var elFilePick  = $('settings-img-pick');
    var elFileInput = $('settings-img-file');
    if (elFilePick && elFileInput) {
      elFilePick.addEventListener('click', function() {
        elFileInput.click();
      });
      elFileInput.addEventListener('change', function() {
        var file = this.files && this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(evt) {
          try {
            var data = evt.target.result;
            window.localStorage.setItem('pcc-v1-imgdata', data);
            self._poolImageData = data;
            self._settings.poolImage = '';
            self._saveSettings();
            self._settingsOpen = false;
            self._render();
          } catch (e) {
            self._showToast('✗ Bild zu groß für lokalen Speicher', 'err');
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Settings modal: apply URL
    var elImgApply = $('settings-img-apply');
    if (elImgApply) elImgApply.addEventListener('click', function() {
      var inp = $('settings-img-input');
      var val = inp ? inp.value.trim() : '';
      self._settings.poolImage = val;
      self._poolImageData = '';
      self._savePoolImageData();
      self._saveSettings();
      self._settingsOpen = false;
      self._render();
    });

    // Settings modal: clear image
    var elImgClear = $('settings-img-clear');
    if (elImgClear) elImgClear.addEventListener('click', function() {
      self._settings.poolImage = '';
      self._poolImageData = '';
      self._savePoolImageData();
      self._saveSettings();
      self._settingsOpen = false;
      self._render();
    });

    // Settings modal: debug toggle
    var elDebugToggle = $('settings-debug-toggle');
    if (elDebugToggle) elDebugToggle.addEventListener('click', function() {
      self._settings.debugMode = !self._settings.debugMode;
      self._saveSettings();
      self._render();
    });
  }
}

// ── Registration ──────────────────────────────────────────────────────────────

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
