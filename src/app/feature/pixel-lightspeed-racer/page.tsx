"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Star {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
}

interface Debris {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: "asteroid" | "satellite" | "crystal";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function PixelLightspeedRacer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const debrisRef = useRef<Debris[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shipYRef = useRef<number>(250);
  const targetYRef = useRef<number>(250);
  const speedRef = useRef<number>(1);
  const scoreRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);
  const lastDebrisRef = useRef<number>(0);

  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(1);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;
  const SHIP_WIDTH = 24;
  const SHIP_HEIGHT = 16;
  const SHIP_X = 80;

  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * CANVAS_WIDTH - CANVAS_WIDTH / 2;
      const y = Math.random() * CANVAS_HEIGHT - CANVAS_HEIGHT / 2;
      const z = Math.random() * CANVAS_WIDTH;
      stars.push({ x, y, z, prevX: x, prevY: y });
    }
    starsRef.current = stars;
  }, []);

  const spawnDebris = useCallback(() => {
    const types: Array<"asteroid" | "satellite" | "crystal"> = ["asteroid", "asteroid", "satellite", "crystal"];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = type === "asteroid" ? 20 + Math.random() * 30 : type === "satellite" ? 15 + Math.random() * 20 : 10 + Math.random() * 15;
    
    debrisRef.current.push({
      x: CANVAS_WIDTH + 50,
      y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
      width: size,
      height: size * (type === "satellite" ? 0.5 : 1),
      speed: 2 + speedRef.current * 0.5,
      type
    });
  }, []);

  const createExplosion = useCallback((x: number, y: number) => {
    const colors = ["#ff6b6b", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }, []);

  const drawPixelShip = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, speed: number) => {
    ctx.save();
    
    // Engine glow based on speed
    const glowIntensity = Math.min(speed / 10, 1);
    const glowSize = 10 + glowIntensity * 20;
    const gradient = ctx.createRadialGradient(x - 5, y, 0, x - 5, y, glowSize);
    gradient.addColorStop(0, `rgba(0, 255, 255, ${0.8 * glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(0, 150, 255, ${0.4 * glowIntensity})`);
    gradient.addColorStop(1, "rgba(0, 100, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - glowSize, y - glowSize / 2, glowSize, glowSize);

    // Ship body (pixel art style)
    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(x, y - 4, 20, 8);
    
    ctx.fillStyle = "#2d5a87";
    ctx.fillRect(x + 4, y - 6, 12, 12);
    
    ctx.fillStyle = "#4a90c2";
    ctx.fillRect(x + 8, y - 4, 8, 8);
    
    // Cockpit
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(x + 16, y - 2, 4, 4);
    
    // Wings
    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(x + 2, y - 10, 8, 4);
    ctx.fillRect(x + 2, y + 6, 8, 4);
    
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(x + 2, y - 8, 2, 2);
    ctx.fillRect(x + 2, y + 6, 2, 2);

    // Engine flames
    const flameLength = 5 + Math.random() * 10 * glowIntensity;
    ctx.fillStyle = `rgba(255, 100, 50, ${0.8 + Math.random() * 0.2})`;
    ctx.fillRect(x - flameLength, y - 2, flameLength, 4);
    ctx.fillStyle = `rgba(255, 200, 100, ${0.6 + Math.random() * 0.2})`;
    ctx.fillRect(x - flameLength * 0.6, y - 1, flameLength * 0.6, 2);

    ctx.restore();
  }, []);

  const drawDebris = useCallback((ctx: CanvasRenderingContext2D, debris: Debris) => {
    ctx.save();
    
    if (debris.type === "asteroid") {
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(debris.x, debris.y, debris.width, debris.height);
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(debris.x + 4, debris.y + 4, debris.width * 0.4, debris.height * 0.4);
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(debris.x + debris.width * 0.5, debris.y + debris.height * 0.3, debris.width * 0.3, debris.height * 0.3);
    } else if (debris.type === "satellite") {
      ctx.fillStyle = "#888";
      ctx.fillRect(debris.x, debris.y, debris.width, debris.height);
      ctx.fillStyle = "#4a90c2";
      ctx.fillRect(debris.x - 8, debris.y + debris.height / 2 - 2, 8, 4);
      ctx.fillRect(debris.x + debris.width, debris.y + debris.height / 2 - 2, 8, 4);
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(debris.x + debris.width / 2 - 1, debris.y, 2, 2);
    } else {
      ctx.fillStyle = "#ff9ff3";
      ctx.fillRect(debris.x, debris.y, debris.width, debris.height);
      ctx.fillStyle = "#fff";
      ctx.fillRect(debris.x + debris.width * 0.3, debris.y + debris.height * 0.3, debris.width * 0.2, debris.height * 0.2);
    }
    
    ctx.restore();
  }, []);

  const checkCollision = useCallback((shipY: number, debris: Debris): boolean => {
    const shipLeft = SHIP_X;
    const shipRight = SHIP_X + SHIP_WIDTH;
    const shipTop = shipY - SHIP_HEIGHT / 2;
    const shipBottom = shipY + SHIP_HEIGHT / 2;

    const debrisLeft = debris.x;
    const debrisRight = debris.x + debris.width;
    const debrisTop = debris.y;
    const debrisBottom = debris.y + debris.height;

    return shipLeft < debrisRight && shipRight > debrisLeft && shipTop < debrisBottom && shipBottom > debrisTop;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update game time and speed
    gameTimeRef.current += 1;
    speedRef.current = Math.min(1 + gameTimeRef.current / 300, 15);
    distanceRef.current += speedRef.current;
    scoreRef.current = Math.floor(distanceRef.current / 10);

    // Update UI less frequently
    if (gameTimeRef.current % 10 === 0) {
      setScore(scoreRef.current);
      setCurrentSpeed(Math.round(speedRef.current * 10) / 10);
    }

    // Draw and update stars with speed warping
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const warpFactor = Math.min(speedRef.current / 5, 1);

    starsRef.current.forEach((star) => {
      star.prevX = star.x / star.z * 200 + centerX;
      star.prevY = star.y / star.z * 200 + centerY;
      
      star.z -= speedRef.current * 2;
      
      if (star.z <= 0) {
        star.x = Math.random() * CANVAS_WIDTH - centerX;
        star.y = Math.random() * CANVAS_HEIGHT - centerY;
        star.z = CANVAS_WIDTH;
        star.prevX = star.x / star.z * 200 + centerX;
        star.prevY = star.y / star.z * 200 + centerY;
      }

      const screenX = star.x / star.z * 200 + centerX;
      const screenY = star.y / star.z * 200 + centerY;

      if (screenX >= 0 && screenX <= CANVAS_WIDTH && screenY >= 0 && screenY <= CANVAS_HEIGHT) {
        const brightness = Math.min(255, 255 - star.z / 2);
        const size = Math.max(1, (1 - star.z / CANVAS_WIDTH) * 3);
        
        if (warpFactor > 0.2) {
          // Draw streak lines at high speed
          ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${Math.min(255, brightness + 100)}, ${warpFactor})`;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(star.prevX, star.prevY);
          ctx.lineTo(screenX, screenY);
          ctx.stroke();
        }
        
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${Math.min(255, brightness + 50)})`;
        ctx.fillRect(screenX, screenY, size, size);
      }
    });

    // Screen edge warp effect at high speeds
    if (warpFactor > 0.3) {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, CANVAS_WIDTH / 2);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.7, "transparent");
      gradient.addColorStop(1, `rgba(100, 150, 255, ${warpFactor * 0.3})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Spawn debris
    const debrisInterval = Math.max(30, 80 - speedRef.current * 3);
    if (gameTimeRef.current - lastDebrisRef.current > debrisInterval) {
      spawnDebris();
      lastDebrisRef.current = gameTimeRef.current;
    }

    // Update and draw debris
    debrisRef.current = debrisRef.current.filter((debris) => {
      debris.x -= debris.speed + speedRef.current;
      
      if (debris.x + debris.width < 0) {
        return false;
      }

      drawDebris(ctx, debris);
      return true;
    });

    // Smooth ship movement
    const moveSpeed = 0.15;
    shipYRef.current += (targetYRef.current - shipYRef.current) * moveSpeed;
    shipYRef.current = Math.max(20, Math.min(CANVAS_HEIGHT - 20, shipYRef.current));

    // Check collisions
    for (const debris of debrisRef.current) {
      if (checkCollision(shipYRef.current, debris)) {
        createExplosion(SHIP_X + SHIP_WIDTH / 2, shipYRef.current);
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
        }
        setGameState("gameover");
        return;
      }
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      
      if (particle.life <= 0) return false;
      
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life;
      ctx.fillRect(particle.x, particle.y, 3, 3);
      ctx.globalAlpha = 1;
      
      return true;
    });

    // Draw ship
    drawPixelShip(ctx, SHIP_X, shipYRef.current, speedRef.current);

    // Speed indicator
    ctx.fillStyle = "#00ffff";
    ctx.font = "12px monospace";
    ctx.fillText(`WARP: ${(speedRef.current).toFixed(1)}x`, CANVAS_WIDTH - 100, 25);
    
    // Distance meter
    const meterWidth = 100;
    const meterFill = (speedRef.current / 15) * meterWidth;
    ctx.fillStyle = "#333";
    ctx.fillRect(CANVAS_WIDTH - 110, 35, meterWidth, 8);
    const meterGradient = ctx.createLinearGradient(CANVAS_WIDTH - 110, 0, CANVAS_WIDTH - 10, 0);
    meterGradient.addColorStop(0, "#00ff00");
    meterGradient.addColorStop(0.5, "#ffff00");
    meterGradient.addColorStop(1, "#ff0000");
    ctx.fillStyle = meterGradient;
    ctx.fillRect(CANVAS_WIDTH - 110, 35, meterFill, 8);

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [spawnDebris, drawDebris, checkCollision, createExplosion, drawPixelShip, highScore]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    targetYRef.current = e.clientY - rect.top;
  }, [gameState]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      targetYRef.current = touch.clientY - rect.top;
    }
  }, [gameState]);

  const startGame = useCallback(() => {
    shipYRef.current = CANVAS_HEIGHT / 2;
    targetYRef.current = CANVAS_HEIGHT / 2;
    speedRef.current = 1;
    scoreRef.current = 0;
    distanceRef.current = 0;
    gameTimeRef.current = 0;
    lastDebrisRef.current = 0;
    debrisRef.current = [];
    particlesRef.current = [];
    initStars();
    setScore(0);
    setCurrentSpeed(1);
    setGameState("playing");
  }, [initStars]);

  useEffect(() => {
    initStars();
  }, [initStars]);

  useEffect(() => {
    if (gameState === "playing") {
      frameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Draw menu/gameover screens
  useEffect(() => {
    if (gameState !== "playing") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Static stars
      starsRef.current.forEach((star) => {
        const screenX = star.x / star.z * 200 + CANVAS_WIDTH / 2;
        const screenY = star.y / star.z * 200 + CANVAS_HEIGHT / 2;
        if (screenX >= 0 && screenX <= CANVAS_WIDTH && screenY >= 0 && screenY <= CANVAS_HEIGHT) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(screenX, screenY, 2, 2);
        }
      });

      // Draw a static ship
      drawPixelShip(ctx, CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT / 2 - 50, 3);
    }
  }, [gameState, drawPixelShip]);

  return (
    <FeatureWrapper day={447} title="Pixel Lightspeed Racer" emoji="🚀">
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center max-w-md">
          <p className="text-lg mb-2" style={{ color: "var(--color-text-dim)" }}>
            Push your ship to the edge of lightspeed. Dodge space debris as reality warps around you.
          </p>
          {highScore > 0 && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>
              🏆 High Score: {highScore.toLocaleString()}
            </p>
          )}
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="rounded-lg cursor-none"
            style={{
              border: "2px solid var(--color-border)",
              maxWidth: "100%",
              touchAction: "none"
            }}
          />

          {gameState === "menu" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-lg"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            >
              <h2
                className="text-4xl font-bold tracking-wider"
                style={{ fontFamily: "var(--font-serif)", color: "#00ffff" }}
              >
                LIGHTSPEED RACER
              </h2>
              <p className="text-sm px-8 text-center" style={{ color: "var(--color-text-dim)" }}>
                Move your mouse (or finger) to navigate. Survive as long as you can.
              </p>
              <button
                onClick={startGame}
                className="btn-primary px-8 py-3 text-lg font-bold"
              >
                🚀 LAUNCH
              </button>
            </div>
          )}

          {gameState === "gameover" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
            >
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: "var(--font-serif)", color: "#ff6b6b" }}
              >
                SHIP DESTROYED
              </h2>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#00ffff" }}>
                  {score.toLocaleString()} LIGHT-YEARS
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-dim)" }}>
                  Max Warp: {currentSpeed.toFixed(1)}x
                </p>
              </div>
              {score >= highScore && score > 0 && (
                <p className="text-lg font-bold" style={{ color: "#feca57" }}>
                  🏆 NEW HIGH SCORE! 🏆
                </p>
              )}
              <button
                onClick={startGame}
                className="btn-primary px-8 py-3 text-lg font-bold mt-2"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {gameState === "playing" && (
            <div
              className="absolute top-4 left-4 px-4 py-2 rounded"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <p className="text-xl font-bold font-mono" style={{ color: "#00ffff" }}>
                {score.toLocaleString()} LY
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-8 text-sm" style={{ color: "var(--color-text-dim)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🖱️</span>
            <span>Move to steer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span>Speed increases over time</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">☄️</span>
            <span>Avoid debris</span>
          </div>
        </div>
      </div>
    </FeatureWrapper>
  );
}