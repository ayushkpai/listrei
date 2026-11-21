"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { Gender, PersonFormValues } from "@/lib/family";
import { XIcon } from "./icons";

interface PersonFormProps {
  title: string;
  subtitle: string;
  initial: PersonFormValues;
  submitLabel: string;
  onSubmit: (values: PersonFormValues) => void;
  onClose: () => void;
}

const fieldClass =
  "w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-moss/50 focus:bg-card focus:ring-2 focus:ring-moss/15";

const labelClass =
  "mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint";

const GENDERS: Array<{ value: Gender | ""; label: string }> = [
  { value: "", label: "Unknown" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

export function PersonForm({
  title,
  subtitle,
  initial,
  submitLabel,
  onSubmit,
  onClose,
}: PersonFormProps) {
  const [values, setValues] = useState<PersonFormValues>(initial);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const update = <Key extends keyof PersonFormValues>(
    key: Key,
    value: PersonFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "name" && error) setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Please give this person a name.");
      return;
    }
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[94dvh] w-full flex-col overflow-y-auto rounded-t-3xl border border-line bg-card shadow-2xl animate-[modal-in_180ms_ease-out] sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-clay">
              {subtitle}
            </p>
            <h2 className="mt-1 font-display text-2xl leading-tight text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            <XIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5">
          <div>
            <label htmlFor="person-name" className={labelClass}>
              Full name
            </label>
            <input
              id="person-name"
              autoFocus
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={120}
              placeholder="e.g. Margaret Eleanor Hale"
              className={fieldClass}
            />
            {error ? (
              <p className="mt-1.5 text-xs text-clay">{error}</p>
            ) : null}
          </div>

          <div>
            <span className={labelClass}>Gender</span>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-paper/60 p-1">
              {GENDERS.map((option) => {
                const active = values.gender === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => update("gender", option.value)}
                    aria-pressed={active}
                    className={[
                      "rounded-lg px-1 py-2 text-xs transition",
                      active
                        ? "bg-card font-medium text-ink shadow-sm ring-1 ring-line"
                        : "text-ink-soft hover:bg-card/60 hover:text-ink",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="person-birth" className={labelClass}>
                Born
              </label>
              <input
                id="person-birth"
                type="date"
                value={values.birthDate}
                max={today}
                onChange={(event) => update("birthDate", event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="person-death" className={labelClass}>
                Died
              </label>
              <input
                id="person-death"
                type="date"
                value={values.deathDate}
                max={today}
                onChange={(event) => update("deathDate", event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="person-place" className={labelClass}>
                Hometown
              </label>
              <input
                id="person-place"
                value={values.birthplace}
                onChange={(event) => update("birthplace", event.target.value)}
                maxLength={160}
                placeholder="Where they called home"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="person-work" className={labelClass}>
                Occupation
              </label>
              <input
                id="person-work"
                value={values.occupation}
                onChange={(event) => update("occupation", event.target.value)}
                maxLength={160}
                placeholder="What they did"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="person-bio" className={labelClass}>
              A few words about them
            </label>
            <textarea
              id="person-bio"
              value={values.bio}
              onChange={(event) => update("bio", event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="A memory, a habit, a story worth keeping…"
              className={`${fieldClass} resize-none leading-relaxed`}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line bg-card/95 px-6 py-4 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-moss px-5 py-2 text-sm font-medium text-paper shadow-sm transition hover:bg-moss-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
