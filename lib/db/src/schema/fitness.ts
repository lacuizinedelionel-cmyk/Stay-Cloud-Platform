import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionTypeEnum = pgEnum("subscription_type", ["MONTHLY", "QUARTERLY", "ANNUAL"]);

export const fitnessMembersTable = pgTable("fitness_members", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  subscriptionType: subscriptionTypeEnum("subscription_type").notNull(),
  subscriptionStartDate: text("subscription_start_date").notNull(),
  subscriptionEndDate: text("subscription_end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isPresentNow: boolean("is_present_now").notNull().default(false),
  checkinCount: integer("checkin_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fitnessClassesTable = pgTable("fitness_classes", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  coachName: text("coach_name").notNull(),
  schedule: text("schedule").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  capacity: integer("capacity").notNull(),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const fitnessCheckinsTable = pgTable("fitness_checkins", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  memberName: text("member_name").notNull(),
  businessId: integer("business_id").notNull(),
  checkinAt: timestamp("checkin_at").defaultNow().notNull(),
});

export const insertFitnessMemberSchema = createInsertSchema(fitnessMembersTable).omit({ id: true, createdAt: true });
export type InsertFitnessMember = z.infer<typeof insertFitnessMemberSchema>;
export type FitnessMember = typeof fitnessMembersTable.$inferSelect;

export const insertFitnessClassSchema = createInsertSchema(fitnessClassesTable).omit({ id: true });
export type InsertFitnessClass = z.infer<typeof insertFitnessClassSchema>;
export type FitnessClass = typeof fitnessClassesTable.$inferSelect;

export const insertFitnessCheckinSchema = createInsertSchema(fitnessCheckinsTable).omit({ id: true, checkinAt: true });
export type InsertFitnessCheckin = z.infer<typeof insertFitnessCheckinSchema>;
export type FitnessCheckin = typeof fitnessCheckinsTable.$inferSelect;
