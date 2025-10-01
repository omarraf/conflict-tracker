import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraControllerProps {
  conflictCount: number;
}

export function CameraController({ conflictCount }: CameraControllerProps) {
  const { camera, controls } = useThree();
  const prevCountRef = useRef(conflictCount);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!controls || animatingRef.current) return;
    
    const orbitControls = controls as unknown as OrbitControlsImpl;
    
    if (prevCountRef.current !== conflictCount) {
      animatingRef.current = true;
      
      const currentDistance = camera.position.length();
      const targetDistance = conflictCount === 0 ? 8 : Math.max(4, Math.min(7, 5 + (10 - conflictCount) * 0.2));
      
      const currentPos = camera.position.clone();
      const direction = currentPos.clone().normalize();
      const targetPos = direction.multiplyScalar(targetDistance);
      
      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
          if (orbitControls) {
            orbitControls.update();
          }
        },
        onComplete: () => {
          animatingRef.current = false;
        }
      });
      
      gsap.to(camera, {
        fov: conflictCount === 0 ? 50 : Math.max(40, Math.min(50, 45 - conflictCount * 0.3)),
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.updateProjectionMatrix();
        }
      });
      
      prevCountRef.current = conflictCount;
    }
  }, [conflictCount, camera, controls]);

  return null;
}
