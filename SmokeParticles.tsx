import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OperationMode } from '../types/factory';

interface SmokeParticlesProps {
  mode: OperationMode;
  transitionProgress: number;
  origin?: [number, number, number];
}

interface PuffSeed {
  phase: number;
  speedFactor: number;
  angle: number;
  driftRadius: number;
  rotSpeed: [number, number, number];
}

const PARTICLE_COUNT = 54;

export const SmokeParticles: React.FC<SmokeParticlesProps> = ({
  mode,
  transitionProgress,
  origin = [0, 6.55, 0],
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const matTintTarget = useMemo(() => new THREE.Color('#cbd5e1'), []);

  const baseDarkSmoke = useMemo(() => new THREE.Color('#141a24'), []);
  const sootCoreColor = useMemo(() => new THREE.Color('#3f1d1d'), []);
  const baselineSmoke = useMemo(() => new THREE.Color('#94a3b8'), []);
  const cleanVapor = useMemo(() => new THREE.Color('#ecfdf5'), []);
  const cleanMint = useMemo(() => new THREE.Color('#a7f3d0'), []);

  const currentOpacity = useRef(0.42);
  const currentDensity = useRef(0.48);

  const seeds = useMemo<PuffSeed[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      phase: i / PARTICLE_COUNT,
      speedFactor: 0.82 + ((i * 17) % 10) * 0.04,
      angle: ((i * 137.5) * Math.PI) / 180,
      driftRadius: 0.14 + ((i * 23) % 11) * 0.035,
      rotSpeed: [
        (((i * 7) % 5) - 2) * 0.35,
        (((i * 11) % 5) - 2) * 0.35,
        (((i * 13) % 5) - 2) * 0.35,
      ],
    }));
  }, []);

  // Pre-initialize instanceColor synchronously so Three.js compiles shader with USE_INSTANCING_COLOR
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      mesh.setColorAt(i, baselineSmoke);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    if (materialRef.current) {
      materialRef.current.needsUpdate = true;
    }
  }, [baselineSmoke]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    const elapsed = state.clock.getElapsedTime();

    let targetDensity = 0.48;
    let targetOpacity = 0.4;

    if (mode === 'fault') {
      targetDensity = 1.0;
      targetOpacity = 0.82;
      matTintTarget.set('#262e3d');
    } else if (mode === 'baseline') {
      targetDensity = 0.48;
      targetOpacity = 0.42;
      matTintTarget.set('#cbd5e1');
    } else {
      targetDensity = THREE.MathUtils.lerp(0.65, 0.07, transitionProgress);
      targetOpacity = THREE.MathUtils.lerp(0.55, 0.24, transitionProgress);
      matTintTarget.set('#262e3d').lerp(cleanVapor, transitionProgress);
    }

    const lerpRate = Math.min(1, delta * 3.4);
    currentDensity.current = THREE.MathUtils.lerp(
      currentDensity.current,
      targetDensity,
      lerpRate
    );
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity,
      lerpRate
    );

    const d = currentDensity.current;
    mat.opacity = currentOpacity.current;
    mat.color.lerp(matTintTarget, lerpRate);

    const speedBase = THREE.MathUtils.lerp(0.3, 0.72, d);
    const maxRiseHeight = THREE.MathUtils.lerp(2.6, 5.5, d);
    const windDriftX = THREE.MathUtils.lerp(0.5, 1.75, d);
    const windDriftZ = THREE.MathUtils.lerp(-0.22, -0.85, d);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = seeds[i];
      const life = (elapsed * speedBase * s.speedFactor + s.phase) % 1;

      // Thin out particle count visually in Eco-Optimized mode for minimal clean vapor
      const sparseFactor =
        i % 2 === 1 ? THREE.MathUtils.lerp(0.12, 1.0, Math.min(1, d * 1.8)) : 1.0;

      const y = life * maxRiseHeight;
      const swirl = elapsed * (0.9 + d * 1.3) + s.angle + life * 2.6;
      const spread = life * (0.32 + d * 1.0);

      const x =
        Math.cos(swirl) * s.driftRadius * (1 + spread * 2.15) +
        Math.pow(life, 1.25) * windDriftX;
      const z =
        Math.sin(swirl) * s.driftRadius * (1 + spread * 2.15) +
        Math.pow(life, 1.25) * windDriftZ;

      const birthScale = Math.min(1, life * 6.0);
      const fadeOutScale = life > 0.72 ? 1 - (life - 0.72) / 0.28 : 1;
      const baseRadius = THREE.MathUtils.lerp(0.15, 0.44, d);
      const billowRadius =
        (baseRadius + life * THREE.MathUtils.lerp(0.17, 0.72, d)) *
        birthScale *
        Math.max(0.001, fadeOutScale) *
        sparseFactor;

      dummy.position.set(origin[0] + x, origin[1] + y, origin[2] + z);
      dummy.rotation.set(
        elapsed * s.rotSpeed[0],
        elapsed * s.rotSpeed[1],
        elapsed * s.rotSpeed[2]
      );
      dummy.scale.set(billowRadius, billowRadius * 0.86, billowRadius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (d < 0.35) {
        const cleanBlend = d / 0.35;
        tempColor.copy(cleanMint).lerp(cleanVapor, life * 0.75);
        tempColor.lerp(baselineSmoke, cleanBlend * 0.55);
      } else {
        const faultBlend = (d - 0.35) / 0.65;
        tempColor.copy(baselineSmoke).lerp(baseDarkSmoke, faultBlend);
        if (life < 0.24 && faultBlend > 0.45) {
          tempColor.lerp(sootCoreColor, (1 - life / 0.24) * 0.5 * faultBlend);
        }
      }
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
      raycast={() => null}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#cbd5e1"
        transparent
        opacity={0.42}
        depthWrite={false}
        roughness={0.92}
        metalness={0.02}
        flatShading
      />
    </instancedMesh>
  );
};
