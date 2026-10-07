import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { DoodleHand, ToolCursorArt } from "../components/common/CursorArt";
import { FILLS, LETTERS, TILTS } from "../components/common/logoLetters";
import { useToolStore } from "../store/useToolStore";
import { CHAOS, ORGANIZED } from "./cast";
import { buildTeaser, DURATION, H, SCENES, W, type Teaser } from "./choreography";
import { Transport } from "./soundtrack";
import { GameStage } from "./GameStage";
import { BrandMark, DoodleArrowStroke, ItemBody, type Item } from "./pieces";
import { HEX } from "./palette";
import "../components/common/Logo.css";
import "../components/common/Button.css";
import "../components/common/SoundToggle.css";
import "../pages/LandingPage.css";
import "./Teaser.css";

/** The brand tagline, exactly as the landing page headline sets it. */
const TAGLINE = [
  { word: "DRAW.", color: "var(--color-sun)" },
  { word: "GUESS.", color: "var(--color-gum)" },
  { word: "CHAOS.", color: "var(--color-tomato)" },
];

function Piece({ it, attr }: { it: Item; attr: "data-item" | "data-org" }) {
  return (
    <div className="ci" style={{ left: it.x, top: it.y }} {...{ [attr]: it.id }}>
      <div className="ci-sweep">
        <div className="ci-body">
          <div className="ci-inner">
            <ItemBody body={it.body} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Everything on the stage, rendered once. After mount it's driven entirely by the GSAP
 * timeline + render(t) in choreography.ts; React only re-renders the real Toolbar and
 * the tool cursor when the film changes tools through the real tool store.
 */
const Stage = memo(function Stage() {
  return (
    <>
      <div className="world" data-layer="world">
        <div className="paper" data-layer="paper" />

        {/* paint that shows as a coloured fringe around the revealed product */}
        <svg className="paint paint-rims" width={W} height={H} aria-hidden>
          <path data-rim="0" fill={HEX.tomato} />
          <path data-rim="1" fill={HEX.sun} />
          <path data-rim="2" fill={HEX.grape} />
        </svg>

        {/* scene 5: arrows filing everything into the product */}
        {[
          { x: -250, y: 540, r: 0 },
          { x: 2170, y: 540, r: 180 },
          { x: 960, y: -190, r: 90 },
          { x: 960, y: 1270, r: -90 },
        ].map((a, i) => (
          <div key={i} className="org-arrow" data-orgarrow={i} style={{ left: a.x, top: a.y }}>
            <div style={{ transform: `translate(-50%, -50%) rotate(${a.r}deg) scale(1.9)` }}>
              <DoodleArrowStroke color="var(--color-ink)" length={170} />
            </div>
          </div>
        ))}

        <div className="ui-conv" data-layer="uiconv">
          <div className="ui-bob" data-layer="uibob">
            <div className="teaser-ui" data-layer="ui">
              <GameStage />
              <div className="teaser-pickring" data-part="pickring">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden>
                  <path
                    pathLength={1}
                    d="M52 4C24 3 4 20 5 50c1 30 26 46 50 45 26-1 42-20 41-46C95 22 74 5 44 8 30 10 18 17 12 26"
                    fill="none"
                    stroke="var(--color-tomato)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div className="teaser-glove" data-part="glove">
                <DoodleHand />
              </div>
            </div>
            <div className="ui-frame" data-layer="uiframe" />
            <span className="tape ui-tape" data-uitape="0" style={{ left: -70, top: -30, rotate: "-32deg", ["--tape" as string]: "var(--color-gum)" }} />
            <span className="tape ui-tape" data-uitape="1" style={{ left: 1740, top: 1040, rotate: "-28deg", ["--tape" as string]: "var(--color-sun)" }} />
          </div>
        </div>

        <div className="chaos-layer">
          {CHAOS.map((it) => (
            <Piece key={it.id} it={it} attr="data-item" />
          ))}
          <div className="pen1" data-part="pen1">
            <ToolCursorArt tool="pencil" color={HEX.ink} />
          </div>
        </div>

        {/* dry-brush streaks over the fresh paint */}
        <svg className="paint paint-top" data-layer="paint-top" width={W} height={H} aria-hidden>
          {[HEX.tomato, HEX.sun, HEX.grape].map((c, k) => (
            <g key={k} data-bristles={k} stroke={c} fill="none" strokeLinecap="round" strokeLinejoin="round">
              {[7, 4, 10, 6, 9, 5].map((w, j) => (
                <path key={j} strokeWidth={w} opacity={j % 2 ? 0.75 : 0.95} />
              ))}
            </g>
          ))}
        </svg>

        <div className="big-brush" data-part="brush">
          {[HEX.tomato, HEX.sun, HEX.grape].map((c, k) => (
            <div key={k} className="big-brush-art" data-tip={k}>
              <ToolCursorArt tool="brush" color={c} />
            </div>
          ))}
        </div>

        <div className="org-layer">
          {ORGANIZED.map((it) => (
            <Piece key={it.id} it={it} attr="data-org" />
          ))}
        </div>
      </div>

      <canvas className="ink-layer" data-layer="ink" />

      <div className="titles">
        {[0, 1, 2].map((i) => (
          <svg key={i} className="final-scribble" data-part="finalscribble" viewBox="-300 -300 600 600" width="600" height="600" aria-hidden>
            <path
              pathLength={1}
              d={
                ["M-240 -20C-200-200 150-230 230-60 300 90 120 240-60 220-220 200-260 60-160-40", "M200 -150C60-260-200-160-190 40-180 220 80 260 200 120 280 30 230-90 120-110", "M-120 -210C80-250 260-80 190 110 120 280-150 250-210 90-250-20-160-120-60-120"][i]
              }
              fill="none"
              stroke={[HEX.ink, HEX.tomato, HEX.grape][i]}
              strokeWidth={[14, 10, 8][i]}
              strokeLinecap="round"
            />
          </svg>
        ))}
        <div className="final-dot" data-part="finaldot" />
        <div className="final-lockup">
          <div className="final-mark" data-part="mark">
            <BrandMark size={196} />
          </div>
          <span className="logo teaser-logo" role="img" aria-label="INKRIOT">
            {LETTERS.map((ch, i) => (
              <span key={i} className="logo-letter" style={{ background: FILLS[i], rotate: `${TILTS[i]}deg` }} aria-hidden>
                {ch}
              </span>
            ))}
          </span>
        </div>
        <div className="teaser-tagline">
          {TAGLINE.map((w) => (
            <span key={w.word} className="headline-sticker" style={{ ["--sticker" as string]: w.color }}>
              {w.word}
            </span>
          ))}
        </div>
      </div>

      <div className="grain" aria-hidden />
    </>
  );
});

function fmt(t: number) {
  return t.toFixed(2).padStart(5, "0");
}

/** Re-render on transport changes and on every frame (for the playhead). */
function useTransport(transport: Transport) {
  const [, force] = useState(0);
  useEffect(() => {
    const bump = () => force((n) => n + 1);
    const off = transport.subscribe(bump);
    gsap.ticker.add(bump);
    return () => {
      off();
      gsap.ticker.remove(bump);
    };
  }, [transport]);
}

function SpeakerIcon({ on }: { on: boolean }) {
  // the game's own sound-toggle glyph (components/common/SoundToggle)
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {on ? (
        <>
          <path d="M15.5 9c1 .9 1.5 1.9 1.5 3s-.5 2.1-1.5 3" />
          <path d="M18.5 6.5c1.7 1.5 2.5 3.4 2.5 5.5s-.8 4-2.5 5.5" />
        </>
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="var(--color-tomato)" strokeWidth="3" />
      )}
    </svg>
  );
}

function Controls({ transport }: { transport: Transport }) {
  useTransport(transport);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef<{ resume: boolean } | null>(null);
  const time = transport.time;
  const playing = transport.playing;

  const fromPointer = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * DURATION;
  };

  const downloadAudio = async () => {
    const blob = await transport.wav();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inkriot-teaser-soundtrack.wav";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const scene = [...SCENES].reverse().find((s) => time >= s.t)!;
  const soundOn = !transport.muted;

  return (
    <div className="teaser-controls">
      <div className="tc-buttons">
        {playing ? (
          <button type="button" className="btn btn-secondary btn-md tc-btn" onClick={(e) => (transport.pause(), e.currentTarget.blur())} aria-label="Pause">
            ❚❚ <span>Pause</span>
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-md tc-btn" onClick={(e) => (transport.play(), e.currentTarget.blur())} aria-label="Play">
            ▶ <span>Play</span>
          </button>
        )}
        <button type="button" className="btn btn-accent2 btn-md tc-btn" onClick={(e) => (transport.restart(), e.currentTarget.blur())} aria-label="Restart">
          ↺ <span>Restart</span>
        </button>
        <button
          type="button"
          className={`sound-toggle tc-sound ${soundOn ? "is-on" : ""}`}
          aria-label={soundOn ? "Mute (M)" : "Unmute (M)"}
          aria-pressed={soundOn}
          title={soundOn ? "Sound on — M to mute" : "Sound off — M to unmute"}
          onClick={(e) => (transport.setMuted(soundOn), e.currentTarget.blur())}
        >
          <SpeakerIcon on={soundOn} />
        </button>
        <button
          type="button"
          className="tc-wav hand"
          disabled={!transport.soundReady}
          title="Download the soundtrack (.wav) — lay it under a screen recording of ?clean"
          onClick={(e) => {
            e.currentTarget.blur();
            void downloadAudio();
          }}
        >
          ↓ .wav
        </button>
      </div>

      <div className="tc-timeline">
        <div
          ref={trackRef}
          className="tc-track"
          role="slider"
          aria-label="Timeline"
          aria-valuemin={0}
          aria-valuemax={DURATION}
          aria-valuenow={Number(time.toFixed(2))}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubbing.current = { resume: transport.playing };
            transport.pause();
            transport.seek(fromPointer(e.clientX));
          }}
          onPointerMove={(e) => scrubbing.current && transport.seek(fromPointer(e.clientX))}
          onPointerUp={() => {
            if (scrubbing.current?.resume) transport.play();
            scrubbing.current = null;
          }}
        >
          <div className="tc-fill" style={{ width: `${(time / DURATION) * 100}%` }} />
          {SCENES.slice(1).map((s) => (
            <span key={s.t} className="tc-tick" style={{ left: `${(s.t / DURATION) * 100}%` }} />
          ))}
          <span className="tc-knob" style={{ left: `${(time / DURATION) * 100}%` }} />
        </div>
        <div className="tc-scenes">
          {SCENES.map((s, i) => (
            <button
              key={s.t}
              type="button"
              className={`tc-scene hand ${s === scene ? "is-now" : ""}`}
              style={{ left: `${(s.t / DURATION) * 100}%`, width: `${(((SCENES[i + 1]?.t ?? DURATION) - s.t) / DURATION) * 100}%` }}
              onClick={(e) => (transport.seek(s.t), e.currentTarget.blur())}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tc-time" aria-live="off">
        <b>{fmt(time)}</b>
        <span>/ {fmt(DURATION)}s</span>
        {!transport.soundReady ? <em className="tc-note hand">mixing sound…</em> : transport.needsGesture ? <em className="tc-note hand is-nudge">click for sound ♪</em> : null}
      </div>
    </div>
  );
}

export default function TeaserPage() {
  const params = new URLSearchParams(window.location.search);
  const clean = params.has("clean");
  // ?render: frame-by-frame export — wall-clock CSS transitions/animations are frozen so
  // every captured frame is exactly the timeline's frame
  const renderMode = params.has("render");
  const startAt = params.has("t") ? Number(params.get("t")) : null;
  const autoplay = params.get("autoplay") !== "0" && startAt === null;

  const rootRef = useRef<HTMLDivElement>(null);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [transport, setTransport] = useState<Transport | null>(null);
  const [scale, setScale] = useState(0.5);

  // fit the 1920×1080 stage into the window, leaving room for the controls
  useLayoutEffect(() => {
    const fit = () => {
      const pad = clean ? 0 : 24;
      const controls = clean ? 0 : 118;
      setScale(Math.min((window.innerWidth - pad * 2) / W, (window.innerHeight - controls - pad * 2) / H));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [clean]);

  // the ink canvas renders at the stage's on-screen resolution
  useEffect(() => {
    const c = rootRef.current?.querySelector<HTMLCanvasElement>("[data-layer=ink]");
    if (!c) return;
    const k = Math.min(2, Math.max(0.5, scale * (window.devicePixelRatio || 1)));
    c.width = Math.round(W * k);
    c.height = Math.round(H * k);
    teaser?.render(teaser.tl.time());
  }, [scale, teaser]);

  useEffect(() => {
    let cancelled = false;
    let built: Teaser | null = null;
    let tr: Transport | null = null;
    const prevTool = useToolStore.getState();
    const prevTitle = document.title;
    document.title = "INKRIOT — teaser";

    const fonts = ["400 100px 'Bagel Fat One'", "400 100px 'Gochi Hand'", "900 16px Nunito", "800 16px Nunito", "700 16px Nunito", "600 16px Nunito"];
    Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => null)))
      .then(() => document.fonts.ready)
      .then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      .then(() => {
        if (cancelled || !rootRef.current) return;
        built = buildTeaser(rootRef.current, {
          setTool: (tool, color) => useToolStore.setState({ tool, color, size: 9 }),
        });
        tr = new Transport(built.tl, built.render);
        const start = startAt ?? 0;
        tr.seek(start);
        if (autoplay) tr.play();
        const T = tr;
        (window as unknown as { __inkriotTeaser: unknown }).__inkriotTeaser = {
          duration: DURATION,
          seek: (t: number) => {
            T.pause();
            T.seek(t);
          },
          play: () => T.play(),
          pause: () => T.pause(),
          time: () => T.time,
          wav: () => T.wav(),
        };
        setTransport(tr);
        setTeaser(built);
      });

    return () => {
      cancelled = true;
      tr?.destroy();
      built?.destroy();
      useToolStore.setState({ tool: prevTool.tool, color: prevTool.color, size: prevTool.size });
      document.title = prevTitle;
    };
    // built once per mount; URL params are read at mount time on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard (works in ?clean too) — and any click or key is the gesture that lets sound play.
  useEffect(() => {
    if (!transport) return;
    const onGesture = () => transport.gesture();
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        transport.toggle();
      } else if (e.key === "r" || e.key === "R") {
        transport.restart();
      } else if (e.key === "m" || e.key === "M") {
        transport.setMuted(!transport.muted);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        transport.pause();
        const step = e.shiftKey ? 1 : 1 / 30;
        transport.seek(transport.time + (e.key === "ArrowLeft" ? -step : step));
      }
    };
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [transport]);

  // Portalled to <body>: #root is an isolated stacking context, and the film has to sit
  // above the app's body-level widgets (the analytics feedback button).
  return createPortal(
    <div className={`teaser ${clean ? "is-clean" : ""} ${renderMode ? "is-render" : ""} ${teaser ? "is-ready" : ""}`}>
      <div className="teaser-screen">
        <div className="teaser-frame" style={{ width: W * scale, height: H * scale }}>
          <div className="teaser-stage" ref={rootRef} style={{ transform: `scale(${scale})` }}>
            <Stage />
          </div>
        </div>
      </div>
      {!clean && transport && <Controls transport={transport} />}
    </div>,
    document.body,
  );
}
