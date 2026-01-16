"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
  eroded: number;
}

interface Wave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  intensity: number;
  speed: number;
}

export default function PixelErosionWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[][]>([]);
  const wavesRef = useRef<Wave[]>([]);
  const frameRef = useRef<number>(0);
  const [clickCount, setClickCount] = useState(0);
  const [totalEroded, setTotalEroded] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const PIXEL_SIZE = 4;
  const WIDTH = 200;
  const HEIGHT = 150;

  const generateColor = useCallback((x: number, y: number): { r: number; g: number; b: number } => {
    const hue = (Math.sin(x * 0.05) * 0.5 + Math.cos(y * 0.05) * 0.5 + 1) * 180;
    const saturation = 70 + Math.sin(x * 0.1 + y * 0.1) * 20;
    const lightness = 50 + Math.cos(x * 0.08 - y * 0.08) * 15;
    
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    return {
      r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
    };
  }, []);

  const initializePixels = useCallback(() => {
    const pixels: Pixel[][] = [];
    for (let y = 0; y < HEIGHT; y++) {
      pixels[y] = [];
      for (let x = 0; x < WIDTH; x++) {
        const color = generateColor(x, y);
        pixels[y][x] = {
          ...color,
          a: 255,
          eroded: 0
        };
      }
    }
    pixelsRef.current = pixels;
    wavesRef.current = [];
    setIsInitialized(true);
    setTotalEroded(0);
    setClickCount(0);
  }, [generateColor]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !pixelsRef.current.length) return;

    const imageData = ctx.createImageData(WIDTH * PIXEL_SIZE, HEIGHT * PIXEL_SIZE);
    const data = imageData.data;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const pixel = pixelsRef.current[y]?.[x];
        if (!pixel) continue;

        const alpha = Math.max(0, 255 - pixel.eroded * 255);
        
        for (let py = 0; py < PIXEL_SIZE; py++) {
          for (let px = 0; px < PIXEL_SIZE; px++) {
            const idx = ((y * PIXEL_SIZE + py) * WIDTH * PIXEL_SIZE + (x * PIXEL_SIZE + px)) * 4;
            data[idx] = pixel.r;
            data[idx + 1] = pixel.g;
            data[idx + 2] = pixel.b;
            data[idx + 3] = alpha;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  const updateWaves = useCallback(() => {
    const waves = wavesRef.current;
    const pixels = pixelsRef.current;
    let erodedThisFrame = 0;

    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i];
      if (!wave) continue;
      
      wave.radius += wave.speed;

      const innerRadius = Math.max(0, wave.radius - 8);
      const outerRadius = wave.radius + 8;

      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const dx = x - wave.x;
          const dy = y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist >= innerRadius && dist <= outerRadius) {
            const pixel = pixels[y]?.[x];
            if (pixel && pixel.eroded < 1) {
              const waveStrength = 1 - Math.abs(dist - wave.radius) / 8;
              const erosionAmount = waveStrength * wave.intensity * 0.15;
              
              const noise = Math.sin(x * 0.3 + y * 0.3 + wave.radius * 0.1) * 0.3 + 0.7;
              pixel.eroded = Math.min(1, pixel.eroded + erosionAmount * noise);
              
              if (pixel.eroded >= 1) {
                erodedThisFrame++;
              }
            }
          }
        }
      }

      if (wave.radius > wave.maxRadius) {
        waves.splice(i, 1);
      }
    }

    if (erodedThisFrame > 0) {
      setTotalEroded(prev => prev + erodedThisFrame);
    }
  }, []);

  const animate = useCallback(() => {
    updateWaves();
    render();
    frameRef.current = requestAnimationFrame(animate);
  }, [updateWaves, render]);

  useEffect(() => {
    initializePixels();
  }, [initializePixels]);

  useEffect(() => {
    if (isInitialized) {
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isInitialized, animate]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = (WIDTH * PIXEL_SIZE) / rect.width;
    const scaleY = (HEIGHT * PIXEL_SIZE) / rect.height;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    const pixelX = Math.floor(canvasX / PIXEL_SIZE);
    const pixelY = Math.floor(canvasY / PIXEL_SIZE);

    const intensity = 0.5 + Math.random() * 0.5;
    const maxRadius = 30 + Math.random() * 40;

    wavesRef.current.push({
      x: pixelX,
      y: pixelY,
      radius: 0,
      maxRadius,
      intensity,
      speed: 0.8 + Math.random() * 0.4
    });

    setClickCount(prev => prev + 1);
  }, []);

  const handleReset = useCallback(() => {
    initializePixels();
  }, [initializePixels]);

  const erosionPercent = Math.round((totalEroded / (WIDTH * HEIGHT)) * 100);

  return (
    <FeatureWrapper day={412} title="Pixel Erosion Waves" emoji="🌊">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-lg">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Command the Tides of Entropy
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click anywhere to unleash waves of erosion. Watch as pixels dissolve 
            into the void, leaving trails of digital decay in their wake. ✨
          </p>
        </div>

        <div 
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{ 
            border: "2px solid var(--color-border)",
            background: "var(--color-bg-secondary)"
          }}
        >
          <canvas
            ref={canvasRef}
            width={WIDTH * PIXEL_SIZE}
            height={HEIGHT * PIXEL_SIZE}
            onClick={handleCanvasClick}
            className="cursor-crosshair block"
            style={{
              width: `${WIDTH * PIXEL_SIZE}px`,
              height: `${HEIGHT * PIXEL_SIZE}px`,
              imageRendering: "pixelated"
            }}
          />
          
          <div 
            className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-mono"
            style={{ 
              background: "rgba(0,0,0,0.7)", 
              color: "var(--color-text)" 
            }}
          >
            🌊 Active Waves: {wavesRef.current?.length || 0}
          </div>
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <div 
              className="text-3xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {clickCount}
            </div>
            <div 
              className="text-sm"
              style={{ color: "var(--color-text-dim)" }}
            >
              Clicks
            </div>
          </div>
          <div>
            <div 
              className="text-3xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {totalEroded.toLocaleString()}
            </div>
            <div 
              className="text-sm"
              style={{ color: "var(--color-text-dim)" }}
            >
              Pixels Eroded
            </div>
          </div>
          <div>
            <div 
              className="text-3xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {erosionPercent}%
            </div>
            <div 
              className="text-sm"
              style={{ color: "var(--color-text-dim)" }}
            >
              Destruction
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${erosionPercent}%`,
                background: `linear-gradient(90deg, var(--color-accent), #ff6b6b)`
              }}
            />
          </div>
          <p 
            className="text-center text-xs mt-1"
            style={{ color: "var(--color-text-dim)" }}
          >
            {erosionPercent < 25 && "The canvas awaits your chaos..."}
            {erosionPercent >= 25 && erosionPercent < 50 && "Beautiful destruction in progress 🎨"}
            {erosionPercent >= 50 && erosionPercent < 75 && "Half the pixels have met their fate!"}
            {erosionPercent >= 75 && erosionPercent < 100 && "Almost complete annihilation! 💀"}
            {erosionPercent >= 100 && "Total entropy achieved. You monster. 🖤"}
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn-primary px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105"
        >
          🔄 Reset Canvas
        </button>

        <div 
          className="text-xs max-w-md text-center"
          style={{ color: "var(--color-text-dim)" }}
        >
          Pro tip: Click rapidly in different spots to create interference patterns. 
          The waves interact with each other for extra satisfying destruction! 🌀
        </div>
      </div>
    </FeatureWrapper>
  );
}