'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface RequestsChartProps {
  stats: {
    requestsByHour?: Array<{ hour: string; count: number }>;
  } | null;
}

export function RequestsChart({ stats }: RequestsChartProps) {
  const chartData = (stats?.requestsByHour || []).map(d => ({
    hour: new Date(d.hour).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    count: d.count
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">日志量趋势</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis 
              dataKey="hour" 
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-background)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--foreground)',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="var(--accent-blue)" 
              strokeWidth={2}
              dot={{ 
                fill: 'var(--accent-blue)', 
                strokeWidth: 2, 
                r: 4
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
