"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Entity {
  id: number;
  type: "plant" | "rabbit" | "fox";
  x: number;
  y: number;
  energy: number;
  age: number;
}

const GRID_SIZE = 60;
const CELL_SIZE = 8;
const TICK_RATE = 100;

const COLORS = {
  plant: "#22c55e",
  rabbit: "#f59e0b",
  fox: "#ef4444",
  ground: "#1a1a2e",
  gridLine: "#2a2a3e",
};

const ENERGY = {
  plant: { initial: 50, max: 100, growthRate: 2 },
  rabbit: { initial: 80, max: 120, moveEnergy: 1, eatGain: 40, reproduceThreshold: 100 },
  fox: { initial: 100, max: 150, moveEnergy: 2, eatGain: 60, reproduceThreshold: 120 },
};

export default function PixelEcosystemBalance() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedTool, setSelectedTool] = useState<"plant" | "rabbit" | "fox">("plant");
  const [isRunning, setIsRunning] = useState(true);
  const [stats, setStats] = useState({ plants: 0, rabbits: 0, foxes: 0 });
  const entityIdRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const getNextId = () => {
    entityIdRef.current += 1;
    return entityIdRef.current;
  };

  const initializeWorld = useCallback(() => {
    const newEntities: Entity[] = [];
    
    // Add initial plants
    for (let i = 0; i < 100; i++) {
      newEntities.push({
        id: getNextId(),
        type: "plant",
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        energy: ENERGY.plant.initial,
        age: 0,
      });
    }
    
    // Add initial rabbits
    for (let i = 0; i < 15; i++) {
      newEntities.push({
        id: getNextId(),
        type: "rabbit",
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        energy: ENERGY.rabbit.initial,
        age: 0,
      });
    }
    
    // Add initial foxes
    for (let i = 0; i < 5; i++) {
      newEntities.push({
        id: getNextId(),
        type: "fox",
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        energy: ENERGY.fox.initial,
        age: 0,
      });
    }
    
    setEntities(newEntities);
  }, []);

  const simulateTick = useCallback((currentEntities: Entity[]): Entity[] => {
    const newEntities: Entity[] = [];
    const occupiedPositions = new Map<string, Entity>();
    
    // Build position map
    currentEntities.forEach(e => {
      const key = `${e.x},${e.y}`;
      if (!occupiedPositions.has(key) || e.type === "plant") {
        occupiedPositions.set(key, e);
      }
    });

    const plantsToAdd: Entity[] = [];
    const animalsToAdd: Entity[] = [];

    for (const entity of currentEntities) {
      if (entity.type === "plant") {
        // Plants grow and spread
        let newEnergy = entity.energy + ENERGY.plant.growthRate;
        if (newEnergy > ENERGY.plant.max) newEnergy = ENERGY.plant.max;
        
        // Spread to adjacent cell occasionally
        if (Math.random() < 0.02 && entity.energy > 60) {
          const dx = Math.floor(Math.random() * 3) - 1;
          const dy = Math.floor(Math.random() * 3) - 1;
          const newX = Math.max(0, Math.min(GRID_SIZE - 1, entity.x + dx));
          const newY = Math.max(0, Math.min(GRID_SIZE - 1, entity.y + dy));
          const key = `${newX},${newY}`;
          
          if (!occupiedPositions.has(key)) {
            plantsToAdd.push({
              id: getNextId(),
              type: "plant",
              x: newX,
              y: newY,
              energy: ENERGY.plant.initial / 2,
              age: 0,
            });
          }
        }
        
        newEntities.push({ ...entity, energy: newEnergy, age: entity.age + 1 });
      } else if (entity.type === "rabbit") {
        let energy = entity.energy - ENERGY.rabbit.moveEnergy;
        
        // Find nearby plants
        let foundPlant = false;
        const nearbyPlants = currentEntities.filter(
          e => e.type === "plant" && 
          Math.abs(e.x - entity.x) <= 1 && 
          Math.abs(e.y - entity.y) <= 1
        );
        
        if (nearbyPlants.length > 0) {
          const plant = nearbyPlants[0];
          energy += ENERGY.rabbit.eatGain;
          // Mark plant for removal
          const plantIndex = newEntities.findIndex(e => e.id === plant.id);
          if (plantIndex > -1) {
            newEntities.splice(plantIndex, 1);
          }
          foundPlant = true;
        }
        
        // Move towards plants or randomly
        if (!foundPlant) {
          const allPlants = currentEntities.filter(e => e.type === "plant");
          let newX = entity.x;
          let newY = entity.y;
          
          if (allPlants.length > 0 && Math.random() < 0.7) {
            const closestPlant = allPlants.reduce((closest, p) => {
              const dist = Math.abs(p.x - entity.x) + Math.abs(p.y - entity.y);
              const closestDist = Math.abs(closest.x - entity.x) + Math.abs(closest.y - entity.y);
              return dist < closestDist ? p : closest;
            });
            
            if (closestPlant.x > entity.x) newX++;
            else if (closestPlant.x < entity.x) newX--;
            if (closestPlant.y > entity.y) newY++;
            else if (closestPlant.y < entity.y) newY--;
          } else {
            newX += Math.floor(Math.random() * 3) - 1;
            newY += Math.floor(Math.random() * 3) - 1;
          }
          
          entity.x = Math.max(0, Math.min(GRID_SIZE - 1, newX));
          entity.y = Math.max(0, Math.min(GRID_SIZE - 1, newY));
        }
        
        // Reproduce if enough energy
        if (energy > ENERGY.rabbit.reproduceThreshold && Math.random() < 0.1) {
          energy = energy / 2;
          animalsToAdd.push({
            id: getNextId(),
            type: "rabbit",
            x: Math.max(0, Math.min(GRID_SIZE - 1, entity.x + (Math.random() > 0.5 ? 1 : -1))),
            y: Math.max(0, Math.min(GRID_SIZE - 1, entity.y + (Math.random() > 0.5 ? 1 : -1))),
            energy: ENERGY.rabbit.initial / 2,
            age: 0,
          });
        }
        
        if (energy > 0) {
          newEntities.push({ ...entity, energy: Math.min(energy, ENERGY.rabbit.max), age: entity.age + 1 });
        }
      } else if (entity.type === "fox") {
        let energy = entity.energy - ENERGY.fox.moveEnergy;
        
        // Find nearby rabbits
        let foundRabbit = false;
        const nearbyRabbits = currentEntities.filter(
          e => e.type === "rabbit" && 
          Math.abs(e.x - entity.x) <= 1 && 
          Math.abs(e.y - entity.y) <= 1
        );
        
        if (nearbyRabbits.length > 0) {
          const rabbit = nearbyRabbits[0];
          energy += ENERGY.fox.eatGain;
          // Mark rabbit for removal
          const rabbitIndex = newEntities.findIndex(e => e.id === rabbit.id);
          if (rabbitIndex > -1) {
            newEntities.splice(rabbitIndex, 1);
          }
          foundRabbit = true;
        }
        
        // Move towards rabbits or randomly
        if (!foundRabbit) {
          const allRabbits = currentEntities.filter(e => e.type === "rabbit");
          let newX = entity.x;
          let newY = entity.y;
          
          if (allRabbits.length > 0 && Math.random() < 0.8) {
            const closestRabbit = allRabbits.reduce((closest, r) => {
              const dist = Math.abs(r.x - entity.x) + Math.abs(r.y - entity.y);
              const closestDist = Math.abs(closest.x - entity.x) + Math.abs(closest.y - entity.y);
              return dist < closestDist ? r : closest;
            });
            
            if (closestRabbit.x > entity.x) newX++;
            else if (closestRabbit.x < entity.x) newX--;
            if (closestRabbit.y > entity.y) newY++;
            else if (closestRabbit.y < entity.y) newY--;
          } else {
            newX += Math.floor(Math.random() * 3) - 1;
            newY += Math.floor(Math.random() * 3) - 1;
          }
          
          entity.x = Math.max(0, Math.min(GRID_SIZE - 1, newX));
          entity.y = Math.max(0, Math.min(GRID_SIZE - 1, newY));
        }
        
        // Reproduce if enough energy
        if (energy > ENERGY.fox.reproduceThreshold && Math.random() < 0.08) {
          energy = energy / 2;
          animalsToAdd.push({
            id: getNextId(),
            type: "fox",
            x: Math.max(0, Math.min(GRID_SIZE - 1, entity.x + (Math.random() > 0.5 ? 1 : -1))),
            y: Math.max(0, Math.min(GRID_SIZE - 1, entity.y + (Math.random() > 0.5 ? 1 : -1))),
            energy: ENERGY.fox.initial / 2,
            age: 0,
          });
        }
        
        if (energy > 0) {
          newEntities.push({ ...entity, energy: Math.min(energy, ENERGY.fox.max), age: entity.age + 1 });
        }
      }
    }
    
    return [...newEntities, ...plantsToAdd, ...animalsToAdd];
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines (subtle)
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw entities
    entities.forEach(entity => {
      ctx.fillStyle = COLORS[entity.type];
      const size = entity.type === "plant" ? CELL_SIZE - 2 : CELL_SIZE - 1;
      const offset = entity.type === "plant" ? 1 : 0.5;
      ctx.fillRect(
        entity.x * CELL_SIZE + offset,
        entity.y * CELL_SIZE + offset,
        size,
        size
      );
    });
  }, [entities]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      const newEntity: Entity = {
        id: getNextId(),
        type: selectedTool,
        x,
        y,
        energy: ENERGY[selectedTool].initial,
        age: 0,
      };
      setEntities(prev => [...prev, newEntity]);
    }
  };

  // Initialize world
  useEffect(() => {
    initializeWorld();
  }, [initializeWorld]);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (isRunning && timestamp - lastTickRef.current >= TICK_RATE) {
        setEntities(prev => simulateTick(prev));
        lastTickRef.current = timestamp;
      }
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, render, simulateTick]);

  // Update stats
  useEffect(() => {
    const plants = entities.filter(e => e.type === "plant").length;
    const rabbits = entities.filter(e => e.type === "rabbit").length;
    const foxes = entities.filter(e => e.type === "fox").length;
    setStats({ plants, rabbits, foxes });
  }, [entities]);

  return (
    <FeatureWrapper day={389} title="Pixel Ecosystem Balance" emoji="🌿">
      <div className="flex flex-col items-center gap-6 p-4">
        <p 
          className="text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          Watch life unfold in this tiny world. Click to add creatures and see how your choices ripple through the ecosystem.
          <span className="block mt-2 text-sm italic">
            Too many foxes? The rabbits vanish. Too many rabbits? Say goodbye to your plants.
          </span>
        </p>

        {/* Tool Selection */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedTool("plant")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              selectedTool === "plant" 
                ? "ring-2 ring-green-500 bg-green-900/30" 
                : "bg-green-900/10 hover:bg-green-900/20"
            }`}
            style={{ color: COLORS.plant }}
          >
            🌱 Plant
          </button>
          <button
            onClick={() => setSelectedTool("rabbit")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              selectedTool === "rabbit" 
                ? "ring-2 ring-amber-500 bg-amber-900/30" 
                : "bg-amber-900/10 hover:bg-amber-900/20"
            }`}
            style={{ color: COLORS.rabbit }}
          >
            🐰 Rabbit
          </button>
          <button
            onClick={() => setSelectedTool("fox")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              selectedTool === "fox" 
                ? "ring-2 ring-red-500 bg-red-900/30" 
                : "bg-red-900/10 hover:bg-red-900/20"
            }`}
            style={{ color: COLORS.fox }}
          >
            🦊 Fox
          </button>
        </div>

        {/* Stats */}
        <div 
          className="flex gap-6 text-sm font-mono"
          style={{ color: "var(--color-text)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.plant }}></div>
            <span>{stats.plants} plants</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.rabbit }}></div>
            <span>{stats.rabbits} rabbits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.fox }}></div>
            <span>{stats.foxes} foxes</span>
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="rounded-lg overflow-hidden shadow-xl"
          style={{ 
            border: "2px solid var(--color-border)",
            boxShadow: "0 0 40px rgba(0,0,0,0.3)"
          }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
          />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            {isRunning ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button
            onClick={initializeWorld}
            className="btn-secondary px-6 py-2 rounded-lg"
          >
            🔄 Reset World
          </button>
        </div>

        {/* Fun hints */}
        <div 
          className="text-xs text-center max-w-sm mt-2"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>💡 <strong>Pro tip:</strong> Try creating a perfect balance where all three species thrive. It&apos;s harder than it sounds!</p>
        </div>

        {/* Population graph indicator */}
        {stats.rabbits === 0 && stats.foxes > 0 && (
          <div className="text-amber-400 text-sm animate-pulse">
            ⚠️ The foxes are starving without rabbits to hunt...
          </div>
        )}
        {stats.plants === 0 && stats.rabbits > 0 && (
          <div className="text-amber-400 text-sm animate-pulse">
            ⚠️ The rabbits ate everything! Famine incoming...
          </div>
        )}
        {stats.plants > 200 && (
          <div className="text-green-400 text-sm">
            🌳 The forest is thriving! Maybe add some herbivores?
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}