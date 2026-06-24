import type Stripe from "stripe";
import {
  billingPlans,
  isPaidPlanId,
  planIdFromPriceId,
  type PaidPlanId,
  type PlanId,
} from "../config/billingPlans.js";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { supabaseAdmin } from "../config/supabase.js";

type ProfileRow = {
  stripe_customer_id: string | null;
};

export class StripeServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

function requireStripe() {
  if (!stripe) {
    throw new StripeServiceError("Stripe is not configured on the server.", 503);
  }

  return stripe;
}

function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new StripeServiceError("Supabase is not configured on the server.", 503);
  }

  return supabaseAdmin;
}

async function getProfile(userId: string) {
  const { data, error } = await requireSupabaseAdmin()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("Could not read billing profile.", error);
    throw new StripeServiceError("Could not read the billing profile.", 500);
  }

  if (!data) {
    throw new StripeServiceError("Billing profile not found.", 404);
  }

  return data;
}

export async function createCheckoutSession(
  userId: string,
  email: string | undefined,
  planId: PaidPlanId,
) {
  const stripeClient = requireStripe();
  const profile = await getProfile(userId);
  const plan = billingPlans[planId];

  if (!plan.priceId) {
    throw new StripeServiceError(`Stripe pricing is not configured for the ${planId} plan.`, 503);
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${env.clientUrl}/settings?checkout=success`,
    cancel_url: `${env.clientUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: userId,
    metadata: {
      userId,
      plan: planId,
    },
    subscription_data: {
      metadata: {
        userId,
        plan: planId,
      },
    },
    ...(profile.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : email
        ? { customer_email: email }
        : {}),
  });

  if (!session.url) {
    throw new StripeServiceError("Stripe did not return a Checkout URL.", 502);
  }

  return session.url;
}

export async function createCustomerPortalSession(userId: string) {
  const profile = await getProfile(userId);

  if (!profile.stripe_customer_id) {
    throw new StripeServiceError("No Stripe customer exists for this account.", 409);
  }

  const session = await requireStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${env.clientUrl}/settings`,
  });

  return session.url;
}

async function updateProfilePlan(
  customerId: string,
  planId: PlanId,
  userId?: string,
) {
  const plan = billingPlans[planId];
  let query = requireSupabaseAdmin()
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      plan: plan.id,
      monthly_question_limit: plan.monthlyQuestionLimit,
      monthly_upload_limit: plan.monthlyUploadLimit,
    });

  query = userId
    ? query.eq("id", userId)
    : query.eq("stripe_customer_id", customerId);

  const { error } = await query;

  if (error) {
    console.error("Could not update the billing profile.", error);
    throw new StripeServiceError("Could not update the billing profile.", 500);
  }
}

function customerIdFrom(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export function subscriptionPlan(subscription: Stripe.Subscription): PlanId {
  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired" ||
    subscription.status === "unpaid"
  ) {
    return "free";
  }

  const priceId = subscription.items.data[0]?.price.id;
  return priceId ? planIdFromPriceId(priceId) : "free";
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = customerIdFrom(session.customer);
  const planId = session.metadata?.plan;
  const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;

  if (!customerId || !userId || !isPaidPlanId(planId)) {
    return;
  }

  await updateProfilePlan(customerId, planId, userId);
}

async function handleSubscription(subscription: Stripe.Subscription) {
  const customerId = customerIdFrom(subscription.customer);

  if (!customerId) {
    return;
  }

  await updateProfilePlan(customerId, subscriptionPlan(subscription));
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(event.data.object);
      break;
    default:
      break;
  }
}

export function constructStripeEvent(
  payload: Buffer,
  signature: string,
) {
  if (!env.stripeWebhookSecret) {
    throw new StripeServiceError("Stripe webhooks are not configured on the server.", 503);
  }

  return requireStripe().webhooks.constructEvent(
    payload,
    signature,
    env.stripeWebhookSecret,
  );
}
