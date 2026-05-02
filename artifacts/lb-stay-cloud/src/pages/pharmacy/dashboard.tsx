import { useAuth } from '@/context/AuthContext';
import { 
  useGetPharmacyStats,
  getGetPharmacyStatsQueryKey,
  useListMedications, 
  getListMedicationsQueryKey
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { FileText, Pill, Receipt, AlertOctagon } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PharmacyDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetPharmacyStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetPharmacyStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: medications, isLoading: medicationsLoading } = useListMedications(
    { businessId: business?.id ?? 0, expiringSoon: true },
    { query: { enabled: !!business?.id, queryKey: getListMedicationsQueryKey({ businessId: business?.id ?? 0, expiringSoon: true }) } }
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Tableau de bord Pharmacie</h1>
        <p className="text-muted-foreground mt-1">Gérez vos médicaments et ordonnances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Ordonnances du Jour" value={stats.prescriptionsToday} icon={FileText} />
            <KPICard title="Médicaments Vendus" value={stats.medicationsSold} icon={Pill} />
            <KPICard title="CA du Jour" value={stats.dailyRevenue} icon={Receipt} isCurrency />
            <KPICard title="Ruptures Critiques" value={stats.criticalStockCount} icon={AlertOctagon} />
          </>
        ) : null}
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertOctagon className="w-5 h-5" />
            Médicaments expirant dans moins de 30 jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicationsLoading ? (
             <div className="space-y-4">
               {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : medications && medications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nom</TableHead>
                    <TableHead>DCI</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Date d'expiration</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((med) => {
                    const expiryDate = new Date(med.expirationDate);
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    
                    return (
                      <TableRow key={med.id} className="border-border/50">
                        <TableCell className="font-medium">{med.name}</TableCell>
                        <TableCell>{med.dci || '-'}</TableCell>
                        <TableCell>{med.stock}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={daysUntilExpiry < 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}>
                            {expiryDate.toLocaleDateString('fr-FR')}
                            {daysUntilExpiry < 0 ? " (Expiré)" : ` (${daysUntilExpiry} j)`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatXAF(med.price)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucun médicament n'expire prochainement</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
