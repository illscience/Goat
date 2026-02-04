"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  discovered: boolean;
  pixels: number[][];
  color: string;
}

interface DiscoveredArtifact {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  digSite: number;
}

const ARTIFACT_TEMPLATES = [
  { name: "Ancient Pottery", emoji: "🏺", rarity: "common" as const, pixels: [[1,1,1],[1,0,1],[1,1,1],[0,1,0]], color: "#8B4513" },
  { name: "Fossil Fragment", emoji: "🦴", rarity: "common" as const, pixels: [[1,1,0],[0,1,1],[1,1,0]], color: "#F5F5DC" },
  { name: "Old Coin", emoji: "🪙", rarity: "common" as const, pixels: [[0,1,0],[1,1,1],[0,1,0]], color: "#FFD700" },
  { name: "Stone Tool", emoji: "🪨", rarity: "common" as const, pixels: [[1,0,0],[1,1,0],[1,1,1]], color: "#696969" },
  { name: "Mystery Symbol", emoji: "🔮", rarity: "uncommon" as const, pixels: [[1,0,1],[0,1,0],[1,0,1]], color: "#9400D3" },
  { name: "Bronze Artifact", emoji: "⚱️", rarity: "uncommon" as const, pixels: [[0,1,0],[1,1,1],[1,0,1],[0,1,0]], color: "#CD7F32" },
  { name: "Jade Pendant", emoji: "💎", rarity: "uncommon" as const, pixels: [[0,1,0],[1,1,1],[0,1,0]], color: "#00A86B" },
  { name: "Ancient Tablet", emoji: "📜", rarity: "rare" as const, pixels: [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]], color: "#DEB887" },
  { name: "Golden Idol", emoji: "🗿", rarity: "rare" as const, pixels: [[0,1,1,0],[1,1,1,1],[0,1,1,0],[0,1,1,0]], color: "#FFD700" },
  { name: "Crystal Skull", emoji: "💀", rarity: "legendary" as const, pixels: [[0,1,1,0],[1,1,1,1],[1,0,0,1],[0,1,1,0]], color: "#E0FFFF" },
  { name: "Dragon Scale", emoji: "🐉", rarity: "legendary" as const, pixels: [[1,0,0,1],[1,1,1,1],[0,1,1,0],[0,0,1,0]], color: "#228B22" },
];

const SOIL_LAYERS = [
  { depth: 0, color: "#8B7355", name: "Topsoil" },
  { depth: 15, color: "#6B4423", name: "Clay" },
  { depth: 30, color: "#4A3728", name: "Sediment" },
  { depth: 50, color: "#3D2914", name: "Ancient Earth" },
  { depth: 70, color: "#2C1810", name: "Bedrock" },
];

const PIXEL_SIZE = 8;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 320;
const GRID_WIDTH = CANVAS_WIDTH / PIXEL_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / PIXEL_SIZE;

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [excavatedGrid, setExcavatedGrid] = useState<boolean[][]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [discoveries, setDiscoveries] = useState<DiscoveredArtifact[]>([]);
  const [digSiteNumber, setDigSiteNumber] = useState(1);
  const [isDigging, setIsDigging] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const [lastDiscovery, setLastDiscovery] = useState<string | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const animationRef = useRef<number>(0);

  const generateDigSite = useCallback(() => {
    const newGrid: boolean[][] = Array(GRID_HEIGHT).fill(null).map(() => 
      Array(GRID_WIDTH).fill(false)
    );
    
    const newArtifacts: Artifact[] = [];
    const numArtifacts = 4 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numArtifacts; i++) {
      const template = ARTIFACT_TEMPLATES[Math.floor(Math.random() * ARTIFACT_TEMPLATES.length)];
      const artifactHeight = template.pixels.length;
      const artifactWidth = template.pixels[0]?.length || 0;
      
      let depth: number;
      if (template.rarity === "common") {
        depth = 5 + Math.floor(Math.random() * 15);
      } else if (template.rarity === "uncommon") {
        depth = 15 + Math.floor(Math.random() * 15);
      } else if (template.rarity === "rare") {
        depth = 25 + Math.floor(Math.random() * 10);
      } else {
        depth = 30 + Math.floor(Math.random() * 8);
      }
      
      const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - artifactWidth - 4));
      const y = depth;
      
      newArtifacts.push({
        id: `${Date.now()}-${i}`,
        name: template.name,
        emoji: template.emoji,
        rarity: template.rarity,
        depth: y,
        x,
        y,
        width: artifactWidth,
        height: artifactHeight,
        discovered: false,
        pixels: template.pixels,
        color: template.color,
      });
    }
    
    setExcavatedGrid(newGrid);
    setArtifacts(newArtifacts);
    setLastDiscovery(null);
  }, []);

  useEffect(() => {
    generateDigSite();
  }, [generateDigSite]);

  const getSoilColor = (depth: number): string => {
    for (let i = SOIL_LAYERS.length - 1; i >= 0; i--) {
      const layer = SOIL_LAYERS[i];
      if (layer && depth >= layer.depth) {
        return layer.color;
      }
    }
    return SOIL_LAYERS[0]?.color || "#8B7355";
  };

  const checkArtifactDiscovery = useCallback((grid: boolean[][]) => {
    setArtifacts(prev => {
      const updated = prev.map(artifact => {
        if (artifact.discovered) return artifact;
        
        let pixelsRevealed = 0;
        let totalPixels = 0;
        
        for (let py = 0; py < artifact.pixels.length; py++) {
          const row = artifact.pixels[py];
          if (!row) continue;
          for (let px = 0; px < row.length; px++) {
            if (row[px] === 1) {
              totalPixels++;
              const gridY = artifact.y + py;
              const gridX = artifact.x + px;
              if (gridY < GRID_HEIGHT && gridX < GRID_WIDTH && grid[gridY]?.[gridX]) {
                pixelsRevealed++;
              }
            }
          }
        }
        
        if (pixelsRevealed >= totalPixels * 0.6) {
          setLastDiscovery(`${artifact.emoji} ${artifact.name} discovered!`);
          setDiscoveries(d => [...d, {
            id: artifact.id,
            name: artifact.name,
            emoji: artifact.emoji,
            rarity: artifact.rarity,
            digSite: digSiteNumber,
          }]);
          return { ...artifact, discovered: true };
        }
        
        return artifact;
      });
      return updated;
    });
  }, [digSiteNumber]);

  const excavate = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((clientY - rect.top) / PIXEL_SIZE);
    
    setExcavatedGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
            if (Math.abs(dx) + Math.abs(dy) < brushSize + 1) {
              if (newGrid[ny]) {
                newGrid[ny][nx] = true;
              }
            }
          }
        }
      }
      
      checkArtifactDiscovery(newGrid);
      return newGrid;
    });
  }, [brushSize, checkArtifactDiscovery]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    excavate(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      excavate(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    const touch = e.touches[0];
    if (touch) {
      excavate(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      const touch = e.touches[0];
      if (touch) {
        excavate(touch.clientX, touch.clientY);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (!excavatedGrid[y]?.[x]) {
            ctx.fillStyle = getSoilColor(y);
            ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }
      
      for (const artifact of artifacts) {
        for (let py = 0; py < artifact.pixels.length; py++) {
          const row = artifact.pixels[py];
          if (!row) continue;
          for (let px = 0; px < row.length; px++) {
            if (row[px] === 1) {
              const gridX = artifact.x + px;
              const gridY = artifact.y + py;
              
              if (excavatedGrid[gridY]?.[gridX]) {
                ctx.fillStyle = artifact.color;
                ctx.fillRect(gridX * PIXEL_SIZE, gridY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
                
                ctx.fillStyle = "rgba(255,255,255,0.2)";
                ctx.fillRect(gridX * PIXEL_SIZE, gridY * PIXEL_SIZE, PIXEL_SIZE / 2, PIXEL_SIZE / 2);
              }
            }
          }
        }
        
        if (artifact.discovered) {
          ctx.strokeStyle = artifact.rarity === "legendary" ? "#FFD700" : 
                           artifact.rarity === "rare" ? "#9400D3" : 
                           artifact.rarity === "uncommon" ? "#4169E1" : "#228B22";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            artifact.x * PIXEL_SIZE - 2,
            artifact.y * PIXEL_SIZE - 2,
            artifact.width * PIXEL_SIZE + 4,
            artifact.height * PIXEL_SIZE + 4
          );
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
  }, [excavatedGrid, artifacts]);

  const newDigSite = () => {
    setDigSiteNumber(prev => prev + 1);
    generateDigSite();
  };

  const rarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "text-yellow-400";
      case "rare": return "text-purple-400";
      case "uncommon": return "text-blue-400";
      default: return "text-green-400";
    }
  };

  const discoveredCount = artifacts.filter(a => a.discovered).length;
  const totalArtifacts = artifacts.length;

  return (
    <FeatureWrapper day={431} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Dig Site #{digSiteNumber}
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Click and drag to excavate through ancient soil layers 🏺
          </p>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <div 
            className="px-3 py-1 rounded-full text-sm"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            Artifacts: {discoveredCount}/{totalArtifacts}
          </div>
          <div 
            className="px-3 py-1 rounded-full text-sm"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            Total Finds: {discoveries.length}
          </div>
        </div>

        {lastDiscovery && (
          <div 
            className="px-4 py-2 rounded-lg animate-pulse text-center font-bold"
            style={{ backgroundColor: "#FFD70033", color: "#FFD700" }}
          >
            {lastDiscovery}
          </div>
        )}

        <div 
          className="rounded-lg overflow-hidden shadow-xl"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        </div>

        <div className="flex items-center gap-4">
          <span style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Brush Size:
          </span>
          {[1, 2, 3].map(size => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`w-8 h-8 rounded-full transition-all ${
                brushSize === size ? "ring-2 ring-offset-2" : ""
              }`}
              style={{ 
                backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                color: "var(--color-text)",
              }}
            >
              {size === 1 ? "S" : size === 2 ? "M" : "L"}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={newDigSite} className="btn-primary px-4 py-2 rounded-lg">
            🗺️ New Dig Site
          </button>
          <button 
            onClick={() => setShowJournal(!showJournal)} 
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            📖 {showJournal ? "Hide" : "Show"} Journal
          </button>
        </div>

        <div className="flex gap-2 flex-wrap justify-center text-xs">
          {SOIL_LAYERS.map(layer => (
            <div key={layer.name} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: layer.color }}
              />
              <span style={{ color: "var(--color-text-dim)" }}>{layer.name}</span>
            </div>
          ))}
        </div>

        {showJournal && (
          <div 
            className="w-full rounded-lg p-4"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3 
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📖 Discovery Journal
            </h3>
            {discoveries.length === 0 ? (
              <p className="text-center" style={{ color: "var(--color-text-dim)" }}>
                No discoveries yet... start digging!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {discoveries.map((d, i) => (
                  <div 
                    key={`${d.id}-${i}`}
                    className="p-2 rounded text-center"
                    style={{ backgroundColor: "var(--color-bg)" }}
                  >
                    <div className="text-2xl">{d.emoji}</div>
                    <div className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
                      {d.name}
                    </div>
                    <div className={`text-xs ${rarityColor(d.rarity)}`}>
                      {d.rarity}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                      Site #{d.digSite}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-center" style={{ color: "var(--color-text-dim)" }}>
          <p>🟢 Common • 🔵 Uncommon • 🟣 Rare • 🟡 Legendary</p>
          <p className="mt-1">Deeper treasures are rarer! Keep digging! ⛏️</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}