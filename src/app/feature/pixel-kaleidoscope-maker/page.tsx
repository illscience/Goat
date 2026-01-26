"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Point {
  x: number;
  y: number;
}

export default function PixelKaleidoscopeMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [segments, setSegments] = useState(6);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState("#ff6b6b");
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const animationFrameRef = useRef<number>(0);

  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#dfe6e9",
    "#fd79a8",
    "#a29bfe",
    "#00b894",
    "#e17055",
  ];

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle guide lines
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * Math.max(canvas.width, canvas.height),
        centerY + Math.sin(angle) * Math.max(canvas.width, canvas.height)
      );
      ctx.stroke();
    }
  }, [segments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const size = Math.min(container.clientWidth, 600);
      canvas.width = size;
      canvas.height = size;
      clearCanvas();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clearCanvas]);

  useEffect(() => {
    clearCanvas();
  }, [segments, clearCanvas]);

  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawKaleidoscope = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Convert points to relative to center
    const fromRelX = from.x - centerX;
    const fromRelY = from.y - centerY;
    const toRelX = to.x - centerX;
    const toRelY = to.y - centerY;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Draw the rotated line
      ctx.beginPath();
      ctx.moveTo(
        centerX + fromRelX * cos - fromRelY * sin,
        centerY + fromRelX * sin + fromRelY * cos
      );
      ctx.lineTo(
        centerX + toRelX * cos - toRelY * sin,
        centerY + toRelX * sin + toRelY * cos
      );
      ctx.stroke();

      // Draw mirrored version for kaleidoscope effect
      ctx.beginPath();
      ctx.moveTo(
        centerX + fromRelX * cos + fromRelY * sin,
        centerY + fromRelX * sin - fromRelY * cos
      );
      ctx.lineTo(
        centerX + toRelX * cos + toRelY * sin,
        centerY + toRelX * sin - toRelY * cos
      );
      ctx.stroke();
    }
  };

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      setIsDrawing(true);
      setLastPoint(point);
    }
  };

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing || !lastPoint) return;

    const point = getCanvasPoint(e);
    if (point) {
      drawKaleidoscope(lastPoint, point);
      setLastPoint(point);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `kaleidoscope-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <FeatureWrapper day={422} title="Pixel Kaleidoscope Maker" emoji="🔮">
      <div className="flex flex-col items-center gap-6 p-4">
        <p
          className="text-center max-w-lg"
          style={{ color: "var(--color-text-dim)" }}
        >
          Draw anywhere on the canvas and watch mathematical poetry unfold.
          Every stroke mirrors across {segments} symmetrical dimensions. ✨
        </p>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
          {/* Segments */}
          <div className="flex flex-col items-center gap-2">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text-dim)" }}
            >
              Segments: {segments}
            </label>
            <input
              type="range"
              min="3"
              max="12"
              value={segments}
              onChange={(e) => setSegments(parseInt(e.target.value))}
              className="w-32 accent-purple-500"
            />
          </div>

          {/* Brush Size */}
          <div className="flex flex-col items-center gap-2">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text-dim)" }}
            >
              Brush: {brushSize}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-32 accent-purple-500"
            />
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex flex-wrap justify-center gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: color,
                boxShadow:
                  brushColor === color
                    ? `0 0 0 3px var(--color-bg), 0 0 0 5px ${color}`
                    : "none",
                transform: brushColor === color ? "scale(1.15)" : "scale(1)",
              }}
              aria-label={`Select color ${color}`}
            />
          ))}
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border-2"
            style={{ borderColor: "var(--color-border)" }}
            aria-label="Custom color picker"
          />
        </div>

        {/* Canvas */}
        <div
          className="relative w-full max-w-[600px] aspect-square rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))",
            padding: "4px",
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-2xl cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button onClick={clearCanvas} className="btn-secondary px-6 py-2">
            🗑️ Clear
          </button>
          <button onClick={downloadImage} className="btn-primary px-6 py-2">
            💾 Save Art
          </button>
        </div>

        {/* Fun tip */}
        <p
          className="text-center text-sm italic max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          Pro tip: Try drawing near the center for intricate mandalas, or near
          the edges for cosmic flower patterns 🌸
        </p>
      </div>
    </FeatureWrapper>
  );
}