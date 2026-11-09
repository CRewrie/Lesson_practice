"use strict";
// Lektion 10 (Minna no Nihongo I) — content.
// Markup in Japanese strings: {漢字|かな} renders as furigana.

// kind: "i" = living thing (います), "a" = thing / place / plant (あります), "p" = position word, "x" = other
const VOCAB = [
  // verbs & adjective
  { id: "arimasu", kana: "あります", de: "(da) sein, es gibt ~ (Dinge)", en: "there is (things, plants)", emo: "📦", cat: "Verbs", kind: "x" },
  { id: "imasu", kana: "います", de: "(da) sein, es gibt ~ (Lebewesen)", en: "there is (people, animals)", emo: "🐈", cat: "Verbs", kind: "x" },
  { id: "iroiro", kana: "いろいろ[な]", de: "verschiedene", en: "various", emo: "🎨", cat: "Verbs", kind: "x" },
  // people & animals
  { id: "otokonohito", kana: "おとこの ひと", kanji: "{男|おとこ}の{人|ひと}", de: "Mann", en: "man", emo: "👨", cat: "People & animals", kind: "i" },
  { id: "onnanohito", kana: "おんなの ひと", kanji: "{女|おんな}の{人|ひと}", de: "Frau", en: "woman", emo: "👩", cat: "People & animals", kind: "i" },
  { id: "otokonoko", kana: "おとこの こ", kanji: "{男|おとこ}の{子|こ}", de: "Junge", en: "boy", emo: "👦", cat: "People & animals", kind: "i" },
  { id: "onnanoko", kana: "おんなの こ", kanji: "{女|おんな}の{子|こ}", de: "Mädchen", en: "girl", emo: "👧", cat: "People & animals", kind: "i" },
  { id: "inu", kana: "いぬ", kanji: "{犬|いぬ}", de: "Hund", en: "dog", emo: "🐕", cat: "People & animals", kind: "i" },
  { id: "neko", kana: "ねこ", kanji: "{猫|ねこ}", de: "Katze", en: "cat", emo: "🐈", cat: "People & animals", kind: "i" },
  { id: "panda", kana: "パンダ", de: "Panda", en: "panda", emo: "🐼", cat: "People & animals", kind: "i" },
  { id: "zou", kana: "ぞう", kanji: "{象|ぞう}", de: "Elefant", en: "elephant", emo: "🐘", cat: "People & animals", kind: "i" },
  // things
  { id: "ki", kana: "き", kanji: "{木|き}", de: "Baum", en: "tree", emo: "🌳", cat: "Things", kind: "a" },
  { id: "mono", kana: "もの", kanji: "{物|もの}", de: "Ding, Gegenstand", en: "thing", emo: "🧸", cat: "Things", kind: "a" },
  { id: "denchi", kana: "でんち", kanji: "{電池|でんち}", de: "Batterie", en: "battery", emo: "🔋", cat: "Things", kind: "a" },
  { id: "hako", kana: "はこ", kanji: "{箱|はこ}", de: "Schachtel, Kasten, Kiste", en: "box", emo: "📦", cat: "Things", kind: "a" },
  { id: "suicchi", kana: "スイッチ", de: "Schalter", en: "switch", emo: "🎚️", cat: "Things", kind: "a" },
  { id: "reizouko", kana: "れいぞうこ", kanji: "{冷蔵庫|れいぞうこ}", de: "Kühlschrank", en: "fridge", emo: "🧊", cat: "Things", kind: "a" },
  { id: "teeburu", kana: "テーブル", de: "(Ess-) Tisch", en: "table", emo: "🍽️", cat: "Things", kind: "a" },
  { id: "beddo", kana: "ベッド", de: "Bett", en: "bed", emo: "🛏️", cat: "Things", kind: "a" },
  { id: "tana", kana: "たな", kanji: "{棚|たな}", de: "Regal", en: "shelf", emo: "📚", cat: "Things", kind: "a" },
  { id: "doa", kana: "ドア", de: "Tür", en: "door", emo: "🚪", cat: "Things", kind: "a" },
  { id: "mado", kana: "まど", kanji: "{窓|まど}", de: "Fenster", en: "window", emo: "🪟", cat: "Things", kind: "a" },
  // places
  { id: "posuto", kana: "ポスト", de: "Briefkasten", en: "mailbox", emo: "📮", cat: "Places", kind: "a" },
  { id: "biru", kana: "ビル", de: "Gebäude", en: "building", emo: "🏢", cat: "Places", kind: "a" },
  { id: "atm", kana: "ATM", de: "Geldautomat", en: "ATM", emo: "🏧", cat: "Places", kind: "a" },
  { id: "konbini", kana: "コンビニ", de: "Convenience Store", en: "convenience store", emo: "🏪", cat: "Places", kind: "a" },
  { id: "kouen", kana: "こうえん", kanji: "{公園|こうえん}", de: "Park", en: "park", emo: "🏞️", cat: "Places", kind: "a" },
  { id: "kissaten", kana: "きっさてん", kanji: "{喫茶店|きっさてん}", de: "Café", en: "café", emo: "☕", cat: "Places", kind: "a" },
  { id: "ya", kana: "～や", kanji: "～{屋|や}", de: "~geschäft, ~laden", en: "~ shop", emo: "🏬", cat: "Places", kind: "a" },
  { id: "noriba", kana: "のりば", kanji: "{乗|の}り{場|ば}", de: "Halteplatz (Taxi, Zug)", en: "stop / platform", emo: "🚏", cat: "Places", kind: "a" },
  { id: "ken", kana: "けん", kanji: "{県|けん}", de: "Präfektur", en: "prefecture", emo: "🗾", cat: "Places", kind: "a" },
  // positions
  { id: "ue", kana: "うえ", kanji: "{上|うえ}", de: "oben, über, auf", en: "on, above", emo: "⬆️", cat: "Positions", kind: "p" },
  { id: "shita", kana: "した", kanji: "{下|した}", de: "unten, unter", en: "under, below", emo: "⬇️", cat: "Positions", kind: "p" },
  { id: "mae", kana: "まえ", kanji: "{前|まえ}", de: "vor, vorne", en: "in front of", emo: "🔜", cat: "Positions", kind: "p" },
  { id: "ushiro", kana: "うしろ", de: "hinter, hinten", en: "behind", emo: "🔙", cat: "Positions", kind: "p" },
  { id: "migi", kana: "みぎ", kanji: "{右|みぎ}", de: "rechts", en: "right", emo: "➡️", cat: "Positions", kind: "p" },
  { id: "hidari", kana: "ひだり", kanji: "{左|ひだり}", de: "links", en: "left", emo: "⬅️", cat: "Positions", kind: "p" },
  { id: "naka", kana: "なか", kanji: "{中|なか}", de: "innen, in", en: "inside", emo: "📥", cat: "Positions", kind: "p" },
  { id: "soto", kana: "そと", kanji: "{外|そと}", de: "außen", en: "outside", emo: "📤", cat: "Positions", kind: "p" },
  { id: "tonari", kana: "となり", kanji: "{隣|となり}", de: "neben (gleiche Art)", en: "next to", emo: "👯", cat: "Positions", kind: "p" },
  { id: "chikaku", kana: "ちかく", kanji: "{近|ちか}く", de: "in der Nähe, nahe bei", en: "near", emo: "📍", cat: "Positions", kind: "p" },
  { id: "aida", kana: "あいだ", kanji: "{間|あいだ}", de: "zwischen", en: "between", emo: "↔️", cat: "Positions", kind: "p" },
  // conversation & misc
  { id: "yanado", kana: "～や ～[など]", de: "~, ~ [usw.]", en: "~ and ~ [etc.]", emo: "🧺", cat: "Conversation", kind: "x" },
  { id: "doumo", kana: "[どうも] すみません", de: "Vielen Dank!", en: "thank you (very much)", emo: "🙇", cat: "Conversation", kind: "x" },
  { id: "nampuraa", kana: "ナンプラー", de: "Nam pla (thail. Fischsauce)", en: "fish sauce", emo: "🐟", cat: "Conversation", kind: "a" },
  { id: "koonaa", kana: "コーナー", de: "Ecke", en: "corner, section", emo: "📐", cat: "Conversation", kind: "a" },
  { id: "ichibanshita", kana: "いちばん した", kanji: "いちばん {下|した}", de: "ganz unten", en: "at the very bottom", emo: "⏬", cat: "Conversation", kind: "x" },
  { id: "disney", kana: "とうきょう ディズニーランド", kanji: "{東京|とうきょう}ディズニーランド", de: "Tokyo Disneyland", en: "Tokyo Disneyland", emo: "🏰", cat: "Conversation", kind: "a" },
  { id: "asiastore", kana: "アジアストア", de: "fiktiver Supermarkt", en: "fictional supermarket", emo: "🛒", cat: "Conversation", kind: "a" },
];

// Words from earlier lessons that appear on the worksheet / in scenes (used as extra practice items).
const EXTRA = [
  { kana: "つくえ", de: "Schreibtisch", en: "desk", emo: "🗃️", kind: "a" },
  { kana: "いす", de: "Stuhl", en: "chair", emo: "🪑", kind: "a" },
  { kana: "かばん", de: "Tasche", en: "bag", emo: "👜", kind: "a" },
  { kana: "くるま", de: "Auto", en: "car", emo: "🚗", kind: "a" },
  { kana: "タクシー", de: "Taxi", en: "taxi", emo: "🚕", kind: "a" },
  { kana: "ほん", de: "Buch", en: "book", emo: "📕", kind: "a" },
  { kana: "とけい", de: "Uhr", en: "clock", emo: "⏰", kind: "a" },
  { kana: "ぎゅうにゅう", de: "Milch", en: "milk", emo: "🥛", kind: "a" },
  { kana: "たまご", de: "Ei", en: "egg", emo: "🥚", kind: "a" },
  { kana: "はな", de: "Blume", en: "flower", emo: "🌷", kind: "a" },
  { kana: "せんせい", de: "Lehrer/in", en: "teacher", emo: "🧑‍🏫", kind: "i" },
  { kana: "とり", de: "Vogel", en: "bird", emo: "🐦", kind: "i" },
  { kana: "さかな", de: "Fisch (lebend)", en: "fish (alive)", emo: "🐠", kind: "i" },
  { kana: "ロボット", de: "Roboter (Ding!)", en: "robot (a thing!)", emo: "🤖", kind: "a" },
  { kana: "ミラーさん", de: "Herr Miller", en: "Mr Miller", emo: "🧑‍💼", kind: "i" },
];

// Sentence builder. Tokens are space-separated; a sentence is correct only in this order.
// pic: emojis shown as a hint picture.
const SENTENCES = [
  { t: "いす の した に ねこ が います", de: "Unter dem Stuhl ist eine Katze.", en: "There is a cat under the chair.", pic: "🪑⬇️🐈" },
  { t: "はこ の なか に でんち が あります", de: "In der Schachtel ist eine Batterie.", en: "There is a battery in the box.", pic: "📦📥🔋" },
  { t: "ドア の みぎ に スイッチ が あります", de: "Rechts von der Tür ist ein Schalter.", en: "There is a switch to the right of the door.", pic: "🚪➡️🎚️" },
  { t: "みせ の まえ に くるま が あります", de: "Vor dem Laden steht ein Auto.", en: "There is a car in front of the shop.", pic: "🏬🔜🚗" },
  { t: "き の した に おとこのこ が います", de: "Unter dem Baum ist ein Junge.", en: "There is a boy under the tree.", pic: "🌳⬇️👦" },
  { t: "れいぞうこ の なか に いろいろな もの が あります", de: "Im Kühlschrank sind verschiedene Sachen.", en: "There are various things in the fridge.", pic: "🧊📥🥛🥚🍎" },
  { t: "こうえん に おとこのひと が います", de: "Im Park ist ein Mann.", en: "There is a man in the park.", pic: "🏞️👨" },
  { t: "きっさてん の うしろ に こうえん が あります", de: "Hinter dem Café ist ein Park.", en: "There is a park behind the café.", pic: "☕🔙🏞️" },
  { t: "がっこう の となり に としょかん が あります", de: "Neben der Schule ist eine Bibliothek.", en: "There is a library next to the school.", pic: "🏫👯📚" },
  { t: "ゆうびんきょく の まえ に ポスト が あります", de: "Vor der Post ist ein Briefkasten.", en: "There is a mailbox in front of the post office.", pic: "🏤🔜📮" },
  { t: "ベッド の した に かばん が あります", de: "Unter dem Bett ist eine Tasche.", en: "There is a bag under the bed.", pic: "🛏️⬇️👜" },
  { t: "まど の みぎ に たな が あります", de: "Rechts vom Fenster ist ein Regal.", en: "There is a shelf to the right of the window.", pic: "🪟➡️📚" },
  { t: "テーブル の うえ に なに が あります か", de: "Was ist auf dem Tisch?", en: "What is on the table?", pic: "🍽️⬆️❓" },
  { t: "にわ に だれ が います か", de: "Wer ist im Garten?", en: "Who is in the garden?", pic: "🏡❓🧍" },
  { t: "ぎんこう と コンビニ の あいだ に ATM が あります", de: "Zwischen Bank und Konbini ist ein Geldautomat.", en: "There is an ATM between the bank and the konbini.", pic: "🏦🏧🏪" },
  { t: "はこ の なか に てがみ や しゃしん など が あります", de: "In der Schachtel sind Briefe, Fotos usw.", en: "In the box there are letters, photos, etc.", pic: "📦✉️🖼️…" },
  { t: "ミラーさん は かいぎしつ に います", de: "Herr Miller ist im Konferenzraum.", en: "Mr Miller is in the meeting room.", pic: "🧑‍💼🚪🗣️" },
  { t: "ナンプラー は いちばん した に あります", de: "Nam pla ist ganz unten.", en: "The fish sauce is at the very bottom.", pic: "🐟⏬" },
  { t: "えき の ちかく に コンビニ が あります", de: "In der Nähe vom Bahnhof ist ein Konbini.", en: "There is a konbini near the station.", pic: "🚉📍🏪" },
  { t: "へや に だれ も いません", de: "Im Zimmer ist niemand.", en: "There is nobody in the room.", pic: "🚪🙅" },
  { t: "はこ の なか に なに も ありません", de: "In der Schachtel ist nichts.", en: "There is nothing in the box.", pic: "📦🈳" },
  { t: "ねこ は ドア の そと に います", de: "Die Katze ist vor der Tür (draußen).", en: "The cat is outside the door.", pic: "🚪📤🐈" },
];
const PARTICLES = ["の", "に", "が", "は", "と", "や", "も", "か", "など"];
const VERBS = ["あります", "います", "ありません", "いません"];

// Hand-written grammar questions. o[0] is always the right answer (options get shuffled).
// why: explanation for each wrong option (same index), plus "ok" for the right one.
const GRAMMAR_Q = [
  { q: "こうえんに ねこ（　）います。", o: ["が", "を", "で", "へ"], ok: "New information ‘there is a cat’ → <b>が</b> marks what exists.", why: [null, "を marks the object of an action verb — います has no object.", "で marks where an <i>action</i> happens. Existence uses <b>に</b> for the place and <b>が</b> for the thing.", "へ shows direction of movement."] },
  { q: "こうえん（　）ねこが います。", o: ["に", "で", "を", "が"], ok: "The place where something exists takes <b>に</b>.", why: [null, "で is for places where an action happens (こうえんで あそびます). For existence it's に.", "を doesn't mark places of existence.", "が already marks the cat — the place needs に."] },
  { q: "ミラーさん（　）どこに いますか。", o: ["は", "が", "を", "に"], ok: "When you ask <i>where</i> a known person/thing is, it becomes the topic: <b>N は どこに います/あります か</b>.", why: [null, "が is used with question words like だれが / なにが. Here ミラーさん is the topic.", "を marks an object.", "に is for the place, not for the person."] },
  { q: "はこの なかに なに（　）ありますか。", o: ["が", "は", "を", "に"], ok: "Question words (なに・だれ) can never take は — always <b>なにが / だれが</b>.", why: [null, "Question words never take は.", "を marks objects of action verbs.", "に marks the place, but なに is the thing."] },
  { q: "テーブルの うえに なにが ありますか。 —— かばん（　）あります。", o: ["が", "は", "を", "も"], ok: "Answer with the same particle the question asked with: なにが → <b>かばんが</b>.", why: [null, "Answering a なにが question with は sounds like contrasting — keep が.", "を is wrong with あります.", "も means ‘also’ — nothing was mentioned before."] },
  { q: "へやに だれが いますか。 —— だれも（　）。", o: ["いません", "いますか", "ありません", "います"], ok: "<b>だれも + negative</b> = nobody. People → いません.", why: [null, "That's a question, not an answer.", "ありません is for things. ‘Nobody’ is about people → いません.", "だれも always needs a negative verb."] },
  { q: "はこの なかに なにが ありますか。 —— なにも（　）。", o: ["ありません", "いません", "あります", "です"], ok: "<b>なにも + negative</b> = nothing. Things → ありません.", why: [null, "いません is for living beings.", "なにも always needs a negative verb.", "なにも です isn't a sentence."] },
  { q: "Which is natural?  🌳", o: ["きが あります。", "きが います。"], ok: "Plants don't move by themselves → <b>あります</b>.", why: [null, "Trees are alive but don't move by themselves → あります, not います."] },
  { q: "Which is natural?  🤖 (a toy robot that walks)", o: ["ロボットが あります。", "ロボットが います。"], ok: "Textbook rule: machines are things → <b>あります</b>. (Fun fact: for a robot that ‘feels alive’, people sometimes say います — but stay with あります on tests!)", why: [null, "A robot isn't a living being → あります (on tests)."] },
  { q: "Which is natural?  🚕 (a taxi with a driver waiting)", o: ["タクシーが あります。", "タクシーが います。"], ok: "Vehicles are things → <b>あります</b> (in casual speech a taxi with a driver is sometimes います!).", why: [null, "Cars and taxis are things → あります (textbook)."] },
  { q: "Which is natural?  🐠 (swimming in the pond)", o: ["さかなが います。", "さかなが あります。"], ok: "A living fish moves → <b>います</b>. (A fish in the fridge for dinner → あります! 🐟❄️)", why: [null, "A swimming fish is alive → います."] },
  { q: "つくえの うえに ほん（　）ノート（　）が あります。 (books, notebooks, and other things)", o: ["や・など", "と・など", "を・や", "の・と"], ok: "<b>や … など</b> lists some examples (there's more). と lists everything.", why: [null, "と means ‘and (that's all)’. For ‘and so on’ use や … など.", "を is not a list particle.", "の connects nouns (‘of’), not a list."] },
  { q: "ぎんこうと コンビニの（　）に ATMが あります。 (between)", o: ["あいだ", "となり", "ちかく", "なか"], ok: "<b>A と B の あいだ</b> = between A and B.", why: [null, "となり = next to (one thing).", "ちかく = near.", "なか = inside."] },
  { q: "いろいろ（　）もの", o: ["な", "の", "い", "—"], ok: "いろいろ is a な-adjective → <b>いろいろな もの</b>.", why: [null, "いろいろ is a な-adjective, not a noun.", "It's not an い-adjective.", "Before a noun you need な."] },
  { q: "ポストは どこに ありますか。", o: ["ぎんこうの まえに あります。", "ぎんこうの まえに ポストが あります。", "ぎんこうの まえに います。", "ぎんこうの まえです か。"], ok: "Answer only the new info: <b>(ポストは) ぎんこうの まえに あります</b>. (Short: ぎんこうの まえです。)", why: [null, "Grammatical, but it answers ‘what is in front of the bank?’, not ‘where is the mailbox?’.", "A mailbox is a thing → あります.", "That turns it into a question."] },
  { q: "きの した（　）おとこのこが います。", o: ["に", "の", "で", "が"], ok: "Position words are nouns: <b>N の した に</b>.", why: [null, "の connects two nouns; after した you need the place particle に.", "で is for actions.", "が already belongs to おとこのこ."] },
  { q: "There is a boy under the tree. →", o: ["きの したに おとこのこが います。", "きの したに こが います。", "したの きに おとこのこが います。", "きの したに おとこのこが あります。"], ok: "Reference point first: <b>き の した</b> (the tree's underside).", why: [null, "こ alone isn't used for ‘boy’ — say おとこのこ.", "Order is reversed: [reference] の [position].", "A boy is a person → います."] },
  { q: "There is a car in front of the shop. →", o: ["みせの まえに くるまが あります。", "みせの うえに くるまが あります。", "みせの まえに くるまが います。", "くるまの まえに みせが あります。"], ok: "まえ = in front of.", why: [null, "うえ = on top of — the car would be on the roof! 🚗🏠", "A car is a thing → あります.", "This says the shop is in front of the car."] },
  { q: "[どうも] すみません。 means here…", o: ["Thank you (very much)!", "Excuse me, where is…?", "I'm sorry I'm late.", "Goodbye."], ok: "In Lesson 10 the conversation ends with <b>どうも すみません</b> = ‘Thanks a lot (sorry for the trouble)’.", why: [null, "すみません can open a question, but どうも すみません after help = thank you.", "Possible elsewhere, but in this dialogue it's thanks.", "That's さようなら."] },
  { q: "ナンプラーは いちばん したです。 means…", o: ["The nam pla is at the very bottom.", "The nam pla is the best.", "The nam pla is under the table.", "There is no nam pla."], ok: "<b>いちばん した</b> = the lowest / very bottom (shelf).", why: [null, "いちばん alone can mean ‘best’, but いちばん した = very bottom.", "No table was mentioned.", "That would be ありません."] },
  { q: "Where is the toilet? (polite question to a stranger)", o: ["すみません。トイレは どこですか。", "すみません。トイレが どこですか。", "すみません。どこに トイレですか。", "トイレは どこに いますか。"], ok: "<b>N は どこですか</b> (= N は どこに ありますか).", why: [null, "Ask about a known thing with は, not が.", "Word order is wrong.", "A toilet is a thing → あります / です."] },
];

// Worksheet F㊴ — your answers with feedback.
const WORKSHEET = [
  { sec: "<1>", items: [
    { n: "1)", mine: "こうえんに（男の人）が います。", ok: true, note: "Perfect — a person → います." },
    { n: "2)", mine: "へやに（テーブル）が あります。", ok: true, note: "A thing → あります." },
    { n: "3)", mine: "（れいぞうこ）の なかに ぎゅうにゅうが あります。", ok: true, note: "Milk is in the fridge. 🥛" },
    { n: "4)", mine: "ゆうびんきょくの まえに（ポスト）が あります。", ok: true, note: "Mailbox in front of the post office." },
  ]},
  { sec: "<2>", items: [
    { n: "1)", mine: "いすの した", ok: true },
    { n: "2)", mine: "はこの なか", ok: true },
    { n: "3)", mine: "きっさてんの うしろ", ok: true, note: "The arrow points at the café, the park is behind it. ✔" },
    { n: "4)", mine: "としょかんの となり", ok: "hm", fix: "がっこうの となり", note: "Check the arrow: it points at the <b>library</b>, so the answer describes where the library is, using the school as reference → <b>がっこうの となり</b>. (If the arrow means the school, yours is right.)" },
  ]},
  { sec: "<3>", items: [
    { n: "1)", mine: "いすの したに ねこが います", ok: true, note: "Watch your ね — it looked a bit like わ. ねこ 🐈 not わこ." },
    { n: "2)", mine: "みせの <s>うえ</s>に くるまが あります", ok: false, fix: "みせの まえに くるまが あります", note: "The car is <b>in front of</b> the shop (まえ). うえ would put it on the roof! 🚗🏠" },
    { n: "3)", mine: "きの <s>みぎ</s>に <s>こ</s>が います", ok: false, fix: "きの したに おとこのこが います", note: "The boy sits <b>under</b> the tree (した). And こ alone isn't a word for ‘boy’ — you need the full <b>おとこのこ</b>." },
    { n: "4)", mine: "れいぞうこの なかに ものが あります", ok: "hm", fix: "れいぞうこの なかに いろいろな ものが あります", note: "Grammatically fine, but the prompt gave <b>いろいろな もの</b> — keep it: ‘various things’." },
  ]},
  { sec: "<4>", items: [
    { n: "1)", mine: "Q: ベッドの したに なにが ありますか　A: はこが あります", ok: "hm", fix: "A: かばんが あります", note: "Q is perfect. In the picture the thing under the bed looks like a <b>bag</b> (かばん) 👜." },
    { n: "2)", mine: "Q: へやに だれが いますか　A: いぬが います", ok: "hm", fix: "Q: へやに なにが いますか　A: ねこが います", note: "The animal under the desk is a <b>cat</b>. Also: だれ is for <i>people</i>. For animals ask <b>なにが いますか</b> (the worksheet prompt said だれ, so your Q follows it)." },
    { n: "3)", mine: "Q: まどの みぎに なにが ありますか　A: たなが あります", ok: true, note: "Shelf to the right of the window. 📚" },
    { n: "4)", mine: "Q: にわに だれが いますか　A: おんなの ひとが います", ok: true, note: "Question is perfect. (Look again at the picture — short hair, trousers: if it's a man, おとこの ひと.)" },
  ]},
  { sec: "<5> (not done yet — try it in “Talk about you”)", items: [
    { n: "1)", mine: "いま、うちの そとに だれが いますか。", ok: "todo", fix: "だれも いません。 / おとこの ひとが います。", note: "Use だれも いません if nobody is there." },
    { n: "2)", mine: "あなたの かばんの なかに なにが ありますか。", ok: "todo", fix: "ほんや かぎや でんわ などが あります。", note: "Great place for や … など!" },
    { n: "3)", mine: "うちの ちかくに なにが ありますか。", ok: "todo", fix: "コンビニや こうえんが あります。", note: "" },
  ]},
];
