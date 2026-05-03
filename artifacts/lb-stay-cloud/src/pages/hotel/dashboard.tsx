import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetHotelStats, getGetHotelStatsQueryKey,
  useListHotelRooms, getListHotelRoomsQueryKey,
  useListHotelReservations, getListHotelReservationsQueryKey,
  useCreateHotelReservation, useHotelCheckIn, useHotelCheckOut,
  HotelRoomStatus, HotelRoomType, HotelRoom, HotelReservation,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { KPICard } from '@/components/kpi-card';
import { DashboardHero } from '@/components/dashboard-hero';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import {
  Activity, DoorOpen, Calendar, Receipt,
  TrendingUp, LogIn, LogOut, BedDouble,
  Sparkles, Crown, Star, RefreshCw, X,
  Moon, User, Phone, PlusCircle, CheckCircle2,
} from 'lucide-react';
import { ReviewsSection } from '@/components/reviews-section';

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const STATUS_CFG: Record<HotelRoomStatus, { label: string; color: string; bg: string; border: string }> = {
  AVAILABLE: { label: 'Libre',     color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)', border: 'hsl(160 84% 39% / 0.4)' },
  OCCUPIED:  { label: 'Occupée',   color: '#EF4444', bg: 'hsl(0 72% 51% / 0.12)',   border: 'hsl(0 72% 51% / 0.4)'   },
  RESERVED:  { label: 'Réservée',  color: '#3B82F6', bg: 'hsl(217 91% 60% / 0.12)', border: 'hsl(217 91% 60% / 0.4)' },
  CLEANING:  { label: 'Nettoyage', color: '#F59E0B', bg: 'hsl(38 90% 56% / 0.12)',  border: 'hsl(38 90% 56% / 0.4)'  },
};

const TYPE_CFG: Record<HotelRoomType, { label: string; icon: React.ElementType; color: string }> = {
  STANDARD:     { label: 'Standard',       icon: BedDouble, color: '#60A5FA' },
  SUPERIOR:     { label: 'Supérieure',     icon: Star,      color: '#A78BFA' },
  SUITE:        { label: 'Suite',          icon: Sparkles,  color: '#F59E0B' },
  PRESIDENTIAL: { label: 'Présidentielle', icon: Crown,     color: '#EF4444' },
};

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

/* ═══════════════════════════════════════════
   COMPOSANT — Jauge occupation circulaire
═══════════════════════════════════════════ */
function OccupancyGauge({ rate, available, occupied, total }: {
  rate: number; available: number; occupied: number; total: number;
}) {
  const data = [{ value: rate, fill: rate > 70 ? '#EF4444' : rate > 40 ? '#F59E0B' : '#10B981' }];
  const color = rate > 70 ? '#EF4444' : rate > 40 ? '#F59E0B' : '#10B981';

  return (
    <Card style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.5} />
          Taux d&apos;occupation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex items-center justify-center" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius={52} outerRadius={72}
              startAngle={200} endAngle={-20}
              data={[{ value: 100, fill: 'hsl(var(--muted))' }, ...data]}
            >
              <RadialBar dataKey="value" cornerRadius={6} background={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-foreground" style={{ letterSpacing: '-0.04em', color }}>
              {Math.round(rate)}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">occupation</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { label: 'Occupées',  value: occupied,            color: '#EF4444' },
            { label: 'Libres',    value: available,           color: '#10B981' },
            { label: 'Total',     value: total,               color: '#60A5FA' },
            { label: 'Taux',      value: `${Math.round(rate)}%`, color },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'hsl(var(--muted))' }}>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANT — Revenue Management
═══════════════════════════════════════════ */
function RevenueManagement({ reservations, rooms }: {
  reservations: HotelReservation[];
  rooms: HotelRoom[];
}) {
  const active = reservations.filter(r => r.status !== 'CANCELLED');
  const totalRevenue = active.reduce((s, r) => s + r.totalAmount, 0);
  const totalNights = active.reduce((s, r) => s + r.nights, 0);
  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED').length;
  const totalRooms = rooms.length;
  const occRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;
  const revpar = adr * occRate;

  const metrics = [
    { label: 'ADR',    sublabel: 'Prix Moyen / Nuit',        value: formatXAF(Math.round(adr)),    color: '#60A5FA', icon: BedDouble  },
    { label: 'RevPAR', sublabel: 'Revenu par Chambre Dispo',  value: formatXAF(Math.round(revpar)), color: 'hsl(38 90% 56%)', icon: TrendingUp },
    { label: 'CA Total', sublabel: 'Toutes réservations actives', value: formatXAF(totalRevenue),  color: '#10B981', icon: Receipt    },
  ];

  return (
    <Card style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} strokeWidth={1.5} />
          Revenue Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${m.color}15` }}>
                <m.icon className="w-4 h-4" style={{ color: m.color }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sublabel}</p>
              </div>
            </div>
            <span className="text-sm font-extrabold" style={{ color: m.color, letterSpacing: '-0.02em' }}>
              {m.value}
            </span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANT — Revenus 7 jours (graphe)
═══════════════════════════════════════════ */
function WeeklyRevenueChart({ reservations }: { reservations: HotelReservation[] }) {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const iso = toISO(d);
      const dayRevenue = reservations
        .filter(r => r.status !== 'CANCELLED' && r.checkInDate <= iso && r.checkOutDate > iso)
        .reduce((s, r) => s + r.totalAmount / r.nights, 0);
      return {
        day: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue: Math.round(dayRevenue),
        isToday: iso === toISO(new Date()),
      };
    });
  }, [reservations]);

  const maxVal = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <Card style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} strokeWidth={1.5} />
            Revenus des 7 derniers jours
          </CardTitle>
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
            style={{ background: 'hsl(38 90% 56% / 0.1)', color: 'hsl(38 90% 56%)' }}>
            FCFA / nuit
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide domain={[0, maxVal * 1.2]} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <p className="font-bold text-foreground mb-1">{label}</p>
                    <p style={{ color: 'hsl(38 90% 56%)' }}>{formatXAF(payload[0].value as number)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isToday ? 'hsl(38 90% 56%)' : entry.revenue > 0 ? '#3B82F6' : 'hsl(var(--muted))'}
                  fillOpacity={entry.isToday ? 1 : entry.revenue > 0 ? 0.7 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANT — Timeline arrivées / départs
═══════════════════════════════════════════ */
function TodayTimeline({ reservations, onCheckIn, onCheckOut, isMutating, mutatingId }: {
  reservations: HotelReservation[];
  onCheckIn: (id: number) => void;
  onCheckOut: (id: number) => void;
  isMutating: boolean;
  mutatingId: number | null;
}) {
  const today = toISO(new Date());
  const arrivals  = reservations.filter(r => r.checkInDate  === today && r.status === 'RESERVED');
  const departures = reservations.filter(r => r.checkOutDate === today && r.status === 'CHECKED_IN');
  const upcomingArrivals = reservations.filter(r => r.checkInDate > today && r.status === 'RESERVED').slice(0, 4);

  if (arrivals.length === 0 && departures.length === 0 && upcomingArrivals.length === 0) {
    return (
      <Card style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.5} />
            Arrivées &amp; Départs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Calendar className="w-8 h-8 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-xs text-muted-foreground">Aucune arrivée ni départ aujourd&apos;hui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function EventRow({ res, type }: { res: HotelReservation; type: 'arrival' | 'departure' | 'upcoming' }) {
    const isArrival  = type === 'arrival';
    const isUpcoming = type === 'upcoming';
    const color  = isArrival ? '#10B981' : isUpcoming ? '#3B82F6' : '#EF4444';
    const bgColor = isArrival ? 'hsl(160 84% 39% / 0.1)' : isUpcoming ? 'hsl(217 91% 60% / 0.1)' : 'hsl(0 72% 51% / 0.1)';
    const label  = isArrival ? 'Arrivée' : isUpcoming ? 'Prévu' : 'Départ';
    const isBusy = isMutating && mutatingId === res.id;

    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: bgColor, color }}>
          {res.guestName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{res.guestName}</p>
          <p className="text-[10px] text-muted-foreground">
            Ch. {res.roomNumber} · {res.nights}n
            {isUpcoming && ` · ${new Date(res.checkInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: bgColor, color }}>{label}</span>
        {type === 'arrival' && (
          <button
            onClick={() => onCheckIn(res.id)}
            disabled={isMutating}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all disabled:opacity-50"
            style={{ background: 'hsl(160 84% 39% / 0.15)', color: '#10B981', border: '1px solid hsl(160 84% 39% / 0.3)' }}
          >
            {isBusy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
            Check-In
          </button>
        )}
        {type === 'departure' && (
          <button
            onClick={() => onCheckOut(res.id)}
            disabled={isMutating}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all disabled:opacity-50"
            style={{ background: 'hsl(0 72% 51% / 0.1)', color: '#EF4444', border: '1px solid hsl(0 72% 51% / 0.3)' }}
          >
            {isBusy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
            Check-Out
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <Card style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.5} />
            Arrivées &amp; Départs
          </CardTitle>
          {(arrivals.length + departures.length > 0) && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ background: 'hsl(160 84% 39% / 0.12)', color: '#10B981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Aujourd&apos;hui
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {arrivals.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <LogIn className="w-3 h-3 text-emerald-400" /> Arrivées du jour ({arrivals.length})
            </p>
            {arrivals.map(r => <EventRow key={r.id} res={r} type="arrival" />)}
          </div>
        )}
        {departures.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <LogOut className="w-3 h-3 text-red-400" /> Départs du jour ({departures.length})
            </p>
            {departures.map(r => <EventRow key={r.id} res={r} type="departure" />)}
          </div>
        )}
        {upcomingArrivals.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-blue-400" /> Prochaines arrivées ({upcomingArrivals.length})
            </p>
            {upcomingArrivals.map(r => <EventRow key={r.id} res={r} type="upcoming" />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANT — Répartition types de chambre
═══════════════════════════════════════════ */
function RoomTypeBreakdown({ rooms }: { rooms: HotelRoom[] }) {
  const breakdown = useMemo(() => {
    return Object.entries(
      rooms.reduce((acc, r) => {
        if (!acc[r.type]) acc[r.type] = { total: 0, occupied: 0, reserved: 0, available: 0 };
        acc[r.type].total++;
        if (r.status === 'OCCUPIED')  acc[r.type].occupied++;
        if (r.status === 'RESERVED')  acc[r.type].reserved++;
        if (r.status === 'AVAILABLE') acc[r.type].available++;
        return acc;
      }, {} as Record<string, { total: number; occupied: number; reserved: number; available: number }>)
    ).map(([type, data]) => ({ type: type as HotelRoomType, ...data }));
  }, [rooms]);

  return (
    <Card style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <BedDouble className="w-4 h-4" style={{ color: '#A78BFA' }} strokeWidth={1.5} />
          Répartition par type
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {breakdown.map((t, i) => {
          const cfg = TYPE_CFG[t.type];
          const pct = t.total > 0 ? Math.round(((t.occupied + t.reserved) / t.total) * 100) : 0;
          return (
            <motion.div
              key={t.type}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'hsl(var(--muted))' }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${cfg.color}15` }}>
                <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'hsl(var(--border))' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">{t.total} chambres</span>
                  <span className="text-[10px]" style={{ color: '#10B981' }}>{t.available} libres</span>
                  <span className="text-[10px]" style={{ color: '#EF4444' }}>{t.occupied} occupées</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MODAL — Nouvelle réservation rapide
═══════════════════════════════════════════ */
function QuickReservationModal({ room, onClose, onConfirm, isPending }: {
  room: HotelRoom;
  onClose: () => void;
  onConfirm: (data: { guestName: string; guestPhone: string; checkInDate: string; checkOutDate: string }) => void;
  isPending: boolean;
}) {
  const today    = toISO(new Date());
  const tomorrow = toISO(new Date(Date.now() + 86400000));
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [cin, setCin]         = useState(today);
  const [cout, setCout]       = useState(tomorrow);

  const nights = Math.max(0, Math.ceil((new Date(cout).getTime() - new Date(cin).getTime()) / 86400000));
  const total  = nights * room.pricePerNight;
  const valid  = name.trim().length >= 2 && nights > 0;
  const cfg    = STATUS_CFG[room.status];
  const tcfg   = TYPE_CFG[room.type];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.65)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
              <tcfg.icon className="w-5 h-5" style={{ color: cfg.color }} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">Chambre {room.number}</h3>
              <p className="text-xs text-muted-foreground">{tcfg.label} · Étage {room.floor} · {formatXAF(room.pricePerNight)}/nuit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Nom du client *', icon: User, value: name, setter: setName, placeholder: 'M. Jean-Pierre Kamdem', type: 'text' },
            { label: 'Téléphone', icon: Phone, value: phone, setter: setPhone, placeholder: '+237 6XX XXX XXX', type: 'text' },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <f.icon className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                  className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Arrivée *', value: cin, setter: setCin, min: today },
              { label: 'Départ *',  value: cout, setter: setCout, min: toISO(new Date(new Date(cin).getTime() + 86400000)) },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <input type="date" value={f.value} min={f.min} onChange={e => f.setter(e.target.value)}
                    className="bg-transparent flex-1 text-xs text-foreground outline-none" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
            ))}
          </div>
          {nights > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'hsl(38 90% 56% / 0.07)', border: '1px solid hsl(38 90% 56% / 0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />Durée
                </span>
                <span className="text-xs font-bold text-foreground">{nights} nuit{nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid hsl(38 90% 56% / 0.2)' }}>
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-lg font-extrabold" style={{ color: 'hsl(38 90% 56%)', letterSpacing: '-0.02em' }}>
                  {formatXAF(total)}
                </span>
              </div>
            </motion.div>
          )}
          <motion.button
            onClick={() => valid && onConfirm({ guestName: name.trim(), guestPhone: phone.trim(), checkInDate: cin, checkOutDate: cout })}
            disabled={!valid || isPending}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: valid ? 'hsl(38 90% 56%)' : 'hsl(var(--muted))', color: valid ? '#000' : 'hsl(var(--muted-foreground))' }}
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><PlusCircle className="w-4 h-4" />Confirmer</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════ */
type Modal = { type: 'none' } | { type: 'reserve'; room: HotelRoom } | { type: 'success'; guestName: string; roomNumber: string; total: number; nights: number };

export default function HotelDashboard() {
  const { business } = useAuth();
  const queryClient  = useQueryClient();
  const { toast }    = useToast();

  const [modal, setModal]           = useState<Modal>({ type: 'none' });
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const bId      = business?.id ?? 0;
  const roomsKey = getListHotelRoomsQueryKey({ businessId: bId });
  const resKey   = getListHotelReservationsQueryKey({ businessId: bId });
  const statsKey = getGetHotelStatsQueryKey({ businessId: bId });

  const { data: stats,        isLoading: statsLoading } = useGetHotelStats(
    { businessId: bId }, { query: { enabled: !!bId, queryKey: statsKey, refetchInterval: 30000 } },
  );
  const { data: rooms,        isLoading: roomsLoading } = useListHotelRooms(
    { businessId: bId }, { query: { enabled: !!bId, queryKey: roomsKey, refetchInterval: 30000 } },
  );
  const { data: reservations, isLoading: resLoading }   = useListHotelReservations(
    { businessId: bId }, { query: { enabled: !!bId, queryKey: resKey, refetchInterval: 30000 } },
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: roomsKey });
    queryClient.invalidateQueries({ queryKey: resKey });
    queryClient.invalidateQueries({ queryKey: statsKey });
  };

  const { mutate: createReservation, isPending: isCreating } = useCreateHotelReservation({
    mutation: {
      onSuccess: (res) => {
        invalidate();
        if (modal.type === 'reserve') {
          const nights = Math.ceil((new Date(res.checkOutDate).getTime() - new Date(res.checkInDate).getTime()) / 86400000);
          setModal({ type: 'success', guestName: res.guestName, roomNumber: res.roomNumber, total: res.totalAmount, nights });
        }
      },
      onError: () => {
        setModal({ type: 'none' });
        toast({ title: 'Erreur', description: 'Impossible de créer la réservation', variant: 'destructive' });
      },
    },
  });

  const { mutate: checkIn } = useHotelCheckIn({
    mutation: {
      onSuccess: (res) => {
        invalidate(); setIsMutating(false); setMutatingId(null);
        toast({ title: '✅ Check-in effectué', description: `${res.guestName} est enregistré(e)` });
      },
      onError: () => { setIsMutating(false); setMutatingId(null); toast({ title: 'Erreur', variant: 'destructive' }); },
    },
  });

  const { mutate: checkOut } = useHotelCheckOut({
    mutation: {
      onSuccess: (res) => {
        invalidate(); setIsMutating(false); setMutatingId(null);
        toast({ title: '✅ Check-out effectué', description: `${res.guestName} a libéré la chambre` });
      },
      onError: () => { setIsMutating(false); setMutatingId(null); toast({ title: 'Erreur', variant: 'destructive' }); },
    },
  });

  /* ── Floor plan helpers ── */
  const roomsByFloor = useMemo(() =>
    (rooms ?? []).reduce((acc, r) => {
      if (!acc[r.floor]) acc[r.floor] = [];
      acc[r.floor].push(r);
      return acc;
    }, {} as Record<number, HotelRoom[]>),
  [rooms]);
  const floors = Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a);

  /* ── Computed stats for hero ── */
  const occupancyRate  = stats?.occupancyRate ?? 0;
  const availableRooms = stats?.availableRooms ?? 0;
  const nightlyRevenue = stats?.nightlyRevenue ?? 0;
  const totalRooms     = rooms?.length ?? 0;
  const occupiedCount  = (rooms ?? []).filter(r => r.status === 'OCCUPIED').length;

  return (
    <div className="p-6 md:p-8 space-y-6 page-enter">

      {/* ── Hero ── */}
      <DashboardHero
        title="Tableau de bord Hôtel"
        subtitle="Gestion des chambres, réservations et revenus en temps réel"
        gradient="linear-gradient(135deg,#1D4ED8,#3B82F6)"
        color="#60A5FA"
        bg="rgba(96,165,250,0.08)"
        icon={BedDouble}
        badge="PRO"
        stats={stats ? [
          { label: 'occupation', value: `${Math.round(occupancyRate)}%` },
          { label: 'chambres libres', value: String(availableRooms) },
          { label: 'revenu nuitée', value: new Intl.NumberFormat('fr-FR').format(nightlyRevenue) + ' FCFA' },
          ...(stats.arrivalsToday > 0 ? [{ label: 'arrivées aujourd\'hui', value: String(stats.arrivalsToday) }] : []),
        ] : undefined}
      />

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Taux d'occupation" value={`${Math.round(occupancyRate)}%`} icon={Activity}    accent staggerIndex={0} />
            <KPICard title="Chambres libres"   value={availableRooms}                  icon={DoorOpen}   color="#10B981" staggerIndex={1} />
            <KPICard title="Arrivées du jour"  value={stats.arrivalsToday}             icon={Calendar}   color="#60A5FA" staggerIndex={2} />
            <KPICard title="Revenu Nuitée"     value={nightlyRevenue}                  icon={Receipt}    isCurrency color="#A78BFA" staggerIndex={3} />
          </>
        ) : null}
      </div>

      {/* ── Occupation + Revenue management ── */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-5">
        <OccupancyGauge
          rate={occupancyRate}
          available={availableRooms}
          occupied={occupiedCount}
          total={totalRooms}
        />
        {resLoading ? (
          <Skeleton className="md:col-span-2 h-64 rounded-xl" />
        ) : (
          <div className="md:col-span-2">
            <RevenueManagement
              reservations={reservations ?? []}
              rooms={rooms ?? []}
            />
          </div>
        )}
      </div>

      {/* ── Revenus 7 jours + Répartition types ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5">
        {resLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <WeeklyRevenueChart reservations={reservations ?? []} />
        )}
        {roomsLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <RoomTypeBreakdown rooms={rooms ?? []} />
        )}
      </div>

      {/* ── Timeline + Plan des chambres ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">
        <div>
          {resLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : (
            <TodayTimeline
              reservations={reservations ?? []}
              onCheckIn={(id) => { setIsMutating(true); setMutatingId(id); checkIn({ id }); }}
              onCheckOut={(id) => { setIsMutating(true); setMutatingId(id); checkOut({ id }); }}
              isMutating={isMutating}
              mutatingId={mutatingId}
            />
          )}
        </div>

        {/* Plan des chambres */}
        <Card className="lg:col-span-2" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <BedDouble className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.5} />
              Plan des chambres
            </CardTitle>
            <div className="flex items-center gap-3">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <div key={key} className="hidden sm:flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="space-y-4">
                {[3, 2, 1].map(f => (
                  <div key={f} className="space-y-2">
                    <Skeleton className="h-5 w-20 rounded" />
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : floors.length > 0 ? (
              <div className="space-y-5">
                {floors.map(floor => (
                  <div key={floor} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1"
                      style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      Étage {floor}
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {roomsByFloor[floor].map(room => {
                        const s   = STATUS_CFG[room.status];
                        const t   = TYPE_CFG[room.type];
                        return (
                          <motion.button
                            key={room.id}
                            whileHover={{ scale: 1.06, y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => room.status === 'AVAILABLE' && setModal({ type: 'reserve', room })}
                            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all"
                            style={{
                              background: s.bg,
                              border: `1px solid ${s.border}`,
                              cursor: room.status === 'AVAILABLE' ? 'pointer' : 'default',
                            }}
                          >
                            <span className="text-sm font-extrabold text-foreground">{room.number}</span>
                            <t.icon className="w-3 h-3" style={{ color: s.color }} strokeWidth={2} />
                            <span className="text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <BedDouble className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">Aucune chambre configurée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal.type === 'reserve' && (
          <QuickReservationModal
            key="reserve"
            room={modal.room}
            onClose={() => setModal({ type: 'none' })}
            onConfirm={(data) => createReservation({ data: { ...data, businessId: bId, roomId: modal.room.id } })}
            isPending={isCreating}
          />
        )}
        {modal.type === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsl(0 0% 0% / 0.65)' }}
          >
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-full max-w-xs rounded-2xl overflow-hidden text-center"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <div className="p-8 space-y-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'hsl(217 91% 60% / 0.15)' }}>
                  <CheckCircle2 className="w-9 h-9" style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
                    Réservation confirmée !
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chambre {modal.roomNumber} · {modal.guestName}
                  </p>
                  <div className="mt-3 px-4 py-2 rounded-xl inline-block" style={{ background: 'hsl(38 90% 56% / 0.1)' }}>
                    <span className="text-base font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>
                      {formatXAF(modal.total)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      · {modal.nights} nuit{modal.nights > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setModal({ type: 'none' }); invalidate(); }}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
                >
                  Parfait !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {business && <ReviewsSection businessId={business.id} sector="HOTEL" />}
    </div>
  );
}
