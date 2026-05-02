import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, suppliersTable } from "@workspace/db";

const router: IRouter = Router();

const fmt = (s: typeof suppliersTable.$inferSelect) => ({
  ...s,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

// GET /suppliers?businessId=&sector=&isActive=
router.get("/suppliers", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }

  const conditions = [eq(suppliersTable.businessId, businessId)];
  if (req.query.sector) conditions.push(eq(suppliersTable.sector, req.query.sector as string));
  if (req.query.isActive !== undefined) conditions.push(eq(suppliersTable.isActive, req.query.isActive === 'true'));

  const suppliers = await db.select().from(suppliersTable).where(and(...conditions));
  res.json(suppliers.map(fmt));
});

// POST /suppliers
router.post("/suppliers", async (req, res): Promise<void> => {
  const { businessId, name, contactName, phone, email, address, city, sector, paymentTerms, notes } = req.body;
  if (!businessId || !name) { res.status(400).json({ error: "businessId and name required" }); return; }

  const [supplier] = await db.insert(suppliersTable).values({
    businessId, name, contactName, phone, email, address, city, sector, paymentTerms, notes,
  }).returning();
  res.status(201).json(fmt(supplier));
});

// PUT /suppliers/:id
router.put("/suppliers/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, contactName, phone, email, address, city, sector, paymentTerms, notes, isActive } = req.body;
  const [supplier] = await db.update(suppliersTable)
    .set({ name, contactName, phone, email, address, city, sector, paymentTerms, notes, isActive, updatedAt: new Date() })
    .where(eq(suppliersTable.id, id)).returning();
  if (!supplier) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(supplier));
});

// DELETE /suppliers/:id
router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
  res.sendStatus(204);
});

export default router;
