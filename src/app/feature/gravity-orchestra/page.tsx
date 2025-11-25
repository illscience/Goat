"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface GravityWell {
  id: number;
  x: number;
  y: number;
  mass: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number }[];
}

const NOTES = [
  { freq: 261.63, name: "C4" },
  { freq: 293.66, name: "D4" },
  { freq: 329.63, name: "E4" },
  { freq: 349.23, name: "F4" },
  { freq: 392.00, name: "G4" },
  { freq: 440.00, name: "A4" },
  { freq: 493.88, name: "B4" },
  { freq: 523.25, name: "C5" },
  { freq: 587.33, name: "D5" },
  { freq: 659.25, name: "E5" },
];

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3"];

export default function GravityOrchestra() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const [wells, setWells] = useState<GravityWell[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMode, setCurrentMode] = useState<"well" | "particle">("well");
  const [wellSize, setWellSize] = useState(50);
  const particleOscillatorsRef = useRef<Map<number, OscillatorNode>>(new Map());

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particleOscillatorsRef.current.forEach(osc => osc.disconnect());
    };
  }, []);

  const playNote = useCallback((particle: Particle, wells: GravityWell[]) => {
    if (!audioContextRef.current || !isPlaying) return;

    const nearestWell = wells.reduce((nearest, well) => {
      const dist = Math.sqrt(Math.pow(particle.x - well.x, 2) + Math.pow(particle.y - well.y, 2));
      const nearestDist = Math.sqrt(Math.pow(particle.x - nearest.x, 2) + Math.pow(particle.y - nearest.y, 2));
      return dist < nearestDist ? well : nearest;
    }, wells[0]);

    if (!nearestWell) return;

    const distance = Math.sqrt(Math.pow(particle.x - nearestWell.x, 2) + Math.pow(particle.y - nearestWell.y, 2));
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    
    const noteIndex = Math.floor((distance / 300) * NOTES.length) % NOTES.length;
    const frequency = NOTES[noteIndex].freq;
    const volume = Math.max(0.1, Math.min(0.5, speed / 10));

    let oscillator = particleOscillatorsRef.current.get(particle.id);
    
    if (!oscillator) {
      oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.type = "sine";
      oscillator.start();
      particleOscillatorsRef.current.set(particle.id, oscillator);
      gainNode.gain.value = 0;
    }

    const gainNode = oscillator.context.createGain();
    oscillator.disconnect();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
  }, [isPlaying]);

  const updatePhysics = useCallback(() => {
    setParticles(prevParticles => {
      return prevParticles.map(particle => {
        let ax = 0;
        let ay = 0;

        wells.forEach(well => {
          const dx = well.x - particle.x;
          const dy = well.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5) {
            const force = (well.mass * 0.5) / (distance * distance);
            ax += (dx / distance) * force;
            ay += (dy / distance) * force;
          }
        });

        const newVx = particle.vx + ax;
        const newVy = particle.vy + ay;
        const newX = particle.x + newVx;
        const newY = particle.y + newVy;

        const newTrail = [...particle.trail, { x: particle.x, y: particle.y }].slice(-20);

        return {
          ...particle,
          x: newX,
          y: newY,
          vx: newVx * 0.995,
          vy: newVy * 0.995,
          trail: newTrail
        };
      }).filter(particle => {
        const canvas = canvasRef.current;
        if (!canvas) return true;
        return particle.x > -50 && particle.x < canvas.width + 50 && 
               particle.y > -50 && particle.y < canvas.height + 50;
      });
    });
  }, [wells]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw gravity wells
    wells.forEach(well => {
      const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, well.mass);
      gradient.addColorStop(0, well.color + "40");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(well.x - well.mass, well.y - well.mass, well.mass * 2, well.mass * 2);

      ctx.beginPath();
      ctx.arc(well.x, well.y, well.mass / 4, 0, Math.PI * 2);
      ctx.fillStyle = well.color;
      ctx.fill();
    });

    // Draw particles with trails
    particles.forEach(particle => {
      // Draw trail
      ctx.beginPath();
      particle.trail.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.strokeStyle = particle.color + "40";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();

      // Play sound for each particle
      if (wells.length > 0) {
        playNote(particle, wells);
      }
    });

    updatePhysics();
    animationRef.current = requestAnimationFrame(animate);
  }, [wells, particles, updatePhysics, playNote]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particleOscillatorsRef.current.forEach(osc => osc.disconnect());
      particleOscillatorsRef.current.clear();
    }
  }, [isPlaying, animate]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentMode === "well") {
      const newWell: GravityWell = {
        id: Date.now(),
        x,
        y,
        mass: wellSize,
        color: COLORS[wells.length % COLORS.length]
      };
      setWells([...wells, newWell]);
    } else {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      const newParticle: Particle = {
        id: Date.now(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        trail: []
      };
      setParticles([...particles, newParticle]);
    }
  };

  const clearAll = () => {
    setWells([]);
    setParticles([]);
    particleOscillatorsRef.current.forEach(osc => osc.disconnect());
    particleOscillatorsRef.current.clear();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <FeatureWrapper day={360} title="Gravity Orchestra" emoji="🎵">
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Compose with Cosmic Forces
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Click to place gravity wells, drop musical particles, and watch as orbital mechanics 
            become a symphony. Each particle sings based on its speed and distance from gravity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMode("well")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentMode === "well" 
                  ? "bg-purple-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              Place Gravity Well
            </button>
            <button
              onClick={() => setCurrentMode("particle")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentMode === "particle" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              Drop Particle
            </button>
          </div>

          {currentMode === "well" && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Size:</label>
              <input
                type="range"
                min="20"
                max="100"
                value={wellSize}
                onChange={(e) => setWellSize(Number(e.target.value))}
                className="w-32"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isPlaying ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-[600px] bg-black rounded-lg cursor-crosshair"
            style={{ imageRendering: "pixelated" }}
          />
          
          <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
            <p>Wells: {wells.length} | Particles: {particles.length}</p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Tip: Create multiple gravity wells to see complex orbital patterns emerge. 
          The music evolves as particles dance through space!
        </div>
      </div>
    </FeatureWrapper>
  );
}