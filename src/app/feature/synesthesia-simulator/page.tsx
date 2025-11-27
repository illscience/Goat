"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  shape: "circle" | "triangle" | "square" | "star";
}

interface NoteVisual {
  note: string;
  color: string;
  secondaryColor: string;
  shape: "circle" | "triangle" | "square" | "star";
}

const noteVisuals: Record<string, NoteVisual> = {
  C: { note: "C", color: "#FF6B6B", secondaryColor: "#FF8E8E", shape: "circle" },
  "C#": { note: "C#", color: "#FF8E53", secondaryColor: "#FFA573", shape: "triangle" },
  D: { note: "D", color: "#FFC93C", secondaryColor: "#FFD566", shape: "square" },
  "D#": { note: "D#", color: "#95E1D3", secondaryColor: "#B0EBE0", shape: "star" },
  E: { note: "E", color: "#98D8AA", secondaryColor: "#B3E4BF", shape: "circle" },
  F: { note: "F", color: "#6BCB77", secondaryColor: "#8FD998", shape: "triangle" },
  "F#": { note: "F#", color: "#4ECDC4", secondaryColor: "#74D9D2", shape: "square" },
  G: { note: "G", color: "#45B7D1", secondaryColor: "#6DC8DE", shape: "star" },
  "G#": { note: "G#", color: "#96CEB4", secondaryColor: "#B0DBC6", shape: "circle" },
  A: { note: "A", color: "#9B59B6", secondaryColor: "#B07CC6", shape: "triangle" },
  "A#": { note: "A#", color: "#E056FD", secondaryColor: "#E77FFD", shape: "square" },
  B: { note: "B", color: "#686DE0", secondaryColor: "#8A8EE8", shape: "star" },
};

const pianoKeys = [
  { note: "C", isBlack: false, key: "a" },
  { note: "C#", isBlack: true, key: "w" },
  { note: "D", isBlack: false, key: "s" },
  { note: "D#", isBlack: true, key: "e" },
  { note: "E", isBlack: false, key: "d" },
  { note: "F", isBlack: false, key: "f" },
  { note: "F#", isBlack: true, key: "t" },
  { note: "G", isBlack: false, key: "g" },
  { note: "G#", isBlack: true, key: "y" },
  { note: "A", isBlack: false, key: "h" },
  { note: "A#", isBlack: true, key: "u" },
  { note: "B", isBlack: false, key: "j" },
  { note: "C2", isBlack: false, key: "k" },
];

const noteFrequencies: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
  C2: 523.25,
};

export default function SynesthesiaSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);

  const createParticles = useCallback((note: string, x: number, y: number) => {
    const baseNote = note.replace("2", "");
    const visual = noteVisuals[baseNote] || noteVisuals["C"];
    const particleCount = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      const particle: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: Math.random() > 0.5 ? visual.color : visual.secondaryColor,
        size: 5 + Math.random() * 15,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        shape: visual.shape,
      };
      particlesRef.current.push(particle);
    }
  }, []);

  const playNote = useCallback(
    (note: string) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const frequency = noteFrequencies[note] || 440;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);

      // Create particles at random position in canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const x = Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
        const y = canvas.height * 0.7;
        createParticles(note, x, y);
      }

      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 100);
    },
    [createParticles]
  );

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: string,
    x: number,
    y: number,
    size: number
  ) => {
    ctx.beginPath();
    switch (shape) {
      case "circle":
        ctx.arc(x, y, size, 0, Math.PI * 2);
        break;
      case "triangle":
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
        break;
      case "square":
        ctx.rect(x - size, y - size, size * 2, size * 2);
        break;
      case "star":
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const outerX = x + Math.cos(angle) * size;
          const outerY = y + Math.sin(angle) * size;
          const innerAngle = angle + Math.PI / 5;
          const innerX = x + Math.cos(innerAngle) * (size * 0.4);
          const innerY = y + Math.sin(innerAngle) * (size * 0.4);
          if (i === 0) {
            ctx.moveTo(outerX, outerY);
          } else {
            ctx.lineTo(outerX, outerY);
          }
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        break;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;

        drawShape(ctx, p.shape, p.x, p.y, p.size * p.life);
        ctx.fill();
        ctx.restore();

        return true;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = pianoKeys.find((k) => k.key === e.key.toLowerCase());
      if (key && !activeKeys.has(key.note)) {
        setActiveKeys((prev) => new Set([...prev, key.note]));
        playNote(key.note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = pianoKeys.find((k) => k.key === e.key.toLowerCase());
      if (key) {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(key.note);
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeKeys, playNote]);

  const handlePianoKeyClick = (note: string) => {
    playNote(note);
    setActiveKeys((prev) => new Set([...prev, note]));
    setTimeout(() => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }, 200);
  };

  const whiteKeys = pianoKeys.filter((k) => !k.isBlack);
  const blackKeys = pianoKeys.filter((k) => k.isBlack);

  return (
    <FeatureWrapper day={362} title="Synesthesia Simulator" emoji="🎹">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <p
            className="text-lg"
            style={{ color: "var(--color-text-dim)", fontFamily: "var(--font-serif)" }}
          >
            See music in color ✨
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Play the piano with your keyboard (A-K for white keys, W/E/T/Y/U for black) or click
            the keys
          </p>
        </div>

        <div
          className="relative rounded-xl overflow-hidden border"
          style={{
            borderColor: "var(--color-border)",
            boxShadow: isPlaying ? "0 0 30px rgba(147, 112, 219, 0.3)" : "none",
            transition: "box-shadow 0.3s ease",
          }}
        >
          <canvas
            ref={canvasRef}
            width={700}
            height={300}
            className="w-full"
            style={{ backgroundColor: "#0a0a0f" }}
          />
        </div>

        <div className="relative flex justify-center" style={{ height: "160px", width: "100%" }}>
          {/* White keys */}
          <div className="flex gap-1">
            {whiteKeys.map((key, index) => {
              const baseNote = key.note.replace("2", "");
              const visual = noteVisuals[baseNote];
              const isActive = activeKeys.has(key.note);

              return (
                <button
                  key={key.note}
                  onClick={() => handlePianoKeyClick(key.note)}
                  className="relative flex flex-col items-center justify-end pb-2 rounded-b-lg transition-all duration-100"
                  style={{
                    width: "48px",
                    height: "150px",
                    backgroundColor: isActive ? visual.color : "#f8f8f8",
                    boxShadow: isActive
                      ? `0 0 20px ${visual.color}, inset 0 -5px 10px rgba(0,0,0,0.1)`
                      : "inset 0 -5px 10px rgba(0,0,0,0.1), 0 2px 5px rgba(0,0,0,0.2)",
                    transform: isActive ? "translateY(2px)" : "translateY(0)",
                    border: "1px solid #ccc",
                  }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: isActive ? "#fff" : "#666" }}
                  >
                    {key.note}
                  </span>
                  <span
                    className="text-xs mt-1 uppercase"
                    style={{ color: isActive ? "#fff" : "#999" }}
                  >
                    {key.key}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Black keys */}
          <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
            <div className="relative" style={{ width: `${whiteKeys.length * 52}px` }}>
              {blackKeys.map((key) => {
                const baseNote = key.note.replace("2", "");
                const visual = noteVisuals[baseNote];
                const isActive = activeKeys.has(key.note);

                // Calculate position based on note
                const blackKeyPositions: Record<string, number> = {
                  "C#": 0,
                  "D#": 1,
                  "F#": 3,
                  "G#": 4,
                  "A#": 5,
                };
                const position = blackKeyPositions[key.note];
                const offset = (position + 1) * 52 - 15;

                return (
                  <button
                    key={key.note}
                    onClick={() => handlePianoKeyClick(key.note)}
                    className="absolute flex flex-col items-center justify-end pb-2 rounded-b-md transition-all duration-100 pointer-events-auto"
                    style={{
                      width: "32px",
                      height: "95px",
                      left: `${offset}px`,
                      backgroundColor: isActive ? visual.color : "#1a1a1a",
                      boxShadow: isActive
                        ? `0 0 20px ${visual.color}`
                        : "0 3px 8px rgba(0,0,0,0.5)",
                      transform: isActive ? "translateY(2px)" : "translateY(0)",
                      zIndex: 10,
                    }}
                  >
                    <span className="text-xs" style={{ color: isActive ? "#fff" : "#888" }}>
                      {key.key.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {Object.entries(noteVisuals).map(([note, visual]) => (
            <div key={note} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: visual.color,
                  boxShadow: `0 0 8px ${visual.color}`,
                }}
              />
              <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                {note}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-center mt-4" style={{ color: "var(--color-text-dim)" }}>
          Synesthesia is a neurological condition where stimulating one sense triggers automatic
          experiences in another.
          <br />
          Some synesthetes literally see colors when they hear music. 🌈
        </p>
      </div>
    </FeatureWrapper>
  );
}