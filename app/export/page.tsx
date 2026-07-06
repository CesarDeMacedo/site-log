import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-8">
      <h2 className="mb-2 font-display text-lg font-semibold">{title}</h2>
      <p className="text-[13.5px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

interface ExportRow {
  title: string;
  description: string;
  count: number;
  href: string;
}

export default async function ExportPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Notice title="Supabase not configured">
        Copy <code className="font-mono text-blueprint">.env.example</code> to{" "}
        <code className="font-mono text-blueprint">.env.local</code> and fill in your
        Supabase project URL and anon key, then restart the dev server.
      </Notice>
    );
  }

  const supabase = getSupabase();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Project>();

  if (projectError) return <Notice title="Database error">{projectError.message}</Notice>;
  if (!project) {
    return (
      <Notice title="No project found">
        Run the migration and seed in{" "}
        <code className="font-mono text-blueprint">supabase/</code> against your
        Supabase project first.
      </Notice>
    );
  }

  const [rfis, submittals, changeOrders] = await Promise.all([
    supabase.from("rfis").select("id", { count: "exact", head: true }).eq("project_id", project.id),
    supabase.from("submittals").select("id", { count: "exact", head: true }).eq("project_id", project.id),
    supabase.from("change_orders").select("id", { count: "exact", head: true }).eq("project_id", project.id),
  ]);

  const firstError = rfis.error ?? submittals.error ?? changeOrders.error;
  if (firstError) return <Notice title="Database error">{firstError.message}</Notice>;

  const today = todayISO();
  const exports: ExportRow[] = [
    {
      title: "RFI Log",
      description:
        "All RFIs with dates, status, and the computed days-open and overdue flags.",
      count: rfis.count ?? 0,
      href: "/export/rfis",
    },
    {
      title: "Submittal Log",
      description:
        "All submittals with supplier, review progress, due date, and overdue flag.",
      count: submittals.count ?? 0,
      href: "/export/submittals",
    },
    {
      title: "Change Orders (PCO)",
      description: "All change orders with estimated cost (CAD) and status.",
      count: changeOrders.count ?? 0,
      href: "/export/change-orders",
    },
  ];

  return (
    <>
      <div className="mb-[22px]">
        <div className="mb-1 font-mono text-[11px] tracking-[1px] text-blueprint">
          REPORTS · EXPORT / SHARE
        </div>
        <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[0.3px]">
          {project.name}
        </h1>
        <div className="text-[13px] text-muted">
          Download the current logs as CSV for client updates and reporting.
        </div>
      </div>

      <div className="max-w-[720px] rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-[18px] pb-3 pt-4">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
            CSV Export
          </h2>
        </div>
        {exports.map((e) => (
          <div
            key={e.href}
            className="flex items-center justify-between gap-4 border-b border-line/60 px-[18px] py-4 last:border-b-0"
          >
            <div>
              <div className="text-[13.5px] font-semibold text-text">{e.title}</div>
              <div className="mt-0.5 text-[12.5px] text-muted">{e.description}</div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="font-mono text-[11px] text-muted">
                {e.count} {e.count === 1 ? "record" : "records"}
              </span>
              <a
                href={e.href}
                download
                className="rounded-md bg-blueprint-dim px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110"
              >
                Download CSV
              </a>
            </div>
          </div>
        ))}
        <div className="border-t border-line px-[18px] py-3 font-mono text-[10.5px] text-muted-2">
          Files are generated on demand from live data · {today}
        </div>
      </div>
    </>
  );
}
