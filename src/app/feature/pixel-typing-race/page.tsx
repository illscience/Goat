"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

const WORD_LIST = [
  "castle", "knight", "dragon", "tower", "brick", "stone", "wall", "gate",
  "moat", "bridge", "sword", "shield", "armor", "crown", "throne", "king",
  "queen", "prince", "wizard", "magic", "spell", "potion", "scroll", "dungeon",
  "treasure", "gold", "gems", "jewels", "banner", "flag", "horn", "battle",
  "siege", "arrow", "bow", "lance", "horse", "stable", "forge", "anvil",
  "hammer", "chain", "iron", "steel", "silver", "copper", "bronze", "marble",
  "granite", "cobble", "mortar", "beam", "arch", "dome", "spire", "turret",
  "rampart", "parapet", "portcullis", "drawbridge", "courtyard", "garden"
];

interface Pixel {
  x: number;
  y: number;
  color: string;
  id: number;
}

const CASTLE_COLORS = [
  "#6b7280", "#9ca3af", "#d1d5db", "#4b5563", "#374151",
  "#78716c", "#a8a29e", "#d6d3d1", "#57534e", "#44403c"
];

const MELT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#dc2626", "#f59e0b"
];

export default function PixelTypingRace() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [currentWord, setCurrentWord] = useState("");
  const [typedText, setTypedText] = useState("");
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [targetWords, setTargetWords] = useState(10);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [meltPixels, setMeltPixels] = useState<Pixel[]>([]);
  const [meltProgress, setMeltProgress] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalChars, setTotalChars] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const pixelIdRef = useRef<number>(0);
  const meltIntervalRef = useRef<number>(0);
  const canvasWidth = 300;
  const canvasHeight = 400;
  const pixelSize = 10;

  const getRandomWord = useCallback(() => {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  }, []);

  const addCastlePixel = useCallback(() => {
    const currentHeight = Math.max(...pixels.map(p => canvasHeight - p.y), 0);
    const baseWidth = Math.max(8 - Math.floor(currentHeight / 50), 3);
    const centerX = canvasWidth / 2;
    
    const row = Math.floor(currentHeight / pixelSize);
    const offset = (Math.random() - 0.5) * baseWidth * pixelSize;
    
    const newPixel: Pixel = {
      x: centerX + offset - (offset % pixelSize),
      y: canvasHeight - (row + 1) * pixelSize,
      color: CASTLE_COLORS[Math.floor(Math.random() * CASTLE_COLORS.length)],
      id: pixelIdRef.current++
    };
    
    setPixels(prev => [...prev, newPixel]);
  }, [pixels]);

  const addMeltPixel = useCallback(() => {
    const newMelt: Pixel = {
      x: Math.floor(Math.random() * (canvasWidth / pixelSize)) * pixelSize,
      y: 0,
      color: MELT_COLORS[Math.floor(Math.random() * MELT_COLORS.length)],
      id: pixelIdRef.current++
    };
    setMeltPixels(prev => [...prev, newMelt]);
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    setCurrentWord(getRandomWord());
    setTypedText("");
    setWordsCompleted(0);
    setPixels([]);
    setMeltPixels([]);
    setMeltProgress(0);
    setWpm(0);
    setStartTime(Date.now());
    setTotalChars(0);
    pixelIdRef.current = 0;
    
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [getRandomWord]);

  useEffect(() => {
    if (gameState !== "playing") return;

    meltIntervalRef.current = window.setInterval(() => {
      setMeltProgress(prev => {
        const newProgress = prev + 0.5;
        if (newProgress >= 100) {
          setGameState("lost");
          return 100;
        }
        return newProgress;
      });
      
      if (Math.random() > 0.7) {
        addMeltPixel();
      }
      
      setMeltPixels(prev => 
        prev.map(p => ({ ...p, y: p.y + pixelSize * 0.5 }))
          .filter(p => p.y < canvasHeight)
      );
    }, 100);

    return () => {
      if (meltIntervalRef.current) {
        clearInterval(meltIntervalRef.current);
      }
    };
  }, [gameState, addMeltPixel]);

  useEffect(() => {
    if (gameState === "playing" && startTime && totalChars > 0) {
      const minutes = (Date.now() - startTime) / 60000;
      const calculatedWpm = Math.round((totalChars / 5) / minutes);
      setWpm(calculatedWpm);
    }
  }, [gameState, startTime, totalChars]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "playing") return;
    
    const value = e.target.value.toLowerCase();
    setTypedText(value);
    
    if (value === currentWord) {
      setWordsCompleted(prev => {
        const newCount = prev + 1;
        if (newCount >= targetWords) {
          setGameState("won");
        }
        return newCount;
      });
      setTotalChars(prev => prev + currentWord.length);
      
      for (let i = 0; i < currentWord.length; i++) {
        setTimeout(() => addCastlePixel(), i * 50);
      }
      
      setCurrentWord(getRandomWord());
      setTypedText("");
      e.target.value = "";
    }
  }, [gameState, currentWord, targetWords, getRandomWord, addCastlePixel]);

  const renderPixels = () => {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border-2"
        style={{ 
          width: canvasWidth, 
          height: canvasHeight,
          backgroundColor: "#1a1a2e",
          borderColor: "var(--color-border)"
        }}
      >
        {/* Melt timer bar */}
        <div 
          className="absolute top-0 left-0 right-0 transition-all duration-100"
          style={{ 
            height: `${meltProgress}%`,
            background: "linear-gradient(180deg, #ef4444 0%, #f97316 50%, transparent 100%)",
            opacity: 0.6
          }}
        />
        
        {/* Melt pixels */}
        {meltPixels.map(pixel => (
          <div
            key={pixel.id}
            className="absolute transition-all duration-100"
            style={{
              left: pixel.x,
              top: pixel.y,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: pixel.color,
              boxShadow: `0 0 ${pixelSize}px ${pixel.color}`
            }}
          />
        ))}
        
        {/* Castle pixels */}
        {pixels.map(pixel => (
          <div
            key={pixel.id}
            className="absolute transition-all duration-200"
            style={{
              left: pixel.x,
              top: pixel.y,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: pixel.color,
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.2)"
            }}
          />
        ))}
        
        {/* Ground */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: pixelSize,
            backgroundColor: "#4a5568"
          }}
        />
      </div>
    );
  };

  return (
    <FeatureWrapper day={438} title="Pixel Typing Race" emoji="🏰">
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center max-w-md">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Build Your Castle Before It Melts! 🔥
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Type words to stack pixel blocks. Race against the melting timer dripping from above!
          </p>
        </div>

        <div className="flex gap-8 items-start">
          {renderPixels()}
          
          <div className="flex flex-col gap-4">
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <div className="text-sm mb-1" style={{ color: "var(--color-text-dim)" }}>
                Progress
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
                {wordsCompleted} / {targetWords}
              </div>
              <div className="w-32 h-2 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${(wordsCompleted / targetWords) * 100}%`,
                    backgroundColor: "var(--color-accent)"
                  }}
                />
              </div>
            </div>

            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <div className="text-sm mb-1" style={{ color: "var(--color-text-dim)" }}>
                Speed
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {wpm} WPM
              </div>
            </div>

            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <div className="text-sm mb-1" style={{ color: "var(--color-text-dim)" }}>
                Melt Timer
              </div>
              <div className="text-2xl font-bold" style={{ color: meltProgress > 70 ? "#ef4444" : "var(--color-text)" }}>
                {Math.round(100 - meltProgress)}%
              </div>
            </div>
          </div>
        </div>

        {gameState === "idle" && (
          <button
            onClick={startGame}
            className="btn-primary text-lg px-8 py-3"
          >
            🏗️ Start Building!
          </button>
        )}

        {gameState === "playing" && (
          <div className="flex flex-col items-center gap-4">
            <div 
              className="text-4xl font-mono tracking-wider"
              style={{ color: "var(--color-text)" }}
            >
              {currentWord.split("").map((letter, i) => (
                <span
                  key={i}
                  style={{
                    color: i < typedText.length
                      ? typedText[i] === letter
                        ? "#22c55e"
                        : "#ef4444"
                      : "var(--color-text)"
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>
            <input
              ref={inputRef}
              type="text"
              onChange={handleInput}
              className="px-4 py-2 text-xl font-mono rounded-lg border-2 outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)"
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        )}

        {gameState === "won" && (
          <div className="text-center">
            <div 
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "#22c55e" }}
            >
              🏰 Castle Complete! 🎉
            </div>
            <p className="mb-4" style={{ color: "var(--color-text-dim)" }}>
              You built your castle at {wpm} WPM! The kingdom is safe!
            </p>
            <button
              onClick={startGame}
              className="btn-primary"
            >
              Build Another Castle
            </button>
          </div>
        )}

        {gameState === "lost" && (
          <div className="text-center">
            <div 
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "#ef4444" }}
            >
              💀 Castle Melted! 🔥
            </div>
            <p className="mb-4" style={{ color: "var(--color-text-dim)" }}>
              The lava reached your castle! You completed {wordsCompleted} words at {wpm} WPM.
            </p>
            <button
              onClick={startGame}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        )}

        <div 
          className="text-sm text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Tip: Type faster to outrun the melting timer! Each word adds blocks to your castle.
        </div>
      </div>
    </FeatureWrapper>
  );
}