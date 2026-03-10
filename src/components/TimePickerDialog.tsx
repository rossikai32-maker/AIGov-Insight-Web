'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle, Check } from 'lucide-react';

interface TimePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (start: Date, end: Date) => void;
  initialStart: Date;
  initialEnd: Date;
  minTime: Date;
  maxTime: Date;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

interface DateTimeInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const dateToDateTimeInput = (date: Date): DateTimeInput => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
  hour: date.getHours(),
  minute: date.getMinutes(),
  second: date.getSeconds()
});

const dateTimeInputToDate = (input: DateTimeInput): Date => {
  return new Date(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second
  );
};

const isValidDate = (input: DateTimeInput): boolean => {
  const date = dateTimeInputToDate(input);
  return date.getFullYear() === input.year &&
         date.getMonth() === input.month - 1 &&
         date.getDate() === input.day &&
         date.getHours() === input.hour &&
         date.getMinutes() === input.minute &&
         date.getSeconds() === input.second;
};

const formatDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const QUICK_PRESETS = [
  { label: '最近5分钟', minutes: 5 },
  { label: '最近15分钟', minutes: 15 },
  { label: '最近30分钟', minutes: 30 },
  { label: '最近1小时', minutes: 60 },
  { label: '最近3小时', minutes: 180 },
  { label: '最近6小时', minutes: 360 },
  { label: '最近12小时', minutes: 720 },
  { label: '最近24小时', minutes: 1440 },
];

export function TimePickerDialog({
  isOpen,
  onClose,
  onConfirm,
  initialStart,
  initialEnd,
  minTime,
  maxTime,
  anchorRef
}: TimePickerDialogProps) {
  const [startDateTime, setStartDateTime] = useState<DateTimeInput>(dateToDateTimeInput(initialStart));
  const [endDateTime, setEndDateTime] = useState<DateTimeInput>(dateToDateTimeInput(initialEnd));
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const updatePosition = () => {
        const rect = anchorRef.current!.getBoundingClientRect();
        const dialogWidth = 580;
        const dialogHeight = 500;
        const padding = 8;
        
        let left = rect.right - dialogWidth;
        let top = rect.bottom + padding;

        if (left < padding) {
          left = padding;
        }
        
        if (left + dialogWidth > window.innerWidth - padding) {
          left = window.innerWidth - dialogWidth - padding;
        }
        
        if (top + dialogHeight > window.innerHeight - padding) {
          top = rect.top - dialogHeight - padding;
        }
        
        if (top < padding) {
          top = padding;
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (isOpen) {
      setStartDateTime(dateToDateTimeInput(initialStart));
      setEndDateTime(dateToDateTimeInput(initialEnd));
      setError(null);
    }
  }, [isOpen, initialStart, initialEnd]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (anchorRef?.current && !anchorRef.current.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  const validateTimeRange = useCallback((): boolean => {
    if (!isValidDate(startDateTime)) {
      setError('开始时间格式无效');
      return false;
    }

    if (!isValidDate(endDateTime)) {
      setError('结束时间格式无效');
      return false;
    }

    const startDate = dateTimeInputToDate(startDateTime);
    const endDate = dateTimeInputToDate(endDateTime);

    if (startDate >= endDate) {
      setError('开始时间必须早于结束时间');
      return false;
    }

    if (startDate < minTime) {
      setError(`开始时间不能早于 ${minTime.toLocaleString('zh-CN')}`);
      return false;
    }

    if (endDate > maxTime) {
      setError(`结束时间不能晚于 ${maxTime.toLocaleString('zh-CN')}`);
      return false;
    }

    setError(null);
    return true;
  }, [startDateTime, endDateTime, minTime, maxTime]);

  const handleConfirm = useCallback(() => {
    if (validateTimeRange()) {
      const startDate = dateTimeInputToDate(startDateTime);
      const endDate = dateTimeInputToDate(endDateTime);
      onConfirm(startDate, endDate);
      onClose();
    }
  }, [validateTimeRange, startDateTime, endDateTime, onConfirm, onClose]);

  const handleQuickPreset = useCallback((minutes: number) => {
    const now = new Date();
    const end = new Date(Math.min(now.getTime(), maxTime.getTime()));
    const start = new Date(Math.max(end.getTime() - minutes * 60 * 1000, minTime.getTime()));
    
    setStartDateTime(dateToDateTimeInput(start));
    setEndDateTime(dateToDateTimeInput(end));
    setError(null);
  }, [minTime, maxTime]);

  const handleNativeInputChange = useCallback((type: 'start' | 'end', value: string) => {
    if (!value) return;
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const input = dateToDateTimeInput(date);
      if (type === 'start') {
        setStartDateTime(input);
      } else {
        setEndDateTime(input);
      }
      setError(null);
    }
  }, []);

  const handleInputChange = useCallback((
    type: 'start' | 'end',
    field: keyof DateTimeInput,
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    const setter = type === 'start' ? setStartDateTime : setEndDateTime;

    let clampedValue = numValue;

    switch (field) {
      case 'year':
        clampedValue = Math.max(2000, Math.min(2100, numValue));
        break;
      case 'month':
        clampedValue = Math.max(1, Math.min(12, numValue));
        break;
      case 'day':
        clampedValue = Math.max(1, Math.min(31, numValue));
        break;
      case 'hour':
        clampedValue = Math.max(0, Math.min(23, numValue));
        break;
      case 'minute':
      case 'second':
        clampedValue = Math.max(0, Math.min(59, numValue));
        break;
    }

    setter(prev => ({ ...prev, [field]: clampedValue }));
    setError(null);
  }, []);

  const renderDateTimeInput = (
    type: 'start' | 'end',
    dateTime: DateTimeInput,
    setDateTime: React.Dispatch<React.SetStateAction<DateTimeInput>>
  ) => {
    const fields: Array<{ key: keyof DateTimeInput; label: string; max: number }> = [
      { key: 'year', label: '年', max: 2100 },
      { key: 'month', label: '月', max: 12 },
      { key: 'day', label: '日', max: 31 },
      { key: 'hour', label: '时', max: 23 },
      { key: 'minute', label: '分', max: 59 },
      { key: 'second', label: '秒', max: 59 },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${type === 'start' ? 'bg-[var(--accent-blue)]' : 'bg-[var(--accent-purple)]'}`} />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {type === 'start' ? '开始时间' : '结束时间'}
          </span>
        </div>
        
        <div className="grid grid-cols-6 gap-1.5">
          {fields.map(({ key, label }) => (
            <div key={key} className="relative">
              <input
                type="number"
                value={dateTime[key]}
                onChange={(e) => handleInputChange(type, key, e.target.value)}
                onFocus={() => setActiveField(type)}
                className={`w-full px-2 py-2 text-center text-sm rounded-lg border transition-all duration-200
                  ${activeField === type 
                    ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/20 ring-2 ring-[var(--accent-blue)]/40' 
                    : 'border-white/40 dark:border-gray-500/50 bg-white/50 dark:bg-gray-600/50 hover:border-[var(--accent-blue)]/50'
                  }
                  text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-blue)]
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                `}
                min={key === 'year' ? 2000 : key === 'month' ? 1 : key === 'day' ? 1 : 0}
                max={key === 'year' ? 2100 : fields.find(f => f.key === key)?.max}
              />
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-secondary)]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/30 dark:border-gray-500/40">
          <label className="block text-xs text-[var(--text-secondary)] mb-2">快速选择日期时间</label>
          <input
            ref={type === 'start' ? startInputRef : endInputRef}
            type="datetime-local"
            step="1"
            value={formatDateTimeLocal(dateTimeInputToDate(dateTime))}
            onChange={(e) => handleNativeInputChange(type, e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 dark:border-gray-500/50 
              bg-white/50 dark:bg-gray-600/50 text-[var(--foreground)]
              focus:outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/20
              transition-all duration-200"
          />
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  const glassBackground = isDark 
    ? 'rgba(20, 20, 30, 0.75)' 
    : 'rgba(255, 255, 255, 0.35)';

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/50"
            style={{ zIndex: 9998 }}
            onClick={onClose}
          />
          
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ 
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
            className="fixed w-[580px] rounded-2xl overflow-visible"
            style={{ 
              zIndex: 9999,
              top: position.top,
              left: position.left,
            }}
          >
            <div 
              className="relative overflow-hidden rounded-2xl border border-white/30 dark:border-gray-500/40"
              style={{
                background: glassBackground,
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: isDark
                  ? `0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                  : `0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-purple)]/10 pointer-events-none" />
              
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/40 dark:bg-white/10 border border-white/40 dark:border-white/10">
                      <Calendar className="w-4 h-4 text-[var(--accent-blue)]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--foreground)]">精确时间选择</h2>
                      <p className="text-[11px] text-[var(--text-secondary)]">设置话单分析的时间范围</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-1.5 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 
                      text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-all duration-200
                      border border-white/30 dark:border-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    <span className="text-xs font-medium text-[var(--foreground)]">快速选择</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {QUICK_PRESETS.map((preset) => (
                      <motion.button
                        key={preset.minutes}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickPreset(preset.minutes)}
                        className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg 
                          bg-white/40 dark:bg-white/10 hover:bg-[var(--accent-blue)]/30
                          text-[var(--foreground)] border border-white/40 dark:border-white/10
                          hover:border-[var(--accent-blue)]/50 transition-all duration-200"
                      >
                        {preset.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  {renderDateTimeInput('start', startDateTime, setStartDateTime)}
                  {renderDateTimeInput('end', endDateTime, setEndDateTime)}
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4"
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-4 border-t border-white/30 dark:border-gray-500/40">
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <span>可用范围:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {minTime.toLocaleString('zh-CN')}
                      </span>
                      <span>至</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {maxTime.toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg 
                        bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20
                        text-[var(--foreground)] border border-white/40 dark:border-white/10
                        transition-all duration-200"
                    >
                      取消
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      className="px-4 py-1.5 text-xs font-medium rounded-lg 
                        bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-hover)]
                        hover:from-[var(--accent-blue-hover)] hover:to-[var(--accent-blue)]
                        text-white shadow-lg shadow-[var(--accent-blue)]/20
                        transition-all duration-200 flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      确认
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
}
