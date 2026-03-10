'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <div className="relative flex items-center justify-center bg-[var(--card-background)]/50 backdrop-blur-sm rounded-full p-1.5 border border-[var(--border-color)] shadow-sm">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;

        return (
          <button
            key={tab.id}
            className="relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 overflow-hidden"
            style={{
              zIndex: isActive ? 2 : 1,
              color: isActive 
                ? 'var(--foreground)' 
                : isHovered 
                  ? 'var(--foreground)' 
                  : 'var(--text-secondary)',
            }}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[var(--accent-blue)]/10 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
