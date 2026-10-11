import { useState, useMemo, useEffect } from 'react';
import { useDataCache } from '../hooks/useDataCache';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';

export default function Dashboard() {
  const { allData, isLoading, cacheHit, statusMsg, handleRefresh } = useDataCache();
  
  const [filters, setFilters] = useState({ location: "", name: "", maxPrice: "", maxCalories: "" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [visibleCount, setVisibleCount] = useState(100);

  useEffect(() => { setVisibleCount(100); }, [filters]);

  const uniqueRestaurantCount = useMemo(() => {
    if (!allData || allData.length === 0) return 0;
    return new Set(allData.map(item => item.zip_and_address)).size;
  }, [allData]);

  const filteredAndSortedData = useMemo(() => {
    let result = allData.filter(item => {
      const matchesLoc = !filters.location || item.zip_and_address.toLowerCase().includes(filters.location.toLowerCase());
      const matchesName = !filters.name || item.item_name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesPrice = !filters.maxPrice || parseFloat(item.item_price) <= parseFloat(filters.maxPrice);
      const matchesCal = !filters.maxCalories || parseInt(item.item_cal) <= parseInt(filters.maxCalories);
      return matchesLoc && matchesName && matchesPrice && matchesCal;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (sortConfig.key === 'item_price') { aVal = parseFloat(aVal) || 0; bVal = parseFloat(bVal) || 0; }
        else if (sortConfig.key === 'item_cal') { aVal = parseInt(aVal) || 0; bVal = parseInt(bVal) || 0; }
        else { aVal = aVal?.toString().toLowerCase() || ""; bVal = bVal?.toString().toLowerCase() || ""; }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [allData, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <div className="ops-page database-page min-h-screen bg-slate-50 p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="ops-intro mb-6">
          <h2 className="text-3xl font-bold text-slate-900">Pizza Database</h2>
          <p className="text-sm text-slate-500 mt-1">Filter and analyze menu items</p>
        </div>

        <FilterPanel 
          filters={filters} setFilters={setFilters} 
          metaTags={[`${uniqueRestaurantCount} locations are currently in the database`, `Showing ${filteredAndSortedData.length} of ${allData.length} items`]} 
        />
        
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleRefresh} disabled={isLoading} className="bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-black px-4 py-2.5 rounded-lg font-medium text-sm">
            Refresh Data
          </button>
          {statusMsg.text && (
            <div className={`px-4 py-2.5 rounded-lg shadow-sm text-sm font-medium ${statusMsg.type === 'success' ? 'bg-orange-400 text-red-800' : 'bg-orange-300 text-black'}`}>
              {statusMsg.text}
            </div>
          )}
          <span className="text-xs text-black italic">
            {isLoading ? "Loading data..." : cacheHit ? "" : "Loaded from database · results cached for this session"}
          </span>
        </div>

        <DataTable data={filteredAndSortedData} sortConfig={sortConfig} handleSort={handleSort} visibleCount={visibleCount} />

        {visibleCount < filteredAndSortedData.length && (
          <div className="flex justify-center mt-6 mb-12">
            <button onClick={() => setVisibleCount(prev => prev + 100)} className="bg-orange-500 hover:bg-orange-600 text-slate-800 font-semibold py-2 px-6 rounded-lg shadow-md transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}