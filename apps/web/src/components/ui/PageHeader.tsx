import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  total?: number;
  addLabel?: string;
  onAdd?: () => void;
  children?: ReactNode;
};

export function PageHeader({ title, total, addLabel, onAdd, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      {addLabel && (
        <button type="button" className="page-header__add" aria-label={addLabel} onClick={onAdd}>
          <i className="bi bi-plus-lg" aria-hidden="true" />
        </button>
      )}
      <h1 className="page-header__title">
        {title}
        {total !== undefined && ` / ${total}`}
      </h1>
      {children && <div className="page-header__extra">{children}</div>}
    </div>
  );
}
