import "server-only";

import OpenAI from "openai";

export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for AI features.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
