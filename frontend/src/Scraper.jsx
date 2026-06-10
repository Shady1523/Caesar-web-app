import { useState, useEffect } from 'react';

function Scraper() {
  // --- CORE STATE ---
  const [zipCode, setZipCode] = useState("");
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // --- FILTER STATE ---
  const [filterLocation, setFilterLocation] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMaxCalories, setFilterMaxCalories] = useState("");

  // --- MEMORY RECOVERY ---
  useEffect(() => {
    const savedData = sessionStorage.getItem('scrapedData');
    const savedZip = sessionStorage.getItem('lastZip');
    const savedMsg = sessionStorage.getItem('statusMsg');

    if (savedData) {
      setLocalData(JSON.parse(savedData));
      setZipCode(savedZip || "");
      if (savedMsg) setStatusMsg(JSON.parse(savedMsg));
    }
  }, []);

  const runScraper = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    setLocalData([]);

    try {
      const response = await fetch('/api/v2/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_code: zipCode })
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || "Failed to scrape the area.");
      }

      const newResults = data.results || [];
      const successMsg = { 
          text: data.message || `Successfully scraped area ${zipCode}. Found ${newResults.length} items.`, 
          type: "success" 
      };
      
      setLocalData(newResults);
      setStatusMsg(successMsg);

      sessionStorage.setItem('scrapedData', JSON.stringify(newResults));
      sessionStorage.setItem('lastZip', zipCode);
      sessionStorage.setItem('statusMsg', JSON.stringify(successMsg));
      
    } catch (error) {
      setStatusMsg({ text: error.message || "Error connecting to the scraper backend.", type: "error" });
    } finally {
      setLoading(false); 
    }
  };

  const filteredLocalData = localData.filter(item => {
    const matchesLocation = filterLocation === "" || item.zip_and_address.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesName = filterName === "" || item.item_name.toLowerCase().includes(filterName.toLowerCase());
    const matchesPrice = filterMaxPrice === "" || parseFloat(item.item_price) <= parseFloat(filterMaxPrice);
    
    const itemCal = parseInt(item.item_cal);
    const matchesCalories = filterMaxCalories === "" || (!isNaN(itemCal) && itemCal <= parseInt(filterMaxCalories));

    return matchesLocation && matchesName && matchesPrice && matchesCalories;
  });

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      
      {/* --- THE COMMAND CENTER --- */}
      <div className="bg-slate-900 rounded-2xl p-8 md:p-12 shadow-2xl text-white mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Deploy Scraper</h2>
        <p className="text-slate-400 mb-8 text-lg">Enter a ZIP code to command Playwright to scrape live menu data.</p>
        
        <form onSubmit={runScraper} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} 
            placeholder="Enter ZIP Code (e.g. 60074)" required
            className="flex-1 bg-slate-800 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-lg transition-all"
          />
          <button 
            type="submit" disabled={loading}
            className="relative flex items-center justify-center bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-8 py-4 rounded-xl transition-colors min-w-[220px]"
          >
            {loading ? "Scraping Server..." : "Initialize Scan"}
          </button>
        </form>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl mb-8 border font-medium shadow-sm transition-all ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* --- LIVE RESULTS & FILTERS --- */}
      {localData.length > 0 && (
        <>
          {/* THE FILTER PANEL */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Filter Current Scrape</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} 
                placeholder="Filter Location"
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              />
              <input 
                type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} 
                placeholder="Filter Item Name"
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              />
              <input 
                type="number" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} 
                placeholder="Max Price ($)"
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              />
              <input 
                type="number" value={filterMaxCalories} onChange={(e) => setFilterMaxCalories(e.target.value)} 
                placeholder="Max Calories"
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* THE DATA TABLE */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 animate-fade-in mb-12">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-800">Freshly Scraped Results</h3>
               <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                 Showing {filteredLocalData.length} of {localData.length}
               </span>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Item Name</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Calories</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLocalData.map((item, index) => (
                  <tr key={index} className="hover:bg-orange-50 transition-colors">
                    <td className="p-4 text-slate-600 text-sm">{item.zip_and_address}</td>
                    <td className="p-4 font-bold text-slate-900">{item.item_name}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.item_cal}</td>
                    <td className="p-4 text-emerald-600 font-bold">${item.item_price}</td>
                  </tr>
                ))}
                {filteredLocalData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">No items match your current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}

export default Scraper;