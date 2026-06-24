import { ArrowRight, FileCheck2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AppLogo from "../components/AppLogo";
import { Button } from "../components/Button";
import Card from "../components/Card";
import FeedbackMessage from "../components/FeedbackMessage";
import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination =
    (location.state as LoginLocationState | null)?.from?.pathname ?? "/dashboard";

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log in.");
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
          <p className="text-xs font-semibold text-sky-400">Welcome back</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Log in to DocuMind</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Continue to your documents, conversations, and usage.
          </p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
            />
            {errorMessage ? (
              <FeedbackMessage tone="error">{errorMessage}</FeedbackMessage>
            ) : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in" : "Log in"}
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to DocuMind?{" "}
            <Link to="/signup" className="font-semibold text-sky-300 hover:text-sky-200">
              Create an account
            </Link>
          </p>
        </Card>
        <section className="hidden lg:block">
          <p className="text-xs font-semibold text-slate-500">DOCUMENT INTELLIGENCE</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-slate-50">
            Your document workspace, ready when you are.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
            Search across indexed PDFs, ask grounded questions, and verify answers against the source.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Private by default</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">User-scoped files and retrieval.</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <FileCheck2 className="h-5 w-5 shrink-0 text-sky-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Citations included</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">Page references with every answer.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
