import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Clock, 
  Thermometer, 
  Gauge, 
  Droplets, 
  Sparkles, 
  ChevronRight,
  Sun,
  CloudRain,
  Sprout,
  Leaf,
  AlertTriangle,
  HeartPulse,
  Building2,
  Phone,
  ShieldAlert,
  Smartphone,
  Umbrella,
  Eye,
  Check,
  RefreshCw,
  Info,
  Target,
  Radio,
  Bell,
  BellRing,
  SlidersHorizontal,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocationReport } from "../types";
import { calculateEnvironmentalHealthScore, getActionableRecommendations, getEmergencyResources } from "../utils";
import GeoPulseLogo from "./GeoPulseLogo";
import earthNatureBanner from "../assets/images/earth_nature_banner_1785864031395.jpg";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

interface PageHomeProps {
  platformName: string;
  setPlatformName: (name: string) => void;
  selectedLocation: LocationReport | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  predictions: any[];
  showPredictionsDropdown: boolean;
  setShowPredictionsDropdown: (show: boolean) => void;
  handleSelectPrediction: (pred: any) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  recentSearches: string[];
  savedLocations: LocationReport[];
  onLocationSelect: (loc: LocationReport) => void;
  isDarkMode: boolean;
  isFallbackMode: boolean;
  detectCurrentLocation: () => void;
  POPULAR_HOTSPOTS: any[];
  handleSelectHotspot: (spot: any) => void;
  aiBullets: string[];
  setActivePage: (page: string) => void;
  handleSearchSubmit: (overrideQuery?: string) => void;
  isEmergencyMode: boolean;
  setIsEmergencyMode: (b: boolean) => void;
}

export default function PageHome({
  platformName,
  setPlatformName,
  selectedLocation,
  searchQuery,
  setSearchQuery,
  predictions,
  showPredictionsDropdown,
  setShowPredictionsDropdown,
  handleSelectPrediction,
  handleKeyDown,
  recentSearches,
  savedLocations,
  onLocationSelect,
  isDarkMode,
  isFallbackMode,
  detectCurrentLocation,
  POPULAR_HOTSPOTS,
  handleSelectHotspot,
  aiBullets,
  setActivePage,
  handleSearchSubmit,
  isEmergencyMode,
  setIsEmergencyMode
}: PageHomeProps) {
  
  // Real-time digital clock with seconds for precise satellite feel
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [selectedLocation]);

  // Inline rebranding states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(platformName);

  // Custom Alert Radius & Perimeter Guard States
  const [alertRadiusKm, setAlertRadiusKm] = useState<number>(() => {
    const saved = localStorage.getItem("gp_alert_radius");
    return saved ? parseInt(saved, 10) : 25;
  });
  const [criticalAqiThreshold, setCriticalAqiThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("gp_critical_aqi");
    return saved ? parseInt(saved, 10) : 75;
  });
  const [criticalTempThreshold, setCriticalTempThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("gp_critical_temp");
    return saved ? parseInt(saved, 10) : 35;
  });
  const [isRadiusAlertEnabled, setIsRadiusAlertEnabled] = useState<boolean>(true);
  const [isAlertRadiusModalOpen, setIsAlertRadiusModalOpen] = useState<boolean>(false);
  const [dismissedAlert, setDismissedAlert] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("gp_alert_radius", alertRadiusKm.toString());
  }, [alertRadiusKm]);

  useEffect(() => {
    localStorage.setItem("gp_critical_aqi", criticalAqiThreshold.toString());
  }, [criticalAqiThreshold]);

  useEffect(() => {
    localStorage.setItem("gp_critical_temp", criticalTempThreshold.toString());
  }, [criticalTempThreshold]);

  // Sync temp name when platformName changes (e.g. initial load)
  useEffect(() => {
    setTempName(platformName);
  }, [platformName]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setPlatformName(tempName.trim());
      localStorage.setItem("gp_platform_name", tempName.trim());
    }
    setIsEditingName(false);
  };

  // Determine active display report (either selectedLocation or first saved fallback)
  const activeReport = selectedLocation || savedLocations[0] || null;

  // Weather text description helper
  const getWeatherDescription = (temp: number, rainProb: number) => {
    if (rainProb > 50) return "Rain Showers Expected";
    if (temp > 32) return "Excessive Heat Outlook";
    if (temp < 15) return "Cool Ambient Thermal Air";
    return "Clear Skies Overview";
  };

  const handleSearchAndRedirect = () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    handleSearchSubmit();
    setActivePage("map");
  };

  const handlePredictionAndRedirect = (pred: any) => {
    handleSelectPrediction(pred);
    setActivePage("map");
  };

  const ehs = activeReport ? calculateEnvironmentalHealthScore(activeReport.telemetry) : null;
  const recommendations = activeReport ? getActionableRecommendations(activeReport.telemetry) : [];
  const emergencyData = activeReport ? getEmergencyResources(activeReport.name) : null;

  // Alert Radius & Perimeter Threshold Evaluation
  const currentAqi = activeReport?.telemetry?.aqi ?? 38;
  const currentTemp = activeReport?.telemetry?.temperature ?? 28.4;
  const isAqiBreached = isRadiusAlertEnabled && currentAqi >= criticalAqiThreshold;
  const isTempBreached = isRadiusAlertEnabled && currentTemp >= criticalTempThreshold;
  const hasActivePerimeterAlert = isAqiBreached || isTempBreached;

  // Generate 7 Days History dataset dynamically based on current metrics
  const chartData = activeReport ? [
    { name: "14 Jul", aqi: Math.max(15, activeReport.telemetry.aqi - 8), temp: activeReport.telemetry.temperature - 1.5, humidity: Math.min(100, activeReport.telemetry.humidity + 4) },
    { name: "15 Jul", aqi: Math.max(15, activeReport.telemetry.aqi - 3), temp: activeReport.telemetry.temperature + 0.8, humidity: Math.max(0, activeReport.telemetry.humidity - 2) },
    { name: "16 Jul", aqi: Math.max(15, activeReport.telemetry.aqi + 12), temp: activeReport.telemetry.temperature + 1.2, humidity: Math.min(100, activeReport.telemetry.humidity + 8) },
    { name: "17 Jul", aqi: Math.max(15, activeReport.telemetry.aqi - 6), temp: activeReport.telemetry.temperature - 0.5, humidity: Math.max(0, activeReport.telemetry.humidity - 5) },
    { name: "18 Jul", aqi: Math.max(15, activeReport.telemetry.aqi + 5), temp: activeReport.telemetry.temperature - 1.0, humidity: Math.min(100, activeReport.telemetry.humidity + 2) },
    { name: "19 Jul", aqi: Math.max(15, activeReport.telemetry.aqi - 1), temp: activeReport.telemetry.temperature + 0.3, humidity: Math.max(0, activeReport.telemetry.humidity - 1) },
    { name: "20 Jul", aqi: activeReport.telemetry.aqi, temp: activeReport.telemetry.temperature, humidity: activeReport.telemetry.humidity },
  ] : [];

  // Uniform Premium Card Style with crisp 100% vector razor-sharp clarity without hover scale blur
  const baseCardClass = "p-6 rounded-2xl border transition-all duration-200 relative overflow-hidden bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-slate-300 dark:hover:border-slate-700";

  // Health Score Rating Text & Color
  const getHealthBadgeProps = (score: number | null) => {
    if (!score) return { text: "No Data", color: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700" };
    if (score >= 80) return { text: "Optimal Environmental Health", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60" };
    if (score >= 55) return { text: "Moderate Atmosphere", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60" };
    return { text: "Action Advised / High Risk", color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60" };
  };

  const healthBadge = getHealthBadgeProps(ehs ? ehs.score : null);

  return (
    <div id="home_dashboard_viewport" className="w-full h-full overflow-y-auto px-4 sm:px-6 md:px-8 pt-7 pb-24 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      
      {/* ================= EMERGENCY MODE DISPATCH PANEL ================= */}
      {isEmergencyMode && activeReport && (
        <div id="emergency_dispatch_panel" className="flex flex-col gap-5 p-6 rounded-2xl border border-rose-500/80 bg-rose-950/25 backdrop-blur-md shadow-2xl relative overflow-hidden text-left animate-fade-in">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-rose-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg">
                <ShieldAlert className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wider text-rose-400 uppercase">EMERGENCY DISPATCH PROTOCOLS</h3>
                <p className="text-xs text-rose-200">Active hazards, resources, and emergency routing details for {activeReport.name}.</p>
              </div>
            </div>
            <button
              id="deactivate_emergency_top_btn"
              onClick={() => setIsEmergencyMode(false)}
              className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 rounded-lg border border-rose-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Deactivate Panel
            </button>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/35 bg-rose-950/45 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">PRIMARY WEATHER HAZARD METRIC</span>
                <span className="text-sm font-extrabold text-white mt-0.5">
                  {activeReport.telemetry.climateRisk > 50 
                    ? `Warning: Active ${activeReport.telemetry.riskFactor || "Climate Hazard Warning"} in progress.`
                    : "No immediate structural hazards are reported."}
                </span>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                  {activeReport.telemetry.climateRisk > 50 
                    ? (activeReport.telemetry.riskFactor === "Wildfire Susceptibility" 
                      ? "Wildfire Danger Active: Evacuate forest canopies instantly. Restrict open sparks. Maintain direct respiratory filtration."
                      : activeReport.telemetry.riskFactor === "Extreme Precipitation Risk" || activeReport.telemetry.rainProbability > 65
                        ? "Precipitation Hazard: Keep clear of basement structures and floodways. Maintain communication lines with community services."
                        : "High Thermal Index: Minimize continuous bodily exposure, secure secondary hydration reservoirs, and locate civil response shelters.")
                    : "Standard observation status. Inspect local emergency provisions and maintain normal civil alerts."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* HOSPITALS */}
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400">
                  <HeartPulse className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Nearby Medical Facilities</span>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  {emergencyData?.hospitals.map((h, idx) => (
                    <div key={idx} className="flex flex-col border-b border-rose-500/10 pb-2 last:pb-0">
                      <span className="text-xs font-bold text-white">{h.name}</span>
                      <span className="text-[10px] text-rose-200/70 font-mono">Distance Index: {h.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FIRE & POLICE */}
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400">
                  <Building2 className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Local First Responders</span>
                </div>
                <div className="flex flex-col gap-2.5 mt-3">
                  <div className="flex flex-col border-b border-rose-500/10 pb-2">
                    <span className="text-[9px] text-rose-400 font-mono uppercase font-black">FIRE STATION</span>
                    <span className="text-xs font-bold text-white">{emergencyData?.fireStations[0]?.name}</span>
                    <span className="text-[9px] text-rose-200/70 font-mono">Distance Index: {emergencyData?.fireStations[0]?.distance}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-rose-400 font-mono uppercase font-black">POLICE DEPT</span>
                    <span className="text-xs font-bold text-white">{emergencyData?.policeStations[0]?.name}</span>
                    <span className="text-[9px] text-rose-200/70 font-mono">Distance Index: {emergencyData?.policeStations[0]?.distance}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SHELTERS & TELEMETRY CONTACTS */}
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Emergency Communications</span>
                </div>
                <div className="flex flex-col gap-2.5 mt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold">{emergencyData?.shelters[0]?.name || "Local Evac Center"}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-100 uppercase font-black">{emergencyData?.shelters[0]?.capacity || "Active"}</span>
                  </div>
                  <div className="flex flex-col pt-2 border-t border-rose-500/10 gap-1.5">
                    {emergencyData?.contacts.slice(0, 3).map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-semibold">{c.label}</span>
                        <span className="text-white font-mono font-bold">{c.number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RADIAL PERIMETER ALERT BANNER ================= */}
      {hasActivePerimeterAlert && !dismissedAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
            isDarkMode 
              ? "bg-rose-950/80 border-rose-800 text-rose-100 shadow-rose-950/40" 
              : "bg-rose-50 border-rose-300 text-rose-900 shadow-rose-100"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black font-mono uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">
                  Perimeter Threshold Alert
                </span>
                <span className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300">
                  Radius: {alertRadiusKm} km • {activeReport?.name ?? "Current Region"}
                </span>
              </div>
              <p className="text-xs font-semibold mt-1">
                {isAqiBreached && (
                  <span>Atmospheric AQI is currently <strong className="font-extrabold text-rose-600 dark:text-rose-300">{currentAqi} Index</strong>, exceeding your custom limit of <strong className="underline">{criticalAqiThreshold} AQI</strong>. </span>
                )}
                {isTempBreached && (
                  <span>Ambient temperature is <strong className="font-extrabold">{currentTemp}°C</strong> (Exceeds {criticalTempThreshold}°C limit). </span>
                )}
                Sensory alerts active for monitoring radius.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setIsAlertRadiusModalOpen(true)}
              className="text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Radius</span>
            </button>
            <button
              onClick={() => setDismissedAlert(true)}
              className="p-1.5 rounded-xl hover:bg-rose-200/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 transition-all cursor-pointer"
              title="Dismiss Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= REDESIGNED HEADER: EXECUTIVE BOARD ================= */}
      <div id="executive_header_board" className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
        
        {/* Left Side: Brand Name & Region Status */}
        <div className={`flex-1 ${baseCardClass} flex flex-col justify-between p-6 gap-4`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-700 dark:text-emerald-400">
                Live Weather & Earth Satellite Feed
              </span>
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="rename_input_field"
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className={`text-2xl md:text-3xl font-black tracking-tight rounded-lg px-3 py-1 outline-none border-2 transition-all ${
                    isDarkMode 
                      ? "bg-slate-900 border-[#10B981] text-white" 
                      : "bg-white border-[#047857] text-[#0F172A]"
                  }`}
                />
                <button
                  id="rename_save_action"
                  onClick={handleSaveName}
                  className="p-2 bg-[#047857] hover:bg-[#0F172A] text-white rounded-lg transition-all cursor-pointer shadow-xs shrink-0"
                  title="Save Name"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group mt-1">
                <h1 id="platform_brand_header" className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white leading-tight">
                  {platformName}
                </h1>
                <button
                  id="rename_edit_trigger"
                  onClick={() => {
                    setTempName(platformName);
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-[#10B981] hover:bg-slate-500/10 rounded-lg transition-all cursor-pointer"
                  title="Rename App"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            
            <span className={`text-[11px] font-extrabold tracking-widest uppercase ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}>
              Local Weather, Air & Environment Overview
            </span>

            {/* Real Earth & Nature Image Banner */}
            <div className={`w-full mt-2.5 mb-2 rounded-2xl border relative overflow-hidden transition-all duration-200 group ${
              isDarkMode 
                ? "bg-slate-950 border-slate-800 shadow-inner" 
                : "bg-emerald-950 border-slate-200 shadow-xs"
            }`}>
              <div className="relative w-full h-36 sm:h-44 overflow-hidden">
                <img 
                  src={earthNatureBanner} 
                  alt="Earth and Nature Environment" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Gradient Overlays for readability & aesthetic depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/50" />

                {/* Floating HUD Live Data Badges over Earth Image */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                  <span className="bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE SATELLITE :: EARTH VIEW
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                    SCAN: 37.77° N, 122.41° W
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold tracking-wide drop-shadow-md">
                      Planetary Earth & Nature Health
                    </h3>
                    <p className="text-[11px] text-emerald-200 font-medium drop-shadow-sm flex items-center gap-1.5 mt-0.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      Lush Canopy • High Vegetation NDVI (0.82)
                    </p>
                  </div>

                  <span className="hidden sm:flex bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                    OPTIMAL EHS
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100/10">
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${healthBadge.color}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{healthBadge.text} (EHS: {ehs ? ehs.score : "N/A"})</span>
            </div>
            
            <button
              id="goto_map_explore_shortcut"
              onClick={() => setActivePage("map")}
              className="text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Launch Live Map View</span>
            </button>
          </div>
        </div>

        {/* Right Side: Local Weather & Air Sensors */}
        <div className={`lg:w-96 ${baseCardClass} flex flex-col justify-between p-6 gap-4`}>
          <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-100/10">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Local Weather & Air Sensors
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-mono text-emerald-500 uppercase font-bold">Orbit Active</span>
              </div>
            </div>

            {/* Dynamic Last Synced Timestamp Indicator */}
            <div className={`flex items-center justify-between text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
              isDarkMode ? "bg-slate-900/60 border-slate-800/80 text-slate-300" : "bg-slate-100/80 border-slate-200 text-slate-700"
            }`}>
              <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3 text-emerald-500" />
                Last synced:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{lastSyncedTime}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeReport ? (
              <motion.div
                key={activeReport.id || activeReport.name}
                initial={{ opacity: 0, x: 35 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 35 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-3 text-left"
              >
                {/* Main Metric: AQI */}
                <div className={`flex justify-between items-center p-3 rounded-xl border ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      Atmospheric AQI
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {activeReport.telemetry.aqi}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        activeReport.telemetry.aqi <= 50
                          ? "bg-emerald-500/10 text-emerald-500"
                          : activeReport.telemetry.aqi <= 100
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {activeReport.telemetry.aqiLabel}
                      </span>
                    </div>
                  </div>
                  {/* Visual mini progress bar arc */}
                  <div className="w-12 h-12 flex items-center justify-center relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        className={`${
                          activeReport.telemetry.aqi <= 50
                            ? "stroke-emerald-500"
                            : activeReport.telemetry.aqi <= 100
                              ? "stroke-amber-500"
                              : "stroke-rose-500"
                        }`}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={113}
                        strokeDashoffset={113 - (113 * Math.min(100, (activeReport.telemetry.aqi / 150) * 100)) / 100}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-black text-slate-900 dark:text-white">
                      {Math.round((activeReport.telemetry.aqi / 150) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Climate Risk Factor & Deforestation Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className="text-[8px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-500" />
                      Climate Risk
                    </span>
                    <div className="mt-1">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-slate-100">
                        {activeReport.telemetry.climateRisk}%
                      </span>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {activeReport.telemetry.riskFactor}
                      </p>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className="text-[8px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Sprout className="w-3 h-3 text-emerald-500" />
                      Canopy Status
                    </span>
                    <div className="mt-1">
                      <span className={`text-[9px] font-bold block truncate ${
                        activeReport.telemetry.deforestation === "Stable"
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }`}>
                        {activeReport.telemetry.deforestation}
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        NDVI: {(activeReport.telemetry.ndvi ?? 0.55).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alert Radius & Perimeter Threshold Control Strip */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 mt-0.5 ${
                  hasActivePerimeterAlert
                    ? (isDarkMode ? "bg-rose-950/40 border-rose-800/80" : "bg-rose-50/90 border-rose-300")
                    : (isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200")
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      hasActivePerimeterAlert
                        ? "bg-rose-500 text-white animate-pulse"
                        : (isRadiusAlertEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400")
                    }`}>
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left truncate">
                      <span className="text-[9px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                        Alert Radius Guard • {alertRadiusKm} km
                      </span>
                      <span className={`text-[10px] font-extrabold truncate ${
                        hasActivePerimeterAlert 
                          ? "text-rose-600 dark:text-rose-400" 
                          : "text-slate-800 dark:text-slate-200"
                      }`}>
                        {hasActivePerimeterAlert 
                          ? `AQI Threshold Breached (${currentAqi}/${criticalAqiThreshold})` 
                          : (isRadiusAlertEnabled ? `Shield Active (Target: <${criticalAqiThreshold} AQI)` : "Guard Paused")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAlertRadiusModalOpen(true)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      hasActivePerimeterAlert
                        ? "bg-rose-600 text-white border-rose-500 hover:bg-rose-700"
                        : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-2xs"
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Radius</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="no-report"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35 }}
                className="text-xs text-slate-400 text-left"
              >
                No regional telemetry available.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Interactive Toggle for Sentinel Scan Details */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100/10">
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">Next Orbit Window</span>
              <span className="text-xs font-black font-mono text-cyan-500 dark:text-cyan-400">
                {/* Count down seconds dynamically based on device seconds */}
                {`00:${String(59 - (currentTime.getSeconds() % 60)).padStart(2, '0')}s`}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">Sentinel Mode</span>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-tight">Spectral HD</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= BENTO SEARCH & EXPLORER QUICK SHORTCUTS ================= */}
      <div id="bento_explorer_section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Search Console & Autocomplete Dropdown */}
        <div className={`lg:col-span-8 ${baseCardClass} p-6 flex flex-col justify-between gap-5 text-left`}>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold tracking-tight">Active Satellite Search Console</h3>
            <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              Type coordinate coordinates or regional destination titles to query immediate Copernicus sensory updates.
            </p>
          </div>

          {/* Autocomplete Bar */}
          <div className="relative w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                id="satellite_regional_search_input"
                type="text"
                value={searchQuery}
                placeholder="Search location, region, or coordinates (e.g. India, Japan, Amazon Rainforest)..."
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowPredictionsDropdown(true);
                }}
                onFocus={() => setShowPredictionsDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchAndRedirect();
                  }
                }}
                className={`w-full text-xs pl-10 pr-16 py-3.5 rounded-xl outline-none border transition-all font-semibold ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30" 
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/30"
                }`}
              />
              <button
                id="search_go_action_btn"
                onClick={handleSearchAndRedirect}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Query
              </button>
            </div>

            {/* Autocomplete predictions dropdown list */}
            {showPredictionsDropdown && searchQuery.trim().length >= 2 && (
              <div id="satellite_predictions_list" className={`absolute top-[calc(100%+6px)] left-0 right-0 border rounded-xl shadow-xl max-h-[220px] overflow-y-auto z-[999] ${
                isDarkMode ? "bg-[#090F1C] border-slate-800 text-slate-200" : "bg-white border-[#E2E8F0] text-slate-900"
              }`}>
                {predictions.length > 0 ? (
                  predictions.map((pred, idx) => (
                    <button
                      id={`prediction_item_${idx}`}
                      key={`${pred.place_id || 'pred'}-${pred.description || 'desc'}-${idx}`}
                      onClick={() => handlePredictionAndRedirect(pred)}
                      className={`w-full text-left px-4 py-3 border-b last:border-0 flex items-center gap-2.5 transition-colors cursor-pointer text-xs ${
                        isDarkMode ? "border-slate-800/40 hover:bg-slate-800/60 text-slate-200" : "border-[#F1F5F9] hover:bg-[#F8FAFC] text-slate-900"
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate flex-1">
                        <strong>{pred.structured_formatting?.main_text || pred.description.split(",")[0]}</strong>
                        {((pred.structured_formatting?.secondary_text || pred.description.split(",").slice(1).join(", ")) ? `, ${pred.structured_formatting?.secondary_text || pred.description.split(",").slice(1).join(", ")}` : "")}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-4 text-center text-slate-500 text-xs">No matching place registered.</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Hotspot Buttons Row */}
          <div className="flex flex-col gap-2.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Recommended Regional Observatories
            </span>
            <div id="hotspot_pills_container" className="flex flex-wrap gap-2">
              {POPULAR_HOTSPOTS.map((spot, idx) => {
                const isActive = searchQuery.toLowerCase() === spot.name.toLowerCase();
                
                // Assign beautiful, vibrant, translucent light-colored styles based on the index to replace the dull grey/black boxes
                const getPillTheme = () => {
                  if (isActive) {
                    return isDarkMode
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-md ring-2 ring-emerald-500/30 font-extrabold"
                      : "bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30 font-extrabold";
                  }
                  
                  switch (idx % 5) {
                    case 0: // Soft blue / sapphire
                      return isDarkMode
                        ? "bg-blue-950/40 border-blue-500/30 text-blue-300 hover:bg-blue-900/50 hover:border-blue-400/50"
                        : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300";
                    case 1: // Soft emerald / mint
                      return isDarkMode
                        ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400/50"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300";
                    case 2: // Soft orange / amber
                      return isDarkMode
                        ? "bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400/50"
                        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300";
                    case 3: // Soft purple / violet
                      return isDarkMode
                        ? "bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400/50"
                        : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300";
                    case 4: // Soft rose / pink
                    default:
                      return isDarkMode
                        ? "bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50 hover:border-rose-400/50"
                        : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300";
                  }
                };

                return (
                  <button
                    id={`hotspot_pill_${idx}`}
                    key={idx}
                    onClick={() => {
                      handleSelectHotspot(spot);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer whitespace-nowrap ${getPillTheme()}`}
                  >
                    <span>{spot.flag}</span>
                    <span>{spot.name}</span>
                    <span className="text-[9px] font-mono opacity-80">({spot.type})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sensory Locator & Diagnostics */}
        <div className={`lg:col-span-4 ${baseCardClass} p-6 flex flex-col justify-between gap-4 text-left`}>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold tracking-tight">Active Sentinel Target</h3>
            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Copernicus satellite sensor coordinates locked on high-altitude grid.
            </p>
          </div>

          {/* Coordinates details */}
          <div className={`p-4 rounded-xl border flex flex-col gap-2.5 font-mono ${
            isDarkMode ? "bg-[#090F1C] border-slate-800/80" : "bg-slate-50 border-slate-100"
          }`}>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Location:</span>
              <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"} truncate max-w-[160px]`}>
                {activeReport ? activeReport.name : "Chennai"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Coordinates:</span>
              <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                {activeReport ? `${activeReport.lat.toFixed(4)}°N, ${activeReport.lng.toFixed(4)}°E` : "13.0827°N, 80.2707°E"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Telemetry Quality:</span>
              <span className="text-emerald-500 font-bold uppercase text-[10px]">High Definition</span>
            </div>
          </div>

          <button
            id="detect_curr_location_btn"
            onClick={detectCurrentLocation}
            className="w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border cursor-pointer bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Re-Detect Local Coordinates</span>
          </button>
        </div>

      </div>

      {/* ================= HIGH-END METRIC BENTO TILES ================= */}
      <div id="copernicus_metrics_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
        
        {/* STAT 1: Air Quality Index */}
        <div id="metric_card_aqi" className={baseCardClass}>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
              <Gauge className="w-5 h-5" />
            </div>
            {/* Minimalist sparkline */}
            <svg className="w-16 h-8 text-emerald-500 overflow-visible mt-1" viewBox="0 0 50 20" fill="none">
              <path d="M0,15 Q10,12 18,17 T32,8 T42,12 T50,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="mt-5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Atmospheric AQI
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {activeReport ? activeReport.telemetry.aqi : "38"}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">Index</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-1.5">
              Favorable Atmosphere
            </span>
          </div>
        </div>

        {/* STAT 2: Temperature */}
        <div id="metric_card_temp" className={baseCardClass}>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <Thermometer className="w-5 h-5" />
            </div>
            {/* Minimalist sparkline */}
            <svg className="w-16 h-8 text-amber-500 overflow-visible mt-1" viewBox="0 0 50 20" fill="none">
              <path d="M0,12 Q8,15 16,8 T28,14 T40,5 T50,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="mt-5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ambient Temperature
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {activeReport ? `${activeReport.telemetry.temperature}°C` : "28.4°C"}
              </span>
            </div>
            <span className="text-xs font-semibold block mt-1.5 text-slate-600 dark:text-slate-400">
              Feels like {activeReport ? `${activeReport.telemetry.feelsLike}°C` : "31.2°C"}
            </span>
          </div>
        </div>

        {/* STAT 3: Humidity */}
        <div id="metric_card_humidity" className={baseCardClass}>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-xs">
              <Droplets className="w-5 h-5" />
            </div>
            {/* Minimalist sparkline */}
            <svg className="w-16 h-8 text-sky-500 overflow-visible mt-1" viewBox="0 0 50 20" fill="none">
              <path d="M0,16 Q12,10 22,14 T35,6 T45,12 T50,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="mt-5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sensory Humidity
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {activeReport ? `${activeReport.telemetry.humidity}%` : "65%"}
              </span>
            </div>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block mt-1.5">
              Stable Moisture
            </span>
          </div>
        </div>

        {/* STAT 4: Rain Probability */}
        <div id="metric_card_rain" className={baseCardClass}>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xs">
              <CloudRain className="w-5 h-5" />
            </div>
            {/* Minimalist sparkline */}
            <svg className="w-16 h-8 text-indigo-500 overflow-visible mt-1" viewBox="0 0 50 20" fill="none">
              <path d="M0,18 Q8,15 18,10 T30,16 T42,12 T50,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="mt-5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Precipitation Outlook
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {activeReport ? `${activeReport.telemetry.rainProbability}%` : "20%"}
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-purple-400 block mt-1.5">
              Low Threat Factor
            </span>
          </div>
        </div>

      </div>

      {/* ================= CORE GRID LAYOUT: CHART & RECOMMENDATIONS ================= */}
      <div id="analytics_and_insights_row" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ENVIRONMENTAL OVERVIEW CHART (7 Columns) */}
        <div id="environmental_chart_card" className={`lg:col-span-7 ${baseCardClass} flex flex-col justify-between text-left p-6`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">Environmental Forecast Trends</span>
              </div>
              {/* Timeframe Select Dropdown */}
              <div className="flex items-center gap-1.5">
                <select id="timeframe_select" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#090F1C] text-slate-800 dark:text-slate-200 outline-none cursor-pointer shadow-2xs">
                  <option>7 Days Analysis</option>
                  <option>30 Days Historical</option>
                  <option>12 Months Summary</option>
                </select>
              </div>
            </div>

            {/* Dynamic Styled Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono mb-6 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                <span className={`${isDarkMode ? "text-slate-300" : "text-slate-700"} font-bold`}>AQI Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] inline-block" />
                <span className={`${isDarkMode ? "text-slate-300" : "text-slate-700"} font-bold`}>Temperature (°C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block" />
                <span className={`${isDarkMode ? "text-slate-300" : "text-slate-700"} font-bold`}>Humidity (%)</span>
              </div>
            </div>

            {/* Recharts Area/Line Chart */}
            <div className="w-full h-60 min-h-60 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    style={{ fontSize: "9px", fontFamily: "monospace" }} 
                    stroke={isDarkMode ? "#64748B" : "#475569"} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    style={{ fontSize: "9px", fontFamily: "monospace" }} 
                    stroke={isDarkMode ? "#64748B" : "#475569"} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: isDarkMode ? "#0F172A" : "#FFFFFF", 
                      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600"
                    }} 
                  />
                  <Line type="monotone" dataKey="aqi" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* View Full Analysis Footer Button */}
          <button 
            id="view_full_analysis_btn"
            onClick={() => setActivePage("analysis")}
            className="w-full text-center py-3 border-t border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 mt-4 transition-all cursor-pointer text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
          >
            <span>Launch Deep Atmospheric Analysis Engine</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>

        {/* SMART RECOMMENDATIONS & LIVE AI ADVISORY (5 Columns) */}
        <div id="smart_recommendations_card" className={`lg:col-span-5 ${baseCardClass} flex flex-col justify-between text-left p-6`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold tracking-tight">Copernicus Advisory & AI Insights</span>
              <button 
                id="view_ai_advisor_shortcut"
                onClick={() => setActivePage("ai")}
                className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Launch AI
              </button>
            </div>

            <p className={`text-xs mb-4 leading-normal ${isDarkMode ? "text-slate-400" : "text-slate-600 font-medium"}`}>
              Recommended local health and agriculture tips for your location.
            </p>

            {/* Recommendations List */}
            <div className="flex flex-col gap-3.5">
              
              {/* Rain Forecast item */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:translate-x-0.5 ${
                isDarkMode ? "bg-slate-900/50 border-slate-800/70" : "bg-sky-50/80 border-sky-200/70"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Umbrella className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-xs font-bold leading-normal truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                    Rain Forecast
                  </p>
                  <span className={`text-[10px] font-medium block truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {activeReport && activeReport.telemetry.rainProbability > 40 ? "Rain expected soon: Cover tools and crops." : "No rain expected today."}
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                  isDarkMode ? "bg-slate-800 text-slate-300" : "bg-sky-100 text-sky-800 font-extrabold"
                }`}>
                  Info
                </span>
              </div>

              {/* Planting Suitability item */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:translate-x-0.5 ${
                isDarkMode ? "bg-slate-900/50 border-slate-800/70" : "bg-emerald-50/80 border-emerald-200/70"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-xs font-bold leading-normal truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                    Planting & Crop Health
                  </p>
                  <span className={`text-[10px] font-medium block truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Good soil temperature and steady moisture for planting.
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 whitespace-nowrap">
                  Optimal
                </span>
              </div>

              {/* Air Quality Index item */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:translate-x-0.5 ${
                isDarkMode ? "bg-slate-900/50 border-slate-800/70" : "bg-amber-50/80 border-amber-200/70"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-xs font-bold leading-normal truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                    Air Quality
                  </p>
                  <span className={`text-[10px] font-medium block truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Clean air. Safe for outdoor activities and farming.
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                  isDarkMode ? "bg-slate-800 text-slate-300" : "bg-amber-100 text-amber-800 font-extrabold"
                }`}>
                  Safe
                </span>
              </div>

              {/* Natural Canopy Carbon Balance item */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:translate-x-0.5 ${
                isDarkMode ? "bg-slate-900/50 border-slate-800/70" : "bg-teal-50/80 border-teal-200/70"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-xs font-bold leading-normal truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                    Greenery & Trees
                  </p>
                  <span className={`text-[10px] font-medium block truncate ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    NDVI {(activeReport?.telemetry?.ndvi ?? 0.72).toFixed(2)} • Plants and trees are healthy.
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-400 whitespace-nowrap">
                  Healthy
                </span>
              </div>

            </div>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 pt-3 mt-4 border-t border-slate-100/10 text-left">
            <Info className="w-3.5 h-3.5 text-emerald-500" /> 
            <span>Updated using live satellite images.</span>
          </p>
        </div>

      </div>

      {/* ================= GEOGRAPHIC FOOTER STATUS BAR ================= */}
      <div id="footer_status_bar_grid" className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mt-1">
        
        {/* Foot Card 1: Active Location Coordinates */}
        <div id="footer_card_coords" className={`${baseCardClass} flex items-start gap-4 p-5`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">LOCK COORDINATES</span>
            <p className="text-xs font-bold truncate mt-1 text-slate-900 dark:text-white">
              {activeReport ? `${activeReport.name}, ${activeReport.country}` : "Chennai, Tamil Nadu, India"}
            </p>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono block mt-1.5 font-bold">
              LAT: {activeReport ? activeReport.lat.toFixed(4) : "13.0827"}° N • LNG: {activeReport ? activeReport.lng.toFixed(4) : "80.2707"}° E
            </span>
          </div>
        </div>

        {/* Foot Card 2: Local Time Clock */}
        <div id="footer_card_time" className={`${baseCardClass} flex items-start gap-4 p-5`}>
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">INDIAN STANDARD TIME (IST)</span>
            <p className="text-sm font-black font-mono tracking-tight mt-1 text-slate-900 dark:text-white">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
            </p>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold block mt-1.5">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
            </span>
          </div>
        </div>

        {/* Foot Card 3: Weather Summary */}
        <div id="footer_card_weather" className={`${baseCardClass} flex items-start gap-4 p-5`}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Sun className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">ATMOSPHERE OVERVIEW</span>
            <p className="text-sm font-black font-mono tracking-tight mt-1 text-slate-900 dark:text-white">
              {activeReport ? `${activeReport.telemetry.temperature}°C` : "28.4°C"}
            </p>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold block mt-1.5">
              {activeReport ? getWeatherDescription(activeReport.telemetry.temperature, activeReport.telemetry.rainProbability) : "Clear Sky"}
            </span>
          </div>
        </div>

      </div>

      {/* ================= ALERT RADIUS & PERIMETER GUARD MODAL ================= */}
      {isAlertRadiusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl overflow-hidden relative flex flex-col gap-5 ${
              isDarkMode 
                ? "bg-[#0E1626] border-slate-700 text-white" 
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                    Alert Radius & Perimeter Guard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Targeted area: <strong className="text-emerald-600 dark:text-emerald-400">{activeReport?.name ?? "Current Region"}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAlertRadiusModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Settings */}
            <div className="flex flex-col gap-5 text-left text-xs">

              {/* Guard Active Toggle */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2.5">
                  <Bell className={`w-4 h-4 ${isRadiusAlertEnabled ? "text-emerald-500" : "text-slate-400"}`} />
                  <div>
                    <p className="font-bold text-xs">Enable Radial Alert Guard</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Notifies when metrics cross critical threshold within set radius</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsRadiusAlertEnabled(!isRadiusAlertEnabled);
                    setDismissedAlert(false);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isRadiusAlertEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                    isRadiusAlertEnabled ? "left-6.5" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* 1. Alert Radius Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    Custom Alert Radius
                  </label>
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                    {alertRadiusKm} km
                  </span>
                </div>

                <input
                  type="range"
                  min={5}
                  max={150}
                  step={5}
                  value={alertRadiusKm}
                  onChange={(e) => {
                    setAlertRadiusKm(parseInt(e.target.value, 10));
                    setDismissedAlert(false);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />

                {/* Quick Radius Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                  {[10, 25, 50, 100, 150].map((radius) => (
                    <button
                      key={radius}
                      onClick={() => {
                        setAlertRadiusKm(radius);
                        setDismissedAlert(false);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                        alertRadiusKm === radius
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300"
                      }`}
                    >
                      {radius} km
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Critical AQI Threshold Slider */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/20">
                <div className="flex justify-between items-center">
                  <label className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-500" />
                    Critical AQI Threshold
                  </label>
                  <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                    criticalAqiThreshold <= 50
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
                      : criticalAqiThreshold <= 100
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400"
                  }`}>
                    {criticalAqiThreshold} AQI Index
                  </span>
                </div>

                <input
                  type="range"
                  min={30}
                  max={200}
                  step={5}
                  value={criticalAqiThreshold}
                  onChange={(e) => {
                    setCriticalAqiThreshold(parseInt(e.target.value, 10));
                    setDismissedAlert(false);
                  }}
                  className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />

                {/* AQI Level Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Alert Level:</span>
                  {[
                    { label: "50 Good", val: 50 },
                    { label: "75 Sensitive", val: 75 },
                    { label: "100 Unhealthy", val: 100 },
                    { label: "150 Severe", val: 150 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setCriticalAqiThreshold(item.val);
                        setDismissedAlert(false);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                        criticalAqiThreshold === item.val
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Radial Station Grid Status */}
              <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${
                isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 uppercase">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-500" />
                    Radial Station Grid ({alertRadiusKm} km)
                  </span>
                  <span>Center AQI: {currentAqi}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[8px] uppercase">Inner (2 km)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentAqi} AQI</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[8px] uppercase">Mid ({Math.round(alertRadiusKm * 0.5)} km)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.max(15, currentAqi - 3)} AQI</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[8px] uppercase">Outer ({alertRadiusKm} km)</span>
                    <span className={`font-bold ${
                      currentAqi >= criticalAqiThreshold ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                    }`}>{Math.max(15, currentAqi + 4)} AQI</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/20">
              <button
                onClick={() => {
                  setCriticalAqiThreshold(Math.max(20, currentAqi - 5));
                  setIsRadiusAlertEnabled(true);
                  setDismissedAlert(false);
                }}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulate Trigger</span>
              </button>

              <button
                onClick={() => setIsAlertRadiusModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Save Perimeter Guard
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
