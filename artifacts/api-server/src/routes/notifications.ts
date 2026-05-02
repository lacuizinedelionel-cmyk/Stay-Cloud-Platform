import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(notificationsTable.businessId, businessId)];
  if (req.query.unread === "true") conditions.push(eq(notificationsTable.isRead, false));
  const notifications = await db.select().from(notificationsTable)
    .where(and(...conditions))
    .orderBy(sql`${notificationsTable.createdAt} desc`);
  res.json(notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [n] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id)).returning();
  if (!n) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...n, createdAt: n.createdAt.toISOString() });
});

export default router;
