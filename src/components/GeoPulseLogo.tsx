import React from "react";

interface GeoPulseLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  lightBg?: boolean;
  customText?: string;
}

export default function GeoPulseLogo({
  className = "",
  size = 36,
  showText = true,
  textClassName = "text-xl font-black font-sans",
  lightBg = false,
  customText
}: GeoPulseLogoProps) {
  // Determine text display parts
  const textToRender = customText || "GeoPulse AI";
  const hasGeoPulse = textToRender.toLowerCase().includes("geopulse");
  const hasAi = textToRender.toLowerCase().includes("ai");

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 
        Brand-New High-Contrast Precision Vector Mark:
        Global Latitude/Meridian Mesh + Central AI Node + Orbit Boundaries
      */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_2px_10px_rgba(34,211,238,0.25)]"
      >
        {/* Outer planetary ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="url(#gpRingGrad)"
          strokeWidth="3.5"
          strokeOpacity="1"
        />

        {/* Vertical Meridian curves */}
        <path
          d="M 50 12 Q 28 50 50 88"
          stroke="url(#gpPulseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
          fill="none"
        />
        <path
          d="M 50 12 Q 72 50 50 88"
          stroke="url(#gpPulseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
          fill="none"
        />

        {/* Latitude flows */}
        <path
          d="M 12 50 Q 50 20 88 50"
          stroke="url(#gpPulseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.85"
          fill="none"
        />
        <path
          d="M 12 50 Q 50 80 88 50"
          stroke="url(#gpPulseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.85"
          fill="none"
        />

        {/* Connecting neural telemetry lines */}
        <line
          x1="50"
          y1="12"
          x2="50"
          y2="38"
          stroke="url(#gpCoreGrad)"
          strokeWidth="2.5"
          strokeDasharray="3 3"
          strokeOpacity="0.9"
        />
        <line
          x1="50"
          y1="62"
          x2="50"
          y2="88"
          stroke="url(#gpCoreGrad)"
          strokeWidth="2.5"
          strokeDasharray="3 3"
          strokeOpacity="0.9"
        />
        <line
          x1="12"
          y1="50"
          x2="38"
          y2="50"
          stroke="url(#gpCoreGrad)"
          strokeWidth="2.5"
          strokeDasharray="3 3"
          strokeOpacity="0.9"
        />
        <line
          x1="62"
          y1="50"
          x2="88"
          y2="50"
          stroke="url(#gpCoreGrad)"
          strokeWidth="2.5"
          strokeDasharray="3 3"
          strokeOpacity="0.9"
        />

        {/* Central AI core node */}
        <rect
          x="37"
          y="37"
          width="26"
          height="26"
          rx="7"
          transform="rotate(45 50 50)"
          fill="url(#gpCoreGrad)"
          stroke="#06B6D4"
          strokeWidth="1.5"
        />

        {/* Precision coordinate core dot */}
        <circle
          cx="50"
          cy="50"
          r="5"
          fill="#FFFFFF"
        />

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="gpRingGrad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="gpPulseGrad" x1="12" y1="50" x2="88" y2="50">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="gpCoreGrad" x1="37" y1="37" x2="63" y2="63">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand typography with vibrant colors and professional AI status indicator */}
      {showText && (
        <div className="flex items-center gap-2 shrink-0">
          <span className={`${textClassName} tracking-tight leading-none`}>
            {hasGeoPulse ? (
              <>
                <span className={lightBg ? "text-slate-900 font-black" : "text-white font-black"}>
                  Geo
                </span>
                <span className={lightBg ? "bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent font-black" : "bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent font-black drop-shadow-sm"}>
                  Pulse
                </span>
              </>
            ) : (
              <span className={lightBg ? "text-slate-900 font-black" : "text-white font-black"}>
                {textToRender.replace(/\s*ai\s*/i, "")}
              </span>
            )}
          </span>
          {hasAi && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold tracking-widest uppercase border leading-none transition-all ${
              lightBg 
                ? "bg-cyan-50/90 border-cyan-200 text-cyan-800 shadow-xs" 
                : "bg-cyan-950/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span>AI</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

