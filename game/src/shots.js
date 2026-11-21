// SHADOW LANE — screenshot scenes behind ?shot=cover|alert|clear|title.
// Each scene sets the real game state (no fake pixels): the thief, the
// guards and their cones are placed where a real play session would put
// them, then the normal renderer draws the frame. Deterministic, so the
// same URL always gives the same screenshot.
import { TILE } from './config.js';
import { GUARD_ALARM, GUARD_PATROL, GUARD_SUSPICIOUS } from './guards.js';
import { SCREEN_LEVEL_CLEAR, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { loadLevel } from './game.js';

function placePlayer(game, tileX, tileY, facing) {
  game.player.x = (tileX + 0.5) * TILE;
  game.player.y = (tileY + 0.5) * TILE;
  game.player.facing = facing;
  game.player.moving = false;
  game.player.sneaking = true;
  game.player.path = [];
}

function placeGuard(game, index, tileX, tileY, facing, state, detection) {
  const guard = game.guards[index];
  guard.x = (tileX + 0.5) * TILE;
  guard.y = (tileY + 0.5) * TILE;
  guard.facing = facing;
  guard.state = state;
  guard.detection = detection;
  guard.lastSeenX = game.player.x;
  guard.lastSeenY = game.player.y;
  guard.waypointIndex = 0;
}

/**
 * Set `game` to the named scene and return the screen to draw.
 * cover: mid-floor stealth, thief behind a crate, cones sweeping.
 * alert: a guard has spotted the thief and is closing in.
 * clear: the floor just cleared, exit glowing behind the thief.
 * title: anything else is the title screen.
 */
export function stageShot(name, game) {
  if (name === 'alert') {
    loadLevel(game, 0);
    game.screen = SCREEN_PLAY;
    game.frozen = true; // hold the chase pose for the camera
    game.score = 300;
    game.elapsed = 41;
    placePlayer(game, 10, 7, 0.3);
    placeGuard(game, 0, 12, 7, Math.PI, GUARD_ALARM, 100);
    placeGuard(game, 1, 13, 4, Math.PI / 2, GUARD_SUSPICIOUS, 62);
    game.message = 'Spotted! Break line of sight!';
    return game.screen;
  }
  if (name === 'clear') {
    loadLevel(game, 1);
    game.screen = SCREEN_LEVEL_CLEAR;
    game.score = 1450;
    game.elapsed = 88;
    game.lastBonus = 620;
    placePlayer(game, 19, 13, -Math.PI / 2);
    game.parsed.gems.forEach((gem) => { gem.taken = true; });
    placeGuard(game, 0, 2, 10, -Math.PI / 2, GUARD_PATROL, 0);
    placeGuard(game, 1, 18, 10, Math.PI, GUARD_PATROL, 0);
    placeGuard(game, 2, 20, 6, Math.PI / 2, GUARD_PATROL, 0);
    return game.screen;
  }
  if (name === 'title') {
    game.screen = SCREEN_TITLE;
    return game.screen;
  }
  // cover: the game's best foot forward on floor one.
  loadLevel(game, 0);
  game.screen = SCREEN_PLAY;
  game.score = 200;
  game.elapsed = 23;
  game.player.sneaking = true;
  placePlayer(game, 8, 9, -0.5);
  game.parsed.gems[0].taken = true;
  placeGuard(game, 0, 6, 7, 0, GUARD_PATROL, 0);
  placeGuard(game, 1, 13, 5, Math.PI / 2, GUARD_PATROL, 18);
  game.message = 'Stay out of the cones. Reach the green EXIT.';
  return game.screen;
}
