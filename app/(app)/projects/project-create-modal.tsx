"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "./actions";

const LABEL_CLASS =
  "block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted-2 mb-1.5";
const INPUT_CLASS =
  "w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-muted-2 focus:border-blueprint focus:outline-none";

export function ProjectCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blueprint-dim px-4 py-[7px] text-[13px] font-semibold text-white hover:brightness-110"
      >
        + New Project
      </button>
      {open && <ProjectCreateModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ProjectCreateModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createProject(formData);
      if (result.ok && result.projectId) {
        router.push(`/projects/${result.projectId}`);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#040a12]/70 px-4 pt-[8vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New project"
        className="w-full max-w-[520px] rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="border-b border-line px-5 py-4">
          <div className="font-mono text-[11px] tracking-[1px] text-blueprint">
            NEW PROJECT
          </div>
          <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[0.3px]">
            Create Project
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="proj-name" className={LABEL_CLASS}>
              Project name
            </label>
            <input
              id="proj-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Lakeshore Pumping Station — Rehabilitation"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-gc" className={LABEL_CLASS}>
                General contractor
              </label>
              <input
                id="proj-gc"
                name="general_contractor"
                type="text"
                placeholder="e.g. Bridgeview Construction Ltd."
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="proj-pm" className={LABEL_CLASS}>
                PM name
              </label>
              <input
                id="proj-pm"
                name="pm_name"
                type="text"
                placeholder="e.g. T. Paulo"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-[13px] font-semibold text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blueprint-dim px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
