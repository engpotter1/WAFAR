import React, { useState } from 'react';
import { ChartPoint, OperationMode } from '../types/factory';

interface RealtimeChartProps {
  data: ChartPoint[];
  mode: OperationMode;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({ data, mode }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 520;
  const height = 176;
  const padLeft = 42;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 24;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minKw = 1050;
  const maxKw = 2750;

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft;
    return padLeft + (index / (data.length - 1)) * plotW;
  };

  const getY = (kw: number) => {
    const clamped = Math.min(maxKw, Math.max(minKw, kw));
    const ratio = (clamped - minKw) / (maxKw - minKw);
    return padTop + plotH - ratio * plotH;
  };

  // Build smooth SVG polyline/path strings
  const traditionalPath = data
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.traditionalKw).toFixed(1)}`)
    .join(' ');

  const wafarPath = data
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.wafarKw).toFixed(1)}`)
    .join(' ');

  const areaPath =
    data.length > 1
      ? `${wafarPath} L ${getX(data.length - 1).toFixed(1)} ${(
          padTop + plotH
        ).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  // Shaded delta polygon between Traditional and WAFAR line
  const deltaPolygonPath =
    data.length > 1
      ? `${wafarPath} ${[...data]
          .reverse()
          .map(
            (pt, revIdx) =>
              `L ${getX(data.length - 1 - revIdx).toFixed(1)} ${getY(
                pt.traditionalKw
              ).toFixed(1)}`
          )
          .join(' ')} Z`
      : '';

  const activeStroke = '#10B981';
  const tradStroke = mode === 'fault' ? '#EF4444' : '#94A3B8';

  const yTicks = [1200, 1700, 2200, 2700];
  const inspectedIndex = hoverIdx !== null && data[hoverIdx] ? hoverIdx : data.length - 1;
  const inspectedPoint = data[inspectedIndex];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A1324]/85 p-3.5 backdrop-blur-xl">
      {/* Chart Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Comparison (kW)
          </h3>
          <p className="font-arabic text-[11px] text-slate-400">
            الاستهلاك التقليدي مقابل الذكاء الاصطناعي (وفّر)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3.5 border-t-2 border-dashed ${
                mode === 'fault' ? 'border-red-500' : 'border-slate-400'
              }`}
            />
            <span className={mode === 'fault' ? 'text-red-300 font-semibold' : 'text-slate-300'}>
              Traditional
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]"
            />
            <span className="font-semibold text-emerald-300">
              WAFAR AI
            </span>
          </div>
        </div>
      </div>

      {/* Live Inspected Value Strip */}
      {inspectedPoint && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/65 px-2.5 py-1 text-[11px]">
          <span className="font-mono-tech text-slate-400">
            {inspectedPoint.timeLabel}
          </span>
          <div className="flex items-center gap-2.5 font-mono-tech">
            <span className={mode === 'fault' ? 'text-red-400 font-bold' : 'text-slate-300'}>
              Trad: <strong>{inspectedPoint.traditionalKw}</strong> kW
            </span>
            <span className="text-emerald-300 font-bold">
              WAFAR: <strong>{inspectedPoint.wafarKw}</strong> kW
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
              -{Math.max(0, inspectedPoint.traditionalKw - inspectedPoint.wafarKw)} kW
            </span>
          </div>
        </div>
      )}

      {/* Responsive Custom SVG Area/Line Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[162px] w-full overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="wafarAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="deltaGapGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={mode === 'fault' ? '#EF4444' : '#10B981'}
                stopOpacity="0.16"
              />
              <stop
                offset="100%"
                stopColor={mode === 'fault' ? '#EF4444' : '#10B981'}
                stopOpacity="0.05"
              />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid Lines & kW Axis Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.13)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-500 font-mono-tech text-[9.5px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Shaded Savings / Waste Gap Between Curves */}
          {deltaPolygonPath && (
            <path d={deltaPolygonPath} fill="url(#deltaGapGrad)" />
          )}

          {/* Soft Area Fill Under Live Curve */}
          {areaPath && <path d={areaPath} fill="url(#wafarAreaGrad)" />}

          {/* Traditional Unoptimized Consumption Line (Red/Gray Dashed) */}
          {traditionalPath && (
            <path
              d={traditionalPath}
              fill="none"
              stroke={tradStroke}
              strokeOpacity="0.9"
              strokeWidth={mode === 'fault' ? '2.2' : '1.8'}
              strokeDasharray="5 4"
            />
          )}

          {/* WAFAR AI / Live Plant Consumption Line (Glowing Emerald / Dynamic) */}
          {wafarPath && (
            <path
              d={wafarPath}
              fill="none"
              stroke={activeStroke}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lineGlow)"
            />
          )}

          {/* Inspected / Latest Live Data Pulse Dot */}
          {inspectedPoint && (
            <g>
              <line
                x1={getX(inspectedIndex)}
                y1={padTop}
                x2={getX(inspectedIndex)}
                y2={padTop + plotH}
                stroke="rgba(255,255,255,0.16)"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(inspectedIndex)}
                cy={getY(inspectedPoint.traditionalKw)}
                r={mode === 'fault' ? '4.5' : '3.4'}
                fill={tradStroke}
              />
              <circle
                cx={getX(inspectedIndex)}
                cy={getY(inspectedPoint.wafarKw)}
                r="6.5"
                fill={activeStroke}
                fillOpacity="0.25"
              />
              <circle
                cx={getX(inspectedIndex)}
                cy={getY(inspectedPoint.wafarKw)}
                r="3.8"
                fill={activeStroke}
                stroke="#070D19"
                strokeWidth="1.4"
              />
            </g>
          )}

          {/* X-Axis Timestamps (Start, Mid, Live) */}
          {data.length > 2 && (
            <>
              <text
                x={padLeft}
                y={height - 5}
                textAnchor="start"
                className="fill-slate-500 font-mono-tech text-[9px]"
              >
                {data[0].timeLabel}
              </text>
              <text
                x={padLeft + plotW / 2}
                y={height - 5}
                textAnchor="middle"
                className="fill-slate-500 font-mono-tech text-[9px]"
              >
                {data[Math.floor(data.length / 2)].timeLabel}
              </text>
              <text
                x={width - padRight}
                y={height - 5}
                textAnchor="end"
                className="fill-emerald-400 font-mono-tech text-[9px] font-semibold"
              >
                LIVE • {data[data.length - 1].timeLabel}
              </text>
            </>
          )}

          {/* Invisible Interactive Hover Columns */}
          {data.map((_, i) => {
            const colW = plotW / Math.max(1, data.length);
            return (
              <rect
                key={i}
                x={getX(i) - colW / 2}
                y={padTop}
                width={colW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
