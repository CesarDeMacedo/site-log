import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — RFI Log",
  description:
    "About Cesar De Macedo, the visualization specialist behind RFI Log.",
};

const STACK = [
  "Next.js",
  "Supabase (Postgres + Auth)",
  "SheetJS",
  "@react-pdf/renderer",
];

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  className: "h-4 w-4 shrink-0",
} as const;

const CONTACTS = [
  {
    label: "cesardemacedo@gmail.com",
    href: "mailto:cesardemacedo@gmail.com",
    external: false,
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/cesar-de-macedo-3b4a5a51/",
    external: true,
    icon: (
      <svg {...iconProps}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: "blacklabvisuals.com",
    href: "https://blacklabvisuals.com/",
    external: true,
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

const P_CLASS = "text-[14px] leading-relaxed text-muted";

export default function AboutPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[760px] flex-col px-6 sm:px-10">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80">
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
        <Link
          href="/"
          className="font-mono text-[11px] text-muted transition-colors hover:text-blueprint"
        >
          ← Back to RFI Log
        </Link>
      </header>

      <main className="py-10 sm:py-14">
        <div className="mb-2 font-mono text-[11px] tracking-[1.5px] text-blueprint">
          RFI LOG · ABOUT
        </div>
        <h1 className="mb-7 font-display text-[34px] font-semibold tracking-[0.3px]">
          About
        </h1>

        <div className="max-w-[620px] space-y-5">
          <p className={P_CLASS}>
            Cesar De Macedo is a Senior Visualization Specialist with over two
            decades of experience in architectural visualization, cinematic
            storytelling, and interactive real-time experiences for
            architecture, infrastructure, and design communication.
          </p>
          <p className={P_CLASS}>
            His work combines the technical precision of 3D visualization
            (Autodesk 3ds Max, V-Ray, Corona, Unreal Engine 5) with creative
            direction — transforming complex spatial and technical ideas into
            clear visual narratives for stakeholders, multidisciplinary teams,
            and decision-makers.
          </p>
          <p className={P_CLASS}>
            More recently, that focus has expanded into real-time
            visualization, infrastructure storytelling, BIM-to-visualization
            workflows, digital twins, and AI-assisted creative development —
            using vibe coding to prototype dashboards, presentation systems,
            and production utilities that connect design, real-time 3D, and
            creative technology.
          </p>
          <p className={P_CLASS}>
            RFI Log is a direct example of that direction: a simple, focused
            RFI tracking tool for construction administration, built with a
            disciplined PRD → spec → design system workflow.
          </p>
        </div>

        <div className="mt-9">
          <div className="mb-3 font-mono text-[10.5px] tracking-[1.5px] text-muted-2">
            STACK
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK.map((item) => (
              <span
                key={item}
                className="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11.5px] text-blueprint"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* TODO: Other projects — links to be defined. Render as a section
            matching STACK above once the list exists. */}

        <div className="mt-9">
          <div className="mb-3 font-mono text-[10.5px] tracking-[1.5px] text-muted-2">
            CONTACT
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-6">
            {CONTACTS.map((c) => (
              <a
                key={c.href}
                href={c.href}
                {...(c.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex items-center gap-2 text-[13px] text-text transition-colors hover:text-blueprint [&_svg]:text-blueprint"
              >
                {c.icon}
                {c.label}
                {c.external && <span className="font-mono text-[11px]">↗</span>}
              </a>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line py-6 font-mono text-[10.5px] text-muted-2">
        <span>RFI LOG · CONSTRUCTION ADMINISTRATION TRACKER</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
