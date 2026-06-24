import type { BillingRedirectResponse } from "../types/api";
import api from "./api";

export type PaidPlanId = "pro" | "team";

export async function createCheckoutSession(plan: PaidPlanId) {
  const { data } = await api.post<BillingRedirectResponse>(
    "/api/stripe/create-checkout-session",
    { plan },
  );

  return data.url;
}

export async function createCustomerPortalSession() {
  const { data } = await api.post<BillingRedirectResponse>(
    "/api/stripe/customer-portal",
  );

  return data.url;
}
