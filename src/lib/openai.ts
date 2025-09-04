import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailGenerationRequest {
  businessName: string;
  businessDescription: string;
  targetAudience?: string;
  emailCount: string;
  targetInfo?: {
    name: string;
    company: string;
    title?: string;
  };
  // Optional sender info to include as the email signature
  userFullName?: string;
  userPosition?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  followUp1: string;
  followUp2: string;
}

export interface LeadInfo {
  first_name: string;
  last_name: string;
  company: string;
  domain?: string;
  title?: string;
}

export class EmailGenerator {
  static async generateEmailTemplate(request: EmailGenerationRequest): Promise<GeneratedEmail> {
    const prompt = this.buildPrompt(request);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert cold email writer. Generate personalized, professional cold emails that get responses. Focus on value proposition and clear call-to-action. Make sure emails contain a brief description of what business does and their purpose then how the business coiuld help the target with their issues. Keep a formal and professional tone but also make it personal and engaging. Use proper grammar and spelling. Aim for 3-4 sentences with a very engaging and eye catching subject line."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = this.parseEmailResponse(response);

      // Append signature if provided and not already present
      const signatureParts: string[] = [];
      if (request.userFullName) signatureParts.push(request.userFullName);
      if (request.userPosition) signatureParts.push(request.userPosition);
      if (signatureParts.length > 0) {
        const signature = `\n\nBest,\n${signatureParts.join('\n')}`;

        const ensureSignature = (text: string) => {
          if (!text) return text;
          if (text.includes(request.userFullName || '') || text.includes(request.userPosition || '')) return text;
          return `${text}${signature}`;
        };

        parsed.body = ensureSignature(parsed.body);
        parsed.followUp1 = ensureSignature(parsed.followUp1);
        parsed.followUp2 = ensureSignature(parsed.followUp2);
      }
      
      return parsed;
    } catch (error) {
      console.error('Error generating email:', error);
      throw new Error('Failed to generate email template');
    }
  }

  // New: generate leads (first_name, last_name, company, domain (if known), title)
  static async generateLeads(businessDescription: string, targetAudience?: string, count: number = 5): Promise<LeadInfo[]> {
    const prompt = `Find me ${count} people (first_name, last_name, company, domain, title) who would be good targets for the following business description and put it in a JSON Array. Include the company domain when known. Respond with only valid JSON.

Business description: ${businessDescription}
Target audience: ${targetAudience || 'General'}

Example output:
[
  {"first_name":"Alexis","last_name":"Ohanian","company":"Reddit","domain":"reddit.com","title":"Cofounder"},
  ...
]
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a research assistant that returns machine-readable JSON arrays of people and companies.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content || '';

      // Try to extract JSON from the response
      const jsonMatch = raw.match(/\[([\s\S]*)\]\s*$/m);
      let parsed: any = null;
      try {
        if (jsonMatch) {
          parsed = JSON.parse('[' + jsonMatch[1] + ']');
        } else {
          parsed = JSON.parse(raw);
        }
      } catch (err) {
        // fallback: try to find first { ... } blocks
        const tryParse = raw.replace(/`/g, '').trim();
        parsed = JSON.parse(tryParse);
      }

      if (!Array.isArray(parsed)) return [];

      // Normalize keys
      return parsed.slice(0, count).map((p: any) => ({
        first_name: p.first_name || p.firstName || p.first || '',
        last_name: p.last_name || p.lastName || p.last || '',
        company: p.company || p.organization || p.companyName || '',
        domain: p.domain || p.company_domain || p.website || undefined,
        title: p.title || p.position || p.job || undefined
      } as LeadInfo));
    } catch (err) {
      console.warn('OpenAI lead generation failed', err);
      return [];
    }
  }

  private static buildPrompt(request: EmailGenerationRequest): string {
    const { businessName, businessDescription, targetAudience, targetInfo } = request;
    
    let prompt = `Generate a personalized cold email campaign for:

Business: ${businessName}
Description: ${businessDescription}
Target Audience: ${targetAudience || 'General business audience'}

`;

    if (targetInfo) {
      prompt += `Target Person: ${targetInfo.name}
Company: ${targetInfo.company}
Title: ${targetInfo.title || 'Business Professional'}

`;
    }

    // If sender info is provided, ask the model to include a concise signature at the end of each email
    if (request.userFullName || request.userPosition) {
      prompt += `Include the following signature at the end of each email (INITIAL, FOLLOWUP1, FOLLOWUP2):\n`;
      if (request.userFullName) prompt += `Name: ${request.userFullName}\n`;
      if (request.userPosition) prompt += `Title: ${request.userPosition}\n`;
      prompt += `\n`;
    }

    prompt += `Please generate:

1. SUBJECT LINE: A compelling, personalized subject line (under 50 characters)
2. INITIAL EMAIL: A professional cold email (100-150 words) that includes:
   - Personalized opening
   - Clear value proposition
   - Specific benefit for the recipient
   - Low-commitment call-to-action
   - Professional closing

3. FOLLOW-UP 1: A follow-up email (sent 3 days later, 80-120 words)
4. FOLLOW-UP 2: A final follow-up email (sent 7 days later, 60-100 words)

Format your response as:
SUBJECT: [subject line]
INITIAL: [initial email]
FOLLOWUP1: [first follow-up]
FOLLOWUP2: [second follow-up]

Make the emails personal, valuable, and professional. Focus on how your service helps their business. Make sure emails contain a brief description of what business does and their purpose then how the business coiuld help the target with their issues. Keep a formal and professional tone but also make it personal and engaging. Use proper grammar and spelling. Aim for 3-4 sentences with a very engaging and eye catching subject line.`;

    return prompt;
  }

  private static parseEmailResponse(response: string): GeneratedEmail {
    const lines = response.split('\n');
    // Use a single mutable result object so assignContent can update it
    const result: any = {
      subject: '',
      body: '',
      followUp1: '',
      followUp2: ''
    };
    
    let currentSection = '';
    let currentContent: string[] = [];

    const flushSection = () => {
      if (currentSection && currentContent.length > 0) {
        this.assignContent(currentSection, currentContent.join('\n'), result);
      }
    };

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (/^SUBJECT:/i.test(trimmedLine)) {
        flushSection();
        currentSection = 'subject';
        currentContent = [trimmedLine.replace(/^[sS][uU][bB][jJ][eE][cC][tT]:/, '').trim()];
      } else if (/^INITIAL:/i.test(trimmedLine)) {
        flushSection();
        currentSection = 'body';
        currentContent = [trimmedLine.replace(/^[iI][nN][iI][tT][iI][aA][lL]:/, '').trim()];
      } else if (/^FOLLOWUP1:/i.test(trimmedLine)) {
        flushSection();
        currentSection = 'followUp1';
        currentContent = [trimmedLine.replace(/^[fF][oO][lL][lL][oO][wW][uU][pP]1:/, '').trim()];
      } else if (/^FOLLOWUP2:/i.test(trimmedLine)) {
        flushSection();
        currentSection = 'followUp2';
        currentContent = [trimmedLine.replace(/^[fF][oO][lL][lL][oO][wW][uU][pP]2:/, '').trim()];
      } else if (trimmedLine && currentSection) {
        currentContent.push(trimmedLine);
      }
    }

    // Assign the last section
    flushSection();

    return {
      subject: result.subject || 'Let\'s discuss how we can help your business',
      body: result.body || 'I hope this email finds you well. I wanted to reach out to discuss how we might be able to help your business grow.',
      followUp1: result.followUp1 || 'I wanted to follow up on my previous email about how we can help your business.',
      followUp2: result.followUp2 || 'This is my final follow-up regarding our potential collaboration.'
    };
  }

  private static assignContent(section: string, content: string, result: any): void {
    switch (section) {
      case 'subject':
        result.subject = content;
        break;
      case 'body':
        result.body = content;
        break;
      case 'followUp1':
        result.followUp1 = content;
        break;
      case 'followUp2':
        result.followUp2 = content;
        break;
    }
  }
}
