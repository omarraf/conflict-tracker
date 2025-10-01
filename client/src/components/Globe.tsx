import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CountryBorders } from './CountryBorders';
import { CountryLabels } from './CountryLabels';

export function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);
  
  // Load Earth day texture
  const earthTexture = useTexture('/textures/earth_daymap.jpg');
  
  // Configure texture for proper rendering
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.anisotropy = 16;

  // Slow auto-rotation
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={globeRef as any} rotation={[0, 0, 0]}>
      {/* Sphere geometry for the globe - high detail for realistic texture */}
      <mesh>
        <sphereGeometry args={[2, 128, 128]} />
        
        {/* Realistic Earth material with texture map */}
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Country borders overlay */}
      <CountryBorders 
        radius={2.005}
        color="#ffffff"
        lineWidth={1.2}
        opacity={0.5}
      />
      
      {/* Country labels with intelligent scaling and fading */}
      <CountryLabels radius={2.1} />
    </group>
  );
}
