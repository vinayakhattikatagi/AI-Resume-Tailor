import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  resume: z.string().min(50, "Paste your full resume (at least a few lines)."),
  jobDescription: z.string().min(50, "Paste the full job description."),
});

export const analyzeResumeFn = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { analyzeResume } = await import("./ai/resume.server");
    return analyzeResume(data.resume, data.jobDescription);
  });
