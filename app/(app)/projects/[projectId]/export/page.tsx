import { Notice, SetupNotice } from "@/components/notice";
import { getProjectOr404 } from "@/lib/get-project";
import { todayISO } from "@/lib/dates";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { ImportRfis } from "./import-rfis";

export const dynamic = "force-dynamic";

interface ExportRow {
  title: string;
  description: string;
  count: number;
  links: { href: string; cta: string }[];
}

export default async function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { projectId } = await params;
  const project = await getProjectOr404(projectId);
  const supabase = getSupabase();

  const rfis = await supabase
    .from("rfis")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);

  if (rfis.error) return <Notice title="Database error">{rfis.error.message}</Notice>;

  const today = todayISO();
  const base = `/projects/${project.id}/export`;
  const exports: ExportRow[] = [
    {
      title: "RFI Log",
      description:
        "All RFIs with dates, status, and the computed days-open and overdue flags.",
      count: rfis.count ?? 0,
      links: [
        { href: `${base}/rfis`, cta: "Download CSV" },
        { href: `${base}/rfis?format=xlsx`, cta: "Download XLSX" },
      ],
    },
    {
      title: "RFI Report (PDF)",
      description:
        "Formatted client-facing report: summary, status breakdown, and the full RFI table.",
      count: rfis.count ?? 0,
      links: [{ href: `/projects/${project.id}/report`, cta: "Download PDF" }],
    },
  ];

  return (
    <>
      <div className="mb-[22px]">
        <div className="mb-1 font-mono text-[11px] tracking-[1px] text-blueprint">
          REPORTS · EXPORT / IMPORT / SHARE
        </div>
        <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[0.3px]">
          {project.name}
        </h1>
        <div className="text-[13px] text-muted">
          Download this project&apos;s RFI log for client updates and reporting,
          or import RFIs from a spreadsheet.
        </div>
      </div>

      <div className="max-w-[720px] rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-[18px] pb-3 pt-4">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
            Export
          </h2>
        </div>
        {exports.map((e) => (
          <div
            key={e.title}
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
              {e.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  download
                  className="rounded-md bg-blueprint-dim px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110"
                >
                  {link.cta}
                </a>
              ))}
            </div>
          </div>
        ))}
        <div className="border-t border-line px-[18px] py-3 font-mono text-[10.5px] text-muted-2">
          Files are generated on demand from live data · {today}
        </div>
      </div>

      <ImportRfis projectId={project.id} />
    </>
  );
}
