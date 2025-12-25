"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "fossil" | "treasure" | "pottery" | "structure" | "gem" | "tool";
  color: string;
  pattern: number[][];
  name: string;
  rarity: "common" | "rare" | "legendary";
}

interface DigSite {
  name: string;
  era: string;
  artifacts: Artifact[];
}

const GRID_SIZE = 40;
const CELL_SIZE = 12;
const BRUSH_SIZE = 3;

const ARTIFACT_PATTERNS: Record<string, { pattern: number[][]; color: string }> = {
  skull: {
    pattern: [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ],
    color: "#f5f5dc",
  },
  bone: {
    pattern: [
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
    ],
    color: "#faf0e6",
  },
  coin: {
    pattern: [
      [0, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [0, 1, 1, 0],
    ],
    color: "#ffd700",
  },
  chest: {
    pattern: [
      [1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 0, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    color: "#8b4513",
  },
  vase: {
    pattern: [
      [0, 1, 1, 0],
      [1, 1, 1, 1],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [1, 1, 1, 1],
    ],
    color: "#cd853f",
  },
  gem: {
    pattern: [
      [0, 1, 0],
      [1, 1, 1],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "#9b59b6",
  },
  ruby: {
    pattern: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "#e74c3c",
  },
  temple: {
    pattern: [
      [0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    color: "#7f8c8d",
  },
  axe: {
    pattern: [
      [1, 1, 0],
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    color: "#95a5a6",
  },
  arrowhead: {
    pattern: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    color: "#2c3e50",
  },
};

const ARTIFACT_NAMES: Record<string, string[]> = {
  fossil: ["Ancient Skull", "Dinosaur Bone", "Trilobite Fossil", "Ammonite Shell"],
  treasure: ["Golden Coin", "Pirate Chest", "Crown Jewel", "Ancient Medallion"],
  pottery: ["Ceremonial Vase", "Clay Amphora", "Ritual Bowl", "Storage Jar"],
  gem: ["Mystic Amethyst", "Blood Ruby", "Star Sapphire", "Dragon Emerald"],
  structure: ["Temple Ruins", "Altar Stone", "Monument Base", "Ancient Wall"],
  tool: ["Bronze Axe", "Flint Arrowhead", "Stone Hammer", "Obsidian Blade"],
};

const SITE_NAMES = [
  { name: "Valley of the Kings", era: "Ancient Egypt, 1500 BCE" },
  { name: "Pompeii Ruins", era: "Roman Empire, 79 CE" },
  { name: "Machu Picchu", era: "Inca Empire, 1450 CE" },
  { name: "Terracotta Army Site", era: "Qin Dynasty, 210 BCE" },
  { name: "Troy Archaeological Zone", era: "Bronze Age, 1200 BCE" },
  { name: "Mesa Verde Cliff Dwellings", era: "Ancestral Puebloans, 600 CE" },
];

function generateDigSite(): DigSite {
  const site = SITE_NAMES[Math.floor(Math.random() * SITE_NAMES.length)];
  const artifacts: Artifact[] = [];
  const numArtifacts = 5 + Math.floor(Math.random() * 6);

  const types: Array<Artifact["type"]> = ["fossil", "treasure", "pottery", "gem", "structure", "tool"];
  const patterns: Record<string, string[]> = {
    fossil: ["skull", "bone"],
    treasure: ["coin", "chest"],
    pottery: ["vase"],
    gem: ["gem", "ruby"],
    structure: ["temple"],
    tool: ["axe", "arrowhead"],
  };

  for (let i = 0; i < numArtifacts; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const patternNames = patterns[type];
    const patternName = patternNames[Math.floor(Math.random() * patternNames.length)];
    const artifactData = ARTIFACT_PATTERNS[patternName];

    const width = artifactData.pattern[0].length;
    const height = artifactData.pattern.length;

    let x: number, y: number;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * (GRID_SIZE - width - 4)) + 2;
      y = Math.floor(Math.random() * (GRID_SIZE - height - 4)) + 2;
      attempts++;
    } while (
      attempts < 50 &&
      artifacts.some(
        (a) =>
          x < a.x + a.width + 2 &&
          x + width + 2 > a.x &&
          y < a.y + a.height + 2 &&
          y + height + 2 > a.y
      )
    );

    if (attempts < 50) {
      const rarity: Artifact["rarity"] =
        Math.random() < 0.1 ? "legendary" : Math.random() < 0.3 ? "rare" : "common";
      const names = ARTIFACT_NAMES[type];

      artifacts.push({
        x,
        y,
        width,
        height,
        type,
        color: rarity === "legendary" ? "#f1c40f" : rarity === "rare" ? "#3498db" : artifactData.color,
        pattern: artifactData.pattern,
        name: names[Math.floor(Math.random() * names.length)],
        rarity,
      });
    }
  }

  return { ...site, artifacts };
}

function generateDirtLayer(): number[][] {
  const dirt: number[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    dirt[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      dirt[y][x] = 0.7 + Math.random() * 0.3;
    }
  }
  return dirt;
}

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [digSite, setDigSite] = useState<DigSite | null>(null);
  const [dirtLayer, setDirtLayer] = useState<number[][]>([]);
  const [revealedArtifacts, setRevealedArtifacts] = useState<Set<number>>(new Set());
  const [isDigging, setIsDigging] = useState(false);
  const [totalRevealed, setTotalRevealed] = useState(0);
  const [brushType, setBrushType] = useState<"brush" | "trowel" | "excavator">("brush");
  const frameRef = useRef<number>(0);

  const initializeGame = useCallback(() => {
    const site = generateDigSite();
    const dirt = generateDirtLayer();
    setDigSite(site);
    setDirtLayer(dirt);
    setRevealedArtifacts(new Set());
    setTotalRevealed(0);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const getBrushSize = () => {
    switch (brushType) {
      case "trowel":
        return BRUSH_SIZE + 2;
      case "excavator":
        return BRUSH_SIZE + 5;
      default:
        return BRUSH_SIZE;
    }
  };

  const dig = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !digSite) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((clientY - rect.top) / CELL_SIZE);

      const brushSize = getBrushSize();
      const newDirt = dirtLayer.map((row) => [...row]);
      let changed = false;

      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && dist <= brushSize) {
            const reduction = brushType === "excavator" ? 0.5 : brushType === "trowel" ? 0.3 : 0.15;
            const edgeFactor = 1 - dist / (brushSize + 1);
            if (newDirt[ny][nx] > 0) {
              newDirt[ny][nx] = Math.max(0, newDirt[ny][nx] - reduction * edgeFactor);
              changed = true;
            }
          }
        }
      }

      if (changed) {
        setDirtLayer(newDirt);

        // Check for revealed artifacts
        const newRevealed = new Set(revealedArtifacts);
        digSite.artifacts.forEach((artifact, index) => {
          if (newRevealed.has(index)) return;

          let revealedPixels = 0;
          let totalPixels = 0;

          for (let py = 0; py < artifact.height; py++) {
            for (let px = 0; px < artifact.width; px++) {
              if (artifact.pattern[py][px]) {
                totalPixels++;
                const gridX = artifact.x + px;
                const gridY = artifact.y + py;
                if (newDirt[gridY]?.[gridX] < 0.3) {
                  revealedPixels++;
                }
              }
            }
          }

          if (revealedPixels / totalPixels > 0.6) {
            newRevealed.add(index);
          }
        });

        setRevealedArtifacts(newRevealed);

        // Calculate total revealed percentage
        let cleared = 0;
        for (let row of newDirt) {
          for (let cell of row) {
            if (cell < 0.3) cleared++;
          }
        }
        setTotalRevealed(Math.round((cleared / (GRID_SIZE * GRID_SIZE)) * 100));
      }
    },
    [dirtLayer, digSite, revealedArtifacts, brushType]
  );

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
    if (isDigging) {
      const touch = e.touches[0];
      dig(touch.clientX, touch.clientY);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !digSite) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#2c1810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw artifacts
      digSite.artifacts.forEach((artifact) => {
        for (let py = 0; py < artifact.height; py++) {
          for (let px = 0; px < artifact.width; px++) {
            if (artifact.pattern[py][px]) {
              const gridX = artifact.x + px;
              const gridY = artifact.y + py;
              ctx.fillStyle = artifact.color;
              ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);

              // Add subtle shading
              ctx.fillStyle = "rgba(0,0,0,0.1)";
              ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, 2);
            }
          }
        }
      });

      // Draw dirt layer
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const dirtAmount = dirtLayer[y]?.[x] ?? 1;
          if (dirtAmount > 0) {
            const r = Math.floor(139 * dirtAmount);
            const g = Math.floor(90 * dirtAmount);
            const b = Math.floor(43 * dirtAmount);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dirtAmount})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            // Add texture
            if (dirtAmount > 0.5 && Math.random() > 0.7) {
              ctx.fillStyle = `rgba(100, 60, 20, ${dirtAmount * 0.3})`;
              ctx.fillRect(
                x * CELL_SIZE + Math.random() * 4,
                y * CELL_SIZE + Math.random() * 4,
                4,
                4
              );
            }
          }
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [digSite, dirtLayer]);

  const getRarityColor = (rarity: Artifact["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-400";
      case "rare":
        return "text-blue-400";
      default:
        return "text-gray-300";
    }
  };

  const getRarityBg = (rarity: Artifact["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "bg-yellow-900/30 border-yellow-600";
      case "rare":
        return "bg-blue-900/30 border-blue-600";
      default:
        return "bg-gray-800/30 border-gray-600";
    }
  };

  return (
    <FeatureWrapper day={390} title="Pixel Archaeology Dig" emoji="🦴">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            {digSite?.name || "Loading Site..."}
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            {digSite?.era || "Preparing excavation..."}
          </p>
          <p style={{ color: "var(--color-text-dim)" }} className="mt-2 text-sm">
            Click and drag to excavate. Uncover ancient treasures hidden beneath the earth! 🏺
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setBrushType("brush")}
            className={`px-4 py-2 rounded-lg transition-all ${
              brushType === "brush"
                ? "bg-amber-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🖌️ Brush
          </button>
          <button
            onClick={() => setBrushType("trowel")}
            className={`px-4 py-2 rounded-lg transition-all ${
              brushType === "trowel"
                ? "bg-amber-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🔧 Trowel
          </button>
          <button
            onClick={() => setBrushType("excavator")}
            className={`px-4 py-2 rounded-lg transition-all ${
              brushType === "excavator"
                ? "bg-amber-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            ⛏️ Excavator
          </button>
        </div>

        <div
          className="rounded-xl overflow-hidden shadow-2xl"
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
            onTouchEnd={handleMouseUp}
            className="cursor-crosshair touch-none"
          />
        </div>

        <div className="flex gap-4 items-center">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>Excavated: </span>
            <span style={{ color: "var(--color-accent)" }} className="font-bold">
              {totalRevealed}%
            </span>
          </div>
          <button onClick={initializeGame} className="btn-primary px-4 py-2 rounded-lg">
            🗺️ New Site
          </button>
        </div>

        {revealedArtifacts.size > 0 && (
          <div
            className="w-full max-w-lg rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📜 Discovered Artifacts ({revealedArtifacts.size}/{digSite?.artifacts.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {digSite?.artifacts
                .filter((_, i) => revealedArtifacts.has(i))
                .map((artifact, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg border ${getRarityBg(artifact.rarity)}`}
                  >
                    <span className={`font-medium ${getRarityColor(artifact.rarity)}`}>
                      {artifact.rarity === "legendary" && "⭐ "}
                      {artifact.rarity === "rare" && "✨ "}
                      {artifact.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Tip: Use the brush for delicate work around artifacts. The excavator is great for
          clearing large areas quickly. Legendary artifacts glow gold! ✨
        </div>
      </div>
    </FeatureWrapper>
  );
}