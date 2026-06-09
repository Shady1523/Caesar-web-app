import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import Scraper from './Scraper';

function App() {
  return (
    <BrowserRouter>
      {/* The Navigation Bar */}
      <nav className="bg-slate-800 p-4 text-white flex gap-6 shadow-md">
        <h1 className="font-bold text-xl mr-4">🍕 PizzaTracker</h1>
        <Link to="/" className="hover:text-red-400 font-medium">Database</Link>
        <Link to="/scrape" className="hover:text-red-400 font-medium">Run Scraper</Link>
      </nav>

      {/* The Dynamic Content Area */}
      <div className="p-8 bg-slate-50 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scrape" element={<Scraper />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
