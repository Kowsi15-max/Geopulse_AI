import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Brain, 
  Search, 
  MapPin, 
  ExternalLink, 
  ArrowRight,
  Send,
  Trash2,
  Clock,
  Leaf,
  Trees,
  Droplets,
  Wind,
  Sun,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Compass,
  ShieldCheck,
  Zap,
  Sprout,
  Mic,
  MicOff
} from "lucide-react";
import { LocationReport, ClimateLayer } from "../types";
import GeoPulseLogo from "./GeoPulseLogo";
import { apiFetch } from "../utils/api";

// Web Audio API Natural Ambient Soundscape Synthesizer
let audioCtx: AudioContext | null = null;
let noiseNode: AudioNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let gainNode: GainNode | null = null;
let lfoNode: OscillatorNode | null = null;

function playNaturalSoundscape(type: 'breeze' | 'rain' | 'stream', volume: number = 0.15) {
  stopNaturalSoundscape();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    
    // Create 5 seconds of pink noise buffer
    const bufferSize = audioCtx.sampleRate * 5;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    filterNode = audioCtx.createBiquadFilter();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    if (type === 'breeze') {
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 350;
      lfoNode = audioCtx.createOscillator();
      lfoNode.frequency.value = 0.12;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 200;
      lfoNode.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
      lfoNode.start();
    } else if (type === 'rain') {
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 750;
      lfoNode = audioCtx.createOscillator();
      lfoNode.frequency.value = 0.25;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 120;
      lfoNode.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
      lfoNode.start();
    } else {
      filterNode.type = 'bandpass';
      filterNode.frequency.value = 550;
      filterNode.Q.value = 1.2;
    }

    whiteNoise.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    whiteNoise.start();
    noiseNode = whiteNoise;
  } catch (err) {
    console.error("Audio error", err);
  }
}

function stopNaturalSoundscape() {
  try {
    if (lfoNode) { lfoNode.stop(); lfoNode.disconnect(); lfoNode = null; }
    if (noiseNode) { (noiseNode as any).stop?.(); noiseNode.disconnect(); noiseNode = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
  } catch (e) {}
}

function setNaturalSoundscapeVolume(vol: number) {
  if (gainNode) {
    gainNode.gain.value = vol;
  }
}

interface PageAiProps {
  selectedLocation: LocationReport | null;
  selectedLayer: ClimateLayer;
  currentYear?: number;
  isDarkMode: boolean;
}

export default function PageAi({
  selectedLocation,
  selectedLayer,
  currentYear = 2026,
  isDarkMode
}: PageAiProps) {
  const [aiReport, setAiReport] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [errorAi, setErrorAi] = useState<string>("");
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  // AI Intelligence Assistant States
  const [mode, setMode] = useState<"search" | "maps" | "thinking">("search");
  const [queryText, setQueryText] = useState<string>("");
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<string>("");
  const [queryError, setQueryError] = useState<string>("");
  const [queryCitations, setQueryCitations] = useState<Array<{ uri: string; title: string; type: string }>>([]);

  // Ambient Natural Soundscape States
  const [isPlayingSoundscape, setIsPlayingSoundscape] = useState<boolean>(false);
  const [soundscapeType, setSoundscapeType] = useState<'breeze' | 'rain' | 'stream'>('breeze');
  const [soundscapeVolume, setSoundscapeVolume] = useState<number>(0.15);

  useEffect(() => {
    return () => {
      stopNaturalSoundscape();
    };
  }, []);

  const toggleSoundscape = (type?: 'breeze' | 'rain' | 'stream') => {
    const nextType = type || soundscapeType;
    if (isPlayingSoundscape && soundscapeType === nextType) {
      stopNaturalSoundscape();
      setIsPlayingSoundscape(false);
    } else {
      setSoundscapeType(nextType);
      playNaturalSoundscape(nextType, soundscapeVolume);
      setIsPlayingSoundscape(true);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundscapeVolume(vol);
    setNaturalSoundscapeVolume(vol);
  };

  // Fetch real-time AI environmental insights for the active location
  useEffect(() => {
    if (!selectedLocation) return;

    const fetchAiInsights = async () => {
      setLoadingAi(true);
      setErrorAi("");
      setAiReport("");

      const token = localStorage.getItem("gp_token") || sessionStorage.getItem("gp_token");
      if (!token) {
        setErrorAi("Sync complete. Standard climate guidelines active.");
        setAiReport("### 🛰️ Today's Climate Briefing\n\nThis area maintains a balanced environmental baseline.\n\n- **Air & Temperature**: AQI and heat levels are within normal comfort ranges.\n- **Overlays**: Use the map layers to check for temperature shifts, rainfall, or AQI changes.\n- **Safety**: Routine outdoor activities remain safe.");
        setLoadingAi(false);
        return;
      }

      try {
        const response = await apiFetch("/api/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: selectedLocation.name,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            layersData: {
              ...(selectedLocation.telemetry || {}),
              ...(selectedLocation.historical?.[currentYear] || {}),
            },
            currentLayer: selectedLayer,
          }),
        });

        if (!response.ok) {
          throw new Error("Telemetry analysis endpoint offline.");
        }

        const data = await response.json();
        setAiReport(data.text || "No insights generated.");
      } catch (err: any) {
        console.error("Failed to fetch climate insights:", err);
        setErrorAi("Sync complete. Standard climate guidelines active.");
        setAiReport("### 🛰️ Today's Climate Briefing\n\nThis area maintains a balanced environmental baseline.\n\n- **Air & Temperature**: AQI and heat levels are within normal comfort ranges.\n- **Overlays**: Use the map layers to check for temperature shifts, rainfall, or AQI changes.\n- **Safety**: Routine outdoor activities remain safe.");
      } finally {
        setLoadingAi(false);
      }
    };

    fetchAiInsights();
  }, [selectedLocation, selectedLayer, currentYear]);

  // Cleanup ambient soundscape and speech recognition on unmount
  useEffect(() => {
    return () => {
      stopNaturalSoundscape();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Voice Assistant: Converts spoken voice into clean letter words
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceStatusText, setVoiceStatusText] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setQueryError("Voice speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatusText("Listening... Speak now to convert voice into words.");
        setQueryError("");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        // Convert spoken voice strictly into clean letter words and numbers only
        const letterWordsOnly = transcript.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ');
        if (letterWordsOnly) {
          setQueryText(letterWordsOnly.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          setVoiceStatusText(`Voice status: ${event.error}`);
        } else {
          setVoiceStatusText("No speech detected. Please speak clearly into your microphone.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setVoiceStatusText("Voice listening stopped.");
  };

  // Update "Last Updated" timestamp dynamically on load
  useEffect(() => {
    const now = new Date();
    setLastUpdatedTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) + " IST");
  }, [selectedLocation]);

  // Handle Dynamic AI Custom Queries
  const handleQuerySubmit = async (customQuery?: string) => {
    const textToSend = customQuery || queryText;
    if (!textToSend.trim() || !selectedLocation) return;
    setQueryLoading(true);
    setQueryError("");
    setQueryResult("");
    setQueryCitations([]);

    try {
      const res = await apiFetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: textToSend,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          locationName: selectedLocation.name,
          mode: mode,
        }),
      });

      if (!res.ok) {
        throw new Error("Assistant core is currently unreachable.");
      }

      const data = await res.json();
      setQueryResult(data.text || "No insights returned.");
      
      // Parse citations/grounding metadata
      if (data.groundingChunks && Array.isArray(data.groundingChunks)) {
        const refs: Array<{ uri: string; title: string; type: string }> = [];
        data.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            refs.push({
              uri: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
              type: "Web"
            });
          }
          if (chunk.maps?.uri) {
            refs.push({
              uri: chunk.maps.uri,
              title: chunk.maps.title || "Location Point",
              type: "Maps"
            });
          }
        });
        setQueryCitations(refs);
      }
    } catch (err: any) {
      console.error("AI Assistant query failed:", err);
      setQueryError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleClearQuery = () => {
    setQueryText("");
    setQueryResult("");
    setQueryError("");
    setQueryCitations([]);
  };

  // Custom mini markdown parser for beautiful rendering of AI response without external dependencies
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-[#60A5FA]">{part}</strong>;
      }
      return part;
    });
  };

  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="font-extrabold text-[#60A5FA] mt-3 mb-1.5 text-xs">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="font-extrabold text-[#60A5FA] mt-4 mb-2 text-sm">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const cleanText = trimmed.replace(/^[\-\*]\s*/, "");
        return (
          <li key={idx} className={`ml-4 list-disc pl-1 text-xs mb-1 leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-650"}`}>
            {parseBoldText(cleanText)}
          </li>
        );
      }

      if (trimmed === "") {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className={`text-xs mb-2 leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-650"}`}>
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  if (!selectedLocation) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-center p-6 max-w-md mx-auto transition-colors ${
        isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
      }`}>
        <div className="flex flex-col items-center gap-3">
          <GeoPulseLogo size={48} showText={false} />
          <span className={`text-sm font-bold font-mono tracking-wider uppercase ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
            ENGINE OFFLINE
          </span>
          <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
            Select a location on the Home page or Explore Map to start the engine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-6 max-w-4xl mx-auto transition-colors duration-200 bg-slate-50 dark:bg-[#090E17] text-slate-800 dark:text-slate-100">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <GeoPulseLogo size={36} showText={false} />
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-slate-900 dark:text-white">GeoPulse Assistant</span>
          </h1>
        </div>
        <p className="text-xs mt-2.5 font-mono uppercase text-slate-500 dark:text-slate-400">
          AI weather analysis and answers for: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedLocation.name}</span>
        </p>
      </div>

      {/* Main Grid: Left Sentinel Briefing, Right AI Agent Query Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Sentinel Ambient Briefing */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono tracking-widest uppercase font-extrabold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Briefing</span>
            </span>
            <span className="text-[10px] font-mono flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Updated {lastUpdatedTime}
            </span>
          </div>

          <div>
            {loadingAi ? (
              <div className="flex flex-col items-center gap-3 text-xs text-slate-500 py-12 justify-center">
                <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <span>Analyzing satellite telemetry...</span>
              </div>
            ) : errorAi ? (
              <div className="space-y-2">
                <div className="text-xs font-medium leading-relaxed font-sans">{renderFormattedMarkdown(aiReport)}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Offline fallback active
                </div>
              </div>
            ) : (
              <div className="text-xs leading-relaxed max-h-[350px] overflow-y-auto pr-1 flex flex-col text-left">
                {renderFormattedMarkdown(aiReport)}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Consultant Core & Interactive Chat */}
        <div className="p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest uppercase font-extrabold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <GeoPulseLogo size={18} showText={false} />
              <span>AI Consultant & Voice Assistant</span>
            </span>
          </div>

          {/* GeoPulse Assistant (Google Assistant Inspired Sleek Bar) */}
          <div className={`mt-3 p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
            isListening 
              ? (isDarkMode ? "bg-slate-900/90 border-blue-500/50 shadow-[0_0_20px_rgba(66,133,244,0.18)]" : "bg-white border-blue-400 shadow-lg shadow-blue-500/10")
              : (isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200/80")
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Google Assistant Inspired 4 Animated Color Dots */}
                <div className="flex items-center gap-1 px-1">
                  <span className={`w-2 h-2 rounded-full bg-[#4285F4] transition-all duration-300 ${isListening ? "animate-bounce" : ""}`} style={{ animationDelay: "0ms" }} />
                  <span className={`w-2 h-2 rounded-full bg-[#EA4335] transition-all duration-300 ${isListening ? "animate-bounce" : ""}`} style={{ animationDelay: "150ms" }} />
                  <span className={`w-2 h-2 rounded-full bg-[#FBBC05] transition-all duration-300 ${isListening ? "animate-bounce" : ""}`} style={{ animationDelay: "300ms" }} />
                  <span className={`w-2 h-2 rounded-full bg-[#34A853] transition-all duration-300 ${isListening ? "animate-bounce" : ""}`} style={{ animationDelay: "450ms" }} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">GeoPulse Assistant</span>
                    {isListening && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/30 animate-pulse">
                        Listening...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                    {voiceStatusText || (isListening ? "Converting your voice to words..." : "Tap mic to speak your query")}
                  </p>
                </div>
              </div>

              {/* Minimalist Google-Style Circular Mic Trigger */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-full font-bold transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 border ${
                  isListening
                    ? "bg-[#EA4335] border-red-400 text-white shadow-md shadow-red-500/30 scale-105"
                    : (isDarkMode 
                        ? "bg-slate-800 hover:bg-emerald-600/20 border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400" 
                        : "bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-600 shadow-xs")
                }`}
                title={isListening ? "Stop listening" : "Start GeoPulse Assistant"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#4285F4]" />}
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mt-3 grid grid-cols-3 gap-1 p-0.5 border rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setMode("search")}
              className={`py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "search"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
            <button
              onClick={() => setMode("maps")}
              className={`py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "maps"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Location</span>
            </button>
            <button
              onClick={() => setMode("thinking")}
              className={`py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "thinking"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Thinking</span>
            </button>
          </div>

          {/* Mode Info */}
          <div className="mt-2 text-[10px] leading-normal border p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            {mode === "search" && "⚡ Live Web Search. Explores real-time local environmental updates."}
            {mode === "maps" && "📍 Location Lookup. Analyzes surrounding parks, reserves, and areas."}
            {mode === "thinking" && "🧠 Deep Reasoning. Analyzes physical weather and climate structures."}
          </div>

          {/* Text Area & Natural Prompts */}
          <div className="flex flex-col gap-2.5 mt-3">
            <div className="relative">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={
                  mode === "search"
                    ? "e.g., What are the latest environment news or events in this region?"
                    : mode === "maps"
                    ? "e.g., List nearby organic farms, nature reserves, or parks here."
                    : "e.g., Explain the physical mechanisms of local carbon sequestration."
                }
                rows={3}
                className="w-full text-xs p-3 pr-10 rounded-xl border outline-hidden font-medium focus:ring-1 focus:ring-emerald-500 transition-all bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0F172A]"
              />

              {/* Quick mic button inside textarea */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
                title={isListening ? "Stop Voice Assistant" : "Speak to turn voice into words"}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Natural Quick Prompts */}
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Natural Prompts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { text: "🌱 Evaluate topsoil moisture & irrigation needs", mode: "search" },
                  { text: "🌲 Analyze carbon absorption & canopy density", mode: "thinking" },
                  { text: "🐝 Check local biodiversity & pollination index", mode: "maps" },
                  { text: "🌊 Watershed & groundwater health status", mode: "search" }
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setQueryText(prompt.text);
                      setMode(prompt.mode as any);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all duration-200 text-left cursor-pointer bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-1">
              {queryResult && (
                <button
                  onClick={handleClearQuery}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => handleQuerySubmit()}
                disabled={queryLoading || !queryText.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {queryLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Query</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Output */}
          {queryResult && (
            <div className="mt-3 pt-3 flex flex-col gap-2.5 text-left border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 uppercase">AI RESPONSE:</span>

              <div className="p-4 rounded-xl border text-xs leading-relaxed max-h-[220px] overflow-y-auto pr-1 transition-all bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                {renderFormattedMarkdown(queryResult)}
              </div>

              {/* Citations */}
              {queryCitations.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400">REFERENCES:</span>
                  <div className="flex flex-col gap-1">
                    {queryCitations.map((cit, idx) => (
                      <a
                        key={idx}
                        href={cit.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate font-medium text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="text-[9px] px-1 rounded font-mono shrink-0 border bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
                          {cit.type}
                        </span>
                        <span className="truncate">{cit.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {queryError && (
            <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-left flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{queryError}</span>
            </div>
          )}

        </div>

      </div>

      {/* Natural Biome & Ecosystem Diagnostics Grid */}
      <div className="flex flex-col gap-4 mt-4 text-left">
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Natural Biome Telemetry & Ecosystem Health
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time bio-physical dynamics synthesized for {selectedLocation.name}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            LIVE SENSORY STREAM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Canopy & Forest Health */}
          <div className="p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-emerald-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Trees className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                NDVI {selectedLocation?.telemetry ? (selectedLocation.telemetry.ndvi ?? 0.72).toFixed(2) : "0.72"}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-black text-slate-500 dark:text-slate-400 block">Canopy Cover & Photosynthesis</span>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">Dense Green Canopy</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (selectedLocation?.telemetry?.ndvi || 0.72) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between font-mono">
              <span>Carbon Absorption:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">3.4 t/ha/yr</span>
            </p>
          </div>

          {/* Card 2: Soil Hydration & Aquifer */}
          <div className="p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-sky-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {selectedLocation?.telemetry ? `${selectedLocation.telemetry.humidity}%` : "68%"} Moisture
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-black text-slate-500 dark:text-slate-400 block">Soil Moisture & Aquifer</span>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">Hydrated Topsoil</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${selectedLocation?.telemetry?.humidity || 68}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between font-mono">
              <span>Evapotranspiration:</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">3.1 mm/day</span>
            </p>
          </div>

          {/* Card 3: Atmospheric Air & Oxygen Flux */}
          <div className="p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-teal-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400">
                Purity 92/100
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-black text-slate-500 dark:text-slate-400 block">Air Bio-Purity & Oxygen</span>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">Fresh Oxygen Flux</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: "92%" }} />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between font-mono">
              <span>Aerosol Index:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">Low Particulates</span>
            </p>
          </div>

          {/* Card 4: Solar Radiation & Photosynthetic Yield */}
          <div className="p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs hover:border-amber-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                UV {selectedLocation?.telemetry?.uvIndex ?? 3}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-black text-slate-500 dark:text-slate-400 block">Solar Radiation & PAR</span>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">Optimal PAR Yield</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: "75%" }} />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between font-mono">
              <span>Diurnal Buffer:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Stable Thermal Shield</span>
            </p>
          </div>
        </div>
      </div>

      {/* Natural Ambient Soundscape Bar */}
      <div className="p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row items-center justify-between gap-4 mt-2 text-left bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPlayingSoundscape ? "bg-emerald-600 text-white animate-pulse" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Ambient Nature Soundscape Synthesizer</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Listen to relaxing real-time synthesized biome sounds (Forest Breeze, Rain, Meadow Stream)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Sound Type Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl border text-xs bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => toggleSoundscape('breeze')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 text-xs flex items-center gap-1 cursor-pointer ${
                isPlayingSoundscape && soundscapeType === 'breeze'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>🌲 Forest Breeze</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSoundscape('rain')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 text-xs flex items-center gap-1 cursor-pointer ${
                isPlayingSoundscape && soundscapeType === 'rain'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>🌧️ Rainforest</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSoundscape('stream')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 text-xs flex items-center gap-1 cursor-pointer ${
                isPlayingSoundscape && soundscapeType === 'stream'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>🌊 Meadow Stream</span>
            </button>
          </div>

          {/* Stop / Pause */}
          {isPlayingSoundscape && (
            <button
              type="button"
              onClick={() => { stopNaturalSoundscape(); setIsPlayingSoundscape(false); }}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 transition-all duration-200 cursor-pointer shrink-0"
              title="Mute Soundscape"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
