"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

type CellType = 
  | "dirt" 
  | "empty" 
  | "pottery" 
  | "coin" 
  | "bone" 
  | "gem" 
  | "wall" 
  | "floor" 
  | "statue" 
  | "gold";

type HistoricalPeriod = {
  name: string;
  era: string;
  description: string;
  color: string;
  artifacts: CellType[];
};

const PERIODS: HistoricalPeriod[] = [
  {
    name: "Ancient Rome",
    era: "100 BCE - 400 CE",
    description: "A villa from the height of the Roman Empire",
    color: "#8B4513",
    artifacts: ["coin", "pottery", "wall", "floor", "statue"],
  },
  {
    name: "Bronze Age",
    era: "3000 - 1200 BCE",
    description: "A burial site with precious offerings",
    color: "#CD853F",
    artifacts: ["bone", "pottery", "gold", "gem"],
  },
  {
    name: "Medieval Europe",
    era: "500 - 1500 CE",
    description: "Ruins of a forgotten monastery",
    color: "#696969",
    artifacts: ["coin", "bone", "wall", "floor", "gem"],
  },
  {
    name: "Ancient Egypt",
    era: "3100 - 30 BCE",
    description: "A tomb entrance with sacred treasures",
    color: "#DAA520",
    artifacts: ["gold", "statue", "gem", "wall", "pottery"],
  },
];

const GRID_SIZE = 16;

type Cell = {
  type: CellType;
  dug: boolean;
  depth: number;
};

const ARTIFACT_INFO: Record<CellType, { emoji: string; name: string; points: number }> = {
  dirt: { emoji: "🟫", name: "Dirt", points: 0 },
  empty: { emoji: "⬜", name: "Empty", points: 1 },
  pottery: { emoji: "🏺", name: "Pottery Shard", points: 15 },
  coin: { emoji: "🪙", name: "Ancient Coin", points: 25 },
  bone: { emoji: "🦴", name: "Bone Fragment", points: 10 },
  gem: { emoji: "💎", name: "Precious Gem", points: 50 },
  wall: { emoji: "🧱", name: "Stone Wall", points: 5 },
  floor: { emoji: "🔲", name: "Mosaic Floor", points: 20 },
  statue: { emoji: "🗿", name: "Statue Fragment", points: 40 },
  gold: { emoji: "✨", name: "Gold Artifact", points: 75 },
};

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [period, setPeriod] = useState<HistoricalPeriod | null>(null);
  const [score, setScore] = useState(0);
  const [digs, setDigs] = useState(0);
  const [maxDigs] = useState(80);
  const [discoveries, setDiscoveries] = useState<Record<CellType, number>>({} as Record<CellType, number>);
  const [lastDiscovery, setLastDiscovery] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const lastDiscoveryTimeout = useRef<NodeJS.Timeout | null>(null);

  const generateSite = useCallback(() => {
    const selectedPeriod = PERIODS[Math.floor(Math.random() * PERIODS.length)];
    setPeriod(selectedPeriod);
    
    const newGrid: Cell[][] = [];
    
    // Initialize with dirt
    for (let y = 0; y < GRID_SIZE; y++) {
      newGrid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        newGrid[y][x] = {
          type: "dirt",
          dug: false,
          depth: Math.floor(Math.random() * 3) + 1,
        };
      }
    }
    
    // Generate structure based on period
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    
    // Add walls (rectangular structure)
    const structureSize = 4 + Math.floor(Math.random() * 3);
    for (let i = -structureSize; i <= structureSize; i++) {
      if (centerY - structureSize >= 0 && centerX + i >= 0 && centerX + i < GRID_SIZE) {
        newGrid[centerY - structureSize][centerX + i].type = "wall";
      }
      if (centerY + structureSize < GRID_SIZE && centerX + i >= 0 && centerX + i < GRID_SIZE) {
        newGrid[centerY + structureSize][centerX + i].type = "wall";
      }
      if (centerX - structureSize >= 0 && centerY + i >= 0 && centerY + i < GRID_SIZE) {
        newGrid[centerY + i][centerX - structureSize].type = "wall";
      }
      if (centerX + structureSize < GRID_SIZE && centerY + i >= 0 && centerY + i < GRID_SIZE) {
        newGrid[centerY + i][centerX + structureSize].type = "wall";
      }
    }
    
    // Add floor tiles inside structure
    for (let y = centerY - structureSize + 1; y < centerY + structureSize; y++) {
      for (let x = centerX - structureSize + 1; x < centerX + structureSize; x++) {
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
          if (Math.random() < 0.3) {
            newGrid[y][x].type = "floor";
          }
        }
      }
    }
    
    // Scatter artifacts based on period
    const artifactCount = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < artifactCount; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[y][x].type === "dirt" || newGrid[y][x].type === "floor") {
        const artifactTypes = selectedPeriod.artifacts.filter(a => a !== "wall" && a !== "floor");
        newGrid[y][x].type = artifactTypes[Math.floor(Math.random() * artifactTypes.length)];
      }
    }
    
    // Add some empty spaces
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (newGrid[y][x].type === "dirt" && Math.random() < 0.4) {
          newGrid[y][x].type = "empty";
        }
      }
    }
    
    setGrid(newGrid);
    setScore(0);
    setDigs(0);
    setDiscoveries({} as Record<CellType, number>);
    setLastDiscovery(null);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    generateSite();
  }, [generateSite]);

  useEffect(() => {
    return () => {
      if (lastDiscoveryTimeout.current) {
        clearTimeout(lastDiscoveryTimeout.current);
      }
    };
  }, []);

  const handleDig = (x: number, y: number) => {
    if (isComplete || digs >= maxDigs) return;
    
    const cell = grid[y][x];
    if (cell.dug) return;
    
    const newGrid = [...grid];
    newGrid[y] = [...newGrid[y]];
    
    if (cell.depth > 1) {
      newGrid[y][x] = { ...cell, depth: cell.depth - 1 };
    } else {
      newGrid[y][x] = { ...cell, dug: true };
      
      const artifact = ARTIFACT_INFO[cell.type];
      setScore(prev => prev + artifact.points);
      
      if (cell.type !== "dirt" && cell.type !== "empty") {
        setDiscoveries(prev => ({
          ...prev,
          [cell.type]: (prev[cell.type] || 0) + 1,
        }));
        setLastDiscovery(`${artifact.emoji} ${artifact.name}! +${artifact.points}`);
        
        if (lastDiscoveryTimeout.current) {
          clearTimeout(lastDiscoveryTimeout.current);
        }
        lastDiscoveryTimeout.current = setTimeout(() => setLastDiscovery(null), 2000);
      }
    }
    
    setGrid(newGrid);
    setDigs(prev => prev + 1);
    
    if (digs + 1 >= maxDigs) {
      setIsComplete(true);
    }
  };

  const getCellColor = (cell: Cell): string => {
    if (!cell.dug) {
      const dirtColors = ["#8B4513", "#A0522D", "#6B4423"];
      return dirtColors[cell.depth - 1] || dirtColors[0];
    }
    
    switch (cell.type) {
      case "empty": return "#D2B48C";
      case "wall": return "#808080";
      case "floor": return "#BC8F8F";
      default: return "#F5DEB3";
    }
  };

  const getCellEmoji = (cell: Cell): string => {
    if (!cell.dug) return "";
    return ARTIFACT_INFO[cell.type].emoji;
  };

  const revealedCount = grid.flat().filter(c => c.dug).length;
  const totalCells = GRID_SIZE * GRID_SIZE;
  const revealPercentage = Math.round((revealedCount / totalCells) * 100);

  return (
    <FeatureWrapper day={411} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            {period?.name || "Loading..."}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            {period?.era} • {period?.description}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            🏆 Score: <span className="font-bold">{score}</span>
          </div>
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            ⛏️ Digs: <span className="font-bold">{digs}/{maxDigs}</span>
          </div>
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            📊 Revealed: <span className="font-bold">{revealPercentage}%</span>
          </div>
        </div>

        {lastDiscovery && (
          <div 
            className="px-4 py-2 rounded-lg animate-pulse font-bold"
            style={{ 
              backgroundColor: "var(--color-accent)", 
              color: "white",
            }}
          >
            {lastDiscovery}
          </div>
        )}

        <div 
          className="rounded-lg overflow-hidden shadow-lg"
          style={{ 
            border: "4px solid var(--color-border)",
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <button
                key={`${x}-${y}`}
                onClick={() => handleDig(x, y)}
                disabled={cell.dug || isComplete}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm transition-all hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: getCellColor(cell),
                  cursor: cell.dug || isComplete ? "default" : "pointer",
                  opacity: !cell.dug && cell.depth < 3 ? 0.8 + (3 - cell.depth) * 0.1 : 1,
                }}
                title={cell.dug ? ARTIFACT_INFO[cell.type].name : `Dig here (depth: ${cell.depth})`}
              >
                {getCellEmoji(cell)}
              </button>
            ))
          )}
        </div>

        {Object.keys(discoveries).length > 0 && (
          <div 
            className="p-4 rounded-lg w-full max-w-md"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
              📜 Field Journal
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(discoveries).map(([type, count]) => (
                <span 
                  key={type}
                  className="px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  {ARTIFACT_INFO[type as CellType].emoji} ×{count}
                </span>
              ))}
            </div>
          </div>
        )}

        {isComplete && (
          <div 
            className="p-6 rounded-lg text-center max-w-md"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)",
              border: "2px solid var(--color-accent)",
            }}
          >
            <h3 
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🎉 Excavation Complete!
            </h3>
            <p style={{ color: "var(--color-text-dim)" }} className="mb-4">
              You&apos;ve uncovered {revealPercentage}% of the site and scored {score} points.
              {score > 500 ? " Outstanding work, archaeologist!" : 
               score > 300 ? " A successful dig!" : 
               " Keep practicing your technique!"}
            </p>
            <button 
              onClick={generateSite}
              className="btn-primary px-6 py-2 rounded-lg"
            >
              🗺️ New Dig Site
            </button>
          </div>
        )}

        {!isComplete && (
          <button 
            onClick={generateSite}
            className="btn-secondary px-4 py-2 rounded-lg text-sm"
          >
            🔄 Abandon Site & Start New Dig
          </button>
        )}

        <p 
          className="text-xs text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Click tiles to dig. Darker soil means deeper layers. 
          Each dig reveals what lies beneath—treasures, structures, or just ancient dirt.
        </p>
      </div>
    </FeatureWrapper>
  );
}