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
  static async findCompetitorAnalysis(businessIndustry: string, companyName: string, companyWebsite: string, competitors: string): Promise<string[]> {
    const prompt = `I am currently working in the ${businessIndustry} industry. 
    My company name is ${companyName} and our website is ${companyWebsite}. 
    Here are some of our known competitors: ${competitors}. 
    Could you please find 2 additional competitors in the same industry
    that we should be aware of? `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert market analyst. Provide concise and relevant competitor information."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Attempt to parse the response as a list of competitors
      const competitorsList = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      for (let i = 0; i < competitorsList.length; i++) {
        competitors += ',' + competitorsList[i];
      }
    } catch (error) {
      console.error('Error finding competitors:', error);
      return [];
    }
    const prompt2 = `I am currently working in the ${businessIndustry} industry.
    My company name is ${companyName} and our website is ${companyWebsite}.
    Here are some of our known competitors: ${competitors}.
    Could you please provide a brief analysis of each competitor, focusing on their strengths,
    weaknesses, market position, and any unique selling points they may have? Also please
    state how the statistics of every competitor compares to our company. MAKE SURE TO
    INCLUDE NUMBERS AND STATISTICS WHERE POSSIBLE AND COMPARE TO OUR COMPANY. 
    Please format the analysis as follows:
    Competitor Name: 
    Strengths:
    Weaknesses:
    Market Position:
    Unique Selling Points:
    Comparison to Our Company:
    Improvement Areas for Our Company:
    RESPOND WITH ONLY THE RAW ANALYSIS WITHOUT ANY INTRODUCTION OR CONCLUSION.
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert market analyst. Provide concise and relevant competitor information."
          },
          {
            role: "user",
            content: prompt2
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Split the response into individual competitor analyses
      const analyses = response.split('\n\n').map(analysis => analysis.trim()).filter(analysis => analysis.length > 0);
      return analyses;
    } catch (error) {
      console.error('Error generating competitor analysis:', error);
      return [];
    }
  }
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
  static async generateLeads(businessDescription: string, targetAudience?: string, min: number = 3, max: number = 5): Promise<LeadInfo[]> {
    const prompt = `Find between ${min} and ${max} people (first_name, last_name, company, domain, title) who would be good targets for the following business description and put it in a JSON Array. Include the company domain when known. Respond with only valid JSON.

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

      // Normalize keys and limit to the requested upper bound
      return parsed.slice(0, max).map((p: any) => ({
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

  // Extract numeric business metrics from raw competitor analyses using OpenAI and return structured JSON
  static async extractCompetitorMetrics(analyses: string[]): Promise<any[]> {
    const prompt = `You are a careful data extraction assistant. Given the competitor analyses below, produce a JSON array of objects, one per competitor, extracting numeric business metrics where possible. For each competitor return the following fields:
+
+  - name: string (company name)
+  - price_range: string | null (e.g. "$199-$999")
+  - stock_price: { estimate: number | null, confidence: number (0-100), source: string | null } | null
+  - annual_revenue_usd: { estimate: number | null, confidence: number (0-100), source: string | null } | null
+  - estimated_market_share_percent: { estimate: number | null, confidence: number (0-100), source: string | null } | null
+  - number_of_customers: { estimate: number | null, confidence: number (0-100), source: string | null } | null
+  - net_worth_usd: { estimate: number | null, confidence: number (0-100), source: string | null } | null
+  - exposure_score: { estimate: number | null, confidence: number (0-100), source: string | null } | null
+  - notes: string | null
+
+Guidelines:
+  - Provide numeric averages
+  - For each numeric field include a confidence integer between 0 and 100 (0 = no confidence / not estimated, 100 = high confidence).
+  - Use null never; give a conservative estimate and a low confidence value.
+  - Reply with only valid JSON (no surrounding commentary).
+
+Analyses:\n${analyses.join('\n\n')}
+
+Example output:
+[
+  {
+    "name": "Competitor A",
+    "price_range": "$199-$999",
+    "stock_price": { "estimate": 123.45, "confidence": 40, "source": "model_estimate" },
+    "annual_revenue_usd": { "estimate": 5000000000, "confidence": 30, "source": "model_estimate" },
+    "estimated_market_share_percent": { "estimate": 12.3, "confidence": 25, "source": "analysis_text" },
+    "number_of_customers": { "estimate": 1000000, "confidence": 20, "source": "model_estimate" },
+    "net_worth_usd": { "estimate": 20000000000, "confidence": 20, "source": "model_estimate" },
+    "exposure_score": { "estimate": 85, "confidence": 50, "source": "analysis_text" },
+    "notes": "Estimated from description"
+  }
+]
+`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a JSON extraction assistant. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0
      });

      const raw = completion.choices[0]?.message?.content || '';
      // Debug logs to help diagnose parsing issues
      try {
        console.debug('OpenAI raw response (first 2000 chars):', raw.slice(0, 2000));
      } catch (logErr) {
        console.debug('OpenAI raw response (could not slice):', raw);
      }

      // Try to parse the response as JSON
      let parsed: any = null;
      let retryJsonText: string | null = null;

      // Helper: extract the first [...] block from the model output
      const extractJsonArray = (text: string): string | null => {
        const m = text.match(/(\[[\s\S]*?\])/m);
        return m ? m[1] : null;
      };

      // Locate a JSON array in the response
      let jsonText = extractJsonArray(raw);

      // If we couldn't find a clean array, try to recover by removing fences and slicing
      if (!jsonText) {
        const cleaned = raw.replace(/```[a-z]*\n?/gi, '').trim();
        const firstBracket = cleaned.indexOf('[');
        if (firstBracket !== -1) {
          // pick a closing index: prefer last ']' or last '}' else end
          let lastClose = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
          if (lastClose <= firstBracket) lastClose = cleaned.length - 1;
          jsonText = cleaned.slice(firstBracket, lastClose + 1);
          if (!jsonText.trim().startsWith('[')) jsonText = '[' + jsonText;
          if (!jsonText.trim().endsWith(']')) jsonText = jsonText + ']';
        }
      }

      if (jsonText) {
        // sanitize common issues
        jsonText = jsonText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      }

      // Attempt primary parse
      if (jsonText) {
        try {
          parsed = JSON.parse(jsonText);
        } catch (err) {
          console.debug('Primary JSON.parse failed, will attempt retry and recovery');
        }
      }

      // If parse failed, retry once with stricter instructions (higher tokens)
      if (!parsed) {
        try {
          console.warn('Initial parse failed, retrying extraction once to recover full JSON');
          const retryCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are a JSON extraction assistant. Return only a single valid JSON array and nothing else.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1500,
            temperature: 0
          });

          const retryRaw = retryCompletion.choices[0]?.message?.content || '';
          console.debug('OpenAI retry raw response (first 2000 chars):', retryRaw.slice(0, 2000));

          retryJsonText = extractJsonArray(retryRaw);
          if (!retryJsonText) {
            const cleanedRetry = retryRaw.replace(/```[a-z]*\n?/gi, '').trim();
            const firstBracketRetry = cleanedRetry.indexOf('[');
            if (firstBracketRetry !== -1) {
              let lastCloseRetry = Math.max(cleanedRetry.lastIndexOf(']'), cleanedRetry.lastIndexOf('}'));
              if (lastCloseRetry <= firstBracketRetry) lastCloseRetry = cleanedRetry.length - 1;
              retryJsonText = cleanedRetry.slice(firstBracketRetry, lastCloseRetry + 1);
              if (!retryJsonText.trim().startsWith('[')) retryJsonText = '[' + retryJsonText;
              if (!retryJsonText.trim().endsWith(']')) retryJsonText = retryJsonText + ']';
            }
          }

          if (retryJsonText) {
            retryJsonText = retryJsonText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            try {
              parsed = JSON.parse(retryJsonText);
            } catch (err3) {
              console.error('Retry parse failed', err3);
            }
          }
        } catch (err2) {
          console.error('Retry extraction failed', err2);
        }
      }

      // Recovery: try balancing and extracting individual objects
      if (!parsed) {
        try {
          const candidateSource = jsonText || retryJsonText || raw.replace(/```[a-z]*\n?/gi, '').trim();
          let candidate = candidateSource;

          // Append missing closing braces/brackets by counting via split
          const count = (s: string, ch: string) => s.split(ch).length - 1;
          const openCurly = count(candidate, '{');
          const closeCurly = count(candidate, '}');
          const openSquare = count(candidate, '[');
          const closeSquare = count(candidate, ']');

          for (let i = 0; i < Math.max(0, openCurly - closeCurly); i++) candidate += '}';
          for (let i = 0; i < Math.max(0, openSquare - closeSquare); i++) candidate += ']';

          candidate = candidate.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

          try {
            parsed = JSON.parse(candidate);
            console.debug('Recovered JSON by balancing braces/brackets');
          } catch (errBal) {
            // Extract individual objects as last resort
            const objs: any[] = [];
            const objRegex = /\{[\s\S]*?\}/g;
            const matches = candidate.match(objRegex) || [];
            for (const m of matches) {
              try {
                const o = JSON.parse(m.replace(/,\s*}/g, '}'));
                objs.push(o);
              } catch (e) {
                // skip
              }
            }
            if (objs.length > 0) {
              parsed = objs;
              console.debug('Recovered by extracting individual objects, count=', objs.length);
            }
          }
        } catch (finalErr) {
          console.error('Final recovery attempt failed', finalErr);
        }
      }

      if (!Array.isArray(parsed)) {
        console.error('Parsed JSON is not an array', parsed, 'raw:', raw);
        return [];
      }
      return parsed;
    } catch (err) {
      console.error('Error extracting competitor metrics:', err);
      return [];
    }
  }

  static buildPrompt(request: EmailGenerationRequest): string {
    // Implementation of buildPrompt
  }

  static parseEmailResponse(response: string): GeneratedEmail {
    // Implementation of parseEmailResponse
  }

  static assignContent(section: string, content: string, result: any): void {
    // Implementation of assignContent
  }
}
