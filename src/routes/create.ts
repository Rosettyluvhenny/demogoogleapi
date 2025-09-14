import { Router } from "express";
import { randomUUID } from "crypto";
import { CreateTestReq, CreateTestRes } from "../schemas/create";
import { extractSkills, inferLevel } from "../lib/parse";
import { generatePrompt } from "../lib/prompts";
import { llmJSON } from "../providers";
import { dedupeMCQByPrompt, ensureCoverageDBAPI } from "../lib/utils";
import { Assessment, TAssessment } from "../schemas/common";

type Level = "fresher" | "junior" | "mid" | "senior";

interface TestEntry {
  level: Level;
  assessment: TAssessment;
}

export const tests = new Map<string, TestEntry>();

const router = Router();

router.post("/test/create", async (req: any, res: any) => {
  const parsed = CreateTestReq.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.message });

  const { cvText, jdText, level, numMcq } = parsed.data;
  const skills = extractSkills(cvText, jdText);
  const finalLevel = inferLevel(cvText, jdText, level);
  const num =
    numMcq ?? (finalLevel === "fresher" || finalLevel === "junior" ? 7 : 5);

  const prompt = generatePrompt(finalLevel, num, skills);
  let data: any;
  for (let i = 0; i < 2; i++) {
    try {
      const resp = await llmJSON(prompt);
      const parsedAssess = Assessment.safeParse(resp);
      if (parsedAssess.success) {
        data = parsedAssess.data;
        break;
      }
    } catch {}
  }
  if (!data) {
    const { llmJSON: mockJSON } = await import("../providers/mock");
    const resp = await mockJSON(prompt);
    data = Assessment.parse(resp);
  }

  let mcqs = dedupeMCQByPrompt(data.mcqs);
  mcqs = ensureCoverageDBAPI(mcqs, skills).slice(0, num);

  let open = data.open;
  if (finalLevel === "fresher" || finalLevel === "junior") {
    open.type = "short";
  } else {
    open.type = "case";
    if (!open.rubric) {
      open.rubric = [
        { criterion: "accuracy", weight: 0.5 },
        { criterion: "clarity", weight: 0.3 },
        { criterion: "relevance", weight: 0.2 }
      ];
    }
  }

  const assessment: TAssessment = { mcqs, open };
  const testId = randomUUID();
  tests.set(testId, { level: finalLevel, assessment });

  const response = CreateTestRes.parse({
    testId,
    level: finalLevel,
    skills,
    assessment
  });
  res.json(response);
});

export default router;
