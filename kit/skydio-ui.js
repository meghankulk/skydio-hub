/*! Skydio UI Kit 0.1.0 · skydio-ui.js
   One source for the ontology, components, basemaps, scenario resolver and the principle linter.
   Reverse-engineered from public Skydio marketing screenshots. Not affiliated with Skydio.
   Every component is a pure function: props in, HTML string out. Render inside an element with class "sky".
   Data attributes the linter and live apps rely on:
     data-entity / data-type / data-comp / data-st  → ontology trace
     data-card + data-row="1|2|3"                   → three-row card grammar (P11)
     data-state                                     → state badge (P05)
     data-telemetry                                 → a measurement that needs a unit (P06)
     data-aircraft-container + data-stop            → per-aircraft safe stop (P02)
     data-overlay                                   → drawn over imagery (P09)
     data-cot                                       → TAK affiliation symbol (P07)
     data-touch                                     → controller touch target (P08)
     data-act + data-id                             → operator action (live apps)
     data-bk/bf/bu, data-pk, data-rot               → live telemetry, position and heading bindings */
(function (global) {
"use strict";
const K = { version: "0.1.0" };

/* ================= ontology ================= */
K.ONTO = {
  air: ["ready","launching","flying","holding","returning","relieved"],
  airborne: ["launching","flying","holding","returning","relieved"],
  mission: ["scheduled","upcoming","active","paused","done"],
  mtype: ["patrol","response","overwatch","relief"],
  incident: ["new","claimed","responding","resolved"],
  aff: ["hostile","friend","unknown","neutral"],
  cls: ["person","vehicle","animal"],
  task: ["monitor","respond","track","plan","relief"],
  surface: ["desktop","controller"]
};
K.PRINCIPLES = [
  ["P01","Color is a signal, never decoration"],["P02","Red is reserved for stop, hostile, and live"],
  ["P03","One entity, one identity, every pane"],["P04","Layout follows the response loop"],
  ["P05","Lead with state"],["P06","Machine data looks like machine data"],
  ["P07","Speak the destination's dialect"],["P08","Density changes by device; vocabulary doesn't"],
  ["P09","Overlays carry their own contrast"],["P10","Every alert has a source, an owner, a clock and an end"],
  ["P11","Cards share a three-row grammar"],["P12","Quiet surfaces, sharp edges"]
];
K.STATE_LABEL = { new:"New", claimed:"Claimed", responding:"Responding", resolved:"Resolved", active:"Active", upcoming:"Upcoming", scheduled:"Scheduled", paused:"Paused", done:"Done", ready:"Ready", launching:"Launching", flying:"Flying", holding:"Holding", returning:"Returning", relieved:"Relieved" };

/* ================= helpers ================= */
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const hashStr = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
const rng = seed => { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; };
const pick = (arr, v, d) => arr.includes(v) ? v : d;
const clamp = (n, a, b, d) => { n = Number(n); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
const initials = n => String(n || "?").replace(/^(You \()?(SSG|SGT|CPL|SPC|PFC|PVT|LT|CPT|MSG)\.?\s+/i, "").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
const fmtAge = s => { s = Math.max(0, Math.round(s)); return s < 60 ? `${s} sec` : s < 3600 ? `${Math.floor(s / 60)} min` : `${Math.floor(s / 3600)} hr`; };
const clsIcon = c => c === "vehicle" ? "car" : c === "animal" ? "paw" : "person";
const attrs = o => Object.entries(o || {}).filter(([, v]) => v != null && v !== false).map(([k, v]) => v === true ? k : `${k}="${esc(v)}"`).join(" ");
const act = (name, id) => name ? { "data-act": name, "data-id": id ?? "", role: "button", tabindex: "0" } : {};
const bind = (key, field, unit) => key ? { "data-bk": key, "data-bf": field, "data-bu": unit || "" } : {};
Object.assign(K, { esc, hashStr, rng, pick, clamp, initials, fmtAge, clsIcon, attrs, act, bind });

/* ================= icon sprite ================= */
K.SPRITE = `<svg id="sky-sprite" width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></symbol>
<symbol id="i-drone" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 8 3 3m5-3-3 3m-5 5 3-3m5 3-3-3"/></symbol>
<symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/></symbol>
<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4"/></symbol>
<symbol id="i-layers" viewBox="0 0 24 24"><path d="m12 4 9 5-9 5-9-5z"/><path d="m3 14 9 5 9-5"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></symbol>
<symbol id="i-descend" viewBox="0 0 24 24"><path d="M12 5v11m-4-4 4 4 4-4M6 20h12"/></symbol>
<symbol id="i-return" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></symbol>
<symbol id="i-share" viewBox="0 0 24 24"><path d="M12 3v12m-4-8 4-4 4 4M5 13v7h14v-7"/></symbol>
<symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2m10-10 2-2"/></symbol>
<symbol id="i-expand" viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></symbol>
<symbol id="i-person" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="m9 21 2-6-2-3 1-4h4l2 4M12 15l3 6"/></symbol>
<symbol id="i-car" viewBox="0 0 24 24"><path d="M4 16v-4l2-5h12l2 5v4zM4 16v3m16-3v3"/></symbol>
<symbol id="i-paw" viewBox="0 0 24 24"><circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-8 3-8 0z"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></symbol>
<symbol id="i-batt" viewBox="0 0 24 24"><rect x="3" y="7" width="16" height="10" rx="1.5"/><path d="M21 10v4"/></symbol>
<symbol id="i-scan" viewBox="0 0 24 24"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="12" cy="10" r="2"/><path d="M8 16c1-2 2.4-3 4-3s3 1 4 3"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-panels" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="16" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></symbol>
<symbol id="i-hex" viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M20 4 4 11l7 2 2 7z"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 7v6M12 17v.5"/></symbol>
<symbol id="i-swap" viewBox="0 0 24 24"><path d="M7 7h12l-3-3M17 17H5l3 3"/></symbol>
</svg>`;
K.mount = () => { if (!document.getElementById("sky-sprite")) document.body.insertAdjacentHTML("afterbegin", K.SPRITE); };
const ic = (n, cls = "ic") => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;
K.ic = ic;

/* ================= atoms ================= */
K.badge = (state, o = {}) => `<span class="badge b-${state}" data-state="${state}" data-control${o.pill ? ' style="border-radius:12px"' : ""}>${esc(o.label || K.STATE_LABEL[state] || state)}</span>`;
K.LiveTag = () => `<span class="live" data-live>LIVE</span>`;
K.Initials = name => `<span class="initials">${esc(initials(name))}</span>`;
K.Button = (o = {}) => `<span class="btn${o.variant ? " " + o.variant : ""}${o.wide ? " wide" : ""}${o.disabled ? " off" : ""}" ${attrs({ "data-control": true, "data-stop": o.stop, "data-fleetstop": o.fleetstop, "data-f": o.f, "data-touch": o.touch, ...act(o.act, o.id), ...(o.attrs || {}) })}${o.touch ? ' style="min-height:44px"' : ""}>${o.icon ? ic(o.icon) : ""}${esc(o.label || "")}</span>`;
K.IconButton = (o = {}) => `<span class="ib${o.variant === "red" ? " red" : ""}" ${attrs({ "data-control": true, "data-stop": o.stop, title: o.title, "aria-label": o.title, ...act(o.act, o.id) })}>${ic(o.icon)}</span>`;
K.Segmented = (items, o = {}) => `<span class="seg2" data-control>${items.map(it => `<span class="${it.on ? "on" : ""}" ${attrs(act(it.act, it.id))}>${esc(it.label)}</span>`).join("")}</span>`;
K.AffiliationPicker = (current, o = {}) => `<span class="affs" role="group" aria-label="TAK marker type">${K.ONTO.aff.map(a => `<span class="aff${a === current ? " on" : ""}" ${attrs({ ...act(o.act, `${o.id}|${a}`), title: a[0].toUpperCase() + a.slice(1), "aria-label": a, "data-touch": o.touch })}><i class="tak-${a}" data-cot="${a}" style="${a === "hostile" ? "transform:rotate(45deg) scale(.8)" : a === "unknown" ? "border-radius:50%" : ""}"></i></span>`).join("")}</span>`;

/* ================= shell ================= */
K.TopBar = o => `<div class="d-top">${ic("home")}<span class="crumb">${esc(o.site)} / <b>${esc(o.module)}</b></span><span class="clock" ${attrs(bind(o.clockKey, "clock"))}>${esc(o.clock || "")}</span></div>`;
K.NavRail = (o = {}) => `<nav class="d-nav" data-pane="nav"><span class="b on">${ic("send")}${o.badge ? `<span class="badge-n">${o.badge}</span>` : ""}</span><span class="b">${ic("drone")}</span><span class="b">${ic("route")}</span><span class="b">${ic("panels")}</span><span class="b" style="margin-top:auto;margin-bottom:10px">${ic("chat")}</span></nav>`;
K.Section = (title, count, body, o = {}) => (body || o.always) ? `<div class="sec">${esc(title)}<span>${count ?? ""}</span></div>${body || `<div class="empty">${esc(o.empty || "Nothing here")}</div>`}` : "";
K.ListPane = (o = {}) => `<section class="d-list" data-pane="list">${o.banner || ""}<div class="ph"><b style="font-weight:500">${esc(o.title || "Operations")}</b>${ic("panels")}</div><div class="scroll" style="overflow-y:auto"><div class="field" data-control>${ic("search")}Search operations</div><div class="selects"><span class="select" data-control>Group by · Sector${ic("chev")}</span><span class="select" data-control>Sort · Start${ic("chev")}</span></div>${o.body || ""}</div></section>`;

/* ================= cards (three-row grammar) ================= */
K.IncidentCard = o => {
  const own = o.owner;
  const actions = (o.actions || []).map(a => K.Button({ ...a, f: a.f })).join("");
  return `<div class="card${o.focus ? " is-focus" : ""}" data-card data-incident data-entity="${esc(o.id)}" data-type="Incident" data-comp="IncidentCard" data-st="${o.state}">
    <div data-row="1">${esc(o.title)} ${K.badge(o.state)}</div>
    <div data-row="2"><div class="sensor"><div class="ico"><span class="dia red" style="position:static;transform:rotate(45deg);width:16px;height:16px;border-width:1.5px">${ic("alert")}</span></div><div class="t" data-f="source">${esc(o.sensor)}<small>${esc(String(o.source).toUpperCase())} SYSTEM ALERT</small></div><span class="chip-o" data-f="age" data-telemetry ${attrs(bind(o.ageKey, "age"))}>${esc(o.age)}</span></div></div>
    <div data-row="3"><span data-f="owner">${own ? `<span style="display:inline-flex;gap:6px;align-items:center">${K.Initials(own)}${esc(own)}</span>` : `<span style="color:var(--t-2)">Unclaimed</span>`}</span><span class="r">${actions}</span></div>
  </div>`;
};
K.LaunchCard = o => `<div class="card${o.focus ? " is-focus" : ""}" data-card data-entity="${esc(o.aircraft.id)}" data-type="Aircraft" data-comp="LaunchCard" data-st="${o.aircraft.state}" ${attrs(act(o.focusAct, o.aircraft.id))}>
    <div data-row="1">${esc(o.aircraft.id)} <span class="mono" style="color:var(--t-2);font-weight:400;font-size:11px">${esc(o.aircraft.dock)}</span>${K.badge(o.aircraft.state)}</div>
    <div data-row="2"><span style="color:var(--green);display:inline-flex;gap:5px;align-items:center">${ic("check")}Ready for flight</span><small>${esc(o.note || "Dock door open · preflight passed")}</small></div>
    <div data-row="3">${K.Button({ label: o.aircraft.state === "launching" ? "Launching…" : "Launch", variant: "blue", wide: true, ...(o.action || {}) })}</div>
  </div>`;
K.PatrolCard = o => {
  const m = o.mission, a = o.aircraft;
  const st = m.state === "upcoming" ? K.badge("upcoming", { label: `Upcoming: ${m.start}`, pill: o.pill }) : K.badge(m.state, { pill: o.pill });
  return `<div class="card${m.attention ? " attn" : ""}${o.focus ? " is-focus" : ""}" data-card data-entity="${esc(a ? a.id : m.id)}" data-mission="${esc(m.id)}" data-type="Mission" data-comp="${m.attention ? "OperationItem" : "PatrolCard"}" data-st="${m.state}${m.attention ? " + needs attention" : ""}" ${attrs(act(o.focusAct, a && a.id))}>
    <div data-row="1">${esc(m.name)} ${st}</div>
    <div data-row="2">${esc(m.sector)}<small>${m.attention && m.reason ? `<span class="reason">${esc(m.reason)}</span> · ` : ""}${m.next ? "Next: " + esc(m.next) : ""}${m.cadence ? " · " + esc(m.cadence) : ""}</small></div>
    <div data-row="3">${a ? `${K.Initials(a.pilot)}<span class="cnt">${ic("drone")}${esc(a.id)}</span><span class="cnt mono" data-telemetry ${attrs(bind(a.id, "battery", "%"))}>${Math.round(a.battery)}%</span>` : `<span style="color:var(--t-2)">Unassigned</span>`}<span class="r">${(o.dets || []).map(d => `<span class="cnt">${ic(clsIcon(d.cls))}${d.count}</span>`).join("")}${(o.actions || []).map(K.Button).join("")}</span></div>
  </div>`;
};
K.MissionItem = o => {
  const m = o.mission, R = rng(hashStr(o.routeSeed || m.id));
  const pts = Array.from({ length: 5 }, () => [6 + R() * 48, 6 + R() * 36].map(n => n.toFixed(1)).join(",")).join(" ");
  return `<div class="card sched${m.attention ? " attn" : ""}" data-card data-entity="${esc(m.id)}" data-type="Mission" data-comp="MissionItem" data-st="${m.state}${m.attention ? " + needs attention" : ""}">
    <div class="thumb"><svg viewBox="0 0 60 48"><polygon points="${pts}" fill="none" stroke="#1a6cf0" stroke-width="2.2"/></svg></div>
    <div data-row="1">${esc((m.workOrder ? m.workOrder + ": " : "") + m.name)} ${K.badge(m.state)}</div>
    <div data-row="2">${esc(m.sector)}<small>${esc(o.aircraftLabel || "Unassigned")}${m.attention ? " · " + esc(m.reason || "TFR conflict") : ""}</small></div>
    <div data-row="3"><span class="chip-time" data-telemetry>${esc(m.start || "--:--")}</span>${m.cadence ? `<span style="color:var(--t-2)">${esc(m.cadence)}</span>` : ""}<span class="r">${(o.actions || []).map(K.Button).join("")}</span></div>
  </div>`;
};
K.AssetItem = o => {
  const a = o.aircraft;
  return `<div class="card${o.focus ? " is-focus" : ""}" data-card data-entity="${esc(a.id)}" data-type="Aircraft" data-comp="AssetItem" data-st="${a.state}" ${attrs(act(o.focusAct, a.id))}>
    <div data-row="1"><span>${a.state !== "ready" ? K.LiveTag() + " " : ""}${esc(a.dock)}</span>${K.badge(a.state)}</div>
    <div data-row="2">${esc(a.id)}<small>${esc(a.pilot)}</small></div>
    <div data-row="3"><span class="cnt mono" data-telemetry ${attrs(bind(a.id, "battery", "%"))}>${Math.round(a.battery)}%</span>${ic("batt")}<span class="r">${(o.actions || []).map(K.Button).join("") || ic("target") + ic("eye")}</span></div>
  </div>`;
};

/* ================= basemaps ================= */
K.BASEMAPS = ["satellite","topo","dark","street"];
K.BASEMAP_LABEL = { satellite:"Satellite", topo:"Topo", dark:"Dark", street:"Street" };
K.BASEMAP_SWATCH = { satellite:"linear-gradient(140deg,#6b6448,#3f4632)", topo:"repeating-radial-gradient(circle at 40% 60%,#ece6d3 0 4px,#c9b48a 4px 5px)", dark:"linear-gradient(140deg,#262a30,#16191d)", street:"linear-gradient(90deg,#eef0f2 45%,#fff 45% 55%,#eef0f2 55%)" };
K.isLightMap = t => t === "topo" || t === "street";
K.basemap = (type, seed, night) => {
  const R = rng(hashStr(seed + type)); const f = n => n.toFixed(1);
  if (type === "topo") {
    let c = ""; for (let k = 0; k < 3; k++) { const cx = 15 + R() * 70, cy = 15 + R() * 70; for (let i = 1; i <= 7; i++) { const r = i * 4.2; const pts = Array.from({ length: 14 }, (_, j) => { const a = j / 14 * Math.PI * 2, w = r * (.82 + R() * .3); return f(cx + Math.cos(a) * w * 1.2) + "," + f(cy + Math.sin(a) * w); }).join(" "); c += `<polygon points="${pts}" fill="none" stroke="rgba(150,105,55,${i % 5 === 0 ? .75 : .38})" stroke-width="${i % 5 === 0 ? 1.4 : .8}" vector-effect="non-scaling-stroke"/>`; } }
    const river = `<path d="M0 ${f(60 + R() * 20)} C 30 ${f(50 + R() * 20)}, 55 ${f(80 + R() * 10)}, 100 ${f(65 + R() * 20)}" stroke="#8fbfe0" stroke-width="3" fill="none" vector-effect="non-scaling-stroke"/>`;
    const trail = `<path d="M${f(R() * 30)} 0 L ${f(40 + R() * 30)} 100" stroke="#a0522d" stroke-width="1.2" stroke-dasharray="5 3" fill="none" vector-effect="non-scaling-stroke"/>`;
    const grid = Array.from({ length: 4 }, (_, i) => `<path d="M${(i + 1) * 20} 0V100M0 ${(i + 1) * 20}H100" stroke="rgba(60,90,140,.22)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join("");
    return { bg: "#ece6d3", svg: grid + c + river + trail };
  }
  if (type === "dark" || type === "street") {
    const dark = type === "dark";
    const P = dark ? { bg:"#1a1d21", block:"#23272c", road:"#3a4049", park:"#1d2a22", water:"#14222f" } : { bg:"#eef0f2", block:"#e1e4e8", road:"#ffffff", park:"#d7ead1", water:"#c7def2" };
    let s = `<rect x="${f(R() * 60)}" y="${f(R() * 60)}" width="${f(18 + R() * 14)}" height="${f(12 + R() * 12)}" fill="${P.park}"/><path d="M0 ${f(80 + R() * 15)} Q 50 ${f(70 + R() * 10)} 100 ${f(85 + R() * 10)} V100 H0Z" fill="${P.water}"/>`;
    for (let i = 0; i < 40; i++) s += `<rect x="${f(R() * 96)}" y="${f(R() * 96)}" width="${f(3 + R() * 6)}" height="${f(2 + R() * 5)}" fill="${P.block}"/>`;
    for (let i = 1; i < 8; i++) { const x = i * 12.5 + (R() - .5) * 3, y = i * 12.5 + (R() - .5) * 3; s += `<path d="M${f(x)} 0V100M0 ${f(y)}H100" stroke="${dark ? P.road : "#d3d7dc"}" stroke-width="${dark ? 1.2 : 3.2}" vector-effect="non-scaling-stroke"/>${dark ? "" : `<path d="M${f(x)} 0V100M0 ${f(y)}H100" stroke="${P.road}" stroke-width="2" vector-effect="non-scaling-stroke"/>`}`; }
    s += `<path d="M0 ${f(30 + R() * 20)} L100 ${f(40 + R() * 20)}" stroke="${dark ? "#c98a2a" : "#e0b64a"}" stroke-opacity="${dark ? .55 : 1}" stroke-width="${dark ? 2 : 4}" vector-effect="non-scaling-stroke"/>`;
    return { bg: P.bg, svg: s };
  }
  const bldg = Array.from({ length: 46 }, () => `<rect x="${f(R() * 96)}" y="${f(R() * 96)}" width="${f(1.5 + R() * 4)}" height="${f(1.2 + R() * 3)}" fill="rgba(225,220,205,${(.25 + R() * .3).toFixed(2)})"/>`).join("");
  const roads = `<path d="M0 ${f(30 + R() * 10)} C 30 ${f(20 + R() * 20)}, 60 ${f(50 + R() * 10)}, 100 ${f(40 + R() * 20)}" stroke="rgba(230,225,210,.35)" stroke-width="1.4" fill="none" vector-effect="non-scaling-stroke"/><path d="M${f(40 + R() * 20)} 0 L ${f(30 + R() * 30)} 100" stroke="rgba(230,225,210,.3)" stroke-width="1.2" fill="none" vector-effect="non-scaling-stroke"/>`;
  return { bg: night ? "linear-gradient(140deg,#4d4f47,#33352f 55%,#26281f)" : "linear-gradient(140deg,#6b6448,#565239 50%,#3f4632)", svg: bldg + roads };
};
K.BasemapSwitcher = (current, o = {}) => `<div class="bmap" data-control data-comp="BasemapSwitcher" data-entity="basemap" data-type="Map" data-st="${current}" role="group" aria-label="Map type">${K.BASEMAPS.map(t => `<button type="button" data-basemap="${t}" class="${t === current ? "on" : ""}" aria-pressed="${t === current}"><i data-imagery style="background:${K.BASEMAP_SWATCH[t]}"></i>${K.BASEMAP_LABEL[t]}</button>`).join("")}</div>`;

/* ================= map ================= */
const pts2 = pts => pts.map(p => p.map(n => n.toFixed(2)).join(",")).join(" ");
K.svgSector = (pts, light) => `<polygon points="${pts2(pts)}" fill="${light ? "rgba(26,108,240,.05)" : "rgba(255,255,255,.04)"}" stroke="${light ? "rgba(30,34,40,.75)" : "rgba(255,255,255,.55)"}" stroke-width="1.4" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`;
K.svgAirspace = (pts, id) => `<polygon points="${pts2(pts)}" fill="url(#hatch)" stroke="#df2a2f" stroke-width="2" vector-effect="non-scaling-stroke" data-entity="${esc(id)}" data-type="AirspaceLimit" data-comp="Polygon.hatched" data-st="active"/>`;
K.svgRoute = (pts, k, light) => { const loop = pts.concat([pts[0]]); return `<polyline points="${pts2(loop)}" fill="none" stroke="${light ? "rgba(20,22,25,.7)" : "rgba(0,0,0,.55)"}" stroke-width="5.5" vector-effect="non-scaling-stroke"/><polyline points="${pts2(loop.slice(0, k + 1))}" fill="none" stroke="#1a6cf0" stroke-width="3" vector-effect="non-scaling-stroke"/><polyline points="${pts2(loop.slice(k))}" fill="none" stroke="#fff" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`; };
K.svgCone = (x, y, heading, focus, aspect = 1.3) => { const r = (heading - 90) * Math.PI / 180, sp = .42, L = 10; const p1 = [x + Math.cos(r - sp) * L, y + Math.sin(r - sp) * L / aspect], p2 = [x + Math.cos(r + sp) * L, y + Math.sin(r + sp) * L / aspect]; return `<polygon points="${x.toFixed(2)},${y.toFixed(2)} ${p1.map(n => n.toFixed(2)).join(",")} ${p2.map(n => n.toFixed(2)).join(",")}" fill="${focus ? "rgba(245,180,0,.3)" : "rgba(26,108,240,.32)"}"/>`; };
K.svgTether = (a, b) => `<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;
const at = (x, y) => `left:${x.toFixed(2)}%;top:${y.toFixed(2)}%`;
K.DroneMarker = o => `<div class="mk${o.focus ? " is-focus" : ""}" ${attrs({ "data-overlay": true, "data-entity": o.id, "data-type": "Aircraft", "data-comp": o.comp || "DroneMarker", "data-st": o.state, "data-pk": o.pk, ...act(o.act, o.id), "aria-label": `Aircraft ${o.id}` })} style="${at(o.x, o.y)}"><span class="dm" data-rot="${esc(o.pk || "")}" style="transform:rotate(${Math.round(o.heading || 0)}deg)${o.small ? ";width:22px;height:22px;border-width:2px" : ""}"><svg class="ic" viewBox="0 0 24 24" style="fill:currentColor;stroke:none${o.small ? ";width:11px;height:11px" : ""}"><path d="M12 3 19 20 12 16 5 20z"/></svg></span>${o.small ? "" : `<span class="dlbl"><span class="mono" data-telemetry>${esc(o.id)} · <span ${attrs(bind(o.id, "alt", "ft"))}>${Math.round(o.alt || 0)}ft</span> · <span ${attrs(bind(o.id, "battery", "%"))}>${Math.round(o.battery || 0)}%</span></span></span>`}</div>`;
K.Waypoint = o => `<span class="wp ${o.done ? "done" : "next"}" data-overlay data-entity="${esc(o.entity)}" data-type="Waypoint" data-comp="RouteMarker" data-st="${o.done ? "reached" : "pending"}" style="${at(o.x, o.y)}">${o.n}</span>`;
K.EventMarker = o => `<span class="dia ${o.kind === "poi" ? "purple" : "red"}" ${attrs({ "data-overlay": true, "data-entity": o.id, "data-type": o.type || (o.kind === "alert" ? "Incident" : "Detection"), "data-comp": "EventMarker." + o.kind, "data-st": o.state || "seen", "data-pk": o.pk, ...act(o.act, o.actId || o.id) })} style="${at(o.x, o.y)}">${o.kind === "alert" ? '<b style="font-size:14px">!</b>' : o.kind === "poi" ? ic("pin") : ic(clsIcon(o.kind))}</span>`;
K.CoTMarker = o => `<span class="cot tak-${o.aff}" ${attrs({ "data-overlay": true, "data-cot": o.aff, "data-entity": o.id, "data-type": "Marker", "data-comp": "CoTMarker", "data-st": o.state || "published", "data-pk": o.pk, title: o.label })} style="${at(o.x, o.y)}"></span>`;
K.DockMarker = o => `<span class="dock" data-overlay data-entity="${esc(o.id)}" data-type="Dock" data-comp="DockMarker" data-st="${o.state}" title="${esc(o.id)}" style="${at(o.x, o.y)}">S</span>`;
K.SectorLabel = o => `<span class="slbl" data-overlay style="${at(o.x, o.y)}">${esc(o.name)}</span>`;
K.MapSearch = () => `<div class="msearch" data-control>${ic("search")}Search Map</div>`;
K.MapToolbar = () => `<div class="mtools" data-control><span data-control>3D</span><span class="on" data-control>${ic("layers")}</span><span data-control>${ic("target")}</span><span data-control>${ic("eye")}</span></div>`;
K.FleetActions = (o = {}) => `<div class="fleet" data-fleet data-comp="FleetActions" data-entity="fleet" data-type="Aircraft[]"><span class="l">All Drones</span>${o.paused ? K.Button({ label: "Resume", icon: "play", variant: "blue", act: "fleet-resume" }) : K.Button({ label: "Pause", icon: "pause", variant: "red", act: "fleet-pause", fleetstop: true })}${K.Button({ label: "Descend", icon: "descend", act: "fleet-descend" })}${K.Button({ label: "Return", icon: "return", act: "fleet-return" })}</div>`;
K.AlertToast = o => `<div class="atoast${o.urgency === "action" ? " action" : ""}${o.tak ? " tak" : ""}" data-overlay ${o.tak ? 'data-dialect="tak"' : ""} data-comp="${o.tak ? "IsrToast" : "AlertToast"}"><div><b>${esc(o.line1)}</b><span>${esc(o.line2 || "")}</span></div></div>`;
K.MapPane = o => {
  const BM = K.basemap(o.basemap, o.seed, o.night);
  return `<div class="d-map" data-pane="map">
    <div class="mapbg" data-imagery data-basemap-type="${o.basemap}" style="background:${BM.bg}"><svg class="mapsvg" viewBox="0 0 100 100" preserveAspectRatio="none">${BM.svg}</svg></div>
    <svg class="mapsvg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><pattern id="hatch" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="2.2" fill="rgba(223,42,47,.45)"/></pattern></defs>${o.svg || ""}<g data-layer="dynamic">${o.dynamicSvg || ""}</g></svg>
    ${o.overlays || ""}
    ${o.toasts ? `<div class="toasts">${o.toasts}</div>` : ""}
    ${K.MapSearch()}${K.MapToolbar()}${K.BasemapSwitcher(o.basemap)}
    ${o.fleet === false ? "" : K.FleetActions(o.fleet || {})}
  </div>`;
};

/* ================= video ================= */
K.videoBg = (seed, sensor) => {
  const R = rng(hashStr(seed)); const th = sensor === "thermal";
  const blobs = Array.from({ length: 7 }, () => `radial-gradient(circle at ${(R() * 100).toFixed(0)}% ${(R() * 100).toFixed(0)}%, ${th ? `rgba(${150 + R() * 60 | 0},${150 + R() * 60 | 0},${150 + R() * 60 | 0},.5)` : `rgba(${90 + R() * 60 | 0},${85 + R() * 50 | 0},${60 + R() * 40 | 0},.55)`} 0, transparent ${(18 + R() * 20).toFixed(0)}%)`).join(",");
  return `${blobs},${th ? "linear-gradient(170deg,#6a6a6a,#3a3a3a 60%,#202020)" : "linear-gradient(170deg,#8a8f86 0,#6d6a55 30%,#4f5040 65%,#363a2e)"}`;
};
K.HUD = a => `<div class="hud" data-overlay data-comp="HUD.compact"><div><span data-telemetry ${attrs(bind(a.id, "battery", "%"))}>${Math.round(a.battery)}%</span><span class="u">BATTERY</span></div><div><span data-telemetry ${attrs(bind(a.id, "speed", " MPH"))}>${Math.round(a.speed)} MPH</span><span class="u">SPEED</span></div><div><span data-telemetry ${attrs(bind(a.id, "heading", "°"))}>${Math.round(a.heading)}°</span><span class="u">HEADING</span></div><div><span data-telemetry ${attrs(bind(a.id, "alt", " FT"))}>${Math.round(a.alt)} FT</span><span class="u">MAX 400</span></div></div>`;
K.CamStack = sensor => `<div class="camst"><div data-overlay><i class="recdot"></i>REC</div><div data-overlay><i style="width:9px;height:9px;background:${sensor === "thermal" ? "#888" : "var(--blue)"};display:block"></i>${sensor === "thermal" ? "THERMAL" : "COLOR"}</div></div>`;
K.Reticle = o => `<span class="ret" data-overlay data-entity="${esc(o.id || "DET")}" data-type="Detection" data-comp="Reticle" data-st="seen" style="left:${o.x}%;top:${o.y}%${o.cls === "animal" ? ";filter:none" : ""}"><i></i><i></i><i></i><i></i><b${o.cls === "animal" ? ' style="background:var(--amber);color:#2a1d00"' : ""}>${esc(o.cls.toUpperCase())}</b></span>`;
K.BoundingBox = o => `<span class="bbox" data-overlay data-entity="${esc(o.id)}" data-type="Subject" data-comp="BoundingBox" data-st="${o.state || "tracking"}" style="left:${o.x}%;top:${o.y}%;width:${o.w || 120}px;height:${o.h || 72}px">${o.aff ? `<span class="dia" style="left:50%;top:-2px;width:14px;height:14px;position:absolute;border-width:1.5px;background:var(--tak-${o.aff});border-color:#000" data-cot="${o.aff}"></span>` : ""}<span class="tg">1-${esc(o.cls)}</span></span>`;
K.FeedTile = o => {
  const a = o.aircraft; const air = K.ONTO.airborne.includes(a.state);
  const stop = air && !o.noStop ? K.IconButton({ icon: "return", variant: "red", stop: true, title: "Return to home", act: o.rthAct, id: a.id }) : "";
  const hold = air && o.holdAct ? K.IconButton({ icon: a.state === "holding" ? "play" : "pause", title: a.state === "holding" ? "Resume" : "Hold position", act: o.holdAct, id: a.id }) : "";
  return `<div class="tile${o.focus ? " is-focus" : ""}" data-aircraft-container="${esc(a.id)}" data-entity="${esc(a.id)}" data-type="Aircraft" data-comp="FeedTile" data-st="${a.state}">
    <div class="hd" ${attrs(act(o.focusAct, a.id))}><b>${esc(a.id)}</b>${K.badge(a.state)}<span class="who">${esc(a.dock)} · ${esc(a.pilot)}</span><span class="tools">${air ? K.LiveTag() : ""}<span class="sig">.ıl FUS ⊘ NAV</span>${hold}<span class="ib">${ic("expand")}</span>${stop}</span></div>
    <div class="vid"><div data-imagery ${attrs({ "data-vid": o.vidKey })} style="position:absolute;inset:0;background:${K.videoBg(a.id + (o.seed || "v"), a.sensor)};background-size:160% 160%"></div>
      ${air ? `${K.HUD(a)}${K.CamStack(a.sensor)}${o.det ? K.Reticle(o.det) : ""}${o.sub ? K.BoundingBox(o.sub) : ""}` : `<div class="onvid" data-overlay>On dock · <span data-telemetry ${attrs(bind(a.id, "battery", "%"))}>${Math.round(a.battery)}%</span> · ${a.battery >= 95 ? "ready for flight" : "charging"}</div>`}
    </div>${o.footer ? `<div class="tfoot">${o.footer}</div>` : ""}</div>`;
};

/* ================= controller ================= */
K.Ring = (v, size = 42, key) => { const c = 2 * Math.PI * 17, ok = Math.max(0, v) / 100 * c; return `<span class="ring" style="width:${size}px;height:${size}px;font-size:${size < 42 ? 10.5 : 14}px"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="17" stroke="#333" stroke-width="4" fill="none"/><circle cx="21" cy="21" r="17" stroke="${v < 25 ? "#df2a2f" : "#2a9a4a"}" stroke-width="4" fill="none" stroke-dasharray="${ok.toFixed(1)} ${c.toFixed(1)}" ${attrs({ "data-ring": key })}/></svg><span data-telemetry ${attrs(bind(key, "battery", "%"))}>${Math.round(v)}%</span></span>`; };
K.mgrs = (seedA, seedB, zone = "14R MS") => `${zone} ${String(85000 + (hashStr(seedA) % 999)).padStart(5, "0")} ${String(81000 + (hashStr(seedB) % 999)).padStart(5, "0")}`;
K.FlightStrip = (a, mgrs) => `<div class="strip" data-overlay data-comp="HUD.full"><span class="nm">${esc(a.id)}<small class="mono" data-telemetry>${esc(mgrs)}</small></span>${K.Ring(a.battery, 42, a.id)}
  <span class="cell"><span class="k">VIO</span>.ıl&nbsp;<span class="k">GPS</span>.ıl</span>
  <span class="cell"><span class="k">HAL</span><span data-telemetry ${attrs(bind(a.id, "alt", "ft"))}>${Math.round(a.alt)}ft</span></span>
  <span class="cell"><span class="k">SPD</span><span data-telemetry ${attrs(bind(a.id, "speed", "mph"))}>${Math.round(a.speed)}mph</span></span>
  <span class="cell"><span class="k">HDG</span><span data-telemetry ${attrs(bind(a.id, "heading", "°"))}>${Math.round(a.heading)}°</span></span>
  <span class="cell"><span class="k">FREQ</span><span data-telemetry>2052 MHz</span></span></div>`;
K.ToolRail = (active, o = {}) => `<div class="c-rail l" data-rail="left">${["panels","plus","send","gear","scan","hex","chat"].map(n => `<span class="t${n === active ? " on" : ""}" data-touch data-control>${ic(n)}</span>`).join("")}</div>`;
K.CaptureRail = (o = {}) => `<div class="c-rail r" data-rail="right"><span class="t" data-touch data-control>${ic("bell")}</span><span class="z on" data-touch data-control>4.3x</span><span class="z" data-touch data-control>1x</span>${o.hold ? `<span class="t" data-touch data-control ${attrs(act(o.hold.act, o.hold.id))} aria-label="${o.hold.label}">${ic(o.hold.icon)}</span>` : ""}${o.stop ? `<span class="rth" data-touch data-control data-stop ${attrs(act(o.stop.act, o.stop.id))}>RTH</span>` : ""}<span class="rec" data-touch data-control></span></div>`;
K.ShadowFlyout = o => `<div class="fly" data-overlay data-comp="Flyout.shadow" data-entity="${esc(o.subject.id)}" data-type="Subject" data-st="tracking"><div class="r"><span class="ttl">Shadow</span>${ic("gear")}</div><div class="r" data-touch style="min-height:44px">Subject Tracking<span class="tog" data-control></span></div><div>Mode</div><div class="segb" data-control>${["track","follow"].map(m => `<span class="${o.subject.mode === m ? "on" : ""}" data-touch ${attrs(act(o.modeAct, `${o.subject.id}|${m}`))}>${m[0].toUpperCase() + m.slice(1)}</span>`).join("")}</div><div>Subject TAK Marker Type</div>${K.AffiliationPicker(o.subject.aff, { act: o.affAct, id: o.subject.id, touch: true })}<div class="r" style="gap:8px;justify-content:flex-start">${o.publishAct ? K.Button({ label: o.subject.published ? "Published to TAK" : "Publish to TAK", variant: o.subject.published ? "" : "blue", touch: true, act: o.subject.published ? null : o.publishAct, id: o.subject.id }) : ""}${o.reliefAct ? K.Button({ label: "Request relief", icon: "swap", touch: true, act: o.reliefAct, id: o.aircraftId }) : ""}</div></div>`;
K.IncidentToast = o => `<div class="ctoast" data-overlay data-incident data-entity="${esc(o.id)}" data-type="Incident" data-comp="IncidentToast" data-st="${o.state}"><span data-f="source">${esc(o.title)} · ${esc(o.source)}</span><span class="chip-o" data-f="age" data-telemetry ${attrs(bind(o.ageKey, "age"))}>${esc(o.age)}</span><span data-f="owner" style="color:var(--t-2)">${o.owner ? esc(o.owner) : "Unclaimed"}</span>${(o.actions || []).map(a => K.Button({ ...a, touch: true })).join("")}</div>`;
K.IsrToast = o => `<div class="isrt isr ${o.urgency || "info"}" data-overlay data-dialect="tak" data-comp="IsrToast"><div><span>${esc(o.line1)}</span><span style="color:#bdbdbd">${esc(o.line2 || "")}</span></div></div>`;
K.TargetReadout = o => `<div class="readout" data-overlay data-comp="TargetReadout"><div>◺ <span data-telemetry ${attrs(bind(o.key, "range", " ft"))}>${esc(o.range)}</span></div><div class="mono" data-telemetry>⌖ ${esc(o.mgrs)}</div></div>`;
K.GridReadout = o => `<div class="mgrs" data-overlay data-dialect="tak" data-comp="GridReadout"><span data-telemetry>${esc(o.mgrs)}</span><br><span data-telemetry>${esc(o.decl || "13°M")}</span></div>`;
K.Minimap = o => { const BM = K.basemap(o.basemap, o.seed, false); return `<div class="pip" data-overlay data-comp="Minimap"><div data-imagery style="position:absolute;inset:0;background:${BM.bg}"><svg class="mapsvg" viewBox="0 0 100 100" preserveAspectRatio="none">${BM.svg}</svg></div>${o.markers || ""}<div class="pl"><span>Color</span><span class="on">Map</span></div></div>`; };
K.ReliefBar = o => `<div class="relief" data-overlay data-entity="${esc(o.reliever.id)}" data-type="Mission" data-comp="ReliefBar" data-st="relief active"><div class="th" data-imagery style="background:${K.videoBg(o.reliever.id + "t", o.reliever.sensor)}"></div><div class="nm">${esc(o.reliever.id)}<small>${esc(K.STATE_LABEL[o.reliever.state])}</small></div>${K.Ring(o.reliever.battery, 38, o.reliever.id)}<span><span class="k" style="font-size:10px;color:var(--t-2);font-weight:700">HAL</span> <span data-telemetry ${attrs(bind(o.reliever.id, "alt", "ft"))}>${Math.round(o.reliever.alt)}ft</span></span><div class="hand" data-state="relief"><i>»</i><span>${esc(o.label || "Relief In Progress")}</span></div></div>`;

/* ================= live bindings ================= */
K.updateBinds = (root, get) => {
  root.querySelectorAll("[data-bk]").forEach(el => { const v = get(el.dataset.bk, el.dataset.bf); if (v == null) return; const t = (typeof v === "number" ? Math.round(v) : v) + (el.dataset.bu || ""); if (el.textContent !== t) el.textContent = t; });
  root.querySelectorAll("[data-ring]").forEach(el => { const v = get(el.dataset.ring, "battery"); if (v == null) return; const c = 2 * Math.PI * 17; el.setAttribute("stroke-dasharray", `${(Math.max(0, v) / 100 * c).toFixed(1)} ${c.toFixed(1)}`); el.setAttribute("stroke", v < 25 ? "#df2a2f" : "#2a9a4a"); });
};
K.updatePositions = (root, get) => {
  root.querySelectorAll("[data-pk]").forEach(el => { const p = get(el.dataset.pk); if (!p) return; el.style.left = p.x.toFixed(2) + "%"; el.style.top = p.y.toFixed(2) + "%"; });
  root.querySelectorAll("[data-rot]").forEach(el => { const p = get(el.dataset.rot); if (p && p.h != null) el.style.transform = `rotate(${Math.round(p.h)}deg)`; });
};

/* ================= scenario: prompt → spec ================= */
const S = K.scenario = {};
S.PRESETS = [
  ["Gate alarm at night","Intrusion sensor tripped at the south gate of the motor pool at 0215. Launch the nearest dock and show me the response."],
  ["Border patrol, 3 drones","Border corridor overnight, three drones on patrol, one vehicle spotted near the restricted zone at Sector 310."],
  ["Handheld: track hostile","Soldier on the handheld controller tracking a hostile vehicle at the treeline, publish it to TAK."],
  ["Relief handoff","X10-A is low on battery while shadowing a person at the barracks. Hand off overwatch to X10-B on the handheld."],
  ["Plan tonight's patrols","Plan tonight's patrol schedule for the motor pool, barracks row and flightline, with a TFR active over the flightline."]
];
S.DOMAINS = {
  base:     { site:"Fort Calder", sectors:["Motor Pool","Barracks Row","Flightline","Ammo Point"], docks:["North Dock","South Dock","East Dock","West Dock"] },
  border:   { site:"Eagle Mtn Corridor", sectors:["Sector 292","Sector 310","Highway 9","Wash Crossing"], docks:["Hive-01","Hive-02","Hive-03","Hive-04"] },
  facility: { site:"Ridgeway Distribution Ctr", sectors:["Gate A","East Lot","Loading Dock","Perimeter Rd"], docks:["Roof Dock 1","Roof Dock 2","Lot Dock","Gate Dock"] }
};
S.PILOTS = ["SSG Dana Ruiz","CPL Ari Brennan","SPC Theo Lund","SGT Mara Quinn"];
S.localResolve = (prompt, surfacePref = "auto") => {
  const p = prompt.toLowerCase(); const has = (...w) => w.some(x => p.includes(x));
  const surface = surfacePref !== "auto" ? surfacePref : has("controller","handheld","soldier","in the field","on foot","dismount","squad") ? "controller" : "desktop";
  const task = has("relief","hand off","handoff","low on battery","battery low","low battery","swap") ? "relief"
    : has("track","follow","shadow","hostile","pursue","target") ? "track"
    : has("alarm","alert","sensor","breach","motion","intrusion","tripped","fired","fence","radar") ? "respond"
    : has("schedule","plan ","plan tonight","work order","tomorrow") ? "plan" : "monitor";
  const night = has("night","thermal","dark","overnight","midnight","tonight") || /\b0[0-4]\d\d\b/.test(p);
  const tak = has("tak","atak","isr","hostile","cot");
  const domKey = has("border","corridor","cbp","crossing") ? "border" : has("warehouse","distribution","facility","campus","plant","hq") ? "facility" : "base";
  const D = S.DOMAINS[domKey];
  const nm = p.match(/\b(one|two|three|four|[1-4])\s+(drones?|aircraft|docks?|x10s?)/);
  const n = nm ? ({ one:1, two:2, three:3, four:4 }[nm[1]] || +nm[1]) : null;
  const sectorHit = D.sectors.find(s => p.includes(s.toLowerCase())) || D.sectors[0];
  const restricted = has("tfr","restricted","no-fly","geofence") || domKey === "border";
  const sensor = night ? "thermal" : "color";
  const cls = has("vehicle","truck","car","suv","pickup") ? "vehicle" : has("animal","deer","coyote") ? "animal" : "person";
  const basemap = has("topo","terrain","contour","elevation","ridge","mountain","hill") ? "topo" : has("street","city","urban","downtown","campus","town") ? "street" : has("dark map","vector","low light map") ? "dark" : "satellite";
  const air = (i, state, extra = {}) => ({ id:"X10-" + "ABCD"[i], dock:D.docks[i], pilot:S.PILOTS[i], state, battery:[82,64,91,47][i], alt_ft:[180,150,210,120][i], speed_mph:[12,8,16,4][i], heading:[45,310,120,200][i], sensor, ...extra });
  const s = { title:"", surface, task, basemap, site:{ name:D.site, sectors:D.sectors.slice(0, 3) }, focus:"X10-A", aircraft:[], missions:[], incidents:[], detections:[], subjects:[], markers:[], airspace:[], toast:null };
  if (restricted) s.airspace.push({ name: domKey === "border" ? "Restricted zone · " + D.sectors[1] : "TFR · " + D.sectors[2], state:"active" });
  const patrol = (a, i, start = "22:00") => ({ id:"M-P" + i, name:D.sectors[(i + 1) % 4] + " patrol", type:"patrol", state:"active", attention:false, aircraft:a.id, sector:D.sectors[(i + 1) % 4], next:D.sectors[(i + 2) % 4], start, cadence:"Every 30 mins", workOrder:null });
  if (task === "respond") {
    const k = n || 2;
    s.title = "Respond · " + sectorHit;
    s.aircraft = [air(0, "ready", { battery:100, speed_mph:0, alt_ft:0 }), ...[1,2,3].slice(0, k - 1).map(i => air(i, "flying"))];
    s.incidents = [{ id:"INC-4471", title:(has("motion") ? "Motion detected" : "Intrusion alarm") + " · " + sectorHit, state:"new", source:"IDS", sensor:(has("gate") ? "South gate" : sectorHit) + " sensor", age_s:30, area:sectorHit, claimedBy:null }];
    s.missions = s.aircraft.slice(1).map((a, i) => patrol(a, i));
    s.detections = s.aircraft.slice(1).map((a, i) => ({ aircraft:a.id, class:i ? "vehicle" : "person", count:1 + i }));
  } else if (task === "track") {
    const k = n || 2;
    s.title = "Track · " + (tak ? "hostile " : "") + cls;
    s.aircraft = [air(0, "flying"), ...[1,2,3].slice(0, k - 1).map(i => air(i, i === k - 1 && k > 1 ? "ready" : "flying", i === k - 1 ? { battery:100, alt_ft:0, speed_mph:0 } : {}))];
    s.subjects = [{ id:"SUB-1", aircraft:"X10-A", class:cls, affiliation:tak ? "hostile" : "unknown", mode:has("follow") ? "follow" : "track" }];
    s.markers = [...(tak ? [{ label:"Subject · " + cls, affiliation:"hostile" }] : []), { label:"Blue 2-1", affiliation:"friend" }];
    s.detections = [{ aircraft:"X10-A", class:cls, count:1 }];
    s.missions = [{ id:"M-O1", name:"Overwatch · " + sectorHit, type:"overwatch", state:"active", attention:false, aircraft:"X10-A", sector:sectorHit, next:"Hold on subject", start:"—", cadence:null, workOrder:null },
      ...s.aircraft.slice(1).filter(a => a.state === "flying").map((a, i) => patrol(a, i, "21:00"))];
  } else if (task === "relief") {
    s.title = "Relief · overwatch handoff";
    s.aircraft = [air(0, "flying", { battery:24 }), air(1, "ready", { battery:100, alt_ft:0, speed_mph:0 })];
    s.subjects = [{ id:"SUB-1", aircraft:"X10-A", class:cls, affiliation:tak ? "hostile" : "unknown", mode:"follow" }];
    s.markers = tak ? [{ label:"Subject", affiliation:"hostile" }] : [];
    s.missions = [{ id:"M-O1", name:"Overwatch · " + sectorHit, type:"overwatch", state:"active", attention:true, aircraft:"X10-A", sector:sectorHit, next:"Relief needed", start:"—", cadence:null, workOrder:null }];
    s.detections = [{ aircraft:"X10-A", class:cls, count:1 }];
  } else if (task === "plan") {
    const k = n || 3;
    s.title = "Plan · tonight's patrols";
    s.aircraft = [0,1,2,3].slice(0, k).map(i => air(i, "ready", { battery:100, alt_ft:0, speed_mph:0 }));
    s.missions = s.site.sectors.concat(D.sectors[3]).map((sec, i) => ({ id:"M-S" + i, name:["Visibility perimeter patrol","Vehicle lot patrol","Barracks sweep","Flightline check"][i % 4], type:"patrol", state:i === 0 ? "upcoming" : "scheduled", attention:false, aircraft:s.aircraft[i % s.aircraft.length].id, sector:sec, next:sec, start:["21:30","23:00","01:30","03:30"][i], cadence:i === 3 ? "Every 2 hrs" : null, workOrder:"WO " + ["02A-65D","04B-11A","03B-75C","05C-20F"][i] }));
  } else {
    const k = n || 3;
    s.title = "Monitor · " + D.site;
    s.aircraft = [0,1,2,3].slice(0, k).map(i => air(i, "flying"));
    s.missions = s.aircraft.map((a, i) => ({ ...patrol(a, i - 1, "20:00"), id:"M-P" + i, name:D.sectors[i % 4] + " patrol", sector:D.sectors[i % 4], next:D.sectors[(i + 1) % 4] }));
    s.detections = s.aircraft.map((a, i) => ({ aircraft:a.id, class:["person","vehicle","animal"][i % 3], count:[1,2,1][i % 3] }));
    if (has("vehicle")) { const t = s.aircraft[Math.min(1, k - 1)]; s.subjects = [{ id:"SUB-1", aircraft:t.id, class:"vehicle", affiliation:"unknown", mode:"track" }]; s.focus = t.id; }
  }
  return s;
};
S.claudePrompt = (prompt, surfacePref = "auto") => `You turn a request for a drone operations screen into a scene spec for a UI generator modeled on Skydio's defense and security software.
Reply with ONLY one JSON object of this shape (no prose):
{"title": string <=40 chars,
 "surface": "desktop"|"controller",
 "task": "monitor"|"respond"|"track"|"plan"|"relief",
 "basemap": "satellite"|"topo"|"dark"|"street",
 "site": {"name": string, "sectors": [2-4 short strings]},
 "focus": aircraft id,
 "aircraft": [1-4 of {"id":"X10-A"..,"dock":string,"pilot":string,"state":"ready"|"launching"|"flying"|"holding"|"returning"|"relieved","battery":0-100,"alt_ft":number,"speed_mph":number,"heading":0-359,"sensor":"color"|"thermal"}],
 "missions": [{"id","name","type":"patrol"|"response"|"overwatch"|"relief","state":"scheduled"|"upcoming"|"active"|"paused"|"done","attention":boolean,"aircraft":id|null,"sector":string,"next":string,"start":"HH:MM","cadence":string|null,"workOrder":string|null}],
 "incidents": [{"id","title","state":"new"|"claimed"|"responding"|"resolved","source":"IDS"|"VMS"|"Radar"|"CAD"|"Counter-UAS","sensor":string,"age_s":number,"area":sector,"claimedBy":string|null}],
 "detections": [{"aircraft":id,"class":"person"|"vehicle"|"animal","count":int}],
 "subjects": [{"id","aircraft":id,"class":"person"|"vehicle"|"animal","affiliation":"hostile"|"friend"|"unknown"|"neutral","mode":"track"|"follow"}],
 "markers": [{"label":string,"affiliation":"hostile"|"friend"|"unknown"|"neutral"}],
 "airspace": [{"name":string,"state":"active"|"inactive"}],
 "toast": {"line1":string,"line2":string,"urgency":"info"|"action"} | null}
Rules: controller = an operator on the handheld in the field; desktop = operations center. This spec seeds a LIVE simulation, so: leave new incidents "new" and unclaimed with a "ready" aircraft on a dock available to dispatch; aircraft on patrol are "flying" with an "active" patrol mission; low battery or handoff means a subject followed by a low-battery aircraft plus a "ready" aircraft for relief; anything shared to TAK or labeled hostile gets a subject and a marker. Use thermal at night. basemap: satellite by default, topo for terrain, street for towns or campuses, dark for a low-glare vector map. Invent short fictional site names and fictional people with military ranks (never real people). Keep ids consistent. At most 4 aircraft, 5 missions, 2 incidents.${surfacePref !== "auto" ? `\nThe surface must be "${surfacePref}".` : ""}
Request: """${String(prompt).slice(0, 1500)}"""`;
S.normalize = raw => {
  const O = K.ONTO, notes = [], s = raw && typeof raw === "object" ? raw : {}, out = {};
  out.surface = pick(O.surface, s.surface, "desktop"); out.task = pick(O.task, s.task, "monitor");
  out.title = String(s.title || "Operations").slice(0, 48); out.basemap = pick(K.BASEMAPS, s.basemap, "satellite");
  const site = s.site || {}; out.site = { name:String(site.name || "Unnamed site").slice(0, 40), sectors:(Array.isArray(site.sectors) && site.sectors.length ? site.sectors : ["Sector A","Sector B"]).slice(0, 4).map(x => String(x).slice(0, 24)) };
  let ac = Array.isArray(s.aircraft) ? s.aircraft.slice(0, 4) : [];
  if (!ac.length) { ac = [{ id:"X10-A", state:"flying" }]; notes.push("No aircraft in the spec: added X10-A."); }
  const seen = new Set();
  out.aircraft = ac.map((a, i) => { let id = String(a.id || "X10-" + "ABCD"[i]).slice(0, 14); if (seen.has(id)) id += "-" + i; seen.add(id);
    const st = pick(O.air, a.state, "flying"); if (a.state && st !== a.state) notes.push(`${id}: state "${a.state}" isn't an Aircraft state; used "${st}".`);
    return { id, dock:String(a.dock || "Dock " + (i + 1)).slice(0, 22), pilot:String(a.pilot || S.PILOTS[i]).slice(0, 24), state:st, battery:clamp(a.battery, 0, 100, 80), alt_ft:clamp(a.alt_ft, 0, 400, st === "ready" ? 0 : 150), speed_mph:clamp(a.speed_mph, 0, 45, 10), heading:clamp(a.heading, 0, 359, 0), sensor:pick(["color","thermal"], a.sensor, "color") }; });
  const ids = new Set(out.aircraft.map(a => a.id)); const ref = v => ids.has(v) ? v : null;
  out.focus = ids.has(s.focus) ? s.focus : (out.aircraft.find(a => O.airborne.includes(a.state)) || out.aircraft[0]).id;
  out.missions = (Array.isArray(s.missions) ? s.missions : []).slice(0, 6).map((m, i) => { const o = { id:String(m.id || "M-" + i), name:String(m.name || "Mission " + (i + 1)).slice(0, 40), type:pick(O.mtype, m.type, "patrol"), state:pick(O.mission, m.state, "scheduled"), attention:!!m.attention, aircraft:ref(m.aircraft), sector:String(m.sector || out.site.sectors[0]).slice(0, 24), next:String(m.next || "").slice(0, 28), start:String(m.start || "").slice(0, 8), cadence:m.cadence ? String(m.cadence).slice(0, 20) : null, workOrder:m.workOrder ? String(m.workOrder).slice(0, 14) : null };
    if (o.state === "active" && !o.aircraft) { notes.push(`${o.id}: an active mission needs an aircraft; moved it to "scheduled".`); o.state = "scheduled"; } return o; });
  out.incidents = (Array.isArray(s.incidents) ? s.incidents : []).slice(0, 3).map((x, i) => { const o = { id:String(x.id || "INC-" + (100 + i)), title:String(x.title || "Sensor alert").slice(0, 48), state:pick(O.incident, x.state, "new"), source:String(x.source || "IDS").slice(0, 14), sensor:String(x.sensor || "Unknown sensor").slice(0, 36), age_s:clamp(x.age_s, 0, 86400, 30), area:String(x.area || out.site.sectors[0]).slice(0, 24), claimedBy:x.claimedBy ? String(x.claimedBy).slice(0, 30) : null };
    if (o.state === "resolved" && !o.claimedBy) { notes.push(`${o.id}: can't be resolved without an owner (P10); set to "new".`); o.state = "new"; }
    if ((o.state === "claimed" || o.state === "responding") && !o.claimedBy) { o.claimedBy = out.aircraft[0].pilot; notes.push(`${o.id}: "${o.state}" needs an owner; assigned ${o.claimedBy}.`); } return o; });
  out.detections = (Array.isArray(s.detections) ? s.detections : []).filter(d => ref(d.aircraft)).slice(0, 8).map(d => ({ aircraft:d.aircraft, class:pick(O.cls, d.class, "person"), count:clamp(d.count, 1, 99, 1) | 0 }));
  out.subjects = (Array.isArray(s.subjects) ? s.subjects : []).filter(d => ref(d.aircraft)).slice(0, 2).map((d, i) => ({ id:String(d.id || "SUB-" + (i + 1)), aircraft:d.aircraft, class:pick(O.cls, d.class, "vehicle"), affiliation:pick(O.aff, d.affiliation, "unknown"), mode:pick(["track","follow"], d.mode, "track") }));
  out.markers = (Array.isArray(s.markers) ? s.markers : []).slice(0, 5).map(m => ({ label:String(m.label || "Marker").slice(0, 24), affiliation:pick(O.aff, m.affiliation, "unknown") }));
  out.airspace = (Array.isArray(s.airspace) ? s.airspace : []).slice(0, 2).map(a => ({ name:String(a.name || "TFR").slice(0, 36), state:pick(["active","inactive"], a.state, "active") }));
  out.toast = s.toast && s.toast.line1 ? { line1:String(s.toast.line1).slice(0, 44), line2:String(s.toast.line2 || "").slice(0, 60), urgency:pick(["info","action"], s.toast.urgency, "info") } : null;
  return { spec:out, notes };
};

/* ================= linter ================= */
const PALETTE = ["#1a6cf0","#0d3f8f","#1d4fa8","#df2a2f","#5c1416","#5a1b1d","#2a9a4a","#173d22","#1fe3a2","#3df07a","#f5b400","#6b5208","#9a5cf0","#ff8080","#80e0ff","#ffff80","#aaffaa","#9cc0ff","#cfe0ff","#ffe39a","#ffc9cb"].map(hex => [1,3,5].map(i => parseInt(hex.slice(i, i + 2), 16)));
const parseRGB = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; };
const satLum = ({ r, g, b }) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; const s = mx === mn ? 0 : l > .5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn); return { s, l }; };
const nearPalette = c => PALETTE.some(p => Math.hypot(p[0] - c.r, p[1] - c.g, p[2] - c.b) < 58);
/** Check a rendered screen against the 12 principles.
 *  ctx = { surface:"desktop"|"controller", focus:aircraftId, aircraft:[{id,state}], scale } */
K.lint = (frame, ctx) => {
  const R = [], all = q => [...frame.querySelectorAll(q)], res = (id, verdict, detail, offenders = []) => R.push({ id, verdict, detail, offenders });
  const Sc = ctx.scale || 1;
  const rel = el => { const fr = frame.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x:(r.left - fr.left) / Sc, y:(r.top - fr.top) / Sc, w:r.width / Sc, h:r.height / Sc }; };
  const inImagery = el => !!el.closest("[data-imagery]");
  { const bad = new Set(); let n = 0;
    for (const el of frame.querySelectorAll("*")) {
      if (inImagery(el) || el.closest("defs")) continue;
      const cs = getComputedStyle(el); const vals = [cs.color, cs.backgroundColor];
      if (parseFloat(cs.borderTopWidth) > 0) vals.push(cs.borderTopColor);
      if (el instanceof SVGElement) vals.push(cs.fill, cs.stroke);
      const bi = cs.backgroundImage; if (bi && bi !== "none") (bi.match(/rgba?\([^)]+\)/g) || []).forEach(v => vals.push(v));
      for (const v of vals) { const c = parseRGB(v); if (!c || c.a < .3) continue; const { s, l } = satLum(c); if (s < .42 || l < .2 || l > .9) continue; n++; if (!nearPalette(c)) bad.add(el); }
    }
    res("P01", bad.size ? "fail" : "pass", bad.size ? `${bad.size} element(s) use a saturated color outside the signal tokens.` : `${n} saturated color uses, all from signal or affiliation tokens.`, [...bad]); }
  { const airborne = ctx.aircraft.filter(a => K.ONTO.airborne.includes(a.state)).map(a => a.id); const miss = []; let checked = 0;
    all("[data-aircraft-container]").forEach(c => { const id = c.getAttribute("data-aircraft-container"); if (!airborne.includes(id)) return; checked++;
      const stop = [...c.querySelectorAll("[data-stop]")].find(s => { const col = parseRGB(getComputedStyle(s).backgroundColor); return col && Math.hypot(col.r - 223, col.g - 42, col.b - 47) < 40; }); if (!stop) miss.push(c); });
    res("P02", miss.length ? "fail" : checked ? "pass" : "na", miss.length ? `${miss.length} airborne aircraft view(s) have no filled-red stop or return control.` : checked ? `${checked} airborne aircraft view(s), each with a red stop or return control.` : "No airborne aircraft on screen.", miss); }
  { const els = all(`[data-entity="${CSS.escape(ctx.focus || "")}"]`).filter(e => !e.closest("[data-imagery]") && !e.matches(".c-frame"));
    const off = els.filter(e => !e.classList.contains("is-focus"));
    if (ctx.surface === "controller" && els.length === 1 && !off.length) res("P03", "pass", `${ctx.focus} fills the main video and is amber on the minimap.`);
    else res("P03", els.length < 1 ? "na" : off.length ? "fail" : els.length > 1 ? "pass" : "warn", off.length ? `${off.length} of ${els.length} renderings of ${ctx.focus} lack the focus treatment.` : els.length > 1 ? `${ctx.focus} is focused consistently in ${els.length} places.` : `${ctx.focus} appears in only one place.`, off); }
  if (ctx.surface === "desktop") {
    const order = ["nav","list","map","feeds"].map(p => { const el = frame.querySelector(`[data-pane="${p}"]`); return el ? rel(el).x : NaN; });
    const ok = order.every((x, i) => i === 0 || x > order[i - 1]); const fleet = frame.querySelector("[data-fleet]"); const inMap = fleet && fleet.closest('[data-pane="map"]');
    const multiInTile = all("[data-aircraft-container] [data-fleetstop]");
    res("P04", ok && inMap && !multiInTile.length ? "pass" : "fail", ok ? (inMap ? "Panes run nav → list → map → feeds; fleet commands sit under the map." : "Fleet commands are not attached to the map.") : "Pane order breaks the triage → locate → act sequence.", multiInTile);
  } else {
    const W = frame.offsetWidth, H = frame.offsetHeight; const center = all("[data-touch]").filter(e => { const r = rel(e); const cx = r.x + r.w / 2, cy = r.y + r.h / 2; return cx > W * .32 && cx < W * .68 && cy > H * .3 && cy < H * .7 && !e.closest(".fly,.ctoast,.c-toasts"); });
    res("P04", center.length ? "fail" : "pass", center.length ? `${center.length} control(s) sit in the video center.` : "Controls sit on the screen edges; the video center is clear.", center);
  }
  { const cards = all("[data-card]"); const bad = cards.filter(c => { const st = c.querySelector("[data-state]"); if (!st) return true; return rel(st).y - rel(c).y > 40; });
    res("P05", !cards.length ? "na" : bad.length ? "fail" : "pass", !cards.length ? "No entity cards on this surface." : bad.length ? `${bad.length} card(s) don't lead with a state.` : `${cards.length} cards, each with its state in row 1.`, bad); }
  { const t = all("[data-telemetry]"); const unit = /(\d\s*(ft|mph|%|°|mhz|sec|min|hr|m)\b|%|°)|^\s*⌖?\s*\d{1,2}[A-Z]\s+[A-Z]{2}\s+\d+\s+\d+|^\d{1,2}:\d{2}$/i;
    const bad = t.filter(e => !unit.test(e.textContent.trim())); const mono = t.filter(e => !/mono/i.test(getComputedStyle(e).fontFamily) && e.closest(".hud,.strip,.readout,.mgrs"));
    res("P06", bad.length ? "fail" : mono.length ? "warn" : "pass", bad.length ? `${bad.length} measurement(s) shown without a unit: ${bad.slice(0, 2).map(e => `"${e.textContent.trim()}"`).join(", ")}.` : mono.length ? `${mono.length} telemetry value(s) on video are not set in mono.` : `${t.length} measurements, all with units.`, bad.concat(mono)); }
  { const cot = all("[data-cot]"); const AFF = { hostile:[255,128,128], friend:[128,224,255], unknown:[255,255,128], neutral:[170,255,170] };
    const bad = cot.filter(e => { const c = parseRGB(getComputedStyle(e).backgroundColor); const a = AFF[e.getAttribute("data-cot")]; return !c || !a || Math.hypot(c.r - a[0], c.g - a[1], c.b - a[2]) > 30; });
    const takTxt = all("[data-dialect='tak']").filter(e => !/mono/i.test(getComputedStyle(e).fontFamily));
    const any = cot.length || all("[data-dialect]").length;
    res("P07", !any ? "na" : bad.length || takTxt.length ? "fail" : "pass", !any ? "Nothing on screen is shared to TAK." : bad.length ? `${bad.length} affiliation marker(s) don't use the standard 2525 fill.` : takTxt.length ? "TAK text isn't in the mono TAK voice." : `${cot.length} TAK symbol(s) in standard 2525 colors; TAK text in mono caps.`, bad.concat(takTxt)); }
  if (ctx.surface === "controller") { const small = all("[data-touch]").filter(e => e.offsetWidth < 44 || e.offsetHeight < 44);
    res("P08", small.length ? "fail" : "pass", small.length ? `${small.length} touch target(s) under 44px.` : `${all("[data-touch]").length} touch targets, all at least 44px.`, small);
  } else res("P08", "na", "Desktop surface: glove-size targets don't apply. Vocabulary (HAL, MGRS, FUS) is shared with the controller.");
  { const ov = all("[data-overlay]").filter(e => !e.querySelector("[data-overlay]") || e.matches(".mk,.wp,.dia,.dock,.cot"));
    const bad = ov.filter(e => { const cs = getComputedStyle(e); if (parseFloat(cs.borderTopWidth) >= 2) return false; const bg = parseRGB(cs.backgroundColor); if (bg && bg.a >= .55) return false;
      if (e.matches(".mk")) { const d = e.querySelector(".dm"); return !(d && parseFloat(getComputedStyle(d).borderTopWidth) >= 2); }
      if (e.matches(".ret")) return false; return !e.matches(".bbox,.pip"); });
    res("P09", bad.length ? "fail" : "pass", bad.length ? `${bad.length} overlay(s) rely on fill alone over imagery.` : `${ov.length} overlays carry a 2px stroke or a 55%+ scrim.`, bad); }
  { const inc = all("[data-incident]"); const bad = inc.filter(e => ["source","age","owner","close"].some(f => !e.querySelector(`[data-f="${f}"]`)));
    const unclaimed = inc.filter(e => /Unclaimed/.test(e.querySelector('[data-f="owner"]')?.textContent || ""));
    res("P10", !inc.length ? "na" : bad.length ? "fail" : unclaimed.length ? "warn" : "pass", !inc.length ? "No open incidents on screen." : bad.length ? `${bad.length} incident(s) missing source, age, owner or close.` : unclaimed.length ? `${unclaimed.length} incident(s) unclaimed. Someone needs to take it.` : "Every incident shows source, age, owner and a close action.", bad.concat(unclaimed)); }
  { const cards = all("[data-card]"); const bad = cards.filter(c => c.querySelectorAll(":scope > [data-row]").length !== 3);
    res("P11", !cards.length ? "na" : bad.length ? "warn" : "pass", !cards.length ? "No cards on this surface." : bad.length ? `${bad.length} card(s) break the three-row grammar.` : `${cards.length} cards follow identity / where / who.`, bad); }
  { const ctrls = all("[data-control], .badge").filter(e => !e.matches(".rec,.tog,.z"));
    const round = ctrls.filter(e => parseFloat(getComputedStyle(e).borderTopLeftRadius) > 4.5);
    const shadow = all("[data-card]").filter(e => getComputedStyle(e).boxShadow !== "none" && !e.classList.contains("lint-hit"));
    res("P12", round.length || shadow.length ? "fail" : "pass", round.length ? `${round.length} control(s) or badge(s) rounder than 4px.` : shadow.length ? `${shadow.length} card(s) use shadows.` : `${ctrls.length} controls and badges at 4px radius or less; no card shadows.`, round.concat(shadow)); }
  return R;
};

global.SkydioUI = K;
})(window);
