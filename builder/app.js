/*! Skydio Product Kit · app.js — tabs, Library, Ontology and the interactive Product Builder. */
(function (G) {
"use strict";
const K = G.SkydioUI, SC = G.SkydioScreens, SKY = G.SKY, esc = K.esc, $ = s => document.querySelector(s);
K.mount();

/* ======================= shell ======================= */
const views = ["library","ontology","builder"];
function show(v){
  if (!views.includes(v)) v = "builder";
  views.forEach(x => { $("#v-" + x).hidden = x !== v; const a = document.querySelector(`[data-tab="${x}"]`); a && (x === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")); });
  if (v === "ontology") mountOntology(); if (v === "builder") fit();
}
G.addEventListener("hashchange", () => show(location.hash.slice(1)));
const clock = () => { const d = new Date(), start = Date.UTC(d.getUTCFullYear(), 0, 0), day = Math.floor((d - start) / 864e5), p = n => String(n).padStart(2, "0");
  $("#clock").textContent = `Day ${day} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${String(d.getUTCMilliseconds()).padStart(3, "0")} UTC`; };
setInterval(clock, 87); clock();
$("#counts").innerHTML = `<span><b>${SKY.CATALOG ? new Set(SKY.CATALOG.map(c => c[1])).size : 0}</b> components</span><span><b>${SKY.REQ.length}</b> requirements</span><span><b>${SKY.CAPS.length - 1}</b> capabilities</span><span><b>${SKY.FLOWS.length}</b> flows</span><span><b>12</b> design checks</span>`;

/* ======================= Library ======================= */
let used = new Map();   // component name → number of builder screens using it
function renderLibrary(){
  const C = SKY.CATALOG, groups = [...new Set(C.map(c => c[0]))];
  const isUsed = name => [...used.keys()].some(k => k === name || k.startsWith(name + ".") || (name === "PatrolCard" && k === "OperationItem") || (name === "CaptureRail" && k === "Controller.video") || (name === "ToolRail" && k === "Controller.video"));
  const nUsed = name => Math.max(0, ...[...used.entries()].filter(([k]) => k === name || k.startsWith(name + ".")).map(([, n]) => n));
  const short = v => { const s = JSON.stringify(v); return s.length > 180 ? s.slice(0, 177) + "…" : s; };
  const P = SKY.PRINCIPLES.map(([c, n, d]) => `<div><b>${c}</b><h3>${esc(n)}</h3><p>${esc(d)}</p></div>`).join("");
  const TOK = [["--s-0","app ground"],["--s-2","card"],["--s-4","selected"],["--blue","own aircraft, go"],["--red","stop, live, hostile"],["--green","active, ready"],["--reticle","AI lock"],["--amber","operator focus"],["--purple","point of interest"],["--tak-hostile","2525 hostile"],["--tak-friend","2525 friend"],["--tak-unknown","2525 unknown"],["--tak-neutral","2525 neutral"]];
  const cs = getComputedStyle(document.documentElement);
  const body = groups.map(g => `<section class="blk"><header><span class="cap">Components</span><h2>${g}</h2></header><div class="grid ${g === "Map" || g === "Video" || g === "Controller" ? "g2" : "g3"}">${
    C.filter(c => c[0] === g).map(([, name, args, note, pr, stage = "", custom]) => {
      let html; try { html = custom ? custom() : K[name](...args); } catch (e) { html = `<span>${esc(e.message)}</span>`; }
      const box = stage.match(/box:(\S+)x(\d+)/) || [], cls = stage.split(" ").filter(x => x && !x.startsWith("box")).join(" ");
      const style = box[0] ? `style="width:${/%/.test(box[1]) ? box[1] : box[1] + "px"};height:${box[2]}px;margin:0 auto"` : "";
      const u = isUsed(name), n = nUsed(name);
      return `<article class="spec"><div class="sh"><div class="nm"><code>${esc(name)}</code></div><p>${esc(note)}</p><div class="used">${pr.map(p => `<span class="tag">${p}</span>`).join("")}${u ? `<span class="tag on">In your product${n ? ` · ${n} screen${n > 1 ? "s" : ""}` : ""}</span>` : `<span class="tag">Not in your product</span>`}</div><pre class="call">${esc(name)}(${esc(args.map(short).join(", "))})</pre></div><div class="lib-stage"><div class="sky ${cls}${box[0] ? " box" : ""}" ${style}>${html}</div></div></article>`;
    }).join("")}</div></section>`).join("");
  $("#v-library").innerHTML = `
  <section class="blk"><header><span class="cap">Skydio UI Kit · kit/skydio-ui.js</span><h2>One library, every surface</h2><p>The same components draw the desktop command view, the X10D handheld and what goes out to TAK. Each specimen below is rendered by calling the kit, and is tagged when the product you configured in the Builder uses it.</p></header></section>
  <section class="blk"><header><h2>Principles</h2><p>Twelve rules the components follow. The builder checks every screen in your product against them.</p></header><div class="princ">${P}</div></section>
  <section class="blk"><header><h2>Tokens</h2><p>Color is a signal. Blue is your aircraft and go, red is stop, live or hostile, amber is what you're focused on. The four MIL-STD-2525 fills belong to TAK symbols only.</p></header><div class="sw">${TOK.map(([v, m]) => `<div><i style="background:var(${v})"></i><span>${m}</span><code>${v} ${cs.getPropertyValue(v).trim()}</code></div>`).join("")}</div></section>
  ${body}`;
}

/* ======================= Ontology ======================= */
let omMounted = false, OMV = null;
function renderOntology(){
  const D = G.AK.OM.build(), reqs = D.nodes.filter(n => n.c === "Requirement"), stated = reqs.filter(n => n.status === "stated").length;
  const caps = SKY.CAPS.filter(c => !c.core).map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.doc)}</td><td>${SKY.REQ.filter(r => r.cap === c.id).map(r => `<button type="button" class="chip rq" data-req="${r.id}">${r.code}</button>`).join(" ")}</td></tr>`).join("");
  $("#v-ontology").innerHTML = `
  <section class="blk cs"><header><span class="cap">Skydio · Defense &amp; security · design study</span><h2>Product Ontology</h2>
    <p class="cs-lede">One model links who the products serve to what they must do and where each requirement shows up: a Skydio product, a builder screen, a design check and a stage of the operation. Capabilities are the switches the Product Builder flips; each one turns a set of requirements on.</p></header>
    <dl class="cs-meta"><div><dt>Scope</dt><dd>Flight Deck, DFR Command, ISR Command, docks, patrol planning, stream sharing</dd></div><div><dt>Sources</dt><dd>Public skydio.com pages and marketing screenshots</dd></div><div><dt>Status</dt><dd>Filled = stated publicly · hollow = my reading</dd></div></dl>
    <div class="pb-sum"><div><span class="cap">Requirements</span><b>${reqs.length}</b></div><div><span class="cap">Stated publicly</span><b>${stated}<small>/${reqs.length}</small></b></div><div><span class="cap">Open gaps</span><b>${SKY.GAPS.length}</b></div><div><span class="cap">Nodes · links</span><b>${D.nodes.length}<small> · ${D.links.length}</small></b></div></div>
    <div class="app-frame" id="omroot"></div>
  </section>
  <section class="blk cs"><header><span class="cap">Capabilities</span><h2>What the builder switches on</h2><p>Each capability turns on the requirements listed. Click a code to find it on the map.</p></header>
    <div class="matrix"><table class="ctab"><thead><tr><th>Capability</th><th>What it adds</th><th>Requirements</th></tr></thead><tbody>${caps}</tbody></table></div></section>
  <section class="blk cs"><header><span class="cap">Process</span><h2>From screenshots to a product</h2></header>
    <div class="princ"><div><b>01</b><h3>Inventory</h3><p>23 public screenshots broken into 40+ components and 12 principles.</p></div><div><b>02</b><h3>Model</h3><p>Users, needs and frustrations from the public pages; 18 requirements tied to products, screens, checks and evidence.</p></div><div><b>03</b><h3>Kit</h3><p>One component library and linter shared by the generator, the live simulation and this builder.</p></div><div><b>04</b><h3>Build</h3><p>Pick a mission, team and capabilities; get the IA, flows, screens, coverage and a spec.</p></div></div></section>
  <section class="blk cs"><header><span class="cap">Key decisions</span><h2>How the model is built</h2></header>
    <div class="princ"><div><b>A</b><h3>Capabilities, not features</h3><p>A capability is the smallest thing a team would buy or turn off. Requirements hang off capabilities, so coverage changes the moment you toggle one.</p></div><div><b>B</b><h3>Users gate requirements</h3><p>A requirement only counts if someone on the team needs it. Turning off the field operator removes glove-size controls even if handhelds stay on.</p></div><div><b>C</b><h3>Flows over screens</h3><p>Screens are states in a flow. The same Incident response screen appears four times, once per incident state.</p></div><div><b>D</b><h3>Gaps stay visible</h3><p>Five questions the public record can't answer are kept as nodes, so a configured product shows which ones it inherits.</p></div></div></section>
  <section class="blk"><header><span class="cap">Reference</span><h2>Ontology as JSON</h2></header><div class="exp"><button class="btnp" type="button" id="copyOnto">Copy JSON</button><span class="hint" id="copyOntoMsg"></span></div><pre class="json">${esc(JSON.stringify({ goal:SKY.GOAL.n, users:SKY.ROLES.map(r => r.name), needs:SKY.NEEDS, capabilities:SKY.CAPS.map(c => ({ id:c.id, name:c.name })), requirements:SKY.REQ.map(r => ({ code:r.code, name:r.name, capability:r.cap, users:r.users, needs:r.needs, screens:r.screens, checks:r.checks, status:r.status })), gaps:SKY.GAPS.map(g => g[0]) }, null, 2))}</pre></section>`;
}
function mountOntology(){
  if (omMounted || !G.d3) return; omMounted = true;
  OMV = G.AK.omap.mount($("#omroot"), { onGenerate: (screen, req) => {
    const r = req && SKY.REQ.find(x => x.id === req.id);
    if (r && r.cap !== "core" && !cfg.caps.has(r.cap)) SKY.toggleCap(cfg, r.cap, true);
    if (r) r.users.forEach(u => cfg.roles.add(u));
    rebuild(); const f = bp.flows.find(f => f.steps.some(s => s.screen === screen && (!r || s.reqs.includes(r.code)))) || bp.flows.find(f => f.steps.some(s => s.screen === screen));
    if (f){ cur = { flow:f.id, step:f.steps.findIndex(s => s.screen === screen && (!r || s.reqs.includes(r.code))) }; if (cur.step < 0) cur.step = 0; }
    location.hash = "builder"; setTimeout(() => { play(); $("#player").scrollIntoView({ block:"start" }); }, 60);
  } });
}
document.addEventListener("click", e => {
  const rq = e.target.closest("[data-req]"); if (rq){ const id = rq.dataset.req; if (location.hash !== "#ontology") location.hash = "ontology"; setTimeout(() => { mountOntology(); OMV && OMV.select && OMV.select(id); $("#omroot").scrollIntoView({ block:"start" }); }, 80); }
  if (e.target.id === "copyOnto") copy($(".json").textContent, "#copyOntoMsg");
});
function copy(text, msgSel){ const m = $(msgSel); try { navigator.clipboard.writeText(text).then(() => { m.textContent = "Copied"; }, () => { m.textContent = "Couldn't copy. Select the text instead."; }); } catch { m.textContent = "Couldn't copy. Select the text instead."; } }

/* ======================= Builder ======================= */
let cfg = (() => { try { const s = JSON.parse(localStorage.getItem("skb.cfg") || "null"); if (s && SKY.MISSIONS[s.mission]) return { ...s, roles:new Set(s.roles), caps:new Set(s.caps) }; } catch {} return SKY.configFor("border"); })();
let bp = null, cur = { flow:null, step:0 }, checks = null, notes = [];
const save = () => { try { localStorage.setItem("skb.cfg", JSON.stringify({ ...cfg, roles:[...cfg.roles], caps:[...cfg.caps] })); } catch {} };
const PRESET_PROMPTS = [
  ["Border, agents on handhelds","Border corridor overnight: two agents in the ops center and one on a handheld, GPS jammed near the wash, share tracks over TAK."],
  ["Base, night alarms","Base security at night: perimeter alarms launch docked drones, patrols on a schedule, a TFR over the flightline, commander watches on a phone."],
  ["Squad ISR","Tactical squad with X10D handhelds tracking vehicles at the treeline, publish hostiles to TAK, relief before battery runs out."],
  ["Warehouse, one guard","Distribution center with one operator at a desk answering gate alarms during the day."]
];
function renderBuilder(){
  $("#v-builder").innerHTML = `
  <div class="ws">
    <aside class="rail" aria-label="Configure the product">
      <div class="rsec"><span class="cap">Describe it</span>
        <textarea id="pbPrompt" rows="3" aria-label="Describe the product">${esc(PRESET_PROMPTS[0][1])}</textarea>
        <button class="btnp pri wide" id="pbBuild" type="button">Build from sentence</button>
        <div class="pp" id="pbPresets">${PRESET_PROMPTS.map((p, i) => `<button type="button" data-pp="${i}">${esc(p[0])}</button>`).join("")}</div></div>
      <div id="pbCfg"></div>
    </aside>
    <div class="wsmain">
      <header class="phead" id="pbHead"></header>
      <div class="meters" id="pbSum"></div>
      <div class="warns" id="pbWarn"></div>
      <section class="runner" aria-label="User flows">
        <div class="ftabs" id="pbTabs" role="tablist"></div>
        <ol class="stepper" id="pbFlows"></ol>
        <div class="player" id="player">
          <div class="cap-step" id="pbCap"></div>
          <div class="stagewrap" id="stage"><div class="inner sky" id="frame"></div></div>
          <div class="nav2"><button class="btnp" id="prev" type="button">← Back</button><span class="hint" id="pbHint"></span><button class="btnp pri" id="next" type="button">Next step →</button></div>
        </div>
      </section>
      <div class="pb-out">
        <div class="card2"><span class="cap">Information architecture</span><div class="ia" id="pbIA"></div></div>
        <div class="card2"><span class="cap">Needs</span><div class="needs" id="pbNeeds"></div></div>
        <div class="card2 wide2"><span class="cap">Requirements</span><ul class="rq-list" id="pbReqs"></ul></div>
        <div class="card2 wide2"><span class="cap">Design checks by screen</span><div class="cm" id="pbChecks"><p class="hint">Running checks…</p></div></div>
        <div class="card2 wide2"><span class="cap">Open questions this product inherits</span><div class="gaps" id="pbGaps"></div></div>
      </div>
      <div class="exp"><button class="btnp pri" type="button" id="expMD">Copy product spec</button><button class="btnp" type="button" id="expJSON">Copy as JSON</button><a class="btnp" href="https://claude.ai/artifact/X1NuA7R8ZepS2nANNVBaAL">Run it in Live Ops ↗</a><span class="hint" id="expMsg"></span><span class="hint" id="pbNotes"></span></div>
    </div>
  </div><div id="offscreen" class="sky" aria-hidden="true"></div>`;
}
function renderCfg(){
  const M = SKY.MISSIONS;
  const seg = (k, opts) => `<span class="segm" role="group">${opts.map(([v, t]) => `<button type="button" data-cfg="${k}" data-v="${v}" aria-pressed="${cfg[k] === v}">${t}</button>`).join("")}</span>`;
  $("#pbCfg").innerHTML = `
    <div class="rsec"><span class="cap">Mission</span><div class="radios">${Object.entries(M).map(([id, m]) => `<button type="button" class="rad" data-mission="${id}" aria-pressed="${cfg.mission === id}"><b>${esc(m.name)}</b><small>${esc(m.blurb)}</small></button>`).join("")}</div></div>
    <div class="rsec"><span class="cap">Team</span><div class="pills">${SKY.ROLES.map(r => `<button type="button" class="pill" data-role="${r.id}" aria-pressed="${cfg.roles.has(r.id)}" title="${esc(r.needs)}">${esc(r.name)}</button>`).join("")}</div></div>
    <div class="rsec"><span class="cap">Capabilities <em>${cfg.caps.size} on</em></span><div class="switches">${SKY.CAPS.filter(c => !c.core).map(c => `<button type="button" class="swr" role="switch" data-cap="${c.id}" aria-checked="${cfg.caps.has(c.id)}" title="${esc(c.doc)}"><span><b>${esc(c.name)}</b><small>${esc(c.doc)}</small></span><i aria-hidden="true"></i></button>`).join("")}</div></div>
    <div class="rsec"><span class="cap">Conditions</span>
      <div class="fld2"><span>Time</span>${seg("time", [["day","Day"],["night","Night"]])}</div>
      <div class="fld2"><span>Comms</span>${seg("comms", [["connected","Connected"],["degraded","Degraded"]])}</div>
      <div class="fld2"><span>Map</span>${seg("basemap", K.BASEMAPS.map(b => [b, K.BASEMAP_LABEL[b]]))}</div></div>`;
}
function renderSummary(){
  const M = SKY.MISSIONS[cfg.mission], steps = bp.flows.reduce((n, f) => n + f.steps.length, 0);
  $("#pbHead").innerHTML = `<span class="cap">${esc(M.name)} · ${esc(M.site)}</span><input class="pname" id="pbName" value="${esc(cfg.name)}" maxlength="40" aria-label="Product name"><p>${esc(M.blurb)}</p><div class="surf">${["desktop","handheld","tak"].map(s => `<span class="${bp.surfaces.includes(s) ? "on" : ""}">${s === "tak" ? "TAK network" : s === "handheld" ? "X10D handheld" : "Desktop command"}</span>`).join("")}</div>`;
  $("#pbSum").innerHTML = `
    <div class="meter big"><span class="cap">Need coverage</span><b>${bp.coverage}<small>%</small></b><span class="bar"><i style="width:${bp.coverage}%"></i></span><small>${bp.needs.filter(n => n.met.length).length} of ${bp.needs.length} team needs met</small></div>
    <div class="meter"><span class="cap">Requirements</span><b>${bp.inReq.length}<small>/${SKY.REQ.length}</small></b><small>in this product</small></div>
    <div class="meter"><span class="cap">Flows</span><b>${bp.flows.length}</b><small>${steps} steps · ${bp.screens.length} screens</small></div>
    <div class="meter"><span class="cap">Design checks</span><b id="sumChecks">…</b><small>across every step</small></div>`;
  $("#pbWarn").innerHTML = bp.warnings.map(w => `<p>${esc(w)}</p>`).join("");
  $("#pbNotes").textContent = notes.join(" ");
}
function renderFlows(){
  if (!bp.flows.length){ $("#pbTabs").innerHTML = ""; $("#pbFlows").innerHTML = `<li class="empty">No flows yet. Turn on Sensor-triggered response, Scheduled patrols or Subject tracking.</li>`; return; }
  const f = bp.flows.find(x => x.id === cur.flow) || bp.flows[0];
  $("#pbTabs").innerHTML = bp.flows.map(x => `<button type="button" role="tab" data-flow="${x.id}" data-step="0" aria-selected="${x.id === f.id}"><span>${esc(x.name)}</span><small>${x.surface === "handheld" ? "Handheld" : "Desktop"} · ${x.steps.length} steps</small></button>`).join("");
  $("#pbFlows").innerHTML = f.steps.map((s, i) => `<li class="${i < cur.step ? "done" : i === cur.step ? "now" : ""}"><button type="button" data-flow="${f.id}" data-step="${i}" ${i === cur.step ? 'aria-current="step"' : ""} title="${esc(s.title)}"><i>${i + 1}</i><span>${esc(s.title)}</span></button></li>`).join("");
}
function renderOut(){
  $("#pbIA").innerHTML = Object.entries(bp.ia).map(([s, items]) => `<div><span class="sname">${s === "tak" ? "TAK network" : s === "handheld" ? "Handheld" : "Desktop"}</span><ul>${items.map(i => `<li>${esc(i.name)}</li>`).join("")}</ul></div>`).join("") || `<p class="hint">Add someone to the team to get a surface.</p>`;
  $("#pbNeeds").innerHTML = bp.needs.map(n => `<div class="${n.met.length ? "ok" : "un"}"><i></i><span>${esc(n.name)}</span>${n.met.length ? `<code>${n.met.join(" ")}</code>` : n.suggest.map(c => `<button type="button" class="linkbtn" data-addcap="${c}">Turn on ${esc(SKY.capName(c))}</button>`).join(" ")}</div>`).join("");
  $("#pbReqs").innerHTML = bp.reqs.map(r => `<li class="${r.state}"><i></i><code>${r.code}</code><span>${esc(r.name)}</span><small>${r.state === "in" ? "In" : r.state === "off" ? esc(SKY.capName(r.cap)) + " off" : "No one on the team needs it"}</small></li>`).join("");
  $("#pbGaps").innerHTML = bp.gaps.map(g => `<p><b>${g.code}</b><span>${esc(g.name)}</span></p>`).join("") || `<p class="hint">None.</p>`;
}

/* ---------- player ---------- */
function fit(){ const st = $("#stage"), fr = $("#frame"); if (!st || !fr) return; const H = fr.dataset.h ? +fr.dataset.h : 760; const s = Math.min(1, st.clientWidth / 1280); fr.style.transform = `scale(${s})`; fr.style.height = H + "px"; st.style.height = (H * s) + "px"; fr.__scale = s; }
function curFlowStep(){ const f = bp.flows.find(x => x.id === cur.flow) || bp.flows[0]; if (!f) return [null, null]; if (cur.flow !== f.id){ cur = { flow:f.id, step:0 }; } cur.step = Math.min(cur.step, f.steps.length - 1); return [f, f.steps[cur.step]]; }
function findHot(fr, hot){
  if (!hot) return null;
  if (hot.sel) return fr.querySelector(hot.sel);
  const els = [...fr.querySelectorAll(`[data-comp="${hot.comp}"]`)]; if (!els.length) return null;
  if (hot.text){ for (const el of els){ const b = [...el.querySelectorAll(".btn")].find(x => x.textContent.trim().startsWith(hot.text) && !x.classList.contains("off")); if (b) return b; } }
  return els[0];
}
function play(){
  const [f, s] = curFlowStep(); const fr = $("#frame");
  if (!f){ fr.innerHTML = ""; $("#pbCap").innerHTML = ""; return; }
  const spec = SKY.scene(bp, f, s); fr.dataset.h = spec.surface === "controller" ? 720 : 760;
  fr.innerHTML = SC.render(spec); fit();
  const hot = findHot(fr, s.hot); hot && hot.classList.add("hot");
  const last = cur.step === f.steps.length - 1, fi = bp.flows.indexOf(f);
  $("#pbCap").innerHTML = `<span class="who">${esc(s.actor === "ops" || s.actor === "field" || s.actor === "pm" || s.actor === "cmd" ? SKY.roleName(s.actor) : s.actor)}</span><span class="cap">Step ${cur.step + 1} of ${f.steps.length} · ${esc(SKY.SCREENS[s.screen].name)}</span><h3>${esc(s.title)}</h3><p>${esc(SKY.text(s.action, cfg))}</p><div class="chips">${s.trans.map(t => `<span class="chip tr">${esc(t)}</span>`).join("")}${s.reqs.map(c => { const r = SKY.REQ.find(x => x.code === c); return `<button type="button" class="chip rq" data-req="${r.id}" title="${esc(r.name)}">${c}</button>`; }).join("")}</div>`;
  $("#pbHint").textContent = hot ? "Click the highlighted control to continue" : last ? "End of flow" : "";
  $("#prev").disabled = cur.step === 0 && fi === 0;
  $("#next").textContent = last ? (bp.flows[fi + 1] ? `Next flow: ${bp.flows[fi + 1].name} →` : "Restart →") : "Next step →";
  renderFlows();
}
function step(d){
  const [f] = curFlowStep(); if (!f) return; const fi = bp.flows.indexOf(f);
  let i = cur.step + d;
  if (i >= f.steps.length){ const nf = bp.flows[fi + 1] || bp.flows[0]; cur = { flow:nf.id, step:0 }; }
  else if (i < 0){ const pf = bp.flows[fi - 1]; if (pf) cur = { flow:pf.id, step:pf.steps.length - 1 }; }
  else cur.step = i;
  play();
}

/* ---------- checks across every step ---------- */
let checkTimer = null;
function runChecks(){
  clearTimeout(checkTimer); $("#pbChecks").innerHTML = `<p class="hint">Running checks…</p>`; $("#sumChecks") && ($("#sumChecks").textContent = "…");
  checkTimer = setTimeout(() => {
    const off = $("#offscreen"), per = new Map(); let pass = 0, fail = 0, warn = 0, total = 0; used = new Map();
    bp.flows.forEach(f => f.steps.forEach(s => {
      const spec = SKY.scene(bp, f, s); off.style.height = (spec.surface === "controller" ? 720 : 760) + "px"; off.innerHTML = SC.render(spec);
      const comps = new Set([...off.querySelectorAll("[data-comp]")].map(e => e.dataset.comp)); comps.forEach(c => used.set(c, (used.get(c) || 0) + 1));
      const res = K.lint(off, { surface:spec.surface, focus:spec.focus, aircraft:spec.aircraft, scale:1 });
      const key = SKY.SCREENS[s.screen].name + (f.moved ? " (desktop)" : ""); const row = per.get(key) || {};
      res.forEach(r => { const rank = { fail:3, warn:2, pass:1, na:0 }; if (!row[r.id] || rank[r.verdict] > rank[row[r.id]]) row[r.id] = r.verdict; if (r.verdict !== "na"){ total++; if (r.verdict === "pass") pass++; else if (r.verdict === "fail") fail++; else warn++; } });
      per.set(key, row);
    }));
    off.innerHTML = "";
    checks = { pass, fail, warn, total };
    const ids = K.PRINCIPLES.map(p => p[0]);
    $("#pbChecks").innerHTML = per.size ? `<table><thead><tr><th>Screen</th>${ids.map(i => `<th title="${esc(K.PRINCIPLES.find(p => p[0] === i)[1])}">${i.slice(1)}</th>`).join("")}</tr></thead><tbody>${[...per.entries()].map(([k, row]) => `<tr><td>${esc(k)}</td>${ids.map(i => `<td><i class="${row[i] || "na"}" title="${i}: ${row[i] || "n/a"}"></i></td>`).join("")}</tr>`).join("")}</tbody></table><p class="hint">${pass}/${total} checks pass across ${bp.flows.reduce((n, f) => n + f.steps.length, 0)} flow steps${warn ? ` · ${warn} warnings (unclaimed incidents)` : ""}${fail ? ` · ${fail} fail` : ""}. Hollow = doesn't apply.</p>` : `<p class="hint">No screens yet.</p>`;
    $("#sumChecks").innerHTML = `${pass}<small>/${total}</small>`; const pc = document.querySelector(".meter #sumChecks"); if (pc) pc.parentElement.classList.toggle("bad", fail > 0);
    renderLibrary();
  }, 30);
}

/* ---------- rebuild ---------- */
function rebuild(keepNotes){
  if (!keepNotes) notes = [];
  bp = SKY.derive(cfg); save();
  renderCfg(); renderSummary(); renderFlows(); renderOut(); play(); runChecks();
}
document.addEventListener("click", e => {
  const t = e.target;
  const m = t.closest("[data-mission]"); if (m){ const keepName = cfg.name; cfg = SKY.configFor(m.dataset.mission); if (!/ product$/.test(keepName)) cfg.name = keepName; notes = [`Loaded the ${SKY.MISSIONS[cfg.mission].name} preset.`]; rebuild(true); return; }
  const r = t.closest("[data-role]"); if (r){ const id = r.dataset.role; cfg.roles.has(id) ? cfg.roles.delete(id) : cfg.roles.add(id); rebuild(); return; }
  const c = t.closest("[data-cap]"); if (c){ notes = SKY.toggleCap(cfg, c.dataset.cap, !cfg.caps.has(c.dataset.cap)); rebuild(true); return; }
  const a = t.closest("[data-addcap]"); if (a){ notes = SKY.toggleCap(cfg, a.dataset.addcap, true); notes.unshift(`Turned on ${SKY.capName(a.dataset.addcap)}.`); rebuild(true); return; }
  const g = t.closest("[data-cfg]"); if (g){ cfg[g.dataset.cfg] = g.dataset.v; rebuild(); return; }
  const fl = t.closest("[data-flow]"); if (fl){ cur = { flow:fl.dataset.flow, step:+fl.dataset.step }; play(); return; }
  const pp = t.closest("[data-pp]"); if (pp){ $("#pbPrompt").value = PRESET_PROMPTS[+pp.dataset.pp][1]; buildFromSentence(); return; }
  if (t.closest(".hot")){ e.preventDefault(); step(1); return; }
  if (t.id === "next") step(1); else if (t.id === "prev") step(-1);
  else if (t.id === "pbBuild") buildFromSentence();
  else if (t.id === "expMD") copy(SKY.exportMD(bp, checks), "#expMsg");
  else if (t.id === "expJSON") copy(JSON.stringify(SKY.exportJSON(bp, checks), null, 2), "#expMsg");
});
document.addEventListener("input", e => { if (e.target.id === "pbName"){ cfg.name = e.target.value || "Untitled product"; save(); } });
document.addEventListener("keydown", e => { if (e.target.id === "pbPrompt" && (e.metaKey || e.ctrlKey) && e.key === "Enter") buildFromSentence(); });
function buildFromSentence(){ const r = SKY.resolve($("#pbPrompt").value); cfg = r.cfg; notes = r.notes; cur = { flow:null, step:0 }; rebuild(true); }
G.addEventListener("resize", fit); if (G.ResizeObserver) G.addEventListener("load", () => new ResizeObserver(fit).observe($("#stage")));

/* ======================= boot ======================= */
renderLibrary(); renderOntology(); renderBuilder(); rebuild();
show(location.hash.slice(1) || "builder");
G.__skb = { get cfg(){ return cfg; }, get bp(){ return bp; }, get checks(){ return checks; }, step, play };
})(window);
