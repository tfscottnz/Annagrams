const els = {
  title: document.getElementById('puzzleTitle'),
  rule: document.getElementById('puzzleRule'),
  foundCount: document.getElementById('foundCount'),
  totalCount: document.getElementById('totalCount'),
  progressBars: document.getElementById('progressBars'),
  currentWord: document.getElementById('currentWord'),
  letterTiles: document.getElementById('letterTiles'),
  message: document.getElementById('message'),
  wordSections: document.getElementById('wordSections'),
  modeButtons: document.getElementById('modeButtons'),
  submit: document.getElementById('submitButton'),
  backspace: document.getElementById('backspaceButton'),
  clear: document.getElementById('clearButton'),
  shuffle: document.getElementById('shuffleButton'),
  hint: document.getElementById('hintButton'),
  reveal: document.getElementById('revealButton'),
  daily: document.getElementById('dailyButton'),
  newPuzzle: document.getElementById('newPuzzleButton'),
  help: document.getElementById('helpButton'),
  helpDialog: document.getElementById('helpDialog'),
  closeHelp: document.getElementById('closeHelpButton'),
  offlineBadge: document.getElementById('offlineBadge'),
  celebrationLayer: document.getElementById('celebrationLayer')
};

const STORAGE_PREFIX = 'annagrams-progress-v2:';
const SIZE_STORAGE_KEY = 'annagrams-selected-size-v2';
const MIN_WORD_LENGTH = 3;
let puzzles = [];
let puzzle = null;
let selectedSize = Number(localStorage.getItem(SIZE_STORAGE_KEY)) || 6;
let answerSet = new Set();
let found = new Set();
let revealMissing = false;
let tiles = [];
let current = [];
let hintCount = 0;

let celebrationTimer = null;

const CELEBRATION_MESSAGES = [
  'All words found. Splendid!',
  'Puzzle complete. Tiny fireworks deployed!',
  'The word-garden is harvested!',
  'A full set. Ann wins the alphabet!',
  'Complete. The letters surrender!'
];

const CELEBRATION_TYPES = ['confetti', 'fireworks', 'sparklers', 'party', 'bubbles'];
const CELEBRATION_COLOURS = ['#2f6f73', '#d59d2a', '#c76545', '#7f5aa2', '#3f7fb7', '#e7c766', '#f28ab2'];

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clearCelebration() {
  if (!els.celebrationLayer) return;
  window.clearTimeout(celebrationTimer);
  els.celebrationLayer.className = 'celebration-layer';
  els.celebrationLayer.removeAttribute('data-message');
  els.celebrationLayer.innerHTML = '';
}

function addPiece(className, styles = {}, text = '') {
  const piece = document.createElement('span');
  piece.className = className;
  piece.textContent = text;
  for (const [name, value] of Object.entries(styles)) piece.style.setProperty(name, value);
  els.celebrationLayer.appendChild(piece);
  return piece;
}

function makeConfetti() {
  for (let i = 0; i < 88; i++) {
    addPiece('celebration-piece confetti', {
      '--x': `${randomBetween(0, 100)}vw`,
      '--delay': `${randomBetween(0, 0.75)}s`,
      '--duration': `${randomBetween(2.1, 3.7)}s`,
      '--spin': `${randomBetween(240, 980)}deg`,
      '--piece-color': randomChoice(CELEBRATION_COLOURS)
    });
  }
}

function makePartyRain() {
  const icons = ['🎉', '✨', '⭐', '🥳', '🎈', '🌟'];
  for (let i = 0; i < 42; i++) {
    addPiece('celebration-piece party', {
      '--x': `${randomBetween(0, 96)}vw`,
      '--delay': `${randomBetween(0, 0.65)}s`,
      '--duration': `${randomBetween(2.2, 3.6)}s`,
      '--spin': `${randomBetween(-220, 220)}deg`,
      '--size': `${randomBetween(1.2, 2.2)}rem`
    }, randomChoice(icons));
  }
}

function makeBubbles() {
  for (let i = 0; i < 44; i++) {
    addPiece('celebration-piece bubble', {
      '--x': `${randomBetween(0, 96)}vw`,
      '--delay': `${randomBetween(0, 0.9)}s`,
      '--duration': `${randomBetween(2.2, 4.3)}s`,
      '--size': `${randomBetween(18, 54)}px`,
      '--drift': `${randomBetween(-80, 80)}px`
    });
  }
}

function makeFireworks() {
  for (let burst = 0; burst < 7; burst++) {
    const holder = document.createElement('span');
    holder.className = 'firework-burst';
    holder.style.setProperty('--x', `${randomBetween(14, 86)}vw`);
    holder.style.setProperty('--y', `${randomBetween(14, 56)}vh`);
    els.celebrationLayer.appendChild(holder);
    const particles = 22;
    const colour = randomChoice(CELEBRATION_COLOURS);
    for (let i = 0; i < particles; i++) {
      const p = document.createElement('span');
      p.className = 'firework-particle';
      p.style.setProperty('--angle', `${(360 / particles) * i}deg`);
      p.style.setProperty('--distance', `${randomBetween(64, 138)}px`);
      p.style.setProperty('--delay', `${burst * 0.18}s`);
      p.style.setProperty('--piece-color', i % 3 === 0 ? randomChoice(CELEBRATION_COLOURS) : colour);
      holder.appendChild(p);
    }
  }
}

function makeSparklers() {
  const rays = 110;
  for (let i = 0; i < rays; i++) {
    addPiece('sparkler-dot', {
      '--angle': `${randomBetween(0, 360)}deg`,
      '--distance': `${randomBetween(60, 260)}px`,
      '--delay': `${randomBetween(0, 0.85)}s`,
      '--piece-color': randomChoice(['#fff6a5', '#ffd166', '#ffffff', '#d59d2a'])
    });
  }
}

function launchCelebration() {
  if (!els.celebrationLayer) return;
  clearCelebration();
  const type = randomChoice(CELEBRATION_TYPES);
  const message = randomChoice(CELEBRATION_MESSAGES);
  els.celebrationLayer.dataset.message = message;
  els.celebrationLayer.className = `celebration-layer show ${type}`;

  if (type === 'confetti') makeConfetti();
  else if (type === 'fireworks') makeFireworks();
  else if (type === 'sparklers') makeSparklers();
  else if (type === 'bubbles') makeBubbles();
  else makePartyRain();

  celebrationTimer = window.setTimeout(clearCelebration, 4300);
}

function todayIndex(count) {
  const today = new Date();
  const stamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const day = Math.floor(stamp / 86400000);
  return ((day % count) + count) % count;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normaliseWord(word) {
  return word.trim().toLowerCase();
}

function puzzleSize(item) {
  return Number(item.size || item.letters.length);
}

function canBuildFromLetters(word, letters) {
  const counts = {};
  for (const ch of letters.toLowerCase()) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of word.toLowerCase()) {
    if (!counts[ch]) return false;
    counts[ch] -= 1;
  }
  return true;
}

function lengthsForCurrentPuzzle() {
  if (!puzzle) return [];
  const max = puzzleSize(puzzle);
  const lengths = [];
  for (let len = MIN_WORD_LENGTH; len <= max; len++) lengths.push(len);
  return lengths;
}

function groupedAnswers() {
  const groups = {};
  for (const len of lengthsForCurrentPuzzle()) groups[len] = [];
  for (const word of puzzle.answers) {
    if (groups[word.length]) groups[word.length].push(word);
  }
  for (const len of Object.keys(groups)) groups[len].sort();
  return groups;
}

function puzzlesForSize(size) {
  return puzzles.filter(item => puzzleSize(item) === size);
}

function availableSizes() {
  return [...new Set(puzzles.map(puzzleSize))].sort((a, b) => a - b);
}

function dailyPuzzleForSize(size) {
  const list = puzzlesForSize(size);
  return list[todayIndex(list.length)] || puzzles[0];
}

function saveProgress() {
  if (!puzzle) return;
  const data = { found: [...found], hintCount, revealMissing };
  localStorage.setItem(STORAGE_PREFIX + puzzle.id, JSON.stringify(data));
}

function loadProgress() {
  found = new Set();
  revealMissing = false;
  hintCount = 0;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + puzzle.id);
    if (!raw) return;
    const data = JSON.parse(raw);
    found = new Set((data.found || []).filter(word => answerSet.has(word)));
    hintCount = Number(data.hintCount || 0);
    revealMissing = Boolean(data.revealMissing);
  } catch (_) {
    found = new Set();
  }
}

function preparePuzzle(nextPuzzle) {
  const size = puzzleSize(nextPuzzle);
  const answers = [...new Set(nextPuzzle.answers.map(normaliseWord))]
    .filter(word => word.length >= MIN_WORD_LENGTH && word.length <= size && canBuildFromLetters(word, nextPuzzle.letters))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));

  return {
    ...nextPuzzle,
    size,
    letters: nextPuzzle.letters.toUpperCase(),
    answers
  };
}

function setPuzzle(nextPuzzle, message = '') {
  puzzle = preparePuzzle(nextPuzzle);
  selectedSize = puzzle.size;
  localStorage.setItem(SIZE_STORAGE_KEY, String(selectedSize));
  answerSet = new Set(puzzle.answers);
  tiles = shuffleArray(puzzle.letters.split('')).map((letter, index) => ({ letter, index, used: false }));
  current = [];
  loadProgress();
  render();
  setMessage(message || `New ${puzzle.size}-letter puzzle: ${puzzle.title}.`, 'good');
}

function render() {
  if (!puzzle) return;
  els.title.textContent = `${puzzle.title} · ${puzzle.size} letters`;
  els.rule.textContent = `Make words of 3 to ${puzzle.size} letters. Use each tile at most once.`;
  els.foundCount.textContent = found.size;
  els.totalCount.textContent = puzzle.answers.length;
  els.currentWord.textContent = current.map(t => t.letter).join('');
  renderModeButtons();
  renderTiles();
  renderProgress();
  renderWordSections();
  els.submit.disabled = current.length < MIN_WORD_LENGTH;
  els.backspace.disabled = current.length === 0;
  els.clear.disabled = current.length === 0;
}

function renderModeButtons() {
  els.modeButtons.innerHTML = '';
  for (const size of availableSizes()) {
    const count = puzzlesForSize(size).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-button' + (size === selectedSize ? ' active' : '');
    button.textContent = `${size} letters`;
    button.setAttribute('aria-pressed', String(size === selectedSize));
    button.title = `${count} puzzles`;
    button.addEventListener('click', () => chooseSize(size));
    els.modeButtons.appendChild(button);
  }
}

function renderTiles() {
  els.letterTiles.innerHTML = '';
  els.letterTiles.style.setProperty('--tile-count', String(puzzle.size));
  for (const tile of tiles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile' + (tile.used ? ' used' : '');
    button.textContent = tile.letter;
    button.disabled = tile.used;
    button.setAttribute('aria-label', `Letter ${tile.letter}`);
    button.addEventListener('click', () => chooseTile(tile.index));
    els.letterTiles.appendChild(button);
  }
}

function renderProgress() {
  const groups = groupedAnswers();
  els.progressBars.innerHTML = '';
  for (const len of lengthsForCurrentPuzzle()) {
    const total = groups[len].length;
    const got = groups[len].filter(word => found.has(word)).length;
    const row = document.createElement('div');
    row.className = 'progress-row';
    row.innerHTML = `
      <strong>${len} letters</strong>
      <span class="track"><span class="fill" style="width: ${total ? (got / total) * 100 : 0}%"></span></span>
      <span>${got}/${total}</span>
    `;
    els.progressBars.appendChild(row);
  }
}

function renderWordSections() {
  const groups = groupedAnswers();
  els.wordSections.innerHTML = '';
  for (const len of lengthsForCurrentPuzzle()) {
    const section = document.createElement('section');
    section.className = 'card word-section';
    const got = groups[len].filter(word => found.has(word)).length;
    section.innerHTML = `<h3><span>${len}-letter words</span><span>${got}/${groups[len].length}</span></h3>`;
    const list = document.createElement('div');
    list.className = 'word-list';
    for (const word of groups[len]) {
      const chip = document.createElement('span');
      const show = found.has(word) || revealMissing;
      chip.className = 'word-chip' + (show ? '' : ' hidden');
      chip.textContent = show ? word : '•'.repeat(len);
      list.appendChild(chip);
    }
    section.appendChild(list);
    els.wordSections.appendChild(section);
  }
}

function setMessage(text, kind = '') {
  els.message.textContent = text;
  els.message.className = 'message' + (kind ? ` ${kind}` : '');
}

function chooseTile(index) {
  const tile = tiles.find(t => t.index === index);
  if (!tile || tile.used) return;
  tile.used = true;
  current.push(tile);
  render();
}

function clearCurrent() {
  for (const tile of current) tile.used = false;
  current = [];
  render();
}

function backspace() {
  const tile = current.pop();
  if (tile) tile.used = false;
  render();
}

function submitCurrent() {
  const word = normaliseWord(current.map(t => t.letter).join(''));
  if (word.length < MIN_WORD_LENGTH) {
    setMessage('Words need at least three letters.', 'bad');
    return;
  }
  if (!answerSet.has(word)) {
    setMessage(`“${word.toUpperCase()}” is not in this puzzle.`, 'bad');
    return;
  }
  if (found.has(word)) {
    setMessage(`Already found: ${word.toUpperCase()}.`, 'bad');
    clearCurrent();
    return;
  }
  found.add(word);
  clearCurrent();
  saveProgress();
  if (found.size === puzzle.answers.length) {
    setMessage('Complete! The whole word-garden is harvested.', 'good');
    launchCelebration();
  } else if (word.length === puzzle.size) {
    setMessage(`Lovely: ${word.toUpperCase()} is a full-length word.`, 'good');
  } else {
    setMessage(`Good word: ${word.toUpperCase()}.`, 'good');
  }
  render();
}

function shuffleTiles() {
  const unusedLetters = tiles.filter(t => !t.used).map(t => t.letter);
  const shuffled = shuffleArray(unusedLetters);
  let k = 0;
  for (const tile of tiles) {
    if (!tile.used) tile.letter = shuffled[k++];
  }
  render();
}

function giveHint() {
  const missing = puzzle.answers.filter(word => !found.has(word));
  if (!missing.length) {
    setMessage('No hints left. You have found everything.', 'good');
    return;
  }
  const longest = missing.filter(word => word.length === puzzle.size);
  const pool = longest.length ? longest : missing;
  const word = pool[Math.floor(Math.random() * pool.length)];
  hintCount += 1;
  saveProgress();
  setMessage(`Hint ${hintCount}: ${word.length} letters, starts with ${word[0].toUpperCase()}.`, 'good');
}

function revealAll() {
  revealMissing = true;
  saveProgress();
  render();
  setMessage('Missing words revealed.', 'good');
}

function chooseSize(size) {
  const next = dailyPuzzleForSize(size);
  setPuzzle(next, `${size}-letter mode selected. Today’s ${size}-letter puzzle is ready.`);
}

function pickRandomPuzzle() {
  const choices = puzzlesForSize(selectedSize).filter(p => !puzzle || p.id !== puzzle.id);
  const next = choices[Math.floor(Math.random() * choices.length)] || dailyPuzzleForSize(selectedSize);
  setPuzzle(next, `Another ${selectedSize}-letter puzzle: ${next.title}.`);
}

async function loadPuzzles() {
  const response = await fetch('puzzles.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load puzzles: ${response.status}`);
  puzzles = await response.json();
  if (!Array.isArray(puzzles) || puzzles.length === 0) throw new Error('No puzzles found.');
  puzzles = puzzles.map(preparePuzzle).filter(p => p.answers.length > 0);
  const sizes = availableSizes();
  if (!sizes.includes(selectedSize)) selectedSize = sizes.includes(6) ? 6 : sizes[0];
  setPuzzle(dailyPuzzleForSize(selectedSize), `Today’s ${selectedSize}-letter puzzle is ready.`);
}

function wireEvents() {
  els.submit.addEventListener('click', submitCurrent);
  els.backspace.addEventListener('click', backspace);
  els.clear.addEventListener('click', clearCurrent);
  els.shuffle.addEventListener('click', shuffleTiles);
  els.hint.addEventListener('click', giveHint);
  els.reveal.addEventListener('click', revealAll);
  els.daily.addEventListener('click', () => setPuzzle(dailyPuzzleForSize(selectedSize), `Back to today’s ${selectedSize}-letter puzzle.`));
  els.newPuzzle.addEventListener('click', pickRandomPuzzle);
  els.help.addEventListener('click', () => els.helpDialog.showModal());
  els.closeHelp.addEventListener('click', () => els.helpDialog.close());

  window.addEventListener('keydown', event => {
    if (!puzzle || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'enter') submitCurrent();
    else if (key === 'backspace') backspace();
    else if (key === 'escape') clearCurrent();
    else if (/^[a-z]$/.test(key)) {
      const tile = tiles.find(t => !t.used && t.letter.toLowerCase() === key);
      if (tile) chooseTile(tile.index);
    }
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('service-worker.js');
    els.offlineBadge.classList.add('ready');
  } catch (error) {
    console.warn('Service worker registration failed:', error);
  }
}

wireEvents();
loadPuzzles().catch(error => {
  console.error(error);
  els.title.textContent = 'Could not load puzzles';
  setMessage('Try serving the folder with a small web server, not by opening the file directly.', 'bad');
});
registerServiceWorker();
