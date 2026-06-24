import OpenAI from "openai";
import { env } from "./env.js";

const apiKey = env.llmApiKey ?? env.openAiApiKey;

export const llmClient = apiKey
  ? new OpenAI({
      apiKey,
      ...(env.llmBaseUrl ? { baseURL: env.llmBaseUrl } : {}),
    })
  : null;
