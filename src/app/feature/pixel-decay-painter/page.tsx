"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pixel {
  x: number;
  y: number;
  material: MaterialType;
  age: number;
  maxAge: number;
  color: string;
  originalColor: string;
  decayStage: number;
  growthPoints?: { x: number; y: number; size: number }[];
}

type MaterialType = "rust" | "moss" | "ash" | "copper" | "bone" | "ember";

interface Material {
  name: string;
  emoji: string;
  baseColor: string;
  description: string;
  lifespan: [number, number];
  decayColors: string[];
}

const MATERIALS: Record<MaterialType, Material> = {
  rust: {
    name: "Rust",
    emoji: "🔶",
    baseColor: "#B7410E",
    description: "Oxidizes slowly, spreading orange decay",
    lifespan: [300, 500],
    decayColors: ["#B7410E", "#8B4513", "#5C3317", "#3D2314", "#1A0F0A"],
  },
  moss: {
    name: "Moss",
    emoji: "🌿",
    baseColor: "#228B22",
    description: "Grows and spreads before withering",
    lifespan: [400, 600],
    decayColors: ["#228B22", "#006400", "#3D5C3D", "#4A4A3A", "#2D2D2D"],
  },
  ash: {
    name: "Ash",
    emoji: "🌫️",
    baseColor: "#808080",
    description: "Crackles and fades into nothing",
    lifespan: [100, 200],
    decayColors: ["#808080", "#A9A9A9", "#C0C0C0", "#D3D3D3", "#F5F5F5"],
  },
  copper: {
    name: "Copper",
    emoji: "🟤",
    baseColor: "#B87333",
    description: "Develops a beautiful patina over time",
    lifespan: [500, 800],
    decayColors: ["#B87333", "#CD853F", "#4A766E", "#3D8B8B", "#40E0D0"],
  },
  bone: {
    name: "Bone",
    emoji: "🦴",
    baseColor: "#FFF8DC",
    description: "Yellows and cracks with age",
    lifespan: [600, 900],
    decayColors: ["#FFF8DC", "#F5DEB3", "#D2B48C", "#A0826D", "#6B4423"],
  },
  ember: {
    name: "Ember",
    emoji: "🔥",
    baseColor: "#FF4500",
    description: "Burns bright then fades to charcoal",
    lifespan: [80, 150],
    decayColors: ["#FF4500", "#FF6347", "#DC143C", "#8B0000", "#1C1C1C"],
  },
};

const PIXEL_SIZE = 8;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export default function PixelDecayPainter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const pixelsRef = useRef<Map<string, Pixel>>(new Map());
  const timeScaleRef = useRef<number>(1);
  const isPausedRef = useRef<boolean>(false);
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("rust");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pixelCount, setPixelCount] = useState(0);
  const [decayedCount, setDecayedCount] = useState(0);
  const [timeScale, setTimeScale] = useState(1);

  // Sync refs with state
  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const getPixelKey = (x: number, y: number) => `${x},${y}`;

  const createPixel = (x: number, y: number, material: MaterialType): Pixel => {
    const mat = MATERIALS[material];
    const lifespan = mat.lifespan[0] + Math.random() * (mat.lifespan[1] - mat.lifespan[0]);
    
    return {
      x,
      y,
      material,
      age: 0,
      maxAge: lifespan,
      color: mat.baseColor,
      originalColor: mat.baseColor,
      decayStage: 0,
      growthPoints: material === "moss" ? [] : undefined,
    };
  };

  const updatePixel = useCallback((pixel: Pixel): boolean => {
    pixel.age += timeScaleRef.current;
    const progress = pixel.age / pixel.maxAge;
    
    if (progress >= 1) {
      return false;
    }

    const mat = MATERIALS[pixel.material];
    const stageIndex = Math.min(
      Math.floor(progress * mat.decayColors.length),
      mat.decayColors.length - 1
    );
    
    pixel.decayStage = stageIndex;
    pixel.color = mat.decayColors[stageIndex] ?? mat.baseColor;

    if (pixel.material === "moss" && progress < 0.5 && Math.random() < 0.02 * timeScaleRef.current) {
      if (pixel.growthPoints && pixel.growthPoints.length < 5) {
        pixel.growthPoints.push({
          x: (Math.random() - 0.5) * PIXEL_SIZE * 0.8,
          y: (Math.random() - 0.5) * PIXEL_SIZE * 0.8,
          size: Math.random() * 3 + 1,
        });
      }
    }

    return true;
  }, []);

  const drawPixel = useCallback((ctx: CanvasRenderingContext2D, pixel: Pixel) => {
    const mat = MATERIALS[pixel.material];
    const progress = pixel.age / pixel.maxAge;
    
    ctx.fillStyle = pixel.color;
    
    if (pixel.material === "ash") {
      const cracks = Math.floor(progress * 4);
      ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < cracks; i++) {
        ctx.beginPath();
        ctx.moveTo(pixel.x + Math.random() * PIXEL_SIZE, pixel.y);
        ctx.lineTo(pixel.x + Math.random() * PIXEL_SIZE, pixel.y + PIXEL_SIZE);
        ctx.stroke();
      }
    } else if (pixel.material === "ember") {
      const glow = 1 - progress;
      ctx.shadowColor = pixel.color;
      ctx.shadowBlur = glow * 10;
      ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
      ctx.shadowBlur = 0;
      
      if (Math.random() < 0.1 && progress < 0.5) {
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(
          pixel.x + Math.random() * PIXEL_SIZE,
          pixel.y + Math.random() * PIXEL_SIZE,
          2,
          2
        );
      }
    } else if (pixel.material === "moss" && pixel.growthPoints) {
      ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
      ctx.fillStyle = progress < 0.5 ? "#32CD32" : (mat.decayColors[pixel.decayStage] ?? mat.baseColor);
      pixel.growthPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(
          pixel.x + PIXEL_SIZE / 2 + point.x,
          pixel.y + PIXEL_SIZE / 2 + point.y,
          point.size * (1 - progress * 0.5),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    } else if (pixel.material === "copper") {
      ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
      if (progress > 0.3) {
        ctx.fillStyle = mat.decayColors[Math.min(pixel.decayStage + 1, mat.decayColors.length - 1)] ?? mat.baseColor;
        const patinaSize = (progress - 0.3) * PIXEL_SIZE;
        ctx.beginPath();
        ctx.arc(pixel.x + PIXEL_SIZE / 2, pixel.y + PIXEL_SIZE / 2, patinaSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pixel.material === "bone") {
      ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
      if (progress > 0.4) {
        ctx.strokeStyle = "rgba(139, 69, 19, 0.5)";
        ctx.lineWidth = 0.5;
        const numCracks = Math.floor((progress - 0.4) * 5);
        for (let i = 0; i < numCracks; i++) {
          ctx.beginPath();
          ctx.moveTo(pixel.x + PIXEL_SIZE * 0.2, pixel.y + i * (PIXEL_SIZE / Math.max(numCracks, 1)));
          ctx.lineTo(pixel.x + PIXEL_SIZE * 0.8, pixel.y + i * (PIXEL_SIZE / Math.max(numCracks, 1)) + PIXEL_SIZE * 0.2);
          ctx.stroke();
        }
      }
    } else {
      ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!isPausedRef.current) {
      let decayed = 0;
      const keysToDelete: string[] = [];
      
      pixelsRef.current.forEach((pixel, key) => {
        if (!updatePixel(pixel)) {
          keysToDelete.push(key);
          decayed++;
        }
      });
      
      keysToDelete.forEach((key) => pixelsRef.current.delete(key));
      
      if (decayed > 0) {
        setDecayedCount((prev) => prev + decayed);
        setPixelCount(pixelsRef.current.size);
      }
    }

    pixelsRef.current.forEach((pixel) => {
      drawPixel(ctx, pixel);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [updatePixel, drawPixel]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / PIXEL_SIZE) * PIXEL_SIZE;
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / PIXEL_SIZE) * PIXEL_SIZE;
    
    const key = getPixelKey(x, y);
    if (!pixelsRef.current.has(key)) {
      pixelsRef.current.set(key, createPixel(x, y, selectedMaterial));
      setPixelCount(pixelsRef.current.size);
    }
  };

  const clearCanvas = () => {
    pixelsRef.current.clear();
    setPixelCount(0);
    setDecayedCount(0);
  };

  return (
    <FeatureWrapper day={362} title="Pixel Decay Painter" emoji="🍂">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <p className="text-lg mb-2 text-gray-400">
            Paint with time. Every pixel ages, decays, and eventually returns to nothing.
          </p>
          <p className="text-sm italic text-gray-500">
            &ldquo;Nothing lasts forever, not even in the digital realm&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {(Object.entries(MATERIALS) as [MaterialType, Material][]).map(([key, mat]) => (
            <button
              key={key}
              onClick={() => setSelectedMaterial(key)}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                selectedMaterial === key
                  ? "ring-2 ring-offset-2 ring-blue-500 ring-offset-gray-900"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{
                backgroundColor: mat.baseColor,
                color: ["bone", "ash"].includes(key) ? "#000" : "#fff",
              }}
              title={mat.description}
            >
              <span>{mat.emoji}</span>
              <span className="text-sm font-medium">{mat.name}</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-center max-w-md text-gray-500">
          {MATERIALS[selectedMaterial]?.description ?? "Select a material"}
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-xl cursor-crosshair shadow-2xl"
          style={{
            backgroundColor: "#1a1a2e",
            maxWidth: "100%",
            height: "auto",
          }}
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={handleCanvasInteraction}
          onClick={(e) => {
            setIsDrawing(true);
            handleCanvasInteraction(e);
            setIsDrawing(false);
          }}
        />

        <div className="flex flex-wrap justify-center gap-4 items-center">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {isPaused ? "▶️ Resume Decay" : "⏸️ Pause Time"}
          </button>
          
          <button
            onClick={clearCanvas}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            🗑️ Clear All
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Time Speed:
            </span>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm font-mono text-white">
              {timeScale}x
            </span>
          </div>
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {pixelCount}
            </div>
            <div className="text-xs text-gray-500">
              Living Pixels
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-500">
              {decayedCount}
            </div>
            <div className="text-xs text-gray-500">
              Returned to Dust
            </div>
          </div>
        </div>

        <div className="text-xs text-center max-w-sm p-3 rounded-lg bg-gray-800 text-gray-400">
          💡 <strong>Tip:</strong> Try painting with different materials and watch how they age uniquely.
          Ember burns fast and bright, while Bone endures and cracks over centuries.
        </div>
      </div>
    </FeatureWrapper>
  );
}