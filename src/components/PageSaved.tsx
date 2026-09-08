import React, { useState } from "react";
import { 
  Star, 
  Heart, 
  Pin, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Compass, 
  History, 
  Calendar, 
  MapPin, 
  Thermometer, 
  Activity, 
  ArrowRight, 
  Globe, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Info,
  Scale,
  Brain,
  Sparkles,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocationReport } from "../types";
import GeoPulseLogo from "./GeoPulseLogo";
import { apiFetch } from "../utils/api";

interface PageSavedProps {
  savedLocations: LocationReport[];
  recentSearches: string[];
  onLocationSelect: (loc: LocationReport) => void;
  onRemoveSavedLocation: (id: string) => void;
  onRenameSavedLocation: (id: string, newName: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onClearRecentSearches: () => void;
  setSearchQuery: (q: string) => void;
  setActivePage: (p: string) => void;
  isDarkMode: boolean;
  units?: "metric" | "imperial";
}

// Beautiful, performant SVG Satellite radar GIS preview for each location card
function MapThumbnail({ lat, lng, isDarkMode }: { lat: number; lng: number; isDarkMode: boolean }) {
  return (
    <div id={`map-thumbnail-${lat.toFixed(2)}-${lng.toFixed(2)}`} className={`w-full h-24 rounded-xl border relative overflow-hidden flex items-center justify-center select-none font-mono transition-colors ${
      isDarkMode ? "bg-[#090F1E] border-[rgba(96,165,250,0.12)]" : "bg-slate-100 border-slate-200"
    }`}>
      {/* Grid Pattern */}
      <div className={`absolute inset-0 opacity-[0.05] [background-size:16px_16px] ${
        isDarkMode ? "bg-[radial-gradient(#60a5fa_1px,transparent_1px)]" : "bg-[radial-gradient(#000000_1px,transparent_1px)]"
      }`} />
      
      {/* Target Crosshair lines */}
      <div className={`absolute h-full w-[1px] left-1/2 -translate-x-1/2 ${isDarkMode ? "bg-sky-500/10" : "bg-slate-900/5"}`} />
      <div className={`absolute w-full h-[1px] top-1/2 -translate-y-1/2 ${isDarkMode ? "bg-sky-500/10" : "bg-slate-900/5"}`} />
      
      {/* Radar concentric rings */}
      <div className={`absolute w-12 h-12 rounded-full border ${isDarkMode ? "border-sky-500/10" : "border-blue-500/5"}`} />
      <div className={`absolute w-20 h-20 rounded-full border ${isDarkMode ? "border-sky-500/5" : "border-blue-500/5"}`} />
      
      {/* Target markings */}
      <div className={`absolute top-1.5 left-2 text-[7px] tracking-tight font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
        LAT: {lat.toFixed(4)}
      </div>
      <div className={`absolute top-1.5 right-2 text-[7px] tracking-tight font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
        LNG: {lng.toFixed(4)}
      </div>
      <div className={`absolute bottom-1.5 left-2 text-[6px] tracking-wider ${isDarkMode ? "text-sky-400/40" : "text-sky-600/60"}`}>
        SYS_SAT_INDEX: {Math.abs(Math.round(lat * 10))}
      </div>

      {/* Pulsing center node */}
      <div className="relative flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-sky-500 border border-white shadow-md shadow-sky-500/50 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function PageSaved({
  savedLocations,
  recentSearches,
  onLocationSelect,
  onRemoveSavedLocation,
  onRenameSavedLocation,
  onToggleFavorite,
  onTogglePinned,
  onClearRecentSearches,
  setSearchQuery,
  setActivePage,
  isDarkMode,
  units = "metric"
}: PageSavedProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alpha" | "country">("recent");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Location Comparison states
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [aiCompareLoading, setAiCompareLoading] = useState(false);
  const [aiCompareResult, setAiCompareResult] = useState("");
  const [aiCompareError, setAiCompareError] = useState("");

  const handleGenerateCompareAi = async (locA: LocationReport, locB: LocationReport) => {
    setAiCompareLoading(true);
    setAiCompareError("");
    setAiCompareResult("");
    try {
      const prompt = `You are a Climatology Expert & GIS Analyst. Compare the following two locations side-by-side:
1. ${locA.name}, ${locA.region}, ${locA.country} (Temp: ${locA.telemetry.temperature}°C, Humidity: ${locA.telemetry.humidity}%, AQI: ${locA.telemetry.aqi} [${locA.telemetry.aqiLabel}], Rain Prob: ${locA.telemetry.rainProbability}%, Wind Speed: ${locA.telemetry.windSpeed} km/h, Veg Index (NDVI): ${locA.telemetry.ndvi ?? 0.5})
2. ${locB.name}, ${locB.region}, ${locB.country} (Temp: ${locB.telemetry.temperature}°C, Humidity: ${locB.telemetry.humidity}%, AQI: ${locB.telemetry.aqi} [${locB.telemetry.aqiLabel}], Rain Prob: ${locB.telemetry.rainProbability}%, Wind Speed: ${locB.telemetry.windSpeed} km/h, Veg Index (NDVI): ${locB.telemetry.ndvi ?? 0.5})

Provide an extremely professional, actionable comparison summary in under 120 words. Highlight:
- Atmospheric contrast
- Canopy vegetation (NDVI) differences
- Agricultural or general health suitability of one over another.
Be concise and bulleted. Avoid generic introductory phrases.`;

      const response = await apiFetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          lat: locA.lat,
          lng: locA.lng,
          locationName: locA.name,
          mode: "thinking"
        })
      });

      if (!response.ok) throw new Error("Comparison engine node offline.");
      const data = await response.json();
      setAiCompareResult(data.text || "Comparison summary unavailable.");
    } catch (err: any) {
      setAiCompareError(err.message || "Failed to analyze relative microclimates.");
    } finally {
      setAiCompareLoading(false);
    }
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        // limit to 2
        return [prev[1], id];
      }
      return [...prev, id];
    });
    // Clear previous results on change
    setAiCompareResult("");
    setAiCompareError("");
  };

  // Filter saved locations
  const filtered = savedLocations.filter(loc => {
    const q = localSearch.toLowerCase();
    const name = (loc.customName || loc.name).toLowerCase();
    const region = (loc.region || "").toLowerCase();
    const country = (loc.country || "").toLowerCase();
    return name.includes(q) || region.includes(q) || country.includes(q);
  });

  // Sort: Pinned items are always kept at the top
  const sorted = [...filtered].sort((a, b) => {
    // 1. Pinned status first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 2. Chosen sorting criteria
    if (sortBy === "alpha") {
      const nameA = (a.customName || a.name).toLowerCase();
      const nameB = (b.customName || b.name).toLowerCase();
      return nameA.localeCompare(nameB);
    } else if (sortBy === "country") {
      const countryA = (a.country || "").toLowerCase();
      const countryB = (b.country || "").toLowerCase();
      return countryA.localeCompare(countryB);
    } else {
      // Sort by recently added
      const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
      const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
      return dateB - dateA;
    }
  });

  // Format Temperature consistently
  const formatTemp = (celsius: number) => {
    if (units === "imperial") {
      const fahr = Math.round((celsius * 1.8) + 32);
      return `${fahr}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenameSavedLocation(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  const formatSavedAt = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-8 max-w-6xl mx-auto transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      
      {/* 🌟 Header & Stats summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
            <GeoPulseLogo size={36} showText={false} />
            <span className="text-slate-900 dark:text-white">Saved & Bookmarked Places</span>
          </h1>
          <p className="text-xs mt-1.5 font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            View weather history, manage saved places, and check previous searches.
          </p>
        </div>
        
        {/* Quick stats badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col items-center min-w-[70px]">
            <span className="text-[9px] font-mono font-bold text-slate-400">SAVED</span>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{savedLocations.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col items-center min-w-[70px]">
            <span className="text-[9px] font-mono font-bold text-slate-400">FAVORITES</span>
            <span className="text-xs font-extrabold text-rose-500">{savedLocations.filter(l => l.isFavorite).length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col items-center min-w-[70px]">
            <span className="text-[9px] font-mono font-bold text-slate-400">PINNED</span>
            <span className="text-xs font-extrabold text-amber-500">{savedLocations.filter(l => l.isPinned).length}</span>
          </div>
        </div>
      </div>

      {/* 🔍 Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-4 rounded-2xl shadow-xs transition-all">
        {/* Search bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved locations by name, region, or country..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border rounded-xl py-2 pl-10 pr-4 text-xs font-medium transition-all focus:outline-hidden bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500"
          />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort select row */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase mr-1">Sort By</span>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-0.5">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
                sortBy === "recent" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy("alpha")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
                sortBy === "alpha" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              A-Z
            </button>
            <button
              onClick={() => setSortBy("country")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
                sortBy === "country" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Country
            </button>
          </div>
        </div>
      </div>

      {/* ⚖️ LOCATION COMPARISON MODULE */}
      {compareIds.length > 0 && (
        <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6 rounded-3xl relative overflow-hidden shadow-xs transition-all text-slate-800 dark:text-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Location Comparison Workspace</span>
            </div>
            <button
              onClick={() => {
                setCompareIds([]);
                setAiCompareResult("");
                setAiCompareError("");
              }}
              className="text-xs text-slate-400 hover:text-rose-500 cursor-pointer hover:underline"
            >
              Clear Comparison
            </button>
          </div>

          {compareIds.length === 1 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">1 location selected:</span>{" "}
              {savedLocations.find(l => l.id === compareIds[0])?.name || "Node"}.
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">Select another location from the list below using the ⚖️ icon to initiate side-by-side analytical comparisons.</p>
            </div>
          ) : (
            (() => {
              const locA = savedLocations.find(l => l.id === compareIds[0]);
              const locB = savedLocations.find(l => l.id === compareIds[1]);
              if (!locA || !locB) return null;

              // Calculate cognitive/health scores and weather labels from existing telemetry fields
              const scoreA = Math.round(100 - locA.telemetry.climateRisk);
              const scoreB = Math.round(100 - locB.telemetry.climateRisk);

              const weatherA = locA.telemetry.rainProbability > 50 ? "Rain Showers" : locA.telemetry.temperature > 32 ? "Excessive Heat" : "Optimal Clear";
              const weatherB = locB.telemetry.rainProbability > 50 ? "Rain Showers" : locB.telemetry.temperature > 32 ? "Excessive Heat" : "Optimal Clear";

              return (
                <div className="mt-5 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Location A Block */}
                    <div className="border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 p-4.5 rounded-2xl flex flex-col gap-3 transition-all text-slate-800 dark:text-white">
                      <div>
                        <span className="text-[9px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">Location Alpha</span>
                        <h4 className="text-base font-extrabold mt-0.5 text-slate-950 dark:text-white">{locA.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">LAT: {locA.lat.toFixed(3)}, LNG: {locA.lng.toFixed(3)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5 mt-2">
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">Weather / Climate</span>
                          <span className="text-xs font-bold block mt-1 truncate text-slate-800 dark:text-slate-200">{weatherA}</span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">Temperature</span>
                          <span className="text-xs font-bold block mt-1 text-slate-800 dark:text-slate-200">{formatTemp(locA.telemetry.temperature)}</span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">AQI (Cleanliness)</span>
                          <span className={`text-xs font-bold block mt-1 ${locA.telemetry.aqi < 50 ? "text-emerald-500" : locA.telemetry.aqi < 100 ? "text-amber-500" : "text-rose-500"}`}>
                            {locA.telemetry.aqi} ({locA.telemetry.aqiLabel})
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">Health Score</span>
                          <span className="text-xs font-black block mt-1 font-mono text-slate-950 dark:text-white">{scoreA}/100</span>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between"><span>Rain Probability:</span><span className="font-mono text-slate-800 dark:text-slate-200">{locA.telemetry.rainProbability}%</span></div>
                        <div className="flex justify-between"><span>Humidity index:</span><span className="font-mono text-slate-800 dark:text-slate-200">{locA.telemetry.humidity}%</span></div>
                        <div className="flex justify-between"><span>Wind vectors:</span><span className="font-mono text-slate-800 dark:text-slate-200">{locA.telemetry.windSpeed} km/h</span></div>
                      </div>
                    </div>

                    {/* Location B Block */}
                    <div className="border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 p-4.5 rounded-2xl flex flex-col gap-3 transition-all text-slate-800 dark:text-white">
                      <div>
                        <span className="text-[9px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">Location Beta</span>
                        <h4 className="text-base font-extrabold mt-0.5 text-slate-950 dark:text-white">{locB.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">LAT: {locB.lat.toFixed(3)}, LNG: {locB.lng.toFixed(3)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5 mt-2">
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">Weather / Climate</span>
                          <span className="text-xs font-bold block mt-1 truncate text-slate-800 dark:text-slate-200">{weatherB}</span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">Temperature</span>
                          <span className="text-xs font-bold block mt-1 text-slate-800 dark:text-slate-200">{formatTemp(locB.telemetry.temperature)}</span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">AQI (Cleanliness)</span>
                          <span className={`text-xs font-bold block mt-1 ${locB.telemetry.aqi < 50 ? "text-emerald-500" : locB.telemetry.aqi < 100 ? "text-amber-500" : "text-rose-500"}`}>
                            {locB.telemetry.aqi} ({locB.telemetry.aqiLabel})
                          </span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                          <span className="text-[8px] font-mono uppercase block text-slate-400 dark:text-slate-500">Health Score</span>
                          <span className="text-xs font-black block mt-1 font-mono text-slate-950 dark:text-white">{scoreB}/100</span>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between"><span>Rain Probability:</span><span className="font-mono text-slate-800 dark:text-slate-200">{locB.telemetry.rainProbability}%</span></div>
                        <div className="flex justify-between"><span>Humidity index:</span><span className="font-mono text-slate-800 dark:text-slate-200">{locB.telemetry.humidity}%</span></div>
                        <div className="flex justify-between"><span>Wind vectors:</span><span className="font-mono text-slate-800 dark:text-slate-200">{locB.telemetry.windSpeed} km/h</span></div>
                      </div>
                    </div>

                  </div>

                  {/* AI INSIGHT GENERATOR TRIGGER & CONTAINER */}
                  <div className="border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 transition-all bg-emerald-50/30 dark:bg-emerald-950/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <span className="text-[9px] font-mono uppercase font-black block text-emerald-700 dark:text-emerald-300">INTELLIGENT INSIGHTS</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300">Contrast vegetation indexes, air quality variations, and agricultural suitability of these nodes.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleGenerateCompareAi(locA, locB)}
                        disabled={aiCompareLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shadow-xs active:scale-95"
                      >
                        {aiCompareLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Synthesizing microclimates...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate AI Comparison</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Result rendering */}
                    {aiCompareResult && (
                      <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs leading-relaxed text-left animate-fade-in bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 shadow-xs">
                        <span className="text-[8px] font-mono uppercase font-black block mb-2 tracking-widest text-emerald-700 dark:text-emerald-400">
                          GEOPULSE INTEL COMPARISON SYNTHESIS
                        </span>
                        <p className="text-xs font-sans leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                          {aiCompareResult}
                        </p>
                      </div>
                    )}

                    {aiCompareError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 text-rose-500" />
                        <span>{aiCompareError}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 🗃 Grid of Saved Cards */}
      <div className="flex flex-col gap-6">
        {savedLocations.length === 0 ? (
          /* Friendly Empty State if there are no bookmarks at all */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full text-center py-16 px-6 border rounded-2xl flex flex-col items-center gap-4 max-w-lg mx-auto shadow-2xl transition-all ${
              isDarkMode ? "bg-[#111A2E]/40 border-[rgba(96,165,250,0.15)] text-white" : "bg-white border-slate-200/80 text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-inner">
              <Star className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? "text-[#F8FAFC]" : "text-slate-900"}`}>⭐ No Saved Locations Yet</h3>
              <p className={`text-xs mt-2 max-w-sm leading-relaxed ${isDarkMode ? "text-[#CBD5E1]" : "text-slate-500"}`}>
                "Search a location and click 'Save Location' to add it here."
              </p>
            </div>
            <button
              onClick={() => setActivePage("map")}
              className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Map</span>
            </button>
          </motion.div>
        ) : sorted.length === 0 ? (
          /* Empty State if searches filter everything out */
          <div className="w-full text-center py-12 text-slate-400 flex flex-col items-center gap-2">
            <Compass className="w-8 h-8 text-slate-500" />
            <span className="text-xs font-bold">No saved locations match "{localSearch}"</span>
            <button onClick={() => setLocalSearch("")} className="text-xs text-emerald-600 dark:text-emerald-400 underline font-medium">Clear search filter</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {sorted.map((loc) => (
                <motion.div
                  key={loc.id}
                  layoutId={`card-${loc.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className={`group border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 relative shadow-xs hover:shadow-md bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-white ${
                    loc.isPinned ? "ring-1 ring-amber-400/60" : "hover:border-emerald-500/40"
                  }`}
                >
                  {/* Decorative Pinned Badge on the card boundary */}
                  {loc.isPinned && (
                    <div className="absolute -top-2.5 left-4 bg-amber-400 text-slate-950 text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Pin className="w-2.5 h-2.5 fill-current" />
                      <span>PINNED TO TOP</span>
                    </div>
                  )}

                  {/* Header row: Title & Action Items */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      {editingId === loc.id ? (
                        /* Inline Edit Input */
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(loc.id)}
                            className="border rounded-lg px-2 py-1 text-xs font-extrabold w-full focus:outline-hidden bg-slate-50 dark:bg-slate-900 border-emerald-500 text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(loc.id)}
                            className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <h4 className="text-sm font-extrabold truncate flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <span>{loc.customName || loc.name}</span>
                            {loc.isFavorite && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                          </h4>
                          <span className="text-[10px] block truncate font-medium mt-0.5 text-slate-500 dark:text-slate-400">
                            {loc.customName ? `(${loc.name}) ` : ""}{loc.region ? `${loc.region}, ` : ""}{loc.country}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons list */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle Pin */}
                      <button
                        onClick={() => onTogglePinned(loc.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          loc.isPinned 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30"
                        }`}
                        title={loc.isPinned ? "Unpin location" : "Pin location to top"}
                      >
                        <Pin className="w-3 h-3 fill-current" />
                      </button>

                      {/* Toggle Favorite */}
                      <button
                        onClick={() => onToggleFavorite(loc.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          loc.isFavorite 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30"
                        }`}
                        title={loc.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className="w-3 h-3 fill-current" />
                      </button>

                      {/* Toggle Compare */}
                      <button
                        onClick={() => handleToggleCompare(loc.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          compareIds.includes(loc.id) 
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400" 
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30"
                        }`}
                        title={compareIds.includes(loc.id) ? "Deselect from comparison" : "Select for comparison (Max 2)"}
                      >
                        <Scale className="w-3 h-3" />
                      </button>

                      {/* Rename inline */}
                      <button
                        onClick={() => handleStartRename(loc.id, loc.customName || loc.name)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer"
                        title="Rename location"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onRemoveSavedLocation(loc.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                        title="Delete saved location"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Climate Telemetry values block */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
                      <div>
                        <span className="text-[8px] font-mono font-bold block uppercase leading-none text-slate-400 dark:text-slate-500">Temp</span>
                        <span className="text-xs font-black leading-none block mt-1 text-slate-800 dark:text-white">{formatTemp(loc.telemetry.temperature)}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-[8px] font-mono font-bold block uppercase leading-none text-slate-400 dark:text-slate-500">AQI</span>
                        <span className="text-xs font-black leading-none block mt-1 text-emerald-600 dark:text-emerald-400">
                          {loc.telemetry.aqi} 
                          <span className="text-[8px] font-medium ml-1 text-slate-500">({loc.telemetry.aqiLabel})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Satellite Thumbnail Map */}
                  <div className="mb-4">
                    <MapThumbnail lat={loc.lat} lng={loc.lng} isDarkMode={isDarkMode} />
                  </div>

                  {/* Footer Row: Last Saved Date & Navigation Button */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>Saved: <strong className="text-slate-600 dark:text-slate-400">{formatSavedAt(loc.savedAt)}</strong></span>
                    </div>
                    
                    <button
                      onClick={() => {
                        onLocationSelect(loc);
                        setActivePage("map");
                      }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-extrabold flex items-center gap-1 transition-all group-hover:translate-x-0.5 cursor-pointer"
                    >
                      <span>Inspect GIS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 🧭 Recent Searches Panel */}
      <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] text-left flex flex-col gap-4 shadow-xs text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-mono tracking-widest uppercase font-extrabold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <History className="w-4 h-4" />
            <span>Recent Cognitive Searches ({recentSearches.length})</span>
          </span>
          {recentSearches.length > 0 && (
            <button
              onClick={onClearRecentSearches}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR HISTORY</span>
            </button>
          )}
        </div>

        {recentSearches.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-semibold flex flex-col items-center gap-2">
            <Search className="w-8 h-8 text-slate-400" />
            <span>No recent searches.</span>
            <p className="text-[10px] text-slate-400 font-medium">Any places you search on the home dashboard will appear here as shortcuts.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(search);
                  setActivePage("home");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{search}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
