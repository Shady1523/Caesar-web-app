import { useState, useEffect } from 'react';

export default function ProgressBar({ loading }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 95 ? 95 : prev + 1));
      }, 420);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="w-[90%] sm:w-full max-w-4xl mx-auto bg-slate-200 rounded-full h-3 mb-6 overflow-hidden shadow-inner">
      <div 
        className="bg-orange-500 h-3 rounded-full transition-all duration-450 ease-out" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}