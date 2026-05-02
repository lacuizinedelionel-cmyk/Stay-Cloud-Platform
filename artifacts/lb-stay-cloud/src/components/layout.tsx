import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { BusinessSector } from '@workspace/api-client-react';
import { 
  LayoutDashboard, Users, Settings, Bell, LogOut, 
  UtensilsCrossed, Building2, Scissors, ShoppingBasket, 
  Pill, Wrench, Dumbbell, GraduationCap, BarChart2,
  Calendar, Package, ClipboardList, ChevronRight, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const [location] = useLocation();
  const { user, business, logout } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const menuItems = isSuperAdmin
    ? [{ href: '/superadmin', label: 'Vue Globale', icon: LayoutDashboard }]
    : getBusinessMenuItems(business?.sector);

  const sharedItems = !isSuperAdmin ? [
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/analytics', label: 'Analyses', icon: BarChart2 },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ] : [];

  const sectorLabel = getSectorLabel(business?.sector);
  const SectorIcon = getSectorIcon(business?.sector);

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex flex-col w-64"
      style={{ background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--border))' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-gold shrink-0">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold tracking-tight text-white" style={{ letterSpacing: '-0.02em' }}>
            LB Stay Cloud
          </span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Platform
          </span>
        </div>
      </div>

      {/* Business badge */}
      {!isSuperAdmin && business && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
          <div className="flex items-center gap-2">
            <SectorIcon className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.5} />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">{business.name}</p>
              <p className="text-[10px] text-muted-foreground">{sectorLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-0.5">
        {menuItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={location === item.href || location.startsWith(item.href + '/')}
          />
        ))}

        {sharedItems.length > 0 && (
          <>
            <div className="my-3 mx-1 border-t" style={{ borderColor: 'hsl(var(--border))' }} />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
              Général
            </p>
            {sharedItems.map((item) => (
              <NavItem key={item.href} item={item} isActive={location === item.href} />
            ))}
          </>
        )}
      </div>

      {/* User footer */}
      <div className="p-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1 hover:bg-muted/50 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {isSuperAdmin ? 'Super Administrateur' : user.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function NavItem({ item, isActive }: { item: any; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <item.icon
        className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <span className="flex-1 text-[13px]">{item.label}</span>
      {isActive && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}

function getSectorLabel(sector?: BusinessSector): string {
  const labels: Record<string, string> = {
    RESTAURANT: 'Restauration',
    HOTEL: 'Hôtellerie',
    BEAUTY: 'Beauté & Bien-être',
    GROCERY: 'Supérette',
    PHARMACY: 'Pharmacie',
    GARAGE: 'Garage Auto',
    FITNESS: 'Fitness & Sport',
    EDUCATION: 'Formation',
  };
  return sector ? (labels[sector] ?? sector) : '';
}

function getSectorIcon(sector?: BusinessSector) {
  const icons: Record<string, any> = {
    RESTAURANT: UtensilsCrossed,
    HOTEL: Building2,
    BEAUTY: Scissors,
    GROCERY: ShoppingBasket,
    PHARMACY: Pill,
    GARAGE: Wrench,
    FITNESS: Dumbbell,
    EDUCATION: GraduationCap,
  };
  return sector ? (icons[sector] ?? LayoutDashboard) : LayoutDashboard;
}

function getBusinessMenuItems(sector?: BusinessSector) {
  if (!sector) return [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }];
  const p = `/${sector.toLowerCase()}`;

  const maps: Record<string, any[]> = {
    RESTAURANT: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/pos`, label: 'Caisse (POS)', icon: UtensilsCrossed },
      { href: `${p}/orders`, label: 'Commandes', icon: Package },
      { href: `${p}/menu`, label: 'Menu', icon: ClipboardList },
    ],
    HOTEL: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/rooms`, label: 'Chambres', icon: Building2 },
      { href: `${p}/reservations`, label: 'Réservations', icon: Calendar },
    ],
    BEAUTY: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/appointments`, label: 'Rendez-vous', icon: Calendar },
      { href: `${p}/services`, label: 'Prestations', icon: Scissors },
      { href: `${p}/staff`, label: 'Personnel', icon: Users },
    ],
    GROCERY: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/products`, label: 'Catalogue', icon: ShoppingBasket },
      { href: `${p}/stock`, label: 'Stock', icon: Package },
    ],
    PHARMACY: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/medications`, label: 'Médicaments', icon: Pill },
      { href: `${p}/prescriptions`, label: 'Ordonnances', icon: ClipboardList },
    ],
    GARAGE: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/vehicles`, label: 'Véhicules', icon: Wrench },
      { href: `${p}/quotes`, label: 'Devis', icon: ClipboardList },
    ],
    FITNESS: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/members`, label: 'Membres', icon: Users },
      { href: `${p}/classes`, label: 'Cours', icon: Dumbbell },
    ],
    EDUCATION: [
      { href: `${p}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
      { href: `${p}/courses`, label: 'Cours', icon: GraduationCap },
      { href: `${p}/students`, label: 'Apprenants', icon: Users },
    ],
  };

  return maps[sector] ?? [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }];
}
