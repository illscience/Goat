"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  id: string;
  type: "pottery" | "coin" | "fossil" | "symbol" | "bone" | "gem" | "tool";
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  era: string;
  significance: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  discovered: boolean;
  revealPercentage: number;
}

interface DigSite {
  name: string;
  location: string;
  period: string;
  artifacts: Artifact[];
}

const ARTIFACT_TYPES = {
  pottery: { emoji: "🏺", names: ["Clay Amphora", "Ceremonial Vase", "Storage Jar", "Ritual Bowl", "Wine Pitcher"] },
  coin: { emoji: "🪙", names: ["Bronze Denarius", "Gold Aureus", "Silver Drachma", "Copper As", "Electrum Stater"] },
  fossil: { emoji: "🦴", names: ["Trilobite Specimen", "Ammonite Shell", "Petrified Wood", "Sea Urchin Fossil", "Fern Impression"] },
  symbol: { emoji: "🔮", names: ["Mysterious Glyph Stone", "Runic Tablet", "Hieroglyphic Shard", "Sigil Carving", "Oracle Bone"] },
  bone: { emoji: "💀", names: ["Ancient Skull Fragment", "Mammoth Tusk Piece", "Ritual Bone Tool", "Carved Antler", "Jaw Fragment"] },
  gem: { emoji: "💎", names: ["Uncut Emerald", "Lapis Lazuli Bead", "Carnelian Amulet", "Turquoise Scarab", "Obsidian Mirror"] },
  tool: { emoji: "⚒️", names: ["Flint Hand Axe", "Bronze Chisel", "Bone Needle", "Stone Hammer", "Iron Sickle"] },
};

const ERAS = [
  "Pre-Columbian (1200 BCE)",
  "Bronze Age (2500 BCE)",
  "Roman Imperial (100 CE)",
  "Medieval (900 CE)",
  "Neolithic (4000 BCE)",
  "Viking Age (800 CE)",
];

const SIGNIFICANCES = [
  "Evidence of early trade routes between distant civilizations",
  "Suggests advanced astronomical knowledge for its time",
  "May have been used in sacred rituals honoring forgotten deities",
  "Indicates the presence of a thriving artisan community",
  "Could rewrite our understanding of ancient migration patterns",
  "Bears markings consistent with a lost royal lineage",
  "One of only three known examples from this period",
  "Its composition defies contemporary metallurgical capabilities",
];

const SITE_NAMES = [
  "Dusty Hollow",
  "Serpent's Ridge",
  "Whispering Dunes",
  "Obsidian Valley",
  "Forgotten Mesa",
  "Moonstone Basin",
];

const SITE_LOCATIONS = [
  "Northern Anatolia",
  "Coastal Peru",
  "Upper Nile Delta",
  "Scottish Highlands",
  "Gobi Desert Edge",
  "Yucatan Peninsula",
];

const GRID_SIZE = 40;
const BRUSH_RADIUS = 3;

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [digSite, setDigSite] = useState<DigSite | null>(null);
  const [dirtGrid, setDirtGrid] = useState<number[][]>([]);
  const [isDigging, setIsDigging] = useState(false);
  const [brushesUsed, setBrushesUsed] = useState(0);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<Artifact[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const animationRef = useRef<number>(0);

  const generateDigSite = useCallback((): DigSite => {
    const artifacts: Artifact[] = [];
    const artifactCount = Math.floor(Math.random() * 4) + 4;
    const types = Object.keys(ARTIFACT_TYPES) as Array<keyof typeof ARTIFACT_TYPES>;
    const rarities: Array<"common" | "uncommon" | "rare" | "legendary"> = ["common", "common", "common", "uncommon", "uncommon", "rare", "legendary"];

    for (let i = 0; i < artifactCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const typeData = ARTIFACT_TYPES[type];
      const width = Math.floor(Math.random() * 4) + 4;
      const height = Math.floor(Math.random() * 4) + 4;
      
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
        artifacts.push({
          id: `artifact-${i}`,
          type,
          x,
          y,
          width,
          height,
          name: typeData.names[Math.floor(Math.random() * typeData.names.length)],
          era: ERAS[Math.floor(Math.random() * ERAS.length)],
          significance: SIGNIFICANCES[Math.floor(Math.random() * SIGNIFICANCES.length)],
          rarity: rarities[Math.floor(Math.random() * rarities.length)],
          discovered: false,
          revealPercentage: 0,
        });
      }
    }

    return {
      name: SITE_NAMES[Math.floor(Math.random() * SITE_NAMES.length)],
      location: SITE_LOCATIONS[Math.floor(Math.random() * SITE_LOCATIONS.length)],
      period: ERAS[Math.floor(Math.random() * ERAS.length)],
      artifacts,
    };
  }, []);

  const initializeGrid = useCallback(() => {
    const grid: number[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = 3 + Math.floor(Math.random() * 2);
      }
    }
    return grid;
  }, []);

  const startNewDig = useCallback(() => {
    const newSite = generateDigSite();
    setDigSite(newSite);
    setDirtGrid(initializeGrid());
    setBrushesUsed(0);
    setDiscoveredArtifacts([]);
    setShowReport(false);
    setGameStarted(true);
  }, [generateDigSite, initializeGrid]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !digSite) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    ctx.fillStyle = "#2d1810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    digSite.artifacts.forEach((artifact) => {
      const typeData = ARTIFACT_TYPES[artifact.type];
      const rarityColors = {
        common: "#8B7355",
        uncommon: "#6B8E23",
        rare: "#4169E1",
        legendary: "#FFD700",
      };

      ctx.fillStyle = rarityColors[artifact.rarity];
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        artifact.x * cellSize,
        artifact.y * cellSize,
        artifact.width * cellSize,
        artifact.height * cellSize
      );

      ctx.globalAlpha = 1;
      ctx.font = `${Math.min(artifact.width, artifact.height) * cellSize * 0.6}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        typeData.emoji,
        (artifact.x + artifact.width / 2) * cellSize,
        (artifact.y + artifact.height / 2) * cellSize
      );
    });

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dirtLevel = dirtGrid[y]?.[x] ?? 0;
        if (dirtLevel > 0) {
          const baseColor = [101, 67, 33];
          const variation = Math.sin(x * 0.5) * 10 + Math.cos(y * 0.3) * 10;
          const alpha = Math.min(1, dirtLevel / 4);

          ctx.fillStyle = `rgba(${baseColor[0] + variation}, ${baseColor[1] + variation / 2}, ${baseColor[2]}, ${alpha})`;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);

          if (dirtLevel >= 3) {
            ctx.fillStyle = `rgba(80, 50, 20, ${alpha * 0.3})`;
            if ((x + y) % 3 === 0) {
              ctx.beginPath();
              ctx.arc(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                cellSize / 4,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }
        }
      }
    }
  }, [digSite, dirtGrid]);

  useEffect(() => {
    if (gameStarted) {
      animationRef.current = requestAnimationFrame(drawCanvas);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, drawCanvas]);

  const brushDirt = useCallback(
    (mouseX: number, mouseY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !digSite) return;

      const rect = canvas.getBoundingClientRect();
      const cellSize = canvas.width / GRID_SIZE;
      const gridX = Math.floor(((mouseX - rect.left) / rect.width) * GRID_SIZE);
      const gridY = Math.floor(((mouseY - rect.top) / rect.height) * GRID_SIZE);

      setDirtGrid((prev) => {
        const newGrid = prev.map((row) => [...row]);
        let changed = false;

        for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
          for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
            const nx = gridX + dx;
            const ny = gridY + dy;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (
              nx >= 0 &&
              nx < GRID_SIZE &&
              ny >= 0 &&
              ny < GRID_SIZE &&
              distance <= BRUSH_RADIUS
            ) {
              const reduction = distance < 1 ? 2 : 1;
              if (newGrid[ny][nx] > 0) {
                newGrid[ny][nx] = Math.max(0, newGrid[ny][nx] - reduction);
                changed = true;
              }
            }
          }
        }

        if (changed) {
          setBrushesUsed((prev) => prev + 1);
        }

        return newGrid;
      });

      setDigSite((prev) => {
        if (!prev) return prev;

        const updatedArtifacts = prev.artifacts.map((artifact) => {
          let revealedCells = 0;
          const totalCells = artifact.width * artifact.height;

          for (let ay = artifact.y; ay < artifact.y + artifact.height; ay++) {
            for (let ax = artifact.x; ax < artifact.x + artifact.width; ax++) {
              if (dirtGrid[ay]?.[ax] === 0) {
                revealedCells++;
              }
            }
          }

          const revealPercentage = (revealedCells / totalCells) * 100;
          const discovered = revealPercentage >= 60;

          if (discovered && !artifact.discovered) {
            setDiscoveredArtifacts((prevDiscovered) => {
              if (!prevDiscovered.find((a) => a.id === artifact.id)) {
                return [...prevDiscovered, { ...artifact, discovered: true, revealPercentage }];
              }
              return prevDiscovered;
            });
          }

          return { ...artifact, discovered, revealPercentage };
        });

        return { ...prev, artifacts: updatedArtifacts };
      });

      drawCanvas();
    },
    [digSite, dirtGrid, drawCanvas]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    brushDirt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      brushDirt(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDigging(true);
    const touch = e.touches[0];
    brushDirt(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDigging) {
      const touch = e.touches[0];
      brushDirt(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDigging(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-400";
      case "rare":
        return "text-blue-400";
      case "uncommon":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-400";
      case "rare":
        return "border-blue-400";
      case "uncommon":
        return "border-green-400";
      default:
        return "border-gray-400";
    }
  };

  return (
    <FeatureWrapper day={403} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4 max-w-4xl mx-auto">
        {!gameStarted ? (
          <div className="text-center space-y-6">
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              Welcome, Aspiring Archaeologist! 🔍
            </h2>
            <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
              You&apos;ve been assigned to excavate a mysterious dig site. Carefully brush away
              the dirt to uncover ancient artifacts. Each treasure tells a story lost to time...
            </p>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <h3 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
                How to Dig:
              </h3>
              <ul className="text-left space-y-1" style={{ color: "var(--color-text-dim)" }}>
                <li>🖱️ Click and drag to brush away soil</li>
                <li>🏺 Reveal 60% of an artifact to identify it</li>
                <li>✨ Discover all artifacts to complete your excavation</li>
                <li>📜 Generate a field report of your findings</li>
              </ul>
            </div>
            <button onClick={startNewDig} className="btn-primary text-lg px-8 py-3">
              Begin Excavation 🏛️
            </button>
          </div>
        ) : showReport ? (
          <div className="w-full space-y-6">
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <h2
                className="text-2xl font-bold mb-4 text-center"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
              >
                📜 Archaeological Field Report
              </h2>
              <div className="space-y-2 mb-6" style={{ color: "var(--color-text-dim)" }}>
                <p>
                  <strong>Site:</strong> {digSite?.name}
                </p>
                <p>
                  <strong>Location:</strong> {digSite?.location}
                </p>
                <p>
                  <strong>Estimated Period:</strong> {digSite?.period}
                </p>
                <p>
                  <strong>Brush Strokes:</strong> {brushesUsed}
                </p>
                <p>
                  <strong>Artifacts Recovered:</strong> {discoveredArtifacts.length} /{" "}
                  {digSite?.artifacts.length}
                </p>
              </div>

              <h3
                className="text-xl font-bold mb-4"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
              >
                Discovered Artifacts:
              </h3>
              <div className="space-y-4">
                {discoveredArtifacts.length === 0 ? (
                  <p className="text-center italic" style={{ color: "var(--color-text-dim)" }}>
                    No artifacts were discovered. Perhaps dig deeper next time? 🤔
                  </p>
                ) : (
                  discoveredArtifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className={`p-4 rounded-lg border-2 ${getRarityBorder(artifact.rarity)}`}
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{ARTIFACT_TYPES[artifact.type].emoji}</span>
                        <div>
                          <h4 className="font-bold" style={{ color: "var(--color-text)" }}>
                            {artifact.name}
                          </h4>
                          <span className={`text-sm capitalize ${getRarityColor(artifact.rarity)}`}>
                            {artifact.rarity}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mb-1" style={{ color: "var(--color-text-dim)" }}>
                        <strong>Era:</strong> {artifact.era}
                      </p>
                      <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                        &ldquo;{artifact.significance}&rdquo;
                      </p>
                    </div>
                  ))
                )}
              </div>

              {discoveredArtifacts.length === digSite?.artifacts.length && (
                <div
                  className="mt-6 p-4 rounded-lg text-center"
                  style={{ backgroundColor: "rgba(255, 215, 0, 0.1)" }}
                >
                  <p className="text-xl font-bold text-yellow-400">
                    🏆 Complete Excavation! 🏆
                  </p>
                  <p style={{ color: "var(--color-text-dim)" }}>
                    You uncovered every artifact at this site. The museum will be thrilled!
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowReport(false)} className="btn-secondary">
                Back to Site
              </button>
              <button onClick={startNewDig} className="btn-primary">
                New Excavation 🏛️
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
              >
                {digSite?.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                {digSite?.location} • {digSite?.period}
              </p>
            </div>

            <div className="flex gap-4 flex-wrap justify-center text-sm">
              <div
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
              >
                🖌️ Brushes: {brushesUsed}
              </div>
              <div
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
              >
                🏺 Found: {discoveredArtifacts.length}/{digSite?.artifacts.length}
              </div>
            </div>

            <div
              className="rounded-lg p-2 border"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="cursor-pointer rounded touch-none"
                style={{ maxWidth: "100%", height: "auto" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            {discoveredArtifacts.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {discoveredArtifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className={`px-3 py-1 rounded-full border ${getRarityBorder(artifact.rarity)}`}
                    style={{ backgroundColor: "var(--color-bg-secondary)" }}
                    title={artifact.name}
                  >
                    <span className="mr-1">{ARTIFACT_TYPES[artifact.type].emoji}</span>
                    <span className={getRarityColor(artifact.rarity)}>{artifact.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={startNewDig} className="btn-secondary">
                Abandon Site 🚫
              </button>
              <button onClick={() => setShowReport(true)} className="btn-primary">
                View Report 📜
              </button>
            </div>

            <p className="text-xs text-center" style={{ color: "var(--color-text-dim)" }}>
              Tip: Click and drag to brush away dirt. Reveal artifacts hidden beneath!
            </p>
          </>
        )}
      </div>
    </FeatureWrapper>
  );
}