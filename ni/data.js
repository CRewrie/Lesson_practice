"use strict";
// 「に」道場 — the three jobs of the particle に. Content only; helpers come from ../assets/core.js, the trainer is app.js.

// The verbs. role: "time" = に marks a clock time · "to" = に marks the person the action goes to ·
// "from" = に (or から) marks the person it comes from. pair = the same event seen from the other person.
const NI_VERBS = [
  { id: "ne", stem: "ね", role: "time", de: "schlafen gehen", en: "go to bed", ico: "😴" },
  { id: "oki", stem: "おき", role: "time", de: "aufstehen", en: "get up", ico: "⏰" },
  { id: "owari", stem: "おわり", role: "time", de: "enden", en: "end, finish", ico: "🏁" },
  { id: "age", stem: "あげ", role: "to", pair: "morai", fam: "gift", de: "geben, schenken", en: "give", ico: "🎁" },
  { id: "kashi", stem: "かし", role: "to", pair: "kari", fam: "lend", de: "verleihen", en: "lend", ico: "🤝" },
  { id: "oshie", stem: "おしえ", role: "to", pair: "narai", fam: "teach", de: "beibringen, lehren", en: "teach", ico: "🧑‍🏫" },
  { id: "kake", stem: "かけ", role: "to", fam: "call", de: "anrufen (でんわを～)", en: "make a phone call", ico: "📞" },
  { id: "okuri", stem: "おくり", role: "to", fam: "send", de: "schicken", en: "send", ico: "📮" },
  { id: "morai", stem: "もらい", role: "from", pair: "age", fam: "gift", de: "bekommen", en: "receive", ico: "🤲" },
  { id: "kari", stem: "かり", role: "from", pair: "kashi", fam: "lend", de: "ausleihen (von jmd.)", en: "borrow", ico: "📥" },
  { id: "narai", stem: "ならい", role: "from", pair: "oshie", fam: "teach", de: "lernen (von jmd.)", en: "learn (from someone)", ico: "📖" },
];
const ROLES = {
  time: { ico: "🕐", name: "Time", de: "Zeitpunkt", rule: "A clock time is a point in time → <b>に</b>." },
  to: { ico: "→", name: "To someone", de: "an jemanden", rule: "The person the action goes to → <b>に</b>." },
  from: { ico: "←", name: "From someone", de: "von jemandem", rule: "The person it comes from → <b>に</b> (から also works)." },
};

const ME = { k: "わたし", e: "🙂" };
const PEOPLE = [
  { k: "ともだち", e: "🧑" }, { k: "せんせい", e: "🧑‍🏫" }, { k: "ちち", e: "👨" }, { k: "はは", e: "👩" }, { k: "あに", e: "👦" }, { k: "あね", e: "👧" },
  { k: "いもうと", e: "🧒" }, { k: "かれ", e: "🧔" }, { k: "かのじょ", e: "👱‍♀️" }, { k: "かぞく", e: "👪" },
  { k: "ミラーさん", e: "🧑‍💼" }, { k: "たなかさん", e: "👨‍💼" }, { k: "やまださん", e: "👩‍💼" }, { k: "カリナさん", e: "👩‍🎓" },
];
const OBJECTS = {
  gift: [["はな", "🌷"], ["プレゼント", "🎁"], ["チョコレート", "🍫"], ["ほん", "📕"], ["とけい", "⌚"], ["シャツ", "👕"], ["ネクタイ", "👔"], ["おかね", "💴"], ["カード", "💌"]],
  lend: [["ほん", "📕"], ["かさ", "☂️"], ["じしょ", "📗"], ["おかね", "💴"], ["じてんしゃ", "🚲"], ["ペン", "🖊️"], ["くるま", "🚗"]],
  teach: [["にほんご", "🇯🇵"], ["えいご", "🇬🇧"], ["ちゅうごくご", "🇨🇳"], ["かんじ", "🈶"], ["ピアノ", "🎹"], ["ギター", "🎸"]],
  call: [["でんわ", "📞"]],
  send: [["てがみ", "✉️"], ["にもつ", "📦"], ["しゃしん", "🖼️"], ["メール", "📧"], ["プレゼント", "🎁"]],
};
const EVENTS = [["かいぎ", "🗓️"], ["しごと", "💼"], ["じゅぎょう", "🏫"], ["えいが", "🎬"], ["パーティー", "🎉"], ["しけん", "📝"]];
// time words never take に. past: true → the verb must be ました.
const TWORDS = [{ k: "きのう", past: true }, { k: "せんしゅう", past: true }, { k: "あした", past: false }, { k: "らいしゅう", past: false }];
const HOURS = ["", "いちじ", "にじ", "さんじ", "よじ", "ごじ", "ろくじ", "しちじ", "はちじ", "くじ", "じゅうじ", "じゅういちじ", "じゅうにじ"];
const CLOCKS = ["🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"];

// Extra sentences for the particle exercise, so に has to be told apart from と・で・へ・から・まで. [word, particle]
const MIXED = [
  [["わたし", "は"], ["ともだち", "と"], ["えいが", "を"], ["みました", ""]],
  [["わたし", "は"], ["はし", "で"], ["ごはん", "を"], ["たべます", ""]],
  [["わたし", "は"], ["あした", ""], ["ともだち", "に"], ["あいます", ""]],
  [["わたし", "は"], ["にほんご", "で"], ["てがみ", "を"], ["かきます", ""]],
  [["わたし", "は"], ["らいしゅう", ""], ["きょうと", "へ"], ["いきます", ""]],
  [["ミラーさん", "は"], ["くじ", "から"], ["ごじ", "まで"], ["はたらきます", ""]],
  [["わたし", "は"], ["コンビニ", "で"], ["パン", "を"], ["かいました", ""]],
  [["わたし", "は"], ["バス", "で"], ["かいしゃ", "へ"], ["いきます", ""]],
  [["わたし", "は"], ["きのう", ""], ["ともだち", "に"], ["にほんご", "で"], ["メール", "を"], ["おくりました", ""]],
  [["わたし", "は"], ["たなかさん", "に"], ["えいご", "で"], ["でんわ", "を"], ["かけました", ""]],
  [["わたし", "は"], ["まいにち", ""], ["うち", "で"], ["にほんご", "を"], ["べんきょうします", ""]],
];

// ----- kana → kanji for display -----
const KANJI = {
  "わたし": "{私|わたし}", "ともだち": "{友|とも}だち", "せんせい": "{先生|せんせい}", "ちち": "{父|ちち}", "はは": "{母|はは}", "あに": "{兄|あに}", "あね": "{姉|あね}", "いもうと": "{妹|いもうと}",
  "かれ": "{彼|かれ}", "かのじょ": "{彼女|かのじょ}", "かぞく": "{家族|かぞく}", "おとこ": "{男|おとこ}", "おんな": "{女|おんな}", "ひと": "{人|ひと}",
  "はな": "{花|はな}", "ほん": "{本|ほん}", "とけい": "{時計|とけい}", "おかね": "お{金|かね}", "かさ": "{傘|かさ}", "じしょ": "{辞書|じしょ}", "じてんしゃ": "{自転車|じてんしゃ}", "くるま": "{車|くるま}",
  "にほんご": "{日本語|にほんご}", "えいご": "{英語|えいご}", "ちゅうごくご": "{中国語|ちゅうごくご}", "かんじ": "{漢字|かんじ}", "タイご": "タイ{語|ご}",
  "でんわ": "{電話|でんわ}", "てがみ": "{手紙|てがみ}", "にもつ": "{荷物|にもつ}", "しゃしん": "{写真|しゃしん}",
  "かいぎ": "{会議|かいぎ}", "しごと": "{仕事|しごと}", "じゅぎょう": "{授業|じゅぎょう}", "えいが": "{映画|えいが}", "しけん": "{試験|しけん}",
  "きのう": "{昨日|きのう}", "あした": "{明日|あした}", "せんしゅう": "{先週|せんしゅう}", "らいしゅう": "{来週|らいしゅう}", "まいばん": "{毎晩|まいばん}", "まいあさ": "{毎朝|まいあさ}", "まいにち": "{毎日|まいにち}",
  "けさ": "{今朝|けさ}", "きょう": "{今日|きょう}", "こんばん": "{今晩|こんばん}", "はし": "{箸|はし}", "ごはん": "ご{飯|はん}", "かいしゃ": "{会社|かいしゃ}", "うち": "{家|うち}", "きょうと": "{京都|きょうと}",
  "だれ": "だれ", "なに": "{何|なに}", "なんじ": "{何時|なんじ}",
};
for (let h = 1; h <= 12; h++) { KANJI[HOURS[h]] = `{${h}時|${HOURS[h]}}`; KANJI[HOURS[h] + "はん"] = `{${h}時半|${HOURS[h]}はん}`; }
for (const [stem, k] of [["ね", "{寝|ね}"], ["おき", "{起|お}き"], ["おわり", "{終|お}わり"], ["かし", "{貸|か}し"], ["かり", "{借|か}り"], ["おしえ", "{教|おし}え"], ["ならい", "{習|なら}い"], ["おくり", "{送|おく}り"],
  ["あい", "{会|あ}い"], ["み", "{見|み}"], ["たべ", "{食|た}べ"], ["かき", "{書|か}き"], ["いき", "{行|い}き"], ["はたらき", "{働|はたら}き"], ["かい", "{買|か}い"], ["べんきょうし", "{勉強|べんきょう}し"]]) {
  for (const end of ["ます", "ました", "ますか", "ましたか"]) KANJI[stem + end] = k + end;
}

// settings read by the shared engine
const VOCAB = [];
const LESSON = { key: "ni.v1", name: "に Dojo", title: "「に」道場", sub: "", confetti: ["🎉", "✨", "🎁", "📞", "⏰", "⭐"], memoryGroups: {}, builderExtra: () => [], whyWrong: () => "" };
