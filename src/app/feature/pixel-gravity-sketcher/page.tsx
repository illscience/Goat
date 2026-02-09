"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function PixelGravitySketcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [gravity, setGravity] = useState(0.15);
  const [particleSize, setParticleSize] = useState(3);
  const [brushColor, setBrushColor] = useState("#ff6b6b");
  const [isRunning, setIsRunning] = useState(true);
  const [particleCount, setParticleCount] = useState(0);
  const [brushMode, setBrushMode] = useState<"normal" | "fountain" | "explosion">("normal");

  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3", "#f38181", "#aa96da", "#fcbad3", "#a8d8ea"];

  const createParticle = useCallback((x: number, y: number, vxMod: number = 0, vyMod: number = 0): Particle => {
    const speedMultiplier = brushMode === "explosion" ? 5 : brushMode === "fountain" ? 3 : 1;
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 2 * speedMultiplier + vxMod,
      vy: brushMode === "fountain" ? -Math.random() * 5 - 2 : (Math.random() - 0.5) * 2 * speedMultiplier + vyMod,
      color: brushColor,
      size: particleSize + Math.random() * 2,
      life: 1,
      maxLife: 200 + Math.random() * 100,
    };
  }, [brushColor, particleSize, brushMode]);

  const addParticles = useCallback((x: number, y: number, prevX?: number, prevY?: number) => {
    const count = brushMode === "explosion" ? 20 : brushMode === "fountain" ? 8 : 5;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      let vxMod = 0;
      let vyMod = 0;
      
      if (prevX !== undefined && prevY !== undefined) {
        vxMod = (x - prevX) * 0.3;
        vyMod = (y - prevY) * 0.3;
      }
      
      newParticles.push(createParticle(x, y, vxMod, vyMod));
    }
    
    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-2000);
    setParticleCount(particlesRef.current.length);
  }, [createParticle, brushMode]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
    addParticles(coords.x, coords.y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    
    const coords = getCanvasCoords(e);
    const lastPos = lastPosRef.current;
    
    if (lastPos) {
      const dx = coords.x - lastPos.x;
      const dy = coords.y - lastPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / 5));
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lastPos.x + dx * t;
        const y = lastPos.y + dy * t;
        addParticles(x, y, lastPos.x, lastPos.y);
      }
    }
    
    lastPosRef.current = coords;
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    particlesRef.current = [];
    setParticleCount(0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const explodeAll = () => {
    particlesRef.current = particlesRef.current.map(p => ({
      ...p,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 5,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const animate = () => {
      if (!isRunning) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const newParticles: Particle[] = [];

      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Bounce off walls
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -0.7;
          p.x = Math.max(0, Math.min(canvas.width, p.x));
        }

        // Bounce off floor
        if (p.y > canvas.height - p.size) {
          p.vy *= -0.6;
          p.vx *= 0.95;
          p.y = canvas.height - p.size;
          
          if (Math.abs(p.vy) < 0.5) {
            p.vy = 0;
            p.vx *= 0.98;
          }
        }

        // Ceiling
        if (p.y < 0) {
          p.vy *= -0.5;
          p.y = 0;
        }

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        
        if (alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
          
          newParticles.push(p);
        }
      }

      particlesRef.current = newParticles;
      setParticleCount(newParticles.length);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [gravity, isRunning]);

  return (
    <FeatureWrapper day={436} title="Pixel Gravity Sketcher" emoji="🎨">
      <div className="flex flex-col items-center gap-4 p-4 w-full max-w-4xl mx-auto">
        <p className="text-center" style={{ color: "var(--color-text-dim)" }}>
          Draw on the canvas and watch your art cascade, bounce, and dance with gravity. 
          <br />
          <span className="italic">Your creations refuse to stay put—embrace the chaos!</span>
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                brushColor === color ? "border-white scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>Gravity:</label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={gravity}
              onChange={(e) => setGravity(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-xs w-8" style={{ color: "var(--color-text-dim)" }}>
              {gravity.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>Size:</label>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={particleSize}
              onChange={(e) => setParticleSize(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="flex gap-1">
            {(["normal", "fountain", "explosion"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBrushMode(mode)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  brushMode === mode 
                    ? "bg-white/20 text-white" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {mode === "normal" ? "✏️" : mode === "fountain" ? "⛲" : "💥"}
              </button>
            ))}
          </div>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="cursor-crosshair touch-none"
            style={{ width: "100%", maxWidth: "800px", height: "auto", aspectRatio: "8/5" }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
          
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded text-xs"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "var(--color-text-dim)" }}
          >
            {particleCount} particles
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => setIsRunning(!isRunning)} className="btn-primary">
            {isRunning ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button onClick={explodeAll} className="btn-secondary">
            💥 Explode All
          </button>
          <button onClick={clearCanvas} className="btn-secondary">
            🗑️ Clear
          </button>
        </div>

        <div className="text-center text-sm mt-2" style={{ color: "var(--color-text-dim)" }}>
          <p>💡 Tips: Try the fountain mode for upward sprays, or explosion mode for dramatic bursts!</p>
          <p className="mt-1 italic">Set gravity to 0 for zero-G space art ✨</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}