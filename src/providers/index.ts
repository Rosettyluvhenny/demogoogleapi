declare const process: any;
import { llmText as gText, llmJSON as gJSON } from "./gemini";
import { llmText as mText, llmJSON as mJSON } from "./mock";

// Prefer the real provider when a GEMINI_API_KEY is present or explicitly selected
const useGemini =
  process.env.LLM_PROVIDER === "gemini" || Boolean(process.env.GEMINI_API_KEY);

export const llmText = useGemini ? gText : mText;
export const llmJSON = useGemini ? gJSON : mJSON;
export const usingGemini = useGemini;
