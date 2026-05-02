import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, Zap, Star, Crown, ArrowRight, Sparkles,
  Shield, HeadphonesIcon, BarChart2, Package,
  Users, Phone, FileText, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { MobileMoneyModal } from '@/components/mobile-money-modal';
import { useAuth } from '@/context/AuthContext';

/* ──────────────────────────────────────────────
   Données plans
────────────────────────────────────────────── */
interface Plan {
  id: 'STARTER' | 'PRO' | 'ELITE';
  name: string;
  price: number;
  description: string;
  color: string;
  bg: string;
  gradient: string;
  icon: React.ElementType;
  badge?: string;
  features: string[];
  limits: {
    enseignes: string;
    users: string;
    support: string;
  };
}

const PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 15_000,
    description: 'Pour démarrer votre activité',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    gradient: 'linear-gradient(135deg,#2563EB,#60A5FA)',
    icon: Zap,
    features: [
      '1 enseigne',
      'Modules ventes & stocks',
      'Rapports basiques',
      'Application mobile',
      'Facturation PDF',
      'Support par email',
    ],
    limits: { enseignes: '1 enseigne', users: '3 utilisateurs', support: 'Email (72h)' },
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 35_000,
    description: 'Le choix des professionnels',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.08)',
    gradient: 'linear-gradient(135deg,#D97706,#F5A623)',
    icon: Star,
    badge: 'Recommandé',
    features: [
      "Jusqu'à 5 enseignes",
      'Tous les modules métiers',
      'POS & Ardoise crédit',
      'Alertes stock critiques',
      'Rapports & analyses avancés',
      'Intégration Mobile Money',
      'Support prioritaire',
      'Export Excel/PDF illimité',
    ],
    limits: { enseignes: '5 enseignes', users: '10 utilisateurs', support: 'Prioritaire (24h)' },
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: 75_000,
    description: 'Pour les groupes & franchises',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    gradient: 'linear-gradient(135deg,#7C3AED,#A78BFA)',
    icon: Crown,
    features: [
      'Enseignes illimitées',
      'Tous les modules Pro',
      'Analyse IA des ventes',
      'API & intégrations tierces',
      'Multi-devises (XAF, EUR, USD)',
      'Manager de franchise dédié',
      "Support 24h/7j",
      'Onboarding personnalisé',
    ],
    limits: { enseignes: 'Illimité', users: 'Illimité', support: 'Dédié 24/7' },
  },
];

/* ──────────────────────────────────────────────
   Composant PlanCard
────────────────────────────────────────────── */
function PlanCard({
  plan,
  current,
  onSubscribe,
}: {
  plan: Plan;
  current: boolean;
  onSubscribe: (plan: Plan) => void;
}) {
  const Icon = plan.icon;
  const isPro = plan.id === 'PRO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: PLANS.indexOf(plan) * 0.1 }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'hsl(var(--card))',
        border: isPro
          ? `2px solid ${plan.color}60`
          : current
          ? `1.5px solid ${plan.color}40`
          : '1px solid hsl(var(--border))',
        boxShadow: isPro ? `0 0 40px ${plan.color}15` : 'none',
        transform: isPro ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Badge recommandé */}
      {plan.badge && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: plan.gradient, color: '#fff' }}
        >
          <Sparkles className="w-3 h-3" />
          {plan.badge}
        </div>
      )}

      {/* Corps */}
      <div className={`flex flex-col flex-1 p-6 ${plan.badge ? 'pt-10' : ''}`}>
        {/* En-tête plan */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: plan.gradient }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground">{plan.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
          </div>
          {current && (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
              style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.color}40` }}
            >
              Plan actuel
            </span>
          )}
        </div>

        {/* Prix */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight" style={{ color: plan.color }}>
              {(plan.price / 1000).toFixed(0)}k
            </span>
            <span className="text-base font-semibold text-muted-foreground">FCFA</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">par mois · facturation mensuelle</p>
        </div>

        {/* Limites clés */}
        <div
          className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-xl"
          style={{ background: plan.bg }}
        >
          {[
            { icon: Package,   val: plan.limits.enseignes },
            { icon: Users,     val: plan.limits.users     },
            { icon: HeadphonesIcon, val: plan.limits.support },
          ].map(({ icon: LIcon, val }) => (
            <div key={val} className="text-center">
              <LIcon className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: plan.color }} />
              <p className="text-[9px] font-semibold leading-tight" style={{ color: plan.color }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <ul className="flex-1 space-y-2 mb-6">
          {plan.features.map(f => (
            <li key={f} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} />
              <span className="text-xs text-foreground">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {current ? (
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.color}30` }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Abonnement actif
          </div>
        ) : (
          <button
            onClick={() => onSubscribe(plan)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: plan.gradient, color: '#fff' }}
          >
            Souscrire au plan {plan.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Page principale
────────────────────────────────────────────── */
export default function BillingPage() {
  const { user, business } = useAuth();
  const [currentPlan] = useState<Plan['id']>('PRO');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [success, setSuccess] = useState<Plan | null>(null);

  function handleSubscribe(plan: Plan) {
    if (plan.id === currentPlan) return;
    setSelectedPlan(plan);
  }

  function handleSuccess() {
    setSuccess(selectedPlan);
    setSelectedPlan(null);
  }

  return (
    <div className="min-h-screen p-6 lg:p-10">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4" style={{ color: 'hsl(38 90% 56%)' }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(38 90% 56%)' }}>
            Abonnement
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
          Choisissez votre plan
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Gérez votre abonnement LB Stay Cloud. Passez à un plan supérieur à tout moment via
          Mobile Money (MTN MoMo ou Orange Money).
        </p>

        {/* Info enseigne */}
        {business && (
          <div
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'hsl(38 90% 56% / 0.1)', color: 'hsl(38 90% 56%)', border: '1px solid hsl(38 90% 56% / 0.25)' }}
          >
            <Zap className="w-3.5 h-3.5" />
            {business.name} · Plan actuel : <strong>PRO</strong>
          </div>
        )}
      </motion.div>

      {/* Bannière succès */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl mb-8"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground">
              Plan {success.name} activé avec succès !
            </p>
            <p className="text-xs text-muted-foreground">
              Votre abonnement a été mis à jour. Les nouveaux modules sont disponibles immédiatement.
            </p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-muted-foreground hover:opacity-70"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Grille plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === currentPlan}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>

      {/* Comparatif */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid hsl(var(--border))' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)' }}>
          <h2 className="text-base font-bold text-foreground">Comparatif des plans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground">Fonctionnalité</th>
                {PLANS.map(p => (
                  <th key={p.id} className="text-center px-5 py-3 text-xs font-bold" style={{ color: p.color }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: i < COMPARE_ROWS.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted) / 0.2)',
                  }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <row.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground">{row.label}</span>
                    </div>
                  </td>
                  {row.values.map((val, j) => (
                    <td key={j} className="text-center px-5 py-3 text-xs">
                      {val === true ? (
                        <Check className="w-4 h-4 mx-auto" style={{ color: PLANS[j].color }} />
                      ) : val === false ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground font-medium">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Paiement sécurisé */}
      <div className="flex items-center justify-center gap-6 mt-8">
        {[
          { icon: Shield,   text: 'Paiement sécurisé' },
          { icon: Phone,    text: 'Mobile Money' },
          { icon: FileText, text: 'Facture PDF automatique' },
          { icon: AlertCircle, text: 'Annulation à tout moment' },
        ].map(({ icon: I, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <I className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>

      {/* Modal Mobile Money */}
      <MobileMoneyModal
        open={!!selectedPlan}
        amount={selectedPlan?.price ?? 0}
        label={`Abonnement ${selectedPlan?.name ?? ''} · LB Stay Cloud`}
        onSuccess={handleSuccess}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Données comparatif
────────────────────────────────────────────── */
const COMPARE_ROWS: {
  label: string;
  icon: React.ElementType;
  values: (boolean | string)[];
}[] = [
  { label: 'Nombre d\'enseignes',         icon: Package,        values: ['1',        '5',         'Illimité'] },
  { label: 'Utilisateurs',                icon: Users,          values: ['3',        '10',        'Illimité'] },
  { label: 'POS & ventes',                icon: BarChart2,      values: [true,       true,        true]       },
  { label: 'Gestion des stocks',          icon: Package,        values: [true,       true,        true]       },
  { label: 'Ardoise crédit clients',      icon: FileText,       values: [false,      true,        true]       },
  { label: 'Facturation PDF',             icon: FileText,       values: [true,       true,        true]       },
  { label: 'Alertes stock critiques',     icon: AlertCircle,    values: [false,      true,        true]       },
  { label: 'Rapports & analyses',         icon: BarChart2,      values: ['Basique',  'Avancé',    'IA']       },
  { label: 'Intégration Mobile Money',    icon: Phone,          values: [false,      true,        true]       },
  { label: 'API & webhooks',              icon: Zap,            values: [false,      false,       true]       },
  { label: 'Support',                     icon: HeadphonesIcon, values: ['Email 72h','Prioritaire','24/7 Dédié'] },
];
