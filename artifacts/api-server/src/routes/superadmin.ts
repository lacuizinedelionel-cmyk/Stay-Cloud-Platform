import { Router, type IRouter } from "express";
import { db, businessesTable, paymentsTable } from "@workspace/db";
import { sql, gte, desc } from "drizzle-orm";

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

  const allPayments = await db.select().from(paymentsTable);
  const totalCA = allPayments.reduce((s, p) => s + parseFloat(p.amount), 0);

  res.json({
    totalBusinesses: businesses.length,
    activeBusinesses: active,
    monthlyRevenue: totalRevenue,
    totalTransactionsToday: Number(todayPayments[0]?.count ?? 0),
    newBusinessesThisMonth: newBusinesses,
    totalPlatformRevenue: totalCA,
    totalTransactions: allPayments.length,
  });
});

router.get("/superadmin/revenue-chart", async (_req, res): Promise<void> => {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const base = [820, 940, 880, 1050, 1120, 1380, 1290, 1450, 1560, 1680, 1820, 1950];
  const data = months.map((month, i) => ({
    month,
    revenue: base[i] * 1000 + Math.floor(Math.random() * 80000),
    transactions: 1500 + Math.floor(Math.random() * 500) + (i * 40),
  }));
  res.json(data);
});

router.get("/superadmin/sector-revenue", async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable);
  const businesses = await db.select().from(businessesTable);

  const bizMap = new Map(businesses.map(b => [b.id, b]));

  const sectorTotals = new Map<string, { revenue: number; transactions: number }>();
  for (const p of payments) {
    const sector = p.sector ?? bizMap.get(p.businessId)?.sector ?? "OTHER";
    const entry = sectorTotals.get(sector) ?? { revenue: 0, transactions: 0 };
    entry.revenue += parseFloat(p.amount);
    entry.transactions += 1;
    sectorTotals.set(sector, entry);
  }

  const SECTOR_LABELS: Record<string, string> = {
    RESTAURANT: "Restauration", HOTEL: "Hôtellerie", BEAUTY: "Beauté",
    GROCERY: "Supermarché", PHARMACY: "Pharmacie", GARAGE: "Garage",
    FITNESS: "Fitness", EDUCATION: "Formation",
  };

  const result = Array.from(sectorTotals.entries())
    .map(([sector, data]) => ({
      sector,
      label: SECTOR_LABELS[sector] ?? sector,
      revenue: data.revenue,
      transactions: data.transactions,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  res.json(result);
});

router.get("/superadmin/payment-methods", async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable);
  const total = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

  const byMethod = new Map<string, number>();
  for (const p of payments) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + parseFloat(p.amount));
  }

  const METHOD_LABELS: Record<string, string> = {
    CASH: "Espèces",
    MTN_MOBILE_MONEY: "MTN Mobile Money",
    ORANGE_MONEY: "Orange Money",
    CARD: "Carte bancaire",
  };

  const result = Array.from(byMethod.entries()).map(([method, amount]) => ({
    method,
    label: METHOD_LABELS[method] ?? method,
    amount,
    percentage: total > 0 ? (amount / total) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  res.json(result);
});

router.get("/superadmin/recent-activity", async (_req, res): Promise<void> => {
  const limit = 12;
  const payments = await db.select().from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(limit);

  const businesses = await db.select().from(businessesTable);
  const bizMap = new Map(businesses.map(b => [b.id, b]));

  const METHOD_LABELS: Record<string, string> = {
    CASH: "Espèces", MTN_MOBILE_MONEY: "MTN MoMo", ORANGE_MONEY: "Orange Money", CARD: "Carte",
  };

  const result = payments.map(p => ({
    id: p.id,
    businessName: bizMap.get(p.businessId)?.name ?? "—",
    sector: p.sector ?? bizMap.get(p.businessId)?.sector ?? "OTHER",
    amount: parseFloat(p.amount),
    method: p.method,
    methodLabel: METHOD_LABELS[p.method] ?? p.method,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(result);
});

export default router;
