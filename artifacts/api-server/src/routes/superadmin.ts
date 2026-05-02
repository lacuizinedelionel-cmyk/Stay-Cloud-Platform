import { Router, type IRouter } from "express";
import { db, businessesTable, paymentsTable } from "@workspace/db";
import { sql, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/superadmin/stats", async (_req, res): Promise<void> => {
  const businesses = await db.select().from(businessesTable);
  const active = businesses.filter(b => b.isActive).length;
  const totalRevenue = businesses.reduce((sum, b) => sum + parseFloat(b.monthlyRevenue ?? "0"), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = await db.select({ count: sql<number>`count(*)` })
    .from(paymentsTable)
    .where(gte(paymentsTable.createdAt, today));

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const newBusinesses = businesses.filter(b => b.createdAt >= thisMonth).length;

  res.json({
    totalBusinesses: businesses.length,
    activeBusinesses: active,
    monthlyRevenue: totalRevenue,
    totalTransactionsToday: Number(todayPayments[0]?.count ?? 0),
    newBusinessesThisMonth: newBusinesses,
  });
});

router.get("/superadmin/revenue-chart", async (_req, res): Promise<void> => {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const data = months.map((month, i) => ({
    month,
    revenue: 800000 + Math.floor(Math.random() * 400000) + (i * 50000),
    transactions: 1500 + Math.floor(Math.random() * 800) + (i * 30),
  }));
  res.json(data);
});

export default router;
