import React from 'react';
import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { KRD_ACTIONS, computeKRDStep } from '../utils/krdEngine';
import { InteractionMode } from '../types/krd';

interface InteractiveWheelStageProps {
  currentSifir: number | null;
  activeMultiplier: number | null;
  mode: InteractionMode;
  revealedSectors: Record<number, string>;
  sectorStatuses: Record<number, 'correct' | 'assisted' | 'pending'>;
  showSaCycleHighlight: boolean;
  onSelectSifir: (sifir: number) => void;
  onSelectMultiplier: (multiplier: number) => void;
}

function createArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const rad1 = (startAngleDeg * Math.PI) / 180;
  const rad2 = (endAngleDeg * Math.PI) / 180;
  const x1Outer = cx + Math.cos(rad1) * outerRadius;
  const y1Outer = cy + Math.sin(rad1) * outerRadius;
  const x2Outer = cx + Math.cos(rad2) * outerRadius;
  const y2Outer = cy + Math.sin(rad2) * outerRadius;
  const x2Inner = cx + Math.cos(rad2) * innerRadius;
  const y2Inner = cy + Math.sin(rad2) * innerRadius;
  const x1Inner = cx + Math.cos(rad1) * innerRadius;
  const y1Inner = cy + Math.sin(rad1) * innerRadius;

  return `M ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer} L ${x2Inner} ${y2Inner} A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner} Z`;
}

export const InteractiveWheelStage: React.FC<InteractiveWheelStageProps> = ({
  currentSifir,
  activeMultiplier,
  mode,
  revealedSectors,
  sectorStatuses,
  showSaCycleHighlight,
  onSelectSifir,
  onSelectMultiplier,
}) => {
  const stepAnalysis =
    currentSifir && activeMultiplier
      ? computeKRDStep(currentSifir, activeMultiplier)
      : null;

  const activeCycleSet = new Set(stepAnalysis?.saCycleSteps || []);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 1. Garis Nombor Ajaib (Magic Number Line) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              01. Garis Nombor Ajaib (Kunci Digit Sa)
            </h2>
            <p className="text-xs text-slate-500">
              {currentSifir
                ? `Sifir ${currentSifir} aktif · Kunci gerakan Sa ialah ${KRD_ACTIONS[currentSifir].display} (${KRD_ACTIONS[currentSifir].description})`
                : 'Klik mana-mana nombor sifir di bawah untuk melihat kunci gerakan digit Sa'}
            </p>
          </div>
          {currentSifir && (
            <span className="text-xs font-mono font-semibold text-indigo-700 tabular-nums">
              Kunci Sifir {currentSifir}: {KRD_ACTIONS[currentSifir].display}
            </span>
          )}
        </div>

        <div className="grid grid-cols-9 gap-1.5 sm:gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const rule = KRD_ACTIONS[num];
            const isSelected = currentSifir === num;
            const isPlus = rule.type === 'plus';
            const isMinus = rule.type === 'minus';

            return (
              <button
                key={num}
                onClick={() => onSelectSifir(num)}
                title={`Pilih Sifir ${num} (${rule.display})`}
                className={`group flex flex-col items-center justify-center rounded-xl py-2.5 px-1 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md -translate-y-0.5'
                    : 'bg-slate-50/80 border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <span className="text-base sm:text-lg font-bold font-display leading-none tabular-nums">
                  {num}
                </span>
                <span
                  className={`mt-1 text-[11px] sm:text-xs font-mono font-bold tabular-nums ${
                    isSelected
                      ? 'text-indigo-100'
                      : isPlus
                        ? 'text-emerald-600'
                        : isMinus
                          ? 'text-amber-600'
                          : 'text-indigo-600'
                  }`}
                >
                  {rule.display}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Interactive SVG Wheel Canvas */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex-grow flex flex-col items-center justify-center relative">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              02. Roda Darab Interaktif 10-Sektor
            </h2>
            <p className="text-xs text-slate-500">
              {currentSifir
                ? 'Tekan mana-mana sektor (1 hingga 10) pada roda untuk mengira langkah demi langkah'
                : 'Sila pilih Sifir 1–9 terlebih dahulu untuk mengaktifkan Roda Darab'}
            </p>
          </div>
          {currentSifir && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Sifir {currentSifir}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {Object.keys(revealedSectors).length}/10 Sektor Selesai
              </span>
            </div>
          )}
        </div>

        <div className="w-full max-w-[400px] aspect-square flex items-center justify-center my-auto">
          {!currentSifir ? (
            <div className="w-full h-full rounded-full border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-8 h-8 text-indigo-500 mb-3" />
              <p className="text-base font-bold text-slate-800">
                Pilih Sifir 1 hingga 9
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                Tekan nombor pada Garis Nombor Ajaib di atas atau panel sebelah kanan untuk memulakan Roda Darab.
              </p>
            </div>
          ) : (
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full select-none drop-shadow-xs"
              role="img"
              aria-label={`Roda Darab Sifir ${currentSifir}`}
            >
              {/* Outer subtle ring guide */}
              <circle
                cx="200"
                cy="200"
                r="182"
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth="2"
              />

              {/* 10 Wheel Sectors */}
              {Array.from({ length: 10 }, (_, idx) => {
                const multiplier = idx + 1;
                const startAngle = idx * 36 - 90;
                const endAngle = startAngle + 36;
                const midRad = ((startAngle + 18) * Math.PI) / 180;

                const isSelected = activeMultiplier === multiplier;
                const revealedVal = revealedSectors[multiplier];
                const status = sectorStatuses[multiplier];

                let sectorFill = '#ffffff';
                let sectorStroke = '#e2e8f0';
                let strokeWidth = 2;

                if (isSelected) {
                  sectorFill = '#eef2ff';
                  sectorStroke = '#4f46e5';
                  strokeWidth = 3.5;
                } else if (revealedVal !== undefined) {
                  if (status === 'correct') {
                    sectorFill = '#ecfdf5';
                    sectorStroke = '#a7f3d0';
                  } else if (status === 'assisted') {
                    sectorFill = '#fffbeb';
                    sectorStroke = '#fde68a';
                  } else {
                    sectorFill = '#f8fafc';
                    sectorStroke = '#cbd5e1';
                  }
                }

                const innerLabelX = 200 + Math.cos(midRad) * 68;
                const innerLabelY = 200 + Math.sin(midRad) * 68;
                const outerAnsX = 200 + Math.cos(midRad) * 134;
                const outerAnsY = 200 + Math.sin(midRad) * 134;

                return (
                  <g
                    key={multiplier}
                    onClick={() => onSelectMultiplier(multiplier)}
                    className="cursor-pointer transition-opacity hover:opacity-95"
                  >
                    {/* Inner Multiplier Ring Sector (45 -> 92) */}
                    <path
                      d={createArcPath(200, 200, 46, 92, startAngle, endAngle)}
                      fill={isSelected ? '#4f46e5' : '#f1f5f9'}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    {/* Outer Answer Ring Sector (92 -> 176) */}
                    <path
                      d={createArcPath(200, 200, 92, 176, startAngle, endAngle)}
                      fill={sectorFill}
                      stroke={sectorStroke}
                      strokeWidth={strokeWidth}
                    />
                    {/* Multiplier Number (1..10) */}
                    <text
                      x={innerLabelX}
                      y={innerLabelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isSelected ? '#ffffff' : '#1e293b'}
                      fontSize="16"
                      fontWeight="700"
                      fontFamily="Outfit, sans-serif"
                    >
                      {multiplier}
                    </text>
                    {/* Answer Text in Outer Sector */}
                    <text
                      x={outerAnsX}
                      y={outerAnsY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={
                        revealedVal !== undefined
                          ? status === 'correct'
                            ? '#065f46'
                            : '#1e1b4b'
                          : isSelected
                            ? '#4f46e5'
                            : '#cbd5e1'
                      }
                      fontSize={revealedVal !== undefined ? '22' : '18'}
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {revealedVal !== undefined
                        ? revealedVal
                        : isSelected
                          ? mode === 'speed'
                            ? '__'
                            : '??'
                          : '·'}
                    </text>
                  </g>
                );
              })}

              {/* Center Hub */}
              <circle
                cx="200"
                cy="200"
                r="46"
                fill="#312e81"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <text
                x="200"
                y="200"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="26"
                fontWeight="800"
                fontFamily="Outfit, sans-serif"
              >
                {currentSifir}×
              </text>
            </svg>
          )}
        </div>
      </section>

      {/* 3. Visualisasi Kitaran Digit Sa (0–9) & Peraturan Puluh */}
      {currentSifir && (
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                03. Gelung Kitaran Digit Sa (0–9) & Corak Perubahan
              </h3>
              <p className="text-xs text-slate-500">
                {stepAnalysis && showSaCycleHighlight
                  ? `Daripada ${currentSifir} × ${stepAnalysis.prevMultiplier} (${String(stepAnalysis.prevResult).padStart(2, '0')}) ke ${currentSifir} × ${stepAnalysis.multiplier}: gerakan ${stepAnalysis.action.display} daripada Sa Lama (${stepAnalysis.prevSa})`
                  : 'Pilih sektor roda untuk melihat pergerakan digit Sa pada gelung 0 hingga 9'}
              </p>
            </div>
            {stepAnalysis && showSaCycleHighlight && (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {stepAnalysis.isSaDecreasing ? (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Sa Menurun ({stepAnalysis.prevSa} → {stepAnalysis.currSa}) · +1 Puluh</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Sa Menaik ({stepAnalysis.prevSa} → {stepAnalysis.currSa}) · Puluh Kekal</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
              const isStart =
                stepAnalysis && showSaCycleHighlight && stepAnalysis.prevSa === digit;
              const isEnd =
                stepAnalysis && showSaCycleHighlight && stepAnalysis.currSa === digit;
              const isInPath =
                stepAnalysis && showSaCycleHighlight && activeCycleSet.has(digit);

              return (
                <div
                  key={digit}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border text-center transition-all tabular-nums ${
                    isEnd
                      ? 'bg-amber-500 border-amber-600 text-white font-bold shadow-xs scale-105'
                      : isStart
                        ? 'bg-slate-800 border-slate-900 text-white font-bold'
                        : isInPath
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-sm sm:text-base font-mono font-bold leading-none">
                    {digit}
                  </span>
                  <span className="text-[9px] mt-1 font-medium leading-none">
                    {isEnd ? 'Sa Baru' : isStart ? 'Sa Lama' : isInPath ? '•' : '\u00A0'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
