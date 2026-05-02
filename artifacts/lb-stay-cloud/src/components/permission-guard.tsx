import { usePermissions, type AppRole } from '@/hooks/usePermissions';
import { ShieldX, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

interface PermissionGuardProps {
  minRole: AppRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ minRole, children, fallback }: PermissionGuardProps) {
  const { hasMinRole } = usePermissions();
  if (hasMinRole(minRole)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return <AccessDeniedPage />;
}

export function AccessDeniedPage() {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.2)' }}
        >
          <ShieldX className="w-10 h-10" style={{ color: '#EF4444' }} strokeWidth={1.5} />
        </motion.div>

        <h1 className="text-2xl font-extrabold text-foreground mb-2" style={{ letterSpacing: '-0.03em' }}>
          Accès restreint
        </h1>
        <p className="text-sm text-muted-foreground mb-2">
          Cette section est réservée aux <strong className="text-foreground">Gérants</strong> et <strong className="text-foreground">Patrons</strong>.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Contactez votre patron pour obtenir les droits d&apos;accès nécessaires.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'hsl(38 90% 56%)', color: '#000' }}
            >
              Retour au tableau de bord
            </button>
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
          Sécurisé par LB Stay Cloud · Rôle requis : Gérant ou Patron
        </div>
      </motion.div>
    </div>
  );
}
