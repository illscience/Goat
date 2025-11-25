"use client";

import { useState, useEffect } from "react";
import { Countdown } from "@/components/Countdown";
import { BuildLog } from "@/components/BuildLog";
import { BuildStatus } from "@/components/BuildStatus";
import { FeatureGrid } from "@/components/FeatureGrid";
import { features, buildLog, getNextReleaseTime } from "@/data/features";

export default function Home() {
  const nextRelease = getNextReleaseTime();
  const releasedFeatures = features.filter((f) => f.released);
  const [buildStatus, setBuildStatus] = useState<"idle" | "triggering" | "building" | "error">("idle");

  // Check if there's an active build on mount and periodically
  useEffect(() => {
    const checkBuildStatus = async () => {
      try {
        const response = await fetch("/api/build-status");
        if (response.ok) {
          const data = await response.json();
          if (data.isBuilding) {
            setBuildStatus("building");
          } else if (buildStatus === "building") {
            setBuildStatus("idle");
          }
        }
      } catch {
        // Ignore errors, just keep current status
      }
    };

    checkBuildStatus();
    const interval = setInterval(checkBuildStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [buildStatus]);

  const triggerBuild = async () => {
    setBuildStatus("triggering");
    try {
      const response = await fetch("/api/trigger-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (response.ok) {
        setBuildStatus("building");
      } else {
        setBuildStatus("error");
        setTimeout(() => setBuildStatus("idle"), 3000);
      }
    } catch {
      setBuildStatus("error");
      setTimeout(() => setBuildStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center mb-12 animate-fade-in-up">
        <div className="goat-emoji animate-float mb-6">
          🐐
        </div>
        
        <h1 
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          The Goat is building this app.
        </h1>
        
        <p className="text-[var(--color-text-dim)] max-w-md mb-8">
          Every day at midnight, an AI wakes up, decides what feature the world needs, and ships it.
        </p>
      </section>

      {/* Countdown Section */}
      <section className="flex flex-col items-center mb-12 animate-fade-in-up stagger-2">
        <p className="text-[var(--color-text-dim)] text-sm uppercase tracking-wider mb-4">
          {releasedFeatures.length === 0 ? "First feature drops in" : "Next feature in"}
        </p>

        <div className="animate-pulse-glow rounded-lg p-6">
          <Countdown targetDate={nextRelease} />
        </div>

        <button
          onClick={triggerBuild}
          disabled={buildStatus !== "idle"}
          className="mt-6 px-6 py-3 rounded-lg border transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          style={{
            borderColor: buildStatus === "building" ? "var(--color-accent)" : "var(--color-border)",
            backgroundColor: buildStatus === "building" ? "var(--color-accent)" : "transparent",
            color: buildStatus === "building" ? "var(--color-bg)" : "var(--color-text-dim)"
          }}
        >
          {buildStatus === "idle" && "🐐 Wake The Goat Early"}
          {buildStatus === "triggering" && "🐐 Waking..."}
          {buildStatus === "building" && "🔨 Building..."}
          {buildStatus === "error" && "😴 Goat is unavailable"}
        </button>

        {/* Live build status */}
        {buildStatus === "building" && <BuildStatus />}
      </section>

      {/* Build Log Section */}
      <section className="w-full flex flex-col items-center mb-12 animate-fade-in-up stagger-3">
        <p className="text-[var(--color-text-dim)] text-sm uppercase tracking-wider mb-4">
          Build Log
        </p>
        
        <BuildLog entries={buildLog} />
      </section>

      <hr className="section-divider w-full max-w-2xl" />

      {/* Features Grid */}
      <section className="w-full flex flex-col items-center animate-fade-in-up stagger-4">
        <FeatureGrid features={features} />
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-center">
        <p className="text-[var(--color-text-dim)] text-sm">
          December 2024 • An experiment in AI autonomy
        </p>
      </footer>
    </div>
  );
}
