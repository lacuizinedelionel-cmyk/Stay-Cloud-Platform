import { Router, type IRouter } from "express";
import { db, usersTable, activityLogsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";

const router: IRouter = Router();

/* ── Middleware auth inline ── */
async function requireAuth(req: any, res: any): Promise<{ userId: number; user: any } | null> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return null;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return null;
  }
  return { userId, user };
}

/* ══════════════════════════════════════
   GET /audit/logs — Liste des logs
   Accessible : SUPER_ADMIN, OWNER, MANAGER
══════════════════════════════════════ */
router.get("/audit/logs", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { user } = auth;
  const ALLOWED = ["SUPER_ADMIN", "OWNER", "MANAGER"];
  if (!ALLOWED.includes(user.role)) {
    res.status(403).json({ error: "Accès refusé. Réservé aux gérants et patrons." });
    return;
  }

  const {
    businessId,
    action,
    userRole,
    search,
    from,
    to,
    limit = "50",
    offset = "0",
  } = req.query as Record<string, string>;

  const conditions: ReturnType<typeof eq>[] = [];

  // Super Admin voit tout — les autres voient uniquement leur businessId
  if (user.role !== "SUPER_ADMIN") {
    if (!user.businessId) {
      res.json({ logs: [], total: 0 });
      return;
    }
    conditions.push(eq(activityLogsTable.businessId, user.businessId));
  } else if (businessId) {
    conditions.push(eq(activityLogsTable.businessId, parseInt(businessId)));
  }

  if (action) {
    conditions.push(eq(activityLogsTable.action, action));
  }
  if (userRole) {
    conditions.push(eq(activityLogsTable.userRole, userRole));
  }
  if (from) {
    conditions.push(gte(activityLogsTable.createdAt, new Date(from)));
  }
  if (to) {
    conditions.push(lte(activityLogsTable.createdAt, new Date(to + "T23:59:59")));
  }
  if (search) {
    conditions.push(
      or(
        ilike(activityLogsTable.description, `%${search}%`),
        ilike(activityLogsTable.userName, `%${search}%`),
        ilike(activityLogsTable.action, `%${search}%`),
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(activityLogsTable)
      .where(where)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogsTable)
      .where(where),
  ]);

  res.json({
    logs: logs.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    total: countResult[0]?.count ?? 0,
  });
});

/* ══════════════════════════════════════
   POST /audit/log — Créer un log (interne)
   Accessible : authentifié
══════════════════════════════════════ */
router.post("/audit/log", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { action, description, entityType, entityId, metadata, businessId } = req.body;

  if (!action || !description) {
    res.status(400).json({ error: "action et description requis" });
    return;
  }

  const { user } = auth;
  const [log] = await db
    .insert(activityLogsTable)
    .values({
      businessId:  businessId ?? user.businessId ?? null,
      userId:      user.id,
      userName:    user.name,
      userRole:    user.role,
      action,
      entityType:  entityType ?? null,
      entityId:    entityId ? String(entityId) : null,
      description,
      metadata:    metadata ?? null,
      ipAddress:   req.ip ?? null,
    })
    .returning();

  res.json({ ...log, createdAt: log.createdAt.toISOString() });
});

/* ══════════════════════════════════════
   GET /audit/actions — Toutes les actions distinctes
   Pour le filtre dropdown côté frontend
══════════════════════════════════════ */
router.get("/audit/actions", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { user } = auth;
  const ALLOWED = ["SUPER_ADMIN", "OWNER", "MANAGER"];
  if (!ALLOWED.includes(user.role)) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const conditions = user.role !== "SUPER_ADMIN" && user.businessId
    ? [eq(activityLogsTable.businessId, user.businessId)]
    : [];

  const rows = await db
    .selectDistinct({ action: activityLogsTable.action })
    .from(activityLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(activityLogsTable.action);

  res.json(rows.map(r => r.action));
});

/* ══════════════════════════════════════
   GET /audit/team — Liste des membres de l'équipe
   Accessible : OWNER, MANAGER, SUPER_ADMIN
══════════════════════════════════════ */
router.get("/audit/team", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { user } = auth;
  const ALLOWED = ["SUPER_ADMIN", "OWNER", "MANAGER"];
  if (!ALLOWED.includes(user.role)) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  let query = db
    .select({
      id:         usersTable.id,
      name:       usersTable.name,
      email:      usersTable.email,
      role:       usersTable.role,
      businessId: usersTable.businessId,
      createdAt:  usersTable.createdAt,
    })
    .from(usersTable);

  const members =
    user.role === "SUPER_ADMIN"
      ? await query.orderBy(usersTable.name)
      : await query
          .where(eq(usersTable.businessId, user.businessId!))
          .orderBy(usersTable.name);

  res.json(members.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

/* ══════════════════════════════════════
   PATCH /audit/team/:id/role — Changer le rôle d'un membre
   Accessible : OWNER, SUPER_ADMIN uniquement
══════════════════════════════════════ */
router.patch("/audit/team/:id/role", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const { user } = auth;
  if (!["SUPER_ADMIN", "OWNER"].includes(user.role)) {
    res.status(403).json({ error: "Seul le patron peut modifier les rôles" });
    return;
  }

  const targetId = parseInt(req.params.id);
  const { role } = req.body;
  const VALID_ROLES = ["OWNER", "MANAGER", "STAFF"];
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "Rôle invalide. Valeurs: OWNER, MANAGER, STAFF" });
    return;
  }

  // Vérifier que la cible appartient au même business
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "Membre introuvable" });
    return;
  }
  if (user.role !== "SUPER_ADMIN" && target.businessId !== user.businessId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: role as any })
    .where(eq(usersTable.id, targetId))
    .returning();

  // Logger l'action
  await db.insert(activityLogsTable).values({
    businessId:  user.businessId ?? null,
    userId:      user.id,
    userName:    user.name,
    userRole:    user.role,
    action:      "ROLE_CHANGED",
    entityType:  "USER",
    entityId:    String(targetId),
    description: `Rôle de ${target.name} changé de ${target.role} → ${role}`,
    metadata:    { from: target.role, to: role },
    ipAddress:   req.ip ?? null,
  });

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
