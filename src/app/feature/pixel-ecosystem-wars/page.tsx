"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pixel {
  x: number;
  y: number;
  species: number;
  energy: number;
  age: number;
}

interface Species {
  name: string;
  color: string;
  aggression: number;
  reproductionRate: number;
  defense: number;
  speed: number;
  emoji: string;
}

const SPECIES_LIST: Species[] = [
  { name: "Crimson Swarm", color: "#ef4444", aggression: 0.8, reproductionRate: 0.4, defense: 0.3, speed: 1.2, emoji: "🔴" },
  { name: "Azure Colony", color: "#3b82f6", aggression: 0.3, reproductionRate: 0.6, defense: 0.7, speed: 0.8, emoji: "🔵" },
  { name: "Emerald Horde", color: "#22c55e", aggression: 0.5, reproductionRate: 0.8, defense: 0.4, speed: 1.0, emoji: "🟢" },
  { name: "Golden Empire", color: "#eab308", aggression: 0.6, reproductionRate: 0.5, defense: 0.6, speed: 1.1, emoji: "🟡" },
  { name: "Purple Legion", color: "#a855f7", aggression: 0.9, reproductionRate: 0.3, defense: 0.5, speed: 1.3, emoji: "🟣" },
  { name: "Coral Tribe", color: "#f97316", aggression: 0.4, reproductionRate: 0.7, defense: 0.5, speed: 0.9, emoji: "🟠" },
];

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const PIXEL_SIZE = 4;
const GRID_WIDTH = CANVAS_WIDTH / PIXEL_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / PIXEL_SIZE;

export default function PixelEcosystemWars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Map<string, Pixel>>(new Map());
  const frameRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(0);
  const [populationCounts, setPopulationCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [generation, setGeneration] = useState(0);
  const [brushSize, setBrushSize] = useState(3);

  const getKey = (x: number, y: number) => `${x},${y}`;

  const spawnPixel = useCallback((x: number, y: number, species: number) => {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;
    const key = getKey(x, y);
    if (!pixelsRef.current.has(key)) {
      pixelsRef.current.set(key, {
        x,
        y,
        species,
        energy: 100,
        age: 0,
      });
    }
  }, []);

  const initializeEcosystem = useCallback(() => {
    pixelsRef.current.clear();
    
    // Spawn initial colonies in corners and edges
    const positions = [
      { x: 10, y: 10 },
      { x: GRID_WIDTH - 10, y: 10 },
      { x: 10, y: GRID_HEIGHT - 10 },
      { x: GRID_WIDTH - 10, y: GRID_HEIGHT - 10 },
      { x: GRID_WIDTH / 2, y: 10 },
      { x: GRID_WIDTH / 2, y: GRID_HEIGHT - 10 },
    ];

    positions.forEach((pos, index) => {
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          if (Math.random() < 0.7) {
            spawnPixel(Math.floor(pos.x + dx), Math.floor(pos.y + dy), index);
          }
        }
      }
    });

    setGeneration(0);
  }, [spawnPixel]);

  const updatePopulationCounts = useCallback(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    pixelsRef.current.forEach((pixel) => {
      counts[pixel.species]++;
    });
    setPopulationCounts(counts);
  }, []);

  const simulate = useCallback(() => {
    const pixels = pixelsRef.current;
    const toRemove: string[] = [];
    const toAdd: Pixel[] = [];

    const pixelArray = Array.from(pixels.values());
    
    // Shuffle for fairness
    for (let i = pixelArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pixelArray[i], pixelArray[j]] = [pixelArray[j], pixelArray[i]];
    }

    pixelArray.forEach((pixel) => {
      const species = SPECIES_LIST[pixel.species];
      pixel.age++;
      pixel.energy -= 0.5;

      // Death from old age or starvation
      if (pixel.energy <= 0 || pixel.age > 500 + Math.random() * 200) {
        toRemove.push(getKey(pixel.x, pixel.y));
        return;
      }

      // Movement
      if (Math.random() < species.speed * 0.3) {
        const directions = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
          { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
        ];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newX = pixel.x + dir.dx;
        const newY = pixel.y + dir.dy;

        if (newX >= 0 && newX < GRID_WIDTH && newY >= 0 && newY < GRID_HEIGHT) {
          const targetKey = getKey(newX, newY);
          const target = pixels.get(targetKey);

          if (!target) {
            // Move to empty space
            toRemove.push(getKey(pixel.x, pixel.y));
            pixel.x = newX;
            pixel.y = newY;
            toAdd.push({ ...pixel });
          } else if (target.species !== pixel.species) {
            // Combat!
            const attackPower = species.aggression * (pixel.energy / 100);
            const defensePower = SPECIES_LIST[target.species].defense * (target.energy / 100);

            if (attackPower > defensePower + Math.random() * 0.3) {
              // Attacker wins
              toRemove.push(targetKey);
              pixel.energy = Math.min(100, pixel.energy + 20);
            } else if (defensePower > attackPower + Math.random() * 0.3) {
              // Defender wins
              toRemove.push(getKey(pixel.x, pixel.y));
              target.energy = Math.min(100, target.energy + 20);
            } else {
              // Both take damage
              pixel.energy -= 15;
              target.energy -= 15;
            }
          }
        }
      }

      // Reproduction
      if (pixel.energy > 60 && Math.random() < species.reproductionRate * 0.1) {
        const directions = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        ];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newX = pixel.x + dir.dx;
        const newY = pixel.y + dir.dy;

        if (newX >= 0 && newX < GRID_WIDTH && newY >= 0 && newY < GRID_HEIGHT) {
          const key = getKey(newX, newY);
          if (!pixels.has(key) && !toAdd.some(p => p.x === newX && p.y === newY)) {
            toAdd.push({
              x: newX,
              y: newY,
              species: pixel.species,
              energy: 50,
              age: 0,
            });
            pixel.energy -= 30;
          }
        }
      }

      // Energy recovery (territorial bonus)
      let friendlyNeighbors = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = pixels.get(getKey(pixel.x + dx, pixel.y + dy));
          if (neighbor && neighbor.species === pixel.species) {
            friendlyNeighbors++;
          }
        }
      }
      pixel.energy = Math.min(100, pixel.energy + friendlyNeighbors * 0.5);
    });

    // Apply changes
    toRemove.forEach(key => pixels.delete(key));
    toAdd.forEach(pixel => {
      const key = getKey(pixel.x, pixel.y);
      if (!pixels.has(key)) {
        pixels.set(key, pixel);
      }
    });

    setGeneration(g => g + 1);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern (subtle)
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CANVAS_WIDTH; x += PIXEL_SIZE * 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += PIXEL_SIZE * 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw pixels
    pixelsRef.current.forEach((pixel) => {
      const species = SPECIES_LIST[pixel.species];
      const alpha = Math.min(1, pixel.energy / 100);
      ctx.fillStyle = species.color;
      ctx.globalAlpha = 0.3 + alpha * 0.7;
      ctx.fillRect(
        pixel.x * PIXEL_SIZE,
        pixel.y * PIXEL_SIZE,
        PIXEL_SIZE - 1,
        PIXEL_SIZE - 1
      );
    });
    ctx.globalAlpha = 1;
  }, []);

  const gameLoop = useCallback(() => {
    if (isRunning) {
      simulate();
      render();
      updatePopulationCounts();
    }
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, simulate, render, updatePopulationCounts]);

  useEffect(() => {
    initializeEcosystem();
    render();
    updatePopulationCounts();
  }, [initializeEcosystem, render, updatePopulationCounts]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameLoop]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / PIXEL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / PIXEL_SIZE);

    // Spawn pixels in a brush area
    for (let dx = -brushSize; dx <= brushSize; dx++) {
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          if (Math.random() < 0.7) {
            spawnPixel(x + dx, y + dy, selectedSpecies);
          }
        }
      }
    }
    render();
    updatePopulationCounts();
  };

  const clearAll = () => {
    pixelsRef.current.clear();
    setGeneration(0);
    render();
    updatePopulationCounts();
  };

  const totalPopulation = populationCounts.reduce((a, b) => a + b, 0);

  return (
    <FeatureWrapper day={380} title="Pixel Ecosystem Wars" emoji="⚔️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <p className="text-[var(--color-text-dim)] mb-2">
            Welcome to the petri dish of digital chaos! 🧫 Watch as six pixel species 
            battle for dominance. Click to spawn reinforcements for your favorite faction.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Canvas */}
          <div className="flex flex-col items-center gap-3">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleCanvasClick}
              className="border-2 border-[var(--color-border)] rounded-lg cursor-crosshair"
              style={{ imageRendering: "pixelated" }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="btn-primary px-6 py-2"
              >
                {isRunning ? "⏸️ Pause" : "▶️ Start"}
              </button>
              <button
                onClick={() => { initializeEcosystem(); render(); updatePopulationCounts(); }}
                className="btn-secondary px-4 py-2"
              >
                🔄 Reset
              </button>
              <button
                onClick={clearAll}
                className="btn-secondary px-4 py-2"
              >
                🗑️ Clear
              </button>
            </div>

            <div className="text-sm text-[var(--color-text-dim)]">
              Generation: <span className="text-[var(--color-accent)] font-bold">{generation}</span>
              {" • "}
              Population: <span className="text-[var(--color-accent)] font-bold">{totalPopulation}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 min-w-[250px]">
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <h3 className="font-semibold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                🎨 Spawn Species
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {SPECIES_LIST.map((species, index) => (
                  <button
                    key={species.name}
                    onClick={() => setSelectedSpecies(index)}
                    className={`p-2 rounded text-sm flex items-center gap-2 transition-all ${
                      selectedSpecies === index
                        ? "ring-2 ring-[var(--color-accent)]"
                        : "hover:bg-[var(--color-bg)]"
                    }`}
                    style={{
                      backgroundColor: `${species.color}20`,
                      borderLeft: `3px solid ${species.color}`,
                    }}
                  >
                    <span>{species.emoji}</span>
                    <span className="truncate">{species.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-sm text-[var(--color-text-dim)] block mb-2">
                  Brush Size: {brushSize}
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <h3 className="font-semibold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                📊 Population Stats
              </h3>
              <div className="space-y-2">
                {SPECIES_LIST.map((species, index) => {
                  const count = populationCounts[index];
                  const percentage = totalPopulation > 0 ? (count / totalPopulation) * 100 : 0;
                  return (
                    <div key={species.name} className="flex items-center gap-2">
                      <span>{species.emoji}</span>
                      <div className="flex-1 h-4 bg-[var(--color-bg)] rounded overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: species.color,
                          }}
                        />
                      </div>
                      <span className="text-xs w-12 text-right text-[var(--color-text-dim)]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <h3 className="font-semibold mb-2" style={{ fontFamily: "var(--font-serif)" }}>
                📜 Species Traits
              </h3>
              <div className="text-xs space-y-1 text-[var(--color-text-dim)]">
                <p>🔴 <strong>Crimson:</strong> Aggressive raiders</p>
                <p>🔵 <strong>Azure:</strong> Defensive breeders</p>
                <p>🟢 <strong>Emerald:</strong> Rapid reproducers</p>
                <p>🟡 <strong>Golden:</strong> Balanced warriors</p>
                <p>🟣 <strong>Purple:</strong> Elite assassins</p>
                <p>🟠 <strong>Coral:</strong> Steady expanders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-[var(--color-text-dim)] max-w-lg">
          💡 <em>Tip: Click anywhere on the battlefield to introduce reinforcements. 
          Watch how different species interact - some will dominate, others will find niches to survive!</em>
        </div>
      </div>
    </FeatureWrapper>
  );
}