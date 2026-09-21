// Mathematical constants calibrated directly to Alexander Gleason's 1892 New Standard Map of the World
// The map has its North Pole at center (90°N).
// The Equator (0° lat) sits at radius ratio 388 / 818 ≈ 0.4743 relative to the outer brass dial radius.
// Latitudes extend outward through the Tropic of Capricorn (-23.5°) to the Antarctic Ice Rim (~ -75° to -85°).

export const GLEASON_MIN_LAT = -85;
export const GLEASON_MAX_LAT = 90;

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Ratio of the Equator (0° Lat) radius to the total dial outer radius on Gleason's 1892 map
 */
export const GLEASON_EQUATOR_RADIUS_RATIO = 388 / 818; // ~0.474327

/**
 * Projects a (lat, lon) coordinate onto the Gleason Polar Azimuthal Equidistant projection.
 *
 * @param lat Latitude in degrees [-85, 90]
 * @param lon Longitude in degrees [-180, 180]
 * @param dialRadius Radius of the full circular dial in pixels
 * @param center Center point (cx, cy)
 */
export function projectGleason(
  lat: number,
  lon: number,
  dialRadius: number,
  center: Point2D
): Point2D {
  const clampedLat = Math.max(GLEASON_MIN_LAT, Math.min(GLEASON_MAX_LAT, lat));
  // Radial distance from North Pole: 90 - lat degrees
  // 90 degrees (North pole to Equator) corresponds to (dialRadius * GLEASON_EQUATOR_RADIUS_RATIO)
  const rEquator = dialRadius * GLEASON_EQUATOR_RADIUS_RATIO;
  const r = ((90 - clampedLat) / 90) * rEquator;
  const theta = (lon * Math.PI) / 180;

  return {
    x: center.x + r * Math.sin(theta),
    y: center.y - r * Math.cos(theta),
  };
}

/**
 * Unprojects a pixel coordinate (x, y) back into (lat, lon) on the Gleason projection.
 *
 * @param point Screen/SVG coordinate (x, y)
 * @param dialRadius Radius of the full circular dial in pixels
 * @param center Center point (cx, cy)
 */
export function unprojectGleason(
  point: Point2D,
  dialRadius: number,
  center: Point2D
): { lat: number; lon: number } {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Angle from 12 o'clock (top, Prime Meridian 0°) clockwise:
  // dx = r * sin(theta), -dy = r * cos(theta) => theta = Math.atan2(dx, -dy)
  const theta = Math.atan2(dx, -dy);
  let lon = (theta * 180) / Math.PI;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;

  // Compute latitude from radial distance
  const rEquator = dialRadius * GLEASON_EQUATOR_RADIUS_RATIO;
  const latSpanFromPole = (dist / rEquator) * 90;
  let lat = 90 - latSpanFromPole;

  // Clamp latitude to valid Gleason boundaries [-85, 90]
  lat = Math.max(GLEASON_MIN_LAT, Math.min(GLEASON_MAX_LAT, lat));

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

/**
 * Converts a polygon of [lat, lon] points into an SVG path string 'M x y L x y ... Z'
 */
export function polygonToSvgPath(
  points: [number, number][],
  dialRadius: number,
  center: Point2D
): string {
  if (!points || points.length === 0) return '';
  return (
    points
      .map(([lat, lon], idx) => {
        const { x, y } = projectGleason(lat, lon, dialRadius, center);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

