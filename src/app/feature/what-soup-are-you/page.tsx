"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

interface Question {
  id: number;
  question: string;
  options: { text: string; value: string }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "It's 2am. You're awake. Why?",
    options: [
      { text: "Existential dread", value: "deep" },
      { text: "Revenge bedtime procrastination", value: "chaotic" },
      { text: "A noise. Investigating.", value: "practical" },
      { text: "I'm simply built different", value: "confident" },
    ],
  },
  {
    id: 2,
    question: "Your friend cancels plans last minute. Your inner monologue:",
    options: [
      { text: "Finally. Peace.", value: "deep" },
      { text: "Time to make worse plans", value: "chaotic" },
      { text: "I'll use this time productively", value: "practical" },
      { text: "Their loss tbh", value: "confident" },
    ],
  },
  {
    id: 3,
    question: "Pick a controversial food opinion:",
    options: [
      { text: "Cereal is soup", value: "chaotic" },
      { text: "Water is the best beverage", value: "practical" },
      { text: "Food is just fuel", value: "deep" },
      { text: "I trust my palate over critics", value: "confident" },
    ],
  },
  {
    id: 4,
    question: "You find $20 on the ground. What happens next?",
    options: [
      { text: "Wonder whose day I just ruined", value: "deep" },
      { text: "It's a sign. Making a decision based on this.", value: "chaotic" },
      { text: "Nice. Lunch is covered.", value: "practical" },
      { text: "The universe provides", value: "confident" },
    ],
  },
  {
    id: 5,
    question: "Your email inbox right now:",
    options: [
      { text: "I don't want to talk about it", value: "chaotic" },
      { text: "Inbox zero, always", value: "practical" },
      { text: "Each unread email is a small death", value: "deep" },
      { text: "Important people know to text me", value: "confident" },
    ],
  },
];

interface SoupResult {
  name: string;
  emoji: string;
  description: string;
  wisdom: string;
}

const soupResults: Record<string, SoupResult> = {
  deep: {
    name: "French Onion",
    emoji: "🧅",
    description: "Layers upon layers. You take time to develop. Most people don't understand the work that went into you, but those who do? They really do.",
    wisdom: "You're not overthinking. You're thinking the appropriate amount. Everyone else is underthinking.",
  },
  chaotic: {
    name: "Whatever's In The Fridge Soup",
    emoji: "🥘",
    description: "You shouldn't work, but you do. Somehow. People are both impressed and concerned by your approach to life.",
    wisdom: "Structure is a suggestion. You are the exception that proves no rules.",
  },
  practical: {
    name: "Chicken Noodle",
    emoji: "🍜",
    description: "You're the person people call when things go wrong. Reliable. Effective. Honestly underrated.",
    wisdom: "They'll realize your value when you're not there. But you'll be there. You're always there.",
  },
  confident: {
    name: "Lobster Bisque",
    emoji: "🦞",
    description: "You know your worth. Some find it intimidating. That's a them problem. You've earned the right to be a little fancy.",
    wisdom: "You're not arrogant if you can back it up. You can back it up.",
  },
};

export default function WhatSoupAreYou() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<SoupResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      setIsCalculating(true);
      setTimeout(() => {
        const counts: Record<string, number> = {};
        newAnswers.forEach((answer) => {
          counts[answer] = (counts[answer] || 0) + 1;
        });
        
        const topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        setResult(soupResults[topType]);
        setIsCalculating(false);
      }, 1500);
    }
  };

  const restart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
  };

  return (
    <FeatureWrapper day={1} title="What Soup Are You?" emoji="🍜">
      {!result && !isCalculating && (
        <div className="space-y-8">
          {/* Progress */}
          <div className="flex gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < currentQuestion
                    ? "bg-[var(--color-accent)]"
                    : i === currentQuestion
                    ? "bg-[var(--color-accent)]/50"
                    : "bg-[var(--color-border)]"
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="text-center">
            <p className="text-[var(--color-text-dim)] text-sm mb-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
            <h2 
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {questions[currentQuestion].question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option.value)}
                className="w-full text-left p-4 border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-all"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCalculating && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-pulse">🍲</div>
          <p className="text-[var(--color-text-dim)]">
            Consulting the soup oracle...
          </p>
        </div>
      )}

      {result && (
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="text-6xl mb-4">{result.emoji}</div>
          
          <div>
            <p className="text-[var(--color-text-dim)] text-sm uppercase tracking-wider mb-2">
              You are
            </p>
            <h2 
              className="text-3xl font-bold text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {result.name}
            </h2>
          </div>

          <p className="text-[var(--color-text)] leading-relaxed">
            {result.description}
          </p>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-sm text-[var(--color-text-dim)] italic">
              "{result.wisdom}"
            </p>
          </div>

          <button
            onClick={restart}
            className="btn-secondary"
          >
            Question my soup identity again
          </button>
        </div>
      )}
    </FeatureWrapper>
  );
}
