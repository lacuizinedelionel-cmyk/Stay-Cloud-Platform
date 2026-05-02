import { pgTable, serial, text, timestamp, integer, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vehicleStatusEnum = pgEnum("vehicle_status", ["DIAGNOSTIC", "IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "DELIVERED"]);
export const quoteStatusEnum = pgEnum("quote_status", ["DRAFT", "SENT", "ACCEPTED", "REJECTED"]);

export const garageVehiclesTable = pgTable("garage_vehicles", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  plate: text("plate").notNull(),
  brand: text("brand").notNull(),
  model: text("model"),
  year: integer("year"),
  problem: text("problem").notNull(),
  status: vehicleStatusEnum("status").notNull().default("DIAGNOSTIC"),
  progressPercent: integer("progress_percent").notNull().default(0),
  estimatedAmount: numeric("estimated_amount", { precision: 12, scale: 2 }),
  finalAmount: numeric("final_amount", { precision: 12, scale: 2 }),
  mechanicName: text("mechanic_name"),
  entryDate: text("entry_date").notNull(),
  deliveryDate: text("delivery_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const garageQuotesTable = pgTable("garage_quotes", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  vehicleId: integer("vehicle_id"),
  clientName: text("client_name").notNull(),
  plate: text("plate").notNull(),
  items: jsonb("items").notNull().$type<Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }>>(),
  laborCost: numeric("labor_cost", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: quoteStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const garagePartsTable = pgTable("garage_parts", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  reference: text("reference"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(2),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  compatible: text("compatible"),
});

export const insertGarageVehicleSchema = createInsertSchema(garageVehiclesTable).omit({ id: true, createdAt: true });
export type InsertGarageVehicle = z.infer<typeof insertGarageVehicleSchema>;
export type GarageVehicle = typeof garageVehiclesTable.$inferSelect;

export const insertGarageQuoteSchema = createInsertSchema(garageQuotesTable).omit({ id: true, createdAt: true });
export type InsertGarageQuote = z.infer<typeof insertGarageQuoteSchema>;
export type GarageQuote = typeof garageQuotesTable.$inferSelect;

export const insertGaragePartSchema = createInsertSchema(garagePartsTable).omit({ id: true });
export type InsertGaragePart = z.infer<typeof insertGaragePartSchema>;
export type GaragePart = typeof garagePartsTable.$inferSelect;
