import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Scraper from "./pages/Scraper";

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