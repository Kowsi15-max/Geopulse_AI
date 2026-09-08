export interface ClimateTelemetry {
  aqi: number;
  aqiLabel: string;
  temperature: number;
  tempAnomaly: number;
  humidity: number;
  rainfall: number;
  ndvi: number;
  ndviDensity: string;
  deforestation: "Stable" | "Low Activity" | "Tree Clearing Alert" | "High Tree Loss Alert" | "Active Clearing Detected" | "High Deforestation Alert";
  climateRisk: number; // 0-100
  riskFactor: "Wildfire Risk" | "Wildfire Susceptibility" | "Severe Drought" | "Coastal Inundation" | "Biodiversity Loss" | "Dry Land Expansion" | "Desertification" | "Heavy Rainfall Risk" | "Extreme Precipitation Risk" | "None";
  
  // NEW PREMIUM FIELDS
  feelsLike: number;
  rainProbability: number; // %
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: string; // e.g., "NNE"
  windDirDegrees: number; // 0-360
  uvIndex: number; // 0-11+
  visibility: number; // km
  cloudCoverage: number; // %
  sunrise: string;
  sunset: string;
  moonPhase: string;
  elevation: number; // meters
}

export interface ClimatePrediction {
  tomorrow: { temp: number; icon: string; condition: string; confidence: number };
  next3Days: { temp: number; icon: string; condition: string; confidence: number };
  nextWeek: { temp: number; icon: string; condition: string; confidence: number };
}

export interface DisasterAlert {
  id: string;
  type: "Cyclone" | "Flood" | "Wildfire" | "Earthquake" | "Heatwave";
  name: string;
  severity: "Moderate" | "Severe" | "Extreme";
  distance: number; // km from selected location
  coordinates: [number, number];
  description: string;
  badge: string;
}

export interface LocationReport {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  telemetry: ClimateTelemetry;
  historical: {
    [year: number]: Partial<ClimateTelemetry>;
  };
  predictions?: ClimatePrediction;
  disasters?: DisasterAlert[];
  isFavorite?: boolean;
  isPinned?: boolean;
  customName?: string;
  savedAt?: string;
}

export type ClimateLayer =
  | "temperature"
  | "rainfall"
  | "clouds"
  | "wind"
  | "humidity"
  | "aqi"
  | "pressure"
  | "wildfire"
  | "cyclone"
  | "lightning"
  | "flood"
  | "ndvi"
  | "population";

export interface LayerConfig {
  id: ClimateLayer;
  name: string;
  color: string;
  icon: string;
  unit: string;
  min: number;
  max: number;
}
