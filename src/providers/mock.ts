import { TAssessment, TMCQ, TOpen } from "../schemas/common";

function buildMCQs(num: number): TMCQ[] {
  const base: TMCQ = {
    id: "1",
    prompt: "What does REST stand for?",
    options: [
      "Representational State Transfer",
      "Random Event State Transfer",
      "Representing State Tree",
      "Remote Execution Sequential Transfer"
    ],
    answerKey: 0
  };
  const mcqs: TMCQ[] = [];
  for (let i = 0; i < num; i++) {
    mcqs.push({ ...base, id: String(i + 1) });
  }
  return mcqs;
}

function buildOpen(isCase: boolean): TOpen {
  if (isCase) {
    return {
      id: "o1",
      prompt: "Design a scalable REST API for a todo app.",
      type: "case",
      referenceAnswer: "Use RESTful endpoints with proper scaling and DB.",
      rubric: [
        { criterion: "accuracy", weight: 0.5 },
        { criterion: "clarity", weight: 0.3 },
        { criterion: "relevance", weight: 0.2 }
      ]
    };
  }
  return {
    id: "o1",
    prompt: "Explain what HTTP is.",
    type: "short",
    referenceAnswer: "HTTP is the protocol for web communication."
  };
}

export async function llmText(prompt: string): Promise<string> {
  return prompt;
}

export async function llmJSON(prompt: string): Promise<any> {
  if (prompt.includes("Score the candidate")) {
    return [
      { criterion: "accuracy", score0to5: 4, evidence: "good" },
      { criterion: "clarity", score0to5: 4, evidence: "clear" },
      { criterion: "relevance", score0to5: 4, evidence: "relevant" }
    ];
  }
  const m = prompt.match(/EXACTLY\s+(\d+)/i);
  const num = m ? parseInt(m[1], 10) : 3;
  const isCase = /case open question/i.test(prompt);
  const assessment: TAssessment = {
    mcqs: buildMCQs(num),
    open: buildOpen(isCase)
  };
  return assessment;
}
