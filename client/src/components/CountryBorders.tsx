import { useEffect, useState, useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { geoJSONToPoints } from '../utils/geoUtils';

interface CountryBordersProps {
  radius?: number;
  color?: string;
  lineWidth?: number;
  opacity?: number;
}

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

export function CountryBorders({
  radius = 2.005,
  color = '#ffffff',
  lineWidth = 0.8,
  opacity = 0.4
}: CountryBordersProps) {
  const [geoData, setGeoData] = useState<GeoJSONCollection | null>(null);

  useEffect(() => {
    fetch('/countries.geo.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Error loading country borders:', err));
  }, []);

  const borderLines = useMemo(() => {
    if (!geoData) return [];

    const lines: THREE.Vector3[][] = [];

    geoData.features.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        const points = geoJSONToPoints(feature.geometry.coordinates, radius);
        if (points.length > 0) {
          lines.push(points);
        }
      } else if (feature.geometry.type === 'MultiPolygon') {
        const multiPolygonCoords = feature.geometry.coordinates as unknown as number[][][][];
        multiPolygonCoords.forEach((polygon) => {
          const points = geoJSONToPoints(polygon, radius);
          if (points.length > 0) {
            lines.push(points);
          }
        });
      }
    });

    return lines;
  }, [geoData, radius]);

  if (!geoData || borderLines.length === 0) {
    return null;
  }

  return (
    <group>
      {borderLines.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={color}
          lineWidth={lineWidth}
          transparent
          opacity={opacity}
        />
      ))}
    </group>
  );
}
