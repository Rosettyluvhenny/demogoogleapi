import { dedupe } from "./utils";

type Level = "fresher" | "junior" | "mid" | "senior";

const keywords = [
  "java",
  "spring",
  "flutter",
  "dart",
  "react",
  "node",
  "sql",
  "nosql",
  "rest",
  "grpc",
  "docker",
  "k8s",
  "aws",
  "gcp",
  "redis",
  "kafka",
  "testing",
  "api"
];

export function extractSkills(cvText: string, jdText?: string): string[] {
  const text = (cvText + " " + (jdText || "")).toLowerCase();
  const skills = keywords.filter((k) => text.includes(k));
  return dedupe(skills);
}

export function inferLevel(
  cvText: string,
  jdText: string | undefined,
  provided?: Level
): Level {
  if (provided) return provided;
  const text = (cvText + " " + (jdText || "")).toLowerCase();
  if (/lead|architect/.test(text)) return "senior";
  if (/5\+? years/.test(text)) return "mid";
  return "junior";
}
