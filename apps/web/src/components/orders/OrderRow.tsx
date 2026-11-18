"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";
import { useLocale, useTranslations } from "use-intl";
import { formatLongDate, formatMonthOfYear } from "@/lib/format";
import { useOverflowTitle } from "@/lib/use-overflow-title";
import { usePrefetch } from "@/store/api";
import type { OrderSummary } from "@/types/api";
import { Price } from "./Price";

type OrderRowProps = {
  order: OrderSummary;
  compact: boolean;
  active: boolean;
  onDelete: (order: OrderSummary) => void;
};

export function OrderRow({ order, compact, active, onDelete }: OrderRowProps) {
  const router = useRouter();
  const prefetchOrder = usePrefetch("getOrder");
  const prefetch = () => prefetchOrder(order.id, { ifOlderThan: 30 });
  const t = useTranslations("orders");
  const locale = useLocale();
  const href = `/orders/${order.id}`;
  const showTitleIfCut = useOverflowTitle(order.title);

  const open = () => router.push(href, { scroll: false });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      open();
    }
  };

  const onDeleteClick = (event: MouseEvent) => {
    event.stopPropagation();
    onDelete(order);
  };

  return (
    <div
      className={clsx("order-row", compact && "order-row--compact", active && "order-row--active")}
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      aria-label={order.title}
      onClick={open}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onKeyDown={onKeyDown}
    >
      <div className="order-row__title" onMouseEnter={showTitleIfCut}>
        <Link
          href={href}
          scroll={false}
          className="order-row__title-link"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          {order.title}
        </Link>
      </div>
      <span className="order-row__list-icon" aria-hidden="true">
        <i className="bi bi-list-ul" />
      </span>
      <div className="order-row__count">
        <span className="order-row__count-value">{order.productsCount}</span>
        <span className="order-row__count-label">
          {t("productsLabel", { count: order.productsCount })}
        </span>
      </div>
      <div className="order-row__date">
        <span className="order-row__caption">{formatMonthOfYear(order.date)}</span>
        <time className="order-row__value" dateTime={order.date}>
          {formatLongDate(order.date, locale)}
        </time>
      </div>
      <div className="order-row__sum">
        <Price prices={order.totals} blockClass="order-row" />
      </div>
      <div className="order-row__actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t("deleteLabel", { title: order.title })}
          onClick={onDeleteClick}
        >
          <i className="bi bi-trash3-fill" aria-hidden="true" />
        </button>
      </div>
      <span className="order-row__arrow" aria-hidden="true">
        <i className="bi bi-chevron-right" />
      </span>
    </div>
  );
}
