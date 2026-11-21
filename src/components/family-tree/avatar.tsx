import type { Person } from "@/lib/family";
import { initials } from "@/lib/family";

const TONES = [
  { background: "#e8dcc6", color: "#785a30" },
  { background: "#d9e4da", color: "#3d5a4c" },
  { background: "#f0dbd0", color: "#95502f" },
  { background: "#dde2ea", color: "#495570" },
  { background: "#e9dee7", color: "#674760" },
  { background: "#f1e5c7", color: "#86651f" },
];

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

function toneFor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  return TONES[Math.abs(hash) % TONES.length];
}

interface AvatarProps {
  person: Person;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ person, size = "md", className = "" }: AvatarProps) {
  const tone = toneFor(person.id);
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: tone.background, color: tone.color }}
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-display font-medium tracking-wide ring-1 ring-ink/5 ${SIZES[size]} ${className}`}
    >
      {initials(person.name)}
    </span>
  );
}
