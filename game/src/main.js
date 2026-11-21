// SHADOW LANE — bootstrap. Wires the canvas to the game: keyboard and mouse
// input, the animation loop, the ?shot= scenes for screenshots, and the
// screen-reader status line. No network, no assets: everything is drawn.
import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { drawGame, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { newGame, startPlaying, updateGame } from './game.js';
import { stageShot } from './shots.js';
import { ensureAudio, toggleMute } from './audio.js';
import { setClickTarget } from './player.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const game = newGame();
window.__game = game; // debug hook for playtests; harmless in play
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot, game);

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

function describeScreen() {
  if (game.screen === SCREEN_TITLE) return 'Shadow Lane title screen. Press Enter to play.';
  if (game.screen === SCREEN_PLAY) {
    const hottest = Math.max(0, ...game.guards.map((g) => g.detection));
    return hottest >= 100
      ? 'Spotted! A guard is chasing you.'
      : `Playing ${game.level.name}. Score ${game.score}, ${game.lives} lives.`;
  }
  return `${game.screen}. Score ${game.score}. Press Enter to continue.`;
}

function announce() {
  statusLine.textContent = describeScreen();
}

window.addEventListener('keydown', (event) => {
  ensureAudio();
  const mapped = KEYMAP[event.code];
  if (mapped) {
    game.keys[mapped] = true;
    event.preventDefault();
  }
  if (event.code === 'Enter') {
    if (game.screen !== SCREEN_PLAY) {
      startPlaying(game);
      announce();
    }
    event.preventDefault();
  }
  if (event.code === 'KeyM') {
    const muted = toggleMute();
    game.message = muted ? 'Sound off (M to turn back on)' : 'Sound on';
  }
});

window.addEventListener('keyup', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) game.keys[mapped] = false;
});

canvas.addEventListener('pointerdown', (event) => {
  ensureAudio();
  if (game.screen === SCREEN_TITLE) {
    startPlaying(game);
    announce();
    return;
  }
  if (game.screen !== SCREEN_PLAY) {
    startPlaying(game);
    announce();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = VIEW_WIDTH / rect.width;
  const scaleY = VIEW_HEIGHT / rect.height;
  setClickTarget(
    game.parsed,
    game.player,
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY,
  );
});

let lastTime = performance.now();
let announcedScreen = game.screen;
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateGame(game, dt);
  drawGame(ctx, game);
  window.__shotReady = true;
  if (game.screen !== announcedScreen) {
    announcedScreen = game.screen;
    announce();
  }
  requestAnimationFrame(frame);
}
announce();
requestAnimationFrame(frame);
