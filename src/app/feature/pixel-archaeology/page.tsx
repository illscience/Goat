"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Tile {
  type: "empty" | "temple" | "house" | "road" | "artifact" | "wall" | "garden" | "statue" | "well";
  color: string;
  sandLevel: number; // 0-100, 100 = fully covered
}

interface Discovery {
  name: string;
  emoji: string;
  count: number;
}

const GRID_SIZE = 32;
const BRUSH_RADIUS = 2;

const TILE_COLORS: Record<string, string> = {
  empty: "#d4a574",
  temple: "#8b4513",
  house: "#a0522d",
  road: "#696969",
  artifact: "#ffd700",
  wall: "#808080",
  garden: "#228b22",
  statue: "#c0c0c0",
  well: "#4682b4",
};

const TILE_NAMES: Record<string, string> = {
  temple: "Ancient Temple",
  house: "Dwelling",
  road: "Stone Road",
  artifact: "Golden Artifact",
  wall: "City Wall",
  garden: "Sacred Garden",
  statue: "Stone Statue",
  well: "Water Well",
};

const TILE_EMOJIS: Record<string, string> = {
  temple: "🏛️",
  house: "🏠",
  road: "🛤️",
  artifact: "✨",
  wall: "🧱",
  garden: "🌿",
  statue: "🗿",
  well: "💧",
};

function generateCivilization(): Tile[][] {
  const grid: Tile[][] = [];
  
  // Initialize with empty tiles covered in sand
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = {
        type: "empty",
        color: TILE_COLORS.empty,
        sandLevel: 100,
      };
    }
  }

  // Determine civilization size (village, town, or metropolis)
  const civType = Math.random();
  let buildingCount: number;
  let hasTemple: boolean;
  let hasWalls: boolean;
  
  if (civType < 0.4) {
    // Village
    buildingCount = 5 + Math.floor(Math.random() * 8);
    hasTemple = Math.random() > 0.7;
    hasWalls = false;
  } else if (civType < 0.8) {
    // Town
    buildingCount = 15 + Math.floor(Math.random() * 15);
    hasTemple = Math.random() > 0.3;
    hasWalls = Math.random() > 0.5;
  } else {
    // Metropolis
    buildingCount = 35 + Math.floor(Math.random() * 25);
    hasTemple = true;
    hasWalls = true;
  }

  // Place city walls if applicable
  if (hasWalls) {
    const margin = 4;
    for (let x = margin; x < GRID_SIZE - margin; x++) {
      grid[margin][x] = { type: "wall", color: TILE_COLORS.wall, sandLevel: 100 };
      grid[GRID_SIZE - margin - 1][x] = { type: "wall", color: TILE_COLORS.wall, sandLevel: 100 };
    }
    for (let y = margin; y < GRID_SIZE - margin; y++) {
      grid[y][margin] = { type: "wall", color: TILE_COLORS.wall, sandLevel: 100 };
      grid[y][GRID_SIZE - margin - 1] = { type: "wall", color: TILE_COLORS.wall, sandLevel: 100 };
    }
  }

  // Place temple in center if applicable
  if (hasTemple) {
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        grid[centerY + dy][centerX + dx] = { type: "temple", color: TILE_COLORS.temple, sandLevel: 100 };
      }
    }
  }

  // Create main roads
  const roadY = Math.floor(GRID_SIZE / 2) + (hasTemple ? 3 : 0);
  const roadX = Math.floor(GRID_SIZE / 2) + (hasTemple ? 3 : 0);
  
  for (let x = 5; x < GRID_SIZE - 5; x++) {
    if (grid[roadY][x].type === "empty") {
      grid[roadY][x] = { type: "road", color: TILE_COLORS.road, sandLevel: 100 };
    }
  }
  for (let y = 5; y < GRID_SIZE - 5; y++) {
    if (grid[y][roadX].type === "empty") {
      grid[y][roadX] = { type: "road", color: TILE_COLORS.road, sandLevel: 100 };
    }
  }

  // Place buildings
  for (let i = 0; i < buildingCount; i++) {
    const x = 6 + Math.floor(Math.random() * (GRID_SIZE - 12));
    const y = 6 + Math.floor(Math.random() * (GRID_SIZE - 12));
    
    if (grid[y][x].type === "empty") {
      const buildingTypes: ("house" | "garden" | "well" | "statue")[] = ["house", "house", "house", "garden", "well", "statue"];
      const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
      grid[y][x] = { type, color: TILE_COLORS[type], sandLevel: 100 };
    }
  }

  // Scatter artifacts
  const artifactCount = 3 + Math.floor(Math.random() * 8);
  for (let i = 0; i < artifactCount; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (grid[y][x].type === "empty") {
      grid[y][x] = { type: "artifact", color: TILE_COLORS.artifact, sandLevel: 100 };
    }
  }

  return grid;
}

export default function PixelArchaeology() {
  const [grid, setGrid] = useState<Tile[][]>(() => generateCivilization());
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [excavationProgress, setExcavationProgress] = useState(0);
  const [isDigging, setIsDigging] = useState(false);
  const [siteName, setSiteName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const siteNames = [
    "Tell al-Pixelum", "Ruinas de Bitoria", "The Lost City of Bytezantium",
    "Hexadecimal Heights", "The Forgotten Sprites", "Rasteropolis",
    "The Vector Valley Tombs", "Palette Point", "The Dithered Dynasty"
  ];

  useEffect(() => {
    setSiteName(siteNames[Math.floor(Math.random() * siteNames.length)]);
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = grid[y][x];
        
        // Draw base tile
        ctx.fillStyle = tile.color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw sand overlay based on sand level
        if (tile.sandLevel > 0) {
          const sandAlpha = tile.sandLevel / 100;
          ctx.fillStyle = `rgba(194, 178, 128, ${sandAlpha})`;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          
          // Add sand texture dots
          if (tile.sandLevel > 20) {
            ctx.fillStyle = `rgba(160, 140, 100, ${sandAlpha * 0.5})`;
            for (let i = 0; i < 3; i++) {
              const dotX = x * cellSize + Math.random() * cellSize;
              const dotY = y * cellSize + Math.random() * cellSize;
              ctx.fillRect(dotX, dotY, 2, 2);
            }
          }
        }
        
        // Draw grid lines
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [grid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const dig = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (clientX - rect.left) * scaleX;
    const mouseY = (clientY - rect.top) * scaleY;
    
    const cellSize = canvas.width / GRID_SIZE;
    const gridX = Math.floor(mouseX / cellSize);
    const gridY = Math.floor(mouseY / cellSize);

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(tile => ({ ...tile })));
      const newDiscoveries: string[] = [];

      for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
        for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= BRUSH_RADIUS) {
              const tile = newGrid[ny][nx];
              const digAmount = Math.max(0, 15 - distance * 5);
              const oldLevel = tile.sandLevel;
              tile.sandLevel = Math.max(0, tile.sandLevel - digAmount);
              
              // Check if we just revealed something
              if (oldLevel > 20 && tile.sandLevel <= 20 && tile.type !== "empty") {
                newDiscoveries.push(tile.type);
              }
            }
          }
        }
      }

      // Update discoveries
      if (newDiscoveries.length > 0) {
        setDiscoveries(prev => {
          const updated = [...prev];
          newDiscoveries.forEach(type => {
            const existing = updated.find(d => d.name === TILE_NAMES[type]);
            if (existing) {
              existing.count++;
            } else {
              updated.push({
                name: TILE_NAMES[type],
                emoji: TILE_EMOJIS[type],
                count: 1
              });
            }
          });
          return updated;
        });
      }

      // Calculate excavation progress
      let totalSand = 0;
      let maxSand = 0;
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          maxSand += 100;
          totalSand += newGrid[y][x].sandLevel;
        }
      }
      setExcavationProgress(Math.round((1 - totalSand / maxSand) * 100));

      return newGrid;
    });

    drawGrid();
  }, [drawGrid]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    dig(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      dig(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDigging(true);
    const touch = e.touches[0];
    dig(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDigging && e.touches.length > 0) {
      const touch = e.touches[0];
      dig(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDigging(false);
  };

  const newExpedition = () => {
    setGrid(generateCivilization());
    setDiscoveries([]);
    setExcavationProgress(0);
    setSiteName(siteNames[Math.floor(Math.random() * siteNames.length)]);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <FeatureWrapper day={369} title="Pixel Archaeology" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center">
          <h2 
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Excavation Site: {siteName}
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click and drag to brush away the sands of time...
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div 
            className="relative rounded-lg overflow-hidden shadow-lg"
            style={{ border: "4px solid var(--color-border)" }}
          >
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="cursor-crosshair"
              style={{ maxWidth: "100%", height: "auto", touchAction: "none" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            {isDigging && (
              <div 
                className="absolute top-2 left-2 px-3 py-1 rounded-full text-sm animate-pulse"
                style={{ backgroundColor: "var(--color-accent)", color: "white" }}
              >
                🪥 Excavating...
              </div>
            )}
          </div>

          <div 
            className="w-full md:w-64 p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3 
              className="text-lg mb-3 font-bold"
              style={{ color: "var(--color-text)" }}
            >
              📋 Field Notes
            </h3>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--color-text-dim)" }}>Excavation Progress</span>
                <span style={{ color: "var(--color-accent)" }}>{excavationProgress}%</span>
              </div>
              <div 
                className="h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--color-border)" }}
              >
                <div 
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ 
                    width: `${excavationProgress}%`,
                    backgroundColor: "var(--color-accent)"
                  }}
                />
              </div>
            </div>

            <h4 
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Discoveries:
            </h4>
            
            {discoveries.length === 0 ? (
              <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                No artifacts found yet. Keep digging!
              </p>
            ) : (
              <ul className="space-y-1">
                {discoveries.map((d, i) => (
                  <li 
                    key={i}
                    className="text-sm flex items-center gap-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    <span>{d.emoji}</span>
                    <span>{d.name}</span>
                    {d.count > 1 && (
                      <span 
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                      >
                        ×{d.count}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={newExpedition}
              className="btn-primary w-full mt-4 py-2 px-4 rounded-lg font-semibold transition-transform hover:scale-105"
            >
              🗺️ New Expedition
            </button>
          </div>
        </div>

        <div 
          className="flex flex-wrap justify-center gap-4 text-xs p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: TILE_COLORS.temple }} />
            Temple
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: TILE_COLORS.house }} />
            Dwelling
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: TILE_COLORS.road }} />
            Road
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: TILE_COLORS.artifact }} />
            Artifact
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: TILE_COLORS.wall }} />
            Wall
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: TILE_COLORS.garden }} />
            Garden
          </span>
        </div>

        {excavationProgress >= 90 && (
          <div 
            className="text-center p-4 rounded-lg animate-pulse"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            🎉 Congratulations, Dr. Explorer! You&apos;ve uncovered most of {siteName}!
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}