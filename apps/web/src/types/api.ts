export type CurrencyCode = "USD" | "UAH";

export type ProductStatus = "FREE" | "IN_REPAIR" | "IN_USE";

export type Money = {
  symbol: CurrencyCode;
  value: number;
  isDefault: boolean;
};

export type Product = {
  id: number;
  serialNumber: string;
  isNew: boolean;
  photo: string | null;
  title: string;
  type: string;
  specification: string;
  status: ProductStatus;
  guarantee: { start: string; end: string };
  date: string;
  prices: Money[];
  order: { id: number; title: string };
  group: { id: number; title: string } | null;
  user: { id: number; name: string } | null;
};

export type OrderSummary = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  createdAt: string;
  productsCount: number;
  totals: Money[];
};

export type OrderDetails = OrderSummary & {
  products: Product[];
};

export type ListResponse<T> = {
  items: T[];
  total: number;
};

export type User = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type LoginPayload = { email: string; password: string };

export type RegisterPayload = LoginPayload & { name: string };

export type ProductsQuery = {
  type?: string;
  search?: string;
};
