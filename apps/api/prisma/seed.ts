import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

const PRODUCT_TYPES = [
  { type: "Monitors", titles: ["Dell UltraSharp U2723QE", "LG 27UL850-W", "Samsung Odyssey G5"] },
  { type: "Motherboards", titles: ["Gigabyte X58-USB3 (Socket 1366)", "ASUS PRIME B650-PLUS"] },
  { type: "Laptops", titles: ["Lenovo ThinkPad T14", "Apple MacBook Air M3", "HP EliteBook 840"] },
  { type: "Printers", titles: ["HP LaserJet Pro M404dn", "Canon PIXMA G3420"] },
];

const STATUSES = ["FREE", "IN_REPAIR", "IN_USE"] as const;

const WAREHOUSES = [
  { city: "Kyiv", latitude: 50.4501, longitude: 30.5234 },
  { city: "Lviv", latitude: 49.8397, longitude: 24.0297 },
  { city: "Kharkiv", latitude: 49.9935, longitude: 36.2304 },
  { city: "Odesa", latitude: 46.4825, longitude: 30.7233 },
  { city: "Dnipro", latitude: 48.4647, longitude: 35.0462 },
] as const;
const USD_TO_UAH = 41.5;
const ORDERS_COUNT = 25;
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@inventory.local";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo12345";

async function main() {
  if (process.env.SEED_IF_EMPTY === "true" && (await prisma.user.count()) > 0) {
    console.log("Database already has data, seed skipped");
    return;
  }

  faker.seed(42);

  await prisma.price.deleteMany();
  await prisma.product.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });

  const groups = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.productGroup.create({ data: { title: `${faker.commerce.department()} #${i + 1}` } }),
    ),
  );

  const users = await Promise.all(
    Array.from({ length: 5 }, () =>
      prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          passwordHash: "!disabled",
          name: faker.person.fullName(),
          avatarUrl: faker.image.avatar(),
        },
      }),
    ),
  );

  const seedLocation = () => {
    const warehouse = faker.helpers.arrayElement(WAREHOUSES);
    const jitter = () => faker.number.float({ min: -0.03, max: 0.03, fractionDigits: 5 });
    return {
      city: warehouse.city,
      latitude: warehouse.latitude + jitter(),
      longitude: warehouse.longitude + jitter(),
    };
  };

  for (let i = 0; i < ORDERS_COUNT; i++) {
    const orderDate = faker.date.past({ years: 2 });
    const order = await prisma.order.create({
      data: {
        title: `Приход: ${faker.commerce.productName()}`,
        description: faker.commerce.productDescription(),
        date: orderDate,
        ...seedLocation(),
      },
    });

    const productsCount = faker.number.int({ min: 2, max: 8 });
    for (let j = 0; j < productsCount; j++) {
      const kind = faker.helpers.arrayElement(PRODUCT_TYPES);
      const usd = faker.number.float({ min: 50, max: 3000, fractionDigits: 2 });
      const status = faker.helpers.arrayElement(STATUSES);

      await prisma.product.create({
        data: {
          serialNumber: `SN-${faker.string.numeric(10)}`,
          isNew: faker.datatype.boolean(),
          title: faker.helpers.arrayElement(kind.titles),
          type: kind.type,
          specification: faker.commerce.productAdjective(),
          status,
          guaranteeStart: orderDate,
          guaranteeEnd: faker.date.future({ years: 3, refDate: orderDate }),
          date: orderDate,
          orderId: order.id,
          groupId: faker.datatype.boolean() ? faker.helpers.arrayElement(groups).id : null,
          userId: status === "IN_USE" ? faker.helpers.arrayElement(users).id : null,
          prices: {
            create: [
              { value: usd, symbol: "USD", isDefault: false },
              { value: Math.round(usd * USD_TO_UAH * 100) / 100, symbol: "UAH", isDefault: true },
            ],
          },
        },
      });
    }
  }

  console.log(`Seed completed: ${ORDERS_COUNT} orders`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
