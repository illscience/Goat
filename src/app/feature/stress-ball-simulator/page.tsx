"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

export default function StressBallSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pressure, setPressure] = useState(0);
  const [totalSquishes, setTotalSquishes] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [ballCenter] = useState<Point>({ x: 250, y: 250 });
  const ballRadius = 120;
  const lastSquishRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(Date.now());
  const particlesRef = useRef<Particle[]>([]);

  const playSquishSound = useCallback((intensity: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(50 + intensity * 30, ctx.currentTime);
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.1 * intensity, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);

    // Add some noise for texture
    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.1 * intensity;
    }
    noise.buffer = noiseBuffer;
    
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.05, ctx.currentTime);
    
    noise.start(ctx.currentTime);
  }, []);

  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 1,
      life: 1
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const distance = Math.sqrt((x - ballCenter.x) ** 2 + (y - ballCenter.y) ** 2);
    
    if (distance < ballRadius) {
      setIsDragging(true);
      setMousePos({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    const distance = Math.sqrt((x - ballCenter.x) ** 2 + (y - ballCenter.y) ** 2);
    const newPressure = Math.min(1, Math.max(0, 1 - distance / ballRadius));
    setPressure(newPressure);
    
    if (newPressure > 0.3 && Date.now() - lastSquishRef.current > 100) {
      playSquishSound(newPressure);
      lastSquishRef.current = Date.now();
      setTotalSquishes(prev => prev + 1);
      
      // Create particles on heavy squish
      if (newPressure > 0.6) {
        const newParticles = Array.from({ length: 5 }, () => createParticle(x, y));
        particlesRef.current = [...particlesRef.current, ...newParticles];
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setPressure(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.beginPath();
      ctx.ellipse(ballCenter.x, ballCenter.y + 10, ballRadius - 10, ballRadius - 20, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Calculate deformation
      const deformX = isDragging ? (mousePos.x - ballCenter.x) * pressure * 0.2 : 0;
      const deformY = isDragging ? (mousePos.y - ballCenter.y) * pressure * 0.2 : 0;
      const squishFactor = 1 - pressure * 0.3;
      
      // Draw stress ball with gradient
      const gradient = ctx.createRadialGradient(
        ballCenter.x + deformX - 30,
        ballCenter.y + deformY - 30,
        0,
        ballCenter.x + deformX,
        ballCenter.y + deformY,
        ballRadius
      );
      
      const hue = 200 + pressure * 60;
      gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
      gradient.addColorStop(0.5, `hsl(${hue}, 70%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.save();
      ctx.translate(ballCenter.x + deformX, ballCenter.y + deformY);
      ctx.scale(1 + pressure * 0.1, squishFactor);
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
      
      // Draw highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 - pressure * 0.2})`;
      ctx.beginPath();
      ctx.save();
      ctx.translate(ballCenter.x + deformX - 30, ballCenter.y + deformY - 30);
      ctx.scale(1 + pressure * 0.05, squishFactor * 0.8);
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1;
        particle.life -= 0.02;
        
        ctx.fillStyle = `rgba(100, 200, 255, ${particle.life})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ballCenter, isDragging, mousePos, pressure]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <FeatureWrapper day={360} title="Stress Ball Simulator" emoji="🟣">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Virtual Stress Relief
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Click and drag to squish. Let the tension melt away.
          </p>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border rounded-lg cursor-grab active:cursor-grabbing"
            style={{ 
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-secondary)"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {isDragging && pressure > 0 && (
            <div 
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
            >
              Pressure: {Math.round(pressure * 100)}%
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
              {totalSquishes}
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Total Squishes
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
              {formatTime(sessionTime)}
            </div>
            <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Session Time
            </div>
          </div>
        </div>

        <div className="text-center max-w-md">
          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            Pro tip: The harder you squeeze, the more satisfying the squelch. 
            Watch for the sparkles!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}