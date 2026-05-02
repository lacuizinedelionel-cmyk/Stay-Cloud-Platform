import { useState } from 'react';
import {
  useListHotelRooms,
  useListHotelReservations,
  useGetHotelStats,
  useHotelCheckIn,
  useHotelCheckOut,
  getListHotelRoomsQueryKey,
  getListHotelReservationsQueryKey,
  getGetHotelStatsQueryKey,
  HotelRoom,
  HotelRoomStatus,
  HotelRoomType,
  HotelReservation,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  BedDouble,
  Star,
  Crown,
  Sparkles,
  User,
  Calendar,
  LogIn,
  LogOut,
  TrendingUp,
  Percent,
  DollarSign,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG: Record<HotelRoomStatus, { label: string; color: string; bg: string; dot: string }> = {
  AVAILABLE: { label: 'Libre', color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)', dot: '#10B981' },
  OCCUPIED:  { label: 'Occupée', color: '#EF4444', bg: 'hsl(0 72% 51% / 0.12)', dot: '#EF4444' },
  RESERVED:  { label: 'Réservée', color: '#3B82F6', bg: 'hsl(217 91% 60% / 0.12)', dot: '#3B82F6' },
  CLEANING:  { label: 'Nettoyage', color: '#F59E0B', bg: 'hsl(38 90% 56% / 0.12)', dot: '#F59E0B' },
};

const TYPE_CONFIG: Record<HotelRoomType, { label: string; icon: React.ElementType; priceLabel: string }> = {
  STANDARD:     { label: 'Standard', icon: BedDouble, priceLabel: 'nuit' },
  SUPERIOR:     { label: 'Supérieure', icon: Star, priceLabel: 'nuit' },
  SUITE:        { label: 'Suite', icon: Sparkles, priceLabel: 'nuit' },
  PRESIDENTIAL: { label: 'Présidentielle', icon: Crown, priceLabel: 'nuit' },
};

function StatBadge({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.5} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>{value}</span>
    </div>
  );
}

function RoomDetailModal({ room, reservations, onClose, onCheckIn, onCheckOut, isLoading }: {
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
            <span className="text-sm font-bold text-foreground">{formatXAF(room.pricePerNight)}<span className="text-xs text-muted-foreground font-normal">/nuit</span></span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {(room.status === 'OCCUPIED' && room.currentGuestName) && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client actuel</p>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'hsl(0 72% 51% / 0.15)', color: '#EF4444' }}>
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

          {pendingRes && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Réservation</p>
              <div className="p-3 rounded-xl space-y-2" style={{ background: 'hsl(var(--muted))' }}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-semibold text-foreground">{pendingRes.guestName}</span>
                </div>
                {pendingRes.guestPhone && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-semibold text-foreground">{pendingRes.guestPhone}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Arrivée</span>
                  <span className="font-semibold text-foreground">{new Date(pendingRes.checkInDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Départ</span>
                  <span className="font-semibold text-foreground">{new Date(pendingRes.checkOutDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between text-xs pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <span className="text-muted-foreground">Total ({nights}n)</span>
                  <span className="font-bold text-foreground">{formatXAF(pendingRes.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {room.status === 'RESERVED' && pendingRes && (
              <button
                onClick={() => onCheckIn(pendingRes.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'hsl(160 84% 39% / 0.15)', color: '#10B981', border: '1px solid hsl(160 84% 39% / 0.3)' }}
              >
                <LogIn className="w-4 h-4" />
                Check-In
              </button>
            )}
            {room.status === 'OCCUPIED' && pendingRes && (
              <button
                onClick={() => onCheckOut(pendingRes.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'hsl(0 72% 51% / 0.1)', color: '#EF4444', border: '1px solid hsl(0 72% 51% / 0.3)' }}
              >
                <LogOut className="w-4 h-4" />
                Check-Out
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HotelRoomsPage() {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [filterStatus, setFilterStatus] = useState<HotelRoomStatus | 'ALL'>('ALL');
  const [mutatingId, setMutatingId] = useState<number | null>(null);

  const bId = business?.id ?? 0;
  const roomsKey = getListHotelRoomsQueryKey({ businessId: bId });
  const resKey = getListHotelReservationsQueryKey({ businessId: bId });
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

  const { mutate: checkIn } = useHotelCheckIn({
    mutation: {
      onSuccess: (res) => {
        invalidate();
        setMutatingId(null);
        setSelectedRoom(null);
        toast({ title: 'Check-in effectué', description: `${res.guestName} est maintenant enregistré(e)` });
      },
      onError: () => { setMutatingId(null); toast({ title: 'Erreur', variant: 'destructive' }); },
    },
  });

  const { mutate: checkOut } = useHotelCheckOut({
    mutation: {
      onSuccess: (res) => {
        invalidate();
        setMutatingId(null);
        setSelectedRoom(null);
        toast({ title: 'Check-out effectué', description: `${res.guestName} a quitté la chambre` });
      },
      onError: () => { setMutatingId(null); toast({ title: 'Erreur', variant: 'destructive' }); },
    },
  });

  const handleCheckIn = (resId: number) => {
    setMutatingId(resId);
    checkIn({ id: resId });
  };
  const handleCheckOut = (resId: number) => {
    setMutatingId(resId);
    checkOut({ id: resId });
  };

  const filtered = filterStatus === 'ALL' ? (rooms ?? []) : (rooms ?? []).filter(r => r.status === filterStatus);

  const STATUS_FILTERS: { value: HotelRoomStatus | 'ALL'; label: string; color?: string }[] = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'AVAILABLE', label: 'Libres', color: '#10B981' },
    { value: 'OCCUPIED', label: 'Occupées', color: '#EF4444' },
    { value: 'RESERVED', label: 'Réservées', color: '#3B82F6' },
    { value: 'CLEANING', label: 'Nettoyage', color: '#F59E0B' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
            Grille des chambres
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {rooms?.length ?? 0} chambres · Cliquez pour voir les détails
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'hsl(160 84% 39% / 0.12)', color: '#10B981' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Temps réel
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBadge label="Taux d'occupation" value={`${stats?.occupancyRate?.toFixed(1) ?? 0}%`} icon={Percent} color="#F59E0B" />
        <StatBadge label="Chambres libres" value={stats?.availableRooms ?? '—'} icon={BedDouble} color="#10B981" />
        <StatBadge label="Arrivées du jour" value={stats?.arrivalsToday ?? '—'} icon={LogIn} color="#3B82F6" />
        <StatBadge label="Revenu nuit" value={stats ? formatXAF(stats.nightlyRevenue) : '—'} icon={DollarSign} color="#F59E0B" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => {
          const isActive = filterStatus === f.value;
          const count = f.value === 'ALL' ? (rooms?.length ?? 0) : (rooms?.filter(r => r.status === f.value).length ?? 0);
          return (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: isActive ? (f.color ? `${f.color}20` : 'hsl(38 90% 56% / 0.15)') : 'hsl(var(--muted))',
                border: `1px solid ${isActive ? (f.color ?? 'hsl(38 90% 56%)') + '50' : 'transparent'}`,
                color: isActive ? (f.color ?? 'hsl(38 90% 56%)') : 'hsl(var(--muted-foreground))',
              }}
            >
              {f.color && <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />}
              {f.label}
              <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Room grid */}
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
          {filtered.map((room) => {
            const s = STATUS_CONFIG[room.status];
            const t = TYPE_CONFIG[room.type];
            const TypeIcon = t.icon;
            return (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRoom(room)}
                className="flex flex-col gap-2 p-4 rounded-xl text-left transition-all"
                style={{
                  background: s.bg,
                  border: `1.5px solid ${s.color}40`,
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-lg font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
                    {room.number}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}80` }} />
                </div>
                <TypeIcon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.5} />
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.label}</p>
                </div>
                {room.currentGuestName && (
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0" />
                    {room.currentGuestName}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-foreground">{formatXAF(room.pricePerNight)}<span className="font-normal text-muted-foreground">/n</span></p>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Légende */}
      <div className="flex flex-wrap gap-4 pt-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <RoomDetailModal
            room={selectedRoom}
            reservations={reservations ?? []}
            onClose={() => setSelectedRoom(null)}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            isLoading={mutatingId !== null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
