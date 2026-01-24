"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface CookieEvolution {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pointsRequired: number;
  clickMultiplier: number;
  colors: string[];
  particleEffect: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
  opacity: number;
}

const COOKIE_EVOLUTIONS: CookieEvolution[] = [
  {
    id: 0,
    name: "Basic Cookie",
    emoji: "🍪",
    description: "Just a humble cookie, dreaming of greatness",
    pointsRequired: 0,
    clickMultiplier: 1,
    colors: ["#D2691E", "#8B4513"],
    particleEffect: "crumbs",
  },
  {
    id: 1,
    name: "Chocolate Chip Amoeba",
    emoji: "🦠",
    description: "Your cookie has gained sentience... and wiggles",
    pointsRequired: 50,
    clickMultiplier: 2,
    colors: ["#5D3A1A", "#3D2312", "#8B5A2B"],
    particleEffect: "bubbles",
  },
  {
    id: 2,
    name: "Cosmic Macaron",
    emoji: "🌙",
    description: "Infused with stardust and existential dread",
    pointsRequired: 200,
    clickMultiplier: 5,
    colors: ["#9B59B6", "#3498DB", "#E91E63"],
    particleEffect: "stars",
  },
  {
    id: 3,
    name: "Quantum Snickerdoodle",
    emoji: "⚛️",
    description: "Exists in all states of deliciousness simultaneously",
    pointsRequired: 500,
    clickMultiplier: 10,
    colors: ["#00FFFF", "#FF00FF", "#FFFF00"],
    particleEffect: "quantum",
  },
  {
    id: 4,
    name: "Nebula Brownie Chunk",
    emoji: "🌌",
    description: "Born from the death of a thousand suns and cocoa beans",
    pointsRequired: 1500,
    clickMultiplier: 25,
    colors: ["#FF6B6B", "#4ECDC4", "#A78BFA"],
    particleEffect: "nebula",
  },
  {
    id: 5,
    name: "Interdimensional Oreo Supreme",
    emoji: "🌀",
    description: "The cream filling contains pocket universes",
    pointsRequired: 5000,
    clickMultiplier: 50,
    colors: ["#1A1A2E", "#FFFFFF", "#E94560"],
    particleEffect: "portal",
  },
  {
    id: 6,
    name: "THE OMNIBISCUIT",
    emoji: "👁️",
    description: "IT SEES ALL. IT KNOWS ALL. IT IS DELICIOUS.",
    pointsRequired: 15000,
    clickMultiplier: 100,
    colors: ["#FFD700", "#FF4500", "#8B0000"],
    particleEffect: "divine",
  },
];

export default function PixelCookieClickerEvolution() {
  const [points, setPoints] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [currentEvolution, setCurrentEvolution] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const particleIdRef = useRef<number>(0);
  const textIdRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  const evolution = COOKIE_EVOLUTIONS[currentEvolution];
  const nextEvolution = COOKIE_EVOLUTIONS[currentEvolution + 1];

  const createParticles = useCallback((x: number, y: number, effect: string, colors: string[]) => {
    const newParticles: Particle[] = [];
    const count = effect === "divine" ? 20 : effect === "portal" ? 15 : 8;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: effect === "divine" ? 8 + Math.random() * 8 : 4 + Math.random() * 4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const createFloatingText = useCallback((x: number, y: number, value: number) => {
    const newText: FloatingText = {
      id: textIdRef.current++,
      x: x + (Math.random() - 0.5) * 40,
      y,
      value,
      opacity: 1,
    };
    setFloatingTexts((prev) => [...prev, newText]);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const pointsGained = evolution.clickMultiplier;
      setPoints((prev) => prev + pointsGained);
      setTotalClicks((prev) => prev + 1);

      createParticles(x, y, evolution.particleEffect, evolution.colors);
      createFloatingText(x, y, pointsGained);

      setIsShaking(true);
      setScale(0.95);
      setTimeout(() => {
        setIsShaking(false);
        setScale(1);
      }, 100);
    },
    [evolution, createParticles, createFloatingText]
  );

  // Check for evolution
  useEffect(() => {
    if (nextEvolution && points >= nextEvolution.pointsRequired) {
      setCurrentEvolution((prev) => prev + 1);
      setRotation((prev) => prev + 360);
    }
  }, [points, nextEvolution]);

  // Animate particles and floating texts
  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );

      setFloatingTexts((prev) =>
        prev
          .map((t) => ({
            ...t,
            y: t.y - 2,
            opacity: t.opacity - 0.02,
          }))
          .filter((t) => t.opacity > 0)
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const progressToNext = nextEvolution
    ? ((points - evolution.pointsRequired) / (nextEvolution.pointsRequired - evolution.pointsRequired)) * 100
    : 100;

  return (
    <FeatureWrapper day={420} title="Pixel Cookie Clicker Evolution" emoji="🍪">
      <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
        {/* Stats Bar */}
        <div className="w-full flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
              {points.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Evolution Points
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              x{evolution.clickMultiplier}
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Multiplier
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              {totalClicks.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Total Clicks
            </div>
          </div>
        </div>

        {/* Current Evolution Display */}
        <div className="text-center">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            {evolution.emoji} {evolution.name}
          </h2>
          <p className="italic" style={{ color: "var(--color-text-dim)" }}>
            {evolution.description}
          </p>
        </div>

        {/* Cookie Button */}
        <div className="relative w-64 h-64">
          <button
            onClick={handleClick}
            className="w-full h-full rounded-full cursor-pointer transition-all duration-100 focus:outline-none relative overflow-visible"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${evolution.colors[0]}, ${evolution.colors[1] || evolution.colors[0]})`,
              boxShadow: `0 0 ${20 + currentEvolution * 10}px ${evolution.colors[0]}80, inset 0 -10px 20px rgba(0,0,0,0.3)`,
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              animation: isShaking ? "shake 0.1s ease-in-out" : undefined,
            }}
          >
            <span className="text-8xl select-none" style={{ filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5))` }}>
              {evolution.emoji}
            </span>

            {/* Particles */}
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: particle.x,
                  top: particle.y,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  opacity: particle.life,
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 ${particle.size}px ${particle.color}`,
                }}
              />
            ))}

            {/* Floating Text */}
            {floatingTexts.map((text) => (
              <div
                key={text.id}
                className="absolute pointer-events-none font-bold text-xl"
                style={{
                  left: text.x,
                  top: text.y,
                  opacity: text.opacity,
                  color: evolution.colors[0],
                  transform: "translate(-50%, -50%)",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                +{text.value}
              </div>
            ))}
          </button>

          {/* Glow effect for higher evolutions */}
          {currentEvolution >= 3 && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, transparent 40%, ${evolution.colors[0]}40 70%, transparent 100%)`,
                animation: "pulse 2s infinite",
              }}
            />
          )}
        </div>

        {/* Progress to Next Evolution */}
        {nextEvolution && (
          <div className="w-full max-w-md">
            <div className="flex justify-between mb-2 text-sm">
              <span style={{ color: "var(--color-text-dim)" }}>Next Evolution:</span>
              <span style={{ color: "var(--color-accent)" }}>
                {nextEvolution.emoji} {nextEvolution.name}
              </span>
            </div>
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(progressToNext, 100)}%`,
                  background: `linear-gradient(90deg, ${evolution.colors[0]}, ${nextEvolution.colors[0]})`,
                }}
              />
            </div>
            <div className="text-center mt-2 text-sm" style={{ color: "var(--color-text-dim)" }}>
              {nextEvolution.pointsRequired - points} points to evolution
            </div>
          </div>
        )}

        {/* Evolution History */}
        <div className="w-full mt-4">
          <h3
            className="text-lg font-bold mb-3"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Evolution Tree
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {COOKIE_EVOLUTIONS.map((evo, index) => (
              <div
                key={evo.id}
                className="p-3 rounded-lg text-center transition-all duration-300"
                style={{
                  backgroundColor: index <= currentEvolution ? `${evo.colors[0]}30` : "var(--color-bg-secondary)",
                  border: `2px solid ${index <= currentEvolution ? evo.colors[0] : "var(--color-border)"}`,
                  opacity: index <= currentEvolution ? 1 : 0.5,
                  transform: index === currentEvolution ? "scale(1.1)" : "scale(1)",
                }}
              >
                <div className="text-2xl">{index <= currentEvolution ? evo.emoji : "❓"}</div>
                <div
                  className="text-xs mt-1 max-w-20 truncate"
                  style={{ color: index <= currentEvolution ? "var(--color-text)" : "var(--color-text-dim)" }}
                >
                  {index <= currentEvolution ? evo.name : "???"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Evolution Message */}
        {!nextEvolution && (
          <div
            className="text-center p-6 rounded-xl mt-4"
            style={{
              background: `linear-gradient(135deg, ${evolution.colors[0]}40, ${evolution.colors[2] || evolution.colors[0]}40)`,
              border: `2px solid ${evolution.colors[0]}`,
            }}
          >
            <div className="text-4xl mb-2">🏆</div>
            <h3
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              MAXIMUM COOKIE ACHIEVED
            </h3>
            <p style={{ color: "var(--color-text-dim)" }}>
              You have transcended mortal baking. The universe trembles before your confectionery might.
            </p>
          </div>
        )}
      </div>

      {/* Keyframe animations using inline style tag workaround */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
        `}
      </style>
    </FeatureWrapper>
  );
}