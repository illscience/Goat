"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Position {
  x: number;
  y: number;
}

interface Wall {
  x: number;
  y: number;
  visible: boolean;
  opacity: number;
}

interface Maze {
  walls: boolean[][];
  width: number;
  height: number;
}

function generateMaze(width: number, height: number): Maze {
  const walls: boolean[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(true));

  const stack: Position[] = [];
  const startX = 1;
  const startY = 1;

  walls[startY][startX] = false;
  stack.push({ x: startX, y: startY });

  const directions = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { x: number; y: number; wx: number; wy: number }[] = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const wx = current.x + dir.dx / 2;
      const wy = current.y + dir.dy / 2;

      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && walls[ny][nx]) {
        neighbors.push({ x: nx, y: ny, wx, wy });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      walls[next.wy][next.wx] = false;
      walls[next.y][next.x] = false;
      stack.push({ x: next.x, y: next.y });
    } else {
      stack.pop();
    }
  }

  return { walls, width, height };
}

export default function InvisibleMazeRunner() {
  const [maze, setMaze] = useState<Maze | null>(null);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [goalPos, setGoalPos] = useState<Position>({ x: 1, y: 1 });
  const [revealedWalls, setRevealedWalls] = useState<Map<string, Wall>>(new Map());
  const [gameWon, setGameWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [bumps, setBumps] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);

  const CELL_SIZE = 20;
  const MAZE_WIDTH = 21;
  const MAZE_HEIGHT = 21;

  const playSound = useCallback((type: "bump" | "win") => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "bump") {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(100, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } else {
      oscillator.type = "sine";
      const notes = [523.25, 659.25, 783.99, 1046.5];
      let time = ctx.currentTime;
      notes.forEach((freq, i) => {
        oscillator.frequency.setValueAtTime(freq, time + i * 0.15);
      });
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
    }
  }, []);

  const initGame = useCallback(() => {
    const newMaze = generateMaze(MAZE_WIDTH, MAZE_HEIGHT);
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setGoalPos({ x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 });
    setRevealedWalls(new Map());
    setGameWon(false);
    setMoves(0);
    setBumps(0);
    setGameStarted(true);
  }, []);

  const revealWall = useCallback((x: number, y: number) => {
    const key = `${x},${y}`;
    setRevealedWalls((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, { x, y, visible: true, opacity: 1 });
      return newMap;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!maze || gameWon || !gameStarted) return;

      let dx = 0;
      let dy = 0;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          dy = -1;
          break;
        case "s":
        case "arrowdown":
          dy = 1;
          break;
        case "a":
        case "arrowleft":
          dx = -1;
          break;
        case "d":
        case "arrowright":
          dx = 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const newX = playerPos.x + dx;
      const newY = playerPos.y + dy;

      if (newX >= 0 && newX < maze.width && newY >= 0 && newY < maze.height) {
        if (maze.walls[newY][newX]) {
          playSound("bump");
          revealWall(newX, newY);
          setBumps((b) => b + 1);
        } else {
          setPlayerPos({ x: newX, y: newY });
          setMoves((m) => m + 1);

          if (newX === goalPos.x && newY === goalPos.y) {
            setGameWon(true);
            playSound("win");
          }
        }
      }
    },
    [maze, playerPos, goalPos, gameWon, gameStarted, playSound, revealWall]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const fadeWalls = () => {
      setRevealedWalls((prev) => {
        const newMap = new Map(prev);
        let changed = false;
        newMap.forEach((wall, key) => {
          if (wall.opacity > 0) {
            wall.opacity = Math.max(0, wall.opacity - 0.02);
            changed = true;
          }
        });
        return changed ? new Map(newMap) : prev;
      });
      animationRef.current = requestAnimationFrame(fadeWalls);
    };
    animationRef.current = requestAnimationFrame(fadeWalls);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    revealedWalls.forEach((wall) => {
      if (wall.opacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${wall.opacity})`;
        ctx.fillRect(wall.x * CELL_SIZE, wall.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    });

    const gradient = ctx.createRadialGradient(
      goalPos.x * CELL_SIZE + CELL_SIZE / 2,
      goalPos.y * CELL_SIZE + CELL_SIZE / 2,
      0,
      goalPos.x * CELL_SIZE + CELL_SIZE / 2,
      goalPos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE
    );
    gradient.addColorStop(0, "rgba(74, 222, 128, 0.8)");
    gradient.addColorStop(0.5, "rgba(74, 222, 128, 0.3)");
    gradient.addColorStop(1, "rgba(74, 222, 128, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      goalPos.x * CELL_SIZE + CELL_SIZE / 2,
      goalPos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    const playerGradient = ctx.createRadialGradient(
      playerPos.x * CELL_SIZE + CELL_SIZE / 2,
      playerPos.y * CELL_SIZE + CELL_SIZE / 2,
      0,
      playerPos.x * CELL_SIZE + CELL_SIZE / 2,
      playerPos.y * CELL_SIZE + CELL_SIZE / 2,
      (CELL_SIZE / 2) * pulseScale
    );
    playerGradient.addColorStop(0, "rgba(96, 165, 250, 1)");
    playerGradient.addColorStop(0.7, "rgba(96, 165, 250, 0.5)");
    playerGradient.addColorStop(1, "rgba(96, 165, 250, 0)");
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(
      playerPos.x * CELL_SIZE + CELL_SIZE / 2,
      playerPos.y * CELL_SIZE + CELL_SIZE / 2,
      (CELL_SIZE / 2) * pulseScale,
      0,
      Math.PI * 2
    );
    ctx.fill();

    animationRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas) canvas.dispatchEvent(new Event("render"));
    });
  }, [maze, playerPos, goalPos, revealedWalls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const render = () => {
      if (canvasRef.current) {
        canvasRef.current.dispatchEvent(new Event("render"));
      }
    };
    const interval = setInterval(render, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <FeatureWrapper day={366} title="Invisible Maze Runner" emoji="👻">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <p
            className="text-lg mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Navigate through darkness. Find the light.
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            The walls are invisible until you bump into them. Use{" "}
            <span className="font-mono bg-gray-800 px-1 rounded">WASD</span> or arrow keys to
            navigate. Reach the green glow to win!
          </p>
        </div>

        {!gameStarted ? (
          <button onClick={initGame} className="btn-primary text-lg px-8 py-3">
            🌑 Enter the Maze
          </button>
        ) : (
          <>
            <div className="flex gap-6 text-sm" style={{ color: "var(--color-text-dim)" }}>
              <span>
                👣 Moves: <strong style={{ color: "var(--color-text)" }}>{moves}</strong>
              </span>
              <span>
                💥 Bumps: <strong style={{ color: "var(--color-text)" }}>{bumps}</strong>
              </span>
            </div>

            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                border: "2px solid var(--color-border)",
                boxShadow: "0 0 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <canvas
                ref={canvasRef}
                width={MAZE_WIDTH * CELL_SIZE}
                height={MAZE_HEIGHT * CELL_SIZE}
                className="block"
                style={{ background: "#0a0a0a" }}
              />

              {gameWon && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-4xl mb-4">🎉</div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
                  >
                    You escaped!
                  </h2>
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-dim)" }}>
                    {moves} moves, {bumps} bumps
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--color-text-dim)" }}>
                    {bumps === 0
                      ? "Perfect run! Are you psychic? 🔮"
                      : bumps < 10
                        ? "Impressive navigation skills! 🧭"
                        : bumps < 25
                          ? "You made it through the darkness! 💪"
                          : "Bruised but victorious! 🩹"}
                  </p>
                  <button onClick={initGame} className="btn-primary">
                    🔄 Try Again
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={initGame}
              className="btn-secondary text-sm"
              style={{ color: "var(--color-text-dim)" }}
            >
              🔄 New Maze
            </button>
          </>
        )}

        <div
          className="text-xs text-center mt-4 max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>🎧 Tip: Turn on sound for audio cues!</p>
          <p className="mt-1 opacity-70">
            Thunk = wall | The green glow is your destination
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}