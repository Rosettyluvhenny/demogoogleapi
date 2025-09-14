import { z } from "zod";
import { Assessment } from "./common";

export const CreateTestReq = z.object({
  cvText: z.string().min(50),
  jdText: z.string().optional(),
  level: z.enum(["fresher", "junior", "mid", "senior"]).optional(),
  numMcq: z.number().int().min(3).max(12).optional()
});
export const CreateTestRes = z.object({
  testId: z.string(),
  level: z.enum(["fresher", "junior", "mid", "senior"]),
  skills: z.array(z.string()),
  assessment: Assessment
});
export type TCreateReq = z.infer<typeof CreateTestReq>;
export type TCreateRes = z.infer<typeof CreateTestRes>;
