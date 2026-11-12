"use strict";
/* Shared lesson engine. Plain JS, no build step.
   Load order: <lesson>/data.js (VOCAB, KANJI, SENTENCES, LESSON …) → assets/core.js → <lesson>/app.js (MODES + games, ends with boot()). */

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
// Write kana words in kanji with furigana. Works chunk by chunk (text is spaced by word + particle).
const KANJI_KEYS = Object.keys(KANJI).sort((a, b) => b.length - a.length);
const AFTER = /^(?:$|の|に|が|は|も|や|と|を|で|へ|ね|よ|など|です|でした|じゃ|だ|か$|まで|から|ぐらい|くらい|だけ|ずつ)/;
function kanjify(text) {
  return String(text ?? "")
    .replace(/(おとこ|おんな)の ?こ(?=[がはもをにと。、\s]|$)/g, (m, w) => `${KANJI[w]}の{子|こ}`)
    .replace(/(おとこ|おんな)の ?ひと/g, (m, w) => `${KANJI[w]}の{人|ひと}`)
    .replace(/タイりょうり/g, "タイ{料理|りょうり}")
    .split(/([\s、。（）()？！?!「」・—→=…]+)/)
    .map(ch => {
      if (!ch || /[{}<>]/.test(ch)) return ch;
      for (const k of KANJI_KEYS) if (ch.startsWith(k) && AFTER.test(ch.slice(k.length))) return KANJI[k] + ch.slice(k.length);
      return ch;
    }).join("");
}
const J = s => ruby(kanjify(esc(s)));

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
const toKata = s => [...s].map(c => { const cp = c.codePointAt(0); return cp >= 0x3041 && cp <= 0x3096 ? String.fromCodePoint(cp + 0x60) : c; }).join("");
// ー → the vowel it lengthens, so "koonaa" (こおなあ) matches コーナー.
const VOWEL_OF = (() => { const m = {}; ["あかさたなはまやらわがざだばぱぁゃ", "いきしちにひみりぎじぢびぴぃ", "うくすつぬふむゆるぐずづぶぷぅゅ", "えけせてねへめれげぜでべぺぇ", "おこそとのほもよろをごぞどぼぽぉょ"].forEach((row, i) => [...row].forEach(c => m[c] = "あいうえお"[i])); return m; })();
const unLong = s => [...s].reduce((o, c) => o + (c === "ー" ? (VOWEL_OF[o.slice(-1)] || "") : c), "");
// Live romaji → kana inside an input, like a Japanese keyboard. A trailing single "n" waits (it may become な/に…).
// kata: write katakana. Letters typed in CAPITALS always become katakana.
function liveKana(inp, kata = false) {
  inp.setAttribute("autocorrect", "off");
  inp.addEventListener("input", e => {
    if (e.isComposing) return;
    const v = inp.value;
    if (!/[a-z'\-]/i.test(v)) return;
    const out = v.replace(/[a-z'\-]+/gi, (run, off) => {
      let hold = "";
      // a trailing "n" / "nn" waits for the next letter: "onn" + "a" → おんな, "kon" + "b" → こんb
      if (off + run.length === v.length) { const m = run.match(/n{1,2}$/i); if (m) { hold = m[0]; run = run.slice(0, -hold.length); } }
      const up = run === run.toUpperCase(), k = romajiToKana(run);
      // letters still waiting (e.g. "K" before "O") keep their case so CAPITALS stay katakana
      return (kata || up ? toKata(k) : k).replace(/[a-z]+/g, x => up ? x.toUpperCase() : x) + hold;
    });
    if (out !== v) inp.value = out;
  });
}
// Finish a field: convert any leftover romaji (e.g. a final "n").
const finishKana = (v, kata = false) => v.replace(/[a-z'\-]+/gi, run => { const k = romajiToKana(run); return kata || run === run.toUpperCase() ? toKata(k) : k; });
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
const KEY = LESSON.key;
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
  const set = LESSON.confetti || ["🎉", "✨", "🌸", "⭐"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span"); s.className = "confetti"; s.textContent = pick(set);
    s.style.left = Math.random() * 100 + "vw"; s.style.animationDuration = 1.6 + Math.random() * 1.8 + "s"; s.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(s); setTimeout(() => s.remove(), 4200);
  }
}
const starStr = n => "★".repeat(n) + "☆".repeat(3 - n);
const backBtn = `<button class="back" onclick="location.hash='#/'">← Lesson map</button>`;
// "Next: …" button to the mode after `id` in the lesson path.
function nextBtn(id) { const n = MODES[MODES.findIndex(m => m.id === id) + 1]; return n ? `<a class="btn" href="#/${n.id}">Next: ${n.t.replace(/^\d+ · /, "")} →</a>` : ""; }

// ---------- lesson map ----------
function home() {
  const total = MODES.length * 3, got = MODES.reduce((s, m) => s + (state.stars[m.id] || 0), 0);
  const known = VOCAB.filter(v => (state.words[v.id] || 0) >= 2).length;
  app.innerHTML = `
    <h2>${LESSON.title}</h2>
    <p class="sub">${LESSON.sub} Work down the path; every game gives XP. ⭐ ${got}/${total} · words known ${known}/${VOCAB.length}</p>
    <div class="path">${MODES.map(m => `
      <a class="tile step" href="#/${m.id}"><span class="num">${starStr(state.stars[m.id] || 0)}</span>
        <span class="ico">${m.ico}</span><h4>${m.t}</h4><p>${m.d}</p></a>`).join("")}
    </div>
    <p class="small muted" style="margin-top:20px">Tip: turn off <b>ふりがな</b> and <b>labels</b> at the top for extra challenge. Progress is saved in this browser.
      <button class="back" id="reset">Reset progress</button></p>`;
  $("#reset").onclick = () => { if (confirm(`Delete all progress for ${LESSON.name}?`)) { localStorage.removeItem(KEY); location.reload(); } };
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
    const kindNote = LESSON.kindNote ? LESSON.kindNote(v) : "";
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

// ---------- grammar example row ----------
function ex(ja, tr) { return `<div class="ex">${spk(ja)}<div class="t"><div class="ja">${ruby(kanjify(ja))}</div><div class="ro">${esc(kanaToRomaji(ja))}</div><div class="tr">${tr}</div></div></div>`; }

// ---------- 6. builder ----------
function builder() {
  const list = sample(SENTENCES, 10); let i = 0, right = 0;
  const show = () => {
    if (i >= list.length) {
      const s = right >= 9 ? 3 : right >= 6 ? 2 : 1; setStars("build", s); addXP(right * 6);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">🧩 ${right}/${list.length}</div><p>${starStr(s)} — correct on first check</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button>${nextBtn("build")}</div></div>`;
      if (s === 3) confetti(); return;
    }
    const S = list[i], toks = S.t.split(" ");
    const extra = LESSON.builderExtra(toks).filter(Boolean);
    const bank = shuffle([...toks, ...extra]).map((t, k) => ({ t, k }));
    let placed = [], checked = false, firstTry = true;
    app.innerHTML = `${backBtn}<div class="plabel"><span>${i + 1} / ${list.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / list.length * 100}%"></div></div>
      <div class="card"><div class="q-emo">${S.pic}</div><p style="text-align:center;font-size:17px;margin:4px 0 2px"><b>${esc(state.lang === "de" ? S.de : S.en)}</b></p><p class="small muted" style="text-align:center;margin:0 0 12px">${esc(state.lang === "de" ? S.en : S.de)} · ${extra.length} tile${extra.length === 1 ? " is" : "s are"} extra</p>
      <div class="slots jp" id="slots"></div><div class="bank" id="bank"></div><div id="fb"></div>
      <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn" id="clr">Clear</button><button class="btn primary" id="chk">Check</button></div></div>`;
    const cls = t => PARTICLES.includes(t) ? "part" : VERBS.includes(t) ? "verb" : "";
    const draw = () => {
      $("#slots").innerHTML = placed.map((b, j) => `<button class="tok ${cls(b.t)}" data-j="${j}">${J(b.t)}</button>`).join("");
      $("#bank").innerHTML = bank.map(b => `<button class="tok ${cls(b.t)} ${placed.includes(b) ? "used" : ""}" data-k="${b.k}">${J(b.t)}</button>`).join("");
      $$("#slots .tok").forEach(x => x.onclick = () => { if (checked) return; placed.splice(+x.dataset.j, 1); $("#slots").className = "slots jp"; draw(); });
      $$("#bank .tok").forEach(x => x.onclick = () => { if (checked) return; const b = bank.find(bb => bb.k === +x.dataset.k); if (!placed.includes(b)) { placed.push(b); speak(b.t, 1); } draw(); });
    };
    draw();
    $("#clr").onclick = () => { if (checked) return; placed = []; $("#slots").className = "slots jp"; draw(); };
    const check = () => {
      if (checked) { i++; show(); return; }
      const got = placed.map(b => b.t).join(" ");
      const said = got === S.t ? toks : placed.map(b => b.t);
      const sentence = said.join("") + "。";
      if (got === S.t || (S.alt || []).includes(got)) {
        checked = true; if (firstTry) right++; beep(true); addXP(4);
        $("#slots").className = "slots jp ok";
        $("#fb").innerHTML = `<div class="fb ok"><div class="row">${spk(sentence)}<span class="ja jp">${ruby(said.map(t => kanjify(esc(t))).join(""))}。</span></div><div class="ro">${esc(sentRomaji(said))}</div></div>`;
        speak(sentence); $("#chk").textContent = "Next →";
      } else {
        firstTry = false; beep(false); $("#slots").className = "slots jp no";
        const hint = LESSON.whyWrong(placed.map(b => b.t), toks);
        $("#fb").innerHTML = `<div class="fb no"><div class="h">Not yet</div>${hint}</div>`;
      }
    };
    $("#chk").onclick = check;
    keyHandler = e => { if (e.key === "Enter") check(); if (e.key === "Backspace" && !checked) { placed.pop(); draw(); } };
  };
  show();
}

// ---------- 7. memory ----------
function memory() {
  const groups = LESSON.memoryGroups;
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
  const face = c => c.side === "jp" ? `<span>${jpOf(c.v)}</span>` : (c.v.kind === "p" || c.v.textCard) ? `<span style="font-family:var(--ui);font-size:14px">${c.v.emo}<br>${esc(meaning(c.v))}</span>` : `<span><span class="e">${c.v.emo}</span><br><span style="font:12px var(--ui)">${esc(meaning(c.v))}</span></span>`;
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
          setTimeout(() => { app.insertAdjacentHTML("beforeend", `<div class="card stack" style="text-align:center;margin-top:14px"><b>Cleared in ${moves} moves ${starStr(s)}</b><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Another set</button>${nextBtn("memory")}</div></div>`); if (s === 3) confetti(); }, 300);
        }
      } else { lock = true; beep(false); setTimeout(() => { [e1, e2].forEach(e => { e.classList.remove("open"); e.textContent = "?"; }); open = []; lock = false; }, 900); }
    }
  });
}

// ---------- 8. spell it ----------
function typing() {
  const pool = VOCAB.filter(v => !/[～\[\]A-Z]/.test(v.kana) && v.kind !== "x" && !v.noType);
  const list = sample(pool, 10); let i = 0, right = 0;
  const show = () => {
    if (i >= list.length) {
      const s = right >= 9 ? 3 : right >= 6 ? 2 : 1; setStars("type", s); addXP(right * 5);
      app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">⌨️ ${right}/${list.length}</div><p>${starStr(s)}</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button>${nextBtn("type")}</div></div>`;
      if (s === 3) confetti(); return;
    }
    const v = list[i]; let hinted = 0, done = false;
    app.innerHTML = `${backBtn}<div class="plabel"><span>${i + 1} / ${list.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / list.length * 100}%"></div></div>
      <div class="card stack"><div class="q-emo">${v.emo}</div><div style="text-align:center"><b style="font-size:20px">${esc(meaning(v))}</b><div class="muted small">${esc(other(v))}</div></div>
      <input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type romaji → becomes kana (e.g. reizouko)">
      <div class="ro" id="pv" style="min-height:18px;font-size:16px"></div>
      <div class="row" style="justify-content:space-between"><button class="btn" id="hint">💡 Hint</button><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
    const inp = $("#in"); inp.focus();
    const kata = /[ァ-ヺ]/.test(v.kana);
    liveKana(inp, kata);
    const target = norm(v.kana);
    $("#hint").onclick = () => { hinted++; const shown = [...v.kana.replace(/\s/g, "")].slice(0, hinted).join(""); $("#pv").textContent = `starts with: ${shown}…`; speak(v.kana); };
    const check = () => {
      if (done) { i++; show(); return; }
      inp.value = finishKana(inp.value, kata);
      const raw = inp.value; const got = unLong(norm(raw));
      if (!got) return;
      done = true; const ok = got === unLong(target);
      if (ok && !hinted) { right++; word(v.id, 1); } else if (!ok) word(v.id, -1);
      beep(ok); if (ok) addXP(3);
      $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? (hinted ? "Correct (with hint)" : "せいかい！") : "The answer is:"}</div><div class="row">${spk(v.kana)}<span class="ja jp" style="font-size:24px">${jpOf(v)}</span> <span class="ro">${kanaToRomaji(v.kana)}</span></div>${ok ? "" : `<div class="small">You wrote: ${esc(raw)}</div>`}</div>`;
      speak(v.kana); $("#go").textContent = "Next →";
    };
    $("#go").onclick = check; inp.onkeydown = e => { if (e.key === "Enter") check(); };
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
        <p>${boss ? (pct >= pass ? "You beat the dragon! ${LESSON.name} mastered. 🏆" : `The dragon survived… you need ${Math.ceil(pass * questions.length)}.`) : ""} ${starStr(s)}</p>
        ${wrong.length ? `<div style="text-align:left"><b>Review these:</b>${wrong.map(w => `<div class="ws-item"><div class="jp">${w.q}</div><div class="fix">→ ${w.a}</div></div>`).join("")}</div>` : ""}
        <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Try again</button>${next ? `<a class="btn" href="#/${next}">Next →</a>` : ""}</div></div>`;
      if (s === 3) confetti(boss ? 90 : 40); return;
    }
    const q = questions[i];
    const opts = shuffle(q.o.map((o, k) => ({ o, k })));
    app.innerHTML = `${backBtn}<div class="plabel"><span>${title} · ${i + 1} / ${questions.length}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / questions.length * 100}%"></div></div>
      <div class="card">${q.pic ? `<div class="q-emo">${q.pic}</div>` : ""}<div class="q jp">${J(q.q).replace(/（　）/g, '<span class="blank"></span>')}</div>
      <div class="opts ${q.o.length === 2 ? "two" : ""}">${opts.map((x, n) => `<button class="opt" data-k="${x.k}"><span class="key">${n + 1}</span>${q.raw ? esc(x.o) : J(x.o)}</button>`).join("")}</div><div id="fb"></div></div>`;
    let done = false;
    const choose = b => {
      if (done) return; done = true;
      const k = +b.dataset.k, ok = k === 0;
      $$(".opt").forEach(x => { x.disabled = true; if (+x.dataset.k === 0) x.classList.add("right"); });
      if (!ok) { b.classList.add("wrong"); wrong.push({ q: J(q.q), a: q.raw ? esc(q.o[0]) : J(q.o[0]) }); }
      else right++;
      if (q.word) word(q.word, ok ? 1 : -1);
      beep(ok);
      const sayText = q.say || (/^[ぁ-んァ-ン]/.test(q.o[0]) ? q.o[0] : "");
      $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "✗ " + (q.why?.[k] || "Not quite.")}</div><div>${q.ok || ""}</div>${sayText ? `<div class="row" style="margin-top:6px">${spk(sayText)}<span class="ja jp">${J(sayText)}</span></div>` : ""}</div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
      $("#nx").onclick = () => { i++; show(); }; $("#nx").focus();
      keyHandler = e => { if (e.key === "Enter") { i++; show(); } };
    };
    $$(".opt").forEach(b => b.onclick = () => choose(b));
    keyHandler = e => { const b = $$(".opt")[+e.key - 1]; if (b) choose(b); };
  };
  show();
}
function vocabQ(v) {
  const others = sample(VOCAB.filter(x => x !== v && x.cat === v.cat), 3);
  if (Math.random() < 0.5) return { q: `${v.kanji || v.kana}  =  ?`, o: [meaning(v), ...others.map(meaning)], ok: `<span class="jp">${jpOf(v)}</span> = ${esc(meaning(v))} (${esc(other(v))})`, say: v.kana, word: v.id, why: [] };
  return { q: `${v.emo}  ${meaning(v)}  →  ?`, o: [v.kanji || v.kana, ...others.map(x => x.kanji || x.kana)], ok: `${esc(meaning(v))} = <span class="jp">${jpOf(v)}</span>`, say: v.kana, word: v.id, why: [] };
}

// ---------- router ----------
let keyHandler = null; const timers = [];
document.addEventListener("keydown", e => { if (e.target.matches("input, textarea")) return; keyHandler && keyHandler(e); });
const ROUTES = { "": home };
function route() {
  keyHandler = null; timers.splice(0).forEach(clearInterval);
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const r = location.hash.replace(/^#\/?/, "");
  (ROUTES[r] || home)();
  window.scrollTo(0, 0);
}
// Called at the end of <lesson>/app.js, once MODES (each with its fn) exists.
function boot() {
  MODES.forEach(m => ROUTES[m.id] = m.fn);
  window.addEventListener("hashchange", route);
  drawTop(); route();
}
