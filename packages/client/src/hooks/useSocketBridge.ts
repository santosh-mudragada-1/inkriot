import { useEffect, useRef } from "react";
import type { GuessMessage, ReactionEvent, RoomSnapshot, ScorePopup } from "@inkriot/shared";
import { socket } from "../lib/socket";
import { useGameStore } from "../store/useGameStore";
import { audio } from "../lib/audio/AudioManager";

function revealedLetterCount(pattern: (string | null)[] | null): number {
  if (!pattern) return 0;
  return pattern.filter((c) => c && c !== " ").length;
}

export function useSocketBridge() {
  const prevPlayerCount = useRef<number | null>(null);
  const prevHintCount = useRef<number>(0);

  useEffect(() => {
    const store = useGameStore.getState;

    const onConnect = () => useGameStore.setState({ connected: true });
    const onDisconnect = () => useGameStore.setState({ connected: false });

    const onRoomState = (snapshot: RoomSnapshot) => {
      if (prevPlayerCount.current !== null) {
        if (snapshot.players.length > prevPlayerCount.current) audio.playJoin();
        else if (snapshot.players.length < prevPlayerCount.current) audio.playLeave();
      }
      prevPlayerCount.current = snapshot.players.length;

      const hintCount = revealedLetterCount(snapshot.hintPattern);
      if (snapshot.phase === "DRAWING" && hintCount > prevHintCount.current) audio.playHintReveal();
      prevHintCount.current = snapshot.phase === "DRAWING" ? hintCount : 0;

      store().setRoom(snapshot);
    };

    const onGuessAdded = (message: GuessMessage) => {
      store().addGuess(message);
      if (message.correct) {
        audio.playCorrect();
      } else if (message.systemType) {
        // system messages (join/leave/info) — no sfx here, handled by player-count diff
      } else if (message.playerId === store().selfId) {
        if (message.close) audio.playClose();
        else audio.playWrong();
      }
    };

    const onScorePopup = (popup: ScorePopup) => {
      store().addScorePopup(popup);
      setTimeout(() => store().removeScorePopup(popup.id), 1400);
    };

    const onReaction = (event: ReactionEvent) => {
      store().addReaction(event);
      audio.playReaction();
      setTimeout(() => store().removeReaction(event.id), 2200);
    };

    const onError = (message: string) => store().setError(message);
    const onKicked = (reason: string) => store().setError(reason);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_state", onRoomState);
    socket.on("guess_added", onGuessAdded);
    socket.on("score_popup", onScorePopup);
    socket.on("reaction", onReaction);
    socket.on("error_message", onError);
    socket.on("kicked", onKicked);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_state", onRoomState);
      socket.off("guess_added", onGuessAdded);
      socket.off("score_popup", onScorePopup);
      socket.off("reaction", onReaction);
      socket.off("error_message", onError);
      socket.off("kicked", onKicked);
    };
  }, []);
}
