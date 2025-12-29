"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Ant {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hasFood: boolean;
  targetFood: { x: number; y: number } | null;
  homeward: boolean;
  trail: { x: number; y: number }[];
}

interface FoodSource {
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
}

export default function PixelAntHighway() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const antsRef = useRef<Ant[]>([]);
  const foodSourcesRef = useRef<FoodSource[]>([]);
  const pheromoneMapRef = useRef<number[][]>([]);
  const nestRef = useRef({ x: 300, y: 300 });
  
  const [antCount, setAntCount] = useState(50);
  const [foodCollected, setFoodCollected] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showPheromones, setShowPheromones] = useState(true);
  const [speed, setSpeed] = useState(1);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;
  const PHEROMONE_DECAY = 0.995;
  const PHEROMONE_STRENGTH = 5;
  const ANT_SPEED = 2;
  const SENSE_RADIUS = 20;
  const SENSE_ANGLE = Math.PI / 3;

  const initializePheromoneMap = useCallback(() => {
    const map: number[][] = [];
    for (let i = 0; i < CANVAS_WIDTH; i++) {
      map[i] = [];
      for (let j = 0; j < CANVAS_HEIGHT; j++) {
        map[i][j] = 0;
      }
    }
    pheromoneMapRef.current = map;
  }, []);

  const createAnt = useCallback((): Ant => {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: nestRef.current.x + (Math.random() - 0.5) * 20,
      y: nestRef.current.y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * ANT_SPEED,
      vy: Math.sin(angle) * ANT_SPEED,
      hasFood: false,
      targetFood: null,
      homeward: false,
      trail: [],
    };
  }, []);

  const initializeAnts = useCallback(() => {
    const ants: Ant[] = [];
    for (let i = 0; i < antCount; i++) {
      ants.push(createAnt());
    }
    antsRef.current = ants;
  }, [antCount, createAnt]);

  const sensePheromones = useCallback((ant: Ant, angle: number): number => {
    let total = 0;
    const senseX = Math.round(ant.x + Math.cos(angle) * SENSE_RADIUS);
    const senseY = Math.round(ant.y + Math.sin(angle) * SENSE_RADIUS);
    
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const x = senseX + dx;
        const y = senseY + dy;
        if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
          total += pheromoneMapRef.current[x][y];
        }
      }
    }
    return total;
  }, []);

  const updateAnt = useCallback((ant: Ant) => {
    // Leave pheromone trail when carrying food
    if (ant.hasFood) {
      const x = Math.round(ant.x);
      const y = Math.round(ant.y);
      if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
        pheromoneMapRef.current[x][y] = Math.min(
          pheromoneMapRef.current[x][y] + PHEROMONE_STRENGTH,
          255
        );
      }
    }

    const currentAngle = Math.atan2(ant.vy, ant.vx);
    
    if (ant.hasFood) {
      // Head back to nest
      const toNestX = nestRef.current.x - ant.x;
      const toNestY = nestRef.current.y - ant.y;
      const toNestAngle = Math.atan2(toNestY, toNestX);
      
      ant.vx = Math.cos(toNestAngle) * ANT_SPEED;
      ant.vy = Math.sin(toNestAngle) * ANT_SPEED;
      
      // Check if reached nest
      const distToNest = Math.sqrt(toNestX * toNestX + toNestY * toNestY);
      if (distToNest < 15) {
        ant.hasFood = false;
        ant.homeward = false;
        setFoodCollected(prev => prev + 1);
        // Turn around
        const outAngle = Math.random() * Math.PI * 2;
        ant.vx = Math.cos(outAngle) * ANT_SPEED;
        ant.vy = Math.sin(outAngle) * ANT_SPEED;
      }
    } else {
      // Look for food or follow pheromones
      let foundFood = false;
      
      // Check for nearby food
      for (const food of foodSourcesRef.current) {
        if (food.amount <= 0) continue;
        const dx = food.x - ant.x;
        const dy = food.y - ant.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
          // Head towards food
          const toFoodAngle = Math.atan2(dy, dx);
          ant.vx = Math.cos(toFoodAngle) * ANT_SPEED;
          ant.vy = Math.sin(toFoodAngle) * ANT_SPEED;
          foundFood = true;
          
          if (dist < 10) {
            // Pick up food
            ant.hasFood = true;
            food.amount -= 1;
          }
          break;
        }
      }
      
      if (!foundFood) {
        // Follow pheromones with some randomness
        const leftAngle = currentAngle - SENSE_ANGLE;
        const rightAngle = currentAngle + SENSE_ANGLE;
        
        const leftStrength = sensePheromones(ant, leftAngle);
        const centerStrength = sensePheromones(ant, currentAngle);
        const rightStrength = sensePheromones(ant, rightAngle);
        
        let newAngle = currentAngle;
        
        if (centerStrength > leftStrength && centerStrength > rightStrength) {
          newAngle = currentAngle + (Math.random() - 0.5) * 0.2;
        } else if (leftStrength > rightStrength) {
          newAngle = leftAngle;
        } else if (rightStrength > leftStrength) {
          newAngle = rightAngle;
        } else {
          // Random wander
          newAngle = currentAngle + (Math.random() - 0.5) * 0.5;
        }
        
        ant.vx = Math.cos(newAngle) * ANT_SPEED;
        ant.vy = Math.sin(newAngle) * ANT_SPEED;
      }
    }
    
    // Move ant
    ant.x += ant.vx * speed;
    ant.y += ant.vy * speed;
    
    // Bounce off walls
    if (ant.x < 0 || ant.x >= CANVAS_WIDTH) {
      ant.vx *= -1;
      ant.x = Math.max(0, Math.min(CANVAS_WIDTH - 1, ant.x));
    }
    if (ant.y < 0 || ant.y >= CANVAS_HEIGHT) {
      ant.vy *= -1;
      ant.y = Math.max(0, Math.min(CANVAS_HEIGHT - 1, ant.y));
    }
  }, [sensePheromones, speed]);

  const decayPheromones = useCallback(() => {
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      for (let y = 0; y < CANVAS_HEIGHT; y++) {
        pheromoneMapRef.current[x][y] *= PHEROMONE_DECAY;
        if (pheromoneMapRef.current[x][y] < 0.1) {
          pheromoneMapRef.current[x][y] = 0;
        }
      }
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw pheromone trails
    if (showPheromones) {
      const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const data = imageData.data;
      
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        for (let y = 0; y < CANVAS_HEIGHT; y++) {
          const pheromone = pheromoneMapRef.current[x][y];
          if (pheromone > 0.5) {
            const index = (y * CANVAS_WIDTH + x) * 4;
            const intensity = Math.min(pheromone * 2, 255);
            data[index] = Math.min(26 + intensity * 0.3, 100);
            data[index + 1] = Math.min(26 + intensity * 0.8, 200);
            data[index + 2] = Math.min(46 + intensity, 255);
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Draw nest
    ctx.beginPath();
    ctx.arc(nestRef.current.x, nestRef.current.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#8b4513";
    ctx.fill();
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw nest entrance
    ctx.beginPath();
    ctx.arc(nestRef.current.x, nestRef.current.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#2d1810";
    ctx.fill();
    
    // Draw food sources
    for (const food of foodSourcesRef.current) {
      if (food.amount > 0) {
        const size = 5 + (food.amount / food.maxAmount) * 15;
        ctx.beginPath();
        ctx.arc(food.x, food.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(76, 175, 80, ${0.5 + (food.amount / food.maxAmount) * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = "#2e7d32";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Food sparkle
        ctx.beginPath();
        ctx.arc(food.x - size * 0.3, food.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
      }
    }
    
    // Draw ants
    for (const ant of antsRef.current) {
      ctx.save();
      ctx.translate(ant.x, ant.y);
      ctx.rotate(Math.atan2(ant.vy, ant.vx));
      
      // Ant body
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = ant.hasFood ? "#ff9800" : "#333";
      ctx.fill();
      
      // Ant head
      ctx.beginPath();
      ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#222";
      ctx.fill();
      
      // Food indicator
      if (ant.hasFood) {
        ctx.beginPath();
        ctx.arc(-5, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#4caf50";
        ctx.fill();
      }
      
      ctx.restore();
    }
  }, [showPheromones]);

  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    // Update ants
    for (const ant of antsRef.current) {
      updateAnt(ant);
    }
    
    // Decay pheromones
    decayPheromones();
    
    // Remove empty food sources
    foodSourcesRef.current = foodSourcesRef.current.filter(f => f.amount > 0);
    
    // Render
    render();
    
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, updateAnt, decayPheromones, render]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    
    // Don't place food too close to nest
    const distToNest = Math.sqrt(
      Math.pow(x - nestRef.current.x, 2) + Math.pow(y - nestRef.current.y, 2)
    );
    
    if (distToNest > 40) {
      const amount = 20 + Math.floor(Math.random() * 30);
      foodSourcesRef.current.push({
        x,
        y,
        amount,
        maxAmount: amount,
      });
    }
  }, []);

  const handleReset = useCallback(() => {
    initializePheromoneMap();
    initializeAnts();
    foodSourcesRef.current = [];
    setFoodCollected(0);
  }, [initializePheromoneMap, initializeAnts]);

  const handleAddAnts = useCallback(() => {
    const newAnts = [];
    for (let i = 0; i < 10; i++) {
      newAnts.push(createAnt());
    }
    antsRef.current = [...antsRef.current, ...newAnts];
    setAntCount(prev => prev + 10);
  }, [createAnt]);

  useEffect(() => {
    initializePheromoneMap();
    initializeAnts();
  }, [initializePheromoneMap, initializeAnts]);

  useEffect(() => {
    if (isRunning) {
      frameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isRunning, gameLoop]);

  return (
    <FeatureWrapper day={394} title="Pixel Ant Highway" emoji="🐜">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <p className="text-lg mb-2" style={{ color: "var(--color-text-dim)" }}>
            Click anywhere to drop food and watch your ant colony build efficient highways! 🛤️
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            The ants leave pheromone trails that strengthen with more traffic.
            Over time, they&apos;ll discover the shortest paths. It&apos;s like watching nature&apos;s GPS! 🧭
          </p>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="rounded-lg cursor-crosshair shadow-lg"
            style={{
              border: "2px solid var(--color-border)",
              maxWidth: "100%",
              height: "auto",
            }}
          />
          
          <div 
            className="absolute top-3 left-3 px-3 py-2 rounded-lg text-sm"
            style={{ 
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "var(--color-text)"
            }}
          >
            <div className="flex items-center gap-2">
              <span>🐜 {antsRef.current.length}</span>
              <span>|</span>
              <span>🍃 {foodSourcesRef.current.length}</span>
              <span>|</span>
              <span>🏠 {foodCollected}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isRunning ? "⏸️ Pause" : "▶️ Play"}
          </button>
          
          <button
            onClick={handleAddAnts}
            className="btn-secondary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🐜 +10 Ants
          </button>
          
          <button
            onClick={() => setShowPheromones(!showPheromones)}
            className="btn-secondary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {showPheromones ? "🔵 Hide Trails" : "🔵 Show Trails"}
          </button>
          
          <button
            onClick={handleReset}
            className="btn-secondary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🔄 Reset
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Speed:
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-sm" style={{ color: "var(--color-text)" }}>
            {speed}x
          </span>
        </div>

        <div 
          className="text-center text-sm p-4 rounded-lg max-w-lg"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-dim)"
          }}
        >
          <p className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            🧪 Fun Fact
          </p>
          <p>
            Real ants use pheromones to communicate! When an ant finds food, 
            it leaves a chemical trail for others to follow. The more ants use a path, 
            the stronger the trail becomes. This is called &quot;stigmergy&quot; - 
            a form of decentralized coordination that inspired many computer algorithms!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}