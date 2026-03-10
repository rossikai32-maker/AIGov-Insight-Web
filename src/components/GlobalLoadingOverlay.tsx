'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface GlobalLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function GlobalLoadingOverlay({ isLoading, message = '加载中...' }: GlobalLoadingOverlayProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(var(--background-rgb), 0.15)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1],
              delay: 0.05
            }}
            className="relative px-8 py-6 rounded-3xl"
            style={{
              background: 'rgba(var(--card-background-rgb), 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(var(--border-color-rgb), 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.12),
                0 2px 8px rgba(0, 0, 0, 0.06),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `
            }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
              >
                <Loader2 
                  className="w-6 h-6" 
                  style={{ color: 'var(--accent-blue)' }}
                />
              </motion.div>
              
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.15,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="text-base font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {message}
              </motion.span>
            </div>

            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '6rem' }}
              transition={{ 
                duration: 0.5, 
                delay: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                background: 'linear-gradient(90deg, transparent, var(--accent-blue), transparent)',
                opacity: 0.6
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
