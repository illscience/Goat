"use client";

import { useState, useEffect, useRef } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Layer {
  id: number;
  name: string;
  era: string;
  depth: number;
  pattern: number[];
  bpm: number;
  sound: string;
  color: string;
  discovered: boolean;
}

const layers: Layer[] = [
  { 
    id: 1, 
    name: "Digital Age", 
    era: "2000s", 
    depth: 10, 
    pattern: [1, 0, 0, 0, 1, 0, 0, 0], 
    bpm: 120, 
    sound: "kick",
    color: "from-purple-600 to-pink-600",
    discovered: false 
  },
  { 
    id: 2, 
    name: "Hip Hop Boom", 
    era: "1980s", 
    depth: 30, 
    pattern: [1, 0, 1, 0, 0, 0, 1, 0], 
    bpm: 90, 
    sound: "snare",
    color: "from-blue-600 to-cyan-600",
    discovered: false 
  },
  { 
    id: 3, 
    name: "Latin Clave", 
    era: "1950s", 
    depth: 50, 
    pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0], 
    bpm: 100, 
    sound: "clave",
    color: "from-red-600 to-orange-600",
    discovered: false 
  },
  { 
    id: 4, 
    name: "Jazz Swing", 
    era: "1920s", 
    depth: 70, 
    pattern: [1, 0, 1, 1, 0, 1], 
    bpm: 110, 
    sound: "hihat",
    color: "from-yellow-600 to-amber-600",
    discovered: false 
  },
  { 
    id: 5, 
    name: "African Polyrhythm", 
    era: "Ancient", 
    depth: 90, 
    pattern: [1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0], 
    bpm: 95, 
    sound: "djembe",
    color: "from-green-600 to-emerald-600",
    discovered: false 
  },
  { 
    id: 6, 
    name: "Primordial Pulse", 
    era: "Dawn of Time", 
    depth: 100, 
    pattern: [1], 
    bpm: 60, 
    sound: "heartbeat",
    color: "from-gray-600 to-stone-600",
    discovered: false 
  }
];

export default function RhythmArchaeology() {
  const [currentDepth, setCurrentDepth] = useState(0);
  const [discoveredLayers, setDiscoveredLayers] = useState<Layer[]>([]);
  const [isDigging, setIsDigging] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<number>>(new Set());
  const [currentBeats, setCurrentBeats] = useState<Map<number, number>>(new Map());
  const audioContext = useRef<AudioContext | null>(null);
  const intervalRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
      audioContext.current?.close();
    };
  }, []);

  const playSound = (sound: string) => {
    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    switch (sound) {
      case "kick":
        oscillator.frequency.setValueAtTime(60, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(0.8, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
        break;
      case "snare":
        oscillator.frequency.setValueAtTime(200, audioContext.current.currentTime);
        oscillator.type = "sawtooth";
        gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.05);
        break;
      case "clave":
        oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(0.4, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.02);
        break;
      case "hihat":
        oscillator.frequency.setValueAtTime(5000, audioContext.current.currentTime);
        oscillator.type = "square";
        gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.01);
        break;
      case "djembe":
        oscillator.frequency.setValueAtTime(150, audioContext.current.currentTime);
        oscillator.type = "triangle";
        gainNode.gain.setValueAtTime(0.6, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.15);
        break;
      case "heartbeat":
        oscillator.frequency.setValueAtTime(40, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(1, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2);
        break;
    }

    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.5);
  };

  const toggleLayer = (layerId: number) => {
    const newActiveLayers = new Set(activeLayers);
    if (activeLayers.has(layerId)) {
      newActiveLayers.delete(layerId);
      const interval = intervalRefs.current.get(layerId);
      if (interval) {
        clearInterval(interval);
        intervalRefs.current.delete(layerId);
      }
    } else {
      newActiveLayers.add(layerId);
      startPattern(layerId);
    }
    setActiveLayers(newActiveLayers);
  };

  const startPattern = (layerId: number) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    let beatIndex = 0;
    const interval = setInterval(() => {
      if (layer.pattern[beatIndex] === 1) {
        playSound(layer.sound);
      }
      setCurrentBeats(prev => new Map(prev).set(layerId, beatIndex));
      beatIndex = (beatIndex + 1) % layer.pattern.length;
    }, (60 / layer.bpm) * 1000);

    intervalRefs.current.set(layerId, interval);
  };

  const dig = () => {
    if (isDigging || currentDepth >= 100) return;

    setIsDigging(true);
    const digAmount = 5 + Math.random() * 10;
    const newDepth = Math.min(currentDepth + digAmount, 100);

    setTimeout(() => {
      setCurrentDepth(newDepth);
      
      const newlyDiscovered = layers.filter(
        layer => layer.depth <= newDepth && !discoveredLayers.find(d => d.id === layer.id)
      );
      
      if (newlyDiscovered.length > 0) {
        setDiscoveredLayers([...discoveredLayers, ...newlyDiscovered]);
        playSound("clave"); // Discovery sound
      }
      
      setIsDigging(false);
    }, 300);
  };

  return (
    <FeatureWrapper day={360} title="Rhythm Archaeology" emoji="🥁">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Excavate the History of Rhythm
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Click to dig through geological layers of sound. Each stratum reveals ancient beats.
          </p>
        </div>

        {/* Depth Meter */}
        <div className="bg-gradient-to-b from-amber-100 to-stone-900 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-stone-600"
                style={{ top: `${i * 10}%` }}
              />
            ))}
          </div>
          <div className="relative">
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: "var(--color-text)" }}>Surface</span>
              <span style={{ color: "var(--color-text-dim)" }}>Depth: {currentDepth.toFixed(1)}m</span>
              <span style={{ color: "var(--color-text)" }}>Core</span>
            </div>
            <div className="h-4 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-600 transition-all duration-300"
                style={{ width: `${currentDepth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dig Button */}
        <div className="text-center">
          <button
            onClick={dig}
            disabled={isDigging || currentDepth >= 100}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              isDigging
                ? "bg-stone-600 scale-95"
                : currentDepth >= 100
                ? "bg-stone-800 cursor-not-allowed opacity-50"
                : "btn-primary hover:scale-105"
            }`}
          >
            {isDigging ? "Digging..." : currentDepth >= 100 ? "Core Reached" : "🔨 Dig Deeper"}
          </button>
        </div>

        {/* Discovered Layers */}
        <div className="space-y-4">
          <h3
            className="text-xl font-bold text-center"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Discovered Rhythms
          </h3>
          
          <div className="grid gap-4">
            {discoveredLayers.map((layer) => (
              <div
                key={layer.id}
                className={`p-4 rounded-lg border transition-all ${
                  activeLayers.has(layer.id)
                    ? "border-2 scale-102"
                    : "border opacity-90"
                }`}
                style={{ 
                  borderColor: activeLayers.has(layer.id) ? "var(--color-accent)" : "var(--color-border)",
                  backgroundColor: "var(--color-bg-secondary)"
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 
                      className="text-lg font-bold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {layer.name}
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {layer.era} • {layer.bpm} BPM • {layer.depth}m deep
                    </p>
                  </div>
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeLayers.has(layer.id)
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    style={{ color: "white" }}
                  >
                    {activeLayers.has(layer.id) ? "Stop" : "Play"}
                  </button>
                </div>
                
                {/* Pattern Visualization */}
                <div className="flex gap-1">
                  {layer.pattern.map((beat, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-8 rounded transition-all ${
                        beat === 1
                          ? `bg-gradient-to-r ${layer.color}`
                          : "bg-stone-700"
                      } ${
                        activeLayers.has(layer.id) && currentBeats.get(layer.id) === index
                          ? "scale-125 shadow-lg"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {discoveredLayers.length === 0 && (
          <div 
            className="text-center py-12 text-lg"
            style={{ color: "var(--color-text-dim)" }}
          >
            Start digging to uncover ancient rhythms...
          </div>
        )}

        {currentDepth >= 100 && (
          <div 
            className="text-center py-8 px-4 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <h3 
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              🎉 Core Reached!
            </h3>
            <p style={{ color: "var(--color-text-dim)" }}>
              You've excavated the complete history of rhythm. Create your own archaeological symphony!
            </p>
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}