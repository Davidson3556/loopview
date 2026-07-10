"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { LoopMark } from "./LoopMark";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/docs", label: "Docs" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LoopMark size={26} />
            <span className="font-semibold tracking-tight text-white">
              LoopView
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative rounded-lg px-3 py-1.5 transition ${
                    active
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 -z-10 rounded-lg border border-white/10 bg-white/[0.06]" />
                  )}
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="text-sm">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-white/5" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-slate-400 sm:inline">
                {user.email}
              </span>
              <button
                onClick={() => void signOut()}
                className="btn-ghost px-3 py-1.5 text-sm"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/auth" className="btn-brand px-3.5 py-1.5 text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
