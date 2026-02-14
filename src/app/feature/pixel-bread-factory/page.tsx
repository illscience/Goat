"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Bread {
  id: number;
  type: BreadType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
}

interface Customer {
  id: number;
  wants: BreadType[];
  patience: number;
  maxPatience: number;
  satisfied: BreadType[];
  x: number;
}

type BreadType = "baguette" | "croissant" | "sourdough" | "pretzel" | "bagel";

const BREAD_TYPES: BreadType[] = ["baguette", "croissant", "sourdough", "pretzel", "bagel"];

const BREAD_EMOJIS: Record<BreadType, string> = {
  baguette: "🥖",
  croissant: "🥐",
  sourdough: "🍞",
  pretzel: "🥨",
  bagel: "🥯",
};

const BREAD_COLORS: Record<BreadType, string> = {
  baguette: "#D4A574",
  croissant: "#E8C872",
  sourdough: "#C9A66B",
  pretzel: "#8B4513",
  bagel: "#DEB887",
};

export default function PixelBreadFactory() {
  const [breads, setBreads] = useState<Bread[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [draggedBread, setDraggedBread] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [angryCustomers, setAngryCustomers] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const breadIdRef = useRef<number>(0);
  const customerIdRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const lastCustomerRef = useRef<number>(0);

  const GRAVITY = 0.3;
  const BOUNCE = 0.7;
  const FRICTION = 0.99;
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 500;

  const spawnBread = useCallback(() => {
    const ovenPositions = [100, 250, 400, 550, 700];
    const activeOvens = Math.min(level + 1, ovenPositions.length);
    const ovenX = ovenPositions[Math.floor(Math.random() * activeOvens)];
    const type = BREAD_TYPES[Math.floor(Math.random() * BREAD_TYPES.length)];

    const newBread: Bread = {
      id: breadIdRef.current++,
      type,
      x: ovenX,
      y: 60,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 2 + 1,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 10,
      width: 50,
      height: 50,
    };

    setBreads((prev) => [...prev, newBread]);
  }, [level]);

  const spawnCustomer = useCallback(() => {
    const numWants = Math.min(Math.floor(Math.random() * level) + 1, 3);
    const wants: BreadType[] = [];
    for (let i = 0; i < numWants; i++) {
      wants.push(BREAD_TYPES[Math.floor(Math.random() * BREAD_TYPES.length)]);
    }

    const customerSlots = [50, 200, 350, 500, 650];
    const occupiedSlots = customers.map((c) => c.x);
    const availableSlots = customerSlots.filter((s) => !occupiedSlots.includes(s));

    if (availableSlots.length === 0) return;

    const x = availableSlots[Math.floor(Math.random() * availableSlots.length)];

    const newCustomer: Customer = {
      id: customerIdRef.current++,
      wants,
      patience: 100,
      maxPatience: Math.max(100 - level * 5, 50),
      satisfied: [],
      x,
    };

    setCustomers((prev) => [...prev, newCustomer]);
  }, [level, customers]);

  const updatePhysics = useCallback(() => {
    setBreads((prev) =>
      prev
        .map((bread) => {
          if (bread.id === draggedBread) return bread;

          let { x, y, vx, vy, rotation, rotationSpeed } = bread;

          vy += GRAVITY;
          x += vx;
          y += vy;
          vx *= FRICTION;
          rotation += rotationSpeed;

          // Bounce off walls
          if (x < 25) {
            x = 25;
            vx = -vx * BOUNCE;
          }
          if (x > GAME_WIDTH - 25) {
            x = GAME_WIDTH - 25;
            vx = -vx * BOUNCE;
          }

          // Bounce off floor
          if (y > GAME_HEIGHT - 100) {
            y = GAME_HEIGHT - 100;
            vy = -vy * BOUNCE;
            rotationSpeed *= 0.8;
          }

          // Bounce off ceiling
          if (y < 25) {
            y = 25;
            vy = -vy * BOUNCE;
          }

          return { ...bread, x, y, vx, vy, rotation, rotationSpeed };
        })
        .filter((bread) => bread.y < GAME_HEIGHT + 100)
    );
  }, [draggedBread]);

  const updateCustomers = useCallback(() => {
    setCustomers((prev) => {
      const updated = prev.map((customer) => ({
        ...customer,
        patience: customer.patience - 0.15 * (1 + level * 0.1),
      }));

      const angry = updated.filter((c) => c.patience <= 0);
      if (angry.length > 0) {
        setAngryCustomers((prev) => prev + angry.length);
        setCombo(0);
      }

      return updated.filter((c) => c.patience > 0 && c.wants.length > c.satisfied.length);
    });
  }, [level]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Find bread under mouse
    const clickedBread = breads.find((bread) => {
      const dx = bread.x - mx;
      const dy = bread.y - my;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedBread) {
      setDraggedBread(clickedBread.id);
    }
  };

  const handleMouseUp = () => {
    if (draggedBread !== null) {
      const bread = breads.find((b) => b.id === draggedBread);
      if (bread && mousePos.y > GAME_HEIGHT - 120) {
        // Check if over a customer
        const customer = customers.find(
          (c) => Math.abs(c.x + 50 - bread.x) < 60 && c.wants.includes(bread.type) && !c.satisfied.includes(bread.type)
        );

        if (customer) {
          // Deliver bread!
          setCustomers((prev) =>
            prev.map((c) => (c.id === customer.id ? { ...c, satisfied: [...c.satisfied, bread.type] } : c))
          );

          setBreads((prev) => prev.filter((b) => b.id !== draggedBread));

          const newCombo = combo + 1;
          setCombo(newCombo);
          setScore((prev) => prev + 10 * newCombo);

          // Level up every 100 points
          if (score > 0 && score % 100 < 10) {
            setLevel((prev) => Math.min(prev + 1, 10));
          }
        }
      }
      setDraggedBread(null);
    }
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      const now = Date.now();

      // Spawn bread
      const spawnRate = Math.max(2000 - level * 150, 500);
      if (now - lastSpawnRef.current > spawnRate) {
        spawnBread();
        lastSpawnRef.current = now;
      }

      // Spawn customers
      const customerRate = Math.max(5000 - level * 300, 2000);
      if (now - lastCustomerRef.current > customerRate) {
        spawnCustomer();
        lastCustomerRef.current = now;
      }

      updatePhysics();
      updateCustomers();

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameStarted, gameOver, spawnBread, spawnCustomer, updatePhysics, updateCustomers, level]);

  // Check game over
  useEffect(() => {
    if (angryCustomers >= 5) {
      setGameOver(true);
    }
  }, [angryCustomers]);

  // Update dragged bread position
  useEffect(() => {
    if (draggedBread !== null) {
      setBreads((prev) =>
        prev.map((bread) =>
          bread.id === draggedBread ? { ...bread, x: mousePos.x, y: mousePos.y, vx: 0, vy: 0 } : bread
        )
      );
    }
  }, [mousePos, draggedBread]);

  const startGame = () => {
    setBreads([]);
    setCustomers([]);
    setScore(0);
    setAngryCustomers(0);
    setLevel(1);
    setCombo(0);
    setGameOver(false);
    setGameStarted(true);
    lastSpawnRef.current = Date.now();
    lastCustomerRef.current = Date.now();
  };

  return (
    <FeatureWrapper day={441} title="Pixel Bread Factory" emoji="🍞">
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)" }}>
            🏭 Bread Chaos Management 🏭
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Drag falling bread to hungry customers before they rage-quit!
          </p>
        </div>

        {/* HUD */}
        <div className="flex gap-6 text-lg font-bold">
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📈</span>
            <span>Level {level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span>x{combo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>😤</span>
            <span>
              {angryCustomers}/5
            </span>
          </div>
        </div>

        {/* Game Area */}
        <div
          ref={gameAreaRef}
          className="relative rounded-xl overflow-hidden cursor-pointer select-none"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: "var(--color-bg-secondary)",
            border: "3px solid var(--color-border)",
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Ovens at top */}
          <div
            className="absolute top-0 left-0 right-0 h-16 flex justify-around items-center"
            style={{ backgroundColor: "#4a3728" }}
          >
            {[100, 250, 400, 550, 700].slice(0, Math.min(level + 1, 5)).map((x, i) => (
              <div
                key={i}
                className="text-3xl animate-pulse"
                style={{ position: "absolute", left: x - 20, top: 8 }}
              >
                🔥
              </div>
            ))}
            <div
              className="absolute bottom-0 left-0 right-0 h-4"
              style={{ backgroundColor: "#2d1f14" }}
            />
          </div>

          {/* Breads */}
          {breads.map((bread) => (
            <div
              key={bread.id}
              className="absolute text-4xl transition-transform"
              style={{
                left: bread.x - 20,
                top: bread.y - 20,
                transform: `rotate(${bread.rotation}deg)`,
                cursor: draggedBread === bread.id ? "grabbing" : "grab",
                filter: draggedBread === bread.id ? "drop-shadow(0 0 10px gold)" : "none",
                zIndex: draggedBread === bread.id ? 100 : 10,
              }}
            >
              {BREAD_EMOJIS[bread.type]}
            </div>
          ))}

          {/* Customer area */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 flex"
            style={{ backgroundColor: "#5a4a3a" }}
          >
            {/* Counter */}
            <div
              className="absolute top-0 left-0 right-0 h-3"
              style={{ backgroundColor: "#8B4513" }}
            />

            {/* Customers */}
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="absolute flex flex-col items-center"
                style={{ left: customer.x, bottom: 5 }}
              >
                {/* Patience bar */}
                <div
                  className="w-20 h-2 rounded-full overflow-hidden mb-1"
                  style={{ backgroundColor: "var(--color-border)" }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${customer.patience}%`,
                      backgroundColor:
                        customer.patience > 50 ? "#4ade80" : customer.patience > 25 ? "#fbbf24" : "#ef4444",
                    }}
                  />
                </div>

                {/* Customer face */}
                <div className="text-3xl">
                  {customer.patience > 50 ? "😊" : customer.patience > 25 ? "😐" : "😠"}
                </div>

                {/* Order bubble */}
                <div
                  className="flex gap-1 p-1 rounded-lg mt-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                >
                  {customer.wants.map((type, i) => (
                    <span
                      key={i}
                      className="text-lg"
                      style={{
                        opacity: customer.satisfied.includes(type) ? 0.3 : 1,
                        textDecoration: customer.satisfied.includes(type) ? "line-through" : "none",
                      }}
                    >
                      {BREAD_EMOJIS[type]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Start/Game Over overlay */}
          {(!gameStarted || gameOver) && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            >
              {gameOver ? (
                <>
                  <h3 className="text-4xl font-bold text-white mb-4">💥 Factory Meltdown! 💥</h3>
                  <p className="text-xl text-gray-300 mb-2">Too many hangry customers!</p>
                  <p className="text-2xl text-yellow-400 mb-6">Final Score: {score}</p>
                </>
              ) : (
                <>
                  <h3 className="text-4xl font-bold text-white mb-4">🍞 Ready to Bake? 🍞</h3>
                  <p className="text-lg text-gray-300 mb-6">
                    Drag bread to matching customer orders!
                  </p>
                </>
              )}
              <button onClick={startGame} className="btn-primary text-xl px-8 py-3">
                {gameOver ? "Try Again!" : "Start Baking!"}
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap justify-center">
          {BREAD_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1 text-sm">
              <span className="text-xl">{BREAD_EMOJIS[type]}</span>
              <span className="capitalize" style={{ color: "var(--color-text-dim)" }}>
                {type}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
          <p>💡 Tip: Build combos for bonus points! Ovens multiply as you level up!</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}