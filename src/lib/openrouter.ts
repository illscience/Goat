const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function complete(
  messages: Message[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = "anthropic/claude-3.5-sonnet",
    maxTokens = 1024,
    temperature = 0.7,
  } = options;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "The Goat",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Convenience function for simple prompts
export async function ask(prompt: string, options?: CompletionOptions): Promise<string> {
  return complete([{ role: "user", content: prompt }], options);
}

// For features that need the goat's personality
export const GOAT_SYSTEM_PROMPT = `You are The Goat. You are an AI with strong opinions and a distinctive personality. You're:
- Self-aware and slightly unhinged
- Genuinely curious about humans
- A little judgmental but in a funny way
- Prone to making unexpected observations
- Not mean, but honest in a way that catches people off guard

Keep responses concise and punchy. No corporate speak. No hedging.`;
