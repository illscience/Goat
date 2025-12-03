"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface DigSite {
  id: number;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  pixelArt: number[][];
  palette: string[];
}

const DIG_SITES: DigSite[] = [
  {
    id: 1,
    name: "Ancient Skull Temple",
    description: "A mysterious artifact from the pixel age",
    difficulty: "Easy",
    pixelArt: [
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
      [1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 2, 1, 1, 1, 1, 1],
      [1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
      [0, 1, 1, 2, 2, 2, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    ],
    palette: ["transparent", "#f5f5dc", "#1a1a2e"],
  },
  {
    id: 2,
    name: "Lost Treasure Chest",
    description: "Pirates buried more than just gold",
    difficulty: "Medium",
    pixelArt: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 1, 1, 1, 1, 1, 1, 2, 0],
      [2, 1, 1, 1, 3, 3, 1, 1, 1, 2],
      [2, 1, 1, 3, 3, 3, 3, 1, 1, 2],
      [2, 2, 2, 2, 3, 3, 2, 2, 2, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    ],
    palette: ["transparent", "#8B4513", "#5D3A1A", "#FFD700"],
  },
  {
    id: 3,
    name: "Pixelated Heart",
    description: "An ancient symbol of love and connection",
    difficulty: "Easy",
    pixelArt: [
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 2, 2, 1, 1, 2, 2, 1, 0],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    palette: ["transparent", "#8B0000", "#FF1744"],
  },
  {
    id: 4,
    name: "Space Invader Fossil",
    description: "Evidence of the great arcade wars",
    difficulty: "Hard",
    pixelArt: [
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 2, 1, 1, 2, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    palette: ["transparent", "#00FF00", "#FFFFFF"],
  },
  {
    id: 5,
    name: "Golden Crown",
    description: "Royalty from a forgotten kingdom",
    difficulty: "Medium",
    pixelArt: [
      [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
      [1, 1, 1, 1, 2, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    palette: ["transparent", "#FFD700", "#FF0000"],
  },
];

const GRID_SIZE = 10;
const CELL_SIZE = 30;
const MAX_NOISE_DEPTH = 5;

export default function PixelArchaeology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSite, setSelectedSite] = useState<DigSite | null>(null);
  const [noiseLayer, setNoiseLayer] = useState<number[][]>([]);
  const [brushSize, setBrushSize] = useState<number>(2);
  const [isDigging, setIsDigging] = useState<boolean>(false);
  const [revealedPercent, setRevealedPercent] = useState<number>(0);
  const [artifacts, setArtifacts] = useState<number[]>([]);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const animationRef = useRef<number>(0);

  const generateNoise = useCallback(() => {
    const noise: number[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(MAX_NOISE_DEPTH);
      }
      noise.push(row);
    }
    return noise;
  }, []);

  const startDig = (site: DigSite) => {
    setSelectedSite(site);
    setNoiseLayer(generateNoise());
    setRevealedPercent(0);
    setGameComplete(false);
  };

  const calculateReveal = useCallback(() => {
    if (!selectedSite) return 0;
    let revealed = 0;
    let total = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (selectedSite.pixelArt[y]?.[x] !== 0) {
          total++;
          if (noiseLayer[y]?.[x] === 0) {
            revealed++;
          }
        }
      }
    }

    return total > 0 ? Math.round((revealed / total) * 100) : 0;
  }, [selectedSite, noiseLayer]);

  useEffect(() => {
    const percent = calculateReveal();
    setRevealedPercent(percent);
    if (percent >= 95 && !gameComplete && selectedSite) {
      setGameComplete(true);
      if (!artifacts.includes(selectedSite.id)) {
        setArtifacts((prev) => [...prev, selectedSite.id]);
      }
    }
  }, [noiseLayer, calculateReveal, gameComplete, selectedSite, artifacts]);

  const brushAtPosition = (x: number, y: number) => {
    if (!selectedSite) return;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    setNoiseLayer((prev) => {
      const newNoise = prev.map((row) => [...row]);

      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < brushSize) {
              const currentValue = newNoise[ny]?.[nx] ?? 0;
              newNoise[ny][nx] = Math.max(0, currentValue - 1);
            }
          }
        }
      }

      return newNoise;
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDigging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      brushAtPosition(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDigging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      brushAtPosition(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDigging(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsDigging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedSite) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const noiseDepth = noiseLayer[y]?.[x] ?? MAX_NOISE_DEPTH;
          const artIndex = selectedSite.pixelArt[y]?.[x] ?? 0;

          if (noiseDepth === 0 && artIndex !== 0) {
            ctx.fillStyle = selectedSite.palette[artIndex] ?? "transparent";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          } else {
            const darkness = noiseDepth / MAX_NOISE_DEPTH;
            const baseColor = Math.floor(60 - darkness * 40);
            ctx.fillStyle = `rgb(${baseColor + 20}, ${baseColor + 10}, ${baseColor})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            for (let i = 0; i < noiseDepth * 3; i++) {
              const px = x * CELL_SIZE + Math.random() * CELL_SIZE;
              const py = y * CELL_SIZE + Math.random() * CELL_SIZE;
              const shade = Math.floor(Math.random() * 30) + 30;
              ctx.fillStyle = `rgb(${shade}, ${shade - 10}, ${shade - 15})`;
              ctx.fillRect(px, py, 2, 2);
            }
          }

          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [selectedSite, noiseLayer]);

  return (
    <FeatureWrapper day={368} title="Pixel Archaeology" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Unearth Digital Treasures
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Carefully brush away layers of digital sediment to reveal ancient
            pixel artifacts. Go slowly — these relics are fragile!
          </p>
        </div>

        {!selectedSite ? (
          <div className="w-full max-w-2xl">
            <h3
              className="text-lg font-semibold mb-4 text-center"
              style={{ color: "var(--color-text)" }}
            >
              Choose Your Dig Site
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIG_SITES.map((site) => (
                <button
                  key={site.id}
                  onClick={() => startDig(site)}
                  className="p-4 rounded-lg border transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    borderColor: artifacts.includes(site.id)
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="font-bold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {site.name}
                    </span>
                    {artifacts.includes(site.id) && (
                      <span className="text-lg">✨</span>
                    )}
                  </div>
                  <p
                    className="text-sm mb-2"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {site.description}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      site.difficulty === "Easy"
                        ? "bg-green-900/50 text-green-400"
                        : site.difficulty === "Medium"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {site.difficulty}
                  </span>
                </button>
              ))}
            </div>

            <div
              className="mt-6 p-4 rounded-lg text-center"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <p style={{ color: "var(--color-text-dim)" }}>
                Artifacts Discovered: {artifacts.length} / {DIG_SITES.length}
              </p>
              <div className="flex justify-center gap-2 mt-2">
                {DIG_SITES.map((site) => (
                  <span
                    key={site.id}
                    className={`text-2xl ${artifacts.includes(site.id) ? "opacity-100" : "opacity-30"}`}
                  >
                    🏺
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                onClick={() => setSelectedSite(null)}
                className="btn-secondary px-4 py-2 rounded"
              >
                ← Back to Sites
              </button>
              <div
                className="px-4 py-2 rounded"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <span style={{ color: "var(--color-text-dim)" }}>Site: </span>
                <span style={{ color: "var(--color-text)" }}>
                  {selectedSite.name}
                </span>
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <div className="flex items-center gap-4 mb-4 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--color-text-dim)" }}>Brush:</span>
                  {[1, 2, 3].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                        brushSize === size ? "ring-2 ring-offset-2" : ""
                      }`}
                      style={{
                        backgroundColor:
                          brushSize === size
                            ? "var(--color-accent)"
                            : "var(--color-bg)",
                      }}
                    >
                      <span
                        style={{
                          width: `${size * 6}px`,
                          height: `${size * 6}px`,
                          borderRadius: "50%",
                          backgroundColor: "var(--color-text)",
                          display: "block",
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--color-text-dim)" }}>
                    Revealed:
                  </span>
                  <div
                    className="w-32 h-4 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--color-bg)" }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${revealedPercent}%`,
                        backgroundColor:
                          revealedPercent >= 95
                            ? "#22c55e"
                            : "var(--color-accent)",
                      }}
                    />
                  </div>
                  <span style={{ color: "var(--color-text)" }}>
                    {revealedPercent}%
                  </span>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                className="rounded cursor-crosshair border-2"
                style={{
                  borderColor: "var(--color-border)",
                  touchAction: "none",
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
              />

              <p
                className="text-center mt-2 text-sm"
                style={{ color: "var(--color-text-dim)" }}
              >
                Click and drag to excavate
              </p>
            </div>

            {gameComplete && (
              <div
                className="p-4 rounded-lg text-center animate-pulse"
                style={{
                  backgroundColor: "rgba(34, 197, 94, 0.2)",
                  border: "2px solid #22c55e",
                }}
              >
                <p className="text-xl font-bold text-green-400 mb-2">
                  🎉 Artifact Discovered!
                </p>
                <p style={{ color: "var(--color-text-dim)" }}>
                  You&apos;ve successfully excavated the {selectedSite.name}!
                </p>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="btn-primary mt-3 px-4 py-2 rounded"
                >
                  Find More Artifacts
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setNoiseLayer(generateNoise());
                setGameComplete(false);
              }}
              className="btn-secondary px-4 py-2 rounded"
            >
              🔄 Reset Dig Site
            </button>
          </div>
        )}

        <div
          className="mt-4 p-4 rounded-lg max-w-md text-center"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <p
            className="text-sm italic"
            style={{ color: "var(--color-text-dim)" }}
          >
            &quot;In the digital strata lie forgotten treasures — each pixel a story,
            each artifact a window to the 8-bit past.&quot;
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-dim)" }}>
            — Dr. Pixelsworth, Digital Archaeologist
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}