import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { EmailGenerator } from '@/lib/openai';
import { TargetDiscovery } from '@/lib/target-discovery';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessDescription, targetAudience, emailCount, userFullName, userPosition } = body;

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
      emailCount,
      userFullName,
      userPosition
    });

    // Update status to generating
    Database.updateCampaign(campaign.id, { status: 'generating' });

    try {
      // Step 1: Find targets first
      const targets = await TargetDiscovery.findTargets(
        businessDescription,
        targetAudience,
        emailCount
      );

      // Save targets
      const savedTargets = Database.saveTargets(campaign.id, targets);

      // Step 2: For each target, generate personalized templates
      const generationPromises = savedTargets.map(async (t) => {
        try {
          const generated = await EmailGenerator.generateEmailTemplate({
            businessName,
            businessDescription,
            targetAudience,
            emailCount,
            targetInfo: {
              name: t.name,
              company: t.company,
              title: t.title
            },
            // pass sender info so generated emails include signature
            userFullName,
            userPosition
          });

          // Return the three templates for this target, include targetId for reference
          return [
            {
              templateType: 'initial',
              subject: generated.subject,
              body: generated.body,
              targetId: t.id
            },
            {
              templateType: 'followup1',
              subject: `Re: ${generated.subject}`,
              body: generated.followUp1,
              targetId: t.id
            },
            {
              templateType: 'followup2',
              subject: `Final follow-up: ${generated.subject}`,
              body: generated.followUp2,
              targetId: t.id
            }
          ];
        } catch (err) {
          console.error(`Failed to generate templates for target ${t.id}:`, err);
          return null;
        }
      });

      const settled = await Promise.allSettled(generationPromises);

      // Collect successful templates
      const allTemplatesToSave: any[] = [];
      for (const res of settled) {
        if (res.status === 'fulfilled' && res.value) {
          allTemplatesToSave.push(...res.value);
        }
      }

      // If no templates were generated at all, fall back to generating a generic set
      let savedTemplates = [];
      if (allTemplatesToSave.length === 0) {
        // Fallback: generate a generic template (no targetInfo)
        const generic = await EmailGenerator.generateEmailTemplate({
          businessName,
          businessDescription,
          targetAudience,
          emailCount
        });

        savedTemplates = Database.saveTemplates(campaign.id, [
          { templateType: 'initial', subject: generic.subject, body: generic.body },
          { templateType: 'followup1', subject: `Re: ${generic.subject}`, body: generic.followUp1 },
          { templateType: 'followup2', subject: `Final follow-up: ${generic.subject}`, body: generic.followUp2 }
        ]);

      } else {
        // Save all personalized templates
        savedTemplates = Database.saveTemplates(campaign.id, allTemplatesToSave as any[]);
      }

      // Update campaign status to completed
      Database.updateCampaign(campaign.id, { status: 'completed' });

      return NextResponse.json({
        success: true,
        campaign: {
          ...campaign,
          status: 'completed',
          templates: savedTemplates,
          targets: savedTargets
        },
        message: `Generated personalized emails for ${savedTargets.length} targets (templates saved: ${savedTemplates.length})`
      });

    } catch (generationError) {
      // Update campaign status to failed
      Database.updateCampaign(campaign.id, { status: 'created' });
      
      console.error('Generation error:', generationError);
      return NextResponse.json(
        { error: 'Failed to generate campaign. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
