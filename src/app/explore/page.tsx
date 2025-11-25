"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { features } from "@/data/features";

interface BuildStatus {
  isBuilding: boolean;
}

// Tile colors - bright, playful palette
const TILE_COLORS = [
  "#FF6B6B", // coral red
  "#4ECDC4", // teal
  "#FFE66D", // yellow
  "#95E1D3", // mint
  "#F38181", // salmon
  "#AA96DA", // lavender
  "#FCBAD3", // pink
  "#A8D8EA", // sky blue
  "#FF9F43", // orange
  "#6BCB77", // green
];

// Scrabble-like random branching pattern
function getScrabblePositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const occupied = new Set<string>();

  // Start at center
  positions.push({ x: 0, y: 0 });
  occupied.add("0,0");

  // Predefined interesting pattern that looks like scrabble words crossing
  const manualOffsets = [
    // First branch going right
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    // Branch going down from center
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    // Branch going left
    { x: -1, y: 0 },
    // Branch up from the right tile
    { x: 1, y: -1 },
    { x: 1, y: -2 },
    // Branch down from left
    { x: -1, y: 1 },
    { x: -1, y: 2 },
    // More branches
    { x: 2, y: 1 },
    { x: -2, y: 0 },
    { x: 0, y: -1 },
    { x: 2, y: -1 },
    { x: -2, y: 1 },
    { x: 3, y: 0 },
    { x: 0, y: 3 },
    { x: -1, y: -1 },
    { x: 1, y: 1 },
    { x: -2, y: -1 },
    { x: 3, y: -1 },
  ];

  for (let i = 1; i < count && i <= manualOffsets.length; i++) {
    const offset = manualOffsets[i - 1];
    positions.push({ x: offset.x, y: offset.y });
    occupied.add(`${offset.x},${offset.y}`);
  }

  // If we need more positions, expand outward
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (let i = positions.length; i < count; i++) {
    for (const pos of [...positions].reverse()) {
      let placed = false;
      for (const dir of directions) {
        const newX = pos.x + dir.dx;
        const newY = pos.y + dir.dy;
        const key = `${newX},${newY}`;
        if (!occupied.has(key)) {
          positions.push({ x: newX, y: newY });
          occupied.add(key);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  return positions;
}

interface Tile {
  type: "goat" | "feature" | "building" | "empty";
  emoji?: string;
  title?: string;
  href?: string;
  day?: number;
  color?: string;
}

export default function ExplorePage() {
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    const checkBuildStatus = async () => {
      try {
        const response = await fetch("/api/build-status");
        if (response.ok) {
          const data: BuildStatus = await response.json();
          setIsBuilding(data.isBuilding);
        }
      } catch {
        // Ignore
      }
    };

    checkBuildStatus();
    const interval = setInterval(checkBuildStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sort features by day
  const sortedFeatures = [...features].sort((a, b) => a.day - b.day);

  // Create tiles: goat first, then features
  const contentTiles: Tile[] = [
    { type: "goat", emoji: "🐐", title: "The Goat", href: "/" },
    ...sortedFeatures.map((f, i) => ({
      type: "feature" as const,
      emoji: f.emoji,
      title: f.title,
      href: `/feature/${f.id}`,
      day: f.day,
      color: TILE_COLORS[i % TILE_COLORS.length],
    })),
  ];

  if (isBuilding) {
    contentTiles.push({ type: "building" });
  }

  // Get scrabble-like branching positions
  const positions = getScrabblePositions(contentTiles.length);

  // Calculate grid bounds
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y));

  const gridWidth = maxX - minX + 1;
  const gridHeight = maxY - minY + 1;

  // Create grid with tiles placed
  const grid: (Tile | null)[][] = Array(gridHeight)
    .fill(null)
    .map(() => Array(gridWidth).fill(null));

  contentTiles.forEach((tile, i) => {
    const pos = positions[i];
    const gridX = pos.x - minX;
    const gridY = pos.y - minY;
    grid[gridY][gridX] = tile;
  });

  // Calculate tile size to fill viewport - aiming for tiles that make ~50 fill the screen
  // For a 3x3 visible grid on a typical screen, we want big tiles

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-auto"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
      }}
    >
      <div
        className="grid gap-2 p-2"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
        }}
      >
        {grid.flat().map((tile, i) => {
          // Large tiles - each one is substantial
          const baseTileClasses = "w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px] xl:w-[300px] xl:h-[300px]";
          const emojiClasses = "text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]";

          if (!tile) {
            return (
              <div
                key={i}
                className={`${baseTileClasses} rounded-2xl`}
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.03)",
                }}
              />
            );
          }

          if (tile.type === "goat") {
            return (
              <Link
                key={i}
                href={tile.href!}
                className={`${baseTileClasses} ${emojiClasses} rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer relative group`}
                style={{
                  background: "linear-gradient(145deg, #FFD700 0%, #FF8C00 50%, #FFA500 100%)",
                  boxShadow: "0 10px 50px rgba(255, 215, 0, 0.4), inset 0 2px 0 rgba(255,255,255,0.4)",
                  border: "3px solid rgba(255,255,255,0.3)",
                }}
              >
                <span className="drop-shadow-lg filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{tile.emoji}</span>
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
                  }}
                />
              </Link>
            );
          }

          if (tile.type === "building") {
            return (
              <div
                key={i}
                className={`${baseTileClasses} ${emojiClasses} rounded-2xl flex items-center justify-center animate-pulse`}
                style={{
                  background: "linear-gradient(145deg, rgba(255,215,0,0.1) 0%, rgba(255,165,0,0.05) 100%)",
                  border: "3px dashed rgba(255,215,0,0.5)",
                  boxShadow: "0 0 60px rgba(255,215,0,0.2), inset 0 0 30px rgba(255,215,0,0.1)",
                }}
              >
                <span className="opacity-40">✨</span>
              </div>
            );
          }

          return (
            <Link
              key={i}
              href={tile.href!}
              className={`${baseTileClasses} ${emojiClasses} rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer`}
              style={{
                background: `linear-gradient(145deg, ${tile.color} 0%, ${tile.color}bb 100%)`,
                boxShadow: `0 10px 50px ${tile.color}44, inset 0 2px 0 rgba(255,255,255,0.3)`,
                border: "3px solid rgba(255,255,255,0.25)",
              }}
            >
              <span className="drop-shadow-lg filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{tile.emoji}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
