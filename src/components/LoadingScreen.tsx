import { LoopMark } from "./LoopMark";

/**
 * Full-screen branded loader. Rendered by App Router `loading.tsx` files during
 * route/data transitions, and reusable anywhere a page is waiting on its first
 * paint. The body's ambient aurora + grid show through behind it.
 */
export function LoadingScreen({
  message = "Spinning up the loop…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6">
      <div className="animate-fade-in flex flex-col items-center">
        {/* Mark with expanding pulse rings */}
        <div className="relative flex items-center justify-center">
          <span className="absolute h-24 w-24 rounded-full border border-brand/40 animate-pulse-ring" />
          <span
            className="absolute h-24 w-24 rounded-full border border-accent-cyan/30 animate-pulse-ring"
            style={{ animationDelay: "0.8s" }}
          />
          <span className="absolute h-20 w-20 rounded-full bg-brand/20 blur-2xl animate-glow-breathe" />
          <div className="animate-float">
            <LoopMark size={64} />
          </div>
        </div>

        {/* Wordmark */}
        <div className="mt-8 text-center">
          <div className="text-lg font-semibold tracking-tight text-white">
            Loop
            <span className="animate-gradient-x bg-loop-gradient bg-[length:200%_auto] bg-clip-text text-transparent">
              View
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">{message}</p>
        </div>

        {/* Loop timeline: dots sweep fail → fixing → pass */}
        <div className="mt-7 flex items-center gap-2">
          {LOADING_DOTS.map((color, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${color} animate-glow-breathe`}
              style={{ animationDelay: `${i * 0.18}s`, animationDuration: "1.4s" }}
            />
          ))}
        </div>

        {/* Indeterminate gradient progress track */}
        <div className="relative mt-6 h-1 w-52 overflow-hidden rounded-full bg-white/[0.06]">
          <span className="absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-loop-gradient animate-loading-sweep" />
        </div>
      </div>
    </div>
  );
}

const LOADING_DOTS = [
  "bg-loop-fail",
  "bg-loop-fail",
  "bg-loop-fixing",
  "bg-loop-fixing",
  "bg-loop-pass",
  "bg-loop-pass",
] as const;
