import dotenv from "dotenv";

dotenv.config();

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  devAutoConfirmEmail: process.env.DEV_AUTO_CONFIRM_EMAIL === "true",
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "documents",
  openAiApiKey: process.env.OPENAI_API_KEY,
  embeddingProvider: process.env.EMBEDDING_PROVIDER ?? "auto",
  llmApiKey: process.env.LLM_API_KEY,
  llmBaseUrl: process.env.LLM_BASE_URL,
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  maxPdfSizeMb: positiveNumber(process.env.MAX_PDF_SIZE_MB, 100),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID,
  stripeTeamPriceId: process.env.STRIPE_TEAM_PRICE_ID,
};
