import { SolarStatus, DayWindow, YearWindow, MonthInfo, SkinType, SeasonInfo, AgeGroup, PersonalizedVitDResult } from '../types';

const RAD = Math.PI / 180;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Calculates accurate solar position (Elevation, Azimuth, Subsolar coordinates)
 * based on NOAA Solar Calculator algorithms.
 */
export function getSolarPosition(date: Date, lat: number, lon: number): SolarStatus {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const startOfYearUTC = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYearUTC) / 86400000);

  // Fractional year (radians)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);

  // Equation of time in minutes
  const eqtime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar declination in radians
  const decl = 0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.001480 * Math.sin(3 * gamma);

  // Subsolar point (where sun is directly overhead at 90° zenith)
  const subsolarLat = decl / RAD;
  let subsolarLon = (720 - utcHours * 60 - eqtime) / 4;
  while (subsolarLon > 180) subsolarLon -= 360;
  while (subsolarLon < -180) subsolarLon += 360;

  // True solar time for target location
  const timeOffset = eqtime + 4 * lon;
  const tst = utcHours * 60 + timeOffset;

  // Hour angle
  let ha = (tst / 4) - 180;
  if (ha > 180) ha -= 360;
  if (ha < -180) ha += 360;

  const latRad = lat * RAD;
  const haRad = ha * RAD;

  // Cosine of solar zenith angle
  const cosZenith = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
  const zenithRad = Math.acos(Math.min(1, Math.max(-1, cosZenith)));
  const zenithDeg = zenithRad / RAD;
  const rawElevation = 90 - zenithDeg;

  // Atmospheric refraction correction for elevation near horizon
  let elevation = rawElevation;
  if (elevation > -0.575) {
    const r = 1.02 / Math.tan((elevation + 10.3 / (elevation + 5.11)) * RAD) / 60;
    elevation += r;
  }

  // Azimuth angle
  const sinZenith = Math.sin(zenithRad);
  let azimuth = 180;
  if (sinZenith > 0.0001) {
    const cosAz = (Math.sin(decl) - Math.cos(zenithRad) * Math.sin(latRad)) / (sinZenith * Math.cos(latRad));
    azimuth = Math.acos(Math.min(1, Math.max(-1, cosAz))) / RAD;
    if (ha > 0) {
      azimuth = 360 - azimuth;
    }
  }

  const isAboveHorizon = elevation > 0;
  const canSynthesizeVitD = elevation >= 45.0;

  let shadowRatio: number | null = null;
  if (elevation > 0.5) {
    shadowRatio = 1 / Math.tan(elevation * RAD);
  }

  // UV Index clear-sky estimate
  let uvIndexEstimate = 0;
  if (elevation > 0) {
    uvIndexEstimate = Math.max(0, +(11.5 * Math.pow(Math.sin(Math.max(0, elevation) * RAD), 1.6)).toFixed(1));
  }

  return {
    elevation,
    azimuth,
    zenith: zenithDeg,
    isAboveHorizon,
    canSynthesizeVitD,
    shadowRatio,
    uvIndexEstimate,
    subsolarPoint: {
      lat: subsolarLat,
      lon: subsolarLon,
    },
  };
}

/**
 * 24-hour solar progression for the selected date and location
 */
export function calculateDayWindow(date: Date, lat: number, lon: number): DayWindow {
  const steps = 96; // 15-minute intervals
  const hourlyPoints: DayWindow['hourlyPoints'] = [];
  let maxElevation = -90;
  let maxElevationIdx = 0;
  let firstIdx = -1;
  let lastIdx = -1;

  for (let i = 0; i <= steps; i++) {
    const frac = (i / steps) * 24;
    const hh = Math.floor(frac);
    const mm = Math.round((frac - hh) * 60);
    const sampleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0);
    const pos = getSolarPosition(sampleDate, lat, lon);

    if (pos.elevation > maxElevation) {
      maxElevation = pos.elevation;
      maxElevationIdx = i;
    }

    if (pos.elevation >= 45) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
    }

    hourlyPoints.push({
      hour: frac,
      timeLabel: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      elevation: pos.elevation,
    });
  }

  const indexToTime = (idx: number) => {
    const frac = (idx / steps) * 24;
    const hh = Math.floor(frac);
    const mm = Math.round((frac - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  return {
    windowStart: firstIdx !== -1 ? indexToTime(firstIdx) : null,
    windowEnd: lastIdx !== -1 ? indexToTime(lastIdx) : null,
    maxElevation,
    solarNoonTime: indexToTime(maxElevationIdx),
    hourlyPoints,
  };
}

/**
 * Maximum possible solar elevation at solar noon for a given day of year and latitude:
 * Solar noon elevation = 90 - |lat - declination|
 */
export function maxElevationForDay(year: number, month: number, day: number, lat: number): number {
  const startOfYearUTC = Date.UTC(year, 0, 0);
  const dayOfYear = Math.floor((Date.UTC(year, month, day) - startOfYearUTC) / 86400000);
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

  const decl = 0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.001480 * Math.sin(3 * gamma);

  const declDeg = decl / RAD;
  return 90 - Math.abs(lat - declDeg);
}

export function calculateYearWindow(year: number, lat: number): YearWindow {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeap ? 366 : 365;
  const dailyPeaks: number[] = [];

  let firstIdx = -1;
  let lastIdx = -1;
  let peakElevation = -90;

  for (let doy = 0; doy < totalDays; doy++) {
    const d = new Date(year, 0, 1 + doy);
    const peak = maxElevationForDay(year, d.getMonth(), d.getDate(), lat);
    dailyPeaks.push(peak);

    if (peak > peakElevation) {
      peakElevation = peak;
    }

    if (peak >= 45) {
      if (firstIdx === -1) firstIdx = doy;
      lastIdx = doy;
    }
  }

  // Monthly breakdown
  const months: MonthInfo[] = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    let minPeak = Infinity;
    let maxPeak = -Infinity;

    for (let d = 1; d <= daysInMonth; d++) {
      const p = maxElevationForDay(year, m, d, lat);
      if (p < minPeak) minPeak = p;
      if (p > maxPeak) maxPeak = p;
    }

    let status: MonthInfo['status'] = 'partial';
    if (minPeak >= 45) status = 'full';
    else if (maxPeak < 45) status = 'none';

    months.push({
      monthIndex: m,
      name: MONTH_NAMES[m],
      abbr: MONTH_ABBR[m],
      status,
      minPeak,
      maxPeak,
    });
  }

  const now = new Date();
  const startOfNowYear = Date.UTC(now.getFullYear(), 0, 0);
  const todayDoy = Math.min(totalDays - 1, Math.max(0, Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - startOfNowYear) / 86400000) - 1));

  let firstDateStr: string | null = null;
  let lastDateStr: string | null = null;

  if (firstIdx !== -1) {
    const fDate = new Date(year, 0, 1 + firstIdx);
    firstDateStr = `${fDate.getDate()} ${MONTH_NAMES[fDate.getMonth()]}`;
  }
  if (lastIdx !== -1) {
    const lDate = new Date(year, 0, 1 + lastIdx);
    lastDateStr = `${lDate.getDate()} ${MONTH_NAMES[lDate.getMonth()]}`;
  }

  return {
    year,
    firstDate: firstDateStr,
    lastDate: lastDateStr,
    peakElevation,
    months,
    dailyPeaks,
    todayDoy,
  };
}

export function getSkinTypes(): SkinType[] {
  return [
    {
      type: 1,
      roman: 'Type I',
      name: 'Very Fair / Pale',
      description: 'Burns easily, rarely tans (e.g. red hair, freckles, Celtic heritage).',
      minutesAtUv6: '10–15 min',
      medThreshold: 200, // J/m²
      melaninFactor: 1.0,
      hexColor: '#fbe8dc',
    },
    {
      type: 2,
      roman: 'Type II',
      name: 'Fair / Light',
      description: 'Burns readily, tans minimally/with difficulty (e.g. blonde hair, blue/green eyes).',
      minutesAtUv6: '15–20 min',
      medThreshold: 250, // J/m²
      melaninFactor: 1.25,
      hexColor: '#f4d3b8',
    },
    {
      type: 3,
      roman: 'Type III',
      name: 'Medium / Light Brown',
      description: 'Sometimes mild burn, gradually tans to olive/light brown (common European/mixed).',
      minutesAtUv6: '20–30 min',
      medThreshold: 300, // J/m²
      melaninFactor: 1.5,
      hexColor: '#e0b58e',
    },
    {
      type: 4,
      roman: 'Type IV',
      name: 'Olive / Moderate Brown',
      description: 'Burns rarely, tans easily (e.g. Mediterranean, Hispanic, Middle Eastern).',
      minutesAtUv6: '30–40 min',
      medThreshold: 450, // J/m²
      melaninFactor: 2.25,
      hexColor: '#be8c5f',
    },
    {
      type: 5,
      roman: 'Type V',
      name: 'Dark Brown',
      description: 'Very rarely burns, tans profusely and rapidly (e.g. South Asian, Latin, North African).',
      minutesAtUv6: '40–60 min',
      medThreshold: 600, // J/m²
      melaninFactor: 3.0,
      hexColor: '#8a5937',
    },
    {
      type: 6,
      roman: 'Type VI',
      name: 'Deeply Pigmented / Black',
      description: 'Never burns, deeply pigmented melanin protection (e.g. African heritage).',
      minutesAtUv6: '60–80 min',
      medThreshold: 900, // J/m²
      melaninFactor: 4.5,
      hexColor: '#4d3020',
    },
  ];
}

/**
 * Detects current season based on hemisphere latitude and day of year.
 * Also accounts for equatorial non-seasonal zones.
 */
export function detectSeason(date: Date, lat: number): SeasonInfo {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  const day = date.getDate();

  // Day of year approx
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const doy = Math.floor(diff / (1000 * 60 * 60 * 24));

  const isNorthern = lat >= 23.5;
  const isSouthern = lat <= -23.5;
  const isEquatorial = !isNorthern && !isSouthern;

  const dateStr = `${day} ${MONTH_NAMES[month]}`;

  if (isEquatorial) {
    return {
      season: 'summer',
      name: 'Tropical / Equatorial (Year-Round Sun)',
      hemisphere: 'Equatorial',
      description: 'Near the equator, the sun reaches solar elevation >45° year-round. Vitamin D synthesis is possible in all months around midday.',
      isVitDWinter: false,
      approxDate: dateStr,
    };
  }

  // Northern Hemisphere seasons (Astronomical approximation)
  // Spring: March 20 - June 20 (doy ~ 79 to 171)
  // Summer: June 21 - Sept 22 (doy ~ 172 to 265)
  // Autumn: Sept 23 - Dec 21 (doy ~ 266 to 355)
  // Winter: Dec 22 - March 19
  let nSeason: SeasonInfo['season'] = 'winter';
  if (doy >= 79 && doy < 172) {
    nSeason = 'spring';
  } else if (doy >= 172 && doy < 266) {
    nSeason = 'summer';
  } else if (doy >= 266 && doy < 356) {
    nSeason = 'autumn';
  } else {
    nSeason = 'winter';
  }

  if (isNorthern) {
    const isVitDWinter = (nSeason === 'winter' || (nSeason === 'autumn' && doy > 290) || (nSeason === 'spring' && doy < 100)) && lat > 37;
    return {
      season: nSeason,
      name: nSeason === 'summer' ? 'Summer (Peak Solar UVB)'
        : nSeason === 'spring' ? 'Spring (Awakening Window)'
        : nSeason === 'autumn' ? 'Autumn (Declining Sun)'
        : 'Winter ("Vitamin D Winter")',
      hemisphere: 'Northern',
      description: isVitDWinter
        ? `Above latitude 37°N during late autumn and winter, the sun never exceeds 45° elevation. UVB photons are fully filtered by ozone.`
        : `Solar elevation allows regular daily synthesis windows when the sun is above 45°.`,
      isVitDWinter,
      approxDate: dateStr,
    };
  } else {
    // Southern Hemisphere is inverted
    const sSeason: SeasonInfo['season'] =
      nSeason === 'summer' ? 'winter'
      : nSeason === 'winter' ? 'summer'
      : nSeason === 'spring' ? 'autumn'
      : 'spring';

    const isVitDWinter = (sSeason === 'winter' || (sSeason === 'autumn' && doy < 150) || (sSeason === 'spring' && doy > 250)) && lat < -37;

    return {
      season: sSeason,
      name: sSeason === 'summer' ? 'Summer (Peak Solar UVB)'
        : sSeason === 'spring' ? 'Spring (Awakening Window)'
        : sSeason === 'autumn' ? 'Autumn (Declining Sun)'
        : 'Winter ("Vitamin D Winter")',
      hemisphere: 'Southern',
      description: isVitDWinter
        ? `Below latitude 37°S during winter months, the sun remains too low for UVB penetration.`
        : `Solar elevation allows regular daily synthesis windows when the sun is above 45°.`,
      isVitDWinter,
      approxDate: dateStr,
    };
  }
}

/**
 * Key seasonal presets for quick user exploration of the time of year
 */
export const SEASON_PRESETS = [
  {
    id: 'summer_solstice',
    label: 'Summer Solstice (Peak UVB)',
    date: new Date(2026, 5, 21, 12, 0), // June 21
    description: 'Maximum solar declination (+23.44°). Highest sun elevation of the year in the North.',
  },
  {
    id: 'winter_solstice',
    label: 'Winter Solstice (Lowest Sun)',
    date: new Date(2026, 11, 21, 12, 0), // Dec 21
    description: 'Minimum solar declination (-23.44°). Lowest solar arc of the year in the North.',
  },
  {
    id: 'spring_equinox',
    label: 'Spring Equinox (Balanced)',
    date: new Date(2026, 2, 20, 12, 0), // March 20
    description: 'Sun directly over the equator (declination 0°). Day and night equal worldwide.',
  },
  {
    id: 'autumn_equinox',
    label: 'Autumn Equinox (Declining)',
    date: new Date(2026, 8, 22, 12, 0), // Sept 22
    description: 'Sun transitions south across the equator. Northern Vitamin D season closing.',
  },
];

/**
 * Age attenuation factor on epidermal 7-dehydrocholesterol (7-DHC)
 * Reference: Holick MF et al., Aging decreases the capacity of human skin to produce vitamin D3. J Clin Invest. 1989.
 */
export function getAgeFactor(ageGroup: AgeGroup): { factor: number; label: string } {
  switch (ageGroup) {
    case '18-35':
      return { factor: 1.0, label: '100% capacity (peak epidermal 7-DHC concentration)' };
    case '36-50':
      return { factor: 0.85, label: '~85% capacity (mild physiological reduction)' };
    case '51-65':
      return { factor: 0.70, label: '~70% capacity (moderate age-related decline)' };
    case '66+':
      return { factor: 0.50, label: '~50% capacity (reduced 7-DHC content in epidermis)' };
  }
}

/**
 * Calculates cutaneous Vitamin D3 synthesis based on CIE action spectrum,
 * solar elevation, ozone attenuation, Fitzpatrick skin phototype, and body coverage.
 *
 * Photobiology Formula:
 * 1. 1 Minimal Erythemal Dose (MED) whole-body ≈ 15,000 IU of systemic oral D3 equivalent.
 * 2. Erythemal dose rate = UV Index * 25 mW/m² = 1.5 J/(m²·min).
 * 3. Fraction of MED in T minutes = (T * 1.5 * UVI) / Skin_MED.
 * 4. Atmospheric UVB Transmission Factor (E_uvb):
 *    - Cutoff at 45° elevation due to ozone optical path length (air mass > 1.41).
 *    - E_uvb = 0 when elevation < 20°
 *    - E_uvb = ((elev - 20)/25)^2 * 0.25 when 20° <= elev < 45° (minimal)
 *    - E_uvb = 0.25 + 0.75 * sin(((elev - 45)/45) * (pi/2)) when elev >= 45°
 * 5. Body Surface Area (BSA):
 *    - With T-Shirt & shorts: Face, neck, arms, hands, lower legs ≈ 25% (0.25)
 *    - Without T-Shirt (Shirtless / Swimwear): Torso, back, legs, arms, face ≈ 75% (0.75)
 * 6. Photo-equilibrium plateau: Single session cutaneous production caps at ~15,000 IU
 *    due to reversible photo-conversion into inert lumisterol and tachysterol.
 */
export function calculatePersonalizedVitD(
  solarStatus: SolarStatus,
  skinType: SkinType,
  ageGroup: AgeGroup,
  customMinutes: number = 10
): PersonalizedVitDResult {
  const { elevation, uvIndexEstimate, isAboveHorizon, canSynthesizeVitD } = solarStatus;
  const ageObj = getAgeFactor(ageGroup);
  const ageFactor = ageObj.factor;

  // Body Surface Area (Rule of Nines)
  const bsaTshirt = 0.25; // 25% exposed: face, neck, forearms, hands, calves
  const bsaNoShirt = 0.75; // 75% exposed: shirtless, torso front/back, arms, legs

  // Atmospheric UVB Transmission Factor as a function of solar elevation
  let uvbEfficiency = 0;
  if (elevation < 20) {
    uvbEfficiency = 0;
  } else if (elevation < 45) {
    // Highly attenuated by stratospheric ozone
    const norm = (elevation - 20) / 25;
    uvbEfficiency = Math.pow(norm, 2) * 0.20;
  } else {
    // 45° and above: active previtamin D synthesis window
    const norm = (elevation - 45) / 45;
    uvbEfficiency = 0.20 + 0.80 * Math.sin(norm * (Math.PI / 2));
  }

  // Clear-sky effective UV index
  const effectiveUVI = uvIndexEstimate;
  const medThreshold = skinType.medThreshold; // J/m²

  // Dose rate in J/(m²·min) = UVI * 1.5
  const doseRatePerMin = effectiveUVI * 1.5;

  // Max safe burn time (minutes to 1 MED)
  let burnTimeMinutes: number | null = null;
  if (doseRatePerMin > 0.1) {
    burnTimeMinutes = Math.round(medThreshold / doseRatePerMin);
  }

  // Function to calculate IU for a given duration and BSA
  const computeIU = (minutes: number, bsa: number): number => {
    if (!isAboveHorizon || elevation <= 5 || effectiveUVI <= 0.2 || uvbEfficiency <= 0.01) {
      return 0;
    }

    // Total erythemal dose delivered
    const dose = minutes * doseRatePerMin;
    // Fractional MED delivered to unacclimatized skin
    const medFraction = dose / medThreshold;

    // Whole-body 1 MED generates equivalent of 15,000 IU
    const fullBodyEquivalentIU = 15000;

    // Net synthesis taking into account BSA, age 7-DHC reduction, and UVB efficiency
    const rawIU = medFraction * fullBodyEquivalentIU * bsa * ageFactor * uvbEfficiency;

    // Photo-equilibrium biological saturation limit: ~15,000 IU per session
    const finalIU = Math.min(15000, Math.round(rawIU));
    return Math.max(0, finalIU);
  };

  // 10-minute baseline estimates requested by user
  const iuIn10MinWithTshirt = computeIU(10, bsaTshirt);
  const iuIn10MinWithoutTshirt = computeIU(10, bsaNoShirt);

  // Custom user duration
  const iuInCustomWithTshirt = computeIU(customMinutes, bsaTshirt);
  const iuInCustomWithoutTshirt = computeIU(customMinutes, bsaNoShirt);

  // Time to reach 1,000 IU (standard daily maintenance target)
  const calcMinutesToTarget = (targetIU: number, bsa: number): number | null => {
    if (!canSynthesizeVitD || uvbEfficiency < 0.1 || effectiveUVI < 1.0) {
      return null;
    }
    const iuPerMin = computeIU(1, bsa);
    if (iuPerMin <= 0) return null;
    const mins = Math.ceil(targetIU / iuPerMin);
    return Math.min(180, Math.max(1, mins));
  };

  const minutesToReach1000IUTshirt = calcMinutesToTarget(1000, bsaTshirt);
  const minutesToReach1000IUNoShirt = calcMinutesToTarget(1000, bsaNoShirt);

  // Recommended Daily Allowance (RDA is typically 600 IU for adults up to 70 yrs, 800 IU 70+)
  const rdaTarget = ageGroup === '66+' ? 800 : 600;
  const percentRDA10MinTshirt = Math.round((iuIn10MinWithTshirt / rdaTarget) * 100);
  const percentRDA10MinNoShirt = Math.round((iuIn10MinWithoutTshirt / rdaTarget) * 100);

  let limitingFactor = 'Optimal solar elevation';
  if (!isAboveHorizon) {
    limitingFactor = 'Sun is below the horizon (nighttime). No solar UV radiation.';
  } else if (elevation < 45) {
    limitingFactor = 'Solar elevation is under 45°. The long atmospheric air mass path allows stratospheric ozone to filter out narrow-band UVB (290–315 nm).';
  } else if (effectiveUVI < 2) {
    limitingFactor = 'UV index is low. Minimal UVB reaching surface.';
  }

  return {
    iuIn10MinWithTshirt,
    iuIn10MinWithoutTshirt,
    iuInCustomWithTshirt,
    iuInCustomWithoutTshirt,
    customMinutes,
    minutesToReach1000IUTshirt,
    minutesToReach1000IUNoShirt,
    burnTimeMinutes,
    percentRDA10MinTshirt,
    percentRDA10MinNoShirt,
    uvbEfficiency,
    isWindowOpen: canSynthesizeVitD,
    limitingFactor,
    formulaVariables: {
      uvi: effectiveUVI,
      elevation,
      med: medThreshold,
      bsaTshirt,
      bsaNoShirt,
      ageFactor,
      uvbEfficiency,
      fullBodyMedIU: 15000,
    },
  };
}
