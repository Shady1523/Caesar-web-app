import { useState, useCallback, useEffect } from 'react';

export function useScraperSocket(refreshScrapeStatus) {
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [lastPong, setLastPong] = useState(Date.now());
  const [zipCode, setZipCode] = useState("");

  // Memory Recovery
  useEffect(() => {
    const savedData = sessionStorage.getItem('scrapedData');
    const savedZip = sessionStorage.getItem('lastZip');
    const savedMsg = sessionStorage.getItem('statusMsg');

    if (savedData) {
      setLocalData(JSON.parse(savedData));
      setZipCode(savedZip || "");
      if (savedMsg) setStatusMsg(JSON.parse(savedMsg));
    }
  }, []);

  const runScraper = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: "Processing request...", type: "" });
    setLocalData([]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_code: zipCode })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to scrape the area.");

      const taskId = data.task_id;
      setStatusMsg({ text: 'Scraping in background... Please wait.', type: "" });

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const wsUrl = `${apiBaseUrl.replace(/^http/, 'ws')}/ws/scrape/${taskId}/`;
      
      const ws = new WebSocket(wsUrl);
      let pingInterval;

      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
        }, 30000);
      };

      ws.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);

        if (parsedData.type === 'pong') {
          setLastPong(Date.now());
          return;
        }

        if (parsedData.data.error) {
          setStatusMsg({ text: `Scraping failed: ${parsedData.data.error}`, type: "error" });
        } else {
          const newResults = parsedData.data.results || [];
          const successMsg = {
            text: parsedData.data.message || `Successfully scraped area ${zipCode}. Found ${newResults.length} items.`,
            type: "success"
          };

          setLocalData(newResults);
          setStatusMsg(successMsg);
          sessionStorage.setItem('scrapedData', JSON.stringify(newResults));
          sessionStorage.setItem('lastZip', zipCode);
          sessionStorage.setItem('statusMsg', JSON.stringify(successMsg));
          if (refreshScrapeStatus) refreshScrapeStatus();
        }

        setLoading(false);
        clearInterval(pingInterval);
        ws.close();
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error: ", error);
        setStatusMsg({ text: "WebSocket connection failed.", type: "error" });
        setLoading(false);
        clearInterval(pingInterval);
        ws.close();
      };

    } catch (error) {
      setStatusMsg({ text: error.message || "Error connecting to the scraper backend.", type: "error" });
      setLoading(false); 
    }
  };

  const clearData = () => {
    setLocalData([]);
    setZipCode("");
    setStatusMsg({ text: "", type: "" });
    sessionStorage.removeItem('scrapedData');
    sessionStorage.removeItem('lastZip');
    sessionStorage.removeItem('statusMsg');
  };

  return { zipCode, setZipCode, localData, loading, statusMsg, runScraper, clearData };
}