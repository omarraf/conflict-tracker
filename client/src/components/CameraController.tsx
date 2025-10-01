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
  const isUserInteractingRef = useRef(false);
  const animationsRef = useRef<gsap.core.Tween[]>([]);

  // Listen for user interaction with OrbitControls
  useEffect(() => {
    const orbitControls = controls as unknown as OrbitControlsImpl | null;
    if (!orbitControls) return;

    const onInteractionStart = () => {
      isUserInteractingRef.current = true;
      // Kill any running camera animations when user starts interacting
      animationsRef.current.forEach(tween => tween.kill());
      animationsRef.current = [];
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera);
    };

    const onInteractionEnd = () => {
      isUserInteractingRef.current = false;
    };

    orbitControls.addEventListener('start', onInteractionStart);
    orbitControls.addEventListener('end', onInteractionEnd);

    return () => {
      orbitControls.removeEventListener('start', onInteractionStart);
      orbitControls.removeEventListener('end', onInteractionEnd);
    };
  }, [controls, camera]);

  useEffect(() => {
    if (!prevStateRef.current.range) return;
    
    const orbitControls = controls as unknown as OrbitControlsImpl | null;
    const hasChanged = prevStateRef.current.count !== conflictCount || 
                      prevStateRef.current.range[0] !== timelineRange[0] ||
                      prevStateRef.current.range[1] !== timelineRange[1];
    
    if (hasChanged && !isUserInteractingRef.current) {
      // Kill any existing animations for responsiveness
      animationsRef.current.forEach(tween => tween.kill());
      animationsRef.current = [];
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera);
      
      // Invert zoom logic: more conflicts = zoom OUT for broader context
      // 0 conflicts: closer view (distance 5)
      // Many conflicts: farther view (distance 8+)
      const targetDistance = conflictCount === 0 ? 5 : Math.max(5, Math.min(10, 6 + conflictCount * 0.3));
      
      const currentPos = camera.position.clone();
      const direction = currentPos.clone().normalize();
      const targetPos = direction.multiplyScalar(targetDistance);
      
      const positionTween = gsap.to(camera.position, {
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
        }
      });
      
      // More conflicts = wider FOV for better overview
      const fovTween = gsap.to(camera, {
        fov: conflictCount === 0 ? 45 : Math.max(45, Math.min(60, 50 + conflictCount * 0.5)),
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.updateProjectionMatrix();
        }
      });

      animationsRef.current = [positionTween, fovTween];
      
      prevStateRef.current = { count: conflictCount, range: [...timelineRange] as [number, number] };
    }
  }, [conflictCount, timelineRange, camera, controls]);

  return null;
}
