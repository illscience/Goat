"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Plant {
  id: string;
  x: number;
  y: number;
  stage: number;
  water: number;
  sunlight: number;
  fertilizer: number;
  age: number;
  type: "flower" | "cactus" | "mushroom" | "tree";
  health: "perfect" | "overwatered" | "underwatered" | "neglected" | "overfed";
}

const GRID_SIZE = 12;
const CELL_SIZE = 40;

const PLANT_EMOJIS: Record<string, Record<string, string[]>> = {
  flower: {
    perfect: ["🌱", "🌿", "🌸", "🌺", "💐"],
    overwatered: ["🌱", "💧", "🫧", "🌊", "💀"],
    underwatered: ["🌱", "🥀", "🍂", "🥀", "💀"],
    neglected: ["🌱", "🍂", "🥀", "💀", "💀"],
    overfed: ["🌱", "🌿", "🤢", "🤮", "💀"],
  },
  cactus: {
    perfect: ["🌱", "🌵", "🌵", "🏜️", "🌵"],
    overwatered: ["🌱", "💧", "🫧", "💀", "💀"],
    underwatered: ["🌱", "🌵", "🌵", "🌵", "🌵"],
    neglected: ["🌱", "🥀", "💀", "💀", "💀"],
    overfed: ["🌱", "🤢", "💀", "💀", "💀"],
  },
  mushroom: {
    perfect: ["🌱", "🍄", "🍄", "🍄‍🟫", "🎪"],
    overwatered: ["🌱", "🍄", "🍄", "🍄", "🍄"],
    underwatered: ["🌱", "🥀", "💀", "💀", "💀"],
    neglected: ["🌱", "🍂", "💀", "💀", "💀"],
    overfed: ["🌱", "🍄", "🤢", "💀", "💀"],
  },
  tree: {
    perfect: ["🌱", "🌿", "🌳", "🌲", "🎄"],
    overwatered: ["🌱", "💧", "🫧", "🌊", "💀"],
    underwatered: ["🌱", "🥀", "🍂", "🪵", "💀"],
    neglected: ["🌱", "🍂", "🪵", "💀", "💀"],
    overfed: ["🌱", "🌿", "🤢", "🤮", "💀"],
  },
};

const PLANT_TYPES: Array<"flower" | "cactus" | "mushroom" | "tree"> = [
  "flower",
  "cactus",
  "mushroom",
  "tree",
];

export default function PixelGardenEvolution() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedTool, setSelectedTool] = useState<
    "plant" | "water" | "sun" | "fertilizer"
  >("plant");
  const [selectedPlantType, setSelectedPlantType] = useState<
    "flower" | "cactus" | "mushroom" | "tree"
  >("flower");
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [stats, setStats] = useState({
    planted: 0,
    thriving: 0,
    dead: 0,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getPlantHealth = useCallback((plant: Plant): Plant["health"] => {
    const { water, sunlight, fertilizer } = plant;

    if (water > 80) return "overwatered";
    if (water < 20 && sunlight < 20) return "neglected";
    if (water < 20) return "underwatered";
    if (fertilizer > 80) return "overfed";
    if (water >= 30 && water <= 70 && sunlight >= 30 && sunlight <= 80) {
      return "perfect";
    }
    return "underwatered";
  }, []);

  const updatePlants = useCallback(() => {
    setPlants((prev) =>
      prev.map((plant) => {
        const newWater = Math.max(0, plant.water - 2);
        const newSunlight = Math.max(0, plant.sunlight - 1);
        const newFertilizer = Math.max(0, plant.fertilizer - 0.5);
        const newAge = plant.age + 1;

        const updatedPlant = {
          ...plant,
          water: newWater,
          sunlight: newSunlight,
          fertilizer: newFertilizer,
          age: newAge,
        };

        const health = getPlantHealth(updatedPlant);
        updatedPlant.health = health;

        if (newAge % 50 === 0 && plant.stage < 4) {
          updatedPlant.stage = Math.min(4, plant.stage + 1);
        }

        return updatedPlant;
      })
    );
  }, [getPlantHealth]);

  useEffect(() => {
    intervalRef.current = setInterval(updatePlants, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updatePlants]);

  useEffect(() => {
    const thriving = plants.filter((p) => p.health === "perfect").length;
    const dead = plants.filter(
      (p) =>
        p.stage === 4 &&
        (p.health === "neglected" ||
          p.health === "overwatered" ||
          p.health === "overfed")
    ).length;
    setStats({
      planted: plants.length,
      thriving,
      dead,
    });
  }, [plants]);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const existingPlant = plants.find((p) => p.x === x && p.y === y);

      if (selectedTool === "plant") {
        if (!existingPlant) {
          const newPlant: Plant = {
            id: `${x}-${y}-${Date.now()}`,
            x,
            y,
            stage: 0,
            water: 50,
            sunlight: 50,
            fertilizer: 30,
            age: 0,
            type: selectedPlantType,
            health: "perfect",
          };
          setPlants((prev) => [...prev, newPlant]);
        }
      } else if (existingPlant) {
        setPlants((prev) =>
          prev.map((p) => {
            if (p.id !== existingPlant.id) return p;

            switch (selectedTool) {
              case "water":
                return { ...p, water: Math.min(100, p.water + 25) };
              case "sun":
                return { ...p, sunlight: Math.min(100, p.sunlight + 20) };
              case "fertilizer":
                return { ...p, fertilizer: Math.min(100, p.fertilizer + 30) };
              default:
                return p;
            }
          })
        );
      }
    },
    [plants, selectedTool, selectedPlantType]
  );

  const getPlantEmoji = useCallback((plant: Plant) => {
    const stageIndex = Math.min(plant.stage, 4);
    return PLANT_EMOJIS[plant.type]?.[plant.health]?.[stageIndex] ?? "🌱";
  }, []);

  const clearGarden = useCallback(() => {
    setPlants([]);
  }, []);

  const toolButtons = [
    { id: "plant" as const, emoji: "🌱", label: "Plant" },
    { id: "water" as const, emoji: "💧", label: "Water" },
    { id: "sun" as const, emoji: "☀️", label: "Sunlight" },
    { id: "fertilizer" as const, emoji: "💩", label: "Fertilizer" },
  ];

  const hoveredPlant = hoveredCell
    ? plants.find((p) => p.x === hoveredCell.x && p.y === hoveredCell.y)
    : null;

  return (
    <FeatureWrapper day={364} title="Pixel Garden Evolution" emoji="🌻">
      <div className="flex flex-col items-center gap-6 p-4">
        <p
          className="text-center max-w-lg"
          style={{ color: "var(--color-text-dim)" }}
        >
          Plant seeds and nurture your garden! Each plant evolves based on your
          care. Too much water? 💧 They&apos;ll drown. Not enough sun? 🥀
          They&apos;ll wilt. Find the perfect balance for a thriving garden!
        </p>

        {/* Stats Bar */}
        <div
          className="flex gap-6 p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <div className="text-center">
            <span className="text-2xl">🌱</span>
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Planted: {stats.planted}
            </p>
          </div>
          <div className="text-center">
            <span className="text-2xl">✨</span>
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Thriving: {stats.thriving}
            </p>
          </div>
          <div className="text-center">
            <span className="text-2xl">💀</span>
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Dead: {stats.dead}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="flex flex-wrap justify-center gap-2 p-3 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          {toolButtons.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                selectedTool === tool.id
                  ? "ring-2 ring-offset-2"
                  : "hover:opacity-80"
              }`}
              style={{
                backgroundColor:
                  selectedTool === tool.id
                    ? "var(--color-accent)"
                    : "var(--color-bg)",
              }}
            >
              <span className="text-2xl">{tool.emoji}</span>
              <span className="text-xs" style={{ color: "var(--color-text)" }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        {/* Plant Type Selector */}
        {selectedTool === "plant" && (
          <div
            className="flex gap-2 p-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <span
              className="text-sm self-center mr-2"
              style={{ color: "var(--color-text-dim)" }}
            >
              Seed type:
            </span>
            {PLANT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedPlantType(type)}
                className={`px-3 py-1 rounded transition-all ${
                  selectedPlantType === type ? "ring-2" : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor:
                    selectedPlantType === type
                      ? "var(--color-accent)"
                      : "var(--color-bg)",
                }}
              >
                {type === "flower" && "🌸"}
                {type === "cactus" && "🌵"}
                {type === "mushroom" && "🍄"}
                {type === "tree" && "🌳"}
              </button>
            ))}
          </div>
        )}

        {/* Garden Grid */}
        <div
          className="rounded-lg p-2 overflow-auto"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            border: "2px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gap: "2px",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              const plant = plants.find((p) => p.x === x && p.y === y);
              const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onMouseEnter={() => setHoveredCell({ x, y })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className="flex items-center justify-center rounded transition-all"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: isHovered
                      ? "var(--color-accent)"
                      : "#8B4513",
                    opacity: isHovered ? 0.8 : 1,
                    border: "1px solid #654321",
                  }}
                >
                  {plant && (
                    <span className="text-2xl animate-pulse">
                      {getPlantEmoji(plant)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plant Info Panel */}
        {hoveredCell && (
          <div
            className="p-3 rounded-lg min-w-64"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            {hoveredPlant ? (
              <div className="space-y-2">
                <p
                  className="font-bold text-center capitalize"
                  style={{
                    color: "var(--color-text)",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  {hoveredPlant.type} - Stage {hoveredPlant.stage + 1}/5
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>💧</span>
                    <div
                      className="flex-1 h-3 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${hoveredPlant.water}%`,
                          backgroundColor:
                            hoveredPlant.water > 70
                              ? "#3B82F6"
                              : hoveredPlant.water < 30
                                ? "#EF4444"
                                : "#10B981",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs w-8"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {Math.round(hoveredPlant.water)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>☀️</span>
                    <div
                      className="flex-1 h-3 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${hoveredPlant.sunlight}%`,
                          backgroundColor:
                            hoveredPlant.sunlight > 80
                              ? "#F59E0B"
                              : hoveredPlant.sunlight < 30
                                ? "#6B7280"
                                : "#FCD34D",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs w-8"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {Math.round(hoveredPlant.sunlight)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💩</span>
                    <div
                      className="flex-1 h-3 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${hoveredPlant.fertilizer}%`,
                          backgroundColor:
                            hoveredPlant.fertilizer > 70
                              ? "#7C3AED"
                              : "#A78BFA",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs w-8"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {Math.round(hoveredPlant.fertilizer)}%
                    </span>
                  </div>
                </div>
                <p
                  className="text-center text-sm capitalize"
                  style={{
                    color:
                      hoveredPlant.health === "perfect" ? "#10B981" : "#EF4444",
                  }}
                >
                  Status: {hoveredPlant.health.replace("_", " ")}
                </p>
              </div>
            ) : (
              <p
                className="text-center"
                style={{ color: "var(--color-text-dim)" }}
              >
                Empty plot - Click to plant! 🌱
              </p>
            )}
          </div>
        )}

        {/* Clear Button */}
        <button
          onClick={clearGarden}
          className="btn-secondary px-4 py-2 rounded-lg"
        >
          🗑️ Clear Garden
        </button>

        {/* Tips */}
        <div
          className="text-center text-sm max-w-md p-3 rounded-lg"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-dim)",
          }}
        >
          <p className="font-bold mb-1" style={{ fontFamily: "var(--font-serif)" }}>
            🌻 Garden Tips:
          </p>
          <p>
            • Keep water between 30-70% for best results
            <br />
            • Cacti need less water, mushrooms love moisture
            <br />• Don&apos;t over-fertilize - too much is toxic!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}