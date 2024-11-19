// src/components/VotingStats.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Smartphone, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';

const VotingStats = ({ apiUrl, isDark, onSelectUpdate }) => {
  const [trending, setTrending] = useState([]);
  const [popularDevices, setPopularDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [trendingRes, popularRes] = await Promise.all([
          fetch(`${apiUrl}?trending`),
          fetch(`${apiUrl}?popular_devices`)
        ]);
        
        const [trendingData, popularData] = await Promise.all([
          trendingRes.json(),
          popularRes.json()
        ]);

        setTrending(trendingData.trending || []);
        setPopularDevices(popularData.popular || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [apiUrl]);

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {/* Trending Updates */}
      <div className={cn(
        "p-4 rounded-lg border",
        isDark 
          ? "bg-gray-800/50 border-gray-700" 
          : "bg-white border-gray-100"
      )}>
        <h3 className={cn(
          "flex items-center gap-2 text-lg font-semibold mb-3",
          isDark ? "text-white" : "text-gray-900"
        )}>
          <TrendingUp className="h-5 w-5" />
          Trending Updates
        </h3>
        <div className="space-y-2">
          {trending.map((update) => (
            <button
              key={update.name}
              onClick={() => onSelectUpdate(update.name)}
              className={cn(
                "w-full text-left p-2 rounded-md transition-colors",
                isDark 
                  ? "hover:bg-gray-700/50" 
                  : "hover:bg-gray-50",
                "flex items-center justify-between"
              )}
            >
              <span className={isDark ? "text-gray-200" : "text-gray-700"}>
                {update.name}
              </span>
              <span className={cn(
                "text-sm px-2 py-1 rounded",
                update.verdict === 'UPDATE'
                  ? isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"
                  : isDark ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800"
              )}>
                {update.verdict}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Devices */}
      <div className={cn(
        "p-4 rounded-lg border",
        isDark 
          ? "bg-gray-800/50 border-gray-700" 
          : "bg-white border-gray-100"
      )}>
        <h3 className={cn(
          "flex items-center gap-2 text-lg font-semibold mb-3",
          isDark ? "text-white" : "text-gray-900"
        )}>
          <Smartphone className="h-5 w-5" />
          Most Voted Devices
        </h3>
        <div className="space-y-2">
          {popularDevices.map((device) => (
            <div
              key={device.name}
              className={cn(
                "p-2 rounded-md",
                isDark ? "bg-gray-700/50" : "bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-200" : "text-gray-700"}>
                  {device.name}
                </span>
                <span className="text-sm text-gray-500">
                  {device.update_count} updates
                </span>
              </div>
              <div className="mt-1 text-sm">
                <span className={isDark ? "text-green-400" : "text-green-600"}>
                  {device.up_votes} up
                </span>
                <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                  {' · '}
                </span>
                <span className={isDark ? "text-red-400" : "text-red-600"}>
                  {device.down_votes} down
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VotingStats;