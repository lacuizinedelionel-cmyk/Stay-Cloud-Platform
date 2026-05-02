import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, medicationsTable, prescriptionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/pharmacy/medications", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  let medications = await db.select().from(medicationsTable).where(eq(medicationsTable.businessId, businessId));
  if (req.query.expiringSoon === "true") {
    const threshold = new Date(); threshold.setDate(threshold.getDate() + 30);
    const thresholdStr = threshold.toISOString().split("T")[0];
    medications = medications.filter(m => m.expirationDate <= thresholdStr);
  }
  if (req.query.lowStock === "true") medications = medications.filter(m => m.stock <= m.minStock);
  res.json(medications.map(m => ({ ...m, price: parseFloat(m.price) })));
});

router.post("/pharmacy/medications", async (req, res): Promise<void> => {
  const { businessId, name, dci, dosage, form, price, stock, minStock, expirationDate, requiresPrescription } = req.body;
  if (!businessId || !name || !price || !expirationDate) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [med] = await db.insert(medicationsTable).values({
    businessId, name, dci, dosage, form, price: price.toString(), stock: stock ?? 0, minStock: minStock ?? 10, expirationDate, requiresPrescription: requiresPrescription ?? false
  }).returning();
  res.status(201).json({ ...med, price: parseFloat(med.price) });
});

router.put("/pharmacy/medications/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, dci, dosage, form, price, stock, minStock, expirationDate, requiresPrescription } = req.body;
  const [med] = await db.update(medicationsTable).set({
    name, dci, dosage, form,
    price: price?.toString(),
    stock, minStock, expirationDate, requiresPrescription,
  }).where(eq(medicationsTable.id, id)).returning();
  if (!med) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...med, price: parseFloat(med.price) });
});

router.patch("/pharmacy/medications/:id/stock", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { delta } = req.body;
  if (delta === undefined) { res.status(400).json({ error: "delta required" }); return; }
  const [med] = await db.update(medicationsTable)
    .set({ stock: sql`GREATEST(0, ${medicationsTable.stock} + ${delta})` })
    .where(eq(medicationsTable.id, id)).returning();
  if (!med) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...med, price: parseFloat(med.price) });
});

router.delete("/pharmacy/medications/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(medicationsTable).where(eq(medicationsTable.id, id));
  res.sendStatus(204);
});

router.get("/pharmacy/prescriptions", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(prescriptionsTable.businessId, businessId)];
  if (req.query.status) conditions.push(eq(prescriptionsTable.status, req.query.status as any));
  const prescriptions = await db.select().from(prescriptionsTable).where(and(...conditions));
  res.json(prescriptions.map(p => ({ ...p, totalAmount: parseFloat(p.totalAmount), createdAt: p.createdAt.toISOString() })));
});

router.post("/pharmacy/prescriptions", async (req, res): Promise<void> => {
  const { businessId, patientRef, doctorName, medications } = req.body;
  if (!businessId || !patientRef || !medications?.length) { res.status(400).json({ error: "Missing required fields" }); return; }
  // Look up medication names and prices
  const allMeds = await db.select().from(medicationsTable).where(eq(medicationsTable.businessId, businessId));
  const medMap = new Map(allMeds.map(m => [m.id, m]));
  let total = 0;
  const items = medications.map((item: any) => {
    const med = medMap.get(item.medicationId);
    const price = med ? parseFloat(med.price) * item.quantity : 0;
    total += price;
    return { medicationId: item.medicationId, medicationName: med?.name ?? "Médicament", quantity: item.quantity, dosageInstructions: item.dosageInstructions };
  });
  const [prescription] = await db.insert(prescriptionsTable).values({
    businessId, patientRef, doctorName, medications: items, totalAmount: total.toString()
  }).returning();
  res.status(201).json({ ...prescription, totalAmount: parseFloat(prescription.totalAmount), createdAt: prescription.createdAt.toISOString() });
});

router.patch("/pharmacy/prescriptions/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status required" }); return; }
  const [prescription] = await db.update(prescriptionsTable)
    .set({ status })
    .where(eq(prescriptionsTable.id, id)).returning();
  if (!prescription) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...prescription, totalAmount: parseFloat(prescription.totalAmount), createdAt: prescription.createdAt.toISOString() });
});

router.get("/pharmacy/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const medications = await db.select().from(medicationsTable).where(eq(medicationsTable.businessId, businessId));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const prescriptions = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.businessId, businessId));
  const todayPx = prescriptions.filter(p => p.createdAt >= today);
  const criticalStock = medications.filter(m => m.stock <= m.minStock).length;
  const threshold = new Date(); threshold.setDate(threshold.getDate() + 30);
  const expiring = medications.filter(m => m.expirationDate <= threshold.toISOString().split("T")[0]).length;
  res.json({
    prescriptionsToday: todayPx.length,
    medicationsSold: 234,
    dailyRevenue: todayPx.reduce((s, p) => s + parseFloat(p.totalAmount), 0),
    criticalStockCount: criticalStock,
    expiringCount: expiring,
  });
});

export default router;
