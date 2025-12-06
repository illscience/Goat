"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pulse {
  x: number;
  y: number;
  birthTime: number;
  interval: number;
  maxRadius: number;
  color: string;
  opacity: number;
}

function getColorFromInterval(interval: number): string {
  // Fast clicks (< 200ms) = hot colors (red/orange)
  // Medium clicks (200-500ms) = warm colors (yellow/green)
  // Slow clicks (> 500ms) = cool colors (blue/purple)
  
  if (interval < 150) {
    return `hsl(0, 90%, 60%)`; // Red - frantic
  } else if (interval < 250) {
    return `hsl(25, 95%, 55%)`; // Orange - excited
  } else if (interval < 400) {
    return `hsl(45, 100%, 50%)`; // Yellow - energetic
  } else if (interval < 600) {
    return `hsl(120, 70%, 45%)`; // Green - calm
  } else if (interval < 900) {
    return `hsl(200, 80%, 50%)`; // Blue - relaxed
  } else if (interval < 1500) {
    return `hsl(260, 75%, 55%)`; // Purple - meditative
  } else {
    return `hsl(300, 60%, 45%)`; // Magenta - zen
  }
}

export default function PixelHeartbeat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulsesRef = useRef<Pulse[]>([]);
  const lastClickRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const [clickCount, setClickCount] = useState(0);
  const [lastInterval, setLastInterval] = useState<number | null>(null);
  const [mood, setMood] = useState("waiting for your heartbeat...");

  const getMoodText = (interval: number): string => {
    if (interval < 150) return "⚡ racing heart!";
    if (interval < 250) return "🔥 feeling excited!";
    if (interval < 400) return "✨ energetic vibes";
    if (interval < 600) return "🌿 nice and steady";
    if (interval < 900) return "🌊 calm waves";
    if (interval < 1500) return "🧘 deep breaths";
    return "🌙 zen master mode";
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const now = Date.now();
    const interval = lastClickRef.current ? now - lastClickRef.current : 500;
    lastClickRef.current = now;

    const color = getColorFromInterval(interval);
    const maxRadius = Math.max(20, Math.min(80, 150 - interval / 10));

    const newPulse: Pulse = {
      x,
      y,
      birthTime: now,
      interval,
      maxRadius,
      color,
      opacity: 1,
    };

    pulsesRef.current.push(newPulse);
    setClickCount(prev => prev + 1);
    setLastInterval(interval);
    setMood(getMoodText(interval));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const now = Date.now();
      
      // Fade the canvas slightly for trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw pulses
      pulsesRef.current = pulsesRef.current.filter(pulse => {
        const age = now - pulse.birthTime;
        const lifespan = pulse.interval * 8; // Longer interval = longer lifespan
        
        if (age > lifespan) return false;

        // Pulsing effect based on original interval
        const pulsePhase = (age / pulse.interval) * Math.PI * 2;
        const pulseFactor = 0.5 + 0.5 * Math.sin(pulsePhase);
        
        const progress = age / lifespan;
        const currentRadius = pulse.maxRadius * (0.3 + 0.7 * pulseFactor) * (1 - progress * 0.5);
        const opacity = (1 - progress) * pulseFactor;

        // Draw glow
        const gradient = ctx.createRadialGradient(
          pulse.x, pulse.y, 0,
          pulse.x, pulse.y, currentRadius
        );
        gradient.addColorStop(0, pulse.color.replace(")", `, ${opacity})`).replace("hsl", "hsla"));
        gradient.addColorStop(0.5, pulse.color.replace(")", `, ${opacity * 0.5})`).replace("hsl", "hsla"));
        gradient.addColorStop(1, pulse.color.replace(")", `, 0)`).replace("hsl", "hsla"));

        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core pixel
        const coreSize = 4 + 4 * pulseFactor;
        ctx.fillStyle = pulse.color.replace(")", `, ${opacity})`).replace("hsl", "hsla");
        ctx.fillRect(
          pulse.x - coreSize / 2,
          pulse.y - coreSize / 2,
          coreSize,
          coreSize
        );

        return true;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pulsesRef.current = [];
    setClickCount(0);
    setLastInterval(null);
    setMood("waiting for your heartbeat...");
    lastClickRef.current = 0;
  };

  return (
    <FeatureWrapper day={371} title="Pixel Heartbeat" emoji="💓">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <p 
            className="text-lg"
            style={{ color: "var(--color-text-dim)" }}
          >
            Click anywhere on the canvas at your own rhythm. Fast, slow, irregular—
            <br />each beat creates a pulsing pixel that matches your tempo.
          </p>
          <p 
            className="text-2xl font-medium transition-all duration-300"
            style={{ 
              fontFamily: "var(--font-serif)",
              color: lastInterval ? getColorFromInterval(lastInterval) : "var(--color-text)"
            }}
          >
            {mood}
          </p>
        </div>

        <div 
          className="rounded-xl overflow-hidden shadow-2xl border-2 cursor-pointer"
          style={{ borderColor: "var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={700}
            height={450}
            onClick={handleCanvasClick}
            className="block"
            style={{ 
              background: "#000",
              touchAction: "none"
            }}
          />
        </div>

        <div className="flex items-center gap-8">
          <div 
            className="text-center px-4 py-2 rounded-lg"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>Beats</p>
            <p 
              className="text-2xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {clickCount}
            </p>
          </div>

          {lastInterval && (
            <div 
              className="text-center px-4 py-2 rounded-lg"
              style={{ background: "var(--color-bg-secondary)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>Last Interval</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: getColorFromInterval(lastInterval) }}
              >
                {lastInterval}ms
              </p>
            </div>
          )}

          <button
            onClick={clearCanvas}
            className="btn-secondary px-6 py-2 rounded-lg transition-all hover:scale-105"
          >
            Clear Canvas
          </button>
        </div>

        <div 
          className="flex flex-wrap justify-center gap-2 text-xs"
          style={{ color: "var(--color-text-dim)" }}
        >
          <span className="px-2 py-1 rounded" style={{ background: "hsl(0, 90%, 60%)", color: "white" }}>
            &lt;150ms Racing
          </span>
          <span className="px-2 py-1 rounded" style={{ background: "hsl(25, 95%, 55%)", color: "white" }}>
            150-250ms Excited
          </span>
          <span className="px-2 py-1 rounded" style={{ background: "hsl(45, 100%, 50%)", color: "black" }}>
            250-400ms Energetic
          </span>
          <span className="px-2 py-1 rounded" style={{ background: "hsl(120, 70%, 45%)", color: "white" }}>
            400-600ms Calm
          </span>
          <span className="px-2 py-1 rounded" style={{ background: "hsl(200, 80%, 50%)", color: "white" }}>
            600-900ms Relaxed
          </span>
          <span className="px-2 py-1 rounded" style={{ background: "hsl(260, 75%, 55%)", color: "white" }}>
            900-1500ms Meditative
          </span>
          <span className="px-2 py-1 rounded" style={{ background: "hsl(300, 60%, 45%)", color: "white" }}>
            &gt;1500ms Zen
          </span>
        </div>
      </div>
    </FeatureWrapper>
  );
}