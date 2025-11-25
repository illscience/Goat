"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Star {
  id: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  caught: boolean;
  isDragging?: boolean;
}

interface Constellation {
  stars: Star[];
  name: string;
}

export default function ConstellationCollector() {
  const [stars, setStars] = useState<Star[]>([]);
  const [caughtStars, setCaughtStars] = useState<Star[]>([]);
  const [score, setScore] = useState(0);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [savedConstellations, setSavedConstellations] = useState<Constellation[]>([]);
  const [draggedStar, setDraggedStar] = useState<string | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  const generateConstellationName = async () => {
    if (caughtStars.length < 3) return;
    
    setIsGeneratingName(true);
    try {
      const starPositions = caughtStars.map(s => ({ x: Math.round(s.x), y: Math.round(s.y) }));
      
      const response = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { 
              role: "system", 
              content: "You are a mystical astronomer who names constellations. Given star positions, create a poetic, mystical constellation name (2-4 words max) and a very brief mystical meaning (10 words max). Format: NAME | MEANING" 
            },
            { 
              role: "user", 
              content: `Stars at positions: ${JSON.stringify(starPositions)}. Create a mystical constellation name.` 
            }
          ],
          model: "anthropic/claude-sonnet-4",
          temperature: 0.9,
          maxTokens: 50
        })
      });
      
      const data = await response.json();
      const content = data.content || "The Wanderer's Dream | A path to forgotten wishes";
      setConstellationName(content);
    } catch (error) {
      setConstellationName("The Mystery | Unknown paths await");
    } finally {
      setIsGeneratingName(false);
    }
  };

  const saveConstellation = () => {
    if (caughtStars.length > 0 && constellationName) {
      setSavedConstellations(prev => [...prev, {
        stars: [...caughtStars],
        name: constellationName
      }]);
      setCaughtStars([]);
      setConstellationName("");
    }
  };

  const spawnStar = useCallback(() => {
    const newStar: Star = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (window.innerWidth - 40) + 20,
      y: -20,
      speed: Math.random() * 2 + 1,
      size: Math.random() * 15 + 10,
      opacity: Math.random() * 0.5 + 0.5,
      caught: false
    };
    setStars(prev => [...prev, newStar]);
  }, []);

  const catchStar = (starId: string) => {
    setStars(prev => {
      const star = prev.find(s => s.id === starId);
      if (star) {
        setCaughtStars(current => [...current, { ...star, caught: true }]);
        setScore(s => s + Math.round(star.size));
      }
      return prev.filter(s => s.id !== starId);
    });
  };

  const handleMouseDown = (e: React.MouseEvent, starId: string) => {
    e.preventDefault();
    setDraggedStar(starId);
    setCaughtStars(prev => prev.map(s => 
      s.id === starId ? { ...s, isDragging: true } : s
    ));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedStar) {
      setCaughtStars(prev => prev.map(s => 
        s.id === draggedStar 
          ? { ...s, x: e.clientX, y: e.clientY }
          : s
      ));
    }
  }, [draggedStar]);

  const handleMouseUp = useCallback(() => {
    setDraggedStar(null);
    setCaughtStars(prev => prev.map(s => ({ ...s, isDragging: false })));
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      // Spawn new stars
      if (timestamp - lastSpawnRef.current > 2000) {
        spawnStar();
        lastSpawnRef.current = timestamp;
      }

      // Update falling stars
      setStars(prev => prev
        .map(star => ({
          ...star,
          y: star.y + star.speed
        }))
        .filter(star => star.y < window.innerHeight + 50)
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [spawnStar]);

  return (
    <FeatureWrapper day={360} title="Constellation Collector" emoji="✨">
      <div className="min-h-[600px] relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 rounded-lg">
        {/* Score */}
        <div className="absolute top-4 left-4 text-white/80 font-mono">
          <div className="text-2xl">⭐ {score}</div>
          <div className="text-sm text-white/60">Stardust collected</div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <button
            onClick={generateConstellationName}
            disabled={caughtStars.length < 3 || isGeneratingName}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {isGeneratingName ? "Divining..." : "Divine Constellation"}
          </button>
          {constellationName && (
            <div className="bg-white/10 backdrop-blur p-3 rounded-lg text-white text-sm">
              <div style={{ fontFamily: "var(--font-serif)" }}>{constellationName}</div>
              <button
                onClick={saveConstellation}
                className="btn-secondary text-xs mt-2 w-full"
              >
                Save to Sky Map
              </button>
            </div>
          )}
        </div>

        {/* Falling stars */}
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute cursor-pointer transition-all duration-100 hover:scale-125"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity
            }}
            onClick={() => catchStar(star.id)}
          >
            <div className="w-full h-full relative">
              <div className="absolute inset-0 bg-white rounded-full blur-sm animate-pulse" />
              <div className="absolute inset-0 bg-yellow-200 rounded-full" />
              <div className="absolute inset-1 bg-yellow-100 rounded-full" />
            </div>
          </div>
        ))}

        {/* Caught stars canvas */}
        <svg className="absolute inset-0 pointer-events-none">
          {caughtStars.length > 1 && (
            <g>
              {caughtStars.map((star, i) => {
                if (i === 0) return null;
                const prevStar = caughtStars[i - 1];
                return (
                  <line
                    key={`${prevStar.id}-${star.id}`}
                    x1={prevStar.x}
                    y1={prevStar.y}
                    x2={star.x}
                    y2={star.y}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Caught stars */}
        {caughtStars.map(star => (
          <div
            key={star.id}
            className={`absolute transition-all ${star.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: `${star.x - star.size / 2}px`,
              top: `${star.y - star.size / 2}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, star.id)}
          >
            <div className="w-full h-full relative pointer-events-none">
              <div className="absolute inset-0 bg-white rounded-full blur-md animate-pulse" />
              <div className="absolute inset-0 bg-blue-300 rounded-full" />
              <div className="absolute inset-1 bg-blue-100 rounded-full" />
            </div>
          </div>
        ))}

        {/* Instructions */}
        {stars.length === 0 && caughtStars.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60 space-y-2">
              <p className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>Click falling stars to catch them</p>
              <p className="text-sm">Drag caught stars to form constellations</p>
              <p className="text-sm">Collect 3+ stars to divine their mystical name</p>
            </div>
          </div>
        )}

        {/* Saved constellations */}
        {savedConstellations.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/10 backdrop-blur p-3 rounded-lg">
              <h3 className="text-white/80 text-sm mb-2" style={{ fontFamily: "var(--font-serif)" }}>Your Sky Map</h3>
              <div className="flex gap-2 overflow-x-auto">
                {savedConstellations.map((constellation, i) => (
                  <div key={i} className="bg-white/10 px-3 py-1 rounded text-white/70 text-xs whitespace-nowrap">
                    {constellation.name.split('|')[0].trim()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}