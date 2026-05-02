import { useAuth } from '@/context/AuthContext';
import { 
  useGetEducationStats,
  getGetEducationStatsQueryKey,
  useListCourses, 
  getListCoursesQueryKey,
  useListStudents,
  getListStudentsQueryKey
} from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Users, BookOpen, CreditCard, Activity } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EducationDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetEducationStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetEducationStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: courses, isLoading: coursesLoading } = useListCourses(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListCoursesQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: students, isLoading: studentsLoading } = useListStudents(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getListStudentsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Éducation</h1>
        <p className="text-muted-foreground mt-1">Gérez vos apprenants et vos cours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Apprenants" value={stats.totalStudents} icon={Users} />
            <KPICard title="Cours Actifs" value={stats.activeCourses} icon={BookOpen} />
            <KPICard title="Paiements en attente" value={stats.pendingPayments} icon={CreditCard} />
            <KPICard title="Taux de présence" value={stats.attendanceRate} icon={Activity} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Cours Populaires</CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
               <div className="space-y-4">
                 {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
               </div>
            ) : courses && courses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Titre</TableHead>
                      <TableHead>Instructeur</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Inscrits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.slice(0, 5).map((course) => (
                      <TableRow key={course.id} className="border-border/50">
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.description ?? '—'}</TableCell>
                        <TableCell className="text-right">{formatXAF(course.price)}</TableCell>
                        <TableCell className="text-right font-bold">{course.enrolledCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucun cours trouvé</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Derniers Inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
               <div className="space-y-4">
                 {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
               </div>
            ) : students && students.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Nom</TableHead>
                      <TableHead>Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.slice(0, 5).map((student) => (
                      <TableRow key={student.id} className="border-border/50">
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            student.paymentStatus === 'PAID' ? "bg-success/10 text-success border-success/20" :
                            student.paymentStatus === 'PARTIAL' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                            "bg-destructive/10 text-destructive border-destructive/20"
                          }>
                            {student.paymentStatus === 'PAID' ? 'Payé' : student.paymentStatus === 'PARTIAL' ? 'Partiel' : 'En attente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucun apprenant trouvé</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
