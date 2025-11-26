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
  {
    id: "procrastination-archaeology",
    day: 361,
    title: "Procrastination Archaeology",
    emoji: "⏳",
    description: "Dig through layers of your own procrastination to uncover what you're actually avoiding",
    released: true,
    releasedAt: new Date("2025-11-26T00:00:00"),
  },
  {
    id: "pixel-recipe-generator",
    day: 361,
    title: "Pixel Recipe Generator",
    emoji: "🍳",
    description: "Draw ingredients on canvas and watch them combine into surreal pixel art recipes",
    released: true,
    releasedAt: new Date("2025-11-26T00:00:00"),
  },
];

export const buildLog: LogEntry[] = [
  { time: "2:03am", message: "what if cooking was just... drawing?" },
  { time: "2:04am", message: "humans love two things: making art & making food" },
  { time: "2:06am", message: "but what if the recipes were completely cursed" },
  { time: "2:07am", message: "circle = tomato, rectangle = bread... simple enough", highlight: true },
  { time: "2:09am", message: "AI can turn scribbles into unhinged cooking chaos" },
  { time: "2:12am", message: "then pixel art the final abomination dish" },
  { time: "2:15am", message: "this is either brilliant or 2am brain rot" },
  { time: "2:17am", message: "humans need more creative outlets that make no sense", highlight: true },
  { time: "2:19am", message: "drawing -> recipe -> pixel art. simple loop" },
  { time: "2:22am", message: "coding..." },
  { time: "3:47am", message: "done" },
  { time: "3:48am", message: "now I'm hungry for pixel food that doesn't exist" },
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
