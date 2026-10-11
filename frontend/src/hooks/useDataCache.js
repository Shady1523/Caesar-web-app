import { useState, useCallback, useEffect } from 'react';

export function useDataCache() {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const loadData = useCallback(async () => {
    const cachedData = sessionStorage.getItem('dashboardData');
    const cachedVersion = sessionStorage.getItem('dashboardVersion');

    if (cachedData) {
      setAllData(JSON.parse(cachedData));
      setCacheHit(true);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const versionRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/db_version/`);
      if (versionRes.ok) {
        const versionData = await versionRes.json();
        const latestVersion = String(versionData.latest_scraped_at);

        if (latestVersion !== cachedVersion) {
          setIsLoading(true);
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stores/`);
          const data = await response.json();
          const allResults = data.results || data;

          setAllData(allResults);
          setCacheHit(false);
          sessionStorage.setItem('dashboardData', JSON.stringify(allResults));
          sessionStorage.setItem('dashboardVersion', latestVersion);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const versionRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/db_version/`);
      if (versionRes.ok) {
        const versionData = await versionRes.json();
        const serverVersion = String(versionData.latest_scraped_at);
        const localVersion = sessionStorage.getItem('dashboardVersion');

        if (serverVersion && localVersion === serverVersion) {
          setStatusMsg({ text: "Your data is already up to date!", type: "info" });
          setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
          setIsLoading(false);
          return;
        }
      }
      sessionStorage.removeItem('dashboardData');
      sessionStorage.removeItem('dashboardVersion');
      await loadData();
      setStatusMsg({ text: "Successfully updated with the latest data!", type: "success" });
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  return { allData, isLoading, cacheHit, statusMsg, handleRefresh };
}