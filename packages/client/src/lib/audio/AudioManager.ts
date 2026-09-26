type ToneShape = "sine" | "triangle" | "square" | "sawtooth";

interface ToneStep {
  freq: number;
  start: number;
  duration: number;
  gain?: number;
  shape?: ToneShape;
  glideTo?: number;
}

const STORAGE_KEY = "inkriot:sound-enabled";
const MIN_HOVER_INTERVAL_MS = 70;
const MIN_DRAW_INTERVAL_MS = 90;

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private lastHoverAt = 0;
  private lastDrawAt = 0;

  constructor() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.enabled = stored === null ? true : stored === "1";
    } catch {
      this.enabled = true;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  /** Must be called from within a user-gesture handler the first time. */
  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private play(steps: ToneStep[], volume = 1) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    for (const step of steps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step.shape ?? "sine";
      osc.frequency.setValueAtTime(step.freq, now + step.start);
      if (step.glideTo) {
        osc.frequency.exponentialRampToValueAtTime(step.glideTo, now + step.start + step.duration);
      }
      const peak = (step.gain ?? 0.22) * volume;
      gain.gain.setValueAtTime(0.0001, now + step.start);
      gain.gain.exponentialRampToValueAtTime(peak, now + step.start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + step.start + step.duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + step.start);
      osc.stop(now + step.start + step.duration + 0.02);
    }
  }

  unlock() {
    this.ensureContext();
  }

  playHover() {
    const now = performance.now();
    if (now - this.lastHoverAt < MIN_HOVER_INTERVAL_MS) return;
    this.lastHoverAt = now;
    this.play([{ freq: 720, start: 0, duration: 0.05, gain: 0.06, shape: "triangle" }]);
  }

  playClick() {
    this.play([
      { freq: 320, start: 0, duration: 0.05, gain: 0.18, shape: "square" },
      { freq: 620, start: 0.02, duration: 0.06, gain: 0.12, shape: "sine" },
    ]);
  }

  playToggle() {
    this.play([{ freq: 500, start: 0, duration: 0.08, gain: 0.15, shape: "triangle", glideTo: 700 }]);
  }

  playToolSelect() {
    this.play([{ freq: 440, start: 0, duration: 0.06, gain: 0.14, shape: "square" }]);
  }

  playColorSelect() {
    this.play([{ freq: 900, start: 0, duration: 0.05, gain: 0.13, shape: "sine", glideTo: 1200 }]);
  }

  playDropdownOpen() {
    this.play([
      { freq: 480, start: 0, duration: 0.05, gain: 0.12, shape: "triangle" },
      { freq: 640, start: 0.04, duration: 0.07, gain: 0.11, shape: "triangle" },
    ]);
  }

  playDropdownSelect() {
    this.play([{ freq: 700, start: 0, duration: 0.07, gain: 0.15, shape: "sine", glideTo: 920 }]);
  }

  playHintReveal() {
    this.play([
      { freq: 587.33, start: 0, duration: 0.08, gain: 0.16, shape: "triangle" },
      { freq: 880, start: 0.07, duration: 0.14, gain: 0.18, shape: "triangle" },
    ]);
  }

  playDrawStart(tool: string) {
    const now = performance.now();
    if (now - this.lastDrawAt < MIN_DRAW_INTERVAL_MS) return;
    this.lastDrawAt = now;
    const freq = tool === "eraser" ? 260 : tool === "brush" ? 340 : tool === "marker" ? 300 : 480;
    this.play([{ freq, start: 0, duration: 0.07, gain: 0.05, shape: tool === "eraser" ? "sine" : "triangle" }]);
  }

  playFill() {
    this.play([
      { freq: 200, start: 0, duration: 0.18, gain: 0.14, shape: "sine", glideTo: 460 },
    ]);
  }

  playWordSelect() {
    this.play([
      { freq: 500, start: 0, duration: 0.08, gain: 0.16, shape: "triangle" },
      { freq: 760, start: 0.06, duration: 0.12, gain: 0.16, shape: "triangle" },
    ]);
  }

  playCorrect() {
    this.play([
      { freq: 523.25, start: 0, duration: 0.09, gain: 0.2, shape: "triangle" },
      { freq: 659.25, start: 0.08, duration: 0.09, gain: 0.2, shape: "triangle" },
      { freq: 987.77, start: 0.16, duration: 0.16, gain: 0.22, shape: "triangle" },
    ]);
  }

  playWrong() {
    this.play([{ freq: 220, start: 0, duration: 0.16, gain: 0.1, shape: "sine", glideTo: 160 }]);
  }

  playClose() {
    this.play([{ freq: 480, start: 0, duration: 0.09, gain: 0.09, shape: "sine" }]);
  }

  playCountdownTick(urgent = false) {
    this.play([{ freq: urgent ? 880 : 660, start: 0, duration: 0.08, gain: urgent ? 0.22 : 0.14, shape: "square" }]);
  }

  playGo() {
    this.play([
      { freq: 660, start: 0, duration: 0.1, gain: 0.2, shape: "triangle" },
      { freq: 990, start: 0.09, duration: 0.22, gain: 0.24, shape: "triangle" },
    ]);
  }

  playJoin() {
    this.play([
      { freq: 500, start: 0, duration: 0.06, gain: 0.14, shape: "sine" },
      { freq: 760, start: 0.05, duration: 0.1, gain: 0.14, shape: "sine" },
    ]);
  }

  playLeave() {
    this.play([{ freq: 480, start: 0, duration: 0.14, gain: 0.1, shape: "sine", glideTo: 300 }]);
  }

  playRoundEnd() {
    this.play([
      { freq: 392, start: 0, duration: 0.1, gain: 0.16, shape: "triangle" },
      { freq: 523.25, start: 0.09, duration: 0.1, gain: 0.16, shape: "triangle" },
      { freq: 659.25, start: 0.18, duration: 0.18, gain: 0.18, shape: "triangle" },
    ]);
  }

  playWinner() {
    this.play([
      { freq: 523.25, start: 0, duration: 0.12, gain: 0.2, shape: "triangle" },
      { freq: 659.25, start: 0.11, duration: 0.12, gain: 0.2, shape: "triangle" },
      { freq: 783.99, start: 0.22, duration: 0.12, gain: 0.2, shape: "triangle" },
      { freq: 1046.5, start: 0.33, duration: 0.3, gain: 0.24, shape: "triangle" },
    ]);
  }

  playReaction() {
    this.play([{ freq: 700, start: 0, duration: 0.07, gain: 0.12, shape: "square" }]);
  }
}

export const audio = new AudioManager();
