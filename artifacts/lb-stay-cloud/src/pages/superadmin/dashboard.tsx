import { useGetSuperAdminStats, useGetSuperAdminRevenueChart, useListBusinesses } from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Building2, CreditCard, Activity, Users } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetSuperAdminStats();
  const { data: chartData, isLoading: chartLoading } = useGetSuperAdminRevenueChart();
  const { data: businesses, isLoading: businessesLoading } = useListBusinesses();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">LB Stay Cloud</h1>
          <p className="text-muted-foreground mt-1">Vue globale de la plateforme</p>
        </div>
        <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/50 px-3 py-1">
          SUPER ADMIN
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Enseignes Actives" value={stats.activeBusinesses} icon={Building2} />
            <KPICard title="CA Plateforme ce mois" value={stats.monthlyRevenue} icon={CreditCard} isCurrency />
            <KPICard title="Transactions Aujourd'hui" value={stats.totalTransactionsToday} icon={Activity} />
            <KPICard title="Nouveaux Inscrits" value={stats.newBusinessesThisMonth} icon={Users} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Évolution des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => formatXAF(value)}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--primary))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [formatXAF(value), "Revenu"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Enseignes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {businessesLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : businesses ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nom</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">CA ce mois</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((biz) => (
                    <TableRow key={biz.id} className="border-border/50">
                      <TableCell className="font-medium">{biz.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {biz.sector}
                        </Badge>
                      </TableCell>
                      <TableCell>{biz.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
                          {biz.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatXAF(biz.monthlyRevenue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`relative flex h-3 w-3`}>
                            {biz.isActive && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${biz.isActive ? 'bg-success' : 'bg-destructive'}`}></span>
                          </span>
                          <span className="text-sm text-muted-foreground">{biz.isActive ? 'Actif' : 'Inactif'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
