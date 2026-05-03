import { ReviewsSection } from '@/components/reviews-section';
import { useGetRestaurantStats, getGetRestaurantStatsQueryKey, useGetRestaurantHourlySales, getGetRestaurantHourlySalesQueryKey, useListRestaurantOrders, getListRestaurantOrdersQueryKey, RestaurantOrderStatus } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { KPICard } from '@/components/kpi-card';
import { DashboardHero } from '@/components/dashboard-hero';
import { UtensilsCrossed, ShoppingBag, Users, Receipt, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function RestaurantDashboard() {
  const { business } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetRestaurantStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetRestaurantStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: chartData, isLoading: chartLoading } = useGetRestaurantHourlySales(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetRestaurantHourlySalesQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const { data: orders, isLoading: ordersLoading } = useListRestaurantOrders(
    { businessId: business?.id ?? 0, limit: 10 },
    { query: { enabled: !!business?.id, queryKey: getListRestaurantOrdersQueryKey({ businessId: business?.id ?? 0, limit: 10 }) } }
  );

  const getStatusColor = (status: RestaurantOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PREPARING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'READY': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'DELIVERED': return 'bg-success/10 text-success border-success/20';
      case 'CANCELLED': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: RestaurantOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'PREPARING': return 'En préparation';
      case 'READY': return 'Prêt';
      case 'DELIVERED': return 'Livré';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 page-enter">
      <DashboardHero
        title="Tableau de bord Restaurant"
        subtitle="Gérez vos commandes et vos ventes en temps réel"
        gradient="linear-gradient(135deg,#EA580C,#F97316)"
        color="#F97316"
        bg="rgba(249,115,22,0.08)"
        icon={UtensilsCrossed}
        badge="PRO"
        stats={stats ? [
          { label: 'commandes', value: String(stats.ordersCount) },
          { label: 'CA du jour', value: new Intl.NumberFormat('fr-FR').format(stats.dailyRevenue) + ' FCFA' },
          { label: 'ticket moyen', value: new Intl.NumberFormat('fr-FR').format(stats.averageTicket) + ' FCFA' },
        ] : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="CA du Jour" value={stats.dailyRevenue} icon={Receipt} isCurrency accent staggerIndex={0} />
            <KPICard title="Commandes" value={stats.ordersCount} icon={ShoppingBag} color="#F97316" staggerIndex={1} />
            <KPICard title="Clients" value={stats.clientsCount} icon={Users} color="#60A5FA" staggerIndex={2} />
            <KPICard title="Ticket Moyen" value={stats.averageTicket} icon={UtensilsCrossed} isCurrency color="#A78BFA" staggerIndex={3} />
          </>
        ) : null}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Ventes par heure</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => formatXAF(value)}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--primary))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatXAF(value) : value, 
                        name === 'revenue' ? "Revenu" : "Commandes"
                      ]}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Top 5 des plats</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : stats?.topDishes ? (
              <div className="space-y-6">
                {stats.topDishes.map((dish, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground truncate mr-4">{dish.name}</span>
                      <span className="text-muted-foreground shrink-0">{dish.count} ventes</span>
                    </div>
                    <Progress value={dish.percentage} className="h-2 bg-muted/50" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucune donnée disponible</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commandes Récentes</CardTitle>
          <Badge variant="outline" className="gap-1 bg-background">
            <Clock className="w-3 h-3" /> Temps réel
          </Badge>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto md:overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Client / Table</TableHead>
                    <TableHead>Plats</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-border/50">
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.clientName || 'Client divers'}</div>
                        {order.tableNumber && <div className="text-xs text-muted-foreground">Table {order.tableNumber}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatXAF(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucune commande pour le moment</div>
          )}
        </CardContent>
      </Card>

      {business && <ReviewsSection businessId={business.id} sector="RESTAURANT" />}
    </div>
  );
}
