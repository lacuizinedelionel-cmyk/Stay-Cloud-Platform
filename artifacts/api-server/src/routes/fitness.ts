import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, fitnessMembersTable, fitnessClassesTable, fitnessCheckinsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/fitness/members", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(fitnessMembersTable.businessId, businessId)];
  if (req.query.search) conditions.push(ilike(fitnessMembersTable.name, `%${req.query.search}%`));
  let members = await db.select().from(fitnessMembersTable).where(and(...conditions));
  if (req.query.expiringSoon === "true") {
    const week = new Date(); week.setDate(week.getDate() + 7);
    const weekStr = week.toISOString().split("T")[0];
    members = members.filter(m => m.subscriptionEndDate <= weekStr && m.isActive);
  }
  res.json(members.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.post("/fitness/members", async (req, res): Promise<void> => {
  const { businessId, name, phone, email, subscriptionType, subscriptionStartDate } = req.body;
  if (!businessId || !name || !subscriptionType || !subscriptionStartDate) { res.status(400).json({ error: "Missing required fields" }); return; }
  const start = new Date(subscriptionStartDate);
  const end = new Date(start);
  if (subscriptionType === "MONTHLY") end.setMonth(end.getMonth() + 1);
  else if (subscriptionType === "QUARTERLY") end.setMonth(end.getMonth() + 3);
  else end.setFullYear(end.getFullYear() + 1);
  const [member] = await db.insert(fitnessMembersTable).values({
    businessId, name, phone, email, subscriptionType,
    subscriptionStartDate, subscriptionEndDate: end.toISOString().split("T")[0]
  }).returning();
  res.status(201).json({ ...member, createdAt: member.createdAt.toISOString() });
});

router.get("/fitness/classes", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const classes = await db.select().from(fitnessClassesTable).where(eq(fitnessClassesTable.businessId, businessId));
  res.json(classes);
});

router.post("/fitness/classes", async (req, res): Promise<void> => {
  const { businessId, name, coachName, dayOfWeek, startTime, capacity } = req.body;
  if (!businessId || !name || !coachName || !dayOfWeek || !startTime || !capacity) { res.status(400).json({ error: "Missing required fields" }); return; }
  const schedule = `${dayOfWeek} à ${startTime}`;
  const [cls] = await db.insert(fitnessClassesTable).values({ businessId, name, coachName, schedule, dayOfWeek, startTime, capacity }).returning();
  res.status(201).json(cls);
});

router.post("/fitness/checkins", async (req, res): Promise<void> => {
  const { memberId, businessId } = req.body;
  if (!memberId || !businessId) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [member] = await db.select().from(fitnessMembersTable).where(eq(fitnessMembersTable.id, memberId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  const [checkin] = await db.insert(fitnessCheckinsTable).values({ memberId, memberName: member.name, businessId }).returning();
  // Update member
  await db.update(fitnessMembersTable).set({ isPresentNow: true, checkinCount: member.checkinCount + 1 }).where(eq(fitnessMembersTable.id, memberId));
  res.status(201).json({ ...checkin, checkinAt: checkin.checkinAt.toISOString() });
});

router.get("/fitness/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const members = await db.select().from(fitnessMembersTable).where(eq(fitnessMembersTable.businessId, businessId));
  const active = members.filter(m => m.isActive).length;
  const presentNow = members.filter(m => m.isPresentNow).length;
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
  const newThisMonth = members.filter(m => m.createdAt >= thisMonth).length;
  const week = new Date(); week.setDate(week.getDate() + 7);
  const weekStr = week.toISOString().split("T")[0];
  const expiring = members.filter(m => m.subscriptionEndDate <= weekStr && m.isActive).length;
  const prices: Record<string, number> = { MONTHLY: 15000, QUARTERLY: 40000, ANNUAL: 140000 };
  const monthlyRevenue = members.filter(m => m.isActive).reduce((s, m) => s + (prices[m.subscriptionType] ?? 0), 0);
  res.json({ activeMembers: active, subscriptionsThisMonth: newThisMonth, monthlyRevenue, presentNow, expiringThisWeek: expiring });
});

export default router;
