import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  useGetHotelStats, 
  useListHotelRooms, 
  getListHotelRoomsQueryKey,
  useListHotelReservations,
  HotelRoomStatus,
  HotelRoomType
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Bed, Users, Calendar, Receipt, DoorOpen, BedDouble, DoorClosed, Sparkles } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function HotelDashboard() {
  const { business } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  
  const { data: stats, isLoading: statsLoading } = useGetHotelStats(
    { businessId: business?.id },
    { query: { enabled: !!business?.id } }
  );

  const { data: rooms, isLoading: roomsLoading } = useListHotelRooms(
    { businessId: business?.id },
    { query: { enabled: !!business?.id, queryKey: getListHotelRoomsQueryKey({ businessId: business?.id }) } }
  );

  const getStatusColor = (status: HotelRoomStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-success/10 text-success border-success/20';
      case 'OCCUPIED': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'RESERVED': return 'bg-primary/10 text-primary border-primary/20';
      case 'CLEANING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBgColor = (status: HotelRoomStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-success/20 hover:bg-success/30 border-success/50';
      case 'OCCUPIED': return 'bg-destructive/20 hover:bg-destructive/30 border-destructive/50';
      case 'RESERVED': return 'bg-primary/20 hover:bg-primary/30 border-primary/50';
      case 'CLEANING': return 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50';
      default: return 'bg-muted/20 border-border';
    }
  };

  const getStatusLabel = (status: HotelRoomStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'Libre';
      case 'OCCUPIED': return 'Occupée';
      case 'RESERVED': return 'Réservée';
      case 'CLEANING': return 'Nettoyage';
      default: return status;
    }
  };

  // Group rooms by floor
  const roomsByFloor = rooms?.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, typeof rooms>) || {};

  const floors = Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a); // Highest floor first

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Tableau de bord Hôtel</h1>
        <p className="text-muted-foreground mt-1">Gérez vos chambres et réservations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Taux d'occupation" value={stats.occupancyRate} icon={Activity} />
            <KPICard title="Chambres libres" value={stats.availableRooms} icon={DoorOpen} />
            <KPICard title="Arrivées prévues" value={stats.arrivalsToday} icon={Calendar} />
            <KPICard title="Revenu Nuitée" value={stats.nightlyRevenue} icon={Receipt} isCurrency />
          </>
        ) : null}
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plan des chambres</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-muted-foreground">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-muted-foreground">Occupée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Réservée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-muted-foreground">Nettoyage</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {roomsLoading ? (
            <div className="space-y-6">
              {[3, 2, 1].map(floor => (
                <div key={floor} className="space-y-3">
                  <h3 className="font-serif text-lg">Étage {floor}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                    {Array(10).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : floors.length > 0 ? (
            <div className="space-y-8">
              {floors.map(floor => (
                <div key={floor} className="space-y-3">
                  <h3 className="font-serif text-lg border-b border-border/50 pb-2">Étage {floor}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                    {roomsByFloor[floor].map(room => (
                      <motion.button
                        key={room.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedRoom(room)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${getStatusBgColor(room.status)}`}
                      >
                        <span className="text-lg font-bold">{room.number}</span>
                        <div className="mt-2 text-muted-foreground">
                          {room.type === 'SUITE' || room.type === 'PRESIDENTIAL' ? <Sparkles className="w-4 h-4" /> : <BedDouble className="w-4 h-4" />}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bed className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aucune chambre configurée</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedRoom && (
          <Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
            <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="font-serif text-2xl">Chambre {selectedRoom.number}</span>
                  <Badge variant="outline" className={getStatusColor(selectedRoom.status)}>
                    {getStatusLabel(selectedRoom.status)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Détails de la chambre
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{selectedRoom.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Prix par nuit</span>
                  <span className="font-medium">{formatXAF(selectedRoom.pricePerNight)}</span>
                </div>
                
                {selectedRoom.currentGuestName && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Client actuel</span>
                    <span className="font-medium">{selectedRoom.currentGuestName}</span>
                  </div>
                )}
                
                {selectedRoom.checkoutDate && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Départ prévu</span>
                    <span className="font-medium">{new Date(selectedRoom.checkoutDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedRoom(null)}>Fermer</Button>
                {selectedRoom.status === 'AVAILABLE' && (
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Nouvelle Réservation
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

// Temporary Activity icon for KPI
function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
