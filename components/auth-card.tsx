import Link from "next/link";

/** Shared shell for the /login and /signup cards — brand header + framed box
 *  centered on the blueprint-grid background. */
export function AuthCard({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5 hover:opacity-80">
        <div className="flex h-[34px] w-[34px] -rotate-2 items-center justify-center rounded border-2 border-blueprint font-display text-[15px] font-bold text-blueprint">
          RL
        </div>
        <div className="font-display text-[14.5px] font-semibold leading-tight tracking-[0.4px]">
          RFI LOG
          <span className="mt-0.5 block text-[10px] font-medium tracking-[1.6px] text-muted">
            CONSTRUCTION ADMIN
          </span>
        </div>
      </Link>
      <div className="w-full max-w-[400px] rounded-lg border border-line bg-surface px-6 pb-6 pt-5 shadow-2xl">
        <div className="mb-1 font-mono text-[11px] tracking-[1.5px] text-blueprint">
          {kicker}
        </div>
        <h1 className="mb-5 font-display text-[22px] font-semibold tracking-[0.3px]">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

export const AUTH_LABEL_CLASS =
  "block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted-2 mb-1.5";
export const AUTH_INPUT_CLASS =
  "w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-muted-2 focus:border-blueprint focus:outline-none";
