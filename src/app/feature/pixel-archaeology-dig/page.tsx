"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  color: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  discovered: boolean;
  depth: number;
  pattern: number[][];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const DIG_RADIUS = 25;

const ARTIFACT_TYPES = {
  common: [
    { name: "Pottery Shard", emoji: "🏺", colors: ["#8B4513", "#A0522D", "#CD853F"] },
    { name: "Old Coin", emoji: "🪙", colors: ["#B8860B", "#DAA520", "#FFD700"] },
    { name: "Bone Fragment", emoji: "🦴", colors: ["#F5F5DC", "#FAF0E6", "#FFFAF0"] },
    { name: "Stone Tool", emoji: "🪨", colors: ["#696969", "#808080", "#A9A9A9"] },
  ],
  uncommon: [
    { name: "Ancient Tablet", emoji: "📜", colors: ["#DEB887", "#D2B48C", "#F5DEB3"] },
    { name: "Bronze Dagger", emoji: "🗡️", colors: ["#CD7F32", "#B87333", "#8B4513"] },
    { name: "Ceramic Vase", emoji: "🏺", colors: ["#E07B39", "#D2691E", "#FF8C00"] },
    { name: "Shell Necklace", emoji: "📿", colors: ["#FFE4E1", "#FFC0CB", "#FF69B4"] },
  ],
  rare: [
    { name: "Gold Ring", emoji: "💍", colors: ["#FFD700", "#FFA500", "#FF8C00"] },
    { name: "Jade Figurine", emoji: "🗿", colors: ["#00A86B", "#50C878", "#7FFFD4"] },
    { name: "Crystal Amulet", emoji: "💎", colors: ["#E0FFFF", "#87CEEB", "#00CED1"] },
    { name: "Silver Chalice", emoji: "🏆", colors: ["#C0C0C0", "#D3D3D3", "#E8E8E8"] },
  ],
  legendary: [
    { name: "Dragon Fossil", emoji: "🐉", colors: ["#8B0000", "#DC143C", "#FF4500"] },
    { name: "Crown of Ages", emoji: "👑", colors: ["#FFD700", "#FF6347", "#FF1493"] },
    { name: "Phoenix Feather", emoji: "🔥", colors: ["#FF4500", "#FF6347", "#FFD700"] },
    { name: "Mystic Orb", emoji: "🔮", colors: ["#9400D3", "#8A2BE2", "#9932CC"] },
  ],
};

const RARITY_COLORS = {
  common: "#9CA3AF",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  legendary: "#F59E0B",
};

export default function PixelArchaeologyDig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirtCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [digsRemaining, setDigsRemaining] = useState(50);
  const [isDigging, setIsDigging] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const generateArtifactPattern = (width: number, height: number): number[][] => {
    const pattern: number[][] = [];
    for (let y = 0; y < height; y++) {
      pattern[y] = [];
      for (let x = 0; x < width; x++) {
        const distFromCenter = Math.sqrt(
          Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
        );
        const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
        pattern[y][x] = distFromCenter < maxDist * 0.8 ? (Math.random() > 0.3 ? 1 : 0) : 0;
      }
    }
    return pattern;
  };

  const generateArtifacts = useCallback(() => {
    const newArtifacts: Artifact[] = [];
    const rarities: Array<"common" | "uncommon" | "rare" | "legendary"> = [
      ...Array(12).fill("common"),
      ...Array(6).fill("uncommon"),
      ...Array(3).fill("rare"),
      ...Array(1).fill("legendary"),
    ];

    rarities.forEach((rarity, index) => {
      const types = ARTIFACT_TYPES[rarity];
      const type = types[Math.floor(Math.random() * types.length)];
      const size = rarity === "legendary" ? 40 : rarity === "rare" ? 32 : rarity === "uncommon" ? 28 : 24;
      
      let x: number, y: number;
      let attempts = 0;
      do {
        x = Math.random() * (CANVAS_WIDTH - size - 40) + 20;
        y = Math.random() * (CANVAS_HEIGHT - size - 40) + 20;
        attempts++;
      } while (
        attempts < 100 &&
        newArtifacts.some(
          (a) => Math.abs(a.x - x) < 50 && Math.abs(a.y - y) < 50
        )
      );

      const depth = rarity === "legendary" ? 3 : rarity === "rare" ? 2 : rarity === "uncommon" ? 1 : 0;

      newArtifacts.push({
        x,
        y,
        width: size,
        height: size,
        type: type.name,
        color: type.colors[Math.floor(Math.random() * type.colors.length)],
        rarity,
        discovered: false,
        depth,
        pattern: generateArtifactPattern(size, size),
      });
    });

    setArtifacts(newArtifacts);
  }, []);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = "sine") => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  const playDigSound = useCallback(() => {
    playSound(150 + Math.random() * 50, 0.1, "triangle");
  }, [playSound]);

  const playDiscoverySound = useCallback((rarity: string) => {
    const baseFreq = rarity === "legendary" ? 600 : rarity === "rare" ? 500 : rarity === "uncommon" ? 400 : 300;
    playSound(baseFreq, 0.2, "sine");
    setTimeout(() => playSound(baseFreq * 1.25, 0.2, "sine"), 100);
    if (rarity === "rare" || rarity === "legendary") {
      setTimeout(() => playSound(baseFreq * 1.5, 0.3, "sine"), 200);
    }
  }, [playSound]);

  const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const initializeCanvas = useCallback(() => {
    const dirtCanvas = dirtCanvasRef.current;
    if (!dirtCanvas) return;
    
    const ctx = dirtCanvas.getContext("2d");
    if (!ctx) return;

    // Create layered dirt texture
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        const depth = y / CANVAS_HEIGHT;
        const baseColor = Math.floor(30 + depth * 20);
        const variation = Math.floor(Math.random() * 15);
        const r = baseColor + variation;
        const g = baseColor + Math.floor(variation * 0.7);
        const b = baseColor + Math.floor(variation * 0.3);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Add some texture details
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const shade = Math.floor(Math.random() * 20) + 20;
      ctx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 10})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }, []);

  const dig = useCallback((mouseX: number, mouseY: number) => {
    if (digsRemaining <= 0 || gameOver) return;

    const dirtCanvas = dirtCanvasRef.current;
    if (!dirtCanvas) return;
    
    const ctx = dirtCanvas.getContext("2d");
    if (!ctx) return;

    setIsDigging(true);
    setDigsRemaining((prev) => prev - 1);
    playDigSound();

    // Clear circular area
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, DIG_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Create dirt particles
    createParticles(mouseX, mouseY, "#4A3728", 8);

    // Check for artifact discoveries
    artifacts.forEach((artifact, index) => {
      if (artifact.discovered) return;

      const centerX = artifact.x + artifact.width / 2;
      const centerY = artifact.y + artifact.height / 2;
      const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
      );

      if (distance < DIG_RADIUS + artifact.width / 2) {
        // Mark as discovered
        setArtifacts((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], discovered: true };
          return updated;
        });

        // Add to discoveries
        const emoji = Object.values(ARTIFACT_TYPES)
          .flat()
          .find((t) => t.name === artifact.type)?.emoji || "❓";
        setDiscoveries((prev) => [`${emoji} ${artifact.type}`, ...prev].slice(0, 8));

        // Update score
        const points =
          artifact.rarity === "legendary"
            ? 1000
            : artifact.rarity === "rare"
            ? 500
            : artifact.rarity === "uncommon"
            ? 200
            : 50;
        setScore((prev) => prev + points);

        // Play discovery sound and create particles
        playDiscoverySound(artifact.rarity);
        createParticles(centerX, centerY, artifact.color, 20);
        createParticles(centerX, centerY, RARITY_COLORS[artifact.rarity], 15);
      }
    });

    setTimeout(() => setIsDigging(false), 100);

    if (digsRemaining <= 1) {
      setGameOver(true);
    }
  }, [artifacts, digsRemaining, gameOver, playDigSound, playDiscoverySound, createParticles]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    dig(x, y);
  }, [dig]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw artifacts
    artifacts.forEach((artifact) => {
      ctx.fillStyle = artifact.color;
      artifact.pattern.forEach((row, py) => {
        row.forEach((pixel, px) => {
          if (pixel === 1) {
            ctx.fillRect(artifact.x + px, artifact.y + py, 1, 1);
          }
        });
      });

      // Draw rarity glow for discovered artifacts
      if (artifact.discovered) {
        ctx.save();
        ctx.shadowColor = RARITY_COLORS[artifact.rarity];
        ctx.shadowBlur = 10;
        ctx.strokeStyle = RARITY_COLORS[artifact.rarity];
        ctx.lineWidth = 2;
        ctx.strokeRect(artifact.x - 2, artifact.y - 2, artifact.width + 4, artifact.height + 4);
        ctx.restore();
      }
    });

    // Draw dirt layer on top
    const dirtCanvas = dirtCanvasRef.current;
    if (dirtCanvas) {
      ctx.drawImage(dirtCanvas, 0, 0);
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    particlesRef.current.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
      particle.life -= 0.02;

      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    animationRef.current = requestAnimationFrame(render);
  }, [artifacts]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setDigsRemaining(50);
    setDiscoveries([]);
    generateArtifacts();
    initializeCanvas();
  }, [generateArtifacts, initializeCanvas]);

  useEffect(() => {
    if (gameStarted) {
      animationRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, render]);

  return (
    <FeatureWrapper day={401} title="Pixel Archaeology Dig" emoji="⛏️">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-xl">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Unearth Ancient Treasures! 🏛️
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click to dig through layers of ancient earth. Discover pottery, fossils, and legendary artifacts hidden beneath the surface!
          </p>
        </div>

        {!gameStarted ? (
          <div className="flex flex-col items-center gap-4 p-8 rounded-xl" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <div className="text-6xl animate-bounce">⛏️</div>
            <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>Ready to Dig?</h3>
            <p className="text-center text-sm max-w-xs" style={{ color: "var(--color-text-dim)" }}>
              Ancient artifacts await! You have 50 digs to uncover as many treasures as possible. Rarer items are buried deeper...
            </p>
            <div className="flex gap-2 text-sm">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: RARITY_COLORS.common, color: "white" }}>Common</span>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: RARITY_COLORS.uncommon, color: "white" }}>Uncommon</span>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: RARITY_COLORS.rare, color: "white" }}>Rare</span>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: RARITY_COLORS.legendary, color: "white" }}>Legendary</span>
            </div>
            <button
              onClick={startGame}
              className="btn-primary px-8 py-3 text-lg font-bold rounded-lg mt-4"
            >
              Start Excavation 🔍
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>{score}</div>
                <div className="text-xs uppercase" style={{ color: "var(--color-text-dim)" }}>Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: digsRemaining < 10 ? "#EF4444" : "var(--color-text)" }}>{digsRemaining}</div>
                <div className="text-xs uppercase" style={{ color: "var(--color-text-dim)" }}>Digs Left</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>{discoveries.length}</div>
                <div className="text-xs uppercase" style={{ color: "var(--color-text-dim)" }}>Found</div>
              </div>
            </div>

            <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                className={`rounded-lg cursor-crosshair border-4 ${isDigging ? "scale-[0.99]" : ""}`}
                style={{ 
                  borderColor: "var(--color-border)",
                  transition: "transform 0.05s",
                  backgroundColor: "#1a1a2e"
                }}
              />
              <canvas
                ref={dirtCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="hidden"
              />
              
              {gameOver && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
                >
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    Excavation Complete!
                  </h3>
                  <p className="text-xl mb-2" style={{ color: "var(--color-accent)" }}>
                    Final Score: {score}
                  </p>
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-dim)" }}>
                    You discovered {discoveries.length} artifact{discoveries.length !== 1 ? "s" : ""}!
                  </p>
                  <button
                    onClick={startGame}
                    className="btn-primary px-6 py-2 rounded-lg"
                  >
                    Dig Again 🔄
                  </button>
                </div>
              )}
            </div>

            {discoveries.length > 0 && (
              <div className="w-full max-w-md">
                <h4 className="text-sm font-bold mb-2 uppercase" style={{ color: "var(--color-text-dim)" }}>
                  Recent Discoveries
                </h4>
                <div className="flex flex-wrap gap-2">
                  {discoveries.map((discovery, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: "var(--color-bg-secondary)",
                        color: "var(--color-text)",
                        animation: index === 0 ? "pulse 0.5s ease-out" : undefined
                      }}
                    >
                      {discovery}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-center" style={{ color: "var(--color-text-dim)" }}>
              💡 Tip: Legendary artifacts glow with golden light when uncovered!
            </p>
          </>
        )}
      </div>
    </FeatureWrapper>
  );
}