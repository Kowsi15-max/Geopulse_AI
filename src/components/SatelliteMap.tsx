import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { motion } from "motion/react";
import L from "leaflet";
import { LocationReport, ClimateLayer } from "../types";
import { generateClimateReportForCoordinate } from "../data";
import { 
  Compass, 
  Map as MapIcon, 
  Globe, 
  Layers, 
  Navigation, 
  Activity, 
  Thermometer, 
  Gauge, 
  CloudRain, 
  Droplets, 
  Flame, 
  Sprout, 
  Route, 
  Scissors,
  HeartPulse,
  School,
  TreePine,
  Train,
  Radio,
  MapPin
} from "lucide-react";

interface SatelliteMapProps {
  selectedLayer: ClimateLayer;
  selectedLocation: LocationReport | null;
  onLocationSelect: (report: LocationReport, hierarchy?: any) => void;
  mapStyle?: "satellite" | "terrain" | "hybrid" | "normal";
  setMapStyle?: (style: "satellite" | "terrain" | "hybrid" | "normal") => void;
  showTraffic?: boolean;
  setShowTraffic?: (show: boolean) => void;
  activeTool?: "navigate" | "measure" | "area";
  setActiveTool?: (tool: "navigate" | "measure" | "area") => void;
  measuredArea?: number | null;
  setMeasuredArea?: (area: number | null) => void;
  hierarchy?: any;
  onHierarchySelect?: (hierarchy: any) => void;
  isFallbackMode?: boolean;
  setIsFallbackMode?: (fb: boolean) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Administrative data dictionaries
const COUNTRY_STATES: Record<string, { name: string; lat: number; lng: number }[]> = {
  "India": [
    { name: "Tamil Nadu", lat: 11.1271, lng: 78.6569 },
    { name: "Maharashtra", lat: 19.7515, lng: 75.7139 },
    { name: "Karnataka", lat: 15.3173, lng: 75.7139 },
    { name: "Kerala", lat: 10.8505, lng: 76.2711 },
    { name: "Delhi", lat: 28.7041, lng: 77.1025 },
    { name: "Rajasthan", lat: 27.0238, lng: 74.2179 }
  ],
  "United States": [
    { name: "California", lat: 36.7783, lng: -119.4179 },
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "Texas", lat: 31.9686, lng: -99.9018 },
    { name: "Florida", lat: 27.6648, lng: -81.5158 }
  ],
  "Japan": [
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Kyoto", lat: 35.0116, lng: 135.7681 },
    { name: "Osaka", lat: 34.6937, lng: 135.5023 },
    { name: "Hokkaido", lat: 43.0642, lng: 141.3468 }
  ],
  "Australia": [
    { name: "New South Wales", lat: -31.2532, lng: 146.9211 },
    { name: "Victoria", lat: -37.4713, lng: 144.7852 },
    { name: "Queensland", lat: -20.9176, lng: 142.7028 },
    { name: "Western Australia", lat: -25.0423, lng: 117.7951 }
  ],
  "Brazil": [
    { name: "Amazonas", lat: -3.4168, lng: -64.0340 },
    { name: "Sao Paulo", lat: -23.5505, lng: -46.6333 },
    { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 }
  ]
};

const STATE_CITIES: Record<string, { name: string; lat: number; lng: number }[]> = {
  "Tamil Nadu": [
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    { name: "Trichy", lat: 10.7905, lng: 78.7047 },
    { name: "Salem", lat: 11.6643, lng: 78.1460 }
  ],
  "Maharashtra": [
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Nagpur", lat: 21.1458, lng: 79.0882 }
  ],
  "California": [
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
    { name: "San Diego", lat: 32.7157, lng: -117.1611 }
  ],
  "New York": [
    { name: "New York City", lat: 40.7128, lng: -74.0060 },
    { name: "Buffalo", lat: 42.8864, lng: -78.8784 }
  ],
  "Tokyo": [
    { name: "Shinjuku", lat: 35.6938, lng: 139.7034 },
    { name: "Shibuya", lat: 35.6580, lng: 139.7016 }
  ],
  "Amazonas": [
    { name: "Manaus", lat: -3.1190, lng: -60.0217 },
    { name: "Parintins", lat: -2.6283, lng: -56.7358 }
  ]
};

// Generates highly realistic fallback POIs for a city coordinates
function generatePOIsForCity(lat: number, lng: number) {
  return [
    { name: "General Medical Center", type: "hospital" as const, lat: lat + 0.008, lng: lng - 0.012 },
    { name: "City Public School", type: "school" as const, lat: lat - 0.014, lng: lng + 0.009 },
    { name: "Central Ecological Park", type: "park" as const, lat: lat + 0.015, lng: lng + 0.013 },
    { name: "Grand Central Transit Hub", type: "transit" as const, lat: lat - 0.006, lng: lng - 0.007 },
    { name: "Metro Terminal West", type: "transit" as const, lat: lat + 0.011, lng: lng - 0.018 },
    { name: "Sunrise Senior High", type: "school" as const, lat: lat + 0.018, lng: lng - 0.005 },
    { name: "St. Jude Hospital", type: "hospital" as const, lat: lat - 0.019, lng: lng + 0.015 },
    { name: "Metro Botanical Gardens", type: "park" as const, lat: lat - 0.003, lng: lng + 0.022 }
  ];
}

// Map Controller for handling smooth administrative fly/zoom animations
function MapController({ 
  selectedLocation, 
  hierarchy 
}: { 
  selectedLocation: LocationReport | null; 
  hierarchy: any;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedLocation) return;

    if (hierarchy && hierarchy.viewport) {
      // Use Google Geocoder viewport bounds for a perfect fit!
      const bounds = new google.maps.LatLngBounds(
        { lat: hierarchy.viewport.south, lng: hierarchy.viewport.west },
        { lat: hierarchy.viewport.north, lng: hierarchy.viewport.east }
      );
      map.fitBounds(bounds, 50); // fit with padding
    } else {
      // Fallback coordinate pan
      map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      
      // Select appropriate zoom based on explicit hierarchy level if present
      if (hierarchy && hierarchy.level) {
        if (hierarchy.level === "country") {
          map.setZoom(5);
        } else if (hierarchy.level === "state") {
          map.setZoom(8);
        } else if (hierarchy.level === "city") {
          map.setZoom(12);
        } else {
          map.setZoom(13);
        }
      } else {
        // Simple heuristic zoom
        const currentZoom = map.getZoom() || 4;
        if (currentZoom < 6) {
          map.setZoom(8);
        }
      }
    }
  }, [map, selectedLocation, hierarchy]);

  return null;
}

// Distance Measurer controller
function DistanceMeasurer({ active, map }: { active: boolean; map: google.maps.Map | null }) {
  const [points, setPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!active) {
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      setPoints([]);
      return;
    }

    const clickListener = map.addListener("click", (e: any) => {
      const latLng = e.latLng;
      if (!latLng) return;
      const pt = { lat: latLng.lat(), lng: latLng.lng() };
      setPoints((prev) => {
        const next = [...prev, pt];
        if (next.length > 2) return next.slice(-2);
        return next;
      });
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, active]);

  useEffect(() => {
    if (!map) return;
    if (lineRef.current) lineRef.current.setMap(null);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    if (points.length === 0) return;

    points.forEach((pt, idx) => {
      const m = new google.maps.Marker({
        position: pt,
        map,
        label: { text: (idx + 1).toString(), color: "#ffffff" },
      });
      markersRef.current.push(m);
    });

    if (points.length === 2) {
      const line = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: "#059669",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
      lineRef.current = line;

      // Calculate distance
      const R = 6371; // km
      const dLat = ((points[1].lat - points[0].lat) * Math.PI) / 180;
      const dLng = ((points[1].lng - points[0].lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((points[0].lat * Math.PI) / 180) *
          Math.cos((points[1].lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const midLat = (points[0].lat + points[1].lat) / 2;
      const midLng = (points[0].lng + points[1].lng) / 2;

      const iw = new google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; font-family: sans-serif; font-size: 11px; padding: 4px; font-weight: 700;">
            Distance: ${distance.toFixed(1)} km
          </div>
        `,
        position: { lat: midLat, lng: midLng },
      });
      iw.open(map);
      infoWindowRef.current = iw;
    }
  }, [points, map]);

  return null;
}

// Area / Polygon selection controller
interface PolygonSelectorProps {
  active: boolean;
  map: google.maps.Map | null;
  onAreaSelect: (areaKm2: number) => void;
}

function PolygonSelector({ active, map, onAreaSelect }: PolygonSelectorProps) {
  const [points, setPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const polyRef = useRef<google.maps.Polygon | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    if (!active) {
      if (polyRef.current) {
        polyRef.current.setMap(null);
        polyRef.current = null;
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      setPoints([]);
      return;
    }

    const clickListener = map.addListener("click", (e: any) => {
      const latLng = e.latLng;
      if (!latLng) return;
      const pt = { lat: latLng.lat(), lng: latLng.lng() };
      setPoints((prev) => [...prev, pt]);
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, active]);

  useEffect(() => {
    if (!map) return;
    if (polyRef.current) polyRef.current.setMap(null);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (points.length === 0) return;

    points.forEach((pt, idx) => {
      const m = new google.maps.Marker({
        position: pt,
        map,
        label: { text: (idx + 1).toString(), color: "#ffffff" },
      });
      markersRef.current.push(m);
    });

    if (points.length >= 3) {
      const poly = new google.maps.Polygon({
        paths: points,
        strokeColor: "#059669",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.25,
        map,
      });
      polyRef.current = poly;

      // Approx area bounding box
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      points.forEach((p) => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
      });
      const height = Math.abs(maxLat - minLat) * 111;
      const width = Math.abs(maxLng - minLng) * 111 * Math.cos(((minLat + maxLat) / 2 * Math.PI) / 180);
      const approxArea = Math.round(width * height * 0.5);
      onAreaSelect(approxArea);
    }
  }, [points, map]);

  return null;
}

const getLayerFilterClass = (layer: ClimateLayer) => {
  switch (layer) {
    case "temperature": return "hue-rotate-15 saturate-125 brightness-95";
    case "aqi": return "hue-rotate-60 saturate-110 brightness-90";
    case "rainfall": return "hue-rotate-[240deg] saturate-120 brightness-95";
    case "flood": return "hue-rotate-[200deg] saturate-130 brightness-90";
    case "wildfire": return "brightness-75 contrast-125 saturate-150 hue-rotate-[15deg]";
    case "ndvi": return "hue-rotate-[100deg] saturate-150 brightness-95";
    default: return "";
  }
};

function LeafletFallbackMap({
  selectedLayer,
  selectedLocation,
  onLocationSelect,
  mapStyle = "hybrid",
  hierarchy,
  onHierarchySelect,
  activeTool
}: any) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Dynamic Leaflet CSS injection
  useEffect(() => {
    if (!document.getElementById("leaflet-cdn-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = selectedLocation?.lat ?? 21.0;
    const initialLng = selectedLocation?.lng ?? 78.0;
    const initialZoom = selectedLocation ? 8 : 3;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    mapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);

    // Zoom Controls to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Click handler for location query/reverse geocoding
    map.on("click", (e: any) => {
      if (activeTool !== "navigate") return;
      const { lat, lng } = e.latlng;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          const name = data.display_name ? data.display_name.split(",")[0] : `Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
          const country = data.address?.country || "Global Basin";
          const state = data.address?.state || "";
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          
          const report = generateClimateReportForCoordinate(lat, lng, name);
          report.country = country;
          report.region = state || city || "Ecoregion";

          onLocationSelect(report, {
            level: city ? "city" : state ? "state" : "poi",
            country,
            state,
            city
          });
        })
        .catch(() => {
          const report = generateClimateReportForCoordinate(lat, lng);
          onLocationSelect(report, { level: "poi" });
        });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Tiles based on mapStyle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png";
    if (mapStyle === "satellite" || mapStyle === "hybrid") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    } else if (mapStyle === "terrain") {
      url = "https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png";
    }

    const tile = L.tileLayer(url, {
      maxZoom: 18,
    });
    tile.addTo(map);
    tileLayerRef.current = tile;
  }, [mapStyle]);

  // Sync Center and Zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    let targetZoom = map.getZoom() || 5;
    if (hierarchy?.level === "country") {
      targetZoom = 5;
    } else if (hierarchy?.level === "state") {
      targetZoom = 8;
    } else if (hierarchy?.level === "city") {
      targetZoom = 12;
    } else if (hierarchy?.level === "poi") {
      targetZoom = 13;
    }

    map.setView([selectedLocation.lat, selectedLocation.lng], targetZoom, { animate: true });
  }, [selectedLocation, hierarchy]);

  // Sync Markers
  useEffect(() => {
    const map = mapRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Core Selected Location Pulse Marker
    if (selectedLocation) {
      const mainIcon = L.divIcon({
        className: "",
        html: `
          <div class="flex items-center justify-center">
            <div class="relative w-10 h-10 flex items-center justify-center">
              <div class="relative rounded-full w-4.5 h-4.5 bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        `
      });

      L.marker([selectedLocation.lat, selectedLocation.lng], { icon: mainIcon }).addTo(group);
    }

    // 2. Country states hierarchy markers
    const currentLevel = hierarchy?.level || "world";
    const activeCountry = hierarchy?.country || "";

    if (currentLevel === "country") {
      const statesList = COUNTRY_STATES[activeCountry] || [];
      statesList.forEach((st) => {
        const stateIcon = L.divIcon({
          className: "",
          html: `
            <div class="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-blue-600 border border-blue-500/50 shadow-lg text-white text-[9px] font-black tracking-tight whitespace-nowrap cursor-pointer transition-colors">
              📍 ${st.name}
            </div>
          `
        });

        const m = L.marker([st.lat, st.lng], { icon: stateIcon });
        m.on("click", () => {
          const rep = generateClimateReportForCoordinate(st.lat, st.lng, st.name);
          rep.country = activeCountry;
          rep.region = st.name;
          onHierarchySelect({
            level: "state",
            country: activeCountry,
            state: st.name
          });
          onLocationSelect(rep, { level: "state", country: activeCountry, state: st.name });
        });
        m.addTo(group);
      });
    }

    // 3. State level cities and weather stations
    if (currentLevel === "state" && selectedLocation) {
      const activeState = hierarchy?.state || "";
      const citiesList = STATE_CITIES[activeState] || [];
      const weatherStations = [
        { name: "Meteo-Tower Alpha", lat: selectedLocation.lat + 0.35, lng: selectedLocation.lng - 0.25, tempOffset: -2, aqiOffset: -10 },
        { name: "Eco-Station Coastal", lat: selectedLocation.lat - 0.2, lng: selectedLocation.lng + 0.45, tempOffset: 1, aqiOffset: 15 },
        { name: "Forest Canopy Radar", lat: selectedLocation.lat + 0.15, lng: selectedLocation.lng - 0.5, tempOffset: -3, aqiOffset: -20 }
      ];

      citiesList.forEach((ci) => {
        const cityIcon = L.divIcon({
          className: "",
          html: `
            <div class="px-2.5 py-1 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 shadow-xl text-slate-100 text-[9px] font-bold whitespace-nowrap cursor-pointer transition-colors">
              🌆 ${ci.name}
            </div>
          `
        });

        const m = L.marker([ci.lat, ci.lng], { icon: cityIcon });
        m.on("click", () => {
          const rep = generateClimateReportForCoordinate(ci.lat, ci.lng, ci.name);
          rep.country = activeCountry;
          rep.region = activeState;
          onHierarchySelect({
            level: "city",
            country: activeCountry,
            state: activeState,
            city: ci.name
          });
          onLocationSelect(rep, { level: "city", country: activeCountry, state: activeState, city: ci.name });
        });
        m.addTo(group);
      });

      weatherStations.forEach((ws) => {
        const wsIcon = L.divIcon({
          className: "",
          html: `
            <div class="px-2 py-0.5 rounded-lg bg-blue-500 text-white text-[8px] font-mono font-bold tracking-tight whitespace-nowrap flex items-center gap-1 shadow-sm border border-sky-400">
              ⚡ ${ws.name}
            </div>
          `
        });

        L.marker([ws.lat, ws.lng], { icon: wsIcon }).addTo(group);
      });
    }

    // 4. City level POIs
    if (currentLevel === "city" && selectedLocation) {
      const poisList = generatePOIsForCity(selectedLocation.lat, selectedLocation.lng);
      poisList.forEach((poi) => {
        const poiIcon = L.divIcon({
          className: "",
          html: `
            <div class="px-2.5 py-1 rounded-full bg-cyan-500 text-white border border-cyan-400 shadow-md text-[9px] font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer hover:bg-cyan-600 transition-colors">
              🔍 ${poi.name}
            </div>
          `
        });

        const m = L.marker([poi.lat, poi.lng], { icon: poiIcon });
        m.on("click", () => {
          const rep = generateClimateReportForCoordinate(poi.lat, poi.lng, poi.name);
          rep.country = activeCountry;
          rep.region = hierarchy?.state || "";
          onLocationSelect(rep, {
            level: "poi",
            country: activeCountry,
            state: hierarchy?.state,
            city: hierarchy?.city
          });
        });
        m.addTo(group);
      });
    }

  }, [selectedLocation, hierarchy]);

  const activeFilterClass = getLayerFilterClass(selectedLayer);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full transition-all duration-700 ${activeFilterClass}`} 
      />
    </div>
  );
}

export default function SatelliteMap({
  selectedLayer,
  selectedLocation,
  onLocationSelect,
  mapStyle = "hybrid",
  showTraffic = false,
  activeTool = "navigate",
  measuredArea = null,
  setMeasuredArea = () => {},
  hierarchy = null,
  onHierarchySelect = () => {},
  isFallbackMode = false,
  setIsFallbackMode = () => {}
}: SatelliteMapProps) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);

  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  // Bind Real-Time Traffic Layer
  useEffect(() => {
    if (!mapInstance) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) trafficLayerRef.current = new google.maps.TrafficLayer();
      trafficLayerRef.current.setMap(mapInstance);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [mapInstance, showTraffic]);

  // Handle map click for manual location reverse geocoding
  const handleMapClick = (e: any) => {
    if (activeTool !== "navigate") return;

    const latLng = e.detail?.latLng || e.latLng;
    if (latLng) {
      const lat = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat;
      const lng = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng;

      const triggerNominatimFallback = () => {
        setIsFallbackMode(true);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            const name = data.display_name ? data.display_name.split(",")[0] : `Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
            const country = data.address?.country || "Global Basin";
            const state = data.address?.state || "";
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            
            const report = generateClimateReportForCoordinate(lat, lng, name);
            report.country = country;
            report.region = state || city || "Ecoregion";

            onLocationSelect(report, {
              level: city ? "city" : state ? "state" : "poi",
              country,
              state,
              city
            });
          })
          .catch(() => {
            const report = generateClimateReportForCoordinate(lat, lng);
            onLocationSelect(report, { level: "poi" });
          });
      };

      if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const parsedComponents = results[0].address_components;
            let country = "Global Basin";
            let state = "";
            let city = "";

            for (const comp of parsedComponents) {
              if (comp.types.includes("country")) country = comp.long_name;
              if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
              if (comp.types.includes("locality") || comp.types.includes("postal_town")) city = comp.long_name;
            }

            const name = results[0].formatted_address.split(",")[0];
            const report = generateClimateReportForCoordinate(lat, lng, name);
            report.country = country;
            report.region = state || city || "Ecoregion";

            onLocationSelect(report, {
              level: city ? "city" : state ? "state" : "poi",
              country,
              state,
              city
            });
          } else {
            triggerNominatimFallback();
          }
        });
      } else {
        triggerNominatimFallback();
      }
    }
  };

  // Pre-fetch administrative markers
  const activeCountry = hierarchy?.country || "";
  const activeState = hierarchy?.state || "";
  const activeCity = hierarchy?.city || "";
  const currentLevel = hierarchy?.level || "world";

  const statesList = COUNTRY_STATES[activeCountry] || [];
  const citiesList = STATE_CITIES[activeState] || [];
  
  // Local POIs list for city level
  const poisList = currentLevel === "city" && selectedLocation
    ? generatePOIsForCity(selectedLocation.lat, selectedLocation.lng)
    : [];

  // Weather Stations List for state level
  const weatherStations = currentLevel === "state" && selectedLocation
    ? [
        { name: "Meteo-Tower Alpha", lat: selectedLocation.lat + 0.35, lng: selectedLocation.lng - 0.25, tempOffset: -2, aqiOffset: -10 },
        { name: "Eco-Station Coastal", lat: selectedLocation.lat - 0.2, lng: selectedLocation.lng + 0.45, tempOffset: 1, aqiOffset: 15 },
        { name: "Forest Canopy Radar", lat: selectedLocation.lat + 0.15, lng: selectedLocation.lng - 0.5, tempOffset: -3, aqiOffset: -20 }
      ]
    : [];

  // Custom coloring based on active layer metric
  const getMetricColor = (val: number, type: ClimateLayer) => {
    if (type === "temperature") {
      if (val < 15) return "bg-blue-500 text-white";
      if (val < 28) return "bg-blue-600 text-white";
      if (val < 35) return "bg-yellow-500 text-slate-900";
      return "bg-rose-500 text-white";
    }
    if (type === "aqi") {
      if (val <= 50) return "bg-blue-600 text-white";
      if (val <= 100) return "bg-yellow-500 text-slate-900";
      return "bg-rose-500 text-white";
    }
    // Default blue/green theme accent
    return "bg-blue-600 text-white";
  };

  if (isFallbackMode || !hasValidKey) {
    return (
      <div id="central-satellite-map" className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
        <LeafletFallbackMap
          selectedLayer={selectedLayer}
          selectedLocation={selectedLocation}
          onLocationSelect={onLocationSelect}
          mapStyle={mapStyle}
          hierarchy={hierarchy}
          onHierarchySelect={onHierarchySelect}
          activeTool={activeTool}
        />
      </div>
    );
  }

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-50 p-6 text-slate-800">
        <div className="text-center max-w-md space-y-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
            <MapIcon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold">Geospatial Maps API Key Required</h2>
          <p className="text-xs text-slate-500">
            Provide a valid maps key in your Workspace settings environment to enable full environmental mapping.
          </p>
        </div>
      </div>
    );
  }

  // Draw a standard styled map style object
  const mapsCustomStyle = [
    { elementType: "geometry", stylers: [{ color: "#fafafa" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#10b981" }, { fontWeight: "bold" }, { width: 3 }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#f0fdf4" }] }
  ];

  return (
    <div id="central-satellite-map" className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
      
      <APIProvider apiKey={API_KEY} version="weekly" libraries={["places"]}>
        <Map
          defaultCenter={{ lat: 21.0, lng: 78.0 }}
          defaultZoom={3}
          minZoom={2}
          maxZoom={15}
          mapId="DEMO_MAP_ID"
          mapTypeId={mapStyle === "normal" ? "roadmap" : mapStyle}
          gestureHandling="greedy"
          disableDefaultUI={true}
          onClick={handleMapClick}
          styles={mapsCustomStyle}
          style={{ width: "100%", height: "100%" }}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          onTilesloaded={(e) => {
            if (e.map && !mapInstance) setMapInstance(e.map);
          }}
        >
          {/* Panoramic Camera Controller */}
          <MapController selectedLocation={selectedLocation} hierarchy={hierarchy} />

          {/* Core Measurer utilities */}
          <DistanceMeasurer active={activeTool === "measure"} map={mapInstance} />
          <PolygonSelector 
            active={activeTool === "area"} 
            map={mapInstance} 
            onAreaSelect={(areaKm2) => setMeasuredArea(areaKm2)} 
          />

          {/* RENDER HIERARCHICAL ADMINISTRATIVE MARKERS */}

          {/* Country Level: Render States & Cities */}
          {currentLevel === "country" && statesList.map((st) => (
            <AdvancedMarker 
              key={st.name} 
              position={{ lat: st.lat, lng: st.lng }}
              onClick={() => {
                const handleStateSelectFallback = () => {
                  const rep = generateClimateReportForCoordinate(st.lat, st.lng, st.name);
                  rep.country = activeCountry;
                  rep.region = st.name;
                  onHierarchySelect({
                    level: "state",
                    country: activeCountry,
                    state: st.name,
                    viewport: {
                      north: st.lat + 1.5,
                      south: st.lat - 1.5,
                      east: st.lng + 1.5,
                      west: st.lng - 1.5,
                    }
                  });
                  onLocationSelect(rep, { level: "state", country: activeCountry, state: st.name });
                };

                if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
                  const geocoder = new google.maps.Geocoder();
                  geocoder.geocode({ address: `${st.name}, ${activeCountry}` }, (results, status) => {
                    if (status === "OK" && results && results[0]) {
                      const rep = generateClimateReportForCoordinate(st.lat, st.lng, st.name);
                      rep.country = activeCountry;
                      rep.region = st.name;
                      onHierarchySelect({
                        level: "state",
                        country: activeCountry,
                        state: st.name,
                        viewport: {
                          north: results[0].geometry.viewport.getNorthEast().lat(),
                          south: results[0].geometry.viewport.getSouthWest().lat(),
                          east: results[0].geometry.viewport.getNorthEast().lng(),
                          west: results[0].geometry.viewport.getSouthWest().lng(),
                        }
                      });
                      onLocationSelect(rep, { level: "state", country: activeCountry, state: st.name });
                    } else {
                      handleStateSelectFallback();
                    }
                  });
                } else {
                  handleStateSelectFallback();
                }
              }}
            >
              <div 
                className="bg-[#0F172A]/95 text-slate-100 border-2 border-emerald-500 rounded-full px-3 py-1 text-xs font-bold shadow-2xl flex items-center gap-1.5 cursor-pointer transform hover:scale-105 transition-all"
                onMouseEnter={() => setHoveredNode(st.name)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{st.name}</span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                  State
                </span>
              </div>
            </AdvancedMarker>
          ))}

          {/* State Level: Render Districts, major Cities, and Weather Stations */}
          {currentLevel === "state" && (
            <>
              {/* Major Cities Pins */}
              {citiesList.map((ct) => (
                <AdvancedMarker
                  key={ct.name}
                  position={{ lat: ct.lat, lng: ct.lng }}
                  onClick={() => {
                    const handleCitySelectFallback = () => {
                      const rep = generateClimateReportForCoordinate(ct.lat, ct.lng, ct.name);
                      rep.country = activeCountry;
                      rep.region = activeState;
                      onHierarchySelect({
                        level: "city",
                        country: activeCountry,
                        state: activeState,
                        city: ct.name,
                        viewport: {
                          north: ct.lat + 0.15,
                          south: ct.lat - 0.15,
                          east: ct.lng + 0.15,
                          west: ct.lng - 0.15,
                        }
                      });
                      onLocationSelect(rep, { level: "city", country: activeCountry, state: activeState, city: ct.name });
                    };

                    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
                      const geocoder = new google.maps.Geocoder();
                      geocoder.geocode({ address: `${ct.name}, ${activeState}, ${activeCountry}` }, (results, status) => {
                        if (status === "OK" && results && results[0]) {
                          const rep = generateClimateReportForCoordinate(ct.lat, ct.lng, ct.name);
                          rep.country = activeCountry;
                          rep.region = activeState;
                          onHierarchySelect({
                            level: "city",
                            country: activeCountry,
                            state: activeState,
                            city: ct.name,
                            viewport: {
                              north: results[0].geometry.viewport.getNorthEast().lat(),
                              south: results[0].geometry.viewport.getSouthWest().lat(),
                              east: results[0].geometry.viewport.getNorthEast().lng(),
                              west: results[0].geometry.viewport.getSouthWest().lng(),
                            }
                          });
                          onLocationSelect(rep, { level: "city", country: activeCountry, state: activeState, city: ct.name });
                        } else {
                          handleCitySelectFallback();
                        }
                      });
                    } else {
                      handleCitySelectFallback();
                    }
                  }}
                >
                  <div className="flex flex-col items-center group cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 shadow border border-slate-700 font-sans">
                      {ct.name}
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* Weather Stations */}
              {weatherStations.map((ws) => {
                const telemetry = selectedLocation?.telemetry;
                const temp = Math.round((telemetry?.temperature || 26) + ws.tempOffset);
                const aqi = Math.max(5, (telemetry?.aqi || 45) + ws.aqiOffset);
                const activeVal = selectedLayer === "temperature" ? `${temp}°C` : `${aqi} AQI`;
                const activeColor = selectedLayer === "temperature" ? getMetricColor(temp, "temperature") : getMetricColor(aqi, "aqi");

                return (
                  <AdvancedMarker
                    key={ws.name}
                    position={{ lat: ws.lat, lng: ws.lng }}
                    onClick={() => {
                      const stationReport = generateClimateReportForCoordinate(ws.lat, ws.lng, ws.name);
                      stationReport.country = activeCountry;
                      stationReport.region = activeState;
                      stationReport.telemetry.temperature = temp;
                      stationReport.telemetry.aqi = aqi;
                      onLocationSelect(stationReport, { level: "state", country: activeCountry, state: activeState });
                    }}
                  >
                    <div className="flex items-center gap-1 bg-[#0F172A]/95 border border-slate-700 p-1.5 rounded-xl shadow-xl cursor-pointer transform hover:scale-105 transition-all">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase leading-none">STATION</span>
                        <span className="text-[10px] font-bold text-slate-100 leading-tight truncate max-w-[90px]">{ws.name}</span>
                      </div>
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${activeColor} font-mono`}>
                        {activeVal}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}
            </>
          )}

          {/* City Level: Render detailed Environmental POIs (Hospitals, Schools, Parks, Subway) */}
          {currentLevel === "city" && poisList.map((poi) => {
            const telemetry = selectedLocation?.telemetry;
            const microTemp = Math.round((telemetry?.temperature || 28) + (poi.type === "park" ? -2.5 : poi.type === "hospital" ? 0.5 : 0));
            const microAqi = Math.max(5, (telemetry?.aqi || 60) + (poi.type === "park" ? -15 : poi.type === "hospital" ? -5 : 5));

            let PoiIcon = HeartPulse;
            let iconColor = "bg-rose-500 text-white";
            if (poi.type === "school") {
              PoiIcon = School;
              iconColor = "bg-blue-500 text-white";
            } else if (poi.type === "park") {
              PoiIcon = TreePine;
              iconColor = "bg-blue-500 text-white";
            } else if (poi.type === "transit") {
              PoiIcon = Train;
              iconColor = "bg-purple-500 text-white";
            }

            return (
              <AdvancedMarker
                key={poi.name}
                position={{ lat: poi.lat, lng: poi.lng }}
                onClick={() => setSelectedPoi({ ...poi, microTemp, microAqi })}
              >
                <div className="group cursor-pointer flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border border-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${iconColor}`}>
                    <PoiIcon className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Primary selected search location marker */}
          {selectedLocation && (
            <AdvancedMarker position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}>
              <div className="relative flex items-center justify-center w-14 h-14 pointer-events-none">
                
                {/* Visual pulse rings */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-12 h-12 rounded-full bg-blue-500/35 border border-blue-500/50"
                />
                
                <motion.div
                  initial={{ scale: 0, y: -25 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  className="relative w-7 h-7 rounded-full bg-white border-2 border-blue-500 shadow-2xl flex items-center justify-center cursor-pointer pointer-events-auto"
                >
                  <div className="w-4.5 h-4.5 rounded-full bg-blue-500 border border-white flex items-center justify-center shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </motion.div>
              </div>
            </AdvancedMarker>
          )}

          {/* Interactive POI Microclimate InfoBubble popup */}
          {selectedPoi && (
            <InfoWindow
              position={{ lat: selectedPoi.lat, lng: selectedPoi.lng }}
              onCloseClick={() => setSelectedPoi(null)}
            >
              <div className="text-slate-900 font-sans p-2 min-w-[200px]">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono font-bold uppercase pb-1 border-b border-slate-100">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  <span>MICROCLIMATE INTEL</span>
                </div>
                <div className="font-extrabold text-xs text-slate-800 mt-1.5 leading-tight">{selectedPoi.name}</div>
                <div className="text-[9px] text-slate-400 font-medium capitalize mt-0.5">{selectedPoi.type} Node</div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                  <div className="bg-slate-50 p-1.5 rounded-lg flex flex-col">
                    <span className="text-[8px] font-mono text-slate-400 font-extrabold">LOCAL AQI</span>
                    <span className="font-bold text-blue-600 font-mono">{selectedPoi.microAqi}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg flex flex-col">
                    <span className="text-[8px] font-mono text-slate-400 font-extrabold">LOCAL TEMP</span>
                    <span className="font-bold text-rose-600 font-mono">{selectedPoi.microTemp}°C</span>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

        </Map>
      </APIProvider>

      {/* Floating Measurer Status Indicator if active */}
      {activeTool === "area" && measuredArea !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md text-white font-mono text-[10px] px-4 py-1.5 rounded-full shadow-lg font-bold border border-slate-700 whitespace-nowrap">
          Polygon Area: {measuredArea.toLocaleString()} km²
        </div>
      )}
    </div>
  );
}
