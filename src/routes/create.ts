// Map LLM output (raw Gemini or already-parsed) to schema-compliant assessment
function mapLLMToSchema(llm: any): any {
  // If the response is the full Gemini API payload, extract the text then parse
  if (llm?.candidates) {
    const text = llm.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text ?? "")
      .join("") ?? "";
    try {
      llm = JSON.parse(safeJSONCut(text));
    } catch {
      llm = {};
    }
  }

  const mcqs = (llm.mcqs || []).map((q: any, idx: number) => ({
    id: q.id || String(idx + 1),
    prompt: q.question || q.prompt || '',
    options: q.options,
    answerKey: typeof q.answerKey === "number"
      ? q.answerKey
      : (q.options && q.answer ? q.options.indexOf(q.answer) : 0),
    topic: q.topic,
    difficulty: q.difficulty
  }));
  let open = llm.open || {};
  let rubricArr = undefined;
  if (open.rubric && !Array.isArray(open.rubric)) {
    rubricArr = Object.entries(open.rubric).map(([criterion, val]: [string, any]) => ({
      criterion,
      weight: val.points || val.weight || 0,
      mustInclude: val.mustInclude
    }));
  } else if (Array.isArray(open.rubric)) {
    rubricArr = open.rubric;
  }
  return {
    mcqs,
    open: {
      id: open.id || "o1",
      prompt: open.question || open.prompt || '',
      type: open.type || "short",
      referenceAnswer: open.referenceAnswer || '',
      rubric: rubricArr
    }
  };
}
// Route to test LLM integration directly

import { Router } from "express";
import { randomUUID } from "crypto";
import { CreateTestReq, CreateTestRes } from "../schemas/create";
import { extractSkills, inferLevel } from "../lib/parse";
import { generatePrompt } from "../lib/prompts";
import { llmJSON } from "../providers";
import { dedupeMCQByPrompt, ensureCoverageDBAPI, safeJSONCut } from "../lib/utils";
import { Assessment, TAssessment } from "../schemas/common";

type Level = "fresher" | "junior" | "mid" | "senior";

interface TestEntry {
  level: Level;
  assessment: TAssessment;
}

export const tests = new Map<string, TestEntry>();

const router = Router();

router.post("/test/create", async (req: any, res: any) => {
  try {
  console.log("Received /test/create request", req.body);
  const parsed = CreateTestReq.safeParse(req.body);
  if (!parsed.success) {
    console.log("Validation failed:", parsed.error);
    return res.status(400).json({ message: parsed.error.message });
  }

  const { cvText, jdText, level, numMcq } = parsed.data;
  console.log("cvText:", cvText);
  console.log("jdText:", jdText);
  console.log("level:", level, "numMcq:", numMcq);
  const skills = extractSkills(cvText, jdText);
  console.log("Extracted skills:", skills);
  const finalLevel = inferLevel(cvText, jdText, level);
  console.log("Inferred level:", finalLevel);
  const num =
    numMcq ?? (finalLevel === "fresher" || finalLevel === "junior" ? 7 : 5);
  console.log("Number of MCQs to generate:", num);

  const prompt = generatePrompt(finalLevel, num, skills);
  let data: any;
  for (let i = 0; i < num; i++) {
    try {
      const resp = await llmJSON(prompt);
      console.log("Raw LLM response on attempt", i + 1, ":", resp);
  // Map LLM output to schema before validation
  const mapped = mapLLMToSchema(resp);
  const parsedAssess = Assessment.safeParse(mapped);
      if (parsedAssess.success) {
        data = parsedAssess.data;
        console.log("Assessment parsed successfully from LLM on attempt", i + 1);
        break;
      } else {
        console.log("Assessment parse failed on attempt", i + 1, parsedAssess.error);
      }
    } catch (e) {
      console.log("Error calling llmJSON on attempt", i + 1, e);
    }
  }
  if (!data) {
    console.log("Falling back to mock provider");
    const { llmJSON: mockJSON } = await import("../providers/mock");
    const resp = await mockJSON(prompt);
    data = Assessment.parse(resp);
  }


  let mcqs = dedupeMCQByPrompt(data.mcqs);
  console.log("MCQs after dedupe:", mcqs.length);
  mcqs = ensureCoverageDBAPI(mcqs, skills).slice(0, num);
  console.log("MCQs after ensureCoverageDBAPI and slice:", mcqs.length);

  // Ensure at least 3 MCQs to satisfy Zod schema
  if (mcqs.length < 3) {
    console.log(`MCQs less than 3 (${mcqs.length}) after all processing. This is most likely due to your LLM or mock not returning enough unique MCQs.`);
    const { llmJSON: mockJSON } = await import("../providers/mock");
    const mockResp = await mockJSON(prompt);
    const mockData = Assessment.parse(mockResp);
    let mockMcqs = dedupeMCQByPrompt(mockData.mcqs);
    mockMcqs = ensureCoverageDBAPI(mockMcqs, skills);
    // Add missing MCQs from mock, avoiding duplicates
    const needed = 3 - mcqs.length;
    for (let i = 0, j = 0; i < needed && j < mockMcqs.length; j++) {
      const isDuplicate = mcqs.some(m => m.prompt === mockMcqs[j].prompt);
      if (!isDuplicate) {
        mcqs.push(mockMcqs[j]);
        i++;
      }
    }
    mcqs = mcqs.slice(0, Math.max(num, 3));
    console.log("MCQs after filling from mock:", mcqs.length);
  }

  // Always log the final MCQ array before returning
  console.log("Final MCQs before Zod validation/response:", mcqs.length, mcqs);

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
  console.log("Test created with ID:", testId);

  const response = CreateTestRes.parse({
    testId,
    level: finalLevel,
    skills,
    assessment
  });
  console.log("Sending response:", response);
    res.json(response);
  } catch (err) {
    console.error("Unexpected error in /test/create:", err);
    let errorMsg = "";
    if (err && typeof err === "object" && "message" in err) {
      errorMsg = (err as any).message;
    } else {
      errorMsg = String(err);
    }
    res.status(500).json({ message: "Internal server error.", error: errorMsg });
  }

});

router.post("/test/llm", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Missing or invalid 'prompt' in request body." });
    }
    const llmResp = await llmJSON(prompt);
    console.log("Raw LLM response from /test/llm:", llmResp);
    res.json({ llmResponse: llmResp });
  } catch (err) {
    console.error("Error in /test/llm:", err);
    res.status(500).json({ message: "Internal server error."});
  }
});
export default router;
