import { useState, useEffect } from 'react';

function Dashboard() {
  const [pizzas, setPizzas] = useState([]);
  
  // 1. All of our Filter States
  const [maxPrice, setMaxPrice] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [itemNameStr, setItemNameStr] = useState("");
  const [maxCalories, setMaxCalories] = useState("");

  const fetchStores = async () => {
    try {
      // 2. The Professional way to build dynamic API URLs
      const params = new URLSearchParams();
      if (maxPrice) params.append('max_price', maxPrice);
      if (locationStr) params.append('location', locationStr);
      if (itemNameStr) params.append('item_name', itemNameStr);
      if (maxCalories) params.append('max_cal', maxCalories);

      // 3. Fetch using our clean Vite Proxy
      const response = await fetch(`/api/v1/stores/?${params.toString()}`);
      const data = await response.json();
      setPizzas(data.results || data); // Adjust based on your Django pagination
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Pizza Database</h2>
          <p className="text-slate-500 mt-2">Filter and analyze your scraped menu items.</p>
        </div>
      </div>

      {/* The Modern Filter Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Search Parameters</h3>
        
        {/* CSS Grid: 1 column on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input 
            type="text" value={locationStr} onChange={(e) => setLocationStr(e.target.value)} 
            placeholder="Location (e.g. 60074)"
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
          />
          <input 
            type="text" value={itemNameStr} onChange={(e) => setItemNameStr(e.target.value)} 
            placeholder="Item Name (e.g. Pepperoni)"
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
          />
          <input 
            type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} 
            placeholder="Max Price ($)"
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
          />
          <input 
            type="number" value={maxCalories} onChange={(e) => setMaxCalories(e.target.value)} 
            placeholder="Max Calories"
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
          />
        </div>

        <button 
          onClick={fetchStores} 
          className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Apply Filters
        </button>
      </div>

      {/* The Sleek Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
              <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
              <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Calories</th>
              <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pizzas.map((pizza, index) => (
              <tr key={index} className="hover:bg-orange-50 transition-colors">
                <td className="p-4 text-slate-600 text-sm">{pizza.zip_and_address}</td>
                <td className="p-4 font-bold text-slate-900">{pizza.item_name}</td>
                <td className="p-4 text-slate-500 text-sm">{pizza.item_cal}</td>
                <td className="p-4 text-emerald-600 font-bold">${pizza.item_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {pizzas.length === 0 && (
            <div className="p-12 text-center text-slate-400">
                <p className="text-lg">No pizzas found matching your filters.</p>
            </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;