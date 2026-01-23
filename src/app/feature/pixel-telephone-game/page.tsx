"use client";

import { useState, useRef, useEffect } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Round {
  type: "drawing" | "description" | "generated";
  content: string; // base64 for images, text for descriptions
  label: string;
}

export default function PixelTelephoneGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState("#000000");
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const totalRounds = 6;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (gameStarted) return;
    setIsDrawing(true);
    const pos = getCanvasCoordinates(e);
    lastPosRef.current = pos;
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !lastPosRef.current) return;

    const pos = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const getCanvasDataUrl = () => {
    const canvas = canvasRef.current;
    return canvas?.toDataURL("image/png") || "";
  };

  const describeImage = async (imageData: string): Promise<string> => {
    const response = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are playing a game of telephone. Describe the image you see in a single, concise sentence (max 20 words). Focus on the main subject and its key features. Be specific but brief. Don't mention it's a drawing or sketch - describe it as if it's a real thing.",
          },
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: imageData.replace(/^data:image\/png;base64,/, ""),
                },
              },
              {
                type: "text",
                text: "Describe what you see in this image in one brief sentence.",
              },
            ],
          },
        ],
        model: "anthropic/claude-sonnet-4",
        temperature: 0.7,
        maxTokens: 100,
      }),
    });

    const data = await response.json();
    return data.content || "A mysterious shape";
  };

  const generateImage = async (description: string): Promise<string> => {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `${description}, simple illustration, clean lines, centered composition`,
        width: 256,
        height: 256,
      }),
    });

    const data = await response.json();
    return data.images?.[0]?.url || "";
  };

  const startGame = async () => {
    const initialDrawing = getCanvasDataUrl();
    if (!initialDrawing) return;

    setGameStarted(true);
    setIsProcessing(true);
    setRounds([
      {
        type: "drawing",
        content: initialDrawing,
        label: "Your Original Drawing",
      },
    ]);
    setCurrentRound(1);

    let currentImage = initialDrawing;

    try {
      for (let i = 1; i < totalRounds; i++) {
        // AI describes the image
        const description = await describeImage(currentImage);

        setRounds((prev) => [
          ...prev,
          {
            type: "description",
            content: description,
            label: `Round ${Math.ceil(i / 2)} - AI's Description`,
          },
        ]);
        setCurrentRound((prev) => prev + 1);

        if (i + 1 < totalRounds) {
          // Generate new image from description
          const newImageUrl = await generateImage(description);

          if (newImageUrl) {
            setRounds((prev) => [
              ...prev,
              {
                type: "generated",
                content: newImageUrl,
                label: `Round ${Math.ceil((i + 1) / 2)} - AI's Interpretation`,
              },
            ]);
            setCurrentRound((prev) => prev + 1);
            currentImage = newImageUrl;
          } else {
            break;
          }
        }
      }
    } catch (error) {
      console.error("Game error:", error);
    }

    setIsProcessing(false);
  };

  const resetGame = () => {
    setRounds([]);
    setCurrentRound(0);
    setGameStarted(false);
    setIsProcessing(false);
    clearCanvas();
  };

  const colors = [
    "#000000",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <FeatureWrapper day={419} title="Pixel Telephone Game" emoji="🎨">
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            🎨 Digital Telephone
          </h1>
          <p style={{ color: "var(--color-text-dim)" }} className="text-lg">
            Draw something simple. Watch AI interpret it. Witness the beautiful
            chaos of meaning degrading through multiple rounds of AI telephone!
          </p>
        </div>

        {!gameStarted ? (
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-bg-secondary)" }}
            >
              <p
                className="text-center mb-4 font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Draw something simple below - a cat, a house, a pizza... anything!
              </p>

              <div className="flex justify-center mb-4">
                <canvas
                  ref={canvasRef}
                  width={256}
                  height={256}
                  className="border-2 rounded-lg cursor-crosshair touch-none"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "#ffffff",
                    width: "256px",
                    height: "256px",
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--color-text-dim)" }} className="text-sm">
                    Color:
                  </span>
                  <div className="flex gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          brushColor === color ? "scale-125" : ""
                        }`}
                        style={{
                          backgroundColor: color,
                          borderColor:
                            brushColor === color
                              ? "var(--color-accent)"
                              : "transparent",
                        }}
                        onClick={() => setBrushColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--color-text-dim)" }} className="text-sm">
                    Size:
                  </span>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button onClick={clearCanvas} className="btn-secondary px-4 py-2">
                  🗑️ Clear
                </button>
                <button onClick={startGame} className="btn-primary px-6 py-2">
                  🚀 Start Telephone!
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isProcessing && (
              <div
                className="text-center p-4 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <p style={{ color: "var(--color-text)" }} className="text-lg">
                  🤖 AI is playing telephone... Round {currentRound} of{" "}
                  {totalRounds - 1}
                </p>
                <p style={{ color: "var(--color-text-dim)" }} className="text-sm mt-2">
                  Watch meaning evolve (or devolve) in real-time!
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rounds.map((round, index) => (
                <div
                  key={index}
                  className="rounded-xl p-3 transition-all duration-500"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    borderLeft:
                      round.type === "description"
                        ? "4px solid var(--color-accent)"
                        : "4px solid transparent",
                  }}
                >
                  <p
                    className="text-sm font-medium mb-2 truncate"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {round.label}
                  </p>

                  {round.type === "description" ? (
                    <div
                      className="p-3 rounded-lg min-h-[100px] flex items-center justify-center"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <p
                        className="text-center italic"
                        style={{
                          color: "var(--color-text)",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        &ldquo;{round.content}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <img
                        src={round.content}
                        alt={round.label}
                        className="rounded-lg border"
                        style={{
                          borderColor: "var(--color-border)",
                          maxWidth: "200px",
                          maxHeight: "200px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isProcessing && rounds.length > 0 && (
              <div className="text-center space-y-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: "var(--color-bg-secondary)" }}
                >
                  <p
                    className="text-xl font-bold mb-2"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: "var(--color-text)",
                    }}
                  >
                    🎉 The Telephone is Complete!
                  </p>
                  <p style={{ color: "var(--color-text-dim)" }}>
                    From your original drawing to... well, whatever that became.
                    That&apos;s the magic of AI interpretation drift!
                  </p>
                </div>

                <button onClick={resetGame} className="btn-primary px-6 py-2">
                  🔄 Play Again
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className="mt-8 text-center text-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          <p>
            💡 Tip: Simple drawings work best. Try a smiley face, a tree, or a
            basic shape!
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}