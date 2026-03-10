import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createReadStream } from 'fs';

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

async function countLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    
    stream.on('data', (chunk: string | Buffer) => {
      const chunkStr = chunk.toString();
      count += (chunkStr.match(/\n/g) || []).length;
    });
    
    stream.on('end', () => {
      resolve(count);
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const logFiles = files
      .filter(f => f.endsWith('.txt'))
      .sort((a, b) => a.localeCompare(b));

    if (logFiles.length === 0) {
      return NextResponse.json({
        files: [],
        timeRanges: [],
        totalFiles: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0
      });
    }

    const timeRanges: Array<{ 
      filename: string; 
      startTime: Date; 
      endTime: Date;
      size: number;
      lineCount: number;
    }> = [];

    for (const file of logFiles) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = await fs.stat(filePath);
      const size = stats.size;
      
      const fileTime = parseTimeFromFilename(file);
      const fileDate = fileTime || stats.mtime;

      try {
        const lineCount = await countLines(filePath);
        timeRanges.push({
          filename: file,
          startTime: fileDate,
          endTime: fileDate,
          size,
          lineCount
        });
      } catch (error) {
        console.error(`Error counting lines for ${file}:`, error);
        timeRanges.push({
          filename: file,
          startTime: fileDate,
          endTime: fileDate,
          size,
          lineCount: 0
        });
      }
    }

    timeRanges.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const startTime = timeRanges[0].startTime;
    const endTime = timeRanges[timeRanges.length - 1].endTime;
    const duration = endTime.getTime() - startTime.getTime();

    return NextResponse.json({
      files: timeRanges,
      timeRanges,
      totalFiles: logFiles.length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration
    });
  } catch (error) {
    console.error('Error reading logs metadata:', error);
    return NextResponse.json(
      { error: 'Failed to read logs metadata', files: [], timeRanges: [], totalFiles: 0 },
      { status: 500 }
    );
  }
}
