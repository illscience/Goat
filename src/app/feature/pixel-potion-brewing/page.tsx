"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: "herb" | "crystal" | "liquid";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "sparkle" | "bubble" | "smoke" | "explosion";
}

interface Potion {
  name: string;
  color: string;
  effect: string;
  bgEffect: string | null;
}

const INGREDIENTS: Ingredient[] = [
  { id: "moonpetal", name: "Moonpetal", emoji: "🌸", color: "#E8B4F8", type: "herb" },
  { id: "dragonthorn", name: "Dragonthorn", emoji: "🌿", color: "#7CB342", type: "herb" },
  { id: "shadowmoss", name: "Shadowmoss", emoji: "🍃", color: "#4A5568", type: "herb" },
  { id: "starcrystal", name: "Starcrystal", emoji: "💎", color: "#90CAF9", type: "crystal" },
  { id: "fireruby", name: "Fireruby", emoji: "🔴", color: "#EF5350", type: "crystal" },
  { id: "voidstone", name: "Voidstone", emoji: "⚫", color: "#1A1A2E", type: "crystal" },
  { id: "moonwater", name: "Moonwater", emoji: "💧", color: "#B3E5FC", type: "liquid" },
  { id: "dragonblood", name: "Dragonblood", emoji: "🩸", color: "#C62828", type: "liquid" },
  { id: "etheressence", name: "Etheressence", emoji: "✨", color: "#FFF59D", type: "liquid" },
];

const POTIONS: Record<string, Potion> = {
  "moonpetal+starcrystal+moonwater": {
    name: "Elixir of Dreams",
    color: "#B39DDB",
    effect: "sparkle",
    bgEffect: "aurora",
  },
  "dragonthorn+fireruby+dragonblood": {
    name: "Dragon's Breath",
    color: "#FF5722",
    effect: "explosion",
    bgEffect: "flames",
  },
  "shadowmoss+voidstone+etheressence": {
    name: "Shadow Veil",
    color: "#37474F",
    effect: "smoke",
    bgEffect: "darkness",
  },
  "moonpetal+fireruby+etheressence": {
    name: "Phoenix Tears",
    color: "#FFB74D",
    effect: "sparkle",
    bgEffect: "sunrise",
  },
  "dragonthorn+starcrystal+moonwater": {
    name: "Forest Spirit",
    color: "#81C784",
    effect: "bubble",
    bgEffect: "nature",
  },
  "shadowmoss+fireruby+dragonblood": {
    name: "Nightmare Essence",
    color: "#4A148C",
    effect: "smoke",
    bgEffect: "nightmare",
  },
};

export default function PixelPotionBrewing() {
  const [cauldronIngredients, setCauldronIngredients] = useState<Ingredient[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentPotion, setCurrentPotion] = useState<Potion | null>(null);
  const [bgEffect, setBgEffect] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [draggingIngredient, setDraggingIngredient] = useState<Ingredient | null>(null);
  const [brewMessage, setBrewMessage] = useState<string>("");
  const [cauldronBubbles, setCauldronBubbles] = useState<{ id: number; x: number; delay: number }[]>([]);
  
  const particleIdRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const cauldronRef = useRef<HTMLDivElement>(null);

  // Generate cauldron bubbles
  useEffect(() => {
    const bubbles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      delay: Math.random() * 2,
    }));
    setCauldronBubbles(bubbles);
  }, []);

  // Particle animation loop
  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.type === "bubble" ? p.vy : p.vy + 0.1,
            life: p.life - 1,
            size: p.type === "smoke" ? p.size * 1.02 : p.size * 0.98,
          }))
          .filter((p) => p.life > 0)
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const createParticles = useCallback((type: string, color: string, count: number = 20) => {
    const newParticles: Particle[] = [];
    const cauldronRect = cauldronRef.current?.getBoundingClientRect();
    
    if (!cauldronRect) return;
    
    const centerX = cauldronRect.width / 2;
    const centerY = cauldronRect.height / 3;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = type === "explosion" ? 3 + Math.random() * 5 : 1 + Math.random() * 2;
      
      newParticles.push({
        id: particleIdRef.current++,
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 20,
        vx: type === "bubble" ? (Math.random() - 0.5) * 0.5 : Math.cos(angle) * speed,
        vy: type === "bubble" ? -1 - Math.random() * 2 : type === "smoke" ? -1 - Math.random() : Math.sin(angle) * speed,
        color,
        size: type === "smoke" ? 15 + Math.random() * 10 : 4 + Math.random() * 8,
        life: type === "smoke" ? 60 + Math.random() * 40 : 40 + Math.random() * 30,
        maxLife: 100,
        type: type as Particle["type"],
      });
    }
    
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const handleDragStart = (e: React.DragEvent, ingredient: Ingredient) => {
    setDraggingIngredient(ingredient);
    e.dataTransfer.setData("text/plain", ingredient.id);
  };

  const handleDragEnd = () => {
    setDraggingIngredient(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    const ingredientId = e.dataTransfer.getData("text/plain");
    const ingredient = INGREDIENTS.find((i) => i.id === ingredientId);
    
    if (ingredient && cauldronIngredients.length < 3) {
      const alreadyAdded = cauldronIngredients.find((i) => i.id === ingredient.id);
      if (!alreadyAdded) {
        setCauldronIngredients((prev) => [...prev, ingredient]);
        createParticles("bubble", ingredient.color, 10);
        setBrewMessage(`Added ${ingredient.name}!`);
        setTimeout(() => setBrewMessage(""), 1500);
      }
    }
  };

  const brewPotion = () => {
    if (cauldronIngredients.length !== 3) {
      setBrewMessage("Need exactly 3 ingredients!");
      setTimeout(() => setBrewMessage(""), 2000);
      return;
    }

    const sortedIds = cauldronIngredients.map((i) => i.id).sort().join("+");
    const potion = POTIONS[sortedIds];

    if (potion) {
      setCurrentPotion(potion);
      setBgEffect(potion.bgEffect);
      createParticles(potion.effect, potion.color, 40);
      setBrewMessage(`✨ ${potion.name} created! ✨`);
      
      // Clear bg effect after animation
      setTimeout(() => setBgEffect(null), 5000);
    } else {
      // Random failed potion
      const colors = cauldronIngredients.map((i) => i.color);
      const mixedColor = colors[Math.floor(Math.random() * colors.length)];
      createParticles("smoke", mixedColor, 30);
      setBrewMessage("💨 The mixture fizzles... Try a different combo!");
    }

    setTimeout(() => {
      setBrewMessage("");
      setCauldronIngredients([]);
      setCurrentPotion(null);
    }, 3000);
  };

  const clearCauldron = () => {
    setCauldronIngredients([]);
    setCurrentPotion(null);
    setBgEffect(null);
    setBrewMessage("");
  };

  const getBgClasses = () => {
    switch (bgEffect) {
      case "aurora":
        return "bg-gradient-to-b from-purple-900 via-blue-900 to-teal-900";
      case "flames":
        return "bg-gradient-to-b from-red-900 via-orange-800 to-yellow-900";
      case "darkness":
        return "bg-gradient-to-b from-gray-900 via-slate-900 to-black";
      case "sunrise":
        return "bg-gradient-to-b from-orange-400 via-pink-500 to-purple-600";
      case "nature":
        return "bg-gradient-to-b from-green-900 via-emerald-800 to-teal-900";
      case "nightmare":
        return "bg-gradient-to-b from-purple-950 via-red-950 to-black";
      default:
        return "";
    }
  };

  return (
    <FeatureWrapper day={427} title="Pixel Potion Brewing" emoji="🧪">
      <div
        className={`min-h-[600px] p-6 rounded-xl transition-all duration-1000 relative overflow-hidden ${
          bgEffect ? getBgClasses() : ""
        }`}
        style={{
          backgroundColor: bgEffect ? undefined : "var(--color-bg-secondary)",
        }}
      >
        {/* Animated background sparkles for special effects */}
        {bgEffect && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: "white",
                  opacity: 0.6,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto relative z-10">
          <h2
            className="text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🔮 The Alchemist&apos;s Workshop
          </h2>
          <p className="text-center mb-8" style={{ color: "var(--color-text-dim)" }}>
            Drag three ingredients into the cauldron and discover magical potions!
          </p>

          {/* Ingredients Shelf */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
              📦 Ingredient Shelf
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {["herb", "crystal", "liquid"].map((type) => (
                <div key={type} className="space-y-2">
                  <span
                    className="text-sm uppercase tracking-wide"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {type}s
                  </span>
                  <div className="flex flex-col gap-2">
                    {INGREDIENTS.filter((i) => i.type === type).map((ingredient) => (
                      <div
                        key={ingredient.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ingredient)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:scale-105 hover:shadow-lg ${
                          cauldronIngredients.find((i) => i.id === ingredient.id)
                            ? "opacity-40"
                            : ""
                        }`}
                        style={{
                          backgroundColor: ingredient.color + "33",
                          border: `2px solid ${ingredient.color}`,
                        }}
                      >
                        <span className="text-2xl mr-2">{ingredient.emoji}</span>
                        <span style={{ color: "var(--color-text)" }}>{ingredient.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cauldron Area */}
          <div className="flex flex-col items-center">
            <div
              ref={cauldronRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-64 h-64 rounded-full transition-all duration-300 ${
                isHovering ? "scale-110" : ""
              }`}
              style={{
                background: currentPotion
                  ? `radial-gradient(circle at 50% 30%, ${currentPotion.color}, #1a1a1a)`
                  : "radial-gradient(circle at 50% 30%, #4a1a6b, #1a1a1a)",
                boxShadow: isHovering
                  ? "0 0 40px rgba(147, 51, 234, 0.6), inset 0 -20px 40px rgba(0,0,0,0.5)"
                  : "0 0 20px rgba(147, 51, 234, 0.3), inset 0 -20px 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* Cauldron rim */}
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-8 rounded-t-full"
                style={{
                  background: "linear-gradient(to bottom, #2d2d2d, #1a1a1a)",
                  border: "2px solid #404040",
                }}
              />

              {/* Bubbling liquid */}
              <div className="absolute inset-4 overflow-hidden">
                {cauldronBubbles.map((bubble) => (
                  <div
                    key={bubble.id}
                    className="absolute w-3 h-3 rounded-full opacity-60"
                    style={{
                      left: `${bubble.x}%`,
                      bottom: "10%",
                      backgroundColor: currentPotion?.color || "#9c27b0",
                      animation: `float 2s ease-in-out infinite`,
                      animationDelay: `${bubble.delay}s`,
                    }}
                  />
                ))}
              </div>

              {/* Particles */}
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    opacity: particle.life / particle.maxLife,
                    filter: particle.type === "sparkle" ? "blur(0px)" : "blur(2px)",
                    boxShadow:
                      particle.type === "sparkle"
                        ? `0 0 ${particle.size}px ${particle.color}`
                        : "none",
                  }}
                />
              ))}

              {/* Ingredients in cauldron */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2">
                {cauldronIngredients.map((ingredient, idx) => (
                  <div
                    key={ingredient.id}
                    className="text-3xl animate-bounce"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {ingredient.emoji}
                  </div>
                ))}
              </div>

              {/* Drop hint */}
              {cauldronIngredients.length < 3 && (
                <div
                  className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  <p className="text-sm">Drop ingredients here</p>
                  <p className="text-xs opacity-60">
                    {3 - cauldronIngredients.length} more needed
                  </p>
                </div>
              )}
            </div>

            {/* Message Display */}
            {brewMessage && (
              <div
                className="mt-4 px-6 py-3 rounded-lg text-center animate-pulse"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                {brewMessage}
              </div>
            )}

            {/* Potion Result */}
            {currentPotion && (
              <div className="mt-4 text-center">
                <h3
                  className="text-2xl font-bold"
                  style={{ color: currentPotion.color, fontFamily: "var(--font-serif)" }}
                >
                  {currentPotion.name}
                </h3>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={brewPotion}
                disabled={cauldronIngredients.length !== 3}
                className="btn-primary px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                🧙 Brew Potion
              </button>
              <button
                onClick={clearCauldron}
                className="btn-secondary px-6 py-3 rounded-lg transition-all hover:scale-105"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* Recipe Hints */}
          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: "var(--color-bg)" }}>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
            >
              📜 Alchemist&apos;s Hints
            </h3>
            <ul className="text-sm space-y-1" style={{ color: "var(--color-text-dim)" }}>
              <li>• Mix one herb, one crystal, and one liquid for best results</li>
              <li>• Moonpetal + Starcrystal create dreamy effects...</li>
              <li>• Dragon ingredients are known for fiery outcomes!</li>
              <li>• Shadow and Void ingredients lead to mysterious potions</li>
            </ul>
          </div>
        </div>

        {/* CSS for bubble animation */}
        <style>
          {`
            @keyframes float {
              0%, 100% {
                transform: translateY(0) scale(1);
                opacity: 0.6;
              }
              50% {
                transform: translateY(-100px) scale(0.5);
                opacity: 0;
              }
            }
          `}
        </style>
      </div>
    </FeatureWrapper>
  );
}