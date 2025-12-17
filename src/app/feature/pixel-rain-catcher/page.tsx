"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pixel {
  id: number;
  x: number;
  y: number;
  color: string;
  points: number;
  speed: number;
  size: number;
}

const PIXEL_TYPES = [
  { color: "#FF6B6B", points: 10, name: "Red" },
  { color: "#4ECDC4", points: 20, name: "Cyan" },
  { color: "#FFE66D", points: 30, name: "Gold" },
  { color: "#95E1D3", points: 15, name: "Mint" },
  { color: "#F38181", points: 25, name: "Coral" },
  { color: "#AA96DA", points: 50, name: "Purple" },
  { color: "#FCBAD3", points: 5, name: "Pink" },
];

const BUCKET_WIDTH = 80;
const BUCKET_HEIGHT = 40;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;

export default function PixelRainCatcher() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bucketX, setBucketX] = useState(GAME_WIDTH / 2 - BUCKET_WIDTH / 2);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [catchStreak, setCatchStreak] = useState(0);
  const [lastCatchColor, setLastCatchColor] = useState<string | null>(null);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const pixelIdRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getSpawnRate = useCallback(() => {
    const baseRate = 800;
    const minRate = 200;
    const reduction = Math.floor(score / 100) * 50;
    return Math.max(minRate, baseRate - reduction);
  }, [score]);

  const getBaseSpeed = useCallback(() => {
    return 2 + Math.floor(score / 150) * 0.5;
  }, [score]);

  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  const playCatchSound = useCallback((points: number) => {
    const baseFreq = 400 + points * 8;
    playSound(baseFreq, 0.15);
    setTimeout(() => playSound(baseFreq * 1.5, 0.1), 50);
  }, [playSound]);

  const playMissSound = useCallback(() => {
    playSound(150, 0.2);
  }, [playSound]);

  const spawnPixel = useCallback(() => {
    const type = PIXEL_TYPES[Math.floor(Math.random() * PIXEL_TYPES.length)];
    const size = 15 + Math.random() * 10;
    const newPixel: Pixel = {
      id: pixelIdRef.current++,
      x: Math.random() * (GAME_WIDTH - size),
      y: -size,
      color: type.color,
      points: type.points,
      speed: getBaseSpeed() + Math.random() * 1.5,
      size,
    };
    setPixels(prev => [...prev, newPixel]);
  }, [getBaseSpeed]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== "playing" || !gameAreaRef.current) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - BUCKET_WIDTH / 2;
    setBucketX(Math.max(0, Math.min(GAME_WIDTH - BUCKET_WIDTH, x)));
  }, [gameState]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== "playing" || !gameAreaRef.current) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left - BUCKET_WIDTH / 2;
    setBucketX(Math.max(0, Math.min(GAME_WIDTH - BUCKET_WIDTH, x)));
  }, [gameState]);

  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setPixels([]);
    setMissedCount(0);
    setCatchStreak(0);
    setLastCatchColor(null);
    setBucketX(GAME_WIDTH / 2 - BUCKET_WIDTH / 2);
    pixelIdRef.current = 0;
    lastSpawnRef.current = 0;
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastSpawnRef.current > getSpawnRate()) {
        spawnPixel();
        lastSpawnRef.current = timestamp;
      }

      setPixels(prev => {
        const bucketTop = GAME_HEIGHT - BUCKET_HEIGHT;
        const bucketLeft = bucketX;
        const bucketRight = bucketX + BUCKET_WIDTH;

        let caught = false;
        let caughtPoints = 0;
        let caughtColor = "";
        let missed = 0;

        const remaining = prev.filter(pixel => {
          const pixelBottom = pixel.y + pixel.size;
          const pixelCenter = pixel.x + pixel.size / 2;

          if (
            pixelBottom >= bucketTop &&
            pixel.y <= GAME_HEIGHT &&
            pixelCenter >= bucketLeft &&
            pixelCenter <= bucketRight
          ) {
            caught = true;
            caughtPoints += pixel.points;
            caughtColor = pixel.color;
            return false;
          }

          if (pixel.y > GAME_HEIGHT) {
            missed++;
            return false;
          }

          return true;
        }).map(pixel => ({
          ...pixel,
          y: pixel.y + pixel.speed,
        }));

        if (caught) {
          playCatchSound(caughtPoints);
          setScore(s => s + caughtPoints);
          setCatchStreak(s => s + 1);
          setLastCatchColor(caughtColor);
        }

        if (missed > 0) {
          playMissSound();
          setMissedCount(m => {
            const newCount = m + missed;
            if (newCount >= 10) {
              setGameState("gameover");
            }
            return newCount;
          });
          setCatchStreak(0);
        }

        return remaining;
      });

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameState, bucketX, getSpawnRate, spawnPixel, playCatchSound, playMissSound]);

  useEffect(() => {
    if (gameState === "gameover" && score > highScore) {
      setHighScore(score);
    }
  }, [gameState, score, highScore]);

  return (
    <FeatureWrapper day={382} title="Pixel Rain Catcher" emoji="🌧️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Catch the falling pixels! 🎨
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Move your mouse (or finger) to guide the bucket. Don&apos;t let too many pixels hit the ground!
          </p>
        </div>

        <div className="flex gap-8 text-lg font-bold">
          <div style={{ color: "var(--color-accent)" }}>
            Score: {score}
          </div>
          <div style={{ color: "var(--color-text-dim)" }}>
            High Score: {highScore}
          </div>
          <div style={{ color: missedCount >= 7 ? "#FF6B6B" : "var(--color-text)" }}>
            ❌ {missedCount}/10
          </div>
        </div>

        {catchStreak >= 5 && (
          <div 
            className="text-lg font-bold animate-pulse"
            style={{ color: lastCatchColor || "var(--color-accent)" }}
          >
            🔥 {catchStreak} catch streak! 🔥
          </div>
        )}

        <div
          ref={gameAreaRef}
          className="relative cursor-none rounded-xl overflow-hidden"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: "var(--color-bg-secondary)",
            border: "2px solid var(--color-border)",
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">🪣</div>
              <button
                onClick={startGame}
                className="btn-primary px-8 py-3 text-xl font-bold rounded-lg transition-transform hover:scale-105"
              >
                Start Game
              </button>
              <div className="mt-4 text-center" style={{ color: "var(--color-text-dim)" }}>
                <p className="text-sm">Point values:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {PIXEL_TYPES.map((type, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: type.color, color: "#000" }}
                    >
                      {type.name}: {type.points}pts
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 z-10">
              <div className="text-4xl font-bold" style={{ color: "#FF6B6B" }}>
                Game Over!
              </div>
              <div className="text-2xl" style={{ color: "var(--color-text)" }}>
                Final Score: {score}
              </div>
              {score === highScore && score > 0 && (
                <div className="text-xl animate-bounce" style={{ color: "#FFE66D" }}>
                  🏆 New High Score! 🏆
                </div>
              )}
              <button
                onClick={startGame}
                className="btn-primary px-8 py-3 text-xl font-bold rounded-lg transition-transform hover:scale-105 mt-4"
              >
                Play Again
              </button>
            </div>
          )}

          {pixels.map(pixel => (
            <div
              key={pixel.id}
              className="absolute rounded-sm"
              style={{
                left: pixel.x,
                top: pixel.y,
                width: pixel.size,
                height: pixel.size,
                backgroundColor: pixel.color,
                boxShadow: `0 0 10px ${pixel.color}`,
              }}
            />
          ))}

          {gameState === "playing" && (
            <div
              className="absolute bottom-0 rounded-t-lg"
              style={{
                left: bucketX,
                width: BUCKET_WIDTH,
                height: BUCKET_HEIGHT,
                background: "linear-gradient(to bottom, #8B5A2B 0%, #5D3A1A 100%)",
                border: "3px solid #4A2D0F",
                borderBottom: "none",
                boxShadow: "inset 0 5px 15px rgba(0,0,0,0.3)",
              }}
            >
              <div 
                className="absolute top-1 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              />
            </div>
          )}

          {gameState === "playing" && (
            <div 
              className="absolute bottom-2 left-2 text-xs"
              style={{ color: "var(--color-text-dim)" }}
            >
              Speed: {getBaseSpeed().toFixed(1)}x
            </div>
          )}
        </div>

        <div className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
          <p>💡 Pro tip: The rain gets faster as your score increases!</p>
          <p>Purple pixels are rare but worth 50 points! 💜</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}