import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import gsap from 'gsap';
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
  const stemRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const emissiveRef = useRef({ intensity: 0.5 });

  // Convert lat/lon to 3D position
  const position = latLonToVector3(conflict.latitude, conflict.longitude, globeRadius + 0.05);

  // Fade-in animation on mount with cleanup
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (groupRef.current) {
        gsap.to(groupRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)',
          delay: Math.random() * 0.5,
        });
      }
      
      if (markerRef.current && stemRef.current) {
        const material1 = markerRef.current.material as THREE.MeshStandardMaterial;
        const material2 = stemRef.current.material as THREE.MeshStandardMaterial;
        gsap.to([material1, material2], {
          opacity: 1,
          duration: 0.6,
          delay: Math.random() * 0.3,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // Hover emissive intensity animation
  useEffect(() => {
    const targetIntensity = isSelected ? 0.8 : hovered ? 0.6 : 0.5;
    gsap.to(emissiveRef.current, {
      intensity: targetIntensity,
      duration: 0.3,
      ease: 'power2.out',
    });
  }, [hovered, isSelected]);

  // Unified pulsing animation with lerped scaling
  useFrame((state) => {
    if (markerRef.current && stemRef.current) {
      const material1 = markerRef.current.material as THREE.MeshStandardMaterial;
      const material2 = stemRef.current.material as THREE.MeshStandardMaterial;
      material1.emissiveIntensity = emissiveRef.current.intensity;
      material2.emissiveIntensity = emissiveRef.current.intensity * 0.6;
      
      const idlePulse = 1 + Math.sin(state.clock.elapsedTime * 2 + conflict.latitude) * 0.05;
      const selectedPulse = isSelected ? (1 + Math.sin(state.clock.elapsedTime * 3) * 0.15) : 1;
      const hoverScale = hovered ? 1.2 : 1;
      const selectedScale = isSelected ? 1.3 : 1;
      
      const targetScale = idlePulse * selectedPulse * hoverScale * selectedScale;
      markerRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      stemRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const color = getSeverityColor(conflict.severity);

  return (
    <group ref={groupRef} position={position} scale={[0, 0, 0]}>
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
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          roughness={0.3}
          metalness={0.7}
          opacity={0}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      {/* Pin stem */}
      <mesh ref={stemRef} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          roughness={0.3}
          metalness={0.7}
          opacity={0}
          transparent={true}
          depthWrite={false}
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
