"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "debris" | "dust" | "spark";
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
  falling: boolean;
  vy: number;
  vx: number;
  rotation: number;
  rotationSpeed: number;
}

interface TNT {
  x: number;
  y: number;
  timer: number;
  exploded: boolean;
}

interface Building {
  blocks: Block[];
  x: number;
  width: number;
}

export default function PixelDemolitionCrew() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [tntCharges, setTntCharges] = useState<TNT[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isDetonating, setIsDetonating] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedTool, setSelectedTool] = useState<"tnt" | "bigTnt">("tnt");
  const groundLevel = 450;

  const blockColors = [
    "#8B4513", "#A0522D", "#CD853F", // Browns
    "#696969", "#808080", "#A9A9A9", // Grays
    "#B22222", "#CD5C5C", // Reds
    "#4682B4", "#5F9EA0", // Blues
  ];

  const generateBuilding = useCallback((startX: number, width: number): Building => {
    const blocks: Block[] = [];
    const floors = Math.floor(Math.random() * 6) + 4;
    const blocksPerFloor = Math.floor(width / 30);
    const blockWidth = width / blocksPerFloor;
    
    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < blocksPerFloor; col++) {
        // Random window holes
        if (floor > 0 && floor < floors - 1 && Math.random() > 0.7) continue;
        
        blocks.push({
          x: startX + col * blockWidth,
          y: groundLevel - (floor + 1) * 30,
          width: blockWidth - 2,
          height: 28,
          color: blockColors[Math.floor(Math.random() * blockColors.length)],
          destroyed: false,
          falling: false,
          vy: 0,
          vx: 0,
          rotation: 0,
          rotationSpeed: 0,
        });
      }
    }
    
    return { blocks, x: startX, width };
  }, []);

  const initializeScene = useCallback(() => {
    const newBuildings: Building[] = [];
    let x = 50;
    
    while (x < 700) {
      const width = Math.floor(Math.random() * 80) + 60;
      newBuildings.push(generateBuilding(x, width));
      x += width + 20;
    }
    
    setBuildings(newBuildings);
    setTntCharges([]);
    setParticles([]);
    setScore(0);
    setIsDetonating(false);
  }, [generateBuilding]);

  useEffect(() => {
    initializeScene();
  }, [initializeScene]);

  const createExplosion = useCallback((x: number, y: number, radius: number) => {
    const newParticles: Particle[] = [];
    
    // Sparks
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.5;
      const speed = Math.random() * 8 + 4;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: ["#FF6B00", "#FFD700", "#FF4500", "#FFA500"][Math.floor(Math.random() * 4)],
        size: Math.random() * 4 + 2,
        life: 30,
        maxLife: 30,
        type: "spark",
      });
    }
    
    // Dust clouds
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * radius,
        y: y + (Math.random() - 0.5) * radius,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1,
        color: `rgba(150, 150, 150, ${Math.random() * 0.5 + 0.3})`,
        size: Math.random() * 20 + 10,
        life: 60,
        maxLife: 60,
        type: "dust",
      });
    }
    
    return newParticles;
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDetonating) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a building block
    let onBlock = false;
    for (const building of buildings) {
      for (const block of building.blocks) {
        if (!block.destroyed &&
            x >= block.x && x <= block.x + block.width &&
            y >= block.y && y <= block.y + block.height) {
          onBlock = true;
          break;
        }
      }
    }
    
    if (onBlock) {
      setTntCharges(prev => [...prev, {
        x,
        y,
        timer: selectedTool === "bigTnt" ? 3 : 2,
        exploded: false,
      }]);
    }
  }, [buildings, isDetonating, selectedTool]);

  const detonate = useCallback(() => {
    if (tntCharges.length === 0) return;
    setIsDetonating(true);
    
    let delay = 0;
    const explosionRadius = selectedTool === "bigTnt" ? 120 : 80;
    
    tntCharges.forEach((tnt, index) => {
      setTimeout(() => {
        // Create explosion particles
        setParticles(prev => [...prev, ...createExplosion(tnt.x, tnt.y, explosionRadius)]);
        
        // Destroy nearby blocks
        setBuildings(prevBuildings => {
          let destroyedCount = 0;
          const updated = prevBuildings.map(building => ({
            ...building,
            blocks: building.blocks.map(block => {
              if (block.destroyed) return block;
              
              const dx = (block.x + block.width / 2) - tnt.x;
              const dy = (block.y + block.height / 2) - tnt.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < explosionRadius) {
                destroyedCount++;
                const angle = Math.atan2(dy, dx);
                const force = (explosionRadius - dist) / explosionRadius * 15;
                
                return {
                  ...block,
                  destroyed: true,
                  falling: true,
                  vx: Math.cos(angle) * force + (Math.random() - 0.5) * 5,
                  vy: Math.sin(angle) * force - 5,
                  rotationSpeed: (Math.random() - 0.5) * 0.3,
                };
              }
              return block;
            }),
          }));
          
          setScore(prev => prev + destroyedCount * 10);
          return updated;
        });
        
        // Mark TNT as exploded
        setTntCharges(prev => prev.map((t, i) => 
          i === index ? { ...t, exploded: true } : t
        ));
        
        if (index === tntCharges.length - 1) {
          setTimeout(() => {
            setTntCharges([]);
            setIsDetonating(false);
          }, 500);
        }
      }, delay);
      
      delay += 200;
    });
  }, [tntCharges, createExplosion, selectedTool]);

  // Physics update
  useEffect(() => {
    const updatePhysics = () => {
      // Update falling blocks
      setBuildings(prevBuildings => {
        let hasChanges = false;
        const updated = prevBuildings.map(building => ({
          ...building,
          blocks: building.blocks.map(block => {
            if (!block.falling && !block.destroyed) {
              // Check if block should start falling (no support below)
              const hasSupport = building.blocks.some(other => 
                !other.destroyed &&
                other !== block &&
                other.y > block.y &&
                other.y < block.y + block.height + 5 &&
                other.x < block.x + block.width &&
                other.x + other.width > block.x
              ) || block.y + block.height >= groundLevel - 1;
              
              if (!hasSupport) {
                hasChanges = true;
                return { ...block, falling: true, vy: 0 };
              }
            }
            
            if (block.falling) {
              hasChanges = true;
              const newVy = block.vy + 0.5;
              const newY = block.y + newVy;
              const newX = block.x + block.vx;
              const newRotation = block.rotation + block.rotationSpeed;
              
              // Ground collision
              if (newY + block.height >= groundLevel) {
                if (Math.abs(newVy) > 2) {
                  // Create debris particles on impact
                  setParticles(prev => [...prev, {
                    x: newX + block.width / 2,
                    y: groundLevel,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 3,
                    color: block.color,
                    size: 5,
                    life: 20,
                    maxLife: 20,
                    type: "debris",
                  }]);
                }
                return {
                  ...block,
                  y: groundLevel - block.height,
                  x: newX,
                  vy: -newVy * 0.3,
                  vx: block.vx * 0.5,
                  falling: Math.abs(newVy) > 1,
                  rotation: newRotation,
                  rotationSpeed: block.rotationSpeed * 0.5,
                };
              }
              
              return {
                ...block,
                y: newY,
                x: newX,
                vy: newVy,
                vx: block.vx * 0.99,
                rotation: newRotation,
              };
            }
            
            return block;
          }),
        }));
        
        return hasChanges ? updated : prevBuildings;
      });
      
      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.type === "dust" ? p.vy : p.vy + 0.3,
          vx: p.vx * 0.98,
          life: p.life - 1,
          size: p.type === "dust" ? p.size * 1.02 : p.size * 0.97,
        }))
        .filter(p => p.life > 0)
      );
    };
    
    const interval = setInterval(updatePhysics, 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const render = () => {
      // Clear
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, groundLevel);
      gradient.addColorStop(0, "#0f0f23");
      gradient.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, groundLevel);
      
      // Ground
      ctx.fillStyle = "#2d2d44";
      ctx.fillRect(0, groundLevel, canvas.width, canvas.height - groundLevel);
      
      // Draw buildings
      buildings.forEach(building => {
        building.blocks.forEach(block => {
          if (block.destroyed && !block.falling && block.y + block.height >= groundLevel - 1) {
            // Settled debris - draw smaller
            ctx.save();
            ctx.translate(block.x + block.width / 2, block.y + block.height / 2);
            ctx.rotate(block.rotation);
            ctx.fillStyle = block.color;
            ctx.fillRect(-block.width / 3, -block.height / 3, block.width / 1.5, block.height / 1.5);
            ctx.restore();
          } else if (!block.destroyed || block.falling) {
            ctx.save();
            ctx.translate(block.x + block.width / 2, block.y + block.height / 2);
            ctx.rotate(block.rotation);
            ctx.fillStyle = block.color;
            ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
            
            // Block highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(-block.width / 2, -block.height / 2, block.width, 3);
            
            // Block shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(-block.width / 2, block.height / 2 - 3, block.width, 3);
            ctx.restore();
          }
        });
      });
      
      // Draw TNT charges
      tntCharges.forEach(tnt => {
        if (!tnt.exploded) {
          ctx.fillStyle = "#FF0000";
          ctx.fillRect(tnt.x - 10, tnt.y - 15, 20, 25);
          ctx.fillStyle = "#8B0000";
          ctx.fillRect(tnt.x - 8, tnt.y - 13, 16, 21);
          ctx.fillStyle = "#FFD700";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText("TNT", tnt.x, tnt.y + 3);
          
          // Fuse
          ctx.strokeStyle = "#8B4513";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tnt.x, tnt.y - 15);
          ctx.lineTo(tnt.x, tnt.y - 25);
          ctx.stroke();
          
          // Spark on fuse if detonating
          if (isDetonating) {
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(tnt.x, tnt.y - 25, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      
      // Draw particles
      particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.type === "dust") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "spark") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        
        ctx.restore();
      });
      
      frameRef.current = requestAnimationFrame(render);
    };
    
    frameRef.current = requestAnimationFrame(render);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [buildings, tntCharges, particles, isDetonating]);

  return (
    <FeatureWrapper day={435} title="Pixel Demolition Crew" emoji="💥">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🧨 Controlled Chaos 🧨
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click on buildings to place TNT charges. Sometimes destruction is the most satisfying form of creation.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={() => setSelectedTool("tnt")}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedTool === "tnt" 
                ? "bg-red-600 text-white scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🧨 TNT
          </button>
          <button
            onClick={() => setSelectedTool("bigTnt")}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedTool === "bigTnt" 
                ? "bg-orange-600 text-white scale-105" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            💣 Big TNT
          </button>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{ border: "2px solid var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
          />
          
          <div 
            className="absolute top-4 left-4 px-3 py-2 rounded-lg"
            style={{ 
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "var(--color-text)"
            }}
          >
            <span className="font-bold">Score: </span>
            <span className="text-yellow-400">{score}</span>
          </div>
          
          <div 
            className="absolute top-4 right-4 px-3 py-2 rounded-lg"
            style={{ 
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "var(--color-text)"
            }}
          >
            <span className="font-bold">Charges: </span>
            <span className="text-red-400">{tntCharges.filter(t => !t.exploded).length}</span>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={detonate}
            disabled={tntCharges.length === 0 || isDetonating}
            className="btn-primary px-8 py-3 text-lg font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            style={{
              backgroundColor: tntCharges.length > 0 && !isDetonating ? "#DC2626" : undefined,
            }}
          >
            {isDetonating ? "💥 BOOM! 💥" : "🔥 DETONATE 🔥"}
          </button>
          
          <button
            onClick={initializeScene}
            className="btn-secondary px-6 py-3 text-lg font-bold rounded-lg transition-all hover:scale-105"
          >
            🏗️ New City
          </button>
        </div>

        <div 
          className="text-sm text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p className="italic">
            &quot;In the art of demolition, patience is key. Place your charges wisely, 
            and watch physics do the rest.&quot;
          </p>
          <p className="mt-2 opacity-70">
            Pro tip: Target the base of buildings for maximum satisfaction 🎯
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}