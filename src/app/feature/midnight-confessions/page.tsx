"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Confession {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
  angle: number;
  unlockHour: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

const sampleConfessions = [
  { text: "I still sleep with my childhood teddy bear. I'm 34.", unlockHour: 18 },
  { text: "I pretend to work from home but I mostly nap.", unlockHour: 18 },
  { text: "I told everyone I quit smoking. I didn't.", unlockHour: 19 },
  { text: "I'm in love with my best friend's ex.", unlockHour: 19 },
  { text: "I eat cereal for dinner more than real food.", unlockHour: 20 },
  { text: "I've been faking my accent for 5 years.", unlockHour: 20 },
  { text: "I cried watching a commercial yesterday.", unlockHour: 21 },
  { text: "I still don't know what I want to be when I grow up.", unlockHour: 21 },
  { text: "I haven't washed my sheets in... too long.", unlockHour: 22 },
  { text: "I pretend my phone died to avoid calls from my mom.", unlockHour: 22 },
  { text: "I'm terrified everyone secretly hates me.", unlockHour: 23 },
  { text: "I've never finished a book I started.", unlockHour: 23 },
  { text: "I talk to my plants like they're my friends.", unlockHour: 0 },
  { text: "I peaked in high school and I know it.", unlockHour: 0 },
  { text: "Sometimes I sit in my car for 20 minutes before going inside.", unlockHour: 1 },
  { text: "I've been wearing the same socks for three days.", unlockHour: 2 },
  { text: "I rehearse conversations that will never happen.", unlockHour: 3 },
  { text: "I'm jealous of my dog's simple life.", unlockHour: 4 },
];

export default function MidnightConfessions() {
  const [currentHour, setCurrentHour] = useState<number>(12);
  const [isNight, setIsNight] = useState(false);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedConfession, setSelectedConfession] = useState<Confession | null>(null);
  const [newConfession, setNewConfession] = useState("");
  const [userConfessions, setUserConfessions] = useState<string[]>([]);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const isNightTime = useCallback((hour: number) => {
    return hour >= 18 || hour < 6;
  }, []);

  const getDarknessLevel = useCallback((hour: number) => {
    if (hour >= 18 && hour < 21) return 1;
    if (hour >= 21 && hour < 24) return 2;
    if (hour >= 0 && hour < 3) return 3;
    if (hour >= 3 && hour < 6) return 2;
    return 0;
  }, []);

  const getUnlockedConfessions = useCallback((hour: number) => {
    const allConfessions = [...sampleConfessions, ...userConfessions.map(text => ({ text, unlockHour: 18 }))];
    return allConfessions.filter(c => {
      if (hour >= 18) {
        return c.unlockHour <= hour || c.unlockHour < 6;
      } else if (hour < 6) {
        return c.unlockHour >= 18 || c.unlockHour <= hour;
      }
      return false;
    });
  }, [userConfessions]);

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      setIsNight(isNightTime(hour));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [isNightTime]);

  useEffect(() => {
    const starCount = 100 + getDarknessLevel(currentHour) * 50;
    const newStars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        twinkle: Math.random() * 2 + 1,
      });
    }
    setStars(newStars);
  }, [currentHour, getDarknessLevel]);

  useEffect(() => {
    if (!isNight) return;

    const unlocked = getUnlockedConfessions(currentHour);
    const initialConfessions: Confession[] = unlocked.map((c, i) => ({
      id: i,
      text: c.text,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      speed: Math.random() * 0.02 + 0.01,
      opacity: Math.random() * 0.4 + 0.3,
      size: Math.random() * 0.3 + 0.8,
      angle: Math.random() * Math.PI * 2,
      unlockHour: c.unlockHour,
    }));
    setConfessions(initialConfessions);
  }, [isNight, currentHour, getUnlockedConfessions]);

  useEffect(() => {
    if (!isNight) return;

    const animate = () => {
      setConfessions(prev => prev.map(c => ({
        ...c,
        x: c.x + Math.sin(c.angle) * c.speed,
        y: c.y + Math.cos(c.angle) * c.speed * 0.5,
        angle: c.angle + 0.001,
        opacity: Math.max(0.2, Math.min(0.7, c.opacity + Math.sin(Date.now() / 1000 + c.id) * 0.01)),
      })));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isNight]);

  const handleSubmitConfession = () => {
    if (newConfession.trim().length < 5) return;
    setUserConfessions(prev => [...prev, newConfession.trim()]);
    setNewConfession("");
    setShowSubmitSuccess(true);
    setTimeout(() => setShowSubmitSuccess(false), 3000);
  };

  const darknessLevel = getDarknessLevel(currentHour);
  const bgGradient = isNight
    ? darknessLevel === 3
      ? "linear-gradient(to bottom, #0a0a1a, #1a1a2e)"
      : darknessLevel === 2
        ? "linear-gradient(to bottom, #1a1a3a, #2a2a4e)"
        : "linear-gradient(to bottom, #2a2a4a, #3a3a5e)"
    : "linear-gradient(to bottom, #87CEEB, #E0F6FF)";

  return (
    <FeatureWrapper day={360} title="Midnight Confessions" emoji="🌙">
      <div
        ref={containerRef}
        className="relative min-h-[600px] rounded-2xl overflow-hidden"
        style={{ background: bgGradient }}
      >
        {/* Stars */}
        {isNight && stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDuration: `${star.twinkle}s`,
              opacity: 0.8,
            }}
          />
        ))}

        {/* Moon */}
        {isNight && (
          <div
            className="absolute top-8 right-12 w-16 h-16 rounded-full"
            style={{
              background: "radial-gradient(circle at 30% 30%, #ffffd0, #f0e68c)",
              boxShadow: "0 0 40px rgba(255, 255, 200, 0.5)",
            }}
          />
        )}

        {/* Floating Confessions */}
        {isNight && confessions.map(confession => (
          <button
            key={confession.id}
            onClick={() => setSelectedConfession(confession)}
            className="absolute cursor-pointer transition-transform hover:scale-110 focus:outline-none text-left"
            style={{
              left: `${confession.x}%`,
              top: `${confession.y}%`,
              opacity: confession.opacity,
              transform: `scale(${confession.size})`,
            }}
          >
            <div
              className="px-3 py-2 rounded-full max-w-[200px] truncate text-sm"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(4px)",
                color: "rgba(255, 255, 255, 0.8)",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {confession.text.slice(0, 30)}...
            </div>
          </button>
        ))}

        {/* Daytime Message */}
        {!isNight && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">☀️</div>
            <h2
              className="text-3xl font-bold mb-4 font-serif text-gray-900"
            >
              The confession booth is closed...
            </h2>
            <p className="text-lg max-w-md text-gray-700">
              Secrets only whisper in the darkness. Come back after 6 PM when the sun sets
              and the night unlocks its mysteries.
            </p>
            <div className="mt-6 px-6 py-3 rounded-full bg-white/50 text-gray-900">
              Current time: {currentHour}:00 • Opens at 18:00
            </div>
          </div>
        )}

        {/* Night UI */}
        {isNight && (
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {/* Confession Input */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <p
                className="text-white/60 text-sm mb-2 font-serif"
              >
                Whisper your secret into the void...
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConfession}
                  onChange={e => setNewConfession(e.target.value)}
                  placeholder="Type your confession..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  maxLength={200}
                />
                <button
                  onClick={handleSubmitConfession}
                  disabled={newConfession.trim().length < 5}
                  className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-40 text-white"
                  style={{
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                  }}
                >
                  Release
                </button>
              </div>
              {showSubmitSuccess && (
                <p className="text-green-400 text-sm mt-2 animate-pulse">
                  ✨ Your confession drifts into the night...
                </p>
              )}
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center text-white/60 text-sm">
              <span>
                🌙 Darkness Level: {"🔮".repeat(darknessLevel)} ({darknessLevel}/3)
              </span>
              <span>
                {confessions.length} whispers floating • {currentHour}:00
              </span>
            </div>
          </div>
        )}

        {/* Selected Confession Modal */}
        {selectedConfession && (
          <div
            className="absolute inset-0 flex items-center justify-center p-8"
            style={{ background: "rgba(0, 0, 0, 0.7)" }}
            onClick={() => setSelectedConfession(null)}
          >
            <div
              className="max-w-md p-8 rounded-2xl text-center"
              style={{
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-4xl mb-4">🤫</div>
              <p
                className="text-xl text-white mb-6 leading-relaxed font-serif"
              >
                &ldquo;{selectedConfession.text}&rdquo;
              </p>
              <button
                onClick={() => setSelectedConfession(null)}
                className="px-6 py-2 rounded-full text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              >
                Let it drift away...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-gray-500">
        <p className="text-sm">
          {isNight
            ? "Click on the glowing whispers to read strangers' secrets. The later it gets, the darker the confessions..."
            : "This digital confession booth awakens at dusk. Return when darkness falls to share and discover secrets."}
        </p>
      </div>
    </FeatureWrapper>
  );
}