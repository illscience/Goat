"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Ant {
  x: number;
  y: number;
  direction: number;
  hasFood: boolean;
  id: number;
}

interface Cell {
  type: "empty" | "food" | "obstacle" | "nest";
  foodPheromone: number;
  homePheromone: number;
  foodAmount: number;
}

const CELL_SIZE = 4;
const GRID_WIDTH = 150;
const GRID_HEIGHT = 100;
const PHEROMONE_DECAY = 0.995;
const PHEROMONE_STRENGTH = 100;
const ANT_SPEED = 1;
const DIRECTION_COUNT = 8;

export default function PixelAntColony() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [ants, setAnts] = useState<Ant[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tool, setTool] = useState<"food" | "obstacle" | "eraser">("food");
  const [antCount, setAntCount] = useState(50);
  const [foodCollected, setFoodCollected] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const gridRef = useRef<Cell[][]>([]);
  const antsRef = useRef<Ant[]>([]);
  const foodCollectedRef = useRef(0);

  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        row.push({
          type: "empty",
          foodPheromone: 0,
          homePheromone: 0,
          foodAmount: 0,
        });
      }
      newGrid.push(row);
    }
    
    // Place nest in center
    const nestX = Math.floor(GRID_WIDTH / 2);
    const nestY = Math.floor(GRID_HEIGHT / 2);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (nestX + dx >= 0 && nestX + dx < GRID_WIDTH && nestY + dy >= 0 && nestY + dy < GRID_HEIGHT) {
          newGrid[nestY + dy][nestX + dx].type = "nest";
        }
      }
    }
    
    return newGrid;
  }, []);

  const initializeAnts = useCallback(() => {
    const newAnts: Ant[] = [];
    const nestX = Math.floor(GRID_WIDTH / 2);
    const nestY = Math.floor(GRID_HEIGHT / 2);
    
    for (let i = 0; i < antCount; i++) {
      newAnts.push({
        x: nestX + (Math.random() - 0.5) * 4,
        y: nestY + (Math.random() - 0.5) * 4,
        direction: Math.floor(Math.random() * DIRECTION_COUNT),
        hasFood: false,
        id: i,
      });
    }
    
    return newAnts;
  }, [antCount]);

  const resetSimulation = useCallback(() => {
    const newGrid = initializeGrid();
    const newAnts = initializeAnts();
    setGrid(newGrid);
    setAnts(newAnts);
    setFoodCollected(0);
    gridRef.current = newGrid;
    antsRef.current = newAnts;
    foodCollectedRef.current = 0;
  }, [initializeGrid, initializeAnts]);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  const getDirectionOffset = (direction: number) => {
    const directions = [
      { dx: 0, dy: -1 },  // N
      { dx: 1, dy: -1 },  // NE
      { dx: 1, dy: 0 },   // E
      { dx: 1, dy: 1 },   // SE
      { dx: 0, dy: 1 },   // S
      { dx: -1, dy: 1 },  // SW
      { dx: -1, dy: 0 },  // W
      { dx: -1, dy: -1 }, // NW
    ];
    return directions[direction % DIRECTION_COUNT];
  };

  const updateSimulation = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentAnts = antsRef.current;
    
    if (!currentGrid.length || !currentAnts.length) return;

    // Decay pheromones
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        currentGrid[y][x].foodPheromone *= PHEROMONE_DECAY;
        currentGrid[y][x].homePheromone *= PHEROMONE_DECAY;
        if (currentGrid[y][x].foodPheromone < 0.1) currentGrid[y][x].foodPheromone = 0;
        if (currentGrid[y][x].homePheromone < 0.1) currentGrid[y][x].homePheromone = 0;
      }
    }

    // Update ants
    for (const ant of currentAnts) {
      const gridX = Math.floor(ant.x);
      const gridY = Math.floor(ant.y);
      
      if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
        ant.x = GRID_WIDTH / 2;
        ant.y = GRID_HEIGHT / 2;
        continue;
      }

      const cell = currentGrid[gridY][gridX];

      // Check for food pickup
      if (!ant.hasFood && cell.type === "food" && cell.foodAmount > 0) {
        ant.hasFood = true;
        cell.foodAmount--;
        if (cell.foodAmount <= 0) {
          cell.type = "empty";
        }
        ant.direction = (ant.direction + 4) % DIRECTION_COUNT; // Turn around
      }

      // Check for food dropoff at nest
      if (ant.hasFood && cell.type === "nest") {
        ant.hasFood = false;
        foodCollectedRef.current++;
        ant.direction = (ant.direction + 4) % DIRECTION_COUNT; // Turn around
      }

      // Leave pheromone trail
      if (ant.hasFood) {
        currentGrid[gridY][gridX].foodPheromone = Math.min(
          currentGrid[gridY][gridX].foodPheromone + PHEROMONE_STRENGTH,
          255
        );
      } else {
        currentGrid[gridY][gridX].homePheromone = Math.min(
          currentGrid[gridY][gridX].homePheromone + PHEROMONE_STRENGTH,
          255
        );
      }

      // Sense pheromones in forward directions
      let bestDirection = ant.direction;
      let bestStrength = -1;
      
      for (let offset = -1; offset <= 1; offset++) {
        const checkDir = (ant.direction + offset + DIRECTION_COUNT) % DIRECTION_COUNT;
        const { dx, dy } = getDirectionOffset(checkDir);
        const checkX = Math.floor(ant.x + dx * 2);
        const checkY = Math.floor(ant.y + dy * 2);
        
        if (checkX >= 0 && checkX < GRID_WIDTH && checkY >= 0 && checkY < GRID_HEIGHT) {
          const checkCell = currentGrid[checkY][checkX];
          
          if (checkCell.type === "obstacle") continue;
          
          const pheromoneStrength = ant.hasFood 
            ? checkCell.homePheromone 
            : checkCell.foodPheromone;
          
          if (pheromoneStrength > bestStrength) {
            bestStrength = pheromoneStrength;
            bestDirection = checkDir;
          }
        }
      }

      // Add some randomness to movement
      if (Math.random() < 0.1 || bestStrength < 1) {
        ant.direction = (ant.direction + Math.floor(Math.random() * 3) - 1 + DIRECTION_COUNT) % DIRECTION_COUNT;
      } else {
        ant.direction = bestDirection;
      }

      // Move ant
      const { dx, dy } = getDirectionOffset(ant.direction);
      const newX = ant.x + dx * ANT_SPEED;
      const newY = ant.y + dy * ANT_SPEED;
      
      const newGridX = Math.floor(newX);
      const newGridY = Math.floor(newY);
      
      if (
        newGridX >= 0 && newGridX < GRID_WIDTH &&
        newGridY >= 0 && newGridY < GRID_HEIGHT &&
        currentGrid[newGridY][newGridX].type !== "obstacle"
      ) {
        ant.x = newX;
        ant.y = newY;
      } else {
        ant.direction = (ant.direction + 3 + Math.floor(Math.random() * 3)) % DIRECTION_COUNT;
      }

      // Keep ants in bounds
      ant.x = Math.max(1, Math.min(GRID_WIDTH - 2, ant.x));
      ant.y = Math.max(1, Math.min(GRID_HEIGHT - 2, ant.y));
    }

    setFoodCollected(foodCollectedRef.current);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const currentGrid = gridRef.current;
    const currentAnts = antsRef.current;
    
    if (!ctx || !currentGrid.length) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);

    // Draw pheromones and cells
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = currentGrid[y][x];
        
        // Draw pheromones first (background)
        if (cell.foodPheromone > 0 || cell.homePheromone > 0) {
          const foodIntensity = Math.min(cell.foodPheromone / 100, 1);
          const homeIntensity = Math.min(cell.homePheromone / 100, 1);
          
          const r = Math.floor(homeIntensity * 100);
          const g = Math.floor(foodIntensity * 200);
          const b = Math.floor(homeIntensity * 200);
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        // Draw cell types
        if (cell.type === "food") {
          const intensity = Math.min(cell.foodAmount / 10, 1);
          ctx.fillStyle = `rgb(${100 + intensity * 155}, ${200 + intensity * 55}, ${50})`;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell.type === "obstacle") {
          ctx.fillStyle = "#4a4a6a";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell.type === "nest") {
          ctx.fillStyle = "#8b4513";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw ants
    for (const ant of currentAnts) {
      ctx.fillStyle = ant.hasFood ? "#ffdd00" : "#ff6b6b";
      ctx.fillRect(
        Math.floor(ant.x) * CELL_SIZE,
        Math.floor(ant.y) * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const gameLoop = () => {
      updateSimulation();
      render();
      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isRunning, updateSimulation, render]);

  useEffect(() => {
    render();
  }, [grid, render]);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;

    const currentGrid = gridRef.current;
    const brushSize = 3;

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const px = x + dx;
        const py = y + dy;
        
        if (px < 0 || px >= GRID_WIDTH || py < 0 || py >= GRID_HEIGHT) continue;
        if (currentGrid[py][px].type === "nest") continue;

        if (tool === "food") {
          currentGrid[py][px].type = "food";
          currentGrid[py][px].foodAmount = 20;
        } else if (tool === "obstacle") {
          currentGrid[py][px].type = "obstacle";
          currentGrid[py][px].foodAmount = 0;
        } else if (tool === "eraser") {
          currentGrid[py][px].type = "empty";
          currentGrid[py][px].foodAmount = 0;
          currentGrid[py][px].foodPheromone = 0;
          currentGrid[py][px].homePheromone = 0;
        }
      }
    }

    setGrid([...currentGrid]);
    render();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    handleCanvasInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMouseDown) {
      handleCanvasInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  return (
    <FeatureWrapper day={367} title="Pixel Ant Colony" emoji="🐜">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Watch Collective Intelligence Emerge! 🧠
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            These tiny pixel ants follow simple rules, but together they create surprisingly 
            smart transportation networks. Place food (green) and watch them figure out the 
            best paths back to the nest. It's basically Uber, but with more antennae.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary px-4 py-2 rounded-lg font-medium"
          >
            {isRunning ? "⏸️ Pause" : "▶️ Start"}
          </button>
          <button
            onClick={resetSimulation}
            className="btn-secondary px-4 py-2 rounded-lg font-medium"
          >
            🔄 Reset
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setTool("food")}
            className={`px-3 py-2 rounded-lg font-medium transition-all ${
              tool === "food" 
                ? "bg-green-600 text-white" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🍎 Food
          </button>
          <button
            onClick={() => setTool("obstacle")}
            className={`px-3 py-2 rounded-lg font-medium transition-all ${
              tool === "obstacle" 
                ? "bg-gray-500 text-white" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🧱 Wall
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`px-3 py-2 rounded-lg font-medium transition-all ${
              tool === "eraser" 
                ? "bg-red-600 text-white" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🧹 Eraser
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Ants:
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={antCount}
              onChange={(e) => setAntCount(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm w-8" style={{ color: "var(--color-text)" }}>
              {antCount}
            </span>
          </div>
          <div 
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Food Collected:
            </span>
            <span 
              className="ml-2 font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {foodCollected} 🍎
            </span>
          </div>
        </div>

        <div 
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            border: "2px solid var(--color-border)",
            backgroundColor: "#1a1a2e"
          }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
            style={{ 
              width: GRID_WIDTH * CELL_SIZE,
              height: GRID_HEIGHT * CELL_SIZE,
              imageRendering: "pixelated"
            }}
          />
        </div>

        <div 
          className="flex flex-wrap justify-center gap-4 text-xs p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#8b4513" }}></div>
            <span style={{ color: "var(--color-text-dim)" }}>Nest</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#90ee90" }}></div>
            <span style={{ color: "var(--color-text-dim)" }}>Food</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ff6b6b" }}></div>
            <span style={{ color: "var(--color-text-dim)" }}>Searching Ant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ffdd00" }}></div>
            <span style={{ color: "var(--color-text-dim)" }}>Carrying Food</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#00c864" }}></div>
            <span style={{ color: "var(--color-text-dim)" }}>Food Trail</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#6464c8" }}></div>
            <span style={{ color: "var(--color-text-dim)" }}>Home Trail</span>
          </div>
        </div>

        <p 
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Pro tip: Create a maze with walls and place food at the end. 
          The ants will eventually find and optimize the path!
        </p>
      </div>
    </FeatureWrapper>
  );
}