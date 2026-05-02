import { useState, useMemo } from 'react';
import {
  useListHotelRooms,
  useListHotelReservations,
  useGetHotelStats,
  useHotelCheckIn,
  useHotelCheckOut,
  useCreateHotelReservation,
  getListHotelRoomsQueryKey,
  getListHotelReservationsQueryKey,
  getGetHotelStatsQueryKey,
  HotelRoom,
  HotelRoomStatus,
  HotelRoomType,
  HotelReservation,
} from '@workspace/api-client-react';
import { DashboardHero } from '@/components/dashboard-hero';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  BedDouble, Star, Crown, Sparkles,
  User, Calendar, LogIn, LogOut,
  Percent, DollarSign, X, Phone,
  PlusCircle, CheckCircle2, RefreshCw,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG: Record<HotelRoomStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Libre',      color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)' },
  OCCUPIED:  { label: 'Occupée',    color: '#EF4444', bg: 'hsl(0 72% 51% / 0.12)'   },
  RESERVED:  { label: 'Réservée',   color: '#3B82F6', bg: 'hsl(217 91% 60% / 0.12)' },
  CLEANING:  { label: 'Nettoyage',  color: '#F59E0B', bg: 'hsl(38 90% 56% / 0.12)'  },
};

const TYPE_CONFIG: Record<HotelRoomType, { label: string; icon: React.ElementType }> = {
  STANDARD:     { label: 'Standard',       icon: BedDouble  },
  SUPERIOR:     { label: 'Supérieure',     icon: Star       },
  SUITE:        { label: 'Suite',          icon: Sparkles   },
  PRESIDENTIAL: { label: 'Présidentielle', icon: Crown      },
};

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

/* ─────────────────────────────────────────
   MODAL 1 — Nouvelle réservation (chambre LIBRE)
───────────────────────────────────────── */
function NewReservationModal({
  room,
  onClose,
  onConfirm,
  isPending,
}: {
  room: HotelRoom;
  onClose: () => void;
  onConfirm: (data: { guestName: string; guestPhone: string; checkInDate: string; checkOutDate: string }) => void;
  isPending: boolean;
}) {
  const today = toISODate(new Date());
  const tomorrow = toISODate(new Date(Date.now() + 86400000));

  const [guestName, setGuestName]     = useState('');
  const [guestPhone, setGuestPhone]   = useState('');
  const [checkIn, setCheckIn]         = useState(today);
  const [checkOut, setCheckOut]       = useState(tomorrow);
  const [showSuccess, setShowSuccess] = useState(false);

  const nights = useMemo(() => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return diff > 0 ? Math.ceil(diff / 86400000) : 0;
  }, [checkIn, checkOut]);

  const total = nights * room.pricePerNight;
  const valid = guestName.trim().length >= 2 && nights > 0;

  const s = STATUS_CONFIG[room.status];
  const t = TYPE_CONFIG[room.type];
  const TypeIcon = t.icon;

  const handleSubmit = () => {
    if (!valid) return;
    onConfirm({ guestName: guestName.trim(), guestPhone: guestPhone.trim(), checkInDate: checkIn, checkOutDate: checkOut });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.65)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <TypeIcon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">Réserver la chambre {room.number}</h3>
              <p className="text-xs text-muted-foreground">{t.label} · Étage {room.floor} · {formatXAF(room.pricePerNight)}/nuit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Guest name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nom du client <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
              <User className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Ex: M. Jean-Pierre Kamdem"
                className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Guest phone */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Téléphone</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <input
                value={guestPhone}
                onChange={e => setGuestPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Arrivée <span style={{ color: '#EF4444' }}>*</span></label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={e => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) {
                      setCheckOut(toISODate(new Date(new Date(e.target.value).getTime() + 86400000)));
                    }
                  }}
                  className="bg-transparent flex-1 text-xs text-foreground outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Départ <span style={{ color: '#EF4444' }}>*</span></label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <input
                  type="date"
                  value={checkOut}
                  min={toISODate(new Date(new Date(checkIn).getTime() + 86400000))}
                  onChange={e => setCheckOut(e.target.value)}
                  className="bg-transparent flex-1 text-xs text-foreground outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {nights > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'hsl(38 90% 56% / 0.07)', border: '1px solid hsl(38 90% 56% / 0.2)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Durée du séjour
                </div>
                <span className="text-xs font-bold text-foreground">{nights} nuit{nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between" style={{ borderTop: '1px solid hsl(38 90% 56% / 0.2)', paddingTop: '8px' }}>
                <span className="text-sm font-semibold text-foreground">Total à régler</span>
                <span className="text-lg font-extrabold" style={{ color: 'hsl(38 90% 56%)', letterSpacing: '-0.02em' }}>
                  {formatXAF(total)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Confirm button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!valid || isPending}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: valid ? 'hsl(38 90% 56%)' : 'hsl(var(--muted))',
              color: valid ? '#000' : 'hsl(var(--muted-foreground))',
            }}
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Confirmer la réservation
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   MODAL 2 — Détail chambre (occupée / réservée / nettoyage)
───────────────────────────────────────── */
function RoomDetailModal({
  room,
  reservations,
  onClose,
  onCheckIn,
  onCheckOut,
  isLoading,
}: {
  room: HotelRoom;
  reservations: HotelReservation[];
  onClose: () => void;
  onCheckIn: (resId: number) => void;
  onCheckOut: (resId: number) => void;
  isLoading: boolean;
}) {
  const s = STATUS_CONFIG[room.status];
  const t = TYPE_CONFIG[room.type];
  const TypeIcon = t.icon;
  const pendingRes = reservations.find(r => r.roomId === room.id);
  const nights = pendingRes
    ? Math.ceil((new Date(pendingRes.checkOutDate).getTime() - new Date(pendingRes.checkInDate).getTime()) / 86400000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="p-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <TypeIcon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Chambre {room.number}</h3>
                <p className="text-xs text-muted-foreground">{t.label} · Étage {room.floor}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="text-sm font-bold text-foreground">
              {formatXAF(room.pricePerNight)}<span className="text-xs text-muted-foreground font-normal">/nuit</span>
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Client actuel */}
          {room.status === 'OCCUPIED' && room.currentGuestName && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client actuel</p>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'hsl(0 72% 51% / 0.15)', color: '#EF4444' }}>
                  {room.currentGuestName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{room.currentGuestName}</p>
                  {room.checkoutDate && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Check-out : {new Date(room.checkoutDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Réservation */}
          {pendingRes && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Détails réservation</p>
              <div className="p-3 rounded-xl space-y-2" style={{ background: 'hsl(var(--muted))' }}>
                {[
                  { label: 'Client', value: pendingRes.guestName },
                  pendingRes.guestPhone ? { label: 'Téléphone', value: pendingRes.guestPhone } : null,
                  { label: 'Arrivée', value: new Date(pendingRes.checkInDate).toLocaleDateString('fr-FR') },
                  { label: 'Départ', value: new Date(pendingRes.checkOutDate).toLocaleDateString('fr-FR') },
                ].filter(Boolean).map((row, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row!.label}</span>
                    <span className="font-semibold text-foreground">{row!.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <span className="text-muted-foreground">Total ({nights}n)</span>
                  <span className="font-bold" style={{ color: 'hsl(38 90% 56%)' }}>{formatXAF(pendingRes.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Chambre en nettoyage */}
          {room.status === 'CLEANING' && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(38 90% 56% / 0.08)', border: '1px solid hsl(38 90% 56% / 0.2)' }}>
              <span className="text-lg">🧹</span>
              <p className="text-xs text-muted-foreground">Cette chambre est en cours de nettoyage et sera disponible prochainement.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {room.status === 'RESERVED' && pendingRes && (
              <button
                onClick={() => onCheckIn(pendingRes.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'hsl(160 84% 39% / 0.15)', color: '#10B981', border: '1px solid hsl(160 84% 39% / 0.3)' }}
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                Check-In
              </button>
            )}
            {room.status === 'OCCUPIED' && pendingRes && (
              <button
                onClick={() => onCheckOut(pendingRes.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'hsl(0 72% 51% / 0.1)', color: '#EF4444', border: '1px solid hsl(0 72% 51% / 0.3)' }}
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Check-Out
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   MODAL 3 — Succès réservation
───────────────────────────────────────── */
function ReservationSuccessModal({ guestName, roomNumber, total, nights, onClose }: {
  guestName: string; roomNumber: string; total: number; nights: number; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.65)' }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
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
              Chambre {roomNumber} · {guestName}
            </p>
            <div className="mt-3 px-4 py-2 rounded-xl inline-block" style={{ background: 'hsl(38 90% 56% / 0.1)' }}>
              <span className="text-base font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>{formatXAF(total)}</span>
              <span className="text-xs text-muted-foreground ml-1">· {nights} nuit{nights > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
          >
            Parfait !
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────── */
type ModalState =
  | { type: 'none' }
  | { type: 'new-reservation'; room: HotelRoom }
  | { type: 'detail'; room: HotelRoom }
  | { type: 'success'; guestName: string; roomNumber: string; total: number; nights: number };

function StatBadge({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.5} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>{value}</span>
    </div>
  );
}

export default function HotelRoomsPage() {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modal, setModal]           = useState<ModalState>({ type: 'none' });
  const [filterStatus, setFilter]   = useState<HotelRoomStatus | 'ALL'>('ALL');
  const [mutatingId, setMutatingId] = useState<number | null>(null);

  const bId     = business?.id ?? 0;
  const roomsKey = getListHotelRoomsQueryKey({ businessId: bId });
  const resKey   = getListHotelReservationsQueryKey({ businessId: bId });
  const statsKey = getGetHotelStatsQueryKey({ businessId: bId });

  const { data: rooms, isLoading: roomsLoading } = useListHotelRooms(
    { businessId: bId },
    { query: { queryKey: roomsKey, enabled: !!bId, refetchInterval: 20000 } },
  );
  const { data: reservations } = useListHotelReservations(
    { businessId: bId },
    { query: { queryKey: resKey, enabled: !!bId } },
  );
  const { data: stats } = useGetHotelStats(
    { businessId: bId },
    { query: { queryKey: statsKey, enabled: !!bId } },
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: roomsKey });
    queryClient.invalidateQueries({ queryKey: resKey });
    queryClient.invalidateQueries({ queryKey: statsKey });
  };

  /* ── Mutation : nouvelle réservation ── */
  const { mutate: createReservation, isPending: isCreating } = useCreateHotelReservation({
    mutation: {
      onSuccess: (res) => {
        invalidate();
        const room = modal.type === 'new-reservation' ? modal.room : null;
        const nights = Math.ceil(
          (new Date(res.checkOutDate).getTime() - new Date(res.checkInDate).getTime()) / 86400000
        );
        setModal({ type: 'success', guestName: res.guestName, roomNumber: res.roomNumber, total: res.totalAmount, nights });
      },
      onError: () => toast({ title: 'Erreur', description: 'Réservation impossible', variant: 'destructive' }),
    },
  });

  /* ── Mutation : check-in ── */
  const { mutate: checkIn } = useHotelCheckIn({
    mutation: {
      onSuccess: (res) => {
        invalidate();
        setMutatingId(null);
        setModal({ type: 'none' });
        toast({ title: '✅ Check-in effectué', description: `${res.guestName} est enregistré(e)` });
      },
      onError: () => { setMutatingId(null); toast({ title: 'Erreur', variant: 'destructive' }); },
    },
  });

  /* ── Mutation : check-out ── */
  const { mutate: checkOut } = useHotelCheckOut({
    mutation: {
      onSuccess: (res) => {
        invalidate();
        setMutatingId(null);
        setModal({ type: 'none' });
        toast({ title: '✅ Check-out effectué', description: `${res.guestName} a quitté la chambre` });
      },
      onError: () => { setMutatingId(null); toast({ title: 'Erreur', variant: 'destructive' }); },
    },
  });

  const handleRoomClick = (room: HotelRoom) => {
    if (room.status === 'AVAILABLE') {
      setModal({ type: 'new-reservation', room });
    } else {
      setModal({ type: 'detail', room });
    }
  };

  const handleReserve = (data: { guestName: string; guestPhone: string; checkInDate: string; checkOutDate: string }) => {
    if (modal.type !== 'new-reservation') return;
    createReservation({ data: { businessId: bId, roomId: modal.room.id, ...data } });
  };

  const filtered = filterStatus === 'ALL' ? (rooms ?? []) : (rooms ?? []).filter(r => r.status === filterStatus);

  const STATUS_FILTERS: { value: HotelRoomStatus | 'ALL'; label: string; color?: string }[] = [
    { value: 'ALL',       label: 'Toutes' },
    { value: 'AVAILABLE', label: 'Libres',     color: '#10B981' },
    { value: 'OCCUPIED',  label: 'Occupées',   color: '#EF4444' },
    { value: 'RESERVED',  label: 'Réservées',  color: '#3B82F6' },
    { value: 'CLEANING',  label: 'Nettoyage',  color: '#F59E0B' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 page-enter">
      <DashboardHero
        title="Grille des chambres"
        subtitle="Cliquez sur une chambre libre pour réserver · Temps réel"
        gradient="linear-gradient(135deg,#1D4ED8,#3B82F6)"
        color="#60A5FA"
        bg="rgba(96,165,250,0.08)"
        icon={BedDouble}
        badge="LIVE"
        stats={stats ? [
          { label: 'occupation', value: `${Math.round(stats.occupancyRate)}%` },
          { label: 'libres', value: String(stats.availableRooms) },
          { label: 'arrivées', value: String(stats.arrivalsToday) },
        ] : undefined}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBadge label="Taux d'occupation" value={`${stats?.occupancyRate?.toFixed(1) ?? 0}%`} icon={Percent} color="#F59E0B" />
        <StatBadge label="Chambres libres"   value={stats?.availableRooms ?? '—'}                icon={BedDouble} color="#10B981" />
        <StatBadge label="Arrivées du jour"  value={stats?.arrivalsToday ?? '—'}                 icon={LogIn}  color="#3B82F6" />
        <StatBadge label="Revenu / nuit"     value={stats ? formatXAF(stats.nightlyRevenue) : '—'} icon={DollarSign} color="#F59E0B" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => {
          const isActive = filterStatus === f.value;
          const count = f.value === 'ALL'
            ? (rooms?.length ?? 0)
            : (rooms?.filter(r => r.status === f.value).length ?? 0);
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: isActive ? (f.color ? `${f.color}20` : 'hsl(38 90% 56% / 0.15)') : 'hsl(var(--muted))',
                border: `1px solid ${isActive ? (f.color ?? 'hsl(38 90% 56%)') + '50' : 'transparent'}`,
                color: isActive ? (f.color ?? 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
              }}
            >
              {f.color && <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />}
              {f.label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grille */}
      {roomsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array(15).fill(0).map((_, i) => <Skeleton key={i} className="h-[130px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <BedDouble className="w-12 h-12 text-muted-foreground/20" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Aucune chambre dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(room => {
            const s = STATUS_CONFIG[room.status];
            const t = TYPE_CONFIG[room.type];
            const TypeIcon = t.icon;
            const isAvailable = room.status === 'AVAILABLE';
            return (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleRoomClick(room)}
                className="flex flex-col gap-2 p-4 rounded-xl text-left transition-all relative overflow-hidden"
                style={{ background: s.bg, border: `1.5px solid ${s.color}40` }}
              >
                {/* "+" badge for available rooms */}
                {isAvailable && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#10B981', color: '#fff' }}>
                    <span className="text-[11px] font-bold leading-none">+</span>
                  </div>
                )}
                <div className="flex items-start justify-between pr-5">
                  <span className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
                    {room.number}
                  </span>
                  {!isAvailable && (
                    <span className="w-2.5 h-2.5 rounded-full mt-1"
                      style={{ background: s.color, boxShadow: `0 0 6px ${s.color}80` }} />
                  )}
                </div>
                <TypeIcon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.5} />
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.label}</p>
                </div>
                {room.currentGuestName && (
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0" />{room.currentGuestName}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-foreground">
                  {formatXAF(room.pricePerNight)}<span className="font-normal text-muted-foreground">/n</span>
                </p>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Légende */}
      <div className="flex flex-wrap gap-4 pt-1">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
            {key === 'AVAILABLE' && <span className="text-[10px] text-muted-foreground/60">· cliquer pour réserver</span>}
          </div>
        ))}
      </div>

      {/* Modales */}
      <AnimatePresence>
        {modal.type === 'new-reservation' && (
          <NewReservationModal
            key="new-res"
            room={modal.room}
            onClose={() => setModal({ type: 'none' })}
            onConfirm={handleReserve}
            isPending={isCreating}
          />
        )}
        {modal.type === 'detail' && (
          <RoomDetailModal
            key="detail"
            room={modal.room}
            reservations={reservations ?? []}
            onClose={() => setModal({ type: 'none' })}
            onCheckIn={id => { setMutatingId(id); checkIn({ id }); }}
            onCheckOut={id => { setMutatingId(id); checkOut({ id }); }}
            isLoading={mutatingId !== null}
          />
        )}
        {modal.type === 'success' && (
          <ReservationSuccessModal
            key="success"
            guestName={modal.guestName}
            roomNumber={modal.roomNumber}
            total={modal.total}
            nights={modal.nights}
            onClose={() => setModal({ type: 'none' })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
