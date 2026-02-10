import { NextResponse } from 'next/server';
import { getUsageStats, resetUsageStats } from '@/lib/usageTracker';

/**
 * GET /api/usage — Returns aggregated usage statistics
 * DELETE /api/usage — Resets usage stats
 */
export async function GET() {
  const stats = getUsageStats();
  return NextResponse.json(stats);
}

export async function DELETE() {
  resetUsageStats();
  return NextResponse.json({ message: 'Usage stats reset' });
}
