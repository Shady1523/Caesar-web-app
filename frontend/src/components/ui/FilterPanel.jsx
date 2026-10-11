export default function FilterPanel({ 
  filters, setFilters, title = "Search Parameters", metaTags = [] 
}) {
  return (
    <div className="filter-panel bg-orange-600 p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <div className="flex gap-2">
          {metaTags.map((tag, idx) => (
            <span key={idx} className="text-sm font-medium text-black bg-orange-400 px-3 py-1 rounded-full italic">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input type="text" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} placeholder="Location" className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
        <input type="text" value={filters.name} onChange={(e) => setFilters({...filters, name: e.target.value})} placeholder="Item Name" className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
        <input type="number" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} placeholder="Max Price" className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
        <input type="number" value={filters.maxCalories} onChange={(e) => setFilters({...filters, maxCalories: e.target.value})} placeholder="Max Calories" className="w-full bg-orange-400 text-slate-900 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-700 transition-shadow"/>
      </div>
    </div>
  );
}