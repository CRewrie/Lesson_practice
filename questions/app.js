"use strict";
/* しつもん道場 — Question Dojo.
   Built for active recall: every answer is typed. Nothing is locked — you pick the topics, the kind of
   exercise and the length of a round. In the background each card still sits in a Leitner box, so cards
   you miss or that are due come up first, and a missed card returns in the same round.
   Shared helpers (typing, audio, kanji display, progress) come from ../assets/core.js. */

// ---------- cards ----------
// Types: r = meaning → word · c = fill the gap · d = dictation
//        p = ask for the marked part · t = translate · x = build the whole question from its translation and the answer
const CARDS = [], byId = {};
for (const w of QW) {
  const acc = [w.kana, ...(w.alt || [])];
  const add = c => { c.w = w; CARDS.push(c); byId[c.id] = c; };
  add({ id: `${w.id}:r`, type: "r", accept: acc });
  (w.c || []).forEach(([q, a, de, extra], i) => {
    add({ id: `${w.id}:c${i}`, type: "c", q, a, de, accept: [...acc, ...(extra || [])] });
    const full = q.replace("（　）", w.kana);
    if (i === 0 && !/[0-9]/.test(full)) add({ id: `${w.id}:d${i}`, type: "d", full, de, accept: [full] });
    if (!/[0-9]/.test(full)) add({ id: `${w.id}:x${i}`, type: "x", a, de, deQ: de.split(" — ")[0], src: `${w.id}:c${i}`, q });
  });
  (w.p || []).forEach(([a, accept, de], i) => add({ id: `${w.id}:p${i}`, type: "p", a, accept, de }));
  (w.t || []).forEach(([de, en, accept], i) => add({ id: `${w.id}:t${i}`, type: "t", de, en, accept }));
}
// a few gaps have more than one natural answer
const ALSO_OK = { "dochira:c1": ["どこ"], "donokurai:c0": ["なんじかん"], "donokurai:c1": ["なんかげつ"], "nanjikan:c0": ["どのくらい", "どのぐらい"], "nanjikan:c1": ["どのくらい", "どのぐらい"],
  "nanpun:c0": ["どのくらい", "どのぐらい"], "nanpun:c1": ["どのくらい", "どのぐらい"], "nannichi:c1": ["どのくらい", "どのぐらい"], "itsu:c1": ["なんがつなんにち"], "nangatsu:c0": ["いつ"],
  "dou:c0": ["いかが"], "ikaga:c0": ["どう"], "doko:c0": ["どちら"], "doko:c2": ["どちら"], "dare:c0": ["どなた"], "nansai:c0": ["おいくつ"], "nansai:c1": ["おいくつ"], "dochira_p:c0": ["どこ"] };
for (const [id, more] of Object.entries(ALSO_OK)) byId[id].accept.push(...more);
for (const c of CARDS) if (c.type === "x") c.accept = byId[c.src].accept.map(word => c.q.replace("（　）", word));

// ---------- schedule ----------
const IV = [0, 1, 3, 7, 14, 30];                       // days until a card in box n is due again
const dayShift = +(new URLSearchParams(location.search).get("day") || 0);   // ?day=3 pretends it is three days later (for testing)
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) + dayShift;
state.srs = state.srs || {};
const srs = state.srs;
// Compare answers loosely: spaces and punctuation don't count, and the particles を・は・へ may be typed the way
// they sound (o, wa, e) — so "kore wa nan desu ka" is accepted for これは なんですか.
const key = s => unLong(norm(s)).replace(/を/g, "お").replace(/は/g, "わ").replace(/へ/g, "え");
const canHear = () => "speechSynthesis" in window && state.sound;
const box = id => srs[id]?.b ?? -1;
const isDue = id => srs[id] && srs[id].due <= today();
function grade(card, ok, hinted, wasDue) {
  const s = srs[card.id] || (srs[card.id] = { b: 0, due: today() });
  if (!ok) { s.b = 0; s.due = today(); }
  else if (wasDue) { if (!hinted) s.b = Math.min(5, s.b + 1); s.b = Math.max(1, s.b); s.due = today() + IV[s.b]; }
  save();
}
const wordLevel = w => { const bs = CARDS.filter(c => c.w === w && srs[c.id]).map(c => srs[c.id].b); return bs.length ? Math.min(...bs) : -1; };
const BELTS = [[0, "⬜", "White belt"], [8, "🟨", "Yellow belt"], [20, "🟧", "Orange belt"], [35, "🟩", "Green belt"], [55, "🟦", "Blue belt"], [75, "🟫", "Brown belt"], [92, "⬛", "Black belt"]];
function belt() {
  const core = CARDS.filter(c => c.type !== "d" && c.type !== "r");
  const pct = Math.round(core.filter(c => box(c.id) >= 3).length / core.length * 100);
  const i = BELTS.findLastIndex(b => pct >= b[0]);
  return { pct, ico: BELTS[i][1], name: BELTS[i][2], next: BELTS[i + 1] };
}

// ---------- display helpers ----------
const mean = x => state.lang === "de" ? x.de : x.en;
const hl = s => String(s).split("**").map((seg, i) => i % 2 ? `<u class="focus">${J(seg)}</u>` : J(seg)).join("");
const gap = (q, inner = "") => J(q).replace("（　）", `<span class="blank">${inner}</span>`);
// the line under a gap: the answer with its key part underlined, or (for statements) the translation
const ansLine = c => c.a.startsWith("(") ? `<div class="small muted">${esc(c.de)}</div>` : `<div class="q jp ans-line">— ${hl(c.a)}</div>`;
const groupName = w => GROUPS.find(g => g.id === w.g).name;
const TYPE_LABEL = { r: "Recall the word", c: "Fill the gap", p: "Ask for the underlined part", t: "Say it in Japanese", d: "Type what you hear", x: "Build the whole sentence" };

// ---------- dashboard ----------
// What a round can consist of. "types" are the card types it draws from.
const KINDS = [
  { id: "mix", ico: "🎲", name: "Everything mixed", types: "cptxd", note: "all exercise types" },
  { id: "full", ico: "🗣️", name: "Whole questions", types: "ptx", note: "hardest: type the full question" },
  { id: "gap", ico: "✏️", name: "Gaps", types: "c", note: "type the missing question word" },
  { id: "ear", ico: "👂", name: "Listening", types: "d", note: "type what you hear" },
  { id: "word", ico: "🔤", name: "Single words", types: "r", note: "easiest: meaning → word" },
];
state.pref = Object.assign({ g: [], kind: "mix", n: 20 }, state.pref || {});
const pref = state.pref;
function pool(p = pref) {
  const types = KINDS.find(k => k.id === p.kind).types;
  return CARDS.filter(c => types.includes(c.type) && (!p.g.length || p.g.includes(c.w.g)) && (c.type !== "d" || canHear()));
}
function dash() {
  const due = CARDS.filter(c => isDue(c.id) && (c.type !== "d" || canHear())).length, b = belt();
  const chip = (on, attr, label) => `<button class="pchip ${on ? "on" : ""}" ${attr}>${label}</button>`;
  app.innerHTML = `
    <h2><span class="jp">しつもん<ruby>道場<rt>どうじょう</rt></ruby></span> — Question Dojo</h2>
    <p class="sub">Every question word, typed from memory. Nothing is locked: choose what you want to train and start.</p>
    <div class="card stack">
      <div><div class="plabel"><b>Topics</b><span>tap to combine</span></div>
        <div class="row">${chip(!pref.g.length, `data-g=""`, "All")}${GROUPS.map(g => chip(pref.g.includes(g.id), `data-g="${g.id}"`, esc(g.name))).join("")}</div></div>
      <div><div class="plabel"><b>Exercise</b><span id="knote"></span></div>
        <div class="row">${KINDS.map(k => chip(pref.kind === k.id, `data-kind="${k.id}"`, `${k.ico} ${k.name}`)).join("")}</div></div>
      <div><div class="plabel"><b>Cards</b><span id="pcount"></span></div>
        <div class="row">${[10, 20, 40].map(n => chip(pref.n === n, `data-n="${n}"`, n)).join("")}</div></div>
      <div class="row" style="justify-content:space-between"><a class="btn primary" href="#/session" id="start">Start round →</a>
        ${due ? `<a class="btn" href="#/due">🔁 Review ${due} due card${due === 1 ? "" : "s"}</a>` : ""}</div>
    </div>
    <div class="path" style="margin-top:12px">
      <a class="tile" href="#/interview"><span class="ico">🎤</span><h4>Interview game <span class="stars">${starStr(state.stars.interview || 0)}</span></h4><p>Meet a stranger and find out twelve facts — by typing your own questions.</p></a>
      <a class="tile" href="#/map"><span class="ico">🗺️</span><h4>Question map</h4><p>The whole system on one page: こ-そ-あ-ど, なに vs なん, the particle rule.</p></a>
    </div>
    <div class="card" style="margin-top:12px"><div class="belt"><span class="b-ico">${b.ico}</span><div><b>${b.name}</b><div class="small muted">${b.pct}% of the sentence cards are strong${b.next ? ` · ${b.next[2]} at ${b.next[0]}%` : " · 🏆"}</div>
      <div class="progress" style="width:180px"><div style="width:${b.pct}%"></div></div></div></div></div>
    ${GROUPS.map(g => `<h3>${g.name} <span class="small muted" style="font-weight:400">· ${g.sub}</span></h3><div class="qw-grid">${QW.filter(w => w.g === g.id).map(w => {
      const l = wordLevel(w);
      return `<button class="qw ${l < 0 ? "" : l >= 4 ? "gold" : l >= 2 ? "strong" : "learning"}" data-w="${w.id}"><span class="e">${w.emo}</span><span><span class="k jp">${J(w.kana)}</span><br><span class="m">${esc(mean(w))}</span></span></button>`;
    }).join("")}</div>`).join("")}
    <div id="winfo"></div>
    <p class="small muted" style="margin-top:20px">Tap a word for its tip and examples. <span class="dot learning"></span> shaky · <span class="dot strong"></span> strong · <span class="dot gold"></span> mastered. Progress is saved in this browser.
      <button class="back" id="reset">Reset progress</button></p>`;
  const refresh = () => { const n = pool().length; $("#pcount").textContent = `${n} card${n === 1 ? "" : "s"} match`; $("#knote").textContent = KINDS.find(k => k.id === pref.kind).note; $("#start").classList.toggle("off", !n); };
  refresh();
  $$(".pchip").forEach(c => c.onclick = () => {
    const d = c.dataset;
    if ("g" in d) { if (!d.g) pref.g = []; else pref.g = pref.g.includes(d.g) ? pref.g.filter(x => x !== d.g) : [...pref.g, d.g]; }
    if (d.kind) pref.kind = d.kind;
    if (d.n) pref.n = +d.n;
    save(); dash();
  });
  $$(".qw").forEach(b => b.onclick = () => {
    const w = QW.find(x => x.id === b.dataset.w);
    $("#winfo").innerHTML = `<div class="card" style="margin-top:14px">${wordCard(w)}</div>`; $("#winfo").scrollIntoView({ behavior: "smooth", block: "nearest" }); speak(w.kana);
  });
  $("#reset").onclick = () => { if (confirm("Delete all Question Dojo progress?")) { localStorage.removeItem(KEY); location.reload(); } };
}
function wordCard(w) {
  return `<div class="row"><span style="font-size:34px">${w.emo}</span><div><div class="jp" style="font-size:26px;font-weight:600">${J(w.kana)} ${spk(w.kana)}</div><div><b>${esc(mean(w))}</b> <span class="muted small">· ${esc(state.lang === "de" ? w.en : w.de)}</span></div></div></div>
    <div class="tip">💡 ${w.tip}</div>
    ${(w.c || []).slice(0, 2).map(([q, a]) => { const full = q.replace("（　）", w.kana); return `<div class="ex">${spk(full)}<div class="t"><div class="ja">${J(q).replace("（　）", `<b class="hl-p">${J(w.kana)}</b>`)}</div>${a.startsWith("(") ? "" : `<div class="ja muted">— ${hl(a)}</div>`}</div></div>`; }).join("")}`;
}

// ---------- a round ----------
// Order of preference inside the chosen pool: cards that are due, then cards never seen, then the rest — shakiest first.
// Within each of those the order is random, and the same word never comes twice in a row.
function buildRound(dueOnly) {
  let cards;
  if (dueOnly) cards = shuffle(CARDS.filter(c => isDue(c.id) && (c.type !== "d" || canHear()))).slice(0, 30);
  else {
    const rank = c => isDue(c.id) ? 0 : !srs[c.id] ? 1 : 2 + srs[c.id].b;
    cards = shuffle(pool()).sort((a, b) => rank(a) - rank(b));
    // the gap card and the whole-question card of one sentence shouldn't meet in one round
    const seen = new Set(); cards = cards.filter(c => { const k = c.src || c.id; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, pref.n);
  }
  cards = shuffle(cards);
  for (let i = 1; i < cards.length; i++) if (cards[i].w === cards[i - 1].w) { const j = cards.findIndex((c, k) => k > i && c.w !== cards[i - 1].w); if (j > 0) [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards.map(card => ({ card, wasDue: !srs[card.id] || isDue(card.id) }));   // only a new or due card can move up a box
}
function session(dueOnly = false) {
  const queue = buildRound(dueOnly);
  if (!queue.length) { app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">∅</div><p>No cards match this choice${pref.kind === "ear" ? " (listening needs sound switched on)" : ""}. Change the topics or the exercise.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#/">Back to the dojo</a></div></div>`; return; }
  let i = 0, firstTry = 0, answered = 0;
  const label = dueOnly ? "🔁 Due cards" : `${KINDS.find(k => k.id === pref.kind).ico} ${KINDS.find(k => k.id === pref.kind).name}`;
  const show = () => {
    if (i >= queue.length) return finish();
    const it = queue[i];
    const head = `${backBtn}<div class="plabel"><span>${label} · ${i + 1} / ${queue.length}</span><span>✓ ${firstTry}</span></div><div class="progress"><div style="width:${i / queue.length * 100}%"></div></div>`;
    ask(it, head, (ok, hinted) => {
      if (!it.retry) { answered++; if (ok && !hinted) firstTry++; grade(it.card, ok, hinted, it.wasDue); if (ok) addXP("rc".includes(it.card.type) ? 5 : 10); }
      else if (ok) { srs[it.card.id].b = 1; srs[it.card.id].due = today() + 1; save(); addXP(2); }   // got it on the comeback → due again tomorrow
      if (!ok) queue.splice(Math.min(queue.length, i + 4), 0, { card: it.card, retry: true });      // missed → comes back a few cards later
      i++; show();
    });
  };
  const finish = () => {
    const pct = answered ? Math.round(firstTry / answered * 100) : 100, b = belt();
    const dueNow = CARDS.filter(c => isDue(c.id) && (c.type !== "d" || canHear())).length;
    setStars("session", pct >= 90 ? 3 : pct >= 70 ? 2 : 1);
    app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${pct >= 90 ? "🥋✨" : "🥋"} ${firstTry}/${answered}</div>
      <p>right on the first try, without hints (${pct}%).</p>
      <p>${b.ico} <b>${b.name}</b> · ${b.pct}% of the sentence cards strong</p>
      <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Another round</button>
        ${dueNow && !dueOnly ? `<a class="btn" href="#/due">🔁 ${dueNow} due</a>` : ""}<a class="btn" href="#/">Change what I train</a></div></div>`;
    if (pct >= 90 && answered >= 5) confetti();
  };
  show();
}

// One card. done(ok, hinted) is called once the learner moves on.
function ask({ card, retry }, head, doneOnce) {
  keyHandler = null;
  let fired = false; const done = (ok, h) => { if (fired) return; fired = true; doneOnce(ok, h); };
  const w = card.w, t = card.type, sentence = "ptdx".includes(t);
  app.dataset.card = card.id;
  let hinted = false, state_ = "open";
  const prompt = {
    r: () => `<div class="q-emo">${w.emo}</div><div style="text-align:center"><b style="font-size:22px">${esc(mean(w))}</b><div class="muted small">${esc(state.lang === "de" ? w.en : w.de)}</div></div>`,
    c: () => `<div class="q jp">${gap(card.q)}</div>${ansLine(card)}`,
    p: () => `<div class="q jp ans-line">${hl(card.a)}</div><p class="small muted" style="margin:0">What was the question?</p>`,
    t: () => `<div style="text-align:center;font-size:20px;margin:10px 0"><b>${esc(mean(card))}</b></div>`,
    x: () => `<div style="text-align:center;font-size:19px;margin:8px 0"><b>${esc(card.deQ)}</b></div>${card.a.startsWith("(") ? "" : `<div class="q jp ans-line" style="margin-top:0">— ${hl(card.a)}</div>`}`,
    d: () => `<div style="text-align:center;margin:8px 0"><button class="btn" id="again">🔊 Play again</button> <button class="btn" id="slow">🐢 Slower</button></div>`,
  }[t]();
  app.innerHTML = `${head}<div class="card stack"><div class="row" style="justify-content:space-between"><span class="badge">${TYPE_LABEL[t]}${retry ? " · again" : ""}</span>${w.g === "polite" && t !== "r" ? `<span class="badge new">polite</span>` : ""}</div>
    ${prompt}
    <input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${sentence ? "type the whole sentence" : "type the question word"}">
    <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
  const inp = $("#in"); liveKana(inp); inp.focus();
  if (t === "d") { speak(card.full); $("#again").onclick = () => { speak(card.full); inp.focus(); }; $("#slow").onclick = () => { speak(card.full, 0.6); inp.focus(); }; }
  const model = t === "c" ? card.q.replace("（　）", w.kana) : t === "r" ? w.kana : t === "d" ? card.full : t === "x" ? card.accept[0] : card.accept[0] + "。";
  $("#hint").onclick = () => {
    hinted = true;
    const h = t === "c" ? `💬 ${esc(card.de)}` : t === "p" ? `💬 ${esc(card.de)}` : t === "t" || t === "x" ? `Question word: <b class="jp">${esc(w.kana)}</b>` : t === "d" ? `💬 ${esc(card.de)}` : `Starts with <b class="jp">${esc([...w.kana][0])}</b> · ${[...w.kana].length} kana`;
    $("#fb").innerHTML = `<div class="small muted">${h}</div>`; inp.focus();
  };
  const settle = ok => {
    state_ = "done"; inp.disabled = true; $("#hint").style.display = "none";
    beep(ok);
    const after = t === "c" ? `<div class="row">${spk(model)}<span class="ja jp">${J(card.q).replace("（　）", `<b class="hl-p">${J(w.kana)}</b>`)}</span></div>${card.a.startsWith("(") ? "" : `<div class="ja jp muted">— ${hl(card.a)}</div>`}<div class="small muted">${esc(card.de)}</div>`
      : `<div class="row">${spk(model)}<span class="ja jp" style="font-size:20px">${J(model)}</span></div>${card.de && t !== "t" && t !== "x" ? `<div class="small muted">${esc(card.de)}</div>` : ""}`;
    const others = sentence && card.accept.length > 1 ? `<div class="small muted">Also fine: ${card.accept.slice(1).map(a => `<span class="jp">${J(a)}</span>`).join(" · ")}</div>` : "";
    if (ok) {
      $("#fb").innerHTML = `<div class="fb ok"><div class="h">せいかい！ ✓${hinted ? " (with hint — it comes back sooner)" : ""}</div>${after}${others}<div class="small" style="margin-top:6px">💡 ${w.tip}</div></div>`;
      $("#go").textContent = "Next →"; $("#go").onclick = () => done(true, hinted); $("#go").focus();
      keyHandler = e => { if (e.key === "Enter") done(true, hinted); };
      speak(model);
      return;
    }
    const noKa = sentence && !/か$/.test(key(inp.value)) ? `<div class="small">⚠️ A question ends with <b class="jp">か</b>.</div>` : "";
    $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet — the answer:</div>${after}${others}${noKa}<div class="small" style="margin-top:6px">💡 ${w.tip}</div>
      ${sentence ? "" : `<label class="small" style="display:block;margin-top:8px">Type it once to lock it in:</label><input class="type-in" id="re" autocomplete="off" autocapitalize="off" spellcheck="false">`}</div>
      ${sentence ? `<div class="row" style="justify-content:space-between;margin-top:10px"><button class="btn" id="mine">✓ Mine means the same</button><button class="btn primary" id="nx">Next →</button></div>` : ""}`;
    speak(model); $("#go").style.display = "none";
    if (sentence) {
      $("#nx").onclick = () => done(false, hinted); $("#nx").focus();
      $("#mine").onclick = () => done(true, true);            // self-marked: counts as right, but not as a clean first try
      keyHandler = e => { if (e.key === "Enter") done(false, hinted); };
    } else {
      const re = $("#re"); liveKana(re); re.focus();
      re.onkeydown = e => { if (e.key !== "Enter") return; re.value = finishKana(re.value); if (card.accept.some(a => key(a) === key(re.value))) done(false, hinted); else { re.classList.add("shake"); setTimeout(() => re.classList.remove("shake"), 400); } };
    }
  };
  const check = () => {
    if (state_ !== "open") return;
    inp.value = finishKana(inp.value);
    const got = key(inp.value); if (!got) return;
    settle(card.accept.some(a => key(a) === got));
  };
  $("#go").onclick = check;
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); check(); } };
}

// ---------- interview game ----------
function interview() {
  const p = pick(PEOPLE), open = new Set(), tried = { n: 0, hints: 0 }; let hintAt = null, hintLevel = 0;
  app.innerHTML = `${backBtn}<h2>🎤 Interview</h2><p class="sub">You meet <b>${p.emo} ${esc(p.name)}さん</b> at a party. Find out all twelve facts. There are no options — type your own questions in Japanese (romaji turns into kana).</p>
    <div class="facts" id="facts">${FACTS.map(f => `<div class="fact" data-f="${f.id}"><span class="fi">${f.ico}</span><span class="fl">${esc(mean(f))}</span><span class="fa jp"></span></div>`).join("")}</div>
    <div class="chat" id="chat" style="margin-top:12px"><div class="msg"><div class="who">${p.emo} ${esc(p.name)}</div><div class="ja">${J("こんにちは。はじめまして。")}</div></div></div>
    <div class="ask-bar"><input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. onamae wa nan desu ka">
      <div class="row" style="justify-content:space-between;margin-top:8px"><button class="btn" id="hint">💡 Hint</button><span class="small muted" id="count">0 / ${FACTS.length}</span><button class="btn primary" id="go">Ask</button></div><div id="fb"></div></div>`;
  const chat = $("#chat"), inp = $("#in"); liveKana(inp); inp.focus(); speak("こんにちは。はじめまして。");
  const say = (who, html, me) => { chat.insertAdjacentHTML("beforeend", `<div class="msg ${me ? "me" : ""}"><div class="who">${who}</div>${html}</div>`); chat.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const QWORDS = ["どのくらい", "どのぐらい", "なんさい", "おいくつ", "なんにん", "なんで", "どちら", "どなた", "いかが", "どんな", "どうして", "いくつ", "いくら", "どこ", "いつ", "だれ", "どう", "なに", "なん"];
  const askIt = () => {
    inp.value = finishKana(inp.value); const text = inp.value.trim(), k = key(text); if (!k) return;
    tried.n++; $("#fb").innerHTML = "";
    say("🙋 you", `<div class="ja">${J(text)}</div>`, true);
    const f = FACTS.find(x => x.re.test(k));
    if (f && !/か$/.test(k)) { beep(false); say(`${p.emo} ${esc(p.name)}`, `<div class="ja">${J("え？")}</div><div class="tr">Almost — a question ends with <b class="jp">か</b>. Add it and ask again.</div>`); return; }
    if (f && open.has(f.id)) { say(`${p.emo} ${esc(p.name)}`, `<div class="ja">${J(p.a[f.id])}</div><div class="tr">(You already asked that 😄)</div>`); inp.value = ""; return; }
    if (!f) {
      beep(false);
      const used = QWORDS.find(q => k.includes(q));
      say(`${p.emo} ${esc(p.name)}`, `<div class="ja">${J("すみません、もう いちど おねがいします。")}</div><div class="tr">${used ? `She heard <b class="jp">${used}</b> but not what you are asking about. Look at the open cards and name the topic or use a verb (きました, います, ですか).` : "No question word found. Start from an open card: what would the answer look like? Put the question word in its place."}</div>`);
      speak("すみません、もう いちど おねがいします。"); return;
    }
    beep(true); addXP(8); open.add(f.id); inp.value = ""; if (hintAt === f.id) { hintAt = null; hintLevel = 0; }
    say(`${p.emo} ${esc(p.name)}`, `<div class="row" style="flex-wrap:nowrap">${spk(p.a[f.id])}<span class="ja">${J(p.a[f.id])}</span></div>`); speak(p.a[f.id]);
    const el = $(`.fact[data-f="${f.id}"]`); el.classList.add("open"); $(".fa", el).innerHTML = J(p.a[f.id]);
    $("#count").textContent = `${open.size} / ${FACTS.length}`;
    if (open.size === FACTS.length) {
      const s = tried.hints === 0 && tried.n <= FACTS.length + 4 ? 3 : tried.hints <= 3 ? 2 : 1; setStars("interview", s); addXP(30);
      $(".ask-bar").innerHTML = `<div class="card stack" style="text-align:center"><div class="result-big">🎤 ${starStr(s)}</div><p>All twelve facts in ${tried.n} questions, ${tried.hints} hint${tried.hints === 1 ? "" : "s"}.</p>
        <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Meet someone else</button><a class="btn" href="#/">Dojo</a></div></div>`;
      if (s === 3) confetti();
    }
  };
  $("#go").onclick = askIt; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); askIt(); } };
  $("#hint").onclick = () => {
    const f = FACTS.find(x => !open.has(x.id) && (hintAt === null || x.id === hintAt)) || FACTS.find(x => !open.has(x.id)); if (!f) return;
    if (hintAt !== f.id) { hintAt = f.id; hintLevel = 0; }
    hintLevel++; tried.hints++;
    $("#fb").innerHTML = `<div class="small muted" style="margin-top:6px">${f.ico} ${esc(mean(f))}: ${hintLevel === 1 ? `use <b class="jp">${f.word}</b>` : `<span class="jp">${J(f.model)}</span> — now type it yourself.`}</div>`;
    inp.focus();
  };
}

// ---------- question map ----------
function map() {
  const kosoado = [["thing", "これ", "それ", "あれ", "どれ"], ["thing + noun", "この", "その", "あの", "どの"], ["place", "ここ", "そこ", "あそこ", "どこ"], ["direction · polite", "こちら", "そちら", "あちら", "どちら"], ["kind of", "こんな", "そんな", "あんな", "どんな"], ["way", "こう", "そう", "ああ", "どう"]];
  const pair = (a, q) => `<div class="ex"><div class="t"><div class="ja">${hl(a)}</div><div class="ja">→ ${J(q)} ${spk(q)}</div></div></div>`;
  app.innerHTML = `${backBtn}<h2>🗺️ Question map</h2><p class="sub">Read it once, then go and train — you remember what you <i>retrieve</i>, not what you reread.</p>
  <div class="stack">
  <div class="card gp"><h3>① The golden rule</h3>
    <p>A Japanese question keeps the word order of its answer. Put the question word <b>exactly where the answer is</b>, keep the particle, add <b class="jp">か</b>.</p>
    ${pair("**ぎんこう**へ いきます。", "どこへ いきますか。")}${pair("**ともだち**と いきます。", "だれと いきますか。")}${pair("**でんしゃ**で いきます。", "なんで いきますか。")}${pair("**あした** いきます。", "いつ いきますか。")}
  </div>
  <div class="card gp"><h3>② こ・そ・あ・ど</h3><p>Every ど-word is the question to a こ/そ/あ-word you already know.</p>
    <div style="overflow-x:auto"><table class="t jp"><tr><th></th><th>here (こ)</th><th>there (そ)</th><th>over there (あ)</th><th>? (ど)</th></tr>
    ${kosoado.map(r => `<tr><td style="font-family:var(--ui);font-size:12px" class="muted">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td><b class="hl-p">${r[4]}</b></td></tr>`).join("")}</table></div>
    <div class="tip"><b>どれ</b> = which of three or more · <b>どちら</b> = which of two · <b>どの</b> always needs a noun.</div></div>
  <div class="card gp"><h3>③ なに or なん?</h3>
    <table class="t jp"><tr><td><b class="hl-p">なん</b></td><td>before です, の, で and counters</td><td>なんですか · なんの ほん · なんで · なんじ · なんにん</td></tr>
    <tr><td><b class="hl-p">なに</b></td><td>before を, が, も</td><td>なにを · なにが · なにも</td></tr></table>
    <p class="small muted">なん + counter gives a whole family: なんじ, なんようび, なんがつ, なんにち, なんさい, なんにん, なんばん, なんかい, なんまい, なんだい, なんじかん, なんぷん.</p></div>
  <div class="card gp"><h3>④ Three particle traps</h3>
    <div class="tip"><b>いつ takes no に</b> — <span class="jp">いつ きましたか</span>. But a clock time does: <span class="jp">なんじ<b>に</b> おきますか</span>.</div>
    <div class="tip"><b>Never は after a question word</b> — <span class="jp">だれ<b>が</b> いますか · なに<b>が</b> ありますか</span>, and the answer keeps が.</div>
    <div class="tip"><b>No particle after amounts</b> — <span class="jp">いくつ ありますか · なんにん いますか · どのくらい かかりますか</span>.</div></div>
  <div class="card gp"><h3>⑤ Polite versions</h3>
    <table class="t jp"><tr><th>plain</th><th>polite</th><th>example</th></tr>
    <tr><td>だれ</td><td><b>どなた</b></td><td>${J("あの かたは どなたですか。")}</td></tr><tr><td>どこ</td><td><b>どちら</b></td><td>${J("おくには どちらですか。")}</td></tr>
    <tr><td>なんさい</td><td><b>おいくつ</b></td><td>${J("おいくつですか。")}</td></tr><tr><td>どう</td><td><b>いかが</b></td><td>${J("コーヒーは いかがですか。")}</td></tr></table></div>
  <div class="card gp"><h3>⑥ Nothing, nobody, nowhere</h3>
    <p>Question word + <b class="jp">も</b> + negative verb:</p>
    ${ex("なにも たべませんでした。", "Ich habe nichts gegessen. / I ate nothing.")}${ex("だれも いません。", "Es ist niemand da. / Nobody is there.")}${ex("どこも いきませんでした。", "Ich bin nirgendwohin gegangen. / I went nowhere.")}</div>
  <div class="card gp"><h3>⑦ Questions without a question word</h3>
    ${ex("あした いきますか。 —— はい、いきます。／ いいえ、いきません。", "Yes/no question: just add か.")}
    ${ex("それは ペンですか、えんぴつですか。 —— えんぴつです。", "Either/or: two questions in a row. Answer with the right one, not はい/いいえ.")}
    ${ex("いっしょに いきませんか。 —— ええ、いいですね。", "Invitation: ～ませんか (won't you …?).")}</div>
  <div class="row center" style="justify-content:center"><a class="btn primary" href="#/">🥋 To the dojo →</a></div></div>`;
}

// ---------- routes ----------
const MODES = [
  { id: "session", fn: () => session(false), t: "Round" },
  { id: "due", fn: () => session(true), t: "Due cards" },
  { id: "interview", fn: () => interview(), t: "Interview game" },
  { id: "map", fn: () => map(), t: "Question map" },
];
function home() { dash(); }
ROUTES[""] = dash;
boot();
