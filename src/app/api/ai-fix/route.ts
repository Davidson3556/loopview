import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * AI Fix Assistant — server-side only. Takes a failed loop iteration's context
 * and asks the InsForge Model Gateway (OpenRouter → Claude Sonnet) for a root
 * cause + concrete fix. OPENROUTER_API_KEY never leaves the server.
 */

export const runtime = "nodejs";

const MODEL = process.env.OPENROUTER_CHAT_MODEL ?? "anthropic/claude-sonnet-5";

interface AiFixRequest {
  test_name?: string;
  cli_output?: string;
  code_diff?: string;
  file_changed?: string;
}

interface AiFixResult {
  root_cause: string;
  explanation: string;
  file: string | null;
  line: number | null;
  fix_snippet: string | null;
}

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "AI is not configured (missing OPENROUTER_API_KEY)." },
      { status: 503 },
    );
  }

  let body: AiFixRequest;
  try {
    body = (await req.json()) as AiFixRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const context = [
    `Test name: ${body.test_name ?? "(unknown)"}`,
    `Changed file: ${body.file_changed ?? "(unknown)"}`,
    `Code diff that was just written:\n${body.code_diff ?? "(none)"}`,
    `TestSprite CLI output:\n${body.cli_output ?? "(none)"}`,
  ].join("\n\n");

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 700,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior engineer triaging a failed end-to-end (TestSprite) test. " +
            "Given the test name, the code diff just written, the changed file, and the CLI output, " +
            "diagnose the failure and propose a minimal concrete fix. " +
            'Respond ONLY as a JSON object with exactly these keys: ' +
            '"root_cause" (1-2 sentence string), "explanation" (2-4 sentence string on how to fix), ' +
            '"file" (string path to edit or null), "line" (integer line number or null), ' +
            '"fix_snippet" (string with the minimal code to apply, or null). No prose outside the JSON.',
        },
        { role: "user", content: context },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Partial<AiFixResult>;
    try {
      parsed = JSON.parse(raw) as Partial<AiFixResult>;
    } catch {
      // Model returned non-JSON; surface it as the explanation.
      parsed = { explanation: raw };
    }

    const result: AiFixResult = {
      root_cause: parsed.root_cause ?? "",
      explanation: parsed.explanation ?? "",
      file: parsed.file ?? body.file_changed ?? null,
      line: typeof parsed.line === "number" ? parsed.line : null,
      fix_snippet: parsed.fix_snippet ?? null,
    };

    return NextResponse.json({ result, model: completion.model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
