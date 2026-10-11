export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

export function NavIcon({ type }) {
  return (
    <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      {type === "database" ? (
        <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>
      ) : (
        <><path d="m5 7 4 4-4 4M12 17h7" /><rect x="2" y="3" width="20" height="18" rx="3" /></>
      )}
    </svg>
  );
}