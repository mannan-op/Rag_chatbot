import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { billingPlans, isPaidPlanId } from "../config/billingPlans.js";
import { subscriptionPlan } from "./stripeService.js";

test("billing plan limits match the SaaS specification", () => {
  assert.deepEqual(
    {
      free: [billingPlans.free.monthlyUploadLimit, billingPlans.free.monthlyQuestionLimit],
      pro: [billingPlans.pro.monthlyUploadLimit, billingPlans.pro.monthlyQuestionLimit],
      team: [billingPlans.team.monthlyUploadLimit, billingPlans.team.monthlyQuestionLimit],
    },
    {
      free: [3, 30],
      pro: [100, 2000],
      team: [1000, 20000],
    },
  );
});

test("only paid plans can create Checkout sessions", () => {
  assert.equal(isPaidPlanId("free"), false);
  assert.equal(isPaidPlanId("pro"), true);
  assert.equal(isPaidPlanId("team"), true);
});

test("canceled subscriptions resolve to the free plan", () => {
  const subscription = {
    status: "canceled",
    items: { data: [] },
  } as unknown as Stripe.Subscription;

  assert.equal(subscriptionPlan(subscription), "free");
});
