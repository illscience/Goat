"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Position {
  x: number;
  y: number;
}

interface Player {
  pos: Position;
  color: string;
  mirrorType: "original" | "horizontal" | "vertical" | "both";
}

interface Level {
  maze: number[][];
  safeZones: Position[];
  start: Position;
  mirrors: ("horizontal" | "vertical" | "both")[];
}

const CELL_SIZE = 24;

const levels: Level[] = [
  {
    maze: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    safeZones: [
      { x: 1, y: 1 },
      { x: 9, y: 1 },
    ],
    start: { x: 5, y: 3 },
    mirrors: ["horizontal"],
  },
  {
    maze: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    safeZones: [
      { x: 1, y: 1 },
      { x: 9, y: 1 },
      { x: 1, y: 7 },
      { x: 9, y: 7 },
    ],
    start: { x: 5, y: 4 },
    mirrors: ["horizontal", "vertical", "both"],
  },
  {
    maze: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    safeZones: [
      { x: 1, y: 1 },
      { x: 11, y: 1 },
      { x: 1, y: 9 },
      { x: 11, y: 9 },
    ],
    start: { x: 6, y: 5 },
    mirrors: ["horizontal", "vertical", "both"],
  },
];

export default function PixelMirrorMaze() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [moves, setMoves] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const level = levels[currentLevel];
  const mazeWidth = level.maze[0].length;
  const mazeHeight = level.maze.length;

  const initializePlayers = useCallback(() => {
    const newPlayers: Player[] = [
      { pos: { ...level.start }, color: "#3b82f6", mirrorType: "original" },
    ];

    level.mirrors.forEach((mirrorType, index) => {
      const colors = ["#ef4444", "#22c55e", "#a855f7"];
      let mirroredPos: Position;

      switch (mirrorType) {
        case "horizontal":
          mirroredPos = { x: mazeWidth - 1 - level.start.x, y: level.start.y };
          break;
        case "vertical":
          mirroredPos = { x: level.start.x, y: mazeHeight - 1 - level.start.y };
          break;
        case "both":
          mirroredPos = {
            x: mazeWidth - 1 - level.start.x,
            y: mazeHeight - 1 - level.start.y,
          };
          break;
      }

      newPlayers.push({
        pos: mirroredPos,
        color: colors[index % colors.length],
        mirrorType,
      });
    });

    setPlayers(newPlayers);
    setGameState("playing");
    setMoves(0);
  }, [level, mazeWidth, mazeHeight]);

  useEffect(() => {
    initializePlayers();
  }, [currentLevel, initializePlayers]);

  const isValidMove = (pos: Position): boolean => {
    if (pos.x < 0 || pos.x >= mazeWidth || pos.y < 0 || pos.y >= mazeHeight) {
      return false;
    }
    return level.maze[pos.y][pos.x] === 0;
  };

  const getMirroredMove = (
    dx: number,
    dy: number,
    mirrorType: "original" | "horizontal" | "vertical" | "both"
  ): { dx: number; dy: number } => {
    switch (mirrorType) {
      case "horizontal":
        return { dx: -dx, dy };
      case "vertical":
        return { dx, dy: -dy };
      case "both":
        return { dx: -dx, dy: -dy };
      default:
        return { dx, dy };
    }
  };

  const checkWinCondition = useCallback(
    (updatedPlayers: Player[]): boolean => {
      return updatedPlayers.every((player) =>
        level.safeZones.some(
          (zone) => zone.x === player.pos.x && zone.y === player.pos.y
        )
      );
    },
    [level.safeZones]
  );

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameState !== "playing") return;

      let anyCollision = false;
      const newPlayers = players.map((player) => {
        const { dx: mirroredDx, dy: mirroredDy } = getMirroredMove(
          dx,
          dy,
          player.mirrorType
        );
        const newPos = {
          x: player.pos.x + mirroredDx,
          y: player.pos.y + mirroredDy,
        };

        if (isValidMove(newPos)) {
          return { ...player, pos: newPos };
        } else {
          if (
            newPos.x >= 0 &&
            newPos.x < mazeWidth &&
            newPos.y >= 0 &&
            newPos.y < mazeHeight &&
            level.maze[newPos.y][newPos.x] === 1
          ) {
            anyCollision = true;
          }
          return player;
        }
      });

      setPlayers(newPlayers);
      setMoves((m) => m + 1);

      if (anyCollision) {
        // Just bump animation, don't lose
      }

      if (checkWinCondition(newPlayers)) {
        setGameState("won");
      }
    },
    [players, gameState, level.maze, mazeWidth, mazeHeight, checkWinCondition]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          movePlayer(1, 0);
          break;
        case "r":
        case "R":
          initializePlayers();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer, initializePlayers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw maze
      for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
          if (level.maze[y][x] === 1) {
            ctx.fillStyle = "#4a4a6a";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = "#6a6a8a";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }

      // Draw safe zones
      level.safeZones.forEach((zone) => {
        ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
        ctx.fillRect(zone.x * CELL_SIZE, zone.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          zone.x * CELL_SIZE + 2,
          zone.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4
        );
        ctx.lineWidth = 1;
      });

      // Draw players
      players.forEach((player) => {
        const isInSafeZone = level.safeZones.some(
          (zone) => zone.x === player.pos.x && zone.y === player.pos.y
        );

        ctx.beginPath();
        ctx.arc(
          player.pos.x * CELL_SIZE + CELL_SIZE / 2,
          player.pos.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = player.color;
        ctx.fill();

        if (isInSafeZone) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Mirror indicator
        if (player.mirrorType !== "original") {
          ctx.font = "10px monospace";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          const indicator =
            player.mirrorType === "horizontal"
              ? "↔"
              : player.mirrorType === "vertical"
              ? "↕"
              : "↔↕";
          ctx.fillText(
            indicator,
            player.pos.x * CELL_SIZE + CELL_SIZE / 2,
            player.pos.y * CELL_SIZE - 4
          );
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [players, level, mazeWidth, mazeHeight]);

  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel((l) => l + 1);
    }
  };

  const resetGame = () => {
    setCurrentLevel(0);
    initializePlayers();
  };

  return (
    <FeatureWrapper day={396} title="Pixel Mirror Maze" emoji="🪞">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Mirror, Mirror, in the Maze...
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Guide ALL your reflections to the{" "}
            <span className="text-green-500">green safe zones</span>. Your mirrors
            move opposite to you - think before you step!
          </p>
        </div>

        <div className="flex gap-4 items-center flex-wrap justify-center">
          <div
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text)",
            }}
          >
            Level {currentLevel + 1}/{levels.length}
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text)",
            }}
          >
            Moves: {moves}
          </div>
          <div className="flex gap-2">
            {players.map((player, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
                title={player.mirrorType}
              />
            ))}
          </div>
        </div>

        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            border: "2px solid var(--color-border)",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={mazeWidth * CELL_SIZE}
            height={mazeHeight * CELL_SIZE}
          />

          {gameState === "won" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
            >
              <div className="text-4xl mb-4">🎉</div>
              <h3
                className="text-xl font-bold text-green-400 mb-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Level Complete!
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--color-text-dim)" }}>
                Completed in {moves} moves
              </p>
              {currentLevel < levels.length - 1 ? (
                <button onClick={nextLevel} className="btn-primary">
                  Next Level →
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-yellow-400 mb-2">🏆 You beat all levels!</p>
                  <button onClick={resetGame} className="btn-secondary">
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="flex flex-col items-center gap-2 p-4 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="flex gap-1">
            <button
              onClick={() => movePlayer(0, -1)}
              className="w-10 h-10 rounded flex items-center justify-center text-lg"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              ↑
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => movePlayer(-1, 0)}
              className="w-10 h-10 rounded flex items-center justify-center text-lg"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              ←
            </button>
            <button
              onClick={() => movePlayer(0, 1)}
              className="w-10 h-10 rounded flex items-center justify-center text-lg"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              ↓
            </button>
            <button
              onClick={() => movePlayer(1, 0)}
              className="w-10 h-10 rounded flex items-center justify-center text-lg"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              →
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-dim)" }}>
            Or use Arrow Keys / WASD
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={initializePlayers} className="btn-secondary text-sm">
            🔄 Reset (R)
          </button>
        </div>

        <div
          className="text-xs text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p className="mb-1">
            <span className="text-blue-400">●</span> You &nbsp;
            <span className="text-red-400">●</span> Horizontal Mirror &nbsp;
            <span className="text-green-400">●</span> Vertical Mirror &nbsp;
            <span className="text-purple-400">●</span> Both
          </p>
          <p>↔ mirrors left/right • ↕ mirrors up/down • ↔↕ mirrors both</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}