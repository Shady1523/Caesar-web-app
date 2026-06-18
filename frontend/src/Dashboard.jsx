import { useState, useEffect, useCallback } from 'react';

function Dashboard() {
  // --- STATE ---
  const [allPizzas, setAllPizzas] = useState([]);

  const [pizzas, setPizzas] = useState([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [itemNameStr, setItemNameStr] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Added Sorting State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

// --- REAL-TIME CLIENT-SIDE FILTER ---
  useEffect(() => {
    const filtered = allPizzas.filter(item => {
      const matchesLocation = !locationStr || item.zip_and_address.toLowerCase().includes(locationStr.toLowerCase());
      const matchesName = !itemNameStr || item.item_name.toLowerCase().includes(itemNameStr.toLowerCase());
      const matchesPrice = !maxPrice || parseFloat(item.item_price) <= parseFloat(maxPrice);
      const matchesCal = !maxCalories || parseInt(item.item_cal) <= parseInt(maxCalories);
      return matchesLocation && matchesName && matchesPrice && matchesCal;
    });
    setPizzas(filtered);
  }, [allPizzas, locationStr, itemNameStr, maxPrice, maxCalories]);

  // --- LOAD ALL DATA (once per session, only re-fetches if database changed) ---
const loadData = useCallback(async () => {
  // Grab whatever is in the cache first
  const cachedData = sessionStorage.getItem('dashboardData');
  const cachedVersion = sessionStorage.getItem('dashboardVersion');

  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    setAllPizzas(parsed);
    setPizzas(parsed);
    setCacheHit(true);
    // Turn off the loading spinner instantly
    setIsLoading(false); 
  } else {
    // Only show the loading spinner if they have an entirely empty cache
    setIsLoading(true); 
  }

  // Silently ask the server for the version
  try {
    const versionRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/db_version/`);
    if (versionRes.ok) {
      const versionData = await versionRes.json();
      const latestVersion = String(versionData.latest_scraped_at);

      // If the server version is newer, fetch the real data
      if (latestVersion !== cachedVersion) {
        setIsLoading(true); // Bring back the spinner just for the heavy download
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stores/`);
        const data = await response.json();
        const allResults = data.results || data;

        setAllPizzas(allResults);
        setPizzas(allResults);
        setCacheHit(false);

        sessionStorage.setItem('dashboardData', JSON.stringify(allResults));
        sessionStorage.setItem('dashboardVersion', latestVersion);
      }
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
  } finally {
    setIsLoading(false);
  }
}, []);
 
  useEffect(() => {
    loadData();
  }, [loadData]);
 
  // Force a fresh fetch by clearing the cache first
const handleRefresh = async () => {
  setIsLoading(true);

  try {
    // 1. Ping the lightweight version endpoint FIRST
    const versionRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/db_version/`);
    
    if (versionRes.ok) {
      const versionData = await versionRes.json();
      const serverVersion = String(versionData.latest_scraped_at);
      const localVersion = sessionStorage.getItem('dashboardVersion');

      // 2. Compare the server's timestamp to the browser's timestamp
      if (serverVersion && localVersion === serverVersion) {
        // The database hasn't changed. 
        // Stop here and tell the user they are up to date!
        setStatusMsg({ text: "Your data is already up to date!", type: "info" });
        setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
        
        setIsLoading(false);
        return;
      }
    }

    // Now it is safe to clear the old cache and download the new data
    sessionStorage.removeItem('dashboardData');
    sessionStorage.removeItem('dashboardVersion');
    
    // loadData() will now correctly pull from the database because the cache is empty
    await loadData(); 
    
    setStatusMsg({ text: "Successfully updated with the latest data!", type: "success" });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);

  } catch (error) {
    console.error("Failed to check for updates:", error);
    setIsLoading(false);
  }
};

  // --- SORTING PIPELINE ---
  const sortedPizzas = [...pizzas].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
 
    if (sortConfig.key === 'item_price') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortConfig.key === 'item_cal') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else {
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

  // --- RENDER HTML ---
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-900">Pizza Database</h2>
          <p className="text-sm text-slate-500 mt-1">Filter and analyze menu items</p>
        </div>

        {/* THE FILTER PANEL */}
        <div className="bg-orange-600 p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex justify-between items-center mb-4">  
            <h3 className="text-lg font-semibold text-black mb-4">Search Parameters</h3>
              <span className="text-sm font-medium text-black bg-orange-400 px-3 py-1 rounded-full">
                Showing {pizzas.length} of {allPizzas.length} items
              </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input 
              type="text" value={locationStr} onChange={(e) => setLocationStr(e.target.value)} 
              placeholder="Location"
              className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"
            />
            <input 
              type="text" value={itemNameStr} onChange={(e) => setItemNameStr(e.target.value)} 
              placeholder="Item Name"
              className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"
            />
            <input 
              type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} 
              placeholder="Max Price"
              className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"
            />
            <input 
              type="number" value={maxCalories} onChange={(e) => setMaxCalories(e.target.value)} 
              placeholder="Max Calories"
              className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-orange-400 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-black px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm">
              Refresh Data
            </button>
            {statusMsg.text && (
              <div className={`p-2 rounded-lg shadow-sm text-sm font-medium
              ${statusMsg.type === 'success' ? 'bg-orange-400 text-red-800' : 'bg-orange-400 text-black'}`}>
              {statusMsg.text}
              </div>
            )}
            <span className="text-xs text-black italic">
              {isLoading
                ? "Loading data..."
                : cacheHit
                  ? "Loaded from cache · no database call made"
                  : "Loaded from database · results cached for this session"}
            </span>
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
                    {sortedPizzas.map((item, index) => (
                      <tr key={index} className="hover:bg-orange-400 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-black">{item.zip_and_address}</td>
                        <td className="px-6 py-4 text-sm text-black">{item.item_name}</td>
                        <td className="px-6 py-4 text-sm text-black">{item.item_cal} kcal</td>
                        <td className="px-6 py-4 text-sm text-black">${item.item_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            
            {sortedPizzas.length === 0 && (
              <div className="p-8 text-center text-black bg-slate-50 rounded-b-xl border-t border-slate-200">
                <p>No pizzas found matching your filters.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;