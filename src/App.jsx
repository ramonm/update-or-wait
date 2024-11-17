import React, { useState, useEffect, useRef } from 'react';
import { Search, ThumbsUp, ThumbsDown, AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.jsx';
import { Button } from '@/components/ui/Button/index.jsx';
import { cn } from '@/lib/utils.js';
import { useTheme } from './contexts/ThemeContext';

const API_URL = 'https://update-or-wait.ramon-m.workers.dev';

const cleanUrlSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const uncleanUrlSlug = (slug) => {
  return slug.replace(/-/g, ' ');
};

const App = () => {
  const { isDark, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState({ up: false, down: false });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);

  const hasVoted = (itemName) => {
    try {
      const votes = JSON.parse(localStorage.getItem('update-or-wait-votes') || '{}');
      return votes[itemName];
    } catch (error) {
      return false;
    }
  };
  
  const recordVote = (itemName) => {
    try {
      const votes = JSON.parse(localStorage.getItem('update-or-wait-votes') || '{}');
      votes[itemName] = true;
      localStorage.setItem('update-or-wait-votes', JSON.stringify(votes));
    } catch (error) {
      console.error('Error recording vote:', error);
    }
  };

  useEffect(() => {
    const path = window.location.pathname.substring(1);
    if (path) {
      const searchTerm = uncleanUrlSlug(path);
      setSearch(searchTerm);
      handleSearch(null, searchTerm);
    }
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (search.trim()) {
        fetchSuggestions(search);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [search]);

  const fetchSuggestions = async (term) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}?suggest=${encodeURIComponent(term.trim())}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const updateURL = (searchTerm) => {
    const cleanPath = cleanUrlSlug(searchTerm);
    const newUrl = `/${cleanPath}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleSearch = async (e, directSearch = null) => {
    if (e) e.preventDefault();
    const searchTerm = directSearch || search;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setMessage('');
    updateURL(searchTerm.trim());
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `${API_URL}?search=${encodeURIComponent(searchTerm.trim())}`
      );
      
      const data = await response.json();

      if (response.ok && !data.error) {
        setResult(data);
        setMessage('');
      } else {
        setResult(null);
        setMessage(data.error || 'No data found for this device/software. Be the first to vote!');
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('Error searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[highlightedIndex];
      setSearch(selected.name);
      setShowSuggestions(false);
      handleSearch(null, selected.name);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleVote = async (voteType) => {
  if (!result?.name || isVoting) return;
  
  // Check if user has already voted
  if (hasVoted(result.name)) {
    setMessage('You have already voted for this item');
    return;
  }
  
  setIsVoting(true);
  setVoteAnimation({ up: voteType === 'up', down: voteType === 'down' });

  try {
    const response = await fetch(API_URL, {
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
      recordVote(result.name); // Record the vote
      // Show success message
      setMessage('Thank you for your vote!');
      // Clear success message after 2 seconds
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage(data.error || 'Error updating vote. Please try again.');
    }
  } catch (error) {
    console.error('Vote error:', error);
    setMessage('Error updating vote. Please try again.');
  } finally {
    setIsVoting(false);
    setTimeout(() => setVoteAnimation({ up: false, down: false }), 500);
  }
};

  return (
    <div className={cn(
      "min-h-screen py-8 px-4 transition-colors duration-300",
      isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    )}>
      <div className="max-w-md mx-auto space-y-8">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className={cn(
              "rounded-full transition-colors",
              isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100"
            )}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-700" />
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center">
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              // Reset all states
              setSearch('');
              setResult(null);
              setMessage('');
              // Update URL to homepage
              window.history.pushState({}, '', '/');
            }}
            className={cn(
              "text-3xl font-bold transition-all duration-200 cursor-pointer inline-block",
              isDark 
                ? "text-white hover:text-blue-400" 
                : "text-gray-900 hover:text-blue-600",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            Update or Wait?
          </a>
          <p className={cn(
            "mt-2",
            isDark ? "text-gray-300" : "text-gray-600"
          )}>
            Find out if you should update your device or software
          </p>
          <p className={cn(
            "mt-1 text-sm",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            Try: iOS 17, Windows 11, Android 14, macOS Sonoma
          </p>
        </div>

        {/* Search Form */}
<form onSubmit={handleSearch} className="relative space-y-2">
  <div className="relative" ref={searchRef}>
    <Search 
      className={cn(
        "absolute left-3 top-1/2 transform -translate-y-1/2",
        isDark ? "text-gray-500" : "text-gray-400"
      )}
      size={20} 
    />
    <input
      type="text"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setShowSuggestions(true); // Show suggestions when typing
      }}
      onFocus={() => setShowSuggestions(true)}
      onKeyDown={handleKeyDown}
      placeholder="Search device or software (e.g., iOS 17)"
      className={cn(
        "w-full pl-10 pr-4 py-3 rounded-lg border transition-colors duration-200",
        isDark
          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500"
          : "bg-white border-gray-300 focus:ring-blue-500"
      )}
      disabled={isLoading}
    />
    {isLoading && (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )}

    {/* Suggestions Dropdown */}
    {showSuggestions && suggestions.length > 0 && (
      <div className={cn(
        "absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden",
        isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
      )}>
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.name}
            onClick={() => {
              setSearch(suggestion.name);
              setShowSuggestions(false);
              handleSearch(null, suggestion.name);
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
            className={cn(
              "px-4 py-2 cursor-pointer flex justify-between items-center",
              isDark 
                ? "hover:bg-gray-700 text-white" 
                : "hover:bg-gray-100 text-gray-900",
              index === highlightedIndex && (isDark ? "bg-gray-700" : "bg-gray-100"),
              index !== suggestions.length - 1 && "border-b",
              isDark ? "border-gray-700" : "border-gray-100"
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{suggestion.name}</span>
              <span className={cn(
                "text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                {suggestion.up_votes + suggestion.down_votes} votes
              </span>
            </div>
            <span className={cn(
              "text-sm px-2 py-1 rounded",
              suggestion.verdict === 'UPDATE' 
                ? isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"
                : isDark ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800"
            )}>
              {suggestion.verdict}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>

  <Button 
  type="submit" 
  className={cn(
    "w-full py-3 transition-all duration-200 text-white font-medium rounded-lg",
    isLoading
      ? isDark 
        ? "bg-gray-700 cursor-not-allowed" 
        : "bg-gray-400 cursor-not-allowed"
      : isDark
        ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30"
        : "bg-indigo-500 hover:bg-indigo-600 shadow-lg hover:shadow-indigo-500/30",
    "transform hover:-translate-y-0.5 active:translate-y-0"
  )}
  disabled={isLoading}
>
  {isLoading ? (
    <span className="flex items-center justify-center">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Searching...
    </span>
  ) : (
    'Check Status'
  )}
</Button>
</form>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fadeIn">
            <div className={cn(
              "text-center p-6 rounded-lg transform transition-all duration-300",
              result.verdict === 'UPDATE' 
                ? isDark ? 'bg-green-900/50' : 'bg-green-100'
                : isDark ? 'bg-yellow-900/50' : 'bg-yellow-100',
              'hover:scale-[1.02]'
            )}>
              <h2 className={cn(
                "text-2xl font-bold mb-2",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {result.verdict === 'UPDATE' ? 'Safe to Update! ✅' : 'Better Wait! ⚠️'}
              </h2>
              <div className="flex justify-center gap-8 text-gray-700">
                <div className="flex items-center gap-2">
                  <ThumbsUp 
                    className={cn(
                      "transition-transform duration-200",
                      isDark ? "text-green-400" : "text-green-600",
                      voteAnimation.up && "scale-125"
                    )}
                  />
                  <span className={cn(
                    "font-mono",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {result.up_votes}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown 
                    className={cn(
                      "transition-transform duration-200",
                      isDark ? "text-red-400" : "text-red-600",
                      voteAnimation.down && "scale-125"
                    )}
                  />
                  <span className={cn(
                    "font-mono",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {result.down_votes}
                  </span>
                </div>
              </div>
              <div className={cn(
                "mt-2 text-sm",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                Last updated: {new Date(result.last_updated).toLocaleDateString()}
              </div>
            </div>

            {/* Voting buttons */}
            <div className="flex gap-4">
            <Button
  onClick={() => handleVote('up')}
  variant="outline"
  className={cn(
    "flex-1 transition-all duration-200 font-medium",
    isDark
      ? voteAnimation.up 
        ? "bg-green-800 scale-95" 
        : "bg-green-900/50 hover:bg-green-800"
      : voteAnimation.up 
        ? "bg-emerald-200 scale-95" 
        : "bg-emerald-100 hover:bg-emerald-200 border-emerald-200",
    hasVoted(result?.name) && "opacity-50 cursor-not-allowed",
    "transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md"
  )}
  disabled={isVoting || hasVoted(result?.name)}
  title={hasVoted(result?.name) ? "You have already voted" : ""}
>
  <ThumbsUp className={cn(
    "mr-2 h-4 w-4",
    isDark ? "text-emerald-400" : "text-emerald-600"
  )} />
  {isVoting ? 'Voting...' : hasVoted(result?.name) ? 'Voted' : 'Vote Safe'}
</Button>

<Button
  onClick={() => handleVote('down')}
  variant="outline"
  className={cn(
    "flex-1 transition-all duration-200 font-medium",
    isDark
      ? voteAnimation.down 
        ? "bg-red-800 scale-95" 
        : "bg-red-900/50 hover:bg-red-800"
      : voteAnimation.down 
        ? "bg-rose-200 scale-95" 
        : "bg-rose-100 hover:bg-rose-200 border-rose-200",
    hasVoted(result?.name) && "opacity-50 cursor-not-allowed",
    "transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md"
  )}
  disabled={isVoting || hasVoted(result?.name)}
  title={hasVoted(result?.name) ? "You have already voted" : ""}
>
  <ThumbsDown className={cn(
    "mr-2 h-4 w-4",
    isDark ? "text-rose-400" : "text-rose-600"
  )} />
  {isVoting ? 'Voting...' : hasVoted(result?.name) ? 'Voted' : 'Vote Wait'}
</Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {message && (
          <Alert className={cn(
            "animate-fadeIn shadow-lg",
            isDark 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-100 shadow-gray-100/50"
          )}>
            <AlertCircle className={cn(
              "h-4 w-4",
              isDark ? "text-white" : "text-indigo-500"
            )} />
            <AlertTitle className={isDark ? "text-white" : "text-gray-900"}>
              Notice
            </AlertTitle>
            <AlertDescription className={isDark ? "text-gray-300" : "text-gray-600"}>
              {message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default App;