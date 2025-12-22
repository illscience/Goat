"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  bounce: number;
  grounded: boolean;
  friction: number;
}

interface DustCloud {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  pixels: { x: number; y: number; color: string; destroyed: boolean }[];
  destroyed: boolean;
}

const BUILDING_COLORS = [
  ["#FF6B6B", "#EE5A5A", "#CC4444"],
  ["#4ECDC4", "#3DBDB5", "#2CA8A0"],
  ["#45B7D1", "#34A6C0", "#2390A8"],
  ["#96CEB4", "#85BDA3", "#6FA88D"],
  ["#FFEAA7", "#EED996", "#D4BF7C"],
  ["#DDA0DD", "#CC8FCC", "#B87EB8"],
  ["#F4A460", "#E39350", "#C87E3F"],
];

const PIXEL_SIZE = 8;

export default function PixelDemolitionDerby() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const dustCloudsRef = useRef<DustCloud[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const [score, setScore] = useState(0);
  const [totalDestroyed, setTotalDestroyed] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [message, setMessage] = useState("Click on buildings to destroy them!");

  const generateBuilding = useCallback((x: number, canvasHeight: number): Building => {
    const width = Math.floor(Math.random() * 6 + 4) * PIXEL_SIZE;
    const height = Math.floor(Math.random() * 12 + 8) * PIXEL_SIZE;
    const colorPalette = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
    const pixels: Building["pixels"] = [];

    for (let py = 0; py < height; py += PIXEL_SIZE) {
      for (let px = 0; px < width; px += PIXEL_SIZE) {
        const isWindow = Math.random() > 0.6 && py > PIXEL_SIZE && py < height - PIXEL_SIZE;
        const color = isWindow
          ? "#FFFFCC"
          : colorPalette[Math.floor(Math.random() * colorPalette.length)];
        pixels.push({ x: px, y: py, color, destroyed: false });
      }
    }

    return {
      x,
      y: canvasHeight - height,
      width,
      height,
      pixels,
      destroyed: false,
    };
  }, []);

  const initBuildings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const buildings: Building[] = [];
    let currentX = 20;

    while (currentX < canvas.width - 60) {
      const building = generateBuilding(currentX, canvas.height);
      buildings.push(building);
      currentX += building.width + Math.floor(Math.random() * 20 + 10);
    }

    buildingsRef.current = buildings;
  }, [generateBuilding]);

  const createExplosion = useCallback((x: number, y: number, pixels: Building["pixels"], buildingX: number, buildingY: number) => {
    const newParticles: Particle[] = [];
    const newDust: DustCloud[] = [];

    pixels.forEach((pixel) => {
      if (pixel.destroyed) return;

      const distance = Math.sqrt(
        Math.pow(buildingX + pixel.x - x, 2) + Math.pow(buildingY + pixel.y - y, 2)
      );

      if (distance < 60) {
        pixel.destroyed = true;
        const angle = Math.atan2(buildingY + pixel.y - y, buildingX + pixel.x - x);
        const force = (60 - distance) / 10;

        newParticles.push({
          x: buildingX + pixel.x,
          y: buildingY + pixel.y,
          vx: Math.cos(angle) * force * (Math.random() * 2 + 1),
          vy: Math.sin(angle) * force * (Math.random() * 2 + 1) - 5,
          width: PIXEL_SIZE,
          height: PIXEL_SIZE,
          color: pixel.color,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          gravity: 0.3,
          bounce: 0.5,
          grounded: false,
          friction: 0.98,
        });
      }
    });

    for (let i = 0; i < 5; i++) {
      newDust.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        radius: 5,
        maxRadius: Math.random() * 40 + 20,
        alpha: 0.8,
        color: `hsl(${Math.random() * 30 + 20}, 30%, 70%)`,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
    dustCloudsRef.current = [...dustCloudsRef.current, ...newDust];

    return newParticles.length;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let destroyed = 0;
    const messages = [
      "BOOM! 💥",
      "CRASH! 🔨",
      "KABOOM! 🎆",
      "SMASH! ⚡",
      "WRECKED! 🏚️",
      "DEMOLISHED! 🔥",
      "OBLITERATED! 💣",
    ];

    buildingsRef.current.forEach((building) => {
      if (
        x >= building.x &&
        x <= building.x + building.width &&
        y >= building.y &&
        y <= building.y + building.height
      ) {
        destroyed = createExplosion(x, y, building.pixels, building.x, building.y);

        const allDestroyed = building.pixels.every((p) => p.destroyed);
        if (allDestroyed) {
          building.destroyed = true;
        }
      }
    });

    if (destroyed > 0) {
      setScore((prev) => prev + destroyed * 10);
      setTotalDestroyed((prev) => prev + destroyed);
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
    }
  }, [createExplosion]);

  const reset = useCallback(() => {
    particlesRef.current = [];
    dustCloudsRef.current = [];
    initBuildings();
    setScore(0);
    setTotalDestroyed(0);
    setMessage("Fresh buildings ready for destruction! 🏗️");
  }, [initBuildings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initBuildings();

    const animate = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
        ctx.fillRect(
          (Math.sin(i * 100) * 0.5 + 0.5) * canvas.width,
          (Math.cos(i * 100) * 0.5 + 0.5) * canvas.height * 0.6,
          2,
          2
        );
      }

      // Draw ground
      ctx.fillStyle = "#2d2d44";
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

      // Draw buildings
      buildingsRef.current.forEach((building) => {
        if (building.destroyed) return;
        building.pixels.forEach((pixel) => {
          if (!pixel.destroyed) {
            ctx.fillStyle = pixel.color;
            ctx.fillRect(
              building.x + pixel.x,
              building.y + pixel.y,
              PIXEL_SIZE - 1,
              PIXEL_SIZE - 1
            );
          }
        });
      });

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.vy += particle.gravity;
        particle.vx *= particle.friction;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        if (particle.y + particle.height > canvas.height - 10) {
          particle.y = canvas.height - 10 - particle.height;
          particle.vy *= -particle.bounce;
          particle.vx *= 0.8;
          if (Math.abs(particle.vy) < 0.5) {
            particle.grounded = true;
          }
        }

        if (particle.x < 0) {
          particle.x = 0;
          particle.vx *= -particle.bounce;
        }
        if (particle.x + particle.width > canvas.width) {
          particle.x = canvas.width - particle.width;
          particle.vx *= -particle.bounce;
        }

        ctx.save();
        ctx.translate(
          particle.x + particle.width / 2,
          particle.y + particle.height / 2
        );
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width - 1,
          particle.height - 1
        );
        ctx.restore();

        return particle.y < canvas.height + 10 && !particle.grounded;
      });

      // Update and draw dust clouds
      dustCloudsRef.current = dustCloudsRef.current.filter((dust) => {
        dust.radius += 2;
        dust.alpha -= 0.02;
        dust.y -= 0.5;

        if (dust.alpha > 0) {
          ctx.beginPath();
          ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 160, 140, ${dust.alpha})`;
          ctx.fill();
        }

        return dust.alpha > 0;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [initBuildings]);

  return (
    <FeatureWrapper day={387} title="Pixel Demolition Derby" emoji="🏗️💥">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Unleash Your Inner Destroyer
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click on buildings to watch them crumble into satisfying pixel debris! 🔨
          </p>
        </div>

        <div className="flex gap-8 text-center">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Score
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {score.toLocaleString()}
            </div>
          </div>
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Pixels Destroyed
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {totalDestroyed}
            </div>
          </div>
        </div>

        <div
          className={`text-xl font-bold transition-all duration-200 ${
            isShaking ? "animate-pulse scale-110" : ""
          }`}
          style={{ color: "var(--color-accent)" }}
        >
          {message}
        </div>

        <div
          className={`rounded-lg overflow-hidden border-2 transition-transform duration-100 ${
            isShaking ? "translate-x-1" : ""
          }`}
          style={{
            borderColor: "var(--color-border)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={700}
            height={400}
            onClick={handleClick}
            className="cursor-crosshair"
            style={{ display: "block" }}
          />
        </div>

        <div className="flex gap-4">
          <button onClick={reset} className="btn-primary px-6 py-2 rounded-lg">
            🏗️ Rebuild City
          </button>
        </div>

        <div
          className="text-sm text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Pro tip: Click directly on buildings for maximum destruction. 
          Watch the debris fly and settle with realistic physics!
        </div>
      </div>
    </FeatureWrapper>
  );
}