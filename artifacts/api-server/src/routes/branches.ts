import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, branchesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/branches", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const branches = await db.select().from(branchesTable).where(eq(branchesTable.businessId, businessId));
  res.json(branches.map(b => ({ ...b, dailyRevenue: parseFloat(b.dailyRevenue ?? "0"), createdAt: b.createdAt.toISOString() })));
});

router.post("/branches", async (req, res): Promise<void> => {
  const { businessId, name, city, address } = req.body;
  if (!businessId || !name || !city) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [branch] = await db.insert(branchesTable).values({ businessId, name, city, address }).returning();
  res.status(201).json({ ...branch, dailyRevenue: 0, createdAt: branch.createdAt.toISOString() });
});

export default router;
