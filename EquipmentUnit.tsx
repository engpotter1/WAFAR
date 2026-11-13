import React, { useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  EquipmentId,
  EquipmentTelemetry,
  OperationMode,
} from '../types/factory';
import { SmokeParticles } from './SmokeParticles';

interface EquipmentUnitProps {
  telemetry: EquipmentTelemetry;
  mode: OperationMode;
  transitionProgress: number;
  isSelected: boolean;
  onSelect: (id: EquipmentId) => void;
}

export const EquipmentUnit: React.FC<EquipmentUnitProps> = ({
  telemetry,
  mode,
  transitionProgress,
  isSelected,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);

  // Refs for animated emissive materials & rotating cooling fans / agitators
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const padRingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const fan1Ref = useRef<THREE.Group>(null);
  const fan2Ref = useRef<THREE.Group>(null);
  const agitatorRef = useRef<THREE.Group>(null);
  const phaseBMeshRef = useRef<THREE.MeshStandardMaterial>(null);

  const colorEmerald = useMemo(() => new THREE.Color('#10B981'), []);
  const colorAmber = useMemo(() => new THREE.Color('#F59E0B'), []);
  const colorRed = useMemo(() => new THREE.Color('#EF4444'), []);
  const colorCyan = useMemo(() => new THREE.Color('#06B6D4'), []);
  const workingColor = useMemo(() => new THREE.Color('#F59E0B'), []);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(telemetry.id);
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Determine target status color & pulse intensity
    let pulseIntensity = 1.1;
    if (mode === 'fault') {
      // Reactor & Boiler pulse intense crimson red; cooling & stack also show fault stress
      const isPrimaryFault =
        telemetry.id === 'reactor' ||
        telemetry.id === 'boiler' ||
        telemetry.id === 'smokestack';
      workingColor.copy(isPrimaryFault ? colorRed : colorAmber);
      if (!isPrimaryFault) {
        workingColor.lerp(colorRed, 0.55);
      }
      const fastPulse = 0.5 + 0.5 * Math.sin(t * 7.2);
      pulseIntensity = 1.0 + fastPulse * 1.9;
    } else if (mode === 'optimized') {
      // Smoothly transition from amber/red to glowing emerald green over 2s
      workingColor.copy(colorAmber).lerp(colorEmerald, transitionProgress);
      const calmBreath = 0.5 + 0.5 * Math.sin(t * 2.4);
      pulseIntensity =
        THREE.MathUtils.lerp(1.2, 1.45, transitionProgress) + calmBreath * 0.35;
    } else {
      // Baseline mode
      if (telemetry.id === 'cooling') {
        workingColor.copy(colorCyan).lerp(colorAmber, 0.35);
      } else {
        workingColor.copy(colorAmber);
      }
      pulseIntensity = 0.85 + 0.2 * Math.sin(t * 2.0);
    }

    const colorLerp = Math.min(1, delta * 5.0);

    if (coreMatRef.current) {
      coreMatRef.current.color.lerp(workingColor, colorLerp);
      coreMatRef.current.emissive.lerp(workingColor, colorLerp);
      coreMatRef.current.emissiveIntensity = pulseIntensity;
    }

    if (accentMatRef.current) {
      accentMatRef.current.emissive.lerp(workingColor, colorLerp);
      accentMatRef.current.emissiveIntensity = pulseIntensity * 0.72;
    }

    if (padRingMatRef.current) {
      padRingMatRef.current.color.lerp(workingColor, colorLerp);
      padRingMatRef.current.emissive.lerp(workingColor, colorLerp);
      padRingMatRef.current.emissiveIntensity =
        isSelected || hovered ? 2.1 : 0.75;
    }

    if (phaseBMeshRef.current) {
      if (mode === 'fault') {
        phaseBMeshRef.current.color.copy(colorRed);
        phaseBMeshRef.current.emissive.copy(colorRed);
        phaseBMeshRef.current.emissiveIntensity =
          1.2 + 1.8 * (0.5 + 0.5 * Math.sin(t * 12));
      } else {
        phaseBMeshRef.current.color.lerp(workingColor, colorLerp);
        phaseBMeshRef.current.emissive.lerp(workingColor, colorLerp);
        phaseBMeshRef.current.emissiveIntensity = 1.2;
      }
    }

    // Rotate Cooling Tower fans physically (faster & erratic during fault/high load!)
    if (fan1Ref.current && fan2Ref.current) {
      let fanSpeed1 = 4.4;
      let fanSpeed2 = -4.4;
      if (mode === 'fault') {
        // High load + erratic cavitation oscillation
        fanSpeed1 = 10.5 + Math.sin(t * 13.5) * 5.2 + Math.cos(t * 23.0) * 2.4;
        fanSpeed2 = -(9.8 + Math.cos(t * 15.0) * 5.8);
      } else if (mode === 'optimized') {
        fanSpeed1 = THREE.MathUtils.lerp(6.5, 3.2, transitionProgress);
        fanSpeed2 = -THREE.MathUtils.lerp(6.5, 3.2, transitionProgress);
      }
      fan1Ref.current.rotation.y += delta * fanSpeed1;
      fan2Ref.current.rotation.y += delta * fanSpeed2;
    }

    // Subtle reactor top agitator shaft rotation
    if (agitatorRef.current) {
      const agiSpeed = mode === 'fault' ? 5.5 : mode === 'optimized' ? 2.6 : 3.4;
      agitatorRef.current.rotation.y += delta * agiSpeed;
    }
  });

  // Pin elevation per equipment type
  const pinPosition: [number, number, number] =
    telemetry.id === 'smokestack'
      ? [0, 5.15, 0.9]
      : telemetry.id === 'reactor'
      ? [0, 4.75, 0]
      : telemetry.id === 'boiler'
      ? [0, 3.95, 0]
      : [0, 3.75, 0];

  const badgeBorderClass =
    mode === 'fault'
      ? 'border-red-500/70 bg-slate-950/90 shadow-[0_0_18px_rgba(239,68,68,0.45)]'
      : mode === 'optimized'
      ? 'border-emerald-400/70 bg-slate-950/90 shadow-[0_0_18px_rgba(16,185,129,0.4)]'
      : 'border-amber-400/60 bg-slate-950/88 shadow-[0_0_14px_rgba(245,158,11,0.28)]';

  const dotClass =
    mode === 'fault'
      ? 'bg-red-500 shadow-[0_0_8px_#EF4444]'
      : mode === 'optimized'
      ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
      : 'bg-amber-400 shadow-[0_0_8px_#F59E0B]';

  return (
    <group
      position={telemetry.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Interactive Equipment Base Pad & Glowing Perimeter Ring */}
      <group position={[0, 0.06, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry
            args={[
              telemetry.id === 'cooling' ? 2.55 : 2.05,
              telemetry.id === 'cooling' ? 2.68 : 2.18,
              0.12,
              24,
            ]}
          />
          <meshStandardMaterial
            color={isSelected || hovered ? '#16243d' : '#0f1829'}
            metalness={0.55}
            roughness={0.45}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <ringGeometry
            args={[
              telemetry.id === 'cooling' ? 2.42 : 1.92,
              telemetry.id === 'cooling' ? 2.54 : 2.04,
              32,
            ]}
          />
          <meshStandardMaterial
            ref={padRingMatRef}
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 1. CHEMICAL REACTOR TANK (المفاعل الكيميائي) */}
      {telemetry.id === 'reactor' && (
        <group>
          {/* 4 Structural Support Legs */}
          {[
            [-0.78, 0.7, -0.78],
            [0.78, 0.7, -0.78],
            [-0.78, 0.7, 0.78],
            [0.78, 0.7, 0.78],
          ].map((pos, idx) => (
            <mesh key={idx} position={pos as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.1, 0.13, 1.35, 8]} />
              <meshStandardMaterial
                color="#334155"
                metalness={0.7}
                roughness={0.35}
              />
            </mesh>
          ))}

          {/* Main Stainless-Steel Cylindrical Vessel */}
          <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.08, 1.08, 2.15, 24]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>

          {/* Bottom & Top Hemispherical Pressure Domes */}
          <mesh position={[0, 1.18, 0]} castShadow>
            <sphereGeometry args={[1.07, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.8}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0, 3.32, 0]} castShadow>
            <sphereGeometry args={[1.07, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.84}
              roughness={0.2}
            />
          </mesh>

          {/* Glowing Status Core Sight-Window */}
          <mesh position={[0, 2.25, 0.99]}>
            <boxGeometry args={[0.34, 1.48, 0.22]} />
            <meshStandardMaterial
              ref={coreMatRef}
              color="#10B981"
              emissive="#10B981"
              emissiveIntensity={1.4}
              roughness={0.18}
              metalness={0.1}
            />
          </mesh>

          {/* 3 Cooling Jacket Rings Around Vessel */}
          {[1.55, 2.25, 2.95].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.13, 0.065, 10, 28]} />
              <meshStandardMaterial
                ref={idx === 1 ? accentMatRef : undefined}
                color="#1e293b"
                emissive={
                  mode === 'fault'
                    ? '#EF4444'
                    : mode === 'optimized'
                    ? '#10B981'
                    : '#F59E0B'
                }
                emissiveIntensity={0.65}
                metalness={0.75}
                roughness={0.28}
              />
            </mesh>
          ))}

          {/* Top Agitator Motor Housing & Rotating Coupler */}
          <group position={[0, 3.92, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.36, 0.62, 14]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.68}
                roughness={0.32}
              />
            </mesh>
            <group ref={agitatorRef} position={[0, -0.35, 0]}>
              <mesh>
                <boxGeometry args={[0.72, 0.08, 0.14]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          </group>

          {/* High-Pressure Side Manifold Pipes */}
          <mesh position={[1.22, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 2.1, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[1.05, 3.15, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.42, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[-1.18, 2.4, 0.3]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 1.75, 10]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.65} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 2. INDUSTRIAL THERMAL BOILER (الغلاية الحرارية) */}
      {telemetry.id === 'boiler' && (
        <group>
          {/* Heavy Reinforced Furnace Saddle Base */}
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.75, 0.48, 1.85]} />
            <meshStandardMaterial color="#1e293b" metalness={0.62} roughness={0.45} />
          </mesh>

          {/* Horizontal Cylindrical Fire-Tube Drum */}
          <mesh
            position={[0.1, 1.55, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[1.02, 1.02, 2.65, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.74} roughness={0.32} />
          </mesh>

          {/* Boiler End Caps */}
          <mesh position={[-1.24, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.92, 1.02, 0.22, 24]} />
            <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[1.44, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.02, 0.92, 0.22, 24]} />
            <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.28} />
          </mesh>

          {/* Glowing Furnace Combustion Core Viewport (Front & Burner Mouth) */}
          <mesh position={[0.1, 1.48, 0.97]}>
            <boxGeometry args={[1.45, 0.42, 0.16]} />
            <meshStandardMaterial
              ref={coreMatRef}
              color="#F59E0B"
              emissive="#F59E0B"
              emissiveIntensity={1.5}
              roughness={0.2}
            />
          </mesh>

          {/* Copper/Alloy Heat-Exchanger Coils Wrapped Along Boiler Drum */}
          {[-0.65, -0.15, 0.35, 0.85].map((xPos, idx) => (
            <mesh
              key={idx}
              position={[xPos, 1.55, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry args={[1.06, 0.055, 10, 26]} />
              <meshStandardMaterial
                ref={idx === 1 ? accentMatRef : undefined}
                color="#b45309"
                emissive={
                  mode === 'fault'
                    ? '#EF4444'
                    : mode === 'optimized'
                    ? '#10B981'
                    : '#F59E0B'
                }
                emissiveIntensity={0.55}
                metalness={0.85}
                roughness={0.22}
              />
            </mesh>
          ))}

          {/* Fuel Gas Burner Nozzle & Intake Pipe Assembly (Left End) */}
          <group position={[-1.58, 1.42, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.38, 0.46, 0.55, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Yellow/Eco Fuel Gas Intake Pipe */}
            <mesh position={[-0.18, -0.55, 0.42]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 1.15, 10]} />
              <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.32} />
            </mesh>
          </group>

          {/* Top Steam Header Dome & Outlet Pipe */}
          <mesh position={[0.15, 2.75, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.42, 0.48, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.82} roughness={0.22} />
          </mesh>
          <mesh position={[0.15, 3.12, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 1.85, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.22} />
          </mesh>
        </group>
      )}

      {/* 3. COOLING TOWER & POWER GRID UNIT (وحدة التبريد والطاقة) */}
      {telemetry.id === 'cooling' && (
        <group>
          {/* Twin Cooling Tower Structure (Left/Center of Pad) */}
          <group position={[-0.55, 0, 0]}>
            {/* Chilled Water Basin */}
            <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.55, 0.44, 1.72]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Glowing Chilled Water Surface Strip */}
            <mesh position={[0, 0.57, 0]}>
              <boxGeometry args={[2.38, 0.05, 1.54]} />
              <meshStandardMaterial
                ref={accentMatRef}
                color="#06B6D4"
                emissive="#06B6D4"
                emissiveIntensity={0.9}
                roughness={0.15}
              />
            </mesh>

            {/* Cooling Tower Main Louvered Housing */}
            <mesh position={[0, 1.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.35, 1.68, 1.5]} />
              <meshStandardMaterial color="#334155" metalness={0.62} roughness={0.38} />
            </mesh>

            {/* Twin Top Fan Shrouds + Physically Rotating Fans */}
            {[-0.6, 0.6].map((xOffset, idx) => (
              <group key={idx} position={[xOffset, 2.45, 0]}>
                {/* Cylindrical Shroud */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.52, 0.56, 0.36, 20, 1, true]} />
                  <meshStandardMaterial
                    color="#475569"
                    metalness={0.75}
                    roughness={0.28}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Dark Inner Fan Pit */}
                <mesh position={[0, -0.08, 0]}>
                  <cylinderGeometry args={[0.49, 0.49, 0.08, 18]} />
                  <meshStandardMaterial color="#090f1c" roughness={0.9} />
                </mesh>
                {/* Rotating 6-Blade Aerodynamic Cooling Fan */}
                <group ref={idx === 0 ? fan1Ref : fan2Ref} position={[0, 0.04, 0]}>
                  <mesh>
                    <cylinderGeometry args={[0.11, 0.11, 0.12, 12]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
                  </mesh>
                  {[0, 1, 2, 3, 4, 5].map((b) => (
                    <mesh
                      key={b}
                      rotation={[0.25, (b * Math.PI) / 3, 0]}
                      position={[
                        Math.cos((b * Math.PI) / 3) * 0.24,
                        0,
                        Math.sin((b * Math.PI) / 3) * 0.24,
                      ]}
                    >
                      <boxGeometry args={[0.36, 0.025, 0.11]} />
                      <meshStandardMaterial
                        color="#e2e8f0"
                        metalness={0.78}
                        roughness={0.22}
                      />
                    </mesh>
                  ))}
                </group>
              </group>
            ))}
          </group>

          {/* Electrical Transformer & Power Grid Hub (Right Side of Pad) */}
          <group position={[1.38, 0, 0]}>
            {/* Finned HV Transformer Core */}
            <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.98, 1.56, 1.32]} />
              <meshStandardMaterial color="#1e293b" metalness={0.76} roughness={0.3} />
            </mesh>
            {/* Cooling Radiator Fins */}
            {[-0.4, 0, 0.4].map((zOff, i) => (
              <mesh key={i} position={[0.52, 0.98, zOff]}>
                <boxGeometry args={[0.12, 1.24, 0.14]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.28} />
              </mesh>
            ))}
            {/* 3 High-Voltage Ceramic Bushings + Phase LED Bars */}
            {[-0.36, 0, 0.36].map((zOff, idx) => (
              <group key={idx} position={[0, 1.98, zOff]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.07, 0.1, 0.48, 12]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.35} />
                </mesh>
                {/* Glowing Phase Status Tip (Phase-B flashes red on imbalance fault!) */}
                <mesh position={[0, 0.29, 0]}>
                  <sphereGeometry args={[0.075, 12, 12]} />
                  <meshStandardMaterial
                    ref={idx === 1 ? phaseBMeshRef : idx === 0 ? coreMatRef : undefined}
                    color="#10B981"
                    emissive="#10B981"
                    emissiveIntensity={1.3}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}

      {/* 4. EXHAUST SMOKESTACK (مدخنة الانبعاثات) */}
      {telemetry.id === 'smokestack' && (
        <group>
          {/* Reinforced Octagonal Plinth Base */}
          <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.05, 1.28, 0.95, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.5} />
          </mesh>

          {/* Tall Tapered Industrial Chimney Stack */}
          <mesh position={[0, 3.65, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.52, 0.94, 5.4, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.64} roughness={0.38} />
          </mesh>

          {/* Upper Metallic Crown & Warning Collar */}
          <mesh position={[0, 6.28, 0]} castShadow>
            <cylinderGeometry args={[0.58, 0.54, 0.34, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Mid-Stack CEMS Monitoring Catwalk & Glowing Laser Analyzer Ring */}
          <mesh position={[0, 4.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.78, 0.065, 10, 26]} />
            <meshStandardMaterial
              ref={coreMatRef}
              color="#10B981"
              emissive="#10B981"
              emissiveIntensity={1.4}
            />
          </mesh>
          <mesh position={[0, 5.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.62, 0.048, 10, 24]} />
            <meshStandardMaterial
              ref={accentMatRef}
              color="#1e293b"
              emissive="#10B981"
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Dark Inner Chimney Flue Mouth */}
          <mesh position={[0, 6.45, 0]}>
            <cylinderGeometry args={[0.44, 0.44, 0.06, 16]} />
            <meshStandardMaterial color="#050811" roughness={0.95} />
          </mesh>

          {/* Dynamic 3D Particle Smoke System */}
          <SmokeParticles
            mode={mode}
            transitionProgress={transitionProgress}
            origin={[0, 6.55, 0]}
          />
        </group>
      )}

      {/* Floating Glowing IoT Sensor Pin */}
      <Html
        position={pinPosition}
        center
        distanceFactor={15}
        zIndexRange={[20, 0]}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(telemetry.id);
          }}
          className={`group flex flex-col items-center select-none transition-transform duration-200 ${
            isSelected || hovered ? 'scale-110' : 'hover:scale-105'
          }`}
        >
          <div
            className={`flex items-center gap-2 rounded-full border px-2.5 py-1 backdrop-blur-md transition-all ${badgeBorderClass} ${
              isSelected ? 'ring-2 ring-white/40' : ''
            }`}
          >
            <span className={`h-2 w-2 rounded-full animate-pulse ${dotClass}`} />
            <span className="font-mono-tech text-[11px] font-bold tracking-tight text-white whitespace-nowrap">
              {telemetry.code}
            </span>
            <span className="font-arabic text-[11px] font-semibold text-slate-200 whitespace-nowrap">
              {telemetry.nameAr}
            </span>
            <span className="hidden sm:inline font-mono-tech text-[10px] text-slate-300 border-l border-white/15 pl-1.5 whitespace-nowrap">
              {telemetry.temperature}°C
            </span>
          </div>
          {/* Stem Connector Line */}
          <div
            className={`h-3 w-[2px] ${
              mode === 'fault'
                ? 'bg-gradient-to-b from-red-500 to-transparent'
                : mode === 'optimized'
                ? 'bg-gradient-to-b from-emerald-400 to-transparent'
                : 'bg-gradient-to-b from-amber-400 to-transparent'
            }`}
          />
        </button>
      </Html>
    </group>
  );
};
