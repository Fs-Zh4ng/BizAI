import { NextRequest, NextResponse } from 'next/server';
import { EmailGenerator } from '@/lib/openai';
import { Database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, targetInfo, userFullName, userPosition } = body;

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

    // Update campaign status
    Database.updateCampaign(campaignId, { status: 'generating' });

    try {
      // Generate email template
      const generatedEmail = await EmailGenerator.generateEmailTemplate({
        businessName: campaign.businessName,
        businessDescription: campaign.businessDescription,
        targetAudience: campaign.targetAudience,
        emailCount: campaign.emailCount,
        targetInfo,
        // prefer sender info from request, fallback to campaign stored values
        userFullName: userFullName || (campaign as any).userFullName,
        userPosition: userPosition || (campaign as any).userPosition
      });

      // Build templates array and attach targetId if provided
      const templatesToSave = [
        {
          templateType: 'initial',
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          ...(targetInfo && targetInfo.targetId ? { targetId: targetInfo.targetId } : {})
        },
        {
          templateType: 'followup1',
          subject: `Re: ${generatedEmail.subject}`,
          body: generatedEmail.followUp1,
          ...(targetInfo && targetInfo.targetId ? { targetId: targetInfo.targetId } : {})
        },
        {
          templateType: 'followup2',
          subject: `Final follow-up: ${generatedEmail.subject}`,
          body: generatedEmail.followUp2,
          ...(targetInfo && targetInfo.targetId ? { targetId: targetInfo.targetId } : {})
        }
      ];

      // Save templates to database
      const templates = Database.saveTemplates(campaignId, templatesToSave as any[]);

      // Update campaign status
      Database.updateCampaign(campaignId, { status: 'completed' });

      return NextResponse.json({
        success: true,
        templates,
        message: 'Email templates generated successfully'
      });

    } catch (aiError) {
      // Update campaign status to failed
      Database.updateCampaign(campaignId, { status: 'created' });
      
      console.error('AI generation error:', aiError);
      return NextResponse.json(
        { error: 'Failed to generate email templates. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
