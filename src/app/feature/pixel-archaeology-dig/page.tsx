"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Cell {
  dirtLevel: number; // 0-100, 0 = fully revealed
  content: "dirt" | "treasure" | "fossil" | "artifact" | "structure" | "gem" | "coin" | "pottery";
  color: string;
  discovered: boolean;
}

interface DigSite {
  name: string;
  description: string;
  backgroundColor: string;
}

const DIG_SITES: DigSite[] = [
  { name: "Ancient Temple Ruins", description: "Rumored to hold golden idols and sacred gems", backgroundColor: "#8B4513" },
  { name: "Prehistoric Bone Yard", description: "Dinosaur fossils and ancient creature remains", backgroundColor: "#6B5344" },
  { name: "Sunken Pirate Cove", description: "Doubloons, jewels, and mysterious artifacts", backgroundColor: "#4A6741" },
  { name: "Lost Civilization", description: "Pottery, tools, and architectural wonders", backgroundColor: "#705548" },
  { name: "Crystal Cavern", description: "Rare gems and glittering treasures", backgroundColor: "#4A4A5A" },
];

const CONTENT_COLORS: Record<string, string> = {
  dirt: "#654321",
  treasure: "#FFD700",
  fossil: "#F5F5DC",
  artifact: "#CD853F",
  structure: "#808080",
  gem: "#9966CC",
  coin: "#DAA520",
  pottery: "#D2691E",
};

const CONTENT_EMOJIS: Record<string, string> = {
  treasure: "💎",
  fossil: "🦴",
  artifact: "🏺",
  structure: "🏛️",
  gem: "💠",
  coin: "🪙",
  pottery: "🫖",
};

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [currentSite, setCurrentSite] = useState<DigSite>(DIG_SITES[0]);
  const [brushSize, setBrushSize] = useState(2);
  const [discoveries, setDiscoveries] = useState<Record<string, number>>({});
  const [isDigging, setIsDigging] = useState(false);
  const [totalRevealed, setTotalRevealed] = useState(0);
  const animationRef = useRef<number>(0);

  const GRID_SIZE = 40;
  const CELL_SIZE = 12;

  const generateDigSite = useCallback(() => {
    const newGrid: Cell[][] = [];
    const site = DIG_SITES[Math.floor(Math.random() * DIG_SITES.length)];
    setCurrentSite(site);

    // Generate base grid with dirt
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({
          dirtLevel: 100,
          content: "dirt",
          color: CONTENT_COLORS.dirt,
          discovered: false,
        });
      }
      newGrid.push(row);
    }

    // Place treasures based on site type
    const placeContent = (content: Cell["content"], count: number, clusterSize: number = 1) => {
      for (let i = 0; i < count; i++) {
        const startX = Math.floor(Math.random() * (GRID_SIZE - clusterSize));
        const startY = Math.floor(Math.random() * (GRID_SIZE - clusterSize));
        
        for (let dy = 0; dy < clusterSize; dy++) {
          for (let dx = 0; dx < clusterSize; dx++) {
            if (Math.random() > 0.3) {
              const y = startY + dy;
              const x = startX + dx;
              if (y < GRID_SIZE && x < GRID_SIZE) {
                newGrid[y][x] = {
                  dirtLevel: 100,
                  content,
                  color: CONTENT_COLORS[content],
                  discovered: false,
                };
              }
            }
          }
        }
      }
    };

    // Place different items based on site
    if (site.name.includes("Temple")) {
      placeContent("treasure", 3, 2);
      placeContent("gem", 5, 1);
      placeContent("structure", 4, 4);
      placeContent("artifact", 6, 2);
    } else if (site.name.includes("Bone")) {
      placeContent("fossil", 8, 3);
      placeContent("fossil", 5, 2);
      placeContent("artifact", 3, 1);
    } else if (site.name.includes("Pirate")) {
      placeContent("coin", 10, 2);
      placeContent("treasure", 4, 2);
      placeContent("gem", 6, 1);
    } else if (site.name.includes("Civilization")) {
      placeContent("pottery", 8, 2);
      placeContent("structure", 5, 5);
      placeContent("artifact", 6, 2);
      placeContent("coin", 4, 1);
    } else if (site.name.includes("Crystal")) {
      placeContent("gem", 15, 2);
      placeContent("treasure", 3, 1);
      placeContent("structure", 2, 3);
    }

    setGrid(newGrid);
    setDiscoveries({});
    setTotalRevealed(0);
  }, []);

  useEffect(() => {
    generateDigSite();
  }, [generateDigSite]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = currentSite.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        // Draw content color based on reveal level
        if (cell.dirtLevel < 100) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        }

        // Draw dirt overlay
        if (cell.dirtLevel > 0) {
          const dirtVariation = Math.sin(x * 0.3) * 10 + Math.cos(y * 0.3) * 10;
          const r = Math.min(255, Math.max(0, 101 + dirtVariation));
          const g = Math.min(255, Math.max(0, 67 + dirtVariation));
          const b = Math.min(255, Math.max(0, 33 + dirtVariation));
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${cell.dirtLevel / 100})`;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          // Add some texture
          if (cell.dirtLevel > 50 && Math.random() > 0.7) {
            ctx.fillStyle = `rgba(80, 50, 30, ${(cell.dirtLevel / 100) * 0.5})`;
            ctx.fillRect(px + Math.random() * 4, py + Math.random() * 4, 3, 3);
          }
        }

        // Add sparkle effect for newly discovered items
        if (cell.discovered && cell.content !== "dirt" && cell.dirtLevel === 0) {
          if (Math.random() > 0.95) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    });
  }, [grid, currentSite]);

  useEffect(() => {
    const animate = () => {
      drawGrid();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawGrid]);

  const dig = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      let newDiscoveries: Record<string, number> = {};
      let revealed = 0;

      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= brushSize) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const cell = newGrid[ny][nx];
              const brushStrength = Math.max(5, 30 - distance * 10);
              
              if (cell.dirtLevel > 0) {
                const newDirtLevel = Math.max(0, cell.dirtLevel - brushStrength);
                
                if (newDirtLevel === 0 && cell.dirtLevel > 0) {
                  revealed++;
                  
                  if (cell.content !== "dirt" && !cell.discovered) {
                    cell.discovered = true;
                    newDiscoveries[cell.content] = (newDiscoveries[cell.content] || 0) + 1;
                  }
                }
                
                cell.dirtLevel = newDirtLevel;
              }
            }
          }
        }
      }

      if (Object.keys(newDiscoveries).length > 0) {
        setDiscoveries(prev => {
          const updated = { ...prev };
          Object.entries(newDiscoveries).forEach(([key, value]) => {
            updated[key] = (updated[key] || 0) + value;
          });
          return updated;
        });
      }

      if (revealed > 0) {
        setTotalRevealed(prev => prev + revealed);
      }

      return newGrid;
    });
  }, [brushSize]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      dig(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      dig(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const totalDiscoveries = Object.values(discoveries).reduce((a, b) => a + b, 0);
  const revealPercentage = Math.round((totalRevealed / (GRID_SIZE * GRID_SIZE)) * 100);

  return (
    <FeatureWrapper day={423} title="Pixel Archaeology Dig" emoji="🏛️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            {currentSite.name}
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm italic">
            {currentSite.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-dim)" }} className="text-sm">Brush:</span>
            <button
              onClick={() => setBrushSize(1)}
              className={`px-3 py-1 rounded text-sm ${brushSize === 1 ? 'btn-primary' : 'btn-secondary'}`}
            >
              Fine
            </button>
            <button
              onClick={() => setBrushSize(2)}
              className={`px-3 py-1 rounded text-sm ${brushSize === 2 ? 'btn-primary' : 'btn-secondary'}`}
            >
              Medium
            </button>
            <button
              onClick={() => setBrushSize(4)}
              className={`px-3 py-1 rounded text-sm ${brushSize === 4 ? 'btn-primary' : 'btn-secondary'}`}
            >
              Wide
            </button>
          </div>
          
          <button
            onClick={generateDigSite}
            className="btn-primary px-4 py-2 rounded"
          >
            🗺️ New Dig Site
          </button>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden shadow-xl"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onMouseDown={() => setIsDigging(true)}
            onMouseUp={() => setIsDigging(false)}
            onMouseLeave={() => setIsDigging(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setIsDigging(true)}
            onTouchEnd={() => setIsDigging(false)}
            onTouchMove={handleTouchMove}
            className="cursor-crosshair touch-none"
          />
          
          <div 
            className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-mono"
            style={{ 
              backgroundColor: "rgba(0,0,0,0.7)", 
              color: "var(--color-text)" 
            }}
          >
            {revealPercentage}% excavated
          </div>
        </div>

        <p 
          className="text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Click and drag to brush away the dirt ✨
        </p>

        {totalDiscoveries > 0 && (
          <div 
            className="p-4 rounded-lg w-full max-w-md"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)"
            }}
          >
            <h3 
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🎉 Discoveries ({totalDiscoveries} items)
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(discoveries).map(([type, count]) => (
                <div 
                  key={type}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <span className="text-xl">{CONTENT_EMOJIS[type]}</span>
                  <span style={{ color: "var(--color-text)" }} className="capitalize">
                    {type}
                  </span>
                  <span 
                    className="font-bold px-2 py-0.5 rounded text-sm"
                    style={{ 
                      backgroundColor: "var(--color-accent)",
                      color: "white"
                    }}
                  >
                    ×{count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div 
          className="text-center text-xs max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>Each dig site hides unique treasures beneath layers of digital dirt.</p>
          <p className="mt-1">What ancient secrets will you uncover? 🔍</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}