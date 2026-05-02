import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const movementTypeEnum = pgEnum("movement_type", [
  "PURCHASE",    // Achat fournisseur
  "SALE",        // Vente comptoir
  "LOSS",        // Perte / casse
  "EXPIRY",      // Péremption
  "ADJUSTMENT",  // Correction inventaire
  "RETURN",      // Retour fournisseur
  "TRANSFER",    // Transfert entre magasins
]);

export const productSectorEnum = pgEnum("product_sector", [
  "GROCERY",
  "PHARMACY",
  "GARAGE_PART",
  "OTHER",
]);

export const inventoryMovementsTable = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  productSector: productSectorEnum("product_sector").notNull().default("OTHER"),
  movementType: movementTypeEnum("movement_type").notNull(),
  // Positive = entrée, négatif = sortie
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }),
  reason: text("reason"),
  reference: text("reference"),     // N° facture, bon commande, etc.
  operatorName: text("operator_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovementsTable).omit({ id: true, createdAt: true });
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InventoryMovement = typeof inventoryMovementsTable.$inferSelect;
