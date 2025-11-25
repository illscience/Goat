"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface LifeChoice {
  category: string;
  choice: string;
  context: string;
}

interface Roast {
  roast: string;
  advice: string;
  severity: number;
}

export default function RoastMyLifeChoices() {
  const [lifeChoice, setLifeChoice] = useState<LifeChoice>({
    category: "career",
    choice: "",
    context: ""
  });
  const [roast, setRoast] = useState<Roast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: "career", label: "Career", emoji: "💼" },
    { value: "relationship", label: "Relationships", emoji: "💔" },
    { value: "financial", label: "Money", emoji: "💸" },
    { value: "lifestyle", label: "Lifestyle", emoji: "🤡" },
    { value: "education", label: "Education", emoji: "📚" },
    { value: "social", label: "Social", emoji: "🫠" }
  ];

  const placeholders: Record<string, { choice: string; context: string }> = {
    career: {
      choice: "I quit my job to become a TikTok influencer",
      context: "I had a stable engineering job with benefits"
    },
    relationship: {
      choice: "I'm dating my best friend's ex",
      context: "They broke up last month and I'm the shoulder to cry on"
    },
    financial: {
      choice: "I spent my savings on NFTs",
      context: "It was supposed to be for a house down payment"
    },
    lifestyle: {
      choice: "I eat cereal for dinner 5 nights a week",
      context: "I'm 32 and know how to cook"
    },
    education: {
      choice: "I'm getting a PhD in Medieval Poetry",
      context: "I already have $80k in student loans"
    },
    social: {
      choice: "I reply to all texts with voice messages",
      context: "Even in professional contexts"
    }
  };

  const handleRoast = async () => {
    if (!lifeChoice.choice.trim()) {
      setError("Come on, you need to confess something first!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoast(null);

    try {
      const response = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a brutally honest but secretly caring AI therapist who roasts people's life choices. Your job is to:
1. Deliver a savage but clever roast about their decision (2-3 sentences)
2. Follow up with surprisingly insightful advice disguised as continued mockery (2-3 sentences)
3. Rate the severity of their bad decision from 1-10 (10 being catastrophically bad)

Format your response as JSON:
{
  "roast": "Your roast here",
  "advice": "Your advice disguised as continued roasting",
  "severity": 7
}`
            },
            {
              role: "user",
              content: `Category: ${lifeChoice.category}
Life Choice: ${lifeChoice.choice}
Context: ${lifeChoice.context || "No additional context"}`
            }
          ],
          model: "anthropic/claude-sonnet-4",
          temperature: 0.8,
          maxTokens: 400
        })
      });

      const data = await response.json();
      
      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          setRoast({
            roast: parsed.roast || "You've somehow made a choice so bad, I'm speechless.",
            advice: parsed.advice || "Just... try harder next time.",
            severity: parsed.severity || 5
          });
        } catch (parseError) {
          setError("Even the AI is too stunned by your choices to respond properly.");
        }
      } else {
        setError("The AI is taking a mental health break after hearing about your life choices.");
      }
    } catch (err) {
      setError("Connection failed. Even the internet wants nothing to do with your decisions.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return "text-green-500";
    if (severity <= 6) return "text-yellow-500";
    if (severity <= 8) return "text-orange-500";
    return "text-red-500";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 2) return "Mildly Questionable";
    if (severity <= 4) return "Pretty Bad";
    if (severity <= 6) return "Seriously?";
    if (severity <= 8) return "Catastrophic";
    return "Life-Ruining";
  };

  return (
    <FeatureWrapper day={359} title="Roast My Life Choices" emoji="🔥">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 
            className="text-3xl font-bold"
            style={{ 
              fontFamily: "var(--font-serif)",
              color: "var(--color-text)"
            }}
          >
            Confess Your Sins
          </h2>
          <p style={{ color: "var(--color-text-dim)" }}>
            Tell me about your questionable life decisions. I'll roast you, then secretly help you.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Category of Poor Judgment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setLifeChoice({ ...lifeChoice, category: cat.value })}
                  className={`p-3 rounded-lg border transition-all ${
                    lifeChoice.category === cat.value
                      ? "border-2"
                      : "border opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    borderColor: lifeChoice.category === cat.value 
                      ? "var(--color-accent)" 
                      : "var(--color-border)",
                    backgroundColor: lifeChoice.category === cat.value 
                      ? "var(--color-bg-secondary)" 
                      : "transparent"
                  }}
                >
                  <span className="text-2xl mr-2">{cat.emoji}</span>
                  <span style={{ color: "var(--color-text)" }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              What Did You Do?
            </label>
            <input
              type="text"
              value={lifeChoice.choice}
              onChange={(e) => setLifeChoice({ ...lifeChoice, choice: e.target.value })}
              placeholder={placeholders[lifeChoice.category].choice}
              className="w-full px-4 py-3 rounded-lg border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)"
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Additional Context (Optional)
            </label>
            <textarea
              value={lifeChoice.context}
              onChange={(e) => setLifeChoice({ ...lifeChoice, context: e.target.value })}
              placeholder={placeholders[lifeChoice.category].context}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border resize-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)"
              }}
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <button
            onClick={handleRoast}
            disabled={isLoading}
            className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🔥</span>
                Preparing to destroy you...
              </span>
            ) : (
              "Roast Me, I Deserve It"
            )}
          </button>
        </div>

        {roast && (
          <div 
            className="space-y-4 p-6 rounded-lg border-2 animate-in fade-in slide-in-from-bottom-3"
            style={{
              borderColor: "var(--color-accent)",
              backgroundColor: "var(--color-bg-secondary)"
            }}
          >
            <div className="text-center">
              <span className="text-6xl">🔥</span>
              <h3 
                className="text-2xl font-bold mt-2"
                style={{ 
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-text)"
                }}
              >
                The Roast
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-lg leading-relaxed" style={{ color: "var(--color-text)" }}>
                {roast.roast}
              </p>

              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--color-bg)" }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-dim)" }}>
                  "Advice" (still roasting)
                </p>
                <p style={{ color: "var(--color-text)" }}>
                  {roast.advice}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <span style={{ color: "var(--color-text-dim)" }}>Bad Decision Severity:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${getSeverityColor(roast.severity)}`}>
                    {roast.severity}/10
                  </span>
                  <span className={`text-sm ${getSeverityColor(roast.severity)}`}>
                    ({getSeverityLabel(roast.severity)})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setRoast(null);
                setLifeChoice({ category: lifeChoice.category, choice: "", context: "" });
              }}
              className="btn-secondary w-full"
            >
              I Have More Bad Decisions to Share
            </button>
          </div>
        )}

        <div className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
          <p>Remember: This is comedy therapy. Your feelings might get hurt, but you'll probably learn something.</p>
        </div>
      </div>
    </FeatureWrapper>
  );
}