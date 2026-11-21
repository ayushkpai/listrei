"use client";

import { PlusIcon, TreeMark } from "./icons";

interface EmptyStateProps {
  onAdd: () => void;
}

const NOTES = [
  "One card per person",
  "Click to see details",
  "Saved on this device",
];

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <main className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-line" />
          <span className="absolute inset-3 rounded-full border border-line/70" />
          <span className="absolute inset-6 rounded-full border border-line/50" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-moss text-paper shadow-lg shadow-moss/20">
            <TreeMark className="h-7 w-7" />
          </span>
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-clay">
          A blank page, for now
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
          Every family begins with one name.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
          Add one person, then grow the branches. Open any card to read their
          story and add parents, partners, children, or siblings.
        </p>

        <button
          type="button"
          onClick={onAdd}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-moss px-6 text-sm font-medium text-paper shadow-lg shadow-moss/20 transition hover:bg-moss-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <PlusIcon className="h-4 w-4" />
          Add the first person
        </button>

        <div className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-2">
          {NOTES.map((note) => (
            <span
              key={note}
              className="rounded-full border border-line bg-card/60 px-3 py-1.5 text-[11px] text-ink-soft"
            >
              {note}
            </span>
          ))}
        </div>

        <p className="mt-5 text-[11px] text-ink-faint">
          Your tree stays private in this browser.
        </p>
      </div>
    </main>
  );
}
