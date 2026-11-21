import type { Person } from "@/lib/family";
import { lifespan } from "@/lib/family";
import { Avatar } from "./avatar";

interface PersonCardProps {
  person: Person;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  cardRef: (element: HTMLButtonElement | null) => void;
}

export function PersonCard({
  person,
  selected,
  dimmed,
  onSelect,
  cardRef,
}: PersonCardProps) {
  const detail = person.occupation || person.birthplace;

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(person.id)}
      aria-pressed={selected}
      className={[
        "group relative flex min-h-[11.5rem] w-[11.5rem] flex-col items-center rounded-2xl border bg-card px-4 pb-4 pt-5 text-center transition-all duration-200",
        "shadow-[0_1px_0_rgba(43,40,34,0.04),0_10px_24px_-20px_rgba(43,40,34,0.45)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        selected
          ? "border-moss/50 ring-2 ring-moss/25"
          : "border-line hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_1px_0_rgba(43,40,34,0.04),0_20px_34px_-22px_rgba(43,40,34,0.5)]",
        dimmed ? "opacity-25 saturate-50" : "opacity-100",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-moss/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <Avatar person={person} />
      <span className="mt-3 line-clamp-2 min-h-[2.4rem] font-display text-[1.05rem] leading-tight text-ink">
        {person.name}
      </span>
      <span className="mt-0.5 text-[11px] font-medium tracking-wide text-ink-faint">
        {lifespan(person) || "\u00A0"}
      </span>
      <span className="mt-auto line-clamp-1 pt-2 text-[10px] uppercase tracking-[0.14em] text-ink-soft/80">
        {detail || "\u00A0"}
      </span>
    </button>
  );
}
