import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">BizAI Tools</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/cold-email-generator" className="text-blue-600 hover:text-blue-900">Cold Email Generator</a>
            <a href="/competitor-analysis" className="text-blue-600 hover:text-blue-900">Competitor Analysis</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
            AI-powered business intelligence
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Scale your business with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI intelligence</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your outreach and competitive analysis with AI. Generate personalized cold emails 
            and spy on competitors in seconds, not hours.
          </p>
          
          <button className="bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg">
            Start building smarter
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* AI Cold Email Generator */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AI Cold Email Generator</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Paste a LinkedIn profile or company website and watch AI craft highly personalized 
                cold emails with 2 follow-ups. Instant personalization that looks like magic.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  LinkedIn profile scraping
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Personalized email generation
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Automated follow-up sequences
                </div>
              </div>
            </div>

            {/* AI Competitor Spy */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AI Competitor Analysis</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Enter any competitor website and get instant analysis of their USP, pricing strategy, 
                and weaknesses. Like having a growth consultant in a box.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Website content analysis
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Pricing strategy insights
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Competitive advantage mapping
                </div>
              </div>
            </div>
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
