import { useGetSuperAdminStats, useGetSuperAdminRevenueChart, useListBusinesses } from '@workspace/api-client-react';
import { KPICard } from '@/components/kpi-card';
import { Building2, CreditCard, Activity, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const SECTOR_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant', HOTEL: 'Hôtel', BEAUTY: 'Beauté',
  GROCERY: 'Supérette', PHARMACY: 'Pharmacie', GARAGE: 'Garage',
  FITNESS: 'Fitness', EDUCATION: 'Formation',
};

const SECTOR_COLORS: Record<string, string> = {
  RESTAURANT: '#F59E0B', HOTEL: '#3B82F6', BEAUTY: '#EC4899',
  GROCERY: '#10B981', PHARMACY: '#8B5CF6', GARAGE: '#6B7280',
  FITNESS: '#EF4444', EDUCATION: '#06B6D4',
};

function PageHeader() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          {dateStr}
        </p>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
          Vue d'ensemble de la plateforme
        </h1>
      </div>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        SUPER ADMIN
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetSuperAdminStats();
  const { data: chartData, isLoading: chartLoading } = useGetSuperAdminRevenueChart();
  const { data: businesses, isLoading: businessesLoading } = useListBusinesses();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <PageHeader />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[110px] rounded-xl" />)
        ) : stats ? (
          <>
            <KPICard title="Enseignes Actives" value={stats.activeBusinesses} icon={Building2} accent />
            <KPICard title="CA du mois" value={stats.monthlyRevenue} icon={CreditCard} isCurrency trend={{ value: 12, isPositive: true }} />
            <KPICard title="Transactions aujourd'hui" value={stats.totalTransactionsToday} icon={Activity} trend={{ value: 8, isPositive: true }} />
            <KPICard title="Nouvelles enseignes" value={stats.newBusinessesThisMonth} icon={Users} />
          </>
        ) : null}
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-foreground">Évolution des revenus</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Chiffre d'affaires de la plateforme</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <TrendingUp className="w-3.5 h-3.5" />
              +12% ce mois
            </div>
          </div>

          {chartLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : chartData ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gold-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38 90% 56%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(38 90% 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="Plus Jakarta Sans"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    fontFamily="Plus Jakarta Sans"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '10px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [formatXAF(value), 'Revenu']}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    itemStyle={{ color: 'hsl(38 90% 56%)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(38 90% 56%)"
                    strokeWidth={2}
                    fill="url(#gold-gradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(38 90% 56%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </motion.div>

        {/* Sector breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <h2 className="text-sm font-bold text-foreground mb-1">Répartition par secteur</h2>
          <p className="text-xs text-muted-foreground mb-6">Enseignes actives</p>

          {businessesLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : businesses ? (
            <div className="space-y-3">
              {Object.entries(
                businesses.reduce((acc, b) => {
                  acc[b.sector] = (acc[b.sector] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([sector, count]) => (
                <div key={sector} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: SECTOR_COLORS[sector] ?? '#6B7280' }}
                  />
                  <span className="text-xs text-muted-foreground flex-1">{SECTOR_LABELS[sector] ?? sector}</span>
                  <span className="text-xs font-bold text-foreground">{count}</span>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / businesses.length) * 100}%`,
                        background: SECTOR_COLORS[sector] ?? '#6B7280',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Businesses table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Toutes les enseignes</h2>
            <p className="text-xs text-muted-foreground">{businesses?.length ?? 0} enregistrées</p>
          </div>
        </div>

        {businessesLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : businesses ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Enseigne', 'Secteur', 'Ville', 'Plan', 'CA ce mois', 'Statut'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz, i) => (
                  <tr
                    key={biz.id}
                    className="transition-colors hover:bg-muted/30"
                    style={{ borderBottom: i < businesses.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: SECTOR_COLORS[biz.sector] ?? '#6B7280' }}
                        >
                          {biz.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{biz.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{
                          background: `${SECTOR_COLORS[biz.sector] ?? '#6B7280'}18`,
                          color: SECTOR_COLORS[biz.sector] ?? '#6B7280',
                        }}
                      >
                        {SECTOR_LABELS[biz.sector] ?? biz.sector}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{biz.city}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] font-semibold text-secondary uppercase tracking-wide">{biz.plan}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                      {formatXAF(biz.monthlyRevenue)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          {biz.isActive && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                              style={{ background: 'hsl(var(--success))' }} />
                          )}
                          <span
                            className="relative inline-flex rounded-full h-2 w-2"
                            style={{ background: biz.isActive ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
                          />
                        </span>
                        <span className="text-xs text-muted-foreground">{biz.isActive ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
