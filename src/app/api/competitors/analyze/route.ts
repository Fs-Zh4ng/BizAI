import { NextRequest, NextResponse } from 'next/server';
import { EmailGenerator } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessIndustry, companyName, companyWebsite, competitors } = body;

    if (!businessIndustry) return NextResponse.json({ error: 'businessIndustry is required' }, { status: 400 });

    const analyses = await EmailGenerator.findCompetitorAnalysis(
      businessIndustry,
      companyName || '',
      companyWebsite || '',
      competitors || ''
    );

    return NextResponse.json({ analyses });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
