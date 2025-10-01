import * as THREE from 'three';

/**
 * Convert latitude/longitude coordinates to 3D vector on a sphere
 * @param lat Latitude in degrees (-90 to 90)
 * @param lon Longitude in degrees (-180 to 180)
 * @param radius Radius of the sphere
 * @returns THREE.Vector3 position on the sphere
 */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert GeoJSON coordinates to 3D line segments
 * @param coordinates GeoJSON coordinates array
 * @param radius Sphere radius
 * @returns Array of THREE.Vector3 points
 */
export function geoJSONToPoints(
  coordinates: number[][] | number[][][],
  radius: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  function processCoordinates(coords: number[][] | number[][][]): void {
    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      // MultiLineString or Polygon
      (coords as number[][][]).forEach(processCoordinates);
    } else {
      // LineString
      (coords as number[][]).forEach(([lon, lat]) => {
        points.push(latLonToVector3(lat, lon, radius));
      });
    }
  }

  processCoordinates(coordinates);
  return points;
}
