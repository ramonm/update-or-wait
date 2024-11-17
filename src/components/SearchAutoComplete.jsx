// src/components/SearchAutocomplete.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const SearchAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  isLoading, 
  disabled, 
  apiUrl,
  isDark 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimeout = useRef(null);
  const wrapperRef = useRef(null);

  const fetchSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}?suggest=${encodeURIComponent(searchTerm.trim())}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    onChange(value);
    
    // Debounce suggestions
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleKeyDown = (e) => {
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
      handleSuggestionClick(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSelect(suggestion.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search 
          className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2",
            isDark ? "text-gray-500" : "text-gray-400"
          )}
          size={20} 
        />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search device or software (e.g., iOS 17)"
          className={cn(
            "w-full pl-10 pr-4 py-3 rounded-lg border transition-colors duration-200",
            isDark
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500"
              : "bg-white border-gray-300 focus:ring-blue-500"
          )}
          disabled={disabled}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={cn(
          "absolute z-10 w-full mt-1 rounded-lg shadow-lg",
          isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        )}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              onClick={() => handleSuggestionClick(suggestion)}
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
              <span>{suggestion.name}</span>
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
  );
};

export default SearchAutocomplete;