"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Point {
  x: number;
  y: number;
}

interface FoldLine {
  start: Point;
  end: Point;
  completed: boolean;
}

interface CornerPoint {
  x: number;
  y: number;
  id: string;
  active: boolean;
}

interface OrigamiShape {
  name: string;
  icon: string;
  requiredFolds: number;
  pattern: number[][];
  unlocked: boolean;
}

const PAPER_DESIGNS = [
  { name: "Classic White", colors: ["#ffffff", "#f0f0f0"], unlocked: true },
  { name: "Cherry Blossom", colors: ["#ffb7c5", "#ff69b4"], unlocked: false },
  { name: "Ocean Wave", colors: ["#87ceeb", "#4169e1"], unlocked: false },
  { name: "Forest Green", colors: ["#90ee90", "#228b22"], unlocked: false },
  { name: "Sunset Gold", colors: ["#ffd700", "#ff8c00"], unlocked: false },
  { name: "Midnight Purple", colors: ["#9370db", "#4b0082"], unlocked: false },
];

const ORIGAMI_SHAPES: OrigamiShape[] = [
  {
    name: "Crane",
    icon: "🦢",
    requiredFolds: 4,
    pattern: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
    ],
    unlocked: true,
  },
  {
    name: "Fox",
    icon: "🦊",
    requiredFolds: 6,
    pattern: [
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 0, 0, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
    ],
    unlocked: false,
  },
  {
    name: "Boat",
    icon: "⛵",
    requiredFolds: 5,
    pattern: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    unlocked: false,
  },
  {
    name: "Heart",
    icon: "❤️",
    requiredFolds: 8,
    pattern: [
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    unlocked: false,
  },
];

export default function PixelOrigamiFolder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [foldLines, setFoldLines] = useState<FoldLine[]>([]);
  const [cornerPoints, setCornerPoints] = useState<CornerPoint[]>([]);
  const [selectedCorner, setSelectedCorner] = useState<CornerPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<Point | null>(null);
  const [completedFolds, setCompletedFolds] = useState(0);
  const [currentShape, setCurrentShape] = useState(ORIGAMI_SHAPES[0]);
  const [shapes, setShapes] = useState(ORIGAMI_SHAPES);
  const [paperDesigns, setPaperDesigns] = useState(PAPER_DESIGNS);
  const [currentDesign, setCurrentDesign] = useState(PAPER_DESIGNS[0]);
  const [revealedPixels, setRevealedPixels] = useState<boolean[][]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [message, setMessage] = useState("Click a corner to start folding! ✨");

  const CANVAS_SIZE = 400;
  const PAPER_SIZE = 300;
  const PAPER_OFFSET = (CANVAS_SIZE - PAPER_SIZE) / 2;
  const PIXEL_SIZE = PAPER_SIZE / 8;

  useEffect(() => {
    const corners: CornerPoint[] = [
      { x: PAPER_OFFSET, y: PAPER_OFFSET, id: "tl", active: true },
      { x: PAPER_OFFSET + PAPER_SIZE, y: PAPER_OFFSET, id: "tr", active: true },
      { x: PAPER_OFFSET, y: PAPER_OFFSET + PAPER_SIZE, id: "bl", active: true },
      { x: PAPER_OFFSET + PAPER_SIZE, y: PAPER_OFFSET + PAPER_SIZE, id: "br", active: true },
      { x: PAPER_OFFSET + PAPER_SIZE / 2, y: PAPER_OFFSET, id: "tm", active: true },
      { x: PAPER_OFFSET + PAPER_SIZE / 2, y: PAPER_OFFSET + PAPER_SIZE, id: "bm", active: true },
      { x: PAPER_OFFSET, y: PAPER_OFFSET + PAPER_SIZE / 2, id: "ml", active: true },
      { x: PAPER_OFFSET + PAPER_SIZE, y: PAPER_OFFSET + PAPER_SIZE / 2, id: "mr", active: true },
    ];
    setCornerPoints(corners);
    setRevealedPixels(Array(8).fill(null).map(() => Array(8).fill(false)));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw paper background
    const gradient = ctx.createLinearGradient(PAPER_OFFSET, PAPER_OFFSET, PAPER_OFFSET + PAPER_SIZE, PAPER_OFFSET + PAPER_SIZE);
    gradient.addColorStop(0, currentDesign.colors[0]);
    gradient.addColorStop(1, currentDesign.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(PAPER_OFFSET, PAPER_OFFSET, PAPER_SIZE, PAPER_SIZE);

    // Draw paper texture
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(PAPER_OFFSET + i * PIXEL_SIZE, PAPER_OFFSET);
      ctx.lineTo(PAPER_OFFSET + i * PIXEL_SIZE, PAPER_OFFSET + PAPER_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAPER_OFFSET, PAPER_OFFSET + i * PIXEL_SIZE);
      ctx.lineTo(PAPER_OFFSET + PAPER_SIZE, PAPER_OFFSET + i * PIXEL_SIZE);
      ctx.stroke();
    }

    // Draw revealed pixel art
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (revealedPixels[y]?.[x] && currentShape.pattern[y][x]) {
          ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
          ctx.fillRect(
            PAPER_OFFSET + x * PIXEL_SIZE + 2,
            PAPER_OFFSET + y * PIXEL_SIZE + 2,
            PIXEL_SIZE - 4,
            PIXEL_SIZE - 4
          );
        }
      }
    }

    // Draw completed fold lines
    ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    foldLines.forEach((fold) => {
      ctx.beginPath();
      ctx.moveTo(fold.start.x, fold.start.y);
      ctx.lineTo(fold.end.x, fold.end.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw current drag line
    if (isDragging && dragStart && dragEnd) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(dragStart.x, dragStart.y);
      ctx.lineTo(dragEnd.x, dragEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw corner points
    cornerPoints.forEach((point) => {
      const isSelected = selectedCorner?.id === point.id;
      ctx.beginPath();
      ctx.arc(point.x, point.y, isSelected ? 12 : 10, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "#3b82f6" : "#6b7280";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [cornerPoints, foldLines, selectedCorner, isDragging, dragStart, dragEnd, currentDesign, revealedPixels, currentShape, PIXEL_SIZE]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findNearestCorner = (point: Point): CornerPoint | null => {
    let nearest: CornerPoint | null = null;
    let minDist = 30;
    cornerPoints.forEach((corner) => {
      const dist = Math.sqrt(Math.pow(corner.x - point.x, 2) + Math.pow(corner.y - point.y, 2));
      if (dist < minDist) {
        minDist = dist;
        nearest = corner;
      }
    });
    return nearest;
  };

  const revealPixelsAlongLine = (start: Point, end: Point) => {
    const newRevealed = [...revealedPixels.map(row => [...row])];
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) / 10;
    
    for (let i = 0; i <= steps; i++) {
      const x = start.x + (dx * i) / steps;
      const y = start.y + (dy * i) / steps;
      
      const pixelX = Math.floor((x - PAPER_OFFSET) / PIXEL_SIZE);
      const pixelY = Math.floor((y - PAPER_OFFSET) / PIXEL_SIZE);
      
      if (pixelX >= 0 && pixelX < 8 && pixelY >= 0 && pixelY < 8) {
        newRevealed[pixelY][pixelX] = true;
        // Also reveal adjacent pixels for more visibility
        if (pixelX > 0) newRevealed[pixelY][pixelX - 1] = true;
        if (pixelX < 7) newRevealed[pixelY][pixelX + 1] = true;
        if (pixelY > 0) newRevealed[pixelY - 1][pixelX] = true;
        if (pixelY < 7) newRevealed[pixelY + 1][pixelX] = true;
      }
    }
    
    setRevealedPixels(newRevealed);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    const corner = findNearestCorner(point);
    
    if (corner) {
      setSelectedCorner(corner);
      setDragStart({ x: corner.x, y: corner.y });
      setIsDragging(true);
      setMessage("Drag to create a fold line! 📐");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;
    const point = getCanvasPoint(e);
    setDragEnd(point);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) {
      setIsDragging(false);
      setSelectedCorner(null);
      return;
    }

    const point = getCanvasPoint(e);
    const endCorner = findNearestCorner(point);
    
    if (endCorner && endCorner.id !== selectedCorner?.id) {
      const newFold: FoldLine = {
        start: dragStart,
        end: { x: endCorner.x, y: endCorner.y },
        completed: true,
      };
      
      setFoldLines([...foldLines, newFold]);
      revealPixelsAlongLine(dragStart, { x: endCorner.x, y: endCorner.y });
      
      const newCount = completedFolds + 1;
      setCompletedFolds(newCount);
      
      if (newCount >= currentShape.requiredFolds) {
        setShowCelebration(true);
        setMessage(`🎉 You made a ${currentShape.name}! Beautiful!`);
        
        // Unlock next shape and paper design
        const updatedShapes = shapes.map((s, i) => {
          if (i === shapes.findIndex(sh => sh.name === currentShape.name) + 1) {
            return { ...s, unlocked: true };
          }
          return s;
        });
        setShapes(updatedShapes);
        
        const updatedDesigns = paperDesigns.map((d, i) => {
          if (i === paperDesigns.findIndex(pd => pd.name === currentDesign.name) + 1) {
            return { ...d, unlocked: true };
          }
          return d;
        });
        setPaperDesigns(updatedDesigns);
        
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        const remaining = currentShape.requiredFolds - newCount;
        setMessage(`Great fold! ${remaining} more to complete the ${currentShape.name}! ✨`);
      }
    } else {
      setMessage("Connect to another corner point to create a fold! 🎯");
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setSelectedCorner(null);
  };

  const resetPaper = () => {
    setFoldLines([]);
    setCompletedFolds(0);
    setRevealedPixels(Array(8).fill(null).map(() => Array(8).fill(false)));
    setShowCelebration(false);
    setMessage("Fresh paper! Start folding! 📄");
  };

  return (
    <FeatureWrapper day={439} title="Pixel Origami Folder" emoji="🦢">
      <div className="flex flex-col items-center gap-6 p-4">
        <p className="text-center max-w-md" style={{ color: "var(--color-text-dim)" }}>
          The ancient art of paper folding meets pixel art! Click corners and drag 
          to create fold lines. Complete shapes to unlock new papers and patterns.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
            <span className="text-2xl">{currentShape.icon}</span>
            <span style={{ color: "var(--color-text)" }}>{currentShape.name}</span>
            <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              ({completedFolds}/{currentShape.requiredFolds} folds)
            </span>
          </div>
        </div>

        <div 
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            background: "var(--color-bg-secondary)",
            border: "2px solid var(--color-border)"
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
          />
          
          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 animate-pulse">
              <div className="text-6xl animate-bounce">
                {currentShape.icon}
              </div>
            </div>
          )}
        </div>

        <div 
          className="text-center py-2 px-4 rounded-lg min-h-[40px] flex items-center justify-center"
          style={{ 
            background: "var(--color-bg-secondary)",
            color: "var(--color-text)"
          }}
        >
          {message}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={resetPaper} className="btn-secondary px-4 py-2 rounded-lg">
            🔄 New Paper
          </button>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-2xl">
          <div>
            <h3 
              className="text-lg font-semibold mb-2 text-center"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
            >
              Shapes to Fold
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {shapes.map((shape) => (
                <button
                  key={shape.name}
                  onClick={() => shape.unlocked && setCurrentShape(shape)}
                  disabled={!shape.unlocked}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    currentShape.name === shape.name 
                      ? "ring-2 ring-offset-2" 
                      : ""
                  }`}
                  style={{ 
                    background: shape.unlocked ? "var(--color-bg-secondary)" : "var(--color-bg)",
                    color: shape.unlocked ? "var(--color-text)" : "var(--color-text-dim)",
                    opacity: shape.unlocked ? 1 : 0.5,
                    borderColor: "var(--color-accent)"
                  }}
                >
                  <span className="text-xl">{shape.unlocked ? shape.icon : "🔒"}</span>
                  <span className="text-sm">{shape.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 
              className="text-lg font-semibold mb-2 text-center"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
            >
              Paper Designs
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {paperDesigns.map((design) => (
                <button
                  key={design.name}
                  onClick={() => design.unlocked && setCurrentDesign(design)}
                  disabled={!design.unlocked}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    currentDesign.name === design.name 
                      ? "ring-2 ring-offset-2" 
                      : ""
                  }`}
                  style={{ 
                    background: design.unlocked 
                      ? `linear-gradient(135deg, ${design.colors[0]}, ${design.colors[1]})`
                      : "var(--color-bg)",
                    color: design.unlocked ? "#333" : "var(--color-text-dim)",
                    opacity: design.unlocked ? 1 : 0.5,
                    borderColor: "var(--color-accent)"
                  }}
                >
                  <span>{design.unlocked ? "📄" : "🔒"}</span>
                  <span className="text-sm font-medium">{design.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div 
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Tip: Connect corner points with fold lines to reveal the hidden pixel art. 
          Complete all required folds to unlock new shapes and paper designs!
        </div>
      </div>
    </FeatureWrapper>
  );
}