import { animate } from 'framer-motion';
import { motion, useInView, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { formatXAF } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export function AnimatedNumber({ value, isCurrency = false }: { value: number | string; isCurrency?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const isString = typeof value === 'string';

  useEffect(() => {
    if (isString) return;
    if (isInView) {
      const controls = animate(motionValue, value as number, {
        duration: 1.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = isCurrency
              ? formatXAF(latest)
              : Math.round(latest).toLocaleString('fr-FR');
          }
        },
      });
      return controls.stop;
    }
    return undefined;
  }, [value, isInView, isCurrency, motionValue, isString]);

  if (isString) return <span ref={ref}>{value}</span>;
  return <span ref={ref}>{isCurrency ? formatXAF(0) : '0'}</span>;
}

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  isCurrency?: boolean;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  accent?: boolean;
  color?: string;
  staggerIndex?: number;
}

export function KPICard({
  title, value, icon: Icon, isCurrency = false, trend, subtitle, accent, color, staggerIndex = 0,
}: KPICardProps) {
  const iconColor  = color ?? (accent ? 'hsl(38 90% 56%)' : 'hsl(var(--muted-foreground))');
  const iconBg     = color ? `${color}20` : (accent ? 'hsl(38 90% 56% / 0.18)' : 'hsl(var(--muted))');
  const borderCol  = color ? `${color}28` : (accent ? 'hsl(38 90% 56% / 0.3)' : 'hsl(var(--border))');
  const bgStyle    = color
    ? `linear-gradient(135deg, ${color}0d, transparent 70%)`
    : accent
    ? 'linear-gradient(135deg, hsl(38 90% 56% / 0.12), hsl(38 90% 40% / 0.04))'
    : 'hsl(var(--card))';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: staggerIndex * 0.08, ease: 'easeOut' }}
      className="card-hover"
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
    >
      <div
        className="relative p-5 rounded-xl overflow-hidden group cursor-default"
        style={{
          background: bgStyle,
          border: `1px solid ${borderCol}`,
        }}
      >
        {/* Shimmer on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${iconColor}06, transparent 60%)`,
          }}
        />

        {/* Icon + trend row */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className="p-2.5 rounded-xl flex items-center justify-center"
            style={{ background: iconBg }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={2} />
          </motion.div>

          {trend && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: staggerIndex * 0.08 + 0.3 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: trend.isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: trend.isPositive ? '#10B981' : '#EF4444',
              }}
            >
              {trend.isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {Math.abs(trend.value)}%
            </motion.div>
          )}
        </div>

        {/* Value */}
        <p
          className="text-2xl font-extrabold text-foreground mb-1"
          style={{ letterSpacing: '-0.03em' }}
        >
          <AnimatedNumber value={value} isCurrency={isCurrency} />
        </p>

        {/* Label */}
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {title}
        </p>

        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        )}

        {/* Bottom accent line */}
        {(color || accent) && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50"
            style={{ background: `linear-gradient(90deg, ${iconColor}, transparent)` }}
          />
        )}
      </div>
    </motion.div>
  );
}
