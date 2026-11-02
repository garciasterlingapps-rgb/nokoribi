// Sonidos retro 8-bit generados con Web Audio API (sin archivos externos).

let audioCtx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function initAudio() {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay = 0
) {
  if (!enabled || !audioCtx) return;
  const ctx = audioCtx;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function playCatch() {
  tone(660, 0.08, "square", 0.1);
  tone(990, 0.1, "square", 0.08, 0.05);
}

export function playWrong() {
  tone(220, 0.12, "sawtooth", 0.14);
  tone(150, 0.2, "sawtooth", 0.14, 0.08);
}

export function playComplete() {
  [523, 659, 784, 1047].forEach((f, i) =>
    tone(f, 0.12, "square", 0.09, i * 0.08)
  );
}

export function playGameOver() {
  [392, 330, 262, 196].forEach((f, i) =>
    tone(f, 0.16, "triangle", 0.11, i * 0.12)
  );
}

// ---------------------------------------------------------------------------
// Música de fondo (loop chiptune generado)
// ---------------------------------------------------------------------------

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicIndex = 0;

const NOTE_MS = 200;
const MELODY = [
  523.25, 587.33, 659.25, 783.99, // C5 D5 E5 G5
  659.25, 587.33, 523.25, 0, //     E5 D5 C5 (silencio)
  523.25, 587.33, 659.25, 783.99, // C5 D5 E5 G5
  880.0, 783.99, 659.25, 0, //      A5 G5 E5 (silencio)
];

export function startMusic() {
  stopMusic();
  initAudio();
  musicIndex = 0;
  musicTimer = setInterval(() => {
    const freq = MELODY[musicIndex % MELODY.length];
    if (freq > 0) tone(freq, 0.18, "square", 0.045);
    musicIndex++;
  }, NOTE_MS);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
