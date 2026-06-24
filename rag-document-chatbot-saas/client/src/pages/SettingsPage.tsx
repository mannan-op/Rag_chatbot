import axios from "axios";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import Card from "../components/Card";
import FeedbackMessage from "../components/FeedbackMessage";
import FormField from "../components/FormField";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { createCustomerPortalSession } from "../services/billing";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [billingError, setBillingError] = useState("");

  async function handlePortal() {
    setIsOpeningPortal(true);
    setBillingError("");

    try {
      const url = await createCustomerPortalSession();
      window.location.assign(url);
    } catch (error) {
      setBillingError(
        axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message ?? "The billing portal could not be opened."
          : "The billing portal could not be opened.",
      );
      setIsOpeningPortal(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage profile details, billing state, and product preferences from one place."
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>
          <p className="mt-1 text-sm text-gray-500">Account details from your authenticated session.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField
              label="Full name"
              theme="light"
              value={typeof user?.user_metadata.full_name === "string" ? user.user_metadata.full_name : ""}
              readOnly
            />
            <FormField label="Email" theme="light" value={user?.email ?? ""} readOnly />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">Usage limits</h2>
          <p className="mt-1 text-sm text-gray-500">Current monthly allowance on the Free plan.</p>
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">Questions</span>
                <span className="font-medium text-gray-700">18 / 30</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-violet-600" style={{ width: "60%" }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">PDF uploads</span>
                <span className="font-medium text-gray-700">3 / 3</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-amber-400" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-violet-600" />
                <h2 className="text-base font-semibold text-gray-900">Billing</h2>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Update payment methods, review invoices, or change your subscription.
              </p>
            </div>
            <Button variant="secondary" onClick={handlePortal} disabled={isOpeningPortal}>
              {isOpeningPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isOpeningPortal ? "Opening portal" : "Manage billing"}
            </Button>
          </div>
          {billingError ? (
            <FeedbackMessage tone="error" className="mt-4">{billingError}</FeedbackMessage>
          ) : null}
        </Card>
      </section>
    </>
  );
}
