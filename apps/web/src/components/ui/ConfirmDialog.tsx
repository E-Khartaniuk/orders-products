"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  cancelLabel = "Отменить",
  pending = false,
  error,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, pending, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="confirm-dialog">
          <motion.div
            className="confirm-dialog__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !pending && onClose()}
          />
          <motion.div
            className="confirm-dialog__panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <button
              type="button"
              className="confirm-dialog__close"
              aria-label="Закрыть"
              onClick={onClose}
              disabled={pending}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <h2 id={titleId} className="confirm-dialog__title">
              {title}
            </h2>
            {children && <div className="confirm-dialog__body">{children}</div>}
            {error && (
              <p className="confirm-dialog__error" role="alert">
                {error}
              </p>
            )}
            <div className="confirm-dialog__footer">
              <button
                ref={cancelRef}
                type="button"
                className="confirm-dialog__cancel"
                onClick={onClose}
                disabled={pending}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="confirm-dialog__confirm"
                onClick={onConfirm}
                disabled={pending}
              >
                <i className="bi bi-trash-fill" aria-hidden="true" />
                {pending ? "Удаление…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
