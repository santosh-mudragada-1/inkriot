import { CHAOS, ORGANIZED } from "./cast";
import { BLEED, CLICKS, DURATION, GAINS, orgAt, ROCKET_TIMES, SWEEPS } from "./choreography";
import { clamp, rng } from "./math";
import { FEED, FLOATERS } from "./script";

/**
 * The teaser's soundtrack: an original track plus sound effects, rendered offline into
 * one stereo buffer. Everything is synthesised in code and every hit is placed from the
 * film's own cue times, so picture and sound can't disagree. Seeded, so it renders
 * identically every time.
 *
 * The music is a 120 bpm track in C major (a beat every 0.5s, so the scene changes at
 * 2.5 / 6 / 9 / 14s land on the grid). The whole music bus runs through one low-pass
 * filter that's automated like a DJ's: muffled intro that opens on the first drop, a
 * dreamy dip for the zoom-out, and a sweep open into the logo.
 */

const SR = 44100;
const E = 0.25; // an eighth note at 120 bpm
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.3];

// chords as [bass, ...voicing] in midi
const CH = {
  C: [36, 60, 64, 67, 72],
  Am: [45, 57, 60, 64, 69],
  F: [41, 57, 60, 65, 69],
  G: [43, 55, 59, 62, 67],
};
type Chord = keyof typeof CH;
// the harmony, by time: home → the pile-up → the brush → the game → the lift → filed away → build → home
const CHART: [number, Chord][] = [
  [0, "C"], [2, "Am"], [4, "F"], [6, "G"], [7, "Am"], [8, "F"], [8.5, "G"],
  [9, "C"], [10, "Am"], [11, "F"], [11.5, "G"], [12, "C"], [13, "F"], [13.5, "G"],
  [14, "C"], [15, "F"], [16, "G"], [17.76, "C"],
];
const chordAt = (t: number) => CH[[...CHART].reverse().find(([s]) => t >= s - 1e-6)![1]];

// The hook: two bars of C-major pentatonic (midi, null = rest), one note per eighth.
const HOOK_A = [76, null, 79, 81, null, 79, 76, 74];
const HOOK_B = [72, null, 74, 76, null, 79, null, null];
const HOOK_HI = [81, null, 84, 86, null, 84, 81, 79];

interface Tone {
  f: number;
  s?: number;
  d: number;
  g?: number;
  shape?: OscillatorType;
  glide?: number;
  lp?: number;
  a?: number;
  detune?: number;
}
interface Noise {
  s?: number;
  d: number;
  g?: number;
  f?: number;
  to?: number;
  q?: number;
  a?: number;
  type?: BiquadFilterType;
}
interface Out {
  bus?: "sfx" | "music";
  pan?: number;
  /** sweep the pan to here over `panDur` (a swoosh flying across the speakers) */
  panTo?: number;
  panDur?: number;
  verb?: number;
  vol?: number;
}

class Mix {
  readonly ctx: OfflineAudioContext;
  /** the whole music bus runs through this, so it can be opened/closed like a DJ filter */
  readonly musicFilter: BiquadFilterNode;
  private sfx: GainNode;
  private music: GainNode;
  private verb: GainNode;
  private noiseBuf: AudioBuffer;
  private r = rng(2024);

  constructor() {
    const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * SR), SR);
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    const master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp);
    comp.connect(ctx.destination);

    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(master);
    this.music = ctx.createGain();
    this.music.gain.value = 0.7;
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = "lowpass";
    this.musicFilter.Q.value = 1.1;
    this.musicFilter.frequency.value = 20000;
    this.music.connect(this.musicFilter);
    this.musicFilter.connect(master);

    // a small, bright room: seeded decaying noise as the impulse response
    const ir = ctx.createBuffer(2, Math.floor(SR * 1.8), SR);
    const rr = rng(77);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = (rr() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.3;
    conv.connect(verbOut);
    verbOut.connect(master);
    this.verb = ctx.createGain();
    this.verb.connect(conv);

    this.noiseBuf = ctx.createBuffer(1, SR * 2, SR);
    const nd = this.noiseBuf.getChannelData(0);
    const nr = rng(9);
    for (let i = 0; i < nd.length; i++) nd[i] = nr() * 2 - 1;
  }

  private route(node: AudioNode, at: number, o: Out) {
    const pan = this.ctx.createStereoPanner();
    pan.pan.setValueAtTime(clamp(o.pan ?? 0, -1, 1), at);
    if (o.panTo !== undefined) pan.pan.linearRampToValueAtTime(clamp(o.panTo, -1, 1), at + (o.panDur ?? 0.3));
    node.connect(pan);
    pan.connect(o.bus === "music" ? this.music : this.sfx);
    if (o.verb) {
      const send = this.ctx.createGain();
      send.gain.value = o.verb;
      pan.connect(send);
      send.connect(this.verb);
    }
  }

  tone(at: number, steps: Tone[], o: Out = {}) {
    if (at < 0 || at >= DURATION) return;
    const ctx = this.ctx;
    const sum = ctx.createGain();
    this.route(sum, at, o);
    for (const st of steps) {
      const t0 = at + (st.s ?? 0);
      const osc = ctx.createOscillator();
      osc.type = st.shape ?? "sine";
      osc.frequency.setValueAtTime(st.f, t0);
      if (st.detune) osc.detune.value = st.detune;
      if (st.glide) osc.frequency.exponentialRampToValueAtTime(st.glide, t0 + st.d);
      const env = ctx.createGain();
      const peak = Math.max(0.0002, (st.g ?? 0.2) * (o.vol ?? 1));
      const a = st.a ?? 0.006;
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(peak, t0 + a);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(a + 0.01, st.d));
      let node: AudioNode = osc;
      if (st.lp) {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = st.lp;
        osc.connect(lp);
        node = lp;
      }
      node.connect(env);
      env.connect(sum);
      osc.start(t0);
      osc.stop(t0 + st.d + 0.05);
    }
  }

  noise(at: number, steps: Noise[], o: Out = {}) {
    if (at < 0 || at >= DURATION) return;
    const ctx = this.ctx;
    const sum = ctx.createGain();
    this.route(sum, at, o);
    for (const st of steps) {
      const t0 = at + (st.s ?? 0);
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = st.type ?? "bandpass";
      f.Q.value = st.q ?? 1.2;
      f.frequency.setValueAtTime(st.f ?? 2000, t0);
      if (st.to) f.frequency.exponentialRampToValueAtTime(st.to, t0 + st.d);
      const env = ctx.createGain();
      const peak = Math.max(0.0002, (st.g ?? 0.2) * (o.vol ?? 1));
      const a = st.a ?? 0.005;
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(peak, t0 + a);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(a + 0.01, st.d));
      src.connect(f);
      f.connect(env);
      env.connect(sum);
      src.start(t0, this.r() * 1.5);
      src.stop(t0 + st.d + 0.05);
    }
  }
}

const panX = (x: number) => clamp(((x - 960) / 960) * 0.7, -0.8, 0.8);

/* ================================================================ instruments */

function kit(m: Mix) {
  const o: Out = { bus: "music" };
  const k = {
    /** tight, punchy kick: a fast pitch drop with a click on top */
    kick: (t: number, g = 0.62) => {
      m.tone(t, [
        { f: 190, d: 0.3, g, glide: 44 },
        { f: 1400, d: 0.014, g: g * 0.22, glide: 320 },
      ], o);
    },
    /** a real snare: noisy crack + a tuned body + a bit of room */
    snare: (t: number, g = 0.2) => {
      m.noise(t, [
        { d: 0.18, g, f: 1900, q: 0.6 },
        { d: 0.07, g: g * 0.6, f: 5200, q: 0.9 },
      ], { ...o, verb: 0.18 });
      m.tone(t, [{ f: 205, d: 0.1, g: g * 0.7, glide: 160, shape: "triangle" }], o);
    },
    clap: (t: number, g = 0.12) =>
      m.noise(t, [
        { d: 0.03, g, f: 1400, q: 0.9 },
        { s: 0.012, d: 0.03, g, f: 1500, q: 0.9 },
        { s: 0.024, d: 0.16, g: g * 0.9, f: 1300, q: 0.8 },
      ], { ...o, verb: 0.2, pan: 0.1 }),
    hat: (t: number, g = 0.05, pan = 0.25) => m.noise(t, [{ d: 0.03, g, f: 7800, q: 0.7, type: "highpass" }], { ...o, pan }),
    open: (t: number, g = 0.04) => m.noise(t, [{ d: 0.2, g, f: 6800, q: 0.7, type: "highpass" }], { ...o, pan: -0.2 }),
    shaker: (t: number, g = 0.022) => m.noise(t, [{ d: 0.05, g, f: 6500, q: 2, a: 0.02 }], { ...o, pan: 0.35 }),
    crash: (t: number, g = 0.14, d = 1.8) =>
      m.noise(t, [
        { d, g, f: 5200, q: 0.5, type: "highpass" },
        { d: d * 0.6, g: g * 0.5, f: 9500, q: 0.7 },
      ], { ...o, verb: 0.3 }),
    sub: (t: number, n: number, d: number, g = 0.4) => m.tone(t, [{ f: midi(n), d, g, a: 0.005 }], o),
    /** bass: a warm low saw with a sine underneath */
    bass: (t: number, n: number, d: number, g = 0.2) =>
      m.tone(t, [
        { f: midi(n), d, g, shape: "sawtooth", lp: 720 },
        { f: midi(n), d: d * 0.95, g: g * 0.9 },
      ], o),
    pluck: (t: number, n: number, d: number, g = 0.05, lp = 1900, pan = -0.15) => m.tone(t, [{ f: midi(n), d, g, shape: "square", lp }], { ...o, pan }),
    /** chords that swell in after each kick — the "pumping" feel of a sidechained pad */
    pump: (t: number, notes: number[], d = 0.48, g = 0.028) => {
      notes.forEach((n, i) =>
        m.tone(t, [
          { f: midi(n), d, g, shape: "sawtooth", lp: 2200, a: 0.09, detune: i % 2 ? 8 : -8 },
          { f: midi(n), d, g: g * 0.8, shape: "triangle", a: 0.09 },
        ], { ...o, pan: (i - notes.length / 2) * 0.18, verb: 0.2 }),
      );
    },
    /** the lead: a bright square/saw pair with a sine an octave up for sparkle */
    lead: (t: number, n: number, d: number, g = 0.06) =>
      m.tone(t, [
        { f: midi(n), d, g, shape: "square", lp: 3400 },
        { f: midi(n), d, g: g * 0.6, shape: "sawtooth", lp: 2800, detune: 9 },
        { f: midi(n + 12), d: d * 0.7, g: g * 0.25 },
      ], { ...o, pan: 0.08, verb: 0.25 }),
    bell: (t: number, f: number, d = 0.32, g = 0.1, pan = 0, verb = 0.3) =>
      m.tone(t, [
        { f, d, g, shape: "triangle" },
        { f: f * 2, d: d * 0.6, g: g * 0.28 },
      ], { ...o, pan, verb }),
    pad: (t: number, notes: number[], d: number, g = 0.03, a = 0.25) => {
      for (const [i, n] of notes.entries()) {
        m.tone(t, [
          { f: midi(n), d, g, shape: "triangle", a },
          { f: midi(n), d, g: g * 0.45, shape: "sawtooth", lp: 1300, a, detune: i % 2 ? 7 : -7 },
        ], { ...o, pan: (i - notes.length / 2) * 0.15, verb: 0.4 });
      }
    },
    stab: (t: number, notes: number[], d = 0.32, g = 0.05, verb = 0.2) => {
      for (const n of notes)
        m.tone(t, [
          { f: midi(n), d, g, shape: "triangle" },
          { f: midi(n), d: d * 0.7, g: g * 0.45, shape: "square", lp: 2600 },
        ], { ...o, verb });
    },
    /** noise + saw rising together into a hit */
    riser: (t0: number, t1: number, g = 0.16) => {
      m.noise(t0, [{ d: t1 - t0, g, f: 350, to: 8000, q: 0.9, a: t1 - t0 - 0.02 }], { ...o, verb: 0.2 });
      m.tone(t0, [{ f: 110, d: t1 - t0, g: g * 0.3, shape: "sawtooth", glide: 660, lp: 2200, a: t1 - t0 - 0.02 }], o);
    },
    /** a reversed cymbal: swells up and stops dead on the downbeat */
    swell: (t0: number, t1: number, g = 0.13) => m.noise(t0, [{ d: t1 - t0, g, f: 4500, q: 0.5, type: "highpass", a: t1 - t0 - 0.01 }], { ...o, verb: 0.25 }),
    roll: (t0: number, t1: number, from = 0.04, to = 0.2, accel = false) => {
      let t = t0;
      while (t < t1 - 1e-3) {
        const u = (t - t0) / (t1 - t0);
        k.snare(t, from + (to - from) * u);
        t += accel ? 0.125 - u * 0.09 : E / 2;
      }
    },
    /** play a phrase (one note per eighth) starting at t */
    phrase: (t: number, notes: (number | null)[], g = 0.06, voice: "lead" | "bell" = "lead") => {
      notes.forEach((n, i) => {
        if (n === null) return;
        let len = 1;
        while (notes[i + len] === null && len < 3) len++;
        const at = t + i * E;
        if (voice === "lead") k.lead(at, n, E * len * 0.9, g);
        else k.bell(at, midi(n), E * len * 0.95, g, 0.1, 0.35);
      });
    },
  };
  return k;
}

/* ================================================================ the track */

function music(m: Mix) {
  const k = kit(m);
  const ARP = [1, 2, 3, 4, 3, 2, 3, 1];
  const grid = (from: number, to: number, step = E) => {
    const out: number[] = [];
    for (let t = Math.ceil(from / step - 1e-6) * step; t < to - 1e-6; t += step) out.push(+t.toFixed(4));
    return out;
  };
  const stepIn = (t: number) => Math.round((t % 2) / E) % 8; // eighth within a 2s bar
  const on = (t: number, every: number, at = 0) => Math.abs((((t - at) % every) + every) % every) < 1e-3;
  const pumpAt = (t: number, g?: number) => k.pump(t, chordAt(t).slice(1), 0.46, g);

  // The DJ filter on the whole music bus.
  const lp = m.musicFilter.frequency;
  lp.setValueAtTime(420, 0);
  lp.exponentialRampToValueAtTime(900, 1.8);
  lp.exponentialRampToValueAtTime(7000, 2.48); // opens into the first drop
  lp.setValueAtTime(20000, 2.5);
  lp.setValueAtTime(20000, 13.9);
  lp.exponentialRampToValueAtTime(1500, 14.6); // the zoom-out: far away, dreamy
  lp.setValueAtTime(1500, 16.85);
  lp.exponentialRampToValueAtTime(14000, 17.6); // sweeps open into the logo
  lp.setValueAtTime(20000, 17.76);

  /* ---- 0.47–2.5 intro: a muffled heartbeat of the track, building */
  k.sub(0.47, 36, 1.2, 0.34);
  for (const t of grid(0.5, 2.5, 0.5)) pumpAt(t, 0.034);
  for (const t of grid(1.5, 2.5, 0.5)) k.kick(t, 0.32 + (t - 1.5) * 0.2);
  k.phrase(0.5, HOOK_A, 0.05);
  k.phrase(1.5, HOOK_B.slice(0, 4), 0.05);
  k.riser(1.75, 2.5, 0.1);
  k.swell(2.05, 2.5, 0.12);

  /* ---- 2.5–5.12 DROP 1: the pile-up — the full groove and the hook */
  k.crash(2.5, 0.13);
  k.sub(2.5, 45, 0.5, 0.3);
  for (const t of grid(2.5, 5.12)) {
    const c = chordAt(t);
    if (on(t, 0.5)) {
      k.kick(t);
      pumpAt(t);
    }
    if (on(t, 1, 0.5)) k.snare(t);
    k.hat(t, on(t, 0.5, 0.25) ? 0.055 : 0.03);
    if (t >= 3.5) k.hat(t + E / 2, 0.026, -0.25);
    if (on(t, 0.5, 0.25)) k.open(t, 0.03);
    k.bass(t, c[0] + (on(t, 0.5, 0.25) ? 12 : 0), E * 0.85);
  }
  k.phrase(2.5, HOOK_A);
  k.phrase(4.5, HOOK_B.slice(0, 2));
  k.roll(4.62, 5.1, 0.03, 0.17);
  k.riser(4.3, 5.12, 0.1);

  /* ---- 5.12 "Too many ideas?": the record stops. */
  k.kick(5.12, 0.7);
  k.stab(5.12, [65, 69, 72, 77], 0.3, 0.06);
  // tape-stop: the chord and bass sag in pitch and die
  for (const n of [41, 53, 57, 60, 65])
    m.tone(5.3, [{ f: midi(n), d: 0.5, g: n < 50 ? 0.14 : 0.04, shape: "sawtooth", glide: midi(n) / 4, lp: 1800 }], { bus: "music" });

  /* ---- 5.8–6.2 the brush winds up… */
  k.riser(5.8, 6.2, 0.14);
  k.swell(5.85, 6.2, 0.15);

  /* ---- 6.2–8.5 DROP 2: the brush — the biggest, brightest section */
  k.crash(6.2, 0.17, 2);
  k.kick(6.2, 0.75);
  k.sub(6.2, 43, 0.8, 0.42);
  pumpAt(6.2, 0.03);
  for (const t of grid(6.5, 8.5)) {
    const c = chordAt(t);
    if (on(t, 0.5)) {
      k.kick(t);
      pumpAt(t, 0.03);
    }
    if (on(t, 1, 0.5)) {
      k.snare(t, 0.22);
      k.clap(t, 0.1);
    }
    k.hat(t, 0.04);
    k.hat(t + E / 2, 0.028, -0.25);
    if (on(t, 0.5, 0.25)) k.open(t, 0.035);
    k.bass(t, c[0] + (on(t, 0.5, 0.25) ? 12 : 0), E * 0.8, 0.22);
    k.bass(t + E / 2, c[0], E * 0.4, 0.12);
  }
  k.phrase(6.5, HOOK_HI, 0.065);
  // into the product: a roll, a swell, a crash
  k.roll(8.5, 9.0, 0.05, 0.22);
  k.swell(8.55, 9.0, 0.12);
  k.kick(8.5, 0.5);
  k.kick(8.75, 0.5);

  /* ---- 9–12 the game: the groove steps back so the product can speak */
  k.crash(9, 0.1, 1.4);
  for (const t of grid(9, 12)) {
    const c = chordAt(t);
    const s = stepIn(t);
    const duck = t >= ROCKET_TIMES.body[0] && t < ROCKET_TIMES.fill ? 0.75 : 1;
    if (on(t, 1)) k.kick(t, 0.5 * duck);
    if (on(t, 1, 0.5)) k.snare(t, 0.12 * duck);
    k.hat(t, (on(t, 0.5, 0.25) ? 0.045 : 0.025) * duck);
    if (s === 0 || s === 3 || s === 5) k.bass(t, c[0], E * 1.4, 0.2 * duck);
    if (s === 6) k.bass(t, c[0] + 12, E * 0.8, 0.14 * duck);
    k.pluck(t, c[ARP[s]] + 12, E * 0.9, 0.045 * duck, 1900);
    if (on(t, 1)) pumpAt(t, 0.016 * duck);
  }
  k.roll(11.5, 12, 0.03, 0.14);
  k.swell(11.6, 12, 0.09);

  /* ---- 12–14 the chorus: they got it — full groove, the hook comes back */
  k.crash(12, 0.13);
  for (const t of grid(12, 14)) {
    const c = chordAt(t);
    if (on(t, 0.5)) {
      k.kick(t);
      pumpAt(t, 0.03);
    }
    if (on(t, 1, 0.5)) {
      k.snare(t);
      k.clap(t, 0.09);
    }
    k.hat(t, 0.04);
    k.hat(t + E / 2, 0.025, -0.25);
    if (on(t, 0.5, 0.25)) k.open(t, 0.03);
    k.bass(t, c[0] + (on(t, 0.5, 0.25) ? 12 : 0), E * 0.85, 0.21);
  }
  const hook: [number, number, number][] = [
    [12.75, 81, 0.2], [13.0, 84, 0.22], [13.25, 81, 0.2], [13.5, 86, 0.3], [13.75, 79, 0.22], [14.0, 88, 0.9],
  ];
  for (const [t, n, d] of hook) {
    k.lead(t, n, d, 0.06);
    k.bell(t, midi(n), d, 0.05, 0.15, 0.3);
  }

  /* ---- 14–16.85 filed away: half-time, filtered, everything moving together */
  k.crash(14, 0.08, 1.6);
  k.pad(14, [60, 64, 67, 72], 1.05, 0.03, 0.3);
  k.pad(15, [57, 60, 65, 69], 1.05, 0.03, 0.3);
  k.pad(16, [55, 59, 62, 67], 0.9, 0.03, 0.3);
  for (const t of grid(14, 16.85)) {
    const c = chordAt(t);
    if (on(t, 2)) k.kick(t, 0.5);
    if (on(t, 2, 1)) k.snare(t, 0.14);
    if (on(t, 1)) k.bass(t, c[0], 0.95, 0.2);
    if (on(t, 0.5)) pumpAt(t, 0.025);
    k.shaker(t);
    k.shaker(t + E / 2, 0.013);
  }
  k.phrase(14.5, HOOK_A, 0.075, "bell");
  k.phrase(16.5, HOOK_B.slice(0, 1), 0.07, "bell");

  /* ---- 16.85–17.62 pulled in: a riser and a roll that tightens to the dot */
  k.riser(16.85, 17.62, 0.3);
  k.swell(17.1, 17.62, 0.22);
  m.tone(16.85, [{ f: midi(43), d: 0.77, g: 0.2, shape: "triangle", glide: midi(55), a: 0.4 }], { bus: "music" });
  k.roll(16.9, 17.56, 0.06, 0.3, true);

  /* ---- 17.76 home: the wordmark lands on the tonic */
  k.kick(17.76, 0.85);
  k.sub(17.76, 36, 1.8, 0.45);
  k.crash(17.76, 0.2, 2.2);
  k.stab(17.76, [48, 60, 64, 67, 72, 76, 79], 1.9, 0.045, 0.45);
  k.pad(17.8, [60, 64, 67, 72, 76], 2.1, 0.028, 0.35);
  k.bass(17.76, 36, 1.4, 0.2);
  // a short bouncy outro under the tagline, then the button
  for (const t of grid(18, 19.5)) {
    const s = stepIn(t);
    if (on(t, 0.5)) k.kick(t, 0.45);
    if (on(t, 1, 0.5)) k.clap(t, 0.1);
    if (on(t, 0.5, 0.25)) k.hat(t, 0.04);
    k.pluck(t, CH.C[ARP[s]] + 12, E * 0.85, 0.042, 2600);
    if (s === 0 || s === 5) k.bass(t, 36, E * 1.5, 0.18);
  }
  k.kick(19.5, 0.6);
  k.stab(19.5, [60, 64, 67, 72], 0.45, 0.05, 0.5);
  k.bell(19.5, midi(84), 0.45, 0.09, 0, 0.5);
  k.open(19.5, 0.045);
}

/* ================================================================ sound effects */

function sfx(m: Mix) {
  const o = (x = 960, vol = 1, verb = 0): Out => ({ bus: "sfx", pan: panX(x), vol, verb });

  /** big cinematic hit: a thump, a sub that drops away, a low boom and air */
  const impact = (t: number, g = 1, x = 960) => {
    m.tone(t, [
      { f: 120, d: 0.5, g: 0.5 * g, glide: 32 },
      { f: 60, d: 1.1, g: 0.3 * g, glide: 28, a: 0.01 },
    ], o(x, 1, 0.2));
    m.noise(t, [
      { d: 0.55, g: 0.3 * g, f: 380, q: 0.6, type: "lowpass" },
      { d: 0.9, g: 0.07 * g, f: 6000, q: 0.5, type: "highpass" },
    ], o(x, 1, 0.35));
  };
  /** a swoosh that flies across the speakers */
  const swoosh = (t: number, d: number, from: number, to: number, g = 0.14, panFrom = -0.7, panTo = 0.7) => {
    m.noise(t, [{ d, g, f: from, to, q: 1.1, a: d * 0.55 }], { bus: "sfx", pan: panFrom, panTo, panDur: d, verb: 0.15 });
    m.tone(t, [{ f: from / 6, d, g: g * 0.12, glide: to / 6, a: d * 0.55, shape: "triangle" }], { bus: "sfx", pan: panFrom, panTo, panDur: d });
  };
  const slap = (t: number, x = 960, vol = 1, pitch = 1) => {
    m.noise(t, [{ d: 0.06, g: 0.22, f: 2400 * pitch, to: 800, q: 0.8 }], o(x, vol));
    m.tone(t, [{ f: 220 * pitch, d: 0.07, g: 0.13, glide: 120 }], o(x, vol));
  };
  const pop = (t: number, pitch = 1, x = 960, vol = 1) => {
    m.tone(t, [{ f: 300 * pitch, d: 0.08, g: 0.18, glide: 900 * pitch }], o(x, vol));
    m.noise(t, [{ d: 0.03, g: 0.07, f: 4000 }], o(x, vol));
  };
  const stamp = (t: number, x = 960, vol = 1) => {
    m.tone(t, [{ f: 140, d: 0.24, g: 0.38, glide: 52 }], o(x, vol));
    m.noise(t, [{ d: 0.1, g: 0.28, f: 900, q: 0.7 }], o(x, vol, 0.15));
  };
  const click = (t: number, x = 960) => {
    m.noise(t, [{ d: 0.035, g: 0.14, f: 3200, q: 2 }], o(x));
    m.tone(t, [{ f: 380, d: 0.08, g: 0.1, glide: 620 }], o(x));
  };
  const thud = (t: number, x = 960, vol = 1) => m.tone(t, [{ f: 120, d: 0.14, g: 0.22, glide: 48 }], o(x, vol));
  const tape = (t: number, x = 960) => m.noise(t, [{ d: 0.13, g: 0.1, f: 2600, to: 5200, q: 1.4 }], o(x));
  const splat = (t: number, x = 960, vol = 1) => {
    // wet ink hitting paper: a low thump, a slap of liquid, a scatter of droplets
    m.tone(t, [{ f: 190, d: 0.26, g: 0.3, glide: 55 }], o(x, vol));
    m.noise(t, [{ d: 0.28, g: 0.24, f: 1400, to: 260, q: 0.7 }], o(x, vol, 0.2));
    const r = rng(Math.round(t * 1000));
    for (let i = 0; i < 6; i++) m.tone(t + 0.04 + r() * 0.22, [{ f: 900 + r() * 1400, d: 0.035, g: 0.05, glide: 2600 }], o(x + (r() - 0.5) * 900, vol));
  };
  /** a DJ scratch: the record dragged back and forth under the hand */
  const scratch = (t: number, g = 0.24) => {
    const moves: [number, number, number, number][] = [
      [0, 0.07, 700, 3400],
      [0.07, 0.07, 3400, 900],
      [0.14, 0.05, 900, 2600],
      [0.19, 0.09, 2600, 500],
    ];
    for (const [s, d, a, b] of moves) {
      m.noise(t + s, [{ d, g, f: a, to: b, q: 2.6, a: 0.004 }], o());
      m.tone(t + s, [{ f: a / 5, d, g: g * 0.35, glide: b / 5, shape: "sawtooth", lp: 2400, a: 0.004 }], o());
    }
  };
  /** a cinematic braam: a wall of low detuned saws */
  const braam = (t: number, notes: number[], d = 1.1, g = 0.1) => {
    notes.forEach((n, i) =>
      m.tone(t, [
        { f: midi(n), d, g, shape: "sawtooth", lp: 900, a: 0.02, detune: i % 2 ? 12 : -12 },
        { f: midi(n), d, g: g * 0.7, shape: "sawtooth", lp: 700, a: 0.02, detune: i % 2 ? -5 : 5 },
      ], { bus: "sfx", pan: (i - notes.length / 2) * 0.3, verb: 0.4 }),
    );
  };
  const chime = (t: number, notes: number[], gap: number, g = 0.16, x = 1500) =>
    notes.forEach((f, i) => m.tone(t + i * gap, [{ f, d: i === notes.length - 1 ? 0.34 : 0.1, g, shape: "triangle" }], o(x, 1, 0.2)));
  const sparkle = (t: number, x = 960, g = 0.05) => {
    m.noise(t, [{ d: 0.6, g, f: 9000, q: 0.5 }], o(x, 1, 0.3));
    [2093, 2637, 3136].forEach((f, i) => m.tone(t + i * 0.05, [{ f, d: 0.18, g: g * 0.9, shape: "triangle" }], o(x + (i - 1) * 200, 1, 0.3)));
  };

  /* ---- scene 1: the pen, the dot, the splash */
  swoosh(0.0, 0.18, 1800, 4800, 0.08, 0.6, 0);
  pop(0.15, 0.7);
  m.tone(0.36, [{ f: 260, d: 0.11, g: 0.1, glide: 520, shape: "triangle" }], o()); // the dot swells…
  splat(0.47, 960, 1.1);
  impact(0.47, 0.9); // …and the splash lands like a punch
  swoosh(1.1, 0.26, 2200, 5200, 0.06, 0.2, 0.8);

  /* ---- the pile-up: stickers slap, avatars land — sparse enough to hear the track */
  let note = 0;
  for (const it of CHAOS) {
    if (it.id === "splash" || it.id === "title") continue;
    const t = it.t0;
    const x = it.x;
    if (it.body.kind === "sticker" || it.body.kind === "hand") {
      // each new word rings the next note up the scale
      const f = PENTA[note % PENTA.length];
      m.tone(t + 0.06, [{ f, d: 0.22, g: 0.1, shape: "triangle" }, { f: f * 2, d: 0.12, g: 0.03 }], o(x, 1, 0.25));
      note++;
    }
    if (it.enter === "slam") slap(t + 0.08, x, t < 2.5 ? 1 : 0.7);
    if (it.enter === "drop") thud(t + 0.32, x, 0.8);
  }
  // the whole pile gets louder and wider until…
  swoosh(3.9, 1.2, 600, 5200, 0.07, -0.8, 0.8);

  /* ---- "Too many ideas?" — scratch, stamp, stamp, BRAAM */
  scratch(5.02);
  stamp(5.12, 960, 1.1);
  stamp(5.27, 960, 1.3);
  impact(5.27, 1.1);
  braam(5.27, [29, 36, 41, 48], 1.0, 0.09);

  /* ---- scene 3: the brush */
  pop(5.8, 0.55, 330);
  m.tone(6.0, [{ f: 300, d: 0.12, g: 0.1, glide: 720, shape: "triangle" }], o(260)); // wind-up
  splat(6.2, 150, 1.2);
  impact(6.2, 1.1, 300);
  // each pass: a big stereo swoosh following the brush across the speakers
  for (const sw of SWEEPS) {
    const d = sw.t1 - sw.t0;
    swoosh(sw.t0, d, 380, 3200, 0.2, sw.dir > 0 ? -0.8 : 0.8, sw.dir > 0 ? 0.8 : -0.8);
  }
  splat(7.02, 1900, 0.5);
  splat(7.78, 20, 0.5);
  m.noise(BLEED[0], [{ d: BLEED[1] - BLEED[0] + 0.2, g: 0.08, f: 300, to: 900, q: 0.8, a: 0.2 }], o());

  /* ---- scene 4: the product */
  swoosh(8.8, 0.45, 900, 3600, 0.1, 0.5, 0); // camera pushes in
  click(CLICKS[0], 1000);
  // word-select sting (the product's own)
  slap(CLICKS[0] + 0.01, 1000, 0.7);
  m.tone(CLICKS[0] + 0.02, [{ f: 659.25, d: 0.09, g: 0.14, shape: "triangle" }, { f: 987.77, s: 0.07, d: 0.16, g: 0.15, shape: "triangle" }], o(1000, 1, 0.2));
  swoosh(9.66, 0.38, 900, 3800, 0.1, 0, 0.3); // the card flies to the header
  slap(10.04, 960, 1.1);
  thud(10.04, 960);
  // "go": the pen is live
  m.noise(10.1, [{ d: 0.3, g: 0.08, f: 500, to: 5000 }], o());
  m.tone(10.1, [{ f: 523.25, d: 0.1, g: 0.1, shape: "triangle" }, { f: 1046.5, s: 0.08, d: 0.3, g: 0.12, shape: "triangle" }], o(960, 1, 0.2));
  // toolbar: sun swatch, fill tool, tomato swatch, fill
  click(CLICKS[1], 900);
  m.tone(CLICKS[1], [{ f: PENTA[3], d: 0.1, g: 0.11, glide: PENTA[3] * 1.5 }], o(900));
  click(CLICKS[2], 800);
  click(CLICKS[3], 880);
  m.tone(CLICKS[3], [{ f: PENTA[1], d: 0.1, g: 0.11, glide: PENTA[1] * 1.5 }], o(880));
  click(CLICKS[4], 950);
  // the fill: colour floods in with a whoomp
  m.tone(ROCKET_TIMES.fill, [{ f: 160, d: 0.3, g: 0.24, glide: 560 }], o(950, 1, 0.2));
  m.noise(ROCKET_TIMES.fill + 0.02, [{ d: 0.26, g: 0.12, f: 500, to: 2200, q: 1.3 }], o(950));
  impact(ROCKET_TIMES.fill, 0.45, 950);
  // the chat: soft blips for guesses, then three right answers climbing the scale
  let combo = 0;
  for (const f of FEED) {
    if (f.at === undefined) continue;
    if (f.correct) {
      const up = [1, 1.25, 1.5][combo++] ?? 1.5;
      chime(f.at, [523.25, 659.25, 783.99, 1046.5].map((n) => n * up), 0.065, 0.13);
    } else if (f.close) {
      m.tone(f.at, [{ f: 660, d: 0.07, g: 0.09, shape: "triangle" }, { f: 622, s: 0.07, d: 0.09, g: 0.08, shape: "triangle" }], o(1500));
    } else {
      m.tone(f.at, [{ f: 740, d: 0.08, g: 0.05, shape: "triangle", glide: 830 }], o(1500));
    }
  }
  for (const f of FLOATERS) pop(f.at, 0.95 + f.left / 200, 520 + f.left * 8, 0.55);
  for (const [who, at] of Object.entries(GAINS)) {
    if (who === "nova") continue;
    m.tone(at + 0.05, [{ f: 987.77, d: 0.07, g: 0.05, shape: "square", lp: 3000 }, { f: 1318.51, s: 0.06, d: 0.18, g: 0.05, shape: "square", lp: 3000 }], o(400));
  }
  // ARTIST BONUS: the big payoff
  stamp(12.58, 960, 1.2);
  impact(12.58, 0.7);
  m.tone(12.64, [{ f: 987.77, d: 0.07, g: 0.1, shape: "square", lp: 3000 }, { f: 1318.51, s: 0.06, d: 0.24, g: 0.1, shape: "square", lp: 3000 }], o(960, 1, 0.2));
  sparkle(12.66);
  swoosh(11.96, 0.5, 2400, 700, 0.08, 0.3, -0.3); // camera pulls back

  /* ---- scene 5: zoom out, and everything files itself away up the scale */
  swoosh(13.95, 1.15, 4200, 320, 0.17, 0, 0); // the big pull-away
  impact(14.0, 0.4);
  tape(14.95, 200);
  tape(15.05, 1740);
  const order = ORGANIZED.map((it, i) => ({ it, at: orgAt(i) })).sort((a, b) => a.at - b.at);
  order.forEach(({ it, at }, i) => {
    // up the scale and gently back down: pieces sorting themselves into place
    const f = PENTA[Math.max(0, i < PENTA.length ? i : 2 * PENTA.length - 2 - i)];
    m.tone(at + 0.08, [{ f, d: 0.16, g: 0.05, shape: "triangle" }], o(960 + (it.x - 960) * 0.35, 1, 0.3));
  });

  /* ---- scene 6: breathe in, get pulled in, the dot, the burst, the brand */
  swoosh(16.85, 0.25, 6000, 1200, 0.08, 0.6, -0.6);
  swoosh(17.1, 0.52, 700, 7000, 0.26, -0.8, 0); // everything sucked into the centre
  pop(17.58, 0.6);
  m.tone(17.68, [{ f: 420, d: 0.08, g: 0.1, glide: 260, shape: "triangle" }], o());
  splat(17.76, 960, 1.3);
  impact(17.76, 1.3);
  slap(17.78, 700, 0.9);
  // each letter ticks up the pentatonic as it lands
  for (let i = 0; i < 7; i++) {
    const t = 17.84 + 0.055 * i + 0.1;
    m.tone(t, [{ f: PENTA[i], d: 0.2, g: 0.1, shape: "triangle" }, { f: PENTA[i] * 2, d: 0.1, g: 0.025 }], o(760 + i * 110, 1, 0.3));
    slap(t, 760 + i * 110, 0.35, 1.2);
  }
  pop(18.18, 1.3, 540, 0.8);
  // DRAW. GUESS. CHAOS.
  slap(18.8, 560, 1);
  m.tone(18.8, [{ f: 659.25, d: 0.22, g: 0.1, shape: "triangle" }], o(560, 1, 0.3));
  slap(18.96, 960, 1);
  m.tone(18.96, [{ f: 783.99, d: 0.22, g: 0.1, shape: "triangle" }], o(960, 1, 0.3));
  stamp(19.12, 1360, 0.9);
  m.tone(19.12, [{ f: 1046.5, d: 0.4, g: 0.12, shape: "triangle" }, { f: 2093, d: 0.3, g: 0.03 }], o(1360, 1, 0.35));
  sparkle(19.12, 1360, 0.04);
}

/* ================================================================ mastering */

function master(buf: AudioBuffer, targetRms = 0.14, ceiling = 0.89) {
  const chans = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
  const n = buf.length;
  let sum = 0;
  let count = 0;
  for (const d of chans) {
    for (let i = 0; i < n; i++) {
      if (Math.abs(d[i]) <= 1e-4) continue;
      sum += d[i] * d[i];
      count++;
    }
  }
  const rms = Math.sqrt(sum / Math.max(1, count));
  const makeup = rms > 0 ? Math.min(12, targetRms / rms) : 1;

  // gain each sample needs so the loudest channel stays under the ceiling
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let p = 0;
    for (const d of chans) p = Math.max(p, Math.abs(d[i] * makeup));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  // look ahead 5ms (take the minimum over the window), then release smoothly over ~80ms
  const look = Math.floor(0.005 * SR);
  const rel = Math.exp(-1 / (0.08 * SR));
  const g = new Float32Array(n);
  let cur = 1;
  for (let i = n - 1, win: number[] = []; i >= 0; i--) {
    // monotonic deque for the sliding minimum of need[i .. i+look]
    while (win.length && need[win[win.length - 1]] >= need[i]) win.pop();
    win.push(i);
    while (win[0] > i + look) win.shift();
    g[i] = need[win[0]];
  }
  for (let i = 0; i < n; i++) {
    // attack is instant (the look-ahead already saw it coming); release glides back up
    cur = g[i] < cur ? g[i] : g[i] - (g[i] - cur) * rel;
    g[i] = cur;
  }
  const fade = Math.floor(0.12 * SR);
  for (const d of chans) {
    for (let i = 0; i < n; i++) {
      const tail = n - i < fade ? (n - i) / fade : 1;
      d[i] = Math.max(-ceiling, Math.min(ceiling, d[i] * makeup * g[i] * tail));
    }
  }
}

export interface ScoreParts {
  music?: boolean;
  sfx?: boolean;
  /** skip mastering (for checking stem balance) */
  raw?: boolean;
}

/** Render the full soundtrack. Pure: the same buffer every time. */
export async function renderScore(parts: ScoreParts = {}): Promise<AudioBuffer> {
  const { music: withMusic = true, sfx: withSfx = true, raw = false } = parts;
  const m = new Mix();
  if (withMusic) music(m);
  if (withSfx) sfx(m);
  const buf = await m.ctx.startRendering();
  if (!raw) master(buf);
  return buf;
}
