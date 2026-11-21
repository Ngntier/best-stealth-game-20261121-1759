// SHADOW LANE — the thief, Miso. WASD / arrows to move, SHIFT to sneak
// (slow and silent), mouse click to walk to a spot. Running makes noise
// guards can hear; sneaking makes none. Bushes hide her completely.
import {
  NOISE_RUN_RADIUS,
  NOISE_SNEAK_RADIUS,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_SNEAK_SPEED,
  TILE,
} from './config.js';
import { isBushTile, isSolidTile } from './level.js';

export function makePlayer(startTile) {
  return {
    x: (startTile.x + 0.5) * TILE,
    y: (startTile.y + 0.5) * TILE,
    facing: 0,
    moving: false,
    sneaking: false,
    running: false,
    noiseRadius: 0,
    hidden: false,
    stepPhase: 0,
    path: [], // click-to-move waypoints (tile centres, in pixels)
  };
}

/**
 * A tile path from the thief's tile to the clicked tile, found by breadth-first
 * search over walkable tiles. Clicking a solid tile aims for the nearest
 * walkable tile instead, so a click never asks for the impossible.
 */
export function findTilePath(parsed, fromTileX, fromTileY, toTileX, toTileY) {
  const key = (x, y) => `${x},${y}`;
  const walkable = (x, y) => x >= 0 && y >= 0 && x < parsed.cols && y < parsed.rows && !isSolidTile(parsed, x, y);
  let goalX = toTileX;
  let goalY = toTileY;
  if (!walkable(goalX, goalY)) {
    const queue = [[goalX, goalY]];
    const seen = new Set([key(goalX, goalY)]);
    let found = null;
    while (queue.length && !found) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (seen.has(key(nx, ny))) continue;
        seen.add(key(nx, ny));
        if (walkable(nx, ny)) {
          found = [nx, ny];
          break;
        }
        queue.push([nx, ny]);
      }
    }
    if (!found) return [];
    [goalX, goalY] = found;
  }
  const cameFrom = new Map([[key(fromTileX, fromTileY), null]]);
  const queue = [[fromTileX, fromTileY]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === goalX && y === goalY) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!walkable(nx, ny) || cameFrom.has(key(nx, ny))) continue;
      cameFrom.set(key(nx, ny), [x, y]);
      queue.push([nx, ny]);
    }
  }
  if (!cameFrom.has(key(goalX, goalY))) return [];
  const tiles = [];
  let current = [goalX, goalY];
  while (current) {
    tiles.push(current);
    current = cameFrom.get(key(current[0], current[1]));
  }
  tiles.reverse();
  tiles.shift(); // the thief's own tile
  return tiles.map(([x, y]) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }));
}

/** Aim the thief at a clicked point: a path around the walls, not through them. */
export function setClickTarget(parsed, player, x, y) {
  const fromTileX = Math.floor(player.x / TILE);
  const fromTileY = Math.floor(player.y / TILE);
  player.path = findTilePath(parsed, fromTileX, fromTileY, Math.floor(x / TILE), Math.floor(y / TILE));
}

function circleHitsSolid(parsed, x, y) {
  const x0 = Math.floor((x - PLAYER_RADIUS) / TILE);
  const x1 = Math.floor((x + PLAYER_RADIUS) / TILE);
  const y0 = Math.floor((y - PLAYER_RADIUS) / TILE);
  const y1 = Math.floor((y + PLAYER_RADIUS) / TILE);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (!isSolidTile(parsed, tx, ty)) continue;
      const nearestX = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const nearestY = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      if (Math.hypot(x - nearestX, y - nearestY) < PLAYER_RADIUS) return true;
    }
  }
  return false;
}

/** Move the thief one tick from keyboard input or a click target. */
export function updatePlayer(parsed, player, keys, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (dx === 0 && dy === 0 && player.path.length > 0) {
    const next = player.path[0];
    const cx = next.x - player.x;
    const cy = next.y - player.y;
    if (Math.hypot(cx, cy) < 6) {
      player.path.shift();
    } else {
      dx = cx / Math.hypot(cx, cy);
      dy = cy / Math.hypot(cx, cy);
    }
  }
  if (keys.left || keys.right || keys.up || keys.down) player.path = [];
  const length = Math.hypot(dx, dy);
  player.moving = length > 0;
  player.sneaking = !!keys.sneak;
  player.running = player.moving && !player.sneaking;
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_RUN_SPEED;
  if (player.moving) {
    const nx = dx / length;
    const ny = dy / length;
    const stepX = nx * speed * dt;
    const stepY = ny * speed * dt;
    if (!circleHitsSolid(parsed, player.x + stepX, player.y)) player.x += stepX;
    if (!circleHitsSolid(parsed, player.x, player.y + stepY)) player.y += stepY;
    player.facing = Math.atan2(ny, nx);
    player.stepPhase += dt * (player.sneaking ? 7 : 11);
  }
  player.noiseRadius = !player.moving
    ? 0
    : player.sneaking
      ? NOISE_SNEAK_RADIUS
      : NOISE_RUN_RADIUS;
  const tileX = Math.floor(player.x / TILE);
  const tileY = Math.floor(player.y / TILE);
  player.hidden = isBushTile(parsed, tileX, tileY);
}
