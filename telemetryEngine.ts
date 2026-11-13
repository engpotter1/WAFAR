import {
  AIRecommendation,
  ChartPoint,
  EquipmentId,
  EquipmentTelemetry,
  OperationMode,
  OptimizationStep,
} from '../types/factory';

export const BASELINE_TOTAL_KW = 1840;
export const BASELINE_CO2_KG_HR = 912;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function jitter(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

export function formatTimeLabel(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

export function generateInitialChartHistory(): ChartPoint[] {
  const now = Date.now();
  const points: ChartPoint[] = [];
  for (let i = 21; i >= 0; i--) {
    const t = new Date(now - i * 1000);
    const wave = Math.sin(i * 0.45) * 20;
    const trad = Math.round(BASELINE_TOTAL_KW + wave + jitter(10));
    const wafar = Math.round(BASELINE_TOTAL_KW * 0.74 + wave * 0.45 + jitter(6));
    points.push({
      timeLabel: formatTimeLabel(t),
      traditionalKw: trad,
      wafarKw: wafar,
      savedKw: Math.max(0, trad - wafar),
    });
  }
  return points;
}

export function buildOptimizationSteps(
  mode: OperationMode,
  progress: number
): OptimizationStep[] {
  const isOpt = mode === 'optimized';
  return [
    {
      id: 'reactor-temp',
      labelEn: 'Adjusting Reactor Temp -4.5°C',
      labelAr: 'خفض حرارة المفاعل -4.5°م مع ثبات التفاعل',
      done: isOpt && progress >= 0.28,
    },
    {
      id: 'phase-load',
      labelEn: 'Balancing Phase Load',
      labelAr: 'موازنة أحمال الفازات وتنظيم سرعة التبريد',
      done: isOpt && progress >= 0.62,
    },
    {
      id: 'fuel-air',
      labelEn: 'Optimizing Fuel-Air Ratio',
      labelAr: 'ضبط نسبة الوقود للهواء بالغلاية الحرارية',
      done: isOpt && progress >= 0.94,
    },
  ];
}

export function computeEquipmentTelemetry(
  mode: OperationMode,
  transitionProgress: number,
  fromMode: OperationMode
): Record<EquipmentId, EquipmentTelemetry> {
  // Determine effective blend factor if transitioning into 'optimized'
  const isTransitioningToOpt = mode === 'optimized' && transitionProgress < 1;

  // Source profile before transition (either fault or baseline)
  const startIsFault = fromMode === 'fault';

  // Helper to blend start -> optimized during 2-second AI sequence
  const blendMetric = (
    baseVal: number,
    faultVal: number,
    optVal: number,
    noiseAmp: number
  ) => {
    let raw = baseVal;
    if (mode === 'baseline') {
      raw = baseVal;
    } else if (mode === 'fault') {
      raw = faultVal;
    } else if (isTransitioningToOpt) {
      const origin = startIsFault ? faultVal : baseVal;
      raw = lerp(origin, optVal, transitionProgress);
    } else {
      raw = optVal;
    }
    return Number((raw + jitter(noiseAmp)).toFixed(1));
  };

  const reactorStatus =
    mode === 'fault'
      ? 'critical'
      : mode === 'optimized' && transitionProgress >= 0.65
      ? 'optimal'
      : 'normal';

  const boilerStatus =
    mode === 'fault'
      ? 'critical'
      : mode === 'optimized' && transitionProgress >= 0.65
      ? 'optimal'
      : 'warning';

  const coolingStatus =
    mode === 'fault'
      ? 'warning'
      : mode === 'optimized' && transitionProgress >= 0.65
      ? 'optimal'
      : 'normal';

  const stackStatus =
    mode === 'fault'
      ? 'critical'
      : mode === 'optimized' && transitionProgress >= 0.65
      ? 'optimal'
      : 'normal';

  return {
    reactor: {
      id: 'reactor',
      code: 'RX-101',
      nameEn: 'Chemical Reactor Tank',
      nameAr: 'المفاعل الكيميائي',
      roleEn: 'Exothermic Catalytic Polymerization Vessel',
      roleAr: 'وحدة التفاعل التحفيزي وضبط الضغط الحراري',
      temperature: blendMetric(168.5, 194.2, 164.0, 0.5),
      pressure: blendMetric(14.2, 18.6, 12.5, 0.15),
      powerDraw: Math.round(blendMetric(540, 748, 398, 5)),
      efficiency: blendMetric(76.4, 58.2, 95.8, 0.3),
      status: reactorStatus,
      statusLabelEn:
        reactorStatus === 'critical'
          ? 'Exothermic Overheat Surge'
          : reactorStatus === 'optimal'
          ? 'AI Setpoint Locked (-4.5°C)'
          : 'Standard Setpoint Control',
      statusLabelAr:
        reactorStatus === 'critical'
          ? 'ارتفاع حراري حرج وهدر بالبخار'
          : reactorStatus === 'optimal'
          ? 'نقطة تشغيل مثالية (-4.5°م)'
          : 'تشغيل تقليدي قياسي',
      aiNoteEn:
        mode === 'fault'
          ? 'Isolation Forest flagged +25.7°C jacket drift & excess steam throttling.'
          : mode === 'optimized'
          ? 'Random Forest trimmed core temp by -4.5°C & steam pressure -12% with 99.4% yield.'
          : 'Potential 142 kW savings available via predictive jacket valve modulation.',
      aiNoteAr:
        mode === 'fault'
          ? 'رصد انحراف حراري بقميص التبريد (+25.7°م) واستهلاك مفرط للبخار.'
          : mode === 'optimized'
          ? 'تم خفض الحرارة 4.5°م وضغط البخار 12% مع الحفاظ على نقاء التفاعل 99.4%.'
          : 'فرصة لتوفير 142 kW عند تفعيل التحكم التنبؤي بصمامات التبريد.',
      anomalyScore:
        mode === 'fault' ? 0.91 : mode === 'optimized' ? 0.04 : 0.24,
      position: [-4.2, 0, 1.9],
      cameraPos: [-0.2, 4.7, 7.6],
      cameraTarget: [-4.2, 2.2, 1.9],
    },

    boiler: {
      id: 'boiler',
      code: 'BL-204',
      nameEn: 'Industrial Thermal Boiler',
      nameAr: 'الغلاية الحرارية',
      roleEn: 'High-Pressure Steam & Natural Gas Furnace',
      roleAr: 'وحدة توليد البخار عالي الضغط والاحتراق الحراري',
      temperature: blendMetric(412.0, 489.5, 386.0, 1.4),
      pressure: blendMetric(28.4, 35.8, 25.0, 0.2),
      powerDraw: Math.round(blendMetric(720, 1015, 528, 7)),
      efficiency: blendMetric(71.8, 52.4, 94.1, 0.3),
      status: boilerStatus,
      statusLabelEn:
        boilerStatus === 'critical'
          ? 'Tube Fouling & Rich Fuel Surge'
          : boilerStatus === 'optimal'
          ? 'Stoichiometric Eco-Burn'
          : 'Unoptimized Excess Air (18%)',
      statusLabelAr:
        boilerStatus === 'critical'
          ? 'تكلس الأنابيب وهدر حاد بالوقود'
          : boilerStatus === 'optimal'
          ? 'احتراق مثالي متزن للوقود والهواء'
          : 'هواء زائد غير مُحسّن (18%)',
      aiNoteEn:
        mode === 'fault'
          ? 'Heat-exchanger scale buildup detected! Flue gas heat loss surging +41%.'
          : mode === 'optimized'
          ? 'O₂ trim & fuel-air ratio dynamically locked at λ=1.06; saving 192 kW eq.'
          : 'Manual damper setting wastes flue heat; WAFAR AI can cut gas burn by 19%.',
      aiNoteAr:
        mode === 'fault'
          ? 'اكتشاف تكلس بالمبادل الحراري! ارتفاع فاقد الحرارة في العادم بنسبة 41%.'
          : mode === 'optimized'
          ? 'ضبط تلقائي لنسبة الوقود للهواء (λ=1.06) وتوفير ما يعادل 192 kW.'
          : 'الضبط اليدوي لبوابة الهواء يهدر حرارة العادم؛ وفّر يمكنه خفض الغاز 19%.',
      anomalyScore:
        mode === 'fault' ? 0.96 : mode === 'optimized' ? 0.06 : 0.32,
      position: [-3.9, 0, -2.7],
      cameraPos: [0.8, 4.3, 2.0],
      cameraTarget: [-3.9, 1.8, -2.7],
    },

    cooling: {
      id: 'cooling',
      code: 'CT-308',
      nameEn: 'Cooling Tower & Power Grid',
      nameAr: 'وحدة التبريد والطاقة',
      roleEn: 'HV Transformer Hub & Twin VFD Induced-Draft Fans',
      roleAr: 'محطة المحولات الكهربائية وأبراج التبريد الميكانيكية',
      temperature: blendMetric(31.4, 43.8, 27.2, 0.25),
      pressure: blendMetric(4.6, 6.2, 4.1, 0.08),
      powerDraw: Math.round(blendMetric(465, 632, 348, 4)),
      efficiency: blendMetric(75.5, 59.0, 94.8, 0.3),
      status: coolingStatus,
      statusLabelEn:
        coolingStatus === 'warning'
          ? 'Phase Imbalance & Erratic RPM'
          : coolingStatus === 'optimal'
          ? 'VFD Harmonic & Phase Balanced'
          : 'Fixed-Speed Fan Operation',
      statusLabelAr:
        coolingStatus === 'warning'
          ? 'عدم اتزان الفازات واضطراب المراوح'
          : coolingStatus === 'optimal'
          ? 'اتزان كامل للفازات وتحكم ذكي بالسرعة'
          : 'تشغيل مراوح بسرعة ثابتة غير مرشدة',
      aiNoteEn:
        mode === 'fault'
          ? 'Transformer Phase-B overload (+29%) causing erratic cooling fan cavitation.'
          : mode === 'optimized'
          ? 'Active VFD fan modulation + reactive power factor raised to 0.98 PF.'
          : 'Cooling fans running at 100% fixed duty despite moderate wet-bulb temp.',
      aiNoteAr:
        mode === 'fault'
          ? 'حمل زائد على الفازة B (+29%) يسبب تذبذب مراوح التبريد وارتفاع الفقد.'
          : mode === 'optimized'
          ? 'تنظيم ذكي لسرعة المراوح ورفع معامل القدرة الكهربائية إلى 0.98.'
          : 'المراوح تعمل بأقصى سرعة ثابتة رغم اعتدال الحرارة الرطبة للجو.',
      anomalyScore:
        mode === 'fault' ? 0.84 : mode === 'optimized' ? 0.03 : 0.19,
      position: [3.8, 0, 2.0],
      cameraPos: [8.6, 4.8, 7.2],
      cameraTarget: [3.8, 1.9, 2.0],
    },

    smokestack: {
      id: 'smokestack',
      code: 'EX-402',
      nameEn: 'Exhaust Smokestack (CEMS)',
      nameAr: 'مدخنة الانبعاثات',
      roleEn: 'Continuous Emissions Monitoring & Wet Scrubber Stack',
      roleAr: 'مدخنة الرصد اللحظي للانبعاثات والفلاتر البيئية',
      temperature: blendMetric(148.0, 226.4, 112.5, 0.9),
      pressure: blendMetric(1.18, 1.64, 1.05, 0.02),
      powerDraw: Math.round(blendMetric(115, 144, 88, 2)),
      efficiency: blendMetric(73.2, 57.6, 93.9, 0.3),
      status: stackStatus,
      statusLabelEn:
        stackStatus === 'critical'
          ? 'High Opacity Carbon Plume'
          : stackStatus === 'optimal'
          ? 'Clean Low-Carbon Vapor (<15 ppm)'
          : 'Moderate Flue Gas Emissions',
      statusLabelAr:
        stackStatus === 'critical'
          ? 'انبعاثات كربونية كثيفة وتجاوز الحدود'
          : stackStatus === 'optimal'
          ? 'بخار نقي منخفض الكربون (مطابق بيئياً)'
          : 'انبعاثات غازية متوسطة الكثافة',
      aiNoteEn:
        mode === 'fault'
          ? 'Incomplete boiler combustion triggering heavy particulate & CO₂ spike.'
          : mode === 'optimized'
          ? 'Flue gas heat recovery active; CO₂ emissions cut by 267 kg/hr vs baseline.'
          : 'Flue stack venting recoverable latent heat at 148°C without economizer trim.',
      aiNoteAr:
        mode === 'fault'
          ? 'احتراق غير مكتمل يرفع كثافة الدخان الأسود وانبعاثات الكربون بشدة.'
          : mode === 'optimized'
          ? 'استرجاع حرارة العادم مفعل؛ خفض انبعاثات الكربون بمقدار 267 كجم/ساعة.'
          : 'المدخنة تفقد حرارة كامنة قابلة للاسترجاع عند 148°م بدون تحسين المبادل.',
      anomalyScore:
        mode === 'fault' ? 0.94 : mode === 'optimized' ? 0.05 : 0.27,
      position: [3.6, 0, -2.8],
      cameraPos: [9.0, 6.6, 3.2],
      cameraTarget: [3.6, 4.0, -2.8],
    },
  };
}

export function getRecommendationsForMode(
  mode: OperationMode,
  selectedEquipment: EquipmentId | null
): AIRecommendation[] {
  const baseRecs: Record<OperationMode, AIRecommendation[]> = {
    optimized: [
      {
        id: 'rec-steam-opt',
        modelBadge: 'Random Forest Regressor • Active Control',
        confidence: 98.6,
        severity: 'eco',
        titleEn:
          'Immediate Action Executed: Steam pressure reduced by 12% saving 420 kW with zero reaction quality loss.',
        titleAr:
          'توصية فورية مُنفذة: تقليل ضغط البخار بنسبة 12% لتوفير 420 kW بدون التأثير على جودة التفاعل الكيميائي.',
        detailEn:
          'Closed-loop PID + ML setpoint maintains RX-101 selectivity at 99.4% while trimming boiler fuel gas.',
        detailAr:
          'نموذج الغابات العشوائية يحافظ على كفاءة التفاعل 99.4% مع تقليص استهلاك الغاز الطبيعي والكهرباء.',
        impactKw: 420,
      },
      {
        id: 'rec-vfd-opt',
        modelBadge: 'Isolation Forest + VFD Optimizer',
        confidence: 97.2,
        severity: 'eco',
        titleEn:
          'Phase Load Balanced & Cooling VFD Modulated (-58 kW auxiliary draw).',
        titleAr:
          'موازنة أحمال المحول الكهربائي وتخفيض سرعة مراوح التبريد لتوفير 58 kW إضافية.',
        detailEn:
          'Transformer harmonic distortion suppressed below 1.8% THD; carbon intensity at 24-hour minimum.',
        detailAr:
          'رفع معامل القدرة إلى 0.98 وخفض البصمة الكربونية للمصنع إلى أدنى مستوى يومي.',
        impactKw: 58,
      },
    ],
    fault: [
      {
        id: 'rec-fault-boiler',
        modelBadge: 'Isolation Forest • ANOMALY SCORE 0.96',
        confidence: 99.1,
        severity: 'critical',
        titleEn:
          'URGENT: Thermal Boiler tube fouling & peak power surge (+38% waste). Activate WAFAR AI to auto-stabilize!',
        titleAr:
          'تنبيه عاجل: تكلس أنابيب الغلاية الحرارية وقفزة هدر طاقة (+38%)! فعّل الذكاء الاصطناعي "وفّر" للإصلاح الفوري.',
        detailEn:
          'Unburned fuel causing dense carbon plume in EX-402 and Phase-B transformer overload in CT-308.',
        detailAr:
          'احتراق غير مكتمل يسبب دخاناً كثيفاً بالمدخنة وحملاً زائداً على المحول الكهربائي ونزيفاً مالياً لحظياً.',
        impactKw: 1177,
      },
      {
        id: 'rec-fault-steam',
        modelBadge: 'Random Forest Recovery Plan',
        confidence: 96.8,
        severity: 'warning',
        titleEn:
          'Ready Action: Cut steam header pressure 12% & trim Reactor Temp -4.5°C to recover 420+ kW immediately.',
        titleAr:
          'توصية فورية جاهزة: تقليل ضغط البخار بنسبة 12% وخفض حرارة المفاعل 4.5°م لاستعادة استقرار الشبكة فوراً.',
        detailEn:
          'Estimated transition time to eco-equilibrium: ~2.0 seconds via automated PLC setpoint dispatch.',
        detailAr:
          'زمن الاستجابة المتوقع للوصول للتوازن البيئي الأخضر: ثانيتان عبر التحكم الآلي المباشر.',
        impactKw: 420,
      },
    ],
    baseline: [
      {
        id: 'rec-base-steam',
        modelBadge: 'Random Forest + Isolation Forest ML',
        confidence: 96.4,
        severity: 'warning',
        titleEn:
          'Immediate Recommendation: Reduce steam pressure by 12% to save 420 kW without affecting chemical reaction quality.',
        titleAr:
          'توصية فورية: تقليل ضغط البخار بنسبة 12% لتوفير 420 kW بدون التأثير على جودة التفاعل الكيميائي.',
        detailEn:
          'Plant currently operates on static manual setpoints (74% efficiency). Activate WAFAR AI to unlock -26% energy cut.',
        detailAr:
          'المصنع يعمل حالياً بالإعدادات التقليدية الثابتة (كفاءة 74%). تفعيل "وفّر" يحقق وفراً فورياً بنسبة 26%.',
        impactKw: 420,
      },
      {
        id: 'rec-base-cooling',
        modelBadge: 'Predictive Load Forecaster',
        confidence: 94.1,
        severity: 'eco',
        titleEn:
          'Auxiliary Opportunity: Enable VFD fan curve on CT-308 to save an extra 58 kW during current ambient conditions.',
        titleAr:
          'فرصة ترشيد إضافية: تفعيل مغير السرعة (VFD) بمراوح برج التبريد لتوفير 58 kW إضافية.',
        detailEn:
          'Projected combined annual impact: 14.85 Million EGP/year & 2,140 Tons CO₂ avoided.',
        detailAr:
          'الأثر السنوي المجمع المتوقع: وفر 14.85 مليون جنيه سنوياً ومنع انبعاث 2,140 طن كربون.',
        impactKw: 58,
      },
    ],
  };

  const list = [...baseRecs[mode]];

  // If user selected a specific unit, surface a unit-focused ML diagnostic badge gently at top if relevant
  if (selectedEquipment === 'cooling' && mode !== 'fault') {
    return list.reverse();
  }
  return list;
}
