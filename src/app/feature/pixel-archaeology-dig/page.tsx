"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

type ArtifactType = "empty" | "dirt" | "pottery" | "bone" | "coin" | "gem" | "skull" | "ancient_tool" | "mystery_artifact" | "fossil" | "tablet";

interface Cell {
  type: ArtifactType;
  revealed: boolean;
  depth: number;
  colorIndex: number;
}

interface Artifact {
  type: ArtifactType;
  name: string;
  emoji: string;
  rarity: number;
  points: number;
  description: string;
}

const ARTIFACTS: Record<ArtifactType, Artifact> = {
  empty: { type: "empty", name: "Nothing", emoji: "🕳️", rarity: 40, points: 0, description: "Just dirt and disappointment" },
  dirt: { type: "dirt", name: "Dirt", emoji: "🟫", rarity: 0, points: 0, description: "Good old fashioned dirt" },
  pottery: { type: "pottery", name: "Ancient Pottery", emoji: "🏺", rarity: 20, points: 50, description: "A shard of ancient pottery! Someone ate soup from this 2000 years ago." },
  bone: { type: "bone", name: "Fossil Bone", emoji: "🦴", rarity: 15, points: 75, description: "A prehistoric bone! Could be dinosaur... or last week's BBQ." },
  coin: { type: "coin", name: "Ancient Coin", emoji: "🪙", rarity: 12, points: 100, description: "A coin from a lost civilization! Worth 0 dollars but priceless in memories." },
  gem: { type: "gem", name: "Precious Gem", emoji: "💎", rarity: 5, points: 200, description: "A glittering gem! The ancients had drip." },
  skull: { type: "skull", name: "Ancient Skull", emoji: "💀", rarity: 4, points: 250, description: "A mysterious skull! Don't worry, it's probably fine." },
  ancient_tool: { type: "ancient_tool", name: "Stone Tool", emoji: "🪨", rarity: 10, points: 125, description: "An ancient tool! They had hammers before Home Depot." },
  mystery_artifact: { type: "mystery_artifact", name: "Mystery Artifact", emoji: "🗿", rarity: 2, points: 500, description: "What IS this thing?! The museum will pay handsomely." },
  fossil: { type: "fossil", name: "Complete Fossil", emoji: "🦕", rarity: 3, points: 350, description: "A complete fossil! This dino definitely didn't skip leg day." },
  tablet: { type: "tablet", name: "Stone Tablet", emoji: "📜", rarity: 4, points: 300, description: "Ancient writing! Probably says 'Dave was here.'" }
};

const GRID_SIZE = 12;
const TOTAL_DIGS = 25;

const DIRT_COLORS = [
  "#8B4513",
  "#A0522D", 
  "#6B4423",
  "#8B6914",
  "#654321",
  "#5D4E37"
];

// Seeded random number generator for consistent results
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateDigSite(seed: number): Cell[][] {
  const random = seededRandom(seed);
  const grid: Cell[][] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const rand = random() * 100;
      let cumulativeRarity = 0;
      let selectedType: ArtifactType = "empty";
      
      const artifactTypes = Object.keys(ARTIFACTS).filter(t => t !== "dirt") as ArtifactType[];
      
      for (const artifactType of artifactTypes) {
        cumulativeRarity += ARTIFACTS[artifactType].rarity;
        if (rand < cumulativeRarity) {
          selectedType = artifactType;
          break;
        }
      }
      
      row.push({
        type: selectedType,
        revealed: false,
        depth: Math.floor(random() * 3) + 1,
        colorIndex: Math.floor(random() * DIRT_COLORS.length)
      });
    }
    grid.push(row);
  }
  
  return grid;
}

// Use a fixed seed for initial render
const INITIAL_SEED = 12345;

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Cell[][]>(() => generateDigSite(INITIAL_SEED));
  const [digsRemaining, setDigsRemaining] = useState(TOTAL_DIGS);
  const [score, setScore] = useState(0);
  const [discoveries, setDiscoveries] = useState<Artifact[]>([]);
  const [lastDiscovery, setLastDiscovery] = useState<Artifact | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [siteNumber, setSiteNumber] = useState(1);
  const [showDiscoveryPopup, setShowDiscoveryPopup] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a new random grid on client-side mount
  useEffect(() => {
    setIsClient(true);
    const newSeed = Date.now();
    setGrid(generateDigSite(newSeed));
  }, []);

  const handleDig = useCallback((x: number, y: number) => {
    if (gameOver || digsRemaining <= 0) return;
    
    const cell = grid[y]?.[x];
    if (!cell || cell.revealed) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(c => ({ ...c })));
      if (newGrid[y]?.[x]) {
        newGrid[y][x].revealed = true;
      }
      return newGrid;
    });
    
    setDigsRemaining(prev => prev - 1);
    
    const artifact = ARTIFACTS[cell.type];
    if (artifact && artifact.points > 0) {
      setScore(prev => prev + artifact.points);
      setDiscoveries(prev => [...prev, artifact]);
      setLastDiscovery(artifact);
      setShowDiscoveryPopup(true);
      
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      popupTimeoutRef.current = setTimeout(() => {
        setShowDiscoveryPopup(false);
      }, 2000);
    } else {
      setLastDiscovery(null);
    }
    
    if (digsRemaining <= 1) {
      setGameOver(true);
    }
  }, [grid, digsRemaining, gameOver]);

  const startNewSite = useCallback(() => {
    const newSeed = Date.now();
    setGrid(generateDigSite(newSeed));
    setDigsRemaining(TOTAL_DIGS);
    setDiscoveries([]);
    setLastDiscovery(null);
    setGameOver(false);
    setSiteNumber(prev => prev + 1);
    setShowDiscoveryPopup(false);
  }, []);

  const resetGame = useCallback(() => {
    const newSeed = Date.now();
    setGrid(generateDigSite(newSeed));
    setDigsRemaining(TOTAL_DIGS);
    setScore(0);
    setDiscoveries([]);
    setLastDiscovery(null);
    setGameOver(false);
    setSiteNumber(1);
    setShowDiscoveryPopup(false);
  }, []);

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  const revealedCount = grid.flat().filter(c => c.revealed).length;
  const totalCells = GRID_SIZE * GRID_SIZE;
  const progressPercent = (revealedCount / totalCells) * 100;

  return (
    <FeatureWrapper day={393} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🏛️ Archaeological Dig Site #{siteNumber}
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Click squares to excavate. Find ancient treasures before your digs run out!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full">
          <div 
            className="px-4 py-2 rounded-lg text-center"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
              🪙 {score.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Score</div>
          </div>
          
          <div 
            className="px-4 py-2 rounded-lg text-center"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: digsRemaining <= 5 ? "#ef4444" : "var(--color-text)" }}>
              ⛏️ {digsRemaining}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Digs Left</div>
          </div>
          
          <div 
            className="px-4 py-2 rounded-lg text-center"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              🏺 {discoveries.length}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Artifacts</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div 
              className="h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: "var(--color-accent)"
              }}
            />
          </div>
          <div className="text-xs text-center mt-1" style={{ color: "var(--color-text-dim)" }}>
            {revealedCount}/{totalCells} squares excavated
          </div>
        </div>

        <div className="relative">
          <div 
            className="rounded-lg p-2 shadow-lg"
            style={{ 
              backgroundColor: "#3d2817",
              border: "4px solid #2a1a0e"
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gap: "2px"
              }}
            >
              {grid.map((row, y) =>
                row.map((cell, x) => {
                  const bgColor = cell.revealed 
                    ? (cell.type === "empty" ? "#4a3728" : "#5a4738") 
                    : DIRT_COLORS[cell.colorIndex] || DIRT_COLORS[0];
                  
                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => handleDig(x, y)}
                      disabled={cell.revealed || gameOver || digsRemaining <= 0 || !isClient}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200 text-lg sm:text-xl"
                      style={{
                        backgroundColor: bgColor,
                        borderRadius: "2px",
                        cursor: cell.revealed || gameOver || !isClient ? "default" : "pointer",
                        transform: cell.revealed ? "none" : "translateY(-2px)",
                        boxShadow: cell.revealed 
                          ? "inset 0 2px 4px rgba(0,0,0,0.3)" 
                          : "0 2px 0 #4a3020, 0 3px 2px rgba(0,0,0,0.3)",
                        opacity: cell.revealed && cell.type === "empty" ? 0.7 : 1
                      }}
                    >
                      {cell.revealed ? (
                        cell.type !== "empty" ? ARTIFACTS[cell.type]?.emoji || "" : ""
                      ) : (
                        <span className="opacity-30">·</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {showDiscoveryPopup && lastDiscovery && (
            <div 
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg animate-bounce"
              style={{ 
                backgroundColor: "var(--color-accent)",
                color: "white",
                whiteSpace: "nowrap"
              }}
            >
              <span className="text-xl mr-2">{lastDiscovery.emoji}</span>
              <span className="font-bold">{lastDiscovery.name}!</span>
              <span className="ml-2">+{lastDiscovery.points}</span>
            </div>
          )}
        </div>

        {lastDiscovery && (
          <div 
            className="text-center p-3 rounded-lg max-w-sm"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)"
            }}
          >
            <div className="text-3xl mb-1">{lastDiscovery.emoji}</div>
            <div className="font-bold" style={{ color: "var(--color-text)" }}>
              {lastDiscovery.name}
            </div>
            <div className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
              &quot;{lastDiscovery.description}&quot;
            </div>
          </div>
        )}

        {gameOver && (
          <div 
            className="text-center p-6 rounded-lg"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)",
              border: "2px solid var(--color-accent)"
            }}
          >
            <h3 
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🎉 Dig Complete!
            </h3>
            <p style={{ color: "var(--color-text-dim)" }} className="mb-4">
              You found {discoveries.length} artifact{discoveries.length !== 1 ? "s" : ""} at Site #{siteNumber}!
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {discoveries.map((artifact, i) => (
                <span key={i} className="text-2xl" title={artifact.name}>
                  {artifact.emoji}
                </span>
              ))}
              {discoveries.length === 0 && (
                <span style={{ color: "var(--color-text-dim)" }}>No artifacts found... better luck next dig!</span>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startNewSite}
                className="btn-primary px-4 py-2 rounded-lg font-bold"
              >
                🗺️ New Site
              </button>
              <button
                onClick={resetGame}
                className="btn-secondary px-4 py-2 rounded-lg"
              >
                🔄 Reset Score
              </button>
            </div>
          </div>
        )}

        <div 
          className="text-center p-4 rounded-lg w-full max-w-md"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)"
          }}
        >
          <h4 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
            📋 Artifact Guide
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {Object.values(ARTIFACTS)
              .filter(a => a.type !== "dirt" && a.type !== "empty")
              .sort((a, b) => b.rarity - a.rarity)
              .map(artifact => (
                <div 
                  key={artifact.type}
                  className="flex items-center gap-1 px-2 py-1 rounded"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <span>{artifact.emoji}</span>
                  <span style={{ color: "var(--color-text-dim)" }}>
                    {artifact.points}pts
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </FeatureWrapper>
  );
}