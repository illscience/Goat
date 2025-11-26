"use client";

import { useState, useRef, useEffect } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface DrawnShape {
  type: "circle" | "rectangle" | "triangle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  ingredient: string;
}

const INGREDIENT_MAP: Record<string, { color: string; name: string }> = {
  tomato: { color: "#FF6B6B", name: "Tomato" },
  bread: { color: "#D4A574", name: "Bread" },
  cheese: { color: "#FFD93D", name: "Cheese" },
  lettuce: { color: "#6BCB77", name: "Lettuce" },
  meat: { color: "#8B4513", name: "Mystery Meat" },
  egg: { color: "#FFFACD", name: "Egg" },
  fish: { color: "#87CEEB", name: "Fish" },
  mushroom: { color: "#DDA0DD", name: "Mushroom" },
};

export default function PixelRecipeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [selectedTool, setSelectedTool] = useState<"circle" | "rectangle" | "triangle">("circle");
  const [selectedIngredient, setSelectedIngredient] = useState<string>("tomato");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [recipe, setRecipe] = useState<string>("");
  const [pixelArtUrl, setPixelArtUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern
    ctx.strokeStyle = "#2a2a4e";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw all shapes
    shapes.forEach((shape) => {
      ctx.fillStyle = shape.color;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;

      if (shape.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          Math.abs(shape.width) / 2,
          Math.abs(shape.height) / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      } else if (shape.type === "rectangle") {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "triangle") {
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw ingredient label
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        shape.ingredient,
        shape.x + shape.width / 2,
        shape.y + shape.height / 2 + 4
      );
    });
  }, [shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const width = endX - startPos.x;
    const height = endY - startPos.y;

    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      const newShape: DrawnShape = {
        type: selectedTool,
        x: width > 0 ? startPos.x : endX,
        y: height > 0 ? startPos.y : endY,
        width: Math.abs(width),
        height: Math.abs(height),
        color: INGREDIENT_MAP[selectedIngredient].color,
        ingredient: INGREDIENT_MAP[selectedIngredient].name,
      };
      setShapes([...shapes, newShape]);
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setShapes([]);
    setRecipe("");
    setPixelArtUrl("");
  };

  const undoLast = () => {
    setShapes(shapes.slice(0, -1));
  };

  const generateRecipe = async () => {
    if (shapes.length === 0) return;

    setIsGenerating(true);
    setGenerationStep("🧠 Consulting the Chaos Chef...");

    const ingredients = shapes.map((s) => s.ingredient);
    const shapeSummary = shapes
      .map((s) => `${s.type} of ${s.ingredient} (size: ${Math.round(s.width)}x${Math.round(s.height)})`)
      .join(", ");

    try {
      // Generate recipe
      const recipeResponse = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a completely unhinged, chaotic chef who creates absurd recipes. You speak in a dramatic, over-the-top manner. Create bizarre cooking instructions that are funny but reference the actual ingredients provided. Include made-up cooking techniques, impossible temperatures, and silly presentation suggestions. Keep it family-friendly but weird. Format with numbered steps.`,
            },
            {
              role: "user",
              content: `Create a wild recipe using these drawn ingredients: ${ingredients.join(", ")}. The shapes drawn were: ${shapeSummary}. Make the recipe reflect the shapes somehow (bigger shapes = more of that ingredient, etc).`,
            },
          ],
          model: "anthropic/claude-sonnet-4",
          temperature: 0.9,
          maxTokens: 500,
        }),
      });

      const recipeData = await recipeResponse.json();
      const recipeText = recipeData?.content || "The chaos chef has gone on vacation. Try again!";
      setRecipe(recipeText);

      // Generate pixel art
      setGenerationStep("🎨 Pixelating the madness...");
      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Pixel art style, retro 16-bit video game graphics, a bizarre plated dish made from ${ingredients.join(", ")}, on a fancy restaurant plate, colorful, quirky presentation, pixelated, nostalgic gaming aesthetic`,
          width: 512,
          height: 512,
        }),
      });

      const imageData = await imageResponse.json();
      const imageUrl = imageData?.images?.[0]?.url || null;
      if (imageUrl) {
        setPixelArtUrl(imageUrl);
      }

      setGenerationStep("");
    } catch (error) {
      console.error("Generation failed:", error);
      setRecipe("Oops! The kitchen exploded. Please try again! 💥");
      setGenerationStep("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <FeatureWrapper day={361} title="Pixel Recipe Generator" emoji="🍳">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <p
            className="text-lg"
            style={{ color: "var(--color-text-dim)", fontFamily: "var(--font-serif)" }}
          >
            Draw your ingredients, unleash culinary chaos! 🌪️
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drawing Section */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
            >
              🎨 Ingredient Canvas
            </h3>

            {/* Tool Selection */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                Shape:
              </span>
              {(["circle", "rectangle", "triangle"] as const).map((tool) => (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    selectedTool === tool ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {tool === "circle" && "⭕"}
                  {tool === "rectangle" && "⬛"}
                  {tool === "triangle" && "🔺"}
                </button>
              ))}
            </div>

            {/* Ingredient Selection */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                Ingredient:
              </span>
              {Object.entries(INGREDIENT_MAP).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedIngredient(key)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all border-2 ${
                    selectedIngredient === key ? "border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: value.color, color: "#000" }}
                >
                  {value.name}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
              className="w-full rounded-lg cursor-crosshair"
              style={{ border: "2px solid var(--color-border)" }}
            />

            {/* Canvas Controls */}
            <div className="flex gap-2">
              <button onClick={undoLast} className="btn-secondary px-4 py-2 rounded-lg">
                ↩️ Undo
              </button>
              <button onClick={clearCanvas} className="btn-secondary px-4 py-2 rounded-lg">
                🗑️ Clear
              </button>
              <button
                onClick={generateRecipe}
                disabled={shapes.length === 0 || isGenerating}
                className="btn-primary px-4 py-2 rounded-lg flex-1 disabled:opacity-50"
              >
                {isGenerating ? generationStep : "🍳 Generate Chaos Recipe!"}
              </button>
            </div>

            {/* Current Ingredients */}
            {shapes.length > 0 && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                  <strong>Ingredients queued:</strong>{" "}
                  {[...new Set(shapes.map((s) => s.ingredient))].join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Recipe & Output Section */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
            >
              📜 The Chaos Recipe
            </h3>

            {!recipe && !isGenerating && (
              <div
                className="h-48 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--color-bg)", border: "2px dashed var(--color-border)" }}
              >
                <p className="text-center" style={{ color: "var(--color-text-dim)" }}>
                  Draw some ingredients and hit generate!
                  <br />
                  <span className="text-2xl">👨‍🍳</span>
                </p>
              </div>
            )}

            {isGenerating && (
              <div
                className="h-48 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--color-bg)" }}
              >
                <div className="text-center">
                  <div className="text-4xl animate-bounce">🍳</div>
                  <p style={{ color: "var(--color-accent)" }}>{generationStep}</p>
                </div>
              </div>
            )}

            {recipe && !isGenerating && (
              <div
                className="p-4 rounded-lg max-h-64 overflow-y-auto"
                style={{ backgroundColor: "var(--color-bg)" }}
              >
                <pre
                  className="whitespace-pre-wrap text-sm"
                  style={{ color: "var(--color-text)", fontFamily: "inherit" }}
                >
                  {recipe}
                </pre>
              </div>
            )}

            {/* Pixel Art Result */}
            <h3
              className="text-xl font-bold pt-4"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-serif)" }}
            >
              🖼️ The Final Dish
            </h3>

            {!pixelArtUrl && !isGenerating && (
              <div
                className="h-48 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--color-bg)", border: "2px dashed var(--color-border)" }}
              >
                <p className="text-center" style={{ color: "var(--color-text-dim)" }}>
                  Your pixel masterpiece will appear here!
                  <br />
                  <span className="text-2xl">🎮</span>
                </p>
              </div>
            )}

            {pixelArtUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={pixelArtUrl}
                  alt="Generated pixel art dish"
                  className="w-full rounded-lg"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div
          className="text-center p-4 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            💡 <strong>Pro tip:</strong> Bigger shapes = more of that ingredient! Mix weird combos for maximum chaos!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}