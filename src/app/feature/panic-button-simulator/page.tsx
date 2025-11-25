"use client";

import { useState, useEffect, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface PanicButton {
  id: string;
  label: string;
  color: string;
  hoverColor: string;
  activeColor: string;
  emoji: string;
  soundEffect: string;
  shakeIntensity: number;
  chaos: () => void;
}

export default function PanicButtonSimulator() {
  const [activePanic, setActivePanic] = useState<string | null>(null);
  const [panicLevel, setPanicLevel] = useState(0);
  const [screenShake, setScreenShake] = useState(0);
  const [alerts, setAlerts] = useState<Array<{ id: number; message: string; style: string }>>([]);
  const [sirens, setSirens] = useState<Array<{ id: number; position: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const alertIdRef = useRef(0);
  const sirenIdRef = useRef(0);

  const panicButtons: PanicButton[] = [
    {
      id: "emergency",
      label: "EMERGENCY STOP",
      color: "bg-red-600",
      hoverColor: "hover:bg-red-700",
      activeColor: "active:bg-red-800",
      emoji: "🚨",
      soundEffect: "WOOP WOOP WOOP",
      shakeIntensity: 10,
      chaos: () => {
        addAlert("⚠️ SYSTEM HALTED ⚠️", "text-red-600");
        addAlert("ALL PROCESSES TERMINATED", "text-yellow-500");
        flashBackground("bg-red-500");
      }
    },
    {
      id: "nuclear",
      label: "LAUNCH CODES",
      color: "bg-yellow-600",
      hoverColor: "hover:bg-yellow-700",
      activeColor: "active:bg-yellow-800",
      emoji: "☢️",
      soundEffect: "DEFCON 1 INITIATED",
      shakeIntensity: 20,
      chaos: () => {
        addAlert("🚀 MISSILES ARMED 🚀", "text-yellow-600");
        addAlert("T-MINUS 10 SECONDS", "text-orange-600");
        addAlert("THIS IS NOT A DRILL", "text-red-600");
        addSiren();
        flashBackground("bg-yellow-500");
      }
    },
    {
      id: "fire",
      label: "FIRE ALARM",
      color: "bg-orange-600",
      hoverColor: "hover:bg-orange-700",
      activeColor: "active:bg-orange-800",
      emoji: "🔥",
      soundEffect: "BEEP BEEP BEEP",
      shakeIntensity: 8,
      chaos: () => {
        addAlert("🔥 FIRE DETECTED 🔥", "text-orange-600");
        addAlert("EVACUATE IMMEDIATELY", "text-red-600");
        addSiren();
        flashBackground("bg-orange-500");
      }
    },
    {
      id: "self-destruct",
      label: "SELF DESTRUCT",
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      activeColor: "active:bg-purple-800",
      emoji: "💥",
      soundEffect: "COUNTDOWN INITIATED",
      shakeIntensity: 25,
      chaos: () => {
        addAlert("💀 SELF DESTRUCT SEQUENCE 💀", "text-purple-600");
        addAlert("10... 9... 8...", "text-white");
        addAlert("WHY DID YOU DO THIS?!", "text-pink-600");
        flashBackground("bg-purple-500");
        setTimeout(() => explodeScreen(), 1000);
      }
    },
    {
      id: "alien",
      label: "ALIEN INVASION",
      color: "bg-green-600",
      hoverColor: "hover:bg-green-700",
      activeColor: "active:bg-green-800",
      emoji: "👽",
      soundEffect: "TAKE ME TO YOUR LEADER",
      shakeIntensity: 15,
      chaos: () => {
        addAlert("👽 THEY'RE HERE 👽", "text-green-600");
        addAlert("BEAM ME UP!", "text-cyan-500");
        addAlert("RESISTANCE IS FUTILE", "text-green-400");
        addSiren();
        flashBackground("bg-green-500");
      }
    },
    {
      id: "chaos",
      label: "PURE CHAOS",
      color: "bg-gradient-to-r from-red-600 via-purple-600 to-blue-600",
      hoverColor: "hover:from-red-700 hover:via-purple-700 hover:to-blue-700",
      activeColor: "active:from-red-800 active:via-purple-800 active:to-blue-800",
      emoji: "🌀",
      soundEffect: "AHHHHHHHHHHHHH",
      shakeIntensity: 30,
      chaos: () => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            addAlert(randomChaosMessage(), randomTextColor());
            if (i % 2 === 0) addSiren();
          }, i * 100);
        }
        flashBackground("bg-gradient-to-r from-red-500 via-purple-500 to-blue-500");
      }
    }
  ];

  const addAlert = (message: string, style: string) => {
    const id = alertIdRef.current++;
    setAlerts(prev => [...prev, { id, message, style }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 3000);
  };

  const addSiren = () => {
    const id = sirenIdRef.current++;
    const positions = ["top-10 left-10", "top-10 right-10", "bottom-10 left-10", "bottom-10 right-10"];
    const position = positions[Math.floor(Math.random() * positions.length)];
    setSirens(prev => [...prev, { id, position }]);
    setTimeout(() => {
      setSirens(prev => prev.filter(s => s.id !== id));
    }, 2000);
  };

  const flashBackground = (bgClass: string) => {
    if (containerRef.current) {
      containerRef.current.classList.add(bgClass);
      setTimeout(() => {
        containerRef.current?.classList.remove(bgClass);
      }, 200);
    }
  };

  const explodeScreen = () => {
    setScreenShake(50);
    addAlert("💥💥💥 BOOM 💥💥💥", "text-yellow-500 text-6xl");
    setTimeout(() => setScreenShake(0), 1000);
  };

  const randomChaosMessage = () => {
    const messages = ["PANIC!!!", "ERROR 404", "BLUE SCREEN", "KERNEL PANIC", "IT'S FINE", "EVERYTHING IS FINE", "AAAAAAAA", "HELP", "WHY", "CHAOS REIGNS"];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const randomTextColor = () => {
    const colors = ["text-red-500", "text-blue-500", "text-green-500", "text-yellow-500", "text-purple-500", "text-pink-500", "text-cyan-500"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePanic = (button: PanicButton) => {
    setActivePanic(button.id);
    setPanicLevel(prev => Math.min(prev + 1, 10));
    setScreenShake(button.shakeIntensity);
    
    // Sound effect text
    addAlert(button.soundEffect, "text-white text-2xl font-bold");
    
    // Execute chaos
    button.chaos();
    
    // Reset shake after animation
    setTimeout(() => {
      setScreenShake(0);
      setActivePanic(null);
    }, 500);
  };

  useEffect(() => {
    if (panicLevel > 0) {
      const timer = setTimeout(() => {
        setPanicLevel(prev => Math.max(0, prev - 1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [panicLevel]);

  return (
    <FeatureWrapper day={360} title="Panic Button Simulator" emoji="🚨">
      <div 
        ref={containerRef}
        className="relative min-h-[600px] p-8 overflow-hidden transition-all duration-200"
        style={{
          transform: screenShake > 0 ? `translate(${Math.random() * screenShake - screenShake/2}px, ${Math.random() * screenShake - screenShake/2}px)` : 'none'
        }}
      >
        {/* Panic Level Indicator */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Panic Level: {panicLevel}/10
          </h2>
          <div className="w-full max-w-md mx-auto h-4 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                panicLevel > 7 ? 'bg-red-500' : panicLevel > 4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${panicLevel * 10}%` }}
            />
          </div>
        </div>

        {/* Panic Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {panicButtons.map(button => (
            <button
              key={button.id}
              onClick={() => handlePanic(button)}
              className={`
                relative group p-8 rounded-xl transition-all duration-150 transform
                ${button.color} ${button.hoverColor} ${button.activeColor}
                hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl
                ${activePanic === button.id ? 'animate-pulse' : ''}
              `}
            >
              <div className="text-6xl mb-4">{button.emoji}</div>
              <div className="text-xl font-bold text-white">{button.label}</div>
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-active:opacity-20 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Floating Alerts */}
        <div className="fixed inset-0 pointer-events-none">
          {alerts.map((alert, index) => (
            <div
              key={alert.id}
              className={`absolute animate-bounce ${alert.style} font-bold`}
              style={{
                top: `${20 + (index % 5) * 15}%`,
                left: `${10 + Math.random() * 60}%`,
                animation: `float-up 3s ease-out`,
              }}
            >
              {alert.message}
            </div>
          ))}
        </div>

        {/* Sirens */}
        {sirens.map(siren => (
          <div
            key={siren.id}
            className={`fixed ${siren.position} w-16 h-16 animate-spin`}
          >
            <div className="w-full h-full bg-red-500 rounded-full animate-pulse" />
          </div>
        ))}

        {/* Instructions */}
        <div className="mt-12 text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
          <p className="mb-2">Press the buttons. Embrace the chaos. Feel the panic.</p>
          <p>Warning: Digital destruction only. No actual emergencies will be triggered.</p>
          {panicLevel > 7 && (
            <p className="mt-4 text-red-500 animate-pulse text-lg">
              MAXIMUM PANIC APPROACHING! KEEP GOING!
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            transform: translateY(-20px) scale(1);
            opacity: 1;
          }
          90% {
            transform: translateY(-200px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-250px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </FeatureWrapper>
  );
}