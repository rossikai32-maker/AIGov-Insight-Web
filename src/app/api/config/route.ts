import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    enableQuickLogin: process.env.ENABLE_QUICK_LOGIN === 'true'
  });
}