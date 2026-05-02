import { useAuth } from '@/context/AuthContext';
import { useGetPaymentStats, getGetPaymentStatsQueryKey } from '@workspace/api-client-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function AnalyticsPage() {
  const { business } = useAuth();
  
  const { data: stats, isLoading } = useGetPaymentStats(
    { businessId: business?.id ?? 0 },
    { query: { enabled: !!business?.id, queryKey: getGetPaymentStatsQueryKey({ businessId: business?.id ?? 0 }) } }
  );

  const COLORS = ['#F5A623', '#6C63FF', '#00D4AA', '#FF4757'];

  const pieData = stats ? [
    { name: 'Espèces', value: stats.cash },
    { name: 'MTN Mobile Money', value: stats.mtnMobileMoney },
    { name: 'Orange Money', value: stats.orangeMoney },
    { name: 'Carte Bancaire', value: stats.card },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analyses et Rapports</h1>
        <p className="text-muted-foreground mt-1">Vos performances financières en détail</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Répartition des Paiements</CardTitle>
            <CardDescription>Par méthode d'encaissement</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full rounded-full" />
            ) : pieData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--primary))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => formatXAF(value)}
                    />
                    <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de paiement
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Résumé Financier</CardTitle>
            <CardDescription>Vue d'ensemble des encaissements</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4">
                 {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
               </div>
            ) : stats ? (
              <div className="space-y-6">
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="text-sm text-primary mb-1">Revenu Total</div>
                  <div className="text-3xl font-bold text-primary">{formatXAF(stats.totalRevenue)}</div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Espèces', value: stats.cash, percent: stats.cashPercent, color: 'bg-[#F5A623]' },
                    { label: 'MTN Mobile Money', value: stats.mtnMobileMoney, percent: stats.mtnPercent, color: 'bg-[#6C63FF]' },
                    { label: 'Orange Money', value: stats.orangeMoney, percent: stats.orangePercent, color: 'bg-[#00D4AA]' },
                    { label: 'Carte Bancaire', value: stats.card, percent: stats.cardPercent, color: 'bg-[#FF4757]' },
                  ].map((item, idx) => item.value > 0 && (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatXAF(item.value)}</div>
                        <div className="text-xs text-muted-foreground">{item.percent.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
               <div className="text-center py-8 text-muted-foreground">Aucune donnée</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
