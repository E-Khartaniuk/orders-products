"use client";

import clsx from "clsx";
import { useId, type ReactNode } from "react";
import { useTranslations } from "use-intl";

type ChartCardProps = {
  title: string;
  wide?: boolean;
  note?: string;
  columns?: [string, string];
  rows?: (string | number)[][];
  children: ReactNode;
};

export function ChartCard({ title, wide, note, columns, rows, children }: ChartCardProps) {
  const t = useTranslations("dashboard");
  const titleId = useId();

  return (
    <section className={clsx("chart-card", wide && "chart-card--wide")} aria-labelledby={titleId}>
      <header className="chart-card__header">
        <h2 id={titleId} className="chart-card__title">
          {title}
        </h2>
        {note && <span className="chart-card__note">{note}</span>}
      </header>
      <div className="chart-card__body">{children}</div>
      {columns && rows && (
        <details className="chart-card__table">
          <summary>{t("showTable")}</summary>
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th scope="col">{columns[0]}</th>
                <th scope="col" className="text-end">
                  {columns[1]}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td className="text-end">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
