import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Scraper from "./pages/Scraper.jsx";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/stores/" element={<Dashboard />} />
          <Route path="/" element={<Scraper />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;