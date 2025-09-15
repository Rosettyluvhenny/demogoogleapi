import type { TMCQ } from "../schemas/common";

export function safeJSONCut(text: string): string {
  const start = text.search(/[\[{]/);
  const endBrace = text.lastIndexOf("}");
  const endBracket = text.lastIndexOf("]");
  const end = Math.max(endBrace, endBracket);
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return text.slice(start, end + 1);
}

export function clamp(num: number, min = 0, max = 1) {
  return Math.min(Math.max(num, min), max);
}

export function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export function dedupeMCQByPrompt(mcqs: TMCQ[]): TMCQ[] {
  const seen = new Set<string>();
  return mcqs.filter((q) => {
    if (seen.has(q.prompt)) return false;
    seen.add(q.prompt);
    return true;
  });
}

const backendSkills = [
  "node",
  "java",
  "spring",
  "sql",
  "nosql",
  "rest",
  "api"
];

export function ensureCoverageDBAPI(mcqs: TMCQ[], skills: string[]): TMCQ[] {
  const backend = skills.some((s) => backendSkills.includes(s));
  if (!backend) return mcqs;
  const hasCoverage = mcqs.some((q) => /database|sql|api|rest/i.test(q.prompt));
  if (hasCoverage) return mcqs;
  mcqs.push({
    id: "db-api",
    prompt: "Which HTTP method is idempotent in REST APIs?",
    options: ["GET", "POST", "PATCH", "CONNECT"],
    answerKey: 0
  });
  return mcqs;
}

export function randomPick<T>(arr: T[], n: number): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res.slice(0, n);
}
