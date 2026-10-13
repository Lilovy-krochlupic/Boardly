/* ============================================================
   СОСТОЯНИЕ
============================================================ */
const STORAGE_KEY = 'board_games_v1';
const SCHEMA_VERSION = 4;

let state = {
  sound: true,
  theme: 'light',
  skin: 'classic',
  elo: 0,
  wins: 0,
  losses: 0,
  defeatedBots: {
    checkers: {},
    chess: {}
  },
  history: [],
  achievements: {},
  stats: {
    totalMoves: 0,
    winStreak: 0,
    bestWinStreak: 0,
    checkersWins: 0,
    chessWins: 0,
    queenPromotions: 0
  },
  progressCode: generateCode(),
  playerName: 'Игрок',
  version: SCHEMA_VERSION
};

/* ============================================================
   БОТЫ (10..500 Эло)
============================================================ */
const TRAINING_BOTS = [
  { id:'b1',  name:'Деревянный Джо',    elo: 10,  depth: 1, avatar:'🪵' },
  { id:'b2',  name:'Оловянный солдат',  elo: 50,  depth: 1, avatar:'🪖' },
  { id:'b3',  name:'Новичок Наташа',    elo: 90,  depth: 1, avatar:'🐣' },
  { id:'b4',  name:'Стажёр Семён',      elo: 130, depth: 1, avatar:'🎓' },
  { id:'b5',  name:'Прапорщик Паша',    elo: 175, depth: 2, avatar:'🎖️' },
  { id:'b6',  name:'Лейтенант Лев',     elo: 220, depth: 2, avatar:'⭐' },
  { id:'b7',  name:'Капитан Кира',      elo: 265, depth: 2, avatar:'🛡️' },
  { id:'b8',  name:'Майор Макс',        elo: 310, depth: 3, avatar:'⚔️' },
  { id:'b9',  name:'Полковник Пётр',    elo: 355, depth: 3, avatar:'🎯' },
  { id:'b10', name:'Генерал Гена',      elo: 400, depth: 3, avatar:'💂' },
  { id:'b11', name:'Маршал Мирон',      elo: 450, depth: 4, avatar:'🏅' },
  { id:'b12', name:'Гроссмейстер Гриша',elo: 500, depth: 4, avatar:'👑' }
];

const WORLD_ELO_THRESHOLD = 500;

/* ============================================================
   ДОСТИЖЕНИЯ
============================================================ */
const ACHIEVEMENTS = [
  { id:'first_win',    icon:'🌟', title:'Первая победа',     desc:'Победить любого бота' },
  { id:'streak_3',     icon:'🔥', title:'На волне',          desc:'3 победы подряд' },
  { id:'streak_5',     icon:'⚡', title:'Неудержимый',       desc:'5 побед подряд' },
  { id:'beat_300',     icon:'🎯', title:'Закалённый',        desc:'Победить бота с Эло ≥ 300' },
  { id:'beat_500',     icon:'👑', title:'Покоритель',        desc:'Победить Гроссмейстера' },
  { id:'world_rating', icon:'🌍', title:'В мировом рейтинге',desc:'Набрать 500 Эло' },
  { id:'all_checkers', icon:'⚫', title:'Мастер шашек',      desc:'Победить всех ботов в шашках' },
  { id:'all_chess',    icon:'♟️', title:'Мастер шахмат',     desc:'Победить всех ботов в шахматах' },
  { id:'marathon',     icon:'📚', title:'Марафонец',         desc:'Сыграть 25 партий' },
  { id:'veteran',      icon:'🎖️', title:'Ветеран',           desc:'Сыграть 100 партий' },
  { id:'queen_promo',  icon:'♛', title:'Королевский ход',    desc:'Провести превращение в ферзя' }
];

/* ============================================================
   ХРАНИЛИЩЕ
============================================================ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);

    // Если схема старая — сбрасываем во избежание несовместимостей
    if (parsed.version !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    state = Object.assign(state, parsed);
    if (!state.defeatedBots) state.defeatedBots = { checkers:{}, chess:{} };
    if (!state.defeatedBots.checkers) state.defeatedBots.checkers = {};
    if (!state.defeatedBots.chess) state.defeatedBots.chess = {};
    if (!state.history) state.history = [];
    if (!state.achievements) state.achievements = {};
    if (!state.stats) state.stats = {
      totalMoves:0, winStreak:0, bestWinStreak:0,
      checkersWins:0, chessWins:0, queenPromotions:0
    };
  } catch(e){ console.warn('loadState error', e); }
}
function saveState() {
  state.version = SCHEMA_VERSION;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
}
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i=0;i<12;i++) {
    if (i>0 && i%4===0) code += '-';
    code += chars[Math.floor(Math.random()*chars.length)];
  }
  return code;
}
function encodeProgress(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decodeProgress(code) {
  try { return JSON.parse(decodeURIComponent(escape(atob(code.trim())))); }
  catch(e){ return null; }
}

/* ============================================================
   ЭКРАНЫ И UI
============================================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2000);
}

/* ============================================================
   ЗВУК
============================================================ */
let audioCtx = null;
function getAudio(){
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
  }
  return audioCtx;
}
function playTone(freq, dur, type='sine', vol=0.15, delay=0) {
  const ctx = getAudio(); if (!ctx) return;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  const t = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur);
}
function playSound(type) {
  if (!state.sound) return;
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  switch(type){
    case 'select': playTone(880, 0.05, 'sine', 0.10); break;
    case 'move':
      playTone(320, 0.08, 'triangle', 0.14);
      playTone(180, 0.12, 'sine', 0.10, 0.02);
      break;
    case 'capture':
      playTone(260, 0.10, 'square', 0.14);
      playTone(150, 0.18, 'triangle', 0.14, 0.04);
      break;
    case 'check':
      playTone(1046, 0.09, 'square', 0.15);
      playTone(1568, 0.09, 'square', 0.13, 0.08);
      break;
    case 'win':
      [523,659,784,1046].forEach((f,i)=>playTone(f, 0.20, 'sine', 0.16, i*0.09));
      break;
    case 'lose':
      [392,311,262,196].forEach((f,i)=>playTone(f, 0.22, 'sawtooth', 0.12, i*0.10));
      break;
    case 'draw':
      playTone(440, 0.25, 'sine', 0.12);
      playTone(440, 0.25, 'sine', 0.12, 0.30);
      break;
    case 'achievement':
      [659,784,988,1319].forEach((f,i)=>playTone(f, 0.18, 'triangle', 0.15, i*0.07));
      break;
  }
}
function vibrate(pattern){
  if (state.sound && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch(e){}
  }
}

/* ============================================================
   НАСТРОЙКИ
============================================================ */
function applyTheme() {
  document.body.classList.toggle('theme-dark', state.theme==='dark');
  document.body.classList.toggle('theme-light', state.theme==='light');
  const l = document.getElementById('theme-light-btn');
  const d = document.getElementById('theme-dark-btn');
  if (l) l.classList.toggle('active', state.theme==='light');
  if (d) d.classList.toggle('active', state.theme==='dark');
}
function applySkin() {
  document.body.classList.remove('skin-classic','skin-wood','skin-marble','skin-neon');
  document.body.classList.add('skin-' + (state.skin||'classic'));
  ['classic','wood','marble','neon'].forEach(s=>{
    const btn = document.getElementById('skin-'+s+'-btn');
    if (btn) btn.classList.toggle('active', state.skin===s);
  });
}
function setTheme(t){ state.theme=t; applyTheme(); saveState(); }
function setSkin(s){ state.skin=s; applySkin(); saveState(); }
function toggleSound(){
  state.sound = !state.sound;
  const t = document.getElementById('toggle-sound');
  if (t) t.classList.toggle('on', state.sound);
  saveState();
  if (state.sound) playSound('select');
}
function updateSettingsUI() {
  const t = document.getElementById('toggle-sound');
  if (t) t.classList.toggle('on', state.sound);
  applyTheme(); applySkin();
  const pc = document.getElementById('progress-code');
  if (pc) pc.textContent = state.progressCode;
}

/* ============================================================
   ПРОГРЕСС
============================================================ */
function exportProgress() {
  const data = {
    code: state.progressCode,
    elo: state.elo, wins: state.wins, losses: state.losses,
    defeatedBots: state.defeatedBots,
    history: state.history.slice(-50),
    achievements: state.achievements,
    stats: state.stats,
    playerName: state.playerName,
    version: SCHEMA_VERSION
  };
  const full = state.progressCode + '#' + encodeProgress(data);
  copyToClipboard(full);
  toast('📋 Код скопирован!');
}
function copyToClipboard(text){
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text));
  else fallbackCopy(text);
}
function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
}
function openImportModal(){
  document.getElementById('import-input').value='';
  document.getElementById('import-modal').classList.add('active');
}
function closeImportModal(){
  document.getElementById('import-modal').classList.remove('active');
}
function importProgress(){
  const raw = document.getElementById('import-input').value.trim();
  if (!raw){ toast('Введите код'); return; }
  let data = null;
  if (raw.includes('#')) {
    const [code, enc] = raw.split('#');
    data = decodeProgress(enc);
    if (data) data.code = code;
  } else data = decodeProgress(raw);
  if (!data || typeof data.elo !== 'number'){ toast('❌ Неверный код'); return; }

  state.elo = data.elo;
  state.wins = data.wins||0;
  state.losses = data.losses||0;
  state.defeatedBots = data.defeatedBots || { checkers:{}, chess:{} };
  state.history = data.history || [];
  state.achievements = data.achievements || {};
  state.stats = data.stats || state.stats;
  state.playerName = data.playerName || 'Игрок';
  state.progressCode = data.code || generateCode();
  saveState(); updateSettingsUI(); updateMenuElo();
  closeImportModal();
  toast('✅ Прогресс загружен!');
}
function resetProgress(){
  if (!confirm('Сбросить весь прогресс?')) return;
  state.elo = 0;
  state.wins = 0; state.losses = 0;
  state.defeatedBots = { checkers:{}, chess:{} };
  state.history = [];
  state.achievements = {};
  state.stats = { totalMoves:0, winStreak:0, bestWinStreak:0,
    checkersWins:0, chessWins:0, queenPromotions:0 };
  state.progressCode = generateCode();
  saveState(); updateSettingsUI(); updateMenuElo();
  toast('🗑️ Сброшено');
}

/* ============================================================
   ЭЛО
============================================================ */
function updateElo(deltaWins = 0, deltaLosses = 0) {
  if (deltaWins) state.elo += 5 * deltaWins;
  if (deltaLosses) state.elo = Math.max(0, state.elo - 1 * deltaLosses);
  saveState();
  updateMenuElo();
}
function updateMenuElo() {
  const el = document.getElementById('menu-elo');
  if (el) el.textContent = state.elo;
}

/* ============================================================
   ДОСТИЖЕНИЯ
============================================================ */
function unlockAchievement(id) {
  if (state.achievements[id]) return;
  const ach = ACHIEVEMENTS.find(a=>a.id===id);
  if (!ach) return;
  state.achievements[id] = Date.now();
  saveState();
  showAchievementToast(ach);
  playSound('achievement');
  vibrate([40,30,40,30,80]);
}
function showAchievementToast(ach) {
  const el = document.getElementById('ach-toast');
  if (!el) return;
  document.getElementById('ach-toast-icon').textContent = ach.icon;
  document.getElementById('ach-toast-title').textContent = 'Достижение: ' + ach.title;
  document.getElementById('ach-toast-desc').textContent = ach.desc;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 3500);
}
function checkAchievements(context) {
  const s = state.stats;
  if (s.totalMoves >= 1 && (s.checkersWins + s.chessWins) >= 1) unlockAchievement('first_win');
  if (s.winStreak >= 3) unlockAchievement('streak_3');
  if (s.winStreak >= 5) unlockAchievement('streak_5');
  if (context && context.beatElo >= 300) unlockAchievement('beat_300');
  if (context && context.beatElo >= 500) unlockAchievement('beat_500');
  if (state.elo >= WORLD_ELO_THRESHOLD) unlockAchievement('world_rating');
  if (Object.keys(state.defeatedBots.checkers).length >= 12) unlockAchievement('all_checkers');
  if (Object.keys(state.defeatedBots.chess).length >= 12) unlockAchievement('all_chess');
  if (state.history.length >= 25) unlockAchievement('marathon');
  if (state.history.length >= 100) unlockAchievement('veteran');
  if (s.queenPromotions >= 1) unlockAchievement('queen_promo');
}

function showAchievements() {
  const list = document.getElementById('achievement-list');
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(a=>{
    const unlocked = !!state.achievements[a.id];
    const row = document.createElement('div');
    row.className = 'ach-row' + (unlocked ? '' : ' locked');
    row.innerHTML = `
      <div class="ach-icon">${unlocked ? a.icon : '🔒'}</div>
      <div class="ach-info">
        <div class="title">${a.title}</div>
        <div class="desc">${a.desc}</div>
      </div>
    `;
    list.appendChild(row);
  });
  showScreen('screen-achievements');
}

/* ============================================================
   ИСТОРИЯ ПАРТИЙ
============================================================ */
function recordGame({game, mode, opponent, result, moves, eloDelta}) {
  const entry = {
    date: Date.now(),
    game, mode, opponent,
    result,
    moves,
    eloDelta: eloDelta || 0,
    eloAfter: state.elo
  };
  state.history.unshift(entry);
  if (state.history.length > 100) state.history.length = 100;

  if (result === 'win') {
    state.stats.winStreak++;
    if (state.stats.winStreak > state.stats.bestWinStreak)
      state.stats.bestWinStreak = state.stats.winStreak;
  } else if (result === 'lose') {
    state.stats.winStreak = 0;
  }
  state.stats.totalMoves += moves;
  saveState();
}
function showHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  if (state.history.length === 0) {
    list.innerHTML = '<div class="empty-note">Пока нет сыгранных партий</div>';
    showScreen('screen-history');
    return;
  }
  state.history.forEach(h=>{
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString() + ' ' +
      d.toLocaleTimeString().slice(0,5);
    const gameLabel = h.game === 'checkers' ? '⚫ Шашки' : '♟️ Шахматы';
    const resultLabel = h.result==='win' ? 'Победа' :
                        h.result==='lose' ? 'Поражение' : 'Ничья';
    const sign = h.eloDelta > 0 ? '+' : '';
    const eloCls = h.eloDelta > 0 ? 'plus' : (h.eloDelta < 0 ? 'minus' : '');
    const row = document.createElement('div');
    row.className = 'hist-row';
    row.innerHTML = `
      <div class="top">
        <span>${gameLabel} · ${h.opponent}</span>
        <span class="result ${h.result}">${resultLabel}</span>
      </div>
      <div class="meta">
        <span>${dateStr}</span>
        <span>${h.moves} ходов</span>
        <span class="elo-change ${eloCls}">${sign}${h.eloDelta} Эло</span>
      </div>
    `;
    list.appendChild(row);
  });
  showScreen('screen-history');
}

/* ============================================================
   РЕЙТИНГ
============================================================ */
let currentRatingTab = 'training';
function showRating() {
  switchRatingTab(currentRatingTab);
  showScreen('screen-rating');
}
function switchRatingTab(tab) {
  currentRatingTab = tab;
  document.getElementById('tab-training').classList.toggle('active', tab==='training');
  document.getElementById('tab-world').classList.toggle('active', tab==='world');
  renderRating();
}
function renderRating() {
  const c = document.getElementById('rating-content');
  if (currentRatingTab === 'training') renderTraining(c);
  else renderWorld(c);
}
function renderTraining(c) {
  c.innerHTML = '';
  const bots = currentGame === 'chess'
    ? state.defeatedBots.chess
    : state.defeatedBots.checkers;
  const defeated = Object.keys(bots).length;

  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.innerHTML = `<div style="width:${defeated/12*100}%"></div>`;
  c.appendChild(bar);

  const note = document.createElement('div');
  note.className = 'empty-note';
  note.style.marginTop = '0';
  note.style.marginBottom = '12px';
  note.textContent = `Побеждено: ${defeated} / 12 ботов`;
  c.appendChild(note);

  const list = document.createElement('div');
  list.className = 'rating-list';
  TRAINING_BOTS.forEach((bot, i) => {
    const defeatedBot = !!bots[bot.id];
    const row = document.createElement('div');
    row.className = 'rating-row' + (defeatedBot ? ' defeated' : '');
    row.innerHTML = `
      <div class="rank">#${i+1}</div>
      <div class="name">${bot.avatar} ${bot.name}</div>
      <div class="score">${defeatedBot ? '✅' : bot.elo}</div>
    `;
    list.appendChild(row);
  });
  c.appendChild(list);

  const me = document.createElement('div');
  me.className = 'rating-row me';
  me.innerHTML = `
    <div class="rank">★</div>
    <div class="name">${state.playerName} (вы)</div>
    <div class="score">${state.elo}</div>
  `;
  c.appendChild(me);

  if (state.elo >= WORLD_ELO_THRESHOLD) {
    const unlock = document.createElement('div');
    unlock.className = 'empty-note';
    unlock.style.color = 'var(--accent)';
    unlock.style.fontWeight = '700';
    unlock.textContent = '🌍 Доступен мировой рейтинг!';
    c.appendChild(unlock);
  } else {
    const locked = document.createElement('div');
    locked.className = 'empty-note';
    locked.textContent = `До мирового рейтинга: ${WORLD_ELO_THRESHOLD - state.elo} Эло`;
    c.appendChild(locked);
  }
}
function renderWorld(c) {
  c.innerHTML = '';
  if (state.elo < WORLD_ELO_THRESHOLD) {
    c.innerHTML = `<div class="empty-note">
      🔒 Мировой рейтинг откроется при <b>${WORLD_ELO_THRESHOLD} Эло</b>.<br><br>
      Сейчас у вас <b>${state.elo}</b>.<br>
      Нужно ещё <b>${WORLD_ELO_THRESHOLD - state.elo}</b>.
    </div>`;
    return;
  }
  // В мировом рейтинге — только реальные игроки (пока только вы)
  const list = document.createElement('div');
  list.className = 'rating-list';
  const me = document.createElement('div');
  me.className = 'rating-row me';
  me.innerHTML = `
    <div class="rank">#1</div>
    <div class="name">${state.playerName} (вы)</div>
    <div class="score">${state.elo}</div>`;
  list.appendChild(me);
  c.appendChild(list);
  const note = document.createElement('div');
  note.className = 'empty-note';
  note.textContent = 'Пока в мировом рейтинге только вы. Другие игроки появятся, когда игра станет сетевой.';
  c.appendChild(note);
}

/* ============================================================
   ВЫБОР РЕЖИМА
============================================================ */
let currentGame = 'checkers';
let currentMode = 'local';
let activeBot = null;

function openGameSelect(game) {
  currentGame = game;
  document.getElementById('select-title').textContent =
    game === 'checkers' ? 'Шашки' : 'Шахматы';
  showScreen('screen-select');
}
function startLocal() {
  currentMode = 'local';
  startGame();
}
function showBotSelect() {
  document.getElementById('bots-title').textContent =
    currentGame === 'checkers' ? 'Соперник: шашки' : 'Соперник: шахматы';
  const list = document.getElementById('bot-list');
  list.innerHTML = '';
  TRAINING_BOTS.forEach((bot, i) => {
    const row = document.createElement('div');
    row.className = 'rating-row';
    row.innerHTML = `
      <div class="rank">#${i+1}</div>
      <div class="name">${bot.avatar} ${bot.name}</div>
      <div class="score">${bot.elo}</div>`;
    row.style.cursor = 'pointer';
    row.onclick = () => {
      currentMode = 'bot';
      startGame(bot);
    };
    list.appendChild(row);
  });
  const free = document.createElement('div');
  free.className = 'rating-row';
  free.innerHTML = `<div class="rank">🎲</div>
    <div class="name">Свободная игра (без рейтинга)</div>
    <div class="score">—</div>`;
  free.style.cursor = 'pointer';
  free.onclick = () => {
    currentMode = 'bot-free';
    startGame({ id:'free', name:'Свободный бот', elo:1000, depth:2, avatar:'🎲' });
  };
  list.appendChild(free);
  showScreen('screen-bots');
}

/* ============================================================
   СТАРТ ИГРЫ
============================================================ */
let gameActive = false;
let moveHistory = [];
let capturedFifty = 0;
let positionCounts = {};
let animating = false;

function startGame(bot = null) {
  activeBot = bot;
  gameActive = true;
  moveHistory = [];
  capturedFifty = 0;
  positionCounts = {};
  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'none';

  if (currentGame === 'checkers') initCheckers();
  else initChess();
  render();
  showScreen('screen-game');
  document.getElementById('game-title').textContent =
    currentGame === 'checkers'
      ? (currentMode === 'local' ? 'Шашки · 2 игрока'
        : (activeBot ? 'Шашки · ' + activeBot.name : 'Шашки'))
      : (currentMode === 'local' ? 'Шахматы · 2 игрока'
        : (activeBot ? 'Шахматы · ' + activeBot.name : 'Шахматы'));
  updateUndoButton();
}
function resetGame() {
  if (!confirm('Начать заново?')) return;
  startGame(activeBot);
}
function rematch() { startGame(activeBot); }
function confirmExit() {
  if (gameActive && !confirm('Выйти из партии?')) return;
  gameActive = false;
  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'none';
  showScreen('screen-menu');
}
function updateUndoButton() {
  const btn = document.getElementById('undo-btn');
  if (!btn) return;
  btn.disabled = moveHistory.length === 0 || !gameActive;
}

/* ============================================================
   UNDO
============================================================ */
function undoMove() {
  if (!gameActive) { toast('Партия завершена'); return; }
  if (moveHistory.length === 0) { toast('Нечего отменять'); return; }
  if (animating) return;

  const isVsBot = (currentMode === 'bot' || currentMode === 'bot-free');
  const toUndo = isVsBot ? Math.min(2, moveHistory.length) : 1;

  for (let i = 0; i < toUndo; i++) {
    const last = moveHistory.pop();
    if (!last) break;
    if (currentGame === 'checkers') undoCheckersMove(last);
    else undoChessMove(last);
  }
  if (currentGame === 'checkers') {
    selected = null; validMoves = []; mustCapture = false;
  } else {
    chessSelected = null; chessValidMoves = []; chessCheckSquare = null;
  }
  render();
  updateUndoButton();
  playSound('move');
}

/* ============================================================
   ШАШКИ
============================================================ */
const SIZE = 8;
let board = [];
let turn = 'w';
let selected = null;
let validMoves = [];
let mustCapture = false;
let lastMove = null;

function initCheckers() {
  board = [];
  for (let r=0;r<SIZE;r++){
    board[r]=[];
    for (let c=0;c<SIZE;c++){
      board[r][c]=null;
      if ((r+c)%2===1){
        if (r<3) board[r][c]='b';
        else if (r>4) board[r][c]='w';
      }
    }
  }
  turn='w'; selected=null; validMoves=[]; mustCapture=false;
  lastMove=null;
}

function isWhite(p){return p==='w'||p==='W';}
function isBlack(p){return p==='b'||p==='B';}
function sameColor(a,b){
  return a&&b&&((isWhite(a)&&isWhite(b))||(isBlack(a)&&isBlack(b)));
}
function inBounds(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE;}

function getMoves(r,c){
  const p = board[r][c]; if (!p) return [];
  const moves = [];
  const isKing = p==='W'||p==='B';
  const dirs = isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : (isWhite(p) ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
  const allDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];

  if (!isKing){
    for (const [dr,dc] of dirs){
      const nr=r+dr,nc=c+dc;
      if (inBounds(nr,nc)&&!board[nr][nc]) moves.push({r:nr,c:nc,capture:null});
    }
  } else {
    for (const [dr,dc] of allDirs){
      let nr=r+dr,nc=c+dc;
      while (inBounds(nr,nc)&&!board[nr][nc]){
        moves.push({r:nr,c:nc,capture:null});
        nr+=dr;nc+=dc;
      }
    }
  }
  if (isKing){
    for (const [dr,dc] of allDirs){
      let nr=r+dr,nc=c+dc;
      while (inBounds(nr,nc)&&!board[nr][nc]){nr+=dr;nc+=dc;}
      if (inBounds(nr,nc)&&!sameColor(p,board[nr][nc])){
        const cr=nr+dr,cc=nc+dc;
        if (inBounds(cr,cc)&&!board[cr][cc])
          moves.push({r:cr,c:cc,capture:{r:nr,c:nc}});
      }
    }
  } else {
    for (const [dr,dc] of allDirs){
      const mr=r+dr,mc=c+dc,cr=r+2*dr,cc=c+2*dc;
      if (inBounds(cr,cc)&&!board[cr][cc]&&board[mr]&&board[mr][mc]&&
          !sameColor(p,board[mr][mc]))
        moves.push({r:cr,c:cc,capture:{r:mr,c:mc}});
    }
  }
  return moves;
}
function getAllMovesCheckers(player){
  let caps=[],sim=[];
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++){
    const p=board[r][c]; if (!p) continue;
    if (player==='w'&&!isWhite(p)) continue;
    if (player==='b'&&!isBlack(p)) continue;
    for (const m of getMoves(r,c)){
      if (m.capture) caps.push({from:{r,c},...m});
      else sim.push({from:{r,c},...m});
    }
  }
  return caps.length?caps:sim;
}
function getCaptureFrom(r,c){ return getMoves(r,c).filter(m=>m.capture); }

function evaluateCheckers(player){
  let score=0;
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++){
    const p=board[r][c]; if (!p) continue;
    const white = isWhite(p);
    const sign = (player==='w')===white ? 1 : -1;
    let val = 0;
    if (p==='w'||p==='b') val = 100 + (white ? (7-r)*4 : r*4);
    else val = 300;
    score += sign*val;
  }
  return score;
}
function minimaxCheckers(depth, alpha, beta, maximizing, player){
  const color = maximizing ? player : (player==='w'?'b':'w');
  const moves = getAllMovesCheckers(color);
  if (depth===0 || moves.length===0){
    if (moves.length===0) return maximizing ? -100000-depth : 100000+depth;
    return evaluateCheckers(player);
  }
  if (maximizing){
    let best = -Infinity;
    for (const m of moves){
      const u = applyMoveCheckersRaw(m.from, m);
      const v = minimaxCheckers(depth-1, alpha, beta, false, player);
      undoMoveCheckersRaw(u);
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves){
      const u = applyMoveCheckersRaw(m.from, m);
      const v = minimaxCheckers(depth-1, alpha, beta, true, player);
      undoMoveCheckersRaw(u);
      if (v < best) best = v;
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return best;
  }
}
function applyMoveCheckersRaw(from, move){
  const p = board[from.r][from.c];
  const captured = move.capture ? board[move.capture.r][move.capture.c] : null;
  board[from.r][from.c] = null;
  if (move.capture) board[move.capture.r][move.capture.c] = null;
  let newPiece = p;
  if (p==='w'&&move.r===0) newPiece='W';
  if (p==='b'&&move.r===SIZE-1) newPiece='B';
  board[move.r][move.c] = newPiece;
  return { from, move, piece: p, captured };
}
function undoMoveCheckersRaw(u){
  board[u.move.r][u.move.c] = null;
  board[u.from.r][u.from.c] = u.piece;
  if (u.captured) board[u.move.capture.r][u.move.capture.c] = u.captured;
}

function botMoveCheckers(){
  if (!gameActive || turn!=='b') return;
  const depth = activeBot ? activeBot.depth : 2;
  const moves = getAllMovesCheckers('b');
  if (!moves.length) return;
  let best=null, bestVal=Infinity;
  for (const m of moves){
    const u = applyMoveCheckersRaw(m.from, m);
    const v = minimaxCheckers(depth-1, -Infinity, Infinity, true, 'b');
    undoMoveCheckersRaw(u);
    if (v < bestVal){ bestVal=v; best=m; }
  }
  if (!best) best = moves[0];
  makeMoveCheckers(best.from, best, true);
}

function onCellClickCheckers(r,c){
  if (!gameActive || animating) return;
  if (turn==='b' && (currentMode==='bot'||currentMode==='bot-free')) return;

  const move = validMoves.find(m=>m.r===r&&m.c===c);
  if (move && selected){ makeMoveCheckers(selected, move); return; }

  const p = board[r][c];
  if (p){
    const isMyPiece = (turn==='w'&&isWhite(p))||(turn==='b'&&isBlack(p));
    if (isMyPiece){
      if (mustCapture && selected && (selected.r!==r||selected.c!==c)) return;
      selected = {r,c};
      validMoves = getMoves(r,c);
      const allCaps = getAllMovesCheckers(turn).filter(m=>m.capture);
      if (allCaps.length) validMoves = validMoves.filter(m=>m.capture);
      playSound('select');
      render();
      return;
    }
  }
  if (!mustCapture){ selected=null; validMoves=[]; render(); }
}

function makeMoveCheckers(from, move, isBot){
  if (animating) return;
  const p = board[from.r][from.c];

  const undoEntry = {
    from: {...from},
    to: {r:move.r, c:move.c},
    piece: p,
    captured: move.capture ? board[move.capture.r][move.capture.c] : null,
    capturedPos: move.capture ? {...move.capture} : null,
    promoted: null,
    turnBefore: turn
  };

  let newPiece = p;
  if (p==='w'&&move.r===0 && p!=='W') { newPiece='W'; undoEntry.promoted='w'; }
  if (p==='b'&&move.r===SIZE-1 && p!=='B') { newPiece='B'; undoEntry.promoted='b'; }

  animating = true;
  const boardEl = document.getElementById('board');
  const fromCell = boardEl.children[from.r*8 + from.c];
  const toCell = boardEl.children[move.r*8 + move.c];
  const pieceEl = fromCell ? fromCell.querySelector('.piece') : null;

  if (move.capture) {
    const capCell = boardEl.children[move.capture.r*8 + move.capture.c];
    const capEl = capCell ? capCell.querySelector('.piece') : null;
    if (capEl) {
      capEl.classList.add('captured');
      setTimeout(()=>capEl.remove(), 280);
    }
    playSound('capture');
    vibrate([30,20,30]);
  } else {
    playSound('move');
    vibrate(15);
  }

  if (pieceEl && toCell) {
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();
    const dx = fromRect.left - toRect.left;
    const dy = fromRect.top - toRect.top;
    pieceEl.style.setProperty('--dx', dx + 'px');
    pieceEl.style.setProperty('--dy', dy + 'px');
    pieceEl.classList.add('animating');
    toCell.appendChild(pieceEl);
    setTimeout(()=>{
      pieceEl.classList.remove('animating');
      animating = false;
      finalizeMoveCheckers(from, move, undoEntry, newPiece, isBot);
    }, 230);
  } else {
    animating = false;
    finalizeMoveCheckers(from, move, undoEntry, newPiece, isBot);
  }
}

function finalizeMoveCheckers(from, move, undoEntry, newPiece, isBot){
  board[from.r][from.c] = null;
  if (move.capture) board[move.capture.r][move.capture.c] = null;
  board[move.r][move.c] = newPiece;
  lastMove = { from: {...from}, to: {r:move.r,c:move.c} };
  undoEntry.newPiece = newPiece;
  moveHistory.push({ game:'checkers', undo: undoEntry });
  updateUndoButton();

  if (move.capture){
    const further = getCaptureFrom(move.r, move.c);
    if (further.length){
      selected = {r:move.r,c:move.c};
      validMoves = further;
      mustCapture = true;
      render();
      return;
    }
  }
  mustCapture = false; selected=null; validMoves=[];
  turn = turn==='w'?'b':'w';

  const enemyMoves = getAllMovesCheckers(turn);
  if (!enemyMoves.length){
    render();
    endGameCheckers(turn==='w'?'b':'w');
    return;
  }
  render();
  if (turn==='b' && (currentMode==='bot'||currentMode==='bot-free'))
    setTimeout(botMoveCheckers, 300);
}

function undoCheckersMove(entry){
  const u = entry.undo;
  board[u.to.r][u.to.c] = null;
  board[u.from.r][u.from.c] = u.piece;
  if (u.captured && u.capturedPos){
    board[u.capturedPos.r][u.capturedPos.c] = u.captured;
  }
  turn = u.turnBefore;
  lastMove = null;
}

function endGameCheckers(winner){
  gameActive = false;
  const st = document.getElementById('status');
  const playerWon = winner==='w';
  let eloDelta = 0;
  let result = 'draw';

  if (currentMode==='bot' && activeBot && activeBot.id!=='free'){
    if (playerWon){
      st.textContent = `🎉 Победа! +5 Эло`;
      state.wins++;
      state.stats.checkersWins++;
      state.defeatedBots.checkers[activeBot.id] = true;
      eloDelta = 5; result = 'win';
      updateElo(1, 0);
      playSound('win');
      vibrate([50,40,50,40,100]);
    } else {
      st.textContent = `😢 Поражение. −1 Эло`;
      state.losses++;
      eloDelta = -1; result = 'lose';
      updateElo(0, 1);
      playSound('lose');
      vibrate([100,50,100]);
    }
    recordGame({
      game:'checkers', mode:'bot', opponent: activeBot.name,
      result, moves: moveHistory.length, eloDelta
    });
    checkAchievements({ beatElo: playerWon ? activeBot.elo : 0 });
  } else if (currentMode==='bot-free'){
    st.textContent = playerWon ? '🎉 Вы победили!' : '😢 Вы проиграли';
    playSound(playerWon?'win':'lose');
    recordGame({
      game:'checkers', mode:'free', opponent: activeBot ? activeBot.name : 'Бот',
      result: playerWon?'win':'lose', moves: moveHistory.length, eloDelta: 0
    });
  } else {
    st.textContent = winner==='w' ? '🎉 Победа белых!' : '🎉 Победа чёрных!';
    playSound('win');
  }
  saveState();
  updateMenuElo();
  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'flex';
}

/* ============================================================
   ШАХМАТЫ
============================================================ */
let chessBoard = [];
let chessTurn = 'w';
let chessSelected = null;
let chessValidMoves = [];
let chessEnPassant = null;
let chessCastling = { wK:true,wQ:true,bK:true,bQ:true };
let chessGameActive = false;
let chessLastMove = null;
let chessCheckSquare = null;

const PIECE_SYMBOLS = {
  w: { k:'♔', q:'♕', r:'♖', b:'♗', n:'♘', p:'♙' },
  b: { k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' }
};

function initChess() {
  chessBoard = [];
  for (let r=0;r<8;r++){ chessBoard[r]=[]; for (let c=0;c<8;c++) chessBoard[r][c]=null; }
  const back = ['r','n','b','q','k','b','n','r'];
  for (let c=0;c<8;c++){
    chessBoard[0][c] = { type: back[c], color:'b' };
    chessBoard[1][c] = { type:'p', color:'b' };
    chessBoard[6][c] = { type:'p', color:'w' };
    chessBoard[7][c] = { type: back[c], color:'w' };
  }
  chessTurn='w';
  chessSelected=null; chessValidMoves=[];
  chessEnPassant=null;
  chessCastling={ wK:true,wQ:true,bK:true,bQ:true };
  chessLastMove=null;
  chessCheckSquare=null;
  chessGameActive = true;
  capturedFifty = 0;
  positionCounts = {};
  countPosition();
}

function inChess(r,c){return r>=0&&r<8&&c>=0&&c<8;}
function cloneChessBoard(b){ return b.map(row=>row.map(p=>p?{...p}:null)); }

function squareAttackedBy(board, r, c, byColor){
  const dir = byColor==='w' ? -1 : 1;
  for (const dc of [-1,1]){
    const pr=r-dir, pc=c-dc;
    if (inChess(pr,pc)){
      const p=board[pr][pc];
      if (p&&p.color===byColor&&p.type==='p') return true;
    }
  }
  for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
    const nr=r+dr,nc=c+dc;
    if (inChess(nr,nc)){
      const p=board[nr][nc];
      if (p&&p.color===byColor&&p.type==='n') return true;
    }
  }
  for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]){
    let nr=r+dr,nc=c+dc;
    while (inChess(nr,nc)){
      const p=board[nr][nc];
      if (p){
        if (p.color===byColor&&(p.type==='b'||p.type==='q')) return true;
        break;
      }
      nr+=dr;nc+=dc;
    }
  }
  for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
    let nr=r+dr,nc=c+dc;
    while (inChess(nr,nc)){
      const p=board[nr][nc];
      if (p){
        if (p.color===byColor&&(p.type==='r'||p.type==='q')) return true;
        break;
      }
      nr+=dr;nc+=dc;
    }
  }
  for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
    const nr=r+dr,nc=c+dc;
    if (inChess(nr,nc)){
      const p=board[nr][nc];
      if (p&&p.color===byColor&&p.type==='k') return true;
    }
  }
  return false;
}
function findKing(board, color){
  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const p=board[r][c];
    if (p&&p.type==='k'&&p.color===color) return {r,c};
  }
  return null;
}
function isInCheck(board, color){
  const k = findKing(board, color);
  if (!k) return false;
  return squareAttackedBy(board, k.r, k.c, color==='w'?'b':'w');
}

function pseudoMovesChess(board, r, c, ep, castling){
  const p = board[r][c]; if (!p) return [];
  const moves = [];
  const color = p.color;
  const enemy = color==='w'?'b':'w';

  if (p.type==='p'){
    const dir = color==='w' ? -1 : 1;
    const startRow = color==='w' ? 6 : 1;
    const promoRow = color==='w' ? 0 : 7;
    if (inChess(r+dir,c) && !board[r+dir][c]){
      const isPromo = (r+dir===promoRow);
      moves.push({from:{r,c}, to:{r:r+dir,c}, promotion:isPromo});
      if (r===startRow && !board[r+2*dir][c]){
        moves.push({from:{r,c}, to:{r:r+2*dir,c}, double:true});
      }
    }
    for (const dc of [-1,1]){
      const nr=r+dir, nc=c+dc;
      if (!inChess(nr,nc)) continue;
      const t = board[nr][nc];
      if (t && t.color===enemy){
        moves.push({from:{r,c}, to:{r:nr,c:nc}, promotion:(nr===promoRow)});
      } else if (ep && ep.r===nr && ep.c===nc){
        moves.push({from:{r,c}, to:{r:nr,c:nc}, enPassant:{r:r,c:nc}});
      }
    }
  }
  else if (p.type==='n'){
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],
                            [1,-2],[1,2],[2,-1],[2,1]]){
      const nr=r+dr,nc=c+dc;
      if (!inChess(nr,nc)) continue;
      const t=board[nr][nc];
      if (t&&t.color===color) continue;
      moves.push({from:{r,c},to:{r:nr,c:nc}});
    }
  }
  else if (p.type==='b' || p.type==='q'){
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]){
      let nr=r+dr,nc=c+dc;
      while (inChess(nr,nc)){
        const t=board[nr][nc];
        if (t&&t.color===color) break;
        moves.push({from:{r,c},to:{r:nr,c:nc}});
        if (t) break;
        nr+=dr;nc+=dc;
      }
    }
  }
  if (p.type==='r' || p.type==='q'){
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      let nr=r+dr,nc=c+dc;
      while (inChess(nr,nc)){
        const t=board[nr][nc];
        if (t&&t.color===color) break;
        moves.push({from:{r,c},to:{r:nr,c:nc}});
        if (t) break;
        nr+=dr;nc+=dc;
      }
    }
  }
  if (p.type==='k'){
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
      const nr=r+dr,nc=c+dc;
      if (!inChess(nr,nc)) continue;
      const t=board[nr][nc];
      if (t&&t.color===color) continue;
      moves.push({from:{r,c},to:{r:nr,c:nc}});
    }
    if (castling){
      const row = color==='w' ? 7 : 0;
      if (r===row && c===4){
        if (castling[color+'K'] && !board[row][5] && !board[row][6] &&
            board[row][7] && board[row][7].type==='r' && board[row][7].color===color){
          moves.push({from:{r,c}, to:{r:row,c:6}, castle:'K'});
        }
        if (castling[color+'Q'] && !board[row][3] && !board[row][2] &&
            !board[row][1] &&
            board[row][0] && board[row][0].type==='r' && board[row][0].color===color){
          moves.push({from:{r,c}, to:{r:row,c:2}, castle:'Q'});
        }
      }
    }
  }
  return moves;
}

function applyMoveChess(board, m, castling, ep){
  const p = board[m.from.r][m.from.c];
  const undo = {
    m: {...m},
    piece: {...p},
    captured: null,
    capturedPos: null,
    castlingBefore: {...castling},
    epBefore: ep,
    promoted: null,
    movedRookFrom: null,
    movedRookTo: null
  };
  if (m.enPassant){
    undo.captured = {...board[m.enPassant.r][m.enPassant.c]};
    undo.capturedPos = {...m.enPassant};
    board[m.enPassant.r][m.enPassant.c] = null;
  } else if (board[m.to.r][m.to.c]){
    undo.captured = {...board[m.to.r][m.to.c]};
    undo.capturedPos = {r:m.to.r, c:m.to.c};
  }
  board[m.to.r][m.to.c] = p;
  board[m.from.r][m.from.c] = null;

  if (m.promotion){
    const nt = m.promotionType || 'q';
    board[m.to.r][m.to.c] = { type:nt, color:p.color };
    undo.promoted = nt;
  }
  if (m.castle){
    const row = p.color==='w' ? 7 : 0;
    if (m.castle==='K'){
      undo.movedRookFrom = {r:row,c:7};
      undo.movedRookTo = {r:row,c:5};
      board[row][5] = board[row][7]; board[row][7] = null;
    } else {
      undo.movedRookFrom = {r:row,c:0};
      undo.movedRookTo = {r:row,c:3};
      board[row][3] = board[row][0]; board[row][0] = null;
    }
  }
  if (p.type==='k'){ castling[p.color+'K']=false; castling[p.color+'Q']=false; }
  if (p.type==='r'){
    const row = p.color==='w'?7:0;
    if (m.from.r===row && m.from.c===0) castling[p.color+'Q']=false;
    if (m.from.r===row && m.from.c===7) castling[p.color+'K']=false;
  }
  if (undo.captured && undo.captured.type==='r'){
    const row = undo.captured.color==='w'?7:0;
    if (undo.capturedPos.r===row && undo.capturedPos.c===0)
      castling[undo.captured.color+'Q']=false;
    if (undo.capturedPos.r===row && undo.capturedPos.c===7)
      castling[undo.captured.color+'K']=false;
  }
  return undo;
}

function undoApplyMoveChess(board, u, castlingRef){
  board[u.to.r][u.to.c] = null;
  board[u.m.from.r][u.m.from.c] = u.piece;
  if (u.captured) board[u.capturedPos.r][u.capturedPos.c] = u.captured;
  if (u.m.castle && u.movedRookFrom && u.movedRookTo){
    board[u.movedRookFrom.r][u.movedRookFrom.c] =
      board[u.movedRookTo.r][u.movedRookTo.c];
    board[u.movedRookTo.r][u.movedRookTo.c] = null;
  }
  if (castlingRef && u.castlingBefore){
    Object.assign(castlingRef, u.castlingBefore);
  }
}

function legalMovesChess(board, r, c, castling, ep){
  const p = board[r][c]; if (!p) return [];
  const pseudo = pseudoMovesChess(board, r, c, ep, castling);
  const legal = [];
  for (const m of pseudo){
    const b2 = cloneChessBoard(board);
    const c2 = {...castling};
    applyMoveChess(b2, m, c2, ep);
    if (!isInCheck(b2, p.color)){
      if (m.castle){
        const row = p.color==='w'?7:0;
        const midC = m.castle==='K'?5:3;
        const endC = m.castle==='K'?6:2;
        if (squareAttackedBy(board, row, 4, p.color==='w'?'b':'w') ||
            squareAttackedBy(board, row, midC, p.color==='w'?'b':'w') ||
            squareAttackedBy(board, row, endC, p.color==='w'?'b':'w'))
          continue;
      }
      legal.push(m);
    }
  }
  return legal;
}
function allLegalMovesChess(board, color, castling, ep){
  const all = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const p = board[r][c];
    if (p && p.color===color){
      for (const m of legalMovesChess(board, r, c, castling, ep)) all.push(m);
    }
  }
  return all;
}

const PIECE_VALUES = { p:100, n:320, b:330, r:500, q:900, k:20000 };
function evaluateChess(board, forColor){
  let score = 0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const p = board[r][c]; if (!p) continue;
    const sign = p.color===forColor ? 1 : -1;
    let v = PIECE_VALUES[p.type];
    if (p.type==='p'||p.type==='n'){
      const centerDist = Math.abs(3.5-r) + Math.abs(3.5-c);
      v += (7 - centerDist) * 2;
    }
    score += sign * v;
  }
  return score;
}
function minimaxChess(board, depth, alpha, beta, maximizing, botColor, castling, ep){
  const color = maximizing ? botColor : (botColor==='w'?'b':'w');
  const moves = allLegalMovesChess(board, color, castling, ep);
  if (moves.length===0){
    if (isInCheck(board, color)) return maximizing ? -100000-depth : 100000+depth;
    return 0;
  }
  if (depth===0) return evaluateChess(board, botColor);
  moves.sort((a,b)=>{
    const ca = board[a.to.r][a.to.c] ? PIECE_VALUES[board[a.to.r][a.to.c].type] : 0;
    const cb = board[b.to.r][b.to.c] ? PIECE_VALUES[board[b.to.r][b.to.c].type] : 0;
    return cb-ca;
  });
  if (maximizing){
    let best = -Infinity;
    for (const m of moves){
      const b2 = cloneChessBoard(board);
      const c2 = {...castling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, ep);
      const v = minimaxChess(b2, depth-1, alpha, beta, false, botColor, c2, newEp);
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves){
      const b2 = cloneChessBoard(board);
      const c2 = {...castling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, ep);
      const v = minimaxChess(b2, depth-1, alpha, beta, true, botColor, c2, newEp);
      if (v < best) best = v;
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function botMoveChess(){
  if (!chessGameActive || chessTurn!=='b') return;
  const depth = activeBot ? activeBot.depth : 2;
  const moves = allLegalMovesChess(chessBoard, 'b', chessCastling, chessEnPassant);
  if (!moves.length) return;
  if (depth<=1 && Math.random()<0.3){
    const m = moves[Math.floor(Math.random()*moves.length)];
    makeChessMove(m, m.promotionType||'q', true);
    return;
  }
  let best=null, bestVal=Infinity;
  moves.sort((a,b)=>{
    const ca = chessBoard[a.to.r][a.to.c] ? PIECE_VALUES[chessBoard[a.to.r][a.to.c].type] : 0;
    const cb = chessBoard[b.to.r][b.to.c] ? PIECE_VALUES[chessBoard[b.to.r][b.to.c].type] : 0;
    return cb-ca;
  });
  for (const m of moves){
    const b2 = cloneChessBoard(chessBoard);
    const c2 = {...chessCastling};
    let newEp = null;
    if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
    applyMoveChess(b2, m, c2, chessEnPassant);
    const v = minimaxChess(b2, depth-1, -Infinity, Infinity, true, 'b', c2, newEp);
    if (v < bestVal){ bestVal=v; best=m; }
  }
  if (!best) best = moves[0];
  makeChessMove(best, best.promotionType||'q', true);
}

function onCellClickChess(r,c){
  if (!chessGameActive || animating) return;
  if (chessTurn==='b' && (currentMode==='bot'||currentMode==='bot-free')) return;

  const move = chessValidMoves.find(m=>m.to.r===r && m.to.c===c);
  if (move && chessSelected){
    const p = chessBoard[chessSelected.r][chessSelected.c];
    const promoRow = p.color==='w' ? 0 : 7;
    if (p.type==='p' && r===promoRow){
      openPromotionDialog(p.color, (pieceType)=>{
        makeChessMove(move, pieceType, false);
      });
      return;
    }
    makeChessMove(move, null, false);
    return;
  }

  const p = chessBoard[r][c];
  if (p && p.color===chessTurn){
    chessSelected = {r,c};
    chessValidMoves = legalMovesChess(chessBoard, r, c, chessCastling, chessEnPassant);
    playSound('select');
    render();
    return;
  }
  chessSelected = null; chessValidMoves=[];
  render();
}

function makeChessMove(m, promoType, isBot){
  if (animating) return;
  if (promoType) m.promotionType = promoType;

  const p = chessBoard[m.from.r][m.from.c];
  if (p.type==='p' && Math.abs(m.to.c-m.from.c)===1 && !chessBoard[m.to.r][m.to.c]){
    m.enPassant = { r:m.from.r, c:m.to.c };
  }
  if (p.type==='p' && Math.abs(m.to.r-m.from.r)===2){
    m.double = true;
  }
  if (p.type==='k' && Math.abs(m.to.c-m.from.c)===2){
    m.castle = m.to.c > m.from.c ? 'K' : 'Q';
  }

  animating = true;
  const boardEl = document.getElementById('board');
  const fromCell = boardEl.children[m.from.r*8 + m.from.c];
  const toCell = boardEl.children[m.to.r*8 + m.to.c];
  const pieceEl = fromCell ? fromCell.querySelector('.chess-piece') : null;

  const isCapture = m.enPassant || chessBoard[m.to.r][m.to.c];
  if (isCapture){
    const capPos = m.enPassant || {r:m.to.r, c:m.to.c};
    const capCell = boardEl.children[capPos.r*8 + capPos.c];
    const capEl = capCell ? capCell.querySelector('.chess-piece') : null;
    if (capEl){ capEl.classList.add('captured'); setTimeout(()=>capEl.remove(), 280); }
  }

  if (pieceEl && toCell){
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();
    const dx = fromRect.left - toRect.left;
    const dy = fromRect.top - toRect.top;
    pieceEl.style.setProperty('--dx', dx + 'px');
    pieceEl.style.setProperty('--dy', dy + 'px');
    pieceEl.classList.add('animating');
    toCell.appendChild(pieceEl);

    if (m.castle){
      const row = p.color==='w'?7:0;
      const rookFromC = m.castle==='K' ? 7 : 0;
      const rookToC   = m.castle==='K' ? 5 : 3;
      const rookFromCell = boardEl.children[row*8 + rookFromC];
      const rookToCell   = boardEl.children[row*8 + rookToC];
      const rookEl = rookFromCell ? rookFromCell.querySelector('.chess-piece') : null;
      if (rookEl && rookToCell){
        rookEl.classList.add('animating');
        rookToCell.appendChild(rookEl);
        setTimeout(()=>rookEl.classList.remove('animating'), 230);
      }
    }

    setTimeout(()=>{
      pieceEl.classList.remove('animating');
      animating = false;
      finalizeChessMove(m, isCapture, isBot);
    }, 230);
  } else {
    animating = false;
    finalizeChessMove(m, isCapture, isBot);
  }
}

function finalizeChessMove(m, isCapture, isBot){
  const p = chessBoard[m.from.r][m.from.c];
  const undo = applyMoveChess(chessBoard, m, chessCastling, chessEnPassant);

  moveHistory.push({
    game: 'chess',
    undo,
    enPassantBefore: undo.epBefore,
    castlingBefore: undo.castlingBefore
  });

  if (isCapture || p.type==='p') capturedFifty = 0;
  else capturedFifty++;

  chessEnPassant = m.double ? {r:(m.from.r+m.to.r)/2, c:m.from.c} : null;

  if (isCapture){ playSound('capture'); vibrate([30,20,30]); }
  else { playSound('move'); vibrate(15); }

  if (m.promotionType === 'q'){
    state.stats.queenPromotions++;
    unlockAchievement('queen_promo');
  }

  chessLastMove = { from: {...m.from}, to: {...m.to} };
  chessTurn = chessTurn==='w'?'b':'w';
  chessSelected = null; chessValidMoves=[];
  chessCheckSquare = null;

  countPosition();

  const inCheck = isInCheck(chessBoard, chessTurn);
  if (inCheck){
    const k = findKing(chessBoard, chessTurn);
    chessCheckSquare = k;
    playSound('check');
  }

  const moves = allLegalMovesChess(chessBoard, chessTurn, chessCastling, chessEnPassant);
  if (moves.length === 0){
    render();
    if (inCheck) endGameChess(chessTurn==='w'?'b':'w', 'мат');
    else endGameChess(null, 'пат');
    return;
  }
  if (capturedFifty >= 100){
    render();
    endGameChess(null, 'правило 50 ходов');
    return;
  }
  const posKey = positionKey();
  if (positionCounts[posKey] >= 3){
    render();
    endGameChess(null, 'троекратное повторение');
    return;
  }

  render();
  if (chessTurn==='b' && (currentMode==='bot'||currentMode==='bot-free'))
    setTimeout(botMoveChess, 300);
}

function positionKey(){
  let s = chessTurn + '|';
  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const p = chessBoard[r][c];
    s += p ? (p.color + p.type) : '.';
  }
  s += '|' + (chessCastling.wK?'K':'') + (chessCastling.wQ?'Q':'')
    + (chessCastling.bK?'k':'') + (chessCastling.bQ?'q':'');
  return s;
}
function countPosition(){
  const k = positionKey();
  positionCounts[k] = (positionCounts[k]||0) + 1;
}

function undoChessMove(entry){
  const u = entry.undo;
  undoApplyMoveChess(chessBoard, u, chessCastling);
  chessEnPassant = u.epBefore || null;
  chessTurn = u.piece.color;
  chessLastMove = null;
  chessSelected = null;
  chessValidMoves = [];
  chessCheckSquare = null;
}

function endGameChess(winner, reason){
  chessGameActive = false;
  const st = document.getElementById('status');
  let eloDelta = 0, result = 'draw';

  if (!winner){
    st.textContent = `🤝 Ничья (${reason})`;
    playSound('draw');
    if (currentMode==='bot' && activeBot && activeBot.id!=='free'){
      recordGame({game:'chess', mode:'bot', opponent:activeBot.name,
        result:'draw', moves:moveHistory.length, eloDelta:0});
    }
  } else {
    const playerWon = winner==='w';
    if (currentMode==='bot' && activeBot && activeBot.id!=='free'){
      if (playerWon){
        st.textContent = `🎉 Победа! +5 Эло`;
        state.wins++;
        state.stats.chessWins++;
        state.defeatedBots.chess[activeBot.id] = true;
        eloDelta = 5; result = 'win';
        updateElo(1, 0);
        playSound('win');
        vibrate([50,40,50,40,100]);
      } else {
        st.textContent = `😢 Поражение. −1 Эло`;
        state.losses++;
        eloDelta = -1; result = 'lose';
        updateElo(0, 1);
        playSound('lose');
        vibrate([100,50,100]);
      }
      recordGame({game:'chess', mode:'bot', opponent:activeBot.name,
        result, moves:moveHistory.length, eloDelta});
      checkAchievements({ beatElo: playerWon ? activeBot.elo : 0 });
    } else if (currentMode==='bot-free'){
      st.textContent = playerWon ? '🎉 Вы победили!' : '😢 Вы проиграли';
      playSound(playerWon?'win':'lose');
    } else {
      st.textContent = winner==='w' ? '🎉 Победа белых!' : '🎉 Победа чёрных!';
      playSound('win');
    }
  }
  saveState();
  updateMenuElo();
  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'flex';
}

function openPromotionDialog(color, callback){
  const overlay = document.getElementById('promo-overlay');
  const box = document.getElementById('promo-box');
  box.innerHTML = '';
  ['q','r','b','n'].forEach(type=>{
    const btn = document.createElement('button');
    btn.textContent = PIECE_SYMBOLS[color][type];
    btn.onclick = ()=>{ overlay.classList.remove('active'); callback(type); };
    box.appendChild(btn);
  });
  overlay.classList.add('active');
}

/* ============================================================
   РЕНДЕР
============================================================ */
function render() {
  if (currentGame==='checkers') renderCheckers();
  else renderChess();
}

function renderCheckers() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
      const p = board[r][c];
      if (p){
        const piece = document.createElement('div');
        piece.className = 'piece ' + (isWhite(p)?'white':'black');
        if (p==='W'||p==='B') piece.classList.add('king');
        cell.appendChild(piece);
      }
      if (lastMove){
        if (lastMove.from.r===r&&lastMove.from.c===c) cell.classList.add('last-move');
        if (lastMove.to.r===r&&lastMove.to.c===c) cell.classList.add('last-move');
      }
      if (selected && selected.r===r && selected.c===c) cell.classList.add('selected');
      const hint = validMoves.find(m=>m.r===r&&m.c===c);
      if (hint){
        cell.classList.add('hint');
        if (hint.capture) cell.classList.add('capture');
      }
      cell.addEventListener('click', ()=>onCellClickCheckers(r,c));
      boardEl.appendChild(cell);
    }
  }
  let text = turn==='w' ? 'Ход белых' : 'Ход чёрных';
  if (currentMode==='bot'||currentMode==='bot-free'){
    if (turn==='b') text = '🤖 Думает...';
  }
  if (mustCapture) text += ' (взятие!)';
  document.getElementById('status').textContent = text;
  updateUndoButton();
}

function renderChess() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
      const p = chessBoard[r][c];
      if (p){
        const piece = document.createElement('div');
        piece.className = 'chess-piece ' + (p.color==='w'?'white':'black');
        piece.textContent = PIECE_SYMBOLS[p.color][p.type];
        cell.appendChild(piece);
      }
      if (chessLastMove){
        if (chessLastMove.from.r===r&&chessLastMove.from.c===c) cell.classList.add('last-move');
        if (chessLastMove.to.r===r&&chessLastMove.to.c===c) cell.classList.add('last-move');
      }
      if (chessSelected && chessSelected.r===r && chessSelected.c===c)
        cell.classList.add('selected');
      if (chessCheckSquare && chessCheckSquare.r===r && chessCheckSquare.c===c)
        cell.classList.add('check-highlight');
      const hint = chessValidMoves.find(m=>m.to.r===r&&m.to.c===c);
      if (hint){
        cell.classList.add('hint');
        if (chessBoard[r][c]) cell.classList.add('capture');
      }
      cell.addEventListener('click', ()=>onCellClickChess(r,c));
      boardEl.appendChild(cell);
    }
  }
  let text = chessTurn==='w' ? 'Ход белых' : 'Ход чёрных';
  if (currentMode==='bot'||currentMode==='bot-free'){
    if (chessTurn==='b') text = '🤖 Думает...';
  }
  if (chessCheckSquare) text += ' — ШАХ!';
  document.getElementById('status').textContent = text;
  updateUndoButton();
}

/* ============================================================
   АНАЛИЗ ПАРТИИ
============================================================ */
let analysisState = {
  moves: [],
  index: 0
};

function startAnalysis(){
  const isCheckers = currentGame === 'checkers';
  analysisState.moves = [];
  analysisState.index = 0;

  if (isCheckers){
    const start = [];
    for (let r=0;r<8;r++){
      const row = [];
      for (let c=0;c<8;c++){
        row.push(null);
        if ((r+c)%2===1){
          if (r<3) row[c]='b';
          else if (r>4) row[c]='w';
        }
      }
      start.push(row);
    }
    analysisState.moves.push(start);

    let b = start.map(r=>r.slice());
    for (const entry of moveHistory){
      if (entry.game !== 'checkers') continue;
      const u = entry.undo;
      b[u.to.r][u.to.c] = null;
      if (u.capturedPos) b[u.capturedPos.r][u.capturedPos.c] = null;
      b[u.from.r][u.from.c] = u.newPiece || u.piece;
      analysisState.moves.push(b.map(r=>r.slice()));
    }
  } else {
    const start = [];
    for (let r=0;r<8;r++){
      const row = [];
      for (let c=0;c<8;c++) row.push(null);
      start.push(row);
    }
    const back = ['r','n','b','q','k','b','n','r'];
    for (let c=0;c<8;c++){
      start[0][c] = { type:back[c], color:'b' };
      start[1][c] = { type:'p', color:'b' };
      start[6][c] = { type:'p', color:'w' };
      start[7][c] = { type:back[c], color:'w' };
    }
    analysisState.moves.push(start);

    let b = start.map(r=>r.map(p=>p?{...p}:null));
    for (const entry of moveHistory){
      if (entry.game !== 'chess') continue;
      const b2 = b.map(r=>r.map(p=>p?{...p}:null));
      applyMoveChess(b2, entry.undo.m, {...chessCastling}, null);
      b = b2;
      analysisState.moves.push(b.map(r=>r.map(p=>p?{...p}:null)));
    }
  }
  analysisState.index = analysisState.moves.length - 1;
  showScreen('screen-analysis');
  renderAnalysis();
}

function renderAnalysis(){
  const el = document.getElementById('board-analysis');
  el.innerHTML = '';
  const size = Math.min(window.innerWidth*0.9, 420);
  el.style.width = size+'px';
  el.style.height = size+'px';

  const pos = analysisState.moves[analysisState.index];
  const isCheckers = currentGame === 'checkers';

  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const cell = document.createElement('div');
    cell.className = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
    const p = pos[r][c];
    if (p){
      const piece = document.createElement('div');
      if (isCheckers){
        piece.className = 'piece ' + (isWhite(p)?'white':'black');
        if (p==='W'||p==='B') piece.classList.add('king');
      } else {
        piece.className = 'chess-piece ' + (p.color==='w'?'white':'black');
        piece.textContent = PIECE_SYMBOLS[p.color][p.type];
      }
      cell.appendChild(piece);
    }
    el.appendChild(cell);
  }

  document.getElementById('an-counter').textContent =
    `${analysisState.index} / ${analysisState.moves.length-1}`;

  document.getElementById('an-first').disabled = analysisState.index===0;
  document.getElementById('an-prev').disabled = analysisState.index===0;
  document.getElementById('an-next').disabled =
    analysisState.index===analysisState.moves.length-1;
  document.getElementById('an-last').disabled =
    analysisState.index===analysisState.moves.length-1;

  document.getElementById('analysis-status').textContent =
    analysisState.index===0 ? 'Начальная позиция'
    : `Ход № ${analysisState.index}`;
}
function analysisStep(dir){
  analysisState.index = Math.max(0, Math.min(
    analysisState.moves.length-1, analysisState.index + dir));
  renderAnalysis();
}
function analysisGo(idx){
  if (idx === -1) analysisState.index = analysisState.moves.length-1;
  else analysisState.index = idx;
  renderAnalysis();
}
function closeAnalysis(){
  showScreen('screen-menu');
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
============================================================ */
loadState();
updateSettingsUI();
updateMenuElo();
