import { z } from "zod";

export const SubmitReq = z.object({
  testId: z.string(),
  answers: z.object({
    mcq: z.array(z.number().int().min(0).max(3)),
    open: z.string().min(1)
  })
});
export const SubmitRes = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  breakdown: z.object({
    mcq: z.object({ raw: z.number(), total: z.number(), normalized: z.number() }),
    open: z.object({
      normalized: z.number(),
      details: z.array(
        z.object({
          criterion: z.string(),
          score0to5: z.number(),
          evidence: z.string()
        })
      )
    })
  })
});
export type TSubmitReq = z.infer<typeof SubmitReq>;
export type TSubmitRes = z.infer<typeof SubmitRes>;
