"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface ClickData {
  timestamp: number;
  x: number;
  y: number;
}

interface MoodState {
  intensity: number; // 0-1, based on click frequency
  chaos: number; // 0-1, based on click position variance
  rhythm: number; // 0-1, based on timing regularity
  hue: number; // 0-360
  saturation: number;
  lightness: number;
}

export default function PixelMoodRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const clickHistoryRef = useRef<ClickData[]>([]);
  const [mood, setMood] = useState<MoodState>({
    intensity: 0,
    chaos: 0,
    rhythm: 0.5,
    hue: 200,
    saturation: 50,
    lightness: 50,
  });
  const [moodLabel, setMoodLabel] = useState<string>("Calm & Centered");
  const [clickCount, setClickCount] = useState<number>(0);

  const calculateMood = useCallback((clicks: ClickData[]): MoodState => {
    if (clicks.length < 2) {
      return {
        intensity: 0,
        chaos: 0,
        rhythm: 0.5,
        hue: 200,
        saturation: 50,
        lightness: 50,
      };
    }

    // Calculate intensity based on click frequency (clicks per second)
    const timeSpan = clicks[clicks.length - 1].timestamp - clicks[0].timestamp;
    const clicksPerSecond = timeSpan > 0 ? (clicks.length / timeSpan) * 1000 : 0;
    const intensity = Math.min(1, clicksPerSecond / 5);

    // Calculate chaos based on position variance
    const avgX = clicks.reduce((sum, c) => sum + c.x, 0) / clicks.length;
    const avgY = clicks.reduce((sum, c) => sum + c.y, 0) / clicks.length;
    const variance = clicks.reduce((sum, c) => {
      return sum + Math.sqrt(Math.pow(c.x - avgX, 2) + Math.pow(c.y - avgY, 2));
    }, 0) / clicks.length;
    const chaos = Math.min(1, variance / 200);

    // Calculate rhythm based on timing regularity
    const intervals: number[] = [];
    for (let i = 1; i < clicks.length; i++) {
      intervals.push(clicks[i].timestamp - clicks[i - 1].timestamp);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, i) => sum + Math.abs(i - avgInterval), 0) / intervals.length;
    const rhythm = 1 - Math.min(1, intervalVariance / 500);

    // Derive colors from mood metrics
    // High intensity + high chaos = hot reds/oranges (hue 0-60)
    // Low intensity + high rhythm = cool blues (hue 180-240)
    // Balanced = purples/greens (hue 90-180 or 270-330)
    
    let hue: number;
    if (intensity > 0.6 && chaos > 0.5) {
      hue = 0 + (1 - intensity) * 60; // Reds to oranges
    } else if (intensity < 0.4 && rhythm > 0.6) {
      hue = 180 + rhythm * 60; // Cool blues
    } else if (chaos > 0.7) {
      hue = 300 + chaos * 60; // Magentas/pinks
    } else {
      hue = 120 + (rhythm - chaos) * 60; // Greens to cyans
    }

    const saturation = 40 + intensity * 50 + chaos * 10;
    const lightness = 40 + (1 - intensity) * 20;

    return { intensity, chaos, rhythm, hue, saturation, lightness };
  }, []);

  const getMoodLabel = useCallback((m: MoodState): string => {
    if (m.intensity > 0.7 && m.chaos > 0.6) return "⚡ Electric Frenzy";
    if (m.intensity > 0.7 && m.rhythm > 0.7) return "🔥 Intense Focus";
    if (m.intensity > 0.5 && m.chaos > 0.5) return "🌪️ Turbulent Energy";
    if (m.intensity > 0.5) return "💫 Active Flow";
    if (m.rhythm > 0.7) return "🎵 Rhythmic Harmony";
    if (m.chaos > 0.5) return "🌊 Playful Chaos";
    if (m.intensity < 0.2) return "🧘 Zen Stillness";
    return "🌿 Calm & Centered";
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    const newClick: ClickData = { timestamp: now, x, y };
    
    // Keep only clicks from the last 3 seconds
    const recentClicks = [...clickHistoryRef.current, newClick].filter(
      c => now - c.timestamp < 3000
    );
    clickHistoryRef.current = recentClicks;

    const newMood = calculateMood(recentClicks);
    setMood(newMood);
    setMoodLabel(getMoodLabel(newMood));
    setClickCount(prev => prev + 1);
  }, [calculateMood, getMoodLabel]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.02;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.35;

      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Draw mood ring
      const ringWidth = 30 + mood.intensity * 40;
      const numSegments = 60;
      const segmentAngle = (Math.PI * 2) / numSegments;

      for (let i = 0; i < numSegments; i++) {
        const angle = i * segmentAngle + time * (0.5 + mood.intensity);
        
        // Add waviness based on chaos
        const waveOffset = Math.sin(angle * 3 + time * 2) * mood.chaos * 20;
        const currentRadius = baseRadius + waveOffset;

        // Color variation based on segment and mood
        const hueOffset = Math.sin(angle * 2 + time) * 30 * mood.chaos;
        const segmentHue = (mood.hue + hueOffset + i * 2) % 360;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, angle, angle + segmentAngle + 0.1);
        ctx.arc(centerX, centerY, currentRadius - ringWidth, angle + segmentAngle + 0.1, angle, true);
        ctx.closePath();

        // Create gradient for each segment
        const gradient = ctx.createRadialGradient(
          centerX, centerY, currentRadius - ringWidth,
          centerX, centerY, currentRadius
        );
        gradient.addColorStop(0, `hsla(${segmentHue}, ${mood.saturation}%, ${mood.lightness + 20}%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${segmentHue}, ${mood.saturation}%, ${mood.lightness}%, 1)`);
        gradient.addColorStop(1, `hsla(${segmentHue}, ${mood.saturation}%, ${mood.lightness - 10}%, 0.9)`);

        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Inner glow
      const innerGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius - ringWidth
      );
      innerGlow.addColorStop(0, `hsla(${mood.hue}, ${mood.saturation}%, ${mood.lightness + 30}%, ${0.3 + mood.intensity * 0.3})`);
      innerGlow.addColorStop(0.7, `hsla(${mood.hue}, ${mood.saturation}%, ${mood.lightness}%, 0.1)`);
      innerGlow.addColorStop(1, "transparent");
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - ringWidth, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      // Outer particles for high intensity
      if (mood.intensity > 0.3) {
        const particleCount = Math.floor(mood.intensity * 20);
        for (let i = 0; i < particleCount; i++) {
          const particleAngle = (i / particleCount) * Math.PI * 2 + time * 2;
          const particleDistance = baseRadius + 30 + Math.sin(time * 3 + i) * 20 * mood.chaos;
          const px = centerX + Math.cos(particleAngle) * particleDistance;
          const py = centerY + Math.sin(particleAngle) * particleDistance;
          
          ctx.beginPath();
          ctx.arc(px, py, 2 + mood.intensity * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${(mood.hue + i * 10) % 360}, ${mood.saturation}%, ${mood.lightness + 20}%, ${0.5 + mood.intensity * 0.5})`;
          ctx.fill();
        }
      }

      // Jagged edges for high chaos
      if (mood.chaos > 0.4) {
        ctx.strokeStyle = `hsla(${mood.hue + 30}, ${mood.saturation}%, ${mood.lightness + 10}%, ${mood.chaos * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= numSegments; i++) {
          const angle = (i / numSegments) * Math.PI * 2;
          const jag = Math.random() * mood.chaos * 30;
          const r = baseRadius + 10 + jag;
          const px = centerX + Math.cos(angle + time) * r;
          const py = centerY + Math.sin(angle + time) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [mood]);

  // Decay mood over time
  useEffect(() => {
    const decayInterval = setInterval(() => {
      const now = Date.now();
      const recentClicks = clickHistoryRef.current.filter(
        c => now - c.timestamp < 3000
      );
      clickHistoryRef.current = recentClicks;
      
      if (recentClicks.length < 2) {
        setMood(prev => ({
          ...prev,
          intensity: prev.intensity * 0.95,
          chaos: prev.chaos * 0.95,
          hue: prev.hue + (200 - prev.hue) * 0.05,
          saturation: prev.saturation + (50 - prev.saturation) * 0.05,
          lightness: prev.lightness + (50 - prev.lightness) * 0.05,
        }));
      }
    }, 100);

    return () => clearInterval(decayInterval);
  }, []);

  return (
    <FeatureWrapper day={448} title="Pixel Mood Ring" emoji="💫">
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <p 
            className="text-lg"
            style={{ color: "var(--color-text-dim)" }}
          >
            Click anywhere on the ring to reveal your energy
          </p>
          <p 
            className="text-sm"
            style={{ color: "var(--color-text-dim)" }}
          >
            Fast clicks = intense reds • Slow clicks = calm blues • Scattered clicks = chaotic patterns
          </p>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            onClick={handleClick}
            className="cursor-pointer rounded-full"
            style={{ 
              backgroundColor: "#0a0a0a",
              boxShadow: `0 0 60px hsla(${mood.hue}, ${mood.saturation}%, ${mood.lightness}%, 0.3)`
            }}
          />
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <p 
                className="text-2xl font-bold mb-1"
                style={{ 
                  color: `hsl(${mood.hue}, ${mood.saturation}%, ${Math.min(80, mood.lightness + 20)}%)`,
                  fontFamily: "var(--font-serif)",
                  textShadow: `0 0 20px hsla(${mood.hue}, ${mood.saturation}%, ${mood.lightness}%, 0.5)`
                }}
              >
                {moodLabel}
              </p>
            </div>
          </div>
        </div>

        <div 
          className="grid grid-cols-3 gap-4 text-center w-full max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <p className="text-xs uppercase tracking-wide mb-1">Intensity</p>
            <p className="text-xl font-bold" style={{ color: `hsl(${Math.max(0, 60 - mood.intensity * 60)}, 80%, 60%)` }}>
              {Math.round(mood.intensity * 100)}%
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <p className="text-xs uppercase tracking-wide mb-1">Chaos</p>
            <p className="text-xl font-bold" style={{ color: `hsl(${300 - mood.chaos * 60}, 80%, 60%)` }}>
              {Math.round(mood.chaos * 100)}%
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <p className="text-xs uppercase tracking-wide mb-1">Rhythm</p>
            <p className="text-xl font-bold" style={{ color: `hsl(${180 + mood.rhythm * 40}, 80%, 60%)` }}>
              {Math.round(mood.rhythm * 100)}%
            </p>
          </div>
        </div>

        <p 
          className="text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Total clicks: {clickCount} ✨
        </p>
      </div>
    </FeatureWrapper>
  );
}