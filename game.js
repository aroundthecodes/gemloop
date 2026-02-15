const canvas = document.getElementById("board-canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const muteBtn = document.getElementById("mute-btn");
const overlayPanel = document.querySelector(".overlay-panel");
const rotateOverlay = document.getElementById("rotate-overlay");
const splashScreen = document.getElementById("splash-screen");
const statusText = document.getElementById("status-text");
const instructionsPanel = document.querySelector(".instructions");
const balanceText = document.getElementById("coin-balance");
const betText = document.getElementById("coin-bet");
const scoreText = document.getElementById("coin-score");
const clearBetsBtn = document.getElementById("clear-bets");

let boardWidth = 960;
let boardHeight = 680;
const paddingX = 56;
const paddingY = 24;
let usableX = boardWidth - paddingX * 2;
let usableY = boardHeight - paddingY * 2;
const sideTileGap = 8;
const INITIAL_COINS = 300;
const BET_PER_TILE = 10;
const WIN_MULTIPLIER = 10;
const WIN_STREAK_MULTIPLIER = 2;
const SCORE_BASE_WIN = 100;
const SCORE_TIME_STEP_SECONDS = 30;
const SCORE_TIME_BONUS_PER_STEP = 15;
const SCORE_STREAK_BONUS = 40;
const GEM_GLOSS_OPACITY = 0.26;
const SHINE_SWEEP_OPACITY = 0.34;
const TWINKLE_INTENSITY = 0.72;
const IDLE_HINT_TEXT = "Click on gems and press START";
const USE_GEM_ASSETS = false;
const PREFERS_REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
const HIGH_SCORE_KEY = "gem_loop_high_score";
const LANDSCAPE_BOARD = { width: 960, height: 680 };
const PORTRAIT_BASE_WIDTH = 680;

function setBoardSize(width, height) {
  boardWidth = width;
  boardHeight = height;
  usableX = boardWidth - paddingX * 2;
  usableY = boardHeight - paddingY * 2;
  canvas.width = boardWidth;
  canvas.height = boardHeight;
  canvas.style.aspectRatio = `${boardWidth} / ${boardHeight}`;
  if (splashScreen) {
    splashScreen.style.aspectRatio = `${boardWidth} / ${boardHeight}`;
  }
}

setBoardSize(LANDSCAPE_BOARD.width, LANDSCAPE_BOARD.height);

function loadHighScore() {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = Number(raw ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  } catch (_) {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch (_) {
    // Ignore storage errors.
  }
}

const gemCatalog = [
  { name: "Ruby", color: "#ff5f6d" },
  { name: "Sapphire", color: "#3b82f6" },
  { name: "Emerald", color: "#34d399" },
  { name: "Diamond", color: "#cbd5f5" },
  { name: "Amethyst", color: "#a78bfa" },
  { name: "Topaz", color: "#f6c16d" },
  { name: "Onyx", color: "#475569" },
  { name: "Opal", color: "#f4f1ff" },
  { name: "Spinel", color: "#fb7185" },
  { name: "Citrine", color: "#fbbf24" },
  { name: "Aquamarine", color: "#7dd3fc" },
  { name: "Peridot", color: "#bef264" },
  { name: "Garnet", color: "#dc2626" },
  { name: "Morganite", color: "#fda4af" },
  { name: "Tourmaline", color: "#a78bfa" },
  { name: "Zircon", color: "#fcd34d" },
];

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized
        .split("")
        .map((ch) => ch + ch)
        .join("")
    : normalized;
  const int = parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToCss(r, g, b, a = 1) {
  return `rgba(${Math.max(0, Math.min(255, Math.round(r)))}, ${Math.max(
    0,
    Math.min(255, Math.round(g)),
  )}, ${Math.max(0, Math.min(255, Math.round(b)))}, ${a})`;
}

function tint(rgb, amount) {
  return {
    r: rgb.r + (255 - rgb.r) * amount,
    g: rgb.g + (255 - rgb.g) * amount,
    b: rgb.b + (255 - rgb.b) * amount,
  };
}

function shade(rgb, amount) {
  return {
    r: rgb.r * (1 - amount),
    g: rgb.g * (1 - amount),
    b: rgb.b * (1 - amount),
  };
}

function createGemTexture(baseHex) {
  const size = 256;
  const tex = document.createElement("canvas");
  tex.width = size;
  tex.height = size;
  const tctx = tex.getContext("2d");
  const base = hexToRgb(baseHex);
  const bright = tint(base, 0.45);
  const dark = shade(base, 0.5);

  const bg = tctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, rgbToCss(bright.r, bright.g, bright.b));
  bg.addColorStop(1, rgbToCss(dark.r, dark.g, dark.b));
  tctx.fillStyle = bg;
  tctx.fillRect(0, 0, size, size);

  tctx.globalAlpha = 0.45;
  tctx.fillStyle = "#ffffff";
  tctx.beginPath();
  tctx.moveTo(size * 0.08, size * 0.24);
  tctx.lineTo(size * 0.48, size * 0.06);
  tctx.lineTo(size * 0.66, size * 0.34);
  tctx.lineTo(size * 0.26, size * 0.46);
  tctx.closePath();
  tctx.fill();

  tctx.globalAlpha = 0.3;
  tctx.fillStyle = "#0a1328";
  tctx.beginPath();
  tctx.moveTo(size * 0.34, size * 0.54);
  tctx.lineTo(size * 0.9, size * 0.42);
  tctx.lineTo(size * 0.74, size * 0.92);
  tctx.lineTo(size * 0.18, size * 0.84);
  tctx.closePath();
  tctx.fill();

  tctx.globalAlpha = 0.28;
  tctx.strokeStyle = "#ffffff";
  tctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const offset = 24 + i * 42;
    tctx.beginPath();
    tctx.moveTo(offset, size * 0.1);
    tctx.lineTo(size * 0.92, offset);
    tctx.stroke();
  }
  tctx.globalAlpha = 1;

  return tex;
}

function toAssetSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function loadGemAsset(name) {
  if (!USE_GEM_ASSETS) return null;
  const img = new Image();
  img.src = `assets/gems/${toAssetSlug(name)}.png?v=20260213r`;
  return img;
}

const bonusIndices = new Set([4, 9, 16, 21]);

function getLayoutCounts() {
  const portrait = window.innerHeight > window.innerWidth;
  if (isMobileLikeDevice() && portrait) {
    // Portrait support: swap top/bottom with left/right density.
    return { top: 4, bottom: 4, right: 8, left: 8 };
  }
  return { top: 8, bottom: 8, right: 4, left: 4 };
}

function getBoardSizeForViewport() {
  const portrait = window.innerHeight > window.innerWidth;
  if (isMobileLikeDevice() && portrait) {
    const viewportW = Math.max(320, window.innerWidth);
    const viewportH = Math.max(480, window.innerHeight);
    const dynamicHeight = Math.round((PORTRAIT_BASE_WIDTH * viewportH) / viewportW);
    return {
      width: PORTRAIT_BASE_WIDTH,
      height: Math.max(900, Math.min(1600, dynamicHeight)),
    };
  }
  return LANDSCAPE_BOARD;
}

function getSideTileMax(count) {
  const sideInset = 2;
  const numerator = usableY - 2 * (1 + sideInset) - (count - 1) * sideTileGap;
  return numerator / (count + 2);
}

function buildBoardLayout() {
  const counts = getLayoutCounts();
  const portraitMobile = isMobileLikeDevice() && window.innerHeight > window.innerWidth;
  const topSpacing = usableX / (counts.top - 1);
  const bottomSpacing = usableX / (counts.bottom - 1);
  const horizontalLimit = Math.min(topSpacing, bottomSpacing) * 0.95;
  const verticalLimit = Math.min(getSideTileMax(counts.right), getSideTileMax(counts.left));
  const tileSize = Math.min(horizontalLimit, verticalLimit, 96);
  return {
    ...counts,
    topSpacing,
    bottomSpacing,
    tileSize,
    sideInset: 2,
    rowInset: tileSize / 2 + 1,
    portraitMobile,
  };
}

function buildTiles(layout) {
  const tiles = [];
  const cornerTopLeft = 0;
  const cornerTopRight = layout.top - 1;
  const cornerBottomRight = layout.top + layout.right;
  const cornerBottomLeft = layout.top + layout.right + layout.bottom - 1;
  const cornerIndices = new Set([cornerTopLeft, cornerTopRight, cornerBottomRight, cornerBottomLeft]);
  const addTile = (x, y, edge) => {
    const idx = tiles.length;
    const catalog = gemCatalog[idx % gemCatalog.length];
    tiles.push({
      index: idx,
      gem: catalog.name,
      color: catalog.color,
      x,
      y,
      width: layout.tileSize,
      height: layout.tileSize,
      special: cornerIndices.has(idx) ? "jackpot" : null,
      multiplier: bonusIndices.has(idx) ? 1.5 : 1,
    });
  };

  const sideTopEdge = paddingY + layout.rowInset + layout.tileSize / 2 + layout.sideInset;
  const sideBottomEdge = paddingY + usableY - layout.rowInset - layout.tileSize / 2 - layout.sideInset;
  const portraitEdgeInset = layout.portraitMobile ? Math.max(32, Math.round(layout.tileSize * 0.46)) : 0;
  const sideInnerTop = sideTopEdge + portraitEdgeInset;
  const sideInnerBottom = sideBottomEdge - portraitEdgeInset;
  const sideAvailable = sideInnerBottom - sideInnerTop;
  const getSideStep = (count) => {
    if (count <= 1) return layout.tileSize + sideTileGap;
    const fitGap = (sideAvailable - count * layout.tileSize) / (count - 1);
    if (layout.portraitMobile) {
      return layout.tileSize + Math.max(2, fitGap);
    }
    return layout.tileSize + sideTileGap;
  };
  const rightStep = getSideStep(layout.right);
  const leftStep = getSideStep(layout.left);
  const rightStackHeight = layout.right * layout.tileSize + (layout.right - 1) * (rightStep - layout.tileSize);
  const leftStackHeight = layout.left * layout.tileSize + (layout.left - 1) * (leftStep - layout.tileSize);
  const rightStartY = layout.portraitMobile
    ? sideInnerTop + layout.tileSize / 2
    : sideTopEdge + Math.max(0, (sideAvailable - rightStackHeight) / 2) + layout.tileSize / 2;
  const leftStartY = layout.portraitMobile
    ? sideInnerTop + layout.tileSize / 2
    : sideTopEdge + Math.max(0, (sideAvailable - leftStackHeight) / 2) + layout.tileSize / 2;

  for (let i = 0; i < layout.top; i++) {
    const x = paddingX + i * layout.topSpacing;
    const y = paddingY + layout.rowInset;
    addTile(x, y, "top");
  }

  for (let i = 0; i < layout.right; i++) {
    const x = paddingX + usableX;
    const y = rightStartY + i * rightStep;
    addTile(x, y, "right");
  }

  for (let i = layout.bottom - 1; i >= 0; i--) {
    const x = paddingX + i * layout.bottomSpacing;
    const y = paddingY + usableY - layout.rowInset;
    addTile(x, y, "bottom");
  }

  for (let i = layout.left - 1; i >= 0; i--) {
    const x = paddingX;
    const y = leftStartY + i * leftStep;
    addTile(x, y, "left");
  }

  tiles.forEach((tile) => {
    tile.bounds = {
      x: tile.x - tile.width / 2,
      y: tile.y - tile.height / 2,
      w: tile.width,
      h: tile.height,
    };
  });

  return tiles;
}

let boardLayout = buildBoardLayout();
let tiles = buildTiles(boardLayout);
const gemTextureByName = new Map(gemCatalog.map((gem) => [gem.name, createGemTexture(gem.color)]));
const gemAssetByName = new Map(gemCatalog.map((gem) => [gem.name, loadGemAsset(gem.name)]));

const audioState = {
  ctx: null,
  master: null,
};

const state = {
  tileBets: new Map(),
  spinning: false,
  spinDuration: 0,
  spinElapsed: 0,
  spinDistance: 0,
  spinTargetIndex: 0,
  spinProgress: 0,
  spinIntervals: [],
  spinStepIndex: 0,
  spinStepTimer: 0,
  currentSpinnerIndex: 0,
  coins: INITIAL_COINS,
  currentScore: 0,
  roundBet: 0,
  highScore: loadHighScore(),
  winStreak: 0,
  playDurationMs: 0,
  roundsPlayed: 0,
  statusMessage: IDLE_HINT_TEXT,
  winnerTile: null,
  mode: "idle",
  resultTone: "neutral",
  pendingResultTone: null,
  toneRevealMs: 0,
  soundMuted: false,
  gameOver: false,
  splashVisible: Boolean(splashScreen),
  orientationBlocked: false,
  visualTimeMs: 0,
};

function spinEasing(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Single-phase ease-out: strictly decelerates from start to finish.
  return 1 - Math.pow(1 - t, 2.2);
}

function isMobileLikeDevice() {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const narrow = window.matchMedia?.("(max-width: 1024px)")?.matches ?? false;
  return coarse && narrow;
}

function updateOrientationGate() {
  state.orientationBlocked = false;
  rotateOverlay?.classList.add("hidden");
  rebuildBoardForViewport();
}

function rebuildBoardForViewport() {
  if (state.spinning) return;
  const targetBoard = getBoardSizeForViewport();
  const sizeChanged = boardWidth !== targetBoard.width || boardHeight !== targetBoard.height;
  if (sizeChanged) {
    setBoardSize(targetBoard.width, targetBoard.height);
  }
  const nextLayout = buildBoardLayout();
  const hasLayoutChange =
    boardLayout.top !== nextLayout.top ||
    boardLayout.bottom !== nextLayout.bottom ||
    boardLayout.left !== nextLayout.left ||
    boardLayout.right !== nextLayout.right;
  if (!hasLayoutChange && !sizeChanged) return;

  boardLayout = nextLayout;
  tiles = buildTiles(boardLayout);
  state.tileBets.clear();
  state.winnerTile = null;
  state.resultTone = "neutral";
  state.pendingResultTone = null;
  state.toneRevealMs = 0;
  state.currentSpinnerIndex = 0;
  updateSelectionMessage();
  updateStartState();
  render();
}

function seededUnit(a, b = 0) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function drawShineSweep(innerX, innerY, innerW, innerH, innerRadius, tileIndex) {
  if (PREFERS_REDUCED_MOTION) return;
  const cycleSec = 3.9;
  const phase = ((state.visualTimeMs / 1000 + tileIndex * 0.29) % cycleSec) / cycleSec;
  const bandWidth = innerW * 0.24;
  const cx = innerX - innerW * 0.8 + phase * innerW * 2.6;

  ctx.save();
  strokeRoundedRect(innerX, innerY, innerW, innerH, innerRadius);
  ctx.clip();
  const grad = ctx.createLinearGradient(cx - bandWidth, innerY, cx + bandWidth, innerY + innerH);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, `rgba(255,255,255,${SHINE_SWEEP_OPACITY})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(innerX, innerY, innerW, innerH);
  ctx.restore();
}

function drawTileTwinkle(innerX, innerY, innerW, innerH, tileIndex) {
  if (PREFERS_REDUCED_MOTION) return;
  const cycleSec = 2.2 + (tileIndex % 4) * 0.3;
  const phase = ((state.visualTimeMs / 1000 + tileIndex * 0.53) % cycleSec) / cycleSec;
  const pulse = Math.max(0, 1 - Math.abs(phase - 0.08) * 14);
  if (pulse <= 0.02) return;

  const px = innerX + innerW * (0.2 + seededUnit(tileIndex, 3) * 0.6);
  const py = innerY + innerH * (0.18 + seededUnit(tileIndex, 9) * 0.64);
  const r = 1.5 + pulse * 2.8;
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${(0.18 + pulse * 0.52) * TWINKLE_INTENSITY})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px - r * 1.9, py);
  ctx.lineTo(px + r * 1.9, py);
  ctx.moveTo(px, py - r * 1.9);
  ctx.lineTo(px, py + r * 1.9);
  ctx.stroke();
  ctx.restore();
}

function buildSpinIntervals(totalSteps, durationMs) {
  if (totalSteps <= 0) return [];
  const minStepMs = 58;
  const maxStepMs = 340;
  const finalLoopSteps = Math.min(tiles.length, totalSteps);
  const finalLoopStart = totalSteps - finalLoopSteps;
  const base = [];
  let baseTotal = 0;

  for (let i = 0; i < totalSteps; i++) {
    const t = totalSteps <= 1 ? 1 : i / (totalSteps - 1);
    const eased = spinEasing(t);
    let stepMs = minStepMs + (maxStepMs - minStepMs) * eased;
    if (i >= finalLoopStart) {
      // Make the final loop noticeably slower without introducing a second speed phase.
      const tailT = finalLoopSteps <= 1 ? 1 : (i - finalLoopStart) / (finalLoopSteps - 1);
      const tailBoost = 1 + 1.1 * tailT * tailT;
      stepMs *= tailBoost;
    }
    base.push(stepMs);
    baseTotal += stepMs;
  }

  const scale = durationMs / baseTotal;
  return base.map((ms) => ms * scale);
}

function getPendingBet() {
  return getTotalBetUnits() * BET_PER_TILE;
}

function getTileUnits(tileIndex) {
  return state.tileBets.get(tileIndex) ?? 0;
}

function getActiveTileCount() {
  return state.tileBets.size;
}

function getTotalBetUnits() {
  let total = 0;
  state.tileBets.forEach((count) => {
    total += count;
  });
  return total;
}

function isGameOverNow() {
  return !state.spinning && state.coins <= 0;
}

function syncGameOverState() {
  state.gameOver = isGameOverNow();
}

function ensureAudioContext() {
  if (!audioState.ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const audioCtx = new AudioCtx();
    const master = audioCtx.createGain();
    master.gain.value = 0.42;
    master.connect(audioCtx.destination);
    audioState.ctx = audioCtx;
    audioState.master = master;
  }
  if (audioState.ctx.state === "suspended") {
    audioState.ctx.resume().catch(() => {});
  }
  return audioState.ctx;
}

function updateMuteButton() {
  if (!muteBtn) return;
  muteBtn.classList.toggle("is-muted", state.soundMuted);
  muteBtn.setAttribute("aria-label", state.soundMuted ? "Sound off" : "Sound on");
  muteBtn.setAttribute("title", state.soundMuted ? "Sound off" : "Sound on");
}

function playOneShot({
  frequency = 440,
  duration = 0.08,
  type = "sine",
  gain = 0.2,
  toFrequency = null,
  attack = 0.01,
  release = 0.01,
}) {
  if (state.soundMuted) return;
  const audioCtx = ensureAudioContext();
  if (!audioCtx || !audioState.master) return;

  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  if (toFrequency !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFrequency), audioCtx.currentTime + duration);
  }
  amp.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  amp.gain.exponentialRampToValueAtTime(gain, audioCtx.currentTime + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration + release);
  osc.connect(amp);
  amp.connect(audioState.master);
  osc.start();
  osc.stop(audioCtx.currentTime + duration + release + 0.02);
}

function playStartSound() {
  playOneShot({ frequency: 392, duration: 0.085, type: "triangle", gain: 0.13, toFrequency: 440, attack: 0.008, release: 0.02 });
  setTimeout(() => {
    playOneShot({ frequency: 523, duration: 0.09, type: "triangle", gain: 0.13, toFrequency: 587, attack: 0.008, release: 0.02 });
  }, 75);
  setTimeout(() => {
    playOneShot({ frequency: 659, duration: 0.11, type: "triangle", gain: 0.12, toFrequency: 740, attack: 0.008, release: 0.02 });
  }, 150);
}

function playTileClickSound(isSelected) {
  const base = isSelected ? 1520 : 1240;
  playOneShot({
    frequency: base,
    toFrequency: base * 0.88,
    duration: 0.028,
    type: "triangle",
    gain: 0.1,
    attack: 0.0025,
    release: 0.014,
  });
}

function playSpinTick(stepMs) {
  const t = Math.max(0, Math.min(1, (stepMs - 45) / 330));
  const freq = 1680 - t * 680;
  const gain = 0.038 + t * 0.032;
  playOneShot({
    frequency: freq,
    toFrequency: freq * 0.93,
    duration: 0.02 + t * 0.012,
    type: "triangle",
    gain,
    attack: 0.002,
    release: 0.012,
  });
}

function playStopSound(isWin) {
  if (isWin) {
    playOneShot({ frequency: 523, duration: 0.12, type: "triangle", gain: 0.15, toFrequency: 587, attack: 0.006, release: 0.03 });
    setTimeout(() => {
      playOneShot({ frequency: 659, duration: 0.13, type: "triangle", gain: 0.15, toFrequency: 740, attack: 0.006, release: 0.03 });
    }, 95);
    setTimeout(() => {
      playOneShot({ frequency: 784, duration: 0.15, type: "triangle", gain: 0.14, toFrequency: 880, attack: 0.006, release: 0.03 });
    }, 200);
    setTimeout(() => {
      playOneShot({ frequency: 988, duration: 0.2, type: "triangle", gain: 0.14, toFrequency: 1175, attack: 0.006, release: 0.04 });
    }, 320);
    setTimeout(() => {
      playOneShot({ frequency: 1318, duration: 0.24, type: "triangle", gain: 0.13, toFrequency: 1568, attack: 0.006, release: 0.05 });
    }, 480);
  } else {
    playOneShot({ frequency: 330, duration: 0.16, type: "triangle", gain: 0.09, toFrequency: 220, attack: 0.006, release: 0.03 });
  }
}

function toggleSound() {
  state.soundMuted = !state.soundMuted;
  updateMuteButton();
  if (!state.soundMuted) {
    playOneShot({ frequency: 600, duration: 0.05, type: "sine", gain: 0.08, toFrequency: 700, attack: 0.004, release: 0.01 });
  }
}

function clearAllBets() {
  if (state.spinning || state.gameOver) return;
  state.tileBets.clear();
  state.winnerTile = null;
  state.resultTone = "neutral";
  state.pendingResultTone = null;
  state.toneRevealMs = 0;
  updateSelectionMessage();
  updateStartState();
  render();
}

function resetGameToInitialState() {
  state.tileBets.clear();
  state.spinning = false;
  state.spinDuration = 0;
  state.spinElapsed = 0;
  state.spinDistance = 0;
  state.spinTargetIndex = 0;
  state.spinProgress = 0;
  state.spinIntervals = [];
  state.spinStepIndex = 0;
  state.spinStepTimer = 0;
  state.currentSpinnerIndex = 0;
  state.coins = INITIAL_COINS;
  state.currentScore = 0;
  state.roundBet = 0;
  state.winStreak = 0;
  state.playDurationMs = 0;
  state.roundsPlayed = 0;
  state.statusMessage = IDLE_HINT_TEXT;
  state.winnerTile = null;
  state.mode = "idle";
  state.resultTone = "neutral";
  state.pendingResultTone = null;
  state.toneRevealMs = 0;
  state.gameOver = false;
  instructionsPanel?.classList.remove("instructions-hidden");
  updateStartState();
}

function dismissSplash() {
  if (!state.splashVisible || !splashScreen) return;
  state.splashVisible = false;
  splashScreen.classList.add("hidden");
  setTimeout(() => {
    splashScreen.remove();
  }, 340);
}

function updateStartState() {
  syncGameOverState();
  if (state.gameOver) {
    startBtn.disabled = false;
    return;
  }
  const pendingBet = getPendingBet();
  startBtn.disabled = state.spinning || pendingBet === 0 || pendingBet > state.coins;
}

function strokeRoundedRect(x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function fillRoundedRect(x, y, w, h, radius) {
  strokeRoundedRect(x, y, w, h, radius);
  ctx.fill();
}

function updateSelectionMessage() {
  if (state.spinning) return;
  if (state.gameOver) {
    state.statusMessage = "GAME OVER";
    return;
  }
  const count = getActiveTileCount();
  const units = getTotalBetUnits();
  const pendingBet = getPendingBet();
  if (units === 0) {
    state.statusMessage = IDLE_HINT_TEXT;
  } else if (pendingBet > state.coins) {
    state.statusMessage = `Not enough coins for this bet (${pendingBet}).`;
  } else {
    state.statusMessage = `${count} gem${count === 1 ? "" : "s"}, ${units} total bet${units === 1 ? "" : "s"}.`;
  }
}

function beginSpin() {
  if (state.splashVisible || state.orientationBlocked) return;
  syncGameOverState();
  if (state.spinning) {
    return;
  }
  if (state.gameOver) {
    resetGameToInitialState();
    render();
    return;
  }
  const roundBet = getPendingBet();
  if (roundBet === 0) return;
  if (roundBet > state.coins) {
    state.statusMessage = `Not enough coins. Need ${roundBet}, have ${state.coins}.`;
    render();
    return;
  }
  state.coins -= roundBet;
  state.roundBet = roundBet;
  const loops = 4 + Math.floor(Math.random() * 3);
  const targetIndex = Math.floor(Math.random() * tiles.length);
  state.spinTargetIndex = targetIndex;
  state.spinDistance = loops * tiles.length + targetIndex;
  state.spinDuration = 7800 + Math.random() * 3000;
  state.spinElapsed = 0;
  state.spinProgress = 0;
  state.spinIntervals = buildSpinIntervals(state.spinDistance, state.spinDuration);
  state.spinStepIndex = 0;
  state.spinStepTimer = 0;
  state.currentSpinnerIndex = 0;
  state.spinning = true;
  state.mode = "spinning";
  state.resultTone = "neutral";
  state.pendingResultTone = null;
  state.toneRevealMs = 0;
  state.statusMessage = ".";
  state.winnerTile = null;
  playStartSound();
  updateStartState();
  render();
}

function finalizeSpin() {
  state.spinning = false;
  state.mode = "idle";
  state.spinProgress = state.spinDistance;
  const landed = tiles[state.spinTargetIndex];
  state.winnerTile = landed;
  const landedUnits = getTileUnits(landed.index);
  const hitsSelection = landedUnits > 0;

  if (hitsSelection) {
    const previousHighScore = state.highScore;
    const winningBetAmount = landedUnits * BET_PER_TILE;
    const streakFactor = Math.pow(WIN_STREAK_MULTIPLIER, state.winStreak);
    const effectiveMultiplier = WIN_MULTIPLIER * streakFactor;
    const winAmount = winningBetAmount * effectiveMultiplier;
    state.coins += winAmount;
    state.winStreak += 1;
    const timeSteps = Math.floor(state.playDurationMs / 1000 / SCORE_TIME_STEP_SECONDS);
    const scoreGain = SCORE_BASE_WIN + timeSteps * SCORE_TIME_BONUS_PER_STEP + (state.winStreak - 1) * SCORE_STREAK_BONUS;
    state.currentScore += scoreGain;
    state.pendingResultTone = "win";
    state.resultTone = "neutral";
    state.toneRevealMs = 220;
    state.highScore = Math.max(state.highScore, state.currentScore);
    saveHighScore(state.highScore);
    const highScoreMsg = state.highScore > previousHighScore ? ` New High Score: ${state.highScore}.` : "";
    state.statusMessage = `YOU WIN! ${formatCurrency(winningBetAmount)} x ${effectiveMultiplier} = ${formatCurrency(winAmount)} (streak x${streakFactor}). Score +${scoreGain}.${highScoreMsg}`;
  } else {
    state.winStreak = 0;
    state.pendingResultTone = "lose";
    state.resultTone = "neutral";
    state.toneRevealMs = 220;
    state.statusMessage = "YOU LOST. Try again.";
  }

  syncGameOverState();
  if (state.gameOver) {
    state.statusMessage = "GAME OVER";
    state.pendingResultTone = "lose";
  }
  playStopSound(hitsSelection);

  state.currentSpinnerIndex = state.spinTargetIndex;
  state.roundBet = 0;
  state.roundsPlayed += 1;
  if (instructionsPanel && state.roundsPlayed >= 2) {
    instructionsPanel.classList.add("instructions-hidden");
  }
  updateStartState();
}

function formatCurrency(amount) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function update(dt) {
  if (!state.splashVisible && !state.gameOver) {
    state.playDurationMs += dt * 1000;
  }
  state.visualTimeMs += dt * 1000;
  if (state.spinning) {
    state.spinElapsed += dt * 1000;
    state.spinStepTimer += dt * 1000;

    let stepped = false;
    let lastStepMs = 0;
    while (
      state.spinStepIndex < state.spinDistance &&
      state.spinStepTimer >= state.spinIntervals[state.spinStepIndex]
    ) {
      lastStepMs = state.spinIntervals[state.spinStepIndex];
      state.spinStepTimer -= lastStepMs;
      state.spinStepIndex += 1;
      state.currentSpinnerIndex = (state.currentSpinnerIndex + 1) % tiles.length;
      stepped = true;
    }
    if (stepped) {
      playSpinTick(lastStepMs);
    }

    state.spinProgress = state.spinStepIndex;
    if (state.spinStepIndex >= state.spinDistance) {
      state.currentSpinnerIndex = state.spinTargetIndex;
      finalizeSpin();
    }
  } else if (state.pendingResultTone) {
    state.toneRevealMs -= dt * 1000;
    if (state.toneRevealMs <= 0) {
      state.resultTone = state.pendingResultTone;
      state.pendingResultTone = null;
      state.toneRevealMs = 0;
    }
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, boardWidth, boardHeight);
  const tone = state.resultTone;
  const isSpinningNeutral = state.spinning && tone === "neutral";
  const isIdleNeutral = !state.spinning && tone === "neutral";
  const accent =
    tone === "win"
      ? "rgba(30, 200, 110, 0.45)"
      : tone === "lose"
        ? "rgba(235, 68, 90, 0.45)"
        : isSpinningNeutral
          ? "rgba(62, 110, 255, 0.62)"
          : isIdleNeutral
            ? "rgba(120, 82, 255, 0.34)"
            : "rgba(46, 90, 220, 0.18)";
  const bgGradient = ctx.createRadialGradient(
    boardWidth * 0.5,
    boardHeight * 0.5,
    boardHeight * 0.1,
    boardWidth * 0.5,
    boardHeight * 0.5,
    boardWidth * 0.9,
  );
  bgGradient.addColorStop(0, accent);
  bgGradient.addColorStop(1, isSpinningNeutral ? "#162b73" : isIdleNeutral ? "#120e2f" : "#04060f");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, boardWidth, boardHeight);
  if (isIdleNeutral) {
    const sideGlow = ctx.createRadialGradient(
      boardWidth * 0.12,
      boardHeight * 0.2,
      boardHeight * 0.08,
      boardWidth * 0.12,
      boardHeight * 0.2,
      boardWidth * 0.55,
    );
    sideGlow.addColorStop(0, "rgba(34, 211, 238, 0.18)");
    sideGlow.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = sideGlow;
    ctx.fillRect(0, 0, boardWidth, boardHeight);
  }

  tiles.forEach((tile) => {
    ctx.save();
    const tileUnits = getTileUnits(tile.index);
    const isSelected = tileUnits > 0;
    const baseBorder = tint(hexToRgb(tile.color), 0.32);
    const selectedBorder = tint(hexToRgb(tile.color), 0.52);
    const frameFill = tint(hexToRgb(tile.color), 0.16);
    if (isSelected) {
      ctx.shadowColor = tile.color;
      ctx.shadowBlur = 28;
    }

    const isHighlighted = state.spinning
      ? state.currentSpinnerIndex === tile.index
      : state.winnerTile && state.winnerTile.index === tile.index;

    ctx.fillStyle = rgbToCss(frameFill.r, frameFill.g, frameFill.b, 0.34);
    ctx.strokeStyle = isHighlighted
      ? "#fff"
      : isSelected
        ? rgbToCss(selectedBorder.r, selectedBorder.g, selectedBorder.b, 0.95)
        : rgbToCss(baseBorder.r, baseBorder.g, baseBorder.b, 0.16);
    ctx.lineWidth = isHighlighted ? 3 : isSelected ? 2.8 : 0.65;
    fillRoundedRect(tile.bounds.x, tile.bounds.y, tile.bounds.w, tile.bounds.h, 14);
    ctx.stroke();

    if (isHighlighted) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      strokeRoundedRect(tile.bounds.x - 1, tile.bounds.y - 1, tile.bounds.w + 2, tile.bounds.h + 2, 18);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 220, 255, 0.9)";
      ctx.lineWidth = 3;
      strokeRoundedRect(tile.bounds.x - 4, tile.bounds.y - 4, tile.bounds.w + 8, tile.bounds.h + 8, 20);
      ctx.stroke();
      ctx.restore();
    }
    if (isSelected && !isHighlighted) {
      const pulse = 0.2 + 0.14 * (0.5 + 0.5 * Math.sin(state.visualTimeMs * 0.005 + tile.index));
      ctx.save();
      ctx.strokeStyle = rgbToCss(selectedBorder.r, selectedBorder.g, selectedBorder.b, Math.min(0.62, pulse + 0.12));
      ctx.lineWidth = 1.7;
      strokeRoundedRect(tile.bounds.x - 1, tile.bounds.y - 1, tile.bounds.w + 2, tile.bounds.h + 2, 16);
      ctx.stroke();
      ctx.restore();
    }

    const innerX = tile.bounds.x + 4;
    const innerY = tile.bounds.y + 4;
    const innerW = tile.bounds.w - 8;
    const innerH = tile.bounds.h - 8;
    const innerRadius = 10;
    const asset = gemAssetByName.get(tile.gem);
    ctx.save();
    strokeRoundedRect(innerX, innerY, innerW, innerH, innerRadius);
    ctx.clip();
    if (asset && asset.complete && asset.naturalWidth > 0) {
      ctx.drawImage(asset, innerX, innerY, innerW, innerH);
    } else {
      const texture = gemTextureByName.get(tile.gem);
      if (texture) {
        ctx.drawImage(texture, innerX, innerY, innerW, innerH);
      } else {
        ctx.fillStyle = tile.color;
        ctx.fillRect(innerX, innerY, innerW, innerH);
      }
    }
    const gloss = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    gloss.addColorStop(0, `rgba(255,255,255,${GEM_GLOSS_OPACITY})`);
    gloss.addColorStop(0.42, "rgba(255,255,255,0.08)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.restore();
    drawShineSweep(innerX, innerY, innerW, innerH, innerRadius, tile.index);
    drawTileTwinkle(innerX, innerY, innerW, innerH, tile.index);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const mobileFontBoost = isMobileLikeDevice() ? 1.5 : 0;
    const labelFontSize = (isHighlighted ? 16 : 13) + mobileFontBoost;
    ctx.font = `600 ${labelFontSize}px Inter`;
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 6;
    ctx.fillText(tile.gem, tile.x, tile.y);
    ctx.shadowBlur = 0;

    if (tileUnits === 1) {
      const r = 5;
      const cx = tile.bounds.x + tile.bounds.w - 11;
      const cy = tile.bounds.y + 11;
      ctx.fillStyle = "rgba(255, 196, 64, 0.98)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(80, 42, 0, 0.95)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (tileUnits > 1) {
      const badgeW = 24;
      const badgeH = 20;
      const bx = tile.bounds.x + tile.bounds.w - badgeW - 6;
      const by = tile.bounds.y + 6;
      ctx.fillStyle = "rgba(255, 196, 64, 0.98)";
      fillRoundedRect(bx, by, badgeW, badgeH, 8);
      ctx.strokeStyle = "rgba(80, 42, 0, 0.95)";
      ctx.lineWidth = 1.2;
      strokeRoundedRect(bx, by, badgeW, badgeH, 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(38, 20, 0, 0.98)";
      ctx.font = "700 12px Inter";
      ctx.fillText(String(tileUnits), bx + badgeW / 2, by + badgeH / 2);
    }
    ctx.restore();
  });
}

function handleCanvasClick(event) {
  if (state.splashVisible || state.orientationBlocked) return;
  syncGameOverState();
  if (state.spinning || state.gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const clicked = tiles.find((tile) => {
    const { x: bx, y: by, w, h } = tile.bounds;
    return x >= bx && x <= bx + w && y >= by && y <= by + h;
  });

  if (!clicked) return;

  const nextBet = getPendingBet() + BET_PER_TILE;
  if (nextBet > state.coins) {
    state.statusMessage = `Not enough coins for this bet (${nextBet}).`;
    render();
    return;
  }
  state.tileBets.set(clicked.index, getTileUnits(clicked.index) + 1);
  playTileClickSound(true);

  updateSelectionMessage();
  updateStartState();
  render();
}

canvas.addEventListener("click", handleCanvasClick);
startBtn.addEventListener("click", beginSpin);
muteBtn?.addEventListener("click", toggleSound);
clearBetsBtn?.addEventListener("click", clearAllBets);
window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (state.orientationBlocked) return;
  if (event.code === "Backspace" || event.code === "Delete") {
    event.preventDefault();
    clearAllBets();
    return;
  }
  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    beginSpin();
  }
});

function render() {
  drawBoard();
  overlayPanel?.classList.toggle("is-spinning", state.spinning);
  const spinningText = state.currentSpinnerIndex % 2 === 0 ? "." : ".....";
  statusText.textContent = state.spinning ? spinningText : state.statusMessage;
  const pendingBet = getPendingBet();
  const displayBet = state.spinning ? state.roundBet : pendingBet;
  const controlsDisabled = state.spinning || state.gameOver;
  balanceText.textContent = formatCurrency(state.coins);
  betText.textContent = formatCurrency(displayBet);
  if (scoreText) {
    scoreText.textContent = state.currentScore.toLocaleString();
  }
  if (clearBetsBtn) {
    clearBetsBtn.disabled = controlsDisabled || getTotalBetUnits() === 0;
  }
  startBtn.textContent = state.gameOver ? "RESTART" : "START";
}

function gameLoop(time) {
  if (!window._lastTime) {
    window._lastTime = time;
  }
  const dt = (time - window._lastTime) / 1000;
  window._lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

window.advanceTime = function (ms) {
  const dt = ms / 1000;
  update(dt);
  render();
};

window.render_game_to_text = function () {
  const spinnerIndex = state.currentSpinnerIndex;
  const currentTile = tiles[(spinnerIndex + tiles.length) % tiles.length];
  return JSON.stringify({
    mode: state.mode,
    coins: state.coins,
    currentScore: state.currentScore,
    currentBet: state.spinning ? state.roundBet : getPendingBet(),
    highScore: state.highScore,
    winStreak: state.winStreak,
    selectedGems: Array.from(state.tileBets.entries()).map(([id, count]) => ({
      gem: tiles[id]?.gem ?? id,
      count,
    })),
    spinnerIndex: spinnerIndex,
    spinnerGem: currentTile?.gem ?? null,
    spinning: state.spinning,
    gameOver: state.gameOver,
    status: state.statusMessage,
  });
};

render();
updateMuteButton();
updateOrientationGate();
window.addEventListener("resize", updateOrientationGate);
window.addEventListener("orientationchange", updateOrientationGate);
if (state.splashVisible) {
  setTimeout(dismissSplash, 2300);
}
requestAnimationFrame(gameLoop);
