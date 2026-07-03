"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-ink-800 bg-ink-900/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-brand/30 ring-2 ring-brand/40" />
            <span className="font-semibold tracking-tight">LoopView</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 ${
                    active
                      ? "bg-ink-800 text-white"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="text-sm">
          {loading ? (
            <div className="h-4 w-20 animate-pulse rounded bg-ink-700" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{user.email}</span>
              <button
                onClick={() => void signOut()}
                className="rounded-lg border border-ink-600 px-3 py-1.5 text-slate-300 hover:bg-ink-800"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
