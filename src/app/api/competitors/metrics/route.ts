import { NextRequest, NextResponse } from 'next/server';
import { EmailGenerator } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analyses } = body;
    if (!analyses || !Array.isArray(analyses)) return NextResponse.json({ error: 'analyses array required' }, { status: 400 });

    const metrics = await EmailGenerator.extractCompetitorMetrics(analyses);

    return NextResponse.json({ metrics });
  } catch (err: any) {
    console.error('metrics API error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
