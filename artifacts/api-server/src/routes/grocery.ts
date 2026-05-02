import { Router, type IRouter } from "express";
import { eq, and, lte, sql } from "drizzle-orm";
import { db, groceryProductsTable, suppliersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/grocery/products", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(groceryProductsTable.businessId, businessId)];
  if (req.query.category) conditions.push(eq(groceryProductsTable.category, req.query.category as any));
  let products = await db.select().from(groceryProductsTable).where(and(...conditions));
  if (req.query.lowStock === "true") products = products.filter(p => p.stock <= p.minStock);
  res.json(products.map(p => ({ ...p, price: parseFloat(p.price), costPrice: parseFloat(p.costPrice) })));
});

router.post("/grocery/products", async (req, res): Promise<void> => {
  const { businessId, name, barcode, category, price, costPrice, stock, minStock, supplierId } = req.body;
  if (!businessId || !name || !category || !price || !costPrice) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [product] = await db.insert(groceryProductsTable).values({
    businessId, name, barcode, category, price: price.toString(), costPrice: costPrice.toString(),
    stock: stock ?? 0, minStock: minStock ?? 5, supplierId
  }).returning();
  res.status(201).json({ ...product, price: parseFloat(product.price), costPrice: parseFloat(product.costPrice) });
});

router.put("/grocery/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, barcode, category, price, costPrice, stock, minStock, supplierId } = req.body;
  const [product] = await db.update(groceryProductsTable).set({
    name, barcode, category,
    price: price?.toString(), costPrice: costPrice?.toString(),
    stock, minStock, supplierId
  }).where(eq(groceryProductsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...product, price: parseFloat(product.price), costPrice: parseFloat(product.costPrice) });
});

router.get("/grocery/suppliers", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const suppliers = await db.select().from(suppliersTable).where(eq(suppliersTable.businessId, businessId));
  res.json(suppliers.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.post("/grocery/suppliers", async (req, res): Promise<void> => {
  const { businessId, name, phone, email, city } = req.body;
  if (!businessId || !name) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [supplier] = await db.insert(suppliersTable).values({ businessId, name, phone, email, city }).returning();
  res.status(201).json({ ...supplier, createdAt: supplier.createdAt.toISOString() });
});

router.get("/grocery/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const products = await db.select().from(groceryProductsTable).where(eq(groceryProductsTable.businessId, businessId));
  const suppliers = await db.select().from(suppliersTable).where(and(eq(suppliersTable.businessId, businessId), eq(suppliersTable.isActive, true)));
  const lowStock = products.filter(p => p.stock <= p.minStock).length;
  res.json({ dailySales: 1230000, itemsSoldToday: 847, lowStockCount: lowStock, activeSuppliers: suppliers.length });
});

export default router;
