import type { LoopIteration } from "./types";

export interface AiFixResult {
  root_cause: string;
  explanation: string;
  file: string | null;
  line: number | null;
  fix_snippet: string | null;
}

/** Ask the server AI route to analyze a failed iteration. */
export async function requestAiFix(
  it: LoopIteration,
): Promise<{ result?: AiFixResult; model?: string; error?: string }> {
  const res = await fetch("/api/ai-fix", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      test_name: it.test_name,
      cli_output: it.cli_output,
      code_diff: it.code_diff,
      file_changed: it.file_changed,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error ?? "AI request failed" };
  return { result: json.result, model: json.model };
}

/**
 * ai_suggestion is stored as JSON when produced by the AI route, or as plain
 * prose for demo/simulated iterations. Parse only the structured form.
 */
export function parseAiSuggestion(s: string | null): AiFixResult | null {
  if (!s) return null;
  try {
    const o = JSON.parse(s);
    if (o && typeof o === "object" && ("explanation" in o || "fix_snippet" in o)) {
      return o as AiFixResult;
    }
  } catch {
    /* plain prose */
  }
  return null;
}
