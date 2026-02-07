"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Tile {
  id: number;
  x: number;
  y: number;
  revealed: boolean;
  content: TileContent;
  revealTime?: number;
}

type TileContent = {
  type: "empty" | "dirt" | "rock" | "copper" | "silver" | "gold" | "diamond" | "ruby" | "ancient_relic" | "crown" | "dragon_egg";
  emoji: string;
  value: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  name: string;
};

const TILE_CONTENTS: TileContent[] = [
  { type: "empty", emoji: "🕳️", value: 0, rarity: "common", name: "Empty Hole" },
  { type: "dirt", emoji: "🟫", value: 1, rarity: "common", name: "Plain Dirt" },
  { type: "dirt", emoji: "🪨", value: 2, rarity: "common", name: "Rocky Dirt" },
  { type: "rock", emoji: "�ite", value: 3, rarity: "common", name: "Stone" },
  { type: "copper", emoji: "🟠", value: 10, rarity: "uncommon", name: "Copper Nugget" },
  { type: "silver", emoji: "⬜", value: 25, rarity: "uncommon", name: "Silver Ore" },
  { type: "gold", emoji: "💰", value: 50, rarity: "rare", name: "Gold Coins" },
  { type: "gold", emoji: "🪙", value: 75, rarity: "rare", name: "Ancient Gold" },
  { type: "diamond", emoji: "💎", value: 150, rarity: "epic", name: "Diamond" },
  { type: "ruby", emoji: "❤️", value: 200, rarity: "epic", name: "Ruby Heart" },
  { type: "ancient_relic", emoji: "🏺", value: 300, rarity: "epic", name: "Ancient Vase" },
  { type: "ancient_relic", emoji: "📿", value: 350, rarity: "epic", name: "Sacred Beads" },
  { type: "crown", emoji: "👑", value: 500, rarity: "legendary", name: "Royal Crown" },
  { type: "dragon_egg", emoji: "🥚", value: 1000, rarity: "legendary", name: "Dragon Egg" },
];

const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 8,
  legendary: 2,
};

const RARITY_COLORS = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

const RARITY_BG = {
  common: "bg-gray-800/50",
  uncommon: "bg-green-900/50",
  rare: "bg-blue-900/50",
  epic: "bg-purple-900/50",
  legendary: "bg-yellow-900/50 animate-pulse",
};

const GRID_SIZE = 10;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const REGEN_INTERVAL = 10000; // 10 seconds

function getRandomContent(): TileContent {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  let selectedRarity: keyof typeof RARITY_WEIGHTS = "common";
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity as keyof typeof RARITY_WEIGHTS;
      break;
    }
  }
  
  const matchingContents = TILE_CONTENTS.filter(c => c.rarity === selectedRarity);
  return matchingContents[Math.floor(Math.random() * matchingContents.length)];
}

function generateTiles(): Tile[] {
  return Array.from({ length: TOTAL_TILES }, (_, i) => ({
    id: i,
    x: i % GRID_SIZE,
    y: Math.floor(i / GRID_SIZE),
    revealed: false,
    content: getRandomContent(),
  }));
}

export default function PixelTreasureHunt() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [totalDigs, setTotalDigs] = useState(0);
  const [lastFind, setLastFind] = useState<TileContent | null>(null);
  const [showLastFind, setShowLastFind] = useState(false);
  const [legendaryCount, setLegendaryCount] = useState(0);
  const [regenTimer, setRegenTimer] = useState(REGEN_INTERVAL / 1000);
  const regenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGame = useCallback(() => {
    setTiles(generateTiles());
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    // Regeneration logic
    regenIntervalRef.current = setInterval(() => {
      setTiles(prev => {
        const revealedTiles = prev.filter(t => t.revealed);
        if (revealedTiles.length === 0) return prev;
        
        // Pick 1-3 random revealed tiles to regenerate
        const numToRegen = Math.min(Math.floor(Math.random() * 3) + 1, revealedTiles.length);
        const tilesToRegen = new Set<number>();
        
        while (tilesToRegen.size < numToRegen) {
          const randomTile = revealedTiles[Math.floor(Math.random() * revealedTiles.length)];
          tilesToRegen.add(randomTile.id);
        }
        
        return prev.map(tile => 
          tilesToRegen.has(tile.id) 
            ? { ...tile, revealed: false, content: getRandomContent() }
            : tile
        );
      });
      setRegenTimer(REGEN_INTERVAL / 1000);
    }, REGEN_INTERVAL);

    // Timer countdown
    timerIntervalRef.current = setInterval(() => {
      setRegenTimer(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (regenIntervalRef.current) clearInterval(regenIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleTileClick = (tile: Tile) => {
    if (tile.revealed) return;
    
    setTiles(prev => 
      prev.map(t => 
        t.id === tile.id 
          ? { ...t, revealed: true, revealTime: Date.now() }
          : t
      )
    );
    
    setScore(prev => prev + tile.content.value);
    setTotalDigs(prev => prev + 1);
    setLastFind(tile.content);
    setShowLastFind(true);
    
    if (tile.content.rarity === "legendary") {
      setLegendaryCount(prev => prev + 1);
    }
    
    setTimeout(() => setShowLastFind(false), 2000);
  };

  const resetGame = () => {
    initializeGame();
    setScore(0);
    setTotalDigs(0);
    setLegendaryCount(0);
    setLastFind(null);
    setShowLastFind(false);
  };

  const revealedCount = tiles.filter(t => t.revealed).length;
  const unrevealedCount = TOTAL_TILES - revealedCount;

  return (
    <FeatureWrapper day={434} title="Pixel Treasure Hunt" emoji="⛏️">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            ⛏️ Dig for Treasure! ⛏️
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click tiles to unearth hidden riches. Rarer finds = more points!
            <br />
            <span className="text-xs">🔄 Tiles regenerate every {REGEN_INTERVAL / 1000}s - keep digging!</span>
          </p>
        </div>

        {/* Stats Bar */}
        <div 
          className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Score</div>
            <div className="text-xl font-bold text-yellow-400">💰 {score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Digs</div>
            <div className="text-xl font-bold" style={{ color: "var(--color-text)" }}>⛏️ {totalDigs}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Legendary</div>
            <div className="text-xl font-bold text-purple-400">👑 {legendaryCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Regen</div>
            <div className="text-xl font-bold text-green-400">🔄 {regenTimer}s</div>
          </div>
        </div>

        {/* Last Find Popup */}
        {showLastFind && lastFind && (
          <div 
            className={`mb-4 p-3 rounded-lg text-center transition-all duration-300 ${RARITY_BG[lastFind.rarity]}`}
            style={{ border: "1px solid var(--color-border)" }}
          >
            <span className="text-2xl mr-2">{lastFind.emoji}</span>
            <span className={`font-bold ${RARITY_COLORS[lastFind.rarity]}`}>
              {lastFind.name}
            </span>
            <span className="ml-2 text-yellow-400">+{lastFind.value}</span>
          </div>
        )}

        {/* Game Grid */}
        <div 
          className="rounded-lg p-2 mb-4"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)", 
            border: "2px solid var(--color-border)" 
          }}
        >
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gap: "4px"
            }}
          >
            {tiles.map(tile => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={tile.revealed}
                className={`
                  aspect-square rounded-md text-xl flex items-center justify-center
                  transition-all duration-200 transform
                  ${tile.revealed 
                    ? `${RARITY_BG[tile.content.rarity]} cursor-default` 
                    : "bg-amber-900/60 hover:bg-amber-800/80 hover:scale-105 cursor-pointer active:scale-95"
                  }
                `}
                style={{ 
                  border: tile.revealed 
                    ? "1px solid transparent" 
                    : "1px solid rgba(139, 69, 19, 0.5)",
                  minHeight: "40px"
                }}
              >
                {tile.revealed ? (
                  <span className="animate-bounce">{tile.content.emoji}</span>
                ) : (
                  <span className="opacity-50">🟤</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
            <span>Explored: {revealedCount}/{TOTAL_TILES}</span>
            <span>Hidden treasures: {unrevealedCount}</span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
              style={{ width: `${(revealedCount / TOTAL_TILES) * 100}%` }}
            />
          </div>
        </div>

        {/* Legend */}
        <div 
          className="rounded-lg p-3 mb-4"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Rarity Guide
          </h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className={RARITY_COLORS.common}>Common</div>
            <div className={RARITY_COLORS.uncommon}>Uncommon</div>
            <div className={RARITY_COLORS.rare}>Rare</div>
            <div className={RARITY_COLORS.epic}>Epic</div>
            <div className={RARITY_COLORS.legendary}>Legendary</div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetGame}
          className="btn-primary w-full py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform"
        >
          🔄 New Expedition
        </button>

        {/* Fun Tip */}
        <p 
          className="text-center text-xs mt-4 italic"
          style={{ color: "var(--color-text-dim)" }}
        >
          Pro tip: Patience pays off! Wait for tiles to regenerate for more chances at legendary finds! 🐉
        </p>
      </div>
    </FeatureWrapper>
  );
}