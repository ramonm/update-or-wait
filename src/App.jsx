import React, { useState } from 'react';
import { Search, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
// Update these imports to use relative paths
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.jsx';
import { Button } from '@/components/ui/Button/index.jsx';
import { cn } from '@/lib/utils.js';

const App = () => {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/updates?search=${encodeURIComponent(search.trim())}`
      );
      const data = await response.json();

      if (response.ok && !data.error) {
        setResult(data);
      } else {
        setResult(null);
        setMessage(data.error || 'No data found for this device/software. Be the first to vote!');
      }
    } catch (error) {
      setMessage('Error searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!result?.name || isVoting) return;
    
    setIsVoting(true);
    try {
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: result.name,
          voteType
        }),
      });

      const data = await response.json();
      
      if (response.ok && !data.error) {
        setResult(data);
      } else {
        setMessage('Error updating vote. Please try again.');
      }
    } catch (error) {
      setMessage('Error updating vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Update or Wait?</h1>
          <p className="mt-2 text-gray-600">
            Find out if you should update your device or software
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Examples: iOS 18, Windows 11, Android 14, macOS Sonoma
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative space-y-2">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={20} 
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search device or software (e.g., iOS 17)"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Check Status'}
          </Button>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className={cn(
              "text-center p-6 rounded-lg",
              result.verdict === 'UPDATE' ? 'bg-green-100' : 'bg-yellow-100'
            )}>
              <h2 className="text-2xl font-bold mb-2">
                {result.verdict === 'UPDATE' ? 'Safe to Update! ✅' : 'Better Wait! ⚠️'}
              </h2>
              <div className="flex justify-center gap-8 text-gray-700">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="text-green-600" />
                  <span>{result.up_votes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="text-red-600" />
                  <span>{result.down_votes}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Last updated: {new Date(result.last_updated).toLocaleDateString()}
              </div>
            </div>

            {/* Voting buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => handleVote('up')}
                variant="outline"
                className="flex-1 bg-green-100 hover:bg-green-200"
                disabled={isVoting}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                {isVoting ? 'Voting...' : 'Vote Safe'}
              </Button>
              <Button
                onClick={() => handleVote('down')}
                variant="outline"
                className="flex-1 bg-red-100 hover:bg-red-200"
                disabled={isVoting}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                {isVoting ? 'Voting...' : 'Vote Wait'}
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {message && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default App;