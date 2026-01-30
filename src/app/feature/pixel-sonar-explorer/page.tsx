"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Point {
  x: number;
  y: number;
}

interface Treasure {
  x: number;
  y: number;
  type: "gold" | "gem" | "chest" | "pearl";
  collected: boolean;
  emoji: string;
  points: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rock" | "coral" | "shipwreck";
}

interface Creature {
  x: number;
  y: number;
  type: "fish" | "jellyfish" | "octopus" | "whale";
  emoji: string;
  dx: number;
  dy: number;
}

interface Pulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  timestamp: number;
}

const TREASURE_TYPES = [
  { type: "gold" as const, emoji: "🪙", points: 10 },
  { type: "gem" as const, emoji: "💎", points: 25 },
  { type: "chest" as const, emoji: "📦", points: 50 },
  { type: "pearl" as const, emoji: "🦪", points: 15 },
];

const CREATURE_TYPES = [
  { type: "fish" as const, emoji: "🐟" },
  { type: "jellyfish" as const, emoji: "🪼" },
  { type: "octopus" as const, emoji: "🐙" },
  { type: "whale" as const, emoji: "🐋" },
];

export default function PixelSonarExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [energy, setEnergy] = useState(100);
  const [score, setScore] = useState(0);
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [revealedAreas, setRevealedAreas] = useState<Point[]>([]);
  const [submarinePos, setSubmarinePos] = useState<Point>({ x: 400, y: 300 });

  const PULSE_COST = 15;
  const ENERGY_REGEN_RATE = 0.5;
  const REVEAL_RADIUS = 120;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const initializeGame = useCallback(() => {
    const newTreasures: Treasure[] = [];
    const newObstacles: Obstacle[] = [];
    const newCreatures: Creature[] = [];

    // Generate treasures
    for (let i = 0; i < 12; i++) {
      const treasureType = TREASURE_TYPES[Math.floor(Math.random() * TREASURE_TYPES.length)];
      newTreasures.push({
        x: 50 + Math.random() * (CANVAS_WIDTH - 100),
        y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
        type: treasureType.type,
        emoji: treasureType.emoji,
        points: treasureType.points,
        collected: false,
      });
    }

    // Generate obstacles
    for (let i = 0; i < 8; i++) {
      newObstacles.push({
        x: Math.random() * (CANVAS_WIDTH - 80),
        y: Math.random() * (CANVAS_HEIGHT - 60),
        width: 40 + Math.random() * 60,
        height: 30 + Math.random() * 40,
        type: ["rock", "coral", "shipwreck"][Math.floor(Math.random() * 3)] as "rock" | "coral" | "shipwreck",
      });
    }

    // Generate creatures
    for (let i = 0; i < 6; i++) {
      const creatureType = CREATURE_TYPES[Math.floor(Math.random() * CREATURE_TYPES.length)];
      newCreatures.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        type: creatureType.type,
        emoji: creatureType.emoji,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 1,
      });
    }

    setTreasures(newTreasures);
    setObstacles(newObstacles);
    setCreatures(newCreatures);
    setEnergy(100);
    setScore(0);
    setPulses([]);
    setRevealedAreas([]);
    setGameWon(false);
    setSubmarinePos({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
    setGameStarted(true);
  }, []);

  const sendPulse = useCallback((x: number, y: number) => {
    if (energy < PULSE_COST) return;

    setEnergy(prev => Math.max(0, prev - PULSE_COST));
    setPulses(prev => [...prev, {
      x,
      y,
      radius: 0,
      maxRadius: REVEAL_RADIUS,
      alpha: 1,
      timestamp: Date.now(),
    }]);

    setRevealedAreas(prev => [...prev, { x, y }]);

    // Check for treasure collection
    setTreasures(prev => {
      let newScore = 0;
      const updated = prev.map(t => {
        if (!t.collected) {
          const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2);
          if (dist < REVEAL_RADIUS * 0.7) {
            newScore += t.points;
            return { ...t, collected: true };
          }
        }
        return t;
      });
      if (newScore > 0) {
        setScore(s => s + newScore);
      }
      return updated;
    });
  }, [energy]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gameWon) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    sendPulse(x, y);
    setSubmarinePos({ x, y });
  }, [gameStarted, gameWon, sendPulse]);

  // Energy regeneration
  useEffect(() => {
    if (!gameStarted || gameWon) return;

    const interval = setInterval(() => {
      setEnergy(prev => Math.min(100, prev + ENERGY_REGEN_RATE));
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, gameWon]);

  // Check win condition
  useEffect(() => {
    if (gameStarted && treasures.length > 0 && treasures.every(t => t.collected)) {
      setGameWon(true);
    }
  }, [treasures, gameStarted]);

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas with dark ocean color
      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw subtle ocean floor texture
      ctx.fillStyle = "#0d1d33";
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(
          (i * 37) % CANVAS_WIDTH,
          (i * 23) % CANVAS_HEIGHT,
          2 + (i % 3),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Update and draw creatures
      setCreatures(prev => prev.map(c => {
        let newX = c.x + c.dx;
        let newY = c.y + c.dy;
        let newDx = c.dx;
        let newDy = c.dy;

        if (newX < 0 || newX > CANVAS_WIDTH) newDx = -newDx;
        if (newY < 0 || newY > CANVAS_HEIGHT) newDy = -newDy;

        return {
          ...c,
          x: Math.max(0, Math.min(CANVAS_WIDTH, newX)),
          y: Math.max(0, Math.min(CANVAS_HEIGHT, newY)),
          dx: newDx,
          dy: newDy,
        };
      }));

      // Draw revealed areas with gradient
      revealedAreas.forEach(area => {
        const gradient = ctx.createRadialGradient(
          area.x, area.y, 0,
          area.x, area.y, REVEAL_RADIUS
        );
        gradient.addColorStop(0, "rgba(64, 224, 208, 0.15)");
        gradient.addColorStop(0.7, "rgba(64, 224, 208, 0.05)");
        gradient.addColorStop(1, "rgba(64, 224, 208, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      });

      // Draw pulses
      setPulses(prev => {
        const activePulses = prev.filter(p => p.alpha > 0).map(p => ({
          ...p,
          radius: p.radius + 3,
          alpha: Math.max(0, 1 - p.radius / p.maxRadius),
        }));

        activePulses.forEach(pulse => {
          ctx.strokeStyle = `rgba(64, 224, 208, ${pulse.alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Inner glow
          ctx.strokeStyle = `rgba(144, 238, 144, ${pulse.alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        });

        return activePulses;
      });

      // Draw visible items
      const isVisible = (x: number, y: number) => {
        return revealedAreas.some(area => {
          const dist = Math.sqrt((x - area.x) ** 2 + (y - area.y) ** 2);
          return dist < REVEAL_RADIUS;
        });
      };

      // Draw obstacles
      obstacles.forEach(obs => {
        if (isVisible(obs.x + obs.width / 2, obs.y + obs.height / 2)) {
          ctx.fillStyle = obs.type === "rock" ? "#4a5568" : 
                          obs.type === "coral" ? "#ed8936" : "#718096";
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          
          // Add texture
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(
              obs.x + Math.random() * obs.width,
              obs.y + Math.random() * obs.height,
              3, 3
            );
          }
        }
      });

      // Draw creatures
      creatures.forEach(creature => {
        if (isVisible(creature.x, creature.y)) {
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(creature.emoji, creature.x, creature.y);
        }
      });

      // Draw treasures
      treasures.forEach(treasure => {
        if (!treasure.collected && isVisible(treasure.x, treasure.y)) {
          ctx.font = "28px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Glow effect
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 15;
          ctx.fillText(treasure.emoji, treasure.x, treasure.y);
          ctx.shadowBlur = 0;
        }
      });

      // Draw submarine
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔱", submarinePos.x, submarinePos.y);

      // Draw sonar range indicator
      ctx.strokeStyle = "rgba(64, 224, 208, 0.3)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(submarinePos.x, submarinePos.y, REVEAL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameStarted, revealedAreas, obstacles, treasures, creatures, submarinePos]);

  const remainingTreasures = treasures.filter(t => !t.collected).length;

  return (
    <FeatureWrapper day={426} title="Pixel Sonar Explorer" emoji="🔱">
      <div className="flex flex-col items-center gap-6 p-4">
        <p className="text-center max-w-xl" style={{ color: "var(--color-text-dim)" }}>
          Dive into the mysterious abyss! Click to send sonar pulses and reveal hidden treasures.
          Each pulse costs energy, so explore wisely, captain! 🌊
        </p>

        {!gameStarted ? (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl animate-bounce">🔱</div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              Ready to Explore the Depths?
            </h2>
            <button
              onClick={initializeGame}
              className="btn-primary px-8 py-3 text-lg rounded-lg transition-transform hover:scale-105"
            >
              Begin Expedition 🚀
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-6 mb-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <span className="text-xl">⚡</span>
                <div className="w-32 h-4 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${energy}%`,
                      backgroundColor: energy > 30 ? "#40e0d0" : "#f56565"
                    }}
                  />
                </div>
                <span className="text-sm font-mono">{Math.floor(energy)}%</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <span className="text-xl">🪙</span>
                <span className="font-bold text-lg">{score}</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <span className="text-xl">💎</span>
                <span className="font-bold">{remainingTreasures} left</span>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{ border: "2px solid var(--color-border)" }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                className="cursor-crosshair"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              
              {gameWon && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
                    Mission Complete!
                  </h2>
                  <p className="text-xl text-cyan-300 mb-4">Final Score: {score}</p>
                  <button
                    onClick={initializeGame}
                    className="btn-primary px-6 py-2 rounded-lg"
                  >
                    Explore Again 🔱
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: "var(--color-text-dim)" }}>
              <span>🪙 Gold: 10pts</span>
              <span>💎 Gem: 25pts</span>
              <span>📦 Chest: 50pts</span>
              <span>🦪 Pearl: 15pts</span>
            </div>

            {energy < PULSE_COST && (
              <p className="text-amber-400 animate-pulse">
                ⚠️ Low energy! Wait for it to recharge...
              </p>
            )}
          </>
        )}
      </div>
    </FeatureWrapper>
  );
}