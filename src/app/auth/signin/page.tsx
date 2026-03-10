'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQuickLoginEnabled, setIsQuickLoginEnabled] = useState(false);
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // 从API获取快捷登录状态
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setIsQuickLoginEnabled(config.enableQuickLogin);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };
    
    fetchConfig();
  }, []);
  
  // 快捷登录处理函数
  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError('');
    
    // 使用默认管理员用户名和特殊密码进行快捷登录
    const result = await signIn('credentials', {
      username: 'admin',
      password: 'quick-login',
      redirect: false,
    });
    
    if (result?.error) {
      setError('快捷登录失败');
      setIsLoading(false);
      return;
    }
    
    if (result?.ok) {
      router.replace('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('用户名或密码错误');
      setIsLoading(false);
      return;
    }

    if (result?.ok) {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* 登录卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${isDarkMode 
          ? 'bg-white/10 backdrop-blur-3xl border border-white/20' 
          : 'bg-white/80 backdrop-blur-3xl border border-white/30'}`}
        style={{
          boxShadow: isDarkMode 
            ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' 
            : '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.3) inset'
        }}
      >
        {/* 卡片头部 */}
        <div className={`p-10 ${isDarkMode ? 'bg-white/5' : 'bg-white/10'} border-b ${isDarkMode ? 'border-white/10' : 'border-white/20'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            {/* Logo */}
            <div className={`mb-6 inline-block p-3 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            {/* 标题 */}
            <h1 className={`text-2xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>欢迎回来</h1>
            {/* 副标题 */}
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} max-w-xs mx-auto`}>登录到 AISec-Insight 智能 AI 采集探针平台，开始您的智能采集之旅</p>
          </motion.div>
        </div>

        {/* 卡片主体 */}
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入框 */}
            <div className="space-y-2">
              <motion.label
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                htmlFor="username" 
                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
              >
                用户名
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode 
                    ? 'bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-blue-400/50' 
                    : 'bg-white/60 text-gray-900 border border-gray-200 placeholder-gray-400 focus:ring-blue-400/30'}`}
                  style={{
                    backdropFilter: 'blur(10px)',
                    boxShadow: isDarkMode 
                      ? 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' 
                      : 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                />
              </motion.div>
            </div>

            {/* 密码输入框 */}
            <div className="space-y-2">
              <motion.label
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                htmlFor="password" 
                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
              >
                密码
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  required
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode 
                    ? 'bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-blue-400/50' 
                    : 'bg-white/60 text-gray-900 border border-gray-200 placeholder-gray-400 focus:ring-blue-400/30'}`}
                  style={{
                    backdropFilter: 'blur(10px)',
                    boxShadow: isDarkMode 
                      ? 'inset 0 1px 2px rgba(0, 0, 0, 0.3)' 
                      : 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                />
              </motion.div>
            </div>

            {/* 错误信息 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                className={`p-3 rounded-xl text-sm font-medium ${isDarkMode 
                  ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
                  : 'bg-red-50 text-red-600 border border-red-200'}`}
              >
                {error}
              </motion.div>
            )}

            {/* 登录按钮 */}
            <div className="mt-12">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: "easeIn" } }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:shadow-lg'}
                ${isDarkMode 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'}`}
              style={{
                boxShadow: isLoading 
                  ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                  : '0 4px 12px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '登录'
              )}
            </motion.button>
            </div>
            
            {/* 快捷免密登录按钮 - 仅在启用快捷登录时显示 */}
            {isQuickLoginEnabled && (
              <div className="mt-4">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
                  whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: "easeIn" } }}
                  onClick={handleQuickLogin}
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:shadow-lg'}
                    ${isDarkMode 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'}`}
                  style={{
                    boxShadow: isLoading 
                      ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                      : '0 4px 12px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '快捷免密登录'
                  )}
                </motion.button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}