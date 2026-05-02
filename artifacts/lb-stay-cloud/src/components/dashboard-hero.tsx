import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface QuickStat {
  label: string;
  value: string;
  color?: string;
}

interface DashboardHeroProps {
  title: string;
  subtitle: string;
  gradient: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  stats?: QuickStat[];
  badge?: string;
}

function fmtDate() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function DashboardHero({
  title, subtitle, gradient, color, bg, icon: Icon, stats, badge,
}: DashboardHeroProps) {
  const { business } = useAuth();
  const dateStr = fmtDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden mb-8"
      style={{ background: 'hsl(var(--card))', border: `1px solid ${color}28` }}
    >
      {/* Fond dégradé animé */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 90% 50%, ${color}14, transparent 70%)`,
        }}
      />
      {/* Deuxième blob */}
      <div
        className="absolute top-[-30%] right-[-5%] w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}10, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'float 10s ease-in-out infinite',
        }}
      />

      {/* Ligne colorée haut */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: gradient }} />

      {/* Contenu */}
      <div className="relative z-10 flex items-center gap-5 px-6 py-5">
        {/* Icône secteur */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: gradient,
            boxShadow: `0 8px 24px ${color}30`,
          }}
        >
          <Icon className="w-7 h-7 text-white" strokeWidth={2} />
        </motion.div>

        {/* Texte principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-xl font-extrabold tracking-tight text-foreground"
              style={{ letterSpacing: '-0.02em' }}
            >
              {business?.name ?? title}
            </motion.h1>
            {badge && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
              >
                {badge}
              </motion.span>
            )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground mt-0.5 capitalize"
          >
            {subtitle} · <span style={{ color: `${color}cc` }}>{dateStr}</span>
          </motion.p>

          {/* Quickstats pills */}
          {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-2 mt-3"
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: (s.color ?? color) + '18',
                    border: `1px solid ${(s.color ?? color)}30`,
                    color: s.color ?? color,
                  }}
                >
                  <span className="font-bold">{s.value}</span>
                  <span className="opacity-75">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Motif déco droite */}
        <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 opacity-25 select-none">
          {Array.from({ length: 4 }).map((_, row) => (
            <div key={row} className="flex gap-1">
              {Array.from({ length: 5 }).map((__, col) => (
                <div
                  key={col}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color, opacity: Math.random() > 0.4 ? 1 : 0.3 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
