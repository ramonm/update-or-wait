import React, { useState } from 'react';
import { Search, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/Alert';
import { Button } from './components/ui/Button';
import { cn } from './lib/utils';

// Mock database - in production, this would come from your backend
const mockData = {
  'ios 17': { up: 856, down: 234, verdict: 'UPDATE', lastUpdated: '2024-03-17' },
  'windows 11': { up: 445, down: 678, verdict: 'WAIT', lastUpdated: '2024-03-16' },
  'android 14': { up: 567, down: 123, verdict: 'UPDATE', lastUpdated: '2024-03-15' },
};

const App = () => {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = search.toLowerCase().trim();
    
    if (searchTerm in mockData) {
      setResult(mockData[searchTerm]);
      setMessage('');
    } else {
      setResult(null);
      setMessage('No data found for this device/software. Be the first to vote!');
    }
  };

  const handleVote = (voteType) => {
    setIsVoting(true);
    // In production, this would be an API call
    setTimeout(() => {
      if (result) {
        const updatedResult = { ...result };
        if (voteType === 'up') {
          updatedResult.up += 1;
        } else {
          updatedResult.down += 1;
        }
        // Recalculate verdict
        updatedResult.verdict = updatedResult.up > updatedResult.down ? 'UPDATE' : 'WAIT';
        setResult(updatedResult);
      }
      setIsVoting(false);
    }, 500);
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
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search device or software (e.g., iOS 17)"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
          >
            Check Status
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
                  <span>{result.up}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="text-red-600" />
                  <span>{result.down}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Last updated: {result.lastUpdated}
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
                Vote Safe
              </Button>
              <Button
                onClick={() => handleVote('down')}
                variant="outline"
                className="flex-1 bg-red-100 hover:bg-red-200"
                disabled={isVoting}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Vote Wait
              </Button>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {message && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Results Found</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default App;