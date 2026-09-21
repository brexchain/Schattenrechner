import React from 'react';
import { NOTABLE_LOCATIONS, MajorCity } from '../data/continents';
import { MapPin, Navigation, Clock, CalendarDays, RefreshCw } from 'lucide-react';

interface CoordinatePanelProps {
  lat: number;
  lon: number;
  onLatChange: (lat: number) => void;
  onLonChange: (lon: number) => void;
  onCitySelect: (city: MajorCity) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
  geoStatusMessage: string | null;
  selectedCityName?: string;
  isLive: boolean;
  onToggleLive: (live: boolean) => void;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  onResetToNow: () => void;
}

export const CoordinatePanel: React.FC<CoordinatePanelProps> = ({
  lat,
  lon,
  onLatChange,
  onLonChange,
  onCitySelect,
  onUseGeolocation,
  geoLoading,
  geoStatusMessage,
  selectedCityName,
  isLive,
  onToggleLive,
  selectedDate,
  onDateChange,
  onResetToNow,
}) => {
  // Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateInputValue = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(
    selectedDate.getDate()
  )}T${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h3 className="font-serif text-base font-semibold text-slate-200">
            Coordinates & Time Settings
          </h3>
        </div>
        {selectedCityName && (
          <span className="text-xs bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
            {selectedCityName}
          </span>
        )}
      </div>

      {/* Preset City Dropdown */}
      <div>
        <label htmlFor="city-select" className="block text-xs font-semibold text-slate-400 mb-1">
          Select City / Landmark Preset
        </label>
        {(() => {
          const matchedIdx = NOTABLE_LOCATIONS.findIndex(
            (loc) => Math.abs(loc.lat - lat) < 0.25 && Math.abs(loc.lon - lon) < 0.25
          );
          return (
            <select
              id="city-select"
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              value={matchedIdx !== -1 ? String(matchedIdx) : ''}
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (!isNaN(idx) && NOTABLE_LOCATIONS[idx]) {
                  onCitySelect(NOTABLE_LOCATIONS[idx]);
                }
              }}
            >
              <option value="" disabled>
                {matchedIdx !== -1 ? '– Choose location from list –' : '📍 Custom Coordinate Location'}
              </option>
              <optgroup label="⭐ World Capitals">
                {NOTABLE_LOCATIONS.map((loc, idx) =>
                  loc.isCapital ? (
                    <option key={`${loc.city}-${idx}`} value={idx}>
                      {loc.city}, {loc.country} ({loc.lat >= 0 ? `${loc.lat.toFixed(2)}°N` : `${Math.abs(loc.lat).toFixed(2)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(2)}°E` : `${Math.abs(loc.lon).toFixed(2)}°W`})
                    </option>
                  ) : null
                )}
              </optgroup>
              <optgroup label="🏙️ Major Metropolises & Landmarks">
                {NOTABLE_LOCATIONS.map((loc, idx) =>
                  !loc.isCapital ? (
                    <option key={`${loc.city}-${idx}`} value={idx}>
                      {loc.city}, {loc.country} ({loc.lat >= 0 ? `${loc.lat.toFixed(2)}°N` : `${Math.abs(loc.lat).toFixed(2)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(2)}°E` : `${Math.abs(loc.lon).toFixed(2)}°W`})
                    </option>
                  ) : null
                )}
              </optgroup>
            </select>
          );
        })()}
      </div>

      {/* Latitude & Longitude Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lat-input" className="block text-xs font-semibold text-slate-400 mb-1">
            Latitude (-85° to +90°)
          </label>
          <div className="relative">
            <input
              id="lat-input"
              type="number"
              step="0.0001"
              min="-85"
              max="90"
              value={Number(lat.toFixed(4))}
              onChange={(e) => onLatChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
              {lat >= 0 ? '°N' : '°S'}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="lon-input" className="block text-xs font-semibold text-slate-400 mb-1">
            Longitude (-180° to +180°)
          </label>
          <div className="relative">
            <input
              id="lon-input"
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              value={Number(lon.toFixed(4))}
              onChange={(e) => onLonChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
              {lon >= 0 ? '°E' : '°W'}
            </span>
          </div>
        </div>
      </div>

      {/* Geolocation Button & Feedback */}
      <div>
        <button
          type="button"
          onClick={onUseGeolocation}
          disabled={geoLoading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          <span>{geoLoading ? 'Detecting GPS coordinates…' : 'Use My Exact GPS Location'}</span>
        </button>
        {geoStatusMessage && (
          <p className="text-[11px] text-slate-400 mt-1.5 text-center">{geoStatusMessage}</p>
        )}
      </div>

      <div className="h-[1px] bg-slate-800" />

      {/* Time & Date Controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Time Mode
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isLive}
              onChange={(e) => onToggleLive(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-800 text-emerald-500 focus:ring-emerald-500 border-slate-700"
            />
            <span className={isLive ? 'text-emerald-400 font-semibold' : ''}>
              Live Real-Time
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="datetime-local"
              value={dateInputValue}
              disabled={isLive}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(new Date(e.target.value));
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono rounded-xl px-3 py-2 disabled:opacity-50 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={onResetToNow}
            title="Reset to current moment"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
