/*! Skydio Product Kit · map.js (shared with the Autonomy Console Kit; data comes from builder/onto.js)
   Skydio Requirements Map: the ontology in four views.
   3D: the graph layout becomes the floor plan and height is the layer, goal on top.
   Graph: force layout anchored by layer. Trace: columns from goal to lifecycle. Matrix: screens and products × requirements.
   Hover or select any node to light its whole chain, from the goal down to where it is delivered.
   Needs d3 (v7) for the force layout and the 2D zoom. 3D is drawn on a plain canvas. */
(function (G) {
"use strict";
const AK = G.AK, esc = AK.esc;
const OMAP = AK.omap = {};
const RM = G.matchMedia && G.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SYM = { circle: "symbolCircle", diamond: "symbolDiamond", triangle: "symbolTriangle", square: "symbolSquare", cross: "symbolCross", wye: "symbolWye", star: "symbolStar" };

OMAP.mount = (root, opts = {}) => {
  const d3 = G.d3, D = AK.OM.build(), { nodes, links, byId, CLS, REL, out, inn, adj } = D;
  const $ = s => root.querySelector(s);
  const symPath = (n, scale = 1) => { const c = CLS.get(n.c), r = (n.primary ? 11 : c.r) * scale; return d3.symbol(d3[SYM[c.sym]], Math.PI * r * r * (c.sym === "wye" || c.sym === "cross" || c.sym === "star" ? .9 : 1.1))(); };
  const rank = n => CLS.get(n.c).rank, col = n => CLS.get(n.c).col, hollow = n => n.status === "modeled";
  const label = n => n.code ? `${n.code} ${n.n}` : n.n, big = n => n.c === "Goal" || n.c === "User" || n.c === "Stage";
  const relOn = new Map(M_REL().map(r => [r.id, true]));
  function M_REL() { return AK.OM.RELATIONS; }
  let view = "3d", selected = null, hover = null, focusClass = null;

  root.innerHTML = `<div class="om">
    <header class="omh"><div class="brand"><h3>Skydio Requirements Map</h3><span class="cap" id="omCounts"></span></div>
      <div class="ctl"><span class="cap">View</span><div class="seg" role="group" aria-label="View">${["3d","graph","trace","matrix"].map(v => `<button type="button" data-omv="${v}" aria-pressed="${v === view}">${v === "3d" ? "3D" : AK.cap(v)}</button>`).join("")}</div></div>
      <div class="search"><input id="omq" list="omnames" placeholder="Find a user, need, requirement…" autocomplete="off" aria-label="Find a node"><datalist id="omnames"></datalist></div></header>
    <div class="ommain"><div class="omstage" id="omstage">
      <svg id="omg" aria-label="Requirements graph: goal, users, needs, frustrations, requirements and where each is delivered" hidden></svg>
      <canvas id="om3" aria-label="3D requirements map. The side panel gives a text view of every node."></canvas>
      <div class="ommatrix" id="ommatrix" hidden></div>
      <div class="omhud"><button type="button" data-omh="fit">Fit</button><button type="button" data-omh="clear">Clear</button></div>
      <div class="omrels" id="omrels"></div><div class="omtip" id="omtip" hidden></div></div>
      <aside class="ompanel" id="ompanel" aria-live="polite"></aside></div></div>`;
  $("#omCounts").textContent = `${nodes.length} nodes · ${links.length} relations · from public pages + my modeling`;
  $("#omnames").innerHTML = nodes.map(n => `<option value="${esc(label(n))}">${esc(CLS.get(n.c).label)}</option>`).join("");

  /* ---------- chain: everything upstream and downstream of a node ---------- */
  const chainOf = id => {
    const ns = new Set([id]), ls = new Set(), start = byId.get(id);
    const walk = dir => { let fr = [start]; while (fr.length) { const nx = []; fr.forEach(n => (adj.get(n.id) || []).forEach(l => { if (!relOn.get(l.r)) return; const o = l.source === n ? l.target : l.source; const ok = dir < 0 ? rank(o) < rank(n) : rank(o) > rank(n); if (ok || (n === start && o.c !== n.c && rank(o) === rank(n))) { ls.add(l); if (!ns.has(o.id)) { ns.add(o.id); if (ok) nx.push(o); } } })); fr = nx; } };
    walk(-1); walk(1); return { ns, ls };
  };

  /* ---------- layout 1: force graph, anchored by layer ---------- */
  const LX = [0, 220, 450, 700, 960, 1180];
  nodes.forEach((n, i) => { n.ax = LX[rank(n)]; n.ay = 0; n.x = n.ax + (i % 7) * 3; n.y = ((i * 37) % 300) - 150; });
  const DIST = { serves: 120, needs: 90, experiences: 90, realizedBy: 110, addresses: 110, pertainsTo: 200, deliveredBy: 120, presentedIn: 120, checkedBy: 130, evidencedBy: 120, gapToday: 90, inStage: 160, precedes: 50 };
  const sim = d3.forceSimulation(nodes).force("link", d3.forceLink(links).id(d => d.id).distance(l => DIST[l.r] || 100).strength(l => l.r === "pertainsTo" || l.r === "inStage" ? .05 : .3))
    .force("charge", d3.forceManyBody().strength(-130).distanceMax(420)).force("collide", d3.forceCollide(d => CLS.get(d.c).r + 7))
    .force("x", d3.forceX(d => d.ax).strength(.35)).force("y", d3.forceY(0).strength(.04)).stop();
  for (let i = 0; i < 420; i++) sim.tick();
  nodes.forEach(n => { n.gx = n.x; n.gy = n.y; });
  // 3D floor plan: the same links without the layer anchor, so each layer spreads over the same footprint
  const fl = nodes.map(n => ({ id: n.id, x: n.gy * .6 + (Math.random() - .5) * 40, y: (n.gx - 590) * .25 }));
  const fsim = d3.forceSimulation(fl).force("link", d3.forceLink(links.map(l => ({ source: l.s, target: l.t, r: l.r }))).id(d => d.id).distance(90).strength(l => l.r === "pertainsTo" || l.r === "inStage" ? .04 : .25))
    .force("charge", d3.forceManyBody().strength(-90).distanceMax(380)).force("x", d3.forceX(0).strength(.06)).force("y", d3.forceY(0).strength(.06)).stop();
  for (let i = 0; i < 380; i++) fsim.tick();
  fl.forEach((f, i) => { nodes[i].fx3 = f.x; nodes[i].fz3 = f.y; });

  /* ---------- layout 2: trace columns ---------- */
  const COLS = [
    { x: 0, head: "Goal", has: ["Goal"] }, { x: 190, head: "Users", has: ["User"] }, { x: 400, head: "Needs · frustrations", has: ["Need", "Frustration"] },
    { x: 690, head: "Requirements", has: ["Requirement"] }, { x: 1010, head: "Products · screens", has: ["Product", "Screen"] },
    { x: 1280, head: "Checks · evidence · gaps", has: ["Principle", "Evidence", "Gap"] }, { x: 1530, head: "Lifecycle", has: ["Stage"] }
  ];
  (() => {
    const reqs = nodes.filter(n => n.c === "Requirement"), ri = new Map(reqs.map((n, i) => [n.id, i]));
    const bary = n => { const xs = (adj.get(n.id) || []).map(l => ri.get(l.s === n.id ? l.t : l.s)).filter(v => v != null); return xs.length ? d3.mean(xs) : (n.c === "User" ? d3.mean((out.get(n.id) || []).flatMap(l => (out.get(l.t) || []).map(m => ri.get(m.t)).filter(v => v != null))) ?? 99 : 99); };
    COLS.forEach(C => {
      const groups = C.has.map(c => { const l = nodes.filter(n => n.c === c); if (c !== "Requirement" && c !== "Stage") l.sort((a, b) => bary(a) - bary(b)); return l; });
      const gap = C.has.includes("Requirement") ? 30 : C.head === "Users" ? 46 : C.head === "Lifecycle" ? 60 : 22;
      const total = groups.reduce((a, g) => a + g.length, 0), h = (total - 1) * gap + (groups.length - 1) * 22;
      let y = -h / 2; groups.forEach(g => { g.forEach(n => { n.tx = C.x; n.ty = y; y += gap; }); y += 22 - gap + gap; });
    });
  })();

  /* ---------- 2D: SVG ---------- */
  const svg = d3.select($("#omg")), gRoot = svg.append("g"), gLinks = gRoot.append("g"), gHeads = gRoot.append("g"), gNodes = gRoot.append("g");
  const linkSel = gLinks.selectAll("path").data(links).join("path").attr("class", "lk").attr("stroke", l => REL.get(l.r).col).attr("fill", "none");
  const nodeSel = gNodes.selectAll("g").data(nodes).join("g").attr("class", n => "nd" + (big(n) ? " big" : ""));
  nodeSel.append("path").attr("class", "ring").attr("d", n => symPath(n, 1.75)).attr("fill", "none").attr("stroke", "#fefffe").attr("stroke-width", 1.4).attr("opacity", 0);
  nodeSel.append("path").attr("d", n => symPath(n)).attr("fill", n => hollow(n) ? "#070709" : col(n)).attr("stroke", col).attr("stroke-width", n => hollow(n) ? 1.5 : 0);
  nodeSel.append("text").attr("x", n => (n.primary ? 11 : CLS.get(n.c).r) + 6).attr("y", 3.5).text(n => { const s = label(n); return s.length > 40 ? s.slice(0, 39) + "…" : s; });
  const headSel = gHeads.selectAll("text").data(COLS).join("text").attr("class", "colh").text(d => d.head.toUpperCase());
  const px = n => view === "trace" ? n.tx : n.gx, py = n => view === "trace" ? n.ty : n.gy;
  const linkPath = l => { const x1 = px(l.source), y1 = py(l.source), x2 = px(l.target), y2 = py(l.target); if (view === "trace" && Math.abs(x2 - x1) > 4) { const mx = (x1 + x2) / 2; return `M${x1},${y1}C${mx},${y1} ${mx},${y2} ${x2},${y2}`; } const dr = Math.hypot(x2 - x1, y2 - y1) * (view === "trace" ? .7 : 1.6); return `M${x1},${y1}A${dr},${dr} 0 0,1 ${x2},${y2}`; };
  const place = () => { linkSel.attr("d", linkPath); nodeSel.attr("transform", n => `translate(${px(n)},${py(n)})`); const top = d3.min(nodes, n => n.ty); headSel.attr("display", view === "trace" ? null : "none").attr("x", d => d.x - 6).attr("y", top - 34); };
  const zoom = d3.zoom().scaleExtent([.2, 4]).on("zoom", e => gRoot.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null);
  const fit2d = (anim = true) => { const st = $("#omstage").getBoundingClientRect(); const xs = nodes.map(px), ys = nodes.map(py); const x0 = d3.min(xs) - 40, x1 = d3.max(xs) + 260, y0 = d3.min(ys) - 60, y1 = d3.max(ys) + 60; const w = st.width, h = st.height - 44; if (w < 50 || h < 50) return; const k = Math.min(w / (x1 - x0), h / (y1 - y0), 1.6); const t = d3.zoomIdentity.translate(w / 2 - k * (x0 + x1) / 2, h / 2 - k * (y0 + y1) / 2).scale(k); (anim && !RM ? svg.transition().duration(450) : svg).call(zoom.transform, t); };

  /* ---------- 3D: canvas, floor plan = graph layout, height = layer ---------- */
  const cv = $("#om3"), ctx = cv.getContext("2d");
  const cam = { yaw: -.55, pitch: .42, dist: 1650, spin: !RM };
  let W = 0, H = 0, dpr = 1;
  const cx0 = d3.mean(nodes, n => n.fx3), cy0 = d3.mean(nodes, n => n.fz3), LAYER = 130;
  const STRATA = ["Goal", "Users", "Needs · frustrations", "Requirements", "Delivered by · checked by · evidence · gaps", "Lifecycle"];
  const resize = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, G.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr); };
  const proj3 = (x, y, z) => { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch); const x1 = x * cy - z * sy, z1 = x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; const zz = z2 + cam.dist, s = Math.min(W, H) * 1.5 / Math.max(80, zz); return [W / 2 + x1 * s, H / 2 + 10 + y2 * s, zz, s]; };
  const world = n => [(n.fx3 - cx0) * 1.1, (rank(n) - 2.5) * LAYER, (n.fz3 - cy0) * 1.1];
  let proj = [];
  const draw3 = () => {
    if (view !== "3d") return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const pivot = hover?.id || selected, ch = pivot ? chainOf(pivot) : null;
    nodes.forEach(n => { const [x, y, z] = world(n), p = proj3(x, y, z); n.sx = p[0]; n.sy = p[1]; n.sz = p[2]; n.ss = p[3]; });
    // strata planes
    for (let r = 0; r <= 5; r++) {
      const ms = nodes.filter(n => rank(n) === r); if (!ms.length) continue;
      const xs = ms.map(n => world(n)[0]), zs = ms.map(n => world(n)[2]), y = (r - 2.5) * LAYER, pad = 30;
      const a = [d3.min(xs) - pad, d3.max(xs) + pad], b = [d3.min(zs) - pad, d3.max(zs) + pad];
      const cs = [[a[0], b[0]], [a[1], b[0]], [a[1], b[1]], [a[0], b[1]]].map(([x, z]) => proj3(x, y, z));
      ctx.beginPath(); cs.forEach((c, i) => i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1])); ctx.closePath();
      ctx.fillStyle = "rgba(194,201,214,.025)"; ctx.fill(); ctx.strokeStyle = "rgba(194,201,214,.10)"; ctx.lineWidth = 1; ctx.stroke();
      const lc = cs.reduce((m, c) => c[0] < m[0] ? c : m, cs[0]);
      ctx.font = "400 10px 'IBM Plex Mono', ui-monospace, monospace"; ctx.fillStyle = "rgba(131,143,165,.9)"; ctx.textAlign = "right"; ctx.fillText(STRATA[r].toUpperCase(), lc[0] - 10, lc[1] + 3); ctx.textAlign = "left";
    }
    // links
    links.forEach(l => {
      if (!relOn.get(l.r)) return; const hot = ch && ch.ls.has(l); if (ch && !hot) return;
      const fc = focusClass && !(l.source.c === focusClass || l.target.c === focusClass);
      ctx.beginPath(); ctx.moveTo(l.source.sx, l.source.sy); ctx.lineTo(l.target.sx, l.target.sy);
      ctx.strokeStyle = REL.get(l.r).col; ctx.globalAlpha = hot ? .9 : fc ? .03 : .2; ctx.lineWidth = hot ? 1.4 : .8; ctx.stroke(); ctx.globalAlpha = 1;
    });
    // nodes
    proj = [...nodes].sort((a, b) => b.sz - a.sz);
    proj.forEach(n => {
      const dim = (ch && !ch.ns.has(n.id)) || (!ch && focusClass && n.c !== focusClass), s = Math.max(.45, Math.min(1.6, n.ss * 1.6));
      ctx.globalAlpha = dim ? .1 : 1;
      ctx.save(); ctx.translate(n.sx, n.sy); ctx.scale(s, s);
      const p = new Path2D(symPath(n)); if (hollow(n)) { ctx.fillStyle = "#070709"; ctx.fill(p); ctx.strokeStyle = col(n); ctx.lineWidth = 1.5 / s; ctx.stroke(p); } else { ctx.fillStyle = col(n); ctx.fill(p); }
      if (n.id === selected) { ctx.strokeStyle = "#fefffe"; ctx.lineWidth = 1.4 / s; ctx.stroke(new Path2D(symPath(n, 1.75))); }
      ctx.restore();
      const show = !dim && (big(n) || n.id === hover?.id || (ch && ch.ns.has(n.id)));
      if (show) { const s2 = label(n); ctx.font = big(n) ? "400 11px 'IBM Plex Mono', ui-monospace, monospace" : "10.5px 'IBM Plex Mono', ui-monospace, monospace"; ctx.fillStyle = big(n) ? "#ffffff" : "#c2c9d6"; ctx.strokeStyle = "rgba(7,7,9,.9)"; ctx.lineWidth = 3; ctx.lineJoin = "round"; const t = (big(n) ? s2.toUpperCase() : s2); const tt = t.length > 44 ? t.slice(0, 43) + "…" : t; ctx.strokeText(tt, n.sx + 10 * s, n.sy + 3.5); ctx.fillText(tt, n.sx + 10 * s, n.sy + 3.5); }
      ctx.globalAlpha = 1;
    });
  };
  const pick3 = (x, y) => { for (let i = proj.length - 1; i >= 0; i--) { const n = proj[i], r = (n.primary ? 11 : CLS.get(n.c).r) * Math.max(.45, Math.min(1.6, n.ss * 1.6)) + 4; if (Math.hypot(n.sx - x, n.sy - y) < r) return n; } return null; };
  let drag = null, moved = 0; const pts = new Map(); let pinch = null;
  cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY }; moved = 0; cam.spin = false; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), dist: cam.dist }; } });
  cv.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(); if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; cam.dist = Math.max(500, Math.min(3200, pinch.dist * pinch.d / Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1])))); moved = 99; return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); cam.yaw += dx * .006; cam.pitch = Math.max(-.2, Math.min(1.45, cam.pitch + dy * .005)); drag = { x: e.clientX, y: e.clientY }; return; }
    const h = pick3(e.clientX - r.left, e.clientY - r.top); setHover(h, e);
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!drag) return; const r = cv.getBoundingClientRect(); if (moved < 5) { const n = pick3(e.clientX - r.left, e.clientY - r.top); select(n && n.id !== selected ? n.id : null); } drag = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", e => { pts.delete(e.pointerId); drag = null; pinch = null; });
  cv.addEventListener("pointerleave", () => setHover(null));
  cv.addEventListener("wheel", e => { e.preventDefault(); cam.dist = Math.max(500, Math.min(3200, cam.dist * (1 + e.deltaY * .0012))); }, { passive: false });
  let raf; const loop = () => { if (view === "3d") { if (cam.spin) cam.yaw += .0012; draw3(); } raf = G.requestAnimationFrame(loop); };

  /* ---------- hover + tooltip ---------- */
  const tip = $("#omtip");
  function setHover(n, e) {
    if (n === hover) { if (n && e) moveTip(e); return; } hover = n; restyle();
    if (n && e) { tip.innerHTML = `<b>${esc(label(n))}</b>${esc(CLS.get(n.c).label)}${n.status ? " · " + n.status : ""}`; tip.hidden = false; moveTip(e); } else tip.hidden = true;
    (view === "3d" ? cv : $("#omg")).style.cursor = n ? "pointer" : "";
  }
  function moveTip(e) { const r = $("#omstage").getBoundingClientRect(); let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14; if (x + 280 > r.width) x = e.clientX - r.left - 290; tip.style.left = x + "px"; tip.style.top = y + "px"; }
  nodeSel.on("pointerenter", (e, n) => setHover(n, e)).on("pointermove", (e, n) => moveTip(e)).on("pointerleave", () => setHover(null)).on("click", (e, n) => { e.stopPropagation(); select(n.id === selected ? null : n.id); });
  svg.on("click", () => select(null));
  // drag a node to rearrange the 2D layouts; positions are kept per view
  nodeSel.call(d3.drag().on("start", e => e.sourceEvent.stopPropagation()).on("drag", (e, n) => { if (view === "trace") { n.tx = e.x; n.ty = e.y; } else { n.gx = e.x; n.gy = e.y; } place(); }));

  /* ---------- restyle + panel ---------- */
  function restyle() {
    const pivot = hover?.id || selected, ch = pivot ? chainOf(pivot) : null, inF = n => !focusClass || n.c === focusClass, hot = l => ch && ch.ls.has(l);
    linkSel.attr("display", l => !relOn.get(l.r) || (ch && !hot(l)) ? "none" : null).attr("stroke-opacity", l => ch ? .9 : focusClass ? (inF(l.source) || inF(l.target) ? .4 : .04) : view === "trace" ? .2 : .26).attr("stroke-width", l => hot(l) ? 1.4 : .8);
    nodeSel.classed("dimmed", n => (ch && !ch.ns.has(n.id)) || (!ch && !inF(n)));
    nodeSel.classed("lbl", n => view === "trace" || big(n) || (ch && ch.ns.has(n.id)) || n === hover);
    nodeSel.select(".ring").attr("opacity", n => n.id === selected ? 1 : 0);
    if (view === "matrix") renderMatrix();
  }
  const chip = n => `<span class="omchip"><svg viewBox="-12 -12 24 24" width="14" height="14"><path d="${symPath(n, .9)}" fill="${hollow(n) ? "none" : col(n)}" stroke="${col(n)}" stroke-width="${hollow(n) ? 1.5 : 0}"/></svg>${esc(CLS.get(n.c).label)}</span>`;
  const nbtn = n => `<button type="button" data-omid="${n.id}"><svg viewBox="-12 -12 24 24" width="12" height="12"><path d="${symPath(n, .8)}" fill="${hollow(n) ? "none" : col(n)}" stroke="${col(n)}" stroke-width="${hollow(n) ? 1.6 : 0}"/></svg>${esc(label(n))}</button>`;
  const overview = () => {
    const reqs = nodes.filter(n => n.c === "Requirement"), stated = reqs.filter(n => n.status === "stated").length;
    return `<span class="cap">Overview</span><h3>Skydio Requirements Map</h3><p>Skydio's defense and security software modeled from its goal and users down to every requirement, the product and builder screen that deliver it, the design check that guards it, the capability that turns it on, and the public evidence behind it.</p>
      <div class="omclasses">${AK.OM.CLASSES.map(c => { const k = nodes.filter(n => n.c === c.id).length, ex = nodes.find(n => n.c === c.id); return `<button type="button" data-omclass="${c.id}" aria-pressed="${focusClass === c.id}">${chip(ex).replace(esc(c.label), esc(c.plural))}<b>${k}</b></button>`; }).join("")}</div>
      <span class="cap">Requirement status</span><p class="note"><b>${stated}</b> stated on a public page (filled) · <b>${reqs.length - stated}</b> modeled by me (hollow) · <b>${nodes.filter(n => n.c === "Gap").length}</b> open gaps the public record leaves.</p>
      <p class="note">Hover any node to light its chain. Click to pin it. Drag to orbit in 3D, scroll to zoom.</p>`;
  };
  const detail = n => {
    const groups = new Map(); (out.get(n.id) || []).forEach(l => { const k = REL.get(l.r).out; (groups.get(k) || groups.set(k, []).get(k)).push(l.target); }); (inn.get(n.id) || []).forEach(l => { const k = REL.get(l.r).in; (groups.get(k) || groups.set(k, []).get(k)).push(l.source); });
    const ch = chainOf(n.id), trail = ["Goal","User","Need","Requirement"].filter(c => c !== n.c).map(c => [...ch.ns].map(id => byId.get(id)).filter(x => x.c === c)).filter(a => a.length);
    const gen = n.c === "Screen" ? n.screen : n.c === "Requirement" ? ((out.get(n.id) || []).find(l => l.r === "presentedIn") || {}).target?.screen : null;
    return `<button type="button" class="omback" data-omid="">← Overview</button>${chip(n)}<h3>${esc(label(n))}</h3>${n.doc ? `<p>${esc(n.doc)}</p>` : ""}
      ${n.status ? `<p class="note">${n.status === "stated" ? "Stated on a public Skydio page." : "Modeled: my design reading, not a public claim."}${n.src ? ` <a href="${n.src}" target="_blank" rel="noopener">Source ↗</a>` : ""}</p>` : n.src ? `<p class="note"><a href="${n.src}" target="_blank" rel="noopener">Source ↗</a></p>` : ""}
      ${gen ? `<button type="button" class="omgen" data-omgen="${gen}" data-omreq="${n.c === "Requirement" ? n.id : ""}">Build ${n.c === "Screen" ? "a product with this screen" : "a product that meets it"} →</button>` : ""}
      ${trail.length && n.c !== "Goal" ? `<div class="omtrace"><span class="cap">Chain</span>${trail.map(a => a.slice(0, 3).map(x => `<button type="button" data-omid="${x.id}">${esc(x.code || x.n)}</button>`).join(", ") + (a.length > 3 ? ` +${a.length - 3}` : "")).join(" › ")}</div>` : ""}
      ${[...groups].map(([k, arr]) => `<div class="omgrp"><span class="cap">${esc(k)} · ${arr.length}</span>${arr.map(nbtn).join("")}</div>`).join("")}`;
  };
  const renderPanel = () => { const p = $("#ompanel"), n = selected && byId.get(selected); p.innerHTML = n ? detail(n) : overview(); p.scrollTop = 0; };
  function select(id) { selected = id || null; focusClass = null; hover = null; tip.hidden = true; restyle(); renderPanel(); const n = selected && byId.get(selected); if (n && (view === "graph" || view === "trace")) (RM ? svg : svg.transition().duration(500).ease(d3.easeCubicOut)).call(zoom.translateTo, px(n) + 120, py(n)); }

  /* ---------- matrix ---------- */
  function renderMatrix() {
    const reqs = nodes.filter(n => n.c === "Requirement"), rows = [["Generator screens", nodes.filter(n => n.c === "Screen"), "presentedIn"], ["Products", nodes.filter(n => n.c === "Product"), "deliveredBy"]];
    const has = (r, t, rel) => (out.get(r.id) || []).some(l => l.r === rel && l.t === t.id), gapOf = r => (out.get(r.id) || []).some(l => l.r === "gapToday");
    const ini = { "u-operator": "O", "u-pilot": "P", "u-commander": "B", "u-autonomy-eng": "E", "u-test-eng": "T", "u-analyst": "A", "u-integrator": "I", "u-program": "G" };
    const selN = selected && byId.get(selected), colOn = r => selN && (r.id === selN.id || ((selN.c === "Screen" || selN.c === "Product") && (has(r, selN, "presentedIn") || has(r, selN, "deliveredBy"))));
    const head = `<tr><th class="rh">Delivered in ↓ · requirement →</th>${reqs.map(r => `<th data-omid="${r.id}" class="${colOn(r) ? "on" : ""}" title="${esc(r.code + " " + r.n + " · " + r.status)}"><span class="vn">${esc(r.n)}</span><b>${r.code}</b><i class="${r.status}"></i>${gapOf(r) ? '<em title="Open gap">▲</em>' : ""}</th>`).join("")}</tr>`;
    const body = rows.map(([h, list, rel]) => `<tr class="sep"><th class="rh">${h}</th>${reqs.map(() => "<td></td>").join("")}</tr>` + list.map(t => `<tr class="${selN === t ? "on" : ""}"><th class="rh" data-omid="${t.id}">${esc(t.n)}</th>${reqs.map(r => `<td class="${colOn(r) ? "on" : ""}">${has(r, t, rel) ? `<span style="background:${col(t)}"></span>` : ""}</td>`).join("")}</tr>`).join("")).join("");
    const users = `<tr class="sep"><th class="rh">Users · O operator P pilot B battle mgr E autonomy eng T test eng A analyst I integrator G program</th>${reqs.map(r => `<td class="u">${(out.get(r.id) || []).filter(l => l.r === "pertainsTo").map(l => ini[l.t] || "").join("")}</td>`).join("")}</tr>`;
    $("#ommatrix").innerHTML = `<table><thead>${head}</thead><tbody>${body}${users}</tbody></table><p class="note">Filled dot = stated on a public page · hollow = modeled · ▲ = open gap. Click a row or column to trace it.</p>`;
  }

  /* ---------- relations legend ---------- */
  $("#omrels").innerHTML = AK.OM.RELATIONS.map(r => `<button type="button" data-omrel="${r.id}" aria-pressed="true" title="${esc(r.doc)}" style="color:${r.col}"><i></i><span>${esc(r.out)}</span><b>${r.count}</b></button>`).join("");

  /* ---------- views ---------- */
  const setView = v => {
    const prev = view; view = v;
    root.querySelectorAll("[data-omv]").forEach(b => b.setAttribute("aria-pressed", b.dataset.omv === v));
    $("#omg").toggleAttribute("hidden", !(v === "graph" || v === "trace")); cv.hidden = v !== "3d"; $("#ommatrix").hidden = v !== "matrix"; $("#omrels").hidden = v === "matrix"; root.querySelector(".omhud").hidden = v === "matrix";
    if (v === "graph" || v === "trace") {
      if ((prev === "graph" || prev === "trace") && prev !== v && !RM) { const from = new Map(nodes.map(n => [n.id, [prev === "trace" ? n.tx : n.gx, prev === "trace" ? n.ty : n.gy]])); const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / 600), e = d3.easeCubicInOut(k); nodeSel.attr("transform", n => { const f = from.get(n.id); return `translate(${f[0] + (px(n) - f[0]) * e},${f[1] + (py(n) - f[1]) * e})`; }); if (k < 1) requestAnimationFrame(step); else place(); }; requestAnimationFrame(step); linkSel.attr("d", linkPath); }
      else place();
      restyle(); requestAnimationFrame(() => fit2d(false));
    } else { if (v === "3d") resize(); restyle(); }
  };
  root.addEventListener("click", e => {
    const v = e.target.closest("[data-omv]"); if (v) return setView(v.dataset.omv);
    const h = e.target.closest("[data-omh]"); if (h) { if (h.dataset.omh === "clear") { focusClass = null; select(null); } else if (view === "3d") { cam.yaw = -.55; cam.pitch = .42; cam.dist = 1650; } else fit2d(); return; }
    const r = e.target.closest("[data-omrel]"); if (r) { const on = !relOn.get(r.dataset.omrel); relOn.set(r.dataset.omrel, on); r.setAttribute("aria-pressed", on); restyle(); return; }
    const c = e.target.closest("[data-omclass]"); if (c) { focusClass = focusClass === c.dataset.omclass ? null : c.dataset.omclass; selected = null; restyle(); renderPanel(); return; }
    const g = e.target.closest("[data-omgen]"); if (g) { opts.onGenerate && opts.onGenerate(g.dataset.omgen, g.dataset.omreq ? byId.get(g.dataset.omreq) : null); return; }
    const n = e.target.closest("[data-omid]"); if (n) { select(n.dataset.omid || null); return; }
  });
  $("#omq").addEventListener("change", e => { const q = e.target.value.trim().toLowerCase(); const n = nodes.find(x => label(x).toLowerCase() === q) || nodes.find(x => label(x).toLowerCase().includes(q)); if (n) select(n.id); });
  resize(); G.addEventListener("resize", () => { resize(); }); if (G.ResizeObserver) new ResizeObserver(resize).observe(cv);
  renderPanel(); restyle(); loop();
  return { select, setView, D };
};
})(window);
