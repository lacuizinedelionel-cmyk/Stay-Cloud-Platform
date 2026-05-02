import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, inventoryMovementsTable } from "@workspace/db";

const router: IRouter = Router();

const fmt = (m: typeof inventoryMovementsTable.$inferSelect) => ({
  ...m,
  unitCost: m.unitCost ? parseFloat(m.unitCost) : null,
  totalValue: m.totalValue ? parseFloat(m.totalValue) : null,
  createdAt: m.createdAt.toISOString(),
});

// GET /inventory/movements?businessId=&productSector=&movementType=&limit=
router.get("/inventory/movements", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }

  const conditions = [eq(inventoryMovementsTable.businessId, businessId)];
  if (req.query.productSector) conditions.push(eq(inventoryMovementsTable.productSector, req.query.productSector as any));
  if (req.query.movementType) conditions.push(eq(inventoryMovementsTable.movementType, req.query.movementType as any));

  const limit = parseInt(req.query.limit as string, 10) || 100;
  const movements = await db.select().from(inventoryMovementsTable)
    .where(and(...conditions))
    .orderBy(desc(inventoryMovementsTable.createdAt))
    .limit(limit);

  res.json(movements.map(fmt));
});

// POST /inventory/movements
router.post("/inventory/movements", async (req, res): Promise<void> => {
  const { businessId, productId, productName, productSector, movementType, quantity, unitCost, reason, reference, operatorName } = req.body;
  if (!businessId || !productName || !movementType || quantity === undefined) {
    res.status(400).json({ error: "businessId, productName, movementType, quantity required" }); return;
  }
  const unitCostNum = unitCost ? parseFloat(unitCost) : null;
  const totalValue = unitCostNum !== null ? Math.abs(quantity) * unitCostNum : null;

  const [movement] = await db.insert(inventoryMovementsTable).values({
    businessId, productId, productName,
    productSector: productSector ?? "OTHER",
    movementType, quantity,
    unitCost: unitCostNum?.toString(),
    totalValue: totalValue?.toString(),
    reason, reference, operatorName,
  }).returning();
  res.status(201).json(fmt(movement));
});

// GET /inventory/stats?businessId=
router.get("/inventory/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }

  const movements = await db.select().from(inventoryMovementsTable)
    .where(eq(inventoryMovementsTable.businessId, businessId));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMovements = movements.filter(m => m.createdAt >= today);
  const totalIn = movements.filter(m => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);
  const totalLoss = movements.filter(m => ['LOSS', 'EXPIRY'].includes(m.movementType))
    .reduce((s, m) => s + (m.totalValue ? parseFloat(m.totalValue) : 0), 0);
  const todayCount = todayMovements.length;

  res.json({ totalIn, totalOut, totalLoss, todayCount, totalMovements: movements.length });
});

// DELETE /inventory/movements/:id
router.delete("/inventory/movements/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(inventoryMovementsTable).where(eq(inventoryMovementsTable.id, id));
  res.sendStatus(204);
});

export default router;
