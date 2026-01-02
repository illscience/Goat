"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Cell {
  dirtLevel: number; // 0-4 (0 = fully excavated)
  artifact: ArtifactType | null;
  revealed: boolean;
}

type ArtifactType = 
  | "bone" 
  | "pottery" 
  | "coin" 
  | "skull" 
  | "gem" 
  | "tool" 
  | "statue" 
  | "tablet"
  | "ring"
  | "vase";

interface HistoricalPeriod {
  name: string;
  era: string;
  artifacts: ArtifactType[];
  colors: {
    dirt: string[];
    background: string;
  };
}

const HISTORICAL_PERIODS: HistoricalPeriod[] = [
  {
    name: "Ancient Egypt",
    era: "3000 BCE",
    artifacts: ["skull", "pottery", "coin", "tablet", "statue", "ring"],
    colors: {
      dirt: ["#8B7355", "#A0826D", "#B8956F", "#D4A574", "#E8C49A"],
      background: "#F5E6D3"
    }
  },
  {
    name: "Roman Empire",
    era: "100 CE",
    artifacts: ["coin", "pottery", "statue", "tool", "vase", "ring"],
    colors: {
      dirt: ["#6B5344", "#7D6352", "#8F7360", "#A1836E", "#B3937C"],
      background: "#E8DDD0"
    }
  },
  {
    name: "Prehistoric",
    era: "10000 BCE",
    artifacts: ["bone", "skull", "tool", "pottery", "gem"],
    colors: {
      dirt: ["#5C4A3D", "#6E5A4B", "#806A59", "#927A67", "#A48A75"],
      background: "#D9CFC2"
    }
  },
  {
    name: "Medieval",
    era: "1200 CE",
    artifacts: ["coin", "ring", "tool", "pottery", "gem", "tablet"],
    colors: {
      dirt: ["#4A4A4A", "#5C5C5C", "#6E6E6E", "#808080", "#929292"],
      background: "#E0E0E0"
    }
  }
];

const ARTIFACT_EMOJIS: Record<ArtifactType, string> = {
  bone: "🦴",
  pottery: "🏺",
  coin: "🪙",
  skull: "💀",
  gem: "💎",
  tool: "🪓",
  statue: "🗿",
  tablet: "📜",
  ring: "💍",
  vase: "🏛️"
};

const ARTIFACT_VALUES: Record<ArtifactType, number> = {
  bone: 10,
  pottery: 25,
  coin: 50,
  skull: 75,
  gem: 150,
  tool: 30,
  statue: 200,
  tablet: 100,
  ring: 125,
  vase: 80
};

const GRID_SIZE = 16;
const CELL_SIZE = 28;

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [period, setPeriod] = useState<HistoricalPeriod | null>(null);
  const [score, setScore] = useState(0);
  const [artifactsFound, setArtifactsFound] = useState<ArtifactType[]>([]);
  const [brushSize, setBrushSize] = useState(1);
  const [isDigging, setIsDigging] = useState(false);
  const [totalArtifacts, setTotalArtifacts] = useState(0);
  const [brushStrokes, setBrushStrokes] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);

  const generateSite = useCallback(() => {
    const randomPeriod = HISTORICAL_PERIODS[Math.floor(Math.random() * HISTORICAL_PERIODS.length)];
    setPeriod(randomPeriod);
    setScore(0);
    setArtifactsFound([]);
    setBrushStrokes(0);
    setGameComplete(false);

    const newGrid: Cell[][] = [];
    let artifactCount = 0;

    // Generate base grid
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({
          dirtLevel: 4,
          artifact: null,
          revealed: false
        });
      }
      newGrid.push(row);
    }

    // Place artifacts in patterns
    const numArtifacts = 8 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numArtifacts; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const artifact = randomPeriod.artifacts[Math.floor(Math.random() * randomPeriod.artifacts.length)];
      
      if (!newGrid[y][x].artifact) {
        newGrid[y][x].artifact = artifact;
        artifactCount++;
      }
    }

    // Add some artifact clusters
    for (let c = 0; c < 2; c++) {
      const centerX = 2 + Math.floor(Math.random() * (GRID_SIZE - 4));
      const centerY = 2 + Math.floor(Math.random() * (GRID_SIZE - 4));
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (Math.random() > 0.5 && !newGrid[centerY + dy][centerX + dx].artifact) {
            newGrid[centerY + dy][centerX + dx].artifact = 
              randomPeriod.artifacts[Math.floor(Math.random() * randomPeriod.artifacts.length)];
            artifactCount++;
          }
        }
      }
    }

    setTotalArtifacts(artifactCount);
    setGrid(newGrid);
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !period || grid.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = period.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell.dirtLevel > 0) {
          ctx.fillStyle = period.colors.dirt[cell.dirtLevel];
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          
          // Add texture
          ctx.fillStyle = `rgba(0,0,0,${0.05 * cell.dirtLevel})`;
          for (let i = 0; i < 3; i++) {
            const tx = px + Math.random() * CELL_SIZE;
            const ty = py + Math.random() * CELL_SIZE;
            ctx.fillRect(tx, ty, 2, 2);
          }
        } else if (cell.artifact && cell.revealed) {
          ctx.fillStyle = period.colors.background;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          
          ctx.font = `${CELL_SIZE - 6}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            ARTIFACT_EMOJIS[cell.artifact],
            px + CELL_SIZE / 2,
            py + CELL_SIZE / 2
          );
        } else {
          ctx.fillStyle = period.colors.background;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        }

        // Grid lines
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [grid, period]);

  useEffect(() => {
    generateSite();
  }, [generateSite]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const dig = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || gameComplete) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    // Avoid processing the same cell repeatedly during drag
    if (lastCellRef.current?.x === x && lastCellRef.current?.y === y) return;
    lastCellRef.current = { x, y };

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      let newArtifacts: ArtifactType[] = [];

      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const cell = newGrid[ny][nx];
            if (cell.dirtLevel > 0) {
              cell.dirtLevel = Math.max(0, cell.dirtLevel - 1);
              
              if (cell.dirtLevel === 0 && cell.artifact && !cell.revealed) {
                cell.revealed = true;
                newArtifacts.push(cell.artifact);
              }
            }
          }
        }
      }

      if (newArtifacts.length > 0) {
        setArtifactsFound(prev => [...prev, ...newArtifacts]);
        setScore(prev => prev + newArtifacts.reduce((sum, a) => sum + ARTIFACT_VALUES[a], 0));
      }

      return newGrid;
    });

    setBrushStrokes(prev => prev + 1);
  }, [brushSize, gameComplete]);

  useEffect(() => {
    if (totalArtifacts > 0 && artifactsFound.length === totalArtifacts) {
      setGameComplete(true);
    }
  }, [artifactsFound.length, totalArtifacts]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    lastCellRef.current = null;
    dig(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      dig(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
    lastCellRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDigging(true);
    lastCellRef.current = null;
    const touch = e.touches[0];
    dig(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDigging) {
      const touch = e.touches[0];
      dig(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDigging(false);
    lastCellRef.current = null;
  };

  return (
    <FeatureWrapper day={398} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            {period?.name || "Loading..."} <span className="text-base font-normal opacity-70">({period?.era})</span>
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Carefully brush away the sediment to uncover ancient treasures
          </p>
        </div>

        <div className="flex gap-6 flex-wrap justify-center">
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-sm opacity-70">Score:</span>{" "}
            <span className="font-bold text-lg" style={{ color: "var(--color-accent)" }}>{score}</span>
          </div>
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-sm opacity-70">Found:</span>{" "}
            <span className="font-bold">{artifactsFound.length}/{totalArtifacts}</span>
          </div>
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-sm opacity-70">Strokes:</span>{" "}
            <span className="font-bold">{brushStrokes}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>Brush Size:</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  brushSize === size ? "scale-110" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                  color: brushSize === size ? "white" : "var(--color-text)",
                  border: "1px solid var(--color-border)"
                }}
              >
                {size}x
              </button>
            ))}
          </div>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden shadow-lg"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="cursor-crosshair touch-none"
          />
          
          {gameComplete && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            >
              <div className="text-4xl mb-4">🎉</div>
              <h3 
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Excavation Complete!
              </h3>
              <p className="text-white opacity-80 mb-4">
                All {totalArtifacts} artifacts discovered in {brushStrokes} brush strokes
              </p>
              <p className="text-3xl font-bold mb-4" style={{ color: "var(--color-accent)" }}>
                Final Score: {score}
              </p>
              <button
                onClick={generateSite}
                className="btn-primary px-6 py-3 rounded-lg font-bold"
              >
                🗺️ New Dig Site
              </button>
            </div>
          )}
        </div>

        {artifactsFound.length > 0 && (
          <div 
            className="w-full p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3 className="text-sm font-bold mb-3 opacity-70">Museum Collection:</h3>
            <div className="flex flex-wrap gap-2">
              {artifactsFound.map((artifact, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                >
                  <span>{ARTIFACT_EMOJIS[artifact]}</span>
                  <span className="opacity-70">+{ARTIFACT_VALUES[artifact]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={generateSite}
          className="btn-secondary px-6 py-2 rounded-lg"
        >
          🗺️ Generate New Site
        </button>

        <div 
          className="text-center text-xs p-3 rounded-lg max-w-md"
          style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}
        >
          <p className="mb-1">💡 <strong>Pro Tip:</strong> Start with a large brush to survey the area, then switch to smaller brushes for delicate work around artifacts.</p>
          <p>Each artifact has different point values - gems and statues are worth the most!</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}