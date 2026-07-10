"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/AuthProvider";
import { LoopMark } from "@/components/LoopMark";

type Mode = "signin" | "signup";
type Stage = "form" | "verify" | "reset-request" | "reset-verify";

export default function AuthPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [stage, setStage] = useState<Stage>("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Allow deep-linking the sign-up form via /auth?mode=signup (and ?mode=signin).
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    if (m === "signup" || m === "signin") setMode(m);
  }, []);

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

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { error } = await insforge.auth.sendResetPasswordEmail({ email });
      if (error) throw error;
      setOtp("");
      setNewPassword("");
      setStage("reset-verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send reset code");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Code flow: trade the 6-digit code for a one-time reset token…
      const { data, error: exchangeError } =
        await insforge.auth.exchangeResetPasswordToken({ email, code: otp });
      if (exchangeError) throw exchangeError;
      if (!data?.token) throw new Error("Invalid or expired code");
      // …then set the new password with it.
      const { error: resetError } = await insforge.auth.resetPassword({
        newPassword,
        otp: data.token,
      });
      if (resetError) throw resetError;
      // resetPassword doesn't create a session — sign the user in directly.
      const { error: signInError } = await insforge.auth.signInWithPassword({
        email,
        password: newPassword,
      });
      if (signInError) {
        // Password changed, but auto sign-in failed — send them to sign in.
        setPassword("");
        setStage("form");
        setMode("signin");
        setNotice("Password updated. Sign in with your new password.");
        return;
      }
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  function backToSignIn() {
    setError(null);
    setNotice(null);
    setStage("form");
    setMode("signin");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-white"
        >
          <LoopMark size={28} />
          <span className="text-lg font-semibold">LoopView</span>
        </Link>

        <div className="card p-6">
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

                {mode === "signin" && (
                  <div className="text-right">
                    <button
                      type="button"
                      data-testid="forgot-password"
                      onClick={() => {
                        setError(null);
                        setNotice(null);
                        setStage("reset-request");
                      }}
                      className="text-xs font-medium text-brand-light hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {notice && <NoticeNote>{notice}</NoticeNote>}
                {error && <ErrorNote>{error}</ErrorNote>}

                <button
                  type="submit"
                  data-testid="auth-submit"
                  disabled={busy}
                  className="btn-brand w-full py-2.5"
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
                  type="button"
                  data-testid={mode === "signin" ? "toggle-signup" : "toggle-signin"}
                  aria-label={
                    mode === "signin"
                      ? "Switch to create account form"
                      : "Switch to sign in form"
                  }
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
          ) : stage === "verify" ? (
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
                  className="btn-brand w-full py-2.5"
                >
                  {busy ? "Verifying…" : "Verify & continue"}
                </button>
              </form>
            </>
          ) : stage === "reset-request" ? (
            <>
              <h1 className="text-xl font-semibold text-white">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Enter your account email and we&apos;ll send you a 6-digit reset
                code.
              </p>
              <form onSubmit={handleSendReset} className="mt-6 space-y-4">
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                {error && <ErrorNote>{error}</ErrorNote>}
                <button
                  type="submit"
                  data-testid="send-reset"
                  disabled={busy}
                  className="btn-brand w-full py-2.5"
                >
                  {busy ? "Sending…" : "Send reset code"}
                </button>
              </form>
              <BackToSignIn onClick={backToSignIn} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">
                Set a new password
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Enter the 6-digit code sent to{" "}
                <span className="text-slate-200">{email}</span> and choose a new
                password.
              </p>
              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                <Field
                  label="Reset code"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                />
                <Field
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                {error && <ErrorNote>{error}</ErrorNote>}
                <button
                  type="submit"
                  data-testid="reset-password"
                  disabled={busy}
                  className="btn-brand w-full py-2.5"
                >
                  {busy ? "Updating…" : "Update password & sign in"}
                </button>
              </form>
              <BackToSignIn onClick={backToSignIn} />
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
        className="field"
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

function NoticeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-loop-pass/30 bg-loop-pass/10 px-3 py-2 text-sm text-loop-pass">
      {children}
    </div>
  );
}

function BackToSignIn({ onClick }: { onClick: () => void }) {
  return (
    <p className="mt-4 text-center text-sm text-slate-500">
      <button
        type="button"
        data-testid="back-to-signin"
        onClick={onClick}
        className="font-medium text-brand-light hover:underline"
      >
        Back to sign in
      </button>
    </p>
  );
}
