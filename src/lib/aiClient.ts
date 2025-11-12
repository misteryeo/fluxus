import type { PromptMessage } from "@/lib/aiPrompts";

export interface PromptCompletionResult {
  text?: string;
  error?: string;
}

export async function requestPromptCompletion(prompt: PromptMessage): Promise<PromptCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { error: "OpenAI API key not configured" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI completion error:", err);
      return { error: `OpenAI completion failed (${response.status})` };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      return { error: "OpenAI completion returned no content" };
    }

    try {
      const parsed = JSON.parse(content);
      const text = typeof parsed.text === "string" ? parsed.text : undefined;
      const sanitized = sanitizeAIText(text);

      if (!sanitized) {
        return { error: "OpenAI completion returned empty text" };
      }

      return { text: sanitized };
    } catch (error) {
      console.error("OpenAI completion parse error:", error);
      return { error: "Failed to parse OpenAI completion" };
    }
  } catch (error) {
    console.error("OpenAI completion failure:", error);
    return { error: "Failed to call OpenAI completion" };
  }
}

export function sanitizeAIText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
