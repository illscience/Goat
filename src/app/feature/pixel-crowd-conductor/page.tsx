"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface PixelPerson {
  x: number;
  y: number;
  baseY: number;
  armAngle: number;
  targetArmAngle: number;
  lean: number;
  targetLean: number;
  jumpOffset: number;
  color: string;
  skinTone: string;
  excitement: number;
  phase: number;
  size: number;
}

export default function PixelCrowdConductor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const crowdRef = useRef<PixelPerson[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isClicking: false, lastMoveTime: 0 });
  const [isWild, setIsWild] = useState(false);
  const [crowdMood, setCrowdMood] = useState("Waiting...");

  const skinTones = ["#FFDAB9", "#E0AC69", "#C68642", "#8D5524", "#5C3317", "#FFE0BD"];
  const shirtColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"];

  const initCrowd = useCallback((width: number, height: number) => {
    const people: PixelPerson[] = [];
    const rows = 12;
    const cols = 25;
    const spacingX = width / (cols + 1);
    const spacingY = (height * 0.7) / rows;
    const startY = height * 0.25;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = (row % 2) * (spacingX / 2);
        people.push({
          x: spacingX + col * spacingX + offsetX + (Math.random() - 0.5) * 10,
          y: startY + row * spacingY,
          baseY: startY + row * spacingY,
          armAngle: 0,
          targetArmAngle: 0,
          lean: 0,
          targetLean: 0,
          jumpOffset: 0,
          color: shirtColors[Math.floor(Math.random() * shirtColors.length)],
          skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
          excitement: 0,
          phase: Math.random() * Math.PI * 2,
          size: 3 + Math.random() * 2 + (row * 0.3),
        });
      }
    }
    crowdRef.current = people;
  }, []);

  const drawPerson = useCallback((ctx: CanvasRenderingContext2D, person: PixelPerson, time: number) => {
    const { x, y, armAngle, lean, jumpOffset, color, skinTone, size, excitement, phase } = person;
    const actualY = y - jumpOffset;
    
    const wobble = Math.sin(time * 0.01 + phase) * excitement * 2;
    const actualX = x + lean * 8 + wobble;

    ctx.save();
    ctx.translate(actualX, actualY);

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(-size / 2, -size * 2, size, size * 2);

    // Head
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(0, -size * 2.8, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Arms based on angle
    ctx.fillStyle = skinTone;
    const armLength = size * 1.5;
    
    // Left arm
    ctx.save();
    ctx.translate(-size / 2, -size * 1.5);
    ctx.rotate(-armAngle - Math.PI / 4);
    ctx.fillRect(-2, 0, 3, armLength);
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(size / 2, -size * 1.5);
    ctx.rotate(armAngle + Math.PI / 4);
    ctx.fillRect(-1, 0, 3, armLength);
    ctx.restore();

    // Excited expression when wild
    if (excitement > 0.5) {
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(-size * 0.3, -size * 2.9, size * 0.15, 0, Math.PI * 2);
      ctx.arc(size * 0.3, -size * 2.9, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Open mouth
      ctx.beginPath();
      ctx.arc(0, -size * 2.5, size * 0.3, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        initCrowd(canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let lastTime = 0;
    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      ctx.fillStyle = "var(--color-bg-secondary)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stage/gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.25);

      // Spotlight effect following mouse
      const spotGradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 300
      );
      spotGradient.addColorStop(0, "rgba(255, 255, 200, 0.15)");
      spotGradient.addColorStop(1, "rgba(255, 255, 200, 0)");
      ctx.fillStyle = spotGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const timeSinceMove = time - mouse.lastMoveTime;
      const isActive = timeSinceMove < 500;

      // Update and draw crowd
      crowdRef.current.forEach((person) => {
        const dx = mouse.x - person.x;
        const dy = mouse.y - person.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / 400);

        // Calculate target states based on mouse
        if (isActive) {
          // Lean towards cursor horizontally
          person.targetLean = (dx / 200) * influence;
          
          // Arms up when cursor is above
          const verticalInfluence = Math.max(0, (canvas.height / 2 - mouse.y) / (canvas.height / 2));
          person.targetArmAngle = verticalInfluence * influence * (Math.PI * 0.8);
        } else {
          person.targetLean = 0;
          person.targetArmAngle = 0;
        }

        // Go wild on click
        if (mouse.isClicking) {
          person.excitement = Math.min(1, person.excitement + 0.1);
          person.targetArmAngle = Math.PI * 0.7 + Math.sin(time * 0.02 + person.phase) * 0.3;
          person.jumpOffset = Math.abs(Math.sin(time * 0.015 + person.phase)) * 15 * person.excitement;
        } else {
          person.excitement = Math.max(0, person.excitement - 0.02);
          person.jumpOffset *= 0.9;
        }

        // Smooth interpolation
        person.lean += (person.targetLean - person.lean) * 0.1;
        person.armAngle += (person.targetArmAngle - person.armAngle) * 0.15;

        drawPerson(ctx, person, time);
      });

      // Update mood text
      if (mouse.isClicking) {
        setCrowdMood("🎉 GOING ABSOLUTELY WILD! 🎉");
      } else if (crowdRef.current.some(p => p.armAngle > 1)) {
        setCrowdMood("Arms in the air like they just don't care!");
      } else if (Math.abs(crowdRef.current[0]?.lean || 0) > 0.3) {
        setCrowdMood("The crowd sways with you...");
      } else if (isActive) {
        setCrowdMood("They're watching your every move...");
      } else {
        setCrowdMood("Move your cursor to conduct the crowd");
      }

      setIsWild(mouse.isClicking);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [initCrowd, drawPerson]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.lastMoveTime = performance.now();
  }, []);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.isClicking = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.isClicking = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.isClicking = false;
  }, []);

  return (
    <FeatureWrapper day={408} title="Pixel Crowd Conductor" emoji="🎤">
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
        <div className="text-center mb-2">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            You are the maestro. They are your orchestra.
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Move your cursor to lead the crowd • Click and hold to make them go absolutely bonkers
          </p>
        </div>

        <div 
          className={`relative w-full rounded-xl overflow-hidden border-2 transition-all duration-300 ${
            isWild ? "border-yellow-400 shadow-lg shadow-yellow-400/30" : ""
          }`}
          style={{ 
            height: "500px",
            borderColor: isWild ? undefined : "var(--color-border)",
            background: "var(--color-bg-secondary)"
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full cursor-pointer"
          />
          
          <div 
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full transition-all duration-300 ${
              isWild ? "bg-yellow-400 text-black font-bold animate-pulse" : ""
            }`}
            style={{ 
              background: isWild ? undefined : "var(--color-bg)",
              color: isWild ? undefined : "var(--color-text)",
              border: `1px solid ${isWild ? "transparent" : "var(--color-border)"}`
            }}
          >
            {crowdMood}
          </div>
        </div>

        <div 
          className="text-center text-sm mt-2 px-4 py-2 rounded-lg"
          style={{ 
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-dim)"
          }}
        >
          <span className="font-semibold" style={{ color: "var(--color-accent)" }}>Pro tip:</span>
          {" "}Move up to raise their arms • Move side to side for the wave • Click for pure chaos
        </div>
      </div>
    </FeatureWrapper>
  );
}