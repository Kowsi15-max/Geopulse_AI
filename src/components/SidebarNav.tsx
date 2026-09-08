import React from "react";
import { 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import GeoPulseLogo from "./GeoPulseLogo";

interface SidebarNavProps {
  platformName?: string;
  activePage: string;
  setActivePage: (page: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isDarkMode: boolean;
  isEmergencyMode: boolean;
  setIsEmergencyMode: (b: boolean) => void;
}

export const NAV_ITEMS = [
  { id: "home", label: "Dashboard", emoji: "🏠" },
  { id: "map", label: "Explore Map", emoji: "🗺️" },
  { id: "health", label: "Health Advisor", emoji: "🩺" },
  { id: "agriculture", label: "Farming & Crops", emoji: "🌾" },
  { id: "analysis", label: "Weather Analysis", emoji: "📈" },
  { id: "forecast", label: "Weekly Forecast", emoji: "🌤️" },
  { id: "alerts", label: "Weather Alerts", emoji: "⚠️" },
  { id: "ai", label: "AI Assistant", emoji: "🤖" },
  { id: "reports", label: "Download Reports", emoji: "📄" },
  { id: "saved", label: "Saved Places", emoji: "⭐" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
];

// Group items into clean sections
const SECTIONS = [
  {
    title: "📌 Overview",
    items: ["home", "map", "agriculture"]
  },
  {
    title: "🧠 Health & Insights",
    items: ["health", "analysis", "forecast", "alerts", "ai", "reports"]
  },
  {
    title: "⚙️ Saved & Settings",
    items: ["saved", "settings"]
  }
];

export default function SidebarNav({
  platformName,
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  isDarkMode,
  isEmergencyMode,
  setIsEmergencyMode
}: SidebarNavProps) {
  const handleItemClick = (itemId: string) => {
    setActivePage(itemId);
  };

  return (
    <>
      {/* --- DESKTOP CLEAN & PROFESSIONAL SIDEBAR --- */}
      <aside 
        id="desktop-nav-sidebar"
        className={`hidden md:flex flex-col h-screen transition-all duration-300 ease-in-out shrink-0 z-40 relative ${
          collapsed ? "w-20" : "w-64"
        } bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm`}
      >
        {/* Header with GeoPulse Logo and Collapse Toggle */}
        <div className="p-4 pb-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <GeoPulseLogo 
                size={26} 
                showText={true} 
                textClassName="text-base font-extrabold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200" 
                lightBg={!isDarkMode} 
                customText={platformName}
              />
            </motion.div>
          )}
          {collapsed && (
            <div className="mx-auto flex items-center justify-center">
              <GeoPulseLogo size={26} showText={false} lightBg={!isDarkMode} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all duration-200 cursor-pointer shadow-2xs"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 px-3.5 py-4 space-y-5 overflow-y-auto scrollbar-thin">
          {SECTIONS.map((section) => {
            const itemsInSection = NAV_ITEMS.filter(item => section.items.includes(item.id));
            if (itemsInSection.length === 0) return null;
            
            return (
              <div key={section.title} className={`space-y-1 ${collapsed ? "mb-5" : ""}`}>
                {!collapsed && (
                  <h3 className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase mb-1.5 text-emerald-700 dark:text-emerald-400">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {itemsInSection.map((item) => {
                    const isActive = activePage === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group relative cursor-pointer border ${
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 border-l-4 border-l-emerald-600 dark:border-l-emerald-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 border-transparent hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-base shrink-0 leading-none transition-transform duration-200 group-hover:scale-115 ${
                            isActive ? "scale-110" : "opacity-85 group-hover:opacity-100"
                          }`}>
                            {item.emoji}
                          </span>
                          
                          {!collapsed && (
                            <span className="truncate tracking-tight font-semibold">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Collapsed Tooltip */}
                        {collapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                            {item.emoji} {item.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Emergency Mode Toggle Section */}
        <div className="px-3.5 py-1.5">
          <div 
            onClick={() => collapsed && setIsEmergencyMode(!isEmergencyMode)}
            className={`p-2.5 rounded-2xl border transition-all duration-150 ${collapsed ? "cursor-pointer flex justify-center" : ""} ${
              isEmergencyMode
                ? "bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50/40 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title={collapsed ? (isEmergencyMode ? "Disable Emergency Mode" : "Enable Emergency Mode") : undefined}
          >
            <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between w-full"}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-base shrink-0 leading-none">
                  🚨
                </span>
                {!collapsed && (
                  <span className="text-xs font-semibold tracking-tight">Emergency Mode</span>
                )}
              </div>
              
              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEmergencyMode(!isEmergencyMode);
                  }}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-250 relative cursor-pointer ${
                    isEmergencyMode ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-250 ${
                    isEmergencyMode ? "translate-x-3.5" : "translate-x-0"
                  }`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Version Footer */}
        <div className="px-4 pb-4 pt-1 text-center text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500">
          {!collapsed ? "v1.4 • Active" : "v1.4"}
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav 
        id="mobile-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-45 pb-safe bg-white/95 dark:bg-[#0B1120]/95 text-slate-700 dark:text-slate-300 backdrop-blur-md shadow-lg"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all relative cursor-pointer ${
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span className={`text-lg shrink-0 leading-none ${isActive ? "scale-110" : "opacity-80"}`}>
                {item.emoji}
              </span>
              <span className="text-[9px] font-medium tracking-tight max-w-[50px] truncate leading-none">
                {item.label.split(" ")[0]}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute -top-1 w-5 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}


