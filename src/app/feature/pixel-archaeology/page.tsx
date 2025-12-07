"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Tile {
  type: "sand" | "building" | "artifact" | "skeleton" | "treasure" | "pottery" | "empty";
  revealed: number; // 0-100 percentage
  color: string;
  secondaryColor?: string;
}

const GRID_SIZE = 32;
const BRUSH_SIZE = 3;
const REVEAL_AMOUNT = 15;

const ARTIFACT_COLORS = {
  building: { primary: "#8B7355", secondary: "#6B5344" },
  artifact: { primary: "#FFD700", secondary: "#DAA520" },
  skeleton: { primary: "#F5F5DC", secondary: "#DDD8C4" },
  treasure: { primary: "#50C878", secondary: "#228B22" },
  pottery: { primary: "#CD853F", secondary: "#8B4513" },
  empty: { primary: "#3D3D3D", secondary: "#2D2D2D" },
};

const SAND_COLORS = ["#C2B280", "#D4C4A8", "#E8DCC8", "#BFA98A"];

export default function PixelArchaeology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [brushing, setBrushing] = useState(false);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [stats, setStats] = useState({
    buildings: 0,
    artifacts: 0,
    skeletons: 0,
    treasures: 0,
    pottery: 0,
    totalRevealed: 0,
  });
  const [showIntro, setShowIntro] = useState(true);
  const lastBrushPos = useRef<{ x: number; y: number } | null>(null);

  // Generate the hidden world
  const generateWorld = useCallback(() => {
    const newGrid: Tile[][] = [];
    
    // First pass: create empty grid
    for (let y = 0; y < GRID_SIZE; y++) {
      newGrid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        newGrid[y][x] = {
          type: "empty",
          revealed: 0,
          color: ARTIFACT_COLORS.empty.primary,
          secondaryColor: ARTIFACT_COLORS.empty.secondary,
        };
      }
    }

    // Place buildings (clusters)
    const numBuildings = 3 + Math.floor(Math.random() * 3);
    for (let b = 0; b < numBuildings; b++) {
      const bx = 3 + Math.floor(Math.random() * (GRID_SIZE - 10));
      const by = 3 + Math.floor(Math.random() * (GRID_SIZE - 10));
      const bw = 3 + Math.floor(Math.random() * 4);
      const bh = 3 + Math.floor(Math.random() * 4);
      
      for (let y = by; y < by + bh && y < GRID_SIZE; y++) {
        for (let x = bx; x < bx + bw && x < GRID_SIZE; x++) {
          newGrid[y][x] = {
            type: "building",
            revealed: 0,
            color: ARTIFACT_COLORS.building.primary,
            secondaryColor: ARTIFACT_COLORS.building.secondary,
          };
        }
      }
    }

    // Place random artifacts
    const artifactTypes: ("artifact" | "skeleton" | "treasure" | "pottery")[] = [
      "artifact", "skeleton", "treasure", "pottery"
    ];
    
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[y][x].type === "empty") {
        const type = artifactTypes[Math.floor(Math.random() * artifactTypes.length)];
        newGrid[y][x] = {
          type,
          revealed: 0,
          color: ARTIFACT_COLORS[type].primary,
          secondaryColor: ARTIFACT_COLORS[type].secondary,
        };
      }
    }

    setGrid(newGrid);
    setDiscoveries([]);
    setStats({
      buildings: 0,
      artifacts: 0,
      skeletons: 0,
      treasures: 0,
      pottery: 0,
      totalRevealed: 0,
    });
  }, []);

  useEffect(() => {
    generateWorld();
  }, [generateWorld]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileSize = canvas.width / GRID_SIZE;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = grid[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        if (tile.revealed >= 100) {
          // Fully revealed - show the artifact
          ctx.fillStyle = tile.color;
          ctx.fillRect(px, py, tileSize, tileSize);
          
          // Add detail pattern
          if (tile.secondaryColor && tile.type !== "empty") {
            ctx.fillStyle = tile.secondaryColor;
            ctx.fillRect(px + 1, py + 1, tileSize / 3, tileSize / 3);
          }
        } else if (tile.revealed > 0) {
          // Partially revealed - blend sand and artifact
          const sandColor = SAND_COLORS[Math.floor((x + y) % SAND_COLORS.length)];
          
          // Draw sand base
          ctx.fillStyle = sandColor;
          ctx.fillRect(px, py, tileSize, tileSize);
          
          // Draw artifact with transparency based on reveal
          ctx.globalAlpha = tile.revealed / 100;
          ctx.fillStyle = tile.color;
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.globalAlpha = 1;
        } else {
          // Fully covered - show sand
          const sandColor = SAND_COLORS[Math.floor((x + y) % SAND_COLORS.length)];
          ctx.fillStyle = sandColor;
          ctx.fillRect(px, py, tileSize, tileSize);
          
          // Add sand texture
          ctx.fillStyle = "rgba(0,0,0,0.05)";
          if ((x + y) % 3 === 0) {
            ctx.fillRect(px + 2, py + 2, 2, 2);
          }
        }
      }
    }
  }, [grid]);

  const brush = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * GRID_SIZE);
    const y = Math.floor(((clientY - rect.top) / rect.height) * GRID_SIZE);

    if (lastBrushPos.current?.x === x && lastBrushPos.current?.y === y) return;
    lastBrushPos.current = { x, y };

    const newGrid = [...grid.map(row => [...row])];
    const newDiscoveries: string[] = [];
    let newStats = { ...stats };

    for (let dy = -BRUSH_SIZE; dy <= BRUSH_SIZE; dy++) {
      for (let dx = -BRUSH_SIZE; dx <= BRUSH_SIZE; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        
        if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= BRUSH_SIZE) {
            const tile = newGrid[ty][tx];
            const wasHidden = tile.revealed < 50;
            
            tile.revealed = Math.min(100, tile.revealed + REVEAL_AMOUNT * (1 - distance / BRUSH_SIZE));
            
            // Check for new discovery
            if (wasHidden && tile.revealed >= 50 && tile.type !== "empty") {
              const messages: Record<string, string[]> = {
                building: ["🏛️ Ancient ruins found!", "🧱 A forgotten structure emerges!", "🏚️ Walls of an old dwelling!"],
                artifact: ["💎 A precious artifact!", "⭐ Something valuable!", "🔮 A mysterious relic!"],
                skeleton: ["💀 Bones of the past!", "🦴 Ancient remains discovered!", "☠️ A skeleton appears!"],
                treasure: ["💰 Treasure!", "👑 Riches from ages past!", "✨ Gleaming gold!"],
                pottery: ["🏺 Ancient pottery!", "🫖 A clay vessel!", "🍶 Ceramic fragments!"],
              };
              
              const typeMessages = messages[tile.type];
              if (typeMessages) {
                newDiscoveries.push(typeMessages[Math.floor(Math.random() * typeMessages.length)]);
              }

              if (tile.type === "building") newStats.buildings++;
              else if (tile.type === "artifact") newStats.artifacts++;
              else if (tile.type === "skeleton") newStats.skeletons++;
              else if (tile.type === "treasure") newStats.treasures++;
              else if (tile.type === "pottery") newStats.pottery++;
            }
          }
        }
      }
    }

    // Calculate total revealed
    let totalRevealed = 0;
    for (let ty = 0; ty < GRID_SIZE; ty++) {
      for (let tx = 0; tx < GRID_SIZE; tx++) {
        totalRevealed += newGrid[ty][tx].revealed;
      }
    }
    newStats.totalRevealed = Math.round((totalRevealed / (GRID_SIZE * GRID_SIZE * 100)) * 100);

    setGrid(newGrid);
    setStats(newStats);
    
    if (newDiscoveries.length > 0) {
      setDiscoveries(prev => [...newDiscoveries, ...prev].slice(0, 8));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setBrushing(true);
    brush(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushing) {
      brush(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setBrushing(false);
    lastBrushPos.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setBrushing(true);
    const touch = e.touches[0];
    brush(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (brushing && e.touches[0]) {
      brush(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setBrushing(false);
    lastBrushPos.current = null;
  };

  return (
    <FeatureWrapper day={372} title="Pixel Archaeology" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4 max-w-4xl mx-auto">
        {showIntro && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowIntro(false)}
          >
            <div className="bg-[var(--color-bg-secondary)] p-8 rounded-xl max-w-md text-center border border-[var(--color-border)]">
              <h2 
                className="text-3xl mb-4"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                🏺 Welcome, Archaeologist
              </h2>
              <p className="text-[var(--color-text-dim)] mb-4">
                Beneath these digital sands lies an ancient pixel civilization. 
                Use your brush to carefully uncover buildings, artifacts, and 
                the secrets of a forgotten world.
              </p>
              <p className="text-[var(--color-text-dim)] mb-6">
                Click and drag to brush away the sand. What treasures await?
              </p>
              <button 
                className="btn-primary px-6 py-3"
                onClick={() => setShowIntro(false)}
              >
                Begin Excavation 🖌️
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <h2 
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Excavation Site Alpha
          </h2>
          <p className="text-[var(--color-text-dim)]">
            Brush away the sands of time to reveal what lies beneath
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-start">
          <div className="flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className="border-4 border-[var(--color-border)] rounded-lg cursor-crosshair shadow-xl"
              style={{ 
                touchAction: "none",
                imageRendering: "pixelated"
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            
            <div className="flex gap-4">
              <button 
                className="btn-secondary px-4 py-2 flex items-center gap-2"
                onClick={generateWorld}
              >
                🗺️ New Site
              </button>
              <div className="px-4 py-2 bg-[var(--color-bg-secondary)] rounded-lg">
                <span className="text-[var(--color-text-dim)]">Progress: </span>
                <span className="font-bold">{stats.totalRevealed}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-64">
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border)]">
              <h3 
                className="text-lg mb-3 flex items-center gap-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                📊 Discoveries
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Buildings:</span>
                  <span className="font-bold">{stats.buildings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💎</span>
                  <span>Artifacts:</span>
                  <span className="font-bold">{stats.artifacts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💀</span>
                  <span>Skeletons:</span>
                  <span className="font-bold">{stats.skeletons}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span>Treasures:</span>
                  <span className="font-bold">{stats.treasures}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏺</span>
                  <span>Pottery:</span>
                  <span className="font-bold">{stats.pottery}</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border)] max-h-64 overflow-y-auto">
              <h3 
                className="text-lg mb-3 flex items-center gap-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                📜 Field Notes
              </h3>
              {discoveries.length === 0 ? (
                <p className="text-[var(--color-text-dim)] text-sm italic">
                  Start brushing to discover artifacts...
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {discoveries.map((discovery, i) => (
                    <li 
                      key={i} 
                      className="animate-pulse"
                      style={{ 
                        opacity: 1 - (i * 0.1),
                        animationDuration: "0.5s",
                        animationIterationCount: 1
                      }}
                    >
                      {discovery}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border)]">
              <h3 
                className="text-lg mb-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                🎨 Legend
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ARTIFACT_COLORS.building.primary }}
                  />
                  <span>Ancient Building</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ARTIFACT_COLORS.artifact.primary }}
                  />
                  <span>Artifact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ARTIFACT_COLORS.skeleton.primary }}
                  />
                  <span>Skeleton</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ARTIFACT_COLORS.treasure.primary }}
                  />
                  <span>Treasure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ARTIFACT_COLORS.pottery.primary }}
                  />
                  <span>Pottery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ARTIFACT_COLORS.empty.primary }}
                  />
                  <span>Empty Ground</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureWrapper>
  );
}