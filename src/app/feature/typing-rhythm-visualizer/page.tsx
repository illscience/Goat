"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "ripple" | "spark" | "trail";
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  opacity: number;
}

const keyColorMap: Record<string, string> = {
  // Vowels - warm colors
  a: "#FF6B6B",
  e: "#FF8E53",
  i: "#FFD93D",
  o: "#FF6B9D",
  u: "#FF85A2",
  // Common consonants - cool colors
  t: "#4ECDC4",
  n: "#45B7D1",
  s: "#96E6A1",
  r: "#6BCB77",
  h: "#7ED6DF",
  l: "#74B9FF",
  // Punctuation - purples
  " ": "#A29BFE",
  ".": "#D63384",
  ",": "#9D4EDD",
  // Numbers - blues
  "0": "#2193B0",
  "1": "#6DD5ED",
  "2": "#56CCF2",
  "3": "#2F80ED",
  "4": "#2D9CDB",
  "5": "#219C90",
  "6": "#64CCC5",
  "7": "#176B87",
  "8": "#04364A",
  "9": "#3B82F6",
  // Special keys
  Enter: "#F472B6",
  Backspace: "#EF4444",
  Tab: "#8B5CF6",
};

function getKeyColor(key: string): string {
  const lowerKey = key.toLowerCase();
  if (keyColorMap[lowerKey]) return keyColorMap[lowerKey];
  if (keyColorMap[key]) return keyColorMap[key];
  
  // Generate consistent color for unknown keys
  const hash = key.charCodeAt(0) * 137;
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export default function TypingRhythmVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const frameRef = useRef<number>(0);
  const lastKeyTimeRef = useRef<number>(0);
  const typingSpeedRef = useRef<number>(0);
  const cursorPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [keyCount, setKeyCount] = useState(0);
  const [intensity, setIntensity] = useState(0);

  const spawnParticles = useCallback((key: string, speed: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const color = getKeyColor(key);
    const centerX = canvas.width / 2 + (Math.random() - 0.5) * 200;
    const centerY = canvas.height / 2 + (Math.random() - 0.5) * 100;
    
    cursorPosRef.current = { x: centerX, y: centerY };

    // Spawn ripple
    const rippleIntensity = Math.min(speed / 50, 3);
    ripplesRef.current.push({
      x: centerX,
      y: centerY,
      radius: 10,
      maxRadius: 80 + rippleIntensity * 40,
      color,
      opacity: 0.8,
    });

    // Spawn particles based on typing speed
    const particleCount = Math.floor(5 + speed / 20);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const velocity = 2 + speed / 30;
      
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity * (0.5 + Math.random()),
        vy: Math.sin(angle) * velocity * (0.5 + Math.random()),
        life: 1,
        maxLife: 60 + Math.random() * 40,
        color,
        size: 3 + Math.random() * 4,
        type: speed > 100 ? "spark" : "trail",
      });
    }

    // Extra sparks for fast typing
    if (speed > 80) {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * (4 + Math.random() * 3),
          vy: Math.sin(angle) * (4 + Math.random() * 3),
          life: 1,
          maxLife: 30 + Math.random() * 20,
          color: "#FFFFFF",
          size: 2 + Math.random() * 2,
          type: "spark",
        });
      }
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Calculate typing speed (inverse of time between keystrokes)
    const speed = timeSinceLastKey > 0 ? Math.min(1000 / timeSinceLastKey, 200) : 50;
    typingSpeedRef.current = speed;
    setIntensity(Math.min(speed / 150, 1));
    setKeyCount(prev => prev + 1);

    spawnParticles(e.key, speed);
  }, [spawnParticles]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      frameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Fade effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw ripples
    ripplesRef.current = ripplesRef.current.filter(ripple => {
      ripple.radius += 3;
      ripple.opacity -= 0.02;

      if (ripple.opacity <= 0) return false;

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = ripple.opacity;
      ctx.stroke();
      ctx.globalAlpha = 1;

      return true;
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.05; // gravity
      particle.vx *= 0.99;
      particle.life -= 1 / particle.maxLife;

      if (particle.life <= 0) return false;

      ctx.beginPath();
      
      if (particle.type === "spark") {
        // Draw as a small line for sparks
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size * particle.life;
        ctx.globalAlpha = particle.life;
        ctx.stroke();
      } else {
        // Draw as a circle for trails
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life * 0.8;
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;

      return true;
    });

    // Draw gentle ambient particles when idle
    if (Date.now() - lastKeyTimeRef.current > 1000 && Math.random() < 0.02) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fill();
    }

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial canvas setup
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frameRef.current);
    };
  }, [animate]);

  return (
    <FeatureWrapper day={361} title="Typing Rhythm Visualizer" emoji="✨">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h2 
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Turn Your Keystrokes Into Art
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Type anything below. Watch your rhythm come alive as ripples, sparks, and flowing colors.
            Fast typing = intense bursts. Different keys = different colors.
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <div 
            className="px-4 py-2 rounded-full"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-dim)"
            }}
          >
            Keystrokes: <span className="font-bold" style={{ color: "var(--color-accent)" }}>{keyCount}</span>
          </div>
          <div 
            className="px-4 py-2 rounded-full"
            style={{ 
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-dim)"
            }}
          >
            Intensity: 
            <span 
              className="font-bold ml-1"
              style={{ 
                color: intensity > 0.7 ? "#FF6B6B" : intensity > 0.4 ? "#FFD93D" : "#96E6A1"
              }}
            >
              {intensity > 0.7 ? "🔥 On Fire!" : intensity > 0.4 ? "⚡ Grooving" : "🌊 Flowing"}
            </span>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden"
          style={{ 
            height: "400px",
            border: "1px solid var(--color-border)",
            backgroundColor: "#000"
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          
          <div className="absolute bottom-4 left-4 right-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsActive(true)}
              onBlur={() => setIsActive(false)}
              placeholder="Start typing here... let your rhythm flow ✨"
              className="w-full p-4 rounded-lg resize-none outline-none text-white placeholder-gray-400"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
                border: isActive ? "2px solid var(--color-accent)" : "2px solid rgba(255, 255, 255, 0.1)",
                transition: "border-color 0.2s ease"
              }}
              rows={3}
            />
          </div>
        </div>

        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-center text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <div className="space-y-1">
            <div className="text-lg">🔴🟠🟡</div>
            <div>Vowels = Warm tones</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg">🔵🟢🩵</div>
            <div>Consonants = Cool tones</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg">💜🩷💗</div>
            <div>Space & punctuation = Purple</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg">⚡✨💫</div>
            <div>Fast typing = Extra sparks!</div>
          </div>
        </div>

        <button
          onClick={() => {
            setText("");
            setKeyCount(0);
            setIntensity(0);
            particlesRef.current = [];
            ripplesRef.current = [];
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (ctx && canvas) {
              ctx.fillStyle = "#000";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }}
          className="btn-secondary px-6 py-2 rounded-lg"
        >
          Clear Canvas & Start Fresh
        </button>
      </div>
    </FeatureWrapper>
  );
}