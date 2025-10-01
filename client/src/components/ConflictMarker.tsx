import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Conflict } from '../types/conflict';
import { latLonToVector3, getSeverityColor } from '../lib/coordinates';

interface ConflictMarkerProps {
  conflict: Conflict;
  onSelect: (conflict: Conflict) => void;
  isSelected: boolean;
  globeRadius: number;
}

export function ConflictMarker({ conflict, onSelect, isSelected, globeRadius }: ConflictMarkerProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Convert lat/lon to 3D position
  const position = latLonToVector3(conflict.latitude, conflict.longitude, globeRadius + 0.05);

  // Pulsing animation for selected marker
  useFrame((state) => {
    if (markerRef.current && isSelected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      markerRef.current.scale.setScalar(scale);
    } else if (markerRef.current) {
      markerRef.current.scale.setScalar(1);
    }
  });

  const color = getSeverityColor(conflict.severity);
  const size = isSelected ? 0.08 : hovered ? 0.06 : 0.05;

  return (
    <group position={position}>
      {/* Pin base */}
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(conflict);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : 0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Pin stem */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Hover label */}
      {hovered && !isSelected && (
        <Html distanceFactor={8} center>
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none shadow-xl border border-white/20">
            <div className="font-semibold">{conflict.name}</div>
            <div className="text-xs text-gray-300 mt-1">{conflict.region}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
