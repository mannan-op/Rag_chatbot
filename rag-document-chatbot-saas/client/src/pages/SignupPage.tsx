import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AppLogo from "../components/AppLogo";
import { Button } from "../components/Button";
import Card from "../components/Card";
import FeedbackMessage from "../components/FeedbackMessage";
import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";

const benefits = ["3 PDFs on the free plan", "Cited answers by page", "Upgrade path built in"];

export default function SignupPage() {
  const { session, signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const result = await signUp(fullName, email, password);

      if (result.session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setSuccessMessage("Account created. Check your email to confirm your address, then log in.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b10] text-slate-100">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-5 sm:px-8">
        <AppLogo />
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:py-16">
        <Card variant="dark" className="p-6 sm:p-8">
          <p className="text-xs font-semibold text-sky-400">Create workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Start with a free account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Upload up to three PDFs and ask 30 questions each month.
          </p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <FormField
                label="Full name"
                type="text"
                name="fullName"
                autoComplete="name"
                required
                placeholder="Manna Workspace"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
            />
            <FormField
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <FormField
                label="Password"
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                helper="Use at least 8 characters."
            />
            {errorMessage ? (
              <FeedbackMessage tone="error">{errorMessage}</FeedbackMessage>
            ) : null}
            {successMessage ? (
              <FeedbackMessage tone="success">{successMessage}</FeedbackMessage>
            ) : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account" : "Create account"}
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-sky-300 hover:text-sky-200">
              Log in
            </Link>
          </p>
        </Card>
        <section className="hidden lg:block">
          <p className="text-xs font-semibold text-slate-500">FREE PLAN</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-50">Useful from the first document.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
            Build a searchable knowledge space with grounded answers and transparent sources.
          </p>
          <div className="mt-8 max-w-xl divide-y divide-slate-800 border-y border-slate-800">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 py-4">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-400/8 text-emerald-400">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
