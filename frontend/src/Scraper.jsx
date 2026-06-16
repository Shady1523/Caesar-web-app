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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  const handleClear = () => {
    setLocalData([]);
    setZipCode("");
    setStatusMsg({ text: "", type: "" });
    
    setFilterLocation("");
    setFilterName("");
    setFilterMaxPrice("");
    setFilterMaxCalories("");

    sessionStorage.removeItem('scrapedData');
    sessionStorage.removeItem('lastZip');
    sessionStorage.removeItem('statusMsg');
  };

  const finalDataToRender = [...filteredLocalData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Force numbers to sort like numbers, not text
    if (sortConfig.key === 'item_price') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortConfig.key === 'item_cal') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else {
      // Force text to sort regardless of uppercase/lowercase
      aValue = aValue ? aValue.toString().toLowerCase() : "";
      bValue = bValue ? bValue.toString().toLowerCase() : "";
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
      
        {/* --- THE COMMAND CENTER --- */}
        <div className="text-center mb-8">
          <h2
            className="shadow-md shadow-orange-500 text-center text-6xl text-black p-12 aspect-10/2 rounded-2xl overflow-hidden
            bg-[url('https://images.unsplash.com/photo-1611915365928-565c527a0590?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')]
            bg-cover bg-[60%_20%] bg-no-repeat">
          </h2>
          
          <p className="pt-8 my-3 font-serif text-xl text-slate-800">Scanning Tool</p>
          <form onSubmit={runScraper} className="flex justify-center items-center flex-wrap gap-3">
            <input 
              type="text" 
              value={zipCode} 
              onChange={(e) => setZipCode(e.target.value)} 
              placeholder="Enter a 5 digit ZIP Code" 
              required
              disabled={loading || statusMsg.text !== ""}
              className="w-64 bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"/>
            <button 
              type="submit"
              disabled={loading || statusMsg.text !== ""}
              className="bg-orange-500 hover:bg-orange-600 disabled:hover:bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              {loading ? "Scraping Server..." : statusMsg.text !== "" ? "Scan Complete" : "Initialize Scan"}
            </button>

            {(localData.length > 0 || statusMsg.text !== "") && (
              <button 
                type="button" 
                onClick={handleClear}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                Clear Results
              </button>
            )}
          </form>
        </div>

        {/* --- STATUS MESSAGES --- */}
        {statusMsg.text && (
          <div className={`text-center my-6 p-4 rounded-xl shadow-sm ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* --- LIVE RESULTS & FILTERS --- */}
        {localData.length > 0 && (
          <div>
            
            {/* THE FILTER PANEL */}
            <div className="bg-orange-500 p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Search Parameters</h3>
                <span className="text-sm font-medium text-black bg-orange-400 px-3 py-1 rounded-full">
                  Showing {filteredLocalData.length} of {localData.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  type="text" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} 
                  placeholder="Location"
                  className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
                <input 
                  type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} 
                  placeholder="Item Name" 
                  className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
                <input 
                  type="number" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} 
                  placeholder="Max Price" 
                  className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
                <input 
                  type="number" value={filterMaxCalories} onChange={(e) => setFilterMaxCalories(e.target.value)} 
                  placeholder="Max Calories" 
                  className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
              </div>
            </div>

            {/* THE DATA TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-orange-600 border-b border-black select-none">
                    <tr>
                      <th onClick={() => handleSort('zip_and_address')} className="px-6 py-3 text-xs font-semibold text-black uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors">
                        <div className="flex items-center gap-1">
                          Location {sortConfig.key === 'zip_and_address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                      </th>
                      <th onClick={() => handleSort('item_name')} className="px-6 py-3 text-xs font-semibold text-black uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors">
                        <div className="flex items-center gap-1">
                          Item Name {sortConfig.key === 'item_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                      </th>
                      <th onClick={() => handleSort('item_cal')} className="px-6 py-3 text-xs font-semibold text-black uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors">
                        <div className="flex items-center gap-1">
                          Calories {sortConfig.key === 'item_cal' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                      </th>
                      <th onClick={() => handleSort('item_price')} className="px-6 py-3 text-xs font-semibold text-black uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors">
                        <div className="flex items-center gap-1">
                          Price {sortConfig.key === 'item_price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black bg-orange-500">
                    {finalDataToRender.map((item, index) => (
                      <tr key={index} className="hover:bg-orange-400 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-black">{item.zip_and_address}</td>
                        <td className="px-6 py-4 text-sm text-black">{item.item_name}</td>
                        <td className="px-6 py-4 text-sm text-black">{item.item_cal} kcal</td>
                        <td className="px-6 py-4 text-sm text-black">${item.item_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {finalDataToRender.length === 0 && (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-b-xl border-t border-slate-200">
                    <p>No items match your current filters.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Scraper;