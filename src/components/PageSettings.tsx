import React from "react";
import { Settings, Eye, Globe2, Bell, Map as MapIcon } from "lucide-react";
import { ClimateLayer } from "../types";
import GeoPulseLogo from "./GeoPulseLogo";

interface PageSettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  mapStyle: "satellite" | "roadmap" | "hybrid" | "terrain";
  setMapStyle: (style: "satellite" | "roadmap" | "hybrid" | "terrain") => void;
  selectedLayer: ClimateLayer;
  setSelectedLayer: (layer: ClimateLayer) => void;
  showTraffic: boolean;
  setShowTraffic: (traffic: boolean) => void;
  units: "metric" | "imperial";
  setUnits: (u: "metric" | "imperial") => void;
  language: string;
  setLanguage: (lang: string) => void;
  alertNotifications: boolean;
  setAlertNotifications: (val: boolean) => void;
  aqiNotifications: boolean;
  setAqiNotifications: (val: boolean) => void;
  satelliteUpdates: boolean;
  setSatelliteUpdates: (val: boolean) => void;
}

export default function PageSettings({
  isDarkMode,
  setIsDarkMode,
  mapStyle,
  setMapStyle,
  selectedLayer,
  setSelectedLayer,
  showTraffic,
  setShowTraffic,
  units,
  setUnits,
  language,
  setLanguage,
  alertNotifications,
  setAlertNotifications,
  aqiNotifications,
  setAqiNotifications,
  satelliteUpdates,
  setSatelliteUpdates,
}: PageSettingsProps) {
  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-6 max-w-3xl mx-auto transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
          <GeoPulseLogo size={32} showText={false} />
          <span className="text-slate-900 dark:text-white">System Settings</span>
        </h1>
        <p className="text-xs mt-1 font-mono uppercase text-slate-500 dark:text-slate-400">
          Configure UI Preferences, Notification Feeds, Metrics, and Layer defaults.
        </p>
      </div>

      <div className="flex flex-col gap-6 text-left">
        
        {/* Theme and Appearance */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col gap-4 transition-colors duration-200">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Eye className="w-4 h-4" />
            <span>Theme & Visual Appearance</span>
          </h2>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode Canvas</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Reduce retinal fatigue with deep dark canvas tints across all views.</span>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${
                isDarkMode ? "bg-emerald-600 flex justify-end" : "bg-slate-200 dark:bg-slate-700 flex justify-start"
              }`}
              title="Toggle Dark Mode"
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

        {/* Language and Regional */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col gap-4 transition-colors duration-200">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Globe2 className="w-4 h-4" />
            <span>Language & Regional Localization</span>
          </h2>

          {/* Language Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Interface Language</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Select localization string tables.</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden transition-all"
            >
              <option value="en">🌐 English (US)</option>
              <option value="es">🌐 Español (ES)</option>
              <option value="fr">🌐 Français (FR)</option>
              <option value="de">🌐 Deutsch (DE)</option>
              <option value="zh">🌐 简体中文 (ZH)</option>
            </select>
          </div>

          {/* Units Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Measurement Units</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Toggle between Metric standard or Imperial indices.</span>
            </div>
            <div className="flex gap-1.5 p-1 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60">
              <button
                onClick={() => setUnits("metric")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  units === "metric" 
                    ? "bg-emerald-600 text-white font-bold shadow-xs" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Metric (°C, km/h, mm)
              </button>
              <button
                onClick={() => setUnits("imperial")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  units === "imperial" 
                    ? "bg-emerald-600 text-white font-bold shadow-xs" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Imperial (°F, mph, in)
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col gap-4 transition-colors duration-200">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Bell className="w-4 h-4" />
            <span>Notification Preferences</span>
          </h2>

          {/* Disaster Warnings */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Extreme Weather Alerts</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Notify immediately upon detecting cyclones, wildfires, or flooding events.</span>
            </div>
            <button
              onClick={() => setAlertNotifications(!alertNotifications)}
              className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${
                alertNotifications 
                  ? "bg-emerald-600 flex justify-end" 
                  : "bg-slate-200 dark:bg-slate-700 flex justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* AQI warnings */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Air Quality Anomalies</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Receive ambient warnings if PM2.5 scores rise above 150 points.</span>
            </div>
            <button
              onClick={() => setAqiNotifications(!aqiNotifications)}
              className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${
                aqiNotifications 
                  ? "bg-emerald-600 flex justify-end" 
                  : "bg-slate-200 dark:bg-slate-700 flex justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Satellite signals */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Satellite Sentinel Updates</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Receive signals when Copernicus or Landsat orbits refresh canvas tiles.</span>
            </div>
            <button
              onClick={() => setSatelliteUpdates(!satelliteUpdates)}
              className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${
                satelliteUpdates 
                  ? "bg-emerald-600 flex justify-end" 
                  : "bg-slate-200 dark:bg-slate-700 flex justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

        {/* Map & GIS Preferences */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col gap-4 transition-colors duration-200">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <MapIcon className="w-4 h-4" />
            <span>Map & Geographic (GIS) Preferences</span>
          </h2>

          {/* Style Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Default GIS Base Map Style</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Configure visual layout layers for the environmental map frames.</span>
            </div>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden transition-all"
            >
              <option value="satellite">🛰 Satellite Imagery</option>
              <option value="hybrid">🗺 Hybrid Imagery & Road</option>
              <option value="roadmap">🗺 Clean Vector Map</option>
              <option value="terrain">⛰ Physical Terrain Map</option>
            </select>
          </div>

          {/* Layer Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Default Layer Overlay</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Choose which climate telemetry layer loads by default on startups.</span>
            </div>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value as ClimateLayer)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden transition-all"
            >
              <option value="temperature">Temperature (°C)</option>
              <option value="rainfall">Precipitation Rainfall (mm)</option>
              <option value="aqi">Air Quality Index (AQI)</option>
              <option value="flood">Flood Inundation Risk Index</option>
              <option value="ndvi">Vegetation Density Index (NDVI)</option>
              <option value="wildfire">Wildfire Susceptibility (%)</option>
              <option value="population">Population Density (p/km²)</option>
              <option value="wind">Wind Speed (km/h)</option>
            </select>
          </div>

          {/* Show Traffic Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Real-Time Transit Layers</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Show urban transit and traffic network overlays where available.</span>
            </div>
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${
                showTraffic 
                  ? "bg-emerald-600 flex justify-end" 
                  : "bg-slate-200 dark:bg-slate-700 flex justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
