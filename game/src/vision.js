// SHADOW LANE — seeing. A guard sees the thief only inside its vision cone
// with an unbroken line of sight: walls and crates block sight, bushes do
// not (they hide the thief another way). All distances in pixels.
import { CONE_HALF_ANGLE, CONE_RANGE, TILE } from './config.js';
import { isSolidTile } from './level.js';

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the straight line from (x0,y0) to (x1,y1) crosses no solid tile. */
export function hasLineOfSight(parsed, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / (TILE / 4)));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (isSolidTile(parsed, tx, ty)) return false;
  }
  return true;
}

/**
 * How clearly a guard at (gx, gy) facing `facing` sees a point (px, py):
 * 0 when outside the cone or behind cover, rising toward 1 up close.
 */
export function coneVisibility(parsed, gx, gy, facing, px, py) {
  const dx = px - gx;
  const dy = py - gy;
  const distance = Math.hypot(dx, dy);
  if (distance > CONE_RANGE) return 0;
  if (distance < 26) return 1; // bumping into a guard is always seen
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleTo, facing)) > CONE_HALF_ANGLE) return 0;
  if (!hasLineOfSight(parsed, gx, gy, px, py)) return 0;
  return 1 - distance / (CONE_RANGE * 1.6);
}

/** The cone's outline as a fan of points, clipped where sight hits a wall. */
export function coneFanPoints(parsed, gx, gy, facing, segments = 18) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / segments;
    let reach = CONE_RANGE;
    const step = TILE / 4;
    for (let d = step; d <= CONE_RANGE; d += step) {
      const tx = Math.floor((gx + Math.cos(angle) * d) / TILE);
      const ty = Math.floor((gy + Math.sin(angle) * d) / TILE);
      if (isSolidTile(parsed, tx, ty)) {
        reach = d;
        break;
      }
    }
    points.push([gx + Math.cos(angle) * reach, gy + Math.sin(angle) * reach]);
  }
  return points;
}
