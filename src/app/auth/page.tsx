"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/AuthProvider";

type Mode = "signin" | "signup";
type Stage = "form" | "verify";

export default function AuthPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [stage, setStage] = useState<Stage>("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await insforge.auth.signUp({
          email,
          password,
          name,
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth`
              : undefined,
        });
        if (error) throw error;
        if (data?.requireEmailVerification) {
          // Code-based verification: collect the 6-digit OTP on this page.
          setStage("verify");
          return;
        }
        // No verification required — session is live.
        await refresh();
        router.push("/dashboard");
      } else {
        const { error } = await insforge.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await refresh();
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await insforge.auth.verifyEmail({ email, otp });
      if (error) throw error;
      // verifyEmail auto-saves the session for the code flow.
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-slate-300"
        >
          <span className="h-6 w-6 rounded-full bg-brand/30 ring-2 ring-brand/40" />
          <span className="text-lg font-semibold">LoopView</span>
        </Link>

        <div className="rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-xl">
          {stage === "form" ? (
            <>
              <h1 className="text-xl font-semibold text-white">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {mode === "signin"
                  ? "Sign in to watch your loop run live."
                  : "Connect a project and start visualizing the loop."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <Field
                    label="Name"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                  />
                )}
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                />

                {error && <ErrorNote>{error}</ErrorNote>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {busy
                    ? "Please wait…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-500">
                {mode === "signin" ? "No account yet?" : "Already registered?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                  }}
                  className="font-medium text-brand-light hover:underline"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">
                Check your email
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                We sent a 6-digit code to{" "}
                <span className="text-slate-200">{email}</span>.
              </p>
              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <Field
                  label="Verification code"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                />
                {error && <ErrorNote>{error}</ErrorNote>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {busy ? "Verifying…" : "Verify & continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-loop-fail/30 bg-loop-fail/10 px-3 py-2 text-sm text-loop-fail">
      {children}
    </div>
  );
}
