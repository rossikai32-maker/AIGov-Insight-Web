'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export function AIAssistantModal({
  isOpen,
  onClose,
  initialPrompt
}: AIAssistantModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl h-full max-h-[90vh] bg-[var(--card-background)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]/30 bg-[var(--card-background)]/80 backdrop-blur-md">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">AI 助手</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--hover-background)] transition-colors"
                title="关闭"
              >
                <X className="w-5 h-5 text-[var(--foreground)]" />
              </button>
            </div>
            
            {/* 模态框内容 - 暂时屏蔽 iframe */}
            <div className="flex-1 overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <h4 className="text-xl font-semibold text-[var(--foreground)] mb-4">AI 助手功能暂时禁用</h4>
                <p className="text-[var(--muted-foreground)]">该功能正在维护中，敬请期待。</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
