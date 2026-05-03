import { ReviewsSection } from '@/components/reviews-section';
import { useAuth } from '@/context/AuthContext';
import { 
  useGetBeautyStats,
  getGetBeautyStatsQueryKey,
  useListBeautyAppointments, 
  getListBeautyAppointmentsQueryKey,
  BeautyAppointmentStatus
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Calendar as CalendarIcon, Users, Clock, Smile } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DEMO_BEAUTY_STATS = {
  appointmentsToday: 14,
  dailyRevenue: 186500,
  waitingClients: 6,
  satisfactionRate: '97%',
};

const DEMO_BEAUTY_APPOINTMENTS = [
  { id: 1, startTime: '08:30', endTime: '09:15', clientName: 'Mme Ekotto', serviceName: 'Brushing luxe', staffName: 'Aïcha', amount: 25000, status: 'SCHEDULED' as BeautyAppointmentStatus },
  { id: 2, startTime: '09:20', endTime: '10:10', clientName: 'M. Njoya', serviceName: 'Coupe + soin barbe', staffName: 'Sandra', amount: 18000, status: 'IN_PROGRESS' as BeautyAppointmentStatus },
  { id: 3, startTime: '10:30', endTime: '11:30', clientName: 'Mme Mballa', serviceName: 'Manucure premium', staffName: 'Nadine', amount: 15000, status: 'SCHEDULED' as BeautyAppointmentStatus },
  { id: 4, startTime: '11:45', endTime: '12:45', clientName: 'Mme Essiane', serviceName: 'Pédicure spa', staffName: 'Carine', amount: 20000, status: 'COMPLETED' as BeautyAppointmentStatus },
  { id: 5, startTime: '13:00', endTime: '13:50', clientName: 'Mme Tchekam', serviceName: 'Soin visage gold', staffName: 'Aïcha', amount: 32000, status: 'SCHEDULED' as BeautyAppointmentStatus },
  { id: 6, startTime: '14:10', endTime: '15:00', clientName: 'Mme Tchoumbou', serviceName: 'Tresses élégantes', staffName: 'Sandra', amount: 28000, status: 'NO_SHOW' as BeautyAppointmentStatus },
  { id: 7, startTime: '15:20', endTime: '16:10', clientName: 'Mme Fonkoua', serviceName: 'Massage relaxant', staffName: 'Nadine', amount: 30000, status: 'SCHEDULED' as BeautyAppointmentStatus },
];

export default function BeautyDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetBeautyStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetBeautyStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: appointments, isLoading: appointmentsLoading } = useListBeautyAppointments(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListBeautyAppointmentsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const getStatusColor = (status: BeautyAppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-primary/10 text-primary border-primary/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'COMPLETED': return 'bg-success/10 text-success border-success/20';
      case 'CANCELLED': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'NO_SHOW': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: BeautyAppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED': return 'Prévu';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      case 'NO_SHOW': return 'Non présenté';
      default: return status;
    }
  };

  const displayStats = stats ?? DEMO_BEAUTY_STATS;
  const displayAppointments = appointments && appointments.length > 0 ? appointments : DEMO_BEAUTY_APPOINTMENTS;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Beauté</h1>
        <p className="text-muted-foreground mt-1">Gérez vos rendez-vous et vos prestations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : (
          <>
            <KPICard title="RDV Aujourd'hui" value={displayStats.appointmentsToday} icon={CalendarIcon} />
            <KPICard title="CA du Jour" value={displayStats.dailyRevenue} icon={Clock} isCurrency />
            <KPICard title="Clients en attente" value={displayStats.waitingClients} icon={Users} />
            <KPICard title="Satisfaction" value={displayStats.satisfactionRate} icon={Smile} />
          </>
        )}
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Rendez-vous du jour</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
             <div className="space-y-4">
               {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : displayAppointments.length > 0 ? (
            <div className="overflow-x-auto max-w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Heure</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Prestation</TableHead>
                    <TableHead>Personnel</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="border-border/50">
                      <TableCell className="font-medium">
                        {appointment.startTime} - {appointment.endTime}
                      </TableCell>
                      <TableCell>{appointment.clientName}</TableCell>
                      <TableCell>{appointment.serviceName}</TableCell>
                      <TableCell>{appointment.staffName}</TableCell>
                      <TableCell className="text-right">{formatXAF(appointment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucun rendez-vous prévu</div>
          )}
        </CardContent>
      </Card>

      {business && <ReviewsSection businessId={business.id} sector="BEAUTY" />}
    </div>
  );
}
