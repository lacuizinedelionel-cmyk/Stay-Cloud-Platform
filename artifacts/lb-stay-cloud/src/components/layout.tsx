import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { BusinessSector } from '@workspace/api-client-react';
import { 
  LayoutDashboard, Users, Settings, Bell, LogOut, Store, 
  UtensilsCrossed, Building2, Scissors, ShoppingBasket, 
  Pill, Wrench, Dumbbell, GraduationCap, ChartPie,
  Menu, X, Calendar, Package, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const [location] = useLocation();
  const { user, business, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(true);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const menuItems = isSuperAdmin ? [
    { href: '/superadmin', label: 'Vue Globale', icon: LayoutDashboard },
  ] : getBusinessMenuItems(business?.sector, business?.id);

  const sharedItems = !isSuperAdmin ? [
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/analytics', label: 'Analyses', icon: ChartPie },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ] : [];

  return (
    <>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border/50 transition-transform duration-300",
        !isOpen && "-translate-x-full md:translate-x-0 md:w-20"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          <Link href={isSuperAdmin ? "/superadmin" : "/dashboard"} className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="font-serif font-bold text-primary-foreground text-xl">L</span>
            </div>
            {isOpen && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="font-serif font-bold text-lg whitespace-nowrap text-foreground"
              >
                Stay Cloud
              </motion.span>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => (
              <NavItem key={item.href} item={item} isActive={location === item.href || location.startsWith(item.href + '/')} isOpen={isOpen} />
            ))}
            
            {sharedItems.length > 0 && (
              <>
                <div className={cn("my-4 border-t border-border/50 mx-3", !isOpen && "opacity-50")} />
                {sharedItems.map((item) => (
                  <NavItem key={item.href} item={item} isActive={location === item.href} isOpen={isOpen} />
                ))}
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-border/50 bg-card">
          <div className={cn("flex items-center gap-3 mb-4", !isOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 border border-secondary/50">
              <span className="text-secondary font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {isSuperAdmin ? 'Super Admin' : business?.name}
                </p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className={cn("w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10", !isOpen && "px-0 justify-center")}
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            {isOpen && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </div>

      {!isOpen && (
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed top-4 left-4 z-40 md:hidden bg-card shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}
    </>
  );
}

function NavItem({ item, isActive, isOpen }: { item: any, isActive: boolean, isOpen: boolean }) {
  return (
    <Link 
      href={item.href} 
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
      title={!isOpen ? item.label : undefined}
    >
      <item.icon className={cn("w-5 h-5 shrink-0 relative z-10", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {isOpen && <span className="relative z-10">{item.label}</span>}
      {isActive && isOpen && (
        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-lg" />
      )}
    </Link>
  );
}

function getBusinessMenuItems(sector?: BusinessSector, id?: number) {
  const base = '/dashboard';
  if (!sector) return [{ href: base, label: 'Tableau de bord', icon: LayoutDashboard }];

  const prefix = `/${sector.toLowerCase()}`;
  
  switch (sector) {
    case 'RESTAURANT':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/pos`, label: 'Caisse (POS)', icon: UtensilsCrossed },
        { href: `${prefix}/menu`, label: 'Menu', icon: ClipboardList },
        { href: `${prefix}/orders`, label: 'Commandes', icon: Package },
      ];
    case 'HOTEL':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/rooms`, label: 'Chambres', icon: Building2 },
        { href: `${prefix}/reservations`, label: 'Réservations', icon: Calendar },
      ];
    case 'BEAUTY':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/appointments`, label: 'Rendez-vous', icon: Calendar },
        { href: `${prefix}/services`, label: 'Prestations', icon: Scissors },
        { href: `${prefix}/staff`, label: 'Personnel', icon: Users },
      ];
    case 'GROCERY':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/products`, label: 'Catalogue', icon: ShoppingBasket },
        { href: `${prefix}/stock`, label: 'Stock', icon: Package },
      ];
    case 'PHARMACY':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/medications`, label: 'Médicaments', icon: Pill },
        { href: `${prefix}/prescriptions`, label: 'Ordonnances', icon: ClipboardList },
      ];
    case 'GARAGE':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/vehicles`, label: 'Véhicules', icon: Wrench },
        { href: `${prefix}/quotes`, label: 'Devis', icon: ClipboardList },
        { href: `${prefix}/parts`, label: 'Pièces', icon: Package },
      ];
    case 'FITNESS':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/members`, label: 'Membres', icon: Users },
        { href: `${prefix}/classes`, label: 'Cours', icon: Dumbbell },
      ];
    case 'EDUCATION':
      return [
        { href: `${prefix}/dashboard`, label: 'Tableau de bord', icon: LayoutDashboard },
        { href: `${prefix}/courses`, label: 'Cours', icon: GraduationCap },
        { href: `${prefix}/students`, label: 'Apprenants', icon: Users },
      ];
    default:
      return [{ href: base, label: 'Tableau de bord', icon: LayoutDashboard }];
  }
}
