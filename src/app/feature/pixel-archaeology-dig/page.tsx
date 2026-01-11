"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Cell {
  depth: number;
  dug: boolean;
  artifact: Artifact | null;
}

interface Artifact {
  type: string;
  emoji: string;
  name: string;
  era: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  depth: number;
}

const GRID_SIZE = 16;
const MAX_DEPTH = 8;

const ARTIFACTS: { [depth: number]: Artifact[] } = {
  1: [
    { type: "coin", emoji: "🪙", name: "Modern Coin", era: "Industrial Age", rarity: "common", depth: 1 },
    { type: "bottle", emoji: "🍾", name: "Glass Bottle", era: "Industrial Age", rarity: "common", depth: 1 },
    { type: "button", emoji: "⚪", name: "Tin Button", era: "Industrial Age", rarity: "common", depth: 1 },
  ],
  2: [
    { type: "pottery", emoji: "🏺", name: "Clay Pot Shard", era: "Medieval Period", rarity: "common", depth: 2 },
    { type: "tool", emoji: "🔨", name: "Rusty Hammer", era: "Medieval Period", rarity: "common", depth: 2 },
    { type: "ring", emoji: "💍", name: "Bronze Ring", era: "Medieval Period", rarity: "uncommon", depth: 2 },
  ],
  3: [
    { type: "sword", emoji: "⚔️", name: "Broken Sword", era: "Roman Empire", rarity: "uncommon", depth: 3 },
    { type: "helmet", emoji: "🪖", name: "Centurion Helm", era: "Roman Empire", rarity: "uncommon", depth: 3 },
    { type: "mosaic", emoji: "🎨", name: "Mosaic Tile", era: "Roman Empire", rarity: "common", depth: 3 },
  ],
  4: [
    { type: "scroll", emoji: "📜", name: "Ancient Scroll", era: "Greek Era", rarity: "rare", depth: 4 },
    { type: "amphora", emoji: "🏛️", name: "Amphora Vessel", era: "Greek Era", rarity: "uncommon", depth: 4 },
    { type: "statue", emoji: "🗿", name: "Marble Fragment", era: "Greek Era", rarity: "rare", depth: 4 },
  ],
  5: [
    { type: "scarab", emoji: "🪲", name: "Golden Scarab", era: "Egyptian Dynasty", rarity: "rare", depth: 5 },
    { type: "hieroglyph", emoji: "𓀀", name: "Hieroglyph Stone", era: "Egyptian Dynasty", rarity: "uncommon", depth: 5 },
    { type: "mask", emoji: "👑", name: "Pharaoh's Mask", era: "Egyptian Dynasty", rarity: "legendary", depth: 5 },
  ],
  6: [
    { type: "bone", emoji: "🦴", name: "Mammoth Bone", era: "Ice Age", rarity: "rare", depth: 6 },
    { type: "spear", emoji: "🪃", name: "Flint Spearhead", era: "Ice Age", rarity: "uncommon", depth: 6 },
    { type: "cave_art", emoji: "🎭", name: "Painted Stone", era: "Ice Age", rarity: "rare", depth: 6 },
  ],
  7: [
    { type: "fossil", emoji: "🦕", name: "Dinosaur Fossil", era: "Prehistoric", rarity: "legendary", depth: 7 },
    { type: "amber", emoji: "🟠", name: "Amber Crystal", era: "Prehistoric", rarity: "rare", depth: 7 },
    { type: "trilobite", emoji: "🐚", name: "Trilobite", era: "Prehistoric", rarity: "rare", depth: 7 },
  ],
  8: [
    { type: "meteor", emoji: "☄️", name: "Meteorite Core", era: "Primordial", rarity: "legendary", depth: 8 },
    { type: "crystal", emoji: "💎", name: "Alien Crystal", era: "Unknown Origin", rarity: "legendary", depth: 8 },
    { type: "artifact", emoji: "🔮", name: "Mysterious Orb", era: "???", rarity: "legendary", depth: 8 },
  ],
};

const DEPTH_COLORS = [
  "#8B7355", // Surface
  "#6B5344", // Depth 1
  "#5C4433", // Depth 2
  "#4D3625", // Depth 3
  "#3E2A1A", // Depth 4
  "#2F1E12", // Depth 5
  "#201208", // Depth 6
  "#150A02", // Depth 7
  "#0A0500", // Depth 8
];

const RARITY_COLORS = {
  common: "#A0A0A0",
  uncommon: "#4ADE80",
  rare: "#60A5FA",
  legendary: "#F59E0B",
};

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [discoveries, setDiscoveries] = useState<Artifact[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [totalDigs, setTotalDigs] = useState(0);
  const [digStreak, setDigStreak] = useState(0);
  const [lastDiscovery, setLastDiscovery] = useState<Artifact | null>(null);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const generateDigSite = useCallback(() => {
    const newGrid: Cell[][] = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        // Generate random artifacts at various depths
        let artifact: Artifact | null = null;
        const randomDepth = Math.floor(Math.random() * MAX_DEPTH) + 1;
        
        // 15% chance of artifact at any cell
        if (Math.random() < 0.15) {
          const depthArtifacts = ARTIFACTS[randomDepth];
          if (depthArtifacts) {
            artifact = { ...depthArtifacts[Math.floor(Math.random() * depthArtifacts.length)] };
          }
        }
        
        row.push({
          depth: 0,
          dug: false,
          artifact,
        });
      }
      newGrid.push(row);
    }
    
    setGrid(newGrid);
    setDiscoveries([]);
    setTotalDigs(0);
    setDigStreak(0);
    setLastDiscovery(null);
  }, []);

  useEffect(() => {
    generateDigSite();
  }, [generateDigSite]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = grid[y][x];
          const px = x * cellSize;
          const py = y * cellSize;

          // Draw dirt layer
          ctx.fillStyle = DEPTH_COLORS[cell.depth];
          ctx.fillRect(px, py, cellSize, cellSize);

          // Add texture
          ctx.fillStyle = `rgba(0,0,0,${0.1 + cell.depth * 0.05})`;
          for (let i = 0; i < 3; i++) {
            const dotX = px + Math.random() * cellSize;
            const dotY = py + Math.random() * cellSize;
            ctx.fillRect(dotX, dotY, 2, 2);
          }

          // Draw artifact if revealed
          if (cell.artifact && cell.depth >= cell.artifact.depth) {
            ctx.font = `${cellSize * 0.6}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cell.artifact.emoji, px + cellSize / 2, py + cellSize / 2);
            
            // Glow effect for rarity
            ctx.shadowColor = RARITY_COLORS[cell.artifact.rarity];
            ctx.shadowBlur = 10;
            ctx.fillText(cell.artifact.emoji, px + cellSize / 2, py + cellSize / 2);
            ctx.shadowBlur = 0;
          }

          // Highlight selected cell
          if (selectedCell && selectedCell.x === x && selectedCell.y === y) {
            ctx.strokeStyle = "var(--color-accent)";
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
          }

          // Grid lines
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [grid, selectedCell]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / (canvas.width / GRID_SIZE));
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / (canvas.height / GRID_SIZE));

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      dig(x, y);
    }
  };

  const dig = (x: number, y: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
      const cell = newGrid[y][x];

      if (cell.depth < MAX_DEPTH) {
        cell.depth++;
        setTotalDigs((prev) => prev + 1);

        // Check if we found an artifact
        if (cell.artifact && cell.depth === cell.artifact.depth && !cell.dug) {
          cell.dug = true;
          setDiscoveries((prev) => [...prev, cell.artifact!]);
          setLastDiscovery(cell.artifact);
          setShowDiscoveryModal(true);
          setDigStreak((prev) => prev + 1);
        } else if (cell.depth === MAX_DEPTH && !cell.artifact) {
          setDigStreak(0);
        }
      }

      return newGrid;
    });

    setSelectedCell({ x, y });
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "✨ LEGENDARY";
      case "rare":
        return "💫 Rare";
      case "uncommon":
        return "🌟 Uncommon";
      default:
        return "Common";
    }
  };

  return (
    <FeatureWrapper day={407} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4 max-w-4xl mx-auto">
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Welcome, Archaeologist! 🏺
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click to dig through ancient layers. The deeper you go, the older (and rarer) the treasures!
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Total Digs: </span>
            <span className="font-bold" style={{ color: "var(--color-text)" }}>{totalDigs}</span>
          </div>
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Discoveries: </span>
            <span className="font-bold" style={{ color: "var(--color-text)" }}>{discoveries.length}</span>
          </div>
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Streak: </span>
            <span className="font-bold" style={{ color: "var(--color-accent)" }}>{digStreak}🔥</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onClick={handleCanvasClick}
              className="cursor-crosshair rounded-lg shadow-lg"
              style={{
                border: "4px solid var(--color-border)",
                maxWidth: "100%",
                height: "auto",
              }}
            />
            <button
              onClick={generateDigSite}
              className="btn-primary mt-4 px-6 py-2 rounded-lg font-bold"
            >
              🗺️ New Dig Site
            </button>
          </div>

          <div
            className="w-full lg:w-80 p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📋 Expedition Log
            </h3>
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-dim)" }}>
                Depth Guide:
              </h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  "Surface",
                  "Industrial Age",
                  "Medieval Period",
                  "Roman Empire",
                  "Greek Era",
                  "Egyptian Dynasty",
                  "Ice Age",
                  "Prehistoric",
                  "Primordial",
                ].map((era, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 rounded"
                    style={{ backgroundColor: DEPTH_COLORS[i] }}
                  >
                    <span style={{ color: i < 4 ? "#000" : "#fff" }}>{i}: {era}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-dim)" }}>
                Discoveries ({discoveries.length}):
              </h4>
              <div
                className="max-h-48 overflow-y-auto space-y-2"
                style={{ scrollbarWidth: "thin" }}
              >
                {discoveries.length === 0 ? (
                  <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                    No artifacts found yet. Keep digging!
                  </p>
                ) : (
                  discoveries.map((artifact, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{
                        backgroundColor: "var(--color-bg)",
                        borderLeft: `3px solid ${RARITY_COLORS[artifact.rarity]}`,
                      }}
                    >
                      <span className="text-xl">{artifact.emoji}</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {artifact.name}
                        </p>
                        <p className="text-xs" style={{ color: RARITY_COLORS[artifact.rarity] }}>
                          {artifact.era}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {showDiscoveryModal && lastDiscovery && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowDiscoveryModal(false)}
          >
            <div
              className="p-8 rounded-xl text-center max-w-sm mx-4 transform animate-bounce"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                border: `3px solid ${RARITY_COLORS[lastDiscovery.rarity]}`,
                boxShadow: `0 0 30px ${RARITY_COLORS[lastDiscovery.rarity]}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-4">{lastDiscovery.emoji}</div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
              >
                Discovery!
              </h3>
              <p className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                {lastDiscovery.name}
              </p>
              <p
                className="font-semibold mb-1"
                style={{ color: RARITY_COLORS[lastDiscovery.rarity] }}
              >
                {getRarityLabel(lastDiscovery.rarity)}
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--color-text-dim)" }}>
                Era: {lastDiscovery.era}
              </p>
              <button
                onClick={() => setShowDiscoveryModal(false)}
                className="btn-secondary px-6 py-2 rounded-lg"
              >
                Continue Digging
              </button>
            </div>
          </div>
        )}

        <div
          className="text-center text-sm p-4 rounded-lg w-full max-w-2xl"
          style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}
        >
          <p className="mb-2">💡 <strong>Pro Tips:</strong></p>
          <p>• Dig multiple times on the same spot to go deeper</p>
          <p>• Legendary artifacts are found at depths 5-8</p>
          <p>• Each dig site has unique artifact placements</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}