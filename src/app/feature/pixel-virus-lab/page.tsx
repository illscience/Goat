"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Virus {
  id: string;
  name: string;
  color: string;
  speed: number;
  infectionRadius: number;
  mutationRate: number;
}

interface VirusParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  virusId: string;
  color: string;
  speed: number;
  infectionRadius: number;
  mutationRate: number;
  age: number;
  generation: number;
}

const VIRUS_NAMES = [
  "Sparkle Pox",
  "Rainbow Fever",
  "Glitter Bug",
  "Neon Plague",
  "Disco Flu",
  "Pixel Rot",
  "Chroma Virus",
  "Glow Germ",
];

const PRESET_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#dfe6e9",
  "#fd79a8",
  "#a29bfe",
  "#00b894",
  "#e17055",
  "#74b9ff",
  "#fdcb6e",
];

export default function PixelVirusLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<VirusParticle[]>([]);
  const frameRef = useRef<number>(0);
  const territoryRef = useRef<Map<string, number>>(new Map());

  const [viruses, setViruses] = useState<Virus[]>([]);
  const [selectedVirus, setSelectedVirus] = useState<Virus | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [territory, setTerritory] = useState<Map<string, number>>(new Map());

  // Virus designer state
  const [designerColor, setDesignerColor] = useState("#ff6b6b");
  const [designerSpeed, setDesignerSpeed] = useState(2);
  const [designerRadius, setDesignerRadius] = useState(30);
  const [designerMutation, setDesignerMutation] = useState(0.1);

  const createVirus = useCallback(() => {
    const newVirus: Virus = {
      id: `virus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: VIRUS_NAMES[Math.floor(Math.random() * VIRUS_NAMES.length)],
      color: designerColor,
      speed: designerSpeed,
      infectionRadius: designerRadius,
      mutationRate: designerMutation,
    };
    setViruses((prev) => [...prev, newVirus]);
  }, [designerColor, designerSpeed, designerRadius, designerMutation]);

  const releaseVirus = useCallback(
    (virus: Virus, x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const particles: VirusParticle[] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        particles.push({
          x: x + Math.cos(angle) * 10,
          y: y + Math.sin(angle) * 10,
          vx: (Math.random() - 0.5) * virus.speed,
          vy: (Math.random() - 0.5) * virus.speed,
          virusId: virus.id,
          color: virus.color,
          speed: virus.speed,
          infectionRadius: virus.infectionRadius,
          mutationRate: virus.mutationRate,
          age: 0,
          generation: 0,
        });
      }
      particlesRef.current = [...particlesRef.current, ...particles];
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selectedVirus || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      releaseVirus(selectedVirus, x, y);
      if (!isSimulating) setIsSimulating(true);
    },
    [selectedVirus, releaseVirus, isSimulating]
  );

  const mutateColor = useCallback((color: string, rate: number): string => {
    if (Math.random() > rate) return color;

    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const mutate = (c: number) =>
      Math.max(0, Math.min(255, c + Math.floor((Math.random() - 0.5) * 50)));

    const newR = mutate(r).toString(16).padStart(2, "0");
    const newG = mutate(g).toString(16).padStart(2, "0");
    const newB = mutate(b).toString(16).padStart(2, "0");

    return `#${newR}${newG}${newB}`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      if (!isSimulating) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Semi-transparent background for trail effect
      ctx.fillStyle = "rgba(10, 10, 20, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const newParticles: VirusParticle[] = [];
      const territoryCount = new Map<string, number>();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.age++;

        // Bounce off walls
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Keep in bounds
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        // Add random movement
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy += (Math.random() - 0.5) * 0.3;

        // Limit speed
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > p.speed) {
          p.vx = (p.vx / currentSpeed) * p.speed;
          p.vy = (p.vy / currentSpeed) * p.speed;
        }

        // Count territory
        territoryCount.set(p.virusId, (territoryCount.get(p.virusId) || 0) + 1);

        // Infection/reproduction
        if (p.age > 50 && Math.random() < 0.01 && particles.length < 2000) {
          const mutatedColor = mutateColor(p.color, p.mutationRate);
          newParticles.push({
            ...p,
            x: p.x + (Math.random() - 0.5) * 20,
            y: p.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * p.speed,
            vy: (Math.random() - 0.5) * p.speed,
            color: mutatedColor,
            age: 0,
            generation: p.generation + 1,
          });
        }

        // Draw particle
        const size = 3 + Math.sin(p.age * 0.1) * 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw infection radius occasionally
        if (p.age % 60 < 5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.infectionRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `${p.color}33`;
          ctx.stroke();
        }

        // Interaction between different viruses
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          if (other.virusId === p.virusId) continue;

          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < p.infectionRadius || dist < other.infectionRadius) {
            // Battle! Stronger (older) virus wins
            if (p.age > other.age && Math.random() < 0.1) {
              other.color = mutateColor(p.color, p.mutationRate * 2);
              other.virusId = p.virusId;
            } else if (Math.random() < 0.1) {
              p.color = mutateColor(other.color, other.mutationRate * 2);
              p.virusId = other.virusId;
            }
          }
        }
      }

      // Add new particles
      particlesRef.current = [...particles, ...newParticles].slice(0, 2000);

      // Update territory display
      territoryRef.current = territoryCount;
      setTerritory(new Map(territoryCount));

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isSimulating, mutateColor]);

  const clearPetriDish = useCallback(() => {
    particlesRef.current = [];
    setIsSimulating(false);
    setTerritory(new Map());
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(10, 10, 20, 1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const deleteVirus = useCallback((id: string) => {
    setViruses((prev) => prev.filter((v) => v.id !== id));
    setSelectedVirus((prev) => (prev?.id === id ? null : prev));
  }, []);

  return (
    <FeatureWrapper day={409} title="Pixel Virus Lab" emoji="🦠">
      <div className="max-w-6xl mx-auto p-4">
        <p
          className="text-center mb-6"
          style={{ color: "var(--color-text-dim)" }}
        >
          Design deadly (but adorable) viruses and watch them battle for
          supremacy in your digital petri dish. No hazmat suit required! 🧪
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Virus Designer */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              🧬 Virus Designer
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Color
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDesignerColor(color)}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          designerColor === color
                            ? "white"
                            : "var(--color-border)",
                      }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={designerColor}
                  onChange={(e) => setDesignerColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>

              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Speed: {designerSpeed.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={designerSpeed}
                  onChange={(e) => setDesignerSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Infection Radius: {designerRadius}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={designerRadius}
                  onChange={(e) =>
                    setDesignerRadius(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Mutation Rate: {(designerMutation * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={designerMutation}
                  onChange={(e) =>
                    setDesignerMutation(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <button onClick={createVirus} className="btn-primary w-full">
                🧫 Create Virus
              </button>
            </div>

            {/* Virus Library */}
            <h3
              className="text-lg font-bold mt-6 mb-3"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              📚 Your Viruses
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {viruses.length === 0 ? (
                <p
                  className="text-sm italic"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  No viruses yet. Create one above!
                </p>
              ) : (
                viruses.map((virus) => (
                  <div
                    key={virus.id}
                    onClick={() => setSelectedVirus(virus)}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-all"
                    style={{
                      backgroundColor:
                        selectedVirus?.id === virus.id
                          ? "var(--color-accent)"
                          : "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: virus.color }}
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium truncate">
                        {virus.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-dim)" }}
                      >
                        Spd: {virus.speed.toFixed(1)} | Rad:{" "}
                        {virus.infectionRadius}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVirus(virus.id);
                      }}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Petri Dish */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                🔬 Petri Dish
              </h2>
              <button onClick={clearPetriDish} className="btn-secondary text-sm">
                🧹 Clear
              </button>
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "2px solid var(--color-border)" }}
            >
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                onClick={handleCanvasClick}
                className="w-full cursor-crosshair"
                style={{
                  backgroundColor: "rgba(10, 10, 20, 1)",
                  aspectRatio: "600 / 400",
                }}
              />
            </div>

            {selectedVirus ? (
              <p
                className="text-center mt-2 text-sm"
                style={{ color: "var(--color-text-dim)" }}
              >
                Click on the petri dish to release{" "}
                <span style={{ color: selectedVirus.color }}>
                  {selectedVirus.name}
                </span>
                !
              </p>
            ) : (
              <p
                className="text-center mt-2 text-sm"
                style={{ color: "var(--color-text-dim)" }}
              >
                Select a virus from your library to release it
              </p>
            )}

            {/* Territory Stats */}
            {territory.size > 0 && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  📊 Territory Control
                </h3>
                <div className="space-y-2">
                  {Array.from(territory.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([virusId, count]) => {
                      const virus = viruses.find((v) => v.id === virusId);
                      const total = Array.from(territory.values()).reduce(
                        (a, b) => a + b,
                        0
                      );
                      const percentage = ((count / total) * 100).toFixed(1);
                      return (
                        <div key={virusId} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: virus?.color || "#666",
                            }}
                          />
                          <div className="flex-grow">
                            <div
                              className="h-4 rounded"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: virus?.color || "#666",
                                minWidth: "20px",
                              }}
                            />
                          </div>
                          <span
                            className="text-sm w-16 text-right"
                            style={{ color: "var(--color-text-dim)" }}
                          >
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                </div>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Total particles: {particlesRef.current.length}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="mt-6 p-4 rounded-lg text-center"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <p style={{ color: "var(--color-text-dim)" }}>
            💡 <strong>Pro Tips:</strong> High mutation rates create beautiful
            color gradients. Fast viruses spread quickly but compete more. Large
            infection radii dominate but are slower to spread. Mix multiple
            virus types and watch them fight!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}