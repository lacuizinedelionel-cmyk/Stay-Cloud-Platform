import { pgTable, serial, text, timestamp, integer, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentStatusEnum = pgEnum("appointment_status", ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]);

export const beautyServicesTable = pgTable("beauty_services", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const beautyStaffTable = pgTable("beauty_staff", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  appointmentsToday: integer("appointments_today").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("4.5"),
});

export const beautyAppointmentsTable = pgTable("beauty_appointments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  clientId: integer("client_id"),
  clientName: text("client_name").notNull(),
  staffId: integer("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  serviceId: integer("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: appointmentStatusEnum("status").notNull().default("SCHEDULED"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBeautyServiceSchema = createInsertSchema(beautyServicesTable).omit({ id: true });
export type InsertBeautyService = z.infer<typeof insertBeautyServiceSchema>;
export type BeautyService = typeof beautyServicesTable.$inferSelect;

export const insertBeautyStaffSchema = createInsertSchema(beautyStaffTable).omit({ id: true });
export type InsertBeautyStaff = z.infer<typeof insertBeautyStaffSchema>;
export type BeautyStaff = typeof beautyStaffTable.$inferSelect;

export const insertBeautyAppointmentSchema = createInsertSchema(beautyAppointmentsTable).omit({ id: true, createdAt: true });
export type InsertBeautyAppointment = z.infer<typeof insertBeautyAppointmentSchema>;
export type BeautyAppointment = typeof beautyAppointmentsTable.$inferSelect;
