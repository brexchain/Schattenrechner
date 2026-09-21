import React from 'react';
import { SkinType } from '../types';
import { getSkinTypes } from '../utils/solar';
import { Sparkles, Info, ShieldAlert } from 'lucide-react';

interface SkinTypeGuideProps {
  selectedSkinType: SkinType;
  onSelectSkinType: (type: SkinType) => void;
}

export const SkinTypeGuide: React.FC<SkinTypeGuideProps> = ({
  selectedSkinType,
  onSelectSkinType,
}) => {
  const skinTypes = getSkinTypes();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-serif text-base font-semibold text-slate-200">
            Skin Phototype & D3 Exposure Guide
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Fitzpatrick Scale</span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Melanin acts as a natural sun filter. Darker skin tones require longer UVB exposure to synthesize identical quantities of Vitamin D3 compared to lighter skin tones.
      </p>

      {/* Skin Type selector chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {skinTypes.map((st) => {
          const isSelected = st.type === selectedSkinType.type;
          return (
            <button
              key={st.type}
              type="button"
              onClick={() => onSelectSkinType(st)}
              className={`text-left p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">{st.roman}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block"
                    style={{ backgroundColor: st.hexColor }}
                  />
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">{st.minutesAtUv6}</span>
              </div>
              <span className="block text-[11px] font-medium text-slate-300 mt-0.5 truncate">
                {st.name}
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                {st.medThreshold} J/m² MED
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Type Details */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-xs flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">
            {selectedSkinType.roman}: {selectedSkinType.name}
          </span>
          <span className="text-emerald-400 font-mono font-bold">
            {selectedSkinType.minutesAtUv6} at UV Index ~6
          </span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          {selectedSkinType.description} With ~25% skin surface exposed (arms and legs), this produces approximately 1,000–2,000 IU of cholecalciferol before erythema threshold.
        </p>
      </div>

      {/* Medical disclaimer reminder */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Scientific Rule of Thumb:</strong> Solar elevation &gt;45° is a prerequisite for atmospheric UVB penetration. Always avoid sunburn, as prolonged unprotected exposure increases cellular DNA damage without increasing additional Vitamin D production.
        </span>
      </div>
    </div>
  );
};
