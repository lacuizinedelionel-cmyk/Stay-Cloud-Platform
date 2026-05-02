import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentMethodEnum = pgEnum("payment_method", ["CASH", "MTN_MOBILE_MONEY", "ORANGE_MONEY", "CARD"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  clientId: integer("client_id"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("COMPLETED"),
  reference: text("reference"),
  sector: text("sector").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
