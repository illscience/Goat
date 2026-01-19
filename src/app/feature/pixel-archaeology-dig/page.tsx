"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  type: string;
  emoji: string;
  name: string;
  description: string;
  layer: number;
  discovered: boolean;
}

interface Layer {
  name: string;
  color: string;
  depth: number;
  artifacts: string[];
}

const LAYERS: Layer[] = [
  { name: "Topsoil", color: "#5D4037", depth: 0, artifacts: ["coin", "button", "key"] },
  { name: "Clay", color: "#8D6E63", depth: 20, artifacts: ["pottery", "bead", "arrowhead"] },
  { name: "Sediment", color: "#795548", depth: 40, artifacts: ["bone", "tooth", "shell"] },
  { name: "Bedrock", color: "#6D4C41", depth: 60, artifacts: ["fossil", "crystal", "ancient_coin"] },
  { name: "Deep Earth", color: "#4E342E", depth: 80, artifacts: ["skull", "idol", "tablet"] },
];

const ARTIFACT_DATA: Record<string, { emoji: string; name: string; descriptions: string[] }> = {
  coin: { emoji: "🪙", name: "Modern Coin", descriptions: ["A penny from 1987", "A mysterious foreign coin", "A bent quarter"] },
  button: { emoji: "🔘", name: "Old Button", descriptions: ["From a Victorian coat", "Military insignia", "Pearl button"] },
  key: { emoji: "🗝️", name: "Rusty Key", descriptions: ["Opens what lock?", "Ornate skeleton key", "Tiny diary key"] },
  pottery: { emoji: "🏺", name: "Pottery Shard", descriptions: ["Hand-painted clay", "Part of an amphora", "Ancient cooking pot"] },
  bead: { emoji: "📿", name: "Trade Bead", descriptions: ["Glass from Venice", "Amber bead", "Carved bone bead"] },
  arrowhead: { emoji: "🔺", name: "Arrowhead", descriptions: ["Obsidian blade", "Flint arrowhead", "Copper point"] },
  bone: { emoji: "🦴", name: "Animal Bone", descriptions: ["Ancient deer bone", "Worked bone tool", "Mystery creature"] },
  tooth: { emoji: "🦷", name: "Fossil Tooth", descriptions: ["Megalodon tooth!", "Saber-tooth fang", "Ancient horse molar"] },
  shell: { emoji: "🐚", name: "Ancient Shell", descriptions: ["Petrified ammonite", "Trade shell currency", "Carved ornament"] },
  fossil: { emoji: "🪸", name: "Rare Fossil", descriptions: ["Trilobite!", "Fern impression", "Fish skeleton"] },
  crystal: { emoji: "💎", name: "Crystal Formation", descriptions: ["Amethyst geode", "Quartz cluster", "Citrine shard"] },
  ancient_coin: { emoji: "🎖️", name: "Ancient Coin", descriptions: ["Roman denarius", "Greek drachma", "Mystery empire"] },
  skull: { emoji: "💀", name: "Ancient Skull", descriptions: ["Neanderthal?!", "Ceremonial skull", "Unknown species"] },
  idol: { emoji: "🗿", name: "Stone Idol", descriptions: ["Fertility goddess", "Guardian spirit", "Alien artifact?"] },
  tablet: { emoji: "📜", name: "Clay Tablet", descriptions: ["Cuneiform writing", "Recipe for beer!", "Royal decree"] },
};

const GRID_SIZE = 40;
const CELL_SIZE = 12;

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [discovered, setDiscovered] = useState<Artifact[]>([]);
  const [digging, setDigging] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [digCount, setDigCount] = useState(0);
  const [siteName, setSiteName] = useState("");
  const frameRef = useRef<number>(0);

  const siteNames = [
    "Lost Valley of Mysteries",
    "The Forgotten Temple Grounds",
    "Ancient Riverbed Site",
    "The Buried City of Azar",
    "Prehistoric Lake Shore",
    "The Merchant's Grave",
    "Sacred Burial Mounds",
    "The Sunken Village",
  ];

  const generateSite = useCallback(() => {
    const newGrid: number[][] = [];
    const newArtifacts: Artifact[] = [];

    // Initialize grid with full dirt
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(100); // 100 = fully covered
      }
      newGrid.push(row);
    }

    // Generate artifacts
    const artifactCount = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < artifactCount; i++) {
      const layer = LAYERS[Math.floor(Math.random() * LAYERS.length)];
      const artifactType = layer.artifacts[Math.floor(Math.random() * layer.artifacts.length)];
      const data = ARTIFACT_DATA[artifactType];

      const y = layer.depth + Math.floor(Math.random() * 18);
      const x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;

      if (y < GRID_SIZE && !newArtifacts.some(a => Math.abs(a.x - x) < 3 && Math.abs(a.y - y) < 3)) {
        newArtifacts.push({
          x,
          y,
          type: artifactType,
          emoji: data.emoji,
          name: data.name,
          description: data.descriptions[Math.floor(Math.random() * data.descriptions.length)],
          layer: LAYERS.indexOf(layer),
          discovered: false,
        });
      }
    }

    setGrid(newGrid);
    setArtifacts(newArtifacts);
    setDiscovered([]);
    setSelectedArtifact(null);
    setDigCount(0);
    setSiteName(siteNames[Math.floor(Math.random() * siteNames.length)]);
  }, []);

  useEffect(() => {
    generateSite();
  }, [generateSite]);

  const getLayerColor = (y: number) => {
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      if (y >= LAYERS[i].depth) {
        return LAYERS[i].color;
      }
    }
    return LAYERS[0].color;
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const coverage = grid[y]?.[x] ?? 100;
        const baseColor = getLayerColor(y);

        if (coverage > 0) {
          const brightness = 0.7 + (coverage / 100) * 0.3;
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = coverage / 100;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.globalAlpha = 1;
        }

        // Draw excavated area background
        if (coverage < 100) {
          ctx.fillStyle = "#2d2d2d";
          ctx.globalAlpha = 1 - coverage / 100;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw artifacts
    artifacts.forEach(artifact => {
      const coverage = grid[artifact.y]?.[artifact.x] ?? 100;
      if (coverage < 50) {
        ctx.font = `${CELL_SIZE}px serif`;
        ctx.globalAlpha = 1 - coverage / 50;
        ctx.fillText(artifact.emoji, artifact.x * CELL_SIZE, (artifact.y + 1) * CELL_SIZE - 1);
        ctx.globalAlpha = 1;
      }
    });

    // Draw grid lines (subtle)
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, [grid, artifacts]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(renderCanvas);
    return () => cancelAnimationFrame(frameRef.current);
  }, [renderCanvas]);

  const dig = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const brushSize = 2;
    const newGrid = [...grid.map(row => [...row])];
    let dug = false;

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= brushSize) {
            const digAmount = Math.max(15, 30 - dist * 10);
            if (newGrid[ny][nx] > 0) {
              newGrid[ny][nx] = Math.max(0, newGrid[ny][nx] - digAmount);
              dug = true;
            }
          }
        }
      }
    }

    if (dug) {
      setDigCount(prev => prev + 1);
      setGrid(newGrid);

      // Check for artifact discovery
      artifacts.forEach(artifact => {
        if (!artifact.discovered && newGrid[artifact.y][artifact.x] < 20) {
          artifact.discovered = true;
          setDiscovered(prev => [...prev, artifact]);
          setSelectedArtifact(artifact);
        }
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDigging(true);
    dig(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (digging) {
      dig(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setDigging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setDigging(true);
    const touch = e.touches[0];
    dig(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (digging) {
      const touch = e.touches[0];
      dig(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setDigging(false);
  };

  const totalArtifacts = artifacts.length;
  const foundCount = discovered.length;
  const progress = totalArtifacts > 0 ? Math.round((foundCount / totalArtifacts) * 100) : 0;

  return (
    <FeatureWrapper day={415} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-4 p-4 max-w-3xl mx-auto">
        <div className="text-center mb-2">
          <h2 
            className="text-2xl mb-1"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🏺 {siteName} 🏺
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click and drag to excavate. Uncover the secrets of an ancient civilization!
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center text-sm mb-2">
          <div 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            ⛏️ Digs: {digCount}
          </div>
          <div 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            🎁 Found: {foundCount}/{totalArtifacts}
          </div>
          <div 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            📊 {progress}% Complete
          </div>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden shadow-lg"
          style={{ border: "4px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          
          {/* Layer indicator */}
          <div className="absolute right-0 top-0 h-full w-6 flex flex-col">
            {LAYERS.map((layer, i) => (
              <div
                key={layer.name}
                className="flex-1 flex items-center justify-center text-xs"
                style={{ 
                  backgroundColor: layer.color,
                  writingMode: "vertical-rl",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "8px"
                }}
                title={layer.name}
              >
                {layer.name}
              </div>
            ))}
          </div>
        </div>

        {selectedArtifact && (
          <div 
            className="p-4 rounded-lg text-center animate-pulse max-w-sm"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)", 
              border: "2px solid var(--color-accent)" 
            }}
          >
            <div className="text-4xl mb-2">{selectedArtifact.emoji}</div>
            <div className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
              {selectedArtifact.name} Discovered!
            </div>
            <div className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
              "{selectedArtifact.description}"
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
              Found in {LAYERS[selectedArtifact.layer].name} layer
            </div>
          </div>
        )}

        {discovered.length > 0 && (
          <div className="w-full max-w-md">
            <h3 
              className="text-lg mb-2 text-center"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              📋 Field Notes
            </h3>
            <div 
              className="flex flex-wrap gap-2 justify-center p-3 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              {discovered.map((artifact, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedArtifact(artifact)}
                  className="text-2xl hover:scale-125 transition-transform cursor-pointer p-1 rounded"
                  title={`${artifact.name}: ${artifact.description}`}
                  style={{ 
                    backgroundColor: selectedArtifact === artifact ? "var(--color-accent)" : "transparent"
                  }}
                >
                  {artifact.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={generateSite}
          className="btn-primary px-6 py-2 rounded-lg font-bold"
        >
          🗺️ New Dig Site
        </button>

        {foundCount === totalArtifacts && totalArtifacts > 0 && (
          <div 
            className="text-center p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            <div className="text-2xl mb-2">🎉 Site Fully Excavated! 🎉</div>
            <div className="text-sm">
              You've uncovered all {totalArtifacts} artifacts at {siteName}!
            </div>
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}