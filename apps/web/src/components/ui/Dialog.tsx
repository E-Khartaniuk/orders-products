"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  open: boolean;
  title: string;
  role?: "dialog" | "alertdialog";
  size?: "md" | "lg";
  locked?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({
  open,
  title,
  role = "dialog",
  size = "md",
  locked = false,
  onClose,
  children,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(locked);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    lockedRef.current = locked;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target =
        panel?.querySelector<HTMLElement>("[data-autofocus]") ??
        panel?.querySelector<HTMLElement>(".dialog__footer button");
      target?.focus();
    });
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !lockedRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="dialog">
          <motion.div
            className="dialog__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !locked && onClose()}
          />
          <motion.div
            ref={panelRef}
            className={clsx("dialog__panel", `dialog__panel--${size}`)}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <button
              type="button"
              className="dialog__close"
              aria-label="Закрыть"
              onClick={onClose}
              disabled={locked}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

type DialogFooterProps = {
  cancelLabel?: string;
  disabled?: boolean;
  onCancel: () => void;
  children: ReactNode;
};

export function DialogFooter({
  cancelLabel = "Отменить",
  disabled,
  onCancel,
  children,
}: DialogFooterProps) {
  return (
    <div className="dialog__footer">
      <button type="button" className="dialog__cancel" onClick={onCancel} disabled={disabled}>
        {cancelLabel}
      </button>
      {children}
    </div>
  );
}

export function DialogError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="dialog__error" role="alert">
      {message}
    </p>
  );
}
