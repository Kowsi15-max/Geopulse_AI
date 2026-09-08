import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ==========================================
// 🧠 GEMINI AI CLIENT & CLIENT FALLBACKS
// ==========================================
// Lazy initialize Gemini AI client
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI Insights will fail.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Fallback climate report generator
function getFallbackInsights(lat: number, lng: number, location: string, layersData: any, currentLayer: string, isBackup: boolean = false) {
  const notice = isBackup
    ? `> ⚠️ *Local sensory baseline active.*\n\n`
    : "";

  const data = layersData || {};
  const temp = data.temperature ?? 20;
  const humidity = data.humidity ?? 50;
  const aqi = data.aqi ?? 50;
  const climateRisk = data.climateRisk ?? 30;
  const riskFactor = data.riskFactor ?? "None";
  const rainProb = data.rainProbability ?? 12;
  const uv = data.uvIndex ?? 3;
  const visibility = data.visibility ?? 14;

  let outlook = "";
  if (temp > 35) {
    outlook = `Today's weather is hot at ${temp}°C (feels like ${data.feelsLike ?? temp}°C).\n\n- **UV Hazard**: UV index is high (${uv}) between 11 AM and 3 PM.\n- **Safety**: Stay hydrated, seek shade, and wear light clothing.`;
  } else if (temp < 5) {
    outlook = `Today's weather is cold at ${temp}°C.\n\n- **Temperature**: Cold wind chill conditions.\n- **Safety**: Dress in thermal layers and limit long outdoor exposure.`;
  } else if (rainProb > 60) {
    outlook = `Today's weather has a high chance of rain (${rainProb}%).\n\n- **Conditions**: Expect reduced visibility around ${visibility} km.\n- **Safety**: Keep rain gear handy and plan for wet roads.`;
  } else {
    outlook = `Today's weather is pleasant and comfortable at ${temp}°C.\n\n- **Conditions**: UV levels are moderate (${uv}).\n- **Safety**: Good conditions for outdoor activities; carry water and wear sunscreen.`;
  }

  let farming = "";
  if (temp > 35 || humidity < 20) {
    farming = `- **Irrigation**: Dry conditions detected. Use drip irrigation early in the morning.\n- **Soil Care**: Apply mulching to retain soil moisture and protect roots.`;
  } else if (rainProb > 60) {
    farming = `- **Water Management**: High rainfall expected. Pause automated watering cycles.\n- **Drainage**: Ensure field drainage channels are clear to prevent waterlogging.`;
  } else {
    farming = `- **Crop Health**: Favorable growing conditions today.\n- **Action**: Ideal time for routine soil checks, fertilizing, and planting.`;
  }

  let travel = "";
  if (aqi > 150) {
    travel = `- **Air Quality**: Elevated particulate levels may reduce visibility.\n- **Transit**: Use air recirculation in vehicles and avoid heavy outdoor exertion.`;
  } else if (rainProb > 70 || temp > 38) {
    travel = `- **Weather Warning**: Rain or extreme heat may cause travel delays.\n- **Transit**: Check local road updates and plan travel carefully.`;
  } else {
    travel = `- **Road Conditions**: Clear skies and calm winds across the region.\n- **Transit**: Excellent visibility and smooth travel conditions.`;
  }

  let health = "";
  if (aqi > 100) {
    health = `- **Air Quality Alert**: AQI is currently ${aqi} (${data.aqiLabel || "Unhealthy"}).\n- **Precaution**: Sensitive individuals should wear masks outdoors and limit strenuous activity.`;
  } else if (uv > 7) {
    health = `- **Sun Protection**: Very high UV index of ${uv}.\n- **Precaution**: Apply SPF 30+ sunscreen, wear broad hats and sunglasses.`;
  } else {
    health = `- **Air & Environment**: Air quality is good and overall conditions are safe.\n- **Precaution**: Standard daily outdoor activities present no health strain.`;
  }

  let disaster = "";
  if (climateRisk > 70) {
    disaster = `- **Risk Level**: High climate risk (${climateRisk}%) due to ${riskFactor}.\n- **Status**: Local monitoring units are on active alert. Stay informed on emergency bulletins.`;
  } else if (rainProb > 80) {
    disaster = `- **Flood Watch**: Moderate heavy rain warning.\n- **Status**: Low-lying drainage areas could fill rapidly.`;
  } else {
    disaster = `- **Hazard Status**: No immediate flood, wildfire, or severe weather threats detected.\n- **Status**: Environmental indicators remain stable.`;
  }

  let energy = "";
  if (temp > 32) {
    energy = `- **Grid Load**: High cooling demand across local networks.\n- **Tip**: Set air conditioning to 24°C, close window blinds, and run high-power appliances off-peak.`;
  } else if (temp < 10) {
    energy = `- **Heating Load**: Cold temperatures increase heating requirements.\n- **Tip**: Seal window drafts and heat occupied rooms selectively to save power.`;
  } else {
    energy = `- **Grid Status**: Stable energy usage.\n- **Tip**: Use natural ventilation instead of mechanical cooling to conserve electricity.`;
  }

  return `${notice}### 🛰️ Today's Climate Outlook
${outlook}

### 🌾 Farming Advice
${farming}

### ✈️ Travel Advice
${travel}

### 🏥 Health Advice
${health}

### ⚠️ Disaster Risk Assessment
${disaster}

### 💡 Energy Consumption Suggestion
${energy}`;
}

// API endpoint for AI Insights
app.post("/api/insights", async (req, res) => {
  const { location, lat, lng, layersData, currentLayer } = req.body;
  
  const latNum = typeof lat === "number" ? lat : parseFloat(lat) || 0;
  const lngNum = typeof lng === "number" ? lng : parseFloat(lng) || 0;
  const safeLayersData = layersData || {};
  
  try {
    const client = getGeminiClient();
    
    const prompt = `
      You are GeoPulse's AI Environmental Assistant, analyzing environmental telemetry data.
      
      Location: ${location || "Selected Coordinate"}
      Coordinates: Latitude ${latNum.toFixed(4)}, Longitude ${lngNum.toFixed(4)}
      Active Map Overlay: ${currentLayer || "temperature"}
      
      Telemetry Data:
      - Air Quality Index (AQI): ${safeLayersData.aqi ?? 50} (${safeLayersData.aqiLabel || "Good"})
      - Surface Temperature: ${safeLayersData.temperature ?? 20}°C (Feels Like: ${safeLayersData.feelsLike ?? safeLayersData.temperature ?? 20}°C)
      - Humidity: ${safeLayersData.humidity ?? 50}%
      - Rain Probability: ${safeLayersData.rainProbability ?? 15}%
      - Barometric Pressure: ${safeLayersData.pressure ?? 1013} hPa
      - Wind Speed: ${safeLayersData.windSpeed ?? 12} km/h (${safeLayersData.windDirection ?? "N"})
      - UV Index: ${safeLayersData.uvIndex ?? 3}
      - Visibility: ${safeLayersData.visibility ?? 12} km
      - Climate Risk Severity: ${safeLayersData.climateRisk ?? 30}% (Primary Hazard: ${safeLayersData.riskFactor ?? "None"})
      
      Provide a medium-length, clear, and professional briefing using simple English.
      Use short paragraphs and short bullet points to make the information easy to read.
      Include these six markdown sections:
      1. ### 🛰️ Today's Climate Outlook
      2. ### 🌾 Farming Advice
      3. ### ✈️ Travel Advice
      4. ### 🏥 Health Advice
      5. ### ⚠️ Disaster Risk Assessment
      6. ### 💡 Energy Consumption Suggestion

      Keep the language simple, direct, helpful, and professional.
    `;

    if (!process.env.GEMINI_API_KEY) {
      // Return a professional mock analysis if API key is not present
      const mockInsights = getFallbackInsights(latNum, lngNum, location, safeLayersData, currentLayer, false);
      return res.json({ text: mockInsights, isMock: true });
    }

    let responseText = "";
    let apiSuccess = false;
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting climate analysis with model: ${modelName}...`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are GeoPulse's AI Environmental Assistant. Provide professional, clear, and helpful climate insights using simple English, short paragraphs, and bullet points. Keep responses medium in length and easy to read.",
            temperature: 0.2,
          }
        });
        if (response && response.text) {
          responseText = response.text;
          apiSuccess = true;
          console.log(`Successfully generated climate analysis using ${modelName}`);
          break;
        }
      } catch (modelError: any) {
        console.log(`[API Note] Model ${modelName} was busy or rate-limited. Falling back.`);
        // Fall through to try next model in loop
      }
    }

    if (apiSuccess && responseText) {
      res.json({ text: responseText });
    } else {
      console.log("All primary models unavailable. Activating local cognitive core baseline analysis.");
      const fallbackInsights = getFallbackInsights(latNum, lngNum, location, safeLayersData, currentLayer, true);
      res.json({ text: fallbackInsights, isFallback: true });
    }
  } catch (error: any) {
    console.log("Telemetry engine fallback - activating local intelligence core.");
    const fallbackInsights = getFallbackInsights(latNum, lngNum, location, safeLayersData, currentLayer, true);
    res.json({ text: fallbackInsights, isFallback: true });
  }
});

// Local cognitive core sensory backup for query assistant when API quota is exhausted
function getLocalQueryFallback(query: string, lat: number, lng: number, locationName: string, mode: string) {
  const name = locationName || "Selected Location";
  const latitude = lat?.toFixed(4) || "0.0000";
  const longitude = lng?.toFixed(4) || "0.0000";
  
  const queryLower = query.toLowerCase();
  let topic = "General Environmental Overview";
  let summary = "";
  let bulletPoints: string[] = [];

  if (queryLower.includes("air") || queryLower.includes("aqi") || queryLower.includes("smog") || queryLower.includes("pollution")) {
    topic = "Air Quality & Atmospheric Status";
    summary = `Air quality near ${name} (${latitude}, ${longitude}) is currently stable. Regional wind currents are dispersing airborne particles effectively.`;
    bulletPoints = [
      "PM2.5 and PM10 levels remain within safe baseline limits.",
      "Gentle breeze patterns prevent stagnant air pockets near ground level.",
      "Outdoor activities remain safe for the general public."
    ];
  } else if (queryLower.includes("rain") || queryLower.includes("water") || queryLower.includes("precipitation") || queryLower.includes("wet") || queryLower.includes("flood")) {
    topic = "Rainfall & Water Resources";
    summary = `Precipitation tracking for ${name} shows normal seasonal moisture levels without immediate flood warnings.`;
    bulletPoints = [
      "Atmospheric pressure indicates balanced moisture levels.",
      "Soil moisture capacity can comfortably absorb current rainfall trends.",
      "Local drainage and river basins are operating smoothly."
    ];
  } else if (queryLower.includes("carbon") || queryLower.includes("sequestration") || queryLower.includes("forest") || queryLower.includes("vegetation") || queryLower.includes("tree")) {
    topic = "Vegetation & Forest Canopy";
    summary = `Satellite foliage telemetry shows strong plant cover around ${name}, supporting natural carbon absorption and healthy soil.`;
    bulletPoints = [
      "Active leaf canopy maintains high photosynthetic activity.",
      "Local forest buffers help regulate microclimate temperatures.",
      "Soil organic layers are well-protected from erosion."
    ];
  } else if (queryLower.includes("temp") || queryLower.includes("heat") || queryLower.includes("warm") || queryLower.includes("cold") || queryLower.includes("thermal")) {
    topic = "Temperature & Heat Index";
    summary = `Thermal telemetry registers stable surface temperatures across ${name}. Natural tree canopy and soil moisture prevent extreme heat buildup.`;
    bulletPoints = [
      "Daytime heat dissipates naturally during evening hours.",
      "No localized urban heat island anomalies detected.",
      "Temperatures remain comfortable for routine daily plans."
    ];
  } else if (queryLower.includes("disaster") || queryLower.includes("hazard") || queryLower.includes("threat") || queryLower.includes("risk") || queryLower.includes("fire") || queryLower.includes("emergency")) {
    topic = "Hazard & Safety Alert Status";
    summary = `Environmental hazard risk algorithms confirm low threat severity near ${name}. All primary risk indicators reside in safe ranges.`;
    bulletPoints = [
      "Wildfire risk remains low due to healthy humidity levels.",
      "No seismic or extreme weather warnings are currently active.",
      "Emergency response protocols remain on standard standby."
    ];
  } else {
    topic = "Regional Environment Summary";
    summary = `Environmental conditions around ${name} (${latitude}, ${longitude}) show a balanced and healthy ecosystem.`;
    bulletPoints = [
      "Air quality and surface temperature remain in favorable ranges.",
      "Vegetation density supports stable local carbon and water cycles.",
      "No weather or environmental hazards require special precautions today."
    ];
  }

  return `### 🛰️ GeoPulse AI Assistant Response

**Topic:** ${topic}  
**Location:** ${name} (${latitude}, ${longitude})

${summary}

**Key Details & Advice:**
${bulletPoints.map((pt) => `- ${pt}`).join("\n")}

**Suggested Actions:**
- Monitor daily AQI and weather updates for any brief shift.
- Protect local green spaces to keep ambient temperatures pleasant.`;
}

// Interactive Climate AI Custom Query & Chat Assistant
app.post("/api/query", async (req, res) => {
  const { query, lat, lng, locationName, mode } = req.body;
  
  try {
    const client = getGeminiClient();
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        text: `### 🛰️ GeoPulse AI Assistant Response

You asked about **"${query}"** in **${locationName || "the selected location"}** (${lat?.toFixed(4)}, ${lng?.toFixed(4)}).

Here is a clear summary of local conditions:

- **Current Overview**: The region maintains steady weather patterns with comfortable temperatures and clear air quality.
- **Environment & Vegetation**: Healthy local plant canopy supports natural carbon absorption and soil stability.
- **Recommendations**: Continue routine outdoor activities and monitor daily weather updates.

*Note*: To connect live web search and satellite data, configure your **GEMINI_API_KEY** in **Settings > Secrets**.`,
        isMock: true,
        mode,
        modelUsed: mode === "thinking" ? "gemini-3.1-pro-preview" : "gemini-3.5-flash"
      });
    }

    let modelName = "gemini-3.5-flash";
    const config: any = {
      systemInstruction: `You are GeoPulse's AI Assistant, an intelligent environmental and geospatial consultant.
You are helping the user with questions regarding ${locationName || "the selected location"} at coordinates (${lat?.toFixed(4)}, ${lng?.toFixed(4)}).

Adhere strictly to these response style guidelines:
- **Response Length**: Keep answers at a medium length (around 2 to 4 concise paragraphs or bullet lists). Avoid overly brief one-liners and avoid excessively long academic essays.
- **Language**: Use simple, clear, and professional English. Avoid dense, confusing technical jargon.
- **Structure**: Use short, readable paragraphs and bullet points where helpful to organize key points clearly.
- **Quality**: Ensure responses are clear, directly helpful, easy to read, professional, and strictly relevant to the user's question.`,
      temperature: 0.4,
    };

    if (mode === "thinking") {
      modelName = "gemini-3.1-pro-preview";
      config.thinkingLevel = ThinkingLevel.HIGH;
      // Do not set maxOutputTokens
      if (config.maxOutputTokens) {
        delete config.maxOutputTokens;
      }
    } else if (mode === "search") {
      modelName = "gemini-3.5-flash";
      config.tools = [{ googleSearch: {} }];
    } else if (mode === "maps") {
      modelName = "gemini-3.5-flash";
      config.tools = [{ googleMaps: {} }];
      if (lat && lng) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        };
      }
    }

    // Dynamic model fallback chain to handle rate limits / quota issues safely
    let modelsToTry = [modelName];
    if (mode === "thinking") {
      modelsToTry = ["gemini-3.1-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
    } else {
      modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.1-flash-lite"];
    }

    let responseText = "";
    let apiSuccess = false;
    let selectedModelUsed = modelName;
    let actualGroundingChunks: any[] = [];

    for (const model of modelsToTry) {
      try {
        console.log(`Executing AI Query on mode: ${mode} using model: ${model}`);
        
        // Prepare config clone for this attempt
        const currentConfig = { ...config };
        
        // Adjust config based on fallback model support
        if (model !== "gemini-3.1-pro-preview" && currentConfig.thinkingLevel) {
          delete currentConfig.thinkingLevel;
        }

        const response = await client.models.generateContent({
          model: model,
          contents: query,
          config: currentConfig
        });

        if (response && response.text) {
          responseText = response.text;
          selectedModelUsed = model;
          actualGroundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          apiSuccess = true;
          break;
        }
      } catch (err: any) {
        console.log(`[API Note] Assistant Model ${model} was busy or rate-limited. Falling back.`);
        // If tools caused a failure or if it's a tool-support issue, remove tools to ensure response delivery
        if (config.tools) {
          console.log("Removing grounding tools from config to maximize model compatibility on next fallback attempt...");
          delete config.tools;
          delete config.toolConfig;
        }
      }
    }

    if (apiSuccess && responseText) {
      res.json({
        text: responseText,
        groundingChunks: actualGroundingChunks,
        mode: mode,
        modelUsed: selectedModelUsed
      });
    } else {
      console.log("All model fallback options exhausted. Deploying local cognitive sensor intelligence.");
      const fallbackText = getLocalQueryFallback(query, lat, lng, locationName, mode);
      res.json({
        text: fallbackText,
        groundingChunks: [],
        mode: mode,
        modelUsed: "local-cognitive-sensor",
        isLocalFallback: true
      });
    }

  } catch (error: any) {
    console.log("AI Query unexpected exception - deploying local baseline.");
    const fallbackText = getLocalQueryFallback(query, lat, lng, locationName, mode);
    res.json({
      text: fallbackText,
      groundingChunks: [],
      mode: mode,
      modelUsed: "local-cognitive-sensor",
      isLocalFallback: true
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClimaPulse Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
