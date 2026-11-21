"use client";

import { TrashIcon } from "./icons";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm animate-[modal-in_180ms_ease-out] rounded-3xl border border-line bg-card p-6 shadow-2xl"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-clay/10 text-clay">
          <TrashIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-clay px-4 py-2 text-sm font-medium text-white transition hover:bg-clay/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
