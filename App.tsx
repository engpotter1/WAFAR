import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChartPoint,
  EquipmentId,
  OperationMode,
  PlantSnapshot,
} from './types/factory';
import {
  BASELINE_CO2_KG_HR,
  BASELINE_TOTAL_KW,
  buildOptimizationSteps,
  computeEquipmentTelemetry,
  formatTimeLabel,
  generateInitialChartHistory,
  getRecommendationsForMode,
} from './utils/telemetryEngine';
import { FactoryScene } from './components/FactoryScene';
import { ControlBar } from './components/ControlBar';
import { DashboardSidebar } from './components/DashboardSidebar';

function createSnapshot(
  mode: OperationMode,
  fromMode: OperationMode,
  transitionProgress: number,
  chartHistory: ChartPoint[],
  selectedEquipmentId: EquipmentId | null,
  accumulators: {
    savedEgp: number;
    savedUsd: number;
    co2PreventedKg: number;
    faultLossEgp: number;
    faultLossUsd: number;
  }
): PlantSnapshot {
  const equipment = computeEquipmentTelemetry(mode, transitionProgress, fromMode);

  const totalPowerKw =
    equipment.reactor.powerDraw +
    equipment.boiler.powerDraw +
    equipment.cooling.powerDraw +
    equipment.smokestack.powerDraw;

  const powerDeltaPct =
    ((totalPowerKw - BASELINE_TOTAL_KW) / BASELINE_TOTAL_KW) * 100;

  // CO2 emissions rate scales with boiler & stack state
  let targetCo2 = BASELINE_CO2_KG_HR;
  if (mode === 'fault') {
    targetCo2 = Math.round(BASELINE_CO2_KG_HR * 1.52 + (Math.random() - 0.5) * 14);
  } else if (mode === 'optimized') {
    const startCo2 =
      fromMode === 'fault' ? BASELINE_CO2_KG_HR * 1.52 : BASELINE_CO2_KG_HR;
    const optCo2 = 645; // -29.3% reduction
    targetCo2 = Math.round(
      startCo2 +
        (optCo2 - startCo2) * transitionProgress +
        (Math.random() - 0.5) * 8
    );
  } else {
    targetCo2 = Math.round(BASELINE_CO2_KG_HR + (Math.random() - 0.5) * 10);
  }

  const co2DeltaPct =
    ((targetCo2 - BASELINE_CO2_KG_HR) / BASELINE_CO2_KG_HR) * 100;

  // Weighted system efficiency (%)
  const systemEfficiencyPct = Number(
    (
      equipment.reactor.efficiency * 0.32 +
      equipment.boiler.efficiency * 0.36 +
      equipment.cooling.efficiency * 0.22 +
      equipment.smokestack.efficiency * 0.1
    ).toFixed(1)
  );

  // Dynamic Projected Annual Savings (Million EGP / yr across 8,000 industrial hrs + fuel gas)
  const kwSavedVsBaseline = Math.max(0, BASELINE_TOTAL_KW - totalPowerKw);
  // Combined electrical + natural gas steam thermal equivalent tariff factor (~3.88 EGP per kW-eq hr * 8000h)
  const projectedAnnualSavingsMEgp =
    mode === 'optimized'
      ? Number(((kwSavedVsBaseline * 3.88 * 8000) / 1_000_000).toFixed(2))
      : 0;
  const projectedAnnualSavingsUsdK = Math.round(
    (projectedAnnualSavingsMEgp * 1_000_000) / 50 / 1000
  );

  const excessKwInFault = Math.max(0, totalPowerKw - BASELINE_TOTAL_KW);
  const annualLossRateMEgp = Number(
    (((excessKwInFault * 5.05 * 8000) / 1_000_000) || 28.4).toFixed(1)
  );

  return {
    mode,
    isTransitioning: mode === 'optimized' && transitionProgress < 1,
    transitionProgress,
    totalPowerKw,
    baselineReferenceKw: BASELINE_TOTAL_KW,
    powerDeltaPct,
    co2RateKgHr: targetCo2,
    co2DeltaPct,
    systemEfficiencyPct,
    projectedAnnualSavingsMEgp,
    projectedAnnualSavingsUsdK,
    annualLossRateMEgp,
    sessionSavedEgp: accumulators.savedEgp,
    sessionSavedUsd: accumulators.savedUsd,
    sessionCo2PreventedKg: accumulators.co2PreventedKg,
    sessionFaultLossEgp: accumulators.faultLossEgp,
    sessionFaultLossUsd: accumulators.faultLossUsd,
    equipment,
    chartHistory,
    recommendations: getRecommendationsForMode(mode, selectedEquipmentId),
    optimizationSteps: buildOptimizationSteps(mode, transitionProgress),
  };
}

export function App() {
  const [mode, setMode] = useState<OperationMode>('baseline');
  const [optRunId, setOptRunId] = useState<number>(0);
  const [selectedEquipmentId, setSelectedEquipmentId] =
    useState<EquipmentId | null>(null);
  const [cameraResetTick, setCameraResetTick] = useState<number>(0);

  const fromModeRef = useRef<OperationMode>('baseline');
  const modeRef = useRef<OperationMode>('baseline');
  const progressRef = useRef<number>(1);
  const selectedEqRef = useRef<EquipmentId | null>(null);

  const accumulatorsRef = useRef({
    savedEgp: 12450,
    savedUsd: 249.0,
    co2PreventedKg: 1420,
    faultLossEgp: 1850,
    faultLossUsd: 37.0,
  });

  const [snapshot, setSnapshot] = useState<PlantSnapshot>(() => {
    const initialHistory = generateInitialChartHistory();
    return createSnapshot(
      'baseline',
      'baseline',
      1,
      initialHistory,
      null,
      accumulatorsRef.current
    );
  });

  // Switch Operational Mode (Baseline / Fault / WAFAR AI Optimizer)
  const handleChangeMode = useCallback((nextMode: OperationMode) => {
    const prevMode = modeRef.current;
    if (nextMode === prevMode && nextMode !== 'optimized') return;

    fromModeRef.current = prevMode;
    modeRef.current = nextMode;
    setMode(nextMode);

    if (nextMode === 'optimized') {
      progressRef.current = 0;
      setOptRunId((id) => id + 1);
    } else {
      progressRef.current = 1;
      if (nextMode === 'fault') {
        // Ensure loss counter starts visibly active
        accumulatorsRef.current.faultLossEgp = Math.max(
          1850,
          accumulatorsRef.current.faultLossEgp
        );
        accumulatorsRef.current.faultLossUsd =
          accumulatorsRef.current.faultLossEgp / 50;
      }
    }

    setSnapshot((prev) =>
      createSnapshot(
        nextMode,
        fromModeRef.current,
        progressRef.current,
        prev.chartHistory,
        selectedEqRef.current,
        accumulatorsRef.current
      )
    );
  }, []);

  // 2-Second Smooth Transition Timer When WAFAR AI Optimizer Activates
  useEffect(() => {
    if (mode !== 'optimized') return;

    const startTime = performance.now();
    const durationMs = 2000;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / durationMs);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - p, 3);
      progressRef.current = eased;

      setSnapshot((prev) =>
        createSnapshot(
          'optimized',
          fromModeRef.current,
          eased,
          prev.chartHistory,
          selectedEqRef.current,
          accumulatorsRef.current
        )
      );

      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, optRunId]);

  // Real-Time 1000ms Telemetry & Chart Streaming Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const currentMode = modeRef.current;
      const currentProg = progressRef.current;

      // Update live financial & carbon accumulators (scaled for real-time plant cluster impact)
      if (currentMode === 'optimized') {
        accumulatorsRef.current.savedEgp += 145;
        accumulatorsRef.current.savedUsd =
          accumulatorsRef.current.savedEgp / 50;
        accumulatorsRef.current.co2PreventedKg += 18.5;
      } else if (currentMode === 'fault') {
        accumulatorsRef.current.faultLossEgp += 235;
        accumulatorsRef.current.faultLossUsd =
          accumulatorsRef.current.faultLossEgp / 50;
      }

      setSnapshot((prev) => {
        const nextSnap = createSnapshot(
          currentMode,
          fromModeRef.current,
          currentProg,
          prev.chartHistory,
          selectedEqRef.current,
          accumulatorsRef.current
        );

        const tradWave =
          Math.sin(Date.now() / 2200) * 18 + (Math.random() - 0.5) * 14;
        // Traditional line reflects unoptimized consumption (surges +38% during Fault anomaly)
        const traditionalKw =
          currentMode === 'fault'
            ? nextSnap.totalPowerKw
            : Math.round(BASELINE_TOTAL_KW + tradWave);

        // WAFAR AI Optimized line always shows the glowing green AI-optimized curve (~-26% vs baseline)
        const wafarKw =
          currentMode === 'optimized'
            ? nextSnap.totalPowerKw
            : Math.round(
                BASELINE_TOTAL_KW * 0.74 +
                  tradWave * 0.4 +
                  (Math.random() - 0.5) * 8
              );

        const newPoint: ChartPoint = {
          timeLabel: formatTimeLabel(new Date()),
          traditionalKw,
          wafarKw,
          savedKw: Math.max(0, traditionalKw - wafarKw),
        };

        const updatedHistory = [...prev.chartHistory.slice(-21), newPoint];
        return {
          ...nextSnap,
          chartHistory: updatedHistory,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectEquipment = useCallback((id: EquipmentId | null) => {
    selectedEqRef.current = id;
    setSelectedEquipmentId(id);
    setSnapshot((prev) => ({
      ...prev,
      recommendations: getRecommendationsForMode(prev.mode, id),
    }));
  }, []);

  const handleResetCamera = useCallback(() => {
    selectedEqRef.current = null;
    setSelectedEquipmentId(null);
    setCameraResetTick((t) => t + 1);
  }, []);

  // Stage Presentation Keyboard Shortcuts: 1, 2, 3 for Modes; R / Escape for Reset Camera
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') handleChangeMode('baseline');
      else if (e.key === '2') handleChangeMode('fault');
      else if (e.key === '3') handleChangeMode('optimized');
      else if (e.key === 'r' || e.key === 'R' || e.key === 'Escape') {
        handleResetCamera();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChangeMode, handleResetCamera]);

  return (
    <main className="flex min-h-screen lg:h-screen w-full flex-col lg:flex-row bg-[#070D19] text-slate-100 lg:overflow-hidden">
      {/* LEFT / CENTERPIECE: 65% Interactive 3D Chemical Factory Digital Twin */}
      <section className="relative h-[62vh] min-h-[500px] lg:h-full w-full lg:w-[65%] shrink-0">
        <FactoryScene
          snapshot={snapshot}
          selectedEquipmentId={selectedEquipmentId}
          cameraResetTick={cameraResetTick}
          onSelectEquipment={handleSelectEquipment}
          onResetCamera={handleResetCamera}
          onActivateOptimizer={() => handleChangeMode('optimized')}
        />
        <ControlBar
          mode={snapshot.mode}
          isTransitioning={snapshot.isTransitioning}
          onChangeMode={handleChangeMode}
        />
      </section>

      {/* RIGHT: 35% Executive Dashboard & Analytics Sidebar */}
      <section className="w-full lg:h-full lg:w-[35%] shrink-0">
        <DashboardSidebar
          snapshot={snapshot}
          selectedEquipmentId={selectedEquipmentId}
          onSelectEquipment={(id) => handleSelectEquipment(id)}
          onActivateOptimizer={() => handleChangeMode('optimized')}
        />
      </section>
    </main>
  );
}

export default App;
