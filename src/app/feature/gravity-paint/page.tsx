"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  mass: number;
}

interface GravityWell {
  id: number;
  x: number;
  y: number;
  strength: number;
  radius: number;
}

interface Barrier {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type Tool = "paint" | "gravity" | "antigravity" | "barrier" | "eraser";

export default function GravityPaint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gravityWells, setGravityWells] = useState<GravityWell[]>([]);
  const [barriers, setBarriers] = useState<Barrier[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>("paint");
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#FF6B6B");
  const [gravity, setGravity] = useState(0.2);
  const [wind, setWind] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [barrierStart, setBarrierStart] = useState<{ x: number; y: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const idCounterRef = useRef(0);

  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#DDA0DD", "#98D8C8"];

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const addParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    const particleCount = Math.ceil(brushSize / 2);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * brushSize;
      newParticles.push({
        id: idCounterRef.current++,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * -2,
        color: brushColor,
        size: 2 + Math.random() * 3,
        mass: 1
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (currentTool === "paint") {
      setIsDrawing(true);
      lastPosRef.current = pos;
      addParticles(pos.x, pos.y);
    } else if (currentTool === "gravity" || currentTool === "antigravity") {
      setGravityWells(prev => [...prev, {
        id: idCounterRef.current++,
        x: pos.x,
        y: pos.y,
        strength: currentTool === "gravity" ? 100 : -100,
        radius: 150
      }]);
    } else if (currentTool === "barrier") {
      setBarrierStart(pos);
    } else if (currentTool === "eraser") {
      // Erase particles near click
      setParticles(prev => prev.filter(p => {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) > 30;
      }));
      // Erase gravity wells near click
      setGravityWells(prev => prev.filter(g => {
        const dx = g.x - pos.x;
        const dy = g.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) > 30;
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (isDrawing && currentTool === "paint" && lastPosRef.current) {
      const dx = pos.x - lastPosRef.current.x;
      const dy = pos.y - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(distance / 5);
      
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = lastPosRef.current.x + dx * t;
        const y = lastPosRef.current.y + dy * t;
        addParticles(x, y);
      }
      
      lastPosRef.current = pos;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPosRef.current = null;
    
    if (currentTool === "barrier" && barrierStart) {
      const pos = getMousePos(e);
      setBarriers(prev => [...prev, {
        id: idCounterRef.current++,
        x1: barrierStart.x,
        y1: barrierStart.y,
        x2: pos.x,
        y2: pos.y
      }]);
      setBarrierStart(null);
    }
  };

  const updatePhysics = useCallback(() => {
    if (isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setParticles(prev => {
      return prev.map(particle => {
        let { x, y, vx, vy } = particle;
        
        // Apply gravity
        vy += gravity;
        
        // Apply wind
        vx += wind;
        
        // Apply gravity wells
        gravityWells.forEach(well => {
          const dx = well.x - x;
          const dy = well.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < well.radius && distance > 5) {
            const force = well.strength / (distance * distance);
            vx += (dx / distance) * force * 0.01;
            vy += (dy / distance) * force * 0.01;
          }
        });
        
        // Apply barriers (simple bounce)
        barriers.forEach(barrier => {
          const { x1, y1, x2, y2 } = barrier;
          const A = y2 - y1;
          const B = x1 - x2;
          const C = (x2 - x1) * y1 - (y2 - y1) * x1;
          const distance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
          
          if (distance < 5) {
            const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const dot = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lineLength * lineLength);
            
            if (dot >= 0 && dot <= 1) {
              const normalX = A / Math.sqrt(A * A + B * B);
              const normalY = B / Math.sqrt(A * A + B * B);
              const dotProduct = vx * normalX + vy * normalY;
              vx -= 2 * dotProduct * normalX * 0.8;
              vy -= 2 * dotProduct * normalY * 0.8;
            }
          }
        });
        
        // Apply damping
        vx *= 0.99;
        vy *= 0.99;
        
        // Update position
        x += vx;
        y += vy;
        
        // Bounce off walls
        if (x <= particle.size || x >= canvas.width - particle.size) {
          vx *= -0.8;
          x = x <= particle.size ? particle.size : canvas.width - particle.size;
        }
        if (y <= particle.size || y >= canvas.height - particle.size) {
          vy *= -0.7;
          y = y <= particle.size ? particle.size : canvas.height - particle.size;
          
          // Add some friction when hitting the ground
          if (y >= canvas.height - particle.size) {
            vx *= 0.9;
          }
        }
        
        return { ...particle, x, y, vx, vy };
      }).filter(p => p.y < canvas.height + 100); // Remove particles that fall too far
    });
  }, [gravity, wind, gravityWells, barriers, isPaused]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "var(--color-bg)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw barriers
    ctx.strokeStyle = "var(--color-border)";
    ctx.lineWidth = 3;
    barriers.forEach(barrier => {
      ctx.beginPath();
      ctx.moveTo(barrier.x1, barrier.y1);
      ctx.lineTo(barrier.x2, barrier.y2);
      ctx.stroke();
    });
    
    // Draw gravity wells
    gravityWells.forEach(well => {
      const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, well.radius);
      if (well.strength > 0) {
        gradient.addColorStop(0, "rgba(138, 43, 226, 0.3)");
        gradient.addColorStop(1, "rgba(138, 43, 226, 0)");
      } else {
        gradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
        gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(well.x - well.radius, well.y - well.radius, well.radius * 2, well.radius * 2);
    });
    
    // Draw particles
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    });
    
    // Draw barrier preview
    if (currentTool === "barrier" && barrierStart) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = rect.left;
        const mouseY = rect.top;
        ctx.strokeStyle = "rgba(var(--color-accent-rgb), 0.5)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(barrierStart.x, barrierStart.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [particles, gravityWells, barriers, currentTool, barrierStart]);

  const animate = useCallback(() => {
    updatePhysics();
    draw();
    animationRef.current = requestAnimationFrame(animate);
  }, [updatePhysics, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const clearCanvas = () => {
    setParticles([]);
    setGravityWells([]);
    setBarriers([]);
  };

  return (
    <FeatureWrapper day={359} title="Gravity Paint" emoji="🎨">
      <div className="space-y-6">
        <p className="text-base text-[var(--color-text-dim)] text-center max-w-2xl mx-auto">
          Paint with physics! Your brushstrokes become particles affected by gravity, wind, and collision. 
          Place gravity wells and barriers to watch your art evolve in real-time.
        </p>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div className="flex gap-2">
            {(["paint", "gravity", "antigravity", "barrier", "eraser"] as Tool[]).map(tool => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentTool === tool
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-opacity-80"
                }`}
              >
                {tool === "paint" && "🖌️ Paint"}
                {tool === "gravity" && "🌌 Gravity"}
                {tool === "antigravity" && "🎈 Anti-Gravity"}
                {tool === "barrier" && "🚧 Barrier"}
                {tool === "eraser" && "🧹 Eraser"}
              </button>
            ))}
          </div>

          {currentTool === "paint" && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--color-text-dim)]">Size:</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
              </div>

              <div className="flex gap-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      brushColor === color ? "scale-110 border-[var(--color-text)]" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text-dim)]">Gravity:</label>
            <input
              type="range"
              min="-0.5"
              max="1"
              step="0.1"
              value={gravity}
              onChange={(e) => setGravity(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text-dim)]">Wind:</label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.05"
              value={wind}
              onChange={(e) => setWind(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-secondary"
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>

          <button
            onClick={clearCanvas}
            className="btn-secondary"
          >
            🗑️ Clear
          </button>
        </div>

        <div className="relative bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-lg">
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false);
              lastPosRef.current = null;
            }}
          />
        </div>

        <div className="text-center text-sm text-[var(--color-text-dim)] space-y-1">
          <p>{particles.length} particles dancing</p>
          <p className="italic">
            "Art is never finished, only abandoned" — but what if it kept evolving?
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}