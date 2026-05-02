import { pgTable, serial, text, timestamp, integer, numeric, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billingSettingsTable = pgTable("billing_settings", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  businessName: text("business_name"),
  logoUrl: text("logo_url"),
  headerLine1: text("header_line1"),   // Ex : "Pharmacie Centrale Plus"
  headerLine2: text("header_line2"),   // Ex : "Bonanjo, Douala — Cameroun"
  footerText: text("footer_text"),     // Mentions légales, coordonnées bancaires
  invoicePrefix: text("invoice_prefix").notNull().default("FAC"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("19.25"),
  currency: text("currency").notNull().default("XAF"),
  bankDetails: text("bank_details"),
  showTax: boolean("show_tax").notNull().default(true),
  showLogo: boolean("show_logo").notNull().default(true),
  primaryColor: text("primary_color").notNull().default("#F5A623"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("billing_settings_business_unique").on(t.businessId),
]);

export const insertBillingSettingsSchema = createInsertSchema(billingSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBillingSettings = z.infer<typeof insertBillingSettingsSchema>;
export type BillingSettings = typeof billingSettingsTable.$inferSelect;
