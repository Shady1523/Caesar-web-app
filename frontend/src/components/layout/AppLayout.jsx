import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BrandMark, NavIcon } from "../icons/Icons.jsx";

const themes = [
  { id: "slice", label: "Ember", color: "#f45a00" },
  { id: "midnight", label: "Signal", color: "#5b7cfa" },
  { id: "grove", label: "Grove", color: "#23856d" },
];

export default function AppLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("slice");
  const navClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Market Scout home">
          <BrandMark />
          <span>LC<span>TRACKER</span></span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavLink to="/" className={navClass} end>
            <NavIcon type="scraper" /> Run a Scan
          </NavLink>
          <NavLink to="/stores/" className={navClass}>
            <NavIcon type="database" /> Database
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
          <div className="system-status"><i /> Switch Theme</div>
          <button className="menu-button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-label="Toggle navigation">
            <span /><span />
          </button>
        </div>
      </header>

      {isOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/" className={navClass} end onClick={() => setIsOpen(false)}>
            <NavIcon type="scraper" /> Run a Scan
          </NavLink>
          <NavLink to="/stores/" className={navClass} onClick={() => setIsOpen(false)}>
            <NavIcon type="database" /> Database
          </NavLink>
        </nav>
      )}

      {children}

      <footer className="site-footer">
        <span>Built with Python's Django</span>
        <span>Scripted with Playwright<i /></span>
      </footer>
    </div>
  );
}