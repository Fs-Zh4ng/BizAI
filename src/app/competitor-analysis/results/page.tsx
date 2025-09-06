'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
import { useRef } from 'react';
Chart.register(...registerables);

// Note: Hero UI is a Tailwind-based component set; we'll use simple Hero-like utility classes and Chart.js for graphs.
export default function ResultsPage() {
   const searchParams = useSearchParams();
   const [analyses, setAnalyses] = useState<string[]>([]);
   const [groupedAnalyses, setGroupedAnalyses] = useState<string[]>([]);
   const [metrics, setMetrics] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const revenueRef = useRef<HTMLCanvasElement | null>(null);
   const stockRef = useRef<HTMLCanvasElement | null>(null);
   const exposureRef = useRef<HTMLCanvasElement | null>(null);
   const marketShareRef = useRef<HTMLCanvasElement | null>(null);

  // Group analysis fragments into one string per competitor based on 'Competitor Name:' markers
  useEffect(() => {
    if (!analyses || analyses.length === 0) {
      setGroupedAnalyses([]);
      return;
    }
    const groups: string[] = [];
    let current = '';
    for (const item of analyses) {
      const text = item?.toString?.() || '';
      if (/^\s*Competitor Name\s*:/i.test(text)) {
        if (current) groups.push(current.trim());
        current = text;
      } else {
        if (current) current = `${current}\n\n${text}`;
        else current = text;
      }
    }
    if (current) groups.push(current.trim());
    setGroupedAnalyses(groups);
  }, [analyses]);

   // Helper to pull numeric estimate from either a number or { estimate }
   const extractNumber = (field: any): number | null => {
     if (field == null) return null;
     if (typeof field === 'number') return field;
     if (typeof field === 'object' && field !== null) {
       if (typeof field.estimate === 'number') return field.estimate;
       if (typeof field.value === 'number') return field.value;
     }
     return null;
   };

   useEffect(() => {
     const raw = searchParams.get('raw');
     // Debug info
     try { console.debug('ResultsPage raw param length:', raw ? raw.length : 0); } catch (e) {}

     // Prefer cached sessionStorage (safer for large payloads / encoding variations)
     try {
       if (typeof window !== 'undefined' && window.sessionStorage) {
         const cached = sessionStorage.getItem('competitor_analyses');
         if (cached) {
           try {
             const parsedCached = JSON.parse(cached);
             setAnalyses(parsedCached);
             setLoading(false);
             console.debug('Loaded analyses from sessionStorage', parsedCached?.length || 0);
             return;
           } catch (err) {
             console.warn('Failed to parse cached analyses in sessionStorage', err);
             // fall through to try URL param
           }
         }
       }
     } catch (err) {
       console.warn('sessionStorage access error', err);
     }

     if (!raw) {
       setError('No analysis data provided');
       setLoading(false);
       return;
     }

     // Try multiple tolerant parsing strategies for the raw query param
     const attempts = [
       (s: string) => JSON.parse(decodeURIComponent(s)),
       (s: string) => JSON.parse(s),
       (s: string) => JSON.parse(decodeURIComponent(decodeURIComponent(s))),
       (s: string) => JSON.parse(s.replace(/\+/g, ' ')),
     ];

     let parsed: any = null;
     for (const attempt of attempts) {
       try {
         parsed = attempt(raw);
         if (parsed) break;
       } catch (err: any) {
         console.debug('parse attempt failed', err?.message || err);
       }
     }

     if (!parsed) {
       console.warn('All parse attempts failed; check URL encoding or use the Analyze flow so sessionStorage is set');
       setError('Failed to parse analysis data');
       setLoading(false);
       return;
     }

     setAnalyses(parsed);
     setLoading(false);
   }, [searchParams]);

   useEffect(() => {
     if (analyses.length === 0) return;

     const run = async () => {
       setLoading(true);
       try {
         const res = await fetch('/api/competitors/metrics', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ analyses })
         });
         if (!res.ok) throw new Error('Failed to fetch metrics');
         const data = await res.json();
         setMetrics(data.metrics || []);
       } catch (err: any) {
         setError(err?.message || 'Failed to extract metrics');
       } finally {
         setLoading(false);
       }
     };

     run();
   }, [analyses]);

   useEffect(() => {
     if (!loading) {
       if (!metrics || metrics.length === 0) return;

       const labels = metrics.map(m => m?.name || 'Unknown');
       const revenues = metrics.map(m => extractNumber(m?.annual_revenue_usd));
       const stocks = metrics.map(m => extractNumber(m?.stock_price));
       const exposures = metrics.map(m => extractNumber(m?.exposure_score));
       const marketShares = metrics.map(m => extractNumber(m?.estimated_market_share_percent));

       const hasRevenue = revenues.some(v => v !== null && !Number.isNaN(v));
       const hasStock = stocks.some(v => v !== null && !Number.isNaN(v));
       const hasExposure = exposures.some(v => v !== null && !Number.isNaN(v));
       const hasMarketShare = marketShares.some(v => v !== null && !Number.isNaN(v));

       // Destroy existing charts (if any) to avoid duplicates
       try {
         if (revenueRef.current) {
           const canvasEl = revenueRef.current as HTMLCanvasElement;
           const existing = Chart.getChart(canvasEl);
           if (existing) existing.destroy();
           // clear any inline sizing from previous Chart instances to avoid cumulative growth
           try { canvasEl.style.height = ''; canvasEl.style.width = ''; } catch (e) {}
           if (hasRevenue) {
             new Chart(canvasEl, {
               type: 'bar',
               data: { labels, datasets: [{ label: 'Annual Revenue (USD)', data: revenues.map(v => v ?? 0), backgroundColor: 'rgba(34,197,94,0.8)' }] },
               options: { responsive: true, maintainAspectRatio: false }
             });
           }
         }

         if (stockRef.current) {
           const canvasEl = stockRef.current as HTMLCanvasElement;
           const existing = Chart.getChart(canvasEl);
           if (existing) existing.destroy();
           try { canvasEl.style.height = ''; canvasEl.style.width = ''; } catch (e) {}
           if (hasStock) {
             new Chart(canvasEl, {
               type: 'line',
               data: { labels, datasets: [{ label: 'Stock Price', data: stocks.map(v => v ?? 0), borderColor: 'rgba(59,130,246,0.9)', fill: false }] },
               options: { responsive: true, maintainAspectRatio: false }
             });
           }
         }

         if (exposureRef.current) {
           const canvasEl = exposureRef.current as HTMLCanvasElement;
           const existing = Chart.getChart(canvasEl);
           if (existing) existing.destroy();
           try { canvasEl.style.height = ''; canvasEl.style.width = ''; } catch (e) {}
           if (hasExposure) {
             new Chart(canvasEl, {
               type: 'bar',
               data: { labels, datasets: [{ label: 'Exposure Score (0-100)', data: exposures.map(v => v ?? 0), backgroundColor: 'rgba(234,88,12,0.85)' }] },
               options: { responsive: true, maintainAspectRatio: false }
             });
           }
         }

         if (marketShareRef.current) {
           const canvasEl = marketShareRef.current as HTMLCanvasElement;
           const existing = Chart.getChart(canvasEl);
           if (existing) existing.destroy();
           try { canvasEl.style.height = ''; canvasEl.style.width = ''; } catch (e) {}
           if (hasMarketShare) {
             new Chart(canvasEl, {
               type: 'bar',
               data: { labels, datasets: [{ label: 'Market Share (%)', data: marketShares.map(v => v ?? 0), backgroundColor: 'rgba(99,102,241,0.85)' }] },
               options: { responsive: true, maintainAspectRatio: false }
             });
           }
         }
       } catch (e) {
         console.error('Chart rendering error', e);
       }
     }
   }, [loading, metrics]);

   return (
     <div className="min-h-screen bg-slate-50 relative">
      {/* Header / Nav to match other pages */}
      <header className="px-6 py-4 bg-transparent">
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

       <div className="max-w-7xl mx-auto py-12 px-6">
         <div className="flex items-start gap-8">
           <div className="w-2/5">
             <h2 className="text-2xl font-bold mb-4 text-black">Competitor Analyses</h2>
             {analyses.length === 0 && !loading && (
               <div className="text-sm text-gray-600">No analyses found. Make sure you arrived here via the analysis flow or pass analysis data in the URL.</div>
             )}

             {groupedAnalyses.map((a, i) => {
               // lightweight formatter: bold known headings bigger
               const lines = a.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
               return (
                 <div key={i} className="mb-4 bg-white p-4 rounded shadow">
                   {lines.map((line, idx) => {
                     const headingMatch = line.match(/^(Competitor Name:|Strengths:|Weaknesses:|Market Position:|Unique Selling Points:|Comparison to Our Company:|Improvement Areas for Our Company:)\s*(.*)$/i);
                     const bullet = line.match(/^[\-•\*]\s+(.*)$/);
                     if (headingMatch) {
                       return (
                         <div key={idx} className="text-base font-semibold text-gray-900 mb-1">
                           {headingMatch[1]} {headingMatch[2] ? <span className="font-normal">{headingMatch[2]}</span> : null}
                         </div>
                       );
                     }
                     if (bullet) {
                       return <div key={idx} className="pl-4 text-sm text-gray-800">• {bullet[1]}</div>;
                     }
                     return <div key={idx} className="text-sm text-gray-800 mb-1">{line}</div>;
                   })}
                 </div>
               );
             })}
           </div>

           {/* Right column: Metrics & Graphs */}
           <div className="w-3/5">
             <h2 className="text-2xl font-bold mb-4 text-black">Metrics & Graphs</h2>
             {loading ? <div>Loading metrics and graphs...</div> : (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                   <div className="bg-white p-4 rounded shadow">
                     <h3 className="text-base font-semibold text-gray-700 mb-2 text-black">Annual Revenue Comparison</h3>
                     {(!metrics || metrics.length === 0) ? (
                       <div className="text-sm text-gray-500">No metrics available.</div>
                     ) : (
                       <>{(() => { const revenues = metrics.map(m => extractNumber(m?.annual_revenue_usd)); const hasRevenue = revenues.some(v => v !== null && !Number.isNaN(v)); return hasRevenue ? <div style={{height:420}}><canvas ref={revenueRef} style={{width: '100%', height: '100%'}} /></div> : <div className="text-sm text-gray-500">No revenue data found.</div> })()}</>
                     )}
                   </div>

                   <div className="bg-white p-4 rounded shadow">
                     <h3 className="text-base font-semibold text-gray-700 mb-2 text-black">Stock Price / Valuation</h3>
                     {(() => { const stocks = metrics.map(m => extractNumber(m?.stock_price)); return stocks.some(v => v !== null && !Number.isNaN(v)) ? <div style={{height:420}}><canvas ref={stockRef} style={{width: '100%', height: '100%'}} /></div> : <div className="text-sm text-gray-500">No stock price data.</div>; })()}
                   </div>

                   <div className="bg-white p-4 rounded shadow">
                     <h3 className="text-base font-semibold text-gray-700 mb-2 text-black">Exposure Score</h3>
                     {(() => { const exposures = metrics.map(m => extractNumber(m?.exposure_score)); return exposures.some(v => v !== null && !Number.isNaN(v)) ? <div style={{height:420}}><canvas ref={exposureRef} style={{width: '100%', height: '100%'}} /></div> : <div className="text-sm text-gray-500">No exposure scores available.</div>; })()}
                   </div>

                   <div className="bg-white p-4 rounded shadow">
                     <h3 className="text-base font-semibold text-gray-700 mb-2 text-black">Estimated Market Share (%)</h3>
                     {(() => { const shares = metrics.map(m => extractNumber(m?.estimated_market_share_percent)); return shares.some(v => v !== null && !Number.isNaN(v)) ? <div style={{height:420}}><canvas ref={marketShareRef} style={{width: '100%', height: '100%'}} /></div> : <div className="text-sm text-gray-500">No market share data available.</div>; })()}
                   </div>
                 </div>

               </div>
             )}
           </div>
         </div>
       </div>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>&copy; 2024 BizAI Tools. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
 }
