import { pgTable, serial, text, timestamp, integer, numeric, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const creditStatusEnum = pgEnum("credit_status", [
  "ACTIVE",    // Ardoise en cours, dans les limites
  "WARNED",    // Plafond proche ou dépassé
  "BLOCKED",   // Crédit bloqué
  "SETTLED",   // Solde apuré
]);

export const customerCreditsTable = pgTable("customer_credits", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  totalDebt: numeric("total_debt", { precision: 12, scale: 2 }).notNull().default("0"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).notNull().default("50000"),
  lastPurchaseDate: text("last_purchase_date"),
  reminderDate: text("reminder_date"),
  status: creditStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  autoReminder: boolean("auto_reminder").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table de détail des transactions d'ardoise
export const creditTransactionsTable = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  creditId: integer("credit_id").notNull(),
  businessId: integer("business_id").notNull(),
  type: text("type").notNull(),   // "DEBIT" (achat) | "PAYMENT" (remboursement)
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerCreditSchema = createInsertSchema(customerCreditsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomerCredit = z.infer<typeof insertCustomerCreditSchema>;
export type CustomerCredit = typeof customerCreditsTable.$inferSelect;

export const insertCreditTransactionSchema = createInsertSchema(creditTransactionsTable).omit({ id: true, createdAt: true });
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
