/*! Skydio Product Kit · product.js
   The product builder engine. A product = mission + operators + capabilities + constraints.
   From that it derives surfaces, information architecture, requirement coverage, user flows, and every
   screen in those flows (as scene specs the kit's screen renderer draws). Pure data in, data out. */
(function (G) {
"use strict";
const K = G.SkydioUI, SKY = G.SKY, SRC = SKY.SRC;
const OP = "SSG Dana Ruiz (you)";
const PILOTS = ["SSG Dana Ruiz","CPL Ari Brennan","SPC Theo Lund","SGT Mara Quinn"];

SKY.MISSIONS = {
  base:     { name:"Base security", blurb:"Docked drones patrol an installation and answer perimeter alarms.", site:"Fort Calder", sectors:["Motor Pool","Barracks Row","Flightline","Ammo Point"], docks:["North Dock","South Dock","East Dock","West Dock"], basemap:"satellite", time:"night", comms:"connected", roles:["ops","cmd","pm"], caps:["response","patrol","multi","ai","airspace","share"], src:SRC.base },
  border:   { name:"Border security", blurb:"A few agents cover miles of corridor with docked drones and handhelds.", site:"Eagle Mtn Corridor", sectors:["Sector 292","Sector 310","Highway 9","Wash Crossing"], docks:["Hive-01","Hive-02","Hive-03","Hive-04"], basemap:"topo", time:"night", comms:"degraded", roles:["ops","cmd","field"], caps:["response","patrol","multi","ai","track","tak","relief","airspace","vio","field"], src:SRC.border },
  tactical: { name:"Tactical ISR", blurb:"A squad flies X10D from the handheld and shares tracks over TAK.", site:"Objective Hawk", sectors:["Treeline","Ridge 4","Wadi","LZ Kite"], docks:["Pack 1","Pack 2","Pack 3","Pack 4"], basemap:"topo", time:"day", comms:"degraded", roles:["field","tak"], caps:["track","tak","relief","vio","field","ai"], src:SRC.isr },
  facility: { name:"Critical facility", blurb:"A small security team covers a distribution center from a desk.", site:"Ridgeway Distribution Ctr", sectors:["Gate A","East Lot","Loading Dock","Perimeter Rd"], docks:["Roof Dock 1","Roof Dock 2","Lot Dock","Gate Dock"], basemap:"street", time:"day", comms:"connected", roles:["ops","cmd"], caps:["response","patrol","multi","ai","share"], src:SRC.secc }
};
SKY.DEPS = { tak:["track"], relief:["track"] };

/* ---------- config ---------- */
SKY.configFor = mission => { const M = SKY.MISSIONS[mission]; return { name:M.name + " product", mission, roles:new Set(M.roles), caps:new Set(M.caps), time:M.time, comms:M.comms, basemap:M.basemap }; };
SKY.toggleCap = (cfg, id, on) => {
  const notes = [];
  if (on){ cfg.caps.add(id); (SKY.DEPS[id] || []).forEach(d => { if (!cfg.caps.has(d)){ cfg.caps.add(d); notes.push(`${capName(id)} needs ${capName(d)}, so it's on too.`); } }); }
  else { cfg.caps.delete(id); Object.entries(SKY.DEPS).forEach(([c, ds]) => { if (ds.includes(id) && cfg.caps.has(c)){ cfg.caps.delete(c); notes.push(`${capName(c)} needs ${capName(id)}, so it's off too.`); } }); }
  return notes;
};
const capName = id => (SKY.CAPS.find(c => c.id === id) || {}).name || id;
SKY.capName = capName;
SKY.roleName = id => (SKY.ROLES.find(r => r.id === id) || {}).name || id;

/* Describe-it resolver: keywords → config. Starts from the mission preset and adds what the sentence names. */
SKY.resolve = text => {
  const p = " " + String(text).toLowerCase() + " ", has = (...w) => w.some(x => p.includes(x)), notes = [];
  const mission = has("border","corridor","cbp","crossing") ? "border" : has("tactical","squad","soldier","platoon","isr","forward","objective","dismount") ? "tactical" : has("warehouse","distribution","facility","plant","campus","substation","port") ? "facility" : "base";
  const cfg = SKY.configFor(mission); notes.push(`Mission: ${SKY.MISSIONS[mission].name}.`);
  const R = [["ops",["operator","ops center","command center","soc ","dispatcher"]],["field",["soldier","field","handheld","squad","dismount","controller"]],["cmd",["commander","watch","supervisor","officer"]],["pm",["program","schedule","manager","admin"]],["tak",["tak","teammate"]]];
  R.forEach(([id, w]) => { if (has(...w) && !cfg.roles.has(id)){ cfg.roles.add(id); notes.push(`Added ${SKY.roleName(id)}.`); } });
  const C = [["response",["alarm","sensor","alert","respond","intrusion","dfr","911"]],["patrol",["patrol","schedule","recurring","rounds"]],["multi",["several","multiple","fleet","many drones","three drones","four drones","docks"]],["ai",["detect","ai ","classif","false alarm"]],["track",["track","follow","shadow","subject","target"]],["tak",["tak","cot","atak"]],["relief",["relief","battery","handoff","hand off","continuous"]],["airspace",["tfr","airspace","faa","no-fly"]],["share",["share","stream","link","commander watch"]],["vio",["gps","jam","denied","vio"]],["field",["gloves","handheld","one-hand","controller"]]];
  C.forEach(([id, w]) => { if (has(...w) && !cfg.caps.has(id)){ SKY.toggleCap(cfg, id, true); notes.push(`Added ${capName(id)}.`); } });
  if (has("night","thermal","overnight","dark")) cfg.time = "night"; else if (has(" day","daylight","daytime")) cfg.time = "day";
  if (has("jam","denied","degraded","contested","disconnected")) cfg.comms = "degraded";
  if (has("topo","terrain","mountain","ridge")) cfg.basemap = "topo"; else if (has("street","city","urban","town","campus")) cfg.basemap = "street";
  const nm = String(text).match(/(?:called|named)\s+"?([A-Z][\w\- ]{2,30})"?/); if (nm) cfg.name = nm[1].trim();
  return { cfg, notes };
};

/* ---------- flows ---------- */
SKY.FLOWS = [
  { id:"respond", name:"Respond to a sensor alert", cap:"response", user:"ops", surface:"desktop", steps:[
    { id:"alert", title:"Alert arrives", actor:"Integration", action:"An intrusion alarm fires at {s0}. It opens an incident with a source and a clock, and no owner yet.", trans:["Sensor alert → Incident: new"], reqs:["R01"], screen:"respond", st:{ inc:"new" }, hot:{ comp:"IncidentCard", text:"Claim" } },
    { id:"claim", title:"Claim it", actor:"ops", action:"Claim the incident so it has an owner. Dispatch is next.", trans:["Incident: new → claimed"], reqs:["R01","R18"], screen:"respond", st:{ inc:"claimed" }, hot:{ comp:"IncidentCard", text:"Dispatch" } },
    { id:"dispatch", title:"Nearest dock launches", actor:"ops", action:"The closest charged aircraft launches from {d0}.", trans:["Incident: claimed → responding","Aircraft: ready → launching"], reqs:["R02","R03"], screen:"respond", st:{ inc:"responding", launch:true }, hot:{ comp:"LaunchCard" } },
    { id:"scene", title:"On scene", actor:"Aircraft", action:"Live video arrives and the aircraft holds a box on the person at {s0}.", trans:["Aircraft: launching → flying","Detection → Subject: tracking"], reqs:["R03","R14"], screen:"respond", st:{ inc:"responding", scene:true }, hot:{ comp:"BoundingBox" } },
    { id:"publish", cap:"tak", title:"Publish to TAK", actor:"ops", action:"Mark the subject hostile and send it to TAK. Teammates see it in their own app.", trans:["Subject → Marker: published"], reqs:["R09"], screen:"respond", st:{ inc:"responding", scene:true, pub:true }, hot:{ comp:"CoTMarker" } },
    { id:"close", title:"End the response", actor:"ops", action:"Close the incident. It can only close because you own it.", trans:["Incident: responding → resolved","Aircraft: flying → returning"], reqs:["R18","R07"], screen:"respond", st:{ inc:"responding", scene:true, pub:"tak" }, hot:{ comp:"IncidentCard", text:"End" } },
    { id:"done", title:"Closed, aircraft returning", actor:"Aircraft", action:"The incident is resolved and the aircraft flies home to recharge.", trans:["Incident: resolved","Aircraft: returning → ready"], reqs:["R18"], screen:"respond", st:{ inc:"resolved", scene:true, home:true } }
  ]},
  { id:"patrol", name:"Patrol a site", cap:"patrol", user:"pm", surface:"desktop", steps:[
    { id:"plan", title:"Schedule coverage", actor:"pm", action:"Work orders put a patrol on each sector with a start time.", trans:["Mission: scheduled"], reqs:["R04"], screen:"plan", st:{}, hot:{ comp:"MissionItem" } },
    { id:"launch", title:"Patrols launch on time", actor:"Dock", action:"Docks launch on schedule; no pilot flies them.", trans:["Mission: scheduled → active","Aircraft: ready → flying"], reqs:["R04","R05"], screen:"monitor", st:{}, hot:{ comp:"PatrolCard" } },
    { id:"detect", cap:"ai", title:"AI counts detections", actor:"Aircraft", action:"People and vehicles are counted on the patrol card; animals are tagged and quieted.", trans:["Detection: seen"], reqs:["R14"], screen:"monitor", st:{ dets:true }, hot:{ comp:"Reticle" } },
    { id:"tfr", cap:"airspace", title:"A TFR goes active", actor:"Airspace", action:"A TFR covers {s1}. The patrol there holds and rises to the top of the list.", trans:["Airspace limit: active","Mission: needs attention"], reqs:["R13"], screen:"monitor", st:{ tfr:true }, hot:{ comp:"OperationItem" } },
    { id:"stop", title:"Bring one home", actor:"ops", action:"Every airborne aircraft has a red return-to-home one tap away.", trans:["Aircraft: flying → returning"], reqs:["R07"], screen:"monitor", st:{}, hot:{ sel:"[data-stop]" } }
  ]},
  { id:"track", name:"Track and share a subject", cap:"track", user:"field", surface:"handheld", steps:[
    { id:"lock", title:"Lock on a subject", actor:"field", action:"Shadow holds a box on the vehicle at {s0} in track mode.", trans:["Detection → Subject: tracking"], reqs:["R08"], screen:"track", st:{ aff:"unknown" }, hot:{ comp:"BoundingBox" } },
    { id:"mark", cap:"tak", title:"Mark it hostile", actor:"field", action:"Pick the TAK marker type. The 2525 symbols aren't restyled.", trans:["Subject: affiliation set"], reqs:["R09"], screen:"track", st:{ aff:"hostile" }, hot:{ sel:".fly .affs" } },
    { id:"publish", cap:"tak", title:"Publish to TAK", actor:"field", action:"The subject goes out as Cursor-on-Target. Teammates and the grid readout update.", trans:["Subject → Marker: published"], reqs:["R09","R10"], screen:"track", st:{ aff:"hostile", pub:true, toast:"tak" }, hot:{ comp:"IsrToast" } },
    { id:"share", cap:"share", title:"Share the stream", actor:"cmd", action:"Send the commander a link to the live video that expires in 24 hours.", trans:["Stream: shared"], reqs:["R15"], screen:"track", st:{ aff:"hostile", pub:"tak", toast:"share" }, hot:{ comp:"IsrToast" } },
    { id:"vio", cap:"vio", title:"GPS jammed, keep flying", actor:"Aircraft", action:"GPS drops; VIO keeps position. Both nav sources stay visible on the strip.", trans:["Nav: GPS lost, VIO holding"], reqs:["R16"], screen:"track", st:{ aff:"hostile", pub:"tak" }, hot:{ comp:"HUD.full" } }
  ]},
  { id:"relief", name:"Relief handoff", cap:"relief", user:"field", surface:"handheld", steps:[
    { id:"warn", title:"Battery warning", actor:"Aircraft", action:"X10-A is at 24% while following the subject. The warning comes with minutes left, before the auto-return.", trans:["Aircraft: low battery","Mission: needs attention"], reqs:["R12"], screen:"relief", st:{ phase:"warn" }, hot:{ comp:"HUD.full" } },
    { id:"enroute", title:"Relief launches", actor:"field", action:"Request relief. X10-B launches and flies to the subject.", trans:["Aircraft: ready → launching","Mission: relief active"], reqs:["R11"], screen:"relief", st:{ phase:"enroute" }, hot:{ comp:"ReliefBar" } },
    { id:"handoff", title:"Handoff complete", actor:"Aircraft", action:"X10-B has the subject. X10-A flies home; coverage never dropped.", trans:["Subject: owner X10-A → X10-B","Aircraft: relieved → returning"], reqs:["R11"], screen:"relief", st:{ phase:"done" }, hot:{ comp:"BoundingBox" } }
  ]}
];

/* ---------- derive the product ---------- */
SKY.derive = cfg => {
  const on = c => c === "core" || cfg.caps.has(c), roles = cfg.roles;
  const surfaces = [];
  if (["ops","cmd","pm"].some(r => roles.has(r))) surfaces.push("desktop");
  if (roles.has("field") || cfg.caps.has("field")) surfaces.push("handheld");
  if (cfg.caps.has("tak")) surfaces.push("tak");
  const reqs = SKY.REQ.map(r => ({ ...r, state: !on(r.cap) ? "off" : r.users.some(u => roles.has(u)) ? "in" : "nouser" }));
  const inReq = reqs.filter(r => r.state === "in");
  const roleNeeds = [...new Set(SKY.ROLES.filter(r => roles.has(r.id)).flatMap(r => ({ ops:["n1","n2","n7","n9"], field:["n3","n4","n8","n10"], cmd:["n7","n4","n1"], pm:["n6","n5"], tak:["n4"] })[r.id]))];
  if (cfg.comms === "degraded" && !roleNeeds.includes("n8")) roleNeeds.push("n8");
  const needs = roleNeeds.map(n => { const by = SKY.REQ.filter(r => r.needs.includes(n)); const met = inReq.filter(r => r.needs.includes(n));
    return { id:n, name:SKY.NEEDS[n], met:met.map(r => r.code), suggest:[...new Set(by.filter(r => !on(r.cap)).map(r => r.cap))] }; });
  const frus = [...new Set(inReq.flatMap(r => r.frus))].map(f => SKY.FRUS[f][0]);
  const products = SKY.PRODUCTS.filter(p => inReq.some(r => r.products.includes(p.id)));
  const ia = {};
  if (surfaces.includes("desktop")) ia.desktop = [["Flight Deck","core"],["Incidents","response"],["Patrol Planning","patrol"],["Fleet & docks", cfg.caps.has("multi") || cfg.caps.has("patrol") ? "core" : "x"],["Airspace","airspace"],["Media & sharing","share"],["Reports","response"]].filter(([, c]) => on(c)).map(([n, c]) => ({ name:n, cap:c }));
  if (surfaces.includes("handheld")) ia.handheld = [["Fly","core"],["Shadow","track"],["TAK","tak"],["Relief","relief"],["Nav: GPS + VIO","vio"]].filter(([, c]) => on(c)).map(([n, c]) => ({ name:n, cap:c }));
  if (surfaces.includes("tak")) ia.tak = [{ name:"CoT out: subjects and aircraft", cap:"tak" }, { name:"CoT in: teammates and markers", cap:"tak" }];
  const flows = SKY.FLOWS.filter(f => on(f.cap)).map(f => {
    const surface = surfaces.includes(f.surface) ? f.surface : surfaces.includes("desktop") ? "desktop" : "handheld";
    return { ...f, surface, moved:surface !== f.surface, steps:f.steps.filter(s => !s.cap || on(s.cap)) };
  });
  const screens = [...new Set(flows.flatMap(f => f.steps.map(s => s.screen)))];
  const gaps = SKY.GAPS.map((g, i) => ({ code:"G" + (i + 1), name:g[0], doc:g[1], reqs:g[2].map(n => "R" + String(n).padStart(2, "0")) })).filter(g => g.reqs.some(c => inReq.some(r => r.code === c)));
  const stages = SKY.STAGES.filter(s => inReq.some(r => r.stages.includes(s.id)));
  const warnings = [];
  if (!surfaces.length) warnings.push("No operator chosen, so the product has no surface. Add at least one operator.");
  if (cfg.comms === "degraded" && !cfg.caps.has("vio")) warnings.push("Comms are degraded but GPS-denied flight is off. Need n8 goes unmet.");
  if (roles.has("field") && !cfg.caps.has("field")) warnings.push("A field operator is on the team, but handheld field ops is off. Glove-size controls (R17) aren't in.");
  if (cfg.caps.has("relief") && !cfg.caps.has("multi") && !surfaces.includes("handheld")) warnings.push("Relief needs a second aircraft; multi-aircraft supervision is off.");
  return { cfg, surfaces, reqs, inReq, needs, frus, products, ia, flows, screens, gaps, stages, warnings,
    coverage: needs.length ? Math.round(100 * needs.filter(n => n.met.length).length / needs.length) : 0 };
};

/* ---------- scenes: a step → a scene spec for SkydioScreens ---------- */
SKY.scene = (bp, flow, step) => {
  const cfg = bp.cfg, M = SKY.MISSIONS[cfg.mission], on = c => cfg.caps.has(c), st = step.st || {};
  const sensor = cfg.time === "night" ? "thermal" : "color", S = M.sectors;
  const n = on("multi") ? 3 : 1;
  const mk = (i, state, x = {}) => ({ id:"X10-" + "ABCD"[i], dock:M.docks[i], pilot:PILOTS[i], state, battery:[82,64,91,100][i], alt_ft:state === "ready" ? 0 : [180,150,210,120][i], speed_mph:state === "ready" ? 0 : [12,9,14,10][i], heading:[45,310,120,200][i], sensor, ...x });
  const patrol = (a, i) => ({ id:"M-P" + i, name:S[i % 4] + " patrol", type:"patrol", state:"active", attention:false, aircraft:a.id, sector:S[i % 4], next:S[(i + 1) % 4], start:"20:00", cadence:on("patrol") ? "Every 30 mins" : null, workOrder:null });
  const s = { title:`${flow.name} · ${step.title}`, surface:flow.surface === "handheld" ? "controller" : "desktop", task:"monitor", basemap:cfg.basemap, site:{ name:M.site, sectors:S.slice(0, 3) }, focus:"X10-A", aircraft:[], missions:[], incidents:[], detections:[], subjects:[], markers:[], airspace:[], toast:null };
  const pub = st.pub === true || (st.pub === "tak" && on("tak"));
  if (step.screen === "monitor"){
    s.aircraft = [0,1,2].slice(0, n).map(i => mk(i, "flying"));
    s.missions = s.aircraft.map(patrol);
    if (on("ai") || st.dets) s.detections = s.aircraft.map((a, i) => ({ aircraft:a.id, class:["person","vehicle","animal"][i % 3], count:[1,2,1][i % 3] }));
    if (on("airspace") && st.tfr){ s.airspace = [{ name:"TFR · " + S[1], state:"active" }]; const m = s.missions[Math.min(1, s.missions.length - 1)]; m.attention = true; m.sector = S[1]; m.name = S[1] + " patrol"; }
    if (on("tak")) s.markers = [{ label:"Blue 2-1", affiliation:"friend" }];
  } else if (step.screen === "respond"){
    const aState = st.home ? "returning" : st.scene ? "flying" : st.launch ? "launching" : "ready";
    s.aircraft = [mk(0, aState, aState === "ready" ? { battery:100 } : { battery:97, alt_ft:aState === "launching" ? 60 : 150 }), ...[1,2].slice(0, n - 1).map(i => mk(i, "flying"))];
    s.missions = s.aircraft.slice(1).map((a, i) => patrol(a, i + 1));
    if (aState !== "ready") s.missions.unshift({ id:"M-R1", name:"Response · " + S[0], type:"response", state:st.home ? "done" : "active", attention:false, aircraft:"X10-A", sector:S[0], next:st.scene ? "On scene" : "En route", start:"02:15", cadence:null, workOrder:null });
    s.incidents = [{ id:"INC-4471", title:"Intrusion alarm · " + S[0], state:st.inc, source:"IDS", sensor:S[0] + " gate sensor", age_s:st.inc === "new" ? 30 : st.scene ? 150 : 75, area:S[0], claimedBy:st.inc === "new" ? null : OP }];
    if (st.scene){ s.subjects = [{ id:"SUB-1", aircraft:"X10-A", class:"person", affiliation:pub ? "hostile" : "unknown", mode:"track" }]; if (on("ai")) s.detections = [{ aircraft:"X10-A", class:"person", count:1 }]; }
    if (pub) s.markers = [{ label:"Subject · person", affiliation:"hostile" }];
  } else if (step.screen === "plan"){
    s.task = "plan";
    s.aircraft = [0,1,2].slice(0, Math.max(n, 2)).map(i => mk(i, "ready", { battery:100 }));
    s.missions = S.map((sec, i) => ({ id:"M-S" + i, name:["Visibility perimeter patrol","Vehicle lot patrol","Barracks sweep","Flightline check"][i], type:"patrol", state:i === 0 ? "upcoming" : "scheduled", attention:false, aircraft:s.aircraft[i % s.aircraft.length].id, sector:sec, next:sec, start:["21:30","23:00","01:30","03:30"][i], cadence:i === 3 ? "Every 2 hrs" : null, workOrder:"WO " + ["02A-65D","04B-11A","03B-75C","05C-20F"][i] }));
    if (on("airspace")){ s.airspace = [{ name:"TFR · " + S[1], state:"active" }]; s.missions[1].attention = true; }
  } else if (step.screen === "track"){
    s.task = "track";
    s.aircraft = [mk(0, "flying"), ...(n > 1 ? [mk(1, "flying")] : [])];
    s.missions = [{ id:"M-O1", name:"Overwatch · " + S[0], type:"overwatch", state:"active", attention:false, aircraft:"X10-A", sector:S[0], next:"Hold on subject", start:"—", cadence:null, workOrder:null }, ...(n > 1 ? [patrol(s.aircraft[1], 1)] : [])];
    s.subjects = [{ id:"SUB-1", aircraft:"X10-A", class:"vehicle", affiliation:st.aff || "unknown", mode:"track" }];
    if (on("ai")) s.detections = [{ aircraft:"X10-A", class:"vehicle", count:1 }];
    if (on("tak")) s.markers = [...(pub ? [{ label:"Subject · vehicle", affiliation:st.aff || "hostile" }] : []), { label:"Blue 2-1", affiliation:"friend" }];
    if (st.toast === "tak") s.toast = { line1:"Subject published to TAK", line2:`VEHICLE · ${(st.aff || "hostile").toUpperCase()} · ${S[0].toUpperCase()}`, urgency:"info" };
    if (st.toast === "share") s.toast = { line1:"Live stream shared", line2:"Link expires in 24 hours", urgency:"info" };
  } else if (step.screen === "relief"){
    s.task = "relief"; const ph = st.phase;
    s.aircraft = [mk(0, ph === "done" ? "returning" : "flying", { battery:ph === "done" ? 18 : 24 }), mk(1, ph === "warn" ? "ready" : ph === "enroute" ? "launching" : "flying", { battery:ph === "done" ? 96 : 100, alt_ft:ph === "enroute" ? 90 : ph === "done" ? 150 : 0 })];
    s.focus = ph === "done" ? "X10-B" : "X10-A";
    s.subjects = [{ id:"SUB-1", aircraft:ph === "done" ? "X10-B" : "X10-A", class:"person", affiliation:on("tak") ? "hostile" : "unknown", mode:"follow" }];
    s.missions = [{ id:"M-O1", name:"Overwatch · " + S[0], type:"overwatch", state:"active", attention:ph === "warn", aircraft:s.subjects[0].aircraft, sector:S[0], next:"Hold on subject", start:"—", cadence:null, workOrder:null }];
    if (ph === "enroute") s.missions.push({ id:"M-RL", name:"Relief · X10-A", type:"relief", state:"active", attention:false, aircraft:"X10-B", sector:S[0], next:"Join overwatch", start:"—", cadence:null, workOrder:null });
    if (on("tak")) s.markers = [{ label:"Subject", affiliation:"hostile" }];
    s.toast = ph === "warn" ? { line1:"Prepare relief drone", line2:"X10-A will need relief in 4 min", urgency:"action" } : ph === "enroute" ? { line1:"X10-B is en route", line2:"Arriving in ~2 min", urgency:"info" } : { line1:"X10-B has the subject", line2:"X10-A returning", urgency:"info" };
  }
  return K.scenario.normalize(s).spec;
};
SKY.text = (t, cfg) => { const M = SKY.MISSIONS[cfg.mission]; return String(t).replace(/\{s(\d)\}/g, (_, i) => M.sectors[+i]).replace(/\{d(\d)\}/g, (_, i) => M.docks[+i]); };

/* ---------- export ---------- */
SKY.exportJSON = (bp, checks) => ({
  product:bp.cfg.name, mission:SKY.MISSIONS[bp.cfg.mission].name, operators:[...bp.cfg.roles].map(SKY.roleName), capabilities:[...bp.cfg.caps].map(capName),
  constraints:{ time:bp.cfg.time, comms:bp.cfg.comms, basemap:bp.cfg.basemap }, surfaces:bp.surfaces, informationArchitecture:bp.ia,
  coverage:{ percent:bp.coverage, needs:bp.needs.map(n => ({ need:n.name, metBy:n.met, suggest:n.suggest.map(capName) })) },
  requirements:bp.reqs.map(r => ({ code:r.code, name:r.name, status:r.state === "in" ? "in product" : r.state === "off" ? "capability off: " + capName(r.cap) : "no operator for it" })),
  flows:bp.flows.map(f => ({ flow:f.name, surface:f.surface, steps:f.steps.map(s => ({ step:s.title, actor:s.actor, does:SKY.text(s.action, bp.cfg), transitions:s.trans, requirements:s.reqs, screen:SKY.SCREENS[s.screen].name })) })),
  openGaps:bp.gaps.map(g => `${g.code} ${g.name}`), designChecks:checks || null
});
SKY.exportMD = (bp, checks) => {
  const M = SKY.MISSIONS[bp.cfg.mission], L = [];
  L.push(`# ${bp.cfg.name}`, "", `${M.name}: ${M.blurb}`, "", `**Operators:** ${[...bp.cfg.roles].map(SKY.roleName).join(", ")}  `, `**Surfaces:** ${bp.surfaces.join(", ")}  `, `**Constraints:** ${bp.cfg.time}, comms ${bp.cfg.comms}, ${bp.cfg.basemap} map  `, `**Need coverage:** ${bp.coverage}%`, "");
  L.push("## Capabilities", ...[...bp.cfg.caps].map(c => `- ${capName(c)}: ${(SKY.CAPS.find(x => x.id === c) || {}).doc || ""}`), "");
  L.push("## Information architecture", ...Object.entries(bp.ia).map(([s, items]) => `- **${s}:** ${items.map(i => i.name).join(" · ")}`), "");
  L.push("## Requirements", ...bp.inReq.map(r => `- ${r.code} ${r.name}${r.status === "modeled" ? " _(modeled)_" : ""}`), "");
  const unmet = bp.needs.filter(n => !n.met.length); if (unmet.length) L.push("## Unmet needs", ...unmet.map(n => `- ${n.name}${n.suggest.length ? ` (turn on ${n.suggest.map(capName).join(" or ")})` : ""}`), "");
  L.push("## User flows"); bp.flows.forEach(f => { L.push(`### ${f.name} (${f.surface})`); f.steps.forEach((s, i) => L.push(`${i + 1}. **${s.title}**: ${SKY.text(s.action, bp.cfg)} _${s.reqs.join(", ")}_`)); L.push(""); });
  if (checks) L.push("## Design checks", `${checks.pass}/${checks.total} screen checks pass${checks.fail ? `, ${checks.fail} fail` : ""}${checks.warn ? `, ${checks.warn} warn` : ""}.`, "");
  if (bp.gaps.length) L.push("## Open questions", ...bp.gaps.map(g => `- ${g.code} ${g.name}: ${g.doc}`), "");
  L.push("_Unofficial design study built on public Skydio material. Not affiliated with Skydio._");
  return L.join("\n");
};
})(window);
