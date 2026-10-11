import { useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard";
import Scraper from "./Scraper";

const themes = [
  { id: "slice", label: "Ember", color: "#f45a00" },
  { id: "midnight", label: "Signal", color: "#5b7cfa" },
  { id: "grove", label: "Grove", color: "#23856d" },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function NavIcon({ type }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {type === "database" ? (
        <>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </>
      ) : (
        <>
          <path d="m5 7 4 4-4 4M12 17h7" />
          <rect x="2" y="3" width="20" height="18" rx="3" />
        </>
      )}
    </svg>
  );
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("slice");
  const navClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <BrowserRouter>
      <div className="app-shell" data-theme={theme}>
        <header className="site-header">
          <NavLink to="/" className="brand" aria-label="Market Scout home">
            <BrandMark />
            <span>
              LC<span>TRACKER</span>
            </span>
          </NavLink>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <NavLink to="/" className={navClass} end>
              <NavIcon type="scraper" />
              Run a Scan
            </NavLink>
            <NavLink to="/stores/" className={navClass}>
              <NavIcon type="database" />
              Database
            </NavLink>
          </nav>

          <div className="header-actions">
            <div className="theme-switcher" aria-label="Choose visual theme">
              {themes.map((item) => (
                <button
                  key={item.id}
                  aria-label={`Use ${item.label} theme`}
                  aria-pressed={theme === item.id}
                  className={theme === item.id ? "selected" : ""}
                  onClick={() => setTheme(item.id)}
                  title={item.label}
                >
                  <span style={{ background: item.color }} />
                </button>
              ))}
            </div>
            <div className="system-status">
              <i />
              Switch Theme
            </div>
            <button
              className="menu-button"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
            >
              <span />
              <span />
            </button>
          </div>
        </header>

        {isOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <NavLink to="/" className={navClass} end onClick={() => setIsOpen(false)}>
              <NavIcon type="scraper" />
              Run a Scan
            </NavLink>
            <NavLink to="/stores/" className={navClass} onClick={() => setIsOpen(false)}>
              <NavIcon type="database" />
              Database
            </NavLink>
          </nav>
        )}

        <Routes>
          <Route path="/stores/" element={<Dashboard />} />
          <Route path="/" element={<Scraper />} />
        </Routes>

        <footer className="site-footer">
          <span>Built with Python's Django</span>
          <span>Scripted with Playwright<i /></span>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
