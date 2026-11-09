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

## Run locally

```sh
python3 -m http.server 8000   # then open http://127.0.0.1:8000
```

## Publish

`.github/workflows/pages.yml` deploys the repository root on every push. One-time setup: **Settings → Pages → Source: GitHub Actions**.

Alternatively, choose **Deploy from a branch** with the branch's `/ (root)` folder. The site is plain static files, so either way works.
