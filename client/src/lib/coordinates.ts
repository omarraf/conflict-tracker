import * as THREE from 'three';

/**
 * Convert latitude and longitude to 3D cartesian coordinates on a sphere
 * @param lat Latitude in degrees
 * @param lon Longitude in degrees
 * @param radius Radius of the sphere
 * @returns THREE.Vector3 position
 */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Get a color based on conflict severity
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#ef4444'; // red-500
    case 'high':
      return '#f97316'; // orange-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#22c55e'; // green-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Calculate years since a date
 */
export function getYearsSince(dateString: string): number {
  const startDate = new Date(dateString);
  const now = new Date();
  const years = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years);
}
