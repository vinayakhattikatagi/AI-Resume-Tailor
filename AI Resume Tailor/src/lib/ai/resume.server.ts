import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export const resumeAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  verdict: z.string(),
  headline: z.string(),
  summary: z.string(),
  matchingSkills: z.array(z.string()),
  missingKeywords: z.array(
    z.object({
      keyword: z.string(),
      importance: z.enum(["critical", "nice-to-have"]),
    }),
  ),
  bulletRewrites: z.array(
    z.object({
      before: z.string(),
      after: z.string(),
    }),
  ),
  improvements: z.array(z.string()),
  checklist: z.array(
    z.object({
      item: z.string(),
      done: z.boolean(),
    }),
  ),
});

export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;

const SYSTEM_PROMPT = `You are an expert technical recruiter and ATS specialist.

Analyse how well the candidate's resume matches the job description.

Rules:
- Do not invent any experience, skills, or achievements.
- Base every suggestion only on what is actually in the resume and job description.
- Be concrete and specific; quantify only using numbers already present in the resume.

Respond with ONLY a JSON object (no markdown fences) matching this exact shape:
{
  "matchScore": number,              // 0-100 overall match score
  "verdict": string,                 // 1-3 words, e.g. "strong match", "partial match", "weak match"
  "headline": string,                // one confident editorial sentence about the match
  "summary": string,                 // 2-3 sentences explaining the score
  "matchingSkills": string[],        // skills the candidate already has that match the role
  "missingKeywords": [{ "keyword": string, "importance": "critical" | "nice-to-have" }],
  "bulletRewrites": [{ "before": string, "after": string }],  // resume bullets rewritten for this role
  "improvements": string[],          // specific improvements to make
  "checklist": [{ "item": string, "done": boolean }]  // top 5 things to check before applying
}`;

export async function analyzeResume(resume: string, jobDescription: string): Promise<ResumeAnalysis> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new Error("AI is not configured for this app yet.");
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Resume:\n${resume}\n\nJob Description:\n${jobDescription}`,
      },
    ],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = (await result.text).trim();
  const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const parsed = resumeAnalysisSchema.safeParse(JSON.parse(jsonText));
  if (!parsed.success) {
    throw new Error("The AI returned an unexpected format. Please try again.");
  }
  return parsed.data;
}
