"use strict";
/* より・ほうが道場 — comparing two things (より, ほうが, どちら) and three or more (いちばん).
   Every exercise is built from a data set with real values, so you have to read the data and decide
   the direction yourself. Answers are typed (except the fast reading drill). Patterns you miss are drawn
   more often and come back on a spaced schedule. Shared helpers come from ../assets/core.js. */

// ---------- helpers ----------
const key = s => unLong(norm(s)).replace(/を/g, "お").replace(/は/g, "わ").replace(/へ/g, "え");
const cap = s => s[0].toUpperCase() + s.slice(1);
const de = () => state.lang === "de";
state.yo = Object.assign({ st: {}, focus: "all", ex: "one", n: 10 }, state.yo || {});
const pref = state.yo;
const IV = [0, 1, 3, 7, 14, 30];
const dayShift = +(new URLSearchParams(location.search).get("day") || 0);
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) + dayShift;
const stat = id => pref.st[id] || (pref.st[id] = { n: 0, ok: 0, b: 0, due: 0 });
const acc = id => (stat(id).ok + 1) / (stat(id).n + 2);
const isDue = id => (stat(id).due || 0) <= today();
function record(id, good) {
  const s = stat(id), was = isDue(id); s.n++;
  if (good) { s.ok++; if (was) { s.b = Math.min(5, s.b + 1); s.due = today() + IV[s.b]; } } else { s.b = 0; s.due = today(); }
}

// ---------- patterns ----------
const PAT = {
  yori: { two: true, label: "AはBより ～です", rule: "<b>より</b> = than. It goes after the thing you compare <i>against</i>: <span class=\"jp\">Bより</span> = „als B“. The topic (は) is the one the adjective is true for." },
  hou: { two: true, label: "Bの ほうが ～です", rule: "<b>～の ほうが</b> marks the winner — the one the adjective is true for. Answer a どちら question with it, never with はい／いいえ." },
  q2: { two: true, label: "AとBと どちらが ～ですか", rule: "Asking about <b>two</b> things: <span class=\"jp\">AとBと どちらが ～ですか</span> — always どちら, also for people and places." },
  qsup: { two: false, label: "＿で なにが いちばん ～ですか", rule: "Three or more: <span class=\"jp\">[group]で ＿が いちばん ～ですか</span>. The question word fits the group: <b>なに</b> things, <b>どこ</b> places, <b>だれ</b> people, <b>いつ</b> times." },
  asup: { two: false, label: "Xが いちばん ～です", rule: "The answer to a question word takes <b>が</b>: <span class=\"jp\">Xが いちばん ～です</span>." },
};
const better = (d, a, b) => (a.v - b.v) * d.dir > 0;          // does a have more of d.hi than b?
function makeItem(pattern, d = pick(DIMS)) {
  const it = { pattern, d };
  if (PAT[pattern].two) {
    const [x, y] = sample(d.items, 2), hiWin = better(d, x, y) ? x : y, loWin = hiWin === x ? y : x;
    Object.assign(it, { x, y, hiWin, loWin, ents: [x, y] });
    if (pattern === "yori") { it.A = pick([x, y]); it.B = it.A === x ? y : x; it.adj = it.A === hiWin ? d.hi : d.lo; }
    else { it.adj = pick([d.hi, d.lo]); it.win = it.adj === d.hi ? hiWin : loWin; it.lose = it.win === x ? y : x; [it.A, it.B] = shuffle([x, y]); }
  } else {
    it.ents = sample(d.items, Math.min(d.items.length, pick([3, 4, 4])));
    it.adj = pick([d.hi, d.lo]);
    const sorted = [...it.ents].sort((a, b) => (b.v - a.v) * d.dir);
    it.win = it.adj === d.hi ? sorted[0] : sorted.at(-1);
  }
  it.opp = it.adj === d.hi ? d.lo : d.hi;
  return it;
}
// the sentence as [word, particle, tag]
function tokens(it) {
  const { d, adj } = it;
  switch (it.pattern) {
    case "yori": return [[it.A.k, "は", "S"], [it.B.k, "より", "B"], [adj.k, "です", "ADJ"]];
    case "hou": return [[it.win.k, "の", "W"], ["ほう", "が", "H"], [adj.k, "です", "ADJ"]];
    case "q2": return [[it.A.k, "と", "X"], [it.B.k, "と", "Y"], ["どちら", "が", "Q"], [adj.k, "ですか", "ADJ"]];
    case "qsup": return [[d.cat, "で", "CAT"], [d.q, "が", "Q"], ["いちばん", "", "I"], [adj.k, "ですか", "ADJ"]];
    default: return [[it.win.k, "が", "W"], ["いちばん", "", "I"], [adj.k, "です", "ADJ"]];
  }
}
const sentence = ts => ts.map(([w, p]) => w + p).join(" ") + "。";
// every accepted way of saying it, as loose keys
function accept(it, pattern = it.pattern) {
  const out = new Set(), adjs = [it.adj.k, ...(it.adj.alt || [])], Z = ["", "ずっと"], add = s => out.add(key(s));
  for (const a of adjs) for (const z of Z) {
    if (pattern === "yori") { add(`${it.A.k}は${it.B.k}より${z}${a}です`); add(`${it.B.k}より${it.A.k}のほうが${z}${a}です`); add(`${it.A.k}のほうが${it.B.k}より${z}${a}です`); }
    if (pattern === "hou") { add(`${it.win.k}のほうが${z}${a}です`); if (it.lose) add(`${it.lose.k}より${it.win.k}のほうが${z}${a}です`); }
    if (pattern === "asup") add(`${it.win.k}がいちばん${a}です`);
  }
  for (const a of adjs) {
    if (pattern === "q2") for (const q of ["どちら", "どっち"]) for (const [p, r] of [[it.A, it.B], [it.B, it.A]]) add(`${p.k}と${r.k}と${q}が${a}ですか`);
    if (pattern === "qsup") for (const c of [it.d.cat + "で", it.d.cat + "のなかで"]) for (const q of QW_ALT[it.d.q]) add(`${c}${q}がいちばん${a}ですか`);
  }
  return out;
}
// statements about the shown items that the data contradicts (to explain a "wrong direction" answer)
function falseStatements(it) {
  const out = new Map(), d = it.d;
  for (const adj of [d.hi, d.lo]) for (const a of [adj.k, ...(adj.alt || [])]) {
    if (it.ents.length === 2) for (const s of it.ents) {
      const o = s === it.ents[0] ? it.ents[1] : it.ents[0], truth = better(d, s, o) === (adj === d.hi);
      if (!truth) for (const z of ["", "ずっと"]) { out.set(key(`${s.k}は${o.k}より${z}${a}です`), [s, adj]); out.set(key(`${s.k}のほうが${z}${a}です`), [s, adj]); }
    }
    const sorted = [...it.ents].sort((p, q) => (q.v - p.v) * d.dir), top = adj === d.hi ? sorted[0] : sorted.at(-1);
    for (const s of it.ents) if (s !== top) out.set(key(`${s.k}がいちばん${a}です`), [s, adj]);
  }
  return out;
}
function translate(it, pattern = it.pattern) {
  const L = de() ? "de" : "en", adj = it.adj, d = it.d, D = L === "de";
  if (pattern === "yori") return D ? `${cap(it.A.de)} ist ${adj.de} als ${it.B.de}.` : `${cap(it.A.en)} is ${adj.en} than ${it.B.en}.`;
  if (pattern === "hou") return D ? `${cap(it.win.de)} ist ${adj.de}.` : `${cap(it.win.en)} is ${adj.en}.`;
  if (pattern === "q2") return D ? `${d.who ? "Wer" : "Was"} ist ${adj.de}, ${it.A.de} oder ${it.B.de}?` : `${d.who ? "Who" : "Which"} is ${adj.en}, ${it.A.en} or ${it.B.en}?`;
  if (pattern === "qsup") return D ? `${d.catDe} ist ${adj.deS}?` : `${d.catEn} is ${adj.enS}?`;
  return D ? `${cap(it.win.de)} ist ${adj.deS}.` : `${cap(it.win.en)} is ${adj.enS}.`;
}
const trLine = (it, big, pattern) => `<div class="tr-line ${big ? "big" : ""}">🌐 ${esc(translate(it, pattern))}</div>`;

// ---------- display ----------
function dataCard(it) {
  const vs = it.ents.map(e => e.v), min = Math.min(...vs), max = Math.max(...vs);
  return `<div class="dcard">${it.ents.length > 2 ? `<div class="small muted jp" style="margin-bottom:4px">${J(it.d.cat)}</div>` : ""}${it.ents.map(e => `<div class="drow"><span class="de">${e.e}</span><span class="dk jp">${J(e.k)}</span>
    <span class="dbar"><span style="width:${max === min ? 60 : 12 + 88 * (e.v - min) / (max - min)}%"></span></span><span class="dv">${esc(it.d.show(e.v))}</span></div>`).join("")}</div>`;
}
const pairChip = it => `<div class="row" style="justify-content:center"><span class="badge jp">${J(it.d.hi.k)} ⇄ ${J(it.d.lo.k)}</span></div>`;

// ---------- what went wrong ----------
function diagnose(input, it, pattern) {
  const g = key(input), msgs = [], has = s => g.includes(key(s)), two = PAT[pattern].two, d = it.d;
  const fs = falseStatements(it).get(g);
  if (fs) {
    const [s, adj] = fs, truth = it.ents.length === 2 ? (() => { const o = s === it.ents[0] ? it.ents[1] : it.ents[0]; return `${s.k}は ${o.k}より ${(better(d, s, o) ? d.hi : d.lo).k}です`; })() : null;
    msgs.push(`That says the opposite of the data: <span class="jp">${s.k}</span> is not ${esc(de() ? adj.de : adj.en)}${it.ents.length > 2 ? ` than all the others` : ""}.${truth ? ` True is: <b class="jp">${truth}</b>.` : ""}`);
  }
  if (two && has("いちばん")) msgs.push("For <b>two</b> things use より／ほうが — いちばん is for three or more.");
  if (!two && (has("どちら") || has("どっち"))) msgs.push(`どちら is only for two. With three or more ask <b class="jp">${d.q}が いちばん</b>.`);
  if (pattern === "q2" && /なに|どれ|どこ|だれ/.test(g)) msgs.push("Two things: the question word is always <b class=\"jp\">どちら</b>.");
  if (pattern === "qsup") { const qs = ["なに", "どれ", "どこ", "だれ", "いつ"].filter(q => g.includes(q)); if (qs.length && !qs.some(q => QW_ALT[d.q].includes(q))) msgs.push(`For <span class="jp">${d.cat}</span> the question word is <b class="jp">${d.q}</b> (なに things · どこ places · だれ people · いつ times).`); }
  if (g.includes("ほうが") && !g.includes("のほうが")) msgs.push("<b class=\"jp\">の</b> before ほう: <span class=\"jp\">Xの ほうが</span>.");
  if (g.includes(key("なです"))) msgs.push("な-adjectives drop the な before です: <span class=\"jp\">しずかです</span>, not しずかなです.");
  if ((pattern === "asup" || pattern === "hou") && it.win && (has(it.win.k + "はいちばん") || has(it.win.k + "のほうは"))) msgs.push("The answer to a question word takes <b class=\"jp\">が</b>, not は.");
  if (pattern === "yori" && it.A && !has(it.A.k + "は") && !has(it.A.k + "のほうが")) msgs.push(`Start with the topic: <b class="jp">${it.A.k}は</b>.`);
  if ([d.hi, d.lo].every(a => ![a.k, ...(a.alt || [])].some(has))) msgs.push(`The adjective here is <b class="jp">${d.hi.k}</b> or <b class="jp">${d.lo.k}</b>.`);
  if (/^q/.test(pattern) && !/か$/.test(g)) msgs.push("A question ends with <b class=\"jp\">か</b>.");
  if (!/^q/.test(pattern) && !/です$/.test(g)) msgs.push("End with <b class=\"jp\">です</b>.");
  return [...new Set(msgs)];
}

// ---------- exercises ----------
const EXS = [
  { id: "one", ico: "⚡", name: "One word", note: "fastest: one gap — より, ほう, どちら, いちばん, a particle or the adjective", pats: ["yori", "hou", "q2", "qsup", "asup"] },
  { id: "build", ico: "📊", name: "Data → sentence", note: "read the data and type the whole sentence", pats: ["yori", "q2", "qsup", "asup"] },
  { id: "qa", ico: "💬", name: "Answer the question", note: "どちら → ～の ほうが · いちばん → ～が いちばん", pats: ["hou", "asup"] },
  { id: "flip", ico: "🔄", name: "Turn it around", note: "same fact, the other thing as topic — needs the opposite adjective", pats: ["yori"] },
  { id: "read", ico: "👀", name: "Read fast", note: "understand the direction: who wins? (tap)", pats: ["yori", "hou"] },
  { id: "fix", ico: "🛠️", name: "Fix the mistake", note: "one thing is wrong — retype it correctly", pats: ["yori", "hou", "q2", "qsup", "asup"] },
  { id: "mix", ico: "🎲", name: "Everything mixed", note: "all exercises", pats: null },
];
const ONE_GAPS = {        // [token index, particle?, weight]
  yori: [[1, true, 3], [2, false, 3]],
  hou: [[0, true, 2], [1, false, 2], [1, true, 1], [2, false, 2]],
  q2: [[2, false, 3], [0, true, 1], [2, true, 1]],
  qsup: [[0, true, 1], [1, false, 3], [2, false, 2]],
  asup: [[0, true, 2], [1, false, 2], [2, false, 2]],
};
function build(ex, pattern) {
  if (ex === "one") {
    const it = makeItem(pattern), ts = tokens(it), opts = ONE_GAPS[pattern];
    let r = Math.random() * opts.reduce((a, o) => a + o[2], 0), k = 0; while ((r -= opts[k][2]) > 0) k++;
    const [i, part] = opts[k], want = part ? ts[i][1] : ts[i][0], tag = ts[i][2];
    const alts = part ? (tag === "CAT" ? ["で", "のなかで"] : [want])
      : tag === "ADJ" ? [it.adj.k, ...(it.adj.alt || [])] : tag === "Q" ? (pattern === "q2" ? ["どちら", "どっち"] : QW_ALT[it.d.q]) : [want];
    return { ex, it, pattern, ts, i, part, want, tag, alts };
  }
  if (ex === "build") {
    const it = makeItem(pattern), t = `„${esc(translate(it))}“`;
    const ask = pattern === "yori" ? `Compare them. Start with <b class="jp">${J(it.A.k)}は</b> …` : pattern === "asup" ? `Say which one is <b>${esc(de() ? it.adj.deS : it.adj.enS)}</b>.` : `Ask: ${t}`;
    return { ex, it, pattern, prompt: dataCard(it) + (pattern === "yori" ? pairChip(it) : ""), ask, accept: accept(it), model: sentence(tokens(it)) };
  }
  if (ex === "qa") {
    const it = makeItem(pattern), qit = { ...it, pattern: pattern === "hou" ? "q2" : "qsup" }, q = sentence(tokens(qit));
    return { ex, it, pattern, prompt: dataCard(it) + `<div class="q jp" style="text-align:center">${J(q)} ${spk(q)}</div>`, say: q, ask: "Answer in a full sentence.", accept: accept(it), model: sentence(tokens(it)), qTr: translate(qit) };
  }
  if (ex === "flip") {
    const src = makeItem("yori"), it = { ...src, A: src.B, B: src.A, adj: src.opp, opp: src.adj }, s = sentence(tokens(src));
    return { ex, it, pattern, prompt: dataCard(src) + `<div class="q jp" style="text-align:center">${J(s)} ${spk(s)}</div><p style="text-align:center;margin:0">Same fact — now start with <b class="jp hl-p">${J(it.A.k)}は</b> …</p>`, say: s,
      ask: "", accept: accept(it), model: sentence(tokens(it)), src };
  }
  if (ex === "read") {
    const it = makeItem(pattern), askAdj = pick([it.d.hi, it.d.lo]), right = askAdj === it.d.hi ? it.hiWin : it.loWin;
    const lines = pattern === "yori" ? [sentence(tokens(it))] : [sentence(tokens({ ...it, pattern: "q2" })), sentence(tokens(it))];
    return { ex, it, pattern, lines, askAdj, right };
  }
  // fix: one typical error
  const it = makeItem(pattern), ts = tokens(it), errs = [];
  const put = (i, w, p) => sentence(ts.map((t, k) => k === i ? [w ?? t[0], p ?? t[1]] : t));
  if (it.adj.na) errs.push([put(ts.length - 1, it.adj.k + "な"), "な-adjectives drop the な before です."]);
  if (pattern === "yori") errs.push([put(2, it.opp.k), "The data says the opposite. Change the adjective (or swap the two things)."]);
  if (pattern === "hou") errs.push([sentence([[it.win.k + "ほう", "が"], [it.adj.k, "です"]]), "の is missing: <span class=\"jp\">Xの ほうが</span>."], [put(0, it.lose.k), "The other one wins — look at the data."]);
  if (pattern === "q2") errs.push([sentence([...ts.slice(0, 3), ["いちばん", ""], ts[3]]), "No いちばん with two things."], [put(2, pick(["なに", "どれ"])), "Two things → どちら."]);
  if (pattern === "qsup") errs.push([put(1, "どちら"), `どちら is for two. Here: ${it.d.q}.`], [put(1, pick(["なに", "どこ", "だれ", "いつ"].filter(q => !QW_ALT[it.d.q].includes(q)))), `For ${it.d.cat} the question word is ${it.d.q}.`]);
  if (pattern === "asup") errs.push([put(0, pick(it.ents.filter(e => e !== it.win)).k), "Someone else wins — look at the data."], [put(0, undefined, "は"), "The answer to a question word takes が."]);
  const [wrong, why] = pick(errs), acc_ = accept(it);
  if (pattern === "yori") for (const k_ of accept({ ...it, A: it.B, B: it.A, adj: it.opp })) acc_.add(k_);   // swapping the two things also fixes it
  return { ex, it, pattern, prompt: dataCard(it) + trLine(it, true) + `<div class="q jp wrong-line">✗ ${J(wrong)}</div>`, ask: "One thing is wrong. Type the whole sentence correctly.", accept: acc_, model: sentence(ts), why };
}
function plan() {
  const exs = pref.ex === "mix" ? ["one", "build", "qa", "flip", "fix", "read"] : [pref.ex];
  const okPat = p => pref.focus === "all" || (pref.focus === "two") === PAT[p].two;
  const combos = exs.flatMap(e => EXS.find(x => x.id === e).pats.filter(okPat).map(p => [e, p]));
  if (!combos.length) return [];
  const out = []; let last = null;
  for (let i = 0; i < pref.n; i++) {
    const pool = combos.filter(c => c[1] !== last || combos.every(x => x[1] === last));
    const w = pool.map(([, p]) => (isDue(p) ? 3 : 1) * (1 + 4 * (1 - acc(p))));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), k = 0; while ((r -= w[k]) > 0) k++;
    out.push(pool[k]); last = pool[k][1];
  }
  return out.map(([e, p]) => ({ item: build(e, p) }));
}

// ---------- dashboard ----------
function dash() {
  const chip = (on, attr, label) => `<button class="pchip ${on ? "on" : ""}" ${attr}>${label}</button>`;
  const exPats = EXS.find(e => e.id === pref.ex).pats, usable = !exPats || exPats.some(p => pref.focus === "all" || (pref.focus === "two") === PAT[p].two);
  app.innerHTML = `
    <h2><span class="jp">より・ほうが<ruby>道場<rt>どうじょう</rt></ruby></span> — comparing</h2>
    <p class="sub">Two things: <span class="jp">${J("AはBより")}</span> · <span class="jp">${J("Bの ほうが")}</span> · <span class="jp">どちら</span>. Three or more: <span class="jp">いちばん</span>. Every exercise uses real data — read it, decide who wins, type it.</p>
    <div class="card stack">
      <div><div class="plabel"><b>Focus</b><span></span></div><div class="row">${chip(pref.focus === "all", `data-focus="all"`, "All")}${chip(pref.focus === "two", `data-focus="two"`, "⚖️ Two things")}${chip(pref.focus === "three", `data-focus="three"`, "🏆 Three or more")}</div></div>
      <div><div class="plabel"><b>Exercise</b><span>${EXS.find(e => e.id === pref.ex).note}</span></div><div class="row">${EXS.map(e => chip(pref.ex === e.id, `data-ex="${e.id}"`, `${e.ico} ${e.name}`)).join("")}</div></div>
      <div><div class="plabel"><b>Cards</b><span></span></div><div class="row">${[10, 20, 30].map(n => chip(pref.n === n, `data-n="${n}"`, n)).join("")}</div></div>
      <div class="row"><a class="btn primary ${usable ? "" : "off"}" href="#/round">Start round →</a>${usable ? "" : `<span class="small muted">This exercise has no “three or more” version — pick another focus.</span>`}</div>
    </div>
    <div class="path" style="margin-top:12px">
      <a class="tile" href="#/map"><span class="ico">🗺️</span><h4>より map</h4><p>The whole system on one page: who gets より, who gets ほうが, どちら vs いちばん, which question word.</p></a>
      <a class="tile" href="#/you"><span class="ico">💬</span><h4>Talk about you <span class="stars">${starStr(state.stars.you || 0)}</span></h4><p>Your own preferences: which do you like more, what do you like most?</p></a>
    </div>
    <h3>Patterns</h3><div class="qw-grid">${Object.entries(PAT).map(([id, p]) => { const s = stat(id), a = s.n ? Math.round(s.ok / s.n * 100) : null;
      return `<div class="qw ${a === null ? "" : s.n >= 4 && a >= 85 ? "gold" : a >= 65 ? "strong" : "learning"}"><span class="e">${p.two ? "⚖️" : "🏆"}</span><span><span class="k jp" style="font-size:14px">${esc(p.label)}</span><br><span class="m">${a === null ? "not tried yet" : `${a}% of ${s.n}${isDue(id) ? " · 🔁" : ""}`}</span></span></div>`; }).join("")}</div>
    <p class="small muted" style="margin-top:20px">First-try results per pattern. 🔁 = due for a refresher (after 1, 3, 7, 14, 30 days). Due and weak patterns come up more often.
      <button class="back" id="reset">Reset progress</button></p>`;
  $$(".pchip").forEach(c => c.onclick = () => { const d = c.dataset; if (d.focus) pref.focus = d.focus; if (d.ex) pref.ex = d.ex; if (d.n) pref.n = +d.n; save(); dash(); });
  $("#reset").onclick = () => { if (confirm("Delete all より Dojo progress?")) { localStorage.removeItem(KEY); location.reload(); } };
}

// ---------- a round ----------
function round() {
  const queue = plan();
  if (!queue.length) { location.hash = "#/"; return; }
  let i = 0, first = 0, answered = 0;
  const show = () => {
    if (i >= queue.length) return finish();
    const q = queue[i], it = q.item, e = EXS.find(x => x.id === it.ex);
    const head = `${backBtn}<div class="plabel"><span>${e.ico} ${e.name}${q.retry ? " · again" : ""} · ${i + 1} / ${queue.length}</span><span>✓ ${first}</span></div><div class="progress"><div style="width:${i / queue.length * 100}%"></div></div>`;
    ({ one: askOne, read: askRead }[it.ex] || ask)(it, head, (ok, clean) => {
      if (!q.retry) { answered++; record(it.pattern, ok && clean); if (ok && clean) first++; save(); }
      if (ok) addXP(it.ex === "one" || it.ex === "read" ? 4 : 10);
      else queue.splice(Math.min(queue.length, i + 3), 0, { item: build(it.ex, it.pattern), retry: true });
      i++; show();
    });
  };
  const finish = () => {
    const pct = answered ? Math.round(first / answered * 100) : 100;
    setStars("round", pct >= 90 ? 3 : pct >= 70 ? 2 : 1);
    const weak = Object.keys(PAT).filter(p => stat(p).n >= 2 && stat(p).ok / stat(p).n < 0.6);
    app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${pct >= 90 ? "⚖️✨" : "⚖️"} ${first}/${answered}</div><p>right on the first try, without hints (${pct}%).</p>
      ${weak.length ? `<p class="small">Still shaky: ${weak.map(p => `<b class="jp">${esc(PAT[p].label)}</b>`).join(" · ")} — they come up more often.</p>` : ""}
      <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Another round</button><a class="btn" href="#/">Change what I train</a></div></div>`;
    if (pct >= 90 && answered >= 5) confetti();
  };
  show();
}

// a whole typed sentence
function ask(c, head, doneOnce) {
  keyHandler = null; app._it = c;
  let fired = false, hinted = false, open = true; const done = (ok, clean) => { if (fired) return; fired = true; doneOnce(ok, clean); };
  app.innerHTML = `${head}<div class="card stack">${c.prompt}${c.ask ? `<p class="small muted" style="margin:0;text-align:center">${c.ask}</p>` : ""}
    <input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the sentence (romaji → kana)">
    <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
  const inp = $("#in"); liveKana(inp); inp.focus(); if (c.say) speak(c.say);
  $("#hint").onclick = () => { hinted = true; $("#fb").innerHTML = `<div class="small muted">Pattern: <span class="jp">${esc(PAT[c.pattern].label)}</span></div>`; inp.focus(); };
  const check = () => {
    if (!open) return;
    inp.value = finishKana(inp.value); const got = key(inp.value); if (!got) return;
    open = false; inp.disabled = true; $("#hint").style.display = "none";
    const ok = c.accept.has(got); beep(ok); speak(c.model);
    const model = `<div class="row">${spk(c.model)}<span class="ja jp" style="font-size:20px">${J(c.model)}</span></div>${trLine(c.it)}`;
    const extra = `${c.why ? `<div class="small">🛠️ ${c.why}</div>` : ""}<div class="small" style="margin-top:6px">💡 ${PAT[c.pattern].rule}</div>`;
    if (ok) {
      $("#fb").innerHTML = `<div class="fb ok"><div class="h">せいかい！ ✓${hinted ? " (with hint)" : ""}</div>${model}${extra}</div>`;
      $("#go").textContent = "Next →"; $("#go").onclick = () => done(true, !hinted); $("#go").focus();
      return;
    }
    const msgs = diagnose(inp.value, c.it, c.pattern);
    $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet — a correct sentence:</div>${model}
      ${msgs.length ? `<ul class="diag">${msgs.map(m => `<li>${m}</li>`).join("")}</ul>` : `<div class="small">The parts look right — check the order and spelling against the model.</div>`}${extra}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><button class="btn" id="mine">✓ Mine means the same</button><button class="btn primary" id="nx">Next →</button></div>`;
    $("#go").style.display = "none";
    $("#nx").onclick = () => done(false, false); $("#nx").focus(); $("#mine").onclick = () => done(true, false);
  };
  $("#go").onclick = check; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); check(); } };
}

// one gap; a right answer moves on by itself
function askOne(c, head, doneOnce) {
  keyHandler = null; app._it = c;
  let fired = false, hinted = false, open = true, timer = null;
  const done = (ok, clean) => { if (fired) return; fired = true; clearTimeout(timer); doneOnce(ok, clean); };
  const { it, ts, i, part, tag } = c, adjGap = tag === "ADJ";
  const field = `<input class="gp-in ${part ? "" : "wide"}" id="in" autocomplete="off" autocapitalize="off" spellcheck="false">`;
  const line = ts.map(([w, p], k) => k !== i ? `<span class="gw">${J(w)}</span><span class="gpart">${p}</span>` : part ? `<span class="gw">${J(w)}</span>${field}` : `${field}<span class="gpart">${p}</span>`).join("") + "。";
  // the translation would give the adjective away — then the data has to decide
  app.innerHTML = `${head}<div class="card stack">${dataCard(it)}${adjGap ? pairChip(it) : trLine(it, true)}
    <div class="gapline jp">${line}</div>
    <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
  const inp = $("#in"); liveKana(inp); inp.focus();
  const hints = { B: "Which word means „than“ — and it goes after the thing you compare against.", W: tag === "W" && part && c.pattern === "hou" ? "What links a noun to ほう?" : "The answer to a question word takes …",
    H: part ? "Same particle as after a question word." : "Xの ＿が = „X's side“.", Q: c.pattern === "q2" ? "Two things." : "Is the group things, places, people or times?", I: "„the most“", CAT: "The group you choose from.", X: "„A and B“", ADJ: "Look at the data: is the topic the bigger or the smaller value?" };
  $("#hint").onclick = () => { hinted = true; $("#fb").innerHTML = `<div class="small muted">${hints[tag] || ""}</div>`; inp.focus(); };
  const settle = raw => {
    if (!open) return; open = false;
    const v = finishKana(raw), got = key(v), ok = c.alts.some(a => key(a) === got);
    inp.value = v; inp.disabled = true; inp.classList.add(ok ? "ok" : "no"); $("#hint").style.display = "none";
    beep(ok); const model = sentence(ts); speak(model);
    const shown = `<div class="row">${spk(model)}<span class="ja jp" style="font-size:20px">${J(model)}</span></div>${adjGap ? trLine(it) : ""}`;
    if (ok) {
      $("#fb").innerHTML = `<div class="fb ok"><div class="h">せいかい！ ✓</div>${shown}</div>`;
      $("#go").textContent = "Next →"; $("#go").onclick = () => done(true, !hinted); $("#go").focus();
      timer = setTimeout(() => done(true, !hinted), 1200);
      return;
    }
    let why = PAT[c.pattern].rule;
    if (adjGap && key(it.opp.k) === got) why = `Direction! The data shows the opposite: ${esc(translate(it))}`;
    else if (tag === "Q" && c.pattern !== "q2" && (got === key("どちら") || got === key("どっち"))) why = `どちら is only for two. With three or more: <b class="jp">${it.d.q}</b>.`;
    else if (tag === "Q" && c.pattern === "q2" && got) why = "Two things → always <b class=\"jp\">どちら</b>.";
    else if (tag === "Q") why = `For <span class="jp">${it.d.cat}</span> ask with <b class="jp">${it.d.q}</b> (なに things · どこ places · だれ people · いつ times).`;
    else if (tag === "B" && got === key("ほうが")) why = "ほうが goes on the winner. After the thing you compare against comes <b class=\"jp\">より</b>.";
    $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet — it is <b class="jp">${c.want}</b></div>${shown}<div class="small" style="margin-top:6px">💡 ${why}</div></div>`;
    $("#go").textContent = "Next →"; $("#go").onclick = () => done(false, false); $("#go").focus();
  };
  $("#go").onclick = () => { if (inp.value.trim()) settle(inp.value); };
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (inp.value.trim()) settle(inp.value); } };
}

// reading drill: the sentence only (no data), then tap who wins
function askRead(c, head, doneOnce) {
  keyHandler = null; app._it = c;
  let fired = false, open = true, timer = null; const done = (ok, clean) => { if (fired) return; fired = true; clearTimeout(timer); doneOnce(ok, clean); };
  const q = `どちらが ${c.askAdj.k}ですか。`, opts = shuffle([c.it.x, c.it.y]);
  app.innerHTML = `${head}<div class="card stack">${c.lines.map((l, k) => `<div class="q jp" style="text-align:center;margin:0">${c.lines.length > 1 ? (k ? "— " : "") : ""}${J(l)}</div>`).join("")}
    <p style="text-align:center;margin:6px 0 0"><b class="jp" style="font-size:20px">${J(q)}</b> <span class="small muted">(${esc(de() ? c.askAdj.de : c.askAdj.en)}?)</span></p>
    <div class="opts two">${opts.map((e, k) => `<button class="opt" data-k="${k}"><span class="key">${k + 1}</span>${e.e} ${J(e.k)}</button>`).join("")}</div><div id="fb"></div></div>`;
  speak(c.lines.join(" "));
  const choose = b => {
    if (!open) return; open = false;
    const ok = opts[+b.dataset.k] === c.right; beep(ok);
    $$(".opt").forEach((x, k) => { x.disabled = true; if (opts[k] === c.right) x.classList.add("right"); }); if (!ok) b.classList.add("wrong");
    $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "✗ Read it again:"}</div>${trLine(c.it)}${ok ? "" : `<div class="small" style="margin-top:6px">💡 ${PAT[c.pattern].rule}</div>`}</div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
    $("#nx").onclick = () => done(ok, true); $("#nx").focus();
    if (ok) timer = setTimeout(() => done(true, true), 1300);
  };
  $$(".opt").forEach(b => b.onclick = () => choose(b));
  keyHandler = e => { const b = $$(".opt")[+e.key - 1]; if (b) choose(b); };
}

// ---------- より map ----------
function map() {
  app.innerHTML = `${backBtn}<h2>🗺️ より map</h2><p class="sub">Read it once, then go and produce sentences — understanding grows from using it.</p>
  <div class="stack">
  <div class="card gp"><h3>① より = „than“ — on the one you compare against</h3>
    <div class="pattern jp"><span class="slot">A</span> は <span class="slot">B</span> より <span class="slot">ADJ</span> です</div>
    <p style="text-align:center;font-size:26px;margin:4px 0">🐘 ⚖️ 🐕</p>
    ${ex("ぞうは いぬより おもいです。", "Der Elefant ist schwerer als der Hund. / The elephant is heavier than the dog.")}
    ${ex("いぬは ぞうより かるいです。", "Der Hund ist leichter als der Elefant. — same fact, turned around: the adjective flips.")}
    <div class="tip"><b>For German speakers:</b> „als B“ becomes <span class="jp">Bより</span> — but it stands <i>before</i> the adjective. Read より as „verglichen mit“: <span class="jp">いぬより おもい</span> = „compared with the dog, heavy“.</div>
    <div class="tip"><b>The adjective never changes form.</b> There is no „-er“: おもい = heavy / heavier, decided by より. Add <span class="jp">ずっと</span> for „much more“: <span class="jp">ロシアは ドイツより ずっと おおきいです</span>.</div></div>
  <div class="card gp"><h3>② Asking about two: どちら — answering: ～の ほうが</h3>
    <div class="pattern jp"><span class="slot">A</span> と <span class="slot">B</span> と どちらが <span class="slot">ADJ</span> ですか</div>
    <div class="pattern jp">—— <span class="slot">B</span> の ほうが <span class="slot">ADJ</span> です</div>
    ${ex("しんかんせんと ひこうきと どちらが はやいですか。 —— ひこうきの ほうが はやいです。", "Was ist schneller, der Shinkansen oder das Flugzeug? — Das Flugzeug.")}
    <div class="tip"><b>ほう</b> = „side“. <span class="jp">ひこうきの ほうが</span> = „the plane's side is …“. It sits on the <b>winner</b> — より sits on the loser. You can use both: <span class="jp">しんかんせんより ひこうきの ほうが はやいです</span>.</div>
    <div class="tip">Always <b>どちら</b> for two — even for people (<span class="jp">たなかさんと ミラーさんと どちらが はやいですか</span>) and places. Both the same: <span class="jp">どちらも ～です</span>.</div></div>
  <div class="card gp"><h3>③ Three or more: いちばん</h3>
    <div class="pattern jp"><span class="slot">GROUP</span> で <span class="slot">?</span> が いちばん <span class="slot">ADJ</span> ですか</div>
    <div class="pattern jp">—— <span class="slot">X</span> が いちばん <span class="slot">ADJ</span> です</div>
    <table class="t jp"><tr><th>group</th><th>question word</th><th>example</th></tr>
      <tr><td>things</td><td><b>なに</b> (どれ)</td><td>${J("どうぶつで なにが いちばん おもいですか。")}</td></tr>
      <tr><td>places</td><td><b>どこ</b></td><td>${J("くにで どこが いちばん おおきいですか。")}</td></tr>
      <tr><td>people</td><td><b>だれ</b></td><td>${J("クラスで だれが いちばん はやいですか。")}</td></tr>
      <tr><td>times</td><td><b>いつ</b></td><td>${J("いちねんで いつが いちばん あついですか。")}</td></tr></table>
    <div class="tip">The group takes <span class="jp">で</span> (or <span class="jp">の なかで</span>). The answer to a question word takes <b class="jp">が</b>, not は.</div></div>
  <div class="card gp"><h3>④ Summary: which particle on which word?</h3>
    <table class="t jp"><tr><td>the loser / the reference</td><td><b>より</b></td></tr><tr><td>the winner (answer to どちら)</td><td><b>の ほうが</b></td></tr><tr><td>the winner of three or more</td><td><b>が</b> いちばん</td></tr><tr><td>the group</td><td><b>で</b></td></tr></table>
    <div class="tip"><b>な-adjectives:</b> <span class="jp">${J("としょかんは えきより しずかです")}</span> — no な before です.</div></div>
  <div class="row center" style="justify-content:center"><a class="btn primary" href="#/">⚖️ To the dojo →</a></div></div>`;
}

// ---------- talk about you ----------
function you() {
  app.innerHTML = `${backBtn}<h2>💬 Talk about you</h2><p class="sub">Answer for yourself. Type romaji (it turns into kana) or tap the chips. Only the pattern is checked — your opinion is always right.</p>
    <div class="stack">${YOU.map((q, i) => `<div class="card"><div class="row">${spk(q.q)}<span class="jp" style="font-size:19px">${i + 1}) ${J(q.q)}</span></div>${q.note ? `<div class="small muted">${q.note}</div>` : ""}
      <input class="type-in" data-i="${i}" value="${esc(state.you[i] || "")}" placeholder="romaji → kana" autocomplete="off" autocapitalize="off" spellcheck="false" style="margin-top:8px">
      <div class="row" style="margin-top:6px">${q.help.map(h => `<span class="chip" data-add="${i}" data-w="${esc(h)}">${esc(h)}</span>`).join("")}</div>
      <div id="yf${i}" class="small" style="margin-top:6px"></div>
      <details style="margin-top:6px"><summary class="small muted">Model answers</summary>${q.model.map(m => `<div class="row">${spk(m)}<span class="jp">${J(m)}</span></div>`).join("")}</details></div>`).join("")}</div>`;
  const feedback = i => {
    const v = key(state.you[i] || ""), q = YOU[i], el = $(`#yf${i}`); if (!v) { el.innerHTML = ""; return; }
    const msgs = [];
    if (!/です$/.test(v)) msgs.push("💡 End with です.");
    if (v.includes("ほうが") && !v.includes("のほうが")) msgs.push("⚠️ <span class=\"jp\">Xの ほうが</span> — the の is missing.");
    if (q.kind === "two") {
      if (v.includes("いちばん")) msgs.push("⚠️ Two things → <span class=\"jp\">～の ほうが</span>, not いちばん.");
      else if (!v.includes("のほうが") && !v.includes("どちらも")) msgs.push("💡 Answer with <span class=\"jp\">～の ほうが すきです</span> (or <span class=\"jp\">どちらも</span>).");
    } else {
      if (v.includes("のほうが")) msgs.push("⚠️ Three or more → <span class=\"jp\">～が いちばん</span>.");
      else if (!v.includes("いちばん")) msgs.push("💡 Use <span class=\"jp\">～が いちばん</span>.");
      else if (/わいちばん/.test(v)) msgs.push("⚠️ The answer to a question word takes が: <span class=\"jp\">Xが いちばん</span>.");
    }
    if (v.includes(key("なです"))) msgs.push("⚠️ No な before です.");
    el.innerHTML = msgs.length ? msgs.join("<br>") : `<span style="color:var(--good)">✓ Looks good!</span>`;
    if (!msgs.length && !state.you["_ok" + i]) { state.you["_ok" + i] = 1; addXP(10); }
    const n = YOU.filter((_, k) => state.you["_ok" + k]).length; setStars("you", n >= 5 ? 3 : n >= 3 ? 2 : n ? 1 : 0);
  };
  $$("input.type-in").forEach(inp => {
    const i = +inp.dataset.i; liveKana(inp);
    inp.onchange = inp.onblur = () => { inp.value = finishKana(inp.value); state.you[i] = inp.value; save(); feedback(i); };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };
    feedback(i);
  });
  $$("[data-add]").forEach(c => c.onclick = () => {
    const i = +c.dataset.add, inp = $(`input[data-i="${i}"]`), w = c.dataset.w;
    inp.value = (inp.value + (/^(の|が)/.test(w) || !inp.value ? "" : " ") + w + (/です$/.test(w) ? "。" : "")).trim();
    state.you[i] = inp.value; save(); feedback(i); speak(w, 1);
  });
}

// ---------- routes ----------
const MODES = [
  { id: "round", fn: () => round(), t: "Round" },
  { id: "map", fn: () => map(), t: "より map" },
  { id: "you", fn: () => you(), t: "Talk about you" },
];
function home() { dash(); }
ROUTES[""] = dash;
boot();
