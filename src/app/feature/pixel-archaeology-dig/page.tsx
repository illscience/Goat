"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description: string;
  pixels: number[][];
  colors: string[];
}

interface MuseumItem {
  artifact: Artifact;
  discoveredAt: Date;
  digSite: string;
}

const ARTIFACTS: Artifact[] = [
  {
    id: "pottery",
    name: "Ancient Pottery",
    emoji: "🏺",
    rarity: "common",
    description: "A beautifully preserved clay vessel from the Bronze Age.",
    pixels: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
    ],
    colors: ["#8B4513", "#A0522D"],
  },
  {
    id: "coin",
    name: "Gold Coin",
    emoji: "🪙",
    rarity: "uncommon",
    description: "A shimmering gold coin bearing the face of a forgotten emperor.",
    pixels: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 2, 1, 1, 1],
      [1, 1, 2, 2, 2, 1, 1],
      [1, 1, 1, 2, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
    colors: ["#FFD700", "#FFA500"],
  },
  {
    id: "fossil",
    name: "Trilobite Fossil",
    emoji: "🦴",
    rarity: "uncommon",
    description: "A 500-million-year-old trilobite, perfectly preserved in stone.",
    pixels: [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 2, 1, 2, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 2, 1, 2, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 2, 1, 2, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
    colors: ["#696969", "#A9A9A9"],
  },
  {
    id: "skull",
    name: "Crystal Skull",
    emoji: "💀",
    rarity: "rare",
    description: "A mysterious crystal skull radiating ancient power.",
    pixels: [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 2, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
    colors: ["#E0FFFF", "#00CED1"],
  },
  {
    id: "gem",
    name: "Ruby of Ages",
    emoji: "💎",
    rarity: "rare",
    description: "A massive ruby said to grant visions of the past.",
    pixels: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 2, 1, 0, 0],
      [0, 1, 2, 2, 2, 1, 0],
      [1, 2, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
    colors: ["#DC143C", "#FF6B6B"],
  },
  {
    id: "crown",
    name: "Lost Crown",
    emoji: "👑",
    rarity: "legendary",
    description: "The legendary crown of a civilization lost to time itself.",
    pixels: [
      [1, 0, 1, 0, 1, 0, 1],
      [1, 2, 1, 2, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    colors: ["#FFD700", "#FF4500"],
  },
  {
    id: "sword",
    name: "Ancient Blade",
    emoji: "⚔️",
    rarity: "rare",
    description: "A warrior's blade, still sharp after millennia.",
    pixels: [
      [0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 1, 2],
      [0, 0, 0, 0, 1, 2, 0],
      [0, 0, 0, 1, 2, 0, 0],
      [0, 2, 1, 2, 0, 0, 0],
      [0, 2, 2, 0, 0, 0, 0],
      [0, 0, 2, 0, 0, 0, 0],
    ],
    colors: ["#C0C0C0", "#8B4513"],
  },
  {
    id: "scroll",
    name: "Mystic Scroll",
    emoji: "📜",
    rarity: "uncommon",
    description: "Ancient writings containing forgotten knowledge.",
    pixels: [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 2, 2, 2, 2, 2, 1],
      [1, 2, 1, 1, 1, 2, 1],
      [1, 2, 1, 1, 1, 2, 1],
      [1, 2, 1, 1, 1, 2, 1],
      [1, 2, 2, 2, 2, 2, 1],
      [0, 1, 1, 1, 1, 1, 0],
    ],
    colors: ["#DEB887", "#8B4513"],
  },
];

const DIG_SITES = [
  "Valley of Kings",
  "Sunken Temple",
  "Frozen Tundra",
  "Desert Ruins",
  "Jungle Tomb",
  "Mountain Cave",
];

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const MAX_DIRT_LAYERS = 5;

interface Cell {
  dirtLayers: number;
  artifactIndex: number | null;
  artifactPixel: { row: number; col: number } | null;
}

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [artifacts, setArtifacts] = useState<{ artifact: Artifact; x: number; y: number }[]>([]);
  const [discovered, setDiscovered] = useState<Set<number>>(new Set());
  const [museum, setMuseum] = useState<MuseumItem[]>([]);
  const [currentSite, setCurrentSite] = useState(DIG_SITES[0]);
  const [brushSize, setBrushSize] = useState(1);
  const [isDigging, setIsDigging] = useState(false);
  const [showMuseum, setShowMuseum] = useState(false);
  const [newDiscovery, setNewDiscovery] = useState<Artifact | null>(null);
  const [totalCellsCleared, setTotalCellsCleared] = useState(0);
  const frameRef = useRef<number>(0);

  const generateDigSite = useCallback(() => {
    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            dirtLayers: Math.floor(Math.random() * 3) + 3,
            artifactIndex: null,
            artifactPixel: null,
          }))
      );

    const numArtifacts = Math.floor(Math.random() * 3) + 2;
    const placedArtifacts: { artifact: Artifact; x: number; y: number }[] = [];

    for (let i = 0; i < numArtifacts; i++) {
      const rarityRoll = Math.random();
      let artifactPool: Artifact[];
      if (rarityRoll < 0.4) {
        artifactPool = ARTIFACTS.filter((a) => a.rarity === "common");
      } else if (rarityRoll < 0.7) {
        artifactPool = ARTIFACTS.filter((a) => a.rarity === "uncommon");
      } else if (rarityRoll < 0.9) {
        artifactPool = ARTIFACTS.filter((a) => a.rarity === "rare");
      } else {
        artifactPool = ARTIFACTS.filter((a) => a.rarity === "legendary");
      }

      const artifact = artifactPool[Math.floor(Math.random() * artifactPool.length)];
      const x = Math.floor(Math.random() * (GRID_SIZE - 7));
      const y = Math.floor(Math.random() * (GRID_SIZE - 7));

      for (let row = 0; row < artifact.pixels.length; row++) {
        for (let col = 0; col < artifact.pixels[row].length; col++) {
          if (artifact.pixels[row][col] > 0) {
            newGrid[y + row][x + col].artifactIndex = placedArtifacts.length;
            newGrid[y + row][x + col].artifactPixel = { row, col };
          }
        }
      }

      placedArtifacts.push({ artifact, x, y });
    }

    setGrid(newGrid);
    setArtifacts(placedArtifacts);
    setDiscovered(new Set());
    setCurrentSite(DIG_SITES[Math.floor(Math.random() * DIG_SITES.length)]);
    setTotalCellsCleared(0);
  }, []);

  useEffect(() => {
    generateDigSite();
  }, [generateDigSite]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y]?.[x];
        if (!cell) continue;

        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell.dirtLayers > 0) {
          const dirtShade = Math.floor(40 + (MAX_DIRT_LAYERS - cell.dirtLayers) * 20);
          ctx.fillStyle = `rgb(${dirtShade + 20}, ${dirtShade}, ${dirtShade - 10})`;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          if (cell.dirtLayers < 3) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.fillRect(px, py, 2, 2);
          }
        } else if (cell.artifactIndex !== null && cell.artifactPixel) {
          const artifactData = artifacts[cell.artifactIndex];
          if (artifactData) {
            const pixelValue = artifactData.artifact.pixels[cell.artifactPixel.row][cell.artifactPixel.col];
            if (pixelValue > 0) {
              ctx.fillStyle = artifactData.artifact.colors[pixelValue - 1] || artifactData.artifact.colors[0];
              ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            }
          }
        } else {
          ctx.fillStyle = "#2d2d44";
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [grid, artifacts]);

  useEffect(() => {
    draw();
  }, [draw]);

  const dig = useCallback(
    (centerX: number, centerY: number) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        let cellsCleared = 0;

        for (let dy = -brushSize + 1; dy < brushSize; dy++) {
          for (let dx = -brushSize + 1; dx < brushSize; dx++) {
            const x = centerX + dx;
            const y = centerY + dy;

            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              if (newGrid[y][x].dirtLayers > 0) {
                newGrid[y][x].dirtLayers--;
                cellsCleared++;

                if (newGrid[y][x].dirtLayers === 0 && newGrid[y][x].artifactIndex !== null) {
                  const artifactIdx = newGrid[y][x].artifactIndex!;
                  if (!discovered.has(artifactIdx)) {
                    setDiscovered((prev) => new Set([...prev, artifactIdx]));
                    const artifactData = artifacts[artifactIdx];
                    if (artifactData) {
                      setNewDiscovery(artifactData.artifact);
                      setTimeout(() => setNewDiscovery(null), 3000);
                    }
                  }
                }
              }
            }
          }
        }

        setTotalCellsCleared((prev) => prev + cellsCleared);
        return newGrid;
      });
    },
    [brushSize, discovered, artifacts]
  );

  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        dig(x, y);
      }
    },
    [dig]
  );

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

  const saveToMuseum = (artifact: Artifact) => {
    const alreadyInMuseum = museum.some((item) => item.artifact.id === artifact.id);
    if (!alreadyInMuseum) {
      setMuseum((prev) => [
        ...prev,
        {
          artifact,
          discoveredAt: new Date(),
          digSite: currentSite,
        },
      ]);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-400";
      case "uncommon":
        return "text-green-400";
      case "rare":
        return "text-blue-400";
      case "legendary":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-700";
      case "uncommon":
        return "bg-green-900";
      case "rare":
        return "bg-blue-900";
      case "legendary":
        return "bg-yellow-900";
      default:
        return "bg-gray-700";
    }
  };

  return (
    <FeatureWrapper day={381} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        {/* Header */}
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🏛️ {currentSite}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Carefully brush away the dirt to uncover ancient treasures!
          </p>
        </div>

        {/* New Discovery Popup */}
        {newDiscovery && (
          <div
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 p-6 rounded-lg shadow-2xl animate-bounce"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "2px solid var(--color-accent)" }}
          >
            <div className="text-center">
              <span className="text-4xl">{newDiscovery.emoji}</span>
              <h3 className="text-xl font-bold mt-2" style={{ color: "var(--color-text)" }}>
                Discovery!
              </h3>
              <p className={`font-semibold ${getRarityColor(newDiscovery.rarity)}`}>
                {newDiscovery.name}
              </p>
              <p className="text-xs mt-1 capitalize" style={{ color: "var(--color-text-dim)" }}>
                {newDiscovery.rarity}
              </p>
            </div>
          </div>
        )}

        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas */}
          <div className="flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="rounded-lg cursor-crosshair shadow-lg"
              style={{ border: "2px solid var(--color-border)" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* Brush Size */}
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                Brush Size:
              </span>
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`px-3 py-1 rounded transition-all ${
                    brushSize === size ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {size === 1 ? "Fine" : size === 2 ? "Medium" : "Broad"}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm" style={{ color: "var(--color-text-dim)" }}>
              <span>Cells Cleared: {totalCellsCleared}</span>
              <span>|</span>
              <span>
                Artifacts Found: {discovered.size}/{artifacts.length}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button onClick={generateDigSite} className="btn-primary px-4 py-2 rounded">
                🗺️ New Dig Site
              </button>
              <button
                onClick={() => setShowMuseum(!showMuseum)}
                className="btn-secondary px-4 py-2 rounded"
              >
                🏛️ Museum ({museum.length})
              </button>
            </div>
          </div>

          {/* Discoveries Panel */}
          <div
            className="p-4 rounded-lg min-w-64"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📦 Discoveries
            </h3>
            {discovered.size === 0 ? (
              <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                Start digging to find artifacts...
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {Array.from(discovered).map((idx) => {
                  const artifactData = artifacts[idx];
                  if (!artifactData) return null;
                  const { artifact } = artifactData;
                  const inMuseum = museum.some((item) => item.artifact.id === artifact.id);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded ${getRarityBg(artifact.rarity)}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{artifact.emoji}</span>
                        <div className="flex-1">
                          <p
                            className={`font-semibold ${getRarityColor(artifact.rarity)}`}
                          >
                            {artifact.name}
                          </p>
                          <p className="text-xs capitalize" style={{ color: "var(--color-text-dim)" }}>
                            {artifact.rarity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs mt-2" style={{ color: "var(--color-text-dim)" }}>
                        {artifact.description}
                      </p>
                      <button
                        onClick={() => saveToMuseum(artifact)}
                        disabled={inMuseum}
                        className={`mt-2 text-xs px-2 py-1 rounded w-full ${
                          inMuseum ? "bg-gray-600 cursor-not-allowed" : "btn-primary"
                        }`}
                      >
                        {inMuseum ? "✓ In Museum" : "Add to Museum"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Museum Modal */}
        {showMuseum && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
            onClick={() => setShowMuseum(false)}
          >
            <div
              className="p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: "var(--color-bg)", border: "2px solid var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
                >
                  🏛️ Your Museum Collection
                </h2>
                <button
                  onClick={() => setShowMuseum(false)}
                  className="text-2xl"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  ×
                </button>
              </div>

              {museum.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-6xl">🏺</span>
                  <p className="mt-4" style={{ color: "var(--color-text-dim)" }}>
                    Your museum is empty. Start collecting artifacts!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {museum.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded ${getRarityBg(item.artifact.rarity)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{item.artifact.emoji}</span>
                        <div>
                          <p
                            className={`font-bold ${getRarityColor(item.artifact.rarity)}`}
                          >
                            {item.artifact.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                            Found at {item.digSite}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mt-2" style={{ color: "var(--color-text-dim)" }}>
                        {item.artifact.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {museum.length > 0 && (
                <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="flex justify-between text-sm" style={{ color: "var(--color-text-dim)" }}>
                    <span>Total Artifacts: {museum.length}</span>
                    <span>
                      Legendary: {museum.filter((m) => m.artifact.rarity === "legendary").length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div
          className="text-center text-sm max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>
            🖱️ Click and drag to brush away dirt layers. Different brush sizes help you dig
            faster or more precisely. Each dig site contains unique artifacts - collect them all
            for your museum!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}