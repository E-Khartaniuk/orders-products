"use client";

import type { ReactNode } from "react";
import { Dialog, DialogError, DialogFooter } from "./Dialog";

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
  cancelLabel,
  pending = false,
  error,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} role="alertdialog" locked={pending} onClose={onClose}>
      {children && <div className="dialog__body">{children}</div>}
      <DialogError message={error} />
      <DialogFooter cancelLabel={cancelLabel} disabled={pending} onCancel={onClose}>
        <button
          type="button"
          className="dialog__action dialog__action--danger"
          onClick={onConfirm}
          disabled={pending}
        >
          <i className="bi bi-trash-fill" aria-hidden="true" />
          {pending ? "Удаление…" : confirmLabel}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
