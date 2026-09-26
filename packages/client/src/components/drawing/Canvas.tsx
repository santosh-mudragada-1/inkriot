import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { DrawOp, Point } from "@inkriot/shared";
import { socket } from "../../lib/socket";
import { CanvasEngine } from "../../lib/canvasEngine";
import { pointerPosition } from "../../lib/pointerPosition";
import { subscribeCanvasHistory } from "../../lib/canvasHistoryBuffer";
import { useGameStore } from "../../store/useGameStore";
import { useToolStore } from "../../store/useToolStore";
import { audio } from "../../lib/audio/AudioManager";
import "./Canvas.css";

export interface CanvasHandle {
  undo: () => void;
  clear: () => void;
}

interface CanvasProps {
  isArtist: boolean;
  active: boolean;
  /** "wall" is the shared lobby doodle wall: pen only, everyone draws at once. */
  mode?: "game" | "wall";
}

const REMOTE_SCRIBBLE_IDLE_MS = 140;

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas({ isArtist, active, mode = "game" }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  const drawingRef = useRef(false);
  const strokeIdRef = useRef<string | null>(null);
  const pendingPointRef = useRef<Point | null>(null);
  const lastPxRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const remoteScribbleTimer = useRef<number | null>(null);
  const remoteLast = useRef(new Map<string, Point>());
  const [canvasWidth, setCanvasWidth] = useState(800);

  // Engine setup + resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const engine = new CanvasEngine(canvas);
    engineRef.current = engine;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      engine.resize(rect.width, rect.height);
      setCanvasWidth(rect.width || 800);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => {
      ro.disconnect();
      audio.scribbleStop();
    };
  }, []);

  // Reset canvas whenever a fresh round begins
  const phase = useGameStore((s) => s.room?.phase);
  const round = useGameStore((s) => s.room?.round);
  const artistId = useGameStore((s) => s.room?.artistId);
  useEffect(() => {
    if (phase === "WORD_SELECTION") engineRef.current?.reset();
  }, [round, artistId, phase]);

  // Snapshot the finished drawing for the end-of-game gallery.
  useEffect(() => {
    if (mode !== "game" || phase !== "ROUND_REVEAL") return;
    const canvas = canvasRef.current;
    const room = useGameStore.getState().room;
    if (!canvas || !room?.revealedWord || !engineRef.current?.getOps().length) return;
    const w = 480;
    const h = Math.round((canvas.height / canvas.width) * w);
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    off.getContext("2d")?.drawImage(canvas, 0, 0, w, h);
    useGameStore.getState().addGalleryItem({
      id: `${room.round}-${room.artistId}-${room.revealedWord}`,
      word: room.revealedWord,
      artistId: room.artistId,
      image: off.toDataURL("image/jpeg", 0.82),
      guessed: room.players.filter((p) => p.id !== room.artistId && p.hasGuessedCorrectly).length,
    });
  }, [phase, mode]);

  // Remote draw ops (+ a quiet scratch so spectators can *hear* the drawing happen)
  useEffect(() => {
    const onOp = (op: DrawOp) => {
      engineRef.current?.commit(op);
      if (op.type === "start") remoteLast.current.set(op.strokeId, op.point);
      if (op.type === "point" && mode === "game") {
        const prev = remoteLast.current.get(op.strokeId);
        const rect = containerRef.current?.getBoundingClientRect();
        if (prev && rect) {
          const speed = Math.hypot((op.point.x - prev.x) * rect.width, (op.point.y - prev.y) * rect.height);
          audio.scribble(speed * 0.4);
          if (remoteScribbleTimer.current) window.clearTimeout(remoteScribbleTimer.current);
          remoteScribbleTimer.current = window.setTimeout(() => audio.scribbleStop(), REMOTE_SCRIBBLE_IDLE_MS);
        }
        remoteLast.current.set(op.strokeId, op.point);
      }
      if (op.type === "end") remoteLast.current.delete(op.strokeId);
    };
    socket.on("draw_op", onOp);
    const unsubHistory = subscribeCanvasHistory((ops) => engineRef.current?.loadHistory(ops));
    return () => {
      socket.off("draw_op", onOp);
      unsubHistory();
      if (remoteScribbleTimer.current) window.clearTimeout(remoteScribbleTimer.current);
    };
  }, [mode]);

  useImperativeHandle(ref, () => ({
    undo: () => {
      const engine = engineRef.current;
      if (!engine) return;
      const remaining = engine.undoLastStroke();
      socket.emit("draw_op", { type: "clear" });
      for (const op of remaining) socket.emit("draw_op", op);
      audio.playUndo();
    },
    clear: () => {
      engineRef.current?.reset();
      socket.emit("draw_op", { type: "clear" });
      audio.playTrash();
    },
  }));

  const toPoint = (e: PointerEvent | React.PointerEvent): Point | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const emit = (op: DrawOp) => {
    engineRef.current?.commit(op);
    socket.emit("draw_op", op);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isArtist || !active) return;
    const state = useToolStore.getState();
    const tool = mode === "wall" ? "pencil" : state.tool;
    const point = toPoint(e);
    if (!point) return;
    (e.target as Element).setPointerCapture(e.pointerId);

    if (tool === "fill") {
      emit({ type: "fill", color: state.color, point });
      audio.playFill();
      return;
    }

    const strokeId = nanoid(8);
    strokeIdRef.current = strokeId;
    drawingRef.current = true;
    lastPxRef.current = { x: e.clientX, y: e.clientY };
    emit({ type: "start", strokeId, tool, color: state.color, size: state.size, point });
    audio.playDrawStart(tool);
  };

  const flush = () => {
    rafRef.current = null;
    const point = pendingPointRef.current;
    const strokeId = strokeIdRef.current;
    if (!point || !strokeId || !drawingRef.current) return;
    emit({ type: "point", strokeId, point });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isArtist && active && drawingRef.current) {
      const point = toPoint(e);
      if (point) {
        pendingPointRef.current = point;
        if (rafRef.current === null) rafRef.current = requestAnimationFrame(flush);
      }
      const last = lastPxRef.current;
      if (last) audio.scribble(Math.hypot(e.clientX - last.x, e.clientY - last.y), useToolStore.getState().tool);
      lastPxRef.current = { x: e.clientX, y: e.clientY };
    }
    if (cursorDotRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        cursorDotRef.current.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px) translate(-50%, -50%)`;
        // The pointer is often already inside the canvas when the artist becomes active
        // (no fresh "enter" event fires in that case), so the first move must reveal it too.
        cursorDotRef.current.classList.add("visible");
      }
    }
  };

  const endStroke = () => {
    audio.scribbleStop();
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPxRef.current = null;
    const strokeId = strokeIdRef.current;
    strokeIdRef.current = null;
    if (strokeId) {
      engineRef.current?.commit({ type: "end", strokeId });
      socket.emit("draw_op", { type: "end", strokeId });
    }
  };

  const storeTool = useToolStore((s) => s.tool);
  const tool = mode === "wall" ? "pencil" : storeTool;
  const color = useToolStore((s) => s.color);
  const size = useToolStore((s) => s.size);

  const showLiveCursor = isArtist && active && tool !== "fill";
  const cursorSize = Math.max(6, size * (canvasWidth / 800));

  // Position + reveal the cursor immediately on mount using the last known pointer
  // position, rather than waiting for a pointer event that won't fire if the mouse
  // is already sitting still over the canvas when it becomes active.
  useEffect(() => {
    if (!showLiveCursor) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const el = cursorDotRef.current;
    if (!rect || !el) return;
    const { x, y } = pointerPosition;
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    if (inside) {
      el.style.transform = `translate(${x - rect.left}px, ${y - rect.top}px) translate(-50%, -50%)`;
      el.classList.add("visible");
    }
  }, [showLiveCursor]);

  return (
    <div
      ref={containerRef}
      className={`canvas-frame canvas-${mode} ${isArtist && active ? "is-live" : ""} ${tool === "fill" && isArtist && active ? "is-fill" : ""}`}
      data-drawing-canvas={isArtist && active ? "" : undefined}
      onPointerEnter={() => cursorDotRef.current?.classList.add("visible")}
      onPointerLeave={() => {
        cursorDotRef.current?.classList.remove("visible");
        endStroke();
      }}
    >
      <canvas
        ref={canvasRef}
        className={`draw-canvas ${isArtist && active ? "is-live" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      />
      {showLiveCursor && (
        <div
          ref={cursorDotRef}
          className={`canvas-tool-cursor tool-${tool}`}
          style={{
            width: cursorSize,
            height: cursorSize,
            background: tool === "eraser" ? "rgba(255,255,255,0.7)" : color,
            borderColor: tool === "eraser" ? "var(--color-ink)" : color === "#FFFFFF" ? "var(--color-ink-faint)" : "rgba(255,255,255,0.9)",
          }}
        />
      )}
    </div>
  );
});
