import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, beautyServicesTable, beautyStaffTable, beautyAppointmentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/beauty/services", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const services = await db.select().from(beautyServicesTable).where(eq(beautyServicesTable.businessId, businessId));
  res.json(services.map(s => ({ ...s, price: parseFloat(s.price) })));
});

router.post("/beauty/services", async (req, res): Promise<void> => {
  const { businessId, name, description, price, durationMinutes, category } = req.body;
  if (!businessId || !name || !price || !durationMinutes || !category) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [service] = await db.insert(beautyServicesTable).values({ businessId, name, description, price: price.toString(), durationMinutes, category }).returning();
  res.status(201).json({ ...service, price: parseFloat(service.price) });
});

router.get("/beauty/staff", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const staff = await db.select().from(beautyStaffTable).where(eq(beautyStaffTable.businessId, businessId));
  res.json(staff.map(s => ({ ...s, rating: parseFloat(s.rating ?? "4.5") })));
});

router.post("/beauty/staff", async (req, res): Promise<void> => {
  const { businessId, name, specialty, phone } = req.body;
  if (!businessId || !name || !specialty) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [staff] = await db.insert(beautyStaffTable).values({ businessId, name, specialty, phone }).returning();
  res.status(201).json({ ...staff, rating: parseFloat(staff.rating ?? "4.5") });
});

router.get("/beauty/appointments", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(beautyAppointmentsTable.businessId, businessId)];
  if (req.query.date) conditions.push(eq(beautyAppointmentsTable.appointmentDate, req.query.date as string));
  if (req.query.staffId) conditions.push(eq(beautyAppointmentsTable.staffId, parseInt(req.query.staffId as string, 10)));
  const appointments = await db.select().from(beautyAppointmentsTable).where(and(...conditions));
  res.json(appointments.map(a => ({ ...a, amount: parseFloat(a.amount), createdAt: a.createdAt.toISOString() })));
});

router.post("/beauty/appointments", async (req, res): Promise<void> => {
  const { businessId, clientName, clientId, staffId, serviceId, appointmentDate, startTime } = req.body;
  if (!businessId || !clientName || !staffId || !serviceId || !appointmentDate || !startTime) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [service] = await db.select().from(beautyServicesTable).where(eq(beautyServicesTable.id, serviceId));
  const [staff] = await db.select().from(beautyStaffTable).where(eq(beautyStaffTable.id, staffId));
  if (!service || !staff) { res.status(404).json({ error: "Service or staff not found" }); return; }
  const startH = parseInt(startTime.split(":")[0], 10);
  const startM = parseInt(startTime.split(":")[1], 10);
  const endTotalMin = startH * 60 + startM + service.durationMinutes;
  const endTime = `${Math.floor(endTotalMin / 60).toString().padStart(2, "0")}:${(endTotalMin % 60).toString().padStart(2, "0")}`;
  const [apt] = await db.insert(beautyAppointmentsTable).values({
    businessId, clientName, clientId, staffId, staffName: staff.name,
    serviceId, serviceName: service.name, appointmentDate, startTime, endTime, amount: service.price
  }).returning();
  res.status(201).json({ ...apt, amount: parseFloat(apt.amount), createdAt: apt.createdAt.toISOString() });
});

router.get("/beauty/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const today = new Date().toISOString().split("T")[0];
  const appointments = await db.select().from(beautyAppointmentsTable)
    .where(and(eq(beautyAppointmentsTable.businessId, businessId), eq(beautyAppointmentsTable.appointmentDate, today)));
  const dailyRevenue = appointments.filter(a => a.status === "COMPLETED").reduce((sum, a) => sum + parseFloat(a.amount), 0);
  const waiting = appointments.filter(a => a.status === "SCHEDULED").length;
  res.json({
    appointmentsToday: appointments.length,
    dailyRevenue,
    waitingClients: waiting,
    satisfactionRate: 4.8,
    completedToday: appointments.filter(a => a.status === "COMPLETED").length,
  });
});

export default router;
