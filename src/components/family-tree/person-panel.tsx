"use client";

import { useMemo, useState } from "react";
import type { Person, RelationKind } from "@/lib/family";
import { ageText, formatDate, getRelatives, lifespan } from "@/lib/family";
import { Avatar } from "./avatar";
import {
  ChevronRightIcon,
  HeartIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "./icons";

interface PersonPanelProps {
  person: Person;
  people: Person[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onAdd: (relation: RelationKind) => void;
  onDelete: (id: string) => void;
}

const ADD_ACTIONS: Array<{ kind: RelationKind; label: string }> = [
  { kind: "child", label: "Add child" },
  { kind: "parent", label: "Add parent" },
  { kind: "spouse", label: "Add partner" },
  { kind: "sibling", label: "Add sibling" },
];

export function PersonPanel({
  person,
  people,
  onClose,
  onSelect,
  onEdit,
  onAdd,
  onDelete,
}: PersonPanelProps) {
  const { parents, spouses, children } = useMemo(
    () => getRelatives(people, person),
    [people, person],
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = [lifespan(person), ageText(person)].filter(Boolean).join(" · ");
  const details = [
    { label: "Born", value: person.birthDate ? formatDate(person.birthDate) : "" },
    { label: "Died", value: person.deathDate ? formatDate(person.deathDate) : "" },
    { label: "Hometown", value: person.birthplace },
    { label: "Occupation", value: person.occupation },
  ].filter((detail) => detail.value);

  return (
    <>
      <div
        className="fixed inset-0 z-30 animate-[fade-in_200ms_ease-out] bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${person.name} — family details`}
        className="fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-card shadow-[-24px_0_60px_-30px_rgba(43,40,34,0.45)] animate-[panel-in_240ms_cubic-bezier(0.22,1,0.36,1)] sm:max-w-[27rem]"
      >
        <div className="relative overflow-hidden bg-moss px-6 pb-14 pt-5 text-paper">
          <span className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full border border-paper/10" />
          <span className="pointer-events-none absolute -right-6 top-2 h-32 w-32 rounded-full border border-paper/10" />
          <span className="pointer-events-none absolute right-16 -top-8 h-20 w-20 rounded-full border border-paper/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.28em] text-paper/55">
                Family member
              </p>
              <h2 className="mt-1 break-words font-display text-[1.75rem] leading-tight">
                {person.name}
              </h2>
              <p className="mt-1.5 text-sm text-paper/70">
                {meta || "Dates unknown"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper/75 transition hover:bg-paper/10 hover:text-paper"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative -mt-10 flex-1 overflow-y-auto px-6 pb-10">
          <Avatar person={person} size="lg" className="ring-4 ring-card" />

          {details.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
              {details.map((detail) => (
                <div key={detail.label}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {detail.label}
                  </p>
                  <p className="mt-0.5 text-sm text-ink">{detail.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-paper/40 px-4 py-3 text-left transition hover:border-moss/40 hover:bg-paper"
            >
              <span className="text-sm text-ink-soft">
                No dates or places yet. Add what you remember.
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
            </button>
          )}

          {person.bio ? (
            <section className="mt-7">
              <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-faint">
                Their story
              </h3>
              <p className="mt-2 whitespace-pre-line rounded-2xl border border-line bg-paper/50 px-4 py-3 text-sm leading-relaxed text-ink-soft">
                {person.bio}
              </p>
            </section>
          ) : null}

          <section className="mt-7">
            <h3 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-faint">
              <HeartIcon className="h-3.5 w-3.5" />
              Family
            </h3>
            <RelationGroup
              label="Parents"
              people={parents}
              empty="No parents added yet."
              onSelect={onSelect}
            />
            <RelationGroup
              label={spouses.length === 1 ? "Partner" : "Partners"}
              people={spouses}
              empty="No partner added yet."
              onSelect={onSelect}
            />
            <RelationGroup
              label="Children"
              people={children}
              empty="No children added yet."
              onSelect={onSelect}
            />
          </section>

          <section className="mt-7">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-faint">
              Grow this branch
            </h3>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {ADD_ACTIONS.map((action) => (
                <button
                  key={action.kind}
                  type="button"
                  onClick={() => onAdd(action.kind)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-paper/40 px-3 py-2.5 text-xs font-medium text-ink-soft transition hover:border-moss/40 hover:bg-paper hover:text-ink"
                >
                  <PlusIcon className="h-3.5 w-3.5 text-moss" />
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-ink transition hover:border-line-strong hover:bg-paper"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit details
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-clay transition hover:bg-clay/5"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>

          {confirmingDelete ? (
            <div className="mt-4 animate-[fade-in_150ms_ease-out] rounded-2xl border border-clay/30 bg-clay/5 p-4">
              <p className="text-sm font-medium text-ink">
                Remove {person.name} from the tree?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Their links to family members will be removed too. This cannot
                be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(person.id)}
                  className="rounded-full bg-clay px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-clay/90"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-paper hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

interface RelationGroupProps {
  label: string;
  people: Person[];
  empty: string;
  onSelect: (id: string) => void;
}

function RelationGroup({ label, people, empty, onSelect }: RelationGroupProps) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      {people.length === 0 ? (
        <p className="mt-1 text-xs text-ink-faint/80">{empty}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(person.id)}
              className="flex items-center gap-2 rounded-full border border-line bg-paper/50 py-1 pl-1 pr-3 text-left transition hover:border-moss/40 hover:bg-paper"
            >
              <Avatar person={person} size="sm" />
              <span className="text-xs font-medium text-ink">
                {person.name}
              </span>
              {lifespan(person) ? (
                <span className="text-[10px] text-ink-faint">
                  {lifespan(person)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
