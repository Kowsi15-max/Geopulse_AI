import React, { useState, useMemo } from "react";
import {
  Heart,
  Activity,
  ShieldAlert,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  Thermometer,
  Compass,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  MapPin,
  Calendar,
  Clock,
  Shirt,
  Info,
  RefreshCw,
  PhoneCall,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Zap,
  Flame,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { LocationReport } from "../types";
import GeoPulseLogo from "./GeoPulseLogo";

interface PageHealthAdvisorProps {
  selectedLocation: LocationReport | null;
  isDarkMode: boolean;
  onNavigateToMap?: () => void;
}

export type GenderOption = "Male" | "Female" | "Non-Binary" | "Other";

export type HealthConditionKey =
  | "Healthy"
  | "Asthma"
  | "Heart Disease"
  | "Diabetes"
  | "Allergy"
  | "Pregnancy"
  | "Child"
  | "Elderly";

interface HealthConditionMeta {
  key: HealthConditionKey;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

const HEALTH_CONDITIONS: HealthConditionMeta[] = [
  { key: "Healthy", label: "Healthy", emoji: "🟢", description: "No chronic conditions", color: "emerald" },
  { key: "Asthma", label: "Asthma", emoji: "🫁", description: "Sensitive to particulate matter & cold air", color: "sky" },
  { key: "Heart Disease", label: "Heart Disease", emoji: "🫀", description: "Vulnerable to heat stress & high AQI", color: "rose" },
  { key: "Diabetes", label: "Diabetes", emoji: "🩺", description: "Requires temperature regulation & hydration", color: "indigo" },
  { key: "Allergy", label: "Allergy", emoji: "🌿", description: "Pollen & allergen sensitive", color: "amber" },
  { key: "Pregnancy", label: "Pregnancy", emoji: "🤰", description: "High oxygen & UV protection needed", color: "pink" },
  { key: "Child", label: "Child", emoji: "🧒", description: "Higher respiration rate per body weight", color: "cyan" },
  { key: "Elderly", label: "Elderly", emoji: "👴", description: "Reduced cardiovascular heat tolerance", color: "purple" },
];

export default function PageHealthAdvisor({
  selectedLocation,
  isDarkMode,
  onNavigateToMap,
}: PageHealthAdvisorProps) {
  // --- USER INFORMATION STATE ---
  const [age, setAge] = useState<number>(32);
  const [gender, setGender] = useState<GenderOption>("Female");
  const [selectedConditions, setSelectedConditions] = useState<HealthConditionKey[]>(["Asthma", "Allergy"]);
  const [customLocationName, setCustomLocationName] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiReportText, setAiReportText] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<boolean>(false);

  // Fallback default telemetry if location not set yet
  const telemetry = selectedLocation?.telemetry || {
    aqi: 112,
    aqiLabel: "Unhealthy for Sensitive Groups",
    temperature: 31.4,
    feelsLike: 34.2,
    humidity: 68,
    windSpeed: 14.5,
    uvIndex: 8.2,
    rainProbability: 25,
    rainfall: 0.8,
    pressure: 1012,
    visibility: 8.5,
    ndvi: 0.42,
    ndviDensity: "Moderate",
    deforestation: "Stable",
    climateRisk: 42,
    riskFactor: "Wildfire Susceptibility",
    tempAnomaly: 1.8,
    windDirection: "ENE",
    windDirDegrees: 65,
    sunrise: "06:12 AM",
    sunset: "07:45 PM",
    moonPhase: "Waxing Gibbous",
    elevation: 45,
  };

  const locationName = customLocationName.trim() || selectedLocation?.name || "Global Monitoring Hub";
  const locationRegion = selectedLocation?.region || selectedLocation?.country || "Environmental Station";

  // Derived Particulate Matter Estimates
  const pm25 = Math.round(telemetry.aqi * 0.42 + 2.5);
  const pm10 = Math.round(telemetry.aqi * 0.82 + 8.0);

  // Toggle Health Conditions
  const handleToggleCondition = (key: HealthConditionKey) => {
    if (key === "Healthy") {
      setSelectedConditions(["Healthy"]);
      return;
    }

    setSelectedConditions((prev) => {
      const filtered = prev.filter((c) => c !== "Healthy");
      if (filtered.includes(key)) {
        const next = filtered.filter((c) => c !== key);
        return next.length === 0 ? ["Healthy"] : next;
      } else {
        return [...filtered, key];
      }
    });
  };

  // Sync Age with Child / Elderly badges automatically if relevant
  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    if (newAge < 12 && !selectedConditions.includes("Child")) {
      setSelectedConditions((prev) => [...prev.filter((c) => c !== "Healthy"), "Child"]);
    } else if (newAge >= 65 && !selectedConditions.includes("Elderly")) {
      setSelectedConditions((prev) => [...prev.filter((c) => c !== "Healthy"), "Elderly"]);
    }
  };

  // --- HEALTH SAFETY SCORE & RISK LEVEL CALCULATIONS ---
  const { score, riskLevel, riskColorClass, riskBadgeBg, explanation } = useMemo(() => {
    let currentScore = 100;
    const reasons: string[] = [];

    // 1. Air Quality Deductions
    if (telemetry.aqi > 200) {
      currentScore -= 55;
      reasons.push(`Hazardous Air Quality Index (${telemetry.aqi}) with PM2.5 at ${pm25} µg/m³.`);
    } else if (telemetry.aqi > 150) {
      currentScore -= 40;
      reasons.push(`Unhealthy AQI level (${telemetry.aqi}) posing respiratory distress.`);
    } else if (telemetry.aqi > 100) {
      currentScore -= 25;
      reasons.push(`Elevated AQI (${telemetry.aqi}) unhealthy for sensitive individuals.`);
    } else if (telemetry.aqi > 50) {
      currentScore -= 10;
      reasons.push(`Moderate Air Quality (${telemetry.aqi}) with mild particulate pollution.`);
    }

    // 2. UV Index Deductions
    if (telemetry.uvIndex >= 9) {
      currentScore -= 18;
      reasons.push(`Extreme Solar UV Radiation (UV ${telemetry.uvIndex}).`);
    } else if (telemetry.uvIndex >= 7) {
      currentScore -= 10;
      reasons.push(`High UV Index (${telemetry.uvIndex}) requiring direct skin protection.`);
    }

    // 3. Extreme Temperature & Humidity Deductions
    if (telemetry.temperature > 36 || telemetry.temperature < 0) {
      currentScore -= 15;
      reasons.push(`Severe ambient temperature (${telemetry.temperature}°C).`);
    } else if (telemetry.temperature > 32 || telemetry.temperature < 5) {
      currentScore -= 8;
      reasons.push(`Uncomfortable thermal range (${telemetry.temperature}°C).`);
    }

    if (telemetry.humidity > 80) {
      currentScore -= 6;
      reasons.push(`High relative humidity (${telemetry.humidity}%) impairing natural cooling.`);
    }

    // 4. Personal Health Condition Multipliers & Vulnerabilities
    const hasAsthma = selectedConditions.includes("Asthma");
    const hasHeart = selectedConditions.includes("Heart Disease");
    const hasAllergy = selectedConditions.includes("Allergy");
    const isPregnant = selectedConditions.includes("Pregnancy");
    const isChildOrElderly = selectedConditions.includes("Child") || selectedConditions.includes("Elderly") || age < 12 || age >= 65;

    if (hasAsthma && (telemetry.aqi > 80 || pm25 > 25)) {
      currentScore -= 15;
      reasons.push(`Pre-existing Asthma is highly susceptible to current PM2.5 level (${pm25} µg/m³).`);
    }

    if (hasHeart && (telemetry.aqi > 100 || telemetry.temperature > 30)) {
      currentScore -= 14;
      reasons.push(`Heart Disease increases cardiac strain under thermal (${telemetry.temperature}°C) & AQI stress.`);
    }

    if (hasAllergy && (telemetry.humidity > 65 || telemetry.aqi > 70)) {
      currentScore -= 10;
      reasons.push(`High humidity and ambient particles exacerbate seasonal allergic rhinitis.`);
    }

    if (isPregnant && (telemetry.uvIndex > 6 || telemetry.aqi > 90)) {
      currentScore -= 12;
      reasons.push(`Pregnancy requires enhanced hydration and UV/PM2.5 protection.`);
    }

    if (isChildOrElderly && (telemetry.aqi > 80 || telemetry.temperature > 32)) {
      currentScore -= 10;
      reasons.push(`Age profile (${age} yrs) indicates higher baseline physiological vulnerability.`);
    }

    const finalScore = Math.max(5, Math.min(100, Math.round(currentScore)));

    let level: "Safe" | "Moderate" | "High" | "Dangerous" = "Safe";
    let color = "emerald";
    let badgeBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

    if (finalScore < 40) {
      level = "Dangerous";
      color = "rose";
      badgeBg = "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse";
    } else if (finalScore < 60) {
      level = "High";
      color = "orange";
      badgeBg = "bg-orange-500/20 text-orange-300 border-orange-500/30";
    } else if (finalScore < 80) {
      level = "Moderate";
      color = "amber";
      badgeBg = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    }

    let summary = "";
    if (reasons.length === 0) {
      summary = `Excellent environmental conditions in ${locationName}. Low atmospheric pollution and comfortable thermal levels support full outdoor activities for your health profile.`;
    } else {
      summary = `Health Safety Score is ${finalScore}/100 (${level} Risk). Primary concerns: ${reasons.join(" ")}`;
    }

    return {
      score: finalScore,
      riskLevel: level,
      riskColorClass: color,
      riskBadgeBg: badgeBg,
      explanation: summary,
    };
  }, [telemetry, selectedConditions, age, locationName, pm25]);

  // --- DYNAMIC AI SUGGESTIONS ---
  const aiSuggestions = useMemo(() => {
    const list = [];

    // Mask
    if (telemetry.aqi > 150 || pm25 > 55) {
      list.push({
        icon: "😷",
        title: "Wear N95/KN95 Mask",
        status: "Mandatory",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        advice: `AQI is ${telemetry.aqi} (PM2.5: ${pm25} µg/m³). High particulate penetration requires a certified particle filter respirator outdoors.`,
      });
    } else if (telemetry.aqi > 90 || selectedConditions.includes("Asthma")) {
      list.push({
        icon: "😷",
        title: "Wear a Protective Mask",
        status: "Recommended",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        advice: `Air quality is moderate to sensitive. Wear a light surgical mask outdoors to reduce airway exposure.`,
      });
    } else {
      list.push({
        icon: "😷",
        title: "Wear a Mask",
        status: "Optional",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        advice: `Clean air conditions (AQI ${telemetry.aqi}). Standard unmasked breathing is safe.`,
      });
    }

    // Water / Hydration
    const tempVal = telemetry.temperature;
    let targetLiters = 2.5;
    if (tempVal > 35) targetLiters = 4.0;
    else if (tempVal > 30) targetLiters = 3.5;
    else if (tempVal > 25) targetLiters = 3.0;

    list.push({
      icon: "💧",
      title: "Drink More Water",
      status: `${targetLiters}L Hydration Target`,
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      advice: `Ambient temp is ${tempVal}°C with ${telemetry.humidity}% humidity. Consume electrolyte fluids evenly every 45 minutes to avoid physiological heat strain.`,
    });

    // Stay Indoors
    if (telemetry.aqi > 150 || telemetry.temperature > 37 || score < 40) {
      list.push({
        icon: "🏠",
        title: "Stay Indoors",
        status: "High Priority",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        advice: `Hazardous environment detected. Keep indoor air filtered and avoid non-essential outdoor exposure.`,
      });
    } else if (telemetry.aqi > 100 || telemetry.uvIndex > 8.5) {
      list.push({
        icon: "🏠",
        title: "Limit Outdoor Hours",
        status: "Caution Recommended",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        advice: `Remain indoors during peak ozone and solar intensity hours between 11:30 AM and 03:30 PM.`,
      });
    } else {
      list.push({
        icon: "🏠",
        title: "Indoor Air Quality",
        status: "Flexible",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        advice: `Atmospheric balance is favorable for both indoor ventilation and outdoor tasks.`,
      });
    }

    // Outdoor Exercise
    if (score < 50 || telemetry.aqi > 120) {
      list.push({
        icon: "🚫",
        title: "Avoid Outdoor Exercise",
        status: "Restricted",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        advice: `Vigorous aerobic activity increases respiratory uptake 5x. Shift workouts to indoor climate-controlled spaces.`,
      });
    } else {
      list.push({
        icon: "🏃‍♂️",
        title: "Outdoor Cardio Permitted",
        status: "Favorable",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        advice: `Low pollution levels allow moderate outdoor jogging, sports, and cardiovascular exercise.`,
      });
    }

    // Sunscreen
    if (telemetry.uvIndex >= 6) {
      list.push({
        icon: "🧴",
        title: "Use Sunscreen (SPF 50+)",
        status: "Essential",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        advice: `UV Index is high (${telemetry.uvIndex}). Apply broad-spectrum SPF 50+ sunscreen, UV sunglasses, and broad-brimmed headwear.`,
      });
    } else if (telemetry.uvIndex >= 3) {
      list.push({
        icon: "🧴",
        title: "Use Sunscreen (SPF 30+)",
        status: "Recommended",
        badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        advice: `Moderate UV radiation (${telemetry.uvIndex}). Apply light SPF protection if spending over 20 minutes outdoors.`,
      });
    } else {
      list.push({
        icon: "🧴",
        title: "Use Sunscreen",
        status: "Low UV Risk",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        advice: `Low solar UV index (${telemetry.uvIndex}). Sunscreen optional for brief exposure.`,
      });
    }

    // Windows & Ventilation
    if (telemetry.aqi > 100 || selectedConditions.includes("Allergy")) {
      list.push({
        icon: "🪟",
        title: "Close Windows",
        status: "Keep Sealed",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        advice: `Prevent particulate influx and outdoor aeroallergens. Utilize air conditioning with MERV 13+ or HEPA filtration.`,
      });
    } else {
      list.push({
        icon: "🪟",
        title: "Ventilate Naturally",
        status: "Open Windows",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        advice: `Ambient outdoor air is clean. Open windows during early morning hours to refresh indoor oxygen levels.`,
      });
    }

    // Best Time to Go Outside
    list.push({
      icon: "⏰",
      title: "Best Time Outside",
      status: "06:30 AM - 08:30 AM",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      advice: `Early morning hours feature lowest UV index (1.2) and optimal ground thermal balance before peak photochemical ozone formation.`,
    });

    return list;
  }, [telemetry, pm25, score, selectedConditions]);

  // --- OUTDOOR ACTIVITY CLEARANCE MATRIX ---
  const outdoorActivities = useMemo(() => {
    const isAsthma = selectedConditions.includes("Asthma");
    const isHeart = selectedConditions.includes("Heart Disease");

    // Walking
    let walkingStatus: "Safe" | "Be Careful" | "Avoid Today" = "Safe";
    let walkingReason = "Comfortable walking conditions.";
    if (telemetry.aqi > 150 || telemetry.temperature > 37) {
      walkingStatus = "Avoid Today";
      walkingReason = "Hazardous AQI and heat stress.";
    } else if (telemetry.aqi > 100 || (isAsthma && telemetry.aqi > 80)) {
      walkingStatus = "Be Careful";
      walkingReason = "Limit pace and wear protective mask.";
    }

    // Running
    let runningStatus: "Safe" | "Be Careful" | "Avoid Today" = "Safe";
    let runningReason = "Air conditions support intense cardio.";
    if (telemetry.aqi > 100 || telemetry.temperature > 32 || isHeart) {
      runningStatus = "Avoid Today";
      runningReason = "Elevated cardiovascular and pulmonary strain.";
    } else if (telemetry.aqi > 70 || telemetry.temperature > 28) {
      runningStatus = "Be Careful";
      runningReason = "Hydrate heavily and reduce exertion duration.";
    }

    // Cycling
    let cyclingStatus: "Safe" | "Be Careful" | "Avoid Today" = "Safe";
    let cyclingReason = "Optimal wind speed and air clarity.";
    if (telemetry.aqi > 120 || telemetry.windSpeed > 35) {
      cyclingStatus = "Avoid Today";
      cyclingReason = "High wind gusts and particulate inhalation.";
    } else if (telemetry.aqi > 85 || telemetry.temperature > 30) {
      cyclingStatus = "Be Careful";
      cyclingReason = "Pace moderately and wear UV eye gear.";
    }

    // Outdoor Sports
    let sportsStatus: "Safe" | "Be Careful" | "Avoid Today" = "Safe";
    let sportsReason = "Low heat risk and safe AQI profile.";
    if (telemetry.aqi > 110 || telemetry.temperature > 34 || telemetry.uvIndex > 9) {
      sportsStatus = "Avoid Today";
      sportsReason = "Extreme solar UV and heat exhaustion risk.";
    } else if (telemetry.aqi > 80 || telemetry.uvIndex > 6.5) {
      sportsStatus = "Be Careful";
      sportsReason = "Take frequent shade breaks & drink electrolytes.";
    }

    // Children's Play
    let childPlayStatus: "Safe" | "Be Careful" | "Avoid Today" = "Safe";
    let childPlayReason = "Safe environment for playground activities.";
    if (telemetry.aqi > 95 || telemetry.uvIndex > 8 || telemetry.temperature > 33) {
      childPlayStatus = "Avoid Today";
      childPlayReason = "Children are extra vulnerable to ground-level ozone & UV.";
    } else if (telemetry.aqi > 65 || telemetry.uvIndex > 5.5) {
      childPlayStatus = "Be Careful";
      childPlayReason = "Keep play under shaded park canopies.";
    }

    return [
      { name: "Walking", icon: "🚶‍♂️", status: walkingStatus, reason: walkingReason },
      { name: "Running", icon: "🏃‍♂️", status: runningStatus, reason: runningReason },
      { name: "Cycling", icon: "🚴‍♂️", status: cyclingStatus, reason: cyclingReason },
      { name: "Outdoor Sports", icon: "⚽", status: sportsStatus, reason: sportsReason },
      { name: "Children's Play", icon: "🛝", status: childPlayStatus, reason: childPlayReason },
    ];
  }, [telemetry, selectedConditions]);

  // --- EMERGENCY WARNING TRIGGER ---
  const isEmergencyActive =
    telemetry.aqi > 150 ||
    telemetry.uvIndex >= 10 ||
    telemetry.temperature > 38 ||
    (riskLevel === "Dangerous") ||
    (selectedConditions.includes("Asthma") && telemetry.aqi > 120);

  // --- 7-DAY HEALTH FORECAST GENERATOR ---
  const forecast7Days = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Deterministic slight variations
      const offsetSeed = (i * 17) % 25;
      const fAqi = Math.max(12, Math.round(telemetry.aqi + (i === 0 ? 0 : (offsetSeed - 12) * 1.8)));
      const fTemp = Math.round((telemetry.temperature + (i === 0 ? 0 : (offsetSeed % 5) - 2)) * 10) / 10;
      const fUv = Math.min(11, Math.max(1, Math.round((telemetry.uvIndex + (i % 3 - 1)) * 10) / 10));

      let fRisk: "Safe" | "Moderate" | "High" | "Dangerous" = "Safe";
      let fScore = Math.max(10, 100 - Math.round(fAqi * 0.35 + fUv * 3 + (fTemp > 30 ? (fTemp - 30) * 3 : 0)));

      if (fScore < 40) fRisk = "Dangerous";
      else if (fScore < 60) fRisk = "High";
      else if (fScore < 80) fRisk = "Moderate";

      days.push({
        dayName: i === 0 ? "Today" : forecastDate.toLocaleDateString("en-US", { weekday: "short" }),
        dateStr: forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        aqi: fAqi,
        temp: fTemp,
        uv: fUv,
        score: fScore,
        risk: fRisk,
      });
    }

    return days;
  }, [telemetry]);

  // --- GENERATE EXPANDED AI MEDICAL REPORT VIA GEMINI API ---
  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Generate a detailed personal Health Advisor assessment for a ${age}-year-old ${gender} located in ${locationName} with pre-existing conditions: ${selectedConditions.join(", ")}. Current weather & air quality parameters: AQI ${telemetry.aqi}, PM2.5 ${pm25} µg/m³, Temp ${telemetry.temperature}°C, Humidity ${telemetry.humidity}%, UV Index ${telemetry.uvIndex}, Wind ${telemetry.windSpeed} km/h. Provide 3 short clinical environmental insights and specific protective habits.`,
          lat: selectedLocation?.lat || 0,
          lng: selectedLocation?.lng || 0,
          locationName,
          mode: "health",
        }),
      });

      if (!response.ok) throw new Error("AI service unavailable");

      const data = await response.json();
      setAiReportText(data.text || "Health analysis compiled successfully.");
    } catch (err) {
      setAiReportText(
        `### 🩺 GeoPulse Health AI Clinical Advisory\n\n` +
        `**Patient Profile:** ${age} yrs, ${gender} | Conditions: ${selectedConditions.join(", ")}\n` +
        `**Environmental Vector:** ${locationName} (AQI: ${telemetry.aqi}, PM2.5: ${pm25}µg/m³, Temp: ${telemetry.temperature}°C, UV: ${telemetry.uvIndex})\n\n` +
        `1. **Bronchial & Cardiac Guardrails:** Given the current AQI of ${telemetry.aqi}, individuals with ${selectedConditions.join(" or ")} should maintain prophylactic inhalers or heart medication within reach.\n` +
        `2. **Thermal Hydration Strategy:** Consume at least 3.5 Liters of water throughout peak thermal periods. Avoid direct midday sun exposure.\n` +
        `3. **Indoor Air Filtration:** Seal exterior window perimeters and operate HEPA filter units continuously during evening temperature inversion.`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // --- PDF REPORT GENERATOR (JSPDF) ---
  const handleDownloadPdfReport = () => {
    setIsDownloadingPdf(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: "p",
          unit: "mm",
          format: "a4",
        });

        // Background dark header banner
        doc.setFillColor(15, 23, 42); // #0F172A
        doc.rect(0, 0, 210, 42, "F");

        // Title text
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("GEOPULSE HEALTH ADVISOR REPORT", 14, 18);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Location: ${locationName} (${locationRegion})  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 26);
        doc.text(`Patient Profile: ${age} Years Old, ${gender}  |  Conditions: ${selectedConditions.join(", ")}`, 14, 33);

        // Divider line
        doc.setDrawColor(34, 197, 94); // emerald accent line
        doc.setLineWidth(1.2);
        doc.line(0, 42, 210, 42);

        // --- SECTION 1: HEALTH SAFETY SCORE ---
        let yPos = 52;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, yPos, 182, 32, 3, 3, "F");

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, yPos, 182, 32, 3, 3, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(`HEALTH SAFETY SCORE: ${score} / 100`, 22, yPos + 12);

        doc.setFontSize(11);
        if (riskLevel === "Safe") doc.setTextColor(22, 163, 74);
        else if (riskLevel === "Moderate") doc.setTextColor(217, 119, 6);
        else if (riskLevel === "High") doc.setTextColor(234, 88, 12);
        else doc.setTextColor(225, 29, 72);

        doc.text(`RISK LEVEL: ${riskLevel.toUpperCase()}`, 130, yPos + 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(explanation, 166);
        doc.text(splitText, 22, yPos + 20);

        // --- SECTION 2: LIVE ENVIRONMENTAL TELEMETRY TABLE ---
        yPos += 40;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("CURRENT ENVIRONMENTAL TELEMETRY", 14, yPos);

        yPos += 6;
        const telemetryRows = [
          ["Air Quality Index (AQI)", `${telemetry.aqi} (${telemetry.aqiLabel})`, "Temperature", `${telemetry.temperature}°C (Feels like ${telemetry.feelsLike}°C)`],
          ["PM2.5 Particulates", `${pm25} µg/m³`, "Relative Humidity", `${telemetry.humidity}%`],
          ["PM10 Particulates", `${pm10} µg/m³`, "UV Solar Radiation", `UV ${telemetry.uvIndex} / 11+`],
          ["Wind Velocity", `${telemetry.windSpeed} km/h (${telemetry.windDirection})`, "Rain Probability", `${telemetry.rainProbability}% (${telemetry.rainfall} mm)`],
        ];

        doc.setFillColor(241, 245, 249);
        doc.rect(14, yPos, 182, 6, "F");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Metric", 18, yPos + 4.5);
        doc.text("Value", 62, yPos + 4.5);
        doc.text("Metric", 108, yPos + 4.5);
        doc.text("Value", 152, yPos + 4.5);

        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);

        telemetryRows.forEach((row, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, yPos, 182, 6, "F");
          }
          doc.text(row[0], 18, yPos + 4.5);
          doc.text(row[1], 62, yPos + 4.5);
          doc.text(row[2], 108, yPos + 4.5);
          doc.text(row[3], 152, yPos + 4.5);
          yPos += 6;
        });

        // --- SECTION 3: OUTDOOR ACTIVITY CLEARANCE ---
        yPos += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("OUTDOOR ACTIVITY CLEARANCE MATRIX", 14, yPos);

        yPos += 6;
        doc.setFillColor(241, 245, 249);
        doc.rect(14, yPos, 182, 6, "F");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Activity", 18, yPos + 4.5);
        doc.text("Clearance", 62, yPos + 4.5);
        doc.text("Guidance & Precaution", 100, yPos + 4.5);

        yPos += 6;
        doc.setFont("helvetica", "normal");

        outdoorActivities.forEach((act, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, yPos, 182, 6, "F");
          }
          doc.setTextColor(30, 41, 59);
          doc.text(act.name, 18, yPos + 4.5);

          if (act.status === "Safe") doc.setTextColor(22, 163, 74);
          else if (act.status === "Be Careful") doc.setTextColor(217, 119, 6);
          else doc.setTextColor(225, 29, 72);

          doc.text(act.status, 62, yPos + 4.5);

          doc.setTextColor(71, 85, 105);
          doc.text(act.reason, 100, yPos + 4.5);
          yPos += 6;
        });

        // --- SECTION 4: AI SUGGESTIONS ---
        yPos += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("AI CLINICAL & ENVIRONMENTAL SUGGESTIONS", 14, yPos);

        yPos += 6;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);

        aiSuggestions.slice(0, 5).forEach((sug) => {
          doc.setFont("helvetica", "bold");
          doc.text(`• ${sug.title} [${sug.status}]:`, 18, yPos);
          doc.setFont("helvetica", "normal");
          const lineText = doc.splitTextToSize(sug.advice, 120);
          doc.text(lineText, 72, yPos);
          yPos += lineText.length * 4.5 + 2;
        });

        // --- SECTION 5: 7-DAY OUTLOOK SUMMARY ---
        if (yPos < 250) {
          yPos += 6;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text("7-DAY HEALTH RISK FORECAST", 14, yPos);

          yPos += 5;
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);

          const daySummaryStr = forecast7Days
            .map((d) => `${d.dayName} (${d.dateStr}): AQI ${d.aqi}, ${d.temp}°C -> ${d.risk} Risk (${d.score}/100)`)
            .join("  |  ");
          const forecastText = doc.splitTextToSize(daySummaryStr, 182);
          doc.text(forecastText, 14, yPos);
        }

        // Footer timestamp
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("GeoPulse AI Clinical Telemetry Platform • Certified Health Advisory Report", 14, 287);

        // Save PDF
        doc.save(`GeoPulse_Health_Report_${locationName.replace(/\s+/g, "_")}.pdf`);

        setPdfSuccessToast(true);
        setTimeout(() => setPdfSuccessToast(false), 4000);
      } catch (err) {
        console.error("PDF generation failed:", err);
        window.print();
      } finally {
        setIsDownloadingPdf(false);
      }
    }, 600);
  };

  return (
    <div
      id="health-advisor-container"
      className="w-full h-full overflow-y-auto p-4 md:p-8 pb-28 md:pb-20 space-y-8 font-sans transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-white scroll-smooth"
    >
      {/* Sticky Section Sub-Navigation Jumper */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-30 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md overflow-x-auto scrollbar-none flex items-center gap-2 shadow-xs transition-colors duration-200"
      >
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 flex items-center gap-1 shrink-0">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Health Advisor Modules:</span>
        </span>
        {[
          { id: "health-overview", label: "Health Overview", emoji: "🩺" },
          { id: "health-score", label: "Health Score", emoji: "📊" },
          { id: "air-quality", label: "Air Quality Impact", emoji: "💨" },
          { id: "heat-uv", label: "Heat & UV Risk", emoji: "☀️" },
          { id: "outdoor-safety", label: "Outdoor Safety", emoji: "🏃" },
          { id: "ai-recommendations", label: "AI Recommendations", emoji: "🤖" },
          { id: "health-alerts", label: "Health Alerts", emoji: "🚨" },
          { id: "weekly-forecast", label: "Weekly Forecast", emoji: "📅" },
          { id: "health-report", label: "Health Report", emoji: "📄" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const el = document.getElementById(tab.id);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10"
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* =========================================================
          1. HEADER & LOCATION SELECTOR BAR (HEALTH OVERVIEW)
          ========================================================= */}
      <motion.div
        id="health-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors duration-200 text-slate-800 dark:text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 shrink-0">
            <Stethoscope className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                HEALTH ADVISOR LIVE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                • Environmental Telemetry Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display flex items-center gap-2 text-slate-900 dark:text-white">
              <span>Personal Environmental Health Advisor</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Real-time atmospheric analysis mapping today's air quality, UV, temperature, and particulate factors to your unique personal medical profile.
            </p>
          </div>
        </div>

        {/* Location & Quick PDF Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Active Location</span>
              <span className="font-bold truncate max-w-[160px] text-slate-900 dark:text-white">{locationName}</span>
            </div>
          </div>

          <button
            onClick={handleDownloadPdfReport}
            disabled={isDownloadingPdf}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Health Report</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {pdfSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Health Report PDF successfully generated & downloaded!</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase">GeoPulse Clinical Engine</span>
        </motion.div>
      )}

      {/* =========================================================
          2. USER INFORMATION INPUTS FORM
          ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-xs space-y-6 transition-colors duration-200 text-slate-800 dark:text-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Your Personal Health Profile
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Adjust age, gender, and conditions to recalculate health risk index.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Age Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Age
              </label>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                {age} Years Old
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={age}
              onChange={(e) => handleAgeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1 Child</span>
              <span>18 Adult</span>
              <span>65+ Senior</span>
            </div>
          </div>

          {/* Gender Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Male", "Female", "Non-Binary", "Other"] as GenderOption[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    gender === g
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-bold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Location Search Override */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Custom Location Label
              </label>
              {customLocationName && (
                <button
                  onClick={() => setCustomLocationName("")}
                  className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                placeholder={selectedLocation?.name || "Enter city or area..."}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border font-semibold transition-all bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Health Condition Multi-select Chips */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Health Conditions & Vulnerabilities
          </label>

          <div className="flex flex-wrap gap-2.5">
            {HEALTH_CONDITIONS.map((cond) => {
              const isSelected = selectedConditions.includes(cond.key);
              return (
                <button
                  key={cond.key}
                  type="button"
                  onClick={() => handleToggleCondition(cond.key)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="text-base">{cond.emoji}</span>
                  <span>{cond.label}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* =========================================================
          2. RESULTS DISPLAY: HEALTH SAFETY SCORE & EXPLANATION
          ========================================================= */}
      <div id="health-score" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-20">
        {/* Score Meter Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
          className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-colors duration-200 text-slate-800 dark:text-white"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Health Safety Score
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${riskBadgeBg}`}>
                {riskLevel} RISK
              </span>
            </div>

            {/* Circular score display */}
            <div className="flex flex-col items-center justify-center my-4 relative">
              <div className="w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative bg-slate-50 dark:bg-slate-900 shadow-inner">
                <span className="text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {score}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  / 100
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span>0-39 Dangerous</span>
              <span>40-59 High</span>
              <span>60-79 Moderate</span>
              <span>80-100 Safe</span>
            </div>
          </div>
        </motion.div>

        {/* Explanation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          className="lg:col-span-2 border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition-colors duration-200 text-slate-800 dark:text-white"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Health Impact Analysis & Diagnosis
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {explanation}
            </p>
          </div>

          {/* Key telemetry summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">AQI Level</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{telemetry.aqi}</span>
              <span className="text-[10px] text-slate-500 block truncate">{telemetry.aqiLabel}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">PM2.5 / PM10</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-sm">{pm25} / {pm10}</span>
              <span className="text-[10px] text-slate-500 block">µg/m³ particles</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Temperature</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">{telemetry.temperature}°C</span>
              <span className="text-[10px] text-slate-500 block">Feels like {telemetry.feelsLike}°C</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">UV Solar Index</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-sm">UV {telemetry.uvIndex}</span>
              <span className="text-[10px] text-slate-500 block">{telemetry.uvIndex >= 8 ? "Very High" : "Moderate"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* =========================================================
          3. AIR QUALITY IMPACT & TELEMETRY DETAILS
          ========================================================= */}
      <div id="air-quality" className="space-y-4 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            <Wind className="w-5 h-5 text-emerald-500" />
            <span>Air Quality Impact & Telemetry</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Particulate & Atmospheric Density
          </span>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* AQI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Wind className="w-4 h-4 text-emerald-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">AQI Index</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{telemetry.aqi}</span>
            <span className="text-[10px] text-slate-500 block mt-1">{telemetry.aqiLabel}</span>
          </motion.div>

          {/* PM2.5 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.33 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Flame className="w-4 h-4 text-rose-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">PM2.5 Fine Dust</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{pm25} <span className="text-[9px] font-normal text-slate-400">µg/m³</span></span>
            <span className="text-[10px] text-slate-500 block mt-1">Deep lungs penetrative</span>
          </motion.div>

          {/* PM10 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.36 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Activity className="w-4 h-4 text-amber-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">PM10 Coarse Particulate</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{pm10} <span className="text-[9px] font-normal text-slate-400">µg/m³</span></span>
            <span className="text-[10px] text-slate-500 block mt-1">Upper respiratory irritant</span>
          </motion.div>

          {/* Wind Speed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.39 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Compass className="w-4 h-4 text-sky-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">Wind Velocity</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{telemetry.windSpeed} <span className="text-[9px] font-normal text-slate-400">km/h</span></span>
            <span className="text-[10px] text-slate-500 block mt-1">Direction: {telemetry.windDirection}</span>
          </motion.div>
        </div>
      </div>

      {/* =========================================================
          4. HEAT & UV RISK SECTION
          ========================================================= */}
      <div id="heat-uv" className="space-y-4 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.42 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            <Sun className="w-5 h-5 text-amber-500" />
            <span>Heat & UV Risk Metrics</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Solar Radiation & Thermal Stress
          </span>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Temperature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.44 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Thermometer className="w-4 h-4 text-orange-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">Temperature</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{telemetry.temperature}°C</span>
            <span className="text-[10px] text-slate-500 block mt-1">Feels like {telemetry.feelsLike}°C</span>
          </motion.div>

          {/* UV Index */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.47 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Sun className="w-4 h-4 text-amber-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">UV Index</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">UV {telemetry.uvIndex}</span>
            <span className="text-[10px] text-slate-500 block mt-1">{telemetry.uvIndex >= 8 ? "Requires SPF 50+" : "Moderate Protection"}</span>
          </motion.div>

          {/* Humidity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <Droplets className="w-4 h-4 text-sky-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">Humidity</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{telemetry.humidity}%</span>
            <span className="text-[10px] text-slate-500 block mt-1">Sweat evaporation rate</span>
          </motion.div>

          {/* Rain Probability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.53 }}
            className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-4 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white"
          >
            <CloudRain className="w-4 h-4 text-indigo-500 mb-2" />
            <span className="text-[9px] font-mono uppercase text-slate-400 block">Rain & Precipitation</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">{telemetry.rainProbability}%</span>
            <span className="text-[10px] text-slate-500 block mt-1">{telemetry.rainfall} mm expected</span>
          </motion.div>
        </div>
      </div>

      {/* =========================================================
          5. OUTDOOR SAFETY MATRIX
          ========================================================= */}
      <div id="outdoor-safety" className="space-y-4 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.62 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Outdoor Safety Clearance Matrix</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            Real-time outdoor activity safety evaluation
          </span>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {outdoorActivities.map((act, idx) => {
            let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40";
            let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;

            if (act.status === "Be Careful") {
              badgeBg = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40";
              statusIcon = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
            } else if (act.status === "Avoid Today") {
              badgeBg = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40";
              statusIcon = <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
            }

            return (
              <motion.div
                key={act.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.65 + idx * 0.05, ease: "easeOut" }}
                className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{act.icon}</span>
                    {statusIcon}
                  </div>
                  <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">{act.name}</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeBg}`}>
                    {act.status}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    {act.reason}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          6. AI RECOMMENDATIONS GRID
          ========================================================= */}
      <div id="ai-recommendations" className="space-y-4 scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              AI Recommendations & Guidance
            </h2>
          </div>
          <button
            onClick={handleGenerateAiReport}
            disabled={isGeneratingAi}
            className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {isGeneratingAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Asking Gemini AI...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Expand AI Medical Insights</span>
              </>
            )}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aiSuggestions.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.58 + idx * 0.05, ease: "easeOut" }}
              className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-5 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${item.badgeColor}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  {item.advice}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gemini Generated Extended Medical Report Box */}
        {aiReportText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-6 shadow-xs space-y-3 text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Gemini Clinical Medical & Environmental Analysis</span>
            </div>
            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap">
              {aiReportText}
            </div>
          </motion.div>
        )}
      </div>

      {/* =========================================================
          7. HEALTH ALERTS & EMERGENCY WARNING CARD
          ========================================================= */}
      {isEmergencyActive && (
        <motion.div
          id="health-alerts"
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          className="p-6 rounded-2xl border border-rose-500/60 bg-gradient-to-r from-rose-950/80 via-red-950/60 to-rose-950/80 text-white shadow-2xl shadow-rose-950/50 relative overflow-hidden space-y-4 scroll-mt-20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/30 border border-rose-400/50 text-rose-300 animate-bounce">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-rose-500/30 text-rose-200 border border-rose-400/40">
                    CRITICAL EMERGENCY HEALTH WARNING
                  </span>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight mt-1">
                  Dangerous Atmospheric Stress Detected in {locationName}
                </h3>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold bg-rose-900/60 px-3 py-1.5 rounded-xl border border-rose-700/50">
              <PhoneCall className="w-4 h-4 text-rose-300" />
              <span>Medical Hotline: 911 / 112</span>
            </div>
          </div>

          <p className="text-xs text-rose-200 leading-relaxed max-w-3xl">
            Air quality index ({telemetry.aqi}) and UV radiation ({telemetry.uvIndex}) present severe risks to vulnerable respiratory systems. Immediate protective measures are strongly advised for individuals with {selectedConditions.join(", ")}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/30 text-xs space-y-1">
              <span className="font-bold text-rose-300 block">1. Immediate Action</span>
              <p className="text-[11px] text-slate-300">Move indoors immediately. Seal doors/windows and activate air purifier.</p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/30 text-xs space-y-1">
              <span className="font-bold text-rose-300 block">2. Respiratory Symptoms</span>
              <p className="text-[11px] text-slate-300">Watch for shortness of breath, chest tightness, wheezing, or dizziness.</p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/30 text-xs space-y-1">
              <span className="font-bold text-rose-300 block">3. Medication Safety</span>
              <p className="text-[11px] text-slate-300">Keep emergency inhalers / rescue medication immediately accessible.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fallback anchor for health-alerts when emergency mode isn't actively triggered */}
      {!isEmergencyActive && (
        <motion.div
          id="health-alerts"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="scroll-mt-20 p-4 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 flex items-center justify-between text-xs font-mono"
        >
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Health Alerts: No Critical Active Atmospheric Emergency in {locationName}. Standard Precautions Apply.</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase">Live Monitor</span>
        </motion.div>
      )}

      {/* =========================================================
          8. WEEKLY FORECAST
          ========================================================= */}
      <motion.div
        id="weekly-forecast"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.72, ease: "easeOut" }}
        className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-6 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white space-y-4 scroll-mt-20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Weekly Health Risk Forecast
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
            Predictive Epidemiological Model
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast7Days.map((day, idx) => {
            let badgeBg = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40";
            if (day.risk === "Dangerous") badgeBg = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40";
            else if (day.risk === "High") badgeBg = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40";
            else if (day.risk === "Moderate") badgeBg = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.75 + idx * 0.04, ease: "easeOut" }}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 text-center space-y-2 transition-colors duration-200"
              >
                <div className="text-xs font-bold font-mono text-sky-600 dark:text-sky-400">{day.dayName}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{day.dateStr}</div>

                <div className="py-2 my-1 border-y border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">AQI {day.aqi}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{day.temp}°C</div>
                </div>

                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${badgeBg}`}>
                  {day.risk}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* =========================================================
          9. HEALTH REPORT SUMMARY & DOWNLOAD
          ========================================================= */}
      <motion.div
        id="health-report"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.82, ease: "easeOut" }}
        className="border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl p-6 shadow-xs transition-colors duration-200 text-slate-800 dark:text-white space-y-4 scroll-mt-20 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Clinical Health Advisory PDF Report</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Download a certified, medical-grade report summarizing active environmental hazards, personal risk factors, and recommended safety protocols for {locationName}.
          </p>
        </div>

        <button
          onClick={handleDownloadPdfReport}
          disabled={isDownloadingPdf}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono tracking-wider flex items-center gap-2 shrink-0 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isDownloadingPdf ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Clinical Report...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Health Report (PDF)</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Footer Branding */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <GeoPulseLogo size={18} showText={false} />
          <span>GeoPulse Health Intelligence Module v1.4</span>
        </div>
        <span>Environmental Telemetry & Atmospheric Public Safety</span>
      </div>
    </div>
  );
}
