declare const process: any;
import { llmText as gText, llmJSON as gJSON } from "./gemini";
import { llmText as mText, llmJSON as mJSON } from "./mock";

const useGemini = process.env.LLM_PROVIDER === "gemini";

export const llmText = useGemini ? gText : mText;
export const llmJSON = useGemini ? gJSON : mJSON;
