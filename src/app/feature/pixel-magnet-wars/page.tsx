"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pixel {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  polarity: "attract" | "repel";
  color: string;
  size: number;
  mass: number;
}

const ATTRACT_COLORS = ["#ff6b6b", "#ff8787", "#ffa8a8", "#f06595", "#e64980"];
const REPEL_COLORS = ["#4dabf7", "#74c0fc", "#a5d8ff", "#66d9e8", "#3bc9db"];

export default function PixelMagnetWars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const frameRef = useRef<number>(0);
  const nextIdRef = useRef<number>(0);
  const [pixelCount, setPixelCount] = useState(0);
  const [attractCount, setAttractCount] = useState(0);
  const [repelCount, setRepelCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [forceStrength, setForceStrength] = useState(50);

  const createPixel = useCallback((x: number, y: number, polarity?: "attract" | "repel"): Pixel => {
    const actualPolarity = polarity || (Math.random() > 0.5 ? "attract" : "repel");
    const colors = actualPolarity === "attract" ? ATTRACT_COLORS : REPEL_COLORS;
    return {
      id: nextIdRef.current++,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      polarity: actualPolarity,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 4,
      mass: 1 + Math.random() * 0.5,
    };
  }, []);

  const updateCounts = useCallback(() => {
    const pixels = pixelsRef.current;
    setPixelCount(pixels.length);
    setAttractCount(pixels.filter(p => p.polarity === "attract").length);
    setRepelCount(pixels.filter(p => p.polarity === "repel").length);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create a burst of pixels
    const burstCount = 5 + Math.floor(Math.random() * 5);
    const polarity = e.shiftKey ? "repel" : e.ctrlKey || e.metaKey ? "attract" : undefined;
    
    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount;
      const distance = 10 + Math.random() * 20;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      pixelsRef.current.push(createPixel(px, py, polarity));
    }
    
    updateCounts();
  }, [createPixel, updateCounts]);

  const clearPixels = useCallback(() => {
    pixelsRef.current = [];
    updateCounts();
  }, [updateCounts]);

  const addRandomPixels = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    for (let i = 0; i < 20; i++) {
      pixelsRef.current.push(createPixel(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }
    updateCounts();
  }, [createPixel, updateCounts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Add some initial pixels
    for (let i = 0; i < 30; i++) {
      pixelsRef.current.push(createPixel(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }
    updateCounts();

    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear with trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pixels = pixelsRef.current;
      const strength = forceStrength / 1000;

      if (!isPaused) {
        // Update physics
        for (let i = 0; i < pixels.length; i++) {
          const p1 = pixels[i];
          let fx = 0;
          let fy = 0;

          for (let j = 0; j < pixels.length; j++) {
            if (i === j) continue;

            const p2 = pixels[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            if (dist < 1) continue;
            if (dist > 200) continue;

            // Magnetic force calculation
            const samePolarity = p1.polarity === p2.polarity;
            let forceMag = (p1.mass * p2.mass * strength) / (distSq + 10);
            
            // Same polarity repels, opposite attracts
            if (samePolarity) {
              forceMag = -forceMag;
            }

            // Apply force direction
            fx += (dx / dist) * forceMag;
            fy += (dy / dist) * forceMag;

            // Collision repulsion
            const minDist = (p1.size + p2.size) / 2;
            if (dist < minDist) {
              const repulse = (minDist - dist) * 0.5;
              fx -= (dx / dist) * repulse;
              fy -= (dy / dist) * repulse;
            }
          }

          // Apply forces
          p1.vx += fx;
          p1.vy += fy;

          // Damping
          p1.vx *= 0.98;
          p1.vy *= 0.98;

          // Limit velocity
          const speed = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
          if (speed > 10) {
            p1.vx = (p1.vx / speed) * 10;
            p1.vy = (p1.vy / speed) * 10;
          }

          // Update position
          p1.x += p1.vx;
          p1.y += p1.vy;

          // Bounce off walls
          if (p1.x < p1.size) {
            p1.x = p1.size;
            p1.vx *= -0.8;
          }
          if (p1.x > canvas.width - p1.size) {
            p1.x = canvas.width - p1.size;
            p1.vx *= -0.8;
          }
          if (p1.y < p1.size) {
            p1.y = p1.size;
            p1.vy *= -0.8;
          }
          if (p1.y > canvas.height - p1.size) {
            p1.y = canvas.height - p1.size;
            p1.vy *= -0.8;
          }
        }
      }

      // Draw connections between nearby same-polarity pixels
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pixels.length; i++) {
        for (let j = i + 1; j < pixels.length; j++) {
          const p1 = pixels[i];
          const p2 = pixels[j];
          
          if (p1.polarity !== p2.polarity) continue;
          
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 60) {
            const alpha = 1 - dist / 60;
            ctx.strokeStyle = p1.polarity === "attract" 
              ? `rgba(255, 107, 107, ${alpha * 0.3})`
              : `rgba(77, 171, 247, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw pixels with glow
      for (const pixel of pixels) {
        // Glow
        const gradient = ctx.createRadialGradient(
          pixel.x, pixel.y, 0,
          pixel.x, pixel.y, pixel.size * 3
        );
        gradient.addColorStop(0, pixel.color + "80");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, pixel.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = pixel.color;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, pixel.size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(pixel.x - pixel.size * 0.3, pixel.y - pixel.size * 0.3, pixel.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frameRef.current);
    };
  }, [createPixel, isPaused, forceStrength, updateCounts]);

  return (
    <FeatureWrapper day={388} title="Pixel Magnet Wars" emoji="🧲">
      <div className="flex flex-col h-full min-h-[600px] gap-4">
        <div className="text-center space-y-2">
          <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
            Click to spawn magnetic pixels • <span className="text-red-400">Red attracts</span> opposites, <span className="text-blue-400">Blue repels</span> same
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Hold <kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/10">Shift</kbd> for blue only • 
            Hold <kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/10">Ctrl</kbd> for red only
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center items-center">
          <div className="flex gap-2 items-center px-3 py-1.5 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
            <span className="text-red-400 font-bold">{attractCount}</span>
            <span style={{ color: "var(--color-text-dim)" }}>vs</span>
            <span className="text-blue-400 font-bold">{repelCount}</span>
            <span style={{ color: "var(--color-text-dim)" }}>({pixelCount} total)</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>Force:</label>
            <input
              type="range"
              min="10"
              max="100"
              value={forceStrength}
              onChange={(e) => setForceStrength(Number(e.target.value))}
              className="w-24 accent-purple-500"
            />
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-secondary px-4 py-1.5 rounded-lg text-sm"
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>

          <button
            onClick={addRandomPixels}
            className="btn-secondary px-4 py-1.5 rounded-lg text-sm"
          >
            ✨ Add Random
          </button>

          <button
            onClick={clearPixels}
            className="btn-secondary px-4 py-1.5 rounded-lg text-sm"
          >
            🗑️ Clear
          </button>
        </div>

        <div 
          className="flex-1 rounded-xl overflow-hidden border"
          style={{ 
            background: "#0a0a0f",
            borderColor: "var(--color-border)",
            minHeight: "400px"
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
          />
        </div>

        <div className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
          Watch as order emerges from chaos ✨ Same poles repel, opposite poles attract
        </div>
      </div>
    </FeatureWrapper>
  );
}