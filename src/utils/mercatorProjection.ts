// Mathematical Mercator (Cylindrical Conformal) projection utilities
// Converts latitude/longitude to/from Cartesian coordinates on a rectangular canvas

export interface Point2D {
  x: number;
  y: number;
}

// Standard maximum latitude for Web Mercator and world map projections (~82° to 85°)
export const MERCATOR_MAX_LAT = 82;

/**
 * Projects (lat, lon) to Mercator (x, y) coordinates
 * @param lat Latitude (-82 to +82)
 * @param lon Longitude (-180 to +180)
 * @param width Canvas width
 * @param height Canvas height
 * @param maxLat Latitude cutoff (defaults to 82°)
 */
export function projectMercator(
  lat: number,
  lon: number,
  width: number,
  height: number,
  maxLat: number = MERCATOR_MAX_LAT
): Point2D {
  // Normalize longitude to [-180, 180]
  let normLon = ((lon + 180) % 360 + 360) % 360 - 180;
  const x = ((normLon + 180) / 360) * width;

  // Clamp latitude to [-maxLat, maxLat]
  const clampedLat = Math.max(-maxLat, Math.min(maxLat, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const maxLatRad = (maxLat * Math.PI) / 180;

  // Mercator y-distance in radians: ln(tan(pi/4 + phi/2))
  const yMerc = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const yMercMax = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));

  // y: 0 at top (+maxLat), height at bottom (-maxLat), height/2 at Equator (0°)
  const y = (height / 2) - (yMerc / (2 * yMercMax)) * height;

  return { x, y };
}

/**
 * Unprojects Mercator (x, y) coordinates back to latitude and longitude
 */
export function unprojectMercator(
  x: number,
  y: number,
  width: number,
  height: number,
  maxLat: number = MERCATOR_MAX_LAT
): { lat: number; lon: number } {
  // Longitude from x
  const normLon = (x / width) * 360 - 180;
  const lon = Math.max(-180, Math.min(180, normLon));

  // Latitude from y
  const maxLatRad = (maxLat * Math.PI) / 180;
  const yMercMax = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));

  const yMerc = (0.5 - y / height) * (2 * yMercMax);
  const latRad = 2 * Math.atan(Math.exp(yMerc)) - Math.PI / 2;
  const lat = Math.max(-maxLat, Math.min(maxLat, (latRad * 180) / Math.PI));

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

/**
 * Converts a polygon array of [lat, lon] into an SVG path `d` string for Mercator projection.
 * Automatically detects and splits segments that cross the antimeridian (180° longitude)
 * to avoid artificial horizontal lines spanning the world canvas.
 */
export function polygonToMercatorPath(
  points: [number, number][],
  width: number,
  height: number,
  maxLat: number = MERCATOR_MAX_LAT
): string {
  if (!points || points.length < 2) return '';

  const paths: string[] = [];
  let currentSegment: Point2D[] = [];

  for (let i = 0; i < points.length; i++) {
    const [lat, lon] = points[i];
    const pt = projectMercator(lat, lon, width, height, maxLat);

    if (currentSegment.length > 0) {
      const prevLon = points[i - 1][1];
      // If segment crosses the 180° boundary (large longitude leap)
      if (Math.abs(lon - prevLon) > 180) {
        if (currentSegment.length > 1) {
          paths.push(segmentToD(currentSegment));
        }
        currentSegment = [];
      }
    }

    currentSegment.push(pt);
  }

  if (currentSegment.length > 1) {
    paths.push(segmentToD(currentSegment));
  }

  return paths.join(' ');
}

function segmentToD(pts: Point2D[]): string {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d + ' Z';
}

/**
 * Computes the solar day/night terminator curve across Mercator projection.
 * Returns an SVG path string covering the night (shadowed) area.
 */
export function getMercatorNightPath(
  subsolarLat: number,
  subsolarLon: number,
  width: number,
  height: number,
  maxLat: number = MERCATOR_MAX_LAT
): string {
  const steps = 144; // 2.5° steps
  const pts: Point2D[] = [];

  const decRad = (subsolarLat * Math.PI) / 180;
  const tanDec = Math.tan(decRad);

  for (let i = 0; i <= steps; i++) {
    const lon = -180 + (i / steps) * 360;
    const dLonRad = ((lon - subsolarLon) * Math.PI) / 180;

    let termLat = 0;
    if (Math.abs(tanDec) < 1e-4) {
      // Near equinox: vertical line
      termLat = Math.cos(dLonRad) >= 0 ? -maxLat : maxLat;
    } else {
      // tan(phi) = -cos(lambda - lambda_s) / tan(delta)
      const latRad = Math.atan(-Math.cos(dLonRad) / tanDec);
      termLat = (latRad * 180) / Math.PI;
    }

    termLat = Math.max(-maxLat, Math.min(maxLat, termLat));
    pts.push(projectMercator(termLat, lon, width, height, maxLat));
  }

  // Construct night boundary polygon
  // When sun is in Northern hemisphere (subsolarLat >= 0), South Pole is experiencing night (bottom)
  // When sun is in Southern hemisphere (subsolarLat < 0), North Pole is experiencing night (top)
  if (subsolarLat >= 0) {
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    d += ` L ${width} ${height} L 0 ${height} Z`;
    return d;
  } else {
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    d += ` L ${width} 0 L 0 0 Z`;
    return d;
  }
}
