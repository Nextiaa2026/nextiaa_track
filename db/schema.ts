import {
  pgTable,
  text,
  timestamp,
  serial,
  integer,
  varchar,
  boolean,
  doublePrecision,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// ─── Auth.js Tables ──────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  password: text("password"), // nullable for social login
  name: varchar("name", { length: 255 }),
  image: text("image"),
  role: varchar("role", { length: 50 }).notNull().default("customer"), // admin | staff | customer
  credits: integer("credits").notNull().default(100), // Welcome bonus credits
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ─── Subscription Plans ───────────────────────────────────────────────────────
// Plans define what a user tier can do and how many credits they get per cycle.

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // free | starter | professional | enterprise
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull().default(0), // in cents, 0 = free
  priceYearly: integer("price_yearly").notNull().default(0),
  creditsPerCycle: integer("credits_per_cycle").notNull().default(100), // credits refreshed monthly
  maxShipments: integer("max_shipments"), // null = unlimited
  maxVessels: integer("max_vessels"),     // null = unlimited
  maxTrips: integer("max_trips"),
  features: text("features"), // JSON-serialized feature list
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active | paused | cancelled | expired
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"), // monthly | yearly
  currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  externalSubscriptionId: text("external_subscription_id"), // Stripe subscription ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Credit Ledger ────────────────────────────────────────────────────────────
// Every credit change (earn/deduct) is recorded here for full auditability.
// Credit costs:
//   - Create shipment:       5 credits
//   - Email notification:    1 credit per recipient
//   - Status update (bulk):  2 credits
//   - Add vessel:            10 credits
//   - Schedule trip:         3 credits
//   - Subscription refresh:  +creditsPerCycle (automatic monthly)

export const creditLedger = pgTable("credit_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive = earn, negative = deduct
  balanceAfter: integer("balance_after").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(), // welcome_bonus | shipment_created | email_sent | vessel_added | trip_scheduled | subscription_refresh | admin_adjustment
  referenceType: varchar("reference_type", { length: 50 }), // shipment | vessel | trip | invoice | subscription
  referenceId: integer("reference_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Customers ────────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  locality: varchar("locality", { length: 500 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Vessels ──────────────────────────────────────────────────────────────────
// A vessel belongs to a user (many vessels per user).

export const vessels = pgTable("vessels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  imo: varchar("imo", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull().default("cargo"),
  lastKnownLat: doublePrecision("last_known_lat"),
  lastKnownLon: doublePrecision("last_known_lon"),
  userId: integer("user_id").references(() => users.id), // owner
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Trips ────────────────────────────────────────────────────────────────────
// A trip is a voyage schedule. Shipments are linked to trips (not directly to vessels).
// The vessel is accessed via trip → vessel.

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  tripNumber: varchar("trip_number", { length: 100 }).notNull().unique(),
  vesselId: integer("vessel_id")
    .references(() => vessels.id),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  departureDate: timestamp("departure_date"),
  arrivalDate: timestamp("arrival_date"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending | in_transit | arrived | completed
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Shipments ────────────────────────────────────────────────────────────────
// Shipments link to a TRIP. Vessel info is resolved via trip → vessel.
// No direct vessel columns — use shipment.trip.vessel instead.

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().unique(),
  senderId: integer("sender_id").notNull().references(() => customers.id),
  receiverId: integer("receiver_id").notNull().references(() => customers.id),
  tripId: integer("trip_id").references(() => trips.id), // carrier resolved via trip
  shipmentType: varchar("shipment_type", { length: 50 }).notNull().default("international"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemDescription: text("item_description"),
  itemWeight: varchar("item_weight", { length: 50 }),
  itemDimensions: varchar("item_dimensions", { length: 100 }),
  userId: integer("user_id").references(() => users.id),
  itemImage: text("item_image"),
  shippingCost: integer("shipping_cost").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Shipment Logs ────────────────────────────────────────────────────────────

export const shipmentLogs = pgTable("shipment_logs", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  shipmentId: integer("shipment_id")
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => customers.id),
  receiverId: integer("receiver_id").notNull().references(() => customers.id),
  userId: integer("user_id").references(() => users.id),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("issued"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  shipments: many(shipments),
  invoices: many(invoices),
  vessels: many(vessels),
  trips: many(trips),
  accounts: many(accounts),
  sessions: many(sessions),
  subscriptions: many(userSubscriptions),
  creditLedger: many(creditLedger),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, { fields: [userSubscriptions.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [userSubscriptions.planId], references: [subscriptionPlans.id] }),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  user: one(users, { fields: [creditLedger.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sentShipments: many(shipments, { relationName: "sender" }),
  receivedShipments: many(shipments, { relationName: "receiver" }),
  sentInvoices: many(invoices, { relationName: "invoiceSender" }),
  receivedInvoices: many(invoices, { relationName: "invoiceReceiver" }),
}));

export const vesselsRelations = relations(vessels, ({ one, many }) => ({
  trips: many(trips),
  user: one(users, { fields: [vessels.userId], references: [users.id] }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  vessel: one(vessels, { fields: [trips.vesselId], references: [vessels.id] }),
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  sender: one(customers, {
    fields: [shipments.senderId],
    references: [customers.id],
    relationName: "sender",
  }),
  receiver: one(customers, {
    fields: [shipments.receiverId],
    references: [customers.id],
    relationName: "receiver",
  }),
  trip: one(trips, { fields: [shipments.tripId], references: [trips.id] }),
  user: one(users, { fields: [shipments.userId], references: [users.id] }),
  logs: many(shipmentLogs),
  invoices: many(invoices),
}));

export const shipmentLogsRelations = relations(shipmentLogs, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentLogs.shipmentId],
    references: [shipments.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  shipment: one(shipments, { fields: [invoices.shipmentId], references: [shipments.id] }),
  sender: one(customers, {
    fields: [invoices.senderId],
    references: [customers.id],
    relationName: "invoiceSender",
  }),
  receiver: one(customers, {
    fields: [invoices.receiverId],
    references: [customers.id],
    relationName: "invoiceReceiver",
  }),
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
}));
