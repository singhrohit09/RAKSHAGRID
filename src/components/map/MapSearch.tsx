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
          placeholder="Search location, region, river basin..."
          className="w-full bg-[#12171e]/90 backdrop-blur border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-lg"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        {loading ? (
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute right-3 top-2.5" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f141c] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[1000] max-h-64 overflow-y-auto">
          {results.map((res) => (
            <button
              key={res.placeId}
              type="button"
              onClick={() => handleSelect(res)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/80 border-b border-slate-800 last:border-b-0 flex items-start gap-2.5 transition"
            >
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-200 truncate font-sans">
                  {res.displayName.split(',')[0]}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {res.displayName}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                  Lat: {res.coordinates.lat.toFixed(4)}, Lng: {res.coordinates.lng.toFixed(4)}
                </div>
              </div>
            </button>
          ))}
          <div className="p-1.5 bg-slate-900/90 text-[9px] font-mono text-slate-400 text-center border-t border-slate-800">
            Data © OpenStreetMap contributors (ODbL)
          </div>
        </div>
      )}
    </div>
  );
};
