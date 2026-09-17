import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: without this, every hot reload would
// create a brand new PrismaClient (and a new DB connection pool), eventually
// exhausting Postgres's connection limit. In production, each serverless
// instance gets exactly one instance created on cold start.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
