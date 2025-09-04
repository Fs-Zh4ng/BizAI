// Simple in-memory database for hackathon demo
// In production, this would be replaced with a real database

export interface Campaign {
  id: string;
  businessName: string;
  businessDescription: string;
  targetAudience?: string;
  emailCount: string;
  // Optional sender information to include in generated emails
  userFullName?: string;
  userPosition?: string;
  status: 'created' | 'generating' | 'completed';
  createdAt: string;
  templates?: EmailTemplate[];
  targets?: Target[];
}

export interface EmailTemplate {
  id: string;
  campaignId: string;
  templateType: 'initial' | 'followup1' | 'followup2';
  subject: string;
  body: string;
  createdAt: string;
}

export interface Target {
  id: string;
  campaignId: string;
  name: string;
  email?: string;
  company: string;
  title?: string;
  linkedinUrl?: string;
  personalizationData?: any;
  status: 'found' | 'validated' | 'invalid';
  createdAt: string;
}

// In-memory storage (for demo purposes)
const campaigns: Map<string, Campaign> = new Map();
const templates: Map<string, EmailTemplate[]> = new Map();
const targets: Map<string, Target[]> = new Map();

export class Database {
  // Campaign operations
  static createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'status'>): Campaign {
    const id = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const campaign: Campaign = {
      ...data,
      id,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    campaigns.set(id, campaign);
    return campaign;
  }

  static getCampaign(id: string): Campaign | null {
    return campaigns.get(id) || null;
  }

  static updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
    const campaign = campaigns.get(id);
    if (!campaign) return null;

    const updatedCampaign = { ...campaign, ...updates };
    campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  // Template operations
  static saveTemplates(campaignId: string, emailTemplates: Omit<EmailTemplate, 'id' | 'campaignId' | 'createdAt'>[]): EmailTemplate[] {
    const templatesWithIds = emailTemplates.map(template => ({
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      createdAt: new Date().toISOString()
    }));

    templates.set(campaignId, templatesWithIds);
    return templatesWithIds;
  }

  static getTemplates(campaignId: string): EmailTemplate[] {
    return templates.get(campaignId) || [];
  }

  // Target operations
  static saveTargets(campaignId: string, targetList: Omit<Target, 'id' | 'campaignId' | 'createdAt' | 'status'>[]): Target[] {
    const targetsWithIds = targetList.map(target => ({
      ...target,
      id: `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      status: 'found' as const,
      createdAt: new Date().toISOString()
    }));

    targets.set(campaignId, targetsWithIds);
    return targetsWithIds;
  }

  static getTargets(campaignId: string): Target[] {
    return targets.get(campaignId) || [];
  }

  // Utility methods
  static getAllCampaigns(): Campaign[] {
    return Array.from(campaigns.values());
  }

  static deleteCampaign(id: string): boolean {
    const deleted = campaigns.delete(id);
    templates.delete(id);
    targets.delete(id);
    return deleted;
  }
}
