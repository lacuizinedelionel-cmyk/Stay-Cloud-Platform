import { ReviewsSection } from '@/components/reviews-section';
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

const DEMO_EDU_STATS = {
  totalStudents: 184,
  activeCourses: 12,
  pendingPayments: 27,
  attendanceRate: '91%',
};

const DEMO_EDU_COURSES = [
  { id: 1, name: 'Anglais Professionnel', description: 'Business English & speaking', price: 85000, enrolledCount: 28 },
  { id: 2, name: 'Comptabilité de base', description: 'Gestion PME', price: 65000, enrolledCount: 24 },
  { id: 3, name: 'Dév. Web Starter', description: 'HTML, CSS, React', price: 120000, enrolledCount: 16 },
  { id: 4, name: 'Marketing Digital', description: 'Réseaux sociaux & ads', price: 90000, enrolledCount: 21 },
  { id: 5, name: 'Secrétariat Bilingue', description: 'FR / EN', price: 75000, enrolledCount: 19 },
];

const DEMO_EDU_STUDENTS = [
  { id: 1, name: 'Nadia M.', paymentStatus: 'PAID' },
  { id: 2, name: 'Eric T.', paymentStatus: 'PARTIAL' },
  { id: 3, name: 'Aline K.', paymentStatus: 'PENDING' },
  { id: 4, name: 'Jean P.', paymentStatus: 'PAID' },
  { id: 5, name: 'Mireille S.', paymentStatus: 'PARTIAL' },
];

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

  const displayStats = stats ?? DEMO_EDU_STATS;
  const displayCourses = courses && courses.length > 0 ? courses : DEMO_EDU_COURSES;
  const displayStudents = students && students.length > 0 ? students : DEMO_EDU_STUDENTS;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Éducation</h1>
        <p className="text-muted-foreground mt-1">Gérez vos apprenants, coachs et formations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : (
          <>
            <KPICard title="Apprenants" value={displayStats.totalStudents} icon={Users} />
            <KPICard title="Cours Actifs" value={displayStats.activeCourses} icon={BookOpen} />
            <KPICard title="Paiements en attente" value={displayStats.pendingPayments} icon={CreditCard} />
            <KPICard title="Taux de présence" value={displayStats.attendanceRate} icon={Activity} />
          </>
        )}
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
            ) : displayCourses.length > 0 ? (
              <div className="overflow-x-auto max-w-full">
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
                    {displayCourses.slice(0, 5).map((course) => (
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
            ) : displayStudents.length > 0 ? (
              <div className="overflow-x-auto max-w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Nom</TableHead>
                      <TableHead>Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStudents.slice(0, 5).map((student) => (
                      <TableRow key={student.id} className="border-border/50">
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={student.paymentStatus === 'PAID' ? 'bg-success/10 text-success border-success/20' : student.paymentStatus === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
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

      {business && <ReviewsSection businessId={business.id} sector="EDUCATION" />}
    </div>
  );
}
