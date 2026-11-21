// SHADOW LANE — sound. Everything is synthesized with WebAudio: soft
// footsteps that quicken when a guard chases, a chime for a gem, a low sting
// when the alarm trips, a warm arpeggio for clearing a floor. No audio files.
let audioContext = null;
let masterGain = null;
let muted = false;

export function ensureAudio() {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume();
    return;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  audioContext = new Ctor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.25;
  masterGain.connect(audioContext.destination);
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.25;
  return muted;
}

function tone(frequency, duration, type, volume, when = 0, slideTo = null) {
  if (!audioContext || !masterGain || muted) return;
  const start = audioContext.currentTime + when;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo !== null) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

/** A soft footstep: pitch rises when the walker is a chasing guard. */
export function playFootstep(chasing) {
  tone(chasing ? 150 : 110, 0.07, 'triangle', chasing ? 0.5 : 0.22, 0, chasing ? 90 : 70);
}

/** A bright two-note chime for picking up a moon-gem. */
export function playGemChime() {
  tone(880, 0.14, 'sine', 0.5);
  tone(1318, 0.22, 'sine', 0.45, 0.09);
}

/** A low, rising sting when a guard spots the thief. */
export function playAlarmSting() {
  tone(196, 0.5, 'sawtooth', 0.4, 0, 392);
  tone(147, 0.5, 'sawtooth', 0.3, 0.08, 294);
}

/** A questioning blip when a guard grows suspicious. */
export function playSuspiciousBlip() {
  tone(520, 0.12, 'square', 0.18, 0, 660);
}

/** A warm arpeggio when a floor is cleared. */
export function playLevelClear() {
  [523, 659, 784, 1047].forEach((frequency, i) => tone(frequency, 0.25, 'sine', 0.45, i * 0.11));
}

/** A dull thud when the thief is caught. */
export function playCaughtThud() {
  tone(90, 0.35, 'sine', 0.6, 0, 45);
  tone(60, 0.4, 'triangle', 0.5, 0.05, 40);
}
