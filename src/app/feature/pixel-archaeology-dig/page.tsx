"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "fossil" | "treasure" | "structure" | "pottery" | "coin" | "gem";
  color: string;
  pattern: number[][];
}

interface DigSite {
  name: string;
  era: string;
  artifacts: Artifact[];
  dirtColor: string;
  baseColor: string;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const BRUSH_SIZE = 15;

const ARTIFACT_PATTERNS: Record<string, { color: string; patterns: number[][] }> = {
  fossil: {
    color: "#E8DCC4",
    patterns: [
      [0,1,1,1,0],
      [1,1,0,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
  },
  treasure: {
    color: "#FFD700",
    patterns: [
      [0,1,1,1,0],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
    ],
  },
  structure: {
    color: "#8B7355",
    patterns: [
      [1,0,1,0,1],
      [1,1,1,1,1],
      [1,0,1,0,1],
      [1,1,1,1,1],
      [1,0,1,0,1],
    ],
  },
  pottery: {
    color: "#CD853F",
    patterns: [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,0,1,0,0],
    ],
  },
  coin: {
    color: "#C0C0C0",
    patterns: [
      [0,1,1,0],
      [1,1,1,1],
      [1,1,1,1],
      [0,1,1,0],
    ],
  },
  gem: {
    color: "#9932CC",
    patterns: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
    ],
  },
};

const SITE_NAMES = [
  { name: "Forgotten Temple of Xolotl", era: "1200 BCE" },
  { name: "Viking Burial Ground", era: "800 CE" },
  { name: "Roman Villa Ruins", era: "200 CE" },
  { name: "Dinosaur Bone Bed", era: "65 Million BCE" },
  { name: "Pirate Shipwreck Cache", era: "1720 CE" },
  { name: "Ancient Egyptian Tomb", era: "2500 BCE" },
];

const DIRT_COLORS = ["#8B4513", "#654321", "#5C4033", "#6B4423", "#7B5544"];
const BASE_COLORS = ["#D2B48C", "#C4A76C", "#DEB887", "#F5DEB3", "#E8D4B0"];

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dirtLayer, setDirtLayer] = useState<boolean[][]>([]);
  const [site, setSite] = useState<DigSite | null>(null);
  const [revealedArtifacts, setRevealedArtifacts] = useState<Set<number>>(new Set());
  const [totalDirt, setTotalDirt] = useState(0);
  const [clearedDirt, setClearedDirt] = useState(0);
  const [isDigging, setIsDigging] = useState(false);
  const dirtLayerRef = useRef<boolean[][]>([]);

  // Keep dirtLayerRef in sync with dirtLayer state
  useEffect(() => {
    dirtLayerRef.current = dirtLayer;
  }, [dirtLayer]);

  const generateSite = useCallback((): DigSite => {
    const siteInfo = SITE_NAMES[Math.floor(Math.random() * SITE_NAMES.length)];
    const artifacts: Artifact[] = [];
    const numArtifacts = 4 + Math.floor(Math.random() * 5);
    const types: (keyof typeof ARTIFACT_PATTERNS)[] = ["fossil", "treasure", "structure", "pottery", "coin", "gem"];

    for (let i = 0; i < numArtifacts; i++) {
      const type = types[Math.floor(Math.random() * types.length)] as Artifact["type"];
      const patternData = ARTIFACT_PATTERNS[type];
      if (!patternData) continue;
      const scale = 4 + Math.floor(Math.random() * 4);
      const patternWidth = patternData.patterns[0]?.length ?? 1;
      const width = patternWidth * scale;
      const height = patternData.patterns.length * scale;
      
      let x: number, y: number, overlaps: boolean;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * (CANVAS_WIDTH - width - 40)) + 20;
        y = Math.floor(Math.random() * (CANVAS_HEIGHT - height - 40)) + 20;
        overlaps = artifacts.some(a => 
          x < a.x + a.width + 10 && x + width + 10 > a.x &&
          y < a.y + a.height + 10 && y + height + 10 > a.y
        );
        attempts++;
      } while (overlaps && attempts < 50);

      if (attempts < 50) {
        artifacts.push({
          x,
          y,
          width,
          height,
          type,
          color: patternData.color,
          pattern: patternData.patterns,
        });
      }
    }

    return {
      name: siteInfo?.name ?? "Unknown Site",
      era: siteInfo?.era ?? "Unknown Era",
      artifacts,
      dirtColor: DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)] ?? "#8B4513",
      baseColor: BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)] ?? "#D2B48C",
    };
  }, []);

  const initializeDig = useCallback(() => {
    const newSite = generateSite();
    setSite(newSite);
    
    const newDirt: boolean[][] = [];
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      newDirt[y] = [];
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        if (newDirt[y]) {
          newDirt[y][x] = true;
        }
      }
    }
    setDirtLayer(newDirt);
    dirtLayerRef.current = newDirt;
    setTotalDirt(CANVAS_WIDTH * CANVAS_HEIGHT);
    setClearedDirt(0);
    setRevealedArtifacts(new Set());
  }, [generateSite]);

  useEffect(() => {
    initializeDig();
  }, [initializeDig]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !site) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentDirt = dirtLayerRef.current;

    // Draw base layer
    ctx.fillStyle = site.baseColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw artifacts
    site.artifacts.forEach((artifact) => {
      const patternWidth = artifact.pattern[0]?.length ?? 1;
      const scale = artifact.width / patternWidth;
      ctx.fillStyle = artifact.color;
      
      for (let py = 0; py < artifact.pattern.length; py++) {
        const row = artifact.pattern[py];
        if (!row) continue;
        for (let px = 0; px < row.length; px++) {
          if (row[px]) {
            ctx.fillRect(
              artifact.x + px * scale,
              artifact.y + py * scale,
              scale,
              scale
            );
          }
        }
      }

      // Add detail shading
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      for (let py = 0; py < artifact.pattern.length; py++) {
        const row = artifact.pattern[py];
        if (!row) continue;
        for (let px = 0; px < row.length; px++) {
          if (row[px]) {
            ctx.fillRect(
              artifact.x + px * scale + scale * 0.5,
              artifact.y + py * scale + scale * 0.5,
              scale * 0.5,
              scale * 0.5
            );
          }
        }
      }
    });

    // Draw dirt layer
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const row = currentDirt[y];
      if (!row) continue;
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        if (row[x]) {
          const noise = Math.random() * 20 - 10;
          const r = parseInt(site.dirtColor.slice(1, 3), 16) + noise;
          const g = parseInt(site.dirtColor.slice(3, 5), 16) + noise;
          const b = parseInt(site.dirtColor.slice(5, 7), 16) + noise;
          ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [site]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, dirtLayer]);

  const dig = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !site) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const centerX = Math.floor((clientX - rect.left) * scaleX);
    const centerY = Math.floor((clientY - rect.top) * scaleY);

    setDirtLayer((prev) => {
      const newDirt = prev.map((row) => [...row]);
      let cleared = 0;

      for (let dy = -BRUSH_SIZE; dy <= BRUSH_SIZE; dy++) {
        for (let dx = -BRUSH_SIZE; dx <= BRUSH_SIZE; dx++) {
          if (dx * dx + dy * dy <= BRUSH_SIZE * BRUSH_SIZE) {
            const x = centerX + dx;
            const y = centerY + dy;
            if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
              const row = newDirt[y];
              if (row && row[x]) {
                row[x] = false;
                cleared++;
              }
            }
          }
        }
      }

      if (cleared > 0) {
        setClearedDirt((prev) => prev + cleared);
      }

      // Update ref immediately for artifact detection
      dirtLayerRef.current = newDirt;

      return newDirt;
    });

    // Check for revealed artifacts
    const currentDirt = dirtLayerRef.current;
    site.artifacts.forEach((artifact, index) => {
      if (!revealedArtifacts.has(index)) {
        let artifactPixels = 0;
        let revealedPixels = 0;

        for (let py = 0; py < artifact.height; py++) {
          for (let px = 0; px < artifact.width; px++) {
            const x = artifact.x + px;
            const y = artifact.y + py;
            if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
              artifactPixels++;
              const row = currentDirt[y];
              if (row && !row[x]) {
                revealedPixels++;
              }
            }
          }
        }

        if (artifactPixels > 0 && revealedPixels / artifactPixels > 0.7) {
          setRevealedArtifacts((prev) => new Set([...prev, index]));
        }
      }
    });
  }, [site, revealedArtifacts]);

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
    if (touch) {
      dig(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDigging) {
      const touch = e.touches[0];
      if (touch) {
        dig(touch.clientX, touch.clientY);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDigging(false);
  };

  const progressPercent = totalDirt > 0 ? Math.floor((clearedDirt / totalDirt) * 100) : 0;

  const getArtifactEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      fossil: "🦴",
      treasure: "💰",
      structure: "🏛️",
      pottery: "🏺",
      coin: "🪙",
      gem: "💎",
    };
    return emojis[type] ?? "❓";
  };

  const artifactCount = site?.artifacts?.length ?? 0;

  return (
    <FeatureWrapper day={400} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <h2 
            className="text-2xl font-bold mb-2 font-serif text-stone-800 dark:text-stone-200"
          >
            {site?.name ?? "Loading..."}
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            Era: {site?.era ?? "Unknown"} • Brush away the dirt to uncover ancient secrets!
          </p>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden shadow-xl border-4 border-stone-400 dark:border-stone-600"
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="cursor-crosshair touch-none"
            style={{ width: "min(400px, 90vw)", height: "min(400px, 90vw)" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded text-sm font-bold bg-white/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-200"
          >
            {progressPercent}% cleared
          </div>
        </div>

        <div 
          className="w-full max-w-md h-3 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700"
        >
          <div 
            className="h-full transition-all duration-300 rounded-full bg-amber-600"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-stone-600 dark:text-stone-400">Discoveries:</span>
          {site?.artifacts?.map((artifact, index) => (
            <span
              key={index}
              className={`text-2xl transition-all duration-300 ${
                revealedArtifacts.has(index) 
                  ? "opacity-100 scale-100" 
                  : "opacity-30 scale-75 grayscale"
              }`}
              title={revealedArtifacts.has(index) ? artifact.type : "???"}
            >
              {getArtifactEmoji(artifact.type)}
            </span>
          )) ?? null}
        </div>

        {revealedArtifacts.size === artifactCount && artifactCount > 0 && (
          <div 
            className="p-4 rounded-lg text-center animate-pulse bg-amber-600 text-white"
          >
            🎉 Excavation Complete! All {artifactCount} artifacts discovered!
          </div>
        )}

        <button
          onClick={initializeDig}
          className="px-6 py-3 rounded-lg font-bold flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white transition-colors"
        >
          🗺️ New Dig Site
        </button>

        <p 
          className="text-sm text-center max-w-sm text-stone-600 dark:text-stone-400"
        >
          Click and drag to brush away dirt. Each site holds different ancient treasures waiting to be discovered!
        </p>
      </div>
    </FeatureWrapper>
  );
}