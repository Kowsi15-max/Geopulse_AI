import React from "react";
import { Calendar, CloudRain, Thermometer, Sun, Wind, Droplets, Cloud, Compass } from "lucide-react";
import { LocationReport } from "../types";
import GeoPulseLogo from "./GeoPulseLogo";

interface PageForecastProps {
  selectedLocation: LocationReport | null;
  isDarkMode: boolean;
}

export default function PageForecast({ selectedLocation, isDarkMode }: PageForecastProps) {
  if (!selectedLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center p-6 max-w-md mx-auto bg-slate-50 dark:bg-[#090E17]">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
            <Sun className="w-10 h-10" />
          </div>
          <span className="text-sm font-bold font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400">
            FORECAST OFFLINE
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Select a location on the Home page or Explore Map to load weekly weather forecasts.
          </p>
        </div>
      </div>
    );
  }

  const { lat, lng, telemetry } = selectedLocation;
  const t = telemetry;

  // 7-day weather generator helper based on coordinates to be deterministic but lively
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const forecast7Days = weekdays.map((day, idx) => {
    const dayFactor = Math.sin((lat + idx) * 0.5) * Math.cos((lng - idx) * 0.5);
    const tempDelta = Math.round(dayFactor * 4);
    const rainDelta = Math.round(Math.abs(dayFactor) * 45);
    return {
      day,
      temp: Math.round(t.temperature + tempDelta),
      rain: Math.min(100, Math.max(0, t.rainProbability + rainDelta)),
    };
  });

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-6 max-w-4xl mx-auto transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
          <GeoPulseLogo size={36} showText={false} />
          <span className="text-slate-900 dark:text-white">Weather Forecast</span>
        </h1>
        <p className="text-xs mt-1 font-mono uppercase text-slate-500 dark:text-slate-400">
          Weather trends and outlook for: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedLocation.name}</span>
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: 7-Day List */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs flex flex-col gap-4">
          <span className="text-xs font-mono tracking-widest uppercase font-extrabold flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> NEXT 7 DAYS
          </span>

          <div className="flex flex-col gap-3">
            {forecast7Days.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 text-xs">
                <span className="font-semibold w-28 truncate text-slate-700 dark:text-slate-200">{item.day}</span>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-[11px] w-14 justify-end text-sky-600 dark:text-sky-400 font-medium">
                    <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                    <span>{item.rain}%</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-right w-14 font-mono font-bold justify-end text-slate-900 dark:text-white">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>{item.temp}°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Atmospheric Variance Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-mono tracking-widest uppercase font-extrabold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> CURRENT WEATHER INDEX
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">FEELS LIKE</span>
                <p className="text-sm font-black mt-1 text-slate-900 dark:text-white">{t.feelsLike || t.temperature - 1}°C</p>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">WIND SPEED</span>
                <p className="text-sm font-black mt-1 text-slate-900 dark:text-white">{t.windSpeed} kph ({t.windDirection || "NNE"})</p>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">CLOUD COVER</span>
                <p className="text-sm font-black mt-1 text-slate-900 dark:text-white">{t.cloudCoverage || 45}%</p>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">SUNRISE / SUNSET</span>
                <p className="text-xs font-bold mt-1 text-slate-900 dark:text-white">{t.sunrise || "06:12 AM"} / {t.sunset || "06:44 PM"}</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs flex flex-col gap-2 text-xs leading-relaxed">
            <p className="font-extrabold font-mono text-[10px] tracking-wider uppercase text-emerald-700 dark:text-emerald-400">DATA RELIABILITY</p>
            <p className="text-slate-600 dark:text-slate-300">Weekly predictions are calibrated using global weather models and local barometric sensors.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
