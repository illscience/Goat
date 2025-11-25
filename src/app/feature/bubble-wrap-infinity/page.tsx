"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Bubble {
  id: string;
  x: number;
  y: number;
  popped: boolean;
  type: "normal" | "chain" | "musical" | "golden" | "mega";
  note?: string;
  poppingAnimation: boolean;
}

interface PowerUp {
  name: string;
  description: string;
  active: boolean;
  duration: number;
}

const MUSICAL_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const GRID_SIZE = 10;

export default function BubbleWrapInfinity() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalPopped, setTotalPopped] = useState(0);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; color: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateBubbleType = useCallback((): Bubble["type"] => {
    const rand = Math.random();
    if (rand < 0.02) return "golden";
    if (rand < 0.08) return "mega";
    if (rand < 0.18) return "chain";
    if (rand < 0.35) return "musical";
    return "normal";
  }, []);

  const generateBubbles = useCallback(() => {
    const newBubbles: Bubble[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const type = generateBubbleType();
        newBubbles.push({
          id: `${x}-${y}-${Date.now()}`,
          x,
          y,
          popped: false,
          type,
          note: type === "musical" ? MUSICAL_NOTES[Math.floor(Math.random() * MUSICAL_NOTES.length)] : undefined,
          poppingAnimation: false,
        });
      }
    }
    setBubbles(newBubbles);
  }, [generateBubbleType]);

  useEffect(() => {
    generateBubbles();
    return () => {
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      if (powerUpTimeoutRef.current) clearTimeout(powerUpTimeoutRef.current);
    };
  }, [generateBubbles]);

  const playSound = useCallback((type: Bubble["type"], note?: string) => {
    if (typeof window === "undefined") return;
    
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const noteFrequencies: Record<string, number> = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25,
    };

    switch (type) {
      case "normal":
        oscillator.frequency.value = 200 + Math.random() * 100;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
        break;
      case "chain":
        oscillator.frequency.value = 400;
        oscillator.type = "square";
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.2);
        break;
      case "musical":
        oscillator.frequency.value = noteFrequencies[note || "C4"] || 261.63;
        oscillator.type = "triangle";
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case "golden":
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.4);
        break;
      case "mega":
        oscillator.frequency.value = 150;
        oscillator.type = "sawtooth";
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
        break;
    }
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: `particle-${Date.now()}-${i}`,
      x: x + Math.random() * 40 - 20,
      y: y + Math.random() * 40 - 20,
      color,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 500);
  }, []);

  const activatePowerUp = useCallback(() => {
    const powerUps: PowerUp[] = [
      { name: "Double Points", description: "2x points for 10 seconds!", active: true, duration: 10000 },
      { name: "Chain Reaction", description: "All bubbles trigger chains!", active: true, duration: 8000 },
      { name: "Mega Pop", description: "Pop 3x3 areas!", active: true, duration: 6000 },
    ];
    const selected = powerUps[Math.floor(Math.random() * powerUps.length)];
    setPowerUp(selected);
    
    if (powerUpTimeoutRef.current) clearTimeout(powerUpTimeoutRef.current);
    powerUpTimeoutRef.current = setTimeout(() => {
      setPowerUp(null);
    }, selected.duration);
  }, []);

  const popBubble = useCallback((bubble: Bubble, isChainReaction: boolean = false) => {
    if (bubble.popped) return;

    setBubbles(prev => prev.map(b => 
      b.id === bubble.id ? { ...b, popped: true, poppingAnimation: true } : b
    ));

    playSound(bubble.type, bubble.note);

    const basePoints: Record<Bubble["type"], number> = {
      normal: 1,
      chain: 3,
      musical: 5,
      golden: 25,
      mega: 10,
    };

    let points = basePoints[bubble.type] || 1;
    if (powerUp?.name === "Double Points") points *= 2;
    
    setScore(prev => prev + points * (1 + Math.floor(combo / 5)));
    setTotalPopped(prev => prev + 1);
    setCombo(prev => prev + 1);

    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = setTimeout(() => setCombo(0), 1500);

    const colors: Record<Bubble["type"], string> = {
      normal: "#94a3b8",
      chain: "#f97316",
      musical: "#a855f7",
      golden: "#fbbf24",
      mega: "#ef4444",
    };
    createParticles(bubble.x * 52 + 26, bubble.y * 52 + 26, colors[bubble.type] || "#94a3b8", bubble.type === "mega" ? 15 : 5);

    if (bubble.type === "golden") {
      activatePowerUp();
    }

    if (bubble.type === "chain" || powerUp?.name === "Chain Reaction") {
      setTimeout(() => {
        setBubbles(prev => {
          const adjacent = prev.filter(b => 
            !b.popped &&
            Math.abs(b.x - bubble.x) <= 1 &&
            Math.abs(b.y - bubble.y) <= 1 &&
            b.id !== bubble.id
          );
          adjacent.forEach(b => popBubble(b, true));
          return prev;
        });
      }, 100);
    }

    if (bubble.type === "mega" || powerUp?.name === "Mega Pop") {
      setTimeout(() => {
        setBubbles(prev => {
          const nearby = prev.filter(b => 
            !b.popped &&
            Math.abs(b.x - bubble.x) <= 1 &&
            Math.abs(b.y - bubble.y) <= 1
          );
          nearby.forEach(b => {
            if (b.id !== bubble.id) popBubble(b, true);
          });
          return prev;
        });
      }, 50);
    }

    setTimeout(() => {
      setBubbles(prev => {
        const newBubbles = [...prev];
        const index = newBubbles.findIndex(b => b.id === bubble.id);
        if (index !== -1) {
          const type = generateBubbleType();
          newBubbles[index] = {
            ...newBubbles[index],
            id: `${bubble.x}-${bubble.y}-${Date.now()}`,
            popped: false,
            poppingAnimation: false,
            type,
            note: type === "musical" ? MUSICAL_NOTES[Math.floor(Math.random() * MUSICAL_NOTES.length)] : undefined,
          };
        }
        return newBubbles;
      });
    }, 500);
  }, [combo, powerUp, playSound, createParticles, activatePowerUp, generateBubbleType]);

  const getBubbleStyles = (type: Bubble["type"]) => {
    const styles: Record<Bubble["type"], string> = {
      normal: "bg-gradient-to-br from-slate-200 to-slate-400 shadow-inner",
      chain: "bg-gradient-to-br from-orange-300 to-orange-500 shadow-orange-300/50",
      musical: "bg-gradient-to-br from-purple-300 to-purple-500 shadow-purple-300/50",
      golden: "bg-gradient-to-br from-yellow-300 to-amber-500 shadow-yellow-300/50 animate-pulse",
      mega: "bg-gradient-to-br from-red-300 to-red-500 shadow-red-300/50",
    };
    return styles[type] || styles.normal;
  };

  const getBubbleEmoji = (type: Bubble["type"]) => {
    const emojis: Record<Bubble["type"], string> = {
      normal: "",
      chain: "💥",
      musical: "🎵",
      golden: "⭐",
      mega: "💣",
    };
    return emojis[type] || "";
  };

  return (
    <FeatureWrapper day={360} title="Bubble Wrap Infinity" emoji="🫧">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Pop to your heart&apos;s content 🫧
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Endless satisfaction. Zero waste. Maximum joy.
          </p>
        </div>

        <div className="flex gap-6 flex-wrap justify-center">
          <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>{score.toLocaleString()}</div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Score</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <div className="text-2xl font-bold" style={{ color: combo > 10 ? "#f97316" : "var(--color-text)" }}>
              {combo}x
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Combo</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{totalPopped}</div>
            <div className="text-xs" style={{ color: "var(--color-text-dim)" }}>Total Popped</div>
          </div>
        </div>

        {powerUp && (
          <div 
            className="px-4 py-2 rounded-full animate-bounce text-center"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            <span className="font-bold">{powerUp.name}:</span> {powerUp.description}
          </div>
        )}

        <div 
          className="relative p-4 rounded-xl shadow-xl"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {bubbles.map((bubble) => (
              <button
                key={bubble.id}
                onClick={() => popBubble(bubble)}
                disabled={bubble.popped}
                className={`
                  w-12 h-12 rounded-full transition-all duration-150 
                  ${bubble.popped ? "scale-0 opacity-0" : "hover:scale-110 active:scale-90"}
                  ${getBubbleStyles(bubble.type)}
                  ${bubble.poppingAnimation ? "animate-ping" : ""}
                  shadow-lg cursor-pointer disabled:cursor-default
                  flex items-center justify-center text-lg
                `}
                style={{
                  transform: bubble.popped ? "scale(0)" : undefined,
                }}
              >
                {getBubbleEmoji(bubble.type)}
              </button>
            ))}
          </div>

          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 rounded-full animate-ping pointer-events-none"
              style={{
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
              }}
            />
          ))}
        </div>

        <div 
          className="flex gap-4 flex-wrap justify-center text-xs p-4 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 to-slate-400" />
            <span style={{ color: "var(--color-text-dim)" }}>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-300 to-orange-500" />
            <span style={{ color: "var(--color-text-dim)" }}>Chain 💥</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-300 to-purple-500" />
            <span style={{ color: "var(--color-text-dim)" }}>Musical 🎵</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500" />
            <span style={{ color: "var(--color-text-dim)" }}>Golden ⭐</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-red-300 to-red-500" />
            <span style={{ color: "var(--color-text-dim)" }}>Mega 💣</span>
          </div>
        </div>

        <button
          onClick={generateBubbles}
          className="btn-secondary px-6 py-2 rounded-lg font-medium"
        >
          🔄 Fresh Sheet
        </button>

        <p 
          className="text-center text-xs max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          Pro tip: Build combos for bonus points! Golden bubbles give power-ups. 
          Chain bubbles explode their neighbors. Musical bubbles play notes. Mega bubbles are... mega. 🎮
        </p>
      </div>
    </FeatureWrapper>
  );
}