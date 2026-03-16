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
  x: 255,
  y: 90,
  size: 390,
  pocketR: 16.56,
  wallDamping: 0.97,
  friction: 0.996,
  minSpeed: 0.03
};

const COIN_R = 12;
const STRIKER_R = 14;
const TOTAL_COINS = 19;
const AI = 'AI';

let coins = [];
let striker = null;
let dragging = false;
let dragPoint = null;
let currentPlayer = '';
let shotInProgress = false;
let aiScheduled = false;
let gameStarted = false;
let playerName = 'プレイヤー';
let playerColor = 'white';
let aiColor = 'black';
let scores = { player: 0, ai: 0 };
let pocketedByPlayer = { white: 0, black: 0, queen: 0 };
let pocketedByAI = { white: 0, black: 0, queen: 0 };
let gameOver = false;
let winnerLabel = '';
let shakeFrames = 0;

function coinColor(colorName) {
  return colorName === 'white' ? '#f8fafc' : '#1f2937';
}

function colorNameJa(colorName) {
  return colorName === 'white' ? '白' : '黒';
}

function createCoins() {
  const list = [];
  const cx = BOARD.x + BOARD.size / 2;
  const cy = BOARD.y + BOARD.size / 2;

  list.push({ x: cx, y: cy, r: COIN_R, vx: 0, vy: 0, color: '#d92f2f', queen: true, owner: 'queen' });

  const ringOneR = COIN_R * 2.2;
  const ringTwoR = COIN_R * 4.2;
  const ringOneCount = 6;
  const ringTwoCount = 12;

  let whiteTurn = true;
  const addCoinAt = (x, y) => {
    const owner = whiteTurn ? 'white' : 'black';
    list.push({ x, y, r: COIN_R, vx: 0, vy: 0, color: coinColor(owner), queen: false, owner });
    whiteTurn = !whiteTurn;
  };

  for (let i = 0; i < ringOneCount; i += 1) {
    const a = (Math.PI * 2 * i) / ringOneCount;
    addCoinAt(cx + Math.cos(a) * ringOneR, cy + Math.sin(a) * ringOneR);
  }

  for (let i = 0; i < ringTwoCount; i += 1) {
    const a = (Math.PI * 2 * i) / ringTwoCount + Math.PI / 12;
    addCoinAt(cx + Math.cos(a) * ringTwoR, cy + Math.sin(a) * ringTwoR);
  }

  return list;
}

function placeStriker(player) {
  const line = getStrikerLine(player);
  striker = {
    x: (line.minX + line.maxX) / 2,
    y: line.y,
    r: STRIKER_R,
    vx: 0,
    vy: 0,
    color: player === playerName ? '#3b82f6' : '#f97316'
  };
}

function getStrikerLine(player) {
  return {
    minX: BOARD.x + 74,
    maxX: BOARD.x + BOARD.size - 74,
    y: player === playerName ? BOARD.y + BOARD.size - 58 : BOARD.y + 58
  };
}

function placeStrikerOnLine(player, targetX) {
  const line = getStrikerLine(player);
  striker.x = clamp(targetX, line.minX, line.maxX);
  striker.y = line.y;
}

function refreshScoreboard() {
  playerNameLabel.textContent = playerName;
  playerColorLabel.textContent = `色: ${colorNameJa(playerColor)}`;
  aiColorLabel.textContent = `色: ${colorNameJa(aiColor)}`;
  playerScoreEl.textContent = String(scores.player);
  aiScoreEl.textContent = String(scores.ai);
}

function startGame() {
  playerName = playerNameInput.value.trim() || 'プレイヤー';
  playerColor = colorSelect.value;
  aiColor = playerColor === 'white' ? 'black' : 'white';
  scores = { player: 0, ai: 0 };
  pocketedByPlayer = { white: 0, black: 0, queen: 0 };
  pocketedByAI = { white: 0, black: 0, queen: 0 };
  gameOver = false;
  winnerLabel = '';
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
    statusEl.textContent = '名前と色を選んで「開始」を押してください。下の余白までドラッグできます。';
    return;
  }
  if (gameOver) {
    statusEl.textContent = `ゲーム終了！勝者: ${winnerLabel}`;
    return;
  }
  const turnLabel = currentPlayer === playerName ? 'プレイヤー' : 'AI';
  statusEl.textContent = `${turnLabel}のターン ・ 残りコイン: ${coins.length}/${TOTAL_COINS}`;
}

function awardPoints(removedCoins) {
  if (!removedCoins.length) return;

  for (const coin of removedCoins) {
    if (coin.owner === playerColor) {
      scores.player += 1;
      pocketedByPlayer[playerColor] += 1;
    } else if (coin.owner === aiColor) {
      scores.ai += 1;
      pocketedByAI[aiColor] += 1;
    } else {
      if (currentPlayer === playerName) {
        scores.player += 5;
        pocketedByPlayer.queen += 1;
      } else {
        scores.ai += 5;
        pocketedByAI.queen += 1;
      }
    }
  }

  refreshScoreboard();
  shakeFrames = 12;
}

function getPocketCenters() {
  const inset = BOARD.pocketR * 0.2;
  return [
    [BOARD.x + inset, BOARD.y + inset],
    [BOARD.x + BOARD.size - inset, BOARD.y + inset],
    [BOARD.x + inset, BOARD.y + BOARD.size - inset],
    [BOARD.x + BOARD.size - inset, BOARD.y + BOARD.size - inset]
  ];
}

function drawBoard() {
  const { x, y, size } = BOARD;

  const outerGrad = ctx.createLinearGradient(x - 28, y - 28, x + size + 28, y + size + 28);
  outerGrad.addColorStop(0, '#b8860b');
  outerGrad.addColorStop(0.5, '#f8e38c');
  outerGrad.addColorStop(1, '#9a6c00');
  ctx.fillStyle = outerGrad;
  roundRect(ctx, x - 28, y - 28, size + 56, size + 56, 26);
  ctx.fill();

  ctx.fillStyle = '#f8f6ef';
  roundRect(ctx, x - 12, y - 12, size + 24, size + 24, 20);
  ctx.fill();

  ctx.fillStyle = '#e9c594';
  roundRect(ctx, x, y, size, size, 18);
  ctx.fill();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 26, y + 26, size - 52, size - 52);
  ctx.strokeStyle = '#fffdf3';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 32, y + 32, size - 64, size - 64);

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 64, 0, Math.PI * 2);
  ctx.strokeStyle = '#c4892f';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 74, y + size - 58);
  ctx.lineTo(x + size - 74, y + size - 58);
  ctx.moveTo(x + 74, y + 58);
  ctx.lineTo(x + size - 74, y + 58);
  ctx.strokeStyle = '#b47043';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const [px, py] of getPocketCenters()) {
    drawPocket(px, py);
  }
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
  const centers = getPocketCenters();

  // Easier pocketing: keep 12% overlap rule and add ~20% assist.
  const pocketCaptureDistance = (BOARD.pocketR + piece.r * 0.12) * 1.2;
  return centers.some(([cx, cy]) => Math.hypot(piece.x - cx, piece.y - cy) <= pocketCaptureDistance);
}

function keepCoinAwayFromPocket(coin) {
  const centers = getPocketCenters();
  let nearest = centers[0];
  let nearestDist = Infinity;
  for (const c of centers) {
    const d = Math.hypot(coin.x - c[0], coin.y - c[1]);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = c;
    }
  }

  const dx = coin.x - nearest[0];
  const dy = coin.y - nearest[1];
  const len = Math.hypot(dx, dy) || 1;
  const pushOut = BOARD.pocketR + coin.r * 1.8;

  coin.x = nearest[0] + (dx / len) * pushOut;
  coin.y = nearest[1] + (dy / len) * pushOut;
  coin.vx = (dx / len) * 2.5;
  coin.vy = (dy / len) * 2.5;
}

function isMoving() {
  return striker && [striker, ...coins].some((p) => Math.abs(p.vx) > 0 || Math.abs(p.vy) > 0);
}

function determineWinner() {
  const playerAllOwnAndRed = pocketedByPlayer[playerColor] >= 9 && pocketedByPlayer.queen >= 1;
  const aiAllOwnAndRed = pocketedByAI[aiColor] >= 9 && pocketedByAI.queen >= 1;

  if (playerAllOwnAndRed) {
    winnerLabel = `${playerName}（自分のコイン+赤）`;
    return true;
  }
  if (aiAllOwnAndRed) {
    winnerLabel = 'AI（自分のコイン+赤）';
    return true;
  }

  if (coins.length === 0) {
    if (scores.player > scores.ai) {
      winnerLabel = `${playerName}（全コイン完了）`;
    } else if (scores.ai > scores.player) {
      winnerLabel = 'AI（全コイン完了）';
    } else {
      winnerLabel = '引き分け（全コイン完了）';
    }
    return true;
  }

  return false;
}

function finishTurn() {
  if (determineWinner()) {
    gameOver = true;
    updateStatus();
    return;
  }
  currentPlayer = currentPlayer === playerName ? AI : playerName;
  placeStriker(currentPlayer);
  dragging = false;
  dragPoint = null;
  shotInProgress = false;
  updateStatus();
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (!lenSq) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function aiRiskOnShot(targetCoin, shotDx, shotDy) {
  const shotLen = Math.hypot(shotDx, shotDy) || 1;
  const shotEndX = striker.x + (shotDx / shotLen) * 260;
  const shotEndY = striker.y + (shotDy / shotLen) * 260;

  let risk = 0;
  for (const coin of coins) {
    if (coin === targetCoin || coin.owner === aiColor || coin.owner === 'queen') continue;
    const lineDist = distancePointToSegment(coin.x, coin.y, striker.x, striker.y, shotEndX, shotEndY);
    if (lineDist < coin.r * 2.4) {
      risk += (coin.r * 2.4 - lineDist) * 8;
    }

    const closestPocketDist = Math.min(
      ...getPocketCenters().map(([px, py]) => Math.hypot(coin.x - px, coin.y - py))
    );
    if (closestPocketDist < BOARD.pocketR * 2.4) {
      risk += 24;
    }
  }
  return risk;
}

function aiTakeShot() {
  if (gameOver || currentPlayer !== AI || !gameStarted || shotInProgress || isMoving() || !coins.length) return;

  const ownCoins = coins.filter((c) => c.owner === aiColor);
  const targetPool = ownCoins.length ? ownCoins : coins.filter((c) => c.owner !== playerColor);

  let best = null;

  for (const coin of targetPool) {
    const toCoinDx = coin.x - striker.x;
    const toCoinDy = coin.y - striker.y;
    const strikerToCoin = Math.hypot(toCoinDx, toCoinDy);

    const nearestPocketDist = Math.min(
      ...getPocketCenters().map(([px, py]) => Math.hypot(coin.x - px, coin.y - py))
    );

    const pocketPriority = 240 - nearestPocketDist * 2.2;
    const reachPriority = 220 - strikerToCoin;
    const riskPenalty = aiRiskOnShot(coin, toCoinDx, toCoinDy);

    const score = pocketPriority + reachPriority - riskPenalty;

    if (!best || score > best.score) {
      best = { coin, score, dx: toCoinDx, dy: toCoinDy };
    }
  }

  if (!best) return;

  placeStrikerOnLine(AI, best.coin.x);

  const len = Math.hypot(best.dx, best.dy) || 1;
  const speed = 22;
  striker.vx = (best.dx / len) * speed;
  striker.vy = (best.dy / len) * speed;
  shotInProgress = true;
  updateStatus('AIショット中...');
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

  if (gameStarted && !gameOver) {
    movePiece(striker);
    for (const coin of coins) movePiece(coin);

    for (let i = 0; i < coins.length; i += 1) {
      collide(striker, coins[i]);
      for (let j = i + 1; j < coins.length; j += 1) {
        collide(coins[i], coins[j]);
      }
    }

    const removedCoins = [];
    for (const coin of coins) {
      if (!pocketed(coin)) continue;

      // AI must avoid pocketing player's color coin.
      if (currentPlayer === AI && coin.owner === playerColor) {
        keepCoinAwayFromPocket(coin);
        continue;
      }
      removedCoins.push(coin);
    }

    if (removedCoins.length) {
      awardPoints(removedCoins);
      const removedSet = new Set(removedCoins);
      coins = coins.filter((coin) => !removedSet.has(coin));
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
  if (gameOver || !gameStarted || currentPlayer !== playerName || shotInProgress || isMoving()) return;
  const pos = getPointerPos(e);

  const line = getStrikerLine(playerName);
  const clickedOnLine =
    pos.x >= line.minX - 12 &&
    pos.x <= line.maxX + 12 &&
    Math.abs(pos.y - line.y) <= 18;

  if (clickedOnLine) {
    placeStrikerOnLine(playerName, pos.x);
  }

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
  if (gameOver || !dragging || !dragPoint || currentPlayer !== playerName || !gameStarted) return;
  const dx = striker.x - dragPoint.x;
  const dy = striker.y - dragPoint.y;

  striker.vx = clamp(dx * 0.135, -36.45, 36.45);
  striker.vy = clamp(dy * 0.135, -36.45, 36.45);
  dragging = false;
  dragPoint = null;
  shotInProgress = true;
  updateStatus('あなたのショット中...');
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
