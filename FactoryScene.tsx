import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Cpu,
  Flame,
  Gauge,
  RotateCcw,
  Sparkles,
  Thermometer,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  EQUIPMENT_ORDER,
  EquipmentId,
  OVERVIEW_CAMERA,
  OperationMode,
  PlantSnapshot,
} from '../types/factory';
import { EquipmentUnit } from './EquipmentUnit';

interface FactorySceneProps {
  snapshot: PlantSnapshot;
  selectedEquipmentId: EquipmentId | null;
  cameraResetTick: number;
  onSelectEquipment: (id: EquipmentId | null) => void;
  onResetCamera: () => void;
  onActivateOptimizer: () => void;
}

interface CameraRigProps {
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  triggerKey: string;
}

const CameraRig: React.FC<CameraRigProps> = ({
  targetPosition,
  targetLookAt,
  triggerKey,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isAnimating = useRef(false);

  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    desiredPos.set(...targetPosition);
    desiredTarget.set(...targetLookAt);
    isAnimating.current = true;
  }, [triggerKey, targetPosition, targetLookAt, desiredPos, desiredTarget]);

  useFrame((_, delta) => {
    if (!isAnimating.current || !controlsRef.current) return;

    const step = Math.min(1, delta * 4.2);
    camera.position.lerp(desiredPos, step);
    controlsRef.current.target.lerp(desiredTarget, step);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(desiredPos) < 0.06 &&
      controlsRef.current.target.distanceTo(desiredTarget) < 0.06
    ) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      minDistance={4.8}
      maxDistance={23}
      maxPolarAngle={Math.PI / 2 - 0.06}
      minPolarAngle={0.2}
      onStart={() => {
        isAnimating.current = false;
      }}
    />
  );
};

interface PlantInfrastructureProps {
  mode: OperationMode;
  transitionProgress: number;
}

const PlantInfrastructure: React.FC<PlantInfrastructureProps> = ({
  mode,
  transitionProgress,
}) => {
  const pulseSteamRef = useRef<THREE.Mesh>(null);
  const pulseWaterRef = useRef<THREE.Mesh>(null);
  const pulseFlueRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const colorEmerald = useMemo(() => new THREE.Color('#10B981'), []);
  const colorAmber = useMemo(() => new THREE.Color('#F59E0B'), []);
  const colorRed = useMemo(() => new THREE.Color('#EF4444'), []);
  const activeColor = useMemo(() => new THREE.Color('#F59E0B'), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = mode === 'fault' ? 1.35 : mode === 'optimized' ? 0.65 : 0.85;

    if (mode === 'fault') {
      activeColor.copy(colorRed);
    } else if (mode === 'optimized') {
      activeColor.copy(colorAmber).lerp(colorEmerald, transitionProgress);
    } else {
      activeColor.copy(colorAmber);
    }

    if (pulseMatRef.current) {
      pulseMatRef.current.color.copy(activeColor);
      pulseMatRef.current.emissive.copy(activeColor);
      pulseMatRef.current.emissiveIntensity = mode === 'fault' ? 2.2 : 1.6;
    }

    // Steam flow from Boiler [-4.05, 2.55, -2.7] -> Reactor [-4.05, 2.55, 1.9]
    if (pulseSteamRef.current) {
      const p1 = (t * speed) % 1;
      pulseSteamRef.current.position.set(
        -4.05,
        2.55,
        THREE.MathUtils.lerp(-2.2, 1.4, p1)
      );
    }

    // Cooling loop / power bus from Cooling [3.8, 0.85, 2.0] -> Reactor [-4.2, 0.85, 2.0]
    if (pulseWaterRef.current) {
      const p2 = ((t * speed) + 0.35) % 1;
      pulseWaterRef.current.position.set(
        THREE.MathUtils.lerp(3.1, -3.4, p2),
        0.85,
        2.0
      );
    }

    // Flue gas duct from Boiler [-3.9, 1.55, -2.75] -> Smokestack [3.6, 1.55, -2.75]
    if (pulseFlueRef.current) {
      const p3 = ((t * speed) + 0.65) % 1;
      pulseFlueRef.current.position.set(
        THREE.MathUtils.lerp(-2.8, 2.8, p3),
        1.55,
        -2.75
      );
    }
  });

  return (
    <group>
      {/* Main Elevated Industrial Compound Foundation Deck */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[15.8, 0.36, 11.4]} />
        <meshStandardMaterial color="#0b1324" metalness={0.45} roughness={0.68} />
      </mesh>

      {/* Perimeter Curb Frame */}
      <mesh position={[0, 0.02, 5.62]}>
        <boxGeometry args={[15.8, 0.08, 0.14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, -5.62]}>
        <boxGeometry args={[15.8, 0.08, 0.14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Native High-Performance Eco-Tech Floor Grid */}
      <gridHelper
        args={[
          14.8,
          20,
          mode === 'fault'
            ? '#7f1d1d'
            : mode === 'optimized'
            ? '#065f46'
            : '#1e3a5f',
          '#132038',
        ]}
        position={[0, 0.015, 0]}
        scale={[1.05, 1, 0.76]}
      />

      {/* Central SCADA Control Annex Building (Rear-Center Decorative Industrial Context) */}
      <group position={[0, 0, -4.45]}>
        <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.1, 1.36, 1.25]} />
          <meshStandardMaterial color="#152036" metalness={0.55} roughness={0.45} />
        </mesh>
        {/* Illuminated Control Room Strip Window */}
        <mesh position={[0, 0.88, 0.64]}>
          <boxGeometry args={[2.35, 0.28, 0.04]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.1}
          />
        </mesh>
      </group>

      {/* Auxiliary Chemical Buffer Drums (Center-Left Walkway) */}
      {[-0.9, -0.25].map((xPos, i) => (
        <mesh key={i} position={[xPos, 0.52, -0.3]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 1.0, 14]} />
          <meshStandardMaterial color="#334155" metalness={0.72} roughness={0.3} />
        </mesh>
      ))}

      {/* PROCESS PIPELINE 1: Flue Gas Breeching Duct (Boiler -> Smokestack) */}
      <mesh
        position={[-0.15, 1.55, -2.75]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.24, 0.24, 6.8, 14]} />
        <meshStandardMaterial color="#283548" metalness={0.68} roughness={0.38} />
      </mesh>

      {/* PROCESS PIPELINE 2: Overhead Steam Header (Boiler -> Reactor) */}
      <mesh
        position={[-4.05, 2.55, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.11, 0.11, 4.3, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.82} roughness={0.24} />
      </mesh>

      {/* PROCESS PIPELINE 3: Chilled Water & Power Conduit (Cooling Tower -> Reactor) */}
      <mesh
        position={[-0.2, 0.85, 2.0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.1, 0.1, 7.2, 12]} />
        <meshStandardMaterial color="#0e7490" metalness={0.68} roughness={0.3} />
      </mesh>

      {/* PROCESS PIPELINE 4: Power Grid Busbar Feed (Cooling Transformer -> Smokestack / Boiler) */}
      <mesh
        position={[3.7, 0.65, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.08, 4.4, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Animated Glowing Energy/Fluid Flow Pulses Along Pipes */}
      <mesh ref={pulseSteamRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.45, 12]} />
        <meshStandardMaterial
          ref={pulseMatRef}
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh ref={pulseWaterRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.5, 12]} />
        <meshStandardMaterial
          color={
            mode === 'fault'
              ? '#EF4444'
              : mode === 'optimized'
              ? '#10B981'
              : '#06B6D4'
          }
          emissive={
            mode === 'fault'
              ? '#EF4444'
              : mode === 'optimized'
              ? '#10B981'
              : '#06B6D4'
          }
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh ref={pulseFlueRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.42, 14]} />
        <meshStandardMaterial
          color={
            mode === 'fault'
              ? '#EF4444'
              : mode === 'optimized'
              ? '#10B981'
              : '#F59E0B'
          }
          emissive={
            mode === 'fault'
              ? '#EF4444'
              : mode === 'optimized'
              ? '#10B981'
              : '#F59E0B'
          }
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
};

export const FactoryScene: React.FC<FactorySceneProps> = ({
  snapshot,
  selectedEquipmentId,
  cameraResetTick,
  onSelectEquipment,
  onResetCamera,
  onActivateOptimizer,
}) => {
  const selectedUnit = selectedEquipmentId
    ? snapshot.equipment[selectedEquipmentId]
    : null;

  const cameraTargetPos = selectedUnit
    ? selectedUnit.cameraPos
    : OVERVIEW_CAMERA.position;
  const cameraTargetLookAt = selectedUnit
    ? selectedUnit.cameraTarget
    : OVERVIEW_CAMERA.target;

  const cameraTriggerKey = `${selectedEquipmentId ?? 'overview'}-${cameraResetTick}`;

  const ambientStatusTint =
    snapshot.mode === 'fault'
      ? '#EF4444'
      : snapshot.mode === 'optimized'
      ? '#10B981'
      : '#38BDF8';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070D19] select-none">
      {/* Subtle Radial Vignette Behind 3D Canvas */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60 transition-colors duration-700"
        style={{
          background:
            snapshot.mode === 'fault'
              ? 'radial-gradient(circle at 50% 42%, rgba(239,68,68,0.14), transparent 68%)'
              : snapshot.mode === 'optimized'
              ? 'radial-gradient(circle at 50% 42%, rgba(16,185,129,0.14), transparent 68%)'
              : 'radial-gradient(circle at 50% 42%, rgba(56,189,248,0.09), transparent 68%)',
        }}
      />

      {/* THREE.JS INTERACTIVE DIGITAL TWIN CANVAS */}
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: OVERVIEW_CAMERA.position, fov: 42, near: 0.2, far: 90 }}
        onPointerMissed={() => {
          // Clicking empty space keeps controls smooth; optional deselect only via Reset or Close
        }}
      >
        <color attach="background" args={['#070D19']} />
        <fog attach="fog" args={['#070D19', 20, 44]} />

        {/* Optimized Low-Overhead Industrial Lighting (60 FPS Integrated GPU Friendly) */}
        <ambientLight intensity={0.68} />
        <hemisphereLight
          args={['#93c5fd', '#0f172a', 0.65]}
          position={[0, 15, 0]}
        />
        <directionalLight
          position={[11, 16, 10]}
          intensity={1.55}
          color="#f8fafc"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={2}
          shadow-camera-far={38}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight
          position={[-10, 8, -8]}
          intensity={0.55}
          color={ambientStatusTint}
        />
        <pointLight
          position={[-4, 3.8, -0.5]}
          intensity={snapshot.mode === 'fault' ? 2.2 : 1.3}
          distance={12}
          color={
            snapshot.mode === 'fault'
              ? '#EF4444'
              : snapshot.mode === 'optimized'
              ? '#10B981'
              : '#F59E0B'
          }
        />

        {/* Smooth Damped OrbitControls + Camera Focus Rig */}
        <CameraRig
          targetPosition={cameraTargetPos}
          targetLookAt={cameraTargetLookAt}
          triggerKey={cameraTriggerKey}
        />

        {/* Factory Deck, Control Annex & Animated Pipelines */}
        <PlantInfrastructure
          mode={snapshot.mode}
          transitionProgress={snapshot.transitionProgress}
        />

        {/* 4 Clickable Industrial Equipment Modules */}
        {EQUIPMENT_ORDER.map((id) => (
          <EquipmentUnit
            key={id}
            telemetry={snapshot.equipment[id]}
            mode={snapshot.mode}
            transitionProgress={snapshot.transitionProgress}
            isSelected={selectedEquipmentId === id}
            onSelect={(clickedId) => onSelectEquipment(clickedId)}
          />
        ))}
      </Canvas>

      {/* TOP BAR OVERLAY: Quick Unit Navigation & Reset Camera */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 p-3.5 sm:p-4">
        {/* Left: Digital Twin Live Badge + Equipment Quick-Focus Pills */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0B1324]/82 px-2.5 py-1.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
            <Compass className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold tracking-wide text-slate-200">
              3D TWIN
            </span>
          </div>
          {EQUIPMENT_ORDER.map((id) => {
            const unit = snapshot.equipment[id];
            const active = selectedEquipmentId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectEquipment(id)}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white border border-transparent'
                }`}
              >
                <span className="font-mono-tech text-[10px] opacity-80">
                  {unit.code}
                </span>
                <span className="font-arabic hidden md:inline">{unit.nameAr}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset Camera Button */}
        <button
          type="button"
          onClick={onResetCamera}
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/15 bg-[#0B1324]/88 px-3.5 py-2 text-xs font-semibold text-slate-100 backdrop-blur-xl shadow-lg transition-all hover:border-emerald-400/50 hover:bg-slate-900 hover:text-emerald-300 active:scale-95 cursor-pointer"
          title="Return to full isometric factory view"
        >
          <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
          <span>Reset Camera</span>
          <span className="font-arabic text-[11px] text-slate-300 border-l border-white/15 pl-2">
            عرض المصنع بالكامل
          </span>
        </button>
      </div>

      {/* DYNAMIC STATUS BANNERS: Fault Anomaly Alert OR WAFAR AI Action Log + Live ROI */}
      <div className="pointer-events-none absolute inset-x-3 sm:inset-x-5 top-16 z-20 flex flex-col items-center gap-2">
        {/* MODE 2 BANNER: Live Anomaly & Financial Loss Counter */}
        {snapshot.mode === 'fault' && (
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-red-500/55 bg-[#1A0B12]/90 px-4 py-2.5 backdrop-blur-xl glow-fault">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/20 border border-red-500/40">
                  <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs sm:text-[13px] font-bold text-red-200 leading-snug">
                    ⚠️ AI Anomaly Detected: Thermal Boiler Fouling & Peak Power Surge!
                  </p>
                  <p className="font-arabic text-[11px] sm:text-xs text-red-300/90 mt-0.5">
                    تنبيه الذكاء الاصطناعي: تكلس الغلاية الحرارية وذروة هدر مفاجئة في الطاقة (+38%)!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <div className="rounded-xl border border-red-500/35 bg-red-950/60 px-2.5 py-1 text-right">
                  <div className="text-[9px] uppercase tracking-wider text-red-300/80">
                    Live Waste Loss • خسائر لحظية
                  </div>
                  <div className="font-mono-tech text-xs font-bold text-red-300">
                    -{snapshot.sessionFaultLossEgp.toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP{' '}
                    <span className="text-[10px] text-red-400/90">
                      (-${snapshot.sessionFaultLossUsd.toFixed(1)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onActivateOptimizer}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.5)] transition hover:bg-emerald-400 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Auto-Fix</span>
                  <span className="font-arabic">وفّر</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3 BANNER: AI Action Log Sequence + Live ROI & Carbon Savings Badge */}
        {snapshot.mode === 'optimized' && (
          <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2">
            {/* AI Action Log Bar */}
            <div className="rounded-2xl border border-emerald-500/45 bg-[#081C18]/88 px-3.5 py-2 backdrop-blur-xl glow-eco">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    {snapshot.isTransitioning
                      ? `WAFAR AI Optimizing (${Math.round(
                          snapshot.transitionProgress * 100
                        )}%)`
                      : 'WAFAR AI Closed-Loop Active'}
                  </span>
                </div>

                {/* Live ROI & Savings Pill */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[11px] font-bold text-emerald-200">
                    Live ROI & Savings:
                  </span>
                  <span className="font-mono-tech text-xs font-bold text-white">
                    +{snapshot.sessionSavedEgp.toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP
                  </span>
                  <span className="font-mono-tech text-[11px] text-emerald-300">
                    (${snapshot.sessionSavedUsd.toFixed(1)} USD)
                  </span>
                  <span className="text-[11px] text-emerald-200 border-l border-emerald-400/30 pl-2 font-mono-tech">
                    🌱 {(snapshot.sessionCo2PreventedKg / 1000).toFixed(3)}t CO₂ Prevented
                  </span>
                </div>
              </div>

              {/* 3 Sequential AI Action Steps */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                {snapshot.optimizationSteps.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <div
                      className={`flex items-center gap-1 transition-opacity duration-300 ${
                        step.done
                          ? 'text-emerald-200 opacity-100'
                          : 'text-slate-400 opacity-55'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${
                          step.done ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-medium">{step.labelEn}</span>
                    </div>
                    {i < snapshot.optimizationSteps.length - 1 && (
                      <span className="text-emerald-500/40 hidden sm:inline">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="font-arabic text-[11px] text-emerald-300/85 mt-0.5">
                ✓ خفض حرارة المفاعل 4.5°م | ✓ موازنة أحمال الفازات | ✓ ضبط نسبة الوقود للهواء — وفر مستمر بنسبة 26%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING GLASSMORPHIC EQUIPMENT TELEMETRY CARD (Opens on Clicking any of the 4 Units) */}
      {selectedUnit && (
        <div className="pointer-events-auto absolute bottom-24 sm:bottom-24 left-3.5 sm:left-4 z-30 w-[calc(100%-1.75rem)] max-w-sm rounded-2xl border border-white/15 bg-[#091122]/90 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65)] transition-all">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono-tech text-[11px] font-bold text-emerald-300">
                  {selectedUnit.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    selectedUnit.status === 'critical'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : selectedUnit.status === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {selectedUnit.statusLabelEn}
                </span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-white">
                {selectedUnit.nameEn}
              </h3>
              <p className="font-arabic text-xs font-semibold text-emerald-300/95">
                {selectedUnit.nameAr} —{' '}
                <span className="font-normal text-slate-300">
                  {selectedUnit.statusLabelAr}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={onResetCamera}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-white/15 hover:text-white cursor-pointer"
              title="Close & Reset Camera"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 4 IoT Sensor Telemetry Metrics */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/8 bg-slate-900/75 p-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Temperature • الحرارة</span>
                <Thermometer className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="mt-1 font-mono-tech text-base font-bold text-white">
                {selectedUnit.temperature.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-slate-900/75 p-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Pressure • الضغط</span>
                <Gauge className="h-3.5 w-3.5 text-sky-400" />
              </div>
              <div className="mt-1 font-mono-tech text-base font-bold text-white">
                {selectedUnit.pressure.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">Bar</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-slate-900/75 p-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Power Draw • القدرة</span>
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 font-mono-tech text-base font-bold text-white">
                {selectedUnit.powerDraw}{' '}
                <span className="text-xs font-normal text-slate-400">kW</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-slate-900/75 p-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Efficiency • الكفاءة</span>
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div
                className={`mt-1 font-mono-tech text-base font-bold ${
                  selectedUnit.efficiency >= 90
                    ? 'text-emerald-400'
                    : selectedUnit.efficiency < 65
                    ? 'text-red-400'
                    : 'text-amber-300'
                }`}
              >
                {selectedUnit.efficiency.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Isolation Forest Anomaly Score + ML Diagnostic Note */}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Flame className="h-3 w-3 text-emerald-400" />
                ML Telemetry Insight (Isolation Forest)
              </span>
              <span className="font-mono-tech text-slate-400">
                Anomaly: {(selectedUnit.anomalyScore * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              {selectedUnit.aiNoteEn}
            </p>
            <p className="font-arabic mt-1 text-[11px] leading-relaxed text-emerald-300/90" dir="rtl">
              {selectedUnit.aiNoteAr}
            </p>
          </div>
        </div>
      )}

      {/* Subtle Interactive Hint Pill (Bottom-Right above ControlBar when no card open) */}
      {!selectedUnit && (
        <div className="pointer-events-none hidden md:flex absolute bottom-24 right-4 z-10 items-center gap-2 rounded-full border border-white/10 bg-[#0B1324]/75 px-3 py-1 text-[11px] text-slate-300 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Click any equipment sensor pin to inspect • Drag to orbit • Scroll to zoom</span>
        </div>
      )}
    </div>
  );
};
