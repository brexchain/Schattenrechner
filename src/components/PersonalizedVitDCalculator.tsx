import React, { useState } from 'react';
import { SolarStatus, SkinType, SeasonInfo, AgeGroup, PersonalizedVitDResult } from '../types';
import { getSkinTypes, detectSeason, SEASON_PRESETS, getAgeFactor, calculatePersonalizedVitD } from '../utils/solar';
import {
  Sparkles,
  Shirt,
  Sun,
  Shield,
  Clock,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Layers,
  User,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface PersonalizedVitDCalculatorProps {
  solarStatus: SolarStatus;
  lat: number;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedSkinType: SkinType;
  onSelectSkinType: (type: SkinType) => void;
}

export const PersonalizedVitDCalculator: React.FC<PersonalizedVitDCalculatorProps> = ({
  solarStatus,
  lat,
  selectedDate,
  onDateChange,
  selectedSkinType,
  onSelectSkinType,
}) => {
  const skinTypes = getSkinTypes();
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('18-35');
  const [exposureMinutes, setExposureMinutes] = useState<number>(10);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [seasonMode, setSeasonMode] = useState<'auto' | 'simulate'>('auto');

  // Detected season from current selected date & latitude
  const detectedSeason: SeasonInfo = detectSeason(selectedDate, lat);

  // Personalized Vitamin D result
  const vitDResult: PersonalizedVitDResult = calculatePersonalizedVitD(
    solarStatus,
    selectedSkinType,
    ageGroup,
    exposureMinutes
  );

  const ageFactorObj = getAgeFactor(ageGroup);

  const handleSeasonPreset = (presetDate: Date) => {
    // Keep current time of day, change year/month/day
    const newDate = new Date(selectedDate);
    newDate.setFullYear(presetDate.getFullYear(), presetDate.getMonth(), presetDate.getDate());
    onDateChange(newDate);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-5">
      {/* Component Title & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight">
              Personalized Vitamin D Synthesis
            </h3>
            <p className="text-xs text-slate-400">
              Photobiological calculation based on skin phototype, season, age, and clothing coverage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showMethodology ? 'Hide Methodology' : 'View Scientific Methodology'}</span>
          {showMethodology ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 1. Skin Phototype Selector (Fitzpatrick Scale) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            1. Your Skin Phototype (Fitzpatrick Scale)
          </label>
          <span className="text-[11px] font-mono text-emerald-400">
            Selected: {selectedSkinType.roman} ({selectedSkinType.name})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {skinTypes.map((st) => {
            const isSelected = st.type === selectedSkinType.type;
            return (
              <button
                key={st.type}
                type="button"
                onClick={() => onSelectSkinType(st)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-xs">{st.roman}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-sm"
                    style={{ backgroundColor: st.hexColor }}
                    title={`Tone: ${st.name}`}
                  />
                </div>
                <span className="text-[11px] font-semibold truncate leading-snug">{st.name}</span>
                <span className="text-[9px] text-slate-400 mt-1 font-mono">{st.medThreshold} J/m² MED</span>
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
          <strong className="text-slate-300">{selectedSkinType.roman}:</strong> {selectedSkinType.description} Melanin blocks UV photons; darker skin requires ~3–4.5× longer exposure to generate equivalent 25(OH)D.
        </p>
      </div>

      {/* 2. Time of Year & Season Mode */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Time of Year & Seasonal UVB Window</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-700 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setSeasonMode('auto')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                seasonMode === 'auto' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto-Detected ({detectedSeason.approxDate})
            </button>
            <button
              type="button"
              onClick={() => setSeasonMode('simulate')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                seasonMode === 'simulate' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulate Solstice / Equinox
            </button>
          </div>
        </div>

        {/* Season status card */}
        <div className="flex items-start justify-between gap-3 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div>
            <span className="font-semibold text-amber-300 block">{detectedSeason.name}</span>
            <p className="text-slate-400 text-[11px] mt-0.5">{detectedSeason.description}</p>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md whitespace-nowrap ${
            detectedSeason.isVitDWinter
              ? 'bg-red-950/60 text-red-300 border border-red-500/30'
              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
          }`}>
            {detectedSeason.isVitDWinter ? 'Vitamin D Winter' : 'Synthesis Season'}
          </span>
        </div>

        {/* Simulation presets if in simulate mode */}
        {seasonMode === 'simulate' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/80">
            {SEASON_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSeasonPreset(preset.date)}
                className="text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors"
              >
                <span className="font-semibold block text-slate-200 truncate">{preset.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Age & Duration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Age Group */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
            <span>3. Age Group (7-DHC Epidermal Capacity)</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {Math.round(ageFactorObj.factor * 100)}% synthesis capacity
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['18-35', '36-50', '51-65', '66+'] as AgeGroup[]).map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setAgeGroup(group)}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  ageGroup === group
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {group} yrs
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {ageFactorObj.label}
          </span>
        </div>

        {/* Custom Duration Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              4. Exposure Duration Slider
            </span>
            <span className="font-mono text-amber-300 text-xs font-bold">
              {exposureMinutes} minutes {exposureMinutes === 10 && '(Baseline Request)'}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={exposureMinutes}
            onChange={(e) => setExposureMinutes(Number(e.target.value))}
            className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>5 min</span>
            <span className="text-amber-400 font-bold">10 min (Key Standard)</span>
            <span>20 min</span>
            <span>30 min</span>
            <span>60 min</span>
          </div>
        </div>
      </div>

      {/* 4. THE CORE 10-MINUTE PRODUCTION COMPARISON: WITH T-SHIRT vs WITHOUT T-SHIRT */}
      <div className="bg-gradient-to-b from-slate-950/90 to-slate-900 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400 block">
              Direct Comparison
            </span>
            <h4 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Vitamin D3 Generated in 10 Minutes</span>
              <span className="text-xs font-normal text-slate-400">
                (at current sun angle: {solarStatus.elevation.toFixed(1)}°)
              </span>
            </h4>
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            vitDResult.isWindowOpen
              ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950 border border-amber-500/50 text-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${vitDResult.isWindowOpen ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{vitDResult.isWindowOpen ? 'Active UVB' : 'UVB Blocked'}</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option A: WITH T-SHIRT */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-100">With T-Shirt & Shorts</h5>
                    <span className="text-[11px] text-slate-400">~25% body surface exposed</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  Casual Wear
                </span>
              </div>

              {/* 10-Min Value */}
              <div className="my-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  In 10 Minutes:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`font-mono text-3xl font-bold ${
                    vitDResult.iuIn10MinWithTshirt > 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {vitDResult.iuIn10MinWithTshirt.toLocaleString()} IU
                  </span>
                  <span className="text-xs text-slate-400">
                    ({vitDResult.percentRDA10MinTshirt}% Daily RDA)
                  </span>
                </div>
              </div>

              {/* Exposed areas detail */}
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                Exposes face, neck, forearms, hands, and lower calves. Wallace Rule of Nines factor: <strong>0.25</strong>.
              </p>
            </div>

            {/* Time to 1,000 IU */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Time to reach 1,000 IU:</span>
              <span className="font-mono font-bold text-slate-200">
                {vitDResult.minutesToReach1000IUTshirt !== null
                  ? `~${vitDResult.minutesToReach1000IUTshirt} min`
                  : 'N/A (Sun < 45°)'}
              </span>
            </div>
          </div>

          {/* Option B: WITHOUT T-SHIRT */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/60 transition-all shadow-md">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-emerald-100">Without T-Shirt (Shirtless)</h5>
                    <span className="text-[11px] text-emerald-400/80">~75% body surface exposed</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  3× Higher Yield
                </span>
              </div>

              {/* 10-Min Value */}
              <div className="my-3 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                  In 10 Minutes:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`font-mono text-3xl font-bold ${
                    vitDResult.iuIn10MinWithoutTshirt > 0 ? 'text-emerald-300' : 'text-slate-400'
                  }`}>
                    {vitDResult.iuIn10MinWithoutTshirt.toLocaleString()} IU
                  </span>
                  <span className="text-xs text-emerald-400/80">
                    ({vitDResult.percentRDA10MinNoShirt}% Daily RDA)
                  </span>
                </div>
              </div>

              {/* Exposed areas detail */}
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                Exposes chest, abdomen, full back, arms, legs, and face (swimwear). Wallace Rule of Nines factor: <strong>0.75</strong>.
              </p>
            </div>

            {/* Time to 1,000 IU */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Time to reach 1,000 IU:</span>
              <span className="font-mono font-bold text-emerald-300">
                {vitDResult.minutesToReach1000IUNoShirt !== null
                  ? `~${vitDResult.minutesToReach1000IUNoShirt} min`
                  : 'N/A (Sun < 45°)'}
              </span>
            </div>
          </div>
        </div>

        {/* Custom duration readout if slider is not 10 min */}
        {exposureMinutes !== 10 && (
          <div className="mt-3 bg-slate-900/80 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">
                At your selected <strong>{exposureMinutes} minutes</strong>:
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>
                With T-shirt: <strong className="text-blue-300">{vitDResult.iuInCustomWithTshirt.toLocaleString()} IU</strong>
              </span>
              <span>
                Without T-shirt: <strong className="text-emerald-300">{vitDResult.iuInCustomWithoutTshirt.toLocaleString()} IU</strong>
              </span>
            </div>
          </div>
        )}

        {/* Sunburn safety notice */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-3 py-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Safe exposure limit before sunburn (1 MED) for <strong>{selectedSkinType.roman}</strong>:
            </span>
          </div>
          <span className="font-mono font-bold text-amber-300">
            {vitDResult.burnTimeMinutes !== null
              ? `~${vitDResult.burnTimeMinutes} minutes`
              : 'No sunburn risk (Low/Zero UV)'}
          </span>
        </div>
      </div>

      {/* 5. DETAILED METHODOLOGY & SCIENTIFIC MODEL EXPLANATION (EXPANDABLE) */}
      {showMethodology && (
        <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-4 text-xs text-slate-300 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Scientific Methodology & Biophysical Photobiology Model
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">CIE / NOAA / Holick MF</span>
          </div>

          {/* Mathematical Formula Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] leading-relaxed">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
              Core Photobiology Equation:
            </span>
            <div className="text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto">
              IU = ( (Minutes × 1.5 × UV_Index) / MED_skin ) × 15,000 × BSA × f_age × E_uvb
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              <div>
                <strong className="text-slate-200">UV Dose Rate:</strong> 1 UVI = 25 mW/m² = 1.5 J/(m²·min)
              </div>
              <div>
                <strong className="text-slate-200">Whole-Body 1 MED Constant:</strong> 15,000 IU (Holick, 2007)
              </div>
              <div>
                <strong className="text-slate-200">T-Shirt vs Shirtless BSA:</strong> 25% (0.25) vs 75% (0.75)
              </div>
              <div>
                <strong className="text-slate-200">Current Skin MED:</strong> {vitDResult.formulaVariables.med} J/m² ({selectedSkinType.roman})
              </div>
            </div>
          </div>

          {/* 4 Pillars of the Methodology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <h5 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                1. Atmospheric Ozone & The 45° Elevation Rule
              </h5>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Previtamin D3 synthesis requires a narrow UVB wavelength band (290–315 nm). When the sun is below 45° above the horizon, solar rays must travel through a substantially thicker optical air mass ($&gt;1.41$), causing stratospheric ozone and Rayleigh scattering to extinguish virtually all narrow-band UVB.
              </p>
            </div>

            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <h5 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                2. Body Surface Area (Wallace Rule of Nines)
              </h5>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Cutaneous synthesis is directly proportional to exposed surface area:
                <br />• <strong>With T-shirt & shorts:</strong> Face (4%), neck (2%), arms/hands (8%), lower legs (11%) $\approx 25\%$ BSA.
                <br />• <strong>Without T-shirt:</strong> Full torso front/back (36%), arms (18%), full legs (36%), face (9%) $\approx 75\%$ BSA ($3\times$ higher yield).
              </p>
            </div>

            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <h5 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                3. Fitzpatrick Skin Phototyping & Melanin
              </h5>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Eumelanin in the basal layer of the epidermis competitively absorbs UVB photons before they can photolyze 7-dehydrocholesterol into previtamin D3. Minimal Erythemal Dose (MED) ranges from 200 J/m² (Type I) to 900 J/m² (Type VI), explaining why deeply pigmented skin requires prolonged exposure.
              </p>
            </div>

            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <h5 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                4. Photo-Equilibrium Plateau & Safe Limits
              </h5>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Sunlight cannot cause Vitamin D toxicity. Prolonged exposure causes previtamin D3 to photo-isomerize reversibly into inactive photoproducts (lumisterol and tachysterol). Systemic production plateaus naturally after approximately 10,000–15,000 IU in a single session.
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800">
            References: Holick MF. (2007) Vitamin D deficiency. N Engl J Med; Webb AR et al. (2006) Influence of season and latitude on Vitamin D synthesis. J Clin Endocrinol Metab; CIE 174:2006 Action Spectrum for the Production of Previtamin D3 in Human Skin.
          </div>
        </div>
      )}
    </div>
  );
};
