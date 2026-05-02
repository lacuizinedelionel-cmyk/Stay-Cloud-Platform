import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, clientsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(clientsTable.businessId, businessId)];
  if (req.query.search) conditions.push(ilike(clientsTable.name, `%${req.query.search}%`));
  const clients = await db.select().from(clientsTable).where(and(...conditions));
  res.json(clients.map(c => ({
    ...c,
    totalSpent: parseFloat(c.totalSpent ?? "0"),
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/clients", async (req, res): Promise<void> => {
  const { businessId, name, phone, email, city } = req.body;
  if (!businessId || !name) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [client] = await db.insert(clientsTable).values({ businessId, name, phone, email, city }).returning();
  res.status(201).json({ ...client, totalSpent: 0, createdAt: client.createdAt.toISOString() });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...client, totalSpent: parseFloat(client.totalSpent ?? "0"), createdAt: client.createdAt.toISOString() });
});

router.put("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { name, phone, email, city } = req.body;
  const [updated] = await db
    .update(clientsTable)
    .set({ ...(name && { name }), ...(phone !== undefined && { phone }), ...(email !== undefined && { email }), ...(city !== undefined && { city }) })
    .where(eq(clientsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, totalSpent: parseFloat(updated.totalSpent ?? "0"), createdAt: updated.createdAt.toISOString() });
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.json({ success: true });
});

export default router;
