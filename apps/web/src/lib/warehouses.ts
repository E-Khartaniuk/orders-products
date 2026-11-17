import type { OrderLocation } from "@/types/api";

export const WAREHOUSES: OrderLocation[] = [
  { city: "Kyiv", latitude: 50.4501, longitude: 30.5234 },
  { city: "Lviv", latitude: 49.8397, longitude: 24.0297 },
  { city: "Kharkiv", latitude: 49.9935, longitude: 36.2304 },
  { city: "Odesa", latitude: 46.4825, longitude: 30.7233 },
  { city: "Dnipro", latitude: 48.4647, longitude: 35.0462 },
];

export function findWarehouse(city: string) {
  return WAREHOUSES.find((warehouse) => warehouse.city === city) ?? null;
}
