import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, customerCreditsTable, creditTransactionsTable } from "@workspace/db";

const router: IRouter = Router();

const fmtCredit = (c: typeof customerCreditsTable.$inferSelect) => ({
  ...c,
  totalDebt: parseFloat(c.totalDebt),
  creditLimit: parseFloat(c.creditLimit),
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

const fmtTx = (t: typeof creditTransactionsTable.$inferSelect) => ({
  ...t,
  amount: parseFloat(t.amount),
  createdAt: t.createdAt.toISOString(),
});

function computeStatus(debt: number, limit: number): 'ACTIVE' | 'WARNED' | 'BLOCKED' {
  if (debt >= limit) return 'BLOCKED';
  if (debt >= limit * 0.8) return 'WARNED';
  return 'ACTIVE';
}

// GET /credits?businessId=&status=
router.get("/credits", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(customerCreditsTable.businessId, businessId)];
  if (req.query.status) conditions.push(eq(customerCreditsTable.status, req.query.status as any));
  const credits = await db.select().from(customerCreditsTable).where(and(...conditions));
  res.json(credits.map(fmtCredit));
});

// POST /credits
router.post("/credits", async (req, res): Promise<void> => {
  const { businessId, clientName, clientPhone, creditLimit, reminderDate, notes, autoReminder } = req.body;
  if (!businessId || !clientName) { res.status(400).json({ error: "businessId and clientName required" }); return; }
  const [credit] = await db.insert(customerCreditsTable).values({
    businessId, clientName, clientPhone,
    creditLimit: (creditLimit ?? 50000).toString(),
    totalDebt: "0",
    reminderDate, notes,
    autoReminder: autoReminder ?? false,
    status: 'ACTIVE',
  }).returning();
  res.status(201).json(fmtCredit(credit));
});

// PUT /credits/:id
router.put("/credits/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { clientName, clientPhone, creditLimit, reminderDate, notes, autoReminder, status } = req.body;
  const [credit] = await db.update(customerCreditsTable)
    .set({ clientName, clientPhone, creditLimit: creditLimit?.toString(), reminderDate, notes, autoReminder, status, updatedAt: new Date() })
    .where(eq(customerCreditsTable.id, id)).returning();
  if (!credit) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtCredit(credit));
});

// POST /credits/:id/transactions — Enregistre achat (DEBIT) ou paiement (PAYMENT)
router.post("/credits/:id/transactions", async (req, res): Promise<void> => {
  const creditId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { type, amount, description, businessId } = req.body;
  if (!type || !amount || !businessId) { res.status(400).json({ error: "type, amount, businessId required" }); return; }
  if (!['DEBIT', 'PAYMENT'].includes(type)) { res.status(400).json({ error: "type must be DEBIT or PAYMENT" }); return; }

  const [credit] = await db.select().from(customerCreditsTable).where(eq(customerCreditsTable.id, creditId));
  if (!credit) { res.status(404).json({ error: "Credit not found" }); return; }

  const currentDebt = parseFloat(credit.totalDebt);
  const delta = type === 'DEBIT' ? parseFloat(amount) : -parseFloat(amount);
  const newDebt = Math.max(0, currentDebt + delta);
  const creditLimit = parseFloat(credit.creditLimit);
  const newStatus = newDebt === 0 ? 'SETTLED' : computeStatus(newDebt, creditLimit);
  const today = new Date().toISOString().split('T')[0];

  const [tx] = await db.insert(creditTransactionsTable).values({
    creditId, businessId, type, amount: parseFloat(amount).toString(), description,
  }).returning();

  await db.update(customerCreditsTable)
    .set({
      totalDebt: newDebt.toString(),
      status: newStatus,
      lastPurchaseDate: type === 'DEBIT' ? today : credit.lastPurchaseDate,
      updatedAt: new Date(),
    })
    .where(eq(customerCreditsTable.id, creditId));

  res.status(201).json(fmtTx(tx));
});

// GET /credits/:id/transactions
router.get("/credits/:id/transactions", async (req, res): Promise<void> => {
  const creditId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const txs = await db.select().from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.creditId, creditId))
    .orderBy(desc(creditTransactionsTable.createdAt));
  res.json(txs.map(fmtTx));
});

// DELETE /credits/:id
router.delete("/credits/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(creditTransactionsTable).where(eq(creditTransactionsTable.creditId, id));
  await db.delete(customerCreditsTable).where(eq(customerCreditsTable.id, id));
  res.sendStatus(204);
});

// GET /credits/stats?businessId=
router.get("/credits/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const credits = await db.select().from(customerCreditsTable).where(eq(customerCreditsTable.businessId, businessId));
  const totalDebt = credits.reduce((s, c) => s + parseFloat(c.totalDebt), 0);
  const activeCount = credits.filter(c => c.status === 'ACTIVE').length;
  const warnedCount = credits.filter(c => c.status === 'WARNED').length;
  const blockedCount = credits.filter(c => c.status === 'BLOCKED').length;
  const settledCount = credits.filter(c => c.status === 'SETTLED').length;
  res.json({ totalDebt, activeCount, warnedCount, blockedCount, settledCount, totalClients: credits.length });
});

export default router;
