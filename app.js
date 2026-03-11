const canvas = document.getElementById('carromCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const startBtn = document.getElementById('startBtn');
const playerNameInput = document.getElementById('playerNameInput');
const colorSelect = document.getElementById('colorSelect');
const playerNameLabel = document.getElementById('playerNameLabel');
const playerColorLabel = document.getElementById('playerColorLabel');
const aiColorLabel = document.getElementById('aiColorLabel');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');

const BOARD = {
  x: 190,
  y: 90,
  size: 260,
  pocketR: 18,
  wallDamping: 0.97,
  friction: 0.996,
  minSpeed: 0.03
};

const COIN_R = 10;
const STRIKER_R = 12;
const TOTAL_COINS = 20;
const AI = 'AI';

let coins = [];
let striker = null;
let dragging = false;
let dragPoint = null;
let currentPlayer = '';
let shotInProgress = false;
let aiScheduled = false;
let gameStarted = false;
let playerName = 'Player';
let playerColor = 'white';
let aiColor = 'black';
let scores = { player: 0, ai: 0 };
let shakeFrames = 0;

function coinColor(colorName) {
  return colorName === 'white' ? '#f8fafc' : '#1f2937';
}

function createCoins() {
  const list = [];
  const rows = [3, 4, 5, 4, 3, 1, 1, 1];
  const spacing = COIN_R * 2.15;
  let y = BOARD.y + BOARD.size / 2 - ((rows.length - 1) * spacing) / 2;

  for (let r = 0; r < rows.length; r += 1) {
    const count = rows[r];
    const startX = BOARD.x + BOARD.size / 2 - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i += 1) {
      const color = (r + i) % 2 === 0 ? coinColor('white') : coinColor('black');
      list.push({ x: startX + i * spacing, y, r: COIN_R, vx: 0, vy: 0, color, queen: false });
    }
    y += spacing;
  }

  list[9].color = '#d92f2f';
  list[9].queen = true;
  return list.slice(0, TOTAL_COINS);
}

function placeStriker(player) {
  striker = {
    x: BOARD.x + BOARD.size / 2,
    y: player === playerName ? BOARD.y + BOARD.size - 38 : BOARD.y + 38,
    r: STRIKER_R,
    vx: 0,
    vy: 0,
    color: player === playerName ? '#3b82f6' : '#f97316'
  };
}

function refreshScoreboard() {
  playerNameLabel.textContent = playerName;
  playerColorLabel.textContent = `Color: ${playerColor}`;
  aiColorLabel.textContent = `Color: ${aiColor}`;
  playerScoreEl.textContent = String(scores.player);
  aiScoreEl.textContent = String(scores.ai);
}

function startGame() {
  playerName = playerNameInput.value.trim() || 'Player';
  playerColor = colorSelect.value;
  aiColor = playerColor === 'white' ? 'black' : 'white';
  scores = { player: 0, ai: 0 };
  coins = createCoins();
  currentPlayer = playerName;
  dragging = false;
  dragPoint = null;
  shotInProgress = false;
  aiScheduled = false;
  gameStarted = true;
  placeStriker(currentPlayer);
  refreshScoreboard();
  updateStatus();
}

function updateStatus(message = '') {
  if (message) {
    statusEl.textContent = message;
    return;
  }
  if (!gameStarted) {
    statusEl.textContent = 'Set your name and color, then start. Drag can extend below board for max power.';
    return;
  }
  statusEl.textContent = `${currentPlayer} turn • Coins left: ${coins.length}/${TOTAL_COINS}`;
}

function awardPoints(removedCoins) {
  if (!removedCoins.length) return;
  let gained = 0;
  for (const coin of removedCoins) {
    gained += coin.queen ? 2 : 1;
  }

  if (currentPlayer === playerName) {
    scores.player += gained;
  } else {
    scores.ai += gained;
  }
  refreshScoreboard();
  shakeFrames = 12;
}

function drawBoard() {
  const { x, y, size } = BOARD;

  ctx.fillStyle = '#dcb27a';
  roundRect(ctx, x - 20, y - 20, size + 40, size + 40, 20);
  ctx.fill();

  ctx.fillStyle = '#e9c594';
  roundRect(ctx, x, y, size, size, 14);
  ctx.fill();

  ctx.strokeStyle = '#b96f5d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 22, y + 22, size - 44, size - 44);

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 48, y + size - 38);
  ctx.lineTo(x + size - 48, y + size - 38);
  ctx.moveTo(x + 48, y + 38);
  ctx.lineTo(x + size - 48, y + 38);
  ctx.stroke();

  drawPocket(x, y);
  drawPocket(x + size, y);
  drawPocket(x, y + size);
  drawPocket(x + size, y + size);
}

function drawPocket(px, py) {
  ctx.beginPath();
  ctx.fillStyle = '#111';
  ctx.arc(px, py, BOARD.pocketR, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawPiece(piece) {
  ctx.beginPath();
  ctx.fillStyle = piece.color;
  ctx.arc(piece.x, piece.y, piece.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.stroke();
}

function drawPullGuide() {
  if (!dragging || !dragPoint) return;
  const dx = striker.x - dragPoint.x;
  const dy = striker.y - dragPoint.y;
  const strength = Math.min(100, Math.round(Math.hypot(dx, dy) / 2));

  ctx.beginPath();
  ctx.moveTo(striker.x, striker.y);
  ctx.lineTo(dragPoint.x, dragPoint.y);
  ctx.strokeStyle = strength > 66 ? '#b42318' : strength > 33 ? '#ca8a04' : '#2563eb';
  ctx.lineWidth = 2 + (strength / 100) * 6;
  ctx.stroke();

  ctx.fillStyle = '#3d1f0f';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Power ${strength}%`, dragPoint.x + 12, dragPoint.y - 12);
}

function movePiece(piece) {
  piece.x += piece.vx;
  piece.y += piece.vy;
  piece.vx *= BOARD.friction;
  piece.vy *= BOARD.friction;

  if (Math.abs(piece.vx) < BOARD.minSpeed) piece.vx = 0;
  if (Math.abs(piece.vy) < BOARD.minSpeed) piece.vy = 0;

  const left = BOARD.x + piece.r;
  const right = BOARD.x + BOARD.size - piece.r;
  const top = BOARD.y + piece.r;
  const bottom = BOARD.y + BOARD.size - piece.r;

  if (piece.x < left) {
    piece.x = left;
    piece.vx *= -BOARD.wallDamping;
  }
  if (piece.x > right) {
    piece.x = right;
    piece.vx *= -BOARD.wallDamping;
  }
  if (piece.y < top) {
    piece.y = top;
    piece.vy *= -BOARD.wallDamping;
  }
  if (piece.y > bottom) {
    piece.y = bottom;
    piece.vy *= -BOARD.wallDamping;
  }
}

function collide(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.r + b.r;
  if (!dist || dist >= minDist) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const dvx = b.vx - a.vx;
  const dvy = b.vy - a.vy;
  const impulse = dvx * nx + dvy * ny;
  if (impulse > 0) return;

  const bounce = 0.96;
  const j = -(1 + bounce) * impulse / 2;
  a.vx -= j * nx;
  a.vy -= j * ny;
  b.vx += j * nx;
  b.vy += j * ny;
}

function pocketed(piece) {
  const corners = [
    [BOARD.x, BOARD.y],
    [BOARD.x + BOARD.size, BOARD.y],
    [BOARD.x, BOARD.y + BOARD.size],
    [BOARD.x + BOARD.size, BOARD.y + BOARD.size]
  ];
  return corners.some(([cx, cy]) => Math.hypot(piece.x - cx, piece.y - cy) < BOARD.pocketR - 2);
}

function isMoving() {
  return striker && [striker, ...coins].some((p) => Math.abs(p.vx) > 0 || Math.abs(p.vy) > 0);
}

function finishTurn() {
  if (coins.length === 0) {
    updateStatus(`Game over! ${playerName}: ${scores.player} | AI: ${scores.ai}`);
    return;
  }
  currentPlayer = currentPlayer === playerName ? AI : playerName;
  placeStriker(currentPlayer);
  dragging = false;
  dragPoint = null;
  shotInProgress = false;
  updateStatus();
}

function aiTakeShot() {
  if (currentPlayer !== AI || !gameStarted || shotInProgress || isMoving() || !coins.length) return;

  const target = coins.reduce((best, coin) => {
    const dist = Math.hypot(coin.x - striker.x, coin.y - striker.y);
    if (!best || dist < best.dist) return { coin, dist };
    return best;
  }, null)?.coin;
  if (!target) return;

  const dx = target.x - striker.x;
  const dy = target.y - striker.y;
  const len = Math.hypot(dx, dy) || 1;

  striker.vx = (dx / len) * 20.25;
  striker.vy = (dy / len) * 20.25;
  shotInProgress = true;
  updateStatus('AI shot in progress...');
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (shakeFrames > 0) {
    const offsetX = (Math.random() - 0.5) * 16;
    const offsetY = (Math.random() - 0.5) * 16;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    shakeFrames -= 1;
  }

  drawBoard();

  if (gameStarted) {
    movePiece(striker);
    for (const coin of coins) movePiece(coin);

    for (let i = 0; i < coins.length; i += 1) {
      collide(striker, coins[i]);
      for (let j = i + 1; j < coins.length; j += 1) {
        collide(coins[i], coins[j]);
      }
    }

    const removedCoins = coins.filter((coin) => pocketed(coin));
    if (removedCoins.length) {
      awardPoints(removedCoins);
      coins = coins.filter((coin) => !pocketed(coin));
    }

    for (const coin of coins) drawPiece(coin);
    drawPiece(striker);
    drawPullGuide();

    if (shotInProgress && !isMoving()) {
      finishTurn();
      aiScheduled = false;
    }

    if (currentPlayer === AI && !shotInProgress && !aiScheduled && coins.length) {
      aiScheduled = true;
      setTimeout(() => {
        aiTakeShot();
        aiScheduled = false;
      }, 550);
    }
  }

  if (shakeFrames > 0) {
    ctx.restore();
  }

  requestAnimationFrame(render);
}

canvas.addEventListener('pointerdown', (e) => {
  if (!gameStarted || currentPlayer !== playerName || shotInProgress || isMoving()) return;
  const pos = getPointerPos(e);
  if (Math.hypot(pos.x - striker.x, pos.y - striker.y) <= striker.r + 12) {
    dragging = true;
    dragPoint = pos;
  }
});

window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  dragPoint = getPointerPos(e);
});

window.addEventListener('pointerup', () => {
  if (!dragging || !dragPoint || currentPlayer !== playerName || !gameStarted) return;
  const dx = striker.x - dragPoint.x;
  const dy = striker.y - dragPoint.y;

  striker.vx = clamp(dx * 0.135, -36.45, 36.45);
  striker.vy = clamp(dy * 0.135, -36.45, 36.45);
  dragging = false;
  dragPoint = null;
  shotInProgress = true;
  updateStatus('Your shot in progress...');
});

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', startGame);

refreshScoreboard();
updateStatus();
render();
