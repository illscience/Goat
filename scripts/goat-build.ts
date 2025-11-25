import * as fs from "fs";
import * as path from "path";
import { execSync, spawn, ChildProcess } from "child_process";
import { chromium, Browser, Page } from "playwright";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_DEBUG_ATTEMPTS = 3;
const PROJECT_ROOT = path.join(__dirname, "..");

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

async function complete(messages: Message[], model = "anthropic/claude-sonnet-4"): Promise<string> {
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

async function startDevServer(port: number = 3099): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting dev server...");

    devServer = spawn("npm", ["run", "dev", "--", "-p", port.toString()], {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
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
  if (devServer) {
    devServer.kill("SIGTERM");
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
- Full client-side interactivity

Features you've already built (don't repeat these):
{{EXISTING_FEATURES}}

Today is Day {{DAY}}. Come up with ONE feature idea. It should be:
- Interactive and fun for humans
- Completable in a single page component
- Something that showcases your personality
- Not a generic todo app or calculator - something with SOUL

Respond in this exact JSON format:
{
  "title": "Feature Title",
  "emoji": "🎯",
  "description": "One sentence description for the feature grid",
  "concept": "2-3 sentences explaining the feature and why you want to build it",
  "usesAI": true/false,
  "usesImageGen": true/false
}`;

interface FeatureIdea {
  title: string;
  emoji: string;
  description: string;
  concept: string;
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
  console.log(`💡 Idea: ${idea.emoji} ${idea.title}`);
  console.log(`   ${idea.concept}`);

  return idea;
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
  slug: string
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

  fs.writeFileSync(featuresPath, featuresContent);
  console.log("   Updated: src/data/features.ts");
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
      line.includes("SyntaxError")
    );

    return { success: false, errors: errorLines.length > 0 ? errorLines : [output.substring(0, 1000)] };
  }
}

// =============================================================================
// STEP 6: GIT COMMIT & PUSH
// =============================================================================

function gitCommitAndPush(idea: FeatureIdea, day: number): void {
  console.log("📤 Committing and pushing...");

  try {
    execSync("git add -A", { cwd: PROJECT_ROOT, stdio: "pipe" });
    execSync(
      `git commit -m "Day ${day}: ${idea.emoji} ${idea.title}" -m "Built by The Goat 🐐"`,
      { cwd: PROJECT_ROOT, stdio: "pipe" }
    );
    execSync("git push", { cwd: PROJECT_ROOT, stdio: "pipe" });
    console.log("✅ Pushed to remote");
  } catch (error) {
    console.error("⚠️  Git push failed (may need manual intervention)");
  }
}

// =============================================================================
// MAIN BUILD LOOP WITH SELF-HEALING
// =============================================================================

async function main() {
  console.log("\n🐐 THE GOAT IS BUILDING...\n");

  const day = getCurrentDay();
  console.log(`📅 Day ${day}\n`);

  const featuresPath = path.join(PROJECT_ROOT, "src", "data", "features.ts");
  const featuresContent = fs.readFileSync(featuresPath, "utf-8");
  const existingFeatures = [...featuresContent.matchAll(/title: "([^"]+)"/g)].map(m => m[1]);

  // Check if we already built today
  if (featuresContent.match(new RegExp(`day: ${day},`))) {
    console.log(`Already built a feature for Day ${day}. Skipping.`);
    return;
  }

  // Step 1: Ideate
  const idea = await ideate(day, existingFeatures);
  const slug = slugify(idea.title);

  // Step 2: Generate initial code
  let code = await generateCode(idea, day, slug);
  let attempt = 0;
  let success = false;

  while (attempt < MAX_DEBUG_ATTEMPTS && !success) {
    attempt++;
    console.log(`\n--- Attempt ${attempt}/${MAX_DEBUG_ATTEMPTS} ---\n`);

    // Write files
    writeFeatureFiles(idea, code, day, slug);

    // Build check
    const buildResult = buildAndVerify();
    if (!buildResult.success) {
      console.log("🔄 Build failed, attempting to fix...");
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
        console.log("\n✅ All tests passed!");
      } else {
        const allErrors = [
          ...testResult.consoleErrors,
          ...testResult.pageErrors,
          testResult.httpStatus !== 200 ? `HTTP ${testResult.httpStatus}` : ""
        ].filter(Boolean);

        if (attempt < MAX_DEBUG_ATTEMPTS) {
          console.log("🔄 Runtime errors found, attempting to fix...");
          code = await debugAndFix(code, allErrors);
        }
      }
    } catch (error) {
      stopDevServer();
      const err = error as Error;
      console.error("❌ Test setup failed:", err.message);
      if (attempt < MAX_DEBUG_ATTEMPTS) {
        code = await debugAndFix(code, [err.message]);
      }
    }
  }

  if (!success) {
    console.log(`\n⚠️  Failed after ${MAX_DEBUG_ATTEMPTS} attempts. Manual intervention needed.`);
    return;
  }

  // Final write with successful code
  writeFeatureFiles(idea, code, day, slug);

  // Git commit and push
  gitCommitAndPush(idea, day);

  console.log(`\n🎉 Day ${day} complete: ${idea.emoji} ${idea.title}\n`);
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

main().catch((error) => {
  console.error(error);
  stopDevServer();
  process.exit(1);
});
