import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ChangeOrder, Project } from "@/lib/types";
import { ChangeOrderLog } from "./change-order-log";

export const dynamic = "force-dynamic";

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-8">
      <h2 className="mb-2 font-display text-lg font-semibold">{title}</h2>
      <p className="text-[13.5px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export default async function ChangeOrdersPage() {
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

  if (projectError) {
    return <Notice title="Database error">{projectError.message}</Notice>;
  }
  if (!project) {
    return (
      <Notice title="No project found">
        Run the migration and seed in{" "}
        <code className="font-mono text-blueprint">supabase/</code> against your
        Supabase project first.
      </Notice>
    );
  }

  const { data: changeOrders, error: changeOrdersError } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .returns<ChangeOrder[]>();

  if (changeOrdersError) {
    return <Notice title="Database error">{changeOrdersError.message}</Notice>;
  }

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="mb-1 font-mono text-[11px] tracking-[1px] text-blueprint">
            CONTRACT ADMINISTRATION · CHANGE ORDERS
          </div>
          <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[0.3px]">
            {project.name}
          </h1>
          <div className="text-[13px] text-muted">
            {[
              project.general_contractor && `General Contractor: ${project.general_contractor}`,
              project.pm_name && `PM: ${project.pm_name}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>

      <ChangeOrderLog projectId={project.id} changeOrders={changeOrders ?? []} />
    </>
  );
}
