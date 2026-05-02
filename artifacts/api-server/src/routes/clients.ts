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

export default router;
