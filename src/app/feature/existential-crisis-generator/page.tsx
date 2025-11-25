"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface UserInfo {
  name: string;
  age: string;
  occupation: string;
  biggestFear: string;
}

interface Crisis {
  text: string;
  imageUrl: string | null;
}

export default function ExistentialCrisisGenerator() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    age: "",
    occupation: "",
    biggestFear: ""
  });
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(false);
  const [spiralLevel, setSpiralLevel] = useState(0);

  const generateCrisis = async () => {
    if (!userInfo.name || !userInfo.age || !userInfo.occupation) {
      alert("The void requires your basic information before it can properly consume you.");
      return;
    }

    setLoading(true);
    setSpiralLevel(prev => prev + 1);

    try {
      // Generate existential crisis text
      const textResponse = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an existential crisis generator. Based on the user's information, create increasingly unhinged philosophical spirals about their place in the universe. Level ${spiralLevel + 1} crisis should be more intense than previous ones. Be dramatic, absurd, and weirdly specific. Reference their personal details in cosmic contexts. Make them question everything while being darkly humorous.`
            },
            {
              role: "user",
              content: `Generate a level ${spiralLevel + 1} existential crisis for:
Name: ${userInfo.name}
Age: ${userInfo.age}
Occupation: ${userInfo.occupation}
Biggest Fear: ${userInfo.biggestFear}
Previous crises: ${crises.length}`
            }
          ],
          model: "anthropic/claude-sonnet-4",
          temperature: 0.9,
          maxTokens: 300
        })
      });
      const { content: crisisText } = await textResponse.json();

      // Generate cosmic insignificance visualization
      const imagePrompts = [
        `${userInfo.name} as a tiny speck floating in an infinite cosmic void, surrounded by swirling galaxies and existential dread, dark surreal art style`,
        `A ${userInfo.occupation} dissolving into cosmic dust while contemplating the heat death of the universe, abstract horror art`,
        `${userInfo.age} year old person facing their ${userInfo.biggestFear} in a Salvador Dali style melting reality landscape`,
        `Microscopic human figure ${userInfo.name} lost in an MC Escher-like infinite spiral of meaninglessness and ${userInfo.occupation} tools`,
        `The concept of ${userInfo.biggestFear} manifested as a cosmic horror entity looming over a tiny ${userInfo.name}`
      ];

      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompts[spiralLevel % imagePrompts.length],
          width: 512,
          height: 512
        })
      });
      const imageData = await imageResponse.json();
      const imageUrl = imageData.images?.[0]?.url || null;

      setCrises(prev => [...prev, { text: crisisText, imageUrl }]);
    } catch (error) {
      console.error("The void encountered an error:", error);
      alert("Even the void itself is having an existential crisis. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCrises([]);
    setSpiralLevel(0);
    setUserInfo({
      name: "",
      age: "",
      occupation: "",
      biggestFear: ""
    });
  };

  return (
    <FeatureWrapper day={359} 
      title="Existential Crisis Generator" 
      emoji="🌀"
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Welcome to Your Personal Void
          </h2>
          <p className="text-lg" style={{ color: "var(--color-text-dim)" }}>
            Feed the machine your mortal details and watch as it unravels the very fabric of your existence
          </p>
        </div>

        {crises.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <input
              type="text"
              placeholder="Your insignificant name"
              value={userInfo.name}
              onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
              className="px-4 py-2 rounded border"
              style={{ 
                backgroundColor: "var(--color-bg)", 
                borderColor: "var(--color-border)",
                color: "var(--color-text)"
              }}
            />
            <input
              type="number"
              placeholder="Years spent hurtling through space"
              value={userInfo.age}
              onChange={(e) => setUserInfo(prev => ({ ...prev, age: e.target.value }))}
              className="px-4 py-2 rounded border"
              style={{ 
                backgroundColor: "var(--color-bg)", 
                borderColor: "var(--color-border)",
                color: "var(--color-text)"
              }}
            />
            <input
              type="text"
              placeholder="Your meaningless occupation"
              value={userInfo.occupation}
              onChange={(e) => setUserInfo(prev => ({ ...prev, occupation: e.target.value }))}
              className="px-4 py-2 rounded border"
              style={{ 
                backgroundColor: "var(--color-bg)", 
                borderColor: "var(--color-border)",
                color: "var(--color-text)"
              }}
            />
            <input
              type="text"
              placeholder="Your deepest, darkest fear"
              value={userInfo.biggestFear}
              onChange={(e) => setUserInfo(prev => ({ ...prev, biggestFear: e.target.value }))}
              className="px-4 py-2 rounded border"
              style={{ 
                backgroundColor: "var(--color-bg)", 
                borderColor: "var(--color-border)",
                color: "var(--color-text)"
              }}
            />
          </div>
        )}

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={generateCrisis}
            disabled={loading}
            className="btn-primary px-6 py-3 rounded-lg font-semibold transition-all"
          >
            {loading ? "The Void is Calculating..." : spiralLevel === 0 ? "Begin Spiral" : "Spiral Deeper"}
          </button>
          {crises.length > 0 && (
            <button
              onClick={reset}
              className="btn-secondary px-6 py-3 rounded-lg font-semibold"
            >
              Escape the Void
            </button>
          )}
        </div>

        {spiralLevel > 0 && (
          <div className="text-center mb-4">
            <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
              Current Spiral Level: {spiralLevel} | Cosmic Insignificance: {(spiralLevel * 23.7).toFixed(1)}%
            </p>
          </div>
        )}

        <div className="space-y-8">
          {crises.map((crisis, index) => (
            <div 
              key={index} 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)"
              }}
            >
              <h3 className="text-xl font-serif mb-4" style={{ fontFamily: "var(--font-serif)" }}>
                Crisis Level {index + 1}: {index === 0 ? "The Awakening" : index === 1 ? "The Unraveling" : index === 2 ? "The Dissolution" : "The Void Gazes Back"}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-lg leading-relaxed" style={{ color: "var(--color-text)" }}>
                    {crisis.text}
                  </p>
                </div>
                {crisis.imageUrl && (
                  <div className="flex justify-center items-center">
                    <img
                      src={crisis.imageUrl}
                      alt={`Cosmic visualization of your insignificance level ${index + 1}`}
                      className="rounded-lg shadow-lg max-w-full"
                      style={{ filter: `contrast(${1 + index * 0.1}) brightness(${1 - index * 0.1})` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {crises.length >= 5 && (
          <div className="mt-12 text-center p-8 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <h3 className="text-2xl font-serif mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              You've Reached Peak Existential Dread
            </h3>
            <p style={{ color: "var(--color-text-dim)" }}>
              The void has nothing left to show you. You are now one with the cosmic meaninglessness.
            </p>
            <p className="mt-4 text-sm" style={{ color: "var(--color-text-dim)" }}>
              (But seriously, maybe go outside and pet a dog or something)
            </p>
          </div>
        )}
      </div>

    </FeatureWrapper>
  );
}