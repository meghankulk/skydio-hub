/*! Skydio Product Kit · onto.js
   The product ontology: goal → users → needs and frustrations → requirements → where each requirement is
   delivered (Skydio product, builder screen, design check, lifecycle stage), the public evidence behind it,
   and the gaps the public record leaves open. Every requirement also names the capability that delivers it,
   which is how the product builder decides what a configured product covers.
   Status: "stated" = a public Skydio page or screenshot shows it; "modeled" = my design reading.
   Unofficial. Not affiliated with Skydio. Exposes window.AK (the shape map.js reads) and window.SKY. */
(function (G) {
"use strict";
const K = G.SkydioUI;
const esc = K.esc, cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const SRC = {
  natsec: "https://www.skydio.com/solutions/national-security",
  base: "https://www.skydio.com/solutions/national-security/base-security",
  border: "https://www.skydio.com/solutions/national-security/border-security",
  isr: "https://www.skydio.com/software/isr-command",
  atak: "https://www.skydio.com/blog/skydio-x10d-integrates-with-atak-for-tactical-isr",
  dfr: "https://www.skydio.com/software/dfr-command",
  secc: "https://www.skydio.com/software/security-command",
  ss: "https://www.skydio.com/resources/videos/secret-service-deploys-dfr-for-real-time-situational-awareness"
};
const SKY = G.SKY = { SRC };

/* ---------- reference data ---------- */
SKY.ROLES = [
  { id:"ops", name:"Ops-center operator", needs:"Supervises several docked drones from a desktop command view.", surface:"desktop" },
  { id:"field", name:"Field operator", needs:"Flies and tracks from the X10D handheld, often with gloves, at night, on TAK.", surface:"handheld" },
  { id:"cmd", name:"Watch commander", needs:"Owns incidents, decides responses, briefs up the chain.", surface:"desktop" },
  { id:"pm", name:"Program manager", needs:"Schedules coverage, keeps the fleet and airspace compliant.", surface:"desktop" },
  { id:"tak", name:"TAK teammate", needs:"Receives drone tracks and markers in their own TAK app.", surface:"tak" }
];
SKY.STAGES = [
  { id:"plan", name:"Plan", q:"What will we cover, when, and with what?" },
  { id:"launch", name:"Launch", q:"Which dock goes, and is it safe to?" },
  { id:"patrol", name:"Patrol", q:"Is the site covered right now?" },
  { id:"detect", name:"Detect", q:"Did a sensor or the AI see something real?" },
  { id:"respond", name:"Respond", q:"Who owns it and where is the aircraft?" },
  { id:"track", name:"Track", q:"Can we keep eyes on the subject?" },
  { id:"share", name:"Share", q:"Who else needs to see it?" },
  { id:"handoff", name:"Hand off", q:"Who takes over before the battery runs out?" },
  { id:"recover", name:"Recover", q:"Is every aircraft home and charging?" },
  { id:"review", name:"Review", q:"What happened, and is it closed?" }
];
SKY.PRODUCTS = [
  { id:"fd", name:"Flight Deck", job:"Supervise patrols and live feeds across a site (Security Command).", src:SRC.secc },
  { id:"dfr", name:"DFR Command", job:"Turn sensor alerts and calls into drone responses.", src:SRC.dfr },
  { id:"isr", name:"ISR Command", job:"TAK-native ISR on the X10D controller.", src:SRC.isr },
  { id:"dock", name:"Dock & fleet", job:"Remote launch, recovery and charging of X10 aircraft.", src:SRC.base },
  { id:"pp", name:"Patrol Planning", job:"Schedule recurring missions by sector.", src:SRC.secc },
  { id:"share", name:"Live stream sharing", job:"Send a live feed to someone outside the ops center.", src:SRC.base }
];
SKY.PROGRAMS = [
  { name:"Base Security", what:"Patrol, verify and respond on military installations from docked drones.", src:SRC.base },
  { name:"Border Security", what:"One operator manages several drones; on scene within about 2 minutes of a sensor alert (company claim).", src:SRC.border },
  { name:"ISR Command", what:"TAK-native ISR: markers and positions in both directions, relief handoff, subject tracking.", src:SRC.isr },
  { name:"X10D + ATAK", what:"Native TAK workflows in Flight Deck; CoT out, markers in.", src:SRC.atak },
  { name:"DFR Command", what:"10M+ calls for service; 25+ public-safety integrations (company claim).", src:SRC.dfr },
  { name:"U.S. Secret Service DFR", what:"Remotely launched X10 drones for situational awareness in protective operations.", src:SRC.ss }
];
const PDOC = { P01:"Every saturated color maps to an operational meaning.", P02:"Filled red only for stop, hostile and live; every airborne view has a red stop.", P03:"A focused aircraft looks the same in every pane.", P04:"Desktop runs list → map → feeds; handheld tools stay on the edges.", P05:"Every card leads with its state; time-bound states carry time.", P06:"Telemetry is mono with units; coordinates carry a format.", P07:"TAK output uses 2525 symbols, MGRS and the TAK voice.", P08:"Handheld targets are 44px or larger.", P09:"Overlays carry their own stroke or scrim.", P10:"Every incident shows source, clock, owner and a close.", P11:"Cards read identity, where and next, who and health.", P12:"Quiet surfaces, radius 4px or less, no card shadows." };
SKY.PRINCIPLES = K.PRINCIPLES.map(([c, n]) => [c, n, PDOC[c]]);

/* Capabilities the builder toggles. core = always part of the product. */
SKY.CAPS = [
  { id:"core", name:"Flight safety core", doc:"Safe stop, return-to-home and battery state on every airborne aircraft.", core:true },
  { id:"response", name:"Sensor-triggered response", doc:"Alerts from IDS, radar or cameras become owned incidents and one-click launches." },
  { id:"patrol", name:"Scheduled patrols", doc:"Recurring missions by sector, launched from docks without a pilot." },
  { id:"multi", name:"Multi-aircraft supervision", doc:"One operator watches several aircraft in one list, map and feed grid." },
  { id:"ai", name:"AI detection", doc:"People, vehicles and animals counted on patrol; animals quieted." },
  { id:"track", name:"Subject tracking", doc:"Shadow: track or follow a subject and keep it framed." },
  { id:"tak", name:"TAK interoperability", doc:"Mark affiliation, publish CoT, show teammates on the drone map." },
  { id:"relief", name:"Relief handoff", doc:"Warn early and hand a subject to a fresh aircraft." },
  { id:"airspace", name:"Airspace & TFR", doc:"Show TFRs and hold patrols that would enter them." },
  { id:"share", name:"Live stream sharing", doc:"Expiring links so commanders can watch on a phone." },
  { id:"vio", name:"GPS-denied flight", doc:"VIO keeps position when GPS is jammed or lost." },
  { id:"field", name:"Handheld field ops", doc:"Glove-size, edge-placed controls on the X10D controller." }
];

/* ---------- ontology tables ---------- */
const GOAL = { id:"goal", n:"Eyes on any event in minutes, with few people", doc:"Keep a base, border or unit aware and safe with docked and handheld drones that a small team can supervise, and share what they see with the force.", src:SRC.natsec, status:"stated" };
const USERS = { ops:["n1","n2","n7","n9"], field:["n3","n4","n8","n10"], cmd:["n7","n4","n1"], pm:["n6","n5"], tak:["n4"] };
const FRUS_OF = { ops:["f1","f5","f6","f4"], field:["f2","f3"], cmd:["f1"], pm:["f7","f6"], tak:["f3"] };
const NEEDS = {
  n1:"Get eyes on an event within minutes", n2:"Supervise several aircraft without flying each", n3:"Keep continuous eyes on a subject",
  n4:"Share what the drone sees beyond the console", n5:"Fly within airspace rules", n6:"Plan recurring coverage of a site",
  n7:"Know who owns each event and close it out", n8:"Keep flying when GPS or links degrade", n9:"Trust detections without drowning in false alarms",
  n10:"Work one-handed, with gloves, in sun or dark"
};
const FRUS = {
  f1:["Alerts arrive from many systems with no single owner","Sensors, cameras and radar each raise their own alarm.","modeled"],
  f2:["Battery cuts overwatch short","An aircraft has to leave the subject to recharge.","stated",SRC.isr],
  f3:["Switching between the drone app and TAK","Markers typed twice, or not shared at all.","stated",SRC.atak],
  f4:["False alarms from animals and weather","Every alert pulls an aircraft and an operator.","modeled"],
  f5:["Matching a video feed to a dot on the map","Several feeds, several markers, one operator.","modeled"],
  f6:["One pilot per drone doesn't scale","Coverage is limited by headcount, not aircraft.","stated",SRC.border],
  f7:["Airspace changes mid-mission","A TFR goes active and patrols must change now.","modeled"]
};
// name, users, needs, frustrations, stages, products, screens, checks, evidence, status, doc, source, capability
const REQ = [
  ["Sensor alerts open an incident with source, clock and owner", ["ops","cmd"], ["n1","n7"], ["f1"], ["detect","respond"], ["dfr"], ["respond"], ["P10","P05"], ["Base Security","DFR Command"], "stated", "The alert card shows the integration, seconds since it fired, and who owns it.", SRC.base, "response"],
  ["One-click dispatch launches the nearest ready dock", ["ops"], ["n1"], ["f6"], ["respond","launch"], ["dfr","dock"], ["respond"], ["P02","P04"], ["Base Security"], "stated", "Dispatch claims the incident and launches the closest charged aircraft.", SRC.base, "response"],
  ["Live video of an event within about two minutes", ["ops","cmd"], ["n1"], ["f6"], ["launch","respond"], ["dock","dfr"], ["respond"], ["P02"], ["Border Security","U.S. Secret Service DFR"], "stated", "Docked aircraft launch on alert and stream on arrival.", SRC.border, "response"],
  ["Patrols run on a schedule without a pilot", ["ops","pm"], ["n6","n2"], ["f6"], ["plan","patrol"], ["pp","dock"], ["plan","monitor"], ["P05","P11"], ["Base Security"], "stated", "Mission schedule by work order, sector and start time.", SRC.base, "patrol"],
  ["One operator supervises several aircraft from one view", ["ops"], ["n2"], ["f6","f5"], ["patrol"], ["fd"], ["monitor"], ["P04","P03"], ["Border Security"], "stated", "List, map and feed grid in one command view.", SRC.border, "multi"],
  ["A focused aircraft looks the same in list, map and feed", ["ops"], ["n2"], ["f5"], ["patrol","respond"], ["fd"], ["monitor","respond"], ["P03"], [], "modeled", "Amber marker, amber feed border and an outlined list card for one aircraft.", null, "multi"],
  ["A safe stop is one tap from every airborne aircraft", ["ops","field"], ["n5"], [], ["launch","patrol","respond","track"], ["fd","isr"], ["monitor","track"], ["P02"], [], "stated", "Red return-to-home on every feed and on the handheld's right rail.", SRC.base, "core"],
  ["Track or follow a subject and keep it framed", ["field","ops"], ["n3"], [], ["track"], ["isr"], ["track"], ["P09"], ["ISR Command"], "stated", "Shadow keeps a box on the subject in track or follow mode.", SRC.isr, "track"],
  ["Mark a subject's affiliation and publish it to TAK", ["field","tak"], ["n4"], ["f3"], ["track","share"], ["isr"], ["track"], ["P07"], ["ISR Command","X10D + ATAK"], "stated", "Hostile, friend, unknown or neutral, sent as Cursor-on-Target.", SRC.isr, "tak"],
  ["Show TAK teammates and markers on the drone map", ["field"], ["n4"], ["f3"], ["track"], ["isr"], ["track"], ["P07"], ["X10D + ATAK"], "stated", "Markers move both ways, with no second device.", SRC.atak, "tak"],
  ["Hand a subject to a fresh aircraft before battery runs out", ["field","ops"], ["n3"], ["f2"], ["handoff"], ["isr","dock"], ["relief"], ["P05","P02"], ["ISR Command"], "stated", "Relief launches, joins the subject, and the first aircraft returns.", SRC.isr, "relief"],
  ["Warn before battery forces a return", ["field","ops"], ["n3"], ["f2"], ["patrol","handoff"], ["fd","isr"], ["relief"], ["P05"], ["ISR Command"], "stated", "A 'prepare relief' message with minutes left, before the auto-return.", SRC.isr, "relief"],
  ["Show active TFRs and hold patrols that would enter them", ["pm","ops"], ["n5"], ["f7"], ["plan","patrol"], ["pp","fd"], ["plan","monitor"], ["P05","P02"], [], "stated", "A 'TFR Active' badge and a hatched zone; affected patrols hold.", SRC.secc, "airspace"],
  ["Count detections by class and quiet animals", ["ops"], ["n9"], ["f4"], ["detect","patrol"], ["fd"], ["monitor"], ["P01","P11"], ["Base Security"], "stated", "Person, vehicle and animal counts on each patrol card; animals tagged amber.", SRC.base, "ai"],
  ["Share a live stream with an expiring link", ["cmd","tak"], ["n4"], ["f3"], ["share"], ["share"], ["track"], ["P09"], ["Base Security"], "stated", "A QR code and a link that lasts 24 hours.", SRC.base, "share"],
  ["Hold position and keep flying without GPS", ["field","ops"], ["n8"], [], ["patrol","track"], ["isr"], ["track","monitor"], ["P06"], ["ISR Command"], "stated", "VIO shown as its own nav source beside GPS.", SRC.isr, "vio"],
  ["Every handheld control reachable with gloves, on the screen edge", ["field"], ["n10"], [], ["track","handoff"], ["isr"], ["track","relief"], ["P08","P04"], [], "modeled", "44px targets on the left and right rails; video center stays clear.", null, "field"],
  ["Close every incident with an owner and a record", ["cmd"], ["n7"], ["f1"], ["review","recover"], ["dfr"], ["respond"], ["P10"], ["DFR Command"], "stated", "End response is only possible once someone owns the incident.", SRC.dfr, "response"]
];
const GAPS = [
  ["How alerts are prioritized when several fire at once", "Public screens show one incident at a time. Triage order is my assumption.", [1, 18]],
  ["How degraded links and lost video are shown", "VIO is shown; the operator's view of a dropped link isn't.", [3, 16]],
  ["Who may authorize a launch", "Dispatch is one click in my model; real rules of engagement may need a second person.", [2]],
  ["What changes on classified or disconnected networks", "Cloud features need connectivity; TAK and sharing on closed networks aren't described.", [9, 15]],
  ["How shifts hand off open incidents", "Ownership is personal; the handover between watch officers isn't shown.", [18]]
];
SKY.REQ = REQ.map((r, i) => ({ id:"r" + (i + 1), code:"R" + String(i + 1).padStart(2, "0"), name:r[0], users:r[1], needs:r[2], frus:r[3], stages:r[4], products:r[5], screens:r[6], checks:r[7], evidence:r[8], status:r[9], doc:r[10], src:r[11], cap:r[12] }));
SKY.NEEDS = NEEDS; SKY.FRUS = FRUS; SKY.GOAL = GOAL; SKY.GAPS = GAPS;
SKY.SCREENS = {
  monitor:{ name:"Fleet overview", surface:"desktop" }, respond:{ name:"Incident response", surface:"desktop" }, plan:{ name:"Patrol planning", surface:"desktop" },
  track:{ name:"Handheld tracking", surface:"handheld" }, relief:{ name:"Relief handoff", surface:"handheld" }
};

/* ---------- AK shim: the shape map.js reads ---------- */
const M = {};
M.CLASSES = [
  { id:"Goal", label:"Goal", plural:"Goal", col:"#ff3030", sym:"wye", r:14, rank:0, doc:"What the product line exists to do." },
  { id:"User", label:"User", plural:"Users", col:"rgb(64,200,255)", sym:"circle", r:9, rank:1, doc:"People the products serve." },
  { id:"Need", label:"Need", plural:"Needs", col:"rgb(212,169,84)", sym:"diamond", r:7, rank:2, doc:"What a user needs from the tools." },
  { id:"Frustration", label:"Frustration", plural:"Frustrations", col:"rgb(255,122,110)", sym:"triangle", r:6.5, rank:2, doc:"Pain users have today." },
  { id:"Requirement", label:"Requirement", plural:"Requirements", col:"rgb(118,196,146)", sym:"circle", r:6.5, rank:3, doc:"What the product must do to meet a need." },
  { id:"Product", label:"Product", plural:"Products", col:"rgb(94,166,201)", sym:"square", r:6, rank:4, doc:"The Skydio product that delivers it." },
  { id:"Screen", label:"Builder screen", plural:"Builder screens", col:"rgb(178,156,255)", sym:"cross", r:6, rank:4, doc:"A screen the product builder draws that presents the requirement." },
  { id:"Principle", label:"Design check", plural:"Design checks", col:"rgb(120,220,200)", sym:"diamond", r:5, rank:4, doc:"A kit principle every built screen is checked against." },
  { id:"Evidence", label:"Program evidence", plural:"Program evidence", col:"rgb(176,184,198)", sym:"star", r:5.5, rank:4, doc:"A public page that shows the requirement in use." },
  { id:"Gap", label:"Open gap", plural:"Open gaps", col:"#ffb829", sym:"triangle", r:8, rank:4, doc:"What the public record doesn't say. Verify before designing on it." },
  { id:"Stage", label:"Lifecycle stage", plural:"Lifecycle stages", col:"rgb(201,206,216)", sym:"square", r:7, rank:5, doc:"Where in the operation the requirement applies." }
];
M.RELATIONS = [
  { id:"serves", out:"Serves", in:"Served by", col:"#ff3030", doc:"User → Goal" },
  { id:"needs", out:"Needs", in:"Needed by", col:"rgb(212,169,84)", doc:"User → Need" },
  { id:"experiences", out:"Experiences", in:"Experienced by", col:"rgb(255,122,110)", doc:"User → Frustration" },
  { id:"realizedBy", out:"Realized by", in:"Realizes", col:"rgb(118,196,146)", doc:"Need → Requirement" },
  { id:"addresses", out:"Addresses", in:"Addressed by", col:"rgb(255,122,110)", doc:"Requirement → Frustration" },
  { id:"pertainsTo", out:"User type", in:"Requirements for this user", col:"rgb(64,200,255)", doc:"Requirement → User" },
  { id:"deliveredBy", out:"Delivered by", in:"Delivers", col:"rgb(94,166,201)", doc:"Requirement → Product" },
  { id:"presentedIn", out:"Presented in", in:"Presents", col:"rgb(178,156,255)", doc:"Requirement → Builder screen" },
  { id:"checkedBy", out:"Checked by", in:"Checks", col:"rgb(120,220,200)", doc:"Requirement → Design check" },
  { id:"evidencedBy", out:"Evidence", in:"Evidence for", col:"rgb(176,184,198)", doc:"Requirement → Program" },
  { id:"gapToday", out:"Open gap", in:"Gap in", col:"#ffb829", doc:"Requirement → Open gap" },
  { id:"inStage", out:"Lifecycle stage", in:"Requirements", col:"rgb(201,206,216)", doc:"Requirement → Stage" },
  { id:"precedes", out:"Next stage", in:"Previous stage", col:"#646f87", doc:"Stage → Stage" }
];
M.build = () => {
  const N = [], L = [], add = (c, id, n, doc, x = {}) => N.push({ c, id, n, doc, ...x }), link = (s, r, t) => L.push({ s, r, t });
  add("Goal", GOAL.id, GOAL.n, GOAL.doc, { src:GOAL.src, status:GOAL.status });
  SKY.ROLES.forEach(r => add("User", "u-" + r.id, r.name, r.needs, { primary:r.id === "ops" }));
  Object.entries(NEEDS).forEach(([id, n]) => add("Need", id, n, ""));
  Object.entries(FRUS).forEach(([id, f]) => add("Frustration", id, f[0], f[1], { status:f[2], src:f[3] }));
  SKY.STAGES.forEach(s => add("Stage", "s-" + s.id, s.name, s.q));
  SKY.PRODUCTS.forEach(p => add("Product", "p-" + p.id, p.name, p.job, { src:p.src }));
  Object.entries(SKY.SCREENS).forEach(([k, v]) => add("Screen", "sc-" + k, v.name, `Builder screen "${v.name}" (${v.surface}), drawn from kit components.`, { screen:k }));
  SKY.PRINCIPLES.forEach(p => add("Principle", p[0], p[1], p[2], { code:p[0] }));
  SKY.PROGRAMS.forEach((p, i) => add("Evidence", "e" + i, p.name, p.what, { src:p.src }));
  SKY.REQ.forEach(r => add("Requirement", r.id, r.name, r.doc, { code:r.code, status:r.status, src:r.src }));
  GAPS.forEach((g, i) => add("Gap", "gp" + (i + 1), g[0], g[1], { code:"G" + (i + 1) }));
  SKY.ROLES.forEach(r => { link("u-" + r.id, "serves", "goal"); (USERS[r.id] || []).forEach(n => link("u-" + r.id, "needs", n)); (FRUS_OF[r.id] || []).forEach(f => link("u-" + r.id, "experiences", f)); });
  const P = SKY.PROGRAMS.map(p => p.name);
  SKY.REQ.forEach(r => {
    r.needs.forEach(n => link(n, "realizedBy", r.id)); r.frus.forEach(f => link(r.id, "addresses", f)); r.users.forEach(u => link(r.id, "pertainsTo", "u-" + u));
    r.stages.forEach(s => link(r.id, "inStage", "s-" + s)); r.products.forEach(p => link(r.id, "deliveredBy", "p-" + p)); r.screens.forEach(s => link(r.id, "presentedIn", "sc-" + s));
    r.checks.forEach(p => link(r.id, "checkedBy", p)); r.evidence.forEach(e => { const k = P.indexOf(e); if (k >= 0) link(r.id, "evidencedBy", "e" + k); });
  });
  GAPS.forEach((g, i) => g[2].forEach(r => link("r" + r, "gapToday", "gp" + (i + 1))));
  SKY.STAGES.slice(0, -1).forEach((s, i) => link("s-" + s.id, "precedes", "s-" + SKY.STAGES[i + 1].id));
  const byId = new Map(N.map(n => [n.id, n])), CLS = new Map(M.CLASSES.map(c => [c.id, c])), REL = new Map(M.RELATIONS.map(r => [r.id, r]));
  const links = L.filter(l => byId.has(l.s) && byId.has(l.t)).map(l => ({ ...l, source:byId.get(l.s), target:byId.get(l.t) }));
  const out = new Map(), inn = new Map(), adj = new Map(), push = (m, k, v) => (m.get(k) || m.set(k, []).get(k)).push(v);
  links.forEach(l => { push(out, l.s, l); push(inn, l.t, l); push(adj, l.s, l); push(adj, l.t, l); });
  M.RELATIONS.forEach(r => r.count = links.filter(l => l.r === r.id).length);
  return { nodes:N, links, byId, CLS, REL, out, inn, adj };
};
G.AK = { esc, cap, OM:M };
})(window);
