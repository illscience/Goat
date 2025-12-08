"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface DraggableEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  element: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  emoji?: string;
}

interface Reaction {
  elements: [string, string];
  result: {
    colors: string[];
    particleCount: number;
    emojis?: string[];
    name: string;
  };
}

const EMOJI_ELEMENTS: { emoji: string; element: string }[] = [
  { emoji: "🔥", element: "fire" },
  { emoji: "💧", element: "water" },
  { emoji: "❤️", element: "heart" },
  { emoji: "💀", element: "skull" },
  { emoji: "⚡", element: "lightning" },
  { emoji: "🌸", element: "flower" },
  { emoji: "🌙", element: "moon" },
  { emoji: "☀️", element: "sun" },
  { emoji: "💎", element: "crystal" },
  { emoji: "🍄", element: "mushroom" },
  { emoji: "👻", element: "ghost" },
  { emoji: "🦋", element: "butterfly" },
];

const REACTIONS: Reaction[] = [
  { elements: ["fire", "water"], result: { colors: ["#ffffff", "#e0e0e0", "#c0c0c0"], particleCount: 50, emojis: ["💨", "☁️"], name: "Steam Explosion!" } },
  { elements: ["heart", "skull"], result: { colors: ["#9b59b6", "#8e44ad", "#6c3483", "#ff69b4"], particleCount: 80, emojis: ["💔", "💜"], name: "Dramatic Demise!" } },
  { elements: ["lightning", "water"], result: { colors: ["#00ffff", "#ffff00", "#ffffff"], particleCount: 100, emojis: ["⚡", "💫"], name: "Electric Surge!" } },
  { elements: ["fire", "flower"], result: { colors: ["#ff6b6b", "#ffa500", "#333333"], particleCount: 40, emojis: ["🥀", "💨"], name: "Tragic Wilt!" } },
  { elements: ["moon", "sun"], result: { colors: ["#ffd700", "#ff4500", "#800080", "#000080"], particleCount: 120, emojis: ["🌅", "✨", "🌟"], name: "Eclipse!" } },
  { elements: ["crystal", "lightning"], result: { colors: ["#00ffff", "#ff00ff", "#ffff00", "#00ff00"], particleCount: 90, emojis: ["💎", "⚡", "✨"], name: "Prismatic Burst!" } },
  { elements: ["ghost", "heart"], result: { colors: ["#ffffff", "#ffb6c1", "#87ceeb"], particleCount: 60, emojis: ["👻", "💕"], name: "Haunted Love!" } },
  { elements: ["mushroom", "moon"], result: { colors: ["#9b59b6", "#2ecc71", "#3498db", "#e74c3c"], particleCount: 70, emojis: ["🌈", "✨", "🍄"], name: "Psychedelic Trip!" } },
  { elements: ["fire", "fire"], result: { colors: ["#ff0000", "#ff4500", "#ffa500", "#ffff00"], particleCount: 100, emojis: ["🔥", "💥"], name: "Inferno!" } },
  { elements: ["butterfly", "flower"], result: { colors: ["#ff69b4", "#dda0dd", "#98fb98", "#ffd700"], particleCount: 50, emojis: ["🦋", "🌺", "✨"], name: "Garden Magic!" } },
  { elements: ["skull", "ghost"], result: { colors: ["#000000", "#ffffff", "#808080", "#00ff00"], particleCount: 80, emojis: ["💀", "👻", "🦴"], name: "Spooky Summoning!" } },
  { elements: ["water", "crystal"], result: { colors: ["#00bfff", "#87ceeb", "#ffffff", "#e0ffff"], particleCount: 60, emojis: ["❄️", "💎"], name: "Frozen Beauty!" } },
];

export default function EmojiChemistryLab() {
  const [labEmojis, setLabEmojis] = useState<DraggableEmoji[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [reactionText, setReactionText] = useState<string>("");
  const [draggedEmoji, setDraggedEmoji] = useState<DraggableEmoji | null>(null);
  const labRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const idCounter = useRef<number>(0);

  const generateId = () => {
    idCounter.current += 1;
    return `id-${idCounter.current}-${Date.now()}`;
  };

  const findReaction = (elem1: string, elem2: string): Reaction | null => {
    return REACTIONS.find(
      (r) =>
        (r.elements[0] === elem1 && r.elements[1] === elem2) ||
        (r.elements[0] === elem2 && r.elements[1] === elem1)
    ) || null;
  };

  const createParticles = (x: number, y: number, reaction: Reaction["result"]) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < reaction.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / reaction.particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 8;
      const useEmoji = reaction.emojis && Math.random() > 0.6;
      newParticles.push({
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: reaction.colors[Math.floor(Math.random() * reaction.colors.length)],
        size: useEmoji ? 20 + Math.random() * 15 : 5 + Math.random() * 15,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        emoji: useEmoji ? reaction.emojis![Math.floor(Math.random() * reaction.emojis!.length)] : undefined,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const checkCollisions = useCallback(() => {
    if (labEmojis.length < 2) return;

    for (let i = 0; i < labEmojis.length; i++) {
      for (let j = i + 1; j < labEmojis.length; j++) {
        const e1 = labEmojis[i];
        const e2 = labEmojis[j];
        const dx = e1.x - e2.x;
        const dy = e1.y - e2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 60) {
          const reaction = findReaction(e1.element, e2.element);
          if (reaction) {
            const midX = (e1.x + e2.x) / 2;
            const midY = (e1.y + e2.y) / 2;
            createParticles(midX, midY, reaction.result);
            setReactionText(reaction.result.name);
            setTimeout(() => setReactionText(""), 2000);
            setLabEmojis((prev) => prev.filter((e) => e.id !== e1.id && e.id !== e2.id));
            return;
          } else {
            // Default reaction for unknown combinations
            const defaultReaction = {
              colors: ["#ff69b4", "#87ceeb", "#98fb98"],
              particleCount: 30,
              emojis: ["✨", "💫"],
              name: "Mysterious Fizz!",
            };
            const midX = (e1.x + e2.x) / 2;
            const midY = (e1.y + e2.y) / 2;
            createParticles(midX, midY, defaultReaction);
            setReactionText(defaultReaction.name);
            setTimeout(() => setReactionText(""), 2000);
            setLabEmojis((prev) => prev.filter((e) => e.id !== e1.id && e.id !== e2.id));
            return;
          }
        }
      }
    }
  }, [labEmojis]);

  useEffect(() => {
    checkCollisions();
  }, [checkCollisions]);

  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15,
            vx: p.vx * 0.98,
            life: p.life + 1,
          }))
          .filter((p) => p.life < p.maxLife)
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const handleDragStart = (emoji: string, element: string) => {
    const newEmoji: DraggableEmoji = {
      id: generateId(),
      emoji,
      x: 0,
      y: 0,
      element,
    };
    setDraggedEmoji(newEmoji);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedEmoji || !labRef.current) return;

    const rect = labRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLabEmojis((prev) => [...prev, { ...draggedEmoji, x, y }]);
    setDraggedEmoji(null);
  };

  const handleLabEmojiDrag = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (!labRef.current) return;
    const rect = labRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - rect.left;
      const y = moveEvent.clientY - rect.top;
      setLabEmojis((prev) =>
        prev.map((emoji) => (emoji.id === id ? { ...emoji, x, y } : emoji))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const clearLab = () => {
    setLabEmojis([]);
    setParticles([]);
    setReactionText("");
  };

  return (
    <FeatureWrapper day={373} title="Emoji Chemistry Lab" emoji="🧪">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Welcome to the Lab! 🔬
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Drag emojis onto the lab table. When two touch, they react based on their
            &quot;chemical properties&quot;. Because tiny pictures deserve physics too.
          </p>
        </div>

        {/* Emoji Palette */}
        <div
          className="flex flex-wrap justify-center gap-2 p-4 rounded-xl max-w-md"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          {EMOJI_ELEMENTS.map(({ emoji, element }) => (
            <div
              key={element}
              draggable
              onDragStart={() => handleDragStart(emoji, element)}
              className="text-3xl cursor-grab hover:scale-125 transition-transform select-none p-2 rounded-lg hover:bg-opacity-20"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              title={element}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Lab Table */}
        <div
          ref={labRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "400px",
            background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            border: "3px solid var(--color-border)",
            boxShadow: "inset 0 0 50px rgba(0,0,0,0.5), 0 0 20px rgba(79, 172, 254, 0.3)",
          }}
        >
          {/* Grid lines for lab aesthetic */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(79, 172, 254, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(79, 172, 254, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Reaction text */}
          {reactionText && (
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 text-2xl font-bold animate-bounce z-20"
              style={{
                fontFamily: "var(--font-serif)",
                color: "#ffd700",
                textShadow: "0 0 10px #ffd700, 0 0 20px #ff6b6b",
              }}
            >
              {reactionText}
            </div>
          )}

          {/* Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none"
              style={{
                left: p.x,
                top: p.y,
                transform: "translate(-50%, -50%)",
                opacity: 1 - p.life / p.maxLife,
              }}
            >
              {p.emoji ? (
                <span style={{ fontSize: p.size }}>{p.emoji}</span>
              ) : (
                <div
                  style={{
                    width: p.size * (1 - p.life / p.maxLife / 2),
                    height: p.size * (1 - p.life / p.maxLife / 2),
                    backgroundColor: p.color,
                    borderRadius: "50%",
                    boxShadow: `0 0 ${p.size / 2}px ${p.color}`,
                  }}
                />
              )}
            </div>
          ))}

          {/* Lab Emojis */}
          {labEmojis.map((emoji) => (
            <div
              key={emoji.id}
              className="absolute cursor-move text-4xl select-none transition-transform hover:scale-110"
              style={{
                left: emoji.x,
                top: emoji.y,
                transform: "translate(-50%, -50%)",
                filter: "drop-shadow(0 0 10px rgba(255,255,255,0.5))",
              }}
              onMouseDown={(e) => handleLabEmojiDrag(emoji.id, e)}
            >
              {emoji.emoji}
            </div>
          ))}

          {/* Empty state */}
          {labEmojis.length === 0 && particles.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center text-lg"
              style={{ color: "var(--color-text-dim)" }}
            >
              Drag emojis here to begin your experiments! 🧫
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <button onClick={clearLab} className="btn-secondary">
            🧹 Clear Lab
          </button>
        </div>

        {/* Known Reactions */}
        <div
          className="w-full max-w-lg p-4 rounded-xl"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <h3 className="font-bold mb-3" style={{ color: "var(--color-text)" }}>
            📋 Known Reactions:
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: "var(--color-text-dim)" }}>
            {REACTIONS.slice(0, 6).map((r, i) => {
              const e1 = EMOJI_ELEMENTS.find((e) => e.element === r.elements[0]);
              const e2 = EMOJI_ELEMENTS.find((e) => e.element === r.elements[1]);
              return (
                <div key={i} className="flex items-center gap-1">
                  <span>{e1?.emoji}</span>
                  <span>+</span>
                  <span>{e2?.emoji}</span>
                  <span>=</span>
                  <span className="font-medium" style={{ color: "var(--color-accent)" }}>
                    {r.result.name}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs italic" style={{ color: "var(--color-text-dim)" }}>
            ...and more secret combinations to discover! 🔮
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}