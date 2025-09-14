import { Router } from "express";
import { SubmitReq, SubmitRes } from "../schemas/submit";
import { tests } from "./create";
import { scoreMCQ, scoreOpen, totalScore } from "../lib/scoring";

const router = Router();

router.post("/test/submit", async (req: any, res: any) => {
  const parsed = SubmitReq.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.message });

  const { testId, answers } = parsed.data;
  const entry = tests.get(testId);
  if (!entry) return res.status(404).json({ message: "test not found" });

  const mcq = scoreMCQ(entry.assessment, answers.mcq);
  const open = await scoreOpen(entry.assessment.open, answers.open);
  const score = totalScore(entry.level, mcq.normalized, open.normalized);
  const passed = score >= 0.7;

  const response = SubmitRes.parse({
    passed,
    score,
    breakdown: { mcq, open }
  });
  res.json(response);
});

export default router;
