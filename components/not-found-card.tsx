import Link from "next/link";

export function NotFoundCard() {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-10 text-center">
      <div className="mb-2 font-mono text-[11px] tracking-[1px] text-danger">
        404 · NOT FOUND
      </div>
      <h1 className="mb-3 font-display text-2xl font-semibold tracking-[0.3px]">
        This page doesn&apos;t exist
      </h1>
      <p className="mx-auto mb-6 max-w-md text-[13.5px] leading-relaxed text-muted">
        The project or page you&apos;re looking for wasn&apos;t found — it may have
        been removed, or the link is wrong.
      </p>
      <Link
        href="/projects"
        className="inline-block rounded-md bg-blueprint-dim px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110"
      >
        View all projects →
      </Link>
    </div>
  );
}
