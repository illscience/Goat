"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Puppet {
  id: string;
  type: "circle" | "triangle" | "square" | "star" | "heart";
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  height: number; // Distance from the "wall" (z-axis simulation)
}

interface LightSource {
  x: number;
  y: number;
  intensity: number;
}

const PUPPET_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

const PUPPET_TYPES: Puppet["type"][] = ["circle", "triangle", "square", "star", "heart"];

export default function PixelShadowPuppets() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [puppets, setPuppets] = useState<Puppet[]>([]);
  const [light, setLight] = useState<LightSource>({ x: 400, y: 100, intensity: 1 });
  const [selectedPuppet, setSelectedPuppet] = useState<string | null>(null);
  const [isDraggingLight, setIsDraggingLight] = useState(false);
  const [selectedType, setSelectedType] = useState<Puppet["type"]>("circle");
  const [selectedColor, setSelectedColor] = useState(PUPPET_COLORS[0]);

  const drawShape = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      type: Puppet["type"],
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      alpha: number = 1
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();

      switch (type) {
        case "circle":
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          break;
        case "square":
          ctx.rect(-size / 2, -size / 2, size, size);
          break;
        case "triangle":
          ctx.moveTo(0, -size / 2);
          ctx.lineTo(size / 2, size / 2);
          ctx.lineTo(-size / 2, size / 2);
          ctx.closePath();
          break;
        case "star":
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * (size / 2);
            const py = Math.sin(angle) * (size / 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case "heart":
          const s = size / 2;
          ctx.moveTo(0, s * 0.3);
          ctx.bezierCurveTo(-s, -s * 0.3, -s, -s * 0.8, 0, -s * 0.4);
          ctx.bezierCurveTo(s, -s * 0.8, s, -s * 0.3, 0, s * 0.3);
          break;
      }

      ctx.fill();
      ctx.restore();
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the "wall" (back surface where shadows appear)
    ctx.fillStyle = "#16213e";
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

    // Draw shadows first (they go on the wall)
    puppets.forEach((puppet) => {
      const heightFactor = puppet.height / 100;
      const shadowOffsetX = (puppet.x - light.x) * heightFactor * 0.8;
      const shadowOffsetY = (puppet.y - light.y) * heightFactor * 0.5;
      const shadowScale = 1 + heightFactor * 1.5;
      const shadowBlur = heightFactor * 20;

      // Calculate shadow position on the wall
      const shadowX = puppet.x + shadowOffsetX;
      const shadowY = Math.max(canvas.height * 0.5, puppet.y + shadowOffsetY + 100);

      // Distance from light affects shadow opacity
      const distFromLight = Math.sqrt(
        Math.pow(puppet.x - light.x, 2) + Math.pow(puppet.y - light.y, 2)
      );
      const shadowAlpha = Math.max(0.1, 0.7 - distFromLight / 1000);

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      drawShape(
        ctx,
        puppet.type,
        shadowX,
        shadowY,
        puppet.size * shadowScale,
        puppet.rotation + shadowOffsetX * 0.1,
        `rgba(0, 0, 0, ${shadowAlpha})`,
        1
      );
      ctx.restore();
    });

    // Draw puppets (floating above the wall)
    puppets.forEach((puppet) => {
      // Puppet glow based on light distance
      const distFromLight = Math.sqrt(
        Math.pow(puppet.x - light.x, 2) + Math.pow(puppet.y - light.y, 2)
      );
      const glowIntensity = Math.max(0, 1 - distFromLight / 400);

      if (glowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = puppet.color;
        ctx.shadowBlur = 20 * glowIntensity;
        drawShape(ctx, puppet.type, puppet.x, puppet.y, puppet.size, puppet.rotation, puppet.color);
        ctx.restore();
      } else {
        drawShape(ctx, puppet.type, puppet.x, puppet.y, puppet.size, puppet.rotation, puppet.color);
      }

      // Selection indicator
      if (selectedPuppet === puppet.id) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(puppet.x, puppet.y, puppet.size / 2 + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw light source
    const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 60);
    gradient.addColorStop(0, "rgba(255, 255, 200, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 150, 0.6)");
    gradient.addColorStop(1, "rgba(255, 255, 100, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(light.x, light.y, 60, 0, Math.PI * 2);
    ctx.fill();

    // Light bulb icon
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(light.x, light.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💡", light.x, light.y);

    frameRef.current = requestAnimationFrame(render);
  }, [puppets, light, selectedPuppet, drawShape]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(render);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [render]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on light
    const distToLight = Math.sqrt(Math.pow(x - light.x, 2) + Math.pow(y - light.y, 2));
    if (distToLight < 30) {
      setIsDraggingLight(true);
      setSelectedPuppet(null);
      return;
    }

    // Check if clicking on a puppet
    for (const puppet of puppets) {
      const dist = Math.sqrt(Math.pow(x - puppet.x, 2) + Math.pow(y - puppet.y, 2));
      if (dist < puppet.size / 2 + 10) {
        setSelectedPuppet(puppet.id);
        return;
      }
    }

    setSelectedPuppet(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDraggingLight) {
      setLight((prev) => ({ ...prev, x, y }));
    } else if (selectedPuppet && e.buttons === 1) {
      setPuppets((prev) =>
        prev.map((p) => (p.id === selectedPuppet ? { ...p, x, y: Math.min(y, canvas.height * 0.4) } : p))
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingLight(false);
  };

  const addPuppet = () => {
    const newPuppet: Puppet = {
      id: `puppet-${Date.now()}`,
      type: selectedType,
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 150,
      size: 40 + Math.random() * 40,
      color: selectedColor,
      rotation: Math.random() * 360,
      height: 30 + Math.random() * 70,
    };
    setPuppets((prev) => [...prev, newPuppet]);
    setSelectedPuppet(newPuppet.id);
  };

  const deletePuppet = () => {
    if (selectedPuppet) {
      setPuppets((prev) => prev.filter((p) => p.id !== selectedPuppet));
      setSelectedPuppet(null);
    }
  };

  const rotatePuppet = (direction: number) => {
    if (selectedPuppet) {
      setPuppets((prev) =>
        prev.map((p) => (p.id === selectedPuppet ? { ...p, rotation: p.rotation + direction * 15 } : p))
      );
    }
  };

  const adjustHeight = (delta: number) => {
    if (selectedPuppet) {
      setPuppets((prev) =>
        prev.map((p) =>
          p.id === selectedPuppet ? { ...p, height: Math.max(10, Math.min(100, p.height + delta)) } : p
        )
      );
    }
  };

  const clearAll = () => {
    setPuppets([]);
    setSelectedPuppet(null);
  };

  return (
    <FeatureWrapper day={410} title="Pixel Shadow Puppets" emoji="🎭">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Create Your Shadow Theater ✨
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Place colorful puppets and watch their shadows dance! Drag the 💡 light source to make
            shadows stretch, shrink, and play. Click puppets to select them.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex gap-2 items-center">
            <span style={{ color: "var(--color-text-dim)" }} className="text-sm">
              Shape:
            </span>
            {PUPPET_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  selectedType === type ? "ring-2 ring-offset-2" : ""
                }`}
                style={{
                  backgroundColor: selectedType === type ? "var(--color-accent)" : "var(--color-bg-secondary)",
                }}
              >
                {type === "circle" && "⭕"}
                {type === "square" && "⬜"}
                {type === "triangle" && "🔺"}
                {type === "star" && "⭐"}
                {type === "heart" && "💜"}
              </button>
            ))}
          </div>

          <div className="flex gap-1 items-center">
            <span style={{ color: "var(--color-text-dim)" }} className="text-sm mr-1">
              Color:
            </span>
            {PUPPET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full transition-all ${
                  selectedColor === color ? "ring-2 ring-offset-2 scale-110" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={addPuppet} className="btn-primary">
            ➕ Add Puppet
          </button>
          <button onClick={deletePuppet} className="btn-secondary" disabled={!selectedPuppet}>
            🗑️ Delete
          </button>
          <button onClick={() => rotatePuppet(-1)} className="btn-secondary" disabled={!selectedPuppet}>
            ↪️ Rotate
          </button>
          <button onClick={() => rotatePuppet(1)} className="btn-secondary" disabled={!selectedPuppet}>
            ↩️ Rotate
          </button>
          <button onClick={() => adjustHeight(10)} className="btn-secondary" disabled={!selectedPuppet}>
            ⬆️ Raise
          </button>
          <button onClick={() => adjustHeight(-10)} className="btn-secondary" disabled={!selectedPuppet}>
            ⬇️ Lower
          </button>
          <button onClick={clearAll} className="btn-secondary">
            🧹 Clear All
          </button>
        </div>

        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ border: "2px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="cursor-pointer"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        <div
          className="text-center text-sm p-4 rounded-lg max-w-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}
        >
          <strong>🎯 Tips:</strong> Drag the light bulb to move shadows • Click and drag puppets to
          reposition • Use ⬆️⬇️ to adjust how high puppets &quot;float&quot; (affects shadow size!) • The closer
          to the light, the more they glow!
        </div>
      </div>
    </FeatureWrapper>
  );
}