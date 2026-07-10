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
      </main>
    </div>
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
