import { useState } from 'react'; // Added useState
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import Scraper from './Scraper';

function App() {
  // State to track if the mobile menu is open or closed
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BrowserRouter>
      {/* The Navigation Bar */}
      <div className="min-h-full">
        <nav className="bg-orange-400">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              <div className="flex items-center">
                  <div className="shrink-0 text-orange-900 font-bold text-2xl">
                    <h1>LCPIZZA TRACKER</h1>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      <Link to="/stores/" className="shadow hover:shadow-md bg-orange-500 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 hover:text-white">DATABASE</Link>
                      <Link to="/" className="shadow hover:shadow-md bg-orange-500 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 hover:text-white">SCRAPER</Link>
                    </div>
                  </div>
              </div>

              <div className="md:hidden">
                <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className="text-white text-2xl font-bold p-2 focus:outline-none"
                >
                  {isOpen ? '✕' : '☰'}
                </button>
              </div>

            </div>
          </div>

          {/* MOBILE DROPDOWN MENU - Only shows on mobile when button is clicked */}
          {isOpen && (
            <div className="md:hidden px-4 pb-4 pt-2 flex flex-col space-y-3 border-t border-orange-500">
              <Link 
                to="/stores/" 
                onClick={() => setIsOpen(false)}
                className="shadow hover:shadow-md bg-orange-500 rounded-md px-3 py-3 text-base font-medium text-white text-center hover:bg-orange-600 hover:text-white"
              >
                DATABASE
              </Link>
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="shadow hover:shadow-md bg-orange-500 rounded-md px-3 py-3 text-base font-medium text-white text-center hover:bg-orange-600 hover:text-white"
              >
                SCRAPER
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* The Dynamic Content Area */}
      <div className="DynamicContent">
        <Routes>
          <Route path="/stores/" element={<Dashboard />} />
          <Route path="/" element={<Scraper />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;