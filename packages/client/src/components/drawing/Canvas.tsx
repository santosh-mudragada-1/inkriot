import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { nanoid } from "nanoid";
import type { DrawOp, Point } from "@inkriot/shared";
import { socket } from "../../lib/socket";
import { CanvasEngine } from "../../lib/canvasEngine";
import { pointerPosition } from "../../lib/pointerPosition";
import { useGameStore } from "../../store/useGameStore";
import { useToolStore } from "../../store/useToolStore";
import { audio } from "../../lib/audio/AudioManager";
import "./Canvas.css";

export interface CanvasHandle {
  undo: () => void;
  clear: () => void;
}

const TOOL_SIZES: Record<string, number> = { pencil: 5, eraser: 26 };

export const Canvas = forwardRef<CanvasHandle, { isArtist: boolean; active: boolean }>(function Canvas(
  { isArtist, active },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  const drawingRef = useRef(false);
  const strokeIdRef = useRef<string | null>(null);
  const pendingPointRef = useRef<Point | null>(null);
  const rafRef = useRef<number | null>(null);

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
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Reset canvas whenever a fresh round begins
  const phase = useGameStore((s) => s.room?.phase);
  const round = useGameStore((s) => s.room?.round);
  const artistId = useGameStore((s) => s.room?.artistId);
  useEffect(() => {
    if (phase === "WORD_SELECTION") engineRef.current?.reset();
  }, [round, artistId, phase]);

  // Remote draw ops
  useEffect(() => {
    const onOp = (op: DrawOp) => engineRef.current?.commit(op);
    const onHistory = (ops: DrawOp[]) => engineRef.current?.loadHistory(ops);
    socket.on("draw_op", onOp);
    socket.on("canvas_history", onHistory);
    return () => {
      socket.off("draw_op", onOp);
      socket.off("canvas_history", onHistory);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    undo: () => {
      const engine = engineRef.current;
      if (!engine) return;
      const remaining = engine.undoLastStroke();
      socket.emit("draw_op", { type: "clear" });
      for (const op of remaining) socket.emit("draw_op", op);
    },
    clear: () => {
      engineRef.current?.reset();
      socket.emit("draw_op", { type: "clear" });
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
    const { tool, color } = useToolStore.getState();
    const size = TOOL_SIZES[tool] ?? 5;
    const point = toPoint(e);
    if (!point) return;
    (e.target as Element).setPointerCapture(e.pointerId);

    if (tool === "fill") {
      emit({ type: "fill", color, point });
      audio.playFill();
      return;
    }

    const strokeId = nanoid(8);
    strokeIdRef.current = strokeId;
    drawingRef.current = true;
    emit({ type: "start", strokeId, tool, color, size, point });
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
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const strokeId = strokeIdRef.current;
    strokeIdRef.current = null;
    if (strokeId) {
      engineRef.current?.commit({ type: "end", strokeId });
      socket.emit("draw_op", { type: "end", strokeId });
    }
  };

  const tool = useToolStore((s) => s.tool);
  const color = useToolStore((s) => s.color);

  const showLiveCursor = isArtist && active && tool !== "fill";
  const cursorSize = tool === "pencil" ? 8 : TOOL_SIZES[tool] ?? 20;

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
      className="canvas-frame"
      data-drawing-canvas
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
      />
      {showLiveCursor && (
        <div
          ref={cursorDotRef}
          className={`canvas-tool-cursor tool-${tool}`}
          style={{
            width: cursorSize,
            height: cursorSize,
            background: tool === "eraser" ? "transparent" : color,
            borderColor: tool === "eraser" ? "var(--color-ink-faint)" : "transparent",
          }}
        />
      )}
    </div>
  );
});
