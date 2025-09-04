import { jsPDF } from 'jspdf';
import { createObjectCsvWriter } from 'csv-writer';
import { Campaign, EmailTemplate, Target } from './database';

export interface ExportData {
  campaign: Campaign;
  templates: EmailTemplate[];
  targets: Target[];
}

export class ExportUtils {
  static async exportToCSV(data: ExportData): Promise<string> {
    const csvData = data.targets.map(target => {
      const template = data.templates.find(t => t.templateType === 'initial');
      return {
        'Name': target.name,
        'Email': target.email || '',
        'Company': target.company,
        'Title': target.title || '',
        'LinkedIn': target.linkedinUrl || '',
        'Subject': template?.subject || '',
        'Email Body': template?.body || '',
        'Follow-up 1': data.templates.find(t => t.templateType === 'followup1')?.body || '',
        'Follow-up 2': data.templates.find(t => t.templateType === 'followup2')?.body || ''
      };
    });

    const csvContent = this.convertToCSV(csvData);
    return csvContent;
  }

  static async exportToPDF(data: ExportData): Promise<Buffer> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cold Email Campaign Report', margin, yPosition);
    yPosition += 20;

    // Campaign Info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Campaign Details:', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Business: ${data.campaign.businessName}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Description: ${data.campaign.businessDescription}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Target Audience: ${data.campaign.targetAudience || 'General'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Email Count: ${data.campaign.emailCount}`, margin, yPosition);
    yPosition += 15;

    // Email Templates
    const initialTemplate = data.templates.find(t => t.templateType === 'initial');
    if (initialTemplate) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Email Template:', margin, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.text(`Subject: ${initialTemplate.subject}`, margin, yPosition);
      yPosition += 8;

      // Split long text into multiple lines
      const bodyLines = pdf.splitTextToSize(initialTemplate.body, pageWidth - 2 * margin);
      pdf.text(bodyLines, margin, yPosition);
      yPosition += bodyLines.length * 5 + 10;
    }

    // Targets List
    pdf.setFont('helvetica', 'bold');
    pdf.text('Target Prospects:', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    data.targets.forEach((target, index) => {
      if (yPosition > 250) { // New page if needed
        pdf.addPage();
        yPosition = margin;
      }

      pdf.text(`${index + 1}. ${target.name}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`   Company: ${target.company}`, margin, yPosition);
      yPosition += 6;
      if (target.title) {
        pdf.text(`   Title: ${target.title}`, margin, yPosition);
        yPosition += 6;
      }
      if (target.email) {
        pdf.text(`   Email: ${target.email}`, margin, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    });

    return Buffer.from(pdf.output('arraybuffer'));
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  static downloadFile(content: string | Buffer, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  static copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
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
      
      return new Promise((resolve, reject) => {
        if (document.execCommand('copy')) {
          resolve();
        } else {
          reject(new Error('Failed to copy text'));
        }
        document.body.removeChild(textArea);
      });
    }
  }

  static formatEmailForCopy(template: EmailTemplate, target: Target): string {
    const personalizedBody = template.body
      .replace(/\[NAME\]/g, target.name)
      .replace(/\[COMPANY\]/g, target.company)
      .replace(/\[TITLE\]/g, target.title || 'Professional');

    return `Subject: ${template.subject}

${personalizedBody}

---
Generated by BizAI Tools - Cold Email Generator`;
  }
}
