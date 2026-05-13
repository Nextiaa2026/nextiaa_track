import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log("Seeding subscription plans...");

  const plans = [
    {
      name: "free",
      displayName: "Gratuit",
      description: "Idéal pour tester la plateforme ou pour de petits volumes occasionnels.",
      priceMonthly: 0,
      priceYearly: 0,
      creditsPerCycle: 100,
      maxShipments: 5,
      maxVessels: 2,
      maxTrips: 2,
      features: JSON.stringify([
        "Suivi en temps réel",
        "100 crédits mensuels",
        "Jusqu'à 5 expéditions",
        "Support par e-mail standard"
      ]),
    },
    {
      name: "starter",
      displayName: "Starter",
      description: "Parfait pour les petites entreprises avec des besoins logistiques réguliers.",
      priceMonthly: 2900, // $29.00
      priceYearly: 29000,
      creditsPerCycle: 1000,
      maxShipments: 50,
      maxVessels: 10,
      maxTrips: 10,
      features: JSON.stringify([
        "Tout ce qui est dans Gratuit",
        "1000 crédits mensuels",
        "Jusqu'à 50 expéditions",
        "Notifications WhatsApp (Beta)",
        "Génération de documents illimitée"
      ]),
    },
    {
      name: "professional",
      displayName: "Professionnel",
      description: "Pour les entreprises logistiques en pleine croissance nécessitant une flexibilité totale.",
      priceMonthly: 9900, // $99.00
      priceYearly: 99000,
      creditsPerCycle: 5000,
      maxShipments: null, // Unlimited
      maxVessels: null,
      maxTrips: null,
      features: JSON.stringify([
        "Tout ce qui est dans Starter",
        "5000 crédits mensuels",
        "Expéditions illimitées",
        "Navires et trajets illimités",
        "Support prioritaire 24/7",
        "API access"
      ]),
    },
  ];

  for (const plan of plans) {
    await db
      .insert(schema.subscriptionPlans)
      .values(plan as any)
      .onConflictDoUpdate({
        target: schema.subscriptionPlans.name,
        set: plan as any,
      });
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
