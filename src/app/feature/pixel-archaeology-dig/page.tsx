"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "fossil" | "treasure" | "pottery" | "coin" | "bone" | "gem";
  emoji: string;
  name: string;
  value: number;
  revealed: number;
  damaged: boolean;
}

interface DirtCell {
  depth: number;
  maxDepth: number;
}

const GRID_SIZE = 40;
const CELL_SIZE = 12;

const ARTIFACT_TYPES = [
  { type: "fossil", emoji: "🦴", name: "Ancient Fossil", value: 150, minSize: 2, maxSize: 4 },
  { type: "treasure", emoji: "💎", name: "Lost Treasure", value: 500, minSize: 1, maxSize: 2 },
  { type: "pottery", emoji: "🏺", name: "Ancient Pottery", value: 100, minSize: 2, maxSize: 3 },
  { type: "coin", emoji: "🪙", name: "Golden Coin", value: 75, minSize: 1, maxSize: 1 },
  { type: "bone", emoji: "🦷", name: "Dinosaur Tooth", value: 200, minSize: 1, maxSize: 2 },
  { type: "gem", emoji: "💠", name: "Rare Gem", value: 350, minSize: 1, maxSize: 2 },
] as const;

function generateDigSite(): { dirt: DirtCell[][]; artifacts: Artifact[] } {
  const dirt: DirtCell[][] = [];
  const artifacts: Artifact[] = [];
  
  // Initialize dirt grid with varying depths
  for (let y = 0; y < GRID_SIZE; y++) {
    dirt[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const baseDepth = 3 + Math.floor(Math.random() * 3);
      dirt[y][x] = { depth: baseDepth, maxDepth: baseDepth };
    }
  }
  
  // Generate random artifacts
  const numArtifacts = 6 + Math.floor(Math.random() * 5);
  let idCounter = 0;
  
  for (let i = 0; i < numArtifacts; i++) {
    const typeData = ARTIFACT_TYPES[Math.floor(Math.random() * ARTIFACT_TYPES.length)];
    const width = typeData.minSize + Math.floor(Math.random() * (typeData.maxSize - typeData.minSize + 1));
    const height = typeData.minSize + Math.floor(Math.random() * (typeData.maxSize - typeData.minSize + 1));
    const x = Math.floor(Math.random() * (GRID_SIZE - width));
    const y = Math.floor(Math.random() * (GRID_SIZE - height));
    
    // Check for overlap with existing artifacts
    const overlaps = artifacts.some(a => 
      x < a.x + a.width + 1 && x + width + 1 > a.x &&
      y < a.y + a.height + 1 && y + height + 1 > a.y
    );
    
    if (!overlaps) {
      artifacts.push({
        id: idCounter++,
        x,
        y,
        width,
        height,
        type: typeData.type as Artifact["type"],
        emoji: typeData.emoji,
        name: typeData.name,
        value: typeData.value,
        revealed: 0,
        damaged: false,
      });
    }
  }
  
  return { dirt, artifacts };
}

export default function PixelArchaeologyDig() {
  const [dirt, setDirt] = useState<DirtCell[][]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [score, setScore] = useState(0);
  const [brushSize, setBrushSize] = useState(1);
  const [isDigging, setIsDigging] = useState(false);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<Artifact[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [digCount, setDigCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const initGame = useCallback(() => {
    const { dirt: newDirt, artifacts: newArtifacts } = generateDigSite();
    setDirt(newDirt);
    setArtifacts(newArtifacts);
    setScore(0);
    setDiscoveredArtifacts([]);
    setDigCount(0);
    setGameStarted(true);
  }, []);

  const getArtifactAt = useCallback((x: number, y: number): Artifact | undefined => {
    return artifacts.find(a => 
      x >= a.x && x < a.x + a.width &&
      y >= a.y && y < a.y + a.height
    );
  }, [artifacts]);

  const dig = useCallback((centerX: number, centerY: number) => {
    if (!gameStarted) return;
    
    setDirt(prevDirt => {
      const newDirt = prevDirt.map(row => row.map(cell => ({ ...cell })));
      
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < brushSize) {
              const digAmount = brushSize > 2 ? 2 : 1;
              newDirt[y][x].depth = Math.max(0, newDirt[y][x].depth - digAmount);
            }
          }
        }
      }
      
      return newDirt;
    });
    
    setDigCount(prev => prev + 1);
    
    // Check for artifact reveals and damage
    setArtifacts(prevArtifacts => {
      return prevArtifacts.map(artifact => {
        let revealedCells = 0;
        let totalCells = artifact.width * artifact.height;
        let damaged = artifact.damaged;
        
        for (let ay = 0; ay < artifact.height; ay++) {
          for (let ax = 0; ax < artifact.width; ax++) {
            const cellX = artifact.x + ax;
            const cellY = artifact.y + ay;
            
            if (dirt[cellY]?.[cellX]?.depth === 0) {
              revealedCells++;
            }
            
            // Check if aggressive digging damaged the artifact
            if (brushSize >= 3) {
              const distance = Math.sqrt(
                Math.pow(cellX - centerX, 2) + Math.pow(cellY - centerY, 2)
              );
              if (distance < brushSize && !damaged) {
                damaged = true;
              }
            }
          }
        }
        
        const revealed = revealedCells / totalCells;
        
        return { ...artifact, revealed, damaged };
      });
    });
  }, [gameStarted, brushSize, dirt]);

  // Check for newly discovered artifacts
  useEffect(() => {
    artifacts.forEach(artifact => {
      if (artifact.revealed >= 0.75 && !discoveredArtifacts.find(a => a.id === artifact.id)) {
        setDiscoveredArtifacts(prev => [...prev, artifact]);
        const finalValue = artifact.damaged ? Math.floor(artifact.value * 0.3) : artifact.value;
        setScore(prev => prev + finalValue);
      }
    });
  }, [artifacts, discoveredArtifacts]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const render = () => {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      
      // Draw dirt layers
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = dirt[y]?.[x];
          if (!cell) continue;
          
          const depth = cell.depth;
          if (depth === 0) {
            // Reveal the ground beneath
            ctx.fillStyle = "#D2B48C";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          } else {
            const shade = Math.floor(139 - (depth * 15));
            ctx.fillStyle = `rgb(${shade + 60}, ${shade - 30}, ${shade - 80})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
      
      // Draw artifacts
      artifacts.forEach(artifact => {
        if (artifact.revealed > 0) {
          const alpha = Math.min(artifact.revealed * 1.5, 1);
          ctx.globalAlpha = alpha;
          
          const artifactX = (artifact.x + artifact.width / 2) * CELL_SIZE;
          const artifactY = (artifact.y + artifact.height / 2) * CELL_SIZE;
          
          // Draw artifact background
          ctx.fillStyle = artifact.damaged ? "#8B0000" : "#FFD700";
          ctx.beginPath();
          ctx.arc(artifactX, artifactY, Math.min(artifact.width, artifact.height) * CELL_SIZE * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw emoji
          ctx.globalAlpha = alpha;
          ctx.font = `${Math.min(artifact.width, artifact.height) * CELL_SIZE * 0.8}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(artifact.emoji, artifactX, artifactY);
          
          ctx.globalAlpha = 1;
        }
      });
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dirt, artifacts, gameStarted]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    handleDig(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDigging) return;
    handleDig(e);
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const handleDig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      dig(x, y);
    }
  };

  return (
    <FeatureWrapper day={428} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}>
            Unearth Ancient Treasures
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Carefully excavate the dig site to reveal hidden artifacts. 
            <span className="text-amber-500"> Use a smaller brush for delicate work!</span> 
            Large brushes can damage valuable finds. 💀
          </p>
        </div>

        {!gameStarted ? (
          <button
            onClick={initGame}
            className="btn-primary text-lg px-8 py-3 rounded-lg"
          >
            🏛️ Start Excavation
          </button>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <span className="text-xl">💰</span>
                <span className="font-bold text-lg" style={{ color: "var(--color-text)" }}>{score}</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>Brush Size:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(size => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all ${
                        brushSize === size ? "ring-2 ring-amber-500" : ""
                      }`}
                      style={{ 
                        backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg)",
                        color: "var(--color-text)"
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {brushSize >= 3 && (
                  <span className="text-xs text-red-400">⚠️ May damage artifacts!</span>
                )}
              </div>
              
              <button
                onClick={initGame}
                className="btn-secondary px-4 py-2 rounded-lg text-sm"
              >
                🔄 New Site
              </button>
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                className="rounded-lg cursor-crosshair shadow-lg"
                style={{ 
                  width: Math.min(480, GRID_SIZE * CELL_SIZE),
                  height: Math.min(480, GRID_SIZE * CELL_SIZE),
                  border: "4px solid var(--color-border)",
                  imageRendering: "pixelated"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            <div className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
              Digs: {digCount} | Found: {discoveredArtifacts.length}/{artifacts.length} artifacts
            </div>

            {discoveredArtifacts.length > 0 && (
              <div className="w-full max-w-xl">
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}>
                  📜 Discovery Log
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {discoveredArtifacts.map(artifact => (
                    <div
                      key={artifact.id}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ 
                        backgroundColor: artifact.damaged ? "rgba(139, 0, 0, 0.2)" : "var(--color-bg-secondary)",
                        border: `1px solid ${artifact.damaged ? "rgb(139, 0, 0)" : "var(--color-border)"}`
                      }}
                    >
                      <span className="text-2xl">{artifact.emoji}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                          {artifact.name}
                        </div>
                        <div className="text-xs" style={{ color: artifact.damaged ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)" }}>
                          {artifact.damaged ? "💔 Damaged" : "✨ Pristine"}
                          {" · "}
                          {artifact.damaged ? Math.floor(artifact.value * 0.3) : artifact.value}💰
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </FeatureWrapper>
  );
}