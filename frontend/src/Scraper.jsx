import { useState, useEffect, useRef, useCallback } from 'react';

function Scraper() {
  // --- CORE STATE ---
  const [zipCode, setZipCode] = useState("");
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [websiteLink, setWebsiteLink] = useState("");

  // --- FILTER STATE ---
  const [filterLocation, setFilterLocation] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMaxCalories, setFilterMaxCalories] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // --- CARD VIEW STATE ---
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);

  // --- SCRAPE LIMIT STATE ---
  const [canScrape, setCanScrape] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [remainingScrapes, setRemainingScrapes] = useState(null);

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

  // --- SCRAPE LIMIT CHECK ---
  // Extracted into a useCallback so it can be re-called after each scrape
  const refreshScrapeStatus = useCallback(() => {
    setIsChecking(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/check_scrape_status/`)
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(data => {
        setCanScrape(data.can_scrape);
        setRemainingScrapes(data.remaining_scrapes);
      })
      .catch(err => {
        // Fail open: a network error on the status check should not lock the user out
        console.error("Could not verify scrape limit:", err);
        setCanScrape(true);
        setRemainingScrapes(null);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, []);

  // Run once on mount
  useEffect(() => {
    refreshScrapeStatus();
  }, [refreshScrapeStatus]);

  const runScraper = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    setLocalData([]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}`, {
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

      // Re-check limit after a successful scrape so the button
      // disables immediately if the user just used their last scan
      refreshScrapeStatus();

    } catch (error) {
      setStatusMsg({ text: error.message || "Error connecting to the scraper backend.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING LOGIC (applied before sorting and rendering) ---
  const filteredLocalData = localData.filter(item => {
    const matchesLocation = filterLocation === "" || item.zip_and_address.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesName = filterName === "" || item.item_name.toLowerCase().includes(filterName.toLowerCase());
    const matchesPrice = filterMaxPrice === "" || parseFloat(item.item_price) <= parseFloat(filterMaxPrice);

    const itemCal = parseInt(item.item_cal);
    const matchesCalories = filterMaxCalories === "" || (!isNaN(itemCal) && itemCal <= parseInt(filterMaxCalories));

    return matchesLocation && matchesName && matchesPrice && matchesCalories;
  });


  // --- CLEAR FUNCTION (resets everything to initial state) ---
  const handleClear = () => {
    setLocalData([]);
    setZipCode("");
    setStatusMsg({ text: "", type: "" });
    setSelectedRestaurant(null);

    setFilterLocation("");
    setFilterName("");
    setFilterMaxPrice("");
    setFilterMaxCalories("");

    sessionStorage.removeItem('scrapedData');
    sessionStorage.removeItem('lastZip');
    sessionStorage.removeItem('statusMsg');

    setCanScrollLeft(false);
    setCanScrollRight(true);
  };

  // --- SORTING LOGIC ---
  const finalDataToRender = [...filteredLocalData].sort((a, b) => {
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

  // --- SORTING HANDLER (toggles asc/desc on repeated clicks) ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- GROUP DATA INTO RESTAURANT CARDS ---
  const restaurantCards = Object.values(
    localData.reduce((acc, item) => {
      const key = item.zip_and_address;
      if (!acc[key]) {
        acc[key] = { zip_and_address: key, items: [] };
      }
      acc[key].items.push(item);
      return acc;
    }, {})
  ).sort((a, b) => {
    const sumA = a.items.reduce((total, i) => total + (parseFloat(i.item_price) || 0), 0);
    const avgA = sumA / a.items.length;

    const sumB = b.items.reduce((total, i) => total + (parseFloat(i.item_price) || 0), 0);
    const avgB = sumB / b.items.length;

    return avgA - avgB;
  });

  // --- CAROUSEL ARROWS ---
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 310, behavior: "smooth" });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrows();
    }, 10);
    return () => clearTimeout(timer);
  }, [localData, selectedRestaurant, updateArrows]);

  // --- DASHBOARD: filter to selected restaurant only ---
  const dashboardData = selectedRestaurant
    ? [...localData.filter(item => item.zip_and_address === selectedRestaurant)].sort((a, b) => {
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
      })
    : finalDataToRender;

  // --- BUTTON LABEL LOGIC ---
  const getScanButtonLabel = () => {
    if (loading) return "Scanning... (~20-50 seconds)";
    if (isChecking) return "Checking limits...";
    if (!canScrape) return "Daily Limit Reached";
    return "Initialize Scan";
  };

// --- FINAL FILTERING LOGIC APPLIED TO DASHBOARD DATA (after sorting) ---
const finalFilteredData = dashboardData.filter((item) => {
  
  const matchesName = filterName === "" || 
    item.item_name.toLowerCase().includes(filterName.toLowerCase());

  const matchesLocation = filterLocation === "" || 
    item.zip_and_address.toLowerCase().includes(filterLocation.toLowerCase());

  const matchesPrice = filterMaxPrice === "" || 
    parseFloat(item.item_price) <= parseFloat(filterMaxPrice);

  const matchesCalories = filterMaxCalories === "" || 
    parseFloat(item.item_cal) <= parseFloat(filterMaxCalories);

  return matchesName && matchesLocation && matchesPrice && matchesCalories;
});

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">

        {/* --- THE COMMAND CENTER --- */}
        <div className="text-center mb-8 w-full max-w-4xl mx-auto">
          <h2
            className="shadow-md shadow-orange-500 text-center text-6xl text-black p-12 aspect-10/2 rounded-2xl overflow-hidden
            bg-[url('https://images.unsplash.com/photo-1611915365928-565c527a0590?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')]
            bg-cover bg-[60%_20%] bg-no-repeat max-w-full h-auto">
          </h2>

          <p className="pt-8 my-3 font-serif text-xl text-slate-800">Scanning Tool</p>
          <form onSubmit={runScraper} className="flex justify-center items-center flex-wrap gap-3">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter a 5 Digit ZIP Code"
              required
              disabled={loading || statusMsg.text !== ""}
              className="w-64 bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"/>

            {localData.length === 0 && statusMsg.text === "" && (
              <button
                type="submit"
                disabled={loading || isChecking || !canScrape}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                {getScanButtonLabel()}
              </button>
            )}

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

          {/* --- SCRAPE LIMIT INDICATOR --- */}
          <div className="mt-3 h-5">
            {isChecking && (
              <p className="text-xs text-slate-400">Verifying scan limit...</p>
            )}
            {!isChecking && canScrape && remainingScrapes !== null && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-orange-500">{remainingScrapes}</span> scan{remainingScrapes !== 1 ? 's' : ''} remaining today
              </p>
            )}
            {!isChecking && !canScrape && (
              <p className="text-xs text-red-500 font-medium">
                Daily scan limit reached. Resets tomorrow.
              </p>
            )}
          </div>
        </div>

        {/* --- STATUS MESSAGES --- */}
        {statusMsg.text && (
          <div className={"text-center my-6 p-4 rounded-xl shadow-sm " + (statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
            {statusMsg.text}
          </div>
        )}

        {/* --- RESTAURANT CARDS (shown when data is loaded and no card is selected) --- */}
        {localData.length > 0 && !selectedRestaurant && (
          <div className="mb-8">
            <p className="text-sm text-slate-500 mb-4 text-center">Click a restaurant to view its full menu</p>

            <div className="relative">
              {/* Left arrow */}
              <button
                onClick={() => scrollBy(-1)}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={"absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 shadow-lg " + (canScrollLeft ? "bg-white border-slate-300 text-slate-700 hover:bg-orange-500 hover:border-orange-500 hover:text-white active:scale-90" : "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Scrollable card row */}
              <div
                ref={scrollRef}
                onScroll={updateArrows}
                className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {restaurantCards.map((restaurant, index) => {
                  const sum = restaurant.items.reduce((total, i) => total + (parseFloat(i.item_price) || 0), 0);
                  const averagePrice = sum / restaurant.items.length;
                  return (
                    <div key={restaurant.zip_and_address} className="snap-start shrink-0 w-72">
                      <div className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-orange-300 transition-all duration-200 h-full">

                        {/* Clickable header */}
                        <button
                          onClick={() => {
                            setSortConfig({ key: null, direction: 'asc' });
                            setSelectedRestaurant(restaurant.zip_and_address);
                            setWebsiteLink("https://littlecaesars.com/en-us/order/pickup/stores/" + restaurant.items[0].store_id + "/menu/");
                          }}
                          className="text-left w-full bg-orange-500 px-4 pt-4 pb-3 border-b border-orange-600 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <p className="text-sm font-bold text-white truncate group-hover:text-orange-100 transition-colors leading-snug">
                              {restaurant.zip_and_address}
                            </p>
                            <svg className="w-3.5 h-3.5 text-orange-200 group-hover:text-white transition-colors ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                          <p className="text-xs text-orange-100">
                            Avg <span className="font-bold text-white">${averagePrice.toFixed(2)}</span> · {restaurant.items.length} items
                          </p>
                        </button>

                        {/* Menu item preview */}
                        <div className="flex-1 px-4 py-2 overflow-y-auto max-h-52">
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1 mt-1">Menu Preview</p>
                          {restaurant.items.slice(0, 4).map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{item.item_name}</p>
                                <p className="text-xs text-slate-400">{item.item_cal} kcal</p>
                              </div>
                              <span className="text-xs font-bold text-orange-500 shrink-0">${item.item_price}</span>
                            </div>
                          ))}
                          {restaurant.items.length > 4 && (
                            <p className="text-xs text-slate-400 text-center pt-1">+{restaurant.items.length - 4} more items</p>
                          )}
                        </div>

                        {/* Website link */}
                        <div className="px-4 py-3 border-t border-slate-100">
                          <a
                            href={"https://littlecaesars.com/en-us/order/pickup/stores/" + restaurant.items[0].store_id + "/menu/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                            </svg>
                            <span>Order from this location</span>
                            <svg className="w-3 h-3 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                            </svg>
                          </a>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollBy(1)}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={"absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 shadow-lg " + (canScrollRight ? "bg-white border-slate-300 text-slate-700 hover:bg-orange-500 hover:border-orange-500 hover:text-white active:scale-90" : "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* --- DASHBOARD (shown when a card is clicked) --- */}
        {localData.length > 0 && selectedRestaurant && (
          <div>

            {/* Back button + restaurant label */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  setSortConfig({ key: null, direction: 'asc' });
                  setFilterName("");
                  setFilterMaxPrice("");
                  setFilterMaxCalories("");
                }}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors group">
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to restaurants
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <span className="text-sm font-semibold text-slate-700 truncate">{selectedRestaurant}</span>
            </div>

            {/* Website link */}
            <div className="px-4 py-3 border-t border-slate-100">
              <a
                href={websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                </svg>
                <span>Order from this location</span>
                <svg className="w-3 h-3 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>

            {/* THE FILTER PANEL */}
            <div className="bg-orange-500 p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Search Parameters</h3>
                <span className="text-sm font-medium text-black bg-orange-400 px-3 py-1 rounded-full">
                  Showing {dashboardData.length} of {localData.filter(i => i.zip_and_address === selectedRestaurant).length}
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
                    {finalFilteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-orange-400 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-black">{item.zip_and_address}</td>
                        <td className="px-6 py-4 text-sm text-black">{item.item_name}</td>
                        <td className="px-6 py-4 text-sm text-black">{item.item_cal} kcal</td>
                        <td className="px-6 py-4 text-sm text-black">${item.item_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {dashboardData.length === 0 && (
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