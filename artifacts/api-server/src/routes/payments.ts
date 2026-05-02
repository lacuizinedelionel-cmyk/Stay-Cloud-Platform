import { Router, type IRouter } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import { db, paymentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const payments = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.businessId, businessId))
    .limit(limit)
    .orderBy(sql`${paymentsTable.createdAt} desc`);
  res.json(payments.map(p => ({ ...p, amount: parseFloat(p.amount), createdAt: p.createdAt.toISOString() })));
});

router.post("/payments", async (req, res): Promise<void> => {
  const { businessId, clientId, amount, method, sector, reference } = req.body;
  if (!businessId || !amount || !method || !sector) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [payment] = await db.insert(paymentsTable).values({
    businessId, clientId, amount: amount.toString(), method, sector, reference, status: "COMPLETED"
  }).returning();
  res.status(201).json({ ...payment, amount: parseFloat(payment.amount), createdAt: payment.createdAt.toISOString() });
});

router.get("/payments/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.businessId, businessId));
  const total = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const cash = payments.filter(p => p.method === "CASH").reduce((s, p) => s + parseFloat(p.amount), 0);
  const mtn = payments.filter(p => p.method === "MTN_MOBILE_MONEY").reduce((s, p) => s + parseFloat(p.amount), 0);
  const orange = payments.filter(p => p.method === "ORANGE_MONEY").reduce((s, p) => s + parseFloat(p.amount), 0);
  const card = payments.filter(p => p.method === "CARD").reduce((s, p) => s + parseFloat(p.amount), 0);
  res.json({
    totalRevenue: total,
    cash, mtnMobileMoney: mtn, orangeMoney: orange, card,
    cashPercent: total ? (cash / total) * 100 : 0,
    mtnPercent: total ? (mtn / total) * 100 : 0,
    orangePercent: total ? (orange / total) * 100 : 0,
    cardPercent: total ? (card / total) * 100 : 0,
  });
});

export default router;
