import React from 'react';
import { SolarStatus, SkinType } from '../types';
import { calculatePersonalizedVitD } from '../utils/solar';
import { Sun, Moon, ShieldCheck, Sparkles, Shirt } from 'lucide-react';

interface SolarHeroProps {
  solarStatus: SolarStatus;
  selectedSkinType: SkinType;
}

export const SolarHero: React.FC<SolarHeroProps> = ({ solarStatus, selectedSkinType }) => {
  const { elevation, isAboveHorizon, canSynthesizeVitD, shadowRatio, uvIndexEstimate } = solarStatus;

  // Person height in SVG pixels
  const personHeightPx = 54;
  const clampedRatio = shadowRatio === null ? 0 : Math.min(3.0, shadowRatio);
  const shadowLengthPx = clampedRatio * personHeightPx;

  // Quick 10-min calculation
  const vitDResult = calculatePersonalizedVitD(solarStatus, selectedSkinType, '18-35', 10);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-4">
      {/* Top Header & Main Elevation readout */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
            Current Solar Position
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white">
              {elevation >= 0 ? `+${elevation.toFixed(1)}°` : `${elevation.toFixed(1)}°`}
            </h1>
            <span className="text-xs text-slate-400">above horizon</span>
          </div>
        </div>

        {/* UV Index Estimate Pill */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-right">
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

      {/* Vitamin D Synthesis Status Badge */}
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
        canSynthesizeVitD
          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : isAboveHorizon
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
      }`}>
        {canSynthesizeVitD ? (
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
        ) : isAboveHorizon ? (
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
            {canSynthesizeVitD ? (
              <>
                <span className="text-emerald-400 font-bold">ACTIVE VITAMIN D3 SYNTHESIS</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </>
            ) : isAboveHorizon ? (
              <span className="text-amber-300 font-bold">SUB-OPTIMAL UVB (SUN BELOW 45°)</span>
            ) : (
              <span className="text-slate-400 font-bold">NIGHT / SUN BELOW HORIZON</span>
            )}
          </div>
          <p className="text-xs opacity-90 mt-0.5">
            {canSynthesizeVitD
              ? 'The sun is above 45°. Atmospheric UVB attenuation is low enough for dermal 7-DHC previtamin D3 synthesis.'
              : isAboveHorizon
              ? 'The sun is above the horizon, but below 45°. UVB rays travel through too much atmosphere and are scattered; only UVA penetrates.'
              : 'The sun is below the horizon at this tagged location. No solar UVB available.'}
          </p>
        </div>
      </div>

      {/* Shadow Rule Demonstration Graphic */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>The Universal Shadow Rule:</span>
          <span className={canSynthesizeVitD ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
            {shadowRatio === null
              ? 'No shadow (sun down)'
              : `Shadow ≈ ${shadowRatio.toFixed(2)}× body height (${canSynthesizeVitD ? 'Shorter than you!' : 'Longer than you'})`}
          </span>
        </div>

        {/* Visual Stick Figure & Dynamic Shadow */}
        <div className="w-full flex justify-center py-2">
          <svg viewBox="0 0 340 100" className="w-full max-w-[340px] h-auto overflow-visible">
            {/* Ground Line */}
            <line x1="10" y1="85" x2="330" y2="85" stroke="#475569" strokeWidth="2" />

            {/* Ground distance markers */}
            <line x1="100" y1="82" x2="100" y2="88" stroke="#64748b" strokeWidth="1.5" />
            <line x1="154" y1="82" x2="154" y2="88" stroke="#10b981" strokeWidth="1.5" />
            <text x="154" y="96" textAnchor="middle" fill="#10b981" fontSize="7" fontWeight="bold">
              1.0× Height (45°)
            </text>

            {/* Sun Rays Angle Indicator */}
            {isAboveHorizon && (
              <g>
                <circle cx={100 - Math.cos(elevation * Math.PI / 180) * 80} cy={85 - Math.sin(elevation * Math.PI / 180) * 80} r="9" fill="#fbbf24" />
                <line
                  x1={100 - Math.cos(elevation * Math.PI / 180) * 80}
                  y1={85 - Math.sin(elevation * Math.PI / 180) * 80}
                  x2={100}
                  y2={31}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              </g>
            )}

            {/* Human Silhouette at x=100 */}
            <g transform="translate(100, 31)">
              {/* Head */}
              <circle cx="0" cy="8" r="7" fill="#38bdf8" />
              {/* Torso */}
              <rect x="-5" y="16" width="10" height="23" rx="4" fill="#38bdf8" />
              {/* Legs */}
              <line x1="-3" y1="39" x2="-3" y2="54" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
              <line x1="3" y1="39" x2="3" y2="54" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Projected Shadow on the Ground */}
            {isAboveHorizon && shadowLengthPx > 0 && (
              <g>
                <rect
                  x="100"
                  y="83"
                  width={shadowLengthPx}
                  height="5"
                  rx="2.5"
                  fill={canSynthesizeVitD ? '#10b981' : '#f59e0b'}
                  opacity="0.8"
                />
                <circle cx={100 + shadowLengthPx} cy="85.5" r="2.5" fill={canSynthesizeVitD ? '#34d399' : '#fbbf24'} />
              </g>
            )}
          </svg>
        </div>

        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          <strong className="text-slate-200">Rule of Thumb:</strong> When your shadow is <em>shorter than you are tall</em>, the sun is higher than 45° and your skin can produce Vitamin D3. When your shadow is <em>longer than you</em>, UVB radiation is filtered out.
        </p>
      </div>

      {/* 10-Minute Synthesis Preview (With vs Without Shirt) */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            10-Min Synthesis for {selectedSkinType.roman}:
          </span>
          <span className={`font-mono text-[11px] font-bold ${canSynthesizeVitD ? 'text-emerald-400' : 'text-slate-400'}`}>
            {canSynthesizeVitD ? 'UVB Window Open' : 'UVB Blocked'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Shirt className="w-3 h-3 text-blue-400" />
              <span>With T-Shirt (25% BSA)</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {vitDResult.iuIn10MinWithTshirt.toLocaleString()} IU
            </div>
            <span className="text-[10px] text-slate-400">
              {vitDResult.percentRDA10MinTshirt}% Daily RDA
            </span>
          </div>

          <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-0.5">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Without T-Shirt (75% BSA)</span>
            </div>
            <div className="font-mono text-base font-bold text-emerald-300">
              {vitDResult.iuIn10MinWithoutTshirt.toLocaleString()} IU
            </div>
            <span className="text-[10px] text-emerald-400/80">
              {vitDResult.percentRDA10MinNoShirt}% Daily RDA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
