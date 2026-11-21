// SHADOW LANE — the game itself. Holds the state (level, thief, guards,
// score, lives, timer, screen), steps it forward, and owns the rules:
// gems score, the exit clears the floor, being caught costs a life.
import {
  CATCH_DISTANCE,
  GEM_SCORE,
  LEVEL_CLEAR_BONUS,
  PAR_SECONDS,
  START_LIVES,
  TIME_BONUS_PER_SECOND,
  TILE,
} from './config.js';
import { LEVELS, parseLevel } from './level.js';
import { guardHearsNoise, guardInvestigateNoise, makeGuard, updateGuard } from './guards.js';
import { makePlayer, updatePlayer } from './player.js';
import {
  playAlarmSting,
  playCaughtThud,
  playFootstep,
  playGemChime,
  playLevelClear,
  playSuspiciousBlip,
} from './audio.js';
import { SCREEN_CAUGHT, SCREEN_LEVEL_CLEAR, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

export { SCREEN_CAUGHT, SCREEN_LEVEL_CLEAR, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN };

export function newGame() {
  const game = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: LEVELS[0],
    parsed: parseLevel(LEVELS[0]),
    player: null,
    guards: [],
    score: 0,
    lives: START_LIVES,
    elapsed: 0,
    time: 0,
    lastBonus: 0,
    message: LEVELS[0].tip,
    keys: { left: false, right: false, up: false, down: false, sneak: false },
    footstepTimer: 0,
    frozen: false, // staged screenshot scenes freeze the simulation
  };
  loadLevel(game, 0);
  return game;
}

export function loadLevel(game, index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  game.parsed = parseLevel(LEVELS[index]);
  game.player = makePlayer(game.parsed.playerStart);
  game.guards = game.level.guards.map((g) => makeGuard(g.waypoints));
  game.message = game.level.tip;
}

export function startPlaying(game) {
  if (game.screen === SCREEN_WIN) {
    game.score = 0;
    game.lives = START_LIVES;
    game.elapsed = 0;
    loadLevel(game, 0);
  } else if (game.screen === SCREEN_CAUGHT && game.lives === 0) {
    game.score = 0;
    game.lives = START_LIVES;
    game.elapsed = 0;
    loadLevel(game, 0);
  } else if (game.screen === SCREEN_CAUGHT) {
    loadLevel(game, game.levelIndex);
  } else if (game.screen === SCREEN_LEVEL_CLEAR) {
    loadLevel(game, game.levelIndex + 1);
  }
  game.screen = SCREEN_PLAY;
}

function collectGems(game) {
  for (const gem of game.parsed.gems) {
    if (gem.taken) continue;
    const cx = (gem.x + 0.5) * TILE;
    const cy = (gem.y + 0.5) * TILE;
    if (Math.hypot(game.player.x - cx, game.player.y - cy) < 26) {
      gem.taken = true;
      game.score += GEM_SCORE;
      playGemChime();
    }
  }
}

function checkExit(game) {
  const exit = game.parsed.exit;
  const cx = (exit.x + 0.5) * TILE;
  const cy = (exit.y + 0.5) * TILE;
  if (Math.hypot(game.player.x - cx, game.player.y - cy) > 26) return;
  const par = PAR_SECONDS[game.levelIndex];
  const timeBonus = Math.max(0, Math.round((par - game.elapsed) * TIME_BONUS_PER_SECOND));
  game.lastBonus = LEVEL_CLEAR_BONUS + timeBonus;
  game.score += game.lastBonus;
  playLevelClear();
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = SCREEN_WIN;
  } else {
    game.screen = SCREEN_LEVEL_CLEAR;
  }
}

function onCaught(game) {
  game.lives -= 1;
  playCaughtThud();
  game.screen = SCREEN_CAUGHT;
}

/** Step the simulation one frame (dt seconds). Pure rules; drawing is render.js. */
export function updateGame(game, dt) {
  if (game.frozen) return; // a staged screenshot holds its pose
  game.time += dt;
  if (game.screen !== SCREEN_PLAY) return;
  game.elapsed += dt;
  updatePlayer(game.parsed, game.player, game.keys, dt);

  // Footsteps: a soft tick each stride, quicker when a guard is chasing.
  game.footstepTimer -= dt;
  if (game.player.moving && game.footstepTimer <= 0) {
    const chasing = game.guards.some((g) => g.state === 'alarm');
    playFootstep(chasing);
    game.footstepTimer = game.player.sneaking ? 0.55 : 0.34;
  }

  // Noise: guards inside the footstep ring turn to listen.
  if (game.player.noiseRadius > 0) {
    for (const guard of game.guards) {
      if (guardHearsNoise(guard, game.player.x, game.player.y, game.player.noiseRadius)) {
        guardInvestigateNoise(guard, game.player.x, game.player.y);
      }
    }
  }

  let previousAlarm = false;
  let previousSuspicion = false;
  for (const guard of game.guards) {
    if (guard.state === 'alarm') previousAlarm = true;
    if (guard.state === 'suspicious') previousSuspicion = true;
  }
  for (const guard of game.guards) {
    if (updateGuard(game.parsed, guard, game.player, dt) === 'caught') {
      onCaught(game);
      return;
    }
    if (Math.hypot(game.player.x - guard.x, game.player.y - guard.y) < CATCH_DISTANCE) {
      onCaught(game);
      return;
    }
  }
  const nowAlarm = game.guards.some((g) => g.state === 'alarm');
  const nowSuspicious = game.guards.some((g) => g.state === 'suspicious');
  if (nowAlarm && !previousAlarm) {
    playAlarmSting();
    game.message = 'Spotted! Break line of sight!';
  } else if (nowSuspicious && !previousSuspicion) {
    playSuspiciousBlip();
    game.message = 'A guard heard something…';
  }

  collectGems(game);
  checkExit(game);
}
