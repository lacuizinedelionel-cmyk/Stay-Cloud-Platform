import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityLogsTable = pgTable("activity_logs", {
  id:          serial("id").primaryKey(),
  businessId:  integer("business_id"),
  userId:      integer("user_id"),
  userName:    text("user_name").notNull(),
  userRole:    text("user_role").notNull(),
  action:      text("action").notNull(),
  entityType:  text("entity_type"),
  entityId:    text("entity_id"),
  description: text("description").notNull(),
  metadata:    jsonb("metadata"),
  ipAddress:   text("ip_address"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, createdAt: true });
export const selectActivityLogSchema = createSelectSchema(activityLogsTable);
export type ActivityLog    = typeof activityLogsTable.$inferSelect;
export type InsertActivityLog = typeof activityLogsTable.$inferInsert;
