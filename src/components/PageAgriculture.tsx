import React, { useState } from "react";
import {
  Sprout,
  Droplets,
  Thermometer,
  Clock,
  Sparkles,
  Brain,
  CloudRain,
  Sun,
  Calendar,
  AlertCircle,
  Loader2,
  TrendingUp,
  Check,
  Scale,
  Gauge,
  HelpCircle,
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Coins,
  Send,
  Zap,
  Layers,
  Activity,
  Heart
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { LocationReport } from "../types";
import { apiFetch } from "../utils/api";

interface PageAgricultureProps {
  selectedLocation: LocationReport | null;
  isDarkMode: boolean;
}

// Core Crop Specifications Structure
interface CropSpecs {
  name: string;
  idealTempMin: number;
  idealTempMax: number;
  idealRainfallMin: number; // mm / season
  idealRainfallMax: number;
  soilMoistureMin: number; // %
  soilMoistureMax: number; // %
  soilMoisturePreference: string;
  soilTypeSuitability: string[];
  fertilizerNeeds: string;
  irrigationRequirement: string;
  diseaseRisks: string[];
  harvestPeriod: string;
  plantingWindow: string;
  description: string;
  expectedYieldBase: number; // tons/hectare
  waterIntensity: "High" | "Medium" | "Low";
  growthCycleDays: number;
  basePrice: number; // USD per ton
}

// Crop Database
const CROPS_DATABASE: CropSpecs[] = [
  {
    name: "Rice",
    idealTempMin: 22,
    idealTempMax: 35,
    idealRainfallMin: 800,
    idealRainfallMax: 1500,
    soilMoistureMin: 60,
    soilMoistureMax: 85,
    soilMoisturePreference: "60% - 85% (Wetland saturation)",
    soilTypeSuitability: ["Clayey", "Clay-Loam", "Alluvial Silts"],
    fertilizerNeeds: "Split Nitrogen (N) application at tillering and panicle stage, plus Potassium top-dressing.",
    irrigationRequirement: "Flood/transplanted system. Maintain water depth of 5-10cm during early vegetative stages.",
    diseaseRisks: ["Rice Blast (Magnaporthe)", "Bacterial Leaf Blight", "Brown Planthopper Infestation"],
    harvestPeriod: "120 - 145 days",
    plantingWindow: "Summer monsoon (Kharif) / Tropical wet cycles",
    description: "Thrives in tropical wetland climates. Highly water-intensive and requires stable thermal baselines.",
    expectedYieldBase: 5.8,
    waterIntensity: "High",
    growthCycleDays: 135,
    basePrice: 420
  },
  {
    name: "Wheat",
    idealTempMin: 10,
    idealTempMax: 24,
    idealRainfallMin: 350,
    idealRainfallMax: 750,
    soilMoistureMin: 35,
    soilMoistureMax: 55,
    soilMoisturePreference: "35% - 55% (Damp well-drained loam)",
    soilTypeSuitability: ["Silty-Clay Loam", "Sandy-Loam", "Mollisols"],
    fertilizerNeeds: "Balanced N-P-K at sowing. Nitrogen top-dressing strictly synchronized with crown root initiation.",
    irrigationRequirement: "Moderate micro-irrigation at Crown Root Initiation (CRI) and flowering to maximize grain weight.",
    diseaseRisks: ["Yellow Stripe Rust", "Fusarium Head Blight", "Powdery Mildew"],
    harvestPeriod: "110 - 135 days",
    plantingWindow: "Late Autumn sowing / Cool season Rabi cycles",
    description: "Cool-season cereal. Sensitive to extreme heat and high-humidity fungal infestations during heading.",
    expectedYieldBase: 4.1,
    waterIntensity: "Medium",
    growthCycleDays: 125,
    basePrice: 380
  },
  {
    name: "Maize",
    idealTempMin: 18,
    idealTempMax: 32,
    idealRainfallMin: 500,
    idealRainfallMax: 900,
    soilMoistureMin: 40,
    soilMoistureMax: 65,
    soilMoisturePreference: "40% - 65% (High aeration moisture)",
    soilTypeSuitability: ["Deep Loamy", "Alluvial Soil", "Silt-Loam"],
    fertilizerNeeds: "Heavy feeder. High early-stage Phosphorus, heavy Nitrogen sidedress, and micronutrients (Zinc/Boron).",
    irrigationRequirement: "Critical sprinkler / center-pivot irrigation required at silking and tasseling periods.",
    diseaseRisks: ["Grey Leaf Spot", "Fall Armyworm (Pest)", "Common Smut (Ustilago)"],
    harvestPeriod: "95 - 120 days",
    plantingWindow: "Spring sowing / Early summer warmth",
    description: "Fast-growing high-yield C4 grain crop. Requires excellent soil drainage and deep root aeration.",
    expectedYieldBase: 8.6,
    waterIntensity: "Medium",
    growthCycleDays: 110,
    basePrice: 290
  },
  {
    name: "Soybean",
    idealTempMin: 20,
    idealTempMax: 31,
    idealRainfallMin: 600,
    idealRainfallMax: 1000,
    soilMoistureMin: 45,
    soilMoistureMax: 60,
    soilMoisturePreference: "45% - 60% (Moderate moist soil)",
    soilTypeSuitability: ["Humus Loam", "Clay-Loam", "Arable Silt"],
    fertilizerNeeds: "Low nitrogen requirement (fixing nitrogen via rhizobium nodules). Requires soluble Phosphate & Potash.",
    irrigationRequirement: "Drip or furrow irrigation suggested during pod development and seed filling stages.",
    diseaseRisks: ["Asian Soybean Rust", "Aphid Outbreaks", "Sudden Death Syndrome (SDS)"],
    harvestPeriod: "100 - 125 days",
    plantingWindow: "Late spring / Early monsoon pre-humid period",
    description: "Nitrogen-fixing legume. Vital rotation crop enhancing biological soil carbon values.",
    expectedYieldBase: 3.4,
    waterIntensity: "Medium",
    growthCycleDays: 115,
    basePrice: 510
  },
  {
    name: "Sorghum",
    idealTempMin: 24,
    idealTempMax: 38,
    idealRainfallMin: 250,
    idealRainfallMax: 600,
    soilMoistureMin: 25,
    soilMoistureMax: 45,
    soilMoisturePreference: "25% - 45% (Dryland moisture range)",
    soilTypeSuitability: ["Sandy-Loam", "Clayey vertisols", "Alkaline Arid Soils"],
    fertilizerNeeds: "Slight Nitrogen topdressing, moderate Phosphorus at seed drills.",
    irrigationRequirement: "Minimal. Highly drought-resilient. Requires watering only during grain-fill extreme dry spell.",
    diseaseRisks: ["Anthracnose Fungus", "Sorghum Midge pest", "Ergot Disease"],
    harvestPeriod: "90 - 110 days",
    plantingWindow: "Dryland cycles / Arid-monsoon transition",
    description: "C4 dryland grass with superior structural waxy leaves. Perfect for climate-stressed environments.",
    expectedYieldBase: 4.9,
    waterIntensity: "Low",
    growthCycleDays: 100,
    basePrice: 240
  },
  {
    name: "Cotton",
    idealTempMin: 22,
    idealTempMax: 37,
    idealRainfallMin: 500,
    idealRainfallMax: 1100,
    soilMoistureMin: 35,
    soilMoistureMax: 60,
    soilMoisturePreference: "35% - 60% (Alternating moist/dry)",
    soilTypeSuitability: ["Deep Black Vertisols", "Loamy-Alluvium", "Sandy-Clay"],
    fertilizerNeeds: "Moderate Nitrogen during vegetative growth, heavy Potassium and Boron during boll development.",
    irrigationRequirement: "Precise drip irrigation. Water inputs must be suspended prior to boll opening to secure fiber quality.",
    diseaseRisks: ["Bollworm Infestations", "Verticillium Wilt", "Root Rot / Damping Off"],
    harvestPeriod: "150 - 180 days",
    plantingWindow: "Warm spring planting / Long heat duration season",
    description: "Subtropical cash crop requiring extensive solar radiation and dry atmosphere for harvest clearance.",
    expectedYieldBase: 2.4,
    waterIntensity: "High",
    growthCycleDays: 165,
    basePrice: 1150
  }
];

// Helper to determine simulated climate zones based on latitude
function getClimateZone(lat: number): string {
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return "Tropical Zone";
  if (absLat < 35) return "Subtropical Zone";
  if (absLat < 50) return "Temperate Zone";
  return "Boreal Agricultural Frontier";
}

// Crop Emoji Mapping
function getCropEmoji(name: string): string {
  if (name === "Rice") return "🍚";
  if (name === "Wheat") return "🌾";
  if (name === "Maize") return "🌽";
  if (name === "Soybean") return "🌱";
  if (name === "Sorghum") return "🌾";
  if (name === "Cotton") return "☁️";
  return "🌱";
}

// Dynamic short reasoning generator for crop suitability
function getShortReason(cropName: string, suitability: number): string {
  if (suitability >= 80) {
    if (cropName === "Rice") return "Excellent humidity & tropical wet conditions.";
    if (cropName === "Wheat") return "Good temperature compatibility.";
    if (cropName === "Maize") return "Excellent solar radiation window.";
    if (cropName === "Soybean") return "Favorable humidity and soil thermal cycle.";
    if (cropName === "Sorghum") return "Exceptional drought-resistance profile.";
    if (cropName === "Cotton") return "Ideal heat accumulation threshold.";
    return "Optimized climate and soil moisture match.";
  } else if (suitability >= 55) {
    if (cropName === "Rice") return "Requires supplement irrigation.";
    if (cropName === "Wheat") return "Moderate thermal baseline limits.";
    if (cropName === "Maize") return "Marginal precipitation level.";
    if (cropName === "Soybean") return "Sub-optimal humidity duration.";
    if (cropName === "Sorghum") return "Tolerable climate margins.";
    if (cropName === "Cotton") return "Thermal limit slightly restricted.";
    return "Acceptable crop match with minor stress.";
  } else {
    return "High risk of seasonal environmental stress.";
  }
}

// Helper for dynamic soil moisture alerts in bullet/card format
function getSoilMoistureStatus(moisture: number, min: number, max: number) {
  if (moisture < min) {
    return {
      severity: "low",
      emoji: "⚠️",
      label: `⚠️ Moisture too low (${moisture}%)`,
      recommendation: `Recommended: Apply ${Math.round((min - moisture) * 0.5)} mm of targeted irrigation.`
    };
  } else if (moisture > max) {
    return {
      severity: "high",
      emoji: "⚠️",
      label: `⚠️ Moisture too high (${moisture}%)`,
      recommendation: "Recommended: Reduce irrigation and check drainage."
    };
  } else {
    return {
      severity: "optimal",
      emoji: "✅",
      label: `✅ Moisture is optimal (${moisture}%)`,
      recommendation: "Recommended: Maintain current watering schedule."
    };
  }
}

// Helper for short irrigation bulletins
function getIrrigationAdvice(cropName: string) {
  let actionText = "Maintain standard damp crop bed.";
  if (cropName === "Rice") {
    actionText = "Maintain 5-10 cm water level.";
  } else if (cropName === "Wheat") {
    actionText = "Provide light overhead sprinkling (1-2 cm).";
  } else if (cropName === "Maize") {
    actionText = "Apply moderate sprinkler irrigation at silking.";
  } else if (cropName === "Soybean") {
    actionText = "Use targeted soil drip watering during fill.";
  } else if (cropName === "Sorghum") {
    actionText = "Dryland profile: minimal to no irrigation.";
  } else if (cropName === "Cotton") {
    actionText = "Limit watering prior to boll opening.";
  }

  return {
    bullet1: actionText,
    bullet2: "Suitable for current growth stage."
  };
}

// Helper for short fertilizer advice
function getFertilizerAdvice(cropName: string, growthStage: string) {
  let materials = "Apply NPK fertilizer mix.";
  if (cropName === "Rice") {
    materials = "Apply Nitrogen + Potassium.";
  } else if (cropName === "Wheat") {
    materials = "Apply crown root N-P-K booster.";
  } else if (cropName === "Maize") {
    materials = "Apply early Phosphorus & heavy Nitrogen.";
  } else if (cropName === "Soybean") {
    materials = "Apply Phosphate + Potash (no heavy N).";
  } else if (cropName === "Sorghum") {
    materials = "Apply light Nitrogen and Zinc trace.";
  } else if (cropName === "Cotton") {
    materials = "Apply Potassium and Boron nutrients.";
  }

  let timing = "Vegetative development stage.";
  if (growthStage.toLowerCase().includes("grain-filling") || growthStage.toLowerCase().includes("r3")) {
    timing = "Grain filling stage.";
  } else if (growthStage.toLowerCase().includes("sowing") || growthStage.toLowerCase().includes("emergence")) {
    timing = "Early emergence stage.";
  } else if (growthStage.toLowerCase().includes("tillering") || growthStage.toLowerCase().includes("growth") || growthStage.toLowerCase().includes("v5")) {
    timing = "Active growth stage.";
  } else if (growthStage.toLowerCase().includes("inflorescence") || growthStage.toLowerCase().includes("booting")) {
    timing = "Flowering stage.";
  } else if (growthStage.toLowerCase().includes("maturity") || growthStage.toLowerCase().includes("drydown")) {
    timing = "Pre-harvest drydown stage.";
  }

  return {
    bullet1: materials,
    bullet2: `Best timing: ${timing}`
  };
}

// Helper for short pathogen advice
function getBiosecurityAdvice(diseaseLevel: string, activeDisease: string) {
  if (diseaseLevel === "High") {
    return {
      severity: "high",
      bullet1: `⚠️ High pathogen pressure: ${activeDisease}.`,
      bullet2: "Action: Apply protective bio-fungicide treatment."
    };
  } else if (diseaseLevel === "Moderate") {
    return {
      severity: "moderate",
      bullet1: `⚠️ Low stress from opportunistic pathogens.`,
      bullet2: "Recommended: Schedule weekly field scouting."
    };
  } else {
    return {
      severity: "low",
      bullet1: "✅ No major pathogens detected.",
      bullet2: "Recommended: Maintain organic barrier guidelines."
    };
  }
}

// Helper to evaluate agronomy metrics dynamically
function calculateAgronomyMetrics(location: LocationReport, crop: CropSpecs) {
  const temp = location.telemetry.temperature;
  const humidity = location.telemetry.humidity;
  const rainProb = location.telemetry.rainProbability ?? 20;
  const rainfall = location.telemetry.rainfall ?? 0;
  const ndvi = location.telemetry.ndvi ?? 0.55;

  // 1. Calculate temperature suitability score
  let tempSuitability = 100;
  if (temp < crop.idealTempMin) {
    const diff = crop.idealTempMin - temp;
    tempSuitability = Math.max(10, 100 - diff * 12);
  } else if (temp > crop.idealTempMax) {
    const diff = temp - crop.idealTempMax;
    tempSuitability = Math.max(10, 100 - diff * 8);
  }

  // 2. Calculate water availability
  let waterSuitability = 100;
  const moistureAvailability = (humidity * 0.45) + (rainProb * 0.35) + (Math.min(50, rainfall * 2) * 0.2);

  if (crop.waterIntensity === "High") {
    if (moistureAvailability < 55) {
      waterSuitability = Math.max(10, 100 - (55 - moistureAvailability) * 2.2);
    }
  } else if (crop.waterIntensity === "Low") {
    if (moistureAvailability > 45) {
      waterSuitability = Math.max(15, 100 - (moistureAvailability - 45) * 1.8);
    }
  } else {
    const diff = Math.abs(50 - moistureAvailability);
    waterSuitability = Math.max(25, 100 - diff * 1.5);
  }

  // 3. Combined Suitability index
  const suitabilityIndex = Math.round((tempSuitability * 0.55) + (waterSuitability * 0.45));

  // 4. Dynamic Crop Health Score
  const cropHealthScore = Math.round(Math.min(100, Math.max(12, (ndvi * 50) + (suitabilityIndex * 0.5))));

  // 5. Soil Temperature: Thermal lag
  const estimatedSoilTemp = Math.round(temp > 25 ? temp - 2.8 : temp < 15 ? temp + 1.2 : temp - 0.4);

  // 6. Dynamic Soil Moisture Index
  let soilMoisture = Math.round(Math.min(95, Math.max(12, (humidity * 0.5) + (rainProb * 0.35) + (rainfall * 1.8))));
  if (crop.waterIntensity === "High" && soilMoisture < 75 && rainProb < 25) {
    soilMoisture = Math.max(15, soilMoisture - 12);
  } else if (crop.waterIntensity === "Low") {
    soilMoisture = Math.min(90, soilMoisture + 4);
  }

  // 7. Expected Yield
  const predictedYield = Number(
    (crop.expectedYieldBase * (suitabilityIndex / 100) * (0.75 + (cropHealthScore / 400))).toFixed(2)
  );

  // 8. Expected Revenue
  const estimatedRevenue = Math.round(predictedYield * crop.basePrice);

  // 9. Pest and Disease Hazard modeling
  let diseaseLevel: "Low" | "Moderate" | "High" = "Low";
  let activeDisease = "Healthy canopy profile";
  if (humidity > 75 && temp > 24) {
    diseaseLevel = "High";
    activeDisease = crop.diseaseRisks[0] || "Fungal Blast Spike";
  } else if (humidity < 35 && temp > 30) {
    diseaseLevel = "High";
    activeDisease = crop.diseaseRisks[1] || "Insect infestation surge";
  } else if (suitabilityIndex < 48) {
    diseaseLevel = "Moderate";
    activeDisease = crop.diseaseRisks[2] || "Root rot stress";
  }

  // 10. Growth Stage Modeling
  const cycleSeed = Math.floor((Math.abs(location.lat) + Math.abs(location.lng)) % 5);
  const stages = [
    "Sowing & Emergence (Stage V1)",
    "Active Tillering (Stage V5)",
    "Inflorescence (Stage R1)",
    "Milky Grain-Filling (Stage R3)",
    "Physiological Maturity (Stage R6)"
  ];
  const growthStage = stages[cycleSeed];

  // 11. Harvest Probability
  let harvestProbability = 5;
  if (growthStage.includes("Maturity")) {
    harvestProbability = rainProb > 65 ? 90 : 98;
  } else if (growthStage.includes("Grain-Filling")) {
    harvestProbability = 30;
  }

  // 12. Extreme Weather Warnings
  let weatherWarning = "None";
  if (location.telemetry.windSpeed > 45) {
    weatherWarning = "Lodging Warning: Severe wind speeds risk flattening stalks.";
  } else if (temp > 38) {
    weatherWarning = "Thermal Heat Shock: Crop cellular transpiration is restricted.";
  } else if (temp < 4) {
    weatherWarning = "Frost Alert: Frozen dew threat to leaf tissues.";
  } else if (rainProb > 80 && rainfall > 25) {
    weatherWarning = "Flooding Warning: Waterlogging risks root stress.";
  }

  return {
    suitabilityIndex,
    cropHealthScore,
    estimatedSoilTemp,
    soilMoisture,
    predictedYield,
    estimatedRevenue,
    diseaseLevel,
    activeDisease,
    growthStage,
    harvestProbability,
    weatherWarning,
    tempSuitability,
    waterSuitability
  };
}

export default function PageAgriculture({ selectedLocation, isDarkMode }: PageAgricultureProps) {
  const [questionText, setQuestionText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");
  
  // Interactive Controls
  const [selectedCrop, setSelectedCrop] = useState<string>("Rice");
  const [cropA, setCropA] = useState<string>("Rice");
  const [cropB, setCropB] = useState<string>("Wheat");
  const [timeRange, setTimeRange] = useState<"current" | "forecast">("current");

  // Accordions for Advanced Analytics
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showCropDetails, setShowCropDetails] = useState(false);

  if (!selectedLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center p-6 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] min-h-[450px]">
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
            <Sprout className="w-10 h-10" />
          </div>
          <span className="text-sm font-bold font-mono tracking-wider uppercase text-slate-200 flex items-center gap-2">
            Agronomy Dashboard
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select a location on the home panel or map to retrieve custom agronomic suitability intelligence.
          </p>
        </div>
      </div>
    );
  }

  const { name, region, country, telemetry } = selectedLocation;
  const t = telemetry;
  const climateZone = getClimateZone(selectedLocation.lat);

  // Current selected crop specifications
  const activeCropSpecs = CROPS_DATABASE.find(c => c.name === selectedCrop) || CROPS_DATABASE[0];
  const metrics = calculateAgronomyMetrics(selectedLocation, activeCropSpecs);

  // Recommendations sorted by match percentage
  const recommendationsList = CROPS_DATABASE.map(crop => {
    const calc = calculateAgronomyMetrics(selectedLocation, crop);
    return {
      name: crop.name,
      score: calc.suitabilityIndex,
      yield: calc.predictedYield,
      revenue: calc.estimatedRevenue,
      waterIntensity: crop.waterIntensity,
      growthCycleDays: crop.growthCycleDays,
      metrics: calc,
      specs: crop
    };
  }).sort((a, b) => b.score - a.score);

  // Soil moisture details
  const moistureStatus = getSoilMoistureStatus(
    metrics.soilMoisture,
    activeCropSpecs.soilMoistureMin,
    activeCropSpecs.soilMoistureMax
  );

  // Irrigation details
  const irrigationAdvice = getIrrigationAdvice(selectedCrop);

  // Fertilizer details
  const fertilizerAdvice = getFertilizerAdvice(selectedCrop, metrics.growthStage);

  // Biosecurity details
  const biosecurityAdvice = getBiosecurityAdvice(metrics.diseaseLevel, metrics.activeDisease);

  // AI custom consultant
  const handleDecisionSubmit = async () => {
    if (!questionText.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiResponse("");

    try {
      const prompt = `You are an Agronomy Expert & AI Decision Engine. Analyze the following location and telemetry for agricultural decision making:
Location: ${name}, ${region}, ${country} (${climateZone})
Telemetry: Temp: ${t.temperature}°C, Humidity: ${t.humidity}%, Rain Prob: ${t.rainProbability}%, NDVI: ${t.ndvi}, AQI: ${t.aqi}
Selected Crop Focus: ${selectedCrop}
Current Estimated Soil Moisture: ${metrics.soilMoisture}%
Expected Yield Trend: ${metrics.predictedYield} Tons/Hectare
User Question: ${questionText}

Provide an actionable, ultra-professional response under 100 words. Focus strictly on precise, direct, bulleted farming advice with specific soil-water ratios and exact disease warnings. No introductory filler text.`;

      const res = await apiFetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          locationName: selectedLocation.name,
          mode: "thinking"
        })
      });

      if (!res.ok) throw new Error("Agronomy API query node timed out.");
      const data = await res.json();
      setAiResponse(data.text || "No response received.");
    } catch (err: any) {
      setAiError(err.message || "Agronomy AI consulting failure.");
    } finally {
      setAiLoading(false);
    }
  };

  // Comparer metrics
  const specsA = CROPS_DATABASE.find(c => c.name === cropA) || CROPS_DATABASE[0];
  const specsB = CROPS_DATABASE.find(c => c.name === cropB) || CROPS_DATABASE[1];
  const calcA = calculateAgronomyMetrics(selectedLocation, specsA);
  const calcB = calculateAgronomyMetrics(selectedLocation, specsB);

  // Simulated 6-Month NDVI Chart Data
  const generateChartData = (cropSpecs: CropSpecs) => {
    const cycle = cropSpecs.growthCycleDays;
    const data = [];
    for (let day = 0; day <= cycle; day += Math.round(cycle / 10)) {
      const x = day / cycle;
      const baseNDVI = 0.18 + Math.sin(x * Math.PI) * 0.58;
      const actualNDVI = Math.min(0.95, baseNDVI * (0.8 + (metrics.cropHealthScore / 500)));
      const historicalNDVI = baseNDVI * 0.84;
      const soilMoist = Math.max(20, Math.round(metrics.soilMoisture * (1 - x * 0.35) + Math.cos(x * 10) * 8));

      data.push({
        day: `Day ${day}`,
        "NDVI (Canopy Index)": Number(actualNDVI.toFixed(2)),
        "Historical NDVI": Number(historicalNDVI.toFixed(2)),
        "Soil Moisture (%)": soilMoist
      });
    }
    return data;
  };
  const chartData = generateChartData(activeCropSpecs);

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 55) return "text-yellow-400";
    return "text-rose-400";
  };

  const getWaterIntensityBadge = (lvl: string) => {
    if (lvl === "High") return "bg-sky-500/15 border border-sky-500/30 text-sky-400";
    if (lvl === "Medium") return "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400";
    return "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400";
  };

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto text-left transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      
      {/* 1. COMPACT APP NAVBAR HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border rounded text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              Precision Farming Dashboard
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Active Monitoring</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sprout className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
              Agronomy Intelligence
            </h1>
          </div>
          
          <p className="text-xs mt-1.5 text-slate-500 dark:text-slate-400">
            Real-time agro-meteorology and customized crop indicators for{" "}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold underline decoration-slate-400 decoration-2">{name}, {region}, {country}</span>.
            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              {climateZone}
            </span>
          </p>
        </div>

        {/* CROP MULTI-SELECTOR COMPONENT */}
        <div className="flex flex-col gap-1.5 self-start xl:self-auto min-w-[285px]">
          <span className="text-[10px] font-mono uppercase font-black tracking-wider flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            Current Crop Selection:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 shadow-xs">
            {CROPS_DATABASE.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCrop(c.name)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                  selectedCrop === c.name
                    ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60"
                }`}
              >
                {getCropEmoji(c.name)} {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC REAL-TIME SATELLITE & TELEMETRY INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Growth Climate Index */}
        <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500 dark:text-slate-400">
                Climatic Match Suitability
              </span>
              <span className="text-3xl font-black font-mono block mt-2 text-slate-900 dark:text-white">
                {metrics.suitabilityIndex}%
              </span>
            </div>
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">THERMAL FIT</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {metrics.suitabilityIndex >= 80 ? "Highly Ideal" : metrics.suitabilityIndex >= 50 ? "Moderate" : "Sub-optimal"}
            </span>
          </div>
        </div>

        {/* Soil Moisture */}
        <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500 dark:text-slate-400">
                Soil Moisture Profile
              </span>
              <span className="text-3xl font-black font-mono block mt-2 text-slate-900 dark:text-white">
                {metrics.soilMoisture}%
              </span>
            </div>
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-500">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">HYDROLOGICAL BALANCE</span>
            <span className={`font-bold ${
              metrics.soilMoisture < activeCropSpecs.soilMoistureMin
                ? "text-rose-500"
                : metrics.soilMoisture > activeCropSpecs.soilMoistureMax
                  ? "text-sky-500"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {metrics.soilMoisture < activeCropSpecs.soilMoistureMin
                ? "Low"
                : metrics.soilMoisture > activeCropSpecs.soilMoistureMax
                  ? "Excess"
                  : "Optimal"}
            </span>
          </div>
        </div>

        {/* Predicted Yield & Revenue */}
        <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500 dark:text-slate-400">
                Estimated Yield Rate
              </span>
              <span className="text-3xl font-black font-mono block mt-2 text-slate-900 dark:text-white">
                {metrics.predictedYield} <span className="text-sm font-semibold text-slate-400 font-sans">t/ha</span>
              </span>
            </div>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-500">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium font-mono">EST. REVENUE / HA</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              ${metrics.estimatedRevenue.toLocaleString()}/ha
            </span>
          </div>
        </div>

      </div>

      {/* SATELLITE WARNING BAR */}
      {metrics.weatherWarning !== "None" && (
        <div className="bg-rose-950/20 border border-rose-500/25 p-3.5 rounded-xl flex items-center gap-3 text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="text-xs">
            <span className="font-mono font-bold text-rose-400 uppercase mr-1.5">WEATHER WARNING:</span>
            <span>{metrics.weatherWarning}</span>
          </div>
        </div>
      )}

      {/* 3. CORE ADVISORY MATRICES (CLEAN COMPACT INSIGHT CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: COMPACT ADVISORY & CHAT */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 shadow-xs text-slate-800 dark:text-white transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider font-mono">
                  Precision Crop Guidelines: {activeCropSpecs.name}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 border rounded uppercase bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                Stage: {metrics.growthStage}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Soil Moisture Alert */}
              <div className={`p-5 rounded-xl border flex flex-col gap-3.5 shadow-md transition-all ${
                isDarkMode 
                  ? "bg-cyan-950/20 border-cyan-500/20 hover:border-cyan-500/45 hover:bg-cyan-950/30 shadow-[0_4px_20px_rgba(6,182,212,0.04)]" 
                  : "bg-cyan-50/60 border-cyan-200 text-cyan-950 hover:bg-cyan-50 shadow-[0_4px_20px_rgba(6,182,212,0.02)]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                    isDarkMode ? "text-cyan-400" : "text-cyan-700"
                  }`}>
                    <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-cyan-500/10" : "bg-cyan-500/15"}`}><Droplets className="w-3.5 h-3.5" /></span>
                    <span>Soil Moisture</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    moistureStatus.label.toLowerCase().includes("optimal") 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {moistureStatus.label.toLowerCase().includes("optimal") ? "OPTIMAL" : "ATTENTION"}
                  </span>
                </div>
                <div className="space-y-2 mt-1">
                  <h4 className={`font-bold text-[13px] tracking-tight ${isDarkMode ? "text-white" : "text-cyan-950"}`}>{moistureStatus.label}</h4>
                  <p className={`leading-relaxed text-xs font-sans ${isDarkMode ? "text-slate-200" : "text-cyan-900"}`}>{moistureStatus.recommendation}</p>
                </div>
              </div>

              {/* Card 2: Irrigation Strategy */}
              <div className={`p-5 rounded-xl border flex flex-col gap-3.5 shadow-md transition-all ${
                isDarkMode 
                  ? "bg-sky-950/20 border-sky-500/20 hover:border-sky-500/45 hover:bg-sky-950/30 shadow-[0_4px_20px_rgba(14,165,233,0.04)]" 
                  : "bg-sky-50/60 border-sky-200 text-sky-950 hover:bg-sky-50 shadow-[0_4px_20px_rgba(14,165,233,0.02)]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                    isDarkMode ? "text-sky-400" : "text-sky-700"
                  }`}>
                    <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-sky-500/10" : "bg-sky-500/15"}`}><CloudRain className="w-3.5 h-3.5" /></span>
                    <span>Irrigation Strategy</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    HYDRATION
                  </span>
                </div>
                <div className="space-y-2 mt-1">
                  <h4 className={`font-bold text-[13px] tracking-tight ${isDarkMode ? "text-white" : "text-sky-950"}`}>{irrigationAdvice.bullet1}</h4>
                  <p className={`leading-relaxed text-xs font-sans ${isDarkMode ? "text-slate-200" : "text-sky-900"}`}>{irrigationAdvice.bullet2}</p>
                </div>
              </div>

              {/* Card 3: Fertilizer Advice */}
              <div className={`p-5 rounded-xl border flex flex-col gap-3.5 shadow-md transition-all ${
                isDarkMode 
                  ? "bg-purple-950/20 border-purple-500/20 hover:border-purple-500/45 hover:bg-purple-950/30 shadow-[0_4px_20px_rgba(168,85,247,0.04)]" 
                  : "bg-purple-50/60 border-purple-200 text-purple-950 hover:bg-purple-50 shadow-[0_4px_20px_rgba(168,85,247,0.02)]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                    isDarkMode ? "text-purple-400" : "text-purple-700"
                  }`}>
                    <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-purple-500/10" : "bg-purple-500/15"}`}><Zap className="w-3.5 h-3.5" /></span>
                    <span>Fertilization Matrix</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    BIO-NUTRIENT
                  </span>
                </div>
                <div className="space-y-2 mt-1">
                  <h4 className={`font-bold text-[13px] tracking-tight ${isDarkMode ? "text-white" : "text-purple-950"}`}>{fertilizerAdvice.bullet1}</h4>
                  <p className={`leading-relaxed text-xs font-sans ${isDarkMode ? "text-slate-200" : "text-purple-900"}`}>{fertilizerAdvice.bullet2}</p>
                </div>
              </div>

              {/* Card 4: Biosecurity & Disease */}
              <div className={`p-5 rounded-xl border flex flex-col gap-3.5 shadow-md transition-all ${
                isDarkMode 
                  ? "bg-rose-950/20 border-rose-500/20 hover:border-rose-500/45 hover:bg-rose-950/30 shadow-[0_4px_20px_rgba(244,63,94,0.04)]" 
                  : "bg-rose-50/60 border-rose-200 text-rose-950 hover:bg-rose-50 shadow-[0_4px_20px_rgba(244,63,94,0.02)]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                    isDarkMode ? "text-rose-400" : "text-rose-700"
                  }`}>
                    <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-rose-500/10" : "bg-rose-500/15"}`}><Gauge className="w-3.5 h-3.5" /></span>
                    <span>Biosecurity Alert</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    RISK SHIELD
                  </span>
                </div>
                <div className="space-y-2 mt-1">
                  <h4 className={`font-bold text-[13px] tracking-tight ${isDarkMode ? "text-white" : "text-rose-950"}`} title={biosecurityAdvice.bullet1}>{biosecurityAdvice.bullet1}</h4>
                  <p className={`leading-relaxed text-xs font-sans ${isDarkMode ? "text-slate-200" : "text-rose-900"}`}>{biosecurityAdvice.bullet2}</p>
                </div>
              </div>
            </div>

            {/* Expandable Advanced Specs Section */}
            <div className={`mt-4 pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-150"}`}>
              <button
                onClick={() => setShowCropDetails(!showCropDetails)}
                className="w-full flex items-center justify-between text-xs text-emerald-500 font-bold hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span>{showCropDetails ? "Hide Advanced Specifications" : "View Advanced Specifications"}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCropDetails ? "rotate-180" : ""}`} />
              </button>

              {showCropDetails && (
                <div className={`mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs p-4 rounded-xl border animate-fadeIn ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Planting Window</span>
                    <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{activeCropSpecs.plantingWindow}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Growth Cycle</span>
                    <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{activeCropSpecs.harvestPeriod} ({activeCropSpecs.growthCycleDays} days)</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Suitable Soil Types</span>
                    <span className={`font-bold block ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{activeCropSpecs.soilTypeSuitability.join(", ")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Ideal Temperature Range</span>
                    <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{activeCropSpecs.idealTempMin}°C - {activeCropSpecs.idealTempMax}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Ideal Seasonal Rainfall</span>
                    <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{activeCropSpecs.idealRainfallMin}mm - {activeCropSpecs.idealRainfallMax}mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Base Price Estimate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-450">${activeCropSpecs.basePrice} / ton</span>
                  </div>
                  <div className={`col-span-2 sm:col-span-3 pt-2 border-t ${isDarkMode ? "border-slate-800/60" : "border-slate-200"}`}>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Biological Characteristics</span>
                    <p className={`leading-normal text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{activeCropSpecs.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI AGRONOMIST CONSULTANT CHAT */}
          <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 shadow-xs relative overflow-hidden transition-colors duration-200 text-slate-800 dark:text-white">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Brain className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                AI Agronomist Consulting
              </span>
            </div>

            <p className="text-xs leading-normal mb-3 text-slate-500 dark:text-slate-400">
              Ask about localized seed depths, thermal boundaries, or Nitrogen-Phosphorus timing recommendations for <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedCrop}</strong>.
            </p>

            <div className="flex flex-col gap-2.5">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={`Given current soil moisture of ${metrics.soilMoisture}%, what is the optimal timing for fertilizer application?`}
                rows={2}
                className="w-full text-xs p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleDecisionSubmit}
                  disabled={aiLoading || !questionText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Consult Expert</span>
                    </>
                  )}
                </button>

                {aiResponse && (
                  <button
                    onClick={() => {
                      setQuestionText("");
                      setAiResponse("");
                      setAiError("");
                    }}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* AI Advisor Response */}
            {aiResponse && (
              <div className="mt-3.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-slate-900/90 text-xs text-slate-800 dark:text-slate-200">
                <span className="text-[8px] font-mono font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                  AI RECOMMENDATION OUTLINE
                </span>
                <p className="leading-relaxed font-sans font-light">
                  {aiResponse}
                </p>
              </div>
            )}

            {aiError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: RECOMMENDATION MATRIX & QUICK COMPARISON */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* REDESIGNED RECOMMENDATION MATRIX */}
          <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 shadow-xs relative overflow-hidden transition-colors duration-200 text-slate-800 dark:text-white">
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Activity className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Which Crop Should I Grow?
              </span>
            </div>

            <p className="text-xs leading-normal mb-4 text-slate-500 dark:text-slate-400">
              Ranked match matrix based on live atmospheric thresholds and moisture projections.
            </p>

            {/* Compact Crop Recommendation list */}
            <div className="flex flex-col gap-3">
              {recommendationsList.slice(0, 3).map((rec, idx) => {
                const isBest = idx === 0;
                return (
                  <div
                    key={rec.name}
                    onClick={() => setSelectedCrop(rec.name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isBest
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/45 shadow-xs text-slate-900 dark:text-white hover:border-emerald-400"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {isBest && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-mono font-black uppercase tracking-wider leading-none">
                        Best Choice
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <span>{getCropEmoji(rec.name)}</span>
                        <span>{rec.name}</span>
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-1">
                        <span className="text-slate-400 font-sans">Match:</span>
                        <span className={`font-extrabold ${getSuitabilityColor(rec.score)}`}>
                          {rec.score}%
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-1">
                        <span className="text-slate-400 font-sans">Yield:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{rec.yield} t/ha</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-1">
                        <span className="text-slate-400 font-sans">Revenue:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">${rec.revenue}/ha</span>
                      </div>
                      <div className="text-[11px] font-sans italic pt-2 mt-2 leading-relaxed text-slate-500 dark:text-slate-400">
                        <span className="font-semibold not-italic text-slate-700 dark:text-slate-300">Reason:</span> {getShortReason(rec.name, rec.score)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LIGHT CROP QUICK METRIC RATINGS */}
          <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Scale className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Precision Parameters
              </span>
            </div>
            
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Soil Temperature</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{metrics.estimatedSoilTemp}°C</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Moisture Profile Preference</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{activeCropSpecs.soilMoisturePreference}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Growth Cycle Duration</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{activeCropSpecs.growthCycleDays} days</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400">Baseline Market Price</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${activeCropSpecs.basePrice} / ton</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. EXPANDABLE ADVANCED ANALYTICS SECTION (CLEANS MAIN DASHBOARD) */}
      <div className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between px-6 py-4 transition-colors text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40"
        >
          <div className="flex items-center gap-2.5">
            <LineChartIcon className="w-4 h-4 text-emerald-500" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-800 dark:text-slate-200">
                Advanced Analytics & Agro-Spectral Models
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                NDVI satellite tracking, soil moisture decay loops, and dual-crop threshold compare tools.
              </p>
            </div>
          </div>
          <div className="p-1 border border-slate-200 dark:border-slate-800 rounded text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900">
            {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isAdvancedOpen && (
          <div className={`p-6 border-t flex flex-col gap-8 animate-fadeIn ${isDarkMode ? "border-slate-800/80" : "border-slate-150"}`}>
            
            {/* Charts & Graphs Row (3 columns: col-span-2 for chart, col-span-1 for stats & ndvi card) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Spectral Recharts (Span 2 columns) */}
              <div className={`border rounded-2xl p-5 flex flex-col gap-4 ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3 ${isDarkMode ? "border-slate-850/60" : "border-slate-150"}`}>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-slate-850"}`}>
                      <LineChartIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Agro-Spectral Simulation ({activeCropSpecs.name})</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Satellite canopy matching versus root moisture decay cycles.
                    </p>
                  </div>

                  <div className={`flex p-0.5 rounded border text-[9px] font-mono ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                    <button
                      onClick={() => setTimeRange("current")}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        timeRange === "current" 
                          ? isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800 shadow-xs" 
                          : "text-slate-450 hover:text-slate-700"
                      }`}
                    >
                      NDVI Cycle
                    </button>
                    <button
                      onClick={() => setTimeRange("forecast")}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        timeRange === "forecast" 
                          ? isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800 shadow-xs" 
                          : "text-slate-450 hover:text-slate-700"
                      }`}
                    >
                      Moisture Decay
                    </button>
                  </div>
                </div>

                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {timeRange === "current" ? (
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64748B" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="day" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={9} tickLine={false} />
                        <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={9} domain={[0, 1.0]} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#e2e8f0", color: isDarkMode ? "#f8fafc" : "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                        <Legend wrapperStyle={{ fontSize: 9, color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                        <Area type="monotone" dataKey="NDVI (Canopy Index)" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#ndviGrad)" />
                        <Area type="monotone" dataKey="Historical NDVI" stroke="#64748B" strokeDasharray="3 3" fillOpacity={1} fill="url(#histGrad)" />
                      </AreaChart>
                    ) : (
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="day" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={9} tickLine={false} />
                        <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={9} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#e2e8f0", color: isDarkMode ? "#f8fafc" : "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                        <Legend wrapperStyle={{ fontSize: 9, color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                        <Line type="monotone" dataKey="Soil Moisture (%)" stroke="#38BDF8" strokeWidth={2} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="NDVI (Canopy Index)" stroke="#A78BFA" strokeWidth={1} strokeDasharray="3 3" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Advanced Controls column (NDVI Health Card & Crop Comparer) */}
              <div className="flex flex-col gap-6">
                
                {/* Dynamic Crop Health (NDVI) - MOVED HERE */}
                <div className="border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 rounded-2xl p-4.5 flex flex-col justify-between relative overflow-hidden group shadow-xs transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-500 dark:text-slate-400">
                        Satellite NDVI Index
                      </span>
                      <span className="text-2xl font-black font-mono block mt-1 text-slate-900 dark:text-white">
                        {(t.ndvi ?? 0.55).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
                      <Sprout className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 border-t border-slate-100 dark:border-slate-800/60 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">CANOPY CLASSIFICATION</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {metrics.cropHealthScore >= 80 ? "Premium" : metrics.cropHealthScore >= 55 ? "Good" : "Stressed"}
                    </span>
                  </div>
                </div>

                {/* Crop Comparer Block */}
                <div className="border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 rounded-2xl p-5 transition-colors duration-200 shadow-xs text-slate-800 dark:text-white">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
                    <Scale className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Dual Crop Precision Comparer
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Strain Alpha</label>
                      <select
                        value={cropA}
                        onChange={(e) => setCropA(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      >
                        {CROPS_DATABASE.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Strain Beta</label>
                      <select
                        value={cropB}
                        onChange={(e) => setCropB(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      >
                        {CROPS_DATABASE.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Compare parameter lists */}
                  <div className="flex flex-col gap-2.5 text-[11px]">
                    
                    <div className="p-2.5 rounded border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 shadow-xs">
                      <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Climatic Compatibility Match</span>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-white">
                        <span className={getSuitabilityColor(calcA.suitabilityIndex)}>{cropA}: {calcA.suitabilityIndex}%</span>
                        <span className="text-slate-400">vs</span>
                        <span className={getSuitabilityColor(calcB.suitabilityIndex)}>{cropB}: {calcB.suitabilityIndex}%</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 shadow-xs">
                      <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Expected Yield</span>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-white">
                        <span>{cropA}: {calcA.predictedYield} t/ha</span>
                        <span className="text-slate-400">vs</span>
                        <span>{cropB}: {calcB.predictedYield} t/ha</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 shadow-xs">
                      <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Estimated Revenue Return</span>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-white">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">${calcA.estimatedRevenue.toLocaleString()}/ha</span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">${calcB.estimatedRevenue.toLocaleString()}/ha</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* Coordinates / Raw Telemetry Node */}
            <div className="border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-mono bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <div>
                <span>Spectral Coordinates: </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedLocation.lat.toFixed(5)}°N, {selectedLocation.lng.toFixed(5)}°E</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                <span>Telemetry Node ID: </span>
                <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{selectedLocation.id || "N/A"}</span>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
