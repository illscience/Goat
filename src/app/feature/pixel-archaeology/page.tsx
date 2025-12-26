"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

type PixelType = "dirt" | "artifact" | "empty";
type ArtifactType = "pottery" | "bones" | "tools" | "treasure";

interface Pixel {
  type: PixelType;
  revealed: boolean;
  damaged: boolean;
}

interface DigSite {
  grid: Pixel[][];
  artifactType: ArtifactType;
  artifactName: string;
}

const GRID_SIZE = 20;
const PIXEL_SIZE = 20;

const ARTIFACT_DATA: Record<ArtifactType, { names: string[]; emoji: string; baseValue: number }> = {
  pottery: {
    names: ["Ancient Amphora", "Ceremonial Vase", "Clay Tablet", "Ritual Bowl"],
    emoji: "🏺",
    baseValue: 100,
  },
  bones: {
    names: ["Dinosaur Fossil", "Mammoth Tusk", "Ancient Skull", "Prehistoric Femur"],
    emoji: "🦴",
    baseValue: 150,
  },
  tools: {
    names: ["Bronze Axe", "Flint Arrowhead", "Stone Hammer", "Obsidian Blade"],
    emoji: "⛏️",
    baseValue: 120,
  },
  treasure: {
    names: ["Golden Idol", "Ruby Amulet", "Ancient Coin Hoard", "Pharaoh's Scarab"],
    emoji: "💎",
    baseValue: 200,
  },
};

const DIRT_COLORS = ["#8B7355", "#7A6248", "#6B5344", "#5C4535", "#8B7765"];
const ARTIFACT_COLORS: Record<ArtifactType, string[]> = {
  pottery: ["#CD853F", "#D2691E", "#B8860B", "#DEB887"],
  bones: ["#F5F5DC", "#FAEBD7", "#FFE4C4", "#FFFAF0"],
  tools: ["#708090", "#778899", "#696969", "#A9A9A9"],
  treasure: ["#FFD700", "#FFA500", "#FF8C00", "#DAA520"],
};

function generateArtifactShape(type: ArtifactType): boolean[][] {
  const shape: boolean[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(false));

  const centerX = Math.floor(GRID_SIZE / 2) + Math.floor(Math.random() * 4) - 2;
  const centerY = Math.floor(GRID_SIZE / 2) + Math.floor(Math.random() * 4) - 2;

  switch (type) {
    case "pottery": {
      // Vase shape
      for (let y = -4; y <= 4; y++) {
        const width = y === -4 || y === 4 ? 1 : y === -3 || y === 3 ? 2 : y === 0 ? 4 : 3;
        for (let x = -width; x <= width; x++) {
          const px = centerX + x;
          const py = centerY + y;
          if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
            shape[py][px] = true;
          }
        }
      }
      break;
    }
    case "bones": {
      // Bone shape (horizontal with bulbs at ends)
      for (let x = -5; x <= 5; x++) {
        const py = centerY;
        const px = centerX + x;
        if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
          shape[py][px] = true;
        }
        if (Math.abs(x) >= 4) {
          for (let dy = -1; dy <= 1; dy++) {
            if (centerY + dy >= 0 && centerY + dy < GRID_SIZE && px >= 0 && px < GRID_SIZE) {
              shape[centerY + dy][px] = true;
            }
          }
        }
      }
      break;
    }
    case "tools": {
      // Axe shape
      for (let y = -3; y <= 4; y++) {
        const px = centerX;
        const py = centerY + y;
        if (py >= 0 && py < GRID_SIZE) {
          shape[py][px] = true;
        }
      }
      for (let x = 1; x <= 3; x++) {
        for (let y = -3; y <= 0; y++) {
          const px = centerX + x;
          const py = centerY + y;
          if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
            shape[py][px] = true;
          }
        }
      }
      break;
    }
    case "treasure": {
      // Diamond/gem shape
      for (let y = -3; y <= 3; y++) {
        const width = 3 - Math.abs(y);
        for (let x = -width; x <= width; x++) {
          const px = centerX + x;
          const py = centerY + y;
          if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
            shape[py][px] = true;
          }
        }
      }
      break;
    }
  }

  return shape;
}

function generateDigSite(): DigSite {
  const types: ArtifactType[] = ["pottery", "bones", "tools", "treasure"];
  const artifactType = types[Math.floor(Math.random() * types.length)];
  const artifactData = ARTIFACT_DATA[artifactType];
  const artifactName = artifactData.names[Math.floor(Math.random() * artifactData.names.length)];

  const artifactShape = generateArtifactShape(artifactType);

  const grid: Pixel[][] = Array(GRID_SIZE)
    .fill(null)
    .map((_, y) =>
      Array(GRID_SIZE)
        .fill(null)
        .map((_, x) => ({
          type: artifactShape[y][x] ? "artifact" : "dirt",
          revealed: false,
          damaged: false,
        }))
    );

  return { grid, artifactType, artifactName };
}

export default function PixelArchaeology() {
  const [digSite, setDigSite] = useState<DigSite | null>(null);
  const [brushSize, setBrushSize] = useState(1);
  const [, setPixelsExcavated] = useState(0);
  const [artifactDamage, setArtifactDamage] = useState(0);
  const [totalArtifactPixels, setTotalArtifactPixels] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [discoveries, setDiscoveries] = useState<{ name: string; condition: number; value: number }[]>([]);
  const [siteNumber] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);

  const initGame = useCallback(() => {
    const site = generateDigSite();
    setDigSite(site);
    setPixelsExcavated(0);
    setArtifactDamage(0);
    setGameComplete(false);

    const artifactCount = site.grid.flat().filter((p) => p.type === "artifact").length;
    setTotalArtifactPixels(artifactCount);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const drawGrid = useCallback(() => {
    if (!canvasRef.current || !digSite) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, GRID_SIZE * PIXEL_SIZE, GRID_SIZE * PIXEL_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixel = digSite.grid[y]?.[x];
        if (!pixel) continue;
        
        const px = x * PIXEL_SIZE;
        const py = y * PIXEL_SIZE;

        if (!pixel.revealed) {
          // Draw dirt with slight variation
          const colorIndex = (x + y) % DIRT_COLORS.length;
          ctx.fillStyle = DIRT_COLORS[colorIndex] ?? "#8B7355";
          ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE);

          // Add some texture
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          if ((x + y) % 3 === 0) {
            ctx.fillRect(px + 2, py + 2, 3, 3);
          }
        } else if (pixel.type === "artifact") {
          const colors = ARTIFACT_COLORS[digSite.artifactType] ?? ARTIFACT_COLORS.pottery;
          const colorIndex = (x * 7 + y * 13) % colors.length;

          if (pixel.damaged) {
            ctx.fillStyle = "#444";
            ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE);
            ctx.fillStyle = "rgba(255,0,0,0.3)";
            ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE);
          } else {
            ctx.fillStyle = colors[colorIndex] ?? colors[0] ?? "#CD853F";
            ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE);

            // Add shine effect
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.fillRect(px, py, PIXEL_SIZE / 2, PIXEL_SIZE / 2);
          }
        } else {
          // Empty/excavated dirt area
          ctx.fillStyle = "#3a3225";
          ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE);
        }

        // Grid lines
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.strokeRect(px, py, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, [digSite]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const excavateAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current || !digSite || gameComplete) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((clientY - rect.top) / PIXEL_SIZE);

      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

      let dirtRemoved = 0;
      let artifactHit = 0;

      const newGrid = digSite.grid.map((row, gy) =>
        row.map((pixel, gx) => {
          const distance = Math.sqrt(Math.pow(gx - x, 2) + Math.pow(gy - y, 2));
          if (distance <= brushSize - 0.5 && !pixel.revealed) {
            if (pixel.type === "dirt") {
              dirtRemoved++;
              return { ...pixel, revealed: true };
            } else if (pixel.type === "artifact" && !pixel.damaged) {
              artifactHit++;
              return { ...pixel, revealed: true, damaged: true };
            }
          }
          return pixel;
        })
      );

      if (dirtRemoved > 0 || artifactHit > 0) {
        setDigSite({ ...digSite, grid: newGrid });
        setPixelsExcavated((prev) => prev + dirtRemoved);
        setArtifactDamage((prev) => prev + artifactHit);

        // Check if all artifact pixels are revealed
        const artifactPixels = newGrid.flat().filter((p) => p.type === "artifact");
        const allRevealed = artifactPixels.every((p) => p.revealed);
        const dirtRemaining = newGrid.flat().filter((p) => p.type === "dirt" && !p.revealed).length;

        if (allRevealed || dirtRemaining === 0) {
          const damaged = artifactPixels.filter((p) => p.damaged).length;
          const condition = Math.max(0, Math.round((1 - damaged / artifactPixels.length) * 100));
          const baseValue = ARTIFACT_DATA[digSite.artifactType]?.baseValue ?? 100;
          const value = Math.round(baseValue * (condition / 100));

          setDiscoveries((prev) => [
            { name: digSite.artifactName, condition, value },
            ...prev.slice(0, 4),
          ]);
          setGameComplete(true);
        }
      }
    },
    [digSite, brushSize, gameComplete]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    excavateAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      excavateAt(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDrawingRef.current = false;
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 80) return "text-green-400";
    if (condition >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getConditionLabel = (condition: number) => {
    if (condition >= 90) return "Museum Quality";
    if (condition >= 70) return "Excellent";
    if (condition >= 50) return "Good";
    if (condition >= 30) return "Fair";
    return "Damaged";
  };

  if (!digSite) return null;

  const artifactData = ARTIFACT_DATA[digSite.artifactType] ?? ARTIFACT_DATA.pottery;
  const currentCondition = totalArtifactPixels > 0 
    ? Math.max(0, Math.round((1 - artifactDamage / totalArtifactPixels) * 100))
    : 100;

  return (
    <FeatureWrapper day={391} title="Pixel Archaeology" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Excavation Site #{siteNumber}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click and drag to carefully brush away the dirt. Reveal the artifact without damaging it!
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Suspected Find: </span>
            <span className="font-bold" style={{ color: "var(--color-text)" }}>
              {artifactData.emoji} {digSite.artifactType.charAt(0).toUpperCase() + digSite.artifactType.slice(1)}
            </span>
          </div>

          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Condition: </span>
            <span className={`font-bold ${getConditionColor(currentCondition)}`}>
              {currentCondition}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-dim)" }}>Brush:</span>
            {[1, 2, 3].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  brushSize === size ? "ring-2 ring-offset-2" : ""
                }`}
                style={{
                  backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: size * 6,
                    height: size * 6,
                    backgroundColor: "var(--color-text)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * PIXEL_SIZE}
            height={GRID_SIZE * PIXEL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair"
            style={{ display: "block" }}
          />
          {gameComplete && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            >
              <div className="text-6xl mb-4">{artifactData.emoji}</div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
              >
                {digSite.artifactName} Discovered!
              </h3>
              <p className={`text-lg font-bold ${getConditionColor(currentCondition)}`}>
                {getConditionLabel(currentCondition)} - {currentCondition}% intact
              </p>
              <p className="text-yellow-400 font-bold mt-1">
                💰 Value: ${Math.round(artifactData.baseValue * (currentCondition / 100))}
              </p>
              <button
                onClick={initGame}
                className="btn-primary mt-4 px-6 py-2 rounded-lg font-bold"
              >
                New Dig Site
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 text-xs" style={{ color: "var(--color-text-dim)" }}>
          <span>🖱️ Click & drag to excavate</span>
          <span>•</span>
          <span>🎯 Smaller brush = more precision</span>
          <span>•</span>
          <span>💔 Hitting artifacts damages them!</span>
        </div>

        {discoveries.length > 0 && (
          <div
            className="w-full max-w-md p-4 rounded-xl"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🏛️ Your Collection
            </h3>
            <div className="space-y-2">
              {discoveries.map((discovery, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <span style={{ color: "var(--color-text)" }}>{discovery.name}</span>
                  <div className="flex gap-3">
                    <span className={getConditionColor(discovery.condition)}>
                      {discovery.condition}%
                    </span>
                    <span className="text-yellow-400">${discovery.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-3 pt-3 text-center font-bold"
              style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text)" }}
            >
              Total Collection Value: ${discoveries.reduce((sum, d) => sum + d.value, 0)}
            </div>
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}