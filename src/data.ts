import { LocationReport, ClimateTelemetry, ClimateLayer, LayerConfig, ClimatePrediction, DisasterAlert } from "./types";

// Seeded pseudorandom function to ensure consistency when clicking same spot
export function getSeededRandom(lat: number, lng: number) {
  const x = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Global weather layer configs matching the requests
export const layersConfig: LayerConfig[] = [
  { id: "aqi", name: "Air Quality", color: "#10b981", icon: "Activity", unit: "AQI", min: 0, max: 500 },
  { id: "temperature", name: "Temperature", color: "#ef4444", icon: "Thermometer", unit: "°C", min: -20, max: 50 },
  { id: "rainfall", name: "Rainfall", color: "#3b82f6", icon: "CloudRain", unit: "mm/y", min: 0, max: 4000 },
  { id: "flood", name: "Flood Risk", color: "#0284c7", icon: "Waves", unit: "Index", min: 0, max: 100 },
  { id: "ndvi", name: "Vegetation (NDVI)", color: "#16a34a", icon: "Sprout", unit: "Index", min: 0, max: 1 },
  { id: "wildfire", name: "Wildfire Risk", color: "#f97316", icon: "Flame", unit: "%", min: 0, max: 100 },
  { id: "population", name: "Population", color: "#ec4899", icon: "Users", unit: "p/km²", min: 0, max: 15000 },
  { id: "wind", name: "Wind Speed", color: "#06b6d4", icon: "Wind", unit: "km/h", min: 0, max: 100 }
];

export function fillMissingTelemetry(lat: number, lng: number, base: Partial<ClimateTelemetry>): ClimateTelemetry {
  const seed = getSeededRandom(lat, lng);
  const absLat = Math.abs(lat);
  
  const temperature = base.temperature ?? Math.round((30 - absLat * 0.55 + (seed * 4 - 2)) * 10) / 10;
  const humidity = base.humidity ?? Math.max(5, Math.min(98, Math.floor(absLat < 10 ? (75 + seed * 20) : absLat > 15 && absLat < 35 ? (10 + seed * 25) : (40 + seed * 45))));
  const rainfall = base.rainfall ?? (humidity > 70 ? Math.floor(1800 + seed * 1500) : humidity < 25 ? Math.floor(50 + seed * 150) : Math.floor(500 + seed * 1200));
  const ndvi = base.ndvi ?? Math.round(Math.max(0.01, Math.min(0.98, humidity < 20 ? 0.05 + seed * 0.1 : humidity > 80 ? 0.82 + seed * 0.12 : 0.3 + seed * 0.5)) * 100) / 100;
  const aqi = base.aqi ?? Math.max(5, Math.min(480, (absLat > 10 && absLat < 45 && seed > 0.6) ? (145 + Math.floor(seed * 45)) : (15 + Math.floor(seed * 45))));
  
  let aqiLabel = "Excellent";
  if (aqi > 50 && aqi <= 100) aqiLabel = "Good";
  else if (aqi > 100 && aqi <= 150) aqiLabel = "Moderate Air Quality";
  else if (aqi > 150 && aqi <= 200) aqiLabel = "Unhealthy Air";
  else if (aqi > 200) aqiLabel = "Very Poor Air";

  let ndviDensity = "Dry / Bare Ground";
  if (ndvi > 0.15 && ndvi <= 0.4) ndviDensity = "Grassland & Shrubs";
  else if (ndvi > 0.4 && ndvi <= 0.7) ndviDensity = "Medium Forest Cover";
  else if (ndvi > 0.7) ndviDensity = "Dense Forest";

  const deforestation = base.deforestation ?? (ndvi > 0.6 ? (seed > 0.85 ? "High Tree Loss Alert" : seed > 0.65 ? "Tree Clearing Alert" : seed > 0.45 ? "Low Activity" : "Stable") : "Stable");
  
  const tempAnomaly = base.tempAnomaly ?? Math.round((0.8 + seed * 1.8) * 10) / 10;
  
  const climateRisk = base.climateRisk ?? Math.floor(30 + seed * 65);
  const riskFactor = base.riskFactor ?? (climateRisk > 40 ? (humidity < 25 && temperature > 35 ? "Severe Drought" : ndvi > 0.5 && humidity < 40 && temperature > 28 ? "Wildfire Risk" : humidity < 30 && ndvi < 0.25 ? "Dry Land Expansion" : rainfall > 2500 ? "Heavy Rainfall Risk" : "None") : "None");

  // Premium metrics
  const feelsLike = Math.round((temperature + (humidity > 70 ? 2 : -1.5)) * 10) / 10;
  const rainProbability = Math.min(100, Math.max(0, Math.floor((humidity - 25) * 1.4)));
  const pressure = Math.round(1013.25 - (lat * 0.05) + (seed * 10 - 5));
  const windSpeed = Math.round((seed * 38 + 4) * 10) / 10;
  const windDirDegrees = Math.floor(seed * 360);
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const windDirection = directions[Math.floor(((windDirDegrees + 11.25) % 360) / 22.5)];
  const uvIndex = Math.max(1, Math.min(12, Math.floor((90 - absLat) * 0.15 + seed * 2.5)));
  const visibility = Math.max(1, Math.min(16, Math.floor(16 - (aqi / 35) - (humidity > 85 ? 3 : 0))));
  const cloudCoverage = Math.min(100, Math.max(0, Math.floor((humidity - 15) * 1.3)));
  const elevation = Math.floor(seed * 2800 + 12);

  // Sunrise / sunset dependent on lat
  const sunriseHour = 5 + Math.floor(Math.abs(lat) / 30);
  const sunsetHour = 18 - Math.floor(Math.abs(lat) / 30);
  const sunrise = `0${sunriseHour}:42 AM`;
  const sunset = `${sunsetHour}:${Math.floor(seed * 40 + 10)} PM`;

  const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Third Quarter", "Waning Crescent"];
  const moonPhase = phases[Math.floor(seed * phases.length)];

  return {
    aqi,
    aqiLabel,
    temperature,
    tempAnomaly,
    humidity,
    rainfall,
    ndvi,
    ndviDensity,
    deforestation,
    climateRisk,
    riskFactor,
    feelsLike,
    rainProbability,
    pressure,
    windSpeed,
    windDirection,
    windDirDegrees,
    uvIndex,
    visibility,
    cloudCoverage,
    sunrise,
    sunset,
    moonPhase,
    elevation,
  };
}

export function generatePredictions(lat: number, lng: number, temp: number): ClimatePrediction {
  const seed = getSeededRandom(lat, lng);
  const tomorrowTemp = Math.round((temp + (seed * 3 - 1.5)) * 10) / 10;
  const next3DaysTemp = Math.round((temp + (seed * 4 - 2)) * 10) / 10;
  const nextWeekTemp = Math.round((temp + (seed * 6 - 3)) * 10) / 10;

  const conditions = ["Sunny", "Partly Cloudy", "Overcast", "Showers", "Severe Heat", "High Winds"];
  const condIdx = Math.floor(seed * conditions.length);

  return {
    tomorrow: { temp: tomorrowTemp, condition: conditions[condIdx], icon: "CloudSun", confidence: Math.floor(85 + seed * 12) },
    next3Days: { temp: next3DaysTemp, condition: conditions[(condIdx + 1) % conditions.length], icon: "Cloud", confidence: Math.floor(75 + seed * 15) },
    nextWeek: { temp: nextWeekTemp, condition: conditions[(condIdx + 2) % conditions.length], icon: "CloudRain", confidence: Math.floor(60 + seed * 20) },
  };
}

export function generateDisasters(lat: number, lng: number, climateRisk: number): DisasterAlert[] {
  const seed = getSeededRandom(lat, lng);
  const disasters: DisasterAlert[] = [];

  if (climateRisk > 40) {
    const dSeed = getSeededRandom(lat + 12, lng - 8);
    const distance = Math.floor(dSeed * 250 + 15);
    
    if (climateRisk > 70 && dSeed > 0.5) {
      disasters.push({
        id: `alert_wildfire_${Math.round(lat)}_${Math.round(lng)}`,
        type: "Wildfire",
        name: "Wildfire Alert",
        severity: "Extreme",
        distance,
        coordinates: [lat + (dSeed * 0.3 - 0.15), lng + (dSeed * 0.3 - 0.15)],
        description: "Fast-spreading fire detected in trees and dry vegetation.",
        badge: "FIRE DANGER ALERT"
      });
    } else if (climateRisk > 60 && dSeed > 0.2) {
      disasters.push({
        id: `alert_flood_${Math.round(lat)}_${Math.round(lng)}`,
        type: "Flood",
        name: "Flash Flood Warning",
        severity: "Severe",
        distance,
        coordinates: [lat + (dSeed * 0.2 - 0.1), lng + (dSeed * 0.2 - 0.1)],
        description: "High water flow causing heavy local flooding.",
        badge: "FLOOD ALERT"
      });
    }

    if (dSeed < 0.35) {
      disasters.push({
        id: `alert_heatwave_${Math.round(lat)}_${Math.round(lng)}`,
        type: "Heatwave",
        name: "Extreme Heat Warning",
        severity: "Extreme",
        distance: Math.floor(distance * 1.4),
        coordinates: [lat + 0.08, lng - 0.08],
        description: "High temperatures staying over the area for a long time.",
        badge: "HEAT ALERT"
      });
    }

    if (Math.abs(lat) < 25 && dSeed > 0.6) {
      disasters.push({
        id: `alert_cyclone_${Math.round(lat)}_${Math.round(lng)}`,
        type: "Cyclone",
        name: "Storm Warning",
        severity: "Severe",
        distance: Math.floor(distance * 0.9),
        coordinates: [lat - 0.15, lng + 0.15],
        description: "Strong winds and heavy storm clouds in the area.",
        badge: "STORM ALERT"
      });
    }
  }

  // Ensure there's always at least one local dynamic alerts context
  if (disasters.length === 0) {
    disasters.push({
      id: `alert_earthquake_${Math.round(lat)}_${Math.round(lng)}`,
      type: "Earthquake",
      name: "Earthquake Tremor",
      severity: "Moderate",
      distance: Math.floor(seed * 350 + 40),
      coordinates: [lat + 0.3, lng - 0.3],
      description: "Small ground movement recorded nearby.",
      badge: "EARTHQUAKE ALERT"
    });
  }

  return disasters;
}

// Generate fully-loaded location record
export function generateClimateReportForCoordinate(lat: number, lng: number, name?: string): LocationReport {
  const seed = getSeededRandom(lat, lng);
  const finalName = name || `Location Area [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
  const finalRegion = `Zone Area-${Math.floor(seed * 999)}`;
  const finalCountry = lat > 0 ? "Northern Area" : "Southern Area";

  // Build baseline telemetry using filled variables
  const telemetry = fillMissingTelemetry(lat, lng, {});
  const id = `coordinate_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;

  // Generate historical timeline
  const historical: { [year: number]: Partial<ClimateTelemetry> } = {};
  for (let year = 2018; year <= 2026; year++) {
    const yearDiff = year - 2026;
    // Apply decadal warming trend and climate change variables
    const baseTemp = telemetry.temperature + (yearDiff * 0.18) + (getSeededRandom(lat + year, lng) * 0.5 - 0.25);
    const baseHum = Math.min(98, Math.max(5, telemetry.humidity - (yearDiff * 0.6)));
    const baseRain = Math.max(0, telemetry.rainfall + (yearDiff * 15));
    const baseAqi = Math.max(5, Math.floor(telemetry.aqi + (yearDiff * 3.5)));
    const baseRisk = Math.min(100, Math.max(0, Math.floor(telemetry.climateRisk + (yearDiff * 2))));

    historical[year] = fillMissingTelemetry(lat, lng, {
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.floor(baseHum),
      rainfall: Math.floor(baseRain),
      aqi: baseAqi,
      climateRisk: baseRisk,
    });
  }

  const predictions = generatePredictions(lat, lng, telemetry.temperature);
  const disasters = generateDisasters(lat, lng, telemetry.climateRisk);

  return {
    id,
    name: finalName,
    region: finalRegion,
    country: finalCountry,
    lat,
    lng,
    telemetry,
    historical,
    predictions,
    disasters
  };
}

// Predefined Sentinel Stations with fully populated telemetries using our generator
export const sentinelLocations: LocationReport[] = [
  {
    id: "amazon",
    name: "Amazon Rainforest Basin",
    region: "Amazonas State",
    country: "Brazil",
    lat: -3.4653,
    lng: -62.2159,
    telemetry: fillMissingTelemetry(-3.4653, -62.2159, {
      temperature: 27.8,
      humidity: 88,
      rainfall: 2850,
      ndvi: 0.88,
      deforestation: "Active Clearing Detected",
      climateRisk: 74,
      riskFactor: "Biodiversity Loss",
      aqi: 38
    }),
    historical: {},
    predictions: generatePredictions(-3.4653, -62.2159, 27.8),
    disasters: generateDisasters(-3.4653, -62.2159, 74)
  },
  {
    id: "sahara",
    name: "Sahara Desert Edge",
    region: "Tahoua",
    country: "Niger",
    lat: 16.2762,
    lng: 5.4851,
    telemetry: fillMissingTelemetry(16.2762, 5.4851, {
      temperature: 42.1,
      humidity: 14,
      rainfall: 120,
      ndvi: 0.08,
      deforestation: "Stable",
      climateRisk: 86,
      riskFactor: "Desertification",
      aqi: 142
    }),
    historical: {},
    predictions: generatePredictions(16.2762, 5.4851, 42.1),
    disasters: generateDisasters(16.2762, 5.4851, 86)
  },
  {
    id: "greenland",
    name: "Jacobshavn Glacier Core",
    region: "Avannaata",
    country: "Greenland",
    lat: 69.1764,
    lng: -49.8304,
    telemetry: fillMissingTelemetry(69.1764, -49.8304, {
      temperature: -1.2,
      humidity: 78,
      rainfall: 320,
      ndvi: 0.02,
      deforestation: "Stable",
      climateRisk: 92,
      riskFactor: "Coastal Inundation",
      aqi: 12
    }),
    historical: {},
    predictions: generatePredictions(69.1764, -49.8304, -1.2),
    disasters: generateDisasters(69.1764, -49.8304, 92)
  },
  {
    id: "sydney",
    name: "Blue Mountains Ecoregion",
    region: "New South Wales",
    country: "Australia",
    lat: -33.7181,
    lng: 150.3108,
    telemetry: fillMissingTelemetry(-33.7181, 150.3108, {
      temperature: 22.4,
      humidity: 58,
      rainfall: 960,
      ndvi: 0.65,
      deforestation: "Low Activity",
      climateRisk: 68,
      riskFactor: "Wildfire Susceptibility",
      aqi: 45
    }),
    historical: {},
    predictions: generatePredictions(-33.7181, 150.3108, 22.4),
    disasters: generateDisasters(-33.7181, 150.3108, 68)
  },
  {
    id: "mumbai",
    name: "Dharavi-Coastal Zone",
    region: "Maharashtra",
    country: "India",
    lat: 19.0330,
    lng: 72.8541,
    telemetry: fillMissingTelemetry(19.0330, 72.8541, {
      temperature: 31.5,
      humidity: 82,
      rainfall: 2200,
      ndvi: 0.22,
      deforestation: "Stable",
      climateRisk: 81,
      riskFactor: "Extreme Precipitation Risk",
      aqi: 184
    }),
    historical: {},
    predictions: generatePredictions(19.0330, 72.8541, 31.5),
    disasters: generateDisasters(19.0330, 72.8541, 81)
  }
];

// Hydrate historical values for sentinel stations on load
sentinelLocations.forEach((loc) => {
  const baseReport = generateClimateReportForCoordinate(loc.lat, loc.lng, loc.name);
  loc.historical = baseReport.historical;
});
