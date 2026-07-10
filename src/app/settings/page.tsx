"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/AuthProvider";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [projectId, setProjectId] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  // Load existing settings for this user.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await insforge.database
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) {
        setApiKey(data.testsprite_api_key ?? "");
        setProjectId(data.testsprite_project_id ?? "");
        setAppUrl(data.app_url ?? "");
      }
    })();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setStatus("saving");
    setMessage(null);

    const payload = {
      testsprite_api_key: apiKey || null,
      testsprite_project_id: projectId || null,
      app_url: appUrl || null,
      updated_at: new Date().toISOString(),
    };

    // One settings row per user. Check existence, then update or insert.
    const { data: existing } = await insforge.database
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = existing
      ? await insforge.database
          .from("user_settings")
          .update(payload)
          .eq("user_id", user.id)
      : await insforge.database
          .from("user_settings")
          .insert([{ user_id: user.id, ...payload }]);

    if (error) {
      setStatus("error");
      setMessage(error.message ?? "Failed to save");
    } else {
      setStatus("saved");
      setMessage("Saved.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect your TestSprite project and the app URL under test.
        </p>

        {loading ? (
          <div className="mt-8 h-40 animate-pulse rounded-xl bg-ink-850" />
        ) : !user ? (
          <div className="mt-8 rounded-xl border border-ink-700 bg-ink-850 p-6 text-sm text-slate-400">
            Please{" "}
            <a href="/auth" className="text-brand-light underline">
              sign in
            </a>{" "}
            to manage your connection settings.
          </div>
        ) : (
          <form onSubmit={handleSave} className="card mt-8 space-y-5 p-6">
            <SettingField
              label="TestSprite API key"
              value={apiKey}
              onChange={setApiKey}
              type="password"
              placeholder="ts_live_…"
            />
            <SettingField
              label="TestSprite Project ID"
              value={projectId}
              onChange={setProjectId}
              placeholder="proj_…"
            />
            <SettingField
              label="App URL under test"
              value={appUrl}
              onChange={setAppUrl}
              placeholder="https://your-app.vercel.app"
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={status === "saving"}
                className="btn-brand px-5 py-2.5"
              >
                {status === "saving" ? "Saving…" : "Save settings"}
              </button>
              {message && (
                <span
                  className={`text-sm ${
                    status === "error" ? "text-loop-fail" : "text-loop-pass"
                  }`}
                >
                  {message}
                </span>
              )}
            </div>
          </form>
        )}

        {!loading && user && <ChangePasswordCard email={user.email} />}
      </main>
    </div>
  );
}

type PwStage = "idle" | "code";

/**
 * Lets a signed-in user change their password. InsForge has no authenticated
 * "set password" endpoint, so we drive the email verification-code reset flow:
 * send a code to the user's own email, then exchange code + new password.
 */
function ChangePasswordCard({ email }: { email: string }) {
  const [stage, setStage] = useState<PwStage>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { error } = await insforge.auth.sendResetPasswordEmail({ email });
      if (error) throw error;
      setOtp("");
      setNewPassword("");
      setConfirm("");
      setStage("code");
      setNotice(`We sent a 6-digit code to ${email}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send verification code",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      // Trade the 6-digit code for a one-time reset token…
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

      setStage("idle");
      setOtp("");
      setNewPassword("");
      setConfirm("");
      setNotice("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-6 space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <p className="mt-1 text-sm text-slate-400">
          We&apos;ll email a verification code to your account address, then you
          can set a new password.
        </p>
      </div>

      {stage === "idle" ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={sendCode}
            disabled={busy}
            className="btn-brand px-5 py-2.5"
          >
            {busy ? "Sending…" : "Send verification code"}
          </button>
        </div>
      ) : (
        <form onSubmit={submitNewPassword} className="space-y-5">
          <SettingField
            label="Verification code"
            value={otp}
            onChange={setOtp}
            placeholder="123456"
          />
          <SettingField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            placeholder="••••••••"
          />
          <SettingField
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            type="password"
            placeholder="••••••••"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy || !otp || !newPassword}
              className="btn-brand px-5 py-2.5"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setError(null);
                setNotice(null);
              }}
              disabled={busy}
              className="text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-loop-fail">{error}</p>}
      {notice && !error && <p className="text-sm text-loop-pass">{notice}</p>}
    </section>
  );
}

function SettingField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </label>
  );
}
