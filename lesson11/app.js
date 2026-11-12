"use strict";
/* Lektion 11 — counters and durations: lesson-specific games. Shared engine: ../assets/core.js */

// ---------- lesson path ----------
const MODES = [
  { id: "vocab", fn: () => vocab(), ico: "🃏", t: "1 · Vocabulary cards", d: "Flip cards with pictures and audio. Mark what you know." },
  { id: "grammar", fn: () => grammar(), ico: "📐", t: "2 · Grammar & counter tables", d: "ひとつ…とお, ～にん, ～まい, ～だい, durations, ぐらい, だけ." },
  { id: "rush", fn: () => rush(), ico: "⚡", t: "3 · Which counter?", d: "45-second rush: つ, にん, まい or だい?" },
  { id: "count", fn: () => countIt(), ico: "🔢", t: "4 · Count it!", d: "Look at the picture and say how many. Watch the tricky readings." },
  { id: "order", fn: () => orderUp(), ico: "🥪", t: "5 · Order up!", d: "Customers order — fill the tray. Later rounds are listening only." },
  { id: "time", fn: () => howLong(), ico: "⏱️", t: "6 · How long?", d: "Hours, minutes, days, weeks, months, years — read, hear, type." },
  { id: "build", fn: () => builder(), ico: "🧩", t: "7 · Sentence builder", d: "Put the tiles in order. Trap: no particle after the number!" },
  { id: "memory", fn: () => memory(), ico: "🧠", t: "8 · Memory match", d: "Find the pairs: picture ↔ word." },
  { id: "type", fn: () => typing(), ico: "⌨️", t: "9 · Spell it", d: "Type the word — romaji turns into kana as you type." },
  { id: "post", fn: () => postOffice(), ico: "📮", t: "10 · Post office role-play", d: "Small talk with the caretaker, then send a parcel to Australia." },
  { id: "quiz", fn: () => quiz(), ico: "✅", t: "11 · Particle or ✕?", d: "Where does a particle go — and where does nothing go?" },
  { id: "worksheet", fn: () => worksheet(), ico: "📝", t: "12 · My worksheets", d: "Feedback on your four pages, with corrections." },
  { id: "you", fn: () => you(), ico: "💬", t: "13 · Talk about you", d: "Family, how long in Japan, how far from home." },
  { id: "boss", fn: () => boss(), ico: "🐉", t: "14 · Boss exam", d: "20 mixed questions. Score 80 % to beat the dragon." },
];

// ---------- shared bits for the counting games ----------
const RULE = {
  tsu: "The つ-series is its own set of words: ひとつ ふたつ みっつ よっつ いつつ むっつ ななつ やっつ ここのつ とお.",
  nin: "ひとり and ふたり are special. 4 people = よにん (not よんにん).",
  mai: "～まい is regular: just number + まい.",
  dai: "～だい is regular: just number + だい.",
  kai: "Small っ with 1, 6, 8, 10: いっかい, ろっかい, はっかい, じゅっかい.",
  jikan: "Like the clock: 4 → よじかん, 7 → しちじかん, 9 → くじかん.",
  fun: "ぷん after 1, 3, 4, 6, 8, 10: いっぷん, さんぷん, よんぷん, ろっぷん, はっぷん, じゅっぷん.",
  nichi: "Days 2–10 have their own words: ふつか みっか よっか いつか むいか なのか ようか ここのか とおか. (よっか = 4, ようか = 8!)",
  shuukan: "Small っ with 1, 8, 10: いっしゅうかん, はっしゅうかん, じゅっしゅうかん.",
  kagetsu: "Small っ with 1, 6, 8, 10: いっかげつ, ろっかげつ, はっかげつ, じゅっかげつ.",
  nen: "4 years = よねん (not よんねん).",
};
const CONFUSE = { "よっか": "ようか", "ようか": "よっか", "よっつ": "やっつ", "やっつ": "よっつ", "みっつ": "むっつ", "むっつ": "みっつ", "いつつ": "いっつ", "なのか": "ななにち",
  "くじかん": "きゅうじかん", "しちじかん": "なのじかん", "ふつか": "ふたか", "いつか": "ごにち", "とおか": "じゅうにち", "ひとり": "ひとつ", "ふたり": "ふたつ", "とお": "じゅうつ" };
// also accepted when typed
const ALSO = { "しちじかん": ["ななじかん"], "ななにん": ["しちにん"], "ななねん": ["しちねん"], "はっかげつ": ["はちかげつ"], "じゅっぷん": ["じっぷん"], "きゅうにん": ["くにん"], "じゅっしゅうかん": ["じっしゅうかん"], "じゅっかげつ": ["じっかげつ"] };
// three wrong readings that a learner might really pick
function distract(n, c, family) {
  const right = reading(n, c), out = [];
  const add = r => { if (r && r !== right && !out.includes(r) && !(ALSO[right] || []).includes(r)) out.push(r); };
  add(naive(n, c));
  add(CONFUSE[right]);
  const rest = [];
  for (const oc of family) if (oc !== c) rest.push(reading(n, oc));
  for (const d of [1, -1, 4, -4]) if (n + d >= 1 && (n > 10 ? (n + d) % 10 : n + d <= 10)) rest.push(reading(n + d, c));
  shuffle(rest).forEach(add);
  return out.slice(0, 3);
}
const THINGS = ["tsu", "nin", "mai", "dai"], TIMES = ["jikan", "fun", "nichi", "shuukan", "kagetsu", "nen"];
const tipFor = (n, c) => irregular(n, c) ? `<div class="small" style="margin-top:6px">💡 ${RULE[c]}</div>` : "";
const bar = (i, n, right, label = "") => `${backBtn}<div class="plabel"><span>${label}${i + 1} / ${n}</span><span>✓ ${right}</span></div><div class="progress"><div style="width:${i / n * 100}%"></div></div>`;
const done = (ico, right, n, s, id) => { setStars(id, s);
  app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${ico} ${right}/${n}</div><p>${starStr(s)}</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Again</button>${nextBtn(id)}</div></div>`;
  if (s === 3) confetti(); };

// ---------- 2. grammar ----------
function grammar() {
  const table = cs => `<div style="overflow-x:auto"><table class="t ctr"><tr><th></th>${cs.map(c => `<th>${COUNTERS[c].name}<br><span class="small">${COUNTERS[c].use}</span></th>`).join("")}</tr>
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<tr><td><b>${n}</b></td>${cs.map(c => `<td class="jp ${irregular(n, c) ? "irr" : ""}" data-say="${reading(n, c)}">${reading(n, c)}</td>`).join("")}</tr>`).join("")}
    <tr><td>?</td>${cs.map(c => `<td class="jp" data-say="${COUNTERS[c].q}"><b>${COUNTERS[c].q}</b></td>`).join("")}</tr></table></div>`;
  app.innerHTML = `${backBtn}<h2>Grammar & counter tables</h2><p class="sub">Tap any word in a table to hear it. <span class="irr">Red</span> = irregular reading, learn these by heart.</p>
  <div class="stack">
  <div class="card gp"><h3>① Counting things and people</h3>
    <p>Japanese counts with <b>number + counter</b>. Which counter depends on what you count:</p>
    ${table(["tsu", "nin", "mai", "dai"])}
    <div class="tip"><b>Which one?</b> 🍎🥚🪑 general things → <span class="jp">～つ</span> · 👦👩 people → <span class="jp">～にん</span> · ✉️💿👕 thin, flat → <span class="jp">～まい</span> · 🚲💻📺 machines, vehicles → <span class="jp">～だい</span></div>
    <div class="tip"><b>Above 10</b> the つ-series ends: 11 apples = <span class="jp">りんごが じゅういち あります</span>.</div>
  </div>

  <div class="card gp"><h3>② Where the number goes — and the missing particle</h3>
    <div class="pattern jp"><span class="slot">THING</span> を／が <span class="slot">NUMBER</span> <span class="slot">VERB</span></div>
    ${ex("りんごを いつつ たべました。", "Ich habe fünf Äpfel gegessen. / I ate five apples.")}
    ${ex("じてんしゃを にだい かいました。", "Ich habe zwei Fahrräder gekauft.")}
    ${ex("がくせいが はちにん います。", "Es sind acht Schüler da.")}
    ${ex("きってを ごまい ください。", "Fünf Briefmarken, bitte.")}
    <div class="tip"><b>The rule to remember:</b> the particle sticks to the <i>thing</i>. After the number comes <b>nothing</b> — not を, not が, not に. <span class="jp">✗ じてんしゃ にだいを かいました</span></div>
    <p>Asking: <b class="jp">いくつ・なんにん・なんまい・なんだい</b> stand where the number stands.</p>
    ${ex("たまごが いくつ ありますか。 —— よっつ あります。", "Wie viele Eier gibt es? — Vier.")}
    ${ex("きょうだいが なんにん いますか。 —— さんにん います。", "Wie viele Geschwister haben Sie? — Drei.")}
  </div>

  <div class="card gp"><h3>③ Family: “I have …”</h3>
    <div class="pattern jp">わたしは <span class="slot">FAMILY</span> が <span class="slot">NUMBER</span> います</div>
    ${ex("わたしは あねが ひとり います。", "Ich habe eine ältere Schwester.")}
    <table class="t jp"><tr><th></th><th>my own</th><th>someone else's</th></tr>
      <tr><td>older brother</td><td>${J("あに")}</td><td>${J("おにいさん")}</td></tr><tr><td>older sister</td><td>${J("あね")}</td><td>${J("おねえさん")}</td></tr>
      <tr><td>younger brother</td><td>${J("おとうと")}</td><td>${J("おとうとさん")}</td></tr><tr><td>younger sister</td><td>${J("いもうと")}</td><td>${J("いもうとさん")}</td></tr></table>
  </div>

  <div class="card gp"><h3>④ How long? — lengths of time</h3>
    ${table(["jikan", "fun", "nichi"])}
    ${table(["shuukan", "kagetsu", "nen"])}
    <p>A length of time also stands bare before the verb — <b>no に</b>:</p>
    ${ex("まいにち はちじかん はたらきます。", "Ich arbeite jeden Tag acht Stunden.")}
    ${ex("かいしゃを よっか やすみました。", "Ich habe vier Tage in der Firma gefehlt.")}
    <div class="tip"><b>Point vs length:</b> <span class="jp">9じ<b>に</b> おきます</span> (at 9 — a point, with に) but <span class="jp">9じかん ねます</span> (for 9 hours — a length, no に).</div>
    <p>Asking: <b class="jp">どのくらい</b> (how long), or exactly: <span class="jp">なんじかん・なんぷん・なんにち・なんしゅうかん・なんかげつ・なんねん</span>.</p>
    ${ex("いままで どのくらい にほんごを べんきょうしましたか。 —— さんかげつ べんきょうしました。", "Wie lange haben Sie bis jetzt Japanisch gelernt? — Drei Monate.")}
    ${ex("これから どのくらい にほんに いますか。 —— にしゅうかん います。", "Wie lange bleiben Sie noch in Japan? — Zwei Wochen.")}
    <div class="tip"><b>いままで vs これから:</b> <span class="jp">いままで</span> (until now) → past tense. <span class="jp">これから</span> (from now) → います／ます, not past.</div>
  </div>

  <div class="card gp"><h3>⑤ <span class="jp">～ぐらい</span> about · <span class="jp">～だけ</span> only</h3>
    ${ex("いちねんぐらい ちゅうごくごを ならいました。", "Ich habe ungefähr ein Jahr Chinesisch gelernt.")}
    ${ex("じゅっぷんだけ やすみました。", "Ich habe nur zehn Minuten Pause gemacht.")}
    <p class="small muted">Both come right after the amount. くらい and ぐらい are the same word.</p>
  </div>

  <div class="card gp"><h3>⑥ <span class="jp">かかります</span> — it takes (time / money)</h3>
    <div class="pattern jp"><span class="slot">A</span> から <span class="slot">B</span> まで <span class="slot">LENGTH</span> かかります</div>
    ${ex("くにから にほんまで ひこうきで じゅうさんじかんぐらい かかります。", "Von meinem Land bis Japan dauert es mit dem Flugzeug etwa 13 Stunden.")}
    ${ex("えきまで どのくらい かかりますか。", "Wie lange dauert es bis zum Bahnhof?")}
  </div>

  <div class="card gp"><h3>⑦ How often: <span class="jp">[period] に [number]かい</span></h3>
    ${ex("いっしゅうかんに にかい テニスを します。", "Ich spiele zweimal pro Woche Tennis.")}
    <p class="small muted">Here the period <i>does</i> take に — it means “per”.</p>
  </div>

  <div class="card gp"><h3>💬 Conversation phrases</h3>
    ${ex("いい てんきですね。おでかけですか。 —— ええ、ちょっと ゆうびんきょくまで。", "Schönes Wetter, nicht? Gehen Sie aus? — Ja, nur kurz zur Post.")}
    ${ex("いって いらっしゃい。 —— いって きます。", "Bis später! — Bis gleich!")}
    ${ex("これ、オーストラリアまで おねがいします。", "Das hier bitte nach Australien.")}
    ${ex("ふなびんですか、こうくうびんですか。", "Seepost oder Luftpost?")}
    ${ex("かしこまりました。", "Sehr wohl.")}
  </div>
  <div class="row center" style="justify-content:center"><a class="btn primary" href="#/rush">Play: Which counter? →</a></div>
  </div>`;
  setStars("grammar", 3);
}

// ---------- 3. which counter? ----------
function rush() {
  const btns = [["tsu", "～つ", "things"], ["nin", "～にん", "people"], ["mai", "～まい", "flat"], ["dai", "～だい", "machines"]];
  app.innerHTML = `${backBtn}<h2>⚡ Which counter?</h2>
    <p class="sub">45 seconds. Tap the counter that fits. Keys <b>1–4</b>. Combos give bonus points!</p>
    <div class="card center stack" style="text-align:center"><div style="font-size:50px">🍎 👦 ✉️ 🚲</div><button class="btn primary" id="go">Start</button>
    ${state.stars.rushBest ? `<p class="muted small">Best: ${state.stars.rushBest}</p>` : ""}</div>`;
  $("#go").onclick = () => {
    let score = 0, combo = 0, left = 45, cur, mistakes = [], ended = false;
    app.innerHTML = `${backBtn}<div class="plabel"><span>Score <b id="sc">0</b></span><span class="combo" id="cb"></span><span id="tl">45 s</span></div>
      <div class="timer"><div id="tb" style="width:100%"></div></div>
      <div class="card" style="margin-top:12px"><div class="rush-card" id="rc"></div><p class="small muted" id="rm" style="text-align:center;min-height:22px"></p>
      <div class="rush-btns">${btns.map(([c, l, h], i) => `<button class="c" data-k="${c}">${l}<br><span class="small muted" style="font:12px var(--ui)">${i + 1} · ${h}</span></button>`).join("")}</div></div>`;
    const next = () => { cur = pick(COUNT_ITEMS.filter(p => p !== cur)); $("#rc").innerHTML = `<span class="emo">${cur.e}</span><span class="jp">${J(cur.k)}</span>`; };
    const answer = k => {
      if (ended) return;
      const rc = $("#rc");
      if (k === cur.c) { combo++; score += combo >= 5 ? 2 : 1; beep(true); rc.classList.remove("pop"); void rc.offsetWidth; rc.classList.add("pop"); $("#rm").textContent = ""; }
      else { combo = 0; beep(false); rc.classList.remove("shake"); void rc.offsetWidth; rc.classList.add("shake"); mistakes.push(cur);
        $("#rm").innerHTML = `<span class="jp">${J(cur.k)}</span> → <b class="hl-p jp">${COUNTERS[cur.c].name}</b> (${COUNTERS[cur.c].use})`; }
      $("#sc").textContent = score; $("#cb").textContent = combo >= 3 ? `🔥 combo ×${combo}${combo >= 5 ? " (double!)" : ""}` : "";
      next();
    };
    $$("[data-k]").forEach(b => b.onclick = () => answer(b.dataset.k));
    keyHandler = e => { const b = btns[+e.key - 1]; if (b) answer(b[0]); };
    next();
    const tm = setInterval(() => {
      left -= 0.1; const tb = $("#tb"); if (!tb) { clearInterval(tm); return; }
      tb.style.width = left / 45 * 100 + "%"; $("#tl").textContent = Math.ceil(left) + " s";
      if (left <= 0) {
        clearInterval(tm); ended = true;
        const s = score >= 26 ? 3 : score >= 16 ? 2 : 1; setStars("rush", s); addXP(score * 2);
        if (score > (state.stars.rushBest || 0)) { state.stars.rushBest = score; save(); }
        const uniq = [...new Set(mistakes)];
        app.innerHTML = `${backBtn}<div class="card stack" style="text-align:center"><div class="result-big">${score}</div><p>${starStr(s)} · best ${state.stars.rushBest}</p>
          ${uniq.length ? `<div style="text-align:left"><b>Review:</b>${uniq.map(m => `<div class="jp" style="font-size:18px">${m.e} ${J(m.k)} → <span class="hl-p">${COUNTERS[m.c].name}</span></div>`).join("")}</div>` : "<p>No mistakes! 🎯</p>"}
          <div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Play again</button>${nextBtn("rush")}</div></div>`;
        if (s === 3) confetti();
      }
    }, 100);
    timers.push(tm);
  };
}

// One question with either four options or a text field. Calls after(ok) when answered.
function askReading({ head, body, right, wrong, typed, after, sayAfter, extra = "" }) {
  const finish = ok => {
    beep(ok); if (ok) addXP(5);
    $("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><div class="h">${ok ? "せいかい！ ✓" : "The answer is:"}</div>
      <div class="row">${spk(sayAfter)}<span class="ja jp" style="font-size:22px">${J(sayAfter)}</span></div><div class="ro">${esc(kanaToRomaji(sayAfter))}</div>${extra}</div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="nx">Next →</button></div>`;
    speak(sayAfter); $("#nx").onclick = () => after(ok); $("#nx").focus();
    keyHandler = e => { if (e.key === "Enter") after(ok); };
  };
  if (typed) {
    app.innerHTML = `${head}<div class="card stack">${body}
      <input class="type-in" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the reading (romaji → kana)">
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="go">Check</button></div><div id="fb"></div></div>`;
    const inp = $("#in"); liveKana(inp); inp.focus();
    let answered = false;
    const check = () => {
      if (answered) return;
      inp.value = finishKana(inp.value); const got = norm(inp.value); if (!got) return;
      answered = true; inp.disabled = true; $("#go").style.display = "none";
      finish(got === norm(right) || (ALSO[right] || []).includes(got));
    };
    $("#go").onclick = check; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); check(); } };
    return;
  }
  const opts = shuffle([right, ...wrong]);
  app.innerHTML = `${head}<div class="card">${body}<div class="opts two">${opts.map((o, i) => `<button class="opt" data-o="${esc(o)}"><span class="key">${i + 1}</span>${esc(o)}</button>`).join("")}</div><div id="fb"></div></div>`;
  let answered = false;
  const choose = b => {
    if (answered) return; answered = true;
    $$(".opt").forEach(x => { x.disabled = true; if (x.dataset.o === right) x.classList.add("right"); });
    if (b.dataset.o !== right) b.classList.add("wrong");
    finish(b.dataset.o === right);
  };
  $$(".opt").forEach(b => b.onclick = () => choose(b));
  keyHandler = e => { const b = $$(".opt")[+e.key - 1]; if (b) choose(b); };
}

// ---------- 4. count it ----------
function countIt() {
  const N = 12; let i = 0, right = 0;
  const round = () => {
    if (i >= N) { addXP(right * 2); return done("🔢", right, N, right >= 11 ? 3 : right >= 8 ? 2 : 1, "count"); }
    const it = pick(COUNT_ITEMS), c = it.c;
    const n = c === "nin" ? pick([1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9]) : pick([1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10]);
    const verb = c === "nin" ? "います" : "あります";
    const q = `${it.k}が ${COUNTERS[c].q} ${verb}か。`;
    askReading({
      head: bar(i, N, right),
      body: `<div class="count-grid">${Array(n).fill(`<span>${it.e}</span>`).join("")}</div><div class="q jp" style="text-align:center">${J(q)} ${spk(q)}</div>`,
      right: reading(n, c), wrong: distract(n, c, THINGS), typed: i % 3 === 2,
      sayAfter: `${reading(n, c)} ${verb}。`, extra: tipFor(n, c),
      after: ok => { if (ok) right++; i++; round(); },
    });
  };
  round();
}

// ---------- 5. order up ----------
const CAFE = [{ k: "サンドイッチ", e: "🥪" }, { k: "カレー", e: "🍛" }, { k: "アイスクリーム", e: "🍦" }, { k: "りんご", e: "🍎" }, { k: "みかん", e: "🍊" }, { k: "コーヒー", e: "☕" }];
const POST = [{ k: "きって", e: STAMP }, { k: "はがき", e: POSTCARD }, { k: "ふうとう", e: "✉️" }];
function orderUp() {
  const N = 6; let i = 0, right = 0;
  const canHear = "speechSynthesis" in window;
  const round = () => {
    if (i >= N) { addXP(right * 6); return done("🥪", right, N, right >= 6 ? 3 : right >= 4 ? 2 : 1, "order"); }
    const post = i % 2 === 1, menu = post ? POST : CAFE, c = post ? "mai" : "tsu";
    const wanted = sample(menu, post ? 2 : i >= 4 ? 3 : 2).map(m => ({ m, n: 1 + Math.floor(Math.random() * (post ? 10 : 6)) }));
    const text = wanted.map(w => `${w.m.k}を ${reading(w.n, c)}`).join("と ") + " ください。";
    const hide = i >= 2 && canHear && state.sound;
    const tray = Object.fromEntries(menu.map(m => [m.k, 0]));
    let first = true, solved = false;
    app.innerHTML = `${bar(i, N, right, post ? "📮 Post office · " : "☕ Café · ")}
      <div class="card stack"><div class="msg"><div class="who">${pick(["👵 おきゃくさん", "🧑 おきゃくさん", "👩 おきゃくさん"])}${hide ? " — listen!" : ""}</div>
        <div class="row" style="flex-wrap:nowrap">${spk(text)}<span class="ja ${hide ? "blur" : ""}" id="otext">${esc(text)}</span></div>
        ${hide ? `<button class="back" id="show">👁 Show the text</button>` : ""}</div>
      <div id="tray">${menu.map(m => `<div class="menu-row" data-k="${esc(m.k)}"><span class="me">${m.e}</span><span class="jp mk">${J(m.k)}</span>
        <span class="stepper"><button data-d="-1" aria-label="less">−</button><b>0</b><button data-d="1" aria-label="more">+</button></span></div>`).join("")}</div>
      <div id="fb"></div><div class="row" style="justify-content:flex-end"><button class="btn primary" id="chk">かしこまりました！</button></div></div>`;
    speak(text);
    if (hide) $("#show").onclick = () => { $("#otext").classList.remove("blur"); $("#show").remove(); };
    $$("#tray .menu-row").forEach(row => $$("button", row).forEach(b => b.onclick = () => {
      if (solved) return;
      const k = row.dataset.k; tray[k] = Math.max(0, Math.min(10, tray[k] + +b.dataset.d)); $("b", row).textContent = tray[k]; row.classList.remove("bad");
    }));
    const check = () => {
      if (solved) { i++; round(); return; }
      const bad = menu.filter(m => tray[m.k] !== (wanted.find(w => w.m === m)?.n || 0));
      if (!bad.length) {
        solved = true; if (first) right++; beep(true); addXP(3);
        $("#otext").classList.remove("blur");
        $("#fb").innerHTML = `<div class="fb ok"><div class="h">かしこまりました！ 🙇</div>${wanted.map(w => `${w.m.e} × ${w.n} = <span class="jp">${J(reading(w.n, c))}</span>`).join(" · ")}</div>`;
        $("#chk").textContent = "Next →"; keyHandler = e => { if (e.key === "Enter") check(); };
      } else {
        first = false; beep(false); $("#otext").classList.remove("blur"); $("#show")?.remove();
        bad.forEach(m => $(`#tray .menu-row[data-k="${m.k}"]`).classList.add("bad"));
        $("#fb").innerHTML = `<div class="fb no"><div class="h">すみません… not quite.</div>Check the red rows against the order (the text is shown now). ${RULE[c]}</div>`;
      }
    };
    $("#chk").onclick = check;
  };
  round();
}

// ---------- 6. how long ----------
function howLong() {
  const list = sample(DURATIONS, 12); let i = 0, right = 0;
  const round = () => {
    if (i >= list.length) { addXP(right * 2); return done("⏱️", right, list.length, right >= 11 ? 3 : right >= 8 ? 2 : 1, "time"); }
    const { n, c, ctx } = list[i], r = reading(n, c), kind = i % 3;
    const head = bar(i, list.length, right), after = ok => { if (ok) right++; i++; round(); };
    const ctxLine = `<p class="small muted jp" style="text-align:center;margin:0 0 10px">${J(ctx)}</p>`;
    if (kind === 1) { // kana / audio → which length?
      const wrong = [];
      const add = d => { if (d !== disp(n, c) && !wrong.includes(d)) wrong.push(d); };
      shuffle(TIMES.filter(x => x !== c)).slice(0, 2).forEach(oc => add(disp(n, oc)));
      const twin = { 4: 8, 8: 4, 1: 7, 7: 1, 6: 8, 9: 5, 2: 3, 3: 2, 5: 9, 10: 4 }[n] || n + 1;
      add(disp(twin, c)); add(disp(n + 1, c));
      speak(r);
      return askReading({ head, body: `<div class="dur-big jp">${spk(r)} ${esc(r)}</div><p class="small muted" style="text-align:center">How long is that?</p>`,
        right: disp(n, c), wrong: wrong.slice(0, 3), sayAfter: r, extra: `<div class="small">${COUNTERS[c].use}: ${disp(n, c)}</div>${tipFor(n, c)}`, after });
    }
    askReading({ head, body: `<div class="dur-big">${disp(n, c)}</div>${ctxLine}<p class="small muted" style="text-align:center">How do you read it?</p>`,
      right: r, wrong: distract(n, c, TIMES), typed: kind === 2, sayAfter: r, extra: tipFor(n, c), after });
  };
  round();
}

// ---------- 10. post office role-play ----------
function postOffice() {
  const script = [
    { who: "📖", tr: "Morning. You leave your flat with a parcel. The caretaker (かんりにん) is outside." },
    { who: "🧹 かんりにん", ja: "いい てんきですね。おでかけですか。", tr: "Nice weather, isn't it? Going out?" },
    { ask: [["ええ、ちょっと ゆうびんきょくまで。", "Yes, just to the post office.", true],
      ["ええ、ちょっと ゆうびんきょくを。", "", "Where you are heading takes <b>まで</b> (as far as)."],
      ["いいえ、かしこまりました。", "", "かしこまりました is what shop staff say: ‘certainly’."]] },
    { who: "🧹 かんりにん", ja: "そうですか。いって いらっしゃい。", tr: "I see. See you later!" },
    { ask: [["いって きます。", "I'm off!", true],
      ["いって いらっしゃい。", "", "That is what the person who <i>stays</i> says. You are leaving."],
      ["おねがいします。", "", "That's a request, not a goodbye."]] },
    { who: "📖", tr: "📮 At the post office. Your parcel should go to Australia." },
    { ask: [["これ、オーストラリアまで おねがいします。", "This to Australia, please.", true],
      ["これ、オーストラリアから おねがいします。", "", "から = from. The parcel goes <b>to</b> Australia → まで."],
      ["これ、オーストラリアに います。", "", "That says ‘this is in Australia’."]] },
    { who: "🧑‍💼 きょくいん", ja: "はい。ふなびんですか、こうくうびんですか。", tr: "Certainly. By sea mail or airmail?" },
    { ask: [["こうくうびんは いくらですか。", "How much is airmail?", true],
      ["こうくうびんは いくつですか。", "", "いくつ = how many (things). Money → <b>いくら</b>."],
      ["こうくうびんは なんにんですか。", "", "なんにん = how many people."]] },
    { who: "🧑‍💼 きょくいん", ja: "7,600えんです。", tr: "7,600 yen." },
    { ask: [["ふなびんは？", "And sea mail?", true],
      ["ふなびんを？", "", "Comparing two things → topic は."],
      ["ふなびんまで？", "", "まで = as far as."]] },
    { who: "🧑‍💼 きょくいん", ja: "3,450えんです。", tr: "3,450 yen." },
    { ask: [["どのくらい かかりますか。", "How long does it take?", true],
      ["どのくらい いますか。", "", "います = to be / stay. ‘Take time’ = <b>かかります</b>."],
      ["いくつ かかりますか。", "", "いくつ counts things. Time → <b>どのくらい</b>."]] },
    { who: "🧑‍💼 きょくいん", kana: true, ja: "こうくうびんで なのか、ふなびんで にかげつぐらいです。", tr: "(Listen carefully — two questions follow.)" },
    { quiz: "How long does airmail take?", opts: [["7 days", true], ["4 days", "4 days would be よっか. He said <b>なのか</b>."], ["9 days", "9 days would be ここのか. He said <b>なのか</b>."]] },
    { quiz: "And sea mail?", opts: [["About 2 months", true], ["Exactly 2 weeks", "Weeks would be にしゅうかん. He said <b>にかげつぐらい</b>."], ["About 2 years", "Years would be にねん. He said <b>にかげつぐらい</b>."]] },
    { ask: [["じゃ、ふなびんで おねがいします。", "Then by sea mail, please.", true],
      ["じゃ、ふなびんを かかります。", "", "かかります is about time or cost, not a request."],
      ["じゃ、ふなびんが います。", "", "います is for people and animals."]] },
    { who: "🧑‍💼 きょくいん", ja: "かしこまりました。", tr: "Certainly." },
    { who: "📖", tr: "You also need five 80-yen stamps." },
    { ask: [["それから、80えんの きってを ごまい ください。", "And five 80-yen stamps, please.", true],
      ["それから、80えんの きってを ごだい ください。", "", "～だい is for machines. Stamps are flat → <b>ごまい</b>."],
      ["それから、80えんの きって ごまいを ください。", "", "を goes on the thing (きって<b>を</b>), nothing after the number."]] },
    { who: "🧑‍💼 きょくいん", ja: "はい。ぜんぶで 3,850えんです。", tr: "Here you are. That's 3,850 yen in total." },
    { who: "📖", tr: "🎉 Parcel sent!" },
  ];
  let step = 0, right = 0, asks = 0;
  app.innerHTML = `${backBtn}<h2>📮 Post office role-play</h2><p class="sub">Choose what you say. Listen to the answers.</p><div class="chat" id="chat"></div><div id="ctl" style="margin-top:14px"></div>`;
  const chat = $("#chat"), ctl = $("#ctl");
  const add = html => { chat.insertAdjacentHTML("beforeend", html); chat.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" }); };
  const nextStep = () => {
    if (step >= script.length) {
      const pct = right / asks, s = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1; setStars("post", s); addXP(right * 5);
      ctl.innerHTML = `<div class="card stack" style="text-align:center"><div class="result-big">📮 ${right}/${asks}</div><p>${starStr(s)} — first-try answers</p><div class="row" style="justify-content:center"><button class="btn primary" onclick="route()">Play again</button>${nextBtn("post")}</div></div>`;
      if (s === 3) confetti(); return;
    }
    const s = script[step++]; ctl.innerHTML = "";
    if (s.who) {
      add(`<div class="msg"><div class="who">${J(s.who)}</div>${s.ja ? `<div class="row" style="flex-wrap:nowrap">${spk(s.ja)}<span class="ja">${s.kana ? esc(s.ja) : J(s.ja)}</span></div><div class="ro">${esc(kanaToRomaji(s.ja))}</div>` : ""}<div class="tr">${esc(s.tr)}</div></div>`);
      if (s.ja) speak(s.ja);
      ctl.innerHTML = `<button class="btn primary" id="c">Continue →</button>`; $("#c").onclick = nextStep; $("#c").focus(); return;
    }
    const opts = shuffle(s.ask || s.opts), okAt = s.ask ? 2 : 1; asks++; let first = true;
    ctl.innerHTML = `${s.quiz ? `<p><b>${esc(s.quiz)}</b></p>` : `<p class="small muted">What do you say?</p>`}<div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${i + 1}</span>${s.ask ? J(o[0]) : esc(o[0])}</button>`).join("")}</div><div id="sfb"></div>`;
    $$("#ctl .opt").forEach(b => b.onclick = () => {
      const o = opts[+b.dataset.i];
      if (o[okAt] === true) {
        if (first) right++; beep(true);
        if (s.ask) { add(`<div class="msg me"><div class="who">🙋 you</div><div class="ja">${J(o[0])}</div><div class="tr">${esc(o[1])}</div></div>`); speak(o[0]); }
        else add(`<div class="msg me"><div class="who">✔</div>${esc(o[0])}</div>`);
        nextStep();
      } else { first = false; beep(false); b.classList.add("wrong"); b.disabled = true; $("#sfb").innerHTML = `<div class="fb no">${o[okAt]}</div>`; }
    });
  };
  nextStep();
}

// ---------- 11. grammar check & 14. boss ----------
function quiz() { mcqRun({ title: "Particle or ✕?", questions: sample(GRAMMAR_Q, 14), modeId: "quiz", pass: 0.85, next: "worksheet" }); }
function boss() {
  const qs = sample(GRAMMAR_Q, 8);
  sample(VOCAB.filter(v => ["Food & post", "Family & people", "Conversation", "Time"].includes(v.cat)), 4).forEach(v => qs.push(vocabQ(v)));
  for (let k = 0; k < 4; k++) {
    const it = pick(COUNT_ITEMS), n = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), verb = it.c === "nin" ? "います" : "あります";
    qs.push({ pic: `${it.e} × ${n}`, q: `${it.k}が（　）${verb}。`, o: [reading(n, it.c), ...distract(n, it.c, THINGS)], raw: true, ok: RULE[it.c], say: `${it.k}が ${reading(n, it.c)} ${verb}。`, why: [] });
  }
  sample(DURATIONS, 4).forEach(d => qs.push({ q: `${disp(d.n, d.c)} → ?`, o: [reading(d.n, d.c), ...distract(d.n, d.c, TIMES)], raw: true, ok: RULE[d.c], say: reading(d.n, d.c), why: [] }));
  mcqRun({ title: "🐉 Boss", questions: shuffle(qs), modeId: "boss", pass: 0.8, next: "" });
}

// ---------- 12. worksheets ----------
function worksheet() {
  setStars("worksheet", 3);
  const mark = ok => ok === true ? `<span class="mark ok">✓</span>` : ok === false ? `<span class="mark no">✗</span>` : `<span class="mark hm">△</span>`;
  const all = WORKSHEET.flatMap(s => s.items);
  app.innerHTML = `${backBtn}<h2>📝 My worksheets</h2>
    <p class="sub">Your handwritten answers on all four pages, checked. ✓ correct · △ small thing · ✗ fix. ${all.filter(x => x.ok === true).length} of ${all.length} lines are fully right.</p>
    <div class="card" style="margin-bottom:14px"><h3 style="margin-top:0">Three things to take away</h3>
      <ol style="margin:0;padding-left:20px"><li><b>を stays on the thing</b>, never on the number: <span class="jp">${J("じてんしゃを にだい かいました")}</span>.</li>
      <li><b>Don't drop sounds</b>: <span class="jp">さ<b>ん</b>まい・さんだ<b>い</b>・いちね<b>ん</b>・いっか<b>げつ</b>・やすみ<b>ますか</b></span>. Say the word aloud while writing.</li>
      <li><b class="jp">これから … います</b> (not します, not past).</li></ol></div>
    <div class="stack">${WORKSHEET.map(sec => `<div class="card"><h3 style="margin-top:0">${esc(sec.sec)}</h3>${sec.items.map(it => `
      <div class="ws-item"><div class="mine">${mark(it.ok)}${it.n} ${it.mine}</div>
        ${it.fix ? `<div class="row"><span class="fix">→ ${J(it.fix)}</span>${spk(it.fix)}</div>` : ""}
        ${it.note ? `<div class="small muted">${it.note}</div>` : ""}</div>`).join("")}</div>`).join("")}
    <div class="row" style="justify-content:center"><a class="btn primary" href="#/build">Practise the を rule in the sentence builder →</a></div></div>`;
}

// ---------- 13. talk about you ----------
function you() {
  const Qs = [
    { q: "きょうだいが なんにん いますか。", end: /い(ます|ません)$/, help: ["あに", "あね", "おとうと", "いもうと", "が", "ひとり", "ふたり", "さんにん", "います", "いません", "と"], model: ["ふたり います。", "あねが ひとりと おとうとが ひとり います。", "いません。"] },
    { q: "これから どのくらい にほんに いますか。", end: /います$/, help: ["いっしゅうかん", "にしゅうかん", "いっかげつ", "さんかげつ", "いちねん", "ぐらい", "います"], model: ["いっかげつ います。", "いちねんぐらい います。"] },
    { q: "あなたの くにから にほんまで どのくらい かかりますか。", end: /かかります$/, help: ["ひこうきで", "じゅうにじかん", "じゅうさんじかん", "ぐらい", "かかります"], model: ["ひこうきで じゅうさんじかんぐらい かかります。"] },
    { q: "いままで どのくらい にほんごを べんきょうしましたか。", end: /べんきょうしました$/, help: ["いっかげつ", "さんかげつ", "ろっかげつ", "いちねん", "ぐらい", "だけ", "べんきょうしました"], model: ["さんかげつ べんきょうしました。", "いちねんぐらい べんきょうしました。"] },
    { q: "まいにち なんじかん ねますか。", end: /ねます$/, help: ["ろくじかん", "しちじかん", "はちじかん", "ぐらい", "だけ", "ねます"], model: ["しちじかんぐらい ねます。"] },
    { q: "うちから えきまで どのくらい かかりますか。", end: /かかります$/, help: ["あるいて", "じてんしゃで", "ごふん", "じゅっぷん", "にじゅっぷん", "ぐらい", "かかります"], model: ["あるいて じゅっぷんぐらい かかります。"] },
  ];
  const QTY = "(じかん|しゅうかん|かげつ|ねん|ふん|ぷん|にち|にん|まい|だい|ひとり|ふたり|ふつか|みっか|よっか|いつか|むいか|なのか|ようか|ここのか|とおか)";
  app.innerHTML = `${backBtn}<h2>💬 Talk about you</h2><p class="sub">Your worksheet questions plus four more. Type romaji (it turns into kana) or tap the word chips. Answers are saved here.</p>
    <div class="stack">${Qs.map((q, i) => `<div class="card"><div class="row">${spk(q.q)}<span class="jp" style="font-size:19px">${i + 1}) ${J(q.q)}</span></div>
      <input class="type-in" data-i="${i}" value="${esc(state.you[i] || "")}" placeholder="romaji → kana" autocomplete="off" autocapitalize="off" spellcheck="false" style="margin-top:8px">
      <div class="row" style="margin-top:6px">${q.help.map(h => `<span class="chip" data-add="${i}" data-w="${esc(h)}">${esc(h)}</span>`).join("")}</div>
      <div id="yf${i}" class="small" style="margin-top:6px"></div>
      <details style="margin-top:6px"><summary class="small muted">Model answers</summary>${q.model.map(m => `<div class="row">${spk(m)}<span class="jp">${J(m)}</span></div>`).join("")}</details></div>`).join("")}
    <div class="row" style="justify-content:center"><button class="btn primary" id="copy">📋 Copy my answers</button></div></div>`;
  const feedback = i => {
    const v = norm(state.you[i] || ""), q = Qs[i], el = $(`#yf${i}`);
    if (!v) { el.innerHTML = ""; return; }
    const msgs = [];
    if (!q.end.test(v)) msgs.push(`💡 End with the verb from the question: <span class="jp">${q.model[0].split(" ").pop()}</span>`);
    if (new RegExp(QTY + "(を|が)").test(v) || (new RegExp(QTY + "に").test(v) && !/かい/.test(v) && !/(にん|ひとり|ふたり)に/.test(v))) msgs.push("⚠️ No particle after a number or a length of time.");
    if (!new RegExp(QTY).test(v) && !/いません$/.test(v)) msgs.push("💡 Say how many / how long (～にん, ～じかん, ～かげつ …).");
    if (/よんじかん|よんねん|よんにん|きゅうじかん|いちしゅうかん|いちかげつ|ろくかげつ|じゅうふん|じゅうぷん/.test(v)) msgs.push("🤔 Check the reading — one of the irregular ones (よじかん, よねん, よにん, くじかん, いっしゅうかん, いっかげつ, ろっかげつ, じゅっぷん).");
    el.innerHTML = msgs.length ? msgs.join("<br>") : `<span style="color:var(--good)">✓ Looks good!${/ぐらい|だけ/.test(v) ? " Nice use of ぐらい／だけ." : ""}</span>`;
    if (!msgs.length && !state.you["_ok" + i]) { state.you["_ok" + i] = 1; addXP(10); }
    const okCount = Qs.filter((_, k) => state.you["_ok" + k]).length; setStars("you", okCount >= 5 ? 3 : okCount >= 3 ? 2 : okCount ? 1 : 0);
  };
  $$("input.type-in").forEach(inp => {
    const i = +inp.dataset.i;
    liveKana(inp);
    inp.onchange = inp.onblur = () => { inp.value = finishKana(inp.value); state.you[i] = inp.value; save(); feedback(i); };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };
    feedback(i);
  });
  $$("[data-add]").forEach(c => c.onclick = () => {
    const i = +c.dataset.add, inp = $(`input[data-i="${i}"]`), w = c.dataset.w;
    const glue = ["が", "と", "ぐらい", "だけ"].includes(w) || !inp.value ? "" : " ";
    inp.value = inp.value + glue + w + (q_end(w) ? "。" : "");
    state.you[i] = inp.value; save(); feedback(i); speak(w, 1);
  });
  $("#copy").onclick = () => {
    const txt = Qs.map((q, i) => `${i + 1}) ${q.q}\n   ${state.you[i] || ""}`).join("\n");
    navigator.clipboard?.writeText(txt).then(() => toast("Copied! 📋"), () => toast("Copy failed"));
  };
}
const q_end = w => /(ます|ません|ました)$/.test(w);

boot();
