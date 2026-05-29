"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export const DRAW_PALETTE = [
  "#3d2c3a",
  "#ff6b9d",
  "#ff9ec4",
  "#c56bff",
  "#6bc5ff",
  "#6bffb8",
  "#ffd56b",
  "#ff8c6b",
  "#ffffff",
] as const;

export type DrawTool = "pen" | "eraser";

const MAX_UNDO = 20;
const MAX_DPR = 2;

type Point = { x: number; y: number };

function applyStrokeStyle(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  color: string,
  brushSize: number
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = brushSize;
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }
}

export function useDrawingCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  const [color, setColor] = useState<string>(DRAW_PALETTE[1]);
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [ready, setReady] = useState(false);

  const logicalSizeRef = useRef(400);
  const drawingRef = useRef(false);
  const strokeStartedRef = useRef(false);
  const hasDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<Point | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const styleRef = useRef({ tool, color, brushSize });
  const [canUndo, setCanUndo] = useState(false);

  styleRef.current = { tool, color, brushSize };

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, [canvasRef]);

  const fillWhite = useCallback(() => {
    const ctx = getContext();
    const size = logicalSizeRef.current;
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    applyStrokeStyle(ctx, styleRef.current.tool, styleRef.current.color, styleRef.current.brushSize);
  }, [getContext]);

  const captureSnapshot = useCallback((): ImageData | null => {
    const ctx = getContext();
    const size = logicalSizeRef.current;
    if (!ctx) return null;
    return ctx.getImageData(0, 0, size, size);
  }, [getContext]);

  const syncUndoState = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 1);
  }, []);

  const resetUndoHistory = useCallback(
    (snapshot?: ImageData | null) => {
      const base = snapshot ?? captureSnapshot();
      if (base) {
        undoStackRef.current = [base];
      } else {
        undoStackRef.current = [];
      }
      syncUndoState();
    },
    [captureSnapshot, syncUndoState]
  );

  const pushUndoSnapshot = useCallback(() => {
    const snapshot = captureSnapshot();
    if (!snapshot) return;
    const stack = undoStackRef.current;
    stack.push(snapshot);
    if (stack.length > MAX_UNDO) {
      stack.shift();
    }
    syncUndoState();
  }, [captureSnapshot, syncUndoState]);

  const restoreSnapshot = useCallback(
    (snapshot: ImageData) => {
      const ctx = getContext();
      if (!ctx) return;
      ctx.putImageData(snapshot, 0, 0);
      applyStrokeStyle(ctx, styleRef.current.tool, styleRef.current.color, styleRef.current.brushSize);
    },
    [getContext]
  );

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length <= 1) return;
    stack.pop();
    const previous = stack[stack.length - 1];
    if (previous) restoreSnapshot(previous);
    syncUndoState();
  }, [restoreSnapshot, syncUndoState]);

  const exportDataUrl = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/jpeg", 0.88);
  }, [canvasRef]);

  const setupCanvas = useCallback(
    (opts?: { skipUndoReset?: boolean }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      rectRef.current = rect;
      const cssSize = Math.min(rect.width || 400, 600);
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      logicalSizeRef.current = cssSize;
      canvas.width = Math.floor(cssSize * dpr);
      canvas.height = Math.floor(cssSize * dpr);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fillWhite();
      setReady(true);
      if (!opts?.skipUndoReset) {
        requestAnimationFrame(() => resetUndoHistory());
      }
    },
    [canvasRef, fillWhite, resetUndoHistory]
  );

  const refreshRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) rectRef.current = canvas.getBoundingClientRect();
  }, [canvasRef]);

  const canvasToPoint = useCallback((clientX: number, clientY: number): Point => {
    const rect = rectRef.current;
    if (!rect) return { x: 0, y: 0 };
    const scale = logicalSizeRef.current / rect.width;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale,
    };
  }, []);

  const stroke = useCallback((from: Point, to: Point) => {
    const ctx = getContext();
    if (!ctx) return;
    const { tool: t, color: c, brushSize: b } = styleRef.current;
    applyStrokeStyle(ctx, t, c, b);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    hasDrawingRef.current = true;
  }, [getContext]);

  const flushPendingStroke = useCallback(() => {
    rafRef.current = null;
    if (!drawingRef.current) return;
    const p = pendingPointRef.current;
    const last = lastPointRef.current;
    if (!p || !last) return;
    stroke(last, p);
    strokeStartedRef.current = true;
    lastPointRef.current = p;
  }, [stroke]);

  const startDrawing = useCallback(
    (clientX: number, clientY: number) => {
      refreshRect();
      drawingRef.current = true;
      strokeStartedRef.current = false;
      const p = canvasToPoint(clientX, clientY);
      lastPointRef.current = p;
      stroke(p, p);
    },
    [canvasToPoint, refreshRect, stroke]
  );

  const moveDrawing = useCallback(
    (clientX: number, clientY: number) => {
      if (!drawingRef.current) return;
      pendingPointRef.current = canvasToPoint(clientX, clientY);
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(flushPendingStroke);
    },
    [canvasToPoint, flushPendingStroke]
  );

  const endDrawing = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      flushPendingStroke();
    }
    if (drawingRef.current && strokeStartedRef.current) {
      pushUndoSnapshot();
    }
    drawingRef.current = false;
    strokeStartedRef.current = false;
    lastPointRef.current = null;
    pendingPointRef.current = null;
  }, [flushPendingStroke, pushUndoSnapshot]);

  const setPen = useCallback(() => setTool("pen"), []);
  const setEraser = useCallback(() => setTool("eraser"), []);

  const clearCanvas = useCallback(() => {
    fillWhite();
    hasDrawingRef.current = false;
    resetUndoHistory();
  }, [fillWhite, resetUndoHistory]);

  const loadFromDataUrl = useCallback(
    (dataUrl: string | null) => {
      const ctx = getContext();
      const size = logicalSizeRef.current;
      if (!ctx) return;

      if (!dataUrl) {
        fillWhite();
        hasDrawingRef.current = false;
        resetUndoHistory();
        return;
      }

      const img = new Image();
      if (dataUrl.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        fillWhite();
        ctx.drawImage(img, 0, 0, size, size);
        hasDrawingRef.current = true;
        resetUndoHistory(captureSnapshot());
      };
      img.onerror = () => {
        fillWhite();
        hasDrawingRef.current = false;
        resetUndoHistory();
      };
      img.src = dataUrl;
    },
    [captureSnapshot, fillWhite, getContext, resetUndoHistory]
  );

  const isBlank = useCallback((): boolean => !hasDrawingRef.current, []);

  useEffect(() => {
    setupCanvas();

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const tmp = document.createElement("canvas");
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        tmp.getContext("2d")?.drawImage(canvas, 0, 0);
        const hadDrawing = hasDrawingRef.current;

        setupCanvas({ skipUndoReset: true });

        const next = canvasRef.current;
        const nextCtx = next?.getContext("2d", { willReadFrequently: true });
        if (hadDrawing && next && nextCtx) {
          const size = logicalSizeRef.current;
          nextCtx.drawImage(tmp, 0, 0, size, size);
          applyStrokeStyle(
            nextCtx,
            styleRef.current.tool,
            styleRef.current.color,
            styleRef.current.brushSize
          );
          resetUndoHistory(nextCtx.getImageData(0, 0, size, size));
        }
      }, 200);
    };

    window.addEventListener("resize", onResize);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, captureSnapshot, getContext, resetUndoHistory, setupCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      startDrawing(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      moveDrawing(e.clientX, e.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      startDrawing(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      moveDrawing(t.clientX, t.clientY);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", endDrawing);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrawing);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", endDrawing);
    };
  }, [canvasRef, ready, startDrawing, moveDrawing, endDrawing]);

  return {
    color,
    setColor,
    brushSize,
    setBrushSize,
    tool,
    setPen,
    setEraser,
    clearCanvas,
    undo,
    canUndo,
    exportDataUrl,
    loadFromDataUrl,
    isBlank,
    ready,
  };
}
