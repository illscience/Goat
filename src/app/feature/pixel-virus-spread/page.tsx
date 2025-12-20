"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Cell {
  strain: number; // 0 = empty, -1 = immune, 1+ = virus strain
  infectionTime: number;
  immuneUntil: number;
}

interface VirusStrain {
  id: number;
  color: string;
  name: string;
  infectionRate: number; // 0-1, chance to spread per tick
  immunityPeriod: number; // ticks until immunity wears off
  mutationChance: number; // 0-1, chance to mutate when spreading
  incubationTime: number; // ticks before cell becomes infectious
}

const STRAIN_NAMES = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
  "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi"
];

const STRAIN_COLORS = [
  "#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3", "#f38181",
  "#aa96da", "#fcbad3", "#a8d8ea", "#ff9a3c", "#7fcd91",
  "#c9b1ff", "#ffb347", "#87ceeb", "#dda0dd", "#98d8c8"
];

export default function PixelVirusSpread() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const gridRef = useRef<Cell[][]>([]);
  const strainsRef = useRef<Map<number, VirusStrain>>(new Map());
  
  const [gridSize] = useState(100);
  const [cellSize, setCellSize] = useState(6);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(50);
  const [strains, setStrains] = useState<VirusStrain[]>([]);
  const [stats, setStats] = useState<{ [key: number]: number }>({});
  const [tool, setTool] = useState<"virus" | "immunity">("virus");
  const [totalInfected, setTotalInfected] = useState(0);
  const [totalImmune, setTotalImmune] = useState(0);
  const tickRef = useRef<number>(0);

  const createStrain = useCallback((id: number): VirusStrain => {
    return {
      id,
      color: STRAIN_COLORS[(id - 1) % STRAIN_COLORS.length],
      name: STRAIN_NAMES[(id - 1) % STRAIN_NAMES.length],
      infectionRate: 0.15 + Math.random() * 0.35,
      immunityPeriod: 100 + Math.floor(Math.random() * 200),
      mutationChance: 0.02 + Math.random() * 0.08,
      incubationTime: 3 + Math.floor(Math.random() * 7),
    };
  }, []);

  const initGrid = useCallback(() => {
    const grid: Cell[][] = [];
    for (let y = 0; y < gridSize; y++) {
      grid[y] = [];
      for (let x = 0; x < gridSize; x++) {
        grid[y][x] = { strain: 0, infectionTime: 0, immuneUntil: 0 };
      }
    }
    gridRef.current = grid;
    strainsRef.current.clear();
    setStrains([]);
    tickRef.current = 0;
  }, [gridSize]);

  const addVirusAt = useCallback((x: number, y: number) => {
    const grid = gridRef.current;
    if (!grid[y] || !grid[y][x]) return;
    
    const cell = grid[y][x];
    if (cell.strain !== 0) return;
    
    const newId = strainsRef.current.size + 1;
    const newStrain = createStrain(newId);
    strainsRef.current.set(newId, newStrain);
    
    cell.strain = newId;
    cell.infectionTime = tickRef.current;
    
    setStrains(Array.from(strainsRef.current.values()));
  }, [createStrain]);

  const addImmunityAt = useCallback((x: number, y: number, radius: number = 3) => {
    const grid = gridRef.current;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          if (dx * dx + dy * dy <= radius * radius) {
            grid[ny][nx] = { strain: -1, infectionTime: 0, immuneUntil: Infinity };
          }
        }
      }
    }
  }, [gridSize]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    if (tool === "virus") {
      addVirusAt(x, y);
    } else {
      addImmunityAt(x, y);
    }
  }, [cellSize, tool, addVirusAt, addImmunityAt]);

  const tick = useCallback(() => {
    const grid = gridRef.current;
    const currentTick = tickRef.current;
    const changes: { x: number; y: number; strain: number; time: number }[] = [];
    
    // Check immunity expiration first
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        if (cell.strain === -1 && cell.immuneUntil !== Infinity && currentTick >= cell.immuneUntil) {
          cell.strain = 0;
          cell.immuneUntil = 0;
        }
      }
    }
    
    // Process infections
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        if (cell.strain > 0) {
          const strain = strainsRef.current.get(cell.strain);
          if (!strain) continue;
          
          // Check if past incubation
          if (currentTick - cell.infectionTime < strain.incubationTime) continue;
          
          // Try to spread to neighbors
          const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
          ];
          
          for (const [nx, ny] of neighbors) {
            if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
            
            const neighbor = grid[ny][nx];
            if (neighbor.strain !== 0) continue;
            
            if (Math.random() < strain.infectionRate) {
              let newStrain = cell.strain;
              
              // Check for mutation
              if (Math.random() < strain.mutationChance) {
                const mutantId = strainsRef.current.size + 1;
                const mutant = createStrain(mutantId);
                strainsRef.current.set(mutantId, mutant);
                newStrain = mutantId;
              }
              
              changes.push({ x: nx, y: ny, strain: newStrain, time: currentTick });
            }
          }
          
          // Recovery after some time
          const recoveryChance = (currentTick - cell.infectionTime) / (strain.immunityPeriod * 2);
          if (Math.random() < recoveryChance * 0.1) {
            cell.strain = -1;
            cell.immuneUntil = currentTick + strain.immunityPeriod;
          }
        }
      }
    }
    
    // Apply changes
    for (const change of changes) {
      const cell = grid[change.y][change.x];
      if (cell.strain === 0) {
        cell.strain = change.strain;
        cell.infectionTime = change.time;
      }
    }
    
    tickRef.current++;
    setStrains(Array.from(strainsRef.current.values()));
  }, [gridSize, createStrain]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const grid = gridRef.current;
    const currentTick = tickRef.current;
    const strainCounts: { [key: number]: number } = {};
    let infected = 0;
    let immune = 0;
    
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        
        if (cell.strain === -1) {
          // Immune cell
          ctx.fillStyle = "#3a3a5e";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
          immune++;
        } else if (cell.strain > 0) {
          const strain = strainsRef.current.get(cell.strain);
          if (strain) {
            // Calculate color based on infection stage
            const age = currentTick - cell.infectionTime;
            const incubating = age < strain.incubationTime;
            
            if (incubating) {
              // Darker during incubation
              ctx.fillStyle = strain.color + "80";
            } else {
              // Pulsing effect when infectious
              const pulse = Math.sin(currentTick * 0.2 + x + y) * 0.2 + 0.8;
              ctx.globalAlpha = pulse;
              ctx.fillStyle = strain.color;
            }
            
            ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
            ctx.globalAlpha = 1;
            
            strainCounts[cell.strain] = (strainCounts[cell.strain] || 0) + 1;
            infected++;
          }
        }
      }
    }
    
    setStats(strainCounts);
    setTotalInfected(infected);
    setTotalImmune(immune);
  }, [gridSize, cellSize]);

  useEffect(() => {
    initGrid();
    
    const handleResize = () => {
      const maxWidth = Math.min(600, window.innerWidth - 40);
      const newCellSize = Math.floor(maxWidth / gridSize);
      setCellSize(Math.max(4, newCellSize));
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gridSize, initGrid]);

  useEffect(() => {
    let lastTick = 0;
    
    const animate = (time: number) => {
      if (isRunning && time - lastTick > (100 - speed)) {
        tick();
        lastTick = time;
      }
      draw();
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRunning, speed, tick, draw]);

  return (
    <FeatureWrapper day={385} title="Pixel Virus Spread" emoji="🦠">
      <div className="flex flex-col items-center gap-6 p-4">
        <p className="text-center max-w-lg" style={{ color: "var(--color-text-dim)" }}>
          Watch digital epidemiology unfold! Click to introduce new virus strains or create immunity barriers.
          Each strain has unique infection rates, mutation chances, and immunity periods.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isRunning ? "⏸️ Pause" : "▶️ Play"}
          </button>
          
          <button
            onClick={initGrid}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            🔄 Reset
          </button>
          
          <button
            onClick={() => setTool("virus")}
            className={`px-4 py-2 rounded-lg transition-all ${
              tool === "virus" ? "btn-primary" : "btn-secondary"
            }`}
          >
            🦠 Add Virus
          </button>
          
          <button
            onClick={() => setTool("immunity")}
            className={`px-4 py-2 rounded-lg transition-all ${
              tool === "immunity" ? "btn-primary" : "btn-secondary"
            }`}
          >
            🛡️ Add Immunity
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-3">
          <span style={{ color: "var(--color-text-dim)" }}>🐌</span>
          <input
            type="range"
            min="10"
            max="95"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-32"
          />
          <span style={{ color: "var(--color-text-dim)" }}>🚀</span>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={gridSize * cellSize}
          height={gridSize * cellSize}
          onClick={handleCanvasClick}
          className="rounded-lg cursor-crosshair border-2"
          style={{ 
            borderColor: "var(--color-border)",
            imageRendering: "pixelated"
          }}
        />

        {/* Stats */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="px-3 py-1 rounded-full" style={{ background: "var(--color-bg-secondary)" }}>
            🦠 Infected: <span style={{ color: "#ff6b6b" }}>{totalInfected.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1 rounded-full" style={{ background: "var(--color-bg-secondary)" }}>
            🛡️ Immune: <span style={{ color: "#4ecdc4" }}>{totalImmune.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1 rounded-full" style={{ background: "var(--color-bg-secondary)" }}>
            🧬 Strains: <span style={{ color: "#ffe66d" }}>{strains.length}</span>
          </div>
        </div>

        {/* Strain Legend */}
        {strains.length > 0 && (
          <div 
            className="p-4 rounded-lg max-w-lg w-full"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <h3 
              className="text-center mb-3 font-semibold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Active Strains
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {strains.slice(0, 12).map((strain) => (
                <div key={strain.id} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ background: strain.color }}
                  />
                  <span style={{ color: "var(--color-text-dim)" }}>
                    {strain.name}: <span style={{ color: strain.color }}>{stats[strain.id] || 0}</span>
                  </span>
                </div>
              ))}
            </div>
            {strains.length > 12 && (
              <p className="text-center mt-2 text-xs" style={{ color: "var(--color-text-dim)" }}>
                +{strains.length - 12} more mutations...
              </p>
            )}
          </div>
        )}

        {strains.length === 0 && (
          <p className="text-center animate-pulse" style={{ color: "var(--color-text-dim)" }}>
            👆 Click the canvas to introduce Patient Zero!
          </p>
        )}
      </div>
    </FeatureWrapper>
  );
}