"use client";

import { useState, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Layer {
  depth: number;
  color: string;
  pattern: string;
  artifacts: Artifact[];
}

interface Artifact {
  x: number;
  y: number;
  type: string;
  emoji: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface Pixel {
  excavated: boolean;
  depth: number;
}

const GRID_SIZE = 20;
const MAX_DEPTH = 5;

const LAYER_CONFIGS: Record<number, { color: string; pattern: string; name: string }> = {
  0: { color: '#8B4513', pattern: 'soil', name: 'Topsoil' },
  1: { color: '#654321', pattern: 'clay', name: 'Clay Layer' },
  2: { color: '#4B4B4D', pattern: 'rock', name: 'Bedrock' },
  3: { color: '#2F4F4F', pattern: 'ancient', name: 'Ancient Stratum' },
  4: { color: '#1C1C1C', pattern: 'mystery', name: 'The Void' }
};

const ARTIFACTS: Omit<Artifact, 'x' | 'y'>[] = [
  { type: 'pottery', emoji: '🏺', name: 'Ancient Vase', description: 'A delicate vessel from a forgotten civilization', rarity: 'common' },
  { type: 'coin', emoji: '🪙', name: 'Golden Coin', description: 'Currency of the pixel empire', rarity: 'uncommon' },
  { type: 'fossil', emoji: '🦴', name: 'Pixel Fossil', description: 'Remains of an 8-bit creature', rarity: 'uncommon' },
  { type: 'gem', emoji: '💎', name: 'Digital Diamond', description: 'Crystallized data from the old web', rarity: 'rare' },
  { type: 'scroll', emoji: '📜', name: 'Code Scroll', description: 'Ancient algorithms written in lost languages', rarity: 'rare' },
  { type: 'crown', emoji: '👑', name: 'Pixel Crown', description: 'Crown of the legendary Pixel King', rarity: 'legendary' },
  { type: 'key', emoji: '🗝️', name: 'Cryptic Key', description: 'Opens doors to digital dimensions', rarity: 'legendary' },
  { type: 'tablet', emoji: '🗿', name: 'Stone Tablet', description: 'Encrypted with primordial memes', rarity: 'uncommon' },
  { type: 'mask', emoji: '🎭', name: 'Ritual Mask', description: 'Used in ancient pixel ceremonies', rarity: 'rare' },
  { type: 'orb', emoji: '🔮', name: 'Data Orb', description: 'Contains compressed memories', rarity: 'legendary' }
];

export default function PixelArchaeology() {
  const [grid, setGrid] = useState<Pixel[][]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [foundArtifacts, setFoundArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [totalClicks, setTotalClicks] = useState(0);
  const [currentTool, setCurrentTool] = useState<'brush' | 'pickaxe'>('brush');
  const [digSite, setDigSite] = useState(1);

  const generateLayers = useCallback(() => {
    const newLayers: Layer[] = [];
    
    for (let depth = 0; depth < MAX_DEPTH; depth++) {
      const layerArtifacts: Artifact[] = [];
      const artifactCount = Math.floor(Math.random() * 3) + (depth === MAX_DEPTH - 1 ? 2 : 1);
      
      for (let i = 0; i < artifactCount; i++) {
        const artifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
        let rarity = artifact.rarity;
        
        // Deeper layers have better loot
        if (depth >= 3 && Math.random() < 0.3) {
          rarity = 'rare';
        }
        if (depth === MAX_DEPTH - 1 && Math.random() < 0.2) {
          rarity = 'legendary';
        }
        
        layerArtifacts.push({
          ...artifact,
          rarity,
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        });
      }
      
      newLayers.push({
        depth,
        color: LAYER_CONFIGS[depth].color,
        pattern: LAYER_CONFIGS[depth].pattern,
        artifacts: layerArtifacts
      });
    }
    
    return newLayers;
  }, []);

  const initializeGrid = useCallback(() => {
    const newGrid: Pixel[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      newGrid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        newGrid[y][x] = { excavated: false, depth: 0 };
      }
    }
    setGrid(newGrid);
    setLayers(generateLayers());
    setFoundArtifacts([]);
    setTotalClicks(0);
  }, [generateLayers]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid, digSite]);

  const excavatePixel = (x: number, y: number) => {
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      const pixel = newGrid[y][x];
      
      if (pixel.depth < MAX_DEPTH) {
        const digPower = currentTool === 'pickaxe' ? 2 : 1;
        pixel.depth = Math.min(pixel.depth + digPower, MAX_DEPTH);
        pixel.excavated = true;
        
        // Check for artifacts at this depth
        layers.forEach(layer => {
          if (layer.depth <= pixel.depth) {
            layer.artifacts.forEach(artifact => {
              if (artifact.x === x && artifact.y === y) {
                const alreadyFound = foundArtifacts.some(
                  a => a.x === artifact.x && a.y === artifact.y && a.type === artifact.type
                );
                if (!alreadyFound) {
                  setFoundArtifacts(prev => [...prev, artifact]);
                }
              }
            });
          }
        });
      }
      
      return newGrid;
    });
    
    setTotalClicks(prev => prev + 1);
  };

  const getPixelStyle = (pixel: Pixel, x: number, y: number) => {
    if (!pixel.excavated) {
      return { backgroundColor: '#8B4513' };
    }
    
    const depth = Math.max(0, pixel.depth - 1);
    const layerConfig = LAYER_CONFIGS[depth];
    
    // Check if there's a visible artifact here
    const visibleArtifact = layers
      .filter(layer => layer.depth < pixel.depth)
      .flatMap(layer => layer.artifacts)
      .find(artifact => artifact.x === x && artifact.y === y);
    
    if (visibleArtifact && foundArtifacts.includes(visibleArtifact)) {
      return { 
        backgroundColor: layerConfig.color,
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      };
    }
    
    return { backgroundColor: layerConfig.color };
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <FeatureWrapper day={360} title="Pixel Archaeology" emoji="⛏️">
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 
            className="text-5xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Pixel Archaeology
          </h1>
          
          <p className="text-center mb-8" style={{ color: "var(--color-text-dim)" }}>
            Click to excavate through layers of digital history. Deeper layers hold rarer treasures!
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main dig site */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentTool('brush')}
                    className={`px-4 py-2 rounded ${currentTool === 'brush' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    🖌️ Brush
                  </button>
                  <button
                    onClick={() => setCurrentTool('pickaxe')}
                    className={`px-4 py-2 rounded ${currentTool === 'pickaxe' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    ⛏️ Pickaxe (2x)
                  </button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <span style={{ color: "var(--color-text-dim)" }}>Dig Site:</span>
                  {[1, 2, 3].map(site => (
                    <button
                      key={site}
                      onClick={() => setDigSite(site)}
                      className={`px-3 py-1 rounded ${site === digSite ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </div>

              <div 
                className="inline-block rounded-lg overflow-hidden shadow-2xl"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <div className="grid grid-cols-20 gap-0">
                  {grid.map((row, y) => (
                    row.map((pixel, x) => {
                      const visibleArtifact = layers
                        .filter(layer => layer.depth < pixel.depth)
                        .flatMap(layer => layer.artifacts)
                        .find(artifact => artifact.x === x && artifact.y === y);
                      
                      const isFound = visibleArtifact && foundArtifacts.includes(visibleArtifact);
                      
                      return (
                        <div
                          key={`${x}-${y}`}
                          onClick={() => excavatePixel(x, y)}
                          className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
                          style={getPixelStyle(pixel, x, y)}
                        >
                          {isFound && visibleArtifact.emoji}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {Object.entries(LAYER_CONFIGS).map(([depth, config]) => (
                  <div key={depth} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: config.color }}
                    />
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Depth {depth}: {config.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Artifacts panel */}
            <div>
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <h2 
                  className="text-2xl font-bold mb-4"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
                >
                  Collection ({foundArtifacts.length})
                </h2>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {foundArtifacts.length === 0 ? (
                    <p style={{ color: "var(--color-text-dim)" }}>
                      No artifacts found yet. Keep digging!
                    </p>
                  ) : (
                    foundArtifacts.map((artifact, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedArtifact(artifact)}
                        className="p-3 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: "var(--color-bg)",
                          border: `1px solid var(--color-border)`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{artifact.emoji}</span>
                          <div className="flex-1">
                            <div className={`font-semibold ${getRarityColor(artifact.rarity)}`}>
                              {artifact.name}
                            </div>
                            <div 
                              className="text-xs capitalize"
                              style={{ color: "var(--color-text-dim)" }}
                            >
                              {artifact.rarity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <div style={{ color: "var(--color-text-dim)" }}>
                    Total excavations: {totalClicks}
                  </div>
                  <div style={{ color: "var(--color-text-dim)" }}>
                    Completion: {Math.round((foundArtifacts.length / (ARTIFACTS.length * 2)) * 100)}%
                  </div>
                </div>
              </div>

              {selectedArtifact && (
                <div 
                  className="mt-4 rounded-lg p-4"
                  style={{ backgroundColor: "var(--color-bg-secondary)" }}
                >
                  <h3 
                    className="text-lg font-bold mb-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    {selectedArtifact.name}
                  </h3>
                  <p style={{ color: "var(--color-text-dim)" }}>
                    {selectedArtifact.description}
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-text-dim)" }}>
                    Found at: ({selectedArtifact.x}, {selectedArtifact.y})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FeatureWrapper>
  );
}