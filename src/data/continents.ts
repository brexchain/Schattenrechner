// Detailed world coastlines and major geographic regions (lat/lon coordinates)
// Crafted for the Gleason Polar Azimuthal projection with high boundary fidelity

export interface GeoPolygon {
  name: string;
  points: [number, number][]; // [lat, lon]
}

export const CONTINENT_LABELS = [
  { name: 'NORTH AMERICA', lat: 45, lon: -102 },
  { name: 'SOUTH AMERICA', lat: -15, lon: -60 },
  { name: 'EUROPE', lat: 53, lon: 20 },
  { name: 'AFRICA', lat: 7, lon: 22 },
  { name: 'ASIA', lat: 48, lon: 95 },
  { name: 'AUSTRALIA', lat: -25, lon: 134 },
  { name: 'GREENLAND', lat: 72, lon: -40 },
  { name: 'ANTARCTICA', lat: -78, lon: 0 },
];

export const CONTINENTS: GeoPolygon[] = [
  // 1. North America (Detailed)
  {
    name: 'North America',
    points: [
      [71, -156], [71, -145], [69, -135], [69, -125], [68, -114], [64, -100], [60, -94],
      [64, -86], [62, -77], [58, -65], [53, -56], [47, -53], [44, -64], [41, -70],
      [36, -75], [32, -80], [28, -80], [25, -80], [25, -81], [29, -83], [30, -88],
      [29, -89], [28, -96], [26, -97], [21, -97], [19, -91], [21, -87], [18, -88],
      [15, -83], [10, -84], [8, -77], [9, -83], [14, -87], [16, -93], [16, -98],
      [19, -104], [23, -107], [24, -110], [31, -114], [28, -112], [23, -110], [27, -114],
      [32, -117], [34, -120], [38, -123], [46, -124], [49, -125], [54, -130], [59, -140],
      [60, -149], [58, -157], [64, -166], [66, -168], [71, -156]
    ]
  },
  // 2. Greenland
  {
    name: 'Greenland',
    points: [
      [77, -18], [82, -25], [83, -35], [82, -50], [78, -69], [76, -69],
      [70, -54], [65, -52], [60, -43], [61, -45], [65, -40], [70, -22],
      [74, -20], [77, -18]
    ]
  },
  // 3. South America (Detailed)
  {
    name: 'South America',
    points: [
      [12, -72], [11, -64], [9, -61], [6, -53], [4, -51], [1, -49], [-2, -44],
      [-5, -35], [-8, -35], [-13, -39], [-18, -39], [-23, -42], [-28, -49],
      [-34, -53], [-39, -62], [-46, -66], [-52, -68], [-55, -66], [-54, -71],
      [-50, -75], [-44, -74], [-38, -73], [-30, -71], [-22, -70], [-17, -72],
      [-14, -76], [-5, -81], [1, -79], [6, -77], [9, -76], [12, -72]
    ]
  },
  // 4. Europe (Detailed Coastline: Iberia, France, Italy Boot, Greece, Balkans, Central/Northern Europe)
  {
    name: 'Europe',
    points: [
      [70, 28], [71, 25], [68, 14], [62, 5], [58, 6], [54, 9],
      [53, 5], [51, 2], [48, -4], [44, -1], [43, -9], [37, -9],
      [36, -5], [37, -2], [41, 1], [43, 4], [43, 7], [44, 8],
      // Italy Boot
      [41, 14], [38, 16], [40, 18], [38, 17], [37, 15], [39, 17],
      // Adriatic & Greece
      [42, 14], [45, 13], [45, 16], [42, 19], [38, 22], [36, 23], [37, 24], [40, 26],
      // Aegean & Black Sea
      [41, 29], [44, 29], [46, 31], [45, 36], [42, 41], [40, 38], [37, 36],
      // Anatolia connection
      [36, 32], [37, 27], [38, 26], [41, 27], [44, 28], [47, 30],
      [52, 33], [58, 30], [60, 28], [65, 26], [68, 28], [70, 28]
    ]
  },
  // 5. Africa (Detailed)
  {
    name: 'Africa',
    points: [
      [36, -5], [37, 10], [33, 11], [31, 17], [32, 20], [32, 25],
      [31, 32], [28, 34], [23, 38], [15, 42], [12, 51], [10, 51],
      [5, 48], [1, 44], [-4, 40], [-10, 40], [-15, 40], [-20, 35],
      [-26, 33], [-33, 27], [-34, 18], [-30, 17], [-23, 14], [-17, 12],
      [-12, 13], [-6, 12], [0, 9], [4, 7], [4, 1], [5, -4],
      [5, -8], [7, -12], [9, -13], [12, -16], [15, -17], [21, -17],
      [27, -13], [33, -9], [36, -5]
    ]
  },
  // 6. Asia (Detailed: Arabia, Russia/Siberia, China, Indochina, Far East)
  {
    name: 'Asia',
    points: [
      [70, 31], [70, 50], [73, 70], [73, 86], [76, 112], [73, 140],
      [70, 162], [69, 179], [66, -170], [65, 172], [60, 162], [56, 163],
      [51, 157], [56, 156], [59, 150], [58, 140], [53, 141], [47, 135],
      [42, 131], [38, 128], [35, 129], [37, 126], [35, 128], [39, 124],
      [39, 118], [35, 119], [30, 122], [25, 119], [22, 114], [21, 108],
      [13, 109], [10, 107], [8, 103], [13, 100], [16, 96], [21, 92],
      [26, 89], [28, 84], [30, 78], [35, 75], [38, 65], [42, 55],
      [45, 50], [50, 48], [55, 45], [60, 48], [65, 45], [70, 31]
    ]
  },
  // 7. Arabian Peninsula
  {
    name: 'Arabia',
    points: [
      [30, 35], [28, 35], [22, 38], [15, 42], [13, 44], [12, 50],
      [17, 54], [22, 59], [25, 57], [27, 50], [30, 48], [30, 35]
    ]
  },
  // 8. Indian Subcontinent (Detailed)
  {
    name: 'Indian Subcontinent',
    points: [
      [25, 68], [23, 68], [19, 73], [15, 74], [10, 76], [8, 77],
      [8, 78], [10, 80], [13, 80], [16, 82], [18, 84], [21, 87],
      [22, 89], [26, 89], [28, 84], [28, 76], [25, 68]
    ]
  },
  // 9. Australia (Detailed Coastline)
  {
    name: 'Australia',
    points: [
      [-12, 131], [-11, 142], [-15, 145], [-20, 149], [-25, 153], [-30, 153],
      [-37, 150], [-39, 146], [-38, 141], [-35, 137], [-32, 133], [-32, 125],
      [-35, 117], [-34, 115], [-29, 114], [-22, 114], [-18, 121], [-14, 127],
      [-12, 131]
    ]
  },
  // 10. British Isles (Great Britain & Ireland)
  {
    name: 'British Isles',
    points: [
      [50, -5], [52, -4], [55, -5], [58, -5], [58, -3], [56, -2],
      [53, 0], [51, 1], [50, -1], [50, -5]
    ]
  },
  // 11. Ireland
  {
    name: 'Ireland',
    points: [
      [51.5, -9.5], [52.5, -10.2], [54.2, -10.0], [55.3, -7.5], [54.4, -5.7], [53.3, -6.0], [52.2, -6.3], [51.5, -9.5]
    ]
  },
  // 12. Japan Arch
  {
    name: 'Japan',
    points: [
      [31, 131], [33, 132], [35, 136], [38, 141], [43, 144], [44, 141],
      [41, 140], [36, 136], [34, 131], [31, 131]
    ]
  },
  // 13. Scandinavia (Norway & Sweden)
  {
    name: 'Scandinavia',
    points: [
      [56, 12], [58, 11], [63, 11], [68, 14], [71, 26], [70, 30],
      [66, 25], [63, 20], [60, 18], [56, 16], [56, 12]
    ]
  },
  // 14. Madagascar
  {
    name: 'Madagascar',
    points: [
      [-12, 49], [-16, 50], [-25, 47], [-25, 44], [-20, 44], [-15, 47], [-12, 49]
    ]
  },
  // 15. New Zealand
  {
    name: 'New Zealand',
    points: [
      [-35, 173], [-37, 175], [-41, 175], [-46, 169], [-46, 167], [-41, 172], [-37, 174], [-35, 173]
    ]
  },
  // 16. Indonesia / Sumatra & Java
  {
    name: 'Indonesia Arch',
    points: [
      [5, 96], [2, 100], [-3, 102], [-6, 106], [-8, 114], [-8, 115], [-6, 110], [-5, 105], [0, 101], [4, 98], [5, 96]
    ]
  },
  // 17. Philippines
  {
    name: 'Philippines Arch',
    points: [
      [18, 120], [18, 122], [14, 122], [10, 125], [6, 125], [6, 122], [10, 121], [14, 120], [18, 120]
    ]
  },
  // 18. Caribbean / Cuba
  {
    name: 'Caribbean Cuba',
    points: [
      [22, -84], [23, -82], [22, -78], [20, -75], [20, -77], [21, -81], [22, -84]
    ]
  },
  // 19. Antarctica Outer Ice Ring (Perimeter barrier of Gleason projection)
  {
    name: 'Antarctica',
    points: [
      [-64, -60], [-66, -30], [-69, 0], [-68, 30], [-66, 60], [-67, 90],
      [-66, 120], [-67, 150], [-71, 170], [-73, -170], [-71, -140],
      [-72, -100], [-68, -80], [-64, -60]
    ]
  }
];

export interface MajorCity {
  country: string;
  city: string;
  lat: number;
  lon: number;
  isCapital?: boolean;
}

export const NOTABLE_LOCATIONS: MajorCity[] = [
  // World Capital Cities
  { country: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278, isCapital: true },
  { country: 'France', city: 'Paris', lat: 48.8566, lon: 2.3522, isCapital: true },
  { country: 'Germany', city: 'Berlin', lat: 52.5200, lon: 13.4050, isCapital: true },
  { country: 'United States', city: 'Washington, D.C.', lat: 38.9072, lon: -77.0369, isCapital: true },
  { country: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503, isCapital: true },
  { country: 'China', city: 'Beijing', lat: 39.9042, lon: 116.4074, isCapital: true },
  { country: 'India', city: 'New Delhi', lat: 28.6139, lon: 77.2090, isCapital: true },
  { country: 'Australia', city: 'Canberra', lat: -35.2809, lon: 149.1300, isCapital: true },
  { country: 'Italy', city: 'Rome', lat: 41.9028, lon: 12.4964, isCapital: true },
  { country: 'Spain', city: 'Madrid', lat: 40.4168, lon: -3.7038, isCapital: true },
  { country: 'Egypt', city: 'Cairo', lat: 30.0444, lon: 31.2357, isCapital: true },
  { country: 'Russia', city: 'Moscow', lat: 55.7558, lon: 37.6173, isCapital: true },
  { country: 'Canada', city: 'Ottawa', lat: 45.4215, lon: -75.6972, isCapital: true },
  { country: 'Brazil', city: 'Brasília', lat: -15.7975, lon: -47.8919, isCapital: true },
  { country: 'Argentina', city: 'Buenos Aires', lat: -34.6037, lon: -58.3816, isCapital: true },
  { country: 'South Africa', city: 'Pretoria', lat: -25.7479, lon: 28.2293, isCapital: true },
  { country: 'South Korea', city: 'Seoul', lat: 37.5665, lon: 126.9780, isCapital: true },
  { country: 'Mexico', city: 'Mexico City', lat: 19.4326, lon: -99.1332, isCapital: true },
  { country: 'Norway', city: 'Oslo', lat: 59.9139, lon: 10.7522, isCapital: true },
  { country: 'Sweden', city: 'Stockholm', lat: 59.3293, lon: 18.0686, isCapital: true },
  { country: 'Greece', city: 'Athens', lat: 37.9838, lon: 23.7275, isCapital: true },
  { country: 'Turkey', city: 'Ankara', lat: 39.9334, lon: 32.8597, isCapital: true },
  { country: 'Saudi Arabia', city: 'Riyadh', lat: 24.7136, lon: 46.6753, isCapital: true },
  { country: 'Indonesia', city: 'Jakarta', lat: -6.2088, lon: 106.8456, isCapital: true },
  { country: 'Thailand', city: 'Bangkok', lat: 13.7563, lon: 100.5018, isCapital: true },
  { country: 'New Zealand', city: 'Wellington', lat: -41.2865, lon: 174.7762, isCapital: true },
  { country: 'Iceland', city: 'Reykjavík', lat: 64.1466, lon: -21.9426, isCapital: true },
  { country: 'Kenya', city: 'Nairobi', lat: -1.2921, lon: 36.8219, isCapital: true },
  { country: 'Ecuador', city: 'Quito', lat: -0.1807, lon: -78.4678, isCapital: true },
  { country: 'Singapore', city: 'Singapore', lat: 1.3521, lon: 103.8198, isCapital: true },
  { country: 'Poland', city: 'Warsaw', lat: 52.2297, lon: 21.0122, isCapital: true },
  { country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lon: 4.9041, isCapital: true },
  { country: 'Switzerland', city: 'Bern', lat: 46.9480, lon: 7.4474, isCapital: true },
  { country: 'Austria', city: 'Vienna', lat: 48.2082, lon: 16.3738, isCapital: true },
  { country: 'Ireland', city: 'Dublin', lat: 53.3498, lon: -6.2603, isCapital: true },
  { country: 'Portugal', city: 'Lisbon', lat: 38.7223, lon: -9.1393, isCapital: true },
  { country: 'Denmark', city: 'Copenhagen', lat: 55.6761, lon: 12.5683, isCapital: true },
  { country: 'Finland', city: 'Helsinki', lat: 60.1699, lon: 24.9384, isCapital: true },
  { country: 'Chile', city: 'Santiago', lat: -33.4489, lon: -70.6693, isCapital: true },
  { country: 'Colombia', city: 'Bogotá', lat: 4.7110, lon: -74.0721, isCapital: true },
  { country: 'Peru', city: 'Lima', lat: -12.0464, lon: -77.0428, isCapital: true },
  { country: 'Nigeria', city: 'Abuja', lat: 9.0765, lon: 7.3986, isCapital: true },
  { country: 'Philippines', city: 'Manila', lat: 14.5995, lon: 120.9842, isCapital: true },
  { country: 'Vietnam', city: 'Hanoi', lat: 21.0285, lon: 105.8542, isCapital: true },
  // Major Metropolises & Landmarks
  { country: 'United States', city: 'New York', lat: 40.7128, lon: -74.0060 },
  { country: 'United States', city: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { country: 'Australia', city: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { country: 'South Africa', city: 'Cape Town', lat: -33.9249, lon: 18.4241 },
  { country: 'Canada', city: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { country: 'Arctic', city: 'North Pole', lat: 89.999, lon: 0 },
];
