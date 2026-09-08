import React from "react";
import { Globe, ChevronRight, MapPin, Building2, LandPlot, Compass } from "lucide-react";
import { motion } from "motion/react";

export interface HierarchyState {
  level: "world" | "country" | "state" | "city" | "poi";
  country?: string;
  state?: string;
  city?: string;
  viewport?: { north: number; south: number; east: number; west: number };
}

interface MapBreadcrumbsProps {
  hierarchy: HierarchyState;
  selectedLocation: {
    name: string;
    country: string;
    region?: string;
  } | null;
  onNavigateHierarchy: (newHierarchy: HierarchyState, clearSelectedLoc?: boolean) => void;
  isDarkMode: boolean;
}

export const MapBreadcrumbs: React.FC<MapBreadcrumbsProps> = ({
  hierarchy,
  selectedLocation,
  onNavigateHierarchy,
  isDarkMode,
}) => {
  const currentLevel = hierarchy.level || "world";

  // Derive country, state, city names from hierarchy or selectedLocation
  const countryName = hierarchy.country || selectedLocation?.country || (currentLevel !== "world" ? "India" : undefined);
  const stateName = hierarchy.state || selectedLocation?.region || undefined;
  const cityName = hierarchy.city || (selectedLocation?.name && selectedLocation?.name !== countryName && selectedLocation?.name !== stateName ? selectedLocation?.name : undefined);

  // Build trail steps
  const steps: Array<{
    id: "world" | "country" | "state" | "city";
    label: string;
    icon: React.FC<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      id: "world",
      label: "World View",
      icon: Globe,
      isActive: currentLevel === "world" && !selectedLocation,
      onClick: () => {
        onNavigateHierarchy({ level: "world" }, true);
      },
    },
  ];

  if (countryName) {
    steps.push({
      id: "country",
      label: countryName,
      icon: LandPlot,
      isActive: currentLevel === "country" || (!stateName && !cityName && currentLevel !== "world"),
      onClick: () => {
        onNavigateHierarchy(
          {
            level: "country",
            country: countryName,
          },
          false
        );
      },
    });
  }

  if (stateName && stateName !== countryName) {
    steps.push({
      id: "state",
      label: stateName,
      icon: Building2,
      isActive: currentLevel === "state",
      onClick: () => {
        onNavigateHierarchy(
          {
            level: "state",
            country: countryName,
            state: stateName,
          },
          false
        );
      },
    });
  }

  if (cityName && cityName !== stateName && cityName !== countryName) {
    steps.push({
      id: "city",
      label: cityName,
      icon: MapPin,
      isActive: currentLevel === "city" || currentLevel === "poi" || Boolean(selectedLocation),
      onClick: () => {
        onNavigateHierarchy(
          {
            level: "city",
            country: countryName,
            state: stateName,
            city: cityName,
          },
          false
        );
      },
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 bg-white/95 text-slate-800 backdrop-blur-xl shadow-md transition-all max-w-[calc(100vw-32px)] md:max-w-xl overflow-x-auto scrollbar-none z-40"
    >
      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-black uppercase tracking-wider text-[#047857] mr-1">
        <Compass className="w-3.5 h-3.5 text-[#047857]" />
        <span className="hidden sm:inline">Hierarchy:</span>
      </div>

      {steps.map((step, idx) => {
        const IconComponent = step.icon;

        return (
          <React.Fragment key={`${step.id}-${step.label}-${idx}`}>
            {idx > 0 && (
              <ChevronRight
                className="w-3.5 h-3.5 shrink-0 text-slate-400"
              />
            )}

            <button
              onClick={step.onClick}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                step.isActive
                  ? "bg-emerald-50 text-[#047857] border border-emerald-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title={`Navigate to ${step.label} (${step.id} level)`}
            >
              <IconComponent
                className={`w-3.5 h-3.5 ${
                  step.isActive
                    ? "text-[#10B981]"
                    : "text-slate-400"
                }`}
              />
              <span className="truncate max-w-[110px] sm:max-w-[160px]">{step.label}</span>
              {step.isActive && (
                <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded hidden md:inline ml-0.5 bg-[#10B981]/20 text-[#10B981]">
                  {step.id}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </motion.div>
  );
};
