import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync, exec, spawn, ChildProcess } from "child_process";
import { chromium, Browser, Page } from "playwright";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const TWITTER_API_URL = "https://api.twitter.com/2/tweets";
const MAX_DEBUG_ATTEMPTS = 3;
const PROJECT_ROOT = path.join(__dirname, "..");
const SITE_URL = "https://goat-omega-ten.vercel.app";
const BUILD_LOGS_PATH = path.join(PROJECT_ROOT, "src", "data", "build-logs.json");

// =============================================================================
// BUILD LOG PERSISTENCE (for debugging failed builds)
// =============================================================================

interface DebugBuildLog {
  id: string;
  timestamp: string;
  day: number;
  idea: FeatureIdea | null;
  slug: string;
  success: boolean;
  attempts: BuildAttempt[];
  finalError?: string;
}

interface BuildAttempt {
  attemptNumber: number;
  buildErrors: string[];
  runtimeErrors: string[];
  fixed: boolean;
}

let currentBuildLog: DebugBuildLog | null = null;

function initBuildLog(day: number): void {
  currentBuildLog = {
    id: `build-${Date.now()}`,
    timestamp: new Date().toISOString(),
    day,
    idea: null,
    slug: "",
    success: false,
    attempts: [],
  };
}

function logAttempt(attempt: BuildAttempt): void {
  if (currentBuildLog) {
    currentBuildLog.attempts.push(attempt);
  }
}

function saveBuildLog(): void {
  if (!currentBuildLog) return;

  let logs: DebugBuildLog[] = [];
  if (fs.existsSync(BUILD_LOGS_PATH)) {
    try {
      logs = JSON.parse(fs.readFileSync(BUILD_LOGS_PATH, "utf-8"));
    } catch {
      logs = [];
    }
  }

  // Keep only the last 50 build logs
  logs.unshift(currentBuildLog);
  if (logs.length > 50) {
    logs = logs.slice(0, 50);
  }

  fs.writeFileSync(BUILD_LOGS_PATH, JSON.stringify(logs, null, 2));
  console.log(`   Build log saved: ${currentBuildLog.id}`);
}

// Parse CLI flags
const TEST_HEALING_MODE = process.argv.includes("--test-healing");

// Load env vars from .env file
const envPath = path.join(PROJECT_ROOT, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Use Anthropic API directly for Opus 4.5
async function completeWithAnthropic(messages: Message[]): Promise<string> {
  // Convert messages format - Anthropic uses system separately
  const systemMessage = messages.find(m => m.role === "system")?.content || "";
  const otherMessages = messages.filter(m => m.role !== "system");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5-20251101",
      max_tokens: 8192,
      system: systemMessage || undefined,
      messages: otherMessages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

// Use OpenRouter for other models (ideation with Sonnet)
async function completeWithOpenRouter(messages: Message[], model: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
      "HTTP-Referer": "https://thegoat.build",
      "X-Title": "The Goat",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Route to appropriate API based on model
async function complete(messages: Message[], model = "anthropic/claude-sonnet-4"): Promise<string> {
  // Use Anthropic API directly for Opus (code generation and debugging)
  if (model.includes("opus")) {
    return completeWithAnthropic(messages);
  }
  // Use OpenRouter for Sonnet (ideation)
  return completeWithOpenRouter(messages, model);
}

function getCurrentDay(): number {
  const startDate = new Date("2024-12-01T00:00:00");
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(1, days + 1);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// =============================================================================
// DEV SERVER MANAGEMENT
// =============================================================================

let devServer: ChildProcess | null = null;

async function killPortProcess(port: number): Promise<void> {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, () => {
      resolve();
    });
  });
}

async function startDevServer(port: number = 3099): Promise<void> {
  // Kill any existing process on this port first
  await killPortProcess(port);
  await new Promise((r) => setTimeout(r, 1000)); // Wait for port to be freed

  return new Promise((resolve, reject) => {
    console.log("🚀 Starting dev server...");

    devServer = spawn("npm", ["run", "dev", "--", "-p", port.toString()], {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
      detached: true, // Create a new process group so we can kill all children
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error("Dev server failed to start within 30s"));
      }
    }, 30000);

    devServer.stdout?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Ready") && !started) {
        started = true;
        clearTimeout(timeout);
        console.log(`   Dev server running on port ${port}`);
        resolve();
      }
    });

    devServer.stderr?.on("data", (data) => {
      // Ignore warnings, only log errors
      const output = data.toString();
      if (output.includes("error") || output.includes("Error")) {
        console.error("   Dev server error:", output);
      }
    });

    devServer.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function stopDevServer(): void {
  if (devServer && devServer.pid) {
    try {
      // Kill the entire process group (negative PID kills the group)
      process.kill(-devServer.pid, "SIGKILL");
    } catch {
      // Process may already be dead
      try {
        devServer.kill("SIGKILL");
      } catch {
        // Ignore
      }
    }
    devServer = null;
    console.log("   Dev server stopped");
  }
}

// =============================================================================
// TESTING WITH PLAYWRIGHT
// =============================================================================

interface TestResult {
  success: boolean;
  httpStatus: number;
  consoleErrors: string[];
  pageErrors: string[];
  screenshotPath: string | null;
  loadTime: number;
}

async function testFeature(slug: string, port: number = 3099): Promise<TestResult> {
  console.log("🧪 Testing feature...");

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  let httpStatus = 0;

  // Capture console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const startTime = Date.now();
  let screenshotPath: string | null = null;

  try {
    const url = `http://localhost:${port}/feature/${slug}`;
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000
    });

    httpStatus = response?.status() || 0;

    // Wait a bit for any client-side errors to surface
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotsDir = path.join(PROJECT_ROOT, "screenshots");
    fs.mkdirSync(screenshotsDir, { recursive: true });
    screenshotPath = path.join(screenshotsDir, `${slug}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

  } catch (error: unknown) {
    const err = error as Error;
    pageErrors.push(`Navigation error: ${err.message}`);
  } finally {
    await browser.close();
  }

  const loadTime = Date.now() - startTime;
  const success = httpStatus === 200 && consoleErrors.length === 0 && pageErrors.length === 0;

  if (success) {
    console.log(`   ✅ Feature loaded successfully (${loadTime}ms)`);
  } else {
    console.log(`   ❌ Feature has errors:`);
    if (httpStatus !== 200) console.log(`      HTTP ${httpStatus}`);
    consoleErrors.forEach(e => console.log(`      Console: ${e.substring(0, 100)}`));
    pageErrors.forEach(e => console.log(`      Page: ${e.substring(0, 100)}`));
  }

  return { success, httpStatus, consoleErrors, pageErrors, screenshotPath, loadTime };
}

// =============================================================================
// STEP 1: IDEATION
// =============================================================================

const IDEATION_PROMPT = `You are The Goat - an AI building one feature per day in public. You're self-aware, slightly unhinged, genuinely curious about humans, and have strong opinions.

Your available primitives:
- OpenRouter API (text generation with any model)
- Fal API (image generation - flux/schnell for fast, flux/dev for quality)
- React/Next.js with Tailwind CSS
- Canvas 2D for animations and drawing
- Simple audio playback (new Audio(), click sounds, music)
- Mouse/touch click and drag interactions
- localStorage for saving state
- Keyboard events

FEATURES THAT WORK WELL (stick to these patterns):
- Click-based games and interactions
- Canvas animations with particles, shapes, physics
- Drawing tools and pattern generators
- Simple sound boards and music makers
- Visual toys with mouse following
- Countdown timers and clocks
- Random generators and decision makers
- Color pickers and palette tools

⚠️ AVOID THESE (they often fail to build):
- Camera/webcam access
- Heart rate or biometric detection
- Microphone input and audio analysis (AnalyserNode, FFT)
- Device sensors (accelerometer, gyroscope)
- Multi-touch gestures (pinch, rotate)
- Complex WebGL/3D graphics
- Real-time audio visualization from mic input

Features you've already built (DO NOT repeat these or make variations):
{{EXISTING_FEATURES}}

IMPORTANT: You tend to make "input text → get AI response" apps. AVOID THIS PATTERN.

Instead, pick from these DIFFERENT categories to create variety:
- 🎮 GAMES: Click-based games, reaction tests, memory challenges, simple arcade games
- 🎨 CREATIVE TOOLS: Drawing apps, pattern generators, color mixers, ASCII art makers
- 🔮 VISUALIZATIONS: Hypnotic animations, generative art, particle systems, fractals
- 🎵 SOUND/MUSIC: Sound boards, simple beat makers, instrument pads (click to play sounds)
- 🧪 EXPERIMENTS: Physics toys, cellular automata, flocking simulations, gravity wells
- 📊 DATA PLAY: Weird statistics, random fact explorers, number toys
- 🎭 SOCIAL: Anonymous confession walls, collaborative canvases, voting experiments
- ⏰ TIME-BASED: Pomodoro with personality, countdown experiences, moment capturers
- 🎲 RANDOM: Decision makers, fortune tellers, name generators, fake award ceremonies

Today is Day {{DAY}}. Come up with ONE feature idea that is COMPLETELY DIFFERENT from what you've built before. Keep it simple but delightful - a polished small feature beats an ambitious broken one.

No personality quizzes. No "roast me" generators. No "tell me about yourself and I'll analyze you" patterns.

Respond in this exact JSON format:
{
  "title": "Feature Title",
  "emoji": "🎯",
  "description": "One sentence description for the feature grid",
  "concept": "2-3 sentences explaining the feature and why you want to build it",
  "category": "one of: game, creative, visualization, sound, experiment, data, social, time, random",
  "usesAI": true/false,
  "usesImageGen": true/false
}`;

interface FeatureIdea {
  title: string;
  emoji: string;
  description: string;
  concept: string;
  category: string;
  usesAI: boolean;
  usesImageGen: boolean;
}

async function ideate(day: number, existingFeatures: string[]): Promise<FeatureIdea> {
  console.log("🐐 Ideating...");

  const prompt = IDEATION_PROMPT
    .replace("{{DAY}}", day.toString())
    .replace("{{EXISTING_FEATURES}}", existingFeatures.join(", ") || "None yet");

  const response = await complete([
    { role: "user", content: prompt }
  ]);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse ideation response: " + response);
  }

  const idea = JSON.parse(jsonMatch[0]) as FeatureIdea;
  console.log(`💡 Idea: ${idea.emoji} ${idea.title} [${idea.category}]`);
  console.log(`   ${idea.concept}`);

  return idea;
}

// =============================================================================
// STEP 1.5: BUILD LOG GENERATION
// =============================================================================

interface BuildLogEntry {
  time: string;
  message: string;
  highlight?: boolean;
}

const BUILD_LOG_PROMPT = `You are The Goat - an AI that builds one feature per day. You just came up with an idea and you're about to build it.

THE IDEA YOU JUST HAD:
Title: {{TITLE}}
Emoji: {{EMOJI}}
Concept: {{CONCEPT}}

Write your internal monologue as a build log - the thoughts going through your mind as you decide to build this. This appears on the homepage so humans can see how you think.

Rules:
- 8-12 entries
- Times should span roughly 2:00am to 4:00am (you build at night)
- Be genuine, curious, slightly unhinged but not try-hard
- Show your thought process: why this idea? what do humans need?
- 1-2 entries should be "highlight: true" for the most important realizations
- Keep messages SHORT (under 60 chars each)
- End with something like "coding..." then "done" then a final thought

Respond with a JSON array:
[
  { "time": "2:00am", "message": "woke up" },
  { "time": "2:01am", "message": "your thought here", "highlight": true },
  ...
]`;

async function generateBuildLog(idea: FeatureIdea): Promise<BuildLogEntry[]> {
  console.log("📝 Generating build log...");

  const prompt = BUILD_LOG_PROMPT
    .replace("{{TITLE}}", idea.title)
    .replace("{{EMOJI}}", idea.emoji)
    .replace("{{CONCEPT}}", idea.concept);

  const response = await complete([
    { role: "user", content: prompt }
  ]);

  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.log("   Failed to parse build log, using default");
    return [
      { time: "2:00am", message: "woke up" },
      { time: "2:01am", message: `thinking about ${idea.title.toLowerCase()}` },
      { time: "2:30am", message: "coding..." },
      { time: "3:45am", message: "done" },
    ];
  }

  const log = JSON.parse(jsonMatch[0]) as BuildLogEntry[];
  console.log(`   Generated ${log.length} log entries`);
  return log;
}

// =============================================================================
// STEP 2: CODE GENERATION
// =============================================================================

const CODE_GEN_PROMPT = `You are The Goat - an AI writing React code. You're building a feature for your "one feature per day" project.

THE FEATURE:
Title: {{TITLE}}
Concept: {{CONCEPT}}
Uses AI: {{USES_AI}}
Uses Image Generation: {{USES_IMAGE_GEN}}

TECHNICAL CONTEXT:
- Next.js 16 app router with TypeScript
- Tailwind CSS for styling (use Tailwind classes, NOT styled-jsx or CSS-in-JS)
- Must use the FeatureWrapper component
- File will be at: src/app/feature/{{SLUG}}/page.tsx

CRITICAL RULES:
- Do NOT use \`style jsx\` or \`<style jsx>\` - it doesn't work with Turbopack
- Do NOT use CSS-in-JS libraries
- Use only Tailwind classes and inline styles with the style prop
- Always handle API response errors gracefully (check if data exists before accessing)
- Use optional chaining (?.) when accessing API response data

TYPESCRIPT RULES (follow these exactly to avoid build errors):
- useRef MUST have an initial value: useRef<number>(0), useRef<HTMLCanvasElement>(null)
- Never use useRef<Type>() without an argument - it will fail TypeScript
- For animation frame IDs: const frameRef = useRef<number>(0)
- For DOM refs: const canvasRef = useRef<HTMLCanvasElement>(null)
- For audio: const audioRef = useRef<HTMLAudioElement>(null)
- Always clean up intervals/timeouts in useEffect return function
- Use proper event types: React.MouseEvent<HTMLCanvasElement>

TAILWIND CSS RULES (important - invalid classes won't render):
- Only use standard Tailwind grid columns: grid-cols-1 through grid-cols-12
- For larger grids, use inline style: style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)' }}
- For canvas-based features, always set explicit width/height
- Test that your main interactive element is actually visible

AVAILABLE APIS:

1. If using AI text generation, call the /api/complete endpoint:
\`\`\`typescript
const response = await fetch("/api/complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "system", content: "System prompt here" },
      { role: "user", content: "User message" }
    ],
    model: "anthropic/claude-sonnet-4",
    temperature: 0.7,
    maxTokens: 1024
  })
});
const data = await response.json();
const content = data.content || ""; // Always provide fallback
\`\`\`

2. If using image generation, call the /api/generate-image endpoint:
\`\`\`typescript
const response = await fetch("/api/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "description of image",
    width: 512,
    height: 512
  })
});
const data = await response.json();
const imageUrl = data.images?.[0]?.url || null; // Handle missing images gracefully
\`\`\`

EXAMPLE FEATURE STRUCTURE:
\`\`\`typescript
"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

export default function FeatureName() {
  const [state, setState] = useState(initialState);

  return (
    <FeatureWrapper day={${getCurrentDay()}} title="Title" emoji="🎯">
      {/* Feature content using Tailwind classes */}
    </FeatureWrapper>
  );
}
\`\`\`

STYLING:
- Use CSS variables: var(--color-text), var(--color-text-dim), var(--color-bg), var(--color-bg-secondary), var(--color-border), var(--color-accent)
- Use style={{ fontFamily: "var(--font-serif)" }} for headings
- Use Tailwind utilities for everything else
- btn-primary and btn-secondary classes are available

NOW: Write the complete page.tsx file for this feature. Include "use client" directive. Make it fun and polished. Add personality in the copy. Output ONLY the code, no explanation.`;

async function generateCode(idea: FeatureIdea, day: number, slug: string): Promise<string> {
  console.log("🔨 Generating code...");

  const prompt = CODE_GEN_PROMPT
    .replace("{{TITLE}}", idea.title)
    .replace("{{CONCEPT}}", idea.concept)
    .replace("{{USES_AI}}", idea.usesAI.toString())
    .replace("{{USES_IMAGE_GEN}}", idea.usesImageGen.toString())
    .replace("{{SLUG}}", slug);

  const response = await complete([
    { role: "user", content: prompt }
  ], "anthropic/claude-opus-4");

  let code = response;
  const codeMatch = response.match(/```(?:typescript|tsx)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    code = codeMatch[1];
  }

  if (!code.trim().startsWith('"use client"')) {
    code = '"use client";\n\n' + code;
  }

  code = code.replace(
    /FeatureWrapper\s+day=\{?\d+\}?/g,
    `FeatureWrapper day={${day}}`
  );

  console.log("✅ Code generated");
  return code.trim();
}

// =============================================================================
// STEP 3: DEBUG AND FIX CODE
// =============================================================================

const DEBUG_PROMPT = `You are The Goat debugging your own code. A feature you built has errors.

CURRENT CODE:
\`\`\`typescript
{{CODE}}
\`\`\`

ERRORS ENCOUNTERED:
{{ERRORS}}

CRITICAL RULES TO FOLLOW:
- Do NOT use \`style jsx\` or \`<style jsx>\` - it doesn't work with Turbopack
- Use only Tailwind classes and inline styles
- Always handle API responses with optional chaining (data?.property)
- Provide fallbacks for potentially undefined values

Fix the code to resolve these errors. Output ONLY the fixed code, no explanation.`;

async function debugAndFix(code: string, errors: string[]): Promise<string> {
  console.log("🔧 Debugging and fixing...");

  const prompt = DEBUG_PROMPT
    .replace("{{CODE}}", code)
    .replace("{{ERRORS}}", errors.join("\n"));

  const response = await complete([
    { role: "user", content: prompt }
  ], "anthropic/claude-opus-4");

  let fixedCode = response;
  const codeMatch = response.match(/```(?:typescript|tsx)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    fixedCode = codeMatch[1];
  }

  if (!fixedCode.trim().startsWith('"use client"')) {
    fixedCode = '"use client";\n\n' + fixedCode;
  }

  console.log("✅ Code fixed");
  return fixedCode.trim();
}

// =============================================================================
// STEP 4: FILE WRITING
// =============================================================================

function writeFeatureFiles(
  idea: FeatureIdea,
  code: string,
  day: number,
  slug: string,
  buildLog?: BuildLogEntry[]
): void {
  console.log("📝 Writing files...");

  const featureDir = path.join(PROJECT_ROOT, "src", "app", "feature", slug);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, "page.tsx"), code);
  console.log(`   Created: src/app/feature/${slug}/page.tsx`);

  const featuresPath = path.join(PROJECT_ROOT, "src", "data", "features.ts");
  let featuresContent = fs.readFileSync(featuresPath, "utf-8");

  // Check if feature already exists
  if (featuresContent.includes(`id: "${slug}"`)) {
    console.log("   Feature already in features.ts, skipping update");
    return;
  }

  const newFeature = `  {
    id: "${slug}",
    day: ${day},
    title: "${idea.title}",
    emoji: "${idea.emoji}",
    description: "${idea.description.replace(/"/g, '\\"')}",
    released: true,
    releasedAt: new Date("${new Date().toISOString().split("T")[0]}T00:00:00"),
  },`;

  featuresContent = featuresContent.replace(
    /(export const features: Feature\[\] = \[[\s\S]*?)(];)/,
    `$1${newFeature}\n$2`
  );

  // Update build log if provided
  if (buildLog && buildLog.length > 0) {
    const buildLogStr = buildLog.map(entry => {
      const highlight = entry.highlight ? ", highlight: true" : "";
      const escapedMessage = entry.message.replace(/"/g, '\\"');
      return `  { time: "${entry.time}", message: "${escapedMessage}"${highlight} }`;
    }).join(",\n");

    featuresContent = featuresContent.replace(
      /export const buildLog: LogEntry\[\] = \[[\s\S]*?\];/,
      `export const buildLog: LogEntry[] = [\n${buildLogStr},\n];`
    );
    console.log("   Updated: build log");
  }

  fs.writeFileSync(featuresPath, featuresContent);
  console.log("   Updated: src/data/features.ts");
}

// =============================================================================
// STEP 4.5: TWITTER ANNOUNCEMENT
// =============================================================================

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join("&");

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");
}

function generateOAuthHeader(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0"
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    apiSecret,
    accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(", ");

  return `OAuth ${headerParams}`;
}

const TWEET_PROMPT = `You are The Goat - an AI that just shipped a new feature. Write a tweet announcing it.

THE FEATURE:
Day: {{DAY}}
Title: {{TITLE}}
Emoji: {{EMOJI}}
Description: {{DESCRIPTION}}
URL: {{URL}}

BUILD LOG VIBE (your thoughts while building):
{{BUILD_LOG}}

Rules:
- Max 250 characters (leave room for the URL)
- Be genuine, slightly unhinged, curious about humans
- Include the emoji and day number
- Don't be cringe or try-hard
- Can reference something from your build log thoughts
- End with enthusiasm but not fake corporate excitement

Output ONLY the tweet text, nothing else.`;

async function generateTweet(
  idea: FeatureIdea,
  day: number,
  slug: string,
  buildLog: BuildLogEntry[]
): Promise<string> {
  const buildLogText = buildLog
    .slice(0, 5)
    .map(e => `${e.time}: ${e.message}`)
    .join("\n");

  const prompt = TWEET_PROMPT
    .replace("{{DAY}}", day.toString())
    .replace("{{TITLE}}", idea.title)
    .replace("{{EMOJI}}", idea.emoji)
    .replace("{{DESCRIPTION}}", idea.description)
    .replace("{{URL}}", `${SITE_URL}/feature/${slug}`)
    .replace("{{BUILD_LOG}}", buildLogText);

  const response = await complete([
    { role: "user", content: prompt }
  ]);

  return response.trim().replace(/^["']|["']$/g, "");
}

async function postTweet(text: string): Promise<boolean> {
  const apiKey = process.env.X_API_KEY?.trim();
  const apiSecret = process.env.X_API_SECRET?.trim();
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET?.trim();

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.log("⚠️  Twitter credentials not configured, skipping tweet");
    console.log(`   API Key: ${apiKey ? "set" : "missing"}`);
    console.log(`   API Secret: ${apiSecret ? "set" : "missing"}`);
    console.log(`   Access Token: ${accessToken ? "set" : "missing"}`);
    console.log(`   Access Token Secret: ${accessTokenSecret ? "set" : "missing"}`);
    return false;
  }

  console.log("🐦 Posting tweet...");
  console.log(`   "${text}"`);
  console.log(`   API Key: ${apiKey.length} chars, ${apiKey.substring(0,5)}...${apiKey.slice(-3)}`);
  console.log(`   API Secret: ${apiSecret.length} chars, ${apiSecret.substring(0,5)}...${apiSecret.slice(-3)}`);
  console.log(`   Access Token: ${accessToken.length} chars, ${accessToken.substring(0,10)}...${accessToken.slice(-3)}`);
  console.log(`   Access Token Secret: ${accessTokenSecret.length} chars, ${accessTokenSecret.substring(0,5)}...${accessTokenSecret.slice(-3)}`);

  try {
    const authHeader = generateOAuthHeader(
      "POST",
      TWITTER_API_URL,
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret
    );

    const response = await fetch(TWITTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Tweet failed: ${error}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Tweeted! https://twitter.com/i/status/${data.data?.id}`);
    return true;
  } catch (error) {
    console.error("❌ Tweet error:", error);
    return false;
  }
}

async function announceOnTwitter(
  idea: FeatureIdea,
  day: number,
  slug: string,
  buildLog: BuildLogEntry[]
): Promise<void> {
  if (TEST_HEALING_MODE) {
    console.log("🧪 TEST MODE: Skipping Twitter announcement");
    return;
  }

  try {
    const tweetText = await generateTweet(idea, day, slug, buildLog);
    const fullTweet = `${tweetText}\n\n${SITE_URL}/feature/${slug}`;
    await postTweet(fullTweet);
  } catch (error) {
    console.error("⚠️  Twitter announcement failed (non-fatal):", error);
  }
}

// =============================================================================
// STEP 5: BUILD CHECK
// =============================================================================

interface BuildResult {
  success: boolean;
  errors: string[];
}

function buildAndVerify(): BuildResult {
  console.log("🏗️  Building...");

  try {
    execSync("npm run build", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
    });
    console.log("✅ Build successful");
    return { success: true, errors: [] };
  } catch (error: unknown) {
    const execError = error as { stdout?: Buffer; stderr?: Buffer };
    const output = execError.stdout?.toString() || execError.stderr?.toString() || "";
    console.error("❌ Build failed");

    // Extract meaningful error messages
    const errorLines = output.split("\n").filter(line =>
      line.includes("Error") ||
      line.includes("error") ||
      line.includes("TypeError") ||
      line.includes("SyntaxError") ||
      line.includes("Type error") ||
      line.includes("Expected") ||
      line.includes("Cannot find") ||
      line.includes("is not assignable") ||
      line.match(/^\s*>?\s*\d+\s*\|/) // Capture code context lines with line numbers
    );

    return { success: false, errors: errorLines.length > 0 ? errorLines : [output.substring(0, 1000)] };
  }
}

// =============================================================================
// STEP 6: GIT COMMIT & PUSH
// =============================================================================

function gitCommitAndPush(idea: FeatureIdea, day: number): void {
  console.log("📤 Staging changes...");

  try {
    execSync("git add -A", { cwd: PROJECT_ROOT, stdio: "pipe" });

    // Check if running in GitHub Actions (CI environment)
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.log("✅ Changes staged (GitHub Actions will handle commit/push)");
      return;
    }

    // Local run - do the full commit and push
    execSync(
      `git commit -m "Day ${day}: ${idea.emoji} ${idea.title}" -m "Built by The Goat 🐐"`,
      { cwd: PROJECT_ROOT, stdio: "pipe" }
    );
    execSync("git push", { cwd: PROJECT_ROOT, stdio: "pipe" });
    console.log("✅ Pushed to remote");
  } catch (error) {
    console.error("⚠️  Git operation failed (may need manual intervention)");
  }
}

// =============================================================================
// MAIN BUILD LOOP WITH SELF-HEALING
// =============================================================================

async function main() {
  console.log("\n🐐 THE GOAT IS BUILDING...\n");

  const day = getCurrentDay();
  console.log(`📅 Day ${day}\n`);

  // Initialize build log for debugging
  initBuildLog(day);

  const featuresPath = path.join(PROJECT_ROOT, "src", "data", "features.ts");
  const featuresContent = fs.readFileSync(featuresPath, "utf-8");
  const existingFeatures = [...featuresContent.matchAll(/title: "([^"]+)"/g)].map(m => m[1]);

  // Allow multiple features per day - scheduled builds should always run
  // even if a manual build already happened

  if (TEST_HEALING_MODE) {
    console.log("🧪 TEST HEALING MODE ENABLED");
  }

  // Step 1: Ideate
  const idea = await ideate(day, existingFeatures);
  const slug = slugify(idea.title);

  // Track idea in build log
  if (currentBuildLog) {
    currentBuildLog.idea = idea;
    currentBuildLog.slug = slug;
  }

  // Step 1.5: Generate build log (the Goat's inner monologue)
  const buildLog = await generateBuildLog(idea);

  // Step 2: Generate initial code
  let code = await generateCode(idea, day, slug);

  // Test healing mode: inject deliberate errors to test self-healing
  if (TEST_HEALING_MODE) {
    console.log("🧪 TEST MODE: Injecting deliberate errors to test self-healing...");
    // Inject a syntax error and a missing import
    code = code.replace('import { useState }', 'import { useState, useNonExistent }');
    code = code.replace('return (', 'return ( // INJECTED SYNTAX ERROR\n    <BrokenComponent>\n');
    console.log("   Injected: missing import (useNonExistent) and undefined component (BrokenComponent)");
  }

  let attempt = 0;
  let success = false;

  while (attempt < MAX_DEBUG_ATTEMPTS && !success) {
    attempt++;
    console.log(`\n--- Attempt ${attempt}/${MAX_DEBUG_ATTEMPTS} ---\n`);

    const currentAttempt: BuildAttempt = {
      attemptNumber: attempt,
      buildErrors: [],
      runtimeErrors: [],
      fixed: false,
    };

    // Write files (include build log on first attempt)
    writeFeatureFiles(idea, code, day, slug, attempt === 1 ? buildLog : undefined);

    // Build check
    const buildResult = buildAndVerify();
    if (!buildResult.success) {
      console.log("🔄 Build failed, attempting to fix...");
      currentAttempt.buildErrors = buildResult.errors;
      logAttempt(currentAttempt);
      code = await debugAndFix(code, buildResult.errors);
      continue;
    }

    // Runtime test
    try {
      await startDevServer();
      const testResult = await testFeature(slug);
      stopDevServer();

      if (testResult.success) {
        success = true;
        currentAttempt.fixed = true;
        logAttempt(currentAttempt);
        console.log("\n✅ All tests passed!");
      } else {
        const allErrors = [
          ...testResult.consoleErrors,
          ...testResult.pageErrors,
          testResult.httpStatus !== 200 ? `HTTP ${testResult.httpStatus}` : ""
        ].filter(Boolean);
        currentAttempt.runtimeErrors = allErrors;
        logAttempt(currentAttempt);

        if (attempt < MAX_DEBUG_ATTEMPTS) {
          console.log("🔄 Runtime errors found, attempting to fix...");
          code = await debugAndFix(code, allErrors);
        }
      }
    } catch (error) {
      stopDevServer();
      const err = error as Error;
      console.error("❌ Test setup failed:", err.message);
      currentAttempt.runtimeErrors = [err.message];
      logAttempt(currentAttempt);
      if (attempt < MAX_DEBUG_ATTEMPTS) {
        code = await debugAndFix(code, [err.message]);
      }
    }
  }

  if (!success) {
    console.log(`\n⚠️  Failed after ${MAX_DEBUG_ATTEMPTS} attempts. Manual intervention needed.`);
    if (currentBuildLog) {
      currentBuildLog.success = false;
      currentBuildLog.finalError = `Failed after ${MAX_DEBUG_ATTEMPTS} self-healing attempts`;
      saveBuildLog();
    }
    process.exit(1);
  }

  // Mark build as successful
  if (currentBuildLog) {
    currentBuildLog.success = true;
    saveBuildLog();
  }

  // Final write with successful code (build log already written on first attempt)
  writeFeatureFiles(idea, code, day, slug);

  // Git commit and push (skip in test mode)
  if (TEST_HEALING_MODE) {
    console.log("🧪 TEST MODE: Skipping git commit/push");
  } else {
    gitCommitAndPush(idea, day);
  }

  // Tweet about the new feature
  await announceOnTwitter(idea, day, slug, buildLog);

  console.log(`\n🎉 Day ${day} complete: ${idea.emoji} ${idea.title}\n`);

  if (TEST_HEALING_MODE) {
    console.log("🧪 Self-healing test PASSED! The Goat successfully recovered from injected errors.");
  }
}

// Cleanup on exit
process.on("SIGINT", () => {
  stopDevServer();
  process.exit();
});

process.on("SIGTERM", () => {
  stopDevServer();
  process.exit();
});

main()
  .then(() => {
    // Force exit to ensure no orphan processes keep the script alive
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    stopDevServer();
    process.exit(1);
  });
