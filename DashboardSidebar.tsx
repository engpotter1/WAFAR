import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CloudFog,
  Coins,
  Leaf,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  EQUIPMENT_ORDER,
  EquipmentId,
  PlantSnapshot,
} from '../types/factory';
import { RealtimeChart } from './RealtimeChart';

interface DashboardSidebarProps {
  snapshot: PlantSnapshot;
  selectedEquipmentId: EquipmentId | null;
  onSelectEquipment: (id: EquipmentId) => void;
  onActivateOptimizer: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  snapshot,
  selectedEquipmentId,
  onSelectEquipment,
  onActivateOptimizer,
}) => {
  const isFault = snapshot.mode === 'fault';
  const isOpt = snapshot.mode === 'optimized';

  return (
    <aside className="flex h-full w-full flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-[#080F1E]/95 backdrop-blur-2xl overflow-y-auto">
      <div className="flex flex-col gap-3.5 p-4 sm:p-5">
        {/* 1. BRAND HEADER: WAFAR | وفّر */}
        <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500 ${
                isFault
                  ? 'border-red-500/60 bg-red-500/15 shadow-[0_0_22px_rgba(239,68,68,0.35)]'
                  : isOpt
                  ? 'border-emerald-400/70 bg-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.4)]'
                  : 'border-emerald-500/40 bg-emerald-500/12 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
              }`}
            >
              <Leaf
                className={`h-5 w-5 ${
                  isFault ? 'text-red-400' : 'text-emerald-400'
                }`}
              />
              <span
                className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#080F1E] ${
                  isFault
                    ? 'bg-red-500 animate-ping'
                    : isOpt
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  WAFAR
                </h1>
                <span className="text-slate-600 font-light">|</span>
                <span className="font-arabic text-xl font-extrabold text-emerald-400">
                  وفّر
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300">
                AI-Driven Industrial Sustainability
              </p>
              <p className="font-arabic text-[11px] text-slate-400">
                مُحسّن الطاقة والانبعاثات الذكي للمصانع الكيميائية
              </p>
            </div>
          </div>

          <div
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              isFault
                ? 'border-red-500/45 bg-red-500/15 text-red-300'
                : isOpt
                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-300'
                : 'border-amber-400/45 bg-amber-500/15 text-amber-300'
            }`}
          >
            {isFault ? 'FAULT ALERT' : isOpt ? 'AI ECO-OPTIMAL' : 'BASELINE'}
          </div>
        </header>

        {/* 2. LIVE KPI CARDS (2x2 GRID) */}
        <section className="grid grid-cols-2 gap-2.5">
          {/* KPI 1: Power Consumption (kW) */}
          <div
            className={`rounded-2xl border p-3 transition-all ${
              isFault
                ? 'border-red-500/40 bg-red-950/20'
                : isOpt
                ? 'border-emerald-500/35 bg-emerald-950/15'
                : 'border-white/10 bg-[#0C162B]/85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">
                Power Draw
              </span>
              <Zap
                className={`h-4 w-4 ${
                  isFault
                    ? 'text-red-400'
                    : isOpt
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              />
            </div>
            <div className="font-arabic text-[10px] text-slate-400">
              استهلاك الطاقة اللحظي
            </div>

            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-mono-tech text-xl font-extrabold text-white">
                {snapshot.totalPowerKw.toLocaleString('en-US')}
              </span>
              <span className="font-mono-tech text-xs text-slate-400">kW</span>
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              {snapshot.powerDeltaPct <= -1 ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-emerald-300">
                  <ArrowDownRight className="h-3 w-3" />
                  {snapshot.powerDeltaPct.toFixed(1)}% vs Base
                </span>
              ) : snapshot.powerDeltaPct >= 1 ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/20 px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-red-300 animate-pulse">
                  <ArrowUpRight className="h-3 w-3" />+
                  {snapshot.powerDeltaPct.toFixed(1)}% Surge
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono-tech text-[10px] font-semibold text-amber-300">
                  Unoptimized Ref
                </span>
              )}
            </div>
          </div>

          {/* KPI 2: CO2 Emissions Rate (kg/hr) */}
          <div
            className={`rounded-2xl border p-3 transition-all ${
              isFault
                ? 'border-red-500/40 bg-red-950/20'
                : isOpt
                ? 'border-emerald-500/35 bg-emerald-950/15'
                : 'border-white/10 bg-[#0C162B]/85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">
                CO₂ Emissions
              </span>
              <CloudFog
                className={`h-4 w-4 ${
                  isFault
                    ? 'text-red-400'
                    : isOpt
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              />
            </div>
            <div className="font-arabic text-[10px] text-slate-400">
              معدل انبعاثات الكربون
            </div>

            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-mono-tech text-xl font-extrabold text-white">
                {snapshot.co2RateKgHr.toLocaleString('en-US')}
              </span>
              <span className="font-mono-tech text-xs text-slate-400">
                kg/hr
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              {snapshot.co2DeltaPct <= -1 ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-emerald-300">
                  <ArrowDownRight className="h-3 w-3" />
                  {snapshot.co2DeltaPct.toFixed(1)}% Carbon
                </span>
              ) : snapshot.co2DeltaPct >= 1 ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/20 px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-red-300">
                  <ArrowUpRight className="h-3 w-3" />+
                  {snapshot.co2DeltaPct.toFixed(1)}% Plume
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-slate-800 px-1.5 py-0.5 font-mono-tech text-[10px] text-slate-300">
                  7,296 tCO₂/yr
                </span>
              )}
            </div>
          </div>

          {/* KPI 3: System Efficiency Score (%) */}
          <div className="rounded-2xl border border-white/10 bg-[#0C162B]/85 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">
                System Efficiency
              </span>
              <Activity
                className={`h-4 w-4 ${
                  isFault
                    ? 'text-red-400'
                    : isOpt
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              />
            </div>
            <div className="font-arabic text-[10px] text-slate-400">
              معامل كفاءة المصنع
            </div>

            <div className="mt-1.5 flex items-baseline gap-1">
              <span
                className={`font-mono-tech text-xl font-extrabold ${
                  isFault
                    ? 'text-red-400'
                    : isOpt
                    ? 'text-emerald-400'
                    : 'text-amber-300'
                }`}
              >
                {snapshot.systemEfficiencyPct.toFixed(1)}%
              </span>
            </div>

            {/* Live Progress Bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFault
                    ? 'bg-red-500'
                    : isOpt
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, snapshot.systemEfficiencyPct)}%` }}
              />
            </div>
          </div>

          {/* KPI 4: Projected Annual Savings (EGP - مليون جنيه سنوياً) */}
          <div
            className={`rounded-2xl border p-3 transition-all ${
              isOpt
                ? 'border-emerald-400/55 bg-gradient-to-br from-emerald-500/20 to-teal-950/30 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                : isFault
                ? 'border-red-500/45 bg-red-950/25'
                : 'border-white/10 bg-[#0C162B]/85'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">
                {isFault ? 'Annual Waste Rate' : 'Annual Savings'}
              </span>
              <Coins
                className={`h-4 w-4 ${
                  isFault
                    ? 'text-red-400'
                    : isOpt
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}
              />
            </div>
            <div className="font-arabic text-[10px] text-slate-300">
              {isFault ? 'معدل الهدر المالي السنوي' : 'الوفر السنوي (مليون جنيه)'}
            </div>

            {isFault ? (
              <>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-mono-tech text-xl font-extrabold text-red-400">
                    -{snapshot.annualLossRateMEgp.toFixed(1)}M
                  </span>
                  <span className="font-mono-tech text-[11px] font-semibold text-red-300">
                    EGP
                  </span>
                </div>
                <div className="font-arabic mt-1 text-[10px] text-red-300/90">
                  نزيف طاقة مستمر بدون وفّر
                </div>
              </>
            ) : isOpt ? (
              <>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-mono-tech text-xl font-extrabold text-emerald-300">
                    {snapshot.projectedAnnualSavingsMEgp.toFixed(2)}M
                  </span>
                  <span className="font-mono-tech text-[11px] font-semibold text-emerald-200">
                    EGP
                  </span>
                </div>
                <div className="font-arabic mt-1 flex items-center justify-between text-[10px] font-semibold text-emerald-200/95">
                  <span>مليون جنيه سنوياً</span>
                  <span className="font-mono-tech text-[9.5px] text-emerald-300">
                    ~${snapshot.projectedAnnualSavingsUsdK}K/yr
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-mono-tech text-xl font-extrabold text-slate-200">
                    0.00M
                  </span>
                  <span className="font-mono-tech text-[11px] text-slate-400">
                    EGP
                  </span>
                </div>
                <div className="font-arabic mt-1 text-[10px] text-amber-300/95">
                  المتاح مع وفّر: +14.85 مليون ج/سنة
                </div>
              </>
            )}
          </div>
        </section>

        {/* 3. REAL-TIME COMPARISON CHART */}
        <RealtimeChart data={snapshot.chartHistory} mode={snapshot.mode} />

        {/* 4. AI RECOMMENDATIONS FEED (Random Forest + Isolation Forest) */}
        <section className="rounded-2xl border border-white/10 bg-[#0A1324]/90 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <BrainCircuit className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  AI Recommendations Feed
                </h3>
                <p className="text-[10px] text-slate-400">
                  Random Forest + Isolation Forest Engine
                </p>
              </div>
            </div>

            {snapshot.mode !== 'optimized' && (
              <button
                type="button"
                onClick={onActivateOptimizer}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-400/45 px-2.5 py-1 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Execute AI</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {snapshot.recommendations.map((rec) => {
              const cardStyle =
                rec.severity === 'critical'
                  ? 'border-red-500/45 bg-red-950/25'
                  : rec.severity === 'warning'
                  ? 'border-amber-500/35 bg-amber-950/15'
                  : 'border-emerald-500/35 bg-emerald-950/15';

              return (
                <div
                  key={rec.id}
                  className={`rounded-xl border p-3 transition-all ${cardStyle}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                    <span className="font-mono-tech font-semibold text-slate-300">
                      {rec.modelBadge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono-tech text-[9.5px] font-bold text-emerald-300">
                        -{rec.impactKw} kW
                      </span>
                      <span className="font-mono-tech text-slate-400">
                        {rec.confidence}% conf
                      </span>
                    </div>
                  </div>

                  {/* Arabic Plain-Language Recommendation First for Immediate Clarity */}
                  <p
                    className="font-arabic mt-2 text-xs font-bold leading-relaxed text-white"
                    dir="rtl"
                  >
                    {rec.titleAr}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    {rec.titleEn}
                  </p>
                  <p
                    className="font-arabic mt-1 text-[10.5px] text-slate-400"
                    dir="rtl"
                  >
                    {rec.detailAr}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. COMPACT CLICKABLE IOT SUBSYSTEM MATRIX */}
        <section className="rounded-2xl border border-white/10 bg-[#0A1324]/75 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300">
              IoT Equipment Telemetry • وحدات المصنع
            </span>
            <span className="text-[10px] text-slate-400">Click to inspect 3D</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {EQUIPMENT_ORDER.map((id) => {
              const eq = snapshot.equipment[id];
              const isSelected = selectedEquipmentId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectEquipment(id)}
                  className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400/60 bg-emerald-500/15'
                      : 'border-white/5 bg-slate-900/60 hover:border-white/20 hover:bg-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          eq.status === 'critical'
                            ? 'bg-red-500 animate-ping'
                            : eq.status === 'optimal'
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="font-mono-tech text-[10px] font-bold text-slate-200">
                        {eq.code}
                      </span>
                    </div>
                    <div className="font-arabic truncate text-[10.5px] text-slate-300">
                      {eq.nameAr}
                    </div>
                  </div>
                  <div className="text-right font-mono-tech">
                    <div className="text-[10.5px] font-bold text-white">
                      {eq.powerDraw}kW
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      {eq.efficiency.toFixed(0)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
};
