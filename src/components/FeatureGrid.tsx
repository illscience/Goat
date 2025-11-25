"use client";

import Link from "next/link";

export interface Feature {
  id: string;
  day: number;
  title: string;
  emoji: string;
  description: string;
  released: boolean;
  releasedAt?: Date;
}

interface FeatureGridProps {
  features: Feature[];
}

export function FeatureGrid({ features }: FeatureGridProps) {
  const releasedFeatures = features.filter((f) => f.released);
  
  if (releasedFeatures.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-[var(--color-text-dim)] text-sm uppercase tracking-wider mb-6">
        📦 Shipped
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {releasedFeatures.map((feature, i) => (
          <Link
            key={feature.id}
            href={`/feature/${feature.id}`}
            className="feature-card rounded-lg p-5 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{feature.emoji}</span>
              <span className="text-[var(--color-text-dim)] text-xs">
                Day {feature.day}
              </span>
            </div>
            
            <h3 className="font-bold text-[var(--color-text)] mb-2">
              {feature.title}
            </h3>
            
            <p className="text-[var(--color-text-dim)] text-sm leading-relaxed">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
