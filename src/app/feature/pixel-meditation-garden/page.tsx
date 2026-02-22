"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Flower {
  id: number;
  x: number;
  y: number;
  baseSize: number;
  breathRate: number;
  breathPhase: number;
  petalCount: number;
  hue: number;
  saturation: number;
}

export default function PixelMeditationGarden() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [isPlanting, setIsPlanting] = useState(false);
  const [breathSync, setBreathSync] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const nextIdRef = useRef<number>(0);

  const plantFlower = useCallback((x: number, y: number) => {
    const newFlower: Flower = {
      id: nextIdRef.current++,
      x,
      y,
      baseSize: 15 + Math.random() * 20,
      breathRate: 0.5 + Math.random() * 2,
      breathPhase: Math.random() * Math.PI * 2,
      petalCount: 5 + Math.floor(Math.random() * 4),
      hue: 280 + Math.random() * 80,
      saturation: 60 + Math.random() * 30,
    };
    setFlowers((prev) => [...prev, newFlower]);
    setIsPlanting(true);
    setTimeout(() => setIsPlanting(false), 200);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    plantFlower(x, y);
  };

  const clearGarden = () => {
    setFlowers([]);
    setBreathSync(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      ctx.fillStyle = "rgba(15, 20, 25, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (flowers.length > 3) {
        setBreathSync((prev) => Math.min(prev + 0.001, 1));
      }

      flowers.forEach((flower) => {
        const syncedPhase = flower.breathPhase * (1 - breathSync);
        const syncedRate = flower.breathRate * (1 - breathSync * 0.7) + 0.8 * breathSync;
        const breath = Math.sin(time * syncedRate + syncedPhase);
        const currentSize = flower.baseSize * (1 + breath * 0.3);

        const glowSize = currentSize * 2;
        const gradient = ctx.createRadialGradient(
          flower.x,
          flower.y,
          0,
          flower.x,
          flower.y,
          glowSize
        );
        gradient.addColorStop(0, `hsla(${flower.hue}, ${flower.saturation}%, 70%, 0.3)`);
        gradient.addColorStop(1, `hsla(${flower.hue}, ${flower.saturation}%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < flower.petalCount; i++) {
          const angle = (i / flower.petalCount) * Math.PI * 2 + time * 0.1;
          const petalX = flower.x + Math.cos(angle) * currentSize * 0.5;
          const petalY = flower.y + Math.sin(angle) * currentSize * 0.5;
          const petalSize = currentSize * 0.6;

          ctx.fillStyle = `hsla(${flower.hue}, ${flower.saturation}%, ${60 + breath * 10}%, ${0.7 + breath * 0.2})`;
          ctx.beginPath();
          ctx.ellipse(
            petalX,
            petalY,
            petalSize * 0.6,
            petalSize,
            angle,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        ctx.fillStyle = `hsla(${flower.hue - 20}, 80%, ${75 + breath * 15}%, 1)`;
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, currentSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        const sparkle = Math.sin(time * 3 + flower.breathPhase) * 0.5 + 0.5;
        ctx.fillStyle = `hsla(0, 0%, 100%, ${sparkle * 0.8})`;
        ctx.beginPath();
        ctx.arc(
          flower.x + currentSize * 0.1,
          flower.y - currentSize * 0.1,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [flowers, breathSync]);

  return (
    <FeatureWrapper day={449} title="Pixel Meditation Garden" emoji="🌸">
      <div className="flex flex-col items-center gap-6 p-4 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <p
            className="text-lg"
            style={{ color: "var(--color-text-dim)", fontFamily: "var(--font-serif)" }}
          >
            Click anywhere to plant a flower. Watch them breathe together.
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Each flower has its own rhythm, but as your garden grows, they begin to synchronize...
          </p>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            border: "2px solid var(--color-border)",
            boxShadow: isPlanting ? "0 0 30px rgba(168, 85, 247, 0.4)" : "none",
            transition: "box-shadow 0.3s ease",
          }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
            style={{ display: "block" }}
          />
          {flowers.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ color: "var(--color-text-dim)" }}
            >
              <span className="text-lg opacity-50">
                ✨ Click to plant your first flower ✨
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Flowers: </span>
            <span className="font-bold" style={{ color: "var(--color-accent)" }}>
              {flowers.length}
            </span>
          </div>

          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Harmony: </span>
            <span className="font-bold" style={{ color: "var(--color-accent)" }}>
              {Math.round(breathSync * 100)}%
            </span>
          </div>

          <button
            onClick={clearGarden}
            className="btn-secondary px-4 py-2 rounded-lg transition-all hover:scale-105"
            disabled={flowers.length === 0}
          >
            🍃 Clear Garden
          </button>
        </div>

        {breathSync > 0.5 && (
          <div
            className="text-center animate-pulse"
            style={{ color: "var(--color-accent)" }}
          >
            <p className="text-sm">
              ✨ Your garden is finding its rhythm... breathe with it ✨
            </p>
          </div>
        )}

        {flowers.length >= 10 && breathSync > 0.8 && (
          <div
            className="px-6 py-3 rounded-xl text-center"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-accent)",
            }}
          >
            <p style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}>
              🧘 Your garden has achieved perfect harmony
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-dim)" }}>
              Take a moment. Breathe with your flowers.
            </p>
          </div>
        )}

        <div
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>
            💡 Tip: Quick breathers (small flowers) will gradually slow down to match
            the deep breathers as your garden grows.
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}