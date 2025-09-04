import { NextRequest, NextResponse } from 'next/server';
import { TargetDiscovery } from '@/lib/target-discovery';
import { Database } from '@/lib/database';

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

    try {
      console.log('Target discovery start', { campaignId, hunter: !!process.env.HUNTER_API_KEY, openai: !!process.env.OPENAI_API_KEY });

      // Prefer OpenAI+Hunter explicitly to avoid Apollo/free-plan issues
      let targets = null;
      if (process.env.OPENAI_API_KEY && process.env.HUNTER_API_KEY) {
        targets = await TargetDiscovery.openAIHunter(campaign.businessDescription, campaign.targetAudience, campaign.emailCount);
        console.log('OpenAI+Hunter returned', targets?.length);
      }

      // If OpenAI+Hunter didn't produce results, fall back to default discover
      if (!targets || targets.length === 0) {
        targets = await TargetDiscovery.findTargets(campaign.businessDescription, campaign.targetAudience, campaign.emailCount);
      }

      // Save targets to database
      const savedTargets = await Database.saveTargets(campaignId, targets || []);

      console.log('Saved targets sources:', savedTargets.map((t: any) => t.personalizationData?.source));

      return NextResponse.json({
        success: true,
        targets: savedTargets,
        message: `Found ${savedTargets.length} potential targets`
      });

    } catch (discoveryError) {
      console.error('Target discovery error:', discoveryError);
      return NextResponse.json(
        { error: 'Failed to find targets. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error finding targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
