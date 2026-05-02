import { pgTable, serial, text, timestamp, integer, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentStatusEnum = pgEnum("payment_status", ["PAID", "PARTIAL", "PENDING", "OVERDUE"]);

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  durationMonths: integer("duration_months").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  availableSpots: integer("available_spots").notNull(),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  startDate: text("start_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  courseId: integer("course_id"),
  courseName: text("course_name"),
  enrollmentDate: text("enrollment_date"),
  attendanceRate: numeric("attendance_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  studentId: integer("student_id").notNull(),
  studentName: text("student_name").notNull(),
  courseId: integer("course_id").notNull(),
  courseName: text("course_name").notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  installments: integer("installments").notNull().default(1),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({ id: true, createdAt: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
