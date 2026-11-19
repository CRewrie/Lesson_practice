"use strict";
// こと・の・さ道場 — turning verbs and adjectives into nouns. Content only; helpers come from ../assets/core.js.
// Every answer is a single word or a short chunk.

// ----- verbs -----
// m ます-form · d dictionary form · g group · km/kd with kanji · kata: the ～かた noun exists and is common
// o object for example sentences · de/en phrases for translations (zu-infinitive, infinitive, gerund, base form)
const V = (m, d, g, km, kd, extra = {}) => ({ m, d, g, km, kd, stem: m.slice(0, -2), ...extra });
const VERBS = [
  V("よみます", "よむ", 1, "{読|よ}みます", "{読|よ}む", { kata: true, o: "ほんを", mean: ["lesen", "read"], de: { zu: "Bücher zu lesen", inf: "Bücher lesen" }, en: { ger: "reading books", base: "read books" } }),
  V("かきます", "かく", 1, "{書|か}きます", "{書|か}く", { kata: true, o: "てがみを", mean: ["schreiben", "write"], de: { zu: "Briefe zu schreiben", inf: "Briefe schreiben" }, en: { ger: "writing letters", base: "write letters" } }),
  V("はなします", "はなす", 1, "{話|はな}します", "{話|はな}す", { kata: true, o: "にほんごを", mean: ["sprechen", "speak"], de: { zu: "Japanisch zu sprechen", inf: "Japanisch sprechen" }, en: { ger: "speaking Japanese", base: "speak Japanese" } }),
  V("ききます", "きく", 1, "{聞|き}きます", "{聞|き}く", { noJouzu: true, o: "おんがくを", mean: ["hören", "listen"], de: { zu: "Musik zu hören", inf: "Musik hören" }, en: { ger: "listening to music", base: "listen to music" } }),
  V("およぎます", "およぐ", 1, "{泳|およ}ぎます", "{泳|およ}ぐ", { kata: true, o: "", mean: ["schwimmen", "swim"], de: { zu: "zu schwimmen", inf: "schwimmen" }, en: { ger: "swimming", base: "swim" } }),
  V("ひきます", "ひく", 1, "{弾|ひ}きます", "{弾|ひ}く", { kata: true, o: "ピアノを", mean: ["(Klavier) spielen", "play (the piano)"], de: { zu: "Klavier zu spielen", inf: "Klavier spielen" }, en: { ger: "playing the piano", base: "play the piano" } }),
  V("うたいます", "うたう", 1, "{歌|うた}います", "{歌|うた}う", { kata: true, o: "うたを", mean: ["singen", "sing"], de: { zu: "Lieder zu singen", inf: "Lieder singen" }, en: { ger: "singing songs", base: "sing songs" } }),
  V("つくります", "つくる", 1, "{作|つく}ります", "{作|つく}る", { kata: true, o: "りょうりを", mean: ["machen, kochen", "make, cook"], de: { zu: "zu kochen", inf: "kochen" }, en: { ger: "cooking", base: "cook" } }),
  V("とります", "とる", 1, "{撮|と}ります", "{撮|と}る", { kata: true, o: "しゃしんを", mean: ["(Fotos) machen", "take (photos)"], de: { zu: "Fotos zu machen", inf: "Fotos machen" }, en: { ger: "taking photos", base: "take photos" } }),
  V("のります", "のる", 1, "{乗|の}ります", "{乗|の}る", { kata: true, o: "じてんしゃに", mean: ["fahren (auf/in)", "ride"], de: { zu: "Fahrrad zu fahren", inf: "Fahrrad fahren" }, en: { ger: "riding a bike", base: "ride a bike" } }),
  V("はしります", "はしる", 1, "{走|はし}ります", "{走|はし}る", { trap: true, o: "", mean: ["laufen, rennen", "run"], de: { zu: "zu laufen", inf: "laufen" }, en: { ger: "running", base: "run" } }),
  V("つかいます", "つかう", 1, "{使|つか}います", "{使|つか}う", { kata: true, mean: ["benutzen", "use"] }),
  V("かえります", "かえる", 1, "{帰|かえ}ります", "{帰|かえ}る", { trap: true, mean: ["zurückkehren, nach Hause gehen", "go home"] }),
  V("はいります", "はいる", 1, "{入|はい}ります", "{入|はい}る", { trap: true, mean: ["hineingehen", "enter"] }),
  V("まちます", "まつ", 1, "{待|ま}ちます", "{待|ま}つ", { mean: ["warten", "wait"] }),
  V("あそびます", "あそぶ", 1, "{遊|あそ}びます", "{遊|あそ}ぶ", { mean: ["spielen (Freizeit)", "play, hang out"] }),
  V("しにます", "しぬ", 1, "{死|し}にます", "{死|し}ぬ", { mean: ["sterben", "die"] }),
  V("かいます", "かう", 1, "{買|か}います", "{買|か}う", { mean: ["kaufen", "buy"] }),
  V("いきます", "いく", 1, "{行|い}きます", "{行|い}く", { mean: ["gehen, fahren", "go"] }),
  V("けします", "けす", 1, "{消|け}します", "{消|け}す", { mean: ["ausmachen", "turn off"] }),
  V("だします", "だす", 1, "{出|だ}します", "{出|だ}す", { mean: ["abgeben, herausnehmen", "hand in, take out"] }),
  V("のみます", "のむ", 1, "{飲|の}みます", "{飲|の}む", { mean: ["trinken, (Medizin) nehmen", "drink, take (medicine)"] }),
  V("たべます", "たべる", 2, "{食|た}べます", "{食|た}べる", { kata: true, o: "すしを", noJouzu: true, mean: ["essen", "eat"], de: { zu: "Sushi zu essen", inf: "Sushi essen" }, en: { ger: "eating sushi", base: "eat sushi" } }),
  V("みます", "みる", 2, "{見|み}ます", "{見|み}る", { exc: true, o: "えいがを", noJouzu: true, mean: ["sehen, schauen", "watch, see"], de: { zu: "Filme zu sehen", inf: "Filme sehen" }, en: { ger: "watching films", base: "watch films" } }),
  V("おしえます", "おしえる", 2, "{教|おし}えます", "{教|おし}える", { kata: true, o: "えいごを", mean: ["unterrichten, beibringen", "teach"], de: { zu: "Englisch zu unterrichten", inf: "Englisch unterrichten" }, en: { ger: "teaching English", base: "teach English" } }),
  V("ねます", "ねる", 2, "{寝|ね}ます", "{寝|ね}る", { mean: ["schlafen gehen", "go to bed"] }),
  V("おきます", "おきる", 2, "{起|お}きます", "{起|お}きる", { exc: true, mean: ["aufstehen", "get up"] }),
  V("かります", "かりる", 2, "{借|か}ります", "{借|か}りる", { exc: true, mean: ["(sich) leihen", "borrow"] }),
  V("います", "いる", 2, "います", "いる", { exc: true, mean: ["sein, da sein (Lebewesen)", "be (living things)"] }),
  V("あびます", "あびる", 2, "{浴|あ}びます", "{浴|あ}びる", { exc: true, mean: ["(Dusche) nehmen", "take (a shower)"] }),
  V("かけます", "かける", 2, "かけます", "かける", { mean: ["(abschließen, anrufen)", "(lock, call)"] }),
  V("します", "する", 3, "します", "する", { kata: true, o: "テニスを", mean: ["machen, tun", "do"], de: { zu: "Tennis zu spielen", inf: "Tennis spielen" }, en: { ger: "playing tennis", base: "play tennis" } }),
  V("きます", "くる", 3, "{来|き}ます", "{来|く}る", { mean: ["kommen", "come"] }),
  V("べんきょうします", "べんきょうする", 3, "{勉強|べんきょう}します", "{勉強|べんきょう}する", { noJouzu: true, o: "にほんごを", mean: ["lernen", "study"], de: { zu: "Japanisch zu lernen", inf: "Japanisch lernen" }, en: { ger: "studying Japanese", base: "study Japanese" } }),
];
const KATA_IRREG = { "します": "しかた" };          // ～かた of する is しかた

// "I forgot to …": の only
const FORGOT = [
  { o: "でんきを", d: "けす", de: "das Licht auszumachen", en: "to turn off the light" },
  { o: "かぎを", d: "かける", de: "abzuschließen", en: "to lock the door" },
  { o: "くすりを", d: "のむ", de: "meine Medizin zu nehmen", en: "to take my medicine" },
  { o: "しゅくだいを", d: "だす", de: "die Hausaufgaben abzugeben", en: "to hand in my homework" },
  { o: "きっぷを", d: "かう", de: "die Fahrkarte zu kaufen", en: "to buy the ticket" },
  { o: "ははに でんわを", d: "かける", de: "meine Mutter anzurufen", en: "to call my mother" },
];
const NAMES = [["ミラーさん", "Herr Miller", "Mr Miller"], ["カリナさん", "Karina", "Karina"], ["たなかさん", "Herr Tanaka", "Mr Tanaka"]];

// The sentence patterns for verb + こと／の.  nom: which nominalisers are right.
const VT = {
  hobby: { nom: ["こと"], ja: v => [`しゅみは ${v.o}`, "ことです。"], de: v => `Mein Hobby ist es, ${v.de.zu}.`, en: v => `My hobby is ${v.en.ger}.`,
    why: "<span class=\"jp\">しゅみは ～ことです</span> — always <b>こと</b>." },
  can: { nom: ["こと"], ja: v => [`わたしは ${v.o}`, "ことが できます。"], de: v => `Ich kann ${v.de.inf}.`, en: v => `I can ${v.en.base}.`,
    why: "<span class=\"jp\">～ことが できます</span> (can …) — always <b>こと</b>." },
  like: { nom: ["の", "こと"], ja: v => [`わたしは ${v.o}`, "のが すきです。"], de: v => `Ich mag es, ${v.de.zu}.`, en: v => `I like ${v.en.ger}.`,
    why: "With <span class=\"jp\">すき・きらい</span> both work: <b>の</b> (more conversational) or こと." },
  jouzu: { nom: ["の"], ja: (v, n) => [`${n[0]}は ${v.o}`, "のが じょうずです。"], de: (v, n) => `${n[1]} kann gut ${v.de.inf}.`, en: (v, n) => `${n[2]} is good at ${v.en.ger}.`,
    why: "<span class=\"jp\">じょうず・へた・はやい</span> take <b>の</b>." },
  fun: { nom: ["の", "こと"], ja: v => [v.o, "のは たのしいです。"], de: v => `${cap(v.de.inf)} macht Spaß.`, en: v => `${cap(v.en.ger)} is fun.`,
    why: "With <span class=\"jp\">たのしい・むずかしい</span> both work: <b>の</b> or こと." },
  forgot: { nom: ["の"], ja: f => [f.o, "のを わすれました。"], de: f => `Ich habe vergessen, ${f.de}.`, en: f => `I forgot ${f.en}.`,
    why: "<span class=\"jp\">～のを わすれました</span> — only <b>の</b>." },
};
const cap = s => s[0].toUpperCase() + s.slice(1);

// ----- adjectives -----
const ADJ = [
  { a: "たかい", na: false, sa: "たかさ", mean: ["hoch, teuer", "high, expensive"], n: ["Höhe", "height"] },
  { a: "ながい", na: false, sa: "ながさ", mean: ["lang", "long"], n: ["Länge", "length"] },
  { a: "おもい", na: false, sa: "おもさ", mean: ["schwer", "heavy"], n: ["Gewicht", "weight"] },
  { a: "おおきい", na: false, sa: "おおきさ", mean: ["groß", "big"], n: ["Größe", "size"] },
  { a: "ひろい", na: false, sa: "ひろさ", mean: ["weit, geräumig", "wide, spacious"], n: ["Fläche, Weite", "area, width"] },
  { a: "ふかい", na: false, sa: "ふかさ", mean: ["tief", "deep"], n: ["Tiefe", "depth"] },
  { a: "はやい", na: false, sa: "はやさ", mean: ["schnell", "fast"], n: ["Geschwindigkeit", "speed"] },
  { a: "あつい", na: false, sa: "あつさ", mean: ["heiß", "hot"], n: ["Hitze", "heat"] },
  { a: "さむい", na: false, sa: "さむさ", mean: ["kalt", "cold"], n: ["Kälte", "cold"] },
  { a: "やさしい", na: false, sa: "やさしさ", mean: ["freundlich, sanft", "kind, gentle"], n: ["Freundlichkeit", "kindness"] },
  { a: "むずかしい", na: false, sa: "むずかしさ", mean: ["schwierig", "difficult"], n: ["Schwierigkeit", "difficulty"] },
  { a: "おもしろい", na: false, sa: "おもしろさ", mean: ["interessant", "interesting"], n: ["Reiz, das Interessante", "appeal"] },
  { a: "いい", na: false, sa: "よさ", irr: true, mean: ["gut", "good"], n: ["gute Seite, Vorzug", "good points"] },
  { a: "やすい", na: false, sa: "やすさ", mean: ["billig", "cheap"], n: ["Preiswertigkeit", "cheapness"] },
  { a: "あかい", na: false, sa: "あかさ", mean: ["rot", "red"], n: ["Röte", "redness"], noSa: true },
  { a: "おいしい", na: false, sa: "おいしさ", mean: ["lecker", "tasty"], n: ["Geschmack", "tastiness"] },
  { a: "ちいさい", na: false, sa: "ちいささ", mean: ["klein", "small"], n: ["Kleinheit", "smallness"], noSa: true },
  { a: "しずか", na: true, sa: "しずかさ", mean: ["ruhig", "quiet"], n: ["Ruhe", "quietness"] },
  { a: "べんり", na: true, sa: "べんりさ", mean: ["praktisch", "convenient"], n: ["Bequemlichkeit", "convenience"] },
  { a: "しんせつ", na: true, sa: "しんせつさ", mean: ["freundlich, hilfsbereit", "kind, helpful"], n: ["Hilfsbereitschaft", "kindness"] },
  { a: "きれい", na: true, sa: "きれいさ", trap: true, mean: ["schön, sauber", "pretty, clean"], n: ["Schönheit", "beauty"] },
  { a: "たいせつ", na: true, sa: "たいせつさ", mean: ["wichtig", "important"], n: ["Wichtigkeit", "importance"] },
  { a: "にぎやか", na: true, sa: "にぎやかさ", mean: ["belebt", "lively"], n: ["Lebendigkeit", "liveliness"] },
];
const MI = [
  { a: "たのしい", mi: "たのしみ", mean: ["lustig, schön", "fun"], n: ["Vorfreude", "something to look forward to"] },
  { a: "かなしい", mi: "かなしみ", mean: ["traurig", "sad"], n: ["Trauer", "sorrow"] },
  { a: "いたい", mi: "いたみ", mean: ["schmerzhaft", "painful"], n: ["Schmerz", "pain"] },
  { a: "あまい", mi: "あまみ", mean: ["süß", "sweet"], n: ["Süße", "sweetness"] },
];
// ます-stem used as a noun
const STEMS = [
  { m: "やすみます", n: "やすみ", mean: ["Pause, Urlaub, frei", "break, day off"] }, { m: "はなします", n: "はなし", mean: ["Gespräch, Geschichte", "talk, story"] },
  { m: "かえります", n: "かえり", mean: ["Rückweg, Heimweg", "the way home"] }, { m: "いきます", n: "いき", mean: ["Hinweg", "the way there"] },
  { m: "おわります", n: "おわり", mean: ["Ende", "end"] }, { m: "はじめます", n: "はじめ", mean: ["Anfang", "beginning"] },
  { m: "あそびます", n: "あそび", mean: ["Spiel", "play"] }, { m: "てつだいます", n: "てつだい", mean: ["Hilfe", "help"] },
  { m: "およぎます", n: "およぎ", mean: ["das Schwimmen", "swimming"] },
];

// ----- hand-written context sentences -----
// [answer] marks the gap; base = the word the learner starts from; t = rule
const CTX = [
  ["sa", "ふじさんの [たかさ]は 3776メートルです。", "たかい", "Die Höhe des Fuji beträgt 3776 Meter.", "The height of Mt Fuji is 3,776 m."],
  ["sa", "この かわの [ながさ]は どのくらいですか。", "ながい", "Wie lang ist dieser Fluss?", "How long is this river?"],
  ["sa", "ぞうの [おもさ]は 5トンぐらいです。", "おもい", "Ein Elefant wiegt etwa 5 Tonnen.", "An elephant weighs about 5 tonnes."],
  ["sa", "にほんの [ひろさ]は ドイツと だいたい おなじです。", "ひろい", "Japan ist ungefähr so groß wie Deutschland.", "Japan is about the same size as Germany."],
  ["sa", "しんかんせんの [はやさ]は じそく 300キロです。", "はやい", "Der Shinkansen fährt 300 km/h.", "The shinkansen's speed is 300 km/h."],
  ["sa", "にほんの なつの [あつさ]が きらいです。", "あつい", "Ich mag die Hitze im japanischen Sommer nicht.", "I don't like the heat of the Japanese summer."],
  ["sa", "さっぽろの ふゆの [さむさ]は たいへんです。", "さむい", "Die Kälte im Winter in Sapporo ist hart.", "The winter cold in Sapporo is tough."],
  ["sa", "この みずうみの [ふかさ]は 400メートルです。", "ふかい", "Dieser See ist 400 Meter tief.", "This lake is 400 m deep."],
  ["sa", "この くつの [おおきさ]は 26センチです。", "おおきい", "Diese Schuhe haben Größe 26 cm.", "These shoes are size 26 cm."],
  ["sa", "かのじょの [やさしさ]が すきです。", "やさしい", "Ich mag ihre Freundlichkeit.", "I like her kindness."],
  ["sa", "かんじの [むずかしさ]が わかりました。", "むずかしい", "Ich habe verstanden, wie schwer Kanji sind.", "I've understood how hard kanji are."],
  ["sa", "にほんごの [おもしろさ]が わかりました。", "おもしろい", "Ich habe verstanden, was an Japanisch so interessant ist.", "I've come to see what makes Japanese interesting."],
  ["sa", "この まちの [よさ]が わかりました。", "いい", "Ich habe die guten Seiten dieser Stadt kennengelernt.", "I've come to see what's good about this town."],
  ["sana", "この まちの [しずかさ]が すきです。", "しずか", "Ich mag die Ruhe dieser Stadt.", "I like the quietness of this town."],
  ["sana", "にほんの でんしゃの [べんりさ]が すきです。", "べんり", "Ich mag, wie praktisch die Züge in Japan sind.", "I like how convenient Japanese trains are."],
  ["sana", "ホテルの ひとの [しんせつさ]が よかったです。", "しんせつ", "Die Hilfsbereitschaft der Hotelleute war toll.", "The hotel staff's kindness was great."],
  ["sana", "この うみの [きれいさ]が すきです。", "きれい", "Ich mag, wie schön dieses Meer ist.", "I love how beautiful this sea is."],
  ["sana", "けんこうの [たいせつさ]が わかりました。", "たいせつ", "Ich habe verstanden, wie wichtig Gesundheit ist.", "I've understood how important health is."],
  ["mi", "らいしゅうの りょこうが [たのしみ]です。", "たのしい", "Ich freue mich auf die Reise nächste Woche.", "I'm looking forward to next week's trip."],
  ["mi", "まだ [いたみ]が ありますか。", "いたい", "Haben Sie noch Schmerzen?", "Do you still have pain?"],
  ["mi", "この りんごは [あまみ]が あります。", "あまい", "Dieser Apfel ist schön süß.", "This apple has a nice sweetness."],
  ["stem", "あしたは しごとが [やすみ]です。", "やすみます", "Morgen habe ich frei.", "I'm off work tomorrow."],
  ["stem", "かいしゃの [かえり]に スーパーへ いきます。", "かえります", "Auf dem Heimweg von der Firma gehe ich in den Supermarkt.", "On my way home from work I go to the supermarket."],
  ["stem", "[いき]は バスで、かえりは タクシーです。", "いきます", "Hin mit dem Bus, zurück mit dem Taxi.", "There by bus, back by taxi."],
  ["stem", "えいがの [おわり]が すきです。", "おわります", "Ich mag das Ende des Films.", "I like the ending of the film."],
  ["stem", "おもしろい [はなし]を ききました。", "はなします", "Ich habe eine interessante Geschichte gehört.", "I heard an interesting story."],
  ["stem", "こどもは [あそび]が だいすきです。", "あそびます", "Kinder lieben das Spielen.", "Children love playing."],
  ["stem", "4がつの [はじめ]に にほんへ きました。", "はじめます", "Ich bin Anfang April nach Japan gekommen.", "I came to Japan at the beginning of April."],
  ["stem", "ははの [てつだい]を しました。", "てつだいます", "Ich habe meiner Mutter geholfen.", "I helped my mother."],
  ["kata", "この かんじの [よみかた]を おしえて ください。", "よみます", "Bitte sagen Sie mir, wie man dieses Kanji liest.", "Please tell me how to read this kanji."],
  ["kata", "この パソコンの [つかいかた]が わかりません。", "つかいます", "Ich weiß nicht, wie man diesen Computer benutzt.", "I don't know how to use this computer."],
  ["kata", "すしの [つくりかた]を ならいました。", "つくります", "Ich habe gelernt, wie man Sushi macht.", "I learned how to make sushi."],
  ["kata", "こどもに じてんしゃの [のりかた]を おしえました。", "のります", "Ich habe einem Kind beigebracht, wie man Fahrrad fährt.", "I taught a child how to ride a bike."],
  ["kata", "はしの [つかいかた]が じょうずですね。", "つかいます", "Sie können gut mit Stäbchen umgehen.", "You're good with chopsticks."],
  ["kata", "てがみの [かきかた]を ならいました。", "かきます", "Ich habe gelernt, wie man Briefe schreibt.", "I learned how to write letters."],
  ["kata", "あの ひとの [はなしかた]が すきです。", "はなします", "Ich mag, wie diese Person spricht.", "I like the way that person talks."],
  ["pron", "この かばんは たかいですね。もっと [やすいの]は ありませんか。", "やすい", "Diese Tasche ist teuer. Haben Sie keine billigere?", "This bag is expensive. Do you have a cheaper one?"],
  ["pron", "あかい かさと くろい かさが あります。[あかいの]を ください。", "あかい", "Es gibt einen roten und einen schwarzen Schirm. Den roten, bitte.", "There's a red and a black umbrella. The red one, please."],
  ["pron", "しずかな へやと にぎやかな へや… わたしは [しずかなの]が いいです。", "しずか", "Ein ruhiges und ein belebtes Zimmer … ich hätte lieber das ruhige.", "A quiet room and a lively one … I'd prefer the quiet one."],
  ["pron", "この シャツは ちいさいです。[おおきいの]は ありますか。", "おおきい", "Dieses Hemd ist klein. Haben Sie ein größeres?", "This shirt is small. Do you have a bigger one?"],
  ["pron", "りんごを かいます。[おいしいの]を みっつ ください。", "おいしい", "Ich kaufe Äpfel. Drei leckere, bitte.", "I'm buying apples. Three good ones, please."],
  ["pron", "きれいな はこと ふるい はこ… [きれいなの]を つかいます。", "きれい", "Eine schöne und eine alte Schachtel … ich nehme die schöne.", "A pretty box and an old one … I'll use the pretty one."],
].map(([t, s, base, de, en]) => { const m = s.match(/^(.*)\[(.+?)\](.*)$/); return { t, pre: m[1], ans: m[2], post: m[3], base, de, en }; });

// "Talk about you": you type only the activity, the frame is given
const YOU = [
  { q: "しゅみは なんですか。", pre: "しゅみは ", post: "ことです。", ex: "ほんを よむ", help: ["ほんを", "おんがくを", "りょうりを", "よむ", "きく", "つくる", "およぐ"] },
  { q: "なにが できますか。", pre: "わたしは ", post: "ことが できます。", ex: "ピアノを ひく", help: ["ピアノを", "にほんごを", "じてんしゃに", "ひく", "はなす", "のる", "およぐ"] },
  { q: "なにを するのが すきですか。", pre: "", post: "のが すきです。", ex: "しゃしんを とる", help: ["しゃしんを", "えいがを", "テニスを", "とる", "みる", "する", "うたう"] },
  { q: "なにを するのが きらいですか。", pre: "", post: "のが きらいです。", ex: "そうじを する", help: ["そうじを", "あさ", "はやく", "する", "おきる", "まつ"] },
];

// ----- kana → kanji for display -----
const KANJI = {
  "ほん": "{本|ほん}", "てがみ": "{手紙|てがみ}", "にほんご": "{日本語|にほんご}", "おんがく": "{音楽|おんがく}", "うた": "{歌|うた}", "りょうり": "{料理|りょうり}", "しゃしん": "{写真|しゃしん}",
  "じてんしゃ": "{自転車|じてんしゃ}", "えいが": "{映画|えいが}", "えいご": "{英語|えいご}", "でんき": "{電気|でんき}", "くすり": "{薬|くすり}", "しゅくだい": "{宿題|しゅくだい}", "きっぷ": "{切符|きっぷ}",
  "はは": "{母|はは}", "でんわ": "{電話|でんわ}", "しゅみ": "{趣味|しゅみ}", "わたし": "{私|わたし}", "かわ": "{川|かわ}", "ぞう": "{象|ぞう}", "ふじさん": "{富士山|ふじさん}", "みずうみ": "{湖|みずうみ}",
  "くつ": "{靴|くつ}", "なつ": "{夏|なつ}", "ふゆ": "{冬|ふゆ}", "まち": "{町|まち}", "でんしゃ": "{電車|でんしゃ}", "ひと": "{人|ひと}", "うみ": "{海|うみ}", "けんこう": "{健康|けんこう}", "りょこう": "{旅行|りょこう}",
  "しごと": "{仕事|しごと}", "かいしゃ": "{会社|かいしゃ}", "こども": "{子|こ}ども", "かんじ": "{漢字|かんじ}", "にほん": "{日本|にほん}", "さっぽろ": "{札幌|さっぽろ}", "しんかんせん": "{新幹線|しんかんせん}",
  "らいしゅう": "{来週|らいしゅう}", "へや": "{部屋|へや}", "はこ": "{箱|はこ}", "かさ": "{傘|かさ}", "あかい": "{赤|あか}い", "くろい": "{黒|くろ}い", "ふるい": "{古|ふる}い",
  "じそく": "{時速|じそく}", "あした": "{明日|あした}", "ならいました": "{習|なら}いました", "ききました": "{聞|き}きました", "わすれました": "{忘|わす}れました", "おしえました": "{教|おし}えました",
  "おしえて": "{教|おし}えて", "すき": "{好|す}き", "だいすき": "{大好|だいす}き", "きらい": "{嫌|きら}い", "じょうず": "{上手|じょうず}", "そうじ": "{掃除|そうじ}", "あさ": "{朝|あさ}", "はやく": "{早|はや}く",
  "たかい": "{高|たか}い", "たかさ": "{高|たか}さ", "ながい": "{長|なが}い", "ながさ": "{長|なが}さ", "おもい": "{重|おも}い", "おもさ": "{重|おも}さ", "おおきい": "{大|おお}きい", "おおきさ": "{大|おお}きさ",
  "ひろい": "{広|ひろ}い", "ひろさ": "{広|ひろ}さ", "ふかい": "{深|ふか}い", "ふかさ": "{深|ふか}さ", "はやい": "{速|はや}い", "はやさ": "{速|はや}さ", "あつい": "{暑|あつ}い", "あつさ": "{暑|あつ}さ",
  "さむい": "{寒|さむ}い", "さむさ": "{寒|さむ}さ", "やさしい": "{優|やさ}しい", "やさしさ": "{優|やさ}しさ", "むずかしい": "{難|むずか}しい", "むずかしさ": "{難|むずか}しさ", "おもしろい": "{面白|おもしろ}い",
  "おもしろさ": "{面白|おもしろ}さ", "よさ": "{良|よ}さ", "やすい": "{安|やす}い", "やすさ": "{安|やす}さ", "ちいさい": "{小|ちい}さい", "しずか": "{静|しず}か", "しずかさ": "{静|しず}かさ", "しずかな": "{静|しず}かな",
  "べんり": "{便利|べんり}", "べんりさ": "{便利|べんり}さ", "しんせつ": "{親切|しんせつ}", "しんせつさ": "{親切|しんせつ}さ", "たいせつ": "{大切|たいせつ}", "たいせつさ": "{大切|たいせつ}さ",
  "たのしい": "{楽|たの}しい", "たのしみ": "{楽|たの}しみ", "かなしい": "{悲|かな}しい", "かなしみ": "{悲|かな}しみ", "いたい": "{痛|いた}い", "いたみ": "{痛|いた}み", "あまい": "{甘|あま}い", "あまみ": "{甘|あま}み",
  "やすみ": "{休|やす}み", "やすみます": "{休|やす}みます", "はなし": "{話|はなし}", "かえり": "{帰|かえ}り", "いき": "{行|い}き", "おわり": "{終|お}わり", "おわります": "{終|お}わります", "はじめ": "{始|はじ}め",
  "はじめます": "{始|はじ}めます", "あそび": "{遊|あそ}び", "てつだい": "{手伝|てつだ}い", "てつだいます": "{手伝|てつだ}います", "およぎ": "{泳|およ}ぎ",
};
for (const v of VERBS) {
  KANJI[v.m] = v.km; KANJI[v.d] = v.kd;
  if (v.kata) { const k = KATA_IRREG[v.m] || v.stem + "かた"; KANJI[k] = KATA_IRREG[v.m] ? "{仕方|しかた}" : v.km.replace(/ます$/, "") + "{方|かた}"; }
}

// settings read by the shared engine
const VOCAB = [];
const LESSON = { key: "nouns.v1", name: "こと・の・さ Dojo", title: "こと・の・さ道場", sub: "", confetti: ["🎉", "✨", "📏", "🧩", "⭐", "📖"], memoryGroups: {}, builderExtra: () => [], whyWrong: () => "" };
