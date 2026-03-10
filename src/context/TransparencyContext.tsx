'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface TransparencyContextType {
  isTransparent: boolean;
  toggleTransparency: () => void;
}

const TransparencyContext = createContext<TransparencyContextType | undefined>(undefined);

export const TransparencyProvider = ({ children }: { children: ReactNode }) => {
  const [isTransparent, setIsTransparent] = useState(true);

  // 从 localStorage 加载状态
  useEffect(() => {
    const savedTransparency = localStorage.getItem('isTransparent');
    if (savedTransparency !== null) {
      setIsTransparent(savedTransparency === 'true');
    }
  }, []);

  // 保存状态到 localStorage
  useEffect(() => {
    localStorage.setItem('isTransparent', isTransparent.toString());
  }, [isTransparent]);

  const toggleTransparency = () => {
    setIsTransparent(prev => !prev);
  };

  return (
    <TransparencyContext.Provider value={{ isTransparent, toggleTransparency }}>
      {children}
    </TransparencyContext.Provider>
  );
};

export const useTransparency = () => {
  const context = useContext(TransparencyContext);
  if (context === undefined) {
    throw new Error('useTransparency must be used within a TransparencyProvider');
  }
  return context;
};