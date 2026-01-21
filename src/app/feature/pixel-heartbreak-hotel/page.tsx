"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Heart {
  id: number;
  x: number;
  y: number;
  floor: number;
  room: number;
  healProgress: number;
  color: string;
  crackOffset: number;
  checkInTime: number;
  isHealed: boolean;
  pulsePhase: number;
}

const FLOORS = 4;
const ROOMS_PER_FLOOR = 5;
const HEAL_DURATION = 15000;

const heartColors = [
  { broken: "#8B4B6B", healing: "#C77B9B", healed: "#FF6B9D" },
  { broken: "#6B4B8B", healing: "#9B7BC7", healed: "#B56BFF" },
  { broken: "#4B6B8B", healing: "#7B9BC7", healed: "#6BB5FF" },
  { broken: "#8B6B4B", healing: "#C79B7B", healed: "#FFB56B" },
];

export default function PixelHeartbreakHotel() {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [totalCheckedOut, setTotalCheckedOut] = useState(0);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const heartIdRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  const findEmptyRoom = useCallback((): { floor: number; room: number } | null => {
    const occupiedRooms = new Set(hearts.filter(h => !h.isHealed).map(h => `${h.floor}-${h.room}`));
    
    for (let floor = FLOORS - 1; floor >= 0; floor--) {
      for (let room = 0; room < ROOMS_PER_FLOOR; room++) {
        if (!occupiedRooms.has(`${floor}-${room}`)) {
          return { floor, room };
        }
      }
    }
    return null;
  }, [hearts]);

  const addHeart = useCallback(() => {
    const emptyRoom = findEmptyRoom();
    if (!emptyRoom) return;

    const colorSet = heartColors[Math.floor(Math.random() * heartColors.length)];
    const newHeart: Heart = {
      id: heartIdRef.current++,
      x: emptyRoom.room * 80 + 40,
      y: emptyRoom.floor * 100 + 50,
      floor: emptyRoom.floor,
      room: emptyRoom.room,
      healProgress: 0,
      color: colorSet.broken,
      crackOffset: Math.random() * 5,
      checkInTime: Date.now(),
      isHealed: false,
      pulsePhase: Math.random() * Math.PI * 2,
    };

    setHearts(prev => [...prev, newHeart]);
  }, [findEmptyRoom]);

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      
      setHearts(prev => {
        const updated = prev.map(heart => {
          if (heart.isHealed) return heart;
          
          const elapsed = now - heart.checkInTime;
          const progress = Math.min(elapsed / HEAL_DURATION, 1);
          const colorSet = heartColors[Math.floor(heart.crackOffset) % heartColors.length];
          
          let color;
          if (progress < 0.5) {
            const t = progress * 2;
            color = lerpColor(colorSet.broken, colorSet.healing, t);
          } else {
            const t = (progress - 0.5) * 2;
            color = lerpColor(colorSet.healing, colorSet.healed, t);
          }
          
          return {
            ...heart,
            healProgress: progress,
            color,
            pulsePhase: heart.pulsePhase + 0.05,
            isHealed: progress >= 1,
          };
        });

        const healedHearts = updated.filter(h => h.isHealed && h.healProgress >= 1);
        if (healedHearts.length > 0) {
          setTimeout(() => {
            setHearts(p => p.filter(h => !healedHearts.find(hh => hh.id === h.id)));
            setTotalCheckedOut(prev => prev + healedHearts.length);
          }, 2000);
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const lerpColor = (color1: string, color2: string, t: number): string => {
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const renderPixelHeart = (heart: Heart) => {
    const scale = 1 + Math.sin(heart.pulsePhase) * 0.05 * (1 - heart.healProgress * 0.5);
    const crackWidth = (1 - heart.healProgress) * 3;
    const glow = heart.healProgress > 0.8 ? (heart.healProgress - 0.8) * 5 : 0;
    
    return (
      <div
        key={heart.id}
        className="absolute transition-transform duration-300"
        style={{
          left: `${heart.room * 20 + 10}%`,
          top: `${(FLOORS - 1 - heart.floor) * 25 + 12.5}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          filter: glow > 0 ? `drop-shadow(0 0 ${glow * 10}px ${heart.color})` : undefined,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" className="pixel-heart">
          {/* Left half of heart */}
          <rect x="4" y="8" width="4" height="4" fill={heart.color} />
          <rect x="8" y="4" width="4" height="4" fill={heart.color} />
          <rect x="12" y="4" width="4" height="4" fill={heart.color} />
          <rect x="4" y="12" width="4" height="4" fill={heart.color} />
          <rect x="8" y="8" width="4" height="4" fill={heart.color} />
          <rect x="12" y="8" width="4" height="4" fill={heart.color} />
          <rect x="8" y="12" width="4" height="4" fill={heart.color} />
          <rect x="12" y="12" width="4" height="4" fill={heart.color} />
          <rect x="8" y="16" width="4" height="4" fill={heart.color} />
          <rect x="12" y="16" width="4" height="4" fill={heart.color} />
          <rect x="12" y="20" width="4" height="4" fill={heart.color} />
          
          {/* Right half of heart */}
          <rect x="16" y="4" width="4" height="4" fill={heart.color} />
          <rect x="20" y="4" width="4" height="4" fill={heart.color} />
          <rect x="24" y="8" width="4" height="4" fill={heart.color} />
          <rect x="16" y="8" width="4" height="4" fill={heart.color} />
          <rect x="20" y="8" width="4" height="4" fill={heart.color} />
          <rect x="24" y="12" width="4" height="4" fill={heart.color} />
          <rect x="16" y="12" width="4" height="4" fill={heart.color} />
          <rect x="20" y="12" width="4" height="4" fill={heart.color} />
          <rect x="16" y="16" width="4" height="4" fill={heart.color} />
          <rect x="20" y="16" width="4" height="4" fill={heart.color} />
          <rect x="16" y="20" width="4" height="4" fill={heart.color} />
          <rect x="16" y="24" width="4" height="4" fill={heart.color} />
          
          {/* Crack line (fades as heart heals) */}
          {crackWidth > 0.5 && (
            <>
              <rect x="14" y="6" width={crackWidth} height="4" fill="var(--color-bg)" style={{ opacity: 1 - heart.healProgress }} />
              <rect x="15" y="10" width={crackWidth} height="4" fill="var(--color-bg)" style={{ opacity: 1 - heart.healProgress }} />
              <rect x="14" y="14" width={crackWidth} height="4" fill="var(--color-bg)" style={{ opacity: 1 - heart.healProgress }} />
              <rect x="15" y="18" width={crackWidth} height="4" fill="var(--color-bg)" style={{ opacity: 1 - heart.healProgress }} />
            </>
          )}
          
          {/* Sparkles when almost healed */}
          {heart.healProgress > 0.9 && (
            <>
              <rect x="2" y="2" width="2" height="2" fill="#FFD700" style={{ opacity: Math.sin(heart.pulsePhase * 3) * 0.5 + 0.5 }} />
              <rect x="28" y="6" width="2" height="2" fill="#FFD700" style={{ opacity: Math.cos(heart.pulsePhase * 3) * 0.5 + 0.5 }} />
              <rect x="6" y="24" width="2" height="2" fill="#FFD700" style={{ opacity: Math.sin(heart.pulsePhase * 3 + 1) * 0.5 + 0.5 }} />
            </>
          )}
        </svg>
        
        {/* Progress bar */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div 
            className="h-full transition-all duration-100 rounded-full"
            style={{ 
              width: `${heart.healProgress * 100}%`,
              backgroundColor: heart.color,
            }}
          />
        </div>
        
        {/* Checkout sparkle */}
        {heart.isHealed && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs animate-bounce">✨</div>
        )}
      </div>
    );
  };

  const activeHearts = hearts.filter(h => !h.isHealed).length;
  const healingHearts = hearts.filter(h => h.healProgress > 0 && h.healProgress < 1).length;

  return (
    <FeatureWrapper day={417} title="Pixel Heartbreak Hotel" emoji="💔">
      <div className="flex flex-col items-center gap-6 p-4 min-h-[600px]">
        <div className="text-center max-w-md">
          <h2 
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Welcome to the Heartbreak Hotel 🏨
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="text-sm">
            Every broken heart deserves a cozy room to heal. Click below to check in a heart — 
            watch it slowly mend, piece by piece, until it&apos;s ready to check out whole again.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>{activeHearts}</div>
            <div style={{ color: "var(--color-text-dim)" }}>Guests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#FF6B9D" }}>{healingHearts}</div>
            <div style={{ color: "var(--color-text-dim)" }}>Healing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#6BFF9D" }}>{totalCheckedOut}</div>
            <div style={{ color: "var(--color-text-dim)" }}>Checked Out</div>
          </div>
        </div>

        {/* Hotel Building */}
        <div 
          className="relative w-full max-w-lg rounded-lg overflow-hidden"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)",
            border: "2px solid var(--color-border)",
            height: "400px",
          }}
        >
          {/* Hotel Sign */}
          <div 
            className="absolute -top-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-lg text-xs font-bold tracking-wider z-10"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            HEARTBREAK HOTEL
          </div>

          {/* Floors */}
          {Array.from({ length: FLOORS }).map((_, floorIndex) => (
            <div 
              key={floorIndex}
              className="absolute w-full flex"
              style={{ 
                top: `${floorIndex * 25}%`,
                height: "25%",
                borderBottom: "2px solid var(--color-border)",
              }}
            >
              {/* Floor number */}
              <div 
                className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold"
                style={{ color: "var(--color-text-dim)" }}
              >
                {FLOORS - floorIndex}F
              </div>

              {/* Rooms */}
              {Array.from({ length: ROOMS_PER_FLOOR }).map((_, roomIndex) => {
                const roomKey = `${FLOORS - 1 - floorIndex}-${roomIndex}`;
                const isOccupied = hearts.some(h => !h.isHealed && h.floor === FLOORS - 1 - floorIndex && h.room === roomIndex);
                const isHovered = hoveredRoom === roomKey;
                
                return (
                  <div
                    key={roomIndex}
                    className="relative flex-1 border-r transition-colors duration-200"
                    style={{ 
                      borderColor: "var(--color-border)",
                      backgroundColor: isHovered && !isOccupied ? "rgba(255,107,157,0.1)" : undefined,
                    }}
                    onMouseEnter={() => setHoveredRoom(roomKey)}
                    onMouseLeave={() => setHoveredRoom(null)}
                  >
                    {/* Window */}
                    <div 
                      className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-sm"
                      style={{ 
                        backgroundColor: isOccupied ? "rgba(255,200,100,0.3)" : "rgba(100,150,200,0.2)",
                        boxShadow: isOccupied ? "0 0 10px rgba(255,200,100,0.3)" : undefined,
                      }}
                    />
                    
                    {/* Room number */}
                    <div 
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs"
                      style={{ color: "var(--color-text-dim)", fontSize: "10px" }}
                    >
                      {(FLOORS - floorIndex) * 100 + roomIndex + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Hearts */}
          {hearts.map(heart => renderPixelHeart(heart))}

          {/* Door at bottom */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 rounded-t-lg"
            style={{ 
              backgroundColor: "#8B4513",
              border: "2px solid #654321",
            }}
          >
            <div 
              className="absolute right-2 top-1/2 w-2 h-2 rounded-full"
              style={{ backgroundColor: "#FFD700" }}
            />
          </div>
        </div>

        {/* Check In Button */}
        <button
          onClick={addHeart}
          disabled={activeHearts >= FLOORS * ROOMS_PER_FLOOR}
          className="btn-primary px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          💔 Check In a Broken Heart
        </button>

        {activeHearts >= FLOORS * ROOMS_PER_FLOOR && (
          <p className="text-sm animate-pulse" style={{ color: "var(--color-text-dim)" }}>
            No vacancy! Wait for a heart to check out... 🚪
          </p>
        )}

        <p className="text-xs text-center max-w-sm" style={{ color: "var(--color-text-dim)" }}>
          Each heart heals at its own pace (~15 seconds). Watch as the cracks mend, 
          colors brighten, and sparkles appear when they&apos;re ready to leave whole again. 💝
        </p>
      </div>
    </FeatureWrapper>
  );
}