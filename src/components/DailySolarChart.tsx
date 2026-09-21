import React, { useRef, useEffect } from 'react';
import { DayWindow } from '../types';
import { Clock, Sun, Sparkles } from 'lucide-react';

interface DailySolarChartProps {
  dayWindow: DayWindow;
  currentDate: Date;
}

export const DailySolarChart: React.FC<DailySolarChartProps> = ({ dayWindow, currentDate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 400;
    const h = 200;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const yMin = -20;
    const yMax = 90;
    const paddingBottom = 26;
    const paddingTop = 16;
    const chartHeight = h - paddingBottom - paddingTop;

    const yPos = (elev: number) => {
      return h - paddingBottom - ((elev - yMin) / (yMax - yMin)) * chartHeight;
    };

    const points = dayWindow.hourlyPoints;
    const n = points.length;
    const barW = w / (n - 1);

    // 1. Shaded area under the curve
    for (let i = 0; i < n - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const x1 = i * barW;
      const x2 = (i + 1) * barW;
      const avgElev = (p1.elevation + p2.elevation) / 2;

      if (avgElev >= 45) {
        // Vitamin D active zone (Green glow)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fillRect(x1, yPos(Math.max(p1.elevation, p2.elevation)), barW + 0.5, yPos(0) - yPos(Math.max(p1.elevation, p2.elevation)));
      } else if (avgElev > 0) {
        // Daylight zone (Golden amber)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fillRect(x1, yPos(Math.max(p1.elevation, p2.elevation)), barW + 0.5, yPos(0) - yPos(Math.max(p1.elevation, p2.elevation)));
      } else {
        // Night zone (Dark slate)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(x1, paddingTop, barW + 0.5, chartHeight);
      }
    }

    // 2. Horizon reference line (0°)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yPos(0));
    ctx.lineTo(w, yPos(0));
    ctx.stroke();
    ctx.setLineDash([]);

    // 0° label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('0° Horizon', 6, yPos(0) - 3);

    // 3. 45° Vitamin D Threshold line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yPos(45));
    ctx.lineTo(w, yPos(45));
    ctx.stroke();
    ctx.setLineDash([]);

    // 45° label
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('45° Vit-D Threshold', 6, yPos(45) - 3);

    // 4. Solar elevation smooth curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = idx * barW;
      const y = yPos(p.elevation);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 5. Hour tick labels along X axis
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let hr = 0; hr <= 24; hr += 4) {
      const x = (hr / 24) * w;
      ctx.fillText(`${hr}:00`, x, h - 8);
    }

    // 6. Current Time indicator line & marker
    const currentFraction = (currentDate.getHours() + currentDate.getMinutes() / 60) / 24;
    const currentX = currentFraction * w;

    // Find elevation at current time
    const exactIndex = Math.min(n - 1, Math.max(0, Math.round(currentFraction * (n - 1))));
    const curElev = points[exactIndex]?.elevation || 0;
    const curY = yPos(curElev);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(currentX, paddingTop);
    ctx.lineTo(currentX, h - paddingBottom);
    ctx.stroke();

    // Pulsing dot at current elevation
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(currentX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(currentX, curY, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }, [dayWindow, currentDate]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <h3 className="font-serif text-base font-semibold text-slate-200">
            Daily Sun Path & Vitamin D Window
          </h3>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
          <span>Peak:</span>
          <span className="text-amber-400 font-bold">
            {dayWindow.maxElevation > 0 ? `+${dayWindow.maxElevation.toFixed(1)}°` : `${dayWindow.maxElevation.toFixed(1)}°`}
          </span>
          <span>at {dayWindow.solarNoonTime}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-[200px] bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden p-1">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>Vit-D Window (&ge;45°)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span>Sunlight (&lt;45°)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" />
            <span>Night</span>
          </span>
        </div>

        {/* Window Banner */}
        <div className="font-medium text-xs">
          {dayWindow.windowStart && dayWindow.windowEnd ? (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Window today: {dayWindow.windowStart} – {dayWindow.windowEnd}
            </span>
          ) : (
            <span className="text-amber-400/90">
              No window today (Peak: {dayWindow.maxElevation.toFixed(1)}° &lt; 45°)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
