"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "fossil" | "treasure" | "pottery" | "bone" | "gem" | "coin" | "ruin";
  emoji: string;
  value: number;
  revealed: number;
  damaged: boolean;
}

interface Cell {
  dirtLevel: number; // 0-3 (0 = fully excavated)
  hasArtifact: boolean;
  artifactIndex: number;
}

const GRID_SIZE = 40;
const CELL_SIZE = 12;

const ARTIFACT_TYPES = [
  { type: "fossil" as const, emoji: "🦴", value: 100, rarity: 0.15 },
  { type: "treasure" as const, emoji: "💎", value: 500, rarity: 0.05 },
  { type: "pottery" as const, emoji: "🏺", value: 75, rarity: 0.2 },
  { type: "bone" as const, emoji: "🦷", value: 50, rarity: 0.25 },
  { type: "gem" as const, emoji: "💍", value: 300, rarity: 0.08 },
  { type: "coin" as const, emoji: "🪙", value: 150, rarity: 0.12 },
  { type: "ruin" as const, emoji: "🏛️", value: 200, rarity: 0.15 },
];

const DIRT_COLORS = [
  "transparent",
  "rgb(139, 90, 43)",
  "rgb(160, 110, 60)",
  "rgb(180, 130, 80)",
];

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [score, setScore] = useState(0);
  const [brushSize, setBrushSize] = useState(1);
  const [brushPower, setBrushPower] = useState(1);
  const [gameState, setGameState] = useState<"playing" | "complete">("playing");
  const [stats, setStats] = useState({ revealed: 0, damaged: 0, total: 0 });
  const [isDigging, setIsDigging] = useState(false);
  const [digSite, setDigSite] = useState(1);
  const lastDigPos = useRef<{ x: number; y: number } | null>(null);

  const generateDigSite = useCallback(() => {
    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            dirtLevel: 3,
            hasArtifact: false,
            artifactIndex: -1,
          }))
      );

    const newArtifacts: Artifact[] = [];
    const artifactCount = 8 + Math.floor(Math.random() * 7);

    for (let i = 0; i < artifactCount; i++) {
      const typeRoll = Math.random();
      let cumulative = 0;
      let selectedType = ARTIFACT_TYPES[0];

      for (const artType of ARTIFACT_TYPES) {
        cumulative += artType.rarity;
        if (typeRoll < cumulative) {
          selectedType = artType;
          break;
        }
      }

      const width = selectedType.type === "ruin" ? 4 : 2 + Math.floor(Math.random() * 2);
      const height = selectedType.type === "ruin" ? 3 : 2 + Math.floor(Math.random() * 2);
      const x = Math.floor(Math.random() * (GRID_SIZE - width - 2)) + 1;
      const y = Math.floor(Math.random() * (GRID_SIZE - height - 2)) + 1;

      let overlaps = false;
      for (let dx = -1; dx <= width; dx++) {
        for (let dy = -1; dy <= height; dy++) {
          if (newGrid[y + dy]?.[x + dx]?.hasArtifact) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) break;
      }

      if (!overlaps) {
        const artifact: Artifact = {
          x,
          y,
          width,
          height,
          type: selectedType.type,
          emoji: selectedType.emoji,
          value: selectedType.value,
          revealed: 0,
          damaged: false,
        };

        for (let dx = 0; dx < width; dx++) {
          for (let dy = 0; dy < height; dy++) {
            newGrid[y + dy][x + dx].hasArtifact = true;
            newGrid[y + dy][x + dx].artifactIndex = newArtifacts.length;
          }
        }

        newArtifacts.push(artifact);
      }
    }

    setGrid(newGrid);
    setArtifacts(newArtifacts);
    setStats({ revealed: 0, damaged: 0, total: newArtifacts.length });
    setScore(0);
    setGameState("playing");
  }, []);

  useEffect(() => {
    generateDigSite();
  }, [generateDigSite, digSite]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgb(60, 40, 20)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y][x];

        if (cell.hasArtifact && cell.dirtLevel < 3) {
          const artifact = artifacts[cell.artifactIndex];
          if (artifact) {
            const baseColor = artifact.damaged
              ? "rgb(100, 80, 60)"
              : artifact.type === "treasure" || artifact.type === "gem"
              ? "rgb(255, 215, 0)"
              : artifact.type === "fossil" || artifact.type === "bone"
              ? "rgb(240, 230, 210)"
              : artifact.type === "coin"
              ? "rgb(218, 165, 32)"
              : artifact.type === "ruin"
              ? "rgb(169, 169, 169)"
              : "rgb(205, 133, 63)";

            ctx.fillStyle = baseColor;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }

        if (cell.dirtLevel > 0) {
          ctx.fillStyle = DIRT_COLORS[cell.dirtLevel];
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }
  }, [grid, artifacts]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const dig = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || gameState !== "playing") return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;
      const centerX = Math.floor(canvasX / CELL_SIZE);
      const centerY = Math.floor(canvasY / CELL_SIZE);

      if (
        lastDigPos.current &&
        lastDigPos.current.x === centerX &&
        lastDigPos.current.y === centerY
      ) {
        return;
      }
      lastDigPos.current = { x: centerX, y: centerY };

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        const affectedArtifacts = new Set<number>();
        let pointsEarned = 0;

        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          for (let dy = -brushSize + 1; dy < brushSize; dy++) {
            const x = centerX + dx;
            const y = centerY + dy;

            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              const cell = newGrid[y][x];
              const oldLevel = cell.dirtLevel;
              cell.dirtLevel = Math.max(0, cell.dirtLevel - brushPower);

              if (cell.hasArtifact && cell.dirtLevel < oldLevel) {
                affectedArtifacts.add(cell.artifactIndex);
              }
            }
          }
        }

        setArtifacts((prevArtifacts) => {
          const newArtifacts = [...prevArtifacts];
          let newRevealed = 0;
          let newDamaged = 0;

          affectedArtifacts.forEach((idx) => {
            const artifact = { ...newArtifacts[idx] };
            let totalCells = 0;
            let revealedCells = 0;
            let damageCells = 0;

            for (let ax = 0; ax < artifact.width; ax++) {
              for (let ay = 0; ay < artifact.height; ay++) {
                const cell = newGrid[artifact.y + ay]?.[artifact.x + ax];
                if (cell) {
                  totalCells++;
                  if (cell.dirtLevel === 0) revealedCells++;
                  if (cell.dirtLevel === 0 && brushPower > 1) {
                    damageCells++;
                  }
                }
              }
            }

            const prevRevealed = artifact.revealed;
            artifact.revealed = revealedCells / totalCells;

            if (brushPower > 1 && damageCells > 0 && !artifact.damaged) {
              artifact.damaged = true;
              artifact.value = Math.floor(artifact.value * 0.3);
            }

            if (artifact.revealed >= 0.7 && prevRevealed < 0.7) {
              pointsEarned += artifact.value;
              if (artifact.damaged) {
                newDamaged++;
              } else {
                newRevealed++;
              }
            }

            newArtifacts[idx] = artifact;
          });

          if (pointsEarned > 0) {
            setScore((prev) => prev + pointsEarned);
          }

          setStats((prev) => ({
            ...prev,
            revealed: prev.revealed + newRevealed,
            damaged: prev.damaged + newDamaged,
          }));

          return newArtifacts;
        });

        return newGrid;
      });
    },
    [brushSize, brushPower, gameState]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    lastDigPos.current = null;
    dig(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      dig(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
    lastDigPos.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDigging(true);
    lastDigPos.current = null;
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
    lastDigPos.current = null;
  };

  useEffect(() => {
    if (stats.revealed + stats.damaged >= stats.total && stats.total > 0) {
      setGameState("complete");
    }
  }, [stats]);

  const newDigSite = () => {
    setDigSite((prev) => prev + 1);
  };

  return (
    <FeatureWrapper day={404} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-4 p-4 max-w-2xl mx-auto">
        <p
          className="text-center text-sm mb-2"
          style={{ color: "var(--color-text-dim)" }}
        >
          Carefully brush away dirt to uncover ancient treasures! Use gentle
          brushes for precision, or risk damaging artifacts with power tools.
        </p>

        <div
          className="flex flex-wrap gap-4 justify-center items-center p-3 rounded-lg w-full"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="font-bold text-xl">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅ {stats.revealed}</span>
            <span style={{ color: "var(--color-text-dim)" }}>|</span>
            <span className="text-red-500">💔 {stats.damaged}</span>
            <span style={{ color: "var(--color-text-dim)" }}>|</span>
            <span>📦 {stats.total}</span>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-4 justify-center p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
              Brush Size
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`px-3 py-1 rounded transition-all ${
                    brushSize === size
                      ? "bg-amber-600 text-white"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                >
                  {size === 1 ? "🖌️" : size === 2 ? "🖊️" : "🪥"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
              Power (⚠️ damages!)
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((power) => (
                <button
                  key={power}
                  onClick={() => setBrushPower(power)}
                  className={`px-3 py-1 rounded transition-all ${
                    brushPower === power
                      ? power === 1
                        ? "bg-green-600 text-white"
                        : power === 2
                        ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                >
                  {power === 1 ? "Gentle" : power === 2 ? "Medium" : "POWER"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="relative rounded-lg overflow-hidden shadow-xl"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="cursor-crosshair touch-none"
            style={{ width: "100%", maxWidth: "480px", height: "auto" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {gameState === "complete" && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center gap-4">
              <span className="text-4xl">🎉</span>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Dig Complete!
              </h2>
              <p className="text-lg">Final Score: {score}</p>
              <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                Artifacts: {stats.revealed} pristine, {stats.damaged} damaged
              </p>
              <button onClick={newDigSite} className="btn-primary mt-2">
                🗺️ New Dig Site
              </button>
            </div>
          )}
        </div>

        <div
          className="flex flex-wrap gap-2 justify-center text-xs p-2 rounded"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <span>Legend:</span>
          {ARTIFACT_TYPES.map((art) => (
            <span key={art.type} className="flex items-center gap-1">
              {art.emoji} {art.value}pts
            </span>
          ))}
        </div>

        <button onClick={newDigSite} className="btn-secondary">
          🗺️ Start New Dig Site
        </button>
      </div>
    </FeatureWrapper>
  );
}