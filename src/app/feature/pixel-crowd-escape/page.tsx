"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Position {
  x: number;
  y: number;
}

interface CrowdMember {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  personality: "rusher" | "shopper" | "tourist" | "wanderer" | "pacer";
  color: string;
  size: number;
  pauseTimer: number;
  direction: number;
}

interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GRID_SIZE = 20;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PLAYER_SIZE = 12;
const PLAYER_SPEED = 3;
const TIME_LIMIT = 60;

const PERSONALITY_COLORS: Record<CrowdMember["personality"], string> = {
  rusher: "#FF6B6B",
  shopper: "#4ECDC4",
  tourist: "#FFE66D",
  wanderer: "#95E1D3",
  pacer: "#DDA0DD",
};

const PERSONALITY_DESCRIPTIONS: Record<CrowdMember["personality"], string> = {
  rusher: "Late for a meeting!",
  shopper: "Ooh, what's that?",
  tourist: "Where am I again?",
  wanderer: "Just vibing~",
  pacer: "Back and forth...",
};

export default function PixelCrowdEscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState<"menu" | "playing" | "won" | "lost">("menu");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState("");

  const playerRef = useRef<Position>({ x: 50, y: CANVAS_HEIGHT / 2 });
  const crowdRef = useRef<CrowdMember[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  const exitRef = useRef<Position>({ x: CANVAS_WIDTH - 30, y: CANVAS_HEIGHT / 2 });

  const generateWalls = useCallback((levelNum: number): Wall[] => {
    const walls: Wall[] = [];
    const numWalls = 3 + levelNum * 2;

    for (let i = 0; i < numWalls; i++) {
      const isHorizontal = Math.random() > 0.5;
      const wall: Wall = {
        x: 100 + Math.random() * (CANVAS_WIDTH - 200),
        y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
        width: isHorizontal ? 60 + Math.random() * 80 : 15,
        height: isHorizontal ? 15 : 60 + Math.random() * 80,
      };
      walls.push(wall);
    }
    return walls;
  }, []);

  const generateCrowd = useCallback((levelNum: number): CrowdMember[] => {
    const crowd: CrowdMember[] = [];
    const numMembers = 5 + levelNum * 3;
    const personalities: CrowdMember["personality"][] = ["rusher", "shopper", "tourist", "wanderer", "pacer"];

    for (let i = 0; i < numMembers; i++) {
      const personality = personalities[Math.floor(Math.random() * personalities.length)];
      const x = 150 + Math.random() * (CANVAS_WIDTH - 250);
      const y = 50 + Math.random() * (CANVAS_HEIGHT - 100);

      crowd.push({
        id: i,
        x,
        y,
        targetX: x,
        targetY: y,
        speed: personality === "rusher" ? 2.5 : personality === "tourist" ? 0.5 : 1.5,
        personality,
        color: PERSONALITY_COLORS[personality],
        size: 10 + Math.random() * 6,
        pauseTimer: 0,
        direction: Math.random() * Math.PI * 2,
      });
    }
    return crowd;
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    setTimeLeft(TIME_LIMIT);
    setLevel(1);
    setScore(0);
    playerRef.current = { x: 50, y: CANVAS_HEIGHT / 2 };
    wallsRef.current = generateWalls(1);
    crowdRef.current = generateCrowd(1);
    exitRef.current = { x: CANVAS_WIDTH - 30, y: CANVAS_HEIGHT / 2 };
  }, [generateWalls, generateCrowd]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setScore((prev) => prev + timeLeft * 10);
    setTimeLeft(TIME_LIMIT);
    playerRef.current = { x: 50, y: CANVAS_HEIGHT / 2 };
    wallsRef.current = generateWalls(newLevel);
    crowdRef.current = generateCrowd(newLevel);
    exitRef.current = { x: CANVAS_WIDTH - 30, y: 30 + Math.random() * (CANVAS_HEIGHT - 60) };
  }, [level, timeLeft, generateWalls, generateCrowd]);

  const checkCollision = useCallback((x: number, y: number, size: number): boolean => {
    // Check wall collisions
    for (const wall of wallsRef.current) {
      if (
        x + size / 2 > wall.x &&
        x - size / 2 < wall.x + wall.width &&
        y + size / 2 > wall.y &&
        y - size / 2 < wall.y + wall.height
      ) {
        return true;
      }
    }
    return false;
  }, []);

  const updateCrowdMember = useCallback((member: CrowdMember): void => {
    switch (member.personality) {
      case "rusher":
        // Rushes in a straight line, then picks new target
        if (Math.abs(member.x - member.targetX) < 5 && Math.abs(member.y - member.targetY) < 5) {
          member.targetX = 100 + Math.random() * (CANVAS_WIDTH - 150);
          member.targetY = 50 + Math.random() * (CANVAS_HEIGHT - 100);
        }
        break;

      case "shopper":
        // Stops frequently, moves slowly between "shops"
        if (member.pauseTimer > 0) {
          member.pauseTimer--;
          return;
        }
        if (Math.abs(member.x - member.targetX) < 5 && Math.abs(member.y - member.targetY) < 5) {
          member.pauseTimer = 60 + Math.random() * 120;
          member.targetX = member.x + (Math.random() - 0.5) * 100;
          member.targetY = member.y + (Math.random() - 0.5) * 100;
        }
        break;

      case "tourist":
        // Moves erratically, often stops to look around
        if (member.pauseTimer > 0) {
          member.pauseTimer--;
          member.direction += 0.1;
          return;
        }
        if (Math.random() < 0.02) {
          member.pauseTimer = 30 + Math.random() * 60;
        }
        member.targetX = member.x + Math.cos(member.direction) * 50;
        member.targetY = member.y + Math.sin(member.direction) * 50;
        member.direction += (Math.random() - 0.5) * 0.3;
        break;

      case "wanderer":
        // Smooth, flowing movement
        member.direction += (Math.random() - 0.5) * 0.1;
        member.targetX = member.x + Math.cos(member.direction) * 30;
        member.targetY = member.y + Math.sin(member.direction) * 30;
        break;

      case "pacer":
        // Paces back and forth
        if (Math.abs(member.x - member.targetX) < 5) {
          member.targetX = member.targetX > CANVAS_WIDTH / 2 ? 150 : CANVAS_WIDTH - 150;
        }
        break;
    }

    // Move towards target
    const dx = member.targetX - member.x;
    const dy = member.targetY - member.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const newX = member.x + (dx / dist) * member.speed;
      const newY = member.y + (dy / dist) * member.speed;

      // Keep in bounds
      member.x = Math.max(member.size, Math.min(CANVAS_WIDTH - member.size, newX));
      member.y = Math.max(member.size, Math.min(CANVAS_HEIGHT - member.size, newY));

      // Bounce off walls
      if (checkCollision(member.x, member.y, member.size)) {
        member.direction += Math.PI;
        member.targetX = member.x + Math.cos(member.direction) * 50;
        member.targetY = member.y + Math.sin(member.direction) * 50;
      }
    }
  }, [checkCollision]);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Handle player movement
    const keys = keysRef.current;
    let newX = playerRef.current.x;
    let newY = playerRef.current.y;

    if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) newY -= PLAYER_SPEED;
    if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) newY += PLAYER_SPEED;
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) newX -= PLAYER_SPEED;
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) newX += PLAYER_SPEED;

    // Clamp to bounds
    newX = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX));
    newY = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, newY));

    // Check wall collision
    if (!checkCollision(newX, newY, PLAYER_SIZE)) {
      playerRef.current.x = newX;
      playerRef.current.y = newY;
    }

    // Update crowd
    crowdRef.current.forEach(updateCrowdMember);

    // Check crowd collision
    for (const member of crowdRef.current) {
      const dx = playerRef.current.x - member.x;
      const dy = playerRef.current.y - member.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < (PLAYER_SIZE + member.size) / 2) {
        setShowHint(PERSONALITY_DESCRIPTIONS[member.personality]);
        setTimeout(() => setShowHint(""), 1500);
        // Push player back
        playerRef.current.x += dx * 0.5;
        playerRef.current.y += dy * 0.5;
      }
    }

    // Check exit
    const exitDist = Math.sqrt(
      Math.pow(playerRef.current.x - exitRef.current.x, 2) +
      Math.pow(playerRef.current.y - exitRef.current.y, 2)
    );
    if (exitDist < 25) {
      nextLevel();
    }

    // Draw
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern
    ctx.strokeStyle = "#2a2a4e";
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw walls
    ctx.fillStyle = "#4a4a6e";
    wallsRef.current.forEach((wall) => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Draw exit
    ctx.fillStyle = "#00ff88";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(exitRef.current.x, exitRef.current.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw crowd
    crowdRef.current.forEach((member) => {
      ctx.fillStyle = member.color;
      ctx.beginPath();
      ctx.arc(member.x, member.y, member.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw direction indicator for rushers
      if (member.personality === "rusher") {
        const angle = Math.atan2(member.targetY - member.y, member.targetX - member.x);
        ctx.strokeStyle = member.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(member.x, member.y);
        ctx.lineTo(
          member.x + Math.cos(angle) * (member.size + 5),
          member.y + Math.sin(angle) * (member.size + 5)
        );
        ctx.stroke();
      }

      // Draw pause indicator for shoppers/tourists
      if (member.pauseTimer > 0) {
        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.fillText("...", member.x - 5, member.y - member.size - 5);
      }
    });

    // Draw player
    ctx.fillStyle = "#ff4444";
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(playerRef.current.x, playerRef.current.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw start zone
    ctx.strokeStyle = "#ffffff33";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 80, CANVAS_HEIGHT - 20);

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, checkCollision, updateCrowdMember, nextLevel]);

  // Timer effect
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Game loop effect
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <FeatureWrapper day={443} title="Pixel Crowd Escape" emoji="🏃">
      <div className="flex flex-col items-center gap-4 p-4">
        {gameState === "menu" && (
          <div className="text-center space-y-4">
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              Escape the Crowd! 🏃‍♂️
            </h2>
            <p style={{ color: "var(--color-text-dim)" }} className="max-w-md">
              You&apos;re the <span className="text-red-400 font-bold">red dot</span>. 
              Navigate through a chaotic crowd of NPCs, each with their own quirky behavior. 
              Reach the <span className="text-green-400 font-bold">green exit</span> before time runs out!
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm max-w-xs mx-auto" style={{ color: "var(--color-text-dim)" }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PERSONALITY_COLORS.rusher }}></span>
                <span>Rushers - Fast & focused</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PERSONALITY_COLORS.shopper }}></span>
                <span>Shoppers - Stop & go</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PERSONALITY_COLORS.tourist }}></span>
                <span>Tourists - Lost & confused</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PERSONALITY_COLORS.wanderer }}></span>
                <span>Wanderers - Just vibing</span>
              </div>
            </div>
            <button onClick={startGame} className="btn-primary text-lg px-8 py-3">
              Start Escaping! 🚀
            </button>
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Use Arrow Keys or WASD to move
            </p>
          </div>
        )}

        {gameState === "playing" && (
          <>
            <div className="flex justify-between w-full max-w-[600px] px-2">
              <div style={{ color: "var(--color-text)" }}>
                <span className="font-bold">Level:</span> {level}
              </div>
              <div style={{ color: "var(--color-text)" }}>
                <span className="font-bold">Score:</span> {score}
              </div>
              <div style={{ color: timeLeft < 10 ? "#ff4444" : "var(--color-text)" }}>
                <span className="font-bold">Time:</span> {timeLeft}s
              </div>
            </div>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="rounded-lg border-2"
                style={{ borderColor: "var(--color-border)" }}
              />
              {showHint && (
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text)" }}
                >
                  {showHint}
                </div>
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              💡 Watch the patterns! Tourists are unpredictable, shoppers stop suddenly.
            </p>
          </>
        )}

        {gameState === "won" && (
          <div className="text-center space-y-4">
            <h2
              className="text-3xl font-bold text-green-400"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              🎉 You Escaped!
            </h2>
            <p style={{ color: "var(--color-text-dim)" }}>
              You navigated through {level} levels of chaos!
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Final Score: {score + timeLeft * 10}
            </p>
            <button onClick={startGame} className="btn-primary">
              Play Again
            </button>
          </div>
        )}

        {gameState === "lost" && (
          <div className="text-center space-y-4">
            <h2
              className="text-3xl font-bold text-red-400"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              ⏰ Time&apos;s Up!
            </h2>
            <p style={{ color: "var(--color-text-dim)" }}>
              The crowd was too much... You made it to level {level}!
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Final Score: {score}
            </p>
            <button onClick={startGame} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        <div
          className="mt-4 p-3 rounded-lg text-sm"
          style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}
        >
          <strong>Pro tip:</strong> Each crowd member has personality! Learn their patterns to find the gaps. 🧠
        </div>
      </div>
    </FeatureWrapper>
  );
}