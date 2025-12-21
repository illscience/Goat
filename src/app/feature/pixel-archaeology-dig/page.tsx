"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  removed: boolean;
  layer: number;
}

interface Artifact {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
  discovered: boolean;
  backstory: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
}

const GRID_SIZE = 40;
const PARTICLE_SIZE = 12;
const LAYERS = 5;

const ARTIFACT_TYPES = [
  { name: "Ancient Floppy Disk", emoji: "💾", rarity: "common" as const, backstories: [
    "Contains the lost source code of 'Pong 2: Electric Boogaloo'",
    "Labeled 'TAXES_1987_FINAL_FINAL_v3' in faded marker",
    "The last save file of a civilization that forgot Ctrl+S"
  ]},
  { name: "Retro Game Cartridge", emoji: "🎮", rarity: "uncommon" as const, backstories: [
    "A prototype of 'Super Plumber Sisters' - never released",
    "Contains a cheat code that grants infinite pizza",
    "The cartridge that caused the Great Console War of '94"
  ]},
  { name: "Mysterious USB Drive", emoji: "🔌", rarity: "uncommon" as const, backstories: [
    "Encrypted with a password hint: 'password123'",
    "Contains 47 nested folders all named 'New Folder'",
    "The last USB that wasn't plugged in wrong the first time"
  ]},
  { name: "Glowing Crystal Chip", emoji: "💎", rarity: "rare" as const, backstories: [
    "Hums with the frequency of dial-up internet",
    "Contains the consciousness of a helpful paperclip assistant",
    "The legendary 'Any Key' that users could never find"
  ]},
  { name: "Ancient CD-ROM", emoji: "💿", rarity: "common" as const, backstories: [
    "AOL Trial Disk #4,782,943 - 5000 free hours!",
    "A Encarta encyclopedia from when Wikipedia was just a dream",
    "Contains a screensaver that captivated millions"
  ]},
  { name: "Pixel Fossil", emoji: "🦴", rarity: "rare" as const, backstories: [
    "The preserved remains of a Tamagotchi that was fed regularly",
    "A sprite from the Before Times, when 16 colors was enough",
    "The skeleton of the last pixel that rendered in Flash"
  ]},
  { name: "Quantum Memory Core", emoji: "🔮", rarity: "legendary" as const, backstories: [
    "Contains the meaning of life: 42 (and a half)",
    "The backup drive of the Matrix's Matrix",
    "Stores the dreams of sleeping AIs from the Digital Renaissance"
  ]},
  { name: "Vintage Mouse", emoji: "🖱️", rarity: "common" as const, backstories: [
    "Still has the crusty ball inside that needed cleaning",
    "Clicked 10 million times on 'I Accept Terms & Conditions'",
    "The pointer that discovered the first Easter egg"
  ]},
];

const RARITY_COLORS = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  legendary: "text-yellow-400"
};

const LAYER_COLORS = [
  "#8B7355", // Surface - light brown
  "#6B4423", // Layer 2 - medium brown
  "#4A3728", // Layer 3 - dark brown
  "#2D1F1A", // Layer 4 - very dark
  "#1A1210", // Deepest layer
];

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [digCount, setDigCount] = useState(0);
  const [brushSize, setBrushSize] = useState(2);
  const frameRef = useRef<number>(0);

  const initializeGrid = useCallback(() => {
    const newParticles: Particle[] = [];
    const newArtifacts: Artifact[] = [];

    // Create particles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const layer = Math.floor(y / (GRID_SIZE / LAYERS));
        newParticles.push({
          x,
          y,
          removed: false,
          layer: Math.min(layer, LAYERS - 1)
        });
      }
    }

    // Place artifacts at random positions
    const numArtifacts = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numArtifacts; i++) {
      const type = ARTIFACT_TYPES[Math.floor(Math.random() * ARTIFACT_TYPES.length)];
      const layer = type.rarity === "legendary" ? LAYERS - 1 : 
                    type.rarity === "rare" ? Math.floor(LAYERS * 0.6 + Math.random() * LAYERS * 0.4) :
                    type.rarity === "uncommon" ? Math.floor(LAYERS * 0.3 + Math.random() * LAYERS * 0.5) :
                    Math.floor(Math.random() * LAYERS * 0.7);
      
      const minY = Math.floor((layer / LAYERS) * GRID_SIZE);
      const maxY = Math.floor(((layer + 1) / LAYERS) * GRID_SIZE) - 3;
      
      newArtifacts.push({
        id: `artifact-${i}`,
        name: type.name,
        emoji: type.emoji,
        x: 2 + Math.floor(Math.random() * (GRID_SIZE - 6)),
        y: minY + Math.floor(Math.random() * (maxY - minY)),
        width: 2 + Math.floor(Math.random() * 2),
        height: 2 + Math.floor(Math.random() * 2),
        layer,
        discovered: false,
        backstory: type.backstories[Math.floor(Math.random() * type.backstories.length)],
        rarity: type.rarity
      });
    }

    setParticles(newParticles);
    setArtifacts(newArtifacts);
    setDiscoveredArtifacts([]);
    setSelectedArtifact(null);
    setDigCount(0);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#0a0806";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach(particle => {
        if (!particle.removed) {
          ctx.fillStyle = LAYER_COLORS[particle.layer];
          ctx.fillRect(
            particle.x * PARTICLE_SIZE,
            particle.y * PARTICLE_SIZE,
            PARTICLE_SIZE - 1,
            PARTICLE_SIZE - 1
          );
        }
      });

      // Draw artifacts
      artifacts.forEach(artifact => {
        // Check if any particle above artifact is removed to show it
        const isVisible = particles.some(p => 
          p.removed &&
          p.x >= artifact.x && p.x < artifact.x + artifact.width &&
          p.y >= artifact.y && p.y < artifact.y + artifact.height
        );

        if (isVisible) {
          const glow = artifact.rarity === "legendary" ? 20 : 
                       artifact.rarity === "rare" ? 12 : 
                       artifact.rarity === "uncommon" ? 6 : 0;
          
          if (glow > 0) {
            ctx.shadowColor = artifact.rarity === "legendary" ? "#FFD700" :
                             artifact.rarity === "rare" ? "#4169E1" : "#32CD32";
            ctx.shadowBlur = glow;
          }

          ctx.font = `${PARTICLE_SIZE * Math.min(artifact.width, artifact.height)}px serif`;
          ctx.fillText(
            artifact.emoji,
            artifact.x * PARTICLE_SIZE,
            (artifact.y + artifact.height) * PARTICLE_SIZE
          );

          ctx.shadowBlur = 0;
        }
      });

      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [particles, artifacts]);

  const handleDig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = Math.floor(((e.clientX - rect.left) * scaleX) / PARTICLE_SIZE);
    const clickY = Math.floor(((e.clientY - rect.top) * scaleY) / PARTICLE_SIZE);

    let digsThisClick = 0;

    setParticles(prev => {
      const newParticles = [...prev];
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        for (let dy = -brushSize; dy <= brushSize; dy++) {
          if (dx * dx + dy * dy <= brushSize * brushSize) {
            const x = clickX + dx;
            const y = clickY + dy;
            const idx = y * GRID_SIZE + x;
            if (idx >= 0 && idx < newParticles.length && !newParticles[idx].removed) {
              newParticles[idx] = { ...newParticles[idx], removed: true };
              digsThisClick++;
            }
          }
        }
      }
      return newParticles;
    });

    setDigCount(prev => prev + digsThisClick);

    // Check for newly discovered artifacts
    artifacts.forEach(artifact => {
      if (artifact.discovered) return;

      const totalPixels = artifact.width * artifact.height;
      let visiblePixels = 0;

      particles.forEach(p => {
        if (p.removed &&
            p.x >= artifact.x && p.x < artifact.x + artifact.width &&
            p.y >= artifact.y && p.y < artifact.y + artifact.height) {
          visiblePixels++;
        }
      });

      // Check current click area too
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        for (let dy = -brushSize; dy <= brushSize; dy++) {
          if (dx * dx + dy * dy <= brushSize * brushSize) {
            const x = clickX + dx;
            const y = clickY + dy;
            if (x >= artifact.x && x < artifact.x + artifact.width &&
                y >= artifact.y && y < artifact.y + artifact.height) {
              visiblePixels++;
            }
          }
        }
      }

      if (visiblePixels >= totalPixels * 0.5) {
        setArtifacts(prev => prev.map(a => 
          a.id === artifact.id ? { ...a, discovered: true } : a
        ));
        setDiscoveredArtifacts(prev => [...prev, { ...artifact, discovered: true }]);
      }
    });
  };

  return (
    <FeatureWrapper day={386} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        <p className="text-center" style={{ color: "var(--color-text-dim)" }}>
          Click to dig through ancient digital soil! Uncover relics from the Lost Silicon Age 🏺
        </p>

        <div className="flex gap-4 items-center flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-dim)" }}>Brush:</span>
            {[1, 2, 3].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`px-3 py-1 rounded transition-all ${
                  brushSize === size 
                    ? "bg-amber-600 text-white" 
                    : "bg-amber-900/30 hover:bg-amber-800/50"
                }`}
              >
                {size === 1 ? "🔬" : size === 2 ? "🔧" : "⛏️"}
              </button>
            ))}
          </div>
          
          <div className="px-3 py-1 rounded" style={{ background: "var(--color-bg-secondary)" }}>
            <span style={{ color: "var(--color-text-dim)" }}>Digs: </span>
            <span className="text-amber-400 font-bold">{digCount}</span>
          </div>

          <button
            onClick={initializeGrid}
            className="btn-secondary"
          >
            🔄 New Dig Site
          </button>
        </div>

        <div className="flex gap-6 flex-wrap justify-center items-start">
          <div 
            className="border-4 border-amber-900 rounded-lg overflow-hidden shadow-2xl"
            style={{ background: "#0a0806" }}
          >
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * PARTICLE_SIZE}
              height={GRID_SIZE * PARTICLE_SIZE}
              onClick={handleDig}
              className="cursor-crosshair"
              style={{ 
                width: `${Math.min(480, GRID_SIZE * PARTICLE_SIZE)}px`,
                height: `${Math.min(480, GRID_SIZE * PARTICLE_SIZE)}px`
              }}
            />
          </div>

          <div 
            className="p-4 rounded-lg min-w-64"
            style={{ 
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)"
            }}
          >
            <h3 
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              📜 Discovered Relics ({discoveredArtifacts.length}/{artifacts.length})
            </h3>
            
            {discoveredArtifacts.length === 0 ? (
              <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
                Keep digging to find ancient artifacts...
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {discoveredArtifacts.map(artifact => (
                  <button
                    key={artifact.id}
                    onClick={() => setSelectedArtifact(artifact)}
                    className={`p-2 rounded text-left transition-all hover:scale-105 ${
                      selectedArtifact?.id === artifact.id 
                        ? "ring-2 ring-amber-400" 
                        : ""
                    }`}
                    style={{ background: "var(--color-bg)" }}
                  >
                    <span className="text-xl mr-2">{artifact.emoji}</span>
                    <span className={RARITY_COLORS[artifact.rarity]}>
                      {artifact.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedArtifact && (
          <div 
            className="p-4 rounded-lg max-w-md animate-pulse"
            style={{ 
              background: "var(--color-bg-secondary)",
              border: `2px solid ${
                selectedArtifact.rarity === "legendary" ? "#FFD700" :
                selectedArtifact.rarity === "rare" ? "#4169E1" :
                selectedArtifact.rarity === "uncommon" ? "#32CD32" : "#888"
              }`
            }}
          >
            <div className="text-center mb-2">
              <span className="text-4xl">{selectedArtifact.emoji}</span>
            </div>
            <h4 
              className={`text-lg font-bold text-center ${RARITY_COLORS[selectedArtifact.rarity]}`}
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {selectedArtifact.name}
            </h4>
            <p className="text-xs text-center mb-2 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
              {selectedArtifact.rarity} artifact • Layer {selectedArtifact.layer + 1}
            </p>
            <p className="text-sm italic text-center" style={{ color: "var(--color-text)" }}>
              "{selectedArtifact.backstory}"
            </p>
          </div>
        )}

        <div className="flex gap-4 text-xs flex-wrap justify-center" style={{ color: "var(--color-text-dim)" }}>
          <span><span className="text-gray-400">●</span> Common</span>
          <span><span className="text-green-400">●</span> Uncommon</span>
          <span><span className="text-blue-400">●</span> Rare</span>
          <span><span className="text-yellow-400">●</span> Legendary</span>
        </div>
      </div>
    </FeatureWrapper>
  );
}