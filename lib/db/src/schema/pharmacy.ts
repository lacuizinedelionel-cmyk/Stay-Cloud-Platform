import { pgTable, serial, text, timestamp, integer, boolean, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prescriptionStatusEnum = pgEnum("prescription_status", ["PENDING", "DISPENSED", "PARTIAL", "CANCELLED"]);

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  dci: text("dci"),
  dosage: text("dosage"),
  form: text("form"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  expirationDate: text("expiration_date").notNull(),
  supplierId: integer("supplier_id"),
  requiresPrescription: boolean("requires_prescription").notNull().default(false),
});

export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  patientRef: text("patient_ref").notNull(),
  doctorName: text("doctor_name"),
  medications: jsonb("medications").notNull().$type<Array<{ medicationId: number; medicationName: string; quantity: number; dosageInstructions: string }>>(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: prescriptionStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true });
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;

export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true, createdAt: true });
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptionsTable.$inferSelect;
