"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pixel {
  x: number;
  y: number;
  excavated: boolean;
  layer: number;
  hasTreasure: boolean;
  treasureId?: number;
}

interface Treasure {
  id: number;
  name: string;
  emoji: string;
  backstory: string;
  era: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
}

const GRID_SIZE = 20;
const LAYERS = [
  { name: "Modern Digital Era", color: "#3d3d3d", depth: 0 },
  { name: "Early Internet Age", color: "#5a4a3a", depth: 1 },
  { name: "Floppy Disk Period", color: "#6b5b4b", depth: 2 },
  { name: "Arcade Golden Age", color: "#7c6c5c", depth: 3 },
  { name: "Ancient Digital Civilization", color: "#8d7d6d", depth: 4 },
  { name: "Pixel Stone Age", color: "#9e8e7e", depth: 5 },
];

const TREASURES: Treasure[] = [
  { id: 1, name: "The First Like Button", emoji: "👍", backstory: "Legend says whoever clicked this first gained infinite social validation. Found in the ruins of MySpace.", era: "Early Internet Age", rarity: "common" },
  { id: 2, name: "Dancing Baby GIF Fragment", emoji: "👶", backstory: "A relic from when entertainment was measured in kilobytes. It still dances in the wind.", era: "Early Internet Age", rarity: "uncommon" },
  { id: 3, name: "AOL Installation Disc", emoji: "💿", backstory: "These once covered the Earth like snow. Archaeologists still find them everywhere.", era: "Floppy Disk Period", rarity: "common" },
  { id: 4, name: "Clippy's Remains", emoji: "📎", backstory: "The helpful assistant who asked too many questions. 'It looks like you're excavating!'", era: "Floppy Disk Period", rarity: "rare" },
  { id: 5, name: "Original High Score", emoji: "🏆", backstory: "AAA - the ancient name used by all champions. This one reads 999,999.", era: "Arcade Golden Age", rarity: "uncommon" },
  { id: 6, name: "Quarter of Power", emoji: "🪙", backstory: "The sacred currency of the arcade temples. Insert to continue.", era: "Arcade Golden Age", rarity: "common" },
  { id: 7, name: "The Lost Konami Code", emoji: "🎮", backstory: "↑↑↓↓←→←→BA - The prayer that granted infinite lives to the worthy.", era: "Arcade Golden Age", rarity: "legendary" },
  { id: 8, name: "Pong Paddle Fragment", emoji: "🏓", backstory: "From the first great digital sport. Vertical movement only.", era: "Ancient Digital Civilization", rarity: "rare" },
  { id: 9, name: "Primordial Pixel", emoji: "⬜", backstory: "The first pixel ever rendered. Scientists debate if it was white or off-white.", era: "Ancient Digital Civilization", rarity: "legendary" },
  { id: 10, name: "Cave Bitmap", emoji: "🖼️", backstory: "Ancient pixel artists drew these to record their hunt for bugs.", era: "Pixel Stone Age", rarity: "rare" },
  { id: 11, name: "Fossilized Mouse Click", emoji: "🖱️", backstory: "The preserved sound of 'click' echoes through time. Right-click evolution came later.", era: "Pixel Stone Age", rarity: "uncommon" },
  { id: 12, name: "Neolithic Cursor", emoji: "👆", backstory: "Before the arrow, before the hand, there was... the single pixel dot.", era: "Pixel Stone Age", rarity: "legendary" },
  { id: 13, name: "Dial-up Modem Song", emoji: "📞", backstory: "The ancient hymn of connection. Taking 3 minutes to load was considered fast.", era: "Early Internet Age", rarity: "uncommon" },
  { id: 14, name: "GeoCities Ruins", emoji: "🏛️", backstory: "Once a thriving metropolis of under construction GIFs and hit counters.", era: "Early Internet Age", rarity: "rare" },
  { id: 15, name: "Floppy Save Icon", emoji: "💾", backstory: "Nobody knows what this square meant, but it was sacred to all programs.", era: "Floppy Disk Period", rarity: "common" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#34D399",
  rare: "#60A5FA",
  legendary: "#F59E0B",
};

export default function PixelArchaeologyDig() {
  const [grid, setGrid] = useState<Pixel[][]>([]);
  const [discoveredTreasures, setDiscoveredTreasures] = useState<Treasure[]>([]);
  const [currentTreasure, setCurrentTreasure] = useState<Treasure | null>(null);
  const [brushSize, setBrushSize] = useState(1);
  const [totalExcavated, setTotalExcavated] = useState(0);
  const [isDigging, setIsDigging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMouseDownRef = useRef<boolean>(false);

  const initializeGrid = useCallback(() => {
    const newGrid: Pixel[][] = [];
    const treasurePositions = new Set<string>();
    
    // Place treasures randomly
    const numTreasures = 15 + Math.floor(Math.random() * 10);
    while (treasurePositions.size < numTreasures) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      treasurePositions.add(`${x},${y}`);
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Pixel[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const hasTreasure = treasurePositions.has(`${x},${y}`);
        const layer = Math.floor(y / (GRID_SIZE / LAYERS.length));
        row.push({
          x,
          y,
          excavated: false,
          layer: Math.min(layer, LAYERS.length - 1),
          hasTreasure,
          treasureId: hasTreasure ? TREASURES[Math.floor(Math.random() * TREASURES.length)]?.id : undefined,
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setDiscoveredTreasures([]);
    setCurrentTreasure(null);
    setTotalExcavated(0);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixelSize = canvas.width / GRID_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixel = grid[y]?.[x];
        if (!pixel) continue;
        
        if (pixel.excavated) {
          // Draw excavated background
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          
          // Draw treasure if revealed
          if (pixel.hasTreasure && pixel.treasureId) {
            const treasure = TREASURES.find(t => t.id === pixel.treasureId);
            if (treasure) {
              ctx.font = `${pixelSize * 0.8}px serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(
                treasure.emoji,
                x * pixelSize + pixelSize / 2,
                y * pixelSize + pixelSize / 2
              );
            }
          }
        } else {
          // Draw dirt layer
          const layerData = LAYERS[pixel.layer];
          ctx.fillStyle = layerData?.color ?? "#5a4a3a";
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          
          // Add texture
          ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.1})`;
          for (let i = 0; i < 3; i++) {
            const dotX = x * pixelSize + Math.random() * pixelSize;
            const dotY = y * pixelSize + Math.random() * pixelSize;
            ctx.fillRect(dotX, dotY, 2, 2);
          }
        }
        
        // Grid lines
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }, [grid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const excavateAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const pixelSize = canvas.width / GRID_SIZE;
    const centerX = Math.floor((clientX - rect.left) / pixelSize);
    const centerY = Math.floor((clientY - rect.top) / pixelSize);

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(pixel => ({ ...pixel })));
      let newlyExcavated = 0;
      const newTreasures: Treasure[] = [];

      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            const pixel = newGrid[y]?.[x];
            if (pixel && !pixel.excavated) {
              pixel.excavated = true;
              newlyExcavated++;
              
              if (pixel.hasTreasure && pixel.treasureId) {
                const treasure = TREASURES.find(t => t.id === pixel.treasureId);
                if (treasure && !discoveredTreasures.find(t => t.id === treasure.id)) {
                  newTreasures.push(treasure);
                }
              }
            }
          }
        }
      }

      if (newlyExcavated > 0) {
        setTotalExcavated(prev => prev + newlyExcavated);
      }

      if (newTreasures.length > 0) {
        setDiscoveredTreasures(prev => [...prev, ...newTreasures]);
        setCurrentTreasure(newTreasures[newTreasures.length - 1] ?? null);
      }

      return newGrid;
    });

    setIsDigging(true);
    setTimeout(() => setIsDigging(false), 100);
  }, [grid, brushSize, discoveredTreasures]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    excavateAt(e.clientX, e.clientY);
  }, [excavateAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMouseDownRef.current) {
      excavateAt(e.clientX, e.clientY);
    }
  }, [excavateAt]);

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      excavateAt(touch.clientX, touch.clientY);
    }
  }, [excavateAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      excavateAt(touch.clientX, touch.clientY);
    }
  }, [excavateAt]);

  const progress = (totalExcavated / (GRID_SIZE * GRID_SIZE)) * 100;

  return (
    <FeatureWrapper day={397} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🏛️ Pixel Archaeology Institute
          </h1>
          <p style={{ color: "var(--color-text-dim)" }}>
            Carefully excavate through the layers of digital history. What ancient treasures await?
          </p>
        </div>

        {/* Layer Legend */}
        <div 
          className="flex flex-wrap justify-center gap-2 p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          {LAYERS.map((layer, i) => (
            <div key={i} className="flex items-center gap-1 text-xs">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: layer.color }}
              />
              <span style={{ color: "var(--color-text-dim)" }}>{layer.name}</span>
            </div>
          ))}
        </div>

        {/* Main Dig Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas */}
          <div className="flex-1">
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full aspect-square rounded cursor-crosshair"
                style={{ 
                  transition: "transform 0.1s",
                  touchAction: "none",
                  transform: isDigging ? "scale(0.99)" : "scale(1)"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              />
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--color-text-dim)" }}>Excavation Progress</span>
                <span style={{ color: "var(--color-text)" }}>{progress.toFixed(1)}%</span>
              </div>
              <div 
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--color-border)" }}
              >
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: "var(--color-accent)"
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--color-text-dim)" }}>Brush Size:</span>
                {[1, 2, 3].map(size => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                      color: brushSize === size ? "white" : "var(--color-text)",
                      boxShadow: brushSize === size ? "0 0 0 2px var(--color-accent)" : "none"
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                onClick={initializeGrid}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ 
                  backgroundColor: "var(--color-bg-secondary)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)"
                }}
              >
                🔄 New Dig Site
              </button>
            </div>
          </div>

          {/* Discoveries Panel */}
          <div 
            className="lg:w-80 p-4 rounded-lg space-y-4"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h2 
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📜 Field Notes
            </h2>

            {/* Current Discovery */}
            {currentTreasure && (
              <div 
                className="p-3 rounded-lg animate-pulse"
                style={{ 
                  backgroundColor: "var(--color-bg)",
                  border: `2px solid ${RARITY_COLORS[currentTreasure.rarity] ?? "#9CA3AF"}`
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{currentTreasure.emoji}</span>
                  <div>
                    <h3 className="font-bold" style={{ color: "var(--color-text)" }}>
                      {currentTreasure.name}
                    </h3>
                    <span 
                      className="text-xs uppercase font-medium"
                      style={{ color: RARITY_COLORS[currentTreasure.rarity] ?? "#9CA3AF" }}
                    >
                      {currentTreasure.rarity}
                    </span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                  {currentTreasure.backstory}
                </p>
                <p className="text-xs mt-2 italic" style={{ color: "var(--color-text-dim)" }}>
                  Era: {currentTreasure.era}
                </p>
              </div>
            )}

            {/* Collection */}
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text-dim)" }}>
                Collection ({discoveredTreasures.length}/{TREASURES.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {TREASURES.map(treasure => {
                  const discovered = discoveredTreasures.find(t => t.id === treasure.id);
                  return (
                    <div
                      key={treasure.id}
                      className="w-8 h-8 rounded flex items-center justify-center text-lg cursor-pointer transition-transform hover:scale-110"
                      style={{ 
                        backgroundColor: discovered ? "var(--color-bg)" : "var(--color-border)",
                        opacity: discovered ? 1 : 0.3
                      }}
                      title={discovered ? `${treasure.name} - ${treasure.rarity}` : "???"}
                      onClick={() => discovered && setCurrentTreasure(treasure)}
                    >
                      {discovered ? treasure.emoji : "?"}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div 
              className="p-3 rounded text-sm space-y-1"
              style={{ backgroundColor: "var(--color-bg)" }}
            >
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-dim)" }}>Pixels Excavated:</span>
                <span style={{ color: "var(--color-text)" }}>{totalExcavated}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-dim)" }}>Treasures Found:</span>
                <span style={{ color: "var(--color-text)" }}>{discoveredTreasures.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-dim)" }}>Legendary Items:</span>
                <span style={{ color: RARITY_COLORS.legendary }}>
                  {discoveredTreasures.filter(t => t.rarity === "legendary").length}
                </span>
              </div>
            </div>

            {discoveredTreasures.length === TREASURES.length && (
              <div 
                className="p-4 rounded-lg text-center"
                style={{ 
                  background: "linear-gradient(135deg, #F59E0B20, #EF444420)",
                  border: "2px solid #F59E0B"
                }}
              >
                <span className="text-2xl">🎉</span>
                <p className="font-bold mt-2" style={{ color: "var(--color-text)" }}>
                  Complete Collection!
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                  You&apos;ve unearthed all digital relics!
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
          Click and drag to excavate. Use larger brushes for faster digging, but be careful not to damage the artifacts! 🏺
        </p>
      </div>
    </FeatureWrapper>
  );
}