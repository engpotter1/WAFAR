export type OperationMode = 'baseline' | 'fault' | 'optimized';

export type EquipmentId = 'reactor' | 'boiler' | 'cooling' | 'smokestack';

export interface EquipmentTelemetry {
  id: EquipmentId;
  code: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  temperature: number; // °C
  pressure: number; // Bar
  powerDraw: number; // kW
  efficiency: number; // %
  status: 'optimal' | 'normal' | 'warning' | 'critical';
  statusLabelEn: string;
  statusLabelAr: string;
  aiNoteEn: string;
  aiNoteAr: string;
  anomalyScore: number; // 0.00 - 1.00 (Isolation Forest score)
  position: [number, number, number];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface ChartPoint {
  timeLabel: string;
  traditionalKw: number;
  wafarKw: number;
  savedKw: number;
}

export interface AIRecommendation {
  id: string;
  modelBadge: string;
  confidence: number;
  severity: 'eco' | 'warning' | 'critical';
  titleEn: string;
  titleAr: string;
  detailEn: string;
  detailAr: string;
  impactKw: number;
}

export interface OptimizationStep {
  id: string;
  labelEn: string;
  labelAr: string;
  done: boolean;
}

export interface PlantSnapshot {
  mode: OperationMode;
  isTransitioning: boolean;
  transitionProgress: number; // 0 to 1 over 2 seconds when AI activates
  totalPowerKw: number;
  baselineReferenceKw: number;
  powerDeltaPct: number; // vs baseline (e.g. +38.2% or -26.1%)
  co2RateKgHr: number;
  co2DeltaPct: number;
  systemEfficiencyPct: number;
  projectedAnnualSavingsMEgp: number; // Million EGP / year (negative in fault if showing loss, or potential)
  projectedAnnualSavingsUsdK: number; // Thousand USD / year
  annualLossRateMEgp: number; // Active annualized loss rate during fault
  sessionSavedEgp: number;
  sessionSavedUsd: number;
  sessionCo2PreventedKg: number;
  sessionFaultLossEgp: number;
  sessionFaultLossUsd: number;
  equipment: Record<EquipmentId, EquipmentTelemetry>;
  chartHistory: ChartPoint[];
  recommendations: AIRecommendation[];
  optimizationSteps: OptimizationStep[];
}

export const OVERVIEW_CAMERA = {
  position: [11.6, 9.4, 12.6] as [number, number, number],
  target: [0, 1.5, -0.2] as [number, number, number],
};

export const EQUIPMENT_ORDER: EquipmentId[] = [
  'reactor',
  'boiler',
  'cooling',
  'smokestack',
];
