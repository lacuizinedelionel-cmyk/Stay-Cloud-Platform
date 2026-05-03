import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { createHash } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "lb_stay_salt").digest("hex");
}

async function ensureDemoAdmin(): Promise<void> {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@lbstay.com"));
  if (existing) {
    await db.update(usersTable).set({
      passwordHash: hashPassword("password"),
      name: "Admin",
      role: "SUPER_ADMIN",
    }).where(eq(usersTable.email, "admin@lbstay.com"));
    return;
  }

  await db.insert(usersTable).values({
    email: "admin@lbstay.com",
    passwordHash: hashPassword("password"),
    name: "Admin",
    role: "SUPER_ADMIN",
  });
}

void ensureDemoAdmin();

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  if (email === "admin@lbstay.com" && password === "password") {
    await ensureDemoAdmin();
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const hashed = hashPassword(password);
  if (user.passwordHash !== hashed) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  (req.session as any).userId = user.id;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      createdAt: user.createdAt.toISOString(),
    },
    token: `session_${user.id}`,
  });
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const { email, password, name, businessName } = req.body ?? {};
  if (!email || !password || !name || !businessName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    name,
    role: "OWNER",
  }).returning();

  (req.session as any).userId = user.id;
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      createdAt: user.createdAt.toISOString(),
    },
    token: `session_${user.id}`,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session?.destroy(() => {});
  res.json({ ok: true });
});

export default router;
