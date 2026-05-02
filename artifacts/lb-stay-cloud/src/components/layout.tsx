import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Users, Settings, Bell, LogOut,
  UtensilsCrossed, Building2, Scissors, ShoppingBag,
  Pill, Wrench, Dumbbell, GraduationCap, BarChart2,
  Calendar, Package, ClipboardList, Zap, ChevronDown,
  BedDouble, CreditCard, TrendingUp, Star, ShoppingCart,
  UserCheck, BookOpen, Activity, Wallet,
} from 'lucide-react';

/* ══════════════════════════════════════
   Types
══════════════════════════════════════ */
type Sector = 'HOTEL' | 'RESTAURANT' | 'GROCERY' | 'PHARMACY' | 'BEAUTY' | 'GARAGE' | 'FITNESS' | 'EDUCATION';

interface SubItem { label: string; href: string; icon: React.ElementType }
interface Enseigne {
  id: string;
  name: string;
  sector: Sector;
  badge?: string;
}

/* ══════════════════════════════════════
   Config secteurs
══════════════════════════════════════ */
const SECTOR_CFG: Record<Sector, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
}> = {
  HOTEL:      { label: 'Hôtellerie',        icon: Building2,       color: '#818CF8', bg: 'hsl(239 84% 67% / 0.12)', gradient: 'linear-gradient(135deg,#4F46E5,#818CF8)' },
  RESTAURANT: { label: 'Restauration',      icon: UtensilsCrossed, color: '#F97316', bg: 'hsl(25 95% 53% / 0.12)', gradient: 'linear-gradient(135deg,#EA580C,#F97316)' },
  GROCERY:    { label: 'Supermarché',       icon: ShoppingBag,     color: '#34D399', bg: 'hsl(160 84% 39% / 0.12)', gradient: 'linear-gradient(135deg,#059669,#34D399)' },
  PHARMACY:   { label: 'Pharmacie',         icon: Pill,            color: '#F472B6', bg: 'hsl(330 81% 60% / 0.12)', gradient: 'linear-gradient(135deg,#DB2777,#F472B6)' },
  BEAUTY:     { label: 'Beauté',            icon: Scissors,        color: '#A78BFA', bg: 'hsl(262 83% 58% / 0.12)', gradient: 'linear-gradient(135deg,#7C3AED,#A78BFA)' },
  GARAGE:     { label: 'Garage Auto',       icon: Wrench,          color: '#94A3B8', bg: 'hsl(215 20% 65% / 0.12)', gradient: 'linear-gradient(135deg,#64748B,#94A3B8)' },
  FITNESS:    { label: 'Fitness',           icon: Dumbbell,        color: '#FBBF24', bg: 'hsl(38 92% 50% / 0.12)', gradient: 'linear-gradient(135deg,#D97706,#FBBF24)' },
  EDUCATION:  { label: 'Formation',         icon: GraduationCap,   color: '#60A5FA', bg: 'hsl(213 93% 68% / 0.12)', gradient: 'linear-gradient(135deg,#2563EB,#60A5FA)' },
};

/* ── Sous-menus par secteur ── */
const SUB_MENUS: Record<Sector, SubItem[]> = {
  HOTEL: [
    { label: 'Tableau de bord',  href: '/hotel/dashboard',     icon: LayoutDashboard },
    { label: 'Chambres',          href: '/hotel/rooms',          icon: BedDouble       },
    { label: 'Réservations',      href: '/hotel/reservations',   icon: Calendar        },
    { label: 'Analyses',          href: '/analytics',            icon: TrendingUp      },
  ],
  RESTAURANT: [
    { label: 'Tableau de bord',  href: '/restaurant/dashboard', icon: LayoutDashboard },
    { label: 'Caisse (POS)',      href: '/restaurant/pos',       icon: CreditCard      },
    { label: 'Commandes',         href: '/restaurant/orders',    icon: Package         },
    { label: 'Menu & Carte',      href: '/restaurant/menu',      icon: ClipboardList   },
    { label: 'Analyses',          href: '/analytics',            icon: TrendingUp      },
  ],
  GROCERY: [
    { label: 'Tableau de bord',  href: '/grocery/dashboard',    icon: LayoutDashboard },
    { label: 'Catalogue',         href: '/grocery/products',     icon: ShoppingCart    },
    { label: 'Stock & Inventaire',href: '/grocery/stock',        icon: Package         },
    { label: 'L\'Ardoise',        href: '/grocery/credits',      icon: CreditCard      },
    { label: 'Analyses',          href: '/analytics',            icon: TrendingUp      },
  ],
  PHARMACY: [
    { label: 'Tableau de bord',  href: '/pharmacy/dashboard',   icon: LayoutDashboard },
    { label: 'Médicaments',       href: '/pharmacy/medications', icon: Pill            },
    { label: 'Ordonnances',       href: '/pharmacy/prescriptions',icon: ClipboardList  },
    { label: 'Analyses',          href: '/analytics',            icon: TrendingUp      },
  ],
  BEAUTY: [
    { label: 'Tableau de bord',  href: '/beauty/dashboard',     icon: LayoutDashboard },
    { label: 'Rendez-vous',       href: '/beauty/appointments',  icon: Calendar        },
    { label: 'Prestations',       href: '/beauty/services',      icon: Star            },
    { label: 'Personnel',         href: '/beauty/staff',         icon: Users           },
  ],
  GARAGE: [
    { label: 'Tableau de bord',  href: '/garage/dashboard',     icon: LayoutDashboard },
    { label: 'Véhicules',         href: '/garage/vehicles',      icon: Wrench          },
    { label: 'Devis',             href: '/garage/quotes',        icon: ClipboardList   },
  ],
  FITNESS: [
    { label: 'Tableau de bord',  href: '/fitness/dashboard',    icon: LayoutDashboard },
    { label: 'Membres',           href: '/fitness/members',      icon: UserCheck       },
    { label: 'Cours',             href: '/fitness/classes',      icon: Activity        },
  ],
  EDUCATION: [
    { label: 'Tableau de bord',  href: '/education/dashboard',  icon: LayoutDashboard },
    { label: 'Cours',             href: '/education/courses',    icon: BookOpen        },
    { label: 'Apprenants',        href: '/education/students',   icon: Users           },
  ],
};

/* ══════════════════════════════════════
   Données démo Super Admin (10 enseignes)
══════════════════════════════════════ */
const DEMO_ENSEIGNES: Enseigne[] = [
  { id: 'h1', name: 'Hôtel Le Prestige',      sector: 'HOTEL',      badge: 'PRO'  },
  { id: 'h2', name: 'Hôtel Akwa Palace',      sector: 'HOTEL'                     },
  { id: 'h3', name: 'Hôtel Mont Fébé',        sector: 'HOTEL'                     },
  { id: 'r1', name: 'Restaurant Chez Mama',   sector: 'RESTAURANT', badge: 'PRO'  },
  { id: 'r2', name: 'La Table Royale',         sector: 'RESTAURANT'                },
  { id: 'r3', name: 'Maquis du Centre',        sector: 'RESTAURANT'                },
  { id: 'g1', name: 'Super Marché Central',    sector: 'GROCERY',    badge: 'PRO'  },
  { id: 'g2', name: 'Economat du Quartier',    sector: 'GROCERY'                   },
  { id: 'g3', name: 'Marché des Familles',     sector: 'GROCERY'                   },
  { id: 'p1', name: 'Pharmacie Centrale Plus', sector: 'PHARMACY',   badge: 'NEW'  },
];

/* ══════════════════════════════════════
   Composant AccordionEnsigne
══════════════════════════════════════ */
function AccordionEnsigne({
  enseigne,
  defaultOpen = false,
}: {
  enseigne: Enseigne;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [location] = useLocation();
  const cfg   = SECTOR_CFG[enseigne.sector];
  const Icon  = cfg.icon;
  const items = SUB_MENUS[enseigne.sector];

  const isAnyActive = items.some(
    it => location === it.href || location.startsWith(it.href + '/')
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isAnyActive ? cfg.color + '40' : 'hsl(var(--border))'}` }}>
      {/* Header bouton */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all group"
        style={{
          background: isAnyActive ? cfg.bg : open ? 'hsl(var(--muted) / 0.5)' : 'transparent',
        }}
      >
        {/* Icône avec gradient */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{ background: open || isAnyActive ? cfg.gradient : 'hsl(var(--muted))' }}
        >
          <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold truncate leading-tight"
            style={{ color: isAnyActive ? cfg.color : 'hsl(var(--foreground))' }}
          >
            {enseigne.name}
          </p>
          <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
        </div>

        {/* Badge */}
        {enseigne.badge && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {enseigne.badge}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Sous-menu */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-2 pb-2 pt-1 space-y-0.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              {items.map(item => {
                const isActive = location === item.href || location.startsWith(item.href + '/');
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group"
                    style={{
                      background: isActive ? cfg.bg : 'transparent',
                      color: isActive ? cfg.color : 'hsl(var(--muted-foreground))',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {/* Indicateur actif */}
                    <div
                      className="w-1 h-1 rounded-full shrink-0 transition-all"
                      style={{ background: isActive ? cfg.color : 'hsl(var(--muted-foreground) / 0.4)' }}
                    />
                    <ItemIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                    {isActive && (
                      <div
                        className="ml-auto w-1 h-4 rounded-full"
                        style={{ background: cfg.color }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════
   Sidebar Super Admin
══════════════════════════════════════ */
function SuperAdminSidebar({ user, logout }: { user: any; logout: () => void }) {
  const [location] = useLocation();

  // Grouper les enseignes par secteur pour l'affichage
  const grouped = DEMO_ENSEIGNES.reduce<Record<string, Enseigne[]>>((acc, e) => {
    (acc[e.sector] = acc[e.sector] ?? []).push(e);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex flex-col w-64"
      style={{ background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--border))' }}
    >
      {/* Logo */}
      <SidebarLogo />

      <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-1">
        {/* Vue globale */}
        <Link
          href="/superadmin"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-3"
          style={{
            background: location === '/superadmin' ? 'hsl(38 90% 56% / 0.15)' : 'hsl(var(--muted))',
            color: location === '/superadmin' ? 'hsl(38 90% 56%)' : 'hsl(var(--foreground))',
            border: location === '/superadmin' ? '1px solid hsl(38 90% 56% / 0.3)' : '1px solid transparent',
          }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center gradient-gold shrink-0">
            <LayoutDashboard className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          Vue Globale
        </Link>

        {/* Section MES ENSEIGNES */}
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            Mes Enseignes
          </p>
          <div className="space-y-1.5">
            {Object.entries(grouped).map(([sector, enseignes]) => (
              <div key={sector}>
                {/* Séparateur secteur */}
                <div className="flex items-center gap-2 px-1 mb-1 mt-2">
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: SECTOR_CFG[sector as Sector].color }}
                  >
                    {SECTOR_CFG[sector as Sector].label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: SECTOR_CFG[sector as Sector].color + '30' }} />
                </div>
                <div className="space-y-1">
                  {enseignes.map((e, i) => (
                    <AccordionEnsigne key={e.id} enseigne={e} defaultOpen={i === 0 && sector === 'HOTEL'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SidebarFooter user={user} logout={logout} role="Super Administrateur" />
    </div>
  );
}

/* ══════════════════════════════════════
   Sidebar Enseigne (user connecté)
══════════════════════════════════════ */
function BusinessSidebar({ user, business, logout }: { user: any; business: any; logout: () => void }) {
  const [location] = useLocation();
  const sector = business?.sector as Sector | undefined;
  const cfg    = sector ? SECTOR_CFG[sector] : null;
  const Icon   = cfg?.icon ?? LayoutDashboard;

  const enseigne: Enseigne | null = sector
    ? { id: String(business.id), name: business.name, sector, badge: 'PRO' }
    : null;

  const sharedItems = [
    { href: '/clients',       label: 'Clients',       icon: Users    },
    { href: '/analytics',     label: 'Analyses',      icon: BarChart2 },
    { href: '/billing',       label: 'Abonnement',    icon: Wallet   },
    { href: '/notifications', label: 'Notifications', icon: Bell     },
    { href: '/settings',      label: 'Paramètres',    icon: Settings },
  ];

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex flex-col w-64"
      style={{ background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--border))' }}
    >
      <SidebarLogo />

      <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-1">

        {/* Badge enseigne en haut */}
        {cfg && enseigne && (
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-3"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: cfg.gradient }}
            >
              <Icon className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: cfg.color }}>
                {business.name}
              </p>
              <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
            </div>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: cfg.color + '20', color: cfg.color }}
            >
              PRO
            </span>
          </div>
        )}

        {/* Section enseigne — sous-menus */}
        {enseigne && (
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
              Mon Enseigne
            </p>
            <AccordionEnsigne enseigne={enseigne} defaultOpen />
          </div>
        )}

        {/* Section Général */}
        <div>
          <div className="my-2 border-t" style={{ borderColor: 'hsl(var(--border))' }} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            Général
          </p>
          <div className="space-y-0.5">
            {sharedItems.map(item => {
              const isActive = location === item.href;
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: isActive ? 'hsl(38 90% 56% / 0.12)' : 'transparent',
                    color: isActive ? 'hsl(38 90% 56%)' : 'hsl(var(--muted-foreground))',
                    border: isActive ? '1px solid hsl(38 90% 56% / 0.25)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <ItemIcon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1 h-4 rounded-full" style={{ background: 'hsl(38 90% 56%)' }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <SidebarFooter user={user} logout={logout} role={cfg?.label} />
    </div>
  );
}

/* ══════════════════════════════════════
   Sous-composants partagés
══════════════════════════════════════ */
function SidebarLogo() {
  return (
    <div
      className="flex items-center gap-3 h-16 px-5 shrink-0"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-gold shrink-0">
        <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-extrabold tracking-tight text-foreground" style={{ letterSpacing: '-0.02em' }}>
          LB Stay Cloud
        </span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Platform SaaS
        </span>
      </div>
    </div>
  );
}

function SidebarFooter({ user, logout, role }: { user: any; logout: () => void; role?: string }) {
  return (
    <div className="p-3 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1"
        style={{ background: 'hsl(var(--muted) / 0.5)' }}
      >
        <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{role ?? user.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground transition-all"
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(0 72% 51% / 0.08)'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = ''; }}
      >
        <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
        Déconnexion
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   Export principal
══════════════════════════════════════ */
export function Sidebar() {
  const { user, business, logout } = useAuth();

  if (!user) return null;

  if (user.role === 'SUPER_ADMIN') {
    return <SuperAdminSidebar user={user} logout={logout} />;
  }

  return <BusinessSidebar user={user} business={business} logout={logout} />;
}
