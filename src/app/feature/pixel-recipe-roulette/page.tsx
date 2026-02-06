"use client";

import { useState, useRef, useEffect } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Ingredient {
  name: string;
  emoji: string;
  category: string;
}

const INGREDIENTS: Ingredient[] = [
  { name: "Pickle", emoji: "🥒", category: "vegetable" },
  { name: "Chocolate", emoji: "🍫", category: "sweet" },
  { name: "Cheese", emoji: "🧀", category: "dairy" },
  { name: "Banana", emoji: "🍌", category: "fruit" },
  { name: "Hot Dog", emoji: "🌭", category: "meat" },
  { name: "Garlic", emoji: "🧄", category: "aromatic" },
  { name: "Ice Cream", emoji: "🍦", category: "sweet" },
  { name: "Shrimp", emoji: "🦐", category: "seafood" },
  { name: "Peanut Butter", emoji: "🥜", category: "spread" },
  { name: "Sushi", emoji: "🍣", category: "seafood" },
  { name: "Taco", emoji: "🌮", category: "meal" },
  { name: "Egg", emoji: "🥚", category: "protein" },
  { name: "Bacon", emoji: "🥓", category: "meat" },
  { name: "Avocado", emoji: "🥑", category: "vegetable" },
  { name: "Honey", emoji: "🍯", category: "sweet" },
  { name: "Chili Pepper", emoji: "🌶️", category: "spicy" },
  { name: "Mushroom", emoji: "🍄", category: "vegetable" },
  { name: "Lemon", emoji: "🍋", category: "citrus" },
  { name: "Strawberry", emoji: "🍓", category: "fruit" },
  { name: "Croissant", emoji: "🥐", category: "bread" },
  { name: "Lobster", emoji: "🦞", category: "seafood" },
  { name: "Onion", emoji: "🧅", category: "aromatic" },
  { name: "Maple Syrup", emoji: "🍁", category: "sweet" },
  { name: "Coffee", emoji: "☕", category: "drink" },
];

const COOKING_METHODS = [
  "deep-fried in",
  "simmered with",
  "blended into",
  "topped with",
  "stuffed inside",
  "marinated in",
  "caramelized with",
  "flash-frozen then thawed with",
  "spiralized around",
  "deconstructed alongside",
];

const RECIPE_NAMES = [
  "Chaos Casserole",
  "Forbidden Fusion",
  "Kitchen Nightmare Special",
  "The Regrettable Risotto",
  "Culinary Crime Scene",
  "The What-Were-You-Thinking",
  "Midnight Madness Mix",
  "The Dumpster Delight",
  "Questionable Quinoa",
  "The Why-Not Wrap",
];

const CHEF_COMMENTS = [
  "Gordon Ramsay just felt a disturbance in the force.",
  "Bon appétit... I think?",
  "Your ancestors are watching. They're confused.",
  "FDA approval pending.",
  "Side effects may include questioning your life choices.",
  "Pairs well with regret and a glass of water.",
  "Chef's kiss... followed by chef's therapy session.",
  "Technically edible. Legally questionable.",
];

export default function PixelRecipeRoulette() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState<string | null>(null);
  const [chefComment, setChefComment] = useState<string | null>(null);
  const animationRef = useRef<number>(0);
  const spinSpeedRef = useRef<number>(0);
  const ingredientCountRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, [currentRotation, selectedIngredients]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    const segmentAngle = (2 * Math.PI) / INGREDIENTS.length;

    INGREDIENTS.forEach((ingredient, index) => {
      const startAngle = index * segmentAngle + (currentRotation * Math.PI) / 180;
      const endAngle = startAngle + segmentAngle;

      // Alternate colors
      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9"];
      ctx.fillStyle = colors[index % colors.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "#2d3436";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw emoji
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "24px serif";
      ctx.fillText(ingredient.emoji, radius * 0.65, 0);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#2d3436";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = "#636e72";
    ctx.fill();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 5, centerY);
    ctx.lineTo(centerX + radius + 25, centerY - 15);
    ctx.lineTo(centerX + radius + 25, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = "#e17055";
    ctx.fill();
    ctx.strokeStyle = "#2d3436";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const getSelectedIngredient = (): Ingredient => {
    const segmentAngle = 360 / INGREDIENTS.length;
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const index = Math.floor((360 - normalizedRotation) / segmentAngle) % INGREDIENTS.length;
    return INGREDIENTS[index];
  };

  const generateRecipe = (ingredients: Ingredient[]) => {
    if (ingredients.length < 2) return;

    const name = RECIPE_NAMES[Math.floor(Math.random() * RECIPE_NAMES.length)];
    const method1 = COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)];
    const method2 = COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)];

    const steps = [
      `1. Start by taking your ${ingredients[0].emoji} ${ingredients[0].name} and ${method1} pure determination.`,
      `2. While that's happening, prepare your ${ingredients[1].emoji} ${ingredients[1].name} ${method2} a hint of chaos.`,
      ingredients[2] ? `3. Fold in the ${ingredients[2].emoji} ${ingredients[2].name} with the confidence of someone who definitely knows what they're doing.` : null,
      `4. Cook until it looks "done" or until the smoke alarm goes off.`,
      `5. Plate it like you're on a cooking show (presentation is everything).`,
      `6. Serve immediately. Do not let anyone photograph this.`,
    ].filter(Boolean).join("\n");

    setRecipeName(name);
    setRecipe(steps);
    setChefComment(CHEF_COMMENTS[Math.floor(Math.random() * CHEF_COMMENTS.length)]);
  };

  const spin = () => {
    if (isSpinning) return;

    if (selectedIngredients.length >= 3) {
      setSelectedIngredients([]);
      setRecipe(null);
      setRecipeName(null);
      setChefComment(null);
    }

    setIsSpinning(true);
    spinSpeedRef.current = 15 + Math.random() * 10;
    ingredientCountRef.current = selectedIngredients.length;

    const animate = () => {
      setCurrentRotation((prev) => prev + spinSpeedRef.current);
      spinSpeedRef.current *= 0.985;

      if (spinSpeedRef.current > 0.5) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const selected = getSelectedIngredient();
        const newIngredients = [...selectedIngredients, selected];
        setSelectedIngredients(newIngredients);

        if (newIngredients.length >= 3) {
          setTimeout(() => generateRecipe(newIngredients), 500);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <FeatureWrapper day={433} title="Pixel Recipe Roulette" emoji="🎰">
      <div className="flex flex-col items-center gap-6 p-4">
        <p
          className="text-center max-w-md"
          style={{ color: "var(--color-text-dim)" }}
        >
          Spin the wheel of culinary chaos! Land on 3 ingredients and receive a
          recipe that absolutely no one asked for. 🍳💥
        </p>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={350}
            height={350}
            className="cursor-pointer transition-transform"
            onClick={spin}
          />
          {isSpinning && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ fontSize: "2rem" }}
            >
              🌀
            </div>
          )}
        </div>

        <button
          onClick={spin}
          disabled={isSpinning}
          className="btn-primary px-8 py-3 text-lg font-bold rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpinning
            ? "🎲 Spinning..."
            : selectedIngredients.length >= 3
            ? "🔄 Start Over"
            : `🎰 Spin! (${3 - selectedIngredients.length} left)`}
        </button>

        {selectedIngredients.length > 0 && (
          <div
            className="p-4 rounded-lg w-full max-w-md"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Your Ingredients:
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {selectedIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-3 rounded-lg animate-bounce"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    animationDelay: `${idx * 0.1}s`,
                    animationDuration: "0.5s",
                    animationIterationCount: "1",
                  }}
                >
                  <span className="text-3xl">{ing.emoji}</span>
                  <span
                    className="text-sm mt-1"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {ing.name}
                  </span>
                </div>
              ))}
              {[...Array(3 - selectedIngredients.length)].map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex flex-col items-center p-3 rounded-lg border-2 border-dashed"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span className="text-3xl opacity-30">❓</span>
                  <span
                    className="text-sm mt-1"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    ???
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recipe && (
          <div
            className="p-6 rounded-lg w-full max-w-md border-2"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              borderColor: "var(--color-accent)",
            }}
          >
            <h2
              className="text-2xl font-bold mb-1 text-center"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--color-accent)",
              }}
            >
              🍽️ {recipeName}
            </h2>
            <p
              className="text-center text-sm mb-4 italic"
              style={{ color: "var(--color-text-dim)" }}
            >
              Featuring: {selectedIngredients.map((i) => i.emoji).join(" + ")}
            </p>

            <div
              className="p-4 rounded-lg mb-4"
              style={{ backgroundColor: "var(--color-bg)" }}
            >
              <h4 className="font-bold mb-2">📝 Instructions:</h4>
              <pre
                className="whitespace-pre-wrap text-sm"
                style={{
                  color: "var(--color-text)",
                  fontFamily: "inherit",
                }}
              >
                {recipe}
              </pre>
            </div>

            <div
              className="text-center p-3 rounded-lg italic"
              style={{
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text-dim)",
              }}
            >
              👨‍🍳 Chef&apos;s Note: {chefComment}
            </div>
          </div>
        )}

        <p
          className="text-xs text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Disclaimer: The Goat accepts no responsibility for any culinary
          disasters, kitchen fires, or disappointed dinner guests resulting from
          these recipes. 🐐
        </p>
      </div>
    </FeatureWrapper>
  );
}