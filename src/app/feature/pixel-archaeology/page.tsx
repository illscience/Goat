"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  visible: boolean;
}

interface PixelArt {
  width: number;
  height: number;
  pixels: string[][];
  name: string;
}

const PIXEL_SIZE = 8;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 320;
const GRID_WIDTH = CANVAS_WIDTH / PIXEL_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / PIXEL_SIZE;

const SAND_COLORS = ["#c2b280", "#d4c795", "#b8a870", "#ddd5a5", "#a89860"];

const PIXEL_ART_TEMPLATES = [
  {
    name: "Treasure Chest",
    pattern: (x: number, y: number, w: number, h: number): string | null => {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      
      if (dx <= 8 && dy <= 6) {
        if (dy === 6 || dy === 0) return "#8B4513";
        if (dx === 8) return "#8B4513";
        if (dy === 3 && dx <= 2) return "#FFD700";
        if (dy <= 2) return "#DAA520";
        return "#CD853F";
      }
      return null;
    }
  },
  {
    name: "Ancient Rune",
    pattern: (x: number, y: number, w: number, h: number): string | null => {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist >= 10 && dist <= 12) return "#4169E1";
      if (dist >= 6 && dist <= 7) return "#6495ED";
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 8) return "#1E90FF";
      if (Math.abs(dy) <= 1 && Math.abs(dx) <= 8) return "#1E90FF";
      return null;
    }
  },
  {
    name: "Pixel Heart",
    pattern: (x: number, y: number, w: number, h: number): string | null => {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const heartPattern = [
        [0,0,1,1,0,0,0,1,1,0,0],
        [0,1,1,1,1,0,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,1,1,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
      ];
      
      const hx = x - cx + 5;
      const hy = y - cy + 5;
      
      if (hx >= 0 && hx < 11 && hy >= 0 && hy < 10) {
        if (heartPattern[hy]?.[hx]) {
          return hy < 3 ? "#FF6B6B" : "#FF4757";
        }
      }
      return null;
    }
  },
  {
    name: "Mystic Crystal",
    pattern: (x: number, y: number, w: number, h: number): string | null => {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const dx = x - cx;
      const dy = y - cy;
      
      const inDiamond = Math.abs(dx) + Math.abs(dy) <= 10;
      if (inDiamond) {
        const depth = Math.abs(dx) + Math.abs(dy);
        if (depth <= 3) return "#E0B0FF";
        if (depth <= 6) return "#DA70D6";
        if (depth <= 8) return "#BA55D3";
        return "#9932CC";
      }
      return null;
    }
  },
  {
    name: "Ancient Skull",
    pattern: (x: number, y: number, w: number, h: number): string | null => {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const dx = x - cx;
      const dy = y - cy;
      
      const dist = Math.sqrt(dx * dx + (dy * 1.3) * (dy * 1.3));
      if (dist <= 8 && dy <= 4) {
        if ((dx === -3 || dx === 3) && dy === -1) return "#1a1a1a";
        if ((dx === -3 || dx === 3) && dy === 0) return "#1a1a1a";
        if (dy === 4 && Math.abs(dx) <= 4 && Math.abs(dx) % 2 === 0) return "#1a1a1a";
        return "#F5F5DC";
      }
      if (dy >= 5 && dy <= 8 && Math.abs(dx) <= 3) return "#F5F5DC";
      return null;
    }
  },
  {
    name: "Golden Sun",
    pattern: (x: number, y: number, w: number, h: number): string | null => {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= 6) return "#FFD700";
      
      const angle = Math.atan2(dy, dx);
      const rayIndex = Math.floor((angle + Math.PI) / (Math.PI / 4));
      if (dist <= 12 && dist > 6) {
        if (rayIndex % 2 === 0 && dist <= 10) return "#FFA500";
      }
      return null;
    }
  }
];

function generatePixelArt(): PixelArt {
  const template = PIXEL_ART_TEMPLATES[Math.floor(Math.random() * PIXEL_ART_TEMPLATES.length)];
  const pixels: string[][] = [];
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    pixels[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const color = template.pattern(x, y, GRID_WIDTH, GRID_HEIGHT);
      pixels[y][x] = color || "#2a1810";
    }
  }
  
  return {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    pixels,
    name: template.name
  };
}

export default function PixelArchaeology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sandParticles, setSandParticles] = useState<Particle[]>([]);
  const [pixelArt, setPixelArt] = useState<PixelArt | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const isDrawingRef = useRef<boolean>(false);
  const frameRef = useRef<number>(0);

  const totalParticles = GRID_WIDTH * GRID_HEIGHT;
  const revealPercentage = Math.floor((revealedCount / totalParticles) * 100);

  const initializeGame = useCallback(() => {
    const newPixelArt = generatePixelArt();
    setPixelArt(newPixelArt);
    
    const particles: Particle[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        particles.push({ x, y, visible: true });
      }
    }
    setSandParticles(particles);
    setRevealedCount(0);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !pixelArt) return;

    ctx.fillStyle = "#2a1810";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        ctx.fillStyle = pixelArt.pixels[y][x];
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

    sandParticles.forEach((particle, index) => {
      if (particle.visible) {
        ctx.fillStyle = SAND_COLORS[index % SAND_COLORS.length];
        ctx.fillRect(
          particle.x * PIXEL_SIZE,
          particle.y * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE
        );
      }
    });
  }, [sandParticles, pixelArt]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [draw]);

  const brushAway = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX / PIXEL_SIZE);
    const y = Math.floor((clientY - rect.top) * scaleY / PIXEL_SIZE);

    setSandParticles(prev => {
      let newRevealed = 0;
      const updated = prev.map(particle => {
        const dx = Math.abs(particle.x - x);
        const dy = Math.abs(particle.y - y);
        if (dx <= brushSize && dy <= brushSize && particle.visible) {
          newRevealed++;
          return { ...particle, visible: false };
        }
        return particle;
      });
      
      if (newRevealed > 0) {
        setRevealedCount(prev => {
          const newCount = prev + newRevealed;
          if (newCount >= totalParticles * 0.9 && !isComplete) {
            setIsComplete(true);
          }
          return newCount;
        });
      }
      
      return updated;
    });
  }, [brushSize, totalParticles, isComplete]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    brushAway(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      brushAway(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const touch = e.touches[0];
    brushAway(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawingRef.current && e.touches[0]) {
      brushAway(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  return (
    <FeatureWrapper day={365} title="Pixel Archaeology" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <p 
            className="text-lg mb-2"
            style={{ color: "var(--color-text-dim)", fontFamily: "var(--font-serif)" }}
          >
            Uncover ancient pixel treasures buried beneath the digital sands...
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click and drag to brush away the sand
          </p>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg cursor-crosshair border-4 shadow-2xl"
            style={{ 
              borderColor: "var(--color-border)",
              maxWidth: "100%",
              height: "auto"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          
          {isComplete && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
            >
              <div 
                className="text-center p-6 rounded-lg"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <p className="text-4xl mb-2">🎉</p>
                <p 
                  className="text-xl font-bold mb-1"
                  style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
                >
                  Discovery Complete!
                </p>
                <p style={{ color: "var(--color-accent)" }}>
                  You found: {pixelArt?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        <div 
          className="w-full max-w-sm p-4 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: "var(--color-text-dim)" }}>Excavation Progress</span>
            <span style={{ color: "var(--color-accent)" }} className="font-bold">
              {revealPercentage}%
            </span>
          </div>
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-border)" }}
          >
            <div 
              className="h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${revealPercentage}%`,
                backgroundColor: "var(--color-accent)"
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <span style={{ color: "var(--color-text-dim)" }} className="text-sm">
              Brush Size:
            </span>
            <div className="flex gap-2">
              {[1, 3, 5].map(size => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    brushSize === size ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {size === 1 ? "Fine" : size === 3 ? "Medium" : "Large"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={initializeGame}
            className="btn-primary px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <span>🔄</span>
            New Excavation
          </button>
        </div>

        <p 
          className="text-xs text-center max-w-xs"
          style={{ color: "var(--color-text-dim)" }}
        >
          Each dig reveals a unique artifact. How many treasures can you uncover?
        </p>
      </div>
    </FeatureWrapper>
  );
}