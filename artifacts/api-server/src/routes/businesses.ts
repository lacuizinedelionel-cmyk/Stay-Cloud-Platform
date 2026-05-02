import { Router, type IRouter } from "express";
import { eq, and, sql, gte } from "drizzle-orm";
import { db, businessesTable, paymentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/businesses", async (req, res): Promise<void> => {
  let query = db.select().from(businessesTable);
  const conditions = [];
  if (req.query.sector) conditions.push(eq(businessesTable.sector, req.query.sector as any));
  if (req.query.city) conditions.push(eq(businessesTable.city, req.query.city as string));
  const businesses = conditions.length
    ? await db.select().from(businessesTable).where(and(...conditions))
    : await db.select().from(businessesTable);
  res.json(businesses.map(b => ({
    ...b,
    monthlyRevenue: parseFloat(b.monthlyRevenue ?? "0"),
    createdAt: b.createdAt.toISOString(),
  })));
});

router.post("/businesses", async (req, res): Promise<void> => {
  const { name, sector, plan, city, phone, address, colorTheme } = req.body;
  if (!name || !sector || !plan || !city) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [biz] = await db.insert(businessesTable).values({
    name, sector, plan, city, phone, address, colorTheme,
    ownerId: (req.session as any)?.userId ?? 1,
    monthlyRevenue: "0",
  }).returning();
  res.status(201).json({ ...biz, monthlyRevenue: 0, createdAt: biz.createdAt.toISOString() });
});

router.get("/businesses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
  if (!biz) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...biz, monthlyRevenue: parseFloat(biz.monthlyRevenue ?? "0"), createdAt: biz.createdAt.toISOString() });
});

router.put("/businesses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, sector, plan, city, phone, address, colorTheme } = req.body;
  const [biz] = await db.update(businessesTable)
    .set({ name, sector, plan, city, phone, address, colorTheme })
    .where(eq(businessesTable.id, id))
    .returning();
  if (!biz) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...biz, monthlyRevenue: parseFloat(biz.monthlyRevenue ?? "0"), createdAt: biz.createdAt.toISOString() });
});

router.get("/businesses/:id/stats", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const payments = await db.select().from(paymentsTable)
    .where(and(eq(paymentsTable.businessId, id), gte(paymentsTable.createdAt, today)));
  const dailyRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  res.json({
    dailyRevenue,
    transactionsCount: payments.length,
    clientsCount: new Set(payments.map(p => p.clientId).filter(Boolean)).size,
    averageTicket: payments.length ? dailyRevenue / payments.length : 0,
  });
});

export default router;
