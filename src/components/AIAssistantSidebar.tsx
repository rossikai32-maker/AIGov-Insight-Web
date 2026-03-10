'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantSidebar({
  isOpen,
  onClose
}: AIAssistantSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        /* 侧边聊天窗口 - 优化样式 */
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          /* 上下留空间，增加宽度，半透明背景，模糊效果 */
          className="fixed bottom-8 right-5 h-200 w-120 bg-white/15 dark:bg-black/15 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col z-50 border border-[var(--border-color)]/30 rounded-2xl"
          style={{ maxWidth: '400px' }}
        >
          {/* 聊天窗口头部 - 半透明背景，模糊效果 */}
          <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-black/10 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">AI 助手</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--hover-background)] transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5 text-[var(--foreground)]" />
            </button>
          </div>
          
          {/* 聊天窗口内容 - 暂时屏蔽 iframe */}
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <div className="text-center p-8">
              <h4 className="text-xl font-semibold text-[var(--foreground)] mb-4">AI 助手功能暂时禁用</h4>
              <p className="text-[var(--muted-foreground)]">该功能正在维护中，敬请期待。</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
