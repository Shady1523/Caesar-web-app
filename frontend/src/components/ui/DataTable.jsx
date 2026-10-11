export default function DataTable({ data, sortConfig, handleSort, visibleCount }) {
  const displayData = visibleCount ? data.slice(0, visibleCount) : data;

  const renderSortArrow = (key) => {
    return sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '';
  };

  return (
    <div className="data-panel bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-orange-600 border-b border-black select-none">
            <tr>
              {['zip_and_address', 'item_name', 'item_cal', 'item_price'].map((key) => (
                <th key={key} onClick={() => handleSort(key)} className="px-6 py-3 text-xs font-semibold text-black uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors">
                  <div className="flex items-center gap-1">
                    {key.replace('zip_and_address', 'Location').replace('item_name', 'Item Name').replace('item_cal', 'Calories').replace('item_price', 'Price')} {renderSortArrow(key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-orange-500">
            {displayData.map((item, index) => (
              <tr key={index} className="hover:bg-orange-400 transition-colors duration-200">
                <td className="px-6 py-4 text-sm text-black">{item.zip_and_address}</td>
                <td className="px-6 py-4 text-sm text-black">{item.item_name}</td>
                <td className="px-6 py-4 text-sm text-black">{item.item_cal} kcal</td>
                <td className="px-6 py-4 text-sm text-black">${item.item_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayData.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-b-xl border-t border-slate-200">
            <p>No items found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}