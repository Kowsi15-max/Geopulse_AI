import React, { useState } from "react";
import { 
  BarChart2, 
  TrendingUp, 
  Thermometer, 
  CloudRain, 
  AlertTriangle, 
  ShieldAlert,
  Sprout,
  Activity,
  Droplets,
  Gauge,
  Compass,
  Calendar,
  Clock,
  Wind,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check
} from "lucide-react";
import { LocationReport } from "../types";
import { getSeededRandom } from "../data";
import GeoPulseLogo from "./GeoPulseLogo";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

interface PageAnalysisProps {
  selectedLocation: LocationReport | null;
  isDarkMode: boolean;
}

export default function PageAnalysis({ selectedLocation, isDarkMode }: PageAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"all" | "temperature" | "rainfall" | "aqi">("all");
  
  // Date & Time Picker States
  const [periodType, setPeriodType] = useState<"today" | "yesterday" | "last7" | "last30" | "custom" | "range">("today");
  const [customDate, setCustomDate] = useState<string>("2026-07-15");
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: "2026-07-08", end: "2026-07-15" });
  const [customTime, setCustomTime] = useState<string>("14:30");

  // Dynamic Last Synced Timestamp state
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  React.useEffect(() => {
    // Update timestamp dynamically when telemetry parameters, location, or period change
    setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [selectedLocation, periodType, customDate, customRange, customTime]);

  React.useEffect(() => {
    // Periodic live telemetry pulse refresh (simulated satellite sync)
    const timer = setInterval(() => {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Popover Open/Close states
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Navigations for date calendars
  const [datePickerMonth, setDatePickerMonth] = useState<number>(6); // July (0-indexed)
  const [datePickerYear, setDatePickerYear] = useState<number>(2026);
  const [rangePickerMonth, setRangePickerMonth] = useState<number>(6); // July
  const [rangePickerYear, setRangePickerYear] = useState<number>(2026);

  // Temporary state for Range Picker (Apply button)
  const [tempRangeStart, setTempRangeStart] = useState<string>("2026-07-08");
  const [tempRangeEnd, setTempRangeEnd] = useState<string>("2026-07-15");

  // Temporary state for Time Picker
  const [is12Hour, setIs12Hour] = useState<boolean>(true);
  const [selectedHour, setSelectedHour] = useState<number>(14); // 0-23
  const [selectedMinute, setSelectedMinute] = useState<number>(30); // 0-59

  // Synchronization helpers
  const handleOpenDatePicker = () => {
    if (customDate) {
      const parts = customDate.split("-");
      if (parts.length === 3) {
        setDatePickerYear(parseInt(parts[0], 10));
        setDatePickerMonth(parseInt(parts[1], 10) - 1);
      }
    }
    setIsDatePickerOpen(true);
    setIsRangePickerOpen(false);
    setIsTimePickerOpen(false);
  };

  const handleOpenRangePicker = () => {
    if (customRange.start) {
      const parts = customRange.start.split("-");
      if (parts.length === 3) {
        setRangePickerYear(parseInt(parts[0], 10));
        setRangePickerMonth(parseInt(parts[1], 10) - 1);
      }
    }
    setTempRangeStart(customRange.start);
    setTempRangeEnd(customRange.end);
    setIsRangePickerOpen(true);
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
  };

  const handleOpenTimePicker = () => {
    if (customTime) {
      const [hStr, mStr] = customTime.split(":");
      setSelectedHour(parseInt(hStr, 10));
      setSelectedMinute(parseInt(mStr, 10));
    }
    setIsTimePickerOpen(true);
    setIsDatePickerOpen(false);
    setIsRangePickerOpen(false);
  };

  const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getMaterialHeaderData = (dateStr: string) => {
    if (!dateStr) return { year: "2026", display: "Sat, Jul 18" };
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { year: "2026", display: "Sat, Jul 18" };
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    if (isNaN(dateObj.getTime())) return { year: "2026", display: "Sat, Jul 18" };
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
    return {
      year: y.toString(),
      display: `${dayName}, ${monthName} ${d}`
    };
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (!selectedLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center p-6 max-w-md mx-auto bg-slate-50 dark:bg-[#090E17]">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 dark:text-emerald-400">
            <BarChart2 className="w-10 h-10" />
          </div>
          <span className="text-sm font-bold font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400">
            ANALYTICS DEACTIVATED
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Please search and select a location on the Home page or Explore Map to load climate historical datasets and advanced charts.
          </p>
        </div>
      </div>
    );
  }

  const { lat, lng, telemetry } = selectedLocation;

  // 1. Helper to format selected time into AM/PM
  const formatTimeToAMPM = (time: string) => {
    if (!time) return "12:00 PM";
    const [hourStr, minStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour.toString().padStart(2, "0")}:${minStr} ${ampm}`;
  };

  // 2. Helper to format selected period string
  const formatSelectedPeriod = () => {
    const timeStr = formatTimeToAMPM(customTime);
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    
    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    switch (periodType) {
      case "today":
        return `17 July 2026 • ${timeStr}`;
      case "yesterday":
        return `16 July 2026 • ${timeStr}`;
      case "last7":
        return `11 July 2026 – 17 July 2026 • ${timeStr}`;
      case "last30":
        return `17 June 2026 – 17 July 2026 • ${timeStr}`;
      case "custom":
        return `${formatDateStr(customDate)} • ${timeStr}`;
      case "range":
        return `${formatDateStr(customRange.start)} – ${formatDateStr(customRange.end)} • ${timeStr}`;
      default:
        return `17 July 2026 • ${timeStr}`;
    }
  };

  // 3. Deterministic helper to get period-specific telemetry metrics
  const getPeriodTelemetry = () => {
    // Build deterministic seed key
    let seedString = `${lat}_${lng}`;
    if (periodType === "today") {
      seedString += "_today";
    } else if (periodType === "yesterday") {
      seedString += "_yesterday";
    } else if (periodType === "last7") {
      seedString += "_last7";
    } else if (periodType === "last30") {
      seedString += "_last30";
    } else if (periodType === "custom" && customDate) {
      seedString += `_${customDate}`;
    } else if (periodType === "range") {
      seedString += `_${customRange.start}_${customRange.end}`;
    }
    
    if (customTime) {
      seedString += `_${customTime}`;
    }

    // Hash the seed string to float 0..1
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const factor = Math.abs(Math.sin(hash)) * 1000 - Math.floor(Math.abs(Math.sin(hash)) * 1000);

    // Modify telemetry parameters deterministically but realistically
    const tempOffset = factor * 8 - 4; // -4°C to +4°C
    const humidityOffset = Math.round(factor * 30 - 15); // -15% to +15%
    const aqiOffset = Math.round(factor * 50 - 25); // -25 to +25
    const uvOffset = Math.round(factor * 4 - 2); // -2 to +2
    const pressureOffset = Math.round(factor * 16 - 8); // -8 to +8 hPa
    const windOffset = parseFloat((factor * 12 - 6).toFixed(1)); // -6 to +6 km/h
    const rainOffset = Math.round(factor * 200 - 100); // -100mm to +100mm

    const temp = Math.round((telemetry.temperature + tempOffset) * 10) / 10;
    const aqi = Math.max(5, Math.min(500, telemetry.aqi + aqiOffset));
    const rain = Math.max(0, telemetry.rainfall + rainOffset);
    const hum = Math.max(5, Math.min(100, telemetry.humidity + humidityOffset));
    const wind = Math.max(0, telemetry.windSpeed + windOffset);
    const press = Math.max(900, Math.min(1100, telemetry.pressure + pressureOffset));
    const uv = Math.max(1, Math.min(12, telemetry.uvIndex + uvOffset));
    
    const ndviVal = Math.max(0.01, Math.min(1.0, telemetry.ndvi + (factor * 0.12 - 0.06)));
    const ndvi = Math.round(ndviVal * 100) / 100;
    const floodRisk = Math.min(100, Math.max(5, Math.round((rain / 35) + (hum * 0.35) + factor * 25)));

    return {
      temperature: temp,
      aqi,
      rainfall: rain,
      humidity: hum,
      windSpeed: wind,
      pressure: press,
      uvIndex: uv,
      ndvi,
      floodRisk,
      tempAnomaly: telemetry.tempAnomaly,
      climateRisk: telemetry.climateRisk,
      riskFactor: telemetry.riskFactor,
      deforestation: telemetry.deforestation
    };
  };

  const periodTelemetry = getPeriodTelemetry();

  // 4. Helper to generate chart trend data depending on selection
  const getPeriodChartData = () => {
    const base = periodTelemetry;
    
    if (periodType === "today" || periodType === "yesterday" || periodType === "custom") {
      // 12 data points representing hourly progression (every 2 hours)
      const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
      return hours.map((h) => {
        const seedVal = getSeededRandom(lat + h, lng + (periodType === "yesterday" ? 50 : 80));
        // Sinusoidal temperature wave (warmest in afternoon, coolest at dawn)
        const temp = Math.round((base.temperature + Math.sin((h - 8) / 24 * 2 * Math.PI) * 4.5 + (seedVal * 1.5 - 0.75)) * 10) / 10;
        // AQI peaks during standard peak intervals
        const aqi = Math.max(5, Math.round(base.aqi + Math.sin((h - 4) / 12 * Math.PI) * 12 + seedVal * 10));
        const rain = Math.round(Math.max(0, base.rainfall / 12 + (seedVal > 0.75 ? seedVal * 20 : 0)));
        const ndvi = Math.max(0.01, Math.min(1.0, base.ndvi + (seedVal * 0.04 - 0.02)));
        const risk = Math.max(5, Math.min(100, base.climateRisk + Math.round(seedVal * 8 - 4)));

        const timeLabel = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
        return {
          label: timeLabel,
          Temperature: temp,
          Rainfall: rain,
          AQI: aqi,
          ClimateRisk: risk,
          Vegetation: ndvi
        };
      });
    } else if (periodType === "last7") {
      const days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
      return days.map((day, idx) => {
        const seedVal = getSeededRandom(lat + idx * 4, lng - 22);
        const temp = Math.round((base.temperature + (seedVal * 3.6 - 1.8)) * 10) / 10;
        const aqi = Math.max(5, Math.round(base.aqi + (seedVal * 18 - 9)));
        const rain = Math.round(Math.max(0, base.rainfall / 6 + (seedVal * 50 - 25)));
        const ndvi = Math.max(0.01, Math.min(1.0, base.ndvi + (seedVal * 0.05 - 0.025)));
        const risk = Math.max(5, Math.min(100, base.climateRisk + Math.round(seedVal * 10 - 5)));
        return {
          label: day,
          Temperature: temp,
          Rainfall: rain,
          AQI: aqi,
          ClimateRisk: risk,
          Vegetation: ndvi
        };
      });
    } else if (periodType === "last30") {
      const intervals = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
      return intervals.map((interval, idx) => {
        const seedVal = getSeededRandom(lat - idx * 6, lng + 18);
        const temp = Math.round((base.temperature + (seedVal * 4.2 - 2.1)) * 10) / 10;
        const aqi = Math.max(5, Math.round(base.aqi + (seedVal * 26 - 13)));
        const rain = Math.round(Math.max(0, base.rainfall / 3 + (seedVal * 80 - 40)));
        const ndvi = Math.max(0.01, Math.min(1.0, base.ndvi + (seedVal * 0.06 - 0.03)));
        const risk = Math.max(5, Math.min(100, base.climateRisk + Math.round(seedVal * 12 - 6)));
        return {
          label: interval,
          Temperature: temp,
          Rainfall: rain,
          AQI: aqi,
          ClimateRisk: risk,
          Vegetation: ndvi
        };
      });
    } else { // Custom range
      const steps = ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6", "Point 7", "Point 8"];
      return steps.map((step, idx) => {
        const seedVal = getSeededRandom(lat + idx * 8, lng - idx * 4);
        const temp = Math.round((base.temperature + (seedVal * 4.8 - 2.4)) * 10) / 10;
        const aqi = Math.max(5, Math.round(base.aqi + (seedVal * 30 - 15)));
        const rain = Math.round(Math.max(0, base.rainfall / 4 + (seedVal * 90 - 45)));
        const ndvi = Math.max(0.01, Math.min(1.0, base.ndvi + (seedVal * 0.06 - 0.03)));
        const risk = Math.max(5, Math.min(100, base.climateRisk + Math.round(seedVal * 14 - 7)));
        return {
          label: step,
          Temperature: temp,
          Rainfall: rain,
          AQI: aqi,
          ClimateRisk: risk,
          Vegetation: ndvi
        };
      });
    }
  };

  const periodChartData = getPeriodChartData();

  // 5. Compute trends block from periodChartData
  const firstPeriodData = periodChartData[0] || { Temperature: 0, AQI: 0, Rainfall: 0, ClimateRisk: 0, Vegetation: 0 };
  const lastPeriodData = periodChartData[periodChartData.length - 1] || { Temperature: 0, AQI: 0, Rainfall: 0, ClimateRisk: 0, Vegetation: 0 };
  const tempDiff = lastPeriodData.Temperature - firstPeriodData.Temperature;
  const aqiDiff = lastPeriodData.AQI - firstPeriodData.AQI;
  const avgPrecip = Math.round(periodChartData.reduce((acc, curr) => acc + curr.Rainfall, 0) / Math.max(1, periodChartData.length));
  const ndviTrend = lastPeriodData.Vegetation > firstPeriodData.Vegetation ? "Improving" : "Degrading";

  const warmingDescriptor = tempDiff > 0.4 ? "Warming Gradient Vector" : tempDiff < -0.4 ? "Cooling Slope Vector" : "Thermal Equilibrium State";
  const aqiDescriptor = aqiDiff > 8 ? "Increasing Aerosol Particulates" : aqiDiff < -8 ? "Aerosol Deposition/Cleansing" : "Atmospheric Particle Equilibrium";

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-6 max-w-5xl mx-auto transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
              <GeoPulseLogo size={36} showText={false} />
              <span className="text-slate-900 dark:text-white">Environmental Analysis</span>
            </h1>
            <p className="text-xs mt-2.5 font-mono uppercase text-slate-500 dark:text-slate-400">
              Detailed weather trends, air quality analytics, and location history for: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedLocation.name}</span>
            </p>
          </div>

          {/* View Options */}
          <div className={`flex gap-1.5 p-1 border rounded-xl text-xs font-semibold shrink-0 ${
            isDarkMode 
              ? "bg-[#0F172A] border-slate-800 text-slate-200" 
              : "bg-white border-slate-200 shadow-xs text-slate-700"
          }`}>
            {[
              { id: "all", label: "Dashboard" },
              { id: "temperature", label: "Temperature" },
              { id: "rainfall", label: "Rainfall" },
              { id: "aqi", label: "Air Quality" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                  activeTab === btn.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* TIME PROFILE CONTROLLER (Aesthetic & Professional Multi-Period Selector) */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-200 ${
          isDarkMode 
            ? "border-slate-800/80 bg-[#0F172A] text-slate-100 shadow-xs" 
            : "border-slate-200/90 bg-white text-slate-800 shadow-xs"
        }`}>
          <div className="flex items-center gap-2 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Select Analytics Temporal Filter</span>
          </div>

          {/* Preset Buttons Grid */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "last7", label: "Last 7 Days" },
              { id: "last30", label: "Last 30 Days" },
              { id: "custom", label: "Custom Date" },
              { id: "range", label: "Custom Date Range" }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPeriodType(preset.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  periodType === preset.id
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-2xs"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Conditional Controls Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-1 border-t border-sky-500/10 pt-3">
            
            {/* Custom Date Picker */}
            {periodType === "custom" && (
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-mono font-black uppercase text-emerald-600 dark:text-[#60A5FA] tracking-wider">Target Date Selection</label>
                <button
                  type="button"
                  onClick={handleOpenDatePicker}
                  className={`w-full h-[38px] border rounded-xl px-3 flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none ${
                    isDarkMode
                      ? "bg-[#0F172A] border-slate-800 text-[#F8FAFC] hover:border-sky-500/40"
                      : "bg-white border-slate-200 text-slate-800 hover:border-emerald-500/40 shadow-2xs"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDarkMode ? "text-sky-400" : "text-emerald-600"}`} />
                    <span className="text-xs font-mono font-bold">{formatDateToDDMMYYYY(customDate)}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                </button>

                {isDatePickerOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    {/* Click-away backdrop */}
                    <div className="absolute inset-0" onClick={() => setIsDatePickerOpen(false)} />
                    
                    {/* Material Dialog Container */}
                    <div className={`relative w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden z-10 text-left transition-all border ${
                      isDarkMode ? "bg-[#0F172A] border-slate-700/80 text-white shadow-cyan-950/40" : "bg-white text-slate-900 border-slate-200/80 shadow-2xl shadow-blue-900/15"
                    }`}>
                      {/* Vibrant Material Header Banner */}
                      <div className="bg-emerald-600 p-6 text-white flex flex-col gap-1 relative overflow-hidden shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-100 tracking-wider uppercase font-mono">
                          <span>Select Date</span>
                          <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs">
                            {getMaterialHeaderData(customDate).year}
                          </span>
                        </div>
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-xs mt-1">
                          {getMaterialHeaderData(customDate).display}
                        </span>
                      </div>

                      {/* Month & Year Navigator */}
                      <div className="p-5 pb-3">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (datePickerMonth === 0) {
                                setDatePickerMonth(11);
                                setDatePickerYear(prev => prev - 1);
                              } else {
                                setDatePickerMonth(prev => prev - 1);
                              }
                            }}
                            className={`p-2 rounded-full transition-all cursor-pointer ${
                              isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-base font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                              {MONTHS_NAMES[datePickerMonth]}
                            </span>
                            <select
                              value={datePickerYear}
                              onChange={(e) => setDatePickerYear(parseInt(e.target.value, 10))}
                              className={`text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer border transition-all ${
                                isDarkMode
                                  ? "bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-500"
                                  : "bg-slate-50 border-slate-200 text-blue-700 hover:border-blue-400 shadow-xs"
                              }`}
                            >
                              {Array.from({ length: 21 }, (_, i) => 2020 + i).map(y => (
                                <option key={y} value={y} className={isDarkMode ? "bg-slate-900 text-white font-semibold" : "bg-white text-slate-900 font-semibold"}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (datePickerMonth === 11) {
                                setDatePickerMonth(0);
                                setDatePickerYear(prev => prev + 1);
                              } else {
                                setDatePickerMonth(prev => prev + 1);
                              }
                            }}
                            className={`p-2 rounded-full transition-all cursor-pointer ${
                              isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                            }`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                            <span key={idx} className={`text-xs font-bold uppercase ${
                              idx === 0 || idx === 6 
                                ? (isDarkMode ? "text-amber-400/90" : "text-amber-600") 
                                : (isDarkMode ? "text-slate-400" : "text-slate-500")
                            }`}>
                              {day}
                            </span>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: getFirstDayOfMonth(datePickerYear, datePickerMonth) }).map((_, idx) => (
                            <div key={`spacer-${idx}`} className="h-9" />
                          ))}
                          {Array.from({ length: getDaysInMonth(datePickerYear, datePickerMonth) }).map((_, idx) => {
                            const dayVal = idx + 1;
                            const dateStr = `${datePickerYear}-${(datePickerMonth + 1).toString().padStart(2, "0")}-${dayVal.toString().padStart(2, "0")}`;
                            const isSelected = customDate === dateStr;
                            return (
                              <button
                                key={`day-${dayVal}`}
                                type="button"
                                onClick={() => setCustomDate(dateStr)}
                                className={`h-9 w-9 mx-auto text-xs font-bold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/35 scale-110 ring-2 ring-blue-300/50"
                                    : isDarkMode
                                    ? "text-slate-200 hover:bg-slate-800 hover:text-cyan-400"
                                    : "text-slate-800 hover:bg-blue-50 hover:text-blue-600 font-semibold"
                                }`}
                              >
                                {dayVal}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Material Actions Footer */}
                      <div className={`flex items-center justify-between px-5 py-3.5 border-t ${
                        isDarkMode ? "border-slate-800/80 bg-slate-900/60" : "border-slate-100 bg-slate-50/80"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setCustomDate("2026-07-15")}
                          className="text-xs font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Clear
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(false)}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              isDarkMode 
                                ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" 
                                : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(false)}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Set Date
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Date Range Picker */}
            {periodType === "range" && (
              <div className="flex flex-col gap-1.5 relative md:col-span-1">
                <label className="text-[10px] font-mono font-black uppercase text-emerald-600 dark:text-[#60A5FA] tracking-wider">Date Range Selection</label>
                <button
                  type="button"
                  onClick={handleOpenRangePicker}
                  className={`w-full h-[38px] border rounded-xl px-3 flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none ${
                    isDarkMode
                      ? "bg-[#0F172A] border-slate-800 text-[#F8FAFC] hover:border-sky-500/40"
                      : "bg-white border-slate-200 text-slate-800 hover:border-emerald-500/40 shadow-2xs"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDarkMode ? "text-sky-400" : "text-emerald-600"}`} />
                    <span className="text-xs font-mono font-bold truncate">
                      {formatDateToDDMMYYYY(customRange.start)} — {formatDateToDDMMYYYY(customRange.end)}
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                </button>

                {isRangePickerOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    {/* Click-away backdrop */}
                    <div className="absolute inset-0" onClick={() => setIsRangePickerOpen(false)} />
                    
                    {/* Material Dialog Container */}
                    <div className={`relative w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden z-10 text-left transition-all border ${
                      isDarkMode ? "bg-[#0F172A] border-slate-700/80 text-white shadow-cyan-950/40" : "bg-white text-slate-900 border-slate-200/80 shadow-2xl shadow-blue-900/15"
                    }`}>
                      {/* Vibrant Material Header Banner */}
                      <div className="bg-emerald-600 p-6 text-white flex flex-col gap-1 relative overflow-hidden shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-100 tracking-wider uppercase font-mono">
                          <span>Date Range Selection</span>
                          <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs">
                            {rangePickerYear}
                          </span>
                        </div>
                        <span className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-xs mt-1">
                          {tempRangeStart ? getMaterialHeaderData(tempRangeStart).display : "Start"} — {tempRangeEnd ? getMaterialHeaderData(tempRangeEnd).display : "End"}
                        </span>
                      </div>

                      {/* Month & Year Navigator */}
                      <div className="p-5 pb-3">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (rangePickerMonth === 0) {
                                setRangePickerMonth(11);
                                setRangePickerYear(prev => prev - 1);
                              } else {
                                setRangePickerMonth(prev => prev - 1);
                              }
                            }}
                            className={`p-2 rounded-full transition-all cursor-pointer ${
                              isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-base font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                              {MONTHS_NAMES[rangePickerMonth]}
                            </span>
                            <select
                              value={rangePickerYear}
                              onChange={(e) => setRangePickerYear(parseInt(e.target.value, 10))}
                              className={`text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer border transition-all ${
                                isDarkMode
                                  ? "bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-500"
                                  : "bg-slate-50 border-slate-200 text-blue-700 hover:border-blue-400 shadow-xs"
                              }`}
                            >
                              {Array.from({ length: 21 }, (_, i) => 2020 + i).map(y => (
                                <option key={y} value={y} className={isDarkMode ? "bg-slate-900 text-white font-semibold" : "bg-white text-slate-900 font-semibold"}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (rangePickerMonth === 11) {
                                setRangePickerMonth(0);
                                setRangePickerYear(prev => prev + 1);
                              } else {
                                setRangePickerMonth(prev => prev + 1);
                              }
                            }}
                            className={`p-2 rounded-full transition-all cursor-pointer ${
                              isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                            }`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                            <span key={idx} className={`text-xs font-bold uppercase ${
                              idx === 0 || idx === 6 
                                ? (isDarkMode ? "text-amber-400/90" : "text-amber-600") 
                                : (isDarkMode ? "text-slate-400" : "text-slate-500")
                            }`}>
                              {day}
                            </span>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: getFirstDayOfMonth(rangePickerYear, rangePickerMonth) }).map((_, idx) => (
                            <div key={`range-spacer-${idx}`} className="h-9" />
                          ))}
                          {Array.from({ length: getDaysInMonth(rangePickerYear, rangePickerMonth) }).map((_, idx) => {
                            const dayVal = idx + 1;
                            const dateStr = `${rangePickerYear}-${(rangePickerMonth + 1).toString().padStart(2, "0")}-${dayVal.toString().padStart(2, "0")}`;
                            
                            const isStart = tempRangeStart === dateStr;
                            const isEnd = tempRangeEnd === dateStr;
                            const isInRange = tempRangeStart && tempRangeEnd && dateStr > tempRangeStart && dateStr < tempRangeEnd;

                            return (
                              <button
                                key={`range-day-${dayVal}`}
                                type="button"
                                onClick={() => {
                                  if (!tempRangeStart || (tempRangeStart && tempRangeEnd)) {
                                    setTempRangeStart(dateStr);
                                    setTempRangeEnd("");
                                  } else {
                                    if (dateStr < tempRangeStart) {
                                      setTempRangeStart(dateStr);
                                    } else {
                                      setTempRangeEnd(dateStr);
                                    }
                                  }
                                }}
                                className={`h-9 w-9 mx-auto text-xs font-bold flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                  isStart || isEnd
                                    ? "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black rounded-full shadow-lg shadow-blue-500/35 scale-110 ring-2 ring-blue-300/50 z-10"
                                    : isInRange
                                    ? "bg-blue-500/20 text-blue-700 dark:text-cyan-300 font-bold rounded-full border border-blue-400/30"
                                    : isDarkMode
                                    ? "text-slate-200 hover:bg-slate-800 hover:text-cyan-400 rounded-full"
                                    : "text-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-full font-semibold"
                                }`}
                              >
                                {dayVal}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Material Actions Footer */}
                      <div className={`flex items-center justify-between px-5 py-3.5 border-t ${
                        isDarkMode ? "border-slate-800/80 bg-slate-900/60" : "border-slate-100 bg-slate-50/80"
                      }`}>
                        <button
                          type="button"
                          onClick={() => {
                            setTempRangeStart("2026-07-08");
                            setTempRangeEnd("2026-07-15");
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Clear
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsRangePickerOpen(false)}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              isDarkMode 
                                ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" 
                                : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!tempRangeStart || !tempRangeEnd}
                            onClick={() => {
                              if (tempRangeStart && tempRangeEnd) {
                                setCustomRange({ start: tempRangeStart, end: tempRangeEnd });
                                setIsRangePickerOpen(false);
                              }
                            }}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Set Range
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Always Render empty spacing if neither custom nor range to keep layout balanced */}
            {periodType !== "custom" && periodType !== "range" && (
              <div className="hidden md:block" />
            )}

            {/* Time Selector Popover */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-mono font-black uppercase text-emerald-600 dark:text-[#60A5FA] tracking-wider">Specific Time Select (Hour/Minute)</label>
              <button
                type="button"
                onClick={handleOpenTimePicker}
                className={`w-full h-[38px] border rounded-xl px-3 flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none ${
                  isDarkMode
                    ? "bg-[#0F172A] border-slate-800 text-[#F8FAFC] hover:border-sky-500/40"
                    : "bg-white border-slate-200 text-slate-800 hover:border-emerald-500/40 shadow-2xs"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isDarkMode ? "text-sky-400" : "text-emerald-600"}`} />
                  <span className="text-xs font-mono font-bold">{formatTimeToAMPM(customTime)}</span>
                </span>
                <ChevronDown className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
              </button>

              {isTimePickerOpen && (
                <>
                  {/* Click-away backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsTimePickerOpen(false)} />
                  
                  {/* Time Popover */}
                  <div className={`absolute top-[calc(100%+8px)] right-0 z-50 w-64 border rounded-2xl shadow-2xl p-4 text-left ${
                    isDarkMode
                      ? "bg-[#0F172A] border-slate-800 text-[#F8FAFC]"
                      : "bg-white border-slate-200 text-slate-800 shadow-xl"
                  }`}>
                    {/* Format Selector */}
                    <div className={`flex items-center justify-between mb-3 pb-2 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                      <span className={`text-[10px] font-mono font-bold uppercase ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Time Format</span>
                      <div className={`flex gap-1 p-0.5 border rounded-lg ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <button
                          type="button"
                          onClick={() => setIs12Hour(true)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                            is12Hour ? "bg-emerald-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          12H
                        </button>
                        <button
                          type="button"
                          onClick={() => setIs12Hour(false)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                            !is12Hour ? "bg-emerald-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          24H
                        </button>
                      </div>
                    </div>

                    {/* Numeric Selector Display */}
                    <div className={`flex items-center justify-between border p-2.5 rounded-xl mb-3 ${
                      isDarkMode
                        ? "bg-slate-900/60 border-slate-800/80"
                        : "bg-slate-50 border-slate-200"
                    }`}>
                      {/* Hour selector */}
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Hour</span>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border ${
                          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                        }`}>
                          <button
                            type="button"
                            onClick={() => {
                              if (is12Hour) {
                                const current12 = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
                                let next12 = current12 - 1;
                                if (next12 < 1) next12 = 12;
                                let h24 = next12 % 12;
                                if (selectedHour >= 12) h24 += 12;
                                setSelectedHour(h24);
                              } else {
                                let h = selectedHour - 1;
                                if (h < 0) h = 23;
                                setSelectedHour(h);
                              }
                            }}
                            className={`text-[10px] font-mono font-bold px-1 cursor-pointer ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-sky-400 w-5 text-center">
                            {(is12Hour ? (selectedHour % 12 === 0 ? 12 : selectedHour % 12) : selectedHour).toString().padStart(2, "0")}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (is12Hour) {
                                const current12 = selectedHour % 12 === 0 ? 12 : selectedHour % 12;
                                let next12 = current12 + 1;
                                if (next12 > 12) next12 = 1;
                                let h24 = next12 % 12;
                                if (selectedHour >= 12) h24 += 12;
                                setSelectedHour(h24);
                              } else {
                                let h = selectedHour + 1;
                                if (h > 23) h = 0;
                                setSelectedHour(h);
                              }
                            }}
                            className={`text-[10px] font-mono font-bold px-1 cursor-pointer ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <span className={`text-lg font-bold ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>:</span>

                      {/* Minute selector */}
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Minute</span>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border ${
                          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                        }`}>
                          <button
                            type="button"
                            onClick={() => {
                              let m = selectedMinute - 1;
                              if (m < 0) m = 59;
                              setSelectedMinute(m);
                            }}
                            className={`text-[10px] font-mono font-bold px-1 cursor-pointer ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-sky-400 w-5 text-center">
                            {selectedMinute.toString().padStart(2, "0")}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              let m = selectedMinute + 1;
                              if (m > 59) m = 0;
                              setSelectedMinute(m);
                            }}
                            className={`text-[10px] font-mono font-bold px-1 cursor-pointer ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* AM/PM selector if 12H */}
                      {is12Hour && (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Period</span>
                          <button
                            type="button"
                            onClick={() => {
                              const isPM = selectedHour >= 12;
                              let h24 = selectedHour % 12;
                              if (!isPM) {
                                h24 += 12;
                              }
                              setSelectedHour(h24);
                            }}
                            className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer leading-tight uppercase ${
                              isDarkMode
                                ? "text-white bg-slate-800 border-slate-700 hover:border-sky-500/40"
                                : "text-slate-900 bg-white border-slate-200 hover:border-emerald-500/40"
                            }`}
                          >
                            {selectedHour >= 12 ? "PM" : "AM"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hour options grid */}
                    <div className="mb-3">
                      <span className={`text-[8px] font-mono uppercase block mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Select Hour</span>
                      {is12Hour ? (
                        <div className="grid grid-cols-4 gap-1">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                            const currentH12 = selectedHour % 12 === 0 ? 12 : selectedHour % 12;
                            const isSelected = currentH12 === h;
                            return (
                              <button
                                key={`h12-${h}`}
                                type="button"
                                onClick={() => {
                                  let h24 = h % 12;
                                  if (selectedHour >= 12) h24 += 12;
                                  setSelectedHour(h24);
                                }}
                                className={`py-1 rounded text-2xs font-mono font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white font-black"
                                    : isDarkMode
                                    ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {h}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto">
                          {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                            const isSelected = selectedHour === h;
                            return (
                              <button
                                key={`h24-${h}`}
                                type="button"
                                onClick={() => setSelectedHour(h)}
                                className={`py-1 rounded text-2xs font-mono font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white font-black"
                                    : isDarkMode
                                    ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {h.toString().padStart(2, "0")}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Minute options grid */}
                    <div className="mb-3">
                      <span className={`text-[8px] font-mono uppercase block mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Select Minute</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                          const isSelected = selectedMinute === m;
                          return (
                            <button
                              key={`m-${m}`}
                              type="button"
                              onClick={() => {
                                setSelectedMinute(m);
                                // Save and close automatically after selection
                                const finalTimeStr = `${selectedHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                                setCustomTime(finalTimeStr);
                                setIsTimePickerOpen(false);
                              }}
                              className={`py-1 rounded text-2xs font-mono font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white font-black"
                                  : isDarkMode
                                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {m.toString().padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Done Action Footer */}
                    <div className={`flex gap-2 pt-2 border-t justify-end ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const finalTimeStr = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
                          setCustomTime(finalTimeStr);
                          setIsTimePickerOpen(false);
                        }}
                        className="w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer text-center font-mono shadow-xs"
                      >
                        Done / Confirm
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC DATA HEADER & LAST SYNCED INDICATOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-200 dark:border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase font-mono">
            Diagnostic Telemetry Data
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Epoch badge */}
          <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 rounded-xl px-3 py-1.5 shadow-2xs leading-none uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Analysis Epoch: {formatSelectedPeriod()}</span>
          </div>

          {/* Dynamic Last Synced Timestamp Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-extrabold">Last synced:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">{lastSyncedTime}</span>
          </div>
        </div>
      </div>

      {/* 9 PARAMETERS LIVE ENVIRONMENTAL TELEMETRY GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* 1. Temperature */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-rose-300 dark:hover:border-rose-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Temperature
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.temperature.toFixed(1)}°C
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">Feels like: {Math.round(periodTelemetry.temperature + (periodTelemetry.humidity > 60 ? 1 : -1))}°C</span>
        </div>

        {/* 2. AQI */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Air Quality (AQI)
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.aqi}
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium capitalize text-slate-500 dark:text-slate-400">
            Category: {periodTelemetry.aqi <= 50 ? "Excellent" : periodTelemetry.aqi <= 100 ? "Good" : "Moderate/Unhealthy"}
          </span>
        </div>

        {/* 3. Rainfall */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-sky-300 dark:hover:border-sky-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <CloudRain className="w-3.5 h-3.5 text-sky-500" /> Precipitation
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.rainfall} mm
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">Accumulation vector</span>
        </div>

        {/* 4. Humidity */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-blue-300 dark:hover:border-blue-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Droplets className="w-3.5 h-3.5 text-blue-500" /> Relative Humidity
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.humidity}%
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">Atmospheric moisture content</span>
        </div>

        {/* 5. Wind Speed */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-teal-300 dark:hover:border-teal-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Wind className="w-3.5 h-3.5 text-teal-500" /> Wind Velocity
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.windSpeed} km/h
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">Atmospheric vectors active</span>
        </div>

        {/* 6. Pressure */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-cyan-300 dark:hover:border-cyan-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-500" /> Barometric Pressure
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.pressure} hPa
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">Atmospheric force indicator</span>
        </div>

        {/* 7. UV Index */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-amber-300 dark:hover:border-amber-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> UV Exposure Index
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.uvIndex} / 12
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">
            Risk: {periodTelemetry.uvIndex <= 2 ? "Minimal" : periodTelemetry.uvIndex <= 5 ? "Moderate" : periodTelemetry.uvIndex <= 7 ? "High" : "Extreme"}
          </span>
        </div>

        {/* 8. Vegetation NDVI */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <Sprout className="w-3.5 h-3.5 text-emerald-500" /> NDVI Vegetation
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.ndvi}
            </p>
          </div>
          <span className="text-[9px] mt-2 block truncate font-medium text-slate-500 dark:text-slate-400">
            {periodTelemetry.ndvi > 0.7 ? "Dense Forest Canopy" : periodTelemetry.ndvi > 0.4 ? "Moderate Green Canopy" : "Sparse Vegetation"}
          </span>
        </div>

        {/* 9. Flood Risk */}
        <div className="p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-rose-300 dark:hover:border-rose-900/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest flex items-center gap-1.5 uppercase font-bold text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Flood Risk Index
            </span>
            <p className="text-xl font-black mt-2 font-mono text-slate-900 dark:text-white">
              {periodTelemetry.floodRisk} / 100
            </p>
          </div>
          <span className="text-[9px] mt-2 block font-medium text-slate-500 dark:text-slate-400">
            Status: {periodTelemetry.floodRisk > 60 ? "Elevated Alert" : periodTelemetry.floodRisk > 30 ? "Moderate Margin" : "Low / Stable"}
          </span>
        </div>
      </div>

      {/* COGNITIVE ENVIRONMENTAL TREND AUDIT (Highly Polished Card) */}
      <div className="rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs overflow-hidden text-left flex flex-col">
        {/* Header Container */}
        <div className="py-4 px-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center py-0.5">
              <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest font-mono leading-tight mb-1">
                COGNITIVE ENVIRONMENTAL TREND AUDIT
              </h3>
              <h4 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                {warmingDescriptor} & {aqiDescriptor}
              </h4>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0 self-start md:self-center leading-none font-bold">
            MULTITEMPORAL TELEMETRY MODEL ACTIVE
          </span>
        </div>

        {/* Dynamic Prose Narrative / AI Analysis */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-300">
            An advanced environmental telemetry audit for <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedLocation.name}</span> over the selected timeframe (<span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatSelectedPeriod()}</span>) shows an immediate microclimatic temperature baseline of <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.temperature.toFixed(1)}°C</span>. 
            Atmospheric conditions reveal a real-time relative humidity of <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.humidity}%</span>, coupled with a barometric pressure of <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.pressure} hPa</span> and sustained wind vectors of <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.windSpeed} km/h</span>. 
            Modern canopy modeling records a fractional vegetative density of <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.ndvi}</span>, reflecting a <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.ndvi > 0.7 ? "dense tropical forest" : periodTelemetry.ndvi > 0.4 ? "moderate forest canopy" : "sparse or arid shrubland"}</span> trajectory, which heavily influences regional microclimate heat sinks and water retention capacities. With a localized flood risk index of <span className="text-amber-500 font-bold">{periodTelemetry.floodRisk}/100</span>, the area's ecological resiliency shows a <span className="text-emerald-700 dark:text-emerald-400 font-bold">{periodTelemetry.floodRisk > 60 ? "highly vulnerable" : periodTelemetry.floodRisk > 30 ? "moderate" : "stable"}</span> moisture/hydric footprint.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
            <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase font-bold">MEAN PERIOD TEMPERATURE SHIFT</span>
              <span className="text-base font-black text-rose-500 mt-1 block font-mono">
                {tempDiff >= 0 ? `+${tempDiff.toFixed(2)}°C` : `${tempDiff.toFixed(2)}°C`}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">Warming slope gradient</span>
            </div>

            <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase font-bold">AQI SHIFT INDEX</span>
              <span className={`text-base font-black mt-1 block font-mono ${aqiDiff >= 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {aqiDiff >= 0 ? `+${aqiDiff} AQI Points` : `${aqiDiff} AQI Points`}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">Pollution accumulation vector</span>
            </div>

            <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase font-bold">CANOPY TRAJECTORY</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">{ndviTrend} Canopy</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">Vegetative sequestration trend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Visualization Layout */}
      <div className="flex flex-col gap-6">
        
        {/* TEMPERATURE CHART */}
        {(activeTab === "all" || activeTab === "temperature") && (
          <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-rose-500" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Temperature Profile Wave</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">SELECTED EPOCH SLIDE (°C)</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={periodChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="label" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="JetBrains Mono" unit="°C" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#e2e8f0", borderRadius: "8px", fontSize: "12px", color: isDarkMode ? "#f8fafc" : "#0f172a" }} 
                  />
                  <Area type="monotone" dataKey="Temperature" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* RAINFALL CHART */}
        {(activeTab === "all" || activeTab === "rainfall") && (
          <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-500" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Precipitation Volumetrics</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">WATER DEPOSITION OVER PERIOD (MM)</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="label" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="JetBrains Mono" unit="mm" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#e2e8f0", borderRadius: "8px", fontSize: "12px", color: isDarkMode ? "#f8fafc" : "#0f172a" }} 
                  />
                  <Bar dataKey="Rainfall" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AQI & CLIMATE RISK CHART */}
        {(activeTab === "all" || activeTab === "aqi") && (
          <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Atmospheric Pollution & Risk Indexes</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">TIME VARIANT RESPONSE TREND</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="label" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#e2e8f0", borderRadius: "8px", fontSize: "12px", color: isDarkMode ? "#f8fafc" : "#0f172a" }} 
                  />
                  <Line type="monotone" name="Air Quality (AQI)" dataKey="AQI" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Climate Risk Index" dataKey="ClimateRisk" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
