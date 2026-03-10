import { ParsedLogEntry } from '@/types/log';

export interface AggregatedSession {
  id: string;
  mainEntry: ParsedLogEntry;
  allEntries: ParsedLogEntry[];
  startTime: Date;
  endTime: Date;
}

export const aggregateSessions = (logs: ParsedLogEntry[]): AggregatedSession[] => {
  if (!logs || logs.length === 0) {
    return [];
  }
  
  const mainEntries = logs.filter(entry => entry.dataType === 'AG-UI' || entry.dataType === 'OPENCLAW');
  const result: AggregatedSession[] = [];

  mainEntries.forEach(mainEntry => {
    const mainSessionId = mainEntry.session;
    const mainStartTime = new Date(mainEntry.sessionCreatedAt);
    const mainEndTime = mainEntry.sessionEndedAt ? new Date(mainEntry.sessionEndedAt) : 
      new Date(mainStartTime.getTime() + 5 * 60 * 1000);

    const allEntries = logs.filter(entry => {
      if ((entry.dataType === 'AG-UI' || entry.dataType === 'OPENCLAW') && entry !== mainEntry) {
        return false;
      }
      
      if (entry.session === mainSessionId && entry.session) {
        return true;
      }
      
      const entryCollectTime = new Date(entry.collectTime);
      const entryCreatedTime = entry.sessionCreatedAt ? new Date(entry.sessionCreatedAt) : entryCollectTime;
      const entryEndTime = entry.sessionEndedAt ? new Date(entry.sessionEndedAt) : entryCollectTime;
      
      const isWithinTimeRange = entryCreatedTime >= mainStartTime && entryEndTime <= mainEndTime;
      
      if (!isWithinTimeRange) {
        return false;
      }
      
      if (mainEntry.dataType === 'OPENCLAW' && entry.dataType === 'EXEC') {
        const mainProcessName = (mainEntry.pName?.toLowerCase() || '').replace(/[\n\r]+/g, '').trim();
        const execProcessName = (entry.pName?.toLowerCase() || '').replace(/[\n\r]+/g, '').trim();
        
        if (execProcessName.includes('openclaw')) {
          return true;
        }
        
        if (mainProcessName && execProcessName && 
            (mainProcessName.includes(execProcessName) || execProcessName.includes(mainProcessName))) {
          return true;
        }
        
        if (execProcessName === 'sh') {
          return true;
        }
        
        return false;
      }
      
      if (mainEntry.dataType === 'OPENCLAW' && entry.dataType === 'FILE') {
        const fileProcessName = entry.pName?.toLowerCase() || '';
        
        if (fileProcessName.includes('openclaw')) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });

    result.push({
      id: mainEntry.logID || Math.random().toString(36),
      mainEntry,
      allEntries,
      startTime: mainStartTime,
      endTime: mainEndTime
    });
  });

  return result.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

// 解析会话条目，生成树状结构的节点
export const parseSessionTree = (session: AggregatedSession) => {
  // 按时间排序所有条目
  const sortedEntries = [...(session.allEntries || [])].sort((a, b) => {
    const aTime = new Date(a.sessionCreatedAt || a.collectTime).getTime();
    const bTime = new Date(b.sessionCreatedAt || b.collectTime).getTime();
    return aTime - bTime;
  });

  // 生成树状结构
  const root: any = {
    id: session.id,
    type: 'AG-UI',
    entry: session.mainEntry,
    children: []
  };

  // 简单的父子关系生成：根据时间顺序和类型依赖关系
  // 实际应用中可能需要更复杂的逻辑，比如根据调用链或请求ID关联
  sortedEntries.forEach(entry => {
    const node = {
      id: entry.logID || Math.random().toString(36),
      type: entry.dataType,
      entry,
      children: []
    };

    root.children.push(node);
  });

  return root;
};
