import { toAmount, type CurrencyCode, type PriceLike } from "../../lib/money.js";

export const productInclude = {
  prices: { select: { value: true, symbol: true, isDefault: true } },
  order: { select: { id: true, title: true } },
  group: { select: { id: true, title: true } },
  user: { select: { id: true, name: true } },
} as const;

type ProductRecord = {
  id: number;
  serialNumber: string;
  isNew: boolean;
  photo: string | null;
  title: string;
  type: string;
  specification: string;
  status: string;
  guaranteeStart: Date;
  guaranteeEnd: Date;
  date: Date;
  prices: PriceLike[];
  order: { id: number; title: string };
  group: { id: number; title: string } | null;
  user: { id: number; name: string } | null;
};

export function toProductDto(product: ProductRecord) {
  return {
    id: product.id,
    serialNumber: product.serialNumber,
    isNew: product.isNew,
    photo: product.photo,
    title: product.title,
    type: product.type,
    specification: product.specification,
    status: product.status,
    guarantee: { start: product.guaranteeStart, end: product.guaranteeEnd },
    date: product.date,
    prices: product.prices.map((price) => ({
      symbol: price.symbol as CurrencyCode,
      value: toAmount(price.value),
      isDefault: Boolean(price.isDefault),
    })),
    order: product.order,
    group: product.group,
    user: product.user,
  };
}

export type ProductDto = ReturnType<typeof toProductDto>;
