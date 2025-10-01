import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);

  // Slow auto-rotation
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={globeRef} rotation={[0, 0, 0]}>
      {/* Sphere geometry for the globe */}
      <sphereGeometry args={[2, 64, 64]} />
      
      {/* Material with blue/green earth-like appearance */}
      <meshStandardMaterial
        color="#1e3a5f"
        roughness={0.7}
        metalness={0.2}
        emissive="#0a1929"
        emissiveIntensity={0.2}
      />
      
      {/* Continents overlay using wireframe for simple land representation */}
      <mesh>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial
          color="#2d5a3d"
          wireframe={true}
          opacity={0.3}
          transparent={true}
        />
      </mesh>
      
      {/* Ocean with slight transparency */}
      <mesh>
        <sphereGeometry args={[1.99, 64, 64]} />
        <meshStandardMaterial
          color="#1a4d6f"
          roughness={0.3}
          metalness={0.5}
          opacity={0.9}
          transparent={true}
        />
      </mesh>
    </mesh>
  );
}
