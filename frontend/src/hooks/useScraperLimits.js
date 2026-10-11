import { useState, useEffect, useCallback } from 'react';

export function useScraperLimits() {
  const [canScrape, setCanScrape] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [remainingScrapes, setRemainingScrapes] = useState(null);

  const refreshScrapeStatus = useCallback(() => {
    setIsChecking(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/check_scrape_status/`)
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(data => {
        setCanScrape(data.can_scrape);
        setRemainingScrapes(data.remaining_scrapes);
      })
      .catch(err => {
        console.error("Could not verify scrape limit:", err);
        setCanScrape(true);
        setRemainingScrapes(null);
      })
      .finally(() => setIsChecking(false));
  }, []);

  useEffect(() => { refreshScrapeStatus(); }, [refreshScrapeStatus]);

  return { canScrape, isChecking, remainingScrapes, refreshScrapeStatus };
}