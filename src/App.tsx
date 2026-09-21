import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GleasonMap } from './components/GleasonMap';
import { SolarHero } from './components/SolarHero';
import { DailySolarChart } from './components/DailySolarChart';
import { YearlySolarCalendar } from './components/YearlySolarCalendar';
import { CoordinatePanel } from './components/CoordinatePanel';
import { SkinTypeGuide } from './components/SkinTypeGuide';
import { PersonalizedVitDCalculator } from './components/PersonalizedVitDCalculator';
import { getSolarPosition, calculateDayWindow, calculateYearWindow, getSkinTypes } from './utils/solar';
import { MajorCity } from './data/continents';
import { SkinType } from './types';
import { Compass, Sun, Globe, Shield, Sparkles } from 'lucide-react';

export default function App() {
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
          setGeoStatusMessage(`GPS detected: ${uLat}°N, ${uLon}°E`);
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
        setGeoStatusMessage(`Acquired coordinates: ${uLat}°, ${uLon}°`);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-16">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),rgba(15,23,42,0))]" />

      {/* Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                  Gleason Map & Vitamin D Calculator
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Sun className="w-3 h-3" />
                  Solar Shadow Rule
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tag any point on Gleason's 1892 Polar Azimuthal Projection to calculate sun elevation & UVB synthesis
              </p>
            </div>
          </div>

          {/* Quick status badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Current Elevation
              </span>
              <span className={`text-sm font-mono font-bold ${
                solarStatus.canSynthesizeVitD ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {solarStatus.elevation >= 0 ? `+${solarStatus.elevation.toFixed(1)}°` : `${solarStatus.elevation.toFixed(1)}°`}
                {' '}({solarStatus.canSynthesizeVitD ? 'D3 Active' : 'Low / No UVB'})
              </span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              solarStatus.canSynthesizeVitD
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${solarStatus.canSynthesizeVitD ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{solarStatus.canSynthesizeVitD ? 'Vitamin D Window OPEN' : 'Window CLOSED'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Interactive Gleason Map & Coordinates Setup (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Interactive Gleason Map Component */}
          <GleasonMap
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

          {/* Yearly Vitamin D Window & Season */}
          <YearlySolarCalendar
            yearWindow={yearWindow}
            lat={lat}
            locationName={selectedCityName}
          />

          {/* Fitzpatrick Skin Phototype Selector & Guidelines */}
          <SkinTypeGuide
            selectedSkinType={selectedSkinType}
            onSelectSkinType={setSelectedSkinType}
          />
        </div>
      </main>

      {/* Scientific & Historical Footnote */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-slate-800/80 text-xs text-slate-500 leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              About the Gleason Polar Azimuthal Projection (1892)
            </h4>
            <p>
              Patented in 1892 by civil engineer Alexander Gleason, this equidistant azimuthal projection centers on the North Pole. Parallels of latitude form concentric rings, while meridians radiate as straight 15° solar-hour spokes. Distance from the central North Pole is directly proportional to co-latitude $(90^\circ - \text{lat})$.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
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
