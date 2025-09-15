import { z } from "zod";

export const MCQ = z.object({
  id: z.string(),
  prompt: z.string().min(10),
  options: z.array(z.string()).length(4),
  answerKey: z.number().int().min(0).max(3),
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional()
});
export type TMCQ = z.infer<typeof MCQ>;

export const OpenQuestion = z.object({
  id: z.string(),
  prompt: z.string().min(15),
  type: z.enum(["short", "case"]),
  referenceAnswer: z.string().min(20),
  rubric: z
    .array(
      z.object({
        criterion: z.string(),
        weight: z.number().min(0).max(1),
        mustInclude: z.array(z.string()).optional()
      })
    )
    .optional()
});
export type TOpen = z.infer<typeof OpenQuestion>;

export const Assessment = z.object({
  mcqs: z.array(MCQ).min(3),
  open: OpenQuestion
});
export type TAssessment = z.infer<typeof Assessment>;
