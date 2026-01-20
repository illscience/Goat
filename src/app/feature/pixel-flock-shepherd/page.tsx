"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Sheep {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  spooked: number;
  inPen: boolean;
  wobble: number;
}

interface Pen {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SHEEP_COLORS = [
  "#F5F5DC", // Beige
  "#FFFAF0", // Floral white
  "#FAF0E6", // Linen
  "#FFF8DC", // Cornsilk
  "#FAEBD7", // Antique white
  "#FFE4E1", // Misty rose
  "#E6E6FA", // Lavender
  "#F0FFF0", // Honeydew
];

export default function PixelFlockShepherd() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const sheepRef = useRef<Sheep[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const [sheepInPen, setSheepInPen] = useState(0);
  const [totalSheep, setTotalSheep] = useState(12);
  const [gameWon, setGameWon] = useState(false);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pen: Pen = {
    x: 50,
    y: 50,
    width: 120,
    height: 100,
  };

  const initializeSheep = useCallback((count: number, canvasWidth: number, canvasHeight: number) => {
    const newSheep: Sheep[] = [];
    for (let i = 0; i < count; i++) {
      newSheep.push({
        id: i,
        x: 200 + Math.random() * (canvasWidth - 250),
        y: 150 + Math.random() * (canvasHeight - 200),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: SHEEP_COLORS[Math.floor(Math.random() * SHEEP_COLORS.length)],
        size: 12 + Math.random() * 4,
        spooked: 0,
        inPen: false,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    return newSheep;
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    sheepRef.current = initializeSheep(totalSheep, canvas.width, canvas.height);
    setSheepInPen(0);
    setGameWon(false);
    setTime(0);
    setIsPlaying(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  }, [totalSheep, initializeSheep]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Spook nearby sheep
    sheepRef.current.forEach(sheep => {
      const dx = sheep.x - clickX;
      const dy = sheep.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        sheep.spooked = 1;
        const force = (150 - dist) / 150;
        sheep.vx += (dx / dist) * force * 8;
        sheep.vy += (dy / dist) * force * 8;
      }
    });
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSheep = () => {
      const sheep = sheepRef.current;
      let inPenCount = 0;

      sheep.forEach((s, i) => {
        // Decrease spook level
        s.spooked = Math.max(0, s.spooked - 0.02);
        s.wobble += 0.1;

        // Avoid cursor
        const dx = s.x - mouseRef.current.x;
        const dy = s.y - mouseRef.current.y;
        const cursorDist = Math.sqrt(dx * dx + dy * dy);
        if (cursorDist < 80) {
          const avoidForce = (80 - cursorDist) / 80;
          s.vx += (dx / cursorDist) * avoidForce * 0.5;
          s.vy += (dy / cursorDist) * avoidForce * 0.5;
        }

        // Flocking behavior
        let avgX = 0, avgY = 0, avgVx = 0, avgVy = 0;
        let separationX = 0, separationY = 0;
        let neighbors = 0;

        sheep.forEach((other, j) => {
          if (i === j) return;
          const odx = other.x - s.x;
          const ody = other.y - s.y;
          const dist = Math.sqrt(odx * odx + ody * ody);

          if (dist < 60) {
            neighbors++;
            avgX += other.x;
            avgY += other.y;
            avgVx += other.vx;
            avgVy += other.vy;

            // Separation
            if (dist < 25) {
              separationX -= odx / dist;
              separationY -= ody / dist;
            }
          }
        });

        if (neighbors > 0) {
          // Cohesion
          avgX /= neighbors;
          avgY /= neighbors;
          s.vx += (avgX - s.x) * 0.003;
          s.vy += (avgY - s.y) * 0.003;

          // Alignment
          avgVx /= neighbors;
          avgVy /= neighbors;
          s.vx += (avgVx - s.vx) * 0.05;
          s.vy += (avgVy - s.vy) * 0.05;

          // Separation
          s.vx += separationX * 0.1;
          s.vy += separationY * 0.1;
        }

        // Random wandering
        s.vx += (Math.random() - 0.5) * 0.1;
        s.vy += (Math.random() - 0.5) * 0.1;

        // Speed limit
        const maxSpeed = s.spooked > 0 ? 4 : 1.5;
        const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (speed > maxSpeed) {
          s.vx = (s.vx / speed) * maxSpeed;
          s.vy = (s.vy / speed) * maxSpeed;
        }

        // Friction
        s.vx *= 0.98;
        s.vy *= 0.98;

        // Update position
        s.x += s.vx;
        s.y += s.vy;

        // Boundary collision
        if (s.x < s.size) { s.x = s.size; s.vx *= -0.5; }
        if (s.x > canvas.width - s.size) { s.x = canvas.width - s.size; s.vx *= -0.5; }
        if (s.y < s.size) { s.y = s.size; s.vy *= -0.5; }
        if (s.y > canvas.height - s.size) { s.y = canvas.height - s.size; s.vy *= -0.5; }

        // Check if in pen
        if (s.x > pen.x && s.x < pen.x + pen.width &&
            s.y > pen.y && s.y < pen.y + pen.height) {
          s.inPen = true;
          inPenCount++;
          // Slow down in pen
          s.vx *= 0.9;
          s.vy *= 0.9;
        } else {
          s.inPen = false;
        }
      });

      setSheepInPen(inPenCount);
      if (inPenCount === sheep.length && sheep.length > 0 && !gameWon) {
        setGameWon(true);
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    const drawSheep = (s: Sheep) => {
      ctx.save();
      ctx.translate(s.x, s.y);

      // Wobble when moving
      const wobble = Math.sin(s.wobble) * 0.1 * (Math.abs(s.vx) + Math.abs(s.vy));
      ctx.rotate(wobble);

      // Body (fluffy cloud shape)
      ctx.fillStyle = s.color;
      ctx.beginPath();
      // Main body circles
      ctx.arc(0, 0, s.size, 0, Math.PI * 2);
      ctx.arc(-s.size * 0.5, -s.size * 0.3, s.size * 0.6, 0, Math.PI * 2);
      ctx.arc(s.size * 0.5, -s.size * 0.3, s.size * 0.6, 0, Math.PI * 2);
      ctx.arc(-s.size * 0.3, s.size * 0.5, s.size * 0.5, 0, Math.PI * 2);
      ctx.arc(s.size * 0.3, s.size * 0.5, s.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, s.size, 0, Math.PI * 2);
      ctx.stroke();

      // Head
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.ellipse(-s.size * 0.8, 0, s.size * 0.4, s.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(-s.size * 0.9, -s.size * 0.1, s.size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(-s.size * 0.88, -s.size * 0.1, s.size * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.ellipse(-s.size * 0.7, -s.size * 0.35, s.size * 0.15, s.size * 0.1, -0.5, 0, Math.PI * 2);
      ctx.ellipse(-s.size * 0.7, s.size * 0.35, s.size * 0.15, s.size * 0.1, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = "#333";
      ctx.fillRect(-s.size * 0.3, s.size * 0.7, 3, s.size * 0.4);
      ctx.fillRect(s.size * 0.2, s.size * 0.7, 3, s.size * 0.4);

      // Spooked indicator
      if (s.spooked > 0.5) {
        ctx.fillStyle = `rgba(255, 0, 0, ${s.spooked * 0.5})`;
        ctx.font = `${s.size * 0.8}px sans-serif`;
        ctx.fillText("!", -s.size * 0.2, -s.size * 1.2);
      }

      ctx.restore();
    };

    const draw = () => {
      ctx.fillStyle = "#4a7c23";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grass texture
      ctx.fillStyle = "#3d6b1c";
      for (let i = 0; i < 200; i++) {
        const gx = (i * 37) % canvas.width;
        const gy = (i * 43) % canvas.height;
        ctx.fillRect(gx, gy, 2, 4);
      }

      // Draw pen
      ctx.fillStyle = "#8B4513";
      ctx.strokeStyle = "#5D3A1A";
      ctx.lineWidth = 8;
      
      // Pen floor
      ctx.fillStyle = "#D2B48C";
      ctx.fillRect(pen.x, pen.y, pen.width, pen.height);
      
      // Pen fences
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 6;
      ctx.strokeRect(pen.x, pen.y, pen.width, pen.height);
      
      // Fence posts
      ctx.fillStyle = "#654321";
      for (let i = 0; i <= pen.width; i += 20) {
        ctx.fillRect(pen.x + i - 4, pen.y - 8, 8, 16);
        ctx.fillRect(pen.x + i - 4, pen.y + pen.height - 8, 8, 16);
      }
      for (let i = 0; i <= pen.height; i += 20) {
        ctx.fillRect(pen.x - 8, pen.y + i - 4, 16, 8);
        ctx.fillRect(pen.x + pen.width - 8, pen.y + i - 4, 16, 8);
      }

      // Draw sheep
      sheepRef.current.forEach(drawSheep);

      // Draw cursor indicator
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 80, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isPlaying) {
        updateSheep();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, gameWon, pen.x, pen.y, pen.width, pen.height]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <FeatureWrapper day={416} title="Pixel Flock Shepherd" emoji="🐑">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Guide Your Fluffy Friends Home! 🏠
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Move your cursor to gently push the sheep toward the pen. 
            Click to spook stubborn ones (but use sparingly - they&apos;re sensitive souls!)
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>🐑 In Pen: </span>
            <span className="font-bold" style={{ color: "var(--color-accent)" }}>
              {sheepInPen} / {totalSheep}
            </span>
          </div>
          
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <span style={{ color: "var(--color-text-dim)" }}>⏱️ Time: </span>
            <span className="font-bold" style={{ color: "var(--color-text)" }}>
              {formatTime(time)}
            </span>
          </div>

          <button
            onClick={startGame}
            className="btn-primary px-6 py-2 rounded-lg font-semibold"
          >
            {isPlaying ? "🔄 Restart" : gameWon ? "🎉 Play Again" : "🎮 Start Game"}
          </button>
        </div>

        {gameWon && (
          <div 
            className="text-center p-4 rounded-xl animate-pulse"
            style={{ 
              backgroundColor: "rgba(74, 124, 35, 0.2)", 
              border: "2px solid #4a7c23" 
            }}
          >
            <h3 
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "#4a7c23" }}
            >
              🎊 All sheep are home! 🎊
            </h3>
            <p style={{ color: "var(--color-text)" }}>
              You herded them all in {formatTime(time)}! What a skilled shepherd!
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { mouseRef.current = { x: -100, y: -100 }; }}
          onClick={handleClick}
          className="rounded-xl cursor-none"
          style={{ 
            border: "4px solid var(--color-border)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}
        />

        <div 
          className="flex flex-col gap-2 items-center p-4 rounded-lg max-w-md text-center"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>
            🧠 Shepherd Tips
          </h4>
          <ul className="text-sm space-y-1" style={{ color: "var(--color-text-dim)" }}>
            <li>• Sheep naturally flock together - use this to your advantage!</li>
            <li>• Position yourself behind stragglers to push them toward the group</li>
            <li>• Clicks create panic - great for emergencies, bad for precision</li>
            <li>• Patience is key - sudden movements scatter the flock</li>
          </ul>
        </div>

        <div className="flex gap-2 items-center">
          <span style={{ color: "var(--color-text-dim)" }}>Flock size:</span>
          {[8, 12, 16, 20].map(count => (
            <button
              key={count}
              onClick={() => {
                setTotalSheep(count);
                if (!isPlaying) {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    sheepRef.current = initializeSheep(count, canvas.width, canvas.height);
                  }
                }
              }}
              className={`px-3 py-1 rounded ${totalSheep === count ? "btn-primary" : "btn-secondary"}`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
    </FeatureWrapper>
  );
}