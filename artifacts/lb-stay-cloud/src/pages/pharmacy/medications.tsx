import { useState } from 'react';
import {
  useListMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  useAdjustMedicationStock,
  getListMedicationsQueryKey,
  getGetPharmacyStatsQueryKey,
  Medication,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Pill, AlertTriangle, AlertOctagon,
  X, Check, Minus, ChevronDown, Clock, ShieldCheck, ShieldOff,
  Package, TrendingDown, Filter,
} from 'lucide-react';

/* ──────────────────────────────────────────────── demo data */
const DEMO_MEDICATIONS: Medication[] = [
  // Antidouleurs / Antipyrétiques
  { id: 1,  businessId: 0, name: 'Paracétamol 500mg',        dci: 'Paracétamol',         dosage: '500mg',    form: 'Comprimé',    price: 1800,  stock: 0,   minStock: 20, expirationDate: '2026-12-31', requiresPrescription: false, supplierId: null }, // RUPTURE
  { id: 2,  businessId: 0, name: 'Doliprane 1000mg',         dci: 'Paracétamol',         dosage: '1000mg',   form: 'Comprimé',    price: 2500,  stock: 48,  minStock: 15, expirationDate: '2026-09-30', requiresPrescription: false, supplierId: null },
  { id: 3,  businessId: 0, name: 'Ibuprofène 400mg',         dci: 'Ibuprofène',           dosage: '400mg',    form: 'Gélule',      price: 2200,  stock: 36,  minStock: 10, expirationDate: '2027-03-15', requiresPrescription: false, supplierId: null },
  { id: 4,  businessId: 0, name: 'Aspirine 500mg',           dci: 'Acide acétylsalicylique', dosage: '500mg', form: 'Comprimé',    price: 1200,  stock: 60,  minStock: 15, expirationDate: '2027-06-30', requiresPrescription: false, supplierId: null },
  // Antibiotiques
  { id: 5,  businessId: 0, name: 'Amoxicilline 500mg',       dci: 'Amoxicilline',         dosage: '500mg',    form: 'Gélule',      price: 4500,  stock: 0,   minStock: 12, expirationDate: '2026-08-20', requiresPrescription: true,  supplierId: null }, // RUPTURE
  { id: 6,  businessId: 0, name: 'Clamoxyl 1g',              dci: 'Amoxicilline',         dosage: '1g',       form: 'Comprimé',    price: 6500,  stock: 20,  minStock: 8,  expirationDate: '2026-11-15', requiresPrescription: true,  supplierId: null },
  { id: 7,  businessId: 0, name: 'Ciprofloxacine 500mg',     dci: 'Ciprofloxacine',       dosage: '500mg',    form: 'Comprimé',    price: 5500,  stock: 18,  minStock: 6,  expirationDate: '2027-01-31', requiresPrescription: true,  supplierId: null },
  // Vitamines & Suppléments
  { id: 8,  businessId: 0, name: 'Vitamines C 1000mg',       dci: 'Acide ascorbique',     dosage: '1000mg',   form: 'Comprimé',    price: 3000,  stock: 80,  minStock: 20, expirationDate: '2027-05-31', requiresPrescription: false, supplierId: null },
  { id: 9,  businessId: 0, name: 'Zinc 15mg',                dci: 'Zinc',                 dosage: '15mg',     form: 'Comprimé',    price: 2800,  stock: 55,  minStock: 12, expirationDate: '2027-08-31', requiresPrescription: false, supplierId: null },
  { id: 10, businessId: 0, name: 'Fer + Acide folique',      dci: 'Fer / Folate',         dosage: '60mg',     form: 'Comprimé',    price: 2200,  stock: 42,  minStock: 10, expirationDate: '2026-12-31', requiresPrescription: false, supplierId: null },
  // Antipaludéens
  { id: 11, businessId: 0, name: 'Coartem 80/480mg',         dci: 'Artémétherluméfantrine', dosage: '80/480mg', form: 'Comprimé',  price: 8500,  stock: 25,  minStock: 10, expirationDate: '2026-10-31', requiresPrescription: true,  supplierId: null },
  { id: 12, businessId: 0, name: 'Quinine 500mg',            dci: 'Quinine',              dosage: '500mg',    form: 'Comprimé',    price: 1800,  stock: 38,  minStock: 10, expirationDate: '2027-02-28', requiresPrescription: true,  supplierId: null },
  // Matériel médical
  { id: 13, businessId: 0, name: 'Gants latex stériles ×10', dci: null,                   dosage: null,       form: 'Autre',       price: 2500,  stock: 40,  minStock: 10, expirationDate: '2028-01-01', requiresPrescription: false, supplierId: null },
  { id: 14, businessId: 0, name: 'Seringues 5ml ×10',        dci: null,                   dosage: null,       form: 'Autre',       price: 3200,  stock: 0,   minStock: 10, expirationDate: '2028-06-01', requiresPrescription: false, supplierId: null }, // RUPTURE
  // Sirops
  { id: 15, businessId: 0, name: 'Pédiatric Fever Sirop',    dci: 'Paracétamol',         dosage: '120mg/5ml', form: 'Sirop',      price: 3500,  stock: 22,  minStock: 8,  expirationDate: '2026-07-31', requiresPrescription: false, supplierId: null },
  { id: 16, businessId: 0, name: 'Ambroxol Sirop 30mg',      dci: 'Ambroxol',            dosage: '30mg/5ml', form: 'Sirop',       price: 4200,  stock: 14,  minStock: 6,  expirationDate: '2026-09-30', requiresPrescription: false, supplierId: null },
  { id: 17, businessId: 0, name: 'Cétirizine 10mg',          dci: 'Cétirizine',           dosage: '10mg',     form: 'Comprimé',    price: 2800,  stock: 30,  minStock: 8,  expirationDate: '2027-04-30', requiresPrescription: false, supplierId: null },
  { id: 18, businessId: 0, name: 'Métronidazole 250mg',      dci: 'Métronidazole',        dosage: '250mg',    form: 'Comprimé',    price: 1500,  stock: 50,  minStock: 12, expirationDate: '2027-03-31', requiresPrescription: true,  supplierId: null },
  { id: 19, businessId: 0, name: 'Oméprazole 20mg',          dci: 'Oméprazole',           dosage: '20mg',     form: 'Gélule',      price: 3000,  stock: 35,  minStock: 10, expirationDate: '2027-01-31', requiresPrescription: true,  supplierId: null },
  { id: 20, businessId: 0, name: 'Pansements adhésifs ×20',  dci: null,                   dosage: null,       form: 'Autre',       price: 1500,  stock: 60,  minStock: 15, expirationDate: '2028-12-31', requiresPrescription: false, supplierId: null },
];

/* ──────────────────────────────────────────────── helpers */
type StockFilter = 'ALL' | 'LOW' | 'CRITICAL';
type ExpFilter = 'ALL' | 'EXPIRING' | 'EXPIRED';

const FORMS = ['Comprimé', 'Gélule', 'Sirop', 'Injectable', 'Pommade', 'Sachet', 'Suppositoire', 'Autre'];

function daysUntilExpiry(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function expiryColor(days: number) {
  if (days < 0) return '#EF4444';
  if (days <= 30) return '#F59E0B';
  return '#10B981';
}

function stockColor(m: Medication) {
  if (m.stock === 0) return '#EF4444';
  if (m.stock <= m.minStock) return '#F59E0B';
  return '#10B981';
}

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

/* ──────────────────────────────────────────────── MedCard */
function MedCard({ med, onEdit, onDelete, onAdjust }: {
  med: Medication;
  onEdit: (m: Medication) => void;
  onDelete: (m: Medication) => void;
  onAdjust: (m: Medication) => void;
}) {
  const days = daysUntilExpiry(med.expirationDate);
  const expColor = expiryColor(days);
  const sColor = stockColor(med);

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 p-4 rounded-2xl hover:bg-muted/20 group transition-colors"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{med.name}</p>
          {med.dci && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{med.dci}</p>}
        </div>
        {med.requiresPrescription ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630' }}>
            <ShieldCheck className="w-3 h-3" /> Ordonnance
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            <ShieldOff className="w-3 h-3" /> Libre
          </span>
        )}
      </div>

      {/* Dosage + Form */}
      {(med.dosage || med.form) && (
        <div className="flex gap-2 flex-wrap">
          {med.dosage && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F472B615', color: '#F472B6' }}>{med.dosage}</span>
          )}
          {med.form && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{med.form}</span>
          )}
        </div>
      )}

      {/* Stock */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Stock</span>
          <span className="text-[10px] text-muted-foreground">Min : {med.minStock}</span>
        </div>
        <StockBar current={med.stock} min={med.minStock} />
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 shrink-0" style={{ color: expColor }} />
        <span className="text-[11px] font-semibold" style={{ color: expColor }}>
          {days < 0
            ? `Expiré depuis ${Math.abs(days)} j`
            : days === 0
            ? "Expire aujourd'hui"
            : `Expire dans ${days} j — ${new Date(med.expirationDate).toLocaleDateString('fr-FR')}`}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div>
          <p className="text-[10px] text-muted-foreground">Prix unitaire</p>
          <p className="text-sm font-extrabold text-foreground">{formatXAF(med.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Valeur stock</p>
          <p className="text-xs font-semibold" style={{ color: sColor }}>{formatXAF(med.stock * med.price)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAdjust(med)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}
        >
          <Package className="w-3 h-3" /> Stock
        </button>
        <button
          onClick={() => onEdit(med)}
          className="flex items-center justify-center w-8 h-7 rounded-xl transition-all hover:bg-muted"
          style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(med)}
          className="flex items-center justify-center w-8 h-7 rounded-xl"
          style={{ background: 'hsl(0 72% 51% / 0.1)', color: '#EF4444' }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────── MedModal */
const EMPTY: Record<string, string | boolean> = {
  name: '', dci: '', dosage: '', form: 'Comprimé', price: '', stock: '0', minStock: '10',
  expirationDate: '', requiresPrescription: false,
};

function MedModal({ med, businessId, onClose }: { med: Medication | null; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const medsKey = getListMedicationsQueryKey({ businessId });
  const statsKey = getGetPharmacyStatsQueryKey({ businessId });
  const invalidate = () => { qc.invalidateQueries({ queryKey: medsKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); };

  const create = useCreateMedication({ mutation: { onSuccess: invalidate } });
  const update = useUpdateMedication({ mutation: { onSuccess: invalidate } });

  const [form, setForm] = useState<Record<string, string | boolean>>(med ? {
    name: med.name,
    dci: med.dci ?? '',
    dosage: med.dosage ?? '',
    form: med.form ?? 'Comprimé',
    price: String(med.price),
    stock: String(med.stock),
    minStock: String(med.minStock),
    expirationDate: med.expirationDate,
    requiresPrescription: med.requiresPrescription,
  } : EMPTY);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const isPending = create.isPending || update.isPending;

  const daysPreview = form.expirationDate ? daysUntilExpiry(form.expirationDate as string) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      businessId,
      name: form.name as string,
      dci: (form.dci as string) || undefined,
      dosage: (form.dosage as string) || undefined,
      form: (form.form as string) || undefined,
      price: parseFloat(form.price as string),
      stock: parseInt(form.stock as string, 10),
      minStock: parseInt(form.minStock as string, 10),
      expirationDate: form.expirationDate as string,
      requiresPrescription: form.requiresPrescription as boolean,
    };
    if (med) update.mutate({ id: med.id, data: payload });
    else create.mutate({ data: payload });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F472B615' }}>
              <Pill className="w-4 h-4" style={{ color: '#F472B6' }} />
            </div>
            <h2 className="text-base font-bold text-foreground">{med ? 'Modifier le médicament' : 'Nouveau médicament'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nom commercial *</label>
            <input value={form.name as string} onChange={e => set('name', e.target.value)} required
              placeholder="Ex : Paracétamol 500mg" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* DCI */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">DCI (Dénomination commune)</label>
            <input value={form.dci as string} onChange={e => set('dci', e.target.value)}
              placeholder="Ex : Paracétamol" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Dosage + Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dosage</label>
              <input value={form.dosage as string} onChange={e => set('dosage', e.target.value)}
                placeholder="Ex : 500mg" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Forme galénique</label>
              <div className="mt-1 relative">
                <select value={form.form as string} onChange={e => set('form', e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
                  {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prix de vente (XAF) *</label>
            <input type="number" min="0" value={form.price as string} onChange={e => set('price', e.target.value)} required
              placeholder="500" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Stock + MinStock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stock initial *</label>
              <input type="number" min="0" value={form.stock as string} onChange={e => set('stock', e.target.value)} required
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stock minimum *</label>
              <input type="number" min="0" value={form.minStock as string} onChange={e => set('minStock', e.target.value)} required
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date de péremption *</label>
            <input type="date" value={form.expirationDate as string} onChange={e => set('expirationDate', e.target.value)} required
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            {daysPreview !== null && (
              <p className="mt-1 text-xs" style={{ color: expiryColor(daysPreview) }}>
                {daysPreview < 0 ? `Déjà expiré (${Math.abs(daysPreview)} j)` : `Expire dans ${daysPreview} jours`}
              </p>
            )}
          </div>

          {/* Requires Prescription */}
          <button
            type="button"
            onClick={() => set('requiresPrescription', !form.requiresPrescription)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
            style={{
              background: form.requiresPrescription ? '#3B82F615' : 'hsl(var(--muted))',
              border: `1px solid ${form.requiresPrescription ? '#3B82F640' : 'transparent'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" style={{ color: form.requiresPrescription ? '#3B82F6' : 'hsl(var(--muted-foreground))' }} />
              <span className="text-sm font-semibold" style={{ color: form.requiresPrescription ? '#3B82F6' : 'hsl(var(--muted-foreground))' }}>
                Médicament sur ordonnance
              </span>
            </div>
            <div className="w-10 h-5 rounded-full transition-all relative" style={{ background: form.requiresPrescription ? '#3B82F6' : 'hsl(var(--border))' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.requiresPrescription ? '22px' : '2px' }} />
            </div>
          </button>

          <button type="submit" disabled={isPending}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
            {isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <><Check className="w-4 h-4" />{med ? 'Enregistrer' : 'Ajouter le médicament'}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── StockAdjustModal */
const REASONS_MED = ['Réception livraison', 'Vente comptoir', 'Délivrance ordonnance', 'Perte / périmé', 'Inventaire correction'];

function StockAdjustModal({ med, businessId, onClose }: { med: Medication; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const medsKey = getListMedicationsQueryKey({ businessId });
  const statsKey = getGetPharmacyStatsQueryKey({ businessId });
  const adjust = useAdjustMedicationStock({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: medsKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } },
  });

  const [delta, setDelta] = useState(1);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [reason, setReason] = useState(REASONS_MED[0]);

  const newStock = Math.max(0, med.stock + (mode === 'add' ? delta : -delta));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Ajuster le stock</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[220px]">{med.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--background))' }}>
            <span className="text-xs text-muted-foreground">Stock actuel</span>
            <span className="text-lg font-extrabold text-foreground">{med.stock}</span>
          </div>
          <div className="flex gap-2">
            {(['add', 'remove'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: mode === m ? (m === 'add' ? '#10B98115' : '#EF444415') : 'hsl(var(--muted))',
                  color: mode === m ? (m === 'add' ? '#10B981' : '#EF4444') : 'hsl(var(--muted-foreground))',
                  border: `1px solid ${mode === m ? (m === 'add' ? '#10B98140' : '#EF444440') : 'transparent'}`,
                }}>
                {m === 'add' ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {m === 'add' ? 'Ajouter' : 'Retirer'}
              </button>
            ))}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quantité</label>
            <div className="mt-1 flex items-center gap-3">
              <button type="button" onClick={() => setDelta(d => Math.max(1, d - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                style={{ border: '1px solid hsl(var(--border))' }}>
                <Minus className="w-3.5 h-3.5 text-foreground" />
              </button>
              <input type="number" min="1" value={delta}
                onChange={e => setDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-bold text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
              <button type="button" onClick={() => setDelta(d => d + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                style={{ border: '1px solid hsl(var(--border))' }}>
                <Plus className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Motif</label>
            <div className="mt-1 relative">
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
                {REASONS_MED.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: `${mode === 'add' ? '#10B98115' : '#EF444415'}`, border: `1px solid ${mode === 'add' ? '#10B98130' : '#EF444430'}` }}>
            <span className="text-xs text-muted-foreground">Nouveau stock</span>
            <span className="text-lg font-extrabold" style={{ color: mode === 'add' ? '#10B981' : '#EF4444' }}>{newStock}</span>
          </div>
          <button
            onClick={() => adjust.mutate({ id: med.id, data: { delta: mode === 'add' ? delta : -delta } })}
            disabled={adjust.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
            {adjust.isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <><Check className="w-4 h-4" /> Confirmer</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── DeleteModal */
function DeleteModal({ med, businessId, onClose }: { med: Medication; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const medsKey = getListMedicationsQueryKey({ businessId });
  const statsKey = getGetPharmacyStatsQueryKey({ businessId });
  const del = useDeleteMedication({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: medsKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'hsl(var(--card))', border: '1px solid #EF444430' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EF444412' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Supprimer le médicament</h3>
            <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{med.name}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Cette action est irréversible. Le médicament sera définitivement supprimé.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:bg-muted transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>Annuler</button>
          <button onClick={() => del.mutate({ id: med.id })} disabled={del.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
            style={{ background: '#EF4444', color: '#fff' }}>
            {del.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── Main Page */
export default function PharmacyMedicationsPage() {
  const { business } = useAuth();
  const bId = business?.id ?? 0;

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [expFilter, setExpFilter] = useState<ExpFilter>('ALL');
  const [editMed, setEditMed] = useState<Medication | null | undefined>(undefined);
  const [adjustMed, setAdjustMed] = useState<Medication | null>(null);
  const [deleteMed, setDeleteMed] = useState<Medication | null>(null);

  const medsKey = getListMedicationsQueryKey({ businessId: bId });
  const { data: medications, isLoading } = useListMedications(
    { businessId: bId },
    { query: { queryKey: medsKey, enabled: !!bId, refetchInterval: 60000 } },
  );

  const all = (medications && medications.length > 0) ? medications : DEMO_MEDICATIONS;
  const criticalCount = all.filter(m => m.stock === 0).length;
  const lowCount = all.filter(m => m.stock > 0 && m.stock <= m.minStock).length;
  const expiringCount = all.filter(m => { const d = daysUntilExpiry(m.expirationDate); return d >= 0 && d <= 30; }).length;
  const expiredCount = all.filter(m => daysUntilExpiry(m.expirationDate) < 0).length;
  const totalStockValue = all.reduce((s, m) => s + m.stock * m.price, 0);
  const rxCount = all.filter(m => m.requiresPrescription).length;

  const filtered = all.filter(m => {
    const okSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || (m.dci ?? '').toLowerCase().includes(search.toLowerCase());
    const okStock = stockFilter === 'ALL' ? true : stockFilter === 'CRITICAL' ? m.stock === 0 : m.stock <= m.minStock;
    const days = daysUntilExpiry(m.expirationDate);
    const okExp = expFilter === 'ALL' ? true : expFilter === 'EXPIRED' ? days < 0 : (days >= 0 && days <= 30);
    return okSearch && okStock && okExp;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>Catalogue médicaments</h1>
          <p className="text-xs text-muted-foreground mt-1">{all.length} médicament{all.length !== 1 ? 's' : ''} · {rxCount} sur ordonnance</p>
        </div>
        <button onClick={() => setEditMed(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nouveau médicament
        </button>
      </div>

      {/* Alert banners */}
      <AnimatePresence>
        {(criticalCount > 0 || lowCount > 0 || expiredCount > 0) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2">
            {(criticalCount > 0 || lowCount > 0) && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                style={{ background: 'hsl(0 72% 51% / 0.08)', border: '1px solid hsl(0 72% 51% / 0.25)' }}
                onClick={() => setStockFilter(criticalCount > 0 ? 'CRITICAL' : 'LOW')}>
                <TrendingDown className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
                <p className="text-xs font-semibold flex-1">
                  {criticalCount > 0 && <span style={{ color: '#EF4444' }}>{criticalCount} rupture(s)</span>}
                  {criticalCount > 0 && lowCount > 0 && ' · '}
                  {lowCount > 0 && <span style={{ color: '#F59E0B' }}>{lowCount} stock bas</span>}
                  <span className="text-muted-foreground font-normal"> — Cliquez pour filtrer</span>
                </p>
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
            {(expiredCount > 0 || expiringCount > 0) && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                style={{ background: 'hsl(38 90% 56% / 0.08)', border: '1px solid hsl(38 90% 56% / 0.25)' }}
                onClick={() => setExpFilter(expiredCount > 0 ? 'EXPIRED' : 'EXPIRING')}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
                <p className="text-xs font-semibold flex-1">
                  {expiredCount > 0 && <span style={{ color: '#EF4444' }}>{expiredCount} médicament(s) expiré(s)</span>}
                  {expiredCount > 0 && expiringCount > 0 && ' · '}
                  {expiringCount > 0 && <span style={{ color: '#F59E0B' }}>{expiringCount} expirant dans 30 j</span>}
                  <span className="text-muted-foreground font-normal"> — Cliquez pour filtrer</span>
                </p>
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total médicaments', value: String(all.length), icon: Pill, color: '#F472B6' },
          { label: 'Ruptures critiques', value: String(criticalCount), icon: TrendingDown, color: '#EF4444' },
          { label: 'Expirant (30j)', value: String(expiringCount + expiredCount), icon: AlertOctagon, color: '#F59E0B' },
          { label: 'Valeur stock', value: formatXAF(totalStockValue), icon: Package, color: '#10B981' },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Stock filters */}
        {(['ALL', 'LOW', 'CRITICAL'] as StockFilter[]).map(f => (
          <button key={f} onClick={() => setStockFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: stockFilter === f ? (f === 'CRITICAL' ? '#EF444415' : f === 'LOW' ? '#F59E0B15' : 'hsl(38 90% 56% / 0.12)') : 'hsl(var(--card))',
              border: `1px solid ${stockFilter === f ? (f === 'CRITICAL' ? '#EF444440' : f === 'LOW' ? '#F59E0B40' : 'hsl(38 90% 56% / 0.4)') : 'hsl(var(--border))'}`,
              color: stockFilter === f ? (f === 'CRITICAL' ? '#EF4444' : f === 'LOW' ? '#F59E0B' : 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
            }}>
            {f === 'ALL' ? 'Tous' : f === 'LOW' ? 'Stock bas' : 'Rupture'}
          </button>
        ))}
        <div className="w-px h-5 mx-1" style={{ background: 'hsl(var(--border))' }} />
        {/* Expiry filters */}
        {(['ALL', 'EXPIRING', 'EXPIRED'] as ExpFilter[]).map(f => (
          <button key={f} onClick={() => setExpFilter(f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: expFilter === f ? (f === 'EXPIRED' ? '#EF444415' : f === 'EXPIRING' ? '#F59E0B15' : 'hsl(38 90% 56% / 0.12)') : 'hsl(var(--card))',
              border: `1px solid ${expFilter === f ? (f === 'EXPIRED' ? '#EF444440' : f === 'EXPIRING' ? '#F59E0B40' : 'hsl(38 90% 56% / 0.4)') : 'hsl(var(--border))'}`,
              color: expFilter === f ? (f === 'EXPIRED' ? '#EF4444' : f === 'EXPIRING' ? '#F59E0B' : 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
            }}>
            <Clock className="w-3 h-3" />
            {f === 'ALL' ? 'Toutes dates' : f === 'EXPIRING' ? 'Expirant bientôt' : 'Expirés'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou DCI…"
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
        {search && (
          <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" /></button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <Pill className="w-8 h-8 text-muted-foreground/30" strokeWidth={1} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun médicament trouvé</p>
          {search && <button onClick={() => setSearch('')} className="text-xs font-semibold" style={{ color: 'hsl(38 90% 56%)' }}>Effacer la recherche</button>}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(m => (
              <MedCard key={m.id} med={m} onEdit={setEditMed} onDelete={setDeleteMed} onAdjust={setAdjustMed} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editMed !== undefined && <MedModal med={editMed} businessId={bId} onClose={() => setEditMed(undefined)} />}
        {adjustMed && <StockAdjustModal med={adjustMed} businessId={bId} onClose={() => setAdjustMed(null)} />}
        {deleteMed && <DeleteModal med={deleteMed} businessId={bId} onClose={() => setDeleteMed(null)} />}
      </AnimatePresence>
    </div>
  );
}
