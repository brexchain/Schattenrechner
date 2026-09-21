import React, { useState } from 'react';
import { SolarStatus, SkinType } from '../types';
import { calculatePersonalizedVitD } from '../utils/solar';
import { Sun, Moon, ShieldCheck, Sparkles, Shirt, Play, RotateCcw, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SolarHeroProps {
  solarStatus: SolarStatus;
  selectedSkinType: SkinType;
}

export const SolarHero: React.FC<SolarHeroProps> = ({ solarStatus, selectedSkinType }) => {
  const { elevation, isAboveHorizon, canSynthesizeVitD: liveCanSynthesize, shadowRatio: liveShadowRatio, uvIndexEstimate } = solarStatus;

  // Interactive Sun Angle Simulation Mode
  const [isSimulating, setIsSimulating] = useState(false);
  const [simAngle, setSimAngle] = useState(45);

  // Active angle and states based on live vs simulation mode
  const activeElevation = isSimulating ? simAngle : elevation;
  const activeIsAboveHorizon = isSimulating ? activeElevation > 0 : isAboveHorizon;
  const activeCanSynthesize = isSimulating ? activeElevation >= 45 : liveCanSynthesize;

  // Dynamic Shadow Ratio calculation
  const activeShadowRatio = !activeIsAboveHorizon
    ? null
    : activeElevation <= 0
    ? null
    : 1 / Math.tan((activeElevation * Math.PI) / 180);

  // SVG Geometry Dimensions
  const personHeightPx = 52;
  const personFootX = 115;
  const groundY = 95;
  const sunRadius = 88;

  // Clamped shadow length for aesthetic SVG rendering (up to 195px)
  const clampedRatio = activeShadowRatio === null ? 0 : Math.min(3.4, activeShadowRatio);
  const shadowLengthPx = clampedRatio * personHeightPx;

  // Sun Position in SVG Coordinates
  const sunAngleRad = (Math.max(2, Math.min(88, activeElevation)) * Math.PI) / 180;
  const sunX = personFootX - Math.cos(sunAngleRad) * sunRadius;
  const sunY = groundY - Math.sin(sunAngleRad) * sunRadius;

  // 45-degree threshold mark on ground
  const threshold45Px = personHeightPx; // Exactly 1.0x height
  const threshold45X = personFootX + threshold45Px;

  // Personalized synthesis estimation for current state
  const vitDResult = calculatePersonalizedVitD(solarStatus, selectedSkinType, '18-35', 10);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-4">
      {/* Dynamic Embedded CSS Keyframe Animations */}
      <style>{`
        @keyframes photonBeam {
          0% { stroke-dashoffset: 36; opacity: 0.35; }
          50% { opacity: 0.95; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }
        @keyframes floatD3Molecule1 {
          0% { transform: translate(0, 0) scale(0.7); opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 0.9; }
          100% { transform: translate(6px, -24px) scale(1.1); opacity: 0; }
        }
        @keyframes floatD3Molecule2 {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          40% { opacity: 1; }
          90% { opacity: 0.85; }
          100% { transform: translate(-8px, -28px) scale(1.05); opacity: 0; }
        }
        @keyframes floatD3Molecule3 {
          0% { transform: translate(0, 0) scale(0.8); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(10px, -22px) scale(1); opacity: 0; }
        }
        @keyframes sunPulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes bioAuraPulse {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.45)); }
          50% { filter: drop-shadow(0 0 9px rgba(52, 211, 153, 0.85)); }
        }
      `}</style>

      {/* Top Header & Main Elevation readout */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
              {isSimulating ? 'Interactive Sun Simulator' : 'Current Solar Position'}
            </span>
            {isSimulating && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.2 rounded border border-amber-500/40 font-bold animate-pulse">
                SIMULATION ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white">
              {activeElevation >= 0 ? `+${activeElevation.toFixed(1)}°` : `${activeElevation.toFixed(1)}°`}
            </h1>
            <span className="text-xs text-slate-400">above horizon</span>
          </div>
        </div>

        {/* Mode Toggle & UV Index Estimate Pill */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-right shadow-sm">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Est. Clear-Sky UV</span>
            <span className={`font-mono text-lg font-bold ${
              uvIndexEstimate >= 8 ? 'text-red-400' :
              uvIndexEstimate >= 6 ? 'text-amber-400' :
              uvIndexEstimate >= 3 ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              UV {uvIndexEstimate}
            </span>
          </div>
        </div>
      </div>

      {/* Vitamin D Synthesis Status Badge */}
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
        activeCanSynthesize
          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : activeIsAboveHorizon
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
      }`}>
        {activeCanSynthesize ? (
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
        ) : activeIsAboveHorizon ? (
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Sun className="w-6 h-6" />
          </div>
        ) : (
          <div className="p-2 bg-slate-700/40 text-slate-400 rounded-lg">
            <Moon className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1">
          <div className="font-semibold text-sm flex items-center gap-1.5">
            {activeCanSynthesize ? (
              <>
                <span className="text-emerald-400 font-bold">ACTIVE VITAMIN D3 SYNTHESIS</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </>
            ) : activeIsAboveHorizon ? (
              <span className="text-amber-300 font-bold">SUB-OPTIMAL UVB (SUN BELOW 45°)</span>
            ) : (
              <span className="text-slate-400 font-bold">NIGHT / SUN BELOW HORIZON</span>
            )}
          </div>
          <p className="text-xs opacity-90 mt-0.5">
            {activeCanSynthesize
              ? 'The sun is above 45°. Atmospheric UVB attenuation is minimal; cutaneous 7-dehydrocholesterol photo-converts into previtamin D3.'
              : activeIsAboveHorizon
              ? 'The sun is above horizon but below 45°. UVB rays are heavily scattered by optical air mass; only tanning UVA reaches the ground.'
              : 'The sun is below horizon. Zero solar UVB radiation available.'}
          </p>
        </div>
      </div>

      {/* Shadow Rule Demonstration Graphic with Live Animated SVG */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span>The Universal Shadow Rule:</span>
            {activeCanSynthesize ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Shadow &lt; Height (D3 Active)
              </span>
            ) : activeIsAboveHorizon ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" /> Shadow &gt; Height (UVB Filtered)
              </span>
            ) : null}
          </span>
          <span className={activeCanSynthesize ? 'text-emerald-400 font-bold font-mono' : 'text-amber-400 font-bold font-mono'}>
            {activeShadowRatio === null
              ? 'No shadow (sun down)'
              : `Shadow ≈ ${activeShadowRatio.toFixed(2)}× height`}
          </span>
        </div>

        {/* Visual Stick Figure, Photons & Dynamic Shadow SVG Stage */}
        <div className="w-full flex justify-center py-1">
          <svg viewBox="0 0 380 125" className="w-full max-w-[420px] h-auto overflow-visible select-none">
            <defs>
              {/* Sun Flare Gradient */}
              <radialGradient id="sunGlowHero" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#ea580c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>

              {/* Shadow Ground Gradient */}
              <linearGradient id="groundShadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={activeCanSynthesize ? '#10b981' : '#f59e0b'} stopOpacity="0.85" />
                <stop offset="60%" stopColor={activeCanSynthesize ? '#059669' : '#d97706'} stopOpacity="0.55" />
                <stop offset="100%" stopColor={activeCanSynthesize ? '#047857' : '#b45309'} stopOpacity="0.15" />
              </linearGradient>

              {/* Bio Glow Filter for Cutaneous Synthesis */}
              <filter id="bioAura" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Atmospheric Ozone Scatter Arc Boundary */}
            <path
              d={`M 15 ${groundY} A 100 100 0 0 1 115 15`}
              fill="none"
              stroke="rgba(56, 189, 248, 0.12)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
            <text x="32" y="38" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">
              Atmosphere & Ozone Layer
            </text>

            {/* 45° Solar Angle Threshold Reference Guide Line */}
            <line
              x1={personFootX - Math.cos((45 * Math.PI) / 180) * sunRadius}
              y1={groundY - Math.sin((45 * Math.PI) / 180) * sunRadius}
              x2={personFootX}
              y2={groundY}
              stroke="rgba(34, 197, 94, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="4,3"
            />
            <text
              x={personFootX - Math.cos((45 * Math.PI) / 180) * sunRadius - 2}
              y={groundY - Math.sin((45 * Math.PI) / 180) * sunRadius - 5}
              fill="#22c55e"
              fontSize="7"
              fontWeight="bold"
              fontFamily="monospace"
            >
              45° Line
            </text>

            {/* Ground Line */}
            <line x1="10" y1={groundY} x2="365" y2={groundY} stroke="#334155" strokeWidth="2" strokeLinecap="round" />

            {/* Person Footprint Origin */}
            <line x1={personFootX} y1={groundY - 3} x2={personFootX} y2={groundY + 3} stroke="#64748b" strokeWidth="1.5" />

            {/* 1.0x Height Threshold Marker on Ground */}
            <line x1={threshold45X} y1={groundY - 3} x2={threshold45X} y2={groundY + 4} stroke="#22c55e" strokeWidth="1.5" />
            <text x={threshold45X} y={groundY + 13} textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="bold" fontFamily="monospace">
              1.0× H (45°)
            </text>

            {/* Height Indicator Bracket for Human Body */}
            <g transform={`translate(${personFootX - 22}, 0)`} className="opacity-75">
              <line x1="0" y1={groundY - personHeightPx} x2="0" y2={groundY} stroke="#38bdf8" strokeWidth="1" />
              <line x1="-3" y1={groundY - personHeightPx} x2="3" y2={groundY - personHeightPx} stroke="#38bdf8" strokeWidth="1" />
              <line x1="-3" y1={groundY} x2="3" y2={groundY} stroke="#38bdf8" strokeWidth="1" />
              <text
                x="-5"
                y={groundY - personHeightPx / 2 + 2.5}
                fill="#38bdf8"
                fontSize="7"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                1.0× H
              </text>
            </g>

            {/* Dynamic Solar Ray Beams with Moving Photons */}
            {activeIsAboveHorizon && (
              <g>
                {/* Main Solar Ray Beam to Human Head */}
                <line
                  x1={sunX}
                  y1={sunY}
                  x2={personFootX}
                  y2={groundY - personHeightPx}
                  stroke={activeCanSynthesize ? '#34d399' : '#f59e0b'}
                  strokeWidth={activeCanSynthesize ? '2' : '1.5'}
                  strokeDasharray="6,4"
                  style={{ animation: 'photonBeam 1.4s linear infinite' }}
                />
                {/* Secondary Ray Beam to Torso */}
                <line
                  x1={sunX}
                  y1={sunY}
                  x2={personFootX}
                  y2={groundY - personHeightPx / 2}
                  stroke={activeCanSynthesize ? '#6ee7b7' : '#fbbf24'}
                  strokeWidth="1.2"
                  strokeDasharray="4,4"
                  opacity="0.6"
                  style={{ animation: 'photonBeam 1.8s linear infinite' }}
                />

                {/* Animated Sun Orb */}
                <g transform={`translate(${sunX}, ${sunY})`}>
                  <circle cx="0" cy="0" r="18" fill="url(#sunGlowHero)" style={{ animation: 'sunPulseGlow 3s ease-in-out infinite' }} />
                  <circle cx="0" cy="0" r="8" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
                  {/* Solar Ray Corona Spikes */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                    <line
                      key={`corona-${ang}`}
                      x1="0"
                      y1="-9"
                      x2="0"
                      y2="-13"
                      stroke="#fef08a"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      transform={`rotate(${ang})`}
                    />
                  ))}
                  {/* Angle Callout Tag */}
                  <text x="12" y="-5" fill="#fef08a" fontSize="7" fontWeight="bold" fontFamily="monospace">
                    {activeElevation.toFixed(0)}°
                  </text>
                </g>
              </g>
            )}

            {/* Human Silhouette & Synthesis Reaction */}
            <g
              transform={`translate(${personFootX}, ${groundY})`}
              style={activeCanSynthesize ? { animation: 'bioAuraPulse 2.2s ease-in-out infinite' } : {}}
            >
              {/* Head */}
              <circle
                cx="0"
                cy={-personHeightPx + 7}
                r="6.5"
                fill={activeCanSynthesize ? '#34d399' : '#38bdf8'}
                stroke={activeCanSynthesize ? '#a7f3d0' : '#bae6fd'}
                strokeWidth="1"
              />
              {/* Torso */}
              <rect
                x="-4.5"
                y={-personHeightPx + 15}
                width="9"
                height="21"
                rx="3.5"
                fill={activeCanSynthesize ? '#10b981' : '#0284c7'}
              />
              {/* Arms */}
              <line
                x1="-4.5"
                y1={-personHeightPx + 18}
                x2="-9"
                y2={-personHeightPx + 32}
                stroke={activeCanSynthesize ? '#34d399' : '#38bdf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="4.5"
                y1={-personHeightPx + 18}
                x2="9"
                y2={-personHeightPx + 32}
                stroke={activeCanSynthesize ? '#34d399' : '#38bdf8'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Legs */}
              <line
                x1="-2.5"
                y1={-personHeightPx + 36}
                x2="-2.5"
                y2="0"
                stroke={activeCanSynthesize ? '#059669' : '#0369a1'}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="2.5"
                y1={-personHeightPx + 36}
                x2="2.5"
                y2="0"
                stroke={activeCanSynthesize ? '#059669' : '#0369a1'}
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Animated Floating Previtamin D3 Molecules (Only when sun >= 45°) */}
              {activeCanSynthesize && (
                <g className="pointer-events-none">
                  {/* Molecule 1 */}
                  <g style={{ animation: 'floatD3Molecule1 2s ease-out infinite' }}>
                    <circle cx="-12" cy={-personHeightPx + 20} r="3" fill="#34d399" />
                    <text x="-12" y={-personHeightPx + 21.5} fill="#022c22" fontSize="3.8" fontWeight="bold" textAnchor="middle">
                      D3
                    </text>
                  </g>
                  {/* Molecule 2 */}
                  <g style={{ animation: 'floatD3Molecule2 2.4s ease-out 0.6s infinite' }}>
                    <circle cx="12" cy={-personHeightPx + 15} r="3.2" fill="#fbbf24" />
                    <text x="12" y={-personHeightPx + 16.5} fill="#451a03" fontSize="3.8" fontWeight="bold" textAnchor="middle">
                      D3
                    </text>
                  </g>
                  {/* Molecule 3 */}
                  <g style={{ animation: 'floatD3Molecule3 2.1s ease-out 1.1s infinite' }}>
                    <circle cx="0" cy={-personHeightPx - 3} r="3" fill="#6ee7b7" />
                    <text x="0" y={-personHeightPx - 1.5} fill="#022c22" fontSize="3.8" fontWeight="bold" textAnchor="middle">
                      D3
                    </text>
                  </g>
                </g>
              )}
            </g>

            {/* Projected Shadow on Ground */}
            {activeIsAboveHorizon && shadowLengthPx > 0 && (
              <g>
                <rect
                  x={personFootX}
                  y={groundY - 1.5}
                  width={shadowLengthPx}
                  height="4.5"
                  rx="2.2"
                  fill="url(#groundShadowGrad)"
                  className="transition-all duration-300"
                />
                <circle
                  cx={personFootX + shadowLengthPx}
                  cy={groundY + 0.8}
                  r="2.5"
                  fill={activeCanSynthesize ? '#34d399' : '#fbbf24'}
                />

                {/* Dimension Callout for Shadow Length */}
                <g transform={`translate(${personFootX + shadowLengthPx / 2}, ${groundY + 15})`}>
                  <rect
                    x="-26"
                    y="-9"
                    width="52"
                    height="12"
                    rx="2.5"
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke={activeCanSynthesize ? '#10b981' : '#f59e0b'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="-0.5"
                    fill={activeCanSynthesize ? '#86efac' : '#fde047'}
                    fontSize="7"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {activeShadowRatio ? `${activeShadowRatio.toFixed(2)}× H` : ''}
                  </text>
                </g>
              </g>
            )}

            {/* Night Sky Graphic when sun is down */}
            {!activeIsAboveHorizon && (
              <g transform="translate(60, 45)">
                <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                <path d="M -6 -8 A 10 10 0 0 0 6 8 A 12 12 0 0 1 -6 -8 Z" fill="#e2e8f0" />
                <circle cx="35" cy="-15" r="1.5" fill="#f8fafc" opacity="0.8" />
                <circle cx="65" cy="-2" r="1.2" fill="#f8fafc" opacity="0.6" />
                <circle cx="20" cy="15" r="1.5" fill="#f8fafc" opacity="0.7" />
                <text x="18" y="2" fill="#94a3b8" fontSize="7" fontFamily="sans-serif">
                  Night / Sun Below Horizon
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Interactive Sun Scrubbing & Preset Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Sun Angle Scrubber:</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSimulating(!isSimulating);
                if (!isSimulating) setSimAngle(Math.max(5, Math.min(80, elevation > 0 ? elevation : 45)));
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                isSimulating
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Reset to Live Sun ({elevation >= 0 ? `+${elevation.toFixed(1)}°` : `${elevation.toFixed(1)}°`})</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-amber-400" />
                  <span>Test Angles (Slider)</span>
                </>
              )}
            </button>
          </div>

          {/* Slider and Presets */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="flex items-center gap-2 w-full sm:flex-1">
              <span className="text-[10px] font-mono text-slate-400 shrink-0">10°</span>
              <input
                type="range"
                min="10"
                max="80"
                step="1"
                value={isSimulating ? simAngle : Math.max(10, Math.min(80, elevation > 0 ? elevation : 45))}
                onChange={(e) => {
                  setIsSimulating(true);
                  setSimAngle(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] font-mono text-slate-400 shrink-0">80°</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSimulating(true);
                  setSimAngle(25);
                }}
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                  isSimulating && simAngle === 25
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Morning Sun (25° - Shadow longer than height, UVB blocked)"
              >
                Morning 25°
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSimulating(true);
                  setSimAngle(45);
                }}
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                  isSimulating && simAngle === 45
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                    : 'bg-slate-800 text-emerald-400 hover:text-emerald-300'
                }`}
                title="Critical Threshold (45° - Shadow exactly equals body height!)"
              >
                Threshold 45°
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSimulating(true);
                  setSimAngle(65);
                }}
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                  isSimulating && simAngle === 65
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Solar Noon (65° - Short shadow, intense D3 generation)"
              >
                Noon 65°
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          <strong className="text-slate-200">The 45° Rule of Optics:</strong> When the sun rises above 45°, your shadow becomes <em>shorter than you are tall</em> and sunlight cuts directly through the atmosphere with sufficient UVB (290–315 nm) to trigger cutaneous Vitamin D3 synthesis. Below 45°, UVB photons are scattered by thick air mass (&gt;1.5).
        </p>
      </div>

      {/* 10-Minute Synthesis Preview (With vs Without Shirt) */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            10-Min Synthesis for {selectedSkinType.roman}:
          </span>
          <span className={`font-mono text-[11px] font-bold ${activeCanSynthesize ? 'text-emerald-400' : 'text-slate-400'}`}>
            {activeCanSynthesize ? 'UVB Window Open' : 'UVB Blocked'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Shirt className="w-3 h-3 text-blue-400" />
              <span>With T-Shirt (25% BSA)</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {activeCanSynthesize ? vitDResult.iuIn10MinWithTshirt.toLocaleString() : '0'} IU
            </div>
            <span className="text-[10px] text-slate-400">
              {activeCanSynthesize ? vitDResult.percentRDA10MinTshirt : 0}% Daily RDA
            </span>
          </div>

          <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-0.5">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Without T-Shirt (75% BSA)</span>
            </div>
            <div className="font-mono text-base font-bold text-emerald-300">
              {activeCanSynthesize ? vitDResult.iuIn10MinWithoutTshirt.toLocaleString() : '0'} IU
            </div>
            <span className="text-[10px] text-emerald-400/80">
              {activeCanSynthesize ? vitDResult.percentRDA10MinNoShirt : 0}% Daily RDA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
