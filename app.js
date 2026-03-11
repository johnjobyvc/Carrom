const canvas = document.getElementById('carromCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

const BOARD = {
  x: 110,
  y: 110,
  size: 580,
  pocketR: 22,
  wallDamping: 0.92,
  friction: 0.992,
  minSpeed: 0.03
};

const COIN_R = 14;
const STRIKER_R = 16;
const TOTAL_COINS = 20;
const HUMAN = 'You';
const AI = 'AI';

let coins = [];
let striker = null;
let dragging = false;
let dragPoint = null;
let currentPlayer = HUMAN;
let shotInProgress = false;
let aiScheduled = false;

function createCoins() {
  const list = [];
  const rows = [3, 4, 5, 4, 3, 1];
  const spacing = COIN_R * 2.15;
  let y = BOARD.y + BOARD.size / 2 - ((rows.length - 1) * spacing) / 2;
  let colorToggle = true;

  for (const count of rows) {
    const startX = BOARD.x + BOARD.size / 2 - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i += 1) {
      list.push({
        x: startX + i * spacing,
        y,
        r: COIN_R,
        vx: 0,
        vy: 0,
        color: colorToggle ? '#f8fafc' : '#1f2937'
      });
      colorToggle = !colorToggle;
    }
    y += spacing;
  }

  list[9].color = '#d92f2f';
  return list;
}

function placeStriker(player) {
  striker = {
    x: BOARD.x + BOARD.size / 2,
    y: player === HUMAN ? BOARD.y + BOARD.size - 58 : BOARD.y + 58,
    r: STRIKER_R,
    vx: 0,
    vy: 0,
    color: '#c9b089'
  };
}

function resetGame() {
  coins = createCoins();
  dragging = false;
  dragPoint = null;
  currentPlayer = HUMAN;
  shotInProgress = false;
  aiScheduled = false;
  placeStriker(currentPlayer);
  updateStatus();
}

function updateStatus(message = '') {
  if (message) {
    statusEl.textContent = message;
    return;
  }
  statusEl.textContent = `${currentPlayer} turn • Coins left: ${coins.length}/${TOTAL_COINS}`;
}

function drawBoard() {
  const { x, y, size } = BOARD;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#dcb27a';
  roundRect(ctx, x - 30, y - 30, size + 60, size + 60, 26);
  ctx.fill();

  ctx.fillStyle = '#e9c594';
  roundRect(ctx, x, y, size, size, 20);
  ctx.fill();

  ctx.strokeStyle = '#b96f5d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 40, y + 40, size - 80, size - 80);

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 130, y + size - 60);
  ctx.lineTo(x + size - 130, y + size - 60);
  ctx.moveTo(x + 130, y + 60);
  ctx.lineTo(x + size - 130, y + 60);
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
  const strength = Math.min(100, Math.round(Math.hypot(dx, dy) / 2.2));

  ctx.beginPath();
  ctx.moveTo(striker.x, striker.y);
  ctx.lineTo(dragPoint.x, dragPoint.y);
  ctx.strokeStyle = strength > 66 ? '#b42318' : strength > 33 ? '#ca8a04' : '#2563eb';
  ctx.lineWidth = 2 + (strength / 100) * 6;
  ctx.stroke();

  ctx.fillStyle = '#3d1f0f';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`Power ${strength}%`, dragPoint.x + 10, dragPoint.y - 10);
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

  const bounce = 0.95;
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
  return [striker, ...coins].some((p) => Math.abs(p.vx) > 0 || Math.abs(p.vy) > 0);
}

function finishTurn() {
  if (coins.length === 0) {
    updateStatus('All 20 coins pocketed! Reset to play again.');
    return;
  }

  currentPlayer = currentPlayer === HUMAN ? AI : HUMAN;
  placeStriker(currentPlayer);
  dragging = false;
  dragPoint = null;
  shotInProgress = false;
  updateStatus();
}

function aiTakeShot() {
  if (currentPlayer !== AI || coins.length === 0 || shotInProgress || isMoving()) return;

  const target = coins.reduce((best, coin) => {
    const dist = Math.hypot(coin.x - striker.x, coin.y - striker.y);
    if (!best || dist < best.dist) return { coin, dist };
    return best;
  }, null)?.coin;

  if (!target) return;
  const dx = target.x - striker.x;
  const dy = target.y - striker.y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = 10;

  striker.vx = (dx / len) * speed;
  striker.vy = (dy / len) * speed;
  shotInProgress = true;
  updateStatus('AI shot in progress...');
}

function render() {
  drawBoard();

  movePiece(striker);
  for (const coin of coins) movePiece(coin);

  for (let i = 0; i < coins.length; i += 1) {
    collide(striker, coins[i]);
    for (let j = i + 1; j < coins.length; j += 1) {
      collide(coins[i], coins[j]);
    }
  }

  coins = coins.filter((coin) => !pocketed(coin));

  for (const coin of coins) drawPiece(coin);
  drawPiece(striker);
  drawPullGuide();

  if (shotInProgress && !isMoving()) {
    finishTurn();
    aiScheduled = false;
  }

  if (currentPlayer === AI && !shotInProgress && !aiScheduled) {
    aiScheduled = true;
    setTimeout(() => {
      aiTakeShot();
      aiScheduled = false;
    }, 700);
  }

  requestAnimationFrame(render);
}

canvas.addEventListener('pointerdown', (e) => {
  if (currentPlayer !== HUMAN || shotInProgress || isMoving()) return;
  const pos = getPointerPos(e);
  if (Math.hypot(pos.x - striker.x, pos.y - striker.y) <= striker.r + 10) {
    dragging = true;
    dragPoint = pos;
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  dragPoint = getPointerPos(e);
});

canvas.addEventListener('pointerup', () => {
  if (!dragging || !dragPoint || currentPlayer !== HUMAN) return;
  const dx = striker.x - dragPoint.x;
  const dy = striker.y - dragPoint.y;
  const powerScale = 0.065;
  const maxV = 18;

  striker.vx = clamp(dx * powerScale, -maxV, maxV);
  striker.vy = clamp(dy * powerScale, -maxV, maxV);
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

resetBtn.addEventListener('click', resetGame);

resetGame();
render();
