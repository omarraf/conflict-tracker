import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { majorCountries } from '../data/countries';
import { latLonToVector3 } from '../utils/geoUtils';
import * as THREE from 'three';

interface CountryLabelsProps {
  radius?: number;
}

export function CountryLabels({ radius = 2 }: CountryLabelsProps) {
  const countryPositions = useMemo(() => {
    return majorCountries.map(country => ({
      ...country,
      position: latLonToVector3(country.lat, country.lon, radius),
    }));
  }, [radius]);

  return (
    <group>
      {countryPositions.map((country) => (
        <CountryLabel
          key={country.name}
          name={country.name}
          position={country.position}
          priority={country.priority}
        />
      ))}
    </group>
  );
}

interface CountryLabelProps {
  name: string;
  position: THREE.Vector3;
  priority: number;
}

function CountryLabel({ name, position, priority }: CountryLabelProps) {
  const { camera } = useThree();
  const labelRef = useRef<THREE.Object3D>(null!);
  const htmlRef = useRef<HTMLDivElement>(null);
  const worldPosition = useRef(new THREE.Vector3());
  const toCamera = useRef(new THREE.Vector3());
  const toLabel = useRef(new THREE.Vector3());

  // Update visibility and scale every frame based on camera position and globe rotation
  useFrame(() => {
    if (!labelRef.current || !htmlRef.current) return;

    // Get world position of label (accounts for globe rotation)
    labelRef.current.getWorldPosition(worldPosition.current);
    
    const cameraPosition = camera.position;
    const distance = cameraPosition.distanceTo(worldPosition.current);
    
    // Calculate if label is on the visible side of the globe
    toCamera.current.copy(cameraPosition).normalize();
    toLabel.current.copy(worldPosition.current).normalize();
    const dotProduct = toLabel.current.dot(toCamera.current);
    
    // Only show labels on the front hemisphere
    if (dotProduct < 0.2) {
      htmlRef.current.style.opacity = '0';
      htmlRef.current.style.pointerEvents = 'none';
      return;
    }
    
    // Distance-based visibility (closer = more visible)
    // Priority 1: always visible when in view (no distance culling)
    // Priority 2: visible at medium zoom
    // Priority 3: visible only at close zoom
    const baseDistance = 5;
    const distanceFactor = Math.max(0, 1 - (distance - baseDistance) / 5);
    
    let finalOpacity: number;
    
    if (priority === 1) {
      // Priority 1: always visible when in view, fade only by angle
      const angleFade = Math.pow(dotProduct, 2);
      finalOpacity = Math.max(0.3, angleFade); // Minimum 30% opacity for readability
    } else {
      // Priority 2 & 3: apply distance culling
      const priorityThreshold = priority === 2 ? 0.5 : 0.7;
      
      if (distanceFactor < priorityThreshold) {
        htmlRef.current.style.opacity = '0';
        htmlRef.current.style.pointerEvents = 'none';
        return;
      }
      
      // Fade based on angle and distance
      const angleFade = Math.pow(dotProduct, 2);
      finalOpacity = angleFade * Math.min(1, distanceFactor * 1.5);
    }
    
    // Scale down as we zoom out
    const finalScale = Math.max(0.5, Math.min(1.5, 10 / distance));
    
    // Direct DOM manipulation to avoid React re-renders
    htmlRef.current.style.opacity = finalOpacity.toString();
    htmlRef.current.style.transform = `scale(${finalScale})`;
    htmlRef.current.style.pointerEvents = finalOpacity < 0.05 ? 'none' : 'none'; // Always none
  });

  return (
    <object3D ref={labelRef} position={position}>
      <Html center zIndexRange={[0, 0]}>
        <div
          ref={htmlRef}
          style={{
            color: 'white',
            fontSize: '12px',
            fontWeight: priority === 1 ? 'bold' : priority === 2 ? '600' : 'normal',
            textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
            padding: '2px 6px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '3px',
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.1s ease, transform 0.1s ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {name}
        </div>
      </Html>
    </object3D>
  );
}
