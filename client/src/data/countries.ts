export interface Country {
  name: string;
  lat: number;
  lon: number;
  priority: number; // 1-3: 1=highest priority (always show), 2=medium, 3=low
}

export const majorCountries: Country[] = [
  // Priority 1 - Major global powers (always visible)
  { name: 'United States', lat: 38.0, lon: -97.0, priority: 1 },
  { name: 'China', lat: 35.0, lon: 105.0, priority: 1 },
  { name: 'Russia', lat: 60.0, lon: 100.0, priority: 1 },
  { name: 'India', lat: 20.0, lon: 77.0, priority: 1 },
  { name: 'Brazil', lat: -10.0, lon: -55.0, priority: 1 },
  
  // Priority 2 - Regional powers and large countries
  { name: 'Canada', lat: 56.0, lon: -106.0, priority: 2 },
  { name: 'Australia', lat: -25.0, lon: 133.0, priority: 2 },
  { name: 'Germany', lat: 51.0, lon: 10.0, priority: 2 },
  { name: 'France', lat: 46.0, lon: 2.0, priority: 2 },
  { name: 'United Kingdom', lat: 54.0, lon: -2.0, priority: 2 },
  { name: 'Japan', lat: 36.0, lon: 138.0, priority: 2 },
  { name: 'Mexico', lat: 23.0, lon: -102.0, priority: 2 },
  { name: 'South Africa', lat: -29.0, lon: 24.0, priority: 2 },
  { name: 'Egypt', lat: 26.0, lon: 30.0, priority: 2 },
  { name: 'Saudi Arabia', lat: 24.0, lon: 45.0, priority: 2 },
  { name: 'Turkey', lat: 39.0, lon: 35.0, priority: 2 },
  { name: 'Indonesia', lat: -2.0, lon: 118.0, priority: 2 },
  { name: 'Argentina', lat: -34.0, lon: -64.0, priority: 2 },
  
  // Priority 3 - Other notable countries
  { name: 'Spain', lat: 40.0, lon: -4.0, priority: 3 },
  { name: 'Italy', lat: 42.8, lon: 12.8, priority: 3 },
  { name: 'Poland', lat: 52.0, lon: 20.0, priority: 3 },
  { name: 'Ukraine', lat: 49.0, lon: 32.0, priority: 3 },
  { name: 'South Korea', lat: 37.0, lon: 127.5, priority: 3 },
  { name: 'Iran', lat: 32.0, lon: 53.0, priority: 3 },
  { name: 'Nigeria', lat: 9.0, lon: 8.0, priority: 3 },
  { name: 'Kenya', lat: 1.0, lon: 38.0, priority: 3 },
  { name: 'Thailand', lat: 15.0, lon: 101.0, priority: 3 },
  { name: 'Vietnam', lat: 16.0, lon: 108.0, priority: 3 },
  { name: 'Pakistan', lat: 30.0, lon: 70.0, priority: 3 },
  { name: 'Colombia', lat: 4.0, lon: -72.0, priority: 3 },
  { name: 'Peru', lat: -10.0, lon: -76.0, priority: 3 },
  { name: 'Chile', lat: -30.0, lon: -71.0, priority: 3 },
  { name: 'Norway', lat: 60.5, lon: 8.5, priority: 3 },
  { name: 'Sweden', lat: 62.0, lon: 15.0, priority: 3 },
  { name: 'New Zealand', lat: -41.0, lon: 174.0, priority: 3 },
];
