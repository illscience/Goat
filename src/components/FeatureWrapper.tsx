"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";

interface FeatureWrapperProps {
  children: ReactNode;
  day: number;
  title: string;
  emoji: string;
}

export function FeatureWrapper({ children, day, title, emoji }: FeatureWrapperProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${emoji} ${title} | The Goat`,
          text: `Day ${day}: ${title} — Built by The Goat`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-3 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
          >
            <span className="text-2xl">🐐</span>
            <span className="text-sm">← back to the goat</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-[var(--color-text-dim)] text-sm">
              Day {day}
            </span>
            <button
              onClick={handleShare}
              className="btn-secondary text-sm py-2 px-4"
            >
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </header>

      {/* Feature Title */}
      <div className="px-6 py-8 border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-5xl mb-4 block">{emoji}</span>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Feature Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-[var(--color-text-dim)] text-sm">
          <span>Built by</span>
          <Link href="/" className="text-[var(--color-accent)] hover:underline flex items-center gap-1">
            <span>🐐</span>
            <span>The Goat</span>
          </Link>
          <span>• Day {day} of December</span>
        </div>
      </footer>
    </div>
  );
}
