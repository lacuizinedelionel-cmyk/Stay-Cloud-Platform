import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { formatXAF } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Building2, Star, MapPin, Trophy,
  ArrowUpRight, Users, CreditCard, Banknote, Smartphone,
  UtensilsCrossed, BedDouble, Scissors, ShoppingCart, Pill,
  Car, Dumbbell, GraduationCap, BarChart3,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   DATA  ─ 6 mois (Déc → Mai)
────────────────────────────────────────────────────────── */
const MONTHLY_DATA = [
  { month: 'Déc', restaurant: 485000, hotel: 2100000, beauty: 680000, grocery: 1850000, pharmacy: 520000, garage: 1120000, fitness: 360000, education: 1800000 },
  { month: 'Jan', restaurant: 395000, hotel: 1800000, beauty: 720000, grocery: 1520000, pharmacy: 580000, garage: 980000,  fitness: 420000, education: 2200000 },
  { month: 'Fév', restaurant: 420000, hotel: 2300000, beauty: 650000, grocery: 1740000, pharmacy: 540000, garage: 1340000, fitness: 390000, education: 1900000 },
  { month: 'Mar', restaurant: 512000, hotel: 1600000, beauty: 790000, grocery: 1960000, pharmacy: 610000, garage: 890000,  fitness: 465000, education: 2400000 },
  { month: 'Avr', restaurant: 330000, hotel: 2000000, beauty: 820000, grocery: 2080000, pharmacy: 590000, garage: 1200000, fitness: 480000, education: 2100000 },
  { month: 'Mai', restaurant: 78000,  hotel: 1160000, beauty: 315000, grocery: 810000,  pharmacy: 230000, garage: 420000,  fitness: 190000, education: 820000  },
];

const SECTORS = [
  { key: 'restaurant', label: 'Chez Mama',   icon: UtensilsCrossed, color: '#F97316', city: 'Douala',  rating: 4.7, growth: 8.2  },
  { key: 'hotel',      label: 'Le Prestige', icon: BedDouble,       color: '#818CF8', city: 'Yaoundé', rating: 4.4, growth: 12.5 },
  { key: 'beauty',     label: 'Beauty Palace', icon: Scissors,      color: '#F472B6', city: 'Douala',  rating: 4.6, growth: 5.3  },
  { key: 'grocery',    label: 'Supermarché', icon: ShoppingCart, color: '#34D399', city: 'Douala', rating: 4.2, growth: 18.7 },
  { key: 'pharmacy',   label: 'Pharmacie',   icon: Pill,            color: '#A78BFA', city: 'Yaoundé', rating: 4.6, growth: 3.1  },
  { key: 'garage',     label: 'Garage Auto', icon: Car,             color: '#94A3B8', city: 'Douala',  rating: 4.6, growth: -2.4 },
  { key: 'fitness',    label: 'FitZone',     icon: Dumbbell,        color: '#FBBF24', city: 'Douala',  rating: 4.8, growth: 22.1 },
  { key: 'education',  label: 'Formation',   icon: GraduationCap,   color: '#60A5FA', city: 'Yaoundé', rating: 4.6, growth: 6.8  },
];

function sectorTotal(key: string) {
  return MONTHLY_DATA.reduce((acc, m) => acc + (m as any)[key], 0);
}

const RANKING = [...SECTORS]
  .map(s => ({ ...s, totalCA: sectorTotal(s.key) }))
  .sort((a, b) => b.totalCA - a.totalCA);

const PLATFORM_CA     = RANKING.reduce((a, s) => a + s.totalCA, 0);
const PLATFORM_CA_PREV = Math.round(PLATFORM_CA * 0.878); // +13.9% MoM
const GROWTH_PLATFORM  = (((PLATFORM_CA - PLATFORM_CA_PREV) / PLATFORM_CA_PREV) * 100).toFixed(1);
const AVG_RATING       = (SECTORS.reduce((a, s) => a + s.rating, 0) / SECTORS.length).toFixed(1);

const PAYMENT_DATA = [
  { name: 'Espèces',      value: 52, color: '#34D399' },
  { name: 'MTN MoMo',     value: 24, color: '#FBBF24' },
  { name: 'Orange Money', value: 22, color: '#F97316' },
  { name: 'Virement',     value:  2, color: '#818CF8' },
];

const CITY_DATA = [
  { name: 'Douala',  value: 5, color: 'hsl(38 90% 56%)' },
  { name: 'Yaoundé', value: 3, color: '#818CF8' },
];

/* Visible sectors for the area chart */
type SectorKey = 'restaurant' | 'hotel' | 'beauty' | 'grocery' | 'pharmacy' | 'garage' | 'fitness' | 'education';

/* ──────────────────────────────────────────────────────────
   CUSTOM TOOLTIP
────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a: any, b: any) => b.value - a.value);
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl min-w-[180px] text-xs"
      style={{ background: 'hsl(220 30% 10%)', border: '1px solid hsl(var(--border))' }}>
      <p className="font-bold text-foreground mb-2">{label}</p>
      {sorted.map((p: any) => (
        <div key={p.name} className="flex justify-between items-center gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-foreground">{formatXAF(p.value)}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-border/50 flex justify-between font-bold">
        <span className="text-muted-foreground">Total</span>
        <span className="text-foreground">{formatXAF(sorted.reduce((a: number, p: any) => a + p.value, 0))}</span>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl text-xs"
      style={{ background: 'hsl(220 30% 10%)', border: '1px solid hsl(var(--border))' }}>
      <span style={{ color: d.payload.color }} className="font-bold">{d.name}</span>
      <span className="text-foreground ml-2">{d.value}%</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PAGE
────────────────────────────────────────────────────────── */
export default function SuperAdminAnalyticsPage() {
  const [activeSectors, setActiveSectors] = useState<Set<SectorKey>>(
    new Set(['hotel', 'grocery', 'education', 'garage'])
  );

  function toggleSector(key: SectorKey) {
    setActiveSectors(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Tableau de Bord Analytique
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Performance comparative — 8 enseignes · Décembre 2025 – Mai 2026
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)', border: '1px solid hsl(38 90% 56% / 0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Données en temps réel
          </div>
        </div>
      </motion.div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'CA Plateforme (6 mois)',
            value: formatXAF(PLATFORM_CA),
            sub: `+${GROWTH_PLATFORM}% vs période précédente`,
            icon: BarChart3, color: 'hsl(38 90% 56%)', bg: 'hsl(38 90% 56% / 0.12)',
            trend: { value: parseFloat(GROWTH_PLATFORM), positive: true },
            delay: 0,
          },
          {
            title: 'Enseigne N°1',
            value: RANKING[0].label,
            sub: `${formatXAF(RANKING[0].totalCA)} · ${RANKING[0].city}`,
            icon: Trophy, color: '#FBBF24', bg: 'hsl(45 93% 47% / 0.12)',
            trend: { value: RANKING[0].growth, positive: RANKING[0].growth > 0 },
            delay: 0.06,
          },
          {
            title: 'Note moyenne plateforme',
            value: `${AVG_RATING} / 5`,
            sub: `${SECTORS.reduce((a, s) => a + (s.rating >= 4.5 ? 1 : 0), 0)} enseignes ≥ 4.5★`,
            icon: Star, color: '#F472B6', bg: 'hsl(330 81% 60% / 0.12)',
            trend: { value: 0.3, positive: true },
            delay: 0.12,
          },
          {
            title: 'Enseignes actives',
            value: '8 / 8',
            sub: '2 villes — Douala & Yaoundé',
            icon: Building2, color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)',
            trend: { value: 100, positive: true },
            delay: 0.18,
          },
        ].map(kpi => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: kpi.delay }}
            className="rounded-xl p-5 flex flex-col justify-between"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon className="w-4.5 h-4.5" style={{ color: kpi.color }} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
                style={{
                  background: kpi.trend.positive ? 'hsl(160 84% 39% / 0.12)' : 'hsl(0 72% 51% / 0.1)',
                  color: kpi.trend.positive ? '#10B981' : '#EF4444',
                }}>
                <ArrowUpRight className="w-3 h-3"
                  style={{ transform: kpi.trend.positive ? 'none' : 'rotate(90deg)' }} />
                {kpi.trend.value === 100 ? '100%' : `${kpi.trend.value}%`}
              </div>
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>{kpi.value}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{kpi.title}</p>
              {kpi.sub && <p className="text-[10px] text-muted-foreground mt-0.5 opacity-70">{kpi.sub}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── ROW 2 : AREA CHART + RANKING ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-3 rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <div className="mb-4">
            <h2 className="text-sm font-bold text-foreground">Évolution CA mensuelle</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Cliquez sur un secteur pour l&rsquo;activer / masquer</p>
          </div>

          {/* Sector toggle pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SECTORS.map(s => {
              const active = activeSectors.has(s.key as SectorKey);
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSector(s.key as SectorKey)}
                  className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: active ? `${s.color}20` : 'hsl(var(--muted))',
                    color: active ? s.color : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${active ? s.color + '50' : 'transparent'}`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: active ? s.color : 'currentColor' }} />
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  {SECTORS.map(s => (
                    <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={s.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11}
                  tickLine={false} axisLine={false} fontFamily="Plus Jakarta Sans" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000000).toFixed(1)}M`}
                  fontFamily="Plus Jakarta Sans" />
                <Tooltip content={<ChartTooltip />} />
                {SECTORS.filter(s => activeSectors.has(s.key as SectorKey)).map(s => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={`url(#grad-${s.key})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ranking table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 className="text-sm font-bold text-foreground">Classement des enseignes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">CA cumulé 6 mois</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {RANKING.map((s, idx) => {
              const Icon = s.icon;
              const pct = (s.totalCA / RANKING[0].totalCA) * 100;
              return (
                <div key={s.key} className="flex items-center gap-3 px-5 py-3">
                  {/* Rank */}
                  <span className={`text-sm font-extrabold w-5 shrink-0 ${idx === 0 ? '' : ''}`}
                    style={{ color: idx === 0 ? '#FBBF24' : idx === 1 ? '#94A3B8' : idx === 2 ? '#F97316' : 'hsl(var(--muted-foreground))' }}>
                    {idx + 1}
                  </span>
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}18` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground truncate">{s.label}</span>
                      <span className="text-xs font-bold text-foreground ml-2 shrink-0">
                        {(s.totalCA / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Progress bar */}
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                      {/* Growth */}
                      <span className="text-[10px] font-bold shrink-0 flex items-center gap-0.5"
                        style={{ color: s.growth >= 0 ? '#10B981' : '#EF4444' }}>
                        {s.growth >= 0
                          ? <TrendingUp className="w-2.5 h-2.5" />
                          : <TrendingDown className="w-2.5 h-2.5" />}
                        {Math.abs(s.growth)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── ROW 3 : PAIEMENTS + VILLES + CROISSANCE ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Payment methods pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <h2 className="text-sm font-bold text-foreground mb-1">Modes de paiement</h2>
          <p className="text-xs text-muted-foreground mb-4">Répartition plateforme</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PAYMENT_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {PAYMENT_DATA.map(p => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {PAYMENT_DATA.map(p => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-[11px] text-muted-foreground">{p.name}</span>
                </div>
                <span className="text-[11px] font-bold text-foreground">{p.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* City distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <h2 className="text-sm font-bold text-foreground mb-1">Couverture géographique</h2>
          <p className="text-xs text-muted-foreground mb-4">Enseignes par ville</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CITY_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                  dataKey="value" paddingAngle={4} stroke="none">
                  {CITY_DATA.map(c => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-2">
            {CITY_DATA.map(c => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: c.color }} />
                    <span className="text-[11px] font-semibold text-foreground">{c.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground">{c.value} enseigne{c.value > 1 ? 's' : ''}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="h-full rounded-full" style={{ width: `${(c.value / 8) * 100}%`, background: c.color }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Users className="w-3 h-3" />
                Extension prévue : Bafoussam, Kribi, Limbé
              </div>
            </div>
          </div>
        </motion.div>

        {/* Growth by sector bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
          className="rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <h2 className="text-sm font-bold text-foreground mb-1">Croissance MoM</h2>
          <p className="text-xs text-muted-foreground mb-4">Avr → Mai 2026</p>
          <div className="space-y-3">
            {[...SECTORS].sort((a, b) => b.growth - a.growth).map(s => {
              const Icon = s.icon;
              const isPos = s.growth >= 0;
              const bar = Math.min(Math.abs(s.growth) / 25 * 100, 100);
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}18` }}>
                    <Icon className="w-3 h-3" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground truncate">{s.label}</span>
                      <span className="text-[10px] font-bold ml-1 shrink-0"
                        style={{ color: isPos ? '#10B981' : '#EF4444' }}>
                        {isPos ? '+' : ''}{s.growth}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${bar}%`, background: isPos ? s.color : '#EF4444' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── ROW 4 : NOTES + CA BAR CHART ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Ratings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <h2 className="text-sm font-bold text-foreground mb-1">Satisfaction clients</h2>
          <p className="text-xs text-muted-foreground mb-4">Note moyenne des avis</p>
          <div className="space-y-3">
            {[...SECTORS].sort((a, b) => b.rating - a.rating).map(s => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}18` }}>
                    <Icon className="w-3 h-3" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-foreground font-medium truncate">{s.label}</span>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Star className="w-3 h-3" style={{ color: '#FBBF24' }} fill="#FBBF24" strokeWidth={0} />
                        <span className="text-[11px] font-bold text-foreground">{s.rating}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.rating / 5) * 100}%`, background: s.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CA total bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
          className="lg:col-span-3 rounded-xl p-6"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <h2 className="text-sm font-bold text-foreground mb-1">CA total par enseigne</h2>
          <p className="text-xs text-muted-foreground mb-4">Cumulé 6 derniers mois (en millions XAF)</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={RANKING.map(s => ({ name: s.label, ca: s.totalCA, color: s.color }))}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000000).toFixed(1)}M`}
                  fontFamily="Plus Jakarta Sans" />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))"
                  fontSize={10} tickLine={false} axisLine={false} width={70}
                  fontFamily="Plus Jakarta Sans" />
                <Tooltip
                  formatter={(v: number) => [formatXAF(v), 'CA']}
                  contentStyle={{
                    background: 'hsl(220 30% 10%)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 11,
                    fontFamily: 'Plus Jakarta Sans',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="ca" radius={[0, 6, 6, 0]}>
                  {RANKING.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
