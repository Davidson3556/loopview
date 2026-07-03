import { createClient } from "@insforge/sdk";

/**
 * Browser-side InsForge client (singleton).
 *
 * Uses the anon key + httpOnly refresh cookie flow. Safe to import from client
 * components. All auth, database, realtime, storage and AI calls go through this.
 */

// Trim any trailing slash — otherwise request URLs become `…app//api/…`.
const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!baseUrl || !anonKey) {
  // Surfaced loudly in dev so a missing .env.local is obvious, but doesn't
  // hard-crash the build (env may be injected at runtime on Vercel).
  console.warn(
    "[LoopView] NEXT_PUBLIC_INSFORGE_URL / NEXT_PUBLIC_INSFORGE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local and fill in your InsForge credentials.",
  );
}

export const insforge = createClient({
  baseUrl: baseUrl ?? "",
  anonKey: anonKey ?? "",
});

export type InsforgeClient = typeof insforge;
