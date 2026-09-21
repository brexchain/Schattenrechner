import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MercatorMap } from './components/MercatorMap';
import { SolarHero } from './components/SolarHero';
import { DailySolarChart } from './components/DailySolarChart';
import { YearlySolarCalendar } from './components/YearlySolarCalendar';
import { CoordinatePanel } from './components/CoordinatePanel';
import { SkinTypeGuide } from './components/SkinTypeGuide';
import { PersonalizedVitDCalculator } from './components/PersonalizedVitDCalculator';
import { getSolarPosition, calculateDayWindow, calculateYearWindow, getSkinTypes } from './utils/solar';
import { MajorCity } from './data/continents';
import { SkinType } from './types';
import { useTheme } from './context/ThemeContext';
import { Compass, Sun, Moon, Globe, Shield, Sparkles, Globe2 } from 'lucide-react';

export default function App() {
  const { theme, isSunny, toggleTheme } = useTheme();

  // Default coordinates (Berlin: 52.5200° N, 13.4050° E)
  const [lat, setLat] = useState<number>(52.5200);
  const [lon, setLon] = useState<number>(13.4050);
  const [selectedCityName, setSelectedCityName] = useState<string | undefined>('Berlin, Germany');

  // Date and live timer
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState<boolean>(true);

  // Geolocation states
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoStatusMessage, setGeoStatusMessage] = useState<string | null>(null);

  // Selected Fitzpatrick skin type
  const skinTypes = useMemo(() => getSkinTypes(), []);
  const [selectedSkinType, setSelectedSkinType] = useState<SkinType>(skinTypes[1]); // Type II default

  // Live timer tick every 10 seconds
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setSelectedDate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Try automatic geolocation on initial mount (graceful fallback)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = Number(pos.coords.latitude.toFixed(4));
          const uLon = Number(pos.coords.longitude.toFixed(4));
          setLat(uLat);
          setLon(uLon);
          setSelectedCityName('Your Detected Location');
          setGeoStatusMessage(`GPS detected: ${uLat >= 0 ? `${uLat.toFixed(2)}°N` : `${Math.abs(uLat).toFixed(2)}°S`}, ${uLon >= 0 ? `${uLon.toFixed(2)}°E` : `${Math.abs(uLon).toFixed(2)}°W`}`);
        },
        () => {
          // Keep default Berlin
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Compute Solar Status
  const solarStatus = useMemo(() => {
    return getSolarPosition(selectedDate, lat, lon);
  }, [selectedDate, lat, lon]);

  // Compute 24-Hour Day Progression
  const dayWindow = useMemo(() => {
    return calculateDayWindow(selectedDate, lat, lon);
  }, [selectedDate, lat, lon]);

  // Compute Full Year Vitamin D Season
  const yearWindow = useMemo(() => {
    return calculateYearWindow(selectedDate.getFullYear(), lat);
  }, [selectedDate, lat]);

  // Handle map pointer click or drag
  const handleLocationChange = useCallback((coords: { lat: number; lon: number; name?: string }) => {
    setLat(coords.lat);
    setLon(coords.lon);
    if (coords.name) {
      setSelectedCityName(coords.name);
    } else {
      setSelectedCityName(
        `${coords.lat >= 0 ? coords.lat.toFixed(2) + '°N' : Math.abs(coords.lat).toFixed(2) + '°S'}, ${
          coords.lon >= 0 ? coords.lon.toFixed(2) + '°E' : Math.abs(coords.lon).toFixed(2) + '°W'
        }`
      );
    }
    setGeoStatusMessage(null);
  }, []);

  // Handle preset dropdown selection
  const handleCitySelect = (city: MajorCity) => {
    setLat(city.lat);
    setLon(city.lon);
    setSelectedCityName(`${city.city}, ${city.country}`);
    setGeoStatusMessage(null);
  };

  // Handle manual GPS request
  const handleUseGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoStatusMessage('Requesting GPS coordinates…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = Number(pos.coords.latitude.toFixed(4));
        const uLon = Number(pos.coords.longitude.toFixed(4));
        setLat(uLat);
        setLon(uLon);
        setSelectedCityName('Current GPS Location');
        setGeoLoading(false);
        setGeoStatusMessage(`Acquired coordinates: ${uLat >= 0 ? `${uLat.toFixed(2)}°N` : `${Math.abs(uLat).toFixed(2)}°S`}, ${uLon >= 0 ? `${uLon.toFixed(2)}°E` : `${Math.abs(uLon).toFixed(2)}°W`}`);
      },
      (err) => {
        setGeoLoading(false);
        setGeoStatusMessage(`Geolocation failed: ${err.message}. Please tag on map or type manually.`);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const handleResetToNow = () => {
    setSelectedDate(new Date());
    setIsLive(true);
  };

  return (
    <div className={`min-h-screen font-sans antialiased pb-16 transition-colors duration-300 ${
      isSunny
        ? 'bg-[#faf8f4] text-slate-800 selection:bg-amber-400 selection:text-slate-900'
        : 'bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white'
    }`}>
      {/* Radiant solar ambient glow */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${
        isSunny
          ? 'bg-[radial-gradient(ellipse_95%_55%_at_50%_-5%,rgba(251,191,36,0.32),rgba(56,189,248,0.12),transparent_75%)]'
          : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),rgba(15,23,42,0))]'
      }`} />

      {/* Header Banner */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${
        isSunny
          ? 'border-amber-200/80 bg-white/90 shadow-sm shadow-amber-500/5 backdrop-blur-md'
          : 'border-slate-800/80 bg-slate-900/60 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/25">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isSunny ? 'bg-amber-50' : 'bg-slate-950'}`}>
                <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-serif text-lg sm:text-xl font-bold tracking-tight ${isSunny ? 'text-slate-900' : 'text-white'}`}>
                  World Map • Vitamin D &amp; Solar Calculator
                </h1>
                <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isSunny
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}>
                  <Sun className="w-3 h-3 text-amber-500" />
                  Solar Shadow Rule
                </span>
              </div>
              <p className={`text-xs ${isSunny ? 'text-slate-600' : 'text-slate-400'}`}>
                Tag any location on the interactive world map to calculate real-time sun elevation, shadow ratio, and Vitamin D synthesis windows
              </p>
            </div>
          </div>

          {/* Quick status badge & Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${isSunny ? 'text-slate-500' : 'text-slate-400'}`}>
                Current Elevation
              </span>
              <span className={`text-sm font-mono font-bold ${
                solarStatus.canSynthesizeVitD
                  ? isSunny ? 'text-emerald-700' : 'text-emerald-400'
                  : isSunny ? 'text-amber-700' : 'text-amber-400'
              }`}>
                {solarStatus.elevation >= 0 ? `+${solarStatus.elevation.toFixed(1)}°` : `${solarStatus.elevation.toFixed(1)}°`}
                {' '}({solarStatus.canSynthesizeVitD ? 'D3 Active' : 'Low / No UVB'})
              </span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              solarStatus.canSynthesizeVitD
                ? isSunny
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : isSunny
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                solarStatus.canSynthesizeVitD
                  ? 'bg-emerald-500 animate-pulse'
                  : isSunny ? 'bg-amber-500' : 'bg-amber-400'
              }`} />
              <span>{solarStatus.canSynthesizeVitD ? 'Vitamin D Window OPEN' : 'Window CLOSED'}</span>
            </div>

            {/* Sunlit / Dark Theme Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isSunny ? 'Switch to Twilight Dark mode' : 'Switch to Sunlit Daylight mode'}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isSunny
                  ? 'bg-amber-100/90 border-amber-300 text-amber-900 hover:bg-amber-200/90 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-700 shadow-sm'
              }`}
            >
              {isSunny ? (
                <>
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline font-bold">Sunlit Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline font-bold">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6 relative z-10">
        {/* Top of the Page: Annual Solar Elevation Curve & Vitamin D Season */}
        <YearlySolarCalendar
          yearWindow={yearWindow}
          lat={lat}
          locationName={selectedCityName}
        />

        {/* 2-Column Split: Map & Controls (Left) vs Real-Time Simulators (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Map & Coordinates Setup (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Interactive World Map Component */}
            <MercatorMap
              lat={lat}
              lon={lon}
              onLocationChange={handleLocationChange}
              solarStatus={solarStatus}
              selectedCityName={selectedCityName}
            />

            {/* Coordinates & Date/Time Setup Panel */}
            <CoordinatePanel
              lat={lat}
              lon={lon}
              onLatChange={(newLat) => {
                setLat(newLat);
                setSelectedCityName(undefined);
              }}
              onLonChange={(newLon) => {
                setLon(newLon);
                setSelectedCityName(undefined);
              }}
              onCitySelect={handleCitySelect}
              onUseGeolocation={handleUseGeolocation}
              geoLoading={geoLoading}
              geoStatusMessage={geoStatusMessage}
              selectedCityName={selectedCityName}
              isLive={isLive}
              onToggleLive={setIsLive}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onResetToNow={handleResetToNow}
            />

            {/* 24-Hour Solar Path Chart */}
            <DailySolarChart
              dayWindow={dayWindow}
              currentDate={selectedDate}
            />
          </div>

          {/* Right Column: Solar Analytics & Vitamin D Intelligence (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Solar Hero: Elevation & Human Shadow Length Simulation */}
            <SolarHero
              solarStatus={solarStatus}
              selectedSkinType={selectedSkinType}
            />

            {/* Personalized Vitamin D Synthesis Calculator (User Factors, Season, 10-Min with/without T-Shirt, Methodology) */}
            <PersonalizedVitDCalculator
              solarStatus={solarStatus}
              lat={lat}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedSkinType={selectedSkinType}
              onSelectSkinType={setSelectedSkinType}
            />

            {/* Fitzpatrick Skin Phototype Selector & Guidelines */}
            <SkinTypeGuide
              selectedSkinType={selectedSkinType}
              onSelectSkinType={setSelectedSkinType}
            />
          </div>
        </div>
      </main>

      {/* Scientific & Geographical Footnote */}
      <footer className={`max-w-7xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t text-xs leading-relaxed transition-colors duration-300 ${
        isSunny ? 'border-amber-200/80 text-slate-600' : 'border-slate-800/80 text-slate-500'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className={`font-semibold mb-1 flex items-center gap-1.5 ${isSunny ? 'text-slate-800' : 'text-slate-400'}`}>
              <Globe className={`w-3.5 h-3.5 ${isSunny ? 'text-amber-600' : 'text-sky-400'}`} />
              About the Mercator Conformal Projection &amp; Solar Latitudes
            </h4>
            <p>
              The Mercator cylindrical projection preserves local shapes and angles, aligning parallels of latitude with horizontal lines. This provides an intuitive geographic reference for understanding how solar zenith angles, daylight duration, and the critical ±45° cutaneous Vitamin D boundaries correlate directly with geographic latitude.
            </p>
          </div>
          <div>
            <h4 className={`font-semibold mb-1 flex items-center gap-1.5 ${isSunny ? 'text-slate-800' : 'text-slate-400'}`}>
              <Shield className={`w-3.5 h-3.5 ${isSunny ? 'text-emerald-600' : 'text-emerald-400'}`} />
              The 45° Shadow Rule for Cutaneous Vitamin D3
            </h4>
            <p>
              Atmospheric ozone absorbs solar UVB (290–315 nm). When the sun is lower than 45° above the horizon (i.e. your shadow is longer than your height), the sunlight traverses an optical air mass that completely scatters the UVB required to convert 7-dehydrocholesterol to previtamin D3.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
