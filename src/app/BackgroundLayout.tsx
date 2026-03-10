'use client';

import { motion } from 'framer-motion';
import { useTransparency } from '@/context/TransparencyContext';
import { useTheme } from '@/context/ThemeContext';

interface BackgroundLayoutProps {
  children: React.ReactNode;
}

export default function BackgroundLayout({ children }: BackgroundLayoutProps) {
  const { isDarkMode } = useTheme();
  const { isTransparent } = useTransparency();

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* 背景装饰 - 根据isTransparent状态控制显示 */}
      {isTransparent && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* 主背景渐变 */}
          <div className={`fixed inset-0 ${isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
            : 'bg-gradient-to-br from-blue-10 via-indigo-50 to-purple-50'}`}></div>
          
          {/* 多个流线型装饰元素 - 优化版 */}
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-500/30 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{ willChange: 'transform, opacity' }}
          />
          <motion.div
            className="absolute -bottom-30 -left-30 w-96 h-96 rounded-full bg-purple-500/30 blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            style={{ willChange: 'transform, opacity' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            style={{ willChange: 'transform, opacity' }}
          />
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}