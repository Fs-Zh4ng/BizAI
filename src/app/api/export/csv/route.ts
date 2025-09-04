import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ExportUtils } from '@/lib/export-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Get campaign data
    const campaign = Database.getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const templates = Database.getTemplates(campaignId);
    const targets = Database.getTargets(campaignId);

    if (templates.length === 0 || targets.length === 0) {
      return NextResponse.json(
        { error: 'No templates or targets found for this campaign' },
        { status: 404 }
      );
    }

    // Generate CSV
    const csvContent = await ExportUtils.exportToCSV({
      campaign,
      templates,
      targets
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cold-email-campaign-${campaignId}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
