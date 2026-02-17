"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Star {
  id: string;
  x: number;
  y: number;
  brightness: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ConstellationPoint {
  x: number;
  y: number;
}

interface Constellation {
  id: string;
  points: ConstellationPoint[];
  message: string;
  color: string;
  createdAt: number;
  opacity: number;
}

const CONSTELLATION_COLORS = [
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#f87171", // red
];

export default function PixelConstellationMessenger() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [stars, setStars] = useState<Star[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [currentPoints, setCurrentPoints] = useState<ConstellationPoint[]>([]);
  const [message, setMessage] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Generate random stars
  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = [];
      const numStars = 200;
      
      for (let i = 0; i < numStars; i++) {
        newStars.push({
          id: `star-${i}`,
          x: Math.random() * 100,
          y: Math.random() * 100,
          brightness: 0.3 + Math.random() * 0.7,
          size: 1 + Math.random() * 2,
          twinkleSpeed: 0.5 + Math.random() * 2,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
      setStars(newStars);
    };

    generateStars();

    // Load saved constellations from localStorage
    const saved = localStorage.getItem("cosmic-constellations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConstellations(parsed);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save constellations to localStorage
  useEffect(() => {
    if (constellations.length > 0) {
      localStorage.setItem("cosmic-constellations", JSON.stringify(constellations));
    }
  }, [constellations]);

  // Canvas drawing
  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas with dark background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw distant galaxy effects
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.3, canvas.height * 0.4, 0,
      canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4
    );
    gradient.addColorStop(0, "rgba(88, 28, 135, 0.1)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient2 = ctx.createRadialGradient(
      canvas.width * 0.7, canvas.height * 0.6, 0,
      canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.3
    );
    gradient2.addColorStop(0, "rgba(30, 58, 138, 0.08)");
    gradient2.addColorStop(1, "transparent");
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars with twinkling
    stars.forEach((star) => {
      const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
      const alpha = star.brightness * twinkle;
      
      const x = (star.x / 100) * canvas.width;
      const y = (star.y / 100) * canvas.height;

      // Star glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3);
      glowGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
      glowGradient.addColorStop(0.5, `rgba(200, 220, 255, ${alpha * 0.3})`);
      glowGradient.addColorStop(1, "transparent");
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Star core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw saved constellations
    constellations.forEach((constellation) => {
      if (constellation.points.length < 2) return;

      ctx.strokeStyle = constellation.color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = constellation.opacity * (0.6 + Math.sin(time * 0.002) * 0.2);

      ctx.beginPath();
      const firstPoint = constellation.points[0];
      ctx.moveTo(
        (firstPoint.x / 100) * canvas.width,
        (firstPoint.y / 100) * canvas.height
      );

      constellation.points.slice(1).forEach((point) => {
        ctx.lineTo(
          (point.x / 100) * canvas.width,
          (point.y / 100) * canvas.height
        );
      });
      ctx.stroke();

      // Draw constellation points
      constellation.points.forEach((point) => {
        const px = (point.x / 100) * canvas.width;
        const py = (point.y / 100) * canvas.height;

        ctx.fillStyle = constellation.color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw message label
      const centerX = constellation.points.reduce((sum, p) => sum + p.x, 0) / constellation.points.length;
      const centerY = constellation.points.reduce((sum, p) => sum + p.y, 0) / constellation.points.length;
      
      ctx.font = "12px sans-serif";
      ctx.fillStyle = constellation.color;
      ctx.textAlign = "center";
      ctx.fillText(
        constellation.message,
        (centerX / 100) * canvas.width,
        (centerY / 100) * canvas.height - 20
      );
    });

    ctx.globalAlpha = 1;

    // Draw current drawing
    if (currentPoints.length > 0) {
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 10;

      ctx.beginPath();
      const firstPoint = currentPoints[0];
      ctx.moveTo(
        (firstPoint.x / 100) * canvas.width,
        (firstPoint.y / 100) * canvas.height
      );

      currentPoints.slice(1).forEach((point) => {
        ctx.lineTo(
          (point.x / 100) * canvas.width,
          (point.y / 100) * canvas.height
        );
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw points
      currentPoints.forEach((point) => {
        const px = (point.x / 100) * canvas.width;
        const py = (point.y / 100) * canvas.height;

        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Highlight hovered star
    if (hoveredStar && isDrawing) {
      const x = (hoveredStar.x / 100) * canvas.width;
      const y = (hoveredStar.y / 100) * canvas.height;

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    frameRef.current = requestAnimationFrame(draw);
  }, [stars, constellations, currentPoints, hoveredStar, isDrawing]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find nearest star
    const nearestStar = stars.reduce((nearest, star) => {
      const dist = Math.sqrt(Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2));
      const nearestDist = nearest 
        ? Math.sqrt(Math.pow(nearest.x - x, 2) + Math.pow(nearest.y - y, 2))
        : Infinity;
      return dist < nearestDist ? star : nearest;
    }, null as Star | null);

    if (nearestStar) {
      const dist = Math.sqrt(Math.pow(nearestStar.x - x, 2) + Math.pow(nearestStar.y - y, 2));
      if (dist < 5) {
        // Check if this point already exists
        const exists = currentPoints.some(
          p => Math.abs(p.x - nearestStar.x) < 0.1 && Math.abs(p.y - nearestStar.y) < 0.1
        );
        if (!exists) {
          setCurrentPoints([...currentPoints, { x: nearestStar.x, y: nearestStar.y }]);
        }
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      setHoveredStar(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find nearest star
    const nearestStar = stars.reduce((nearest, star) => {
      const dist = Math.sqrt(Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2));
      const nearestDist = nearest 
        ? Math.sqrt(Math.pow(nearest.x - x, 2) + Math.pow(nearest.y - y, 2))
        : Infinity;
      return dist < nearestDist ? star : nearest;
    }, null as Star | null);

    if (nearestStar) {
      const dist = Math.sqrt(Math.pow(nearestStar.x - x, 2) + Math.pow(nearestStar.y - y, 2));
      setHoveredStar(dist < 5 ? nearestStar : null);
    }
  };

  const saveConstellation = () => {
    if (currentPoints.length < 2 || !message.trim()) return;

    const newConstellation: Constellation = {
      id: `constellation-${Date.now()}`,
      points: currentPoints,
      message: message.trim(),
      color: CONSTELLATION_COLORS[Math.floor(Math.random() * CONSTELLATION_COLORS.length)],
      createdAt: Date.now(),
      opacity: 0.8,
    };

    setConstellations([...constellations, newConstellation]);
    setCurrentPoints([]);
    setMessage("");
    setIsDrawing(false);
  };

  const clearCurrentDrawing = () => {
    setCurrentPoints([]);
  };

  const undoLastPoint = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints(currentPoints.slice(0, -1));
    }
  };

  return (
    <FeatureWrapper day={444} title="Pixel Constellation Messenger" emoji="✨">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center space-y-2 mb-4">
          <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
            Write your message in the stars. Click to connect celestial dots and leave your cosmic mark.
          </p>
        </div>

        {showInstructions && (
          <div 
            className="rounded-lg p-4 mb-4 relative"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-2 right-2 text-sm opacity-60 hover:opacity-100"
            >
              ✕
            </button>
            <h3 className="font-semibold mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              🌌 How to create cosmic graffiti:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: "var(--color-text-dim)" }}>
              <li>Click &quot;Start Drawing&quot; to begin creating your constellation</li>
              <li>Click on stars in the night sky to connect them with glowing lines</li>
              <li>Type your message below to label your stellar artwork</li>
              <li>Click &quot;Save to Universe&quot; to immortalize your words among the stars</li>
            </ol>
          </div>
        )}

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl cursor-crosshair"
            style={{ 
              height: "450px",
              border: "1px solid var(--color-border)",
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
          />
          
          {!isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="px-6 py-3 rounded-full backdrop-blur-sm"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <span className="text-white/80">Click &quot;Start Drawing&quot; to create your constellation</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center">
          {!isDrawing ? (
            <button
              onClick={() => setIsDrawing(true)}
              className="btn-primary px-6 py-2 rounded-full font-medium"
            >
              ✨ Start Drawing
            </button>
          ) : (
            <>
              <button
                onClick={undoLastPoint}
                disabled={currentPoints.length === 0}
                className="btn-secondary px-4 py-2 rounded-full text-sm disabled:opacity-50"
              >
                ↩ Undo
              </button>
              <button
                onClick={clearCurrentDrawing}
                disabled={currentPoints.length === 0}
                className="btn-secondary px-4 py-2 rounded-full text-sm disabled:opacity-50"
              >
                🗑 Clear
              </button>
              <button
                onClick={() => {
                  setIsDrawing(false);
                  setCurrentPoints([]);
                }}
                className="btn-secondary px-4 py-2 rounded-full text-sm"
              >
                ✕ Cancel
              </button>
            </>
          )}
        </div>

        {isDrawing && (
          <div 
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-dim)" }}>
              <span>⭐ Points: {currentPoints.length}</span>
              {currentPoints.length < 2 && (
                <span className="text-amber-400">(Need at least 2 points)</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your cosmic message..."
                maxLength={50}
                className="flex-1 px-4 py-2 rounded-lg bg-transparent"
                style={{ 
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)"
                }}
              />
              <button
                onClick={saveConstellation}
                disabled={currentPoints.length < 2 || !message.trim()}
                className="btn-primary px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Save to Universe
              </button>
            </div>
          </div>
        )}

        {constellations.length > 0 && (
          <div 
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <h3 
              className="font-semibold mb-3"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              🌟 Constellations in this Universe ({constellations.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {constellations.map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: `${c.color}20`,
                    color: c.color,
                    border: `1px solid ${c.color}40`
                  }}
                >
                  {c.message}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                setConstellations([]);
                localStorage.removeItem("cosmic-constellations");
              }}
              className="mt-3 text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--color-text-dim)" }}
            >
              Clear all constellations
            </button>
          </div>
        )}

        <p 
          className="text-center text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Your constellations are saved locally and persist across visits. 
          Leave your mark on the cosmos! 🌌
        </p>
      </div>
    </FeatureWrapper>
  );
}