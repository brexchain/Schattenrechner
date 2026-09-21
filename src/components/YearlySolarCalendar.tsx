import React, { useRef, useEffect, useCallback } from 'react';
import { YearWindow } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Sun, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

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
  const { isSunny } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const drawChart = useCallback(() => {
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

    // Subtle sky background for sunny theme
    if (isSunny) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
    }

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
        ctx.fillStyle = isSunny ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.3)';
        ctx.fillRect(x, yPos(e), barW + 0.5, yPos(yMin) - yPos(e));
      } else if (e > 0) {
        ctx.fillStyle = isSunny ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)';
        ctx.fillRect(x, yPos(e), barW + 0.5, yPos(yMin) - yPos(e));
      }
    }

    // 45° threshold line
    ctx.strokeStyle = isSunny ? '#059669' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yPos(45));
    ctx.lineTo(w, yPos(45));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isSunny ? '#047857' : '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('45° Vit-D Threshold', 6, yPos(45) - 3);

    // Peak elevation curve across the year
    ctx.strokeStyle = isSunny ? '#0284c7' : '#38bdf8';
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
    ctx.fillStyle = isSunny ? '#64748b' : '#94a3b8';
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

    ctx.strokeStyle = isSunny ? '#d97706' : '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(todayX, paddingTop);
    ctx.lineTo(todayX, h - paddingBottom);
    ctx.stroke();

    ctx.fillStyle = isSunny ? '#d97706' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(todayX, todayY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [yearWindow, isSunny]);

  useEffect(() => {
    drawChart();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      drawChart();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [drawChart]);

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
        <div className={`flex items-center gap-2 font-medium ${isSunny ? 'text-emerald-800' : 'text-emerald-300'}`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            Tropical latitude ({lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}): The midday sun exceeds 45° <strong>all year round</strong>. Natural Vitamin D synthesis is achievable in all 12 months.
          </span>
        </div>
      );
    }

    return (
      <div className={isSunny ? 'text-slate-800' : 'text-slate-200'}>
        Vitamin D Season ({yearWindow.year}): Approximately{' '}
        <strong className={`${isSunny ? 'text-emerald-700' : 'text-emerald-400'} font-bold`}>{yearWindow.firstDate}</strong> to{' '}
        <strong className={`${isSunny ? 'text-emerald-700' : 'text-emerald-400'} font-bold`}>{yearWindow.lastDate}</strong>.
        Outside this window is the "Vitamin D Winter" when the midday sun is too low.
      </div>
    );
  };

  return (
    <div
      id="yearly-solar-calendar-card"
      className={`border rounded-2xl p-5 shadow-xl flex flex-col gap-3.5 backdrop-blur-sm transition-colors duration-300 ${
        isSunny
          ? 'bg-white/95 border-amber-200/80 text-slate-800 shadow-amber-950/5'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
        isSunny ? 'border-amber-200/70' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
            isSunny
              ? 'bg-amber-100 border-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <Calendar className={`w-4 h-4 ${isSunny ? 'text-amber-700' : 'text-emerald-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-serif text-base font-semibold ${isSunny ? 'text-slate-900' : 'text-slate-100'}`}>
                Annual Vitamin D Season &amp; Solar Elevation Curve ({yearWindow.year})
              </h3>
              <span className={`hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                isSunny
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                365-Day Window
              </span>
            </div>
            {locationName && (
              <p className={`text-xs mt-0.5 ${isSunny ? 'text-slate-600' : 'text-slate-400'}`}>
                Target: <span className={`font-medium ${isSunny ? 'text-slate-900' : 'text-slate-200'}`}>{locationName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`font-mono px-2.5 py-1 rounded-lg border ${
            isSunny ? 'text-slate-600 bg-amber-50/70 border-amber-200/80' : 'text-slate-400 bg-slate-800/60 border-slate-700/50'
          }`}>
            Latitude: <strong className={isSunny ? 'text-slate-900' : 'text-slate-200'}>{lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}</strong>
          </span>
          <span className={`font-mono px-2.5 py-1 rounded-lg border ${
            isSunny ? 'text-slate-600 bg-amber-50/70 border-amber-200/80' : 'text-slate-400 bg-slate-800/60 border-slate-700/50'
          }`}>
            Peak: <strong className={isSunny ? 'text-amber-800' : 'text-amber-300'}>{yearWindow.peakElevation.toFixed(1)}°</strong>
          </span>
        </div>
      </div>

      {/* Canvas Timeline */}
      <div
        ref={containerRef}
        className={`relative w-full h-[180px] border rounded-xl overflow-hidden p-1 transition-colors ${
          isSunny ? 'bg-slate-50/90 border-amber-200/70' : 'bg-slate-950/70 border-slate-800'
        }`}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Summary Narrative */}
      <div className={`border rounded-xl p-3 text-xs leading-relaxed transition-colors ${
        isSunny ? 'bg-amber-50/70 border-amber-200/80 text-slate-800' : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
      }`}>
        {getSeasonSummary()}
      </div>

      {/* 12-Month Grid Breakdown */}
      <div>
        <div className={`text-[11px] font-semibold mb-1.5 flex items-center justify-between ${
          isSunny ? 'text-slate-600' : 'text-slate-400'
        }`}>
          <span>Monthly Cutaneous D3 Synthesis Potential at Solar Noon:</span>
          <span className={`text-[10px] ${isSunny ? 'text-slate-500' : 'text-slate-400'}`}>Sun elevation ≥ 45°</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {yearWindow.months.map((m) => {
            const isFull = m.status === 'full';
            const isPartial = m.status === 'partial';
            return (
              <div
                key={m.name}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isFull
                    ? isSunny
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isPartial
                    ? isSunny
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-xs'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : isSunny
                    ? 'bg-slate-100/90 border-slate-200 text-slate-400'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                }`}
              >
                <span className="block font-bold text-xs">{m.abbr}</span>
                <span className="block text-[10px] opacity-80 mt-0.5">
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
