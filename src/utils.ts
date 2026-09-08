// Climatology Utility helpers for recommendations, scores and resources
export interface EnvironmentalHealthResult {
  score: number;
  color: "green" | "yellow" | "orange" | "red";
  label: string;
  explanation: string;
}

export function calculateEnvironmentalHealthScore(telemetry: any): EnvironmentalHealthResult {
  if (!telemetry) {
    return {
      score: 100,
      color: "green",
      label: "Excellent",
      explanation: "Standard environmental metrics indicate pristine, optimal conditions."
    };
  }

  const aqi = telemetry.aqi ?? 50;
  const temp = telemetry.temperature ?? 22;
  const rainfall = telemetry.rainfall ?? 1000;
  const humidity = telemetry.humidity ?? 50;
  const wind = telemetry.windSpeed ?? 10;
  const ndvi = telemetry.ndvi ?? 0.5;
  const risk = telemetry.climateRisk ?? 20;

  // 1. AQI Penalty: 0-50 is perfect (0 penalty), >50 scales up to 30 penalty
  const aqiPenalty = Math.min(30, Math.max(0, (aqi - 50) * 0.12));

  // 2. Temperature Penalty: 16-26°C is comfortable, extremes deduct up to 15
  let tempPenalty = 0;
  if (temp > 28) {
    tempPenalty = Math.min(15, (temp - 28) * 1.5);
  } else if (temp < 12) {
    tempPenalty = Math.min(15, (12 - temp) * 1.5);
  }

  // 3. Rainfall Penalty: extremely dry or high water deposition, max 15
  let rainPenalty = 0;
  if (rainfall > 2000) {
    rainPenalty = Math.min(15, (rainfall - 2000) * 0.01);
  } else if (rainfall < 400) {
    rainPenalty = Math.min(15, (400 - rainfall) * 0.03);
  }

  // 4. Humidity Penalty: too dry (<30) or too humid (>80), max 10
  let humidityPenalty = 0;
  if (humidity > 75) {
    humidityPenalty = Math.min(10, (humidity - 75) * 0.3);
  } else if (humidity < 35) {
    humidityPenalty = Math.min(10, (35 - humidity) * 0.3);
  }

  // 5. Wind Speed Penalty: strong winds >20 kph, max 10
  const windPenalty = wind > 20 ? Math.min(10, (wind - 20) * 0.4) : 0;

  // 6. Hazard/Risk Index Penalty (Flood/Wildfire, etc.): max 15
  const riskPenalty = Math.min(15, risk * 0.15);

  // 7. Vegetation NDVI Bonus/Penalty: >0.5 is premium, <0.3 is poor
  const ndviFactor = (ndvi - 0.5) * 15; // adds up to +7.5 or subtracts up to -7.5

  let score = Math.round(95 - aqiPenalty - tempPenalty - rainPenalty - humidityPenalty - windPenalty - riskPenalty + ndviFactor);
  score = Math.max(0, Math.min(100, score));

  let label = "Excellent";
  let color: "green" | "yellow" | "orange" | "red" = "green";
  let explanation = "Optimal atmosphere, rich canopy vegetative index, and minimal hazard risks.";

  if (score >= 85) {
    label = "Excellent";
    color = "green";
    explanation = "Pristine ambient conditions with supreme air cleanliness and ideal temperatures.";
  } else if (score >= 70) {
    label = "Good";
    color = "green";
    explanation = "Comfortable climate profiles with very low atmospheric particulates or risk.";
  } else if (score >= 50) {
    label = "Moderate";
    color = "yellow";
    explanation = `Acceptable conditions. Minor stresses like ${
      aqi > 80 ? "air particulates" : tempPenalty > 4 ? "non-optimal heat" : "slight hazard risk"
    } require attention.`;
  } else if (score >= 30) {
    label = "Poor";
    color = "orange";
    explanation = `Unfavorable conditions. Action required due to ${
      aqi > 120 ? "atmospheric particles" : risk > 40 ? "heightened risk profiles" : "restricted green cover"
    }.`;
  } else {
    label = "Critical";
    color = "red";
    explanation = `Critical environmental threshold. Extreme warning for ${telemetry.riskFactor || "elevated risk"} indices.`;
  }

  return { score, color, label, explanation };
}

export function getActionableRecommendations(telemetry: any): string[] {
  if (!telemetry) return ["Optimal conditions. Safe for outdoor activities."];
  const recs: string[] = [];

  const aqi = telemetry.aqi ?? 50;
  const temp = telemetry.temperature ?? 22;
  const rainProb = telemetry.rainProbability ?? 10;
  const wind = telemetry.windSpeed ?? 10;
  const uv = telemetry.uvIndex ?? 3;
  const risk = telemetry.climateRisk ?? 20;
  const riskFactor = (telemetry.riskFactor || "").toLowerCase();

  // 1. Extreme Hazard Alert
  if (risk > 60) {
    if (riskFactor.includes("wildfire") || riskFactor.includes("fire")) {
      recs.push("Extreme wildfire risk. Avoid forests and wear masks.");
    } else if (riskFactor.includes("flood") || rainProb > 70) {
      recs.push("High flood risk. Avoid low-lying areas.");
    } else if (riskFactor.includes("drought") || temp > 35) {
      recs.push("Severe drought. Stay in shade and conserve water.");
    } else {
      recs.push("High threat level. Exercise extreme caution.");
    }
  }

  // 2. Air Quality
  if (aqi > 150) {
    recs.push("Poor air quality. Wear a mask and filter indoor air.");
  } else if (aqi > 100) {
    recs.push("Moderate air quality. Limit intense outdoor exercise.");
  } else if (aqi <= 50 && rainProb < 30 && temp >= 15 && temp <= 30 && risk < 40) {
    recs.push("Optimal air quality. Perfect for outdoor activities.");
  }

  // 3. Precipitation / Umbrella
  if (rainProb > 65) {
    recs.push("Heavy rain expected. Carry an umbrella.");
  } else if (rainProb > 35) {
    recs.push("Light showers possible. Keep an umbrella nearby.");
  }

  // 4. UV / Heat
  if (uv >= 6 || temp > 32) {
    recs.push("High UV Index. Use sunscreen and wear a hat.");
  } else if (temp < 10) {
    recs.push("Cool conditions. Wear warm clothing.");
  }

  // 5. Strong Winds
  if (wind > 24) {
    recs.push("Strong winds. Secure loose outdoor items.");
  }

  // 6. Farming indicator
  if (temp >= 15 && temp <= 32 && rainProb < 55 && aqi <= 120 && (telemetry.ndvi ?? 0.5) > 0.4) {
    recs.push("Good conditions for planting and gardening.");
  }

  // Fallback in case list is short
  if (recs.length === 0) {
    recs.push("Stable conditions. No special precautions needed.");
    recs.push("Stay hydrated and wear sunscreen.");
  }

  return recs.slice(0, 5);
}

export function getEmergencyResources(locationName: string) {
  const baseName = locationName || "Regional";
  return {
    hospitals: [
      { name: `${baseName} Emergency Hospital`, distance: "1.4 km", phone: "+1 (555) 309-1122" },
      { name: "Metro Medical Center", distance: "3.9 km", phone: "+1 (555) 309-5431" }
    ],
    policeStations: [
      { name: `${baseName} Police Precinct`, distance: "0.8 km", phone: "+1 (555) 309-2000" },
      { name: "Civil Defense Station", distance: "2.7 km", phone: "+1 (555) 309-8800" }
    ],
    fireStations: [
      { name: `${baseName} Fire & Rescue`, distance: "1.1 km", phone: "+1 (555) 309-9111" }
    ],
    shelters: [
      { name: "Community Safe Shelter", distance: "1.7 km", capacity: "400 spots" },
      { name: "High-Ground Safety Shelter", distance: "3.2 km", capacity: "250 spots" }
    ],
    reliefCenters: [
      { name: "Regional Relief Hub", distance: "2.3 km", status: "Active" }
    ],
    contacts: [
      { label: "Emergency Hotline", number: "911 / 112" },
      { label: "Wildfire Command", number: "+1 (555) 309-FIRE" },
      { label: "Flood Advisory Dispatch", number: "+1 (555) 309-FLOOD" },
      { label: "Hazmat Emergency Team", number: "+1 (555) 309-TOXIC" }
    ]
  };
}
