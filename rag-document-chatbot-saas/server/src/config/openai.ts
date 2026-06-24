import OpenAI from "openai";
import { env } from "./env.js";

const hasUsableApiKey =
  Boolean(env.openAiApiKey) &&
  !env.openAiApiKey?.startsWith("your-");

export const openAi = hasUsableApiKey
  ? new OpenAI({
      apiKey: env.openAiApiKey!,
    })
  : null;
