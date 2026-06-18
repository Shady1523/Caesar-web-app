import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import Scraper from './Scraper';

function App() {
  return (
    <BrowserRouter>
      {/* The Navigation Bar */}
      <div className="min-h-full">
        <nav className="bg-orange-400">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              <div className="flex items-center">
                  <div className="shrink-0 text-white text-shadow-[2px_2px_2px_rgba(0,0,0,0.75)]">
                    <h1>LCPIZZA TRACKER</h1>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      <Link to="/" className="shadow hover:shadow-md bg-orange-500 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 hover:text-white">DATABASE</Link>
                      <Link to="/scrape" className="shadow hover:shadow-md bg-orange-500 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 hover:text-white">SCRAPER</Link>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </nav>
      </div>

      {/* The Dynamic Content Area */}
      <div className="DynamicContent">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scrape" element={<Scraper />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
