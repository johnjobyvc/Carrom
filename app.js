const canvas = document.getElementById('carromCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

const BOARD = {
  x: 110,
  y: 110,
  size: 580,
  pocketR: 22,
  pocketCaptureRatio: 0.2,
  wallDamping: 0.92,
  friction: 0.992,
  minSpeed: 0.03
};

const COIN_R = 14;
const STRIKER_R = 16;
const TOTAL_COINS = 20;

let coins = [];
let striker = null;
let dragging = false;
let dragPoint = null;

function createCoins() {
  const list = [];

  // 19 coins in hex-like packing + 1 extra to match requested total 20 coins.
  const rows = [3, 4, 5, 4, 3, 1];
  const spacing = COIN_R * 2.15;
  let y = BOARD.y + BOARD.size / 2 - ((rows.length - 1) * spacing) / 2;
  let colorToggle = true;

  for (const count of rows) {
    const startX = BOARD.x + BOARD.size / 2 - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i += 1) {
      const x = startX + i * spacing;
      const color = colorToggle ? '#f8fafc' : '#1f2937';
      list.push({ x, y, r: COIN_R, vx: 0, vy: 0, color, queen: false });
      colorToggle = !colorToggle;
    }
    y += spacing;
  }

  // Queen at center
  list[9].color = '#d92f2f';
  list[9].queen = true;

  return list;
}

function createStriker() {
  return {
    x: BOARD.x + BOARD.size / 2,
    y: BOARD.y + BOARD.size - 58,
    r: STRIKER_R,
    vx: 0,
    vy: 0,
    color: '#c9b089'
  };
}

function resetGame() {
  coins = createCoins();
  striker = createStriker();
  dragging = false;
  dragPoint = null;
  updateStatus();
}

function updateStatus(message = '') {
  const left = coins.length;
  statusEl.textContent = message || `Coins left: ${left}`;
}

function drawBoard() {
  const { x, y, size } = BOARD;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer board
  ctx.fillStyle = '#dcb27a';
  roundRect(ctx, x - 30, y - 30, size + 60, size + 60, 26);
  ctx.fill();

  // Playfield
  ctx.fillStyle = '#e9c594';
  roundRect(ctx, x, y, size, size, 20);
  ctx.fill();

  ctx.strokeStyle = '#b96f5d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 40, y + 40, size - 80, size - 80);

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Baseline and striker guide
  ctx.beginPath();
  ctx.moveTo(x + 130, y + size - 60);
  ctx.lineTo(x + size - 130, y + size - 60);
  ctx.stroke();

  // Pockets
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
  return corners.some(([cx, cy]) => {
    const overlapArea = circleOverlapArea(piece.x, piece.y, piece.r, cx, cy, BOARD.pocketR);
    const pieceArea = Math.PI * piece.r * piece.r;
    return overlapArea >= pieceArea * BOARD.pocketCaptureRatio;
  });
}

function circleOverlapArea(x1, y1, r1, x2, y2, r2) {
  const d = Math.hypot(x2 - x1, y2 - y1);

  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) {
    const minR = Math.min(r1, r2);
    return Math.PI * minR * minR;
  }

  const r1Sq = r1 * r1;
  const r2Sq = r2 * r2;

  const alpha = 2 * Math.acos((d * d + r1Sq - r2Sq) / (2 * d * r1));
  const beta = 2 * Math.acos((d * d + r2Sq - r1Sq) / (2 * d * r2));

  const area1 = 0.5 * r1Sq * (alpha - Math.sin(alpha));
  const area2 = 0.5 * r2Sq * (beta - Math.sin(beta));
  return area1 + area2;
}

function isMoving() {
  const pieces = [striker, ...coins];
  return pieces.some((p) => Math.abs(p.vx) > 0 || Math.abs(p.vy) > 0);
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

  if (pocketed(striker) && !isMoving()) {
    striker = createStriker();
  }

  for (const coin of coins) drawPiece(coin);
  drawPiece(striker);

  if (dragging && dragPoint) {
    ctx.beginPath();
    ctx.moveTo(striker.x, striker.y);
    ctx.lineTo(dragPoint.x, dragPoint.y);
    ctx.strokeStyle = '#944';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (coins.length === 0) {
    updateStatus('All 20 coins pocketed! Reset to play again.');
  } else if (!isMoving()) {
    updateStatus();
  }

  requestAnimationFrame(render);
}

canvas.addEventListener('pointerdown', (e) => {
  if (isMoving()) return;
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
  if (!dragging || !dragPoint) return;
  const dx = striker.x - dragPoint.x;
  const dy = striker.y - dragPoint.y;
  const powerScale = 0.065;
  const maxV = 18;

  striker.vx = clamp(dx * powerScale, -maxV, maxV);
  striker.vy = clamp(dy * powerScale, -maxV, maxV);

  dragging = false;
  dragPoint = null;
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
