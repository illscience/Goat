"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "fossil" | "coin" | "gem" | "pottery" | "bone" | "ring" | "skull" | "arrowhead";
  color: string;
  secondaryColor: string;
  discovered: boolean;
  revealPercentage: number;
}

interface Layer {
  depth: number;
  color: string;
  name: string;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const BRUSH_SIZE = 15;

const LAYERS: Layer[] = [
  { depth: 0, color: "#8B7355", name: "Topsoil" },
  { depth: 80, color: "#6B5344", name: "Clay Layer" },
  { depth: 160, color: "#5C4033", name: "Sediment" },
  { depth: 240, color: "#4A3728", name: "Ancient Ground" },
  { depth: 320, color: "#3D2E21", name: "Bedrock" },
];

const ARTIFACT_TYPES = [
  { type: "fossil" as const, color: "#E8DCC4", secondaryColor: "#C9B896", rarity: 0.15 },
  { type: "coin" as const, color: "#FFD700", secondaryColor: "#B8860B", rarity: 0.2 },
  { type: "gem" as const, color: "#E31C79", secondaryColor: "#9B1B5A", rarity: 0.1 },
  { type: "pottery" as const, color: "#CD853F", secondaryColor: "#8B4513", rarity: 0.2 },
  { type: "bone" as const, color: "#F5F5DC", secondaryColor: "#D4C4A8", rarity: 0.15 },
  { type: "ring" as const, color: "#C0C0C0", secondaryColor: "#808080", rarity: 0.08 },
  { type: "skull" as const, color: "#FFFAF0", secondaryColor: "#DDD5C0", rarity: 0.07 },
  { type: "arrowhead" as const, color: "#696969", secondaryColor: "#4A4A4A", rarity: 0.05 },
];

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirtCanvasRef = useRef<HTMLCanvasElement>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [isDigging, setIsDigging] = useState(false);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZE);
  const [totalDug, setTotalDug] = useState(0);
  const [currentLayer, setCurrentLayer] = useState("Topsoil");
  const dirtDataRef = useRef<Uint8ClampedArray | null>(null);

  const generateArtifacts = useCallback(() => {
    const newArtifacts: Artifact[] = [];
    const numArtifacts = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numArtifacts; i++) {
      const typeInfo = ARTIFACT_TYPES[Math.floor(Math.random() * ARTIFACT_TYPES.length)];
      const width = 20 + Math.floor(Math.random() * 30);
      const height = 20 + Math.floor(Math.random() * 30);
      
      newArtifacts.push({
        x: 20 + Math.floor(Math.random() * (CANVAS_WIDTH - width - 40)),
        y: 40 + Math.floor(Math.random() * (CANVAS_HEIGHT - height - 60)),
        width,
        height,
        type: typeInfo.type,
        color: typeInfo.color,
        secondaryColor: typeInfo.secondaryColor,
        discovered: false,
        revealPercentage: 0,
      });
    }

    return newArtifacts;
  }, []);

  const drawArtifact = useCallback((ctx: CanvasRenderingContext2D, artifact: Artifact) => {
    const { x, y, width, height, type, color, secondaryColor } = artifact;

    ctx.fillStyle = color;
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;

    switch (type) {
      case "fossil":
        // Spiral fossil
        ctx.beginPath();
        for (let i = 0; i < 720; i++) {
          const angle = (i * Math.PI) / 180;
          const radius = (i / 720) * Math.min(width, height) / 2;
          const px = x + width / 2 + Math.cos(angle) * radius;
          const py = y + height / 2 + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;

      case "coin":
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = secondaryColor;
        ctx.font = `${Math.min(width, height) / 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", x + width / 2, y + height / 2);
        break;

      case "gem":
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height / 3);
        ctx.lineTo(x + width * 0.8, y + height);
        ctx.lineTo(x + width * 0.2, y + height);
        ctx.lineTo(x, y + height / 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case "pottery":
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y);
        ctx.quadraticCurveTo(x, y + height * 0.3, x + width * 0.2, y + height);
        ctx.lineTo(x + width * 0.8, y + height);
        ctx.quadraticCurveTo(x + width, y + height * 0.3, x + width * 0.7, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case "bone":
        ctx.fillRect(x + width * 0.3, y + height * 0.2, width * 0.4, height * 0.6);
        ctx.beginPath();
        ctx.arc(x + width * 0.3, y + height * 0.2, width * 0.15, 0, Math.PI * 2);
        ctx.arc(x + width * 0.7, y + height * 0.2, width * 0.15, 0, Math.PI * 2);
        ctx.arc(x + width * 0.3, y + height * 0.8, width * 0.15, 0, Math.PI * 2);
        ctx.arc(x + width * 0.7, y + height * 0.8, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "ring":
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#E31C79";
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "skull":
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height * 0.4, width / 2, height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(x + width * 0.35, y + height * 0.35, 4, 0, Math.PI * 2);
        ctx.arc(x + width * 0.65, y + height * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4, y + height * 0.6);
        ctx.lineTo(x + width * 0.6, y + height * 0.6);
        ctx.stroke();
        break;

      case "arrowhead":
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height * 0.7);
        ctx.lineTo(x + width / 2, y + height * 0.5);
        ctx.lineTo(x, y + height * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(x + width * 0.4, y + height * 0.5, width * 0.2, height * 0.5);
        break;
    }
  }, []);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const dirtCanvas = dirtCanvasRef.current;
    if (!canvas || !dirtCanvas) return;

    const ctx = canvas.getContext("2d");
    const dirtCtx = dirtCanvas.getContext("2d");
    if (!ctx || !dirtCtx) return;

    // Generate new artifacts
    const newArtifacts = generateArtifacts();
    setArtifacts(newArtifacts);
    setDiscovered([]);
    setTotalDug(0);
    setCurrentLayer("Topsoil");

    // Draw artifacts on main canvas
    ctx.fillStyle = "#2D1F14";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    newArtifacts.forEach((artifact) => {
      drawArtifact(ctx, artifact);
    });

    // Draw dirt layers on dirt canvas
    LAYERS.forEach((layer, index) => {
      const nextDepth = LAYERS[index + 1]?.depth || CANVAS_HEIGHT;
      const gradient = dirtCtx.createLinearGradient(0, layer.depth, 0, nextDepth);
      gradient.addColorStop(0, layer.color);
      gradient.addColorStop(1, LAYERS[index + 1]?.color || layer.color);
      dirtCtx.fillStyle = gradient;
      dirtCtx.fillRect(0, layer.depth, CANVAS_WIDTH, nextDepth - layer.depth);
    });

    // Add some texture
    for (let i = 0; i < 2000; i++) {
      const px = Math.random() * CANVAS_WIDTH;
      const py = Math.random() * CANVAS_HEIGHT;
      dirtCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
      dirtCtx.fillRect(px, py, 2, 2);
    }

    // Add some rocks
    for (let i = 0; i < 50; i++) {
      const px = Math.random() * CANVAS_WIDTH;
      const py = Math.random() * CANVAS_HEIGHT;
      const size = 2 + Math.random() * 6;
      dirtCtx.fillStyle = `rgba(100,80,60,${0.3 + Math.random() * 0.4})`;
      dirtCtx.beginPath();
      dirtCtx.arc(px, py, size, 0, Math.PI * 2);
      dirtCtx.fill();
    }

    // Store dirt data
    const imageData = dirtCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    dirtDataRef.current = imageData.data;
  }, [generateArtifacts, drawArtifact]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  const dig = useCallback((clientX: number, clientY: number) => {
    const dirtCanvas = dirtCanvasRef.current;
    if (!dirtCanvas || !dirtDataRef.current) return;

    const rect = dirtCanvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    const dirtCtx = dirtCanvas.getContext("2d");
    if (!dirtCtx) return;

    // Clear circular area
    dirtCtx.globalCompositeOperation = "destination-out";
    dirtCtx.beginPath();
    dirtCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    dirtCtx.fill();
    dirtCtx.globalCompositeOperation = "source-over";

    // Count dug pixels
    setTotalDug((prev) => prev + Math.PI * brushSize * brushSize);

    // Update current layer based on depth
    const layer = LAYERS.reduce((acc, l) => (y >= l.depth ? l : acc), LAYERS[0]);
    setCurrentLayer(layer.name);

    // Check for artifact discovery
    setArtifacts((prevArtifacts) => {
      const newArtifacts = [...prevArtifacts];
      newArtifacts.forEach((artifact) => {
        if (!artifact.discovered) {
          const centerX = artifact.x + artifact.width / 2;
          const centerY = artifact.y + artifact.height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distance < brushSize + Math.max(artifact.width, artifact.height) / 2) {
            artifact.revealPercentage += 5;
            if (artifact.revealPercentage >= 30 && !artifact.discovered) {
              artifact.discovered = true;
              setDiscovered((prev) => {
                if (!prev.includes(artifact.type)) {
                  return [...prev, artifact.type];
                }
                return prev;
              });
            }
          }
        }
      });
      return newArtifacts;
    });
  }, [brushSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    dig(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDigging) {
      dig(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDigging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDigging(true);
    const touch = e.touches[0];
    dig(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDigging && e.touches[0]) {
      dig(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDigging(false);
  };

  const getArtifactEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      fossil: "🦴",
      coin: "🪙",
      gem: "💎",
      pottery: "🏺",
      bone: "🦴",
      ring: "💍",
      skull: "💀",
      arrowhead: "🏹",
    };
    return emojis[type] || "❓";
  };

  const getArtifactName = (type: string) => {
    const names: Record<string, string> = {
      fossil: "Ancient Fossil",
      coin: "Lost Coin",
      gem: "Precious Gem",
      pottery: "Clay Pottery",
      bone: "Old Bone",
      ring: "Mystery Ring",
      skull: "Ancient Skull",
      arrowhead: "Stone Arrowhead",
    };
    return names[type] || "Unknown";
  };

  const completionPercentage = Math.min(100, Math.round((totalDug / (CANVAS_WIDTH * CANVAS_HEIGHT)) * 100));

  return (
    <FeatureWrapper day={384} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <p 
          className="text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          Brush away the ancient soil to uncover hidden treasures! Click and drag to dig. 
          What secrets lie beneath? 🔍
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col gap-3">
            <div 
              className="relative rounded-lg overflow-hidden shadow-xl"
              style={{ 
                border: "4px solid var(--color-border)",
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT 
              }}
            >
              {/* Artifact layer */}
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute inset-0"
                style={{ imageRendering: "pixelated" }}
              />
              {/* Dirt layer */}
              <canvas
                ref={dirtCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute inset-0 cursor-crosshair"
                style={{ imageRendering: "pixelated" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--color-text-dim)" }} className="text-sm">
                  Brush:
                </span>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
                <span 
                  className="text-sm font-mono"
                  style={{ color: "var(--color-text)" }}
                >
                  {brushSize}px
                </span>
              </div>
              <button
                onClick={initializeCanvas}
                className="btn-secondary text-sm px-3 py-1"
              >
                🗺️ New Site
              </button>
            </div>
          </div>

          <div 
            className="flex flex-col gap-4 p-4 rounded-lg min-w-48"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div>
              <h3 
                className="text-lg font-bold mb-2"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
              >
                Dig Status
              </h3>
              <div className="flex flex-col gap-1 text-sm">
                <div style={{ color: "var(--color-text-dim)" }}>
                  Current Layer: <span style={{ color: "var(--color-accent)" }}>{currentLayer}</span>
                </div>
                <div style={{ color: "var(--color-text-dim)" }}>
                  Excavated: <span style={{ color: "var(--color-accent)" }}>{completionPercentage}%</span>
                </div>
                <div 
                  className="w-full h-2 rounded-full mt-1 overflow-hidden"
                  style={{ backgroundColor: "var(--color-border)" }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${completionPercentage}%`,
                      backgroundColor: "var(--color-accent)"
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 
                className="text-lg font-bold mb-2"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
              >
                Discoveries ({discovered.length}/{artifacts.length})
              </h3>
              {discovered.length === 0 ? (
                <p 
                  className="text-sm italic"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Keep digging to find treasures...
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {discovered.map((type, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 text-sm p-1 rounded animate-pulse"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <span>{getArtifactEmoji(type)}</span>
                      <span style={{ color: "var(--color-text)" }}>
                        {getArtifactName(type)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {discovered.length === artifacts.length && artifacts.length > 0 && (
              <div 
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              >
                <div className="text-2xl mb-1">🎉</div>
                <div className="font-bold">Site Complete!</div>
                <div className="text-sm opacity-90">
                  All {artifacts.length} artifacts found!
                </div>
              </div>
            )}
          </div>
        </div>

        <div 
          className="text-center text-sm max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 <strong>Pro tip:</strong> Adjust your brush size for precision digging. 
          Larger brushes clear faster, smaller ones give more control around delicate finds!
        </div>
      </div>
    </FeatureWrapper>
  );
}