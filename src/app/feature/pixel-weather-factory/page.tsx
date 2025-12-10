"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: "rain" | "snow" | "leaf" | "sun";
  opacity: number;
  rotation?: number;
}

interface WeatherState {
  rain: number;
  snow: number;
  wind: number;
  sun: number;
}

const PIXEL_SIZE = 4;

export default function PixelWeatherFactory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [weather, setWeather] = useState<WeatherState>({
    rain: 0,
    snow: 0,
    wind: 0,
    sun: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const playSound = useCallback((type: "rain" | "snow" | "wind" | "sun") => {
    if (typeof window === "undefined") return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    switch (type) {
      case "rain":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        break;
      case "snow":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        break;
      case "wind":
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(100 + Math.random() * 50, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        break;
      case "sun":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        break;
    }
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const spawnParticles = useCallback((type: "rain" | "snow" | "leaf" | "sun", count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        x: Math.random() * canvas.width,
        y: type === "sun" ? canvas.height * 0.3 + Math.random() * 50 : -10,
        vx: type === "leaf" ? (Math.random() - 0.5) * 3 : 0,
        vy: type === "rain" ? 8 + Math.random() * 4 : type === "snow" ? 1 + Math.random() * 2 : type === "leaf" ? 2 : 0,
        size: type === "rain" ? 2 : type === "snow" ? 3 : type === "leaf" ? 4 : 6,
        type,
        opacity: 1,
        rotation: Math.random() * Math.PI * 2,
      };
      particlesRef.current.push(particle);
    }
  }, []);

  const toggleWeather = useCallback((type: keyof WeatherState) => {
    setWeather(prev => {
      const newValue = prev[type] > 0 ? 0 : 100;
      if (newValue > 0) {
        playSound(type as "rain" | "snow" | "wind" | "sun");
      }
      return { ...prev, [type]: newValue };
    });
    setIsPlaying(true);
  }, [playSound]);

  const adjustWeather = useCallback((type: keyof WeatherState, delta: number) => {
    setWeather(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(100, prev[type] + delta))
    }));
    if (delta > 0) {
      playSound(type as "rain" | "snow" | "wind" | "sun");
    }
    setIsPlaying(true);
  }, [playSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE,
        Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    };

    const getSkyColor = () => {
      const sunIntensity = weather.sun / 100;
      const stormIntensity = Math.min(1, (weather.rain + weather.snow) / 150);
      
      if (stormIntensity > 0.5) {
        const gray = Math.floor(60 + (1 - stormIntensity) * 100);
        return `rgb(${gray}, ${gray + 10}, ${gray + 20})`;
      }
      
      const r = Math.floor(100 + sunIntensity * 155);
      const g = Math.floor(150 + sunIntensity * 105);
      const b = Math.floor(200 + sunIntensity * 55);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const drawLandscape = () => {
      // Sky gradient
      const skyColor = getSkyColor();
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
      
      // Sun
      if (weather.sun > 0) {
        const sunX = canvas.width * 0.8;
        const sunY = canvas.height * 0.15;
        const sunSize = 20 + (weather.sun / 100) * 15;
        
        // Sun glow
        for (let i = 3; i >= 0; i--) {
          const glowColor = `rgba(255, 220, 100, ${0.1 * (weather.sun / 100)})`;
          for (let px = -sunSize - i * 8; px < sunSize + i * 8; px += PIXEL_SIZE) {
            for (let py = -sunSize - i * 8; py < sunSize + i * 8; py += PIXEL_SIZE) {
              if (Math.sqrt(px * px + py * py) < sunSize + i * 8) {
                drawPixel(sunX + px, sunY + py, glowColor);
              }
            }
          }
        }
        
        // Sun core
        const sunCoreColor = "#FFD700";
        for (let px = -sunSize; px < sunSize; px += PIXEL_SIZE) {
          for (let py = -sunSize; py < sunSize; py += PIXEL_SIZE) {
            if (Math.sqrt(px * px + py * py) < sunSize) {
              drawPixel(sunX + px, sunY + py, sunCoreColor);
            }
          }
        }
      }
      
      // Clouds
      const cloudY = canvas.height * 0.2;
      const cloudColors = weather.rain > 50 || weather.snow > 50 ? ["#555", "#666", "#777"] : ["#fff", "#eee", "#ddd"];
      
      for (let c = 0; c < 3; c++) {
        const cloudX = 50 + c * 120 + (weather.wind / 100) * 20 * Math.sin(Date.now() / 1000 + c);
        const cloudColor = cloudColors[c % cloudColors.length];
        
        // Pixel cloud shape
        const cloudShape = [
          [0, 0], [1, 0], [2, 0], [3, 0],
          [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
          [0, 2], [1, 2], [2, 2], [3, 2],
        ];
        
        cloudShape.forEach(([ox, oy]) => {
          drawPixel(cloudX + (ox ?? 0) * PIXEL_SIZE * 3, cloudY + (oy ?? 0) * PIXEL_SIZE * 3, cloudColor);
        });
      }
      
      // Mountains
      ctx.fillStyle = "#4a5568";
      const mountainPoints: [number, number][] = [
        [0, canvas.height * 0.7],
        [canvas.width * 0.15, canvas.height * 0.45],
        [canvas.width * 0.3, canvas.height * 0.7],
        [canvas.width * 0.4, canvas.height * 0.5],
        [canvas.width * 0.55, canvas.height * 0.7],
        [canvas.width * 0.7, canvas.height * 0.4],
        [canvas.width * 0.85, canvas.height * 0.7],
        [canvas.width, canvas.height * 0.55],
        [canvas.width, canvas.height * 0.7],
      ];
      
      ctx.beginPath();
      ctx.moveTo(mountainPoints[0][0], mountainPoints[0][1]);
      mountainPoints.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.fill();
      
      // Snow caps if cold
      if (weather.snow > 30) {
        const snowColor = "#fff";
        drawPixel(canvas.width * 0.15, canvas.height * 0.45, snowColor);
        drawPixel(canvas.width * 0.15 - PIXEL_SIZE, canvas.height * 0.45 + PIXEL_SIZE, snowColor);
        drawPixel(canvas.width * 0.15 + PIXEL_SIZE, canvas.height * 0.45 + PIXEL_SIZE, snowColor);
        
        drawPixel(canvas.width * 0.7, canvas.height * 0.4, snowColor);
        drawPixel(canvas.width * 0.7 - PIXEL_SIZE, canvas.height * 0.4 + PIXEL_SIZE, snowColor);
        drawPixel(canvas.width * 0.7 + PIXEL_SIZE, canvas.height * 0.4 + PIXEL_SIZE, snowColor);
      }
      
      // Ground
      ctx.fillStyle = weather.snow > 50 ? "#e8e8e8" : "#2d5a27";
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
      
      // Grass pixels (if not snowy)
      if (weather.snow < 50) {
        for (let x = 0; x < canvas.width; x += PIXEL_SIZE * 3) {
          const grassHeight = 2 + Math.floor(Math.random() * 3);
          for (let h = 0; h < grassHeight; h++) {
            const windOffset = weather.wind > 0 ? Math.sin(Date.now() / 200 + x / 20) * (weather.wind / 50) : 0;
            drawPixel(x + windOffset, canvas.height * 0.7 - h * PIXEL_SIZE, "#3d7a37");
          }
        }
      }
      
      // Factory building
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(canvas.width * 0.05, canvas.height * 0.5, 80, canvas.height * 0.2);
      
      // Factory chimney with smoke
      ctx.fillStyle = "#654321";
      ctx.fillRect(canvas.width * 0.08, canvas.height * 0.4, 20, canvas.height * 0.1);
      
      // Windows
      const windowColor = "#ffeb3b";
      drawPixel(canvas.width * 0.07, canvas.height * 0.55, windowColor);
      drawPixel(canvas.width * 0.12, canvas.height * 0.55, windowColor);
      drawPixel(canvas.width * 0.07, canvas.height * 0.62, windowColor);
      drawPixel(canvas.width * 0.12, canvas.height * 0.62, windowColor);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawLandscape();
      
      // Spawn particles based on weather
      if (weather.rain > 0 && Math.random() < weather.rain / 50) {
        spawnParticles("rain", Math.ceil(weather.rain / 20));
      }
      if (weather.snow > 0 && Math.random() < weather.snow / 80) {
        spawnParticles("snow", Math.ceil(weather.snow / 30));
      }
      if (weather.wind > 0 && Math.random() < weather.wind / 200) {
        spawnParticles("leaf", 1);
      }
      if (weather.sun > 50 && Math.random() < 0.02) {
        spawnParticles("sun", 1);
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        // Apply wind
        p.vx += (weather.wind / 100) * 0.2;
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.rotation !== undefined) {
          p.rotation += 0.05;
        }
        
        // Draw particle
        switch (p.type) {
          case "rain":
            drawPixel(p.x, p.y, `rgba(100, 150, 255, ${p.opacity})`);
            drawPixel(p.x, p.y + PIXEL_SIZE, `rgba(100, 150, 255, ${p.opacity})`);
            break;
          case "snow":
            drawPixel(p.x, p.y, `rgba(255, 255, 255, ${p.opacity})`);
            break;
          case "leaf":
            drawPixel(p.x, p.y, `rgba(139, 69, 19, ${p.opacity})`);
            break;
          case "sun":
            drawPixel(p.x, p.y, `rgba(255, 215, 0, ${p.opacity * 0.5})`);
            p.opacity -= 0.02;
            break;
        }
        
        // Remove particles that are off screen or faded
        return p.y < canvas.height && p.x > -20 && p.x < canvas.width + 20 && p.opacity > 0;
      });
      
      // Lightning effect for storms
      if (weather.rain > 70 && Math.random() < 0.005) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      frameRef.current = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animate();
    } else {
      drawLandscape();
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [weather, isPlaying, spawnParticles]);

  const getWeatherDescription = () => {
    const conditions: string[] = [];
    if (weather.sun > 50) conditions.push("☀️ Sunny");
    if (weather.rain > 70) conditions.push("⛈️ Stormy");
    else if (weather.rain > 30) conditions.push("🌧️ Rainy");
    if (weather.snow > 50) conditions.push("❄️ Blizzard");
    else if (weather.snow > 20) conditions.push("🌨️ Snowy");
    if (weather.wind > 50) conditions.push("💨 Windy");
    
    if (conditions.length === 0) return "Clear skies... for now 🌤️";
    if (conditions.length >= 3) return "Absolute chaos! 🌪️";
    return conditions.join(" + ");
  };

  return (
    <FeatureWrapper day={375} title="Pixel Weather Factory" emoji="🏭">
      <div className="flex flex-col items-center gap-6 p-4">
        <p 
          className="text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          You&apos;re the weather god of this tiny pixel world! Mix and match conditions to create perfect days or apocalyptic storms.
        </p>
        
        <div 
          className="rounded-lg overflow-hidden border-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="block"
            style={{ 
              imageRendering: "pixelated",
              background: "var(--color-bg-secondary)"
            }}
          />
        </div>
        
        <div 
          className="text-lg font-bold text-center"
          style={{ color: "var(--color-text)" }}
        >
          {getWeatherDescription()}
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {/* Rain Machine */}
          <div 
            className="p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer"
            style={{ 
              borderColor: weather.rain > 0 ? "#60a5fa" : "var(--color-border)",
              background: weather.rain > 0 ? "rgba(96, 165, 250, 0.1)" : "var(--color-bg-secondary)"
            }}
            onClick={() => toggleWeather("rain")}
          >
            <div className="text-3xl text-center mb-2">🌧️</div>
            <div 
              className="text-center font-bold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Rain Machine
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("rain", -10); }}
              >
                -
              </button>
              <div 
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${weather.rain}%`,
                    background: "#60a5fa"
                  }}
                />
              </div>
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("rain", 10); }}
              >
                +
              </button>
            </div>
          </div>
          
          {/* Snow Generator */}
          <div 
            className="p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer"
            style={{ 
              borderColor: weather.snow > 0 ? "#e0e7ff" : "var(--color-border)",
              background: weather.snow > 0 ? "rgba(224, 231, 255, 0.1)" : "var(--color-bg-secondary)"
            }}
            onClick={() => toggleWeather("snow")}
          >
            <div className="text-3xl text-center mb-2">❄️</div>
            <div 
              className="text-center font-bold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Snow Generator
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("snow", -10); }}
              >
                -
              </button>
              <div 
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${weather.snow}%`,
                    background: "#e0e7ff"
                  }}
                />
              </div>
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("snow", 10); }}
              >
                +
              </button>
            </div>
          </div>
          
          {/* Wind Turbine */}
          <div 
            className="p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer"
            style={{ 
              borderColor: weather.wind > 0 ? "#a3e635" : "var(--color-border)",
              background: weather.wind > 0 ? "rgba(163, 230, 53, 0.1)" : "var(--color-bg-secondary)"
            }}
            onClick={() => toggleWeather("wind")}
          >
            <div className="text-3xl text-center mb-2">💨</div>
            <div 
              className="text-center font-bold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Wind Turbine
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("wind", -10); }}
              >
                -
              </button>
              <div 
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${weather.wind}%`,
                    background: "#a3e635"
                  }}
                />
              </div>
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("wind", 10); }}
              >
                +
              </button>
            </div>
          </div>
          
          {/* Sunshine Lamp */}
          <div 
            className="p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer"
            style={{ 
              borderColor: weather.sun > 0 ? "#fbbf24" : "var(--color-border)",
              background: weather.sun > 0 ? "rgba(251, 191, 36, 0.1)" : "var(--color-bg-secondary)"
            }}
            onClick={() => toggleWeather("sun")}
          >
            <div className="text-3xl text-center mb-2">☀️</div>
            <div 
              className="text-center font-bold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Sunshine Lamp
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("sun", -10); }}
              >
                -
              </button>
              <div 
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${weather.sun}%`,
                    background: "#fbbf24"
                  }}
                />
              </div>
              <button
                className="btn-secondary px-2 py-1 text-sm"
                onClick={(e) => { e.stopPropagation(); adjustWeather("sun", 10); }}
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            className="btn-primary"
            onClick={() => { setWeather({ rain: 100, snow: 0, wind: 80, sun: 0 }); setIsPlaying(true); }}
          >
            🌩️ Storm Mode
          </button>
          <button
            className="btn-secondary"
            onClick={() => { setWeather({ rain: 0, snow: 0, wind: 10, sun: 100 }); setIsPlaying(true); }}
          >
            🌈 Perfect Day
          </button>
          <button
            className="btn-secondary"
            onClick={() => { setWeather({ rain: 0, snow: 0, wind: 0, sun: 0 }); setIsPlaying(false); }}
          >
            🔄 Reset
          </button>
        </div>
        
        <p 
          className="text-xs text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Pro tip: Crank up rain + wind for thunderstorms! Max snow + sun creates a magical winter wonderland. ✨
        </p>
      </div>
    </FeatureWrapper>
  );
}