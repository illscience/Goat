"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Tile {
  dirtLevel: number; // 0-4, where 4 is fully covered
  artifact: ArtifactType | null;
  revealed: boolean;
}

interface ArtifactType {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  category: "fossil" | "treasure" | "structure" | "tool";
  points: number;
}

interface Discovery {
  artifact: ArtifactType;
  digSite: string;
  timestamp: Date;
}

const ARTIFACTS: ArtifactType[] = [
  // Fossils
  { id: "trilobite", name: "Trilobite", emoji: "🦐", rarity: "common", category: "fossil", points: 10 },
  { id: "ammonite", name: "Ammonite", emoji: "🐚", rarity: "common", category: "fossil", points: 15 },
  { id: "dino_bone", name: "Dinosaur Bone", emoji: "🦴", rarity: "uncommon", category: "fossil", points: 50 },
  { id: "amber", name: "Amber with Insect", emoji: "🪲", rarity: "rare", category: "fossil", points: 100 },
  { id: "t_rex_skull", name: "T-Rex Skull", emoji: "🦖", rarity: "legendary", category: "fossil", points: 500 },
  
  // Treasures
  { id: "coin", name: "Ancient Coin", emoji: "🪙", rarity: "common", category: "treasure", points: 20 },
  { id: "ring", name: "Golden Ring", emoji: "💍", rarity: "uncommon", category: "treasure", points: 75 },
  { id: "crown", name: "Royal Crown", emoji: "👑", rarity: "rare", category: "treasure", points: 200 },
  { id: "holy_grail", name: "Holy Grail", emoji: "🏆", rarity: "legendary", category: "treasure", points: 1000 },
  
  // Structures
  { id: "pottery", name: "Clay Pottery", emoji: "🏺", rarity: "common", category: "structure", points: 15 },
  { id: "column", name: "Roman Column", emoji: "🏛️", rarity: "uncommon", category: "structure", points: 60 },
  { id: "sarcophagus", name: "Sarcophagus", emoji: "⚰️", rarity: "rare", category: "structure", points: 150 },
  
  // Tools
  { id: "arrowhead", name: "Stone Arrowhead", emoji: "🔺", rarity: "common", category: "tool", points: 10 },
  { id: "axe", name: "Bronze Axe", emoji: "🪓", rarity: "uncommon", category: "tool", points: 40 },
  { id: "sword", name: "Legendary Sword", emoji: "⚔️", rarity: "rare", category: "tool", points: 120 },
];

const DIG_SITES = [
  "Egyptian Desert 🏜️",
  "Roman Ruins 🏛️",
  "Jurassic Coast 🌊",
  "Mayan Temple 🌴",
  "Viking Settlement ❄️",
  "Greek Island 🏝️",
];

const GRID_SIZE = 12;

const RARITY_COLORS = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  legendary: "text-yellow-400",
};

const RARITY_BG = {
  common: "bg-gray-800",
  uncommon: "bg-green-900",
  rare: "bg-blue-900",
  legendary: "bg-yellow-900",
};

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [currentSite, setCurrentSite] = useState("");
  const [score, setScore] = useState(0);
  const [brushSize, setBrushSize] = useState(1);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [museum, setMuseum] = useState<Discovery[]>([]);
  const [showMuseum, setShowMuseum] = useState(false);
  const [recentFind, setRecentFind] = useState<ArtifactType | null>(null);
  const [isDigging, setIsDigging] = useState(false);
  const [digCount, setDigCount] = useState(0);
  const brushSoundRef = useRef<number>(0);

  const generateGrid = useCallback(() => {
    const site = DIG_SITES[Math.floor(Math.random() * DIG_SITES.length)];
    setCurrentSite(site);
    setDiscoveries([]);
    setDigCount(0);

    const newGrid: Tile[][] = [];
    const artifactCount = Math.floor(Math.random() * 8) + 5; // 5-12 artifacts
    const artifactPositions = new Set<string>();

    // Place artifacts
    while (artifactPositions.size < artifactCount) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      artifactPositions.add(`${x},${y}`);
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const hasArtifact = artifactPositions.has(`${x},${y}`);
        let artifact: ArtifactType | null = null;
        
        if (hasArtifact) {
          const roll = Math.random();
          let rarity: "common" | "uncommon" | "rare" | "legendary";
          if (roll < 0.5) rarity = "common";
          else if (roll < 0.8) rarity = "uncommon";
          else if (roll < 0.95) rarity = "rare";
          else rarity = "legendary";
          
          const filtered = ARTIFACTS.filter(a => a.rarity === rarity);
          artifact = filtered[Math.floor(Math.random() * filtered.length)];
        }

        row.push({
          dirtLevel: 4,
          artifact,
          revealed: false,
        });
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
  }, []);

  useEffect(() => {
    generateGrid();
    // Load museum from localStorage
    const saved = localStorage.getItem("pixelArchaeologyMuseum");
    if (saved) {
      try {
        setMuseum(JSON.parse(saved));
      } catch {
        setMuseum([]);
      }
    }
  }, [generateGrid]);

  const dig = (centerX: number, centerY: number) => {
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(tile => ({ ...tile })));
      
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            const tile = newGrid[y][x];
            if (tile.dirtLevel > 0) {
              tile.dirtLevel--;
              setDigCount(c => c + 1);
              
              if (tile.dirtLevel === 0 && tile.artifact && !tile.revealed) {
                tile.revealed = true;
                setScore(s => s + tile.artifact!.points);
                setRecentFind(tile.artifact);
                
                const discovery: Discovery = {
                  artifact: tile.artifact,
                  digSite: currentSite,
                  timestamp: new Date(),
                };
                setDiscoveries(d => [...d, discovery]);
                
                setTimeout(() => setRecentFind(null), 2000);
              }
            }
          }
        }
      }
      
      return newGrid;
    });
  };

  const handleMouseDown = (x: number, y: number) => {
    setIsDigging(true);
    dig(x, y);
  };

  const handleMouseMove = (x: number, y: number) => {
    if (isDigging) {
      dig(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const saveToMuseum = () => {
    const newMuseum = [...museum, ...discoveries];
    setMuseum(newMuseum);
    localStorage.setItem("pixelArchaeologyMuseum", JSON.stringify(newMuseum));
    generateGrid();
  };

  const getDirtColor = (level: number) => {
    switch (level) {
      case 4: return "bg-amber-900";
      case 3: return "bg-amber-800";
      case 2: return "bg-amber-700";
      case 1: return "bg-amber-600";
      default: return "bg-amber-200";
    }
  };

  const totalArtifacts = grid.flat().filter(t => t.artifact).length;
  const foundArtifacts = discoveries.length;
  const allFound = foundArtifacts === totalArtifacts && totalArtifacts > 0;

  return (
    <FeatureWrapper day={392} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-6">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🏺 Pixel Archaeology Dig
          </h1>
          <p style={{ color: "var(--color-text-dim)" }}>
            Carefully brush away the dirt to uncover ancient artifacts!
          </p>
        </div>

        {/* Stats Bar */}
        <div 
          className="flex flex-wrap justify-center gap-4 mb-4 p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="text-center">
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Site</div>
            <div className="font-bold" style={{ color: "var(--color-text)" }}>{currentSite}</div>
          </div>
          <div className="text-center">
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Score</div>
            <div className="font-bold text-yellow-400">{score} pts</div>
          </div>
          <div className="text-center">
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Found</div>
            <div className="font-bold" style={{ color: "var(--color-text)" }}>{foundArtifacts}/{totalArtifacts}</div>
          </div>
          <div className="text-center">
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Museum</div>
            <div className="font-bold text-purple-400">{museum.length} items</div>
          </div>
        </div>

        {/* Brush Size */}
        <div className="flex justify-center gap-2 mb-4">
          <span style={{ color: "var(--color-text-dim)" }}>Brush:</span>
          {[1, 2, 3].map(size => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`px-3 py-1 rounded ${brushSize === size ? 'bg-amber-600' : ''}`}
              style={{ 
                backgroundColor: brushSize === size ? undefined : "var(--color-bg-secondary)",
                color: "var(--color-text)"
              }}
            >
              {size === 1 ? "🖌️" : size === 2 ? "🖌️🖌️" : "🖌️🖌️🖌️"}
            </button>
          ))}
        </div>

        {/* Recent Find Popup */}
        {recentFind && (
          <div 
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       p-6 rounded-xl shadow-2xl z-50 text-center animate-bounce
                       ${RARITY_BG[recentFind.rarity]}`}
            style={{ border: "2px solid var(--color-border)" }}
          >
            <div className="text-6xl mb-2">{recentFind.emoji}</div>
            <div className={`text-xl font-bold ${RARITY_COLORS[recentFind.rarity]}`}>
              {recentFind.name}
            </div>
            <div className="text-sm uppercase tracking-wide mt-1 opacity-70">
              {recentFind.rarity}
            </div>
            <div className="text-yellow-400 mt-2">+{recentFind.points} pts</div>
          </div>
        )}

        {/* Dig Grid */}
        <div 
          className="mx-auto rounded-lg p-2 mb-4"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)",
            border: "2px solid var(--color-border)",
            width: "fit-content"
          }}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gap: '2px',
            }}
          >
            {grid.map((row, y) =>
              row.map((tile, x) => (
                <div
                  key={`${x}-${y}`}
                  onMouseDown={() => handleMouseDown(x, y)}
                  onMouseEnter={() => handleMouseMove(x, y)}
                  onMouseUp={handleMouseUp}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded cursor-pointer transition-all
                             hover:brightness-110 active:scale-95 flex items-center justify-center
                             ${getDirtColor(tile.dirtLevel)}`}
                  style={{ userSelect: 'none' }}
                >
                  {tile.dirtLevel === 0 && tile.artifact && (
                    <span className="text-lg sm:text-2xl">{tile.artifact.emoji}</span>
                  )}
                  {tile.dirtLevel === 0 && !tile.artifact && (
                    <span className="text-xs opacity-30">·</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={generateGrid}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            🗺️ New Dig Site
          </button>
          {discoveries.length > 0 && (
            <button
              onClick={saveToMuseum}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              🏛️ Save to Museum ({discoveries.length})
            </button>
          )}
          <button
            onClick={() => setShowMuseum(!showMuseum)}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            {showMuseum ? "🚪 Close Museum" : "🏛️ View Museum"}
          </button>
        </div>

        {/* Current Discoveries */}
        {discoveries.length > 0 && (
          <div 
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
              📋 This Dig's Discoveries:
            </h3>
            <div className="flex flex-wrap gap-2">
              {discoveries.map((d, i) => (
                <div 
                  key={i}
                  className={`px-3 py-1 rounded-full ${RARITY_BG[d.artifact.rarity]}`}
                >
                  <span>{d.artifact.emoji}</span>
                  <span className={`ml-1 ${RARITY_COLORS[d.artifact.rarity]}`}>
                    {d.artifact.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Found Message */}
        {allFound && (
          <div 
            className="text-center p-4 rounded-lg bg-green-900 mb-4"
            style={{ border: "2px solid var(--color-accent)" }}
          >
            <span className="text-2xl">🎉</span>
            <span className="ml-2 font-bold" style={{ color: "var(--color-text)" }}>
              Excavation Complete! All artifacts uncovered!
            </span>
          </div>
        )}

        {/* Museum */}
        {showMuseum && (
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3 
              className="text-xl font-bold mb-4 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🏛️ Your Personal Museum
            </h3>
            {museum.length === 0 ? (
              <p className="text-center" style={{ color: "var(--color-text-dim)" }}>
                No artifacts yet! Start digging to fill your museum.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {museum.map((item, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-center ${RARITY_BG[item.artifact.rarity]}`}
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      <div className="text-3xl mb-1">{item.artifact.emoji}</div>
                      <div className={`text-sm font-bold ${RARITY_COLORS[item.artifact.rarity]}`}>
                        {item.artifact.name}
                      </div>
                      <div className="text-xs opacity-60" style={{ color: "var(--color-text-dim)" }}>
                        {item.digSite.split(" ")[0]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button
                    onClick={() => {
                      setMuseum([]);
                      localStorage.removeItem("pixelArchaeologyMuseum");
                    }}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    🗑️ Clear Museum
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        <div 
          className="mt-6 p-4 rounded-lg text-center text-sm"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-dim)"
          }}
        >
          <div className="font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Rarity Guide:
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="text-gray-400">● Common</span>
            <span className="text-green-400">● Uncommon</span>
            <span className="text-blue-400">● Rare</span>
            <span className="text-yellow-400">● Legendary</span>
          </div>
        </div>
      </div>
    </FeatureWrapper>
  );
}