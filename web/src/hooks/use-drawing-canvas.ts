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

type Point = { x: number; y: number };

export function useDrawingCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  const [color, setColor] = useState<string>(DRAW_PALETTE[1]);
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [ready, setReady] = useState(false);

  const logicalSizeRef = useRef(400);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, [canvasRef]);

  const fillWhite = useCallback(() => {
    const ctx = getContext();
    const size = logicalSizeRef.current;
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
  }, [getContext]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cssSize = Math.min(rect.width || 400, 600);
    const dpr = window.devicePixelRatio || 1;

    logicalSizeRef.current = cssSize;
    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fillWhite();
    setReady(true);
  }, [canvasRef, fillWhite]);

  const canvasToPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scale = logicalSizeRef.current / rect.width;
      return {
        x: (clientX - rect.left) * scale,
        y: (clientY - rect.top) * scale,
      };
    },
    [canvasRef]
  );

  const stroke = useCallback(
    (from: Point, to: Point) => {
      const ctx = getContext();
      if (!ctx) return;

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

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    },
    [brushSize, color, getContext, tool]
  );

  const startDrawing = useCallback(
    (clientX: number, clientY: number) => {
      drawingRef.current = true;
      const p = canvasToPoint(clientX, clientY);
      lastPointRef.current = p;
      stroke(p, p);
    },
    [canvasToPoint, stroke]
  );

  const moveDrawing = useCallback(
    (clientX: number, clientY: number) => {
      if (!drawingRef.current) return;
      const p = canvasToPoint(clientX, clientY);
      const last = lastPointRef.current;
      if (last) stroke(last, p);
      lastPointRef.current = p;
    },
    [canvasToPoint, stroke]
  );

  const endDrawing = useCallback(() => {
    drawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const setPen = useCallback(() => setTool("pen"), []);
  const setEraser = useCallback(() => setTool("eraser"), []);

  const clearCanvas = useCallback(() => {
    fillWhite();
  }, [fillWhite]);

  const exportDataUrl = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  }, [canvasRef]);

  const loadFromDataUrl = useCallback(
    (dataUrl: string | null) => {
      const canvas = canvasRef.current;
      const ctx = getContext();
      const size = logicalSizeRef.current;
      if (!canvas || !ctx) return;

      if (!dataUrl) {
        fillWhite();
        return;
      }

      const img = new Image();
      if (dataUrl.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        fillWhite();
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.onerror = () => fillWhite();
      img.src = dataUrl;
    },
    [canvasRef, fillWhite, getContext]
  );

  const isBlank = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    const bctx = blank.getContext("2d");
    if (!bctx) return true;
    bctx.fillStyle = "#fff";
    bctx.fillRect(0, 0, blank.width, blank.height);
    return canvas.toDataURL() === blank.toDataURL();
  }, [canvasRef]);

  useEffect(() => {
    setupCanvas();
    const onResize = () => {
      const saved = exportDataUrl();
      const hadDrawing = saved.length > 0 && !isBlank();
      setupCanvas();
      if (hadDrawing) loadFromDataUrl(saved);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setupCanvas, exportDataUrl, isBlank, loadFromDataUrl]);

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
  }, [
    canvasRef,
    ready,
    startDrawing,
    moveDrawing,
    endDrawing,
  ]);

  return {
    color,
    setColor,
    brushSize,
    setBrushSize,
    tool,
    setPen,
    setEraser,
    clearCanvas,
    exportDataUrl,
    loadFromDataUrl,
    isBlank,
    ready,
  };
}
