import { useState, useMemo } from 'react';
import { useScraperLimits } from '../hooks/useScraperLimits';
import { useScraperSocket } from '../hooks/useScraperSocket';
import ProgressBar from '../components/ui/ProgressBar';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import RestaurantCarousel from '../components/scraper/RestaurantCarousel';

export default function Scraper() {
  const { canScrape, isChecking, remainingScrapes, refreshScrapeStatus } = useScraperLimits();
  const { zipCode, setZipCode, localData, loading, statusMsg, runScraper, clearData } = useScraperSocket(refreshScrapeStatus);

  const [filters, setFilters] = useState({ location: "", name: "", maxPrice: "", maxCalories: "" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [websiteLink, setWebsiteLink] = useState("");

  const getScanButtonLabel = () => {
    if (loading) return "Scanning...";
    if (isChecking) return "Checking limits...";
    if (!canScrape) return "Daily Limit Reached";
    return "Initialize Scan";
  };

  const handleClear = () => {
    clearData();
    setSelectedRestaurant(null);
    setFilters({ location: "", name: "", maxPrice: "", maxCalories: "" });
  };

  const handleSelectRestaurant = (address, link) => {
    setSortConfig({ key: null, direction: 'asc' });
    setSelectedRestaurant(address);
    setWebsiteLink(link);
  };

  const finalFilteredData = useMemo(() => {
    let baseData = selectedRestaurant 
      ? localData.filter(item => item.zip_and_address === selectedRestaurant) 
      : localData;

    let result = baseData.filter(item => {
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
  }, [localData, selectedRestaurant, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <div className="ops-page scraper-page min-h-screen bg-slate-50 p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="ops-intro scanner-intro text-center mb-8 w-full max-w-4xl mx-auto">
          <h2 className="scan-hero shadow-md shadow-orange-500 text-center text-6xl text-black p-12 aspect-10/2 rounded-2xl overflow-hidden bg-[url('https://images.unsplash.com/photo-1611915365928-565c527a0590?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-[60%_20%] bg-no-repeat max-w-full h-auto"></h2>
          <p className="pt-8 my-3 font-serif text-xl text-slate-800">Scanning Tool</p>
          
          <form onSubmit={runScraper} className="flex justify-center items-center flex-wrap gap-3">
            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Enter a 5 Digit ZIP Code" required disabled={loading || statusMsg.text !== ""} className="w-64 bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"/>
            
            {localData.length === 0 && statusMsg.text === "" && (
              <button type="submit" disabled={loading || isChecking || !canScrape} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                {getScanButtonLabel()}
              </button>
            )}
            
            {(localData.length > 0 || statusMsg.text !== "") && (
              <button type="button" onClick={handleClear} disabled={loading} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                Clear Results
              </button>
            )}
          </form>

          <div className="mt-3 h-5">
            {isChecking && <p className="text-xs text-slate-400">Verifying scan limit...</p>}
            {!isChecking && canScrape && remainingScrapes !== null && <p className="text-xs text-slate-400"><span className="font-semibold text-orange-500">{remainingScrapes}</span> scan{remainingScrapes !== 1 ? 's' : ''} remaining today</p>}
            {!isChecking && !canScrape && <p className="text-xs text-red-500 font-medium">Daily scan limit reached. Resets tomorrow.</p>}
          </div>
        </div>

        <ProgressBar loading={loading} />

        {statusMsg.text && (
          <div className={`text-center my-6 p-4 rounded-xl shadow-sm ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {localData.length > 0 && !selectedRestaurant && (
          <RestaurantCarousel localData={localData} onSelectRestaurant={handleSelectRestaurant} />
        )}

        {localData.length > 0 && selectedRestaurant && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setSelectedRestaurant(null); setSortConfig({ key: null, direction: 'asc' }); setFilters({ location: "", name: "", maxPrice: "", maxCalories: "" }); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors group">
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg> Back to restaurants
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <span className="text-sm font-semibold text-slate-700 truncate">{selectedRestaurant}</span>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 mb-6">
              <a href={websiteLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
                <span>Order from this location</span>
                <svg className="w-3 h-3 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
              </a>
            </div>

            <FilterPanel 
              filters={filters} setFilters={setFilters} 
              metaTags={[`Showing ${finalFilteredData.length} of ${localData.filter(i => i.zip_and_address === selectedRestaurant).length}`]} 
            />
            <DataTable data={finalFilteredData} sortConfig={sortConfig} handleSort={handleSort} />
          </div>
        )}
      </div>
    </div>
  );
}