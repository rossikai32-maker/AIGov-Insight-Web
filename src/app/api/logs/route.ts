import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseLogFile } from '@/lib/logParser';
import { ParsedLogEntry } from '@/types/log';

const LOGS_DIR = process.env.LOGS_DIRECTORY || path.join(process.cwd(), 'logs');

function parseTimeFromFilename(filename: string): Date | null {
  const match = filename.match(/-(\d{14})-/);
  if (!match) return null;
  
  const timeStr = match[1];
  const year = parseInt(timeStr.substring(0, 4), 10);
  const month = parseInt(timeStr.substring(4, 6), 10) - 1;
  const day = parseInt(timeStr.substring(6, 8), 10);
  const hour = parseInt(timeStr.substring(8, 10), 10);
  const minute = parseInt(timeStr.substring(10, 12), 10);
  const second = parseInt(timeStr.substring(12, 14), 10);
  
  const date = new Date(year, month, day, hour, minute, second);
  if (isNaN(date.getTime())) return null;
  
  return date;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startTimeStr = searchParams.get('startTime');
    const endTimeStr = searchParams.get('endTime');

    const files = await fs.readdir(LOGS_DIR);
    const logFiles = files
      .filter(f => f.endsWith('.txt'))
      .sort((a, b) => a.localeCompare(b));

    const allLogs: ParsedLogEntry[] = [];
    
    let filesToRead: string[] = [];
    
    if (startTimeStr && endTimeStr) {
      const startTime = new Date(startTimeStr).getTime();
      const endTime = new Date(endTimeStr).getTime();
      
      for (const file of logFiles) {
        const fileTime = parseTimeFromFilename(file);
        if (fileTime) {
          const fileTimeMs = fileTime.getTime();
          if (fileTimeMs >= startTime && fileTimeMs <= endTime) {
            filesToRead.push(file);
          }
        }
      }
    } else {
      filesToRead = logFiles.slice(offset, offset + limit);
    }

    for (const file of filesToRead) {
      const filePath = path.join(LOGS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const logs = parseLogFile(content);
      allLogs.push(...logs);
    }

    allLogs.sort((a, b) => {
      return new Date(b.collectTime).getTime() - new Date(a.collectTime).getTime();
    });

    let filteredLogs = allLogs;
    if (startTimeStr && endTimeStr) {
      const startTime = new Date(startTimeStr).getTime();
      const endTime = new Date(endTimeStr).getTime();
      
      filteredLogs = allLogs.filter(log => {
        const logTime = new Date(log.collectTime).getTime();
        return logTime >= startTime && logTime <= endTime;
      });
    }

    return NextResponse.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      hasMore: false,
      startTime: allLogs.length > 0 ? new Date(allLogs[allLogs.length - 1].collectTime) : new Date(),
      endTime: allLogs.length > 0 ? new Date(allLogs[0].collectTime) : new Date()
    });
  } catch (error) {
    console.error('Error reading logs:', error);
    return NextResponse.json(
      { error: 'Failed to read logs', logs: [], total: 0, hasMore: false },
      { status: 500 }
    );
  }
}
