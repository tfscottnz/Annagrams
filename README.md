# Annagrams v5

A small offline-friendly word game made for Ann.

## What v5 adds

- The puzzle heading no longer reveals the full-length answer. It now shows a neutral label like `9-letter puzzle 3 of 20`.
- Found and revealed words are tappable.
- Tapping a word opens a definition panel.
- Definition lookup uses the free Dictionary API only when a word is tapped.
- If the lookup fails or the phone is offline, the panel offers a Wiktionary link.
- The game itself remains offline-ready after first load.

## Deploy

Replace the existing repository files with the contents of this folder, then run:

```bash
git status
git add .
git commit -m "Update Annagrams to v5"
git push
```

Then test with a cache-busting URL:

```text
https://tfscottnz.github.io/Annagrams/?v=5
```

If the Android home-screen app still shows the old version, open the URL in Chrome, refresh twice, then remove and reinstall the home-screen icon.

## Dictionary notes

The puzzle answer lists were generated from a local Hunspell/SCOWL-derived English dictionary, then filtered for game use. Definitions are not bundled offline; they are looked up online on demand.
