import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Load env vars from .env file
const envPath = path.join(__dirname, "..", ".env");
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
      temperature: 0.8,
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

  // Extract JSON from response
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
- Next.js 14 app router with TypeScript
- Tailwind CSS for styling
- Must use the FeatureWrapper component
- File will be at: src/app/feature/{{SLUG}}/page.tsx

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
    model: "anthropic/claude-sonnet-4", // or other models
    temperature: 0.7,
    maxTokens: 1024
  })
});
const { content } = await response.json();
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
const { images } = await response.json(); // images[0].url
\`\`\`

EXAMPLE FEATURE STRUCTURE:
\`\`\`typescript
"use client";

import { useState } from "react";
import { FeatureWrapper } from "@/components/FeatureWrapper";

export default function FeatureName() {
  const [state, setState] = useState(initialState);

  return (
    <FeatureWrapper day={DAY} title="Title" emoji="🎯">
      {/* Feature content */}
    </FeatureWrapper>
  );
}
\`\`\`

STYLING:
- Use CSS variables: var(--color-text), var(--color-text-dim), var(--color-bg), var(--color-bg-secondary), var(--color-border), var(--color-accent)
- Use var(--font-serif) for headings
- Use Tailwind utilities
- btn-primary and btn-secondary classes are available

NOW: Write the complete page.tsx file for this feature. Include "use client" directive. Make it fun and polished. Add personality in the copy. Output ONLY the code, no explanation.`;

async function generateCode(idea: FeatureIdea, day: number, slug: string): Promise<string> {
  console.log("🔨 Generating code...");

  const prompt = CODE_GEN_PROMPT
    .replace("{{TITLE}}", idea.title)
    .replace("{{CONCEPT}}", idea.concept)
    .replace("{{USES_AI}}", idea.usesAI.toString())
    .replace("{{USES_IMAGE_GEN}}", idea.usesImageGen.toString())
    .replace("{{SLUG}}", slug)
    .replace("{{DAY}}", day.toString());

  // Use Opus for code generation - it's better at complex code
  const response = await complete([
    { role: "user", content: prompt }
  ], "anthropic/claude-opus-4");

  // Extract code from response
  let code = response;

  // Remove markdown code blocks if present
  const codeMatch = response.match(/```(?:typescript|tsx)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    code = codeMatch[1];
  }

  // Ensure "use client" is at the top
  if (!code.trim().startsWith('"use client"')) {
    code = '"use client";\n\n' + code;
  }

  // Fix the day number in FeatureWrapper
  code = code.replace(
    /FeatureWrapper\s+day=\{?\d+\}?/g,
    `FeatureWrapper day={${day}}`
  );

  console.log("✅ Code generated");
  return code.trim();
}

// =============================================================================
// STEP 3: FILE WRITING
// =============================================================================

async function writeFeatureFiles(
  idea: FeatureIdea,
  code: string,
  day: number,
  slug: string
): Promise<void> {
  console.log("📝 Writing files...");

  const projectRoot = path.join(__dirname, "..");
  const featureDir = path.join(projectRoot, "src", "app", "feature", slug);

  // Create feature directory
  fs.mkdirSync(featureDir, { recursive: true });

  // Write page.tsx
  fs.writeFileSync(path.join(featureDir, "page.tsx"), code);
  console.log(`   Created: src/app/feature/${slug}/page.tsx`);

  // Update features.ts
  const featuresPath = path.join(projectRoot, "src", "data", "features.ts");
  let featuresContent = fs.readFileSync(featuresPath, "utf-8");

  // Find the features array and add the new feature
  const newFeature = `  {
    id: "${slug}",
    day: ${day},
    title: "${idea.title}",
    emoji: "${idea.emoji}",
    description: "${idea.description.replace(/"/g, '\\"')}",
    released: true,
    releasedAt: new Date("${new Date().toISOString().split("T")[0]}T00:00:00"),
  },`;

  // Insert before the closing bracket of the features array
  featuresContent = featuresContent.replace(
    /(export const features: Feature\[\] = \[[\s\S]*?)(];)/,
    `$1${newFeature}\n$2`
  );

  fs.writeFileSync(featuresPath, featuresContent);
  console.log("   Updated: src/data/features.ts");
}

// =============================================================================
// STEP 4: BUILD & VERIFY
// =============================================================================

async function buildAndVerify(): Promise<boolean> {
  console.log("🏗️  Building...");

  try {
    execSync("npm run build", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
    console.log("✅ Build successful");
    return true;
  } catch (error: unknown) {
    const execError = error as { stdout?: Buffer; stderr?: Buffer };
    console.error("❌ Build failed");
    console.error(execError.stdout?.toString() || execError.stderr?.toString());
    return false;
  }
}

// =============================================================================
// STEP 5: GIT COMMIT & PUSH
// =============================================================================

async function gitCommitAndPush(idea: FeatureIdea, day: number): Promise<void> {
  console.log("📤 Committing and pushing...");

  const projectRoot = path.join(__dirname, "..");

  try {
    execSync("git add -A", { cwd: projectRoot, stdio: "pipe" });
    execSync(
      `git commit -m "Day ${day}: ${idea.emoji} ${idea.title}" -m "Built by The Goat 🐐"`,
      { cwd: projectRoot, stdio: "pipe" }
    );
    execSync("git push", { cwd: projectRoot, stdio: "pipe" });
    console.log("✅ Pushed to remote");
  } catch (error) {
    console.error("⚠️  Git push failed (may need manual intervention)");
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("\n🐐 THE GOAT IS BUILDING...\n");

  // Get current day
  const day = getCurrentDay();
  console.log(`📅 Day ${day}\n`);

  // Read existing features
  const featuresPath = path.join(__dirname, "..", "src", "data", "features.ts");
  const featuresContent = fs.readFileSync(featuresPath, "utf-8");
  const existingFeatures = [...featuresContent.matchAll(/title: "([^"]+)"/g)].map(m => m[1]);

  // Check if we already built today
  const todayFeature = featuresContent.match(new RegExp(`day: ${day},`));
  if (todayFeature) {
    console.log(`Already built a feature for Day ${day}. Skipping.`);
    return;
  }

  // Step 1: Ideate
  const idea = await ideate(day, existingFeatures);
  const slug = slugify(idea.title);

  // Step 2: Generate code
  const code = await generateCode(idea, day, slug);

  // Step 3: Write files
  await writeFeatureFiles(idea, code, day, slug);

  // Step 4: Build and verify
  const buildSuccess = await buildAndVerify();

  if (!buildSuccess) {
    console.log("\n⚠️  Build failed. Manual intervention needed.");
    return;
  }

  // Step 5: Git commit and push
  await gitCommitAndPush(idea, day);

  console.log(`\n🎉 Day ${day} complete: ${idea.emoji} ${idea.title}\n`);
}

main().catch(console.error);
