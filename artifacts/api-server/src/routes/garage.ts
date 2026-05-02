import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, garageVehiclesTable, garageQuotesTable, garagePartsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/garage/vehicles", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(garageVehiclesTable.businessId, businessId)];
  if (req.query.status) conditions.push(eq(garageVehiclesTable.status, req.query.status as any));
  const vehicles = await db.select().from(garageVehiclesTable).where(and(...conditions));
  res.json(vehicles.map(v => ({
    ...v,
    estimatedAmount: v.estimatedAmount ? parseFloat(v.estimatedAmount) : null,
    finalAmount: v.finalAmount ? parseFloat(v.finalAmount) : null,
    createdAt: v.createdAt.toISOString(),
  })));
});

router.post("/garage/vehicles", async (req, res): Promise<void> => {
  const { businessId, clientName, clientPhone, plate, brand, model, year, problem, estimatedAmount, mechanicName } = req.body;
  if (!businessId || !clientName || !plate || !brand || !problem) { res.status(400).json({ error: "Missing required fields" }); return; }
  const today = new Date().toISOString().split("T")[0];
  const [vehicle] = await db.insert(garageVehiclesTable).values({
    businessId, clientName, clientPhone, plate, brand, model, year, problem,
    estimatedAmount: estimatedAmount?.toString(), mechanicName, entryDate: today
  }).returning();
  res.status(201).json({ ...vehicle, estimatedAmount: vehicle.estimatedAmount ? parseFloat(vehicle.estimatedAmount) : null, finalAmount: null, createdAt: vehicle.createdAt.toISOString() });
});

router.put("/garage/vehicles/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, progressPercent, finalAmount } = req.body;
  const [vehicle] = await db.update(garageVehiclesTable).set({
    status, progressPercent: progressPercent ?? undefined, finalAmount: finalAmount?.toString()
  }).where(eq(garageVehiclesTable.id, id)).returning();
  if (!vehicle) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...vehicle, estimatedAmount: vehicle.estimatedAmount ? parseFloat(vehicle.estimatedAmount) : null, finalAmount: vehicle.finalAmount ? parseFloat(vehicle.finalAmount) : null, createdAt: vehicle.createdAt.toISOString() });
});

router.get("/garage/quotes", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const quotes = await db.select().from(garageQuotesTable).where(eq(garageQuotesTable.businessId, businessId));
  res.json(quotes.map(q => ({ ...q, laborCost: parseFloat(q.laborCost), totalAmount: parseFloat(q.totalAmount), createdAt: q.createdAt.toISOString() })));
});

router.post("/garage/quotes", async (req, res): Promise<void> => {
  const { businessId, vehicleId, clientName, plate, items, laborCost } = req.body;
  if (!businessId || !clientName || !plate || !items?.length) { res.status(400).json({ error: "Missing required fields" }); return; }
  const quoteItems = items.map((i: any) => ({ ...i, subtotal: i.quantity * i.unitPrice }));
  const total = quoteItems.reduce((s: number, i: any) => s + i.subtotal, 0) + (laborCost ?? 0);
  const [quote] = await db.insert(garageQuotesTable).values({
    businessId, vehicleId, clientName, plate, items: quoteItems, laborCost: (laborCost ?? 0).toString(), totalAmount: total.toString()
  }).returning();
  res.status(201).json({ ...quote, laborCost: parseFloat(quote.laborCost), totalAmount: parseFloat(quote.totalAmount), createdAt: quote.createdAt.toISOString() });
});

router.get("/garage/parts", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const parts = await db.select().from(garagePartsTable).where(eq(garagePartsTable.businessId, businessId));
  res.json(parts.map(p => ({ ...p, unitPrice: parseFloat(p.unitPrice) })));
});

router.get("/garage/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const vehicles = await db.select().from(garageVehiclesTable).where(eq(garageVehiclesTable.businessId, businessId));
  const quotes = await db.select().from(garageQuotesTable).where(eq(garageQuotesTable.businessId, businessId));
  const parts = await db.select().from(garagePartsTable).where(eq(garagePartsTable.businessId, businessId));
  const inProgress = vehicles.filter(v => ["DIAGNOSTIC", "IN_PROGRESS", "WAITING_PARTS"].includes(v.status)).length;
  const pendingQuotes = quotes.filter(q => q.status === "DRAFT" || q.status === "SENT").length;
  const criticalParts = parts.filter(p => p.stock <= p.minStock).length;
  const weeklyRevenue = vehicles.filter(v => v.status === "DELIVERED" && v.finalAmount)
    .reduce((s, v) => s + parseFloat(v.finalAmount!), 0);
  res.json({ vehiclesInProgress: inProgress, pendingQuotes, weeklyRevenue, criticalPartsCount: criticalParts });
});

export default router;
