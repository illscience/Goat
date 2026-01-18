"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface SnowBlock {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  isStatic: boolean;
  color: string;
}

interface TriggerPoint {
  x: number;
  y: number;
}

export default function PixelAvalancheBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [blocks, setBlocks] = useState<SnowBlock[]>([]);
  const [triggerPoints, setTriggerPoints] = useState<TriggerPoint[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mode, setMode] = useState<"build" | "trigger">("build");
  const [blockCount, setBlockCount] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const BLOCK_SIZE = 12;
  const GRAVITY = 0.3;
  const FRICTION = 0.98;
  const BOUNCE = 0.4;

  const snowColors = [
    "#ffffff",
    "#f0f8ff",
    "#e6f2ff",
    "#d9ecff",
    "#cce6ff",
    "#b3d9ff",
  ];

  const getMountainY = useCallback((x: number): number => {
    const normalizedX = x / CANVAS_WIDTH;
    const baseHeight = CANVAS_HEIGHT - 80;
    const peak1 = Math.max(0, 1 - Math.abs(normalizedX - 0.3) * 3) * 200;
    const peak2 = Math.max(0, 1 - Math.abs(normalizedX - 0.7) * 2.5) * 250;
    const peak3 = Math.max(0, 1 - Math.abs(normalizedX - 0.5) * 4) * 150;
    return baseHeight - Math.max(peak1, peak2, peak3);
  }, []);

  const drawMountain = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT);
      for (let x = 0; x <= CANVAS_WIDTH; x += 2) {
        ctx.lineTo(x, getMountainY(x));
      }
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.closePath();

      const mountainGradient = ctx.createLinearGradient(0, 100, 0, CANVAS_HEIGHT);
      mountainGradient.addColorStop(0, "#4a4a6a");
      mountainGradient.addColorStop(0.5, "#3a3a5a");
      mountainGradient.addColorStop(1, "#2a2a4a");
      ctx.fillStyle = mountainGradient;
      ctx.fill();

      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * CANVAS_WIDTH,
          Math.random() * 150,
          Math.random() * 1.5 + 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    },
    [getMountainY]
  );

  const drawBlocks = useCallback(
    (ctx: CanvasRenderingContext2D, currentBlocks: SnowBlock[]) => {
      currentBlocks.forEach((block) => {
        ctx.fillStyle = block.color;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 3;
        ctx.fillRect(
          block.x - block.size / 2,
          block.y - block.size / 2,
          block.size,
          block.size
        );
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(200, 220, 255, 0.3)";
        ctx.fillRect(
          block.x - block.size / 2 + 2,
          block.y - block.size / 2 + 2,
          block.size / 3,
          block.size / 3
        );
      });
    },
    []
  );

  const drawTriggerPoints = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      triggerPoints.forEach((point) => {
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffaaaa";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💥", point.x, point.y + 4);
      });
    },
    [triggerPoints]
  );

  const render = useCallback(
    (currentBlocks: SnowBlock[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawMountain(ctx);
      drawBlocks(ctx, currentBlocks);
      if (mode === "trigger" && !isSimulating) {
        drawTriggerPoints(ctx);
      }
    },
    [drawMountain, drawBlocks, drawTriggerPoints, mode, isSimulating]
  );

  useEffect(() => {
    render(blocks);
  }, [blocks, render]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSimulating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (mode === "build") {
      const mountainY = getMountainY(x);
      if (y < mountainY) {
        const newBlock: SnowBlock = {
          id: Date.now() + Math.random(),
          x,
          y,
          vx: 0,
          vy: 0,
          size: BLOCK_SIZE + Math.random() * 4 - 2,
          isStatic: true,
          color: snowColors[Math.floor(Math.random() * snowColors.length)],
        };
        setBlocks((prev) => [...prev, newBlock]);
        setBlockCount((prev) => prev + 1);
      }
    } else if (mode === "trigger") {
      setTriggerPoints((prev) => [...prev, { x, y }]);
    }
  };

  const triggerAvalanche = useCallback(() => {
    if (blocks.length === 0 || triggerPoints.length === 0) return;

    setIsSimulating(true);
    setShowInstructions(false);

    let simulationBlocks = blocks.map((block) => {
      let shouldTrigger = false;
      triggerPoints.forEach((point) => {
        const dist = Math.sqrt(
          Math.pow(block.x - point.x, 2) + Math.pow(block.y - point.y, 2)
        );
        if (dist < 60) {
          shouldTrigger = true;
        }
      });
      return {
        ...block,
        isStatic: shouldTrigger ? false : block.isStatic,
        vx: shouldTrigger ? (Math.random() - 0.5) * 4 : 0,
        vy: shouldTrigger ? Math.random() * 2 : 0,
      };
    });

    const simulate = () => {
      let hasMovement = false;

      simulationBlocks = simulationBlocks.map((block) => {
        if (block.isStatic) {
          const nearbyMoving = simulationBlocks.some((other) => {
            if (other.isStatic || other.id === block.id) return false;
            const dist = Math.sqrt(
              Math.pow(block.x - other.x, 2) + Math.pow(block.y - other.y, 2)
            );
            return dist < BLOCK_SIZE * 2 && Math.abs(other.vy) > 0.5;
          });
          if (nearbyMoving) {
            return {
              ...block,
              isStatic: false,
              vx: (Math.random() - 0.5) * 3,
              vy: Math.random() * 2,
            };
          }
          return block;
        }

        let newVx = block.vx * FRICTION;
        let newVy = block.vy + GRAVITY;

        let newX = block.x + newVx;
        let newY = block.y + newVy;

        const mountainY = getMountainY(newX);
        if (newY + block.size / 2 > mountainY) {
          newY = mountainY - block.size / 2;
          newVy = -newVy * BOUNCE;

          const slope =
            (getMountainY(newX + 5) - getMountainY(newX - 5)) / 10;
          newVx += slope * 2;
        }

        if (newX < block.size / 2) {
          newX = block.size / 2;
          newVx = -newVx * BOUNCE;
        }
        if (newX > CANVAS_WIDTH - block.size / 2) {
          newX = CANVAS_WIDTH - block.size / 2;
          newVx = -newVx * BOUNCE;
        }

        if (newY > CANVAS_HEIGHT + 50) {
          return { ...block, y: CANVAS_HEIGHT + 100 };
        }

        if (Math.abs(newVx) > 0.1 || Math.abs(newVy) > 0.1) {
          hasMovement = true;
        }

        return {
          ...block,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
        };
      });

      simulationBlocks = simulationBlocks.filter(
        (block) => block.y < CANVAS_HEIGHT + 50
      );

      setBlocks([...simulationBlocks]);
      render(simulationBlocks);

      if (hasMovement || simulationBlocks.some((b) => !b.isStatic)) {
        frameRef.current = requestAnimationFrame(simulate);
      } else {
        setIsSimulating(false);
        setTriggerPoints([]);
      }
    };

    frameRef.current = requestAnimationFrame(simulate);
  }, [blocks, triggerPoints, getMountainY, render]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const resetCanvas = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    setBlocks([]);
    setTriggerPoints([]);
    setIsSimulating(false);
    setBlockCount(0);
    setShowInstructions(true);
  };

  return (
    <FeatureWrapper day={414} title="Pixel Avalanche Builder" emoji="🏔️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--color-text)",
            }}
          >
            Build Your Disaster ❄️
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Stack snow blocks on the mountain, place trigger points, then watch
            physics do its chaotic thing!
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setMode("build")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              mode === "build"
                ? "bg-blue-500 text-white shadow-lg scale-105"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            disabled={isSimulating}
          >
            ❄️ Build Mode
          </button>
          <button
            onClick={() => setMode("trigger")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              mode === "trigger"
                ? "bg-red-500 text-white shadow-lg scale-105"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            disabled={isSimulating}
          >
            💥 Trigger Mode
          </button>
          <button
            onClick={triggerAvalanche}
            className="btn-primary px-4 py-2 rounded-lg font-medium"
            disabled={
              isSimulating ||
              blocks.length === 0 ||
              triggerPoints.length === 0
            }
          >
            🏔️ Start Avalanche!
          </button>
          <button
            onClick={resetCanvas}
            className="btn-secondary px-4 py-2 rounded-lg font-medium"
          >
            🔄 Reset
          </button>
        </div>

        <div className="flex gap-4 text-sm">
          <span
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text)",
            }}
          >
            Blocks: {blockCount}
          </span>
          <span
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text)",
            }}
          >
            Triggers: {triggerPoints.length}
          </span>
        </div>

        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{ border: "2px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
            style={{
              width: "100%",
              maxWidth: "800px",
              height: "auto",
            }}
          />

          {showInstructions && blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="px-6 py-4 rounded-xl text-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "var(--color-text)",
                }}
              >
                <p className="text-lg font-medium">Click to place snow blocks!</p>
                <p className="text-sm opacity-70 mt-1">
                  Build up, then switch to trigger mode
                </p>
              </div>
            </div>
          )}

          {isSimulating && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse">
                🌊 AVALANCHE IN PROGRESS!
              </span>
            </div>
          )}
        </div>

        <div
          className="text-center text-sm max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          {mode === "build" ? (
            <p>
              ❄️ <strong>Build Mode:</strong> Click anywhere above the mountain
              to place snow blocks
            </p>
          ) : (
            <p>
              💥 <strong>Trigger Mode:</strong> Click to place detonation
              points, then hit &quot;Start Avalanche&quot;!
            </p>
          )}
        </div>
      </div>
    </FeatureWrapper>
  );
}