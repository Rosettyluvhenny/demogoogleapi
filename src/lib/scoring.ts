import { llmJSON } from "../providers";
import { clamp } from "./utils";
import { judgePrompt } from "./prompts";
import type { TAssessment, TOpen } from "../schemas/common";

type Level = "fresher" | "junior" | "mid" | "senior";

export function scoreMCQ(
  assessment: TAssessment,
  answers: number[]
): { raw: number; total: number; normalized: number } {
  const total = assessment.mcqs.length;
  let raw = 0;
  assessment.mcqs.forEach((q: any, i: number) => {
    if (answers[i] === q.answerKey) raw += 1;
  });
  const normalized = total ? raw / total : 0;
  return { raw, total, normalized };
}

export async function scoreOpen(question: TOpen, answer: string) {
  const rubric: { criterion: string; weight: number; mustInclude?: string[] }[] =
    question.rubric || [
      { criterion: "accuracy", weight: 0.34 },
      { criterion: "clarity", weight: 0.33 },
      { criterion: "relevance", weight: 0.33 }
    ];
  const details = await llmJSON(judgePrompt(question, answer));
  let normalized = 0;
  for (const det of details) {
    const r = rubric.find((rub) => rub.criterion === det.criterion);
    if (!r) continue;
    normalized += (r.weight || 0) * (det.score0to5 / 5);
  }
  normalized = clamp(normalized, 0, 1);
  return { normalized, details };
}

export function totalScore(level: Level, mcqNorm: number, openNorm: number) {
  if (level === "fresher" || level === "junior")
    return 0.8 * mcqNorm + 0.2 * openNorm;
  return 0.6 * mcqNorm + 0.4 * openNorm;
}
