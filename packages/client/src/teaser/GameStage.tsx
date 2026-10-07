import { REACTIONS } from "@inkriot/shared";
import { Logo } from "../components/common/Logo";
import { DoodleAvatar } from "../components/common/DoodleAvatar";
import { ToolCursorArt } from "../components/common/CursorArt";
import { TOOL_HOTSPOT } from "../components/common/cursorHotspots";
import { Toolbar } from "../components/drawing/Toolbar";
import { useToolStore } from "../store/useToolStore";
import { CREW } from "./cast";
import { BOARD, FEED, FLOATERS, PICKED, TIMER_CIRC, TIMER_R, WORD_CHOICES } from "./script";
import "../components/game/GameScreen.css";
import "../components/game/RoundHeader.css";
import "../components/game/HintWord.css";
import "../components/game/WordSelectOverlay.css";
import "../components/game/ComboStamp.css";
import "../components/drawing/Canvas.css";
import "../components/drawing/Toolbar.css";
import "../components/leaderboard/Leaderboard.css";
import "../components/chat/GuessFeed.css";
import "../components/chat/GuessInput.css";
import "../components/chat/ReactionBar.css";
import "../components/chat/FloatingReactions.css";

/**
 * The real game screen, artist's view, mid-round. This is GameScreen's own markup and
 * CSS; the store-bound containers (header, scoreboard, chat) are laid out with their
 * real class names and fed the film's script instead of a socket. The Toolbar is the
 * real component, driven through the real tool store.
 */

const noop = () => {};

export function GameStage() {
  const color = useToolStore((s) => s.color);
  const tool = useToolStore((s) => s.tool);

  return (
    <div className="game-screen is-artist">
      <header className="round-header">
        <div className="rh-left">
          <Logo size="sm" />
          <div className="rh-round">
            <span className="rh-label hand">round</span>
            <span className="rh-pips" aria-label="Round 2 of 3">
              <span className="rh-pip done" />
              <span className="rh-pip now" />
              <span className="rh-pip" />
            </span>
          </div>
        </div>

        <div className="rh-word teaser-rh-word">
          <span className="rh-choosing" data-part="choosing">
            <DoodleAvatar avatar={CREW.nova.avatar} size={34} crop="bust" />
            <span className="hand">your turn — pick a word!</span>
          </span>
          <span className="teaser-drawthis" data-part="drawthis">
            <span className="rh-word-label hand" data-part="drawthis-label">
              draw this:
            </span>
            <span className="rh-artist-word diff-easy" data-part="drawthis-word">
              {WORD_CHOICES[PICKED]}
            </span>
          </span>
        </div>

        <div className="rh-right">
          <div className="rh-timer" data-part="timer">
            <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden>
              <circle cx="30" cy="30" r={TIMER_R} fill="var(--color-bg-raised)" stroke="var(--color-ink)" strokeWidth="3" />
              <circle data-part="timer-arc" cx="30" cy="30" r={TIMER_R} fill="none" stroke="var(--color-mint)" strokeWidth="7" strokeDasharray={TIMER_CIRC} strokeDashoffset={0} transform="rotate(-90 30 30)" />
            </svg>
            <span className="rh-timer-num" data-part="timer-num">
              ·
            </span>
          </div>
        </div>
      </header>

      <div className="game-body">
        <aside className="game-panel panel-left">
          <div className="leaderboard">
            <h3 className="leaderboard-title">Scoreboard</h3>
            <div className="leaderboard-list">
              {BOARD.map((p, i) => (
                <div key={p.id} className={`lb-row ${p.self ? "is-self" : ""} ${p.artist ? "is-artist" : ""}`} data-row={p.id}>
                  <span className="lb-rank" data-part="rank">
                    {["🥇", "🥈", "🥉"][i] ?? i + 1}
                  </span>
                  <span className="avatar-disc lb-avatar">
                    <DoodleAvatar avatar={p.avatar} size={36} crop="bust" />
                  </span>
                  <span className="lb-name">
                    <span className="lb-name-text">
                      {p.name}
                      {p.self && <em> (you)</em>}
                    </span>
                    <span className="lb-badges">
                      {p.artist && <span className="lb-chip chip-draw">✏️ drawing</span>}
                      {!p.artist && p.gain > 0 && (
                        <span className="lb-chip chip-got" data-part="got">
                          ✓ got it
                        </span>
                      )}
                      {p.id === "mia" && (
                        <span className="lb-chip chip-fire" data-part="fire">
                          🔥×3
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="lb-score" data-part="score">
                    {p.score}
                  </span>
                  {p.gain > 0 && (
                    <span className="lb-popup" data-part="popup">
                      +{p.gain}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="game-center">
          <div className="canvas-wrap">
            <div className="canvas-frame canvas-game" data-part="frame">
              <canvas className="draw-canvas" data-part="canvas" />
              <div className={`canvas-tool-cursor visible tool-${tool}`} data-part="toolcursor">
                <span className="tool-cursor-ring" data-part="ring" />
                <span className="tool-cursor-art" style={{ left: -TOOL_HOTSPOT.x, top: -TOOL_HOTSPOT.y }} data-part="toolart">
                  <ToolCursorArt tool={tool} color={color} />
                </span>
              </div>
            </div>

            <div className="floating-reactions" aria-hidden>
              {FLOATERS.map((f, i) => (
                <div key={i} className="floating-reaction-anchor" style={{ left: `${f.left}%` }}>
                  <span className="floating-reaction" style={{ fontSize: 44 }} data-floater={i}>
                    {f.emoji}
                    <span className="floating-reaction-name" style={{ background: CREW[f.who].color }}>
                      {CREW[f.who].name}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="combo-layer">
              <div className="combo-stamp" style={{ ["--stamp" as string]: "var(--color-sky)" }} data-part="stamp">
                <span className="combo-headline">ARTIST BONUS</span>
                <span className="combo-points">+360</span>
                <span className="combo-sub hand">people got your drawing!</span>
              </div>
            </div>

            <div className="overlay-scrim" data-part="scrim">
              <div className="word-select">
                <p className="word-select-hint" data-part="pick-hint">
                  Pick one to draw
                </p>
                <div className="word-cards">
                  {WORD_CHOICES.map((w, i) => (
                    <span key={w} className="teaser-card-fly" data-cardfly={i}>
                      <span className="word-card diff-easy" data-card={i}>
                        <span className="word-card-word">{w}</span>
                        <span className="word-card-meta">{w.length} letters</span>
                      </span>
                    </span>
                  ))}
                </div>
                <p className="word-select-timer hand" data-part="autopick">
                  auto-picks in 9s
                </p>
              </div>
            </div>
          </div>
          <div className="toolbar-dock" data-part="dock">
            <Toolbar onUndo={noop} onClear={noop} />
          </div>
        </div>

        <aside className="game-panel panel-right">
          <div className="chat-head">
            <h3>Guesses</h3>
            <span className="hand">type fast!</span>
          </div>
          <div className="guess-feed" role="log">
            {FEED.map((f) => {
              if (f.system)
                return (
                  <div key={f.id} className="guess-line is-system" data-line={f.id}>
                    {f.system}
                  </div>
                );
              const who = CREW[f.who!];
              if (f.correct)
                return (
                  <div key={f.id} className="guess-line is-correct" data-line={f.id}>
                    <span className="correct-check">✓</span>
                    <span>
                      <b>{who.name}</b> got it!
                    </span>
                  </div>
                );
              return (
                <div key={f.id} className={`guess-line ${f.close ? "is-close" : ""}`} style={{ ["--pc" as string]: who.color }} data-line={f.id}>
                  <b className="guess-name">{who.name}</b>
                  <span className="guess-text">{f.text}</span>
                  {f.close && <em className="close-hint">so close!</em>}
                </div>
              );
            })}
          </div>
          <div className="reaction-bar-wrap">
            <span className="reaction-hint hand">react!</span>
            <div className="reaction-bar">
              {REACTIONS.map((e) => (
                <button key={e} type="button" className="reaction-btn" tabIndex={-1}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="guess-input-row">
            <div className="guess-input-wrap">
              <input className="guess-input" placeholder="You're drawing — no peeking in chat 😉" disabled tabIndex={-1} />
              <button type="button" className="guess-send" disabled tabIndex={-1}>
                ➜
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
