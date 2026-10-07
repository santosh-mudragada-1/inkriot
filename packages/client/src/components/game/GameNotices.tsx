import { useGameStore } from "../../store/useGameStore";
import { socket } from "../../lib/socket";
import "./GameNotices.css";

/** Banners above the game: you're only watching, or the artist dropped offline and guessers can vote to skip. */
export function GameNotices() {
  const room = useGameStore((s) => s.room)!;
  const vote = room.skipVote;
  const spectating = room.viewerRole === "spectator";
  if (!vote && !spectating) return null;

  return (
    <div className="game-notices">
      {spectating && (
        <p className="game-notice is-watching">
          <span aria-hidden>👀</span> You're watching — this game started before you arrived. You'll be dealt in when the next game starts.
        </p>
      )}
      {vote && (
        <div className="game-notice is-vote">
          <span>
            <b>{vote.artistName}</b> went offline. {vote.youCanVote ? "Skip their turn?" : "Waiting for them to come back…"}
          </span>
          {vote.youCanVote &&
            (vote.youVoted ? (
              <span className="game-notice-count">
                voted · {vote.votes}/{vote.needed}
              </span>
            ) : (
              <button type="button" className="game-notice-btn" onClick={() => socket.emit("vote_skip_artist")}>
                Skip turn ({vote.votes}/{vote.needed})
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
