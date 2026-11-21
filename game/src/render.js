// SHADOW LANE — drawing. Top-down night museum: a dark floor, lit pools
// around the thief, guards drawn bright against the floor with their vision
// cones fanned out in front of them, crates and bushes readable at a glance,
// and the green exit glowing at the far end. Also draws every screen.
import { COLORS, CONE_RANGE, TILE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { GUARD_ALARM, GUARD_SEARCH, GUARD_SUSPICIOUS } from './guards.js';
import { coneFanPoints } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL_CLEAR = 'level-clear';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

function drawFloor(ctx, parsed) {
  for (let y = 0; y < parsed.rows; y += 1) {
    for (let x = 0; x < parsed.cols; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawWalls(ctx, parsed) {
  for (const [x, y] of parsed.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x * TILE, y * TILE, TILE, 7);
  }
}

function drawCrates(ctx, parsed) {
  for (const [x, y] of parsed.crates) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = COLORS.crateTop;
    ctx.fillRect(px + 3, py + 3, TILE - 6, 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 3);
    ctx.lineTo(px + TILE - 3, py + TILE - 3);
    ctx.moveTo(px + TILE - 3, py + 3);
    ctx.lineTo(px + 3, py + TILE - 3);
    ctx.stroke();
  }
}

function drawBushes(ctx, parsed, time) {
  for (const [x, y] of parsed.bushes) {
    const cx = (x + 0.5) * TILE;
    const cy = (y + 0.5) * TILE;
    const sway = Math.sin(time * 1.4 + x * 1.7 + y) * 2;
    ctx.fillStyle = COLORS.bush;
    ctx.beginPath();
    ctx.arc(cx - 9 + sway, cy + 4, 11, 0, Math.PI * 2);
    ctx.arc(cx + 9 + sway, cy + 5, 10, 0, Math.PI * 2);
    ctx.arc(cx + sway, cy - 6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bushTop;
    ctx.beginPath();
    ctx.arc(cx - 5 + sway, cy - 5, 6, 0, Math.PI * 2);
    ctx.arc(cx + 6 + sway, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, parsed, time) {
  const exit = parsed.exit;
  const cx = (exit.x + 0.5) * TILE;
  const cy = (exit.y + 0.5) * TILE;
  const pulse = 0.55 + Math.sin(time * 3) * 0.2;
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52);
  glow.addColorStop(0, `rgba(125, 240, 168, ${pulse})`);
  glow.addColorStop(1, 'rgba(125, 240, 168, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 52, cy - 52, 104, 104);
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(cx - 14, cy - 14, 28, 28);
  ctx.fillStyle = COLORS.exitGlow;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', cx, cy - 24);
  ctx.fillStyle = '#062b16';
  ctx.fillText('→', cx, cy + 1);
}

function drawGems(ctx, parsed, time) {
  for (const gem of parsed.gems) {
    if (gem.taken) continue;
    const cx = (gem.x + 0.5) * TILE;
    const cy = (gem.y + 0.5) * TILE + Math.sin(time * 2.5 + gem.x) * 2;
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy + 9);
    ctx.lineTo(cx - 7, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
  }
}

function coneColorFor(guard) {
  if (guard.state === GUARD_ALARM) return COLORS.coneAlarm;
  if (guard.state === GUARD_SUSPICIOUS || guard.state === GUARD_SEARCH) return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}

function drawVisionCone(ctx, parsed, guard) {
  const fan = coneFanPoints(parsed, guard.x, guard.y, guard.facing);
  ctx.fillStyle = coneColorFor(guard);
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (const [x, y] of fan) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 90, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * CONE_RANGE * 0.92, guard.y + Math.sin(guard.facing) * CONE_RANGE * 0.92);
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  const bob = Math.sin(guard.stepPhase) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: a night-watchman in blue, torch in hand, facing his patrol.
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dfe8ff';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 5, guard.y + Math.sin(guard.facing) * 5 + bob * 0.3, 8, 0, Math.PI * 2);
  ctx.fill();
  // Torch beam dot ahead of him.
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Detection ring + state mark above his head.
  if (guard.detection > 4) {
    ctx.strokeStyle = guard.state === GUARD_ALARM ? '#ff5040' : '#ffb020';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y + bob * 0.3, 19, -Math.PI / 2, -Math.PI / 2 + (guard.detection / 100) * Math.PI * 2);
    ctx.stroke();
  }
  const mark = guard.state === GUARD_ALARM ? '!' : guard.state === GUARD_SUSPICIOUS || guard.state === GUARD_SEARCH ? '?' : null;
  if (mark) {
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = mark === '!' ? '#ff5040' : '#ffb020';
    ctx.fillText(mark, guard.x, guard.y - 30 + Math.sin(time * 5) * 2);
  }
}

function drawNoiseRing(ctx, player) {
  if (player.noiseRadius <= 0) return;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.noiseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.6 : Math.sin(time * 2) * 0.8;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Miso the thief: pale hood, red coat, quick feet.
  ctx.fillStyle = COLORS.playerCoat;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 3, player.y + Math.sin(player.facing) * 3 + bob * 0.3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 6, player.y + Math.sin(player.facing) * 6 + bob * 0.3 - 1, 2.2, 0, Math.PI * 2);
  ctx.arc(player.x + Math.cos(player.facing) * 6 - Math.sin(player.facing) * 3.4, player.y + Math.sin(player.facing) * 6 + Math.cos(player.facing) * 3.4 + bob * 0.3 - 1, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (player.hidden) {
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bff0c0';
    ctx.fillText('HIDDEN', player.x, player.y - 26);
  }
}

function drawDarkness(ctx, player) {
  const light = ctx.createRadialGradient(player.x, player.y, 60, player.x, player.y, 380);
  light.addColorStop(0, 'rgba(6, 8, 14, 0)');
  light.addColorStop(1, COLORS.dark);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, 46);
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SHADOW LANE — ${game.level.name}`, 14, 24);
  ctx.font = '15px sans-serif';
  const gemsLeft = game.parsed.gems.filter((g) => !g.taken).length;
  ctx.fillText(`◆ ${game.parsed.gems.length - gemsLeft}/${game.parsed.gems.length}`, 330, 24);
  ctx.fillText(`♥ ${'♥'.repeat(Math.max(0, game.lives))}${'·'.repeat(Math.max(0, 3 - game.lives))}`, 420, 24);
  ctx.fillText(`⏱ ${Math.floor(game.elapsed)}s`, 540, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${game.score}`, VIEW_WIDTH - 14, 24);
  const hottest = Math.max(0, ...game.guards.map((g) => g.detection));
  if (hottest > 4) {
    ctx.fillStyle = hottest >= 100 ? '#ff5040' : '#ffb020';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hottest >= 100 ? 'SPOTTED — RUN!' : 'SEEN… STAY OUT OF THE LIGHT', VIEW_WIDTH / 2, 66);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(VIEW_WIDTH / 2 - 110, 78, 220, 8);
    ctx.fillStyle = hottest >= 100 ? '#ff5040' : '#ffb020';
    ctx.fillRect(VIEW_WIDTH / 2 - 110, 78, 220 * (hottest / 100), 8);
  }
  if (game.message) {
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, VIEW_WIDTH / 2, VIEW_HEIGHT - 18);
  }
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.74)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_WIDTH / 2, 210);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '19px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_WIDTH / 2, 280 + i * 32));
}

function drawTitleScreen(ctx, game) {
  drawPanel(ctx, 'SHADOW LANE', [
    'Miso the thief slips into the night museum.',
    'Dodge the guards\u2019 vision cones, grab the moon-gems,',
    'and reach the green EXIT unseen.',
    '',
    'WASD / arrows — move    SHIFT — sneak (silent)',
    'Click — walk there    M — mute',
    '',
    'Press ENTER or click to begin',
  ], '#ffd94d');
}

function drawLevelClearScreen(ctx, game) {
  drawPanel(ctx, 'FLOOR CLEARED!', [
    `${game.level.name} — unseen, unheard.`,
    `Floor bonus +${game.lastBonus}   •   Score ${game.score}`,
    '',
    'Press ENTER for the next floor',
  ], '#37d67a');
}

function drawCaughtScreen(ctx, game) {
  drawPanel(ctx, 'CAUGHT!', [
    'A guard grabbed Miso by the collar.',
    game.lives > 0 ? `${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left — the floor resets.` : 'No lives left.',
    '',
    game.lives > 0 ? 'Press ENTER to try the floor again' : 'Press ENTER to start over',
  ], '#ff5040');
}

function drawWinScreen(ctx, game) {
  drawPanel(ctx, 'THE MOON PEARL IS YOURS!', [
    'Three floors, zero alarms that stuck. A perfect ghost.',
    `Final score ${game.score}   •   Time ${Math.floor(game.elapsed)}s`,
    '',
    'Press ENTER to play again',
  ], '#ffd94d');
}

/** Draw the whole game for the current screen. */
export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (game.screen === SCREEN_TITLE) {
    drawTitleScreen(ctx, game);
    return;
  }
  drawFloor(ctx, game.parsed);
  drawExit(ctx, game.parsed, game.time);
  drawGems(ctx, game.parsed, game.time);
  drawBushes(ctx, game.parsed, game.time);
  drawCrates(ctx, game.parsed);
  drawWalls(ctx, game.parsed);
  for (const guard of game.guards) drawVisionCone(ctx, game.parsed, guard);
  drawNoiseRing(ctx, game.player);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawDarkness(ctx, game.player);
  drawHud(ctx, game);
  if (game.screen === SCREEN_LEVEL_CLEAR) drawLevelClearScreen(ctx, game);
  else if (game.screen === SCREEN_CAUGHT) drawCaughtScreen(ctx, game);
  else if (game.screen === SCREEN_WIN) drawWinScreen(ctx, game);
}
