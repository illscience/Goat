"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface PixelArtifact {
  id: string;
  name: string;
  era: string;
  art: string[];
  depth: number;
  x: number;
  y: number;
  discovered: boolean;
  color: string;
}

interface Layer {
  name: string;
  era: string;
  depth: number;
  color: string;
  bgPattern: string;
}

const LAYERS: Layer[] = [
  { name: "Surface Web (2020s)", era: "modern", depth: 0, color: "#1a1a2e", bgPattern: "░" },
  { name: "Social Media Era (2010s)", era: "social", depth: 60, color: "#16213e", bgPattern: "▒" },
  { name: "Web 2.0 (2000s)", era: "web2", depth: 120, color: "#0f3460", bgPattern: "▓" },
  { name: "Dot-com Boom (Late 90s)", era: "dotcom", depth: 180, color: "#533483", bgPattern: "█" },
  { name: "Early Web (Mid 90s)", era: "early", depth: 240, color: "#7b2cbf", bgPattern: "▄" },
  { name: "BBS Era (80s-90s)", era: "bbs", depth: 300, color: "#9d4edd", bgPattern: "▀" },
  { name: "ASCII Depths", era: "ascii", depth: 360, color: "#c77dff", bgPattern: "░" },
];

const ARTIFACTS: Omit<PixelArtifact, "id" | "x" | "y" | "discovered">[] = [
  // Modern Era
  { name: "NFT Receipt", era: "modern", depth: 30, color: "#00ff88", art: ["┌─NFT─┐", "│ 🖼️  │", "│$999k│", "└─────┘"] },
  { name: "Dark Mode Toggle", era: "modern", depth: 45, color: "#6366f1", art: ["  ◐  ", " ╭─╮ ", " │●│ ", " ╰─╯ "] },
  
  // Social Media Era
  { name: "Like Button", era: "social", depth: 80, color: "#3b82f6", art: [" ♡♡ ", "♡♡♡♡", " ♡♡ ", "  ♡ "] },
  { name: "Hashtag", era: "social", depth: 100, color: "#1da1f2", art: [" ║║ ", "═╬╬═", "═╬╬═", " ║║ "] },
  { name: "Selfie Stick", era: "social", depth: 110, color: "#ec4899", art: ["  ◯  ", "  │  ", "  │  ", " ╱│╲ "] },
  
  // Web 2.0 Era
  { name: "RSS Feed Icon", era: "web2", depth: 130, color: "#f97316", art: ["╭───╮", "│((●│", "│(● │", "╰●──╯"] },
  { name: "Flash Player", era: "web2", depth: 150, color: "#ef4444", art: ["┌───┐", "│ ▶ │", "│ f │", "└───┘"] },
  { name: "Web 2.0 Badge", era: "web2", depth: 165, color: "#84cc16", art: ["╭BETA╮", "│★★★★│", "│2.0!│", "╰────╯"] },
  
  // Dot-com Boom
  { name: "Hit Counter", era: "dotcom", depth: 190, color: "#22c55e", art: ["┌─────┐", "│00042│", "│HITS!│", "└─────┘"] },
  { name: "Under Construction", era: "dotcom", depth: 210, color: "#fbbf24", art: ["⚠ ◼◼◼", "UNDER ", "CONSTR", "◼◼◼ ⚠"] },
  { name: "Guestbook", era: "dotcom", depth: 225, color: "#a855f7", art: ["╔═══╗", "║SIGN║", "║HERE║", "╚═══╝"] },
  
  // Early Web
  { name: "Geocities Logo", era: "early", depth: 250, color: "#06b6d4", art: ["~*~*~", "*GEO*", "*CTY*", "~*~*~"] },
  { name: "Dancing Baby", era: "early", depth: 270, color: "#f472b6", art: [" ◯ ", "╱│╲", " │ ", "╱ ╲"] },
  { name: "Netscape N", era: "early", depth: 285, color: "#10b981", art: ["╔N══╗", "║  N║", "║N  ║", "╚══N╝"] },
  
  // BBS Era
  { name: "ANSI Dragon", era: "bbs", depth: 310, color: "#f43f5e", art: ["  /\\  ", " /◯◯\\ ", "/^^^^\\", "\"\"\"\"\"\""] },
  { name: "Door Game", era: "bbs", depth: 330, color: "#8b5cf6", art: ["╔DOOR╗", "║████║", "║ ◯  ║", "╚════╝"] },
  { name: "Sysop Badge", era: "bbs", depth: 345, color: "#14b8a6", art: ["[====]", "|SYS |", "|OP  |", "[====]"] },
  
  // ASCII Depths
  { name: "Ancient Smiley", era: "ascii", depth: 370, color: "#facc15", art: ["    ", " :) ", "    ", "    "] },
  { name: "Primordial @", era: "ascii", depth: 390, color: "#22d3ee", art: ["    ", " @  ", "    ", "    "] },
  { name: "The First Cursor", era: "ascii", depth: 410, color: "#4ade80", art: ["    ", " _  ", "    ", "    "] },
];

const GRID_SIZE = 8;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

export default function PixelArchaeology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [excavationMap, setExcavationMap] = useState<number[][]>([]);
  const [artifacts, setArtifacts] = useState<PixelArtifact[]>([]);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<PixelArtifact[]>([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [isDigging, setIsDigging] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<PixelArtifact | null>(null);
  const [digCount, setDigCount] = useState(0);
  const frameRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);
  const rows = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

  const initializeGame = useCallback(() => {
    // Initialize excavation map with zeros
    const newMap: number[][] = [];
    for (let y = 0; y < rows; y++) {
      newMap[y] = [];
      for (let x = 0; x < cols; x++) {
        newMap[y][x] = 0;
      }
    }
    setExcavationMap(newMap);

    // Place artifacts randomly
    const placedArtifacts: PixelArtifact[] = ARTIFACTS.map((artifact, index) => {
      const depthRow = Math.floor((artifact.depth / 420) * rows);
      const minY = Math.max(5, depthRow - 3);
      const maxY = Math.min(rows - 8, depthRow + 3);
      
      return {
        ...artifact,
        id: `artifact-${index}`,
        x: Math.floor(Math.random() * (cols - 8)) + 2,
        y: Math.floor(Math.random() * (maxY - minY)) + minY,
        discovered: false,
      };
    });
    setArtifacts(placedArtifacts);
    setDiscoveredArtifacts([]);
    setCurrentDepth(0);
    setDigCount(0);
    setSelectedArtifact(null);
  }, [cols, rows]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const getCurrentLayer = (depth: number): Layer => {
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      if (depth >= LAYERS[i].depth) {
        return LAYERS[i];
      }
    }
    return LAYERS[0];
  };

  const dig = useCallback((canvasX: number, canvasY: number) => {
    const gridX = Math.floor(canvasX / GRID_SIZE);
    const gridY = Math.floor(canvasY / GRID_SIZE);
    
    if (gridX < 0 || gridX >= cols || gridY < 0 || gridY >= rows) return;
    
    const brushSize = 3;
    let maxDepth = currentDepth;
    let dug = false;

    setExcavationMap(prev => {
      const newMap = prev.map(row => [...row]);
      
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= brushSize) {
              const digAmount = Math.max(1, Math.floor((brushSize - distance) * 2));
              newMap[ny][nx] = Math.min(420, newMap[ny][nx] + digAmount);
              maxDepth = Math.max(maxDepth, newMap[ny][nx]);
              dug = true;
            }
          }
        }
      }
      
      return newMap;
    });

    if (dug) {
      setDigCount(prev => prev + 1);
      setCurrentDepth(maxDepth);

      // Check for artifact discovery
      setArtifacts(prev => {
        const newArtifacts = [...prev];
        newArtifacts.forEach(artifact => {
          if (!artifact.discovered) {
            const artifactCenterX = artifact.x + 2;
            const artifactCenterY = artifact.y + 2;
            const distance = Math.sqrt(
              Math.pow(gridX - artifactCenterX, 2) + 
              Math.pow(gridY - artifactCenterY, 2)
            );
            
            if (distance < 4 && maxDepth >= artifact.depth - 20) {
              artifact.discovered = true;
              setDiscoveredArtifacts(d => [...d, artifact]);
              setSelectedArtifact(artifact);
            }
          }
        });
        return newArtifacts;
      });
    }
  }, [cols, rows, currentDepth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastPosRef.current = { x, y };
      dig(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDigging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (lastPosRef.current) {
        const dx = x - lastPosRef.current.x;
        const dy = y - lastPosRef.current.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy)) / 4;
        
        for (let i = 0; i <= steps; i++) {
          const interpX = lastPosRef.current.x + (dx * i / steps);
          const interpY = lastPosRef.current.y + (dy * i / steps);
          dig(interpX, interpY);
        }
      }
      
      lastPosRef.current = { x, y };
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
    lastPosRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDigging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      lastPosRef.current = { x, y };
      dig(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDigging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      dig(x, y);
      lastPosRef.current = { x, y };
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || excavationMap.length === 0) return;

    const render = () => {
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw layers and excavation
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const depth = excavationMap[y]?.[x] || 0;
          const baseDepth = (y / rows) * 420;
          const visibleDepth = Math.min(depth, baseDepth + 50);
          const layer = getCurrentLayer(visibleDepth);
          
          if (depth > 0) {
            // Excavated area - show what's beneath
            const alpha = Math.min(1, depth / 50);
            ctx.fillStyle = layer.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.globalAlpha = 1;
            
            // Add some texture
            if (Math.random() > 0.95) {
              ctx.fillStyle = "rgba(255,255,255,0.1)";
              ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, 2, 2);
            }
          } else {
            // Surface dirt
            const surfaceLayer = getCurrentLayer(baseDepth);
            ctx.fillStyle = surfaceLayer.color;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.globalAlpha = 1;
            
            // Surface pattern
            if ((x + y) % 3 === 0) {
              ctx.fillStyle = "rgba(0,0,0,0.3)";
              ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
          }
        }
      }

      // Draw artifacts
      artifacts.forEach(artifact => {
        const artifactDepth = excavationMap[artifact.y]?.[artifact.x] || 0;
        const baseDepth = (artifact.y / rows) * 420;
        
        if (artifactDepth > artifact.depth - baseDepth - 20 || artifact.discovered) {
          ctx.font = "8px monospace";
          ctx.fillStyle = artifact.color;
          
          artifact.art.forEach((line, lineIdx) => {
            const chars = line.split("");
            chars.forEach((char, charIdx) => {
              if (char !== " ") {
                ctx.fillText(
                  char,
                  (artifact.x + charIdx) * GRID_SIZE,
                  (artifact.y + lineIdx) * GRID_SIZE + GRID_SIZE
                );
              }
            });
          });
          
          if (artifact.discovered) {
            ctx.strokeStyle = artifact.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(
              artifact.x * GRID_SIZE - 2,
              artifact.y * GRID_SIZE - 2,
              GRID_SIZE * 6 + 4,
              GRID_SIZE * 4 + 4
            );
          }
        }
      });

      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [excavationMap, artifacts, rows]);

  const currentLayer = getCurrentLayer(currentDepth);

  return (
    <FeatureWrapper day={370} title="Pixel Archaeology" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <p className="text-[var(--color-text-dim)] mb-2">
            Excavate through layers of digital history! Drag to dig and uncover 
            pixel art artifacts from the internet&apos;s past.
          </p>
          <p className="text-sm text-[var(--color-accent)]">
            The deeper you go, the older the treasures...
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main excavation area */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="rounded-lg overflow-hidden border-2 border-[var(--color-border)] shadow-lg"
              style={{ background: currentLayer.color }}
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

            {/* Depth indicator */}
            <div className="w-full max-w-[400px] bg-[var(--color-bg-secondary)] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold" style={{ color: currentLayer.color }}>
                  📍 {currentLayer.name}
                </span>
                <span className="text-xs text-[var(--color-text-dim)]">
                  Depth: {currentDepth}px
                </span>
              </div>
              <div className="h-4 bg-[var(--color-bg)] rounded-full overflow-hidden flex">
                {LAYERS.map((layer, idx) => (
                  <div
                    key={layer.era}
                    className="h-full transition-all duration-300"
                    style={{
                      flex: 1,
                      backgroundColor: layer.color,
                      opacity: currentDepth >= layer.depth ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="btn-secondary text-sm"
            >
              🔄 New Dig Site
            </button>
          </div>

          {/* Discoveries panel */}
          <div className="w-full lg:w-64 bg-[var(--color-bg-secondary)] rounded-lg p-4">
            <h3 
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              🏛️ Museum ({discoveredArtifacts.length}/{artifacts.length})
            </h3>
            
            {selectedArtifact && (
              <div 
                className="mb-4 p-3 rounded-lg border-2 text-center"
                style={{ 
                  borderColor: selectedArtifact.color,
                  background: `${selectedArtifact.color}20`
                }}
              >
                <div className="text-xs text-[var(--color-text-dim)] mb-1">
                  ✨ Just discovered!
                </div>
                <div className="font-bold" style={{ color: selectedArtifact.color }}>
                  {selectedArtifact.name}
                </div>
                <pre 
                  className="text-xs mt-2 font-mono"
                  style={{ color: selectedArtifact.color }}
                >
                  {selectedArtifact.art.join("\n")}
                </pre>
                <div className="text-xs mt-2 text-[var(--color-text-dim)]">
                  Era: {getCurrentLayer(selectedArtifact.depth).name}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {discoveredArtifacts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-dim)] text-center italic">
                  Start digging to find artifacts!
                </p>
              ) : (
                discoveredArtifacts.map(artifact => (
                  <div
                    key={artifact.id}
                    className="p-2 rounded bg-[var(--color-bg)] flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedArtifact(artifact)}
                  >
                    <pre 
                      className="text-[6px] leading-none font-mono"
                      style={{ color: artifact.color }}
                    >
                      {artifact.art.slice(0, 2).join("\n")}
                    </pre>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: artifact.color }}>
                        {artifact.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-dim)]">
                        {getCurrentLayer(artifact.depth).era}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-dim)] text-center">
                ⛏️ Digs: {digCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Layer legend */}
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {LAYERS.map(layer => (
            <div 
              key={layer.era}
              className="flex items-center gap-1 px-2 py-1 rounded"
              style={{ 
                backgroundColor: `${layer.color}40`,
                opacity: currentDepth >= layer.depth ? 1 : 0.5
              }}
            >
              <span 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-[var(--color-text-dim)]">
                {layer.era}
              </span>
            </div>
          ))}
        </div>
      </div>
    </FeatureWrapper>
  );
}