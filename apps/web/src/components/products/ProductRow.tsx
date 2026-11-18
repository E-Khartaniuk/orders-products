"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "use-intl";
import { Price } from "@/components/orders/Price";
import { formatLongDate, formatMonthOfYear, formatNumericDate } from "@/lib/format";
import type { Product } from "@/types/api";
import { StatusDot, StatusLabel } from "./ProductStatus";
import { ProductThumb } from "./ProductThumb";

type ProductRowProps = {
  product: Product;
  onDelete: (product: Product) => void;
  onPhoto: (product: Product) => void;
};

export function ProductRow({ product, onDelete, onPhoto }: ProductRowProps) {
  const t = useTranslations("products");
  const locale = useLocale();

  return (
    <div className="product-row">
      <StatusDot status={product.status} />
      <ProductThumb
        src={product.photo}
        type={product.type}
        alt=""
        onClick={() => onPhoto(product)}
        label={t("photo.open", { title: product.title })}
      />
      <div className="min-w-0">
        <span className="product-row__title" title={product.title}>
          {product.title}
        </span>
        <div className="product-row__serial">{product.serialNumber}</div>
      </div>
      <span className="product-row__type" title={product.type}>
        {product.type}
      </span>
      <StatusLabel status={product.status} />
      <div className="product-row__guarantee">
        <span className="product-row__guarantee-label">{t("from")}</span>
        <time dateTime={product.guarantee.start}>
          {formatLongDate(product.guarantee.start, locale)}
        </time>
        <span className="product-row__caption">{formatNumericDate(product.guarantee.start)}</span>
        <span className="product-row__guarantee-label">{t("to")}</span>
        <time dateTime={product.guarantee.end}>
          {formatLongDate(product.guarantee.end, locale)}
        </time>
        <span className="product-row__caption">{formatNumericDate(product.guarantee.end)}</span>
      </div>
      <span>{product.isNew ? t("new") : t("used")}</span>
      <div className="product-row__price">
        <Price prices={product.prices} blockClass="product-row" />
      </div>
      <div className="min-w-0">
        {product.group ? (
          <span className="product-row__link">{product.group.title}</span>
        ) : (
          <span className="product-row__muted">—</span>
        )}
      </div>
      <div className="min-w-0">
        {product.user ? (
          <span className="product-row__link">{product.user.name}</span>
        ) : (
          <span className="product-row__muted">—</span>
        )}
      </div>
      <div className="min-w-0">
        <Link href={`/orders/${product.order.id}`} className="product-row__link">
          {product.order.title}
        </Link>
      </div>
      <div className="product-row__date">
        <span className="product-row__caption">{formatMonthOfYear(product.date)}</span>
        <time dateTime={product.date}>{formatLongDate(product.date, locale)}</time>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={t("deleteLabel", { title: product.title })}
        onClick={() => onDelete(product)}
      >
        <i className="bi bi-trash3-fill" aria-hidden="true" />
      </button>
    </div>
  );
}
