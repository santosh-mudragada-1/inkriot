import gsap from "gsap";
import { DURATION } from "./choreography";
import { renderScore } from "./score";

const MUTE_KEY = "inkriot:teaser-muted";

/** Plays the pre-rendered soundtrack from any offset and reports where playback is. */
class Soundtrack {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private src: AudioBufferSourceNode | null = null;
  private startCtx = 0;
  private startOffset = 0;
  buffer: AudioBuffer | null = null;
  readonly ready: Promise<void>;

  constructor() {
    this.ready = renderScore().then((b) => {
      this.buffer = b;
    });
  }

  /** Create/resume the AudioContext. Browsers only allow this inside a user gesture. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor({ latencyHint: "interactive" });
      this.out = this.ctx.createGain();
      this.out.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get canPlay() {
    return !!this.ctx && this.ctx.state === "running" && !!this.buffer;
  }

  start(offset: number) {
    this.stop();
    if (!this.ctx || !this.out || !this.buffer) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.out);
    // a 12ms fade-in so starting mid-sound never clicks
    this.out.gain.cancelScheduledValues(this.ctx.currentTime);
    this.out.gain.setValueAtTime(0, this.ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.012);
    src.start(0, Math.max(0, Math.min(offset, this.buffer.duration - 0.001)));
    this.src = src;
    this.startCtx = this.ctx.currentTime;
    this.startOffset = offset;
    return true;
  }

  stop() {
    if (!this.src) return;
    try {
      this.src.stop();
    } catch {
      /* already ended */
    }
    this.src.disconnect();
    this.src = null;
  }

  /** Film time being *heard* right now (output latency compensated), or null if silent. */
  clock(): number | null {
    if (!this.src || !this.ctx) return null;
    const latency = (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
    return this.startOffset + (this.ctx.currentTime - this.startCtx) - latency;
  }

  get latency() {
    return this.ctx ? (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0) : 0;
  }

  close() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }
}

/**
 * Play / pause / seek for picture + sound together. With sound on, the audio is the
 * master clock and the timeline follows it (smoothed against performance.now so motion
 * stays silky); muted, or before the browser allows audio, the timeline runs itself.
 */
export class Transport {
  playing = false;
  muted: boolean;
  soundReady = false;
  private mode: "audio" | "timeline" = "timeline";
  private anchorPerf = 0;
  private anchorT = 0;
  private lastT = 0;
  private listeners = new Set<() => void>();
  private sound = new Soundtrack();
  private tl: gsap.core.Timeline;
  private render: (t: number) => void;

  constructor(tl: gsap.core.Timeline, render: (t: number) => void) {
    this.tl = tl;
    this.render = render;
    let muted = false;
    try {
      muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    this.muted = muted;
    tl.eventCallback("onComplete", () => {
      if (this.mode === "timeline") this.halt();
    });
    gsap.ticker.add(this.tick);
    void this.sound.ready.then(() => {
      this.soundReady = true;
      // sound finished rendering mid-playback: bring it in at the playhead
      if (this.playing) this.engage();
      this.emit();
    });
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    for (const fn of this.listeners) fn();
  }

  get time() {
    return this.tl.time();
  }
  /** True when sound is wanted but the browser hasn't allowed it yet. */
  get needsGesture() {
    return !this.muted && this.soundReady && !this.sound.canPlay;
  }

  /** Call from any user gesture: unlocks audio and, if we're playing, brings sound in. */
  gesture() {
    if (this.muted) return;
    const was = this.sound.canPlay;
    this.sound.unlock();
    // resume() is async; re-engage once it's actually running
    if (!was) {
      const check = () => {
        if (this.sound.canPlay) {
          if (this.playing) this.engage();
          this.emit();
        } else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    }
  }

  play() {
    if (this.tl.time() >= DURATION - 0.01) this.seekTo(0);
    this.playing = true;
    this.engage();
    this.emit();
  }

  pause() {
    this.halt();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  restart() {
    this.seekTo(0);
    this.play();
  }

  seek(t: number) {
    this.seekTo(t);
    if (this.playing) this.engage();
    this.emit();
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (!m) this.sound.unlock();
    if (this.playing) this.engage();
    this.emit();
  }

  /** The rendered soundtrack as a 16-bit WAV, for laying under a screen recording. */
  async wav(): Promise<Blob> {
    await this.sound.ready;
    return toWav(this.sound.buffer!);
  }

  destroy() {
    gsap.ticker.remove(this.tick);
    this.sound.close();
    this.listeners.clear();
  }

  private seekTo(t: number) {
    const tt = Math.max(0, Math.min(DURATION, t));
    this.tl.seek(tt);
    this.render(tt);
    this.lastT = tt;
  }

  private halt() {
    this.playing = false;
    this.tl.pause();
    this.sound.stop();
    this.mode = "timeline";
    this.emit();
  }

  /** (Re)start playback from the playhead in whichever mode is available. */
  private engage() {
    const from = this.tl.time();
    this.sound.stop();
    if (!this.muted && this.sound.canPlay && this.sound.start(from)) {
      this.mode = "audio";
      this.tl.pause();
      this.anchorPerf = performance.now();
      this.anchorT = from - this.sound.latency;
      this.lastT = from;
    } else {
      this.mode = "timeline";
      this.tl.play();
    }
  }

  private tick = () => {
    if (!this.playing || this.mode !== "audio") return;
    const now = performance.now();
    let t = this.anchorT + (now - this.anchorPerf) / 1000;
    const heard = this.sound.clock();
    if (heard !== null) {
      // phase-lock the smooth clock to the audio clock
      const drift = heard - t;
      if (Math.abs(drift) > 0.08) this.anchorT += drift;
      else this.anchorT += drift * 0.08;
      t = this.anchorT + (now - this.anchorPerf) / 1000;
    }
    t = Math.max(this.lastT, t);
    this.lastT = t;
    if (t >= DURATION) {
      this.tl.seek(DURATION);
      this.render(DURATION);
      this.halt();
      return;
    }
    this.tl.time(t); // renders the (paused) timeline, which calls render(t)
  };
}

function toWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels;
  const len = buf.length;
  const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  data.setUint32(4, 36 + len * ch * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, ch, true);
  data.setUint32(24, buf.sampleRate, true);
  data.setUint32(28, buf.sampleRate * ch * 2, true);
  data.setUint16(32, ch * 2, true);
  data.setUint16(34, 16, true);
  str(36, "data");
  data.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i]));
      data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([data], { type: "audio/wav" });
}
