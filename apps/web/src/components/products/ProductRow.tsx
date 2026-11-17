import Link from "next/link";
import { Price } from "@/components/orders/Price";
import { formatLongDate, formatMonthOfYear, formatNumericDate } from "@/lib/format";
import type { Product } from "@/types/api";
import { StatusDot, StatusLabel } from "./ProductStatus";
import { ProductThumb } from "./ProductThumb";

type ProductRowProps = {
  product: Product;
  onDelete: (product: Product) => void;
};

export function ProductRow({ product, onDelete }: ProductRowProps) {
  return (
    <div className="product-row">
      <StatusDot status={product.status} />
      <ProductThumb src={product.photo} alt="" />
      <div className="min-w-0">
        <span className="product-row__title" title={product.title}>
          {product.title}
        </span>
        <div className="product-row__serial">{product.serialNumber}</div>
      </div>
      <StatusLabel status={product.status} />
      <div className="product-row__guarantee">
        <span className="product-row__guarantee-label">с</span>
        <time dateTime={product.guarantee.start}>{formatNumericDate(product.guarantee.start)}</time>
        <span className="product-row__guarantee-label">по</span>
        <time dateTime={product.guarantee.end}>{formatNumericDate(product.guarantee.end)}</time>
      </div>
      <span>{product.isNew ? "новый" : "Б / У"}</span>
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
        <time dateTime={product.date}>{formatLongDate(product.date)}</time>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={`Удалить продукт ${product.title}`}
        onClick={() => onDelete(product)}
      >
        <i className="bi bi-trash3-fill" aria-hidden="true" />
      </button>
    </div>
  );
}
