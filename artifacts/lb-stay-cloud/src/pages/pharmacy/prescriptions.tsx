import { useState } from 'react';
import {
  useListPrescriptions,
  useCreatePrescription,
  useUpdatePrescriptionStatus,
  useListMedications,
  getListPrescriptionsQueryKey,
  getGetPharmacyStatsQueryKey,
  getListMedicationsQueryKey,
  Prescription,
  Medication,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Check, ChevronDown, ClipboardList,
  Clock, User, Stethoscope, Pill, Trash2, FileText,
} from 'lucide-react';

/* ──────────────────────────────────────────────── types */
type PrescriptionStatus = 'PENDING' | 'DISPENSED' | 'PARTIAL' | 'CANCELLED';

const STATUS_CONFIG: Record<PrescriptionStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'En attente',  color: '#F59E0B', bg: '#F59E0B15' },
  DISPENSED: { label: 'Délivré',     color: '#10B981', bg: '#10B98115' },
  PARTIAL:   { label: 'Partiel',     color: '#3B82F6', bg: '#3B82F615' },
  CANCELLED: { label: 'Annulé',      color: '#6B7280', bg: '#6B728015' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ──────────────────────────────────────────────── StatusBadge */
function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

/* ──────────────────────────────────────────────── PrescriptionCard */
function PrescriptionCard({
  px, onChangeStatus,
}: {
  px: Prescription;
  onChangeStatus: (px: Prescription) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[px.status as PrescriptionStatus];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden transition-colors"
      style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }}
    >
      {/* Top bar */}
      <div className="h-1 w-full" style={{ background: cfg.color }} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-sm font-bold text-foreground truncate">{px.patientRef}</p>
            </div>
            {px.doctorName && (
              <div className="flex items-center gap-2 mt-0.5">
                <Stethoscope className="w-3 h-3 text-muted-foreground shrink-0" />
                <p className="text-[11px] text-muted-foreground truncate">{px.doctorName}</p>
              </div>
            )}
          </div>
          <StatusBadge status={px.status as PrescriptionStatus} />
        </div>

        {/* Meds summary */}
        <div className="flex items-center gap-2 flex-wrap">
          {px.medications.slice(0, 2).map((m, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#F472B615', color: '#F472B6' }}>
              <Pill className="w-2.5 h-2.5" /> {m.medicationName} ×{m.quantity}
            </span>
          ))}
          {px.medications.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{px.medications.length - 2} autre(s)</span>
          )}
        </div>

        {/* Expand / collapse */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden">
              {px.medications.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl space-y-0.5" style={{ background: 'hsl(var(--background))' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{m.medicationName}</span>
                    <span className="text-xs text-muted-foreground">Qté : {m.quantity}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">{m.dosageInstructions}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}>
          <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
          {expanded ? 'Masquer' : `Voir les ${px.medications.length} médicament(s)`}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div>
            <p className="text-[10px] text-muted-foreground">Montant total</p>
            <p className="text-sm font-extrabold text-foreground">{formatXAF(px.totalAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">{timeAgo(px.createdAt)}</p>
            {px.status === 'PENDING' || px.status === 'PARTIAL' ? (
              <button onClick={() => onChangeStatus(px)}
                className="mt-0.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
                Changer statut
              </button>
            ) : (
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────── StatusModal */
function StatusModal({ px, businessId, onClose }: { px: Prescription; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const pxKey = getListPrescriptionsQueryKey({ businessId });
  const statsKey = getGetPharmacyStatsQueryKey({ businessId });
  const update = useUpdatePrescriptionStatus({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: pxKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } },
  });

  const NEXT_STATUSES: PrescriptionStatus[] = px.status === 'PENDING'
    ? ['DISPENSED', 'PARTIAL', 'CANCELLED']
    : ['DISPENSED', 'CANCELLED'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Changer le statut</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[220px]">{px.patientRef}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">Statut actuel : <StatusBadge status={px.status as PrescriptionStatus} /></p>
          {NEXT_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button key={s}
                onClick={() => update.mutate({ id: px.id, data: { status: s } })}
                disabled={update.isPending}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
                <span>{cfg.label}</span>
                {update.isPending ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── NewPrescriptionModal */
type MedLine = { medicationId: number; medicationName: string; quantity: number; dosageInstructions: string };

function NewPrescriptionModal({ businessId, medications, onClose }: {
  businessId: number;
  medications: Medication[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const pxKey = getListPrescriptionsQueryKey({ businessId });
  const statsKey = getGetPharmacyStatsQueryKey({ businessId });
  const create = useCreatePrescription({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: pxKey }); qc.invalidateQueries({ queryKey: statsKey }); onClose(); } },
  });

  const [patientRef, setPatientRef] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [lines, setLines] = useState<MedLine[]>([
    { medicationId: 0, medicationName: '', quantity: 1, dosageInstructions: '' },
  ]);

  function setLine(i: number, k: keyof MedLine, v: string | number) {
    setLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l;
      if (k === 'medicationId') {
        const med = medications.find(m => m.id === Number(v));
        return { ...l, medicationId: Number(v), medicationName: med?.name ?? '' };
      }
      return { ...l, [k]: v };
    }));
  }

  const total = lines.reduce((s, l) => {
    const med = medications.find(m => m.id === l.medicationId);
    return s + (med ? med.price * l.quantity : 0);
  }, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter(l => l.medicationId > 0 && l.quantity > 0 && l.dosageInstructions.trim());
    if (!validLines.length) return;
    create.mutate({ data: { businessId, patientRef, doctorName: doctorName || undefined, medications: validLines } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#3B82F615' }}>
              <ClipboardList className="w-4 h-4" style={{ color: '#3B82F6' }} />
            </div>
            <h2 className="text-base font-bold text-foreground">Nouvelle ordonnance</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 max-h-[76vh] overflow-y-auto custom-scrollbar">
          {/* Patient */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Référence patient *</label>
            <input value={patientRef} onChange={e => setPatientRef(e.target.value)} required
              placeholder="Ex : BIYA Jean-Pierre" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Doctor */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Médecin prescripteur</label>
            <input value={doctorName} onChange={e => setDoctorName(e.target.value)}
              placeholder="Ex : Dr. NKOULOU Pierre" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Medication lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Médicaments *</label>
              <button type="button"
                onClick={() => setLines(ls => [...ls, { medicationId: 0, medicationName: '', quantity: 1, dosageInstructions: '' }])}
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'hsl(38 90% 56%)' }}>
                <Plus className="w-3 h-3" /> Ajouter ligne
              </button>
            </div>
            <div className="space-y-3">
              {lines.map((line, i) => (
                <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <select value={line.medicationId}
                        onChange={e => setLine(i, 'medicationId', e.target.value)}
                        className="w-full appearance-none px-3 py-2 rounded-xl text-xs text-foreground outline-none"
                        style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
                        <option value={0}>— Choisir médicament —</option>
                        {medications.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (stock: {m.stock})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                    </div>
                    <input type="number" min="1" value={line.quantity}
                      onChange={e => setLine(i, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-16 text-center px-2 py-2 rounded-xl text-xs font-bold text-foreground outline-none"
                      style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                      placeholder="Qté" />
                    {lines.length > 1 && (
                      <button type="button" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}
                        className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{ background: '#EF444412', color: '#EF4444' }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input value={line.dosageInstructions}
                    onChange={e => setLine(i, 'dosageInstructions', e.target.value)}
                    placeholder="Ex : 3x/jour pendant 5 jours"
                    className="w-full px-3 py-2 rounded-xl text-xs text-foreground outline-none"
                    style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Total preview */}
          {total > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'hsl(38 90% 56% / 0.08)', border: '1px solid hsl(38 90% 56% / 0.25)' }}>
              <span className="text-xs text-muted-foreground">Montant estimé</span>
              <span className="text-base font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>{formatXAF(total)}</span>
            </div>
          )}

          <button type="submit" disabled={create.isPending}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
            {create.isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <><Check className="w-4 h-4" /> Enregistrer l&apos;ordonnance</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────── Main Page */
export default function PharmacyPrescriptionsPage() {
  const { business } = useAuth();
  const bId = business?.id ?? 0;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | 'ALL'>('ALL');
  const [statusModal, setStatusModal] = useState<Prescription | null>(null);
  const [showNew, setShowNew] = useState(false);

  const pxKey = getListPrescriptionsQueryKey({ businessId: bId });
  const medsKey = getListMedicationsQueryKey({ businessId: bId });

  const { data: prescriptions, isLoading } = useListPrescriptions(
    { businessId: bId },
    { query: { queryKey: pxKey, enabled: !!bId, refetchInterval: 30000 } },
  );
  const { data: medications } = useListMedications(
    { businessId: bId },
    { query: { queryKey: medsKey, enabled: !!bId } },
  );

  const all = prescriptions ?? [];
  const pending = all.filter(p => p.status === 'PENDING').length;
  const dispensed = all.filter(p => p.status === 'DISPENSED').length;
  const totalRevenue = all.filter(p => p.status === 'DISPENSED').reduce((s, p) => s + p.totalAmount, 0);

  const filtered = all.filter(p => {
    const okSearch = search === '' || p.patientRef.toLowerCase().includes(search.toLowerCase()) || (p.doctorName ?? '').toLowerCase().includes(search.toLowerCase());
    const okStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return okSearch && okStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>Ordonnances</h1>
          <p className="text-xs text-muted-foreground mt-1">{all.length} ordonnance{all.length !== 1 ? 's' : ''} · {pending} en attente</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nouvelle ordonnance
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total ordonnances', value: String(all.length), icon: FileText, color: '#3B82F6' },
          { label: 'En attente', value: String(pending), icon: Clock, color: '#F59E0B' },
          { label: 'Délivrées', value: String(dispensed), icon: Check, color: '#10B981' },
          { label: 'CA délivré', value: formatXAF(totalRevenue), icon: ClipboardList, color: 'hsl(38 90% 56%)' },
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
          {(['ALL', 'PENDING', 'DISPENSED', 'PARTIAL', 'CANCELLED'] as const).map(s => {
            const cfg = s !== 'ALL' ? STATUS_CONFIG[s] : null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? (cfg ? cfg.bg : 'hsl(38 90% 56% / 0.12)') : 'hsl(var(--card))',
                  border: `1px solid ${active ? (cfg ? cfg.color + '40' : 'hsl(38 90% 56% / 0.4)') : 'hsl(var(--border))'}`,
                  color: active ? (cfg ? cfg.color : 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
                }}>
                {s === 'ALL' ? 'Toutes' : cfg!.label}
                {s !== 'ALL' && <span className="ml-1 opacity-60">{all.filter(p => p.status === s).length}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Patient, médecin…"
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <ClipboardList className="w-8 h-8 text-muted-foreground/30" strokeWidth={1} />
          </div>
          <p className="text-sm text-muted-foreground">Aucune ordonnance trouvée</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(px => (
              <PrescriptionCard key={px.id} px={px} onChangeStatus={setStatusModal} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {statusModal && <StatusModal px={statusModal} businessId={bId} onClose={() => setStatusModal(null)} />}
        {showNew && <NewPrescriptionModal businessId={bId} medications={medications ?? []} onClose={() => setShowNew(false)} />}
      </AnimatePresence>
    </div>
  );
}
