import { pgTable, serial, text, timestamp, integer, boolean, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"]);

export const restaurantProductsTable = pgTable("restaurant_products", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  emoji: text("emoji"),
  isAvailable: boolean("is_available").notNull().default(true),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restaurantOrdersTable = pgTable("restaurant_orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  branchId: integer("branch_id"),
  clientId: integer("client_id"),
  clientName: text("client_name"),
  tableNumber: text("table_number"),
  items: jsonb("items").notNull().$type<Array<{ productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }>>(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRestaurantProductSchema = createInsertSchema(restaurantProductsTable).omit({ id: true, createdAt: true });
export type InsertRestaurantProduct = z.infer<typeof insertRestaurantProductSchema>;
export type RestaurantProduct = typeof restaurantProductsTable.$inferSelect;

export const insertRestaurantOrderSchema = createInsertSchema(restaurantOrdersTable).omit({ id: true, createdAt: true });
export type InsertRestaurantOrder = z.infer<typeof insertRestaurantOrderSchema>;
export type RestaurantOrder = typeof restaurantOrdersTable.$inferSelect;
