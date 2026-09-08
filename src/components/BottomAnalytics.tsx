import React, { useState } from "react";
import { ChevronDown, ChevronUp, BarChart2, TrendingUp, Thermometer, CloudRain, AlertTriangle } from "lucide-react";
import { LocationReport } from "../types";
import { getSeededRandom } from "../data";
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
} from "recharts";

interface BottomAnalyticsProps {
  selectedLocation: LocationReport | null;
}

export default function BottomAnalytics({ selectedLocation }: BottomAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"temperature" | "rainfall" | "aqi">("temperature");

  if (!selectedLocation) return null;

  const { lat, lng, telemetry, historical } = selectedLocation;
  const seed = getSeededRandom(lat, lng);

  // Generative 9-year historical trend (2018 - 2026)
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const trendData = years.map((year, idx) => {
    const yearSeed = getSeededRandom(lat + year, lng);
    const yrData = historical[year] || {};
    
    // Simulate consistent temperature, rainfall, and AQI values across years
    const temp = yrData.temperature ?? Math.round((telemetry.temperature - (2026 - year) * 0.15 + (yearSeed * 2 - 1)) * 10) / 10;
    const rain = yrData.rainfall ?? Math.round(Math.max(50, telemetry.rainfall - (2026 - year) * 12 + yearSeed * 150));
    const aqi = yrData.aqi ?? Math.round(Math.max(5, telemetry.aqi - (2026 - year) * 2 + Math.floor(yearSeed * 30)));

    return {
      year: year.toString(),
      Temperature: temp,
      Rainfall: rain,
      AQI: aqi,
    };
  });

  return (
    <div 
      id="bottom-analytics-panel"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 text-slate-800"
    >
      {/* Header toggle bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-left select-none"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[#047857]" />
          <span className="font-display font-bold text-sm tracking-tight text-slate-900">
            Climate & Analytics History Panel
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            — {selectedLocation.name} (Trend Analysis)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
            {isOpen ? "COLLAPSE PANEL" : "EXPAND TRENDS"}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Main expanded content */}
      {isOpen && (
        <div className="p-5 border-t border-slate-200 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-250">
          {/* Quick Stats & Chart Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex gap-2">
              {[
                { id: "temperature", label: "Temperature Wave", icon: <Thermometer className="w-4 h-4" /> },
                { id: "rainfall", label: "Rainfall Volumetrics", icon: <CloudRain className="w-4 h-4" /> },
                { id: "aqi", label: "Air Quality (AQI) Trend", icon: <TrendingUp className="w-4 h-4" /> },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActiveTab(btn.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeTab === btn.id
                      ? "bg-[#047857]/40 border-[#10B981] text-[#10B981] shadow-xs"
                      : "bg-[#1E293B] border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
            
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Satellite raster models combined with local sensor feedback.
            </div>
          </div>

          {/* Graph viewport */}
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "temperature" ? (
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" unit="°C" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontFamily: "sans-serif", fontSize: "12px", color: "#F8FAFC" }} 
                  />
                  <Area type="monotone" dataKey="Temperature" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              ) : activeTab === "rainfall" ? (
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" unit="mm" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontFamily: "sans-serif", fontSize: "12px", color: "#F8FAFC" }} 
                  />
                  <Bar dataKey="Rainfall" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              ) : (
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" unit=" AQI" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontFamily: "sans-serif", fontSize: "12px", color: "#F8FAFC" }} 
                  />
                  <Line type="monotone" dataKey="AQI" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
