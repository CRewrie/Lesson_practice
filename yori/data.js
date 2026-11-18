"use strict";
// より・ほうが道場 — comparing things. Content only; helpers come from ../assets/core.js, the trainer is app.js.
// Every set has real values, so a sentence is only right if it matches the data on screen.

// An adjective: k = kana, na = な-adjective, de/en = comparative, deS/enS = superlative, alt = other accepted kana.
const A = (k, de, deS, en, enS, extra = {}) => ({ k, de, deS, en, enS, na: false, ...extra });

// A data set. hi applies to the item with the larger value × dir. q = question word for "which … most?".
// cat = the group for いちばん questions, with its German/English question.
const DIMS = [
  { id: "weight", cat: "どうぶつ", catDe: "Welches Tier", catEn: "Which animal", q: "なに", who: false, dir: 1,
    hi: A("おもい", "schwerer", "am schwersten", "heavier", "the heaviest"), lo: A("かるい", "leichter", "am leichtesten", "lighter", "the lightest"),
    show: v => v >= 1000 ? `≈ ${v / 1000} t` : `≈ ${v} kg`,
    items: [{ k: "ぞう", e: "🐘", v: 5000, de: "der Elefant", en: "the elephant" }, { k: "うま", e: "🐎", v: 500, de: "das Pferd", en: "the horse" },
      { k: "パンダ", e: "🐼", v: 100, de: "der Panda", en: "the panda" }, { k: "いぬ", e: "🐕", v: 20, de: "der Hund", en: "the dog" },
      { k: "ねこ", e: "🐈", v: 4, de: "die Katze", en: "the cat" }, { k: "うさぎ", e: "🐇", v: 2, de: "das Kaninchen", en: "the rabbit" }] },
  { id: "speed", cat: "のりもの", catDe: "Welches Verkehrsmittel", catEn: "Which vehicle", q: "なに", who: false, dir: 1,
    hi: A("はやい", "schneller", "am schnellsten", "faster", "the fastest"), lo: A("おそい", "langsamer", "am langsamsten", "slower", "the slowest"),
    show: v => `${v} km/h`,
    items: [{ k: "ひこうき", e: "✈️", v: 900, de: "das Flugzeug", en: "the plane" }, { k: "しんかんせん", e: "🚄", v: 300, de: "der Shinkansen", en: "the shinkansen" },
      { k: "くるま", e: "🚗", v: 100, de: "das Auto", en: "the car" }, { k: "バス", e: "🚌", v: 40, de: "der Bus", en: "the bus" }, { k: "じてんしゃ", e: "🚲", v: 15, de: "das Fahrrad", en: "the bicycle" }] },
  { id: "cold", cat: "まち", catDe: "Welche Stadt", catEn: "Which city", q: "どこ", who: false, dir: -1,
    hi: A("さむい", "kälter", "am kältesten", "colder", "the coldest"), lo: A("あたたかい", "wärmer", "am wärmsten", "warmer", "the warmest"),
    show: v => `January ⌀ ${v} °C`,
    items: [{ k: "さっぽろ", e: "❄️", v: -3, de: "Sapporo", en: "Sapporo" }, { k: "ミュンヘン", e: "🥨", v: 0, de: "München", en: "Munich" },
      { k: "ベルリン", e: "🐻", v: 1, de: "Berlin", en: "Berlin" }, { k: "とうきょう", e: "🗼", v: 5, de: "Tokio", en: "Tokyo" }, { k: "おきなわ", e: "🌺", v: 17, de: "Okinawa", en: "Okinawa" }] },
  { id: "height", cat: "たてもの", catDe: "Welches Gebäude", catEn: "Which building", q: "なに", who: false, dir: 1,
    hi: A("たかい", "höher", "am höchsten", "taller", "the tallest"), lo: A("ひくい", "niedriger", "am niedrigsten", "lower", "the lowest"),
    show: v => `${v} m`,
    items: [{ k: "スカイツリー", e: "📡", v: 634, de: "der Skytree", en: "the Skytree" }, { k: "ベルリンテレビとう", e: "📺", v: 368, de: "der Berliner Fernsehturm", en: "the Berlin TV tower" },
      { k: "とうきょうタワー", e: "🗼", v: 333, de: "der Tokyo Tower", en: "Tokyo Tower" }, { k: "あべのハルカス", e: "🏢", v: 300, de: "Abeno Harukas", en: "Abeno Harukas" }] },
  { id: "area", cat: "くに", catDe: "Welches Land", catEn: "Which country", q: "どこ", who: false, dir: 1,
    hi: A("おおきい", "größer", "am größten", "bigger", "the biggest", { alt: ["ひろい"] }), lo: A("ちいさい", "kleiner", "am kleinsten", "smaller", "the smallest", { alt: ["せまい"] }),
    show: v => v >= 1000 ? `${(v / 1000).toFixed(1)} Mio km²` : `${v}k km²`,
    items: [{ k: "ロシア", e: "🇷🇺", v: 17100, de: "Russland", en: "Russia" }, { k: "アメリカ", e: "🇺🇸", v: 9830, de: "Amerika", en: "America" },
      { k: "フランス", e: "🇫🇷", v: 551, de: "Frankreich", en: "France" }, { k: "にほん", e: "🇯🇵", v: 378, de: "Japan", en: "Japan" }, { k: "ドイツ", e: "🇩🇪", v: 357, de: "Deutschland", en: "Germany" }] },
  { id: "price", cat: "たべもの", catDe: "Welches Essen", catEn: "Which dish", q: "なに", who: false, dir: 1,
    hi: A("たかい", "teurer", "am teuersten", "more expensive", "the most expensive"), lo: A("やすい", "billiger", "am billigsten", "cheaper", "the cheapest"),
    show: v => `¥ ${v.toLocaleString("en")}`,
    items: [{ k: "すし", e: "🍣", v: 2500, de: "Sushi", en: "sushi" }, { k: "てんぷら", e: "🍤", v: 1500, de: "Tempura", en: "tempura" },
      { k: "ラーメン", e: "🍜", v: 900, de: "Ramen", en: "ramen" }, { k: "カレー", e: "🍛", v: 800, de: "Curry", en: "curry" }, { k: "おにぎり", e: "🍙", v: 150, de: "Onigiri", en: "an onigiri" }] },
  { id: "season", cat: "いちねん", catDe: "Welche Jahreszeit", catEn: "Which season", q: "いつ", who: false, dir: 1,
    hi: A("あつい", "heißer", "am heißesten", "hotter", "the hottest"), lo: A("さむい", "kälter", "am kältesten", "colder", "the coldest"),
    show: v => `Tokyo ⌀ ${v} °C`,
    items: [{ k: "なつ", e: "☀️", v: 26, de: "der Sommer", en: "summer" }, { k: "あき", e: "🍁", v: 19, de: "der Herbst", en: "autumn" },
      { k: "はる", e: "🌸", v: 15, de: "der Frühling", en: "spring" }, { k: "ふゆ", e: "⛄", v: 6, de: "der Winter", en: "winter" }] },
  { id: "race", cat: "クラス", catDe: "Wer in der Klasse", catEn: "Who in the class", q: "だれ", who: true, dir: -1,
    hi: A("はやい", "schneller", "am schnellsten", "faster", "the fastest"), lo: A("おそい", "langsamer", "am langsamsten", "slower", "the slowest"),
    show: v => `100 m: ${v.toFixed(1)} s`,
    items: [{ k: "サントスさん", e: "🧑🏽", v: 11.8, de: "Herr Santos", en: "Mr Santos" }, { k: "たなかさん", e: "👨‍💼", v: 12.5, de: "Herr Tanaka", en: "Mr Tanaka" },
      { k: "ミラーさん", e: "🧑‍💼", v: 13.1, de: "Herr Miller", en: "Mr Miller" }, { k: "カリナさん", e: "👩‍🎓", v: 14.0, de: "Karina", en: "Karina" }, { k: "ワンさん", e: "👨‍⚕️", v: 15.2, de: "Herr Wang", en: "Mr Wang" }] },
  { id: "noise", cat: "まち", catDe: "Welcher Ort in der Stadt", catEn: "Which place in town", q: "どこ", who: false, dir: -1,
    hi: A("しずか", "ruhiger", "am ruhigsten", "quieter", "the quietest", { na: true }), lo: A("にぎやか", "belebter", "am belebtesten", "livelier", "the liveliest", { na: true }),
    show: v => `🔊 ${v} dB`,
    items: [{ k: "としょかん", e: "📚", v: 30, de: "die Bibliothek", en: "the library" }, { k: "こうえん", e: "🌳", v: 45, de: "der Park", en: "the park" },
      { k: "きっさてん", e: "☕", v: 60, de: "das Café", en: "the café" }, { k: "デパート", e: "🏬", v: 70, de: "das Kaufhaus", en: "the department store" }, { k: "えき", e: "🚉", v: 80, de: "der Bahnhof", en: "the station" }] },
  { id: "script", cat: "もじ", catDe: "Welche Schrift", catEn: "Which script", q: "なに", who: false, dir: 1,
    hi: A("むずかしい", "schwieriger", "am schwierigsten", "harder", "the hardest"), lo: A("かんたん", "einfacher", "am einfachsten", "easier", "the easiest", { na: true }),
    show: v => "★".repeat(v) + "☆".repeat(5 - v),
    items: [{ k: "かんじ", e: "🈶", v: 5, de: "Kanji", en: "kanji" }, { k: "カタカナ", e: "🔤", v: 2, de: "Katakana", en: "katakana" }, { k: "ひらがな", e: "🌀", v: 1, de: "Hiragana", en: "hiragana" }] },
];
// question words that also count for a group: things may be asked with どれ, people never with なに
const QW_ALT = { "なに": ["なに", "どれ"], "どこ": ["どこ"], "だれ": ["だれ"], "いつ": ["いつ"] };

// "Talk about you": free answers, checked for the pattern only.
const YOU = [
  { q: "なつと ふゆと どちらが すきですか。", kind: "two", help: ["なつ", "ふゆ", "の ほうが", "どちらも", "すきです", "ずっと"], model: ["なつの ほうが すきです。", "どちらも すきです。"] },
  { q: "コーヒーと おちゃと どちらが すきですか。", kind: "two", help: ["コーヒー", "おちゃ", "の ほうが", "どちらも", "すきです"], model: ["おちゃの ほうが すきです。"] },
  { q: "ドイツと にほんと どちらが すきですか。", kind: "two", help: ["ドイツ", "にほん", "の ほうが", "どちらも", "すきです"], model: ["どちらも すきです。"] },
  { q: "にほんの たべもので なにが いちばん すきですか。", kind: "sup", help: ["すし", "ラーメン", "てんぷら", "が", "いちばん", "すきです"], model: ["すしが いちばん すきです。"] },
  { q: "いちねんで いつが いちばん すきですか。", kind: "sup", help: ["はる", "なつ", "あき", "ふゆ", "が", "いちばん", "すきです"], model: ["あきが いちばん すきです。"] },
  { q: "かぞくで だれが いちばん せが たかいですか。", kind: "sup", note: "せが たかい = tall (people)", help: ["ちち", "あに", "わたし", "が", "いちばん", "せが たかいです"], model: ["あにが いちばん せが たかいです。"] },
];

// ----- kana → kanji for display -----
const KANJI = {
  "ぞう": "{象|ぞう}", "うま": "{馬|うま}", "いぬ": "{犬|いぬ}", "ねこ": "{猫|ねこ}", "ひこうき": "{飛行機|ひこうき}", "しんかんせん": "{新幹線|しんかんせん}", "くるま": "{車|くるま}", "じてんしゃ": "{自転車|じてんしゃ}",
  "さっぽろ": "{札幌|さっぽろ}", "とうきょう": "{東京|とうきょう}", "おきなわ": "{沖縄|おきなわ}", "とうきょうタワー": "{東京|とうきょう}タワー", "ベルリンテレビとう": "ベルリンテレビ{塔|とう}",
  "にほん": "{日本|にほん}", "てんぷら": "{天|てん}ぷら", "はる": "{春|はる}", "なつ": "{夏|なつ}", "あき": "{秋|あき}", "ふゆ": "{冬|ふゆ}", "たなかさん": "{田中|たなか}さん",
  "としょかん": "{図書館|としょかん}", "こうえん": "{公園|こうえん}", "きっさてん": "{喫茶店|きっさてん}", "えき": "{駅|えき}", "かんじ": "{漢字|かんじ}",
  "どうぶつ": "{動物|どうぶつ}", "のりもの": "{乗|の}り{物|もの}", "まち": "{町|まち}", "たてもの": "{建物|たてもの}", "くに": "{国|くに}", "たべもの": "{食|た}べ{物|もの}", "いちねん": "{1年|いちねん}", "もじ": "{文字|もじ}",
  "おもい": "{重|おも}い", "かるい": "{軽|かる}い", "おおきい": "{大|おお}きい", "ちいさい": "{小|ちい}さい", "はやい": "{速|はや}い", "おそい": "{遅|おそ}い", "さむい": "{寒|さむ}い", "あたたかい": "{暖|あたた}かい",
  "たかい": "{高|たか}い", "ひくい": "{低|ひく}い", "やすい": "{安|やす}い", "しずか": "{静|しず}か", "むずかしい": "{難|むずか}しい", "かんたん": "{簡単|かんたん}", "あつい": "{暑|あつ}い", "ひろい": "{広|ひろ}い", "せまい": "{狭|せま}い",
  "すき": "{好|す}き", "なに": "{何|なに}", "おちゃ": "お{茶|ちゃ}", "かぞく": "{家族|かぞく}", "ちち": "{父|ちち}", "あに": "{兄|あに}", "わたし": "{私|わたし}", "せ": "{背|せ}",
};

// settings read by the shared engine
const VOCAB = [];
const LESSON = { key: "yori.v1", name: "より Dojo", title: "より・ほうが道場", sub: "", confetti: ["🎉", "✨", "⚖️", "🐘", "🚄", "⭐"], memoryGroups: {}, builderExtra: () => [], whyWrong: () => "" };
