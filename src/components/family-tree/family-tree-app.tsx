"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import type {
  Person,
  PersonFormValues,
  RelationKind,
} from "@/lib/family";
import {
  EMPTY_FORM,
  buildTree,
  createPerson,
  firstName,
  loadPeople,
  parseImport,
  personToForm,
  roman,
  savePeople,
} from "@/lib/family";
import { AppHeader } from "./app-header";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "./empty-state";
import { PersonCard } from "./person-card";
import { PersonForm } from "./person-form";
import { PersonPanel } from "./person-panel";
import { TreeMark } from "./icons";

type Dialog =
  | { type: "add"; relation: RelationKind | "none"; baseId: string | null }
  | { type: "edit"; personId: string }
  | { type: "clear" }
  | null;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Connector {
  key: string;
  kind: "child" | "spouse";
  d: string;
  mid?: { x: number; y: number };
}

const ADD_TITLES: Record<RelationKind, string> = {
  child: "Add a child",
  parent: "Add a parent",
  spouse: "Add a partner",
  sibling: "Add a sibling",
};

const ADD_NOUNS: Record<RelationKind, string> = {
  child: "child",
  parent: "parent",
  spouse: "partner",
  sibling: "sibling",
};

export default function FamilyTreeApp() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState("");
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cardElements = useRef(new Map<string, HTMLButtonElement>());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastId = useRef(0);

  const rows = useMemo(() => buildTree(people ?? []), [people]);
  const selected = useMemo(
    () => people?.find((person) => person.id === selectedId) ?? null,
    [people, selectedId],
  );

  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle || !people) return null;
    return new Set(
      people
        .filter((person) =>
          [person.name, person.occupation, person.birthplace, person.bio].some(
            (value) => value.toLowerCase().includes(needle),
          ),
        )
        .map((person) => person.id),
    );
  }, [needle, people]);

  useEffect(() => {
    // Hydration-safe one-time read of the tree saved in this browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPeople(loadPeople() ?? []);
  }, []);

  useEffect(() => {
    if (people === null) return;
    savePeople(people);
  }, [people]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dialog) {
        setDialog(null);
        return;
      }
      if (selected) setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog, selected]);

  const registerCard = useCallback(
    (id: string) => (element: HTMLButtonElement | null) => {
      if (element) cardElements.current.set(id, element);
      else cardElements.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !people) {
      setConnectors([]);
      return;
    }

    let frame = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (cancelled) return;
        const base = canvas.getBoundingClientRect();
        const positions = new Map<string, Rect>();

        for (const [id, element] of cardElements.current) {
          if (!element.isConnected) continue;
          const rect = element.getBoundingClientRect();
          positions.set(id, {
            x: rect.left - base.left,
            y: rect.top - base.top,
            w: rect.width,
            h: rect.height,
          });
        }

        const next: Connector[] = [];

        for (const person of people) {
          const child = positions.get(person.id);
          if (!child) continue;
          const parentRects = person.parentIds
            .map((id) => positions.get(id))
            .filter((rect): rect is Rect => Boolean(rect));
          if (parentRects.length === 0) continue;

          const startX =
            parentRects.reduce((sum, rect) => sum + rect.x + rect.w / 2, 0) /
            parentRects.length;
          const startY = Math.max(
            ...parentRects.map((rect) => rect.y + rect.h),
          );
          const endX = child.x + child.w / 2;
          const endY = child.y;
          const dy = endY - startY;
          if (dy < 6) continue;

          next.push({
            key: `child-${person.id}`,
            kind: "child",
            d: `M ${startX} ${startY} C ${startX} ${startY + dy * 0.45}, ${endX} ${endY - dy * 0.45}, ${endX} ${endY}`,
          });
        }

        for (const row of rows) {
          for (const unit of row.units) {
            if (unit.people.length !== 2) continue;
            const first = positions.get(unit.people[0].id);
            const second = positions.get(unit.people[1].id);
            if (!first || !second) continue;
            const [left, right] =
              first.x <= second.x ? [first, second] : [second, first];
            const gap = right.x - (left.x + left.w);
            if (gap <= 0 || gap > 96) continue;
            const y = left.y + left.h * 0.55;
            const midX = (left.x + left.w + right.x) / 2;
            next.push({
              key: `spouse-${unit.key}`,
              kind: "spouse",
              d: `M ${left.x + left.w} ${y} C ${left.x + left.w + gap * 0.35} ${y + 10}, ${right.x - gap * 0.35} ${y + 10}, ${right.x} ${y}`,
              mid: { x: midX, y: y + 7 },
            });
          }
        }

        setConnectors(next);
      });
    };

    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(canvas);
    window.addEventListener("resize", measure);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(measure).catch(() => undefined);
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [people, rows]);

  const showToast = (message: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message });
  };

  const handleAdd = (values: PersonFormValues) => {
    if (!people || dialog?.type !== "add") return;
    const base = dialog.baseId
      ? people.find((person) => person.id === dialog.baseId)
      : undefined;
    const person = createPerson(values);

    if (base) {
      switch (dialog.relation) {
        case "child": {
          const partners = base.spouseIds.filter((id) =>
            people.some((item) => item.id === id),
          );
          person.parentIds =
            partners.length === 1 ? [base.id, partners[0]] : [base.id];
          break;
        }
        case "parent": {
          person.parentIds = [];
          break;
        }
        case "spouse": {
          person.spouseIds = [base.id];
          break;
        }
        case "sibling": {
          person.parentIds = [...base.parentIds];
          break;
        }
        default:
          break;
      }
    }

    setPeople((current) => {
      if (!current) return current;
      const next = current.map((item) => {
        if (!base) return item;
        if (dialog.relation === "parent" && item.id === base.id) {
          return {
            ...item,
            parentIds: [...new Set([...item.parentIds, person.id])],
          };
        }
        if (dialog.relation === "spouse" && item.id === base.id) {
          return {
            ...item,
            spouseIds: [...new Set([...item.spouseIds, person.id])],
          };
        }
        return item;
      });
      return [...next, person];
    });

    setSelectedId(person.id);
    setDialog(null);
    showToast(`${firstName(person.name)} added to the tree`);
  };

  const handleEdit = (values: PersonFormValues) => {
    if (dialog?.type !== "edit") return;
    const id = dialog.personId;
    setPeople((current) =>
      current
        ? current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...values,
                  name: values.name.trim(),
                  birthplace: values.birthplace.trim(),
                  occupation: values.occupation.trim(),
                  bio: values.bio.trim(),
                }
              : item,
          )
        : current,
    );
    setDialog(null);
    showToast("Details updated");
  };

  const handleDelete = (id: string) => {
    setPeople((current) =>
      current
        ? current
            .filter((person) => person.id !== id)
            .map((person) => ({
              ...person,
              parentIds: person.parentIds.filter((parentId) => parentId !== id),
              spouseIds: person.spouseIds.filter((spouseId) => spouseId !== id),
            }))
        : current,
    );
    setSelectedId((current) => (current === id ? null : current));
    setDialog(null);
    showToast("Removed from the tree");
  };

  const handleClear = () => {
    setPeople([]);
    setSelectedId(null);
    setDialog(null);
    showToast("Tree cleared");
  };

  const handleExport = () => {
    if (!people || people.length === 0) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            people,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "listrei-family-tree.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Tree exported");
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      if (!imported) {
        showToast("That file doesn’t look like a Listrei export");
        return;
      }
      setPeople(imported);
      setSelectedId(null);
      showToast(
        `Imported ${imported.length} ${
          imported.length === 1 ? "person" : "people"
        }`,
      );
    } catch {
      showToast("Could not read that file");
    }
  };

  if (people === null) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-paper">
        <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-full bg-moss text-paper">
          <TreeMark className="h-5.5 w-5.5" />
        </span>
        <p className="font-display text-lg text-ink-faint">Listrei</p>
      </div>
    );
  }

  const editPerson =
    dialog?.type === "edit"
      ? people.find((person) => person.id === dialog.personId) ?? null
      : null;

  let formTitle = "Add a family member";
  let formSubtitle = "Start a new branch of the tree";
  let formInitial = EMPTY_FORM;
  let formSubmit = "Add to tree";
  let formKey = "add";

  if (dialog?.type === "add") {
    const base = dialog.baseId
      ? people.find((person) => person.id === dialog.baseId)
      : null;
    if (base && dialog.relation !== "none") {
      formTitle = ADD_TITLES[dialog.relation];
      formSubtitle = `Adding a ${ADD_NOUNS[dialog.relation]} of ${firstName(base.name)}`;
    }
    formKey = `add-${dialog.relation}-${dialog.baseId ?? "none"}`;
  } else if (dialog?.type === "edit" && editPerson) {
    formTitle = "Edit details";
    formSubtitle = editPerson.name;
    formInitial = personToForm(editPerson);
    formSubmit = "Save changes";
    formKey = `edit-${editPerson.id}`;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
      <AppHeader
        peopleCount={people.length}
        generations={rows.length}
        query={query}
        onQueryChange={setQuery}
        selected={selected}
        onAdd={(relation, baseId) =>
          setDialog({ type: "add", relation, baseId })
        }
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
        onClear={() => setDialog({ type: "clear" })}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {people.length === 0 ? (
        <EmptyState
          onAdd={() => setDialog({ type: "add", relation: "none", baseId: null })}
        />
      ) : (
        <main className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-auto overscroll-contain">
            <div
              ref={canvasRef}
              className="relative isolate grid w-max min-w-full grid-cols-[3.5rem_1fr] gap-y-20 px-4 py-10 sm:grid-cols-[6rem_1fr] sm:gap-y-24 sm:px-8 sm:py-14"
            >
              <svg
                className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                {connectors.map((line) =>
                  line.kind === "child" ? (
                    <path
                      key={line.key}
                      d={line.d}
                      fill="none"
                      stroke="var(--line-strong)"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  ) : (
                    <g key={line.key}>
                      <path
                        d={line.d}
                        fill="none"
                        stroke="var(--line-strong)"
                        strokeWidth={1.5}
                        strokeDasharray="2 5"
                        strokeLinecap="round"
                      />
                      {line.mid ? (
                        <path
                          d={`M ${line.mid.x} ${line.mid.y - 4} L ${line.mid.x + 4} ${line.mid.y} L ${line.mid.x} ${line.mid.y + 4} L ${line.mid.x - 4} ${line.mid.y} Z`}
                          fill="var(--clay)"
                        />
                      ) : null}
                    </g>
                  ),
                )}
              </svg>

              {rows.map((row) => (
                <div
                  key={row.generation}
                  className="relative z-10 col-span-2 grid grid-cols-subgrid items-center"
                >
                  <div className="pr-2 text-right sm:pr-4">
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-ink-faint">
                      Gen
                    </span>
                    <span className="font-display text-lg leading-tight text-ink-soft">
                      {roman(row.generation + 1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-8 px-2 sm:gap-14">
                    {row.units.map((unit) => (
                      <div
                        key={unit.key}
                        className="flex items-center gap-3 sm:gap-6"
                      >
                        {unit.people.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            selected={person.id === selectedId}
                            dimmed={
                              matches !== null && !matches.has(person.id)
                            }
                            onSelect={setSelectedId}
                            cardRef={registerCard(person.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {selected ? (
        <PersonPanel
          key={selected.id}
          person={selected}
          people={people}
          onClose={() => setSelectedId(null)}
          onSelect={setSelectedId}
          onEdit={() => setDialog({ type: "edit", personId: selected.id })}
          onAdd={(relation) =>
            setDialog({ type: "add", relation, baseId: selected.id })
          }
          onDelete={handleDelete}
        />
      ) : null}

      {dialog?.type === "add" || (dialog?.type === "edit" && editPerson) ? (
        <PersonForm
          key={formKey}
          title={formTitle}
          subtitle={formSubtitle}
          initial={formInitial}
          submitLabel={formSubmit}
          onSubmit={dialog?.type === "edit" ? handleEdit : handleAdd}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.type === "clear" ? (
        <ConfirmDialog
          title="Clear the whole tree?"
          description={`This removes all ${people.length} ${
            people.length === 1 ? "person" : "people"
          } and their connections from this device. Export a copy first if you want to keep it.`}
          confirmLabel="Clear tree"
          onConfirm={handleClear}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-[toast-in_180ms_ease-out] rounded-full bg-ink px-4 py-2.5 text-sm text-paper shadow-xl"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
