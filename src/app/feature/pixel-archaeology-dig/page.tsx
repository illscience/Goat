"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

type ArtifactType = "pottery" | "bone" | "coin" | "fossil" | "gem" | "tool";

interface Artifact {
  type: ArtifactType;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  discovered: boolean;
  pixels: boolean[][];
  color: string;
  name: string;
}

interface Cell {
  dirt: number; // 0-3 layers of dirt
  artifact: Artifact | null;
  artifactX: number;
  artifactY: number;
}

const GRID_WIDTH = 32;
const GRID_HEIGHT = 24;
const CELL_SIZE = 20;

const ARTIFACT_CONFIGS: Record<ArtifactType, { color: string; names: string[]; minDepth: number; maxDepth: number }> = {
  pottery: { color: "#CD853F", names: ["Ancient Vase", "Clay Pot", "Ceramic Bowl", "Terra Cotta Jar"], minDepth: 1, maxDepth: 2 },
  bone: { color: "#F5F5DC", names: ["Dinosaur Bone", "Ancient Skull", "Fossilized Rib", "Prehistoric Tooth"], minDepth: 2, maxDepth: 3 },
  coin: { color: "#FFD700", names: ["Gold Doubloon", "Roman Denarius", "Ancient Drachma", "Pirate Treasure"], minDepth: 1, maxDepth: 3 },
  fossil: { color: "#8B7355", names: ["Trilobite", "Ammonite", "Fern Fossil", "Fish Fossil"], minDepth: 2, maxDepth: 3 },
  gem: { color: "#9966CC", names: ["Amethyst Crystal", "Ruby Shard", "Emerald Chunk", "Sapphire Stone"], minDepth: 2, maxDepth: 3 },
  tool: { color: "#708090", names: ["Flint Arrowhead", "Stone Axe", "Bronze Dagger", "Iron Spearhead"], minDepth: 1, maxDepth: 2 },
};

const ARTIFACT_SHAPES: Record<ArtifactType, boolean[][]> = {
  pottery: [
    [false, true, true, false],
    [true, true, true, true],
    [true, true, true, true],
    [false, true, true, false],
  ],
  bone: [
    [true, false, false, true],
    [true, true, true, true],
    [true, true, true, true],
    [true, false, false, true],
  ],
  coin: [
    [false, true, true, false],
    [true, true, true, true],
    [true, true, true, true],
    [false, true, true, false],
  ],
  fossil: [
    [false, true, true, true],
    [true, true, false, false],
    [false, false, true, true],
    [true, true, true, false],
  ],
  gem: [
    [false, true, false],
    [true, true, true],
    [true, true, true],
    [false, true, false],
  ],
  tool: [
    [false, false, true],
    [false, true, true],
    [true, true, false],
    [true, false, false],
  ],
};

const DIRT_COLORS = ["#8B4513", "#A0522D", "#6B4423", "#5D4037"];
const DEEP_DIRT_COLORS = ["#4A3728", "#3D2914", "#2F1F0F"];

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [discovered, setDiscovered] = useState<Artifact[]>([]);
  const [brushSize, setBrushSize] = useState(1);
  const [isDigging, setIsDigging] = useState(false);
  const [totalDigs, setTotalDigs] = useState(0);
  const [siteName, setSiteName] = useState("");
  const frameRef = useRef<number>(0);

  const siteNames = [
    "Valley of the Kings",
    "Dusty Mesa Site",
    "Ancient River Bed",
    "Forgotten Temple Grounds",
    "Prehistoric Cave Floor",
    "Lost City Ruins",
  ];

  const generateArtifacts = useCallback(() => {
    const newArtifacts: Artifact[] = [];
    const types: ArtifactType[] = ["pottery", "bone", "coin", "fossil", "gem", "tool"];
    const numArtifacts = 5 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numArtifacts; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const config = ARTIFACT_CONFIGS[type];
      const shape = ARTIFACT_SHAPES[type];
      const width = shape[0].length;
      const height = shape.length;

      let x: number, y: number;
      let attempts = 0;
      let validPosition = false;

      do {
        x = Math.floor(Math.random() * (GRID_WIDTH - width - 2)) + 1;
        y = Math.floor(Math.random() * (GRID_HEIGHT - height - 2)) + 1;
        validPosition = true;

        for (const artifact of newArtifacts) {
          if (
            x < artifact.x + artifact.width + 2 &&
            x + width + 2 > artifact.x &&
            y < artifact.y + artifact.height + 2 &&
            y + height + 2 > artifact.y
          ) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      } while (!validPosition && attempts < 50);

      if (validPosition) {
        const depth = config.minDepth + Math.floor(Math.random() * (config.maxDepth - config.minDepth + 1));
        newArtifacts.push({
          type,
          x,
          y,
          width,
          height,
          depth,
          discovered: false,
          pixels: shape,
          color: config.color,
          name: config.names[Math.floor(Math.random() * config.names.length)],
        });
      }
    }

    return newArtifacts;
  }, []);

  const initializeGrid = useCallback((arts: Artifact[]) => {
    const newGrid: Cell[][] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        row.push({
          dirt: 3,
          artifact: null,
          artifactX: -1,
          artifactY: -1,
        });
      }
      newGrid.push(row);
    }

    for (const artifact of arts) {
      for (let ay = 0; ay < artifact.height; ay++) {
        for (let ax = 0; ax < artifact.width; ax++) {
          if (artifact.pixels[ay][ax]) {
            const gridX = artifact.x + ax;
            const gridY = artifact.y + ay;
            if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
              newGrid[gridY][gridX].artifact = artifact;
              newGrid[gridY][gridX].artifactX = ax;
              newGrid[gridY][gridX].artifactY = ay;
              newGrid[gridY][gridX].dirt = artifact.depth;
            }
          }
        }
      }
    }

    return newGrid;
  }, []);

  const startNewDig = useCallback(() => {
    const newArtifacts = generateArtifacts();
    const newGrid = initializeGrid(newArtifacts);
    setArtifacts(newArtifacts);
    setGrid(newGrid);
    setDiscovered([]);
    setTotalDigs(0);
    setSiteName(siteNames[Math.floor(Math.random() * siteNames.length)]);
  }, [generateArtifacts, initializeGrid]);

  useEffect(() => {
    startNewDig();
  }, [startNewDig]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#2a1810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell.dirt > 0) {
          const dirtIndex = cell.dirt - 1;
          const baseColor = cell.dirt > 2 ? DEEP_DIRT_COLORS[Math.min(dirtIndex, 2)] : DIRT_COLORS[dirtIndex];
          ctx.fillStyle = baseColor;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          // Add texture
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          if ((x + y) % 3 === 0) {
            ctx.fillRect(px + 2, py + 2, 3, 3);
          }
          if ((x * y) % 5 === 0) {
            ctx.fillRect(px + 8, py + 8, 2, 2);
          }
        } else if (cell.artifact) {
          ctx.fillStyle = cell.artifact.color;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          // Add shine
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(px + 2, py + 2, 4, 4);
        } else {
          ctx.fillStyle = "#1a0f0a";
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        }

        // Grid lines
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [grid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const dig = useCallback((mouseX: number, mouseY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((mouseX - rect.left) / CELL_SIZE);
    const y = Math.floor((mouseY - rect.top) / CELL_SIZE);

    let digsThisAction = 0;
    const newGrid = [...grid.map(row => [...row])];
    const newlyDiscovered: Artifact[] = [];

    for (let dy = -brushSize + 1; dy < brushSize; dy++) {
      for (let dx = -brushSize + 1; dx < brushSize; dx++) {
        const gx = x + dx;
        const gy = y + dy;

        if (gx >= 0 && gx < GRID_WIDTH && gy >= 0 && gy < GRID_HEIGHT) {
          const cell = newGrid[gy][gx];
          if (cell.dirt > 0) {
            cell.dirt--;
            digsThisAction++;

            if (cell.dirt === 0 && cell.artifact && !cell.artifact.discovered) {
              // Check if entire artifact is uncovered
              let fullyUncovered = true;
              for (let ay = 0; ay < cell.artifact.height; ay++) {
                for (let ax = 0; ax < cell.artifact.width; ax++) {
                  if (cell.artifact.pixels[ay][ax]) {
                    const checkX = cell.artifact.x + ax;
                    const checkY = cell.artifact.y + ay;
                    if (newGrid[checkY]?.[checkX]?.dirt > 0) {
                      fullyUncovered = false;
                      break;
                    }
                  }
                }
                if (!fullyUncovered) break;
              }

              if (fullyUncovered) {
                cell.artifact.discovered = true;
                newlyDiscovered.push(cell.artifact);
              }
            }
          }
        }
      }
    }

    if (digsThisAction > 0) {
      setGrid(newGrid);
      setTotalDigs(prev => prev + digsThisAction);
      if (newlyDiscovered.length > 0) {
        setDiscovered(prev => [...prev, ...newlyDiscovered]);
      }
    }
  }, [grid, brushSize]);

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

  const handleMouseLeave = () => {
    setIsDigging(false);
  };

  const allDiscovered = artifacts.length > 0 && discovered.length === artifacts.length;

  return (
    <FeatureWrapper day={418} title="Pixel Archaeology Dig" emoji="🦴">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            {siteName || "Loading Site..."}
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Click and drag to carefully excavate. Brush gently! Ancient treasures await beneath the dirt.
          </p>
        </div>

        <div className="flex gap-4 items-center flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-dim)" }} className="text-sm">Brush Size:</span>
            {[1, 2, 3].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  brushSize === size ? "scale-110" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                  color: "var(--color-text)",
                  border: `2px solid ${brushSize === size ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {size === 1 ? "🔬" : size === 2 ? "🪥" : "⛏️"}
              </button>
            ))}
          </div>

          <button
            onClick={startNewDig}
            className="btn-primary px-4 py-2 rounded-lg font-semibold"
          >
            🗺️ New Dig Site
          </button>
        </div>

        <div 
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair"
            style={{ display: "block" }}
          />
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
              {totalDigs}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Pixels Excavated</div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
              {discovered.length}/{artifacts.length}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Artifacts Found</div>
          </div>
        </div>

        {allDiscovered && (
          <div 
            className="p-4 rounded-xl text-center animate-pulse"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            🎉 Excavation Complete! All artifacts discovered! 🎉
          </div>
        )}

        {discovered.length > 0 && (
          <div 
            className="w-full max-w-2xl rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3 
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🏛️ Museum Collection
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {discovered.map((artifact, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                >
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: artifact.color }}
                  />
                  <span className="text-sm" style={{ color: "var(--color-text)" }}>
                    {artifact.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs max-w-md" style={{ color: "var(--color-text-dim)" }}>
          <p>💡 Tip: Use the fine brush (🔬) near artifacts to avoid damaging them. Larger brushes clear dirt faster but require less precision.</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}