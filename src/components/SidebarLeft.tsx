import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Activity,
  Thermometer,
  CloudRain,
  Waves,
  Sprout,
  Flame,
  Users,
  Wind,
  Plus,
  Trash2,
  Compass,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { LocationReport, ClimateLayer } from "../types";
import { layersConfig, generateClimateReportForCoordinate } from "../data";

interface SidebarLeftProps {
  selectedLayer: ClimateLayer;
  setSelectedLayer: (layer: ClimateLayer) => void;
  selectedLocation: LocationReport | null;
  onLocationSelect: (report: LocationReport) => void;
  savedLocations: LocationReport[];
  onAddSavedLocation: (report: LocationReport) => void;
  onRemoveSavedLocation: (id: string) => void;
}

export default function SidebarLeft({
  selectedLayer,
  setSelectedLayer,
  selectedLocation,
  onLocationSelect,
  savedLocations,
  onAddSavedLocation,
  onRemoveSavedLocation,
}: SidebarLeftProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-search logic using Google Maps Geocoder if available, or Nominatim
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        triggerGeocoding(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const triggerGeocoding = async (query: string) => {
    // 1. Parse manual coordinates (e.g., "-12.34, 45.56")
    const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;
    const match = query.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setSearchResults([
          {
            name: `Grid [${lat.toFixed(3)}, ${lng.toFixed(3)}]`,
            country: "Manual Coordinates",
            display: `Latitude: ${lat}, Longitude: ${lng}`,
            lat,
            lng,
          },
        ]);
        return;
      }
    }

    setIsSearching(true);

    // 2. Try Google Maps Geocoder if loaded, otherwise fall back to Nominatim OSM API
    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === "OK" && results) {
          const mapped = results.map((item) => {
            const lat = item.geometry.location.lat();
            const lng = item.geometry.location.lng();
            return {
              name: item.formatted_address.split(",")[0],
              country: item.formatted_address.split(",").slice(-1)[0].trim(),
              display: item.formatted_address,
              lat,
              lng,
            };
          });
          setSearchResults(mapped);
          setIsSearching(false);
        } else {
          fallbackOSM(query);
        }
      });
    } else {
      fallbackOSM(query);
    }
  };

  const fallbackOSM = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          name: item.display_name.split(",")[0],
          country: item.display_name.split(",").slice(-1)[0].trim(),
          display: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn("Geocoding service error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const report = generateClimateReportForCoordinate(item.lat, item.lng, item.name);
    onLocationSelect(report);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getLayerEmoji = (id: ClimateLayer) => {
    switch (id) {
      case "aqi":
        return "🍃";
      case "temperature":
        return "🌡️";
      case "rainfall":
        return "🌧️";
      case "flood":
        return "🌊";
      case "ndvi":
        return "🌿";
      case "wildfire":
        return "🔥";
      case "population":
        return "👥";
      case "wind":
        return "💨";
      default:
        return "🌐";
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 text-[#0F172A] pr-1 select-none">
      
      {/* 🔍 SEARCH LOCATION BOX */}
      <div className="relative bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 flex flex-col gap-2 shrink-0">
        <label className="text-[10px] font-mono tracking-widest uppercase text-[#047857] font-extrabold flex items-center justify-between">
          <span className="flex items-center gap-1.5">🔍 SEARCH LOCATION</span>
          {isSearching && <RefreshCw className="w-3 h-3 text-[#047857] animate-spin" />}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#475569]" />
          <input
            type="text"
            placeholder="City, coordinates, river, forest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-8 text-xs font-sans text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] transition-all"
          />
        </div>

        {/* Dynamic Dropdown Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-18 left-0 right-0 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden mt-1 max-h-56 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectSearchResult(item)}
                className="w-full text-left p-3 hover:bg-[#ECFDF5] text-xs border-b border-[#E2E8F0] transition-all flex items-center justify-between cursor-pointer text-[#0F172A]"
              >
                <div className="truncate pr-4">
                  <div className="font-semibold text-[#0F172A] truncate">{item.name}</div>
                  <div className="text-[#047857] text-[10px] truncate mt-0.5">
                    {item.display || item.country}
                  </div>
                </div>
                <Compass className="w-4 h-4 text-[#06B6D4] shrink-0 opacity-80" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 📍 SAVED LOCATIONS */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 flex flex-col gap-2 shrink-0 max-h-[190px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#047857] font-extrabold flex items-center gap-1.5">
            📍 SAVED LOCATIONS
          </span>
          {selectedLocation && !savedLocations.some(l => l.id === selectedLocation.id) && (
            <button
              onClick={() => onAddSavedLocation(selectedLocation)}
              className="text-[10px] text-[#047857] hover:text-[#065F46] font-bold flex items-center gap-0.5 cursor-pointer bg-[#ECFDF5] hover:bg-[#D1FAE5] px-2.5 py-1 rounded-full border border-[#10B981]/30 transition-all"
              title="Save current location"
            >
              <Plus className="w-3 h-3" /> Save current
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-[130px]">
          {savedLocations.length === 0 ? (
            <div className="text-center py-4 text-xs text-[#475569] font-medium">
              No saved spots yet. Search and click "Save current" to save places.
            </div>
          ) : (
            savedLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <div
                  key={loc.id}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? "bg-[#ECFDF5] border-[#10B981] text-[#047857] shadow-xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-[#ECFDF5]/50"
                  }`}
                >
                  <button
                    onClick={() => onLocationSelect(loc)}
                    className="flex-1 text-left truncate font-medium cursor-pointer"
                  >
                    <div className="truncate text-[11px] font-semibold">{loc.name}</div>
                    <div className="text-[9px] text-[#475569] truncate">{loc.country}</div>
                  </button>
                  <button
                    onClick={() => onRemoveSavedLocation(loc.id)}
                    className="p-1 text-[#475569] hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Delete saved spot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🛰 MAP LAYERS Overlays */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 flex flex-col gap-2 flex-1 overflow-hidden">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#047857] font-extrabold flex items-center gap-1.5">
          🛰️ WEATHER LAYERS
        </span>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {layersConfig.map((layer) => {
            const isActive = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                id={`layer-btn-${layer.id}`}
                onClick={() => setSelectedLayer(layer.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 text-left group cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#ECFDF5] via-[#ECFDF5]/80 to-white border-[#10B981] text-[#047857] shadow-xs"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#ECFDF5]/50 hover:text-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`text-base p-1.5 rounded-xl transition-all ${
                      isActive ? "bg-[#ECFDF5] border border-[#10B981]/30" : "bg-white border border-[#E2E8F0]"
                    }`}
                  >
                    {getLayerEmoji(layer.id)}
                  </div>
                  <span className="tracking-wide text-[11px] font-bold">{layer.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  <span className={isActive ? "text-[#047857] font-bold" : "text-[#475569]"}>{layer.unit}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-[#E2E8F0]"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
