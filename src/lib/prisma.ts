import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  // If explicitly using postgres or mysql, respect it
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / serverless environments, the root directory is strictly READ-ONLY.
  // SQLite write operations fail with "Error code 14: Unable to open the database file"
  // unless the database file is placed in the writable /tmp directory.
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (process.env.NODE_ENV === "production" && !process.env.LOCAL_PROD)
  );

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "dev.db");

    // Copy bundled seed database into /tmp if not already present
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.resolve("./prisma/dev.db"),
        path.resolve("./dev.db"),
      ];

      let copied = false;
      for (const src of candidatePaths) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            copied = true;
            break;
          } catch (err) {
            console.error("Failed to copy SQLite database to /tmp:", err);
          }
        }
      }

      if (!copied) {
        try {
          fs.writeFileSync(tmpDbPath, "");
        } catch (e) {
          console.error("Failed to initialize /tmp/dev.db:", e);
        }
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Local development
  return process.env.DATABASE_URL || "file:./prisma/dev.db";
}

const resolvedDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;



