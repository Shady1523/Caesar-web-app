import { useState, useEffect } from 'react';

function Dashboard() {
  // --- 1. STATE ---
  const [pizzas, setPizzas] = useState([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [itemNameStr, setItemNameStr] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  
  // Added Sorting State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // --- 2. API FETCH ---
  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (maxPrice) params.append('max_price', maxPrice);
      if (locationStr) params.append('location', locationStr);
      if (itemNameStr) params.append('item_name', itemNameStr);
      if (maxCalories) params.append('max_cal', maxCalories);

      const response = await fetch(`/api/v1/stores/?${params.toString()}`);
      const data = await response.json();
      const fetchedEntries = data.results || data;
      setPizzas(fetchedEntries);
      if (!maxPrice && !locationStr && !itemNameStr && !maxCalories) {
        setTotalCount(fetchedEntries.length);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // --- 3. SORTING PIPELINE ---
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

  // --- 4. RENDER HTML ---
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-900">Pizza Database</h2>
          <p className="text-sm text-slate-500 mt-1">Filter and analyze scraped menu items</p>
        </div>

        {/* THE FILTER PANEL */}
        <div className="bg-orange-600 p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex justify-between items-center mb-4">  
            <h3 className="text-lg font-semibold text-black mb-4">Search Parameters</h3>
              <span className="text-sm font-medium text-black bg-orange-400 px-3 py-1 rounded-full">
                Showing {pizzas.length} of {totalCount}
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

          <button 
            onClick={fetchStores} 
            className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            Apply Filters
          </button>
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