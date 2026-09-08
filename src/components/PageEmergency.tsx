import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  AlertTriangle, 
  HeartPulse, 
  Phone, 
  Building2, 
  Navigation, 
  MapPin, 
  Compass, 
  ArrowLeft, 
  Clock, 
  Activity, 
  Shield, 
  LifeBuoy,
  Flame,
  CloudRain,
  Droplets,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Route,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocationReport } from "../types";
import L from "leaflet";
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";

interface PageEmergencyProps {
  selectedLocation: LocationReport | null;
  isDarkMode?: boolean;
  onBack: () => void;
  detectCurrentLocation: () => void;
}

const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidGoogleKey = Boolean(GOOGLE_API_KEY) && GOOGLE_API_KEY !== "YOUR_API_KEY";

// Dynamic relative generator for emergency POIs
function generateEmergencyServices(location: LocationReport) {
  const baseName = location.name || "Regional Zone";
  const lat = location.lat;
  const lng = location.lng;
  return [
    {
      id: "hosp-1",
      name: `${baseName} Emergency Trauma Hospital`,
      type: "hospital",
      icon: "🏥",
      address: `12, Hospital Road, ${baseName}`,
      distance: "1.4 km",
      phone: "108",
      lat: lat + 0.005,
      lng: lng - 0.004,
    },
    {
      id: "hosp-2",
      name: "Metro Green Cross Medical Center",
      type: "hospital",
      icon: "🏥",
      address: `45, Avenue Square, ${baseName}`,
      distance: "3.9 km",
      phone: "+1 (555) 309-5431",
      lat: lat - 0.008,
      lng: lng + 0.007,
    },
    {
      id: "fire-1",
      name: `${baseName} Fire & Rescue Headquarters`,
      type: "fire_station",
      icon: "🚒",
      address: `Sector 3, Fire Station Road, ${baseName}`,
      distance: "1.1 km",
      phone: "101",
      lat: lat + 0.003,
      lng: lng + 0.005,
    },
    {
      id: "police-1",
      name: `${baseName} Central Police Precinct`,
      type: "police_station",
      icon: "👮",
      address: `1, Police Line, ${baseName}`,
      distance: "0.8 km",
      phone: "100",
      lat: lat - 0.003,
      lng: lng - 0.004,
    },
    {
      id: "shelter-1",
      name: "Municipal Disaster Safety Shelter",
      type: "shelter",
      icon: "🏠",
      address: `Community Hall, West Wing, ${baseName}`,
      distance: "1.7 km",
      capacity: "400 citizens",
      phone: "+1 (555) 309-7788",
      lat: lat + 0.006,
      lng: lng - 0.008,
    },
    {
      id: "shelter-2",
      name: "High-Ground Safe Refuge",
      type: "shelter",
      icon: "🏠",
      address: `Hilltop Stadium Area, ${baseName}`,
      distance: "3.2 km",
      capacity: "250 citizens",
      phone: "+1 (555) 309-9922",
      lat: lat - 0.009,
      lng: lng - 0.005,
    },
    {
      id: "amb-1",
      name: "Red Cross Ambulance Dispatch",
      type: "ambulance",
      icon: "🚑",
      address: `Medical Allied Plaza, ${baseName}`,
      distance: "1.8 km",
      phone: "102",
      lat: lat + 0.004,
      lng: lng + 0.002,
    },
  ];
}

// Risk assessments mapping
function getRiskAssessment(telemetry: any) {
  if (!telemetry) return { level: "Safe" as const, color: "green" as const, label: "🟢 Safe" };
  const risk = telemetry.climateRisk ?? 20;
  if (risk > 75) return { level: "Critical Risk" as const, color: "red" as const, label: "🔴 Critical Risk" };
  if (risk > 50) return { level: "High Risk" as const, color: "orange" as const, label: "🟠 High Risk" };
  if (risk > 25) return { level: "Moderate Risk" as const, color: "yellow" as const, label: "🟡 Moderate Risk" };
  return { level: "Safe" as const, color: "green" as const, label: "🟢 Safe" };
}

// Active hazard checking
function getActiveEmergency(telemetry: any) {
  if (!telemetry) return null;
  const aqi = telemetry.aqi ?? 50;
  const temp = telemetry.temperature ?? 22;
  const rainProb = telemetry.rainProbability ?? 10;
  const wind = telemetry.windSpeed ?? 10;
  const risk = telemetry.climateRisk ?? 20;
  const riskFactor = (telemetry.riskFactor || "").toLowerCase();

  // Floods
  if (risk > 50 && (riskFactor.includes("flood") || riskFactor.includes("precipitation") || rainProb > 70)) {
    return {
      type: "Severe Flood Threat",
      level: "Critical Risk",
      color: "red",
      description: "Heavy inundation and flash flooding detected in low-lying basins. Immediate evacuation from floodplains to designated high-ground shelters is advised.",
    };
  }
  // Cyclones / Severe Storms
  if (wind > 45 || riskFactor.includes("cyclone") || riskFactor.includes("storm")) {
    return {
      type: "Active Cyclone Warning",
      level: "Critical Risk",
      color: "red",
      description: "High-velocity wind storm active. Structural damage and airborne debris expected. Stay indoors in secure masonry structures.",
    };
  }
  // Wildfires
  if (risk > 50 && (riskFactor.includes("wildfire") || riskFactor.includes("fire") || (temp > 38 && risk > 40))) {
    return {
      type: "Wildfire Outbreak",
      level: "High Risk",
      color: "orange",
      description: "Forest fire spreads detected nearby. Dense smoke plumes causing hazardous visibility. Restrict open fires and evacuate forest peripheries.",
    };
  }
  // Heatwave
  if (temp > 38) {
    return {
      type: "Extreme Heatwave",
      level: "High Risk",
      color: "orange",
      description: "Thermodynamic temperature indexes exceed critical human thresholds. Extreme hyperthermia hazard. Drink water, seek cooling stations, and limit sun exposure.",
    };
  }
  // Poor Air Quality
  if (aqi > 150) {
    return {
      type: "Hazardous Air Quality",
      level: "Moderate Risk",
      color: "yellow",
      description: "Toxic particulate concentration. Restrict outdoor exercise. High-efficiency respiratory filtration masks (N95) recommended.",
    };
  }

  // General elevation of risk
  if (risk > 45) {
    return {
      type: "Elevated Climate Stress",
      level: "Moderate Risk",
      color: "yellow",
      description: "General climate hazard flags are active. Secure communication channels, review emergency checklist, and locate closest shelters.",
    };
  }

  return null;
}

// Safety bullets mapping
function getEmergencyAISafetyPoints(telemetry: any) {
  const points: string[] = [];
  if (!telemetry) return [
    "Stay informed of regional environmental forecasts.",
    "Identify nearest civil defense shelters and medical facilities.",
    "Maintain a backup power supply or power bank for devices.",
    "Keep a stock of dry rations and clean drinking water.",
    "Follow local authorities' instructions in any event."
  ];

  const aqi = telemetry.aqi ?? 50;
  const temp = telemetry.temperature ?? 22;
  const rainProb = telemetry.rainProbability ?? 10;
  const wind = telemetry.windSpeed ?? 10;
  const risk = telemetry.climateRisk ?? 20;
  const riskFactor = (telemetry.riskFactor || "").toLowerCase();

  const isFlood = risk > 50 && (riskFactor.includes("flood") || riskFactor.includes("precipitation") || rainProb > 70);
  const isStorm = wind > 35 || riskFactor.includes("cyclone") || riskFactor.includes("storm");
  const isFire = risk > 50 && (riskFactor.includes("wildfire") || riskFactor.includes("fire"));
  const isHeat = temp > 38;
  const isAqi = aqi > 120;

  if (isFlood) {
    points.push("Avoid low-lying areas and basements due to high flood risk.");
    points.push("Power down electric breakers in water-prone structures.");
    points.push("Do not attempt to walk or drive through flowing water.");
    points.push("Relocate critical documents and valuables to upper floors.");
    points.push("Keep emergency contact devices charged and active.");
  } else if (isStorm) {
    points.push("Stay indoors and away from window panes during severe winds.");
    points.push("Secure loose outdoor equipment and lightweight assets.");
    points.push("Unplug electrical appliances to protect against lightning surges.");
    points.push("Avoid parking vehicles under trees or power lines.");
    points.push("Monitor radio bands for active evacuation triggers.");
  } else if (isFire) {
    points.push("Evacuate immediate woodland fringes if smoke is visible.");
    points.push("Wear respirator masks (N95) to filter heavy toxic soot.");
    points.push("Keep doors and windows sealed to block toxic fumes.");
    points.push("Prepare an emergency grab-bag with critical supplies.");
    points.push("Ensure multiple exit routes remain unobstructed.");
  } else if (isHeat) {
    points.push("Carry drinking water and hydrate continuously during extreme heat.");
    points.push("Avoid direct solar exposure between 11:00 AM and 4:00 PM.");
    points.push("Wear lightweight, loose, light-colored protective clothing.");
    points.push("Check on elderly family members or sensitive neighbors.");
    points.push("Seek air-conditioned community cooling hubs.");
  } else if (isAqi) {
    points.push("Wear a particulate mask if air quality index is poor.");
    points.push("Deactivate outdoor ventilation intakes; run indoor air purifiers.");
    points.push("Avoid vigorous outdoor exercises or physical exertion.");
    points.push("Maintain hydration to soothe throat and airways.");
    points.push("Limit exposure if you have pre-existing respiratory profiles.");
  } else {
    points.push("Keep emergency numbers programmed into speed dial.");
    points.push("Verify that your local first-aid kit is fully stocked.");
    points.push("Have a family emergency communication and meeting plan.");
    points.push("Store at least 3 liters of drinking water per person per day.");
    points.push("Remain vigilant of changing environmental warning flags.");
  }

  while (points.length < 5) {
    points.push("Follow official civil defense and evacuation orders if issued.");
  }

  return points.slice(0, 5);
}

// Simple Google Maps route controller
function GoogleRouteRenderer({ start, end }: { start: { lat: number; lng: number } | null, end: { lat: number; lng: number } | null }) {
  const map = useMap();
  const routeLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !start || !end) {
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
        routeLineRef.current = null;
      }
      return;
    }

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
    }

    // Draw route path
    routeLineRef.current = new google.maps.Polyline({
      path: [start, end],
      geodesic: true,
      strokeColor: "#EF4444",
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: map,
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(end);
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });

  }, [map, start, end]);

  return null;
}

export default function PageEmergency({
  selectedLocation,
  isDarkMode = false,
  onBack,
  detectCurrentLocation
}: PageEmergencyProps) {
  
  // Real-time ticking clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeRouteTarget, setActiveRouteTarget] = useState<any | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletRouteLineRef = useRef<L.Polyline | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // If there's no selectedLocation, use a default (Chennai)
  const activeReport = selectedLocation || {
    id: "chennai-default",
    name: "Chennai",
    region: "Tamil Nadu",
    country: "India",
    lat: 13.0827,
    lng: 80.2707,
    telemetry: {
      aqi: 55,
      aqiLabel: "Moderate",
      temperature: 31,
      tempAnomaly: 1.2,
      humidity: 68,
      rainfall: 1200,
      ndvi: 0.45,
      ndviDensity: "Healthy Canopy",
      deforestation: "Stable" as const,
      climateRisk: 30,
      riskFactor: "None" as const,
      feelsLike: 35,
      rainProbability: 25,
      pressure: 1008,
      windSpeed: 14,
      windDirection: "ENE",
      windDirDegrees: 70,
      uvIndex: 7,
      visibility: 8,
      cloudCoverage: 40,
      sunrise: "05:54 AM",
      sunset: "06:38 PM",
      moonPhase: "Waxing Gibbous",
      elevation: 6
    },
    historical: {}
  };

  const services = generateEmergencyServices(activeReport);
  const assessment = getRiskAssessment(activeReport.telemetry);
  const warning = getActiveEmergency(activeReport.telemetry);
  const safetyBullets = getEmergencyAISafetyPoints(activeReport.telemetry);

  // Load Leaflet CDN if not available
  useEffect(() => {
    if (!document.getElementById("leaflet-cdn-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (hasValidGoogleKey || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeReport.lat, activeReport.lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}/{x}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      leafletMapRef.current = map;
      leafletMarkersGroupRef.current = L.layerGroup().addTo(map);
    } else {
      leafletMapRef.current.setView([activeReport.lat, activeReport.lng], 14);
    }

    const map = leafletMapRef.current;
    const group = leafletMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (leafletRouteLineRef.current) {
      map.removeLayer(leafletRouteLineRef.current);
      leafletRouteLineRef.current = null;
    }

    // Add selected position marker
    const currentLocIcon = L.divIcon({
      className: "",
      html: `
        <div class="flex items-center justify-center">
          <div class="relative w-10 h-10 flex items-center justify-center">
            <div class="relative rounded-full w-5 h-5 bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
      `
    });
    L.marker([activeReport.lat, activeReport.lng], { icon: currentLocIcon }).addTo(group);

    // Add emergency services markers
    services.forEach(srv => {
      const srvIcon = L.divIcon({
        className: "",
        html: `
          <div class="flex items-center justify-center transform hover:scale-125 transition-all">
            <div class="w-8 h-8 rounded-full border border-white bg-slate-900 text-white shadow-lg flex items-center justify-center text-sm">
              ${srv.icon}
            </div>
          </div>
        `
      });
      const m = L.marker([srv.lat, srv.lng], { icon: srvIcon }).addTo(group);
      m.on("click", () => {
        setSelectedPoi(srv);
      });
    });

    // Draw active route if selected
    if (activeRouteTarget) {
      const pathPoints: [number, number][] = [
        [activeReport.lat, activeReport.lng],
        [activeRouteTarget.lat, activeRouteTarget.lng]
      ];
      const line = L.polyline(pathPoints, {
        color: "#F43F5E",
        weight: 5,
        opacity: 0.9,
        dashArray: "8, 8"
      }).addTo(map);
      leafletRouteLineRef.current = line;

      // Fit bounds to fit route perfectly
      const bounds = L.latLngBounds(pathPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

  }, [activeReport, activeRouteTarget, services, hasValidGoogleKey]);

  const handleTriggerSafeRoute = (srv: any) => {
    setActiveRouteTarget(srv);
    setSelectedPoi(srv);
    
    // Zoom/pan on map
    if (hasValidGoogleKey) {
      // Handled inside GoogleRouteRenderer component
    } else if (leafletMapRef.current) {
      const pathPoints: [number, number][] = [
        [activeReport.lat, activeReport.lng],
        [srv.lat, srv.lng]
      ];
      const bounds = L.latLngBounds(pathPoints);
      leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  const getRiskColorClass = (color: string) => {
    switch(color) {
      case "red": return "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/30";
      case "orange": return "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30";
      case "yellow": return "border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-950/30";
      default: return "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30";
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* 🚨 Emergency Header Banner */}
      <header className="w-full h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h1 className="text-sm md:text-base font-black tracking-tight text-slate-900 dark:text-white">
              DISASTER OUTBREAK CONTROL CENTER
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[10px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold">
            Local Emergency System Connected
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden items-stretch">
        
        {/* Left Panel: Emergency Advisory & Contacts */}
        <div className="lg:col-span-7 h-full overflow-y-auto p-4 md:p-6 flex flex-col gap-5 scrollbar-thin border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A] text-left">
          
          {/* Active Location Banner */}
          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-wider leading-none">MONITORED ZONE</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {activeReport.name}, {activeReport.region ? `${activeReport.region}, ` : ""}{activeReport.country}
                </span>
              </div>
            </div>
            
            <button
              onClick={detectCurrentLocation}
              className="flex items-center gap-1.5 text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs tracking-wider leading-none shrink-0 active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              Locate Me
            </button>
          </div>

          {/* RISK LEVEL STATUS BLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Risk Indicator Card */}
            <div className={`md:col-span-5 p-5 rounded-2xl border flex flex-col justify-between shadow-xs relative overflow-hidden ${getRiskColorClass(assessment.color)}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest font-black opacity-80">ENVIRONMENTAL THREAT INDEX</span>
                <h3 className="text-xl font-black tracking-tight mt-1 uppercase">
                  {assessment.level}
                </h3>
              </div>

              <div className="mt-4">
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black font-mono leading-none">
                    {activeReport.telemetry.climateRisk}
                  </span>
                  <span className="text-xs opacity-70 font-bold mb-1">/ 100</span>
                </div>
                <p className="text-[11px] mt-2 opacity-80 leading-normal font-medium">
                  Dynamic safety threat score calculated using localized humidity, precipitation curves, AQI layers, and temperature peaks.
                </p>
              </div>
            </div>

            {/* Dynamic Warning Card */}
            <div className="md:col-span-7 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#1E293B] flex flex-col justify-between shadow-xs relative overflow-hidden">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-[9px] font-mono uppercase tracking-widest font-black text-rose-600 dark:text-rose-400">Hazard Control Alert</span>
                </div>

                {warning ? (
                  <div className="mt-2.5">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{warning.type}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                      {warning.description}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      No Active Emergency
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                      This area is currently safe. Nearby emergency services remain available if needed.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-3">
                Updated in real-time by Environmental Sentinel.
              </div>
            </div>
          </div>

          {/* AI Safety Recommendations Card */}
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#1E293B] relative overflow-hidden shadow-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">AI Safety Recommendations</h3>
            </div>
            
            <div className="flex flex-col gap-3 mt-4">
              {safetyBullets.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts & Telephony Action */}
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#1E293B] shadow-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4.5 h-4.5 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Civil Protection Contacts</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
              <a 
                href="tel:112" 
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-500/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide leading-none">NATIONAL</span>
                <span className="text-lg font-black text-slate-900 dark:text-white mt-1">112</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold group-hover:text-rose-500 mt-0.5">Call Direct</span>
              </a>
              
              <a 
                href="tel:108" 
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-500/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide leading-none">AMBULANCE</span>
                <span className="text-lg font-black text-slate-900 dark:text-white mt-1">108</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold group-hover:text-rose-500 mt-0.5">Call Direct</span>
              </a>

              <a 
                href="tel:101" 
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-500/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide leading-none">FIRE DEPT</span>
                <span className="text-lg font-black text-slate-900 dark:text-white mt-1">101</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold group-hover:text-rose-500 mt-0.5">Call Direct</span>
              </a>

              <a 
                href="tel:100" 
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-500/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide leading-none">POLICE HQ</span>
                <span className="text-lg font-black text-slate-900 dark:text-white mt-1">100</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold group-hover:text-rose-500 mt-0.5">Call Direct</span>
              </a>
            </div>
          </div>

          {/* Emergency Services Directory */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 pl-1">
              First Responders & Regional Stations Directory
            </h3>
            
            <div className="flex flex-col gap-3">
              {services.map((srv) => (
                <div 
                  key={srv.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                    activeRouteTarget?.id === srv.id 
                      ? "border-rose-500 bg-rose-500/10 dark:bg-rose-950/25" 
                      : "border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#1E293B] hover:border-rose-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                      {srv.icon}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{srv.name}</span>
                        <span className="text-[8px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          {srv.type.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-none">{srv.address}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono flex items-center gap-1">
                        <Activity className="w-3 h-3 text-rose-500" />
                        Distance: {srv.distance} {srv.capacity ? `• Capacity: ${srv.capacity}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    {/* Call Direct phone trigger */}
                    <a 
                      href={`tel:${srv.phone}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Phone className="w-3 h-3 text-rose-500" />
                      Call Station
                    </a>

                    {/* Safe Route drawer trigger */}
                    {(srv.type === "hospital" || srv.type === "shelter") && (
                      <button
                        onClick={() => handleTriggerSafeRoute(srv)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1 text-[10px] font-black uppercase px-3 py-2 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                          activeRouteTarget?.id === srv.id 
                            ? "bg-rose-600 hover:bg-rose-700 text-white" 
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        <Route className="w-3 h-3" />
                        Safe Route
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Panel: Split Live Map Pane */}
        <div className="lg:col-span-5 h-[320px] lg:h-full relative overflow-hidden bg-slate-900">
          
          {/* Active Overlay Toast Banner for directions */}
          {activeRouteTarget && (
            <div className="absolute top-4 left-4 right-4 z-[9999] bg-[#0F172A]/95 backdrop-blur-md border border-rose-500/30 p-3 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto">
              <div className="flex items-start gap-2.5 text-left">
                <Route className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest leading-none">SAFE EMERGENCY TRANSIT ACTIVE</span>
                  <span className="text-xs font-black text-white mt-1 leading-tight">
                    Route mapped to {activeRouteTarget.name}
                  </span>
                  <span className="text-[10px] text-slate-300 mt-1 font-semibold">
                    Safe corridor: {activeRouteTarget.distance} • Est. Transit: ~4 mins
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRouteTarget(null);
                  setSelectedPoi(null);
                }}
                className="text-[9px] font-mono bg-rose-950/40 border border-rose-500/30 hover:bg-rose-600 text-white px-2 py-1 rounded-md uppercase font-extrabold transition-all"
              >
                Clear Route
              </button>
            </div>
          )}

          {/* The actual Map wrapper */}
          <div className="w-full h-full">
            {hasValidGoogleKey ? (
              <APIProvider apiKey={GOOGLE_API_KEY} version="weekly" libraries={["places"]}>
                <GoogleMap
                  defaultCenter={{ lat: activeReport.lat, lng: activeReport.lng }}
                  defaultZoom={14}
                  mapId="EMERGENCY_MAP_ID"
                  gestureHandling="greedy"
                  disableDefaultUI={true}
                  styles={[
                    { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                  ]}
                  style={{ width: "100%", height: "100%" }}
                  internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                >
                  {/* Selected Center Indicator */}
                  <AdvancedMarker position={{ lat: activeReport.lat, lng: activeReport.lng }}>
                    <div className="relative flex items-center justify-center w-12 h-12 pointer-events-none">
                      <div className="relative w-6 h-6 rounded-full bg-white border-2 border-blue-500 shadow-xl flex items-center justify-center cursor-pointer pointer-events-auto">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Dynamic POI Markers */}
                  {services.map((srv) => (
                    <AdvancedMarker 
                      key={srv.id} 
                      position={{ lat: srv.lat, lng: srv.lng }}
                      onClick={() => setSelectedPoi(srv)}
                    >
                      <div className="group cursor-pointer flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border border-white bg-slate-900 text-white shadow-lg flex items-center justify-center text-sm transform transition-all hover:scale-110">
                          {srv.icon}
                        </div>
                      </div>
                    </AdvancedMarker>
                  ))}

                  {/* Custom Polyline Routing Renderer */}
                  <GoogleRouteRenderer 
                    start={{ lat: activeReport.lat, lng: activeReport.lng }}
                    end={activeRouteTarget ? { lat: activeRouteTarget.lat, lng: activeRouteTarget.lng } : null}
                  />

                  {/* Active Window Info Popup */}
                  {selectedPoi && (
                    <InfoWindow
                      position={{ lat: selectedPoi.lat, lng: selectedPoi.lng }}
                      onCloseClick={() => setSelectedPoi(null)}
                    >
                      <div className="text-slate-900 font-sans p-2 min-w-[200px]">
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono font-bold uppercase pb-1 border-b border-slate-100">
                          <Activity className="w-3.5 h-3.5 text-rose-500" />
                          <span>Civil Defender Facility</span>
                        </div>
                        <div className="font-extrabold text-xs text-slate-800 mt-1.5 leading-tight">{selectedPoi.name}</div>
                        <div className="text-[9px] text-slate-400 font-medium capitalize mt-0.5">{selectedPoi.type.replace("_", " ")} Hub</div>
                        <div className="text-[10px] text-slate-500 mt-1">{selectedPoi.address}</div>

                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                          <div className="bg-slate-50 p-1 rounded-lg flex flex-col">
                            <span className="text-[8px] font-mono text-slate-400 font-extrabold">DISTANCE</span>
                            <span className="font-bold text-rose-600 font-mono">{selectedPoi.distance}</span>
                          </div>
                          <div className="bg-slate-50 p-1 rounded-lg flex flex-col">
                            <span className="text-[8px] font-mono text-slate-400 font-extrabold">STATUS</span>
                            <span className="font-bold text-emerald-600 font-mono">Operational</span>
                          </div>
                        </div>

                        {(selectedPoi.type === "hospital" || selectedPoi.type === "shelter") && (
                          <button
                            onClick={() => handleTriggerSafeRoute(selectedPoi)}
                            className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase text-[9px] py-1.5 rounded-md shadow transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Route className="w-3 h-3" />
                            Map Safe Corridor
                          </button>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            ) : (
              <div ref={mapContainerRef} className="w-full h-full" />
            )}
          </div>

          {/* Map Info Legend Overlay (floating Bottom-Left) */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 border border-[rgba(244,63,94,0.2)] p-3 rounded-xl shadow-xl flex flex-col gap-1.5 text-left text-[10px]">
            <span className="font-mono font-bold text-rose-400 uppercase tracking-widest text-[8px] pb-1 border-b border-rose-500/10">FACILITY INDEX</span>
            <div className="flex flex-col gap-1 font-medium text-slate-300">
              <div className="flex items-center gap-1.5">
                <span>🏥</span> Hospital
              </div>
              <div className="flex items-center gap-1.5">
                <span>🚒</span> Fire Station
              </div>
              <div className="flex items-center gap-1.5">
                <span>👮</span> Police HQ
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏠</span> Emergency Shelter
              </div>
              <div className="flex items-center gap-1.5">
                <span>🚑</span> Ambulance dispatch
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
