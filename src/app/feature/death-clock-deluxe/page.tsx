"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface LifestyleFactors {
  age: string;
  exercise: string;
  diet: string;
  stress: string;
  sleep: string;
  vices: string;
  optimism: string;
}

interface DeathClockResult {
  yearsLeft: number;
  daysLeft: number;
  hoursLeft: number;
  deathAge: number;
  suggestions: string;
}

export default function DeathClockDeluxe() {
  const [factors, setFactors] = useState<LifestyleFactors>({
    age: "",
    exercise: "moderate",
    diet: "average",
    stress: "moderate",
    sleep: "7",
    vices: "minimal",
    optimism: "neutral"
  });
  const [result, setResult] = useState<DeathClockResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateDeathClock = async () => {
    if (!factors.age || parseInt(factors.age) < 1 || parseInt(factors.age) > 120) {
      alert("Please enter a valid age between 1 and 120");
      return;
    }

    setLoading(true);

    // Base life expectancy
    let lifeExpectancy = 78;

    // Adjust based on factors
    const adjustments = {
      exercise: { none: -5, minimal: -2, moderate: 2, intense: 4 },
      diet: { terrible: -6, poor: -3, average: 0, healthy: 3, perfect: 5 },
      stress: { extreme: -8, high: -4, moderate: -1, low: 2, zen: 4 },
      sleep: { "4": -5, "5": -3, "6": -1, "7": 1, "8": 2, "9": 0, "10": -1 },
      vices: { heavy: -10, moderate: -5, minimal: -1, none: 2 },
      optimism: { pessimist: -3, neutral: 0, optimist: 2, delusional: 4 }
    };

    lifeExpectancy += adjustments.exercise[factors.exercise as keyof typeof adjustments.exercise];
    lifeExpectancy += adjustments.diet[factors.diet as keyof typeof adjustments.diet];
    lifeExpectancy += adjustments.stress[factors.stress as keyof typeof adjustments.stress];
    lifeExpectancy += adjustments.sleep[factors.sleep as keyof typeof adjustments.sleep];
    lifeExpectancy += adjustments.vices[factors.vices as keyof typeof adjustments.vices];
    lifeExpectancy += adjustments.optimism[factors.optimism as keyof typeof adjustments.optimism];

    const currentAge = parseInt(factors.age);
    const yearsLeft = Math.max(0, lifeExpectancy - currentAge);
    const daysLeft = Math.round(yearsLeft * 365.25);
    const hoursLeft = daysLeft * 24;

    try {
      const response = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a darkly humorous but genuinely helpful life coach. Generate 3-4 specific, actionable, and slightly sarcastic suggestions for someone to make the most of their remaining time. Be funny but also provide real value. Keep it concise and punchy."
            },
            {
              role: "user",
              content: `I'm ${currentAge} years old with ${yearsLeft.toFixed(1)} years left to live. My lifestyle: Exercise: ${factors.exercise}, Diet: ${factors.diet}, Stress: ${factors.stress}, Sleep: ${factors.sleep} hours, Vices: ${factors.vices}, Outlook: ${factors.optimism}. Give me darkly funny but genuinely helpful advice.`
            }
          ],
          model: "anthropic/claude-sonnet-4",
          temperature: 0.8,
          maxTokens: 400
        })
      });

      const data = await response.json();
      const suggestions = data.content || "Live fast, die whenever. But maybe try a salad first.";

      setResult({
        yearsLeft,
        daysLeft,
        hoursLeft,
        deathAge: lifeExpectancy,
        suggestions
      });
    } catch (error) {
      setResult({
        yearsLeft,
        daysLeft,
        hoursLeft,
        deathAge: lifeExpectancy,
        suggestions: "The AI is having an existential crisis. In the meantime: eat vegetables, move your body, and call your mother."
      });
    } finally {
      setLoading(false);
    }
  };

  const resetClock = () => {
    setResult(null);
    setFactors({
      age: "",
      exercise: "moderate",
      diet: "average",
      stress: "moderate",
      sleep: "7",
      vices: "minimal",
      optimism: "neutral"
    });
  };

  return (
    <FeatureWrapper day={360} title="Death Clock Deluxe" emoji="⏰">
      <div className="max-w-4xl mx-auto">
        {!result ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}>
                Your Personal Expiration Date Calculator
              </h2>
              <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
                Because nothing motivates quite like impending doom
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                    Current Age
                  </label>
                  <input
                    type="number"
                    value={factors.age}
                    onChange={(e) => setFactors({ ...factors, age: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)"
                    }}
                    placeholder="How many trips around the sun?"
                    min="1"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                    Exercise Level
                  </label>
                  <select
                    value={factors.exercise}
                    onChange={(e) => setFactors({ ...factors, exercise: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)"
                    }}
                  >
                    <option value="none">None (Couch is life)</option>
                    <option value="minimal">Minimal (I walk to the fridge)</option>
                    <option value="moderate">Moderate (I try, okay?)</option>
                    <option value="intense">Intense (Gym is my church)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                    Diet Quality
                  </label>
                  <select
                    value={factors.diet}
                    onChange={(e) => setFactors({ ...factors, diet: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)"
                    }}
                  >
                    <option value="terrible">Terrible (Pizza is a vegetable)</option>
                    <option value="poor">Poor (I've seen vegetables)</option>
                    <option value="average">Average (Balanced-ish)</option>
                    <option value="healthy">Healthy (Kale smoothies)</option>
                    <option value="perfect">Perfect (I photosynthesize)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                    Stress Level
                  </label>
                  <select
                    value={factors.stress}
                    onChange={(e) => setFactors({ ...factors, stress: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)"
                    }}
                  >
                    <option value="extreme">Extreme (Eye twitching)</option>
                    <option value="high">High (Coffee is my blood)</option>
                    <option value="moderate">Moderate (Manageable chaos)</option>
                    <option value="low">Low (I do yoga)</option>
                    <option value="zen">Zen (What is stress?)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                    Hours of Sleep
                  </label>
                  <select
                    value={factors.sleep}
                    onChange={(e) => setFactors({ ...factors, sleep: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)"
                    }}
                  >
                    <option value="4">4 (Sleep is for the weak)</option>
                    <option value="5">5 (Barely human)</option>
                    <option value="6">6 (Functional zombie)</option>
                    <option value="7">7 (Sweet spot)</option>
                    <option value="8">8 (Well-rested adult)</option>
                    <option value="9">9 (Professional sleeper)</option>
                    <option value="10">10+ (Might be a cat)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                    Vices & Bad Habits
                  </label>
                  <select
                    value={factors.vices}
                    onChange={(e) => setFactors({ ...factors, vices: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)"
                    }}
                  >
                    <option value="heavy">Heavy (YOLO incarnate)</option>
                    <option value="moderate">Moderate (Weekend warrior)</option>
                    <option value="minimal">Minimal (Occasional indulgence)</option>
                    <option value="none">None (Pure as snow)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block mb-2 font-medium" style={{ color: "var(--color-text)" }}>
                Life Outlook
              </label>
              <select
                value={factors.optimism}
                onChange={(e) => setFactors({ ...factors, optimism: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: "var(--color-bg-secondary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)"
                }}
              >
                <option value="pessimist">Pessimist (Glass is broken)</option>
                <option value="neutral">Neutral (Glass exists)</option>
                <option value="optimist">Optimist (Glass half full)</option>
                <option value="delusional">Delusionally Optimistic (What glass?)</option>
              </select>
            </div>

            <button
              onClick={calculateDeathClock}
              disabled={loading || !factors.age}
              className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Consulting the Reaper..." : "Calculate My Expiration Date"}
            </button>
          </div>
        ) : (
          <div className="space-y-8 text-center">
            <div>
              <h2 className="text-4xl mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}>
                Your Mortality Report
              </h2>
              <p className="text-xl" style={{ color: "var(--color-text-dim)" }}>
                Estimated checkout time: Age {result.deathAge}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {result.yearsLeft.toFixed(1)}
                </div>
                <div style={{ color: "var(--color-text-dim)" }}>Years Left</div>
              </div>
              <div className="p-6 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {result.daysLeft.toLocaleString()}
                </div>
                <div style={{ color: "var(--color-text-dim)" }}>Days Left</div>
              </div>
              <div className="p-6 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
                <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {result.hoursLeft.toLocaleString()}
                </div>
                <div style={{ color: "var(--color-text-dim)" }}>Hours Left</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}>
                Your Personalized Life Enhancement Plan
              </h3>
              <div 
                className="p-6 rounded-lg text-left whitespace-pre-wrap"
                style={{ 
                  backgroundColor: "var(--color-bg-secondary)",
                  color: "var(--color-text)"
                }}
              >
                {result.suggestions}
              </div>
            </div>

            <button
              onClick={resetClock}
              className="btn-secondary"
            >
              Recalculate (Denial is healthy)
            </button>
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
}