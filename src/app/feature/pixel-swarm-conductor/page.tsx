"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  swarmId: number;
  size: number;
}

interface Swarm {
  id: number;
  color: string;
  hue: number;
}

const PARTICLE_COUNT_PER_SWARM = 500;
const MAX_SPEED = 8;
const MOUSE_ATTRACTION = 0.15;
const SEPARATION_FORCE = 0.8;
const SEPARATION_RADIUS = 15;
const COHESION_FORCE = 0.01;
const ALIGNMENT_FORCE = 0.05;
const FRICTION = 0.98;

export default function PixelSwarmConductor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const swarmsRef = useRef<Swarm[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const [particleCount, setParticleCount] = useState(0);
  const [swarmCount, setSwarmCount] = useState(0);
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);

  const generateSwarmColor = useCallback(() => {
    const hue = Math.random() * 360;
    return {
      hue,
      color: `hsl(${hue}, 80%, 60%)`,
    };
  }, []);

  const createParticle = useCallback(
    (x: number, y: number, swarmId: number, color: string): Particle => {
      return {
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        swarmId,
        size: 2 + Math.random() * 2,
      };
    },
    []
  );

  const spawnSwarm = useCallback(
    (x: number, y: number) => {
      const { hue, color } = generateSwarmColor();
      const swarmId = Date.now();
      const newSwarm: Swarm = { id: swarmId, color, hue };
      swarmsRef.current.push(newSwarm);

      for (let i = 0; i < PARTICLE_COUNT_PER_SWARM; i++) {
        particlesRef.current.push(createParticle(x, y, swarmId, color));
      }

      setParticleCount(particlesRef.current.length);
      setSwarmCount(swarmsRef.current.length);
    },
    [generateSwarmColor, createParticle]
  );

  const initializeSwarm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = [];
    swarmsRef.current = [];

    spawnSwarm(canvas.width / 2, canvas.height / 2);
  }, [spawnSwarm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    initializeSwarm();

    const updateParticles = () => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse attraction
        if (isMouseInCanvas) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            p.vx += (dx / dist) * MOUSE_ATTRACTION;
            p.vy += (dy / dist) * MOUSE_ATTRACTION;
          }
        }

        // Separation from nearby particles
        let sepX = 0;
        let sepY = 0;
        let neighborCount = 0;
        let avgVx = 0;
        let avgVy = 0;
        let centerX = 0;
        let centerY = 0;

        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue;
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < SEPARATION_RADIUS && dist > 0) {
            sepX += dx / dist;
            sepY += dy / dist;
          }

          if (dist < 50 && p.swarmId === other.swarmId) {
            neighborCount++;
            avgVx += other.vx;
            avgVy += other.vy;
            centerX += other.x;
            centerY += other.y;
          }
        }

        // Apply separation
        p.vx += sepX * SEPARATION_FORCE;
        p.vy += sepY * SEPARATION_FORCE;

        // Alignment and cohesion for same swarm
        if (neighborCount > 0) {
          avgVx /= neighborCount;
          avgVy /= neighborCount;
          centerX /= neighborCount;
          centerY /= neighborCount;

          // Alignment
          p.vx += (avgVx - p.vx) * ALIGNMENT_FORCE;
          p.vy += (avgVy - p.vy) * ALIGNMENT_FORCE;

          // Cohesion
          p.vx += (centerX - p.x) * COHESION_FORCE;
          p.vy += (centerY - p.y) * COHESION_FORCE;
        }

        // Apply friction
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // Limit speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -0.8;
        }
        if (p.x > canvas.width) {
          p.x = canvas.width;
          p.vx *= -0.8;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -0.8;
        }
        if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -0.8;
        }
      }
    };

    const render = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      for (const p of particles) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const alpha = 0.5 + (speed / MAX_SPEED) * 0.5;
        const size = p.size + (speed / MAX_SPEED) * 2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace("60%)", `60%, ${alpha})`).replace("hsl", "hsla");
        ctx.fill();

        // Add glow effect for fast particles
        if (speed > MAX_SPEED * 0.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace("60%)", `60%, ${alpha * 0.3})`).replace("hsl", "hsla");
          ctx.fill();
        }
      }

      updateParticles();
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frameRef.current);
    };
  }, [initializeSwarm, isMouseInCanvas]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    spawnSwarm(x, y);
  };

  const clearAll = () => {
    particlesRef.current = [];
    swarmsRef.current = [];
    setParticleCount(0);
    setSwarmCount(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <FeatureWrapper day={395} title="Pixel Swarm Conductor" emoji="✨">
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
        <p
          className="text-center max-w-xl"
          style={{ color: "var(--color-text-dim)" }}
        >
          You are now the conductor of chaos. Move your mouse to command
          thousands of pixels. Click anywhere to spawn new swarms with unique
          colors. Watch as emergent beauty unfolds before your eyes. 🎭
        </p>

        <div className="flex gap-4 items-center flex-wrap justify-center">
          <div
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-dim)",
            }}
          >
            Particles: {particleCount.toLocaleString()}
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-dim)",
            }}
          >
            Swarms: {swarmCount}
          </div>
          <button className="btn-secondary text-sm" onClick={clearAll}>
            Clear Canvas
          </button>
        </div>

        <div
          className="relative w-full rounded-xl overflow-hidden border"
          style={{
            borderColor: "var(--color-border)",
            height: "500px",
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ backgroundColor: "#000" }}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseEnter={() => setIsMouseInCanvas(true)}
            onMouseLeave={() => setIsMouseInCanvas(false)}
          />

          {!isMouseInCanvas && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <p
                className="text-lg font-medium animate-pulse"
                style={{ color: "var(--color-text)" }}
              >
                Move your mouse here to conduct the swarm ✨
              </p>
            </div>
          )}
        </div>

        <div
          className="text-sm text-center"
          style={{ color: "var(--color-text-dim)" }}
        >
          <span className="font-semibold">Pro tips:</span> Click rapidly to
          create a rainbow storm 🌈 • Slow movements create elegant flows • Fast
          movements cause beautiful chaos
        </div>

        <div
          className="flex gap-2 flex-wrap justify-center mt-2"
          style={{ color: "var(--color-text-dim)" }}
        >
          {swarmsRef.current.slice(-5).map((swarm) => (
            <div
              key={swarm.id}
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: swarm.color }}
            />
          ))}
        </div>
      </div>
    </FeatureWrapper>
  );
}