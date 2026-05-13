import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log("Seeding admin user...");

  const adminEmail = "admin@nexiaa.com";
  const adminPassword = "AdminPassword123!"; // Change this after first login
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
    } else {
      await db.insert(schema.users).values({
        email: adminEmail,
        password: hashedPassword,
        name: "Super Admin",
        role: "admin",
        isActive: true,
      });
      console.log("Admin user created successfully!");
      console.log("Email: " + adminEmail);
      console.log("Password: " + adminPassword);
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await client.end();
  }
}

main();
