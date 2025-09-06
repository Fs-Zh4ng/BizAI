// Target discovery service for finding potential prospects
// For hackathon demo, we'll use mock data and simple company name extraction

import path from 'path';
import { EmailGenerator } from './openai';

export interface TargetInfo {
  name: string;
  email?: string;
  company: string;
  title?: string;
  linkedinUrl?: string;
  personalizationData?: any;
}

export class TargetDiscovery {
  // Mock target data for demo purposes
  private static mockTargets: TargetInfo[] = [
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
      company: "TechCorp Solutions",
      title: "Customer Service Manager",
      linkedinUrl: "https://linkedin.com/in/sarah-johnson-csm"
    },
    {
      name: "Mike Chen",
      email: "mike.chen@retailplus.com",
      company: "RetailPlus Inc",
      title: "Operations Director",
      linkedinUrl: "https://linkedin.com/in/mike-chen-ops"
    },
    {
      name: "Emily Davis",
      email: "emily@davisconsulting.com",
      company: "Davis Consulting",
      title: "Founder & CEO",
      linkedinUrl: "https://linkedin.com/in/emily-davis-ceo"
    },
    {
      name: "David Rodriguez",
      email: "david.rodriguez@startupx.com",
      company: "StartupX",
      title: "Head of Marketing",
      linkedinUrl: "https://linkedin.com/in/david-rodriguez-marketing"
    },
    {
      name: "Lisa Wang",
      email: "lisa.wang@innovateco.com",
      company: "InnovateCo",
      title: "Business Development Manager",
      linkedinUrl: "https://linkedin.com/in/lisa-wang-bd"
    },
    {
      name: "James Thompson",
      email: "james.thompson@growthlabs.com",
      company: "GrowthLabs",
      title: "VP of Sales",
      linkedinUrl: "https://linkedin.com/in/james-thompson-sales"
    },
    {
      name: "Maria Garcia",
      email: "maria.garcia@scalestart.com",
      company: "ScaleStart",
      title: "Customer Success Director",
      linkedinUrl: "https://linkedin.com/in/maria-garcia-cs"
    },
    {
      name: "Alex Kim",
      email: "alex.kim@nextgen.com",
      company: "NextGen Technologies",
      title: "Product Manager",
      linkedinUrl: "https://linkedin.com/in/alex-kim-pm"
    }
  ];

  static async findTargets(
    businessDescription: string,
    targetAudience?: string,
    emailCount: string = 'small'
  ): Promise<TargetInfo[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const range = this.getEmailCountRange(emailCount);

    // Preferred flow: use OpenAI to generate candidate leads and then Hunter to resolve emails
    if (process.env.OPENAI_API_KEY && process.env.HUNTER_API_KEY) {
      try {
        const hunterResults = await this.searchOpenAIThenHunter(businessDescription, targetAudience, range.min, range.max);
        if (hunterResults && hunterResults.length > 0) return hunterResults;
      } catch (err) {
        console.warn('OpenAI+Hunter flow failed, falling back to local mock targets:', err);
      }
    }

    // Fallback: extract company names from business description
    const companyNames = this.extractCompanyNames(businessDescription);
    
    // Filter targets based on business type and audience
    let filteredTargets = this.filterTargetsByBusiness(companyNames, targetAudience);
    
    // Limit based on upper bound of requested range
    filteredTargets = filteredTargets.slice(0, range.max);

    // Add some randomization to make it feel more realistic
    return this.shuffleArray(filteredTargets);
  }

  private static extractCompanyNames(description: string): string[] {
    // Simple keyword extraction for demo
    const keywords = description.toLowerCase();
    const companyTypes = [];
    
    if (keywords.includes('saas') || keywords.includes('software')) {
      companyTypes.push('SaaS', 'Software', 'Technology');
    }
    if (keywords.includes('ecommerce') || keywords.includes('retail')) {
      companyTypes.push('E-commerce', 'Retail');
    }
    if (keywords.includes('consulting') || keywords.includes('service')) {
      companyTypes.push('Consulting', 'Services');
    }
    if (keywords.includes('startup') || keywords.includes('small business')) {
      companyTypes.push('Startup', 'Small Business');
    }
    
    return companyTypes.length > 0 ? companyTypes : ['Business', 'Company'];
  }

  private static filterTargetsByBusiness(companyTypes: string[], targetAudience?: string): TargetInfo[] {
    // For demo, return all mock targets but could be filtered based on business type
    return this.mockTargets.map(target => ({
      ...target,
      personalizationData: {
        companyType: companyTypes[0] || 'Business',
        targetAudience: targetAudience || 'General',
        industry: this.getIndustryFromCompany(target.company)
      }
    }));
  }

  private static getIndustryFromCompany(company: string): string {
    const companyLower = company.toLowerCase();
    if (companyLower.includes('tech') || companyLower.includes('software')) return 'Technology';
    if (companyLower.includes('retail') || companyLower.includes('commerce')) return 'Retail';
    if (companyLower.includes('consulting') || companyLower.includes('services')) return 'Consulting';
    if (companyLower.includes('startup') || companyLower.includes('growth')) return 'Startup';
    return 'Business';
  }

  private static getEmailCount(emailCount: string): number {
    // Deprecated: kept for binary compatibility; prefer getEmailCountRange
    switch (emailCount) {
      case 'small': return 5;
      case 'medium': return 10;
      case 'large': return 20;
      case 'enterprise': return 50;
      default: return 5;
    }
  }

  private static getEmailCountRange(emailCount: string): { min: number; max: number } {
    switch (emailCount) {
      case 'small': return { min: 5, max: 10 };
      case 'medium': return { min: 10, max: 20 };
      case 'large': return { min: 20, max: 50 };
      case 'enterprise': return { min: 50, max: 100 };
      default: return { min: 3, max: 5 };
    }
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Email validation (mock for demo)
  static async validateEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }
    
    // Mock validation - 90% success rate
    const isValid = Math.random() > 0.1;
    return {
      valid: isValid,
      reason: isValid ? undefined : 'Email address not deliverable'
    };
  }

  // Company data enrichment (mock for demo)
  static async enrichCompanyData(companyName: string): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      companyName,
      industry: this.getIndustryFromCompany(companyName),
      size: this.getCompanySize(companyName),
      website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      description: `Leading ${this.getIndustryFromCompany(companyName).toLowerCase()} company focused on innovation and growth.`
    };
  }

  private static getCompanySize(companyName: string): string {
    const name = companyName.toLowerCase();
    if (name.includes('startup') || name.includes('small')) return '1-50 employees';
    if (name.includes('corp') || name.includes('inc')) return '100-500 employees';
    if (name.includes('enterprise') || name.includes('global')) return '500+ employees';
    return '50-200 employees';
  }

  // Use OpenAI to generate candidate leads (names + companies) and then query Hunter to resolve emails.
  private static async searchOpenAIThenHunter(businessDescription: string, targetAudience: string | undefined, min: number, max: number): Promise<TargetInfo[] | null> {
    if (!process.env.OPENAI_API_KEY || !process.env.HUNTER_API_KEY) return null;

    try {
      const leads = await EmailGenerator.generateLeads(businessDescription, targetAudience, min, max);
      if (!leads || leads.length === 0) return null;
      console.log('Requested leads range:', min, max);

      const hunterKey = process.env.HUNTER_API_KEY!;
      const results: TargetInfo[] = [];

      // Query Hunter sequentially to avoid rate-limit bursts
      for (const lead of leads.slice(0, max)) {
        const first = (lead.first_name || '').trim();
        const last = (lead.last_name || '').trim();
        if (!first || !last) continue;

        // Determine domain: prefer provided domain, otherwise derive from company
        const domain = lead.domain && lead.domain.length > 0 ? lead.domain : (lead.company ? lead.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : '');
        const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(first)}&last_name=${encodeURIComponent(last)}&api_key=${encodeURIComponent(hunterKey)}`;

        try {
          const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
          if (!res.ok) {
            const txt = await res.text().catch(() => '<unreadable>');
            console.warn('Hunter API responded non-OK', res.status, txt);
            continue;
          }

          const payload = await res.json();
          const d = payload?.data;
          if (d && d.email) {
            results.push({
              name: `${d.first_name || first} ${d.last_name || last}`.trim(),
              email: d.email,
              company: d.company || lead.company || '',
              title: d.position || lead.title || undefined,
              linkedinUrl: d.linkedin_url || undefined,
              personalizationData: { source: 'hunter', score: d.score, verification: d.verification, raw: d }
            });
          }
        } catch (err) {
          console.warn('Hunter lookup failed for', first, last, err);
        }

        // small delay to be polite and avoid rate limits
        await new Promise(r => setTimeout(r, 250));
      }

      return results.length > 0 ? results : null;
    } catch (err) {
      console.warn('OpenAI+Hunter flow failed', err);
      return null;
    }
  }

  // Public wrapper to run OpenAI+Hunter flow directly
  static async openAIHunter(businessDescription: string, targetAudience: string | undefined, emailCount: string = 'small'): Promise<TargetInfo[] | null> {
    const range = this.getEmailCountRange(emailCount);
    return await this.searchOpenAIThenHunter(businessDescription, targetAudience, range.min, range.max);
  }
}
