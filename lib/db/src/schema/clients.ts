import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyLevelEnum = pgEnum("loyalty_level", ["BRONZE", "SILVER", "GOLD", "PLATINUM"]);

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  loyaltyLevel: loyaltyLevelEnum("loyalty_level").notNull().default("BRONZE"),
  totalSpent: numeric("total_spent", { precision: 15, scale: 2 }).notNull().default("0"),
  visitCount: integer("visit_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
