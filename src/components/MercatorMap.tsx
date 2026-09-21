import React, { useRef, useState, useMemo, useCallback } from 'react';
import { NOTABLE_LOCATIONS, CONTINENTS, CONTINENT_LABELS } from '../data/continents';
import {
  projectMercator,
  unprojectMercator,
  polygonToMercatorPath,
  getMercatorNightPath,
  MERCATOR_MAX_LAT,
  Point2D,
} from '../utils/mercatorProjection';
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
  Layers,
  ChevronDown,
  Globe2,
} from 'lucide-react';

interface MercatorMapProps {
  lat: number;
  lon: number;
  onLocationChange: (coords: { lat: number; lon: number; name?: string }) => void;
  solarStatus: SolarStatus;
  selectedCityName?: string;
}

export const MercatorMap: React.FC<MercatorMapProps> = ({
  lat,
  lon,
  onLocationChange,
  solarStatus,
  selectedCityName,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map visual style: modern cartographic dark vs. nautical vintage vs. blueprint
  const [mapStyle, setMapStyle] = useState<'navy' | 'nautical' | 'slate'>('navy');
  const [mapMode, setMapMode] = useState<'select' | 'pan'>('select');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });
  const [isPinDragging, setIsPinDragging] = useState(false);

  // Layer toggles
  const [showSun, setShowSun] = useState(true);
  const [showDaylight, setShowDaylight] = useState(true);
  const [showGridOverlays, setShowGridOverlays] = useState(true);
  const [showVitDBands, setShowVitDBands] = useState(true);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number; x: number; y: number } | null>(null);

  // Mercator Canvas Dimensions
  const mapWidth = 840;
  const mapHeight = 500;
  const mapCenter: Point2D = useMemo(() => ({ x: mapWidth / 2, y: mapHeight / 2 }), []);

  // Tagged Pin Position
  const pinPos = useMemo(() => {
    return projectMercator(lat, lon, mapWidth, mapHeight, MERCATOR_MAX_LAT);
  }, [lat, lon, mapWidth, mapHeight]);

  // Subsolar Point Zenith Position
  const sunPos = useMemo(() => {
    return projectMercator(
      solarStatus.subsolarPoint.lat,
      solarStatus.subsolarPoint.lon,
      mapWidth,
      mapHeight,
      MERCATOR_MAX_LAT
    );
  }, [solarStatus.subsolarPoint, mapWidth, mapHeight]);

  // Day/Night Solar Terminator Night Path
  const nightPathD = useMemo(() => {
    return getMercatorNightPath(
      solarStatus.subsolarPoint.lat,
      solarStatus.subsolarPoint.lon,
      mapWidth,
      mapHeight,
      MERCATOR_MAX_LAT
    );
  }, [solarStatus.subsolarPoint, mapWidth, mapHeight]);

  // Pre-project Continent Polygons into SVG Paths
  const continentPaths = useMemo(() => {
    return CONTINENTS.map((cont) => ({
      name: cont.name,
      d: polygonToMercatorPath(cont.points, mapWidth, mapHeight, MERCATOR_MAX_LAT),
    }));
  }, [mapWidth, mapHeight]);

  // Pre-project Antarctica baseline if needed
  const antarcticaPath = useMemo(() => {
    const pts: Point2D[] = [];
    const maxLat = MERCATOR_MAX_LAT;
    const antarcticCoast = [
      { lon: -180, lat: -72 },
      { lon: -140, lat: -74 },
      { lon: -100, lat: -72 },
      { lon: -60, lat: -64 },
      { lon: -20, lat: -70 },
      { lon: 0, lat: -69 },
      { lon: 30, lat: -68 },
      { lon: 70, lat: -66 },
      { lon: 100, lat: -65 },
      { lon: 130, lat: -66 },
      { lon: 160, lat: -70 },
      { lon: 180, lat: -72 },
    ];

    antarcticCoast.forEach((c) => {
      pts.push(projectMercator(c.lat, c.lon, mapWidth, mapHeight, maxLat));
    });

    let d = `M 0 ${mapHeight}`;
    d += ` L 0 ${pts[0].y.toFixed(1)}`;
    pts.forEach((p) => {
      d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    });
    d += ` L ${mapWidth} ${mapHeight} Z`;
    return d;
  }, [mapWidth, mapHeight]);

  // Graticule Lines (Meridians and Parallels)
  const parallels = useMemo(() => {
    const lats = [-60, -45, -30, -23.44, 0, 23.44, 30, 45, 60];
    return lats.map((pLat) => {
      const { y } = projectMercator(pLat, 0, mapWidth, mapHeight, MERCATOR_MAX_LAT);
      return { lat: pLat, y };
    });
  }, [mapWidth, mapHeight]);

  const meridians = useMemo(() => {
    const lons = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
    return lons.map((pLon) => {
      const { x } = projectMercator(0, pLon, mapWidth, mapHeight, MERCATOR_MAX_LAT);
      return { lon: pLon, x };
    });
  }, [mapWidth, mapHeight]);

  // 45° Vitamin D Threshold Y-Coordinates
  const vitDNorthY = useMemo(
    () => projectMercator(45, 0, mapWidth, mapHeight, MERCATOR_MAX_LAT).y,
    [mapWidth, mapHeight]
  );
  const vitDSouthY = useMemo(
    () => projectMercator(-45, 0, mapWidth, mapHeight, MERCATOR_MAX_LAT).y,
    [mapWidth, mapHeight]
  );
  const equatorY = useMemo(
    () => projectMercator(0, 0, mapWidth, mapHeight, MERCATOR_MAX_LAT).y,
    [mapWidth, mapHeight]
  );

  // Zoom handling
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel((prev) => Math.min(6, Math.max(1, prev + delta)));
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Smooth Center on Pin
  const handleCenterOnPin = useCallback(() => {
    const targetZoom = Math.max(2.2, zoomLevel);
    setZoomLevel(targetZoom);
    setPanOffset({
      x: (mapCenter.x - pinPos.x) * targetZoom,
      y: (mapCenter.y - pinPos.y) * targetZoom,
    });
  }, [zoomLevel, mapCenter, pinPos]);

  // Screen to SVG Coordinate Mapping
  const screenToSvg = useCallback((clientX: number, clientY: number): Point2D => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const viewBoxX = ((clientX - rect.left) / rect.width) * mapWidth;
    const viewBoxY = ((clientY - rect.top) / rect.height) * mapHeight;
    return { x: viewBoxX, y: viewBoxY };
  }, [mapWidth, mapHeight]);

  // Convert SVG Point into Map-Space Coordinates (accounting for Pan & Zoom)
  const svgToMapCoords = useCallback(
    (svgPt: Point2D): Point2D => {
      const translatedX = svgPt.x - mapCenter.x - panOffset.x;
      const translatedY = svgPt.y - mapCenter.y - panOffset.y;
      const unscaledX = translatedX / zoomLevel + mapCenter.x;
      const unscaledY = translatedY / zoomLevel + mapCenter.y;
      return { x: unscaledX, y: unscaledY };
    },
    [mapCenter, panOffset, zoomLevel]
  );

  // Handle Pointer Down for Map Click / Pan / Pin Drag
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svgPt = screenToSvg(e.clientX, e.clientY);
    const mapPt = svgToMapCoords(svgPt);

    const distToPin = Math.hypot(mapPt.x - pinPos.x, mapPt.y - pinPos.y);

    if (distToPin < 18 / zoomLevel) {
      setIsPinDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    if (mapMode === 'pan' || e.shiftKey || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    // Direct Click to Move Pin
    if (mapPt.x >= 0 && mapPt.x <= mapWidth && mapPt.y >= 0 && mapPt.y <= mapHeight) {
      const newCoords = unprojectMercator(mapPt.x, mapPt.y, mapWidth, mapHeight, MERCATOR_MAX_LAT);
      onLocationChange(newCoords);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svgPt = screenToSvg(e.clientX, e.clientY);
    const mapPt = svgToMapCoords(svgPt);

    if (mapPt.x >= 0 && mapPt.x <= mapWidth && mapPt.y >= 0 && mapPt.y <= mapHeight) {
      const c = unprojectMercator(mapPt.x, mapPt.y, mapWidth, mapHeight, MERCATOR_MAX_LAT);
      setHoverCoords({ ...c, x: svgPt.x, y: svgPt.y });
    } else {
      setHoverCoords(null);
    }

    if (isPinDragging) {
      const clampedX = Math.max(0, Math.min(mapWidth, mapPt.x));
      const clampedY = Math.max(0, Math.min(mapHeight, mapPt.y));
      const newCoords = unprojectMercator(clampedX, clampedY, mapWidth, mapHeight, MERCATOR_MAX_LAT);
      onLocationChange(newCoords);
      return;
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsPinDragging(false);
    setIsPanning(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    handleZoom(delta);
  };

  // City Matching for Dropdown
  const matchedCity = useMemo(() => {
    return NOTABLE_LOCATIONS.find(
      (c) => Math.abs(c.lat - lat) < 0.25 && Math.abs(c.lon - lon) < 0.25
    );
  }, [lat, lon]);

  const selectedDropdownValue = matchedCity
    ? `${matchedCity.city}, ${matchedCity.country}`
    : '';

  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const found = NOTABLE_LOCATIONS.find((c) => `${c.city}, ${c.country}` === val);
    if (found) {
      onLocationChange({ lat: found.lat, lon: found.lon, name: `${found.city}, ${found.country}` });
      const targetPos = projectMercator(found.lat, found.lon, mapWidth, mapHeight, MERCATOR_MAX_LAT);
      const targetZoom = 2.4;
      setZoomLevel(targetZoom);
      setPanOffset({
        x: (mapCenter.x - targetPos.x) * targetZoom,
        y: (mapCenter.y - targetPos.y) * targetZoom,
      });
    }
  };

  // Theme palettes
  const themeColors = useMemo(() => {
    switch (mapStyle) {
      case 'nautical':
        return {
          ocean: '#1e293b',
          oceanPattern: '#0f172a',
          landFill: '#334155',
          landStroke: '#64748b',
          graticule: 'rgba(148, 163, 184, 0.2)',
          equator: '#f59e0b',
          vitDLine: '#4ade80',
          nightOverlay: 'rgba(15, 23, 42, 0.55)',
          border: 'border-amber-900/50',
        };
      case 'slate':
        return {
          ocean: '#090d16',
          oceanPattern: '#0f172a',
          landFill: '#1e293b',
          landStroke: '#475569',
          graticule: 'rgba(100, 116, 139, 0.2)',
          equator: '#fbbf24',
          vitDLine: '#22c55e',
          nightOverlay: 'rgba(3, 7, 18, 0.6)',
          border: 'border-slate-800',
        };
      case 'navy':
      default:
        return {
          ocean: '#061325',
          oceanPattern: '#0a1d37',
          landFill: '#132742',
          landStroke: '#254b77',
          graticule: 'rgba(56, 189, 248, 0.15)',
          equator: '#f59e0b',
          vitDLine: '#4ade80',
          nightOverlay: 'rgba(3, 10, 24, 0.58)',
          border: 'border-sky-900/40',
        };
    }
  }, [mapStyle]);

  return (
    <div
      ref={containerRef}
      id="mercator-map-container"
      className="bg-slate-900/95 border-2 border-sky-500/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden backdrop-blur-sm"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              World Map (Mercator Conformal Projection)
            </h3>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-500/40 font-bold uppercase tracking-wider">
              Live Sun &amp; Day/Night
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click or drag anywhere to position coordinates, with the critical 45° Vitamin D boundary and real-time day/night solar terminator wave.
          </p>
        </div>

        {/* Live Subsolar Coordinate Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 shrink-0 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-slate-400">Sun Zenith:</span>
          <span className="font-mono font-bold text-amber-300">
            {solarStatus.subsolarPoint.lat >= 0
              ? `${solarStatus.subsolarPoint.lat.toFixed(2)}°N`
              : `${Math.abs(solarStatus.subsolarPoint.lat).toFixed(2)}°S`}
            ,{' '}
            {solarStatus.subsolarPoint.lon >= 0
              ? `${solarStatus.subsolarPoint.lon.toFixed(2)}°E`
              : `${Math.abs(solarStatus.subsolarPoint.lon).toFixed(2)}°W`}
          </span>
        </div>
      </div>

      {/* View & Navigation Control Bar */}
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
                ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50 shadow-sm'
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
            onClick={() => setShowVitDBands(!showVitDBands)}
            title="Toggle ±45° Vitamin D Critical Threshold Latitude Lines"
            className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
              showVitDBands ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="hidden sm:inline">45° Vit D Lines</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGridOverlays(!showGridOverlays)}
            title="Toggle Latitude & Longitude Graticule"
            className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
              showGridOverlays ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Graticule</span>
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
            title="Toggle Day/Night Terminator Shadow"
            className={`p-1.5 text-xs rounded font-medium transition-colors ${
              showDaylight ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Buttons & Reset */}
        <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/70 rounded-lg p-1">
          <span className="text-[10px] font-mono text-sky-300 px-1.5 py-0.5">
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

      {/* Dedicated City Selection Drop Down Menu */}
      <div className="mb-3 bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 shrink-0">
          <Building2 className="w-4 h-4 text-sky-400" />
          <label htmlFor="mercator-city-dropdown" className="cursor-pointer">
            Select City / Location:
          </label>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <select
            id="mercator-city-dropdown"
            value={selectedDropdownValue}
            onChange={handleDropdownSelect}
            className="w-full bg-slate-900 border border-slate-600 hover:border-sky-500/60 focus:border-sky-400 text-slate-100 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="">
              {matchedCity
                ? `📍 ${matchedCity.city}, ${matchedCity.country}`
                : `🎯 Custom Pinned (${lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}, ${lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`})`}
            </option>
            <optgroup label="⭐ World Capitals">
              {NOTABLE_LOCATIONS.filter((l) => l.isCapital).map((loc) => (
                <option key={`${loc.city}-${loc.country}`} value={`${loc.city}, ${loc.country}`}>
                  {loc.city}, {loc.country} ({loc.lat >= 0 ? `${loc.lat.toFixed(2)}°N` : `${Math.abs(loc.lat).toFixed(2)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(2)}°E` : `${Math.abs(loc.lon).toFixed(2)}°W`})
                </option>
              ))}
            </optgroup>
            <optgroup label="🏙️ Major Metropolises & Landmarks">
              {NOTABLE_LOCATIONS.filter((l) => !l.isCapital).map((loc) => (
                <option key={`${loc.city}-${loc.country}`} value={`${loc.city}, ${loc.country}`}>
                  {loc.city}, {loc.country} ({loc.lat >= 0 ? `${loc.lat.toFixed(2)}°N` : `${Math.abs(loc.lat).toFixed(2)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(2)}°E` : `${Math.abs(loc.lon).toFixed(2)}°W`})
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
          className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
        >
          <LocateFixed className="w-3.5 h-3.5 text-sky-400" />
          <span>Center Pin</span>
        </button>
      </div>

      {/* Main Interactive Mercator SVG Stage */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className={`w-full aspect-[840/500] select-none block touch-none ${
            mapMode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        >
          <defs>
            {/* Ocean Texture / Grid Patterns */}
            <pattern id="oceanGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="0.5" />
            </pattern>

            {/* Sun Glow Gradient */}
            <radialGradient id="mercatorSunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#ea580c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>

            {/* Night Shadow Blur Filter */}
            <filter id="mercatorShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Deep Ocean Base */}
          <rect x="0" y="0" width={mapWidth} height={mapHeight} fill={themeColors.ocean} />
          <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#oceanGrid)" />

          {/* Transform Group for Pan & Zoom */}
          <g transform={`translate(${mapCenter.x + panOffset.x}, ${mapCenter.y + panOffset.y}) scale(${zoomLevel}) translate(${-mapCenter.x}, ${-mapCenter.y})`}>
            {/* CONTINENTS & LANDMASSES */}
            <g id="mercator-continents">
              {continentPaths.map((cont) => (
                <path
                  key={cont.name}
                  d={cont.d}
                  fill={themeColors.landFill}
                  stroke={themeColors.landStroke}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  className="transition-colors"
                />
              ))}
              {/* Antarctica Landmass at Map Base */}
              <path
                d={antarcticaPath}
                fill={themeColors.landFill}
                stroke={themeColors.landStroke}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>

            {/* Continent Text Labels */}
            <g id="mercator-continent-labels" className="pointer-events-none select-none opacity-45">
              {CONTINENT_LABELS.map((lbl) => {
                const pt = projectMercator(lbl.lat, lbl.lon, mapWidth, mapHeight, MERCATOR_MAX_LAT);
                return (
                  <text
                    key={lbl.name}
                    x={pt.x}
                    y={pt.y}
                    fill="#94a3b8"
                    fontSize="8.5"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    letterSpacing="1.2"
                    textAnchor="middle"
                  >
                    {lbl.name}
                  </text>
                );
              })}
            </g>

            {/* GRATICULE (Latitude & Longitude Grid Lines) */}
            {showGridOverlays && (
              <g id="mercator-graticule" className="pointer-events-none">
                {/* Longitude Meridians */}
                {meridians.map((m) => (
                  <g key={`meridian-${m.lon}`}>
                    <line
                      x1={m.x}
                      y1="0"
                      x2={m.x}
                      y2={mapHeight}
                      stroke={m.lon === 0 ? 'rgba(56, 189, 248, 0.45)' : themeColors.graticule}
                      strokeWidth={m.lon === 0 ? '1.2' : '0.8'}
                      strokeDasharray={m.lon === 0 ? 'none' : '3,3'}
                    />
                    <text
                      x={m.x + 3}
                      y={mapHeight - 6}
                      fill="#64748b"
                      fontSize="7"
                      fontFamily="monospace"
                    >
                      {m.lon === 0 ? '0° (PM)' : m.lon > 0 ? `${m.lon}°E` : `${Math.abs(m.lon)}°W`}
                    </text>
                  </g>
                ))}

                {/* Latitude Parallels */}
                {parallels.map((p) => (
                  <g key={`parallel-${p.lat}`}>
                    <line
                      x1="0"
                      y1={p.y}
                      x2={mapWidth}
                      y2={p.y}
                      stroke={
                        Math.abs(p.lat) === 23.44
                          ? 'rgba(251, 191, 36, 0.4)'
                          : p.lat === 0
                          ? 'rgba(245, 158, 11, 0.7)'
                          : themeColors.graticule
                      }
                      strokeWidth={p.lat === 0 ? '1.5' : '0.8'}
                      strokeDasharray={p.lat === 0 ? 'none' : Math.abs(p.lat) === 23.44 ? '4,4' : '2,2'}
                    />
                    <text
                      x="4"
                      y={p.y - 3}
                      fill={p.lat === 0 ? '#f59e0b' : '#64748b'}
                      fontSize="7"
                      fontFamily="monospace"
                    >
                      {p.lat === 0
                        ? '0° Equator'
                        : p.lat === 23.44
                        ? '23.4°N Tropic of Cancer'
                        : p.lat === -23.44
                        ? '23.4°S Tropic of Capricorn'
                        : p.lat > 0
                        ? `${p.lat}°N`
                        : `${Math.abs(p.lat)}°S`}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* VITAMIN D SYNTHESIS 45° THRESHOLD BANDS */}
            {showVitDBands && (
              <g id="mercator-vitd-thresholds" className="pointer-events-none">
                {/* 45°N Line */}
                <line
                  x1="0"
                  y1={vitDNorthY}
                  x2={mapWidth}
                  y2={vitDNorthY}
                  stroke="#22c55e"
                  strokeWidth="1.8"
                  strokeDasharray="6,4"
                />
                <rect
                  x={mapWidth - 195}
                  y={vitDNorthY - 14}
                  width="190"
                  height="13"
                  rx="2.5"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke="#22c55e"
                  strokeWidth="0.8"
                />
                <text
                  x={mapWidth - 190}
                  y={vitDNorthY - 4}
                  fill="#86efac"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  45°N Vitamin D Winter Boundary Line
                </text>

                {/* 45°S Line */}
                <line
                  x1="0"
                  y1={vitDSouthY}
                  x2={mapWidth}
                  y2={vitDSouthY}
                  stroke="#22c55e"
                  strokeWidth="1.8"
                  strokeDasharray="6,4"
                />
                <rect
                  x={mapWidth - 195}
                  y={vitDSouthY - 14}
                  width="190"
                  height="13"
                  rx="2.5"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke="#22c55e"
                  strokeWidth="0.8"
                />
                <text
                  x={mapWidth - 190}
                  y={vitDSouthY - 4}
                  fill="#86efac"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  45°S Vitamin D Winter Boundary Line
                </text>
              </g>
            )}

            {/* DAY/NIGHT SOLAR TERMINATOR OVERLAY */}
            {showDaylight && (
              <path
                d={nightPathD}
                fill={themeColors.nightOverlay}
                className="pointer-events-none mix-blend-multiply"
              />
            )}

            {/* SUBSOLAR POINT ZENITH (Direct Overhead Sun Marker) */}
            {showSun && (
              <g id="mercator-subsolar" transform={`translate(${sunPos.x}, ${sunPos.y})`}>
                <circle cx="0" cy="0" r="28" fill="url(#mercatorSunGlow)" className="animate-pulse" />
                <circle cx="0" cy="0" r="7" fill="#f59e0b" stroke="#fffbeb" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="14" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="3,2" />
                {/* Sun Zenith Label */}
                <g transform="translate(12, -8)" filter="url(#mercatorShadow)">
                  <rect
                    x="-2"
                    y="-9"
                    width="118"
                    height="14"
                    rx="3"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                  />
                  <text x="3" y="1.5" fill="#fef08a" fontSize="7.2" fontWeight="bold" fontFamily="sans-serif">
                    Sun Zenith ({solarStatus.subsolarPoint.lat >= 0 ? `${solarStatus.subsolarPoint.lat.toFixed(2)}°N` : `${Math.abs(solarStatus.subsolarPoint.lat).toFixed(2)}°S`}, {solarStatus.subsolarPoint.lon >= 0 ? `${solarStatus.subsolarPoint.lon.toFixed(2)}°E` : `${Math.abs(solarStatus.subsolarPoint.lon).toFixed(2)}°W`})
                  </text>
                </g>
              </g>
            )}

            {/* USER LOCATION PIN (Selected Point) */}
            <g
              id="mercator-user-pin"
              transform={`translate(${pinPos.x}, ${pinPos.y})`}
              className="cursor-move"
            >
              {/* Pulsing Target Rings */}
              <circle cx="0" cy="0" r="16" fill="none" stroke="#22c55e" strokeWidth="1.2" opacity="0.6" className="animate-ping" />
              <circle cx="0" cy="0" r="8" fill="none" stroke="#22c55e" strokeWidth="1.8" />
              <circle cx="0" cy="0" r="4" fill="#22c55e" stroke="#0f172a" strokeWidth="1.5" />

              {/* Pin Tooltip Box */}
              <g transform="translate(0, -18)" filter="url(#mercatorShadow)" className="pointer-events-none">
                <rect
                  x="-62"
                  y="-14"
                  width="124"
                  height="16"
                  rx="3.5"
                  fill="rgba(15, 23, 42, 0.96)"
                  stroke="#22c55e"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="-2.5"
                  fill="#86efac"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`},{' '}
                  {lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`}
                </text>
              </g>
            </g>
          </g>
        </svg>

        {/* Live Coordinate Pill on Map Corner */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none text-xs">
          <div className="bg-slate-900/95 border border-slate-700/90 text-slate-200 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-300">
              {selectedCityName || 'Pinned Target'}:
            </span>
            <span className="font-mono text-slate-300 font-bold">
              {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`},{' '}
              {lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`}
            </span>
            {hoverCoords && (
              <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-700 text-sky-300 text-[11px] font-mono">
                <span>Cursor:</span>
                <span>{hoverCoords.lat >= 0 ? `${hoverCoords.lat.toFixed(2)}°N` : `${Math.abs(hoverCoords.lat).toFixed(2)}°S`},</span>
                <span>{hoverCoords.lon >= 0 ? `${hoverCoords.lon.toFixed(2)}°E` : `${Math.abs(hoverCoords.lon).toFixed(2)}°W`}</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Click or drag pin anywhere</span>
          </div>
        </div>
      </div>
    </div>
  );
};
