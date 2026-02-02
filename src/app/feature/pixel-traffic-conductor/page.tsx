"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Car {
  id: number;
  x: number;
  y: number;
  direction: "north" | "south" | "east" | "west";
  speed: number;
  color: string;
  width: number;
  height: number;
}

interface TrafficLight {
  direction: "north-south" | "east-west";
  state: "red" | "green";
}

const CANVAS_SIZE = 500;
const ROAD_WIDTH = 80;
const INTERSECTION_START = (CANVAS_SIZE - ROAD_WIDTH) / 2;
const INTERSECTION_END = INTERSECTION_START + ROAD_WIDTH;
const CAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

export default function PixelTrafficConductor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const carsRef = useRef<Car[]>([]);
  const carIdRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [crashes, setCrashes] = useState(0);
  const [maxCrashes] = useState(3);
  const [trafficLight, setTrafficLight] = useState<TrafficLight>({
    direction: "north-south",
    state: "green"
  });
  const [spawnRate, setSpawnRate] = useState(2000);
  const [carsThrough, setCarsThrough] = useState(0);

  const spawnCar = useCallback(() => {
    const directions: Array<"north" | "south" | "east" | "west"> = ["north", "south", "east", "west"];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const speed = 1 + Math.random() * 2;
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    
    let x: number, y: number, width: number, height: number;
    const laneOffset = 15 + Math.random() * 25;
    
    switch (direction) {
      case "north":
        x = INTERSECTION_START + laneOffset;
        y = CANVAS_SIZE + 20;
        width = 20;
        height = 35;
        break;
      case "south":
        x = INTERSECTION_END - laneOffset - 20;
        y = -35;
        width = 20;
        height = 35;
        break;
      case "east":
        x = -35;
        y = INTERSECTION_START + laneOffset;
        width = 35;
        height = 20;
        break;
      case "west":
        x = CANVAS_SIZE + 20;
        y = INTERSECTION_END - laneOffset - 20;
        width = 35;
        height = 20;
        break;
    }
    
    const newCar: Car = {
      id: carIdRef.current++,
      x,
      y,
      direction,
      speed,
      color,
      width,
      height
    };
    
    carsRef.current.push(newCar);
  }, []);

  const checkCollision = (car1: Car, car2: Car): boolean => {
    return (
      car1.x < car2.x + car2.width &&
      car1.x + car1.width > car2.x &&
      car1.y < car2.y + car2.height &&
      car1.y + car1.height > car2.y
    );
  };

  const isInIntersection = (car: Car): boolean => {
    const carCenterX = car.x + car.width / 2;
    const carCenterY = car.y + car.height / 2;
    return (
      carCenterX > INTERSECTION_START - 10 &&
      carCenterX < INTERSECTION_END + 10 &&
      carCenterY > INTERSECTION_START - 10 &&
      carCenterY < INTERSECTION_END + 10
    );
  };

  const shouldStop = (car: Car, light: TrafficLight): boolean => {
    const isNorthSouth = car.direction === "north" || car.direction === "south";
    const lightAllowsNorthSouth = light.direction === "north-south" && light.state === "green";
    const lightAllowsEastWest = light.direction === "east-west" && light.state === "green";
    
    if (isNorthSouth && !lightAllowsNorthSouth) {
      // Check if approaching intersection
      if (car.direction === "north" && car.y > INTERSECTION_END && car.y < INTERSECTION_END + 60) return true;
      if (car.direction === "south" && car.y + car.height < INTERSECTION_START && car.y > INTERSECTION_START - 60) return true;
    }
    
    if (!isNorthSouth && !lightAllowsEastWest) {
      if (car.direction === "east" && car.x + car.width < INTERSECTION_START && car.x > INTERSECTION_START - 60) return true;
      if (car.direction === "west" && car.x > INTERSECTION_END && car.x < INTERSECTION_END + 60) return true;
    }
    
    return false;
  };

  const updateGame = useCallback(() => {
    const cars = carsRef.current;
    
    // Move cars
    cars.forEach(car => {
      if (shouldStop(car, trafficLight) && !isInIntersection(car)) {
        return; // Don't move, waiting at light
      }
      
      switch (car.direction) {
        case "north":
          car.y -= car.speed;
          break;
        case "south":
          car.y += car.speed;
          break;
        case "east":
          car.x += car.speed;
          break;
        case "west":
          car.x -= car.speed;
          break;
      }
    });
    
    // Check for collisions in intersection
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        if (isInIntersection(cars[i]) && isInIntersection(cars[j])) {
          if (checkCollision(cars[i], cars[j])) {
            // Crash!
            setCrashes(prev => {
              const newCrashes = prev + 1;
              if (newCrashes >= maxCrashes) {
                setGameState("gameover");
              }
              return newCrashes;
            });
            // Remove crashed cars
            carsRef.current = cars.filter(c => c.id !== cars[i].id && c.id !== cars[j].id);
            return;
          }
        }
      }
    }
    
    // Remove cars that have left the screen and count them
    const carsBeforeCleanup = carsRef.current.length;
    carsRef.current = cars.filter(car => {
      const isOffScreen = car.x < -50 || car.x > CANVAS_SIZE + 50 || 
                          car.y < -50 || car.y > CANVAS_SIZE + 50;
      if (isOffScreen) {
        setCarsThrough(prev => prev + 1);
        setScore(prev => prev + 10);
      }
      return !isOffScreen;
    });
    
    // Increase difficulty over time
    if (carsRef.current.length < carsBeforeCleanup) {
      setSpawnRate(prev => Math.max(500, prev - 50));
    }
  }, [trafficLight, maxCrashes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = "#2d5a27";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw roads
    ctx.fillStyle = "#3a3a3a";
    // Vertical road
    ctx.fillRect(INTERSECTION_START, 0, ROAD_WIDTH, CANVAS_SIZE);
    // Horizontal road
    ctx.fillRect(0, INTERSECTION_START, CANVAS_SIZE, ROAD_WIDTH);
    
    // Draw road lines
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, INTERSECTION_START);
    ctx.moveTo(CANVAS_SIZE / 2, INTERSECTION_END);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.stroke();
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE / 2);
    ctx.lineTo(INTERSECTION_START, CANVAS_SIZE / 2);
    ctx.moveTo(INTERSECTION_END, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw intersection
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(INTERSECTION_START, INTERSECTION_START, ROAD_WIDTH, ROAD_WIDTH);
    
    // Draw traffic lights
    const lightSize = 15;
    const lightOffset = 10;
    
    // North light
    ctx.fillStyle = trafficLight.direction === "north-south" && trafficLight.state === "green" ? "#00FF00" : "#FF0000";
    ctx.beginPath();
    ctx.arc(INTERSECTION_START + ROAD_WIDTH / 4, INTERSECTION_END + lightOffset + lightSize, lightSize, 0, Math.PI * 2);
    ctx.fill();
    
    // South light
    ctx.beginPath();
    ctx.arc(INTERSECTION_END - ROAD_WIDTH / 4, INTERSECTION_START - lightOffset - lightSize, lightSize, 0, Math.PI * 2);
    ctx.fill();
    
    // East light
    ctx.fillStyle = trafficLight.direction === "east-west" && trafficLight.state === "green" ? "#00FF00" : "#FF0000";
    ctx.beginPath();
    ctx.arc(INTERSECTION_START - lightOffset - lightSize, INTERSECTION_START + ROAD_WIDTH / 4, lightSize, 0, Math.PI * 2);
    ctx.fill();
    
    // West light
    ctx.beginPath();
    ctx.arc(INTERSECTION_END + lightOffset + lightSize, INTERSECTION_END - ROAD_WIDTH / 4, lightSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cars
    carsRef.current.forEach(car => {
      ctx.fillStyle = car.color;
      ctx.fillRect(car.x, car.y, car.width, car.height);
      
      // Car details
      ctx.fillStyle = "#1a1a1a";
      if (car.direction === "north" || car.direction === "south") {
        // Windshield
        ctx.fillRect(car.x + 3, car.y + (car.direction === "north" ? 5 : car.height - 12), car.width - 6, 7);
      } else {
        ctx.fillRect(car.x + (car.direction === "east" ? car.width - 12 : 5), car.y + 3, 7, car.height - 6);
      }
    });
  }, [trafficLight]);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;
    
    updateGame();
    draw();
    
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updateGame, draw]);

  useEffect(() => {
    if (gameState === "playing") {
      frameRef.current = requestAnimationFrame(gameLoop);
      
      const spawnInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastSpawnRef.current > spawnRate) {
          spawnCar();
          lastSpawnRef.current = now;
        }
      }, 100);
      
      return () => {
        cancelAnimationFrame(frameRef.current);
        clearInterval(spawnInterval);
      };
    }
  }, [gameState, gameLoop, spawnCar, spawnRate]);

  const toggleLight = () => {
    setTrafficLight(prev => ({
      direction: prev.direction === "north-south" ? "east-west" : "north-south",
      state: "green"
    }));
  };

  const startGame = () => {
    carsRef.current = [];
    carIdRef.current = 0;
    setScore(0);
    setCrashes(0);
    setCarsThrough(0);
    setSpawnRate(2000);
    setTrafficLight({ direction: "north-south", state: "green" });
    setGameState("playing");
  };

  return (
    <FeatureWrapper day={429} title="Pixel Traffic Conductor" emoji="🚦">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🚗 Control the Chaos! 🚗
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click the button to switch traffic lights. Keep cars flowing without crashes. 
            You&apos;re basically a digital traffic god with very real pixel consequences.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-center">
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Score</div>
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>{score}</div>
          </div>
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Cars Through</div>
            <div className="text-2xl font-bold" style={{ color: "#4ECDC4" }}>{carsThrough}</div>
          </div>
          <div 
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>Crashes</div>
            <div className="text-2xl font-bold" style={{ color: "#FF6B6B" }}>
              {crashes}/{maxCrashes}
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-lg border-4"
            style={{ 
              borderColor: "var(--color-border)",
              backgroundColor: "#2d5a27"
            }}
          />
          
          {gameState === "idle" && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            >
              <h3 className="text-3xl font-bold mb-4" style={{ color: "#FFD700" }}>
                🚦 Ready to Conduct?
              </h3>
              <p className="mb-6 text-center px-8" style={{ color: "var(--color-text-dim)" }}>
                Switch the lights to control traffic flow. 
                Don&apos;t let cars crash in the intersection!
              </p>
              <button
                onClick={startGame}
                className="btn-primary px-8 py-3 text-lg font-bold rounded-lg"
              >
                Start Conducting!
              </button>
            </div>
          )}
          
          {gameState === "gameover" && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
            >
              <h3 className="text-3xl font-bold mb-2" style={{ color: "#FF6B6B" }}>
                💥 Too Many Crashes!
              </h3>
              <p className="text-xl mb-4" style={{ color: "var(--color-text)" }}>
                Final Score: <span style={{ color: "#FFD700" }}>{score}</span>
              </p>
              <p className="mb-6" style={{ color: "var(--color-text-dim)" }}>
                You got {carsThrough} cars through safely!
              </p>
              <button
                onClick={startGame}
                className="btn-primary px-8 py-3 text-lg font-bold rounded-lg"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Traffic Light Control */}
        {gameState === "playing" && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={toggleLight}
              className="px-12 py-4 text-xl font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: trafficLight.direction === "north-south" ? "#4ECDC4" : "#FF6B6B",
                color: "#1a1a1a"
              }}
            >
              🚦 Switch Light! 🚦
            </button>
            <div className="flex gap-4 text-sm" style={{ color: "var(--color-text-dim)" }}>
              <span className={trafficLight.direction === "north-south" ? "font-bold" : "opacity-50"}>
                ↕️ North-South: {trafficLight.direction === "north-south" ? "🟢 GO" : "🔴 STOP"}
              </span>
              <span className={trafficLight.direction === "east-west" ? "font-bold" : "opacity-50"}>
                ↔️ East-West: {trafficLight.direction === "east-west" ? "🟢 GO" : "🔴 STOP"}
              </span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div 
          className="text-center text-sm max-w-md p-4 rounded-lg"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-dim)"
          }}
        >
          <p className="font-bold mb-2" style={{ color: "var(--color-text)" }}>Pro Tips:</p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li>Watch for cars approaching from all directions</li>
            <li>Time your switches when cars are safely stopped</li>
            <li>Traffic gets faster and more frequent over time</li>
            <li>3 crashes and you&apos;re fired from traffic duty!</li>
          </ul>
        </div>
      </div>
    </FeatureWrapper>
  );
}