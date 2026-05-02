import { pgTable, serial, text, timestamp, integer, boolean, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sectorEnum = pgEnum("sector", ["RESTAURANT", "HOTEL", "BEAUTY", "GROCERY", "PHARMACY", "GARAGE", "FITNESS", "EDUCATION"]);
export const planEnum = pgEnum("plan", ["FREE", "STARTER", "PRO", "ENTERPRISE"]);

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sector: sectorEnum("sector").notNull(),
  ownerId: integer("owner_id").notNull(),
  plan: planEnum("plan").notNull().default("FREE"),
  logoUrl: text("logo_url"),
  colorTheme: text("color_theme"),
  city: text("city").notNull(),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  monthlyRevenue: numeric("monthly_revenue", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ id: true, createdAt: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
