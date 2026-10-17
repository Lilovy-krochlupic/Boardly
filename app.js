/* ============================================================
   BOARD GAMES — app.js (часть 1/3)
   База · состояние · звуки · скины · задачи · достижения
============================================================ */

const STORAGE_KEY = 'board_games_v7';
const SAVE_KEY = 'board_games_save_v7';
const SCHEMA_VERSION = 10;

let state = {
  sound: true,
  quietMode: false,
  nightMode: false,
  timerEnabled: false,
  theme: 'light',
  skin: 'classic',
  pieceSkin: 'classic',
  menuSkin: 'classic',
  elo: 0,
  wins: 0,
  losses: 0,
  defeatedBots: { checkers:{}, chess:{}, ttt:{} },
  history: [],
  bestGames: [],
  achievements: {},
  challenges: {},
  activity: {},
  stats: {
    totalMoves:0, winStreak:0, bestWinStreak:0,
    checkersWins:0, chessWins:0, tttWins:0, queenPromotions:0,
    totalGames:0, avgMovesPerGame:0,
    whiteWins:0, blackWins:0,
    fastestWin: null
  },
  daily: null,
  daily_streak: 0,
  daily_streak_date: null,
  progressCode: generateCode(),
  playerName: 'Игрок',
  version: SCHEMA_VERSION
};

/* ============================================================
   БОТЫ
============================================================ */
const TRAINING_BOTS = [
  { id:'b1',  name:'Деревянный Джо',    elo:10,  depth:1, avatar:'🪵', style:'random',     noise:0.45, book:[] },
  { id:'b2',  name:'Оловянный солдат',  elo:50,  depth:1, avatar:'🪖', style:'random',     noise:0.35, book:[] },
  { id:'b3',  name:'Новичок Наташа',    elo:90,  depth:1, avatar:'🐣', style:'aggressive', noise:0.30, book:[] },
  { id:'b4',  name:'Стажёр Семён',      elo:130, depth:2, avatar:'🎓', style:'aggressive', noise:0.22, book:[] },
  { id:'b5',  name:'Прапорщик Паша',    elo:175, depth:2, avatar:'🎖️', style:'balanced',   noise:0.18, book:[] },
  { id:'b6',  name:'Лейтенант Лев',     elo:220, depth:2, avatar:'⭐', style:'positional', noise:0.15, book:[] },
  { id:'b7',  name:'Капитан Кира',      elo:265, depth:3, avatar:'🛡️', style:'tricky',     noise:0.18, book:[] },
  { id:'b8',  name:'Майор Макс',        elo:310, depth:4, avatar:'⚔️', style:'aggressive', noise:0.08, book:[] },
  { id:'b9',  name:'Полковник Пётр',    elo:355, depth:4, avatar:'🎯', style:'defensive',  noise:0.06, book:[] },
  { id:'b10', name:'Генерал Гена',      elo:400, depth:5, avatar:'💂', style:'positional', noise:0.04, book:[] },
  { id:'b11', name:'Маршал Мирон',      elo:450, depth:5, avatar:'🏅', style:'tricky',     noise:0.03, book:[] },
  { id:'b12', name:'Гроссмейстер Гриша',elo:500, depth:6, avatar:'👑', style:'positional', noise:0.01, book:[] }
];

const TTT_BOTS = [
  { id:'t1', name:'Случайный',  elo:50,  avatar:'🎲', level:'random' },
  { id:'t2', name:'Новичок',    elo:200, avatar:'🐣', level:'weak' },
  { id:'t3', name:'Обычный',    elo:400, avatar:'🎯', level:'medium' },
  { id:'t4', name:'Неуязвимый', elo:800, avatar:'👑', level:'perfect' }
];

const WORLD_ELO_THRESHOLD = 500;

/* ============================================================
   ДОСТИЖЕНИЯ (21)
============================================================ */
const ACHIEVEMENTS = [
  { id:'first_win',      icon:'🌟', title:'Первая победа',       desc:'Победить любого бота' },
  { id:'streak_3',       icon:'🔥', title:'На волне',            desc:'3 победы подряд' },
  { id:'streak_5',       icon:'⚡', title:'Неудержимый',         desc:'5 побед подряд' },
  { id:'streak_10',      icon:'💥', title:'Серия из 10',         desc:'10 побед подряд' },
  { id:'beat_300',       icon:'🎯', title:'Закалённый',          desc:'Победить бота с Эло ≥ 300' },
  { id:'beat_500',       icon:'👑', title:'Покоритель',          desc:'Победить Гроссмейстера' },
  { id:'world_rating',   icon:'🌍', title:'В мировом рейтинге',  desc:'Набрать 500 Эло' },
  { id:'elo_1000',       icon:'💎', title:'Тысячник',            desc:'Набрать 1000 Эло' },
  { id:'all_checkers',   icon:'⚫', title:'Мастер шашек',        desc:'Победить всех ботов в шашках' },
  { id:'all_chess',      icon:'♟️', title:'Мастер шахмат',       desc:'Победить всех ботов в шахматах' },
  { id:'all_ttt',        icon:'❌', title:'Мастер крестиков',    desc:'Победить всех ботов в крестиках' },
  { id:'marathon',       icon:'📚', title:'Марафонец',           desc:'Сыграть 25 партий' },
  { id:'veteran',        icon:'🎖️', title:'Ветеран',             desc:'Сыграть 100 партий' },
  { id:'legend',         icon:'🏛️', title:'Легенда',             desc:'Сыграть 500 партий' },
  { id:'queen_promo',    icon:'♛', title:'Королевский ход',      desc:'Провести превращение в ферзя' },
  { id:'ttt_win',        icon:'✖️', title:'Три в ряд',            desc:'Победить в крестиках-ноликах' },
  { id:'ttt_draw',       icon:'🤝', title:'Достойная ничья',     desc:'Сыграть вничью с Неуязвимым' },
  { id:'first_share',    icon:'📤', title:'Есть чем гордиться',  desc:'Поделиться результатом' },
  { id:'daily_1',        icon:'🌅', title:'Начало дня',          desc:'Выполнить ежедневную задачу' },
  { id:'daily_7',        icon:'📅', title:'Неделя подряд',       desc:'Выполнять задания 7 дней подряд' },
  { id:'collector',      icon:'💼', title:'Коллекционер',        desc:'Победить в 3 разных играх' }
];

/* ============================================================
   ЕЖЕДНЕВНАЯ ЗАДАЧА
============================================================ */
const DAILY_TASKS = [
  { id:'win_checkers',   text:'Победи бота в шашках',      type:'win_game', game:'checkers' },
  { id:'win_chess',      text:'Победи бота в шахматах',    type:'win_game', game:'chess' },
  { id:'win_ttt',        text:'Победи бота в крестиках',   type:'win_game', game:'ttt' },
  { id:'win_any_300',    text:'Победи бота с Эло ≥ 300',   type:'win_strong' },
  { id:'win_captures',   text:'Победи, сделав 5+ взятий',  type:'win_captures' },
  { id:'play_3',         text:'Сыграй 3 партии',           type:'play_count', count:3 },
  { id:'win_streak_2',   text:'Выиграй 2 партии подряд',   type:'win_streak', count:2 }
];

const TIPS = [
  '💡 В шашках взятие обязательно — если есть, ходить нельзя.',
  '💡 В шахматах центр доски важнее краёв.',
  '💡 Дамка может ходить на любое расстояние по диагонали.',
  '💡 В эндшпиле король активнее помогает пешкам.',
  '💡 Не отдавай фигуры бесплатно — сначала подумай, что будет после.',
  '💡 Ранняя рокировка защищает короля.',
  '💡 Три повторения позиции — ничья.',
  '💡 Нажимай 💡 — подсказка покажет лучший ход.',
  '💡 Тренер (🎓) объяснит, куда лучше сходить.',
  '💡 В крестиках-ноликах центр — самая сильная клетка.'
];

function todayKey(){
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function getDailyTask(){
  const today = todayKey();
  if (!state.daily || state.daily.date !== today){
    const seed = today.split('-').join('') * 1;
    const task = DAILY_TASKS[seed % DAILY_TASKS.length];
    state.daily = { date: today, taskId: task.id, progress: 0, completed: false };
    if (state.daily_streak_date){
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yKey = y.getFullYear() + '-' + (y.getMonth()+1) + '-' + y.getDate();
      if (state.daily_streak_date !== yKey) state.daily_streak = 0;
    }
    saveState();
  }
  return DAILY_TASKS.find(t => t.id === state.daily.taskId) || DAILY_TASKS[0];
}

function updateDailyProgress(event, data){
  const task = getDailyTask();
  if (state.daily.completed) return;
  let inc = 0;
  if (task.type === 'win_game' && event === 'win' && data.game === task.game) inc = 1;
  else if (task.type === 'win_strong' && event === 'win' && data.beatElo >= 300) inc = 1;
  else if (task.type === 'win_captures' && event === 'win' && data.captures >= 5) inc = 1;
  else if (task.type === 'play_count' && event === 'play') inc = 1;
  else if (task.type === 'win_streak' && event === 'win') inc = 1;
  if (inc){
    state.daily.progress += inc;
    if (state.daily.progress >= (task.count || 1)){
      state.daily.completed = true;
      state.elo += 10;
      if (state.daily_streak_date !== state.daily.date){
        state.daily_streak = (state.daily_streak || 0) + 1;
        state.daily_streak_date = state.daily.date;
      }
      unlockAchievement('daily_1');
      if (state.daily_streak >= 7) unlockAchievement('daily_7');
      toast('✅ Ежедневная задача выполнена! +10 Эло');
      playSound('achievement');
      vibrate([40,30,40,30,100]);
    }
    saveState();
  }
}

/* ============================================================
   ИСПЫТАНИЯ
============================================================ */
const CHALLENGES = [
  { id:'c1', icon:'⚔️', title:'Без потерь', desc:'Победи бота, не потеряв ни одной фишки',
    check: (ctx) => ctx.win && ctx.lostPieces === 0 },
  { id:'c2', icon:'⚡', title:'Быстрая победа', desc:'Победи за 15 ходов или меньше',
    check: (ctx) => ctx.win && ctx.moves <= 15 },
  { id:'c3', icon:'🩸', title:'Кровавая баня', desc:'Сделай 8+ взятий за партию',
    check: (ctx) => ctx.win && ctx.captures >= 8 },
  { id:'c4', icon:'🎩', title:'Мастер дамок', desc:'Доведи 2 фишки до дамки за одну партию',
    check: (ctx) => ctx.win && ctx.kingsPromoted >= 2 },
  { id:'c5', icon:'🧘', title:'Спокойствие', desc:'Победи без единого взятия',
    check: (ctx) => ctx.win && ctx.captures === 0 }
];

function checkChallenges(ctx){
  CHALLENGES.forEach(ch => {
    if (state.challenges[ch.id]) return;
    if (ch.check(ctx)){
      state.challenges[ch.id] = Date.now();
      state.elo += 15;
      toast(`🎯 Испытание «${ch.title}» пройдено! +15 Эло`);
      playSound('achievement');
      vibrate([60,40,60,40,120]);
    }
  });
  saveState();
}

/* ============================================================
   КЭШИ И ОПТИМИЗАЦИЯ
============================================================ */
let TT = new Map();
const TT_MAX = 20000;
let searchDeadline = 0;
let searchAborted = false;
let animTimer = null;
let animating = false;
let evalTimer = null;
let turnTimer = null;
let renderFrame = null;
let saveGameTimer = null;

function clearCaches(){
  TT.clear();
  searchDeadline = 0;
  searchAborted = false;
}
function checkTime(){
  if (searchDeadline && performance.now() > searchDeadline){
    searchAborted = true;
    return true;
  }
  return false;
}
function scheduleEvalUpdate(){
  if (evalTimer) return;
  evalTimer = setTimeout(()=>{
    evalTimer = null;
    updateEvalBar();
  }, 60);
}
function requestRender(){
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(()=>{
    renderFrame = null;
    render();
  });
}

/* ============================================================
   ХРАНИЛИЩЕ
============================================================ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.version !== SCHEMA_VERSION){
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    state = Object.assign(state, parsed);
    if (!state.defeatedBots) state.defeatedBots = { checkers:{}, chess:{}, ttt:{} };
    if (!state.defeatedBots.checkers) state.defeatedBots.checkers = {};
    if (!state.defeatedBots.chess) state.defeatedBots.chess = {};
    if (!state.defeatedBots.ttt) state.defeatedBots.ttt = {};
    if (!state.history) state.history = [];
    if (!state.bestGames) state.bestGames = [];
    if (!state.achievements) state.achievements = {};
    if (!state.challenges) state.challenges = {};
    if (!state.activity) state.activity = {};
    if (!state.stats) state.stats = {
      totalMoves:0, winStreak:0, bestWinStreak:0,
      checkersWins:0, chessWins:0, tttWins:0, queenPromotions:0,
      totalGames:0, avgMovesPerGame:0,
      whiteWins:0, blackWins:0, fastestWin: null
    };
    if (state.stats.tttWins === undefined) state.stats.tttWins = 0;
    if (state.stats.totalGames === undefined) state.stats.totalGames = 0;
    if (state.stats.avgMovesPerGame === undefined) state.stats.avgMovesPerGame = 0;
    if (state.stats.fastestWin === undefined) state.stats.fastestWin = null;
    if (!state.pieceSkin) state.pieceSkin = 'classic';
    if (!state.menuSkin) state.menuSkin = 'classic';
    if (state.quietMode === undefined) state.quietMode = false;
    if (state.nightMode === undefined) state.nightMode = false;
    if (state.timerEnabled === undefined) state.timerEnabled = false;
    if (!state.daily_streak) state.daily_streak = 0;
  } catch(e){ console.warn('loadState error', e); }
}

let savePending = false;
function saveState() {
  if (savePending) return;
  savePending = true;
  setTimeout(()=>{
    savePending = false;
    state.version = SCHEMA_VERSION;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
  }, 100);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i=0;i<12;i++){
    if (i>0 && i%4===0) code += '-';
    code += chars[Math.floor(Math.random()*chars.length)];
  }
  return code;
}
function encodeProgress(data){ return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
function decodeProgress(code){
  try { return JSON.parse(decodeURIComponent(escape(atob(code.trim())))); }
  catch(e){ return null; }
}

/* ============================================================
   СОХРАНЕНИЕ ПАРТИИ (дебаунс)
============================================================ */
function saveCurrentGame(){
  if (!gameActive) return;
  if (saveGameTimer) clearTimeout(saveGameTimer);
  saveGameTimer = setTimeout(()=>{
    saveGameTimer = null;
    try {
      const data = {
        game: currentGame, mode: currentMode,
        botId: activeBot ? activeBot.id : null,
        ts: Date.now()
      };
      if (currentGame === 'checkers'){
        data.board = board;
        data.turn = turn;
        data.mustCapture = mustCapture;
        data.moveHistory = moveHistory.map(m=>({ game: m.game, undo: m.undo }));
      } else if (currentGame === 'chess'){
        data.board = chessBoard;
        data.turn = chessTurn;
        data.castling = {...chessCastling};
        data.enPassant = chessEnPassant;
        data.fifty = capturedFifty;
        data.moveHistory = moveHistory.map(m=>({
          game: m.game, undo: m.undo,
          enPassantBefore: m.enPassantBefore, castlingBefore: m.castlingBefore
        }));
      } else if (currentGame === 'ttt'){
        data.board = tttBoard;
        data.turn = tttTurn;
        data.moveHistory = moveHistory.map(m=>({
          game: m.game, idx: m.idx, player: m.player, turnBefore: m.turnBefore
        }));
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e){ console.warn('save error', e); }
  }, 200);
}
function clearSavedGame(){ try { localStorage.removeItem(SAVE_KEY); } catch(e){} }
function hasSavedGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    return d && d.game;
  } catch(e){ return false; }
}
function updateResumeButton(){
  const btn = document.getElementById('resume-btn');
  const info = document.getElementById('resume-info');
  if (!btn || !info) return;
  if (!hasSavedGame()){ btn.style.display = 'none'; return; }
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    const gameLabel = d.game === 'checkers' ? 'Шашки'
      : d.game === 'chess' ? 'Шахматы' : 'Крестики-нолики';
    const turnLabel = d.game === 'checkers'
      ? (d.turn === 'w' ? 'ваш ход' : 'ход бота')
      : d.game === 'chess'
      ? (d.turn === 'w' ? 'ваш ход' : 'ход бота')
      : (d.turn === 'X' ? 'ваш ход' : 'ход бота');
    info.textContent = gameLabel + ' · ' + turnLabel;
    btn.style.display = 'flex';
  } catch(e){ btn.style.display = 'none'; }
}

function resumeGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw){ toast('Нет сохранённой партии'); return; }
    const d = JSON.parse(raw);
    currentGame = d.game;
    currentMode = d.mode || 'local';
    activeBot = null;
    if (d.botId){
      const allBots = [...TRAINING_BOTS, ...TTT_BOTS];
      activeBot = allBots.find(b=>b.id===d.botId) || null;
      if (d.botId === 'free'){
        activeBot = { id:'free', name:'Свободный бот', elo:1000, depth:2,
          avatar:'🎲', style:'balanced', noise:0.1, book:[] };
      }
    }
    gameActive = true;
    moveHistory = [];
    capturedFifty = d.fifty || 0;
    positionCounts = {};
    clearCaches();
    if (animTimer){ clearTimeout(animTimer); animTimer = null; }
    animating = false;

    const boardEl = document.getElementById('board');
    const tttEl = document.getElementById('ttt-board');
    const evalBar = document.getElementById('eval-bar');

    if (currentGame === 'ttt'){
      boardEl.style.display = 'none';
      tttEl.style.display = 'grid';
      evalBar.style.display = 'none';
      tttBoard = d.board.slice();
      tttTurn = d.turn;
      tttWinner = null; tttWinLine = null;
      tttGameActive = true; tttBotBusy = false;
      moveHistory = (d.moveHistory || []).map(m=>({
        game:'ttt', idx: m.idx, player: m.player, turnBefore: m.turnBefore
      }));
    } else if (currentGame === 'checkers'){
      boardEl.style.display = 'grid';
      tttEl.style.display = 'none';
      evalBar.style.display = 'none';
      board = d.board;
      turn = d.turn;
      mustCapture = d.mustCapture || false;
      selected = null; validMoves = []; lastMove = null;
      moveHistory = (d.moveHistory || []).map(m=>({ game:'checkers', undo: m.undo }));
    } else {
      boardEl.style.display = 'grid';
      tttEl.style.display = 'none';
      evalBar.style.display = 'block';
      chessBoard = d.board;
      chessTurn = d.turn;
      chessCastling = d.castling || { wK:true,wQ:true,bK:true,bQ:true };
      chessEnPassant = d.enPassant || null;
      chessSelected = null; chessValidMoves = [];
      chessCheckSquare = null;
      chessGameActive = true;
      countPosition();
      moveHistory = (d.moveHistory || []).map(m=>({
        game:'chess', undo: m.undo,
        enPassantBefore: m.enPassantBefore, castlingBefore: m.castlingBefore
      }));
    }
    render();
    showScreen('screen-game');
    document.getElementById('game-title').textContent =
      currentGame === 'checkers' ? 'Шашки · продолжение'
      : currentGame === 'chess' ? 'Шахматы · продолжение'
      : 'Крестики-нолики · продолжение';
    updateUndoButton();
    toast('🎮 Партия восстановлена');

    if ((currentGame==='checkers' && turn==='b' && (currentMode==='bot'||currentMode==='bot-free'))
      || (currentGame==='chess' && chessTurn==='b' && (currentMode==='bot'||currentMode==='bot-free'))
      || (currentGame==='ttt' && tttTurn==='O' && currentMode==='bot')){
      setTimeout(()=>{
        if (currentGame === 'checkers') botMoveCheckers();
        else if (currentGame === 'chess') botMoveChess();
        else { tttBotBusy = true; botMoveTTT(); tttBotBusy = false; }
      }, 400);
    }
  } catch(e){ console.warn(e); toast('❌ Не удалось восстановить'); }
}

/* ============================================================
   ЭКРАНЫ
============================================================ */
function showScreen(id){
  const current = document.querySelector('.screen.active');
  const next = document.getElementById(id);
  if (!next || current === next) return;
  if (current) current.classList.remove('active');
  next.classList.add('active');
  requestAnimationFrame(()=>{ next.scrollTop = 0; });
  vibrate(5);
  if (id === 'screen-menu'){
    updateResumeButton();
    setTimeout(showRandomTip, 1200);
  }
}

let toastTimer;
function toast(msg){
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 1800);
}

function trainerToast(msg){
  const el = document.getElementById('trainer-toast');
  const txt = document.getElementById('trainer-toast-text');
  if (!el || !txt) return;
  txt.textContent = msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2400);
}

function showRandomTip(){
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = tip;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 4500);
}

/* ============================================================
   ЗВУК — с шумовыми буферами
============================================================ */
let audioCtx = null;
function getAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
  }
  if (audioCtx && audioCtx.state === 'suspended'){
    try { audioCtx.resume(); } catch(e){}
  }
  return audioCtx;
}
function playTone(freq, dur, type='sine', vol=0.15, delay=0){
  if (!state.sound) return;
  const ctx = getAudio(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.02);
  } catch(e){}
}
function playSound(type){
  if (!state.sound) return;
  if (state.quietMode && (type === 'move' || type === 'capture' || type === 'select')) return;
  const volMul = state.nightMode ? 0.5 : 1;
  const ctx = getAudio(); if (!ctx) return;
  const now = ctx.currentTime;

  const tone = (freq, dur, wave='sine', vol=0.15, delay=0) => {
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      const t = now + delay;
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * volMul, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch(e){}
  };

  const woodKnock = (freq=150, dur=0.12, vol=0.2, delay=0) => {
    try {
      const sr = ctx.sampleRate;
      const len = Math.floor(sr * dur);
      const buf = ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      for (let i=0; i<len; i++){
        const t = i / sr;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 35);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = freq * 6;
      filter.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.value = vol * volMul;
      src.connect(filter); filter.connect(g); g.connect(ctx.destination);
      src.start(now + delay);
      const osc = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc.connect(g2); g2.connect(ctx.destination);
      const t2 = now + delay;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t2);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t2 + dur);
      g2.gain.setValueAtTime(0, t2);
      g2.gain.linearRampToValueAtTime(vol * volMul * 0.8, t2 + 0.003);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + dur);
      osc.start(t2); osc.stop(t2 + dur + 0.02);
    } catch(e){}
  };

  const reverb = (freq, dur, vol=0.1, delay=0) => {
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const d = ctx.createDelay();
      d.delayTime.value = 0.09;
      const fb = ctx.createGain();
      fb.gain.value = 0.25;
      osc.connect(g); g.connect(ctx.destination); g.connect(d);
      d.connect(fb); fb.connect(d);
      const t = now + delay;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * volMul, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.3);
    } catch(e){}
  };

  switch(type){
    case 'select':
      tone(880, 0.03, 'sine', 0.04);
      tone(1320, 0.02, 'sine', 0.02, 0.01);
      break;
    case 'move':
      woodKnock(180, 0.10, 0.22);
      tone(120, 0.10, 'sine', 0.06, 0.02);
      break;
    case 'capture':
      woodKnock(240, 0.08, 0.24);
      tone(420, 0.06, 'square', 0.06, 0.01);
      tone(80, 0.22, 'sine', 0.14, 0.05);
      break;
    case 'check':
      tone(880, 0.10, 'triangle', 0.10);
      tone(1174, 0.10, 'triangle', 0.10, 0.08);
      tone(1760, 0.14, 'sine', 0.08, 0.16);
      reverb(880, 0.3, 0.06, 0.05);
      break;
    case 'win':
      [523, 659, 784, 1046, 1318].forEach((f,i)=>{
        tone(f, 0.25, 'sine', 0.12, i*0.09);
        reverb(f, 0.35, 0.04, i*0.09);
      });
      tone(1568, 0.35, 'sine', 0.10, 0.55);
      break;
    case 'lose':
      [440, 415, 349, 262].forEach((f,i)=>tone(f, 0.25, 'sine', 0.10, i*0.11));
      reverb(220, 0.4, 0.06, 0.5);
      break;
    case 'draw':
      tone(392, 0.20, 'sine', 0.08);
      tone(392, 0.20, 'sine', 0.08, 0.25);
      tone(330, 0.35, 'sine', 0.06, 0.5);
      break;
    case 'achievement':
      [659, 784, 988, 1319].forEach((f,i)=>tone(f, 0.15, 'triangle', 0.10, i*0.07));
      tone(1568, 0.30, 'sine', 0.10, 0.35);
      reverb(1319, 0.4, 0.05, 0.2);
      break;
    case 'timeout':
      tone(220, 0.20, 'square', 0.12);
      tone(220, 0.20, 'square', 0.12, 0.35);
      break;
    case 'click':
      tone(1200, 0.02, 'sine', 0.03);
      break;
  }
}
function vibrate(pattern){
  if (state.sound && navigator.vibrate){ try { navigator.vibrate(pattern); } catch(e){} }
}

/* ============================================================
   НАСТРОЙКИ
============================================================ */
function applyTheme(){
  document.body.classList.toggle('theme-dark', state.theme==='dark');
  document.body.classList.toggle('theme-light', state.theme==='light');
  const l = document.getElementById('theme-light-btn');
  const d = document.getElementById('theme-dark-btn');
  if (l) l.classList.toggle('active', state.theme==='light');
  if (d) d.classList.toggle('active', state.theme==='dark');
}
function applySkin(){
  document.body.classList.remove('skin-classic','skin-wood','skin-marble','skin-emerald','skin-rose','skin-neon');
  document.body.classList.add('skin-' + (state.skin||'classic'));
  ['classic','wood','marble','emerald','rose','neon'].forEach(s=>{
    const btn = document.getElementById('skin-'+s+'-btn');
    if (btn) btn.classList.toggle('active', state.skin===s);
  });
}
function applyPieceSkin(){
  document.body.classList.remove('piece-skin-classic','piece-skin-glass','piece-skin-metal','piece-skin-neon','piece-skin-wood-piece');
  document.body.classList.add('piece-skin-' + (state.pieceSkin||'classic'));
  ['classic','glass','metal','neon','wood-piece'].forEach(s=>{
    const btn = document.getElementById('piece-'+s+'-btn');
    if (btn) btn.classList.toggle('active', state.pieceSkin===s);
  });
}
function applyMenuSkin(){
  document.body.classList.remove('menu-classic','menu-marble','menu-night','menu-sakura','menu-forest','menu-retro');
  document.body.classList.add('menu-' + (state.menuSkin||'classic'));
  ['classic','marble','night','sakura','forest','retro'].forEach(s=>{
    const btn = document.getElementById('menu-'+s+'-btn');
    if (btn) btn.classList.toggle('active', state.menuSkin===s);
  });
}
function checkNightMode(){
  if (!state.nightMode) return;
  const hour = new Date().getHours();
  const shouldBeDark = hour >= 22 || hour < 7;
  if (shouldBeDark && state.theme !== 'dark'){
    state.theme = 'dark';
    applyTheme();
  } else if (!shouldBeDark && state.theme !== 'light'){
    state.theme = 'light';
    applyTheme();
  }
}
function detectLowPerf(){
  const hc = navigator.hardwareConcurrency || 4;
  const isSlow = hc <= 4;
  if (isSlow){
    document.body.classList.add('low-perf');
  }
}
detectLowPerf();

function setTheme(t){ state.theme=t; applyTheme(); saveState(); playSound('select'); }
function setSkin(s){ state.skin=s; applySkin(); saveState(); playSound('select'); }
function setPieceSkin(s){ state.pieceSkin=s; applyPieceSkin(); saveState(); playSound('select'); }
function setMenuSkin(s){ state.menuSkin=s; applyMenuSkin(); saveState(); playSound('select'); }
function toggleSound(){
  state.sound = !state.sound;
  const t = document.getElementById('toggle-sound');
  if (t) t.classList.toggle('on', state.sound);
  saveState();
  if (state.sound) playSound('select');
}
function toggleQuiet(){
  state.quietMode = !state.quietMode;
  const t = document.getElementById('toggle-quiet');
  if (t) t.classList.toggle('on', state.quietMode);
  saveState();
  toast(state.quietMode ? '🔇 Тихий режим' : '🔊 Обычный звук');
}
function toggleNight(){
  state.nightMode = !state.nightMode;
  const t = document.getElementById('toggle-night');
  if (t) t.classList.toggle('on', state.nightMode);
  saveState();
  checkNightMode();
  toast(state.nightMode ? '🌚 Ночной режим' : '☀️ Обычный режим');
}
function toggleTimer(){
  state.timerEnabled = !state.timerEnabled;
  const t = document.getElementById('toggle-timer');
  if (t) t.classList.toggle('on', state.timerEnabled);
  saveState();
  toast(state.timerEnabled ? '⏱ Таймер 30 сек' : 'Таймер выключен');
}
function updateSettingsUI(){
  const t = document.getElementById('toggle-sound');
  if (t) t.classList.toggle('on', state.sound);
  const q = document.getElementById('toggle-quiet');
  if (q) q.classList.toggle('on', state.quietMode);
  const n = document.getElementById('toggle-night');
  if (n) n.classList.toggle('on', state.nightMode);
  const tm = document.getElementById('toggle-timer');
  if (tm) tm.classList.toggle('on', state.timerEnabled);
  applyTheme(); applySkin(); applyPieceSkin(); applyMenuSkin();
  const pc = document.getElementById('progress-code');
  if (pc) pc.textContent = state.progressCode;
}

/* ============================================================
   ЭЛО И ТИТУЛЫ
============================================================ */
function updateElo(wins=0, losses=0, opponentElo=1000){
  if (wins){
    let bonus;
    if (opponentElo < 100) bonus = 1;
    else if (opponentElo < 200) bonus = 2;
    else if (opponentElo < 300) bonus = 3;
    else if (opponentElo < 400) bonus = 5;
    else if (opponentElo < 500) bonus = 8;
    else bonus = 12;
    state.elo += bonus * wins;
  }
  if (losses){
    let penalty = 1;
    if (opponentElo < 100) penalty = 3;
    else if (opponentElo < 200) penalty = 2;
    else if (opponentElo < 300) penalty = 2;
    else penalty = 1;
    state.elo = Math.max(0, state.elo - penalty * losses);
  }
  saveState();
  updateMenuElo();
}

function getEloTitle(elo){
  if (elo < 100) return 'Новичок';
  if (elo < 300) return 'Любитель';
  if (elo < 500) return 'Игрок';
  if (elo < 800) return 'Мастер';
  if (elo < 1200) return 'Гроссмейстер';
  if (elo < 2000) return 'Легенда';
  return 'Гений Boardly';
}

function updateMenuElo(){
  const el = document.getElementById('menu-elo');
  if (el) el.textContent = state.elo;
  const title = document.getElementById('menu-title-badge');
  if (title) title.textContent = getEloTitle(state.elo);
  const stats = document.getElementById('menu-stats');
  if (stats){
    const total = state.history.length;
    const wins = state.stats.checkersWins + state.stats.chessWins + state.stats.tttWins;
    stats.textContent = `${total} партий · ${wins} побед`;
  }
  const dt = document.getElementById('daily-task');
  const dtText = document.getElementById('daily-text');
  const dtProg = document.getElementById('daily-progress');
  if (dt && dtText && dtProg){
    const task = getDailyTask();
    dt.style.display = 'block';
    dtText.textContent = task.text;
    if (state.daily.completed){
      dtProg.textContent = '✅ Выполнено · +10 Эло';
      dtProg.style.color = 'var(--success)';
    } else {
      const need = task.count || 1;
      dtProg.textContent = `${state.daily.progress} / ${need}`;
      dtProg.style.color = 'var(--accent)';
    }
  }
}

/* ============================================================
   ПРОГРЕСС
============================================================ */
function exportProgress(){
  const data = {
    code: state.progressCode,
    elo: state.elo, wins: state.wins, losses: state.losses,
    defeatedBots: state.defeatedBots,
    history: state.history.slice(-50),
    bestGames: state.bestGames,
    achievements: state.achievements,
    challenges: state.challenges,
    activity: state.activity,
    stats: state.stats,
    daily: state.daily,
    daily_streak: state.daily_streak,
    daily_streak_date: state.daily_streak_date,
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
  if (raw.includes('#')){
    const [code, enc] = raw.split('#');
    data = decodeProgress(enc);
    if (data) data.code = code;
  } else data = decodeProgress(raw);
  if (!data || typeof data.elo !== 'number'){ toast('❌ Неверный код'); return; }
  state.elo = data.elo;
  state.wins = data.wins||0;
  state.losses = data.losses||0;
  state.defeatedBots = data.defeatedBots || { checkers:{}, chess:{}, ttt:{} };
  if (!state.defeatedBots.ttt) state.defeatedBots.ttt = {};
  state.history = data.history || [];
  state.bestGames = data.bestGames || [];
  state.achievements = data.achievements || {};
  state.challenges = data.challenges || {};
  state.activity = data.activity || {};
  state.stats = data.stats || state.stats;
  state.daily = data.daily || null;
  state.daily_streak = data.daily_streak || 0;
  state.daily_streak_date = data.daily_streak_date || null;
  state.playerName = data.playerName || 'Игрок';
  state.progressCode = data.code || generateCode();
  saveState(); updateSettingsUI(); updateMenuElo();
  closeImportModal();
  toast('✅ Прогресс загружен!');
}
function resetProgress(){
  if (!confirm('Сбросить весь прогресс?')) return;
  state.elo = 0; state.wins = 0; state.losses = 0;
  state.defeatedBots = { checkers:{}, chess:{}, ttt:{} };
  state.history = []; state.bestGames = [];
  state.achievements = {}; state.challenges = {};
  state.activity = {};
  state.stats = { totalMoves:0, winStreak:0, bestWinStreak:0,
    checkersWins:0, chessWins:0, tttWins:0, queenPromotions:0,
    totalGames:0, avgMovesPerGame:0, whiteWins:0, blackWins:0,
    fastestWin: null };
  state.daily = null; state.daily_streak = 0; state.daily_streak_date = null;
  state.progressCode = generateCode();
  saveState(); updateSettingsUI(); updateMenuElo();
  toast('🗑️ Сброшено');
}

/* ============================================================
   ДОСТИЖЕНИЯ
============================================================ */
function unlockAchievement(id){
  if (state.achievements[id]) return;
  const ach = ACHIEVEMENTS.find(a=>a.id===id);
  if (!ach) return;
  state.achievements[id] = Date.now();
  saveState();
  showAchievementToast(ach);
  playSound('achievement');
  vibrate([40,30,40,30,80]);
}
function showAchievementToast(ach){
  const el = document.getElementById('ach-toast');
  if (!el) return;
  document.getElementById('ach-toast-icon').textContent = ach.icon;
  document.getElementById('ach-toast-title').textContent = 'Достижение: ' + ach.title;
  document.getElementById('ach-toast-desc').textContent = ach.desc;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 3200);
}
function checkAchievements(context){
  const s = state.stats;
  if (s.totalMoves >= 1 && (s.checkersWins + s.chessWins + s.tttWins) >= 1) unlockAchievement('first_win');
  if (s.winStreak >= 3) unlockAchievement('streak_3');
  if (s.winStreak >= 5) unlockAchievement('streak_5');
  if (s.winStreak >= 10) unlockAchievement('streak_10');
  if (context && context.beatElo >= 300) unlockAchievement('beat_300');
  if (context && context.beatElo >= 500) unlockAchievement('beat_500');
  if (state.elo >= WORLD_ELO_THRESHOLD) unlockAchievement('world_rating');
  if (state.elo >= 1000) unlockAchievement('elo_1000');
  if (Object.keys(state.defeatedBots.checkers).length >= 12) unlockAchievement('all_checkers');
  if (Object.keys(state.defeatedBots.chess).length >= 12) unlockAchievement('all_chess');
  if (Object.keys(state.defeatedBots.ttt).length >= 4) unlockAchievement('all_ttt');
  if (state.history.length >= 25) unlockAchievement('marathon');
  if (state.history.length >= 100) unlockAchievement('veteran');
  if (state.history.length >= 500) unlockAchievement('legend');
  if (s.queenPromotions >= 1) unlockAchievement('queen_promo');
  if (s.tttWins >= 1) unlockAchievement('ttt_win');
  if (s.checkersWins >= 1 && s.chessWins >= 1 && s.tttWins >= 1) unlockAchievement('collector');
}
function showAchievements(){
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
   ИСТОРИЯ И ЛУЧШИЕ ПАРТИИ
============================================================ */
function recordGame({game, mode, opponent, result, moves, eloDelta}){
  if (eloDelta !== 0){
    const sign = eloDelta > 0 ? '+' : '';
    setTimeout(()=>{
      toast(`Эло ${sign}${eloDelta} · теперь ${state.elo}`);
    }, 800);
  }

  const entry = { date: Date.now(), game, mode, opponent, result, moves,
    eloDelta: eloDelta || 0, eloAfter: state.elo };

  if (result === 'win' && moves <= 15) entry.nickname = '⚡ Быстрая победа';
  else if (result === 'win' && moves >= 60) entry.nickname = '🧠 Эпичная партия';
  else if (result === 'lose' && moves >= 60) entry.nickname = '😤 Упорное поражение';
  else if (result === 'draw') entry.nickname = '🤝 Боевая ничья';

  state.history.unshift(entry);
  if (state.history.length > 100) state.history.length = 100;

  if (result === 'win'){
    state.stats.winStreak++;
    if (state.stats.winStreak > state.stats.bestWinStreak)
      state.stats.bestWinStreak = state.stats.winStreak;
    if (!state.stats.fastestWin || moves < state.stats.fastestWin){
      state.stats.fastestWin = moves;
      toast(`⚡ Новый рекорд! Победа за ${moves} ходов`);
    }
  } else if (result === 'lose'){
    state.stats.winStreak = 0;
  }
  state.stats.totalMoves += moves;
  state.stats.totalGames++;
  state.stats.avgMovesPerGame = Math.round(state.stats.totalMoves / state.stats.totalGames);

  const tk = todayKey();
  state.activity[tk] = (state.activity[tk] || 0) + 1;

  const score = moves + (result === 'win' ? 5 : 0);
  if (score > 20){
    state.bestGames.unshift({ ...entry, score });
    state.bestGames.sort((a,b)=>b.score - a.score);
    if (state.bestGames.length > 5) state.bestGames.length = 5;
  }
  saveState();
}
function showHistory(){
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  if (state.history.length === 0){
    list.innerHTML = '<div class="empty-note">Пока нет сыгранных партий</div>';
    showScreen('screen-history');
    return;
  }
  state.history.forEach(h=>{
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
    const gameLabel = h.game === 'checkers' ? '⚫ Шашки'
      : h.game === 'chess' ? '♟️ Шахматы' : '❌ Крестики-нолики';
    const resultLabel = h.result==='win' ? 'Победа'
      : h.result==='lose' ? 'Поражение' : 'Ничья';
    const sign = h.eloDelta > 0 ? '+' : '';
    const eloCls = h.eloDelta > 0 ? 'plus' : (h.eloDelta < 0 ? 'minus' : '');
    const row = document.createElement('div');
    row.className = 'hist-row';
    row.innerHTML = `
      <div class="top">
        <span>${gameLabel} · ${h.opponent}</span>
        <span class="result ${h.result}">${resultLabel}</span>
      </div>
      ${h.nickname ? `<div style="font-size:11px;color:var(--brass);margin-top:2px;font-style:italic">${h.nickname}</div>` : ''}
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
function showBestGames(){
  const list = document.getElementById('best-list');
  list.innerHTML = '';
  if (state.bestGames.length === 0){
    list.innerHTML = '<div class="empty-note">Пока нет эпичных партий.</div>';
    showScreen('screen-best');
    return;
  }
  state.bestGames.forEach((h, idx) => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
    const gameLabel = h.game === 'checkers' ? '⚫ Шашки'
      : h.game === 'chess' ? '♟️ Шахматы' : '❌ Крестики-нолики';
    const resultLabel = h.result==='win' ? '🏆 Победа'
      : h.result==='lose' ? 'Поражение' : 'Ничья';
    const row = document.createElement('div');
    row.className = 'best-row';
    row.innerHTML = `
      <div class="head">
        <span>#${idx+1} ${gameLabel}</span>
        <span>${resultLabel}</span>
      </div>
      <div class="meta">
        <span>${dateStr}</span>
        <span>${h.moves} ходов</span>
        <span>${h.opponent}</span>
      </div>
    `;
    list.appendChild(row);
  });
  showScreen('screen-best');
}

/* ============================================================
   ПОДЕЛИТЬСЯ
============================================================ */
let lastResult = null;

function shareResult(game, opponent, result, moves){
  const gameLabel = game === 'checkers' ? 'Шашки'
    : game === 'chess' ? 'Шахматы' : 'Крестики-нолики';
  const resultLabel = result === 'win' ? '🏆 Победа'
    : result === 'lose' ? '😢 Поражение' : '🤝 Ничья';
  const text = `${resultLabel} в ${gameLabel}\n` +
    `Соперник: ${opponent}\n` +
    `Ходов: ${moves}\n` +
    `Мой Эло: ${state.elo}\n` +
    `Играю в Boardly ♟️⚫❌`;

  if (navigator.share){
    navigator.share({ title:'Boardly — результат', text })
      .then(()=>{ unlockAchievement('first_share'); })
      .catch(()=>{});
  } else {
    copyToClipboard(text);
    toast('📋 Результат скопирован!');
    unlockAchievement('first_share');
  }
}
function shareLastResult(){
  if (!lastResult){ toast('Нет данных'); return; }
  shareResult(lastResult.game, lastResult.opponent, lastResult.result, lastResult.moves);
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
============================================================ */
loadState();
updateSettingsUI();
updateMenuElo();
checkNightMode();
/* ============================================================
   ПРОФИЛЬ
============================================================ */
function showProfile(){
  renderProfile();
  showScreen('screen-profile');
}

function renderProfile(){
  document.getElementById('profile-name').textContent = state.playerName;
  document.getElementById('profile-title').textContent = getEloTitle(state.elo);
  document.getElementById('profile-elo').textContent = state.elo;

  const grid = document.getElementById('profile-stats');
  grid.innerHTML = '';
  const s = state.stats;
  const totalWins = s.checkersWins + s.chessWins + s.tttWins;
  const totalGames = state.history.length;
  const winRate = totalGames > 0 ? Math.round(totalWins / totalGames * 100) : 0;
  const bestStreak = s.bestWinStreak || 0;

  const cards = [
    { num: totalGames, lbl: 'Партий' },
    { num: totalWins, lbl: 'Побед' },
    { num: winRate + '%', lbl: 'Winrate' },
    { num: bestStreak, lbl: 'Лучшая серия' },
    { num: s.checkersWins, lbl: 'В шашках' },
    { num: s.chessWins, lbl: 'В шахматах' },
    { num: s.tttWins, lbl: 'В крестиках' },
    { num: s.avgMovesPerGame || 0, lbl: 'Ср. ходов' },
    { num: s.fastestWin ? s.fastestWin + ' х.' : '—', lbl: 'Рекорд скорости' },
    { num: state.elo, lbl: 'Текущий Эло' }
  ];
  cards.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<div class="num">${c.num}</div><div class="lbl">${c.lbl}</div>`;
    grid.appendChild(card);
  });

  renderEloGraph();
  renderCalendar();
}

function renderEloGraph(){
  const canvas = document.getElementById('elo-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const games = state.history.filter(h=>h.eloAfter !== undefined).slice(0, 30).reverse();
  if (games.length < 2){
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-dim');
    ctx.font = '12px Manrope';
    ctx.textAlign = 'center';
    ctx.fillText('Недостаточно данных для графика', w/2, h/2);
    return;
  }

  const elos = [0, ...games.map(g=>g.eloAfter)];
  const minE = Math.min(...elos);
  const maxE = Math.max(...elos);
  const range = Math.max(50, maxE - minE);
  const pad = 20;
  const stepX = (w - pad*2) / (elos.length - 1);
  const points = elos.map((e, i) => ({
    x: pad + i * stepX,
    y: h - pad - ((e - minE) / range) * (h - pad*2)
  }));

  ctx.strokeStyle = 'rgba(184,137,74,.15)';
  ctx.lineWidth = 1;
  for (let i=0; i<=4; i++){
    const y = pad + (h - pad*2) * (i/4);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(139,35,50,.35)');
  grad.addColorStop(1, 'rgba(139,35,50,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(points[0].x, h - pad);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length-1].x, h - pad);
  ctx.closePath();
  ctx.fill();

  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#8b2332';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  points.forEach(p => {
    ctx.fillStyle = '#f4ecd8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-dim');
  ctx.font = '10px Manrope';
  ctx.textAlign = 'left';
  ctx.fillText(maxE + '', pad, pad + 4);
  ctx.fillText(minE + '', pad, h - pad + 4);
}

function renderCalendar(){
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  const today = new Date();
  const days = 105;
  for (let i = days - 1; i >= 0; i--){
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    const count = state.activity[key] || 0;
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (count === 1) cell.classList.add('l1');
    else if (count === 2) cell.classList.add('l2');
    else if (count === 3) cell.classList.add('l3');
    else if (count >= 4) cell.classList.add('l4');
    cell.title = `${key}: ${count} партий`;
    grid.appendChild(cell);
  }
}

/* ============================================================
   ИСПЫТАНИЯ — ЭКРАН
============================================================ */
function showChallenges(){
  const list = document.getElementById('challenge-list');
  list.innerHTML = '';
  CHALLENGES.forEach(ch=>{
    const done = !!state.challenges[ch.id];
    const card = document.createElement('div');
    card.className = 'challenge-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="ico">${ch.icon}</div>
      <div class="info">
        <div class="ttl">${ch.title}</div>
        <div class="dsc">${ch.desc}</div>
      </div>
      <div class="status">${done ? '✓ Пройдено' : 'Не пройдено'}</div>
    `;
    list.appendChild(card);
  });
  showScreen('screen-challenges');
}

/* ============================================================
   РЕЙТИНГ
============================================================ */
let currentRatingTab = 'training';
function showRating(){ switchRatingTab(currentRatingTab); showScreen('screen-rating'); }
function switchRatingTab(tab){
  currentRatingTab = tab;
  document.getElementById('tab-training').classList.toggle('active', tab==='training');
  document.getElementById('tab-world').classList.toggle('active', tab==='world');
  renderRating();
}
function renderRating(){
  const c = document.getElementById('rating-content');
  if (currentRatingTab === 'training') renderTraining(c);
  else renderWorld(c);
}
function renderTraining(c){
  c.innerHTML = '';
  const key = currentGame === 'chess' ? 'chess'
    : currentGame === 'ttt' ? 'ttt' : 'checkers';
  const bots = state.defeatedBots[key] || {};
  const total = key === 'ttt' ? TTT_BOTS.length : 12;
  const defeated = Object.keys(bots).length;

  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.innerHTML = `<div style="width:${defeated/total*100}%"></div>`;
  c.appendChild(bar);

  const note = document.createElement('div');
  note.className = 'empty-note';
  note.style.marginTop = '0'; note.style.marginBottom = '12px';
  note.textContent = `Побеждено: ${defeated} / ${total}`;
  c.appendChild(note);

  const list = document.createElement('div');
  list.className = 'rating-list';
  const botsArr = key === 'ttt' ? TTT_BOTS : TRAINING_BOTS;
  botsArr.forEach((bot, i)=>{
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

  const locked = document.createElement('div');
  locked.className = 'empty-note';
  if (state.elo >= WORLD_ELO_THRESHOLD){
    locked.style.color = 'var(--accent)';
    locked.style.fontWeight = '700';
    locked.textContent = '🌍 Доступен мировой рейтинг!';
  } else {
    locked.textContent = `До мирового рейтинга: ${WORLD_ELO_THRESHOLD - state.elo} Эло`;
  }
  c.appendChild(locked);
}
function renderWorld(c){
  c.innerHTML = '';
  if (state.elo < WORLD_ELO_THRESHOLD){
    c.innerHTML = `<div class="empty-note">
      🔒 Мировой рейтинг откроется при <b>${WORLD_ELO_THRESHOLD} Эло</b>.<br><br>
      Сейчас у вас <b>${state.elo}</b>.<br>
      Нужно ещё <b>${WORLD_ELO_THRESHOLD - state.elo}</b>.
    </div>`;
    return;
  }
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
  note.textContent = 'Пока в мировом рейтинге только вы.';
  c.appendChild(note);
}

/* ============================================================
   ВЫБОР ИГРЫ И РЕЖИМА
============================================================ */
let currentGame = 'checkers';
let currentMode = 'local';
let activeBot = null;

function openGameSelect(game){
  currentGame = game;
  document.getElementById('select-title').textContent =
    game === 'checkers' ? 'Шашки'
    : game === 'chess' ? 'Шахматы' : 'Крестики-нолики';
  const sub = document.getElementById('bot-subtitle');
  if (sub) sub.textContent = game === 'ttt' ? '4 уровня сложности' : '12 соперников · Эло';
  showScreen('screen-select');
}
function startLocal(){ currentMode = 'local'; startGame(); }
function showBotSelect(){
  document.getElementById('bots-title').textContent =
    currentGame === 'checkers' ? 'Соперник: шашки'
    : currentGame === 'chess' ? 'Соперник: шахматы' : 'Соперник: крестики-нолики';
  const list = document.getElementById('bot-list');
  list.innerHTML = '';

  if (currentGame === 'ttt'){
    TTT_BOTS.forEach((bot, i)=>{
      const row = document.createElement('div');
      row.className = 'rating-row';
      row.innerHTML = `
        <div class="rank">#${i+1}</div>
        <div class="name">${bot.avatar} ${bot.name}</div>
        <div class="score">${bot.elo}</div>`;
      row.style.cursor = 'pointer';
      row.onclick = ()=>{ currentMode='bot'; startGame(bot); };
      list.appendChild(row);
    });
    showScreen('screen-bots');
    return;
  }

  TRAINING_BOTS.forEach((bot, i)=>{
    const row = document.createElement('div');
    row.className = 'rating-row';
    row.innerHTML = `
      <div class="rank">#${i+1}</div>
      <div class="name">${bot.avatar} ${bot.name}</div>
      <div class="score">${bot.elo}</div>`;
    row.style.cursor = 'pointer';
    row.onclick = ()=>{ currentMode='bot'; startGame(bot); };
    list.appendChild(row);
  });

  const free = document.createElement('div');
  free.className = 'rating-row';
  free.innerHTML = `<div class="rank">🎲</div>
    <div class="name">Свободная игра (без рейтинга)</div>
    <div class="score">—</div>`;
  free.style.cursor = 'pointer';
  free.onclick = ()=>{
    currentMode = 'bot-free';
    startGame({ id:'free', name:'Свободный бот', elo:1000, depth:2,
      avatar:'🎲', style:'balanced', noise:0.1, book:[] });
  };
  list.appendChild(free);
  showScreen('screen-bots');
}

/* ============================================================
   БОТ-ТРЕНЕР
============================================================ */
let trainerMode = false;
let trainerLastAdvice = '';

function toggleTrainer(){
  if (!gameActive) return;
  trainerMode = !trainerMode;
  const btn = document.getElementById('trainer-btn');
  if (btn) btn.classList.toggle('active', trainerMode);
  toast(trainerMode ? '🎓 Тренер включён' : 'Тренер выключен');
  if (trainerMode) trainerAdvise();
}

function trainerAdvise(){
  if (!trainerMode || !gameActive) return;

  let isPlayerTurn = false;
  if (currentGame === 'checkers'){
    isPlayerTurn = (turn === 'w') || (currentMode === 'local');
  } else if (currentGame === 'chess'){
    isPlayerTurn = (chessTurn === 'w') || (currentMode === 'local');
  } else {
    isPlayerTurn = (tttTurn === 'X') || (currentMode === 'local');
  }
  if (!isPlayerTurn) return;

  let advice = '';

  if (currentGame === 'checkers'){
    if ((currentMode==='bot' || currentMode==='bot-free') && turn !== 'w') return;
    const moves = getAllMovesCheckers(turn);
    if (!moves.length) return;
    searchAborted = false;
    searchDeadline = performance.now() + 600;
    let best=null, bestVal = (turn==='w') ? -Infinity : Infinity;
    for (const m of moves){
      if (checkTime()) break;
      const u = applyMoveCheckersRaw(m.from, m);
      const v = minimaxCheckers(2, -Infinity, Infinity, turn==='b', turn, 'balanced');
      undoMoveCheckersRaw(u);
      if (searchAborted) break;
      if (turn==='w'){
        if (v > bestVal){ bestVal=v; best=m; }
      } else {
        if (v < bestVal){ bestVal=v; best=m; }
      }
    }
    searchAborted = false; searchDeadline = 0;
    if (!best) return;
    advice = `Сходи ${cellName(best.from.r, best.from.c)} → ${cellName(best.r, best.c)}`;
    highlightTrainer('board', best.from.r*8 + best.from.c, best.r*8 + best.c);
  }
  else if (currentGame === 'chess'){
    if ((currentMode==='bot' || currentMode==='bot-free') && chessTurn !== 'w') return;
    const moves = allLegalMovesChess(chessBoard, chessTurn, chessCastling, chessEnPassant);
    if (!moves.length) return;
    searchAborted = false;
    searchDeadline = performance.now() + 600;
    moves.sort((a,b)=>moveOrderScore(chessBoard,b) - moveOrderScore(chessBoard,a));
    let best=null, bestVal = (chessTurn==='w') ? -Infinity : Infinity;
    for (const m of moves){
      if (checkTime()) break;
      const b2 = cloneChessBoard(chessBoard);
      const c2 = {...chessCastling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, chessEnPassant);
      const v = minimaxChess(b2, 2, -Infinity, Infinity, chessTurn==='b', chessTurn, c2, newEp, 'balanced');
      if (searchAborted) break;
      if (chessTurn==='w'){
        if (v > bestVal){ bestVal=v; best=m; }
      } else {
        if (v < bestVal){ bestVal=v; best=m; }
      }
    }
    searchAborted = false; searchDeadline = 0;
    if (!best) return;
    advice = `Сходи ${cellName(best.from.r, best.from.c)} → ${cellName(best.to.r, best.to.c)}`;
    highlightTrainer('board', best.from.r*8 + best.from.c, best.to.r*8 + best.to.c);
  }
  else {
    const idx = tttFindMove(tttBoard, tttTurn, 9);
    if (idx === null || idx === undefined) return;
    advice = `Поставь в клетку ${Math.floor(idx/3)+1},${idx%3+1}`;
    highlightTrainer('ttt-board', idx, -1);
  }

  if (advice && advice !== trainerLastAdvice){
    trainerLastAdvice = advice;
    trainerToast('🎓 ' + advice);
  }
}

function highlightTrainer(boardId, idx1, idx2){
  const el = document.getElementById(boardId);
  if (!el) return;
  const cells = el.children;
  if (cells[idx1]) cells[idx1].classList.add('hint-trainer');
  if (idx2 >= 0 && cells[idx2]) cells[idx2].classList.add('hint-trainer');
  setTimeout(()=>{
    if (cells[idx1]) cells[idx1].classList.remove('hint-trainer');
    if (idx2 >= 0 && cells[idx2]) cells[idx2].classList.remove('hint-trainer');
  }, 2500);
}

function cellName(r, c){
  return String.fromCharCode(97 + c) + (8 - r);
}

/* ============================================================
   ТАЙМЕР ХОДА
============================================================ */
const TURN_TIME = 30;
let turnTimeLeft = TURN_TIME;

function startTurnTimer(){
  if (turnTimer) clearInterval(turnTimer);
  if (!state.timerEnabled || !gameActive) return;

  let isPlayerTurn = false;
  if (currentGame === 'checkers'){
    isPlayerTurn = (turn === 'w') || (currentMode === 'local');
    if (currentMode === 'bot' && turn === 'b') isPlayerTurn = false;
  } else if (currentGame === 'chess'){
    isPlayerTurn = (chessTurn === 'w') || (currentMode === 'local');
    if (currentMode === 'bot' && chessTurn === 'b') isPlayerTurn = false;
  } else {
    isPlayerTurn = (tttTurn === 'X') || (currentMode === 'local');
    if (currentMode === 'bot' && tttTurn === 'O') isPlayerTurn = false;
  }

  const bar = document.getElementById('timer-bar');
  const fill = document.getElementById('timer-fill');
  if (!bar || !fill) return;

  if (!isPlayerTurn){
    bar.classList.remove('active');
    return;
  }

  bar.classList.add('active');
  bar.classList.remove('warning');
  turnTimeLeft = TURN_TIME;
  fill.style.width = '100%';

  turnTimer = setInterval(()=>{
    turnTimeLeft--;
    const pct = (turnTimeLeft / TURN_TIME) * 100;
    fill.style.width = pct + '%';
    if (turnTimeLeft <= 10) bar.classList.add('warning');
    if (turnTimeLeft <= 0){
      clearInterval(turnTimer);
      turnTimer = null;
      playSound('timeout');
      vibrate([100, 50, 100, 50, 100]);
      handleTurnTimeout();
    }
  }, 1000);
}

function stopTurnTimer(){
  if (turnTimer){
    clearInterval(turnTimer);
    turnTimer = null;
  }
  const bar = document.getElementById('timer-bar');
  if (bar) bar.classList.remove('active');
}

function handleTurnTimeout(){
  if (!gameActive) return;
  toast('⏱ Время вышло! Пропуск хода');
  if (currentGame === 'checkers'){
    turn = turn === 'w' ? 'b' : 'w';
    selected = null; validMoves = []; mustCapture = false;
    render();
    if (turn === 'b' && (currentMode === 'bot' || currentMode === 'bot-free')){
      setTimeout(botMoveCheckers, 300);
    } else {
      startTurnTimer();
    }
  } else if (currentGame === 'chess'){
    chessTurn = chessTurn === 'w' ? 'b' : 'w';
    chessSelected = null; chessValidMoves = [];
    render();
    if (chessTurn === 'b' && (currentMode === 'bot' || currentMode === 'bot-free')){
      setTimeout(botMoveChess, 300);
    } else {
      startTurnTimer();
    }
  } else {
    tttTurn = tttTurn === 'X' ? 'O' : 'X';
    render();
    if (tttTurn === 'O' && currentMode === 'bot'){
      tttBotBusy = true;
      setTimeout(()=>{ botMoveTTT(); tttBotBusy = false; }, 300);
    } else {
      startTurnTimer();
    }
  }
}

/* ============================================================
   АНИМАЦИЯ ПОБЕДЫ
============================================================ */
function playVictoryAnimation(){
  const boardId = currentGame === 'ttt' ? 'ttt-board' : 'board';
  const boardEl = document.getElementById(boardId);
  if (!boardEl) return;
  const cells = boardEl.children;
  for (let i = 0; i < cells.length; i++){
    const cell = cells[i];
    if (!cell.firstElementChild) continue;
    const vx = (Math.random() - 0.5) * 400;
    const vy = (Math.random() - 0.5) * 400;
    const vr = (Math.random() - 0.5) * 720;
    const vd = Math.random() * 0.4;
    cell.classList.add('victory-fly');
    cell.style.setProperty('--vx', vx + 'px');
    cell.style.setProperty('--vy', vy + 'px');
    cell.style.setProperty('--vr', vr + 'deg');
    cell.style.setProperty('--vd', vd + 's');
  }
  setTimeout(()=>{
    for (const cell of cells){
      cell.classList.remove('victory-fly');
      cell.style.removeProperty('--vx');
      cell.style.removeProperty('--vy');
      cell.style.removeProperty('--vr');
      cell.style.removeProperty('--vd');
    }
  }, 1800);
}

/* ============================================================
   СТАРТ ИГРЫ
============================================================ */
let gameActive = false;
let moveHistory = [];
let capturedFifty = 0;
let positionCounts = {};

function startGame(bot = null){
  activeBot = bot;
  gameActive = true;
  moveHistory = [];
  capturedFifty = 0;
  positionCounts = {};
  clearCaches();
  if (animTimer){ clearTimeout(animTimer); animTimer = null; }
  animating = false;
  trainerMode = false;
  trainerLastAdvice = '';
  const tbtn = document.getElementById('trainer-btn');
  if (tbtn) tbtn.classList.remove('active');

  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'none';

  const boardEl = document.getElementById('board');
  const tttEl = document.getElementById('ttt-board');
  const evalBar = document.getElementById('eval-bar');

  if (currentGame === 'ttt'){
    boardEl.style.display = 'none';
    tttEl.style.display = 'grid';
    evalBar.style.display = 'none';
  } else {
    boardEl.style.display = 'grid';
    tttEl.style.display = 'none';
    evalBar.style.display = currentGame === 'chess' ? 'block' : 'none';
  }

  if (currentGame === 'checkers') initCheckers();
  else if (currentGame === 'chess') initChess();
  else initTTT();

  render();
  showScreen('screen-game');
  document.getElementById('game-title').textContent =
    currentGame === 'checkers'
      ? (currentMode === 'local' ? 'Шашки · 2 игрока'
        : (activeBot ? 'Шашки · ' + activeBot.name : 'Шашки'))
      : currentGame === 'chess'
      ? (currentMode === 'local' ? 'Шахматы · 2 игрока'
        : (activeBot ? 'Шахматы · ' + activeBot.name : 'Шахматы'))
      : (currentMode === 'local' ? 'Крестики-нолики · 2 игрока'
        : (activeBot ? 'Крестики-нолики · ' + activeBot.name : 'Крестики-нолики'));
  updateUndoButton();
  saveCurrentGame();
  startTurnTimer();
}
function resetGame(){
  if (!confirm('Начать заново?')) return;
  stopTurnTimer();
  clearSavedGame();
  startGame(activeBot);
}
function rematch(){
  stopTurnTimer();
  clearSavedGame();
  startGame(activeBot);
}
function confirmExit(){
  if (gameActive && !confirm('Выйти из партии? Прогресс сохранён.')) return;
  if (gameActive) saveCurrentGame();
  stopTurnTimer();
  gameActive = false;
  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'none';
  showScreen('screen-menu');
}
function updateUndoButton(){
  const btn = document.getElementById('undo-btn');
  if (!btn) return;
  btn.disabled = moveHistory.length === 0 || !gameActive;
}

/* ============================================================
   UNDO
============================================================ */
function undoMove(){
  if (!gameActive){ toast('Партия завершена'); return; }
  if (moveHistory.length === 0){ toast('Нечего отменять'); return; }
  if (animating) return;

  const isVsBot = (currentMode === 'bot' || currentMode === 'bot-free');
  const toUndo = isVsBot ? Math.min(2, moveHistory.length) : 1;

  for (let i = 0; i < toUndo; i++){
    const last = moveHistory.pop();
    if (!last) break;
    if (currentGame === 'checkers') undoCheckersMove(last);
    else if (currentGame === 'chess') undoChessMove(last);
    else undoTTTMove(last);
  }
  if (currentGame === 'checkers'){
    selected = null; validMoves = []; mustCapture = false;
  } else if (currentGame === 'chess'){
    chessSelected = null; chessValidMoves = []; chessCheckSquare = null;
  }
  render();
  updateUndoButton();
  saveCurrentGame();
  playSound('move');
  startTurnTimer();
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
let botThinking = false;

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
  lastMove=null; botThinking=false;
}

function isWhite(p){return p==='w'||p==='W';}
function isBlack(p){return p==='b'||p==='B';}
function sameColor(a,b){ return a&&b&&((isWhite(a)&&isWhite(b))||(isBlack(a)&&isBlack(b))); }
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

function checkersPositionKey(){
  let s = turn + '|';
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++){
    s += board[r][c] || '.';
  }
  return s;
}
let positionCountsCheckers = {};

/* Улучшенная оценка шашек */
function evaluateCheckers(player, style){
  let score = 0;
  let myPieces=0, enemyPieces=0;
  let myKings=0, enemyKings=0;
  let myAdvance=0, enemyAdvance=0;
  let myBackRow=0, enemyBackRow=0;
  let myCenter=0, enemyCenter=0;
  let myMobility=0, enemyMobility=0;
  let myEdgeSafe=0, enemyEdgeSafe=0;
  let myTrapped=0, enemyTrapped=0;

  const dirs4 = [[-1,-1],[-1,1],[1,-1],[1,1]];

  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++){
    const p = board[r][c]; if (!p) continue;
    const white = isWhite(p);
    const isMine = (player==='w') === white;
    const sign = isMine ? 1 : -1;
    let val = 0;

    if (p==='w'||p==='b'){
      val = 100;
      const advance = white ? (7-r) : r;
      val += advance * 6;
      if (isMine){ myPieces++; myAdvance += advance; if (r===7) myBackRow++; }
      else { enemyPieces++; enemyAdvance += advance; if (r===0) enemyBackRow++; }
    } else {
      val = 320;
      if (isMine) myKings++; else enemyKings++;
    }

    if (c>=2 && c<=5) { val += 10; if (isMine) myCenter++; else enemyCenter++; }
    if (c===0 || c===7) val -= 5;

    if ((r===0||r===7) && (c===0||c===7)) {
      val += 8;
      if (isMine) myEdgeSafe++; else enemyEdgeSafe++;
    }

    let mobility = 0;
    for (const [dr,dc] of dirs4){
      const nr=r+dr,nc=c+dc;
      if (inBounds(nr,nc) && !board[nr][nc]) mobility++;
    }
    if (mobility === 0) {
      val -= 25;
      if (isMine) myTrapped++; else enemyTrapped++;
    }
    if (isMine) myMobility += mobility; else enemyMobility += mobility;

    score += sign * val;
  }

  if (myKings >= 2) score += 40;
  if (enemyKings >= 2) score -= 40;

  if (style === 'aggressive'){
    score += (myPieces*4 - enemyPieces*7);
    score += (myKings - enemyKings) * 60;
    score += myMobility * 2;
  } else if (style === 'positional'){
    score += (myAdvance - enemyAdvance) * 4;
    score += (myCenter - enemyCenter) * 14;
    score += (myKings - enemyKings) * 50;
    score += (myMobility - enemyMobility) * 3;
  } else if (style === 'defensive'){
    score += (myKings - enemyKings) * 100;
    score += (myBackRow - enemyBackRow) * 15;
    score += (myEdgeSafe - enemyEdgeSafe) * 12;
    score += (enemyTrapped - myTrapped) * 30;
    score -= (enemyAdvance - myAdvance) * 6;
  } else if (style === 'tricky'){
    score += ((myPieces * enemyPieces + myCenter) % 11) * 4;
    score += (myKings - enemyKings) * 40;
    score += (myTrapped + enemyTrapped) * 8;
  } else {
    score += (myAdvance - enemyAdvance) * 3;
    score += (myKings - enemyKings) * 70;
    score += (myCenter - enemyCenter) * 8;
    score += (myMobility - enemyMobility) * 2;
    score += (enemyTrapped - myTrapped) * 20;
  }

  return score;
}

/* Quiescence шашек */
function quiescenceCheckers(alpha, beta, maximizing, player, style, qDepth){
  if (searchAborted) return 0;
  if (qDepth > 8) return evaluateCheckers(player, style);

  const color = maximizing ? player : (player==='w'?'b':'w');
  const moves = getAllMovesCheckers(color);
  const captures = moves.filter(m => m.capture);

  if (captures.length === 0){
    return evaluateCheckers(player, style);
  }

  if (maximizing){
    let best = -Infinity;
    for (const m of captures){
      const u = applyMoveCheckersRaw(m.from, m);
      const v = quiescenceCheckers(alpha, beta, false, player, style, qDepth+1);
      undoMoveCheckersRaw(u);
      if (searchAborted) return 0;
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of captures){
      const u = applyMoveCheckersRaw(m.from, m);
      const v = quiescenceCheckers(alpha, beta, true, player, style, qDepth+1);
      undoMoveCheckersRaw(u);
      if (searchAborted) return 0;
      if (v < best) best = v;
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/* Минимакс шашек с quiescence на горизонте */
function minimaxCheckers(depth, alpha, beta, maximizing, player, style){
  if (searchAborted) return 0;
  if (checkTime()) return 0;

  const color = maximizing ? player : (player==='w'?'b':'w');
  const moves = getAllMovesCheckers(color);
  if (moves.length === 0){
    return maximizing ? -100000-depth : 100000+depth;
  }
  if (depth === 0){
    return quiescenceCheckers(alpha, beta, maximizing, player, style, 0);
  }

  moves.sort((a,b) => (b.capture?1:0) - (a.capture?1:0));

  if (maximizing){
    let best = -Infinity;
    for (const m of moves){
      const u = applyMoveCheckersRaw(m.from, m);
      const v = minimaxCheckers(depth-1, alpha, beta, false, player, style);
      undoMoveCheckersRaw(u);
      if (searchAborted) return 0;
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves){
      const u = applyMoveCheckersRaw(m.from, m);
      const v = minimaxCheckers(depth-1, alpha, beta, true, player, style);
      undoMoveCheckersRaw(u);
      if (searchAborted) return 0;
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

function countPositionHistoryCheckers(m){
  const p = board[m.from.r][m.from.c];
  const cap = m.capture ? board[m.capture.r][m.capture.c] : null;
  board[m.from.r][m.from.c] = null;
  if (m.capture) board[m.capture.r][m.capture.c] = null;
  let newPiece = p;
  if (p==='w'&&m.r===0) newPiece='W';
  if (p==='b'&&m.r===SIZE-1) newPiece='B';
  board[m.r][m.c] = newPiece;
  const oldTurn = turn;
  turn = turn==='w' ? 'b' : 'w';
  const key = checkersPositionKey();
  board[m.r][m.c] = null;
  board[m.from.r][m.from.c] = p;
  if (cap) board[m.capture.r][m.capture.c] = cap;
  turn = oldTurn;
  return positionCountsCheckers[key] || 0;
}

/* Итеративное углубление для шашек */
function botMoveCheckers(){
  if (!gameActive || turn!=='b' || botThinking) return;
  const maxDepth = activeBot ? activeBot.depth : 2;
  const style = activeBot ? (activeBot.style || 'balanced') : 'balanced';
  const noise = activeBot ? (activeBot.noise || 0) : 0.15;
  const moves = getAllMovesCheckers('b');
  if (!moves.length) return;

  botThinking = true;
  searchAborted = false;
  const totalTime = 400 + maxDepth * 300;
  searchDeadline = performance.now() + totalTime;

  if (noise > 0.4 && Math.random() < noise){
    const m = moves[Math.floor(Math.random()*moves.length)];
    botThinking = false;
    makeMoveCheckers(m.from, m, true);
    return;
  }

  moves.sort((a,b) => (b.capture?1:0) - (a.capture?1:0));
  const captureMoves = moves.filter(m=>m.capture);
  const candidates = captureMoves.length ? captureMoves : moves;

  let best = candidates[0];
  let bestScore = Infinity;
  let secondBest = null;
  let secondScore = Infinity;

  for (let d = 1; d <= maxDepth; d++){
    if (searchAborted) break;

    let iterBest = null;
    let iterBestScore = Infinity;
    let iterSecond = null;
    let iterSecondScore = Infinity;

    const ordered = [best, ...candidates.filter(m => m !== best)];

    for (const m of ordered){
      if (checkTime()) break;
      const repPenalty = countPositionHistoryCheckers(m) * 300;
      const u = applyMoveCheckersRaw(m.from, m);
      let v = minimaxCheckers(Math.max(1, d-1), -Infinity, Infinity, true, 'b', style);
      undoMoveCheckersRaw(u);
      if (searchAborted) break;

      v += repPenalty;
      v += (Math.random() - 0.5) * noise * 100;

      if (v < iterBestScore){
        iterSecondScore = iterBestScore;
        iterSecond = iterBest;
        iterBestScore = v;
        iterBest = m;
      } else if (v < iterSecondScore){
        iterSecondScore = v;
        iterSecond = m;
      }
    }

    if (iterBest && !searchAborted){
      best = iterBest;
      bestScore = iterBestScore;
      secondBest = iterSecond;
      secondScore = iterSecondScore;
    }
  }

  searchAborted = false;
  searchDeadline = 0;
  botThinking = false;

  if (secondBest && Math.random() < 0.10) best = secondBest;
  if (!best) best = moves[0];
  makeMoveCheckers(best.from, best, true);
}

function continueBotCapture(r, c){
  if (!gameActive || currentGame !== 'checkers') return;
  if (currentMode !== 'bot' && currentMode !== 'bot-free') return;
  if (turn !== 'b') return;

  const captures = getCaptureFrom(r, c);
  if (!captures.length){
    mustCapture = false; selected = null; validMoves = [];
    turn = 'w'; lastMove = null;
    const enemyMoves = getAllMovesCheckers('w');
    if (!enemyMoves.length){ render(); endGameCheckers('b'); return; }
    render(); saveCurrentGame(); startTurnTimer();
    return;
  }

  searchAborted = false;
  searchDeadline = performance.now() + 500;
  let best = captures[0], bestVal = -Infinity;
  const depth = activeBot ? activeBot.depth : 2;
  const style = activeBot ? (activeBot.style || 'balanced') : 'balanced';

  for (const m of captures){
    if (performance.now() > searchDeadline) break;
    const u = applyMoveCheckersRaw({r, c}, m);
    const v = minimaxCheckers(Math.max(1, depth-1), -Infinity, Infinity, true, 'b', style);
    undoMoveCheckersRaw(u);
    if (searchAborted) break;
    if (v > bestVal){ bestVal = v; best = m; }
  }
  searchAborted = false; searchDeadline = 0;
  makeMoveCheckers({r, c}, best, true);
}

function onCellClickCheckers(r,c){
  if (!gameActive || animating) return;
  if (turn==='b' && (currentMode==='bot'||currentMode==='bot-free')) return;
  if (botThinking) return;

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
  if (!p) return;

  const undoEntry = {
    from: {...from}, to: {r:move.r, c:move.c},
    piece: p,
    captured: move.capture ? board[move.capture.r][move.capture.c] : null,
    capturedPos: move.capture ? {...move.capture} : null,
    promoted: null, turnBefore: turn
  };

  let newPiece = p;
  if (p==='w'&&move.r===0 && p!=='W'){ newPiece='W'; undoEntry.promoted='w'; }
  if (p==='b'&&move.r===SIZE-1 && p!=='B'){ newPiece='B'; undoEntry.promoted='b'; }

  animating = true;
  const boardEl = document.getElementById('board');
  const fromCell = boardEl.children[from.r*8 + from.c];
  const toCell = boardEl.children[move.r*8 + move.c];
  const pieceEl = fromCell ? fromCell.querySelector('.piece') : null;

  if (move.capture){
    const capCell = boardEl.children[move.capture.r*8 + move.capture.c];
    const capEl = capCell ? capCell.querySelector('.piece') : null;
    if (capEl){
      capEl.classList.add('captured');
      setTimeout(()=>{ if (capEl.parentNode) capEl.remove(); }, 250);
    }
    playSound('capture'); vibrate([30,20,30]);
  } else {
    playSound('move'); vibrate(12);
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
    if (animTimer) clearTimeout(animTimer);
    animTimer = setTimeout(()=>{
      pieceEl.classList.remove('animating');
      animating = false;
      animTimer = null;
      finalizeMoveCheckers(from, move, undoEntry, newPiece, isBot);
    }, 160);
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

  const posKeyCh = checkersPositionKey();
  positionCountsCheckers[posKeyCh] = (positionCountsCheckers[posKeyCh] || 0) + 1;

  if (move.capture){
    const further = getCaptureFrom(move.r, move.c);
    if (further.length){
      selected = {r:move.r,c:move.c};
      validMoves = further;
      mustCapture = true;
      render();
      if (isBot && (currentMode==='bot'||currentMode==='bot-free')){
        setTimeout(()=>continueBotCapture(move.r, move.c), 250);
      }
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
  saveCurrentGame();

  if (turn==='b' && (currentMode==='bot'||currentMode==='bot-free')){
    setTimeout(botMoveCheckers, 180);
  } else {
    startTurnTimer();
    if (trainerMode) setTimeout(trainerAdvise, 200);
  }
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
  botThinking = false;
}

function endGameCheckers(winner){
  gameActive = false;
  botThinking = false;
  stopTurnTimer();
  clearSavedGame();
  const st = document.getElementById('status');
  const playerWon = winner==='w';
  let eloDelta = 0, result = 'draw';

  if (currentMode==='bot' && activeBot && activeBot.id!=='free'){
    if (playerWon){
      st.textContent = `🎉 Победа!`;
      state.wins++;
      state.stats.checkersWins++;
      state.defeatedBots.checkers[activeBot.id] = true;
      eloDelta = 5; result = 'win';
      updateElo(1, 0, activeBot.elo);
      playSound('win'); vibrate([50,40,50,40,100]);
      playVictoryAnimation();
    } else {
      st.textContent = `😢 Поражение`;
      state.losses++;
      eloDelta = -1; result = 'lose';
      updateElo(0, 1, activeBot.elo);
      playSound('lose'); vibrate([100,50,100]);
    }
    recordGame({ game:'checkers', mode:'bot', opponent: activeBot.name,
      result, moves: moveHistory.length, eloDelta });
    checkAchievements({ beatElo: playerWon ? activeBot.elo : 0 });
    updateDailyProgress('play', {});
    if (result === 'win') updateDailyProgress('win', {
      game: 'checkers', beatElo: activeBot.elo, captures: 0
    });

    const capturesCount = moveHistory.filter(m => m.undo && m.undo.captured).length;
    const kingsPromoted = moveHistory.filter(m => m.undo && m.undo.promoted === 'w').length;
    checkChallenges({
      win: playerWon,
      moves: moveHistory.length,
      captures: capturesCount,
      lostPieces: 0,
      kingsPromoted: kingsPromoted
    });
  } else if (currentMode==='bot-free'){
    st.textContent = playerWon ? '🎉 Вы победили!' : '😢 Вы проиграли';
    playSound(playerWon?'win':'lose');
    if (playerWon) playVictoryAnimation();
    recordGame({ game:'checkers', mode:'free',
      opponent: activeBot ? activeBot.name : 'Бот',
      result: playerWon?'win':'lose', moves: moveHistory.length, eloDelta: 0 });
  } else {
    st.textContent = winner==='w' ? '🎉 Победа белых!' : '🎉 Победа чёрных!';
    playSound('win');
    playVictoryAnimation();
  }

  lastResult = {
    game: currentGame,
    opponent: activeBot ? activeBot.name : 'Игрок',
    result: result,
    moves: moveHistory.length
  };
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
let chessBotThinking = false;

const PIECE_SYMBOLS = {
  w: { k:'♔', q:'♕', r:'♖', b:'♗', n:'♘', p:'♙' },
  b: { k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' }
};
const PIECE_VALUES = { p:100, n:320, b:330, r:500, q:900, k:20000 };

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
  chessBotThinking = false;
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
    m: {...m}, piece: {...p},
    captured: null, capturedPos: null,
    castlingBefore: {...castling}, epBefore: ep,
    promoted: null, movedRookFrom: null, movedRookTo: null
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

function evaluateChess(board, forColor, style){
  let score = 0;
  let myPawns=0, enemyPawns=0;
  let myKnights=0, enemyKnights=0;
  let myBishops=0, enemyBishops=0;
  let myRooks=0, enemyRooks=0;
  let myQueens=0, enemyQueens=0;
  let myKingPos = null, enemyKingPos = null;
  let myKingSafety = 0;
  const myPawnFiles = Array(8).fill(0);
  const enemyPawnFiles = Array(8).fill(0);

  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const p = board[r][c]; if (!p) continue;
    const isMine = p.color===forColor;
    const sign = isMine ? 1 : -1;
    let v = PIECE_VALUES[p.type];

    if (p.type==='p'){
      const advance = isMine ? (6 - r) : r;
      v += advance * 8;
      if (isMine){ myPawns++; myPawnFiles[c]++; }
      else { enemyPawns++; enemyPawnFiles[c]++; }
      if (c===3 || c===4) v += 15;
      let isPassed = true;
      for (let rr=r + (isMine?-1:1); rr>=0 && rr<8; rr += (isMine?-1:1)){
        for (const dc of [-1,0,1]){
          const cc = c + dc;
          if (cc<0||cc>7) continue;
          const opp = board[rr][cc];
          if (opp && opp.type==='p' && opp.color!==forColor){
            isPassed = false; break;
          }
        }
        if (!isPassed) break;
      }
      if (isPassed) v += 30 + advance * 10;
    }
    else if (p.type==='n'){
      const cd = Math.abs(3.5-r) + Math.abs(3.5-c);
      v += (7 - cd) * 6;
      if ((isMine && r<=3) || (!isMine && r>=4)) v += 10;
      if (isMine) myKnights++; else enemyKnights++;
    }
    else if (p.type==='b'){
      v += 10;
      if (Math.abs(r-c)===0 || Math.abs(r+c)===7) v += 8;
      if (isMine) myBishops++; else enemyBishops++;
    }
    else if (p.type==='r'){
      const seventh = isMine ? 1 : 6;
      if (r === seventh) v += 25;
      let openFile = true;
      for (let rr=0;rr<8;rr++){
        if (board[rr][c] && board[rr][c].type==='p'){ openFile = false; break; }
      }
      if (openFile) v += 15;
      if (isMine) myRooks++; else enemyRooks++;
    }
    else if (p.type==='q'){
      if (isMine) myQueens++; else enemyQueens++;
    }
    else if (p.type==='k'){
      if (isMine) myKingPos = {r,c}; else enemyKingPos = {r,c};
      if (r>=2 && r<=5 && c>=2 && c<=5) v -= 40;
    }

    score += sign * v;
  }

  if (myBishops >= 2) score += 40;
  if (enemyBishops >= 2) score -= 40;

  for (let c=0;c<8;c++){
    if (myPawnFiles[c] > 1) score -= (myPawnFiles[c]-1) * 18;
    if (enemyPawnFiles[c] > 1) score += (enemyPawnFiles[c]-1) * 18;
  }
  for (let c=0;c<8;c++){
    const myNeigh = (c>0?myPawnFiles[c-1]:0) + (c<7?myPawnFiles[c+1]:0);
    if (myPawnFiles[c] > 0 && myNeigh === 0) score -= 12;
    const enNeigh = (c>0?enemyPawnFiles[c-1]:0) + (c<7?enemyPawnFiles[c+1]:0);
    if (enemyPawnFiles[c] > 0 && enNeigh === 0) score += 12;
  }
  if (myKingPos){
    const row = forColor==='w' ? 6 : 1;
    let shield = 0;
    for (let dc of [-1,0,1]){
      const c = myKingPos.c + dc;
      if (c<0||c>7) continue;
      if (board[row][c] && board[row][c].type==='p' && board[row][c].color===forColor) shield++;
    }
    score += shield * 18;
    myKingSafety = shield;
  }
  if (enemyKingPos){
    const row = forColor==='w' ? 1 : 6;
    let shield = 0;
    for (let dc of [-1,0,1]){
      const c = enemyKingPos.c + dc;
      if (c<0||c>7) continue;
      if (board[row][c] && board[row][c].type==='p' && board[row][c].color!==forColor) shield++;
    }
    score -= shield * 18;
  }

  if (style === 'aggressive'){
    score -= myQueens === 0 ? 40 : 0;
    score += enemyQueens === 0 ? 60 : 0;
    if (myKingPos && enemyKingPos){
      const d = Math.abs(myKingPos.r-enemyKingPos.r) + Math.abs(myKingPos.c-enemyKingPos.c);
      score -= d * 5;
    }
  } else if (style === 'positional'){
    score += (myPawns - enemyPawns) * 4;
    score += (myBishops - enemyBishops) * 18;
    score += (myRooks - enemyRooks) * 10;
  } else if (style === 'defensive'){
    score += myPawns * 7;
    score += myKingSafety * 15;
    if (myKingPos){
      const edge = Math.min(myKingPos.r, 7-myKingPos.r, myKingPos.c, 7-myKingPos.c);
      score -= edge * 3;
    }
  } else if (style === 'tricky'){
    score += ((myPawns * myKnights + myQueens) % 17) * 3;
  }

  return score;
}

function moveOrderScore(board, m){
  let s = 0;
  const target = board[m.to.r][m.to.c];
  if (target) s += PIECE_VALUES[target.type] * 10;
  if (m.promotion) s += 800;
  if (m.castle) s += 50;
  if (m.enPassant) s += 900;
  return s;
}

function boardKey(board, turn, castling, ep){
  let s = turn;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++){
    const p = board[r][c];
    s += p ? (p.color + p.type) : '.';
  }
  s += (castling.wK?'K':'')+(castling.wQ?'Q':'')+
       (castling.bK?'k':'')+(castling.bQ?'q':'');
  if (ep) s += ep.r + '' + ep.c;
  return s;
}

let killerMoves = {};
let historyHeuristic = new Map();

function moveKey(board, m){
  const p = board[m.from.r][m.from.c];
  return `${p.color}${p.type}${m.from.r}${m.from.c}-${m.to.r}${m.to.c}`;
}

/* Quiescence шахмат */
function quiescenceChess(board, alpha, beta, maximizing, botColor, castling, ep, style, qDepth){
  if (searchAborted) return 0;
  if (checkTime()) return 0;
  if (qDepth > 6) return evaluateChess(board, botColor, style);

  const color = maximizing ? botColor : (botColor==='w'?'b':'w');
  const allMoves = allLegalMovesChess(board, color, castling, ep);
  const captures = allMoves.filter(m => board[m.to.r][m.to.c] || m.enPassant || m.promotion);

  if (captures.length === 0){
    return evaluateChess(board, botColor, style);
  }

  const standPat = evaluateChess(board, botColor, style);
  if (maximizing){
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  captures.sort((a,b) => moveOrderScore(board, b) - moveOrderScore(board, a));

  if (maximizing){
    let best = standPat;
    for (const m of captures){
      const b2 = cloneChessBoard(board);
      const c2 = {...castling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, ep);
      const v = quiescenceChess(b2, alpha, beta, false, botColor, c2, newEp, style, qDepth+1);
      if (searchAborted) return 0;
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = standPat;
    for (const m of captures){
      const b2 = cloneChessBoard(board);
      const c2 = {...castling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, ep);
      const v = quiescenceChess(b2, alpha, beta, true, botColor, c2, newEp, style, qDepth+1);
      if (searchAborted) return 0;
      if (v < best) best = v;
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function minimaxChess(board, depth, alpha, beta, maximizing, botColor, castling, ep, style){
  if (searchAborted) return 0;
  if (checkTime()) return 0;
  const color = maximizing ? botColor : (botColor==='w'?'b':'w');
  const posKey = boardKey(board, color, castling, ep);
  const ttKey = posKey + '|' + depth;
  const cached = TT.get(ttKey);
  if (cached !== undefined) return cached;
  const moves = allLegalMovesChess(board, color, castling, ep);
  if (moves.length===0){
    let val;
    if (isInCheck(board, color)) val = maximizing ? -100000-depth : 100000+depth;
    else val = 0;
    if (TT.size < TT_MAX) TT.set(ttKey, val);
    return val;
  }
  if (depth===0){
    const v = quiescenceChess(board, alpha, beta, maximizing, botColor, castling, ep, style, 0);
    if (TT.size < TT_MAX) TT.set(ttKey, v);
    return v;
  }
  const killers = killerMoves[depth] || [];
  moves.sort((a,b)=>{
    let sa = moveOrderScore(board, a);
    let sb = moveOrderScore(board, b);
    const ka = moveKey(board, a), kb = moveKey(board, b);
    if (killers[0] === ka) sa += 10000;
    if (killers[0] === kb) sb += 10000;
    if (killers[1] === ka) sa += 5000;
    if (killers[1] === kb) sb += 5000;
    sa += (historyHeuristic.get(ka) || 0);
    sb += (historyHeuristic.get(kb) || 0);
    return sb - sa;
  });
  let best;
  if (maximizing){
    best = -Infinity;
    for (const m of moves){
      const b2 = cloneChessBoard(board);
      const c2 = {...castling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, ep);
      const v = minimaxChess(b2, depth-1, alpha, beta, false, botColor, c2, newEp, style);
      if (searchAborted) return 0;
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha){
        const key = moveKey(board, m);
        if (!killerMoves[depth]) killerMoves[depth] = [];
        if (killerMoves[depth][0] !== key){
          killerMoves[depth][1] = killerMoves[depth][0];
          killerMoves[depth][0] = key;
        }
        historyHeuristic.set(key, (historyHeuristic.get(key) || 0) + depth * depth);
        break;
      }
    }
  } else {
    best = Infinity;
    for (const m of moves){
      const b2 = cloneChessBoard(board);
      const c2 = {...castling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, ep);
      const v = minimaxChess(b2, depth-1, alpha, beta, true, botColor, c2, newEp, style);
      if (searchAborted) return 0;
      if (v < best) best = v;
      beta = Math.min(beta, v);
      if (beta <= alpha){
        const key = moveKey(board, m);
        if (!killerMoves[depth]) killerMoves[depth] = [];
        if (killerMoves[depth][0] !== key){
          killerMoves[depth][1] = killerMoves[depth][0];
          killerMoves[depth][0] = key;
        }
        historyHeuristic.set(key, (historyHeuristic.get(key) || 0) + depth * depth);
        break;
      }
    }
  }
  if (TT.size >= TT_MAX) TT.clear();
  TT.set(ttKey, best);
  return best;
}

function countChessRepetition(board, castling, ep){
  const key = boardKey(board, 'b', castling, ep);
  return positionCounts[key] || 0;
}

function evaluateMoveProgress(m, newBoard){
  let bonus = 0;
  const p = chessBoard[m.from.r][m.from.c];
  if (!p) return 0;
  if (p.type === 'n' || p.type === 'b'){
    if (m.from.r === 0 || m.from.r === 7) bonus -= 30;
  }
  if (p.type === 'p' && m.to.r > m.from.r) bonus -= 15;
  const attacked = newBoard[m.to.r][m.to.c];
  if (attacked) bonus -= 20;
  return bonus;
}

/* Итеративное углубление для шахмат */
function botMoveChess(){
  if (!chessGameActive || chessTurn!=='b' || chessBotThinking) return;
  const maxDepth = activeBot ? activeBot.depth : 2;
  const style = activeBot ? (activeBot.style || 'balanced') : 'balanced';
  const noise = activeBot ? (activeBot.noise || 0.1) : 0.1;
  const moves = allLegalMovesChess(chessBoard, 'b', chessCastling, chessEnPassant);
  if (!moves.length) return;

  chessBotThinking = true;
  if (noise > 0.4 && Math.random() < noise){
    const m = moves[Math.floor(Math.random()*moves.length)];
    chessBotThinking = false;
    makeChessMove(m, m.promotionType||'q', true);
    return;
  }

  if (TT.size > TT_MAX) TT.clear();
  searchAborted = false;
  searchDeadline = performance.now() + 300 + maxDepth * 400;

  moves.sort((a,b)=>moveOrderScore(chessBoard,b) - moveOrderScore(chessBoard,a));

  let best = moves[0];
  let bestScore = Infinity;
  let secondBest = null;
  let secondScore = Infinity;

  for (let d = 1; d <= maxDepth; d++){
    if (searchAborted) break;

    let iterBest = null;
    let iterBestScore = Infinity;
    let iterSecond = null;
    let iterSecondScore = Infinity;

    const ordered = [best, ...moves.filter(m => m !== best)];

    for (const m of ordered){
      if (checkTime()) break;
      const b2 = cloneChessBoard(chessBoard);
      const c2 = {...chessCastling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, chessEnPassant);
      let v = minimaxChess(b2, d-1, -Infinity, Infinity, true, 'b', c2, newEp, style);
      if (searchAborted) break;
      const rep = countChessRepetition(b2, c2, newEp);
      v += rep * 500;
      v += evaluateMoveProgress(m, b2) * 5;
      v += (Math.random() - 0.5) * noise * 200;
      if (v < iterBestScore){
        iterSecondScore = iterBestScore;
        iterSecond = iterBest;
        iterBestScore = v;
        iterBest = m;
      } else if (v < iterSecondScore){
        iterSecondScore = v;
        iterSecond = m;
      }
    }

    if (iterBest && !searchAborted){
      best = iterBest;
      bestScore = iterBestScore;
      secondBest = iterSecond;
      secondScore = iterSecondScore;
    }
  }

  searchAborted = false;
  searchDeadline = 0;
  chessBotThinking = false;

  if (secondBest && Math.random() < 0.10) best = secondBest;
  if (!best) best = moves[0];
  makeChessMove(best, best.promotionType||'q', true);
}

function onCellClickChess(r,c){
  if (!chessGameActive || animating) return;
  if (chessTurn==='b' && (currentMode==='bot'||currentMode==='bot-free')) return;
  if (chessBotThinking) return;
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
  if (!p) return;
  if (p.type==='p' && Math.abs(m.to.c-m.from.c)===1 && !chessBoard[m.to.r][m.to.c]){
    m.enPassant = { r:m.from.r, c:m.to.c };
  }
  if (p.type==='p' && Math.abs(m.to.r-m.from.r)===2) m.double = true;
  if (p.type==='k' && Math.abs(m.to.c-m.from.c)===2) m.castle = m.to.c > m.from.c ? 'K' : 'Q';
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
    if (capEl){
      capEl.classList.add('captured');
      setTimeout(()=>{ if (capEl.parentNode) capEl.remove(); }, 250);
    }
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
        setTimeout(()=>rookEl.classList.remove('animating'), 160);
      }
    }
    if (animTimer) clearTimeout(animTimer);
    animTimer = setTimeout(()=>{
      pieceEl.classList.remove('animating');
      animating = false;
      animTimer = null;
      finalizeChessMove(m, isCapture, isBot);
    }, 160);
  } else {
    animating = false;
    finalizeChessMove(m, isCapture, isBot);
  }
}

function finalizeChessMove(m, isCapture, isBot){
  const p = chessBoard[m.from.r][m.from.c];
  const undo = applyMoveChess(chessBoard, m, chessCastling, chessEnPassant);
  moveHistory.push({
    game: 'chess', undo,
    enPassantBefore: undo.epBefore,
    castlingBefore: undo.castlingBefore
  });
  if (isCapture || p.type==='p') capturedFifty = 0;
  else capturedFifty++;
  chessEnPassant = m.double ? {r:(m.from.r+m.to.r)/2, c:m.from.c} : null;
  if (isCapture){ playSound('capture'); vibrate([30,20,30]); }
  else { playSound('move'); vibrate(12); }
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
  if (capturedFifty >= 100){ render(); endGameChess(null, 'правило 50 ходов'); return; }
  const posKey = positionKey();
  if (positionCounts[posKey] >= 3){ render(); endGameChess(null, 'троекратное повторение'); return; }
  render();
  saveCurrentGame();
  if (chessTurn==='b' && (currentMode==='bot'||currentMode==='bot-free'))
    setTimeout(botMoveChess, 180);
  else {
    startTurnTimer();
    if (trainerMode) setTimeout(trainerAdvise, 200);
  }
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
  chessBotThinking = false;
}

function endGameChess(winner, reason){
  chessGameActive = false;
  chessBotThinking = false;
  stopTurnTimer();
  clearSavedGame();
  const st = document.getElementById('status');
  let eloDelta = 0, result = 'draw';
  if (!winner){
    st.textContent = `🤝 Ничья (${reason})`;
    playSound('draw');
    if (currentMode==='bot' && activeBot && activeBot.id!=='free'){
      recordGame({game:'chess', mode:'bot', opponent:activeBot.name,
        result:'draw', moves:moveHistory.length, eloDelta:0});
      updateDailyProgress('play', {});
    }
  } else {
    const playerWon = winner==='w';
    if (currentMode==='bot' && activeBot && activeBot.id!=='free'){
      if (playerWon){
        st.textContent = `🎉 Победа!`;
        state.wins++;
        state.stats.chessWins++;
        state.defeatedBots.chess[activeBot.id] = true;
        eloDelta = 5; result = 'win';
        updateElo(1, 0, activeBot.elo);
        playSound('win'); vibrate([50,40,50,40,100]);
        playVictoryAnimation();
      } else {
        st.textContent = `😢 Поражение`;
        state.losses++;
        eloDelta = -1; result = 'lose';
        updateElo(0, 1, activeBot.elo);
        playSound('lose'); vibrate([100,50,100]);
      }
      recordGame({game:'chess', mode:'bot', opponent:activeBot.name,
        result, moves:moveHistory.length, eloDelta});
      checkAchievements({ beatElo: playerWon ? activeBot.elo : 0 });
      updateDailyProgress('play', {});
      if (result === 'win') updateDailyProgress('win', {
        game: 'chess', beatElo: activeBot.elo, captures: 0
      });
      const capturesCount = moveHistory.filter(m => m.undo && m.undo.captured).length;
      checkChallenges({
        win: playerWon,
        moves: moveHistory.length,
        captures: capturesCount,
        lostPieces: 0,
        kingsPromoted: 0
      });
    } else if (currentMode==='bot-free'){
      st.textContent = playerWon ? '🎉 Вы победили!' : '😢 Вы проиграли';
      playSound(playerWon?'win':'lose');
      if (playerWon) playVictoryAnimation();
    } else {
      st.textContent = winner==='w' ? '🎉 Победа белых!' : '🎉 Победа чёрных!';
      playSound('win');
      playVictoryAnimation();
    }
  }
  lastResult = {
    game: currentGame,
    opponent: activeBot ? activeBot.name : 'Игрок',
    result: result,
    moves: moveHistory.length
  };
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
   КРЕСТИКИ-НОЛИКИ
============================================================ */
let tttBoard = [];
let tttTurn = 'X';
let tttGameActive = false;
let tttWinner = null;
let tttWinLine = null;
let tttBotBusy = false;

const TTT_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function initTTT() {
  tttBoard = Array(9).fill(null);
  tttTurn = 'X';
  tttWinner = null;
  tttWinLine = null;
  tttGameActive = true;
  tttBotBusy = false;
  capturedFifty = 0;
}

function tttCheckWinner(board){
  for (const line of TTT_LINES){
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]){
      return { winner: board[a], line };
    }
  }
  if (board.every(x=>x)) return { winner: 'draw', line: null };
  return null;
}

function onTTTClick(idx){
  if (!tttGameActive || animating) return;
  if (tttBotBusy) return;
  if (tttBoard[idx]) return;
  if (currentMode === 'bot' && tttTurn === 'O') return;
  makeTTTMove(idx, tttTurn);
}

function makeTTTMove(idx, player){
  tttBoard[idx] = player;
  moveHistory.push({ game:'ttt', idx, player, turnBefore: tttTurn });
  updateUndoButton();
  playSound('move'); vibrate(12);
  const res = tttCheckWinner(tttBoard);
  if (res){
    tttWinner = res.winner;
    tttWinLine = res.line;
    render();
    saveCurrentGame();
    setTimeout(()=>endGameTTT(res.winner), 500);
    return;
  }
  tttTurn = tttTurn === 'X' ? 'O' : 'X';
  render();
  saveCurrentGame();
  if (currentMode === 'bot' && tttTurn === 'O' && tttGameActive){
    tttBotBusy = true;
    setTimeout(()=>{ botMoveTTT(); tttBotBusy = false; }, 300);
  } else {
    startTurnTimer();
  }
}

function undoTTTMove(entry){
  tttBoard[entry.idx] = null;
  tttTurn = entry.turnBefore;
  tttWinner = null; tttWinLine = null;
  tttBotBusy = false;
}

function botMoveTTT(){
  if (!tttGameActive || tttTurn !== 'O') return;
  const level = activeBot ? activeBot.level : 'medium';
  const empty = tttBoard.map((v,i)=>v?null:i).filter(v=>v!==null);
  if (!empty.length) return;
  let idx;
  if (level === 'random'){
    idx = empty[Math.floor(Math.random()*empty.length)];
  } else if (level === 'weak'){
    if (Math.random() < 0.5) idx = empty[Math.floor(Math.random()*empty.length)];
    else idx = tttFindMove(tttBoard, 'O', 1);
  } else if (level === 'medium'){
    idx = tttFindMove(tttBoard, 'O', 2);
  } else {
    idx = tttFindMove(tttBoard, 'O', 9);
  }
  if (idx === null || idx === undefined) idx = empty[0];
  makeTTTMove(idx, 'O');
}

function tttFindMove(board, player, maxDepth){
  const result = tttMinimax(board, player, 0, maxDepth, true, -Infinity, Infinity);
  return result.move;
}

function tttMinimax(board, player, depth, maxDepth, isMax, alpha, beta){
  const res = tttCheckWinner(board);
  if (res){
    if (res.winner === 'O') return { score: 10 - depth, move: null };
    if (res.winner === 'X') return { score: depth - 10, move: null };
    if (res.winner === 'draw') return { score: 0, move: null };
  }
  if (depth >= maxDepth) return { score: 0, move: null };
  const empty = board.map((v,i)=>v?null:i).filter(v=>v!==null);
  let bestMove = null;
  if (isMax){
    let best = -Infinity;
    for (const idx of empty){
      const b = board.slice(); b[idx] = 'O';
      const r = tttMinimax(b, 'X', depth+1, maxDepth, false, alpha, beta);
      if (r.score > best){ best = r.score; bestMove = idx; }
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return { score: best, move: bestMove };
  } else {
    let best = Infinity;
    for (const idx of empty){
      const b = board.slice(); b[idx] = 'X';
      const r = tttMinimax(b, 'O', depth+1, maxDepth, true, alpha, beta);
      if (r.score < best){ best = r.score; bestMove = idx; }
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return { score: best, move: bestMove };
  }
}

function endGameTTT(winner){
  tttGameActive = false;
  tttBotBusy = false;
  stopTurnTimer();
  clearSavedGame();
  const st = document.getElementById('status');
  let result = 'draw';
  if (winner === 'draw'){
    st.textContent = '🤝 Ничья!';
    playSound('draw');
    if (currentMode === 'bot' && activeBot){
      if (activeBot.level === 'perfect') unlockAchievement('ttt_draw');
      recordGame({ game:'ttt', mode:'bot', opponent:activeBot.name,
        result:'draw', moves:moveHistory.length, eloDelta:0 });
      updateDailyProgress('play', {});
    }
  } else {
    const playerWon = winner === 'X';
    if (currentMode === 'bot' && activeBot){
      if (playerWon){
        st.textContent = '🎉 Вы победили!';
        state.wins++;
        state.stats.tttWins++;
        state.defeatedBots.ttt[activeBot.id] = true;
        updateElo(1, 0, activeBot.elo);
        playSound('win'); vibrate([50,40,50,40,100]);
        playVictoryAnimation();
        recordGame({ game:'ttt', mode:'bot', opponent:activeBot.name,
          result:'win', moves:moveHistory.length, eloDelta:5 });
        checkAchievements({ beatElo: activeBot.elo });
        result = 'win';
      } else {
        st.textContent = '😢 Вы проиграли';
        state.losses++;
        updateElo(0, 1, activeBot.elo);
        playSound('lose'); vibrate([100,50,100]);
        recordGame({ game:'ttt', mode:'bot', opponent:activeBot.name,
          result:'lose', moves:moveHistory.length, eloDelta:-1 });
        result = 'lose';
      }
      updateDailyProgress('play', {});
      if (result === 'win') updateDailyProgress('win', {
        game: 'ttt', beatElo: activeBot.elo, captures: 0
      });
    } else {
      st.textContent = winner === 'X' ? '❌ Крестики победили!' : '⭕ Нолики победили!';
      playSound('win');
      playVictoryAnimation();
    }
  }
  lastResult = {
    game: currentGame,
    opponent: activeBot ? activeBot.name : 'Игрок',
    result: result,
    moves: moveHistory.length
  };
  saveState();
  updateMenuElo();
  const endBtns = document.getElementById('end-buttons');
  if (endBtns) endBtns.style.display = 'flex';
}

/* ============================================================
   РЕНДЕР
============================================================ */
function render(){
  if (currentGame === 'checkers') renderCheckers();
  else if (currentGame === 'chess') renderChess();
  else renderTTT();
}

function renderCheckers(){
  const boardEl = document.getElementById('board');
  if (boardEl.dataset.game !== 'checkers' || boardEl.children.length !== 64){
    boardEl.innerHTML = '';
    boardEl.dataset.game = 'checkers';
    for (let r=0;r<SIZE;r++){
      for (let c=0;c<SIZE;c++){
        const cell = document.createElement('div');
        cell.className = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
        cell.dataset.r = r; cell.dataset.c = c;
        boardEl.appendChild(cell);
      }
    }
  }
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const cell = boardEl.children[r*8 + c];
      if (!cell) continue;
      let cls = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
      const p = board[r][c];
      let pieceEl = cell.firstElementChild;
      const hasPiece = pieceEl && pieceEl.classList.contains('piece');
      if (p){
        if (!hasPiece){
          cell.innerHTML = '';
          pieceEl = document.createElement('div');
          cell.appendChild(pieceEl);
        }
        pieceEl.className = 'piece ' + (isWhite(p)?'white':'black');
        if (p==='W'||p==='B') pieceEl.classList.add('king');
      } else if (hasPiece){
        cell.innerHTML = '';
      }
      if (lastMove){
        if (lastMove.from.r===r&&lastMove.from.c===c) cls += ' last-move';
        if (lastMove.to.r===r&&lastMove.to.c===c) cls += ' last-move';
      }
      if (selected && selected.r===r && selected.c===c) cls += ' selected';
      const hint = validMoves.find(m=>m.r===r&&m.c===c);
      if (hint){ cls += ' hint'; if (hint.capture) cls += ' capture'; }
      if (cell.className !== cls) cell.className = cls;
    }
  }
  let text = turn==='w' ? 'Ход белых' : 'Ход чёрных';
  if (currentMode==='bot'||currentMode==='bot-free'){ if (turn==='b') text = '🤖 Думает...'; }
  if (mustCapture) text += ' (взятие!)';
  const statusEl = document.getElementById('status');
  statusEl.textContent = text;
  const isYourTurn = (turn === 'w' && (currentMode === 'bot' || currentMode === 'bot-free'));
  if (isYourTurn && !mustCapture) statusEl.classList.add('turn-check');
  else statusEl.classList.remove('turn-check');
  updateUndoButton();
}

function renderChess(){
  const boardEl = document.getElementById('board');
  if (boardEl.dataset.game !== 'chess' || boardEl.children.length !== 64){
    boardEl.innerHTML = '';
    boardEl.dataset.game = 'chess';
    for (let r=0;r<8;r++){
      for (let c=0;c<8;c++){
        const cell = document.createElement('div');
        cell.className = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
        cell.dataset.r = r; cell.dataset.c = c;
        boardEl.appendChild(cell);
      }
    }
  }
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const cell = boardEl.children[r*8 + c];
      if (!cell) continue;
      let cls = 'cell ' + ((r+c)%2===0 ? 'light' : 'dark');
      const p = chessBoard[r][c];
      let pieceEl = cell.firstElementChild;
      const hasPiece = pieceEl && pieceEl.classList.contains('chess-piece');
      if (p){
        if (!hasPiece){
          cell.innerHTML = '';
          pieceEl = document.createElement('div');
          cell.appendChild(pieceEl);
        }
        pieceEl.className = 'chess-piece ' + (p.color==='w'?'white':'black');
        const sym = PIECE_SYMBOLS[p.color][p.type];
        if (pieceEl.textContent !== sym) pieceEl.textContent = sym;
      } else if (hasPiece){
        cell.innerHTML = '';
      }
      if (chessLastMove){
        if (chessLastMove.from.r===r&&chessLastMove.from.c===c) cls += ' last-move';
        if (chessLastMove.to.r===r&&chessLastMove.to.c===c) cls += ' last-move';
      }
      if (chessSelected && chessSelected.r===r && chessSelected.c===c) cls += ' selected';
      if (chessCheckSquare && chessCheckSquare.r===r && chessCheckSquare.c===c) cls += ' check-highlight';
      const hint = chessValidMoves.find(m=>m.to.r===r&&m.to.c===c);
      if (hint){ cls += ' hint'; if (chessBoard[r][c]) cls += ' capture'; }
      if (cell.className !== cls) cell.className = cls;
    }
  }
  let text = chessTurn==='w' ? 'Ход белых' : 'Ход чёрных';
  if (currentMode==='bot'||currentMode==='bot-free'){ if (chessTurn==='b') text = '🤖 Думает...'; }
  if (chessCheckSquare) text += ' — ШАХ!';
  const statusEl = document.getElementById('status');
  statusEl.textContent = text;
  const isYourTurn = (chessTurn === 'w' && (currentMode === 'bot' || currentMode === 'bot-free'));
  if (isYourTurn) statusEl.classList.add('turn-check');
  else statusEl.classList.remove('turn-check');
  scheduleEvalUpdate();
  updateUndoButton();
}

function renderTTT(){
  const el = document.getElementById('ttt-board');
  el.innerHTML = '';
  for (let i=0;i<9;i++){
    const cell = document.createElement('div');
    cell.className = 'ttt-cell';
    const v = tttBoard[i];
    if (v){
      const span = document.createElement('span');
      span.textContent = v === 'X' ? '✕' : '◯';
      span.classList.add('mark-anim');
      cell.appendChild(span);
      cell.classList.add(v === 'X' ? 'x' : 'o');
    }
    if (tttWinLine && tttWinLine.includes(i)) cell.classList.add('win');
    cell.dataset.idx = i;
    el.appendChild(cell);
  }
  let text = '';
  if (tttWinner === 'X') text = '❌ Победили крестики!';
  else if (tttWinner === 'O') text = '⭕ Победили нолики!';
  else if (tttWinner === 'draw') text = '🤝 Ничья!';
  else {
    text = tttTurn === 'X' ? 'Ход крестиков' : 'Ход ноликов';
    if (currentMode === 'bot' && tttTurn === 'O') text = '🤖 Думает...';
  }
  const statusEl = document.getElementById('status');
  statusEl.textContent = text;
  const isYourTurn = (tttTurn === 'X' && currentMode === 'bot');
  if (isYourTurn) statusEl.classList.add('turn-check');
  else statusEl.classList.remove('turn-check');
  updateUndoButton();
}

/* ============================================================
   ПОДСКАЗКА
============================================================ */
let hintTimer = null;
function showHint(){
  if (!gameActive || animating) return;
  if (currentGame === 'ttt'){
    if (currentMode === 'bot' && tttTurn === 'O'){ toast('Сейчас ход бота'); return; }
    const idx = tttFindMove(tttBoard, tttTurn, 9);
    if (idx !== null && idx !== undefined){
      const cells = document.getElementById('ttt-board').children;
      cells[idx].classList.add('hint-best');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(()=>cells[idx].classList.remove('hint-best'), 2200);
    }
    return;
  }
  if (currentGame === 'checkers'){
    if (turn !== 'w' && (currentMode==='bot'||currentMode==='bot-free')){ toast('Сейчас ход бота'); return; }
    const moves = getAllMovesCheckers('w');
    if (!moves.length) return;
    searchAborted = false;
    searchDeadline = performance.now() + 700;
    let best=null, bestVal=-Infinity;
    for (const m of moves){
      if (checkTime()) break;
      const u = applyMoveCheckersRaw(m.from, m);
      const v = minimaxCheckers(2, -Infinity, Infinity, false, 'w', 'balanced');
      undoMoveCheckersRaw(u);
      if (searchAborted) break;
      if (v > bestVal){ bestVal=v; best=m; }
    }
    searchAborted = false; searchDeadline = 0;
    if (!best) best = moves[0];
    highlightHint('board', best.from.r*8 + best.from.c, best.r*8 + best.c);
    return;
  }
  if (currentGame === 'chess'){
    if (chessTurn !== 'w' && (currentMode==='bot'||currentMode==='bot-free')){ toast('Сейчас ход бота'); return; }
    const moves = allLegalMovesChess(chessBoard, 'w', chessCastling, chessEnPassant);
    if (!moves.length) return;
    searchAborted = false;
    searchDeadline = performance.now() + 700;
    moves.sort((a,b)=>moveOrderScore(chessBoard,b) - moveOrderScore(chessBoard,a));
    let best=null, bestVal=-Infinity;
    for (const m of moves){
      if (checkTime()) break;
      const b2 = cloneChessBoard(chessBoard);
      const c2 = {...chessCastling};
      let newEp = null;
      if (m.double) newEp = {r:(m.from.r+m.to.r)/2, c:m.from.c};
      applyMoveChess(b2, m, c2, chessEnPassant);
      const v = minimaxChess(b2, 2, -Infinity, Infinity, false, 'w', c2, newEp, 'balanced');
      if (searchAborted) break;
      if (v > bestVal){ bestVal=v; best=m; }
    }
    searchAborted = false; searchDeadline = 0;
    if (!best) best = moves[0];
    highlightHint('board', best.from.r*8 + best.from.c, best.to.r*8 + best.to.c);
  }
}

function highlightHint(boardId, idx1, idx2){
  const el = document.getElementById(boardId);
  if (!el) return;
  const cells = el.children;
  if (cells[idx1]) cells[idx1].classList.add('hint-best');
  if (cells[idx2]) cells[idx2].classList.add('hint-best');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(()=>{
    if (cells[idx1]) cells[idx1].classList.remove('hint-best');
    if (cells[idx2]) cells[idx2].classList.remove('hint-best');
  }, 2200);
}

/* ============================================================
   СДАТЬСЯ
============================================================ */
function resignGame(){
  if (!gameActive) return;
  if (!confirm('Сдаться? Поражение.')) return;
  if (currentGame === 'checkers') endGameCheckers('b');
  else if (currentGame === 'chess') endGameChess('b', 'сдача');
  else endGameTTT(tttTurn === 'X' ? 'O' : 'X');
}

/* ============================================================
   ОЦЕНКА
============================================================ */
function updateEvalBar(){
  const bar = document.getElementById('eval-bar');
  const fill = document.getElementById('eval-fill');
  const label = document.getElementById('eval-label');
  if (!bar || !fill || !label) return;
  if (currentGame !== 'chess'){ bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  const evalWhite = evaluateChess(chessBoard, 'w', 'balanced');
  const clamped = Math.max(-1500, Math.min(1500, evalWhite));
  const pct = (clamped / 1500 + 1) / 2;
  if (pct >= 0.5){
    fill.style.left = '50%';
    fill.style.width = ((pct - 0.5) * 100) + '%';
    fill.style.background = '#f4ecd8';
  } else {
    fill.style.left = (pct * 100) + '%';
    fill.style.width = ((0.5 - pct) * 100) + '%';
    fill.style.background = '#1a1008';
  }
  if (Math.abs(evalWhite) < 30) label.textContent = 'Равная позиция';
  else if (evalWhite > 0) label.textContent = 'Белые +' + (evalWhite/100).toFixed(1);
  else label.textContent = 'Чёрные +' + (-evalWhite/100).toFixed(1);
}

/* ============================================================
   АНАЛИЗ
============================================================ */
let analysisState = { moves: [], index: 0 };

function startAnalysis(){
  const isCheckers = currentGame === 'checkers';
  const isTTT = currentGame === 'ttt';
  analysisState.moves = []; analysisState.index = 0;
  if (isTTT){
    analysisState.moves.push(Array(9).fill(null));
    const b = Array(9).fill(null);
    for (const entry of moveHistory){
      if (entry.game !== 'ttt') continue;
      b[entry.idx] = entry.player;
      analysisState.moves.push(b.slice());
    }
  } else if (isCheckers){
    const start = [];
    for (let r=0;r<8;r++){
      const row = [];
      for (let c=0;c<8;c++){
        row.push(null);
        if ((r+c)%2===1){ if (r<3) row[c]='b'; else if (r>4) row[c]='w'; }
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
  if (currentGame === 'ttt'){
    el.style.gridTemplateColumns = 'repeat(3, 1fr)';
    el.style.gridTemplateRows = 'repeat(3, 1fr)';
    const pos = analysisState.moves[analysisState.index];
    for (let i=0;i<9;i++){
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      if (pos[i]){ cell.textContent = pos[i] === 'X' ? '✕' : '◯';
        cell.classList.add(pos[i] === 'X' ? 'x' : 'o'); }
      el.appendChild(cell);
    }
  } else {
    el.style.gridTemplateColumns = 'repeat(8, 1fr)';
    el.style.gridTemplateRows = 'repeat(8, 1fr)';
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
  }
  document.getElementById('an-counter').textContent =
    `${analysisState.index} / ${analysisState.moves.length-1}`;
  document.getElementById('an-first').disabled = analysisState.index===0;
  document.getElementById('an-prev').disabled = analysisState.index===0;
  document.getElementById('an-next').disabled = analysisState.index===analysisState.moves.length-1;
  document.getElementById('an-last').disabled = analysisState.index===analysisState.moves.length-1;
  document.getElementById('analysis-status').textContent =
    analysisState.index===0 ? 'Начальная позиция' : `Ход № ${analysisState.index}`;
}
function analysisStep(dir){
  analysisState.index = Math.max(0, Math.min(analysisState.moves.length-1, analysisState.index + dir));
  renderAnalysis();
}
function analysisGo(idx){
  if (idx === -1) analysisState.index = analysisState.moves.length-1;
  else analysisState.index = idx;
  renderAnalysis();
}
function closeAnalysis(){ showScreen('screen-menu'); }

/* ============================================================
   СЕТЕВАЯ ИГРА
============================================================ */
let netCode = '';

function showNetwork(){
  document.getElementById('net-input').value = '';
  document.getElementById('net-own-code').textContent = 'Нажми «Создать код»';
  netCode = '';
  showScreen('screen-network');
}

function netCreate(){
  const payload = {
    game: currentGame, mode: currentMode,
    elo: state.elo, playerName: state.playerName,
    ts: Date.now(), version: SCHEMA_VERSION
  };
  if (currentGame === 'checkers'){
    payload.board = board;
    payload.turn = turn;
    payload.mustCapture = mustCapture;
    payload.moveHistory = moveHistory.map(m=>({ game:'checkers', undo: m.undo }));
  } else if (currentGame === 'chess'){
    payload.board = chessBoard;
    payload.turn = chessTurn;
    payload.castling = {...chessCastling};
    payload.enPassant = chessEnPassant;
    payload.fifty = capturedFifty;
    payload.moveHistory = moveHistory.map(m=>({
      game:'chess', undo: m.undo,
      enPassantBefore: m.enPassantBefore, castlingBefore: m.castlingBefore
    }));
  } else {
    payload.board = tttBoard;
    payload.turn = tttTurn;
    payload.moveHistory = moveHistory.map(m=>({
      game:'ttt', idx: m.idx, player: m.player, turnBefore: m.turnBefore
    }));
  }
  const enc = encodeProgress(payload);
  netCode = 'GAME#' + enc;
  document.getElementById('net-own-code').textContent = netCode;
  copyToClipboard(netCode);
  toast('📤 Код создан и скопирован!');
  playSound('select');
}

function netCopy(){
  if (!netCode){ toast('Сначала создай код'); return; }
  copyToClipboard(netCode);
  toast('📋 Скопировано!');
}

function netJoin(){
  const raw = document.getElementById('net-input').value.trim();
  if (!raw){ toast('Вставь код'); return; }
  let data = null;
  if (raw.startsWith('GAME#')) data = decodeProgress(raw.slice(5));
  else data = decodeProgress(raw);
  if (!data || !data.game){ toast('❌ Неверный код'); return; }
  currentGame = data.game;
  currentMode = 'net';
  activeBot = null;
  gameActive = true;
  moveHistory = [];
  capturedFifty = data.fifty || 0;
  positionCounts = {};
  clearCaches();
  if (animTimer){ clearTimeout(animTimer); animTimer = null; }
  animating = false;
  const boardEl = document.getElementById('board');
  const tttEl = document.getElementById('ttt-board');
  const evalBar = document.getElementById('eval-bar');
  if (currentGame === 'ttt'){
    boardEl.style.display = 'none';
    tttEl.style.display = 'grid';
    evalBar.style.display = 'none';
    tttBoard = data.board.slice();
    tttTurn = data.turn;
    tttWinner = null; tttWinLine = null;
    tttGameActive = true; tttBotBusy = false;
    moveHistory = (data.moveHistory || []).map(m=>({
      game:'ttt', idx: m.idx, player: m.player, turnBefore: m.turnBefore
    }));
  } else if (currentGame === 'checkers'){
    boardEl.style.display = 'grid';
    tttEl.style.display = 'none';
    evalBar.style.display = 'none';
    board = data.board;
    turn = data.turn;
    mustCapture = data.mustCapture || false;
    selected = null; validMoves = []; lastMove = null;
    moveHistory = (data.moveHistory || []).map(m=>({ game:'checkers', undo: m.undo }));
  } else {
    boardEl.style.display = 'grid';
    tttEl.style.display = 'none';
    evalBar.style.display = 'block';
    chessBoard = data.board;
    chessTurn = data.turn;
    chessCastling = data.castling || { wK:true,wQ:true,bK:true,bQ:true };
    chessEnPassant = data.enPassant || null;
    chessSelected = null; chessValidMoves = [];
    chessCheckSquare = null;
    chessGameActive = true;
    countPosition();
    moveHistory = (data.moveHistory || []).map(m=>({
      game:'chess', undo: m.undo,
      enPassantBefore: m.enPassantBefore, castlingBefore: m.castlingBefore
    }));
  }
  render();
  showScreen('screen-game');
  document.getElementById('game-title').textContent =
    'По сети · ' + (currentGame === 'checkers' ? 'Шашки'
    : currentGame === 'chess' ? 'Шахматы' : 'Крестики-нолики');
  toast('🎮 Партия загружена!');
  updateUndoButton();
}

/* ============================================================
   ДЕЛЕГИРОВАНИЕ КЛИКОВ
============================================================ */
document.getElementById('board').addEventListener('click', (e)=>{
  const cell = e.target.closest('.cell');
  if (!cell) return;
  const r = parseInt(cell.dataset.r, 10);
  const c = parseInt(cell.dataset.c, 10);
  if (isNaN(r) || isNaN(c)) return;
  if (currentGame === 'checkers') onCellClickCheckers(r, c);
  else if (currentGame === 'chess') onCellClickChess(r, c);
}, { passive: true });

document.getElementById('ttt-board').addEventListener('click', (e)=>{
  const cell = e.target.closest('.ttt-cell');
  if (!cell) return;
  const idx = parseInt(cell.dataset.idx, 10);
  if (!isNaN(idx)) onTTTClick(idx);
}, { passive: true });

/* ============================================================
   ГЛОБАЛЬНЫЙ КЛИК — throttle
============================================================ */
let clickThrottle = 0;
document.addEventListener('click', (e)=>{
  const now = performance.now();
  if (now - clickThrottle < 80) return;
  clickThrottle = now;
  const btn = e.target.closest('.menu-btn, .back-btn, .resume-btn, .tabs button, .game-actions button, .theme-switch button, .net-actions button, .end-buttons button, .code-actions button, .modal-btns button');
  if (!btn || btn.disabled) return;
  if (state.sound) playSound('click');
  vibrate(4);
}, { passive: true });

/* ============================================================
   СОХРАНЕНИЕ ПРИ УХОДЕ
============================================================ */
window.addEventListener('beforeunload', ()=>{
  if (gameActive) saveCurrentGame();
});
document.addEventListener('visibilitychange', ()=>{
  if (document.hidden && gameActive) saveCurrentGame();
});

/* ============================================================
   ПЕРИОДИЧЕСКАЯ ПРОВЕРКА НОЧНОГО РЕЖИМА
============================================================ */
setInterval(()=>{
  checkNightMode();
}, 5 * 60 * 1000);

/* ============================================================
   PREVENT ZOOM
============================================================ */
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());

/* ============================================================
   SERVICE WORKER
============================================================ */
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW не зарегистрирован', err);
    });
  });
}

/* ============================================================
   ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
============================================================ */
updateResumeButton();
