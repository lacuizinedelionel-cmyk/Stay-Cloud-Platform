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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const bId = business?.id ?? 0;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'CRITICAL'>('ALL');
  const [sort, setSort] = useState<'name' | 'stock' | 'value'>('stock');
  const [isExporting, setIsExporting] = useState(false);

  const productsKey = getListGroceryProductsQueryKey({ businessId: bId });
  const statsKey = getGetGroceryStatsQueryKey({ businessId: bId });

  const { data: products, isLoading } = useListGroceryProducts(
    { businessId: bId },
    { query: { queryKey: productsKey, enabled: !!bId, refetchInterval: 30000 } },
  );
  const { data: stats } = useGetGroceryStats(
    { businessId: bId },
    { query: { queryKey: statsKey, enabled: !!bId } },
  );

  const filtered = (products ?? [])
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

  const criticalCount = (products ?? []).filter(p => p.stock === 0).length;
  const lowCount = (products ?? []).filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = (products ?? []).reduce((s, p) => s + p.stock * p.price, 0);

  const FILTERS = [
    { value: 'ALL' as const, label: 'Tous', count: products?.length ?? 0, color: undefined },
    { value: 'LOW' as const, label: 'Stock bas', count: lowCount, color: '#F59E0B' },
    { value: 'CRITICAL' as const, label: 'Rupture', count: criticalCount, color: '#EF4444' },
  ];

  const handleExportPDF = async () => {
    if (!products || products.length === 0) return;
    setIsExporting(true);
    try {
      await generateStockReportPDF(business?.name ?? 'Épicerie', products);
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
          disabled={isExporting || !products || products.length === 0}
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
          { label: 'Total produits', value: products?.length ?? '—', icon: Package, color: '#3B82F6' },
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
