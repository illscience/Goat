"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

type CellType = "dirt" | "artifact" | "empty" | "damaged";
type ArtifactType = {
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  color: string;
};

const ARTIFACTS: ArtifactType[] = [
  { name: "Pottery Shard", emoji: "🏺", rarity: "common", color: "#8B4513" },
  { name: "Ancient Coin", emoji: "🪙", rarity: "common", color: "#FFD700" },
  { name: "Bone Fragment", emoji: "🦴", rarity: "common", color: "#F5F5DC" },
  { name: "Stone Tool", emoji: "🪨", rarity: "uncommon", color: "#696969" },
  { name: "Bronze Dagger", emoji: "🗡️", rarity: "uncommon", color: "#CD7F32" },
  { name: "Jade Amulet", emoji: "💎", rarity: "rare", color: "#00A86B" },
  { name: "Golden Idol", emoji: "👑", rarity: "rare", color: "#FFD700" },
  { name: "Crystal Skull", emoji: "💀", rarity: "legendary", color: "#E0FFFF" },
  { name: "Ancient Tablet", emoji: "📜", rarity: "legendary", color: "#DEB887" },
];

const GRID_SIZE = 16;
const CELL_SIZE = 24;

type Cell = {
  type: CellType;
  dirtLayers: number;
  artifact?: ArtifactType;
  revealed: boolean;
  damaged: boolean;
};

type DigSite = {
  name: string;
  description: string;
  dirtColor: string;
  bgColor: string;
};

const DIG_SITES: DigSite[] = [
  { name: "Egyptian Tomb", description: "Sandy excavation near the pyramids", dirtColor: "#C19A6B", bgColor: "#2C1810" },
  { name: "Roman Villa", description: "Ancient ruins beneath Italian soil", dirtColor: "#8B4513", bgColor: "#1A1A2E" },
  { name: "Mayan Temple", description: "Jungle-covered mysteries await", dirtColor: "#556B2F", bgColor: "#0D2818" },
  { name: "Viking Settlement", description: "Frozen earth holds Nordic secrets", dirtColor: "#4A4A4A", bgColor: "#1C1C2E" },
];

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [currentSite, setCurrentSite] = useState<DigSite>(DIG_SITES[0]);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<ArtifactType[]>([]);
  const [score, setScore] = useState(0);
  const [clickSpeed, setClickSpeed] = useState<number[]>([]);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [brushSize, setBrushSize] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const generateGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    const artifactCount = Math.floor(Math.random() * 5) + 3;
    const artifactPositions: Set<string> = new Set();

    // Place artifacts
    while (artifactPositions.size < artifactCount) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      artifactPositions.add(`${x},${y}`);
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const isArtifact = artifactPositions.has(`${x},${y}`);
        const randomArtifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
        
        row.push({
          type: isArtifact ? "artifact" : "dirt",
          dirtLayers: Math.floor(Math.random() * 3) + 2,
          artifact: isArtifact ? randomArtifact : undefined,
          revealed: false,
          damaged: false,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, []);

  const startNewDig = useCallback(() => {
    const randomSite = DIG_SITES[Math.floor(Math.random() * DIG_SITES.length)];
    setCurrentSite(randomSite);
    setGrid(generateGrid());
    setDiscoveredArtifacts([]);
    setScore(0);
    setClickSpeed([]);
    setLastClickTime(0);
    setGameStarted(true);
    setIsComplete(false);
  }, [generateGrid]);

  const getAverageSpeed = useCallback(() => {
    if (clickSpeed.length < 2) return 500;
    const recent = clickSpeed.slice(-5);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }, [clickSpeed]);

  const handleCellClick = useCallback((x: number, y: number) => {
    if (!gameStarted || isComplete) return;

    const now = Date.now();
    if (lastClickTime > 0) {
      const timeDiff = now - lastClickTime;
      setClickSpeed(prev => [...prev.slice(-9), timeDiff]);
    }
    setLastClickTime(now);

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const cell = newGrid[ny][nx];
            
            if (cell.dirtLayers > 0) {
              const avgSpeed = getAverageSpeed();
              const isTooFast = avgSpeed < 150;
              
              cell.dirtLayers--;
              
              if (cell.dirtLayers === 0) {
                cell.revealed = true;
                
                if (cell.type === "artifact" && cell.artifact) {
                  if (isTooFast && brushSize > 1) {
                    cell.damaged = true;
                    cell.type = "damaged";
                  } else {
                    const rarityMultiplier = {
                      common: 1,
                      uncommon: 2,
                      rare: 5,
                      legendary: 10,
                    };
                    const speedBonus = avgSpeed > 300 ? 2 : avgSpeed > 200 ? 1.5 : 1;
                    const points = Math.floor(100 * rarityMultiplier[cell.artifact.rarity] * speedBonus);
                    
                    setScore(prev => prev + points);
                    setDiscoveredArtifacts(prev => [...prev, cell.artifact!]);
                  }
                } else {
                  cell.type = "empty";
                }
              }
            }
          }
        }
      }
      
      return newGrid;
    });
  }, [gameStarted, isComplete, lastClickTime, brushSize, getAverageSpeed]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = currentSite.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell.dirtLayers > 0) {
          const opacity = 0.3 + (cell.dirtLayers / 5) * 0.7;
          ctx.fillStyle = currentSite.dirtColor;
          ctx.globalAlpha = opacity;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          ctx.globalAlpha = 1;

          // Add texture
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          for (let i = 0; i < cell.dirtLayers; i++) {
            const dotX = px + Math.random() * CELL_SIZE;
            const dotY = py + Math.random() * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (cell.revealed) {
          if (cell.type === "artifact" && cell.artifact) {
            ctx.fillStyle = cell.artifact.color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            ctx.globalAlpha = 1;
            
            ctx.font = `${CELL_SIZE - 4}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cell.artifact.emoji, px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 2);
          } else if (cell.damaged) {
            ctx.fillStyle = "#4A4A4A";
            ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = "#FF0000";
            ctx.font = `${CELL_SIZE - 4}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("💔", px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 2);
          }
        }

        // Grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      });
    });
  }, [grid, currentSite]);

  useEffect(() => {
    if (gameStarted) {
      drawGrid();
    }
  }, [gameStarted, drawGrid]);

  useEffect(() => {
    if (!gameStarted || grid.length === 0) return;

    const allRevealed = grid.every(row => 
      row.every(cell => cell.dirtLayers === 0)
    );
    
    if (allRevealed) {
      setIsComplete(true);
    }
  }, [grid, gameStarted]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      handleCellClick(x, y);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-gray-400";
      case "uncommon": return "text-green-400";
      case "rare": return "text-blue-400";
      case "legendary": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const speedWarning = getAverageSpeed() < 150;

  return (
    <FeatureWrapper day={405} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Unearth Ancient Treasures
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click carefully to brush away dirt and reveal artifacts. 
            <span className="font-semibold text-amber-500"> Slow and steady preserves the relics!</span>
          </p>
        </div>

        {!gameStarted ? (
          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 gap-4">
              {DIG_SITES.map((site) => (
                <button
                  key={site.name}
                  onClick={() => {
                    setCurrentSite(site);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentSite.name === site.name 
                      ? "border-amber-500 bg-amber-500/20" 
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: "var(--color-bg-secondary)" }}
                >
                  <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{site.name}</h3>
                  <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>{site.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={startNewDig}
              className="btn-primary px-8 py-3 text-lg font-bold"
            >
              🏛️ Begin Excavation
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: currentSite.bgColor }}
              >
                <canvas
                  ref={canvasRef}
                  width={GRID_SIZE * CELL_SIZE}
                  height={GRID_SIZE * CELL_SIZE}
                  onClick={handleCanvasClick}
                  className="cursor-pointer rounded"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              <div className="flex items-center gap-4">
                <span style={{ color: "var(--color-text-dim)" }}>Brush Size:</span>
                {[1, 2, 3].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      brushSize === size 
                        ? "border-amber-500 bg-amber-500/30" 
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: "var(--color-bg-secondary)" }}
                  >
                    <span className="text-lg">{size === 1 ? "🖌️" : size === 2 ? "🪥" : "🧹"}</span>
                  </button>
                ))}
              </div>

              {speedWarning && brushSize > 1 && (
                <div className="px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm font-bold">
                    ⚠️ Slow down! You might damage artifacts!
                  </p>
                </div>
              )}
            </div>

            <div 
              className="flex flex-col gap-4 p-4 rounded-lg min-w-64"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
                  📍 {currentSite.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                  {currentSite.description}
                </p>
              </div>

              <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
                  Score: {score}
                </p>
              </div>

              <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <h4 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Discovered Artifacts ({discoveredArtifacts.length})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {discoveredArtifacts.map((artifact, i) => (
                    <div 
                      key={i}
                      className={`px-2 py-1 rounded text-sm ${getRarityColor(artifact.rarity)}`}
                      style={{ backgroundColor: "var(--color-bg)" }}
                      title={artifact.name}
                    >
                      {artifact.emoji} {artifact.name}
                    </div>
                  ))}
                  {discoveredArtifacts.length === 0 && (
                    <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                      No artifacts yet...
                    </p>
                  )}
                </div>
              </div>

              {isComplete && (
                <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                  <div className="p-4 bg-amber-500/20 border border-amber-500 rounded-lg text-center">
                    <h3 className="text-xl font-bold text-amber-400 mb-2">
                      🎉 Excavation Complete!
                    </h3>
                    <p style={{ color: "var(--color-text)" }}>
                      Final Score: <span className="font-bold text-2xl">{score}</span>
                    </p>
                    <p className="text-sm mt-2" style={{ color: "var(--color-text-dim)" }}>
                      Artifacts found: {discoveredArtifacts.length}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={startNewDig}
                className="btn-secondary w-full"
              >
                🔄 New Dig Site
              </button>
            </div>
          </div>
        )}

        <div 
          className="text-center text-sm max-w-md p-4 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}
        >
          <p className="font-bold mb-2" style={{ color: "var(--color-text)" }}>Pro Tips:</p>
          <ul className="text-left space-y-1">
            <li>🖌️ Use smaller brushes near potential artifacts</li>
            <li>⏱️ Slower clicking = better condition artifacts</li>
            <li>💎 Rare artifacts are worth more points</li>
            <li>💔 Rushing with big brushes can damage finds!</li>
          </ul>
        </div>
      </div>
    </FeatureWrapper>
  );
}