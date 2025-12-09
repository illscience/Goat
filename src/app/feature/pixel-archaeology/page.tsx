"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const PIXEL_SIZE = 12;

// Hidden scene - pixel art of ancient ruins with artifacts
const generateHiddenScene = (): string[][] => {
  const scene: string[][] = [];
  
  // Color palette
  const sky = "#87CEEB";
  const skyDark = "#5CACEE";
  const sand = "#F4D03F";
  const sandDark = "#D4AC0D";
  const stone = "#7B7D7D";
  const stoneDark = "#515A5A";
  const gold = "#FFD700";
  const goldBright = "#FFEC8B";
  const ruby = "#E74C3C";
  const emerald = "#2ECC71";
  const water = "#3498DB";
  const waterLight = "#85C1E9";
  const brown = "#8B4513";
  const brownLight = "#A0522D";
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: string[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      let color = sand;
      
      // Sky gradient at top
      if (y < 8) {
        color = y < 4 ? skyDark : sky;
      }
      // Sand base
      else if (y >= 8) {
        color = (x + y) % 3 === 0 ? sandDark : sand;
      }
      
      // Pyramid on the left
      if (y >= 4 && y < 18) {
        const pyramidBase = 14;
        const pyramidLeft = 2 + (y - 4);
        const pyramidRight = 16 - (y - 4);
        if (x >= pyramidLeft && x <= pyramidRight) {
          color = (x + y) % 2 === 0 ? stone : stoneDark;
        }
      }
      
      // Temple ruins on the right
      if (x >= 24 && x <= 36) {
        // Columns
        if ((x === 25 || x === 29 || x === 33) && y >= 6 && y < 18) {
          color = (y % 2 === 0) ? stone : stoneDark;
        }
        // Column tops
        if ((x >= 24 && x <= 26 || x >= 28 && x <= 30 || x >= 32 && x <= 34) && y === 5) {
          color = stoneDark;
        }
        // Fallen column
        if (y === 20 && x >= 26 && x <= 32) {
          color = stone;
        }
      }
      
      // Water pool/oasis
      if (x >= 16 && x <= 22 && y >= 22 && y <= 25) {
        const distFromCenter = Math.abs(x - 19) + Math.abs(y - 23.5);
        if (distFromCenter < 4) {
          color = distFromCenter < 2 ? waterLight : water;
        }
      }
      
      // Palm tree by oasis
      if (x === 15 && y >= 16 && y <= 21) {
        color = brown;
      }
      if (y === 15 && x >= 13 && x <= 17) {
        color = "#228B22";
      }
      if (y === 14 && x >= 14 && x <= 16) {
        color = "#228B22";
      }
      
      // Treasure chest
      if (x >= 8 && x <= 11 && y >= 22 && y <= 24) {
        color = brownLight;
        if (y === 22) color = brown;
        if (y === 23 && (x === 9 || x === 10)) color = gold;
      }
      
      // Scattered gold coins
      const goldCoins = [[5, 24], [7, 23], [12, 25], [13, 24], [6, 25], [37, 22], [35, 23]];
      for (const [gx, gy] of goldCoins) {
        if (x === gx && y === gy) color = gold;
      }
      
      // Ruby artifact near pyramid
      if (x === 10 && y === 19) color = ruby;
      if (x === 11 && y === 19) color = ruby;
      
      // Emerald in temple
      if (x === 29 && y === 17) color = emerald;
      
      // Ancient pot
      if (x >= 20 && x <= 22 && y >= 18 && y <= 20) {
        if (y === 18 && x === 21) color = brownLight;
        if (y === 19) color = brown;
        if (y === 20 && x === 21) color = brownLight;
      }
      
      // Hieroglyphics on pyramid
      if (x >= 6 && x <= 12 && y === 10) {
        if (x % 2 === 0) color = goldBright;
      }
      
      // Sun
      if (y >= 1 && y <= 3 && x >= 32 && x <= 36) {
        const distX = Math.abs(x - 34);
        const distY = Math.abs(y - 2);
        if (distX + distY <= 2) {
          color = gold;
          if (distX + distY <= 1) color = goldBright;
        }
      }
      
      // Bones/fossils scattered
      if ((x === 3 && y === 26) || (x === 38 && y === 25)) {
        color = "#F5F5DC";
      }
      
      row.push(color);
    }
    scene.push(row);
  }
  
  return scene;
};

// Dirt colors
const dirtColors = ["#8B4513", "#A0522D", "#6B4423", "#7B5B3A", "#5D4037"];
const getDirtColor = (x: number, y: number): string => {
  return dirtColors[(x * 7 + y * 11) % dirtColors.length];
};

export default function PixelArchaeology() {
  const [revealed, setRevealed] = useState<boolean[][]>(() => 
    Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false))
  );
  const [hiddenScene] = useState<string[][]>(() => generateHiddenScene());
  const [brushSize, setBrushSize] = useState(2);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isDigging, setIsDigging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalPixels = GRID_WIDTH * GRID_HEIGHT;
  const percentRevealed = Math.round((revealedCount / totalPixels) * 100);
  
  const discoveries = [
    { threshold: 10, message: "🔍 You found something..." },
    { threshold: 25, message: "⚱️ Ancient artifacts emerging!" },
    { threshold: 50, message: "🏛️ A lost civilization appears!" },
    { threshold: 75, message: "💎 Treasures revealed!" },
    { threshold: 95, message: "🏆 Master Archaeologist!" },
  ];
  
  const currentDiscovery = discoveries.filter(d => percentRevealed >= d.threshold).pop();
  
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (revealed[y][x]) {
          ctx.fillStyle = hiddenScene[y][x];
        } else {
          ctx.fillStyle = getDirtColor(x, y);
        }
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, [revealed, hiddenScene]);
  
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);
  
  const revealArea = useCallback((centerX: number, centerY: number) => {
    setRevealed(prev => {
      const newRevealed = prev.map(row => [...row]);
      let newlyRevealed = 0;
      
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          // Circular brush
          if (dx * dx + dy * dy <= brushSize * brushSize) {
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
              if (!newRevealed[y][x]) {
                newRevealed[y][x] = true;
                newlyRevealed++;
              }
            }
          }
        }
      }
      
      if (newlyRevealed > 0) {
        setRevealedCount(c => c + newlyRevealed);
      }
      
      return newRevealed;
    });
  }, [brushSize]);
  
  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIXEL_SIZE);
    
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
      revealArea(x, y);
    }
  }, [revealArea]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    handleCanvasInteraction(e);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      handleCanvasInteraction(e);
    }
  };
  
  const handleMouseUp = () => {
    setIsDigging(false);
  };
  
  const resetDig = () => {
    setRevealed(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(false)));
    setRevealedCount(0);
  };
  
  const revealAll = () => {
    setRevealed(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(true)));
    setRevealedCount(totalPixels);
  };
  
  return (
    <FeatureWrapper day={374} title="Pixel Archaeology" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Unearth the Past
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Click and drag to brush away the dirt and reveal an ancient pixel art scene.
            What secrets lie beneath the sands of time?
          </p>
        </div>
        
        <div 
          className="rounded-lg overflow-hidden shadow-xl"
          style={{ 
            border: "4px solid var(--color-border)",
            backgroundColor: "var(--color-bg-secondary)"
          }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * PIXEL_SIZE}
            height={GRID_HEIGHT * PIXEL_SIZE}
            className="cursor-crosshair"
            style={{ 
              imageRendering: "pixelated",
              width: GRID_WIDTH * PIXEL_SIZE,
              height: GRID_HEIGHT * PIXEL_SIZE
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* Progress bar */}
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: "var(--color-text-dim)" }}>Excavation Progress</span>
              <span style={{ color: "var(--color-accent)" }} className="font-bold">{percentRevealed}%</span>
            </div>
            <div 
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${percentRevealed}%`,
                  backgroundColor: "var(--color-accent)"
                }}
              />
            </div>
          </div>
          
          {/* Discovery message */}
          {currentDiscovery && (
            <div 
              className="text-center py-2 px-4 rounded-lg animate-pulse"
              style={{ 
                backgroundColor: "var(--color-bg-secondary)",
                color: "var(--color-accent)"
              }}
            >
              {currentDiscovery.message}
            </div>
          )}
          
          {/* Brush size */}
          <div className="flex items-center gap-4">
            <span style={{ color: "var(--color-text-dim)" }} className="text-sm">Brush Size:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(size => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    brushSize === size ? "scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                    color: brushSize === size ? "white" : "var(--color-text)",
                    border: `2px solid ${brushSize === size ? "var(--color-accent)" : "var(--color-border)"}`
                  }}
                >
                  {size === 1 ? "•" : size === 2 ? "●" : size === 3 ? "⬤" : "⬛"}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetDig}
              className="btn-secondary px-4 py-2 rounded-lg text-sm"
            >
              🔄 Start New Dig
            </button>
            <button
              onClick={revealAll}
              className="btn-primary px-4 py-2 rounded-lg text-sm"
            >
              👁️ Reveal All
            </button>
          </div>
        </div>
        
        <p 
          className="text-xs text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Tip: Use a smaller brush for delicate work around artifacts, 
          or go wild with a big brush if you&apos;re impatient! 🏺
        </p>
      </div>
    </FeatureWrapper>
  );
}