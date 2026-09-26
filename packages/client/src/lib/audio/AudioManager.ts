type ToneShape = "sine" | "triangle" | "square" | "sawtooth";

interface ToneStep {
  freq: number;
  start: number;
  duration: number;
  gain?: number;
  shape?: ToneShape;
  glideTo?: number;
  /** Optional lowpass cutoff in Hz, softens square/saw tones. */
  lowpass?: number;
  detune?: number;
}

interface NoiseStep {
  start: number;
  duration: number;
  gain?: number;
  /** Bandpass centre frequency; sweeps to `sweepTo` if given. */
  freq?: number;
  sweepTo?: number;
  q?: number;
}

export type MusicMood = "off" | "lobby" | "game";

const SFX_KEY = "inkriot:sound-enabled";
const MUSIC_KEY = "inkriot:music-enabled";
const MIN_HOVER_INTERVAL_MS = 60;

// C major pentatonic across two octaves — anything from this set sounds good together.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// I – vi – IV – V in C, as [bass, chord tones...] midi numbers.
const PROGRESSION = [
  [48, 60, 64, 67, 72],
  [45, 57, 60, 64, 69],
  [41, 57, 60, 65, 69],
  [43, 55, 59, 62, 67],
];

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private sfxEnabled = true;
  private musicEnabled = true;
  private listeners = new Set<() => void>();

  private lastHoverAt = 0;
  private hoverStep = 0;

  private scribbleSrc: AudioBufferSourceNode | null = null;
  private scribbleGain: GainNode | null = null;
  private scribbleFilter: BiquadFilterNode | null = null;

  private mood: MusicMood = "off";
  private musicTimer: number | null = null;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private musicDuck = 1;

  constructor() {
    try {
      const sfx = localStorage.getItem(SFX_KEY);
      const music = localStorage.getItem(MUSIC_KEY);
      this.sfxEnabled = sfx === null ? true : sfx === "1";
      this.musicEnabled = music === null ? true : music === "1";
    } catch {
      /* storage blocked — defaults stand */
    }
  }

  // ---------- settings ----------

  isEnabled() {
    return this.sfxEnabled;
  }
  isMusicEnabled() {
    return this.musicEnabled;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    for (const fn of this.listeners) fn();
  }

  setEnabled(value: boolean) {
    this.sfxEnabled = value;
    if (!value) this.scribbleStop();
    this.persist(SFX_KEY, value);
    this.notify();
  }

  setMusicEnabled(value: boolean) {
    this.musicEnabled = value;
    this.persist(MUSIC_KEY, value);
    if (value) this.startMusicLoop();
    else this.stopMusicLoop();
    this.notify();
  }

  private persist(key: string, value: boolean) {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  // ---------- graph ----------

  /** Must be called from within a user-gesture handler the first time. */
  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master = ctx.createGain();
      this.master.gain.value = 0.55;
      this.sfxBus = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0;
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(comp);
      comp.connect(ctx.destination);

      const len = ctx.sampleRate;
      this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(steps: ToneStep[], volume = 1, bus?: GainNode | null, at?: number) {
    const ctx = this.ctx;
    const out = bus ?? this.sfxBus;
    if (!ctx || !out) return;
    const now = at ?? ctx.currentTime;
    for (const step of steps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step.shape ?? "sine";
      osc.frequency.setValueAtTime(step.freq, now + step.start);
      if (step.detune) osc.detune.value = step.detune;
      if (step.glideTo) osc.frequency.exponentialRampToValueAtTime(step.glideTo, now + step.start + step.duration);
      const peak = (step.gain ?? 0.22) * volume;
      gain.gain.setValueAtTime(0.0001, now + step.start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + step.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + step.start + step.duration);
      let node: AudioNode = osc;
      if (step.lowpass) {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = step.lowpass;
        osc.connect(lp);
        node = lp;
      }
      node.connect(gain);
      gain.connect(out);
      osc.start(now + step.start);
      osc.stop(now + step.start + step.duration + 0.03);
    }
  }

  private noise(steps: NoiseStep[], volume = 1, bus?: GainNode | null, at?: number) {
    const ctx = this.ctx;
    const out = bus ?? this.sfxBus;
    if (!ctx || !out || !this.noiseBuffer) return;
    const now = at ?? ctx.currentTime;
    for (const step of steps) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = step.q ?? 1.2;
      bp.frequency.setValueAtTime(step.freq ?? 2000, now + step.start);
      if (step.sweepTo) bp.frequency.exponentialRampToValueAtTime(step.sweepTo, now + step.start + step.duration);
      const gain = ctx.createGain();
      const peak = (step.gain ?? 0.2) * volume;
      gain.gain.setValueAtTime(0.0001, now + step.start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + step.start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + step.start + step.duration);
      src.connect(bp);
      bp.connect(gain);
      gain.connect(out);
      src.start(now + step.start, Math.random() * 0.5);
      src.stop(now + step.start + step.duration + 0.03);
    }
  }

  private sfx(fn: () => void) {
    if (!this.sfxEnabled) return;
    if (!this.ensureContext()) return;
    fn();
  }

  unlock() {
    this.ensureContext();
    if (this.musicEnabled && this.mood !== "off") this.startMusicLoop();
  }

  // ---------- UI ----------

  /** Hover notes climb the pentatonic scale when you sweep across buttons, then settle. */
  playHover() {
    const now = performance.now();
    if (now - this.lastHoverAt < MIN_HOVER_INTERVAL_MS) return;
    this.hoverStep = now - this.lastHoverAt > 900 ? 0 : (this.hoverStep + 1) % PENTA.length;
    this.lastHoverAt = now;
    const f = PENTA[this.hoverStep];
    this.sfx(() => this.tone([{ freq: f, start: 0, duration: 0.07, gain: 0.05, shape: "triangle" }]));
  }

  playClick() {
    this.sfx(() => {
      this.noise([{ start: 0, duration: 0.04, gain: 0.22, freq: 3200, q: 2 }]);
      this.tone([{ freq: 380, start: 0, duration: 0.09, gain: 0.16, shape: "sine", glideTo: 620 }]);
    });
  }

  playToggle() {
    this.sfx(() => this.tone([{ freq: 500, start: 0, duration: 0.1, gain: 0.15, shape: "triangle", glideTo: 780 }]));
  }

  /** A bubbly "pop" — the default for small satisfying actions. */
  playPop(pitch = 1) {
    this.sfx(() => {
      this.tone([{ freq: 300 * pitch, start: 0, duration: 0.08, gain: 0.2, shape: "sine", glideTo: 900 * pitch }]);
      this.noise([{ start: 0, duration: 0.03, gain: 0.08, freq: 4000 }]);
    });
  }

  playToolSelect() {
    this.sfx(() => {
      this.noise([{ start: 0, duration: 0.05, gain: 0.14, freq: 1800, q: 3 }]);
      this.tone([{ freq: 520, start: 0, duration: 0.07, gain: 0.12, shape: "triangle" }]);
    });
  }

  playColorSelect(index = 0) {
    const f = PENTA[index % PENTA.length];
    this.sfx(() => this.tone([{ freq: f, start: 0, duration: 0.1, gain: 0.13, shape: "sine", glideTo: f * 1.5 }]));
  }

  playDropdownOpen() {
    this.sfx(() =>
      this.tone([
        { freq: 480, start: 0, duration: 0.05, gain: 0.12, shape: "triangle" },
        { freq: 720, start: 0.04, duration: 0.07, gain: 0.11, shape: "triangle" },
      ]),
    );
  }

  playDropdownSelect() {
    this.sfx(() => this.tone([{ freq: 700, start: 0, duration: 0.08, gain: 0.15, shape: "sine", glideTo: 1040 }]));
  }

  playWhoosh() {
    this.sfx(() => this.noise([{ start: 0, duration: 0.28, gain: 0.16, freq: 600, sweepTo: 3800, q: 0.9 }]));
  }

  /** Heavy rubber-stamp thump for reveals. */
  playStamp() {
    this.sfx(() => {
      this.tone([{ freq: 140, start: 0, duration: 0.22, gain: 0.4, shape: "sine", glideTo: 55 }]);
      this.noise([{ start: 0, duration: 0.09, gain: 0.3, freq: 900, q: 0.7 }]);
    });
  }

  /** Sticker slapped onto paper. */
  playSlap() {
    this.sfx(() => {
      this.noise([{ start: 0, duration: 0.06, gain: 0.24, freq: 2400, sweepTo: 800, q: 0.8 }]);
      this.tone([{ freq: 220, start: 0, duration: 0.07, gain: 0.14, shape: "sine", glideTo: 120 }]);
    });
  }

  playDice() {
    this.sfx(() => {
      for (let i = 0; i < 5; i++) {
        this.noise([{ start: i * 0.045, duration: 0.03, gain: 0.18, freq: 2500 + Math.random() * 2000, q: 4 }]);
      }
      this.tone([{ freq: 880, start: 0.24, duration: 0.12, gain: 0.12, shape: "triangle", glideTo: 1320 }]);
    });
  }

  // ---------- drawing ----------

  playHintReveal() {
    this.sfx(() =>
      this.tone([
        { freq: 1046.5, start: 0, duration: 0.1, gain: 0.14, shape: "triangle" },
        { freq: 1567.98, start: 0.08, duration: 0.2, gain: 0.16, shape: "triangle" },
        { freq: 2093, start: 0.16, duration: 0.25, gain: 0.08, shape: "sine" },
      ]),
    );
  }

  playDrawStart(tool: string) {
    this.sfx(() => {
      const f = tool === "eraser" ? 900 : 2600;
      this.noise([{ start: 0, duration: 0.05, gain: 0.08, freq: f, q: 2 }]);
    });
  }

  /**
   * Continuous pencil-on-paper scratch. Call on every stroke point with the pointer
   * speed (px/frame); the loop's loudness and brightness follow how fast you draw.
   */
  scribble(speed: number, tool = "pencil") {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer || !this.sfxBus) return;
    if (!this.scribbleSrc) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = "bandpass";
      hp.Q.value = 0.8;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(hp);
      hp.connect(gain);
      gain.connect(this.sfxBus);
      src.start();
      this.scribbleSrc = src;
      this.scribbleFilter = hp;
      this.scribbleGain = gain;
    }
    const t = ctx.currentTime;
    const s = Math.min(1, speed / 28);
    const base = tool === "eraser" ? 700 : 2400;
    this.scribbleFilter!.frequency.setTargetAtTime(base + s * 2200, t, 0.03);
    this.scribbleGain!.gain.setTargetAtTime(0.012 + s * 0.07, t, 0.03);
  }

  scribbleStop() {
    if (!this.ctx || !this.scribbleGain || !this.scribbleSrc) return;
    const src = this.scribbleSrc;
    this.scribbleGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    this.scribbleSrc = null;
    this.scribbleGain = null;
    this.scribbleFilter = null;
    setTimeout(() => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }, 250);
  }

  playFill() {
    this.sfx(() => {
      this.tone([{ freq: 180, start: 0, duration: 0.24, gain: 0.16, shape: "sine", glideTo: 520 }]);
      this.noise([{ start: 0.02, duration: 0.2, gain: 0.1, freq: 500, sweepTo: 1800, q: 1.5 }]);
    });
  }

  playUndo() {
    this.sfx(() => this.tone([{ freq: 700, start: 0, duration: 0.1, gain: 0.12, shape: "triangle", glideTo: 420 }]));
  }

  playTrash() {
    this.sfx(() => {
      this.noise([{ start: 0, duration: 0.3, gain: 0.2, freq: 3000, sweepTo: 300, q: 0.7 }]);
      this.tone([{ freq: 300, start: 0.05, duration: 0.2, gain: 0.1, shape: "triangle", glideTo: 120 }]);
    });
  }

  playWordSelect() {
    this.sfx(() => {
      this.playSlapInternal();
      this.tone([
        { freq: 659.25, start: 0.02, duration: 0.09, gain: 0.15, shape: "triangle" },
        { freq: 987.77, start: 0.09, duration: 0.16, gain: 0.16, shape: "triangle" },
      ]);
    });
  }
  private playSlapInternal() {
    this.noise([{ start: 0, duration: 0.05, gain: 0.2, freq: 2000, sweepTo: 700 }]);
  }

  // ---------- guessing + scoring ----------

  /**
   * Correct-guess fanfare. `combo` (the player's streak) raises the key a step per
   * level so hot streaks audibly climb — the core "one more round" hook.
   */
  playCorrect(combo = 1) {
    const k = Math.pow(2, Math.min(6, Math.max(0, combo - 1)) * (2 / 12));
    this.sfx(() => {
      this.tone([
        { freq: 523.25 * k, start: 0, duration: 0.1, gain: 0.2, shape: "triangle" },
        { freq: 659.25 * k, start: 0.07, duration: 0.1, gain: 0.2, shape: "triangle" },
        { freq: 783.99 * k, start: 0.14, duration: 0.1, gain: 0.2, shape: "triangle" },
        { freq: 1046.5 * k, start: 0.21, duration: 0.32, gain: 0.22, shape: "triangle" },
        { freq: 2093 * k, start: 0.21, duration: 0.4, gain: 0.05, shape: "sine" },
      ]);
      this.noise([{ start: 0.2, duration: 0.35, gain: 0.05, freq: 7000, q: 0.6 }]);
    });
  }

  /** Someone else guessed it — quieter, so your own success still stands out. */
  playOtherCorrect() {
    this.sfx(() =>
      this.tone([
        { freq: 783.99, start: 0, duration: 0.08, gain: 0.1, shape: "triangle" },
        { freq: 1174.66, start: 0.06, duration: 0.14, gain: 0.1, shape: "triangle" },
      ]),
    );
  }

  playCoin() {
    this.sfx(() =>
      this.tone([
        { freq: 987.77, start: 0, duration: 0.07, gain: 0.12, shape: "square", lowpass: 3000 },
        { freq: 1318.51, start: 0.06, duration: 0.22, gain: 0.12, shape: "square", lowpass: 3000 },
      ]),
    );
  }

  playWrong() {
    this.sfx(() => this.tone([{ freq: 240, start: 0, duration: 0.14, gain: 0.08, shape: "sine", glideTo: 180 }]));
  }

  playClose() {
    this.sfx(() =>
      this.tone([
        { freq: 660, start: 0, duration: 0.07, gain: 0.12, shape: "triangle" },
        { freq: 622, start: 0.07, duration: 0.09, gain: 0.1, shape: "triangle" },
      ]),
    );
  }

  playCountdownTick(urgent = false) {
    this.sfx(() => {
      this.noise([{ start: 0, duration: 0.03, gain: urgent ? 0.2 : 0.12, freq: urgent ? 5000 : 3500, q: 5 }]);
      this.tone([{ freq: urgent ? 1318.51 : 880, start: 0, duration: 0.06, gain: urgent ? 0.14 : 0.07, shape: "sine" }]);
    });
  }

  playGo() {
    this.sfx(() => {
      this.noise([{ start: 0, duration: 0.3, gain: 0.14, freq: 500, sweepTo: 5000 }]);
      this.tone([
        { freq: 523.25, start: 0, duration: 0.1, gain: 0.18, shape: "triangle" },
        { freq: 1046.5, start: 0.08, duration: 0.3, gain: 0.22, shape: "triangle" },
        { freq: 1568, start: 0.08, duration: 0.3, gain: 0.08, shape: "sine" },
      ]);
    });
  }

  playJoin() {
    this.sfx(() => {
      this.playSlapInternal();
      this.tone([
        { freq: 587.33, start: 0.02, duration: 0.07, gain: 0.14, shape: "triangle" },
        { freq: 880, start: 0.08, duration: 0.14, gain: 0.14, shape: "triangle" },
      ]);
    });
  }

  playLeave() {
    this.sfx(() => this.tone([{ freq: 520, start: 0, duration: 0.2, gain: 0.1, shape: "triangle", glideTo: 260 }]));
  }

  playRoundEnd() {
    this.sfx(() =>
      this.tone([
        { freq: 392, start: 0, duration: 0.1, gain: 0.16, shape: "triangle" },
        { freq: 523.25, start: 0.09, duration: 0.1, gain: 0.16, shape: "triangle" },
        { freq: 659.25, start: 0.18, duration: 0.22, gain: 0.18, shape: "triangle" },
      ]),
    );
  }

  playWinner() {
    this.sfx(() => {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
      const times = [0, 0.11, 0.22, 0.33, 0.5, 0.6, 0.72];
      notes.forEach((f, i) =>
        this.tone([
          { freq: f, start: times[i], duration: i === notes.length - 1 ? 0.6 : 0.14, gain: 0.18, shape: "triangle" },
          { freq: f / 2, start: times[i], duration: 0.14, gain: 0.08, shape: "square", lowpass: 1200 },
        ]),
      );
      this.noise([{ start: 0.72, duration: 0.8, gain: 0.06, freq: 8000, q: 0.5 }]);
    });
  }

  playLevelUp() {
    this.sfx(() => {
      const run = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.51, 1567.98];
      run.forEach((f, i) => this.tone([{ freq: f, start: i * 0.05, duration: 0.12, gain: 0.13, shape: "square", lowpass: 2600 }]));
      this.tone([
        { freq: 1046.5, start: 0.42, duration: 0.6, gain: 0.18, shape: "triangle" },
        { freq: 1318.51, start: 0.42, duration: 0.6, gain: 0.12, shape: "triangle" },
        { freq: 1567.98, start: 0.42, duration: 0.6, gain: 0.1, shape: "triangle" },
      ]);
    });
  }

  playAchievement() {
    this.sfx(() => {
      this.tone([
        { freq: 1318.51, start: 0, duration: 0.1, gain: 0.12, shape: "triangle" },
        { freq: 1567.98, start: 0.08, duration: 0.1, gain: 0.12, shape: "triangle" },
        { freq: 2093, start: 0.16, duration: 0.35, gain: 0.14, shape: "triangle" },
      ]);
      this.noise([{ start: 0.16, duration: 0.4, gain: 0.05, freq: 9000, q: 0.5 }]);
    });
  }

  playReaction() {
    this.sfx(() => this.playPop(0.9 + Math.random() * 0.4));
  }

  // ---------- music ----------

  /** Choose the backing track mood. "game" is quieter and busier; "off" fades out. */
  setMusicMood(mood: MusicMood) {
    if (mood === this.mood) return;
    this.mood = mood;
    if (mood === "off") this.stopMusicLoop();
    else if (this.musicEnabled && this.ctx) this.startMusicLoop();
  }

  /** Temporarily lower music under important moments (e.g. while someone draws). */
  setMusicDuck(amount: number) {
    this.musicDuck = amount;
    this.applyMusicLevel();
  }

  private applyMusicLevel() {
    if (!this.ctx || !this.musicBus) return;
    const target = this.musicEnabled && this.mood !== "off" ? (this.mood === "game" ? 0.16 : 0.22) * this.musicDuck : 0;
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
  }

  private startMusicLoop() {
    if (!this.musicEnabled || this.mood === "off") return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.applyMusicLevel();
    if (this.musicTimer !== null) return;
    this.nextBeatTime = ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 50);
  }

  private stopMusicLoop() {
    this.applyMusicLevel();
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /** Lookahead scheduler: queues eighth-notes ~150ms ahead so timing stays tight. */
  private scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    const bpm = this.mood === "game" ? 112 : 96;
    const eighth = 60 / bpm / 2;
    while (this.nextBeatTime < ctx.currentTime + 0.15) {
      this.playBeat(this.beatIndex, this.nextBeatTime, eighth);
      this.nextBeatTime += eighth;
      this.beatIndex = (this.beatIndex + 1) % 64;
    }
  }

  private playBeat(i: number, t: number, eighth: number) {
    const bus = this.musicBus;
    const bar = Math.floor(i / 8) % PROGRESSION.length;
    const step = i % 8;
    const chord = PROGRESSION[bar];

    // bass: root on 1 and the "and" of 3, octave pop on 4
    if (step === 0 || step === 5) this.tone([{ freq: midi(chord[0]), start: 0, duration: eighth * 1.6, gain: 0.32, shape: "triangle" }], 1, bus, t);
    if (step === 6) this.tone([{ freq: midi(chord[0] + 12), start: 0, duration: eighth * 0.8, gain: 0.18, shape: "triangle" }], 1, bus, t);

    // plucky arpeggio, skipping a note now and then so it breathes
    const arp = [1, 2, 3, 4, 3, 2, 3, 1];
    if (!(step === 7 && bar % 2 === 1)) {
      this.tone(
        [{ freq: midi(chord[arp[step]] + 12), start: 0, duration: eighth * 0.9, gain: 0.07, shape: "square", lowpass: 1900 }],
        1,
        bus,
        t,
      );
    }

    // soft kit: kick on 1/5, rimshot-ish on 3/7, hats on offbeats
    if (step === 0 || step === 4) this.tone([{ freq: 150, start: 0, duration: 0.12, gain: 0.35, shape: "sine", glideTo: 45 }], 1, bus, t);
    if (step === 2 || step === 6) this.noise([{ start: 0, duration: 0.06, gain: 0.08, freq: 1800, q: 1.2 }], 1, bus, t);
    if (this.mood === "game" || step % 2 === 1) this.noise([{ start: 0, duration: 0.025, gain: 0.05, freq: 9000, q: 1 }], 1, bus, t);
  }
}

export const audio = new AudioManager();
