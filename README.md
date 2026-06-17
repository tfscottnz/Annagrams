# Annagrams

A small offline-friendly word game made for Ann. It has no ads, accounts, trackers, or external JavaScript.

## What changed in version 3

- Added a random end-of-puzzle celebration when all words are found: confetti, fireworks, sparklers, party rain, or bubbles.
- The celebration is made with local CSS and JavaScript only: no libraries, no network calls, no ads.
- Version 2 improvements are still included.

## What changed in version 2

- Ann can choose 4, 5, 6, or 7 letters.
- The answer sections and progress bars adapt to the selected puzzle size.
- There are 78 starter puzzles:
  - 18 four-letter puzzles
  - 18 five-letter puzzles
  - 22 six-letter puzzles
  - 20 seven-letter puzzles
- The missing `clean` answer in the CANDLE puzzle has been fixed.

## Test locally

From inside this folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not just double-click `index.html`; install/offline features need a local web server or HTTPS.

## Put it on an Android phone

1. Upload these files to a GitHub repository.
2. Enable GitHub Pages from the repository settings.
3. Open the GitHub Pages URL in Chrome on Android.
4. Tap the three-dot menu.
5. Tap **Add to Home screen** or **Install app**.
6. Open the app once while online so the offline cache can fill.

## Updating an existing install

If Ann already installed the first version and it does not update straight away:

1. Open the game in Chrome.
2. Refresh it twice.
3. Reopen it from the home screen.

If the old version is stubborn, remove the home-screen icon and install it again from the GitHub Pages URL.

## Editing puzzles

Puzzle data lives in `puzzles.json`. Each puzzle has:

- `id`: unique puzzle id
- `title`: display name
- `letters`: the available letters
- `size`: the number of letters
- `answers`: accepted answers

The game filters invalid answers at load time, but it is still best to keep `puzzles.json` tidy.
