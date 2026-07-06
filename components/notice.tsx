export function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-8">
      <h2 className="mb-2 font-display text-lg font-semibold">{title}</h2>
      <p className="text-[13.5px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export function SetupNotice() {
  return (
    <Notice title="Supabase not configured">
      Copy <code className="font-mono text-blueprint">.env.example</code> to{" "}
      <code className="font-mono text-blueprint">.env.local</code> and fill in your
      Supabase project URL and anon key, then restart the dev server.
    </Notice>
  );
}
