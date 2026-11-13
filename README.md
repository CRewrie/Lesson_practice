# Lesson Practice

Interactive, game-style practice pages for Japanese textbook lessons (Minna no Nihongo, German edition). Plain HTML/CSS/JS with no build step, published with GitHub Pages. The look follows [Language_Quiz](https://github.com/CRewrie/Language_Quiz).

## Lektion 10 — あります・います (`lesson10/`)

A 13-step path. Every step gives XP and up to 3 stars:

1. **Vocabulary cards**: flip cards with emoji, audio, and German/English meanings. Words you know turn green.
2. **Grammar in pictures**: あります vs います, `PLACE に N が`, `N は PLACE に`, positions, や…など, なにも/だれも.
3. **あります or います?**: a 45-second sorting rush with combos.
4. **Where is it?**: read a picture and pick the position, or tap where the sentence says the thing goes.
5. **Explore room & town**: tap things to hear where they are (some open up!), then a scavenger hunt.
6. **Sentence builder**: put word tiles in order, with two decoy tiles.
7. **Memory match**: match pictures with words.
8. **Spell it**: type in kana or romaji (romaji is converted).
9. **Asia Store role-play**: the lesson's conversation, then work as a clerk and help customers.
10. **Grammar check**: tricky particle questions, with explanations for every wrong option.
11. **My worksheet F㊴**: feedback on the handwritten worksheet answers.
12. **Talk about you**: worksheet part <5>, with hints as you answer.
13. **Boss exam**: 20 mixed questions. Score 80 % to win.

Audio uses the browser's Japanese text-to-speech voice. Progress is saved in `localStorage`.

## Lektion 11 — いくつ・どのくらい (`lesson11/`)

Counters and lengths of time, as a 14-step path:

1. **Vocabulary cards**: all lesson words, including ひとつ…とお and the family words.
2. **Grammar & counter tables**: tap any reading to hear it. Irregular readings are red.
3. **Which counter?**: a 45-second rush between ～つ, ～にん, ～まい and ～だい.
4. **Count it!**: count the pictures and pick or type the reading (よにん, やっつ, …).
5. **Order up!**: café and post-office customers order; fill the tray. Later rounds are listening only.
6. **How long?**: hours, minutes, days, weeks, months and years — read, hear and type.
7. **Sentence builder**: the decoy tiles tempt you to put a particle after the number.
8. **Memory match** and 9. **Spell it**.
10. **Post office role-play**: small talk with the caretaker, then send a parcel to Australia.
11. **Particle or ✕?**: where a particle goes, and where nothing goes.
12. **My worksheets**: feedback on the handwritten pages.
13. **Talk about you**: family, time in Japan, travel time.
14. **Boss exam**.

## しつもん道場 — Question Dojo (`questions/`)

All the question words (なに, だれ, どこ, いつ, どうして, どれ, どの, どんな, どう, いくら, いくつ, どのくらい, the なん + counter family, the polite versions, なにも / だれも) in one trainer. It is built around active recall rather than a fixed path:

- **Every answer is typed.** There are no options to pick from. Romaji turns into kana while typing, and the particles を・は・へ may be typed as they sound (o, wa, e).
- **Spaced repetition.** Each card sits in a Leitner box and comes back after 1, 3, 7, 14 and 30 days. A missed card returns a few cards later in the same session until it is answered from memory.
- **Five card types, mixed.** Meaning → word, fill the gap, ask for the underlined part of an answer, translate a whole question, and dictation. The harder types open a few at a time once a word's recall card has been answered right twice.
- **New words** are shown once, typed once, and tested two cards later. Four per session.
- **Interview game.** A stranger with twelve hidden facts: type your own questions to uncover them.
- **Question map.** The system on one page: the particle rule, こ-そ-あ-ど, なに vs なん, polite pairs.

Append `?day=3` to the URL to pretend it is three days later (useful for testing the schedule).

## Code layout

- `assets/core.js`: the shared engine (progress, audio, romaji → kana typing, kanji with furigana, flashcards, sentence builder, memory, typing, multiple choice, router).
- `assets/style.css`: shared styles.
- `lessonNN/data.js`: the lesson's content and its `LESSON` settings.
- `lessonNN/app.js`: the lesson's path (`MODES`) and its own games. It ends with `boot()`.
- `questions/`: the Question Dojo. It uses the shared helpers but has its own dashboard and scheduler.

## Run locally

```sh
python3 -m http.server 8000   # then open http://127.0.0.1:8000
```

## Publish

`.github/workflows/pages.yml` deploys the repository root on every push. One-time setup: **Settings → Pages → Source: GitHub Actions**.

Alternatively, choose **Deploy from a branch** with the branch's `/ (root)` folder. The site is plain static files, so either way works.
