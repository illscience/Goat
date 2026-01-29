"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface PixelCharacter {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  personality: "shy" | "aggressive" | "romantic" | "nerdy" | "chill" | "dramatic";
  color: string;
  emoji: string;
  name: string;
  mood: number;
  blinkTimer: number;
  isBlinking: boolean;
}

interface DateResult {
  char1: string;
  char2: string;
  success: boolean;
  message: string;
}

const PERSONALITIES = {
  shy: { color: "#FFB6C1", emoji: "🥺", names: ["Blushy", "Timid", "Whisper", "Meek"] },
  aggressive: { color: "#FF4444", emoji: "😤", names: ["Spike", "Blaze", "Thunder", "Rage"] },
  romantic: { color: "#FF69B4", emoji: "😍", names: ["Romeo", "Juliet", "Cupid", "Dreamy"] },
  nerdy: { color: "#4488FF", emoji: "🤓", names: ["Binary", "Pixel", "Debug", "Stack"] },
  chill: { color: "#44FF88", emoji: "😎", names: ["Breeze", "Mellow", "Zen", "Lazy"] },
  dramatic: { color: "#9944FF", emoji: "😱", names: ["Drama", "Chaos", "Storm", "Diva"] },
};

const COMPATIBILITY: Record<string, Record<string, number>> = {
  shy: { shy: 0.5, aggressive: 0.2, romantic: 0.9, nerdy: 0.7, chill: 0.8, dramatic: 0.1 },
  aggressive: { shy: 0.2, aggressive: 0.3, romantic: 0.4, nerdy: 0.3, chill: 0.6, dramatic: 0.8 },
  romantic: { shy: 0.9, aggressive: 0.4, romantic: 0.95, nerdy: 0.5, chill: 0.7, dramatic: 0.6 },
  nerdy: { shy: 0.7, aggressive: 0.3, romantic: 0.5, nerdy: 0.85, chill: 0.6, dramatic: 0.2 },
  chill: { shy: 0.8, aggressive: 0.6, romantic: 0.7, nerdy: 0.6, chill: 0.9, dramatic: 0.4 },
  dramatic: { shy: 0.1, aggressive: 0.8, romantic: 0.6, nerdy: 0.2, chill: 0.4, dramatic: 0.5 },
};

const BREAKUP_MESSAGES = [
  "💔 It's not you, it's your vibe!",
  "😬 Awkward silence intensifies...",
  "🙅 Personality clash detected!",
  "💣 EXPLOSIVE disagreement!",
  "🏃 Someone ran away screaming!",
];

const SUCCESS_MESSAGES = [
  "💕 Love at first pixel!",
  "✨ Sparks are flying!",
  "💝 A perfect match!",
  "🎉 Chemistry overload!",
  "💞 They're inseparable now!",
];

export default function PixelSpeedDating() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const charactersRef = useRef<PixelCharacter[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [characters, setCharacters] = useState<PixelCharacter[]>([]);
  const [dragging, setDragging] = useState<PixelCharacter | null>(null);
  const [hovered, setHovered] = useState<PixelCharacter | null>(null);
  const [dateResults, setDateResults] = useState<DateResult[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [breakupCount, setBreakupCount] = useState(0);

  const createCharacter = useCallback((id: number, canvasWidth: number, canvasHeight: number): PixelCharacter => {
    const personalities = Object.keys(PERSONALITIES) as Array<keyof typeof PERSONALITIES>;
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const config = PERSONALITIES[personality];
    const name = config.names[Math.floor(Math.random() * config.names.length)];
    
    return {
      id,
      x: Math.random() * (canvasWidth - 40) + 20,
      y: Math.random() * (canvasHeight - 40) + 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      personality,
      color: config.color,
      emoji: config.emoji,
      name: `${name}#${id}`,
      mood: 50,
      blinkTimer: Math.random() * 100,
      isBlinking: false,
    };
  }, []);

  const initializeCharacters = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newCharacters: PixelCharacter[] = [];
    for (let i = 0; i < 8; i++) {
      newCharacters.push(createCharacter(i, canvas.width, canvas.height));
    }
    charactersRef.current = newCharacters;
    setCharacters([...newCharacters]);
  }, [createCharacter]);

  const createParticles = useCallback((x: number, y: number, color: string, count: number, isHeart: boolean) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: isHeart ? "#FF69B4" : color,
      });
    }
  }, []);

  const handleDate = useCallback((char1: PixelCharacter, char2: PixelCharacter) => {
    const compatibility = COMPATIBILITY[char1.personality][char2.personality];
    const roll = Math.random();
    const success = roll < compatibility;
    
    const midX = (char1.x + char2.x) / 2;
    const midY = (char1.y + char2.y) / 2;
    
    if (success) {
      createParticles(midX, midY, "#FF69B4", 20, true);
      setMatchCount(prev => prev + 1);
      char1.mood = Math.min(100, char1.mood + 30);
      char2.mood = Math.min(100, char2.mood + 30);
    } else {
      createParticles(midX, midY, "#FF4444", 30, false);
      setBreakupCount(prev => prev + 1);
      char1.mood = Math.max(0, char1.mood - 20);
      char2.mood = Math.max(0, char2.mood - 20);
      
      const angle = Math.atan2(char2.y - char1.y, char2.x - char1.x);
      char1.vx = -Math.cos(angle) * 5;
      char1.vy = -Math.sin(angle) * 5;
      char2.vx = Math.cos(angle) * 5;
      char2.vy = Math.sin(angle) * 5;
    }
    
    const message = success 
      ? SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
      : BREAKUP_MESSAGES[Math.floor(Math.random() * BREAKUP_MESSAGES.length)];
    
    setDateResults(prev => [{
      char1: char1.name,
      char2: char2.name,
      success,
      message,
    }, ...prev].slice(0, 5));
  }, [createParticles]);

  const drawCharacter = useCallback((ctx: CanvasRenderingContext2D, char: PixelCharacter, isSelected: boolean, isHovered: boolean) => {
    const size = 24;
    
    ctx.save();
    ctx.translate(char.x, char.y);
    
    if (isSelected || isHovered) {
      ctx.shadowColor = char.color;
      ctx.shadowBlur = 15;
    }
    
    ctx.fillStyle = char.color;
    ctx.beginPath();
    ctx.roundRect(-size/2, -size/2, size, size, 4);
    ctx.fill();
    
    ctx.fillStyle = "#000";
    const eyeY = -2;
    const eyeSize = char.isBlinking ? 1 : 3;
    ctx.fillRect(-6, eyeY, 4, eyeSize);
    ctx.fillRect(2, eyeY, 4, eyeSize);
    
    ctx.fillStyle = "#000";
    const mouthY = 5;
    if (char.mood > 70) {
      ctx.beginPath();
      ctx.arc(0, mouthY, 4, 0, Math.PI);
      ctx.fill();
    } else if (char.mood < 30) {
      ctx.beginPath();
      ctx.arc(0, mouthY + 4, 4, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.fillRect(-3, mouthY, 6, 2);
    }
    
    if (isHovered || isSelected) {
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "var(--color-text)";
      ctx.textAlign = "center";
      ctx.fillText(char.name, 0, -size/2 - 8);
      ctx.fillText(char.emoji, 0, -size/2 - 20);
    }
    
    ctx.restore();
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle, isHeart: boolean) => {
    ctx.save();
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    
    if (isHeart && particle.life > 0.5) {
      ctx.font = `${12 * particle.life}px sans-serif`;
      ctx.fillText("❤️", particle.x, particle.y);
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3 * particle.life, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }, []);

  useEffect(() => {
    initializeCharacters();
  }, [initializeCharacters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.fillStyle = "var(--color-bg-secondary)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = "var(--color-border)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      charactersRef.current.forEach(char => {
        if (dragging && char.id === dragging.id) return;
        
        char.x += char.vx;
        char.y += char.vy;
        
        char.vx *= 0.99;
        char.vy *= 0.99;
        
        if (Math.abs(char.vx) < 0.5) char.vx += (Math.random() - 0.5) * 0.1;
        if (Math.abs(char.vy) < 0.5) char.vy += (Math.random() - 0.5) * 0.1;
        
        if (char.x < 20) { char.x = 20; char.vx *= -0.8; }
        if (char.x > canvas.width - 20) { char.x = canvas.width - 20; char.vx *= -0.8; }
        if (char.y < 20) { char.y = 20; char.vy *= -0.8; }
        if (char.y > canvas.height - 20) { char.y = canvas.height - 20; char.vy *= -0.8; }
        
        char.blinkTimer -= 1;
        if (char.blinkTimer <= 0) {
          char.isBlinking = !char.isBlinking;
          char.blinkTimer = char.isBlinking ? 5 : 50 + Math.random() * 100;
        }
      });
      
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
        return p.life > 0;
      });
      
      particlesRef.current.forEach(p => drawParticle(ctx, p, p.color === "#FF69B4"));
      
      charactersRef.current.forEach(char => {
        const isSelected = dragging?.id === char.id;
        const isHover = hovered?.id === char.id;
        drawCharacter(ctx, char, isSelected, isHover);
      });
      
      if (dragging) {
        ctx.strokeStyle = "var(--color-accent)";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dragging.x, dragging.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      frameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [dragging, hovered, drawCharacter, drawParticle]);

  const getCharacterAt = (x: number, y: number): PixelCharacter | null => {
    for (const char of charactersRef.current) {
      const dx = x - char.x;
      const dy = y - char.y;
      if (Math.sqrt(dx * dx + dy * dy) < 15) {
        return char;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const char = getCharacterAt(x, y);
    if (char) {
      setDragging(char);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (dragging) {
      const char = charactersRef.current.find(c => c.id === dragging.id);
      if (char) {
        char.x = x;
        char.y = y;
        setDragging({ ...char });
      }
    } else {
      const char = getCharacterAt(x, y);
      setHovered(char);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const target = charactersRef.current.find(c => {
      if (c.id === dragging.id) return false;
      const dx = x - c.x;
      const dy = y - c.y;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });
    
    if (target) {
      const draggedChar = charactersRef.current.find(c => c.id === dragging.id);
      if (draggedChar) {
        handleDate(draggedChar, target);
      }
    }
    
    setDragging(null);
  };

  const resetAll = () => {
    initializeCharacters();
    particlesRef.current = [];
    setDateResults([]);
    setMatchCount(0);
    setBreakupCount(0);
  };

  return (
    <FeatureWrapper day={425} title="Pixel Speed Dating" emoji="💘">
      <div className="flex flex-col items-center gap-6 p-4">
        <p className="text-center max-w-lg" style={{ color: "var(--color-text-dim)" }}>
          Welcome to the tiniest dating show ever! Drag and drop these pixel hopefuls together 
          to see if love blooms... or explodes. 💔✨
        </p>
        
        <div className="flex gap-8 text-center">
          <div>
            <div className="text-2xl">💕 {matchCount}</div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Matches</div>
          </div>
          <div>
            <div className="text-2xl">💔 {breakupCount}</div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Breakups</div>
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="rounded-lg cursor-pointer border"
          style={{ borderColor: "var(--color-border)" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setDragging(null); setHovered(null); }}
        />
        
        <div className="flex gap-2 flex-wrap justify-center">
          {Object.entries(PERSONALITIES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: val.color + "33", color: val.color }}>
              {val.emoji} {key}
            </div>
          ))}
        </div>
        
        <button onClick={resetAll} className="btn-primary">
          🔄 Reset Dating Pool
        </button>
        
        {dateResults.length > 0 && (
          <div className="w-full max-w-md">
            <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              Recent Dates:
            </h3>
            <div className="flex flex-col gap-2">
              {dateResults.map((result, i) => (
                <div key={i} 
                  className="p-2 rounded text-sm flex items-center gap-2"
                  style={{ 
                    backgroundColor: result.success ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    borderLeft: `3px solid ${result.success ? "#22c55e" : "#ef4444"}`
                  }}>
                  <span className="font-medium">{result.char1}</span>
                  <span>+</span>
                  <span className="font-medium">{result.char2}</span>
                  <span className="ml-auto">{result.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-sm text-center max-w-md" style={{ color: "var(--color-text-dim)" }}>
          <strong>Pro tip:</strong> Shy + Romantic = 💕 | Aggressive + Dramatic = 🔥 | 
          Shy + Aggressive = 💣
        </div>
      </div>
    </FeatureWrapper>
  );
}