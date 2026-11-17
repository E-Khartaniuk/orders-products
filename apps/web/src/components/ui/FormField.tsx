import clsx from "clsx";
import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
};

export function FormField({ id, label, required, error, hint, wide, children }: FormFieldProps) {
  return (
    <div className={clsx("form__field", wide && "form__field--wide")}>
      <label htmlFor={id} className="form__label">
        {label}
        {required && (
          <span className="form__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <div id={`${id}-error`} className="form__error" role="alert">
          {error}
        </div>
      ) : (
        hint && (
          <div id={`${id}-hint`} className="form__hint">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

export function fieldA11y(
  id: string,
  error?: string,
  { hasHint = false, control = "form-control" }: { hasHint?: boolean; control?: string } = {},
) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
    className: clsx(control, "form__control", error && "is-invalid"),
  };
}
