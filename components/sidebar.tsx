"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { pathForProject, projectIdFromPath } from "@/lib/paths";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

interface NavEntry {
  label: string;
  sub: string; // sub-route within a project ("" = dashboard)
  icon: React.ReactNode;
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  className: "w-4 h-4 shrink-0",
} as const;

const PROJECT_NAV: NavEntry[] = [
  {
    label: "Overview",
    sub: "",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    label: "RFI Log",
    sub: "/rfis",
    icon: (
      <svg {...iconProps}>
        <path d="M12 2l9 4.9V17L12 22 3 17V6.9z" />
        <path d="M12 12l9-5M12 12v10M12 12L3 7" />
      </svg>
    ),
  },
];

const REPORT_NAV: NavEntry[] = [
  {
    label: "Export / Import / Share",
    sub: "/export",
    icon: (
      <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function NavItem({
  entry,
  projectId,
  pathname,
}: {
  entry: NavEntry;
  projectId: string | null;
  pathname: string;
}) {
  const base =
    "flex items-center gap-2.5 rounded-md px-2.5 py-[9px] text-[13.5px] transition-colors";
  if (!projectId) {
    return (
      <div
        className={`${base} cursor-default text-muted-2`}
        title="Select a project first"
      >
        <span className="opacity-60">{entry.icon}</span>
        {entry.label}
      </div>
    );
  }
  const href = `/projects/${projectId}${entry.sub}`;
  const active =
    entry.sub === ""
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={
        active
          ? `${base} border-l-2 border-blueprint bg-blueprint/12 pl-2 text-text [&_svg]:stroke-blueprint`
          : `${base} text-muted hover:text-text [&_svg]:opacity-75`
      }
    >
      {entry.icon}
      {entry.label}
    </Link>
  );
}

export function Sidebar({
  projects,
  userEmail,
}: {
  projects: Project[];
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const projectId = projectIdFromPath(pathname);

  async function handleSignOut() {
    await getBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }
  const knownProjectId = projects.some((p) => p.id === projectId)
    ? projectId
    : null;

  return (
    <aside className="flex w-[232px] shrink-0 flex-col gap-[26px] border-r border-line bg-surface px-4 py-[22px]">
      <Link
        href="/"
        title="RFI Log home"
        className="flex items-center gap-2.5 rounded-md px-1.5 transition-opacity hover:opacity-80"
      >
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

      <div>
        <div className="mb-0.5 px-2.5 text-[10px] font-semibold tracking-[1.6px] text-muted-2">
          PORTFOLIO
        </div>
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/projects"
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-[9px] text-[13.5px] transition-colors ${
              pathname === "/projects"
                ? "border-l-2 border-blueprint bg-blueprint/12 pl-2 text-text [&_svg]:stroke-blueprint"
                : "text-muted hover:text-text [&_svg]:opacity-75"
            }`}
          >
            <svg {...iconProps}>
              <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
              <path d="M3 7l9 4 9-4M12 11v10" />
            </svg>
            All Projects
          </Link>
        </nav>
      </div>

      <div>
        <div className="mb-0.5 px-2.5 text-[10px] font-semibold tracking-[1.6px] text-muted-2">
          PROJECT
        </div>
        <nav className="flex flex-col gap-0.5">
          {PROJECT_NAV.map((entry) => (
            <NavItem
              key={entry.label}
              entry={entry}
              projectId={knownProjectId}
              pathname={pathname}
            />
          ))}
        </nav>
      </div>

      <div>
        <div className="mb-0.5 px-2.5 text-[10px] font-semibold tracking-[1.6px] text-muted-2">
          REPORTS
        </div>
        <nav className="flex flex-col gap-0.5">
          {REPORT_NAV.map((entry) => (
            <NavItem
              key={entry.label}
              entry={entry}
              projectId={knownProjectId}
              pathname={pathname}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-line pt-3.5">
        <label
          htmlFor="project-selector"
          className="mb-1.5 block px-0.5 text-[10px] font-semibold tracking-[1.6px] text-muted-2"
        >
          ACTIVE PROJECT
        </label>
        <select
          id="project-selector"
          value={knownProjectId ?? ""}
          onChange={(e) => {
            const id = e.target.value;
            if (id) router.push(pathForProject(pathname, id));
          }}
          className="w-full rounded-md border border-line bg-surface-2 px-2 py-1.5 text-[12px] text-text focus:border-blueprint focus:outline-none"
        >
          <option value="" disabled>
            {projects.length ? "Select a project…" : "No projects yet"}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-line pt-3">
          <span
            className="min-w-0 truncate font-mono text-[10.5px] text-muted-2"
            title={userEmail ?? undefined}
          >
            {userEmail ?? ""}
          </span>
          <button
            onClick={handleSignOut}
            className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted transition-colors hover:border-danger/60 hover:text-danger"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
