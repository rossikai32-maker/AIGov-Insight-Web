'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface TextSelectionPromptProps {
  isSelected: boolean;
  position: { x: number; y: number };
  onSend: () => void;
}

export function TextSelectionPrompt({
  isSelected,
  position,
  onSend
}: TextSelectionPromptProps) {
  return (
    <AnimatePresence>
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--accent-blue)] text-white shadow-lg cursor-pointer hover:bg-[var(--accent-blue-hover)] transition-colors"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSend();
          }}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">AI 分析</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
