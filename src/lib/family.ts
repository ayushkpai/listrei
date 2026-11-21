export type Gender = "female" | "male" | "other";

export interface Person {
  id: string;
  name: string;
  gender: Gender | "";
  birthDate: string;
  deathDate: string;
  birthplace: string;
  occupation: string;
  bio: string;
  parentIds: string[];
  spouseIds: string[];
  createdAt: number;
}

export type PersonFormValues = Pick<
  Person,
  | "name"
  | "gender"
  | "birthDate"
  | "deathDate"
  | "birthplace"
  | "occupation"
  | "bio"
>;

export const EMPTY_FORM: PersonFormValues = {
  name: "",
  gender: "",
  birthDate: "",
  deathDate: "",
  birthplace: "",
  occupation: "",
  bio: "",
};

export type RelationKind = "child" | "parent" | "spouse" | "sibling";

const STORAGE_KEY = "listrei.family.v1";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createPerson(values: PersonFormValues): Person {
  return {
    id: newId(),
    name: values.name.trim(),
    gender: values.gender,
    birthDate: values.birthDate,
    deathDate: values.deathDate,
    birthplace: values.birthplace.trim(),
    occupation: values.occupation.trim(),
    bio: values.bio.trim(),
    parentIds: [],
    spouseIds: [],
    createdAt: Date.now(),
  };
}

export function personToForm(person: Person): PersonFormValues {
  return {
    name: person.name,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthplace: person.birthplace,
    occupation: person.occupation,
    bio: person.bio,
  };
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Someone";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function lifespan(person: Person): string {
  const born = person.birthDate ? person.birthDate.slice(0, 4) : "";
  const died = person.deathDate ? person.deathDate.slice(0, 4) : "";
  if (born && died) return `${born} – ${died}`;
  if (born) return `Born ${born}`;
  if (died) return `Died ${died}`;
  return "";
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDate(value: string): string {
  const date = parseDate(value);
  if (!date) return value;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function ageText(person: Person): string {
  const birth = parseDate(person.birthDate);
  if (!birth) return "";
  const end = person.deathDate ? parseDate(person.deathDate) : new Date();
  if (!end) return "";
  let years = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    years -= 1;
  }
  if (years < 0) return "";
  return person.deathDate ? `${years} years` : `${years} years old`;
}

export function relativeLabel(kind: RelationKind, gender: Gender | ""): string {
  if (kind === "parent") {
    return gender === "female" ? "Mother" : gender === "male" ? "Father" : "Parent";
  }
  if (kind === "child") {
    return gender === "female" ? "Daughter" : gender === "male" ? "Son" : "Child";
  }
  if (kind === "spouse") {
    return gender === "female" ? "Wife" : gender === "male" ? "Husband" : "Partner";
  }
  return gender === "female" ? "Sister" : gender === "male" ? "Brother" : "Sibling";
}

export function roman(value: number): string {
  if (value <= 0 || value >= 4000) return String(value);
  const table: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = value;
  let result = "";
  for (const [amount, symbol] of table) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }
  return result;
}

export interface TreeUnit {
  key: string;
  people: Person[];
}

export interface TreeRow {
  generation: number;
  units: TreeUnit[];
}

export function buildTree(people: Person[]): TreeRow[] {
  if (people.length === 0) return [];
  const byId = new Map(people.map((person) => [person.id, person]));
  const generations = computeGenerations(people, byId);
  const order = computeOrder(people, byId);
  const used = new Set<string>();
  const units: Array<{ generation: number; order: number; people: Person[] }> = [];

  const sorted = [...people].sort(
    (a, b) =>
      (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0) ||
      a.createdAt - b.createdAt,
  );

  for (const person of sorted) {
    if (used.has(person.id)) continue;
    const generation = generations.get(person.id) ?? 0;
    const group = [person];
    used.add(person.id);

    for (const spouseId of person.spouseIds) {
      if (used.has(spouseId)) continue;
      const spouse = byId.get(spouseId);
      if (!spouse) continue;
      if ((generations.get(spouse.id) ?? 0) !== generation) continue;
      group.push(spouse);
      used.add(spouse.id);
      break;
    }

    units.push({
      generation,
      order: Math.min(
        ...group.map((member) => order.get(member.id) ?? Number.MAX_SAFE_INTEGER),
      ),
      people: group,
    });
  }

  const rows = new Map<number, TreeUnit[]>();
  for (const unit of units.sort((a, b) => a.order - b.order)) {
    const list = rows.get(unit.generation) ?? [];
    list.push({
      key: unit.people.map((person) => person.id).join("|"),
      people: unit.people,
    });
    rows.set(unit.generation, list);
  }

  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([generation, rowUnits]) => ({ generation, units: rowUnits }));
}

function computeGenerations(
  people: Person[],
  byId: Map<string, Person>,
): Map<string, number> {
  const generations = new Map(people.map((person) => [person.id, 0]));

  for (let pass = 0; pass <= people.length; pass += 1) {
    let changed = false;
    for (const person of people) {
      for (const parentId of person.parentIds) {
        if (!byId.has(parentId)) continue;
        const candidate = (generations.get(parentId) ?? 0) + 1;
        if (candidate > (generations.get(person.id) ?? 0)) {
          generations.set(person.id, candidate);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const roots = new Map(people.map((person) => [person.id, person.id]));

  const find = (id: string): string => {
    let root = id;
    while (roots.get(root) !== root) root = roots.get(root) ?? root;
    let current = id;
    while (roots.get(current) !== current) {
      const next = roots.get(current) ?? current;
      roots.set(current, root);
      current = next;
    }
    return root;
  };

  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) roots.set(rootA, rootB);
  };

  for (const person of people) {
    for (const spouseId of person.spouseIds) {
      if (byId.has(spouseId)) union(person.id, spouseId);
    }
  }

  const groupGeneration = new Map<string, number>();
  for (const person of people) {
    const root = find(person.id);
    groupGeneration.set(
      root,
      Math.max(
        groupGeneration.get(root) ?? 0,
        generations.get(person.id) ?? 0,
      ),
    );
  }

  for (const person of people) {
    generations.set(person.id, groupGeneration.get(find(person.id)) ?? 0);
  }

  return generations;
}

function computeOrder(
  people: Person[],
  byId: Map<string, Person>,
): Map<string, number> {
  const children = new Map<string, string[]>();
  for (const person of people) {
    for (const parentId of person.parentIds) {
      if (!byId.has(parentId)) continue;
      const list = children.get(parentId) ?? [];
      list.push(person.id);
      children.set(parentId, list);
    }
  }

  const order = new Map<string, number>();
  let counter = 0;

  const visit = (id: string, stack: Set<string>) => {
    if (order.has(id)) return;
    order.set(id, counter);
    counter += 1;
    for (const childId of children.get(id) ?? []) {
      if (stack.has(childId)) continue;
      stack.add(childId);
      visit(childId, stack);
      stack.delete(childId);
    }
  };

  const roots = people
    .filter(
      (person) =>
        person.parentIds.filter((id) => byId.has(id)).length === 0,
    )
    .sort((a, b) => a.createdAt - b.createdAt);

  for (const root of roots) visit(root.id, new Set([root.id]));

  for (const person of [...people].sort((a, b) => a.createdAt - b.createdAt)) {
    visit(person.id, new Set([person.id]));
  }

  return order;
}

export interface Relatives {
  parents: Person[];
  spouses: Person[];
  children: Person[];
}

export function getRelatives(people: Person[], person: Person): Relatives {
  const byId = new Map(people.map((item) => [item.id, item]));
  const byCreatedAt = (a: Person, b: Person) => a.createdAt - b.createdAt;
  const parents = person.parentIds
    .map((id) => byId.get(id))
    .filter((item): item is Person => Boolean(item))
    .sort(byCreatedAt);
  const spouses = person.spouseIds
    .map((id) => byId.get(id))
    .filter((item): item is Person => Boolean(item))
    .sort(byCreatedAt);
  const children = people
    .filter((item) => item.parentIds.includes(person.id))
    .sort(byCreatedAt);
  return { parents, spouses, children };
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizePeople(value: unknown): Person[] | null {
  if (!Array.isArray(value)) return null;
  const people: Person[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      continue;
    }
    const name = record.name.trim();
    if (!name) continue;
    people.push({
      id: record.id,
      name: name.slice(0, 120),
      gender:
        record.gender === "female" ||
        record.gender === "male" ||
        record.gender === "other"
          ? record.gender
          : "",
      birthDate:
        typeof record.birthDate === "string"
          ? record.birthDate.slice(0, 10)
          : "",
      deathDate:
        typeof record.deathDate === "string"
          ? record.deathDate.slice(0, 10)
          : "",
      birthplace:
        typeof record.birthplace === "string"
          ? record.birthplace.slice(0, 160)
          : "",
      occupation:
        typeof record.occupation === "string"
          ? record.occupation.slice(0, 160)
          : "",
      bio: typeof record.bio === "string" ? record.bio.slice(0, 2000) : "",
      parentIds: stringArray(record.parentIds),
      spouseIds: stringArray(record.spouseIds),
      createdAt:
        typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
          ? record.createdAt
          : Date.now(),
    });
  }

  const ids = new Set(people.map((person) => person.id));
  for (const person of people) {
    person.parentIds = [...new Set(person.parentIds)].filter(
      (id) => ids.has(id) && id !== person.id,
    );
    person.spouseIds = [...new Set(person.spouseIds)].filter(
      (id) => ids.has(id) && id !== person.id,
    );
  }

  return people;
}

function extractPeople(value: unknown): unknown {
  if (value && typeof value === "object" && "people" in value) {
    return (value as { people: unknown }).people;
  }
  return value;
}

export function loadPeople(): Person[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizePeople(extractPeople(JSON.parse(raw)));
  } catch {
    return null;
  }
}

export function savePeople(people: Person[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, people }),
    );
  } catch {
    // Storage can be unavailable or full; the app keeps working in memory.
  }
}

export function parseImport(text: string): Person[] | null {
  try {
    const people = normalizePeople(extractPeople(JSON.parse(text)));
    return people && people.length > 0 ? people : null;
  } catch {
    return null;
  }
}
