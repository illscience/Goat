"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "fire" | "lightning" | "ice" | "heal";
}

interface Rune {
  name: string;
  pattern: string;
  spell: "fire" | "lightning" | "ice" | "heal";
  description: string;
  emoji: string;
}

const RUNES: Rune[] = [
  { name: "Ignis", pattern: "triangle", spell: "fire", description: "Draw a triangle for flames", emoji: "🔥" },
  { name: "Fulgur", pattern: "zigzag", spell: "lightning", description: "Draw a zigzag for lightning", emoji: "⚡" },
  { name: "Glacies", pattern: "star", spell: "ice", description: "Draw a star for ice", emoji: "❄️" },
  { name: "Vitae", pattern: "circle", spell: "heal", description: "Draw a circle for healing", emoji: "💚" },
];

const SPELL_COLORS = {
  fire: ["#ff4500", "#ff6b35", "#ffaa00", "#ff0000"],
  lightning: ["#00ffff", "#ffffff", "#87ceeb", "#4169e1"],
  ice: ["#00bfff", "#e0ffff", "#add8e6", "#ffffff"],
  heal: ["#00ff00", "#7cfc00", "#98fb98", "#90ee90"],
};

export default function PixelSpellWeaver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastSpell, setLastSpell] = useState<string | null>(null);
  const [spellHistory, setSpellHistory] = useState<string[]>([]);
  const [magicPower, setMagicPower] = useState(100);

  const playSpellSound = useCallback((spell: "fire" | "lightning" | "ice" | "heal") => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const soundConfig = {
      fire: { freq: 150, type: "sawtooth" as OscillatorType, duration: 0.3 },
      lightning: { freq: 800, type: "square" as OscillatorType, duration: 0.15 },
      ice: { freq: 600, type: "sine" as OscillatorType, duration: 0.4 },
      heal: { freq: 440, type: "sine" as OscillatorType, duration: 0.5 },
    };
    
    const config = soundConfig[spell];
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime);
    
    if (spell === "lightning") {
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + config.duration);
    } else if (spell === "heal") {
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + config.duration);
    }
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
  }, []);

  const createParticles = useCallback((spell: "fire" | "lightning" | "ice" | "heal", centerX: number, centerY: number) => {
    const newParticles: Particle[] = [];
    const colors = SPELL_COLORS[spell];
    const count = spell === "lightning" ? 30 : 50;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 5 + 2;
      
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;
      
      if (spell === "fire") {
        vy = -Math.abs(vy) - Math.random() * 3;
        vx *= 0.5;
      } else if (spell === "lightning") {
        vx += (Math.random() - 0.5) * 10;
        vy += (Math.random() - 0.5) * 10;
      } else if (spell === "heal") {
        vy = -Math.random() * 2;
      }
      
      newParticles.push({
        x: centerX + (Math.random() - 0.5) * 50,
        y: centerY + (Math.random() - 0.5) * 50,
        vx,
        vy,
        life: 1,
        maxLife: spell === "lightning" ? 20 : 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        type: spell,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const detectShape = useCallback((path: Point[]): "fire" | "lightning" | "ice" | "heal" | null => {
    if (path.length < 10) return null;
    
    const minX = Math.min(...path.map(p => p.x));
    const maxX = Math.max(...path.map(p => p.x));
    const minY = Math.min(...path.map(p => p.y));
    const maxY = Math.max(...path.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;
    
    if (width < 30 || height < 30) return null;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Check for circle (healing)
    const avgRadius = path.reduce((sum, p) => {
      return sum + Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    }, 0) / path.length;
    
    const radiusVariance = path.reduce((sum, p) => {
      const dist = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
      return sum + Math.abs(dist - avgRadius);
    }, 0) / path.length;
    
    if (radiusVariance < avgRadius * 0.25 && path.length > 30) {
      return "heal";
    }
    
    // Check for zigzag (lightning)
    let directionChanges = 0;
    for (let i = 2; i < path.length; i++) {
      const dx1 = path[i - 1].x - path[i - 2].x;
      const dx2 = path[i].x - path[i - 1].x;
      if ((dx1 > 0 && dx2 < 0) || (dx1 < 0 && dx2 > 0)) {
        directionChanges++;
      }
    }
    
    if (directionChanges >= 3 && height > width * 0.5) {
      return "lightning";
    }
    
    // Check for star (ice) - lots of direction changes in both axes
    let yChanges = 0;
    for (let i = 2; i < path.length; i++) {
      const dy1 = path[i - 1].y - path[i - 2].y;
      const dy2 = path[i].y - path[i - 1].y;
      if ((dy1 > 0 && dy2 < 0) || (dy1 < 0 && dy2 > 0)) {
        yChanges++;
      }
    }
    
    if (directionChanges >= 2 && yChanges >= 2) {
      return "ice";
    }
    
    // Check for triangle (fire)
    const corners: Point[] = [];
    for (let i = 5; i < path.length - 5; i++) {
      const prev = path[i - 5];
      const curr = path[i];
      const next = path[i + 5];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let angleDiff = Math.abs(angle1 - angle2);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff > 0.5 && angleDiff < 2.5) {
        if (corners.length === 0 || 
            Math.sqrt(Math.pow(curr.x - corners[corners.length - 1].x, 2) + 
                     Math.pow(curr.y - corners[corners.length - 1].y, 2)) > 30) {
          corners.push(curr);
        }
      }
    }
    
    if (corners.length >= 2 && corners.length <= 4) {
      return "fire";
    }
    
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (magicPower < 10) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  }, [magicPower]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  }, [isDrawing]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const spell = detectShape(currentPath);
    
    if (spell && currentPath.length > 0) {
      const centerX = currentPath.reduce((sum, p) => sum + p.x, 0) / currentPath.length;
      const centerY = currentPath.reduce((sum, p) => sum + p.y, 0) / currentPath.length;
      
      createParticles(spell, centerX, centerY);
      playSpellSound(spell);
      
      const rune = RUNES.find(r => r.spell === spell);
      setLastSpell(`${rune?.emoji} ${rune?.name}!`);
      setSpellHistory(prev => [...prev.slice(-4), rune?.name || spell]);
      setMagicPower(prev => Math.max(0, prev - 15));
    }
    
    setCurrentPath([]);
  }, [isDrawing, currentPath, detectShape, createParticles, playSpellSound]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (magicPower < 10) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  }, [magicPower]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  }, [isDrawing]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Regenerate magic power
  useEffect(() => {
    const interval = setInterval(() => {
      setMagicPower(prev => Math.min(100, prev + 2));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Draw the rune path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw mystical background grid
    ctx.strokeStyle = "rgba(100, 100, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Draw current path with magical glow
    if (currentPath.length > 1) {
      ctx.shadowColor = "#8b5cf6";
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    }
  }, [currentPath]);

  // Particle animation
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      setParticles(prev => {
        const updated = prev.map(p => {
          let newVy = p.vy;
          
          if (p.type === "fire") {
            newVy -= 0.1;
          } else if (p.type === "heal") {
            newVy -= 0.05;
          } else {
            newVy += 0.1;
          }
          
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + newVy,
            vy: newVy,
            vx: p.vx * 0.98,
            life: p.life - 1 / p.maxLife,
          };
        }).filter(p => p.life > 0);
        
        // Draw particles
        updated.forEach(p => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          
          if (p.type === "lightning") {
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 2);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        return updated;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <FeatureWrapper day={445} title="Pixel Spell Weaver" emoji="🔮">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Channel Your Inner Wizard ✨
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Draw magical symbols to cast spells! Each shape unleashes different elemental magic.
          </p>
        </div>

        {/* Spell Guide */}
        <div className="flex flex-wrap justify-center gap-3 mb-2">
          {RUNES.map(rune => (
            <div 
              key={rune.name}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ 
                backgroundColor: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)"
              }}
            >
              <span className="mr-1">{rune.emoji}</span>
              <span style={{ color: "var(--color-text-dim)" }}>{rune.description}</span>
            </div>
          ))}
        </div>

        {/* Magic Power Bar */}
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-1">
            <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>Magic Power</span>
            <span className="text-sm" style={{ color: "var(--color-accent)" }}>{Math.round(magicPower)}%</span>
          </div>
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${magicPower}%`,
                background: "linear-gradient(90deg, #8b5cf6, #a78bfa)"
              }}
            />
          </div>
        </div>

        {/* Canvas Container */}
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{ 
            border: "2px solid var(--color-border)",
            boxShadow: "0 0 30px rgba(139, 92, 246, 0.3)"
          }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <canvas
            ref={particleCanvasRef}
            width={600}
            height={400}
            className="absolute top-0 left-0 pointer-events-none"
          />
          
          {/* Spell Cast Notification */}
          {lastSpell && (
            <div 
              className="absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-lg font-bold animate-pulse"
              style={{ 
                backgroundColor: "rgba(139, 92, 246, 0.9)",
                color: "white"
              }}
            >
              {lastSpell}
            </div>
          )}

          {magicPower < 10 && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            >
              <p className="text-lg" style={{ color: "var(--color-text)" }}>
                ⏳ Recharging magic...
              </p>
            </div>
          )}
        </div>

        {/* Spell History */}
        {spellHistory.length > 0 && (
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: "var(--color-text-dim)" }}>Recent Spells:</p>
            <div className="flex gap-2">
              {spellHistory.map((spell, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: "var(--color-bg-secondary)",
                    color: "var(--color-text)"
                  }}
                >
                  {spell}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-center" style={{ color: "var(--color-text-dim)" }}>
          Pro tip: Draw slowly and deliberately for better recognition! 🪄
        </p>
      </div>
    </FeatureWrapper>
  );
}