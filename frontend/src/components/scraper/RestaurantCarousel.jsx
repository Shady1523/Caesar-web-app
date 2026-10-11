import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

export default function RestaurantCarousel({ localData, onSelectRestaurant }) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);

  const restaurantCards = useMemo(() => {
    return Object.values(
      localData.reduce((acc, item) => {
        const key = item.zip_and_address;
        if (!acc[key]) acc[key] = { zip_and_address: key, items: [] };
        acc[key].items.push(item);
        return acc;
      }, {})
    ).sort((a, b) => {
      const avgA = a.items.reduce((total, i) => total + (parseFloat(i.item_price) || 0), 0) / a.items.length;
      const avgB = b.items.reduce((total, i) => total + (parseFloat(i.item_price) || 0), 0) / b.items.length;
      return avgA - avgB;
    });
  }, [localData]);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 310, behavior: "smooth" });
  };

  useEffect(() => {
    const timer = setTimeout(() => updateArrows(), 10);
    return () => clearTimeout(timer);
  }, [localData, updateArrows]);

  return (
    <div className="mb-8">
      <p className="text-sm text-slate-500 mb-4 text-center">Click a restaurant to view its full menu</p>
      <div className="relative">
        <button
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className={"absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 shadow-lg " + (canScrollLeft ? "bg-white border-slate-300 text-slate-700 hover:bg-orange-500 hover:border-orange-500 hover:text-white active:scale-90" : "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed")}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <div ref={scrollRef} onScroll={updateArrows} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {restaurantCards.map((restaurant, index) => {
            const averagePrice = restaurant.items.reduce((total, i) => total + (parseFloat(i.item_price) || 0), 0) / restaurant.items.length;
            const storeUrl = `https://littlecaesars.com/en-us/order/pickup/stores/${restaurant.items[0].store_id}/menu/`;
            
            return (
              <div key={restaurant.zip_and_address} className="snap-start shrink-0 w-72">
                <div className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-orange-300 transition-all duration-200 h-full">
                  <button
                    onClick={() => onSelectRestaurant(restaurant.zip_and_address, storeUrl)}
                    className="text-left w-full bg-orange-500 px-4 pt-4 pb-3 border-b border-orange-600 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{index + 1}</span>
                      <p className="text-sm font-bold text-white truncate group-hover:text-orange-100 transition-colors leading-snug">{restaurant.zip_and_address}</p>
                      <svg className="w-3.5 h-3.5 text-orange-200 group-hover:text-white transition-colors ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                    <p className="text-xs text-orange-100">Avg <span className="font-bold text-white">${averagePrice.toFixed(2)}</span> · {restaurant.items.length} items</p>
                  </button>

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
                    {restaurant.items.length > 4 && <p className="text-xs text-slate-400 text-center pt-1">+{restaurant.items.length - 4} more items</p>}
                  </div>

                  <div className="px-4 py-3 border-t border-slate-100">
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
                      <span>Order from this location</span>
                      <svg className="w-3 h-3 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className={"absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 shadow-lg " + (canScrollRight ? "bg-white border-slate-300 text-slate-700 hover:bg-orange-500 hover:border-orange-500 hover:text-white active:scale-90" : "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed")}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  );
}