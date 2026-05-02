import { ReviewsSection } from '@/components/reviews-section';
import { useAuth } from '@/context/AuthContext';
import { 
  useGetGarageStats,
  getGetGarageStatsQueryKey,
  useListGarageVehicles, 
  getListGarageVehiclesQueryKey,
  GarageVehicleStatus
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Car, FileSignature, Receipt, Settings } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function GarageDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetGarageStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetGarageStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: vehicles, isLoading: vehiclesLoading } = useListGarageVehicles(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListGarageVehiclesQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const getStatusColor = (status: GarageVehicleStatus) => {
    switch (status) {
      case 'DIAGNOSTIC': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'WAITING_PARTS': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'COMPLETED': return 'bg-success/10 text-success border-success/20';
      case 'DELIVERED': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: GarageVehicleStatus) => {
    switch (status) {
      case 'DIAGNOSTIC': return 'Diagnostic';
      case 'IN_PROGRESS': return 'En réparation';
      case 'WAITING_PARTS': return 'En attente pièces';
      case 'COMPLETED': return 'Terminé';
      case 'DELIVERED': return 'Livré';
      default: return status;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Garage</h1>
        <p className="text-muted-foreground mt-1">Gérez les réparations et les devis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Véhicules en cours" value={stats.vehiclesInProgress} icon={Car} />
            <KPICard title="Devis en attente" value={stats.pendingQuotes} icon={FileSignature} />
            <KPICard title="CA de la semaine" value={stats.weeklyRevenue} icon={Receipt} isCurrency />
            <KPICard title="Pièces en rupture" value={stats.criticalPartsCount} icon={Settings} />
          </>
        ) : null}
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Véhicules en réparation</CardTitle>
        </CardHeader>
        <CardContent>
          {vehiclesLoading ? (
             <div className="space-y-4">
               {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
             </div>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Problème</TableHead>
                    <TableHead className="w-[200px]">Progression</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.filter(v => v.status !== 'DELIVERED').map((vehicle) => (
                    <TableRow key={vehicle.id} className="border-border/50">
                      <TableCell className="font-medium">
                        <div>{vehicle.brand} {vehicle.model}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.plate}</div>
                      </TableCell>
                      <TableCell>{vehicle.clientName}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={vehicle.problem}>{vehicle.problem}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={vehicle.progressPercent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right">{vehicle.progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                          {getStatusLabel(vehicle.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucun véhicule en cours de réparation</div>
          )}
        </CardContent>
      </Card>

      {business && <ReviewsSection businessId={business.id} sector="GARAGE" />}
    </div>
  );
}
