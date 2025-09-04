import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = Database.getCampaign(params.id);
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get associated templates and targets
    const templates = Database.getTemplates(params.id);
    const targets = Database.getTargets(params.id);

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        templates,
        targets
      }
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const campaign = Database.updateCampaign(params.id, body);
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
