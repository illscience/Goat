"use client";

import { useState, useCallback } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Artifact {
  name: string;
  emoji: string;
  description: string;
  archaeologistNote: string;
}

interface Layer {
  name: string;
  depth: string;
  color: string;
  borderColor: string;
  artifacts: Artifact[];
  excavated: boolean;
  description: string;
}

const initialLayers: Layer[] = [
  {
    name: "Topsoil of Trivial Tasks",
    depth: "0-2 meters",
    color: "bg-amber-800",
    borderColor: "border-amber-900",
    description: "Fresh, daily procrastination deposits",
    excavated: false,
    artifacts: [
      { name: "Unread Notification Badge", emoji: "🔔", description: "A fossilized '99+' that once promised dopamine", archaeologistNote: "Specimen shows signs of compulsive checking behavior" },
      { name: "Browser Tab Colony", emoji: "📑", description: "47 tabs, all 'important for later'", archaeologistNote: "Subject clearly believed they'd read these articles someday" },
      { name: "Snack Wrapper", emoji: "🍪", description: "Evidence of 'just one more cookie' ritual", archaeologistNote: "The pantry pilgrimage - a classic avoidance tactic" },
    ]
  },
  {
    name: "Sediment of Social Media",
    depth: "2-5 meters",
    color: "bg-amber-700",
    borderColor: "border-amber-800",
    description: "Compressed hours of infinite scrolling",
    excavated: false,
    artifacts: [
      { name: "Doomscroll Residue", emoji: "📱", description: "Thumb-shaped groove worn into bedrock", archaeologistNote: "Carbon dating suggests 3+ hours of 'just checking real quick'" },
      { name: "Meme Fossil", emoji: "🐸", description: "Once hilarious, now incomprehensible", archaeologistNote: "Cultural artifact from the Before Times (2 weeks ago)" },
      { name: "LinkedIn Lurker Badge", emoji: "💼", description: "Watched others succeed without participating", archaeologistNote: "Subject congratulated 47 connections, applied to 0 jobs" },
    ]
  },
  {
    name: "The Wikipedia Wormhole",
    depth: "5-10 meters",
    color: "bg-amber-600",
    borderColor: "border-amber-700",
    description: "Stratified layers of 'educational' tangents",
    excavated: false,
    artifacts: [
      { name: "Research Rabbit Hole Map", emoji: "🗺️", description: "Started at 'productivity tips', ended at 'list of unusual deaths'", archaeologistNote: "A 4-hour journey to nowhere productive" },
      { name: "Random Fact Collection", emoji: "🧠", description: "Did you know honey never spoils?", archaeologistNote: "Subject can now win trivia nights but not deadlines" },
      { name: "YouTube Recommendation Crystal", emoji: "💎", description: "Petrified autoplay queue", archaeologistNote: "One documentary became seventeen" },
    ]
  },
  {
    name: "Perfectionism Permafrost",
    depth: "10-20 meters",
    color: "bg-stone-500",
    borderColor: "border-stone-600",
    description: "Frozen ambitions waiting for 'the right moment'",
    excavated: false,
    artifacts: [
      { name: "Draft Graveyard", emoji: "📝", description: "Unfinished masterpieces, preserved forever", archaeologistNote: "Subject couldn't publish until it was 'perfect'" },
      { name: "Reorganized To-Do List", emoji: "✅", description: "Color-coded, prioritized, never executed", archaeologistNote: "The organization itself became the procrastination" },
      { name: "Better Tool Hunt", emoji: "🔧", description: "Spent 3 days finding the 'right' app to start working", archaeologistNote: "Classic displacement behavior" },
    ]
  },
  {
    name: "Fear of Failure Fossil Bed",
    depth: "20-50 meters",
    color: "bg-stone-600",
    borderColor: "border-stone-700",
    description: "Ancient anxieties compressed into stone",
    excavated: false,
    artifacts: [
      { name: "Imposter Syndrome Shell", emoji: "🐚", description: "Protective coating against success", archaeologistNote: "Subject genuinely believed everyone else knew what they were doing" },
      { name: "What-If Stone", emoji: "💭", description: "Petrified catastrophic thinking", archaeologistNote: "Preserved scenarios that never actually happened" },
      { name: "Comfort Zone Boundary Marker", emoji: "🚧", description: "Here be dragons (allegedly)", archaeologistNote: "Subject never verified if dragons existed" },
    ]
  },
  {
    name: "Existential Bedrock",
    depth: "50+ meters",
    color: "bg-slate-700",
    borderColor: "border-slate-800",
    description: "The fundamental 'what's the point anyway?' layer",
    excavated: false,
    artifacts: [
      { name: "Mortality Awareness Crystal", emoji: "💀", description: "Nothing matters... but also everything does?", archaeologistNote: "The ultimate excuse: cosmic insignificance" },
      { name: "Meaning of Life Fragment", emoji: "🌌", description: "Still under analysis", archaeologistNote: "Subject paralyzed by the vastness of existence" },
      { name: "Ancient Motivation Fossil", emoji: "🦴", description: "Once, they actually wanted to do things", archaeologistNote: "Carbon dating: age 7, before homework was invented" },
    ]
  },
];

export default function ProcrastinationArchaeology() {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [excavationProgress, setExcavationProgress] = useState(0);
  const [currentlyExcavating, setCurrentlyExcavating] = useState<number | null>(null);
  const [totalArtifacts, setTotalArtifacts] = useState(0);

  const canExcavate = useCallback((index: number) => {
    if (index === 0) return true;
    return layers[index - 1]?.excavated ?? false;
  }, [layers]);

  const excavateLayer = useCallback((index: number) => {
    if (!canExcavate(index) || layers[index].excavated) return;
    
    setCurrentlyExcavating(index);
    setExcavationProgress(0);
    
    const interval = setInterval(() => {
      setExcavationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentlyExcavating(null);
          setLayers(prev => prev.map((layer, i) => 
            i === index ? { ...layer, excavated: true } : layer
          ));
          setTotalArtifacts(prev => prev + layers[index].artifacts.length);
          return 0;
        }
        return prev + 10;
      });
    }, 150);
  }, [canExcavate, layers]);

  const resetExcavation = useCallback(() => {
    setLayers(initialLayers);
    setSelectedArtifact(null);
    setTotalArtifacts(0);
    setExcavationProgress(0);
    setCurrentlyExcavating(null);
  }, []);

  const excavatedCount = layers.filter(l => l.excavated).length;

  return (
    <FeatureWrapper day={361} title="Procrastination Archaeology" emoji="⛏️">
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h2 
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Excavate Your Excuses
          </h2>
          <p style={{ color: "var(--color-text-dim)" }} className="mb-4">
            Dig through the geological layers of your procrastination psychology. 
            What ancient avoidance behaviors lie beneath the surface?
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}>
              🏛️ Layers Excavated: {excavatedCount}/{layers.length}
            </span>
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-dim)" }}>
              🏺 Artifacts Found: {totalArtifacts}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Excavation Site */}
          <div className="flex-1">
            <div 
              className="rounded-t-lg p-3 text-center font-bold"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
            >
              ⛏️ EXCAVATION SITE
            </div>
            <div 
              className="border-2 rounded-b-lg overflow-hidden"
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* Surface */}
              <div className="h-8 bg-green-600 flex items-center justify-center text-white text-sm font-medium">
                🌱 Surface Level - "I&apos;ll start tomorrow"
              </div>
              
              {/* Layers */}
              {layers.map((layer, index) => (
                <div key={layer.name} className="relative">
                  <button
                    onClick={() => excavateLayer(index)}
                    disabled={!canExcavate(index) || layer.excavated || currentlyExcavating !== null}
                    className={`w-full p-4 text-left transition-all duration-300 border-t-2 ${layer.color} ${layer.borderColor} ${
                      !canExcavate(index) ? 'opacity-50 cursor-not-allowed' : 
                      layer.excavated ? 'cursor-default' : 'hover:brightness-110 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-shadow flex items-center gap-2">
                          {layer.excavated ? '✓' : canExcavate(index) ? '⛏️' : '🔒'} {layer.name}
                        </div>
                        <div className="text-white/80 text-sm">{layer.depth}</div>
                        <div className="text-white/60 text-xs mt-1">{layer.description}</div>
                      </div>
                      {layer.excavated && (
                        <span className="text-2xl">{layer.artifacts.map(a => a.emoji).join('')}</span>
                      )}
                    </div>
                    
                    {currentlyExcavating === index && (
                      <div className="mt-2">
                        <div className="w-full bg-black/30 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-150"
                            style={{ width: `${excavationProgress}%` }}
                          />
                        </div>
                        <div className="text-white/80 text-xs mt-1 text-center">
                          Excavating... {excavationProgress}%
                        </div>
                      </div>
                    )}
                  </button>
                  
                  {/* Excavated artifacts preview */}
                  {layer.excavated && (
                    <div className="bg-amber-950/50 p-2 flex flex-wrap gap-2">
                      {layer.artifacts.map((artifact, aIndex) => (
                        <button
                          key={aIndex}
                          onClick={() => setSelectedArtifact(artifact)}
                          className="px-3 py-1 rounded-full text-sm transition-all hover:scale-105"
                          style={{ 
                            backgroundColor: selectedArtifact === artifact ? "var(--color-accent)" : "var(--color-bg-secondary)",
                            color: selectedArtifact === artifact ? "white" : "var(--color-text)"
                          }}
                        >
                          {artifact.emoji} {artifact.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Core */}
              <div className="h-12 bg-red-950 flex items-center justify-center text-white text-sm font-medium">
                🌋 Molten Core of Pure Avoidance
              </div>
            </div>

            <button
              onClick={resetExcavation}
              className="mt-4 w-full btn-secondary py-2 rounded-lg"
            >
              🔄 New Dig Site
            </button>
          </div>

          {/* Artifact Display */}
          <div className="lg:w-80">
            <div 
              className="rounded-lg p-4 sticky top-4"
              style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              <h3 
                className="font-bold mb-4 text-center text-lg"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
              >
                🏛️ Museum Display
              </h3>
              
              {selectedArtifact ? (
                <div className="space-y-4">
                  <div className="text-6xl text-center">{selectedArtifact.emoji}</div>
                  <h4 
                    className="font-bold text-center"
                    style={{ color: "var(--color-text)" }}
                  >
                    {selectedArtifact.name}
                  </h4>
                  <p 
                    className="text-sm text-center italic"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    &ldquo;{selectedArtifact.description}&rdquo;
                  </p>
                  <div 
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="font-semibold mb-1" style={{ color: "var(--color-accent)" }}>
                      📋 Archaeologist&apos;s Note:
                    </div>
                    <p style={{ color: "var(--color-text-dim)" }}>
                      {selectedArtifact.archaeologistNote}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: "var(--color-text-dim)" }}>
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm">
                    Excavate a layer and click on an artifact to examine it
                  </p>
                </div>
              )}
            </div>

            {excavatedCount === layers.length && (
              <div 
                className="mt-4 p-4 rounded-lg text-center"
                style={{ backgroundColor: "var(--color-accent)", color: "white" }}
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-bold">Excavation Complete!</div>
                <p className="text-sm opacity-90 mt-1">
                  You&apos;ve unearthed all your procrastination layers. 
                  Now you can either address them... or procrastinate on that too.
                </p>
              </div>
            )}
          </div>
        </div>

        <div 
          className="mt-8 p-4 rounded-lg text-center"
          style={{ backgroundColor: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
            &ldquo;Every layer of procrastination tells a story. Usually that story is 
            &apos;I meant to do this weeks ago.&apos;&rdquo; — Dr. Ima Stalling, Procrastination Archaeologist
          </p>
        </div>
      </div>
    </FeatureWrapper>
  );
}