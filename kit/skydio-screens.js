/*! Skydio UI Kit 0.1.0 · skydio-screens.js
   Full screens composed from kit components: a scene spec (from SkydioUI.scenario) in, a desktop or handheld screen out.
   Used by the screen generator and the product builder. Not affiliated with Skydio. */
(function (G) {
"use strict";
const K = G.SkydioUI; const { esc, rng, hashStr, fmtAge } = K;
const air = a => K.ONTO.airborne.includes(a.state);
const A = a => ({ id:a.id, dock:a.dock, pilot:a.pilot, state:a.state, battery:a.battery, alt:a.alt_ft, speed:a.speed_mph, heading:a.heading, sensor:a.sensor });

/* ---------- still-screen geometry ---------- */
function geo(spec){
  const R = rng(hashStr(spec.site.name + spec.task));
  const sectors = spec.site.sectors.map((name, i) => { const cx = 22 + (i % 2) * 46 + R() * 8, cy = 24 + Math.floor(i / 2) * 44 + R() * 8; return { name, cx, cy, pts:Array.from({ length:6 }, (_, k) => { const a = k / 6 * Math.PI * 2 + R() * .4, r = 13 + R() * 8; return [cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r]; }) }; });
  const secOf = n => sectors.find(x => x.name === n) || sectors[0];
  const pos = {};
  spec.aircraft.forEach((a, i) => { const m = spec.missions.find(m => m.aircraft === a.id && m.state === "active"); const sec = m ? secOf(m.sector) : sectors[i % sectors.length];
    pos[a.id] = a.state === "ready" ? { x:5, y:16 + i * 15 } : { x:sec.cx + (R() - .5) * 14, y:sec.cy + (R() - .5) * 12 }; });
  return { sectors, secOf, pos, R };
}

/* ---------- desktop ---------- */
function renderDesktop(spec, inject){
  const G = geo(spec), night = spec.aircraft.some(a => a.sensor === "thermal"), light = K.isLightMap(spec.basemap);
  const tfr = spec.airspace.some(a => a.state === "active");
  const byAc = id => spec.aircraft.find(x => x.id === id);
  const dets = id => spec.detections.filter(d => d.aircraft === id).map(d => ({ cls:d.class, count:d.count }));
  const open = spec.incidents.filter(i => i.state !== "resolved");
  const incCards = spec.incidents.map(i => K.IncidentCard({ id:i.id, title:i.title, state:i.state, source:i.source, sensor:i.sensor, age:fmtAge(i.age_s), owner:i.claimedBy,
    actions: i.claimedBy ? (i.state === "responding" ? [{ label:"End response", icon:"check", f:"close" }] : [{ label:"Dispatch", variant:"blue" }, { label:"End", f:"close" }]) : [{ label:"Claim" }, { label:"Dispatch", variant:"blue" }, { label:"End", f:"close", disabled:true }] })).join("");
  const launching = spec.aircraft.filter(a => a.state === "launching").map(a => K.LaunchCard({ aircraft:A(a), focus:a.id === spec.focus })).join("");
  const attn = spec.missions.filter(m => m.attention && m.state !== "done");
  const act = spec.missions.filter(m => !m.attention && (m.state === "active" || m.state === "paused"));
  const later = spec.missions.filter(m => !m.attention && (m.state === "scheduled" || m.state === "upcoming"));
  const reason = m => m.attention ? (tfr ? "TFR conflict" : "Needs attention") : "";
  const card = (m, pill) => { const a = byAc(m.aircraft); return K.PatrolCard({ mission:{ ...m, reason:reason(m) }, aircraft:a ? A(a) : null, dets:a ? dets(a.id) : [], focus:a && a.id === spec.focus, pill }); };
  const item = m => { const a = byAc(m.aircraft); return K.MissionItem({ mission:{ ...m, reason:reason(m) }, aircraftLabel:a ? `${a.id} · ${a.dock}` : "Unassigned", routeSeed:m.id + spec.site.name }); };
  const ready = spec.aircraft.filter(a => a.state === "ready");
  let list;
  if (spec.task === "plan") list = K.Section("Requires attention", attn.length, attn.map(item).join("")) + K.Section("Mission schedule", later.length, later.map(item).join("")) + K.Section("Fleet", spec.aircraft.length, spec.aircraft.slice(0, 2).map(a => K.AssetItem({ aircraft:A(a), focus:a.id === spec.focus })).join(""));
  else list = K.Section("Incidents", open.length, incCards) + K.Section("Launching", "", launching)
    + K.Section("Requires attention", attn.length, attn.map((m, i) => card(m, inject && i === 0)).join(""))
    + K.Section("Active", act.length, act.map((m, i) => card(m, inject && !attn.length && i === 0)).join(""))
    + K.Section("Scheduled", later.length, later.map(item).join(""))
    + K.Section("Ready on dock", ready.length, ready.map(a => K.AssetItem({ aircraft:A(a), focus:a.id === spec.focus })).join(""));
  // map
  let svg = G.sectors.map(s => K.svgSector(s.pts, light)).join("") + spec.airspace.filter(a => a.state === "active").map((a, i) => K.svgAirspace(G.sectors[Math.min(1, G.sectors.length - 1)].pts.map(p => [p[0] + 6, p[1] + 3]), "AS-" + i)).join("");
  let ov = G.sectors.map(s => K.SectorLabel({ name:s.name, x:s.cx, y:s.cy + 15 })).join("");
  spec.missions.filter(m => m.aircraft && (m.state === "active" || m.state === "upcoming") && m.type !== "relief").forEach((m, mi) => {
    const pts = G.secOf(m.sector).pts; const k = 2 + (mi % 3); svg += K.svgRoute(pts, k, light);
    pts.forEach((q, i) => { ov += K.Waypoint({ n:i + 1, x:q[0], y:q[1], done:i <= k, entity:`${m.id}-wp${i + 1}` }); }); });
  const relief = spec.missions.find(m => m.type === "relief" && m.aircraft), ow = spec.missions.find(m => m.type === "overwatch");
  if (relief && ow && G.pos[relief.aircraft] && G.pos[ow.aircraft]) svg += K.svgTether(G.pos[relief.aircraft], G.pos[ow.aircraft]);
  svg += spec.aircraft.filter(a => a.state !== "ready").map(a => K.svgCone(G.pos[a.id].x, G.pos[a.id].y, a.heading, a.id === spec.focus)).join("");
  ov += [...new Set(spec.aircraft.map(a => a.dock))].map((d, i) => K.DockMarker({ id:d, x:5, y:16 + i * 15, state:spec.aircraft.some(a => a.dock === d && a.state === "ready") ? "ready" : "empty" })).join("");
  ov += open.map(x => { const s = G.secOf(x.area); return K.EventMarker({ id:x.id, kind:"alert", x:s.cx + 9, y:s.cy - 10, state:x.state }); }).join("");
  ov += spec.detections.slice(0, 4).map((d, i) => { const p = G.pos[d.aircraft]; return p ? K.EventMarker({ id:"DET-" + i, kind:d.class, x:p.x + 5 + i, y:p.y - 7 }) : ""; }).join("");
  const base = spec.subjects[0] ? G.pos[spec.subjects[0].aircraft] : { x:G.sectors[0].cx, y:G.sectors[0].cy };
  ov += spec.markers.map((m, i) => K.CoTMarker({ id:"CoT-" + i, aff:m.affiliation, label:m.label, x:base.x + (i ? -12 : 8), y:base.y + (i ? 10 : -12) })).join("");
  ov += spec.aircraft.filter(a => a.state !== "ready").map(a => K.DroneMarker({ id:a.id, x:G.pos[a.id].x, y:G.pos[a.id].y, heading:a.heading, state:a.state, alt:a.alt_ft, battery:a.battery, focus:a.id === spec.focus })).join("");
  // feeds
  const feedAir = [...spec.aircraft].sort((a, b) => (b.id === spec.focus) - (a.id === spec.focus) || air(b) - air(a)).slice(0, 2);
  const feeds = feedAir.map((a, i) => { const det = spec.detections.find(d => d.aircraft === a.id), sub = spec.subjects.find(x => x.aircraft === a.id);
    return K.FeedTile({ aircraft:A(a), focus:a.id === spec.focus, noStop:inject && i === 1, det:det ? { id:"DET-" + a.id, cls:det.class, x:sub ? 32 : 58, y:58 } : null, sub:sub ? { id:sub.id, cls:sub.class, x:62, y:55, aff:spec.markers.some(m => m.affiliation === sub.affiliation) ? sub.affiliation : null } : null }); }).join("");
  const module = { monitor:"Flight Deck", respond:"Incident Response", track:"Flight Deck", plan:"Patrol Planning", relief:"Flight Deck" }[spec.task];
  return K.TopBar({ site:spec.site.name, module, clock:night ? "02:16:41 AM" : "02:38:15 PM" })
    + `<div class="d-body">${K.NavRail({ badge:open.filter(i => !i.claimedBy).length })}${K.ListPane({ body:list, banner:inject ? '<div class="vio-banner" data-inject></div>' : "" })}`
    + K.MapPane({ basemap:spec.basemap, seed:spec.site.name, night, svg, overlays:ov, fleet:{} })
    + `<section class="d-feeds" data-pane="feeds">${feeds}</section></div>`;
}

/* ---------- controller ---------- */
function renderController(spec, inject){
  const a = spec.aircraft.find(x => x.id === spec.focus) || spec.aircraft[0];
  const sub = spec.subjects.find(x => x.aircraft === a.id) || spec.subjects[0];
  const relief = spec.missions.find(m => m.type === "relief"), reliever = relief && spec.aircraft.find(x => x.id === relief.aircraft);
  const inc = spec.incidents.find(x => x.state !== "resolved");
  const published = sub && spec.markers.some(m => m.affiliation === sub.affiliation);
  const tak = spec.markers.length || (sub && sub.affiliation === "hostile");
  const mgrs = K.mgrs(a.id, spec.site.name);
  const isAir = air(a);
  const pip = spec.aircraft.map((x, i) => K.DroneMarker({ id:x.id, x:30 + i * 22, y:40 + i * 12, heading:x.heading, state:x.state, focus:x.id === spec.focus, small:true, comp:"DroneMarker.pip" })).join("")
    + spec.markers.map((m, i) => K.CoTMarker({ id:"CoT-" + i, aff:m.affiliation, label:m.label, x:62 - i * 34, y:24 + i * 30 })).join("");
  return `<div class="c-frame" data-aircraft-container="${esc(a.id)}" data-entity="${esc(a.id)}" data-type="Aircraft" data-comp="Controller.video" data-st="${a.state}">
    <div data-imagery style="position:absolute;inset:0;background:${K.videoBg(a.id + "c", a.sensor)}"></div>
    ${sub ? K.BoundingBox({ id:sub.id, cls:sub.class, x:62, y:50, w:190, h:110, aff:published ? sub.affiliation : null }) : ""}
    ${spec.detections.filter(d => d.aircraft === a.id && (!sub || d.class !== sub.class)).map((d, i) => K.Reticle({ id:"DET-" + i, cls:d.class, x:34 + i * 10, y:60 })).join("")}
    ${K.FlightStrip(A(a), mgrs)}
    ${K.ToolRail(sub ? "scan" : "send")}
    ${K.CaptureRail({ stop:isAir && !inject ? {} : null })}
    ${inject ? `<span class="t" data-touch data-control style="position:absolute;left:46%;top:44%;width:30px;height:30px;background:#ff2bd6;border-radius:15px" data-inject></span>` : ""}
    ${sub ? K.ShadowFlyout({ subject:{ id:sub.id, mode:sub.mode, aff:sub.affiliation, published } }) : ""}
    ${inc ? K.IncidentToast({ id:inc.id, title:inc.title, state:inc.state, source:inc.source, age:fmtAge(inc.age_s), owner:inc.claimedBy, actions:inc.claimedBy ? [{ label:"End", f:"close" }] : [{ label:"Claim" }, { label:"End", f:"close", disabled:true }] }) : ""}
    ${spec.toast ? `<div class="c-toasts">${K.IsrToast(spec.toast)}</div>` : ""}
    ${sub ? K.TargetReadout({ range:inject ? "481" : "481 ft", mgrs }) : ""}
    ${K.Minimap({ basemap:spec.basemap, seed:spec.site.name, markers:pip })}
    ${reliever ? K.ReliefBar({ reliever:A(reliever) }) : tak ? K.GridReadout({ mgrs:mgrs.replace("14R MS", "11S MT") }) : ""}
  </div>`;
}

/* ---------- trace ---------- */
function trace(frame){
  const map = new Map();
  frame.querySelectorAll("[data-entity][data-type]").forEach(el => { const k = el.dataset.type + "|" + el.dataset.entity; if (!map.has(k)) map.set(k, { type:el.dataset.type, id:el.dataset.entity, st:new Set(), comps:new Set() }); const o = map.get(k); if (el.dataset.st) o.st.add(el.dataset.st); if (el.dataset.comp) o.comps.add(el.dataset.comp + (el.closest("[data-pane]") ? " · " + el.closest("[data-pane]").dataset.pane : "")); });
  const order = ["Incident","Aircraft","Mission","Subject","Detection","Marker","AirspaceLimit","Dock","Waypoint","Aircraft[]","Map"];
  return [...map.values()].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)).filter(o => o.type !== "Waypoint" || !/wp[3-9]/.test(o.id));
}

/* A still screen can't wait for the operator to ask for relief, so stage the handoff in progress. */
function stillFrame(n){
  const s = n.spec;
  if (s.task === "relief" && !s.missions.some(m => m.type === "relief")){
    const r = s.aircraft.find(a => a.state === "ready"), sub = s.subjects[0];
    if (r && sub){ r.state = "launching"; r.alt_ft = 90; s.missions.push({ id:"M-RL", name:"Relief · " + sub.aircraft, type:"relief", state:"active", attention:false, aircraft:r.id, sector:s.missions[0]?.sector || s.site.sectors[0], next:"Join overwatch", start:"—", cadence:null, workOrder:null });
      s.toast = s.toast || { line1:`${r.id} is en route`, line2:"Arriving in ~2 min", urgency:"info" }; n.notes.push(`Still frame: showing ${r.id} launching to relieve ${sub.aircraft}.`); }
  }
  return n;
}
G.SkydioScreens = { geo, renderDesktop, renderController, trace, stillFrame, toKit: A, airborne: air,
  render: (spec, inject) => spec.surface === "controller" ? renderController(spec, inject) : renderDesktop(spec, inject) };
})(window);
