import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const router: IRouter = Router();

type MsgRow = Record<string, unknown>;

function mapMsg(r: MsgRow) {
  return {
    id:             Number(r.id),
    fromBusinessId: r.from_business_id != null ? Number(r.from_business_id) : null,
    toBusinessId:   r.to_business_id   != null ? Number(r.to_business_id)   : null,
    fromName:       String(r.from_name),
    senderRole:     String(r.sender_role),
    subject:        String(r.subject),
    body:           String(r.body),
    isRead:         Boolean(r.is_read),
    createdAt:      String(r.created_at),
  };
}

/* GET /messages?businessId=X  — inbox for a business */
router.get("/messages", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const rows = await db.execute(sql`
    SELECT * FROM messages
    WHERE to_business_id = ${businessId}
    ORDER BY created_at DESC
  `);
  res.json(rows.rows.map(r => mapMsg(r as MsgRow)));
});

/* GET /messages/unread-count?businessId=X */
router.get("/messages/unread-count", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.json({ count: 0 }); return; }
  const rows = await db.execute(sql`
    SELECT COUNT(*) AS cnt FROM messages
    WHERE to_business_id = ${businessId} AND is_read = false
  `);
  const cnt = Number((rows.rows[0] as MsgRow)?.cnt ?? 0);
  res.json({ count: cnt });
});

/* GET /messages/all  — Super Admin: all messages grouped by business */
router.get("/messages/all", async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT m.*, b.name AS business_name, b.sector
    FROM messages m
    LEFT JOIN businesses b ON b.id = m.to_business_id
    ORDER BY m.created_at DESC
  `);
  res.json(rows.rows.map(r => ({
    ...mapMsg(r as MsgRow),
    businessName: r.business_name ? String(r.business_name) : null,
    sector:       r.sector        ? String(r.sector)        : null,
  })));
});

/* POST /messages  — Super Admin sends a message */
router.post("/messages", async (req, res): Promise<void> => {
  const { toBusinessId, subject, body, fromName = "LB Stay Cloud" } = req.body;
  if (!toBusinessId || !subject || !body) {
    res.status(400).json({ error: "toBusinessId, subject, body required" }); return;
  }
  const rows = await db.execute(sql`
    INSERT INTO messages (from_business_id, to_business_id, from_name, sender_role, subject, body)
    VALUES (NULL, ${toBusinessId}, ${fromName}, 'SUPER_ADMIN', ${subject}, ${body})
    RETURNING *
  `);
  res.status(201).json(mapMsg(rows.rows[0] as MsgRow));
});

/* POST /messages/broadcast  — Super Admin broadcasts to ALL businesses */
router.post("/messages/broadcast", async (req, res): Promise<void> => {
  const { subject, body, fromName = "LB Stay Cloud" } = req.body;
  if (!subject || !body) {
    res.status(400).json({ error: "subject and body required" }); return;
  }
  const bizRows = await db.execute(sql`SELECT id FROM businesses`);
  const ids = bizRows.rows.map(r => Number((r as MsgRow).id));

  for (const bizId of ids) {
    await db.execute(sql`
      INSERT INTO messages (from_business_id, to_business_id, from_name, sender_role, subject, body)
      VALUES (NULL, ${bizId}, ${fromName}, 'SUPER_ADMIN', ${subject}, ${body})
    `);
  }
  res.status(201).json({ success: true, sentTo: ids.length });
});

/* PATCH /messages/:id/read  — mark as read */
router.patch("/messages/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`UPDATE messages SET is_read = true WHERE id = ${id}`);
  res.json({ success: true });
});

/* PATCH /messages/read-all?businessId=X */
router.patch("/messages/read-all", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  await db.execute(sql`UPDATE messages SET is_read = true WHERE to_business_id = ${businessId}`);
  res.json({ success: true });
});

/* DELETE /messages/:id */
router.delete("/messages/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`DELETE FROM messages WHERE id = ${id}`);
  res.json({ success: true });
});

export default router;
