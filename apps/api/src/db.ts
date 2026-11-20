import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const url = new URL(databaseUrl);
const sslCa = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: sslCa ? { ca: sslCa, rejectUnauthorized: true } : undefined,
  connectionLimit: 10,
  connectTimeout: 10000,
  acquireTimeout: 5000,
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({ adapter });
