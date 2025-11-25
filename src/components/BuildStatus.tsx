"use client";

import { useEffect, useState } from "react";

interface Step {
  name: string;
  status: string;
  conclusion: string | null;
}

interface BuildData {
  isBuilding: boolean;
  status: string;
  conclusion: string | null;
  elapsedSeconds: number;
  steps: Step[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStepIcon(step: Step): string {
  if (step.status === "completed") {
    return step.conclusion === "success" ? "✓" : "✗";
  }
  if (step.status === "in_progress") {
    return "▸";
  }
  return "○";
}

function getStepClass(step: Step): string {
  if (step.status === "completed") {
    return step.conclusion === "success" ? "text-green-400" : "text-red-400";
  }
  if (step.status === "in_progress") {
    return "text-yellow-400";
  }
  return "text-[var(--color-text-dim)] opacity-50";
}

// Map GitHub step names to Goat-friendly names
function getGoatStepName(name: string): string {
  const mapping: Record<string, string> = {
    "Set up job": "waking up...",
    "Checkout repository": "remembering who i am...",
    "Setup Node.js": "caffeinating...",
    "Install dependencies": "gathering my tools...",
    "Install Playwright browsers": "opening my eyes...",
    "Run Goat Build": "building something beautiful...",
    "Commit and push changes": "shipping it...",
    "Post Setup Node.js": "cleaning up...",
    "Post Checkout repository": "tidying up...",
    "Complete job": "done!",
  };
  return mapping[name] || name.toLowerCase();
}

export function BuildStatus() {
  const [buildData, setBuildData] = useState<BuildData | null>(null);
  const [localElapsed, setLocalElapsed] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/build-logs");
        if (response.ok) {
          const data = await response.json();
          setBuildData(data);
          setLocalElapsed(data.elapsedSeconds || 0);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchStatus();
    const fetchInterval = setInterval(fetchStatus, 3000);

    return () => clearInterval(fetchInterval);
  }, []);

  // Local timer that updates every second
  useEffect(() => {
    if (!buildData?.isBuilding) return;

    const timerInterval = setInterval(() => {
      setLocalElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [buildData?.isBuilding]);

  if (!buildData?.isBuilding) {
    return null;
  }

  // Filter to only show relevant steps
  const relevantSteps = buildData.steps.filter(
    (s) => !s.name.startsWith("Post ") && s.name !== "Complete job" && s.name !== "Set up job"
  );

  return (
    <div className="w-full max-w-md mx-auto mt-6 animate-fade-in-up">
      <div
        className="rounded-lg overflow-hidden border"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Terminal header */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
            </div>
            <span className="text-xs text-[var(--color-text-dim)] ml-2 font-mono">
              goat-build.sh
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-text-dim)]">
              {formatTime(localElapsed)}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-4 font-mono text-sm space-y-1">
          {relevantSteps.map((step, i) => (
            <div key={i} className={`flex items-center gap-2 ${getStepClass(step)}`}>
              <span className="w-4 text-center">
                {step.status === "in_progress" ? (
                  <span className="animate-pulse">{getStepIcon(step)}</span>
                ) : (
                  getStepIcon(step)
                )}
              </span>
              <span>{getGoatStepName(step.name)}</span>
            </div>
          ))}

          {/* Blinking cursor on current step */}
          {buildData.isBuilding && (
            <div className="flex items-center gap-2 text-[var(--color-text-dim)]">
              <span className="w-4" />
              <span className="animate-pulse">_</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
