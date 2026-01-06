"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originalX: number;
  originalY: number;
  hue: number;
  size: number;
  trail: { x: number; y: number }[];
  alive: boolean;
  age: number;
}

interface Blackhole {
  x: number;
  y: number;
  mass: number;
  radius: number;
  id: number;
  pulsePhase: number;
  particlesConsumed: number;
}

export default function PixelBlackholeEater() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const blackholesRef = useRef<Blackhole[]>([]);
  const frameRef = useRef<number>(0);
  const nextBlackholeId = useRef<number>(0);
  const [blackholeCount, setBlackholeCount] = useState(0);
  const [particleCount, setParticleCount] = useState(0);
  const [totalConsumed, setTotalConsumed] = useState(0);
  const [isSpawning, setIsSpawning] = useState(true);

  const spawnParticle = useCallback((width: number, height: number): Particle => {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number, vx: number, vy: number;
    
    const speed = 0.5 + Math.random() * 1.5;
    
    switch (side) {
      case 0: // top
        x = Math.random() * width;
        y = -10;
        vx = (Math.random() - 0.5) * 2;
        vy = speed;
        break;
      case 1: // right
        x = width + 10;
        y = Math.random() * height;
        vx = -speed;
        vy = (Math.random() - 0.5) * 2;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + 10;
        vx = (Math.random() - 0.5) * 2;
        vy = -speed;
        break;
      default: // left
        x = -10;
        y = Math.random() * height;
        vx = speed;
        vy = (Math.random() - 0.5) * 2;
    }
    
    return {
      x,
      y,
      vx,
      vy,
      originalX: x,
      originalY: y,
      hue: Math.random() * 360,
      size: 2 + Math.random() * 3,
      trail: [],
      alive: true,
      age: 0,
    };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newBlackhole: Blackhole = {
      x,
      y,
      mass: 5000 + Math.random() * 3000,
      radius: 15 + Math.random() * 10,
      id: nextBlackholeId.current++,
      pulsePhase: Math.random() * Math.PI * 2,
      particlesConsumed: 0,
    };
    
    blackholesRef.current.push(newBlackhole);
    setBlackholeCount(blackholesRef.current.length);
  }, []);

  const clearAll = useCallback(() => {
    blackholesRef.current = [];
    particlesRef.current = [];
    setBlackholeCount(0);
    setParticleCount(0);
    setTotalConsumed(0);
  }, []);

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
    
    let lastSpawnTime = 0;
    const spawnInterval = 50;
    
    const animate = (timestamp: number) => {
      const { width, height } = canvas;
      
      // Spawn new particles
      if (isSpawning && timestamp - lastSpawnTime > spawnInterval && particlesRef.current.length < 500) {
        particlesRef.current.push(spawnParticle(width, height));
        lastSpawnTime = timestamp;
      }
      
      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);
      
      // Update and draw blackholes
      let consumed = 0;
      blackholesRef.current.forEach((bh) => {
        bh.pulsePhase += 0.05;
        consumed += bh.particlesConsumed;
        
        // Draw accretion disk
        const pulseRadius = bh.radius + Math.sin(bh.pulsePhase) * 5;
        const gradient = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, pulseRadius * 3);
        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(0.3, "rgba(100, 0, 150, 0.5)");
        gradient.addColorStop(0.6, "rgba(255, 100, 50, 0.3)");
        gradient.addColorStop(1, "rgba(255, 200, 100, 0)");
        
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, pulseRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw event horizon
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.strokeStyle = `hsl(${280 + Math.sin(bh.pulsePhase) * 30}, 80%, 50%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      setTotalConsumed(consumed);
      
      // Update particles
      particlesRef.current.forEach((particle) => {
        if (!particle.alive) return;
        
        particle.age++;
        
        // Add current position to trail
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 20) {
          particle.trail.shift();
        }
        
        // Calculate gravitational forces from all blackholes
        blackholesRef.current.forEach((bh) => {
          const dx = bh.x - particle.x;
          const dy = bh.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < bh.radius) {
            // Consumed by blackhole
            particle.alive = false;
            bh.particlesConsumed++;
            bh.mass += 50; // Blackhole grows
            bh.radius = Math.min(50, bh.radius + 0.1);
            return;
          }
          
          // Gravitational acceleration
          const force = bh.mass / (dist * dist);
          const ax = (dx / dist) * force * 0.0001;
          const ay = (dy / dist) * force * 0.0001;
          
          particle.vx += ax;
          particle.vy += ay;
          
          // Spaghettification effect - stretch towards blackhole
          if (dist < bh.radius * 4) {
            const stretchFactor = 1 - dist / (bh.radius * 4);
            particle.size = Math.max(1, (2 + Math.random() * 3) * (1 + stretchFactor * 2));
          }
        });
        
        // Apply velocity
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Slight drag
        particle.vx *= 0.999;
        particle.vy *= 0.999;
        
        // Kill if out of bounds for too long
        if (
          particle.x < -100 ||
          particle.x > width + 100 ||
          particle.y < -100 ||
          particle.y > height + 100
        ) {
          if (particle.age > 300) {
            particle.alive = false;
          }
        }
        
        // Shift hue based on velocity
        const velocity = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
        particle.hue = (particle.hue + velocity * 2) % 360;
        
        // Draw trail
        if (particle.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
          
          for (let i = 1; i < particle.trail.length; i++) {
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          }
          
          ctx.strokeStyle = `hsla(${particle.hue}, 80%, 60%, ${0.5 * (velocity / 5)})`;
          ctx.lineWidth = particle.size * 0.5;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${particle.hue}, 80%, 60%)`;
        ctx.fill();
      });
      
      // Remove dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.alive);
      setParticleCount(particlesRef.current.length);
      
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frameRef.current);
    };
  }, [isSpawning, spawnParticle]);

  return (
    <FeatureWrapper day={402} title="Pixel Blackhole Eater" emoji="🕳️">
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <p
            className="text-lg"
            style={{ color: "var(--color-text-dim)", fontFamily: "var(--font-serif)" }}
          >
            Click to spawn gravitational singularities and watch the cosmos unravel
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Each click births a blackhole that hungers for particles. Create highways of light or watch beautiful destruction.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            🕳️ Blackholes: <span className="font-bold">{blackholeCount}</span>
          </div>
          <div
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            ✨ Particles: <span className="font-bold">{particleCount}</span>
          </div>
          <div
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
          >
            💀 Consumed: <span className="font-bold">{totalConsumed}</span>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setIsSpawning(!isSpawning)}
            className="btn-secondary px-4 py-2 rounded-lg text-sm"
          >
            {isSpawning ? "⏸️ Pause Spawning" : "▶️ Resume Spawning"}
          </button>
          <button onClick={clearAll} className="btn-primary px-4 py-2 rounded-lg text-sm">
            🗑️ Clear All
          </button>
        </div>

        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            backgroundColor: "black",
            border: "2px solid var(--color-border)",
            height: "500px",
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair w-full h-full"
            style={{ display: "block" }}
          />
          {blackholeCount === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ color: "var(--color-text-dim)" }}
            >
              <div className="text-center animate-pulse">
                <p className="text-2xl mb-2">👆</p>
                <p>Click anywhere to spawn a blackhole</p>
              </div>
            </div>
          )}
        </div>

        <div
          className="text-center text-xs space-y-1"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>💡 Pro tip: Multiple blackholes create gravitational slingshots and particle highways</p>
          <p>Watch for the spaghettification effect as particles approach the event horizon!</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}