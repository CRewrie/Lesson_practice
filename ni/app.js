"use strict";
/* 「に」道場 — the three jobs of に: a point in time, the person an action goes to, the person it comes from.
   Every sentence is generated from a small scene (who, to whom, what, when), so a round never repeats itself.
   All answers are typed. Verbs you miss more often are drawn more often, and a missed pattern returns in the
   same round with a new scene. Shared helpers come from ../assets/core.js. */

// ---------- small helpers ----------
// loose comparison: spaces and punctuation don't count; を・は・へ may be typed as they sound (o, wa, e)
const key = s => unLong(norm(s)).replace(/を/g, "お").replace(/は/g, "わ").replace(/へ/g, "え");
const V = id => NI_VERBS.find(v => v.id === id);
const mean = x => state.lang === "de" ? x.de : x.en;
state.ni = Object.assign({ v: {}, focus: "all", ex: "mix", n: 10, cue: true }, state.ni || {});
const pref = state.ni;
// Per verb: first-try results, plus a Leitner box so a verb you got right is asked for again after 1, 3, 7, 14, 30 days.
const IV = [0, 1, 3, 7, 14, 30];
const dayShift = +(new URLSearchParams(location.search).get("day") || 0);   // ?day=3 pretends it is three days later (for testing)
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) + dayShift;
const stat = id => pref.v[id] || (pref.v[id] = { n: 0, ok: 0, b: 0, due: 0 });
const isDue = id => (stat(id).due || 0) <= today();
function record(id, good) {
  const s = stat(id), was = isDue(id); s.n++;
  if (good) { s.ok++; if (was) { s.b = Math.min(5, (s.b || 0) + 1); s.due = today() + IV[s.b]; } }
  else { s.b = 0; s.due = today(); }
}
const acc = id => (stat(id).ok + 1) / (stat(id).n + 2);          // starts at 50 %, moves with every answer
const chance = p => Math.random() < p;

// ---------- scenes ----------
// A scene is one event: either "S does V at a clock time" or "giver → thing → receiver", seen from the subject S.
function clockOf(hour, half) { return { kana: HOURS[hour] + (half ? "はん" : ""), digit: `${hour}じ${half ? "はん" : ""}`, show: `${CLOCKS[hour]} ${hour}:${half ? "30" : "00"}` }; }
function makeScene(v) {
  if (v.role === "time") {
    const half = chance(0.4);
    if (v.id === "owari") {
      const ev = pick(EVENTS), tw = pick([null, null, { k: "きょう", past: false }, { k: "きのう", past: true }, { k: "まいにち", past: false }]);
      return { v, kind: "time", S: { k: ev[0], e: ev[1] }, tw, past: tw ? tw.past : false, clock: clockOf(pick([3, 4, 5, 6, 7, 8, 9]), half) };
    }
    const S = chance(0.7) ? ME : pick(PEOPLE.filter(p => p.k !== "かぞく"));
    const tw = v.id === "ne" ? pick([{ k: "まいばん", past: false }, { k: "きのう", past: true }, { k: "こんばん", past: false }]) : pick([{ k: "まいあさ", past: false }, { k: "けさ", past: true }, { k: "あした", past: false }]);
    return { v, kind: "time", S, tw, past: tw.past, clock: clockOf(v.id === "ne" ? pick([9, 10, 11, 12, 1]) : pick([5, 6, 7, 8, 9]), half) };
  }
  // give / receive: who is the subject, who is the other person
  let S, O;
  if (v.id === "age") { S = chance(0.75) ? ME : pick(PEOPLE); O = pick(PEOPLE.filter(p => p !== S)); }          // あげます never goes "to me"
  else if (chance(0.75)) { const other = pick(PEOPLE); [S, O] = chance(0.6) ? [ME, other] : [other, ME]; }
  else { [S, O] = sample(PEOPLE, 2); }
  const tw = chance(0.6) ? pick(TWORDS) : null, obj = pick(OBJECTS[v.fam]);
  return { v, kind: "give", S, O, obj: { k: obj[0], e: obj[1] }, tw, past: tw ? tw.past : chance(0.3) };
}
const form = (sc, stem = sc.v.stem) => stem + (sc.past ? "ました" : "ます");
// the sentence as [word, particle, tag] — tag: S subject, T time word, P person, O thing, C clock, V verb
function parts(sc) {
  const out = [[sc.S.k, "は", "S"]];
  if (sc.tw) out.push([sc.tw.k, "", "T"]);
  if (sc.kind === "give") out.push([sc.O.k, "に", "P"], [sc.obj.k, "を", "O"]); else out.push([sc.clock.kana, "に", "C"]);
  out.push([form(sc), "", "V"]);
  return out;
}
const sentence = ps => ps.map(([w, p]) => w + p).join(" ") + "。";
// every way of saying the scene that counts as right (as loose keys)
function variants(sc, tails) {
  const subj = sc.S.k === "わたし" ? ["わたしは", ""] : [sc.S.k + "は"], tw = sc.tw ? sc.tw.k : "", v = form(sc), out = new Set();
  let mids;
  if (sc.kind === "give") {
    const pers = [sc.O.k + "に", ...(sc.v.role === "from" ? [sc.O.k + "から"] : [])], ob = sc.obj.k + "を";
    mids = pers.flatMap(p => [p + ob, ob + p]);
  } else mids = [sc.clock.kana + "に", sc.clock.digit + "に"];
  if (tails) mids = [...mids, ...tails];
  for (const s of subj) for (const m of mids) { out.add(key(tw + s + m + v)); out.add(key(s + tw + m + v)); if (tails) out.add(key(m + v)); }
  return out;
}
// the same event from the other person's side (only for あげます⇄もらいます, かします⇄かります, おしえます⇄ならいます)
const flipped = sc => ({ ...sc, v: V(sc.v.pair), S: sc.O, O: sc.S });
const validGive = sc => !(sc.v.id === "age" && sc.O.k === "わたし");

// ---------- translating a scene ----------
// The whole sentence in German or English (following the DE / EN switch at the top).
function translate(sc) {
  const S = WHO_TR[sc.S.k], me = sc.S.k === "わたし", tw = sc.tw ? TW_TR[sc.tw.k] : ["", ""], h = sc.clock, tidy = x => x.replace(/\s+/g, " ").replace(/ \./, ".").trim();
  const hour = h ? +h.digit.match(/\d+/)[0] : 0, half = h && h.digit.includes("はん");
  if (state.lang === "de") {
    const at = h ? (half ? `um halb ${hour % 12 + 1}` : `um ${hour} Uhr`) : "";
    if (sc.v.id === "ne") return tidy(sc.past ? `${S.n} ${me ? "bin" : "ist"} ${tw[0]} ${at} schlafen gegangen.` : `${S.n} ${me ? "gehe" : "geht"} ${tw[0]} ${at} schlafen.`);
    if (sc.v.id === "oki") return tidy(sc.past ? `${S.n} ${me ? "bin" : "ist"} ${tw[0]} ${at} aufgestanden.` : `${S.n} ${me ? "stehe" : "steht"} ${tw[0]} ${at} auf.`);
    if (sc.v.id === "owari") return tidy(`${S.n} ${sc.past ? "war" : "ist"} ${tw[0]} ${at} zu Ende.`);
    const t = VERB_TR[sc.v.id], [ich, er, pp, sep, how] = t.de, O = WHO_TR[sc.O.k], refl = t.refl ? (me ? " mir" : " sich") : "";
    // "mir / meinem Freund" comes before the time word, "von …" after it: "leiht mir morgen …", "bekommt morgen von … "
    const mid = how === "v" ? `${tw[0]} ${O.v} ${THING_TR[sc.obj.k][0]}` : `${O[how]} ${tw[0]} ${THING_TR[sc.obj.k][0]}`;
    return tidy(sc.past ? `${S.n} ${me ? "habe" : "hat"}${refl} ${mid} ${pp}.` : `${S.n} ${me ? ich : er}${refl} ${mid} ${sep}.`);
  }
  const future = sc.tw && ["あした", "らいしゅう", "こんばん"].includes(sc.tw.k);
  const fin = ([base, s3, past]) => sc.past ? past : future ? "will " + base : me ? base : s3;
  const at = h ? `at ${hour}:${half ? "30" : "00"}` : "";
  if (sc.v.id === "ne") return tidy(`${S.s} ${fin(["go to bed", "goes to bed", "went to bed"])} ${at} ${tw[1]}.`);
  if (sc.v.id === "oki") return tidy(`${S.s} ${fin(["get up", "gets up", "got up"])} ${at} ${tw[1]}.`);
  if (sc.v.id === "owari") return tidy(`${S.s} ${sc.past ? "ended" : future ? "will end" : "ends"} ${at} ${tw[1]}.`);
  const t = VERB_TR[sc.v.id].en, O = WHO_TR[sc.O.k];
  return tidy(`${S.s} ${fin(t)} ${THING_TR[sc.obj.k][1]} ${t[3]} ${O.o} ${tw[1]}.`);
}
const trLine = it => { const t = it.mixed ? it.gaps.tr[state.lang === "de" ? 0 : 1] : translate(it.sc); return `<div class="tr-line">🌐 ${esc(t)}</div>`; };

// ---------- drawing a scene ----------
function who(p, isSubj) { return `<div class="who ${isSubj ? "subj" : ""}"><span class="we">${p.e}</span><span class="wk jp">${J(p.k)}</span>${isSubj ? `<span class="wtag jp">は</span>` : ""}</div>`; }
const FAM_LABEL = { gift: "🎁 give / receive", lend: "🤝 lend / borrow", teach: "📖 teach / learn", call: "📞 phone", send: "📮 send" };
function diagram(sc, showVerb) {
  const chips = [sc.tw ? `<span class="badge jp">📅 ${J(sc.tw.k)}</span>` : `<span class="badge">${sc.past ? "✔ already happened" : "➜ now / usually / will"}</span>`,
    showVerb || sc.kind === "time" ? `<span class="badge new jp">${showVerb ? `［${J(sc.v.stem + "ます")}］` : `${sc.v.ico} ${esc(mean(sc.v))}`}</span>` : `<span class="badge new">${FAM_LABEL[sc.v.fam]}</span>`].join(" ");
  if (sc.kind === "time") return `<div class="row" style="justify-content:center">${chips}</div><div class="dia">${who(sc.S, true)}<div class="arrow"><span class="clock">${sc.clock.show}</span></div></div>`;
  const giver = sc.v.role === "to" ? sc.S : sc.O, recv = sc.v.role === "to" ? sc.O : sc.S;
  return `<div class="row" style="justify-content:center">${chips}</div><div class="dia">${who(giver, giver === sc.S)}<div class="arrow"><span class="thing">${sc.obj.e}</span><span class="jp small">${J(sc.obj.k)}</span><span class="line">⟶</span></div>${who(recv, recv === sc.S)}</div>`;
}

// ---------- what went wrong ----------
function diagnose(input, sc) {
  const got = key(input), msgs = [], has = s => got.includes(key(s));
  if (sc.past && /ます$/.test(got)) msgs.push(`It already happened${sc.tw ? ` (<span class="jp">${sc.tw.k}</span>)` : ""} → <b class="jp">${form(sc)}</b>.`);
  if (!sc.past && /ました$/.test(got)) msgs.push(`Not in the past${sc.tw ? ` (<span class="jp">${sc.tw.k}</span>)` : ""} → <b class="jp">${form(sc)}</b>.`);
  if (!has(sc.v.stem + "ま")) {
    const pair = sc.v.pair && V(sc.v.pair);
    if (pair && has(pair.stem + "ま")) msgs.push(`Direction: the subject is <b class="jp">${sc.S.k}</b>, who ${sc.v.role === "to" ? "gives" : "receives"} → <b class="jp">${sc.v.stem}ます</b>, not ${pair.stem}ます.`);
    else msgs.push(`The verb here is <b class="jp">${sc.v.stem}ます</b> (${esc(mean(sc.v))}).`);
  }
  if (sc.kind === "give") {
    const p = sc.O.k;
    if (!(has(p + "に") || (sc.v.role === "from" && has(p + "から")))) {
      if (has(p + "を")) msgs.push(`The person takes <b class="jp">に</b>, not を: <b class="jp">${p}に</b>. を is for the thing.`);
      else if (has(p + "で") || has(p + "へ") || has(p + "と") || has(p + "が")) msgs.push(`The ${sc.v.role === "to" ? "person it goes to" : "person it comes from"} takes <b class="jp">に</b>: <b class="jp">${p}に</b>.`);
      else if (has(p)) msgs.push(`Put <b class="jp">に</b> right after <span class="jp">${p}</span>.`);
      else msgs.push(`Say who: <b class="jp">${p}に</b>.`);
    }
    if (!has(sc.obj.k)) msgs.push(`The thing is <b class="jp">${sc.obj.k}</b> (${esc(THING_TR[sc.obj.k][state.lang === "de" ? 0 : 1] || "phone")}) — check the spelling: <b class="jp">${sc.obj.k}を</b>.`);
    else if (!has(sc.obj.k + "を")) msgs.push(`The thing takes <b class="jp">を</b>: <b class="jp">${sc.obj.k}を</b>.`);
  } else {
    if (sc.tw && has(sc.tw.k + "に")) msgs.push(`No に after <b class="jp">${sc.tw.k}</b> — it is not a clock time.`);
    const c = [sc.clock.kana, sc.clock.digit];
    if (!c.some(x => has(x + "に"))) msgs.push(c.some(has) ? `A clock time needs <b class="jp">に</b>: <b class="jp">${sc.clock.kana}に</b>.` : `The time is <b class="jp">${sc.clock.kana}に</b>.`);
  }
  return msgs;
}

// ---------- exercises ----------
// Each builder returns what ask() needs: prompt, the accepted keys, the model sentence, the rule to show.
const EXS = [
  { id: "one", ico: "⚡", name: "One word", note: "fastest: you see the meaning and type only the particle or the verb" },
  { id: "mix", ico: "🎲", name: "Everything mixed", note: "the five sentence exercises" },
  { id: "pic", ico: "🖼️", name: "Picture → sentence", note: "like the worksheet: build the sentence" },
  { id: "flip", ico: "🔄", name: "Switch the view", note: "same event, other person as subject" },
  { id: "gap", ico: "✏️", name: "Particles", note: "に against は・を・で・と・へ — or nothing" },
  { id: "fix", ico: "🛠️", name: "Fix the mistake", note: "one thing is wrong — retype it correctly" },
  { id: "qa", ico: "💬", name: "Answer the question", note: "だれに？ なにを？ なんじに？" },
];
const rule = sc => ROLES[sc.v.role].rule + (sc.kind === "time" && sc.tw ? ` <span class="jp">${sc.tw.k}</span> takes nothing.` : "");
function build(ex, v) {
  let sc = makeScene(v);
  if (ex === "pic") return { ex, sc, prompt: diagram(sc, pref.cue), ask: "Say it in one sentence. The framed one is the subject.", accept: variants(sc), model: sentence(parts(sc)), hint: `<span class="jp">${parts(sc).map(([w, p, t]) => t === "V" ? "＿ます／ました" : "＿" + p).join(" ")}</span>` };
  if (ex === "flip") {
    let src = flipped(sc);
    for (let k = 0; k < 20 && !validGive(src); k++) { sc = makeScene(v); src = flipped(sc); }
    const s = sentence(parts(src));
    return { ex, sc, prompt: `<div class="q jp" style="text-align:center">${J(s)} ${spk(s)}</div><p style="text-align:center;margin:0">Same event — now start with <b class="jp hl-p">${J(sc.S.k)}は</b> …</p>`, say: s,
      ask: "", accept: variants(sc), model: sentence(parts(sc)), hint: `The other side of <span class="jp">${src.v.stem}ます</span> is <b class="jp">${sc.v.stem}ます</b>.` };
  }
  if (ex === "fix") {
    const ps = parts(sc), opts = [];
    const swap = (tag, p, why) => ({ wrong: sentence(ps.map(x => x[2] === tag ? [x[0], p] : x)), why });
    if (sc.kind === "give") {
      const bad = pick(["を", "で", "へ"]);
      opts.push(swap("P", bad, `The person takes <b class="jp">に</b>, not ${bad}.`));
      if (sc.v.pair) opts.push({ wrong: sentence(ps.map(x => x[2] === "V" ? [form(sc, V(sc.v.pair).stem), ""] : x)), why: `<span class="jp">${sc.S.k}</span> is the one who ${sc.v.role === "to" ? "gives" : "receives"} → <b class="jp">${sc.v.stem}ます</b>.` });
      if (sc.v.id === "morai" && sc.S.k === "わたし") opts.push({ wrong: sentence([[sc.O.k, "は"], ...(sc.tw ? [[sc.tw.k, ""]] : []), ["わたし", "に"], [sc.obj.k, "を"], [form(sc, "あげ"), ""]]), why: `<b class="jp">あげます</b> is never used toward わたし. From your own side it is <b class="jp">もらいます</b>.` });
    } else {
      if (sc.tw) opts.push({ wrong: sentence(ps.map(x => x[2] === "T" ? [x[0], "に"] : x)), why: `No に after <b class="jp">${sc.tw.k}</b>. Only the clock time takes に.` });
      opts.push(swap("C", "", `A clock time needs <b class="jp">に</b>.`), swap("C", "で", `A point in time takes <b class="jp">に</b>, not で.`));
    }
    if (sc.tw) opts.push({ wrong: sentence(ps.map(x => x[2] === "V" ? [sc.v.stem + (sc.past ? "ます" : "ました"), ""] : x)), why: `<span class="jp">${sc.tw.k}</span> → <b class="jp">${form(sc)}</b>.` });
    const o = pick(opts);
    return { ex, sc, prompt: `${diagram(sc, true)}<div class="q jp wrong-line">✗ ${J(o.wrong)}</div>`, ask: "One thing is wrong. Type the whole sentence correctly.", accept: variants(sc), model: sentence(parts(sc)), why: o.why, hint: "Check three things: the particle after the person or time, the verb's direction, and the tense." };
  }
  if (ex === "qa") {
    const v_ = form(sc), me = sc.S.k === "わたし", subj = me ? "" : sc.S.k + "は ", tw = sc.tw ? sc.tw.k + " " : "";
    let q, tails, model;
    if (sc.kind === "time") { q = `${subj}${tw}なんじに ${v_}か。`; tails = []; model = `${sc.clock.kana}に ${v_}。`; }
    else if (sc.v.fam === "call" || chance(0.6)) { q = `${subj}${tw}だれに ${sc.obj.k}を ${v_}か。`; tails = [sc.O.k + "に", ...(sc.v.role === "from" ? [sc.O.k + "から"] : [])]; model = `${sc.O.k}に ${v_}。`; }
    else { q = `${subj}${tw}${sc.O.k}に なにを ${v_}か。`; tails = [sc.obj.k + "を"]; model = `${sc.obj.k}を ${v_}。`; }
    return { ex, sc, prompt: `${diagram(sc, true)}<div class="q jp" style="text-align:center">${J(q)} ${spk(q)}</div>`, say: q, ask: me ? "Answer for yourself (わたし), in a sentence." : "Answer in a sentence.", accept: variants(sc, tails), model, hint: `Keep the particle from the question: <span class="jp">${q.includes("だれに") ? "だれ<b>に</b> → ＿<b>に</b>" : q.includes("なにを") ? "なに<b>を</b> → ＿<b>を</b>" : "なんじ<b>に</b> → ＿<b>に</b>"}</span>` };
  }
  if (ex === "one") {
    // One gap only, and never a noun: either the verb (direction + tense) or a particle.
    const verbGap = chance(0.45), src = !verbGap && chance(0.25) ? pick(MIXED) : null, ps = src ? src.map(([w, p]) => [w, p, ""]) : parts(sc);
    if (src) ps.tr = src.tr;
    let k = ps.length - 1;
    if (!verbGap) {
      const w = ps.slice(0, -1).map(([, p, t]) => src ? (p === "は" ? 1 : 4) : ({ P: 5, C: 5, T: 3, O: 1, S: 1 })[t]);
      let r = Math.random() * w.reduce((a, b) => a + b, 0); k = 0; while ((r -= w[k]) > 0) k++;
    }
    return { ex, sc, gaps: ps, mixed: !!src, k, verbGap, model: sentence(ps) };
  }
  // particles: the generated scene, or one of the mixed sentences so に has competition
  const mixed = chance(0.35), src = mixed ? pick(MIXED) : null, ps = mixed ? src.map(([w, p]) => [w, p, ""]) : parts(sc);
  if (mixed) ps.tr = src.tr;
  return { ex: "gap", sc, gaps: ps, mixed, model: sentence(ps) };
}
// which exercises a verb can appear in
const fits = (ex, v) => ex !== "flip" || !!v.pair;
function plan() {
  const verbs = NI_VERBS.filter(v => pref.focus === "all" || v.role === pref.focus);
  const exs = pref.ex === "mix" ? ["pic", "flip", "gap", "fix", "qa"] : [pref.ex];
  const combos = verbs.flatMap(v => exs.filter(e => fits(e, v)).map(e => [e, v]));
  if (!combos.length) return [];
  // weak verbs are drawn more often; never the same verb twice in a row
  const out = []; let last = null;
  for (let i = 0; i < pref.n; i++) {
    const pool = combos.filter(([, v]) => v !== last || combos.every(([, x]) => x === last));
    const w = pool.map(([, v]) => (isDue(v.id) ? 3 : 1) * (1 + 4 * (1 - acc(v.id)))), r = Math.random() * w.reduce((a, b) => a + b, 0);
    let k = 0, s = w[0]; while (s < r) s += w[++k];
    out.push(pool[k]); last = pool[k][1];
  }
  return out.map(([e, v]) => ({ item: build(e, v) }));
}

// ---------- dashboard ----------
function dash() {
  const chip = (on, attr, label) => `<button class="pchip ${on ? "on" : ""}" ${attr}>${label}</button>`;
  const usable = pref.ex !== "flip" || pref.focus !== "time";
  app.innerHTML = `
    <h2><span class="jp">「に」<ruby>道場<rt>どうじょう</rt></ruby></span> — the three jobs of に</h2>
    <p class="sub">🕐 a point in time · → the person an action goes to · ← the person it comes from. Pick what to train and type every answer.</p>
    <div class="card stack">
      <div><div class="plabel"><b>Focus</b><span></span></div><div class="row">${chip(pref.focus === "all", `data-focus="all"`, "All three")}${Object.entries(ROLES).map(([id, r]) => chip(pref.focus === id, `data-focus="${id}"`, `${r.ico} ${r.name}`)).join("")}</div></div>
      <div><div class="plabel"><b>Exercise</b><span>${EXS.find(e => e.id === pref.ex).note}</span></div><div class="row">${EXS.map(e => chip(pref.ex === e.id, `data-ex="${e.id}"`, `${e.ico} ${e.name}`)).join("")}</div></div>
      <div><div class="plabel"><b>Sentences</b><span></span></div><div class="row">${[10, 20, 30].map(n => chip(pref.n === n, `data-n="${n}"`, n)).join("")}
        <span style="flex:1"></span>${chip(!pref.cue, `data-cue="1"`, pref.cue ? "Verb is shown — tap to hide (harder)" : "Verb hidden — you choose it")}</div></div>
      <div class="row"><a class="btn primary ${usable ? "" : "off"}" href="#/round">Start round →</a>${usable ? "" : `<span class="small muted">“Switch the view” needs giving or receiving verbs.</span>`}</div>
    </div>
    <div class="path" style="margin-top:12px">
      <a class="tile" href="#/sort"><span class="ico">🗂️</span><h4>Sort the verbs <span class="stars">${starStr(state.stars.sort || 0)}</span></h4><p>The worksheet's first task: which に does each verb take?</p></a>
      <a class="tile" href="#/map"><span class="ico">🗺️</span><h4>に map</h4><p>The three uses on one page, the pairs あげます⇄もらいます, and the worksheet solution.</p></a>
    </div>
    ${Object.entries(ROLES).map(([id, r]) => `<h3>${r.ico} ${r.name} <span class="small muted" style="font-weight:400">· ${r.de}</span></h3><div class="qw-grid">${NI_VERBS.filter(v => v.role === id).map(v => {
      const s = stat(v.id), a = s.n ? Math.round(s.ok / s.n * 100) : null;
      return `<button class="qw ${a === null ? "" : s.n >= 4 && a >= 85 ? "gold" : a >= 65 ? "strong" : "learning"}" data-say="${v.stem}ます"><span class="e">${v.ico}</span><span><span class="k jp">${J(v.stem + "ます")}</span><br><span class="m">${esc(mean(v))}${a === null ? "" : ` · ${a}% of ${s.n}${isDue(v.id) ? " · 🔁" : ""}`}</span></span></button>`;
    }).join("")}</div>`).join("")}
    <p class="small muted" style="margin-top:20px">The percentages are your first-try results per verb. 🔁 = due for a refresher (after 1, 3, 7, 14, 30 days). Due verbs and verbs you miss come up more often.
      <button class="back" id="reset">Reset progress</button></p>`;
  $$(".pchip").forEach(c => c.onclick = () => {
    const d = c.dataset;
    if (d.focus) pref.focus = d.focus; if (d.ex) pref.ex = d.ex; if (d.n) pref.n = +d.n; if (d.cue) pref.cue = !pref.cue;
    save(); dash();
  });
  $("#reset").onclick = () => { if (confirm("Delete all に Dojo progress?")) { localStorage.removeItem(KEY); location.reload(); } };
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
    (it.ex === "gap" ? askGaps : it.ex === "one" ? askOne : ask)(it, head, (ok, clean) => {
      if (!q.retry) { answered++; if (!it.mixed) record(it.sc.v.id, ok && clean); if (ok && clean) first++; save(); }
      if (ok) addXP(it.ex === "gap" || it.ex === "one" ? 5 : 10);
      else queue.splice(Math.min(queue.length, i + 3), 0, { item: build(it.ex, it.sc.v), retry: true });   // same pattern, new scene, a few cards later
      i++; show();
    });
  };
  const finish = () => {
    const pct = answered ? Math.round(first / answered * 100) : 100;
    setStars("round", pct >= 90 ? 3 : pct >= 70 ? 2 : 1);
    const weak = NI_VERBS.filter(v => stat(v.id).n >= 2 && stat(v.id).ok / stat(v.id).n < 0.6);
    app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${pct >= 90 ? "🥋✨" : "🥋"} ${first}/${answered}</div><p>right on the first try, without hints (${pct}%).</p>
      ${weak.length ? `<p class="small">Still shaky: ${weak.map(v => `<b class="jp">${v.stem}ます</b>`).join(" · ")} — they will come up more often.</p>` : ""}
      <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Another round</button><a class="btn" href="#/">Change what I train</a></div></div>`;
    if (pct >= 90 && answered >= 5) confetti();
  };
  show();
}

// one typed-sentence card
function ask(it, head, doneOnce) {
  keyHandler = null;
  app._it = it;
  let fired = false, hinted = false, open = true; const done = (ok, clean) => { if (fired) return; fired = true; doneOnce(ok, clean); };
  app.innerHTML = `${head}<div class="card stack">${it.prompt}${it.ask ? `<p class="small muted" style="margin:0;text-align:center">${it.ask}</p>` : ""}
    <input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the sentence (romaji → kana)">
    <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
  const inp = $("#in"); liveKana(inp); inp.focus(); if (it.say) speak(it.say);
  $("#hint").onclick = () => { hinted = true; $("#fb").innerHTML = `<div class="small muted">${it.hint}</div>`; inp.focus(); };
  const check = () => {
    if (!open) return;
    inp.value = finishKana(inp.value); const got = key(inp.value); if (!got) return;
    open = false; inp.disabled = true; $("#hint").style.display = "none";
    const ok = it.accept.has(got); beep(ok); speak(it.model);
    const model = `<div class="row">${spk(it.model)}<span class="ja jp" style="font-size:20px">${J(it.model)}</span></div>${trLine(it)}`;
    if (ok) {
      $("#fb").innerHTML = `<div class="fb ok"><div class="h">せいかい！ ✓${hinted ? " (with hint)" : ""}</div>${model}${it.why ? `<div class="small">🛠️ ${it.why}</div>` : ""}<div class="small" style="margin-top:6px">💡 ${rule(it.sc)}</div></div>`;
      $("#go").textContent = "Next →"; $("#go").onclick = () => done(true, !hinted); $("#go").focus();
      return;
    }
    const msgs = diagnose(inp.value, it.sc);
    $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet — a correct sentence:</div>${model}${it.why ? `<div class="small">🛠️ ${it.why}</div>` : ""}
      ${msgs.length ? `<ul class="diag">${msgs.map(m => `<li>${m}</li>`).join("")}</ul>` : `<div class="small">The parts look right — check the order and spelling against the model.</div>`}
      <div class="small" style="margin-top:6px">💡 ${rule(it.sc)}</div></div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><button class="btn" id="mine">✓ Mine means the same</button><button class="btn primary" id="nx">Next →</button></div>`;
    $("#go").style.display = "none";
    $("#nx").onclick = () => done(false, false); $("#nx").focus(); $("#mine").onclick = () => done(true, false);
  };
  $("#go").onclick = check; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); check(); } };
}

// particle card: one small field after every word; leave it empty where nothing belongs
function askGaps(it, head, doneOnce) {
  keyHandler = null;
  app._it = it;
  let fired = false, open = true; const done = (ok, clean) => { if (fired) return; fired = true; doneOnce(ok, clean); };
  const ps = it.gaps, slots = ps.map((p, k) => k).filter(k => k < ps.length - 1);
  app.innerHTML = `${head}<div class="card stack"><p class="small muted" style="margin:0">Type the particle after each word — or leave the field empty if nothing belongs there.</p>
    <div class="gapline jp">${ps.map(([w], k) => `<span class="gw">${J(w)}</span>${k < ps.length - 1 ? `<input class="gp-in" data-k="${k}" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="4">` : "。"}`).join("")}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
  const ins = $$(".gp-in"); ins.forEach(x => liveKana(x)); ins[0].focus();
  const okFor = (k, val) => {
    const want = ps[k][1], got = key(finishKana(val)).replace(/[x×✕\-ー]/g, "");
    if (!want) return got === "";
    const alts = [want, ...(ps[k][2] === "P" && it.sc.v.role === "from" && !it.mixed ? ["から"] : [])];
    return alts.some(a => key(a) === got);
  };
  const check = () => {
    if (!open) { done(false, false); return; }
    open = false;
    const res = slots.map(k => okFor(k, ins[k].value)), ok = res.every(Boolean);
    ins.forEach((x, k) => { x.value = finishKana(x.value); x.disabled = true; x.classList.add(res[k] ? "ok" : "no"); if (!res[k]) x.insertAdjacentHTML("afterend", `<span class="gfix jp">${ps[k][1] || "✕"}</span>`); });
    beep(ok); speak(it.model);
    const notes = [];
    ps.forEach(([w, p, t], k) => { if (k < ps.length - 1 && !res[k]) notes.push(!p ? `<span class="jp">${w}</span> takes nothing — it is not a clock time or date.` : t === "C" ? `Clock time → <b class="jp">に</b>.` : t === "P" ? `The person → <b class="jp">に</b>.` : t === "O" ? `The thing → <b class="jp">を</b>.` : `<span class="jp">${w}<b>${p}</b></span>`); });
    $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "Not yet"}</div><div class="row">${spk(it.model)}<span class="ja jp" style="font-size:20px">${J(it.model)}</span></div>${trLine(it)}
      ${notes.length ? `<ul class="diag">${notes.map(m => `<li>${m}</li>`).join("")}</ul>` : ""}${it.mixed ? "" : `<div class="small" style="margin-top:6px">💡 ${rule(it.sc)}</div>`}</div>`;
    $("#go").textContent = "Next →"; $("#go").onclick = () => done(ok, true); $("#go").focus();
  };
  $("#go").onclick = check;
  ins.forEach((x, k) => x.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (ins[k + 1] && open) ins[k + 1].focus(); else check(); } });
}

// one-word card: the meaning is given, the sentence has a single gap (a particle or the verb).
// A right answer moves on by itself after a moment, so a round goes quickly.
function askOne(it, head, doneOnce) {
  keyHandler = null; app._it = it;
  let fired = false, hinted = false, open = true, timer = null;
  const done = (ok, clean) => { if (fired) return; fired = true; clearTimeout(timer); doneOnce(ok, clean); };
  const ps = it.gaps, k = it.k, [word, want, tag] = ps[k];
  const field = `<input class="gp-in ${it.verbGap ? "wide" : ""}" id="in" autocomplete="off" autocapitalize="off" spellcheck="false">`;
  const line = ps.map(([w, pt], i) => i === k ? (it.verbGap ? field : `<span class="gw">${J(w)}</span>${field}`) : `<span class="gw">${J(w)}</span><span class="gpart">${pt}</span>`).join("") + "。";
  app.innerHTML = `${head}<div class="card stack">${trLine(it).replace("tr-line", "tr-line big")}
    <div class="gapline jp">${line}</div>
    <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button>
      <span class="row">${it.verbGap ? "" : `<button class="btn" id="none">✕ nothing</button>`}<button class="btn primary" id="go">Check</button></span></div><div id="fb"></div></div>`;
  const inp = $("#in"); liveKana(inp); inp.focus();
  const accept = it.verbGap ? [word] : [want, ...(tag === "P" && it.sc.v.role === "from" && !it.mixed ? ["から"] : [])];
  $("#hint").onclick = () => {
    hinted = true;
    $("#fb").innerHTML = `<div class="small muted">${it.verbGap ? `The verb is <b class="jp">${it.sc.v.stem}ます</b> (${esc(mean(it.sc.v))}) — now choose ます or ました.`
      : tag === "T" ? "Does this time word contain a number?" : tag === "C" ? "A clock time is a point in time." : tag === "P" ? "Who does it go to, or come from?" : "What job does this word have: topic, thing, place, tool, companion?"}</div>`;
    inp.focus();
  };
  const settle = raw => {
    if (!open) return; open = false;
    const got = key(finishKana(raw)).replace(/[x×✕\-ー]/g, ""), ok = accept.some(a => key(a) === got);
    inp.value = raw === "" ? "✕" : finishKana(raw); inp.disabled = true; inp.classList.add(ok ? "ok" : "no"); $("#hint").style.display = "none"; $("#none")?.remove();
    beep(ok); speak(it.model);
    const model = `<div class="row">${spk(it.model)}<span class="ja jp" style="font-size:20px">${J(it.model)}</span></div>`;
    if (ok) {
      $("#fb").innerHTML = `<div class="fb ok"><div class="h">せいかい！ ✓</div>${model}</div>`;
      $("#go").textContent = "Next →"; $("#go").onclick = () => done(true, !hinted); $("#go").focus();
      timer = setTimeout(() => done(true, !hinted), 1100);
      return;
    }
    let why;
    if (it.verbGap) why = diagnose(raw, it.sc).filter(m => /ます|ました/.test(m))[0] || `The verb here is <b class="jp">${word}</b>.`;
    else why = !want ? `<span class="jp">${word}</span> takes nothing — it is not a clock time or date.` : tag === "C" ? `A clock time is a point in time → <b class="jp">に</b>.`
      : tag === "P" ? ROLES[it.sc.v.role].rule : tag === "O" ? `The thing takes <b class="jp">を</b>.` : tag === "S" ? `The subject is the topic → <b class="jp">は</b>.`
      : ({ "と": "Together with someone → <b class=\"jp\">と</b>.", "で": "The tool, the language or the place of an action → <b class=\"jp\">で</b>.", "へ": "Where you are heading → <b class=\"jp\">へ</b>.", "に": "The person the action goes to (or the one you meet) → <b class=\"jp\">に</b>.",
          "を": "The thing the action is done to → <b class=\"jp\">を</b>.", "から": "Starting point → <b class=\"jp\">から</b>.", "まで": "End point → <b class=\"jp\">まで</b>.", "は": "The topic → <b class=\"jp\">は</b>." })[want];
    $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet — it is <b class="jp">${want || (it.verbGap ? word : "✕ nothing")}</b></div>${model}<div class="small" style="margin-top:6px">💡 ${why}</div></div>`;
    $("#go").textContent = "Next →"; $("#go").onclick = () => done(false, false); $("#go").focus();
  };
  $("#go").onclick = () => { if (inp.value.trim()) settle(inp.value); };
  if ($("#none")) $("#none").onclick = () => settle("");
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (inp.value.trim()) settle(inp.value); } };
}

// ---------- sort the verbs (worksheet part 1) ----------
function sortGame() {
  const queue = shuffle(NI_VERBS); let i = 0, first = 0; const total = queue.length;
  const show = () => {
    if (i >= queue.length) {
      const s = first === total ? 3 : first >= total - 2 ? 2 : 1; setStars("sort", s); addXP(first * 3);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">🗂️ ${first}/${total}</div><p>${starStr(s)} sorted right on the first try.</p>
        <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button><a class="btn" href="#/">Now make sentences →</a></div></div>`;
      if (s === 3) confetti(); return;
    }
    const v = queue[i];
    app.innerHTML = `${backBtn}<div class="plabel"><span>🗂️ Sort · ${i + 1} / ${queue.length}</span><span>✓ ${first}</span></div><div class="progress"><div style="width:${i / queue.length * 100}%"></div></div>
      <div class="card stack"><div class="rush-card"><span class="emo">${v.ico}</span><span class="jp">${J(v.stem + "ます")}</span></div><p class="small muted" style="text-align:center;margin:0">${esc(mean(v))} — which に goes with it?</p>
      <div class="opts">${Object.entries(ROLES).map(([id, r], k) => `<button class="opt" data-r="${id}"><span class="key">${k + 1}</span>${r.ico} ${r.name} <span class="small muted" style="font-family:var(--ui)">${id === "time" ? "10じ<b>に</b>" : id === "to" ? "🙂 → 👤<b>に</b>" : "🙂 ← 👤<b>に</b>"}</span></button>`).join("")}</div><div id="fb"></div></div>`;
    speak(v.stem + "ます");
    let answered = false;
    const choose = b => {
      if (answered) return; answered = true;
      const ok = b.dataset.r === v.role; beep(ok);
      $$(".opt").forEach(x => { x.disabled = true; if (x.dataset.r === v.role) x.classList.add("right"); }); if (!ok) b.classList.add("wrong");
      if (ok && !v._again) first++; if (!ok) { v._again = true; queue.push(v); }
      const sc = makeScene(v), s = sentence(parts(sc));
      $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "✗ " + ROLES[v.role].ico + " " + ROLES[v.role].name}</div><div class="row">${spk(s)}<span class="ja jp">${J(s)}</span></div>${trLine({ sc })}<div class="small">💡 ${ROLES[v.role].rule}</div></div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
      $("#nx").onclick = () => { i++; show(); }; $("#nx").focus();
    };
    $$(".opt").forEach(b => b.onclick = () => choose(b));
    keyHandler = e => { const b = $$(".opt")[+e.key - 1]; if (b) choose(b); };
  };
  queue.forEach(v => delete v._again);
  show();
}

// ---------- に map ----------
function map() {
  const pairs = [["age", "morai"], ["kashi", "kari"], ["oshie", "narai"]];
  app.innerHTML = `${backBtn}<h2>🗺️ に map</h2><p class="sub">One particle, three jobs. Read it once, then go and produce sentences.</p>
  <div class="stack">
  <div class="card gp"><h3>① 🕐 A point in time</h3>
    <div class="pattern jp"><span class="slot">CLOCK TIME</span> に <span class="slot">VERB</span></div>
    ${ex("わたしは まいばん じゅうじに ねます。", "Ich gehe jeden Abend um zehn schlafen.")}${ex("かいぎは ごじに おわります。", "Die Besprechung endet um fünf.")}
    <table class="t jp"><tr><th>with に</th><th>without に</th></tr><tr><td>10じ<b>に</b> · 7じはん<b>に</b> · 5がつ<b>に</b> · とおか<b>に</b></td><td>きょう · きのう · あした · まいばん · まいあさ · まいにち · せんしゅう · らいしゅう · いま</td></tr></table>
    <div class="tip"><b>Test:</b> does the word contain a number? Then に. Words that point from “now” (きのう, あした, まい～) take nothing. Days of the week can go either way.</div></div>
  <div class="card gp"><h3>② → The person an action goes to</h3>
    <div class="pattern jp">わたしは <span class="slot">PERSON</span> に <span class="slot">THING</span> を <span class="slot">VERB</span></div>
    <p class="jp" style="text-align:center;font-size:18px">🙂 ⟶ 👤<b class="hl-p">に</b></p>
    ${ex("わたしは ともだちに でんわを かけます。", "Ich rufe einen Freund an.")}${ex("わたしは ははに はなを あげました。", "Ich habe meiner Mutter Blumen geschenkt.")}
    <p class="jp">${["age", "kashi", "oshie", "kake", "okuri"].map(id => J(V(id).stem + "ます")).join(" · ")}</p></div>
  <div class="card gp"><h3>③ ← The person it comes from</h3>
    <div class="pattern jp">わたしは <span class="slot">PERSON</span> に <span class="slot">THING</span> を <span class="slot">VERB</span></div>
    <p class="jp" style="text-align:center;font-size:18px">🙂 ⟵ 👤<b class="hl-p">に</b></p>
    ${ex("わたしは タイの ともだちに タイごを ならいます。", "Ich lerne Thai von einem thailändischen Freund.")}${ex("わたしは せんせいに ほんを かりました。", "Ich habe mir vom Lehrer ein Buch geliehen.")}
    <p class="jp">${["morai", "kari", "narai"].map(id => J(V(id).stem + "ます")).join(" · ")}</p>
    <div class="tip">Here <b class="jp">から</b> works too: <span class="jp">せんせい<b>から</b> かりました</span>. The sentence pattern is identical to ② — only the verb tells you the direction.</div></div>
  <div class="card gp"><h3>④ One event, two sentences</h3>
    <table class="t jp"><tr><th>🙂 gives →</th><th>← 🙂 gets</th></tr>${pairs.map(([a, b]) => `<tr><td>${J(V(a).stem + "ます")} <span class="small muted" style="font-family:var(--ui)">${esc(mean(V(a)))}</span></td><td>${J(V(b).stem + "ます")} <span class="small muted" style="font-family:var(--ui)">${esc(mean(V(b)))}</span></td></tr>`).join("")}</table>
    ${ex("たなかさんは ミラーさんに ほんを かしました。", "Herr Tanaka hat Herrn Miller ein Buch geliehen.")}${ex("ミラーさんは たなかさんに ほんを かりました。", "Herr Miller hat sich von Herrn Tanaka ein Buch geliehen.")}
    <div class="tip"><b>あげます never points at わたし.</b> <span class="jp">✗ ともだちは わたしに はなを あげました</span> → say it from your side: <span class="jp">わたしは ともだちに はなを もらいました</span>.</div></div>
  <div class="card gp"><h3>📝 Worksheet solution</h3>
    <details><summary>Show the three groups</summary>
      <p class="jp">1. 🕐 ${J("ねます")} · ${J("おきます")} · ${J("おわります")}</p><p class="jp">2. → ${J("かけます")} · ${J("かします")} · ${J("おくります")} · ${J("あげます")}</p><p class="jp">3. ← ${J("ならいます")} · ${J("もらいます")} · ${J("かります")}</p>
      <p class="small muted">Your おきます in group 1 is right. Example sentences for the lines:</p>
      ${ex("わたしは まいあさ しちじに おきます。", "Ich stehe jeden Morgen um sieben auf.")}${ex("しごとは ろくじに おわります。", "Die Arbeit endet um sechs.")}
      ${ex("わたしは ともだちに かさを かしました。", "Ich habe einem Freund einen Schirm geliehen.")}${ex("わたしは かぞくに にもつを おくります。", "Ich schicke meiner Familie ein Paket.")}${ex("わたしは かのじょに とけいを あげました。", "Ich habe meiner Freundin eine Uhr geschenkt.")}
      ${ex("わたしは ちちに おかねを もらいました。", "Ich habe von meinem Vater Geld bekommen.")}${ex("わたしは ミラーさんに じしょを かりました。", "Ich habe mir von Herrn Miller ein Wörterbuch geliehen.")}
    </details></div>
  <div class="row center" style="justify-content:center"><a class="btn primary" href="#/">🥋 To the dojo →</a></div></div>`;
}

// ---------- routes ----------
const MODES = [
  { id: "round", fn: () => round(), t: "Round" },
  { id: "sort", fn: () => sortGame(), t: "Sort the verbs" },
  { id: "map", fn: () => map(), t: "に map" },
];
function home() { dash(); }
ROUTES[""] = dash;
boot();
