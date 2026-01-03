"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "fossil" | "treasure" | "pottery" | "coin" | "skeleton" | "temple";
  revealed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const GRID_SIZE = 40;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

const ARTIFACT_COLORS: Record<string, string> = {
  fossil: "#d4a574",
  treasure: "#ffd700",
  pottery: "#cd853f",
  coin: "#c0c0c0",
  skeleton: "#f5f5dc",
  temple: "#8b4513",
};

const ARTIFACT_EMOJIS: Record<string, string> = {
  fossil: "🦴",
  treasure: "💎",
  pottery: "🏺",
  coin: "🪙",
  skeleton: "💀",
  temple: "🏛️",
};

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dirtLayer, setDirtLayer] = useState<number[][]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [brushSize, setBrushSize] = useState(2);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<string[]>([]);
  const [digSite, setDigSite] = useState(1);
  const animationRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);
  const rows = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

  const generateArtifacts = useCallback(() => {
    const types: Artifact["type"][] = ["fossil", "treasure", "pottery", "coin", "skeleton", "temple"];
    const newArtifacts: Artifact[] = [];
    const artifactCount = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < artifactCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const width = type === "temple" ? 3 : type === "skeleton" ? 2 : 1;
      const height = type === "temple" ? 2 : type === "skeleton" ? 2 : 1;

      let attempts = 0;
      let placed = false;

      while (!placed && attempts < 50) {
        const x = Math.floor(Math.random() * (cols - width));
        const y = Math.floor(Math.random() * (rows - height));

        const overlaps = newArtifacts.some(
          (a) =>
            x < a.x + a.width &&
            x + width > a.x &&
            y < a.y + a.height &&
            y + height > a.y
        );

        if (!overlaps) {
          newArtifacts.push({ x, y, width, height, type, revealed: false });
          placed = true;
        }
        attempts++;
      }
    }

    return newArtifacts;
  }, [cols, rows]);

  const initGame = useCallback(() => {
    const newDirt: number[][] = [];
    for (let y = 0; y < rows; y++) {
      newDirt[y] = [];
      for (let x = 0; x < cols; x++) {
        newDirt[y][x] = 100;
      }
    }
    setDirtLayer(newDirt);
    setArtifacts(generateArtifacts());
    setScore(0);
    setTimeLeft(60);
    setGameState("playing");
    setParticles([]);
    setDiscoveredArtifacts([]);
  }, [rows, cols, generateArtifacts]);

  const createParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 30,
        color: `hsl(30, ${50 + Math.random() * 30}%, ${40 + Math.random() * 20}%)`,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const dig = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameState !== "playing") return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const gridX = Math.floor(mouseX / GRID_SIZE);
      const gridY = Math.floor(mouseY / GRID_SIZE);

      const newDirt = [...dirtLayer.map((row) => [...row])];
      let dug = false;

      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const nx = gridX + dx;
          const ny = gridY + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < brushSize) {
              const reduction = Math.max(0, 30 - dist * 10);
              if (newDirt[ny]?.[nx] !== undefined && newDirt[ny][nx] > 0) {
                newDirt[ny][nx] = Math.max(0, newDirt[ny][nx] - reduction);
                dug = true;
              }
            }
          }
        }
      }

      if (dug) {
        createParticles(mouseX, mouseY);
        setDirtLayer(newDirt);

        // Check for artifact discoveries
        artifacts.forEach((artifact, index) => {
          if (!artifact.revealed) {
            let totalDirt = 0;
            let cells = 0;
            for (let ay = artifact.y; ay < artifact.y + artifact.height; ay++) {
              for (let ax = artifact.x; ax < artifact.x + artifact.width; ax++) {
                if (newDirt[ay]?.[ax] !== undefined) {
                  totalDirt += newDirt[ay][ax];
                  cells++;
                }
              }
            }
            const avgDirt = cells > 0 ? totalDirt / cells : 100;
            if (avgDirt < 30) {
              const newArtifacts = [...artifacts];
              newArtifacts[index].revealed = true;
              setArtifacts(newArtifacts);

              const points = artifact.type === "treasure" ? 100 : 
                           artifact.type === "temple" ? 150 : 
                           artifact.type === "skeleton" ? 75 : 50;
              setScore((prev) => prev + points);
              setDiscoveredArtifacts((prev) => [...prev, artifact.type]);
            }
          }
        });
      }
    },
    [gameState, dirtLayer, artifacts, brushSize, cols, rows]
  );

  // Timer effect
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("lost");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  // Check win condition
  useEffect(() => {
    if (gameState === "playing" && artifacts.length > 0) {
      const allRevealed = artifacts.every((a) => a.revealed);
      if (allRevealed) {
        setGameState("won");
        setScore((prev) => prev + timeLeft * 10);
      }
    }
  }, [artifacts, gameState, timeLeft]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw background (underground)
      ctx.fillStyle = "#3d2914";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw artifacts
      artifacts.forEach((artifact) => {
        const x = artifact.x * GRID_SIZE;
        const y = artifact.y * GRID_SIZE;
        const width = artifact.width * GRID_SIZE;
        const height = artifact.height * GRID_SIZE;

        ctx.fillStyle = ARTIFACT_COLORS[artifact.type] ?? "#888888";
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);

        // Draw pattern based on type
        ctx.fillStyle = artifact.revealed ? "#ffffff33" : "#00000033";
        if (artifact.type === "fossil") {
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, width / 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (artifact.type === "temple") {
          ctx.fillRect(x + width / 4, y + 4, width / 2, height - 8);
        }

        // Glow effect for revealed artifacts
        if (artifact.revealed) {
          ctx.shadowColor = ARTIFACT_COLORS[artifact.type] ?? "#888888";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.shadowBlur = 0;
        }
      });

      // Draw dirt layer
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dirt = dirtLayer[y]?.[x] ?? 100;
          if (dirt > 0) {
            const alpha = dirt / 100;
            const shade = 30 + Math.random() * 10;
            ctx.fillStyle = `rgba(${shade + 60}, ${shade + 30}, ${shade}, ${alpha})`;
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

            // Add texture
            if (dirt > 50) {
              ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.2})`;
              for (let i = 0; i < 3; i++) {
                const px = x * GRID_SIZE + Math.random() * GRID_SIZE;
                const py = y * GRID_SIZE + Math.random() * GRID_SIZE;
                ctx.fillRect(px, py, 2, 2);
              }
            }
          }
        }
      }

      // Draw particles
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0);

        updated.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / 30;
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          ctx.globalAlpha = 1;
        });

        return updated;
      });

      // Sandstorm warning
      if (gameState === "playing" && timeLeft < 15) {
        ctx.fillStyle = `rgba(139, 69, 19, ${(15 - timeLeft) / 30})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dirtLayer, artifacts, gameState, timeLeft, rows, cols]);

  const nextDigSite = () => {
    setDigSite((prev) => prev + 1);
    initGame();
  };

  return (
    <FeatureWrapper day={399} title="Pixel Archaeology Dig" emoji="🏺">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Unearth Ancient Secrets! 🦴
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Carefully brush away the dirt to reveal buried treasures. But hurry - a sandstorm approaches!
          </p>
        </div>

        {gameState === "idle" && (
          <div className="text-center">
            <button className="btn-primary text-lg px-8 py-3" onClick={initGame}>
              🏺 Start Excavation
            </button>
            <p className="mt-4 text-sm" style={{ color: "var(--color-text-dim)" }}>
              Click and drag to dig. Find all artifacts before time runs out!
            </p>
          </div>
        )}

        {gameState !== "idle" && (
          <>
            <div className="flex gap-6 items-center flex-wrap justify-center">
              <div
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <span style={{ color: "var(--color-text-dim)" }}>Dig Site: </span>
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                  #{digSite}
                </span>
              </div>
              <div
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <span style={{ color: "var(--color-text-dim)" }}>Score: </span>
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                  {score}
                </span>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${timeLeft < 15 ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor: timeLeft < 15 ? "#7f1d1d" : "var(--color-bg-secondary)",
                }}
              >
                <span style={{ color: "var(--color-text-dim)" }}>⏱️ </span>
                <span
                  className="font-bold"
                  style={{ color: timeLeft < 15 ? "#fca5a5" : "var(--color-text)" }}
                >
                  {timeLeft}s
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <span style={{ color: "var(--color-text-dim)" }}>Brush Size:</span>
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    brushSize === size ? "ring-2 ring-offset-2" : ""
                  }`}
                  style={{
                    backgroundColor:
                      brushSize === size ? "var(--color-accent)" : "var(--color-bg-secondary)",
                  }}
                >
                  {size === 1 ? "🖌️" : size === 2 ? "🖼️" : "🪣"}
                </button>
              ))}
            </div>

            <div
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{ border: "4px solid var(--color-border)" }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={dig}
                onMouseMove={(e) => e.buttons === 1 && dig(e)}
                className="cursor-crosshair"
                style={{ maxWidth: "100%", height: "auto" }}
              />

              {(gameState === "won" || gameState === "lost") && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center p-6 rounded-xl" style={{ backgroundColor: "var(--color-bg)" }}>
                    {gameState === "won" ? (
                      <>
                        <h3 className="text-3xl mb-2">🎉 Excavation Complete!</h3>
                        <p style={{ color: "var(--color-text-dim)" }}>
                          You found all artifacts with {timeLeft}s to spare!
                        </p>
                        <p className="text-2xl font-bold mt-2" style={{ color: "var(--color-accent)" }}>
                          Final Score: {score}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-3xl mb-2">🌪️ Sandstorm!</h3>
                        <p style={{ color: "var(--color-text-dim)" }}>
                          The site has been buried again...
                        </p>
                        <p className="text-xl mt-2">Score: {score}</p>
                      </>
                    )}
                    <div className="flex gap-3 justify-center mt-4">
                      <button className="btn-secondary" onClick={initGame}>
                        🔄 Retry
                      </button>
                      {gameState === "won" && (
                        <button className="btn-primary" onClick={nextDigSite}>
                          ➡️ Next Site
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {discoveredArtifacts.length > 0 && (
              <div
                className="p-4 rounded-lg max-w-md w-full"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <h4 className="text-sm mb-2" style={{ color: "var(--color-text-dim)" }}>
                  Discoveries:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {discoveredArtifacts.map((type, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm animate-bounce"
                      style={{
                        backgroundColor: (ARTIFACT_COLORS[type] ?? "#888888") + "33",
                        color: "var(--color-text)",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    >
                      {ARTIFACT_EMOJIS[type] ?? "❓"} {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div
              className="text-xs text-center p-3 rounded-lg max-w-md"
              style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}
            >
              💡 <strong>Tips:</strong> Use smaller brushes for precision near artifacts. Larger brushes cover more ground but might miss details!
            </div>
          </>
        )}
      </div>
    </FeatureWrapper>
  );
}