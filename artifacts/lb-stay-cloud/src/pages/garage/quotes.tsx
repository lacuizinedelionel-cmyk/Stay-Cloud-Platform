import { useState } from 'react';
import {
  useListGarageQuotes,
  useCreateGarageQuote,
  useUpdateGarageQuoteStatus,
  useDeleteGarageQuote,
  useListGarageVehicles,
  getListGarageQuotesQueryKey,
  getGetGarageStatsQueryKey,
  getListGarageVehiclesQueryKey,
  GarageQuote,
  GarageVehicle,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Trash2, X, Check, ChevronDown,
  ClipboardList, Car, Minus, FileText, Send, ThumbsUp, ThumbsDown,
} from 'lucide-react';

/* ──────────────────────────────────────────────── types */
type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';

const STATUS_CFG: Record<QuoteStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  DRAFT:    { label: 'Brouillon',  color: '#6B7280', bg: '#6B728015', icon: FileText },
  SENT:     { label: 'Envoyé',    color: '#3B82F6', bg: '#3B82F615', icon: Send     },
  ACCEPTED: { label: 'Accepté',   color: '#10B981', bg: '#10B98115', icon: ThumbsUp },
  REJECTED: { label: 'Refusé',    color: '#EF4444', bg: '#EF444415', icon: ThumbsDown },
};

const NEXT_STATUS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT:    ['SENT', 'ACCEPTED', 'REJECTED'],
  SENT:     ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: ['DRAFT'],
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  return `Il y a ${d} j`;
}

/* ──────────────────────────────────────────────── QuoteCard */
function QuoteCard({ q, onStatus, onDelete }: { q: GarageQuote; onStatus: (q: GarageQuote) => void; onDelete: (q: GarageQuote) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[q.status as QuoteStatus];
  const StatusIcon = cfg.icon;
  const next = NEXT_STATUS[q.status as QuoteStatus];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 p-4 rounded-2xl group"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: '#FFF9E6', color: '#92400E', border: '1px solid #D97706' }}>
              {q.plate}
            </span>
            <span className="text-xs font-semibold text-foreground">{q.clientName}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(q.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
            <StatusIcon className="w-3 h-3" style={{ color: cfg.color }} />
            <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          <button onClick={() => onDelete(q)}
            className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: '#EF444412', color: '#EF4444' }}>
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Items summary */}
      <div className="space-y-1">
        {q.items.slice(0, expanded ? q.items.length : 2).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground truncate flex-1">{item.description}</span>
            <span className="ml-2 shrink-0 text-foreground font-semibold">×{item.quantity} · {formatXAF(item.subtotal)}</span>
          </div>
        ))}
        {q.items.length > 2 && (
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] font-semibold mt-1 transition-colors"
            style={{ color: 'hsl(38 90% 56%)' }}>
            <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
            {expanded ? 'Masquer' : `+${q.items.length - 2} élément(s)`}
          </button>
        )}
      </div>

      {/* Amounts */}
      <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Main d&apos;oeuvre</p>
          <p className="text-xs font-semibold text-foreground">{formatXAF(q.laborCost)}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-sm font-extrabold text-foreground">{formatXAF(q.totalAmount)}</p>
        </div>
        {next.length > 0 && (
          <button onClick={() => onStatus(q)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
            <Send className="w-3 h-3" /> Mettre à jour
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────── StatusModal */
function StatusModal({ q, businessId, onClose }: { q: GarageQuote; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const qKey = getListGarageQuotesQueryKey({ businessId });
  const sKey = getGetGarageStatsQueryKey({ businessId });
  const update = useUpdateGarageQuoteStatus({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); qc.invalidateQueries({ queryKey: sKey }); onClose(); } },
  });
  const next = NEXT_STATUS[q.status as QuoteStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Mettre à jour le devis</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{q.plate} — {q.clientName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {next.map(s => {
            const cfg = STATUS_CFG[s];
            const StatusIcon = cfg.icon;
            return (
              <button key={s}
                onClick={() => update.mutate({ id: q.id, data: { status: s } })}
                disabled={update.isPending}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{cfg.label}</span>
                </div>
                {update.isPending
                  ? <div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                  : <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── NewQuoteModal */
type QuoteLine = { description: string; quantity: number; unitPrice: number };

function NewQuoteModal({ businessId, vehicles, onClose }: { businessId: number; vehicles: GarageVehicle[]; onClose: () => void }) {
  const qc = useQueryClient();
  const qKey = getListGarageQuotesQueryKey({ businessId });
  const sKey = getGetGarageStatsQueryKey({ businessId });
  const create = useCreateGarageQuote({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); qc.invalidateQueries({ queryKey: sKey }); onClose(); } },
  });

  const [vehicleId, setVehicleId] = useState<number>(0);
  const [clientName, setClientName] = useState('');
  const [plate, setPlate] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [lines, setLines] = useState<QuoteLine[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  function pickVehicle(id: number) {
    setVehicleId(id);
    const v = vehicles.find(v => v.id === id);
    if (v) { setClientName(v.clientName); setPlate(v.plate); }
    else { setClientName(''); setPlate(''); }
  }

  function setLine(i: number, k: keyof QuoteLine, val: string | number) {
    setLines(ls => ls.map((l, idx) => idx !== i ? l : { ...l, [k]: val }));
  }

  const partsTotal = lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0);
  const grandTotal = partsTotal + (parseFloat(laborCost) || 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter(l => l.description.trim() && l.quantity > 0 && l.unitPrice >= 0);
    if (!validLines.length) return;
    create.mutate({ data: {
      businessId,
      vehicleId: vehicleId || undefined,
      clientName,
      plate,
      items: validLines,
      laborCost: parseFloat(laborCost) || 0,
    }});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsl(38 90% 56% / 0.12)' }}>
              <ClipboardList className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
            </div>
            <h2 className="text-base font-bold text-foreground">Nouveau devis</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 max-h-[76vh] overflow-y-auto custom-scrollbar">
          {/* Vehicle selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Véhicule en atelier</label>
            <div className="mt-1 relative">
              <select value={vehicleId} onChange={e => pickVehicle(parseInt(e.target.value, 10))}
                className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
                <option value={0}>— Saisir manuellement —</option>
                {vehicles.filter(v => v.status !== 'DELIVERED').map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.clientName} ({v.brand})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Client + Plate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Client *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} required
                placeholder="Nom du client" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Immatriculation *</label>
              <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} required
                placeholder="CE 1234 A" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-foreground outline-none tracking-widest"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pièces / Prestations *</label>
              <button type="button"
                onClick={() => setLines(ls => [...ls, { description: '', quantity: 1, unitPrice: 0 }])}
                className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: 'hsl(38 90% 56%)' }}>
                <Plus className="w-3 h-3" /> Ajouter ligne
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input value={l.description} onChange={e => setLine(i, 'description', e.target.value)}
                    placeholder="Description pièce / prestation"
                    className="flex-1 px-3 py-2 rounded-xl text-xs text-foreground outline-none"
                    style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                  <input type="number" min="1" value={l.quantity} onChange={e => setLine(i, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-12 text-center px-2 py-2 rounded-xl text-xs font-bold text-foreground outline-none"
                    style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                  <input type="number" min="0" value={l.unitPrice || ''} onChange={e => setLine(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Prix"
                    className="w-24 px-2 py-2 rounded-xl text-xs text-foreground outline-none"
                    style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                  {lines.length > 1 && (
                    <button type="button" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0"
                      style={{ background: '#EF444412', color: '#EF4444' }}>
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Labor */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Main d&apos;oeuvre (XAF)</label>
            <input type="number" min="0" value={laborCost} onChange={e => setLaborCost(e.target.value)}
              placeholder="Ex : 25 000" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Total preview */}
          {grandTotal > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'hsl(var(--background))' }}>
                <p className="text-[10px] text-muted-foreground">Pièces</p>
                <p className="text-sm font-bold text-foreground">{formatXAF(partsTotal)}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'hsl(38 90% 56% / 0.08)', border: '1px solid hsl(38 90% 56% / 0.25)' }}>
                <p className="text-[10px] text-muted-foreground">Total devis</p>
                <p className="text-sm font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>{formatXAF(grandTotal)}</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={create.isPending}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
            {create.isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <><Check className="w-4 h-4" /> Créer le devis</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── DeleteModal */
function DeleteModal({ q, businessId, onClose }: { q: GarageQuote; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const qKey = getListGarageQuotesQueryKey({ businessId });
  const sKey = getGetGarageStatsQueryKey({ businessId });
  const del = useDeleteGarageQuote({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); qc.invalidateQueries({ queryKey: sKey }); onClose(); } } });

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
            <h3 className="text-sm font-bold text-foreground">Supprimer le devis</h3>
            <p className="text-[11px] text-muted-foreground">{q.plate} — {q.clientName}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Ce devis sera définitivement supprimé.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:bg-muted transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>Annuler</button>
          <button onClick={() => del.mutate({ id: q.id })} disabled={del.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
            style={{ background: '#EF4444', color: '#fff' }}>
            {del.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── Page */
export default function GarageQuotesPage() {
  const { business } = useAuth();
  const bId = business?.id ?? 0;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL'>('ALL');
  const [statusModal, setStatusModal] = useState<GarageQuote | null>(null);
  const [deleteModal, setDeleteModal] = useState<GarageQuote | null>(null);
  const [showNew, setShowNew] = useState(false);

  const qKey = getListGarageQuotesQueryKey({ businessId: bId });
  const vKey = getListGarageVehiclesQueryKey({ businessId: bId });

  const { data: quotes, isLoading } = useListGarageQuotes(
    { businessId: bId },
    { query: { queryKey: qKey, enabled: !!bId, refetchInterval: 30000 } },
  );
  const { data: vehicles } = useListGarageVehicles(
    { businessId: bId },
    { query: { queryKey: vKey, enabled: !!bId } },
  );

  const all = quotes ?? [];
  const accepted = all.filter(q => q.status === 'ACCEPTED').length;
  const pending = all.filter(q => q.status === 'DRAFT' || q.status === 'SENT').length;
  const totalAccepted = all.filter(q => q.status === 'ACCEPTED').reduce((s, q) => s + q.totalAmount, 0);
  const avgQuote = all.length ? all.reduce((s, q) => s + q.totalAmount, 0) / all.length : 0;

  const filtered = all.filter(q => {
    const okSearch = search === '' || q.clientName.toLowerCase().includes(search.toLowerCase()) || q.plate.toLowerCase().includes(search.toLowerCase());
    const okStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return okSearch && okStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>Devis</h1>
          <p className="text-xs text-muted-foreground mt-1">{all.length} devis · {pending} en attente de réponse</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nouveau devis
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total devis', value: String(all.length), icon: ClipboardList, color: '#3B82F6' },
          { label: 'En attente', value: String(pending), icon: Send, color: '#F59E0B' },
          { label: 'Acceptés', value: String(accepted), icon: ThumbsUp, color: '#10B981' },
          { label: 'CA accepté', value: formatXAF(totalAccepted), icon: Car, color: 'hsl(38 90% 56%)' },
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

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const).map(s => {
            const cfg = s !== 'ALL' ? STATUS_CFG[s] : null;
            const active = statusFilter === s;
            const count = s === 'ALL' ? all.length : all.filter(q => q.status === s).length;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? (cfg ? cfg.bg : 'hsl(38 90% 56% / 0.12)') : 'hsl(var(--card))',
                  border: `1px solid ${active ? (cfg ? `${cfg.color}40` : 'hsl(38 90% 56% / 0.4)') : 'hsl(var(--border))'}`,
                  color: active ? (cfg ? cfg.color : 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
                }}>
                {s === 'ALL' ? 'Tous' : cfg!.label}
                <span className="opacity-60 text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Client, immatriculation…"
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
        </div>
      </div>

      {/* Average */}
      {all.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">
            Montant moyen par devis : <span className="font-bold text-foreground">{formatXAF(avgQuote)}</span>
          </p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <ClipboardList className="w-8 h-8 text-muted-foreground/30" strokeWidth={1} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun devis trouvé</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(q => (
              <QuoteCard key={q.id} q={q} onStatus={setStatusModal} onDelete={setDeleteModal} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {statusModal && <StatusModal q={statusModal} businessId={bId} onClose={() => setStatusModal(null)} />}
        {deleteModal && <DeleteModal q={deleteModal} businessId={bId} onClose={() => setDeleteModal(null)} />}
        {showNew && <NewQuoteModal businessId={bId} vehicles={vehicles ?? []} onClose={() => setShowNew(false)} />}
      </AnimatePresence>
    </div>
  );
}
