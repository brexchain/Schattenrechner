import React, { useRef, useEffect } from 'react';
import { YearWindow } from '../types';
import { Calendar, Sun, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface YearlySolarCalendarProps {
  yearWindow: YearWindow;
  lat: number;
  locationName?: string;
}

export const YearlySolarCalendar: React.FC<YearlySolarCalendarProps> = ({
  yearWindow,
  lat,
  locationName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 400;
    const h = 180;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const peaks = yearWindow.dailyPeaks;
    const totalDays = peaks.length;
    const paddingBottom = 24;
    const paddingTop = 14;
    const chartH = h - paddingBottom - paddingTop;

    const yMin = Math.min(-10, Math.min(...peaks) - 5);
    const yMax = 95;

    const yPos = (elev: number) => {
      return h - paddingBottom - ((elev - yMin) / (yMax - yMin)) * chartH;
    };

    const barW = w / totalDays;

    // Fill bars
    for (let i = 0; i < totalDays; i++) {
      const e = peaks[i];
      const x = i * barW;
      if (e >= 45) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.fillRect(x, yPos(e), barW + 0.5, yPos(yMin) - yPos(e));
      } else if (e > 0) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.fillRect(x, yPos(e), barW + 0.5, yPos(yMin) - yPos(e));
      }
    }

    // 45° threshold line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yPos(45));
    ctx.lineTo(w, yPos(45));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('45° Vit-D Threshold', 6, yPos(45) - 3);

    // Peak elevation curve across the year
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    peaks.forEach((e, idx) => {
      const x = idx * barW;
      const y = yPos(e);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Month tick markers along bottom
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let m = 0; m < 12; m++) {
      const doy = Math.floor((Date.UTC(yearWindow.year, m, 15) - Date.UTC(yearWindow.year, 0, 1)) / 86400000);
      const x = (doy / totalDays) * w;
      ctx.fillText(yearWindow.months[m].abbr, x, h - 8);
    }

    // Today indicator
    const todayX = (yearWindow.todayDoy / totalDays) * w;
    const todayElev = peaks[yearWindow.todayDoy] || 0;
    const todayY = yPos(todayElev);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(todayX, paddingTop);
    ctx.lineTo(todayX, h - paddingBottom);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(todayX, todayY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [yearWindow]);

  // Season text summary
  const getSeasonSummary = () => {
    if (!yearWindow.firstDate && !yearWindow.lastDate) {
      return (
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            At this latitude ({lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}), the sun <strong>never reaches 45°</strong> at any point during the year (Max Peak: {yearWindow.peakElevation.toFixed(1)}°). Year-round cutaneous Vitamin D3 synthesis is severely limited or impossible.
          </span>
        </div>
      );
    }

    const allYear = yearWindow.months.every((m) => m.status === 'full');
    if (allYear) {
      return (
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            Tropical latitude ({lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}): The midday sun exceeds 45° <strong>all year round</strong>. Natural Vitamin D synthesis is achievable in all 12 months.
          </span>
        </div>
      );
    }

    return (
      <div className="text-slate-200">
        Vitamin D Season ({yearWindow.year}): Approximately{' '}
        <strong className="text-emerald-400 font-bold">{yearWindow.firstDate}</strong> to{' '}
        <strong className="text-emerald-400 font-bold">{yearWindow.lastDate}</strong>.
        Outside this window is the "Vitamin D Winter" when the midday sun is too low.
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="font-serif text-base font-semibold text-slate-200">
            Yearly Vitamin D Season ({yearWindow.year})
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Latitude {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}
        </span>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-[180px] bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden p-1">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Summary Narrative */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-xs leading-relaxed">
        {getSeasonSummary()}
      </div>

      {/* 12-Month Grid Breakdown */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
          Monthly D3 Potential at Midday:
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {yearWindow.months.map((m) => {
            const isFull = m.status === 'full';
            const isPartial = m.status === 'partial';
            return (
              <div
                key={m.name}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  isFull
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isPartial
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                }`}
              >
                <span className="block font-bold text-xs">{m.abbr}</span>
                <span className="block text-[10px] opacity-80">
                  {isFull ? 'Entire Mo.' : isPartial ? 'Partial' : 'No Window'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
