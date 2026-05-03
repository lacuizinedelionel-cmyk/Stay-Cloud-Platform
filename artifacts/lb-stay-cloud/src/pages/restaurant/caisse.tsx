import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { DashboardHero } from '@/components/dashboard-hero';
import { useToast } from '@/hooks/use-toast';
import { formatXAF } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Banknote, Smartphone, ShoppingBag, RefreshCw,
  Lock, CheckCircle2, X, History, Download, FileText,
  ChevronDown, Clock, AlertTriangle, RotateCcw, Pencil,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DEMO_CAISSE_ORDERS: CaisseOrder[] = [
  { id: 1, clientName: 'Paul', tableNumber: 'T01', paymentMethod: 'CASH', total: 18500, status: 'COMPLETED', createdAt: '2026-05-03T18:42:00.000Z', items: [{ productName: 'Ndolé', quantity: 1, unitPrice: 8500, subtotal: 8500 }, { productName: 'Soya', quantity: 2, unitPrice: 5000, subtotal: 10000 }] },
  { id: 2, clientName: 'Syntia', tableNumber: 'T03', paymentMethod: 'MTN_MOMO', total: 24500, status: 'COMPLETED', createdAt: '2026-05-03T18:35:00.000Z', items: [{ productName: 'Poisson braisé', quantity: 1, unitPrice: 16000, subtotal: 16000 }, { productName: 'Bissap', quantity: 3, unitPrice: 2833, subtotal: 8500 }] },
  { id: 3, clientName: 'David', tableNumber: 'T02', paymentMethod: 'ORANGE_MONEY', total: 12000, status: 'COMPLETED', createdAt: '2026-05-03T18:28:00.000Z', items: [{ productName: 'Soya', quantity: 2, unitPrice: 4000, subtotal: 8000 }, { productName: 'Jus de gingembre', quantity: 2, unitPrice: 2000, subtotal: 4000 }] },
  { id: 4, clientName: 'Mado', tableNumber: 'T05', paymentMethod: 'CASH', total: 32000, status: 'COMPLETED', createdAt: '2026-05-03T18:22:00.000Z', items: [{ productName: 'Ndolé', quantity: 2, unitPrice: 8500, subtotal: 17000 }, { productName: 'Poulet DG', quantity: 1, unitPrice: 15000, subtotal: 15000 }] },
  { id: 5, clientName: 'Patrice', tableNumber: 'T06', paymentMethod: 'MTN_MOMO', total: 14500, status: 'COMPLETED', createdAt: '2026-05-03T18:16:00.000Z', items: [{ productName: 'Poisson', quantity: 1, unitPrice: 12000, subtotal: 12000 }, { productName: 'Eau minérale', quantity: 1, unitPrice: 2500, subtotal: 2500 }] },
  { id: 6, clientName: 'Aïcha', tableNumber: 'T08', paymentMethod: 'ORANGE_MONEY', total: 22500, status: 'COMPLETED', createdAt: '2026-05-03T18:10:00.000Z', items: [{ productName: 'Poulet DG', quantity: 1, unitPrice: 16500, subtotal: 16500 }, { productName: 'Bissap', quantity: 3, unitPrice: 2000, subtotal: 6000 }] },
  { id: 7, clientName: 'Blaise', tableNumber: 'T04', paymentMethod: 'CASH', total: 17500, status: 'COMPLETED', createdAt: '2026-05-03T18:04:00.000Z', items: [{ productName: 'Soya', quantity: 3, unitPrice: 4500, subtotal: 13500 }, { productName: 'Frites', quantity: 1, unitPrice: 4000, subtotal: 4000 }] },
  { id: 8, clientName: 'Nadine', tableNumber: 'T10', paymentMethod: 'MTN_MOMO', total: 28000, status: 'COMPLETED', createdAt: '2026-05-03T17:58:00.000Z', items: [{ productName: 'Poisson braisé', quantity: 1, unitPrice: 18000, subtotal: 18000 }, { productName: 'Plantain', quantity: 2, unitPrice: 5000, subtotal: 10000 }] },
  { id: 9, clientName: 'Junior', tableNumber: 'T11', paymentMethod: 'ORANGE_MONEY', total: 19500, status: 'COMPLETED', createdAt: '2026-05-03T17:52:00.000Z', items: [{ productName: 'Ndolé', quantity: 1, unitPrice: 9000, subtotal: 9000 }, { productName: 'Soya', quantity: 2, unitPrice: 5250, subtotal: 10500 }] },
  { id: 10, clientName: 'Paul', tableNumber: 'T12', paymentMethod: 'CASH', total: 26500, status: 'COMPLETED', createdAt: '2026-05-03T17:45:00.000Z', items: [{ productName: 'Poulet DG', quantity: 1, unitPrice: 16000, subtotal: 16000 }, { productName: 'Jus de gingembre', quantity: 3, unitPrice: 3500, subtotal: 10500 }] },
  { id: 11, clientName: 'Syntia', tableNumber: 'T13', paymentMethod: 'MTN_MOMO', total: 13250, status: 'COMPLETED', createdAt: '2026-05-03T17:39:00.000Z', items: [{ productName: 'Poisson', quantity: 1, unitPrice: 12000, subtotal: 12000 }, { productName: 'Eau minérale', quantity: 1, unitPrice: 1250, subtotal: 1250 }] },
  { id: 12, clientName: 'Dieudonné', tableNumber: 'T14', paymentMethod: 'ORANGE_MONEY', total: 31000, status: 'COMPLETED', createdAt: '2026-05-03T17:33:00.000Z', items: [{ productName: 'Ndolé', quantity: 2, unitPrice: 8500, subtotal: 17000 }, { productName: 'Poulet DG', quantity: 1, unitPrice: 14000, subtotal: 14000 }] },
  { id: 13, clientName: 'Aminata', tableNumber: 'T15', paymentMethod: 'CASH', total: 14800, status: 'COMPLETED', createdAt: '2026-05-03T17:27:00.000Z', items: [{ productName: 'Soya', quantity: 2, unitPrice: 5000, subtotal: 10000 }, { productName: 'Bissap', quantity: 2, unitPrice: 2400, subtotal: 4800 }] },
  { id: 14, clientName: 'Hugo', tableNumber: 'T16', paymentMethod: 'MTN_MOMO', total: 22700, status: 'COMPLETED', createdAt: '2026-05-03T17:21:00.000Z', items: [{ productName: 'Poisson braisé', quantity: 1, unitPrice: 17500, subtotal: 17500 }, { productName: 'Plantain', quantity: 1, unitPrice: 5200, subtotal: 5200 }] },
  { id: 15, clientName: 'Fanny', tableNumber: 'T17', paymentMethod: 'ORANGE_MONEY', total: 19000, status: 'COMPLETED', createdAt: '2026-05-03T17:15:00.000Z', items: [{ productName: 'Ndolé', quantity: 1, unitPrice: 9500, subtotal: 9500 }, { productName: 'Jus de gingembre', quantity: 1, unitPrice: 3000, subtotal: 3000 }, { productName: 'Soya', quantity: 1, unitPrice: 6500, subtotal: 6500 }] },
  { id: 16, clientName: 'Koffi', tableNumber: 'T18', paymentMethod: 'CASH', total: 35500, status: 'COMPLETED', createdAt: '2026-05-03T17:09:00.000Z', items: [{ productName: 'Poulet DG', quantity: 2, unitPrice: 15000, subtotal: 30000 }, { productName: 'Bissap', quantity: 2, unitPrice: 2750, subtotal: 5500 }] },
  { id: 17, clientName: 'Mireille', tableNumber: 'T19', paymentMethod: 'MTN_MOMO', total: 16200, status: 'COMPLETED', createdAt: '2026-05-03T17:03:00.000Z', items: [{ productName: 'Poisson', quantity: 1, unitPrice: 13000, subtotal: 13000 }, { productName: 'Eau minérale', quantity: 1, unitPrice: 3200, subtotal: 3200 }] },
  { id: 18, clientName: 'Jonas', tableNumber: 'T20', paymentMethod: 'ORANGE_MONEY', total: 27100, status: 'COMPLETED', createdAt: '2026-05-03T16:57:00.000Z', items: [{ productName: 'Ndolé', quantity: 2, unitPrice: 8200, subtotal: 16400 }, { productName: 'Soya', quantity: 2, unitPrice: 5350, subtotal: 10700 }] },
  { id: 19, clientName: 'Paul', tableNumber: 'T21', paymentMethod: 'CASH', total: 21600, status: 'COMPLETED', createdAt: '2026-05-03T16:52:00.000Z', items: [{ productName: 'Poisson braisé', quantity: 1, unitPrice: 18000, subtotal: 18000 }, { productName: 'Bissap', quantity: 2, unitPrice: 1800, subtotal: 3600 }] },
  { id: 20, clientName: 'Syntia', tableNumber: 'T22', paymentMethod: 'MTN_MOMO', total: 18400, status: 'COMPLETED', createdAt: '2026-05-03T16:47:00.000Z', items: [{ productName: 'Poulet DG', quantity: 1, unitPrice: 15000, subtotal: 15000 }, { productName: 'Jus de gingembre', quantity: 1, unitPrice: 3400, subtotal: 3400 }] },
  { id: 21, clientName: 'Serge', tableNumber: 'T23', paymentMethod: 'ORANGE_MONEY', total: 29400, status: 'COMPLETED', createdAt: '2026-05-03T16:41:00.000Z', items: [{ productName: 'Ndolé', quantity: 1, unitPrice: 9200, subtotal: 9200 }, { productName: 'Poisson braisé', quantity: 1, unitPrice: 20200, subtotal: 20200 }] },
  { id: 22, clientName: 'Hortense', tableNumber: 'T24', paymentMethod: 'CASH', total: 15800, status: 'COMPLETED', createdAt: '2026-05-03T16:36:00.000Z', items: [{ productName: 'Soya', quantity: 2, unitPrice: 5000, subtotal: 10000 }, { productName: 'Eau minérale', quantity: 2, unitPrice: 2900, subtotal: 5800 }] },
  { id: 23, clientName: 'Germain', tableNumber: 'T25', paymentMethod: 'MTN_MOMO', total: 20100, status: 'COMPLETED', createdAt: '2026-05-03T16:30:00.000Z', items: [{ productName: 'Ndolé', quantity: 1, unitPrice: 9000, subtotal: 9000 }, { productName: 'Poulet DG', quantity: 1, unitPrice: 11100, subtotal: 11100 }] },
  { id: 24, clientName: 'Monique', tableNumber: 'T26', paymentMethod: 'ORANGE_MONEY', total: 14500, status: 'COMPLETED', createdAt: '2026-05-03T16:24:00.000Z', items: [{ productName: 'Poisson', quantity: 1, unitPrice: 12000, subtotal: 12000 }, { productName: 'Bissap', quantity: 1, unitPrice: 2500, subtotal: 2500 }] },
  { id: 25, clientName: 'Ablam', tableNumber: 'T27', paymentMethod: 'CASH', total: 33200, status: 'COMPLETED', createdAt: '2026-05-03T16:18:00.000Z', items: [{ productName: 'Poulet DG', quantity: 2, unitPrice: 14500, subtotal: 29000 }, { productName: 'Jus de gingembre', quantity: 1, unitPrice: 4200, subtotal: 4200 }] },
  { id: 26, clientName: 'Célestine', tableNumber: 'T28', paymentMethod: 'MTN_MOMO', total: 9700, status: 'CANCELLED', createdAt: '2026-05-03T16:12:00.000Z', items: [{ productName: 'Soya', quantity: 1, unitPrice: 4700, subtotal: 4700 }, { productName: 'Eau minérale', quantity: 2, unitPrice: 2500, subtotal: 5000 }] },
  { id: 27, clientName: 'Bruno', tableNumber: 'T29', paymentMethod: 'ORANGE_MONEY', total: 21800, status: 'CANCELLED', createdAt: '2026-05-03T16:07:00.000Z', items: [{ productName: 'Ndolé', quantity: 1, unitPrice: 9800, subtotal: 9800 }, { productName: 'Poisson braisé', quantity: 1, unitPrice: 12000, subtotal: 12000 }] },
  { id: 28, clientName: 'Sylvie', tableNumber: 'T30', paymentMethod: 'CASH', total: 17600, status: 'CANCELLED', createdAt: '2026-05-03T16:02:00.000Z', items: [{ productName: 'Poulet DG', quantity: 1, unitPrice: 9800, subtotal: 9800 }, { productName: 'Bissap', quantity: 4, unitPrice: 1950, subtotal: 7800 }] },
  { id: 29, clientName: 'Grace', tableNumber: 'T31', paymentMethod: 'MTN_MOMO', total: 0, status: 'FREE', createdAt: '2026-05-03T15:58:00.000Z', items: [] },
  { id: 30, clientName: 'Atangana', tableNumber: 'T32', paymentMethod: 'ORANGE_MONEY', total: 0, status: 'FREE', createdAt: '2026-05-03T15:54:00.000Z', items: [] },
];

const DEMO_SUPERMARKET_SALES: CaisseOrder[] = Array.from({ length: 50 }, (_, index) => {
  const ticket = 9001 + index;
  const servers = ['Paul', 'Syntia', 'Mado', 'Blaise', 'Aïcha'];
  const tables = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08'];
  const products = [
    { name: 'Riz 5kg', base: 8500 },
    { name: 'Huile 1L', base: 2200 },
    { name: 'Savon', base: 750 },
    { name: 'Paracétamol', base: 1200 },
    { name: 'Vitamine C', base: 2800 },
    { name: 'Pansements', base: 1600 },
  ];
  const methodCycle = ['CASH', 'CASH', 'CASH', 'CASH', 'MTN_MOMO', 'MTN_MOMO', 'MTN_MOMO', 'ORANGE_MONEY', 'ORANGE_MONEY', 'ORANGE_MONEY'];
  const status = index < 46 ? 'COMPLETED' : index < 49 ? 'CANCELLED' : 'FREE';
  const main = products[index % products.length];
  const extra = products[(index + 2) % products.length];
  const qty1 = (index % 3) + 1;
  const qty2 = index % 2 === 0 ? 1 : 2;
  const total = main.base * qty1 + extra.base * qty2 + 300 * ((index % 4) + 1);
  return {
    id: ticket,
    clientName: `Client ${ticket}`,
    tableNumber: tables[index % tables.length],
    paymentMethod: methodCycle[index % methodCycle.length],
    total: status === 'FREE' ? 0 : total,
    status,
    createdAt: new Date(Date.now() - index * 11 * 60000).toISOString(),
    items: status === 'FREE' ? [] : [
      { productName: main.name, quantity: qty1, unitPrice: main.base, subtotal: main.base * qty1 },
      { productName: extra.name, quantity: qty2, unitPrice: extra.base, subtotal: extra.base * qty2 },
    ],
  };
});

/* ── Types ── */
interface CaisseOrder {
  id: number; clientName: string | null; tableNumber: string | null;
  paymentMethod: string | null; total: number; status: string; createdAt: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number; subtotal: number }>;
}

interface CaisseSummary {
  totalCash: number; totalMoMo: number; totalOrangeMoney: number;
  totalOther: number; totalAmount: number; orderCount: number;
}

interface CaisseDay {
  date: string;
  orders: CaisseOrder[];
  summary: CaisseSummary;
  isClosed: boolean;
  closedEntry: CaisseJournalEntry | null;
}

interface CaisseJournalEntry {
  id: number; businessId: number; date: string;
  totalCash: number; totalMoMo: number; totalOrangeMoney: number;
  totalOther: number; totalAmount: number; orderCount: number;
  note: string | null; closedAt: string;
}

/* ── Helpers ── */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const METHOD_CFG: Record<string, { label: string; icon: typeof Banknote; color: string; bg: string }> = {
  CASH:         { label: 'Espèces',      icon: Banknote,    color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)' },
  MTN_MOMO:     { label: 'MTN MoMo',     icon: Smartphone,  color: '#F59E0B', bg: 'hsl(38 92% 50% / 0.12)'  },
  ORANGE_MONEY: { label: 'Orange Money', icon: Smartphone,  color: '#F97316', bg: 'hsl(25 95% 53% / 0.12)'  },
  OTHER:        { label: 'Autre',        icon: ShoppingBag, color: '#6B7280', bg: 'hsl(220 9% 46% / 0.12)'  },
};

/* ── Modal clôture ── */
function ClotureModal({ onConfirm, onClose, isPending }: {
  onConfirm: (note: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [note, setNote] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsl(38 90% 56% / 0.12)' }}>
              <Lock className="w-4.5 h-4.5" style={{ color: 'hsl(38 90% 56%)' }} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Clôturer la caisse</h3>
              <p className="text-[11px] text-muted-foreground">Cette action est définitive</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: 'hsl(38 90% 56% / 0.07)', border: '1px solid hsl(38 90% 56% / 0.2)' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(38 90% 56%)' }} />
            <p className="text-xs text-muted-foreground">
              La clôture enregistre définitivement le bilan du jour. Vous pouvez rouvrir la caisse depuis l&apos;historique si nécessaire.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Note de clôture (optionnel)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Ex : Fermeture normale, incident caisse…"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none resize-none transition-all"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              onFocus={e => (e.target.style.borderColor = 'hsl(38 90% 56% / 0.6)')}
              onBlur={e => (e.target.style.borderColor = 'hsl(var(--border))')}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Annuler
            </button>
            <button
              onClick={() => onConfirm(note)}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Clôturer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, icon: Icon, color, bg, pct }: {
  label: string; value: number; icon: typeof Banknote;
  color: string; bg: string; pct?: number;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        {pct !== undefined && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: bg, color }}>
            {pct.toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
        {formatXAF(value)}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════ */
export default function CaissePage() {
  const { business } = useAuth();
  const queryClient  = useQueryClient();
  const { toast }    = useToast();
  const bId = business?.id ?? 0;

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCloture, setShowCloture]   = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  /* ── Queries ── */
  const caisseKey = ['caisse', bId, selectedDate];
  const historyKey = ['caisse-history', bId];

  const { data: caisse, isLoading } = useQuery<CaisseDay>({
    queryKey: caisseKey,
    queryFn: async () => {
      const r = await fetch(`/api/restaurant/caisse?businessId=${bId}&date=${selectedDate}`);
      return r.json();
    },
    enabled: !!bId,
    refetchInterval: 30_000,
  });

  const { data: history } = useQuery<CaisseJournalEntry[]>({
    queryKey: historyKey,
    queryFn: async () => {
      const r = await fetch(`/api/restaurant/caisse/history?businessId=${bId}`);
      return r.json();
    },
    enabled: !!bId,
  });

  /* ── Mutations ── */
  const { mutate: cloture, isPending: isClosing } = useMutation({
    mutationFn: async (note: string) => {
      const r = await fetch('/api/restaurant/caisse/cloture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bId, date: selectedDate, note: note || undefined }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caisseKey });
      queryClient.invalidateQueries({ queryKey: historyKey });
      setShowCloture(false);
      toast({ title: '✅ Caisse clôturée', description: `Bilan du ${fmtDateShort(selectedDate)} enregistré` });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const { mutate: reopen } = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/restaurant/caisse/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caisseKey });
      queryClient.invalidateQueries({ queryKey: historyKey });
      toast({ title: '🔓 Caisse réouverte', description: 'Vous pouvez modifier les données' });
    },
  });

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = history ?? [];
    const header = 'Date,Espèces,MTN MoMo,Orange Money,Autre,Total,Commandes,Note,Clôturée à';
    const lines = rows.map(e =>
      `${e.date},${e.totalCash},${e.totalMoMo},${e.totalOrangeMoney},${e.totalOther},${e.totalAmount},${e.orderCount},"${e.note ?? ''}",${fmtTime(e.closedAt)}`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `journal-caisse-${bId}-${today}.csv`;
    a.click();
  };

  const s = caisse?.summary;
  const isClosed = caisse?.isClosed ?? false;

  /* ── Payment method breakdown ── */
  const breakdown = useMemo(() => {
    if (!s) return [];
    const total = s.totalAmount || 1;
    return [
      { key: 'CASH',         value: s.totalCash,         pct: (s.totalCash / total) * 100,         ...METHOD_CFG.CASH         },
      { key: 'MTN_MOMO',     value: s.totalMoMo,         pct: (s.totalMoMo / total) * 100,         ...METHOD_CFG.MTN_MOMO     },
      { key: 'ORANGE_MONEY', value: s.totalOrangeMoney,  pct: (s.totalOrangeMoney / total) * 100,  ...METHOD_CFG.ORANGE_MONEY },
      { key: 'OTHER',        value: s.totalOther,        pct: (s.totalOther / total) * 100,         ...METHOD_CFG.OTHER        },
    ].filter(b => b.value > 0);
  }, [s]);

  return (
    <div className="p-6 md:p-8 space-y-6 relative page-enter">
      <DashboardHero
        title="Journal de Caisse"
        subtitle={`Bilan financier · ${fmtDate(selectedDate)}`}
        gradient="linear-gradient(135deg,#D97706,#F59E0B)"
        color="#FCD34D"
        bg="rgba(245,166,35,0.08)"
        icon={Wallet}
        badge={isClosed ? 'CLÔTURÉ' : 'EN COURS'}
        stats={[
          { label: 'commandes', value: String(s?.orderCount ?? 0) },
          { label: 'CA du jour', value: s ? new Intl.NumberFormat('fr-FR').format(s.totalAmount) + ' FCFA' : '—' },
          { label: 'moy/commande', value: s?.orderCount ? new Intl.NumberFormat('fr-FR').format(Math.round(s.totalAmount / s.orderCount)) + ' F' : '—' },
        ]}
      />

      {/* ── Sélecteur date + onglets ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5">
          {[
            { id: 'today' as const,   label: 'Aujourd\'hui' },
            { id: 'history' as const, label: 'Historique'   },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'hsl(38 90% 56% / 0.15)' : 'hsl(var(--muted))',
                color: activeTab === tab.id ? 'hsl(38 90% 56%)' : 'hsl(var(--muted-foreground))',
                border: `1px solid ${activeTab === tab.id ? 'hsl(38 90% 56% / 0.35)' : 'transparent'}`,
              }}
            >
              {tab.id === 'today' ? <Wallet className="w-3 h-3" /> : <History className="w-3 h-3" />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'today' && (
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs text-foreground outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
            />
          )}
          {activeTab === 'history' && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'hsl(38 90% 56% / 0.4)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'}
            >
              <Download className="w-3.5 h-3.5" />
              Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* ══════════════ ONGLET AUJOURD'HUI ══════════════ */}
      {activeTab === 'today' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* Statut clôture */}
              {isClosed && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'hsl(160 84% 39% / 0.08)', border: '1px solid hsl(160 84% 39% / 0.25)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} strokeWidth={2} />
                    <div>
                      <p className="text-sm font-bold text-foreground">Caisse clôturée</p>
                      <p className="text-xs text-muted-foreground">
                        Le {fmtDate(selectedDate)} à {fmtTime(caisse?.closedEntry?.closedAt ?? new Date().toISOString())}
                        {caisse?.closedEntry?.note && ` · ${caisse.closedEntry.note}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => caisse?.closedEntry && reopen(caisse.closedEntry.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Réouvrir
                  </button>
                </motion.div>
              )}

              {/* KPI ventilation par mode de paiement */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {breakdown.length === 0 ? (
                  <div className="col-span-4 flex flex-col items-center justify-center py-12 gap-2">
                    <FileText className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground">Aucune transaction ce jour</p>
                  </div>
                ) : (
                  breakdown.map(b => (
                    <KpiCard key={b.key} label={b.label} value={b.value} icon={b.icon} color={b.color} bg={b.bg} pct={b.pct} />
                  ))
                )}
              </div>

              {/* Total du jour */}
              {(s?.totalAmount ?? 0) > 0 && (
                <div className="rounded-xl p-5 flex items-center justify-between"
                  style={{ background: 'hsl(38 90% 56% / 0.07)', border: '1px solid hsl(38 90% 56% / 0.2)' }}>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total encaissé</p>
                    <p className="text-3xl font-extrabold mt-1" style={{ color: 'hsl(38 90% 56%)', letterSpacing: '-0.04em' }}>
                      {formatXAF(s!.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{s!.orderCount} commande{s!.orderCount !== 1 ? 's' : ''} · moy. {formatXAF(s!.orderCount ? Math.round(s!.totalAmount / s!.orderCount) : 0)}</p>
                  </div>
                  {!isClosed && (
                    <button
                      onClick={() => setShowCloture(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
                    >
                      <Lock className="w-4 h-4" />
                      Clôturer la caisse
                    </button>
                  )}
                </div>
              )}

              {/* Liste des transactions */}
              {caisse && caisse.orders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Transactions du jour ({caisse.orders.length})
                    </p>
                  </div>
                  <AnimatePresence initial={false}>
                    {caisse.orders.map(order => {
                      const pm = METHOD_CFG[order.paymentMethod ?? 'OTHER'] ?? METHOD_CFG.OTHER;
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="rounded-xl overflow-hidden cursor-pointer transition-all"
                          style={{ background: 'hsl(var(--card))', border: `1px solid ${isExpanded ? pm.color + '40' : 'hsl(var(--border))'}` }}
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: pm.bg }}>
                              <pm.icon className="w-4 h-4" style={{ color: pm.color }} strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {order.clientName ?? 'Client anonyme'}
                                {order.tableNumber && <span className="text-muted-foreground font-normal"> · Table {order.tableNumber}</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fmtTime(order.createdAt)} · <span style={{ color: pm.color }} className="font-semibold">{pm.label}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-foreground">{formatXAF(order.total)}</p>
                              <p className="text-[10px] text-muted-foreground">{(order.items as any[]).length} article{(order.items as any[]).length > 1 ? 's' : ''}</p>
                            </div>
                            <ChevronDown
                              className="w-4 h-4 text-muted-foreground shrink-0 transition-transform"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                            />
                          </div>

                          {/* Détail articles */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ borderTop: '1px solid hsl(var(--border))' }}
                              >
                                <div className="px-4 py-3 space-y-1.5">
                                  {(order.items as any[]).map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        {item.quantity}× {item.productName}
                                      </span>
                                      <span className="font-semibold text-foreground">{formatXAF(item.subtotal)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-xs font-bold pt-1.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                                    <span className="text-foreground">Total</span>
                                    <span style={{ color: 'hsl(38 90% 56%)' }}>{formatXAF(order.total)}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Aucune transaction */}
              {caisse && caisse.orders.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Wallet className="w-12 h-12 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">Aucune transaction pour cette journée</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════ ONGLET HISTORIQUE ══════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {(!history || history.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <History className="w-12 h-12 text-muted-foreground/20" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">Aucune clôture dans l&apos;historique</p>
            </div>
          ) : (
            <>
              {/* Tableau récap */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                {/* Header */}
                <div className="grid grid-cols-6 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                  <span>Date</span>
                  <span className="text-right" style={{ color: METHOD_CFG.CASH.color }}>Espèces</span>
                  <span className="text-right" style={{ color: METHOD_CFG.MTN_MOMO.color }}>MoMo</span>
                  <span className="text-right" style={{ color: METHOD_CFG.ORANGE_MONEY.color }}>Orange</span>
                  <span className="text-right text-foreground">Total</span>
                  <span className="text-right">Cmds</span>
                </div>

                {history.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-6 px-4 py-3 text-xs items-center transition-all"
                    style={{
                      borderBottom: i < history.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted) / 0.3)',
                    }}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{fmtDateShort(entry.closedAt)}</p>
                      {entry.note && <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{entry.note}</p>}
                    </div>
                    <span className="text-right font-medium" style={{ color: METHOD_CFG.CASH.color }}>
                      {entry.totalCash > 0 ? new Intl.NumberFormat('fr-FR').format(entry.totalCash) : '—'}
                    </span>
                    <span className="text-right font-medium" style={{ color: METHOD_CFG.MTN_MOMO.color }}>
                      {entry.totalMoMo > 0 ? new Intl.NumberFormat('fr-FR').format(entry.totalMoMo) : '—'}
                    </span>
                    <span className="text-right font-medium" style={{ color: METHOD_CFG.ORANGE_MONEY.color }}>
                      {entry.totalOrangeMoney > 0 ? new Intl.NumberFormat('fr-FR').format(entry.totalOrangeMoney) : '—'}
                    </span>
                    <span className="text-right font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>
                      {new Intl.NumberFormat('fr-FR').format(entry.totalAmount)}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-right text-muted-foreground">{entry.orderCount}</span>
                      <button
                        onClick={() => reopen(entry.id)}
                        title="Réouvrir cette clôture"
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux globaux */}
              {history.length > 1 && (() => {
                const totals = history.reduce((acc, e) => ({
                  cash: acc.cash + e.totalCash,
                  momo: acc.momo + e.totalMoMo,
                  orange: acc.orange + e.totalOrangeMoney,
                  amount: acc.amount + e.totalAmount,
                  orders: acc.orders + e.orderCount,
                }), { cash: 0, momo: 0, orange: 0, amount: 0, orders: 0 });
                return (
                  <div className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: 'hsl(38 90% 56% / 0.07)', border: '1px solid hsl(38 90% 56% / 0.2)' }}>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Cumul ({history.length} jours · {totals.orders} commandes)
                      </p>
                      <p className="text-2xl font-extrabold mt-0.5" style={{ color: 'hsl(38 90% 56%)', letterSpacing: '-0.04em' }}>
                        {formatXAF(totals.amount)}
                      </p>
                    </div>
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
                    >
                      <Download className="w-4 h-4" />
                      Exporter
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Modal clôture */}
      <AnimatePresence>
        {showCloture && (
          <ClotureModal
            key="cloture-modal"
            onConfirm={(note) => cloture(note)}
            onClose={() => setShowCloture(false)}
            isPending={isClosing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
