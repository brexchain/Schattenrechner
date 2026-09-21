import React, { useRef, useState, useMemo, useCallback } from 'react';
import { NOTABLE_LOCATIONS } from '../data/continents';
import { projectGleason, unprojectGleason, Point2D, GLEASON_EQUATOR_RADIUS_RATIO } from '../utils/gleasonProjection';
import { SolarStatus } from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  MapPin,
  Compass,
  Eye,
  Building2,
  Hand,
  LocateFixed,
  FileText,
  Clock,
  Sparkles,
  Maximize2,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface GleasonMapProps {
  lat: number;
  lon: number;
  onLocationChange: (coords: { lat: number; lon: number; name?: string }) => void;
  solarStatus: SolarStatus;
  selectedCityName?: string;
}

export const GleasonMap: React.FC<GleasonMapProps> = ({
  lat,
  lon,
  onLocationChange,
  solarStatus,
  selectedCityName,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map visual style: 1892 vintage authentic ('As It Is') vs. modern clean vs. full patent broadsheet
  const [mapStyle, setMapStyle] = useState<'1892' | 'modern' | 'poster'>('1892');
  const [mapMode, setMapMode] = useState<'select' | 'pan'>('select');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });
  const [isPinDragging, setIsPinDragging] = useState(false);

  // Layer toggles
  const [showSun, setShowSun] = useState(true);
  const [showSolarArm, setShowSolarArm] = useState(true);
  const [showGridOverlays, setShowGridOverlays] = useState(false);
  const [showDaylight, setShowDaylight] = useState(true);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number; x: number; y: number } | null>(null);

  // Projection dimensions within SVG viewBox (0 0 800 800)
  const mapCenter: Point2D = useMemo(() => ({ x: 400, y: 400 }), []);
  const dialRadius = 390; // outer edge of brass 24h dial (viewBox has padding to 400)
  const innerMapRadius = dialRadius * (705 / 818); // ~336px: where map disk ends and outer dial begins

  // User's tagged pin coordinate on Gleason map
  const pinPos = useMemo(() => {
    return projectGleason(lat, lon, dialRadius, mapCenter);
  }, [lat, lon, dialRadius, mapCenter]);

  // Sun subsolar coordinate on Gleason map
  const sunPos = useMemo(() => {
    return projectGleason(
      solarStatus.subsolarPoint.lat,
      solarStatus.subsolarPoint.lon,
      dialRadius,
      mapCenter
    );
  }, [solarStatus.subsolarPoint.lat, solarStatus.subsolarPoint.lon, dialRadius, mapCenter]);

  // Find if currently tagged coordinate matches a notable city
  const matchedCity = useMemo(() => {
    return NOTABLE_LOCATIONS.find(
      (loc) => Math.abs(loc.lat - lat) < 0.25 && Math.abs(loc.lon - lon) < 0.25
    );
  }, [lat, lon]);

  const selectedDropdownValue = useMemo(() => {
    if (matchedCity) {
      return `${matchedCity.city}, ${matchedCity.country}`;
    }
    return '';
  }, [matchedCity]);

  // Gleason 1892 Patent Movable Time Indicator Arm
  // In the 1892 patent, a movable arm pivots around the North Pole and points to solar time on the rim
  const solarArmAngle = useMemo(() => {
    // Subsolar point longitude directly corresponds to the arm's angle from 12 o'clock
    // lon = 0 is vertically UP (12:00 solar noon)
    return solarStatus.subsolarPoint.lon;
  }, [solarStatus.subsolarPoint.lon]);

  // Convert client DOM pixels to SVG coordinates
  const clientToSvgCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 800 / rect.height;

    const rawSvgX = (clientX - rect.left) * scaleX;
    const rawSvgY = (clientY - rect.top) * scaleY;

    // Apply inverse pan & zoom transform
    const svgX = (rawSvgX - mapCenter.x - panOffset.x) / zoomLevel + mapCenter.x;
    const svgY = (rawSvgY - mapCenter.y - panOffset.y) / zoomLevel + mapCenter.y;

    return { x: svgX, y: svgY };
  }, [mapCenter, panOffset, zoomLevel]);

  // Zoom to a specific coordinate and center it in the viewport
  const zoomToPoint = useCallback((targetLat: number, targetLon: number, targetZoom: number) => {
    const targetPt = projectGleason(targetLat, targetLon, dialRadius, mapCenter);
    const newPan = {
      x: -(targetPt.x - mapCenter.x) * targetZoom,
      y: -(targetPt.y - mapCenter.y) * targetZoom,
    };
    setZoomLevel(targetZoom);
    setPanOffset(newPan);
  }, [dialRadius, mapCenter]);

  // Handle City selection from the Dropdown menu
  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const target = NOTABLE_LOCATIONS.find((loc) => `${loc.city}, ${loc.country}` === val);
    if (target) {
      onLocationChange({ lat: target.lat, lon: target.lon, name: `${target.city}, ${target.country}` });
      zoomToPoint(target.lat, target.lon, Math.max(2.4, zoomLevel));
    }
  };

  // Pointer interactions
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.shiftKey || e.altKey || mapMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    if (e.button === 0) {
      setIsPinDragging(true);
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const coords = clientToSvgCoords(e.clientX, e.clientY);
      if (coords) {
        const geo = unprojectGleason(coords, dialRadius, mapCenter);
        onLocationChange(geo);
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const coords = clientToSvgCoords(e.clientX, e.clientY);
    if (coords) {
      const geo = unprojectGleason(coords, dialRadius, mapCenter);
      setHoverCoords({ lat: geo.lat, lon: geo.lon, x: coords.x, y: coords.y });
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isPinDragging && coords) {
      const geo = unprojectGleason(coords, dialRadius, mapCenter);
      onLocationChange(geo);
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) setIsPanning(false);
    if (isPinDragging) setIsPinDragging(false);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.3 : -0.3;
    setZoomLevel((prev) => Math.min(5.5, Math.max(0.85, Number((prev + zoomDelta).toFixed(2)))));
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(5.5, Math.max(0.85, Number((prev + delta).toFixed(2)))));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCenterOnPin = () => {
    zoomToPoint(lat, lon, Math.max(2.5, zoomLevel));
  };

  // Regional Zoom Presets
  const REGION_PRESETS = [
    { label: 'World', icon: '🌐', lat: 90, lon: 0, zoom: 1.0 },
    { label: 'Europe', icon: '🇪🇺', lat: 50, lon: 15, zoom: 2.8 },
    { label: 'N. America', icon: '🇺🇸', lat: 42, lon: -98, zoom: 2.3 },
    { label: 'Asia', icon: '🌏', lat: 42, lon: 95, zoom: 2.3 },
    { label: 'Africa', icon: '🌍', lat: 4, lon: 22, zoom: 2.3 },
    { label: 'S. America', icon: '🌎', lat: -18, lon: -60, zoom: 2.3 },
    { label: 'Australia', icon: '🦘', lat: -26, lon: 135, zoom: 2.6 },
  ];

  return (
    <div className="relative flex flex-col bg-slate-900/95 border border-amber-900/50 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md text-slate-100 overflow-hidden">
      {/* Top Header & Map Style Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-10 border-b border-amber-900/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif text-lg font-bold tracking-wide text-amber-200">
              Gleason's New Standard Map of the World
            </h2>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40 font-bold uppercase tracking-wider">
              "AS IT IS" (1892)
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Authentic historical Alexander Gleason cartography with polar azimuthal equidistant projection, rotating 24h solar indicator arm, and interactive coordinate calculation.
          </p>
        </div>

        {/* Map Style Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-amber-900/60 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMapStyle('1892')}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold flex items-center gap-1.5 transition-all ${
              mapStyle === '1892'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1892 Original "As It Is"</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('modern')}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold flex items-center gap-1.5 transition-all ${
              mapStyle === 'modern'
                ? 'bg-sky-600/30 text-sky-200 border border-sky-500/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Modern Flat Earth</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('poster')}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold flex items-center gap-1.5 transition-all ${
              mapStyle === 'poster'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Full Patent Broadsheet</span>
          </button>
        </div>
      </div>

      {/* View & Navigation Control Bar */}
      {mapStyle !== 'poster' && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 z-10">
          {/* Interaction Mode: Select Pin vs Pan */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/70 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMapMode('select')}
              title="Click or drag anywhere to place coordinate pin"
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                mapMode === 'select'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Select Location</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('pan')}
              title="Drag anywhere to pan map"
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                mapMode === 'pan'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Pan Map</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

            {/* Overlays */}
            <button
              type="button"
              onClick={() => setShowSolarArm(!showSolarArm)}
              title="Toggle Gleason 1892 Movable Solar Indicator Arm"
              className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                showSolarArm ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">24h Arm</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGridOverlays(!showGridOverlays)}
              title="Toggle Equator & 45° Latitude Guideline Overlay"
              className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                showGridOverlays ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid Rings</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSun(!showSun)}
              title="Toggle Subsolar Zenith Point"
              className={`p-1.5 text-xs rounded font-medium transition-colors ${
                showSun ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowDaylight(!showDaylight)}
              title="Toggle Daylight Glow"
              className={`p-1.5 text-xs rounded font-medium transition-colors ${
                showDaylight ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Buttons & Reset */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/70 rounded-lg p-1">
            <span className="text-[10px] font-mono text-amber-300 px-1.5 py-0.5">
              {zoomLevel.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.35)}
              title="Zoom In"
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.35)}
              title="Zoom Out"
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCenterOnPin}
              title="Zoom directly to tagged Pin"
              className="p-1 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/50 rounded transition-colors"
            >
              <LocateFixed className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              title="Reset View"
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dedicated City Selection Drop Down Menu */}
      {mapStyle !== 'poster' && (
        <div className="mb-3 bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 shrink-0">
            <Building2 className="w-4 h-4 text-amber-400" />
            <label htmlFor="gleason-city-dropdown" className="cursor-pointer">
              Select City / Location:
            </label>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <select
              id="gleason-city-dropdown"
              value={selectedDropdownValue}
              onChange={handleDropdownSelect}
              className="w-full bg-slate-900 border border-slate-600 hover:border-amber-500/60 focus:border-amber-400 text-slate-100 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="">
                {matchedCity
                  ? `📍 ${matchedCity.city}, ${matchedCity.country}`
                  : `🎯 Custom Pinned (${lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}, ${lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`})`}
              </option>
              <optgroup label="⭐ World Capitals">
                {NOTABLE_LOCATIONS.filter((l) => l.isCapital).map((loc) => (
                  <option key={`${loc.city}-${loc.country}`} value={`${loc.city}, ${loc.country}`}>
                    {loc.city}, {loc.country} ({loc.lat >= 0 ? `${loc.lat.toFixed(1)}°N` : `${Math.abs(loc.lat).toFixed(1)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(1)}°E` : `${Math.abs(loc.lon).toFixed(1)}°W`})
                  </option>
                ))}
              </optgroup>
              <optgroup label="🏙️ Major Metropolises & Landmarks">
                {NOTABLE_LOCATIONS.filter((l) => !l.isCapital).map((loc) => (
                  <option key={`${loc.city}-${loc.country}`} value={`${loc.city}, ${loc.country}`}>
                    {loc.city}, {loc.country} ({loc.lat >= 0 ? `${loc.lat.toFixed(1)}°N` : `${Math.abs(loc.lat).toFixed(1)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(1)}°E` : `${Math.abs(loc.lon).toFixed(1)}°W`})
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCenterOnPin}
            title="Center view on currently pinned location"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <LocateFixed className="w-3.5 h-3.5 text-amber-400" />
            <span>Center Pin</span>
          </button>
        </div>
      )}

      {/* Regional Zoom Presets Bar */}
      {mapStyle !== 'poster' && (
        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1 mr-1">
            <ZoomIn className="w-3 h-3 text-amber-400" />
            Zoom Preset:
          </span>
          {REGION_PRESETS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => {
                if (r.zoom === 1.0) {
                  handleResetView();
                } else {
                  zoomToPoint(r.lat, r.lon, r.zoom);
                }
              }}
              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 hover:border-amber-500/40 text-slate-300 hover:text-white whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleCenterOnPin}
            className="px-2 py-1 rounded bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 whitespace-nowrap transition-all flex items-center gap-1 text-[11px] font-semibold ml-auto"
          >
            <LocateFixed className="w-3 h-3" />
            <span>Center Pin</span>
          </button>
        </div>
      )}

      {/* Poster Mode Display (Full 1892 Original Broadsheet with Solstice Diagrams & Instructions) */}
      {mapStyle === 'poster' ? (
        <div className="relative w-full max-w-[700px] mx-auto rounded-xl bg-amber-950/30 border border-amber-700/50 p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-2 px-1 text-xs">
            <div className="flex items-center gap-1.5 text-amber-200 font-serif font-bold">
              <span>Original Patent Broadsheet (Alexander Gleason, Buffalo N.Y., 1892)</span>
            </div>
            <button
              type="button"
              onClick={() => setMapStyle('1892')}
              className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500 text-amber-200 text-xs rounded font-medium flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Back to Interactive Map</span>
            </button>
          </div>
          <div className="overflow-auto max-h-[640px] rounded-lg border border-amber-900/70 bg-black/80 flex justify-center">
            <img
              src="/gleason_hires.jpg"
              alt="Gleason's New Standard Map of the World 1892 As It Is - Original Patent Broadsheet"
              className="w-full h-auto object-contain max-w-[1200px]"
            />
          </div>
          <p className="text-[11px] text-amber-300/80 mt-2 text-center italic">
            "On the projection of J. S. Christopher, Modern College, Blackheath, England; Scientifically and Practically Correct; As 'IT IS.'"
          </p>
        </div>
      ) : (
        /* Circular Gleason Map Stage */
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className={`relative w-full aspect-square max-w-[650px] mx-auto rounded-full bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(0,0,0,0.8)] border-4 border-amber-900/80 select-none overflow-hidden touch-none group ${
            mapMode === 'select' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 800 800"
            className="w-full h-full"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <defs>
              {/* Sun Glow Filter */}
              <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#ea580c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>

              {/* Daylight Hemisphere Projection Disc */}
              <radialGradient
                id="daylightHemisphere"
                cx={sunPos.x}
                cy={sunPos.y}
                r={innerMapRadius * 1.1}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.32" />
                <stop offset="45%" stopColor="#fde68a" stopOpacity="0.14" />
                <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>

              {/* Drop Shadow for Pin & Labels */}
              <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Transform Group for Smooth Pan & Zoom */}
            <g transform={`translate(${mapCenter.x + panOffset.x}, ${mapCenter.y + panOffset.y}) scale(${zoomLevel}) translate(${-mapCenter.x}, ${-mapCenter.y})`}>
              {/* BASE LAYER: The Authentic Gleason Map Image */}
              {mapStyle === '1892' ? (
                /* Authentic 1892 Alexander Gleason "As It Is" High-Res Map */
                <image
                  href="/gleason_1892_circle.webp"
                  x={mapCenter.x - dialRadius}
                  y={mapCenter.y - dialRadius}
                  width={dialRadius * 2}
                  height={dialRadius * 2}
                  preserveAspectRatio="xMidYMid meet"
                  className="select-none pointer-events-none"
                />
              ) : (
                /* Modern Clean Flat Earth Map */
                <g>
                  {/* Deep Ocean Backdrop */}
                  <circle cx={mapCenter.x} cy={mapCenter.y} r={dialRadius} fill="#0a192f" />
                  <image
                    href="/flat_earth.webp"
                    x={mapCenter.x - dialRadius}
                    y={mapCenter.y - dialRadius}
                    width={dialRadius * 2}
                    height={dialRadius * 2}
                    preserveAspectRatio="xMidYMid meet"
                    className="select-none pointer-events-none"
                  />
                  {/* Brass Outer Border Rim */}
                  <circle
                    cx={mapCenter.x}
                    cy={mapCenter.y}
                    r={dialRadius}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="8"
                    strokeOpacity="0.75"
                  />
                </g>
              )}

              {/* Daylight Illumination Overlay */}
              {showDaylight && (
                <circle
                  cx={mapCenter.x}
                  cy={mapCenter.y}
                  r={innerMapRadius}
                  fill="url(#daylightHemisphere)"
                  className="pointer-events-none mix-blend-screen"
                />
              )}

              {/* Optional Reference Grid Rings (Equator & 45° Latitude Threshold) */}
              {showGridOverlays && (
                <g className="pointer-events-none">
                  {/* Equator (0° Lat) */}
                  <circle
                    cx={mapCenter.x}
                    cy={mapCenter.y}
                    r={dialRadius * GLEASON_EQUATOR_RADIUS_RATIO}
                    fill="none"
                    stroke="rgba(245, 158, 11, 0.7)"
                    strokeWidth="2"
                  />
                  <text
                    x={mapCenter.x + 4}
                    y={mapCenter.y - dialRadius * GLEASON_EQUATOR_RADIUS_RATIO - 4}
                    fill="#f59e0b"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    0° Equator
                  </text>

                  {/* 45° N Vitamin D Threshold Line */}
                  <circle
                    cx={mapCenter.x}
                    cy={mapCenter.y}
                    r={(dialRadius * GLEASON_EQUATOR_RADIUS_RATIO * 45) / 90}
                    fill="none"
                    stroke="rgba(74, 222, 128, 0.85)"
                    strokeWidth="1.8"
                    strokeDasharray="4,3"
                  />
                  <text
                    x={mapCenter.x + 4}
                    y={mapCenter.y - (dialRadius * GLEASON_EQUATOR_RADIUS_RATIO * 45) / 90 - 4}
                    fill="#4ade80"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    45°N (Winter Threshold)
                  </text>

                  {/* Tropic of Cancer 23.5°N */}
                  <circle
                    cx={mapCenter.x}
                    cy={mapCenter.y}
                    r={(dialRadius * GLEASON_EQUATOR_RADIUS_RATIO * (90 - 23.5)) / 90}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.5)"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />

                  {/* Tropic of Capricorn 23.5°S */}
                  <circle
                    cx={mapCenter.x}
                    cy={mapCenter.y}
                    r={(dialRadius * GLEASON_EQUATOR_RADIUS_RATIO * (90 + 23.5)) / 90}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.5)"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                </g>
              )}

              {/* Gleason 1892 Movable Time Indicator Arm */}
              {showSolarArm && (
                <g transform={`rotate(${solarArmAngle}, ${mapCenter.x}, ${mapCenter.y})`} className="pointer-events-none">
                  {/* Brass Solar Longitude Arm Pointer */}
                  <line
                    x1={mapCenter.x}
                    y1={mapCenter.y}
                    x2={mapCenter.x}
                    y2={mapCenter.y - dialRadius}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeOpacity="0.85"
                  />
                  <line
                    x1={mapCenter.x}
                    y1={mapCenter.y}
                    x2={mapCenter.x}
                    y2={mapCenter.y - dialRadius}
                    stroke="#fef08a"
                    strokeWidth="1"
                    strokeOpacity="0.95"
                  />
                  {/* Outer Solar Dial Pointer Arrow */}
                  <polygon
                    points={`${mapCenter.x},${mapCenter.y - dialRadius - 2} ${mapCenter.x - 5},${mapCenter.y - dialRadius + 12} ${mapCenter.x + 5},${mapCenter.y - dialRadius + 12}`}
                    fill="#fbbf24"
                    stroke="#78350f"
                    strokeWidth="1"
                  />
                  {/* Solar Noon Indicator Label on Arm */}
                  <g transform={`translate(${mapCenter.x + 6}, ${mapCenter.y - dialRadius * 0.7})`}>
                    <rect x="-2" y="-9" width="62" height="13" rx="2" fill="rgba(15, 23, 42, 0.85)" stroke="#f59e0b" strokeWidth="0.6" />
                    <text x="2" y="1" fill="#fef08a" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                      SOLAR NOON
                    </text>
                  </g>
                </g>
              )}

              {/* Subsolar Point Marker (Live Overhead Sun Zenith) */}
              {showSun && (
                <g
                  transform={`translate(${sunPos.x}, ${sunPos.y})`}
                  className="pointer-events-none transition-all duration-300"
                >
                  <circle cx="0" cy="0" r="28" fill="url(#sunGlowGrad)" />
                  <circle cx="0" cy="0" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line
                      key={angle}
                      x1="0"
                      y1="-9"
                      x2="0"
                      y2="-15"
                      stroke="#f59e0b"
                      strokeWidth="1.8"
                      transform={`rotate(${angle})`}
                    />
                  ))}
                  <g transform="translate(14, 4)" filter="url(#pinShadow)">
                    <rect x="-2" y="-9" width="84" height="13" rx="2.5" fill="rgba(15, 23, 42, 0.9)" stroke="#f59e0b" strokeWidth="0.8" />
                    <text x="2" y="1" fill="#fef08a" fontSize="7.2" fontWeight="bold" fontFamily="sans-serif">
                      Sun Zenith ({solarStatus.subsolarPoint.lat.toFixed(1)}°)
                    </text>
                  </g>
                </g>
              )}

              {/* Hover Crosshair in Select Mode */}
              {mapMode === 'select' && hoverCoords && (
                <g transform={`translate(${hoverCoords.x}, ${hoverCoords.y})`} className="pointer-events-none">
                  <circle cx="0" cy="0" r={Math.max(4, 7 / zoomLevel)} fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1={-12 / zoomLevel} y1="0" x2={12 / zoomLevel} y2="0" stroke="#38bdf8" strokeWidth="0.8" />
                  <line x1="0" y1={-12 / zoomLevel} x2="0" y2={12 / zoomLevel} stroke="#38bdf8" strokeWidth="0.8" />
                </g>
              )}

              {/* User Tagged Pin Marker */}
              <g
                transform={`translate(${pinPos.x}, ${pinPos.y})`}
                className="pointer-events-none"
                filter="url(#pinShadow)"
              >
                <circle
                  cx="0"
                  cy="0"
                  r="16"
                  fill="rgba(34, 197, 94, 0.25)"
                  stroke="#22c55e"
                  strokeWidth="1.2"
                  className="animate-ping origin-center"
                />
                <circle cx="0" cy="0" r="6" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
                {/* Flag Pin */}
                <path d="M 0 0 L 0 -24 L 16 -18 L 0 -11 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2="-24" stroke="#ffffff" strokeWidth="1.5" />

                {/* Coordinate Readout Tooltip */}
                <rect
                  x="-50"
                  y="-42"
                  width="100"
                  height="15"
                  rx="3.5"
                  fill="rgba(15, 23, 42, 0.95)"
                  stroke="#22c55e"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="-31"
                  textAnchor="middle"
                  fill="#86efac"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`},{' '}
                  {lon >= 0 ? `${lon.toFixed(1)}°E` : `${Math.abs(lon).toFixed(1)}°W`}
                </text>
              </g>

              {/* North Pole Center Pivot */}
              <circle cx={mapCenter.x} cy={mapCenter.y} r={4.5} fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
            </g>
          </svg>

          {/* Floating Coordinate Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-md pointer-events-none z-20">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">{selectedCityName || 'Tagged Location'}:</span>
              <span className="font-mono text-emerald-300 font-semibold">
                {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`},{' '}
                {lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`}
              </span>
            </div>
            {hoverCoords && (
              <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-700 text-sky-300 text-[11px] font-mono">
                <span>Cursor:</span>
                <span>{hoverCoords.lat >= 0 ? `${hoverCoords.lat.toFixed(1)}°N` : `${Math.abs(hoverCoords.lat).toFixed(1)}°S`},</span>
                <span>{hoverCoords.lon >= 0 ? `${hoverCoords.lon.toFixed(1)}°E` : `${Math.abs(hoverCoords.lon).toFixed(1)}°W`}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
