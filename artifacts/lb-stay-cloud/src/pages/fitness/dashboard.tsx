import { ReviewsSection } from '@/components/reviews-section';
import { useAuth } from '@/context/AuthContext';
import { 
  useGetFitnessStats,
  getGetFitnessStatsQueryKey,
  useListFitnessMembers, 
  getListFitnessMembersQueryKey,
  useListFitnessClasses,
  getListFitnessClassesQueryKey
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Users, Activity, Receipt, UserCheck } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function FitnessDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetFitnessStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetFitnessStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: members, isLoading: membersLoading } = useListFitnessMembers(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListFitnessMembersQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: classes, isLoading: classesLoading } = useListFitnessClasses(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListFitnessClassesQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Fitness</h1>
        <p className="text-muted-foreground mt-1">Gérez vos membres et vos cours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Membres Actifs" value={stats.activeMembers} icon={Users} />
            <KPICard title="Abonnements ce mois" value={stats.subscriptionsThisMonth} icon={Activity} />
            <KPICard title="CA Mensuel" value={stats.monthlyRevenue} icon={Receipt} isCurrency />
            <KPICard title="Présents Maintenant" value={stats.presentNow} icon={UserCheck} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Membres Récents</CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
               <div className="space-y-4">
                 {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
               </div>
            ) : members && members.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Nom</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.slice(0, 5).map((member) => {
                      const isExpiringSoon = new Date(member.subscriptionEndDate).getTime() - new Date().getTime() < 7 * 24 * 3600 * 1000;
                      return (
                        <TableRow key={member.id} className="border-border/50">
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              {member.subscriptionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.isPresentNow ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">Présent</Badge>
                            ) : isExpiringSoon ? (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Expire bientôt</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Absent</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucun membre trouvé</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Planning des Cours</CardTitle>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
               <div className="space-y-4">
                 {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
               </div>
            ) : classes && classes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Cours</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Horaire</TableHead>
                      <TableHead className="text-right">Capacité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id} className="border-border/50">
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.coachName}</TableCell>
                        <TableCell>
                          {cls.dayOfWeek} à {cls.startTime}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cls.enrolledCount >= cls.capacity ? 'text-destructive font-bold' : ''}>
                            {cls.enrolledCount} / {cls.capacity}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucun cours programmé</div>
            )}
          </CardContent>
        </Card>
      </div>

      {business && <ReviewsSection businessId={business.id} sector="FITNESS" />}
    </div>
  );
}
