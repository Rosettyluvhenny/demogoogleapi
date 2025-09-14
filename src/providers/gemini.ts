declare const process: any;
import { safeJSONCut } from "../lib/utils";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function llmText(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + "\nReturn ONLY valid JSON" }] }],
        generationConfig: { temperature: 0.2 }
      })
    }
  );
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
}

export async function llmJSON(prompt: string): Promise<any> {
  const text = await llmText(prompt);
  const cut = safeJSONCut(text);
  return JSON.parse(cut);
}
