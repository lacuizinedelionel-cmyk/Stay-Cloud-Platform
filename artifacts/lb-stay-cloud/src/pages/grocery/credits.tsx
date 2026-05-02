import { useState, useMemo } from 'react';
import {
  useListCustomerCredits,
  useCreateCustomerCredit,
  useUpdateCustomerCredit,
  useDeleteCustomerCredit,
  useGetCreditsStats,
  useAddCreditTransaction,
  useListCreditTransactions,
  getListCustomerCreditsQueryKey,
  getGetCreditsStatsQueryKey,
  CustomerCredit,
  CreditTransaction,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Check, Wallet, AlertTriangle,
  TrendingUp, Users, Phone, ChevronDown, Trash2,
  ClipboardList, ShoppingCart, CreditCard, Edit2,
  ArrowDownCircle, ArrowUpCircle, Clock, Shield,
} from 'lucide-react';

/* ───── Status config ─────────────────────────────────────────── */
type Status = 'ACTIVE' | 'WARNED' | 'BLOCKED' | 'SETTLED';
const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ACTIVE:  { label: 'Actif',    color: '#10B981', bg: '#10B98115', icon: Check },
  WARNED:  { label: 'Alerte',   color: '#F59E0B', bg: '#F59E0B15', icon: AlertTriangle },
  BLOCKED: { label: 'Bloqué',   color: '#EF4444', bg: '#EF444415', icon: Shield },
  SETTLED: { label: 'Soldé',    color: '#94A3B8', bg: '#94A3B815', icon: Check },
};

const FILTER_TABS: { value: 'ALL' | Status; label: string }[] = [
  { value: 'ALL',     label: 'Tous' },
  { value: 'ACTIVE',  label: 'Actifs' },
  { value: 'WARNED',  label: 'En alerte' },
  { value: 'BLOCKED', label: 'Bloqués' },
  { value: 'SETTLED', label: 'Soldés' },
];

/* ───── Helpers ────────────────────────────────────────────────── */
function debtPct(debt: number, limit: number) {
  if (limit === 0) return 100;
  return Math.min((debt / limit) * 100, 100);
}
function debtColor(debt: number, limit: number): string {
  const pct = debtPct(debt, limit);
  if (pct >= 100) return '#EF4444';
  if (pct >= 80)  return '#F59E0B';
  return '#10B981';
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

/* ───── DebtBar ────────────────────────────────────────────────── */
function DebtBar({ debt, limit }: { debt: number; limit: number }) {
  const pct = debtPct(debt, limit);
  const color = debtColor(debt, limit);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">Dette</span>
        <span className="font-bold" style={{ color }}>{pct.toFixed(0)}% du plafond</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ───── ClientCard ─────────────────────────────────────────────── */
function ClientCard({
  credit,
  onTransaction,
  onEdit,
  onDelete,
}: {
  credit: CustomerCredit;
  onTransaction: (c: CustomerCredit, type: 'DEBIT' | 'PAYMENT') => void;
  onEdit: (c: CustomerCredit) => void;
  onDelete: (c: CustomerCredit) => void;
}) {
  const st = STATUS_CFG[credit.status as Status] ?? STATUS_CFG.ACTIVE;
  const StIcon = st.icon;
  const color = debtColor(credit.totalDebt, credit.creditLimit);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 p-4 rounded-2xl group transition-colors"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{credit.clientName}</p>
          {credit.clientPhone && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Phone className="w-3 h-3" /> {credit.clientPhone}
            </p>
          )}
        </div>
        <span
          className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}
        >
          <StIcon className="w-2.5 h-2.5" />
          {st.label}
        </span>
      </div>

      {/* Debt bar */}
      <DebtBar debt={credit.totalDebt} limit={credit.creditLimit} />

      {/* Amounts */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div>
          <p className="text-[10px] text-muted-foreground">Dette actuelle</p>
          <p className="text-sm font-extrabold" style={{ color }}>{formatXAF(credit.totalDebt)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Plafond</p>
          <p className="text-xs font-semibold text-muted-foreground">{formatXAF(credit.creditLimit)}</p>
        </div>
      </div>

      {/* Last purchase */}
      {credit.lastPurchaseDate && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Dernier achat : {fmtDate(credit.lastPurchaseDate)}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onTransaction(credit, 'DEBIT')}
          disabled={credit.status === 'BLOCKED' || credit.status === 'SETTLED'}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#EF444415', color: '#EF4444' }}
        >
          <ArrowDownCircle className="w-3 h-3" /> Achat
        </button>
        <button
          onClick={() => onTransaction(credit, 'PAYMENT')}
          disabled={credit.totalDebt === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#10B98115', color: '#10B981' }}
        >
          <ArrowUpCircle className="w-3 h-3" /> Paiement
        </button>
        <button
          onClick={() => onEdit(credit)}
          className="w-8 h-7 flex items-center justify-center rounded-xl transition-all opacity-0 group-hover:opacity-100"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(credit)}
          className="w-8 h-7 flex items-center justify-center rounded-xl transition-all opacity-0 group-hover:opacity-100"
          style={{ background: '#EF444415', color: '#EF4444' }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ───── StatCard ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-lg font-extrabold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/* ───── NewClientModal ─────────────────────────────────────────── */
const EMPTY_CLIENT = { clientName: '', clientPhone: '', creditLimit: '50000', notes: '' };

function NewClientModal({
  businessId, onClose, editCredit,
}: {
  businessId: number;
  onClose: () => void;
  editCredit: CustomerCredit | null;
}) {
  const qc = useQueryClient();
  const creditsKey = getListCustomerCreditsQueryKey({ businessId });
  const statsKey   = getGetCreditsStatsQueryKey({ businessId });

  const [form, setForm] = useState(editCredit ? {
    clientName:  editCredit.clientName,
    clientPhone: editCredit.clientPhone ?? '',
    creditLimit: String(editCredit.creditLimit),
    notes:       editCredit.notes ?? '',
  } : EMPTY_CLIENT);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: creditsKey });
    qc.invalidateQueries({ queryKey: statsKey });
    onClose();
  };

  const create = useCreateCustomerCredit({ mutation: { onSuccess: invalidate } });
  const update = useUpdateCustomerCredit({ mutation: { onSuccess: invalidate } });
  const isPending = create.isPending || update.isPending;

  function set(k: keyof typeof EMPTY_CLIENT, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      businessId,
      clientName:  form.clientName,
      clientPhone: form.clientPhone || undefined,
      creditLimit: parseFloat(form.creditLimit) || 50000,
      notes:       form.notes || undefined,
    };
    if (editCredit) {
      update.mutate({ id: editCredit.id, data: payload });
    } else {
      create.mutate({ data: payload });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsl(38 90% 56% / 0.12)' }}>
              <Wallet className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {editCredit ? 'Modifier le compte ardoise' : 'Ouvrir une ardoise'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nom du client *</label>
            <input
              value={form.clientName} onChange={e => set('clientName', e.target.value)}
              required placeholder="Ex : Jean Fotso"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</label>
            <input
              value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
              placeholder="Ex : 699 001 122"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plafond de crédit (XAF)</label>
            <input
              type="number" min="0" step="500"
              value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
            />
            <p className="text-[10px] text-muted-foreground mt-1">Le crédit sera bloqué au-delà de ce montant</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Informations complémentaires..."
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none resize-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
            />
          </div>
          <button
            type="submit" disabled={isPending}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}
          >
            {isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <><Check className="w-4 h-4" /> {editCredit ? 'Enregistrer' : 'Ouvrir l\'ardoise'}</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ───── TransactionModal ───────────────────────────────────────── */
function TransactionModal({
  credit,
  businessId,
  initialType,
  onClose,
}: {
  credit: CustomerCredit;
  businessId: number;
  initialType: 'DEBIT' | 'PAYMENT';
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const creditsKey = getListCustomerCreditsQueryKey({ businessId });
  const statsKey   = getGetCreditsStatsQueryKey({ businessId });

  const [type, setType] = useState<'DEBIT' | 'PAYMENT'>(initialType);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const txQuery = useListCreditTransactions(credit.id);
  const txs = (txQuery.data ?? []) as CreditTransaction[];

  const addTx = useAddCreditTransaction({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: creditsKey });
        qc.invalidateQueries({ queryKey: statsKey });
        txQuery.refetch();
        setAmount('');
        setDesc('');
      },
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addTx.mutate({
      id: credit.id,
      data: { type, amount: amt, description: desc || undefined, businessId },
    });
  }

  const st = STATUS_CFG[credit.status as Status] ?? STATUS_CFG.ACTIVE;

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
          <div>
            <h2 className="text-base font-bold text-foreground">{credit.clientName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Dette : <span className="font-bold text-foreground">{formatXAF(credit.totalDebt)}</span>
                {' / '}{formatXAF(credit.creditLimit)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['DEBIT', 'PAYMENT'] as const).map(t => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: type === t ? (t === 'DEBIT' ? '#EF444415' : '#10B98115') : 'hsl(var(--muted))',
                  color: type === t ? (t === 'DEBIT' ? '#EF4444' : '#10B981') : 'hsl(var(--muted-foreground))',
                  border: `1px solid ${type === t ? (t === 'DEBIT' ? '#EF444440' : '#10B98140') : 'transparent'}`,
                }}
              >
                {t === 'DEBIT'
                  ? <><ArrowDownCircle className="w-3.5 h-3.5" /> Enregistrer un achat</>
                  : <><ArrowUpCircle className="w-3.5 h-3.5" /> Encaisser un paiement</>
                }
              </button>
            ))}
          </div>

          {/* Transaction form */}
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Montant (XAF) *
              </label>
              <input
                type="number" min="1" step="50" value={amount}
                onChange={e => setAmount(e.target.value)}
                required placeholder="Ex : 5000"
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <input
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={type === 'DEBIT' ? 'Ex : Courses du soir' : 'Ex : Versement espèces'}
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
            <button
              type="submit" disabled={addTx.isPending}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: type === 'DEBIT' ? '#EF4444' : '#10B981',
                color: '#fff',
              }}
            >
              {addTx.isPending
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><Check className="w-4 h-4" /> {type === 'DEBIT' ? 'Enregistrer l\'achat' : 'Enregistrer le paiement'}</>
              }
            </button>
          </form>

          {/* Transaction history */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Historique</p>
            </div>
            {txQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : txs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune transaction enregistrée</p>
            ) : (
              <div className="space-y-2">
                {txs.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: tx.type === 'DEBIT' ? '#EF444415' : '#10B98115' }}
                    >
                      {tx.type === 'DEBIT'
                        ? <ArrowDownCircle className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                        : <ArrowUpCircle className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {tx.description ?? (tx.type === 'DEBIT' ? 'Achat' : 'Paiement')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(tx.createdAt)}</p>
                    </div>
                    <span
                      className="text-xs font-extrabold shrink-0"
                      style={{ color: tx.type === 'DEBIT' ? '#EF4444' : '#10B981' }}
                    >
                      {tx.type === 'DEBIT' ? '+' : '-'}{formatXAF(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───── Page principale ────────────────────────────────────────── */
export default function GroceryCreditsPage() {
  const { business } = useAuth();
  const businessId = business?.id ?? 0;

  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<'ALL' | Status>('ALL');
  const [showNew, setShowNew]     = useState(false);
  const [editCredit, setEdit]     = useState<CustomerCredit | null>(null);
  const [txTarget, setTxTarget]   = useState<{ credit: CustomerCredit; type: 'DEBIT' | 'PAYMENT' } | null>(null);

  const qc = useQueryClient();
  const creditsKey = getListCustomerCreditsQueryKey({ businessId });
  const statsKey   = getGetCreditsStatsQueryKey({ businessId });

  const { data: creditsRaw = [], isLoading } = useListCustomerCredits({ businessId });
  const credits = creditsRaw as CustomerCredit[];
  const { data: statsRaw } = useGetCreditsStats({ businessId });
  const stats = statsRaw as { totalDebt: number; activeCount: number; warnedCount: number; blockedCount: number; settledCount: number; totalClients: number } | undefined;

  const deleteCredit = useDeleteCustomerCredit({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: creditsKey });
        qc.invalidateQueries({ queryKey: statsKey });
      },
    },
  });

  /* Filtrage local */
  const visible = useMemo(() => {
    let list = [...credits];
    if (filter !== 'ALL') list = list.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.clientName.toLowerCase().includes(q) ||
        (c.clientPhone ?? '').includes(q)
      );
    }
    return list;
  }, [credits, filter, search]);

  function handleDelete(c: CustomerCredit) {
    if (!confirm(`Supprimer l'ardoise de ${c.clientName} ? Cette action est irréversible.`)) return;
    deleteCredit.mutate({ id: c.id });
  }

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">L&apos;Ardoise</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion du crédit client — {stats?.totalClients ?? 0} compte{(stats?.totalClients ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEdit(null); setShowNew(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}
        >
          <Plus className="w-4 h-4" /> Nouvelle ardoise
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Dette totale" icon={Wallet}
          value={formatXAF(stats?.totalDebt ?? 0)}
          color="hsl(38 90% 56%)"
        />
        <StatCard
          label="Clients actifs" icon={Users}
          value={String(stats?.activeCount ?? 0)}
          sub={`${stats?.settledCount ?? 0} soldé(s)`}
          color="#10B981"
        />
        <StatCard
          label="En alerte" icon={AlertTriangle}
          value={String(stats?.warnedCount ?? 0)}
          sub="Plafond > 80%"
          color="#F59E0B"
        />
        <StatCard
          label="Bloqués" icon={Shield}
          value={String(stats?.blockedCount ?? 0)}
          sub="Plafond atteint"
          color="#EF4444"
        />
      </div>

      {/* ── Barre de filtre ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client ou un numéro..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-foreground outline-none"
            style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          {FILTER_TABS.map(tab => {
            const active = filter === tab.value;
            const cfg = tab.value !== 'ALL' ? STATUS_CFG[tab.value] : null;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: active ? (cfg ? cfg.bg : 'hsl(38 90% 56% / 0.12)') : 'transparent',
                  color: active ? (cfg ? cfg.color : 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grille clients ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'hsl(38 90% 56% / 0.1)' }}>
            <Wallet className="w-8 h-8" style={{ color: 'hsl(38 90% 56%)' }} />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {credits.length === 0 ? 'Aucune ardoise ouverte' : 'Aucun résultat'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {credits.length === 0
              ? 'Cliquez sur "Nouvelle ardoise" pour commencer'
              : 'Essayez un autre filtre ou terme de recherche'}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map(credit => (
              <ClientCard
                key={credit.id}
                credit={credit}
                onTransaction={(c, type) => setTxTarget({ credit: c, type })}
                onEdit={c => { setEdit(c); setShowNew(true); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showNew && (
          <NewClientModal
            businessId={businessId}
            editCredit={editCredit}
            onClose={() => { setShowNew(false); setEdit(null); }}
          />
        )}
        {txTarget && (
          <TransactionModal
            credit={txTarget.credit}
            businessId={businessId}
            initialType={txTarget.type}
            onClose={() => setTxTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
