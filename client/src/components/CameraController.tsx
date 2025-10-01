import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraControllerProps {
  conflictCount: number;
  timelineRange: [number, number];
}

export function CameraController({ conflictCount, timelineRange }: CameraControllerProps) {
  const { camera, controls } = useThree();
  const prevStateRef = useRef({ count: conflictCount, range: [...timelineRange] as [number, number] });
  const animatingRef = useRef(false);

  useEffect(() => {
    if (animatingRef.current || !prevStateRef.current.range) return;
    
    const orbitControls = controls as unknown as OrbitControlsImpl | null;
    const hasChanged = prevStateRef.current.count !== conflictCount || 
                      prevStateRef.current.range[0] !== timelineRange[0] ||
                      prevStateRef.current.range[1] !== timelineRange[1];
    
    if (hasChanged) {
      animatingRef.current = true;
      
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
      
      prevStateRef.current = { count: conflictCount, range: [...timelineRange] as [number, number] };
    }
  }, [conflictCount, timelineRange, camera, controls]);

  return null;
}
