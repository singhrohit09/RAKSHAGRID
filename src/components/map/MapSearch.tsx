/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { GeocodingService } from '../../services/geospatial/geocoding.service';
import { GeocodeResult } from '../../types/geospatial';

interface MapSearchProps {
  onSelectLocation: (result: GeocodeResult) => void;
}

export const MapSearch: React.FC<MapSearchProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await GeocodingService.searchLocation(query);
        setResults(hits);
        setIsOpen(hits.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: GeocodeResult) => {
    setQuery(item.displayName.split(',')[0]);
    setIsOpen(false);
    onSelectLocation(item);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location, district, river basin..."
          className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl pl-9 pr-9 py-2 text-xs text-[#171B19] placeholder-[#777D77] focus:outline-none focus:border-[#315C46] focus:bg-white shadow-xs transition"
        />
        <Search className="w-4 h-4 text-[#777D77] absolute left-3 top-2.5 pointer-events-none" />
        {loading ? (
          <Loader2 className="w-4 h-4 text-[#315C46] animate-spin absolute right-3 top-2.5" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-2.5 text-[#777D77] hover:text-[#171B19]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E4E3DC] rounded-xl shadow-lg overflow-hidden z-[1000] max-h-64 overflow-y-auto">
          {results.map((res) => (
            <button
              key={res.placeId}
              type="button"
              onClick={() => handleSelect(res)}
              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F5F4EF] border-b border-[#E4E3DC] last:border-b-0 flex items-start gap-2.5 transition"
            >
              <MapPin className="w-4 h-4 text-[#315C46] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#171B19] truncate font-sans">
                  {res.displayName.split(',')[0]}
                </div>
                <div className="text-[11px] text-[#777D77] truncate">
                  {res.displayName}
                </div>
                <div className="text-[10px] font-mono text-[#777D77] mt-0.5">
                  Lat: {res.coordinates.lat.toFixed(4)}, Lng: {res.coordinates.lng.toFixed(4)}
                </div>
              </div>
            </button>
          ))}
          <div className="p-2 bg-[#F5F4EF] text-[10px] text-[#777D77] text-center border-t border-[#E4E3DC]">
            Data © OpenStreetMap contributors (ODbL)
          </div>
        </div>
      )}
    </div>
  );
};
