'use strict';

/**
 * Pool Control Center – Custom Lovelace Card v0.5.0
 * CSS-layered pool hero (no SVG landscape). Improved tech SVGs.
 */

const CARD_VERSION = '0.5.0';

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

/* POOL HERO – CSS layered divs */
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

// ── Pool Hero (CSS layered divs – no SVG landscape) ───────────────────────────

function buildPoolHero(running) {
  var ripples = running ?
    '<div class="ph-ripple"></div><div class="ph-ripple ph-ripple-2"></div>' : '';

  return '' +
    '<div class="pool-hero">' +

      /* Layer 1: sky + distant foliage colour suggestion */
      '<div class="ph-sky" style="' +
        'background:' +
          'radial-gradient(ellipse 130% 55% at 50% -5%, #0b230a 0%, transparent 55%),' +
          'radial-gradient(ellipse 55% 60% at 3% 25%, #061406 0%, transparent 45%),' +
          'radial-gradient(ellipse 45% 50% at 97% 25%, #061406 0%, transparent 45%),' +
          'linear-gradient(to bottom, #040810 0%, #0a1520 100%);' +
        'filter:blur(3px);' +
      '"></div>' +

      /* Layer 2: dense foliage mass (blurred radial blobs, no drawn shapes) */
      '<div class="ph-foliage" style="' +
        'background:' +
          'radial-gradient(ellipse 40% 80% at 8% 85%, rgba(4,16,4,0.95) 0%, transparent 100%),' +
          'radial-gradient(ellipse 30% 70% at 22% 90%, rgba(7,22,7,0.9) 0%, transparent 100%),' +
          'radial-gradient(ellipse 35% 75% at 38% 88%, rgba(5,18,5,0.92) 0%, transparent 100%),' +
          'radial-gradient(ellipse 40% 80% at 55% 90%, rgba(6,20,6,0.9) 0%, transparent 100%),' +
          'radial-gradient(ellipse 30% 70% at 72% 85%, rgba(7,22,7,0.88) 0%, transparent 100%),' +
          'radial-gradient(ellipse 35% 75% at 88% 88%, rgba(5,18,5,0.9) 0%, transparent 100%),' +
          'radial-gradient(ellipse 25% 60% at 95% 80%, rgba(4,14,4,0.92) 0%, transparent 100%);' +
        'filter:blur(5px);' +
      '"></div>' +

      /* Layer 3: wooden deck with planks via repeating gradient */
      '<div class="ph-deck" style="' +
        'background:' +
          'repeating-linear-gradient(0deg,transparent 0px,transparent 11px,rgba(0,0,0,0.28) 11px,rgba(0,0,0,0.28) 12px),' +
          'repeating-linear-gradient(90deg,transparent 0px,transparent 120px,rgba(0,0,0,0.05) 120px,rgba(0,0,0,0.05) 121px),' +
          'linear-gradient(to bottom, #4e3014 0%, #3d2510 35%, #2e1b0a 75%, #201208 100%);' +
      '"></div>' +

      /* Layer 4: amber ground uplights */
      '<div class="ph-lamps" style="' +
        'background:' +
          'radial-gradient(ellipse 7% 5% at 13% 82%, rgba(255,140,30,0.55) 0%, transparent 100%),' +
          'radial-gradient(ellipse 7% 5% at 25% 90%, rgba(255,130,20,0.5) 0%, transparent 100%),' +
          'radial-gradient(ellipse 8% 5% at 38% 94%, rgba(255,135,25,0.45) 0%, transparent 100%),' +
          'radial-gradient(ellipse 7% 5% at 51% 93%, rgba(255,130,20,0.45) 0%, transparent 100%),' +
          'radial-gradient(ellipse 7% 5% at 64% 90%, rgba(255,140,30,0.5) 0%, transparent 100%),' +
          'radial-gradient(ellipse 7% 5% at 77% 83%, rgba(255,135,25,0.5) 0%, transparent 100%),' +
          'radial-gradient(ellipse 6% 4% at 88% 78%, rgba(255,140,30,0.45) 0%, transparent 100%),' +
          'radial-gradient(ellipse 5% 4% at 12% 70%, rgba(255,120,15,0.35) 0%, transparent 100%),' +
          'radial-gradient(ellipse 5% 4% at 89% 68%, rgba(255,120,15,0.35) 0%, transparent 100%);' +
      '"></div>' +

      /* Layer 5: pool outer cyan glow on deck */
      '<div class="ph-pool-glow" style="' +
        'left:14%;right:11%;top:38%;bottom:10%;' +
        'box-shadow:0 0 60px 30px rgba(0,200,255,0.15),0 0 120px 60px rgba(0,150,200,0.08);' +
      '"></div>' +

      /* Layer 6: pool rim/coping */
      '<div class="ph-pool-rim" style="' +
        'left:14%;right:11%;top:38%;bottom:10%;' +
        'border:3px solid rgba(160,185,210,0.45);' +
        'box-shadow:inset 0 0 20px rgba(0,50,100,0.5);' +
      '"></div>' +

      /* Layer 7: pool water with underwater light spots and ripples inside */
      '<div class="ph-pool-water" style="' +
        'left:14.5%;right:11.5%;top:38.5%;bottom:10.5%;' +
        'background:radial-gradient(ellipse at 42% 32%, #00e8ff 0%, #00c8e8 12%, #00a0c8 30%, #0077b6 58%, #024e9a 80%, #02307a 100%);' +
      '">' +
        /* Underwater light spots */
        '<div class="ph-uwl" style="left:18%;top:25%;width:32%;height:50%;background:radial-gradient(ellipse at center,rgba(255,255,255,0.75) 0%,rgba(100,250,255,0.35) 35%,transparent 70%);"></div>' +
        '<div class="ph-uwl" style="left:40%;top:18%;width:28%;height:45%;background:radial-gradient(ellipse at center,rgba(255,255,255,0.65) 0%,rgba(80,240,255,0.3) 30%,transparent 65%);"></div>' +
        '<div class="ph-uwl" style="left:62%;top:28%;width:30%;height:48%;background:radial-gradient(ellipse at center,rgba(255,255,255,0.7) 0%,rgba(90,245,255,0.32) 32%,transparent 68%);"></div>' +
        /* Ripples (only when running) */
        ripples +
      '</div>' +

      /* Layer 8: palm silhouette via data-URI SVG background – filled shapes only */
      '<div class="ph-palm" style="' +
        'left:0;top:0;width:16%;height:68%;' +
        'background-image:url(\'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 80 200%22%3E%3Cpath d%3D%22M40 200 C39 170 37 140 38 110 C39 80 41 60 42 45 C43 60 44 80 45 110 C46 140 43 170 42 200Z%22 fill%3D%22%23100804%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2222%22 ry%3D%228%22 fill%3D%22%23071207%22 opacity%3D%220.9%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2228%22 ry%3D%225%22 fill%3D%22%23091509%22 opacity%3D%220.8%22 transform%3D%22rotate(-20 42 45)%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2225%22 ry%3D%225%22 fill%3D%22%23091509%22 opacity%3D%220.8%22 transform%3D%22rotate(25 42 45)%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2220%22 ry%3D%224%22 fill%3D%22%23071207%22 opacity%3D%220.7%22 transform%3D%22rotate(-45 42 45)%22%2F%3E%3Cellipse cx%3D%2242%22 cy%3D%2245%22 rx%3D%2220%22 ry%3D%224%22 fill%3D%22%23071207%22 opacity%3D%220.7%22 transform%3D%22rotate(50 42 45)%22%2F%3E%3C%2Fsvg%3E\');' +
        'background-repeat:no-repeat;background-position:center bottom;background-size:contain;' +
        'opacity:0.85;filter:blur(1px);' +
      '"></div>' +

      /* Layer 9: deck furniture (umbrella + chairs as blurred dark shapes) */
      '<div class="ph-furniture" style="' +
        'right:22%;top:38%;width:20%;height:28%;' +
        'background:' +
          'radial-gradient(ellipse 55% 25% at 50% 15%, rgba(15,15,30,0.88) 0%, transparent 100%),' +
          'linear-gradient(to bottom, transparent 20%, rgba(15,15,30,0.72) 20%, rgba(15,15,30,0.72) 75%, transparent 75%);' +
        'background-size:70% 100%, 3px 55%;' +
        'background-position:center top, center 20%;' +
        'background-repeat:no-repeat;' +
      '"></div>' +

      /* Layer 10: vignette depth overlay */
      '<div class="ph-vignette" style="' +
        'inset:0;' +
        'background:radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%);' +
      '"></div>' +

    '</div>';
}

// ── Pump SVG (improved 3D shading, no visible cartoon outlines) ──────────────

function buildPumpSvg(running) {
  var ringColor  = running ? '#22d3ee' : '#2a3a50';
  var ringGlow   = running ? 'filter:drop-shadow(0 0 6px #22d3ee) drop-shadow(0 0 12px #0099cc);' : '';
  var ringClass  = running ? ' class="pump-ring-run"' : '';
  var statusDot  = running ? '#22c55e' : '#374151';
  var centerDot  = running ? '#22d3ee' : '#374151';

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
    /* Base plate */
    '<rect x="8" y="74" width="104" height="10" rx="3" fill="#0f1822"/>' +
    '<rect x="8" y="74" width="104" height="3" rx="3" fill="rgba(255,255,255,0.05)"/>' +
    /* Volute pump body */
    '<ellipse cx="44" cy="50" rx="30" ry="22" fill="url(#pg-vol)"/>' +
    /* Volute specular */
    '<ellipse cx="36" cy="41" rx="11" ry="6" fill="rgba(255,255,255,0.05)"/>' +
    /* Inlet pipe */
    '<rect x="6" y="43" width="16" height="14" rx="4" fill="url(#pg-pip)"/>' +
    '<rect x="2" y="45" width="6" height="10" rx="2" fill="#0b1520"/>' +
    /* Outlet pipe top */
    '<rect x="36" y="28" width="12" height="14" rx="3" fill="url(#pg-pip)"/>' +
    /* Motor housing */
    '<rect x="68" y="32" width="40" height="36" rx="8" fill="url(#pg-mot)"/>' +
    /* Motor highlight strip */
    '<rect x="69" y="33" width="4" height="34" rx="2" fill="rgba(255,255,255,0.06)"/>' +
    /* Connection flange */
    '<rect x="64" y="44" width="6" height="10" rx="1" fill="#1a2a3a"/>' +
    /* LED ring group */
    '<g' + ringClass + ' style="transform-origin:88px 50px;' + ringGlow + '">' +
      (running ?
        '<circle cx="88" cy="50" r="17" fill="none" stroke="#22d3ee" stroke-width="4" opacity="0.12"/>' +
        '<circle cx="88" cy="50" r="13" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.9"/>' +
        '<circle cx="88" cy="50" r="9" fill="none" stroke="#00e5ff" stroke-width="1.5" opacity="0.55"/>' :
        '<circle cx="88" cy="50" r="13" fill="none" stroke="#2a3a50" stroke-width="3" opacity="0.8"/>'
      ) +
    '</g>' +
    /* Impeller centre */
    '<circle cx="44" cy="50" r="5" fill="#1a2535"/>' +
    '<circle cx="44" cy="50" r="3" fill="' + centerDot + '" opacity="0.55"/>' +
    /* Status dot */
    '<circle cx="110" cy="32" r="4" fill="' + statusDot + '" opacity="0.9"/>' +
  '</svg>';
}

// ── Filter SVG (improved cylinder + realistic gauge) ─────────────────────────

function buildFilterSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120" width="80" height="120">' +
    '<defs>' +
      '<linearGradient id="fg-cyl" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="#1a2530"/>' +
        '<stop offset="30%" stop-color="#243344"/>' +
        '<stop offset="70%" stop-color="#1e2c3c"/>' +
        '<stop offset="100%" stop-color="#0e1520"/>' +
      '</linearGradient>' +
    '</defs>' +
    /* Pipe fittings */
    '<rect x="0" y="28" width="14" height="8" rx="3" fill="#131b26"/>' +
    '<rect x="66" y="74" width="14" height="8" rx="3" fill="#131b26"/>' +
    /* Main cylinder */
    '<rect x="12" y="18" width="56" height="80" rx="2" fill="url(#fg-cyl)"/>' +
    /* Cylinder highlight */
    '<rect x="14" y="20" width="5" height="76" rx="2" fill="rgba(255,255,255,0.04)"/>' +
    /* Top dome cap */
    '<ellipse cx="40" cy="18" rx="28" ry="10" fill="#1e2c3c"/>' +
    '<ellipse cx="40" cy="8" rx="18" ry="7" fill="#141e2c"/>' +
    /* Bottom cap */
    '<ellipse cx="40" cy="98" rx="28" ry="10" fill="#141e2c"/>' +
    /* Band rings */
    '<rect x="12" y="33" width="56" height="3" rx="1" fill="rgba(0,0,0,0.4)"/>' +
    '<rect x="12" y="76" width="56" height="3" rx="1" fill="rgba(0,0,0,0.4)"/>' +
    /* Pressure gauge face */
    '<circle cx="40" cy="55" r="16" fill="#e8eaed"/>' +
    '<circle cx="40" cy="55" r="14" fill="#f4f5f6"/>' +
    /* Scale marks */
    '<line x1="40" y1="42" x2="40" y2="45" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="51" y1="45" x2="49" y2="47" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="54" y1="55" x2="51" y2="55" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="29" y1="45" x2="31" y2="47" stroke="#9ca3af" stroke-width="1"/>' +
    '<line x1="26" y1="55" x2="29" y2="55" stroke="#9ca3af" stroke-width="1"/>' +
    /* Needle pointing to ~1.2 bar (2 o'clock position) */
    '<line x1="40" y1="55" x2="48" y2="46" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round"/>' +
    /* Centre screw */
    '<circle cx="40" cy="55" r="2.5" fill="#6b7280"/>' +
    /* Gauge housing ring */
    '<circle cx="40" cy="55" r="16" fill="none" stroke="#9ca3af" stroke-width="1"/>' +
    /* Label */
    '<text x="40" y="67" text-anchor="middle" font-size="5" fill="#6b7280">bar</text>' +
    /* Bottom pipe */
    '<rect x="26" y="98" width="28" height="14" rx="3" fill="#131b26"/>' +
  '</svg>';
}

// ── Doser SVG (two realistic chemical bottles) ───────────────────────────────

function buildDoserSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100" width="110" height="100">' +

    /* ── LEFT BOTTLE – pH (blue) ── */
    /* Cap */
    '<rect x="17" y="6" width="20" height="8" rx="3" fill="#2040a0"/>' +
    /* Neck */
    '<rect x="19" y="13" width="16" height="9" rx="3" fill="rgba(15,30,70,0.85)"/>' +
    /* Bottle body */
    '<rect x="9" y="21" width="36" height="64" rx="6" fill="rgba(10,22,55,0.75)" stroke="rgba(100,150,220,0.35)" stroke-width="1"/>' +
    /* Liquid fill level (~65 %) */
    '<rect x="10" y="42" width="34" height="42" rx="0" fill="rgba(30,80,190,0.65)"/>' +
    /* Reflection highlight */
    '<rect x="12" y="23" width="5" height="58" rx="2" fill="rgba(255,255,255,0.1)"/>' +
    /* Label */
    '<rect x="13" y="49" width="28" height="20" rx="3" fill="rgba(240,245,255,0.88)"/>' +
    '<text x="27" y="63" text-anchor="middle" font-size="9" font-weight="700" fill="#1a3060">pH</text>' +

    /* ── RIGHT BOTTLE – Cl/Redox (red) ── */
    /* Cap */
    '<rect x="73" y="6" width="20" height="8" rx="3" fill="#b01010"/>' +
    /* Neck */
    '<rect x="75" y="13" width="16" height="9" rx="3" fill="rgba(70,15,15,0.85)"/>' +
    /* Bottle body */
    '<rect x="65" y="21" width="36" height="64" rx="6" fill="rgba(55,10,10,0.75)" stroke="rgba(220,80,80,0.35)" stroke-width="1"/>' +
    /* Liquid fill level */
    '<rect x="66" y="42" width="34" height="42" rx="0" fill="rgba(165,20,20,0.65)"/>' +
    /* Reflection highlight */
    '<rect x="68" y="23" width="5" height="58" rx="2" fill="rgba(255,255,255,0.1)"/>' +
    /* Label */
    '<rect x="69" y="49" width="28" height="20" rx="3" fill="rgba(255,240,240,0.88)"/>' +
    '<text x="83" y="63" text-anchor="middle" font-size="9" font-weight="700" fill="#600d0d">Cl</text>' +

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

    var running   = this._isOn(E.running);
    var autoOn    = this._isOn(E.automation);
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
    var nextStart = this._val(E.nextStart, '–');
    var target    = this._val(E.target, '–');
    var ph        = this._val(E.ph, '–');
    var redox     = this._val(E.redox, '–');
    var temp      = this._val(E.temperature, '–');
    var totalRT   = this._val(E.totalRuntime, '–');
    var seasRT    = this._val(E.seasonRuntime, '–');
    var maint     = this._val(E.maintenance, '–');
    var season    = this._val(E.seasonMode, 'auto');

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
      maintCountdown = Math.max(0, 500 - maintNum).toFixed(0);
    }

    /* Build visuals */
    var poolHero = buildPoolHero(running);
    var pumpSvg  = buildPumpSvg(running);
    var filtSvg  = buildFilterSvg();
    var doserSvg = buildDoserSvg();

    /* ── Header ── */
    var autoBadgeTitle = autoOn ? 'Automatik aktiv'          : 'Automatik aus';
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
    var pumpStatus  = running ? '<span class="tech-col-status">Läuft</span>' : '<span class="tech-col-status off">Aus</span>';
    var filtStatus  = warning ? '<span class="tech-col-status warn">Achtung</span>' : '<span class="tech-col-status">OK</span>';
    var doserStatus = '<span class="tech-col-status">OK</span>';

    var tech = '<div class="tech-panel">' +
      '<div class="tech-hdr">Technik</div>' +
      '<div class="tech-grid">' +
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">🔧</span><span class="tech-col-name">Poolpumpe</span>' + pumpStatus + '</div>' +
          '<div class="tech-visual">' + pumpSvg + '</div>' +
          '<div class="tech-col-metrics"><b>⚡ ' + power + '</b> W &nbsp; <b>⌇ ' + current + '</b> A</div>' +
        '</div>' +
        '<div class="tech-col">' +
          '<div class="tech-col-hdr"><span class="tech-col-icon">🏺</span><span class="tech-col-name">Sandfilter</span>' + filtStatus + '</div>' +
          '<div class="tech-visual">' + filtSvg + '</div>' +
          '<div class="tech-col-metrics"><b>⊙ –</b> bar</div>' +
        '</div>' +
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
      '<div class="pool-area">' + poolHero + '</div>' +
      tech +
    '</div>';

    /* ── Status bar ── */
    var statClass = running ? ' green' : '';
    var statSub   = running ? 'Pumpe aktiv' : 'Pumpe inaktiv';

    var statBar = '<div class="stat-bar">' +
      '<div class="stat-cell">' +
        '<div class="stat-label">Status</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22c55e;">▶</span><span class="stat-val' + statClass + '">' + statusLabel + '</span></div>' +
        '<div class="stat-sub">' + statSub + '</div>' +
      '</div>' +
      '<div class="stat-cell">' +
        '<div class="stat-label">Leistung</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#eab308;">⚡</span><span class="stat-val yellow">' + power + '</span><span class="stat-unit">W</span></div>' +
        '<div class="stat-sub">Aktuelle Leistung</div>' +
      '</div>' +
      '<div class="stat-cell">' +
        '<div class="stat-label">Spannung</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">〜</span><span class="stat-val blue">' + voltage + '</span><span class="stat-unit">V</span></div>' +
        '<div class="stat-sub">Netzspannung</div>' +
      '</div>' +
      '<div class="stat-cell">' +
        '<div class="stat-label">Strom</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">⏦</span><span class="stat-val blue">' + current + '</span><span class="stat-unit">A</span></div>' +
        '<div class="stat-sub">Aktueller Strom</div>' +
      '</div>' +
      '<div class="stat-cell">' +
        '<div class="stat-label">Frequenz</div>' +
        '<div class="stat-main"><span class="stat-ico" style="color:#22d3ee;">⊟</span><span class="stat-val blue">' + freq + '</span><span class="stat-unit">Hz</span></div>' +
        '<div class="stat-sub">Netzfrequenz</div>' +
      '</div>' +
      '<div class="stat-cell">' +
        '<div class="stat-label">Effizienz</div>' +
        '<div class="stat-main"><span class="stat-ico">🌿</span><span class="stat-val green">' + eff + '</span><span class="stat-unit">%</span></div>' +
        '<div class="stat-sub">Aktuelle Effizienz</div>' +
      '</div>' +
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

      '<div class="bpanel">' +
        '<div class="bpanel-title">Laufzeiten</div>' +
        '<div class="brow"><span class="brow-ico">▷</span><span class="brow-lbl">Laufzeit heute</span><span class="brow-val">' + runtime + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">⏱</span><span class="brow-lbl">Restlaufzeit</span><span class="brow-val">' + remaining + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">⏰</span><span class="brow-lbl">Nächster Start</span><span class="brow-val">' + nextStart + '</span></div>' +
        '<div class="brow"><span class="brow-ico">🎯</span><span class="brow-lbl">Tagesziel</span><span class="brow-val">' + target + ' h</span></div>' +
        '<div class="prog-wrap"><div class="prog-fill" style="width:' + progPct + '%"></div></div>' +
        '<div class="prog-pct">' + progPct + '%</div>' +
      '</div>' +

      '<div class="bpanel">' +
        '<div class="bpanel-title">Saison</div>' +
        '<div class="hb-sub" style="font-size:11px;">Aktuelle Saison</div>' +
        '<div class="season-name-row"><span class="season-name-icon">' + seasonIcon + '</span><span class="season-name-text">' + seasonLabel + '</span></div>' +
        '<div class="brow"><span class="brow-ico">🕐</span><span class="brow-lbl">Saisonlaufzeit</span><span class="brow-val">' + seasRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">🎯</span><span class="brow-lbl">Ziel-Laufzeit</span><span class="brow-val">' + target + ' h</span></div>' +
        '<div class="season-link" id="btn-season-cycle">' + seasonIcon + ' Saisonmodus: ' + seasonLabel + '</div>' +
      '</div>' +

      '<div class="bpanel">' +
        '<div class="bpanel-title">Wasserqualität</div>' +
        '<div class="brow"><span class="brow-ico">💧</span><span class="brow-lbl">pH-Wert</span><span class="brow-val">' + ph + '</span></div>' +
        '<div class="brow"><span class="brow-ico">⚡</span><span class="brow-lbl">Redox</span><span class="brow-val">' + redox + ' mV</span></div>' +
        '<div class="brow"><span class="brow-ico">🌡️</span><span class="brow-lbl">Temperatur</span><span class="brow-val">' + temp + ' °C</span></div>' +
        '<div class="wq-ok">✓ Alle Werte im optimalen Bereich</div>' +
      '</div>' +

      '<div class="bpanel">' +
        '<div class="bpanel-title">Wartung &amp; Betriebsstunden</div>' +
        '<div class="brow"><span class="brow-ico">⚙️</span><span class="brow-lbl">Gesamt</span><span class="brow-val">' + totalRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">🌿</span><span class="brow-lbl">Saison</span><span class="brow-val">' + seasRT + ' h</span></div>' +
        '<div class="brow"><span class="brow-ico">🔧</span><span class="brow-lbl">Seit Wartung</span><span class="brow-val">' + maint + ' h</span></div>' +
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
