import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessDescription, targetAudience, emailCount } = body;

    // Validate input
    if (!businessName || !businessDescription) {
      return NextResponse.json(
        { error: 'Business name and description are required' },
        { status: 400 }
      );
    }

    if (!emailCount || !['small', 'medium', 'large', 'enterprise'].includes(emailCount)) {
      return NextResponse.json(
        { error: 'Valid email count range is required' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = Database.createCampaign({
      businessName,
      businessDescription,
      targetAudience,
      emailCount
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campaign created successfully'
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
