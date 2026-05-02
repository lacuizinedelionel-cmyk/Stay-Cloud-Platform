import { useState } from 'react';
import {
  useListGarageVehicles,
  useCreateGarageVehicle,
  useUpdateGarageVehicle,
  useDeleteGarageVehicle,
  useUpdateGarageVehicleStatus,
  getListGarageVehiclesQueryKey,
  getGetGarageStatsQueryKey,
  GarageVehicle,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, X, Check, Wrench, Car,
  Phone, Calendar, ChevronDown, User, AlertTriangle,
  Clock, CheckCircle2, Package, Truck, Activity,
} from 'lucide-react';

/* ──────────────── constants */
type VehicleStatus = 'DIAGNOSTIC' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED';

const STATUS_CFG: Record<VehicleStatus, { label: string; color: string; bg: string; icon: React.ElementType; progress: number }> = {
  DIAGNOSTIC:    { label: 'Diagnostic',       color: '#F59E0B', bg: '#F59E0B12', icon: Activity,      progress: 10  },
  IN_PROGRESS:   { label: 'En cours',         color: '#3B82F6', bg: '#3B82F612', icon: Wrench,         progress: 50  },
  WAITING_PARTS: { label: 'Attente pièces',   color: '#8B5CF6', bg: '#8B5CF612', icon: Package,        progress: 35  },
  COMPLETED:     { label: 'Terminé',          color: '#10B981', bg: '#10B98112', icon: CheckCircle2,   progress: 100 },
  DELIVERED:     { label: 'Livré',            color: '#6B7280', bg: '#6B728012', icon: Truck,          progress: 100 },
};

const STATUS_FLOW: Record<VehicleStatus, VehicleStatus[]> = {
  DIAGNOSTIC:    ['IN_PROGRESS', 'WAITING_PARTS'],
  IN_PROGRESS:   ['WAITING_PARTS', 'COMPLETED'],
  WAITING_PARTS: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED:     ['DELIVERED'],
  DELIVERED:     [],
};

const MECHANICS = ['Mekong Paul', 'Njoya Théodore', 'Kamga Simon', 'Atangana Lionel', 'Autre'];
const BRANDS = ['Toyota', 'Peugeot', 'Renault', 'Mercedes', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Nissan', 'Mitsubishi', 'Autre'];

function entryLabel(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Entré aujourd'hui";
  if (d === 1) return 'Entré hier';
  return `Entré il y a ${d} jours`;
}

/* ──────────────── ProgressBar */
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
      <motion.div className="h-full rounded-full" initial={{ width: 0 }}
        animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: color }} />
    </div>
  );
}

/* ──────────────── VehicleCard */
function VehicleCard({ v, onEdit, onDelete, onStatus }: {
  v: GarageVehicle;
  onEdit: (v: GarageVehicle) => void;
  onDelete: (v: GarageVehicle) => void;
  onStatus: (v: GarageVehicle) => void;
}) {
  const cfg = STATUS_CFG[v.status as VehicleStatus];
  const StatusIcon = cfg.icon;
  const nextStatuses = STATUS_FLOW[v.status as VehicleStatus];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 p-4 rounded-2xl group transition-colors"
      style={{ background: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }}
    >
      {/* Status + Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
            <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} strokeWidth={1.5} />
          </div>
          <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: '#EF444412', color: '#EF4444' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Plate + Brand */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-foreground tracking-widest px-2 py-0.5 rounded-md"
            style={{ background: '#FFF9E6', color: '#92400E', border: '1px solid #D97706' }}>
            {v.plate}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{v.brand}{v.model ? ` ${v.model}` : ''}{v.year ? ` · ${v.year}` : ''}</span>
        </div>
      </div>

      {/* Client */}
      <div className="flex items-center gap-2">
        <User className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-xs text-foreground font-semibold truncate">{v.clientName}</span>
        {v.clientPhone && (
          <a href={`tel:${v.clientPhone}`} className="ml-auto flex items-center gap-1 text-[10px] font-semibold shrink-0"
            style={{ color: 'hsl(38 90% 56%)' }}>
            <Phone className="w-2.5 h-2.5" /> Appeler
          </a>
        )}
      </div>

      {/* Problem */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{v.problem}</p>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Avancement</span>
          <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{v.progressPercent}%</span>
        </div>
        <ProgressBar pct={v.progressPercent} color={cfg.color} />
      </div>

      {/* Mechanic + dates */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {v.mechanicName && (
          <span className="flex items-center gap-1 truncate">
            <Wrench className="w-2.5 h-2.5 shrink-0" /> {v.mechanicName}
          </span>
        )}
        <span className="flex items-center gap-1 shrink-0 ml-auto">
          <Calendar className="w-2.5 h-2.5" /> {entryLabel(v.entryDate)}
        </span>
      </div>

      {/* Amounts */}
      <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {v.estimatedAmount != null && (
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Estimé</p>
            <p className="text-xs font-bold text-foreground">{formatXAF(v.estimatedAmount)}</p>
          </div>
        )}
        {v.finalAmount != null && (
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Final</p>
            <p className="text-xs font-bold" style={{ color: '#10B981' }}>{formatXAF(v.finalAmount)}</p>
          </div>
        )}
        {nextStatuses.length > 0 && (
          <button onClick={() => onStatus(v)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
            <Activity className="w-3 h-3" /> Statut
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────── VehicleModal */
const EMPTY_V = { clientName: '', clientPhone: '', plate: '', brand: 'Toyota', model: '', year: '', problem: '', estimatedAmount: '', mechanicName: '' };

function VehicleModal({ vehicle, businessId, onClose }: { vehicle: GarageVehicle | null; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const vKey = getListGarageVehiclesQueryKey({ businessId });
  const sKey = getGetGarageStatsQueryKey({ businessId });
  const done = () => { qc.invalidateQueries({ queryKey: vKey }); qc.invalidateQueries({ queryKey: sKey }); onClose(); };

  const create = useCreateGarageVehicle({ mutation: { onSuccess: done } });
  const update = useUpdateGarageVehicle({ mutation: { onSuccess: done } });

  const [form, setForm] = useState(vehicle ? {
    clientName: vehicle.clientName,
    clientPhone: vehicle.clientPhone ?? '',
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model ?? '',
    year: vehicle.year ? String(vehicle.year) : '',
    problem: vehicle.problem,
    estimatedAmount: vehicle.estimatedAmount != null ? String(vehicle.estimatedAmount) : '',
    mechanicName: vehicle.mechanicName ?? '',
  } : EMPTY_V);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isPending = create.isPending || update.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      businessId,
      clientName: form.clientName,
      clientPhone: form.clientPhone || undefined,
      plate: form.plate,
      brand: form.brand,
      model: form.model || undefined,
      year: form.year ? parseInt(form.year, 10) : undefined,
      problem: form.problem,
      estimatedAmount: form.estimatedAmount ? parseFloat(form.estimatedAmount) : undefined,
      mechanicName: form.mechanicName || undefined,
    };
    if (vehicle) update.mutate({ id: vehicle.id, data: payload });
    else create.mutate({ data: payload });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsl(38 90% 56% / 0.12)' }}>
              <Car className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
            </div>
            <h2 className="text-base font-bold text-foreground">{vehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {/* Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nom client *</label>
              <input value={form.clientName} onChange={e => set('clientName', e.target.value)} required
                placeholder="ONGOLA Bernard" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</label>
              <input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
                placeholder="+237 6XX XXX XXX" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
          </div>

          {/* Plate */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Immatriculation *</label>
            <input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())} required
              placeholder="CE 1234 A" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-foreground outline-none tracking-widest"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Brand + Model + Year */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Marque *</label>
              <div className="mt-1 relative">
                <select value={form.brand} onChange={e => set('brand', e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
                  {BRANDS.map(b => <option key={b}>{b}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Modèle</label>
              <input value={form.model} onChange={e => set('model', e.target.value)}
                placeholder="Hilux" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Année</label>
              <input type="number" min="1990" max="2030" value={form.year} onChange={e => set('year', e.target.value)}
                placeholder="2020" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
          </div>

          {/* Problem */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Problème / Intervention *</label>
            <textarea value={form.problem} onChange={e => set('problem', e.target.value)} required rows={3}
              placeholder="Décrivez le problème signalé par le client…"
              className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none resize-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
          </div>

          {/* Mechanic + Estimate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mécanicien</label>
              <div className="mt-1 relative">
                <select value={form.mechanicName} onChange={e => set('mechanicName', e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
                  <option value="">— Non assigné —</option>
                  {MECHANICS.map(m => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Devis estimé (XAF)</label>
              <input type="number" min="0" value={form.estimatedAmount} onChange={e => set('estimatedAmount', e.target.value)}
                placeholder="80 000" className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
          </div>

          <button type="submit" disabled={isPending}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
            {isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <><Check className="w-4 h-4" /> {vehicle ? 'Enregistrer' : 'Créer la fiche'}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────────── StatusModal */
function StatusModal({ vehicle, businessId, onClose }: { vehicle: GarageVehicle; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const vKey = getListGarageVehiclesQueryKey({ businessId });
  const sKey = getGetGarageStatsQueryKey({ businessId });
  const done = () => { qc.invalidateQueries({ queryKey: vKey }); qc.invalidateQueries({ queryKey: sKey }); onClose(); };

  const update = useUpdateGarageVehicleStatus({ mutation: { onSuccess: done } });

  const [finalAmount, setFinalAmount] = useState(vehicle.finalAmount != null ? String(vehicle.finalAmount) : '');
  const [pendingStatus, setPendingStatus] = useState<VehicleStatus | null>(null);

  const nextStatuses = STATUS_FLOW[vehicle.status as VehicleStatus];

  function confirm(status: VehicleStatus) {
    const cfg = STATUS_CFG[status];
    update.mutate({ id: vehicle.id, data: {
      status,
      progressPercent: cfg.progress,
      finalAmount: status === 'COMPLETED' || status === 'DELIVERED' ? (finalAmount ? parseFloat(finalAmount) : undefined) : undefined,
    }});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Avancer le statut</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[220px]">{vehicle.plate} — {vehicle.clientName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Statut actuel : <span className="font-bold" style={{ color: STATUS_CFG[vehicle.status as VehicleStatus].color }}>
              {STATUS_CFG[vehicle.status as VehicleStatus].label}
            </span>
          </p>
          {nextStatuses.map(s => {
            const cfg = STATUS_CFG[s];
            const StatusIcon = cfg.icon;
            const needsAmount = (s === 'COMPLETED' || s === 'DELIVERED') && !vehicle.finalAmount;
            return (
              <div key={s} className="space-y-2">
                {needsAmount && pendingStatus === s && (
                  <input type="number" min="0" value={finalAmount}
                    onChange={e => setFinalAmount(e.target.value)}
                    placeholder="Montant final (XAF)"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground outline-none"
                    style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                )}
                <button
                  onClick={() => { if (needsAmount && pendingStatus !== s) { setPendingStatus(s); return; } confirm(s); }}
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
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────── DeleteModal */
function DeleteModal({ vehicle, businessId, onClose }: { vehicle: GarageVehicle; businessId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const vKey = getListGarageVehiclesQueryKey({ businessId });
  const sKey = getGetGarageStatsQueryKey({ businessId });
  const del = useDeleteGarageVehicle({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: vKey }); qc.invalidateQueries({ queryKey: sKey }); onClose(); } } });

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
            <h3 className="text-sm font-bold text-foreground">Supprimer la fiche</h3>
            <p className="text-[11px] text-muted-foreground">{vehicle.plate} — {vehicle.clientName}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Cette fiche véhicule sera définitivement supprimée.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:bg-muted transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>Annuler</button>
          <button onClick={() => del.mutate({ id: vehicle.id })} disabled={del.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
            style={{ background: '#EF4444', color: '#fff' }}>
            {del.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────── Page */
export default function GarageVehiclesPage() {
  const { business } = useAuth();
  const bId = business?.id ?? 0;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [editVehicle, setEditVehicle] = useState<GarageVehicle | null | undefined>(undefined);
  const [statusVehicle, setStatusVehicle] = useState<GarageVehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<GarageVehicle | null>(null);

  const vKey = getListGarageVehiclesQueryKey({ businessId: bId });
  const { data: vehicles, isLoading } = useListGarageVehicles(
    { businessId: bId },
    { query: { queryKey: vKey, enabled: !!bId, refetchInterval: 30000 } },
  );

  const all = vehicles ?? [];
  const inProgress = all.filter(v => ['DIAGNOSTIC', 'IN_PROGRESS', 'WAITING_PARTS'].includes(v.status)).length;
  const completed = all.filter(v => v.status === 'COMPLETED').length;
  const delivered = all.filter(v => v.status === 'DELIVERED').length;
  const totalRevenue = all.filter(v => v.finalAmount != null).reduce((s, v) => s + (v.finalAmount ?? 0), 0);

  const filtered = all.filter(v => {
    const okSearch = search === '' || v.clientName.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase()) || v.brand.toLowerCase().includes(search.toLowerCase());
    const okStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return okSearch && okStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>Véhicules en atelier</h1>
          <p className="text-xs text-muted-foreground mt-1">{all.length} fiche{all.length !== 1 ? 's' : ''} · {inProgress} en cours de réparation</p>
        </div>
        <button onClick={() => setEditVehicle(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'hsl(38 90% 56%)', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nouveau véhicule
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'En cours', value: String(inProgress), icon: Wrench, color: '#3B82F6' },
          { label: 'Terminés', value: String(completed), icon: CheckCircle2, color: '#10B981' },
          { label: 'Livrés', value: String(delivered), icon: Truck, color: '#6B7280' },
          { label: 'CA total', value: formatXAF(totalRevenue), icon: Activity, color: 'hsl(38 90% 56%)' },
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

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'DIAGNOSTIC', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED'] as const).map(s => {
          const cfg = s !== 'ALL' ? STATUS_CFG[s] : null;
          const active = statusFilter === s;
          const count = s === 'ALL' ? all.length : all.filter(v => v.status === s).length;
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

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Client, immatriculation, marque…"
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
        {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" /></button>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <Car className="w-8 h-8 text-muted-foreground/30" strokeWidth={1} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun véhicule trouvé</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(v => (
              <VehicleCard key={v.id} v={v} onEdit={setEditVehicle} onDelete={setDeleteVehicle} onStatus={setStatusVehicle} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editVehicle !== undefined && <VehicleModal vehicle={editVehicle} businessId={bId} onClose={() => setEditVehicle(undefined)} />}
        {statusVehicle && <StatusModal vehicle={statusVehicle} businessId={bId} onClose={() => setStatusVehicle(null)} />}
        {deleteVehicle && <DeleteModal vehicle={deleteVehicle} businessId={bId} onClose={() => setDeleteVehicle(null)} />}
      </AnimatePresence>
    </div>
  );
}
