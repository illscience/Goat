"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

const MORSE_CODE: { [key: string]: string } = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  "0": "-----",
  " ": "/",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "'": ".----.",
  '"': ".-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "/": "-..-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  $: "...-..-",
  "@": ".--.-.",
};

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function PixelMorseCodeTelegraph() {
  const [morseOutput, setMorseOutput] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [isKeyDown, setIsKeyDown] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string>("");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmittedText, setTransmittedText] = useState<string>("");
  const [sparks, setSparks] = useState<Spark[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const keyDownTimeRef = useRef<number>(0);
  const lastKeyUpTimeRef = useRef<number>(0);
  const symbolsRef = useRef<string[]>([]);
  const animationFrameRef = useRef<number>(0);
  const transmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sparkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const DOT_THRESHOLD = 150;
  const LETTER_GAP = 500;
  const WORD_GAP = 1000;

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
  }, []);

  const playTone = useCallback(() => {
    initAudio();
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 600;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
  }, [initAudio]);

  const stopTone = useCallback(() => {
    if (oscillatorRef.current && gainNodeRef.current) {
      gainNodeRef.current.gain.exponentialRampToValueAtTime(
        0.001,
        audioContextRef.current?.currentTime ?? 0 + 0.05
      );
      setTimeout(() => {
        oscillatorRef.current?.stop();
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      }, 50);
    }
  }, []);

  const createSparks = useCallback(() => {
    const newSparks: Spark[] = [];
    for (let i = 0; i < 8; i++) {
      newSparks.push({
        x: 150 + Math.random() * 20 - 10,
        y: 80,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 2,
        life: 1,
        maxLife: 20 + Math.random() * 20,
      });
    }
    setSparks((prev) => [...prev, ...newSparks]);
  }, []);

  const handleKeyDown = useCallback(() => {
    if (isKeyDown || isTransmitting) return;
    setIsKeyDown(true);
    keyDownTimeRef.current = Date.now();
    playTone();
    createSparks();

    sparkIntervalRef.current = setInterval(createSparks, 100);
  }, [isKeyDown, isTransmitting, playTone, createSparks]);

  const handleKeyUp = useCallback(() => {
    if (!isKeyDown) return;
    setIsKeyDown(false);
    stopTone();

    if (sparkIntervalRef.current) {
      clearInterval(sparkIntervalRef.current);
      sparkIntervalRef.current = null;
    }

    const duration = Date.now() - keyDownTimeRef.current;
    const symbol = duration < DOT_THRESHOLD ? "." : "-";
    setCurrentSymbol(symbol);
    symbolsRef.current.push(symbol);

    setMorseOutput((prev) => prev + symbol);
    lastKeyUpTimeRef.current = Date.now();

    setTimeout(() => setCurrentSymbol(""), 200);
  }, [isKeyDown, stopTone]);

  useEffect(() => {
    const checkGap = setInterval(() => {
      if (!isKeyDown && symbolsRef.current.length > 0) {
        const gap = Date.now() - lastKeyUpTimeRef.current;
        if (gap > WORD_GAP) {
          setMorseOutput((prev) => (prev.endsWith(" / ") ? prev : prev + " / "));
          symbolsRef.current = [];
        } else if (gap > LETTER_GAP) {
          setMorseOutput((prev) => (prev.endsWith(" ") ? prev : prev + " "));
          symbolsRef.current = [];
        }
      }
    }, 100);

    return () => clearInterval(checkGap);
  }, [isKeyDown]);

  const textToMorse = (text: string): string => {
    return text
      .toUpperCase()
      .split("")
      .map((char) => MORSE_CODE[char] || "")
      .filter((code) => code)
      .join(" ");
  };

  const transmitText = useCallback(async () => {
    if (!textInput.trim() || isTransmitting) return;

    setIsTransmitting(true);
    setTransmittedText("");
    setMorseOutput("");

    const morse = textToMorse(textInput);
    const symbols = morse.split("");

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];

      await new Promise<void>((resolve) => {
        if (symbol === ".") {
          setCurrentSymbol(".");
          setMorseOutput((prev) => prev + ".");
          playTone();
          createSparks();
          transmitTimeoutRef.current = setTimeout(() => {
            stopTone();
            setCurrentSymbol("");
            resolve();
          }, 100);
        } else if (symbol === "-") {
          setCurrentSymbol("-");
          setMorseOutput((prev) => prev + "-");
          playTone();
          createSparks();
          const sparkInt = setInterval(createSparks, 100);
          transmitTimeoutRef.current = setTimeout(() => {
            clearInterval(sparkInt);
            stopTone();
            setCurrentSymbol("");
            resolve();
          }, 300);
        } else if (symbol === " ") {
          setMorseOutput((prev) => prev + " ");
          transmitTimeoutRef.current = setTimeout(resolve, 200);
        } else if (symbol === "/") {
          setMorseOutput((prev) => prev + " / ");
          transmitTimeoutRef.current = setTimeout(resolve, 400);
        } else {
          resolve();
        }
      });

      await new Promise<void>((resolve) => {
        transmitTimeoutRef.current = setTimeout(resolve, 100);
      });
    }

    setTransmittedText(textInput);
    setIsTransmitting(false);
  }, [textInput, isTransmitting, playTone, stopTone, createSparks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(20, 100, 260, 60);
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(25, 105, 250, 50);

      ctx.fillStyle = isKeyDown ? "#ff6b00" : "#8b4513";
      ctx.beginPath();
      ctx.arc(150, isKeyDown ? 85 : 80, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#654321";
      ctx.fillRect(140, isKeyDown ? 85 : 80, 20, 40);

      if (isKeyDown) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff6b00";
        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(150, 70, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      setSparks((prevSparks) => {
        const updatedSparks = prevSparks
          .map((spark) => ({
            ...spark,
            x: spark.x + spark.vx,
            y: spark.y + spark.vy,
            vy: spark.vy + 0.2,
            life: spark.life + 1,
          }))
          .filter((spark) => spark.life < spark.maxLife);

        updatedSparks.forEach((spark) => {
          const alpha = 1 - spark.life / spark.maxLife;
          ctx.fillStyle = `rgba(255, 170, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });

        return updatedSparks;
      });

      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(10, 160, 280, 30);
      ctx.fillStyle = "#333";
      ctx.fillRect(15, 165, 270, 20);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isKeyDown]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        handleKeyDown();
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleKeyUp();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("keyup", handleGlobalKeyUp);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("keyup", handleGlobalKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    return () => {
      if (transmitTimeoutRef.current) {
        clearTimeout(transmitTimeoutRef.current);
      }
      if (sparkIntervalRef.current) {
        clearInterval(sparkIntervalRef.current);
      }
    };
  }, []);

  const clearOutput = () => {
    setMorseOutput("");
    setTransmittedText("");
    symbolsRef.current = [];
  };

  return (
    <FeatureWrapper day={430} title="Pixel Morse Code Telegraph" emoji="📡">
      <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            The Original Internet 📠
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            Before WiFi, before dial-up, there was this. Click & hold the key (or press spacebar) to
            transmit.
          </p>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="rounded-lg border-4 cursor-pointer select-none"
            style={{ borderColor: "var(--color-border)", backgroundColor: "#1a1a1a" }}
            onMouseDown={handleKeyDown}
            onMouseUp={handleKeyUp}
            onMouseLeave={handleKeyUp}
            onTouchStart={(e) => {
              e.preventDefault();
              handleKeyDown();
            }}
            onTouchEnd={handleKeyUp}
          />
          {currentSymbol && (
            <div
              className="absolute top-2 right-2 text-4xl font-bold animate-pulse"
              style={{ color: "#ffaa00", textShadow: "0 0 10px #ff6b00" }}
            >
              {currentSymbol === "." ? "•" : "—"}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <div
            className={`w-4 h-4 rounded-full ${isKeyDown ? "animate-pulse" : ""}`}
            style={{ backgroundColor: isKeyDown ? "#00ff00" : "#333" }}
          />
          <span className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            {isKeyDown ? "TRANSMITTING..." : "Ready"}
          </span>
        </div>

        <div
          className="w-full p-4 rounded-lg min-h-24"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold" style={{ color: "var(--color-accent)" }}>
              MORSE OUTPUT
            </span>
            <button
              onClick={clearOutput}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: "var(--color-border)",
                color: "var(--color-text-dim)",
              }}
            >
              Clear
            </button>
          </div>
          <p
            className="font-mono text-lg break-all"
            style={{ color: "var(--color-text)", letterSpacing: "0.2em" }}
          >
            {morseOutput || "_._._ Start tapping! _._._"}
          </p>
        </div>

        <div className="w-full">
          <div className="flex gap-2 items-center mb-2">
            <span className="text-xs font-bold" style={{ color: "var(--color-accent)" }}>
              AUTO-TRANSMIT
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
              (paste text and watch it transmit)
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              disabled={isTransmitting}
            />
            <button
              onClick={transmitText}
              disabled={isTransmitting || !textInput.trim()}
              className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isTransmitting ? "📡..." : "Transmit"}
            </button>
          </div>
          {transmittedText && (
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-dim)" }}>
              ✓ Transmitted: {'"'}{transmittedText}{'"'}
            </p>
          )}
        </div>

        <div
          className="w-full p-4 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <span className="text-xs font-bold block mb-2" style={{ color: "var(--color-accent)" }}>
            QUICK REFERENCE
          </span>
          <div className="grid grid-cols-6 gap-2 text-xs font-mono">
            {["S", "O", "S", ".", ".", "."].map((char, i) => (
              <div key={i} className="text-center">
                <span style={{ color: "var(--color-text)" }}>{["S", "O", "S", ".", ",", "?"][i]}</span>
                <span className="block" style={{ color: "var(--color-text-dim)" }}>
                  {["...", "---", "...", ".-.-.-", "--..--", "..--.."][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs" style={{ color: "var(--color-text-dim)" }}>
          <p>🎵 Tip: Short press = dot (•) | Long press = dash (—)</p>
          <p className="mt-1">Fun fact: &quot;SOS&quot; was chosen because ••• --- ••• is easy to remember!</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}