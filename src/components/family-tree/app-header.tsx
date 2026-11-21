"use client";

import { useEffect, useState } from "react";
import type { Person, RelationKind } from "@/lib/family";
import { firstName } from "@/lib/family";
import {
  ChevronDownIcon,
  DownloadIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  TreeMark,
  UploadIcon,
} from "./icons";

interface AppHeaderProps {
  peopleCount: number;
  generations: number;
  query: string;
  onQueryChange: (value: string) => void;
  selected: Person | null;
  onAdd: (relation: RelationKind | "none", baseId: string | null) => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}

const RELATIVE_ACTIONS: Array<{ kind: RelationKind; label: string }> = [
  { kind: "child", label: "Add a child" },
  { kind: "parent", label: "Add a parent" },
  { kind: "spouse", label: "Add a partner" },
  { kind: "sibling", label: "Add a sibling" },
];

export function AppHeader({
  peopleCount,
  generations,
  query,
  onQueryChange,
  selected,
  onAdd,
  onExport,
  onImport,
  onClear,
}: AppHeaderProps) {
  const [menu, setMenu] = useState<"add" | "more" | null>(null);
  const empty = peopleCount === 0;

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menu]);

  const startAdd = (relation: RelationKind | "none", baseId: string | null) => {
    setMenu(null);
    onAdd(relation, baseId);
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-line/80 bg-paper/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss text-paper shadow-sm">
            <TreeMark className="h-5 w-5" />
          </span>
          <div className="leading-none">
            <span className="font-display text-xl tracking-tight text-ink">
              Listrei
            </span>
            <span className="mt-1 hidden text-[9px] uppercase tracking-[0.24em] text-ink-faint sm:block">
              Family tree
            </span>
          </div>
        </div>

        <div className="ml-4 hidden items-center gap-2 lg:flex">
          <span className="rounded-full border border-line bg-card/70 px-2.5 py-1 text-[11px] text-ink-soft">
            {peopleCount} {peopleCount === 1 ? "person" : "people"}
          </span>
          <span className="rounded-full border border-line bg-card/70 px-2.5 py-1 text-[11px] text-ink-soft">
            {generations} {generations === 1 ? "generation" : "generations"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden sm:block">
            <span className="sr-only">Search family members</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              disabled={empty}
              placeholder="Find someone…"
              className="h-9 w-40 rounded-full border border-line bg-card/70 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-faint/80 focus:border-moss/40 focus:bg-card focus:ring-2 focus:ring-moss/10 disabled:cursor-not-allowed disabled:opacity-50 md:w-56"
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (empty) {
                  onAdd("none", null);
                } else {
                  setMenu((current) => (current === "add" ? null : "add"));
                }
              }}
              aria-expanded={menu === "add"}
              aria-haspopup="menu"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-moss px-3 text-sm font-medium text-paper shadow-sm transition hover:bg-moss-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:px-4"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add person</span>
              {!empty ? (
                <ChevronDownIcon className="hidden h-3.5 w-3.5 opacity-70 sm:block" />
              ) : null}
            </button>

            {menu === "add" ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenu(null)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 origin-top-right animate-[modal-in_140ms_ease-out] rounded-2xl border border-line bg-card p-1.5 shadow-xl"
                >
                  {selected ? (
                    <>
                      <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        Add a relative of {firstName(selected.name)}
                      </p>
                      {RELATIVE_ACTIONS.map((action) => (
                        <button
                          key={action.kind}
                          type="button"
                          role="menuitem"
                          onClick={() => startAdd(action.kind, selected.id)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-paper"
                        >
                          <PlusIcon className="h-4 w-4 text-moss" />
                          {action.label}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-line" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => startAdd("none", null)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-paper hover:text-ink"
                      >
                        <TreeMark className="h-4 w-4" />
                        Add someone unconnected
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => startAdd("none", null)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-paper"
                      >
                        <PlusIcon className="h-4 w-4 text-moss" />
                        Add a person
                      </button>
                      <p className="px-3 pb-2 pt-1 text-[11px] leading-relaxed text-ink-faint">
                        Tip: open a card first to add their parents, partner,
                        children, or siblings.
                      </p>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setMenu((current) => (current === "more" ? null : "more"))
              }
              aria-expanded={menu === "more"}
              aria-haspopup="menu"
              aria-label="More options"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card/70 text-ink-soft transition hover:border-line-strong hover:bg-card hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/30"
            >
              <MoreIcon className="h-4 w-4" />
            </button>

            {menu === "more" ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenu(null)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 animate-[modal-in_140ms_ease-out] rounded-2xl border border-line bg-card p-1.5 shadow-xl"
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={empty}
                    onClick={() => {
                      setMenu(null);
                      onExport();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <DownloadIcon className="h-4 w-4 text-ink-soft" />
                    Export as JSON
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(null);
                      onImport();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-paper"
                  >
                    <UploadIcon className="h-4 w-4 text-ink-soft" />
                    Import a tree
                  </button>
                  <div className="my-1 h-px bg-line" />
                  <button
                    type="button"
                    role="menuitem"
                    disabled={empty}
                    onClick={() => {
                      setMenu(null);
                      onClear();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-clay transition hover:bg-clay/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Clear the tree
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
