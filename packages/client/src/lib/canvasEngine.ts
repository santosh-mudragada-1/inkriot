import type { DrawOp, DrawTool, Point } from "@inkriot/shared";

const BG_COLOR = "#FFFFFF";

interface ActiveStroke {
  x: number;
  y: number;
  tool: DrawTool;
  color: string;
  size: number;
}

export class CanvasEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private ops: DrawOp[] = [];
  private active = new Map<string, ActiveStroke>();
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
  }

  resize(cssWidth: number, cssHeight: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = cssWidth;
    this.height = cssHeight;
    this.redrawAll();
  }

  getOps(): DrawOp[] {
    return this.ops;
  }

  loadHistory(ops: DrawOp[]) {
    this.ops = [...ops];
    this.redrawAll();
  }

  reset() {
    this.ops = [];
    this.active.clear();
    this.clearCanvas();
  }

  private clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private lineStyleFor(stroke: ActiveStroke) {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    if (stroke.tool === "eraser") {
      this.ctx.strokeStyle = BG_COLOR;
      this.ctx.lineWidth = stroke.size * 1.6;
    } else {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
      this.ctx.globalAlpha = stroke.tool === "marker" ? 0.75 : 1;
    }
  }

  /** Apply one op to the raster immediately (used both live and during replay). */
  private apply(op: DrawOp) {
    if (op.type === "clear") {
      this.clearCanvas();
      this.active.clear();
      return;
    }
    if (op.type === "fill") {
      this.floodFill(op.point, op.color);
      return;
    }
    if (op.type === "start") {
      const x = op.point.x * this.width;
      const y = op.point.y * this.height;
      this.active.set(op.strokeId, { x, y, tool: op.tool, color: op.color, size: op.size });
      const stroke = this.active.get(op.strokeId)!;
      this.lineStyleFor(stroke);
      this.ctx.beginPath();
      this.ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.tool === "eraser" ? BG_COLOR : stroke.color;
      const prevAlpha = this.ctx.globalAlpha;
      if (stroke.tool === "marker") this.ctx.globalAlpha = 0.75;
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
      return;
    }
    if (op.type === "point") {
      const stroke = this.active.get(op.strokeId);
      if (!stroke) return;
      const x = op.point.x * this.width;
      const y = op.point.y * this.height;
      this.lineStyleFor(stroke);
      this.ctx.beginPath();
      this.ctx.moveTo(stroke.x, stroke.y);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
      stroke.x = x;
      stroke.y = y;
      return;
    }
    if (op.type === "end") {
      this.active.delete(op.strokeId);
    }
  }

  /** Apply + record an op that originated locally or over the network. */
  commit(op: DrawOp) {
    if (op.type === "clear") {
      this.ops = [];
    } else {
      this.ops.push(op);
    }
    this.apply(op);
  }

  redrawAll() {
    this.clearCanvas();
    this.active.clear();
    for (const op of this.ops) this.apply(op);
  }

  undoLastStroke(): DrawOp[] {
    let lastStart = -1;
    for (let i = this.ops.length - 1; i >= 0; i--) {
      const op = this.ops[i];
      if (op.type === "start" || op.type === "fill") {
        lastStart = i;
        break;
      }
    }
    if (lastStart === -1) return this.ops;
    this.ops = this.ops.slice(0, lastStart);
    this.redrawAll();
    return this.ops;
  }

  private floodFill(point: Point, colorHex: string) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w === 0 || h === 0) return;
    const startX = Math.floor(point.x * w);
    const startY = Math.floor(point.y * h);
    if (startX < 0 || startY < 0 || startX >= w || startY >= h) return;

    const imageData = this.ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const target = getPixel(data, startX, startY, w);
    const fill = hexToRgba(colorHex);
    if (colorsMatch(target, fill, 8)) return;

    const stack: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(w * h);
    visited[startY * w + startX] = 1;

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const idx = (y * w + x) * 4;
      if (!colorsMatch(getPixelAt(data, idx), target, 40)) continue;
      data[idx] = fill[0];
      data[idx + 1] = fill[1];
      data[idx + 2] = fill[2];
      data[idx + 3] = 255;

      const neighbors: [number, number][] = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const nVisitedIdx = ny * w + nx;
        if (visited[nVisitedIdx]) continue;
        visited[nVisitedIdx] = 1;
        stack.push([nx, ny]);
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }
}

function getPixel(data: Uint8ClampedArray, x: number, y: number, w: number): [number, number, number, number] {
  const idx = (y * w + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}
function getPixelAt(data: Uint8ClampedArray, idx: number): [number, number, number, number] {
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}
function colorsMatch(a: [number, number, number, number], b: [number, number, number, number], tolerance: number) {
  return Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance && Math.abs(a[2] - b[2]) <= tolerance && Math.abs(a[3] - b[3]) <= tolerance;
}
function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
  }
  return [0, 0, 0, 255];
}
