import Link from "next/link";
import { Stamp } from "@/components/stamp";

const FEATURES = [
  {
    num: "01",
    title: "RFI tracking, end to end",
    body: "Create, assign, and answer RFIs with auto-numbering, days-open counters, and overdue flags stamped automatically — nothing slips past the due date unnoticed.",
  },
  {
    num: "02",
    title: "Standardized contractors",
    body: "Assign each RFI to a contractor from a standardized project list, with free-text entries for one-off trades when you need them.",
  },
  {
    num: "03",
    title: "Design Package & Blue Bin links",
    body: "Attach the Design Package and Blue Bin Section references to every RFI. The source documents are one click away from the log — no more digging through folders.",
  },
  {
    num: "04",
    title: "Reports & spreadsheets",
    body: "One-click client-ready PDF reports, CSV and XLSX exports, and validated spreadsheet imports that never overwrite what's already in the log.",
  },
];

const MOCK_ROWS: {
  number: string;
  subject: string;
  days: string;
  tone: Parameters<typeof Stamp>[0]["tone"];
  label: string;
}[] = [
  {
    number: "RFI-116",
    subject: "Elevation confirmation — east foundation",
    days: "4 days",
    tone: "review",
    label: "In review",
  },
  {
    number: "RFI-118",
    subject: "Expansion joint specification — Block B",
    days: "11 days",
    tone: "overdue",
    label: "Overdue",
  },
  {
    number: "RFI-120",
    subject: "Material substitution — tank lining",
    days: "2 days",
    tone: "open",
    label: "Open",
  },
  {
    number: "RFI-114",
    subject: "Anchoring detail — pipe support",
    days: "answered",
    tone: "approved",
    label: "Answered",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col px-6 sm:px-10">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] -rotate-2 items-center justify-center rounded border-2 border-blueprint font-display text-[15px] font-bold text-blueprint">
            RL
          </div>
          <div className="font-display text-[14.5px] font-semibold leading-tight tracking-[0.4px]">
            RFI LOG
            <span className="mt-0.5 block text-[10px] font-medium tracking-[1.6px] text-muted">
              CONSTRUCTION ADMIN
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="rounded-md border border-line px-4 py-2 text-[13px] font-semibold text-text transition-colors hover:border-blueprint hover:text-blueprint"
        >
          Sign in →
        </Link>
      </header>

      <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="mb-3 font-mono text-[11px] tracking-[1.5px] text-blueprint">
            CONSTRUCTION ADMINISTRATION · RFI TRACKING
          </div>
          <h1 className="mb-5 font-display text-4xl font-semibold leading-[1.08] tracking-[0.3px] sm:text-[52px]">
            Simple, direct RFI tracking for construction administration teams.
          </h1>
          <p className="mb-8 max-w-[520px] text-[15px] leading-relaxed text-muted">
            RFI Log keeps every request for information numbered, assigned, and
            answered on time — with the overdue stamps, contractor assignments,
            and client-ready reports a CA project manager actually needs.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-blueprint-dim px-6 py-3 text-[14px] font-semibold text-white hover:brightness-110"
            >
              Sign in to your log →
            </Link>
            <span className="font-mono text-[11px] text-muted-2">
              NO SETUP · WORKS FROM DAY ONE
            </span>
          </div>
        </div>

        <div
          className="rounded-lg border border-line bg-surface shadow-2xl"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between border-b border-line px-[18px] pb-3 pt-4">
            <span className="font-display text-[14px] font-semibold tracking-[0.3px]">
              RFI Log
            </span>
            <span className="font-mono text-[10.5px] text-muted">
              3 open · 12 total
            </span>
          </div>
          {MOCK_ROWS.map((row) => (
            <div
              key={row.number}
              className="flex items-center gap-3 border-b border-line/60 px-[18px] py-[11px] text-[12.5px] last:border-b-0"
            >
              <span className="w-[52px] shrink-0 font-mono text-xs text-blueprint">
                {row.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-text">
                {row.subject}
              </span>
              <span
                className={`hidden w-[60px] shrink-0 text-right font-mono text-xs sm:block ${
                  row.tone === "overdue" ? "font-semibold text-danger" : "text-muted"
                }`}
              >
                {row.days}
              </span>
              <span className="shrink-0">
                <Stamp tone={row.tone} label={row.label} />
              </span>
            </div>
          ))}
          <div className="border-t border-line px-[18px] py-2.5 font-mono text-[10px] tracking-[0.6px] text-muted-2">
            DAYS OPEN AND OVERDUE STATUS COMPUTED AUTOMATICALLY
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="mb-6 font-mono text-[11px] tracking-[1.5px] text-blueprint">
          WHAT&apos;S IN THE LOG
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.num}
              className="relative overflow-hidden rounded-lg border border-line bg-surface px-5 pb-5 pt-4"
            >
              <span className="absolute left-0 top-0 h-full w-[3px] bg-blueprint" />
              <div className="mb-2 font-mono text-[11px] text-muted-2">{f.num}</div>
              <h2 className="mb-2 font-display text-[17px] font-semibold tracking-[0.3px]">
                {f.title}
              </h2>
              <p className="text-[13px] leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line py-6 font-mono text-[10.5px] text-muted-2">
        <span>RFI LOG · CONSTRUCTION ADMINISTRATION TRACKER</span>
        <span className="flex items-center gap-4">
          <Link href="/about" className="transition-colors hover:text-blueprint">
            Built by Cesar De Macedo →
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </span>
      </footer>
    </div>
  );
}
