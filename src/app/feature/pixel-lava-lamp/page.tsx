"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  density: number;
  temperature: number;
  hue: number;
}

interface HeatZone {
  x: number;
  y: number;
  strength: number;
  decay: number;
}

export default function PixelLavaLamp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const blobsRef = useRef<Blob[]>([]);
  const heatZonesRef = useRef<HeatZone[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [blobCount, setBlobCount] = useState(25);
  const [viscosity, setViscosity] = useState(0.98);
  const [gravity, setGravity] = useState(0.02);

  const colors = [
    { hue: 0, name: "Crimson Flow" },
    { hue: 30, name: "Molten Orange" },
    { hue: 280, name: "Purple Haze" },
    { hue: 180, name: "Cyan Dream" },
    { hue: 120, name: "Emerald Mist" },
  ];

  const createBlob = useCallback((width: number, height: number): Blob => {
    const colorChoice = colors[Math.floor(Math.random() * colors.length)];
    const baseRadius = 15 + Math.random() * 35;
    const density = 0.5 + Math.random() * 0.5;
    
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: baseRadius,
      baseRadius,
      color: `hsl(${colorChoice.hue}, 70%, 50%)`,
      density,
      temperature: 0.5,
      hue: colorChoice.hue,
    };
  }, []);

  const initBlobs = useCallback((width: number, height: number) => {
    blobsRef.current = Array.from({ length: blobCount }, () => createBlob(width, height));
  }, [blobCount, createBlob]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    heatZonesRef.current.push({
      x,
      y,
      strength: 1.5,
      decay: 0.995,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 600;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    initBlobs(width, height);

    const animate = () => {
      if (!isRunning) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#1a0a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f0f23");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update and decay heat zones
      heatZonesRef.current = heatZonesRef.current.filter((zone) => {
        zone.strength *= zone.decay;
        return zone.strength > 0.01;
      });

      // Draw heat zones glow
      heatZonesRef.current.forEach((zone) => {
        const glowGradient = ctx.createRadialGradient(
          zone.x, zone.y, 0,
          zone.x, zone.y, 100 * zone.strength
        );
        glowGradient.addColorStop(0, `rgba(255, 100, 50, ${zone.strength * 0.3})`);
        glowGradient.addColorStop(1, "rgba(255, 100, 50, 0)");
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
      });

      // Update blobs
      blobsRef.current.forEach((blob) => {
        // Apply heat from zones
        let totalHeat = 0;
        heatZonesRef.current.forEach((zone) => {
          const dx = blob.x - zone.x;
          const dy = blob.y - zone.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const influence = (1 - dist / 150) * zone.strength;
            totalHeat += influence;
            // Push blob away from heat source (rising effect)
            blob.vy -= influence * 0.1;
            blob.vx += (dx / dist) * influence * 0.02;
          }
        });

        blob.temperature = Math.min(1, blob.temperature + totalHeat * 0.1);
        blob.temperature *= 0.99; // Cool down over time

        // Temperature affects size and buoyancy
        const tempEffect = blob.temperature * 0.5;
        blob.radius = blob.baseRadius * (1 + tempEffect * 0.3);

        // Gravity based on density (heavier blobs sink)
        const buoyancy = (0.7 - blob.density + tempEffect) * gravity;
        blob.vy -= buoyancy;

        // Apply velocity with viscosity
        blob.x += blob.vx;
        blob.y += blob.vy;
        blob.vx *= viscosity;
        blob.vy *= viscosity;

        // Gentle random movement
        blob.vx += (Math.random() - 0.5) * 0.05;
        blob.vy += (Math.random() - 0.5) * 0.03;

        // Boundary collision with soft bounce
        const padding = blob.radius;
        if (blob.x < padding) {
          blob.x = padding;
          blob.vx = Math.abs(blob.vx) * 0.5;
        }
        if (blob.x > width - padding) {
          blob.x = width - padding;
          blob.vx = -Math.abs(blob.vx) * 0.5;
        }
        if (blob.y < padding) {
          blob.y = padding;
          blob.vy = Math.abs(blob.vy) * 0.5;
        }
        if (blob.y > height - padding) {
          blob.y = height - padding;
          blob.vy = -Math.abs(blob.vy) * 0.5;
        }
      });

      // Blob-blob interaction (soft collision and merging effect)
      for (let i = 0; i < blobsRef.current.length; i++) {
        for (let j = i + 1; j < blobsRef.current.length; j++) {
          const a = blobsRef.current[i];
          const b = blobsRef.current[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = (a.radius + b.radius) * 0.7;

          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            
            a.x -= nx * overlap * 0.3;
            a.y -= ny * overlap * 0.3;
            b.x += nx * overlap * 0.3;
            b.y += ny * overlap * 0.3;

            // Exchange some velocity
            const relVx = a.vx - b.vx;
            const relVy = a.vy - b.vy;
            a.vx -= relVx * 0.1;
            a.vy -= relVy * 0.1;
            b.vx += relVx * 0.1;
            b.vy += relVy * 0.1;
          }
        }
      }

      // Draw blobs with metaball-like effect
      blobsRef.current.forEach((blob) => {
        const lightness = 40 + blob.temperature * 30;
        const saturation = 60 + blob.temperature * 20;
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius * 1.5
        );
        glowGradient.addColorStop(0, `hsla(${blob.hue}, ${saturation}%, ${lightness}%, 0.4)`);
        glowGradient.addColorStop(0.5, `hsla(${blob.hue}, ${saturation}%, ${lightness}%, 0.2)`);
        glowGradient.addColorStop(1, "transparent");
        
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Main blob body
        const bodyGradient = ctx.createRadialGradient(
          blob.x - blob.radius * 0.3, blob.y - blob.radius * 0.3, 0,
          blob.x, blob.y, blob.radius
        );
        bodyGradient.addColorStop(0, `hsl(${blob.hue}, ${saturation + 10}%, ${lightness + 20}%)`);
        bodyGradient.addColorStop(0.7, `hsl(${blob.hue}, ${saturation}%, ${lightness}%)`);
        bodyGradient.addColorStop(1, `hsl(${blob.hue}, ${saturation - 10}%, ${lightness - 15}%)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(
          blob.x - blob.radius * 0.3,
          blob.y - blob.radius * 0.3,
          blob.radius * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(${blob.hue}, 80%, 80%, 0.4)`;
        ctx.fill();
      });

      // Lamp container effect (glass reflection)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, width - 4, height - 4);
      
      // Corner highlights
      const cornerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
      cornerGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      cornerGradient.addColorStop(1, "transparent");
      ctx.fillStyle = cornerGradient;
      ctx.fillRect(0, 0, 150, 150);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning, viscosity, gravity, initBlobs]);

  const resetLamp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initBlobs(canvas.width, canvas.height);
    heatZonesRef.current = [];
  };

  return (
    <FeatureWrapper day={440} title="Pixel Lava Lamp" emoji="🫧">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Mesmerizing Liquid Art
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click anywhere to add heat and watch the blobs dance. 
            Sometimes you just need to watch something beautiful move.
          </p>
        </div>

        <div 
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            border: "4px solid var(--color-border)",
            background: "linear-gradient(180deg, #2a1a4a 0%, #1a0a2e 100%)"
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-pointer"
            style={{ 
              width: "100%", 
              maxWidth: "600px",
              height: "auto",
              aspectRatio: "6/5"
            }}
          />
          
          {/* Lamp cap */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-4 rounded-t-lg"
            style={{ background: "linear-gradient(180deg, #4a3a6a, #2a1a4a)" }}
          />
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 rounded-b-lg"
            style={{ background: "linear-gradient(180deg, #2a1a4a, #4a3a6a)" }}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            {isRunning ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button
            onClick={resetLamp}
            className="btn-secondary px-6 py-2 rounded-lg"
          >
            🔄 Reset
          </button>
        </div>

        <div 
          className="flex flex-wrap justify-center gap-6 p-4 rounded-lg max-w-md"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <div className="flex flex-col items-center gap-2">
            <label style={{ color: "var(--color-text-dim)", fontSize: "0.875rem" }}>
              Blob Count: {blobCount}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={blobCount}
              onChange={(e) => setBlobCount(Number(e.target.value))}
              className="w-24"
              style={{ accentColor: "var(--color-accent)" }}
            />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <label style={{ color: "var(--color-text-dim)", fontSize: "0.875rem" }}>
              Viscosity: {(viscosity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="90"
              max="99"
              value={viscosity * 100}
              onChange={(e) => setViscosity(Number(e.target.value) / 100)}
              className="w-24"
              style={{ accentColor: "var(--color-accent)" }}
            />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <label style={{ color: "var(--color-text-dim)", fontSize: "0.875rem" }}>
              Gravity: {(gravity * 1000).toFixed(0)}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={gravity * 1000}
              onChange={(e) => setGravity(Number(e.target.value) / 1000)}
              className="w-24"
              style={{ accentColor: "var(--color-accent)" }}
            />
          </div>
        </div>

        <p 
          className="text-center text-sm max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Pro tip: Click multiple times rapidly to create intense heat zones 
          and watch the chaos unfold!
        </p>
      </div>
    </FeatureWrapper>
  );
}