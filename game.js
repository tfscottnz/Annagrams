const els = {
  title: document.getElementById('puzzleTitle'),
  rule: document.getElementById('puzzleRule'),
  scoreCount: document.getElementById('scoreCount'),
  scoreTarget: document.getElementById('scoreTarget'),
  foundSummary: document.getElementById('foundSummary'),
  targetSummary: document.getElementById('targetSummary'),
  acceptedSummary: document.getElementById('acceptedSummary'),
  progressBars: document.getElementById('progressBars'),
  currentWord: document.getElementById('currentWord'),
  letterTiles: document.getElementById('letterTiles'),
  message: document.getElementById('message'),
  wordSections: document.getElementById('wordSections'),
  modeButtons: document.getElementById('modeButtons'),
  difficultyButtons: document.getElementById('difficultyButtons'),
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
  celebrationLayer: document.getElementById('celebrationLayer'),
  definitionDialog: document.getElementById('definitionDialog'),
  definitionTitle: document.getElementById('definitionTitle'),
  definitionBody: document.getElementById('definitionBody'),
  definitionExternalLink: document.getElementById('definitionExternalLink'),
  closeDefinition: document.getElementById('closeDefinitionButton'),
  definitionDone: document.getElementById('definitionDoneButton')
};

const STORAGE_PREFIX = 'annagrams-progress-v5:';
const SIZE_STORAGE_KEY = 'annagrams-selected-size-v5';
const DIFFICULTY_STORAGE_KEY = 'annagrams-difficulty-v5';
const MIN_WORD_LENGTH = 3;
const POINTS = { 3: 1, 4: 2, 5: 4, 6: 7, 7: 11, 8: 16, 9: 25 };
const DIFFICULTIES = {
  gentle: { label: 'Gentle', targetScale: 0.72, scoreScale: 0.72, note: 'lower targets' },
  standard: { label: 'Standard', targetScale: 1, scoreScale: 1, note: 'balanced' },
  hard: { label: 'Hard', targetScale: 1.28, scoreScale: 1.28, note: 'higher targets' }
};

let puzzles = [];
let puzzle = null;
let selectedSize = Number(localStorage.getItem(SIZE_STORAGE_KEY)) || 6;
let difficultyKey = localStorage.getItem(DIFFICULTY_STORAGE_KEY) || 'standard';
let answerSet = new Set();
let found = new Set();
let revealMissing = false;
let completedDifficulties = new Set();
let tiles = [];
let current = [];
let hintCount = 0;
let celebrationTimer = null;

const CELEBRATION_MESSAGES = [
  'Target reached. Tiny fireworks deployed!',
  'Puzzle complete. The letters salute!',
  'Score target hit. Excellent word-work!',
  'Category targets conquered!',
  'Ann wins the alphabet!'
];
const CELEBRATION_TYPES = ['confetti', 'fireworks', 'sparklers', 'party', 'bubbles'];
const CELEBRATION_COLOURS = ['#2f6f73', '#d59d2a', '#c76545', '#7f5aa2', '#3f7fb7', '#e7c766', '#f28ab2'];
const DICTIONARY_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

function randomChoice(items) { return items[Math.floor(Math.random() * items.length)]; }
function randomBetween(min, max) { return min + Math.random() * (max - min); }
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
      '--x': `${randomBetween(0, 100)}vw`, '--delay': `${randomBetween(0, 0.75)}s`,
      '--duration': `${randomBetween(2.1, 3.7)}s`, '--spin': `${randomBetween(240, 980)}deg`,
      '--piece-color': randomChoice(CELEBRATION_COLOURS)
    });
  }
}
function makePartyRain() {
  const icons = ['🎉', '✨', '⭐', '🥳', '🎈', '🌟'];
  for (let i = 0; i < 42; i++) {
    addPiece('celebration-piece party', {
      '--x': `${randomBetween(0, 96)}vw`, '--delay': `${randomBetween(0, 0.65)}s`,
      '--duration': `${randomBetween(2.2, 3.6)}s`, '--spin': `${randomBetween(-220, 220)}deg`,
      '--size': `${randomBetween(1.2, 2.2)}rem`
    }, randomChoice(icons));
  }
}
function makeBubbles() {
  for (let i = 0; i < 44; i++) {
    addPiece('celebration-piece bubble', {
      '--x': `${randomBetween(0, 96)}vw`, '--delay': `${randomBetween(0, 0.9)}s`,
      '--duration': `${randomBetween(2.2, 4.3)}s`, '--size': `${randomBetween(18, 54)}px`,
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
  for (let i = 0; i < 110; i++) {
    addPiece('sparkler-dot', {
      '--angle': `${randomBetween(0, 360)}deg`, '--distance': `${randomBetween(60, 260)}px`,
      '--delay': `${randomBetween(0, 0.85)}s`, '--piece-color': randomChoice(['#fff6a5', '#ffd166', '#ffffff', '#d59d2a'])
    });
  }
}
function launchCelebration() {
  clearCelebration();
  const type = randomChoice(CELEBRATION_TYPES);
  els.celebrationLayer.dataset.message = randomChoice(CELEBRATION_MESSAGES);
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
  return ((Math.floor(stamp / 86400000) % count) + count) % count;
}
function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function normaliseWord(word) { return word.trim().toLowerCase(); }
function puzzleSize(item) { return Number(item.size || item.letters.length); }
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
  for (const word of puzzle.answers) if (groups[word.length]) groups[word.length].push(word);
  for (const len of Object.keys(groups)) groups[len].sort();
  return groups;
}
function puzzlesForSize(size) { return puzzles.filter(item => puzzleSize(item) === size); }
function availableSizes() { return [...new Set(puzzles.map(puzzleSize))].sort((a, b) => a - b); }
function puzzleNumberForSize(item) {
  const list = puzzlesForSize(puzzleSize(item));
  const index = list.findIndex(candidate => candidate.id === item.id);
  return index >= 0 ? index + 1 : 1;
}
function puzzleLabel(item = puzzle) {
  if (!item) return 'Puzzle';
  const size = puzzleSize(item);
  const count = puzzlesForSize(size).length;
  return `${size}-letter puzzle ${puzzleNumberForSize(item)} of ${count}`;
}
function dailyPuzzleForSize(size) {
  const list = puzzlesForSize(size);
  return list[todayIndex(list.length)] || puzzles[0];
}
function baseTargets() {
  const result = {};
  for (const [len, count] of Object.entries(puzzle.targets || {})) result[Number(len)] = Number(count);
  return result;
}
function targetsForDifficulty() {
  const scale = DIFFICULTIES[difficultyKey].targetScale;
  const groups = groupedAnswers();
  const result = {};
  for (const len of lengthsForCurrentPuzzle()) {
    const available = groups[len].length;
    const base = baseTargets()[len] || 0;
    if (!available || !base) continue;
    result[len] = Math.max(1, Math.min(available, Math.round(base * scale)));
  }
  return result;
}
function scoreTargetForDifficulty() {
  return Math.max(10, Math.round(Number(puzzle.scoreTarget || 10) * DIFFICULTIES[difficultyKey].scoreScale));
}
function wordPoints(word) {
  const len = word.length;
  let points = POINTS[len] || len;
  if (len === puzzle.size && puzzle.size >= 6) points += 20;
  if (len === 9) points += 30;
  return points;
}
function currentScore() { return [...found].reduce((total, word) => total + wordPoints(word), 0); }
function targetGroupsMet() {
  const groups = groupedAnswers();
  const targets = targetsForDifficulty();
  let met = 0;
  let total = 0;
  for (const len of Object.keys(targets)) {
    total += 1;
    const got = groups[len].filter(word => found.has(word)).length;
    if (got >= targets[len]) met += 1;
  }
  return { met, total };
}
function allTargetsMet() {
  const summary = targetGroupsMet();
  return summary.total > 0 && summary.met === summary.total;
}
function hasCompletedCurrentDifficulty() { return completedDifficulties.has(difficultyKey); }
function isCompleteNow() { return currentScore() >= scoreTargetForDifficulty() || allTargetsMet(); }
function saveProgress() {
  if (!puzzle) return;
  const data = { found: [...found], hintCount, revealMissing, completedDifficulties: [...completedDifficulties] };
  localStorage.setItem(STORAGE_PREFIX + puzzle.id, JSON.stringify(data));
}
function loadProgress() {
  found = new Set();
  revealMissing = false;
  hintCount = 0;
  completedDifficulties = new Set();
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + puzzle.id);
    if (!raw) return;
    const data = JSON.parse(raw);
    found = new Set((data.found || []).filter(word => answerSet.has(word)));
    hintCount = Number(data.hintCount || 0);
    revealMissing = Boolean(data.revealMissing);
    completedDifficulties = new Set(data.completedDifficulties || []);
  } catch (_) {
    found = new Set();
  }
}
function preparePuzzle(nextPuzzle) {
  const size = puzzleSize(nextPuzzle);
  const answers = [...new Set(nextPuzzle.answers.map(normaliseWord))]
    .filter(word => word.length >= MIN_WORD_LENGTH && word.length <= size && canBuildFromLetters(word, nextPuzzle.letters))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  return { ...nextPuzzle, size, letters: nextPuzzle.letters.toUpperCase(), answers };
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
  setMessage(message || `New ${puzzleLabel()}.`, 'good');
}

function render() {
  if (!puzzle) return;
  const score = currentScore();
  const scoreTarget = scoreTargetForDifficulty();
  const targetSummary = targetGroupsMet();
  els.title.textContent = puzzleLabel();
  els.rule.textContent = `Make words of 3 to ${puzzle.size} letters. Complete by score or by category targets.`;
  els.scoreCount.textContent = score;
  els.scoreTarget.textContent = scoreTarget;
  els.foundSummary.textContent = found.size;
  els.targetSummary.textContent = `${targetSummary.met}/${targetSummary.total}`;
  els.acceptedSummary.textContent = puzzle.answers.length;
  els.currentWord.textContent = current.map(t => t.letter).join('');
  renderModeButtons();
  renderDifficultyButtons();
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
    button.textContent = `${size}`;
    button.setAttribute('aria-label', `${size} letters`);
    button.setAttribute('aria-pressed', String(size === selectedSize));
    button.title = `${count} puzzles`;
    button.addEventListener('click', () => chooseSize(size));
    els.modeButtons.appendChild(button);
  }
}
function renderDifficultyButtons() {
  els.difficultyButtons.innerHTML = '';
  for (const [key, config] of Object.entries(DIFFICULTIES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'difficulty-button' + (key === difficultyKey ? ' active' : '');
    button.innerHTML = `${config.label}<br><small>${config.note}</small>`;
    button.setAttribute('aria-pressed', String(key === difficultyKey));
    button.addEventListener('click', () => chooseDifficulty(key));
    els.difficultyButtons.appendChild(button);
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
  const targets = targetsForDifficulty();
  els.progressBars.innerHTML = '';
  for (const len of lengthsForCurrentPuzzle()) {
    const available = groups[len].length;
    const target = targets[len] || 0;
    if (!available || !target) continue;
    const got = groups[len].filter(word => found.has(word)).length;
    const capped = Math.min(got, target);
    const width = target ? Math.min(100, (capped / target) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'progress-row' + (got >= target ? ' complete' : '');
    row.innerHTML = `
      <strong>${len} letters</strong>
      <span class="track"><span class="fill${got > target ? ' bonus' : ''}" style="width: ${width}%"></span></span>
      <span>${got}/${target}</span>
    `;
    els.progressBars.appendChild(row);
  }
}
function renderWordSections() {
  const groups = groupedAnswers();
  const targets = targetsForDifficulty();
  els.wordSections.innerHTML = '';
  for (const len of lengthsForCurrentPuzzle()) {
    const available = groups[len].length;
    if (!available) continue;
    const target = targets[len] || 0;
    const foundWords = groups[len].filter(word => found.has(word));
    const section = document.createElement('section');
    section.className = 'card word-section';
    section.innerHTML = `<h3><span>${len}-letter words</span><span>${foundWords.length}/${target || available}</span></h3>`;
    const note = document.createElement('p');
    note.className = 'section-note';
    note.textContent = target ? `${available} accepted. Target: ${target}.` : `${available} accepted. Bonus category.`;
    section.appendChild(note);
    const list = document.createElement('div');
    list.className = 'word-list';
    const wordsToShow = revealMissing ? groups[len] : foundWords;
    if (wordsToShow.length === 0) {
      const chip = document.createElement('span');
      chip.className = 'word-chip hidden';
      chip.textContent = '•'.repeat(len);
      list.appendChild(chip);
    } else {
      for (const word of wordsToShow) {
        const chip = document.createElement('button');
        const foundClass = found.has(word) ? ' points' : '';
        chip.type = 'button';
        chip.className = 'word-chip word-chip-button' + foundClass;
        chip.textContent = word;
        chip.title = `${wordPoints(word)} points. Tap for definition.`;
        chip.setAttribute('aria-label', `Look up ${word}`);
        chip.addEventListener('click', () => showDefinition(word));
        list.appendChild(chip);
      }
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
  if (word.length < MIN_WORD_LENGTH) { setMessage('Words need at least three letters.', 'bad'); return; }
  if (!answerSet.has(word)) { setMessage(`“${word.toUpperCase()}” is not accepted in this puzzle.`, 'bad'); return; }
  if (found.has(word)) { setMessage(`Already found: ${word.toUpperCase()}.`, 'bad'); clearCurrent(); return; }

  const wasComplete = hasCompletedCurrentDifficulty() || isCompleteNow();
  found.add(word);
  clearCurrent();
  const points = wordPoints(word);
  const score = currentScore();
  const target = scoreTargetForDifficulty();
  if (!wasComplete && isCompleteNow()) {
    completedDifficulties.add(difficultyKey);
    saveProgress();
    render();
    setMessage(`Target reached with ${word.toUpperCase()}! Score ${score}/${target}.`, 'good');
    launchCelebration();
    return;
  }
  saveProgress();
  if (word.length === puzzle.size) setMessage(`Full-length word: ${word.toUpperCase()}! +${points} points.`, 'good');
  else setMessage(`Good word: ${word.toUpperCase()}. +${points} points.`, 'good');
  render();
}
function shuffleTiles() {
  const unusedLetters = tiles.filter(t => !t.used).map(t => t.letter);
  const shuffled = shuffleArray(unusedLetters);
  let k = 0;
  for (const tile of tiles) if (!tile.used) tile.letter = shuffled[k++];
  render();
}
function giveHint() {
  const targets = targetsForDifficulty();
  const groups = groupedAnswers();
  let pool = [];
  for (const len of Object.keys(targets).map(Number).sort((a, b) => b - a)) {
    const missing = groups[len].filter(word => !found.has(word));
    const got = groups[len].filter(word => found.has(word)).length;
    if (missing.length && got < targets[len]) { pool = missing; break; }
  }
  if (!pool.length) pool = puzzle.answers.filter(word => !found.has(word));
  if (!pool.length) { setMessage('No hints left. You have found every accepted word.', 'good'); return; }
  const word = randomChoice(pool);
  hintCount += 1;
  saveProgress();
  setMessage(`Hint ${hintCount}: ${word.length} letters, starts with ${word[0].toUpperCase()}.`, 'good');
}
function revealAll() {
  revealMissing = true;
  saveProgress();
  render();
  setMessage('Accepted words revealed. No shame, just data for next round.', 'good');
}
function chooseSize(size) {
  const next = dailyPuzzleForSize(size);
  setPuzzle(next, `${size}-letter mode selected. Today’s ${size}-letter puzzle is ready.`);
}
function chooseDifficulty(key) {
  difficultyKey = key;
  localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficultyKey);
  render();
  const label = DIFFICULTIES[key].label;
  if (!hasCompletedCurrentDifficulty() && isCompleteNow()) {
    completedDifficulties.add(difficultyKey);
    saveProgress();
    setMessage(`${label} target already reached for this puzzle.`, 'good');
    launchCelebration();
  } else {
    setMessage(`${label} challenge selected.`, 'good');
  }
}
function pickRandomPuzzle() {
  const choices = puzzlesForSize(selectedSize).filter(p => !puzzle || p.id !== puzzle.id);
  const next = choices[Math.floor(Math.random() * choices.length)] || dailyPuzzleForSize(selectedSize);
  setPuzzle(next, `Another ${selectedSize}-letter puzzle is ready.`);
}
async function loadPuzzles() {
  const response = await fetch('puzzles.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load puzzles: ${response.status}`);
  puzzles = await response.json();
  if (!Array.isArray(puzzles) || puzzles.length === 0) throw new Error('No puzzles found.');
  puzzles = puzzles.map(preparePuzzle).filter(p => p.answers.length > 0);
  const sizes = availableSizes();
  if (!sizes.includes(selectedSize)) selectedSize = sizes.includes(6) ? 6 : sizes[0];
  if (!DIFFICULTIES[difficultyKey]) difficultyKey = 'standard';
  setPuzzle(dailyPuzzleForSize(selectedSize), `Today’s ${selectedSize}-letter puzzle is ready.`);
}

function wiktionaryUrl(word) {
  return `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
}
function setDefinitionBody(nodes) {
  els.definitionBody.innerHTML = '';
  for (const node of nodes) els.definitionBody.appendChild(node);
}
function makeParagraph(text, className = '') {
  const p = document.createElement('p');
  if (className) p.className = className;
  p.textContent = text;
  return p;
}
function makeDefinitionList(entries) {
  const container = document.createElement('div');
  let shown = 0;
  for (const entry of entries || []) {
    for (const meaning of entry.meanings || []) {
      const defs = (meaning.definitions || []).filter(item => item && item.definition).slice(0, 2);
      if (!defs.length) continue;
      const group = document.createElement('section');
      group.className = 'definition-group';
      const heading = document.createElement('h3');
      heading.textContent = meaning.partOfSpeech || 'definition';
      group.appendChild(heading);
      const list = document.createElement('ol');
      for (const def of defs) {
        const li = document.createElement('li');
        li.textContent = def.definition;
        if (def.example) {
          const example = document.createElement('p');
          example.className = 'definition-example';
          example.textContent = `Example: ${def.example}`;
          li.appendChild(example);
        }
        list.appendChild(li);
        shown += 1;
        if (shown >= 5) break;
      }
      group.appendChild(list);
      container.appendChild(group);
      if (shown >= 5) break;
    }
    if (shown >= 5) break;
  }
  if (!shown) container.appendChild(makeParagraph('No definition found in the lookup service.', 'definition-note'));
  return container;
}
async function showDefinition(word) {
  if (!els.definitionDialog) return;
  const cleanWord = normaliseWord(word);
  els.definitionTitle.textContent = cleanWord.toUpperCase();
  els.definitionExternalLink.href = wiktionaryUrl(cleanWord);
  setDefinitionBody([
    makeParagraph('Looking up definition…', 'definition-note'),
    makeParagraph('This uses the internet only when you tap a word.', 'definition-small')
  ]);
  els.definitionDialog.showModal();
  try {
    const response = await fetch(DICTIONARY_ENDPOINT + encodeURIComponent(cleanWord));
    if (!response.ok) throw new Error(`Dictionary lookup returned ${response.status}`);
    const data = await response.json();
    setDefinitionBody([
      makeDefinitionList(data),
      makeParagraph('Definitions are fetched online. The game itself still works offline.', 'definition-small')
    ]);
  } catch (error) {
    console.warn('Definition lookup failed:', error);
    setDefinitionBody([
      makeParagraph('Could not fetch a definition. The phone may be offline, or this word may not be in the lookup service.', 'definition-note'),
      makeParagraph('Use the Wiktionary link below if you want to check it manually.', 'definition-small')
    ]);
  }
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
  els.closeDefinition.addEventListener('click', () => els.definitionDialog.close());
  els.definitionDone.addEventListener('click', () => els.definitionDialog.close());

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
