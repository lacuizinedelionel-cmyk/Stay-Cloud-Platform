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
import { Users, Activity, Receipt, UserCheck, Dumbbell, TimerReset, Zap } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DEMO_FITNESS_STATS = {
  activeMembers: 128,
  subscriptionsThisMonth: 34,
  monthlyRevenue: 1245000,
  presentNow: 22,
};

const DEMO_FITNESS_MEMBERS = [
  { id: 1, name: 'M. Mbida', subscriptionType: 'Premium Mensuel', subscriptionEndDate: '2026-05-12', isPresentNow: true },
  { id: 2, name: 'Mme Ndam', subscriptionType: 'Standard Mensuel', subscriptionEndDate: '2026-05-08', isPresentNow: false },
  { id: 3, name: 'M. Essono', subscriptionType: 'VIP Annuel', subscriptionEndDate: '2026-12-31', isPresentNow: true },
  { id: 4, name: 'Mme Talla', subscriptionType: 'Premium Mensuel', subscriptionEndDate: '2026-05-06', isPresentNow: false },
  { id: 5, name: 'M. Foe', subscriptionType: 'Carte 10 séances', subscriptionEndDate: '2026-05-20', isPresentNow: true },
];

const DEMO_FITNESS_CLASSES = [
  { id: 1, name: 'Yoga Matinal', coachName: 'Coach Mireille', dayOfWeek: 'Lundi', startTime: '06:30', enrolledCount: 18, capacity: 20 },
  { id: 2, name: 'HIIT Express', coachName: 'Coach Steve', dayOfWeek: 'Mardi', startTime: '18:00', enrolledCount: 20, capacity: 20 },
  { id: 3, name: 'Zumba Gold', coachName: 'Coach Nadia', dayOfWeek: 'Mercredi', startTime: '19:00', enrolledCount: 16, capacity: 24 },
  { id: 4, name: 'Musculation Débutants', coachName: 'Coach Yann', dayOfWeek: 'Jeudi', startTime: '17:30', enrolledCount: 12, capacity: 15 },
  { id: 5, name: 'Stretch & Recover', coachName: 'Coach Mireille', dayOfWeek: 'Samedi', startTime: '08:00', enrolledCount: 10, capacity: 12 },
];

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

  const displayStats = stats ?? DEMO_FITNESS_STATS;
  const displayMembers = members && members.length > 0 ? members : DEMO_FITNESS_MEMBERS;
  const displayClasses = classes && classes.length > 0 ? classes : DEMO_FITNESS_CLASSES;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Fitness</h1>
        <p className="text-muted-foreground mt-1">Gérez vos membres, coachs, plannings et tarifs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : (
          <>
            <KPICard title="Membres Actifs" value={displayStats.activeMembers} icon={Users} />
            <KPICard title="Abonnements ce mois" value={displayStats.subscriptionsThisMonth} icon={Activity} />
            <KPICard title="CA Mensuel" value={displayStats.monthlyRevenue} icon={Receipt} isCurrency />
            <KPICard title="Présents Maintenant" value={displayStats.presentNow} icon={UserCheck} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Cours coachés', value: '18', icon: Dumbbell },
          { label: 'Sessions semaine', value: '42', icon: TimerReset },
          { label: 'Remplissage moyen', value: '86%', icon: Zap },
          { label: 'Tarif moyen', value: formatXAF(18000), icon: Receipt },
        ].map(card => (
          <Card key={card.label} className="border-border/50 bg-card">
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
            ) : displayMembers.length > 0 ? (
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
                    {displayMembers.slice(0, 5).map((member) => {
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
            <CardTitle>Planning des Cours et Coachs</CardTitle>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
               <div className="space-y-4">
                 {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
               </div>
            ) : displayClasses.length > 0 ? (
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
                    {displayClasses.map((cls) => (
                      <TableRow key={cls.id} className="border-border/50">
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.coachName}</TableCell>
                        <TableCell>{cls.dayOfWeek} à {cls.startTime}</TableCell>
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
