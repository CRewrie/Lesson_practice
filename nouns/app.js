"use strict";
/* こと・の・さ道場 — making nouns from verbs and adjectives.
   Every card asks for one word or a short chunk, typed from memory: the dictionary form, verb + こと／の,
   adjective + さ／み, ます-stem nouns and ～かた, and adjective + の ("the … one"). Rules you miss are drawn
   more often and come back on a spaced schedule. Shared helpers come from ../assets/core.js. */

// ---------- helpers ----------
const key = s => unLong(norm(s)).replace(/を/g, "お").replace(/は/g, "わ").replace(/へ/g, "え");
const L = () => state.lang === "de" ? 0 : 1;
state.nn = Object.assign({ st: {}, topic: "all", ex: "mix", n: 15 }, state.nn || {});
const pref = state.nn;
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
const U = { "い": "う", "き": "く", "ぎ": "ぐ", "し": "す", "ち": "つ", "に": "ぬ", "び": "ぶ", "み": "む", "り": "る" };
const asG1 = stem => stem.slice(0, -1) + (U[stem.slice(-1)] || stem.slice(-1));    // the group-1 rule
const asG2 = stem => stem + "る";                                                    // the group-2 rule
const wrongDict = v => v.g === 1 ? asG2(v.stem) : v.g === 3 ? v.d.replace(/する$/, "しる").replace(/^くる$/, "きる") : v.exc ? asG1(v.stem) : null;

// ---------- rules ----------
const RULES = {
  dict1: { topic: "dict", name: "Group 1 → dictionary form", rule: "Group 1: the sound before ます is in the い-row → change it to the う-row: よみ→<b>よむ</b>, かき→<b>かく</b>, かい→<b>かう</b>." },
  dict2: { topic: "dict", name: "Group 2 → dictionary form", rule: "Group 2: drop ます, add <b>る</b>: たべます→たべる. Group 2 = え-row before ます, plus exceptions like みます, おきます, かります, います, あびます." },
  dict3: { topic: "dict", name: "する・くる", rule: "Irregular: します→<b>する</b>, きます→<b>くる</b>, べんきょうします→べんきょうする." },
  koto: { topic: "verb", name: "only こと", rule: "Only <b>こと</b>: <span class=\"jp\">しゅみは ～ことです · ～ことが できます</span>." },
  no: { topic: "verb", name: "only の", rule: "Only <b>の</b>: <span class=\"jp\">～のが じょうず／へた／はやい · ～のを わすれました</span>." },
  both: { topic: "verb", name: "の or こと", rule: "Both work with <span class=\"jp\">すき・きらい・たのしい・むずかしい</span>; <b>の</b> is more conversational." },
  sa: { topic: "adj", name: "い-adjective + さ", rule: "い-adjective: drop い, add <b>さ</b>: たかい→たかさ. Irregular: いい→<b>よさ</b>." },
  sana: { topic: "adj", name: "な-adjective + さ", rule: "な-adjective: add <b>さ</b> to the word, no な: しずか→しずかさ. きれい is a な-adjective → きれいさ." },
  mi: { topic: "adj", name: "adjective + み", rule: "A few adjectives make a feeling or taste noun with <b>み</b>: たのしみ, かなしみ, いたみ, あまみ." },
  stem: { topic: "stem", name: "ます-stem as noun", rule: "The ます-stem alone is often a noun: やすみます→<b>やすみ</b>, かえります→<b>かえり</b>." },
  kata: { topic: "stem", name: "ます-stem + かた", rule: "ます-stem + <b>かた</b> = the way of doing it: よみ+かた→よみかた. する→<b>しかた</b>." },
  pron: { topic: "pron", name: "adjective + の", rule: "Adjective + <b>の</b> = „the … one“: やすいの, しずか<b>な</b>の (な stays before の)." },
};
const TOPICS = [
  { id: "dict", ico: "📖", name: "Dictionary form", sub: "the plain form こと／の need" },
  { id: "verb", ico: "🧩", name: "Verb → こと／の", sub: "しゅみは よむことです" },
  { id: "adj", ico: "📏", name: "Adjective → さ／み", sub: "たかさ, しずかさ, たのしみ" },
  { id: "stem", ico: "✂️", name: "ます-stem nouns · ～かた", sub: "やすみ, よみかた" },
  { id: "pron", ico: "👉", name: "Adjective + の", sub: "the cheap one: やすいの" },
];
const EXS = [
  { id: "mix", ico: "🎲", name: "Everything mixed", note: "all exercises" },
  { id: "make", ico: "🔧", name: "Make the form", note: "a word → the noun form (one word)" },
  { id: "ctx", ico: "🧩", name: "In context", note: "a sentence with one gap — type the chunk" },
  { id: "pick", ico: "❓", name: "こと or の?", note: "type only the nominaliser" },
  { id: "fix", ico: "🛠️", name: "Fix the word", note: "one word is wrong — type it correctly" },
];
// which rules each exercise can test
const EX_RULES = { make: ["dict1", "dict2", "dict3", "sa", "sana", "mi", "stem", "kata", "pron"], ctx: Object.keys(RULES), pick: ["koto", "no", "both"], fix: ["dict1", "dict2", "dict3", "koto", "no", "sa", "sana", "kata", "pron"] };

// ---------- cards ----------
const LABEL = { dict: ["Wörterbuchform", "dictionary form"], kata: ["die Art, etwas zu tun: ～かた", "the way of doing it: ～かた"], stem: ["Nomen aus dem ます-Stamm", "noun from the ます-stem"],
  sa: ["Nomen mit ～さ (Grad, Maß)", "noun with ～さ (degree, measure)"], mi: ["Nomen mit ～み (Gefühl, Geschmack)", "noun with ～み (feeling, taste)"], pron: ["„der/die/das … e“ (+ の)", "“the … one” (+ の)"] };
const hobbyVerbs = VERBS.filter(v => v.de);
const kataOf = v => KATA_IRREG[v.m] || v.stem + "かた";
const groupRule = v => "dict" + v.g;
// a verb sentence split around the nominaliser: [before, nominaliser, after]
function verbSentence(t, v) {
  const name = pick(NAMES), [pre, post] = VT[t].ja(v, name), nom = post.startsWith("こと") ? "こと" : "の";
  const p = pre.trim() ? pre.trim() + " " : "";
  return { pre: p, nom, tail: post.slice(nom.length), tr: t === "forgot" ? null : [VT[t].de(v, name), VT[t].en(v, name)] };
}
function pickTemplate(rule) {
  const ts = rule === "koto" ? ["hobby", "can"] : rule === "no" ? ["jouzu", "forgot"] : rule === "both" ? ["like", "fun"] : ["hobby", "can", "like", "jouzu", "fun"];
  return pick(ts);
}
function verbFor(t) {
  if (t === "forgot") { const f = pick(FORGOT); return { ...VERBS.find(v => v.d === f.d), o: f.o, f }; }
  return pick(hobbyVerbs.filter(v => t !== "jouzu" || !v.noJouzu));
}
function make(ex, rule) {
  const lang = L();
  if (ex === "make") {
    if (rule.startsWith("dict")) { const v = pick(VERBS.filter(x => "dict" + x.g === rule)); return { rule, v, base: v.m, mean: v.mean[lang], label: LABEL.dict[lang], alts: [v.d], afterMean: v.mean[lang] }; }
    if (rule === "kata") { const v = pick(VERBS.filter(x => x.kata)); return { rule, v, base: v.m, mean: v.mean[lang], label: LABEL.kata[lang], alts: [kataOf(v)] }; }
    if (rule === "stem") { const s = pick(STEMS); return { rule, base: s.m, mean: "", label: LABEL.stem[lang], alts: [s.n], afterMean: s.mean[lang] }; }
    if (rule === "mi") { const a = pick(MI); return { rule, a, base: a.a, mean: a.mean[lang], label: LABEL.mi[lang], alts: [a.mi], afterMean: a.n[lang] }; }
    if (rule === "pron") { const a = pick(ADJ); return { rule, a, base: a.a + (a.na ? "（な）" : ""), mean: a.mean[lang], label: LABEL.pron[lang], alts: [a.a + (a.na ? "なの" : "の")] }; }
    const a = pick(ADJ.filter(x => !x.noSa && x.na === (rule === "sana"))); return { rule, a, base: a.a + (a.na ? "（な）" : ""), mean: a.mean[lang], label: LABEL.sa[lang], alts: [a.sa], afterMean: a.n[lang] };
  }
  // sentence cards
  const verbRule = ["koto", "no", "both"].includes(rule), dictRule = rule.startsWith("dict");
  if (verbRule || dictRule) {
    let t = pickTemplate(rule), v = verbFor(t);
    if (dictRule) { const pool = hobbyVerbs.filter(x => groupRule(x) === rule); if (pool.length) { v = pick(pool); t = pick(["hobby", "can", "like", "fun"]); } }
    const s = verbSentence(t, v), noms = VT[t].nom, tr = t === "forgot" ? [VT.forgot.de(v.f), VT.forgot.en(v.f)] : s.tr;
    const base = { rule, v, t, tr, why: VT[t].why, hint: v.m };
    if (ex === "pick") return { ...base, pre: s.pre + v.d, post: s.tail, alts: noms, hint: null, nomGap: true };
    if (ex === "fix") {
      if (dictRule) {                          // a wrong dictionary form
        const pool = hobbyVerbs.filter(x => groupRule(x) === rule && wrongDict(x));
        const w = pick(pool), s2 = verbSentence(t === "forgot" || t === "jouzu" ? "hobby" : t, w);
        return { ...base, v: w, hint: w.m, tr: s2.tr, pre: s2.pre, post: s2.tail, wrong: wrongDict(w) + s2.nom, alts: VT[t === "forgot" || t === "jouzu" ? "hobby" : t].nom.map(n => w.d + n) };
      }
      const bad = noms[0] === "こと" ? "の" : "こと";   // the other nominaliser, where only one is right
      return { ...base, pre: s.pre, post: s.tail, wrong: v.d + bad, alts: noms.map(n => v.d + n) };
    }
    if (dictRule) return { ...base, pre: s.pre, post: s.nom + s.tail, alts: [v.d] };            // only the verb
    return { ...base, pre: s.pre, post: s.tail, alts: noms.map(n => v.d + n) };                  // verb + nominaliser
  }
  const c = pick(CTX.filter(x => x.t === rule)), base = { rule, pre: c.pre, post: c.post, tr: [c.de, c.en], hint: c.base, alts: [c.ans] };
  if (ex === "fix") {
    const a = ADJ.find(x => x.a === c.base), vb = VERBS.find(x => x.m === c.base);
    let wrong = null;
    if (rule === "sa") wrong = a.irr ? "いいさ" : a.a + "さ";
    if (rule === "sana") wrong = a.trap ? "きれさ" : a.a + "なさ";
    if (rule === "pron") wrong = a.na ? a.a + "の" : a.a + "なの";
    if (rule === "kata") wrong = vb.d + "かた";
    return { ...base, wrong, fixWhy: RULES[rule].rule };
  }
  return base;
}
function plan() {
  const exs = pref.ex === "mix" ? ["make", "ctx", "pick", "fix"] : [pref.ex];
  const okRule = r => pref.topic === "all" || RULES[r].topic === pref.topic;
  const combos = exs.flatMap(e => EX_RULES[e].filter(okRule).map(r => [e, r]));
  if (!combos.length) return [];
  const out = []; let last = null;
  for (let i = 0; i < pref.n; i++) {
    const pool = combos.filter(c => c[1] !== last || combos.every(x => x[1] === last));
    const w = pool.map(([e, r]) => (isDue(r) ? 3 : 1) * (1 + 4 * (1 - acc(r))) * (e === "make" && (r === "stem" || r === "kata") ? 0.5 : 1));
    let x = Math.random() * w.reduce((a, b) => a + b, 0), k = 0; while ((x -= w[k]) > 0) k++;
    out.push(pool[k]); last = pool[k][1];
  }
  return out.map(([e, r]) => ({ item: { ex: e, ...make(e, r) } }));
}

// ---------- what went wrong ----------
function diagnose(c, got) {
  const g = key(got), v = c.v, a = c.a || ADJ.find(x => x.a === c.hint), r = c.rule;
  if (r.startsWith("dict") || (c.v && c.alts.some(x => x.startsWith(v.d)) && !c.nomGap)) {
    const verb = g.replace(/(こと|の)$/, "");
    if (v && key(v.d) !== verb && !c.nomGap) {
      if (/ます$/.test(verb)) return "Drop ます — the dictionary form has no ます.";
      if (v.g === 1 && verb === key(asG2(v.stem))) return `<span class="jp">${v.m}</span> is group 1 (い-row before ます): ${v.stem.slice(-1)}→${U[v.stem.slice(-1)]} → <b class="jp">${v.d}</b>.${v.trap ? " It looks like group 2, but かえります・はいります・はしります are group 1." : ""}`;
      if (v.g === 2 && v.exc && verb === key(asG1(v.stem))) return `<span class="jp">${v.m}</span> is one of the group-2 exceptions: just ます→る → <b class="jp">${v.d}</b>.`;
      if (v.g === 3) return "する and くる are irregular: します→<b>する</b>, きます→<b>くる</b>.";
      if (r.startsWith("dict")) return RULES[r].rule;
    }
    if (c.t && !c.alts.some(x => key(x) === g)) return c.why;
  }
  if (c.nomGap) return c.why;
  if (r === "sa" && a) { if (a.irr) return "いい is irregular — like よかった: <b class=\"jp\">よさ</b>."; if (g === key(a.a + "さ")) return "Drop the い, then add さ."; }
  if (r === "sana" && a) { if (g === key(a.a + "なさ")) return "No な before さ."; if (a.trap && g === key("きれさ")) return "きれい is a な-adjective — its い belongs to the word: <b class=\"jp\">きれいさ</b>."; }
  if (r === "mi" && a && g.endsWith("さ")) return `This one uses み: <b class="jp">${c.alts[0]}</b>. (たのしみです = I'm looking forward to it.)`;
  if (r === "pron" && a) { if (a.na && g === key(a.a + "の")) return "な-adjectives keep な before の: <b class=\"jp\">" + a.a + "なの</b>."; if (!a.na && g === key(a.a + "なの")) return "い-adjectives join の directly: <b class=\"jp\">" + a.a + "の</b>."; }
  if (r === "kata" && v && g === key(v.d + "かた")) return "～かた joins the ます-stem, not the dictionary form: " + v.stem + "＋かた.";
  if (r === "kata" && c.hint === "します") return "する is irregular: <b class=\"jp\">しかた</b>.";
  return RULES[r].rule;
}

// ---------- dashboard ----------
function dash() {
  const chip = (on, attr, label) => `<button class="pchip ${on ? "on" : ""}" ${attr}>${label}</button>`;
  const usable = (pref.ex === "mix" || EX_RULES[pref.ex].some(r => pref.topic === "all" || RULES[r].topic === pref.topic));
  app.innerHTML = `
    <h2><span class="jp">こと・の・さ<ruby>道場<rt>どうじょう</rt></ruby></span> — making nouns</h2>
    <p class="sub">Japanese turns a verb or an adjective into a noun with a small ending: <span class="jp">${J("よむこと")} · ${J("よむの")} · ${J("たかさ")} · ${J("よみかた")} · ${J("やすいの")}</span>. Every card asks for one word or a short chunk.
      <span class="small">(こと／の with the dictionary form is Minna lessons 18 and 38 — the dictionary form is practised here too.)</span></p>
    <div class="card stack">
      <div><div class="plabel"><b>Topic</b><span></span></div><div class="row">${chip(pref.topic === "all", `data-topic="all"`, "All")}${TOPICS.map(t => chip(pref.topic === t.id, `data-topic="${t.id}"`, `${t.ico} ${t.name}`)).join("")}</div></div>
      <div><div class="plabel"><b>Exercise</b><span>${EXS.find(e => e.id === pref.ex).note}</span></div><div class="row">${EXS.map(e => chip(pref.ex === e.id, `data-ex="${e.id}"`, `${e.ico} ${e.name}`)).join("")}</div></div>
      <div><div class="plabel"><b>Cards</b><span></span></div><div class="row">${[10, 15, 25].map(n => chip(pref.n === n, `data-n="${n}"`, n)).join("")}</div></div>
      <div class="row"><a class="btn primary ${usable ? "" : "off"}" href="#/round">Start round →</a>${usable ? "" : `<span class="small muted">No cards for this combination — pick another topic.</span>`}</div>
    </div>
    <div class="path" style="margin-top:12px">
      <a class="tile" href="#/map"><span class="ico">🗺️</span><h4>Noun map</h4><p>All five ways on one page, with the dictionary-form table and when to use こと or の.</p></a>
      <a class="tile" href="#/you"><span class="ico">💬</span><h4>Talk about you <span class="stars">${starStr(state.stars.you || 0)}</span></h4><p>Your hobby, what you can do, what you like — type only the activity.</p></a>
    </div>
    ${TOPICS.map(t => `<h3>${t.ico} ${t.name} <span class="small muted" style="font-weight:400">· ${t.sub}</span></h3><div class="qw-grid">${Object.entries(RULES).filter(([, r]) => r.topic === t.id).map(([id, r]) => {
      const s = stat(id), a = s.n ? Math.round(s.ok / s.n * 100) : null;
      return `<div class="qw ${a === null ? "" : s.n >= 4 && a >= 85 ? "gold" : a >= 65 ? "strong" : "learning"}"><span><span class="k" style="font-size:14px">${esc(r.name)}</span><br><span class="m">${a === null ? "not tried yet" : `${a}% of ${s.n}${isDue(id) ? " · 🔁" : ""}`}</span></span></div>`; }).join("")}</div>`).join("")}
    <p class="small muted" style="margin-top:20px">First-try results per rule. 🔁 = due for a refresher. Due and weak rules come up more often.
      <button class="back" id="reset">Reset progress</button></p>`;
  $$(".pchip").forEach(c => c.onclick = () => { const d = c.dataset; if (d.topic) pref.topic = d.topic; if (d.ex) pref.ex = d.ex; if (d.n) pref.n = +d.n; save(); dash(); });
  $("#reset").onclick = () => { if (confirm("Delete all こと・の・さ Dojo progress?")) { localStorage.removeItem(KEY); location.reload(); } };
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
    card(it, head, (ok, clean) => {
      if (!q.retry) { answered++; record(it.rule, ok && clean); if (ok && clean) first++; save(); }
      if (ok) addXP(5);
      else queue.splice(Math.min(queue.length, i + 3), 0, { item: { ex: it.ex, ...make(it.ex, it.rule) }, retry: true });
      i++; show();
    });
  };
  const finish = () => {
    const pct = answered ? Math.round(first / answered * 100) : 100;
    setStars("round", pct >= 90 ? 3 : pct >= 70 ? 2 : 1);
    const weak = Object.keys(RULES).filter(r => stat(r).n >= 2 && stat(r).ok / stat(r).n < 0.6);
    app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${pct >= 90 ? "🧩✨" : "🧩"} ${first}/${answered}</div><p>right on the first try, without hints (${pct}%).</p>
      ${weak.length ? `<p class="small">Still shaky: ${weak.map(r => `<b>${esc(RULES[r].name)}</b>`).join(" · ")} — they come up more often.</p>` : ""}
      <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Another round</button><a class="btn" href="#/">Change what I train</a></div></div>`;
    if (pct >= 90 && answered >= 5) confetti();
  };
  show();
}

// one card: a field for one word or chunk; a right answer moves on by itself
function card(c, head, doneOnce) {
  keyHandler = null; app._it = c;
  let fired = false, hinted = false, open = true, timer = null;
  const done = (ok, clean) => { if (fired) return; fired = true; clearTimeout(timer); doneOnce(ok, clean); };
  const field = `<input class="gp-in wide" id="in" autocomplete="off" autocapitalize="off" spellcheck="false">`;
  const full = ans => c.ex === "make" ? ans : `${c.pre}${ans}${c.post}`;
  let body;
  if (c.ex === "make") body = `<div class="make-row"><span class="jp make-base">${J(c.base)}</span>${c.mean ? `<span class="small muted">${esc(c.mean)}</span>` : ""}<span class="make-arrow">→</span><span class="badge new">${esc(c.label)}</span></div>
    <div class="gapline jp" style="text-align:center">${field}</div>`;
  else body = `${c.tr ? `<div class="tr-line big">🌐 ${esc(c.tr[L()])}</div>` : ""}
    ${c.wrong ? `<div class="q jp wrong-line" style="margin:4px 0 0">✗ ${J(c.pre)}<u class="bad-word">${J(c.wrong)}</u>${J(c.post)}</div><p class="small muted" style="text-align:center;margin:0">Type the underlined word correctly:</p>` : ""}
    <div class="gapline jp">${J(c.pre)}${field}${J(c.post)}</div>${c.hint ? `<div class="small muted" style="text-align:center">from <span class="jp">［${J(c.hint)}］</span></div>` : ""}`;
  app.innerHTML = `${head}<div class="card stack">${body}
    <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
  const inp = $("#in"); liveKana(inp); inp.focus();
  $("#hint").onclick = () => { hinted = true; $("#fb").innerHTML = `<div class="small muted">💡 ${RULES[c.rule].rule}</div>`; inp.focus(); };
  const settle = raw => {
    if (!open) return; open = false;
    const v = finishKana(raw).trim(), got = key(v), ok = c.alts.some(a => key(a) === got);
    inp.value = v; inp.disabled = true; inp.classList.add(ok ? "ok" : "no"); $("#hint").style.display = "none";
    beep(ok);
    const model = full(c.alts[0]); speak(model);
    const shown = `<div class="row">${spk(model)}<span class="ja jp" style="font-size:20px">${J(model)}</span></div>${c.afterMean ? `<div class="small muted">= ${esc(c.afterMean)}</div>` : ""}${c.alts.length > 1 ? `<div class="small muted">Also right: ${c.alts.slice(1).map(a => `<span class="jp">${J(a)}</span>`).join(" · ")}</div>` : ""}`;
    if (ok) {
      $("#fb").innerHTML = `<div class="fb ok"><div class="h">せいかい！ ✓</div>${shown}</div>`;
      $("#go").textContent = "Next →"; $("#go").onclick = () => done(true, !hinted); $("#go").focus();
      timer = setTimeout(() => done(true, !hinted), 1300);
      return;
    }
    $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet — it is <b class="jp">${J(c.alts[0])}</b></div>${shown}<div class="small" style="margin-top:6px">💡 ${diagnose(c, v)}</div></div>`;
    $("#go").textContent = "Next →"; $("#go").onclick = () => done(false, false); $("#go").focus();
  };
  $("#go").onclick = () => { if (inp.value.trim()) settle(inp.value); };
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (inp.value.trim()) settle(inp.value); } };
}

// ---------- noun map ----------
function map() {
  const row = (m, d) => `<tr><td>${J(m)}</td><td>→</td><td><b>${J(d)}</b></td></tr>`;
  app.innerHTML = `${backBtn}<h2>🗺️ Noun map</h2><p class="sub">Five ways to make a noun. Read it once, then practise — understanding grows from producing the forms.</p>
  <div class="stack">
  <div class="card gp"><h3>Why?</h3><p>A verb or an adjective cannot be the subject or object of a sentence by itself. Japanese first turns it into a noun — then it works like any other noun: <span class="jp">${J("ほん")}<b>が</b> すきです</span> → <span class="jp">${J("ほんを よむの")}<b>が</b> すきです</span>.</p></div>

  <div class="card gp"><h3>① The dictionary form (needed for こと and の)</h3>
    <table class="t jp"><tr><th colspan="3">Group 1 — い-row before ます → う-row</th></tr>${row("かいます", "かう")}${row("かきます", "かく")}${row("およぎます", "およぐ")}${row("はなします", "はなす")}${row("まちます", "まつ")}${row("しにます", "しぬ")}${row("あそびます", "あそぶ")}${row("よみます", "よむ")}${row("かえります", "かえる")}</table>
    <table class="t jp"><tr><th colspan="3">Group 2 — ます → る</th></tr>${row("たべます", "たべる")}${row("ねます", "ねる")}${row("みます", "みる")}${row("おきます", "おきる")}${row("かります", "かりる")}</table>
    <table class="t jp"><tr><th colspan="3">Group 3 — irregular</th></tr>${row("します", "する")}${row("きます", "くる")}${row("べんきょうします", "べんきょうする")}</table>
    <div class="tip"><b>How to tell the group:</b> え-row before ます (たべ, ね, おしえ) → group 2. い-row (よみ, かき, かい) → usually group 1 — but learn the group-2 exceptions: <span class="jp">みます・います・おきます・かります・あびます・できます</span>. And the opposite trap: <span class="jp">かえります・はいります・はしります</span> are group 1.</div></div>

  <div class="card gp"><h3>② Verb + こと／の — „doing something“</h3>
    <div class="pattern jp"><span class="slot">dictionary form</span> こと／の</div>
    ${ex("しゅみは ほんを よむことです。", "Mein Hobby ist es, Bücher zu lesen.")}${ex("わたしは ピアノを ひくことが できます。", "Ich kann Klavier spielen.")}
    ${ex("わたしは しゃしんを とるのが すきです。", "Ich fotografiere gern.")}${ex("ミラーさんは りょうりを つくるのが じょうずです。", "Herr Miller kann gut kochen.")}${ex("でんきを けすのを わすれました。", "Ich habe vergessen, das Licht auszumachen.")}
    <table class="t jp"><tr><th>only こと</th><th>only の</th><th>both</th></tr><tr><td>しゅみは ～ことです<br>～ことが できます</td><td>～のが じょうず／へた／はやい<br>～のを わすれました</td><td>～のが すき／きらい<br>～のは たのしい／むずかしい</td></tr></table></div>

  <div class="card gp"><h3>③ Adjective + さ／み — the quality as a noun</h3>
    <div class="pattern jp">たか<s>い</s> + さ = たかさ · しずか + さ = しずかさ</div>
    ${ex("ふじさんの たかさは 3776メートルです。", "Die Höhe des Fuji beträgt 3776 Meter.")}${ex("この まちの しずかさが すきです。", "Ich mag die Ruhe dieser Stadt.")}
    <div class="tip"><b>さ</b> works for almost every adjective and measures a degree: たかさ (height), ながさ (length), おもさ (weight). Irregular: <span class="jp">いい → よさ</span>. Trap: <span class="jp">きれい</span> is a な-adjective → <span class="jp">きれいさ</span>.</div>
    <div class="tip"><b>み</b> only with a few words, for a feeling or taste: <span class="jp">${J("たのしみ")}・${J("かなしみ")}・${J("いたみ")}・${J("あまみ")}</span>. <span class="jp">${J("りょこうが たのしみです")}</span> = I'm looking forward to the trip.</div>
    <p class="small muted">Link to the より lesson: <span class="jp">${J("スカイツリーの たかさは どのくらいですか")}</span> — How tall is the Skytree?</p></div>

  <div class="card gp"><h3>④ The ます-stem as a noun · ～かた</h3>
    <table class="t jp">${[["やすみます", "やすみ", "break, day off"], ["はなします", "はなし", "talk, story"], ["かえります", "かえり", "the way home"], ["おわります", "おわり", "end"], ["あそびます", "あそび", "play"]].map(([m, n, e]) => `<tr><td>${J(m)}</td><td>→</td><td><b>${J(n)}</b></td><td class="small muted" style="font-family:var(--ui)">${e}</td></tr>`).join("")}</table>
    <div class="pattern jp"><span class="slot">ます-stem</span> + かた = the way of doing it</div>
    ${ex("この かんじの よみかたを おしえて ください。", "Bitte sagen Sie mir, wie man dieses Kanji liest.")}${ex("この パソコンの つかいかたが わかりません。", "Ich weiß nicht, wie man diesen Computer benutzt.")}
    <div class="tip">する → <span class="jp">しかた</span> (the way of doing). The thing takes の: <span class="jp">かんじ<b>の</b> よみかた</span>, not を.</div></div>

  <div class="card gp"><h3>⑤ Adjective + の — „the … one“</h3>
    ${ex("もっと やすいのは ありませんか。", "Haben Sie keine billigere?")}${ex("あかいのを ください。", "Die rote, bitte.")}${ex("わたしは しずかなのが いいです。", "Ich hätte lieber die ruhige.")}
    <div class="tip">い-adjectives join の directly (やすいの); な-adjectives keep な (しずか<b>な</b>の).</div></div>
  <div class="row center" style="justify-content:center"><a class="btn primary" href="#/">🧩 To the dojo →</a></div></div>`;
}

// ---------- talk about you ----------
function you() {
  const U_ROW = "うくぐすつぬぶむる";
  app.innerHTML = `${backBtn}<h2>💬 Talk about you</h2><p class="sub">Type only the activity, in the dictionary form. Romaji turns into kana. Your answers are saved here.</p>
    <div class="stack">${YOU.map((q, i) => `<div class="card"><div class="row">${spk(q.q)}<span class="jp" style="font-size:19px">${i + 1}) ${J(q.q)}</span></div>
      <div class="gapline jp">${J(q.pre)}<input class="gp-in wide you-in" data-i="${i}" value="${esc(state.you[i] || "")}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(q.ex)}">${J(q.post)}</div>
      <div class="row" style="margin-top:6px">${q.help.map(h => `<span class="chip" data-add="${i}" data-w="${esc(h)}">${esc(h)}</span>`).join("")}</div>
      <div id="yf${i}" class="small" style="margin-top:6px"></div></div>`).join("")}</div>`;
  const feedback = i => {
    const raw = (state.you[i] || "").trim(), el = $(`#yf${i}`); if (!raw) { el.innerHTML = ""; return; }
    const v = toHira(raw).replace(/[。\s]+$/, ""), q = YOU[i], msgs = [];
    if (/ます$/.test(v)) msgs.push("⚠️ Use the dictionary form, not ます: よみます → よむ.");
    else if (/(こと|の)$/.test(v)) msgs.push(`💡 The frame already has <span class="jp">${q.post.startsWith("こと") ? "こと" : "の"}</span> — type only the activity.`);
    else if (!U_ROW.includes(v.slice(-1))) msgs.push("🤔 A dictionary form ends in an う-row sound (う く ぐ す つ ぬ ぶ む る).");
    el.innerHTML = msgs.length ? msgs.join("<br>") : `<span style="color:var(--good)">✓ ${J(q.pre + v + q.post)}</span>`;
    if (!msgs.length && !state.you["_ok" + i]) { state.you["_ok" + i] = 1; addXP(10); }
    const n = YOU.filter((_, k) => state.you["_ok" + k]).length; setStars("you", n >= 4 ? 3 : n >= 2 ? 2 : n ? 1 : 0);
  };
  $$(".you-in").forEach(inp => {
    const i = +inp.dataset.i; liveKana(inp);
    inp.onchange = inp.onblur = () => { inp.value = finishKana(inp.value); state.you[i] = inp.value; save(); feedback(i); };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };
    feedback(i);
  });
  $$("[data-add]").forEach(c => c.onclick = () => {
    const i = +c.dataset.add, inp = $(`.you-in[data-i="${i}"]`);
    inp.value = (inp.value ? inp.value + " " : "") + c.dataset.w; state.you[i] = inp.value; save(); feedback(i); speak(c.dataset.w, 1);
  });
}

// ---------- routes ----------
const MODES = [
  { id: "round", fn: () => round(), t: "Round" },
  { id: "map", fn: () => map(), t: "Noun map" },
  { id: "you", fn: () => you(), t: "Talk about you" },
];
function home() { dash(); }
ROUTES[""] = dash;
boot();
