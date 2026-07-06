"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/types";

interface NavEntry {
  label: string;
  href?: string; // no href = not built yet
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
    href: "/",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    label: "RFI Log",
    href: "/rfis",
    icon: (
      <svg {...iconProps}>
        <path d="M12 2l9 4.9V17L12 22 3 17V6.9z" />
        <path d="M12 12l9-5M12 12v10M12 12L3 7" />
      </svg>
    ),
  },
  {
    label: "Submittals",
    icon: (
      <svg {...iconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    label: "Change Orders",
    icon: (
      <svg {...iconProps}>
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  },
];

const REPORT_NAV: NavEntry[] = [
  {
    label: "Export / Share",
    icon: (
      <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function NavItem({ entry, active }: { entry: NavEntry; active: boolean }) {
  const base =
    "flex items-center gap-2.5 rounded-md px-2.5 py-[9px] text-[13.5px] transition-colors";
  if (!entry.href) {
    return (
      <div className={`${base} cursor-default text-muted-2`} title="Coming soon">
        <span className="opacity-60">{entry.icon}</span>
        {entry.label}
        <span className="ml-auto font-mono text-[9.5px] tracking-widest text-muted-2/80">
          SOON
        </span>
      </div>
    );
  }
  return (
    <Link
      href={entry.href}
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

export function Sidebar({ project }: { project: Project | null }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex w-[232px] shrink-0 flex-col gap-[26px] border-r border-line bg-surface px-4 py-[22px]">
      <div className="flex items-center gap-2.5 px-1.5">
        <div className="flex h-[34px] w-[34px] -rotate-2 items-center justify-center rounded border-2 border-blueprint font-display text-[15px] font-bold text-blueprint">
          SL
        </div>
        <div className="font-display text-[14.5px] font-semibold leading-tight tracking-[0.4px]">
          SITE LOG
          <span className="mt-0.5 block text-[10px] font-medium tracking-[1.6px] text-muted">
            CONSTRUCTION ADMIN
          </span>
        </div>
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
              active={entry.href ? isActive(entry.href) : false}
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
              active={entry.href ? isActive(entry.href) : false}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-line pt-3.5 text-[11.5px] leading-relaxed text-muted-2">
        {project ? project.name : "No project configured"}
      </div>
    </aside>
  );
}
