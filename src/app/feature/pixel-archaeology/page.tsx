"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

// Civilization tile types
type TileType = 
  | 'empty' 
  | 'dirt' 
  | 'stone' 
  | 'road' 
  | 'wall' 
  | 'floor' 
  | 'artifact' 
  | 'skeleton' 
  | 'treasure' 
  | 'pillar'
  | 'altar'
  | 'water';

interface Tile {
  type: TileType;
  revealed: boolean;
  color: string;
}

interface Discovery {
  name: string;
  description: string;
  emoji: string;
}

const GRID_SIZE = 40;
const TILE_SIZE = 12;

// Color palette for the civilization
const COLORS: Record<string, string> = {
  empty: '#1a1a2e',
  dirt: '#5c4033',
  stone: '#6b6b6b',
  road: '#8b7355',
  wall: '#4a4a5a',
  floor: '#7a6a5a',
  artifact: '#ffd700',
  skeleton: '#f5f5dc',
  treasure: '#ff6b6b',
  pillar: '#8a8a9a',
  altar: '#9b59b6',
  water: '#3498db',
  fog: '#0a0a12',
};

const DISCOVERIES: Record<string, Discovery> = {
  skeleton: { name: 'Ancient Remains', description: 'A pixel person from a forgotten age...', emoji: '💀' },
  artifact: { name: 'Golden Artifact', description: 'A precious relic of the old ones!', emoji: '⭐' },
  treasure: { name: 'Ruby Gem', description: 'Worth a fortune in pixel currency!', emoji: '💎' },
  altar: { name: 'Sacred Altar', description: 'Where they worshipped the great Cursor...', emoji: '🏛️' },
  water: { name: 'Ancient Well', description: 'Still holds digital water after millennia!', emoji: '💧' },
};

function generateCivilization(): Tile[][] {
  const grid: Tile[][] = [];
  
  // Initialize with dirt and empty
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const isDirt = Math.random() > 0.3;
      grid[y][x] = {
        type: isDirt ? 'dirt' : 'stone',
        revealed: false,
        color: isDirt ? COLORS.dirt : COLORS.stone,
      };
    }
  }
  
  // Add main roads (cross pattern)
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  
  for (let i = 5; i < GRID_SIZE - 5; i++) {
    grid[centerY][i] = { type: 'road', revealed: false, color: COLORS.road };
    grid[i][centerX] = { type: 'road', revealed: false, color: COLORS.road };
  }
  
  // Add buildings (rectangular structures)
  const buildings = [
    { x: 5, y: 5, w: 8, h: 6 },
    { x: 27, y: 5, w: 7, h: 8 },
    { x: 5, y: 25, w: 6, h: 7 },
    { x: 28, y: 28, w: 8, h: 6 },
    { x: 15, y: 8, w: 4, h: 4 },
    { x: 25, y: 18, w: 5, h: 5 },
  ];
  
  buildings.forEach(b => {
    // Walls
    for (let x = b.x; x < b.x + b.w && x < GRID_SIZE; x++) {
      for (let y = b.y; y < b.y + b.h && y < GRID_SIZE; y++) {
        if (x === b.x || x === b.x + b.w - 1 || y === b.y || y === b.y + b.h - 1) {
          grid[y][x] = { type: 'wall', revealed: false, color: COLORS.wall };
        } else {
          grid[y][x] = { type: 'floor', revealed: false, color: COLORS.floor };
        }
      }
    }
    
    // Add pillars at corners
    if (b.w > 4 && b.h > 4) {
      grid[b.y + 1][b.x + 1] = { type: 'pillar', revealed: false, color: COLORS.pillar };
      if (b.x + b.w - 2 < GRID_SIZE) {
        grid[b.y + 1][b.x + b.w - 2] = { type: 'pillar', revealed: false, color: COLORS.pillar };
      }
    }
  });
  
  // Add altar at center
  grid[centerY][centerX] = { type: 'altar', revealed: false, color: COLORS.altar };
  
  // Add water features
  const waterSpots = [
    { x: 10, y: 15 },
    { x: 30, y: 15 },
    { x: 20, y: 30 },
  ];
  waterSpots.forEach(spot => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = spot.x + dx;
        const ny = spot.y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          grid[ny][nx] = { type: 'water', revealed: false, color: COLORS.water };
        }
      }
    }
  });
  
  // Scatter artifacts
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (grid[y][x].type === 'dirt' || grid[y][x].type === 'floor') {
      grid[y][x] = { type: 'artifact', revealed: false, color: COLORS.artifact };
    }
  }
  
  // Add skeletons
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (grid[y][x].type === 'dirt' || grid[y][x].type === 'floor') {
      grid[y][x] = { type: 'skeleton', revealed: false, color: COLORS.skeleton };
    }
  }
  
  // Add treasures
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (grid[y][x].type === 'floor') {
      grid[y][x] = { type: 'treasure', revealed: false, color: COLORS.treasure };
    }
  }
  
  return grid;
}

export default function PixelArchaeology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [totalTiles] = useState(GRID_SIZE * GRID_SIZE);
  const [latestDiscovery, setLatestDiscovery] = useState<Discovery | null>(null);
  const [brushSize, setBrushSize] = useState(3);
  
  // Initialize the grid
  useEffect(() => {
    setGrid(generateCivilization());
  }, []);
  
  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = COLORS.fog;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = grid[y]?.[x];
        if (!tile) continue;
        
        if (tile.revealed) {
          ctx.fillStyle = tile.color;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          
          // Add slight border for structure
          if (['wall', 'pillar', 'altar'].includes(tile.type)) {
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
          
          // Add sparkle to artifacts and treasures
          if (['artifact', 'treasure'].includes(tile.type)) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, 2, 2);
          }
        } else {
          // Draw fog with slight texture
          ctx.fillStyle = COLORS.fog;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          
          // Add subtle noise
          if (Math.random() > 0.95) {
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }, [grid]);
  
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);
  
  const revealArea = useCallback((centerX: number, centerY: number) => {
    setGrid(prevGrid => {
      if (prevGrid.length === 0) return prevGrid;
      
      const newGrid = prevGrid.map(row => row.map(tile => ({ ...tile })));
      const newDiscoveries: Discovery[] = [];
      let revealed = 0;
      
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          // Circular brush
          if (dx * dx + dy * dy <= brushSize * brushSize) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              const tile = newGrid[y]?.[x];
              if (tile && !tile.revealed) {
                newGrid[y][x] = { ...tile, revealed: true };
                revealed++;
                
                const tileType = tile.type;
                const discovery = DISCOVERIES[tileType];
                if (discovery) {
                  setDiscoveries(prev => {
                    if (!prev.some(d => d.name === discovery.name)) {
                      newDiscoveries.push(discovery);
                      return [...prev, discovery];
                    }
                    return prev;
                  });
                }
              }
            }
          }
        }
      }
      
      if (revealed > 0) {
        setRevealedCount(prev => prev + revealed);
        
        if (newDiscoveries.length > 0) {
          setLatestDiscovery(newDiscoveries[newDiscoveries.length - 1]);
          setTimeout(() => setLatestDiscovery(null), 2000);
        }
        
        return newGrid;
      }
      
      return prevGrid;
    });
  }, [brushSize]);
  
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / TILE_SIZE);
    
    revealArea(x, y);
  }, [revealArea]);
  
  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return; // Only when mouse button is pressed
    handleCanvasClick(e);
  }, [handleCanvasClick]);
  
  const resetDig = () => {
    setGrid(generateCivilization());
    setDiscoveries([]);
    setRevealedCount(0);
    setLatestDiscovery(null);
  };
  
  const revealAll = () => {
    setGrid(prev => prev.map(row => row.map(tile => ({ ...tile, revealed: true }))));
    setRevealedCount(totalTiles);
  };
  
  const progressPercent = Math.floor((revealedCount / totalTiles) * 100);
  
  return (
    <FeatureWrapper day={376} title="Pixel Archaeology" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Uncover the Lost Civilization
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click and drag to brush away centuries of digital dust. What secrets lie beneath?
          </p>
        </div>
        
        {/* Discovery notification */}
        {latestDiscovery && (
          <div 
            className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            <span className="text-2xl mr-2">{latestDiscovery.emoji}</span>
            <span className="font-bold">{latestDiscovery.name} discovered!</span>
          </div>
        )}
        
        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="flex justify-between text-sm mb-1" style={{ color: "var(--color-text-dim)" }}>
            <span>Excavation Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div 
            className="h-3 rounded-full overflow-hidden"
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
        </div>
        
        {/* Canvas */}
        <div 
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{ border: "2px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * TILE_SIZE}
            height={GRID_SIZE * TILE_SIZE}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
            className="cursor-crosshair"
            style={{ 
              width: Math.min(GRID_SIZE * TILE_SIZE, 480),
              height: Math.min(GRID_SIZE * TILE_SIZE, 480),
              imageRendering: 'pixelated'
            }}
          />
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-dim)" }}>Brush:</span>
            {[2, 3, 5].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className="px-3 py-1 rounded transition-all"
                style={{ 
                  backgroundColor: brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                  color: "var(--color-text)",
                  boxShadow: brushSize === size ? "0 0 0 2px var(--color-accent)" : "none"
                }}
              >
                {size === 2 ? 'Fine' : size === 3 ? 'Medium' : 'Wide'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={resetDig} 
            className="px-4 py-2 rounded transition-colors"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)", 
              color: "var(--color-text)" 
            }}
          >
            🔄 New Site
          </button>
          
          <button 
            onClick={revealAll} 
            className="px-4 py-2 rounded transition-colors"
            style={{ 
              backgroundColor: "var(--color-accent)", 
              color: "white" 
            }}
          >
            👁️ Reveal All
          </button>
        </div>
        
        {/* Discoveries panel */}
        {discoveries.length > 0 && (
          <div 
            className="w-full max-w-md p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3 
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📜 Field Journal ({discoveries.length} discoveries)
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {discoveries.map((d, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-2 p-2 rounded"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <span className="text-xl">{d.emoji}</span>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--color-text)" }}>
                      {d.name}
                    </div>
                    <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                      {d.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div 
          className="flex flex-wrap gap-3 justify-center text-sm p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          {[
            { color: COLORS.road, label: 'Roads' },
            { color: COLORS.wall, label: 'Walls' },
            { color: COLORS.floor, label: 'Floors' },
            { color: COLORS.water, label: 'Water' },
            { color: COLORS.artifact, label: 'Artifacts' },
            { color: COLORS.skeleton, label: 'Remains' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span style={{ color: "var(--color-text-dim)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </FeatureWrapper>
  );
}