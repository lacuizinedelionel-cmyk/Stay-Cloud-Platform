import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, hotelRoomsTable, hotelReservationsTable, paymentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/hotel/rooms", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const rooms = await db.select().from(hotelRoomsTable).where(eq(hotelRoomsTable.businessId, businessId));
  res.json(rooms.map(r => ({ ...r, pricePerNight: parseFloat(r.pricePerNight) })));
});

router.post("/hotel/rooms", async (req, res): Promise<void> => {
  const { businessId, number, floor, type, pricePerNight } = req.body;
  if (!businessId || !number || !floor || !type || !pricePerNight) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [room] = await db.insert(hotelRoomsTable).values({ businessId, number, floor, type, pricePerNight: pricePerNight.toString() }).returning();
  res.status(201).json({ ...room, pricePerNight: parseFloat(room.pricePerNight) });
});

router.get("/hotel/reservations", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(hotelReservationsTable.businessId, businessId)];
  if (req.query.status) conditions.push(eq(hotelReservationsTable.status, req.query.status as any));
  const reservations = await db.select().from(hotelReservationsTable).where(and(...conditions));
  res.json(reservations.map(r => ({
    ...r,
    totalAmount: parseFloat(r.totalAmount),
    createdAt: r.createdAt.toISOString(),
    checkedInAt: r.checkedInAt?.toISOString() ?? null,
    checkedOutAt: r.checkedOutAt?.toISOString() ?? null,
  })));
});

router.post("/hotel/reservations", async (req, res): Promise<void> => {
  const { businessId, roomId, guestName, guestPhone, checkInDate, checkOutDate } = req.body;
  if (!businessId || !roomId || !guestName || !checkInDate || !checkOutDate) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [room] = await db.select().from(hotelRoomsTable).where(eq(hotelRoomsTable.id, roomId));
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }
  const start = new Date(checkInDate), end = new Date(checkOutDate);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = nights * parseFloat(room.pricePerNight);
  const [reservation] = await db.insert(hotelReservationsTable).values({
    businessId, roomId, roomNumber: room.number, guestName, guestPhone,
    checkInDate, checkOutDate, nights, totalAmount: totalAmount.toString()
  }).returning();
  // Mark room reserved
  await db.update(hotelRoomsTable).set({ status: "RESERVED" }).where(eq(hotelRoomsTable.id, roomId));
  res.status(201).json({ ...reservation, totalAmount, createdAt: reservation.createdAt.toISOString(), checkedInAt: null, checkedOutAt: null });
});

router.post("/hotel/reservations/:id/checkin", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [reservation] = await db.update(hotelReservationsTable)
    .set({ status: "CHECKED_IN", checkedInAt: new Date() })
    .where(eq(hotelReservationsTable.id, id)).returning();
  if (!reservation) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(hotelRoomsTable).set({ status: "OCCUPIED", currentGuestName: reservation.guestName, checkoutDate: reservation.checkOutDate })
    .where(eq(hotelRoomsTable.id, reservation.roomId));
  res.json({ ...reservation, totalAmount: parseFloat(reservation.totalAmount), createdAt: reservation.createdAt.toISOString(), checkedInAt: reservation.checkedInAt?.toISOString(), checkedOutAt: null });
});

router.post("/hotel/reservations/:id/checkout", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [reservation] = await db.update(hotelReservationsTable)
    .set({ status: "CHECKED_OUT", checkedOutAt: new Date() })
    .where(eq(hotelReservationsTable.id, id)).returning();
  if (!reservation) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(hotelRoomsTable).set({ status: "CLEANING", currentGuestName: null, checkoutDate: null })
    .where(eq(hotelRoomsTable.id, reservation.roomId));
  // Record payment
  await db.insert(paymentsTable).values({
    businessId: reservation.businessId, amount: reservation.totalAmount, method: "CASH", sector: "HOTEL", status: "COMPLETED"
  });
  res.json({ ...reservation, totalAmount: parseFloat(reservation.totalAmount), createdAt: reservation.createdAt.toISOString(), checkedInAt: reservation.checkedInAt?.toISOString(), checkedOutAt: reservation.checkedOutAt?.toISOString() });
});

router.get("/hotel/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const rooms = await db.select().from(hotelRoomsTable).where(eq(hotelRoomsTable.businessId, businessId));
  const today = new Date().toISOString().split("T")[0];
  const reservations = await db.select().from(hotelReservationsTable).where(eq(hotelReservationsTable.businessId, businessId));
  const available = rooms.filter(r => r.status === "AVAILABLE").length;
  const occupied = rooms.filter(r => r.status === "OCCUPIED").length;
  const reserved = rooms.filter(r => r.status === "RESERVED").length;
  const cleaning = rooms.filter(r => r.status === "CLEANING").length;
  const arrivalsToday = reservations.filter(r => r.checkInDate === today && r.status === "RESERVED").length;
  const departuresToday = reservations.filter(r => r.checkOutDate === today && r.status === "CHECKED_IN").length;
  const nightlyRevenue = reservations.filter(r => r.status === "CHECKED_IN")
    .reduce((sum, r) => sum + parseFloat(r.totalAmount) / r.nights, 0);
  res.json({
    occupancyRate: rooms.length ? (occupied / rooms.length) * 100 : 0,
    totalRooms: rooms.length, availableRooms: available, occupiedRooms: occupied, reservedRooms: reserved, cleaningRooms: cleaning,
    arrivalsToday, departuresToday, nightlyRevenue,
  });
});

export default router;
