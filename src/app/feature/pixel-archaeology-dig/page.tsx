"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "pottery" | "coin" | "symbol" | "bone" | "gem" | "tool";
  pattern: number[][];
  color: string;
  discovered: boolean;
}

interface DigSite {
  artifacts: Artifact[];
  revealedPixels: boolean[][];
  totalPixels: number;
  revealedCount: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const PIXEL_SIZE = 4;
const GRID_WIDTH = CANVAS_WIDTH / PIXEL_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / PIXEL_SIZE;

const ARTIFACT_COLORS: Record<string, string> = {
  pottery: "#8B4513",
  coin: "#FFD700",
  symbol: "#4A90A4",
  bone: "#F5F5DC",
  gem: "#9B59B6",
  tool: "#708090",
};

const ARTIFACT_PATTERNS: Record<string, number[][][]> = {
  pottery: [
    [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ],
    [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ],
  ],
  coin: [
    [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ],
  ],
  symbol: [
    [
      [1, 0, 0, 0, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1],
    ],
    [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  ],
  bone: [
    [
      [1, 1, 0, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 1, 1],
    ],
  ],
  gem: [
    [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  ],
  tool: [
    [
      [1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 0, 0],
    ],
  ],
};

const DIRT_COLORS = [
  "#5D4037",
  "#6D4C41",
  "#4E342E",
  "#3E2723",
  "#795548",
  "#8D6E63",
];

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDigging, setIsDigging] = useState(false);
  const [digSite, setDigSite] = useState<DigSite | null>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState<string[]>([]);
  const [siteNumber, setSiteNumber] = useState(1);
  const dirtColorsRef = useRef<string[][]>([]);
  const animationRef = useRef<number>(0);

  const generateArtifacts = useCallback((): Artifact[] => {
    const artifacts: Artifact[] = [];
    const types: Array<"pottery" | "coin" | "symbol" | "bone" | "gem" | "tool"> =
      ["pottery", "coin", "symbol", "bone", "gem", "tool"];
    const numArtifacts = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numArtifacts; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const patterns = ARTIFACT_PATTERNS[type];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];

      let x: number, y: number;
      let attempts = 0;
      do {
        x = 5 + Math.floor(Math.random() * (GRID_WIDTH - 15));
        y = 5 + Math.floor(Math.random() * (GRID_HEIGHT - 15));
        attempts++;
      } while (
        attempts < 50 &&
        artifacts.some(
          (a) =>
            Math.abs(a.x - x) < 10 + a.width && Math.abs(a.y - y) < 10 + a.height
        )
      );

      if (attempts < 50) {
        artifacts.push({
          x,
          y,
          width: pattern[0].length,
          height: pattern.length,
          type,
          pattern,
          color: ARTIFACT_COLORS[type],
          discovered: false,
        });
      }
    }

    return artifacts;
  }, []);

  const initializeDigSite = useCallback(() => {
    const revealedPixels: boolean[][] = Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(false));

    dirtColorsRef.current = Array(GRID_HEIGHT)
      .fill(null)
      .map(() =>
        Array(GRID_WIDTH)
          .fill(null)
          .map(() => DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)])
      );

    setDigSite({
      artifacts: generateArtifacts(),
      revealedPixels,
      totalPixels: GRID_WIDTH * GRID_HEIGHT,
      revealedCount: 0,
    });
    setDiscoveredArtifacts([]);
  }, [generateArtifacts]);

  useEffect(() => {
    initializeDigSite();
  }, [initializeDigSite]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !digSite) return;

    ctx.fillStyle = "#2C1810";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (digSite.revealedPixels[y][x]) {
          ctx.fillStyle = "#D2B48C";
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        } else {
          ctx.fillStyle = dirtColorsRef.current[y]?.[x] || "#5D4037";
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
      }
    }

    digSite.artifacts.forEach((artifact) => {
      for (let py = 0; py < artifact.height; py++) {
        for (let px = 0; px < artifact.width; px++) {
          if (artifact.pattern[py][px] === 1) {
            const gridX = artifact.x + px;
            const gridY = artifact.y + py;
            if (digSite.revealedPixels[gridY]?.[gridX]) {
              const brightness = artifact.discovered ? 1.2 : 1;
              ctx.fillStyle = artifact.color;
              ctx.fillRect(
                gridX * PIXEL_SIZE,
                gridY * PIXEL_SIZE,
                PIXEL_SIZE,
                PIXEL_SIZE
              );
              if (artifact.discovered) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.fillRect(
                  gridX * PIXEL_SIZE,
                  gridY * PIXEL_SIZE,
                  PIXEL_SIZE * 0.5,
                  PIXEL_SIZE * 0.5
                );
              }
            }
          }
        }
      }
    });
  }, [digSite]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const dig = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !digSite) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = Math.floor(((clientX - rect.left) * scaleX) / PIXEL_SIZE);
      const y = Math.floor(((clientY - rect.top) * scaleY) / PIXEL_SIZE);

      setDigSite((prev) => {
        if (!prev) return prev;

        const newRevealedPixels = prev.revealedPixels.map((row) => [...row]);
        let newRevealedCount = prev.revealedCount;
        const newArtifacts = [...prev.artifacts];

        for (let dy = -brushSize; dy <= brushSize; dy++) {
          for (let dx = -brushSize; dx <= brushSize; dx++) {
            if (dx * dx + dy * dy <= brushSize * brushSize) {
              const nx = x + dx;
              const ny = y + dy;
              if (
                nx >= 0 &&
                nx < GRID_WIDTH &&
                ny >= 0 &&
                ny < GRID_HEIGHT &&
                !newRevealedPixels[ny][nx]
              ) {
                newRevealedPixels[ny][nx] = true;
                newRevealedCount++;
              }
            }
          }
        }

        newArtifacts.forEach((artifact, idx) => {
          if (artifact.discovered) return;

          let visiblePixels = 0;
          let totalArtifactPixels = 0;

          for (let py = 0; py < artifact.height; py++) {
            for (let px = 0; px < artifact.width; px++) {
              if (artifact.pattern[py][px] === 1) {
                totalArtifactPixels++;
                const gridX = artifact.x + px;
                const gridY = artifact.y + py;
                if (newRevealedPixels[gridY]?.[gridX]) {
                  visiblePixels++;
                }
              }
            }
          }

          if (visiblePixels / totalArtifactPixels > 0.6) {
            newArtifacts[idx] = { ...artifact, discovered: true };
            setDiscoveredArtifacts((prev) => {
              if (!prev.includes(artifact.type)) {
                return [...prev, artifact.type];
              }
              return prev;
            });
          }
        });

        return {
          ...prev,
          revealedPixels: newRevealedPixels,
          revealedCount: newRevealedCount,
          artifacts: newArtifacts,
        };
      });
    },
    [digSite, brushSize]
  );

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
    if (isDigging) {
      const touch = e.touches[0];
      dig(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDigging(false);
  };

  const newDigSite = () => {
    setSiteNumber((prev) => prev + 1);
    initializeDigSite();
  };

  const revealPercentage = digSite
    ? Math.round((digSite.revealedCount / digSite.totalPixels) * 100)
    : 0;

  const discoveredCount = digSite
    ? digSite.artifacts.filter((a) => a.discovered).length
    : 0;

  const totalArtifacts = digSite?.artifacts.length || 0;

  const getArtifactEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      pottery: "🏺",
      coin: "🪙",
      symbol: "🔮",
      bone: "🦴",
      gem: "💎",
      tool: "🔧",
    };
    return emojis[type] || "📦";
  };

  return (
    <FeatureWrapper day={379} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Dig Site #{siteNumber}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click and drag to brush away the dirt and uncover ancient pixel
            artifacts. What treasures lie beneath?
          </p>
        </div>

        <div
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{
            border: "4px solid var(--color-border)",
            boxShadow: "0 0 20px rgba(139, 69, 19, 0.3)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="cursor-crosshair touch-none"
            style={{ maxWidth: "100%", height: "auto" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="flex items-center gap-4 w-full">
            <label
              className="text-sm whitespace-nowrap"
              style={{ color: "var(--color-text-dim)" }}
            >
              Brush Size:
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="flex-1"
            />
            <span
              className="text-sm font-mono w-8 text-center"
              style={{ color: "var(--color-text)" }}
            >
              {brushSize}
            </span>
          </div>

          <div
            className="w-full p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: "var(--color-text-dim)" }}>
                Excavation Progress
              </span>
              <span
                className="font-bold"
                style={{ color: "var(--color-accent)" }}
              >
                {revealPercentage}%
              </span>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${revealPercentage}%`,
                  backgroundColor: "var(--color-accent)",
                }}
              />
            </div>
          </div>

          <div
            className="w-full p-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: "var(--color-text-dim)" }}>
                Artifacts Found
              </span>
              <span
                className="font-bold"
                style={{ color: "var(--color-accent)" }}
              >
                {discoveredCount} / {totalArtifacts}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {digSite?.artifacts.map((artifact, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    artifact.discovered
                      ? "scale-105"
                      : "opacity-30 grayscale"
                  }`}
                  style={{
                    backgroundColor: artifact.discovered
                      ? artifact.color + "33"
                      : "var(--color-border)",
                    color: artifact.discovered
                      ? artifact.color
                      : "var(--color-text-dim)",
                    border: `2px solid ${
                      artifact.discovered
                        ? artifact.color
                        : "var(--color-border)"
                    }`,
                  }}
                >
                  {getArtifactEmoji(artifact.type)}{" "}
                  {artifact.discovered ? artifact.type : "???"}
                </div>
              ))}
            </div>
          </div>

          {discoveredCount === totalArtifacts && totalArtifacts > 0 && (
            <div
              className="w-full p-4 rounded-lg text-center"
              style={{
                backgroundColor: "rgba(255, 215, 0, 0.1)",
                border: "2px solid gold",
              }}
            >
              <p
                className="text-lg font-bold mb-1"
                style={{ color: "gold" }}
              >
                🎉 Site Fully Excavated! 🎉
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                You&apos;ve uncovered all {totalArtifacts} artifacts at this dig site!
              </p>
            </div>
          )}

          <button
            onClick={newDigSite}
            className="btn-primary px-6 py-3 rounded-lg font-bold text-lg"
          >
            🗺️ New Dig Site
          </button>
        </div>

        <div
          className="text-xs text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>
            Tip: Use a smaller brush for precision work around delicate
            artifacts, or go big to clear large areas quickly!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}