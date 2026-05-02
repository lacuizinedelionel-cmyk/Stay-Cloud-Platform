import { pgTable, serial, text, timestamp, integer, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const groceryCategoryEnum = pgEnum("grocery_category", ["ALIMENTAIRE", "BOISSONS", "HYGIENE", "PRODUITS_FRAIS", "AUTRES"]);

export const groceryProductsTable = pgTable("grocery_products", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  barcode: text("barcode"),
  category: groceryCategoryEnum("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  supplierId: integer("supplier_id"),
  supplierName: text("supplier_name"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertGroceryProductSchema = createInsertSchema(groceryProductsTable).omit({ id: true });
export type InsertGroceryProduct = z.infer<typeof insertGroceryProductSchema>;
export type GroceryProduct = typeof groceryProductsTable.$inferSelect;
