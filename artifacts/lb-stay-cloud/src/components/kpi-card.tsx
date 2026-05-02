import { motion, useInView, useAnimation, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { formatXAF } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export function AnimatedNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = isCurrency 
              ? formatXAF(latest)
              : Math.round(latest).toString();
          }
        }
      });
      return controls.stop;
    }
  }, [value, isInView, isCurrency, motionValue]);

  return <span ref={ref}>{isCurrency ? formatXAF(0) : '0'}</span>;
}

// Need to import animate from framer-motion but it's not exported directly in all versions, 
// using animate function:
import { animate } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  trend?: { value: number; isPositive: boolean };
}

export function KPICard({ title, value, icon: Icon, isCurrency = false, trend }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card border-border/50 shadow-lg hover-elevate">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {title}
            </h3>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight text-foreground font-serif">
              <AnimatedNumber value={value} isCurrency={isCurrency} />
            </div>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
