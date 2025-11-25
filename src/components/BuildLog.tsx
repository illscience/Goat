"use client";

import { useState, useEffect } from "react";

export interface LogEntry {
  time: string;
  message: string;
  highlight?: boolean;
}

interface BuildLogProps {
  entries: LogEntry[];
  typing?: boolean;
}

export function BuildLog({ entries, typing = false }: BuildLogProps) {
  const [visibleEntries, setVisibleEntries] = useState<LogEntry[]>([]);
  const [currentTyping, setCurrentTyping] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    if (!typing) {
      setVisibleEntries(entries);
      return;
    }

    // Animate entries appearing one by one
    if (visibleEntries.length < entries.length) {
      const timer = setTimeout(() => {
        setVisibleEntries(entries.slice(0, visibleEntries.length + 1));
      }, 800 + Math.random() * 400);
      return () => clearTimeout(timer);
    }
  }, [entries, typing, visibleEntries.length]);

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 max-w-2xl w-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--color-border)]">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[var(--color-text-dim)] text-sm">build.log</span>
      </div>
      
      <div className="space-y-2 font-mono text-sm">
        {visibleEntries.map((entry, i) => (
          <div
            key={i}
            className={`terminal-line ${entry.highlight ? "highlight" : ""} animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="text-[var(--color-text-dim)]">{entry.time}</span>
            <span className="mx-2 text-[var(--color-border)]">—</span>
            <span>{entry.message}</span>
          </div>
        ))}
        
        {typing && visibleEntries.length === entries.length && (
          <div className="terminal-line">
            <span className="text-[var(--color-accent)] animate-blink">█</span>
          </div>
        )}
      </div>
    </div>
  );
}
