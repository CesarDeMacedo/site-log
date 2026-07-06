import Link from "next/link";

export const dynamic = "force-dynamic";

// The Overview dashboard is intentionally last in the build order (SPEC.md §6)
// since it aggregates all three entities — placeholder until then.
export default function OverviewPage() {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-10 text-center">
      <div className="mb-2 font-mono text-[11px] tracking-[1px] text-blueprint">
        OVERVIEW DASHBOARD
      </div>
      <h1 className="mb-3 font-display text-2xl font-semibold tracking-[0.3px]">
        Coming after the entity logs
      </h1>
      <p className="mx-auto mb-6 max-w-md text-[13.5px] leading-relaxed text-muted">
        The dashboard aggregates RFIs, Submittals, and Change Orders, so it is
        built last (SPEC.md build order). The RFI Log is live now.
      </p>
      <Link
        href="/rfis"
        className="inline-block rounded-md bg-blueprint-dim px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110"
      >
        Open the RFI Log →
      </Link>
    </div>
  );
}
