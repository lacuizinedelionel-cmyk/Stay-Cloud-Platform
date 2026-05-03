import { useState } from 'react';
import {
  useListGroceryProducts,
  useGetGroceryStats,
  getListGroceryProductsQueryKey,
  getGetGroceryStatsQueryKey,
  GroceryProduct,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { formatXAF } from '@/lib/utils';
import { generateStockReportPDF } from '@/lib/invoice';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Package,
  TrendingDown,
  CheckCircle2,
  Search,
  ArrowUpDown,
  FileDown,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_GROCERY_PRODUCTS = [
  { id: 1, businessId: 1, name: 'Sucre 1kg', category: 'FOOD', stock: 48, minStock: 12, price: 1250, costPrice: 980, isActive: true },
  { id: 2, businessId: 1, name: 'Riz 5kg', category: 'FOOD', stock: 26, minStock: 10, price: 8500, costPrice: 7200, isActive: true },
  { id: 3, businessId: 1, name: 'Paracétamol', category: 'MEDICINE', stock: 64, minStock: 20, price: 600, costPrice: 380, isActive: true },
  { id: 4, businessId: 1, name: 'Huile de palme 1L', category: 'FOOD', stock: 18, minStock: 8, price: 1900, costPrice: 1450, isActive: true },
  { id: 5, businessId: 1, name: 'Lait en poudre', category: 'FOOD', stock: 15, minStock: 10, price: 4200, costPrice: 3600, isActive: true },
  { id: 6, businessId: 1, name: 'Savon de lessive', category: 'HYGIENE', stock: 72, minStock: 25, price: 750, costPrice: 520, isActive: true },
  { id: 7, businessId: 1, name: 'Eau minérale pack', category: 'BOISSONS', stock: 35, minStock: 12, price: 2800, costPrice: 2100, isActive: true },
  { id: 8, businessId: 1, name: 'Café moulu', category: 'FOOD', stock: 9, minStock: 10, price: 3600, costPrice: 2900, isActive: true },
  { id: 9, businessId: 1, name: 'Pâtes alimentaires', category: 'FOOD', stock: 41, minStock: 15, price: 1450, costPrice: 980, isActive: true },
  { id: 10, businessId: 1, name: 'Tomates en boîte', category: 'FOOD', stock: 22, minStock: 12, price: 1100, costPrice: 780, isActive: true },
  { id: 11, businessId: 1, name: 'Jus de gingembre', category: 'BOISSONS', stock: 13, minStock: 8, price: 1750, costPrice: 1200, isActive: true },
  { id: 12, businessId: 1, name: 'Biscuit local', category: 'FOOD', stock: 55, minStock: 18, price: 500, costPrice: 320, isActive: true },
  { id: 13, businessId: 1, name: 'Riz parfumé', category: 'FOOD', stock: 7, minStock: 10, price: 9200, costPrice: 7600, isActive: true },
  { id: 14, businessId: 1, name: 'Pansements', category: 'MEDICINE', stock: 30, minStock: 14, price: 1400, costPrice: 950, isActive: true },
  { id: 15, businessId: 1, name: 'Détergent 2L', category: 'HYGIENE', stock: 11, minStock: 8, price: 2300, costPrice: 1700, isActive: true },
] as GroceryProduct[];

function StockBar({ current, min }: { current: number; min: number }) {
  const pct = min === 0 ? 100 : Math.min((current / Math.max(current, min * 3)) * 100, 100);
  const isLow = current <= min;
  const isCritical = current === 0;
  const color = isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>{current}</span>
    </div>
  );
}

function StockBadge({ product }: { product: GroceryProduct }) {
  if (product.stock === 0) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsl(0 72% 51% / 0.12)', color: '#EF4444' }}>Rupture</span>
  );
  if (product.stock <= product.minStock) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsl(38 90% 56% / 0.12)', color: '#F59E0B' }}>Stock bas</span>
  );
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsl(160 84% 39% / 0.12)', color: '#10B981' }}>OK</span>
  );
}

export default function GroceryStockPage() {
  const { business } = useAuth();
  const { data: products, isLoading, refetch } = useListGroceryProducts(
    { businessId: business?.id ?? 0 },
    { query: { queryKey: getListGroceryProductsQueryKey({ businessId: business?.id ?? 0 }), enabled: !!business?.id, refetchInterval: 30000 } },
  );
  const bId = business?.id ?? 0;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'CRITICAL'>('ALL');
  const [sort, setSort] = useState<'name' | 'stock' | 'value'>('stock');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GroceryProduct | null>(null);
  const fallbackProducts = DEMO_GROCERY_PRODUCTS;

  const productsKey = getListGroceryProductsQueryKey({ businessId: bId });
  const statsKey = getGetGroceryStatsQueryKey({ businessId: bId });

  const { data: stats } = useGetGroceryStats(
    { businessId: bId },
    { query: { queryKey: statsKey, enabled: !!bId } },
  );

  const sourceProducts = (products && products.length > 0 ? products : fallbackProducts);

  const filtered = sourceProducts
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'ALL' ? true :
        filter === 'CRITICAL' ? p.stock === 0 :
        p.stock <= p.minStock;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === 'stock') return a.stock - b.stock;
      if (sort === 'value') return (b.stock * b.price) - (a.stock * a.price);
      return a.name.localeCompare(b.name);
    });

  const criticalCount = sourceProducts.filter(p => p.stock === 0).length;
  const lowCount = sourceProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = sourceProducts.reduce((s, p) => s + p.stock * p.price, 0);

  const FILTERS = [
    { value: 'ALL' as const, label: 'Tous', count: sourceProducts.length, color: undefined },
    { value: 'LOW' as const, label: 'Stock bas', count: lowCount, color: '#F59E0B' },
    { value: 'CRITICAL' as const, label: 'Rupture', count: criticalCount, color: '#EF4444' },
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateStockReportPDF(business?.name ?? 'Épicerie', sourceProducts);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>Gestion des stocks</h1>
          <p className="text-xs text-muted-foreground mt-1">Inventaire en temps réel · Alertes automatiques</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting || sourceProducts.length === 0}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, hsl(38 90% 56%), hsl(38 90% 46%))',
            color: '#000',
            boxShadow: '0 4px 14px hsl(38 90% 56% / 0.3)',
          }}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {isExporting ? 'Export...' : 'Rapport PDF'}
        </button>
        <button
          onClick={() => refetch()}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {(criticalCount > 0 || lowCount > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'hsl(0 72% 51% / 0.08)', border: '1px solid hsl(0 72% 51% / 0.25)' }}
          >
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#EF4444' }} />
              <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: '#EF4444' }} />
            </span>
            <p className="text-xs font-semibold text-foreground">
              {criticalCount > 0 && <span style={{ color: '#EF4444' }}>{criticalCount} rupture(s) de stock</span>}
              {criticalCount > 0 && lowCount > 0 && ' · '}
              {lowCount > 0 && <span style={{ color: '#F59E0B' }}>{lowCount} produit(s) en stock bas</span>}
              <span className="text-muted-foreground font-normal"> — Réapprovisionnement recommandé</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total produits', value: sourceProducts.length, icon: Package, color: '#3B82F6' },
          { label: 'Rupture de stock', value: criticalCount, icon: TrendingDown, color: '#EF4444', pulse: criticalCount > 0 },
          { label: 'Stock bas', value: lowCount, icon: AlertTriangle, color: '#F59E0B', pulse: lowCount > 0 },
          { label: 'Valeur stock', value: formatXAF(totalValue), icon: CheckCircle2, color: '#10B981' },
        ].map((s, i) => {
          const Icon = s.icon;
          const pulse = 'pulse' in s && s.pulse;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl relative overflow-hidden"
              style={{
                background: 'hsl(var(--card))',
                border: `1px solid ${pulse ? s.color + '40' : 'hsl(var(--border))'}`,
              }}
            >
              {pulse && (
                <span className="absolute top-2 right-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: s.color }} />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  </span>
                </span>
              )}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-extrabold text-foreground">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filter + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <Search className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>

        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: filter === f.value ? (f.color ? `${f.color}15` : 'hsl(38 90% 56% / 0.12)') : 'hsl(var(--card))',
                border: `1px solid ${filter === f.value ? (f.color ?? 'hsl(38 90% 56%)') + '50' : 'hsl(var(--border))'}`,
                color: filter === f.value ? (f.color ?? 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
              }}
            >
              {f.label} <span className="opacity-70">{f.count}</span>
            </button>
          ))}
          <button
            onClick={() => setSort(sort === 'stock' ? 'value' : sort === 'value' ? 'name' : 'stock')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sort === 'stock' ? 'Qté' : sort === 'value' ? 'Valeur' : 'Nom'}
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <span>Produit</span><span>Catégorie</span><span>Stock / Min</span><span>Niveau</span><span>Prix unitaire</span><span>Valeur stock</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <Package className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Aucun produit trouvé</p>
          </div>
        ) : (
          <div>
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] grid-cols-1 items-center gap-2 px-5 py-3.5 transition-colors hover:bg-muted/30"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    {p.supplierName && <span className="text-[11px] text-muted-foreground">{p.supplierName}</span>}
                  </div>
                  <StockBadge product={p} />
                </div>
                <span className="text-xs text-muted-foreground hidden md:block">{p.category}</span>
                <span className="text-xs font-semibold text-foreground hidden md:block">
                  {p.stock} <span className="text-muted-foreground font-normal">/ min {p.minStock}</span>
                </span>
                <div className="hidden md:block"><StockBar current={p.stock} min={p.minStock} /></div>
                <span className="text-xs font-semibold text-foreground hidden md:block">{formatXAF(p.price)}</span>
                <span className="text-xs font-bold text-foreground hidden md:block">{formatXAF(p.stock * p.price)}</span>

                <div className="md:hidden flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Qté : <span className="font-bold text-foreground">{p.stock}</span></span>
                    <span>·</span>
                    <span>Min : {p.minStock}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{formatXAF(p.price)}</span>
                </div>
                <div className="md:hidden"><StockBar current={p.stock} min={p.minStock} /></div>
                <div className="md:hidden flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Détails
                  </button>
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'hsl(0 72% 51% / 0.1)', color: '#EF4444' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Actions
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-5 space-y-4"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedProduct.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{selectedProduct.category}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-xs text-muted-foreground">Fermer</button>
              </div>
              <p className="text-xs text-muted-foreground">Les actions rapides restent sur la page produits pour édition complète.</p>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(38 90% 56%), hsl(38 90% 46%))', color: '#000' }}
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
