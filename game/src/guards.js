// SHADOW LANE — the guards. Each guard walks a patrol route and watches its
// vision cone. States: PATROL (walk the route) -> SUSPICIOUS (saw something,
// turn and look) -> ALARM (seen the thief: chase) -> SEARCH (lost the thief,
// check the last seen spot, then go back to patrol).
import {
  ALARM_AT,
  DETECT_DECAY_PER_SECOND,
  DETECT_PER_SECOND_CLOSE,
  DETECT_PER_SECOND_FAR,
  GUARD_CHASE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
  GUARD_SEARCH_SPEED,
  LOSE_SIGHT_SECONDS,
  SEARCH_SECONDS,
  SUSPICIOUS_AT,
  TILE,
} from './config.js';
import { isSolidTile } from './level.js';
import { coneVisibility } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALARM = 'alarm';
export const GUARD_SEARCH = 'search';

export function makeGuard(waypoints) {
  const [sx, sy] = waypoints[0];
  return {
    waypoints,
    waypointIndex: 1 % waypoints.length,
    x: (sx + 0.5) * TILE,
    y: (sy + 0.5) * TILE,
    facing: 0,
    state: GUARD_PATROL,
    detection: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    unseenFor: 0,
    searchFor: 0,
    stuckFor: 0,
    lastX: 0,
    lastY: 0,
    stepPhase: Math.random() * Math.PI * 2,
  };
}

/** Move toward (tx, ty) at `speed`, sliding along walls; returns distance left. */
function moveTowardGuard(parsed, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return 0;
  const step = Math.min(distance, speed * dt);
  const nx = guard.x + (dx / distance) * step;
  const ny = guard.y + (dy / distance) * step;
  if (!circleHitsSolid(parsed, nx, guard.y, GUARD_RADIUS)) guard.x = nx;
  if (!circleHitsSolid(parsed, guard.x, ny, GUARD_RADIUS)) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  return Math.hypot(tx - guard.x, ty - guard.y);
}

function circleHitsSolid(parsed, x, y, radius) {
  const x0 = Math.floor((x - radius) / TILE);
  const x1 = Math.floor((x + radius) / TILE);
  const y0 = Math.floor((y - radius) / TILE);
  const y1 = Math.floor((y + radius) / TILE);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (!isSolidTile(parsed, tx, ty)) continue;
      const nearestX = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const nearestY = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      if (Math.hypot(x - nearestX, y - nearestY) < radius) return true;
    }
  }
  return false;
}

/**
 * One guard's tick. `thief` is the player ({x, y, hidden, noiseRadius});
 * returns 'caught' when the guard reaches the thief, else null.
 */
export function updateGuard(parsed, guard, thief, dt) {
  const visibility = thief.hidden ? 0 : coneVisibility(parsed, guard.x, guard.y, guard.facing, thief.x, thief.y);
  if (visibility > 0) {
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
    guard.unseenFor = 0;
    const rate = DETECT_PER_SECOND_FAR + (DETECT_PER_SECOND_CLOSE - DETECT_PER_SECOND_FAR) * visibility;
    guard.detection = Math.min(ALARM_AT, guard.detection + rate * dt);
  } else {
    guard.unseenFor += dt;
    guard.detection = Math.max(0, guard.detection - DETECT_DECAY_PER_SECOND * dt);
  }
  if (guard.detection >= ALARM_AT && guard.state !== GUARD_ALARM) {
    guard.state = GUARD_ALARM;
    guard.searchFor = 0;
  } else if (guard.detection >= SUSPICIOUS_AT && guard.state === GUARD_PATROL) {
    guard.state = GUARD_SUSPICIOUS;
  } else if (guard.detection < SUSPICIOUS_AT * 0.5 && guard.state === GUARD_SUSPICIOUS) {
    guard.state = GUARD_PATROL;
  }

  if (guard.state === GUARD_ALARM) {
    moveTowardGuard(parsed, guard, guard.lastSeenX, guard.lastSeenY, GUARD_CHASE_SPEED, dt);
    if (guard.unseenFor > LOSE_SIGHT_SECONDS) {
      guard.state = GUARD_SEARCH;
      guard.searchFor = SEARCH_SECONDS;
    }
  } else if (guard.state === GUARD_SEARCH) {
    const left = moveTowardGuard(parsed, guard, guard.lastSeenX, guard.lastSeenY, GUARD_SEARCH_SPEED, dt);
    guard.searchFor -= dt;
    if (left < 8) guard.facing += dt * 2.2; // look around the spot
    if (guard.searchFor <= 0) {
      guard.state = GUARD_PATROL;
      guard.detection = 0;
    }
  } else if (guard.state === GUARD_SUSPICIOUS) {
    // Stand still and stare at what caught the eye.
    guard.facing = Math.atan2(guard.lastSeenY - guard.y, guard.lastSeenX - guard.x);
  } else {
    const [wx, wy] = guard.waypoints[guard.waypointIndex];
    const left = moveTowardGuard(parsed, guard, (wx + 0.5) * TILE, (wy + 0.5) * TILE, GUARD_PATROL_SPEED, dt);
    if (left < 6) guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }

  // A guard wedged against a wall gives up on this waypoint and moves on.
  const moved = Math.hypot(guard.x - guard.lastX, guard.y - guard.lastY);
  guard.stuckFor = moved < 2 * dt * 10 ? guard.stuckFor + dt : 0;
  guard.lastX = guard.x;
  guard.lastY = guard.y;
  if (guard.stuckFor > 1.5 && guard.state === GUARD_PATROL) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.stuckFor = 0;
  }

  guard.stepPhase += dt * (guard.state === GUARD_ALARM ? 11 : 6);
  if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < 26) return 'caught';
  return null;
}

/** A guard hears a noise at (x, y) when it is inside the noise radius. */
export function guardHearsNoise(guard, x, y, radius) {
  if (radius <= 0) return false;
  return Math.hypot(x - guard.x, y - guard.y) < radius;
}

/** Point a guard at a noise: it grows suspicious and turns to listen. */
export function guardInvestigateNoise(guard, x, y) {
  if (guard.state === GUARD_ALARM) return;
  guard.lastSeenX = x;
  guard.lastSeenY = y;
  guard.detection = Math.max(guard.detection, SUSPICIOUS_AT + 5);
  guard.state = GUARD_SUSPICIOUS;
}
