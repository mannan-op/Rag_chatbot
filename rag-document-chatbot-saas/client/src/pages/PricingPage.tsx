import axios from "axios";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import Card from "../components/Card";
import FeedbackMessage from "../components/FeedbackMessage";
import PageHeader from "../components/PageHeader";
import { createCheckoutSession, type PaidPlanId } from "../services/billing";

const plans = [
  { id: "free", name: "Free", price: "$0", documents: "3 PDFs", questions: "30 questions/month", size: "10MB max PDF" },
  { id: "pro", name: "Pro", price: "$29", documents: "100 PDFs", questions: "2,000 questions/month", size: "50MB max PDF" },
  { id: "team", name: "Team", price: "$149", documents: "1,000 PDFs", questions: "20,000 questions/month", size: "100MB max PDF" },
] as const;

function errorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Checkout could not be started.";
  }

  return "Checkout could not be started.";
}

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId>();
  const [billingError, setBillingError] = useState("");

  async function handleUpgrade(plan: PaidPlanId) {
    setLoadingPlan(plan);
    setBillingError("");

    try {
      const url = await createCheckoutSession(plan);
      window.location.assign(url);
    } catch (error) {
      setBillingError(errorMessage(error));
      setLoadingPlan(undefined);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Plans for every document workload"
        description="Upgrade securely through Stripe Checkout. Manage an active subscription from workspace settings."
      />

      {billingError ? (
        <FeedbackMessage tone="error" className="mb-5">{billingError}</FeedbackMessage>
      ) : null}

      <section className="grid items-stretch gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col p-6 ${plan.id === "pro" ? "border-violet-300 shadow-[0_16px_50px_rgba(124,58,237,0.10)]" : ""}`}
          >
            {plan.id === "pro" ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3 w-3" />
                Recommended
              </span>
            ) : null}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
              {plan.id !== "pro" ? <CreditCard className="h-4 w-4 text-gray-300" /> : null}
            </div>
            <p className="mt-5 text-3xl font-semibold text-gray-950">
              {plan.price}
              <span className="ml-1 text-sm font-normal text-gray-500">/ month</span>
            </p>
            <div className="mt-6 flex-1 space-y-3 border-t border-gray-100 pt-5">
              {[plan.documents, plan.questions, plan.size].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {feature}
                </div>
              ))}
            </div>
            <Button
              className="mt-7 w-full"
              variant={plan.id === "free" ? "secondary" : "primary"}
              disabled={plan.id === "free" || Boolean(loadingPlan)}
              onClick={() => {
                if (plan.id !== "free") {
                  void handleUpgrade(plan.id);
                }
              }}
            >
              {loadingPlan === plan.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {plan.id === "free"
                ? "Free plan"
                : loadingPlan === plan.id
                  ? "Opening Checkout"
                  : `Upgrade to ${plan.name}`}
            </Button>
          </Card>
        ))}
      </section>
    </>
  );
}
