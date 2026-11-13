import React from 'react';
import { AlertOctagon, Factory, Sparkles } from 'lucide-react';
import { OperationMode } from '../types/factory';

interface ControlBarProps {
  mode: OperationMode;
  isTransitioning: boolean;
  onChangeMode: (mode: OperationMode) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  mode,
  isTransitioning,
  onChangeMode,
}) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 sm:bottom-4 z-30 flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-white/15 bg-[#081020]/92 p-2 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.72)]">
        {/* Mode 1: Baseline Factory */}
        <button
          type="button"
          onClick={() => onChangeMode('baseline')}
          className={`group relative flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
            mode === 'baseline'
              ? 'border border-amber-400/60 bg-amber-500/18 text-white shadow-[0_0_20px_rgba(245,158,11,0.22)]'
              : 'border border-transparent bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white'
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              mode === 'baseline'
                ? 'border-amber-400/50 bg-amber-500/25 text-amber-300'
                : 'border-white/10 bg-slate-900 text-slate-400 group-hover:text-amber-300'
            }`}
          >
            <Factory className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-xs font-bold tracking-tight">
                1. Baseline Factory
              </span>
              <span className="font-mono-tech text-[10px] text-amber-300/90">
                74% Eff
              </span>
            </div>
            <div className="font-arabic truncate text-[11px] font-semibold text-slate-300">
              التشغيل التقليدي للمصنع
            </div>
          </div>
        </button>

        {/* Mode 2: Simulate Energy Waste / Fault */}
        <button
          type="button"
          onClick={() => onChangeMode('fault')}
          className={`group relative flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
            mode === 'fault'
              ? 'border border-red-500/75 bg-red-500/22 text-white shadow-[0_0_24px_rgba(239,68,68,0.38)]'
              : 'border border-transparent bg-white/[0.03] text-slate-300 hover:border-red-500/35 hover:bg-red-500/10 hover:text-white'
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              mode === 'fault'
                ? 'border-red-400/60 bg-red-500/30 text-red-200 animate-pulse'
                : 'border-white/10 bg-slate-900 text-slate-400 group-hover:text-red-400'
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-xs font-bold tracking-tight">
                2. Simulate Waste / Fault
              </span>
              <span className="font-mono-tech text-[10px] font-semibold text-red-400">
                +38% kW
              </span>
            </div>
            <div className="font-arabic truncate text-[11px] font-semibold text-slate-300">
              محاكاة هدر طاقة وعطل
            </div>
          </div>
        </button>

        {/* Mode 3: Activate WAFAR AI Optimizer */}
        <button
          type="button"
          onClick={() => onChangeMode('optimized')}
          className={`group relative flex flex-[1.15] items-center gap-2.5 rounded-xl px-3.5 py-2 text-left transition-all cursor-pointer ${
            mode === 'optimized'
              ? 'border border-emerald-400/80 bg-gradient-to-r from-emerald-500/30 to-teal-500/20 text-white shadow-[0_0_26px_rgba(16,185,129,0.42)]'
              : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:border-emerald-400/60 hover:bg-emerald-500/20'
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              mode === 'optimized'
                ? 'border-emerald-300/70 bg-emerald-400 text-slate-950 shadow-[0_0_14px_#10B981]'
                : 'border-emerald-400/35 bg-emerald-950 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-slate-950'
            }`}
          >
            <Sparkles
              className={`h-4 w-4 ${isTransitioning ? 'animate-spin' : ''}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-xs font-extrabold tracking-tight text-emerald-200">
                3. Activate WAFAR AI
              </span>
              <span className="rounded bg-emerald-400/20 px-1.5 py-0.2 font-mono-tech text-[10px] font-bold text-emerald-300">
                -26% kW
              </span>
            </div>
            <div className="font-arabic truncate text-[11px] font-bold text-white">
              تفعيل الذكاء الاصطناعي وفّر
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
