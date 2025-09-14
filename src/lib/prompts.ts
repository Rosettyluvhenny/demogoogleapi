import type { TOpen } from "../schemas/common";

type Level = "fresher" | "junior" | "mid" | "senior";

export function generatePrompt(
  level: Level,
  numMcq: number,
  skills: string[]
): string {
  const skillsText = skills.join(", ");
  if (level === "fresher" || level === "junior") {
    return `Generate EXACTLY ${numMcq} MCQs (4 options, exactly 1 correct) and 1 short open question for a ${level} candidate. Ground in these skills/JD: ${skillsText}. Ensure at least one DB or API question if backend-leaning. Return ONLY valid JSON: { "mcqs":[...], "open":{...} }`;
  }
  return `Generate EXACTLY ${numMcq} MCQs and 1 case open question with a 3-criterion rubric (accuracy 0.5, clarity 0.3, relevance 0.2). Ground in these skills/JD: ${skillsText}. Ensure at least one DB or API question if backend-leaning. Return ONLY valid JSON: { "mcqs":[...], "open":{...} }`;
}

export function judgePrompt(question: TOpen, answer: string): string {
  return `Score the candidate's answer per rubric (0–5 each). Quote exactly one supporting sentence from the answer for each criterion. Return ONLY JSON array: [{criterion,score0to5,evidence}] ... Include reference answer for guidance only.\nQuestion: ${question.prompt}\nRubric: ${JSON.stringify(question.rubric)}\nReference Answer: ${question.referenceAnswer}\nAnswer: ${answer}`;
}
