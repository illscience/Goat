"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Domino {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  falling: boolean;
  fallDirection: "left" | "right" | "up" | "down" | null;
  fallProgress: number;
  hasFallen: boolean;
  trail: { x: number; y: number; opacity: number }[];
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

const GRID_SIZE = 12;
const CELL_SIZE = 50;

export default function PixelDominoes() {
  const [dominoes, setDominoes] = useState<Domino[]>([]);
  const [isPlacing, setIsPlacing] = useState(true);
  const [chainReactionStarted, setChainReactionStarted] = useState(false);
  const [fallenCount, setFallenCount] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const getNeighbors = useCallback(
    (domino: Domino): Domino[] => {
      return dominoes.filter((d) => {
        if (d.id === domino.id || d.hasFallen) return false;
        const dx = Math.abs(d.x - domino.x);
        const dy = Math.abs(d.y - domino.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      });
    },
    [dominoes]
  );

  const getFallDirection = (
    from: Domino,
    to: Domino
  ): "left" | "right" | "up" | "down" => {
    if (to.x < from.x) return "left";
    if (to.x > from.x) return "right";
    if (to.y < from.y) return "up";
    return "down";
  };

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setDominoes((prevDominoes) => {
        let hasChanges = false;
        const newDominoes = prevDominoes.map((domino) => {
          if (!domino.falling || domino.hasFallen) return domino;

          hasChanges = true;
          const newProgress = domino.fallProgress + deltaTime * 0.003;

          // Add trail effect
          const newTrail = [
            ...domino.trail,
            { x: domino.x, y: domino.y, opacity: 1 },
          ]
            .map((t) => ({ ...t, opacity: t.opacity - 0.05 }))
            .filter((t) => t.opacity > 0)
            .slice(-5);

          if (newProgress >= 1) {
            // Domino has fully fallen, trigger neighbors
            const neighbors = getNeighbors(domino);
            neighbors.forEach((neighbor) => {
              const neighborIndex = prevDominoes.findIndex(
                (d) => d.id === neighbor.id
              );
              if (neighborIndex !== -1 && !prevDominoes[neighborIndex].falling) {
                prevDominoes[neighborIndex] = {
                  ...prevDominoes[neighborIndex],
                  falling: true,
                  fallDirection: getFallDirection(domino, neighbor),
                  fallProgress: 0,
                };
              }
            });

            return {
              ...domino,
              fallProgress: 1,
              hasFallen: true,
              trail: newTrail,
            };
          }

          return {
            ...domino,
            fallProgress: newProgress,
            trail: newTrail,
          };
        });

        // Update fallen count
        const newFallenCount = newDominoes.filter((d) => d.hasFallen).length;
        if (newFallenCount !== fallenCount) {
          setFallenCount(newFallenCount);
        }

        // Check if chain reaction is complete
        const stillFalling = newDominoes.some(
          (d) => d.falling && !d.hasFallen
        );
        if (!stillFalling && hasChanges) {
          setChainReactionStarted(false);
        }

        return hasChanges ? newDominoes : prevDominoes;
      });

      const stillAnimating = dominoes.some((d) => d.falling && !d.hasFallen);
      if (stillAnimating || chainReactionStarted) {
        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [dominoes, getNeighbors, fallenCount, chainReactionStarted]
  );

  useEffect(() => {
    if (chainReactionStarted) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chainReactionStarted, animate]);

  const handleCellClick = (x: number, y: number) => {
    if (!isPlacing) {
      // Find domino at this position and start chain reaction
      const domino = dominoes.find((d) => d.x === x && d.y === y && !d.hasFallen);
      if (domino && !domino.falling) {
        setDominoes((prev) =>
          prev.map((d) =>
            d.id === domino.id
              ? { ...d, falling: true, fallDirection: "right", fallProgress: 0 }
              : d
          )
        );
        setChainReactionStarted(true);
      }
      return;
    }

    // Check if domino already exists at this position
    const existingIndex = dominoes.findIndex((d) => d.x === x && d.y === y);
    if (existingIndex !== -1) {
      // Remove domino
      setDominoes((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add new domino
      setDominoes((prev) => [
        ...prev,
        {
          id: Date.now(),
          x,
          y,
          color: selectedColor,
          angle: 0,
          falling: false,
          fallDirection: null,
          fallProgress: 0,
          hasFallen: false,
          trail: [],
        },
      ]);
    }
  };

  const resetDominoes = () => {
    setDominoes([]);
    setIsPlacing(true);
    setChainReactionStarted(false);
    setFallenCount(0);
  };

  const resetFallen = () => {
    setDominoes((prev) =>
      prev.map((d) => ({
        ...d,
        falling: false,
        fallDirection: null,
        fallProgress: 0,
        hasFallen: false,
        trail: [],
      }))
    );
    setChainReactionStarted(false);
    setFallenCount(0);
    setIsPlacing(false);
  };

  const getDominoTransform = (domino: Domino): string => {
    if (!domino.falling && !domino.hasFallen) return "rotateX(0deg)";

    const progress = domino.fallProgress;
    const angle = progress * 90;

    switch (domino.fallDirection) {
      case "left":
        return `rotateY(${angle}deg)`;
      case "right":
        return `rotateY(-${angle}deg)`;
      case "up":
        return `rotateX(-${angle}deg)`;
      case "down":
        return `rotateX(${angle}deg)`;
      default:
        return `rotateY(-${angle}deg)`;
    }
  };

  const getDominoStyle = (domino: Domino) => {
    const baseStyle = {
      transform: getDominoTransform(domino),
      transformOrigin:
        domino.fallDirection === "left"
          ? "left center"
          : domino.fallDirection === "right"
          ? "right center"
          : domino.fallDirection === "up"
          ? "center top"
          : "center bottom",
      transition: domino.falling ? "none" : "transform 0.1s",
    };

    return baseStyle;
  };

  return (
    <FeatureWrapper day={383} title="Pixel Dominoes" emoji="🀄">
      <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center max-w-md">
          <p
            className="text-lg mb-2"
            style={{ color: "var(--color-text-dim)" }}
          >
            {isPlacing
              ? "Click to place dominoes on the grid. Choose your colors wisely! 🎨"
              : "Click any standing domino to start the chain reaction! ⚡"}
          </p>
        </div>

        {/* Color Palette */}
        {isPlacing && (
          <div className="flex gap-2 flex-wrap justify-center">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  border:
                    selectedColor === color
                      ? "3px solid var(--color-text)"
                      : "2px solid transparent",
                  boxShadow:
                    selectedColor === color
                      ? "0 0 10px rgba(255,255,255,0.5)"
                      : "none",
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setIsPlacing(!isPlacing)}
            className="btn-primary px-4 py-2 rounded-lg font-medium"
            disabled={dominoes.length === 0}
          >
            {isPlacing ? "🎯 Ready to Topple!" : "✏️ Edit Mode"}
          </button>
          <button
            onClick={resetFallen}
            className="btn-secondary px-4 py-2 rounded-lg font-medium"
            disabled={fallenCount === 0}
          >
            🔄 Reset Fallen
          </button>
          <button
            onClick={resetDominoes}
            className="btn-secondary px-4 py-2 rounded-lg font-medium"
          >
            🗑️ Clear All
          </button>
        </div>

        {/* Stats */}
        <div
          className="flex gap-6 text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <span>
            📊 Placed: <strong>{dominoes.length}</strong>
          </span>
          <span>
            💥 Fallen: <strong>{fallenCount}</strong>
          </span>
          {dominoes.length > 0 && (
            <span>
              📈 Chain:{" "}
              <strong>
                {Math.round((fallenCount / dominoes.length) * 100)}%
              </strong>
            </span>
          )}
        </div>

        {/* Grid */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            border: "2px solid var(--color-border)",
            perspective: "1000px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gap: "1px",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              const domino = dominoes.find((d) => d.x === x && d.y === y);

              return (
                <div
                  key={index}
                  onClick={() => handleCellClick(x, y)}
                  className="relative cursor-pointer transition-colors"
                  style={{
                    backgroundColor:
                      (x + y) % 2 === 0
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Trail effect */}
                  {domino?.trail.map((t, i) => (
                    <div
                      key={i}
                      className="absolute inset-1 rounded"
                      style={{
                        backgroundColor: domino.color,
                        opacity: t.opacity * 0.3,
                        filter: "blur(2px)",
                      }}
                    />
                  ))}

                  {/* Domino */}
                  {domino && (
                    <div
                      className="absolute inset-1 rounded-md flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: domino.color,
                        ...getDominoStyle(domino),
                        opacity: domino.hasFallen ? 0.4 : 1,
                        boxShadow: domino.hasFallen
                          ? "none"
                          : `0 4px 12px ${domino.color}50, inset 0 1px 0 rgba(255,255,255,0.3)`,
                      }}
                    >
                      {/* Domino dots */}
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                          <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                        </div>
                        <div className="w-full h-px bg-white opacity-40" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                          <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                        </div>
                      </div>

                      {/* Shine effect */}
                      {!domino.hasFallen && (
                        <div
                          className="absolute inset-0 rounded-md opacity-20"
                          style={{
                            background:
                              "linear-gradient(135deg, white 0%, transparent 50%)",
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Hover indicator for empty cells */}
                  {!domino && isPlacing && (
                    <div
                      className="absolute inset-1 rounded-md opacity-0 hover:opacity-30 transition-opacity"
                      style={{ backgroundColor: selectedColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        <p
          className="text-xs text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          💡 Tip: Place dominoes in a path for the best chain reactions! The
          closer they are, the more satisfying the fall.
        </p>
      </div>
    </FeatureWrapper>
  );
}