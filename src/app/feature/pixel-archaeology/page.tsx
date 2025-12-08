"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  type: string;
  emoji: string;
  name: string;
  age: string;
  discovered: boolean;
}

interface Layer {
  name: string;
  depth: number;
  color: string;
  artifactTypes: { type: string; emoji: string; name: string; age: string }[];
  description: string;
}

const LAYERS: Layer[] = [
  {
    name: "Modern Debris",
    depth: 0,
    color: "#8B7355",
    artifactTypes: [
      { type: "plastic", emoji: "🧴", name: "Mysterious Container", age: "~50 years" },
      { type: "coin", emoji: "🪙", name: "Metal Disc Token", age: "~100 years" },
      { type: "key", emoji: "🔑", name: "Access Device", age: "~80 years" },
    ],
    description: "Recent human activity layer",
  },
  {
    name: "Industrial Era",
    depth: 60,
    color: "#6B5344",
    artifactTypes: [
      { type: "gear", emoji: "⚙️", name: "Mechanical Cog", age: "~200 years" },
      { type: "pipe", emoji: "🔧", name: "Steam Conduit", age: "~180 years" },
      { type: "lantern", emoji: "🏮", name: "Fire Vessel", age: "~150 years" },
    ],
    description: "Age of smoke and steel",
  },
  {
    name: "Medieval Stratum",
    depth: 120,
    color: "#5D4037",
    artifactTypes: [
      { type: "sword", emoji: "⚔️", name: "Warrior's Blade", age: "~600 years" },
      { type: "crown", emoji: "👑", name: "Royal Circlet", age: "~700 years" },
      { type: "scroll", emoji: "📜", name: "Ancient Text", age: "~500 years" },
    ],
    description: "Kingdom of forgotten rulers",
  },
  {
    name: "Ancient Civilization",
    depth: 180,
    color: "#4E342E",
    artifactTypes: [
      { type: "amphora", emoji: "🏺", name: "Sacred Vessel", age: "~2000 years" },
      { type: "statue", emoji: "🗿", name: "Stone Guardian", age: "~2500 years" },
      { type: "ring", emoji: "💍", name: "Enchanted Band", age: "~1800 years" },
    ],
    description: "Empire of the Sun Worshippers",
  },
  {
    name: "Prehistoric Era",
    depth: 240,
    color: "#3E2723",
    artifactTypes: [
      { type: "bone", emoji: "🦴", name: "Giant's Bone", age: "~50,000 years" },
      { type: "tooth", emoji: "🦷", name: "Megafauna Tooth", age: "~40,000 years" },
      { type: "tool", emoji: "🪨", name: "Primitive Tool", age: "~30,000 years" },
    ],
    description: "When giants roamed",
  },
  {
    name: "Fossil Bed",
    depth: 300,
    color: "#2D2420",
    artifactTypes: [
      { type: "shell", emoji: "🐚", name: "Ancient Shell", age: "~100 million years" },
      { type: "leaf", emoji: "🍃", name: "Petrified Flora", age: "~80 million years" },
      { type: "dino", emoji: "🦕", name: "Dinosaur Fragment", age: "~65 million years" },
    ],
    description: "Echoes of primordial life",
  },
  {
    name: "Crystal Depths",
    depth: 360,
    color: "#1A1515",
    artifactTypes: [
      { type: "crystal", emoji: "💎", name: "Void Crystal", age: "~500 million years" },
      { type: "gem", emoji: "💠", name: "Dimensional Shard", age: "~600 million years" },
      { type: "orb", emoji: "🔮", name: "Memory Orb", age: "~400 million years" },
    ],
    description: "Where reality bends",
  },
  {
    name: "The Unknowable",
    depth: 420,
    color: "#0D0A0A",
    artifactTypes: [
      { type: "eye", emoji: "👁️", name: "Watching Eye", age: "Before time" },
      { type: "void", emoji: "🕳️", name: "Void Fragment", age: "????" },
      { type: "star", emoji: "⭐", name: "Fallen Star", age: "Eternal" },
    ],
    description: "Things that should not be found",
  },
];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const BRUSH_SIZE = 20;
const PIXEL_SIZE = 4;

export default function PixelArchaeology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const excavationRef = useRef<Uint8Array | null>(null);
  const artifactsRef = useRef<Artifact[]>([]);
  const [isDigging, setIsDigging] = useState(false);
  const [discoveries, setDiscoveries] = useState<Artifact[]>([]);
  const [currentLayer, setCurrentLayer] = useState<Layer>(LAYERS[0]);
  const [deepestDepth, setDeepestDepth] = useState(0);
  const [showTooltip, setShowTooltip] = useState<Artifact | null>(null);
  const frameRef = useRef<number>(0);

  const getLayerAtDepth = useCallback((depth: number): Layer => {
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      if (depth >= LAYERS[i].depth) {
        return LAYERS[i];
      }
    }
    return LAYERS[0];
  }, []);

  const generateArtifacts = useCallback(() => {
    const artifacts: Artifact[] = [];
    LAYERS.forEach((layer, layerIndex) => {
      const artifactCount = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < artifactCount; i++) {
        const artifactType = layer.artifactTypes[Math.floor(Math.random() * layer.artifactTypes.length)];
        const nextLayerDepth = LAYERS[layerIndex + 1]?.depth || CANVAS_HEIGHT;
        artifacts.push({
          x: Math.floor(Math.random() * (CANVAS_WIDTH - 40)) + 20,
          y: layer.depth + Math.floor(Math.random() * (nextLayerDepth - layer.depth - 20)) + 10,
          ...artifactType,
          discovered: false,
        });
      }
    });
    return artifacts;
  }, []);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !excavationRef.current) return;

    const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;

    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const layer = getLayerAtDepth(y);
      const baseColor = hexToRgb(layer.color);
      
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        const pixelIndex = y * CANVAS_WIDTH + x;
        const excavated = excavationRef.current[pixelIndex];
        const dataIndex = pixelIndex * 4;

        if (excavated === 1) {
          // Excavated - show darker background
          data[dataIndex] = 20;
          data[dataIndex + 1] = 15;
          data[dataIndex + 2] = 10;
          data[dataIndex + 3] = 255;
        } else {
          // Add some noise for texture
          const noise = (Math.random() - 0.5) * 20;
          const depthFactor = 1 - (y / CANVAS_HEIGHT) * 0.3;
          
          data[dataIndex] = Math.min(255, Math.max(0, baseColor.r * depthFactor + noise));
          data[dataIndex + 1] = Math.min(255, Math.max(0, baseColor.g * depthFactor + noise));
          data[dataIndex + 2] = Math.min(255, Math.max(0, baseColor.b * depthFactor + noise));
          data[dataIndex + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw artifacts
    artifactsRef.current.forEach((artifact) => {
      const px = Math.floor(artifact.x / PIXEL_SIZE) * PIXEL_SIZE;
      const py = Math.floor(artifact.y / PIXEL_SIZE) * PIXEL_SIZE;
      
      // Check if artifact is exposed
      let exposed = false;
      for (let checkY = py - 8; checkY <= py + 8; checkY++) {
        for (let checkX = px - 8; checkX <= px + 8; checkX++) {
          if (checkX >= 0 && checkX < CANVAS_WIDTH && checkY >= 0 && checkY < CANVAS_HEIGHT) {
            const idx = checkY * CANVAS_WIDTH + checkX;
            if (excavationRef.current && excavationRef.current[idx] === 1) {
              exposed = true;
              break;
            }
          }
        }
        if (exposed) break;
      }

      if (exposed) {
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(artifact.emoji, artifact.x, artifact.y);
        
        if (!artifact.discovered) {
          artifact.discovered = true;
          setDiscoveries((prev) => [...prev, artifact]);
        }
      }
    });

    // Draw depth indicator
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Depth: ${deepestDepth}m`, 10, 20);
  }, [getLayerAtDepth, deepestDepth]);

  const excavate = useCallback((x: number, y: number) => {
    if (!excavationRef.current) return;

    let maxDepth = deepestDepth;

    for (let dy = -BRUSH_SIZE; dy <= BRUSH_SIZE; dy++) {
      for (let dx = -BRUSH_SIZE; dx <= BRUSH_SIZE; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= BRUSH_SIZE) {
          const px = Math.floor(x + dx);
          const py = Math.floor(y + dy);
          
          if (px >= 0 && px < CANVAS_WIDTH && py >= 0 && py < CANVAS_HEIGHT) {
            const idx = py * CANVAS_WIDTH + px;
            excavationRef.current[idx] = 1;
            
            if (py > maxDepth) {
              maxDepth = py;
            }
          }
        }
      }
    }

    if (maxDepth > deepestDepth) {
      setDeepestDepth(maxDepth);
      setCurrentLayer(getLayerAtDepth(maxDepth));
    }

    drawScene();
  }, [deepestDepth, getLayerAtDepth, drawScene]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      excavate(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDigging) {
      excavate(x, y);
    }

    // Check for artifact hover
    const hoveredArtifact = artifactsRef.current.find((artifact) => {
      if (!artifact.discovered) return false;
      const dist = Math.sqrt((x - artifact.x) ** 2 + (y - artifact.y) ** 2);
      return dist < 20;
    });

    setShowTooltip(hoveredArtifact || null);
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const handleMouseLeave = () => {
    setIsDigging(false);
    setShowTooltip(null);
  };

  const resetExcavation = () => {
    excavationRef.current = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    artifactsRef.current = generateArtifacts();
    setDiscoveries([]);
    setDeepestDepth(0);
    setCurrentLayer(LAYERS[0]);
    drawScene();
  };

  useEffect(() => {
    excavationRef.current = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    artifactsRef.current = generateArtifacts();
    drawScene();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [generateArtifacts, drawScene]);

  return (
    <FeatureWrapper day={373} title="Pixel Archaeology" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Dig Through Time Itself
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click and drag to excavate. Each layer reveals artifacts from different eras. 
            How deep can you go? What ancient secrets will you unearth?
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="rounded-lg cursor-crosshair border-2"
              style={{ 
                borderColor: "var(--color-border)",
                imageRendering: "pixelated"
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
            
            {showTooltip && (
              <div
                className="absolute pointer-events-none px-3 py-2 rounded-lg shadow-lg"
                style={{
                  left: showTooltip.x + 20,
                  top: showTooltip.y - 40,
                  backgroundColor: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="text-lg">{showTooltip.emoji} {showTooltip.name}</div>
                <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                  Age: {showTooltip.age}
                </div>
              </div>
            )}

            {/* Layer indicator */}
            <div
              className="absolute top-2 right-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white",
              }}
            >
              <div className="text-sm font-bold">{currentLayer.name}</div>
              <div className="text-xs opacity-75">{currentLayer.description}</div>
            </div>
          </div>

          <div className="w-full lg:w-64 space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <h3
                className="font-bold mb-3"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Geological Layers
              </h3>
              <div className="space-y-1">
                {LAYERS.map((layer) => (
                  <div
                    key={layer.name}
                    className="flex items-center gap-2 text-sm p-1 rounded"
                    style={{
                      backgroundColor:
                        currentLayer.name === layer.name
                          ? "var(--color-accent)"
                          : "transparent",
                      opacity: deepestDepth >= layer.depth ? 1 : 0.4,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span>{layer.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <h3
                className="font-bold mb-3"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Discoveries ({discoveries.length})
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {discoveries.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                    Start digging to find artifacts...
                  </p>
                ) : (
                  discoveries.map((artifact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm p-2 rounded"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <span className="text-xl">{artifact.emoji}</span>
                      <div>
                        <div className="font-medium">{artifact.name}</div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-dim)" }}
                        >
                          {artifact.age}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={resetExcavation}
              className="btn-secondary w-full py-2 rounded-lg"
            >
              🔄 New Excavation Site
            </button>
          </div>
        </div>

        <div
          className="text-center text-sm mt-4"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>💡 Tip: Hover over discovered artifacts to learn more about them!</p>
          <p className="mt-1">
            ⚠️ Warning: Some things are buried for a reason...
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}