"use strict";
/* Lektion 10 — あります / います trainer. Plain JS, no build step. */

const app = document.getElementById("app");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// {漢字|かな} → ruby; leaves HTML from trusted data strings intact.
const ruby = s => String(s || "").replace(/\{([^|{}]+)\|([^{}]+)\}/g, "<ruby>$1<rt>$2</rt></ruby>");
const plain = s => String(s || "").replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$2").replace(/<[^>]+>/g, "");
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const sample = (a, n) => shuffle(a).slice(0, n);
const vById = id => VOCAB.find(v => v.id === id);
const jpOf = v => v.kanji ? ruby(v.kanji) : esc(v.kana);

// ---------- romaji ----------
const ROMAJI = (() => {
  const t = {};
  const rows = { "": "あいうえお", k: "かきくけこ", s: "さしすせそ", t: "たちつてと", n: "なにぬねの", h: "はひふへほ",
    m: "まみむめも", y: "や-ゆ-よ", r: "らりるれろ", w: "わ---を", g: "がぎぐげご", z: "ざじずぜぞ", d: "だぢづでど",
    b: "ばびぶべぼ", p: "ぱぴぷぺぽ" };
  for (const [c, kana] of Object.entries(rows)) [..."aiueo"].forEach((v, i) => { if (kana[i] !== "-") t[c + v] = kana[i]; });
  Object.assign(t, { shi: "し", chi: "ち", tsu: "つ", fu: "ふ", ji: "じ", si: "し", ti: "ち", tu: "つ", hu: "ふ", zi: "じ",
    wo: "を", "-": "ー", xtsu: "っ", ltsu: "っ", xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ", xya: "ゃ", xyu: "ゅ", xyo: "ょ", fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ", thi: "てぃ", di: "でぃ", vu: "ゔ" });
  const youon = { ky: "き", sh: "し", ch: "ち", ny: "に", hy: "ひ", my: "み", ry: "り", gy: "ぎ", j: "じ", by: "び", py: "ぴ", sy: "し", zy: "じ", ty: "ち", jy: "じ", cy: "ち" };
  for (const [c, base] of Object.entries(youon)) { t[c + "a"] = base + "ゃ"; t[c + "u"] = base + "ゅ"; t[c + "o"] = base + "ょ"; }
  t.she = "しぇ"; t.che = "ちぇ"; t.je = "じぇ";
  return t;
})();
function romajiToKana(text) {
  const s = text.toLowerCase();
  let out = "", i = 0;
  while (i < s.length) {
    const c = s[i], next = s[i + 1];
    if (!/[a-z'-]/.test(c)) { out += c; i++; continue; }
    if (c === "n" && next === "'") { out += "ん"; i += 2; continue; }
    if (c === "n" && next === "n") { out += "ん"; i += /[aiueoy]/.test(s[i + 2] || "") ? 1 : 2; continue; }
    if (c === "n" && (next === undefined || !/[aiueoy]/.test(next))) { out += "ん"; i++; continue; }
    if (c === next && /[bcdfghjkmpqrstvwxz]/.test(c)) { out += "っ"; i++; continue; }
    const len = [4, 3, 2, 1].find(n => ROMAJI[s.slice(i, i + n)]);
    if (len) { out += ROMAJI[s.slice(i, i + len)]; i += len; } else { out += c; i++; }
  }
  return out;
}
const toHira = s => [...s].map(c => { const cp = c.codePointAt(0); return cp >= 0x30a1 && cp <= 0x30f6 ? String.fromCodePoint(cp - 0x60) : c; }).join("");
const norm = s => toHira(String(s).replace(/[\s。、．，.,!?！？～~\[\]［］]/g, "").toLowerCase());
const KANA_RO = (() => {
  const skip = new Set(["si", "ti", "tu", "hu", "zi", "sya", "syu", "syo", "zya", "zyu", "zyo", "tya", "tyu", "tyo", "jya", "jyu", "jyo", "cya", "cyu", "cyo", "-", "wo"]);
  const m = { "を": "o", "ー": "-" };
  for (const [r, k] of Object.entries(ROMAJI)) if (!skip.has(r) && !r.startsWith("x") && !r.startsWith("l") && !(k in m)) m[k] = r;
  return m;
})();
function kanaToRomaji(text) {
  const s = toHira(plain(text)).replace(/は(?=[\s、。]|$)/g, "わ").replace(/(\S)へ(?=[\s、。])/g, "$1え");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (s[i] === "っ") { const nx = KANA_RO[s.slice(i + 1, i + 3)] || KANA_RO[s[i + 1]] || ""; out += nx[0] === "c" ? "t" : (nx[0] || ""); continue; }
    if (s[i] === "ん") { out += "n"; continue; }
    if (s[i] === "ー") { out += out.slice(-1); continue; }
    if (KANA_RO[two] && two.length === 2 && /[ゃゅょぁぃぅぇぉ]/.test(two[1])) { out += KANA_RO[two]; i++; continue; }
    out += KANA_RO[s[i]] ?? s[i];
  }
  return out;
}
// sentence romaji with particle readings
function sentRomaji(tokens) {
  return tokens.map(t => t === "は" ? "wa" : t === "へ" ? "e" : t === "を" ? "o" : kanaToRomaji(t)).join(" ");
}

// ---------- speech ----------
let jaVoice = null;
function loadVoice() { const vs = speechSynthesis.getVoices(); jaVoice = vs.find(v => v.lang === "ja-JP" && /Kyoko|O-Ren|Google|Nanami/i.test(v.name)) || vs.find(v => v.lang && v.lang.startsWith("ja")) || null; }
if ("speechSynthesis" in window) { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; }
function speak(text, rate = 0.85) {
  if (!("speechSynthesis" in window) || !state.sound) return;
  const t = plain(text).replace(/[\[\]～]/g, "").replace(/ATM/g, "エーティーエム");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = "ja-JP"; u.rate = rate; if (jaVoice) u.voice = jaVoice;
  speechSynthesis.speak(u);
}
const spk = text => `<button class="speak" data-say="${esc(plain(text))}" title="Listen" aria-label="Listen">🔊</button>`;
document.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) { e.stopPropagation(); speak(b.dataset.say); } });

// little sound effects (WebAudio, no files)
let actx = null;
function beep(ok) {
  if (!state.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = "sine"; o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    if (ok) { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(990, t + 0.08); }
    else { o.frequency.setValueAtTime(220, t); o.frequency.setValueAtTime(160, t + 0.1); }
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t); o.stop(t + 0.26);
  } catch (_) {}
}

// ---------- state ----------
const KEY = "lesson10.v1";
const state = Object.assign({ xp: 0, stars: {}, words: {}, furi: true, romaji: false, labels: true, sound: true, lang: "de", you: {}, streak: 0, lastDay: "" }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } })());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
(function dayStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDay === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  state.streak = state.lastDay === y ? state.streak + 1 : 1;
  state.lastDay = today; save();
})();
const LEVELS = ["🥚 たまご", "🐣 ひよこ", "🐈 ねこ", "🐕 いぬ", "🐼 パンダ", "🐘 ぞう", "🌳 き", "🏯 しろ", "🗻 ふじさん"];
function addXP(n) { state.xp += n; save(); drawTop(); }
function setStars(mode, n) { if ((state.stars[mode] || 0) < n) { state.stars[mode] = n; save(); } }
function word(id, delta) { if (!id) return; state.words[id] = Math.max(0, Math.min(5, (state.words[id] || 0) + delta)); save(); }
const meaning = v => state.lang === "de" ? v.de : v.en;
const other = v => state.lang === "de" ? v.en : v.de;

function drawTop() {
  const lv = Math.min(LEVELS.length - 1, Math.floor(state.xp / 200));
  const pct = lv === LEVELS.length - 1 ? 100 : (state.xp % 200) / 2;
  $("#xp").innerHTML = `<span title="Daily streak">🔥 <b>${state.streak}</b></span><span class="lvl">Lv ${lv + 1}</span><span>${LEVELS[lv]}</span><div class="xpbar"><div style="width:${pct}%"></div></div><span><b>${state.xp}</b> XP</span>`;
  document.body.classList.toggle("no-furi", !state.furi);
  document.body.classList.toggle("no-romaji", !state.romaji);
  document.body.classList.toggle("hide-labels", !state.labels);
  $("#settings").innerHTML = [
    ["furi", "ふりがな"], ["romaji", "romaji"], ["labels", "labels"], ["sound", "🔊 sound"],
  ].map(([k, l]) => `<span class="chip ${state[k] ? "on" : ""}" data-set="${k}">${l}</span>`).join("") +
    `<span class="chip on" data-set="lang">${state.lang === "de" ? "🇩🇪 DE" : "🇬🇧 EN"}</span>`;
}
document.addEventListener("click", e => {
  const c = e.target.closest("[data-set]"); if (!c) return;
  const k = c.dataset.set;
  if (k === "lang") state.lang = state.lang === "de" ? "en" : "de"; else state[k] = !state[k];
  save(); drawTop(); if (k === "lang") route();
});

function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); }
function confetti(n = 40) {
  const set = ["🎉", "✨", "🐈", "🐕", "🐼", "🐘", "🌸", "⭐"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span"); s.className = "confetti"; s.textContent = pick(set);
    s.style.left = Math.random() * 100 + "vw"; s.style.animationDuration = 1.6 + Math.random() * 1.8 + "s"; s.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(s); setTimeout(() => s.remove(), 4200);
  }
}
const starStr = n => "★".repeat(n) + "☆".repeat(3 - n);
const backBtn = `<button class="back" onclick="location.hash='#/'">← Lesson map</button>`;

// ---------- lesson map ----------
const MODES = [
  { id: "vocab", ico: "🃏", t: "1 · Vocabulary cards", d: "Flip cards with pictures and audio. Mark what you know." },
  { id: "grammar", ico: "📐", t: "2 · Grammar in pictures", d: "あります vs います, に/が/は, positions, や…など." },
  { id: "rush", ico: "⚡", t: "3 · あります or います?", d: "45-second sorting rush. Alive and moving → います." },
  { id: "where", ico: "🔎", t: "4 · Where is it?", d: "Read the picture, then place things where the sentence says." },
  { id: "scene", ico: "🏠", t: "5 · Explore room & town", d: "Tap things to hear where they are, then solve the hunt." },
  { id: "build", ico: "🧩", t: "6 · Sentence builder", d: "Put the tiles in order. Particles are red, verbs blue." },
  { id: "memory", ico: "🧠", t: "7 · Memory match", d: "Find the pairs: picture ↔ word." },
  { id: "type", ico: "⌨️", t: "8 · Spell it", d: "Type the word in kana or romaji." },
  { id: "store", ico: "🛒", t: "9 · Asia Store role-play", d: "Find the shop, ask for ナンプラー, help customers." },
  { id: "quiz", ico: "✅", t: "10 · Grammar check", d: "Tricky particle questions with explanations." },
  { id: "worksheet", ico: "📝", t: "11 · My worksheet F㊴", d: "Feedback on your answers, with corrections." },
  { id: "you", ico: "💬", t: "12 · Talk about you", d: "Answer worksheet part <5> about your own home." },
  { id: "boss", ico: "🐉", t: "13 · Boss exam", d: "20 mixed questions. Score 80 % to beat the dragon." },
];
function home() {
  const total = MODES.length * 3, got = MODES.reduce((s, m) => s + (state.stars[m.id] || 0), 0);
  const known = VOCAB.filter(v => (state.words[v.id] || 0) >= 2).length;
  app.innerHTML = `
    <h2>Lektion 10 — <span class="jp">あります・います</span></h2>
    <p class="sub">There is / where is — things, people, animals and where they are. Work down the path; every game gives XP. ⭐ ${got}/${total} · words known ${known}/${VOCAB.length}</p>
    <div class="path">${MODES.map(m => `
      <a class="tile step" href="#/${m.id}"><span class="num">${starStr(state.stars[m.id] || 0)}</span>
        <span class="ico">${m.ico}</span><h4>${m.t}</h4><p>${m.d}</p></a>`).join("")}
    </div>
    <p class="small muted" style="margin-top:20px">Tip: turn off <b>ふりがな</b> and <b>labels</b> at the top for extra challenge. Progress is saved in this browser.
      <button class="back" id="reset">Reset progress</button></p>`;
  $("#reset").onclick = () => { if (confirm("Delete all progress for Lesson 10?")) { localStorage.removeItem(KEY); location.reload(); } };
}

// ---------- 1. vocab ----------
function vocab() {
  const cats = [...new Set(VOCAB.map(v => v.cat))];
  app.innerHTML = `${backBtn}<h2>Vocabulary</h2><p class="sub">Tap a word to hear it. Green = known, orange = learning. Start a flashcard round below.</p>
    <div class="row" style="margin-bottom:12px">
      <button class="btn primary" data-fc="all">🃏 All words</button>
      <button class="btn" data-fc="weak">💪 My weak words</button>
      ${cats.map(c => `<button class="btn" data-fc="${esc(c)}">${esc(c)}</button>`).join("")}
    </div>
    <label class="small muted"><input type="checkbox" id="rev"> Reverse: show meaning, guess Japanese</label>
    ${cats.map(c => `<h3>${esc(c)}</h3><div class="vgrid">${VOCAB.filter(v => v.cat === c).map(v => {
      const m = state.words[v.id] || 0;
      return `<div class="vcell ${m >= 2 ? "m2" : m >= 1 ? "m1" : ""}" data-say="${esc(v.kana)}"><span class="e">${v.emo}</span><span><span class="k jp">${jpOf(v)}</span><br><span class="ro">${kanaToRomaji(v.kana)}</span><span class="m"> ${esc(meaning(v))}</span></span></div>`;
    }).join("")}</div>`).join("")}`;
  $$("[data-fc]").forEach(b => b.onclick = () => {
    const k = b.dataset.fc;
    let list = k === "all" ? VOCAB : k === "weak" ? VOCAB.filter(v => (state.words[v.id] || 0) < 2) : VOCAB.filter(v => v.cat === k);
    if (!list.length) { toast("No weak words — great! 🎉"); return; }
    flashcards(shuffle(list), $("#rev").checked);
  });
}
function flashcards(deck, reverse) {
  let i = 0, known = 0; const start = deck.length;
  const again = [];
  const show = () => {
    if (i >= deck.length) {
      if (again.length) { deck = deck.concat(shuffle(again.splice(0))); }
      else {
        const s = known / start >= 0.9 ? 3 : known / start >= 0.6 ? 2 : 1; setStars("vocab", s); addXP(known * 2);
        app.innerHTML = `${backBtn}<div class="card center stack"><div class="result-big">🎉 ${known}/${start}</div><p>first-try known. ${starStr(s)}</p>
          <div class="row center"><button class="btn primary" onclick="location.hash='#/vocab';route()">More cards</button></div></div>`;
        if (s === 3) confetti(); return;
      }
    }
    const v = deck[i];
    const jp = `<div class="big jp">${jpOf(v)}</div><div class="ro">${kanaToRomaji(v.kana)}</div>`;
    const mean = `<div class="mean">${esc(meaning(v))}</div><div class="en">${esc(other(v))}</div>`;
    const kindNote = v.kind === "i" ? `<div class="small hl-i">alive & moves → います</div>` : v.kind === "a" ? `<div class="small hl-a">thing / place → あります</div>` : "";
    app.innerHTML = `${backBtn}<div class="plabel"><span>Card ${i + 1} / ${deck.length}</span><span>${esc(v.cat)}</span></div>
      <div class="progress"><div style="width:${i / deck.length * 100}%"></div></div>
      <div class="fc-wrap"><div class="fc" id="fc">
        <div class="face"><span class="cat-tag">${reverse ? "What's this in Japanese?" : "What does it mean?"}</span><div class="emo">${v.emo}</div>${reverse ? mean : jp}</div>
        <div class="face back-f"><div class="emo">${v.emo}</div>${jp}${mean}${kindNote}</div>
      </div></div>
      <p class="small muted center" style="text-align:center">Tap the card (or Space) to flip</p>
      <div class="row center" style="justify-content:center"><button class="btn" id="ag">↺ Again</button>${spk(v.kana)}<button class="btn good" id="ok">✓ Got it</button></div>`;
    const fc = $("#fc");
    const flip = () => { fc.classList.toggle("flip"); if (fc.classList.contains("flip")) speak(v.kana); };
    fc.onclick = flip;
    if (!reverse) speak(v.kana);
    const next = ok => { if (ok) { if (!v._again) known++; word(v.id, 1); addXP(1); } else { v._again = true; word(v.id, -1); again.push(v); } i++; show(); };
    $("#ok").onclick = () => next(true); $("#ag").onclick = () => next(false);
    keyHandler = e => { if (e.key === " ") { e.preventDefault(); flip(); } else if (e.key === "ArrowRight" || e.key === "Enter") next(true); else if (e.key === "ArrowLeft") next(false); };
  };
  deck.forEach(v => delete v._again);
  show();
}

// ---------- 2. grammar notes ----------
function ex(ja, tr) { return `<div class="ex">${spk(ja)}<div class="t"><div class="ja">${ruby(ja)}</div><div class="ro">${esc(kanaToRomaji(ja))}</div><div class="tr">${tr}</div></div></div>`; }
function grammar() {
  const posGrid = [["", "うえ<br>{上|うえ}", ""], ["ひだり<br>{左|ひだり}", "📦<br><b>なか {中|なか}</b>", "みぎ<br>{右|みぎ}"], ["", "した<br>{下|した}", ""]];
  app.innerHTML = `${backBtn}<h2>Grammar in pictures</h2><p class="sub">Six points. Tap 🔊 to hear each example. Then play the games!</p>
  <div class="stack">
  <div class="card gp"><h3>① あります vs います — “there is / exists”</h3>
    <table class="t"><tr><th></th><th>use for</th><th>examples</th></tr>
    <tr><td class="hl-i jp" style="font-size:20px">います</td><td>living things that <b>move by themselves</b>: people, animals</td><td style="font-size:24px">👨 👧 🐕 🐈 🐼 🐘 🐠</td></tr>
    <tr><td class="hl-a jp" style="font-size:20px">あります</td><td><b>things, places, plants</b>, events</td><td style="font-size:24px">📦 🔋 🛏️ 🏪 🌳 🌷 🚗</td></tr></table>
    <div class="tip"><b>Trap:</b> trees and flowers are alive but don't walk → <span class="jp">あります</span>. Cars, taxis, robots → <span class="jp">あります</span> (textbook rule).</div>
    <div class="tip"><b>Negative:</b> <span class="jp">ありません / いません</span> — “there isn't”.</div>
  </div>

  <div class="card gp"><h3>② “At PLACE there is N” — new information</h3>
    <div class="pattern jp"><span class="slot">PLACE</span> に <span class="slot">N</span> が あります／います</div>
    ${ex("こうえんに おとこの ひとが います。", "Im Park ist ein Mann. / There is a man in the park.")}
    ${ex("へやに テーブルが あります。", "Im Zimmer ist ein Tisch. / There is a table in the room.")}
    <p>Ask with <b class="jp">なにが</b> (things, animals) or <b class="jp">だれが</b> (people):</p>
    ${ex("にわに だれが いますか。 —— おんなの こが います。", "Wer ist im Garten? — Ein Mädchen.")}
    ${ex("はこの なかに なにが ありますか。 —— でんちが あります。", "Was ist in der Schachtel? — Eine Batterie.")}
    <div class="tip"><b>Remember:</b> question words never take は → always <span class="jp">なにが・だれが</span>. And for animals ask <span class="jp">なにが いますか</span>, not だれ.</div>
  </div>

  <div class="card gp"><h3>③ “N is at PLACE” — N is already known (topic)</h3>
    <div class="pattern jp"><span class="slot">N</span> は <span class="slot">PLACE</span> に あります／います</div>
    ${ex("ミラーさんは かいぎしつに います。", "Herr Miller ist im Konferenzraum.")}
    ${ex("ATMは コンビニに あります。", "Der Geldautomat ist im Konbini.")}
    <p>Question: <b class="jp">N は どこに ありますか／いますか</b>. Short form: <b class="jp">N は PLACE です</b>.</p>
    ${ex("すみません。アジアストアは どこですか。 —— あの ビルの なかです。", "Entschuldigung, wo ist der Asia Store? — In dem Gebäude dort.")}
    <div class="tip"><b>② vs ③:</b> ② tells you <i>what</i> is there (<span class="jp">…に ねこが います</span>). ③ tells you <i>where</i> a known thing is (<span class="jp">ねこは …に います</span>). Swap に-part and が/は-part, and が becomes は.</div>
  </div>

  <div class="card gp"><h3>④ Positions: <span class="jp">N₁ の POSITION</span></h3>
    <div class="pattern jp"><span class="slot">N₁</span> の <span class="slot">うえ</span> に N₂ が あります</div>
    <p>N₁ is the reference point. <span class="jp">いすの した</span> = “the chair's below” = under the chair.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:360px;margin:10px auto;text-align:center" class="jp">
      ${posGrid.flat().map(c => `<div style="padding:8px;border-radius:8px;${c ? "background:var(--accent-soft)" : ""}">${ruby(c)}</div>`).join("")}
    </div>
    <table class="t jp"><tr><td>まえ {前|まえ}</td><td>in front</td><td>うしろ</td><td>behind</td></tr>
      <tr><td>そと {外|そと}</td><td>outside</td><td>ちかく {近|ちか}く</td><td>near</td></tr>
      <tr><td>となり {隣|となり}</td><td>next to (same kind: house–house, person–person)</td><td>あいだ {間|あいだ}</td><td>between: <b>A と B の あいだ</b></td></tr></table>
    ${ex("いすの したに ねこが います。", "Unter dem Stuhl ist eine Katze.")}
    ${ex("ぎんこうと コンビニの あいだに ATMが あります。", "Zwischen Bank und Konbini ist ein Geldautomat.")}
    ${ex("ナンプラーは いちばん したです。", "Nam pla ist ganz unten.")}
  </div>

  <div class="card gp"><h3>⑤ <span class="jp">N₁ や N₂ [など]</span> — “N₁, N₂ and so on”</h3>
    ${ex("はこの なかに てがみや しゃしんなどが あります。", "In der Schachtel sind Briefe, Fotos usw.")}
    <div class="tip"><b>と vs や:</b> <span class="jp">ほんと ノート</span> = book and notebook (that's all). <span class="jp">ほんや ノート</span> = books, notebooks … (there's more). <span class="jp">など</span> makes the “etc.” explicit.</div>
  </div>

  <div class="card gp"><h3>⑥ Nothing / nobody: <span class="jp">なにも・だれも</span> + negative</h3>
    ${ex("はこの なかに なにも ありません。", "In der Schachtel ist nichts.")}
    ${ex("へやに だれも いません。", "Im Zimmer ist niemand.")}
    <p class="small muted">が disappears: なにが → <b>なにも</b>, だれが → <b>だれも</b>.</p>
  </div>

  <div class="card gp"><h3>💬 Conversation phrases</h3>
    ${ex("すみません。ナンプラー、ありますか。", "Entschuldigung, haben Sie Nam pla?")}
    ${ex("あちらに タイりょうりの コーナーが ありますね。", "Dort drüben ist die Ecke für thailändische Küche.")}
    ${ex("[どうも] すみません。", "Vielen Dank! (wörtlich: Entschuldigung für die Mühe)")}
  </div>
  <div class="row center" style="justify-content:center"><a class="btn primary" href="#/rush">Play: あります or います? →</a></div>
  </div>`;
  setStars("grammar", 3);
}

// ---------- 3. sort rush ----------
function rush() {
  const pool = [...VOCAB.filter(v => v.kind === "a" || v.kind === "i"), ...EXTRA];
  app.innerHTML = `${backBtn}<h2>⚡ あります or います?</h2>
    <p class="sub">45 seconds. Sort as many as you can. Keys: <b>←</b> あります · <b>→</b> います. Combos give bonus points!</p>
    <div class="card center stack" style="text-align:center"><div style="font-size:60px">📦 vs 🐈</div><button class="btn primary" id="go">Start</button>
    ${state.stars.rushBest ? `<p class="muted small">Best: ${state.stars.rushBest}</p>` : ""}</div>`;
  $("#go").onclick = () => {
    let score = 0, combo = 0, left = 45, cur, mistakes = [], ended = false;
    app.innerHTML = `${backBtn}<div class="plabel"><span>Score <b id="sc">0</b></span><span class="combo" id="cb"></span><span id="tl">45 s</span></div>
      <div class="timer"><div id="tb" style="width:100%"></div></div>
      <div class="card" style="margin-top:12px"><div class="rush-card" id="rc"></div><p class="center small muted" id="rm" style="text-align:center;min-height:22px"></p>
      <div class="rush-btns"><button class="a" data-k="a">← あります</button><button class="i" data-k="i">います →</button></div></div>`;
    const next = () => { cur = pick(pool.filter(p => p !== cur)); $("#rc").innerHTML = `<span class="emo">${cur.emo}</span><span class="jp">${esc(cur.kana)}</span>`; };
    const answer = k => {
      if (ended) return;
      const rc = $("#rc");
      if (k === cur.kind) { combo++; score += combo >= 5 ? 2 : 1; beep(true); rc.classList.remove("pop"); void rc.offsetWidth; rc.classList.add("pop"); $("#rm").textContent = "";
        if (cur.id) word(cur.id, 0.5); }
      else { combo = 0; beep(false); rc.classList.remove("shake"); void rc.offsetWidth; rc.classList.add("shake"); mistakes.push(cur);
        $("#rm").innerHTML = `<span class="jp">${esc(cur.kana)}</span> → <b class="${cur.kind === "i" ? "hl-i" : "hl-a"}">${cur.kind === "i" ? "います" : "あります"}</b> (${cur.kind === "i" ? "alive & moving" : "thing / plant / place"})`; }
      $("#sc").textContent = score; $("#cb").textContent = combo >= 3 ? `🔥 combo ×${combo}${combo >= 5 ? " (double!)" : ""}` : "";
      next();
    };
    $$("[data-k]").forEach(b => b.onclick = () => answer(b.dataset.k));
    keyHandler = e => { if (e.key === "ArrowLeft") answer("a"); if (e.key === "ArrowRight") answer("i"); };
    next();
    const tm = setInterval(() => {
      left -= 0.1; const tb = $("#tb"); if (!tb) { clearInterval(tm); return; }
      tb.style.width = left / 45 * 100 + "%"; $("#tl").textContent = Math.ceil(left) + " s";
      if (left <= 0) {
        clearInterval(tm); ended = true;
        const s = score >= 28 ? 3 : score >= 18 ? 2 : 1; setStars("rush", s); addXP(score * 2);
        if (score > (state.stars.rushBest || 0)) { state.stars.rushBest = score; save(); }
        const uniq = [...new Set(mistakes)];
        app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${score}</div><p>${starStr(s)} · best ${state.stars.rushBest}</p>
          ${uniq.length ? `<div style="text-align:left"><b>Review:</b>${uniq.map(m => `<div class="jp" style="font-size:18px">${m.emo} ${esc(m.kana)} → <span class="${m.kind === "i" ? "hl-i" : "hl-a"}">${m.kind === "i" ? "います" : "あります"}</span></div>`).join("")}</div>` : "<p>No mistakes! 🎯</p>"}
          <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Play again</button><a class="btn" href="#/where">Next: Where is it? →</a></div></div>`;
        if (s === 3) confetti();
      }
    }, 100);
    timers.push(tm);
  };
}

// ---------- 4. where is it ----------
const ANCHORS = [
  { k: "いす", e: "🪑" }, { k: "き", e: "🌳" }, { k: "ベッド", e: "🛏️" }, { k: "くるま", e: "🚗" }, { k: "ドア", e: "🚪" }, { k: "テーブル", e: "table" }, { k: "つくえ", e: "table" },
];
const CONTAINERS = [{ k: "はこ" }, { k: "かばん" }, { k: "れいぞうこ" }, { k: "へや" }];
const TARGETS = [
  { k: "ねこ", e: "🐈", kind: "i" }, { k: "いぬ", e: "🐕", kind: "i" }, { k: "おとこのこ", e: "👦", kind: "i" }, { k: "おんなのこ", e: "👧", kind: "i" },
  { k: "パンダ", e: "🐼", kind: "i" }, { k: "でんち", e: "🔋", kind: "a" }, { k: "ほん", e: "📕", kind: "a" }, { k: "とけい", e: "⏰", kind: "a" }, { k: "はこ", e: "📦", kind: "a" }, { k: "かばん", e: "👜", kind: "a" },
];
const BUILDINGS = [{ k: "ビル", e: "🏢" }, { k: "コンビニ", e: "🏪" }, { k: "ぎんこう", e: "🏦" }, { k: "がっこう", e: "🏫" }, { k: "びょういん", e: "🏥" }, { k: "ゆうびんきょく", e: "🏤" }, { k: "ホテル", e: "🏨" }];
const POS = {
  "うえ": { x: 50, y: 20 }, "した": { x: 50, y: 88 }, "みぎ": { x: 81, y: 54 }, "ひだり": { x: 19, y: 54 },
  "まえ": { x: 37, y: 72, s: 1.3, z: 5 }, "うしろ": { x: 64, y: 33, s: 0.75, z: 0 },
};
const posHint = { "うえ": "on/above", "した": "under", "みぎ": "right", "ひだり": "left", "まえ": "in front", "うしろ": "behind", "なか": "inside", "そと": "outside", "となり": "next to", "あいだ": "between" };
const TABLE_POS = { "うえ": { x: 50, y: 40 }, "した": { x: 50, y: 66 } };
const posFor = (w, p) => (w.a.e === "table" && TABLE_POS[p]) || POS[p];

function anchorHTML(a, x = 50, y = 54) {
  if (a.e === "table") return `<div class="css-table obj" style="left:${x}%;top:${y + 6}%;width:30%;z-index:2"><div class="top"></div><div class="legs"><i></i><i></i></div><span class="lbl">${esc(a.k)}</span></div>`;
  return `<div class="obj" style="left:${x}%;top:${y}%;font-size:20cqw;z-index:2">${a.e}<span class="lbl">${esc(a.k)}</span></div>`;
}
function targetHTML(t, p, id = "tg") {
  return `<div class="obj" id="${id}" style="left:${p.x}%;top:${p.y}%;font-size:${9 * (p.s || 1)}cqw;z-index:${p.z ?? 4}">${t.e}<span class="lbl">${esc(t.k)}</span></div>`;
}
// Build one random "where" puzzle.
function makeWhere() {
  const r = Math.random();
  const t = pick(TARGETS);
  if (r < 0.62) { // object-relative
    const a = pick(ANCHORS);
    let positions = Object.keys(POS);
    if (a.e === "table") positions = positions.filter(p => p !== "うしろ");
    const p = pick(positions);
    return { type: "obj", a, t: t.k === a.k ? TARGETS[0] : t, p, opts: positions, ref: a.k };
  }
  if (r < 0.8) { // container
    const c = pick(CONTAINERS);
    const tt = c.k === "はこ" || c.k === "かばん" ? pick(TARGETS.filter(x => !["はこ", "かばん", "パンダ"].includes(x.k))) : t.k === c.k ? TARGETS[0] : t;
    return { type: "box", a: c, t: tt, p: pick(["なか", "そと"]), opts: ["なか", "そと", "うえ", "した"], ref: c.k };
  }
  if (r < 0.9) { const [a, b] = sample(BUILDINGS, 2); return { type: "next", a, t: b, p: "となり", opts: ["となり", "あいだ", "なか", "うしろ"], ref: a.k }; }
  const [a, b, c] = sample(BUILDINGS, 3); return { type: "between", a, b, t: c, p: "あいだ", opts: ["あいだ", "となり", "なか", "まえ"], ref: `${a.k}と ${b.k}` };
}
function whereStage(w, showTarget = true) {
  if (w.type === "obj") return anchorHTML(w.a) + (showTarget ? targetHTML(w.t, posFor(w, w.p)) : "");
  if (w.type === "box") {
    const lbl = w.a.k;
    const inside = { x: 42, y: 55 }, outside = { x: 82, y: 60 };
    return `<div class="boxc" style="left:42%;top:55%;width:44%;height:62%;z-index:1"></div><div class="obj" style="left:42%;top:17%;z-index:3"><span class="lbl">${esc(lbl)}</span></div>` +
      (showTarget ? targetHTML(w.t, w.p === "なか" ? inside : outside) : "");
  }
  if (w.type === "next") return `<div class="obj" style="left:35%;top:52%;font-size:22cqw">${w.a.e}<span class="lbl">${esc(w.a.k)}</span></div>` +
    (showTarget ? `<div class="obj" id="tg" style="left:65%;top:52%;font-size:22cqw">${w.t.e}<span class="lbl">${esc(w.t.k)}</span></div>` : "");
  return `<div class="obj" style="left:18%;top:52%;font-size:19cqw">${w.a.e}<span class="lbl">${esc(w.a.k)}</span></div><div class="obj" style="left:82%;top:52%;font-size:19cqw">${w.b.e}<span class="lbl">${esc(w.b.k)}</span></div>` +
    (showTarget ? `<div class="obj" id="tg" style="left:50%;top:52%;font-size:19cqw">${w.t.e}<span class="lbl">${esc(w.t.k)}</span></div>` : "");
}
const tKind = w => (w.type === "next" || w.type === "between") ? "a" : w.t.kind;
function whereSentences(w) {
  const v = tKind(w) === "i" ? "います" : "あります";
  return [`${w.ref}の ${w.p}に ${w.t.k}が ${v}。`, `${w.t.k}は ${w.ref}の ${w.p}に ${v}。`];
}
function where() {
  const N = 12; let n = 0, right = 0;
  const round = () => {
    if (n >= N) {
      const s = right >= 11 ? 3 : right >= 8 ? 2 : 1; setStars("where", s); addXP(right * 5);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${right}/${N}</div><p>${starStr(s)}</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button><a class="btn" href="#/scene">Next: Explore →</a></div></div>`;
      if (s === 3) confetti(); return;
    }
    const w = makeWhere();
    const [s1, s2] = whereSentences(w);
    const tapMode = n % 2 === 1 && w.type === "obj";
    const askVerb = !tapMode && n % 4 === 2;
    const head = `${backBtn}<div class="plabel"><span>${n + 1} / ${N}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${n / N * 100}%"></div></div>`;
    const finish = (ok, extra = "") => {
      n++; if (ok) { right++; beep(true); addXP(5); } else beep(false);
      $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "Not quite"}</div>${extra}
        <div class="row">${spk(s1)}<span class="ja jp">${esc(s1)}</span></div><div class="row">${spk(s2)}<span class="ja jp">${esc(s2)}</span></div>
        <div class="ro">${esc(kanaToRomaji(s1))}</div></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
      speak(s1); $("#nx").onclick = round; $("#nx").focus();
      keyHandler = e => { if (e.key === "Enter") round(); };
    };
    if (tapMode) {
      app.innerHTML = `${head}<div class="card"><p class="small muted">Tap where it goes:</p><div class="q jp">${esc(s1)} ${spk(s1)}</div>
        <div class="stage tap" id="st" style="container-type:inline-size">${whereStage(w, false)}${Object.keys(POS).filter(p => w.opts.includes(p)).map(p => [p, posFor(w, p)]).map(([p, c]) => `<div class="zone" data-p="${p}" style="left:${c.x}%;top:${c.y}%">?</div>`).join("")}</div><div id="fb"></div></div>`;
      speak(s1);
      $$(".zone").forEach(z => z.onclick = () => {
        if ($("#fb").innerHTML) return;
        const ok = z.dataset.p === w.p;
        z.classList.add(ok ? "right" : "wrong");
        $(`.zone[data-p="${w.p}"]`).classList.add("right");
        $$(".zone").forEach(zz => zz.textContent = zz.dataset.p);
        $("#st").insertAdjacentHTML("beforeend", targetHTML(w.t, posFor(w, w.p)));
        finish(ok, ok ? "" : `<p>You chose <b class="jp">${z.dataset.p}</b> (${posHint[z.dataset.p]}). It's <b class="jp">${w.p}</b> (${posHint[w.p]}).</p>`);
      });
      return;
    }
    const verb = tKind(w) === "i" ? "います" : "あります";
    const q = askVerb ? `${w.ref}の ${w.p}に ${w.t.k}が <span class="blank"></span>。` : `${w.t.k}は ${w.ref}の <span class="blank"></span>に ${verb}。`;
    const opts = askVerb ? ["あります", "います"] : shuffle(w.opts);
    app.innerHTML = `${head}<div class="card"><div class="stage" style="container-type:inline-size">${whereStage(w)}</div>
      <div class="q jp" style="margin-top:12px">${q}</div>
      <div class="opts ${askVerb ? "two" : "two"}">${opts.map((o, i) => `<button class="opt" data-o="${o}"><span class="key">${i + 1}</span>${o} <span class="small muted" style="font-family:var(--ui)">${askVerb ? "" : posHint[o] || ""}</span></button>`).join("")}</div><div id="fb"></div></div>`;
    const ans = askVerb ? verb : w.p;
    const choose = b => {
      if ($("#fb").innerHTML) return;
      const ok = b.dataset.o === ans;
      $$(".opt").forEach(x => { x.disabled = true; if (x.dataset.o === ans) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      finish(ok, ok ? "" : askVerb ? `<p>${esc(w.t.k)} is ${tKind(w) === "i" ? "alive and moves → <b>います</b>" : "a thing → <b>あります</b>"}.</p>` : `<p><b class="jp">${b.dataset.o}</b> = ${posHint[b.dataset.o]}. Here it's <b class="jp">${w.p}</b> = ${posHint[w.p]}.</p>`);
    };
    $$(".opt").forEach(b => b.onclick = () => choose(b));
    keyHandler = e => { const b = $$(".opt")[+e.key - 1]; if (b) choose(b); };
  };
  round();
}

// ---------- 5. scenes ----------
const SCENES = {
  room: {
    name: "へや · Room", cls: "room",
    items: [
      { id: "door", e: "🚪", x: 8, y: 47, f: 15, l: "ドア", say: "へやに ドアが あります。" },
      { id: "switch", e: "🎚️", x: 18, y: 44, f: 4.5, l: "スイッチ", say: "ドアの みぎに スイッチが あります。" },
      { id: "window", e: "🪟", x: 34, y: 24, f: 13, l: "まど", say: "テーブルの うえに まどが あります。" },
      { id: "tree", e: "🌳", x: 34, y: 22, f: 5, l: "き", say: "まどの そとに きが あります。", z: 3 },
      { id: "shelf", e: "📚", x: 53, y: 36, f: 13, l: "たな", say: "まどの みぎに たなが あります。" },
      { id: "clock", e: "⏰", x: 53, y: 11, f: 5, l: "とけい", say: "たなの うえに とけいが あります。" },
      { id: "table", shape: "table", x: 33, y: 76, w: 24, l: "テーブル", say: "へやに テーブルが あります。" },
      { id: "box", e: "📦", x: 30, y: 63, f: 6, l: "はこ", say: "テーブルの うえに はこが あります。", reveal: "🔋", rsay: "はこの なかに でんちが あります。", z: 4 },
      { id: "cat", e: "🐈", x: 34, y: 87, f: 6, l: "ねこ", say: "テーブルの したに ねこが います。", z: 4 },
      { id: "dog", e: "🐕", x: 57, y: 84, f: 7, l: "いぬ", say: "テーブルと ベッドの あいだに いぬが います。" },
      { id: "girl", e: "👧", x: 67, y: 44, f: 8, l: "おんなのこ", say: "たなの みぎに おんなのこが います。" },
      { id: "bed", e: "🛏️", x: 77, y: 68, f: 17, l: "ベッド", say: "れいぞうこの ひだりに ベッドが あります。" },
      { id: "bag", e: "👜", x: 77, y: 91, f: 5, l: "かばん", say: "ベッドの したに かばんが あります。", z: 4 },
      { id: "fridge", shape: "fridge", x: 91, y: 50, l: "れいぞうこ", say: "ベッドの みぎに れいぞうこが あります。", reveal: "🥛🥚🍎", rsay: "れいぞうこの なかに ぎゅうにゅうや たまご などが あります。" },
    ],
    hunt: [
      { q: "ベッドの したに なにが ありますか。", a: "bag", ans: "かばんが あります。" },
      { q: "テーブルの したに なにが いますか。", a: "cat", ans: "ねこが います。" },
      { q: "ドアの みぎに なにが ありますか。", a: "switch", ans: "スイッチが あります。" },
      { q: "まどの みぎに なにが ありますか。", a: "shelf", ans: "たなが あります。" },
      { q: "テーブルと ベッドの あいだに なにが いますか。", a: "dog", ans: "いぬが います。" },
      { q: "でんちは どこに ありますか。", a: "box", ans: "はこの なかに あります。" },
      { q: "たなの うえに なにが ありますか。", a: "clock", ans: "とけいが あります。" },
      { q: "へやに だれが いますか。", a: "girl", ans: "おんなのこが います。" },
      { q: "ぎゅうにゅうは どこに ありますか。", a: "fridge", ans: "れいぞうこの なかに あります。" },
      { q: "まどの そとに なにが ありますか。", a: "tree", ans: "きが あります。" },
    ],
  },
  town: {
    name: "まち · Town", cls: "town",
    items: [
      { id: "biru", e: "🏢", x: 10, y: 42, f: 17, l: "ビル", say: "コンビニの ひだりに ビルが あります。" },
      { id: "konbini", e: "🏪", x: 29, y: 48, f: 14, l: "コンビニ", say: "ビルの となりに コンビニが あります。", reveal: "🏧", rsay: "コンビニの なかに ATMが あります。" },
      { id: "post", e: "📮", x: 38, y: 70, f: 6, l: "ポスト", say: "コンビニの まえに ポストが あります。", z: 4 },
      { id: "park", e: "🏞️", x: 53, y: 26, f: 16, l: "こうえん", say: "きっさてんの うしろに こうえんが あります。", z: 1 },
      { id: "man", e: "👨", x: 58, y: 17, f: 5, l: "おとこのひと", say: "こうえんに おとこの ひとが います。", z: 3 },
      { id: "cafe", e: "☕", x: 52, y: 55, f: 11, l: "きっさてん", say: "こうえんの まえに きっさてんが あります。", z: 2 },
      { id: "tree", e: "🌳", x: 76, y: 42, f: 13, l: "き", say: "きっさてんの みぎに きが あります。" },
      { id: "boy", e: "👦", x: 76, y: 62, f: 6, l: "おとこのこ", say: "きの したに おとこのこが います。", z: 4 },
      { id: "noriba", e: "🚏", x: 90, y: 56, f: 9, l: "のりば", say: "きの みぎに のりばが あります。" },
      { id: "taxi", e: "🚕", x: 80, y: 85, f: 9, l: "タクシー", say: "のりばに タクシーが あります。" },
      { id: "woman", e: "👩", x: 92, y: 80, f: 6, l: "おんなのひと", say: "のりばに おんなの ひとが います。" },
      { id: "dog", e: "🐕", x: 52, y: 86, f: 5, l: "いぬ", say: "ポストの ちかくに いぬが います。" },
    ],
    hunt: [
      { q: "ビルの となりに なにが ありますか。", a: "konbini", ans: "コンビニが あります。" },
      { q: "コンビニの まえに なにが ありますか。", a: "post", ans: "ポストが あります。" },
      { q: "きっさてんの うしろに なにが ありますか。", a: "park", ans: "こうえんが あります。" },
      { q: "こうえんに だれが いますか。", a: "man", ans: "おとこの ひとが います。" },
      { q: "きの したに だれが いますか。", a: "boy", ans: "おとこのこが います。" },
      { q: "ATMは どこに ありますか。", a: "konbini", ans: "コンビニの なかに あります。" },
      { q: "のりばに だれが いますか。", a: "woman", ans: "おんなの ひとが います。" },
      { q: "のりばに なにが ありますか。", a: "taxi", ans: "タクシーが あります。" },
      { q: "ポストの ちかくに なにが いますか。", a: "dog", ans: "いぬが います。" },
    ],
  },
};
function sceneHTML(sc) {
  return sc.items.filter(it => it.l).map(it => {
    if (it.shape === "table") return `<div class="css-table obj" data-id="${it.id}" style="left:${it.x}%;top:${it.y}%;width:${it.w}%;z-index:2"><div class="top"></div><div class="legs"><i></i><i></i></div><span class="lbl">${it.l}</span></div>`;
    if (it.shape === "fridge") return `<div class="obj" data-id="${it.id}" style="left:${it.x}%;top:${it.y}%;z-index:2;width:11%"><div class="css-fridge" style="position:relative;transform:none;width:100%"></div><span class="lbl">${it.l}</span></div>`;
    return `<div class="obj" data-id="${it.id}" style="left:${it.x}%;top:${it.y}%;font-size:${it.f}cqw;z-index:${it.z ?? 2}">${it.e}<span class="lbl">${it.l}</span></div>`;
  }).join("");
}
function scene() {
  let which = scene.which || "room";
  const sc = SCENES[which];
  app.innerHTML = `${backBtn}<h2>Explore</h2><p class="sub">Tap anything to hear where it is. Some things can be opened! Then start the hunt.</p>
    <div class="row" style="margin-bottom:10px">${Object.entries(SCENES).map(([k, s]) => `<button class="btn ${k === which ? "primary" : ""}" data-sc="${k}">${s.name}</button>`).join("")}
    <button class="btn good" id="hunt">🎯 Start the hunt</button></div>
    <div class="stage tap ${sc.cls}" id="st" style="container-type:inline-size">${sceneHTML(sc)}</div>
    <div class="card" id="info" style="margin-top:12px;min-height:70px"><span class="muted">👆 Tap something in the picture.</span></div>`;
  $$("[data-sc]").forEach(b => b.onclick = () => { scene.which = b.dataset.sc; scene(); });
  const opened = new Set();
  $$("#st .obj").forEach(o => o.onclick = () => {
    const it = sc.items.find(i => i.id === o.dataset.id);
    if (it.reveal && !opened.has(it.id)) { opened.add(it.id); o.insertAdjacentHTML("beforeend", `<span style="position:absolute;left:50%;top:-30%;transform:translateX(-50%);font-size:5cqw;white-space:nowrap" class="pop">${it.reveal}</span>`); }
    const lines = [it.say, it.rsay].filter(Boolean);
    $("#info").innerHTML = lines.map(l => `<div class="row">${spk(l)}<span class="jp" style="font-size:20px">${esc(l)}</span></div><div class="ro">${esc(kanaToRomaji(l))}</div>`).join("") + (it.reveal ? `<p class="small muted">📂 It opened! Look what's inside.</p>` : "");
    speak(lines.join(" "));
  });
  $("#hunt").onclick = () => hunt(which);
}
function hunt(which) {
  const sc = SCENES[which]; const list = shuffle(sc.hunt); let i = 0, right = 0, tries = 0;
  const show = () => {
    if (i >= list.length) {
      const s = right >= list.length - 1 ? 3 : right >= list.length - 3 ? 2 : 1; setStars("scene", s); addXP(right * 5);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">🎯 ${right}/${list.length}</div><p>${starStr(s)} — first-tap answers</p>
        <div class="row" style="justify-content:center"><button class="btn primary" onclick="scene.which='${which === "room" ? "town" : "room"}';location.hash='#/scene';route()">Try the ${which === "room" ? "town" : "room"}</button><a class="btn" href="#/build">Next: Sentence builder →</a></div></div>`;
      if (s === 3) confetti(); return;
    }
    const h = list[i]; tries = 0;
    app.innerHTML = `${backBtn}<div class="plabel"><span>${sc.name} hunt · ${i + 1} / ${list.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / list.length * 100}%"></div></div>
      <div class="card"><div class="q jp">${esc(h.q)} ${spk(h.q)}</div><p class="small muted">Tap the answer in the picture.</p>
      <div class="stage tap ${sc.cls}" id="st" style="container-type:inline-size">${sceneHTML(sc)}</div><div id="fb"></div></div>`;
    speak(h.q);
    $$("#st .obj").forEach(o => o.onclick = () => {
      if ($("#fb").dataset.done) return;
      if (o.dataset.id === h.a) {
        o.classList.add("found"); if (tries === 0) right++; beep(true); addXP(3);
        $("#fb").dataset.done = 1;
        $("#fb").innerHTML = `<div class="fb ok"><div class="h">${tries === 0 ? "せいかい！" : "Found it!"}</div><div class="row">${spk(h.ans)}<span class="ja jp">${esc(h.ans)}</span></div><div class="ro">${esc(kanaToRomaji(h.ans))}</div></div>
          <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
        speak(h.ans); $("#nx").onclick = () => { i++; show(); }; keyHandler = e => { if (e.key === "Enter") { i++; show(); } };
      } else {
        tries++; beep(false); o.classList.remove("miss"); void o.offsetWidth; o.classList.add("miss");
        const it = sc.items.find(x => x.id === o.dataset.id);
        $("#fb").innerHTML = `<div class="fb no">That's <span class="jp">${esc(it.l)}</span>: <span class="jp">${esc(it.say)}</span> — try again!</div>`;
      }
    });
  };
  show();
}

// ---------- 6. builder ----------
function builder() {
  const list = sample(SENTENCES, 10); let i = 0, right = 0;
  const show = () => {
    if (i >= list.length) {
      const s = right >= 9 ? 3 : right >= 6 ? 2 : 1; setStars("build", s); addXP(right * 6);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">🧩 ${right}/${list.length}</div><p>${starStr(s)} — correct on first check</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button><a class="btn" href="#/memory">Next: Memory →</a></div></div>`;
      if (s === 3) confetti(); return;
    }
    const S = list[i], toks = S.t.split(" ");
    const verb = toks.find(t => VERBS.includes(t));
    const swap = { "あります": "います", "います": "あります", "ありません": "いません", "いません": "ありません" }[verb];
    const extra = [swap, pick(["を", "で"])].filter(Boolean);
    const bank = shuffle([...toks, ...extra]).map((t, k) => ({ t, k }));
    let placed = [], checked = false, firstTry = true;
    app.innerHTML = `${backBtn}<div class="plabel"><span>${i + 1} / ${list.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / list.length * 100}%"></div></div>
      <div class="card"><div class="q-emo">${S.pic}</div><p style="text-align:center;font-size:17px;margin:4px 0 2px"><b>${esc(state.lang === "de" ? S.de : S.en)}</b></p><p class="small muted" style="text-align:center;margin:0 0 12px">${esc(state.lang === "de" ? S.en : S.de)} · 2 tiles are extra</p>
      <div class="slots jp" id="slots"></div><div class="bank" id="bank"></div><div id="fb"></div>
      <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn" id="clr">Clear</button><button class="btn primary" id="chk">Check</button></div></div>`;
    const cls = t => PARTICLES.includes(t) ? "part" : VERBS.includes(t) ? "verb" : "";
    const draw = () => {
      $("#slots").innerHTML = placed.map((b, j) => `<button class="tok ${cls(b.t)}" data-j="${j}">${esc(b.t)}</button>`).join("");
      $("#bank").innerHTML = bank.map(b => `<button class="tok ${cls(b.t)} ${placed.includes(b) ? "used" : ""}" data-k="${b.k}">${esc(b.t)}</button>`).join("");
      $$("#slots .tok").forEach(x => x.onclick = () => { if (checked) return; placed.splice(+x.dataset.j, 1); $("#slots").className = "slots jp"; draw(); });
      $$("#bank .tok").forEach(x => x.onclick = () => { if (checked) return; const b = bank.find(bb => bb.k === +x.dataset.k); if (!placed.includes(b)) { placed.push(b); speak(b.t, 1); } draw(); });
    };
    draw();
    $("#clr").onclick = () => { if (checked) return; placed = []; $("#slots").className = "slots jp"; draw(); };
    const check = () => {
      if (checked) { i++; show(); return; }
      const got = placed.map(b => b.t).join(" ");
      const sentence = toks.join("") + "。";
      if (got === S.t) {
        checked = true; if (firstTry) right++; beep(true); addXP(4);
        $("#slots").className = "slots jp ok";
        $("#fb").innerHTML = `<div class="fb ok"><div class="row">${spk(sentence)}<span class="ja jp">${esc(sentence)}</span></div><div class="ro">${esc(sentRomaji(toks))}</div></div>`;
        speak(sentence); $("#chk").textContent = "Next →";
      } else {
        firstTry = false; beep(false); $("#slots").className = "slots jp no";
        const hint = whyWrong(placed.map(b => b.t), toks);
        $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet</div>${hint}</div>`;
      }
    };
    $("#chk").onclick = check;
    keyHandler = e => { if (e.key === "Enter") check(); if (e.key === "Backspace" && !checked) { placed.pop(); draw(); } };
  };
  show();
}
function whyWrong(got, want) {
  if (got.includes("を")) return "を is for objects of action verbs — not used with あります/います.";
  if (got.includes("で")) return "で marks where an <i>action</i> happens. For existence the place takes <b>に</b>.";
  const v = want.find(t => VERBS.includes(t)), gv = got.find(t => VERBS.includes(t));
  if (gv && gv !== v) return v.startsWith("い") ? "Is it alive and moving? Then it's <b>います/いません</b>." : "It's a thing / place / plant → <b>あります/ありません</b>.";
  if (got.length < want.length) return `Use ${want.length} tiles (you have ${got.length}).`;
  const firstBad = got.findIndex((t, k) => t !== want[k]);
  return `The first ${firstBad} tile${firstBad === 1 ? " is" : "s are"} right. Pattern: <b class="jp">[reference] の [position] に [thing] が [verb]</b>.`;
}

// ---------- 7. memory ----------
function memory() {
  const groups = { "People & animals": "👨", "Things": "📦", "Places": "🏪", "Positions": "⬆️" };
  app.innerHTML = `${backBtn}<h2>🧠 Memory match</h2><p class="sub">Pick a set. Match each picture (or meaning) with its Japanese word. Fewer moves = more stars.</p>
    <div class="path">${Object.entries(groups).map(([g, e]) => `<button class="tile" data-g="${esc(g)}"><span class="ico">${e}</span><h4>${esc(g)}</h4><p>6 pairs</p></button>`).join("")}
    <button class="tile" data-g="mix"><span class="ico">🎲</span><h4>Random mix</h4><p>8 pairs</p></button></div>`;
  $$("[data-g]").forEach(b => b.onclick = () => playMemory(b.dataset.g));
}
function playMemory(g) {
  const pool = g === "mix" ? VOCAB.filter(v => v.kind !== "x") : VOCAB.filter(v => v.cat === g);
  const pairs = sample(pool, g === "mix" ? 8 : 6);
  const cards = shuffle(pairs.flatMap(v => [{ v, side: "jp" }, { v, side: "pic" }]));
  let open = [], done = 0, moves = 0, lock = false;
  const face = c => c.side === "jp" ? `<span>${jpOf(c.v)}</span>` : c.v.kind === "p" ? `<span style="font-family:var(--ui);font-size:14px">${c.v.emo}<br>${esc(meaning(c.v))}</span>` : `<span><span class="e">${c.v.emo}</span><br><span style="font:12px var(--ui)">${esc(meaning(c.v))}</span></span>`;
  app.innerHTML = `${backBtn}<div class="plabel"><span>Moves: <b id="mv">0</b></span><span>Pairs: <b id="pr">0</b>/${pairs.length}</span></div>
    <div class="mem" style="margin-top:8px">${cards.map((c, i) => `<div class="mc" data-i="${i}">?</div>`).join("")}</div>`;
  $$(".mc").forEach(el => el.onclick = () => {
    const c = cards[+el.dataset.i];
    if (lock || el.classList.contains("open") || el.classList.contains("done")) return;
    el.classList.add("open"); el.innerHTML = face(c); if (c.side === "jp") speak(c.v.kana);
    open.push([el, c]);
    if (open.length === 2) {
      moves++; $("#mv").textContent = moves;
      const [[e1, c1], [e2, c2]] = open;
      if (c1.v === c2.v && c1.side !== c2.side) { e1.classList.add("done"); e2.classList.add("done"); done++; $("#pr").textContent = done; beep(true); word(c1.v.id, 1); addXP(2); open = [];
        if (done === pairs.length) {
          const s = moves <= pairs.length + 3 ? 3 : moves <= pairs.length * 2 ? 2 : 1; setStars("memory", s);
          setTimeout(() => { app.insertAdjacentHTML("beforeend", `<div class="card stack" style="text-align:center;margin-top:14px"><b>Cleared in ${moves} moves ${starStr(s)}</b><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Another set</button><a class="btn" href="#/type">Next: Spell it →</a></div></div>`); if (s === 3) confetti(); }, 300);
        }
      } else { lock = true; beep(false); setTimeout(() => { [e1, e2].forEach(e => { e.classList.remove("open"); e.textContent = "?"; }); open = []; lock = false; }, 900); }
    }
  });
}

// ---------- 8. spell it ----------
function typing() {
  const pool = VOCAB.filter(v => !/[～\[\]A-Z]/.test(v.kana) && v.kind !== "x");
  const list = sample(pool, 10); let i = 0, right = 0;
  const show = () => {
    if (i >= list.length) {
      const s = right >= 9 ? 3 : right >= 6 ? 2 : 1; setStars("type", s); addXP(right * 5);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">⌨️ ${right}/${list.length}</div><p>${starStr(s)}</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button><a class="btn" href="#/store">Next: Asia Store →</a></div></div>`;
      if (s === 3) confetti(); return;
    }
    const v = list[i]; let hinted = 0, done = false;
    app.innerHTML = `${backBtn}<div class="plabel"><span>${i + 1} / ${list.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / list.length * 100}%"></div></div>
      <div class="card stack"><div class="q-emo">${v.emo}</div><div style="text-align:center"><b style="font-size:20px">${esc(meaning(v))}</b><div class="muted small">${esc(other(v))}</div></div>
      <input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="kana or romaji (e.g. reizouko)">
      <div class="ro" id="pv" style="min-height:18px;font-size:16px"></div>
      <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
    const inp = $("#in"); inp.focus();
    inp.oninput = () => { $("#pv").textContent = /[a-z]/i.test(inp.value) ? "→ " + romajiToKana(inp.value) : ""; };
    const target = norm(v.kana);
    $("#hint").onclick = () => { hinted++; const shown = [...toHira(v.kana.replace(/\s/g, ""))].slice(0, hinted).join(""); $("#pv").textContent = `starts with: ${shown}…`; speak(v.kana); };
    const check = () => {
      if (done) { i++; show(); return; }
      const raw = inp.value; const got = norm(/[a-z]/i.test(raw) ? romajiToKana(raw) : raw);
      if (!got) return;
      done = true; const ok = got === target;
      if (ok && !hinted) { right++; word(v.id, 1); } else if (!ok) word(v.id, -1);
      beep(ok); if (ok) addXP(3);
      $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? (hinted ? "Correct (with hint)" : "せいかい！") : "The answer is:"}</div><div class="row">${spk(v.kana)}<span class="ja jp" style="font-size:24px">${jpOf(v)}</span> <span class="ro">${kanaToRomaji(v.kana)}</span></div>${ok ? "" : `<div class="small">You wrote: ${esc(raw)}</div>`}</div>`;
      speak(v.kana); $("#go").textContent = "Next →";
    };
    $("#go").onclick = check; inp.onkeydown = e => { if (e.key === "Enter") check(); };
  };
  show();
}

// ---------- 9. Asia Store ----------
const SHOP_ITEMS = [
  { k: "ナンプラー", e: "🐟" }, { k: "ココナッツミルク", e: "🥥" }, { k: "ラーメン", e: "🍜" }, { k: "おちゃ", e: "🍵" }, { k: "こめ", e: "🍚" },
  { k: "とうがらし", e: "🌶️" }, { k: "カレー", e: "🍛" }, { k: "とうふ", e: "🧈" }, { k: "マンゴー", e: "🥭" },
];
function store() {
  const script = [
    { who: "📖", tr: "You are Mr Miller. You are looking for the Asia Store. Ask a woman on the street." },
    { me: true, ask: [
      ["すみません。アジアストアは どこですか。", "Excuse me, where is the Asia Store?", true],
      ["すみません。アジアストアが どこですか。", "", "Asking where a known place is → <b>は</b>, not が."],
      ["すみません。アジアストアは だれですか。", "", "だれ = who. You want どこ = where."]] },
    { who: "👩 おんなの ひと", ja: "アジアストアですか。あそこに しろい ビルが ありますね。あの ビルの なかです。", tr: "The Asia Store? There's a white building over there, right? It's inside that building." },
    { quiz: "Where is the Asia Store?", opts: [["Inside the white building", true], ["Next to the white building", "となり would be ‘next to’. She said なか = inside."], ["Behind the white building", "うしろ would be ‘behind’. She said なか."]] },
    { me: true, ask: [
      ["そうですか。どうも すみません。", "I see. Thank you very much.", true],
      ["はじめまして。", "", "That's for meeting someone for the first time."],
      ["いいえ。", "", "That's what <i>she</i> says next (‘not at all’)."]] },
    { who: "👩 おんなの ひと", ja: "いいえ。", tr: "Not at all." },
    { who: "📖", tr: "🛒 Inside the Asia Store. You want fish sauce (ナンプラー). Ask a clerk." },
    { me: true, ask: [
      ["すみません。ナンプラー、ありますか。", "Excuse me, do you have nam pla?", true],
      ["すみません。ナンプラー、いますか。", "", "Fish sauce isn't alive → <b>あります</b>. 🐟❌"],
      ["すみません。ナンプラーは だれですか。", "", "だれ asks about people."]] },
    { who: "🧑‍🍳 てんいん", ja: "はい。あちらに タイりょうりの コーナーが ありますね。ナンプラーは いちばん したです。", tr: "Yes. Over there is the Thai food corner. The nam pla is at the very bottom." },
    { shelf: "ナンプラー", clue: "いちばん した" },
    { me: true, ask: [
      ["わかりました。どうも。", "Got it. Thanks.", true],
      ["いただきます。", "", "That's said before eating."],
      ["おやすみなさい。", "", "That's ‘good night’."]] },
    { who: "📖", tr: "🎉 You found it! Now you work at the Asia Store. Help customers find things on the shelf." },
  ];
  let step = 0, right = 0, asks = 0;
  app.innerHTML = `${backBtn}<h2>🛒 Asia Store role-play</h2><p class="sub">Choose what Miller says. Listen to the answers. 🔊 plays automatically if sound is on.</p><div class="chat" id="chat"></div><div id="ctl" style="margin-top:14px"></div>`;
  const chat = $("#chat"), ctl = $("#ctl");
  const add = html => { chat.insertAdjacentHTML("beforeend", html); chat.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" }); };
  const nextStep = () => {
    if (step >= script.length) { return shopGame(right, asks); }
    const s = script[step++];
    ctl.innerHTML = "";
    if (s.who) {
      add(`<div class="msg"><div class="who">${s.who}</div>${s.ja ? `<div class="row" style="flex-wrap:nowrap">${spk(s.ja)}<span class="ja">${esc(s.ja)}</span></div><div class="ro">${esc(kanaToRomaji(s.ja))}</div>` : ""}<div class="tr">${esc(s.tr)}</div></div>`);
      if (s.ja) speak(s.ja);
      ctl.innerHTML = `<button class="btn primary" id="c">Continue →</button>`; $("#c").onclick = nextStep; $("#c").focus(); return;
    }
    if (s.me || s.quiz) {
      const opts = shuffle(s.me ? s.ask : s.opts); asks++; let first = true;
      ctl.innerHTML = `${s.quiz ? `<p><b>${esc(s.quiz)}</b></p>` : `<p class="small muted">What do you say?</p>`}<div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${i + 1}</span>${esc(o[0])}</button>`).join("")}</div><div id="sfb"></div>`;
      $$("#ctl .opt").forEach(b => b.onclick = () => {
        const o = opts[+b.dataset.i];
        if (o[s.me ? 2 : 1] === true) {
          if (first) right++; beep(true);
          if (s.me) { add(`<div class="msg me"><div class="who">🧑‍💼 ミラー (you)</div><div class="ja">${esc(o[0])}</div><div class="tr">${esc(o[1])}</div></div>`); speak(o[0]); }
          else add(`<div class="msg me"><div class="who">✔</div>${esc(o[0])}</div>`);
          nextStep();
        } else { first = false; beep(false); b.classList.add("wrong"); b.disabled = true; $("#sfb").innerHTML = `<div class="fb no">${o[s.me ? 2 : 1]}</div>`; }
      });
      return;
    }
    if (s.shelf) {
      // All boxes are closed; only the row names are shown. いちばん した = bottom row.
      const items = shuffle(SHOP_ITEMS); const ti = items.findIndex(x => x.k === s.shelf); const dest = 6 + Math.floor(Math.random() * 3);
      [items[ti], items[dest]] = [items[dest], items[ti]];
      const rows = ["いちばん うえ", "まんなか", "いちばん した"];
      ctl.innerHTML = `<p class="small muted">The Thai corner shelf — every box is closed. Where did the clerk say the ナンプラー is? Tap to open.</p>
        <div class="shelf">${items.map((it, i) => `<div data-i="${i}">📦<small>${i % 3 === 0 ? rows[i / 3] : "&nbsp;"}</small></div>`).join("")}</div><div id="sfb"></div>`;
      asks++; let first = true;
      $$("#ctl .shelf div").forEach(d => d.onclick = () => {
        const i = +d.dataset.i; d.innerHTML = `${items[i].e}<small>${esc(items[i].k)}</small>`;
        if (items[i].k === s.shelf) { if (first) right++; beep(true); d.style.background = "var(--good-soft)"; add(`<div class="msg me"><div class="who">✔</div>🐟 Found it — いちばん した!</div>`); setTimeout(nextStep, 600); }
        else { first = false; beep(false); $("#sfb").innerHTML = `<div class="fb no">${i < 6 ? "That's not the bottom row — <b>いちばん した</b> = the very bottom." : `Right row! But that's ${esc(items[i].k)} ${items[i].e}. Try its neighbours.`}</div>`; }
      });
    }
  };
  nextStep();
}
// Every true location sentence for the item at index ti on a 3×3 shelf.
function shelfClues(items, ti) {
  const r = Math.floor(ti / 3), c = ti % 3, at = (rr, cc) => items[rr * 3 + cc].k, out = [];
  if (r === 2 && c !== 1) out.push(`いちばん したの ${c === 0 ? "ひだり" : "みぎ"}に あります。`);
  if (r === 0 && c !== 1) out.push(`いちばん うえの ${c === 0 ? "ひだり" : "みぎ"}に あります。`);
  if (c === 1) out.push(`${at(r, 0)}と ${at(r, 2)}の あいだに あります。`);
  if (r > 0) out.push(`${at(r - 1, c)}の したに あります。`);
  if (r < 2) out.push(`${at(r + 1, c)}の うえに あります。`);
  if (c < 2) out.push(`${at(r, c + 1)}の ひだりに あります。`);
  if (c > 0) out.push(`${at(r, c - 1)}の みぎに あります。`);
  return out;
}
function shopGame(right0, asks0) {
  let round = 0, right = 0; const N = 6;
  const ctl = $("#ctl");
  $("#chat").insertAdjacentHTML("beforeend", `<div class="msg"><div class="who">📖</div><div class="tr">Customers ask where things are. The item they want glows green — pick the sentence that describes its place correctly.</div></div>`);
  const show = () => {
    if (round >= N) {
      const tot = (right0 + right) / (asks0 + N); const s = tot >= 0.9 ? 3 : tot >= 0.7 ? 2 : 1; setStars("store", s); addXP((right0 + right) * 5);
      ctl.innerHTML = `<div class="card stack" style="text-align:center"><div class="result-big">🛒 ${right0 + right}/${asks0 + N}</div><p>${starStr(s)} — first-try answers</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Play again</button><a class="btn" href="#/quiz">Next: Grammar check →</a></div></div>`;
      if (s === 3) confetti(); return;
    }
    const items = sample(SHOP_ITEMS, 9); const ti = Math.floor(Math.random() * 9); const t = items[ti];
    const good = shelfClues(items, ti);
    const bad = shuffle([...new Set(items.flatMap((_, k) => k === ti ? [] : shelfClues(items, k)))].filter(x => !good.includes(x))).slice(0, 2);
    const opts = shuffle([pick(good), ...bad]);
    const custName = pick(["👵 おばあさん", "🧑 おとこの ひと", "👩 おんなの ひと", "👦 おとこのこ"]);
    const cq = `すみません。${t.k}は どこですか。`;
    let first = true;
    ctl.innerHTML = `<div class="card stack"><div class="plabel"><span>Customer ${round + 1} / ${N}</span><span>✓ ${right}</span></div>
      <div class="msg"><div class="who">${custName}</div><div class="row" style="flex-wrap:nowrap">${spk(cq)}<span class="ja">${esc(cq)}</span></div></div>
      <div class="shelf">${items.map((it, i) => `<div style="${i === ti ? "background:var(--good-soft);border-color:var(--good)" : ""}">${it.e}<small>${esc(it.k)}</small></div>`).join("")}</div>
      <p class="small muted">You (the clerk) answer: <span class="jp">はい、${esc(t.k)}は …</span></p>
      <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${i + 1}</span>${esc(o)}</button>`).join("")}</div><div id="sfb"></div></div>`;
    speak(cq);
    const choose = b => {
      const o = opts[+b.dataset.i];
      if (good.includes(o)) {
        if (first) right++; beep(true); addXP(3); b.classList.add("right"); $$("#ctl .opt").forEach(x => x.disabled = true);
        speak(`${t.k}は ${o}`);
        $("#sfb").innerHTML = `<div class="fb ok">${custName.split(" ")[0]} どうも すみません！ 🙇 <button class="btn primary" id="nx" style="margin-left:8px">Next customer →</button></div>`;
        $("#nx").onclick = () => { round++; show(); }; keyHandler = e => { if (e.key === "Enter") { round++; show(); } };
      } else { first = false; beep(false); b.classList.add("wrong"); b.disabled = true; $("#sfb").innerHTML = `<div class="fb no">That describes a different spot on the shelf. Look at the green item again.</div>`; }
    };
    $$("#ctl .opt").forEach(b => b.onclick = () => choose(b));
    keyHandler = e => { const b = $$("#ctl .opt")[+e.key - 1]; if (b && !b.disabled) choose(b); };
  };
  show();
}

// ---------- 10. grammar check & 13. boss ----------
function mcqRun({ title, questions, modeId, pass, next }) {
  let i = 0, right = 0; const wrong = [];
  const show = () => {
    if (i >= questions.length) {
      const pct = right / questions.length; const s = pct >= pass ? 3 : pct >= 0.6 ? 2 : 1; setStars(modeId, s); addXP(right * 5);
      const boss = modeId === "boss";
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${boss ? (pct >= pass ? "🐉💥" : "🐉") : ""} ${right}/${questions.length}</div>
        <p>${boss ? (pct >= pass ? "You beat the dragon! Lesson 10 mastered. 🏆" : `The dragon survived… you need ${Math.ceil(pass * questions.length)}.`) : ""} ${starStr(s)}</p>
        ${wrong.length ? `<div style="text-align:left"><b>Review these:</b>${wrong.map(w => `<div class="ws-item"><div class="jp">${w.q}</div><div class="fix">→ ${w.a}</div></div>`).join("")}</div>` : ""}
        <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Try again</button>${next ? `<a class="btn" href="#/${next}">Next →</a>` : ""}</div></div>`;
      if (s === 3) confetti(boss ? 90 : 40); return;
    }
    const q = questions[i];
    const opts = shuffle(q.o.map((o, k) => ({ o, k })));
    app.innerHTML = `${backBtn}<div class="plabel"><span>${title} · ${i + 1} / ${questions.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / questions.length * 100}%"></div></div>
      <div class="card">${q.pic ? `<div class="q-emo">${q.pic}</div>` : ""}<div class="q jp">${ruby(esc(q.q)).replace(/（　）/g, '<span class="blank"></span>')}</div>
      <div class="opts ${q.o.length === 2 ? "two" : ""}">${opts.map((x, n) => `<button class="opt" data-k="${x.k}"><span class="key">${n + 1}</span>${ruby(x.o)}</button>`).join("")}</div><div id="fb"></div></div>`;
    let done = false;
    const choose = b => {
      if (done) return; done = true;
      const k = +b.dataset.k, ok = k === 0;
      $$(".opt").forEach(x => { x.disabled = true; if (+x.dataset.k === 0) x.classList.add("right"); });
      if (!ok) { b.classList.add("wrong"); wrong.push({ q: ruby(esc(q.q)), a: ruby(q.o[0]) }); }
      else right++;
      if (q.word) word(q.word, ok ? 1 : -1);
      beep(ok);
      const sayText = q.say || (/^[ぁ-んァ-ン]/.test(q.o[0]) ? q.o[0] : "");
      $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "✗ " + (q.why?.[k] || "Not quite.")}</div><div>${q.ok || ""}</div>${sayText ? `<div class="row" style="margin-top:6px">${spk(sayText)}<span class="ja jp">${ruby(sayText)}</span></div>` : ""}</div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
      $("#nx").onclick = () => { i++; show(); }; $("#nx").focus();
      keyHandler = e => { if (e.key === "Enter") { i++; show(); } };
    };
    $$(".opt").forEach(b => b.onclick = () => choose(b));
    keyHandler = e => { const b = $$(".opt")[+e.key - 1]; if (b) choose(b); };
  };
  show();
}
function quiz() { mcqRun({ title: "Grammar check", questions: sample(GRAMMAR_Q, 12), modeId: "quiz", pass: 0.85, next: "worksheet" }); }

function vocabQ(v) {
  const others = sample(VOCAB.filter(x => x !== v && x.cat === v.cat), 3);
  if (Math.random() < 0.5) return { q: `${v.kanji || v.kana}  =  ?`, o: [meaning(v), ...others.map(meaning)], ok: `<span class="jp">${jpOf(v)}</span> = ${esc(meaning(v))} (${esc(other(v))})`, say: v.kana, word: v.id, why: [] };
  return { q: `${v.emo}  ${meaning(v)}  →  ?`, o: [v.kanji || v.kana, ...others.map(x => x.kanji || x.kana)], ok: `${esc(meaning(v))} = <span class="jp">${jpOf(v)}</span>`, say: v.kana, word: v.id, why: [] };
}
function boss() {
  const qs = [];
  sample(GRAMMAR_Q, 8).forEach(q => qs.push(q));
  sample(VOCAB.filter(v => v.kind !== "x" && VOCAB.filter(x => x.cat === v.cat).length > 3), 6).forEach(v => qs.push(vocabQ(v)));
  sample([...VOCAB.filter(v => v.kind === "a" || v.kind === "i"), ...EXTRA], 3).forEach(v => {
    const ok = v.kind === "i" ? "います" : "あります";
    qs.push({ pic: v.emo, q: `${v.kana}が（　）。`, o: [ok, ok === "います" ? "あります" : "います"], ok: v.kind === "i" ? "Alive and moves → います." : "Thing / plant / place → あります.", say: `${v.kana}が ${ok}。`, why: [] });
  });
  sample(SENTENCES.filter(s => /の (うえ|した|まえ|うしろ|みぎ|なか|となり) に/.test(s.t)), 3).forEach(s => {
    const p = s.t.match(/の (うえ|した|まえ|うしろ|みぎ|なか|となり) に/)[1];
    const opts = [p, ...sample(["うえ", "した", "まえ", "うしろ", "みぎ", "ひだり", "なか", "となり"].filter(x => x !== p), 3)];
    qs.push({ pic: s.pic, q: s.t.replace(` ${p} `, " （　） ").replace(/ /g, "") + "。", o: opts, ok: `${esc(state.lang === "de" ? s.de : s.en)} → <b>${p}</b> = ${posHint[p]}`, say: s.t.replace(/ /g, ""), why: [] });
  });
  mcqRun({ title: "🐉 Boss", questions: shuffle(qs), modeId: "boss", pass: 0.8, next: "" });
}

// ---------- 11. worksheet ----------
function worksheet() {
  setStars("worksheet", 3);
  const mark = ok => ok === true ? `<span class="mark ok">✓</span>` : ok === false ? `<span class="mark no">✗</span>` : ok === "todo" ? `<span class="mark hm">✎</span>` : `<span class="mark hm">△</span>`;
  const cnt = WORKSHEET.flatMap(s => s.items);
  app.innerHTML = `${backBtn}<h2>📝 Worksheet F㊴ 【あります／います】</h2>
    <p class="sub">Your handwritten answers, checked. ✓ correct · △ check again · ✗ fix · ✎ still to do.
      Score so far: ${cnt.filter(x => x.ok === true).length} ✓ / ${cnt.filter(x => x.ok !== "todo").length}. Very solid! The two big lessons: <b>まえ vs うえ</b> and <b>おとこのこ</b> (not just こ).</p>
    <div class="stack">${WORKSHEET.map(sec => `<div class="card"><h3 style="margin-top:0">${esc(sec.sec)}</h3>${sec.items.map(it => `
      <div class="ws-item"><div class="mine">${mark(it.ok)}${it.n} ${it.mine}</div>
        ${it.fix ? `<div class="row"><span class="fix">→ ${esc(it.fix)}</span>${spk(it.fix.replace(/^[QA]: /, ""))}</div>` : ""}
        ${it.note ? `<div class="small muted">${it.note}</div>` : ""}</div>`).join("")}</div>`).join("")}
    <div class="card"><h3 style="margin-top:0">🔁 Redo the tricky ones</h3><p class="small">Fix your answers with the right picture in mind:</p><div id="redo"></div></div>
    </div>`;
  const redo = [
    { pic: "🏬🚗", q: "みせ・くるま  →  みせの（　）に くるまが あります。", o: ["まえ", "うえ", "なか", "うしろ"], ok: "The car stands in front of the shop: <b>みせの まえに くるまが あります</b>.", why: [null, "うえ = on the roof!", "なか = inside the shop.", "うしろ = behind."] },
    { pic: "🌳👦", q: "き・おとこのこ  →  きの したに（　）が います。", o: ["おとこのこ", "こ", "おとこ", "おとこのひと"], ok: "<b>おとこのこ</b> = boy. こ alone isn't used.", why: [null, "こ alone doesn't mean ‘boy’.", "おとこ alone sounds rough — and the picture shows a child.", "おとこのひと = man (adult)."] },
    { pic: "🏠🐈", q: "Ask about an animal in the room:", o: ["へやに なにが いますか。", "へやに だれが いますか。", "へやに なにが ありますか。"], ok: "Animals: <b>なにが いますか</b>. (だれ is for people; あります is for things.)", why: [null, "だれ = who (people only).", "A cat is alive → います."] },
  ];
  // mini MCQ inside worksheet
  let r = 0;
  const box = $("#redo");
  const showR = () => {
    if (r >= redo.length) { box.innerHTML = `<p>✨ All fixed! Now try <a href="#/you">Talk about you</a> for part &lt;5&gt;.</p>`; return; }
    const q = redo[r]; const opts = shuffle(q.o.map((o, k) => ({ o, k })));
    box.innerHTML = `<div class="q-emo">${q.pic}</div><div class="q jp" style="font-size:19px">${esc(q.q).replace("（　）", '<span class="blank"></span>')}</div><div class="opts">${opts.map(x => `<button class="opt" data-k="${x.k}">${esc(x.o)}</button>`).join("")}</div><div id="rfb"></div>`;
    $$("#redo .opt").forEach(b => b.onclick = () => {
      const k = +b.dataset.k;
      if (k === 0) { beep(true); addXP(3); b.classList.add("right"); $("#rfb").innerHTML = `<div class="fb ok">${q.ok} <button class="btn primary" id="rn" style="margin-left:6px">Next</button></div>`; $("#rn").onclick = () => { r++; showR(); }; }
      else { beep(false); b.classList.add("wrong"); b.disabled = true; $("#rfb").innerHTML = `<div class="fb no">${q.why[k]}</div>`; }
    });
  };
  showR();
}

// ---------- 12. talk about you ----------
function you() {
  const Qs = [
    { q: "いま、うちの そとに だれが いますか。", verb: "い", help: ["だれも いません", "おとこの ひと", "おんなの ひと", "おとこのこ", "おんなのこ", "いぬ", "ねこ", "が", "や", "います"], model: ["だれも いません。", "おとこの ひとと いぬが います。"] },
    { q: "あなたの かばんの なかに なにが ありますか。", verb: "あり", help: ["ほん", "でんわ", "さいふ", "かぎ", "てちょう", "ペン", "かさ", "でんち", "や", "など", "が", "あります"], model: ["ほんや かぎや でんわ などが あります。", "さいふと ペンが あります。"] },
    { q: "うちの ちかくに なにが ありますか。", verb: "あり", help: ["コンビニ", "こうえん", "きっさてん", "えき", "スーパー", "ぎんこう", "ポスト", "や", "など", "が", "あります"], model: ["コンビニや こうえんが あります。", "えきの ちかくに スーパーが あります。"] },
    { q: "あなたの へやに なにが ありますか。", verb: "あり", help: ["ベッド", "テーブル", "たな", "まど", "いす", "つくえ", "や", "など", "が", "あります"], model: ["ベッドや つくえや たな などが あります。"] },
    { q: "れいぞうこの なかに なにが ありますか。", verb: "あり", help: ["ぎゅうにゅう", "たまご", "ビール", "やさい", "なにも ありません", "や", "など", "が", "あります"], model: ["たまごや ぎゅうにゅう などが あります。", "なにも ありません。😅"] },
  ];
  app.innerHTML = `${backBtn}<h2>💬 Talk about you</h2><p class="sub">Worksheet part &lt;5&gt; plus two bonus questions. Type in kana or romaji (auto-converted), or tap word chips. Your answers are saved here.</p>
    <div class="stack">${Qs.map((q, i) => `<div class="card"><div class="row">${spk(q.q)}<span class="jp" style="font-size:19px">${i + 1}) ${esc(q.q)}</span></div>
      <input class="type-in" data-i="${i}" value="${esc(state.you[i] || "")}" placeholder="your answer…" autocomplete="off" autocapitalize="off" spellcheck="false" style="margin-top:8px">
      <div class="row" style="margin-top:6px">${q.help.map(h => `<span class="chip" data-add="${i}" data-w="${esc(h)}">${esc(h)}</span>`).join("")}</div>
      <div id="yf${i}" class="small" style="margin-top:6px"></div>
      <details style="margin-top:6px"><summary class="small muted">Model answers</summary>${q.model.map(m => `<div class="row">${spk(m)}<span class="jp">${esc(m)}</span></div>`).join("")}</details></div>`).join("")}
    <div class="row" style="justify-content:center"><button class="btn primary" id="copy">📋 Copy my answers</button></div></div>`;
  const feedback = i => {
    const v = norm(state.you[i] || ""), q = Qs[i], el = $(`#yf${i}`);
    if (!v) { el.innerHTML = ""; return; }
    const msgs = [];
    const usesI = /い(ます|ません)$/.test(v), usesA = /あり(ます|ません)$/.test(v);
    if (!usesI && !usesA) msgs.push("💡 End with あります / います (or the negative).");
    else if (q.verb === "い" && usesA && !/なにも/.test(v)) msgs.push("🤔 People/animals → います.");
    else if (q.verb === "あり" && usesI) msgs.push("🤔 Things → あります.");
    if (/(だれ|なに)もあります$|(だれ|なに)もいます$/.test(v)) msgs.push("⚠️ だれも / なにも need a negative: いません / ありません.");
    if (/が/.test(v) && /(だれ|なに)も/.test(v)) msgs.push("⚠️ With なにも/だれも, drop が.");
    if (!/が|も/.test(v) && (usesA || usesI) && !/^(あります|います)$/.test(v)) msgs.push("💡 Don't forget が after the thing/person.");
    if (/や/.test(v) && /など/.test(v)) msgs.push("✨ Nice use of や…など!");
    el.innerHTML = msgs.length ? msgs.join("<br>") : `<span style="color:var(--good)">✓ Looks good!</span>`;
    if (!msgs.length || msgs[0].startsWith("✨")) { if (!state.you["_ok" + i]) { state.you["_ok" + i] = 1; addXP(10); } }
    const okCount = Qs.filter((_, k) => state.you["_ok" + k]).length; setStars("you", okCount >= 5 ? 3 : okCount >= 3 ? 2 : okCount ? 1 : 0);
  };
  $$("input.type-in").forEach(inp => {
    const i = +inp.dataset.i;
    inp.onchange = inp.onblur = () => { if (/[a-z]/i.test(inp.value)) inp.value = romajiToKana(inp.value); state.you[i] = inp.value; save(); feedback(i); };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };
    feedback(i);
  });
  $$("[data-add]").forEach(c => c.onclick = () => {
    const i = +c.dataset.add, inp = $(`input[data-i="${i}"]`);
    const w = c.dataset.w; const glue = PARTICLES.includes(w) || VERBS.includes(w) ? "" : (inp.value && !/[がやとはもの]$/.test(inp.value) ? " " : "");
    inp.value = (inp.value + glue + w + (VERBS.includes(w) || /ません$/.test(w) ? "。" : "")).replace(/^\s+/, "");
    state.you[i] = inp.value; save(); feedback(i); speak(w, 1);
  });
  $("#copy").onclick = () => {
    const txt = Qs.map((q, i) => `${i + 1}) ${q.q}\n   ${state.you[i] || ""}`).join("\n");
    navigator.clipboard?.writeText(txt).then(() => toast("Copied! 📋"), () => toast("Copy failed"));
  };
}

// ---------- router ----------
let keyHandler = null; const timers = [];
document.addEventListener("keydown", e => { if (e.target.matches("input, textarea")) return; keyHandler && keyHandler(e); });
const ROUTES = { "": home, vocab, grammar, rush, where, scene, build: builder, memory, type: typing, store, quiz, worksheet, you, boss };
function route() {
  keyHandler = null; timers.splice(0).forEach(clearInterval);
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const r = location.hash.replace(/^#\/?/, "");
  (ROUTES[r] || home)();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
drawTop(); route();
