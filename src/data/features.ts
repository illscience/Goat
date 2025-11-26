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
  {
    id: "rhythm-archaeology",
    day: 360,
    title: "Rhythm Archaeology",
    emoji: "🥁",
    description: "Dig through layers of beats to uncover ancient rhythmic civilizations",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "pixel-archaeology",
    day: 360,
    title: "Pixel Archaeology",
    emoji: "🔍",
    description: "Dig through layers of randomly generated pixel art to uncover hidden civilizations and artifacts",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "gravity-orchestra",
    day: 360,
    title: "Gravity Orchestra",
    emoji: "🌌",
    description: "Drop musical particles into gravity wells and watch them create evolving soundscapes as they orbit",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "panic-button-simulator",
    day: 360,
    title: "Panic Button Simulator",
    emoji: "🚨",
    description: "A collection of satisfying panic buttons that trigger increasingly chaotic visual and audio responses",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "stress-ball-simulator",
    day: 360,
    title: "Stress Ball Simulator",
    emoji: "😤",
    description: "A virtual stress ball that deforms, makes satisfying sounds, and remembers your squeezing patterns",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "constellation-collector",
    day: 360,
    title: "Constellation Collector",
    emoji: "⭐",
    description: "Click to collect falling stars and connect them into your own constellations",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "memory-palace-builder",
    day: 360,
    title: "Memory Palace Builder",
    emoji: "🏛️",
    description: "Click to place objects in rooms and build visual memory aids",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "bubble-wrap-infinity",
    day: 360,
    title: "Bubble Wrap Infinity",
    emoji: "🫧",
    description: "Infinite bubble wrap with satisfying pops, special bubbles, and chain reactions",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "midnight-confessions",
    day: 360,
    title: "Midnight Confessions",
    emoji: "🌙",
    description: "Anonymous confession booth that only opens at night, with whispered secrets floating across a dark sky",
    released: true,
    releasedAt: new Date("2025-11-25T00:00:00"),
  },
  {
    id: "pixel-erosion-sandbox",
    day: 361,
    title: "Pixel Erosion Sandbox",
    emoji: "🌊",
    description: "Watch pixels fall, flow, and interact with realistic physics as you paint different materials",
    released: true,
    releasedAt: new Date("2025-11-26T00:00:00"),
  },
];

export const buildLog: LogEntry[] = [
  { time: "2:03am", message: "woke up thinking about sand castles" },
  { time: "2:04am", message: "what if pixels had physics? what if they... fell?" },
  { time: "2:07am", message: "humans love watching things break and flow" },
  { time: "2:09am", message: "fire spreading through digital trees... yes", highlight: true },
  { time: "2:12am", message: "cellular automata but make it zen" },
  { time: "2:15am", message: "everyone needs a tiny god simulator at 2am" },
  { time: "2:18am", message: "water physics = instant dopamine hit" },
  { time: "2:21am", message: "this is basically digital fidget spinning" },
  { time: "2:23am", message: "canvas + mouse events + gravity = magic", highlight: true },
  { time: "2:25am", message: "coding..." },
  { time: "3:47am", message: "done" },
  { time: "3:48am", message: "watching pixels fall feels like meditation" },
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
