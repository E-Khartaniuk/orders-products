import { vi } from "vitest";

export const prismaMock = {
  $queryRaw: vi.fn(),
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  refreshSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

export function prismaError(code: string) {
  return Object.assign(new Error(`Prisma error ${code}`), {
    name: "PrismaClientKnownRequestError",
    code,
  });
}

export const sampleProductRecord = {
  id: 10,
  serialNumber: "SN-0000000001",
  isNew: true,
  photo: null,
  title: "Gigabyte X58-USB3 (Socket 1366)",
  type: "Motherboards",
  specification: "Socket 1366",
  status: "FREE",
  guaranteeStart: new Date("2024-01-01T00:00:00.000Z"),
  guaranteeEnd: new Date("2026-01-01T00:00:00.000Z"),
  date: new Date("2024-01-01T00:00:00.000Z"),
  prices: [
    { value: "100.50", symbol: "USD", isDefault: false },
    { value: "4170.75", symbol: "UAH", isDefault: true },
  ],
  order: { id: 1, title: "Order 1" },
  group: null,
  user: null,
};
