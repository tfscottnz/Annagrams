# Annagrams v4

A small offline-friendly word game for Ann.

## What changed in v4

- 4-, 5-, 6-, 7-, 8-, and 9-letter modes.
- Score targets instead of requiring every possible word.
- Word-length category targets with caps.
- Gentle, Standard, and Hard challenge levels.
- Larger generated puzzle pack: 137 puzzles and 8,000+ accepted answers.
- Continued offline PWA support for Android home-screen installation.
- Completion celebrations remain local CSS/JavaScript only.

## How the dictionary works

The bundled `puzzles.json` was generated from a local Hunspell English dictionary derived from SCOWL, then filtered for this game. The phone app does not run a full dictionary engine. It simply loads `puzzles.json`, which keeps the app fast and offline.

The design is deliberate: the game accepts many valid words but only requires a capped target for each length category. This prevents 8- and 9-letter puzzles from becoming a grim dictionary-mining expedition.

## Testing locally

From inside this folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Updating GitHub

From your local repository folder, copy/replace these files from this v4 folder:

```text
index.html
style.css
game.js
puzzles.json
manifest.json
service-worker.js
icons/
README.md
.nojekyll
tools/
docs/
```

Then run:

```bash
git status
git add .
git commit -m "Update Annagrams to v4"
git push
```

The GitHub Pages site should update after the push. If Android still shows the old version, open the site in Chrome, refresh twice, then reopen the home-screen app. If necessary, remove and reinstall the home-screen icon.

## Dictionary regeneration

If you have a Hunspell dictionary installed, you can regenerate `puzzles.json`:

```bash
python3 tools/generate_puzzles.py /usr/share/hunspell/en_US.dic > puzzles.json
```

The generation script is intentionally simple and inspectable.
