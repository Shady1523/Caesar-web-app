import { useState } from 'react';

function Scraper() {
  const [zipCode, setZipCode] = useState("");
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const runScraper = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setStatusMsg("");

    try {
      const response = await fetch('/api/v1/scrape/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_code: zipCode })
      });

      const data = await response.json();
      setLocalData(data.results || []);
      setStatusMsg(data.message || `Successfully scraped area ${zipCode}`);
    } catch (error) {
      setStatusMsg("Error connecting to the scraper backend.");
      console.error(error);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-900 rounded-2xl p-8 md:p-12 shadow-2xl text-white mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Deploy Scraper 🤖</h2>
        <p className="text-slate-400 mb-8 text-lg">Enter a ZIP code to command Playwright to scrape live menu data.</p>
        
        <form onSubmit={runScraper} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={zipCode} 
            onChange={(e) => setZipCode(e.target.value)} 
            placeholder="Enter ZIP Code (e.g. 60074)"
            required
            className="flex-1 bg-slate-800 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-lg placeholder-slate-500 transition-all"
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="relative flex items-center justify-center bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-8 py-4 rounded-xl transition-colors min-w-[200px]"
          >
            {/* THE ANIMATION LOGIC */}
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scraping...
              </>
            ) : (
              "Initialize Scan"
            )}
          </button>
        </form>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-8 border border-emerald-200 font-medium shadow-sm">
          {statusMsg}
        </div>
      )}

      {/* Results Table (Same as dashboard styling) */}
      {localData.length > 0 && (
         <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
         {/* ... (Keep your existing table structure here, but apply the classes from the Dashboard table) ... */}
         </div>
      )}
    </div>
  );
}

export default Scraper;