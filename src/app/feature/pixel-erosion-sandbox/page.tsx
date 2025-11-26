"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

type MaterialType = "empty" | "sand" | "water" | "fire" | "stone" | "plant" | "wood";

interface Particle {
  type: MaterialType;
  updated: boolean;
  life?: number;
  growing?: boolean;
}

const MATERIALS: { type: MaterialType; emoji: string; color: string; name: string }[] = [
  { type: "sand", emoji: "🏖️", color: "#e6c86e", name: "Sand" },
  { type: "water", emoji: "💧", color: "#4a9eff", name: "Water" },
  { type: "fire", emoji: "🔥", color: "#ff6b35", name: "Fire" },
  { type: "stone", emoji: "🪨", color: "#6b7280", name: "Stone" },
  { type: "plant", emoji: "🌿", color: "#22c55e", name: "Plant" },
  { type: "wood", emoji: "🪵", color: "#8b5a2b", name: "Wood" },
];

const GRID_WIDTH = 160;
const GRID_HEIGHT = 120;
const CELL_SIZE = 4;

export default function PixelErosionSandbox() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("sand");
  const [brushSize, setBrushSize] = useState(3);
  const [isRunning, setIsRunning] = useState(true);
  const gridRef = useRef<Particle[][]>([]);
  const frameRef = useRef<number>(0);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const colorCacheRef = useRef<Map<string, string>>(new Map());

  const createEmptyGrid = useCallback(() => {
    const grid: Particle[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x] = { type: "empty", updated: false };
      }
    }
    return grid;
  }, []);

  const getColor = useCallback((particle: Particle, x: number, y: number): string => {
    if (particle.type === "empty") return "transparent";
    
    // Use position-based variation for stable colors
    const key = `${particle.type}-${x}-${y}`;
    const cached = colorCacheRef.current.get(key);
    if (cached) return cached;
    
    // Generate deterministic variation based on position
    const variation = ((x * 7 + y * 13) % 20) - 10;
    
    let color: string;
    switch (particle.type) {
      case "sand":
        color = `hsl(45, ${65 + variation * 0.5}%, ${68 + variation * 0.5}%)`;
        break;
      case "water":
        color = `hsl(210, ${75 + variation * 0.5}%, ${57 + variation * 0.3}%)`;
        break;
      case "fire":
        color = `hsl(${25 + variation}, 100%, ${55 + variation}%)`;
        break;
      case "stone":
        color = `hsl(0, 0%, ${45 + variation * 0.5}%)`;
        break;
      case "plant":
        color = `hsl(${125 + variation}, ${70 + variation}%, ${38 + variation * 0.5}%)`;
        break;
      case "wood":
        color = `hsl(25, ${55 + variation * 0.3}%, ${32 + variation * 0.3}%)`;
        break;
      default:
        color = "transparent";
    }
    
    colorCacheRef.current.set(key, color);
    return color;
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grid = gridRef.current;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const particle = grid[y]?.[x];
        if (particle && particle.type !== "empty") {
          ctx.fillStyle = getColor(particle, x, y);
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }, [getColor]);

  const updateGrid = useCallback(() => {
    const grid = gridRef.current;
    if (!grid || grid.length === 0) return;
    
    // Reset updated flags
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[y]?.[x]) {
          grid[y][x].updated = false;
        }
      }
    }

    // Update from bottom to top for falling particles
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      // Randomize horizontal direction for more natural movement
      const startX = Math.random() > 0.5 ? 0 : GRID_WIDTH - 1;
      const endX = startX === 0 ? GRID_WIDTH : -1;
      const stepX = startX === 0 ? 1 : -1;

      for (let x = startX; x !== endX; x += stepX) {
        const particle = grid[y]?.[x];
        if (!particle || particle.updated) continue;

        switch (particle.type) {
          case "sand":
            if (y < GRID_HEIGHT - 1) {
              const below = grid[y + 1]?.[x];
              if (below && (below.type === "empty" || below.type === "water")) {
                grid[y + 1][x] = { ...particle, updated: true };
                grid[y][x] = below.type === "water" ? { type: "water", updated: true } : { type: "empty", updated: false };
                // Clear color cache for swapped positions
                colorCacheRef.current.delete(`sand-${x}-${y + 1}`);
                colorCacheRef.current.delete(`water-${x}-${y}`);
              } else {
                const dir = Math.random() > 0.5 ? 1 : -1;
                const belowLeft = x > 0 ? grid[y + 1]?.[x - 1] : null;
                const belowRight = x < GRID_WIDTH - 1 ? grid[y + 1]?.[x + 1] : null;
                const target = dir === -1 ? belowLeft : belowRight;
                const targetX = dir === -1 ? x - 1 : x + 1;
                
                if (target && (target.type === "empty" || target.type === "water")) {
                  grid[y + 1][targetX] = { ...particle, updated: true };
                  grid[y][x] = target.type === "water" ? { type: "water", updated: true } : { type: "empty", updated: false };
                  colorCacheRef.current.delete(`sand-${targetX}-${y + 1}`);
                }
              }
            }
            break;

          case "water":
            if (y < GRID_HEIGHT - 1) {
              const below = grid[y + 1]?.[x];
              if (below && below.type === "empty") {
                grid[y + 1][x] = { ...particle, updated: true };
                grid[y][x] = { type: "empty", updated: false };
                colorCacheRef.current.delete(`water-${x}-${y + 1}`);
              } else {
                // Flow horizontally
                const dir = Math.random() > 0.5 ? 1 : -1;
                const side1 = x + dir >= 0 && x + dir < GRID_WIDTH ? grid[y]?.[x + dir] : null;
                const side2 = x - dir >= 0 && x - dir < GRID_WIDTH ? grid[y]?.[x - dir] : null;
                
                if (side1 && side1.type === "empty") {
                  grid[y][x + dir] = { ...particle, updated: true };
                  grid[y][x] = { type: "empty", updated: false };
                  colorCacheRef.current.delete(`water-${x + dir}-${y}`);
                } else if (side2 && side2.type === "empty") {
                  grid[y][x - dir] = { ...particle, updated: true };
                  grid[y][x] = { type: "empty", updated: false };
                  colorCacheRef.current.delete(`water-${x - dir}-${y}`);
                }
              }
            } else {
              // At bottom, try to flow horizontally
              const dir = Math.random() > 0.5 ? 1 : -1;
              const side = x + dir >= 0 && x + dir < GRID_WIDTH ? grid[y]?.[x + dir] : null;
              if (side && side.type === "empty") {
                grid[y][x + dir] = { ...particle, updated: true };
                grid[y][x] = { type: "empty", updated: false };
                colorCacheRef.current.delete(`water-${x + dir}-${y}`);
              }
            }
            break;

          case "fire":
            particle.life = (particle.life ?? 50) - 1;
            if (particle.life <= 0 || Math.random() < 0.02) {
              grid[y][x] = { type: "empty", updated: false };
              colorCacheRef.current.delete(`fire-${x}-${y}`);
            } else {
              // Spread fire
              const neighbors = [
                { dy: -1, dx: 0 }, { dy: 1, dx: 0 },
                { dy: 0, dx: -1 }, { dy: 0, dx: 1 },
                { dy: -1, dx: -1 }, { dy: -1, dx: 1 },
              ];
              for (const { dy, dx } of neighbors) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < GRID_HEIGHT && nx >= 0 && nx < GRID_WIDTH) {
                  const neighbor = grid[ny]?.[nx];
                  if (neighbor && (neighbor.type === "plant" || neighbor.type === "wood") && Math.random() < 0.1) {
                    grid[ny][nx] = { type: "fire", updated: true, life: 30 + Math.random() * 20 };
                    colorCacheRef.current.delete(`fire-${nx}-${ny}`);
                  } else if (neighbor && neighbor.type === "water") {
                    grid[y][x] = { type: "empty", updated: false };
                    grid[ny][nx] = { type: "empty", updated: false };
                    colorCacheRef.current.delete(`fire-${x}-${y}`);
                    colorCacheRef.current.delete(`water-${nx}-${ny}`);
                  }
                }
              }
              // Fire rises
              if (y > 0 && grid[y - 1]?.[x]?.type === "empty" && Math.random() < 0.3) {
                grid[y - 1][x] = { type: "fire", updated: true, life: (particle.life ?? 30) - 10 };
                colorCacheRef.current.delete(`fire-${x}-${y - 1}`);
              }
            }
            break;

          case "plant":
            // Plants grow upward occasionally
            if (Math.random() < 0.005 && y > 0) {
              const above = grid[y - 1]?.[x];
              if (above && above.type === "empty") {
                grid[y - 1][x] = { type: "plant", updated: true, growing: true };
                colorCacheRef.current.delete(`plant-${x}-${y - 1}`);
              }
            }
            // Spread sideways occasionally
            if (Math.random() < 0.002) {
              const dir = Math.random() > 0.5 ? 1 : -1;
              const nx = x + dir;
              if (nx >= 0 && nx < GRID_WIDTH && grid[y]?.[nx]?.type === "empty") {
                grid[y][nx] = { type: "plant", updated: true };
                colorCacheRef.current.delete(`plant-${nx}-${y}`);
              }
            }
            // Water helps plants grow
            const plantNeighbors = [
              { dy: -1, dx: 0 }, { dy: 1, dx: 0 },
              { dy: 0, dx: -1 }, { dy: 0, dx: 1 },
            ];
            for (const { dy, dx } of plantNeighbors) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < GRID_HEIGHT && nx >= 0 && nx < GRID_WIDTH) {
                if (grid[ny]?.[nx]?.type === "water" && Math.random() < 0.02) {
                  grid[ny][nx] = { type: "plant", updated: true };
                  colorCacheRef.current.delete(`plant-${nx}-${ny}`);
                }
              }
            }
            break;

          case "wood":
            // Wood is static but can burn
            break;

          case "stone":
            // Stone is completely static
            break;
        }
      }
    }
  }, []);

  const paintAt = useCallback((canvasX: number, canvasY: number) => {
    const grid = gridRef.current;
    if (!grid || grid.length === 0) return;
    
    const gridX = Math.floor(canvasX / CELL_SIZE);
    const gridY = Math.floor(canvasY / CELL_SIZE);

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          const x = gridX + dx;
          const y = gridY + dy;
          if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            const currentCell = grid[y]?.[x];
            if (currentCell && (selectedMaterial === "empty" || currentCell.type === "empty")) {
              grid[y][x] = {
                type: selectedMaterial,
                updated: false,
                life: selectedMaterial === "fire" ? 50 + Math.random() * 30 : undefined,
              };
              // Clear color cache for new particle
              colorCacheRef.current.delete(`${selectedMaterial}-${x}-${y}`);
            }
          }
        }
      }
    }
  }, [selectedMaterial, brushSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      paintAt(x, y);
      lastPosRef.current = { x, y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Interpolate between last position and current for smooth drawing
      if (lastPosRef.current) {
        const dx = x - lastPosRef.current.x;
        const dy = y - lastPosRef.current.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
        for (let i = 0; i <= steps; i++) {
          const px = lastPosRef.current.x + (dx * i) / steps;
          const py = lastPosRef.current.y + (dy * i) / steps;
          paintAt(px, py);
        }
      }
      lastPosRef.current = { x, y };
    }
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearGrid = () => {
    gridRef.current = createEmptyGrid();
    colorCacheRef.current.clear();
  };

  useEffect(() => {
    gridRef.current = createEmptyGrid();
  }, [createEmptyGrid]);

  useEffect(() => {
    const animate = () => {
      if (isRunning) {
        updateGrid();
      }
      drawGrid();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning, updateGrid, drawGrid]);

  return (
    <FeatureWrapper day={361} title="Pixel Erosion Sandbox" emoji="⏳">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <p className="text-lg text-gray-400">
            Paint with physics! Watch sand pile up, water flow around obstacles, 
            fire spread and consume, and plants grow. Your own tiny world simulator.
          </p>
        </div>

        {/* Material Palette */}
        <div className="flex flex-wrap justify-center gap-2">
          {MATERIALS.map((material) => (
            <button
              key={material.type}
              onClick={() => setSelectedMaterial(material.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                selectedMaterial === material.type
                  ? "ring-2 ring-offset-2 ring-blue-500"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{
                backgroundColor: material.color,
                color: material.type === "water" || material.type === "plant" ? "#fff" : "#000",
              }}
            >
              <span>{material.emoji}</span>
              <span className="font-medium">{material.name}</span>
            </button>
          ))}
          <button
            onClick={() => setSelectedMaterial("empty")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all border-gray-500 text-gray-300 ${
              selectedMaterial === "empty"
                ? "ring-2 ring-offset-2 ring-blue-500"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span>🧹</span>
            <span className="font-medium">Erase</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">
              Brush Size:
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm w-6 text-center text-gray-300">
              {brushSize}
            </span>
          </div>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            {isRunning ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button
            onClick={clearGrid}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            🗑️ Clear All
          </button>
        </div>

        {/* Canvas */}
        <div
          className="rounded-xl overflow-hidden shadow-2xl border-4 border-gray-600"
        >
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair block"
          />
        </div>

        {/* Tips */}
        <div className="text-center text-sm max-w-md text-gray-400">
          <p className="font-medium mb-2">🎮 Pro Tips:</p>
          <ul className="space-y-1">
            <li>• Build walls with stone to contain liquids</li>
            <li>• Water extinguishes fire (and vice versa!)</li>
            <li>• Plants grow faster near water</li>
            <li>• Wood burns longer than plants</li>
            <li>• Click and drag to paint continuously</li>
          </ul>
        </div>
      </div>
    </FeatureWrapper>
  );
}