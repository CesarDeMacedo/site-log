export type StampTone = "open" | "review" | "overdue" | "approved" | "closed";

const TONE_CLASS: Record<StampTone, string> = {
  open: "text-blueprint",
  review: "text-amber",
  overdue: "text-danger",
  approved: "text-success",
  closed: "text-muted-2",
};

export function Stamp({ tone, label }: { tone: StampTone; label: string }) {
  return <span className={`stamp ${TONE_CLASS[tone]}`}>{label}</span>;
}
