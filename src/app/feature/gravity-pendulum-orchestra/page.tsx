"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pendulum {
  id: number;
  x: number;
  y: number;
  length: number;
  weight: number;
  angle: number;
  angularVelocity: number;
  color: string;
}

interface SoundBarrier {
  id: number;
  y: number;
  note: string;
  frequency: number;
  lastTriggered: number;
  color: string;
}

const NOTES = [
  { name: "C4", freq: 261.63 },
  { name: "D4", freq: 293.66 },
  { name: "E4", freq: 329.63 },
  { name: "F4", freq: 349.23 },
  { name: "G4", freq: 392.0 },
  { name: "A4", freq: 440.0 },
  { name: "B4", freq: 493.88 },
  { name: "C5", freq: 523.25 },
];

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

export default function GravityPendulumOrchestra() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [pendulums, setPendulums] = useState<Pendulum[]>([]);
  const [barriers, setBarriers] = useState<SoundBarrier[]>([]);
  const [mode, setMode] = useState<"pendulum" | "barrier">("pendulum");
  const [isPlaying, setIsPlaying] = useState(true);
  const [gravity, setGravity] = useState(0.5);
  const [damping, setDamping] = useState(0.999);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  const playNote = useCallback((frequency: number, noteName: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    setActiveNotes((prev) => new Set(prev).add(noteName));
    setTimeout(() => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteName);
        return next;
      });
    }, 200);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === "pendulum") {
      const newPendulum: Pendulum = {
        id: Date.now(),
        x,
        y: 50,
        length: Math.max(50, y - 50),
        weight: 10 + Math.random() * 20,
        angle: ((x - canvas.width / 2) / canvas.width) * Math.PI * 0.5,
        angularVelocity: 0,
        color: COLORS[pendulums.length % COLORS.length],
      };
      setPendulums((prev) => [...prev, newPendulum]);
    } else {
      const noteIndex = barriers.length % NOTES.length;
      const newBarrier: SoundBarrier = {
        id: Date.now(),
        y,
        note: NOTES[noteIndex].name,
        frequency: NOTES[noteIndex].freq,
        lastTriggered: 0,
        color: COLORS[noteIndex],
      };
      setBarriers((prev) => [...prev, newBarrier]);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationTime = 0;

    const animate = () => {
      if (!isPlaying) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      animationTime += 16;

      ctx.fillStyle = "rgba(10, 10, 20, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw barriers
      barriers.forEach((barrier) => {
        const isActive = animationTime - barrier.lastTriggered < 200;
        ctx.strokeStyle = isActive ? "#fff" : barrier.color;
        ctx.lineWidth = isActive ? 4 : 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, barrier.y);
        ctx.lineTo(canvas.width, barrier.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Note label
        ctx.fillStyle = barrier.color;
        ctx.font = "14px monospace";
        ctx.fillText(barrier.note, 10, barrier.y - 5);
      });

      // Update and draw pendulums
      setPendulums((prev) =>
        prev.map((p) => {
          const angularAcceleration =
            (-gravity / p.length) * Math.sin(p.angle);
          let newVelocity = (p.angularVelocity + angularAcceleration) * damping;
          let newAngle = p.angle + newVelocity;

          const bobX = p.x + p.length * Math.sin(newAngle);
          const bobY = p.y + p.length * Math.cos(newAngle);

          // Check barrier collisions
          barriers.forEach((barrier) => {
            if (
              Math.abs(bobY - barrier.y) < p.weight / 2 &&
              animationTime - barrier.lastTriggered > 100
            ) {
              playNote(barrier.frequency, barrier.note);
              barrier.lastTriggered = animationTime;
            }
          });

          // Draw pendulum string
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(bobX, bobY);
          ctx.stroke();

          // Draw pivot
          ctx.fillStyle = "#666";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw bob with glow
          const gradient = ctx.createRadialGradient(
            bobX,
            bobY,
            0,
            bobX,
            bobY,
            p.weight
          );
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(bobX, bobY, p.weight * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(bobX, bobY, p.weight / 2, 0, Math.PI * 2);
          ctx.fill();

          return {
            ...p,
            angle: newAngle,
            angularVelocity: newVelocity,
          };
        })
      );

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, barriers, gravity, damping, playNote]);

  const clearAll = () => {
    setPendulums([]);
    setBarriers([]);
  };

  const addRandomPendulum = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newPendulum: Pendulum = {
      id: Date.now(),
      x: 100 + Math.random() * (canvas.width - 200),
      y: 50,
      length: 100 + Math.random() * 200,
      weight: 10 + Math.random() * 20,
      angle: (Math.random() - 0.5) * Math.PI * 0.8,
      angularVelocity: 0,
      color: COLORS[pendulums.length % COLORS.length],
    };
    setPendulums((prev) => [...prev, newPendulum]);
  };

  return (
    <FeatureWrapper day={363} title="Gravity Pendulum Orchestra" emoji="🎵">
      <div className="flex flex-col items-center gap-6 p-4">
        <p
          className="text-center max-w-xl"
          style={{ color: "var(--color-text-dim)" }}
        >
          Create your own chaotic symphony! Click to place pendulums, then add
          sound barriers that play notes when pendulums swing through them.
          Physics meets music in beautiful unpredictability.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setMode("pendulum")}
            className={`px-4 py-2 rounded-lg transition-all ${
              mode === "pendulum"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🎯 Add Pendulum
          </button>
          <button
            onClick={() => setMode("barrier")}
            className={`px-4 py-2 rounded-lg transition-all ${
              mode === "barrier"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🎼 Add Sound Barrier
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all"
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button
            onClick={addRandomPendulum}
            className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition-all"
          >
            🎲 Random
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-all"
          >
            🗑️ Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-6 justify-center items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Gravity:
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={gravity}
              onChange={(e) => setGravity(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Damping:
            </label>
            <input
              type="range"
              min="0.99"
              max="1"
              step="0.001"
              value={damping}
              onChange={(e) => setDamping(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>

        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            border: "2px solid var(--color-border)",
            boxShadow: "0 0 30px rgba(128, 0, 255, 0.2)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
            style={{ background: "linear-gradient(to bottom, #0a0a14, #1a1a2e)" }}
          />

          {pendulums.length === 0 && barriers.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ color: "var(--color-text-dim)" }}
            >
              <div className="text-center">
                <p className="text-xl mb-2">🎵 Click to add pendulums!</p>
                <p className="text-sm">
                  Switch to barrier mode to add sound triggers
                </p>
              </div>
            </div>
          )}
        </div>

        {activeNotes.size > 0 && (
          <div className="flex gap-2">
            {Array.from(activeNotes).map((note) => (
              <span
                key={note}
                className="px-3 py-1 rounded-full text-white text-sm animate-pulse"
                style={{
                  backgroundColor: COLORS[NOTES.findIndex((n) => n.name === note) % COLORS.length],
                }}
              >
                {note}
              </span>
            ))}
          </div>
        )}

        <div
          className="flex gap-8 text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <div>
            Pendulums: <span className="text-purple-400">{pendulums.length}</span>
          </div>
          <div>
            Barriers: <span className="text-green-400">{barriers.length}</span>
          </div>
        </div>

        <p
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Pro tip: Place multiple pendulums at different heights and add
          barriers at musical intervals for polyrhythmic magic!
        </p>
      </div>
    </FeatureWrapper>
  );
}