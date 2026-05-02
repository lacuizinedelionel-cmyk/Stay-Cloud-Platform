import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  useGetPaymentStats,
  useListPayments,
  useGetRestaurantStats,
  useGetHotelStats,
  useGetGroceryStats,
  useListRestaurantProducts,
  getGetPaymentStatsQueryKey,
  getListPaymentsQueryKey,
  getGetRestaurantStatsQueryKey,
  getGetHotelStatsQueryKey,
  getGetGroceryStatsQueryKey,
  getListRestaurantProductsQueryKey,
} from '@workspace/api-client-react';
import { formatXAF } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  Banknote,
  Smartphone,
  CreditCard,
  TrendingUp,
  ShoppingBag,
  Users,
  Receipt,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';

const PAYMENT_COLORS = {
  CASH: '#10B981',
  MTN_MOBILE_MONEY: '#F59E0B',
  ORANGE_MONEY: '#F97316',
  CARD: '#3B82F6',
};

const PAYMENT_ICONS = {
  CASH: Banknote,
  MTN_MOBILE_MONEY: Smartphone,
  ORANGE_MONEY: Smartphone,
  CARD: CreditCard,
};

const PAYMENT_LABELS = {
  CASH: 'Espèces',
  MTN_MOBILE_MONEY: 'MTN MoMo',
  ORANGE_MONEY: 'Orange Money',
  CARD: 'Carte',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 rounded-full" style={{ background: 'hsl(38 90% 56%)' }} />
      <h2 className="text-sm font-bold text-foreground">{children}</h2>
    </div>
  );
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl p-5 ${className}`}
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {children}
    </motion.div>
  );
}

function PaymentPieChart({ stats }: { stats: { cash: number; mtnMobileMoney: number; orangeMoney: number; card: number; cashPercent: number; mtnPercent: number; orangePercent: number; cardPercent: number } }) {
  const data = [
    { key: 'CASH', name: 'Espèces', value: stats.cash, pct: stats.cashPercent },
    { key: 'MTN_MOBILE_MONEY', name: 'MTN MoMo', value: stats.mtnMobileMoney, pct: stats.mtnPercent },
    { key: 'ORANGE_MONEY', name: 'Orange Money', value: stats.orangeMoney, pct: stats.orangePercent },
    { key: 'CARD', name: 'Carte', value: stats.card, pct: stats.cardPercent },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">Aucune transaction</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((d) => (
                <Cell key={d.key} fill={PAYMENT_COLORS[d.key as keyof typeof PAYMENT_COLORS]} />
              ))}
            </Pie>
            <RTooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontFamily: 'Plus Jakarta Sans', fontSize: 12 }}
              formatter={(v: number) => [formatXAF(v)]}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5">
        {data.map(d => {
          const Icon = PAYMENT_ICONS[d.key as keyof typeof PAYMENT_ICONS];
          const color = PAYMENT_COLORS[d.key as keyof typeof PAYMENT_COLORS];
          return (
            <div key={d.key} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.5} />
              </div>
              <span className="text-xs text-muted-foreground flex-1">{d.name}</span>
              <span className="text-xs font-bold text-foreground">{formatXAF(d.value)}</span>
              <span className="text-[11px] text-muted-foreground w-10 text-right">{d.pct.toFixed(1)}%</span>
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { business } = useAuth();
  const bId = business?.id ?? 0;
  const sector = business?.sector;

  const { data: payStats, isLoading: payLoading } = useGetPaymentStats(
    { businessId: bId },
    { query: { queryKey: getGetPaymentStatsQueryKey({ businessId: bId }), enabled: !!bId } },
  );
  const { data: payments, isLoading: paymentsLoading } = useListPayments(
    { businessId: bId, limit: 20 },
    { query: { queryKey: getListPaymentsQueryKey({ businessId: bId, limit: 20 }), enabled: !!bId } },
  );
  const { data: restStats } = useGetRestaurantStats(
    { businessId: bId },
    { query: { queryKey: getGetRestaurantStatsQueryKey({ businessId: bId }), enabled: !!bId && sector === 'RESTAURANT' } },
  );
  const { data: hotelStats } = useGetHotelStats(
    { businessId: bId },
    { query: { queryKey: getGetHotelStatsQueryKey({ businessId: bId }), enabled: !!bId && sector === 'HOTEL' } },
  );
  const { data: groceryStats } = useGetGroceryStats(
    { businessId: bId },
    { query: { queryKey: getGetGroceryStatsQueryKey({ businessId: bId }), enabled: !!bId && sector === 'GROCERY' } },
  );
  const { data: products } = useListRestaurantProducts(
    { businessId: bId },
    { query: { queryKey: getListRestaurantProductsQueryKey({ businessId: bId }), enabled: !!bId && sector === 'RESTAURANT' } },
  );

  // Build daily CA chart from payments
  const dailyChart = useMemo(() => {
    if (!payments) return [];
    const map: Record<string, number> = {};
    payments.forEach(p => {
      const day = new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      map[day] = (map[day] ?? 0) + p.amount;
    });
    return Object.entries(map).slice(-14).map(([date, revenue]) => ({ date, revenue }));
  }, [payments]);

  // Top 10 products (restaurant)
  const topDishes = restStats?.topDishes?.slice(0, 10) ?? [];

  // Recent payments table
  const recent = payments?.slice(0, 12) ?? [];

  const kpis = [
    sector === 'RESTAURANT' && restStats ? [
      { label: 'CA du jour', value: formatXAF(restStats.dailyRevenue), icon: TrendingUp, color: '#F59E0B' },
      { label: 'Commandes', value: restStats.ordersCount, icon: ShoppingBag, color: '#3B82F6' },
      { label: 'Ticket moyen', value: formatXAF(restStats.averageTicket), icon: Receipt, color: '#10B981' },
      { label: 'Clients', value: restStats.clientsCount, icon: Users, color: '#8B5CF6' },
    ] : null,
    sector === 'HOTEL' && hotelStats ? [
      { label: 'Taux occupation', value: `${hotelStats.occupancyRate.toFixed(1)}%`, icon: TrendingUp, color: '#F59E0B' },
      { label: 'Chambres libres', value: hotelStats.availableRooms, icon: ShoppingBag, color: '#10B981' },
      { label: 'Arrivées/jour', value: hotelStats.arrivalsToday, icon: Receipt, color: '#3B82F6' },
      { label: 'Revenu nuit', value: formatXAF(hotelStats.nightlyRevenue), icon: Users, color: '#8B5CF6' },
    ] : null,
    sector === 'GROCERY' && groceryStats ? [
      { label: 'Ventes du jour', value: formatXAF(groceryStats.dailySales), icon: TrendingUp, color: '#F59E0B' },
      { label: 'Articles vendus', value: groceryStats.itemsSoldToday, icon: ShoppingBag, color: '#3B82F6' },
      { label: 'Stock critique', value: groceryStats.lowStockCount, icon: Receipt, color: '#EF4444' },
      { label: 'Fournisseurs', value: groceryStats.activeSuppliers, icon: Users, color: '#8B5CF6' },
    ] : null,
  ].find(Boolean) ?? [];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
          Rapports & Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Performance financière détaillée</p>
      </div>

      {/* KPI row */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(kpis as { label: string; value: string | number; icon: React.ElementType; color: string }[]).map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${kpi.color}18` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  <p className="text-base font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>{kpi.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CA chart */}
        <Card delay={0.1} className="lg:col-span-2">
          <SectionTitle>Chiffre d'affaires (14 derniers jours)</SectionTitle>
          {paymentsLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : dailyChart.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38 90% 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38 90% 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontFamily="Plus Jakarta Sans" />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} fontFamily="Plus Jakarta Sans" />
                  <RTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontFamily: 'Plus Jakarta Sans', fontSize: 12 }}
                    formatter={(v: number) => [formatXAF(v), 'Revenu']}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    itemStyle={{ color: 'hsl(38 90% 56%)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(38 90% 56%)" strokeWidth={2} fill="url(#rev-grad)" dot={false} activeDot={{ r: 4, fill: 'hsl(38 90% 56%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">Aucune donnée de transaction</div>
          )}
        </Card>

        {/* Pie chart */}
        <Card delay={0.15}>
          <SectionTitle>Modes de paiement</SectionTitle>
          {payLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : payStats ? (
            <PaymentPieChart stats={payStats} />
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">Aucune donnée</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 plats (restaurant only) */}
        {sector === 'RESTAURANT' && topDishes.length > 0 && (
          <Card delay={0.2}>
            <SectionTitle>Top 10 des plats les plus vendus</SectionTitle>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDishes.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontFamily="Plus Jakarta Sans" />
                  <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontFamily="Plus Jakarta Sans" width={90} />
                  <RTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontFamily: 'Plus Jakarta Sans', fontSize: 12 }}
                    formatter={(v: number) => [`${v} ventes`]}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    itemStyle={{ color: 'hsl(38 90% 56%)' }}
                  />
                  <Bar dataKey="count" fill="hsl(38 90% 56%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Dernières transactions */}
        <Card delay={0.25} className={sector === 'RESTAURANT' && topDishes.length > 0 ? '' : 'lg:col-span-2'}>
          <SectionTitle>Dernières transactions</SectionTitle>
          {paymentsLoading ? (
            <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recent.length > 0 ? (
            <div className="space-y-1">
              {recent.map((p, i) => {
                const color = PAYMENT_COLORS[p.method as keyof typeof PAYMENT_COLORS] ?? '#6B7280';
                const label = PAYMENT_LABELS[p.method as keyof typeof PAYMENT_LABELS] ?? p.method;
                const Icon = PAYMENT_ICONS[p.method as keyof typeof PAYMENT_ICONS] ?? CreditCard;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2" style={{ borderBottom: i < recent.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {p.reference && ` · ${p.reference}`}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatXAF(p.amount)}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: p.status === 'COMPLETED' ? 'hsl(160 84% 39% / 0.12)' : 'hsl(var(--muted))', color: p.status === 'COMPLETED' ? '#10B981' : 'hsl(var(--muted-foreground))' }}>
                      {p.status === 'COMPLETED' ? 'OK' : p.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-muted-foreground">Aucune transaction enregistrée</div>
          )}
        </Card>
      </div>

      {/* Résumé financier global */}
      {payStats && (
        <Card delay={0.3}>
          <SectionTitle>Résumé financier global</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 p-4 rounded-xl flex flex-col gap-1" style={{ background: 'hsl(38 90% 56% / 0.08)', border: '1px solid hsl(38 90% 56% / 0.2)' }}>
              <p className="text-xs text-muted-foreground">Revenu total encaissé</p>
              <p className="text-2xl font-extrabold" style={{ color: 'hsl(38 90% 56%)', letterSpacing: '-0.02em' }}>{formatXAF(payStats.totalRevenue)}</p>
            </div>
            {[
              { label: 'Espèces', value: payStats.cash, pct: payStats.cashPercent, color: '#10B981' },
              { label: 'MTN MoMo', value: payStats.mtnMobileMoney, pct: payStats.mtnPercent, color: '#F59E0B' },
              { label: 'Orange Money', value: payStats.orangeMoney, pct: payStats.orangePercent, color: '#F97316' },
              { label: 'Carte', value: payStats.card, pct: payStats.cardPercent, color: '#3B82F6' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'hsl(var(--muted))' }}>
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.pct.toFixed(1)}%</span>
                </div>
                <p className="text-sm font-extrabold text-foreground">{formatXAF(item.value)}</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
