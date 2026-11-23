"use client";

import clsx from "clsx";
import { useTranslations } from "use-intl";
import type { Product } from "@/types/api";
import { StatusDot, StatusLabel } from "./ProductStatus";
import { ProductThumb } from "./ProductThumb";

type ProductLineProps = {
  product: Product;
  onDelete?: (product: Product) => void;
  onPhoto?: (product: Product) => void;
  onOpen?: (product: Product) => void;
  as?: "li" | "div";
};

export function ProductLine({
  product,
  onDelete,
  onPhoto,
  onOpen,
  as: Tag = "li",
}: ProductLineProps) {
  const t = useTranslations("products");
  const isStatic = !onDelete;

  return (
    <Tag className={clsx("product-line", isStatic && "product-line--static")}>
      <StatusDot status={product.status} />
      <ProductThumb
        src={product.photo}
        type={product.type}
        alt=""
        onClick={onPhoto && (() => onPhoto(product))}
        label={t("photo.open", { title: product.title })}
      />
      <div className="product-line__info">
        {onOpen ? (
          <button
            type="button"
            className="product-line__title"
            title={product.title}
            aria-label={t("card.open", { title: product.title })}
            onClick={() => onOpen(product)}
          >
            {product.title}
          </button>
        ) : (
          <span className="product-line__title" title={product.title}>
            {product.title}
          </span>
        )}
        <div className="product-line__serial">{product.serialNumber}</div>
      </div>
      {!isStatic && (
        <>
          <StatusLabel status={product.status} />
          <div className="product-line__actions">
            <button
              type="button"
              className="icon-button"
              aria-label={t("deleteLabel", { title: product.title })}
              onClick={() => onDelete(product)}
            >
              <i className="bi bi-trash3-fill" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </Tag>
  );
}
