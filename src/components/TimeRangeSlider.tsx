'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, RefreshCw, Calendar, ZoomIn, ZoomOut, Loader2, Edit3 } from 'lucide-react';
import { TimePickerDialog } from './TimePickerDialog';

const FORMAT_1H = 60 * 60 * 1000;
const TIME_BUFFER = 1 * 60 * 1000;

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) + `.${String(date.getMilliseconds()).padStart(3, '0')}`;
};

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

const formatCompactDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

interface TimeRangeSliderProps {
  startTime: Date;
  endTime: Date;
  initialRange?: { start: Date; end: Date };
  onTimeRangeChange: (range: { start: Date; end: Date }) => void;
  onTimeRangeChangeEnd?: () => void;
  autoRefresh?: boolean;
}

interface FileTimeRange {
  filename: string;
  startTime: Date;
  endTime: Date;
  size: number;
  lineCount: number;
}

export function TimeRangeSlider({ startTime, endTime, initialRange, onTimeRangeChange, onTimeRangeChangeEnd, autoRefresh = false }: TimeRangeSliderProps) {
  const adjustedEndTime = useMemo(() => new Date(endTime.getTime() + TIME_BUFFER), [endTime]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'range' | 'scrollbar' | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const [range, setRange] = useState(() => {
    if (initialRange) {
      return { start: initialRange.start, end: initialRange.end };
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-sec-timeline-range');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const savedStart = new Date(parsed.start);
          const savedEnd = new Date(parsed.end);
          if (savedStart >= new Date(startTime.getTime() - 24 * 60 * 60 * 1000) &&
              savedEnd <= new Date(adjustedEndTime.getTime() + 24 * 60 * 60 * 1000)) {
            return { start: savedStart, end: savedEnd };
          }
        } catch (e) {
          console.error('Failed to parse saved timeline range:', e);
        }
      }
    }
    return {
      start: new Date(adjustedEndTime.getTime() - 5 * 60 * 1000),
      end: adjustedEndTime
    };
  });

  const [mouseStartX, setMouseStartX] = useState(0);
  const [startDragPos, setStartDragPos] = useState({ start: range.start, end: range.end });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLeftHandleHovered, setIsLeftHandleHovered] = useState(false);
  const [isRightHandleHovered, setIsRightHandleHovered] = useState(false);

  const [timelineStart, setTimelineStart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-sec-timeline-start');
      if (saved) {
        try {
          const savedStart = new Date(JSON.parse(saved));
          if (savedStart >= new Date(startTime.getTime() - 24 * 60 * 60 * 1000) &&
              savedStart <= new Date(adjustedEndTime.getTime() + 24 * 60 * 60 * 1000)) {
            return savedStart;
          }
        } catch (e) {
          console.error('Failed to parse saved timeline start:', e);
        }
      }
    }
    return new Date(adjustedEndTime.getTime() - FORMAT_1H);
  });

  const [timelineDuration, setTimelineDuration] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-sec-timeline-duration');
      if (saved) {
        try {
          const savedDuration = JSON.parse(saved);
          if (typeof savedDuration === 'number' && savedDuration > 0) {
            return savedDuration;
          }
        } catch (e) {
          console.error('Failed to parse saved timeline duration:', e);
        }
      }
    }
    return FORMAT_1H;
  });

  const [isScrollbarHovered, setIsScrollbarHovered] = useState(false);
  const [isScrollbarDragging, setIsScrollbarDragging] = useState(false);
  const scrollbarDragStartPercentRef = useRef(0);
  const timePickerButtonRef = useRef<HTMLButtonElement>(null);

  const [fileTimeRanges, setFileTimeRanges] = useState<FileTimeRange[]>([]);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const rangeRef = useRef(range);
  const timelineStartRef = useRef(timelineStart);
  const timelineDurationRef = useRef(timelineDuration);

  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  useEffect(() => {
    timelineStartRef.current = timelineStart;
  }, [timelineStart]);

  useEffect(() => {
    timelineDurationRef.current = timelineDuration;
  }, [timelineDuration]);

  const totalDuration = useMemo(() => adjustedEndTime.getTime() - startTime.getTime(), [startTime, adjustedEndTime]);
  const rangeDuration = useMemo(() => range.end.getTime() - range.start.getTime(), [range.start, range.end]);

  const timelineEnd = useMemo(() => new Date(timelineStart.getTime() + timelineDuration), [timelineStart, timelineDuration]);

  const startPercent = useMemo(() => {
    if (timelineDuration === 0) return 0;
    return ((range.start.getTime() - timelineStart.getTime()) / timelineDuration) * 100;
  }, [range.start, timelineStart, timelineDuration]);

  const endPercent = useMemo(() => {
    if (timelineDuration === 0) return 100;
    return ((range.end.getTime() - timelineStart.getTime()) / timelineDuration) * 100;
  }, [range.end, timelineStart, timelineDuration]);

  const rangeWidth = useMemo(() => endPercent - startPercent, [endPercent, startPercent]);

  const scrollbarWidthPercent = useMemo(() => {
    if (totalDuration === 0) return 100;
    return Math.min(100, (timelineDuration / totalDuration) * 100);
  }, [timelineDuration, totalDuration]);

  const scrollbarStartPercent = useMemo(() => {
    if (totalDuration === 0) return 0;
    const availableSpace = totalDuration - timelineDuration;
    if (availableSpace <= 0) return 0;
    const currentStart = timelineStart.getTime() - startTime.getTime();
    return Math.min(100 - scrollbarWidthPercent, Math.max(0, (currentStart / availableSpace) * 100));
  }, [timelineStart, startTime, totalDuration, timelineDuration, scrollbarWidthPercent]);

  const fetchMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      const response = await fetch('/api/logs/metadata');
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        const convertedFiles = data.files.map((file: any) => ({
          filename: file.filename,
          startTime: new Date(file.startTime),
          endTime: new Date(file.endTime),
          size: file.size || 0,
          lineCount: file.lineCount || 0
        }));
        setFileTimeRanges(convertedFiles);
      }
    } catch (error) {
      console.error('Failed to fetch logs metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handleMouseDown = useCallback((type: 'start' | 'end' | 'range' | 'scrollbar', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(type);
    setMouseStartX(e.clientX);
    setStartDragPos(range);
    if (type === 'scrollbar') {
      scrollbarDragStartPercentRef.current = scrollbarStartPercent;
      setIsScrollbarDragging(true);
    }
  }, [range, scrollbarStartPercent]);

  const animationFrameRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const containerWidth = containerRef.current!.offsetWidth;
      const deltaX = e.clientX - mouseStartX;
      const timePerPixel = timelineDuration / containerWidth;
      const deltaTime = deltaX * timePerPixel;

      let newStart = startDragPos.start;
      let newEnd = startDragPos.end;

      if (isDragging === 'scrollbar') {
        const scrollbarTrackWidth = scrollbarRef.current!.offsetWidth;
        
        const deltaPercent = deltaX / scrollbarTrackWidth;
        const basePercent = scrollbarDragStartPercentRef.current;
        const newScrollbarStartPercent = Math.max(0, Math.min(100 - scrollbarWidthPercent, basePercent + deltaPercent * 100));
        
        const availableSpace = totalDuration - timelineDuration;
        const newTimelineStartMs = startTime.getTime() + (newScrollbarStartPercent / 100) * availableSpace;
        
        const newTimelineStart = new Date(newTimelineStartMs);
        setTimelineStart(newTimelineStart);
        
        const rangeOffset = range.start.getTime() - timelineStart.getTime();
        setRange({
          start: new Date(newTimelineStart.getTime() + rangeOffset),
          end: new Date(newTimelineStart.getTime() + (range.end.getTime() - timelineStart.getTime()))
        });
      } else if (isDragging === 'start') {
        const potentialNewStart = new Date(startDragPos.start.getTime() + deltaTime);
        newStart = new Date(Math.max(potentialNewStart.getTime(), timelineStart.getTime()));
        newEnd = new Date(Math.max(newStart.getTime() + 1000, startDragPos.end.getTime()));
        setRange({ start: newStart, end: newEnd });
      } else if (isDragging === 'end') {
        const potentialNewEnd = new Date(startDragPos.end.getTime() + deltaTime);
        newEnd = new Date(Math.min(potentialNewEnd.getTime(), timelineEnd.getTime()));
        newStart = new Date(Math.min(newEnd.getTime() - 1000, startDragPos.start.getTime()));
        setRange({ start: newStart, end: newEnd });
      } else if (isDragging === 'range') {
        const rangeDur = startDragPos.end.getTime() - startDragPos.start.getTime();
        const potentialNewStartTime = startDragPos.start.getTime() + deltaTime;
        const potentialNewEndTime = startDragPos.end.getTime() + deltaTime;

        newStart = new Date(Math.max(potentialNewStartTime, timelineStart.getTime()));
        newEnd = new Date(Math.min(potentialNewEndTime, timelineEnd.getTime()));

        const newDuration = newEnd.getTime() - newStart.getTime();
        if (newDuration < rangeDur) {
          if (potentialNewStartTime < timelineStart.getTime()) {
            newStart = timelineStart;
            newEnd = new Date(timelineStart.getTime() + rangeDur);
          } else {
            newEnd = timelineEnd;
            newStart = new Date(timelineEnd.getTime() - rangeDur);
          }
        }

        setRange({ start: newStart, end: newEnd });
      }
    });
  }, [isDragging, mouseStartX, startDragPos, timelineStart, timelineEnd, timelineDuration, startTime, adjustedEndTime, totalDuration, range, scrollbarWidthPercent]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const moveLeft = useCallback(() => {
    const maxMove = timelineStart.getTime() - startTime.getTime();
    if (maxMove <= 0) return;
    
    const dur = Math.min(timelineDuration * 0.2, maxMove);
    const newTimelineStart = new Date(timelineStart.getTime() - dur);
    setTimelineStart(newTimelineStart);
    
    const newRangeStart = new Date(range.start.getTime() - dur);
    const newRangeEnd = new Date(range.end.getTime() - dur);
    setRange({ start: newRangeStart, end: newRangeEnd });
    saveTimelineState();
  }, [timelineStart, timelineDuration, range, startTime]);

  const moveRight = useCallback(() => {
    const maxMove = adjustedEndTime.getTime() - timelineEnd.getTime();
    if (maxMove <= 0) return;
    
    const dur = Math.min(timelineDuration * 0.2, maxMove);
    const newTimelineStart = new Date(timelineStart.getTime() + dur);
    setTimelineStart(newTimelineStart);
    
    const newRangeStart = new Date(range.start.getTime() + dur);
    const newRangeEnd = new Date(range.end.getTime() + dur);
    setRange({ start: newRangeStart, end: newRangeEnd });
    saveTimelineState();
  }, [timelineStart, timelineEnd, timelineDuration, range, adjustedEndTime]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const saveTimelineState = useCallback(() => {
    if (typeof window !== 'undefined' && !isFirstLoad) {
      try {
        localStorage.setItem('ai-sec-timeline-range', JSON.stringify({
          start: rangeRef.current.start.toISOString(),
          end: rangeRef.current.end.toISOString()
        }));
        localStorage.setItem('ai-sec-timeline-start', JSON.stringify(timelineStartRef.current.toISOString()));
        localStorage.setItem('ai-sec-timeline-duration', JSON.stringify(timelineDurationRef.current));
      } catch (e) {
        console.error('Failed to save timeline state to localStorage:', e);
      }
    }
  }, [isFirstLoad]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      setIsDragging(null);
      setIsScrollbarDragging(false);
      onTimeRangeChange(range);
      saveTimelineState();
      if (onTimeRangeChangeEnd) {
        onTimeRangeChangeEnd();
      }
    }
  }, [isDragging, range, onTimeRangeChange, saveTimelineState, onTimeRangeChangeEnd]);

  const handleMouseLeave = useCallback(() => { }, []);

  const decreaseTimelineRange = useCallback(() => {
    const oldTimelineStart = timelineStart.getTime();
    const oldTimelineEnd = timelineEnd.getTime();
    const oldCenter = (oldTimelineStart + oldTimelineEnd) / 2;

    const newDuration = Math.max(timelineDuration * 0.75, 5 * 60 * 1000);
    const newStart = new Date(oldCenter - newDuration / 2);
    const newEnd = new Date(oldCenter + newDuration / 2);

    let finalStart = newStart.getTime();
    let finalEnd = newEnd.getTime();

    if (finalStart < startTime.getTime()) {
      finalStart = startTime.getTime();
      finalEnd = finalStart + newDuration;
    }
    if (finalEnd > adjustedEndTime.getTime()) {
      finalEnd = adjustedEndTime.getTime();
      finalStart = Math.max(startTime.getTime(), finalEnd - newDuration);
    }

    const actualDuration = Math.min(finalEnd - finalStart, totalDuration);
    const finalTimelineStart = new Date(finalStart);
    const finalTimelineEnd = new Date(finalStart + actualDuration);

    setTimelineDuration(actualDuration);
    setTimelineStart(finalTimelineStart);

    let newRangeStart = range.start.getTime();
    let newRangeEnd = range.end.getTime();

    if (newRangeStart < finalTimelineStart.getTime()) {
      newRangeStart = finalTimelineStart.getTime();
    }
    if (newRangeEnd > finalTimelineEnd.getTime()) {
      newRangeEnd = finalTimelineEnd.getTime();
    }

    if (newRangeEnd - newRangeStart < 1000) {
      newRangeStart = finalTimelineStart.getTime();
      newRangeEnd = finalTimelineStart.getTime() + 1000;
    }

    setRange({ start: new Date(newRangeStart), end: new Date(newRangeEnd) });
    onTimeRangeChange({ start: new Date(newRangeStart), end: new Date(newRangeEnd) });
    saveTimelineState();
  }, [timelineStart, timelineEnd, timelineDuration, range, startTime, adjustedEndTime, totalDuration, onTimeRangeChange, saveTimelineState]);

  const increaseTimelineRange = useCallback(() => {
    const oldTimelineStart = timelineStart.getTime();
    const oldTimelineEnd = timelineEnd.getTime();
    const oldCenter = (oldTimelineStart + oldTimelineEnd) / 2;

    const maxDuration = Math.min(timelineDuration * 1.25, totalDuration);
    const newDuration = maxDuration;
    const newStart = new Date(oldCenter - newDuration / 2);
    const newEnd = new Date(oldCenter + newDuration / 2);

    let finalStart = newStart.getTime();
    let finalEnd = newEnd.getTime();

    if (finalStart < startTime.getTime()) {
      finalStart = startTime.getTime();
      finalEnd = finalStart + newDuration;
    }
    if (finalEnd > adjustedEndTime.getTime()) {
      finalEnd = adjustedEndTime.getTime();
      finalStart = Math.max(startTime.getTime(), finalEnd - newDuration);
    }

    const actualDuration = Math.min(finalEnd - finalStart, totalDuration);
    const finalTimelineStart = new Date(finalStart);
    const finalTimelineEnd = new Date(finalStart + actualDuration);

    setTimelineDuration(actualDuration);
    setTimelineStart(finalTimelineStart);

    let newRangeStart = range.start.getTime();
    let newRangeEnd = range.end.getTime();

    if (newRangeStart < finalTimelineStart.getTime()) {
      newRangeStart = finalTimelineStart.getTime();
    }
    if (newRangeEnd > finalTimelineEnd.getTime()) {
      newRangeEnd = finalTimelineEnd.getTime();
    }

    if (newRangeEnd - newRangeStart < 1000) {
      newRangeStart = finalTimelineStart.getTime();
      newRangeEnd = finalTimelineStart.getTime() + 1000;
    }

    setRange({ start: new Date(newRangeStart), end: new Date(newRangeEnd) });
    onTimeRangeChange({ start: new Date(newRangeStart), end: new Date(newRangeEnd) });
    saveTimelineState();
  }, [timelineStart, timelineEnd, timelineDuration, range, startTime, adjustedEndTime, totalDuration, onTimeRangeChange, saveTimelineState]);

  useEffect(() => {
    if (range.start < timelineStart || range.end > timelineEnd) {
      const newRange = {
        start: new Date(Math.max(range.start.getTime(), timelineStart.getTime())),
        end: new Date(Math.min(range.end.getTime(), timelineEnd.getTime()))
      };

      setRange(newRange);
      onTimeRangeChange(newRange);
      if (!isFirstLoad) {
        saveTimelineState();
      }
    }
  }, [timelineStart, timelineEnd, range, onTimeRangeChange, isFirstLoad, saveTimelineState]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      onTimeRangeChange(range);
    }
  }, [onTimeRangeChange, range]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const prevEndTimeRef = useRef<Date | null>(null);
  const prevTotalDurationRef = useRef(totalDuration);
  const rangeDurationRef = useRef(range.end.getTime() - range.start.getTime());

  useEffect(() => {
    if (autoRefresh && !isDragging && prevEndTimeRef.current) {
      const prevEndTime = prevEndTimeRef.current.getTime();
      const currentEndTime = adjustedEndTime.getTime();
      const prevTotalDuration = prevTotalDurationRef.current;
      
      if (currentEndTime > prevEndTime) {
        const duration = rangeDurationRef.current;
        
        const maxDuration = Math.min(timelineDuration, totalDuration);
        
        const scrollbarPosPercent = scrollbarStartPercent;
        const scrollbarWidth = scrollbarWidthPercent;
        
        const wasAtRightEdge = scrollbarPosPercent >= 100 - scrollbarWidth - 1;
        const wasAtLeftEdge = scrollbarPosPercent <= 1;
        
        let newTimelineStartMs;
        
        if (wasAtRightEdge && totalDuration > prevTotalDuration) {
          newTimelineStartMs = Math.max(
            startTime.getTime(),
            currentEndTime - maxDuration
          );
        } else if (scrollbarStartPercent > 0 && scrollbarStartPercent < 100 - scrollbarWidthPercent) {
          const availableSpace = prevTotalDuration - timelineDuration;
          if (availableSpace > 0) {
            const currentStartMs = startTime.getTime() + (scrollbarStartPercent / 100) * availableSpace;
            newTimelineStartMs = Math.max(
              startTime.getTime(),
              Math.min(currentEndTime - maxDuration, currentStartMs)
            );
          } else {
            newTimelineStartMs = currentEndTime - maxDuration;
          }
        } else {
          newTimelineStartMs = Math.max(startTime.getTime(), currentEndTime - maxDuration);
        }
        
        if (newTimelineStartMs < startTime.getTime()) {
          newTimelineStartMs = startTime.getTime();
        }
        
        const newTimelineStart = new Date(newTimelineStartMs);
        const newTimelineEnd = new Date(newTimelineStartMs + maxDuration);
        
        let newRangeStart = currentEndTime - duration;
        let newRangeEnd = currentEndTime;
        
        if (newRangeStart < newTimelineStartMs) {
          newRangeStart = newTimelineStartMs;
        }
        if (newRangeEnd > newTimelineStartMs + maxDuration) {
          newRangeEnd = newTimelineStartMs + maxDuration;
        }
        
        const newRange = {
          start: new Date(newRangeStart),
          end: new Date(newRangeEnd)
        };
        
        setRange(newRange);
        setTimelineStart(newTimelineStart);
        setTimelineDuration(maxDuration);
        
        onTimeRangeChange(newRange);
        if (!isFirstLoad) {
          saveTimelineState();
        }
      }
    }
    
    prevEndTimeRef.current = adjustedEndTime;
    prevTotalDurationRef.current = totalDuration;
  }, [autoRefresh, adjustedEndTime, timelineDuration, isDragging, isFirstLoad, onTimeRangeChange, totalDuration, startTime, scrollbarStartPercent, scrollbarWidthPercent, saveTimelineState]);

  useEffect(() => {
    rangeDurationRef.current = range.end.getTime() - range.start.getTime();
  }, [range]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleMouseLeave]);

  const resetToDefault = useCallback(() => {
    const defaultRange = {
      start: new Date(adjustedEndTime.getTime() - 5 * 60 * 1000),
      end: adjustedEndTime
    };
    setRange(defaultRange);

    const maxDuration = Math.min(FORMAT_1H, totalDuration);
    const newTimelineStart = new Date(adjustedEndTime.getTime() - maxDuration);
    setTimelineStart(newTimelineStart);
    setTimelineDuration(maxDuration);

    onTimeRangeChange(defaultRange);
    saveTimelineState();
  }, [adjustedEndTime, onTimeRangeChange, totalDuration, saveTimelineState]);

  const handlePreciseTimeConfirm = useCallback((start: Date, end: Date) => {
    setRange({ start, end });
    
    const duration = end.getTime() - start.getTime();
    const padding = Math.max(duration * 0.5, 5 * 60 * 1000);
    const newTimelineStart = new Date(Math.max(startTime.getTime(), start.getTime() - padding));
    const newTimelineEnd = new Date(Math.min(adjustedEndTime.getTime(), end.getTime() + padding));
    const newTimelineDuration = newTimelineEnd.getTime() - newTimelineStart.getTime();
    
    setTimelineStart(newTimelineStart);
    setTimelineDuration(newTimelineDuration);
    
    onTimeRangeChange({ start, end });
    saveTimelineState();
    
    if (onTimeRangeChangeEnd) {
      onTimeRangeChangeEnd();
    }
  }, [startTime, adjustedEndTime, onTimeRangeChange, onTimeRangeChangeEnd, saveTimelineState]);

  const generateTicks = useCallback(() => {
    const ticks = [];
    const validStartTime = timelineStart instanceof Date && !isNaN(timelineStart.getTime()) ? timelineStart : new Date();
    const validEndTime = timelineEnd instanceof Date && !isNaN(timelineEnd.getTime()) ? timelineEnd : new Date();
    const validDuration = validEndTime.getTime() - validStartTime.getTime();

    let tickCount: number;
    let timeInterval: number;

    if (validDuration <= 60 * 1000) {
      tickCount = 6;
      timeInterval = validDuration / (tickCount + 1);
    } else if (validDuration <= 5 * 60 * 1000) {
      tickCount = 6;
      timeInterval = validDuration / (tickCount + 1);
    } else if (validDuration <= 30 * 60 * 1000) {
      tickCount = 8;
      timeInterval = validDuration / (tickCount + 1);
    } else if (validDuration <= 2 * 60 * 60 * 1000) {
      tickCount = 10;
      timeInterval = validDuration / (tickCount + 1);
    } else if (validDuration <= 6 * 60 * 60 * 1000) {
      tickCount = 12;
      timeInterval = validDuration / (tickCount + 1);
    } else if (validDuration <= 12 * 60 * 60 * 1000) {
      tickCount = 8;
      timeInterval = validDuration / (tickCount + 1);
    } else {
      tickCount = 12;
      timeInterval = validDuration / (tickCount + 1);
    }

    const startTimeMs = validStartTime.getTime();

    for (let i = 0; i <= tickCount + 1; i++) {
      const tickTime = new Date(startTimeMs + i * timeInterval);
      if (tickTime > validEndTime) break;

      const percent = ((tickTime.getTime() - startTimeMs) / validDuration) * 100;
      if (percent < 0 || percent > 100) continue;

      ticks.push(
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${percent}%` }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-px h-4 bg-[var(--border-color)] transition-all duration-200" />
          <div className="mt-1 text-[10px] text-[var(--text-secondary)] whitespace-nowrap transform -translate-x-1/2">
            {formatTime(tickTime)}
          </div>
        </motion.div>
      );
    }

    return ticks;
  }, [timelineStart, timelineEnd]);

  const ticks = useMemo(() => generateTicks(), [generateTicks]);

  const generateFileMarkers = useCallback(() => {
    if (fileTimeRanges.length === 0 || timelineDuration <= 0) return [];

    const timelineStartMs = timelineStart.getTime();
    const timelineEndMs = timelineEnd.getTime();

    return fileTimeRanges.map((file, index) => {
      const fileTimeMs = file.startTime.getTime();
      
      if (fileTimeMs < timelineStartMs || fileTimeMs > timelineEndMs) return null;

      const x = ((fileTimeMs - timelineStartMs) / timelineDuration) * 100;
      const clampedX = Math.max(0, Math.min(100, x));

      return (
        <g key={`file-${index}`}>
          <line
            x1={clampedX}
            y1={0}
            x2={clampedX}
            y2={100}
            stroke="var(--accent-blue)"
            strokeWidth={0.2}
            opacity={0.5}
          />
        </g>
      );
    }).filter(Boolean);
  }, [fileTimeRanges, timelineStart, timelineEnd, timelineDuration, isExpanded]);

  const fileMarkers = useMemo(() => generateFileMarkers(), [generateFileMarkers]);

  const isDefaultRange = useMemo(() => {
    const defaultStart = new Date(adjustedEndTime.getTime() - 5 * 60 * 1000);
    const defaultEnd = adjustedEndTime;
    return range.start.getTime() === defaultStart.getTime() && range.end.getTime() === defaultEnd.getTime();
  }, [range, adjustedEndTime]);

  const canScrollLeft = timelineStart.getTime() > startTime.getTime() + 1000;
  const canScrollRight = timelineEnd.getTime() < adjustedEndTime.getTime() - 1000;
  const canZoomIn = timelineDuration > 5 * 60 * 1000;
  const canZoomOut = timelineDuration < totalDuration - 1000;

  const filesInRange = useMemo(() => {
    if (fileTimeRanges.length === 0) return 0;
    return fileTimeRanges.filter(file => 
      file.startTime.getTime() >= range.start.getTime() && 
      file.startTime.getTime() <= range.end.getTime()
    ).length;
  }, [fileTimeRanges, range]);

  const fileDensity = useMemo(() => {
    if (timelineDuration === 0 || fileTimeRanges.length === 0) return 0;
    return (fileTimeRanges.length / (timelineDuration / 1000 / 60)).toFixed(1);
  }, [fileTimeRanges, timelineDuration]);

  const avgTimeGap = useMemo(() => {
    if (fileTimeRanges.length < 2) return 0;
    const gaps: number[] = [];
    for (let i = 1; i < fileTimeRanges.length; i++) {
      const gap = fileTimeRanges[i].startTime.getTime() - fileTimeRanges[i - 1].startTime.getTime();
      gaps.push(gap);
    }
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    return avgGap;
  }, [fileTimeRanges]);

  const filesInRangeList = useMemo(() => {
    if (fileTimeRanges.length === 0) return [];
    return fileTimeRanges.filter(file => 
      file.startTime.getTime() >= range.start.getTime() && 
      file.startTime.getTime() <= range.end.getTime()
    );
  }, [fileTimeRanges, range]);

  if (isLoadingMetadata) {
    return (
      <div className="w-full bg-[var(--card-background)]/50 backdrop-blur-xl border border-[var(--border-color)]/30 rounded-xl p-5 mb-6 shadow-sm transition-all duration-200">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 text-[var(--accent-blue)] animate-spin" />
          <span className="ml-3 text-[var(--text-secondary)]">加载时间轴...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--card-background)]/50 backdrop-blur-xl border border-[var(--border-color)]/30 rounded-xl p-5 mb-6 shadow-sm transition-all duration-200 overflow-visible hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
          <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
          <span>观测时间轴</span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5">
            <button
              onClick={moveLeft}
              disabled={!canScrollLeft}
              className="p-1.5 rounded-full bg-white/10 dark:bg-black/20 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 hover:text-[var(--accent-blue-hover)] active:bg-[var(--accent-blue)]/30 transition-all duration-250 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/10 dark:disabled:bg-black/20 disabled:hover:bg-white/10 dark:disabled:hover:bg-black/20"
              title="向左移动时间轴"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                transform: 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ChevronLeft className="w-4 h-4 transition-all duration-250 ease-in-out" />
            </button>

            <div className="flex items-center gap-0.5">
              <button
                onClick={decreaseTimelineRange}
                disabled={!canZoomIn}
                className="p-1.5 rounded-full bg-white/10 dark:bg-black/20 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 hover:text-[var(--accent-blue-hover)] active:bg-[var(--accent-blue)]/30 transition-all duration-250 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/10 dark:disabled:bg-black/20 disabled:hover:bg-white/10 dark:disabled:hover:bg-black/20"
                title="放大时间轴（缩小时间范围）"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                  transform: 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ZoomIn className="w-3.5 h-3.5 transition-all duration-250 ease-in-out" />
              </button>

              <button
                onClick={increaseTimelineRange}
                disabled={!canZoomOut}
                className="p-1.5 rounded-full bg-white/10 dark:bg-black/20 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 hover:text-[var(--accent-blue-hover)] active:bg-[var(--accent-blue)]/30 transition-all duration-250 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/10 dark:disabled:bg-black/20 disabled:hover:bg-white/10 dark:disabled:hover:bg-black/20"
                title="缩小时间轴（扩大时间范围）"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                  transform: 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ZoomOut className="w-3.5 h-3.5 transition-all duration-250 ease-in-out" />
              </button>
            </div>

            <button
              onClick={moveRight}
              disabled={!canScrollRight}
              className="p-1.5 rounded-full bg-white/10 dark:bg-black/20 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 hover:text-[var(--accent-blue-hover)] active:bg-[var(--accent-blue)]/30 transition-all duration-250 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/10 dark:disabled:bg-black/20 disabled:hover:bg-white/10 dark:disabled:hover:bg-black/20"
              title="向右移动时间轴"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                transform: 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ChevronRight className="w-4 h-4 transition-all duration-250 ease-in-out" />
            </button>
          </div>

          <div className="flex-1 text-center text-sm text-[var(--foreground)] truncate bg-white/10 dark:bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 dark:border-black/20 shadow-sm">
            {formatDateTime(range.start)} ~ {formatDateTime(range.end)}
            <span className="text-[var(--text-secondary)] text-xs font-medium">  ({formatDuration(rangeDuration)})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <motion.button
              ref={timePickerButtonRef}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsTimePickerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-250 ease-in-out bg-gradient-to-r from-[var(--accent-blue)]/10 to-[var(--accent-purple)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 hover:from-[var(--accent-blue)]/20 hover:to-[var(--accent-purple)]/20 hover:shadow-md"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Edit3 className="w-3.5 h-3.5 transition-all duration-250 ease-in-out" />
              <span className="transition-all duration-250 ease-in-out hidden sm:inline">精确选择</span>
            </motion.button>
            
            <TimePickerDialog
              isOpen={isTimePickerOpen}
              onClose={() => setIsTimePickerOpen(false)}
              onConfirm={handlePreciseTimeConfirm}
              initialStart={range.start}
              initialEnd={range.end}
              minTime={startTime}
              maxTime={adjustedEndTime}
              anchorRef={timePickerButtonRef}
            />
          </div>

          <button
            onClick={resetToDefault}
            disabled={isDefaultRange}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-250 ease-in-out ${isDefaultRange
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800'
              : 'bg-[var(--accent-blue)] text-white border border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/95 hover:shadow-lg hover:transform hover:scale-102 active:bg-[var(--accent-blue)]/85 active:shadow-md active:transform active:scale-98'}`}
            style={{
              boxShadow: isDefaultRange 
                ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
                : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 transition-all duration-250 ease-in-out" />
            <span className="transition-all duration-250 ease-in-out">恢复默认</span>
          </button>

          <button
            onClick={toggleExpand}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 dark:bg-black/20 text-[var(--foreground)] text-sm font-medium rounded-full hover:bg-[var(--accent-blue)]/20 hover:text-[var(--accent-blue-hover)] active:bg-[var(--accent-blue)]/30 transition-all duration-250 ease-in-out border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 active:border-[var(--accent-blue)]/40"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              transform: 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span className="hidden sm:inline transition-all duration-250 ease-in-out">{isExpanded ? '收起详情' : '展开详情'}</span>
            <ChevronLeft className={`w-3.5 h-3.5 transition-all duration-250 ease-in-out ${isExpanded ? 'rotate-90' : 'rotate-270'}`} />
          </button>
        </div>
      </div>

      <div className="relative">
        <motion.div
          ref={containerRef}
          className="relative w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 dark:border-black/20 mt-4 select-none shadow-sm transition-all hover:shadow-md"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            padding: '0 16px'
          }}
          initial={{ height: 50 }}
          animate={{ height: isExpanded ? 120 : 50 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="relative w-full h-full">
              {isExpanded && (
                <div className="absolute inset-0 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-0 opacity-10">
                  {Array.from({ length: Math.max(5, ticks.length - 2) }).map((_, i) => (
                    <div key={i} className="border-r border-[var(--border-color)]/50" />
                  ))}
                </div>
              )}

              <div className="absolute top-0 bottom-0 left-2 right-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {fileMarkers}
                </svg>
              </div>

              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {ticks}
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className="absolute top-0 bottom-0 cursor-pointer"
                style={{
                  left: `${Math.max(0, Math.min(100 - rangeWidth, startPercent))}%`,
                  right: `${Math.max(0, Math.min(100, 100 - endPercent))}%`
                }}
              >
                <motion.div
                  className="absolute inset-0 top-1 bottom-1 bg-gradient-to-r from-[var(--accent-blue)]/40 to-[var(--accent-purple)]/40 rounded-xl shadow-lg border border-[var(--accent-blue)]/30 backdrop-blur-sm"
                  onMouseDown={(e) => handleMouseDown('range', e)}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  animate={{
                    boxShadow: isDragging === 'range'
                      ? '0 6px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      : '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    opacity: isDragging === 'range' ? 0.9 : 0.7
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs text-[var(--foreground)] bg-white/90 dark:bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-md border border-white/20 dark:border-black/20">拖拽调整范围</span>
                  </div>
                </motion.div>

                <div
                  className="absolute left-0 top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex items-center justify-center"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown('start', e);
                  }}
                  onMouseEnter={() => setIsLeftHandleHovered(true)}
                  onMouseLeave={() => setIsLeftHandleHovered(false)}
                >
                  <motion.div
                    className="w-4 bg-white backdrop-blur-md rounded-full shadow-md transition-all"
                    initial={{ scale: 1 }}
                    animate={{
                      scale: isLeftHandleHovered || isDragging === 'start' ? 1.1 : 0.95,
                      opacity: 1,
                      height: isExpanded ? 36 : 20,
                      boxShadow: isLeftHandleHovered || isDragging === 'start'
                        ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                        : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      backgroundColor: isDragging === 'start' ? 'var(--accent-blue)' : 'white'
                    }}
                    whileHover={{ scale: 1.1, opacity: 1 }}
                  />
                </div>

                <div
                  className="absolute right-0 top-0 bottom-0 w-6 -mr-3 cursor-ew-resize flex items-center justify-center"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown('end', e);
                  }}
                  onMouseEnter={() => setIsRightHandleHovered(true)}
                  onMouseLeave={() => setIsRightHandleHovered(false)}
                >
                  <motion.div
                    className="w-4 bg-white backdrop-blur-md rounded-full shadow-md transition-all"
                    initial={{ scale: 1 }}
                    animate={{
                      scale: isRightHandleHovered || isDragging === 'end' ? 1.1 : 0.95,
                      opacity: 1,
                      height: isExpanded ? 36 : 20,
                      boxShadow: isRightHandleHovered || isDragging === 'end'
                        ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                        : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      backgroundColor: isDragging === 'end' ? 'var(--accent-blue)' : 'white'
                    }}
                    whileHover={{ scale: 1.1, opacity: 1 }}
                  />
                </div>
              </div>

              {isExpanded && (
                <motion.div
                  className="absolute bottom-1 left-3 text-xs text-[var(--text-secondary)] bg-white/90 dark:bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm border border-white/20 dark:border-black/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="font-medium">时间轴: {formatCompactDuration(timelineDuration)}</span>
                  <span className="ml-2">选择: {(rangeDuration / timelineDuration * 100).toFixed(1)}%</span>
                  <span className="ml-2">总文件: {fileTimeRanges.length}</span>
                  <span className="ml-2">范围内: {filesInRange}</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          ref={scrollbarRef}
          className="relative h-4 mt-2 cursor-pointer"
          onMouseEnter={() => setIsScrollbarHovered(true)}
          onMouseLeave={() => setIsScrollbarHovered(false)}
          onMouseDown={(e) => handleMouseDown('scrollbar', e)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute inset-0 rounded-full bg-white/5 dark:bg-black/10 backdrop-blur-sm transition-all duration-200" />

          <motion.div
            className="absolute cursor-grab active:cursor-grabbing rounded-full"
            style={{
              left: `${scrollbarStartPercent}%`,
              width: `${scrollbarWidthPercent}%`
            }}
            animate={{
              backgroundColor: 'var(--accent-blue)',
              height: isScrollbarHovered || isScrollbarDragging ? '20%' : '20%',
              boxShadow: isScrollbarHovered || isScrollbarDragging
                ? '0 4px 16px rgba(var(--accent-blue-rgb), 0.3), 0 2px 8px rgba(0, 0, 0, 0.15)'
                : '0 2px 6px rgba(0, 0, 0, 0.1)',
              opacity: isScrollbarHovered || isScrollbarDragging ? 1 : 0.5
            }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
          </motion.div>
        </motion.div>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-4 p-5 bg-[var(--card-background)]/50 backdrop-blur-xl rounded-xl text-sm border border-[var(--border-color)]/30 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--accent-blue)]" />
                  <span className="text-[var(--text-secondary)] font-medium">时间轴范围</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-medium">
                  {formatCompactDuration(timelineDuration)}
                </span>
              </div>
              <div className="text-[var(--foreground)] font-medium leading-tight text-xs">
                {formatDateTime(timelineStart)}
              </div>
              <div className="text-[var(--foreground)] font-medium leading-tight text-xs">
                {formatDateTime(timelineEnd)}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
                  <span className="text-[var(--text-secondary)] font-medium">当前选择范围</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-medium">
                  {(rangeDuration / timelineDuration * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[var(--foreground)] font-medium">
                  {formatDuration(rangeDuration)}
                </span>
                <span className="text-[var(--text-secondary)] text-xs">
                  {formatDateTime(range.start)}
                </span>
                <span className="text-[var(--text-secondary)] text-xs">
                  {formatDateTime(range.end)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)]/20 to-[var(--accent-purple)]/20 text-[var(--accent-blue)] text-xs font-bold">F</span>
                <span className="text-[var(--text-secondary)] font-medium">话单文件统计</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[var(--text-secondary)] text-xs">总文件数</span>
                  <span className="text-[var(--foreground)] font-medium text-lg">{fileTimeRanges.length}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[var(--text-secondary)] text-xs">范围内文件</span>
                  <span className="text-[var(--accent-blue)] font-medium text-lg">{filesInRange}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 dark:border-black/20">
                <span className="text-[var(--text-secondary)] text-xs">文件密度</span>
                <span className="text-[var(--foreground)] font-medium text-xs">{fileDensity} 文件/分钟</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-500 text-xs font-bold">T</span>
                <span className="text-[var(--text-secondary)] font-medium">时间间隔分析</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] text-xs">平均间隔</span>
                  <span className="text-[var(--foreground)] font-medium text-xs">
                    {avgTimeGap > 0 ? formatCompactDuration(avgTimeGap) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] text-xs">最早文件</span>
                  <span className="text-[var(--foreground)] font-medium text-xs">
                    {fileTimeRanges.length > 0 ? formatTime(fileTimeRanges[0].startTime) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] text-xs">最新文件</span>
                  <span className="text-[var(--foreground)] font-medium text-xs">
                    {fileTimeRanges.length > 0 ? formatTime(fileTimeRanges[fileTimeRanges.length - 1].startTime) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-500 text-xs font-bold">S</span>
                <span className="text-[var(--text-secondary)] font-medium">选择起始时间</span>
              </div>
              <div className="text-[var(--foreground)] font-medium text-xs">
                {formatDateTime(range.start)}
              </div>
              <div className="text-[var(--text-secondary)] text-xs mt-1">
                距离开始: {formatCompactDuration(range.start.getTime() - timelineStart.getTime())}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20 hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-500 text-xs font-bold">E</span>
                <span className="text-[var(--text-secondary)] font-medium">选择结束时间</span>
              </div>
              <div className="text-[var(--foreground)] font-medium text-xs">
                {formatDateTime(range.end)}
              </div>
              <div className="text-[var(--text-secondary)] text-xs mt-1">
                距离结束: {formatCompactDuration(timelineEnd.getTime() - range.end.getTime())}
              </div>
            </div>
          </div>

          {fileTimeRanges.length > 0 && (
            <div className="mt-4 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)]/20 to-[var(--accent-purple)]/20 text-[var(--accent-blue)] text-xs font-bold">D</span>
                <span className="text-[var(--text-secondary)] font-medium">文件分布概览</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center justify-between p-2 bg-white/5 dark:bg-black/10 rounded-lg">
                  <span className="text-[var(--text-secondary)] text-xs">覆盖时长</span>
                  <span className="text-[var(--foreground)] font-medium text-xs">{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 dark:bg-black/10 rounded-lg">
                  <span className="text-[var(--text-secondary)] text-xs">文件总数</span>
                  <span className="text-[var(--foreground)] font-medium text-xs">{fileTimeRanges.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 dark:bg-black/10 rounded-lg">
                  <span className="text-[var(--text-secondary)] text-xs">当前范围内</span>
                  <span className="text-[var(--accent-blue)] font-medium text-xs">{filesInRange} 个文件</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 dark:bg-black/10 rounded-lg">
                  <span className="text-[var(--text-secondary)] text-xs">范围占比</span>
                  <span className="text-[var(--accent-purple)] font-medium text-xs">{(rangeDuration / totalDuration * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {filesInRangeList.length > 0 && (
            <div className="mt-4 p-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 dark:border-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)]/20 to-[var(--accent-purple)]/20 text-[var(--accent-blue)] text-xs font-bold">L</span>
                  <span className="text-[var(--text-secondary)] font-medium">当前范围内文件列表</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-medium">
                  {filesInRangeList.length} 个文件
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {filesInRangeList.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 dark:bg-black/10 rounded-lg hover:bg-white/10 dark:hover:bg-black/20 transition-all border border-white/10 dark:border-black/20 hover:border-[var(--accent-blue)]/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--foreground)] font-medium text-xs truncate">{file.filename}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(file.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 flex items-center justify-center rounded-full bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-[8px] font-bold">S</span>
                          {formatFileSize(file.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 flex items-center justify-center rounded-full bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] text-[8px] font-bold">#</span>
                          {formatNumber(file.lineCount)} 条
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right">
                        <div className="text-[var(--foreground)] font-medium text-xs">{formatFileSize(file.size)}</div>
                        <div className="text-[var(--text-secondary)] text-xs">{formatNumber(file.lineCount)} 条</div>
                      </div>
                      <div className="w-1 h-8 bg-gradient-to-b from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-full opacity-60"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
