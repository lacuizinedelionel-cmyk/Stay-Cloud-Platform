import { useState } from 'react';
import {
  useListGroceryProducts,
  useListGrocerySuppliers,
  useCreateGroceryProduct,
  useUpdateGroceryProduct,
  useDeleteGroceryProduct,
  useAdjustGroceryProductStock,
  getListGroceryProductsQueryKey,
  getGetGroceryStatsQueryKey,
  GroceryProduct,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Package, AlertTriangle,
  TrendingDown, ChevronDown, X, Check, Minus, BarChart2,
  Tag, Barcode, ShoppingBag, Filter,
} from 'lucide-react';

/* ───── Types ─────────────────────────────────────────────────── */
type Category = 'ALL' | 'ALIMENTAIRE' | 'BOISSONS' | 'HYGIENE' | 'PRODUITS_FRAIS' | 'AUTRES';
type FilterStock = 'ALL' | 'LOW' | 'CRITICAL';

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'ALL', label: 'Tous', color: '#94A3B8' },
  { value: 'ALIMENTAIRE', label: 'Alimentaire', color: '#F59E0B' },
  { value: 'BOISSONS', label: 'Boissons', color: '#3B82F6' },
  { value: 'HYGIENE', label: 'Hygiène', color: '#8B5CF6' },
  { value: 'PRODUITS_FRAIS', label: 'Frais', color: '#10B981' },
  { value: 'AUTRES', label: 'Autres', color: '#6B7280' },
];

const CAT_ENUM = ['ALIMENTAIRE', 'BOISSONS', 'HYGIENE', 'PRODUITS_FRAIS', 'AUTRES'] as const;

/* ───── Helpers ───────────────────────────────────────────────── */
function stockColor(p: GroceryProduct) {
  if (p.stock === 0) return '#EF4444';
  if (p.stock <= p.minStock) return '#F59E0B';
  return '#10B981';
}
function stockLabel(p: GroceryProduct) {
  if (p.stock === 0) return 'Rupture';
  if (p.stock <= p.minStock) return 'Stock bas';
  return 'OK';
}
function margin(p: GroceryProduct) {
  if (!p.costPrice || p.price === 0) return null;
  return Math.round(((p.price - p.costPrice) / p.price) * 100);
}
function catInfo(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

/* ───── StockBar ──────────────────────────────────────────────── */
function StockBar({ current, min }: { current: number; min: number }) {
  const pct = min === 0 ? 100 : Math.min((current / Math.max(current, min * 3)) * 100, 100);
  const color = current === 0 ? '#EF4444' : current <= min ? '#F59E0B' : '#10B981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{current}</span>
    </div>
  );
}

/* ───── ProductCard ───────────────────────────────────────────── */
function ProductCard({
  product, onEdit, onDelete, onAdjust,
}: {
  product: GroceryProduct;
  onEdit: (p: GroceryProduct) => void;
  onDelete: (p: GroceryProduct) => void;
  onAdjust: (p: GroceryProduct) => void;
}) {
  const color = stockColor(product);
  const label = stockLabel(product);
  const mgn = margin(product);
  const ci = catInfo(product.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 p-4 rounded-2xl transition-colors hover:bg-muted/20 group"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{product.name}</p>
          {product.barcode && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Barcode className="w-3 h-3" /> {product.barcode}
            </p>
          )}
        </div>
        <span
          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {label}
        </span>
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${ci.color}15`, color: ci.color }}
        >
          {ci.label}
        </span>
        {mgn !== null && (
          <span className="text-[10px] text-muted-foreground">
            Marge <span className="font-bold" style={{ color: mgn >= 20 ? '#10B981' : mgn >= 10 ? '#F59E0B' : '#EF4444' }}>{mgn}%</span>
          </span>
        )}
      </div>

      {/* Stock bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Stock actuel</span>
          <span className="text-[10px] text-muted-foreground">Min : {product.minStock}</span>
        </div>
        <StockBar current={product.stock} min={product.minStock} />
      </div>

      {/* Prices */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div>
          <p className="text-[10px] text-muted-foreground">Prix vente</p>
          <p className="text-sm font-extrabold text-foreground">{formatXAF(product.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Prix achat</p>
          <p className="text-xs font-semibold text-muted-foreground">{formatXAF(product.costPrice)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAdjust(product)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}
        >
          <BarChart2 className="w-3 h-3" /> Ajuster
        </button>
        <button
          onClick={() => onEdit(product)}
          className="flex items-center justify-center w-8 h-7 rounded-xl transition-all"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(product)}
          className="flex items-center justify-center w-8 h-7 rounded-xl transition-all"
          style={{ background: 'hsl(0 72% 51% / 0.1)', color: '#EF4444' }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ───── ProductModal (Add / Edit) ─────────────────────────────── */
const EMPTY_FORM = {
  name: '', barcode: '', category: 'ALIMENTAIRE' as typeof CAT_ENUM[number],
  price: '', costPrice: '', stock: '0', minStock: '5', supplierId: '',
};

function ProductModal({
  product, businessId, suppliersData, onClose,
}: {
  product: GroceryProduct | null;
  businessId: number;
  suppliersData: { id: number; name: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const productsKey = getListGroceryProductsQueryKey({ businessId });
  const statsKey = getGetGroceryStatsQueryKey({ businessId });

  const [form, setForm] = useState(product ? {
    name: product.name,
    barcode: product.barcode ?? '',
    category: product.category as typeof CAT_ENUM[number],
    price: String(product.price),
    costPrice: String(product.costPrice),
    stock: String(product.stock),
    minStock: String(product.minStock),
    supplierId: product.supplierId ? String(product.supplierId) : '',
  } : EMPTY_FORM);

  const create = useCreateGroceryProduct({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: productsKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } } });
  const update = useUpdateGroceryProduct({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: productsKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } } });

  const isPending = create.isPending || update.isPending;

  function set(k: keyof typeof EMPTY_FORM, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      businessId,
      name: form.name,
      barcode: form.barcode || undefined,
      category: form.category,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice),
      stock: parseInt(form.stock, 10),
      minStock: parseInt(form.minStock, 10),
      supplierId: form.supplierId ? parseInt(form.supplierId, 10) : undefined,
    };
    if (product) {
      update.mutate({ id: product.id, data: payload });
    } else {
      create.mutate({ data: payload });
    }
  }

  const mgn = form.price && form.costPrice
    ? Math.round(((parseFloat(form.price) - parseFloat(form.costPrice)) / parseFloat(form.price)) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsl(38 90% 56% / 0.12)' }}>
              <Package className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {product ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nom du produit *</label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)}
              required
              placeholder="Ex : Riz importé 5kg"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-transparent outline-none transition-all"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Code-barres</label>
            <input
              value={form.barcode} onChange={e => set('barcode', e.target.value)}
              placeholder="Ex : 6009123456789"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground bg-transparent outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Catégorie *</label>
            <div className="mt-1 relative">
              <select
                value={form.category} onChange={e => set('category', e.target.value as typeof CAT_ENUM[number])}
                className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              >
                {CAT_ENUM.map(c => (
                  <option key={c} value={c}>{catInfo(c).label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prix de vente (XAF) *</label>
              <input
                type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                required placeholder="500"
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prix d&apos;achat (XAF) *</label>
              <input
                type="number" min="0" value={form.costPrice} onChange={e => set('costPrice', e.target.value)}
                required placeholder="350"
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
          </div>

          {mgn !== null && (
            <p className="text-xs text-muted-foreground">
              Marge : <span className="font-bold" style={{ color: mgn >= 20 ? '#10B981' : mgn >= 10 ? '#F59E0B' : '#EF4444' }}>{mgn}%</span>
              {mgn < 10 && ' — Marge très faible'}
            </p>
          )}

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stock initial *</label>
              <input
                type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)}
                required
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stock minimum *</label>
              <input
                type="number" min="0" value={form.minStock} onChange={e => set('minStock', e.target.value)}
                required
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
          </div>

          {/* Supplier */}
          {suppliersData.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fournisseur</label>
              <div className="mt-1 relative">
                <select
                  value={form.supplierId} onChange={e => set('supplierId', e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                >
                  <option value="">— Sans fournisseur —</option>
                  {suppliersData.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={isPending}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}
          >
            {isPending ? (
              <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {product ? 'Enregistrer les modifications' : 'Créer le produit'}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ───── StockAdjustModal ──────────────────────────────────────── */
const REASONS = ['Réception commande', 'Vente caisse', 'Correction inventaire', 'Perte / casse', 'Don / offert'];

function StockAdjustModal({ product, businessId, onClose }: { product: GroceryProduct; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const productsKey = getListGroceryProductsQueryKey({ businessId });
  const statsKey = getGetGroceryStatsQueryKey({ businessId });

  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const adjust = useAdjustGroceryProductStock({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: productsKey });
        qc.invalidateQueries({ queryKey: statsKey });
        onClose();
      },
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    adjust.mutate({ id: product.id, data: { delta: mode === 'add' ? delta : -delta } });
  }

  const newStock = Math.max(0, product.stock + (mode === 'add' ? delta : -delta));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Ajuster le stock</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Current stock */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--background))' }}>
            <span className="text-xs text-muted-foreground">Stock actuel</span>
            <span className="text-lg font-extrabold text-foreground">{product.stock}</span>
          </div>

          {/* Add / Remove toggle */}
          <div className="flex gap-2">
            {(['add', 'remove'] as const).map(m => (
              <button
                key={m} type="button" onClick={() => setMode(m)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: mode === m ? (m === 'add' ? 'hsl(160 84% 39% / 0.15)' : 'hsl(0 72% 51% / 0.12)') : 'hsl(var(--muted))',
                  color: mode === m ? (m === 'add' ? '#10B981' : '#EF4444') : 'hsl(var(--muted-foreground))',
                  border: `1px solid ${mode === m ? (m === 'add' ? '#10B98140' : '#EF444440') : 'transparent'}`,
                }}
              >
                {m === 'add' ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {m === 'add' ? 'Ajouter' : 'Retirer'}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quantité</label>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDelta(d => Math.max(1, d - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground transition-colors hover:bg-muted"
                style={{ border: '1px solid hsl(var(--border))' }}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number" min="1" value={delta}
                onChange={e => setDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-bold text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
              <button
                type="button"
                onClick={() => setDelta(d => d + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground transition-colors hover:bg-muted"
                style={{ border: '1px solid hsl(var(--border))' }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Motif</label>
            <div className="mt-1 relative">
              <select
                value={reason} onChange={e => setReason(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              >
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: `${mode === 'add' ? '#10B98115' : '#EF444415'}`, border: `1px solid ${mode === 'add' ? '#10B98130' : '#EF444430'}` }}
          >
            <span className="text-xs text-muted-foreground">Nouveau stock</span>
            <span className="text-lg font-extrabold" style={{ color: mode === 'add' ? '#10B981' : '#EF4444' }}>
              {newStock}
            </span>
          </div>

          <button
            type="submit" disabled={adjust.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}
          >
            {adjust.isPending ? (
              <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <><Check className="w-4 h-4" /> Confirmer</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ───── DeleteModal ───────────────────────────────────────────── */
function DeleteModal({ product, businessId, onClose }: { product: GroceryProduct; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const productsKey = getListGroceryProductsQueryKey({ businessId });
  const statsKey = getGetGroceryStatsQueryKey({ businessId });
  const del = useDeleteGroceryProduct({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: productsKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(0 72% 51% / 0.3)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(0 72% 51% / 0.12)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Supprimer le produit</h3>
            <p className="text-[11px] text-muted-foreground">{product.name}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Cette action est irréversible. Le produit sera définitivement supprimé du catalogue.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-muted" style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            Annuler
          </button>
          <button
            onClick={() => del.mutate({ id: product.id })} disabled={del.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
            style={{ background: '#EF4444', color: '#fff' }}
          >
            {del.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ───── Main Page ─────────────────────────────────────────────── */
export default function GroceryProductsPage() {
  const { business } = useAuth();
  const bId = business?.id ?? 0;

  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Category>('ALL');
  const [stockFilter, setStockFilter] = useState<FilterStock>('ALL');
  const [editProduct, setEditProduct] = useState<GroceryProduct | null | undefined>(undefined);
  const [adjustProduct, setAdjustProduct] = useState<GroceryProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<GroceryProduct | null>(null);

  const productsKey = getListGroceryProductsQueryKey({ businessId: bId });
  const { data: products, isLoading } = useListGroceryProducts(
    { businessId: bId },
    { query: { queryKey: productsKey, enabled: !!bId, refetchInterval: 60000 } },
  );

  const { data: suppliers } = useListGrocerySuppliers(
    { businessId: bId },
    { query: { queryKey: ['suppliers', bId], enabled: !!bId } },
  );

  const all = products ?? [];
  const criticalCount = all.filter(p => p.stock === 0).length;
  const lowCount = all.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = all.reduce((s, p) => s + p.stock * p.price, 0);
  const totalMarginValue = all.reduce((s, p) => s + p.stock * (p.price - p.costPrice), 0);

  const filtered = all.filter(p => {
    const okSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode ?? '').includes(search);
    const okCat = cat === 'ALL' || p.category === cat;
    const okStock = stockFilter === 'ALL' ? true : stockFilter === 'CRITICAL' ? p.stock === 0 : p.stock <= p.minStock;
    return okSearch && okCat && okStock;
  });

  const suppliersData = (suppliers ?? []).map(s => ({ id: s.id, name: s.name }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>Catalogue produits</h1>
          <p className="text-xs text-muted-foreground mt-1">{all.length} produit{all.length !== 1 ? 's' : ''} · Inventaire en temps réel</p>
        </div>
        <button
          onClick={() => setEditProduct(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}
        >
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {(criticalCount > 0 || lowCount > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
            style={{ background: 'hsl(0 72% 51% / 0.08)', border: '1px solid hsl(0 72% 51% / 0.25)' }}
            onClick={() => setStockFilter(criticalCount > 0 ? 'CRITICAL' : 'LOW')}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
            <p className="text-xs font-semibold text-foreground flex-1">
              {criticalCount > 0 && <span style={{ color: '#EF4444' }}>{criticalCount} rupture(s) de stock</span>}
              {criticalCount > 0 && lowCount > 0 && ' · '}
              {lowCount > 0 && <span style={{ color: '#F59E0B' }}>{lowCount} produit(s) en stock bas</span>}
              <span className="text-muted-foreground font-normal"> — Cliquez pour filtrer</span>
            </p>
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total produits', value: String(all.length), icon: Package, color: '#3B82F6' },
          { label: 'Ruptures', value: String(criticalCount), icon: TrendingDown, color: '#EF4444' },
          { label: 'Valeur stock', value: formatXAF(totalValue), icon: ShoppingBag, color: '#10B981' },
          { label: 'Marge potentielle', value: formatXAF(totalMarginValue), icon: Tag, color: 'hsl(38 90% 56%)' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                <p className="text-sm font-extrabold text-foreground truncate">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => {
          const count = c.value === 'ALL' ? all.length : all.filter(p => p.category === c.value).length;
          const active = cat === c.value;
          return (
            <button
              key={c.value} onClick={() => setCat(c.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active ? `${c.color}15` : 'hsl(var(--card))',
                border: `1px solid ${active ? c.color + '50' : 'hsl(var(--border))'}`,
                color: active ? c.color : 'hsl(var(--muted-foreground))',
              }}
            >
              {c.label}
              <span className="opacity-70 text-[10px]">{count}</span>
            </button>
          );
        })}

        {/* Stock filter */}
        <div className="ml-auto flex gap-2">
          {(['ALL', 'LOW', 'CRITICAL'] as FilterStock[]).map(f => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: stockFilter === f ? (f === 'CRITICAL' ? '#EF444415' : f === 'LOW' ? '#F59E0B15' : 'hsl(38 90% 56% / 0.12)') : 'hsl(var(--card))',
                border: `1px solid ${stockFilter === f ? (f === 'CRITICAL' ? '#EF444440' : f === 'LOW' ? '#F59E0B40' : 'hsl(38 90% 56% / 0.4)') : 'hsl(var(--border))'}`,
                color: stockFilter === f ? (f === 'CRITICAL' ? '#EF4444' : f === 'LOW' ? '#F59E0B' : 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
              }}
            >
              {f === 'ALL' ? 'Tous' : f === 'LOW' ? 'Stock bas' : 'Rupture'}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou code-barres…"
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <Package className="w-8 h-8 text-muted-foreground/30" strokeWidth={1} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun produit trouvé</p>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs font-semibold" style={{ color: 'hsl(38 90% 56%)' }}>
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={setEditProduct}
                onDelete={setDeleteProduct}
                onAdjust={setAdjustProduct}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editProduct !== undefined && (
          <ProductModal
            product={editProduct}
            businessId={bId}
            suppliersData={suppliersData}
            onClose={() => setEditProduct(undefined)}
          />
        )}
        {adjustProduct && (
          <StockAdjustModal
            product={adjustProduct}
            businessId={bId}
            onClose={() => setAdjustProduct(null)}
          />
        )}
        {deleteProduct && (
          <DeleteModal
            product={deleteProduct}
            businessId={bId}
            onClose={() => setDeleteProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
