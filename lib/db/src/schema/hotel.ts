import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomTypeEnum = pgEnum("room_type", ["STANDARD", "SUPERIOR", "SUITE", "PRESIDENTIAL"]);
export const roomStatusEnum = pgEnum("room_status", ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["RESERVED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]);

export const hotelRoomsTable = pgTable("hotel_rooms", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  number: text("number").notNull(),
  floor: integer("floor").notNull(),
  type: roomTypeEnum("type").notNull(),
  pricePerNight: numeric("price_per_night", { precision: 12, scale: 2 }).notNull(),
  status: roomStatusEnum("status").notNull().default("AVAILABLE"),
  currentGuestName: text("current_guest_name"),
  checkoutDate: text("checkout_date"),
});

export const hotelReservationsTable = pgTable("hotel_reservations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  roomId: integer("room_id").notNull(),
  roomNumber: text("room_number").notNull(),
  guestName: text("guest_name").notNull(),
  guestPhone: text("guest_phone"),
  checkInDate: text("check_in_date").notNull(),
  checkOutDate: text("check_out_date").notNull(),
  nights: integer("nights").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: reservationStatusEnum("status").notNull().default("RESERVED"),
  paymentMethod: text("payment_method"),
  checkedInAt: timestamp("checked_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHotelRoomSchema = createInsertSchema(hotelRoomsTable).omit({ id: true });
export type InsertHotelRoom = z.infer<typeof insertHotelRoomSchema>;
export type HotelRoom = typeof hotelRoomsTable.$inferSelect;

export const insertHotelReservationSchema = createInsertSchema(hotelReservationsTable).omit({ id: true, createdAt: true });
export type InsertHotelReservation = z.infer<typeof insertHotelReservationSchema>;
export type HotelReservation = typeof hotelReservationsTable.$inferSelect;
