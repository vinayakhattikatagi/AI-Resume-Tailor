import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { analyzeResumeFn } from "@/lib/resume.functions";
import type { ResumeAnalysis } from "@/lib/ai/resume.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meridian Tailor — AI Resume Match Analysis" },
      {
        name: "description",
        content:
          "Paste your resume and a job description. Meridian Tailor scores the match, surfaces missing ATS keywords, and rewrites your bullet points for the role.",
      },
      { property: "og:title", content: "Meridian Tailor — AI Resume Match Analysis" },
      {
        property: "og:description",
        content:
          "AI-powered resume tailoring: match score, missing keywords, and rewritten bullets for any job description.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SAMPLE_RESUME = `Senior Product Designer — 7 years experience
- Led end-to-end redesign of the onboarding flow, lifting activation 23%
- Owned design system across 40+ screens in Figma
- Ran usability research with 200+ participants
- Collaborated with engineering on component APIs`;

const SAMPLE_JD = `Lead Product Designer, Northwind
We're seeking a designer to own our Figma libraries, design tokens, and accessibility audits (WCAG 2.2). You'll partner with engineering and data across a 60-person product org, mentor designers, and drive roadmap ownership for the design org.`;

function ScoreRing({ score }: { score: number }) {
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative size-40 shrink-0">
      <svg viewBox="0 0 200 200" className="size-40 -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.32,0.72,0,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-5xl leading-none text-foreground">{score}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">of 100</div>
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeResumeFn({ data: { resume, jobDescription } });
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body antialiased relative overflow-hidden">
      <div className="animate-glow absolute -top-32 -left-24 size-[520px] rounded-full bg-accent/10 blur-[130px]" />
      <div className="animate-glow absolute top-40 -right-32 size-[560px] rounded-full bg-[#3f7cf0]/10 blur-[140px]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-panel/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="font-mono text-sm tracking-tight text-foreground">meridian</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground ml-1">tailor</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {loading ? "analysis · streaming" : analysis ? "analysis · complete" : "analysis · ready"}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6 relative">
        {/* Left column — inputs */}
        <section className="col-span-12 lg:col-span-4 space-y-5 animate-rise">
          <div className="glass-panel p-5">
            <p className="label-mono mb-3">01 · your resume</p>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your full resume here…"
              className="inner-panel w-full h-48 p-3 text-sm text-foreground/90 placeholder:text-muted-foreground leading-relaxed resize-y outline-none focus:border-accent/40 transition-colors bg-transparent"
            />
          </div>
          <div className="glass-panel p-5">
            <p className="label-mono mb-3">02 · job description</p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              className="inner-panel w-full h-48 p-3 text-sm text-foreground/90 placeholder:text-muted-foreground leading-relaxed resize-y outline-none focus:border-accent/40 transition-colors bg-transparent"
            />
          </div>
          <button
            onClick={analyze}
            disabled={loading || resume.trim().length < 50 || jobDescription.trim().length < 50}
            className="w-full rounded-2xl bg-accent text-accent-foreground font-medium text-sm py-3.5 flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Analysing…" : "Analyse resume"}
          </button>
          <button
            onClick={() => {
              setResume(SAMPLE_RESUME);
              setJobDescription(SAMPLE_JD);
            }}
            className="w-full text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Load sample data
          </button>
          {error && (
            <div className="glass-panel p-4 border-destructive/40">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </section>

        {/* Right column — results */}
        <section className="col-span-12 lg:col-span-8 space-y-5">
          {!analysis && !loading && (
            <div className="glass-panel-strong p-10 text-center animate-rise">
              <h1 className="font-display italic text-3xl text-balance text-foreground leading-tight">
                Know exactly how your resume reads to a recruiter.
              </h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-[52ch] mx-auto text-pretty">
                Paste your resume and a job description. Meridian weights your skills against the posting, surfaces
                missing ATS keywords, and rewrites your bullets for the role.
              </p>
            </div>
          )}

          {loading && (
            <div className="glass-panel-strong p-10 text-center animate-rise">
              <Loader2 className="size-8 animate-spin text-accent mx-auto" />
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-4">
                Weighing your resume against the posting…
              </p>
            </div>
          )}

          {analysis && !loading && (
            <>
              <div className="glass-panel-strong p-6 flex flex-col sm:flex-row items-center gap-8 animate-rise">
                <ScoreRing score={analysis.matchScore} />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="label-mono text-accent mb-1.5">{analysis.verdict}</p>
                  <h1 className="font-display italic text-3xl text-balance text-foreground leading-tight">
                    {analysis.headline}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[46ch] text-pretty">{analysis.summary}</p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-5 glass-panel p-5 animate-rise [animation-delay:120ms]">
                  <p className="label-mono mb-3">matching skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.matchingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-12 md:col-span-7 glass-panel p-5 animate-rise [animation-delay:200ms]">
                  <p className="label-mono mb-3">missing keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missingKeywords.map(({ keyword, importance }) => (
                      <span
                        key={keyword}
                        className={
                          importance === "critical"
                            ? "rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive"
                            : "rounded-full border border-warn/30 bg-warn/10 px-3 py-1 text-xs text-warn"
                        }
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 animate-rise [animation-delay:280ms]">
                <p className="label-mono mb-3">bullet rewrites</p>
                <div className="space-y-3">
                  {analysis.bulletRewrites.map((b, i) => (
                    <div key={i} className="inner-panel p-3.5">
                      <p className="text-xs text-muted-foreground line-through decoration-destructive/40">
                        "{b.before}"
                      </p>
                      <p className="text-sm text-foreground/90 mt-1.5">"{b.after}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-7 glass-panel p-5 animate-rise [animation-delay:360ms]">
                  <p className="label-mono mb-3">specific improvements</p>
                  <ul className="space-y-2.5 text-sm">
                    {analysis.improvements.map((imp, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="text-accent shrink-0">→</span>
                        <span className="text-foreground/80">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-12 md:col-span-5 glass-panel p-5 animate-rise [animation-delay:420ms]">
                  <p className="label-mono mb-3">pre-apply checklist</p>
                  <ul className="space-y-2.5 text-sm">
                    {analysis.checklist.map((c, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className={c.done ? "text-accent shrink-0" : "text-destructive shrink-0"}>
                          {c.done ? "✓" : "○"}
                        </span>
                        <span className={c.done ? "text-foreground/80" : "text-muted-foreground"}>{c.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
