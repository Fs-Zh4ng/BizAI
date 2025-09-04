// Client-side API utilities for the cold email generator

export interface CampaignData {
  businessName: string;
  businessDescription: string;
  targetAudience?: string;
  emailCount: string;
  // Optional sender information collected from the UI so server can include a signature
  userFullName?: string;
  userPosition?: string;
}

export interface Campaign {
  id: string;
  businessName: string;
  businessDescription: string;
  targetAudience?: string;
  emailCount: string;
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

export class ApiClient {
  private static baseUrl = '/api';

  // Generate complete campaign (templates + targets)
  static async generateCampaign(data: CampaignData): Promise<Campaign> {
    const response = await fetch(`${this.baseUrl}/campaigns/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate campaign');
    }

    const result = await response.json();
    return result.campaign;
  }

  // Create campaign only
  static async createCampaign(data: CampaignData): Promise<Campaign> {
    const response = await fetch(`${this.baseUrl}/campaigns/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create campaign');
    }

    const result = await response.json();
    return result.campaign;
  }

  // Get campaign details
  static async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get campaign');
    }

    const result = await response.json();
    return result.campaign;
  }

  // Generate email templates for existing campaign
  static async generateEmails(campaignId: string, targetInfo?: any): Promise<EmailTemplate[]> {
    const response = await fetch(`${this.baseUrl}/emails/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId, targetInfo }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate emails');
    }

    const result = await response.json();
    return result.templates;
  }

  // Find targets for existing campaign
  static async findTargets(campaignId: string): Promise<Target[]> {
    const response = await fetch(`${this.baseUrl}/targets/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to find targets');
    }

    const result = await response.json();
    return result.targets;
  }

  // Export campaign as CSV
  static async exportCSV(campaignId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export CSV');
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cold-email-campaign-${campaignId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Export campaign as PDF
  static async exportPDF(campaignId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export PDF');
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cold-email-campaign-${campaignId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Copy email to clipboard
  static async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
      } catch (err) {
        throw new Error('Failed to copy text');
      }
      
      document.body.removeChild(textArea);
    }
  }
}
