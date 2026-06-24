import { env } from "./env.js";

export type PlanId = "free" | "pro" | "team";
export type PaidPlanId = Exclude<PlanId, "free">;

export type BillingPlan = {
  id: PlanId;
  monthlyQuestionLimit: number;
  monthlyUploadLimit: number;
  maxPdfSizeMb: number;
  priceId?: string;
};

export const billingPlans: Record<PlanId, BillingPlan> = {
  free: {
    id: "free",
    monthlyQuestionLimit: 30,
    monthlyUploadLimit: 3,
    maxPdfSizeMb: 10,
  },
  pro: {
    id: "pro",
    monthlyQuestionLimit: 2000,
    monthlyUploadLimit: 100,
    maxPdfSizeMb: 50,
    priceId: env.stripeProPriceId,
  },
  team: {
    id: "team",
    monthlyQuestionLimit: 20000,
    monthlyUploadLimit: 1000,
    maxPdfSizeMb: 100,
    priceId: env.stripeTeamPriceId,
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro" || value === "team";
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === "pro" || value === "team";
}

export function planIdFromPriceId(priceId: string): PlanId {
  if (billingPlans.pro.priceId === priceId) {
    return "pro";
  }

  if (billingPlans.team.priceId === priceId) {
    return "team";
  }

  return "free";
}
