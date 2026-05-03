import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatXAF } from '@/lib/utils';
import {
  Zap, Star, Crown, CheckCircle2, AlertTriangle, XCircle,
  ArrowUpRight, CreditCard, Calendar, Building2, Pencil, FileText,
  Ban, X, Check, ChevronDown, Printer, Download, RefreshCw,
  UtensilsCrossed, BedDouble, Scissors, ShoppingCart, Pill,
  Car, Dumbbell, GraduationCap, Clock,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   TYPES & CONSTANTS
────────────────────────────────────────────────────────── */
type PlanId = 'STARTER' | 'PRO' | 'ELITE';
type SubStatus = 'ACTIF' | 'EN_RETARD' | 'SUSPENDU';

interface Subscription {
  id: number;
  businessName: string;
  sector: string;
  city: string;
  icon: React.ElementType;
  plan: PlanId;
  status: SubStatus;
  renewalDate: string;
  lastPaid: string;
  lastPaidAmount: number;
  contact: string;
  email: string;
}

const PLAN_CFG: Record<PlanId, { label: string; price: number; color: string; bg: string; icon: React.ElementType; gradient: string }> = {
  STARTER: { label: 'Starter', price: 15_000, color: '#60A5FA', bg: 'hsl(217 91% 60% / 0.10)', icon: Zap,   gradient: 'linear-gradient(135deg,#2563EB,#60A5FA)' },
  PRO:     { label: 'Pro',     price: 35_000, color: 'hsl(38 90% 56%)', bg: 'hsl(38 90% 56% / 0.10)', icon: Star,  gradient: 'linear-gradient(135deg,#D97706,#F5A623)' },
  ELITE:   { label: 'Elite',   price: 75_000, color: '#A78BFA', bg: 'hsl(258 90% 66% / 0.10)', icon: Crown, gradient: 'linear-gradient(135deg,#7C3AED,#A78BFA)' },
};

const STATUS_CFG: Record<SubStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ACTIF:     { label: 'Actif',      color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)', icon: CheckCircle2  },
  EN_RETARD: { label: 'En retard',  color: '#F59E0B', bg: 'hsl(38 90% 56% / 0.12)', icon: AlertTriangle },
  SUSPENDU:  { label: 'Suspendu',   color: '#EF4444', bg: 'hsl(0 72% 51% / 0.12)',  icon: XCircle       },
};

const PAYMENT_STATUS_CFG: Record<SubStatus, { label: string; color: string; bg: string }> = {
  ACTIF:     { label: 'Payé',       color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)' },
  EN_RETARD: { label: 'En attente',  color: '#F59E0B', bg: 'hsl(38 90% 56% / 0.12)' },
  SUSPENDU:  { label: 'Expiré',      color: '#EF4444', bg: 'hsl(0 72% 51% / 0.12)' },
};

const INITIAL_SUBS: Subscription[] = [
  { id: 1, businessName: 'Restaurant Chez Mama',        sector: 'RESTAURANT', city: 'Douala',  icon: UtensilsCrossed, plan: 'PRO',     status: 'ACTIF',     renewalDate: '15 Juin 2026',  lastPaid: '15 Mai 2026',  lastPaidAmount: 35_000, contact: 'M. Ayissi Pierre',   email: 'restaurant@lbstay.com'  },
  { id: 2, businessName: 'Hôtel Le Prestige',           sector: 'HOTEL',      city: 'Yaoundé', icon: BedDouble,       plan: 'ELITE',   status: 'ACTIF',     renewalDate: '1 Juin 2026',   lastPaid: '1 Mai 2026',   lastPaidAmount: 75_000, contact: 'Mme Ngono Cécile',   email: 'hotel@lbstay.com'       },
  { id: 3, businessName: 'Beauty Palace',               sector: 'BEAUTY',     city: 'Douala',  icon: Scissors,        plan: 'STARTER', status: 'ACTIF',     renewalDate: '22 Juin 2026',  lastPaid: '22 Mai 2026',  lastPaidAmount: 15_000, contact: 'Mme Tsafack Carine', email: 'beauty@lbstay.com'      },
  { id: 4, businessName: 'Super Marché Central',        sector: 'GROCERY',    city: 'Douala',  icon: ShoppingCart,    plan: 'PRO',     status: 'ACTIF',     renewalDate: '10 Juin 2026',  lastPaid: '10 Mai 2026',  lastPaidAmount: 35_000, contact: 'M. Balla Moussa',    email: 'grocery@lbstay.com'     },
  { id: 5, businessName: 'Pharmacie Centrale Plus',     sector: 'PHARMACY',   city: 'Yaoundé', icon: Pill,            plan: 'PRO',     status: 'EN_RETARD', renewalDate: '28 Avr 2026',   lastPaid: '28 Mar 2026',  lastPaidAmount: 35_000, contact: 'Dr Tcheuko Martin',  email: 'pharmacy@lbstay.com'    },
  { id: 6, businessName: 'Garage Auto Excellence',      sector: 'GARAGE',     city: 'Douala',  icon: Car,             plan: 'STARTER', status: 'SUSPENDU',  renewalDate: '1 Mai 2026',    lastPaid: '1 Avr 2026',   lastPaidAmount: 15_000, contact: 'M. Owona Bertrand',  email: 'garage@lbstay.com'      },
  { id: 7, businessName: 'FitZone Cameroun',            sector: 'FITNESS',    city: 'Douala',  icon: Dumbbell,        plan: 'PRO',     status: 'ACTIF',     renewalDate: '5 Juin 2026',   lastPaid: '5 Mai 2026',   lastPaidAmount: 35_000, contact: 'Mme Belinga Estelle',email: 'fitness@lbstay.com'     },
  { id: 8, businessName: 'Institut de Formation',       sector: 'EDUCATION',  city: 'Yaoundé', icon: GraduationCap,   plan: 'ELITE',   status: 'ACTIF',     renewalDate: '20 Juin 2026',  lastPaid: '20 Mai 2026',  lastPaidAmount: 75_000, contact: 'Dr Njoya Emmanuel',  email: 'education@lbstay.com'   },
];

/* ──────────────────────────────────────────────────────────
   MODAL — CHANGER DE PLAN
────────────────────────────────────────────────────────── */
function PlanChangeModal({
  sub, onConfirm, onClose,
}: { sub: Subscription; onConfirm: (p: PlanId) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<PlanId>(sub.plan);
  const current = PLAN_CFG[sub.plan];
  const next    = PLAN_CFG[selected];
  const diff    = next.price - current.price;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.65)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 className="text-base font-extrabold text-foreground">Modifier le plan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{sub.businessName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Plan selector */}
          <div className="space-y-2">
            {(['STARTER', 'PRO', 'ELITE'] as PlanId[]).map(pid => {
              const p = PLAN_CFG[pid];
              const Icon = p.icon;
              const isCurrent = pid === sub.plan;
              const isSelected = pid === selected;
              return (
                <button key={pid} onClick={() => setSelected(pid)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left"
                  style={{
                    background: isSelected ? p.bg : 'hsl(var(--muted))',
                    border: `1px solid ${isSelected ? p.color + '60' : 'transparent'}`,
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: p.gradient }}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{p.label}</span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: p.bg, color: p.color }}>ACTUEL</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatXAF(p.price)} / mois</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: p.color }} />}
                </button>
              );
            })}
          </div>

          {/* Diff */}
          {selected !== sub.plan && (
            <div className="rounded-xl p-3 text-xs font-semibold flex items-center justify-between"
              style={{
                background: diff > 0 ? 'hsl(160 84% 39% / 0.08)' : 'hsl(0 72% 51% / 0.08)',
                border: `1px solid ${diff > 0 ? '#10B98130' : '#EF444430'}`,
                color: diff > 0 ? '#10B981' : '#EF4444',
              }}>
              <span>{diff > 0 ? 'Mise à niveau' : 'Rétrogradation'} — différence mensuelle</span>
              <span>{diff > 0 ? '+' : ''}{formatXAF(diff)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Annuler
            </button>
            <button onClick={() => onConfirm(selected)} disabled={selected === sub.plan}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: PLAN_CFG[selected].gradient, color: '#fff' }}>
              Confirmer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
   MODAL — FACTURE
────────────────────────────────────────────────────────── */
function InvoiceModal({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const plan = PLAN_CFG[sub.plan];
  const PIcon = plan.icon;
  const now = new Date();
  const invoiceNo = `LB-2026-${String(sub.id).padStart(4, '0')}`;
  const dueDate = new Date(now.getTime() + 30 * 86400000);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'hsl(0 0% 0% / 0.72)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden my-4"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <span className="text-xs font-semibold text-muted-foreground">Aperçu facture · {invoiceNo}</span>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
              <Printer className="w-3.5 h-3.5" />Imprimer
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
              <Download className="w-3.5 h-3.5" />PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-7 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-gold">
                  <span className="text-white font-extrabold text-sm">LB</span>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">LB Stay Cloud</p>
                  <p className="text-[10px] text-muted-foreground">Plateforme SaaS Multi-Secteur</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Douala, Cameroun<br />
                contact@lbstaycloud.cm<br />
                +237 6 78 90 12 34
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-2"
                style={{ background: 'hsl(38 90% 56% / 0.12)', color: 'hsl(38 90% 56%)' }}>
                FACTURE
              </div>
              <p className="text-lg font-extrabold text-foreground">{invoiceNo}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Émise le {now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Échéance {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: 'hsl(var(--border))' }} />

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Facturé à</p>
              <p className="text-sm font-bold text-foreground">{sub.businessName}</p>
              <p className="text-[11px] text-muted-foreground">{sub.contact}</p>
              <p className="text-[11px] text-muted-foreground">{sub.email}</p>
              <p className="text-[11px] text-muted-foreground">{sub.city}, Cameroun</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Plan actif</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: plan.bg, border: `1px solid ${plan.color}40` }}>
                <PIcon className="w-3.5 h-3.5" style={{ color: plan.color }} />
                <span className="text-sm font-bold" style={{ color: plan.color }}>{plan.label}</span>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
            {/* Table header */}
            <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}>
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-center">Qté</span>
              <span className="col-span-2 text-right">Prix unit.</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            {/* Row */}
            <div className="grid grid-cols-12 items-center px-4 py-3.5 text-xs"
              style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <div className="col-span-6">
                <p className="font-semibold text-foreground">Abonnement {plan.label}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">Accès complet plateforme — 1 mois</p>
              </div>
              <span className="col-span-2 text-center text-foreground">1</span>
              <span className="col-span-2 text-right text-foreground">{formatXAF(plan.price)}</span>
              <span className="col-span-2 text-right font-bold text-foreground">{formatXAF(plan.price)}</span>
            </div>
            {/* Support row */}
            <div className="grid grid-cols-12 items-center px-4 py-3.5 text-xs"
              style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <div className="col-span-6">
                <p className="font-semibold text-foreground">Support technique inclus</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">{plan.label === 'ELITE' ? 'Dédié 24/7' : plan.label === 'PRO' ? 'Prioritaire (24h)' : 'Email (72h)'}</p>
              </div>
              <span className="col-span-2 text-center text-foreground">1</span>
              <span className="col-span-2 text-right text-muted-foreground">Inclus</span>
              <span className="col-span-2 text-right font-bold text-muted-foreground">—</span>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-2">
              {[
                { label: 'Sous-total HT', value: formatXAF(Math.round(plan.price / 1.1925)) },
                { label: 'TVA (19.25%)',  value: formatXAF(plan.price - Math.round(plan.price / 1.1925)) },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-foreground">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2"
                style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <span className="text-sm font-bold text-foreground">Total TTC</span>
                <span className="text-lg font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>
                  {formatXAF(plan.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-muted-foreground text-center pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            Paiement par MTN MoMo · Orange Money · Virement bancaire · Espèces<br />
            LB Stay Cloud — RCCM: RC/DLA/2024/B/1234 — NIU: M024000012345G
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
   PAGE PRINCIPALE
────────────────────────────────────────────────────────── */
export default function SuperAdminBillingPage() {
  const [subs, setSubs]       = useState<Subscription[]>(INITIAL_SUBS);
  const [planModal, setPlanModal] = useState<Subscription | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<Subscription | null>(null);

  function changePlan(sub: Subscription, newPlan: PlanId) {
    setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, plan: newPlan, lastPaidAmount: PLAN_CFG[newPlan].price } : s));
    setPlanModal(null);
  }

  function toggleSuspend(sub: Subscription) {
    setSubs(prev => prev.map(s =>
      s.id === sub.id
        ? { ...s, status: s.status === 'SUSPENDU' ? 'ACTIF' : 'SUSPENDU' }
        : s
    ));
  }

  function markPaid(sub: Subscription) {
    setSubs(prev => prev.map(s =>
      s.id === sub.id ? { ...s, status: 'ACTIF', lastPaid: 'Aujourd\'hui', lastPaidAmount: PLAN_CFG[s.plan].price } : s
    ));
  }

  const mrr       = subs.filter(s => s.status !== 'SUSPENDU').reduce((a, s) => a + PLAN_CFG[s.plan].price, 0);
  const actifs    = subs.filter(s => s.status === 'ACTIF').length;
  const enRetard  = subs.filter(s => s.status === 'EN_RETARD').length;
  const suspended = subs.filter(s => s.status === 'SUSPENDU').length;
  const renewThisMonth = subs.filter(s => s.renewalDate.includes('Juin') || s.renewalDate.includes('Mai')).length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Abonnements &amp; Facturation
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestion des plans, renouvellements et émission de factures — 8 enseignes
        </p>
      </motion.div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MRR plateforme',       value: formatXAF(mrr),     sub: `${subs.filter(s => s.status !== 'SUSPENDU').length} abonnements actifs`, color: 'hsl(38 90% 56%)', bg: 'hsl(38 90% 56% / 0.12)', icon: CreditCard,   trend: '+13.9%', pos: true  },
          { label: 'Comptes actifs',        value: String(actifs),     sub: 'Sur 8 enseignes inscrites',        color: '#10B981', bg: 'hsl(160 84% 39% / 0.12)', icon: CheckCircle2, trend: '100%',   pos: true  },
          { label: 'Paiements en retard',   value: String(enRetard),   sub: enRetard > 0 ? 'Action requise' : 'Aucun impayé',      color: '#F59E0B', bg: 'hsl(38 90% 56% / 0.10)', icon: AlertTriangle,trend: 'Action', pos: false },
          { label: 'Renouvellements (juin)',value: String(renewThisMonth), sub: 'Échéances ce mois',           color: '#818CF8', bg: 'hsl(258 90% 66% / 0.10)', icon: Calendar,    trend: 'Ce mois', pos: true  },
        ].map((kpi, i) => (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-xl p-5 flex flex-col justify-between"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon className="w-4.5 h-4.5" style={{ color: kpi.color }} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: kpi.pos ? 'hsl(160 84% 39% / 0.12)' : 'hsl(38 90% 56% / 0.12)', color: kpi.pos ? '#10B981' : '#F59E0B' }}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>{kpi.value}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 opacity-70">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── TABLEAU ABONNEMENTS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        className="rounded-xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Toutes les enseignes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Cliquez sur une ligne pour voir les détails</p>
          </div>
          <div className="flex items-center gap-2">
            {enRetard > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'hsl(38 90% 56% / 0.12)', color: '#F59E0B' }}>
                <AlertTriangle className="w-3 h-3" />
                {enRetard} impayé{enRetard > 1 ? 's' : ''}
              </span>
            )}
            {suspended > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'hsl(0 72% 51% / 0.12)', color: '#EF4444' }}>
                <Ban className="w-3 h-3" />
                {suspended} suspendu{suspended > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-12 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          style={{ background: 'hsl(var(--muted) / 0.5)', borderBottom: '1px solid hsl(var(--border))' }}>
          <span className="col-span-3">Enseigne</span>
          <span className="col-span-2">Plan</span>
          <span className="col-span-2">Statut</span>
          <span className="col-span-2">Statut du Paiement</span>
          <span className="col-span-1 text-right">Montant</span>
          <span className="col-span-2 text-center">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {subs.map((sub, idx) => {
            const Icon   = sub.icon;
            const plan   = PLAN_CFG[sub.plan];
            const status = STATUS_CFG[sub.status];
            const PlanIcon  = plan.icon;
            const StatIcon  = status.icon;
            const isOverdue = sub.status === 'EN_RETARD';
            const isSusp    = sub.status === 'SUSPENDU';

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-12 items-center px-6 py-4 gap-y-2 hover:bg-muted/30 transition-colors"
              >
                {/* Enseigne */}
                <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${plan.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: plan.color }} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{sub.businessName}</p>
                    <p className="text-[10px] text-muted-foreground">{sub.city} · {sub.contact}</p>
                  </div>
                </div>

                {/* Plan badge */}
                <div className="col-span-4 md:col-span-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: plan.bg, color: plan.color }}>
                    <PlanIcon className="w-3 h-3" />
                    {plan.label}
                  </span>
                </div>

                {/* Status badge */}
                <div className="col-span-4 md:col-span-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: status.bg, color: status.color }}>
                    <StatIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                {/* Payment status */}
                <div className="col-span-4 md:col-span-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: PAYMENT_STATUS_CFG[sub.status].bg, color: PAYMENT_STATUS_CFG[sub.status].color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: PAYMENT_STATUS_CFG[sub.status].color }} />
                    {PAYMENT_STATUS_CFG[sub.status].label}
                  </span>
                </div>

                {/* Due date */}
                <div className="col-span-4 md:col-span-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" style={{ color: isOverdue ? '#F59E0B' : 'hsl(var(--muted-foreground))' }} />
                    <span className="text-[11px]" style={{ color: isOverdue ? '#F59E0B' : 'hsl(var(--muted-foreground))' }}>
                      {sub.renewalDate}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="col-span-6 md:col-span-1 md:text-right">
                  <p className="text-sm font-bold text-foreground">{formatXAF(plan.price)}</p>
                  <p className="text-[10px] text-muted-foreground">/mois</p>
                </div>

                {/* Actions */}
                <div className="col-span-6 md:col-span-2 flex items-center justify-end md:justify-center gap-1.5">
                  {/* Modifier plan */}
                  <button
                    onClick={() => setPlanModal(sub)}
                    title="Modifier le plan"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'hsl(38 90% 56% / 0.10)', color: 'hsl(38 90% 56%)' }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Émettre facture */}
                  <button
                    onClick={() => setInvoiceModal(sub)}
                    title="Émettre une facture"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'hsl(217 91% 60% / 0.10)', color: '#60A5FA' }}>
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  {/* Relancer paiement si en retard */}
                  {isOverdue && (
                    <button
                      onClick={() => markPaid(sub)}
                      title="Marquer comme payé"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: 'hsl(160 84% 39% / 0.10)', color: '#10B981' }}>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Suspendre / Réactiver */}
                  <button
                    onClick={() => toggleSuspend(sub)}
                    title={isSusp ? 'Réactiver' : 'Suspendre'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      background: isSusp ? 'hsl(160 84% 39% / 0.10)' : 'hsl(0 72% 51% / 0.08)',
                      color: isSusp ? '#10B981' : '#EF4444',
                    }}>
                    {isSusp ? <RefreshCw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer total */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)' }}>
          <span className="text-xs text-muted-foreground">
            {subs.length} enseignes · {actifs} actives · {enRetard} en retard · {suspended} suspendues
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">MRR total :</span>
            <span className="text-sm font-extrabold" style={{ color: 'hsl(38 90% 56%)' }}>
              {formatXAF(mrr)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── PLAN DISTRIBUTION ── */}
      <div className="grid grid-cols-3 gap-4">
        {(['STARTER', 'PRO', 'ELITE'] as PlanId[]).map(pid => {
          const p     = PLAN_CFG[pid];
          const PIcon = p.icon;
          const count = subs.filter(s => s.plan === pid).length;
          const revenue = subs.filter(s => s.plan === pid && s.status !== 'SUSPENDU').reduce((a, s) => a + p.price, 0);
          return (
            <motion.div key={pid}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-xl p-5"
              style={{ background: 'hsl(var(--card))', border: `1px solid ${p.color}30` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: p.gradient }}>
                  <PIcon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">{p.label}</p>
                  <p className="text-[11px]" style={{ color: p.color }}>{formatXAF(p.price)} / mois</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Enseignes</span>
                  <span className="font-bold text-foreground">{count}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenu mensuel</span>
                  <span className="font-bold" style={{ color: p.color }}>{formatXAF(revenue)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / 8) * 100}%`, background: p.gradient }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {planModal && (
          <PlanChangeModal
            sub={planModal}
            onConfirm={(p) => changePlan(planModal, p)}
            onClose={() => setPlanModal(null)}
          />
        )}
        {invoiceModal && (
          <InvoiceModal
            sub={invoiceModal}
            onClose={() => setInvoiceModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
