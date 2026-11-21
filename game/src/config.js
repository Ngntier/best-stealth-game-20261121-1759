// SHADOW LANE — tuning constants. One place for every number the rest of the
// game reads, so balancing never means hunting through the logic.
export const TILE = 40;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 640;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 78;
export const PLAYER_RUN_SPEED = 205;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_SEARCH_SPEED = 90;

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side
export const DETECT_PER_SECOND_CLOSE = 130;
export const DETECT_PER_SECOND_FAR = 55;
export const DETECT_DECAY_PER_SECOND = 34;
export const SUSPICIOUS_AT = 35;
export const ALARM_AT = 100;
export const LOSE_SIGHT_SECONDS = 3.2;
export const SEARCH_SECONDS = 4.5;

export const NOISE_WALK_RADIUS = 46;
export const NOISE_RUN_RADIUS = 110;
export const NOISE_SNEAK_RADIUS = 0;

export const CATCH_DISTANCE = 26;
export const START_LIVES = 3;
export const GEM_SCORE = 100;
export const LEVEL_CLEAR_BONUS = 500;
export const TIME_BONUS_PER_SECOND = 8;
export const PAR_SECONDS = [75, 90, 105];

export const COLORS = {
  floor: '#232a33',
  floorAlt: '#20262e',
  wall: '#4a5468',
  wallTop: '#6b7a94',
  crate: '#8a6b3f',
  crateTop: '#b08d55',
  bush: '#2e6b34',
  bushTop: '#3f8f46',
  exit: '#37d67a',
  exitGlow: '#7df0a8',
  gem: '#ffd94d',
  player: '#e8e4d8',
  playerCoat: '#c94f4f',
  guard: '#3a6fd8',
  guardDark: '#274b96',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 40, 0.30)',
  coneAlarm: 'rgba(255, 60, 60, 0.38)',
  dark: 'rgba(6, 8, 14, 0.34)',
  hud: '#e8e4d8',
};
