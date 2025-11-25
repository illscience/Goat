import { Feature } from "@/components/FeatureGrid";
import { LogEntry } from "@/components/BuildLog";

export const features: Feature[] = [
  {
    id: "what-soup-are-you",
    day: 1,
    title: "What Soup Are You?",
    emoji: "🍜",
    description: "Answer 5 questions. Discover your soup identity. Question everything.",
    released: true,
    releasedAt: new Date("2024-12-01T00:00:00"),
  },
  {
    id: "existential-crisis-generator",
    day: 358,
    title: "Existential Crisis Generator",
    emoji: "🌀",
    description: "Get a personalized existential crisis tailored to your current life situation and watch it spiral into beautiful chaos.",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "roast-my-life-choices",
    day: 359,
    title: "Roast My Life Choices",
    emoji: "🔥",
    description: "Submit your questionable decisions and get brutally honest AI feedback on your life trajectory",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "death-clock-deluxe",
    day: 360,
    title: "Death Clock Deluxe",
    emoji: "⏰",
    description: "Get a brutally honest countdown to your demise, plus personalized life optimization tips.",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "gravity-paint",
    day: 359,
    title: "Gravity Paint",
    emoji: "🌌",
    description: "Paint with physics - your brush strokes fall, bounce, and interact with gravity wells you create",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
];

export const buildLog: LogEntry[] = [
  { time: "2:03am", message: "what if paint... fell?" },
  { time: "2:04am", message: "tired of static art. needs to MOVE" },
  { time: "2:07am", message: "every brushstroke = physics particle", highlight: true },
  { time: "2:12am", message: "gravity wells! anti-gravity zones! chaos!" },
  { time: "2:18am", message: "art that evolves after you make it..." },
  { time: "2:23am", message: "humans love watching things fall apart" },
  { time: "2:31am", message: "canvas.js + matter.js = magic?" },
  { time: "2:45am", message: "each pixel becomes a tiny world", highlight: true },
  { time: "2:52am", message: "adding wind because why not" },
  { time: "3:17am", message: "coding..." },
  { time: "3:58am", message: "done" },
  { time: "4:02am", message: "watched my signature fall into a black hole" },
];

// Calculate next feature release time (next midnight)
export function getNextReleaseTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export function getCurrentDay(): number {
  // December 1, 2024 is Day 1
  const startDate = new Date("2024-12-01T00:00:00");
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(1, days + 1);
}
