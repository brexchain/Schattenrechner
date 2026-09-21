export interface LocationCoord {
  lat: number;
  lon: number;
  name?: string;
}

export interface SolarStatus {
  elevation: number;       // degrees above horizon
  azimuth: number;         // degrees from North
  zenith: number;          // 90 - elevation
  isAboveHorizon: boolean;
  canSynthesizeVitD: boolean; // elevation >= 45
  shadowRatio: number | null; // 1 / tan(elev)
  uvIndexEstimate: number;
  subsolarPoint: {
    lat: number;
    lon: number;
  };
}

export interface DayWindow {
  windowStart: string | null;
  windowEnd: string | null;
  maxElevation: number;
  solarNoonTime: string;
  hourlyPoints: {
    hour: number;
    timeLabel: string;
    elevation: number;
  }[];
}

export interface MonthInfo {
  monthIndex: number;
  name: string;
  abbr: string;
  status: 'full' | 'partial' | 'none';
  minPeak: number;
  maxPeak: number;
}

export interface YearWindow {
  year: number;
  firstDate: string | null;
  lastDate: string | null;
  peakElevation: number;
  months: MonthInfo[];
  dailyPeaks: number[];
  todayDoy: number;
}

export interface SkinType {
  type: number;
  roman: string;
  name: string;
  description: string;
  minutesAtUv6: string;
  medThreshold: number; // Minimal Erythemal Dose in J/m²
  melaninFactor: number;
  hexColor: string;
}

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';
export type AgeGroup = '18-35' | '36-50' | '51-65' | '66+';

export interface SeasonInfo {
  season: SeasonName;
  name: string;
  hemisphere: 'Northern' | 'Southern' | 'Equatorial';
  description: string;
  isVitDWinter: boolean;
  approxDate: string;
}

export interface PersonalizedVitDResult {
  iuIn10MinWithTshirt: number;
  iuIn10MinWithoutTshirt: number;
  iuInCustomWithTshirt: number;
  iuInCustomWithoutTshirt: number;
  customMinutes: number;
  minutesToReach1000IUTshirt: number | null;
  minutesToReach1000IUNoShirt: number | null;
  burnTimeMinutes: number | null;
  percentRDA10MinTshirt: number;
  percentRDA10MinNoShirt: number;
  uvbEfficiency: number;
  isWindowOpen: boolean;
  limitingFactor: string;
  formulaVariables: {
    uvi: number;
    elevation: number;
    med: number;
    bsaTshirt: number;
    bsaNoShirt: number;
    ageFactor: number;
    uvbEfficiency: number;
    fullBodyMedIU: number;
  };
}
