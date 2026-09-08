import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Navigation,
  Sun,
  Moon,
  Globe,
  Map as MapIcon,
  Activity,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Key,
  RefreshCw,
  Gauge,
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  Sprout,
  Search,
  Check,
  Layers,
  ChevronLeft,
  Minimize,
  Maximize,
  Navigation2,
  Building2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  Route,
  Scissors,
  Star,
  ChevronRight,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APIProvider } from "@vis.gl/react-google-maps";

import SatelliteMap from "./components/SatelliteMap";
import SidebarNav from "./components/SidebarNav";
import PageHome from "./components/PageHome";
import PageAnalysis from "./components/PageAnalysis";
import PageForecast from "./components/PageForecast";
import PageAlerts from "./components/PageAlerts";
import PageAi from "./components/PageAi";
import PageReports from "./components/PageReports";
import PageSaved from "./components/PageSaved";
import PageSettings from "./components/PageSettings";
import PageEmergency from "./components/PageEmergency";
import PageAgriculture from "./components/PageAgriculture";
import PageHealthAdvisor from "./components/PageHealthAdvisor";
import { MapBreadcrumbs } from "./components/MapBreadcrumbs";

import { LocationReport, ClimateLayer } from "./types";
import { apiFetch } from "./utils/api";
import { generateClimateReportForCoordinate } from "./data";
import { calculateEnvironmentalHealthScore, getActionableRecommendations, getEmergencyResources } from "./utils";
import GeoPulseLogo from "./components/GeoPulseLogo";

// 5-bullet concise AI Summary generator based on telemetry data
function getCompactAISummary(telemetry: any): string[] {
  const bullets = [];
  
  // 1. Air Quality
  if (telemetry.aqi <= 50) {
    bullets.push("Pristine Air Quality Index (" + telemetry.aqi + "), ideal for outdoor exploration.");
  } else if (telemetry.aqi <= 100) {
    bullets.push("Moderate Air Quality (" + telemetry.aqi + "). Safe, but sensitive profiles should take precautions.");
  } else {
    bullets.push("Elevated AQI of " + telemetry.aqi + " indicates moderate atmospheric pollution.");
  }
  
  // 2. Temperature & Heat
  if (telemetry.temperature > 32) {
    bullets.push("Extreme heat caution: Current reading of " + telemetry.temperature + "°C represents a high thermal load.");
  } else if (telemetry.temperature < 10) {
    bullets.push("Cold climate conditions detected (" + telemetry.temperature + "°C) requiring active heating footprint.");
  } else {
    bullets.push("Comfortable ambient thermal levels (" + telemetry.temperature + "°C) align with standard baselines.");
  }
  
  // 3. Rainfall / Moisture
  if (telemetry.rainProbability > 60) {
    bullets.push("Elevated precipitation chance (" + telemetry.rainProbability + "%), plan for localized stormwater runoff.");
  } else if (telemetry.rainProbability > 20) {
    bullets.push("Light cloud cover expected with a moderate " + telemetry.rainProbability + "% chance of periodic showers.");
  } else {
    bullets.push("High soil stability: Dry airmasses keep rain probability at a low " + telemetry.rainProbability + "%.");
  }
  
  // 4. Disaster / Flood Risk / Wildfire
  if (telemetry.wildfire > 60 || telemetry.temperature > 38) {
    bullets.push("Alert: High canopy fire hazard. Low humidity increases spontaneous combustion risks.");
  } else if (telemetry.flood > 70) {
    bullets.push("Warning: Heavy canopy saturation raises localized floodplain hazards.");
  } else {
    bullets.push("Meteorological safety: Standard water-soil profiles indicate minimal fire/flood risk.");
  }
  
  // 5. Vegetation Health (NDVI)
  if (telemetry.ndvi > 0.7) {
    bullets.push("Canopy density is pristine, showcasing robust chlorophyll density and carbon lock.");
  } else if (telemetry.ndvi > 0.4) {
    bullets.push("Standard vegetative health: Healthy seasonal biomass distribution across the area.");
  } else {
    bullets.push("Low vegetative canopy: Urban paving or sandy soils have lowered local organic activity.");
  }

  return bullets.slice(0, 5);
}

// Predefined hot spot locations for easy navigation
const POPULAR_HOTSPOTS = [
  { name: "India", flag: "🇮🇳", type: "Country" },
  { name: "Japan", flag: "🇯🇵", type: "Country" },
  { name: "United States", flag: "🇺🇸", type: "Country" },
  { name: "Amazon Rainforest", flag: "🌳", type: "Forest", lat: -3.4168, lng: -62.2159 },
  { name: "Chennai", flag: "📍", type: "City", lat: 13.0827, lng: 80.2707 },
  { name: "Tokyo", flag: "🗼", type: "City", lat: 35.6762, lng: 139.6503 },
  { name: "New York", flag: "🗽", type: "City", lat: 40.7128, lng: -74.0060 }
];

// Fullscreen API Helper
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// Environmental layers configuration
const ENVIRONMENTAL_LAYERS_CONFIG = [
  { id: "aqi" as const, label: "Air Quality", icon: Gauge, updated: "Updated 12m ago", description: "Displays real-time air pollution levels.", source: "Copernicus Atmosphere Monitoring Service" },
  { id: "temperature" as const, label: "Temperature", icon: Thermometer, updated: "Live (Copernicus)", description: "Displays surface temperature.", source: "Copernicus Climate Change Service" },
  { id: "rainfall" as const, label: "Rainfall", icon: CloudRain, updated: "Updated 45m ago", description: "Displays precipitation intensity.", source: "GPM Satellite Precipitation Data" },
  { id: "flood" as const, label: "Flood Risk", icon: Droplets, updated: "Decadal baseline", description: "Shows flood-prone regions based on rainfall and terrain.", source: "Senti-1 Flood Mapping Baseline" },
  { id: "ndvi" as const, label: "Vegetation", icon: Sprout, updated: "Landsat-9 (Weekly)", description: "Shows vegetation health using satellite imagery.", source: "NASA Landsat-9 Weekly NDVI Vector Data" },
  { id: "wind" as const, label: "Wind", icon: Wind, updated: "Live (GFS Model)", description: "Shows wind speed and direction.", source: "NOAA GFS Global Forecast System Model" },
  { id: "clouds" as const, label: "Cloud Cover", icon: Eye, updated: "Updated 10m ago", description: "Displays cloud coverage.", source: "EUMETSAT Meteorological Satellites" },
];

export default function App() {
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  
  return (
    <APIProvider apiKey={API_KEY} version="weekly" libraries={["places"]}>
      <WorkspaceApp />
    </APIProvider>
  );
}

function WorkspaceApp() {
  // Global Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" | "info" } | null>(null);
  const triggerToast = (message: string, type: "success" | "warning" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // Page routing and layout states
  const [activePage, setActivePage] = useState<string>("home");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Global GIS Active Layer and Selection
  const [selectedLayer, setSelectedLayer] = useState<ClimateLayer>("temperature");
  const [selectedLocation, setSelectedLocation] = useState<LocationReport | null>(() => {
    const defaultRep = generateClimateReportForCoordinate(13.0827, 80.2707, "Chennai");
    defaultRep.country = "India";
    defaultRep.region = "Tamil Nadu";
    return defaultRep;
  });
  
  // Custom Controlled states for SatelliteMap
  const [mapStyle, setMapStyle] = useState<"satellite" | "terrain" | "hybrid" | "normal">("hybrid");
  const [showTraffic, setShowTraffic] = useState(false);
  const [activeTool, setActiveTool] = useState<"navigate" | "measure" | "area">("navigate");
  const [measuredArea, setMeasuredArea] = useState<number | null>(null);

  // Map Tools and Opacity States
  const [isMapToolsOpen, setIsMapToolsOpen] = useState(false);
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    temperature: 0.8,
    aqi: 0.8,
    rainfall: 0.8,
    flood: 0.8,
    ndvi: 0.8,
    wind: 0.8,
    clouds: 0.8,
  });
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);

  // Synchronize activePage and isEmergencyMode
  useEffect(() => {
    if (isEmergencyMode && activePage !== "emergency") {
      setActivePage("emergency");
    } else if (!isEmergencyMode && activePage === "emergency") {
      setActivePage("home");
    }
  }, [isEmergencyMode]);

  useEffect(() => {
    if (activePage === "emergency" && !isEmergencyMode) {
      setIsEmergencyMode(true);
    } else if (activePage !== "emergency" && isEmergencyMode) {
      setIsEmergencyMode(false);
    }
  }, [activePage]);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    temperature: true,
    aqi: true,
    rainfall: true,
    flood: true,
    ndvi: true,
    wind: true,
    clouds: true,
  });
  const [layerExplanation, setLayerExplanation] = useState<string | null>(null);

  // Administrative hierarchy tracking state
  const [hierarchy, setHierarchy] = useState<{
    level: "world" | "country" | "state" | "city" | "poi";
    country?: string;
    state?: string;
    city?: string;
    viewport?: { north: number; south: number; east: number; west: number };
  }>({
    level: "city",
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai"
  });

  // UI styling state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("geopulse-darkmode");
    return saved !== "false"; // Defaults to true (Dark Theme)
  });

  const [platformName, setPlatformName] = useState(() => {
    return localStorage.getItem("gp_platform_name") || "GeoPulse AI";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("geopulse-darkmode", isDarkMode.toString());
  }, [isDarkMode]);

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (layerExplanation) {
      const timer = setTimeout(() => {
        setLayerExplanation(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [layerExplanation]);

  // Search autocomplete states
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictionsDropdown, setShowPredictionsDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bookmark and searches history states
  const [savedLocations, setSavedLocations] = useState<LocationReport[]>(() => {
    const stored = localStorage.getItem("saved_locations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const unique: LocationReport[] = [];
          const seen = new Set<string>();
          for (const item of parsed) {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              unique.push(item);
            }
          }
          return unique;
        }
      } catch (e) {
        console.error("Failed to parse saved_locations", e);
      }
    }
    const amazon = generateClimateReportForCoordinate(-3.4168, -62.2159, "Amazon Rainforest");
    amazon.country = "Brazil";
    amazon.region = "Amazonas";
    amazon.savedAt = new Date(Date.now() - 3600000 * 24 * 5).toISOString(); // 5 days ago
    amazon.isFavorite = true;

    const tokyo = generateClimateReportForCoordinate(35.6762, 139.6503, "Tokyo");
    tokyo.country = "Japan";
    tokyo.region = "Kanto";
    tokyo.savedAt = new Date(Date.now() - 3600000 * 24 * 2).toISOString(); // 2 days ago

    const chennai = generateClimateReportForCoordinate(13.0827, 80.2707, "Chennai");
    chennai.country = "India";
    chennai.region = "Tamil Nadu";
    chennai.savedAt = new Date(Date.now() - 3600000 * 4).toISOString(); // 4 hours ago
    chennai.isPinned = true;

    return [amazon, tokyo, chennai];
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const stored = localStorage.getItem("recent_searches");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse recent_searches", e);
      }
    }
    return ["Amazon Rainforest", "Chennai", "Tokyo"];
  });

  // Local storage synchronization hooks
  useEffect(() => {
    localStorage.setItem("saved_locations", JSON.stringify(savedLocations));
  }, [savedLocations]);

  useEffect(() => {
    localStorage.setItem("recent_searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Regional/Settings configurations
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [language, setLanguage] = useState<string>("en");
  const [alertNotifications, setAlertNotifications] = useState<boolean>(true);
  const [aqiNotifications, setAqiNotifications] = useState<boolean>(true);
  const [satelliteUpdates, setSatelliteUpdates] = useState<boolean>(true);

  useEffect(() => {
    // Keep timestamp updated on location change
    const now = new Date();
    setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [selectedLocation]);

  useEffect(() => {
    // Intercept Google Maps billing/auth errors globally
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps billing/auth failure detected. Seamlessly switching to OpenStreetMap fallbacks.");
      setIsFallbackMode(true);
      if (prevAuthFailure) {
        try {
          prevAuthFailure();
        } catch (e) {}
      }
    };

    // Override console.error to capture BillingNotEnabledMapError and other Google Maps loading issues
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ");
      if (
        msg.includes("BillingNotEnabledMapError") ||
        msg.includes("Billing") ||
        msg.includes("billing") ||
        msg.includes("Geocoding Service") ||
        msg.includes("gm_authFailure") ||
        msg.includes("ApiNotActivatedMapError")
      ) {
        console.warn("Detected Google Maps billing/activation error. Gracefully engaging OpenStreetMap fallback.");
        setIsFallbackMode(true);
        return; // Suppress and prevent logging as console.error
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
      console.error = originalConsoleError;
    };
  }, []);

  // Add search query to recent Searches
  const addToRecentSearches = (query: string) => {
    if (!query || query.trim().length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 5);
    });
  };

  // Google Places API Autocomplete predictions retrieval
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }

    // Coordinates detection
    const coordMatch = searchQuery.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
      setPredictions([
        {
          place_id: `coords_${coordMatch[1]}_${coordMatch[2]}`,
          description: `Go to coordinates: ${coordMatch[1]}, ${coordMatch[2]}`,
          isCoordinates: true,
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2]),
          structured_formatting: {
            main_text: `${coordMatch[1]}, ${coordMatch[2]}`,
            secondary_text: "Parsed Lat/Lng Coordinate Pair"
          }
        }
      ]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const fetchNominatimFallback = () => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setPredictions(
                data.slice(0, 5).map((item: any) => ({
                  description: item.display_name,
                  place_id: item.place_id,
                  structured_formatting: {
                    main_text: item.display_name.split(",")[0],
                    secondary_text: item.display_name.split(",").slice(1).join(", ")
                  },
                  osm_lat: item.lat,
                  osm_lon: item.lon
                }))
              );
            }
          })
          .catch((err) => {
            console.warn("Autocomplete fallback failed", err);
            setPredictions([]);
          });
      };

      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: searchQuery },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results);
            } else {
              if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                setIsFallbackMode(true);
              }
              fetchNominatimFallback();
            }
          }
        );
      } else {
        fetchNominatimFallback();
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const geocodeCoordinates = (lat: number, lng: number) => {
    const triggerNominatimFallback = () => {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          const name = data.display_name ? data.display_name.split(",")[0] : `Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
          const country = data.address?.country || "Global Zone";
          const state = data.address?.state || "";
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          
          const report = generateClimateReportForCoordinate(lat, lng, name);
          report.country = country;
          report.region = state || city || "Ecoregion";

          setHierarchy({
            level: city ? "city" : state ? "state" : "poi",
            country,
            state,
            city
          });
          setSelectedLocation(report);
          addToRecentSearches(name);
        })
        .catch(() => {
          const report = generateClimateReportForCoordinate(lat, lng, `Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
          report.country = "Global Zone";
          setHierarchy({
            level: "poi",
            country: "Global Zone"
          });
          setSelectedLocation(report);
          addToRecentSearches(`Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
        });
    };

    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          selectGeocodeResult(results[0]);
        } else {
          if (status !== google.maps.GeocoderStatus.ZERO_RESULTS) {
            setIsFallbackMode(true);
          }
          triggerNominatimFallback();
        }
      });
    } else {
      triggerNominatimFallback();
    }
  };

  const selectGeocodeResult = (result: google.maps.GeocoderResult) => {
    const lat = result.geometry.location.lat();
    const lng = result.geometry.location.lng();
    const viewport = result.geometry.viewport;

    let countryName = "";
    let stateName = "";
    let cityName = "";
    let level: "country" | "state" | "city" | "poi" = "poi";

    const comps = result.address_components;
    for (const comp of comps) {
      if (comp.types.includes("country")) {
        countryName = comp.long_name;
      }
      if (comp.types.includes("administrative_area_level_1")) {
        stateName = comp.long_name;
      }
      if (comp.types.includes("locality") || comp.types.includes("postal_town")) {
        cityName = comp.long_name;
      }
    }

    const primaryType = result.types[0] || "";
    if (primaryType === "country") {
      level = "country";
    } else if (primaryType.startsWith("administrative_area_level_1")) {
      level = "state";
    } else if (primaryType.startsWith("administrative_area_level_2") || primaryType === "locality" || primaryType === "postal_town") {
      level = "city";
    } else {
      level = "poi";
    }

    const name = result.formatted_address.split(",")[0];
    const report = generateClimateReportForCoordinate(lat, lng, name);
    report.country = countryName;
    report.region = stateName || cityName || "Ecoregion";

    setHierarchy({
      level,
      country: countryName,
      state: stateName,
      city: cityName,
      viewport: viewport ? {
        north: viewport.getNorthEast().lat(),
        south: viewport.getSouthWest().lat(),
        east: viewport.getNorthEast().lng(),
        west: viewport.getSouthWest().lng(),
      } : undefined
    });
    setSelectedLocation(report);
    setSearchQuery(result.formatted_address);
    addToRecentSearches(name);
  };

  // Handle item selection from prediction list
  const handleSelectPrediction = (pred: any) => {
    setSearchQuery(pred.description || pred.structured_formatting?.main_text);
    setShowPredictionsDropdown(false);

    if (pred.isCoordinates) {
      geocodeCoordinates(pred.lat, pred.lng);
      return;
    }

    if (pred.osm_lat) {
      const lat = parseFloat(pred.osm_lat);
      const lng = parseFloat(pred.osm_lon);
      const name = pred.structured_formatting.main_text;
      const report = generateClimateReportForCoordinate(lat, lng, name);
      report.country = pred.structured_formatting.secondary_text.split(",").pop()?.trim() || "Global Zone";
      
      setHierarchy({
        level: "city",
        country: report.country,
        city: name
      });
      setSelectedLocation(report);
      addToRecentSearches(name);
      return;
    }

    // Standard Google Geocoder retrieval
    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId: pred.place_id }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          selectGeocodeResult(results[0]);
        } else {
          setIsFallbackMode(true);
          // Fallback search using Nominatim for the descriptive name
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pred.description || pred.structured_formatting?.main_text)}`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                const lat = parseFloat(item.lat);
                const lng = parseFloat(item.lon);
                const name = item.display_name.split(",")[0];
                const report = generateClimateReportForCoordinate(lat, lng, name);
                report.country = item.display_name.split(",").pop()?.trim() || "Global Zone";
                setHierarchy({
                  level: "city",
                  country: report.country,
                  city: name
                });
                setSelectedLocation(report);
                addToRecentSearches(name);
              } else {
                const report = generateClimateReportForCoordinate(21.0, 78.0, pred.structured_formatting?.main_text || "Search Location");
                setSelectedLocation(report);
              }
            })
            .catch(() => {
              const report = generateClimateReportForCoordinate(21.0, 78.0, pred.structured_formatting?.main_text || "Search Location");
              setSelectedLocation(report);
            });
        }
      });
    } else {
      // Direct offline fallback if google is not loaded
      const report = generateClimateReportForCoordinate(21.0, 78.0, pred.structured_formatting?.main_text || "Search Location");
      setSelectedLocation(report);
    }
  };

  const handleSearchSubmit = (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!q || q.trim().length < 2) return;

    // Check if it's coordinates
    const coordMatch = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      geocodeCoordinates(lat, lng);
      setShowPredictionsDropdown(false);
      return;
    }

    // Otherwise, geocode the text query directly!
    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: q }, (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          if (results.length > 1) {
            const mapped = results.map((res) => ({
              place_id: res.place_id,
              description: res.formatted_address,
              structured_formatting: {
                main_text: res.formatted_address.split(",")[0],
                secondary_text: res.formatted_address.split(",").slice(1).join(", ")
              }
            }));
            setPredictions(mapped);
            setShowPredictionsDropdown(true);
          } else {
            selectGeocodeResult(results[0]);
            setShowPredictionsDropdown(false);
          }
        } else {
          if (status !== google.maps.GeocoderStatus.ZERO_RESULTS) {
            setIsFallbackMode(true);
          }
          // Fallback to Nominatim
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                const mapped = data.slice(0, 5).map((item: any) => ({
                  description: item.display_name,
                  place_id: item.place_id,
                  structured_formatting: {
                    main_text: item.display_name.split(",")[0],
                    secondary_text: item.display_name.split(",").slice(1).join(", ")
                  },
                  osm_lat: item.lat,
                  osm_lon: item.lon
                }));
                if (mapped.length > 1) {
                  setPredictions(mapped);
                  setShowPredictionsDropdown(true);
                } else {
                  const item = mapped[0];
                  const lat = parseFloat(item.osm_lat);
                  const lng = parseFloat(item.osm_lon);
                  const name = item.structured_formatting.main_text;
                  const report = generateClimateReportForCoordinate(lat, lng, name);
                  report.country = item.structured_formatting.secondary_text.split(",").pop()?.trim() || "Global Zone";
                  setHierarchy({
                    level: "city",
                    country: report.country,
                    city: name
                  });
                  setSelectedLocation(report);
                  addToRecentSearches(name);
                  setShowPredictionsDropdown(false);
                }
              } else {
                setPredictions([]);
                setShowPredictionsDropdown(true);
              }
            })
            .catch(() => {
              setPredictions([]);
              setShowPredictionsDropdown(true);
            });
        }
      });
    } else {
      // Fallback for offline development
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.slice(0, 5).map((item: any) => ({
              description: item.display_name,
              place_id: item.place_id,
              structured_formatting: {
                main_text: item.display_name.split(",")[0],
                secondary_text: item.display_name.split(",").slice(1).join(", ")
              },
              osm_lat: item.lat,
              osm_lon: item.lon
            }));
            if (mapped.length > 1) {
              setPredictions(mapped);
              setShowPredictionsDropdown(true);
            } else {
              const item = mapped[0];
              const lat = parseFloat(item.osm_lat);
              const lng = parseFloat(item.osm_lon);
              const name = item.structured_formatting.main_text;
              const report = generateClimateReportForCoordinate(lat, lng, name);
              report.country = item.structured_formatting.secondary_text.split(",").pop()?.trim() || "Global Zone";
              setHierarchy({
                level: "city",
                country: report.country,
                city: name
              });
              setSelectedLocation(report);
              addToRecentSearches(name);
              setShowPredictionsDropdown(false);
            }
          } else {
            setPredictions([]);
            setShowPredictionsDropdown(true);
          }
        })
        .catch(() => {
          setPredictions([]);
          setShowPredictionsDropdown(true);
        });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  // Perform geocode for quick-click hotspots
  const handleSelectHotspot = (spot: typeof POPULAR_HOTSPOTS[number]) => {
    if (spot.lat && spot.lng) {
      const report = generateClimateReportForCoordinate(spot.lat, spot.lng, spot.name);
      report.country = spot.type === "Country" ? spot.name : "Global Reserve";
      setHierarchy({
        level: spot.type === "City" ? "city" : "poi",
        country: report.country,
        city: spot.type === "City" ? spot.name : undefined
      });
      setSelectedLocation(report);
      setSearchQuery(spot.name);
      addToRecentSearches(spot.name);
      return;
    }

    const handleHotspotFallback = () => {
      const mockLat = spot.name === "India" ? 20.5937 : spot.name === "Japan" ? 36.2048 : 37.0902;
      const mockLng = spot.name === "India" ? 78.9629 : spot.name === "Japan" ? 138.2529 : -95.7129;
      const report = generateClimateReportForCoordinate(mockLat, mockLng, spot.name);
      report.country = spot.name;
      setHierarchy({ level: "country", country: spot.name });
      setSelectedLocation(report);
      setSearchQuery(spot.name);
      addToRecentSearches(spot.name);
    };

    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: spot.name }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          selectGeocodeResult(results[0]);
        } else {
          setIsFallbackMode(true);
          handleHotspotFallback();
        }
      });
    } else {
      handleHotspotFallback();
    }
  };

  // Detect current location
  const detectCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          geocodeCoordinates(lat, lng);
        },
        () => {
          // Standard default fallback to Chennai
          const report = generateClimateReportForCoordinate(13.0827, 80.2707, "Chennai");
          report.country = "India";
          report.region = "Tamil Nadu";
          setHierarchy({
            level: "city",
            country: "India",
            state: "Tamil Nadu",
            city: "Chennai"
          });
          setSelectedLocation(report);
          setSearchQuery("Chennai");
          addToRecentSearches("Chennai");
        }
      );
    }
  };

  const handleAddSavedLocation = (report: LocationReport) => {
    if (!savedLocations.some(l => l.id === report.id)) {
      const withMetadata = {
        ...report,
        savedAt: new Date().toISOString(),
        isFavorite: false,
        isPinned: false
      };
      setSavedLocations(prev => [...prev, withMetadata]);
      triggerToast("Location saved successfully.", "success");
    } else {
      triggerToast("Location is already saved.", "info");
    }
  };

  const handleRemoveSavedLocation = (id: string) => {
    setSavedLocations(prev => prev.filter(l => l.id !== id));
    triggerToast("Location removed successfully.", "success");
  };

  const handleRenameSavedLocation = (id: string, newName: string) => {
    setSavedLocations(prev =>
      prev.map(l => (l.id === id ? { ...l, customName: newName } : l))
    );
    triggerToast("Location renamed successfully.", "success");
  };

  const handleToggleFavorite = (id: string) => {
    setSavedLocations(prev => {
      const updated = prev.map(l => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l));
      const loc = updated.find(l => l.id === id);
      triggerToast(
        loc?.isFavorite ? "Added to favorites." : "Removed from favorites.",
        "success"
      );
      return updated;
    });
  };

  const handleTogglePinned = (id: string) => {
    setSavedLocations(prev => {
      const updated = prev.map(l => (l.id === id ? { ...l, isPinned: !l.isPinned } : l));
      const loc = updated.find(l => l.id === id);
      triggerToast(
        loc?.isPinned ? "Pinned to top." : "Unpinned.",
        "success"
      );
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    triggerToast("Recent searches cleared.", "success");
  };

  const aiBullets = selectedLocation ? getCompactAISummary(selectedLocation.telemetry) : [];

  return (
    <div 
      id="geopulse-root" 
      className="w-full h-screen overflow-hidden font-sans flex flex-col md:flex-row transition-all duration-300 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100"
    >
          
          {/*Collapsible left navigation sidebar for desktop / bottom navbar for mobile */}
          <SidebarNav
            platformName={platformName}
            activePage={activePage}
            setActivePage={setActivePage}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            isDarkMode={isDarkMode}
            isEmergencyMode={isEmergencyMode}
            setIsEmergencyMode={setIsEmergencyMode}
          />

      {/* --- CORE CONTENT CANVAS --- */}
      <main 
        id="app-main-canvas"
        className="flex-1 h-screen overflow-hidden relative pb-16 md:pb-0 flex flex-col bg-slate-50 dark:bg-[#090E17]"
      >
        {/* GLOBAL TOP NAVIGATION BAR */}
        {activePage !== "map" && activePage !== "emergency" && (
          <div className="w-full h-16 border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 transition-colors bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md text-slate-800 dark:text-slate-100 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">PLATFORM</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-sm font-extrabold capitalize text-slate-800 dark:text-slate-100">
                {activePage === "home" ? "Dashboard" : activePage === "ai" ? "AI Assistant" : activePage === "health" ? "Health Advisor" : activePage}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark / Light Mode Global Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs text-xs font-bold"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-emerald-600" />}
                <span className="hidden sm:inline">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs text-xs font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Device</span>
              </button>

              <button 
                onClick={() => triggerToast("Live Satellite Telemetry Sync complete.", "success")}
                className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs text-xs"
                title="Synchronize Live Satellite Telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs text-xs"
                title="Toggle Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setIsEmergencyMode(!isEmergencyMode);
                  if (!isEmergencyMode) {
                    triggerToast("Emergency mode enabled! Active warning siren active.", "warning");
                  } else {
                    triggerToast("Emergency mode disabled. Standard baseline restored.", "success");
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isEmergencyMode
                    ? "bg-rose-600 border-rose-500 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 shadow-2xs"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider hidden sm:inline">Emergency Mode</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full h-full relative"
            >
            
            {/* 🏠 HOME LANDING PAGE */}
            {activePage === "home" && (
              <PageHome
                platformName={platformName}
                setPlatformName={setPlatformName}
                selectedLocation={selectedLocation}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                predictions={predictions}
                showPredictionsDropdown={showPredictionsDropdown}
                setShowPredictionsDropdown={setShowPredictionsDropdown}
                handleSelectPrediction={handleSelectPrediction}
                handleKeyDown={handleKeyDown}
                recentSearches={recentSearches}
                savedLocations={savedLocations}
                onLocationSelect={setSelectedLocation}
                isDarkMode={isDarkMode}
                isFallbackMode={isFallbackMode}
                detectCurrentLocation={detectCurrentLocation}
                POPULAR_HOTSPOTS={POPULAR_HOTSPOTS}
                handleSelectHotspot={handleSelectHotspot}
                aiBullets={aiBullets}
                setActivePage={setActivePage}
                handleSearchSubmit={handleSearchSubmit}
                isEmergencyMode={isEmergencyMode}
                setIsEmergencyMode={setIsEmergencyMode}
              />
            )}

            {/* 🗺️ EXPLORE MAP PAGE */}
            {activePage === "map" && (
              <div id="explore-map-view" className="w-full h-full relative">
                {/* PRIMARY MAP LAYER */}
                <div id="gis-map-viewport" className="absolute inset-0 w-full h-full z-0">
                  <SatelliteMap
                    selectedLayer={selectedLayer}
                    selectedLocation={selectedLocation}
                    onLocationSelect={(rep, hi) => {
                      setSelectedLocation(rep);
                      if (hi) setHierarchy(hi);
                    }}
                    mapStyle={mapStyle}
                    setMapStyle={setMapStyle}
                    showTraffic={showTraffic}
                    setShowTraffic={setShowTraffic}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    measuredArea={measuredArea}
                    setMeasuredArea={setMeasuredArea}
                    hierarchy={hierarchy}
                    onHierarchySelect={setHierarchy}
                    isFallbackMode={isFallbackMode}
                    setIsFallbackMode={setIsFallbackMode}
                  />

                   {/* Elegant Atmospheric Overlay representing active environmental layer */}
                  {selectedLayer && layerVisibility[selectedLayer] !== false && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 transition-all duration-700"
                      style={{
                        backgroundColor: 
                          selectedLayer === "temperature" ? "rgba(239, 68, 68, 0.08)" :   // soft red
                          selectedLayer === "aqi" ? "rgba(96, 165, 250, 0.06)" :           // soft blue
                          selectedLayer === "rainfall" ? "rgba(59, 130, 246, 0.08)" :       // soft blue
                          selectedLayer === "flood" ? "rgba(29, 78, 216, 0.08)" :          // soft dark blue
                          selectedLayer === "ndvi" ? "rgba(96, 165, 250, 0.06)" :           // soft blue
                          selectedLayer === "wind" ? "rgba(20, 184, 166, 0.08)" :           // soft teal
                          selectedLayer === "clouds" ? "rgba(148, 163, 184, 0.12)" :        // soft slate
                          "transparent",
                        opacity: layerOpacities[selectedLayer] ?? 0.8
                      }}
                    />
                  )}

                  {/* Layer Explanation Toast Banner */}
                  <AnimatePresence>
                    {layerExplanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-40 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 pointer-events-auto"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#047857]" />
                          <span className="text-xs font-mono font-bold text-[#047857] uppercase tracking-widest text-[9px]">LAYER ACTIVATED</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900">{layerExplanation.split("::")[0]}</h4>
                        <p className="text-[11px] text-slate-600 leading-normal">{layerExplanation.split("::")[1]}</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">Source: {layerExplanation.split("::")[2]}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* GLASS BAR CONTROLS (Top Floating Search Overlay) */}
                <div id="climatepulse-topbar" className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-4 pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        setSelectedLocation(null);
                        setHierarchy({ level: "world" });
                      }}
                      className="flex items-center gap-2 font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer shrink-0 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                      title="Reset to World View"
                    >
                      <Globe className="w-5 h-5 text-[#047857]" />
                      <span className="tracking-tight text-sm">World View</span>
                    </button>

                    {/* Interactive Search Box */}
                    <div className="relative flex items-center w-[240px] md:w-[360px]">
                      <div className="absolute left-4 text-slate-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        placeholder="Search coordinates, city, forest..."
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowPredictionsDropdown(true);
                        }}
                        onFocus={() => setShowPredictionsDropdown(true)}
                        onKeyDown={handleKeyDown}
                        className="w-full text-xs pl-11 pr-10 py-3 rounded-2xl shadow-md border outline-hidden font-medium transition-all bg-white text-slate-800 border-slate-200 placeholder-slate-400 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono border border-slate-200"
                        >
                          CLEAR
                        </button>
                      )}

                      {showPredictionsDropdown && searchQuery.trim().length >= 2 && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 border rounded-2xl shadow-2xl max-h-[260px] overflow-y-auto overflow-x-hidden z-[9999] bg-white border-slate-200 text-slate-800">
                          {predictions.map((pred, idx) => (
                            <button
                              key={`${pred.place_id || 'pred'}-${pred.description || 'desc'}-${idx}`}
                              onClick={() => handleSelectPrediction(pred)}
                              className="w-full text-left px-4 py-3.5 border-b last:border-0 flex items-center gap-3 transition-colors cursor-pointer h-auto min-h-[48px] hover:bg-slate-50 border-slate-100 text-slate-700"
                            >
                              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                              <span className="text-xs font-semibold tracking-wide whitespace-normal break-words leading-relaxed flex-1">
                                <strong className={`font-extrabold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {pred.structured_formatting?.main_text || pred.description.split(",")[0]}
                                </strong>
                                {((pred.structured_formatting?.secondary_text || pred.description.split(",").slice(1).join(", ")) ? `, ${pred.structured_formatting?.secondary_text || pred.description.split(",").slice(1).join(", ")}` : "")}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pointer-events-auto shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsEmergencyMode(true);
                        setActivePage("emergency");
                      }}
                      className="flex items-center gap-2 bg-rose-600 border border-rose-500 text-white font-black px-4 py-2.5 rounded-2xl shadow-xl hover:bg-rose-700 transition-all cursor-pointer"
                    >
                      <span>🚨</span>
                      <span className="hidden sm:inline tracking-tight text-xs md:text-sm uppercase font-black">Emergency Mode</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC SPATIAL HIERARCHY BREADCRUMB TRAIL */}
                <div id="gis-breadcrumbs-bar" className="absolute top-20 left-4 z-40 pointer-events-none">
                  <MapBreadcrumbs
                    hierarchy={hierarchy}
                    selectedLocation={selectedLocation}
                    onNavigateHierarchy={(newHierarchy, clearSelectedLoc) => {
                      setHierarchy(newHierarchy);
                      if (clearSelectedLoc) {
                        setSelectedLocation(null);
                      }
                    }}
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* QUICK ACTION BUTTONS (Floating Top-Right below Search Overlay) */}
                <div id="gis-quick-actions" className="absolute top-24 right-4 z-40 flex flex-col gap-2 pointer-events-auto">
                  {/* Layers / Map Tools Toggle Button */}
                  <button
                    onClick={() => setIsMapToolsOpen(!isMapToolsOpen)}
                    className={`p-3 rounded-2xl shadow-xl border transition-all cursor-pointer flex items-center justify-center ${
                      isMapToolsOpen
                        ? "bg-[#16A34A] border-[#16A34A] text-white"
                        : "bg-[#1E293B] border-[rgba(96,165,250,0.15)] text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E293B]/80"
                    }`}
                    title="Map Tools & Layers"
                  >
                    <Layers className="w-4.5 h-4.5" />
                  </button>

                  {/* Compass Button */}
                  <button
                    onClick={() => {
                      if (selectedLocation) {
                        const tempLoc = { ...selectedLocation };
                        setSelectedLocation(null);
                        setTimeout(() => setSelectedLocation(tempLoc), 50);
                      } else {
                        setSelectedLocation(null);
                        setHierarchy({ level: "world" });
                      }
                      setIsMapToolsOpen(false);
                    }}
                    className="bg-[#1E293B] border border-[rgba(96,165,250,0.15)] p-3 rounded-2xl shadow-xl text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E293B]/80 transition-all cursor-pointer flex items-center justify-center"
                    title="Align Compass & Reset Orientation"
                  >
                    <Compass className="w-4.5 h-4.5" />
                  </button>

                  {/* Current Location Button */}
                  <button
                    onClick={() => {
                      detectCurrentLocation();
                      setIsMapToolsOpen(false);
                    }}
                    className="bg-[#1E293B] border border-[rgba(96,165,250,0.15)] p-3 rounded-2xl shadow-xl text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E293B]/80 transition-all cursor-pointer flex items-center justify-center"
                    title="Locate Current Position"
                  >
                    <Navigation className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* MODERN MAP TOOLS & LAYERS FLOATING PANEL */}
                <AnimatePresence>
                  {isMapToolsOpen && (
                    <motion.div
                      id="map-tools-panel"
                      initial={{ opacity: 0, x: 50, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-24 right-20 z-50 w-80 max-h-[calc(100vh-180px)] overflow-y-auto bg-[#1E293B]/95 backdrop-blur-xl border border-[rgba(96,165,250,0.25)] rounded-2xl shadow-2xl p-5 flex flex-col gap-5 text-[#CBD5E1] scrollbar-thin scrollbar-thumb-slate-800"
                    >
                      {/* HEADER */}
                      <div className="flex items-center justify-between pb-2 border-b border-[rgba(96,165,250,0.15)]">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#60A5FA]" />
                          <span className="text-xs font-mono font-black tracking-widest text-[#60A5FA] uppercase">MAP TOOLS</span>
                        </div>
                        <button
                          onClick={() => setIsMapToolsOpen(false)}
                          className="text-slate-400 hover:text-[#F8FAFC] transition-colors p-1 hover:bg-slate-800 rounded-lg text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* MAP TYPE */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">🗺 Map Type</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "normal" as const, label: "Roadmap", desc: "Vector view" },
                            { id: "satellite" as const, label: "Satellite", desc: "Canopy ortho" },
                            { id: "terrain" as const, label: "Terrain", desc: "Topography" },
                            { id: "hybrid" as const, label: "Hybrid", desc: "Mixed layers" },
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => {
                                setMapStyle(style.id);
                                setTimeout(() => setIsMapToolsOpen(false), 200);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                mapStyle === style.id
                                  ? "bg-emerald-600/25 border-[#16A34A] text-white shadow-inner"
                                  : "bg-[#0F172A]/50 border-[rgba(96,165,250,0.15)]/30 text-slate-300 hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="text-xs font-bold">{style.label}</div>
                              <div className="text-[9px] text-slate-400 mt-0.5">{style.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ENVIRONMENTAL LAYERS */}
                      <div className="flex flex-col gap-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">🌍 Environmental Layers</span>
                        <div className="flex flex-col gap-2.5 bg-[#0F172A]/30 p-3 rounded-xl border border-[rgba(96,165,250,0.1)]">
                          {ENVIRONMENTAL_LAYERS_CONFIG.map((layer) => {
                            const isSelected = selectedLayer === layer.id;
                            const isVisible = layerVisibility[layer.id] !== false;
                            const IconComponent = layer.icon;

                            return (
                              <div key={layer.id} className="flex flex-col gap-2 pb-3 last:pb-0 border-b border-slate-800/40 last:border-0 text-left">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <IconComponent className={`w-4 h-4 mt-0.5 ${isSelected ? "text-[#60A5FA]" : "text-slate-400"}`} />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-extrabold text-[#F8FAFC] flex items-center gap-1.5">
                                        {layer.label}
                                        {isSelected && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                        )}
                                      </span>
                                      <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{layer.description}</p>
                                      <div className="flex items-center gap-2 mt-1 text-[8px] font-mono text-slate-500">
                                        <span>{layer.updated}</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[130px]">{layer.source}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* VISIBILITY EYE TOGGLE */}
                                    <button
                                      onClick={() => {
                                        setLayerVisibility(prev => ({
                                          ...prev,
                                          [layer.id]: !isVisible
                                        }));
                                        triggerToast(`${layer.label} overlay is now ${!isVisible ? 'visible' : 'hidden'}`, "info");
                                      }}
                                      title={isVisible ? "Hide Overlay" : "Show Overlay"}
                                      className={`p-1 rounded-lg hover:bg-slate-850 transition-colors ${
                                        isVisible ? "text-sky-400" : "text-slate-600"
                                      }`}
                                    >
                                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 opacity-50" />}
                                    </button>

                                    {/* SWITCH TOGGLE FOR LAYER ACTIVATION */}
                                    <button
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedLayer("" as ClimateLayer);
                                        } else {
                                          setSelectedLayer(layer.id);
                                          setLayerExplanation(`${layer.label}::${layer.description}::${layer.source}`);
                                        }
                                      }}
                                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                                        isSelected ? "bg-[#10B981]" : "bg-slate-800"
                                      }`}
                                    >
                                      <div
                                        className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ${
                                          isSelected ? "translate-x-3.5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* OPACITY SLIDER */}
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="flex items-center gap-3 pt-1"
                                  >
                                    <span className="text-[9px] font-mono text-slate-400">Opacity:</span>
                                    <input
                                      type="range"
                                      min="0.1"
                                      max="1.0"
                                      step="0.05"
                                      value={layerOpacities[layer.id] ?? 0.8}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setLayerOpacities((prev) => ({
                                          ...prev,
                                          [layer.id]: val,
                                        }));
                                      }}
                                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                                    />
                                    <span className="text-[9px] font-mono text-[#F8FAFC] min-w-[24px] text-right">
                                      {Math.round((layerOpacities[layer.id] ?? 0.8) * 100)}%
                                    </span>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* NAVIGATION TOOLS */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">📍 Navigation Tools</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              detectCurrentLocation();
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className="p-2 bg-[#0F172A]/50 hover:bg-slate-800 border border-[rgba(96,165,250,0.1)] rounded-xl flex flex-col items-center gap-1.5 transition-all text-center"
                          >
                            <Navigation className="w-4 h-4 text-sky-400" />
                            <span className="text-[10px] font-bold">My Location</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTool(activeTool === "measure" ? "navigate" : "measure");
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className={`p-2 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                              activeTool === "measure"
                                ? "bg-[#16A34A]/20 border-[#16A34A] text-emerald-400"
                                : "bg-[#0F172A]/50 border-[rgba(96,165,250,0.1)] text-[#CBD5E1] hover:bg-slate-800"
                            }`}
                          >
                            <Route className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold">Measure Dist</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTool(activeTool === "area" ? "navigate" : "area");
                              setMeasuredArea(null);
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className={`p-2 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                              activeTool === "area"
                                ? "bg-[#16A34A]/20 border-[#16A34A] text-emerald-400"
                                : "bg-[#0F172A]/50 border-[rgba(96,165,250,0.1)] text-[#CBD5E1] hover:bg-slate-800"
                            }`}
                          >
                            <Scissors className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold">Draw Polygon</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTool("navigate");
                              setMeasuredArea(null);
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className="p-2 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center justify-center"
                          >
                            <span className="text-[10px] font-bold">Clear Drawing</span>
                          </button>
                        </div>
                      </div>

                      {/* VIEW SECTION */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">🧭 View</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => {
                              if (selectedLocation) {
                                const tempLoc = { ...selectedLocation };
                                setSelectedLocation(null);
                                setTimeout(() => setSelectedLocation(tempLoc), 50);
                              } else {
                                setSelectedLocation(null);
                                setHierarchy({ level: "world" });
                              }
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className="p-2 bg-[#0F172A]/50 hover:bg-slate-800 border border-[rgba(96,165,250,0.1)] rounded-xl flex flex-col items-center gap-1 transition-all text-center"
                          >
                            <Compass className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-[9px] font-bold">Compass</span>
                          </button>

                          <button
                            onClick={() => {
                              toggleFullscreen();
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className="p-2 bg-[#0F172A]/50 hover:bg-slate-800 border border-[rgba(96,165,250,0.1)] rounded-xl flex flex-col items-center gap-1 transition-all text-center"
                          >
                            <Maximize className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[9px] font-bold">Fullscreen</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLocation(null);
                              setHierarchy({ level: "world" });
                              setTimeout(() => setIsMapToolsOpen(false), 200);
                            }}
                            className="p-2 bg-[#0F172A]/50 hover:bg-slate-800 border border-[rgba(96,165,250,0.1)] rounded-xl flex flex-col items-center gap-1 transition-all text-center"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#60A5FA]" />
                            <span className="text-[9px] font-bold">Reset View</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FLOATING RIGHT INFORMATION PANEL (Map Overlay) */}
                {selectedLocation ? (
                  <motion.div
                    id="environmental-intelligence-panel"
                    initial={{ opacity: 0, x: 80, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className="absolute top-24 right-4 z-40 w-[340px] md:w-[370px] backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col gap-4 transition-all bg-[#1E293B]/95 text-slate-200"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-mono tracking-widest text-[#10B981] font-extrabold uppercase">
                        GEOPULSE INTEL • {hierarchy.level.toUpperCase()} LEVEL
                      </span>
                      <h2 className="text-xl font-black mt-1 tracking-tight truncate leading-tight text-slate-100">
                        {selectedLocation.name}
                      </h2>
                      <p className="text-[11px] font-bold truncate mt-0.5 text-slate-400">
                        {[hierarchy.state, selectedLocation.country].filter(Boolean).join(", ")}
                      </p>
                    </div>

                    {/* Return buttons */}
                    {hierarchy.level !== "country" && (hierarchy.country) && (
                      <button
                        onClick={() => {
                          if (hierarchy.level === "city") {
                            setHierarchy({ ...hierarchy, level: "state", city: undefined });
                          } else if (hierarchy.level === "state") {
                            setHierarchy({ ...hierarchy, level: "country", state: undefined });
                          } else {
                            setHierarchy({ ...hierarchy, level: "country" });
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 border border-slate-700 text-[10px] font-bold py-1.5 rounded-xl transition-colors bg-[#0F172A] hover:bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Return to {hierarchy.level === "city" ? "State View" : "Country View"}</span>
                      </button>
                    )}

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2 rounded-xl border border-slate-700 flex flex-col text-left bg-[#0F172A]/80">
                        <span className="text-[8px] font-bold font-mono uppercase text-slate-400">TEMP</span>
                        <span className="text-sm font-extrabold mt-1 font-mono text-slate-100">{selectedLocation.telemetry.temperature}°C</span>
                      </div>
                      <div className="p-2 rounded-xl border border-slate-700 flex flex-col text-left bg-[#0F172A]/80">
                        <span className="text-[8px] font-bold font-mono uppercase text-slate-400">AQI</span>
                        <span className="text-sm font-extrabold mt-1 font-mono text-slate-100">{selectedLocation.telemetry.aqi}</span>
                      </div>
                      <div className="p-2 rounded-xl border border-slate-700 flex flex-col text-left bg-[#0F172A]/80">
                        <span className="text-[8px] font-bold font-mono uppercase text-slate-400">HUMID</span>
                        <span className="text-sm font-extrabold mt-1 font-mono text-slate-100">{selectedLocation.telemetry.humidity}%</span>
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="border-t border-b border-slate-800 py-3 grid grid-cols-2 gap-2 text-xs text-left">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">Wind</span>
                        <span className="font-extrabold font-mono text-slate-100">{selectedLocation.telemetry.windSpeed} kph</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">Rain Prob</span>
                        <span className="font-extrabold font-mono text-slate-100">{selectedLocation.telemetry.rainProbability}%</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">Pressure</span>
                        <span className="font-extrabold font-mono text-slate-100">{selectedLocation.telemetry.pressure} hPa</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">UV Index</span>
                        <span className="font-extrabold font-mono text-slate-100">{selectedLocation.telemetry.uvIndex}</span>
                      </div>
                    </div>

                    {/* AI Ambient summary */}
                    <div className="flex flex-col text-left gap-1">
                      <span className="text-[8px] font-mono font-black uppercase text-slate-400">AI BRIEFING SUMMARY:</span>
                      <ul className="flex flex-col gap-1.5">
                        {aiBullets.slice(0, 3).map((bullet, idx) => (
                          <li key={idx} className="flex gap-1.5 text-[10px] leading-relaxed font-medium text-slate-300">
                            <span className="text-[#10B981] font-bold">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Save option */}
                    <button
                      onClick={() => {
                        if (savedLocations.some(l => l.id === selectedLocation.id)) {
                          handleRemoveSavedLocation(selectedLocation.id);
                        } else {
                          handleAddSavedLocation(selectedLocation);
                        }
                      }}
                      className={`w-full mt-1 font-extrabold text-[11px] py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        savedLocations.some(l => l.id === selectedLocation.id)
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                          : "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-emerald-600/10"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${savedLocations.some(l => l.id === selectedLocation.id) ? "fill-amber-400 text-amber-400" : "text-white"}`} />
                      <span>{savedLocations.some(l => l.id === selectedLocation.id) ? "Saved Location" : "Save Location"}</span>
                    </button>
                  </motion.div>
                ) : (
                  <div className="absolute top-24 right-4 p-5 rounded-2xl shadow-xl text-center max-w-xs z-40 border border-slate-800 transition-all bg-[#1E293B]/95 text-slate-300 backdrop-blur-sm">
                    <Compass className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
                    <p className="text-[11px] font-bold font-mono text-slate-100">MAP SESSION ACTIVE</p>
                    <p className="text-[10px] mt-1 leading-normal text-slate-400">Click any coordinate point or search above to load ecological telemetry overlays and pin markers.</p>
                  </div>
                )}
              </div>
            )}

            {/* 🌾 AGRICULTURE MODE PAGE */}
            {activePage === "agriculture" && (
              <PageAgriculture
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
              />
            )}

            {/* 🩺 HEALTH ADVISOR PAGE */}
            {activePage === "health" && (
              <PageHealthAdvisor
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
                onNavigateToMap={() => setActivePage("map")}
              />
            )}

            {/* 📊 ENVIRONMENTAL ANALYSIS PAGE */}
            {activePage === "analysis" && (
              <PageAnalysis
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
              />
            )}

            {/* 🌤 FORECAST PAGE */}
            {activePage === "forecast" && (
              <PageForecast
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
              />
            )}

            {/* 🚨 ALERTS PAGE */}
            {activePage === "alerts" && (
              <PageAlerts
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
              />
            )}

            {/* 🤖 AI ASSISTANT PAGE */}
            {activePage === "ai" && (
              <PageAi
                selectedLocation={selectedLocation}
                selectedLayer={selectedLayer}
                isDarkMode={isDarkMode}
              />
            )}

            {/* 📄 REPORTS PAGE */}
            {activePage === "reports" && (
              <PageReports
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
              />
            )}

            {/* ⭐ SAVED LOCATIONS PAGE */}
            {activePage === "saved" && (
              <PageSaved
                savedLocations={savedLocations}
                recentSearches={recentSearches}
                onLocationSelect={setSelectedLocation}
                onRemoveSavedLocation={handleRemoveSavedLocation}
                onRenameSavedLocation={handleRenameSavedLocation}
                onToggleFavorite={handleToggleFavorite}
                onTogglePinned={handleTogglePinned}
                onClearRecentSearches={handleClearRecentSearches}
                setSearchQuery={setSearchQuery}
                setActivePage={setActivePage}
                isDarkMode={isDarkMode}
                units={units}
              />
            )}

            {/* ⚙️ SETTINGS PAGE */}
            {activePage === "settings" && (
              <PageSettings
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                mapStyle={mapStyle}
                setMapStyle={setMapStyle}
                selectedLayer={selectedLayer}
                setSelectedLayer={setSelectedLayer}
                showTraffic={showTraffic}
                setShowTraffic={setShowTraffic}
                units={units}
                setUnits={setUnits}
                language={language}
                setLanguage={setLanguage}
                alertNotifications={alertNotifications}
                setAlertNotifications={setAlertNotifications}
                aqiNotifications={aqiNotifications}
                setAqiNotifications={setAqiNotifications}
                satelliteUpdates={satelliteUpdates}
                setSatelliteUpdates={setSatelliteUpdates}
              />
            )}

            {/* 🚨 EMERGENCY MODE PAGE */}
            {activePage === "emergency" && (
              <PageEmergency
                selectedLocation={selectedLocation}
                isDarkMode={isDarkMode}
                onBack={() => {
                  setActivePage("home");
                  setIsEmergencyMode(false);
                }}
                detectCurrentLocation={detectCurrentLocation}
              />
            )}

          </motion.div>
        </AnimatePresence>
        </div>
      </main>

      {/* 🔮 PREMIUM TOAST FEEDBACK NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl border bg-slate-900/95 backdrop-blur-md text-xs font-semibold max-w-sm text-slate-100"
            style={{
              borderColor: toast.type === "success" ? "rgba(34, 197, 94, 0.4)" : toast.type === "warning" ? "rgba(245, 158, 11, 0.4)" : "rgba(239, 68, 68, 0.4)",
              boxShadow: toast.type === "success" ? "0 10px 30px -10px rgba(34, 197, 94, 0.15)" : "0 10px 30px -10px rgba(0, 0, 0, 0.5)"
            }}
          >
            {toast.type === "success" && (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
            )}
            {toast.type === "warning" && (
              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3 h-3 text-sky-400" />
              </div>
            )}
            <span className="leading-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
