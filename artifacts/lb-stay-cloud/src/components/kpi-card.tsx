import { animate } from 'framer-motion';
import { motion, useInView, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { formatXAF } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export function AnimatedNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 1.2,
        ease: 'easeOut',
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
  }, [value, isInView, isCurrency, motionValue]);

  return <span ref={ref}>{isCurrency ? formatXAF(0) : '0'}</span>;
}

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  accent?: boolean;
}

export function KPICard({ title, value, icon: Icon, isCurrency = false, trend, subtitle, accent }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-hover"
    >
      <div
        className="relative p-5 rounded-xl overflow-hidden"
        style={{
          background: accent ? 'linear-gradient(135deg, hsl(38 90% 56% / 0.15), hsl(38 90% 40% / 0.05))' : 'hsl(var(--card))',
          border: `1px solid ${accent ? 'hsl(38 90% 56% / 0.3)' : 'hsl(var(--border))'}`,
        }}
      >
        {/* Icon + title row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-2 rounded-lg"
            style={{ background: accent ? 'hsl(38 90% 56% / 0.2)' : 'hsl(var(--muted))' }}
          >
            <Icon
              className="w-4 h-4"
              style={{ color: accent ? 'hsl(38 90% 56%)' : 'hsl(var(--muted-foreground))' }}
              strokeWidth={1.5}
            />
          </div>
          {trend && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: trend.isPositive ? 'hsl(160 84% 39% / 0.1)' : 'hsl(0 84% 60% / 0.1)',
                color: trend.isPositive ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)',
              }}
            >
              {trend.isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        {/* Value */}
        <p
          className="text-2xl font-extrabold text-foreground mb-1"
          style={{ letterSpacing: '-0.02em' }}
        >
          <AnimatedNumber value={value} isCurrency={isCurrency} />
        </p>

        {/* Label */}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
