import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const rows = await db.execute(sql`
    SELECT * FROM reviews WHERE business_id = ${businessId} ORDER BY created_at DESC
  `);
  const reviews = rows.rows.map((r: Record<string, unknown>) => ({
    id:             Number(r.id),
    businessId:     Number(r.business_id),
    authorName:     String(r.author_name),
    authorInitials: String(r.author_initials),
    avatarColor:    String(r.avatar_color),
    rating:         Number(r.rating),
    comment:        String(r.comment),
    sector:         String(r.sector),
    isDemo:         Boolean(r.is_demo),
    createdAt:      String(r.created_at),
  }));
  res.json(reviews);
});

router.post("/reviews", async (req, res): Promise<void> => {
  const { businessId, authorName, rating, comment, sector } = req.body;
  if (!businessId || !authorName || !rating || !comment || !sector) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const initials = authorName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w.charAt(0).toUpperCase())
    .join("");
  const COLORS = ['#818CF8','#F472B6','#34D399','#FBBF24','#F97316','#60A5FA','#94A3B8','#10B981'];
  const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];

  const rows = await db.execute(sql`
    INSERT INTO reviews (business_id, author_name, author_initials, avatar_color, rating, comment, sector, is_demo)
    VALUES (${businessId}, ${authorName}, ${initials}, ${avatarColor}, ${rating}, ${comment}, ${sector}, false)
    RETURNING *
  `);
  const r = rows.rows[0] as Record<string, unknown>;
  res.status(201).json({
    id:             Number(r.id),
    businessId:     Number(r.business_id),
    authorName:     String(r.author_name),
    authorInitials: String(r.author_initials),
    avatarColor:    String(r.avatar_color),
    rating:         Number(r.rating),
    comment:        String(r.comment),
    sector:         String(r.sector),
    isDemo:         Boolean(r.is_demo),
    createdAt:      String(r.created_at),
  });
});

router.delete("/reviews/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`DELETE FROM reviews WHERE id = ${id}`);
  res.json({ success: true });
});

export default router;
