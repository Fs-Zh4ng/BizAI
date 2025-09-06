'use client';

import Link from "next/link";
import { useState } from "react";

export default function CompetitorAnalysis() {
  const [formData, setFormData] = useState({
    businessIndustry: '',
    companyName: '',
    companyWebsite: '',
    competitors: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [analyses, setAnalyses] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitted(false);
    setAnalyses([]);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err?.error || 'Failed to fetch analysis');
      }

      const data = await res.json();
      const items = Array.isArray(data.analyses) ? data.analyses : [];
      // Redirect to results page with analyses encoded in the URL
      const encoded = encodeURIComponent(JSON.stringify(items));
      window.location.href = `/competitor-analysis/results?raw=${encoded}`;
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to submit.');
      alert(err?.message || 'Failed to submit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">BizAI Tools</span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="/cold-email-generator" className="text-gray-600 hover:text-gray-900">Cold Email Generator</a>
            <a href="/competitor-analysis" className="text-blue-600 hover:text-blue-900 font-semibold">Competitor Analysis</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-8">
            Competitor Spy
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Learn from your competitors
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> and outrank them</span>
            <br />in minutes
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Enter your business information and competitors to get a high-level analysis and ideas you can act on.
          </p>
        </div>
      </main>

      {/* Form Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Competitor Analysis</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="businessIndustry" className="block text-sm font-medium text-gray-700 mb-2">What business are you in?</label>
                <input
                  id="businessIndustry"
                  name="businessIndustry"
                  value={formData.businessIndustry}
                  onChange={handleInputChange}
                  placeholder="e.g., AI customer support for e-commerce"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black"
                  required
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Your company name</label>
                <input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g., MyStartup Inc"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black"
                />
              </div>

              <div>
                <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-2">Your website</label>
                <input
                  id="companyWebsite"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  placeholder="e.g., https://mystartup.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black"
                />
              </div>

              <div>
                <label htmlFor="competitors" className="block text-sm font-medium text-gray-700 mb-2">Competitors (comma separated)</label>
                <textarea
                  id="competitors"
                  name="competitors"
                  value={formData.competitors}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="e.g., Competitor A, Competitor B, Competitor C"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none text-black"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running analysis...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze Competitors
                    </>
                  )}
                </button>
              </div>
            </form>

            {errorMessage && (
              <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-4 text-red-800">
                {errorMessage}
              </div>
            )}

            {submitted && analyses.length === 0 && !errorMessage && (
              <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-yellow-800">
                Analysis completed but no results returned.
              </div>
            )}

            {analyses.length > 0 && (
              <div className="mt-8 grid gap-4">
                {analyses.map((a, idx) => {
                  // Render analysis text with bolded headings and list handling
                  const renderFormatted = (text: string) => {
                    const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
                    const elements: React.ReactNode[] = [];
                    let listBuffer: React.ReactNode[] = [];

                    const flushList = () => {
                      if (listBuffer.length > 0) {
                        elements.push(<ul key={`ul-${idx}-${elements.length}`} className="list-disc pl-5 text-sm text-gray-800">{listBuffer}</ul>);
                        listBuffer = [];
                      }
                    };

                    const headingRegex = /^(Competitor Name:|Strengths:|Weaknesses:|Market Position:|Unique Selling Points:|Comparison to Our Company:|Improvement Areas for Our Company:)\s*(.*)$/i;

                    lines.forEach((line, i) => {
                      const bulletMatch = line.match(/^[\-•\*]\s+(.*)$/);
                      const headingMatch = line.match(headingRegex);

                      if (bulletMatch) {
                        // accumulate list items
                        listBuffer.push(<li key={`li-${idx}-${i}`}>{bulletMatch[1]}</li>);
                        return;
                      }

                      if (headingMatch) {
                        // flush any pending list before heading
                        flushList();
                        const heading = headingMatch[1];
                        const rest = headingMatch[2];
                        elements.push(
                          <p key={`h-${idx}-${i}`} className="text-sm text-gray-800 mb-1">
                            <strong>{heading}</strong>{rest ? ` ${rest}` : null}
                          </p>
                        );
                        return;
                      }

                      // plain paragraph line
                      // flush list if any, then push paragraph
                      flushList();
                      elements.push(<p key={`p-${idx}-${i}`} className="text-sm text-gray-800 mb-1">{line}</p>);
                    });

                    // flush remaining list items
                    flushList();
                    return elements;
                  };

                  return (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2 text-black">Competitor #{idx + 1}</h3>
                      <div className="prose max-w-none">{renderFormatted(a)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>&copy; 2024 BizAI Tools. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
