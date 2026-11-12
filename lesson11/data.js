"use strict";
// Lektion 11 (Minna no Nihongo I) — counters and durations. Content only; the engine is ../assets/core.js.
// Markup in Japanese strings: {漢字|かな} renders as furigana.

// Small drawn icons where no emoji exists (they scale with font-size like an emoji).
const STAMP = `<svg class="ico-svg" viewBox="0 0 64 64" width="1em" height="1em" aria-label="きって"><rect x="10" y="6" width="44" height="52" fill="#fff" stroke="#b5452f" stroke-width="3" stroke-dasharray="3 3"/><rect x="16" y="12" width="32" height="40" fill="#cfe3f5"/><path d="M16 44 L30 24 L38 36 L43 30 L48 40 V52 H16Z" fill="#2e7d4f"/><path d="M27 28 L30 24 L33 28Z" fill="#fff"/><circle cx="41" cy="20" r="4" fill="#e0a84a"/><text x="19" y="50" font-size="9" font-family="sans-serif" font-weight="700" fill="#fff">80</text></svg>`;
const POSTCARD = `<svg class="ico-svg" viewBox="0 0 64 64" width="1em" height="1em" aria-label="はがき"><rect x="6" y="12" width="52" height="40" rx="2" fill="#fbf8f2" stroke="#8a8378" stroke-width="2"/><rect x="44" y="16" width="10" height="12" fill="#c0392b"/><g fill="none" stroke="#c0392b" stroke-width="1.5"><rect x="10" y="16" width="4" height="6"/><rect x="15" y="16" width="4" height="6"/><rect x="20" y="16" width="4" height="6"/></g><g stroke="#8a8378" stroke-width="2"><line x1="12" y1="34" x2="40" y2="34"/><line x1="12" y1="40" x2="40" y2="40"/><line x1="12" y1="46" x2="30" y2="46"/></g></svg>`;

// ---------- counters ----------
const NUM = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう", "じゅう"];
// r: readings for 1–10. more: larger numbers that also appear in sentences. suf: the regular ending (used to spot irregular readings). unit: how it is written after the digit.
const COUNTERS = {
  tsu: { name: "～つ", unit: "つ", suf: "つ", q: "いくつ", use: "things in general (1–10)", ex: "🍎 🥚 🪑 👜 📦",
    r: ["ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ", "むっつ", "ななつ", "やっつ", "ここのつ", "とお"] },
  nin: { name: "～にん", unit: "人", suf: "にん", q: "なんにん", use: "people", ex: "👦 👩 🧑‍🎓",
    r: ["ひとり", "ふたり", "さんにん", "よにん", "ごにん", "ろくにん", "ななにん", "はちにん", "きゅうにん", "じゅうにん"] },
  mai: { name: "～まい", unit: "枚", suf: "まい", q: "なんまい", use: "thin, flat things", ex: "✉️ 💿 👕 📄",
    r: ["いちまい", "にまい", "さんまい", "よんまい", "ごまい", "ろくまい", "ななまい", "はちまい", "きゅうまい", "じゅうまい"] },
  dai: { name: "～だい", unit: "台", suf: "だい", q: "なんだい", use: "machines and vehicles", ex: "🚗 🚲 💻 📺",
    r: ["いちだい", "にだい", "さんだい", "よんだい", "ごだい", "ろくだい", "ななだい", "はちだい", "きゅうだい", "じゅうだい"] },
  kai: { name: "～かい", unit: "回", suf: "かい", q: "なんかい", use: "times (how often)", ex: "🔁",
    r: ["いっかい", "にかい", "さんかい", "よんかい", "ごかい", "ろっかい", "ななかい", "はっかい", "きゅうかい", "じゅっかい"] },
  jikan: { name: "～じかん", unit: "時間", suf: "じかん", q: "なんじかん", use: "hours", dur: true,
    r: ["いちじかん", "にじかん", "さんじかん", "よじかん", "ごじかん", "ろくじかん", "しちじかん", "はちじかん", "くじかん", "じゅうじかん"], more: [12, 13, 24] },
  fun: { name: "～ふん", unit: "分", suf: "ふん", q: "なんぷん", use: "minutes", dur: true,
    r: ["いっぷん", "にふん", "さんぷん", "よんぷん", "ごふん", "ろっぷん", "ななふん", "はっぷん", "きゅうふん", "じゅっぷん"], more: [15, 20, 30, 45] },
  nichi: { name: "～にち", unit: "日", suf: "にち", q: "なんにち", use: "days", dur: true,
    r: ["いちにち", "ふつか", "みっか", "よっか", "いつか", "むいか", "なのか", "ようか", "ここのか", "とおか"] },
  shuukan: { name: "～しゅうかん", unit: "週間", suf: "しゅうかん", q: "なんしゅうかん", use: "weeks", dur: true,
    r: ["いっしゅうかん", "にしゅうかん", "さんしゅうかん", "よんしゅうかん", "ごしゅうかん", "ろくしゅうかん", "ななしゅうかん", "はっしゅうかん", "きゅうしゅうかん", "じゅっしゅうかん"] },
  kagetsu: { name: "～かげつ", unit: "か月", suf: "かげつ", q: "なんかげつ", use: "months", dur: true,
    r: ["いっかげつ", "にかげつ", "さんかげつ", "よんかげつ", "ごかげつ", "ろっかげつ", "ななかげつ", "はっかげつ", "きゅうかげつ", "じゅっかげつ"] },
  nen: { name: "～ねん", unit: "年", suf: "ねん", q: "なんねん", use: "years", dur: true,
    r: ["いちねん", "にねん", "さんねん", "よねん", "ごねん", "ろくねん", "ななねん", "はちねん", "きゅうねん", "じゅうねん"] },
};
// 11–99 are built from the tens plus the 1–10 reading: 13時間 = じゅう + さんじかん, 20分 = に + じゅっぷん.
const reading = (n, c) => n <= 10 ? COUNTERS[c].r[n - 1]
  : (n >= 20 ? NUM[Math.floor(n / 10)] : "") + (n % 10 ? "じゅう" + COUNTERS[c].r[n % 10 - 1] : COUNTERS[c].r[9]);
const numKana = n => n <= 10 ? NUM[n] : (n >= 20 ? NUM[Math.floor(n / 10)] : "") + "じゅう" + NUM[n % 10];
const disp = (n, c) => c === "tsu" && n === 10 ? "10" : `${n}${COUNTERS[c].unit}`;
// what a learner would guess by just gluing number + counter (さん+にん); differs from reading() for the irregular ones
const naive = (n, c) => numKana(n) + COUNTERS[c].suf;
const irregular = (n, c) => reading(n, c) !== naive(n, c);

// Things to count: k = word, e = picture, c = counter, v = verb for "there is".
const COUNT_ITEMS = [
  { k: "りんご", e: "🍎", c: "tsu" }, { k: "みかん", e: "🍊", c: "tsu" }, { k: "たまご", e: "🥚", c: "tsu" }, { k: "いす", e: "🪑", c: "tsu" },
  { k: "かばん", e: "👜", c: "tsu" }, { k: "はこ", e: "📦", c: "tsu" }, { k: "サンドイッチ", e: "🥪", c: "tsu" }, { k: "アイスクリーム", e: "🍦", c: "tsu" },
  { k: "とけい", e: "⏰", c: "tsu" }, { k: "かぎ", e: "🔑", c: "tsu" },
  { k: "がくせい", e: "🧑‍🎓", c: "nin" }, { k: "おとこのこ", e: "👦", c: "nin" }, { k: "おんなのこ", e: "👧", c: "nin" }, { k: "おんなのひと", e: "👩", c: "nin" },
  { k: "おとこのひと", e: "👨", c: "nin" }, { k: "せんせい", e: "🧑‍🏫", c: "nin" }, { k: "こども", e: "🧒", c: "nin" },
  { k: "きって", e: STAMP, c: "mai" }, { k: "はがき", e: POSTCARD, c: "mai" }, { k: "ふうとう", e: "✉️", c: "mai" }, { k: "しゃしん", e: "🖼️", c: "mai" },
  { k: "CD", e: "💿", c: "mai" }, { k: "シャツ", e: "👕", c: "mai" }, { k: "かみ", e: "📄", c: "mai" }, { k: "きっぷ", e: "🎫", c: "mai" },
  { k: "くるま", e: "🚗", c: "dai" }, { k: "じてんしゃ", e: "🚲", c: "dai" }, { k: "コンピューター", e: "💻", c: "dai" }, { k: "テレビ", e: "📺", c: "dai" },
  { k: "カメラ", e: "📷", c: "dai" }, { k: "タクシー", e: "🚕", c: "dai" }, { k: "でんわ", e: "☎️", c: "dai" },
];

// Durations with a little context, for the "How long?" game.
const DURATIONS = [
  { n: 13, c: "jikan", ctx: "✈️ ドイツ → にほん" }, { n: 8, c: "jikan", ctx: "💼 まいにち はたらきます" }, { n: 5, c: "jikan", ctx: "🏪 アルバイト" },
  { n: 4, c: "jikan", ctx: "📖 べんきょう" }, { n: 9, c: "jikan", ctx: "😴 ねます" }, { n: 7, c: "jikan", ctx: "🚄 しんかんせん" }, { n: 1, c: "jikan", ctx: "🚃 でんしゃ" },
  { n: 45, c: "fun", ctx: "🍱 ひるやすみ" }, { n: 10, c: "fun", ctx: "☕ やすみ" }, { n: 20, c: "fun", ctx: "🚶 えきまで" }, { n: 30, c: "fun", ctx: "🚌 バス" },
  { n: 1, c: "fun", ctx: "🍜 ラーメン" }, { n: 6, c: "fun", ctx: "🥚 たまご" },
  { n: 4, c: "nichi", ctx: "🤒 かいしゃを やすみました" }, { n: 8, c: "nichi", ctx: "🧳 りょこう" }, { n: 2, c: "nichi", ctx: "🏕️ キャンプ" },
  { n: 7, c: "nichi", ctx: "✈️ こうくうびん" }, { n: 1, c: "nichi", ctx: "🗓️ いちにち" }, { n: 10, c: "nichi", ctx: "🏖️ なつやすみ" },
  { n: 2, c: "shuukan", ctx: "🗾 にほんに います" }, { n: 1, c: "shuukan", ctx: "🧳 りょこう" }, { n: 8, c: "shuukan", ctx: "🏫 コース" }, { n: 4, c: "shuukan", ctx: "🏥 びょういん" },
  { n: 3, c: "kagetsu", ctx: "📚 にほんごを べんきょうしました" }, { n: 1, c: "kagetsu", ctx: "🗾 にほんに います" }, { n: 6, c: "kagetsu", ctx: "🎸 ギター" },
  { n: 2, c: "kagetsu", ctx: "🚢 ふなびん" }, { n: 10, c: "kagetsu", ctx: "👶 あかちゃん" },
  { n: 4, c: "nen", ctx: "🎓 だいがく" }, { n: 1, c: "nen", ctx: "🇨🇳 ちゅうごくごを ならいました" }, { n: 9, c: "nen", ctx: "🏠 とうきょう" }, { n: 2, c: "nen", ctx: "💼 かいしゃ" },
];

// ---------- kana → kanji for display ----------
const KANJI = {
  "おとこ": "{男|おとこ}", "おんな": "{女|おんな}", "ひと": "{人|ひと}", "わたし": "{私|わたし}",
  "きょうだい": "{兄弟|きょうだい}", "りょうしん": "{両親|りょうしん}", "あに": "{兄|あに}", "あね": "{姉|あね}", "おとうと": "{弟|おとうと}", "いもうと": "{妹|いもうと}",
  "おにいさん": "お{兄|にい}さん", "おねえさん": "お{姉|ねえ}さん", "おとうとさん": "{弟|おとうと}さん", "いもうとさん": "{妹|いもうと}さん",
  "こども": "{子|こ}ども", "ともだち": "{友|とも}だち", "せんせい": "{先生|せんせい}", "がくせい": "{学生|がくせい}", "りゅうがくせい": "{留学生|りゅうがくせい}",
  "がいこく": "{外国|がいこく}", "くに": "{国|くに}", "にほん": "{日本|にほん}", "にほんご": "{日本語|にほんご}", "ちゅうごくご": "{中国語|ちゅうごくご}",
  "だいがく": "{大学|だいがく}", "かいしゃ": "{会社|かいしゃ}", "こうえん": "{公園|こうえん}", "えき": "{駅|えき}", "ゆうびんきょく": "{郵便局|ゆうびんきょく}",
  "きって": "{切手|きって}", "ふうとう": "{封筒|ふうとう}", "しゃしん": "{写真|しゃしん}", "じてんしゃ": "{自転車|じてんしゃ}", "くるま": "{車|くるま}",
  "たまご": "{卵|たまご}", "はこ": "{箱|はこ}", "へや": "{部屋|へや}", "とけい": "{時計|とけい}", "かぎ": "{鍵|かぎ}", "かみ": "{紙|かみ}", "でんわ": "{電話|でんわ}",
  "まいにち": "{毎日|まいにち}", "ひる": "{昼|ひる}", "いままで": "{今|いま}まで", "いま": "{今|いま}", "てんき": "{天気|てんき}",
  "ふなびん": "{船便|ふなびん}", "こうくうびん": "{航空便|こうくうびん}", "ぜんぶで": "{全部|ぜんぶ}で", "えん": "{円|えん}",
  "なんにん": "{何人|なんにん}", "なんまい": "{何枚|なんまい}", "なんだい": "{何台|なんだい}", "なんかい": "{何回|なんかい}", "なんじかん": "{何時間|なんじかん}",
  "なんぷん": "{何分|なんぷん}", "なんにち": "{何日|なんにち}", "なんしゅうかん": "{何週間|なんしゅうかん}", "なんかげつ": "{何か月|なんかげつ}", "なんねん": "{何年|なんねん}",
  "しんかんせん": "{新幹線|しんかんせん}", "でんしゃ": "{電車|でんしゃ}", "ひこうき": "{飛行機|ひこうき}", "とうきょう": "{東京|とうきょう}",
};
// every counter reading: ごまい → 5枚 with ごまい on top
for (const [c, def] of Object.entries(COUNTERS)) {
  def.r.forEach((r, i) => { KANJI[r] = `{${disp(i + 1, c)}|${r}}`; });
  for (const n of def.more || []) KANJI[reading(n, c)] = `{${disp(n, c)}|${reading(n, c)}}`;
}
// verbs in their ます forms
for (const [stem, k] of [["やすみ", "{休|やす}み"], ["はたらき", "{働|はたら}き"], ["ならい", "{習|なら}い"], ["かい", "{買|か}い"], ["たべ", "{食|た}べ"], ["とり", "{撮|と}り"],
  ["おくり", "{送|おく}り"], ["おき", "{起|お}き"], ["べんきょうし", "{勉強|べんきょう}し"], ["りょこうし", "{旅行|りょこう}し"], ["いき", "{行|い}き"], ["ね", "{寝|ね}"]]) {
  for (const end of ["ます", "ました", "ません", "ますか", "ましたか"]) KANJI[stem + end] = k + end;
}

// ---------- vocabulary ----------
// kind: "n" = ordinary word, "x" = phrase / pattern (not used in the typing game)
const NUM_EMO = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const VOCAB = [
  { id: "imasu_k", kana: "います [こどもが～]", kanji: "います [{子|こ}どもが～]", de: "(Kinder) haben", en: "have (children)", emo: "👨‍👧", cat: "Verbs", kind: "x" },
  { id: "imasu_n", kana: "います [にほんに～]", kanji: "います [{日本|にほん}に～]", de: "(in Japan) sein, bleiben", en: "be / stay (in Japan)", emo: "🗾", cat: "Verbs", kind: "x" },
  { id: "kakarimasu", kana: "かかります", de: "dauern, kosten", en: "take (time), cost (money)", emo: "⏳", cat: "Verbs", kind: "n" },
  { id: "yasumimasu", kana: "やすみます [かいしゃを～]", kanji: "{休|やす}みます [{会社|かいしゃ}を～]", de: "frei nehmen, (in der Firma) fehlen", en: "take a day off (work)", emo: "🏖️", cat: "Verbs", kind: "x" },

  ...COUNTERS.tsu.r.map((r, i) => ({ id: "tsu" + (i + 1), kana: r, kanji: `{${disp(i + 1, "tsu")}|${r}}`, de: `${i + 1} (Dinge)`, en: `${i + 1} (things)`, emo: NUM_EMO[i], cat: "Counting things", kind: "n", textCard: true })),
  { id: "ikutsu", kana: "いくつ", de: "wie viele", en: "how many", emo: "❓", cat: "Counting things", kind: "n" },

  { id: "hitori", kana: "ひとり", kanji: "{1人|ひとり}", de: "eine Person", en: "one person", emo: "🧍", cat: "Counters", kind: "n" },
  { id: "futari", kana: "ふたり", kanji: "{2人|ふたり}", de: "zwei Personen", en: "two people", emo: "👫", cat: "Counters", kind: "n" },
  { id: "nin", kana: "～にん", kanji: "～{人|にん}", de: "～ Personen", en: "～ people", emo: "👥", cat: "Counters", kind: "x" },
  { id: "dai", kana: "～だい", kanji: "～{台|だい}", de: "Zähler: Maschinen, Fahrzeuge", en: "counter: machines, vehicles", emo: "🚗", cat: "Counters", kind: "x" },
  { id: "mai", kana: "～まい", kanji: "～{枚|まい}", de: "Zähler: flache Dinge", en: "counter: flat things", emo: "📄", cat: "Counters", kind: "x" },
  { id: "kai", kana: "～かい", kanji: "～{回|かい}", de: "～ mal", en: "～ times", emo: "🔁", cat: "Counters", kind: "x" },

  { id: "ringo", kana: "りんご", de: "Apfel", en: "apple", emo: "🍎", cat: "Food & post", kind: "n" },
  { id: "mikan", kana: "みかん", de: "Mandarine", en: "mandarin orange", emo: "🍊", cat: "Food & post", kind: "n" },
  { id: "sandoicchi", kana: "サンドイッチ", de: "Sandwich", en: "sandwich", emo: "🥪", cat: "Food & post", kind: "n" },
  { id: "karee", kana: "カレー[ライス]", de: "Curry (mit Reis)", en: "curry (and rice)", emo: "🍛", cat: "Food & post", kind: "x" },
  { id: "aisu", kana: "アイスクリーム", de: "Eis", en: "ice cream", emo: "🍦", cat: "Food & post", kind: "n" },
  { id: "kitte", kana: "きって", kanji: "{切手|きって}", de: "Briefmarke", en: "stamp", emo: STAMP, cat: "Food & post", kind: "n" },
  { id: "hagaki", kana: "はがき", de: "Postkarte", en: "postcard", emo: POSTCARD, cat: "Food & post", kind: "n" },
  { id: "fuutou", kana: "ふうとう", kanji: "{封筒|ふうとう}", de: "Briefumschlag", en: "envelope", emo: "✉️", cat: "Food & post", kind: "n" },

  { id: "ryoushin", kana: "りょうしん", kanji: "{両親|りょうしん}", de: "Eltern", en: "parents", emo: "👫", cat: "Family & people", kind: "n" },
  { id: "kyoudai", kana: "きょうだい", kanji: "{兄弟|きょうだい}", de: "Geschwister", en: "brothers and sisters", emo: "👧👦", cat: "Family & people", kind: "n" },
  { id: "ani", kana: "あに", kanji: "{兄|あに}", de: "(mein) älterer Bruder", en: "(my) older brother", emo: "👦", cat: "Family & people", kind: "n", textCard: true },
  { id: "oniisan", kana: "おにいさん", kanji: "お{兄|にい}さん", de: "älterer Bruder (von jemand anderem)", en: "(someone's) older brother", emo: "👦", cat: "Family & people", kind: "n", textCard: true },
  { id: "ane", kana: "あね", kanji: "{姉|あね}", de: "(meine) ältere Schwester", en: "(my) older sister", emo: "👧", cat: "Family & people", kind: "n", textCard: true },
  { id: "oneesan", kana: "おねえさん", kanji: "お{姉|ねえ}さん", de: "ältere Schwester (von jemand anderem)", en: "(someone's) older sister", emo: "👧", cat: "Family & people", kind: "n", textCard: true },
  { id: "otouto", kana: "おとうと", kanji: "{弟|おとうと}", de: "(mein) jüngerer Bruder", en: "(my) younger brother", emo: "👶", cat: "Family & people", kind: "n", textCard: true },
  { id: "otoutosan", kana: "おとうとさん", kanji: "{弟|おとうと}さん", de: "jüngerer Bruder (von jemand anderem)", en: "(someone's) younger brother", emo: "👶", cat: "Family & people", kind: "n", textCard: true },
  { id: "imouto", kana: "いもうと", kanji: "{妹|いもうと}", de: "(meine) jüngere Schwester", en: "(my) younger sister", emo: "🧒", cat: "Family & people", kind: "n", textCard: true },
  { id: "imoutosan", kana: "いもうとさん", kanji: "{妹|いもうと}さん", de: "jüngere Schwester (von jemand anderem)", en: "(someone's) younger sister", emo: "🧒", cat: "Family & people", kind: "n", textCard: true },
  { id: "gaikoku", kana: "がいこく", kanji: "{外国|がいこく}", de: "Ausland", en: "foreign country", emo: "🌍", cat: "Family & people", kind: "n" },
  { id: "ryuugakusei", kana: "りゅうがくせい", kanji: "{留学生|りゅうがくせい}", de: "Austauschstudent/in", en: "international student", emo: "🧑‍🎓", cat: "Family & people", kind: "n" },
  { id: "kurasu", kana: "クラス", de: "Klasse", en: "class", emo: "🏫", cat: "Family & people", kind: "n" },

  { id: "jikan", kana: "～じかん", kanji: "～{時間|じかん}", de: "～ Stunden", en: "～ hours", emo: "⏰", cat: "Time", kind: "x" },
  { id: "shuukan", kana: "～しゅうかん", kanji: "～{週間|しゅうかん}", de: "～ Wochen", en: "～ weeks", emo: "📅", cat: "Time", kind: "x" },
  { id: "kagetsu", kana: "～かげつ", kanji: "～か{月|げつ}", de: "～ Monate", en: "～ months", emo: "🗓️", cat: "Time", kind: "x" },
  { id: "nen", kana: "～ねん", kanji: "～{年|ねん}", de: "～ Jahre", en: "～ years", emo: "🎂", cat: "Time", kind: "x" },
  { id: "gurai", kana: "～ぐらい", de: "ungefähr ～", en: "about ～", emo: "🤏", cat: "Time", kind: "x" },
  { id: "donokurai", kana: "どのくらい", de: "wie lange", en: "how long", emo: "⏱️", cat: "Time", kind: "n" },
  { id: "zenbude", kana: "ぜんぶで", kanji: "{全部|ぜんぶ}で", de: "insgesamt", en: "in total", emo: "🧮", cat: "Time", kind: "n" },
  { id: "minna", kana: "みんな", de: "alle", en: "everyone, all", emo: "🙌", cat: "Time", kind: "n" },
  { id: "dake", kana: "～だけ", de: "nur ～", en: "only ～", emo: "☝️", cat: "Time", kind: "x" },

  { id: "kashikomarimashita", kana: "かしこまりました", de: "Sehr wohl. / Jawohl.", en: "Certainly. (shop staff)", emo: "🙇", cat: "Conversation", kind: "n" },
  { id: "iitenki", kana: "いい [お]てんきですね", kanji: "いい [お]{天気|てんき}ですね", de: "Schönes Wetter, nicht wahr?", en: "Nice weather, isn't it?", emo: "☀️", cat: "Conversation", kind: "x" },
  { id: "odekake", kana: "おでかけですか", de: "Gehen Sie aus?", en: "Going out?", emo: "🚶", cat: "Conversation", kind: "n" },
  { id: "chottomade", kana: "ちょっと ～まで", de: "Nur kurz bis ～.", en: "Just to ～.", emo: "👉", cat: "Conversation", kind: "x" },
  { id: "itteirasshai", kana: "いって いらっしゃい", de: "Bis später! (sagt, wer bleibt)", en: "See you later! (said by the one staying)", emo: "👋", cat: "Conversation", kind: "n" },
  { id: "ittekimasu", kana: "いって きます", de: "Bis gleich! (sagt, wer geht)", en: "I'm off! (said by the one leaving)", emo: "🚪", cat: "Conversation", kind: "n" },
  { id: "funabin", kana: "ふなびん", kanji: "{船便|ふなびん}", de: "Seepost", en: "sea mail", emo: "🚢", cat: "Conversation", kind: "n" },
  { id: "koukuubin", kana: "こうくうびん", kanji: "{航空便|こうくうびん}", de: "Luftpost (エアメール)", en: "airmail", emo: "✈️", cat: "Conversation", kind: "n" },
  { id: "onegaishimasu", kana: "おねがいします", de: "Bitte. (Ich bitte darum.)", en: "Please. (I ask you to do it.)", emo: "🙏", cat: "Conversation", kind: "n" },
  { id: "oosutoraria", kana: "オーストラリア", de: "Australien", en: "Australia", emo: "🇦🇺", cat: "Conversation", kind: "n" },
];

// ---------- sentence builder ----------
// alt: other word orders that are also correct.
const SENTENCES = [
  { t: "りんご を いつつ たべました", de: "Ich habe fünf Äpfel gegessen.", en: "I ate five apples.", pic: "🍎🍎🍎🍎🍎" },
  { t: "きって を ごまい ください", de: "Fünf Briefmarken, bitte.", en: "Five stamps, please.", pic: `${STAMP}×5` },
  { t: "しゃしん を さんまい とりました", de: "Ich habe drei Fotos gemacht.", en: "I took three photos.", pic: "📷🖼️🖼️🖼️" },
  { t: "じてんしゃ を にだい かいました", de: "Ich habe zwei Fahrräder gekauft.", en: "I bought two bicycles.", pic: "🚲🚲" },
  { t: "がくせい が はちにん います", de: "Es sind acht Schüler da.", en: "There are eight students.", pic: "🧑‍🎓×8" },
  { t: "きょうだい が さんにん います", de: "Ich habe drei Geschwister.", en: "I have three siblings.", pic: "👦👧👧" },
  { t: "わたし は あね が ひとり います", de: "Ich habe eine ältere Schwester.", en: "I have one older sister.", pic: "🙋👧" },
  { t: "CD が なんまい あります か", de: "Wie viele CDs gibt es?", en: "How many CDs are there?", pic: "💿💿💿❓" },
  { t: "コンピューター が なんだい あります か", de: "Wie viele Computer gibt es?", en: "How many computers are there?", pic: "💻💻💻❓" },
  { t: "いす が いくつ あります か", de: "Wie viele Stühle gibt es?", en: "How many chairs are there?", pic: "🪑🪑❓" },
  { t: "たまご が よっつ あります", de: "Es gibt vier Eier.", en: "There are four eggs.", pic: "🥚🥚🥚🥚" },
  { t: "はこ を ここのつ おくりました", de: "Ich habe neun Kisten geschickt.", en: "I sent nine boxes.", pic: "📦×9 📮" },
  { t: "いままで どのくらい にほんご を べんきょうしました か", de: "Wie lange haben Sie bis jetzt Japanisch gelernt?", en: "How long have you studied Japanese so far?", pic: "📚⏱️❓" },
  { t: "これから にしゅうかん にほん に います", alt: ["これから にほん に にしゅうかん います"], de: "Ich bleibe ab jetzt zwei Wochen in Japan.", en: "I'll be in Japan for two weeks from now.", pic: "🗾📅📅" },
  { t: "まいにち はちじかん はたらきます", de: "Ich arbeite jeden Tag acht Stunden.", en: "I work eight hours every day.", pic: "💼⏰×8" },
  { t: "ひる よんじゅうごふん やすみます", de: "Mittags mache ich 45 Minuten Pause.", en: "I rest for 45 minutes at noon.", pic: "🍱 45′" },
  { t: "くに から にほん まで じゅうさんじかん かかります", de: "Von meinem Land bis Japan dauert es 13 Stunden.", en: "It takes 13 hours from my country to Japan.", pic: "🏠✈️🗾" },
  { t: "いちねん ぐらい ちゅうごくご を ならいました", alt: ["ちゅうごくご を いちねん ぐらい ならいました"], de: "Ich habe ungefähr ein Jahr Chinesisch gelernt.", en: "I learned Chinese for about a year.", pic: "🇨🇳📖≈1" },
  { t: "じゅっぷん だけ やすみました", de: "Ich habe nur zehn Minuten Pause gemacht.", en: "I rested for only ten minutes.", pic: "☕ 10′ ☝️" },
  { t: "かいしゃ を よっか やすみました", alt: ["よっか かいしゃ を やすみました"], de: "Ich habe vier Tage in der Firma gefehlt.", en: "I took four days off work.", pic: "🏢🤒×4" },
  { t: "いっしゅうかん に にかい テニス を します", de: "Ich spiele zweimal pro Woche Tennis.", en: "I play tennis twice a week.", pic: "📅🎾🎾" },
  { t: "えき まで どのくらい かかります か", de: "Wie lange dauert es bis zum Bahnhof?", en: "How long does it take to the station?", pic: "🚶🚉⏱️❓" },
];
const PARTICLES = ["の", "に", "が", "は", "と", "を", "で", "も", "か", "から", "まで", "ぐらい", "だけ"];
const VERBS = ["あります", "います", "たべました", "ください", "とりました", "かいました", "おくりました", "べんきょうしました", "はたらきます", "やすみます", "やすみました", "かかります", "ならいました", "します"];
const ALL_READINGS = Object.entries(COUNTERS).flatMap(([c, d]) => [...d.r.map((r, i) => ({ r, n: i + 1, c })), ...(d.more || []).map(n => ({ r: reading(n, c), n, c }))]);

// ---------- grammar questions ----------
// o[0] is always right (options are shuffled). "✕" = no particle. raw: show options exactly as written (no kanji help).
const X = "✕ (nothing)";
const GRAMMAR_Q = [
  { q: "りんごを みっつ（　）たべました。", o: [X, "を", "が", "に"], ok: "A quantity goes straight before the verb — <b>no particle</b> after it.", say: "りんごを みっつ たべました。", why: [null, "を already marks りんご. The number takes nothing.", "が doesn't follow a number here.", "に is not used after a quantity."] },
  { q: "しゃしん（　）にまい とりました。", o: ["を", X, "が", "で"], ok: "The thing takes <b>を</b>; the number after it takes nothing: <b>しゃしんを にまい</b>.", say: "しゃしんを にまい とりました。", why: [null, "The noun still needs を — only the number is bare.", "With とります the photos are the object → を.", "で marks the place or tool."] },
  { q: "じてんしゃを 2だい かいました。 — Which is also correct?", o: ["None of these — the order is [thing] を [number] [verb].", "じてんしゃ にだいを かいました。", "にだいを じてんしゃ かいました。", "じてんしゃを にだいに かいました。"], raw: true, ok: "Pattern: <b>じてんしゃ を にだい かいました</b>. を sticks to the thing, not to the number.", why: [null, "を moved onto the number — it belongs to じてんしゃ.", "Same problem: を is on the number.", "No に after a quantity."] },
  { q: "きょうだいが なんにん（　）いますか。", o: [X, "が", "は", "を"], ok: "Question counters (なんにん, いくつ, なんまい…) take <b>no particle</b> either.", say: "きょうだいが なんにん いますか。", why: [null, "が is already on きょうだい.", "は doesn't follow a question word.", "います has no を object."] },
  { q: "にしゅうかん（　）りょこうしました。", o: [X, "に", "を", "で"], ok: "A <b>length of time</b> takes no particle.", say: "にしゅうかん りょこうしました。", why: [null, "に is for a <i>point</i> in time (9じに). A duration takes nothing.", "を isn't used after a duration.", "で isn't used here."] },
  { q: "まいにち 9じ（　）おきます。", o: ["に", X, "で", "を"], ok: "A clock time is a <b>point</b> in time → <b>に</b>.", why: [null, "Points in time with a number need に (durations don't).", "で is for places and tools.", "を marks an object."] },
  { q: "まいにち（　）9じに おきます。", o: [X, "に", "を", "で"], ok: "まいにち, きのう, きょう, いま … take <b>no に</b>.", why: [null, "No に after まいにち / きのう / きょう.", "を marks an object.", "で is for places and tools."] },
  { q: "きのう こうえん（　）しゃしんを とりました。", o: ["で", "に", "を", X], ok: "The place where an action happens → <b>で</b>.", say: "きのう こうえんで しゃしんを とりました。", why: [null, "に is for existence (います/あります) or destinations.", "を is already needed for しゃしん.", "The place needs a particle."] },
  { q: "かいしゃ（　）よっか やすみました。", o: ["を", "に", "で", X], ok: "<b>かいしゃを やすみます</b> = to take time off work.", say: "かいしゃを よっか やすみました。", why: [null, "With やすみます the thing you skip takes を.", "かいしゃで やすみます would mean ‘rest at the office’.", "A particle is needed."] },
  { q: "これから いちねん にほん（　）います。", o: ["に", "で", "を", X], ok: "Where you are/stay → <b>に</b> + います.", say: "これから いちねん にほんに います。", why: [null, "で is for actions; います takes に.", "います has no object.", "The place needs に."] },
  { q: "これから どのくらい にほんに（　）か。", o: ["います", "しました", "いました", "あります"], ok: "<b>これから</b> = from now on → not past. ‘Be/stay’ for a person = <b>います</b>.", say: "これから どのくらい にほんに いますか。", why: [null, "します = to do. ‘Stay’ is います — and これから isn't past.", "これから looks ahead, so no past tense.", "あります is for things."] },
  { q: "くにから にほん（　）じゅうさんじかん かかります。", o: ["まで", "に", "を", "で"], ok: "<b>A から B まで</b> = from A to B.", say: "くにから にほんまで じゅうさんじかん かかります。", why: [null, "With から … かかります the end point is まで.", "を doesn't fit.", "で = by (ひこうきで)."] },
  { q: "いっしゅうかん（　）にかい テニスを します。", o: ["に", X, "で", "を"], ok: "‘Per’: <b>[period] に [number]かい</b> — twice <i>a</i> week.", say: "いっしゅうかんに にかい テニスを します。", why: [null, "This is the one case where a period takes に: ‘in one week, two times’.", "で isn't used for ‘per’.", "を isn't used here."] },
  { q: "わたし（　）あねが ふたり います。", o: ["は", "が", "を", "に"], ok: "<b>わたしは [family] が [number] います</b> = I have …", say: "わたしは あねが ふたり います。", why: [null, "が is already on あね; the owner is the topic → は.", "います has no object.", "に would mean ‘at me’."] },
  { q: "4人 → ?", o: ["よにん", "よんにん", "しにん", "よっつ"], raw: true, ok: "<b>よにん</b> — the ん of よん drops. (しにん sounds like ‘dead person’ 💀)", why: [null, "Close — but it's よにん, without ん.", "し is avoided: しにん = dead person.", "よっつ counts things, not people."] },
  { q: "1人 ・ 2人 → ?", o: ["ひとり ・ ふたり", "いちにん ・ ににん", "ひとつ ・ ふたつ", "いちり ・ にり"], raw: true, ok: "1 and 2 people are special: <b>ひとり, ふたり</b>. From 3: さんにん.", why: [null, "Regular にん starts at 3.", "Those count things.", "Not words."] },
  { q: "9時間 → ?", o: ["くじかん", "きゅうじかん", "ここのじかん", "くじ"], raw: true, ok: "<b>くじかん</b> — like くじ (9 o'clock) + かん.", why: [null, "With じ / じかん, 9 is く.", "ここの～ is only for ここのつ / ここのか.", "くじ is 9 o'clock, a point in time."] },
  { q: "4時間 → ?", o: ["よじかん", "よんじかん", "しじかん", "よっじかん"], raw: true, ok: "<b>よじかん</b> — like よじ (4 o'clock).", why: [null, "With じ / じかん, 4 is よ.", "し isn't used with じかん.", "No small っ here."] },
  { q: "7時間 → ?", o: ["しちじかん", "なのじかん", "ななつじかん", "しちかん"], raw: true, ok: "<b>しちじかん</b> (ななじかん is also heard).", why: [null, "なの～ is only for なのか (7 days).", "ななつ counts things.", "じ is missing."] },
  { q: "4年 → ?", o: ["よねん", "よんねん", "しねん", "よっねん"], raw: true, ok: "<b>よねん</b> — 4 is よ before ねん, にん, じ.", why: [null, "The ん drops: よねん.", "し isn't used with ねん.", "No small っ."] },
  { q: "1週間 → ?", o: ["いっしゅうかん", "いちしゅうかん", "ひとしゅうかん", "いっしゅう"], raw: true, ok: "<b>いっしゅうかん</b> — 1, 8, 10 get a small っ: いっ・はっ・じゅっ.", why: [null, "いち becomes いっ before しゅうかん.", "ひと～ is for ひとつ / ひとり.", "かん is missing."] },
  { q: "6か月 → ?", o: ["ろっかげつ", "ろくかげつ", "むっかげつ", "ろくがつ"], raw: true, ok: "<b>ろっかげつ</b> — 1, 6, 8, 10: いっか・ろっか・はっか・じゅっか.", why: [null, "ろく becomes ろっ before か.", "むっ～ is for むっつ.", "ろくがつ is June — a date, not a length."] },
  { q: "10分 → ?", o: ["じゅっぷん", "じゅうふん", "とおふん", "じゅうぶん"], raw: true, ok: "<b>じゅっぷん</b> — ぷん after 1, 3, 4, 6, 8, 10.", why: [null, "It's ぷん with a small っ.", "とお counts things.", "じゅうぶん means ‘enough’."] },
  { q: "4日 (four days) → ?", o: ["よっか", "ようか", "よんにち", "しにち"], raw: true, ok: "<b>よっか</b> = 4 days. Careful: <b>ようか</b> = 8 days.", why: [null, "ようか is 8 days — long よう.", "Days 2–10 have their own words.", "Not used."] },
  { q: "8つ → ?", o: ["やっつ", "よっつ", "むっつ", "はちつ"], raw: true, ok: "<b>やっつ</b> = 8. よっつ = 4, むっつ = 6.", why: [null, "よっつ is 4.", "むっつ is 6.", "The つ-series doesn't use はち."] },
  { q: "🍎 × 11 → りんごが（　）あります。", o: ["じゅういち", "じゅうひとつ", "とおひとつ", "じゅういちつ"], raw: true, ok: "The つ-series stops at とお (10). From 11 use plain numbers: <b>じゅういち</b>.", why: [null, "No つ-words above 10.", "No つ-words above 10.", "No つ above 10."] },
  { q: "じてんしゃを に（　）かいました。 🚲🚲", o: ["だい", "まい", "つ", "にん"], raw: true, ok: "Machines and vehicles → <b>～だい</b>.", say: "じてんしゃを にだい かいました。", why: [null, "まい is for flat things.", "Possible in casual talk, but vehicles take だい.", "にん is for people."] },
  { q: "きってを ご（　）ください。", o: ["まい", "だい", "にん", "かい"], raw: true, ok: "Stamps are thin and flat → <b>～まい</b>.", say: "きってを ごまい ください。", why: [null, "だい is for machines.", "にん is for people.", "かい = times."] },
  { q: "‘about one year’ →", o: ["いちねんぐらい", "いちねんだけ", "ぐらい いちねん", "いちねんに"], raw: true, ok: "<b>～ぐらい</b> comes right after the amount.", why: [null, "だけ = only.", "ぐらい follows the number.", "に isn't ‘about’."] },
  { q: "じゅっぷん（　）やすみました。 (only 10 minutes)", o: ["だけ", "ぐらい", "に", "を"], raw: true, ok: "<b>～だけ</b> = only, nothing more.", say: "じゅっぷんだけ やすみました。", why: [null, "ぐらい = about.", "No に after a duration.", "No を after a duration."] },
  { q: "いままで（　）にほんごを べんきょうしましたか。", o: ["どのくらい", "いくつ", "なんにん", "どこ"], raw: true, ok: "<b>どのくらい</b> asks ‘how long’ (also ‘how much’).", say: "いままで どのくらい にほんごを べんきょうしましたか。", why: [null, "いくつ = how many things.", "なんにん = how many people.", "どこ = where."] },
  { q: "Your neighbour: おでかけですか。 — You: ええ、ちょっと ゆうびんきょくまで。 — Neighbour:", o: ["いって いらっしゃい。", "いって きます。", "かしこまりました。", "おねがいします。"], raw: true, ok: "The one who stays says <b>いって いらっしゃい</b>; the one who leaves answers <b>いって きます</b>.", why: [null, "That's what <i>you</i> (leaving) say.", "That's shop language.", "That's a request."] },
  { q: "ぜんぶで いくらですか。 means…", o: ["How much is it altogether?", "How many are there altogether?", "How long does it all take?", "Is that everything?"], raw: true, ok: "<b>ぜんぶで</b> = in total; <b>いくら</b> = how much (money).", why: [null, "‘How many’ would be いくつ.", "‘How long’ would be どのくらい.", "Not a yes/no question."] },
];

// ---------- your worksheets ----------
const WORKSHEET = [
  { sec: "【How to say numbers】 words, particles, いくつ", items: [
    { n: "1–4)", mine: "サンドイッチ ・ はがき ・ きょうだい ・ いもうと", ok: true, note: "All four right. いもうと fits: she is 14, you are 21." },
    { n: "", mine: "わたし（は）まいにち（✕）9じ（に）おきます。", ok: true, note: "Exactly: no に after まいにち, に after the clock time." },
    { n: "", mine: "きょうだい（が）なんにん（✕）いますか。", ok: true, note: "Good self-correction from は to が." },
    { n: "", mine: "わたし（は）きょうだい（が）3にん（✕）います。", ok: true },
    { n: "", mine: "きのう（✕）こうえん（で）しゃしん（を）2まい（✕）とりました。", ok: true, note: "Perfect — nothing after the quantity." },
    { n: "1)", mine: "いすが いくつ ありますか。 — ひとつ あります。", ok: true },
    { n: "2)", mine: "たまごが いくつ ありますか。 — よっつ あります。", ok: true },
    { n: "3)", mine: "かばんが いくつ ありますか。 — ふたつ あります。", ok: true },
    { n: "4)", mine: "へやが いくつ ありますか。 — むっつ あります。", ok: true },
  ]},
  { sec: "【助数詞】 <4> なんまい・なんだい・なんにん", items: [
    { n: "1)", mine: "CDが なんまい ありますか。 — ごまい あります。", ok: "hm", note: "Question perfect. Count the picture once more: I see five loose discs plus one in the case — if that one counts, it's <b>ろくまい</b>." },
    { n: "2)", mine: "コンピューターが なんだい ありますか。 — さん<s>だ</s> あります。", ok: false, fix: "さんだい あります。", note: "The counter is <b>だい</b> — the い went missing." },
    { n: "3)", mine: "がくせいが なんにん <s>あ</s>りますか。 — はちにん <s>り</s>ます。", ok: false, fix: "がくせいが なんにん いますか。 — はちにん います。", note: "People → <b>います</b>. It looks like you corrected it on the page; make the い clear so it doesn't read as ります." },
    { n: "4)", mine: "おとこのこが なんにん いますか。 — ふたり います。", ok: true, note: "ふたり, not ににん. ✔" },
  ]},
  { sec: "【助数詞】 <5> [thing] を [number] [verb]", items: [
    { n: "1)", mine: "しゃしんを <s>さまい</s> とりました。", ok: false, fix: "しゃしんを さんまい とりました。", note: "さ<b>ん</b>まい — the ん is missing." },
    { n: "2)", mine: "じてんしゃ <s>にだいを</s> かいました。", ok: false, fix: "じてんしゃを にだい かいました。", note: "The most important fix on these sheets: <b>を goes on the thing</b>, the number stays bare. You did it right in 1), 3) and 4)!" },
    { n: "3)", mine: "りんごを <s>いっつ</s> たべました。", ok: "hm", fix: "みかんを いつつ たべました。", note: "Five is <b>いつつ</b> (big つ twice, no small っ). And the fruit in the picture looks like a <b>みかん</b> — the same picture is on sheet F㊹." },
    { n: "4)", mine: "はこを ここのつ おくりました。", ok: true, note: "Sentence is right. (The photo cuts off the boxes, so I can't check the nine.)" },
  ]},
  { sec: "F㊹ 【1じかん、1しゅうかん、～だけ】 A", items: [
    { n: "1–2)", mine: "<s>にまい きって</s> ・ <s>ひとつ みかん</s>", ok: "hm", fix: "きって にまい ・ みかん ひとつ", note: "In Japanese the number comes <b>after</b> the thing: きってが にまい あります。" },
    { n: "1)", mine: "何年 大学で べんきょうしましたか。 — よねん べんきょうしました。", ok: true, note: "よねん ✔ and nice kanji." },
    { n: "2)", mine: "なんしゅうかん りょこうしましたか。 — にしゅうかん りょこうしました。", ok: true },
    { n: "3)", mine: "なんじかん コンビニで <s>アルバト</s>を しましたか。 — ごじかん アルバイトを しました。", ok: "hm", fix: "アルバイト", note: "Grammar is right. Spelling: アルバ<b>イ</b>ト. Your ン looks like ソ (コソビニ): ン starts flat on the left and sweeps <i>up</i>; ソ comes down from the top." },
    { n: "4)", mine: "なんぷん やすみましたか。 — じゅっぷん やすみました。", ok: "hm", fix: "じゅっぷんだけ やすみました。", note: "じゅっぷん ✔. The prompt had <b>だけ</b> (only) — keep it in the answer." },
  ]},
  { sec: "<3> どのくらい", items: [
    { n: "1)", mine: "これから どのくらい 日本に <s>しましたか</s>。 — にしゅうかん 日本に <s>しました</s>。", ok: false, fix: "これから どのくらい 日本に いますか。 — にしゅうかん います。", note: "Two things: the verb is <b>います</b> (stay), not します. And <b>これから</b> looks ahead, so no past tense." },
    { n: "2)", mine: "いままで どのくらい ちゅうごくごを ならいましたか。 — <s>いちね</s>ぐらい ならいました。", ok: false, fix: "いちねんぐらい ならいました。", note: "Question is right (good that you added どのくらい). Answer: いちね<b>ん</b>." },
    { n: "3)", mine: "ひる <s>どのぐらい やすみす</s>。 — よんじゅうごふん やすみます。", ok: false, fix: "ひる どのくらい やすみますか。", note: "The question lost its ending: やすみ<b>ますか</b>. (どのぐらい is fine too.) Answer ✔." },
    { n: "4)", mine: "まいにち どのくらい はたらきますか。 — はちじかん はたらきます。", ok: true },
  ]},
  { sec: "<4> about you", items: [
    { n: "1)", mine: "<s>いっか</s> にほんに います。", ok: false, fix: "いっかげつ にほんに います。", note: "One month is <b>いっかげつ</b> — げつ is missing. (If you meant five days, that's いつか.)" },
    { n: "2)", mine: "じゅうさんじかんぐらい かかります。", ok: true, note: "Perfect, including ぐらい." },
  ]},
];

// ---------- lesson settings for the shared engine ----------
const LESSON = {
  key: "lesson11.v1",
  name: "Lesson 11",
  title: `Lektion 11 — <span class="jp">ひとつ・ふたり・3{枚|まい}・どのくらい</span>`.replace(/\{([^|]+)\|([^}]+)\}/g, "<ruby>$1<rt>$2</rt></ruby>"),
  sub: "Counting things, people, flat things and machines — and saying how long something takes.",
  confetti: ["🎉", "✨", "🍎", "🍊", "✉️", "🚲", "⏰", "⭐"],
  memoryGroups: { "Counting things": "🔢", "Food & post": "🍎", "Family & people": "👪", "Conversation": "💬" },
  // decoy tiles: an extra particle to wrongly put after the number, and the same number with another counter
  builderExtra(toks) {
    const q = toks.map(t => ALL_READINGS.find(x => x.r === t)).find(Boolean);
    let other = null;
    if (q && q.n <= 10) {
      const pool = (COUNTERS[q.c].dur ? ["jikan", "nichi", "shuukan", "kagetsu", "nen"] : ["tsu", "nin", "mai", "dai"]).filter(c => c !== q.c);
      other = reading(q.n, pick(pool));
    }
    return [pick(["を", "に"]), other || pick(["が", "で"])];
  },
  whyWrong(got, want) {
    const cnt = (a, t) => a.filter(x => x === t).length;
    for (const p of ["を", "に", "が", "で"]) if (cnt(got, p) > cnt(want, p)) {
      const k = got.lastIndexOf(p);
      if (k > 0 && (ALL_READINGS.some(x => x.r === got[k - 1]) || ["ぐらい", "だけ", "いくつ", "どのくらい"].includes(got[k - 1]) || /^なん/.test(got[k - 1])))
        return `No particle after a number or a length of time — take out <b class="jp">${p}</b>.`;
      return `There is one <b class="jp">${p}</b> too many.`;
    }
    const wrongCounter = got.find(t => !want.includes(t) && ALL_READINGS.some(x => x.r === t));
    if (wrongCounter) {
      const right = want.map(t => ALL_READINGS.find(x => x.r === t)).find(Boolean);
      return right ? `Wrong counter. Here you need <b>${COUNTERS[right.c].name}</b> (${COUNTERS[right.c].use}).` : "One tile is the wrong counter.";
    }
    if (got.length < want.length) return `Use ${want.length} tiles (you have ${got.length}).`;
    const firstBad = got.findIndex((t, k) => t !== want[k]);
    return `The first ${firstBad} tile${firstBad === 1 ? " is" : "s are"} right. Pattern: <b class="jp">[thing] を/が [number] [verb]</b>.`;
  },
};
