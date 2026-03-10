'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, trend, className, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-6 bg-[var(--card-background)]/50 backdrop-blur-xl border border-[var(--border-color)]/30',
        'hover:shadow-lg transition-shadow duration-300',
        onClick ? 'cursor-pointer hover:border-[var(--accent-blue)]/50' : '',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-[var(--foreground)]">{value}</h3>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-[var(--text-secondary)] ml-2">vs last hour</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-[var(--accent-blue)]/10">
          <Icon className="w-6 h-6 text-[var(--accent-blue)]" />
        </div>
      </div>
    </motion.div>
  );
}
