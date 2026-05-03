import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, billingSettingsTable } from "@workspace/db";

const isSuperAdminEmail = (email?: string | null) => email === "admin@lbstay.com";

const router: IRouter = Router();

const fmt = (b: typeof billingSettingsTable.$inferSelect) => ({
  ...b,
  taxRate: parseFloat(b.taxRate),
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
});

// GET /billing/settings?businessId=
router.get("/billing/settings", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  if (!isSuperAdminEmail(req.user?.email) && req.user?.businessId !== businessId) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const [settings] = await db.select().from(billingSettingsTable).where(eq(billingSettingsTable.businessId, businessId));
  if (!settings) {
    // Retourne les valeurs par défaut si non configuré
    res.json({
      id: null, businessId,
      businessName: null, logoUrl: null,
      headerLine1: null, headerLine2: null,
      footerText: null,
      invoicePrefix: "FAC",
      nextInvoiceNumber: 1,
      taxRate: 19.25,
      currency: "XAF",
      bankDetails: null,
      showTax: true, showLogo: true,
      primaryColor: "#F5A623",
      createdAt: null, updatedAt: null,
    });
    return;
  }
  res.json(fmt(settings));
});

// PUT /billing/settings — Upsert (crée ou met à jour)
router.put("/billing/settings", async (req, res): Promise<void> => {
  const { businessId, businessName, logoUrl, headerLine1, headerLine2, footerText, invoicePrefix, taxRate, currency, bankDetails, showTax, showLogo, primaryColor } = req.body;
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  if (!isSuperAdminEmail(req.user?.email) && req.user?.businessId !== businessId) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const [existing] = await db.select().from(billingSettingsTable).where(eq(billingSettingsTable.businessId, businessId));

  if (existing) {
    const [updated] = await db.update(billingSettingsTable)
      .set({
        businessName, logoUrl, headerLine1, headerLine2, footerText,
        invoicePrefix: invoicePrefix ?? existing.invoicePrefix,
        taxRate: taxRate !== undefined ? taxRate.toString() : existing.taxRate,
        currency: currency ?? existing.currency,
        bankDetails, showTax, showLogo,
        primaryColor: primaryColor ?? existing.primaryColor,
        updatedAt: new Date(),
      })
      .where(eq(billingSettingsTable.businessId, businessId)).returning();
    res.json(fmt(updated));
  } else {
    const [created] = await db.insert(billingSettingsTable).values({
      businessId, businessName, logoUrl, headerLine1, headerLine2, footerText,
      invoicePrefix: invoicePrefix ?? "FAC",
      taxRate: (taxRate ?? 19.25).toString(),
      currency: currency ?? "XAF",
      bankDetails, showTax: showTax ?? true, showLogo: showLogo ?? true,
      primaryColor: primaryColor ?? "#F5A623",
    }).returning();
    res.status(201).json(fmt(created));
  }
});

// POST /billing/settings/increment-invoice — Incrémente le numéro de facture
router.post("/billing/settings/increment-invoice", async (req, res): Promise<void> => {
  const { businessId } = req.body;
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  if (!isSuperAdminEmail(req.user?.email) && req.user?.businessId !== businessId) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const [settings] = await db.select().from(billingSettingsTable).where(eq(billingSettingsTable.businessId, businessId));
  if (!settings) { res.status(404).json({ error: "Billing settings not found" }); return; }

  const next = settings.nextInvoiceNumber + 1;
  const prefix = settings.invoicePrefix;
  const invoiceNumber = `${prefix}-${String(settings.nextInvoiceNumber).padStart(4, '0')}`;

  await db.update(billingSettingsTable)
    .set({ nextInvoiceNumber: next, updatedAt: new Date() })
    .where(eq(billingSettingsTable.businessId, businessId));

  res.json({ invoiceNumber, nextInvoiceNumber: next });
});

export default router;
