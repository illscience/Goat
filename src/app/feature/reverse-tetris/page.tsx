"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "#00f5ff" },
  O: { shape: [[1, 1], [1, 1]], color: "#ffd700" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#ff00ff" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#00ff00" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#ff0000" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#0000ff" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#ff8800" },
};

type TetrominoType = keyof typeof TETROMINOS;
type Board = (string | null)[][];

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const createMessyBoard = (seed: number): Board => {
  const board = createEmptyBoard();
  const colors = Object.values(TETROMINOS).map(t => t.color);
  
  // Use seeded random for consistent results
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };
  
  let randomIndex = 0;
  
  // Fill bottom 8 rows with messy blocks (leaving some gaps)
  for (let y = BOARD_HEIGHT - 1; y >= BOARD_HEIGHT - 8; y--) {
    const fillDensity = 0.5 + seededRandom(randomIndex++) * 0.3; // 50-80% filled
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (seededRandom(randomIndex++) < fillDensity) {
        board[y][x] = colors[Math.floor(seededRandom(randomIndex++) * colors.length)];
      }
    }
  }
  
  return board;
};

const getRandomTetromino = (seed?: number): Piece => {
  const types = Object.keys(TETROMINOS) as TetrominoType[];
  const randomValue = seed !== undefined 
    ? (Math.sin(seed) * 10000) - Math.floor(Math.sin(seed) * 10000)
    : Math.random();
  const type = types[Math.floor(randomValue * types.length)];
  const tetromino = TETROMINOS[type];
  return {
    type,
    shape: tetromino.shape.map(row => [...row]),
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
    y: BOARD_HEIGHT - 1, // Start at bottom
    color: tetromino.color,
  };
};

const rotatePiece = (piece: Piece): number[][] => {
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;
  const rotated: number[][] = [];
  
  for (let c = 0; c < cols; c++) {
    const newRow: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(piece.shape[r][c]);
    }
    rotated.push(newRow);
  }
  
  return rotated;
};

export default function ReverseTetris() {
  const [isClient, setIsClient] = useState(false);
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  
  const gameLoopRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkCollision = useCallback((piece: Piece, boardState: Board, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY < 0 || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          if (boardState[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback((piece: Piece, boardState: Board): Board => {
    const newBoard = boardState.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    
    return newBoard;
  }, []);

  const clearLines = useCallback((boardState: Board): { newBoard: Board; cleared: number } => {
    let cleared = 0;
    const newBoard = boardState.filter(row => {
      const isFull = row.every(cell => cell !== null);
      if (isFull) cleared++;
      return !isFull;
    });
    
    // Add empty rows at the bottom (reverse gravity!)
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.push(Array(BOARD_WIDTH).fill(null));
    }
    
    return { newBoard, cleared };
  }, []);

  const spawnPiece = useCallback(() => {
    if (!nextPiece) return null;
    const piece = { ...nextPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.floor(nextPiece.shape[0].length / 2), y: BOARD_HEIGHT - 1 };
    setNextPiece(getRandomTetromino());
    
    // Check if spawn position collides - game over
    if (checkCollision(piece, board)) {
      setGameOver(true);
      return null;
    }
    
    return piece;
  }, [nextPiece, board, checkCollision]);

  const moveUp = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    // Move up (reverse gravity)
    if (!checkCollision(currentPiece, board, 0, -1)) {
      setCurrentPiece(prev => prev ? { ...prev, y: prev.y - 1 } : null);
    } else {
      // Lock piece
      const newBoard = mergePiece(currentPiece, board);
      const { newBoard: clearedBoard, cleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      if (cleared > 0) {
        const points = [0, 100, 300, 500, 800][cleared] * level;
        setScore(prev => prev + points);
        setLinesCleared(prev => {
          const newTotal = prev + cleared;
          if (newTotal >= level * 10) {
            setLevel(l => l + 1);
          }
          return newTotal;
        });
      }
      
      const newPiece = spawnPiece();
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision, mergePiece, clearLines, spawnPiece, level]);

  const moveLeft = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece, board, -1, 0)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x - 1 } : null);
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision]);

  const moveRight = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece, board, 1, 0)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + 1 } : null);
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const rotatedShape = rotatePiece(currentPiece);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    
    if (!checkCollision(rotatedPiece, board)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let dropY = currentPiece.y;
    while (!checkCollision({ ...currentPiece, y: dropY - 1 }, board)) {
      dropY--;
    }
    
    const droppedPiece = { ...currentPiece, y: dropY };
    const newBoard = mergePiece(droppedPiece, board);
    const { newBoard: clearedBoard, cleared } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * level;
      setScore(prev => prev + points);
      setLinesCleared(prev => {
        const newTotal = prev + cleared;
        if (newTotal >= level * 10) {
          setLevel(l => l + 1);
        }
        return newTotal;
      });
    }
    
    const newPiece = spawnPiece();
    setCurrentPiece(newPiece);
  }, [currentPiece, board, gameOver, isPaused, checkCollision, mergePiece, clearLines, spawnPiece, level]);

  const startGame = () => {
    const seed = Date.now();
    setBoard(createMessyBoard(seed));
    setScore(0);
    setLinesCleared(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    setNextPiece(getRandomTetromino(seed + 1));
    setCurrentPiece(getRandomTetromino(seed + 2));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowUp":
          e.preventDefault();
          rotate();
          break;
        case "ArrowDown":
          e.preventDefault();
          moveUp();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        case "p":
        case "P":
          setIsPaused(prev => !prev);
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver, moveLeft, moveRight, rotate, moveUp, hardDrop]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    
    const gameLoop = (timestamp: number) => {
      if (timestamp - lastDropRef.current > dropInterval) {
        moveUp();
        lastDropRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, level, moveUp]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Draw current piece
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    return (
      <div className="flex flex-col items-center gap-1">
        {nextPiece.shape.map((row, y) => (
          <div key={y} className="flex gap-1">
            {row.map((cell, x) => (
              <div
                key={x}
                className="rounded-sm"
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: cell ? nextPiece.color : "transparent",
                  boxShadow: cell ? `inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)` : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const displayBoard = renderBoard();

  return (
    <FeatureWrapper day={378} title="Reverse Tetris" emoji="⬆️">
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center max-w-lg px-4">
          <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
            Gravity is broken! 🙃 Pieces float <strong>upward</strong>. Clear the chaos from the bottom.
            <br />
            <span className="text-sm">It&apos;s like archaeology meets Tetris!</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Game Board */}
          <div className="relative">
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                border: "3px solid var(--color-border)",
                boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="flex flex-col">
                {displayBoard.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((cell, x) => (
                      <div
                        key={x}
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          backgroundColor: cell || "rgba(0,0,0,0.2)",
                          border: cell ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
                          boxShadow: cell 
                            ? `inset 3px 3px 0 rgba(255,255,255,0.3), inset -3px -3px 0 rgba(0,0,0,0.3)`
                            : "none",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Overlays */}
            {!gameStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                <button onClick={startGame} className="btn-primary text-xl px-8 py-4">
                  🚀 Start Excavation
                </button>
              </div>
            )}

            {isPaused && gameStarted && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                <div className="text-center">
                  <p className="text-3xl mb-4">⏸️ Paused</p>
                  <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>Press P to continue</p>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <div className="text-center p-6">
                  <p className="text-3xl mb-2">🏛️ Excavation Complete!</p>
                  <p className="text-xl mb-4" style={{ color: "var(--color-text-dim)" }}>
                    Score: {score.toLocaleString()}
                  </p>
                  <button onClick={startGame} className="btn-primary">
                    Dig Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="flex flex-col gap-4 min-w-[140px]">
            {/* Stats */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>Score</h3>
              <p className="text-2xl font-mono" style={{ color: "var(--color-accent)" }}>
                {score.toLocaleString()}
              </p>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>Level</h3>
              <p className="text-2xl font-mono" style={{ color: "var(--color-accent)" }}>{level}</p>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>Lines</h3>
              <p className="text-2xl font-mono" style={{ color: "var(--color-accent)" }}>{linesCleared}</p>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>Next</h3>
              {isClient && renderNextPiece()}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          className="p-4 rounded-lg text-center max-w-md"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <h3 className="font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>Controls</h3>
          <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: "var(--color-text-dim)" }}>
            <span>⬅️ ➡️ Move</span>
            <span>⬆️ Rotate</span>
            <span>⬇️ Float up</span>
            <span>Space: Hard drop</span>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-dim)" }}>
            Press P to pause
          </p>
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex flex-col items-center gap-2">
          <button
            onClick={rotate}
            className="btn-secondary px-8 py-3"
          >
            🔄 Rotate
          </button>
          <div className="flex gap-2">
            <button onClick={moveLeft} className="btn-secondary px-6 py-3">⬅️</button>
            <button onClick={moveUp} className="btn-secondary px-6 py-3">⬆️</button>
            <button onClick={moveRight} className="btn-secondary px-6 py-3">➡️</button>
          </div>
          <button onClick={hardDrop} className="btn-primary px-8 py-3">
            ⚡ Hard Drop
          </button>
        </div>
      </div>
    </FeatureWrapper>
  );
}